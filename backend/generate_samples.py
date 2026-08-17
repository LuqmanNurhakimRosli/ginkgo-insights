import os
# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
import numpy as np

def generate_river_delta():
    # 512x512 BGR image
    # A green land mass transitioning into an ocean at the bottom right, with a winding river
    img = np.zeros((512, 512, 3), dtype=np.uint8)
    
    # Set seed for reproducibility
    np.random.seed(42)
    
    # 1. Base terrain generation
    for y in range(512):
        for x in range(512):
            # Ocean gradient towards bottom right
            dist = (x + y) / 1024.0
            if dist > 0.72:
                # Ocean blue-green
                b = int(120 + np.sin(x/5.0)*3)
                g = int(75 + np.cos(y/5.0)*3)
                r = 20
                img[y, x] = [b, g, r]
            elif dist > 0.68:
                # Sand / Coastline beach
                img[y, x] = [140, 190, 200]
            else:
                # Land base
                noise = np.sin(x/40.0) * np.cos(y/40.0) * 15 + np.sin(x/10.0) * 5
                g = int(110 + noise)
                r = int(90 + noise * 0.6)
                b = int(60 + noise * 0.3)
                img[y, x] = [b, g, r]
                
    # 2. Add farm patches (agriculture grid)
    for i in range(8):
        for j in range(8):
            if (i + j) % 2 == 0 and (i * 50 < 300) and (j * 50 < 300):
                color = [
                    int(40 + np.random.randint(-5, 10)),
                    int(130 + np.random.randint(-15, 20)),
                    int(80 + np.random.randint(-10, 15))
                ]
                cv2.rectangle(img, (i*50 + 10, j*50 + 10), ((i+1)*50 - 5, (j+1)*50 - 5), color, -1)
                
    # 3. Add urban settlement (clusters of grey/white blocks)
    for (cx, cy) in [(120, 280), (280, 120)]:
        for dx in range(-20, 20, 8):
            for dy in range(-20, 20, 8):
                if np.random.rand() > 0.4:
                    cv2.rectangle(img, (cx + dx, cy + dy), (cx + dx + 5, cy + dy + 5), [160, 160, 160], -1)

    # 4. Winding River
    points = []
    for y in range(0, 400, 5):
        # Starts top-left (70, 0) and curves towards the ocean
        t = y / 390.0
        x = int((1.0 - t) * 60 + t * 360 + np.sin(y / 15.0) * 20)
        points.append((x, y))
        
    for idx in range(len(points) - 1):
        cv2.line(img, points[idx], points[idx+1], [110, 60, 15], thickness=16)
        cv2.line(img, points[idx], points[idx+1], [95, 45, 10], thickness=8)

    # Smooth the image to look like continuous satellite sensor data
    img = cv2.GaussianBlur(img, (5, 5), 0)
    return img

def generate_mountain_valley():
    img = np.zeros((512, 512, 3), dtype=np.uint8)
    np.random.seed(101)
    
    # Left and Right are mountains (rocky brown/dark forest green)
    # Center is a valley running top to bottom
    for y in range(512):
        for x in range(512):
            # Center of the valley is x = 256
            dist_from_center = abs(x - 256)
            
            # Elevation/Height
            elev = dist_from_center / 256.0 # 0 to 1
            
            # Noise
            noise = np.sin(x/15.0) * np.sin(y/15.0) * 12 + np.cos(x/5.0)*3
            
            if elev > 0.65:
                # Mountain peaks (high, brown/grey rock)
                val = int(80 + noise * 0.5 + (elev - 0.65) * 100)
                img[y, x] = [val - 20, val - 10, val + 10]
            elif elev > 0.3:
                # Mountain slopes (forest green/dark green)
                g = int(70 + noise + (0.65 - elev)*40)
                r = int(50 + noise * 0.5)
                b = int(45 + noise * 0.3)
                img[y, x] = [b, g, r]
            else:
                # Valley floor (light green, fertile flatland)
                g = int(120 + noise)
                r = int(105 + noise * 0.7)
                b = int(70 + noise * 0.4)
                img[y, x] = [b, g, r]

    # Draw agriculture fields in the valley floor
    for y_idx in range(50, 450, 40):
        # only close to center
        for x_idx in range(200, 300, 30):
            if np.random.rand() > 0.3:
                color = [
                    int(55 + np.random.randint(-8, 8)),
                    int(135 + np.random.randint(-15, 15)),
                    int(95 + np.random.randint(-10, 10))
                ]
                cv2.rectangle(img, (x_idx, y_idx), (x_idx + 24, y_idx + 32), color, -1)

    # Draw a river winding down the valley center
    points = []
    for y in range(0, 512, 8):
        # Winding centered around x=256
        x = int(256 + np.sin(y/25.0)*18 + np.cos(y/10.0)*5)
        points.append((x, y))
        
    for idx in range(len(points) - 1):
        cv2.line(img, points[idx], points[idx+1], [105, 55, 10], thickness=12)
        cv2.line(img, points[idx], points[idx+1], [90, 45, 5], thickness=6)

    img = cv2.GaussianBlur(img, (5, 5), 0)
    return img

