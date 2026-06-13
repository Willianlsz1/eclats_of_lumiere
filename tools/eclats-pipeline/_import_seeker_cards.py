#!/usr/bin/env python3
"""Importa os 5 cards do Seeker (Downloads/tierN.png) para public/eclats/
characters/seeker/ como seeker_card_tN (png + webp). Uso pontual."""
from PIL import Image
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
src_dir = Path.home() / "Downloads"
dst_dir = ROOT / "public" / "eclats" / "characters" / "seeker"
dst_dir.mkdir(parents=True, exist_ok=True)

for n in range(1, 6):
    src = src_dir / f"tier{n}.png"
    if not src.exists():
        print("FALTANDO:", src); continue
    png_out = dst_dir / f"seeker_card_t{n}.png"
    webp_out = dst_dir / f"seeker_card_t{n}.webp"
    shutil.copyfile(src, png_out)
    im = Image.open(src)
    im = im.convert("RGBA") if (im.mode in ("RGBA", "LA") or "transparency" in im.info) else im.convert("RGB")
    im.save(webp_out, "WEBP", quality=82, method=6)
    print(f"OK t{n}: {png_out.name} ({png_out.stat().st_size//1024}KB) + "
          f"{webp_out.name} ({webp_out.stat().st_size//1024}KB) {im.size}")
