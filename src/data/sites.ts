import type { Site } from "@/types";

/** Deterministic prototype study sites (Putrajaya urban + Kampung rural). */
export const sites: Site[] = [
  {
    id: "site-a",
    name: "Site A",
    locality: "Presint 11 Corridor, Putrajaya",
    areaHa: 24.6,
    dominantLandUse: "Residential",
    center: [42, 44],
    polygon: [
      [33, 32],
      [50, 28],
      [56, 40],
      [50, 55],
      [36, 55],
      [29, 44],
    ],
    suitabilityClass: "Suitable",
    livability: 84,
    suitability: 82,
    floodRisk: "Moderate",
    roadAccess: "Very Good",
    tags: ["Urban", "Housing candidate"],
  },
  {
    id: "site-b",
    name: "Site B",
    locality: "Presint 14 East Corridor, Putrajaya",
    areaHa: 31.2,
    dominantLandUse: "Mixed Use",
    center: [70, 36],
    polygon: [
      [60, 24],
      [80, 22],
      [85, 36],
      [77, 48],
      [62, 44],
    ],
    suitabilityClass: "Highly Suitable",
    livability: 79,
    suitability: 88,
    floodRisk: "Low",
    roadAccess: "Excellent",
    tags: ["Urban", "Transit adjacent"],
  },
  {
    id: "site-c",
    name: "Site C",
    locality: "Sungai Buah Floodplain",
    areaHa: 18.9,
    dominantLandUse: "Vacant / Bare Land",
    center: [38, 74],
    polygon: [
      [28, 64],
      [46, 62],
      [52, 74],
      [44, 86],
      [28, 82],
    ],
    suitabilityClass: "Conditional",
    livability: 61,
    suitability: 58,
    floodRisk: "High",
    roadAccess: "Moderate",
    tags: ["Floodplain", "Review required"],
  },
  {
    id: "site-d",
    name: "Site D",
    locality: "Kampung Sri Damai (Rural)",
    areaHa: 42.4,
    dominantLandUse: "Agriculture",
    center: [76, 72],
    polygon: [
      [64, 62],
      [86, 60],
      [90, 76],
      [80, 88],
      [66, 82],
    ],
    suitabilityClass: "Low Suitability",
    livability: 54,
    suitability: 46,
    floodRisk: "Moderate",
    roadAccess: "Limited",
    tags: ["Rural", "Low accessibility"],
  },
];

export const defaultSiteId = "site-a";

export function getSite(id: string): Site | undefined {
  return sites.find((s) => s.id === id);
}

export const locations = [
  "Putrajaya, Malaysia",
  "Kampung Sri Damai, Selangor",
];

export const timePeriods = [
  "Jan 2021",
  "Jan 2023",
  "Jun 2024",
  "Jan 2025",
];
