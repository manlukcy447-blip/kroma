import zlib
import struct
import math
import os

def create_png(width, height, is_maskable=False):
    # RGBA format
    raw_data = bytearray()
    
    # Precompute center and scaling
    cx = width / 2.0
    cy = height / 2.0
    
    # Maskable has 15% safe margin
    scale = 0.75 if is_maskable else 0.88
    r_corner = width * (0.0 if is_maskable else 0.22)

    for y in range(height):
        # filter byte for scanline (0 = None)
        raw_data.append(0)
        for x in range(width):
            # Check rounded corner for non-maskable
            if not is_maskable:
                # Distance to nearest corner
                dx = max(0, abs(x - cx) - (cx - r_corner))
                dy = max(0, abs(y - cy) - (cy - r_corner))
                if dx * dx + dy * dy > r_corner * r_corner:
                    raw_data.extend([0, 0, 0, 0])
                    continue

            # Normalized coordinates (-1 to 1)
            nx = (x - cx) / (cx * scale)
            ny = (y - cy) / (cy * scale)
            
            # Diagonal gradient factor for background (dark slate/navy #0B0F19 to #04060A)
            diag = (x + y) / (width + height)
            bg_r = int(14 * (1 - diag) + 4 * diag)
            bg_g = int(22 * (1 - diag) + 7 * diag)
            bg_b = int(38 * (1 - diag) + 12 * diag)
            
            # Draw Shield: top flat-ish, sides vertical down to ~0.15, then taper to point at ny=0.85
            in_shield = False
            if -0.85 <= ny <= 0.85 and abs(nx) <= 0.70:
                if ny <= 0.15:
                    if abs(nx) <= 0.65:
                        in_shield = True
                else:
                    # Taper to point at (0, 0.85)
                    progress = (ny - 0.15) / 0.70
                    max_nx = 0.65 * (1.0 - progress * 0.95)
                    if abs(nx) <= max_nx:
                        in_shield = True
                        
            # Shield border
            is_shield_border = False
            if in_shield:
                # check boundary
                if (ny <= -0.80) or (abs(nx) >= 0.60 and ny <= 0.15) or (ny > 0.15 and abs(nx) >= 0.65 * (1.0 - ((ny - 0.15) / 0.70) * 0.95) - 0.08):
                    is_shield_border = True

            # Geometric 'K' Pillar (nx between -0.32 and -0.16, ny between -0.40 and 0.40)
            in_pillar = False
            if -0.32 <= nx <= -0.16 and -0.42 <= ny <= 0.42:
                in_pillar = True

            # 'K' Upper Branch: diagonal from (-0.16, -0.05) to (0.35, -0.45)
            in_upper = False
            # Line equation roughly: ny + 0.05 ≈ -1.0 * (nx + 0.16)
            d_diag1 = (nx - (-0.16)) - (-(ny - (-0.05)))
            if -0.16 <= nx <= 0.35 and -0.45 <= ny <= 0.10:
                # Check thickness along perpendicular
                perp = abs((nx - (-0.16)) + (ny - (-0.05)))
                if perp <= 0.18:
                    in_upper = True

            # 'K' Lower Branch: diagonal from (-0.16, 0.05) to (0.35, 0.45)
            in_lower = False
            if -0.16 <= nx <= 0.35 and -0.05 <= ny <= 0.45:
                perp = abs((nx - (-0.16)) - (ny - 0.05))
                if perp <= 0.18:
                    in_lower = True

            # Center diamond spark at (0.0, 0.0)
            in_spark = False
            if abs(nx) + abs(ny) <= 0.09:
                in_spark = True

            # Combine pixel color
            if in_spark:
                r, g, b, a = 255, 255, 255, 255
            elif in_pillar or in_upper or in_lower:
                # Cyan/Teal Gradient: #22D3EE (34, 211, 238) to #10B981 (16, 185, 129)
                t = (ny + 0.45) / 0.90
                t = max(0.0, min(1.0, t))
                r = int(34 * (1 - t) + 16 * t)
                g = int(211 * (1 - t) + 185 * t)
                b = int(238 * (1 - t) + 129 * t)
                a = 255
            elif is_shield_border:
                # Glowing cyan shield rim
                r, g, b, a = 6, 182, 212, 220
            elif in_shield:
                # Deep navy interior of shield #0D1629
                r, g, b, a = 13, 22, 41, 255
            else:
                # Background
                r, g, b, a = bg_r, bg_g, bg_b, 255

            raw_data.extend([r, g, b, a])

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    png_bytes = b'\x89PNG\r\n\x1a\n'
    png_bytes += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    png_bytes += chunk(b'IDAT', zlib.compress(bytes(raw_data), 9))
    png_bytes += chunk(b'IEND', b'')
    return png_bytes

sizes = [
    ('public/pwa-192x192.png', 192, 192, False),
    ('public/pwa-512x512.png', 512, 512, False),
    ('public/pwa-maskable-512x512.png', 512, 512, True),
    ('public/apple-touch-icon.png', 180, 180, False),
    ('public/favicon-32x32.png', 32, 32, False),
]

for path, w, h, maskable in sizes:
    png = create_png(w, h, maskable)
    with open(path, 'wb') as f:
        f.write(png)
    print(f"Generated {path} ({w}x{h}, size {len(png)} bytes)")

# Also create favicon.ico as a copy or 32x32 PNG (modern browsers accept PNG favicon or we write standard ICO)
with open('public/favicon.ico', 'wb') as f:
    f.write(create_png(32, 32, False))
print("Generated public/favicon.ico")
