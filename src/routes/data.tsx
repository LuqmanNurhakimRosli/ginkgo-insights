import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CircleDashed, RefreshCw } from "lucide-react";
import { btn, Page, PageHeader, Panel, PanelHeader, Spinner } from "@/components/gk/ui";
import { WAYBACK_CONFIG_URL } from "@/data/basemaps";
import { OVERPASS_ENDPOINTS } from "@/lib/geo/osm";
import { llmStatus } from "@/services/ai/llmProxy";
import { BACKEND_URL, checkBackendHealth } from "@/services/spatial";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Data sources — Ginkgo" },
      {
        name: "description",
        content:
          "Open data sources behind every Ginkgo result, with licences and live availability.",
      },
    ],
  }),
  component: DataPage,
});

type Health = {
  state: "checking" | "online" | "offline" | "info";
  ms?: number | undefined;
  detail?: string | undefined;
};

interface Source {
  id: string;
  name: string;
  role: string;
  provider: string;
  license: string;
  detail: string;
  probe: () => Promise<Health>;
}

async function probe(url: string, mode: RequestMode = "no-cors", timeout = 7000): Promise<Health> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  const t0 = performance.now();
  try {
    const res = await fetch(url, { mode, signal: ctrl.signal, cache: "no-store" });
    if (mode === "cors" && !res.ok) return { state: "offline", detail: `HTTP ${res.status}` };
    return { state: "online", ms: Math.round(performance.now() - t0) };
  } catch {
    return { state: "offline", detail: ctrl.signal.aborted ? "Timed out" : "Not reachable" };
  } finally {
    clearTimeout(t);
  }
}

const SOURCES: Source[] = [
  {
    id: "dem",
    name: "AWS Terrain Tiles (Terrarium)",
    role: "Elevation, slope, height above river",
    provider: "Mapzen / Tilezen on AWS Open Data — SRTM over Malaysia",
    license: "Public domain (SRTM) · attribution requested",
    detail: "~30 m source resolution, sampled at zoom 13–14",
    probe: () =>
      probe("https://s3.amazonaws.com/elevation-tiles-prod/terrarium/13/6406/4022.png", "cors"),
  },
  ...OVERPASS_ENDPOINTS.map<Source>((ep, i) => ({
    id: `overpass-${i}`,
    name: `Overpass API — ${new URL(ep).host}`,
    role:
      i === 0 ? "Rivers, land use, buildings, roads, facilities (primary)" : "Failover endpoint",
    provider: "OpenStreetMap contributors",
    license: "ODbL 1.0",
    detail: "Live community-mapped vectors; completeness varies by area",
    probe: () => probe(ep.replace("/interpreter", "/status")),
  })),
  {
    id: "esri",
    name: "Esri World Imagery",
    role: "Satellite basemap",
    provider: "Esri, Maxar, Earthstar Geographics",
    license: "Esri terms of use · attribution required",
    detail: "Sub-metre in urban Malaysia; capture date varies",
    probe: () =>
      probe(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/12/2011/3202",
      ),
  },
  {
    id: "wayback",
    name: "Esri World Imagery Wayback",
    role: "Dated historical imagery (Change)",
    provider: "Esri Living Atlas",
    license: "Esri terms of use",
    detail: "Releases since 2014",
    probe: () => probe(WAYBACK_CONFIG_URL, "cors"),
  },
  {
    id: "s2",
    name: "Sentinel-2 cloudless",
    role: "Annual 10 m mosaics (Change)",
    provider: "EOX IT Services · contains Copernicus Sentinel data",
    license: "2016 CC BY 4.0 · 2018+ CC BY-NC-SA 4.0",
    detail: "2016, 2018–2024",
    probe: () =>
      probe("https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/g/10/502/800.jpg"),
  },
  {
    id: "osm-tiles",
    name: "OpenStreetMap / CARTO / OpenTopoMap tiles",
    role: "Street, dark, light and terrain basemaps",
    provider: "OSM Foundation, CARTO, OpenTopoMap",
    license: "ODbL data · tile usage policies apply",
    detail: "Use a commercial tile plan for heavy production traffic",
    probe: () => probe("https://tile.openstreetmap.org/5/25/15.png"),
  },
  {
    id: "geocode",
    name: "Photon & Nominatim",
    role: "Place search and area naming",
    provider: "komoot Photon · OSM Nominatim",
    license: "ODbL · fair-use policies (no bulk geocoding)",
    detail: "Typeahead via Photon; Nominatim on submit only",
    probe: () => probe("https://photon.komoot.io/api/?q=Kuala+Lumpur&limit=1", "cors"),
  },
  {
    id: "backend",
    name: "Ginkgo Python backend (optional)",
    role: "PyTorch Siamese U-Net, RF land-cover & flood models on imagery",
    provider: "This project — backend/main.py",
    license: "Project licence",
    detail: BACKEND_URL,
    probe: async () => {
      const h = await checkBackendHealth(3000);
      return h.online
        ? { state: "online", ms: h.latencyMs }
        : { state: "offline", detail: "Not running (optional)" };
    },
  },
  {
    id: "llm",
    name: "Copilot language models",
    role: "Optional narration of computed results",
    provider: "Gemini / Groq via server proxy · Ollama local",
    license: "Provider terms",
    detail: "Keys are read on the server only",
    probe: async () => {
      try {
        const s = await llmStatus();
        const on = [s.gemini && "Gemini", s.groq && "Groq"].filter(Boolean);
        return on.length
          ? { state: "online", detail: `${on.join(" + ")} configured` }
          : { state: "info", detail: "No server key — on-device analyst only" };
      } catch {
        return { state: "info", detail: "Server functions unavailable" };
      }
    },
  },
];

