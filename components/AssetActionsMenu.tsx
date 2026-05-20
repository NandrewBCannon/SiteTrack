"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, MoreHorizontal, RotateCcw } from "lucide-react";
import type { AssetView } from "@/lib/types";

type AssetActionsMenuProps = {
  asset: AssetView;
  canArchive: boolean;
  onArchive: (asset: AssetView) => void;
  onRestore?: (asset: AssetView) => void;
};

export function AssetActionsMenu({ asset, canArchive, onArchive, onRestore }: AssetActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    if (isOpen) document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  if (!canArchive) return null;
  const isArchived = Boolean(asset.archived_at);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={`Open actions for ${asset.asset_number}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        className="inline-grid h-9 w-9 place-items-center rounded-full border border-zinc-200 bg-white text-steel shadow-sm transition hover:-translate-y-0.5 hover:text-ink"
      >
        <MoreHorizontal size={18} />
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-[8px] border border-zinc-200 bg-white shadow-panel">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsOpen(false);
              if (isArchived && onRestore) onRestore(asset);
              else onArchive(asset);
            }}
            className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold transition ${isArchived ? "text-emerald-700 hover:bg-emerald-50" : "text-amber-700 hover:bg-amber-50"}`}
          >
            {isArchived ? <RotateCcw size={16} /> : <Archive size={16} />}
            {isArchived ? "Restore asset" : "Archive asset"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
