import { useState, useRef, useEffect, useCallback } from "react";
import {
  SlidersHorizontal,
  Sparkles,
  Flame,
  Droplets,
  Layers,
  ChevronDown,
  X,
  RefreshCw,
} from "lucide-react";
import { useGinkgo } from "@/state/ginkgo-store";

interface SideBySideSliderProps {
  t1Label?: string;
  t2Label?: string;
  onSelectHotspot?: (id: string) => void;
}

export type ViewMode = "slider" | "landcover" | "heatmap" | "flood" | "ndvi";

export interface PresetScene {
  id: string;
  name: string;
  locality: string;
  t1TileUrl: string;
  t2TileUrl: string;
  hasFlood: boolean;
  netChange: string;
}

export const PRESET_SCENES: PresetScene[] = [
  {
    id: "putrajaya_core",
    name: "Presint 11 Sector",
    locality: "Putrajaya Central District",
    t1TileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/8046/12818",
    t2TileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/8046/12818",
    hasFlood: false,
    netChange: "+4.2 km² Built-up",
  },
  {
    id: "putra_heights_flood",
    name: "Putra Heights Corridor",
    locality: "Klang River Catchment",
    t1TileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/8044/12812",
    t2TileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/8044/12812",
    hasFlood: true,
    netChange: "+18.4% River Surge",
  },
  {
    id: "sungai_buah_basin",
    name: "Sungai Buah Basin",
    locality: "Hulu Langat Hydrological Sector",
    t1TileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/8038/12828",
    t2TileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/8038/12828",
    hasFlood: true,
    netChange: "+24.6% Inundation",
  },
  {
    id: "alpine_valley",
    name: "Sri Damai Reserve",
    locality: "Hulu Langat Forestry Zone",
    t1TileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/8036/12832",
    t2TileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/14/8036/12832",
    hasFlood: false,
    netChange: "-12.3% Tree Canopy",
  },
];

