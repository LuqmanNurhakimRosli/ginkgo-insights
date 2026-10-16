import { createFileRoute, Link } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { AnalysisGate } from "@/components/analysis/AnalysisGate";
import { SourceLine } from "@/components/analysis/AnalysisPanel";
import { GinkgoMap } from "@/components/map/GinkgoMap";
import {
  Bar,
  btn,
  Page,
  PageHeader,
  Panel,
  PanelHeader,
  ScoreRing,
  scoreColor,
} from "@/components/gk/ui";
import { round } from "@/lib/geo/math";
import { useGinkgo } from "@/state/ginkgo-store";
import type { AreaAnalysis } from "@/types/geo";

export const Route = createFileRoute("/livability")({
  head: () => ({
    meta: [
      { title: "Livability — Ginkgo" },
      {
        name: "description",
        content:
          "Transparent five-dimension livability index computed from elevation and OpenStreetMap data.",
      },
    ],
  }),
  component: LivabilityPage,
});

function LivabilityPage() {
  const { analysis } = useGinkgo();
  return (
    <Page
      header={
        <PageHeader
          title="Livability index"
          description={
            analysis
              ? `${analysis.aoi.name} — weighted mean of five dimensions. Every input is shown.`
              : "Weighted mean of five dimensions, each computed from open data."
          }
          actions={
            <Link to="/settings" className={btn.secondary}>
              <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust weights
            </Link>
          }
        />
      }
    >
      <AnalysisGate what="The livability index">{(a) => <Livability a={a} />}</AnalysisGate>
    </Page>
  );
}

function Livability({ a }: { a: AreaAnalysis }) {
  const { savedAreas } = useGinkgo();
  const lv = a.scores.livability;
  const totalW = lv.dims.reduce((s, d) => s + d.weight, 0) || 1;
  const strongest = [...lv.dims].sort((x, y) => y.score - x.score)[0];
  const weakest = [...lv.dims].sort((x, y) => x.score - y.score)[0];
  const peers = [
    { name: `${a.aoi.name} (current)`, score: lv.score, current: true },
    ...savedAreas
      .filter((s) => s.aoi.id !== a.aoi.id)
      .map((s) => ({ name: s.aoi.name, score: s.summary.livability, current: false })),
  ].slice(0, 8);

  return (
    <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:p-6">
      <div className="space-y-4">
        <Panel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <ScoreRing score={lv.score} size={120} label="Livability" />
          <div className="min-w-0 space-y-2">
            <div className="text-[12px] text-[#94a3b8]">Livability band</div>
            <div className="text-[22px] font-semibold" style={{ color: scoreColor(lv.score) }}>
              {lv.band}
            </div>
            <p className="text-[12.5px] leading-relaxed text-[#cbd5e1]">
              Strongest dimension: <b>{strongest?.label}</b> ({strongest?.score}/100). Weakest:{" "}
              <b>{weakest?.label}</b> ({weakest?.score}/100).
            </p>
            <p className="font-mono text-[11px] text-[#64748b]">
              Index = Σ(score × weight) ÷ Σ weight
            </p>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Why this score"
            hint="Each dimension's formula, computed inputs and contribution to the index."
          />
          <ul className="divide-y divide-white/[0.05]">
            {lv.dims.map((d) => {
              const contribution = (d.score * d.weight) / totalW;
              return (
                <li
                  key={d.id}
                  className="grid gap-3 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_120px]"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-medium">{d.label}</span>
                      <span
                        className="num text-[13px] font-semibold"
                        style={{ color: scoreColor(d.score) }}
                      >
                        {d.score}/100
                      </span>
                    </div>
                    <Bar value={d.score} color={scoreColor(d.score)} />
                    <div className="text-[11.5px] text-[#cbd5e1]">{d.inputs}</div>
                    <div className="font-mono text-[10.5px] text-[#64748b]">{d.formula}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-[#0f1115] px-3 py-2 sm:flex-col sm:items-end sm:justify-center">
                    <span className="text-[10.5px] text-[#64748b]">
                      weight {round((d.weight / totalW) * 100, 0)}%
                    </span>
                    <span className="num text-[15px] font-semibold">+{round(contribution, 1)}</span>
                  </div>
                </li>
              );
            })}
            <li className="flex items-center justify-between bg-white/[0.02] px-4 py-3">
              <span className="text-[12.5px] font-semibold">Livability index</span>
              <span className="num text-[18px] font-semibold">{lv.score}</span>
            </li>
          </ul>
        </Panel>
        <SourceLine a={a} />
      </div>

      <div className="space-y-4">
        <Panel className="overflow-hidden">
          <div className="h-[260px]">
            <GinkgoMap variant="inset" />
          </div>
        </Panel>
        <Panel>
          <PanelHeader
            title="Compared with your areas"
            hint={peers.length < 2 ? "Save more areas to compare." : undefined}
          />
          <ul className="space-y-2.5 p-4">
            {peers.map((p) => (
              <li key={p.name}>
                <div className="mb-1 flex justify-between text-[12px]">
                  <span className={p.current ? "font-semibold" : "text-[#cbd5e1]"}>{p.name}</span>
                  <span className="num">{p.score}</span>
                </div>
                <Bar value={p.score} color={p.current ? "#ffffff" : "rgba(255,255,255,0.35)"} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-4 text-[11.5px] leading-relaxed text-[#94a3b8]">
          <div className="mb-1 font-medium text-white">Reading the index</div>
          Livability here is a screening indicator of the built environment from mapped data: green
          cover, access, riverine flood exposure, nearby schools and health facilities, and land-use
          mix. It does not include housing cost, air quality or crime, which need other datasets.
        </Panel>
      </div>
    </div>
  );
}
