# Ginkgo — Progress Log (ai.md)

Running record of AI-executed work on this project. Newest entry last.

---

## Entry 1 — Initial build

Built the initial prototype: design system in `src/styles.css`, domain types, mock data layer (`src/data/*`), spatial + AI service abstractions (`src/services/spatial.ts`, `src/services/ai/*`), global state (`src/state/ginkgo-store.tsx`), map/AI/metric/chart components, and all ten routes.

## Entry 2 — Surgical UI/UX redesign (enterprise pass)

Scope: visual and layout only. No exported component/prop/hook renames, no route changes, no data-binding or provider-interface changes.

## Entry 3 — Dark Operator Console Pivot & Consolidated Command Views

1. Dark Mission-Control aesthetic: `#0B0C0E` background, `#16171A` panel surfaces, 1px hairline borders.
2. Consolidated command views.

## Entry 4 — Production Satellite Map, Open-Source AI & Interactive Fixes

1. Realistic satellite basemap textures and interactive controls.
2. Open-source model support (Ollama, Groq, Hugging Face, Gemini).

## Entry 5 — Complete Navigation Rail, Header Settings Button & Dark Route Polish

1. Sidebar navigator and top header settings modal.
2. Unified dark styling across secondary routes.

## Entry 6 — CARTO Map-First Overhaul, Real Satellite Leaflet Engine & Multi-Spectral ML Pipeline

1. Real Leaflet satellite engine with Esri World Imagery tiles.
2. Multi-spectral index feature engine (NDVI + NDWI + NDBI) and 5-class U-Net segmentation.

## Entry 7 — StreamGuard-Inspired Mission-Control Dashboard, Side-by-Side Satellite Slider & Custom Raster Upload

1. Mission-Control split-screen layout (62% Left Map/Slider + 38% Right Intelligence HUD).
2. Side-by-side satellite slider comparing T1 baseline vs T2 observation.
3. Livability quadrants and priority intervention incident alerts.

## Entry 8 — Production Enterprise Overhaul & Monochrome Dark Standard

1. Eradicated all purple/violet styling in favor of **Jet Black (`#090A0C`)**, **Dark Zinc (`#14161B`)**, **1px Hairline Borders**, and **Crisp White Text**.
2. Replaced placeholder world map photo with authentic high-resolution Sentinel-2 and Esri satellite tiles of Malaysian corridors.
3. Purged all hackathon/competition labels in favor of clean enterprise sectors.

## Entry 9 — Brand Standardization to Ginkgo

1. Standardized all branding, wordmarks, system prompts, page titles, and tooltips to **Ginkgo**.

## Entry 10 — Full Consolidation of Teammates' Models & Pipelines into Ginkgo

1. Consolidated all model weights (`models/flood_*.pkl`), samples, and pipelines into `backend/`.
2. Wired `src/services/spatial.ts` to unified FastAPI endpoints (`http://localhost:8000`).
3. Added 5-Class Land Cover, Change Heatmaps, and Flood Inundation modes to `SideBySideSlider.tsx`.
4. Embedded Nadi's Hydrological Flood Engine into the Scenario Simulator.

## Entry 11 — Comprehensive System Context & End-to-End Technical Documentation

1. Authored complete 5-tier technical architecture breakdown in `system-context.md`.
2. Formalized mathematical spectral formulations ($\text{NDVI}, \text{NDWI}, \text{NDBI}$) and I/P/O specifications.

## Entry 12 — Feature Freeze, Terminology Polish & Pitch Script Lock-In

1. Feature freeze declared; replaced statutory authority claims with defensible planning decision support language.

## Entry 13 — Principal Geospatial UI/UX Overhaul: Map Toolbar, Planning Assessment & End-to-End Raster Ingestion

1. Compact single-line Dual-View Slider toolbar with preset scene dropdown.
2. Complete Planning Assessment document preview with real browser downloads (PDF, JSON, GeoJSON).
3. End-to-end live satellite raster ingestion with preset benchmark satellite cards.

## Entry 14 — World-Class Repository Documentation & README Overhaul

1. Replaced outdated prompt with comprehensive, professional GitHub README.

---

## Entry 16 — Ingest Imagery 4-State Analysis Flow (/ingest)

1. **New Domain Types** (`src/types/ingest.ts`):
   - `IngestionSession`, `HighlightedArea`, `IngestCategory`, `IngestState` with `CATEGORY_COLORS` and `CATEGORY_LABELS` constants.
2. **Mock Detection Service** (`src/services/ingest.ts`):
   - `detectHighlightedAreas()` — returns 4 plausible mock bounding boxes and scores after 2.5s simulated delay.
   - `detectAreasProgressive()` — async generator yielding areas one at a time (400ms stagger) for scan animation.
   - `downloadIngestReport()` — browser file download in PDF (Markdown), JSON, and GeoJSON formats.
