#!/usr/bin/env python3
"""Importa a moldura ornamentada das passivas (Downloads/passivaframe.png) para
public/eclats/passives/passive_frame.{png,webp}. PRESERVA alpha (centro vazado)."""
from PIL import Image
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
src = Path.home() / "Downloads" / "passivaframe.png"
dst = ROOT / "public" / "eclats" / "passives"
dst.mkdir(parents=True, exist_ok=True)
shutil.copyfile(src, dst / "passive_frame.png")
im = Image.open(src).convert("RGBA")  # mantém transparência
im.save(dst / "passive_frame.webp", "WEBP", quality=88, method=6)
print("OK", im.size, "mode", im.mode, "webp",
      (dst / "passive_frame.webp").stat().st_size // 1024, "KB")
