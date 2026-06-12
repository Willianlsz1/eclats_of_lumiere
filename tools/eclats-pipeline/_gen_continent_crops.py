#!/usr/bin/env python3
"""
Gera crops 2× provisorios dos continentes 2-5 a partir do worldmap atlas,
pelo mesmo metodo do continent1 (box ~0.54W x 0.37H centrado no cluster, 2x).
TODO(canon): crops finais (e posicoes de sub-area) viram do Willian.
Emite .png + .webp q80.
"""
from PIL import Image
from pathlib import Path

HERE = Path(__file__).parent
atlas = Image.open(HERE / "worldmap.png").convert("RGBA")
W, H = atlas.size
BOX_W, BOX_H = round(W * 0.54), round(H * 0.37)

# centros fracionais dos clusters (iguais aos pinos do mockup)
CENTERS = { 2: (0.70, 0.22), 3: (0.21, 0.60), 4: (0.73, 0.60), 5: (0.47, 0.84) }

for n, (fx, fy) in CENTERS.items():
    cx, cy = fx * W, fy * H
    x0 = max(0, min(W - BOX_W, round(cx - BOX_W / 2)))
    y0 = max(0, min(H - BOX_H, round(cy - BOX_H / 2)))
    crop = atlas.crop((x0, y0, x0 + BOX_W, y0 + BOX_H))
    crop = crop.resize((BOX_W * 2, BOX_H * 2), Image.LANCZOS)
    png = HERE / f"continent{n}_crop2x.png"
    crop.save(png)
    crop.save(HERE / f"continent{n}_crop2x.webp", "WEBP", quality=80, method=6)
    print(f"  continent{n}_crop2x  {crop.size}  box=({x0},{y0})")
print("crops 2-5 gerados (png+webp).")
