#!/usr/bin/env python3
"""Recorta a margem escura FORA da moldura dos cards do Seeker.
Acha o bounding box dos pixels claros (a moldura prateada + o personagem é o
conteúdo mais externo) e corta a borda navy que o PNG trouxe. Sobrescreve
png + webp em public/eclats/characters/seeker/. Uso pontual."""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
d = ROOT / "public" / "eclats" / "characters" / "seeker"
THRESH = 70   # luminância mínima pra contar como "moldura/conteúdo" (margem navy ~20)

for n in range(1, 6):
    png = d / f"seeker_card_t{n}.png"
    if not png.exists():
        print("FALTANDO:", png); continue
    im = Image.open(png).convert("RGB")
    W, H = im.size
    px = im.load()
    # luminância por linha/coluna: acha a 1ª/última onde aparece pixel claro
    def col_has_light(x):
        for y in range(0, H, 3):
            r, g, b = px[x, y]
            if (r * 299 + g * 587 + b * 114) // 1000 > THRESH:
                return True
        return False
    def row_has_light(y):
        for x in range(0, W, 3):
            r, g, b = px[x, y]
            if (r * 299 + g * 587 + b * 114) // 1000 > THRESH:
                return True
        return False
    left = next((x for x in range(W) if col_has_light(x)), 0)
    right = next((x for x in range(W - 1, -1, -1) if col_has_light(x)), W - 1)
    top = next((y for y in range(H) if row_has_light(y)), 0)
    bottom = next((y for y in range(H - 1, -1, -1) if row_has_light(y)), H - 1)
    box = (left, top, right + 1, bottom + 1)
    crop = im.crop(box)
    crop.save(png)
    crop.save(d / f"seeker_card_t{n}.webp", "WEBP", quality=82, method=6)
    print(f"t{n}: {W}x{H} -> {crop.size}  (margem L{left} T{top} R{W-1-right} B{H-1-bottom})")
