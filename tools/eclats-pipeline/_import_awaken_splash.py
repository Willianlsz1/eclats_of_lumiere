#!/usr/bin/env python3
"""Importa splashes de cerimônia do Awakening (Downloads/'awaken N.png') para
public/eclats/awakening/splash_tN.{png,webp}. Roda com o tier como argumento,
ex.: python _import_awaken_splash.py 2"""
from PIL import Image
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[2]
tier = sys.argv[1] if len(sys.argv) > 1 else "2"
src = Path.home() / "Downloads" / f"awaken {tier}.png"
dst = ROOT / "public" / "eclats" / "awakening"
dst.mkdir(parents=True, exist_ok=True)
shutil.copyfile(src, dst / f"splash_t{tier}.png")
im = Image.open(src).convert("RGB")
im.save(dst / f"splash_t{tier}.webp", "WEBP", quality=84, method=6)
print(f"OK splash_t{tier}", im.size, "webp",
      (dst / f"splash_t{tier}.webp").stat().st_size // 1024, "KB")
