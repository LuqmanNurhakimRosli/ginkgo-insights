import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Cpu, Map as MapIcon, RotateCcw, Trash2, Waves, HeartPulse } from "lucide-react";
import { btn, Page, PageHeader, Panel, PanelHeader } from "@/components/gk/ui";
import { BASEMAPS } from "@/data/basemaps";
import { DEFAULT_FLOOD_PARAMS } from "@/lib/geo/flood";
import { DEFAULT_SCORE_WEIGHTS, type ScoreWeights } from "@/lib/geo/indicators";
import { providers } from "@/services/ai";
import { llmStatus } from "@/services/ai/llmProxy";
import { useGinkgo } from "@/state/ginkgo-store";
import type { FloodParams } from "@/types/geo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Ginkgo" },
      {
        name: "description",
        content: "Model parameters, score weights, copilot engine and map defaults.",
      },
    ],
  }),
  component: SettingsPage,
});

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint?: ReactNode;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-[12.5px]">
        <span>{label}</span>
        <span className="num text-[#cbd5e1]">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label={label}
      />
      {hint && <div className="mt-0.5 text-[10.5px] text-[#64748b]">{hint}</div>}
    </label>
  );
}

const LIV_LABELS: Record<keyof ScoreWeights["livability"], string> = {
  environment: "Environmental quality",
  mobility: "Mobility & access",
  resilience: "Flood resilience",
  community: "Community facilities",
  mix: "Land-use mix",
};

