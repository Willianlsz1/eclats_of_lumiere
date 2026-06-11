#!/usr/bin/env python3
"""
Éclats — conversor PNG/JPG -> WebP q80, IN-PLACE (gera .webp ao lado do
original, mesma pasta). Preserva alpha. Ignora arquivos auxiliares (_*) e a
folha-fonte de ícones de nav. Espelho de referencia para fallback PNG.
"""
from PIL import Image
from pathlib import Path

SRC = Path(__file__).parent
Q = 80
SKIP_NAMES = {"nav_icons_folha_branco_azul.png"}

count = 0
skipped = 0
for p in sorted(SRC.rglob("*")):
    if p.suffix.lower() not in (".png", ".jpg", ".jpeg"):
        continue
    if p.name.startswith("_") or p.name in SKIP_NAMES:
        skipped += 1
        continue
    out = p.with_suffix(".webp")
    im = Image.open(p)
    if im.mode in ("RGBA", "LA") or "transparency" in im.info:
        im = im.convert("RGBA")
        im.save(out, "WEBP", quality=Q, method=6)
    else:
        im = im.convert("RGB")
        im.save(out, "WEBP", quality=Q, method=6)
    count += 1
print(f"{count} convertidos, {skipped} ignorados (.webp gerado in-place, q{Q})")
