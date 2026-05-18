"use client";

import { Search } from "lucide-react";

export function SearchBox({ value, onChange, placeholder = "Search asset, serial, room, patching..." }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-steel" size={20} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="focus-ring h-14 w-full rounded-[8px] border border-zinc-200 bg-white pl-12 pr-4 text-base font-medium text-ink shadow-panel placeholder:text-zinc-400"
      />
    </label>
  );
}
