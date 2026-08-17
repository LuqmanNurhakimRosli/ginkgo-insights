import cv2
import numpy as np
import base64
from PIL import Image
import io
import os
import sys

# Dictionary mapping model keys to their filenames
MODEL_FILES = {
    "random_forest": "flood_rf_model.pkl",
    "decision_tree": "flood_dt_model.pkl",
    "gradient_boosting": "flood_hgb_model.pkl",
    "logistic_regression": "flood_lr_model.pkl"
}

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
TRAIN_SCRIPT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "train_model.py")

# Cache for loaded models
loaded_models = {}

def load_or_train_model(model_type: str = "decision_tree"):
    global loaded_models
    
    # Normalize model key
    if model_type not in MODEL_FILES:
        print(f"Warning: Unknown model type '{model_type}'. Defaulting to 'random_forest'.")
        model_type = "random_forest"
        
    if model_type in loaded_models:
        return loaded_models[model_type]
        
    model_filename = MODEL_FILES[model_type]
    model_path = os.path.join(MODELS_DIR, model_filename)
    
    if os.path.exists(model_path):
        try:
            import joblib
            model = joblib.load(model_path)
            loaded_models[model_type] = model
            print(f"Loaded trained model '{model_type}' from {model_path}")
            return model
        except Exception as e:
            print(f"Error loading model '{model_type}': {e}. Re-training all models...")
            
    # Auto-train if model doesn't exist
    print(f"Model '{model_type}' not found. Automatically training all models on sample dataset...")
    try:
        import subprocess
        # Run training script
        subprocess.run([sys.executable, TRAIN_SCRIPT_PATH], check=True)
        if os.path.exists(model_path):
            import joblib
            model = joblib.load(model_path)
            loaded_models[model_type] = model
            print(f"Successfully auto-trained and loaded '{model_type}' model!")
            return model
    except Exception as e:
        print(f"Failed to auto-train models: {e}")
    return None

def encode_image_to_base64(img_bgr: np.ndarray) -> str:
    """Helper to convert BGR OpenCV image to base64 string for API response."""
    _, buffer = cv2.imencode('.png', img_bgr)
    b64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{b64_str}"

