# Ginkgo — Enterprise Spatial Intelligence & Land Analytics Platform
## System Context, Technical Architecture & End-to-End Workflow Specification

---

## 1. Executive Summary & Problem Framing

### 1.1 The Planning Intelligence Gap
Conventional remote sensing and geospatial AI platforms suffer from a fundamental disconnect: **they output pixel classifications, but town planners, municipal authorities, and land developers make policy and spatial allocation decisions**. 

A model that outputs *"Pixel (420, 180) has 88% probability of being water"* answers a computer vision question, but fails to answer municipal planning questions such as:
- *Is this parcel compliant with national statutory planning guidelines (Akta 172)?*
- *What is the downstream hydrological impact if this green canopy is rezoned to commercial density?*
- *What compensatory on-site stormwater retention (OSD) or green space offsets are legally required?*

### 1.2 Ginkgo's Solution
**Ginkgo** is an enterprise-grade spatial decision intelligence platform. It bridges raw multi-spectral satellite imagery and deterministic planning rules by translating bi-temporal satellite perception ($\text{NDVI}, \text{NDWI}, \text{NDBI}$) and multi-model machine learning inferences into **explainable, statutory spatial recommendations**.

---

## 2. Technical Architecture & Tech Stack

Ginkgo operates on a **5-Tier Decoupled Architecture**:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: CLIENT PRESENTATION & HUD (TanStack Start v1 · React 19 · Tailwind v4 · Leaflet)               │
│ • Split-Screen Layout: 62% Left Spatial Canvas / Slider  |  38% Right Intelligence HUD                │
│ • Draggable Dual-View Satellite Comparison Slider (Sub-pixel bi-temporal curtain)                      │
│ • Multi-Layer Visualizer (5-Class Land Cover, PyTorch Siamese Change Heatmap, Flood Inundation)        │
│ • Interactive Scenario Simulator (Plot ratio density & Nadi's Hydrological Flood Engine)               │
│ • Floating Conversational AI Planning Copilot (Context-injected spatial reasoning)                     │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │ REST API Bridge (src/services/spatial.ts)
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: UNIFIED PYTHON FASTAPI BACKEND MICROSERVICE (`backend/main.py` on Port 8000)                   │
│ • Endpoint Router: /api/predict/temporal, /api/predict/flood, /api/scenarios, /api/report, /api/health │
│ • Image Preprocessing & Base64 Raster Normalization (OpenCV, PIL, NumPy)                               │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │ Pipeline Dispatch
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: MULTI-MODEL MACHINE LEARNING & DEEP LEARNING ENGINES                                           │
│ ┌──────────────────────────────────────┬─────────────────────────────────────────────────────────────┐ │
│ │ A. PyTorch Siamese Dual-Stream U-Net │ B. 5-Class Random Forest Land Cover Classifier              │ │
│ │ • Weight-shared dual encoders        │ • 7-Feature Vector: [R, G, B, NDVI, NDWI, NDBI, Brightness]   │ │
│ │ • Multi-scale feature difference map │ • Standardized classes: Urban, Veg, Water, Soil, Agri       │ │
│ ├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤ │
│ │ C. Nadi's Hydrological Flood Engine  │ D. Tisya's Spectral Index Engine                            │ │
│ │ • Random Forest / Decision Tree / HGB│ • Synthetic Optical Band Extraction (NIR, SWIR)             │ │
│ │ • Elevation profile & proximity decay│ • Bi-temporal Differencing (ΔNDVI, ΔNDWI, ΔNDBI)            │ │
│ └──────────────────────────────────────┴─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │ Raw Metrics & Masks
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 4: DETERMINISTIC GIS CONSTRAINTS & STATUTORY PLANNING ENGINE                                      │
│ • Drainage buffer exclusion (>100m from floodways)                                                     │
│ • Slope gradient thresholds (<15° for stable development)                                              │
│ • Arterial transit accessibility score (>70 for mixed/commercial zoning)                               │
│ • Statutory Policy Compliance Validation (Akta 172 / MSMA 2nd Edition Stormwater Requirements)         │
└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                    │ Planning Context
                                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 5: AI REASONING & MULTI-PROVIDER COPILOT BACKEND                                                  │
│ • Cloud Spatial Reasoning: Google Gemini 2.0 Flash (with active town planning system prompt)           │
│ • Local / Edge Inference: Ollama Local Llama 3 via Docker & Groq Open LLM Acceleration                 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. End-to-End Workflow: Perception to Decision

The Ginkgo spatial intelligence pipeline processes data through 6 sequential phases:

```
[1. INGESTION]          [2. EXTRACTION]         [3. ML INFERENCE]       [4. TRANSITION]        [5. EVALUATION]         [6. DELIVERY]
Raw Sentinel-2   ───►   Compute Spectral  ───►  Siamese U-Net   ───►   Area Matrix     ───►   Statutory Rules  ───►   Mission HUD &
Rasters (T1/T2)         Indices (NDVI,          & 5-Class RF           Calculation            & Livability            Interactive PDF
or User GeoTIFF         NDWI, NDBI)             Classification         (ha / km²)             Quadrant Scoring        Report Export
```

### Phase 1: Satellite Raster Ingestion
- **Inputs**: Bi-temporal Sentinel-2 L2A optical rasters ($T_1$ Baseline vs $T_2$ Observation), Esri World Imagery composites, or user-uploaded GeoTIFF/PNG/JPEG files.
- **Normalization**: Resized and scaled to normalized floating point tensors $[0, 1]$ with dimension constraints for real-time sub-second inference.

### Phase 2: Remote Sensing Spectral Index Extraction
Computes standard remote sensing indices to resolve spectral ambiguity between vegetation and water:
1. **Normalized Difference Vegetation Index (NDVI)**:
   $$\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red} + \epsilon}$$
   *(High values $\rightarrow$ dense forest canopy; Low/negative values $\rightarrow$ built-up/water)*
