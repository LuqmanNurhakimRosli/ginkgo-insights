<div align="center">

# 🌿 GINKGO
### Enterprise Spatial Decision Intelligence & Land Analytics Platform
**"From satellite evidence to planning intelligence."**

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.8-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)

---

</div>

## 📌 1. Overview & Problem Statement

Conventional remote sensing platforms output pixel classifications (*"Pixel (420, 180) has 88% probability of being water"*). However, municipal planners and land authorities make statutory planning and policy decisions under frameworks like **Akta 172**.

**Ginkgo** is an enterprise-grade spatial decision intelligence platform that bridges this gap. It translates multi-spectral satellite perception ($\text{NDVI}, \text{NDWI}, \text{NDBI}$), PyTorch Siamese change detection, and hydrological flood simulations into **traceable, explainable, statutory planning assessments**.

---

## 🏛️ 2. The 3-Tier "Glass-Box" Intelligence Architecture

Ginkgo rejects black-box scoring in favor of a strict 3-tier traceability hierarchy:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: STATUTORY DECISION LAYER (The "What Must We Do?")                                              │
│ • Composite Livability Rating: 84 / 100                                                                │
│ • Statutory Assessment: "Suitable subject to mandatory on-site stormwater detention (OSD)"             │
│ • 1-Click Official Export: Executive Planning Report (PDF, JSON, GeoJSON)                              │
└───────────────────────────────────────────────────▲────────────────────────────────────────────────────┘
                                                    │ Synthesizes & Evaluates
┌───────────────────────────────────────────────────┴────────────────────────────────────────────────────┐
│ TIER 2: PLANNING INTELLIGENCE QUADRANTS (The "Why?")                                                   │
│ • 🌱 Environment (66/100) — Net NDVI canopy loss threshold & carbon retention balance                  │
│ • 🚀 Accessibility (91/100) — JKR arterial road network & transit ingress score                        │
│ • 🛡️ Disaster Resilience (88/100) — JPS 100-year flood zone buffer margin                              │
│ • 📈 Sustainability (85/100) — Akta 172 local structure plan compatibility                             │
└───────────────────────────────────────────────────▲────────────────────────────────────────────────────┘
                                                    │ Derived Mathematically from
┌───────────────────────────────────────────────────┴────────────────────────────────────────────────────┐
│ TIER 1: EMPIRICAL GEOSPATIAL EVIDENCE (Open-Source On-Device ML Perception)                            │
│ • PyTorch Siamese Dual-Stream U-Net: Pixel-level difference heatmap                                    │
│ • 5-Class Random Forest Classifier: Urban, Vegetation, Water, Bare Soil, Agriculture                   │
│ • Sentinel-2 Multi-Spectral Indices: NDVI (Canopy), NDWI (Water), NDBI (Built-Up)                      │
│ • Nadi Hydrological Flood Engine: Rainfall (mm/hr) × Soil Permeability × Elevation Profile             │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ 3. Key Feature Modules

### 🎛️ A. Mission-Control Canvas & Dual-View Slider
- **Sub-Pixel Comparison Slider**: Draggable comparison curtain comparing $T_1$ Baseline vs $T_2$ Observation with multi-spectral segmentation overlays.
- **Single-Line High-Density Toolbar**:
  - `[ 🎛️ Dual Slider ]`: Drag split-view comparison.
  - `[ 🌟 5-Class Land Cover ]`: Standardized multi-class segmentation (🔴 *Urban*, 🟢 *Vegetation*, 🔵 *Water*, 🟠 *Soil*, 🟡 *Agriculture*).
  - `[ 🔥 Change Heatmap ]`: PyTorch Siamese U-Net difference heatmap.
  - `[ 💧 Flood Hazard ]`: Inundation hazard vector boundary.
  - `[ 🌿 NDVI ]`: Vegetation canopy index overlay.
- **Preset Benchmark Scenes**: 1-click switcher between real Malaysian satellite scenes (*Presint 11 Putrajaya, Putra Heights Flood Corridor, Sungai Buah Basin, Sri Damai Reserve*).

