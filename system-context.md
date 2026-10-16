# Ginkgo — System Context

Spatial decision support for Malaysian planning authorities (PBT). A planner selects any
area on a live map; Ginkgo pulls open elevation and OpenStreetMap data for it, computes
**riverine (fluvial) flood susceptibility**, land use, access, livability and development
suitability with published formulas, and explains every number.

> Last updated: Entry 17 of `ai.md` (map-first production overhaul, Oct 2026).

---

## 1. What changed and why

The earlier prototype asked users to upload a satellite image and showed hard-coded scores
over a single map tile with hand-drawn SVG overlays. Its flood engine inferred elevation from
image brightness, which is why flat, bright areas read as high flood risk (the "flat-area"
issue raised in the judge review). The current system:

- selects areas on a real map (search, draw, current view, import) instead of uploading images;
- computes every metric live from **real data** — SRTM elevation and OpenStreetMap features;
- narrows the flood module to **riverine** susceptibility with a transparent, monotonic formula;
- shows a **"Why this score"** breakdown for any cell (inputs → factors → weights → index);
- keeps the language model out of the calculation entirely.

---

## 2. Architecture

```
Browser (TanStack Start · React 19 · Tailwind v4 · Leaflet, client-only)
│
├─ Map workspace ── search (Photon/Nominatim) · draw / view / import AOI · overlays
│
├─ src/services/spatial.ts  ── single adapter; session cache per bounding box
│     └─ src/lib/geo/analyze.ts  (in-browser geospatial engine)
│          ├─ dem.ts        AWS Terrain Tiles (Terrarium, SRTM ~30 m) → void/pit cleaning
│          ├─ osm.ts        Overpass API (3 endpoints, failover) → rivers, land use,
│          │                buildings, roads, facilities
│          ├─ flood.ts      riverine flood susceptibility index (RFSI)
│          ├─ indicators.ts livability · access · suitability (+ screening flags)
│          ├─ recommend.ts  rule-based planning conditions
│          └─ render.ts / export.ts / imageryChange.ts / importers.ts
│
├─ Server function  src/services/ai/llmProxy.ts  (Nitro / Cloudflare worker)
│     Gemini / Groq with server-side keys only — narrates computed JSON
│
└─ Optional Python backend  backend/  (FastAPI, port 8000)
      PyTorch Siamese U-Net change detection, RF land-cover classifier.
      Not required by any page; health shown on the Data page.
```

Leaflet is imported dynamically inside effects (`loadLeaflet()`), so server-side rendering
never touches `window`. All pages SSR and hydrate cleanly.

---

## 3. Analysis pipeline (per area)

| Step         | Input                                   | Process                                                                                                                                          | Output                                     |
| ------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 1 Select     | Map                                     | Rectangle 150 m – 10 km per side; optional polygon boundary (GeoJSON/KML) masks cells                                                            | `AreaOfInterest`                           |
| 2 Elevation  | Terrarium tiles z13–14 over area + 1 km | Remove voids (< −15 m) and pits (> 30 m below regional median); bilinear sampling                                                                | `DemSampler`                               |
| 3 OSM        | Overpass QL, one request                | Waterways (river/canal/stream/drain), land use, natural, leisure, buildings (≤ 6,000), roads, amenities, transit                                 | `OsmData`                                  |
| 4 Grid       | AOI                                     | ~90 cells on the long side, 20–120 m cells                                                                                                       | `GridSpec`                                 |
| 5 Ground     | DEM                                     | 20th percentile of a 5×5 sample over ~90 m (rooftop filter), gap fill                                                                            | `elevation[]`                              |
| 6 Slope      | Ground                                  | Central differences on 3×3-smoothed surface                                                                                                      | `slope[]`                                  |
| 7 Rivers     | OSM channels                            | Densified, ground elevation along profile (running median), nearest-channel index                                                                | `distance[]`, `hand[]`                     |
| 8 RFSI       | 5–7                                     | Formula in §4                                                                                                                                    | `index[]`, class shares, peak cell         |
| 9 Land cover | OSM polygons + buildings + roads        | Rasterised to the 5-class legend with priorities (water > building > vegetation > bare > agriculture > built-up landuse); unmapped kept explicit | `landcover[]`                              |
| 10 Scores    | 8–9 + POIs                              | §5                                                                                                                                               | livability, suitability, flags, conditions |

