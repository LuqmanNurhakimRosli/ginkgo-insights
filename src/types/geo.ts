// ─── Ginkgo geospatial domain types ──────────────────────────────────────────
// Every number shown in the UI traces back to one of these structures, which
// are computed from open data (Terrarium DEM, OpenStreetMap) by src/lib/geo.
// No score in this file is ever produced by an LLM.

/** [lat, lng] in WGS84 degrees. */
export type LatLng = [number, number];

export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export type AoiSource = "draw" | "view" | "preset" | "search" | "import" | "point";

export interface AreaOfInterest {
  id: string;
  name: string;
  bbox: BBox;
  source: AoiSource;
  createdAt: number;
  /** Optional exact boundary (imported GeoJSON/KML). Analysis still runs on the bbox grid; cells outside are masked. */
  boundary?: LatLng[] | undefined;
  /** Free-text locality from reverse geocoding (e.g. "Kuala Lumpur"). */
  locality?: string | undefined;
}

// ─── OpenStreetMap features ─────────────────────────────────────────────────

export type ChannelKind = "river" | "canal" | "stream" | "drain";

export interface OsmChannel {
  id: number;
  kind: ChannelKind;
  name?: string | undefined;
  coords: LatLng[];
}

/** 5-class land cover palette shared with the PyTorch / RF classifier legend. */
export enum LandClass {
  Unmapped = 0,
  BuiltUp = 1,
  Vegetation = 2,
  Water = 3,
  Agriculture = 4,
  Bare = 5,
}

export interface OsmArea {
  id: number;
  cls: LandClass;
  /** Original OSM tag, e.g. "landuse=residential". */
  tag: string;
  name?: string | undefined;
  rings: LatLng[][];
}

export interface OsmRoad {
  id: number;
  highway: string;
  name?: string | undefined;
  coords: LatLng[];
}

export type PoiCategory = "education" | "health" | "emergency" | "civic" | "transit";

export interface OsmPoi {
  id: string;
  category: PoiCategory;
  tag: string;
  name?: string | undefined;
  lat: number;
  lng: number;
}

export interface OsmData {
  channels: OsmChannel[];
  areas: OsmArea[];
  buildings: LatLng[][];
  buildingsTruncated: boolean;
  roads: OsmRoad[];
  pois: OsmPoi[];
  endpoint: string;
  fetchedAt: number;
}

// ─── Analysis grid & results ────────────────────────────────────────────────

export interface GridSpec {
  rows: number;
  cols: number;
  bbox: BBox;
  /** Cell size in metres (x = east-west, y = north-south). */
  cellW: number;
  cellH: number;
}

export interface FloodWeights {
  /** Proximity to river channel. */
  distance: number;
  /** Height above nearest drainage (HAND). */
  hand: number;
  /** Flatness (1 − normalised slope). */
  slope: number;
  /** Historical flood evidence (only used when a verified layer is connected). */
  history: number;
}

export interface FloodParams {
  weights: FloodWeights;
  /** Distance at which the proximity factor halves (m). */
  distanceHalfM: number;
  /** Height above river at which the HAND factor halves (m). */
  handHalfM: number;
  /** Slope at which the flatness factor reaches zero (degrees). */
  slopeZeroDeg: number;
  /** Class thresholds on the 0–1 susceptibility index. */
  highAt: number;
  moderateAt: number;
}

export type RiskClass = "Low" | "Moderate" | "High";

export interface FloodFactors {
  distanceM: number;
  elevationM: number;
  channelElevationM: number;
  handM: number;
  slopeDeg: number;
  fDistance: number;
  fHand: number;
  fSlope: number;
  index: number;
  cls: RiskClass;
  channelName?: string | undefined;
  channelKind?: ChannelKind | undefined;
}

export interface CellInspection extends FloodFactors {
  lat: number;
  lng: number;
  row: number;
  col: number;
  landClass: LandClass;
  isWater: boolean;
}

export interface FloodSummary {
  shares: Record<RiskClass, number>;
  meanIndex: number;
  p90Index: number;
  maxIndex: number;
  areaClass: RiskClass;
  peak?: CellInspection | undefined;
  channelCount: number;
  channelNames: string[];
  riverReserveSharePct: number;
  termsUsed: Array<keyof FloodWeights>;
  termsMissing: Array<{ term: keyof FloodWeights; reason: string }>;
  weightsUsed: FloodWeights;
}

export interface LandCoverSummary {
  shares: Record<LandClass, number>;
  builtUpPct: number;
  greenPct: number;
  waterPct: number;
  agriculturePct: number;
  barePct: number;
  unmappedPct: number;
  buildingCount: number;
  buildingsTruncated: boolean;
  footprintCoveragePct: number;
  mixIndex: number;
}

export interface AccessSummary {
  roadKm: number;
  roadDensity: number;
  majorRoadDistanceM: number | null;
  majorRoadName?: string | undefined;
  transitStops: number;
  railStations: number;
  education: number;
  health: number;
  emergency: number;
  civic: number;
  score: number;
  parts: { density: number; arterial: number; transit: number };
}

export interface TerrainSummary {
  minM: number;
  maxM: number;
  meanM: number;
  reliefM: number;
  meanSlopeDeg: number;
  /** Malaysian hill-site slope classes (I <15°, II 15–25°, III 25–35°, IV >35°). */
  slopeClassPct: { I: number; II: number; III: number; IV: number };
  demZoom: number;
  demSource: string;
}

export interface ScoreDimension {
  id: string;
  label: string;
  weight: number;
  score: number;
  formula: string;
  inputs: string;
}

export type SuitabilityClass = "Highly Suitable" | "Suitable" | "Conditional" | "Low Suitability";

export interface ScreeningFlag {
  id: string;
  label: string;
  value: string;
  status: "pass" | "watch" | "fail";
  reference: string;
}

export interface AreaScores {
  livability: { score: number; band: string; dims: ScoreDimension[] };
  suitability: {
    score: number;
    rawScore: number;
    cls: SuitabilityClass;
    criteria: ScoreDimension[];
    flags: ScreeningFlag[];
  };
}

export interface AreaAnalysis {
  version: string;
  aoi: AreaOfInterest;
  computedAt: number;
  durationMs: number;
  areaKm2: number;
  grid: GridSpec;
  /** Row-major grids, length rows*cols. */
  elevation: Float32Array;
  slope: Float32Array;
  hand: Float32Array;
  distance: Float32Array;
  index: Float32Array;
  landcover: Uint8Array;
  /** 1 when the cell lies inside the AOI boundary (always 1 for rectangles). */
  mask: Uint8Array;
  /** Index into osm.channels of the nearest channel per cell (−1 if none). */
  nearestChannel: Int32Array;
  channelElevation: Float32Array;
  osm: OsmData;
  terrain: TerrainSummary;
  flood: FloodSummary;
  landCover: LandCoverSummary;
  access: AccessSummary;
  scores: AreaScores;
  params: FloodParams;
  warnings: string[];
}

export interface AnalysisProgress {
  step: "dem" | "osm" | "model" | "scores" | "done";
  label: string;
  pct: number;
  demDone?: boolean | undefined;
  osmDone?: boolean | undefined;
}

/** Lightweight record persisted to localStorage for the Areas portfolio. */
export interface SavedArea {
  id: string;
  aoi: AreaOfInterest;
  savedAt: number;
  summary: {
    areaKm2: number;
    livability: number;
    suitability: number;
    suitabilityClass: SuitabilityClass;
    floodClass: RiskClass;
    floodHighPct: number;
    builtUpPct: number;
    greenPct: number;
    accessScore: number;
  };
  note?: string | undefined;
}
