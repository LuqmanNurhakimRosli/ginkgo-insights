import { createFileRoute } from "@tanstack/react-router";
import { ScoreDial } from "@/components/metrics/ScoreDial";
import { MapCanvas } from "@/components/map/MapCanvas";
import { livability } from "@/data/livability";
import { sites } from "@/data/sites";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";

export const Route = createFileRoute("/livability")({
  head: () => ({
    meta: [
      { title: "GINKGO — INTELLIGENCE" },
      { name: "description", content: "Livability, suitability, and multi-dimension spatial index breakdown." },
    ],
  }),
  component: IntelligenceView,
});

export function IntelligenceView() {
  const site = useSelectedSite();
  const { selectSite } = useGinkgo();
  const lv = livability[site.id]!;

  const getDimensionColor = (pct: number) => {
    if (pct >= 80) return "bg-[#22C55E]";
    if (pct >= 65) return "bg-[#EAB308]";
    if (pct >= 45) return "bg-[#F97316]";
    return "bg-[#EF4444]";
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0B0C0E] p-4">
      {/* Top Header Bar */}
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[11px] uppercase tracking-widest text-[#9CA3AF]">
        <div>
          <span className="font-bold text-[#F5F5F4]">VIEW 2 // INTELLIGENCE CONSOLE</span>
          <span className="ml-3 text-[#5EEAD4]">SITE: {site.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>PARCEL SELECTOR:</span>
          <select
            value={site.id}
            onChange={(e) => selectSite(e.target.value)}
            className="rounded border border-white/10 bg-[#16171A] px-2 py-1 text-[10px] text-[#F5F5F4] uppercase outline-none"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid composition (fixed 100vh height inside main) */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12">
        {/* Left Col (Score + Dimension Breakdown) — 5 cols */}
        <div className="flex flex-col gap-4 overflow-y-auto lg:col-span-5">
          {/* Dial Card */}
          <div className="flex flex-col items-center justify-center rounded border border-white/10 bg-[#16171A] p-6 shadow-2xl">
            <ScoreDial
              score={lv.score}
              label={`${site.name} LIVABILITY INDEX`}
              sublabel={`CLASSIFICATION: ${lv.band.toUpperCase()}`}
            />
          </div>

          {/* Dimension Breakdown Card */}
          <div className="flex-1 rounded border border-white/10 bg-[#16171A] p-4">
            <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F4]">
              DIMENSION BREAKDOWN
            </div>
            <div className="space-y-3">
              {lv.dimensions.map((d) => {
                const pct = Math.round((d.score / d.weight) * 100);
                const barColor = getDimensionColor(pct);

                return (
                  <div key={d.id} className="font-mono text-[10px] uppercase">
                    <div className="flex justify-between mb-1 text-[#9CA3AF]">
                      <span>
                        {d.label} <span className="text-[#5B5F66]">({d.weight} PTS)</span>
                      </span>
                      <span className="font-semibold text-[#F5F5F4] num">
                        {d.score} / {d.weight}
                      </span>
                    </div>
                    {/* Thin horizontal bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full ${barColor} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[9px] text-[#5B5F66]">{d.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Col (Why This Score Evidence) — 4 cols */}
        <div className="flex flex-col gap-4 overflow-y-auto lg:col-span-4">
          <div className="flex-1 rounded border border-white/10 bg-[#16171A] p-4">
            <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F4]">
              SCORE JUSTIFICATION & EVIDENCE
            </div>

            <div className="space-y-4 font-mono text-[11px]">
              <div>
                <span className="text-[10px] uppercase text-[#22C55E] tracking-wider block mb-2 font-semibold">
                  POSITIVE CONTRIBUTORS (↗)
                </span>
                <div className="space-y-2">
                  {lv.positives.map((p) => (
                    <div
                      key={p}
                      className="flex items-start gap-2 rounded border border-white/5 bg-white/5 p-2.5 text-[#F5F5F4]"
                    >
                      <span className="text-[#22C55E] font-bold">↗</span>
                      <span className="uppercase text-[10px] leading-snug">{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase text-[#F97316] tracking-wider block mb-2 font-semibold">
                  CONSTRAINTS & DEGRADATION (↘)
                </span>
                <div className="space-y-2">
                  {lv.negatives.map((n) => (
                    <div
                      key={n}
                      className="flex items-start gap-2 rounded border border-white/5 bg-white/5 p-2.5 text-[#F5F5F4]"
                    >
                      <span className="text-[#F97316] font-bold">↘</span>
                      <span className="uppercase text-[10px] leading-snug">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col (Supporting Map Inset ~30% width) — 3 cols */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="h-64 w-full overflow-hidden rounded border border-white/10 bg-[#16171A] relative shadow-2xl">
            <div className="absolute top-2 left-2 z-20 rounded bg-[#0B0C0E]/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#5EEAD4]">
              SPATIAL INSET
            </div>
            <MapCanvas overlay="accessibility" interactive={false} />
          </div>

          {/* Site Comparison Tiles */}
          <div className="flex-1 rounded border border-white/10 bg-[#16171A] p-3 overflow-y-auto">
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
              PARCEL COMPARISON
            </div>
            <div className="grid grid-cols-1 gap-2">
              {sites.map((s) => {
                const isSelected = s.id === site.id;
                const score = livability[s.id]?.score ?? 0;

                return (
                  <button
                    key={s.id}
                    onClick={() => selectSite(s.id)}
                    className={`flex items-center justify-between rounded border p-2.5 transition-all text-left font-mono ${
                      isSelected
                        ? "border-[#5EEAD4] bg-[#5EEAD4]/10 text-[#F5F5F4]"
                        : "border-white/5 bg-white/5 text-[#9CA3AF] hover:border-white/20"
                    }`}
                  >
                    <div>
                      <div className="text-[11px] font-bold uppercase">{s.name}</div>
                      <div className="text-[9px] text-[#5B5F66]">{s.locality}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-bold num text-[#5EEAD4]">{score}</div>
                      <div className="text-[8px] uppercase text-[#9CA3AF]">PTS</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