export function SideBySideSlider({
  t1Label = "T1 Baseline: Sentinel-2 Optical (Jan 2023)",
  t2Label = "T2 Observation: AI Segmented Overlay (Jan 2025)",
  onSelectHotspot,
}: SideBySideSliderProps) {
  const {
    customObservationImage,
    setCustomObservationImage,
    presetSceneKey,
    setPresetSceneKey,
  } = useGinkgo();

  const [dividerPos, setDividerPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("slider");
  const [showHotspots, setShowHotspots] = useState(true);
  const [showSceneMenu, setShowSceneMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeScene =
    PRESET_SCENES.find((s) => s.id === presetSceneKey) ?? PRESET_SCENES[0]!;

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setDividerPos(pct);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMove]);

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col bg-[#090a0c]">
      {/* ─── Compact Top HUD Toolbar (Single-Line, 36px Height) ─── */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none gap-2">
        {/* Left: View Mode Segmented Switcher */}
        <div className="flex items-center gap-1 glass-panel rounded-xl p-1 shadow-2xl pointer-events-auto backdrop-blur-md border border-white/10">
          <button
            onClick={() => setViewMode("slider")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "slider"
                ? "bg-white text-[#090a0c] shadow-sm"
                : "text-[#94a3b8] hover:text-white hover:bg-white/5"
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>Dual Slider</span>
          </button>

          <button
            onClick={() => setViewMode("landcover")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "landcover"
                ? "bg-white text-[#090a0c] shadow-sm"
                : "text-[#94a3b8] hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>5-Class Land Cover</span>
          </button>

          <button
            onClick={() => setViewMode("heatmap")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "heatmap"
                ? "bg-white text-[#090a0c] shadow-sm"
                : "text-[#94a3b8] hover:text-white hover:bg-white/5"
            }`}
          >
            <Flame className="h-3 w-3 text-[#ef4444]" />
            <span>Change Heatmap</span>
          </button>

          <button
            onClick={() => setViewMode("flood")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "flood"
                ? "bg-white text-[#090a0c] shadow-sm"
                : "text-[#94a3b8] hover:text-white hover:bg-white/5"
            }`}
          >
            <Droplets className="h-3 w-3 text-[#38bdf8]" />
            <span>Flood Hazard</span>
          </button>

          <button
            onClick={() => setViewMode("ndvi")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "ndvi"
                ? "bg-white text-[#090a0c] shadow-sm"
                : "text-[#94a3b8] hover:text-white hover:bg-white/5"
            }`}
          >
            NDVI
          </button>
        </div>

        {/* Right Controls: Preset Scene Switcher + Hotspots + Ingest Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Custom Ingested File Active Badge */}
          {customObservationImage && (
            <div className="glass-panel rounded-xl px-2.5 py-1 flex items-center gap-2 border border-[#10b981]/50 bg-[#10b981]/10 text-xs text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className="font-semibold text-[11px]">Custom Scene Active</span>
              <button
                onClick={() => setCustomObservationImage(null)}
                className="text-[#94a3b8] hover:text-white ml-1"
                title="Reset to Sentinel-2 Basemap"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Preset Scene Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSceneMenu((s) => !s)}
              className="glass-panel rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-white hover:bg-[#1e2129] transition-colors border border-white/10"
            >
              <Layers className="h-3 w-3 text-white" />
              <span>{activeScene.name}</span>
              <ChevronDown className="h-3 w-3 text-[#94a3b8]" />
            </button>

            {showSceneMenu && (
              <div className="absolute top-10 right-0 z-50 w-64 glass-panel rounded-2xl p-2 animate-slide-up shadow-2xl space-y-1 border border-white/10 bg-[#14161b]">
                <div className="px-2 py-1 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider border-b border-white/6">
                  Select Benchmark Satellite Scene
                </div>
                {PRESET_SCENES.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      setPresetSceneKey(scene.id);
                      setCustomObservationImage(null);
                      setShowSceneMenu(false);
                    }}
                    className={`w-full text-left rounded-xl px-3 py-2 text-xs transition-colors ${
                      presetSceneKey === scene.id && !customObservationImage
                        ? "bg-white text-black font-semibold shadow-md"
                        : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{scene.name}</span>
                      <span className="text-[9px] font-mono opacity-60">
                        {scene.hasFlood ? "🌊 Flood Risk" : "🌱 Urban Core"}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#64748b] mt-0.5">{scene.locality}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Highlight Hotspots Toggle */}
          <div className="glass-panel rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 border border-white/10">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-white">
              <input
                type="checkbox"
                checked={showHotspots}
                onChange={(e) => setShowHotspots(e.target.checked)}
                className="accent-white rounded h-3 w-3"
              />
              <span className="hidden sm:inline">Hotspots</span>
            </label>
          </div>
        </div>
      </div>

      {/* ─── Main Comparison Canvas ─── */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full overflow-hidden select-none cursor-crosshair"
      >
        {/* Background Layer: T2 Observation (Custom Ingested Image OR Tile Basemap) */}
        <div className="absolute inset-0 w-full h-full">
          {customObservationImage ? (
            <img
              src={customObservationImage}
              alt="Custom Observation Scene"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url('${activeScene.t2TileUrl}')`,
                filter: "contrast(1.05) brightness(0.9)",
                backgroundSize: "cover",
              }}
            />
          )}

          {/* 5-Class Land Cover Mode Overlays */}
          {viewMode === "landcover" && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon points="15,30 35,25 40,48 20,55" fill="rgba(220, 53, 69, 0.55)" stroke="#DC3545" strokeWidth="0.8" />
              <polygon points="55,15 88,10 92,45 60,50" fill="rgba(40, 167, 69, 0.5)" stroke="#28A745" strokeWidth="0.8" />
              <path d="M 35,10 Q 42,40 52,65 T 70,90 L 78,90 Q 60,60 50,40 Z" fill="rgba(0, 123, 255, 0.55)" stroke="#007BFF" strokeWidth="0.8" />
              <polygon points="42,50 58,48 60,65 44,68" fill="rgba(238, 155, 0, 0.5)" stroke="#EE9B00" strokeWidth="0.8" />
              <polygon points="20,60 40,58 38,85 18,88" fill="rgba(155, 206, 0, 0.45)" stroke="#9BCE00" strokeWidth="0.8" />
            </svg>
          )}

          {/* Change Heatmap Mode (PyTorch Siamese Diff Heatmap) */}
          {viewMode === "heatmap" && (
            <div
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 40%, rgba(239, 68, 68, 0.65) 0%, rgba(245, 158, 11, 0.35) 40%, transparent 70%), radial-gradient(ellipse at 65% 75%, rgba(56, 189, 248, 0.6) 0%, transparent 60%)",
                mixBlendMode: "screen",
              }}
            />
          )}

          {/* Flood Inundation Mode */}
          {viewMode === "flood" && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 28,10 Q 38,35 48,60 T 68,95 L 88,95 Q 65,55 52,30 Z"
                fill="rgba(56, 189, 248, 0.6)"
                stroke="#38bdf8"
                strokeWidth="1.2"
              />
            </svg>
          )}

          {/* NDVI Spectral Mode */}
          {viewMode === "ndvi" && (
            <div
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 70% 30%, rgba(16, 185, 129, 0.65) 0%, transparent 60%)",
                mixBlendMode: "color-dodge",
              }}
            />
          )}

          {/* Default Slider Mode T2 Vector Shapes */}
          {viewMode === "slider" && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 35,10 Q 42,40 52,65 T 70,90 L 80,90 Q 60,60 50,40 Z"
                fill="rgba(56, 189, 248, 0.45)"
                stroke="#38bdf8"
                strokeWidth="0.75"
                strokeDasharray="2 2"
              />
              <polygon
                points="18,35 32,30 36,45 22,50"
                fill="rgba(239, 68, 68, 0.4)"
                stroke="#ef4444"
                strokeWidth="0.8"
              />
            </svg>
          )}

          {/* Floating Label for T2 */}
          <div className="absolute top-14 right-3 z-10 glass-panel rounded-lg px-2.5 py-1 text-[10px] font-medium text-white shadow-xl">
            {customObservationImage ? "Custom Ingested Scene (T2)" : t2Label}
          </div>
        </div>

        {/* Foreground Layer: T1 Baseline (Clipped via Slider divider position) */}
        {viewMode === "slider" && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${dividerPos}%` }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100vw",
                height: "100%",
                backgroundImage: `url('${activeScene.t1TileUrl}')`,
                filter: "grayscale(0.15) brightness(0.95)",
                backgroundSize: "cover",
              }}
            />
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 38,10 Q 45,40 54,65 T 72,90"
                fill="none"
                stroke="rgba(56, 189, 248, 0.8)"
                strokeWidth="2.5"
              />
            </svg>
            <div className="absolute top-14 left-3 z-10 glass-panel rounded-lg px-2.5 py-1 text-[10px] font-medium text-white shadow-xl">
              {t1Label}
            </div>
          </div>
        )}

        {/* ─── Draggable Slider Divider Handle ─── */}
        {viewMode === "slider" && (
          <div
            className="absolute top-0 bottom-0 z-30 flex items-center justify-center cursor-ew-resize group"
            style={{ left: `${dividerPos}%`, transform: "translateX(-50%)" }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <div className="w-[2px] h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
            <div className="absolute h-7 w-7 rounded-full bg-white shadow-2xl flex items-center justify-center border border-[#14161b] text-[#090a0c] group-hover:scale-110 transition-transform">
              <SlidersHorizontal className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* ─── Priority Hotspot Markers ─── */}
        {showHotspots && (
          <>
            <div
              onClick={() => onSelectHotspot?.("hotspot-flood")}
              className="absolute z-20 cursor-pointer animate-pulse-soft"
              style={{ top: "60%", left: "55%" }}
            >
              <div className="glass-panel rounded-full px-2 py-0.5 flex items-center gap-1.5 border border-[#38bdf8] shadow-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8]" />
                <span className="text-[10px] font-semibold text-white">River Surge +18.4%</span>
              </div>
            </div>

            <div
              onClick={() => onSelectHotspot?.("hotspot-canopy")}
              className="absolute z-20 cursor-pointer animate-pulse-soft"
              style={{ top: "38%", left: "26%" }}
            >
              <div className="glass-panel rounded-full px-2 py-0.5 flex items-center gap-1.5 border border-[#ef4444] shadow-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                <span className="text-[10px] font-semibold text-white">Canopy Loss -12.3%</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Bottom Legend & Telemetry Bar ─── */}
      <div className="h-8 px-4 flex items-center justify-between border-t border-white/6 bg-[#090a0c] font-mono text-[10px] text-[#94a3b8]">
        {viewMode === "landcover" ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#DC3545]" /> Urban</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#28A745]" /> Vegetation</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#007BFF]" /> Water</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#EE9B00]" /> Soil</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#9BCE00]" /> Agriculture</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span>SENTINEL-2 L2A (10M GSD)</span>
            <span className="text-white/20">|</span>
            <span>PYTORCH SIAMESE U-NET</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
          <span>{activeScene.netChange}</span>
        </div>
      </div>
    </div>
  );
}
