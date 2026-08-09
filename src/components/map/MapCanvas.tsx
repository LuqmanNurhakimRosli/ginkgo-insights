import { useMemo, useState, useRef } from "react";
import { sites } from "@/data/sites";
import { useGinkgo } from "@/state/ginkgo-store";
import type { MapFeature } from "@/types";
import { cn } from "@/lib/utils";
import { RotateCcw, Plus, Minus, Layers, Image as ImageIcon } from "lucide-react";

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  tone: number;
  veg: boolean;
}

function buildBlocks(): Block[] {
  const r = rand(88);
  const out: Block[] = [];
  for (let i = 0; i < 340; i++) {
    const x = r() * 100;
    const y = r() * 100;
    out.push({
      x,
      y,
      w: 1.2 + r() * 4.2,
      h: 1.0 + r() * 3.8,
      tone: r(),
      veg: r() > 0.48,
    });
  }
  return out;
}

const roads = [
  "M0,38 C22,34 40,44 62,40 S88,30 100,34",
  "M0,66 C24,62 44,72 66,66 S90,58 100,62",
  "M30,0 C34,26 26,52 32,78 S28,94 30,100",
  "M68,0 C64,22 74,48 68,72 S72,92 70,100",
  "M0,14 C30,18 60,8 100,16",
];

const river =
  "M-2,88 C14,80 22,72 34,74 C46,76 52,66 64,64 C76,62 88,52 102,54 L102,64 C88,62 76,72 64,74 C52,76 46,86 34,84 C22,82 14,92 -2,98 Z";

const featureColor: Record<MapFeature["kind"], string> = {
  site: "#5EEAD4",
  candidate: "#22C55E",
  risk: "#EF4444",
  growth: "#EAB308",
};

export type BasemapMode = "satellite" | "vector" | "sentinel";