2. **Normalized Difference Water Index (NDWI)**:
   $$\text{NDWI} = \frac{\text{Green} - \text{NIR}}{\text{Green} + \text{NIR} + \epsilon}$$
   *(High values $\rightarrow$ open water bodies & flood inundation; Low values $\rightarrow$ dry soil/urban)*
3. **Normalized Difference Built-up Index (NDBI)**:
   $$\text{NDBI} = \frac{\text{SWIR} - \text{NIR}}{\text{SWIR} + \text{NIR} + \epsilon}$$
   *(High values $\rightarrow$ concrete, asphalt, and structural development)*

### Phase 3: Multi-Model Machine Learning Inference
1. **PyTorch Siamese Dual-Stream U-Net**:
   - Ingests $T_1$ and $T_2$ into shared-weight convolutional encoders.
   - Extracts feature difference tensors $|\mathbf{F}_{T_1}^{(l)} - \mathbf{F}_{T_2}^{(l)}|$ across 4 multi-scale bottleneck stages.
   - Decodes a continuous pixel-wise **Change Intensity Heatmap** ($0.0$ = unchanged, $1.0$ = severe structural transformation).
2. **5-Class Random Forest Classifier**:
   - Classifies every pixel across a 7-dimensional feature space: $[\text{Red}, \text{Green}, \text{Blue}, \text{NDVI}, \text{NDWI}, \text{NDBI}, \text{Brightness}]$.
   - Outputs segmented class masks:
     - 🔴 `Class 0: Urban / Built-up` (`#DC3545`)
     - 🟢 `Class 1: Vegetation / Forest` (`#28A745`)
     - 🔵 `Class 2: Water Bodies` (`#007BFF`)
     - 🟠 `Class 3: Bare Soil / Rock` (`#EE9B00`)
     - 🟡 `Class 4: Agricultural Land` (`#9BCE00`)
3. **Nadi's Hydrological Flood Engine**:
   - Ingests satellite terrain, rainfall rate ($0–300\text{ mm/hr}$), soil infiltration rate (clay/loam/sand), and elevation offsets.
   - Executes Decision Tree / Random Forest / HistGradientBoosting classifiers to predict inundation extent and flood depth.

### Phase 4: Land Transition Matrix & Quantified Area Analytics
- Cross-tabulates $T_1 \rightarrow T_2$ class migrations to generate quantitative transition tables:
  - Total hectarage converted from *Vegetation $\rightarrow$ Urban*.
  - Total hectarage converted from *Bare Soil $\rightarrow$ Built-up*.
  - Net change percentage and severity breakdown (Low, Medium, High, Extreme).

### Phase 5: Deterministic GIS & Statutory Evaluation
- Computes the composite **Livability Index ($0–100$)** across 4 sustainability quadrants:
  1. `🌱 Environment (NDVI canopy retention)`
  2. `🚀 Accessibility (JKR road network connectivity)`
  3. `🛡️ Resilience (JPS 100-year flood zone buffer)`
  4. `📈 Sustainability (Akta 172 zoning compatibility)`

