import { Info } from "lucide-react";
import { activeWeights } from "@/lib/geo/flood";
import { formatDistance, formatLatLng } from "@/lib/geo/math";
import { LAND_LABELS } from "@/lib/geo/render";
import type { CellInspection, FloodParams } from "@/types/geo";
import { RiskBadge } from "@/components/gk/ui";

/**
 * "Why this score" — every value shown is computed for this cell by the GIS
 * engine (DEM + OSM). Nothing here is produced by a language model.
 */
export function FloodExplain({
  cell,
  params,
  title = "Why this score",
}: {
  cell: CellInspection;
  params: FloodParams;
  title?: string;
}) {
  const { w, sum } = activeWeights(params, false);
  const rows = [
    {
      factor: "Distance to river",
      input: Number.isFinite(cell.distanceM) ? formatDistance(cell.distanceM) : "No channel ≤ 4 km",
      detail: cell.channelName
        ? `${cell.channelName} (${cell.channelKind})`
        : (cell.channelKind ?? "—"),
      f: cell.fDistance,
      weight: w.distance / sum,
      formula: `0.5^(d ÷ ${params.distanceHalfM} m)`,
    },
    {
      factor: "Height above river (HAND)",
      input: Number.isFinite(cell.handM) ? `${cell.handM.toFixed(1)} m` : "—",
      detail: Number.isFinite(cell.channelElevationM)
        ? `ground ${cell.elevationM.toFixed(1)} m − river ${cell.channelElevationM.toFixed(1)} m`
        : `ground ${cell.elevationM.toFixed(1)} m`,
      f: cell.fHand,
      weight: w.hand / sum,
      formula: `0.5^(h ÷ ${params.handHalfM} m)`,
    },
    {
      factor: "Flatness",
      input: `${cell.slopeDeg.toFixed(1)}° slope`,
      detail: "DEM-derived",
      f: cell.fSlope,
      weight: w.slope / sum,
      formula: `1 − min(s ÷ ${params.slopeZeroDeg}°, 1)`,
    },
  ];

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f1115]">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold">{title}</div>
          <div className="truncate font-mono text-[10.5px] text-[#64748b]">
            {formatLatLng([cell.lat, cell.lng], 5)} · {LAND_LABELS[cell.landClass]}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="num text-[18px] font-semibold">{cell.index.toFixed(2)}</span>
          <RiskBadge cls={cell.cls} />
        </div>
      </div>
      {cell.isWater ? (
        <p className="px-3.5 py-3 text-[12px] text-[#94a3b8]">
          This cell is mapped as open water (river or water body) and is excluded from the area
          shares.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11.5px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[#64748b]">
                <th className="px-3.5 py-2 font-semibold">Input (computed)</th>
                <th className="px-2 py-2 text-right font-semibold">Factor</th>
                <th className="px-2 py-2 text-right font-semibold">Weight</th>
                <th className="px-3.5 py-2 text-right font-semibold">Adds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {rows.map((r) => (
                <tr key={r.factor}>
                  <td className="px-3.5 py-2 align-top">
                    <div className="font-medium text-white">{r.factor}</div>
                    <div className="num text-[#cbd5e1]">{r.input}</div>
                    <div className="text-[10.5px] text-[#64748b]">
                      {r.detail} · <span className="font-mono">{r.formula}</span>
                    </div>
                  </td>
                  <td className="num px-2 py-2 text-right align-top text-[#cbd5e1]">
                    {r.f.toFixed(2)}
                  </td>
                  <td className="num px-2 py-2 text-right align-top text-[#cbd5e1]">
                    {Math.round(r.weight * 100)}%
                  </td>
                  <td className="num px-3.5 py-2 text-right align-top font-semibold">
                    {(r.f * r.weight).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-white/[0.02]">
                <td className="px-3.5 py-2 font-semibold" colSpan={3}>
                  Riverine susceptibility index (RFSI)
                  <div className="text-[10.5px] font-normal text-[#64748b]">
                    High ≥ {params.highAt} · Moderate ≥ {params.moderateAt}
                  </div>
                </td>
                <td className="num px-3.5 py-2 text-right text-[14px] font-semibold">
                  {cell.index.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-2 border-t border-white/[0.06] px-3.5 py-2.5 text-[10.5px] leading-snug text-[#64748b]">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" />
        <span>
          Historical flood evidence is not included — no verified JPS/DID flood-extent layer is
          connected, so its weight is redistributed. Elevation is SRTM (~30 m) with a rooftop
          filter; parameters are illustrative and not yet calibrated against observed floods.
        </span>
      </div>
    </div>
  );
}
