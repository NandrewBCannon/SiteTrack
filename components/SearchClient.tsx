"use client";

import { useMemo, useState } from "react";
import { AssetCard } from "@/components/AssetCard";
import { SearchBox } from "@/components/SearchBox";
import { searchAssets } from "@/lib/store";
import { useStoreData } from "@/lib/useStoreData";

export function SearchClient() {
  const [data] = useStoreData();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchAssets(data, query), [data, query]);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Search assets</h1>
        <p className="mt-2 text-steel">Asset number, serial number, item name, building, room, or patching ID.</p>
      </div>
      <SearchBox value={query} onChange={setQuery} placeholder="Try HX-AUD-1201, SHM8A92103, L12-1242, SW12-18..." />
      <div className="grid gap-3">
        {results.map((asset) => <AssetCard key={asset.id} asset={asset} />)}
        {results.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-zinc-300 bg-white p-8 text-center text-steel">
            No matching assets found.
          </div>
        ) : null}
      </div>
    </div>
  );
}
