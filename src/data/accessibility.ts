import type { AccessibilityResult } from "@/types";

export const accessibility: Record<string, AccessibilityResult> = {
  "site-a": {
    siteId: "site-a",
    score: 91,
    roadAccess: "Very Good",
    facilityAccess: "Good",
    connectivity: "Excellent",
    indicators: [
      { label: "Road proximity", value: 94, note: "Median 180 m to nearest paved road" },
      { label: "Road connectivity", value: 92, note: "Dense local street grid" },
      { label: "Major road access", value: 88, note: "1.2 km to arterial interchange" },
      { label: "Facility proximity", value: 84, note: "3 schools, 1 clinic within 2 km" },
      { label: "Public transport", value: 76, note: "Bus corridor within 900 m" },
    ],
  },
  "site-b": {
    siteId: "site-b",
    score: 95,
    roadAccess: "Excellent",
    facilityAccess: "Very Good",
    connectivity: "Excellent",
    indicators: [
      { label: "Road proximity", value: 97, note: "Median 110 m to nearest paved road" },
      { label: "Road connectivity", value: 95, note: "Highly connected corridor" },
      { label: "Major road access", value: 94, note: "0.6 km to expressway ramp" },
      { label: "Facility proximity", value: 90, note: "5 schools, 2 clinics within 2 km" },
      { label: "Public transport", value: 88, note: "Transit stop within 400 m" },
    ],
  },
  "site-c": {
    siteId: "site-c",
    score: 58,
    roadAccess: "Moderate",
    facilityAccess: "Limited",
    connectivity: "Fair",
    indicators: [
      { label: "Road proximity", value: 62, note: "Median 740 m to nearest paved road" },
      { label: "Road connectivity", value: 55, note: "Single access route" },
      { label: "Major road access", value: 58, note: "4.8 km to arterial" },
      { label: "Facility proximity", value: 52, note: "1 school within 3 km" },
      { label: "Public transport", value: 40, note: "No scheduled service detected" },
    ],
  },
  "site-d": {
    siteId: "site-d",
    score: 44,
    roadAccess: "Limited",
    facilityAccess: "Limited",
    connectivity: "Weak",
    indicators: [
      { label: "Road proximity", value: 48, note: "Median 1.3 km to paved road" },
      { label: "Road connectivity", value: 42, note: "Fragmented rural track network" },
      { label: "Major road access", value: 38, note: "9.4 km to arterial" },
      { label: "Facility proximity", value: 46, note: "1 clinic within 6 km" },
      { label: "Public transport", value: 30, note: "No scheduled service detected" },
    ],
  },
};
