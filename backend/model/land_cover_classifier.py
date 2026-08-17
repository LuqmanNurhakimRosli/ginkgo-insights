"""
Land Cover Classifier Engine.

Defines target land cover classes, spectral feature extraction routines,
Random Forest / ML classifier modeling, and visualization color mappings.
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier

# Land Cover Class Mapping Definitions
LAND_COVER_CLASSES = {
    0: {"name": "Urban / Built-up", "code": "URBAN", "color": [220, 53, 69]},       # Red #DC3545
    1: {"name": "Vegetation / Forest", "code": "VEG", "color": [40, 167, 69]},      # Green #28A745
    2: {"name": "Water Bodies", "code": "WATER", "color": [0, 123, 255]},           # Blue #007bff
    3: {"name": "Bare Soil / Rock", "code": "SOIL", "color": [238, 155, 0]},        # Amber #EE9B00
    4: {"name": "Agricultural Land", "code": "AGRI", "color": [155, 206, 0]}       # Lime #9BCE00
}

CLASS_HEX_COLORS = {
    0: "#DC3545",
    1: "#28A745",
    2: "#007BFF",
    3: "#EE9B00",
    4: "#9BCE00"
}


class LandCoverClassifier:
    """
    Scikit-Learn Land Cover & Temporal Change Classifier (Person A / Tisya Deliverable).
    Trained on Multi-Spectral / RGB + Spectral Index features (NDVI, NDWI, NDBI).
    Supports RandomForestClassifier and GradientBoostingClassifier algorithms.
    """
    def __init__(self, model_type="random_forest", n_estimators=50):
        self.model_type = model_type
        if model_type == "gradient_boosting":
            from sklearn.ensemble import GradientBoostingClassifier
            self.clf = GradientBoostingClassifier(n_estimators=n_estimators, random_state=42)
        else:
            self.clf = RandomForestClassifier(n_estimators=n_estimators, random_state=42)
            
        self.is_trained = False
        self._initialize_bootstrap_weights()

    def extract_features(self, img: np.ndarray) -> np.ndarray:
        """
        Extracts per-pixel feature vector: [R, G, B, NDVI, NDWI, NDBI, Brightness]
        img: (H, W, 3) normalized float array in range [0, 1].
        """
        r = img[:, :, 0]
        g = img[:, :, 1]
        b = img[:, :, 2]
        
        # Spectral Indices
        ndvi = (g - r) / (g + r + 1e-6)
        ndwi = (g - b) / (g + b + 1e-6)
        ndbi = (r - g) / (r + g + 1e-6)
        brightness = (r + g + b) / 3.0

        features = np.stack([r, g, b, ndvi, ndwi, ndbi, brightness], axis=-1)
        return features

    def _initialize_bootstrap_weights(self):
        """Pre-trains model on labeled spectral samples for instant readiness."""
        X_samples = []
        y_samples = []

        np.random.seed(42)
        
        # 0: Urban / Built-up (High R, moderate G/B, NDBI > 0)
        u_r = np.random.normal(0.65, 0.08, 150)
        u_g = np.random.normal(0.60, 0.08, 150)
        u_b = np.random.normal(0.60, 0.08, 150)
        u_feats = np.stack([u_r, u_g, u_b, (u_g-u_r)/(u_g+u_r+1e-5), (u_g-u_b)/(u_g+u_b+1e-5), (u_r-u_g)/(u_r+u_g+1e-5), (u_r+u_g+u_b)/3], axis=-1)
        X_samples.append(u_feats)
        y_samples.append(np.full(150, 0))

        # 1: Vegetation / Forest (High G, high NDVI)
        v_r = np.random.normal(0.15, 0.05, 150)
        v_g = np.random.normal(0.60, 0.08, 150)
        v_b = np.random.normal(0.15, 0.05, 150)
        v_feats = np.stack([v_r, v_g, v_b, (v_g-v_r)/(v_g+v_r+1e-5), (v_g-v_b)/(v_g+v_b+1e-5), (v_r-v_g)/(v_r+v_g+1e-5), (v_r+v_g+v_b)/3], axis=-1)
        X_samples.append(v_feats)
        y_samples.append(np.full(150, 1))

        # 2: Water Bodies (High B, high NDWI)
        w_r = np.random.normal(0.10, 0.04, 150)
        w_g = np.random.normal(0.25, 0.05, 150)
        w_b = np.random.normal(0.65, 0.08, 150)
        w_feats = np.stack([w_r, w_g, w_b, (w_g-w_r)/(w_g+w_r+1e-5), (w_g-w_b)/(w_g+w_b+1e-5), (w_r-w_g)/(w_r+w_g+1e-5), (w_r+w_g+w_b)/3], axis=-1)
        X_samples.append(w_feats)
        y_samples.append(np.full(150, 2))

        # 3: Bare Soil / Rock (High R & G, low NDVI)
        s_r = np.random.normal(0.70, 0.06, 150)
        s_g = np.random.normal(0.50, 0.06, 150)
        s_b = np.random.normal(0.30, 0.05, 150)
        s_feats = np.stack([s_r, s_g, s_b, (s_g-s_r)/(s_g+s_r+1e-5), (s_g-s_b)/(s_g+s_b+1e-5), (s_r-s_g)/(s_r+s_g+1e-5), (s_r+s_g+s_b)/3], axis=-1)
        X_samples.append(s_feats)
        y_samples.append(np.full(150, 3))

        # 4: Agricultural Land (Moderate G, moderate NDVI)
        a_r = np.random.normal(0.30, 0.06, 150)
        a_g = np.random.normal(0.55, 0.07, 150)
        a_b = np.random.normal(0.20, 0.05, 150)
        a_feats = np.stack([a_r, a_g, a_b, (a_g-a_r)/(a_g+a_r+1e-5), (a_g-a_b)/(a_g+a_b+1e-5), (a_r-a_g)/(a_r+a_g+1e-5), (a_r+a_g+a_b)/3], axis=-1)
        X_samples.append(a_feats)
        y_samples.append(np.full(150, 4))

        X = np.vstack(X_samples)
        y = np.concatenate(y_samples)

        self.clf.fit(X, y)
        self.is_trained = True

    def train_on_labeled_samples(self, X_train: np.ndarray, y_train: np.ndarray):
        """Trains or fine-tunes the classifier on custom labeled pixel samples."""
        self.clf.fit(X_train, y_train)
        self.is_trained = True

    def classify_image(self, img: np.ndarray) -> np.ndarray:
        """
        Classifies an (H, W, 3) satellite raster into land cover class indices (H, W).
        """
        H, W, C = img.shape
        feats = self.extract_features(img)
        flat_feats = feats.reshape(-1, feats.shape[-1])
        preds = self.clf.predict(flat_feats)
        return preds.reshape(H, W)

    def diff_temporal_maps(self, lc_t1: np.ndarray, lc_t2: np.ndarray):
        """
        Diffs two classified land cover maps (T1 and T2) to generate:
        1. Pixel-wise change mask (0 = unchanged, 1 = changed).
        2. Exact change summary schema matching Section 10.5 contract.
        """
        total_pixels = lc_t1.size
        change_mask = (lc_t1 != lc_t2).astype(np.uint8)

        veg_t1 = np.sum(lc_t1 == 1)
        veg_t2 = np.sum(lc_t2 == 1)
        veg_loss_pct = float(round(((veg_t1 - veg_t2) / total_pixels) * 100.0, 2))

        built_t1 = np.sum(lc_t1 == 0)
        built_t2 = np.sum(lc_t2 == 0)
        built_growth_pct = float(round(((built_t2 - built_t1) / total_pixels) * 100.0, 2))

        water_t1 = np.sum(lc_t1 == 2)
        water_t2 = np.sum(lc_t2 == 2)
        water_change_pct = float(round(((water_t2 - water_t1) / total_pixels) * 100.0, 2))

        change_summary = {
            "vegetation_loss_pct": max(0.0, veg_loss_pct),
            "built_up_growth_pct": max(0.0, built_growth_pct),
            "water_change_pct": water_change_pct,
            "total_changed_pixels": int(np.sum(change_mask)),
            "net_change_pct": float(round((np.sum(change_mask) / total_pixels) * 100.0, 2))
        }

        return change_mask, change_summary

    def generate_deliverable_schema(self, t1_img: np.ndarray, t2_img: np.ndarray) -> dict:
        """
        Generates the Person A deliverable JSON contract (Section 10.5 of blueprint):
        - land_cover_map (T1 & T2 class IDs per pixel)
        - change_summary (vegetation_loss_pct, built_up_growth_pct, water_change_pct, etc.)
        """
        lc_t1 = self.classify_image(t1_img)
        lc_t2 = self.classify_image(t2_img)
        change_mask, change_summary = self.diff_temporal_maps(lc_t1, lc_t2)

        return {
            "producer": "Person A (Tisya)",
            "model_type": self.model_type,
            "land_cover_map": {
                "t1_raster": lc_t1.tolist(),
                "t2_raster": lc_t2.tolist(),
                "height": lc_t1.shape[0],
                "width": lc_t1.shape[1]
            },
            "change_mask": change_mask.tolist(),
            "change_summary": change_summary
        }

    def colorize_mask(self, mask: np.ndarray) -> np.ndarray:
        """
        Converts (H, W) class index mask into (H, W, 3) RGB colorized image.
        """
        H, W = mask.shape
        rgb = np.zeros((H, W, 3), dtype=np.uint8)
        for class_idx, info in LAND_COVER_CLASSES.items():
            match = (mask == class_idx)
            rgb[match] = info["color"]
        return rgb