Typical run: 2–8 s depending on Overpass response time. Analyses are cancellable.

---

## 4. Riverine flood susceptibility index (RFSI)

```
RFSI = (w_d·F_dist + w_h·F_hand + w_s·F_flat [+ w_hist·F_hist]) / Σw
F_dist = 0.5^(d / 250 m)       d = distance to nearest channel (streams ×2, drains ×4)
F_hand = 0.5^(h / 5 m)         h = ground − river ground elevation (≥ 0)   (HAND)
F_flat = 1 − min(slope / 15°, 1)
Weights: 0.35 / 0.45 / 0.20 (history 0.10 inactive — no verified layer)
Classes: High ≥ 0.60 · Moderate ≥ 0.35 · Low. Area: High if ≥ 20 % High cells,
Moderate if ≥ 20 % Moderate-or-High.
```

- **Monotonic**: tested sweeps (tests/flood.test.ts) show the index never rises with
  distance, height above river or slope.
- **Flat-area safeguard**: flatness carries 20 % of the weight, so flat land far from rivers
  stays Low (unit-tested).
- **Parameters** are anchored to published thresholds (HAND < 5 m floodplain class,
  Nobre et al. 2011; 15° hill-site Class I) and are **illustrative, not calibrated** against
  JPS flood extents. Planners can change them in Settings; results re-score instantly.
- **Scope**: river overflow only. Pluvial / flash flooding is not modelled.

### Validation gate (judge review)

`bun scripts/validate-riverine.ts --fixture` — real SRTM tiles, approximate Klang/Gombak
centrelines (Overpass unreachable from the build sandbox):

| Point                     | RFSI | Class  | HAND   | Distance |
| ------------------------- | ---- | ------ | ------ | -------- |
| Masjid Jamek (confluence) | 0.65 | High ✓ | 5.7 m  | 36 m     |
| Dataran Merdeka           | 0.80 | High ✓ | 0.0 m  | 296 m    |
| Bukit Nanas (forest hill) | 0.15 | Low ✓  | 49.3 m | 787 m    |
| KL Tower (hilltop)        | 0.16 | Low ✓  | 45.8 m | 856 m    |

The Masjid Jamek margin above the High threshold is 0.05. The authoritative run is the
live one on the Methodology page (real OSM rivers); record its output before citing it.

---

## 5. Scores

**Livability (0–100)** — weighted mean, default weights 25/25/20/15/15:
environment `min(green/30 %,1)·100`; mobility `0.4 road density + 0.3 arterial + 0.3 transit`;
resilience `100·(1 − (High + ½ Moderate))`; community `50·min(schools/4,1) + 50·min(health/3,1)`;
land-use mix = Shannon entropy of mapped classes / ln 5.

**Suitability (0–100)** — accessibility 25, flood resilience 25, terrain 15
(`Class I + ½ Class II`), environmental compatibility 20 (`100 − green − water`), services 15.
Classes ≥75 Highly Suitable, ≥60 Suitable, ≥45 Conditional, else Low. Any failed screening
flag caps the class at Conditional.

**Screening flags** — 50 m river corridor share, High-flood share, slopes > 25°
(Class III–IV), 10 % open space, OSM completeness.

**Planning conditions** — deterministic rules in `recommend.ts`, each citing the number
that triggered it.

---

## 6. Where AI is (and is not) used

| Component                                                     | Technique                                                                      | AI?                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| Elevation, slope, HAND, rivers, flood index, land use, scores | Deterministic GIS + formulas                                                   | No                                    |
| Imagery change (in-app)                                       | VARI visible-band index difference                                             | No                                    |
| Imagery models (optional backend)                             | PyTorch Siamese U-Net, Random Forest                                           | Yes (ML)                              |
| Copilot                                                       | On-device analyst by default; Gemini / Groq / Ollama narrate the computed JSON | Language only — never produces scores |

---

## 7. Pages

