import { useState } from "react";
import { timePeriods } from "@/data/sites";
import { useGinkgo } from "@/state/ginkgo-store";
import { MapCanvas } from "./MapCanvas";
import { LayerControl } from "./LayerControl";
import { MapLegend } from "./MapLegend";
import { MapSearch } from "./MapSearch";
import { MapSelectionCard } from "./MapSelectionCard";
import { MapToolbar } from "./MapToolbar";
import { MapComparison } from "./MapComparison";

export function TimeCompareControl() {
  const { t1, t2, setTimeComparison } = useGinkgo();
  return (
    <div className="ginkgo-float px-3 py-2">
      <div className="label-caps mb-1.5">Time Comparison</div>
      <div className="flex items-center gap-2 text-[12px]">
        <select
          value={t1}
          onChange={(e) => setTimeComparison(e.target.value, t2)}
          className="rounded border border-border bg-card px-2 py-1 outline-none"
          aria-label="T1 period"
        >
          {timePeriods.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <span className="text-muted-foreground">vs</span>
        <select
          value={t2}
          onChange={(e) => setTimeComparison(t1, e.target.value)}
          className="rounded border border-border bg-card px-2 py-1 outline-none"
          aria-label="T2 period"
        >
          {timePeriods.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function MapWorkspace({
  height = "h-[520px]",
  overlay,
  showTime = true,
}: {
  height?: string;
  overlay?: "change" | "flood" | "landuse" | "accessibility" | "suitability";
  showTime?: boolean;
}) {
  const [compare, setCompare] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-panel)]">
      <div className={`relative ${height}`}>
        {compare ? <MapComparison /> : <MapCanvas overlay={overlay} />}

        <div className="absolute left-4 top-4 flex items-start gap-3">
          <MapSearch />
        </div>
        <div className="absolute left-4 top-[60px] flex items-start gap-3">
          <MapToolbar onCompare={() => setCompare((c) => !c)} />
          <LayerControl />
        </div>
        {showTime && (
          <div className="absolute right-[268px] top-4 hidden xl:block">
            <TimeCompareControl />
          </div>
        )}
        <div className="absolute right-4 top-4">
          <MapSelectionCard />
        </div>
      </div>
      <MapLegend />
    </div>
  );
}
