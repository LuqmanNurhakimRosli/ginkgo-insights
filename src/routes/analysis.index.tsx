import { createFileRoute } from "@tanstack/react-router";
import { AICopilot } from "@/components/ai/AICopilot";
import { PageHeader } from "@/components/layout/AppShell";
import { MapWorkspace } from "@/components/map/MapWorkspace";
import { LandCoverDonut } from "@/components/charts/GinkgoCharts";
import { MetricCard } from "@/components/metrics/MetricCard";
import { getKpiStrip } from "@/data/analysis";
import { landCover } from "@/data/changeDetection";
import { useSelectedSite } from "@/state/ginkgo-store";

export const Route = createFileRoute("/analysis/")({
  head: () => ({
    meta: [
      { title: "Map & Analysis — Ginkgo" },
      { name: "description", content: "Interactive spatial workspace with layers, land cover and parcel-level analysis." },
      { property: "og:title", content: "Map & Analysis — Ginkgo" },
      { property: "og:description", content: "Interactive spatial workspace with layers, land cover and parcel-level analysis." },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const site = useSelectedSite();
  const kpis = getKpiStrip(site.id);
  const lc = landCover[site.id]!;

  return (
    <div>
      <PageHeader
        title="Map & Analysis"
        subtitle="Explore layers, select parcels and inspect spatial indicators for the current study area."
      />
      <div className="grid grid-cols-1 gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <MapWorkspace height="h-[600px]" overlay="landuse" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {kpis.map((m) => (
              <MetricCard key={m.id} metric={m} />
            ))}
          </div>
          <div className="ginkgo-panel px-4 py-4">
            <h2 className="text-[16px] font-semibold">Land cover · {lc.period}</h2>
            <div className="mt-3">
              <LandCoverDonut data={lc} />
            </div>
          </div>
        </div>
        <AICopilot className="h-[calc(100vh-172px)] xl:sticky xl:top-[72px]" />
      </div>
    </div>
  );
}
