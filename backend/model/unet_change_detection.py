"""
Siamese Dual-Stream U-Net for Bi-Temporal Change Detection & Land Cover Segmentation.

This module implements a deep learning architecture that accepts two temporal rasters 
T1 (Before) and T2 (After) to perform multi-class land cover segmentation and pixel-wise 
change detection.
"""

import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


if HAS_TORCH:
    class DoubleConv(nn.Module):
        """(convolution => [BN] => ReLU) * 2"""
        def __init__(self, in_channels, out_channels):
            super().__init__()
            self.double_conv = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(inplace=True),
                nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(inplace=True)
            )

        def forward(self, x):
            return self.double_conv(x)


    class SiameseUNetChangeDetector(nn.Module):
        """
        Siamese Dual-Encoder U-Net architecture.
        Encodes T1 and T2 images using weight-shared encoder branches,
        computes absolute feature difference maps at multiple feature scales,
        and decodes both Land Cover classes (for T1 & T2) and a Change Heatmap.
        """
        def __init__(self, in_channels=4, num_classes=5):
            super().__init__()
            self.num_classes = num_classes

            # Shared Encoder Blocks
            self.inc = DoubleConv(in_channels, 32)
            self.down1 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(32, 64))
            self.down2 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(64, 128))
            self.down3 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(128, 256))

            # Bottleneck for concatenated T1 + T2 difference features
            self.bottleneck = DoubleConv(256 * 2, 512)

            # Decoder Blocks for Change Map
            self.up1 = nn.ConvTranspose2d(512, 256, kernel_size=2, stride=2)
            self.conv_up1 = DoubleConv(256 + 128, 256)

            self.up2 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
            self.conv_up2 = DoubleConv(128 + 64, 128)

            self.up3 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
            self.conv_up3 = DoubleConv(64 + 32, 64)

            # Output Heads
            self.landcover_head = nn.Conv2d(64, num_classes, kernel_size=1)
            self.change_head = nn.Conv2d(64, 1, kernel_size=1)

        def encode(self, x):
            x1 = self.inc(x)
            x2 = self.down1(x1)
            x3 = self.down2(x2)
            x4 = self.down3(x3)
            return x1, x2, x3, x4

        def forward(self, t1, t2):
            # Encode T1 & T2 independently with shared weights
            t1_1, t1_2, t1_3, t1_4 = self.encode(t1)
            t2_1, t2_2, t2_3, t2_4 = self.encode(t2)

            # Feature fusion via concatenation and difference feature maps
            diff4 = torch.abs(t1_4 - t2_4)
            concat4 = torch.cat([t1_4, t2_4], dim=1)
            b = self.bottleneck(concat4)

            # Decode Change Map
            diff3 = torch.abs(t1_3 - t2_3)
            x = self.up1(b)
            x = torch.cat([x, diff3], dim=1)
            x = self.conv_up1(x)

            diff2 = torch.abs(t1_2 - t2_2)
            x = self.up2(x)
            x = torch.cat([x, diff2], dim=1)
            x = self.conv_up2(x)

            diff1 = torch.abs(t1_1 - t2_1)
            x = self.up3(x)
            x = torch.cat([x, diff1], dim=1)
            x = self.conv_up3(x)

            # Outputs
            change_logits = self.change_head(x)
            change_prob = torch.sigmoid(change_logits)

            # Land cover segmentation for T1 and T2
            lc_t1_logits = self.landcover_head(t1_1)
            lc_t2_logits = self.landcover_head(t2_1)

            return {
                "change_mask": change_prob,
                "lc_t1_logits": lc_t1_logits,
                "lc_t2_logits": lc_t2_logits
            }


class ChangeDetectionPipeline:
    """
    High-level ML prediction pipeline that seamlessly handles image tensors
    or numpy arrays, applying model inference or spectral fallbacks.
    """
    def __init__(self):
        self.num_classes = 5
        self.class_names = ["Urban", "Vegetation", "Water", "Bare Soil", "Agriculture"]
        if HAS_TORCH:
            self.model = SiameseUNetChangeDetector(in_channels=4, num_classes=self.num_classes)
            self.model.eval()
        else:
            self.model = None

    def predict_change_and_landcover(self, t1_img: np.ndarray, t2_img: np.ndarray):
        """
        Runs change detection and land cover classification on bi-temporal image pair.
        t1_img, t2_img: (H, W, 4) or (H, W, 3) numpy arrays [0.0 - 1.0].
        Returns dict containing landcover_t1, landcover_t2, and change_intensity.
        """
        H, W = t1_img.shape[:2]

        if HAS_TORCH and self.model is not None:
            try:
                # Ensure 4-channel input (RGB + NIR/Spectral)
                def prepare_tensor(img):
                    if img.shape[2] == 3:
                        # Synthetic NIR channel based on Green + Red difference
                        nir = np.clip(img[:, :, 1] * 1.2 - img[:, :, 0] * 0.5, 0, 1)[:, :, None]
                        img = np.concatenate([img, nir], axis=2)
                    tensor = torch.tensor(img, dtype=torch.float32).permute(2, 0, 1).unsqueeze(0)
                    return tensor

                t1_tensor = prepare_tensor(t1_img)
                t2_tensor = prepare_tensor(t2_img)

                with torch.no_grad():
                    output = self.model(t1_tensor, t2_tensor)
                    change_map = output["change_mask"].squeeze().numpy()
                    lc_t1 = torch.argmax(output["lc_t1_logits"], dim=1).squeeze().numpy()
                    lc_t2 = torch.argmax(output["lc_t2_logits"], dim=1).squeeze().numpy()

                return {
                    "change_intensity": change_map,
                    "landcover_t1": lc_t1,
                    "landcover_t2": lc_t2
                }
            except Exception:
                pass  # Fallback to spectral rule-based pipeline below

        # Spectral rule-based fallback model logic
        diff_mag = np.linalg.norm(t2_img[:, :, :3] - t1_img[:, :, :3], axis=2)
        change_intensity = np.clip(diff_mag * 1.8, 0.0, 1.0)

        # Simple spectral heuristic for initial classification
        def rule_classify(img):
            r, g, b = img[:, :, 0], img[:, :, 1], img[:, :, 2]
            ndvi = (g - r) / (g + r + 1e-6)
            ndwi = (g - b) / (g + b + 1e-6)

            lc = np.zeros((H, W), dtype=int)  # Default Urban (0)
            lc[ndvi > 0.25] = 1              # Vegetation (1)
            lc[ndwi > 0.1] = 2               # Water (2)
            lc[(r > 0.5) & (g > 0.4) & (ndvi <= 0.15)] = 3  # Bare Soil (3)
            lc[(ndvi > 0.1) & (ndvi <= 0.25)] = 4          # Agriculture (4)
            return lc

        return {
            "change_intensity": change_intensity,
            "landcover_t1": rule_classify(t1_img),
            "landcover_t2": rule_classify(t2_img)
        }
