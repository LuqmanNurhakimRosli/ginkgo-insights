import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import type { BasemapId } from "@/data/basemaps";
import { getPreset, presetToAoi } from "@/data/presets";
import { inspectPoint, reweight } from "@/lib/geo/analyze";
import { DEFAULT_FLOOD_PARAMS } from "@/lib/geo/flood";
import { reverseGeocode } from "@/lib/geo/geocode";
import { DEFAULT_SCORE_WEIGHTS, type ScoreWeights } from "@/lib/geo/indicators";
import { bboxCenter, round } from "@/lib/geo/math";
import { buildContext, DEFAULT_PROVIDER, getAIProvider, type CopilotAction } from "@/services/ai";
import { analyze } from "@/services/spatial";
import type {
  AnalysisProgress,
  AreaAnalysis,
  AreaOfInterest,
  BBox,
  CellInspection,
  FloodParams,
  LatLng,
  SavedArea,
} from "@/types/geo";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LayerId = "flood" | "landcover" | "rivers" | "terrain" | "pois" | "labels" | "imported";
export type LayerState = Record<LayerId, boolean>;

export interface Settings {
  floodParams: FloodParams;
  scoreWeights: ScoreWeights;
  basemap: BasemapId;
  providerId: string;
  layerOpacity: number;
}

export type MapCommand =
  | { id: number; type: "fit"; bbox: BBox }
  | { id: number; type: "fly"; center: LatLng; zoom: number };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  evidence?: string[] | undefined;
  constraints?: string[] | undefined;
  recommendation?: { title: string; actions: string[] } | undefined;
  toolCalls?: Array<{ name: string; status: "done" | "running" }> | undefined;
  actions?: CopilotAction[] | undefined;
  engine?: string | undefined;
}

export type AnalysisStatus = "idle" | "running" | "done" | "error";

/** Georeferenced imagery uploaded on the Import page (session only — not persisted). */
export interface ImportedOverlay {
  name: string;
  image: string;
  bbox: BBox;
  note?: string | undefined;
}

interface GinkgoValue {
  aoi: AreaOfInterest | null;
  analysis: AreaAnalysis | null;
  status: AnalysisStatus;
  progress: AnalysisProgress | null;
  error: string | null;
  inspection: CellInspection | null;
  savedAreas: SavedArea[];
  settings: Settings;
  layers: LayerState;
  mapCommand: MapCommand | null;
  drawMode: boolean;
  messages: ChatMessage[];
  thinking: boolean;
  hydrated: boolean;
  importedOverlay: ImportedOverlay | null;