3. **4-State Component Pipeline** (`src/components/ingest/`):
   - `IngestUpload.tsx` — drag-and-drop zone with filename/size metadata, 3 sample image picker cards, and gated Analyze button.
   - `IngestPreprocessing.tsx` — scan-line `requestAnimationFrame` animation overlaid on the canvas, progressive bounding box rendering with category-colored polygons and numbered badges, live status counter, auto-transition.
   - `IngestDashboard.tsx` — bidirectional canvas ↔ thumbnail strip click sync, `<canvas>` overlay with focus ring and dimming on selection, sidebar overview/detail swap, score bars for Suitability/Livability/Flood Risk.
   - `IngestReport.tsx` — in-app dark panel report preview with cover section, per-area score tables, PDF/JSON/GeoJSON export buttons.
   - `IngestFlow.tsx` — state machine orchestrator (`UPLOAD → PREPROCESSING → DASHBOARD → REPORT`).
4. **Route & Navigation** (`src/routes/ingest.tsx`, `SidebarRail.tsx`):
   - `/ingest` TanStack Start route registered (auto-discovered by Vite file-system routing).
   - `INGEST` with Upload icon added to the sidebar rail between REPORTS and DATA.
5. **Verification**: `npx tsc --noEmit` → Exit code 0, zero errors.


1. **Comprehensive .gitignore Updates**:
   - Explicitly ignored all environment variables (`.env`, `.env.local`, `.env.*.local`).
   - Blocked all Gemini, Google Cloud, Groq, and AI API keys (`*gemini*key*`, `*gemini*.json`, `*gemini*.env`, `*google*key*`, `*service-account*.json`, `credentials.json`, `api_keys.*`).
   - Ignored Python virtual environments (`.venv/`, `venv/`, `__pycache__/`, `*.pyc`).
2. **Standardized .env.example**: Updated template with safe placeholders for `VITE_AI_PROVIDER`, `GEMINI_API_KEY`, `VITE_BACKEND_URL`, `GROQ_API_KEY`, and `OLLAMA_BASE_URL`.

---

## Entry 17 — Map-first production overhaul & riverine flood model

**Why.** The judge review (Jamal Jamaludin, Gamuda) found the flood result did not make sense
(flat areas scored high), the scope was too broad, and it was unclear where AI was used.
The audit also found: map overlays were hand-drawn SVG on one 256 px tile, scores were
hard-coded, secondary pages showed placeholder maps with no navigation, SSR crashed
(`window is not defined` from a top-level Leaflet import), and the Gemini key was shipped
in the public JS bundle.

**What changed.**
1. **Map-first workflow** replaces image upload: Leaflet loaded client-only; Esri/OSM/CARTO/
   OpenTopoMap basemaps; Photon/Nominatim search; draw rectangle (mouse + touch), analyse
   view, locate me, layers panel, legend, per-cell inspection.
2. **In-browser geospatial engine** (`src/lib/geo/`): AWS Terrarium SRTM DEM with void/pit
   cleaning and a rooftop (20th-percentile) ground filter; Overpass OSM with endpoint
   failover; land cover rasterised to the 5-class legend; access and facility indicators.
3. **Riverine flood susceptibility index** (distance to river, height above nearest
   drainage, flatness) — monotonic by construction, flat-area safeguard, missing history
   term reported, parameters editable in Settings.
4. **"Why this score"** panel for any cell and for every livability/suitability dimension.
5. **All 12 pages rebuilt** on computed data: Map, Areas (+profile), Change (Esri Wayback /
   Sentinel-2 swipe + VARI vegetation change), Livability, Suitability (live weights, flags,
   rule-based conditions), Copilot, Report (A4 print/PDF, JSON, GeoJSON), Import (GeoJSON/KML
   boundaries, GeoTIFF in EPSG:4326/3857/UTM), Data (live source health), Settings, Methodology
   (formulas, sensitivity curves, live validation gate, AI-usage table), 404/error.
6. **App shell**: desktop icon rail; mobile top bar, bottom tabs, "More" sheet, bottom-sheet
   analysis panel; safe-area insets; print stylesheet.
7. **AI**: on-device deterministic analyst (default); Gemini/Groq through a TanStack Start
   server function with server-only keys; Ollama local. LLMs narrate computed JSON only.
   Removed provider stubs that relabelled mock output as Groq/Hugging Face.
8. Removed mock data modules and obsolete components; synced `bun.lock` (it was missing
   `leaflet`); added `geotiff` (lazy-loaded); removed unused `react-leaflet`.

**Verification.**
- `tsc --noEmit` clean; ESLint 0 errors; `vite build` OK; all routes SSR 200 (404 → 404).
- `bun test tests`: 20 tests (flood monotonicity in distance/HAND/slope, flat-area cap,
  synthetic valley, OSM parsing, ring assembly, DEM void cleaning, UTM inverse).
- Gate test with real SRTM + approximate river fixture: Masjid Jamek 0.65 **High**, Dataran
  Merdeka 0.80 High, Bukit Nanas 0.15 **Low**, KL Tower 0.16 Low. Must be re-run live
  (Methodology → Run test) with real OSM rivers before citing.
- Playwright smoke test at 1440×900 and 390×844 (real DEM; OSM/tiles/geocoders from
  fixtures because the build sandbox blocks them): draw, quick areas, inspection, all pages,
  exports, import, VARI, mobile sheet and More menu — no page errors. Client bundle contains
  no API key.

**Open items.** Team decision on persona (copy currently targets PBT); connect verified
JPS/DID flood extents; calibrate weights against observed floods; rotate the previously
exposed Gemini key; backend `flood_engine.py` still contains the brightness-based DEM and is
no longer called by the frontend.
