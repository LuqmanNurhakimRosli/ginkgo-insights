import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, TriangleAlert, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { MapCanvas } from "@/components/map/MapCanvas";
import { ScoreDial } from "@/components/metrics/ScoreDial";
import { flood } from "@/data/flood";
import { sites } from "@/data/sites";
import { recommendations, suitability, suitabilityDisclaimer } from "@/data/suitability";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";

export const Route = createFileRoute("/planning")({
  head: () => ({
    meta: [
      { title: "GINKGO — SUITABILITY ANALYSIS" },
      { name: "description", content: "Indicative spatial screening for sustainable development with transparent criteria weights." },
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
    <div className="flex flex-col h-full w-full bg-[#0B0C0E] text-[#F5F5F4] font-mono">
      <PageHeader
        title="DEVELOPMENT SUITABILITY SCREENING"
        subtitle="MULTI-CRITERIA SPATIAL SCREENING FOR SUSTAINABLE URBAN & RURAL DEVELOPMENT."
        actions={
          <select
            value={site.id}
            onChange={(e) => selectSite(e.target.value)}
            className="rounded border border-white/10 bg-[#16171A] px-3 py-1.5 text-[11px] uppercase text-[#F5F5F4] outline-none"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 overflow-y-auto">
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded border border-white/10 bg-[#16171A] p-6 shadow-2xl flex flex-col items-center justify-center">
              <ScoreDial
                score={su.score}
                label={`${site.name} SUITABILITY`}
                sublabel={`CLASS: ${su.classification.toUpperCase()}`}
              />
            </div>

            <div className="rounded border border-white/10 bg-[#16171A] p-5 shadow-2xl space-y-3">
              <div className="text-[11px] font-bold uppercase text-[#5EEAD4] border-b border-white/10 pb-2">
                CRITERIA WEIGHTING MATRIX
              </div>
              <div className="space-y-3">
                {su.criteria.map((c) => (
                  <div key={c.label} className="text-[10px] uppercase">
                    <div className="flex justify-between mb-1 text-[#9CA3AF]">
                      <span>{c.label} ({c.weightPct}%)</span>
                      <span className="text-[#F5F5F4] font-bold num">{c.score}/100</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#5EEAD4]" style={{ width: `${c.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded border border-white/10 bg-[#16171A] p-5 shadow-2xl space-y-3">
            <div className="text-[12px] font-bold uppercase text-[#5EEAD4] border-b border-white/10 pb-2">
              AI PLANNING RECOMMENDATION
            </div>
            <p className="text-[11px] text-[#F5F5F4] leading-relaxed">{rec.headline}</p>

            <div className="space-y-2 text-[10px] uppercase">
              {rec.evidence.map((e) => (
                <div key={e} className="flex items-center gap-2 text-[#22C55E]">
                  <Check className="h-3.5 w-3.5" />
                  <span>{e}</span>
                </div>
              ))}
              {rec.constraints.map((c) => (
                <div key={c} className="flex items-center gap-2 text-[#F97316]">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  <span>{c}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2 pt-2 border-t border-white/10">
              <button
                onClick={highlight}
                className="flex-1 rounded bg-[#5EEAD4] py-2 text-[11px] font-bold text-[#0B0C0E] uppercase hover:opacity-90"
              >
                HIGHLIGHT CANDIDATE PARCELS
              </button>
              <Link
                to="/reports"
                className="rounded border border-white/10 bg-white/5 px-4 py-2 text-[11px] text-[#F5F5F4] hover:bg-white/10 uppercase"
              >
                GENERATE REPORT ↗
              </Link>
            </div>
          </div>

          <p className="rounded border border-[#EAB308]/30 bg-[#EAB308]/10 p-3 text-[10px] text-[#EAB308] uppercase leading-relaxed">
            {suitabilityDisclaimer}
          </p>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="h-64 w-full rounded border border-white/10 bg-[#16171A] overflow-hidden relative shadow-2xl">
            <div className="absolute top-2 left-2 z-20 rounded bg-[#0B0C0E]/80 px-2 py-0.5 text-[9px] text-[#5EEAD4] font-bold">
              SUITABILITY INSET
            </div>
            <MapCanvas overlay="suitability" interactive={false} />
          </div>

          <div className="rounded border border-white/10 bg-[#16171A] p-4 shadow-2xl space-y-2 text-[10px] uppercase">
            <div className="text-[11px] font-bold text-[#5EEAD4] border-b border-white/10 pb-1">CLASSIFICATION LEGEND</div>
            {[
              ["Highly Suitable", "#22C55E"],
              ["Suitable", "#5EEAD4"],
              ["Conditional", "#EAB308"],
              ["Low Suitability", "#EF4444"],
            ].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2 text-[#9CA3AF]">
                <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
