import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { MapCanvas } from "@/components/map/MapCanvas";
import { Callout } from "@/components/ui/Callout";
import { getKpiStrip } from "@/data/analysis";
import { landCover } from "@/data/changeDetection";
import { useSelectedSite } from "@/state/ginkgo-store";

export const Route = createFileRoute("/analysis/")({
  head: () => ({
    meta: [
      { title: "GINKGO — MAP & ANALYSIS" },
      { name: "description", content: "Interactive spatial workspace with layers, land cover and parcel-level analysis." },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const site = useSelectedSite();
  const kpis = getKpiStrip(site.id);
  const lc = landCover[site.id]!;

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0C0E] text-[#F5F5F4] font-mono">
      <PageHeader
        title="SPATIAL MAP & ANALYSIS CONSOLE"
        subtitle={`PARCEL LEVEL LAND-USE ANALYSIS FOR ${site.name.toUpperCase()} (${site.locality.toUpperCase()}).`}
      />

      <div className="p-6 grid grid-cols-1 gap-6 lg:grid-cols-12 overflow-y-auto">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-[550px] w-full rounded border border-white/10 bg-[#16171A] overflow-hidden relative shadow-2xl">
            <MapCanvas overlay="landuse" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {kpis.map((m) => (
              <div key={m.id} className="rounded border border-white/10 bg-[#16171A] p-3 text-[11px] uppercase">
                <span className="text-[9px] text-[#9CA3AF] block">{m.label}</span>
                <span className="text-[16px] font-bold text-[#5EEAD4] num block mt-0.5">{m.value}</span>
                {m.delta && <span className="text-[9px] text-[#22C55E] block mt-0.5 font-bold">{m.delta} ↗</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="rounded border border-white/10 bg-[#16171A] p-5 shadow-2xl space-y-3">
            <div className="text-[11px] font-bold uppercase text-[#5EEAD4] border-b border-white/10 pb-2">
              LAND COVER COMPOSITION ({lc.period})
            </div>
            <div className="space-y-3 text-[11px] uppercase">
              {lc.categories.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-[#9CA3AF]">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: c.color }} />
                      <span className="text-[#F5F5F4]">{c.label}</span>
                    </span>
                    <span className="font-bold text-[#5EEAD4] num">{c.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full" style={{ backgroundColor: c.color, width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
