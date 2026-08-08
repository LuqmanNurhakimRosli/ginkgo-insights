import type { LayerDef } from "@/types";

export const layers: LayerDef[] = [
  { id: "sat-t2", label: "Satellite (T2 – Current)", group: "Imagery", defaultOn: true, color: "#6b7a8f" },
  { id: "sat-t1", label: "Satellite (T1 – Previous)", group: "Imagery", defaultOn: true, color: "#8a97a8" },
  { id: "change", label: "Change Detection", group: "Analysis", defaultOn: true, color: "#d1495b" },
  { id: "landuse", label: "Land Use", group: "Analysis", defaultOn: true, color: "#3f8f6d" },
  { id: "flood", label: "Flood Risk", group: "Analysis", defaultOn: true, color: "#2f6fb0" },
  { id: "roads", label: "Road Network", group: "Base", defaultOn: true, color: "#4a5568" },
  { id: "boundary", label: "Administrative Boundary", group: "Base", defaultOn: true, color: "#94a3b8" },
  { id: "facilities", label: "Public Facilities", group: "Base", defaultOn: false, color: "#b06f2f" },
];

export const changeLegend = [
  { id: "builtup", label: "Built-up Increase", color: "#d1495b" },
  { id: "vegloss", label: "Vegetation Loss", color: "#e0a63c" },
  { id: "water", label: "New Water", color: "#2f6fb0" },
  { id: "nochange", label: "No Significant Change", color: "#9aa5b1" },
];
