import { Link } from "@tanstack/react-router";
import { ArrowRight, Star } from "lucide-react";
import { livability } from "@/data/livability";
import { useSelectedSite } from "@/state/ginkgo-store";
import { cn } from "@/lib/utils";

export function MapSelectionCard() {
  const site = useSelectedSite();
  const lv = livability[site.id]!;
  const stars = Math.round(lv.score / 20);

  return (
    <div className="ginkgo-float w-[248px] fade-up">
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
        <span className="label-caps">Selected Site</span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
            site.suitabilityClass === "Low Suitability"
              ? "bg-warning-soft text-warning"
              : "bg-primary-soft text-accent-foreground",
          )}
        >
          {site.suitabilityClass}
        </span>
      </div>
      <div className="px-3.5 py-3">
        <div className="text-[15px] font-semibold">{site.name}</div>
        <div className="text-[11.5px] text-muted-foreground">{site.locality}</div>

        <div className="mt-3">
          <div className="label-caps">Livability</div>
          <div className="flex items-end gap-2">
            <span className="num text-[28px] font-semibold leading-none">{lv.score}</span>
            <span className="pb-1 text-[12px] text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-1 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < stars ? "fill-primary text-primary" : "text-border",
                )}
              />
            ))}
          </div>
        </div>

        <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-[12px]">
          {[
            ["Area", `${site.areaHa} ha`],
            ["Dominant Land Use", site.dominantLandUse],
            ["Flood Risk", site.floodRisk],
            ["Road Access", site.roadAccess],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <Link
          to="/analysis/site/$id"
          params={{ id: site.id }}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-border py-2 text-[12.5px] font-medium transition-colors hover:bg-secondary"
        >
          View Full Analysis <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
