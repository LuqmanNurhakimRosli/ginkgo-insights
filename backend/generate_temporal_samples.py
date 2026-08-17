import os
import cv2
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLES_DIR = os.path.join(BASE_DIR, "samples")
os.makedirs(SAMPLES_DIR, exist_ok=True)

def create_base_canvas(width=800, height=600, color=(40, 110, 50)):
    """Creates a base RGB numpy image filled with vegetation green."""
    img = np.full((height, width, 3), color, dtype=np.uint8)
    # Add subtle random texture for realistic land surface
    noise = np.random.randint(-12, 12, (height, width, 3), dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return img

def draw_river(img, points, width=35, color=(180, 120, 30)): # OpenCV BGR: Blue river = (180, 120, 30)
    pts = np.array(points, np.int32).reshape((-1, 1, 2))
    cv2.polylines(img, [pts], isClosed=False, color=color, thickness=width, lineType=cv2.LINE_AA)
    # Add river inner dark channel
    cv2.polylines(img, [pts], isClosed=False, color=(140, 80, 10), thickness=int(width * 0.5), lineType=cv2.LINE_AA)
    return img

def draw_roads(img, road_lines, width=12, color=(180, 180, 180)): # Gray roads
    for pts_list in road_lines:
        pts = np.array(pts_list, np.int32).reshape((-1, 1, 2))
        cv2.polylines(img, [pts], isClosed=False, color=color, thickness=width, lineType=cv2.LINE_AA)
    return img

def draw_buildings(img, rects, color=(200, 200, 210)): # Built-up greyish/white roofs
    for (x, y, w, h) in rects:
        cv2.rectangle(img, (x, y), (x + w, y + h), color, -1)
        cv2.rectangle(img, (x, y), (x + w, y + h), (100, 100, 100), 1) # border
    return img

def draw_agricultural_fields(img, field_rects):
    colors = [
        (40, 150, 80),   # Bright crop
        (50, 120, 110),  # Olive field
        (30, 90, 140),   # Dry field / soil
        (60, 170, 90)    # Lush green
    ]
    for idx, (x, y, w, h) in enumerate(field_rects):
        c = colors[idx % len(colors)]
        cv2.rectangle(img, (x, y), (x + w, y + h), c, -1)
        cv2.rectangle(img, (x, y), (x + w, y + h), (30, 70, 30), 1)
    return img

def generate_urban_pair():
    """Site 1: Urban Location (Putra Heights) - T1 Baseline vs T2 Urban Expansion."""
    width, height = 800, 600
    
    # --- T1: Baseline Urban ---
    t1 = create_base_canvas(width, height, color=(45, 105, 40)) # Green foliage background
    
    # River curving across left side
    river_pts = [(180, 0), (220, 150), (190, 320), (250, 480), (230, 600)]
    t1 = draw_river(t1, river_pts, width=40)
    
    # Main highway & local roads
    roads = [
        [(50, 200), (750, 200)], # Main horizontal highway
        [(500, 50), (500, 550)], # Vertical artery
        [(250, 350), (750, 350)] # Secondary street
    ]
    t1 = draw_roads(t1, roads, width=14)
    
    # T1 Built-up blocks (existing residential sector)
    t1_buildings = []
    for bx in range(520, 680, 30):
        for by in range(220, 320, 30):
            t1_buildings.append((bx, by, 22, 22))
    t1 = draw_buildings(t1, t1_buildings, color=(210, 210, 220))
    
    t1_path = os.path.join(SAMPLES_DIR, "site1_urban_t1.png")
    cv2.imwrite(t1_path, t1)
    
    # --- T2: Follow-up Urban (Urban Expansion & Vegetation Loss) ---
    t2 = t1.copy()
    
    # Clear vegetation in expansion zone
    cv2.rectangle(t2, (500, 360), (760, 540), (140, 145, 150), -1) # Paved area
    
    # New connecting road
    new_roads = [[(500, 450), (760, 450)]]
    t2 = draw_roads(t2, new_roads, width=10, color=(190, 190, 190))
    
    # T2 New urban expansion buildings
    t2_new_buildings = []
    for bx in range(520, 740, 28):
        for by in range(370, 520, 28):
            t2_new_buildings.append((bx, by, 22, 22))
    t2 = draw_buildings(t2, t2_new_buildings, color=(235, 235, 240))
    
    # Forest clearing near riverbank
    cv2.ellipse(t2, (300, 280), (45, 30), 15, 0, 360, (110, 130, 135), -1)
    
    t2_path = os.path.join(SAMPLES_DIR, "site1_urban_t2.png")
    cv2.imwrite(t2_path, t2)
    print(f"Generated Urban Site 1 pair: {t1_path}, {t2_path}")

def generate_rural_pair():
    """Site 2: Rural Location (River Delta / Agricultural Basin) - T1 Baseline vs T2 Flood Inundation."""
    width, height = 800, 600
    
    # --- T1: Baseline Rural ---
    t1 = create_base_canvas(width, height, color=(35, 95, 35))
    
    # Wide Meandering River
    river_pts = [(0, 300), (200, 260), (400, 340), (600, 280), (800, 320)]
    t1 = draw_river(t1, river_pts, width=50)
    
    # Agricultural field grid
    fields = [
        (50, 50, 160, 140), (230, 50, 150, 140), (400, 50, 180, 140), (600, 50, 150, 140),
        (50, 400, 160, 150), (230, 410, 150, 140), (400, 420, 180, 130), (600, 400, 150, 150)
    ]
    t1 = draw_agricultural_fields(t1, fields)
    
    # Rural village cluster
    village = [(300, 210, 18, 18), (330, 210, 18, 18), (300, 235, 18, 18), (360, 220, 18, 18)]
    t1 = draw_buildings(t1, village, color=(190, 190, 180))
    
    # Rural track
    tracks = [[(0, 230), (800, 230)]]
    t1 = draw_roads(t1, tracks, width=6, color=(160, 150, 130))
    
    t1_path = os.path.join(SAMPLES_DIR, "site2_rural_t1.png")
    cv2.imwrite(t1_path, t1)
    
    # --- T2: Follow-up Rural (Water Inundation & Vegetation Impact) ---
    t2 = t1.copy()
    
    # Flood expansion along low elevation river bend
    flood_pool1 = np.array([(150, 230), (250, 210), (380, 300), (320, 400), (180, 380)], np.int32)
    flood_pool2 = np.array([(550, 250), (700, 260), (720, 420), (580, 410)], np.int32)
    
    water_color = (195, 135, 25) # Dark Blue-Green flood water
    cv2.fillPoly(t2, [flood_pool1, flood_pool2], water_color)
    
    # Re-draw river channel with higher water level
    t2 = draw_river(t2, river_pts, width=65, color=(205, 145, 30))
    
    t2_path = os.path.join(SAMPLES_DIR, "site2_rural_t2.png")
    cv2.imwrite(t2_path, t2)
    print(f"Generated Rural Site 2 pair: {t1_path}, {t2_path}")

if __name__ == "__main__":
    print("Generating PLANVerse AI temporal satellite image samples...")
    generate_urban_pair()
    generate_rural_pair()
    print("Sample generation complete!")