function SettingsPage() {
  const { settings, updateSettings, savedAreas, clearLocalData, analysis } = useGinkgo();
  const [server, setServer] = useState<{ gemini: boolean; groq: boolean } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    llmStatus()
      .then(setServer)
      .catch(() => setServer({ gemini: false, groq: false }));
  }, []);

  const fp = settings.floodParams;
  const setFlood = (patch: Partial<FloodParams>) =>
    updateSettings({ floodParams: { ...fp, ...patch } });
  const setFloodW = (k: "distance" | "hand" | "slope", v: number) =>
    setFlood({ weights: { ...fp.weights, [k]: v } });
  const liv = settings.scoreWeights.livability;

  return (
    <Page
      header={
        <PageHeader
          title="Settings"
          description="Saved on this device. Model changes re-score the current area instantly — no data is re-downloaded."
        />
      }
    >
      <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-2 lg:p-6">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Riverine flood model"
            icon={<Waves className="h-4 w-4" />}
            hint={
              analysis
                ? `Changes re-score ${analysis.aoi.name} immediately.`
                : "Applies to every analysis."
            }
            action={
              <button
                onClick={() => updateSettings({ floodParams: DEFAULT_FLOOD_PARAMS })}
                className={btn.ghost}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Defaults
              </button>
            }
          />
          <div className="grid gap-5 p-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                Weights (normalised)
              </div>
              <Slider
                label="Distance to river (w₁)"
                value={fp.weights.distance}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => setFloodW("distance", v)}
              />
              <Slider
                label="Height above river — HAND (w₂)"
                value={fp.weights.hand}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => setFloodW("hand", v)}
              />
              <Slider
                label="Flatness (w₃)"
                value={fp.weights.slope}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => setFloodW("slope", v)}
                hint="Kept low by default so flat land far from rivers cannot read as High."
              />
              <div className="rounded-lg border border-white/[0.06] px-3 py-2 text-[11px] text-[#64748b]">
                Historical evidence (w₄ = {fp.weights.history}) is inactive until a verified JPS/DID
                flood-extent layer is connected.
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                Factor shapes &amp; classes
              </div>
              <Slider
                label="Distance half-value d½"
                value={fp.distanceHalfM}
                min={50}
                max={800}
                step={25}
                unit=" m"
                onChange={(v) => setFlood({ distanceHalfM: v })}
                hint="Proximity factor halves every d½ metres from the river."
              />
              <Slider
                label="HAND half-value h½"
                value={fp.handHalfM}
                min={1}
                max={15}
                step={0.5}
                unit=" m"
                onChange={(v) => setFlood({ handHalfM: v })}
                hint="Height factor halves every h½ metres above the river."
              />
              <Slider
                label="Slope at zero flatness"
                value={fp.slopeZeroDeg}
                min={5}
                max={30}
                step={1}
                unit="°"
                onChange={(v) => setFlood({ slopeZeroDeg: v })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Slider
                  label="High ≥"
                  value={fp.highAt}
                  min={0.4}
                  max={0.9}
                  step={0.05}
                  onChange={(v) => setFlood({ highAt: Math.max(v, fp.moderateAt + 0.05) })}
                />
                <Slider
                  label="Moderate ≥"
                  value={fp.moderateAt}
                  min={0.1}
                  max={0.6}
                  step={0.05}
                  onChange={(v) => setFlood({ moderateAt: Math.min(v, fp.highAt - 0.05) })}
                />
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Livability weights"
            icon={<HeartPulse className="h-4 w-4" />}
            action={
              <button
                onClick={() =>
                  updateSettings({
                    scoreWeights: {
                      ...settings.scoreWeights,
                      livability: DEFAULT_SCORE_WEIGHTS.livability,
                    },
                  })
                }
                className={btn.ghost}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Defaults
              </button>
            }
          />
          <div className="space-y-4 p-4">
            {(Object.keys(LIV_LABELS) as Array<keyof ScoreWeights["livability"]>).map((k) => (
              <Slider
                key={k}
                label={LIV_LABELS[k]}
                value={liv[k]}
                min={0}
                max={50}
                step={1}
                onChange={(v) =>
                  updateSettings({
                    scoreWeights: { ...settings.scoreWeights, livability: { ...liv, [k]: v } },
                  })
                }
              />
            ))}
            <p className="text-[10.5px] text-[#64748b]">
              Suitability weights are adjusted on the Suitability page.
            </p>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader
              title="Copilot engine"
              icon={<Cpu className="h-4 w-4" />}
              hint="Scores are always computed by the GIS engine; the engine only writes explanations."
            />
            <ul className="space-y-2 p-4">
              {Object.values(providers).map((p) => {
                const active = settings.providerId === p.id;
                const status =
                  p.id === "gemini"
                    ? server?.gemini
                      ? "Key configured"
                      : "No server key"
                    : p.id === "groq"
                      ? server?.groq
                        ? "Key configured"
                        : "No server key"
                      : p.kind === "local"
                        ? "Runs on your computer"
                        : "Always available";
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => updateSettings({ providerId: p.id })}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                        active
                          ? "border-white bg-white/[0.06]"
                          : "border-white/[0.08] hover:border-white/25",
                      )}
                      aria-pressed={active}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          active ? "border-white bg-white text-[#090a0c]" : "border-white/30",
                        )}
                      >
                        {active && <Check className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 text-[12.5px] font-medium">
                          {p.name}
                          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-normal text-[#94a3b8]">
                            {status}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[11.5px] leading-snug text-[#94a3b8]">
                          {p.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="Map defaults" icon={<MapIcon className="h-4 w-4" />} />
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-5 gap-1.5">
                {BASEMAPS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => updateSettings({ basemap: b.id })}
                    aria-pressed={settings.basemap === b.id}
                    className={cn(
                      "rounded-md border py-2 text-[11.5px]",
                      settings.basemap === b.id
                        ? "border-white bg-white text-[#090a0c]"
                        : "border-white/10 hover:bg-white/[0.06]",
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <Slider
                label="Overlay opacity"
                value={Math.round(settings.layerOpacity * 100)}
                min={20}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => updateSettings({ layerOpacity: v / 100 })}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Data on this device" icon={<Trash2 className="h-4 w-4" />} />
            <div className="space-y-3 p-4 text-[12.5px]">
              <p className="text-[#94a3b8]">
                {savedAreas.length} saved area{savedAreas.length === 1 ? "" : "s"}, settings and
                layer preferences are stored in this browser only. Nothing is sent to a Ginkgo
                server.
              </p>
              {confirmClear ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[#fca5a5]">Delete saved areas and reset settings?</span>
                  <button
                    onClick={() => {
                      clearLocalData();
                      setConfirmClear(false);
                    }}
                    className={cn(btn.primary, "bg-[#ef4444] text-white hover:bg-[#dc2626]")}
                  >
                    Delete
                  </button>
                  <button onClick={() => setConfirmClear(false)} className={btn.ghost}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmClear(true)} className={btn.secondary}>
                  <Trash2 className="h-3.5 w-3.5" /> Clear local data
                </button>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </Page>
  );
}
