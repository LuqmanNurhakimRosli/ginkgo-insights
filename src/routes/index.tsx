import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Focus,
  Layers,
  LocateFixed,
  Minus,
  MousePointerSquareDashed,
  Plus,
  ScanSearch,
  X,
} from "lucide-react";
import {
  ErrorPanel,
  ResultsPanel,
  RunningPanel,
  StartPanel,
} from "@/components/analysis/AnalysisPanel";
import { GinkgoMap, type MapApi } from "@/components/map/GinkgoMap";
import { MapLayersPanel, MapLegend } from "@/components/map/MapLayers";
import { MapSearch } from "@/components/map/MapSearch";
import { btn } from "@/components/gk/ui";
import { MAX_SIDE_M, MIN_SIDE_M } from "@/lib/geo/analyze";
import type { PlaceResult } from "@/lib/geo/geocode";
import { bboxCenter, bboxFromCenter, bboxSizeM, formatLatLng } from "@/lib/geo/math";
import { useGinkgo } from "@/state/ginkgo-store";
import type { AreaOfInterest, BBox, LatLng } from "@/types/geo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Map workspace — Ginkgo" },
      {
        name: "description",
        content:
          "Search, draw and analyse any area for riverine flood susceptibility, land use, access and suitability.",
      },
    ],
  }),
  component: Workspace,
});

type Sheet = "min" | "half" | "full";

let aoiSeq = 0;
function makeAoi(
  bbox: BBox,
  source: AreaOfInterest["source"],
  name: string,
  locality?: string,
): AreaOfInterest {
  return {
    id: `aoi-${Date.now().toString(36)}-${++aoiSeq}`,
    name,
    locality,
    bbox,
    source,
    createdAt: Date.now(),
  };
}

/** Clamp a drawn box into the analysable size range, keeping its centre. */
function normalizeBBox(b: BBox): { bbox: BBox; note?: string } {
  const { width, height } = bboxSizeM(b);
  const w = Math.min(MAX_SIDE_M, Math.max(MIN_SIDE_M * 2, width));
  const h = Math.min(MAX_SIDE_M, Math.max(MIN_SIDE_M * 2, height));
  if (w === width && h === height) return { bbox: b };
  const note =
    width > MAX_SIDE_M || height > MAX_SIDE_M
      ? `Area trimmed to ${MAX_SIDE_M / 1000} km max per side.`
      : "Area expanded to the minimum analysable size.";
  return { bbox: bboxFromCenter(bboxCenter(b), w, h), note };
}

