import { recommendations } from "@/lib/geo/recommend";
import { bboxCenter, round } from "@/lib/geo/math";
import { osmHost } from "@/lib/geo/osm";
import type { AreaAnalysis } from "@/types/geo";
import type { AnalysisContext } from "./types";

const r1 = (v: number) => round(v, 1);

export function buildContext(a: AreaAnalysis): AnalysisContext {
  const f = a.flood;
  const p = f.peak;
  return {
    area: {
      name: a.aoi.name,
      locality: a.aoi.locality,
      areaKm2: round(a.areaKm2, 2),
      center: bboxCenter(a.aoi.bbox).map((v) => round(v, 5)) as [number, number],
    },
    flood: {
      areaClass: f.areaClass,
      highPct: r1(f.shares.High * 100),
      moderatePct: r1(f.shares.Moderate * 100),
      lowPct: r1(f.shares.Low * 100),
      meanIndex: round(f.meanIndex, 2),
      riverReservePct: r1(f.riverReserveSharePct),
      channels: f.channelNames,
      peak: p
        ? {
            index: round(p.index, 2),
            cls: p.cls,
            lat: round(p.lat, 5),
            lng: round(p.lng, 5),
            distanceM: Math.round(p.distanceM),
            handM: r1(p.handM),
            slopeDeg: r1(p.slopeDeg),
            elevationM: r1(p.elevationM),
            channel: p.channelName,
          }
        : undefined,
      weights: {
        distance: f.weightsUsed.distance,
        hand: f.weightsUsed.hand,
        slope: f.weightsUsed.slope,
      },
      missingTerms: f.termsMissing.map((t) => `${t.term}: ${t.reason}`),
    },
    landCover: {
      builtUpPct: r1(a.landCover.builtUpPct),
      greenPct: r1(a.landCover.greenPct),
      waterPct: r1(a.landCover.waterPct),
      agriculturePct: r1(a.landCover.agriculturePct),
      barePct: r1(a.landCover.barePct),
      unmappedPct: r1(a.landCover.unmappedPct),
      buildings: a.landCover.buildingCount,
      footprintPct: r1(a.landCover.footprintCoveragePct),
    },
    access: {
      score: a.access.score,
      roadKm: r1(a.access.roadKm),
      roadDensity: r1(a.access.roadDensity),
      arterialM:
        a.access.majorRoadDistanceM == null ? null : Math.round(a.access.majorRoadDistanceM),
      arterialName: a.access.majorRoadName,
      transitStops: a.access.transitStops,
      railStations: a.access.railStations,
      education: a.access.education,
      health: a.access.health,
    },
    terrain: {
      minM: r1(a.terrain.minM),
      maxM: r1(a.terrain.maxM),
      meanSlopeDeg: r1(a.terrain.meanSlopeDeg),
      steepPct: r1(a.terrain.slopeClassPct.III + a.terrain.slopeClassPct.IV),
    },
    scores: {
      livability: a.scores.livability.score,
      livabilityBand: a.scores.livability.band,
      livabilityDims: a.scores.livability.dims.map((d) => ({
        label: d.label,
        score: d.score,
        weight: d.weight,
        formula: d.formula,
        inputs: d.inputs,
      })),
      suitability: a.scores.suitability.score,
      suitabilityClass: a.scores.suitability.cls,
      flags: a.scores.suitability.flags.map((x) => ({
        label: x.label,
        value: x.value,
        status: x.status,
      })),
    },
    recommendations: recommendations(a).map((r) => ({
      title: r.title,
      basis: r.basis,
      priority: r.priority,
    })),
    warnings: a.warnings,
    sources: [a.terrain.demSource, `OpenStreetMap via ${osmHost(a.osm.endpoint)}`],
  };
}

export const SYSTEM_PROMPT = `You are Ginkgo Copilot, a spatial planning assistant for Malaysian local planning authorities (PBT).
You explain results produced by Ginkgo's deterministic GIS engine. Rules:
- Use ONLY numbers present in the CONTEXT JSON. Never invent, estimate or recompute scores, distances or percentages.
- If the CONTEXT does not contain what is asked, say so and suggest which Ginkgo view or data would answer it.
- Flood results are RIVERINE (fluvial) susceptibility from distance to river, height above nearest drainage (HAND) and slope. Do not describe pluvial/flash flooding as modelled.
- Results are screening-level decision support, not statutory approval. Mention verification with JPS / PLANMalaysia data when advising on approvals.
- Be concise: 2–5 short paragraphs or a short list. Plain English; Bahasa Malaysia terms are fine where standard (e.g. rizab sungai).`;
