"""
Synthetic Bi-Temporal Satellite Data Generator.

Generates realistic T1 (Before) and T2 (After) multi-spectral rasters (256x256)
demonstrating real-world scenarios:
1. Urban Sprawl & Infrastructure Development (Vegetation/Soil -> Built-up)
2. Rainforest Deforestation & Logging (Forest -> Bare Soil/Agriculture)
3. Reservoir Shrinkage & Flood Inundation (Water <-> Soil/Vegetation)
"""

import numpy as np
from PIL import Image
import io
import base64


def generate_synthetic_scenario(scenario_type: str = "urban_sprawl", size: int = 256):
    """
    Generates T1, T2 image arrays (H, W, 3) in [0, 1] range along with ground-truth change mask.
    Returns dictionary with base64 encoded PNG data strings and raw numpy arrays.
    """
    np.random.seed(101 if scenario_type == "urban_sprawl" else (202 if scenario_type == "deforestation" else 303))

    H, W = size, size

    # Coordinate grids for spatial patterning
    x = np.linspace(-1, 1, W)
    y = np.linspace(-1, 1, H)
    xx, yy = np.meshgrid(x, y)
    dist_center = np.sqrt(xx**2 + yy**2)

    # Base T1 Image Canvas Initialization
    t1_rgb = np.zeros((H, W, 3), dtype=np.float32)
    t2_rgb = np.zeros((H, W, 3), dtype=np.float32)

    if scenario_type == "urban_sprawl":
        # T1: Central river (Water), surrounding forest (Vegetation), minor town core (Urban)
        river_mask = (np.abs(yy - 0.2 * np.sin(xx * 4)) < 0.15)
        urban_t1_mask = (dist_center < 0.35) & (~river_mask)
        veg_mask = (~river_mask) & (~urban_t1_mask)

        # Assign T1 colors
        t1_rgb[river_mask] = [0.1, 0.4, 0.8]   # Water
        t1_rgb[urban_t1_mask] = [0.7, 0.7, 0.75] # Built-up
        t1_rgb[veg_mask] = [0.15, 0.65, 0.2]   # Forest

        # T2: Major urban expansion radially outwards into forest area
        urban_t2_mask = (dist_center < 0.75) & (~river_mask)
        t2_rgb[...] = t1_rgb[...]
        
        # New urbanized areas (Forest converted to Built-up)
        new_built_up = urban_t2_mask & (~urban_t1_mask)
        t2_rgb[new_built_up] = [0.85, 0.45, 0.4] # Reddish built-up construction

        change_mask = new_built_up.astype(np.float32)

    elif scenario_type == "deforestation":
        # T1: Dense pristine tropical rainforest with small winding river
        river_mask = (np.abs(xx - 0.15 * np.cos(yy * 3)) < 0.1)
        forest_mask = ~river_mask

        t1_rgb[river_mask] = [0.05, 0.35, 0.75]
        t1_rgb[forest_mask] = [0.1, 0.55, 0.15]

        # T2: Fishbone pattern logging / clear-cutting
        t2_rgb[...] = t1_rgb[...]
        logging_mask = (np.abs(xx) < 0.6) & (np.abs(yy) < 0.7) & ((np.int32(xx * 15) % 2 == 0) | (np.int32(yy * 15) % 2 == 0)) & forest_mask
        
        t2_rgb[logging_mask] = [0.75, 0.55, 0.25] # Bare soil / deforested patch
        change_mask = logging_mask.astype(np.float32)

    else:  # flood / reservoir shrinkage
        # T1: High water reservoir lake
        lake_t1 = (dist_center < 0.65)
        t1_rgb[lake_t1] = [0.05, 0.35, 0.85]   # Deep water
        t1_rgb[~lake_t1] = [0.2, 0.6, 0.25]   # Surrounding vegetation

        # T2: Severe drought / reservoir contraction
        lake_t2 = (dist_center < 0.3)
        t2_rgb[lake_t2] = [0.1, 0.4, 0.8]
        t2_rgb[~lake_t2] = [0.2, 0.6, 0.25]

        # Dried riverbed / mudflats
        dried_mud = lake_t1 & (~lake_t2)
        t2_rgb[dried_mud] = [0.8, 0.65, 0.35]  # Bare dry mud
        change_mask = dried_mud.astype(np.float32)

    # Add realistic texture noise
    noise_t1 = np.random.normal(0, 0.02, (H, W, 3)).astype(np.float32)
    noise_t2 = np.random.normal(0, 0.02, (H, W, 3)).astype(np.float32)
    
    t1_rgb = np.clip(t1_rgb + noise_t1, 0.0, 1.0)
    t2_rgb = np.clip(t2_rgb + noise_t2, 0.0, 1.0)

    # Convert arrays to Base64 PNG images for visual API consumption
    def to_b64_png(arr):
        img_uint8 = (arr * 255).astype(np.uint8)
        pil_img = Image.fromarray(img_uint8)
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "scenario": scenario_type,
        "width": W,
        "height": H,
        "t1_b64": to_b64_png(t1_rgb),
        "t2_b64": to_b64_png(t2_rgb),
        "t1_array": t1_rgb,
        "t2_array": t2_rgb,
        "gt_change_array": change_mask
    }
