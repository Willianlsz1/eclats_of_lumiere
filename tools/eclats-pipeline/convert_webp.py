#!/usr/bin/env python3
"""
Éclats of Lumière — conversor PNG/JPG -> WebP (pipeline)
Uso no PC:  pip install pillow  ·  python convert_webp.py
Gera um espelho da árvore em ../eclats_assets_webp/ com qualidade 80.
Arquivos com transparência (alpha) são preservados.
"""
from PIL import Image
from pathlib import Path

SRC = Path(__file__).parent
DST = SRC.parent / 'eclats_assets_webp'
Q = 80

count = 0
for p in SRC.rglob('*'):
    if p.suffix.lower() not in ('.png', '.jpg', '.jpeg'):
        continue
    out = DST / p.relative_to(SRC)
    out = out.with_suffix('.webp')
    out.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(p)
    if im.mode in ('RGBA', 'LA') or 'transparency' in im.info:
        im = im.convert('RGBA')
        im.save(out, 'WEBP', quality=Q, method=6)
    else:
        im = im.convert('RGB')
        im.save(out, 'WEBP', quality=Q, method=6)
    count += 1
    print(f'  {p.relative_to(SRC)} -> {out.name}')
print(f'\n{count} arquivos convertidos em {DST}')
