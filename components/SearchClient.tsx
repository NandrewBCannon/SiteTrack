"use client";

import { useMemo, useState } from "react";
import { AssetCard } from "@/components/AssetCard";
import { SearchBox } from "@/components/SearchBox";
import { canDeleteAssets } from "@/lib/roles";
import { deleteAsset, searchAssets } from "@/lib/store";
import { deleteAssetFromSupabase } from "@/lib/supabaseStore";
import type { AssetView } from "@/lib/types";
import { useStoreData } from "@/lib/useStoreData";

export function SearchClient() {
  const [data, commit, isSupabaseMode, workspace, isLoading, replaceData] = useStoreData();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const results = useMemo(() => searchAssets(data, query), [data, query]);
  const canDelete = !isSupabaseMode || canDeleteAssets(workspace?.role);

  async function handleDelete(asset: AssetView) {
    if (!window.confirm(`Delete ${asset.asset_number} (${asset.item_name})? This removes its photos and history log too.`)) return;
    setError("");
    try {
      if (isSupabaseMode) {
        await deleteAssetFromSupabase(asset.id);
        replaceData(deleteAsset(data, asset.id));
      } else {
        commit(deleteAsset(data, asset.id));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete this asset.");
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Search assets</h1>
        <p className="mt-2 text-steel">Asset number, serial number, item name, building, room, or patching ID.</p>
      </div>
      <SearchBox value={query} onChange={setQuery} placeholder="Try HX-AUD-1201, SHM8A92103, L12-1242, SW12-18..." />
      {error ? <p className="rounded-[8px] bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
      <div className="grid gap-3">
        {isLoading ? (
          <div className="rounded-[8px] border border-zinc-200 bg-white p-8 text-center text-steel shadow-panel">
            Loading secure asset data...
          </div>
        ) : null}
        {!isLoading ? results.map((asset) => <AssetCard key={asset.id} asset={asset} canDelete={canDelete} onDelete={handleDelete} />) : null}
        {!isLoading && results.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-zinc-300 bg-white p-8 text-center text-steel">
            No matching assets found.
          </div>
        ) : null}
      </div>
    </div>
  );
}
