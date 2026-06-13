#!/usr/bin/env python3
"""Importa o fundo do Codex (Downloads/ordre.png) para
public/eclats/codex/codex_screen.{png,webp}. Uso pontual."""
from PIL import Image
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
src = Path.home() / "Downloads" / "ordre.png"
dst = ROOT / "public" / "eclats" / "codex"
dst.mkdir(parents=True, exist_ok=True)
shutil.copyfile(src, dst / "codex_screen.png")
im = Image.open(src).convert("RGB")
im.save(dst / "codex_screen.webp", "WEBP", quality=84, method=6)
print("OK", im.size, "png",
      (dst / "codex_screen.png").stat().st_size // 1024, "KB · webp",
      (dst / "codex_screen.webp").stat().st_size // 1024, "KB")
