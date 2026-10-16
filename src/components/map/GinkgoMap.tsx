import { useEffect, useMemo, useRef, useState } from "react";
import type * as LT from "leaflet";
import "leaflet/dist/leaflet.css";
import { getBasemap } from "@/data/basemaps";
import { bboxContains, bboxSizeM } from "@/lib/geo/math";
import { renderFlood, renderLandCover, renderTerrain } from "@/lib/geo/render";
import { useGinkgo } from "@/state/ginkgo-store";
import type { BBox, LatLng, PoiCategory } from "@/types/geo";
import { cn } from "@/lib/utils";

// Leaflet touches `window` at import time, so it is only ever loaded in the browser.
let leafletPromise: Promise<typeof LT> | null = null;
export function loadLeaflet(): Promise<typeof LT> {
  leafletPromise ??= import("leaflet").then(
    (m) => ((m as unknown as { default?: typeof LT }).default ?? m) as typeof LT,
  );
  return leafletPromise;
}

export interface MapApi {
  getBounds(): BBox;
  getCenter(): LatLng;
  getZoom(): number;
  zoomIn(): void;
  zoomOut(): void;
  flyTo(center: LatLng, zoom?: number): void;
}

const POI_STYLE: Record<PoiCategory, { color: string; label: string }> = {
  education: { color: "#38BDF8", label: "Education" },
  health: { color: "#EF4444", label: "Health" },
  emergency: { color: "#F59E0B", label: "Emergency" },
  civic: { color: "#CBD5E1", label: "Civic" },
  transit: { color: "#FFFFFF", label: "Transit" },
};

const CHANNEL_STYLE = {
  river: { color: "#38BDF8", weight: 4, opacity: 0.95, dashArray: undefined as string | undefined },
  canal: { color: "#38BDF8", weight: 3, opacity: 0.9, dashArray: undefined as string | undefined },
  stream: {
    color: "#7dd3fc",
    weight: 2,
    opacity: 0.75,
    dashArray: undefined as string | undefined,
  },
  drain: { color: "#7dd3fc", weight: 1.2, opacity: 0.45, dashArray: "3 4" },
};

