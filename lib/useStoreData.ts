"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { loadStore, saveStore } from "@/lib/store";
import { loadSupabaseStore, saveSupabaseStore, type WorkspaceSummary } from "@/lib/supabaseStore";
import type { StoreData } from "@/lib/types";

const emptyStore: StoreData = {
  sites: [],
  buildings: [],
  rooms: [],
  assets: [],
  asset_photos: [],
  asset_logs: []
};

export function useStoreData() {
  const { isConfigured, user } = useAuth();
  const [data, setData] = useState<StoreData>(emptyStore);
  const [isSupabaseMode, setIsSupabaseMode] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(isConfigured && user));

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(Boolean(isConfigured && user));
      if (isConfigured && user) {
        try {
          const result = await loadSupabaseStore();
          if (cancelled) return;
          setIsSupabaseMode(true);
          setWorkspace(result.workspace);
          setData(result.data);
          setIsLoading(false);
          return;
        } catch (error) {
          console.error("Could not load Supabase data.", error);
          window.dispatchEvent(new CustomEvent("sitetrack-sync-error", {
            detail: error instanceof Error ? error.message : getSupabaseErrorMessage(error)
          }));
          if (!cancelled) {
            setIsSupabaseMode(true);
            setWorkspace(null);
            setData(emptyStore);
            setIsLoading(false);
          }
          return;
        }
      }

      if (!cancelled) {
        setIsSupabaseMode(false);
        setWorkspace(null);
        setData(loadStore());
        setIsLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [isConfigured, user]);

  function commit(next: StoreData) {
    setData(next);
    if (isConfigured && user) {
      window.dispatchEvent(new CustomEvent("sitetrack-sync-status", { detail: "Saving to Supabase..." }));
      void saveSupabaseStore(next)
        .then(() => {
          window.dispatchEvent(new CustomEvent("sitetrack-sync-status", { detail: "Saved to Supabase." }));
        })
        .catch((error) => {
          console.error("Could not save Supabase data.", error);
          window.dispatchEvent(new CustomEvent("sitetrack-sync-error", {
            detail: error instanceof Error ? error.message : getSupabaseErrorMessage(error)
          }));
        });
    } else {
      saveStore(next);
    }
  }

  return [data, commit, isSupabaseMode, workspace, isLoading] as const;
}

function getSupabaseErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const value = error as { message?: string; details?: string; hint?: string; code?: string };
    return [value.message, value.details, value.hint, value.code].filter(Boolean).join(" ");
  }
  return "Could not save Supabase data.";
}
