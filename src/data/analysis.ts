import type { SpatialMetric } from "@/types";
import { accessibility } from "./accessibility";
import { changeDetection, landCover } from "./changeDetection";
import { flood } from "./flood";
import { livability } from "./livability";

const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

/** KPI strip derived from the structured mock analysis records. */
export function getKpiStrip(siteId: string): SpatialMetric[] {
  const cd = changeDetection[siteId]!;
  const fl = flood[siteId]!;
  const ac = accessibility[siteId]!;
  const lv = livability[siteId]!;
  const lc = landCover[siteId]!;
  const green = lc.categories.find((c) => c.id === "vegetation")?.pct ?? 0;

  return [
    {
      id: "builtup",
      label: "Built-up Growth",
      value: fmtPct(cd.builtUpPct),
      delta: `${cd.changedAreaHa.toFixed(1)} ha`,
      direction: "up",
      tone: "warning",
      sub: `${cd.t1} → ${cd.t2}`,
    },
    {
      id: "vegloss",
      label: "Vegetation Loss",
      value: fmtPct(cd.vegetationPct),
      delta: `${(cd.classes.find((c) => c.id === "vegloss")?.areaHa ?? 0).toFixed(1)} ha`,
      direction: "down",
      tone: "negative",
      sub: "Change detection model",
    },
    {
      id: "flood",
      label: "Flood Exposure",
      value: fl.exposure,
      delta: `${fl.exposedAreaKm2.toFixed(2)} km²`,
      direction: "flat",
      tone: fl.exposure === "High" ? "negative" : fl.exposure === "Low" ? "positive" : "warning",
      sub: "Indicative risk",
    },
    {
      id: "green",
      label: "Green Coverage",
      value: `${green.toFixed(1)}%`,
      delta: fmtPct(cd.vegetationPct / 2),
      direction: "down",
      tone: "neutral",
      sub: "Share of study area",
    },
    {
      id: "access",
      label: "Road Accessibility",
      value: `${ac.score}`,
      unit: "/100",
      delta: ac.roadAccess,
      direction: "flat",
      tone: "positive",
      sub: "Network + facility proximity",
    },
    {
      id: "livability",
      label: "Livability Score",
      value: `${lv.score}`,
      unit: "/100",
      delta: lv.band,
      direction: "flat",
      tone: lv.score >= 75 ? "positive" : "neutral",
      sub: "5-dimension weighted index",
    },
  ];
}

export const indicatorDefinitions: Record<string, string> = {
  livability:
    "A weighted composite of five dimensions (environment 25, mobility 25, safety 20, community 15, sustainability 15) normalised to 100.",
  suitability:
    "Indicative development screening combining accessibility, flood resilience, environmental compatibility, land use compatibility and infrastructure proximity.",
  accessibility:
    "Network-based measure of road proximity, connectivity, arterial access and facility catchment coverage.",
  flood:
    "Indicative flood exposure derived from water proximity, terrain, impervious surface and drainage proximity. Not a hydrological prediction.",
  change:
    "Pixel-level comparison between two temporal satellite composites, classified into built-up, vegetation, water and no-change classes.",
};