### 📑 B. Executive Planning Assessment (Statutory Report Export)
- **Municipal Cadastral Header**: Official Document ID (`DOC: GNK-2026-LOT4829`), Verified Status, and Parcel Hectarage.
- **Multi-Criteria Compliance Matrix Table**: Detailed score breakdown across Environmental, Road Ingress, Flood Resilience, and Land Compatibility dimensions.
- **Statutory Planning Directives**: Specific guidance on On-Site Stormwater Detention (OSD) under MSMA 2nd Edition and $10\%$ public open space preservation under Akta 172 Section 21B.
- **Real Working Downloads**:
  - `[ 📥 PDF Report ]` $\rightarrow$ Generates and downloads a complete formatted statutory assessment document.
  - `[ 📥 JSON Data ]` $\rightarrow$ Downloads machine-readable telemetry and compliance score payload.
  - `[ 📥 GeoJSON ]` $\rightarrow$ Downloads standard GeoJSON vector boundaries of the parcel and risk zones.

### 🧪 C. Interactive Scenario Simulator (What-If)
- **Rezoning & Density Modeling**: Test real-time plot ratio density changes ($20\% - 95\%$) with instantaneous runoff surge ($+18.4\%$) and peak traffic ingress ($+220\text{ veh/hr}$) projections.
- **Hydrological Flood Engine**: Adjust monsoon rainfall influx ($50 - 300\text{ mm/hr}$), soil permeability (Loam, Clay, Sand), and elevation buffer offsets running Nadi's Decision Tree/Random Forest models.

### 📤 D. End-to-End Satellite Imagery Ingestion
- **Live Canvas Ingestion**: Drop a custom GeoTIFF, PNG, or JPEG to immediately load the satellite scene onto the live map observation canvas.
- **Instant Preset Cards**: 3 built-in benchmark satellite cards (*Putra Heights Satellite Scene, Sungai Buah Floodplain, Alpine River Valley*) for instant demonstration.
- **Live Status Feedback**: Active indicator pill `[ Custom Scene Active · ✕ Reset ]` in the toolbar.

### 🤖 E. Multi-Provider AI Spatial Copilot
- Conversational planning assistant with spatial context injection and tool-calling capabilities.
- Supports **Google Gemini 2.0 Flash**, **Local Ollama (Llama 3 via Docker)**, and **Groq** acceleration.

---

## 🛠️ 4. Technology Stack & Architecture

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | **TanStack Start v1 + React 19** | Type-safe routing, server-side rendering, sub-second client transitions |
| **Styling & Theme** | **Tailwind CSS v4 (Monochrome Dark Console)** | High-density Jet Black (`#090A0C`) / Dark Zinc (`#14161B`) enterprise aesthetic |
| **Geospatial Engine** | **Leaflet + Esri World Imagery + Sentinel-2** | Sub-pixel tile composite mapping and vector layer rendering |
| **Backend Microservice** | **Python FastAPI (`backend/main.py`)** | REST API endpoints on `http://localhost:8000` |
| **Deep Learning** | **PyTorch Siamese Dual-Stream U-Net** | Bi-temporal feature extraction and change intensity heatmaps |
| **Land Cover ML** | **Scikit-Learn Random Forest (7 Features)** | 5-Class pixel segmentation on $[R, G, B, \text{NDVI}, \text{NDWI}, \text{NDBI}, \text{Brightness}]$ |
| **Flood Modeling** | **Nadi's RF / DT / HistGradientBoosting** | Hydrological inundation and terrain runoff simulations |

---

## 🚀 5. Quickstart & Installation

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+ (for backend microservice)

### Step 1: Clone Repository & Install Frontend
```bash
git clone https://github.com/LuqmanNurhakimRosli/ginkgo-insights.git
cd ginkgo-insights

# Install Node dependencies
npm install

# Start frontend development server (Port 8080)
npm run dev
```
Open **`http://localhost:8080/`** in your browser.

### Step 2: (Optional) Run Unified Python Backend
```bash
cd backend

# Install Python ML dependencies
pip install -r requirements.txt

# Start FastAPI server (Port 8000)
python main.py
```

> **Note**: Ginkgo features a built-in decoupled client adapter. If the Python backend is not running, the frontend automatically falls back to on-device pre-computed simulations without breaking!

