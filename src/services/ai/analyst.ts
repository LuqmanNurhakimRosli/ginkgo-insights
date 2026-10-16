import { formatDistance } from "@/lib/geo/math";
import type { AIProvider, AIRequest, AIResponse, AnalysisContext, CopilotAction } from "./types";

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

export type Intent =
  | "flood"
  | "livability"
  | "suitability"
  | "landcover"
  | "access"
  | "terrain"
  | "compare"
  | "report"
  | "method"
  | "validation"
  | "overview";

export function detectIntent(prompt: string): Intent {
  const q = prompt.toLowerCase();
  if (has(q, "masjid jamek", "validation", "validate", "gate test", "bukit nanas"))
    return "validation";
  if (
    has(
      q,
      "how does",
      "how do you",
      "method",
      "formula",
      "black box",
      "where is ai",
      "how is ai",
      "how ai",
    )
  )
    return "method";
  if (has(q, "compare", " vs ", "versus")) return "compare";
  if (has(q, "report", "export", "pdf")) return "report";
  if (has(q, "flood", "banjir", "river", "sungai", "inundat", "hand", "riverine")) return "flood";
  if (has(q, "livab", "why", "explain", "score")) return "livability";
  if (has(q, "suitab", "develop", "housing", "build", "rezon", "approve", "zoning"))
    return "suitability";
  if (
    has(
      q,
      "land use",
      "land cover",
      "landcover",
      "green",
      "vegetation",
      "built",
      "building",
      "forest",
      "park",
    )
  )
    return "landcover";
  if (has(q, "access", "road", "transit", "bus", "rail", "school", "hospital", "clinic"))
    return "access";
  if (has(q, "slope", "terrain", "elevation", "hill", "height")) return "terrain";
  return "overview";
}

const act = (
  id: string,
  label: string,
  kind: CopilotAction["kind"],
  payload?: Record<string, string>,
): CopilotAction => ({
  id,
  label,
  kind,
  payload,
});

