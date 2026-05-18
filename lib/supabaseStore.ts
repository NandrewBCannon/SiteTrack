"use client";

import { supabase } from "@/lib/supabase";
import type { Asset, AssetLog, AssetPhoto, Building, Room, Site, StoreData } from "@/lib/types";

const activeWorkspaceKey = "sitetrack-active-workspace-id";

export type WorkspaceSummary = {
  id: string;
  name: string;
  role?: string;
  join_code?: string;
};

export type SupabaseStoreResult = {
  data: StoreData;
  workspace: WorkspaceSummary | null;
  workspaces: WorkspaceSummary[];
};

const emptyStore: StoreData = {
  sites: [],
  buildings: [],
  rooms: [],
  assets: [],
  asset_photos: [],
  asset_logs: []
};

export function getActiveWorkspaceId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(activeWorkspaceKey) ?? "";
}

export function setActiveWorkspaceId(workspaceId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(activeWorkspaceKey, workspaceId);
}

export function clearActiveWorkspaceId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(activeWorkspaceKey);
}

export async function loadSupabaseStore(): Promise<SupabaseStoreResult> {
  if (!supabase) return { data: emptyStore, workspace: null, workspaces: [] };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) return { data: emptyStore, workspace: null, workspaces: [] };

  const { data: memberships, error: memberError } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (memberError) throw memberError;

  const workspaces = (memberships ?? [])
    .map((membership: any) => {
      const workspace = Array.isArray(membership.workspaces) ? membership.workspaces[0] : membership.workspaces;
      return workspace ? { id: workspace.id, name: workspace.name, role: membership.role } : null;
    })
    .filter(Boolean) as WorkspaceSummary[];

  const storedWorkspaceId = getActiveWorkspaceId();
  const workspace = workspaces.find((item) => item.id === storedWorkspaceId) ?? workspaces[0] ?? null;
  if (!workspace) {
    clearActiveWorkspaceId();
    return { data: emptyStore, workspace: null, workspaces };
  }
  setActiveWorkspaceId(workspace.id);

  const isAdmin = workspace.role === "admin";
  const { data: userSiteMemberships, error: userSiteMembershipError } = await supabase
    .from("site_members")
    .select("site_id")
    .eq("user_id", userId);
  if (userSiteMembershipError) throw userSiteMembershipError;

  const assignedSiteIds = Array.from(new Set((userSiteMemberships ?? []).map((membership: any) => membership.site_id).filter(Boolean)));

  const sitesQuery = supabase.from("sites").select("*").order("created_at", { ascending: false });
  const scopedSitesQuery = isAdmin
    ? sitesQuery.eq("workspace_id", workspace.id)
    : assignedSiteIds.length
      ? sitesQuery.in("id", assignedSiteIds)
      : null;

  const [sitesResult, buildingsResult, roomsResult, assetsResult] = await Promise.all([
    scopedSitesQuery ?? Promise.resolve({ data: [], error: null }),
    supabase.from("buildings").select("*").order("created_at", { ascending: false }),
    supabase.from("rooms").select("*").order("created_at", { ascending: false }),
    isAdmin
      ? supabase.from("assets").select("*").eq("workspace_id", workspace.id).order("updated_at", { ascending: false })
      : assignedSiteIds.length
        ? supabase.from("assets").select("*").in("site_id", assignedSiteIds).order("updated_at", { ascending: false })
      : Promise.resolve({ data: [], error: null })
  ]);

  const error = sitesResult.error || buildingsResult.error || roomsResult.error || assetsResult.error;
  if (error) throw error;

  const sites = (sitesResult.data ?? []).map(mapSite);
  const siteIds = new Set(sites.map((site) => site.id));
  const buildings = (buildingsResult.data ?? []).map(mapBuilding).filter((building) => siteIds.has(building.site_id));
  const buildingIds = new Set(buildings.map((building) => building.id));
  const rooms = (roomsResult.data ?? []).map(mapRoom).filter((room) => buildingIds.has(room.building_id));
  const assets = (assetsResult.data ?? []).map(mapAsset);
  const assetIds = new Set(assets.map((asset) => asset.id));
  const assetIdList = Array.from(assetIds);

  const [photosResult, logsResult] = await Promise.all([
    isAdmin
      ? supabase.from("asset_photos").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false })
      : assetIds.size
        ? supabase.from("asset_photos").select("*").in("asset_id", assetIdList).order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    isAdmin
      ? supabase.from("asset_logs").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false })
      : assetIds.size
        ? supabase.from("asset_logs").select("*").in("asset_id", assetIdList).order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null })
  ]);

  const relatedError = photosResult.error || logsResult.error;
  if (relatedError) throw relatedError;

  return {
    data: {
      sites,
      buildings,
      rooms,
      assets,
      asset_photos: (photosResult.data ?? []).map(mapPhoto).filter((photo) => assetIds.has(photo.asset_id)),
      asset_logs: (logsResult.data ?? []).map(mapLog).filter((log) => assetIds.has(log.asset_id))
    },
    workspace,
    workspaces
  };
}

