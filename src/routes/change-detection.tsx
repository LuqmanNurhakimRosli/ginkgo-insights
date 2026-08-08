import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { MapComparison } from "@/components/map/MapComparison";
import { MapLegend } from "@/components/map/MapLegend";
import { MapCanvas } from "@/components/map/MapCanvas";
import { ProgressMetric } from "@/components/metrics/MetricCard";
import { changeDetection } from "@/data/changeDetection";
import { sites } from "@/data/sites";
import { useGinkgo, useSelectedSite } from "@/state/ginkgo-store";

export const Route = createFileRoute("/change-detection")({
  head: () => ({
    meta: [
      { title: "Temporal Change Detection — Ginkgo" },
      { name: "description", content: "Compare T1 and T2 satellite composites and quantify built-up, vegetation and water change." },
      { property: "og:title", content: "Temporal Change Detection — Ginkgo" },
      { property: "og:description", content: "Compare T1 and T2 satellite composites and quantify built-up, vegetation and water change." },
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
    <div>
      <PageHeader
        title="Temporal Change Detection"
        subtitle="Pixel-level comparison between two temporal composites, classified into built-up, vegetation and water change."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            <select value={site.id} onChange={(e) => selectSite(e.target.value)} className="rounded-md border border-border px-2 py-1.5">
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select value={t1} onChange={(e) => setTimeComparison(e.target.value, t2)} className="rounded-md border border-border px-2 py-1.5">
              {["Jan 2021", "Jan 2023"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={t2} onChange={(e) => setTimeComparison(t1, e.target.value)} className="rounded-md border border-border px-2 py-1.5">
              {["Jun 2024", "Jan 2025"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <div className="flex overflow-hidden rounded-md border border-border">
              {(["side", "swipe", "overlay"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2.5 py-1.5 capitalize ${mode === m ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                >
                  {m === "side" ? "Side-by-side" : m}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="h-[520px]">
            {mode === "overlay" ? <MapCanvas overlay="change" /> : <MapComparison mode={mode === "side" ? "side" : "swipe"} />}
          </div>
          <MapLegend />
        </div>

        <aside className="space-y-4">
          <div className="ginkgo-panel px-4 py-4">
            <h2 className="text-[13.5px] font-semibold">Change Summary</h2>
            <dl className="mt-3 space-y-2 text-[12.5px]">
              {[
                ["Built-up", `+${cd.builtUpPct}%`],
                ["Vegetation", `${cd.vegetationPct}%`],
                ["Water", `+${cd.waterPct}%`],
                ["Changed area", `${cd.changedAreaHa} ha`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="num font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3">
              <ProgressMetric label="Model confidence" value={cd.confidence} />
            </div>
            <p className="mt-3 rounded-md bg-surface px-3 py-2 text-[12px] leading-snug text-muted-foreground">
              {cd.narrative}
            </p>
            <button
              onClick={highlightGrowth}
              className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-[12.5px] font-semibold text-primary-foreground"
            >
              Highlight Built-up Growth
            </button>
          </div>

          <div className="ginkgo-panel px-4 py-4">
            <h2 className="text-[13.5px] font-semibold">Change Classes</h2>
            <ul className="mt-2.5 space-y-2 text-[12.5px]">
              {cd.classes.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: c.color }} />
                  <span className="flex-1">{c.label}</span>
                  <span className="num text-muted-foreground">{c.areaHa} ha</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
