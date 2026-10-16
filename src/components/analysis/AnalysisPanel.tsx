import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Crosshair,
  FileText,
  MousePointerSquareDashed,
  RefreshCw,
  ScanSearch,
  Sparkles,
  Waves,
  X,
} from "lucide-react";
import { PRESET_AREAS } from "@/data/presets";
import { RISK_COLORS } from "@/lib/geo/flood";
import { formatArea, formatDistance, round } from "@/lib/geo/math";
import { recommendations } from "@/lib/geo/recommend";
import { LAND_COLORS, LAND_LABELS } from "@/lib/geo/render";
import { useGinkgo } from "@/state/ginkgo-store";
import { LandClass, type AreaAnalysis } from "@/types/geo";
import {
  Bar,
  btn,
  ClassBadge,
  FlagIcon,
  RiskBadge,
  ScoreRing,
  SectionLabel,
  Segmented,
  Spinner,
  Stat,
  scoreColor,
} from "@/components/gk/ui";
import { cn } from "@/lib/utils";
import { FloodExplain } from "./FloodExplain";

export function ShareBar({
  segments,
  className,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div
      className={cn("flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full", className)}
      role="img"
      aria-label={segments
        .map((s) => `${s.label} ${round((s.value / total) * 100, 1)}%`)
        .join(", ")}
    >
      {segments.map((s) =>
        s.value > 0 ? (
          <div
            key={s.label}
            className="h-full min-w-[3px] first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            title={`${s.label} ${round((s.value / total) * 100, 1)}%`}
          />
        ) : null,
      )}
    </div>
  );
}

// ─── Idle ───────────────────────────────────────────────────────────────────