def predict_flood(
    image_bytes: bytes,
    rainfall: float,
    soil_type: str,
    elevation_offset: float,
    proximity_enabled: bool,
    model_type: str = "decision_tree"
) -> dict:
    """
    Main flood simulation engine.
    Applies HSV-based water extraction, constructs a simulated elevation profile,
    and runs a flood-fill/expansion algorithm based on environmental rules.
    """
    # 1. Parse Image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image bytes. Please upload a valid image file.")

    # Resize for consistent performance (max dimension 768px)
    h, w = img.shape[:2]
    max_dim = 768
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        h, w = img.shape[:2]

    # Save original image base64 for slider display (in case of resizing)
    original_b64 = encode_image_to_base64(img)

    # 2. Extract Water Bodies (CV Segmentation)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Range 1: Deep / dark blue & green water (satellite views)
    lower_water_1 = np.array([80, 20, 15])
    upper_water_1 = np.array([140, 255, 160])
    mask1 = cv2.inRange(hsv, lower_water_1, upper_water_1)
    
    # Range 2: Shallow / algae green / muddy brown water (satellite views)
    lower_water_2 = np.array([35, 25, 10])
    upper_water_2 = np.array([80, 255, 110])
    mask2 = cv2.inRange(hsv, lower_water_2, upper_water_2)
    
    # Range 3: Extremely dark water bodies (low Saturation, low Value, like deep lakes or shadowed river beds)
    lower_water_3 = np.array([0, 0, 0])
    upper_water_3 = np.array([180, 255, 40])
    mask3 = cv2.inRange(hsv, lower_water_3, upper_water_3)

    # Range 4: Vector Maps water (bright light-blue characteristic of Google Maps vector view)
    # Typically Hex #A3C6FF / BGR [255, 198, 163] -> HSV [108, 92, 255]
    lower_water_4 = np.array([85, 15, 150])
    upper_water_4 = np.array([125, 180, 255])
    mask4 = cv2.inRange(hsv, lower_water_4, upper_water_4)
    
    # Combine all water candidates
    water_mask = cv2.bitwise_or(mask1, mask2)
    water_mask = cv2.bitwise_or(water_mask, mask3)
    water_mask = cv2.bitwise_or(water_mask, mask4)
    
    # Cleanup noise with morphological open and close
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    water_mask = cv2.morphologyEx(water_mask, cv2.MORPH_OPEN, kernel)
    water_mask = cv2.morphologyEx(water_mask, cv2.MORPH_CLOSE, kernel)

    # Connected component size filtering to remove false-positive specks
    # (e.g. building shadows, small map icons, minor road markings)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(water_mask)
    clean_water_mask = np.zeros_like(water_mask)
    min_area = max(100, int((h * w) * 0.0006))  # Dynamic area threshold
    
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            clean_water_mask[labels == i] = 255
            
    water_mask = clean_water_mask

    # 3. Terrain/Elevation Simulation
    # Calculate distance transform (lower distance = closer to water = lower elevation)
    dist_transform = cv2.distanceTransform(cv2.bitwise_not(water_mask), cv2.DIST_L2, 5)
    # Normalize to 0-255 range
    cv2.normalize(dist_transform, dist_transform, 0, 255, cv2.NORM_MINMAX)
    dist_norm = dist_transform.astype(np.uint8)

    # Combine with image brightness gradient to simulate elevation features (mountains/valleys)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # A massive blur isolates regional brightness blocks (hills vs flatlands)
    terrain_base = cv2.GaussianBlur(gray, (51, 51), 0)
    
    # Final Simulated DEM: 60% distance to water + 40% terrain brightness
    elevation_map = cv2.addWeighted(dist_norm, 0.60, terrain_base, 0.40, 0)
    elevation_map = cv2.GaussianBlur(elevation_map, (15, 15), 0)

    # 4. Apply Machine Learning Model Classification
    soil_absorption = {
        "sandy": 0.80, # Absorbs 80% of rainfall, low runoff
        "loam": 0.50,  # Absorbs 50%
        "clay": 0.15   # Absorbs 15%, extremely high runoff
    }
    absorption_coeff = soil_absorption.get(soil_type.lower(), 0.50)
    runoff_coeff = 1.0 - absorption_coeff
    runoff = rainfall * runoff_coeff

    # Flatten maps to compile the pixel feature matrix
    h_flat = hsv[:, :, 0].flatten()
    s_flat = hsv[:, :, 1].flatten()
    v_flat = hsv[:, :, 2].flatten()
    dist_flat = dist_norm.flatten()
    elev_flat = elevation_map.flatten()
    
    num_pixels = len(h_flat)
    rain_flat = np.full(num_pixels, rainfall, dtype=np.float32)
    runoff_flat = np.full(num_pixels, runoff_coeff, dtype=np.float32)
    offset_flat = np.full(num_pixels, elevation_offset, dtype=np.float32)
    
    # Feature shape: [H, S, V, distance_to_water, elevation, rainfall, soil_runoff_coeff, elevation_offset]
    X_inference = np.column_stack((
        h_flat, s_flat, v_flat, dist_flat, elev_flat, rain_flat, runoff_flat, offset_flat
    ))
    
    # 5. Flood Mask Generation (ML Model Prediction)
    flood_mask = np.zeros_like(water_mask)
    ml_model = load_or_train_model(model_type)
    
    if ml_model is not None:
        try:
            preds = ml_model.predict(X_inference)
            flood_mask = preds.reshape((h, w)).astype(np.uint8) * 255
        except Exception as pred_err:
            print(f"Error during ML prediction: {pred_err}. Falling back to rule-based model.")
            ml_model = None
            
    if ml_model is None:
        # Fallback to CV rule engine if model is not loaded/fails
        runoff = rainfall * runoff_coeff
        base_level = (elevation_offset / 100.0) * 120.0
        runoff_expansion = (runoff / 300.0) * 110.0
        flood_level = base_level + runoff_expansion
        flood_mask[elevation_map < flood_level] = 255
    
    # Ensure original water is included in the candidate flood mask for proximity tracing
    flood_mask = cv2.bitwise_or(flood_mask, water_mask)
    
    # If proximity rule is enabled, we filter out isolated depressions that are far from water
    # This simulates a river/lake overflowing vs a general pooling of rain.
    if proximity_enabled:
        # Connect flood to original water bodies using connected components
        # Label original water
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(water_mask)
        
        # Now label candidate flooded areas
        num_labels_flood, labels_flood = cv2.connectedComponents(flood_mask)
        
        connected_flood = np.zeros_like(flood_mask)
        # Check which flood clusters overlap with the original water body mask
        for label_idx in range(1, num_labels_flood):
            cluster_mask = (labels_flood == label_idx).astype(np.uint8) * 255
            overlap = cv2.bitwise_and(cluster_mask, water_mask)
            if np.sum(overlap) > 0:
                connected_flood = cv2.bitwise_or(connected_flood, cluster_mask)
        
        # If there are no water bodies at all, default to simple proximity thresholding
        if np.sum(water_mask) == 0:
            connected_flood = flood_mask
            
        flood_mask = connected_flood

    # Clean up flood mask
    flood_mask = cv2.morphologyEx(flood_mask, cv2.MORPH_CLOSE, kernel)

    # 6. Compute Analytics
    total_pixels = h * w
    original_water_pixels = np.sum(water_mask > 0)
    total_water_pixels = np.sum(cv2.bitwise_or(water_mask, flood_mask) > 0)
    
    # Flooded-only area is the new water minus original water
    flooded_only_mask = cv2.bitwise_and(flood_mask, cv2.bitwise_not(water_mask))
    flooded_pixels = np.sum(flooded_only_mask > 0)
    
    original_water_pct = float((original_water_pixels / total_pixels) * 100)
    flooded_pct = float((flooded_pixels / total_pixels) * 100)
    total_water_pct = float((total_water_pixels / total_pixels) * 100)

    # Severity scale
    if flooded_pct < 2.0:
        severity = "Low Risk / Dry"
        severity_color = "#10B981" # Emerald Green
    elif flooded_pct < 10.0:
        severity = "Minor Flooding"
        severity_color = "#3B82F6" # Blue
    elif flooded_pct < 25.0:
        severity = "Moderate Flooding"
        severity_color = "#F59E0B" # Amber
    elif flooded_pct < 45.0:
        severity = "Severe Inundation"
        severity_color = "#EF4444" # Red
    else:
        severity = "Catastrophic Flood"
        severity_color = "#7C3AED" # Purple

    # 7. Generate Highlight Overlay BGR Image
    # Create overlay frame
    overlay_img = img.copy()
    
    # Draw transparent azure blue on newly flooded areas: BGR = [240, 130, 20]
    overlay_img[flooded_only_mask > 0] = [230, 120, 15]
    
    # Draw transparent darker navy blue on existing water bodies: BGR = [170, 70, 10]
    overlay_img[water_mask > 0] = [170, 70, 10]
    
    # Blend overlay with original image (alpha = 0.50)
    alpha = 0.50
    blended = cv2.addWeighted(overlay_img, alpha, img, 1 - alpha, 0)
    
    # Draw sharp bright cyan borders around newly flooded boundaries
    contours, _ = cv2.findContours(flooded_only_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(blended, contours, -1, [255, 235, 80], 2) # Cyan border

    result_b64 = encode_image_to_base64(blended)
    mask_b64 = encode_image_to_base64(flooded_only_mask)

    # 8. Generate Dynamic Reasoning & Rules Triggered
    reasons = []
    
    # Soil reasoning
    if soil_type.lower() == "clay":
        reasons.append(f"Soil profile classified as Clay: Water infiltration rate is critically low ({soil_absorption['clay'] * 100}% absorption capacity). This causes high surface runoff ({int((1 - soil_absorption['clay']) * 100)}%), promoting rapid flooding.")
    elif soil_type.lower() == "loam":
        reasons.append(f"Soil profile classified as Loam: Moderate water infiltration rate ({soil_absorption['loam'] * 100}% absorption). Moderate surface runoff generated.")
    else:
        reasons.append(f"Soil profile classified as Sandy: High infiltration and drainage rates ({soil_absorption['sandy'] * 100}% absorption). Surface runoff is significantly mitigated, restricting flood expansion to extreme precipitation.")

    # Rainfall reasoning
    if rainfall > 200:
        reasons.append(f"Extreme Precipitation: {rainfall}mm of rain exceeds drainage capacity. Runoff index is at critical levels ({int(runoff)} units).")
    elif rainfall > 100:
        reasons.append(f"Heavy Precipitation: {rainfall}mm of rain leads to saturation of regional lowlands and fields. Runoff index is moderate ({int(runoff)} units).")
    elif rainfall > 30:
        reasons.append(f"Moderate Precipitation: {rainfall}mm of rain. Inundation is restricted mostly to active waterways and lowest local basins.")
    else:
        reasons.append(f"Light Precipitation: {rainfall}mm of rain. Normal absorption accommodates this load; no substantial pooling detected.")

    # Elevation & Proximity reasoning
    if elevation_offset > 50:
        reasons.append(f"High Water Table Baseline: The sea-level/groundwater offset is set high ({elevation_offset}%), placing low-lying zones (< 5m altitude) under constant immersion risk.")
    elif elevation_offset > 20:
        reasons.append(f"Elevated Baseline: Low-level basins are saturated, accelerating overflow boundaries.")

    if proximity_enabled:
        reasons.append("Proximity Constraint Active: Flood propagation is constrained to contiguous expansion from existing water bodies (e.g. river overflow/coastal surge). Isolated inland dry depressions are protected.")
    else:
        reasons.append("Proximity Constraint Disabled: Flash flooding active. Low-lying depressions are vulnerable to independent rainwater pooling, regardless of distance to permanent channels.")

    # Quantitative results
    reasons.append(f"AI Spatial analysis detected {flooded_pct:.1f}% new flood coverage, expanding total water surface area from {original_water_pct:.1f}% to {total_water_pct:.1f}%.")

    return {
        "original_image": original_b64,
        "predicted_image": result_b64,
        "mask_image": mask_b64,
        "original_water_percentage": original_water_pct,
        "flooded_percentage": flooded_pct,
        "total_water_percentage": total_water_pct,
        "severity": severity,
        "severity_color": severity_color,
        "reasons": reasons,
        "dimensions": {"width": w, "height": h}
    }