  setImportedOverlay: (o: ImportedOverlay | null) => void;
  runAnalysis: (aoi: AreaOfInterest) => Promise<void>;
  runPreset: (presetId: string) => void;
  cancelAnalysis: () => void;
  clearAnalysis: () => void;
  inspect: (lat: number, lng: number) => void;
  focusPeak: () => void;
  clearInspection: () => void;
  saveCurrentArea: (note?: string) => SavedArea | null;
  removeSavedArea: (id: string) => void;
  renameCurrentArea: (name: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  setLayer: (id: LayerId, on: boolean) => void;
  toggleLayer: (id: LayerId) => void;
  setDrawMode: (on: boolean) => void;
  fitBounds: (bbox: BBox) => void;
  flyTo: (center: LatLng, zoom?: number) => void;
  askCopilot: (prompt: string) => Promise<void>;
  runCopilotAction: (action: CopilotAction) => void;
  resetChat: () => void;
  clearLocalData: () => void;
}

// ─── Persistence ────────────────────────────────────────────────────────────

const KEYS = {
  settings: "ginkgo:v2:settings",
  saved: "ginkgo:v2:saved",
  layers: "ginkgo:v2:layers",
};

export const DEFAULT_SETTINGS: Settings = {
  floodParams: DEFAULT_FLOOD_PARAMS,
  scoreWeights: DEFAULT_SCORE_WEIGHTS,
  basemap: "satellite",
  providerId: DEFAULT_PROVIDER,
  layerOpacity: 0.7,
};

export const DEFAULT_LAYERS: LayerState = {
  flood: true,
  landcover: false,
  rivers: true,
  terrain: false,
  pois: false,
  labels: true,
  imported: true,
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function loadArray<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    const v = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

function persist(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — non-critical */
  }
}

export function summarize(a: AreaAnalysis): SavedArea["summary"] {
  return {
    areaKm2: round(a.areaKm2, 3),
    livability: a.scores.livability.score,
    suitability: a.scores.suitability.score,
    suitabilityClass: a.scores.suitability.cls,
    floodClass: a.flood.areaClass,
    floodHighPct: round(a.flood.shares.High * 100, 1),
    builtUpPct: round(a.landCover.builtUpPct, 1),
    greenPct: round(a.landCover.greenPct, 1),
    accessScore: a.access.score,
  };
}

// ─── Provider ───────────────────────────────────────────────────────────────

const Ctx = createContext<GinkgoValue | null>(null);
let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(++seq).toString(36)}`;

export function GinkgoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [aoi, setAoi] = useState<AreaOfInterest | null>(null);
  const [analysis, setAnalysis] = useState<AreaAnalysis | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspection, setInspection] = useState<CellInspection | null>(null);
  const [savedAreas, setSavedAreas] = useState<SavedArea[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const [mapCommand, setMapCommand] = useState<MapCommand | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [importedOverlay, setImportedOverlay] = useState<ImportedOverlay | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cmdSeq = useRef(0);

  // Hydrate persisted state after mount (keeps SSR markup deterministic).
  useEffect(() => {
    const s = load<Settings>(KEYS.settings, DEFAULT_SETTINGS);
    setSettings({
      ...s,
      floodParams: {
        ...DEFAULT_FLOOD_PARAMS,
        ...s.floodParams,
        weights: { ...DEFAULT_FLOOD_PARAMS.weights, ...s.floodParams?.weights },
      },
      scoreWeights: {
        livability: { ...DEFAULT_SCORE_WEIGHTS.livability, ...s.scoreWeights?.livability },
        suitability: { ...DEFAULT_SCORE_WEIGHTS.suitability, ...s.scoreWeights?.suitability },
      },
    });
    setLayers(load<LayerState>(KEYS.layers, DEFAULT_LAYERS));
    setSavedAreas(loadArray<SavedArea>(KEYS.saved));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) persist(KEYS.settings, settings);
  }, [settings, hydrated]);
  useEffect(() => {
    if (hydrated) persist(KEYS.layers, layers);
  }, [layers, hydrated]);
  useEffect(() => {
    if (hydrated) persist(KEYS.saved, savedAreas);
  }, [savedAreas, hydrated]);

  const fitBounds = useCallback((bbox: BBox) => {
    setMapCommand({ id: ++cmdSeq.current, type: "fit", bbox });
  }, []);
  const flyTo = useCallback((center: LatLng, zoom = 16) => {
    setMapCommand({ id: ++cmdSeq.current, type: "fly", center, zoom });
  }, []);

  const runAnalysis = useCallback(
    async (next: AreaOfInterest) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setAoi(next);
      setStatus("running");
      setError(null);
      setInspection(null);
      setProgress({ step: "dem", label: "Preparing analysis", pct: 2 });
      setDrawMode(false);
      fitBounds(next.bbox);
      try {
        const result = await analyze(next, {
          params: settings.floodParams,
          scoreWeights: settings.scoreWeights,
          signal: ctrl.signal,
          onProgress: (p) => {
            if (!ctrl.signal.aborted) setProgress(p);
          },
        });
        if (ctrl.signal.aborted) return;
        setAnalysis(result);
        setInspection(null);
        setStatus("done");
        setProgress(null);
        // Name drawn areas from OSM reverse geocoding (non-blocking).
        if (next.source === "draw" || next.source === "view" || next.source === "point") {
          reverseGeocode(bboxCenter(next.bbox)).then((place) => {
            if (!place || ctrl.signal.aborted) return;
            const patch = { name: place.name, locality: place.locality };
            setAoi((cur) => (cur && cur.id === next.id ? { ...cur, ...patch } : cur));
            setAnalysis((cur) =>
              cur && cur.aoi.id === next.id ? { ...cur, aoi: { ...cur.aoi, ...patch } } : cur,
            );
          });
        }
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setStatus("error");
        setProgress(null);
        setError((err as Error).message || "Analysis failed");
      }
    },
    [settings.floodParams, settings.scoreWeights, fitBounds],
  );

  const runPreset = useCallback(
    (presetId: string) => {
      const p = getPreset(presetId);
      if (p) void runAnalysis(presetToAoi(p));
    },
    [runAnalysis],
  );

  const cancelAnalysis = useCallback(() => {
    abortRef.current?.abort();
    setStatus(analysis ? "done" : "idle");
    setProgress(null);
  }, [analysis]);

  const clearAnalysis = useCallback(() => {
    abortRef.current?.abort();
    setAoi(null);
    setAnalysis(null);
    setStatus("idle");
    setProgress(null);
    setError(null);
    setInspection(null);
  }, []);

  const inspect = useCallback(
    (lat: number, lng: number) => {
      if (!analysis || status === "running") return;
      setInspection(inspectPoint(analysis, lat, lng));
    },
    [analysis, status],
  );

  const focusPeak = useCallback(() => {
    const p = analysis?.flood.peak;
    if (!p) return;
    setInspection(p);
    flyTo([p.lat, p.lng], 17);
  }, [analysis, flyTo]);

  const saveCurrentArea = useCallback(
    (note?: string) => {
      if (!analysis) return null;
      const rec: SavedArea = {
        id: uid("area"),
        aoi: { ...analysis.aoi, id: analysis.aoi.id },
        savedAt: Date.now(),
        summary: summarize(analysis),
        note,
      };
      setSavedAreas((prev) =>
        [rec, ...prev.filter((s) => s.aoi.id !== analysis.aoi.id)].slice(0, 50),
      );
      return rec;
    },
    [analysis],
  );

  const removeSavedArea = useCallback((id: string) => {
    setSavedAreas((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const renameCurrentArea = useCallback((name: string) => {
    const n = name.trim();
    if (!n) return;
    setAoi((cur) => (cur ? { ...cur, name: n } : cur));
    setAnalysis((cur) => (cur ? { ...cur, aoi: { ...cur.aoi, name: n } } : cur));
  }, []);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    if (patch.floodParams || patch.scoreWeights) {
      setAnalysis((cur) => (cur ? reweight(cur, next.floodParams, next.scoreWeights) : cur));
      setInspection(null);
    }
  }, []);

  const resetSettings = useCallback(() => updateSettings(DEFAULT_SETTINGS), [updateSettings]);

  const setLayer = useCallback(
    (id: LayerId, on: boolean) => setLayers((l) => ({ ...l, [id]: on })),
    [],
  );
  const toggleLayer = useCallback((id: LayerId) => setLayers((l) => ({ ...l, [id]: !l[id] })), []);

  const askCopilot = useCallback(
    async (prompt: string) => {
      const user: ChatMessage = { id: uid("m"), role: "user", text: prompt, createdAt: Date.now() };
      const history = messages.slice(-10).map((m) => ({ role: m.role, text: m.text }));
      setMessages((prev) => [...prev, user]);
      setThinking(true);
      try {
        const provider = getAIProvider(settings.providerId);
        const res = await provider.send({
          prompt,
          history,
          context: analysis ? buildContext(analysis) : null,
          saved: savedAreas,
        });
        setMessages((prev) => [
          ...prev,
          { id: uid("m"), role: "assistant", createdAt: Date.now(), ...res },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid("m"),
            role: "assistant",
            createdAt: Date.now(),
            text: `The copilot could not answer (${(err as Error).message}). Computed results on screen are unaffected.`,
          },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [messages, settings.providerId, analysis, savedAreas],
  );

  const runCopilotAction = useCallback(
    (a: CopilotAction) => {
      const payload = a.payload ?? {};
      if (a.kind === "layer" && payload["layer"]) setLayer(payload["layer"] as LayerId, true);
      if (a.kind === "focus-peak") focusPeak();
      if (a.kind === "fit-area" && analysis) fitBounds(analysis.aoi.bbox);
      if (a.kind === "run-preset" && payload["id"]) runPreset(payload["id"]);
      if (a.kind === "navigate" && payload["to"]) void navigate({ to: payload["to"] });
      if (
        (a.kind === "layer" || a.kind === "focus-peak" || a.kind === "run-preset") &&
        typeof window !== "undefined"
      ) {
        if (window.location.pathname !== "/" && window.location.pathname !== "/ai-copilot")
          void navigate({ to: "/" });
      }
    },
    [analysis, fitBounds, focusPeak, navigate, runPreset, setLayer],
  );

  const clearLocalData = useCallback(() => {
    try {
      Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setSavedAreas([]);
    setSettings(DEFAULT_SETTINGS);
    setLayers(DEFAULT_LAYERS);
  }, []);

  const value = useMemo<GinkgoValue>(
    () => ({
      aoi,
      analysis,
      status,
      progress,
      error,
      inspection,
      savedAreas,
      settings,
      layers,
      mapCommand,
      drawMode,
      messages,
      thinking,
      hydrated,
      importedOverlay,
      setImportedOverlay,
      runAnalysis,
      runPreset,
      cancelAnalysis,
      clearAnalysis,
      inspect,
      focusPeak,
      clearInspection: () => setInspection(null),
      saveCurrentArea,
      removeSavedArea,
      renameCurrentArea,
      updateSettings,
      resetSettings,
      setLayer,
      toggleLayer,
      setDrawMode,
      fitBounds,
      flyTo,
      askCopilot,
      runCopilotAction,
      resetChat: () => setMessages([]),
      clearLocalData,
    }),
    [
      aoi,
      analysis,
      status,
      progress,
      error,
      inspection,
      savedAreas,
      settings,
      layers,
      mapCommand,
      drawMode,
      messages,
      thinking,
      hydrated,
      importedOverlay,
      runAnalysis,
      runPreset,
      cancelAnalysis,
      clearAnalysis,
      inspect,
      focusPeak,
      saveCurrentArea,
      removeSavedArea,
      renameCurrentArea,
      updateSettings,
      resetSettings,
      setLayer,
      toggleLayer,
      fitBounds,
      flyTo,
      askCopilot,
      runCopilotAction,
      clearLocalData,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGinkgo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGinkgo must be used within GinkgoProvider");
  return ctx;
}