export function StartPanel({ onDraw, onUseView }: { onDraw: () => void; onUseView: () => void }) {
  const { runPreset, savedAreas, runAnalysis } = useGinkgo();
  return (
    <div className="space-y-5 p-4 animate-fade-in">
      <div>
        <h2 className="text-[16px] font-semibold tracking-tight">Screen any area in Malaysia</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[#94a3b8]">
          Search a place, then draw an area on the map. Ginkgo pulls real elevation (SRTM) and
          OpenStreetMap rivers, land use, roads and facilities, and computes riverine flood
          susceptibility, livability and development suitability with transparent formulas.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onDraw} className={cn(btn.primary, "py-2.5")}>
          <MousePointerSquareDashed className="h-4 w-4" /> Draw area
        </button>
        <button onClick={onUseView} className={cn(btn.secondary, "py-2.5")}>
          <ScanSearch className="h-4 w-4" /> Analyse view
        </button>
      </div>
      <ol className="space-y-1.5 text-[12px] text-[#94a3b8]">
        <li>
          <span className="mr-1.5 text-white">1.</span>Search or pan to a location
        </li>
        <li>
          <span className="mr-1.5 text-white">2.</span>Drag a rectangle (or tap once for a 1 km
          square)
        </li>
        <li>
          <span className="mr-1.5 text-white">3.</span>Tap any cell inside the area to see why it
          scored that way
        </li>
      </ol>
      <div>
        <SectionLabel className="mb-2">Quick areas</SectionLabel>
        <div className="space-y-1.5">
          {PRESET_AREAS.map((p) => (
            <button
              key={p.id}
              onClick={() => runPreset(p.id)}
              className="flex w-full items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.05]"
            >
              <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-[#94a3b8]" />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium text-white">
                  {p.name} <span className="font-normal text-[#64748b]">· {p.locality}</span>
                </span>
                <span className="block text-[11px] leading-snug text-[#94a3b8]">{p.purpose}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      {savedAreas.length > 0 && (
        <div>
          <SectionLabel className="mb-2">Saved areas</SectionLabel>
          <div className="space-y-1.5">
            {savedAreas.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => void runAnalysis({ ...s.aoi, createdAt: Date.now() })}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/[0.06] px-3 py-2 text-left hover:bg-white/[0.04]"
              >
                <span className="min-w-0 truncate text-[12.5px]">{s.aoi.name}</span>
                <RiskBadge cls={s.summary.floodClass} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Running / error ────────────────────────────────────────────────────────

export function RunningPanel() {
  const { progress, cancelAnalysis, aoi } = useGinkgo();
  const demDone = !!progress?.demDone;
  const osmDone = !!progress?.osmDone;
  const steps = [
    { id: "dem", label: "Elevation model (SRTM tiles)", done: demDone, active: !demDone },
    { id: "osm", label: "OpenStreetMap rivers, land use, roads", done: osmDone, active: !osmDone },
    {
      id: "model",
      label: "Riverine flood model & scores",
      done: progress?.step === "done",
      active: demDone && osmDone,
    },
  ];
  return (
    <div className="space-y-4 p-4 animate-fade-in" aria-live="polite">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-[11px] text-[#94a3b8]">Analysing</div>
          <div className="truncate text-[15px] font-semibold">{aoi?.name ?? "Selected area"}</div>
        </div>
        <button onClick={cancelAnalysis} className={btn.ghost}>
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
      </div>
      <Bar value={progress?.pct ?? 2} />
      <div className="text-[12px] text-[#cbd5e1]">{progress?.label ?? "Preparing…"}</div>
      <ul className="space-y-2">
        {steps.map(({ id, label, done, active }) => {
          const s = { id, label };
          return (
            <li key={s.id} className="flex items-center gap-2.5 text-[12.5px]">
              {done ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] text-[#090a0c]">
                  ✓
                </span>
              ) : active ? (
                <Spinner className="h-4 w-4 text-white" />
              ) : (
                <span className="h-4 w-4 rounded-full border border-white/20" />
              )}
              <span className={done || active ? "text-white" : "text-[#64748b]"}>{s.label}</span>
            </li>
          );
        })}
      </ul>
      <div className="space-y-2 pt-2">
        <div className="skeleton h-16 rounded-lg" />
        <div className="skeleton h-24 rounded-lg" />
      </div>
    </div>
  );
}

export function ErrorPanel() {
  const { error, aoi, runAnalysis, clearAnalysis } = useGinkgo();
  return (
    <div className="space-y-3 p-4 animate-fade-in" role="alert">
      <div className="flex items-start gap-2.5 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/[0.08] p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#ef4444]" />
        <div className="text-[12.5px]">
          <div className="font-semibold">Analysis could not complete</div>
          <div className="mt-0.5 text-[#cbd5e1]">{error}</div>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-[#94a3b8]">
        Public OpenStreetMap servers occasionally rate-limit busy areas. Try again in a moment or
        draw a smaller area.
      </p>
      <div className="flex gap-2">
        {aoi && (
          <button onClick={() => void runAnalysis(aoi)} className={btn.primary}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        )}
        <button onClick={clearAnalysis} className={btn.secondary}>
          Start over
        </button>
      </div>
    </div>
  );
}

// ─── Results ────────────────────────────────────────────────────────────────

type Tab = "overview" | "flood" | "land" | "access";

export function ResultsPanel({ analysis: a }: { analysis: AreaAnalysis }) {
  const [tab, setTab] = useState<Tab>("overview");
  const { saveCurrentArea, savedAreas, clearAnalysis, inspection } = useGinkgo();
  useEffect(() => {
    if (inspection) setTab("flood");
  }, [inspection]);
  const saved = savedAreas.some((s) => s.aoi.id === a.aoi.id);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/[0.08] px-4 pb-3 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold tracking-tight">{a.aoi.name}</h2>
            <div className="truncate text-[11.5px] text-[#94a3b8]">
              {[
                a.aoi.locality,
                formatArea(a.areaKm2),
                `${a.grid.rows}×${a.grid.cols} cells @ ${Math.round(a.grid.cellW)} m`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => saveCurrentArea()}
              className={btn.icon}
              title={saved ? "Saved — update" : "Save area"}
              aria-label={saved ? "Update saved area" : "Save area"}
            >
              {saved ? (
                <BookmarkCheck className="h-4 w-4 text-white" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={clearAnalysis}
              className={btn.icon}
              title="Clear area"
              aria-label="Clear area"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Segmented<Tab>
          className="mt-3 w-full [&>button]:flex-1"
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview" },
            { value: "flood", label: "Flood" },
            { value: "land", label: "Land use" },
            { value: "access", label: "Access" },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
        <div className="space-y-4 p-4 animate-fade-in" key={tab}>
          {tab === "overview" && <OverviewTab a={a} onTab={setTab} />}
          {tab === "flood" && <FloodTab a={a} />}
          {tab === "land" && <LandTab a={a} />}
          {tab === "access" && <AccessTab a={a} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ a, onTab }: { a: AreaAnalysis; onTab: (t: Tab) => void }) {
  const recs = recommendations(a);
  const s = a.scores;
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onTab("flood")}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-[#0f1115] px-2 py-3 hover:border-white/20"
        >
          <Waves className="h-5 w-5" style={{ color: RISK_COLORS[a.flood.areaClass] }} />
          <RiskBadge cls={a.flood.areaClass} />
          <span className="text-center text-[10.5px] leading-tight text-[#94a3b8]">
            Riverine flood
          </span>
        </button>
        <Link
          to="/livability"
          className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-[#0f1115] px-2 py-2.5 hover:border-white/20"
        >
          <ScoreRing score={s.livability.score} size={54} label="Livability" />
          <span className="text-[10.5px] text-[#94a3b8]">Livability</span>
        </Link>
        <Link
          to="/planning"
          className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-[#0f1115] px-2 py-2.5 hover:border-white/20"
        >
          <ScoreRing score={s.suitability.score} size={54} label="Suitability" />
          <span className="text-[10.5px] text-[#94a3b8]">Suitability</span>
        </Link>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2">
        <span className="text-[12px] text-[#94a3b8]">Development screening</span>
        <ClassBadge cls={s.suitability.cls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label="High flood cells"
          value={round(a.flood.shares.High * 100, 1)}
          unit="%"
          color={RISK_COLORS.High}
        />
        <Stat label="Built-up" value={round(a.landCover.builtUpPct, 1)} unit="%" />
        <Stat label="Green cover" value={round(a.landCover.greenPct, 1)} unit="%" />
        <Stat
          label="Accessibility"
          value={a.access.score}
          unit="/100"
          color={scoreColor(a.access.score)}
        />
      </div>
      <div>
        <SectionLabel className="mb-2">Planning conditions (rule-based)</SectionLabel>
        <ul className="space-y-2">
          {recs.slice(0, 4).map((r) => (
            <li key={r.id} className="rounded-lg border border-white/[0.06] bg-[#0f1115] p-3">
              <div className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      r.priority === "high"
                        ? "#EF4444"
                        : r.priority === "medium"
                          ? "#F59E0B"
                          : "#10B981",
                  }}
                />
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium">{r.title}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-[#94a3b8]">{r.basis}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {a.warnings.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-[#f59e0b]/25 bg-[#f59e0b]/[0.06] p-3">
          {a.warnings.map((w) => (
            <div key={w} className="flex gap-2 text-[11.5px] leading-snug text-[#fcd34d]">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Link to="/reports" className={btn.secondary}>
          <FileText className="h-3.5 w-3.5" /> Report
        </Link>
        <Link to="/ai-copilot" className={btn.secondary}>
          <Sparkles className="h-3.5 w-3.5" /> Ask copilot
        </Link>
      </div>
      <SourceLine a={a} />
    </>
  );
}

export function SourceLine({ a }: { a: AreaAnalysis }) {
  return (
    <p className="text-[10.5px] leading-snug text-[#64748b]">
      Sources: {a.terrain.demSource}; © OpenStreetMap contributors ({a.osm.channels.length}{" "}
      waterways, {a.osm.areas.length} land-use polygons, {a.osm.buildings.length.toLocaleString()}{" "}
      buildings, {a.osm.roads.length} roads, {a.osm.pois.length} facilities). Computed{" "}
      {new Date(a.computedAt).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}
      {a.durationMs ? ` in ${(a.durationMs / 1000).toFixed(1)} s` : ""}.
    </p>
  );
}

function FloodTab({ a }: { a: AreaAnalysis }) {
  const { inspection, focusPeak } = useGinkgo();
  const f = a.flood;
  const cell = inspection ?? f.peak;
  return (
    <>
      <div className="rounded-xl border border-white/[0.08] bg-[#0f1115] p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#94a3b8]">
              Riverine (fluvial) flood susceptibility
            </div>
            <div className="mt-1">
              <RiskBadge cls={f.areaClass} size="md" />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#94a3b8]">Mean / P90 RFSI</div>
            <div className="num text-[15px] font-semibold">
              {f.meanIndex.toFixed(2)} / {f.p90Index.toFixed(2)}
            </div>
          </div>
        </div>
        <ShareBar
          className="mt-3"
          segments={[
            { label: "High", value: f.shares.High, color: RISK_COLORS.High },
            { label: "Moderate", value: f.shares.Moderate, color: RISK_COLORS.Moderate },
            { label: "Low", value: f.shares.Low, color: RISK_COLORS.Low },
          ]}
        />
        <div className="mt-2 flex justify-between text-[11px] text-[#cbd5e1]">
          {(["High", "Moderate", "Low"] as const).map((c) => (
            <span key={c} className="num">
              <span style={{ color: RISK_COLORS[c] }}>●</span> {c} {round(f.shares[c] * 100, 1)}%
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Within 50 m of river" value={round(f.riverReserveSharePct, 1)} unit="%" />
        <Stat
          label="Channels nearby"
          value={f.channelCount}
          sub={f.channelNames.slice(0, 2).join(", ") || "Unnamed"}
        />
      </div>
      {cell ? (
        <>
          <div className="flex items-center justify-between">
            <SectionLabel>{inspection ? "Inspected cell" : "Most susceptible cell"}</SectionLabel>
            {inspection && f.peak && (
              <button onClick={focusPeak} className={btn.ghost}>
                Show peak
              </button>
            )}
            {!inspection && f.peak && (
              <button onClick={focusPeak} className={btn.ghost}>
                <Crosshair className="h-3.5 w-3.5" /> Locate
              </button>
            )}
          </div>
          <FloodExplain cell={cell} params={a.params} />
          <p className="text-[11px] text-[#64748b]">
            Tap or click anywhere inside the area on the map to explain that cell.
          </p>
        </>
      ) : null}
      <div className="rounded-lg border border-white/[0.06] p-3 text-[11.5px] leading-relaxed text-[#94a3b8]">
        <span className="font-medium text-white">Scope:</span> river-overflow (fluvial)
        susceptibility only. Flash/pluvial flooding from drainage capacity is not modelled. Terms
        used: {f.termsUsed.join(", ")}. Missing: {f.termsMissing.map((t) => t.term).join(", ")}.{" "}
        <Link to="/help" className="text-white underline underline-offset-2">
          Methodology
        </Link>
      </div>
    </>
  );
}

function LandTab({ a }: { a: AreaAnalysis }) {
  const lc = a.landCover;
  const classes = [
    LandClass.BuiltUp,
    LandClass.Vegetation,
    LandClass.Water,
    LandClass.Agriculture,
    LandClass.Bare,
    LandClass.Unmapped,
  ];
  return (
    <>
      <div className="rounded-xl border border-white/[0.08] bg-[#0f1115] p-3.5">
        <div className="text-[11px] text-[#94a3b8]">Land use / land cover (OpenStreetMap)</div>
        <ShareBar
          className="mt-2.5"
          segments={classes.map((c) => ({
            label: LAND_LABELS[c],
            value: lc.shares[c],
            color: c === LandClass.Unmapped ? "#334155" : LAND_COLORS[c],
          }))}
        />
        <ul className="mt-3 space-y-1.5">
          {classes.map((c) => (
            <li key={c} className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: c === LandClass.Unmapped ? "#334155" : LAND_COLORS[c] }}
                />
                {LAND_LABELS[c]}
              </span>
              <span className="num text-[#cbd5e1]">{round(lc.shares[c], 1)}%</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label="Buildings"
          value={lc.buildingCount.toLocaleString()}
          sub={lc.buildingsTruncated ? "truncated at 6,000" : "OSM footprints"}
        />
        <Stat label="Footprint coverage" value={round(lc.footprintCoveragePct, 1)} unit="%" />
        <Stat
          label="Land-use mix"
          value={round(lc.mixIndex * 100, 0)}
          unit="/100"
          sub="Shannon entropy"
        />
        <Stat
          label="Mapped share"
          value={round(100 - lc.unmappedPct, 1)}
          unit="%"
          sub="OSM completeness"
        />
      </div>
      <p className="text-[11px] leading-relaxed text-[#64748b]">
        Classes come from OSM tags (landuse, natural, leisure, building) rasterised to the analysis
        grid; road corridors count as built-up. This is mapped land use, not an image classifier —
        the PyTorch/RF imagery models run on the optional backend.
      </p>
    </>
  );
}

function AccessTab({ a }: { a: AreaAnalysis }) {
  const ac = a.access;
  const t = a.terrain;
  return (
    <>
      <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#0f1115] p-3.5">
        <ScoreRing score={ac.score} size={64} label="Accessibility" />
        <div className="min-w-0 flex-1 space-y-1.5">
          {(
            [
              ["Road density", ac.parts.density, "40%"],
              ["Arterial proximity", ac.parts.arterial, "30%"],
              ["Transit coverage", ac.parts.transit, "30%"],
            ] as const
          ).map(([label, v, w]) => (
            <div key={label}>
              <div className="flex justify-between text-[11px] text-[#94a3b8]">
                <span>
                  {label} <span className="text-[#64748b]">· {w}</span>
                </span>
                <span className="num text-white">{v}</span>
              </div>
              <Bar value={v} color={scoreColor(v)} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label="Roads in area"
          value={round(ac.roadKm, 1)}
          unit="km"
          sub={`${round(ac.roadDensity, 1)} km/km²`}
        />
        <Stat
          label="Nearest arterial"
          value={ac.majorRoadDistanceM == null ? "—" : formatDistance(ac.majorRoadDistanceM)}
          sub={
            ac.majorRoadName ??
            (ac.majorRoadDistanceM == null ? "none within 1 km" : "motorway–secondary")
          }
        />
        <Stat
          label="Transit stops (1 km)"
          value={ac.transitStops}
          sub={`${ac.railStations} rail stations`}
        />
        <Stat
          label="Schools · health (1 km)"
          value={`${ac.education} · ${ac.health}`}
          sub={`${ac.emergency} emergency · ${ac.civic} civic`}
        />
      </div>
      <SectionLabel>Terrain</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label="Ground elevation"
          value={`${Math.round(t.minM)}–${Math.round(t.maxM)}`}
          unit="m"
          sub={`relief ${Math.round(t.reliefM)} m`}
        />
        <Stat label="Mean slope" value={round(t.meanSlopeDeg, 1)} unit="°" />
      </div>
      <div className="rounded-xl border border-white/[0.06] p-3">
        <div className="mb-2 text-[11px] text-[#94a3b8]">Hill-site slope classes</div>
        <ShareBar
          segments={[
            { label: "I <15°", value: t.slopeClassPct.I, color: "#10B981" },
            { label: "II 15–25°", value: t.slopeClassPct.II, color: "#38BDF8" },
            { label: "III 25–35°", value: t.slopeClassPct.III, color: "#F59E0B" },
            { label: "IV >35°", value: t.slopeClassPct.IV, color: "#EF4444" },
          ]}
        />
        <div className="mt-2 grid grid-cols-4 text-center text-[10.5px] text-[#cbd5e1]">
          {(["I", "II", "III", "IV"] as const).map((k) => (
            <span key={k} className="num">
              {k}: {round(t.slopeClassPct[k], 1)}%
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        {a.scores.suitability.flags.map((f) => (
          <div key={f.id} className="flex items-center gap-2 text-[12px]">
            <FlagIcon status={f.status} />
            <span className="min-w-0 flex-1 truncate">{f.label}</span>
            <span className="num text-[#cbd5e1]">{f.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}
