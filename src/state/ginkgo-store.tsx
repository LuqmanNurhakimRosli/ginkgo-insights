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
  analysisRun: boolean;
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
  runAnalysis: () => void;
  askCopilot: (prompt: string) => Promise<void>;
  runMapAction: (action: MapAction, features?: MapFeature[]) => void;
  resetChat: () => void;
  setProviderId: (id: string) => void;
}

const GinkgoContext = createContext<(GinkgoState & GinkgoActions) | null>(null);

let seq = 0;
const nextId = () => `m${++seq}-${Date.now()}`;

const seedMessages: AIMessage[] = [
  {
    id: "seed-user",
    role: "user",
    text: "Is this area suitable for affordable housing development?",
    createdAt: Date.now(),
  },
  {
    id: "seed-ai",
    role: "assistant",
    text: "Yes — Site A is potentially suitable for affordable housing, subject to drainage mitigation. Accessibility and facility catchment are strong, and flood exposure is moderate rather than severe.",
    evidence: [
      "Flood exposure is moderate and manageable with mitigation",
      "Access to the arterial network is very good (91/100)",
      "Close to public amenities (schools, clinic, transit corridor)",
      "Vegetation loss is contained at 12.3%",
      "Livability index is high (84/100)",
    ],
    recommendation: {
      title: "Recommendation",
      actions: [
        "Ensure drainage capacity is upgraded for the moderate-exposure strip before layout approval.",
      ],
    },
    toolCalls: [
      { name: "getSuitabilityScore", status: "done" },
      { name: "getFloodRisk", status: "done" },
      { name: "getAccessibility", status: "done" },
    ],
    createdAt: Date.now(),
  },
];

export function GinkgoProvider({ children }: { children: ReactNode }) {
  const [selectedSiteId, setSelectedSiteId] = useState(defaultSiteId);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<string[]>(
    layers.filter((l) => l.defaultOn).map((l) => l.id),
  );
  const [highlightedFeatures, setHighlighted] = useState<MapFeature[]>([]);
  const [zoom, setZoomState] = useState(1);
  const [center, setCenter] = useState<[number, number]>([50, 50]);
  const [location, setLocation] = useState(locations[0]!);
  const [t1, setT1] = useState("Jan 2023");
  const [t2, setT2] = useState("Jan 2025");
  const [analysisRun, setAnalysisRun] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>(seedMessages);
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
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    setCenter([cx, cy]);
    setZoomState(Math.min(2.4, Math.max(1, 70 / Math.max(span, 18))));
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
        if (site) {
          setCenter(site.center);
          setZoomState(1.8);
        }
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
      analysisRun,
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
      setZoom: (z: number) => setZoomState(Math.min(2.6, Math.max(0.7, z))),
      panBy: (dx: number, dy: number) =>
        setCenter(([x, y]) => [
          Math.min(90, Math.max(10, x + dx)),
          Math.min(90, Math.max(10, y + dy)),
        ]),
      resetView: () => {
        setCenter([50, 50]);
        setZoomState(1);
      },
      setLocation,
      setTimeComparison: (a: string, b: string) => {
        setT1(a);
        setT2(b);
      },
      runAnalysis: () => setAnalysisRun(true),
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
      analysisRun,
      messages,
      thinking,
      providerId,
      selectSite,
      toggleLayer,
      setLayer,
      highlightFeatures,
      zoomToFeatures,
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
