"use client";

import { useEffect, useRef, useState } from "react";
import type { Site, StoreData } from "@/lib/types";

type SitePoint = {
  lat: number;
  lng: number;
  source: "address" | "approx";
};

const knownCoordinates: Record<string, SitePoint> = {
  "24 barangaroo ave, sydney nsw": { lat: -33.8628, lng: 151.2016, source: "address" },
  "88 george st, parramatta nsw": { lat: -33.8152, lng: 151.0017, source: "address" },
  "240 queen street, brisbane city, queensland 4000": { lat: -27.4672, lng: 153.0279, source: "address" }
};

export function SiteWorldMap({
  data,
  selectedSiteId,
  onSelect
}: {
  data: StoreData;
  selectedSiteId?: string;
  onSelect: (siteId: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [points, setPoints] = useState<Record<string, SitePoint>>({});

  useEffect(() => {
    let cancelled = false;

    async function resolvePoints() {
      const entries = await Promise.all(data.sites.map(async (site, index) => [site.id, await resolveSitePoint(site, index)] as const));
      if (!cancelled) setPoints(Object.fromEntries(entries));
    }

    void resolvePoints();
    return () => {
      cancelled = true;
    };
  }, [data.sites]);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    async function initMap() {
      const L = await import("leaflet");
      if (!mapRef.current || leafletMapRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false
      }).setView([-27.8, 145.5], 4);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);

      leafletMapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
    }

    void initMap();
  }, []);

  useEffect(() => {
    async function renderMarkers() {
      const L = await import("leaflet");
      const map = leafletMapRef.current;
      const layer = layerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();
      const bounds: Array<[number, number]> = [];

      data.sites.forEach((site) => {
        const point = points[site.id];
        if (!point) return;
        const buildings = data.buildings.filter((building) => building.site_id === site.id).length;
        const assets = data.assets.filter((asset) => asset.site_id === site.id && !asset.archived_at).length;
        const active = site.id === selectedSiteId;
        const icon = L.divIcon({
          className: "",
          html: `<button class="map-pin ${active ? "map-pin-active" : ""}" aria-label="${escapeHtml(site.name)}">
            <span class="map-pin-dot"></span>
            <span class="map-pin-card">
              <strong>${escapeHtml(site.name)}</strong>
              <small>${buildings} buildings | ${assets} assets</small>
            </span>
          </button>`,
          iconSize: [190, 78],
          iconAnchor: [24, 64]
        });

        const marker = L.marker([point.lat, point.lng], { icon }).addTo(layer);
        marker.on("click", () => onSelect(site.id));
        bounds.push([point.lat, point.lng]);
      });

      if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [58, 58], maxZoom: 14 });
      }
    }

    void renderMarkers();
  }, [data, points, selectedSiteId, onSelect]);

  return (
    <div className="relative overflow-hidden rounded-[8px] border border-zinc-200 bg-white shadow-panel">
      <div ref={mapRef} className="h-[420px] min-h-[52vh] w-full" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-[8px] bg-white/90 px-3 py-2 text-xs font-semibold text-steel shadow-panel backdrop-blur">
        Drag to pan, use +/- to zoom, scroll page normally
      </div>
    </div>
  );
}

async function resolveSitePoint(site: Site, index: number): Promise<SitePoint> {
  const key = normalize(site.address);
  const cached = readCachedPoint(key);
  if (cached) return cached;
  if (knownCoordinates[key]) return knownCoordinates[key];

  if (site.address.trim()) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(site.address)}`;
      const response = await fetch(url);
      const results = await response.json();
      const first = results?.[0];
      if (first?.lat && first?.lon) {
        const point = { lat: Number(first.lat), lng: Number(first.lon), source: "address" as const };
        cachePoint(key, point);
        return point;
      }
    } catch {
      // Fall back to a stable approximate spread so the pin is still selectable.
    }
  }

  return approximatePoint(site, index);
}

function approximatePoint(site: Site, index: number): SitePoint {
  const hash = Array.from(site.id + site.name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    lat: -31.5 + ((hash + index * 17) % 900) / 100,
    lng: 116 + ((hash + index * 29) % 3500) / 100,
    source: "approx"
  };
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function readCachedPoint(key: string) {
  if (!key || typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(`site-geocode:${key}`);
    return raw ? (JSON.parse(raw) as SitePoint) : undefined;
  } catch {
    return undefined;
  }
}

function cachePoint(key: string, point: SitePoint) {
  if (!key || typeof window === "undefined") return;
  window.localStorage.setItem(`site-geocode:${key}`, JSON.stringify(point));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char] ?? char);
}
