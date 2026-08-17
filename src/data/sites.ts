import { Site } from "@/types";

/** Production Administrative Sectors & Parcels */
export const sites: Site[] = [
  {
    id: "site-a",
    name: "Presint 11 Sector",
    locality: "Putrajaya Central District",
    areaHa: 24.6,
    dominantLandUse: "Residential / Mixed",
    center: [2.9264, 101.6964],
    polygon: [
      [2.9310, 101.6920],
      [2.9300, 101.6980],
      [2.9250, 101.7000],
      [2.9220, 101.6970],
      [2.9230, 101.6910],
      [2.9280, 101.6900],
    ],
    suitabilityClass: "Suitable",
    livability: 84,
    suitability: 82,
    floodRisk: "Moderate",
    roadAccess: "Very Good",
    tags: ["Urban Core", "Putrajaya", "Sentinel-2 T1/T2"],
  },
  {
    id: "site-b",
    name: "Presint 14 Transit Hub",
    locality: "Putrajaya East Corridor",
    areaHa: 31.2,
    dominantLandUse: "Commercial Transit",
    center: [2.9350, 101.7060],
    polygon: [
      [2.9390, 101.7020],
      [2.9380, 101.7090],
      [2.9340, 101.7110],
      [2.9310, 101.7080],
      [2.9320, 101.7010],
    ],
    suitabilityClass: "Highly Suitable",
    livability: 79,
    suitability: 88,
    floodRisk: "Low",
    roadAccess: "Excellent",
    tags: ["Transit Corridor", "Commercial"],
  },
  {
    id: "site-c",
    name: "Sungai Buah Basin",
    locality: "Hulu Langat Hydrological Sector",
    areaHa: 18.9,
    dominantLandUse: "Floodplain Buffer",
    center: [3.0180, 101.8640],
    polygon: [
      [3.0220, 101.8600],
      [3.0210, 101.8670],
      [3.0170, 101.8690],
      [3.0140, 101.8660],
      [3.0150, 101.8590],
    ],
    suitabilityClass: "Conditional",
    livability: 61,
    suitability: 58,
    floodRisk: "High",
    roadAccess: "Moderate",
    tags: ["Hydrological Risk", "Rural Buffer"],
  },
  {
    id: "site-d",
    name: "Sri Damai Ecological Reserve",
    locality: "Hulu Langat Forestry Zone",
    areaHa: 42.4,
    dominantLandUse: "Canopy Conservation",
    center: [3.0350, 101.8800],
    polygon: [
      [3.0400, 101.8750],
      [3.0390, 101.8850],
      [3.0340, 101.8870],
      [3.0300, 101.8830],
      [3.0310, 101.8740],
    ],
    suitabilityClass: "Low Suitability",
    livability: 54,
    suitability: 46,
    floodRisk: "Moderate",
    roadAccess: "Limited",
    tags: ["Ecological Zone", "Canopy Retention"],
  },
];

export const defaultSiteId = "site-a";

export function getSite(id: string): Site | undefined {
  return sites.find((s) => s.id === id);
}

export const locations = [
  "Putrajaya Central District",
  "Hulu Langat River Basin",
  "Cyberjaya Innovation Corridor",
];

export const timePeriods = [
  "Jan 2021 (Baseline)",
  "Jan 2023 (Sentinel-2 T1)",
  "Jun 2024 (Observation)",
  "Jan 2025 (Sentinel-2 T2)",
];
