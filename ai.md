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

---

## Entry 13 — Principal Geospatial UI/UX Overhaul: Map Toolbar, Planning Assessment & End-to-End Raster Ingestion

1. **Compact, Single-Line Dual-View Slider Toolbar (`SideBySideSlider.tsx`)**:
   - Replaced oversized wrapped controls with a sleek 36px single-line segmented control: `[ 🎛️ Dual Slider ]`, `[ 🌟 5-Class Land Cover ]`, `[ 🔥 Change Heatmap ]`, `[ 💧 Flood Hazard ]`, `[ 🌿 NDVI ]`.
   - Added `[ 📂 Preset Scenes ▾ ]` selector enabling 1-click loading of benchmark satellite scenes (*Presint 11 Sector, Putra Heights Corridor, Sungai Buah Basin, Sri Damai Reserve*).
2. **Executive Planning Assessment & Real Downloads (`src/routes/index.tsx`)**:
   - Transformed the sparse report tab into a rich statutory assessment preview with official document ID (`DOC: GNK-2026-LOT4829`), parcel area, cadastral metadata, Multi-Criteria Statutory Compliance Matrix table, and planning directives.
   - Built **real, working browser file downloads** for:
     - `PDF Report` (Generates formatted Markdown/PDF assessment document).
     - `JSON Data` (Generates full machine-readable telemetry and compliance score payload).
     - `GeoJSON` (Generates standard vector polygon feature collection).
3. **End-to-End Live Satellite Imagery Ingestion (`RasterUploadModal.tsx`)**:
   - Integrated full drag-and-drop file ingestion converting uploaded GeoTIFF/PNG/JPEG to live map canvas layers via `customObservationImage`.
   - Added 3 instant benchmark satellite cards (*Putra Heights Satellite Scene, Sungai Buah Floodplain, Alpine River Valley*) for 1-click testing.
   - Added `"Custom Scene Active"` status badge with reset button in the map toolbar.
