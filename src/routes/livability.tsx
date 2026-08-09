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
            className="rounded-md border border-border px-3 py-2 text-[13px]"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        }
      />

      {/* Content is the hero here; the map is supporting context only. */}
      <div className="grid grid-cols-1 gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <ScoreCard score={lv.score} band={lv.band} label={`${site.name} Livability`} />
              <div className="ginkgo-panel px-4 py-4">
                <h2 className="text-[16px] font-semibold">Dimension breakdown</h2>
                <div className="mt-3 space-y-3.5">
                  {lv.dimensions.map((d) => (
                    <ProgressMetric
                      key={d.id}
                      label={`${d.label} (${d.weight} pts)`}
                      value={d.score}
                      max={d.weight}
                      note={d.note}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="ginkgo-panel px-4 py-4">
                <h2 className="text-[16px] font-semibold">Dimension profile</h2>
                <div className="mt-2">
                  <LivabilityRadar dimensions={lv.dimensions} />
                </div>
              </div>
              <EvidenceCard title={`Why ${lv.score}?`} positives={lv.positives} negatives={lv.negatives} />
            </div>
          </div>

          <div className="ginkgo-panel px-4 py-4" id="evidence">
            <h2 className="text-[16px] font-semibold">Compare study areas</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {sites.map((s) => {
                const active = s.id === site.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => selectSite(s.id)}
                    className={`rounded-lg border px-3.5 py-3 text-left transition-colors ${
                      active ? "border-primary/50 bg-primary-soft" : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold">{s.name}</span>
                      <span className="num text-[20px] font-bold text-primary">{livability[s.id]!.score}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{s.locality}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div>
            <div className="label-caps mb-2">Spatial context</div>
            <MapWorkspace height="h-[300px]" overlay="accessibility" showTime={false} compact />
          </div>
          <div className="ginkgo-panel px-4 py-4">
            <h2 className="text-[16px] font-semibold">Method</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Each dimension carries a fixed weight and is scored from the spatial indicators listed
              in Data Sources. The composite is the weighted sum, rounded to the nearest point.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
