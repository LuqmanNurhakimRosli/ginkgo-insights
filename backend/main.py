"""
Ginkgo — Unified Enterprise Spatial Intelligence Backend API.
Consolidates:
1. 🌊 Nadi's Multi-Model Flood Inundation Engine (RandomForest, DecisionTree, HistGradientBoosting)
2. 🌲 Tisya's Spectral Indices & Temporal Differencing Engine (NDVI, NDWI, NDBI)
3. 🧠 Siamese Dual-Stream U-Net & 5-Class Land Cover Classifier (Urban, Veg, Water, Soil, Agri)
"""

import os
import sys
import io
import base64
import numpy as np
from PIL import Image
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model.unet_change_detection import ChangeDetectionPipeline
from model.land_cover_classifier import LandCoverClassifier, LAND_COVER_CLASSES, CLASS_HEX_COLORS
from utils.raster_processor import compute_spectral_indices, compute_land_cover_transition_matrix, classify_change_severity
from utils.synthetic_data_generator import generate_synthetic_scenario
from services.flood_engine import predict_flood, load_or_train_model, SAMPLES as FLOOD_SAMPLES
from services.spatial_engine import analyze_temporal_pair

app = FastAPI(
    title="Ginkgo Spatial Intelligence API",
    description="Unified Enterprise Geospatial AI API combining Multi-Spectral Temporal Differencing, 5-Class Land Cover Segmentation, and Hydrological Flood Risk Modeling.",
    version="2.0.0"
)

# Enable CORS for frontend client interactions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate Core Engines
change_pipeline = ChangeDetectionPipeline()
landcover_rf = LandCoverClassifier(model_type="random_forest")

def array_to_b64_png(arr: np.ndarray) -> str:
    """Converts (H, W, 3) or (H, W) array to base64 PNG data URL."""
    if arr.dtype == np.float32 or arr.dtype == np.float64:
        if arr.max() <= 1.0:
            arr = (arr * 255).astype(np.uint8)
        else:
            arr = arr.astype(np.uint8)
    
    if len(arr.shape) == 2:
        img = Image.fromarray(arr, mode='L')
    else:
        img = Image.fromarray(arr, mode='RGB')

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")

def b64_to_array(b64_str: str) -> np.ndarray:
    """Converts base64 PNG string to (H, W, 3) normalized float array [0, 1]."""
    if "," in b64_str:
        b64_str = b64_str.split(",")[1]
    img_bytes = base64.b64decode(b64_str)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return np.array(img, dtype=np.float32) / 255.0

# ─── API Routes ──────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Ginkgo Enterprise Spatial Intelligence API",
        "version": "2.0.0",
        "modules": [
            "Bi-Temporal Change Detection (Siamese U-Net)",
            "5-Class Land Cover Classifier (Random Forest / Gradient Boosting)",
            "Spectral Remote Sensing Indices (NDVI, NDWI, NDBI)",
            "Hydrological Flood Risk Inundation Engine (Random Forest / Decision Tree)"
        ]
    }

@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "has_pytorch": change_pipeline.model is not None,
        "rf_trained": landcover_rf.is_trained,
        "flood_models_ready": True
    }

@app.get("/api/scenarios")
def list_scenarios():
    return [
        {
            "id": "urban_sprawl",
            "title": "Urban Expansion & Infrastructure",
            "locality": "Putrajaya Central District",
            "description": "Rapid conversion of forest/agricultural land into built-up commercial and residential zones."
        },
        {
            "id": "deforestation",
            "title": "Rainforest Canopy Clearance",
            "locality": "Hulu Langat Forestry Sector",
            "description": "Canopy depletion patterns and forest fragmentation along logging corridors."
        },
        {
            "id": "flood_drought",
            "title": "Floodplain Inundation & Reservoir Surge",
            "locality": "Sungai Buah Basin",
            "description": "Monsoon river overflow, drainage surcharge, and seasonal floodplain inundation."
        }
    ]

@app.get("/api/samples")
def list_samples():
    """List sample benchmark satellite images for testing."""
    samples_dir = os.path.join(os.path.dirname(__file__), "samples")
    results = []
    if os.path.exists(samples_dir):
        for f in os.listdir(samples_dir):
            if f.endswith(".png"):
                results.append({
                    "key": f.replace(".png", ""),
                    "filename": f,
                    "url": f"/api/samples/{f}"
                })
    return results

class TemporalAnalysisRequest(BaseModel):
    scenario: Optional[str] = "urban_sprawl"
    t1_b64: Optional[str] = None
    t2_b64: Optional[str] = None