export function MapCanvas({
  className,
  interactive = true,
  overlay,
}: {
  className?: string | undefined;
  interactive?: boolean | undefined;
  overlay?: "change" | "flood" | "landuse" | "accessibility" | "suitability" | undefined;
}) {
  const {
    activeLayers,
    center,
    zoom,
    setZoom,
    panBy,
    selectedSiteId,
    selectSite,
    highlightedFeatures,
    resetView,
    thinking,
  } = useGinkgo();

  const [basemap, setBasemap] = useState<BasemapMode>("satellite");
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const blocks = useMemo(buildBlocks, []);
  const on = (id: string) => activeLayers.includes(id);

  const tx = 50 - center[0] * zoom;
  const ty = 50 - center[1] * zoom;

  const isCameraMoved = center[0] !== 50 || center[1] !== 50 || zoom !== 1;

  // Live dynamic LAT / LON coordinates
  const latVal = (2.9264 + (50 - center[1]) * 0.0008).toFixed(4);
  const lonVal = (101.6964 + (center[0] - 50) * 0.0008).toFixed(4);

  // Wheel zoom in / out
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!interactive) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(zoom * zoomFactor);
  };

  // Drag panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !interactive) return;
    const dx = (e.clientX - dragStartRef.current.x) * 0.08 / zoom;
    const dy = (e.clientY - dragStartRef.current.y) * 0.08 / zoom;
    panBy(-dx, -dy);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  return (
    <div
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={cn(
        "relative h-full w-full overflow-hidden bg-[#050608] select-none",
        interactive ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "",
        className
      )}
    >
      {/* Radar sweep effect when AI is thinking */}
      {thinking && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden opacity-20">
          <div className="h-[200%] w-[200%] animate-radar bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(94,234,212,0.4)_360deg)]" />
        </div>
      )}

      {/* High-Tech Grid Pattern overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-full w-full pointer-events-none">
        <defs>
          <linearGradient id="gk-dark-sat" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#080a0e" />
            <stop offset="45%" stopColor="#0e131b" />
            <stop offset="100%" stopColor="#06080c" />
          </linearGradient>
          <linearGradient id="gk-sentinel-rgb" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0c1d18" />
            <stop offset="50%" stopColor="#142a22" />
            <stop offset="100%" stopColor="#0a1612" />
          </linearGradient>
          <linearGradient id="gk-access" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#EAB308" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="gk-suit" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#F97316" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.4" />
          </linearGradient>

          {/* High-Resolution Satellite Texture Noise */}
          <pattern id="sat-texture" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#0c1118" />
            <rect x="1" y="1" width="3" height="3" fill="#121a24" opacity="0.8" />
            <rect x="5" y="4" width="4" height="5" fill="#090e14" opacity="0.9" />
            <rect x="2" y="6" width="3" height="2" fill="#1a2636" opacity="0.6" />
          </pattern>
        </defs>

        {/* Base Layer depending on selected basemap mode */}
        <rect
          width="100"
          height="100"
          fill={
            basemap === "satellite"
              ? "url(#gk-dark-sat)"
              : basemap === "sentinel"
              ? "url(#gk-sentinel-rgb)"
              : "#0B0C0E"
          }
        />

        <g
          transform={`translate(${tx} ${ty}) scale(${zoom})`}
          style={{ transition: isDragging ? "none" : "transform 400ms cubic-bezier(0.22,1,0.36,1)" }}
        >
          {/* Realistic High-Res Satellite Raster Tiles / Textures */}
          {basemap !== "vector" && (
            <g opacity={basemap === "satellite" ? 0.95 : 0.8}>
              <rect x="0" y="0" width="100" height="100" fill="url(#sat-texture)" opacity={0.6} />
              {blocks.map((b, i) => (
                <rect
                  key={i}
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx={0.15}
                  fill={
                    b.veg
                      ? basemap === "sentinel"
                        ? "#153828"
                        : "#142820"
                      : "#1e242c"
                  }
                  stroke={b.veg ? "#0c1d15" : "#12171d"}
                  strokeWidth={0.08}
                  opacity={0.5 + b.tone * 0.45}
                />
              ))}
            </g>
          )}

          {/* River */}
          <path d={river} fill={basemap === "sentinel" ? "#0a344d" : "#0d2433"} opacity={0.95} />

          {/* Flood overlay */}
          {(on("flood") || overlay === "flood") && (
            <path d={river} fill="#EF4444" opacity={0.4} transform="scale(1.06) translate(-3,-3)" />
          )}

          {/* Overlays */}
          {overlay === "accessibility" && (
            <rect width="100" height="100" fill="url(#gk-access)" opacity={0.6} />
          )}
          {overlay === "suitability" && (
            <rect width="100" height="100" fill="url(#gk-suit)" opacity={0.65} />
          )}

          {/* Road Network Vectors */}
          {on("roads") &&
            roads.map((d, i) => (
              <g key={i}>
                <path d={d} stroke="#000" strokeWidth={1.4} fill="none" opacity={0.85} />
                <path d={d} stroke="#5EEAD4" strokeWidth={0.45} fill="none" opacity={0.7} />
              </g>
            ))}

          {/* Admin Boundary */}
          {on("boundary") && (
            <rect
              x="8"
              y="8"
              width="84"
              height="84"
              fill="none"
              stroke="#5EEAD4"
              strokeWidth={0.3}
              strokeDasharray="1.5 1.5"
              opacity={0.5}
            />
          )}

          {/* Change Detection Patches */}
          {(on("change") || overlay === "change") && (
            <g opacity={0.85}>
              <path d="M52,30 L64,27 L68,37 L56,41 Z" fill="#EF4444" />
              <path d="M70,42 L82,40 L84,49 L72,52 Z" fill="#EF4444" />
              <path d="M36,58 L47,56 L49,64 L38,66 Z" fill="#F97316" />
              <path d="M22,40 L31,38 L33,46 L24,48 Z" fill="#EAB308" />
              <path d="M60,70 L69,68 L71,75 L62,77 Z" fill="#22C55E" />
            </g>
          )}

          {/* Land Use / Site Parcels */}
          {on("landuse") &&
            sites.map((s) => {
              const selected = s.id === selectedSiteId;
              return (
                <polygon
                  key={s.id}
                  points={s.polygon.map((p) => p.join(",")).join(" ")}
                  fill={selected ? "#5EEAD4" : "#1E2024"}
                  fillOpacity={selected ? 0.38 : 0.22}
                  stroke={selected ? "#5EEAD4" : "rgba(255,255,255,0.3)"}
                  strokeWidth={selected ? 1.0 : 0.35}
                  className={interactive ? "cursor-pointer pointer-events-auto transition-all" : "pointer-events-none"}
                  onClick={interactive ? (e) => { e.stopPropagation(); selectSite(s.id); } : undefined}
                />
              );
            })}

          {/* AI Highlights */}
          {highlightedFeatures.map((f) => (
            <g key={f.id}>
              <polygon
                points={f.polygon.map((p) => p.join(",")).join(" ")}
                fill={featureColor[f.kind]}
                fillOpacity={0.4}
                stroke={featureColor[f.kind]}
                strokeWidth={1.1}
              />
              <text
                x={f.polygon[0]![0]}
                y={f.polygon[0]![1] - 1.2}
                fontSize={2}
                fill="#F5F5F4"
                fontFamily="monospace"
                fontWeight={600}
              >
                {f.label}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* Floating Zoom & Map Control Toolbar + Basemap Switcher (Bottom-Left overlay) */}
      {interactive && (
        <div className="absolute bottom-6 left-6 z-30 flex items-center gap-1.5 rounded border border-white/10 bg-[#16171A]/95 p-1 shadow-2xl backdrop-blur font-mono text-[10px] uppercase text-[#F5F5F4]">
          <button
            onClick={() => setZoom(zoom * 1.25)}
            title="Zoom In"
            className="flex h-7 w-7 items-center justify-center rounded border border-white/5 bg-white/5 hover:bg-white/15 hover:text-[#5EEAD4]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(zoom / 1.25)}
            title="Zoom Out"
            className="flex h-7 w-7 items-center justify-center rounded border border-white/5 bg-white/5 hover:bg-white/15 hover:text-[#5EEAD4]"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={resetView}
            title="Reset View"
            className="flex h-7 px-2 items-center justify-center gap-1 rounded border border-white/5 bg-white/5 hover:bg-white/15 hover:text-[#5EEAD4]"
          >
            <RotateCcw className="h-3 w-3" />
            <span>RESET</span>
          </button>
          <span className="px-2 font-semibold text-[#5EEAD4] num">
            SCALE: {Math.round(zoom * 100)}%
          </span>

          <span className="text-white/10">|</span>

          {/* Production Basemap Switcher */}
          <div className="flex gap-0.5">
            {(["satellite", "vector", "sentinel"] as BasemapMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setBasemap(mode)}
                className={`rounded px-2 py-1 text-[9px] font-semibold tracking-wider transition-all ${
                  basemap === mode
                    ? "bg-[#5EEAD4] text-[#0B0C0E]"
                    : "text-[#9CA3AF] hover:bg-white/5 hover:text-[#F5F5F4]"
                }`}
              >
                {mode === "satellite" ? "🛰️ SATELLITE" : mode === "vector" ? "🗺️ VECTOR" : "🛰️ SENTINEL RGB"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera Reset Toast / Notification */}
      {isCameraMoved && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 rounded border border-white/10 bg-[#16171A]/95 px-3 py-1.5 font-mono text-[10px] uppercase text-[#F5F5F4] backdrop-blur shadow-2xl">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5EEAD4] animate-cyan-pulse" />
          <span>MAP CAMERA ADJUSTED</span>
          <button
            onClick={resetView}
            className="ml-2 flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[#5EEAD4] hover:bg-white/10"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            <span>RESET VIEW</span>
          </button>
        </div>
      )}

      {/* Coordinate & Grid HUD watermark */}
      <div className="pointer-events-none absolute bottom-2 right-3 z-20 font-mono text-[9px] uppercase tracking-widest text-[#5B5F66]">
        GRID: 100m² | LAT: {latVal} N | LON: {lonVal} E
      </div>
    </div>
  );
}
