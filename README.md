<div align="center">

# 🌿 Ginkgo

### Spatial decision intelligence for Malaysian planning authorities

**Pick any area on the map → get riverine flood susceptibility, land use, access, livability and development suitability — with every number explained.**

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white)](https://www.openstreetmap.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## What it does

1. **Select an area** — search a place (or paste `lat, lng`), drag a rectangle, analyse the current view, tap once for a 1 km square, or import a GeoJSON/KML parcel boundary.
2. **Ginkgo fetches real open data for it** — SRTM elevation (AWS Terrain Tiles) and OpenStreetMap rivers, land use, buildings, roads, schools, clinics and transit stops.
3. **It computes, in your browser, with published formulas**
   - **Riverine (fluvial) flood susceptibility** per ~20–120 m cell, from distance to river, height above the nearest river (HAND) and slope.
   - **Land use / land cover** in the 5-class legend (built-up, vegetation, water, agriculture, bare) — unmapped land is reported, never guessed.
   - **Accessibility**, **livability index** (5 dimensions) and **development suitability** with screening flags (river corridor, flood, slopes > 25°, open space) and rule-based planning conditions.
4. **It explains everything** — tap any cell for _"Why this score"_: computed inputs → factor → weight → contribution. AI never produces a score; the copilot only narrates computed results.
5. **Export** — print an A4 planning report to PDF, or download JSON / GeoJSON (area, rivers, facilities, Moderate/High cells).

Works on desktop (primary) and on phones (bottom tabs + bottom-sheet results).

---

## Pages

|     | Page                              |                                                                                                                                                 |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 🗺️  | **Map** `/`                       | Search, draw, 5 basemaps (satellite, streets, dark, light, terrain), flood / land-cover / terrain / rivers / facilities overlays, results panel |
| 📁  | **Areas** `/analysis`             | Saved areas and side-by-side comparison; area profiles                                                                                          |
| 🕒  | **Change** `/change-detection`    | Swipe dated imagery (Esri Wayback since 2014, Sentinel-2 annual) and measure vegetation change (VARI)                                           |
| 💚  | **Livability** `/livability`      | Five dimensions with formulas, inputs and contributions                                                                                         |
| ⚖️  | **Suitability** `/planning`       | Adjustable criteria weights, screening flags, planning conditions                                                                               |
| ✨  | **Copilot** `/ai-copilot`         | Questions answered from the computed results (on-device by default; Gemini / Groq / Ollama optional)                                            |
| 📄  | **Report** `/reports`             | Printable report, JSON, GeoJSON                                                                                                                 |
| ⬆️  | **Import** `/ingest`              | GeoJSON/KML boundaries; GeoTIFF (EPSG:4326 / 3857 / UTM) placed at its true location                                                            |
| 🗄️  | **Data** `/data`                  | Live status and licences of every data source                                                                                                   |
| ⚙️  | **Settings** / 📘 **Methodology** | Model parameters and weights; formulas, sensitivity curves, live validation test, where AI is used                                              |

---

## The riverine flood model

```
RFSI = (0.35·F_dist + 0.45·F_hand + 0.20·F_flat) / Σw
F_dist = 0.5^(distance to river / 250 m)
F_hand = 0.5^(height above river / 5 m)
F_flat = 1 − min(slope / 15°, 1)
High ≥ 0.60 · Moderate ≥ 0.35 · Low
```

- Monotonic by construction and unit-tested: farther, higher or steeper never scores higher.
- Flat land far from rivers stays **Low** (fixes the earlier image-brightness "flat-area" issue).
- SRTM rooftops and voids are filtered before computing height above river.
- Historical flood evidence is **not** included until a verified JPS/DID layer is connected — the gap is shown on every result.
- Parameters are literature-anchored and **illustrative, not yet calibrated**; adjust them in Settings.

**Gate test** (Masjid Jamek must be High, nearby Bukit Nanas Low):
`npm run validate:riverine -- --fixture` → Masjid Jamek 0.65 High · Bukit Nanas 0.15 Low (real SRTM, approximate river centrelines).
Run the live version with real OpenStreetMap rivers from **Methodology → Run test**.

---

## Quickstart

```bash
git clone https://github.com/LuqmanNurhakimRosli/ginkgo-insights.git
cd ginkgo-insights
npm install          # or: bun install
npm run dev          # http://localhost:8080
```

No API key is needed: maps, elevation, OpenStreetMap and the on-device copilot work out of the box.

Optional configuration (`cp .env.example .env`):

| Variable                         | Where           | Purpose                                                       |
| -------------------------------- | --------------- | ------------------------------------------------------------- |
| `VITE_AI_PROVIDER`               | client          | Default copilot engine: `analyst`, `gemini`, `groq`, `ollama` |
| `VITE_BACKEND_URL`               | client          | Optional Python ML backend (default `http://localhost:8000`)  |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | **server only** | Gemini narration via the server function                      |
| `GROQ_API_KEY`, `GROQ_MODEL`     | **server only** | Groq (Llama 3.3 70B) narration                                |

> Never put a key in a `VITE_` variable — those are embedded in the public bundle.

### Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint + prettier
npm test            # bun test tests  (flood monotonicity, valley, OSM parsing, DEM cleaning, UTM)
npm run build       # production build (Nitro / Cloudflare)
```

### Optional Python backend

`backend/` holds the FastAPI service with the PyTorch Siamese U-Net change detector and Random Forest land-cover classifier (`pip install -r backend/requirements.txt && python backend/main.py`). The web app does not require it; its status appears on the Data page.

---

## Architecture

```
Browser ── Map (Leaflet, client-only) ── src/services/spatial.ts ── src/lib/geo/
                                                                     ├─ dem.ts        SRTM tiles, void cleaning
                                                                     ├─ osm.ts        Overpass (3 endpoints)
                                                                     ├─ flood.ts      riverine index
                                                                     ├─ indicators.ts livability / access / suitability
                                                                     └─ recommend.ts  planning conditions
Server function ── src/services/ai/llmProxy.ts (Gemini / Groq, keys server-side)
Optional ── backend/ (FastAPI ML models)
```

Full details: [`system-context.md`](system-context.md) · change log: [`ai.md`](ai.md) · contributor rules: [`AGENTS.md`](AGENTS.md).

---

## Data & licences

Elevation: AWS Terrain Tiles (SRTM). Vectors: © OpenStreetMap contributors (ODbL). Imagery: Esri World Imagery & Wayback, EOX Sentinel-2 cloudless (contains modified Copernicus Sentinel data; 2018+ CC BY-NC-SA). Search: Photon / Nominatim. Heavy production traffic should move basemaps to a commercial tile plan.

> Ginkgo is screening-level decision support. It is not a statutory planning approval or a hydraulic flood study.

Built for the **PLAN-AI Hackathon 2026 — Track B (Geospatial & Satellite AI)** by Team Kuchiko.
