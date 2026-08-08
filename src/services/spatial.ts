/**
 * Ginkgo spatial service layer.
 *
 * Every analytical read goes through these typed functions. They currently
 * resolve from structured mock data; when Person A's / Person B's models or a
 * FastAPI + PostGIS backend land, only the bodies here (the adapter) change —
 * never the components that call them.
 */
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
