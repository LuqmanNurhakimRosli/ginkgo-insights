// Core domain types for Ginkgo spatial intelligence.

export type RiskLevel = "Low" | "Moderate" | "High";
export type SuitabilityClass =
  | "Highly Suitable"
  | "Suitable"
  | "Conditional"
  | "Low Suitability";

export interface Site {
  id: string;
  name: string;
  locality: string;
  areaHa: number;
  dominantLandUse: string;
  center: [number, number];
  /** Normalised polygon (0-100 space) used by the map canvas. */
  polygon: Array<[number, number]>;
  suitabilityClass: SuitabilityClass;
  livability: number;
  suitability: number;
  floodRisk: RiskLevel;
  roadAccess: string;
  tags: string[];
}

export interface SpatialMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  direction?: "up" | "down" | "flat";
  tone?: "positive" | "negative" | "neutral" | "warning";
  sub?: string;
}

export interface ChangeDetectionResult {
  siteId: string;
  t1: string;
  t2: string;
  builtUpPct: number;
  vegetationPct: number;
  waterPct: number;
  changedAreaHa: number;
  confidence: number;
  narrative: string;
  classes: Array<{ id: string; label: string; color: string; areaHa: number }>;
}

export interface LandCoverResult {
  siteId: string;
  period: string;
  categories: Array<{ id: string; label: string; pct: number; color: string }>;
}

export interface LivabilityDimension {
  id: string;
  label: string;
  weight: number;
  score: number;
  note: string;
}

export interface LivabilityResult {
  siteId: string;
  score: number;
  band: string;
  dimensions: LivabilityDimension[];
  positives: string[];
  negatives: string[];
}

export interface AccessibilityResult {
  siteId: string;
  score: number;
  roadAccess: string;
  facilityAccess: string;
  connectivity: string;
  indicators: Array<{ label: string; value: number; note: string }>;
}

export interface FloodRiskResult {
  siteId: string;
  exposure: RiskLevel;
  exposedAreaKm2: number;
  resilienceIndicator: number;
  factors: Array<{ label: string; level: RiskLevel; note: string }>;
}

export interface SuitabilityResult {
  siteId: string;
  score: number;
  classification: SuitabilityClass;
  criteria: Array<{ label: string; weightPct: number; score: number }>;
}

export interface PlanningRecommendation {
  siteId: string;
  headline: string;
  evidence: string[];
  constraints: string[];
  actions: string[];
}

export interface MapFeature {
  id: string;
  siteId?: string;
  label: string;
  kind: "site" | "candidate" | "risk" | "growth";
  polygon: Array<[number, number]>;
  value?: string;
}

export interface MapAction {
  id: string;
  label: string;
  kind: "highlight" | "zoom" | "layer" | "compare" | "report" | "navigate";
  payload?: Record<string, unknown>;
}

export interface AIToolCall {
  name: string;
  args?: Record<string, unknown>;
  status: "done" | "running";
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  evidence?: string[] | undefined;
  constraints?: string[] | undefined;
  recommendation?: { title: string; actions: string[] } | undefined;
  toolCalls?: AIToolCall[] | undefined;
  actions?: MapAction[] | undefined;
  features?: MapFeature[] | undefined;
  createdAt: number;
}

export interface LayerDef {
  id: string;
  label: string;
  group: string;
  defaultOn: boolean;
  color: string;
}

export interface ReportSection {
  title: string;
  body: string;
}

export interface Report {
  id: string;
  siteId: string;
  title: string;
  status: "Ready" | "Draft" | "Generating";
  generatedAt: string;
  summary: string;
  sections: ReportSection[];
}

export interface Dataset {
  id: string;
  name: string;
  type: string;
  location: string;
  period: string;
  status: string;
  processing: string;
  model: string;
  updated: string;
}

export interface ModelStatus {
  id: string;
  name: string;
  owner: string;
  status: "Connected" | "Not Connected" | "Mock";
  note: string;
}
