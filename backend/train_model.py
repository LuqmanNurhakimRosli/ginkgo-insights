import os
import cv2
import numpy as np
import random
import time
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score
import joblib

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLES_DIR = os.path.join(os.path.dirname(BASE_DIR), "samples")
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Ensure folders exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# List of samples to build dataset from
SAMPLE_FILES = [
    "river_delta.png",
    "mountain_valley.png",
    "agricultural_plains.png",
    "putra_heights_map.png",
    "putra_heights_sat.png"
]

def run_model_training():
    print("====================================================")
    print(" AeroFlood AI: Building ML Dataset & Training Model ")
    print("====================================================")
    
    features_list = []
    labels_list = []
    
    # Soil absorption mapping to runoff coefficients
    soil_absorption = {
        "sandy": 0.80, # 20% runoff
        "loam": 0.50,  # 50% runoff
        "clay": 0.15   # 85% runoff
    }
    
    # Find active samples
    active_samples = []
    for f in SAMPLE_FILES:
        path = os.path.join(SAMPLES_DIR, f)
        if os.path.exists(path):
            active_samples.append((f, path))
        else:
            print(f"Warning: Sample file missing: {path}")

    if not active_samples:
        print("Error: No sample images found. Cannot train model. Run generate_samples.py first.")
        return False
        
    print(f"Found {len(active_samples)} active sample images. Compiling pixel features...")
    
    # We will run 30 random environment simulations per image to cover the parameter space continuously
    num_simulations_per_image = 30
    samples_per_simulation = 400

    for f_name, path in active_samples:
        img = cv2.imread(path)
        if img is None:
            continue
            
        # Resize to consistent smaller size for data sampling
        h, w = img.shape[:2]
        scale = 384 / max(h, w)
        img = cv2.resize(img, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        h, w = img.shape[:2]
        
        # 1. Segment Water Bodies
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Color Ranges
        mask1 = cv2.inRange(hsv, np.array([80, 20, 15]), np.array([140, 255, 160]))
        mask2 = cv2.inRange(hsv, np.array([35, 25, 10]), np.array([80, 255, 110]))
        mask3 = cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 255, 40]))
        mask4 = cv2.inRange(hsv, np.array([85, 15, 150]), np.array([125, 180, 255]))
        
        water_mask = cv2.bitwise_or(cv2.bitwise_or(cv2.bitwise_or(mask1, mask2), mask3), mask4)
        
        # Connected Component Size Filter
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(water_mask)
        clean_water = np.zeros_like(water_mask)
        min_area = max(50, int((h * w) * 0.0006))
        for i in range(1, num_labels):
            if stats[i, cv2.CC_STAT_AREA] >= min_area:
                clean_water[labels == i] = 255
        water_mask = clean_water

        # 2. Elevation transform
        dist_transform = cv2.distanceTransform(cv2.bitwise_not(water_mask), cv2.DIST_L2, 5)
        cv2.normalize(dist_transform, dist_transform, 0, 255, cv2.NORM_MINMAX)
        dist_norm = dist_transform.astype(np.uint8)
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        terrain_base = cv2.GaussianBlur(gray, (51, 51), 0)
        
        elevation_map = cv2.addWeighted(dist_norm, 0.60, terrain_base, 0.40, 0)
        elevation_map = cv2.GaussianBlur(elevation_map, (15, 15), 0)

        # Draw samples from the image under each simulation config
        for _ in range(num_simulations_per_image):
            # Domain Randomization: generate completely random parameters
            rainfall = random.uniform(30.0, 300.0)
            soil_type = random.choice(["sandy", "loam", "clay"])
            elevation_offset = random.uniform(10.0, 80.0)
            
            runoff_coeff = 1.0 - soil_absorption[soil_type]
            runoff = rainfall * runoff_coeff
            
            # Ground truth flood calculation for this config
            base_level = (elevation_offset / 100.0) * 120.0
            runoff_expansion = (runoff / 300.0) * 110.0
            flood_level = base_level + runoff_expansion
            
            # Raw flood mask
            flood_mask = np.zeros_like(water_mask)
            flood_mask[elevation_map < flood_level] = 255
            
            # Proximity lock rule (flood expands contiguously from river/shores)
            num_labels_flood, labels_flood = cv2.connectedComponents(flood_mask)
            connected_flood = np.zeros_like(flood_mask)
            for label_idx in range(1, num_labels_flood):
                cluster = (labels_flood == label_idx).astype(np.uint8) * 255
                if np.sum(cv2.bitwise_and(cluster, water_mask)) > 0:
                    connected_flood = cv2.bitwise_or(connected_flood, cluster)
            
            if np.sum(water_mask) == 0:
                connected_flood = flood_mask
            flood_mask = connected_flood

            # Draw samples_per_simulation random pixels from this simulation configuration
            for _ in range(samples_per_simulation):
                y = random.randint(0, h - 1)
                x = random.randint(0, w - 1)
                
                # Spectral Features
                H, S, V = hsv[y, x]
                
                # Geographical Features
                dist = dist_norm[y, x]
                elev = elevation_map[y, x]
                
                # Target Label: 1 if pixel is flooded (excluding original permanent water), else 0
                is_permanent_water = water_mask[y, x] > 0
                is_flooded = 1 if (flood_mask[y, x] > 0 and not is_permanent_water) else 0
                
                # Append to dataset
                features_list.append([
                    float(H),
                    float(S),
                    float(V),
                    float(dist),
                    float(elev),
                    float(rainfall),
                    float(runoff_coeff),
                    float(elevation_offset)
                ])
                labels_list.append(is_flooded)

    X = np.array(features_list)
    y = np.array(labels_list)
    
    print(f"Dataset compiled! Total samples: {X.shape[0]} rows.")
    
    # Save dataset to CSV for hackathon transparency
    csv_path = os.path.join(DATA_DIR, "pixel_dataset.csv")
    header = "H,S,V,distance_to_water,elevation,rainfall,soil_runoff_coeff,elevation_offset,is_flooded"
    data_to_save = np.column_stack((X, y))
    np.savetxt(csv_path, data_to_save, delimiter=",", header=header, comments="", fmt="%.2f")
    print(f"Dataset successfully saved to: {csv_path}")

    # Train / Test split
    print("Splitting dataset into train/test (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    
    # Define models to train
    models_config = {
        "random_forest": {
            "name": "Random Forest",
            "model": RandomForestClassifier(n_estimators=30, max_depth=12, random_state=42, n_jobs=-1),
            "filename": "flood_rf_model.pkl"
        },
        "decision_tree": {
            "name": "Decision Tree",
            "model": DecisionTreeClassifier(max_depth=10, random_state=42),
            "filename": "flood_dt_model.pkl"
        },
        "gradient_boosting": {
            "name": "Gradient Boosting (Hist)",
            "model": HistGradientBoostingClassifier(max_iter=50, max_depth=8, random_state=42),
            "filename": "flood_hgb_model.pkl"
        },
        "logistic_regression": {
            "name": "Logistic Regression",
            "model": LogisticRegression(max_iter=1000, random_state=42),
            "filename": "flood_lr_model.pkl"
        }
    }
    
    comparison_data = {}
    
    for key, info in models_config.items():
        print(f"\nFitting {info['name']} Classifier...")
        start_time = time.time()
        info['model'].fit(X_train, y_train)
        training_time = time.time() - start_time
        
        # Inference Latency evaluation (predict on test set)
        start_pred = time.time()
        y_pred = info['model'].predict(X_test)
        pred_time = time.time() - start_pred
        
        # Calculate latency per 100k pixels in milliseconds
        latency_100k = (pred_time / len(y_test)) * 100000 * 1000
        
        # Compute metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        # Save model
        model_path = os.path.join(MODELS_DIR, info['filename'])
        joblib.dump(info['model'], model_path)
        
        # Get file size in KB
        model_size_kb = os.path.getsize(model_path) / 1024.0
        
        print(f"{info['name']} Accuracy: {acc * 100:.2f}% (Size: {model_size_kb:.1f} KB, Latency: {latency_100k:.2f} ms)")
        
        comparison_data[key] = {
            "name": info['name'],
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "training_time": float(training_time),
            "latency_100k_ms": float(latency_100k),
            "size_kb": float(model_size_kb)
        }
        
    # Export unified JSON comparison report
    report_path = os.path.join(DATA_DIR, "model_comparison.json")
    with open(report_path, "w") as f:
        json.dump(comparison_data, f, indent=4)
        
    print(f"\nUnified comparison report saved to: {report_path}")
    
    # Beautiful Rich terminal printout
    try:
        from rich.console import Console
        from rich.table import Table

        console = Console()
        table = Table(title="AeroFlood AI: Model Performance Comparison", show_header=True, header_style="bold cyan")
        table.add_column("Classifier Model", style="bold white", width=25)
        table.add_column("Accuracy", justify="right", style="green")
        table.add_column("Precision", justify="right")
        table.add_column("Recall", justify="right")
        table.add_column("F1-Score", justify="right", style="magenta")
        table.add_column("Model Size", justify="right", style="yellow")
        table.add_column("Inference Latency (100k px)", justify="right", style="cyan")
        table.add_column("Training Time", justify="right")

        for key in ["random_forest", "decision_tree", "gradient_boosting", "logistic_regression"]:
            metrics = comparison_data[key]
            table.add_row(
                metrics["name"],
                f"{metrics['accuracy']*100:.2f}%",
                f"{metrics['precision']*100:.2f}%",
                f"{metrics['recall']*100:.2f}%",
                f"{metrics['f1_score']*100:.2f}%",
                f"{metrics['size_kb']:.1f} KB",
                f"{metrics['latency_100k_ms']:.2f} ms",
                f"{metrics['training_time']:.4f} s"
            )
        console.print("\n")
        console.print(table)
        console.print("\n")
    except Exception as rich_err:
        print(f"Could not print rich table: {rich_err}")
        
    print("All models successfully trained and exported!\n")
    return True

if __name__ == "__main__":
    run_model_training()
