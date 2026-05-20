"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import type { AssetView } from "@/lib/types";

type AssetActionsMenuProps = {
  asset: AssetView;
  canDelete: boolean;
  onDelete: (asset: AssetView) => void;
};

export function AssetActionsMenu({ asset, canDelete, onDelete }: AssetActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    if (isOpen) document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  if (!canDelete) return null;

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
              onDelete(asset);
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            <Trash2 size={16} />
            Delete asset
          </button>
        </div>
      ) : null}
    </div>
  );
}
