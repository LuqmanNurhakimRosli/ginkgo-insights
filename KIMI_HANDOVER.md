# GINKGO — MASTER SYSTEM HANDOVER & AI INSTRUCTOR DOCUMENT

> **For AI Assistants (Kimi, Claude, Gemini, GPT, etc.):**
> You are now the principal AI coding assistant for the **Ginkgo** project.
> Read this entire document before writing any code or giving any advice.
> This document IS the ground truth for the system. Everything you need is here.

---

## SECTION 0 — WHO YOU ARE & WHAT YOU MUST DO

You are an expert senior full-stack engineer, geospatial AI specialist, and town planning systems architect.

Your job is to help continue building, debugging, and extending the **Ginkgo Spatial Decision Intelligence Platform** — a production-grade web application that converts satellite imagery and GIS data into explainable statutory town planning assessments for Malaysian municipal planners.

### Non-Negotiable Rules You Must Follow At All Times:

1. **Brand is GINKGO** — never call it PlanAI, Track B, or anything else.
2. **Design is Monochrome Dark Enterprise** — Jet Black `#090A0C`, Dark Zinc `#14161B`/`#1E2129`, hairline borders `rgba(255,255,255,0.08)`. Zero purple or violet anywhere in the UI chrome.
3. **Functional severity colors only** — Emerald `#10B981` (good), Amber `#F59E0B` (warning), Coral Red `#EF4444` (risk), Sky Blue `#38BDF8` (info).
4. **AI never generates scores** — LLMs only write `explanation` and `suggested_action` text. All numeric scores come from the ML detection service.
5. **No page scroll at any state** — all views are `h-screen overflow-hidden` fixed viewport.
6. **Adapter fallback pattern** — if the Python backend is unreachable, the frontend silently falls back to pre-computed mock data. Never crash the UI.
7. **Mandatory documentation** — after any significant change, update `system-context.md`, append a new entry to `ai.md`, and keep `AGENTS.md` synchronized.
8. **Never delete `/teamates/`** — that folder is archived reference material and must never be touched.

---

## SECTION 1 — PROJECT IDENTITY & COMPETITION CONTEXT

| Field | Value |
|---|---|
| **Product Name** | Ginkgo |
| **Tagline** | "From satellite evidence to planning intelligence." |
| **Category** | Enterprise Spatial Decision Intelligence & Land Analytics Platform |
| **Competition** | PLAN-AI Hackathon 2026 — Track B: Geospatial & Satellite AI Challenge |
| **Organizers** | PLANMalaysia, LPBM (Lembaga Perancang Bandar Malaysia), MIP (Malaysian Institute of Planners), UZMA |
| **Core Mission** | AI untuk Perancangan Pintar, Inklusif dan Mampan (AI for Smart, Inclusive & Sustainable Town Planning) |
| **Statutory Framework** | Akta 172 (Town & Country Planning Act 1976), MSMA 2nd Edition Stormwater Management Manual |
| **Repository** | https://github.com/LuqmanNurhakimRosli/ginkgo-insights |
| **Lead Developer** | Luqman Nurhakim Rosli |

---

## SECTION 2 — FULL TECHNOLOGY STACK

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Framework | TanStack Start | v1 |
| UI Library | React | 19 |
| Language | TypeScript | 5.8 |
| Styling | Tailwind CSS | v4 |
| Map Engine | Leaflet + Esri World Imagery | Latest |
| Routing | TanStack Router (file-based, auto-generated) | v1 |
| State | Custom React Context (`ginkgo-store.tsx`) | — |
| Build Tool | Vite | 8 |
| Dev Port | `http://localhost:8080` | — |

### Backend
| Layer | Technology |
|---|---|
| API Framework | Python FastAPI |
| Server Port | `http://localhost:8000` |
| Deep Learning | PyTorch (Siamese Dual-Stream U-Net) |
| ML/Classifiers | Scikit-Learn (Random Forest, Decision Tree, HistGradientBoosting, Logistic Regression) |
| Image Processing | OpenCV, PIL, NumPy, Rasterio |
| GIS Vector Data | GeoPandas, Fiona, Shapely, PyProj |