/** Deterministic answer for an intent, grounded only in the analysis context. */
export function answer(
  intent: Intent,
  c: AnalysisContext,
  req: AIRequest,
): Omit<AIResponse, "engine"> {
  const f = c.flood;
  const name = c.area.name;
  switch (intent) {
    case "flood": {
      const p = f.peak;
      return {
        text:
          `${name} is rated **${f.areaClass}** for riverine flood susceptibility: ${f.highPct}% of land cells are High, ${f.moderatePct}% Moderate and ${f.lowPct}% Low.` +
          (p
            ? ` The most susceptible cell sits ${formatDistance(p.distanceM)} from ${p.channel ?? "the nearest mapped channel"}, ${p.handM} m above it, on a ${p.slopeDeg}° slope (RFSI ${p.index}).`
            : "") +
          (f.channels.length
            ? ` Channels considered: ${f.channels.join(", ")}.`
            : " No named river was found nearby."),
        evidence: [
          `Weights: distance ${f.weights["distance"]}, height-above-river ${f.weights["hand"]}, flatness ${f.weights["slope"]}`,
          `${f.riverReservePct}% of the area lies within 50 m of a river or canal`,
          ...f.missingTerms,
        ],
        constraints: c.warnings,
        toolCalls: [
          { name: "loadDem", status: "done" },
          { name: "fetchOsmChannels", status: "done" },
          { name: "riverineIndex", status: "done" },
        ],
        actions: [
          act("flood-layer", "Show flood layer", "layer", { layer: "flood" }),
          ...(p ? [act("peak", "Inspect peak cell", "focus-peak")] : []),
        ],
      };
    }
    case "livability":
      return {
        text: `${name} scores **${c.scores.livability}/100 (${c.scores.livabilityBand})** on the livability index. It is a weighted mean of five dimensions, each computed from DEM and OpenStreetMap inputs:`,
        evidence: c.scores.livabilityDims.map(
          (d) => `${d.label} ${d.score}/100 × ${d.weight}% — ${d.formula}. Inputs: ${d.inputs}`,
        ),
        toolCalls: [{ name: "computeScores", status: "done" }],
        actions: [act("open-liv", "Open livability breakdown", "navigate", { to: "/livability" })],
      };
    case "suitability": {
      const fails = c.scores.flags.filter((x) => x.status !== "pass");
      return {
        text: `Development suitability for ${name} is **${c.scores.suitability}/100 — ${c.scores.suitabilityClass}**.${
          fails.length
            ? ` ${fails.length} screening flag(s) need attention.`
            : " No screening flag was triggered."
        }`,
        evidence: c.scores.flags.map((x) => `${x.status.toUpperCase()} · ${x.label}: ${x.value}`),
        recommendation: c.recommendations.length
          ? {
              title: "Rule-based planning conditions",
              actions: c.recommendations.map((r) => `${r.title} — ${r.basis}`),
            }
          : undefined,
        toolCalls: [
          { name: "screeningFlags", status: "done" },
          { name: "planningRules", status: "done" },
        ],
        actions: [act("open-plan", "Open suitability screening", "navigate", { to: "/planning" })],
      };
    }
    case "landcover": {
      const l = c.landCover;
      return {
        text: `OpenStreetMap land use for ${name}: built-up ${l.builtUpPct}%, green ${l.greenPct}%, water ${l.waterPct}%, agriculture ${l.agriculturePct}%, bare/open ${l.barePct}%. ${l.buildings.toLocaleString()} building footprints cover ${l.footprintPct}% of the ground.`,
        evidence: [
          `Unmapped (no OSM tag): ${l.unmappedPct}%`,
          "Classes follow the shared 5-class legend (Urban, Vegetation, Water, Agriculture, Bare).",
        ],
        toolCalls: [{ name: "rasterizeLandCover", status: "done" }],
        actions: [act("lc-layer", "Show land cover layer", "layer", { layer: "landcover" })],
      };
    }
    case "access": {
      const a = c.access;
      return {
        text: `Accessibility is **${a.score}/100**. There are ${a.roadKm} km of roads (${a.roadDensity} km/km²); the nearest arterial is ${
          a.arterialM == null
            ? "outside the 1 km catchment"
            : `${formatDistance(a.arterialM)} away${a.arterialName ? ` (${a.arterialName})` : ""}`
        }. Within 1 km: ${a.transitStops} transit stops (${a.railStations} rail), ${a.education} education and ${a.health} health facilities.`,
        toolCalls: [{ name: "accessIndicators", status: "done" }],
        actions: [act("poi-layer", "Show facilities", "layer", { layer: "pois" })],
      };
    }
    case "terrain":
      return {
        text: `Ground elevation ranges ${c.terrain.minM}–${c.terrain.maxM} m with a mean slope of ${c.terrain.meanSlopeDeg}°. ${c.terrain.steepPct}% of the area is steeper than 25° (hill-site Class III–IV).`,
        evidence: [
          "Elevation: SRTM via AWS Terrain Tiles, 20th-percentile ground filter to suppress rooftops.",
        ],
        toolCalls: [{ name: "loadDem", status: "done" }],
        actions: [act("terrain-layer", "Show terrain layer", "layer", { layer: "terrain" })],
      };
    case "compare": {
      const others = req.saved.filter((s) => s.aoi.name !== name).slice(0, 4);
      if (!others.length)
        return {
          text: "Save at least one other area (Areas → Save) to compare. Comparisons use the stored computed summaries.",
          toolCalls: [],
          actions: [act("areas", "Open Areas", "navigate", { to: "/analysis" })],
        };
      return {
        text: `Comparison of ${name} with saved areas:`,
        evidence: [
          `${name}: livability ${c.scores.livability}, suitability ${c.scores.suitability}, flood ${c.flood.areaClass} (${c.flood.highPct}% High)`,
          ...others.map(
            (s) =>
              `${s.aoi.name}: livability ${s.summary.livability}, suitability ${s.summary.suitability}, flood ${s.summary.floodClass} (${s.summary.floodHighPct}% High)`,
          ),
        ],
        toolCalls: [{ name: "compareSavedAreas", status: "done" }],
        actions: [act("areas", "Open Areas", "navigate", { to: "/analysis" })],
      };
    }
    case "report":
      return {
        text: `The planning report for ${name} is compiled from the same computed values shown on screen. You can print it to PDF or export JSON / GeoJSON.`,
        toolCalls: [{ name: "buildReport", status: "done" }],
        actions: [act("report", "Open report", "navigate", { to: "/reports" })],
      };
    case "method":
      return methodAnswer();
    case "validation":
      return validationAnswer();
    default:
      return {
        text: `${name} (${c.area.areaKm2} km²): livability ${c.scores.livability}/100, suitability ${c.scores.suitability}/100 (${c.scores.suitabilityClass}), riverine flood class ${c.flood.areaClass}, accessibility ${c.access.score}/100. Ask about flood, land use, access, terrain or suitability.`,
        evidence: c.recommendations.slice(0, 3).map((r) => `${r.title} — ${r.basis}`),
        constraints: c.warnings,
        toolCalls: [{ name: "summarize", status: "done" }],
        actions: [act("fit", "Zoom to area", "fit-area")],
      };
  }
}

