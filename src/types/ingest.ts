// ─── Ingest Imagery — Domain Types ───────────────────────────────────────────
// Shared data contract for the 4-state Ingest Imagery flow.
// AI providers only generate `explanation` and `suggested_action` text;
// all numeric scores come from the detection service, never from the LLM.

export type IngestState = "UPLOAD" | "PREPROCESSING" | "DASHBOARD" | "REPORT";

export type IngestCategory =
  | "HIGH_SUITABILITY"
  | "CONDITIONAL"
  | "FLOOD_EXPOSED"
  | "NO_INTEREST";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HighlightedArea {
  area_id: string;
  label: string; // "Area 1", "Area 2", ...
  bounding_box: BoundingBox;
  category: IngestCategory;
  suitability_score: number; // 0-100
  livability_index: number; // 0-100
  flood_risk_score: number; // 0-100 (higher = more risk)
  explanation: string;
  suggested_action: string;
}

export interface IngestionOverview {
  total_areas: number;
  category_breakdown: Partial<Record<IngestCategory, number>>;
  summary: string;
}

export interface IngestionSession {
  source_image_id: string;
  source_image_url: string; // base64 data URL or remote URL
  source_filename: string;
  ingested_at: string; // ISO date
  areas: HighlightedArea[];
  overview: IngestionOverview;
}

// Color tokens per category — derived from existing Ginkgo severity palette
export const CATEGORY_COLORS: Record<IngestCategory, string> = {
  HIGH_SUITABILITY: "#10B981", // Emerald
  CONDITIONAL: "#F59E0B", // Amber
  FLOOD_EXPOSED: "#EF4444", // Coral Red
  NO_INTEREST: "#6B7280", // Muted gray
};

export const CATEGORY_LABELS: Record<IngestCategory, string> = {
  HIGH_SUITABILITY: "HIGH SUITABILITY",
  CONDITIONAL: "CONDITIONAL",
  FLOOD_EXPOSED: "FLOOD-EXPOSED",
  NO_INTEREST: "NO SIGNIFICANT INTEREST",
};
