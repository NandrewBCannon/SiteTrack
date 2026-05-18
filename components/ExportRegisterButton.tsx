"use client";

import { useMemo, useState } from "react";
import { Check, Clipboard, Download, Share2 } from "lucide-react";
import { buildAssetRegisterCsv, downloadCsv, exportFilename, shareCsv } from "@/lib/export";
import type { StoreData } from "@/lib/types";

export function ExportRegisterButton({
  data,
  compact = false,
  siteId,
  buildingId,
  filenamePrefix = "site-asset-register"
}: {
  data: StoreData;
  compact?: boolean;
  siteId?: string;
  buildingId?: string;
  filenamePrefix?: string;
}) {
  const csv = useMemo(() => buildAssetRegisterCsv(data, { siteId, buildingId }), [data, siteId, buildingId]);
  const filename = exportFilename(filenamePrefix);
  const [message, setMessage] = useState("");

  function exportCsv() {
    downloadCsv(csv, filename);
    setMessage("CSV download started. Open it with Excel or import it into Google Sheets.");
  }

  async function copyCsv() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(csv);
      } else {
        fallbackCopy(csv);
      }
      setMessage("CSV copied. Paste it into Google Sheets cell A1 to test the export immediately.");
    } catch {
      fallbackCopy(csv);
      setMessage("CSV copied with fallback. Paste it into Google Sheets cell A1 to test it.");
    }
  }

  async function shareRegister() {
    const usedNativeShare = await shareCsv(csv, filename);
    setMessage(
      usedNativeShare
        ? "Share sheet opened."
        : "Native sharing is not available here, so a CSV download was started instead."
    );
  }

  return (
    <div>
      <div className={`grid gap-2 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-3"}`}>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-zinc-200 bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-zinc-50"
        >
          <Download size={17} />
          Export
        </button>
        <button
          type="button"
          onClick={() => void copyCsv()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-zinc-200 bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-zinc-50"
        >
          <Clipboard size={17} />
          Copy
        </button>
        <button
          type="button"
          onClick={() => void shareRegister()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-3 text-sm font-semibold text-white shadow-panel transition hover:bg-zinc-800"
        >
          <Share2 size={17} />
          Share
        </button>
      </div>
      {message ? (
        <p className="mt-2 flex items-start gap-2 rounded-[8px] bg-emerald-50 px-3 py-2 text-xs font-medium leading-5 text-emerald-800">
          <Check className="mt-0.5 shrink-0" size={14} />
          {message}
        </p>
      ) : null}
    </div>
  );
}

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
