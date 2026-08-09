import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapCanvas } from "@/components/map/MapCanvas";
import { Callout } from "@/components/ui/Callout";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";
import { sites } from "@/data/sites";
import { getKpiStrip } from "@/data/analysis";
import { LayerControl } from "@/components/map/LayerControl";
import { Layers } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GINKGO — COMMAND HUD" },
      {
        name: "description",
        content: "Mission Control HUD for real-time spatial change, livability, and development suitability.",
      },
    ],
  }),
  component: CommandView,
});

type Mode = "CURRENT" | "CHANGE" | "SUITABILITY" | "LIVABILITY";

export function CommandView() {
  const [activeMode, setActiveMode] = useState<Mode>("CURRENT");
  const [showLayers, setShowLayers] = useState(false);
  const site = useSelectedSite();
  const { selectSite } = useGinkgo();
  const kpis = getKpiStrip(site.id);

  const overlayMap: Record<Mode, "change" | "flood" | "landuse" | "accessibility" | "suitability" | undefined> = {
    CURRENT: "landuse",
    CHANGE: "change",
    SUITABILITY: "suitability",
    LIVABILITY: "accessibility",
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0B0C0E]">
      {/* Hero Map Canvas Frame */}
      <div className="relative flex-1 w-full overflow-hidden">
        <MapCanvas overlay={overlayMap[activeMode]} />

        {/* Floating Mode Toggle Bar (Top-Left overlay) */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-1 rounded border border-white/10 bg-[#16171A]/90 p-1 backdrop-blur shadow-2xl">
          {(["CURRENT", "CHANGE", "SUITABILITY", "LIVABILITY"] as Mode[]).map((mode) => {
            const isActive = activeMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`rounded px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-[#5EEAD4] font-semibold text-[#0B0C0E] shadow-[0_0_10px_rgba(94,234,212,0.3)]"
                    : "text-[#9CA3AF] hover:bg-white/5 hover:text-[#F5F5F4]"
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>

        {/* Floating Layer Control Button */}
        <div className="absolute top-4 left-[410px] z-30 hidden lg:block">
          <button
            onClick={() => setShowLayers((s) => !s)}
            className="flex items-center gap-2 rounded border border-white/10 bg-[#16171A]/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[#F5F5F4] backdrop-blur hover:border-white/20"
          >
            <Layers className="h-3 w-3 text-[#5EEAD4]" />
            <span>LAYERS</span>
          </button>
          {showLayers && (
            <div className="absolute top-10 left-0 z-40 w-56 rounded border border-white/10 bg-[#16171A]/95 p-3 shadow-2xl backdrop-blur">
              <LayerControl />
            </div>
          )}
        </div>

        {/* Floating Selected Site HUD Card (Top-Right overlay) */}
        <div className="absolute top-4 right-4 z-30 w-80 rounded border border-white/10 bg-[#16171A]/90 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#9CA3AF]">
                SELECTED PARCEL
              </span>
              <h2 className="font-mono text-[14px] font-bold uppercase tracking-wide text-[#F5F5F4]">
                {site.name}
              </h2>
              <p className="font-mono text-[10px] uppercase text-[#9CA3AF]">{site.locality}</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#9CA3AF]">
                LIVABILITY
              </span>
              <div className="font-mono text-[22px] font-bold num text-[#5EEAD4]">
                {site.livability}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 font-mono text-[10px] uppercase text-[#9CA3AF]">
            <div>
              <span className="block text-[9px] text-[#5B5F66]">AREA</span>
              <span className="font-semibold text-[#F5F5F4] num">{site.areaHa} HA</span>
            </div>
            <div>
              <span className="block text-[9px] text-[#5B5F66]">LAND USE</span>
              <span className="font-semibold text-[#F5F5F4]">{site.dominantLandUse}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
            <span className="font-mono text-[10px] uppercase text-[#9CA3AF]">FLOOD EXPOSURE</span>
            <span className="rounded bg-[#EAB308]/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#EAB308]">
              {site.floodRisk}
            </span>
          </div>

          {/* Quick Site Switcher Buttons (A, B, C, D) */}
          <div className="mt-3 flex gap-1 pt-1">
            {sites.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSite(s.id)}
                className={`flex-1 rounded border py-1.5 font-mono text-[10px] font-bold uppercase transition-all ${
                  s.id === site.id
                    ? "border-[#5EEAD4] bg-[#5EEAD4]/20 text-[#5EEAD4] shadow-[0_0_8px_rgba(94,234,212,0.3)]"
                    : "border-white/10 bg-white/5 text-[#9CA3AF] hover:border-white/20 hover:text-[#F5F5F4]"
                }`}
              >
                {s.name.replace("Site ", "")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom KPI Strip — Thin horizontal band */}
      <div className="flex h-12 w-full shrink-0 items-center gap-3 overflow-x-auto border-t border-white/10 bg-[#0B0C0E] px-4">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#5EEAD4]">
          METRICS:
        </span>
        <div className="flex items-center gap-3">
          <Callout label="BUILT-UP" value="+18.6%" direction="up-right" tone="heatmap-high" />
          <Callout label="VEGETATION" value="-12.3%" direction="down-right" tone="heatmap-elevated" />
          <Callout label="FLOOD RISK" value="MODERATE" direction="straight" tone="heatmap-moderate" />
          <Callout label="LIVABILITY" value={`${site.livability}/100`} direction="up-right" tone="heatmap-low" />
          <Callout label="SUITABILITY" value={`${site.suitability}/100`} direction="up-right" tone="cyan" />
          <Callout label="ACCESSIBILITY" value="91/100" direction="up-right" tone="cyan" />
        </div>
      </div>
    </div>
  );
}
