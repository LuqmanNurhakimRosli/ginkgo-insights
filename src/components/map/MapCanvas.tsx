import { useMemo } from "react";
import { sites } from "@/data/sites";
import { useGinkgo } from "@/state/ginkgo-store";
import type { MapFeature } from "@/types";
import { cn } from "@/lib/utils";

/** Deterministic pseudo-random so the "imagery" never flickers between renders. */
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
  for (let i = 0; i < 260; i++) {
    const x = r() * 100;
    const y = r() * 100;
    out.push({
      x,
      y,
      w: 1.4 + r() * 3.6,
      h: 1.2 + r() * 3,
      tone: r(),
      veg: r() > 0.52,
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
  site: "#3fb08c",
  candidate: "#3fb08c",
  risk: "#e2643f",
  growth: "#e0a63c",
};

export function MapCanvas({
  className,
  interactive = true,
  overlay,
}: {
  className?: string;
  interactive?: boolean;
  overlay?: "change" | "flood" | "landuse" | "accessibility" | "suitability";
}) {
  const {
    activeLayers,
    center,
    zoom,
    selectedSiteId,
    selectSite,
    highlightedFeatures,
  } = useGinkgo();
  const blocks = useMemo(buildBlocks, []);
  const on = (id: string) => activeLayers.includes(id);

  const tx = 50 - center[0] * zoom;
  const ty = 50 - center[1] * zoom;

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-[#0f1a17]", className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id="gk-base" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#16241f" />
            <stop offset="55%" stopColor="#1b2a24" />
            <stop offset="100%" stopColor="#121d1a" />
          </linearGradient>
          <linearGradient id="gk-access" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3fb08c" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#e0a63c" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#e2643f" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="gk-suit" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#e2643f" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#e0a63c" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3fb08c" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        <rect width="100" height="100" fill="url(#gk-base)" />

        <g
          transform={`translate(${tx} ${ty}) scale(${zoom})`}
          style={{ transition: "transform 600ms cubic-bezier(0.22,1,0.36,1)" }}
        >
          {/* Imagery texture */}
          {(on("sat-t2") || on("sat-t1")) &&
            blocks.map((b, i) => (
              <rect
                key={i}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx={0.3}
                fill={b.veg ? "#24382c" : "#2c332f"}
                opacity={0.35 + b.tone * 0.5}
              />
            ))}

          {/* Water */}
          <path d={river} fill="#16313f" opacity={0.9} />

          {/* Flood extent */}
          {(on("flood") || overlay === "flood") && (
            <path d={river} fill="#2f6fb0" opacity={0.28} transform="scale(1.06) translate(-3,-3)" />
          )}

          {/* Accessibility / suitability surfaces */}
          {overlay === "accessibility" && (
            <rect width="100" height="100" fill="url(#gk-access)" opacity={0.55} />
          )}
          {overlay === "suitability" && (
            <rect width="100" height="100" fill="url(#gk-suit)" opacity={0.6} />
          )}

          {/* Roads */}
          {on("roads") &&
            roads.map((d, i) => (
              <g key={i}>
                <path d={d} stroke="#0d1512" strokeWidth={1.5} fill="none" opacity={0.7} />
                <path d={d} stroke="#c9d3cd" strokeWidth={0.55} fill="none" opacity={0.62} />
              </g>
            ))}

          {/* Administrative boundary */}
          {on("boundary") && (
            <rect
              x="8"
              y="8"
              width="84"
              height="84"
              fill="none"
              stroke="#9aa5b1"
              strokeWidth={0.35}
              strokeDasharray="2 1.6"
              opacity={0.7}
            />
          )}

          {/* Change detection patches */}
          {(on("change") || overlay === "change") && (
            <g opacity={0.72}>
              <path d="M52,30 L64,27 L68,37 L56,41 Z" fill="#d1495b" />
              <path d="M70,42 L82,40 L84,49 L72,52 Z" fill="#d1495b" />
              <path d="M36,58 L47,56 L49,64 L38,66 Z" fill="#e0a63c" />
              <path d="M22,40 L31,38 L33,46 L24,48 Z" fill="#e0a63c" />
              <path d="M60,70 L69,68 L71,75 L62,77 Z" fill="#2f6fb0" />
            </g>
          )}

          {/* Public facilities */}
          {on("facilities") &&
            [
              [40, 38],
              [58, 52],
              [72, 34],
              [33, 68],
              [80, 70],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={0.9} fill="#f0b96b" stroke="#0d1512" strokeWidth={0.25} />
            ))}

          {/* Sites / land use parcels */}
          {on("landuse") &&
            sites.map((s) => {
              const selected = s.id === selectedSiteId;
              return (
                <polygon
                  key={s.id}
                  points={s.polygon.map((p) => p.join(",")).join(" ")}
                  fill={selected ? "#3fb08c" : "#7fb8a3"}
                  fillOpacity={selected ? 0.32 : 0.16}
                  stroke={selected ? "#5fe0b4" : "#a9c9bd"}
                  strokeWidth={selected ? 0.7 : 0.35}
                  className={interactive ? "cursor-pointer" : undefined}
                  onClick={interactive ? () => selectSite(s.id) : undefined}
                  style={{ transition: "fill-opacity 250ms ease, stroke 250ms ease" }}
                />
              );
            })}

          {/* AI highlights */}
          {highlightedFeatures.map((f) => (
            <g key={f.id}>
              <polygon
                points={f.polygon.map((p) => p.join(",")).join(" ")}
                fill={featureColor[f.kind]}
                fillOpacity={0.28}
                stroke={featureColor[f.kind]}
                strokeWidth={0.9}
                className="fade-up"
              />
              <text
                x={f.polygon[0]![0]}
                y={f.polygon[0]![1] - 1.4}
                fontSize={2.2}
                fill="#eaf5f0"
                fontWeight={600}
              >
                {f.label}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-white/55">
        Prototype map canvas · MapLibre-ready
      </div>
    </div>
  );
}