function methodAnswer(): Omit<AIResponse, "engine"> {
  return {
    text: "Ginkgo separates calculation from explanation. Scores are computed by deterministic GIS code in the browser; the language model (if enabled) only writes the explanation from those numbers.",
    evidence: [
      "1 · Elevation: SRTM tiles → 20th-percentile ground surface → slope and height above nearest drainage (HAND).",
      "2 · Rivers, land use, roads, facilities: OpenStreetMap (Overpass API).",
      "3 · Riverine index: weighted distance-to-river, HAND and flatness factors (see Methodology).",
      "4 · Livability & suitability: published weighted formulas over those inputs.",
      "5 · Copilot: reads a JSON snapshot of the numbers; it never generates scores.",
    ],
    toolCalls: [],
    actions: [act("method", "Open methodology", "navigate", { to: "/help" })],
  };
}

function validationAnswer(): Omit<AIResponse, "engine"> {
  return {
    text: "The riverine gate test analyses Masjid Jamek (Klang–Gombak confluence, expected High) and Bukit Nanas (forest hill, expected Low) with live DEM and OpenStreetMap data.",
    toolCalls: [],
    actions: [
      act("run-val", "Run validation area", "run-preset", { id: "kl-confluence" }),
      act("method", "Open validation panel", "navigate", { to: "/help" }),
    ],
  };
}

export const analystProvider: AIProvider = {
  id: "analyst",
  name: "Ginkgo Analyst",
  description: "On-device, deterministic. Answers only from computed results. No API key.",
  kind: "on-device",
  async send(req: AIRequest): Promise<AIResponse> {
    const intent = detectIntent(req.prompt);
    if (!req.context) {
      if (intent === "method") return { ...methodAnswer(), engine: "Ginkgo Analyst" };
      if (intent === "validation") return { ...validationAnswer(), engine: "Ginkgo Analyst" };
      return {
        text: "No area has been analysed yet. Draw an area on the map or start from a quick area, then ask again — every answer is grounded in the computed results.",
        toolCalls: [],
        actions: [
          act("map", "Open map", "navigate", { to: "/" }),
          act("run-val", "Analyse Masjid Jamek area", "run-preset", { id: "kl-confluence" }),
        ],
        engine: "Ginkgo Analyst",
      };
    }
    return { ...answer(intent, req.context, req), engine: "Ginkgo Analyst" };
  },
};
