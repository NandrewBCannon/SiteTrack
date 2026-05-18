export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "focus-ring min-h-11 rounded-[8px] border border-zinc-200 bg-white px-3 py-2 text-sm text-ink shadow-sm placeholder:text-zinc-400";
