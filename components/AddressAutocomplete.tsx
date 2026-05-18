"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { inputClass } from "@/components/Field";

type AddressSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Start typing a real address..."
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function closeOnOutside(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [isOpen]);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 4) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=au&q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const results = (await response.json()) as AddressSuggestion[];
        setSuggestions(results.filter((item) => item.display_name && item.lat && item.lon));
        setIsOpen(true);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  function pickAddress(suggestion: AddressSuggestion) {
    onChange(suggestion.display_name);
    cachePoint(suggestion.display_name, {
      lat: Number(suggestion.lat),
      lng: Number(suggestion.lon),
      source: "address"
    });
    setIsOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          className={`${inputClass} pr-10`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => {
            if (suggestions.length) setIsOpen(true);
          }}
          placeholder={placeholder}
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-steel" size={17} />
        ) : (
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-steel" size={17} />
        )}
      </div>
      {isOpen && suggestions.length ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-[8px] border border-zinc-200 bg-white shadow-panel">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.lat}-${suggestion.lon}-${suggestion.display_name}`}
              type="button"
              onClick={() => pickAddress(suggestion)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-ink transition hover:bg-zinc-50"
            >
              <MapPin className="mt-0.5 shrink-0 text-signal" size={15} />
              <span className="line-clamp-2">{suggestion.display_name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function cachePoint(address: string, point: { lat: number; lng: number; source: "address" }) {
  if (typeof window === "undefined") return;
  const key = address.trim().toLowerCase().replace(/\s+/g, " ");
  if (!key) return;
  window.localStorage.setItem(`site-geocode:${key}`, JSON.stringify(point));
}
