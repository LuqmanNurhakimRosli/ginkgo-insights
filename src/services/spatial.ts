/**
 * Ginkgo spatial service — the single adapter every view calls.
 *
 * `analyze()` runs the in-browser geospatial engine (src/lib/geo) on live open
 * data: AWS Terrain Tiles (SRTM DEM) and OpenStreetMap via Overpass. Results are
 * cached per bounding box for the session.
 *
 * The optional Python FastAPI backend (backend/main.py) is still reachable via
 * the adapters below for the PyTorch / scikit-learn imagery models; when it is
 * offline the UI keeps working on the client engine.
 */
import { analyzeArea, reweight, type AnalyzeOptions } from "@/lib/geo/analyze";
import { DEFAULT_FLOOD_PARAMS } from "@/lib/geo/flood";
import type { ScoreWeights } from "@/lib/geo/indicators";
import { bboxKey } from "@/lib/geo/math";
import type { AreaAnalysis, AreaOfInterest, FloodParams } from "@/types/geo";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const cache = new Map<string, AreaAnalysis>();
const MAX_CACHE = 8;

export async function analyze(
  aoi: AreaOfInterest,
  opts: AnalyzeOptions & { params?: FloodParams; scoreWeights?: ScoreWeights } = {},
): Promise<AreaAnalysis> {
  const key = `${bboxKey(aoi.bbox)}|${aoi.boundary?.length ?? 0}`;
  const hit = cache.get(key);
  const params = opts.params ?? DEFAULT_FLOOD_PARAMS;
  if (hit) {
    const named = { ...hit, aoi: { ...hit.aoi, ...aoi, id: aoi.id } };
    return reweight(named, params, opts.scoreWeights);
  }
  const result = await analyzeArea(aoi, { ...opts, params });
  cache.set(key, result);
  if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value!);
  return result;
}

export function clearAnalysisCache() {
  cache.clear();
}

// ─── Optional FastAPI backend adapters ─────────────────────────────────────

export interface BackendHealth {
  online: boolean;
  latencyMs?: number;
  detail?: string;
}

export async function checkBackendHealth(timeoutMs = 2500): Promise<BackendHealth> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { signal: ctrl.signal });
    if (!res.ok) return { online: false, detail: `HTTP ${res.status}` };
    return { online: true, latencyMs: Math.round(performance.now() - t0) };
  } catch {
    return { online: false, detail: "Not reachable" };
  } finally {
    clearTimeout(timer);
  }
}

export interface TemporalModelOutput {
  scenario: string;
  images: Record<string, string>;
  stats: {
    mean_change_intensity: number;
    net_change_percentage: number;
    top_transitions: Array<{ from: string; to: string; pixels: number; percentage: number }>;
  };
}

/** PyTorch Siamese U-Net + RF land-cover inference on two image rasters (base64). */
export async function runTemporalInference(
  t1_b64: string,
  t2_b64: string,
): Promise<TemporalModelOutput | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/predict/temporal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: "custom", t1_b64, t2_b64 }),
    });
    if (!res.ok) return null;
    return (await res.json()) as TemporalModelOutput;
  } catch {
    return null;
  }
}