### Phase 6: Mission Control Delivery & AI Decision Support
- Live rendering on the **Dual-View Slider** and **Mission Control Intelligence HUD**.
- Spatial Copilot reasons over the findings with grounding citations.
- Instant 1-click export of official assessment reports in **PDF, JSON, and GeoJSON**.

---

## 4. Input / Process / Output (I/P/O) Specifications by Module

### Module A: Bi-Temporal Change Detection & Land Cover (`/api/predict/temporal`)
| Dimension | Specification |
|---|---|
| **Inputs** | • `t1_b64` (Base64 encoded PNG of baseline satellite scene)<br/>• `t2_b64` (Base64 encoded PNG of observation scene)<br/>• `scenario` (Optional preset: `urban_sprawl`, `deforestation`, `flood_drought`) |
| **Process** | 1. Decode & normalize rasters into NumPy arrays.<br/>2. Extract 7-feature pixel matrix ($R, G, B, \text{NDVI}, \text{NDWI}, \text{NDBI}, \text{Brightness}$).<br/>3. Execute Siamese U-Net encoder difference fusion.<br/>4. Execute Random Forest 5-class classification on $T_1$ and $T_2$.<br/>5. Calculate transition matrix (pixels, hectares, percentages). |
| **Outputs** | • `images`: Base64 PNGs of $T_1$ RGB, $T_2$ RGB, $T_1$ Land Cover Mask, $T_2$ Land Cover Mask, Change Heatmap, NDVI, NDWI.<br/>• `stats`: Mean change intensity, severity breakdown, transition matrix, top class migrations, net change %. |

---

### Module B: Hydrological Flood Inundation Engine (`/api/predict/flood`)
| Dimension | Specification |
|---|---|
| **Inputs** | • `file` (Multipart satellite image file) OR `sample_key` (`river_delta`, `putra_heights_sat`, etc.)<br/>• `rainfall` ($50.0 - 300.0\text{ mm/hr}$)<br/>• `soil_type` (`clay`, `loam`, `sand`)<br/>• `elevation_offset` ($-50.0\text{m} - +50.0\text{m}$)<br/>• `model_type` (`random_forest`, `decision_tree`, `gradient_boosting`) |
| **Process** | 1. Water body segmentation via HSV / NDWI.<br/>2. Simulate topological elevation profile from grayscale intensity and river proximity.<br/>3. Apply soil permeability runoff coefficients ($C_{\text{clay}} = 0.85$, $C_{\text{loam}} = 0.50$, $C_{\text{sand}} = 0.20$).<br/>4. Execute ML classification (RF/DT/HGB) to predict inundated pixels.<br/>5. Compute flood depth matrix and hazard rating. |
| **Outputs** | • `original_b64`: Normalized input satellite image.<br/>• `flood_b64`: Inundation overlay graphic.<br/>• `depth_b64`: Colorized flood depth heatmap.<br/>• `stats`: Inundated pixel count, percentage of parcel inundated, mean depth, hazard level (`Low`, `Moderate`, `Severe`, `Catastrophic`). |

---

### Module C: Interactive Scenario Simulator (What-If)
| Dimension | Specification |
|---|---|
| **Inputs** | • Proposed Zoning (`Commercial High-Density`, `Affordable Housing`, `Industrial Logistics`, `Canopy Conservation`)<br/>• Plot Ratio / Density Slider ($20\% - 95\%$) |
| **Process** | 1. Calculates impervious surface expansion from plot ratio delta.<br/>2. Applies Rational Formula for stormwater runoff: $Q = C \cdot I \cdot A$.<br/>3. Projects peak hourly vehicle trip generation based on land use trip rate indices.<br/>4. Computes tree canopy loss percentage and triggers Akta 172 green space offset rules. |
| **Outputs** | • Projected Livability Score ($0–100$).<br/>• Runoff & drainage surge percentage ($+18.4\%$).<br/>• Peak traffic ingress ($+220\text{ veh/hr}$).<br/>• Retained canopy percentage ($32.0\%$).<br/>• Statutory Planning Condition recommendation. |

---

### Module D: Conversational Spatial Copilot
| Dimension | Specification |
|---|---|
| **Inputs** | • User query string (e.g. *"Evaluate flood risk for Presint 11 if density increases to 80%"*).<br/>• Spatial context injection (Selected site, livability scores, active spectral layers, simulation output). |
| **Process** | 1. Context assembler injects current parcel coordinates, suitability scores, and statutory rules into the prompt.<br/>2. Dispatches to selected model provider (Google Gemini 2.0 Flash or local Ollama/Groq).<br/>3. Formats response with explicit reasoning disclosures, evidence points, and actionable planning recommendations. |
| **Outputs** | • Formatted Markdown response with structured evidence bullet points, recommended statutory mitigations, and clickable tool badges. |

