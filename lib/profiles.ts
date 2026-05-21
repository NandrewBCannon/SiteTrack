"use client";

import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_path?: string;
  avatar_url?: string;
  updated_at?: string;
};

export type ProfileMap = Record<string, UserProfile>;

export function profileFallback(user?: Pick<User, "id" | "email" | "user_metadata"> | null): UserProfile | null {
  if (!user?.id) return null;
  const metadata = user.user_metadata ?? {};
  const first = String(metadata.first_name ?? "").trim();
  const last = String(metadata.last_name ?? "").trim();
  const display = [first, last].filter(Boolean).join(" ") || String(metadata.full_name ?? "").trim() || user.email?.split("@")[0] || "Site user";
  return {
    id: user.id,
    first_name: first,
    last_name: last,
    display_name: display,
    avatar_path: String(metadata.avatar_path ?? ""),
    avatar_url: String(metadata.avatar_url ?? "")
  };
}

export function displayName(profile?: UserProfile | null, fallback = "Site user") {
  const full = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return full || profile?.display_name || fallback;
}

export function initialsForProfile(profile?: UserProfile | null, fallback = "ST") {
  const name = displayName(profile, fallback);
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name.slice(0, 2);
  return initials.toUpperCase();
}

export async function loadCurrentUserProfile(user: User) {
  if (!supabase) return profileFallback(user);
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (data) return withAvatarUrl(mapProfile(data));

  const fallback = profileFallback(user);
  if (!fallback) return null;
  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      first_name: fallback.first_name,
      last_name: fallback.last_name,
      display_name: displayName(fallback, user.email?.split("@")[0] ?? "Site user")
    })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return withAvatarUrl(mapProfile(inserted));
}

export async function saveCurrentUserProfile(user: User, firstName: string, lastName: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const first_name = firstName.trim();
  const last_name = lastName.trim();
  const display_name = [first_name, last_name].filter(Boolean).join(" ");
  if (!first_name || !last_name) throw new Error("First name and last name are required.");

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      first_name,
      last_name,
      display_name,
      avatar_path: user.user_metadata?.avatar_path ?? profileFallback(user)?.avatar_path ?? null,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();
  if (error) throw error;

  await supabase.auth.updateUser({
    data: {
      first_name,
      last_name,
      display_name,
      full_name: display_name
    }
  });

  return withAvatarUrl(mapProfile(data));
}

export async function loadProfilesForUsers(userIds: string[]) {
  if (!supabase) return {};
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (!ids.length) return {};

  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  const profiles = await Promise.all((data ?? []).map((profile) => withAvatarUrl(mapProfile(profile))));
  return Object.fromEntries(profiles.map((profile) => [profile.id, profile]));
}

export async function uploadCurrentUserAvatar(user: User, file: File) {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file for your profile picture.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Profile picture must be under 2 MB.");

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false
  });
  if (uploadError) throw uploadError;

  const existing = await loadCurrentUserProfile(user);

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      first_name: existing?.first_name ?? String(user.user_metadata?.first_name ?? "").trim(),
      last_name: existing?.last_name ?? String(user.user_metadata?.last_name ?? "").trim(),
      avatar_path: path,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();
  if (error) throw error;

  await supabase.auth.updateUser({ data: { avatar_path: path } });
  return withAvatarUrl(mapProfile(data));
}

function mapProfile(row: any): UserProfile {
  return {
    id: row.id,
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    display_name: row.display_name ?? "",
    avatar_path: row.avatar_path ?? "",
    avatar_url: row.avatar_url ?? "",
    updated_at: row.updated_at ?? ""
  };
}

async function withAvatarUrl(profile: UserProfile) {
  if (!supabase || !profile.avatar_path || profile.avatar_url) return profile;
  const { data } = await supabase.storage.from("profile-avatars").createSignedUrl(profile.avatar_path, 60 * 60);
  return { ...profile, avatar_url: data?.signedUrl ?? "" };
}
