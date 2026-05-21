"use client";

import { UserRound } from "lucide-react";
import { initialsForProfile, type UserProfile } from "@/lib/profiles";

export function UserAvatar({
  profile,
  fallback = "ST",
  size = "md"
}: {
  profile?: UserProfile | null;
  fallback?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-xl"
  };

  if (profile?.avatar_url) {
    return (
      <div className={`${sizes[size]} shrink-0 overflow-hidden rounded-[8px] bg-zinc-100 shadow-sm`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profile.avatar_url} alt={profile.display_name || "Profile avatar"} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${sizes[size]} grid shrink-0 place-items-center rounded-[8px] bg-gradient-to-br from-ink via-signal to-mint font-semibold text-white shadow-sm`}>
      {profile ? initialsForProfile(profile, fallback) : <UserRound size={size === "lg" ? 24 : 18} />}
    </div>
  );
}
