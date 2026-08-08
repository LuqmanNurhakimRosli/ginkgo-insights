import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { MapWorkspace } from "@/components/map/MapWorkspace";
import { LivabilityRadar } from "@/components/charts/GinkgoCharts";
import { EvidenceCard, ProgressMetric, ScoreCard } from "@/components/metrics/MetricCard";
import { accessibility } from "@/data/accessibility";
import { flood } from "@/data/flood";
import { livability } from "@/data/livability";
import { getSite } from "@/data/sites";
import { suitability } from "@/data/suitability";

export const Route = createFileRoute("/analysis/site/$id")({
  head: () => ({
    meta: [
      { title: "Site Detail — Ginkgo Spatial Analysis" },
      { name: "description", content: "Parcel-level livability, accessibility, flood exposure and suitability evidence." },
      { property: "og:title", content: "Site Detail — Ginkgo Spatial Analysis" },
      { property: "og:description", content: "Parcel-level livability, accessibility, flood exposure and suitability evidence." },
    ],
  }),
  component: SiteDetail,
});

function SiteDetail() {
  const { id } = Route.useParams();
  const site = getSite(id);
  if (!site) {
    return <div className="px-6 py-10 text-[13px] text-muted-foreground">Analysis not available yet.</div>;
  }
  const lv = livability[id]!;
  const ac = accessibility[id]!;
  const fl = flood[id]!;
  const su = suitability[id]!;

  return (
    <div>
      <PageHeader title={`${site.name} — ${site.locality}`} subtitle={`${site.areaHa} ha · ${site.dominantLandUse}`} />
      <div className="grid grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <MapWorkspace height="h-[460px]" />
        <div className="space-y-4">
          <ScoreCard score={lv.score} band={lv.band} label="Livability Index" />
          <ScoreCard score={su.score} band={su.classification} label="Development Suitability" />
          <div className="ginkgo-panel space-y-3 px-4 py-4">
            <h2 className="text-[13.5px] font-semibold">Livability Dimensions</h2>
            <LivabilityRadar dimensions={lv.dimensions} />
            {lv.dimensions.map((d) => (
              <ProgressMetric key={d.id} label={d.label} value={d.score} max={d.weight} note={d.note} />
            ))}
          </div>
          <EvidenceCard title="Why this score?" positives={lv.positives} negatives={lv.negatives} />
          <div className="ginkgo-panel px-4 py-4">
            <h2 className="text-[13.5px] font-semibold">Accessibility & Resilience</h2>
            <div className="mt-3 space-y-3">
              <ProgressMetric label="Accessibility" value={ac.score} note={`Road access ${ac.roadAccess} · Connectivity ${ac.connectivity}`} />
              <ProgressMetric
                label="Resilience indicator"
                value={fl.resilienceIndicator}
                note={`Flood exposure ${fl.exposure} (indicative) across ${fl.exposedAreaKm2} km² — planner review required`}
                color="var(--color-info)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