/** Last view, kept across route changes so the map does not jump back. */
let lastView: { center: LatLng; zoom: number } | null = null;
const DEFAULT_VIEW = { center: [3.105, 101.64] as LatLng, zoom: 11 };

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function GinkgoMap({
  variant = "workspace",
  className,
  onReady,
  onAreaDrawn,
}: {
  variant?: "workspace" | "inset";
  className?: string;
  onReady?: (api: MapApi) => void;
  onAreaDrawn?: (bbox: BBox, wasTap: boolean) => void;
}) {
  const {
    analysis,
    aoi,
    layers,
    settings,
    drawMode,
    inspection,
    mapCommand,
    inspect,
    status,
    importedOverlay,
  } = useGinkgo();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LT.Map | null>(null);
  const [L, setL] = useState<typeof LT | null>(null);
  const [ready, setReady] = useState(false);
  const refs = useRef<{
    base?: LT.TileLayer | undefined;
    labels?: LT.TileLayer | undefined;
    aoi?: LT.LayerGroup | undefined;
    overlays?: LT.LayerGroup | undefined;
    imported?: LT.ImageOverlay | undefined;
    rivers?: LT.LayerGroup | undefined;
    pois?: LT.LayerGroup | undefined;
    pin?: LT.Marker | undefined;
  }>({});
  const onAreaDrawnRef = useRef(onAreaDrawn);
  onAreaDrawnRef.current = onAreaDrawn;
  const inspectRef = useRef(inspect);
  inspectRef.current = inspect;
  const ctxRef = useRef({ analysis, drawMode, status });
  ctxRef.current = { analysis, drawMode, status };
  /** Timestamp of the last finished draw — the pointerup also emits a map click we must ignore. */
  const drawEndRef = useRef(0);
  const isInset = variant === "inset";

  useEffect(() => {
    let alive = true;
    void loadLeaflet().then((l) => alive && setL(l));
    return () => {
      alive = false;
    };
  }, []);

  // ─── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!L || !el || mapRef.current) return;
    const start = isInset ? DEFAULT_VIEW : (lastView ?? DEFAULT_VIEW);
    const map = L.map(el, {
      center: start.center,
      zoom: start.zoom,
      zoomControl: false,
      attributionControl: true,
      minZoom: 4,
      maxZoom: 19,
      zoomSnap: 0.25,
      preferCanvas: true,
      scrollWheelZoom: !isInset,
    });
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    // Computed grids sit under vectors (rivers, AOI); labels sit above both.
    const grids = map.createPane("grids");
    grids.style.zIndex = "350";
    grids.style.pointerEvents = "none";
    const imported = map.createPane("imported");
    imported.style.zIndex = "300";
    imported.style.pointerEvents = "none";
    const labels = map.createPane("labels");
    labels.style.zIndex = "420";
    labels.style.pointerEvents = "none";
    if (!isInset)
      L.control.scale({ position: "bottomleft", imperial: false, maxWidth: 110 }).addTo(map);
    refs.current.aoi = L.layerGroup().addTo(map);
    refs.current.overlays = L.layerGroup().addTo(map);
    refs.current.rivers = L.layerGroup().addTo(map);
    refs.current.pois = L.layerGroup().addTo(map);
    mapRef.current = map;

    if (!isInset) {
      map.on("moveend", () => {
        const c = map.getCenter();
        lastView = { center: [c.lat, c.lng], zoom: map.getZoom() };
      });
    }
    map.on("click", (e: LT.LeafletMouseEvent) => {
      const { analysis: a, drawMode: d, status: st } = ctxRef.current;
      if (d || !a || st === "running" || Date.now() - drawEndRef.current < 500) return;
      if (bboxContains(a.aoi.bbox, [e.latlng.lat, e.latlng.lng]))
        inspectRef.current(e.latlng.lat, e.latlng.lng);
    });

    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    ro.observe(el);
    setReady(true);

    onReady?.({
      getBounds: () => {
        const b = map.getBounds();
        return { south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() };
      },
      getCenter: () => {
        const c = map.getCenter();
        return [c.lat, c.lng];
      },
      getZoom: () => map.getZoom(),
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      flyTo: (center, zoom) =>
        map.flyTo(center, zoom ?? Math.max(map.getZoom(), 15), { duration: 0.8 }),
    });

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      refs.current = {};
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  // ─── Basemap + labels ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!L || !map || !ready) return;
    const def = getBasemap(settings.basemap);
    refs.current.base?.remove();
    const opts: LT.TileLayerOptions = {
      attribution: def.attribution,
      maxNativeZoom: def.maxNativeZoom,
      maxZoom: 19,
      detectRetina: false,
    };
    if (def.subdomains) opts.subdomains = def.subdomains;
    refs.current.base = L.tileLayer(def.url, opts).addTo(map);
    refs.current.base.bringToBack();
    refs.current.labels?.remove();
    refs.current.labels = undefined;
    if (def.labelsUrl && layers.labels) {
      refs.current.labels = L.tileLayer(def.labelsUrl, {
        maxNativeZoom: 19,
        maxZoom: 19,
        pane: "labels",
        opacity: 0.9,
      }).addTo(map);
    }
  }, [L, ready, settings.basemap, layers.labels]);

  // ─── AOI outline + outside dimming ───────────────────────────────────────
  const shownAoi = analysis?.aoi ?? aoi;
  useEffect(() => {
    const g = refs.current.aoi;
    if (!L || !g || !ready) return;
    g.clearLayers();
    if (!shownAoi) return;
    const b = shownAoi.bbox;
    const ring: LT.LatLngExpression[] = shownAoi.boundary ?? [
      [b.south, b.west],
      [b.north, b.west],
      [b.north, b.east],
      [b.south, b.east],
    ];
    const world: LT.LatLngExpression[] = [
      [-85, -180],
      [85, -180],
      [85, 180],
      [-85, 180],
    ];
    L.polygon([world, ring], {
      stroke: false,
      fillColor: "#05060a",
      fillOpacity: isInset ? 0.35 : 0.42,
      interactive: false,
    }).addTo(g);
    L.polygon(ring, {
      color: "#ffffff",
      weight: 2,
      dashArray: status === "running" ? "6 6" : undefined,
      fill: false,
      interactive: false,
    }).addTo(g);
  }, [L, ready, shownAoi, status, isInset]);

  // ─── Raster overlays (computed grids) ────────────────────────────────────
  const images = useMemo(() => {
    if (!analysis || typeof document === "undefined") return null;
    return {
      flood: renderFlood(analysis),
      landcover: renderLandCover(analysis),
      terrain: renderTerrain(analysis),
    };
  }, [analysis]);

  useEffect(() => {
    const g = refs.current.overlays;
    if (!L || !g || !ready) return;
    g.clearLayers();
    if (!analysis || !images) return;
    const b = analysis.aoi.bbox;
    const bounds: LT.LatLngBoundsExpression = [
      [b.south, b.west],
      [b.north, b.east],
    ];
    const op = settings.layerOpacity;
    if (layers.terrain)
      L.imageOverlay(images.terrain, bounds, {
        opacity: Math.min(1, op + 0.15),
        interactive: false,
        pane: "grids",
      }).addTo(g);
    if (layers.landcover)
      L.imageOverlay(images.landcover, bounds, {
        opacity: op,
        interactive: false,
        className: "gk-overlay-pixelated",
        pane: "grids",
      }).addTo(g);
    if (layers.flood)
      L.imageOverlay(images.flood, bounds, {
        opacity: op,
        interactive: false,
        pane: "grids",
        className: "gk-overlay-pixelated",
      }).addTo(g);
  }, [
    L,
    ready,
    analysis,
    images,
    layers.flood,
    layers.landcover,
    layers.terrain,
    settings.layerOpacity,
  ]);

  // ─── Imported georeferenced imagery ─────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!L || !map || !ready) return;
    refs.current.imported?.remove();
    refs.current.imported = undefined;
    if (!importedOverlay || !layers.imported) return;
    const b = importedOverlay.bbox;
    refs.current.imported = L.imageOverlay(
      importedOverlay.image,
      [
        [b.south, b.west],
        [b.north, b.east],
      ],
      { opacity: 1, pane: "imported", interactive: false },
    ).addTo(map);
  }, [L, ready, importedOverlay, layers.imported]);

  // ─── Rivers ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const g = refs.current.rivers;
    if (!L || !g || !ready) return;
    g.clearLayers();
    if (!analysis || !layers.rivers) return;
    for (const ch of analysis.osm.channels) {
      const s = CHANNEL_STYLE[ch.kind];
      const line = L.polyline(ch.coords, {
        color: s.color,
        weight: s.weight,
        opacity: s.opacity,
        dashArray: s.dashArray,
        lineCap: "round",
      });
      line.bindTooltip(
        `<b>${escapeHtml(ch.name ?? "Unnamed")}</b><br/><span style="color:#94a3b8">OSM waterway=${ch.kind}</span>`,
        {
          sticky: true,
          className: "gk-tooltip",
        },
      );
      line.addTo(g);
    }
  }, [L, ready, analysis, layers.rivers]);

  // ─── Facilities ──────────────────────────────────────────────────────────
  useEffect(() => {
    const g = refs.current.pois;
    if (!L || !g || !ready) return;
    g.clearLayers();
    if (!analysis || !layers.pois) return;
    for (const p of analysis.osm.pois) {
      if (
        p.category === "transit" &&
        p.tag === "highway=bus_stop" &&
        analysis.osm.pois.length > 400
      )
        continue;
      const s = POI_STYLE[p.category];
      L.circleMarker([p.lat, p.lng], {
        radius: p.category === "transit" ? 3.5 : 5,
        color: "#090a0c",
        weight: 1.5,
        fillColor: s.color,
        fillOpacity: 1,
      })
        .bindTooltip(
          `<b>${escapeHtml(p.name ?? s.label)}</b><br/><span style="color:#94a3b8">${escapeHtml(p.tag)}</span>`,
          { className: "gk-tooltip" },
        )
        .addTo(g);
    }
  }, [L, ready, analysis, layers.pois]);

  // ─── Inspection pin ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!L || !map || !ready) return;
    refs.current.pin?.remove();
    refs.current.pin = undefined;
    if (!inspection) return;
    refs.current.pin = L.marker([inspection.lat, inspection.lng], {
      icon: L.divIcon({
        className: "",
        html: '<div class="gk-pin"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(map);
  }, [L, ready, inspection]);

  // ─── Fit to analysed area ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !shownAoi) return;
    if (isInset) {
      const b = shownAoi.bbox;
      map.fitBounds(
        [
          [b.south, b.west],
          [b.north, b.east],
        ],
        { padding: [16, 16], animate: false },
      );
    }
  }, [ready, shownAoi, isInset]);

  // ─── Imperative commands from the store ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !mapCommand || isInset) return;
    if (mapCommand.type === "fit") {
      const b = mapCommand.bbox;
      map.flyToBounds(
        [
          [b.south, b.west],
          [b.north, b.east],
        ],
        { padding: [40, 40], duration: 0.9, maxZoom: 17 },
      );
    } else {
      map.flyTo(mapCommand.center, mapCommand.zoom, { duration: 0.9 });
    }
  }, [mapCommand, ready, isInset]);

  // ─── Draw rectangle (mouse + touch via pointer events) ───────────────────
  useEffect(() => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!L || !map || !el || !ready || isInset) return;
    const handlers = [map.dragging, map.touchZoom, map.doubleClickZoom, map.boxZoom];
    if (!drawMode) {
      handlers.forEach((h) => h?.enable());
      el.classList.remove("gk-drawing");
      el.style.touchAction = "";
      return;
    }
    handlers.forEach((h) => h?.disable());
    el.classList.add("gk-drawing");
    el.style.touchAction = "none";
    let start: LT.LatLng | null = null;
    let rect: LT.Rectangle | null = null;
    let startPt: { x: number; y: number } | null = null;

    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if ((e.target as HTMLElement).closest(".leaflet-control")) return;
      start = map.mouseEventToLatLng(e as unknown as MouseEvent);
      startPt = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
      rect = L.rectangle(L.latLngBounds(start, start), {
        color: "#fff",
        weight: 2,
        dashArray: "5 5",
        fillColor: "#fff",
        fillOpacity: 0.08,
      }).addTo(map);
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (!start || !rect) return;
      rect.setBounds(L.latLngBounds(start, map.mouseEventToLatLng(e as unknown as MouseEvent)));
    };
    const up = (e: PointerEvent) => {
      if (!start || !rect || !startPt) return;
      const end = map.mouseEventToLatLng(e as unknown as MouseEvent);
      const moved = Math.hypot(e.clientX - startPt.x, e.clientY - startPt.y);
      rect.remove();
      const b = L.latLngBounds(start, end);
      const bbox: BBox = {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      };
      const tap = moved < 8;
      drawEndRef.current = Date.now();
      start = null;
      rect = null;
      startPt = null;
      if (tap) {
        onAreaDrawnRef.current?.(
          { south: end.lat, north: end.lat, west: end.lng, east: end.lng },
          true,
        );
      } else {
        const { width, height } = bboxSizeM(bbox);
        if (width > 0 && height > 0) onAreaDrawnRef.current?.(bbox, false);
      }
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      rect?.remove();
    };
  }, [L, ready, drawMode, isInset]);

  return (
    <div className={cn("relative isolate h-full w-full bg-[#0d0f12]", className)}>
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="application"
        aria-label="Interactive map"
      />
      {!ready && <div className="skeleton absolute inset-0" aria-hidden />}
    </div>
  );
}
