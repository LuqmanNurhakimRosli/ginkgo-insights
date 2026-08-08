import type { LivabilityResult } from "@/types";

const dims = (e: number, m: number, s: number, c: number, su: number) => [
  {
    id: "environment",
    label: "Environmental Quality",
    weight: 25,
    score: e,
    note: "Green coverage, vegetation change, surface heat proxy",
  },
  {
    id: "mobility",
    label: "Mobility & Accessibility",
    weight: 25,
    score: m,
    note: "Road proximity, connectivity, major road access",
  },
  {
    id: "safety",
    label: "Safety & Resilience",
    weight: 20,
    score: s,
    note: "Flood exposure, drainage proximity, low-lying terrain",
  },
  {
    id: "community",
    label: "Community & Facilities",
    weight: 15,
    score: c,
    note: "Schools, clinics, community amenities within catchment",
  },
  {
    id: "sustainability",
    label: "Sustainability",
    weight: 15,
    score: su,
    note: "Land use efficiency, vegetation retention, growth pattern",
  },
];

export const livability: Record<string, LivabilityResult> = {
  "site-a": {
    siteId: "site-a",
    score: 84,
    band: "Good",
    dimensions: dims(21, 23, 18, 13, 11),
    positives: [
      "Strong road accessibility",
      "Moderate facility proximity",
      "Good green coverage",
    ],
    negatives: ["Moderate flood exposure", "Recent vegetation loss"],
  },
  "site-b": {
    siteId: "site-b",
    score: 79,
    band: "Good",
    dimensions: dims(17, 24, 17, 12, 9),
    positives: ["Excellent connectivity", "High facility density"],
    negatives: ["Low green coverage", "Rapid built-up densification"],
  },
  "site-c": {
    siteId: "site-c",
    score: 61,
    band: "Moderate",
    dimensions: dims(16, 15, 10, 10, 10),
    positives: ["Extensive open land", "Retained riparian vegetation"],
    negatives: ["High flood exposure", "Weak road connectivity"],
  },
  "site-d": {
    siteId: "site-d",
    score: 54,
    band: "Moderate",
    dimensions: dims(20, 9, 13, 6, 6),
    positives: ["High vegetation retention", "Low built-up pressure"],
    negatives: [
      "Limited road access",
      "Few community facilities",
      "Significant agricultural clearing",
    ],
  },
};