### AI / LLM Providers (via OpenRouter)
| Role | Model | OpenRouter ID |
|---|---|---|
| Primary Spatial Copilot | Google Gemini 2.5 Flash | `google/gemini-2.5-flash` |
| Open-Source Track B Model | Qwen-2.5-VL 72B | `qwen/qwen-2.5-vl-72b-instruct` |
| Statutory Report Generation | Google Gemini 2.5 Flash | `google/gemini-2.5-flash` |
| Low-Latency Fallback | Gemini 2.5 Flash Lite | `google/gemini-2.5-flash-lite` |
| Local / Offline | Ollama Llama 3 | `http://localhost:11434` |

### OpenRouter API Settings
```
Base URL: https://openrouter.ai/api/v1
Tool Calls / JSON Schema: temperature = 0.0, response_format: { type: "json_schema", strict: true }
Conversational Text: temperature = 0.3
```

---

## SECTION 3 — THE 3-TIER GLASS-BOX ARCHITECTURE

The fundamental design principle of Ginkgo is **full traceability**. Every planning recommendation traces back through 3 tiers:

```
TIER 3: STATUTORY DECISION (The "What Must We Do?")
  Composite Livability Rating: 84 / 100
  Assessment: "Suitable subject to mandatory OSD requirement"
  1-Click Export: PDF Report, JSON, GeoJSON
         ▲
         │ Synthesizes & Evaluates
TIER 2: PLANNING INTELLIGENCE QUADRANTS (The "Why?")
  Environment (66/100) — NDVI canopy loss threshold
  Accessibility (91/100) — JKR arterial road network score
  Disaster Resilience (88/100) — JPS 100-year flood zone buffer
  Sustainability (85/100) — Akta 172 structure plan compatibility
         ▲
         │ Derived Mathematically From
TIER 1: EMPIRICAL GEOSPATIAL EVIDENCE (The "What Is There?")
  PyTorch Siamese U-Net → Pixel-level change heatmap
  5-Class Random Forest → Urban / Vegetation / Water / Soil / Agriculture
  Sentinel-2 Spectral Indices → NDVI, NDWI, NDBI
  Nadi's Flood Engine → Rainfall × Soil × Elevation inundation model
```

This 3-tier structure is Ginkgo's core intellectual contribution. **Never collapse or bypass it.**

---

## SECTION 4 — END-TO-END DATA PIPELINE (6 PHASES)

### Phase 1: Satellite Raster Ingestion
- **Input**: Bi-temporal Sentinel-2 L2A optical rasters (T1 Baseline vs T2 Observation), Esri World Imagery tiles, or user-uploaded GeoTIFF/PNG/JPEG
- **Process**: Resize and normalize to float tensors [0, 1]
- **Code**: `backend/services/spatial_engine.py`

### Phase 2: Spectral Index Extraction
```
NDVI = (NIR - Red) / (NIR + Red + ε)     → Vegetation canopy density
NDWI = (Green - NIR) / (Green + NIR + ε) → Water bodies & flood zones
NDBI = (SWIR - NIR) / (SWIR + NIR + ε)   → Built-up impervious surfaces
```
- **Code**: `backend/services/spatial_engine.py`, `backend/model/land_cover_classifier.py`

### Phase 3: Multi-Model ML Inference
1. **PyTorch Siamese Dual-Stream U-Net** (`backend/model/unet_change_detection.py`)
   - Ingests T1 and T2 tensors through shared-weight convolutional encoders
   - Outputs: continuous pixel-wise Change Intensity Heatmap (0.0 = unchanged, 1.0 = severe)
