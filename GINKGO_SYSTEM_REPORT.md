# Ginkgo — System Architecture, Workflow & Technical Report
### Enterprise Spatial Intelligence & Land Analytics Platform

---

## 1. Executive Summary

**Ginkgo** is an AI-powered spatial intelligence copilot and decision-support platform designed for Town Planners, Land Developers, and Municipal Authorities.

Unlike conventional satellite detection tools that stop at raw pixel classification, Ginkgo reframes the problem: **it transforms satellite perception and GIS layers into actionable, explainable planning intelligence**. By reasoning across multi-temporal Sentinel-2 imagery, deterministic GIS constraints, and national town planning guidelines, Ginkgo provides evidence-backed recommendations for land suitability, flood hazard mitigation, temporal change monitoring, and interactive rezoning simulations.

---

## 2. System Architecture

Ginkgo follows a **5-tier decoupled architecture**:

1. **Data Perception Tier**: Multi-temporal Sentinel-2 optical rasters, hydrological flood hazard layers, and arterial road networks.
2. **Machine Learning & Feature Tier**: Spectral Index engine ($\text{NDVI} + \text{NDWI} + \text{NDBI}$), Siamese U-Net spatial encoder, 5-Class HistGradientBoosting classifier, and Decision Tree suitability regressor.
3. **Deterministic GIS & Regulatory Rules**: Slope gradients ($<15^\circ$), flood drainage buffers ($>100\text{m}$), and arterial road accessibility ($>70$).
4. **AI Reasoning & Copilot Tier**: Local/edge LLMs (Ollama / Groq), Google Gemini 2.0 Flash, What-If scenario simulator, and statutory report generator.
5. **Presentation & HUD Tier**: Full-viewport Leaflet + Esri World Imagery canvas, Dual-View Slider, and the 4-Quadrant Livability HUD.
