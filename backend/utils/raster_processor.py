"""
Raster Processor & Geospatial Analytics Utilities.

Provides spectral index calculation, land cover transition matrix computations,
and pixel change severity analysis.
"""

import numpy as np
from typing import Dict, List, Any


def compute_spectral_indices(img: np.ndarray) -> Dict[str, np.ndarray]:
    """
    Computes NDVI, NDWI, NDBI spectral index rasters from RGB image.
    img: (H, W, 3) normalized float array [0, 1].
    """
    r = img[:, :, 0]
    g = img[:, :, 1]
    b = img[:, :, 2]

    # NDVI = (NIR - Red) / (NIR + Red) -> Green proxy as NIR for RGB
    ndvi = np.clip((g - r) / (g + r + 1e-6), -1.0, 1.0)
    
    # NDWI = (Green - NIR/Swir) -> Blue proxy as Water signal
    ndwi = np.clip((g - b) / (g + b + 1e-6), -1.0, 1.0)

    # NDBI = (SWIR - NIR) -> Red proxy as Built-up signal
    ndbi = np.clip((r - g) / (r + g + 1e-6), -1.0, 1.0)

    return {
        "ndvi": ndvi,
        "ndwi": ndwi,
        "ndbi": ndbi
    }


def compute_land_cover_transition_matrix(
    lc_t1: np.ndarray, 
    lc_t2: np.ndarray, 
    pixel_area_sq_m: float = 100.0,
    class_names: List[str] = None
) -> Dict[str, Any]:
    """
    Calculates a cross-tabulation land cover transition matrix between T1 and T2.
    pixel_area_sq_m: Default 100 m² (10m x 10m Sentinel-2 pixel size).
    """
    if class_names is None:
        class_names = ["Urban", "Vegetation", "Water", "Bare Soil", "Agriculture"]

    num_classes = len(class_names)
    matrix_counts = np.zeros((num_classes, num_classes), dtype=int)

    H, W = lc_t1.shape
    for i in range(H):
        for j in range(W):
            c1 = int(lc_t1[i, j])
            c2 = int(lc_t2[i, j])
            if 0 <= c1 < num_classes and 0 <= c2 < num_classes:
                matrix_counts[c1, c2] += 1

    # Convert pixel counts to Square Kilometers (km²) & Hectares
    sq_km_matrix = (matrix_counts * pixel_area_sq_m) / 1000000.0  # 1 km² = 1,000,000 m²
    hectare_matrix = (matrix_counts * pixel_area_sq_m) / 10000.0    # 1 ha = 10,000 m²

    transitions = []
    total_changed_pixels = 0
    total_pixels = H * W

    for r in range(num_classes):
        for c in range(num_classes):
            if r != c and matrix_counts[r, c] > 0:
                count = int(matrix_counts[r, c])
                total_changed_pixels += count
                transitions.append({
                    "from_class": class_names[r],
                    "to_class": class_names[c],
                    "pixel_count": count,
                    "area_km2": round(sq_km_matrix[r, c], 4),
                    "area_hectares": round(hectare_matrix[r, c], 2),
                    "percentage_of_total": round((count / total_pixels) * 100.0, 2)
                })

    # Sort major land transition changes by area impact
    transitions.sort(key=lambda x: x["pixel_count"], reverse=True)

    # Class summary totals for T1 and T2
    t1_counts = [int(np.sum(lc_t1 == c)) for c in range(num_classes)]
    t2_counts = [int(np.sum(lc_t2 == c)) for c in range(num_classes)]

    t1_summary = {
        class_names[c]: {
            "pixels": t1_counts[c],
            "area_km2": round((t1_counts[c] * pixel_area_sq_m) / 1e6, 4),
            "percentage": round((t1_counts[c] / total_pixels) * 100.0, 2)
        } for c in range(num_classes)
    }

    t2_summary = {
        class_names[c]: {
            "pixels": t2_counts[c],
            "area_km2": round((t2_counts[c] * pixel_area_sq_m) / 1e6, 4),
            "percentage": round((t2_counts[c] / total_pixels) * 100.0, 2)
        } for c in range(num_classes)
    }

    return {
        "total_pixels": total_pixels,
        "total_changed_pixels": total_changed_pixels,
        "net_change_percentage": round((total_changed_pixels / total_pixels) * 100.0, 2),
        "t1_class_summary": t1_summary,
        "t2_class_summary": t2_summary,
        "major_transitions": transitions
    }


def classify_change_severity(change_intensity: np.ndarray) -> Dict[str, Any]:
    """
    Categorizes pixel change intensity into severity levels:
    - Negligible: < 0.2
    - Low: 0.2 - 0.4
    - Moderate: 0.4 - 0.7
    - Severe: >= 0.7
    """
    total = change_intensity.size
    negligible = int(np.sum(change_intensity < 0.2))
    low = int(np.sum((change_intensity >= 0.2) & (change_intensity < 0.4)))
    moderate = int(np.sum((change_intensity >= 0.4) & (change_intensity < 0.7)))
    severe = int(np.sum(change_intensity >= 0.7))

    return {
        "severity_breakdown": {
            "Negligible": {"count": negligible, "percentage": round((negligible / total) * 100.0, 2)},
            "Low": {"count": low, "percentage": round((low / total) * 100.0, 2)},
            "Moderate": {"count": moderate, "percentage": round((moderate / total) * 100.0, 2)},
            "Severe": {"count": severe, "percentage": round((severe / total) * 100.0, 2)}
        },
        "average_intensity": round(float(np.mean(change_intensity)), 4),
        "max_intensity": round(float(np.max(change_intensity)), 4)
    }
