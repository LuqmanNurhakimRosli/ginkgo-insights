import type { ChangeDetectionResult, LandCoverResult } from "@/types";

export const changeDetection: Record<string, ChangeDetectionResult> = {
  "site-a": {
    siteId: "site-a",
    t1: "Jan 2023",
    t2: "Jan 2025",
    builtUpPct: 18.6,
    vegetationPct: -12.3,
    waterPct: 3.4,
    changedAreaHa: 256.4,
    confidence: 87,
    narrative:
      "Built-up expansion is concentrated around the eastern corridor, replacing secondary vegetation adjacent to the arterial road.",
    classes: [
      { id: "builtup", label: "Built-up Increase", color: "#d1495b", areaHa: 256.4 },
      { id: "vegloss", label: "Vegetation Loss", color: "#e0a63c", areaHa: 168.7 },
      { id: "water", label: "New Water", color: "#2f6fb0", areaHa: 21.3 },
      { id: "nochange", label: "No Significant Change", color: "#9aa5b1", areaHa: 1420.9 },
    ],
  },
  "site-b": {
    siteId: "site-b",
    t1: "Jan 2023",
    t2: "Jan 2025",
    builtUpPct: 22.1,
    vegetationPct: -9.4,
    waterPct: 0.8,
    changedAreaHa: 302.8,
    confidence: 84,
    narrative:
      "Densification along the transit corridor accounts for most of the detected built-up gain.",
    classes: [
      { id: "builtup", label: "Built-up Increase", color: "#d1495b", areaHa: 302.8 },
      { id: "vegloss", label: "Vegetation Loss", color: "#e0a63c", areaHa: 121.2 },
      { id: "water", label: "New Water", color: "#2f6fb0", areaHa: 6.4 },
      { id: "nochange", label: "No Significant Change", color: "#9aa5b1", areaHa: 1610.2 },
    ],
  },
  "site-c": {
    siteId: "site-c",
    t1: "Jan 2023",
    t2: "Jan 2025",
    builtUpPct: 4.2,
    vegetationPct: -3.1,
    waterPct: 11.6,
    changedAreaHa: 96.5,
    confidence: 79,
    narrative:
      "Water extent increased along the floodplain margin, indicating seasonal inundation and possible drainage stress.",
    classes: [
      { id: "builtup", label: "Built-up Increase", color: "#d1495b", areaHa: 42.1 },
      { id: "vegloss", label: "Vegetation Loss", color: "#e0a63c", areaHa: 30.4 },
      { id: "water", label: "New Water", color: "#2f6fb0", areaHa: 96.5 },
      { id: "nochange", label: "No Significant Change", color: "#9aa5b1", areaHa: 980.3 },
    ],
  },
  "site-d": {
    siteId: "site-d",
    t1: "Jan 2023",
    t2: "Jan 2025",
    builtUpPct: 6.8,
    vegetationPct: -15.9,
    waterPct: 1.2,
    changedAreaHa: 188.2,
    confidence: 76,
    narrative:
      "Vegetation loss dominates, largely from agricultural clearing north of the village centre.",
    classes: [
      { id: "builtup", label: "Built-up Increase", color: "#d1495b", areaHa: 61.7 },
      { id: "vegloss", label: "Vegetation Loss", color: "#e0a63c", areaHa: 188.2 },
      { id: "water", label: "New Water", color: "#2f6fb0", areaHa: 9.9 },
      { id: "nochange", label: "No Significant Change", color: "#9aa5b1", areaHa: 1740.1 },
    ],
  },
};

export const landCover: Record<string, LandCoverResult> = {
  "site-a": {
    siteId: "site-a",
    period: "T2 – Jan 2025",
    categories: [
      { id: "builtup", label: "Built-up", pct: 42, color: "#d1495b" },
      { id: "vegetation", label: "Vegetation", pct: 38, color: "#3f8f6d" },
      { id: "water", label: "Water", pct: 11, color: "#2f6fb0" },
      { id: "bare", label: "Bare Land", pct: 9, color: "#c9a227" },
    ],
  },
  "site-b": {
    siteId: "site-b",
    period: "T2 – Jan 2025",
    categories: [
      { id: "builtup", label: "Built-up", pct: 55, color: "#d1495b" },
      { id: "vegetation", label: "Vegetation", pct: 29, color: "#3f8f6d" },
      { id: "water", label: "Water", pct: 8, color: "#2f6fb0" },
      { id: "bare", label: "Bare Land", pct: 8, color: "#c9a227" },
    ],
  },
  "site-c": {
    siteId: "site-c",
    period: "T2 – Jan 2025",
    categories: [
      { id: "builtup", label: "Built-up", pct: 18, color: "#d1495b" },
      { id: "vegetation", label: "Vegetation", pct: 34, color: "#3f8f6d" },
      { id: "water", label: "Water", pct: 27, color: "#2f6fb0" },
      { id: "bare", label: "Bare Land", pct: 21, color: "#c9a227" },
    ],
  },
  "site-d": {
    siteId: "site-d",
    period: "T2 – Jan 2025",
    categories: [
      { id: "builtup", label: "Built-up", pct: 14, color: "#d1495b" },
      { id: "vegetation", label: "Vegetation", pct: 61, color: "#3f8f6d" },
      { id: "water", label: "Water", pct: 7, color: "#2f6fb0" },
      { id: "bare", label: "Bare Land", pct: 18, color: "#c9a227" },
    ],
  },
};

/** Land cover at T1 for temporal comparison. */
export const landCoverT1: Record<string, LandCoverResult> = {
  "site-a": {
    siteId: "site-a",
    period: "T1 – Jan 2023",
    categories: [
      { id: "builtup", label: "Built-up", pct: 34, color: "#d1495b" },
      { id: "vegetation", label: "Vegetation", pct: 46, color: "#3f8f6d" },
      { id: "water", label: "Water", pct: 10, color: "#2f6fb0" },
      { id: "bare", label: "Bare Land", pct: 10, color: "#c9a227" },
    ],
  },
  "site-b": {
    siteId: "site-b",
    period: "T1 – Jan 2023",
    categories: [
      { id: "builtup", label: "Built-up", pct: 45, color: "#d1495b" },
      { id: "vegetation", label: "Vegetation", pct: 36, color: "#3f8f6d" },
      { id: "water", label: "Water", pct: 8, color: "#2f6fb0" },
      { id: "bare", label: "Bare Land", pct: 11, color: "#c9a227" },
    ],
  },
  "site-c": {
    siteId: "site-c",
    period: "T1 – Jan 2023",
    categories: [
      { id: "builtup", label: "Built-up", pct: 15, color: "#d1495b" },
      { id: "vegetation", label: "Vegetation", pct: 38, color: "#3f8f6d" },
      { id: "water", label: "Water", pct: 22, color: "#2f6fb0" },
      { id: "bare", label: "Bare Land", pct: 25, color: "#c9a227" },
    ],
  },
  "site-d": {
    siteId: "site-d",
    period: "T1 – Jan 2023",
    categories: [
      { id: "builtup", label: "Built-up", pct: 10, color: "#d1495b" },
      { id: "vegetation", label: "Vegetation", pct: 70, color: "#3f8f6d" },
      { id: "water", label: "Water", pct: 7, color: "#2f6fb0" },
      { id: "bare", label: "Bare Land", pct: 13, color: "#c9a227" },
    ],
  },
};
