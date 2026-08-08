import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { MapWorkspace } from "@/components/map/MapWorkspace";
import { LivabilityRadar } from "@/components/charts/GinkgoCharts";
import { EvidenceCard, ProgressMetric, ScoreCard } from "@/components/metrics/MetricCard";
import { livability } from "@/data/livability";
import { sites } from "@/data/sites";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";

export const Route = createFileRoute("/livability")({
  head: () => ({
    meta: [
      { title: "Livability Index — Ginkgo" },
      { name: "description", content: "Explainable five-dimension livability scoring with evidence and map heatmap." },
      { property: "og:title", content: "Livability Index — Ginkgo" },
      { property: "og:description", content: "Explainable five-dimension livability scoring with evidence and map heatmap." },
    ],
  }),
  component: LivabilityPage,
});

function LivabilityPage() {
  const site = useSelectedSite();
  const { selectSite } = useGinkgo();
  const lv = livability[site.id]!;

  return (
    <div>
      <PageHeader
        title="Livability Index"
        subtitle="A weighted composite of five dimensions, published transparently so every point is traceable."
        actions={
          <select
            value={site.id}
            onChange={(e) => selectSite(e.target.value)}
            className="rounded-md border border-border px-2 py-1.5 text-[12.5px]"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        }
      />
      <div className="grid grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <ScoreCard score={lv.score} band={lv.band} label={`${site.name} Livability`} />
          <div className="ginkgo-panel px-4 py-4">
            <h2 className="text-[13.5px] font-semibold">Dimension Breakdown</h2>
            <LivabilityRadar dimensions={lv.dimensions} />
            <div className="mt-2 space-y-3">
              {lv.dimensions.map((d) => (
                <ProgressMetric key={d.id} label={`${d.label} (${d.weight} pts)`} value={d.score} max={d.weight} note={d.note} />
              ))}
            </div>
          </div>
          <EvidenceCard
            title={`Why ${lv.score}?`}
            positives={lv.positives}
            negatives={lv.negatives}
            footer={
              <a href="#evidence" className="text-[12.5px] font-semibold text-primary">
                View Evidence →
              </a>
            }
          />
        </div>
        <div id="evidence">
          <MapWorkspace height="h-[560px]" overlay="accessibility" showTime={false} />
          <div className="ginkgo-panel mt-4 grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-2">
            {sites.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSite(s.id)}
                className="rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-secondary"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-[12.5px] font-semibold">{s.name}</span>
                  <span className="num text-[16px] font-semibold text-primary">{livability[s.id]!.score}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{s.locality}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