---

## 5. Administrative Study Sectors & Reference Parcels

| Sector ID | Sector Name | Locality | Coordinates | Dominant Land Use | Livability | Flood Risk | Road Access |
|---|---|---|---|---|---|---|---|
| `site-a` | **Presint 11 Sector** | Putrajaya Central District | $2.9264^\circ\text{N}, 101.6964^\circ\text{E}$ | Residential / Mixed | $84/100$ | Moderate | Very Good |
| `site-b` | **Presint 14 Transit Hub** | Putrajaya East Corridor | $2.9350^\circ\text{N}, 101.7060^\circ\text{E}$ | Commercial Transit | $79/100$ | Low | Excellent |
| `site-c` | **Sungai Buah Basin** | Hulu Langat Hydrological Sector | $3.0180^\circ\text{N}, 101.8640^\circ\text{E}$ | Floodplain Buffer | $61/100$ | High | Moderate |
| `site-d` | **Sri Damai Reserve** | Hulu Langat Forestry Zone | $3.0350^\circ\text{N}, 101.8800^\circ\text{E}$ | Canopy Conservation | $54/100$ | Moderate | Limited |

---

## 6. Directory Structure & Key Files

```
c:\Users\Luqman Nurhakim\Desktop\Projects\Hackathon-2026\PlanAI\
├── backend/
│   ├── main.py                         # Unified FastAPI microservice (Port 8000)
│   ├── requirements.txt                # Python backend dependencies
│   ├── train_model.py                  # Model training and validation script
│   ├── models/                         # Trained Pickled ML Classifiers
│   │   ├── flood_rf_model.pkl          # Random Forest Flood Classifier
│   │   ├── flood_dt_model.pkl          # Decision Tree Flood Classifier
│   │   ├── flood_hgb_model.pkl         # HistGradientBoosting Flood Classifier
│   │   └── flood_lr_model.pkl          # Logistic Regression Baseline
│   ├── samples/                        # Benchmark Satellite Scenes
│   │   ├── river_delta.png             # Coastal Winding River Delta
│   │   ├── mountain_valley.png         # Alpine Mountain River Valley
│   │   ├── putra_heights_map.png       # Putra Heights Vector Road Map
│   │   ├── putra_heights_sat.png       # Putra Heights High-Res Satellite Scene
│   │   └── agricultural_plains.png     # Flat Valley Crop Fields & Retention Canals
│   ├── model/                          # Deep Learning Architectures
│   │   ├── unet_change_detection.py    # PyTorch Siamese Dual-Stream U-Net
│   │   └── land_cover_classifier.py    # 5-Class Random Forest & Gradient Boosting
│   ├── services/                       # Core Analytics Services
│   │   ├── flood_engine.py             # Hydrological Flood Simulation Pipeline
│   │   ├── spatial_engine.py           # Optical Band Extraction & Temporal Differencing
│   │   └── copilot_engine.py           # LLM Spatial Copilot Engine
│   └── utils/                          # Raster Processing & Analytics
│       ├── raster_processor.py         # Transition Matrix & Severity Metrics
│       └── synthetic_data_generator.py # Synthetic Multi-Temporal Scenario Generator
├── src/
│   ├── routes/
│   │   ├── index.tsx                   # Mission-Control Planning Dashboard
│   │   └── __root.tsx                  # Root Application Layout & Global Error Boundaries
│   ├── components/
│   │   ├── map/
│   │   │   ├── SideBySideSlider.tsx    # Multi-Layer Draggable Comparison Slider
│   │   │   └── SatelliteMap.tsx        # Leaflet Satellite Map with Esri World Imagery
│   │   ├── dashboard/
│   │   │   ├── LivabilityQuadrant.tsx  # 4-Quadrant Sustainability Indicator Card
│   │   │   └── InterventionFeed.tsx    # Priority Spatial Alert & Incident Feed
│   │   ├── upload/
│   │   │   └── RasterUploadModal.tsx   # Custom GeoTIFF / Satellite Dropzone Modal
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
├── system-context.md                   # System Architecture & Workflow Reference
├── ai.md                               # Sequential Engineering Progress Log
└── AGENTS.md                           # Operating Guidelines & Design Standards
```
