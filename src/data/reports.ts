import type { Dataset, ModelStatus, Report } from "@/types";
import { accessibility } from "./accessibility";
import { changeDetection, landCover } from "./changeDetection";
import { flood } from "./flood";
import { livability } from "./livability";
import { getSite } from "./sites";
import { globalDisclaimer, recommendations, suitability } from "./suitability";

export function buildReport(siteId: string): Report {
  const site = getSite(siteId)!;
  const cd = changeDetection[siteId]!;
  const lc = landCover[siteId]!;
  const ac = accessibility[siteId]!;
  const fl = flood[siteId]!;
  const lv = livability[siteId]!;
  const su = suitability[siteId]!;
  const rec = recommendations[siteId]!;

  return {
    id: `RPT-${site.id.toUpperCase()}`,
    siteId,
    title: `Ginkgo Spatial Planning Assessment — ${site.name}`,
    status: "Ready",
    generatedAt: "12 Feb 2026",
    summary: `${site.name} (${site.areaHa} ha, ${site.locality}) records a livability index of ${lv.score}/100 and a development suitability score of ${su.score}/100 (${su.classification}).`,
    sections: [
      { title: "Executive Summary", body: rec.headline },
      {
        title: "Study Area",
        body: `${site.name}, ${site.locality}. Area ${site.areaHa} ha. Dominant land use: ${site.dominantLandUse}.`,
      },
      {
        title: "Temporal Change",
        body: `Between ${cd.t1} and ${cd.t2}, built-up area changed by ${cd.builtUpPct}%, vegetation by ${cd.vegetationPct}% and water by ${cd.waterPct}%. Total changed area ${cd.changedAreaHa} ha at ${cd.confidence}% model confidence. ${cd.narrative}`,
      },
      {
        title: "Land Cover",
        body: lc.categories.map((c) => `${c.label} ${c.pct}%`).join(" · "),
      },
      {
        title: "Accessibility",
        body: `Accessibility score ${ac.score}/100. Road access ${ac.roadAccess}, facility access ${ac.facilityAccess}, connectivity ${ac.connectivity}.`,
      },
      {
        title: "Flood / Resilience",
        body: `Flood exposure: ${fl.exposure} (indicative) across ${fl.exposedAreaKm2} km². Resilience indicator ${fl.resilienceIndicator}/100. Planner review required.`,
      },
      {
        title: "Sustainability",
        body: `Vegetation retention and growth pattern indicators contribute ${lv.dimensions.find((d) => d.id === "sustainability")?.score}/15 to the livability index.`,
      },
      {
        title: "Livability Index",
        body: lv.dimensions
          .map((d) => `${d.label} ${d.score}/${d.weight}`)
          .join(" · ") + ` → ${lv.score}/100 (${lv.band}).`,
      },
      {
        title: "Development Suitability",
        body: su.criteria
          .map((c) => `${c.label} (${c.weightPct}%) ${c.score}/100`)
          .join(" · ") + ` → ${su.score}/100 (${su.classification}).`,
      },
      { title: "AI Planning Recommendation", body: rec.headline },
      { title: "Risks & Constraints", body: rec.constraints.join(" · ") },
      {
        title: "Suggested Actions",
        body: rec.actions.map((a, i) => `${i + 1}. ${a}`).join("  "),
      },
      {
        title: "Methodology",
        body: "Temporal satellite composites are compared and classified, spatial indicators are computed per parcel, and indicators are combined using published, transparent weights. All values in this prototype are dummy data.",
      },
      {
        title: "Data & Models",
        body: "Prototype imagery (T1/T2), mock change detection model, mock suitability model, Ginkgo mock AI provider. No production models are connected.",
      },
      { title: "Disclaimer", body: globalDisclaimer },
    ],
  };
}

export const datasets: Dataset[] = [
  {
    id: "ds-1",
    name: "Satellite T1 (Prototype)",
    type: "Raster",
    location: "Site A",
    period: "Jan 2023",
    status: "Processed",
    processing: "Complete",
    model: "—",
    updated: "02 Feb 2026",
  },
  {
    id: "ds-2",
    name: "Satellite T2 (Prototype)",
    type: "Raster",
    location: "Site A",
    period: "Jan 2025",
    status: "Processed",
    processing: "Complete",
    model: "—",
    updated: "02 Feb 2026",
  },
  {
    id: "ds-3",
    name: "Change Map",
    type: "GeoJSON",
    location: "Site A",
    period: "2023–2025",
    status: "Generated",
    processing: "Complete",
    model: "Mock Change Model",
    updated: "05 Feb 2026",
  },
  {
    id: "ds-4",
    name: "Land Cover Classification",
    type: "GeoJSON",
    location: "Site A · Site B",
    period: "2025",
    status: "Generated",
    processing: "Complete",
    model: "Mock Land Cover Model",
    updated: "05 Feb 2026",
  },
  {
    id: "ds-5",
    name: "Flood Exposure Surface",
    type: "Raster",
    location: "Site C",
    period: "2025",
    status: "Prototype",
    processing: "Queued",
    model: "Mock Flood Model",
    updated: "08 Feb 2026",
  },
  {
    id: "ds-6",
    name: "Road Network",
    type: "Vector",
    location: "All sites",
    period: "2025",
    status: "Prototype",
    processing: "Complete",
    model: "—",
    updated: "08 Feb 2026",
  },
  {
    id: "ds-7",
    name: "Suitability Surface",
    type: "GeoJSON",
    location: "All sites",
    period: "2025",
    status: "Generated",
    processing: "Complete",
    model: "Mock Suitability Model",
    updated: "10 Feb 2026",
  },
  {
    id: "ds-8",
    name: "Livability Index Table",
    type: "Tabular",
    location: "All sites",
    period: "2025",
    status: "Generated",
    processing: "Complete",
    model: "Ginkgo Index v0.3",
    updated: "10 Feb 2026",
  },
  {
    id: "ds-9",
    name: "Satellite T1 (Rural)",
    type: "Raster",
    location: "Site D",
    period: "Jan 2023",
    status: "Processed",
    processing: "Complete",
    model: "—",
    updated: "11 Feb 2026",
  },
  {
    id: "ds-10",
    name: "Public Facilities",
    type: "Vector",
    location: "All sites",
    period: "2025",
    status: "Prototype",
    processing: "Complete",
    model: "—",
    updated: "11 Feb 2026",
  },
];

export const models: ModelStatus[] = [
  {
    id: "model-a",
    name: "Change Detection / Land Cover",
    owner: "Person A",
    status: "Not Connected",
    note: "Adapter ready — swap the mock analysis adapter when the trained model lands.",
  },
  {
    id: "model-b",
    name: "Suitability / Flood Risk",
    owner: "Person B",
    status: "Not Connected",
    note: "Adapter ready — swap the mock analysis adapter when the trained model lands.",
  },
  {
    id: "model-ai",
    name: "Ginkgo Planning Agent",
    owner: "Mock AI Provider",
    status: "Mock",
    note: "Gemini provider is wired behind the same interface via the backend.",
  },
];
