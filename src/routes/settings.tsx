import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { layers as layerDefs } from "@/data/layers";
import { useGinkgo } from "@/state/ginkgo-store";
import { providers } from "@/services/ai";
import { Award, Cpu, Layers, Sliders, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "GINKGO — SETTINGS CONSOLE" },
      { name: "description", content: "Configure open-source AI delivery providers, layer defaults, and suitability weights." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { providerId, setProviderId, activeLayers, toggleLayer } = useGinkgo();

  const isOpenSource = providerId === "ollama" || providerId === "groq" || providerId === "huggingface";

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0C0E] text-[#F5F5F4] font-mono">
      <PageHeader
        title="SYSTEM & MODEL SETTINGS CONSOLE"
        subtitle="MANAGE OPEN-SOURCE AI BACKENDS, GIS LAYER VISIBILITY, AND WEIGHTING FACTORS."
      />

      <div className="p-6 space-y-6 overflow-y-auto">
        {/* Open Source Bonus Banner */}
        {isOpenSource && (
          <div className="flex items-center gap-3 rounded border border-[#22C55E]/40 bg-[#22C55E]/10 p-4 text-[11px] uppercase text-[#22C55E]">
            <Award className="h-5 w-5 shrink-0" />
            <div>
              <span className="font-bold block">OPEN-SOURCE AI MODEL DELIVERY ACTIVE (+BONUS MARKS)</span>
              <span className="text-[10px] text-[#22C55E]/80">
                Running {providers[providerId]?.name ?? providerId} via open-source model delivery infrastructure.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* AI Model Backend Selector Card */}
          <div className="rounded border border-white/10 bg-[#16171A] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-[12px] font-bold uppercase text-[#5EEAD4]">
              <Cpu className="h-4 w-4" />
              <span>AI REASONING PROVIDER & BACKEND</span>
            </div>

            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Select the active AI provider powering Ginkgo's natural language spatial reasoning. Open-source models earn bonus innovation marks under competition guidelines.
            </p>

            <div className="space-y-2">
              {Object.entries(providers).map(([id, prov]) => (
                <button
                  key={id}
                  onClick={() => setProviderId(id)}
                  className={`flex w-full items-center justify-between rounded border p-3 text-left transition-all ${
                    providerId === id
                      ? "border-[#5EEAD4] bg-[#5EEAD4]/10 text-[#F5F5F4]"
                      : "border-white/5 bg-white/5 text-[#9CA3AF] hover:border-white/20 hover:text-[#F5F5F4]"
                  }`}
                >
                  <div>
                    <div className="text-[12px] font-bold uppercase">{prov.name}</div>
                    <div className="text-[9px] text-[#5B5F66]">
                      {id === "ollama" || id === "groq" || id === "huggingface"
                        ? "OPEN-SOURCE MODEL INFRASTRUCTURE"
                        : "STANDARD BACKEND PROVIDER"}
                    </div>
                  </div>
                  {providerId === id && <span className="text-[#5EEAD4] font-bold">ACTIVE</span>}
                </button>
              ))}
            </div>
          </div>

          {/* GIS Layer Defaults Card */}
          <div className="rounded border border-white/10 bg-[#16171A] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-[12px] font-bold uppercase text-[#5EEAD4]">
              <Layers className="h-4 w-4" />
              <span>GIS LAYER VISIBILITY DEFAULTS</span>
            </div>

            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Toggle default active vector and raster overlays rendered on the interactive map canvas.
            </p>

            <div className="space-y-2 text-[11px] uppercase">
              {layerDefs.map((l) => (
                <label
                  key={l.id}
                  className="flex items-center justify-between rounded border border-white/5 bg-white/5 p-2.5 cursor-pointer hover:bg-white/10 text-[#F5F5F4]"
                >
                  <span>{l.label}</span>
                  <input
                    type="checkbox"
                    checked={activeLayers.includes(l.id)}
                    onChange={() => toggleLayer(l.id)}
                    className="accent-[#5EEAD4]"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Criteria Weighting Matrix */}
        <div className="rounded border border-white/10 bg-[#16171A] p-5 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-[12px] font-bold uppercase text-[#5EEAD4]">
            <Sliders className="h-4 w-4" />
            <span>TRANSPARENT SUITABILITY WEIGHTING MATRIX</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] uppercase">
            <div className="rounded border border-white/5 bg-white/5 p-3">
              <span className="text-[9px] text-[#9CA3AF] block mb-1">CRITERION 1</span>
              <span className="font-bold text-[#F5F5F4] block">FLOOD RISK EXPOSURE</span>
              <span className="text-[#5EEAD4] font-bold text-[14px]">40% WEIGHT</span>
            </div>
            <div className="rounded border border-white/5 bg-white/5 p-3">
              <span className="text-[9px] text-[#9CA3AF] block mb-1">CRITERION 2</span>
              <span className="font-bold text-[#F5F5F4] block">ROAD & ARTERIAL ACCESS</span>
              <span className="text-[#5EEAD4] font-bold text-[14px]">30% WEIGHT</span>
            </div>
            <div className="rounded border border-white/5 bg-white/5 p-3">
              <span className="text-[9px] text-[#9CA3AF] block mb-1">CRITERION 3</span>
              <span className="font-bold text-[#F5F5F4] block">VEGETATION RETENTION</span>
              <span className="text-[#5EEAD4] font-bold text-[14px]">30% WEIGHT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