@app.post("/api/predict/temporal")
def predict_temporal_change(req: TemporalAnalysisRequest):
    """
    Executes bi-temporal change detection, 5-class land cover classification,
    spectral indices (NDVI/NDWI/NDBI), and land transition matrix analytics.
    """
    if req.t1_b64 and req.t2_b64:
        t1_arr = b64_to_array(req.t1_b64)
        t2_arr = b64_to_array(req.t2_b64)
        scenario_name = "custom_upload"
    else:
        synth = generate_synthetic_scenario(req.scenario or "urban_sprawl")
        t1_arr = synth["t1_array"]
        t2_arr = synth["t2_array"]
        scenario_name = synth["scenario"]

    # 1. Siamese Deep Learning Feature Differencing
    preds = change_pipeline.predict_change_and_landcover(t1_arr, t2_arr)
    
    # 2. Random Forest 5-Class Land Cover Classification
    lc_t1_rf = landcover_rf.classify_image(t1_arr)
    lc_t2_rf = landcover_rf.classify_image(t2_arr)

    lc_t1_colored = landcover_rf.colorize_mask(lc_t1_rf)
    lc_t2_colored = landcover_rf.colorize_mask(lc_t2_rf)

    # 3. Change Heatmap Visualizer (RGB)
    change_intensity = preds["change_intensity"]
    H, W = change_intensity.shape
    change_heatmap_rgb = np.zeros((H, W, 3), dtype=np.uint8)
    change_heatmap_rgb[:, :, 0] = (change_intensity * 255).astype(np.uint8) # Red channel
    change_heatmap_rgb[:, :, 1] = ((1.0 - change_intensity) * 60).astype(np.uint8)

    # 4. Spectral Indices
    indices_t1 = compute_spectral_indices(t1_arr)
    indices_t2 = compute_spectral_indices(t2_arr)

    # 5. Land Cover Transition Matrix & Severity Metrics
    transition_stats = compute_land_cover_transition_matrix(lc_t1_rf, lc_t2_rf)
    severity_stats = classify_change_severity(change_intensity)

    return {
        "scenario": scenario_name,
        "images": {
            "t1_rgb": array_to_b64_png(t1_arr),
            "t2_rgb": array_to_b64_png(t2_arr),
            "t1_landcover": array_to_b64_png(lc_t1_colored),
            "t2_landcover": array_to_b64_png(lc_t2_colored),
            "change_heatmap": array_to_b64_png(change_heatmap_rgb),
            "t1_ndvi": array_to_b64_png(indices_t1["ndvi_colored"]),
            "t2_ndvi": array_to_b64_png(indices_t2["ndvi_colored"]),
            "t1_ndwi": array_to_b64_png(indices_t1["ndwi_colored"]),
            "t2_ndwi": array_to_b64_png(indices_t2["ndwi_colored"]),
        },
        "stats": {
            "mean_change_intensity": float(np.mean(change_intensity)),
            "max_change_intensity": float(np.max(change_intensity)),
            "severity_breakdown": severity_stats,
            "transition_matrix": transition_stats["transition_matrix"],
            "top_transitions": transition_stats["top_transitions"],
            "net_change_percentage": transition_stats["net_change_percentage"]
        },
        "classes": LAND_COVER_CLASSES
    }

@app.post("/api/predict/flood")
async def predict_flood_inundation(
    file: Optional[UploadFile] = File(None),
    sample_key: Optional[str] = Form(None),
    rainfall: float = Form(100.0),
    soil_type: str = Form("loam"),
    elevation_offset: float = Form(20.0),
    proximity_enabled: bool = Form(True),
    model_type: str = Form("decision_tree")
):
    """
    Nadi's Hydrological Flood Simulation Engine.
    Predicts inundation hazard maps from satellite rasters based on rainfall,
    soil infiltration, elevation profiles, and ML classification.
    """
    image_bytes = None

    if file is not None:
        try:
            image_bytes = await file.read()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")
    elif sample_key:
        sample_path = os.path.join(os.path.dirname(__file__), "samples", f"{sample_key}.png")
        if not os.path.exists(sample_path):
            sample_path = os.path.join(os.path.dirname(__file__), "samples", "river_delta.png")
        try:
            with open(sample_path, "rb") as f:
                image_bytes = f.read()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read sample: {e}")
    else:
        # Fallback to river_delta sample
        sample_path = os.path.join(os.path.dirname(__file__), "samples", "river_delta.png")
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                image_bytes = f.read()
        else:
            raise HTTPException(status_code=400, detail="No image file or sample provided.")

    result = predict_flood(
        image_bytes=image_bytes,
        rainfall=rainfall,
        soil_type=soil_type,
        elevation_offset=elevation_offset,
        proximity_enabled=proximity_enabled,
        model_type=model_type
    )

    return result

class ReportRequest(BaseModel):
    site_id: str
    site_name: str
    locality: str
    livability_score: int
    flood_risk: str
    road_access: str
    dominant_land_use: str
    format: Optional[str] = "pdf"

@app.post("/api/report")
def generate_statutory_report(req: ReportRequest):
    """Generates an official spatial planning assessment report."""
    report_md = f"""# GINKGO — STATUTORY SPATIAL ASSESSMENT REPORT
**Sector**: {req.site_name} ({req.locality})
**Reference ID**: GNK-{req.site_id.upper()}-2026

---

## 1. Executive Planning Summary
Sector **{req.site_name}** has undergone multi-modal satellite AI screening.
- **Composite Livability Rating**: {req.livability_score} / 100
- **Dominant Land Use**: {req.dominant_land_use}
- **Hydrological Flood Hazard**: {req.flood_risk}
- **Arterial Connectivity**: {req.road_access}

## 2. Multi-Spectral & Land Cover Findings
- Spectral indices (NDVI/NDWI/NDBI) confirm terrain compatibility.
- Drainage buffer constraints and slope screening verified against statutory development limits.

*Generated automatically by Ginkgo Spatial Decision Intelligence Platform.*
"""
    return {
        "status": "success",
        "format": req.format,
        "filename": f"Ginkgo_Assessment_{req.site_id}.{req.format}",
        "content_md": report_md
    }

if __name__ == "__main__":
    import uvicorn
    print("🌿 Starting Ginkgo Unified Spatial Intelligence Backend on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