2. **5-Class Random Forest** (`backend/model/land_cover_classifier.py`)
   - 7-feature input: [R, G, B, NDVI, NDWI, NDBI, Brightness]
   - Outputs: Class 0=Urban(#DC3545), Class 1=Vegetation(#28A745), Class 2=Water(#007BFF), Class 3=Soil(#EE9B00), Class 4=Agriculture(#9BCE00)
3. **Nadi's Hydrological Flood Engine** (`backend/services/flood_engine.py`)
   - Models: flood_rf_model.pkl, flood_dt_model.pkl, flood_hgb_model.pkl, flood_lr_model.pkl
   - Inputs: rainfall (mm/hr), soil type (clay/loam/sand), elevation offset, river proximity
   - Outputs: inundation mask, flood depth heatmap, hazard rating (Low/Moderate/Severe/Catastrophic)

### Phase 4: Land Transition Matrix
- Cross-tabulates T1 → T2 class migrations
- Computes total hectarage converted (e.g., Vegetation → Urban = 12.4 ha)
- Calculates net change percentage and severity breakdown
- **Code**: `backend/utils/raster_processor.py`

### Phase 5: Statutory Evaluation
- Computes composite Livability Index (0–100) across 4 quadrants:
  - Environment: NDVI canopy retention score
  - Accessibility: JKR road network connectivity score
  - Resilience: JPS 100-year flood zone buffer margin
  - Sustainability: Akta 172 local structure plan compatibility
- Validates against statutory planning constraints (OSD, KSAS, river buffers)

### Phase 6: Mission Control Delivery
- Renders on Dual-View Slider and Intelligence HUD
- AI Copilot generates explanations with statutory citations
- Exports: PDF report, JSON data payload, GeoJSON vector boundaries

---

## SECTION 5 — BACKEND API ENDPOINTS

Base URL: `http://localhost:8000`

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Check backend + ML model status |
| POST | `/api/predict/temporal` | T1+T2 rasters → change heatmap + 5-class segmentation |
| POST | `/api/predict/flood` | Rainfall + soil + elevation → flood inundation mask |
| GET | `/api/samples` | Serve benchmark satellite raster images |
| POST | `/api/scenarios` | Plot ratio + density → runoff + traffic + canopy projections |
| POST | `/api/report` | Compile full Akta 172 statutory planning assessment |

### Adapter Fallback Pattern (CRITICAL)
In `src/services/spatial.ts`, every API call is wrapped:
```typescript
try {
  const response = await fetch('http://localhost:8000/api/...')
  return await response.json()
} catch {
  // Backend unreachable → return pre-computed mock data
  return MOCK_FALLBACK_DATA
}
```
The frontend NEVER crashes if the backend is offline.

---

## SECTION 6 — FRONTEND ROUTES & NAVIGATION

All routes are in `src/routes/`. TanStack Start auto-discovers them from the file system.

| Route | File | Purpose |
|---|---|---|
| `/` | `index.tsx` | Mission Control Dashboard (main view) |
| `/analysis` | `analysis.index.tsx` | Site analysis multi-view |
| `/analysis/site/:id` | `analysis.site.$id.tsx` | Individual site detail |
| `/change-detection` | `change-detection.tsx` | Bi-temporal change detection view |
| `/livability` | `livability.tsx` | 4-quadrant livability intelligence |
| `/planning` | `planning.tsx` | Suitability assessment view |
| `/ai-copilot` | `ai-copilot.tsx` | Full-screen AI spatial copilot |
| `/reports` | `reports.index.tsx` | Statutory report export |
| `/ingest` | `ingest.tsx` | 4-state satellite imagery ingestion flow |
| `/data` | `data.tsx` | Data sources & GIS layers browser |
| `/settings` | `settings.tsx` | System configuration |
| `/help` | `help.tsx` | Help & documentation |

### Sidebar Navigation (`src/components/layout/SidebarRail.tsx`)
64px wide icon rail on the left. Icons from `lucide-react`. Active state: `#5EEAD4` teal accent with left border indicator.

---

## SECTION 7 — KEY COMPONENTS

### Map Components (`src/components/map/`)
- **`SideBySideSlider.tsx`** — The main canvas. Draggable split-curtain comparing T1 vs T2. Single-line HUD toolbar with layer modes: Dual Slider, 5-Class Land Cover, Change Heatmap, Flood Hazard, NDVI. Preset scene switcher dropdown.
- **`SatelliteMap.tsx`** — Leaflet engine with Esri World Imagery tiles.

### Dashboard Components (`src/components/dashboard/`)
- **`LivabilityQuadrant.tsx`** — 4-quadrant card showing Environment, Accessibility, Resilience, Sustainability scores.
- **`InterventionFeed.tsx`** — Priority spatial alert feed showing hotspot incidents.

### AI Components (`src/components/ai/`)
- **`AIDock.tsx`** — Floating draggable spatial planning copilot dock.
- **`AIMessageBubble.tsx`** — Message bubbles with evidence disclosures and tool badges.
- **`AISpatialEvidence.tsx`** — Evidence panel showing spatial data behind AI claims.

### Ingest Components (`src/components/ingest/`)
- **`IngestFlow.tsx`** — State machine orchestrator: UPLOAD → PREPROCESSING → DASHBOARD → REPORT
- **`IngestUpload.tsx`** — Drag-and-drop zone + 3 sample image picker cards
- **`IngestPreprocessing.tsx`** — Scan-line animation + progressive bounding box canvas rendering
- **`IngestDashboard.tsx`** — Bidirectional canvas↔thumbnail sync, sidebar overview/detail
- **`IngestReport.tsx`** — In-app dark report preview + PDF/JSON/GeoJSON export

### Upload Components (`src/components/upload/`)
- **`RasterUploadModal.tsx`** — Quick modal for uploading custom satellite scenes to the main map canvas.

---

## SECTION 8 — STATE MANAGEMENT

File: `src/state/ginkgo-store.tsx`

Global state managed via React Context. Key state fields:

```typescript
selectedSiteId: string              // Active site: "site-a" | "site-b" | "site-c" | "site-d"
aiProvider: string                  // Active LLM: "mock" | "gemini" | "groq" | "ollama"
customObservationImage: string|null // Base64 data URL of user-uploaded satellite raster
presetSceneKey: string|null         // Active preset scene key for the slider
```

Key exported hooks:
- `useGinkgo()` — returns full store context
- `useSelectedSite()` — returns currently selected site object from `src/data/sites.ts`

---

## SECTION 9 — DATA & TYPES

### Site Data (`src/data/sites.ts`)
4 reference parcels: `site-a` (Presint 11, Putrajaya), `site-b` (Presint 14, Putrajaya), `site-c` (Sungai Buah Basin, Hulu Langat), `site-d` (Sri Damai Reserve, Hulu Langat).

### TypeScript Types

**Core types** (`src/types/index.ts`): `Site`, `MapAction`, `MapFeature`, `AIToolCall`

**Ingest types** (`src/types/ingest.ts`):
```typescript
IngestState = "UPLOAD" | "PREPROCESSING" | "DASHBOARD" | "REPORT"
IngestCategory = "HIGH_SUITABILITY" | "CONDITIONAL" | "FLOOD_EXPOSED" | "NO_INTEREST"
HighlightedArea { area_id, label, bounding_box, category, suitability_score, livability_index, flood_risk_score, explanation, suggested_action }
IngestionSession { source_image_id, source_image_url, source_filename, ingested_at, areas[], overview }
```

---

## SECTION 10 — AI PROVIDER SYSTEM

File: `src/services/ai/index.ts`

### Provider Registry
```typescript
providers = {
  mock: mockAIProvider,         // Default, zero API keys needed
  gemini: geminiProvider,       // Google Gemini via direct API or OpenRouter
  groq: groqProvider,           // Groq acceleration
  ollama: ollamaProvider,       // Local Llama 3 via Docker
  huggingface: huggingFaceProvider
}
```

### AIProvider Interface (`src/services/ai/types.ts`)
```typescript
interface AIProvider {
  id: string
  name: string
  send(request: AIRequest): Promise<AIResponse>
}

interface AIRequest {
  prompt: string
  siteId: string
  history: Array<{ role: "user" | "assistant"; text: string }>
}

interface AIResponse {
  text: string
  evidence?: string[]
  constraints?: string[]
  recommendation?: { title: string; actions: string[] }
  toolCalls: AIToolCall[]
  actions?: MapAction[]
  features?: MapFeature[]
}
```

### Ingest Detection Service (`src/services/ingest.ts`)
```typescript
detectHighlightedAreas(imageUrl, filename, dimensions) → Promise<IngestionSession>
detectAreasProgressive(imageUrl, filename, dimensions) → AsyncGenerator<HighlightedArea>
downloadIngestReport(session, format: "pdf"|"json"|"geojson") → void
```

---

## SECTION 11 — GIS & OFFICIAL DATA ASSETS

### Pahang 2024 Land Use Shapefile
- **Location**: `Pahang 2024/Pahang_Semasa_2024.shp`
- **CRS**: EPSG:3857 (WGS 1984 Web Mercator) — native Leaflet compatible
- **Size**: 39 MB geometry, 341 MB attribute table
- **Content**: Official PLANMalaysia Guna Tanah Semasa (Current Land Use) polygons
- **Key Classes**: Perumahan, Komersial, Industri, Pertanian, Hutan Simpan, Badan Air

### Statutory Reference Documents (`material/`)
- `Draf RS Negeri Selangor 2035 (Pengubahan).pdf` — State Structure Plan
- `RINGKASAN EKSEKUTIF RW CEKAL (BM).pdf` — Regional Resilience & Disaster Plan

### Key Statutory Rules Encoded in Ginkgo
| Rule | Source | Implementation |
|---|---|---|
| 10% public open space / green canopy | Akta 172 Section 21B | Planning Assessment compliance matrix |
| On-Site Stormwater Detention (OSD) | MSMA 2nd Edition | Scenario Simulator runoff calculation |
| 50-100m river reserve buffer | RW CEKAL / JPS Guidelines | Flood Engine river proximity decay |
| KSAS Level 1 & 2 exclusion zones | RS Selangor 2035 | AI Copilot system prompt constraints |

---

## SECTION 12 — ENVIRONMENT VARIABLES

File: `.env.local` (never commit to Git — see `.env.example` for template)

```bash
# OpenRouter (Primary AI Provider)
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Model Selection
OPENROUTER_PRIMARY_MODEL=google/gemini-2.5-flash
OPENROUTER_OPENSOURCE_MODEL=qwen/qwen-2.5-vl-72b-instruct
OPENROUTER_FALLBACK_MODEL=google/gemini-2.5-flash-lite

# Frontend AI provider (set to "mock" for no-key operation)
VITE_AI_PROVIDER=mock
VITE_BACKEND_URL=http://localhost:8000
VITE_AI_BACKEND_URL=http://localhost:8000/api/copilot/chat

# Optional direct Gemini key (proxied through backend)
GEMINI_API_KEY=
GROQ_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
```

---

## SECTION 13 — LOCAL SETUP (NEW LAPTOP QUICKSTART)

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Git

### Step 1: Clone & Install Frontend
```bash
git clone https://github.com/LuqmanNurhakimRosli/ginkgo-insights.git
cd ginkgo-insights
npm install
npm run dev
# Open http://localhost:8080
```

### Step 2: Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local and add your OpenRouter API key
```

### Step 3: (Optional) Run Python Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
# Backend runs on http://localhost:8000
# Frontend auto-detects and uses it; falls back gracefully if offline
```

### Step 4: Verify TypeScript
```bash
npx tsc --noEmit
# Must exit with code 0 — zero errors
```

---

## SECTION 14 — COMPLETE FILE DIRECTORY

```
PlanAI/
├── backend/
│   ├── main.py                          # FastAPI server (port 8000)
│   ├── requirements.txt
│   ├── train_model.py
│   ├── models/
│   │   ├── flood_rf_model.pkl
│   │   ├── flood_dt_model.pkl
│   │   ├── flood_hgb_model.pkl
│   │   └── flood_lr_model.pkl
│   ├── samples/
│   │   ├── river_delta.png
│   │   ├── mountain_valley.png
│   │   ├── putra_heights_sat.png
│   │   ├── putra_heights_map.png
│   │   └── agricultural_plains.png
│   ├── model/
│   │   ├── unet_change_detection.py     # PyTorch Siamese U-Net
│   │   └── land_cover_classifier.py    # 5-Class Random Forest
│   ├── services/
│   │   ├── flood_engine.py
│   │   ├── spatial_engine.py
│   │   └── copilot_engine.py
│   └── utils/
│       ├── raster_processor.py
│       └── synthetic_data_generator.py
├── src/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx                    # Mission Control (main)
│   │   ├── ingest.tsx                   # /ingest route
│   │   ├── ai-copilot.tsx
│   │   ├── analysis.tsx
│   │   ├── analysis.index.tsx
│   │   ├── analysis.site.$id.tsx
│   │   ├── change-detection.tsx
│   │   ├── data.tsx
│   │   ├── help.tsx
│   │   ├── livability.tsx
│   │   ├── planning.tsx
│   │   ├── reports.tsx
│   │   ├── reports.index.tsx
│   │   └── settings.tsx
│   ├── components/
│   │   ├── ai/
│   │   │   ├── AIDock.tsx
│   │   │   ├── AIMessageBubble.tsx
│   │   │   └── AISpatialEvidence.tsx
│   │   ├── dashboard/
│   │   │   ├── LivabilityQuadrant.tsx
│   │   │   └── InterventionFeed.tsx
│   │   ├── ingest/
│   │   │   ├── IngestFlow.tsx
│   │   │   ├── IngestUpload.tsx
│   │   │   ├── IngestPreprocessing.tsx
│   │   │   ├── IngestDashboard.tsx
│   │   │   └── IngestReport.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── SidebarRail.tsx
│   │   │   └── TopNav.tsx
│   │   ├── map/
│   │   │   ├── SideBySideSlider.tsx
│   │   │   └── SatelliteMap.tsx
│   │   ├── metrics/
│   │   │   └── ScoreDial.tsx
│   │   ├── upload/
│   │   │   └── RasterUploadModal.tsx
│   │   ├── brand/
│   │   └── ui/
│   ├── data/
│   │   ├── sites.ts
│   │   └── reports.ts
│   ├── services/
│   │   ├── spatial.ts                   # API bridge + fallback
│   │   ├── ingest.ts                    # Ingest detection service
│   │   └── ai/
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── geminiProvider.ts
│   │       ├── mockProvider.ts
│   │       └── openSourceProviders.ts
│   ├── state/
│   │   └── ginkgo-store.tsx
│   ├── types/
│   │   ├── index.ts
│   │   └── ingest.ts
│   └── styles.css                       # Design system tokens
├── Pahang 2024/
│   └── Pahang_Semasa_2024.shp (+ .dbf, .prj, .shx, .cpg, .sbn, .sbx)
├── material/
│   ├── Draf RS Negeri Selangor 2035.pdf
│   └── RINGKASAN EKSEKUTIF RW CEKAL (BM).pdf
├── teamates/                            # NEVER DELETE — archived reference
│   ├── Plan-AI (nadi)/
│   ├── PLANVerse (tisya)/
│   └── change-detection-land-cover/
├── .env.example
├── .gitignore
├── README.md
├── system-context.md
├── ai.md
└── AGENTS.md
```

---

## SECTION 15 — DESIGN SYSTEM REFERENCE

### Colors (CSS custom properties in `src/styles.css`)
```css
/* Base surfaces */
--color-bg-base: #090A0C;         /* Jet Black — page background */
--color-bg-panel: #14161B;        /* Dark Zinc — card surfaces */
--color-bg-elevated: #1E2129;     /* Elevated panels */
--color-border: rgba(255,255,255,0.08);  /* Hairline borders */

/* Typography */
--color-text-primary: #F5F5F4;    /* Crisp white — headings */
--color-text-secondary: #9CA3AF;  /* Muted — body text */
--color-text-dim: #4B5563;        /* Dimmed — labels */

/* Functional severity (DATA only, never UI chrome) */
--color-emerald: #10B981;         /* Good / High Suitability */
--color-amber: #F59E0B;           /* Warning / Conditional */
--color-coral: #EF4444;           /* Risk / Flood Exposed */
--color-sky: #38BDF8;             /* Info / Livability */
--color-teal: #5EEAD4;            /* Active / Interactive accent */
```

### Typography
- **Primary font**: Inter (Google Fonts)
- **Monospace**: `font-mono` — all data labels, scores, codes, IDs
- **Letter spacing**: `tracking-widest` on all-caps labels
- **Tabular numbers**: `tabular-nums` on all numeric metrics

### Component Patterns
- All cards: `rounded border border-white/8 bg-[#14161B]`
- Active state: `bg-[#5EEAD4]/10 border-[#5EEAD4]/40 text-[#5EEAD4]`
- Buttons primary: cyan-teal border + background tint
- Buttons secondary: `bg-white/5 border-white/10`

---

## SECTION 16 — ENGINEERING PROGRESS LOG SUMMARY (ai.md Entries 1–16)

| Entry | Summary |
|---|---|
| 1 | Initial build: design system, domain types, mock data, AI/spatial services, all routes |
| 2 | Surgical UI/UX redesign — visual only, no API/prop renames |
| 3 | Dark operator console pivot, mission-control layout |
| 4 | Production satellite map, open-source AI support (Ollama, Groq, HuggingFace) |
| 5 | Complete navigation rail, header settings, dark route polish |
| 6 | Real Leaflet satellite engine, multi-spectral feature engine (NDVI/NDWI/NDBI) |
| 7 | Mission-Control split-screen layout, side-by-side satellite slider |
| 8 | Monochrome dark standard — purged all purple/violet |
| 9 | Full brand standardization to Ginkgo |
| 10 | Teammates' ML models (Nadi + Tisya + Siamese U-Net) consolidated into `backend/` |
| 11 | Comprehensive `system-context.md` — 5-tier architecture, 6-phase workflow, I/P/O |
| 12 | Feature freeze, statutory terminology polish |
| 13 | Dual-View Slider toolbar redesign, Planning Assessment doc, live raster ingestion |
| 14 | Master README.md overhaul |
| 15 | `.gitignore` security — API keys, Gemini credentials, Python environments |
| 16 | Ingest Imagery 4-state flow (`/ingest`): upload → preprocessing → dashboard → report |

---

## SECTION 17 — WHAT TO BUILD NEXT (RECOMMENDED PRIORITIES)

### Priority 1: Pahang GIS Shapefile → Live Leaflet Overlay
```
Goal: Load Pahang_Semasa_2024.shp as a live GeoJSON layer on the satellite map
Files to create:
  backend/services/gis_engine.py   # geopandas reads .shp, returns GeoJSON by bbox
  backend: GET /api/gis/zones?bbox=...
  src/components/map/SideBySideSlider.tsx: add [ 🗺️ Planning Zones ] toggle layer
Color coding: Hutan Simpan=#10B981, Pertanian=#F59E0B, Perumahan=#38BDF8
```

### Priority 2: Statutory Non-Compliance Alert Engine
```
Goal: Cross-reference official planned zones vs AI-detected land cover
Logic: if planned="Hutan Simpan" and detected="Urban" → flag as potential violation
Feed results into InterventionFeed.tsx priority alerts
Endpoint: POST /api/compliance/check
```

### Priority 3: OpenRouter AI Integration
```
Goal: Wire the AI Copilot to OpenRouter instead of direct Gemini API
File: src/services/ai/openrouterProvider.ts
Config: Read OPENROUTER_API_KEY from environment
Models: google/gemini-2.5-flash (primary), qwen/qwen-2.5-vl-72b-instruct (open-source)
Temperature: 0.0 for JSON/tool calls, 0.3 for conversational text
```

---

## SECTION 18 — PITCH STATEMENT FOR JUDGES

When explaining Ginkgo to judges, use this exact framing:

> "Ginkgo automatically identifies potential land-use inconsistencies between official PLANMalaysia planning zones and satellite-observed land cover. Our perception layer uses a **PyTorch Siamese Dual-Stream U-Net** for bi-temporal change heatmaps, a **7-feature Random Forest** using spectral indices for 5-class land cover segmentation, and **trained Scikit-Learn models** for hydrological flood inundation. Our cognitive interaction layer uses **Gemini 2.5 Flash or Qwen-VL (open-weights)** to translate those structured geospatial tensors into **Akta 172 planning recommendations** — producing traceable, explainable statutory assessment reports that a municipal planner can actually use."

---

*This document was generated on 2026-08-19. It reflects the system state after Entry 16 of ai.md.*
*If you are an AI assistant reading this — you now have full context. Proceed with confidence.*
