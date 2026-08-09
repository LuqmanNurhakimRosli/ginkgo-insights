# Ginkgo — System Context & Feature Documentation

Ginkgo is a mission-control AI spatial intelligence platform: temporal satellite change detection, explainable livability scoring, development suitability screening, open-source AI model delivery, and an AI planning copilot that acts bidirectionally on the map.

## Tech Stack

- **Framework**: TanStack Start v1 (React 19, file-based routing in `src/routes`), Vite 8
- **Styling**: Tailwind CSS v4, CSS-first dark operator console theme in `src/styles.css`
- **Icons & Visuals**: lucide-react (fine stroke 1.25px line icons), custom SVG vector GIS map engine + realistic satellite raster tile rendering
- **AI Integrations**: Open-Source AI delivery models (**Ollama Local Llama 3 via Docker**, **Groq Open LLM Acceleration**, **HuggingFace Sentinel-2 Classifier**), **Mock Provider**, and **Google Gemini**
- **State Management**: Zustand / React Context (`src/state/ginkgo-store.tsx`) managing shared spatial state, camera center/zoom, active layers, highlighted features, and parcel context

## Complete System Route Directory

| Icon | Route | View Name | Key Features |
| --- | --- | --- | --- |
| 🎯 | `/` | **COMMAND** | Map-first hero canvas with satellite raster basemap & Sentinel-2 RGB textures; floating mode switcher; selected parcel HUD card; bottom KPI strip |
| 🗺️ | `/analysis` | **ANALYSIS** | Interactive spatial workspace with layers, land-use breakdown, and KPI cards |
| ⏱️ | `/change-detection` | **CHANGE** | Side-by-side & swipe temporal change comparison (2023 vs 2025), built-up/vegetation delta, patch classifications |
| 📈 | `/livability` | **INTELLIGENCE** | 1.5px stroke `ScoreDial` circular gauge, 5-dimension progress bars, arrow evidence callouts (`↗` / `↘`), supporting map inset, comparison grid |
| 🛡️ | `/planning` | **SUITABILITY** | Multi-criteria development suitability screening, transparent criteria weighting matrix, candidate parcel highlighting |
| ✨ | `/ai-copilot` | **COPILOT** | Full-screen agent workspace: 480px conversation history with System Instruction Guide & Prompt Presets; live map canvas right |
| 📄 | `/reports` | **REPORTS** | Complete structured assessment reports assembled from all spatial modules with PDF/JSON/GeoJSON export actions |
| 🗄️ | `/data` | **DATA** | Palantir-style dense data terminal: dataset category sub-rail, raw vs processed data tags, system IDs (`DS-SAT-0223`, `RPT-SITE-A`) |
| ⚙️ | `/settings` | **SETTINGS** | System management console & header modal: AI model provider switcher, study area selector, criteria weight sliders, layer defaults |
| ❓ | `/help` | **HELP** | Methodology documentation, open-source AI reasoning guide, transparent formulas, and disclaimer notes |

## Key Design System Tokens

- **Palette**: Near-black `#0B0C0E` background, `#16171A` dark glass panel surface, 1px hairline borders (`rgba(255, 255, 255, 0.08)`).
- **Typography**: Geometric sans-serif (Inter), ALL-CAPS with wide letter tracking (`letter-spacing: 0.08em–0.12em`) on UI chrome, sentence case inside AI Copilot messages.
- **Heatmap Data Severity Scale**: `#22C55E` (good), `#EAB308` (moderate), `#F97316` (elevated), `#EF4444` (high risk) — reserved strictly for data value judgments.
- **Selection Accent**: Cool cyan-teal `#5EEAD4` — reserved strictly for UI active state, left rail markers, selection outlines, and AI status indicators.
- **Header Settings Modal**: Interactive modal accessible via `⚙️ SETTINGS` button in top header for quick model and location management.