export async function saveSupabaseStore(data: StoreData, workspaceId = getActiveWorkspaceId()) {
  const existing = await loadSupabaseStore();
  const targetWorkspaceId = workspaceId || existing.workspace?.id;
  if (!supabase) return;
  if (!targetWorkspaceId) throw new Error("No active workspace found. Create or select a workspace before saving.");

  const existingData = existing.data;

  await deleteMissing("asset_logs", existingData.asset_logs.map((item) => item.id), data.asset_logs.map((item) => item.id));
  await deleteMissing("asset_photos", existingData.asset_photos.map((item) => item.id), data.asset_photos.map((item) => item.id));
  await deleteMissing("assets", existingData.assets.map((item) => item.id), data.assets.map((item) => item.id));
  await deleteMissing("rooms", existingData.rooms.map((item) => item.id), data.rooms.map((item) => item.id));
  await deleteMissing("buildings", existingData.buildings.map((item) => item.id), data.buildings.map((item) => item.id));
  await deleteMissing("sites", existingData.sites.map((item) => item.id), data.sites.map((item) => item.id));

  if (data.sites.length) await throwOnError(supabase.from("sites").upsert(data.sites.map((site) => toSiteRow(site, targetWorkspaceId))));
  if (data.buildings.length) await throwOnError(supabase.from("buildings").upsert(data.buildings.map(toBuildingRow)));
  if (data.rooms.length) await throwOnError(supabase.from("rooms").upsert(data.rooms.map(toRoomRow)));
  if (data.assets.length) await throwOnError(supabase.from("assets").upsert(data.assets.map((asset) => toAssetRow(asset, targetWorkspaceId))));
  if (data.asset_photos.length) await throwOnError(supabase.from("asset_photos").upsert(data.asset_photos.map(toPhotoRow)));
  if (data.asset_logs.length) await throwOnError(supabase.from("asset_logs").upsert(data.asset_logs.map(toLogRow)));
}

async function deleteMissing(table: string, previousIds: string[], nextIds: string[]) {
  if (!supabase) return;
  const next = new Set(nextIds);
  const removed = previousIds.filter((id) => !next.has(id));
  if (!removed.length) return;
  await throwOnError(supabase.from(table).delete().in("id", removed));
}

async function throwOnError(resultPromise: PromiseLike<{ error: any }>) {
  const result = await resultPromise;
  if (result.error) throw result.error;
}

function mapSite(row: any): Site {
  return {
    id: row.id,
    name: row.name ?? "",
    address: row.address ?? "",
    client_name: row.client_name ?? "",
    job_number: row.job_number ?? "",
    created_at: row.created_at ?? ""
  };
}

function mapBuilding(row: any): Building {
  return {
    id: row.id,
    site_id: row.site_id,
    name: row.name ?? "",
    created_at: row.created_at ?? ""
  };
}

function mapRoom(row: any): Room {
  return {
    id: row.id,
    building_id: row.building_id,
    room_number: row.room_number ?? "",
    room_name: row.room_name ?? "",
    floor: row.floor ?? "",
    created_at: row.created_at ?? ""
  };
}

function mapAsset(row: any): Asset {
  return {
    id: row.id,
    asset_number: row.asset_number ?? "",
    serial_number: row.serial_number ?? "",
    item_name: row.item_name ?? "",
    item_type: row.item_type ?? "",
    brand: row.brand ?? "",
    model: row.model ?? "",
    mac_address: row.mac_address ?? "",
    ip_address: row.ip_address ?? "",
    switch_port: row.switch_port ?? "",
    network_patch_number: row.network_patch_number ?? "",
    site_id: row.site_id ?? "",
    building_id: row.building_id ?? "",
    room_id: row.room_id ?? "",
    location_in_room: row.location_in_room ?? "",
    patching_details: row.patching_details ?? "",
    status: row.status ?? "installed",
    notes: row.notes ?? "",
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? ""
  };
}

function mapPhoto(row: any): AssetPhoto {
  return {
    id: row.id,
    asset_id: row.asset_id,
    photo_url: row.photo_url ?? "",
    caption: row.caption ?? "",
    created_at: row.created_at ?? ""
  };
}

function mapLog(row: any): AssetLog {
  return {
    id: row.id,
    asset_id: row.asset_id,
    action_type: row.action_type,
    previous_location: row.previous_location ?? "",
    new_location: row.new_location ?? "",
    notes: row.notes ?? "",
    user_name: row.user_name ?? "",
    created_at: row.created_at ?? ""
  };
}

function toSiteRow(site: Site, workspaceId: string) {
  return { ...site, workspace_id: workspaceId };
}

function toBuildingRow(building: Building) {
  return building;
}

function toRoomRow(room: Room) {
  return room;
}

function toAssetRow(asset: Asset, workspaceId: string) {
  return { ...asset, workspace_id: workspaceId };
}

function toPhotoRow(photo: AssetPhoto) {
  return photo;
}

function toLogRow(log: AssetLog) {
  return log;
}