def generate_agricultural_plains():
    img = np.zeros((512, 512, 3), dtype=np.uint8)
    np.random.seed(2026)
    
    # Flat landscape filled with a checkerboard of green/yellow/brown fields, with small ponds
    # Base plain
    for y in range(512):
        for x in range(512):
            noise = np.sin(x/50.0) * np.sin(y/50.0) * 10
            img[y, x] = [int(65 + noise*0.5), int(105 + noise), int(80 + noise*0.7)]
            
    # Draw field grid
    grid_size = 48
    for i in range(11):
        for j in range(11):
            # Diverse crop types: yellow-ish (wheat), bright green (young crop), dark green (pasture), brownish (fallow)
            crop_type = np.random.choice(['wheat', 'pasture', 'fallow', 'corn'])
            if crop_type == 'wheat':
                color = [80 + np.random.randint(0, 15), 145 + np.random.randint(0, 20), 160 + np.random.randint(0, 20)]
            elif crop_type == 'pasture':
                color = [45 + np.random.randint(0, 10), 125 + np.random.randint(0, 15), 75 + np.random.randint(0, 10)]
            elif crop_type == 'fallow':
                color = [60 + np.random.randint(0, 10), 95 + np.random.randint(0, 10), 105 + np.random.randint(0, 15)]
            else:
                color = [35 + np.random.randint(0, 10), 150 + np.random.randint(0, 15), 90 + np.random.randint(0, 10)]
                
            cv2.rectangle(img, (i*grid_size + 4, j*grid_size + 4), ((i+1)*grid_size - 4, (j+1)*grid_size - 4), color, -1)
            
    # Draw scattered circular/blob ponds (lakes)
    # Pond 1
    cv2.circle(img, (140, 180), 22, [115, 60, 10], -1)
    cv2.circle(img, (140, 180), 18, [100, 50, 5], -1)
    
    # Pond 2
    cv2.circle(img, (380, 350), 30, [115, 60, 10], -1)
    cv2.circle(img, (380, 350), 25, [100, 50, 5], -1)
    
    # Small irrigation canal joining them or cutting across
    points = [(50, 200), (140, 180), (250, 240), (380, 350), (460, 400)]
    for idx in range(len(points) - 1):
        cv2.line(img, points[idx], points[idx+1], [105, 55, 10], thickness=6)
        cv2.line(img, points[idx], points[idx+1], [90, 45, 5], thickness=3)

    img = cv2.GaussianBlur(img, (5, 5), 0)
    return img

def main():
    os.makedirs('samples', exist_ok=True)
    
    print("Generating sample 1: River Delta...")
    delta = generate_river_delta()
    cv2.imwrite('samples/river_delta.png', delta)
    
    print("Generating sample 2: Mountain Valley...")
    valley = generate_mountain_valley()
    cv2.imwrite('samples/mountain_valley.png', valley)
    
    print("Generating sample 3: Agricultural Plains...")
    plains = generate_agricultural_plains()
    cv2.imwrite('samples/agricultural_plains.png', plains)
    
    print("All sample images generated successfully in backend/samples/")

if __name__ == '__main__':
    main()