| Route                | Purpose                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` Map              | Search, draw, analyse view, layers (5 basemaps, flood, land cover, terrain, rivers, facilities, imported imagery), results panel with Overview / Flood / Land use / Access tabs and per-cell "Why this score" |
| `/analysis` Areas    | Saved areas (localStorage), compare up to 4, quick areas                                                                                                                                                      |
| `/analysis/site/$id` | Area profile for a saved area or preset                                                                                                                                                                       |
| `/change-detection`  | Swipe compare Esri Wayback (197 dated releases) or EOX Sentinel-2 annual mosaics; VARI vegetation change for the area                                                                                         |
| `/livability`        | Five-dimension breakdown with formulas and contributions                                                                                                                                                      |
| `/planning`          | Suitability with live-adjustable weights, flags, conditions                                                                                                                                                   |
| `/ai-copilot`        | Grounded chat + map; engine selector                                                                                                                                                                          |
| `/reports`           | Printable A4 report (Print → PDF), JSON and GeoJSON exports                                                                                                                                                   |
| `/ingest` Import     | GeoJSON/KML boundary → analysis; GeoTIFF (EPSG:4326 / 3857 / UTM) → overlay at true location                                                                                                                  |
| `/data`              | Live availability of every source, licences, not-yet-connected sources                                                                                                                                        |
| `/settings`          | Flood model parameters, livability weights, copilot engine, map defaults, local data                                                                                                                          |
| `/help` Methodology  | Pipeline, formulas, sensitivity curves, live validation gate, AI table, limitations                                                                                                                           |

Desktop: 72 px icon rail, map + 38 % analysis panel. Mobile: top bar, bottom tab bar
(Map, Areas, Copilot, Report, More), analysis panel as a three-state bottom sheet.

---

## 8. Data sources

| Source                              | Use                                            | Licence / terms                       |
| ----------------------------------- | ---------------------------------------------- | ------------------------------------- |
| AWS Terrain Tiles (Terrarium, SRTM) | Elevation                                      | Public domain / attribution           |
| OpenStreetMap via Overpass          | Rivers, land use, buildings, roads, facilities | ODbL                                  |
| Esri World Imagery (+ Wayback)      | Satellite basemap, dated imagery               | Esri terms                            |
| EOX Sentinel-2 cloudless            | Annual 10 m mosaics                            | 2016 CC BY 4.0; 2018+ CC BY-NC-SA 4.0 |
| OSM / CARTO / OpenTopoMap tiles     | Basemaps                                       | Tile usage policies                   |
| Photon, Nominatim                   | Search, area naming                            | ODbL, fair use (no bulk)              |

**Not connected (shown in UI):** JPS Infobanjir / DID flood extents (history term,
validation), PLANMalaysia gazetted land use, JUPEM/LiDAR DTM.

---

## 9. Security & configuration

- `GEMINI_API_KEY`, `GROQ_API_KEY` (and optional `GEMINI_MODEL`, `GROQ_MODEL`) are read only
  by the server function. No secret uses a `VITE_` prefix; the client bundle is checked to
  contain no key.
- Public client variables: `VITE_AI_PROVIDER` (`analyst` | `gemini` | `groq` | `ollama`),
  `VITE_BACKEND_URL`.
- Saved areas and settings live in the browser (`ginkgo:v2:*` localStorage keys); imported
  files never leave the browser.

---

## 10. Repository layout (frontend)

```
src/
├── lib/geo/            analyze · dem · osm · flood · indicators · recommend · render ·
│                       export · geocode · importers · imageryChange · spatialIndex · math
├── services/           spatial.ts (adapter) · ai/ (analyst, context, llmProxy, providers)
├── state/              ginkgo-store.tsx (AOI, analysis, saved areas, settings, copilot)
├── components/
│   ├── layout/         AppShell (rail, mobile bars), nav
│   ├── map/            GinkgoMap, CompareMap, MapSearch, MapLayers
│   ├── analysis/       AnalysisPanel, FloodExplain, AnalysisGate
│   ├── ai/             MessageBubble
│   └── gk/ui.tsx       design-system primitives
├── data/               presets, basemaps & imagery sources
├── routes/             12 pages (see §7)
└── types/geo.ts        domain types
tests/                  bun test — flood monotonicity, synthetic valley, OSM parsing, DEM cleaning, UTM
scripts/                validate-riverine.ts — Masjid Jamek gate test with real DEM
backend/                optional FastAPI ML service (unchanged)
```

Commands: `npm run dev` · `npm run build` · `npm run lint` · `bun test tests` ·
`bun scripts/validate-riverine.ts [--fixture]`.
