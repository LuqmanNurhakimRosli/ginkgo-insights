import { bboxFromCenter } from "@/lib/geo/math";
import type { AreaOfInterest, LatLng } from "@/types/geo";

export interface PresetArea {
  id: string;
  name: string;
  locality: string;
  center: LatLng;
  widthM: number;
  heightM: number;
  purpose: string;
}

/**
 * Quick-start study areas. Each preset is only a bounding box: every metric is
 * computed live from DEM + OpenStreetMap when it is opened.
 */
export const PRESET_AREAS: PresetArea[] = [
  {
    id: "kl-confluence",
    name: "Masjid Jamek – Bukit Nanas",
    locality: "Kuala Lumpur city centre",
    center: [3.1505, 101.6995],
    widthM: 2400,
    heightM: 1600,
    purpose: "Validation pair: river confluence (expect High) vs forest hill (expect Low)",
  },
  {
    id: "putrajaya-p11",
    name: "Presint 11",
    locality: "Putrajaya",
    center: [2.9264, 101.6964],
    widthM: 1600,
    heightM: 1600,
    purpose: "Planned residential precinct beside Putrajaya Lake",
  },
  {
    id: "shah-alam-sri-muda",
    name: "Taman Sri Muda",
    locality: "Shah Alam, Selangor",
    center: [3.0186, 101.5338],
    widthM: 2200,
    heightM: 2000,
    purpose: "Low-lying housing on the Klang River floodplain",
  },
  {
    id: "kajang-langat",
    name: "Kajang town",
    locality: "Hulu Langat, Selangor",
    center: [2.9927, 101.7909],
    widthM: 2000,
    heightM: 2000,
    purpose: "Town centre on Sungai Langat",
  },
  {
    id: "kuantan-river",
    name: "Kuantan riverfront",
    locality: "Kuantan, Pahang",
    center: [3.8077, 103.326],
    widthM: 2500,
    heightM: 2000,
    purpose: "Coastal river town on the Kuantan River",
  },
  {
    id: "cyberjaya",
    name: "Cyberjaya core",
    locality: "Sepang, Selangor",
    center: [2.9213, 101.6559],
    widthM: 2000,
    heightM: 2000,
    purpose: "Planned smart-city precinct",
  },
];

export function presetToAoi(p: PresetArea): AreaOfInterest {
  return {
    id: `preset-${p.id}`,
    name: p.name,
    locality: p.locality,
    bbox: bboxFromCenter(p.center, p.widthM, p.heightM),
    source: "preset",
    createdAt: Date.now(),
  };
}

export const getPreset = (id: string) =>
  PRESET_AREAS.find((p) => p.id === id || `preset-${p.id}` === id);
