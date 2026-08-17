import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultSiteId, getSite, locations, sites } from "@/data/sites";
import { layers } from "@/data/layers";
import { getAIProvider, type AIProvider } from "@/services/ai";
import type { AIMessage, MapAction, MapFeature } from "@/types";

export type AnalysisState = "idle" | "loading" | "complete";

interface GinkgoState {
  // map state
  selectedSiteId: string;
  selectedFeatureId: string | null;
  activeLayers: string[];
  highlightedFeatures: MapFeature[];
  zoom: number;
  center: [number, number];
  location: string;
  t1: string;
  t2: string;
  customObservationImage: string | null;
  presetSceneKey: string;
  analysisRun: boolean;
  analysisState: AnalysisState;
  // ai state
  messages: AIMessage[];
  thinking: boolean;
  providerId: string;
}

interface GinkgoActions {
  selectSite: (id: string) => void;
  selectFeature: (id: string | null) => void;
  toggleLayer: (id: string) => void;
  setLayer: (id: string, on: boolean) => void;
  highlightFeatures: (features: MapFeature[]) => void;
  clearHighlights: () => void;
  zoomToFeatures: (features: MapFeature[]) => void;
  setZoom: (z: number) => void;
  panBy: (dx: number, dy: number) => void;
  resetView: () => void;
  setLocation: (l: string) => void;
  setTimeComparison: (t1: string, t2: string) => void;
  setCustomObservationImage: (img: string | null) => void;
  setPresetSceneKey: (key: string) => void;
  runAnalysis: () => void;
  clearAnalysis: () => void;
  askCopilot: (prompt: string) => Promise<void>;
  runMapAction: (action: MapAction, features?: MapFeature[]) => void;
  resetChat: () => void;
  setProviderId: (id: string) => void;
}

const GinkgoContext = createContext<(GinkgoState & GinkgoActions) | null>(null);

let seq = 0;
const nextId = () => `m${++seq}-${Date.now()}`;

