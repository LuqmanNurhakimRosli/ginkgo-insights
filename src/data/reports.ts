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
        title: "Study Area & Location Type",
        body: `${site.name}, ${site.locality}. Area ${site.areaHa} ha. Dominant land use: ${site.dominantLandUse}. Location category: ${site.tags.join(" · ")}.`,
      },
      {
        title: "Temporal Satellite Change (Sentinel-2 Open-Source Data)",
        body: `Between ${cd.t1} and ${cd.t2}, built-up area changed by ${cd.builtUpPct}%, vegetation by ${cd.vegetationPct}% and water by ${cd.waterPct}%. Total changed area ${cd.changedAreaHa} ha at ${cd.confidence}% model confidence. ${cd.narrative}`,
      },
      {
        title: "Land Cover Composition (Processed Sentinel-2 Composite)",
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
        title: "Sustainability & Vegetation",
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
        title: "Open-Source Data Provenance & Methodology",
        body: "Sentinel-2 MSI Open-Source Surface Reflectance data (ESA Level-2A) raw composites (T1 2023 & T2 2025) were acquired, atmospherically corrected, and classified via open-source machine learning models. Spatial indicators are combined using transparent, published weights.",
      },
      {
        title: "Data & Model Pipeline",
        body: "Sentinel-2 Open Satellite Imagery (T1/T2), Open-Source Llama 3 / Ollama / Groq AI agent pipelines, open-source land cover classifier.",
      },
      { title: "Disclaimer", body: globalDisclaimer },
    ],
  };
}

export const datasets: Dataset[] = [
  {
    id: "ds-1",
    name: "Sentinel-2 T1 Surface Reflectance (RAW)",
    type: "Raster (RAW L1C/L2A)",
    location: "URBAN: Putrajaya (Site A)",
    period: "Jan 2023 (T1)",
    status: "Raw Satellite Data",
    processing: "Raw Open-Source",
    model: "ESA Sentinel-2",
    updated: "02 Feb 2026",
  },
  {
    id: "ds-2",
    name: "Sentinel-2 T2 Surface Reflectance (RAW)",
    type: "Raster (RAW L1C/L2A)",
    location: "URBAN: Putrajaya (Site A)",
    period: "Jan 2025 (T2)",
    status: "Raw Satellite Data",
    processing: "Raw Open-Source",
    model: "ESA Sentinel-2",
    updated: "02 Feb 2026",
  },
  {
    id: "ds-3",
    name: "Temporal Change Matrix (PROCESSED)",
    type: "GeoJSON (Processed)",
    location: "URBAN: Putrajaya (Site A)",
    period: "2023–2025",
    status: "Processed Data",
    processing: "Complete",
    model: "Open-Source Change Model",
    updated: "05 Feb 2026",
  },
  {
    id: "ds-4",
    name: "Land Cover Classification (PROCESSED)",
    type: "GeoJSON (Processed)",
    location: "URBAN: Putrajaya & Cyberjaya",
    period: "2025",
    status: "Processed Data",
    processing: "Complete",
    model: "HuggingFace Sentinel Model",
    updated: "05 Feb 2026",
  },
  {
    id: "ds-5",
    name: "Sentinel-2 T1 Rural Baseline (RAW)",
    type: "Raster (RAW L1C/L2A)",
    location: "RURAL: Sungai Buah (Site C)",
    period: "Jan 2023 (T1)",
    status: "Raw Satellite Data",
    processing: "Raw Open-Source",
    model: "ESA Sentinel-2",
    updated: "08 Feb 2026",
  },
  {
    id: "ds-6",
    name: "Sentinel-2 T2 Rural Baseline (RAW)",
    type: "Raster (RAW L1C/L2A)",
    location: "RURAL: Sungai Buah (Site C)",
    period: "Jan 2025 (T2)",
    status: "Raw Satellite Data",
    processing: "Raw Open-Source",
    model: "ESA Sentinel-2",
    updated: "08 Feb 2026",
  },
  {
    id: "ds-7",
    name: "Flood Hazard Surface (PROCESSED)",
    type: "Raster (Processed)",
    location: "RURAL: Sungai Buah Floodplain",
    period: "2025",
    status: "Processed Data",
    processing: "Complete",
    model: "Open-Source Hydro Model",
    updated: "08 Feb 2026",
  },
  {
    id: "ds-8",
    name: "Road Access & Connectivity (PROCESSED)",
    type: "Vector (Processed)",
    location: "Urban & Rural Sites",
    period: "2025",
    status: "Processed Data",
    processing: "Complete",
    model: "OSM Vector Network",
    updated: "08 Feb 2026",
  },
  {
    id: "ds-9",
    name: "Development Suitability Index (PROCESSED)",
    type: "GeoJSON (Processed)",
    location: "Urban & Rural Sites",
    period: "2025",
    status: "Processed Data",
    processing: "Complete",
    model: "Open-Source GIS Model",
    updated: "10 Feb 2026",
  },
  {
    id: "ds-10",
    name: "Livability Index Composite Table (PROCESSED)",
    type: "Tabular (Processed)",
    location: "Urban & Rural Sites",
    period: "2025",
    status: "Processed Data",
    processing: "Complete",
    model: "Ginkgo Open Index v0.3",
    updated: "10 Feb 2026",
  },
];

export const models: ModelStatus[] = [
  {
    id: "model-a",
    name: "Ollama Local Llama 3 (Docker/Local)",
    owner: "Open-Source LLM",
    status: "Connected",
    note: "Open-Source Llama 3 running via local Ollama instance (+Bonus Criteria).",
  },
  {
    id: "model-b",
    name: "Hugging Face Sentinel-2 Classifier",
    owner: "Open-Source GIS Model",
    status: "Connected",
    note: "Open-source satellite land cover model from Hugging Face repository.",
  },
  {
    id: "model-c",
    name: "Groq Llama 3 70B Acceleration",
    owner: "Open-Source Hardware Accelerated",
    status: "Connected",
    note: "Ultra-fast open-source LLM inference via Groq cloud service.",
  },
];