const PENDING = [
  {
    name: "Historical flood extents",
    source: "JPS Infobanjir / DID 1GeoInfo",
    why: "Needed for the history term of the flood model and for validation against observed floods (e.g. Dec 2021 Klang Valley).",
  },
  {
    name: "Official land-use plans",
    source: "PLANMalaysia (e.g. Guna Tanah Semasa, Rancangan Tempatan)",
    why: "Replace community-mapped OSM land use with gazetted zoning for statutory checks.",
  },
  {
    name: "High-resolution DTM",
    source: "JUPEM / LiDAR",
    why: "Bare-earth elevation would remove the rooftop bias of SRTM in dense urban areas.",
  },
];

function StatusPill({ h }: { h: Health | undefined }) {
  if (!h || h.state === "checking")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#94a3b8]">
        <Spinner className="h-3 w-3" /> Checking
      </span>
    );
  const map = {
    online: ["#10B981", h.ms != null ? `Online · ${h.ms} ms` : "Online"],
    offline: ["#EF4444", "Unreachable"],
    info: ["#94A3B8", "Info"],
  } as const;
  const [c, label] = map[h.state];
  return (
    <span className="inline-flex flex-col items-end">
      <span
        className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
        style={{ color: c }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
        {label}
      </span>
      {h.detail && <span className="text-[10.5px] text-[#64748b]">{h.detail}</span>}
    </span>
  );
}

function DataPage() {
  const [health, setHealth] = useState<Record<string, Health>>({});
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const run = useCallback(() => {
    setHealth(Object.fromEntries(SOURCES.map((s) => [s.id, { state: "checking" } as Health])));
    void Promise.all(
      SOURCES.map(async (s) => {
        const h = await s.probe();
        setHealth((prev) => ({ ...prev, [s.id]: h }));
      }),
    ).then(() => setCheckedAt(new Date()));
  }, []);
  useEffect(run, [run]);

  return (
    <Page
      header={
        <PageHeader
          title="Data sources"
          description="Every number in Ginkgo is computed from these open sources at analysis time. Availability is checked live from your browser."
          actions={
            <button onClick={run} className={btn.secondary}>
              <RefreshCw className="h-3.5 w-3.5" /> Re-check
            </button>
          }
        />
      }
    >
      <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6">
        <Panel>
          <PanelHeader
            title="Connected sources"
            hint={checkedAt ? `Last checked ${checkedAt.toLocaleTimeString("en-MY")}` : "Checking…"}
          />
          <ul className="divide-y divide-white/[0.05]">
            {SOURCES.map((s) => (
              <li
                key={s.id}
                className="grid gap-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{s.name}</div>
                  <div className="text-[12px] text-[#cbd5e1]">{s.role}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-[#64748b]">
                    {s.provider} · {s.license} · {s.detail}
                  </div>
                </div>
                <div className={cn("sm:text-right")}>
                  <StatusPill h={health[s.id]} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader
            title="Not yet connected"
            hint="Integrations that would strengthen the results. Shown so reviewers can see exactly what is and is not used."
          />
          <ul className="divide-y divide-white/[0.05]">
            {PENDING.map((p) => (
              <li key={p.name} className="flex gap-3 px-4 py-3.5">
                <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-[#64748b]" />
                <div>
                  <div className="text-[13px] font-medium">
                    {p.name} <span className="font-normal text-[#94a3b8]">· {p.source}</span>
                  </div>
                  <div className="text-[11.5px] leading-snug text-[#94a3b8]">{p.why}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Page>
  );
}
