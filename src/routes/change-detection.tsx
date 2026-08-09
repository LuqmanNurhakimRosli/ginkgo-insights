import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { MapComparison } from "@/components/map/MapComparison";
import { MapCanvas } from "@/components/map/MapCanvas";
import { Callout } from "@/components/ui/Callout";
import { changeDetection } from "@/data/changeDetection";
import { sites } from "@/data/sites";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";
import { Layers, Sparkles } from "lucide-react";

export const Route = createFileRoute("/change-detection")({
  head: () => ({
    meta: [
      { title: "GINKGO — TEMPORAL CHANGE" },
      { name: "description", content: "Pixel-level satellite composite change detection between T1 (2023) and T2 (2025)." },
    ],
  }),
  component: ChangeDetectionPage,
});

function ChangeDetectionPage() {
  const site = useSelectedSite();
  const { selectSite, t1, t2, setTimeComparison, highlightFeatures, zoomToFeatures, setLayer } = useGinkgo();
  const [mode, setMode] = useState<"side" | "swipe" | "overlay">("side");
  const cd = changeDetection[site.id]!;

  const highlightGrowth = () => {
    const features = [
      { id: `growth-${site.id}`, siteId: site.id, label: `${site.name} built-up growth`, kind: "growth" as const, polygon: site.polygon },
    ];
    setLayer("change", true);
    highlightFeatures(features);
    zoomToFeatures(features);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0C0E] text-[#F5F5F4] font-mono">
      <PageHeader
        title="TEMPORAL SATELLITE CHANGE DETECTION"
        subtitle="TEMPORAL COMPOSITE DIFFERENCING BETWEEN T1 (2023) AND T2 (2025) SENTINEL-2 RASTERS."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase">
            <select
              value={site.id}
              onChange={(e) => selectSite(e.target.value)}
              className="rounded border border-white/10 bg-[#16171A] px-2.5 py-1.5 text-[#F5F5F4] outline-none"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={t1}
              onChange={(e) => setTimeComparison(e.target.value, t2)}
              className="rounded border border-white/10 bg-[#16171A] px-2 py-1.5 text-[#5EEAD4] outline-none"
            >
              {["Jan 2021", "Jan 2023"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <span className="text-[#9CA3AF]">VS</span>
            <select
              value={t2}
              onChange={(e) => setTimeComparison(t1, e.target.value)}
              className="rounded border border-white/10 bg-[#16171A] px-2 py-1.5 text-[#5EEAD4] outline-none"
            >
              {["Jun 2024", "Jan 2025"].map((p) => <option key={p}>{p}</option>)}
            </select>

            <div className="flex overflow-hidden rounded border border-white/10 bg-[#16171A]">
              {(["side", "swipe", "overlay"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 uppercase font-semibold transition-all ${
                    mode === m ? "bg-[#5EEAD4] text-[#0B0C0E]" : "text-[#9CA3AF] hover:text-[#F5F5F4]"
                  }`}
                >
                  {m === "side" ? "SIDE-BY-SIDE" : m}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 overflow-y-auto">
        <div className="lg:col-span-8 overflow-hidden rounded border border-white/10 bg-[#16171A] h-[600px] shadow-2xl relative">
          {mode === "overlay" ? (
            <MapCanvas overlay="change" />
          ) : (
            <MapComparison mode={mode === "side" ? "side" : "swipe"} />
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="rounded border border-white/10 bg-[#16171A] p-4 shadow-2xl space-y-3">
            <div className="text-[11px] font-bold uppercase text-[#5EEAD4] border-b border-white/10 pb-2">
              TEMPORAL CHANGE METRICS
            </div>
            <div className="space-y-2 text-[11px] uppercase">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">BUILT-UP CHANGE</span>
                <span className="font-bold text-[#EF4444] num">+{cd.builtUpPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">VEGETATION LOSS</span>
                <span className="font-bold text-[#F97316] num">{cd.vegetationPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">WATER SURFACE</span>
                <span className="font-bold text-[#22C55E] num">+{cd.waterPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">CHANGED AREA</span>
                <span className="font-bold text-[#5EEAD4] num">{cd.changedAreaHa} HA</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1">
                <span>MODEL CONFIDENCE</span>
                <span className="font-bold text-[#22C55E] num">{cd.confidence}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#22C55E]" style={{ width: `${cd.confidence}%` }} />
              </div>
            </div>

            <p className="rounded border border-white/5 bg-white/5 p-3 text-[10px] text-[#9CA3AF] leading-relaxed">
              {cd.narrative}
            </p>

            <button
              onClick={highlightGrowth}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#5EEAD4] py-2 text-[11px] font-bold text-[#0B0C0E] hover:opacity-90 uppercase"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>HIGHLIGHT BUILT-UP GROWTH</span>
            </button>
          </div>

          <div className="rounded border border-white/10 bg-[#16171A] p-4 shadow-2xl space-y-3">
            <div className="text-[11px] font-bold uppercase text-[#5EEAD4] border-b border-white/10 pb-2">
              CLASSIFIED PATCHES
            </div>
            <div className="space-y-2 text-[11px] uppercase">
              {cd.classes.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: c.color }} />
                    <span className="text-[#F5F5F4]">{c.label}</span>
                  </div>
                  <span className="text-[#9CA3AF] num">{c.areaHa} HA</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
