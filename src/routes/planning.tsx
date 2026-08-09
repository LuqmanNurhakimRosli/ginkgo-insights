import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { MapWorkspace } from "@/components/map/MapWorkspace";
import { ProgressMetric, ScoreCard } from "@/components/metrics/MetricCard";
import { flood } from "@/data/flood";
import { sites } from "@/data/sites";
import { recommendations, suitability, suitabilityDisclaimer } from "@/data/suitability";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";

export const Route = createFileRoute("/planning")({
  head: () => ({
    meta: [
      { title: "Planning Suitability — Ginkgo" },
      { name: "description", content: "Indicative spatial screening for sustainable development, with transparent criteria weights." },
      { property: "og:title", content: "Planning Suitability — Ginkgo" },
      { property: "og:description", content: "Indicative spatial screening for sustainable development, with transparent criteria weights." },
    ],
  }),
  component: PlanningPage,
});

function PlanningPage() {
  const site = useSelectedSite();
  const { selectSite, highlightFeatures, zoomToFeatures } = useGinkgo();
  const su = suitability[site.id]!;
  const rec = recommendations[site.id]!;
  const fl = flood[site.id]!;

  const highlight = () => {
    const features = sites
      .filter((s) => suitability[s.id]!.score >= 58)
      .map((s) => ({ id: `cand-${s.id}`, siteId: s.id, label: s.name, kind: "candidate" as const, polygon: s.polygon }));
    highlightFeatures(features);
    zoomToFeatures(features);
  };

  return (
    <div>
      <PageHeader
        title="Planning Suitability"
        subtitle="Indicative spatial screening for sustainable development."
        actions={
          <select value={site.id} onChange={(e) => selectSite(e.target.value)} className="rounded-md border border-border px-3 py-2 text-[13px]">
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        }
      />

      {/* Criteria + recommendation are the subject; the map supports them. */}
      <div className="grid grid-cols-1 gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <ScoreCard score={su.score} band={su.classification} label={`${site.name} Suitability`} />
              <div className="ginkgo-panel px-4 py-4">
                <h2 className="text-[16px] font-semibold">Criteria &amp; weights</h2>
                <div className="mt-3 space-y-3.5">
                  {su.criteria.map((c) => (
                    <ProgressMetric key={c.label} label={`${c.label} (${c.weightPct}%)`} value={c.score} />
                  ))}
                </div>
              </div>
            </div>

            <div className="ginkgo-panel px-4 py-4">
              <h2 className="text-[16px] font-semibold">Planning recommendation</h2>
              <p className="mt-2 text-[13px] leading-relaxed">{rec.headline}</p>
              <ul className="mt-3.5 space-y-2 text-[13px] leading-snug">
                {rec.evidence.map((e) => (
                  <li key={e} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{e}</li>
                ))}
                {rec.constraints.map((c) => (
                  <li key={c} className="flex gap-2"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />{c}</li>
                ))}
              </ul>
              <ol className="mt-3.5 list-decimal space-y-1.5 pl-4 text-[13px] leading-snug">
                {rec.actions.map((a) => <li key={a}>{a}</li>)}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={highlight} className="rounded-md bg-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground">
                  Highlight Candidate Areas
                </button>
                <Link to="/reports" className="rounded-md border border-border px-3.5 py-2 text-[13px] font-semibold hover:bg-secondary">
                  Generate Report
                </Link>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Flood exposure: {fl.exposure} (indicative) · Planner review required.
              </p>
            </div>
          </div>

          <p className="rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-[12.5px] leading-relaxed text-foreground">
            {suitabilityDisclaimer}
          </p>
        </div>

        <aside className="space-y-4">
          <div>
            <div className="label-caps mb-2">Suitability surface</div>
            <MapWorkspace height="h-[300px]" overlay="suitability" showTime={false} compact />
          </div>
          <div className="ginkgo-panel px-4 py-4">
            <h2 className="text-[16px] font-semibold">Legend</h2>
            <div className="mt-3 space-y-2">
              {[
                ["Highly Suitable", "#3fb08c"],
                ["Suitable", "#8cc36f"],
                ["Conditional", "#e0a63c"],
                ["Low Suitability", "#e2643f"],
              ].map(([label, color]) => (
                <span key={label} className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
