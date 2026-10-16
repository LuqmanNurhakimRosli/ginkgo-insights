import { useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileText, Map as MapIcon, SearchX } from "lucide-react";
import { AnalysisGate } from "@/components/analysis/AnalysisGate";
import { FloodExplain } from "@/components/analysis/FloodExplain";
import { ShareBar, SourceLine } from "@/components/analysis/AnalysisPanel";
import { GinkgoMap } from "@/components/map/GinkgoMap";
import {
  btn,
  ClassBadge,
  EmptyState,
  FlagIcon,
  Page,
  PageHeader,
  Panel,
  PanelHeader,
  RiskBadge,
  ScoreRing,
  Stat,
} from "@/components/gk/ui";
import { getPreset, presetToAoi } from "@/data/presets";
import { RISK_COLORS } from "@/lib/geo/flood";
import { formatArea, formatDistance, round } from "@/lib/geo/math";
import { recommendations } from "@/lib/geo/recommend";
import { LAND_COLORS, LAND_LABELS } from "@/lib/geo/render";
import { useGinkgo } from "@/state/ginkgo-store";
import { LandClass, type AreaAnalysis } from "@/types/geo";

export const Route = createFileRoute("/analysis/site/$id")({
  head: () => ({
    meta: [
      { title: "Area profile — Ginkgo" },
      {
        name: "description",
        content: "Computed riverine flood, land use, access and suitability profile for one area.",
      },
    ],
  }),
  component: AreaProfile,
});

function AreaProfile() {
  const { id } = Route.useParams();
  const { savedAreas, analysis, status, runAnalysis, hydrated } = useGinkgo();
  const navigate = useNavigate();
  const target = useMemo(() => {
    const saved = savedAreas.find((s) => s.id === id);
    if (saved) return saved.aoi;
    const preset = getPreset(id);
    return preset ? presetToAoi(preset) : null;
  }, [id, savedAreas]);

  const matches = !!target && analysis?.aoi.id === target.id;
  useEffect(() => {
    if (target && !matches && status !== "running")
      void runAnalysis({ ...target, createdAt: Date.now() });
    // Only when the requested area changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);

  if (hydrated && !target) {
    return (
      <EmptyState
        icon={<SearchX className="h-5 w-5" />}
        title="Area not found"
        body="This saved area no longer exists on this device. Saved areas are stored in your browser."
        actions={
          <Link to="/analysis" className={btn.primary}>
            Back to areas
          </Link>
        }
      />
    );
  }

  return (
    <Page
      header={
        <PageHeader
          title={target?.name ?? "Area profile"}
          description={target?.locality ?? "Computed area profile"}
          actions={
            <>
              <Link to="/analysis" className={btn.ghost}>
                <ArrowLeft className="h-3.5 w-3.5" /> Areas
              </Link>
              <button onClick={() => void navigate({ to: "/" })} className={btn.secondary}>
                <MapIcon className="h-3.5 w-3.5" /> Open on map
              </button>
              <Link to="/reports" className={btn.primary}>
                <FileText className="h-3.5 w-3.5" /> Report
              </Link>
            </>
          }
        />
      }
    >
      <AnalysisGate what="The area profile">
        {(a) => (matches || !target ? <Profile a={a} /> : <div className="p-6" />)}
      </AnalysisGate>
    </Page>
  );
}

function Profile({ a }: { a: AreaAnalysis }) {
  const recs = recommendations(a);
  const lc = a.landCover;
  const classes = [
    LandClass.BuiltUp,
    LandClass.Vegetation,
    LandClass.Water,
    LandClass.Agriculture,
    LandClass.Bare,
  ];
  return (
    <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:p-6">
      <div className="space-y-4">
        <Panel className="overflow-hidden">
          <div className="h-[300px] sm:h-[380px]">
            <GinkgoMap variant="inset" />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-[#94a3b8]">
            {(["High", "Moderate", "Low"] as const).map((c) => (
              <span key={c} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: RISK_COLORS[c] }}
                />{" "}
                {c}
              </span>
            ))}
            <span className="ml-auto">{formatArea(a.areaKm2)}</span>
          </div>
        </Panel>
        {a.flood.peak && (
          <FloodExplain
            cell={a.flood.peak}
            params={a.params}
            title="Most susceptible cell — why this score"
          />
        )}
        <SourceLine a={a} />
      </div>
      <div className="space-y-4">
        <Panel className="p-4">
          <div className="grid grid-cols-3 items-center gap-3 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <RiskBadge cls={a.flood.areaClass} size="md" />
              <span className="text-[11px] text-[#94a3b8]">Riverine flood</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ScoreRing score={a.scores.livability.score} size={64} />
              <span className="text-[11px] text-[#94a3b8]">Livability</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ScoreRing score={a.scores.suitability.score} size={64} />
              <span className="text-[11px] text-[#94a3b8]">Suitability</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[12px]">
            <span className="text-[#94a3b8]">Screening outcome</span>
            <ClassBadge cls={a.scores.suitability.cls} />
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Screening flags" />
          <ul className="divide-y divide-white/[0.05]">
            {a.scores.suitability.flags.map((f) => (
              <li key={f.id} className="flex items-start gap-2.5 px-4 py-2.5">
                <FlagIcon status={f.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-[12.5px]">
                    <span>{f.label}</span>
                    <span className="num text-[#cbd5e1]">{f.value}</span>
                  </div>
                  <div className="text-[10.5px] leading-snug text-[#64748b]">{f.reference}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <PanelHeader
            title="Planning conditions"
            hint="Rule-based; each cites the computed value that triggered it."
          />
          <ul className="space-y-2 p-4">
            {recs.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/[0.06] bg-[#0f1115] p-3">
                <div className="text-[12.5px] font-medium">{r.title}</div>
                <div className="mt-0.5 text-[11.5px] leading-snug text-[#94a3b8]">{r.detail}</div>
                <div className="mt-1 text-[11px] text-[#64748b]">Basis: {r.basis}</div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-4">
          <div className="mb-2 text-[12.5px] font-semibold">Land use</div>
          <ShareBar
            segments={classes.map((c) => ({
              label: LAND_LABELS[c],
              value: lc.shares[c],
              color: LAND_COLORS[c],
            }))}
          />
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px]">
            {classes.map((c) => (
              <div key={c} className="flex justify-between">
                <span className="text-[#94a3b8]">{LAND_LABELS[c]}</span>
                <span className="num">{round(lc.shares[c], 1)}%</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Accessibility" value={a.access.score} unit="/100" />
            <Stat
              label="Nearest arterial"
              value={
                a.access.majorRoadDistanceM == null
                  ? "—"
                  : formatDistance(a.access.majorRoadDistanceM)
              }
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
