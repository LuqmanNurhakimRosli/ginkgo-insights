import type { SavedArea } from "@/types/geo";

/** Compact, number-only snapshot of the current analysis handed to every provider. */
export interface AnalysisContext {
  area: { name: string; locality?: string | undefined; areaKm2: number; center: [number, number] };
  flood: {
    areaClass: string;
    highPct: number;
    moderatePct: number;
    lowPct: number;
    meanIndex: number;
    riverReservePct: number;
    channels: string[];
    peak?:
      | {
          index: number;
          cls: string;
          lat: number;
          lng: number;
          distanceM: number;
          handM: number;
          slopeDeg: number;
          elevationM: number;
          channel?: string | undefined;
        }
      | undefined;
    weights: Record<string, number>;
    missingTerms: string[];
  };
  landCover: {
    builtUpPct: number;
    greenPct: number;
    waterPct: number;
    agriculturePct: number;
    barePct: number;
    unmappedPct: number;
    buildings: number;
    footprintPct: number;
  };
  access: {
    score: number;
    roadKm: number;
    roadDensity: number;
    arterialM: number | null;
    arterialName?: string | undefined;
    transitStops: number;
    railStations: number;
    education: number;
    health: number;
  };
  terrain: { minM: number; maxM: number; meanSlopeDeg: number; steepPct: number };
  scores: {
    livability: number;
    livabilityBand: string;
    livabilityDims: Array<{
      label: string;
      score: number;
      weight: number;
      formula: string;
      inputs: string;
    }>;
    suitability: number;
    suitabilityClass: string;
    flags: Array<{ label: string; value: string; status: string }>;
  };
  recommendations: Array<{ title: string; basis: string; priority: string }>;
  warnings: string[];
  sources: string[];
}

export interface CopilotAction {
  id: string;
  label: string;
  kind: "layer" | "focus-peak" | "navigate" | "fit-area" | "run-preset";
  payload?: Record<string, string> | undefined;
}

export interface AIRequest {
  prompt: string;
  history: Array<{ role: "user" | "assistant"; text: string }>;
  context: AnalysisContext | null;
  saved: SavedArea[];
}

export interface AIResponse {
  text: string;
  evidence?: string[] | undefined;
  constraints?: string[] | undefined;
  recommendation?: { title: string; actions: string[] } | undefined;
  toolCalls: Array<{ name: string; status: "done" | "running" }>;
  actions?: CopilotAction[] | undefined;
  /** Which engine produced `text` (shown under the bubble for transparency). */
  engine: string;
}

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  kind: "on-device" | "cloud" | "local";
  send(request: AIRequest): Promise<AIResponse>;
}
