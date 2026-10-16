import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, RotateCcw, ShieldAlert } from "lucide-react";
import { AnalysisGate } from "@/components/analysis/AnalysisGate";
import { SourceLine } from "@/components/analysis/AnalysisPanel";
import {
  Bar,
  btn,
  ClassBadge,
  FlagIcon,
  Page,
  PageHeader,
  Panel,
  PanelHeader,
  ScoreRing,
  scoreColor,
} from "@/components/gk/ui";
import { DEFAULT_SCORE_WEIGHTS, type ScoreWeights } from "@/lib/geo/indicators";
import { round } from "@/lib/geo/math";
import { recommendations } from "@/lib/geo/recommend";
import { useGinkgo } from "@/state/ginkgo-store";
import type { AreaAnalysis } from "@/types/geo";

export const Route = createFileRoute("/planning")({
  head: () => ({
    meta: [
      { title: "Development suitability — Ginkgo" },
      {
        name: "description",
        content:
          "Multi-criteria development screening with adjustable weights, screening flags and rule-based planning conditions.",
      },
    ],
  }),
  component: PlanningPage,
});

const LABELS: Record<keyof ScoreWeights["suitability"], string> = {
  access: "Accessibility",
  flood: "Flood resilience",
  terrain: "Terrain stability",
  environment: "Environmental compatibility",
  services: "Services catchment",
};

function PlanningPage() {
  const { analysis } = useGinkgo();
  return (
    <Page
      header={
        <PageHeader
          title="Development suitability"
          description={
            analysis
              ? `${analysis.aoi.name} — multi-criteria screening for planning authorities (PBT).`
              : "Multi-criteria screening with transparent, adjustable weights."
          }
          actions={
            <Link to="/reports" className={btn.primary}>
              <FileText className="h-3.5 w-3.5" /> Planning report
            </Link>
          }
        />
      }
    >
      <AnalysisGate what="Development suitability">{(a) => <Suitability a={a} />}</AnalysisGate>
    </Page>
  );
}

function Suitability({ a }: { a: AreaAnalysis }) {
  const { settings, updateSettings } = useGinkgo();
  const s = a.scores.suitability;
  const w = settings.scoreWeights.suitability;
  const totalW = Object.values(w).reduce((x, y) => x + y, 0) || 1;
  const capped = s.flags.some((f) => f.status === "fail") && s.rawScore >= 60;
  const setWeight = (k: keyof ScoreWeights["suitability"], v: number) =>
    updateSettings({ scoreWeights: { ...settings.scoreWeights, suitability: { ...w, [k]: v } } });

  return (
    <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-6">
      <div className="space-y-4">
        <Panel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <ScoreRing score={s.score} size={120} label="Suitability" />
          <div className="min-w-0 space-y-2">
            <ClassBadge cls={s.cls} />
            <p className="text-[12.5px] leading-relaxed text-[#cbd5e1]">
              Weighted score {s.score}/100.
              {capped &&
                " The class is capped at Conditional because a screening flag failed — the weighted score alone would rank it higher."}
            </p>
            <p className="font-mono text-[11px] text-[#64748b]">
              ≥75 Highly Suitable · ≥60 Suitable · ≥45 Conditional · else Low
            </p>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Criteria"
            hint="Computed scores; contribution depends on the weights on the right."
          />
          <ul className="divide-y divide-white/[0.05]">
            {s.criteria.map((c) => (
              <li key={c.id} className="space-y-1.5 px-4 py-3">
                <div className="flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="font-medium">{c.label}</span>
                  <span className="num">
                    <span className="font-semibold" style={{ color: scoreColor(c.score) }}>
                      {c.score}
                    </span>
                    <span className="text-[#64748b]">
                      {" "}
                      × {round((c.weight / totalW) * 100, 0)}% ={" "}
                    </span>
                    <span className="font-semibold">{round((c.score * c.weight) / totalW, 1)}</span>
                  </span>
                </div>
                <Bar value={c.score} color={scoreColor(c.score)} />
                <div className="text-[11.5px] text-[#cbd5e1]">{c.inputs}</div>
                <div className="font-mono text-[10.5px] text-[#64748b]">{c.formula}</div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader
            title="Screening flags"
            hint="Hard constraints checked independently of the weighted score."
          />
          <ul className="divide-y divide-white/[0.05]">
            {s.flags.map((f) => (
              <li key={f.id} className="flex items-start gap-3 px-4 py-3">
                <FlagIcon status={f.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-[12.5px]">
                    <span>{f.label}</span>
                    <span className="num font-medium">{f.value}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-[#64748b]">
                    {f.reference}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader
            title="Planning conditions"
            hint="Rule-based conditions triggered by the computed evidence."
          />
          <ul className="space-y-2 p-4">
            {recommendations(a).map((r) => (
              <li key={r.id} className="rounded-lg border border-white/[0.06] bg-[#0f1115] p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                    style={{
                      color:
                        r.priority === "high"
                          ? "#EF4444"
                          : r.priority === "medium"
                            ? "#F59E0B"
                            : "#10B981",
                      backgroundColor:
                        r.priority === "high"
                          ? "#EF444418"
                          : r.priority === "medium"
                            ? "#F59E0B18"
                            : "#10B98118",
                    }}
                  >
                    {r.priority}
                  </span>
                  <span className="text-[12.5px] font-medium">{r.title}</span>
                </div>
                <div className="mt-1 text-[11.5px] leading-snug text-[#94a3b8]">{r.detail}</div>
                <div className="mt-1 text-[11px] text-[#64748b]">Basis: {r.basis}</div>
              </li>
            ))}
          </ul>
        </Panel>
        <SourceLine a={a} />
      </div>

      <div className="space-y-4 lg:sticky lg:top-0 lg:self-start">
        <Panel>
          <PanelHeader
            title="Criteria weights"
            hint="Changes apply instantly and are saved on this device."
            action={
              <button
                onClick={() =>
                  updateSettings({
                    scoreWeights: {
                      ...settings.scoreWeights,
                      suitability: DEFAULT_SCORE_WEIGHTS.suitability,
                    },
                  })
                }
                className={btn.ghost}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            }
          />
          <div className="space-y-4 p-4">
            {(Object.keys(LABELS) as Array<keyof ScoreWeights["suitability"]>).map((k) => (
              <label key={k} className="block">
                <div className="mb-1 flex justify-between text-[12px]">
                  <span>{LABELS[k]}</span>
                  <span className="num text-[#cbd5e1]">{round((w[k] / totalW) * 100, 0)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={w[k]}
                  onChange={(e) => setWeight(k, Number(e.target.value))}
                  className="w-full"
                  aria-label={`${LABELS[k]} weight`}
                />
              </label>
            ))}
          </div>
        </Panel>
        <Panel className="flex gap-3 p-4 text-[11.5px] leading-relaxed text-[#94a3b8]">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" />
          <span>
            Screening-level decision support. It does not replace statutory planning approval, JPS
            flood studies, geotechnical reports or the gazetted local plan (Rancangan Tempatan).
          </span>
        </Panel>
      </div>
    </div>
  );
}