function Workspace() {
  const {
    status,
    analysis,
    drawMode,
    setDrawMode,
    runAnalysis,
    fitBounds,
    flyTo,
    inspection,
    aoi,
  } = useGinkgo();
  const apiRef = useRef<MapApi | null>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const [sheet, setSheet] = useState<Sheet>("half");
  const [pending, setPending] = useState<PlaceResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawMode(false);
        setLayersOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDrawMode]);

  useEffect(() => {
    if (status === "running" || status === "done") setSheet((s) => (s === "min" ? "half" : s));
  }, [status]);
  useEffect(() => {
    if (inspection) setSheet((s) => (s === "min" ? "half" : s));
  }, [inspection]);

  const startDraw = useCallback(() => {
    setPending(null);
    setLayersOpen(false);
    setDrawMode(true);
    setSheet("min");
  }, [setDrawMode]);

  const onAreaDrawn = useCallback(
    (raw: BBox, tap: boolean) => {
      const base = tap ? bboxFromCenter([raw.south, raw.west], 1000) : raw;
      const { bbox, note } = normalizeBBox(base);
      if (note) setNotice(note);
      setPending(null);
      void runAnalysis(makeAoi(bbox, "draw", "Drawn area"));
    },
    [runAnalysis],
  );

  const analyseView = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    const b = api.getBounds();
    const { width, height } = bboxSizeM(b);
    let bbox = b;
    if (width > MAX_SIDE_M || height > MAX_SIDE_M) {
      bbox = bboxFromCenter(api.getCenter(), 3000);
      setNotice(
        "View is larger than 10 km — analysing a 3 km square at the centre. Zoom in for a custom extent.",
      );
    } else {
      // Inset slightly so the area outline stays visible under floating controls.
      bbox = bboxFromCenter(bboxCenter(b), width * 0.86, height * 0.86);
    }
    setPending(null);
    void runAnalysis(makeAoi(normalizeBBox(bbox).bbox, "view", "Current view"));
  }, [runAnalysis]);

  const onPlace = useCallback(
    (p: PlaceResult) => {
      setPending(p);
      const { width = 0, height = 0 } = p.bbox ? bboxSizeM(p.bbox) : {};
      if (p.bbox && width > 300 && width < 20_000 && height < 20_000) fitBounds(p.bbox);
      else flyTo(p.center, 16);
    },
    [fitBounds, flyTo],
  );

  const analysePlace = (p: PlaceResult) => {
    const size = p.bbox ? bboxSizeM(p.bbox) : null;
    const useBox =
      p.bbox &&
      size &&
      size.width >= 600 &&
      size.height >= 600 &&
      size.width <= 6000 &&
      size.height <= 6000;
    const bbox = useBox ? p.bbox! : bboxFromCenter(p.center, 1500);
    setPending(null);
    void runAnalysis(makeAoi(normalizeBBox(bbox).bbox, "search", p.name, p.detail));
  };

  const locate = () => {
    if (!navigator.geolocation) return setNotice("Location is not available in this browser.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c: LatLng = [pos.coords.latitude, pos.coords.longitude];
        flyTo(c, 16);
        setPending({
          id: "me",
          name: "Your location",
          detail: formatLatLng(c, 4),
          center: c,
          kind: "gps",
        });
      },
      () => setNotice("Could not get your location (permission denied or unavailable)."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const toolBtn =
    "flex h-10 w-10 items-center justify-center text-[#cbd5e1] transition-colors hover:bg-white/10 hover:text-white";

  return (
    <div
      className="relative flex h-full w-full overflow-hidden"
      style={{
        ["--sheet-offset" as string]:
          sheet === "min" ? "76px" : sheet === "half" ? "calc(46% + 12px)" : "calc(88% + 12px)",
      }}
    >
      {/* Map canvas */}
      <div className="relative min-w-0 flex-1">
        <GinkgoMap onReady={(api) => (apiRef.current = api)} onAreaDrawn={onAreaDrawn} />

        {/* Search */}
        <div className="pointer-events-none absolute left-3 right-[60px] top-3 z-[1000] lg:right-auto lg:w-[380px]">
          <div className="pointer-events-auto">
            <MapSearch onSelect={onPlace} near={aoi ? bboxCenter(aoi.bbox) : undefined} />
          </div>
        </div>

        {/* Toolbar */}
        <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
          <div className="glass flex flex-col overflow-hidden rounded-xl">
            <button
              className={cn(
                toolBtn,
                layersOpen && "bg-white text-[#090a0c] hover:bg-white hover:text-[#090a0c]",
              )}
              onClick={() => setLayersOpen((o) => !o)}
              title="Layers"
              aria-label="Layers"
              aria-expanded={layersOpen}
            >
              <Layers className="h-[18px] w-[18px]" />
            </button>
            <button
              className={cn(
                toolBtn,
                "border-t border-white/[0.08]",
                drawMode && "bg-white text-[#090a0c] hover:bg-white hover:text-[#090a0c]",
              )}
              onClick={() => (drawMode ? setDrawMode(false) : startDraw())}
              title="Draw area"
              aria-label="Draw area"
              aria-pressed={drawMode}
            >
              <MousePointerSquareDashed className="h-[18px] w-[18px]" />
            </button>
            <button
              className={cn(toolBtn, "border-t border-white/[0.08]")}
              onClick={analyseView}
              title="Analyse current view"
              aria-label="Analyse current view"
            >
              <ScanSearch className="h-[18px] w-[18px]" />
            </button>
          </div>
          <div className="glass flex flex-col overflow-hidden rounded-xl">
            <button
              className={toolBtn}
              onClick={() => apiRef.current?.zoomIn()}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <Plus className="h-[18px] w-[18px]" />
            </button>
            <button
              className={cn(toolBtn, "border-t border-white/[0.08]")}
              onClick={() => apiRef.current?.zoomOut()}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <Minus className="h-[18px] w-[18px]" />
            </button>
            <button
              className={cn(toolBtn, "border-t border-white/[0.08]")}
              onClick={locate}
              title="My location"
              aria-label="My location"
            >
              <LocateFixed className="h-[18px] w-[18px]" />
            </button>
            {analysis && (
              <button
                className={cn(toolBtn, "border-t border-white/[0.08]")}
                onClick={() => fitBounds(analysis.aoi.bbox)}
                title="Zoom to area"
                aria-label="Zoom to analysed area"
              >
                <Focus className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        </div>

        {layersOpen && (
          <div className="absolute right-[60px] top-3 z-[1001]">
            <MapLayersPanel onClose={() => setLayersOpen(false)} />
          </div>
        )}

        {/* Draw hint */}
        {drawMode && (
          <div className="absolute left-1/2 top-16 z-[1000] w-[min(92%,440px)] -translate-x-1/2 animate-slide-up">
            <div className="glass flex items-center gap-3 rounded-xl px-3.5 py-2.5">
              <MousePointerSquareDashed className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-[12.5px] leading-snug">
                <b>Drag</b> to draw an area, or <b>tap once</b> for a 1 km square.
              </span>
              <button onClick={() => setDrawMode(false)} className={btn.ghost}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Place CTA */}
        {pending && !drawMode && status !== "running" && sheet !== "full" && (
          <div className="absolute bottom-[var(--sheet-offset)] left-1/2 z-[1000] w-[min(92%,420px)] -translate-x-1/2 animate-slide-up lg:bottom-6">
            <div className="glass rounded-xl p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{pending.name}</div>
                  <div className="truncate text-[11.5px] text-[#94a3b8]">{pending.detail}</div>
                </div>
                <button
                  onClick={() => setPending(null)}
                  className="rounded p-1 text-[#94a3b8] hover:text-white"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button onClick={() => analysePlace(pending)} className={btn.primary}>
                  <ScanSearch className="h-3.5 w-3.5" /> Analyse here
                </button>
                <button onClick={startDraw} className={btn.secondary}>
                  <MousePointerSquareDashed className="h-3.5 w-3.5" /> Draw instead
                </button>
              </div>
            </div>
          </div>
        )}

        {notice && (
          <div
            className="absolute left-1/2 top-16 z-[1002] w-[min(92%,460px)] -translate-x-1/2 animate-slide-up"
            role="status"
          >
            <div className="glass rounded-xl px-3.5 py-2.5 text-[12.5px]">{notice}</div>
          </div>
        )}

        <MapLegend
          className={cn(
            "absolute bottom-[var(--sheet-offset)] left-3 z-[900] lg:bottom-7",
            sheet === "full" && "max-lg:hidden",
          )}
        />
      </div>

      {/* Panel: right column on desktop, bottom sheet on mobile */}
      <aside
        className={cn(
          "absolute inset-x-0 bottom-0 z-[1005] flex flex-col rounded-t-2xl border-t border-white/[0.1] bg-[#14161b] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] transition-[height] duration-300",
          "lg:static lg:z-auto lg:h-full lg:w-[38%] lg:min-w-[380px] lg:max-w-[500px] lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none",
          sheet === "min" ? "h-[64px]" : sheet === "half" ? "h-[46%]" : "h-[88%]",
        )}
        aria-label="Analysis panel"
      >
        <button
          className="flex w-full shrink-0 items-center justify-center gap-2 pb-1 pt-2 text-[#94a3b8] lg:hidden"
          onClick={() => setSheet((s) => (s === "half" ? "full" : s === "full" ? "min" : "half"))}
          aria-label={sheet === "full" ? "Collapse panel" : "Expand panel"}
        >
          <span className="h-1 w-10 rounded-full bg-white/25" />
          {sheet === "full" ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </button>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto scroll-thin lg:overflow-hidden",
            sheet === "min" && "overflow-hidden",
          )}
        >
          {status === "running" ? (
            <RunningPanel />
          ) : status === "error" ? (
            <ErrorPanel />
          ) : analysis ? (
            <ResultsPanel analysis={analysis} />
          ) : (
            <StartPanel onDraw={startDraw} onUseView={analyseView} />
          )}
        </div>
      </aside>
    </div>
  );
}
