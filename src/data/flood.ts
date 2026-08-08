import type { FloodRiskResult } from "@/types";

export const flood: Record<string, FloodRiskResult> = {
  "site-a": {
    siteId: "site-a",
    exposure: "Moderate",
    exposedAreaKm2: 4.42,
    resilienceIndicator: 68,
    factors: [
      { label: "Water proximity", level: "Moderate", note: "620 m to main drainage channel" },
      { label: "Low-lying area", level: "High", note: "18% of parcel below local mean elevation" },
      { label: "Impervious surface", level: "Moderate", note: "42% built-up coverage at T2" },
      { label: "Drainage proximity", level: "Moderate", note: "Secondary drain along eastern edge" },
    ],
  },
  "site-b": {
    siteId: "site-b",
    exposure: "Low",
    exposedAreaKm2: 1.18,
    resilienceIndicator: 82,
    factors: [
      { label: "Water proximity", level: "Low", note: "1.9 km to main channel" },
      { label: "Low-lying area", level: "Low", note: "Elevated plateau" },
      { label: "Impervious surface", level: "High", note: "55% built-up coverage at T2" },
      { label: "Drainage proximity", level: "Low", note: "Engineered drainage present" },
    ],
  },
  "site-c": {
    siteId: "site-c",
    exposure: "High",
    exposedAreaKm2: 9.87,
    resilienceIndicator: 38,
    factors: [
      { label: "Water proximity", level: "High", note: "Directly adjacent to river bend" },
      { label: "Low-lying area", level: "High", note: "64% within floodplain extent" },
      { label: "Impervious surface", level: "Low", note: "18% built-up coverage at T2" },
      { label: "Drainage proximity", level: "High", note: "No engineered drainage detected" },
    ],
  },
  "site-d": {
    siteId: "site-d",
    exposure: "Moderate",
    exposedAreaKm2: 5.63,
    resilienceIndicator: 57,
    factors: [
      { label: "Water proximity", level: "Moderate", note: "880 m to irrigation channel" },
      { label: "Low-lying area", level: "Moderate", note: "27% low-lying agricultural land" },
      { label: "Impervious surface", level: "Low", note: "14% built-up coverage at T2" },
      { label: "Drainage proximity", level: "Moderate", note: "Agricultural drains only" },
    ],
  },
};
