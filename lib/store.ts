"use client";

import { seedData } from "@/lib/seed";
import type { Asset, AssetLog, AssetPhoto, AssetStatus, AssetView, Building, Room, Site, StoreData } from "@/lib/types";

const storageKey = "job-site-asset-tracker";

export function loadStore(): StoreData {
  if (typeof window === "undefined") return seedData;
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) {
    window.localStorage.setItem(storageKey, JSON.stringify(seedData));
    return seedData;
  }
  return JSON.parse(stored) as StoreData;
}

export function saveStore(data: StoreData) {
  window.localStorage.setItem(storageKey, JSON.stringify(data));
}

export function resetStore() {
  saveStore(seedData);
}

export function uid(prefix: string) {
  void prefix;
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function getAssetViews(data: StoreData): AssetView[] {
  return data.assets.map((asset) => assetToView(asset, data));
}

export function assetToView(asset: Asset, data: StoreData): AssetView {
  return {
    ...asset,
    site: data.sites.find((site) => site.id === asset.site_id),
    building: data.buildings.find((building) => building.id === asset.building_id),
    room: data.rooms.find((room) => room.id === asset.room_id),
    photos: data.asset_photos.filter((photo) => photo.asset_id === asset.id),
    logs: data.asset_logs.filter((log) => log.asset_id === asset.id).sort((a, b) => b.created_at.localeCompare(a.created_at))
  };
}

export function locationLabel(asset: AssetView | Asset, data?: StoreData) {
  const view = "site" in asset ? asset : data ? assetToView(asset, data) : undefined;
  if (!view) return asset.location_in_room;
  return [view.building?.name, view.room?.room_number, view.location_in_room].filter(Boolean).join(" / ");
}

export function searchAssets(data: StoreData, query: string) {
  const term = query.trim().toLowerCase();
  const views = getAssetViews(data);
  if (!term) return views;
  return views.filter((asset) =>
    [
      asset.asset_number,
      asset.serial_number,
      asset.item_name,
      asset.item_type,
      asset.brand,
      asset.model,
      asset.mac_address,
      asset.ip_address,
      asset.switch_port,
      asset.network_patch_number,
      asset.patching_details,
      asset.status,
      asset.site?.name,
      asset.building?.name,
      asset.room?.room_number,
      asset.room?.room_name,
      asset.location_in_room
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(term))
  );
}

export function statusLabel(status: AssetStatus) {
  return status === "damaged" ? "Faulty/Damaged" : status.charAt(0).toUpperCase() + status.slice(1);
}

export function statusClass(status: AssetStatus) {
  const classes: Record<AssetStatus, string> = {
    installed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    removed: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    replaced: "bg-blue-50 text-blue-700 ring-blue-200",
    moved: "bg-amber-50 text-amber-700 ring-amber-200",
    damaged: "bg-rose-50 text-rose-700 ring-rose-200"
  };
  return classes[status];
}

export function createSite(data: StoreData, site: Omit<Site, "id" | "created_at">): StoreData {
  return { ...data, sites: [{ ...site, id: uid("site"), created_at: nowIso() }, ...data.sites] };
}

export function createBuilding(data: StoreData, building: Omit<Building, "id" | "created_at">): StoreData {
  return { ...data, buildings: [{ ...building, id: uid("building"), created_at: nowIso() }, ...data.buildings] };
}

export function createRoom(data: StoreData, room: Omit<Room, "id" | "created_at">): StoreData {
  return { ...data, rooms: [{ ...room, id: uid("room"), created_at: nowIso() }, ...data.rooms] };
}

export function updateSite(data: StoreData, id: string, updates: Partial<Omit<Site, "id" | "created_at">>): StoreData {
  return {
    ...data,
    sites: data.sites.map((site) => (site.id === id ? { ...site, ...updates } : site))
  };
}

export function updateBuilding(data: StoreData, id: string, updates: Partial<Omit<Building, "id" | "site_id" | "created_at">>): StoreData {
  return {
    ...data,
    buildings: data.buildings.map((building) => (building.id === id ? { ...building, ...updates } : building))
  };
}

export function updateRoom(data: StoreData, id: string, updates: Partial<Omit<Room, "id" | "building_id" | "created_at">>): StoreData {
  return {
    ...data,
    rooms: data.rooms.map((room) => (room.id === id ? { ...room, ...updates } : room))
  };
}

export function deleteSite(data: StoreData, siteId: string): StoreData {
  const buildingIds = data.buildings.filter((building) => building.site_id === siteId).map((building) => building.id);
  const roomIds = data.rooms.filter((room) => buildingIds.includes(room.building_id)).map((room) => room.id);
  const assetIds = data.assets.filter((asset) => asset.site_id === siteId || buildingIds.includes(asset.building_id) || roomIds.includes(asset.room_id)).map((asset) => asset.id);

  return {
    sites: data.sites.filter((site) => site.id !== siteId),
    buildings: data.buildings.filter((building) => building.site_id !== siteId),
    rooms: data.rooms.filter((room) => !buildingIds.includes(room.building_id)),
    assets: data.assets.filter((asset) => !assetIds.includes(asset.id)),
    asset_photos: data.asset_photos.filter((photo) => !assetIds.includes(photo.asset_id)),
    asset_logs: data.asset_logs.filter((log) => !assetIds.includes(log.asset_id))
  };
}

export function deleteBuilding(data: StoreData, buildingId: string): StoreData {
  const roomIds = data.rooms.filter((room) => room.building_id === buildingId).map((room) => room.id);
  const assetIds = data.assets.filter((asset) => asset.building_id === buildingId || roomIds.includes(asset.room_id)).map((asset) => asset.id);

  return {
    ...data,
    buildings: data.buildings.filter((building) => building.id !== buildingId),
    rooms: data.rooms.filter((room) => room.building_id !== buildingId),
    assets: data.assets.filter((asset) => !assetIds.includes(asset.id)),
    asset_photos: data.asset_photos.filter((photo) => !assetIds.includes(photo.asset_id)),
    asset_logs: data.asset_logs.filter((log) => !assetIds.includes(log.asset_id))
  };
}

export function deleteRoom(data: StoreData, roomId: string): StoreData {
  const assetIds = data.assets.filter((asset) => asset.room_id === roomId).map((asset) => asset.id);

  return {
    ...data,
    rooms: data.rooms.filter((room) => room.id !== roomId),
    assets: data.assets.filter((asset) => asset.room_id !== roomId),
    asset_photos: data.asset_photos.filter((photo) => !assetIds.includes(photo.asset_id)),
    asset_logs: data.asset_logs.filter((log) => !assetIds.includes(log.asset_id))
  };
}

export function saveAsset(data: StoreData, asset: Partial<Asset> & Omit<Asset, "id" | "created_at" | "updated_at">, photoUrl?: string) {
  const existing = asset.id ? data.assets.find((item) => item.id === asset.id) : undefined;
  const timestamp = nowIso();
  const id = existing?.id ?? uid("asset");
  const nextAsset: Asset = {
    ...asset,
    id,
    created_at: existing?.created_at ?? timestamp,
    updated_at: timestamp
  };
  const assets = existing ? data.assets.map((item) => (item.id === id ? nextAsset : item)) : [nextAsset, ...data.assets];
  const previousLocation = existing ? locationLabel(existing, data) : "New asset";
  const nextData = { ...data, assets };
  const newLocation = locationLabel(nextAsset, nextData);
  const action = statusToAction(nextAsset.status);
  const log: AssetLog = {
    id: uid("log"),
    asset_id: id,
    action_type: action,
    previous_location: previousLocation,
    new_location: newLocation,
    notes: existing ? "Asset record updated." : "Asset created from add asset form.",
    user_name: "Site user",
    created_at: timestamp
  };
  const photos: AssetPhoto[] = photoUrl
    ? [
        {
          id: uid("photo"),
          asset_id: id,
          photo_url: photoUrl,
          caption: "Uploaded photo",
          created_at: timestamp
        },
        ...data.asset_photos
      ]
    : data.asset_photos;
  return { ...nextData, asset_photos: photos, asset_logs: [log, ...data.asset_logs] };
}

function statusToAction(status: AssetStatus): AssetLog["action_type"] {
  const actions: Record<AssetStatus, AssetLog["action_type"]> = {
    installed: "Installed",
    removed: "Removed",
    replaced: "Replaced",
    moved: "Moved",
    damaged: "Faulty/Damaged"
  };
  return actions[status];
}
