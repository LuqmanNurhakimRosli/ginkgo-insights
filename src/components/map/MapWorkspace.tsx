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
    <div className="ginkgo-float flex items-center gap-2 px-3 py-2">
      <span className="label-caps">T1 / T2</span>
      <select
        value={t1}
        onChange={(e) => setTimeComparison(e.target.value, t2)}
        className="rounded border border-border bg-card px-2 py-1 text-[12px] outline-none"
        aria-label="T1 period"
      >
        {timePeriods.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <span className="text-[12px] text-muted-foreground">vs</span>
      <select
        value={t2}
        onChange={(e) => setTimeComparison(t1, e.target.value)}
        className="rounded border border-border bg-card px-2 py-1 text-[12px] outline-none"
        aria-label="T2 period"
      >
        {timePeriods.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Single standard map composition.
 * Overlay system: search top-left, tools + layers below it, exactly ONE
 * contextual card on the right, slim legend strip along the bottom.
 * `compact` renders the supporting-context variant (Livability / Planning)
 * where the map is not the page subject.
 */
export function MapWorkspace({
  height = "h-[520px]",
  overlay,
  showTime = true,
  compact = false,
}: {
  height?: string;
  overlay?: "change" | "flood" | "landuse" | "accessibility" | "suitability";
  showTime?: boolean;
  compact?: boolean;
}) {
  const [compare, setCompare] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
      <div className={`relative ${height}`}>
        {compare ? <MapComparison /> : <MapCanvas overlay={overlay} />}

        {!compact && (
          <div className="absolute left-4 top-4">
            <MapSearch />
          </div>
        )}

        <div className={`absolute left-4 flex items-start gap-3 ${compact ? "top-4" : "top-[68px]"}`}>
          <MapToolbar onCompare={() => setCompare((c) => !c)} />
          {!compact && <LayerControl />}
        </div>

        {showTime && (
          <div className="absolute bottom-4 left-4 hidden md:block">
            <TimeCompareControl />
          </div>
        )}

        {!compact && (
          <div className="absolute right-4 top-4">
            <MapSelectionCard />
          </div>
        )}
      </div>
      <MapLegend />
    </div>
  );
}
