/**
 * Ginkgo spatial service layer.
 *
 * Every analytical read goes through these typed functions. They currently
 * resolve from structured mock data; when Person A's / Person B's models or a
 * FastAPI + PostGIS backend land, only the bodies here (the adapter) change —
 * never the components that call them.
 */

const BACKEND_URL = "http://localhost:8000";

export interface TemporalModelOutput {
  scenario: string;
  images: {
    t1_rgb: string;
    t2_rgb: string;
    t1_landcover: string;
    t2_landcover: string;
    change_heatmap: string;
    t1_ndvi: string;
    t2_ndvi: string;
    t1_ndwi: string;
    t2_ndwi: string;
  };
  stats: {
    mean_change_intensity: number;
    max_change_intensity: number;
    severity_breakdown: Record<string, number>;
    transition_matrix: Record<string, Record<string, number>>;
    top_transitions: Array<{ from: string; to: string; pixels: number; percentage: number }>;
    net_change_percentage: number;
  };
  classes: Record<number, { name: string; code: string; color: number[] }>;
}

export interface FloodModelOutput {
  original_b64: string;
  flood_b64: string;
  depth_b64: string;
  elevation_b64: string;
  stats: {
    inundated_area_px: number;
    inundated_area_percent: number;
    mean_flood_depth_m: number;
    hazard_level: string;
  };
}

/** Calls the Unified FastAPI Backend for Temporal & 5-Class Land Cover Prediction */
export async function runTemporalInference(scenario = "urban_sprawl", t1_b64?: string, t2_b64?: string): Promise<TemporalModelOutput | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/predict/temporal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, t1_b64, t2_b64 }),
    });
    if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend inference unreachable, using on-device spatial pipeline:", err);
    return null;
  }
}

/** Calls the Unified FastAPI Backend for Nadi's Flood Prediction Engine */
export async function runFloodInference(params: {
  sample_key?: string;
  rainfall?: number;
  soil_type?: string;
  elevation_offset?: number;
  model_type?: string;
}): Promise<FloodModelOutput | null> {
  try {
    const formData = new FormData();
    if (params.sample_key) formData.append("sample_key", params.sample_key);
    if (params.rainfall) formData.append("rainfall", String(params.rainfall));
    if (params.soil_type) formData.append("soil_type", params.soil_type);
    if (params.elevation_offset) formData.append("elevation_offset", String(params.elevation_offset));
    if (params.model_type) formData.append("model_type", params.model_type);

    const res = await fetch(`${BACKEND_URL}/api/predict/flood`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`Flood model error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn("Flood model unreachable, using on-device pipeline:", err);
    return null;
  }
}

import { accessibility } from "@/data/accessibility";
import { getKpiStrip, indicatorDefinitions } from "@/data/analysis";
import { changeDetection, landCover, landCoverT1 } from "@/data/changeDetection";
import { flood } from "@/data/flood";
import { livability } from "@/data/livability";
import { buildReport } from "@/data/reports";
import { getSite, sites } from "@/data/sites";
import { recommendations, suitability } from "@/data/suitability";
import type { MapFeature } from "@/types";

const LATENCY = 260;

function resolve<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

export const spatialService = {
  listSites: () => resolve(sites, 80),
  getSiteSummary: (siteId: string) => resolve(getSite(siteId)),
  getKpis: (siteId: string) => resolve(getKpiStrip(siteId)),
  getChangeDetection: (siteId: string) => resolve(changeDetection[siteId]),
  getLandCover: (siteId: string) => resolve(landCover[siteId]),
  getLandCoverT1: (siteId: string) => resolve(landCoverT1[siteId]),
  getLivabilityScore: (siteId: string) => resolve(livability[siteId]),
  getSuitabilityScore: (siteId: string) => resolve(suitability[siteId]),
  getFloodRisk: (siteId: string) => resolve(flood[siteId]),
  getAccessibility: (siteId: string) => resolve(accessibility[siteId]),
  getRecommendation: (siteId: string) => resolve(recommendations[siteId]),
  generateReport: (siteId: string) => resolve(buildReport(siteId), 700),
  getIndicatorDefinition: (indicatorId: string) =>
    resolve(indicatorDefinitions[indicatorId] ?? "Definition not available."),

  findHighRiskAreas: () =>
    resolve(
      sites
        .filter((s) => flood[s.id]!.exposure !== "Low")
        .map<MapFeature>((s) => ({
          id: `risk-${s.id}`,
          siteId: s.id,
          label: s.name,
          kind: "risk",
          polygon: s.polygon,
          value: `${flood[s.id]!.exposure} exposure · ${flood[s.id]!.exposedAreaKm2} km²`,
        })),
    ),

  findHighGrowthAreas: () =>
    resolve(
      sites
        .filter((s) => changeDetection[s.id]!.builtUpPct >= 15)
        .map<MapFeature>((s) => ({
          id: `growth-${s.id}`,
          siteId: s.id,
          label: s.name,
          kind: "growth",
          polygon: s.polygon,
          value: `Built-up +${changeDetection[s.id]!.builtUpPct}%`,
        })),
    ),

  findLowAccessibilityAreas: () =>
    resolve(
      sites
        .filter((s) => accessibility[s.id]!.score < 70)
        .map<MapFeature>((s) => ({
          id: `access-${s.id}`,
          siteId: s.id,
          label: s.name,
          kind: "risk",
          polygon: s.polygon,
          value: `Accessibility ${accessibility[s.id]!.score}/100`,
        })),
    ),

  findCandidateAreas: () =>
    resolve(
      sites
        .filter((s) => suitability[s.id]!.score >= 58)
        .map<MapFeature>((s) => ({
          id: `candidate-${s.id}`,
          siteId: s.id,
          label: s.name,
          kind: "candidate",
          polygon: s.polygon,
          value: `Suitability ${suitability[s.id]!.score}/100`,
        })),
    ),

  compareSites: (a: string, b: string) =>
    resolve({
      a: getSite(a)!,
      b: getSite(b)!,
      rows: [
        {
          label: "Livability",
          a: `${livability[a]!.score}/100`,
          b: `${livability[b]!.score}/100`,
        },
        {
          label: "Suitability",
          a: `${suitability[a]!.score}/100`,
          b: `${suitability[b]!.score}/100`,
        },
        {
          label: "Accessibility",
          a: `${accessibility[a]!.score}/100`,
          b: `${accessibility[b]!.score}/100`,
        },
        { label: "Flood exposure", a: flood[a]!.exposure, b: flood[b]!.exposure },
        {
          label: "Built-up change",
          a: `${changeDetection[a]!.builtUpPct}%`,
          b: `${changeDetection[b]!.builtUpPct}%`,
        },
      ],
    }),
};

export type SpatialService = typeof spatialService;
