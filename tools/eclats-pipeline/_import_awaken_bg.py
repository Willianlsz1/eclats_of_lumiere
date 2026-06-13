#!/usr/bin/env python3
"""Importa o fundo da aba Awakening (Downloads/background awaken.png) para
public/eclats/awakening/awaken_screen.{png,webp}. Uso pontual."""
from PIL import Image
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
src = Path.home() / "Downloads" / "background awaken.png"
dst = ROOT / "public" / "eclats" / "awakening"
dst.mkdir(parents=True, exist_ok=True)
shutil.copyfile(src, dst / "awaken_screen.png")
im = Image.open(src).convert("RGB")
im.save(dst / "awaken_screen.webp", "WEBP", quality=84, method=6)
print("OK", im.size, "webp", (dst / "awaken_screen.webp").stat().st_size // 1024, "KB")