export function GinkgoProvider({ children }: { children: ReactNode }) {
  const [selectedSiteId, setSelectedSiteId] = useState(defaultSiteId);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<string[]>(
    layers.filter((l) => l.defaultOn).map((l) => l.id),
  );
  const [highlightedFeatures, setHighlighted] = useState<MapFeature[]>([]);
  const [zoom, setZoomState] = useState(14);
  const [center, setCenter] = useState<[number, number]>([2.9264, 101.6964]);
  const [location, setLocation] = useState(locations[0]!);
  const [t1, setT1] = useState("Jan 2023");
  const [t2, setT2] = useState("Jan 2025");
  const [customObservationImage, setCustomObservationImage] = useState<string | null>(null);
  const [presetSceneKey, setPresetSceneKey] = useState<string>("putrajaya_core");
  const [analysisRun, setAnalysisRun] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [providerId, setProviderId] = useState<string>(
    String(import.meta.env["VITE_AI_PROVIDER"] ?? "mock"),
  );

  const provider: AIProvider = useMemo(() => getAIProvider(providerId), [providerId]);

  const selectSite = useCallback((id: string) => {
    setSelectedSiteId(id);
    setSelectedFeatureId(id);
    const site = getSite(id);
    if (site) setCenter(site.center);
  }, []);

  const toggleLayer = useCallback((id: string) => {
    setActiveLayers((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }, []);

  const setLayer = useCallback((id: string, on: boolean) => {
    setActiveLayers((prev) =>
      on ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((l) => l !== id),
    );
  }, []);

  const zoomToFeatures = useCallback((features: MapFeature[]) => {
    if (!features.length) return;
    const pts = features.flatMap((f) => f.polygon);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    setCenter([cx, cy]);
  }, []);

  const highlightFeatures = useCallback((features: MapFeature[]) => {
    setHighlighted(features);
  }, []);

  const runMapAction = useCallback(
    (action: MapAction, features?: MapFeature[]) => {
      const fs = features ?? [];
      if (action.kind === "highlight") {
        setHighlighted(fs);
        zoomToFeatures(fs);
        const layer = action.payload?.["layer"];
        if (typeof layer === "string") setLayer(layer, true);
      }
      if (action.kind === "zoom") {
        const siteId = action.payload?.["siteId"];
        const site = getSite(typeof siteId === "string" ? siteId : selectedSiteId);
        if (site) setCenter(site.center);
      }
      if (action.kind === "layer") {
        const layer = action.payload?.["layer"];
        if (typeof layer === "string") setLayer(layer, true);
      }
      if (action.kind === "compare" && fs.length) {
        setHighlighted(fs);
        zoomToFeatures(fs);
      }
    },
    [selectedSiteId, setLayer, zoomToFeatures],
  );

  const runAnalysis = useCallback(() => {
    setAnalysisState("loading");
    setAnalysisRun(true);
    // Simulate analysis time (3-5 seconds)
    setTimeout(() => {
      setAnalysisState("complete");
    }, 3500);
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysisState("idle");
    setAnalysisRun(false);
  }, []);

  const askCopilot = useCallback(
    async (prompt: string) => {
      const userMsg: AIMessage = {
        id: nextId(),
        role: "user",
        text: prompt,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setThinking(true);
      try {
        const res = await provider.send({
          prompt,
          siteId: selectedSiteId,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        });
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            createdAt: Date.now(),
            text: res.text,
            evidence: res.evidence,
            constraints: res.constraints,
            recommendation: res.recommendation,
            toolCalls: res.toolCalls,
            actions: res.actions,
            features: res.features,
          },
        ]);
        if (res.features?.length) {
          setHighlighted(res.features);
          zoomToFeatures(res.features);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            createdAt: Date.now(),
            text: "Model unavailable — showing prototype result. Please try again.",
          },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [messages, provider, selectedSiteId, zoomToFeatures],
  );

  const value = useMemo(
    () => ({
      selectedSiteId,
      selectedFeatureId,
      activeLayers,
      highlightedFeatures,
      zoom,
      center,
      location,
      t1,
      t2,
      customObservationImage,
      presetSceneKey,
      analysisRun,
      analysisState,
      messages,
      thinking,
      providerId,
      selectSite,
      selectFeature: setSelectedFeatureId,
      toggleLayer,
      setLayer,
      highlightFeatures,
      clearHighlights: () => setHighlighted([]),
      zoomToFeatures,
      setZoom: (z: number) => setZoomState(z),
      panBy: (dx: number, dy: number) =>
        setCenter(([x, y]) => [x + dx, y + dy]),
      resetView: () => {
        setCenter([2.9264, 101.6964]);
        setZoomState(14);
      },
      setLocation,
      setTimeComparison: (a: string, b: string) => {
        setT1(a);
        setT2(b);
      },
      setCustomObservationImage,
      setPresetSceneKey,
      runAnalysis,
      clearAnalysis,
      askCopilot,
      runMapAction,
      resetChat: () => setMessages([]),
      setProviderId,
    }),
    [
      selectedSiteId,
      selectedFeatureId,
      activeLayers,
      highlightedFeatures,
      zoom,
      center,
      location,
      t1,
      t2,
      customObservationImage,
      presetSceneKey,
      analysisRun,
      analysisState,
      messages,
      thinking,
      providerId,
      selectSite,
      toggleLayer,
      setLayer,
      highlightFeatures,
      zoomToFeatures,
      runAnalysis,
      clearAnalysis,
      askCopilot,
      runMapAction,
    ],
  );

  return <GinkgoContext.Provider value={value}>{children}</GinkgoContext.Provider>;
}

export function useGinkgo() {
  const ctx = useContext(GinkgoContext);
  if (!ctx) throw new Error("useGinkgo must be used within GinkgoProvider");
  return ctx;
}

export function useSelectedSite() {
  const { selectedSiteId } = useGinkgo();
  return getSite(selectedSiteId) ?? sites[0]!;
}
