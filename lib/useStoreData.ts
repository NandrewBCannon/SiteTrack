"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { seedData } from "@/lib/seed";
import { loadStore, saveStore } from "@/lib/store";
import { loadSupabaseStore, saveSupabaseStore } from "@/lib/supabaseStore";
import type { StoreData } from "@/lib/types";

export function useStoreData() {
  const { isConfigured, user } = useAuth();
  const [data, setData] = useState<StoreData>(seedData);
  const [isSupabaseMode, setIsSupabaseMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (isConfigured && user) {
        try {
          const result = await loadSupabaseStore();
          if (cancelled) return;
          setIsSupabaseMode(true);
          setData(result.data);
          return;
        } catch (error) {
          console.error("Could not load Supabase data, falling back to local demo store.", error);
        }
      }

      if (!cancelled) {
        setIsSupabaseMode(false);
        setData(loadStore());
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

  return [data, commit] as const;
}

function getSupabaseErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    const value = error as { message?: string; details?: string; hint?: string; code?: string };
    return [value.message, value.details, value.hint, value.code].filter(Boolean).join(" ");
  }
  return "Could not save Supabase data.";
}
