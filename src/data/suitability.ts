import type { PlanningRecommendation, SuitabilityResult } from "@/types";

const criteria = (a: number, f: number, e: number, l: number, i: number) => [
  { label: "Accessibility", weightPct: 25, score: a },
  { label: "Flood Resilience", weightPct: 25, score: f },
  { label: "Environmental Compatibility", weightPct: 20, score: e },
  { label: "Land Use Compatibility", weightPct: 15, score: l },
  { label: "Infrastructure Proximity", weightPct: 15, score: i },
];

export const suitability: Record<string, SuitabilityResult> = {
  "site-a": {
    siteId: "site-a",
    score: 82,
    classification: "Suitable",
    criteria: criteria(91, 68, 78, 88, 86),
  },
  "site-b": {
    siteId: "site-b",
    score: 88,
    classification: "Highly Suitable",
    criteria: criteria(95, 82, 71, 92, 94),
  },
  "site-c": {
    siteId: "site-c",
    score: 58,
    classification: "Conditional",
    criteria: criteria(58, 38, 74, 62, 55),
  },
  "site-d": {
    siteId: "site-d",
    score: 46,
    classification: "Low Suitability",
    criteria: criteria(44, 57, 62, 40, 34),
  },
};

export const recommendations: Record<string, PlanningRecommendation> = {
  "site-a": {
    siteId: "site-a",
    headline:
      "Site A is potentially suitable for affordable residential development, conditional on drainage and green-cover mitigation.",
    evidence: [
      "Road accessibility scores 91/100 with arterial access within 1.2 km",
      "Livability index of 84/100 (Good band)",
      "Facility catchment includes 3 schools and 1 clinic within 2 km",
      "Land use compatibility is high (existing residential context)",
    ],
    constraints: [
      "Moderate flood exposure across 4.42 km² of the study extent",
      "Vegetation loss of 12.3% between T1 and T2",
      "18% of the parcel sits below local mean elevation",
    ],
    actions: [
      "Commission a detailed drainage capacity study before layout approval",
      "Require on-site retention for any impervious surface above 45%",
      "Reserve a minimum 15% green buffer along the eastern edge",
      "Stage development away from the low-lying southern strip",
      "Re-run change detection after 12 months to verify vegetation retention",
    ],
  },
  "site-b": {
    siteId: "site-b",
    headline:
      "Site B is highly suitable for transit-oriented mixed-use intensification.",
    evidence: [
      "Accessibility score 95/100 with transit within 400 m",
      "Low flood exposure (1.18 km²)",
      "Strong existing infrastructure proximity",
    ],
    constraints: [
      "Green coverage is declining (−9.4% vegetation)",
      "High impervious surface already at 55%",
    ],
    actions: [
      "Apply a minimum green plot ratio to new parcels",
      "Prioritise infill over greenfield extension",
      "Introduce street-tree planting along the corridor",
    ],
  },
  "site-c": {
    siteId: "site-c",
    headline:
      "Site C is conditional — high flood exposure requires resilience works before any residential consideration.",
    evidence: ["Extensive undeveloped land", "Riparian vegetation largely retained"],
    constraints: [
      "High flood exposure across 9.87 km²",
      "64% of the area falls within mapped floodplain extent",
      "Single road access point",
    ],
    actions: [
      "Restrict to low-intensity or non-residential uses pending study",
      "Undertake hydrological modelling with the drainage authority",
      "Protect riparian buffer as permanent green infrastructure",
    ],
  },
  "site-d": {
    siteId: "site-d",
    headline:
      "Site D shows low suitability for new settlement; prioritise accessibility and services before growth.",
    evidence: ["High vegetation retention", "Low development pressure"],
    constraints: [
      "Accessibility score 44/100",
      "Nearest arterial road 9.4 km away",
      "Agricultural clearing of 15.9% vegetation",
    ],
    actions: [
      "Upgrade the primary village access route",
      "Assess rural clinic and school catchment gaps",
      "Discourage further agricultural clearing on slopes",
    ],
  },
};

export const suitabilityDisclaimer =
  "Suitability results are indicative decision-support outputs and require professional planning review. This is not statutory planning approval.";

export const globalDisclaimer =
  "Ginkgo is a decision-support prototype. AI-generated insights and spatial suitability results should be reviewed by qualified planning professionals and should not be interpreted as statutory planning approval.";