---

## 📁 6. Repository Directory Structure

```
c:\Users\Luqman Nurhakim\Desktop\Projects\Hackathon-2026\PlanAI\
├── backend/
│   ├── main.py                         # Unified FastAPI microservice (Port 8000)
│   ├── requirements.txt                # Python dependencies
│   ├── train_model.py                  # Model training and validation script
│   ├── models/                         # Trained ML Models (.pkl)
│   │   ├── flood_rf_model.pkl          # Random Forest Flood Classifier
│   │   ├── flood_dt_model.pkl          # Decision Tree Flood Classifier
│   │   ├── flood_hgb_model.pkl         # HistGradientBoosting Flood Classifier
│   │   └── flood_lr_model.pkl          # Logistic Regression Baseline
│   ├── samples/                        # Benchmark Satellite Scenes (PNG/TIFF)
│   ├── model/                          # Deep Learning Architectures
│   │   ├── unet_change_detection.py    # PyTorch Siamese Dual-Stream U-Net
│   │   └── land_cover_classifier.py    # 5-Class Random Forest (7-features)
│   ├── services/                       # Core Analytics Services
│   │   ├── flood_engine.py             # Hydrological Flood Engine
│   │   ├── spatial_engine.py           # Optical Band & Spectral Index Differencing
│   │   └── copilot_engine.py           # LLM Spatial Reasoning Copilot
│   └── utils/                          # Raster Processing & Analytics
│       ├── raster_processor.py         # Transition Matrix & Severity Metrics
│       └── synthetic_data_generator.py # Scenario Generator
├── src/
│   ├── routes/
│   │   ├── index.tsx                   # Ginkgo Mission Control Dashboard
│   │   └── __root.tsx                  # Root Layout & Metadata
│   ├── components/
│   │   ├── map/
│   │   │   ├── SideBySideSlider.tsx    # Multi-Layer Draggable Comparison Slider
│   │   │   └── SatelliteMap.tsx        # Leaflet Satellite Map Engine
│   │   ├── dashboard/
│   │   │   ├── LivabilityQuadrant.tsx  # 4-Quadrant Sustainability Indicator Card
│   │   │   └── InterventionFeed.tsx    # StreamGuard Priority Incident Feed
│   │   ├── upload/
│   │   │   └── RasterUploadModal.tsx   # Custom GeoTIFF / Scene Dropzone Modal
│   │   └── ai/
│   │       ├── AIDock.tsx              # Floating Spatial Planning Copilot Dock
│   │       └── AIMessageBubble.tsx     # AI Message Bubbles with Evidence Disclosures
│   ├── services/
│   │   ├── spatial.ts                  # REST API Bridge to Backend + Client Fallback
│   │   └── ai/                         # Multi-Provider AI Routing (Gemini / Ollama / Groq)
│   ├── state/
│   │   └── ginkgo-store.tsx            # Global Application State Management
│   ├── styles.css                      # Monochrome Dark Enterprise Design System Tokens
│   └── types/index.ts                  # TypeScript Domain Types
├── system-context.md                   # Complete Technical Architecture & I/P/O Reference
├── ai.md                               # Sequential Engineering Progress Log
└── AGENTS.md                           # Operating Guidelines & Design Standards
```

---

## 🏆 7. Hackathon Alignment & Methodology

Ginkgo was built for the **PLAN-AI Hackathon 2026 (Track B — Geospatial & Satellite AI Challenge)**:
- **Organizers & Stakeholders**: PLANMalaysia, Lembaga Perancang Bandar Malaysia (LPBM), Malaysian Institute of Planners (MIP), and UZMA.
- **Focus**: AI for Smart, Inclusive, and Resilient Town Planning (*AI untuk Perancangan Pintar, Inklusif dan Mampan*).
- **Statutory Alignment**: Evaluates land parcels against **Akta Perancangan Bandar dan Desa 1976 (Akta 172)** and **MSMA 2nd Edition Urban Stormwater Management**.

---

<div align="center">

**Ginkgo — Built with Precision for Sustainable Urban Futures.**

</div>
