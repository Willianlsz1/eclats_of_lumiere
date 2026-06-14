#!/usr/bin/env python3
"""Importa um banner de aba das passivas (Downloads/<src>.png) para
public/eclats/passives/banner_<tree>.{png,webp}. PRESERVA alpha.
Uso: python _import_passive_banner.py <src_sem_ext> <tree>
ex.: python _import_passive_banner.py frame1 eclat"""
from PIL import Image
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[2]
src_name = sys.argv[1] if len(sys.argv) > 1 else "frame1"
tree = sys.argv[2] if len(sys.argv) > 2 else "eclat"
src = Path.home() / "Downloads" / f"{src_name}.png"
dst = ROOT / "public" / "eclats" / "passives"
dst.mkdir(parents=True, exist_ok=True)
shutil.copyfile(src, dst / f"banner_{tree}.png")
im = Image.open(src).convert("RGBA")
im.save(dst / f"banner_{tree}.webp", "WEBP", quality=88, method=6)
print(f"OK banner_{tree}", im.size, "webp",
      (dst / f"banner_{tree}.webp").stat().st_size // 1024, "KB")
