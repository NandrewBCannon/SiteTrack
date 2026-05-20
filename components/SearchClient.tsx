"use client";

import { useMemo, useState } from "react";
import { AssetCard } from "@/components/AssetCard";
import { SearchBox } from "@/components/SearchBox";
import { canDeleteAssets } from "@/lib/roles";
import { archiveAsset, restoreAsset, searchArchivedAssets, searchAssets } from "@/lib/store";
import { archiveAssetInSupabase, restoreAssetInSupabase } from "@/lib/supabaseStore";
import type { AssetView } from "@/lib/types";
import { useStoreData } from "@/lib/useStoreData";

export function SearchClient() {
  const [data, commit, isSupabaseMode, workspace, isLoading, replaceData] = useStoreData();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const canArchive = !isSupabaseMode || canDeleteAssets(workspace?.role);
  const results = useMemo(() => showArchived ? searchArchivedAssets(data, query) : searchAssets(data, query), [data, query, showArchived]);
  const archivedCount = useMemo(() => data.assets.filter((asset) => asset.archived_at).length, [data.assets]);

  async function handleArchive(asset: AssetView) {
    if (!window.confirm(`Archive ${asset.asset_number} (${asset.item_name})? It will be hidden from active searches but can be restored by an admin.`)) return;
    setError("");
    try {
      if (isSupabaseMode) {
        await archiveAssetInSupabase(asset.id);
        replaceData(archiveAsset(data, asset.id, workspace?.name ?? "Site user"));
      } else {
        commit(archiveAsset(data, asset.id));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not archive this asset.");
    }
  }

  async function handleRestore(asset: AssetView) {
    if (!window.confirm(`Restore ${asset.asset_number} (${asset.item_name}) to the active register?`)) return;
    setError("");
    try {
      if (isSupabaseMode) {
        await restoreAssetInSupabase(asset.id);
        replaceData(restoreAsset(data, asset.id, workspace?.name ?? "Site user"));
      } else {
        commit(restoreAsset(data, asset.id));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not restore this asset.");
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Search assets</h1>
        <p className="mt-2 text-steel">Asset number, serial number, item name, building, room, or patching ID.</p>
      </div>
      <SearchBox value={query} onChange={setQuery} placeholder="Try HX-AUD-1201, SHM8A92103, L12-1242, SW12-18..." />
      {canArchive && archivedCount ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowArchived((current) => !current)}
            className={`rounded-[8px] px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${showArchived ? "bg-ink text-white" : "border border-zinc-200 bg-white text-ink shadow-sm"}`}
          >
            {showArchived ? "Show active assets" : `Show archived (${archivedCount})`}
          </button>
        </div>
      ) : null}
      {error ? <p className="rounded-[8px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
      <div className="grid gap-3">
        {isLoading ? (
          <div className="rounded-[8px] border border-zinc-200 bg-white p-8 text-center text-steel shadow-panel">
            Loading secure asset data...
          </div>
        ) : null}
        {!isLoading ? results.map((asset) => (
          <AssetCard key={asset.id} asset={asset} canArchive={canArchive} onArchive={handleArchive} onRestore={handleRestore} />
        )) : null}
        {!isLoading && results.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-zinc-300 bg-white p-8 text-center text-steel">
            No matching assets found.
          </div>
        ) : null}
      </div>
    </div>
  );
}
