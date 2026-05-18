import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function ButtonLink({ href, children, icon: Icon, variant = "primary" }: {
  href: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold transition ${
        variant === "primary"
          ? "bg-ink text-white shadow-panel hover:-translate-y-0.5 hover:bg-zinc-800 active:translate-y-0"
          : "border border-zinc-200 bg-white text-ink hover:-translate-y-0.5 hover:bg-zinc-50 active:translate-y-0"
      }`}
    >
      {Icon ? <Icon size={17} /> : null}
      {children}
    </Link>
  );
}
