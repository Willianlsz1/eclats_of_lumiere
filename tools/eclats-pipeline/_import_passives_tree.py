#!/usr/bin/env python3
"""Importa o fundo da Árvore das Passivas (Downloads/passivetree.png) para
public/eclats/passives/passives_tree.{png,webp}. Uso pontual."""
from PIL import Image
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
src = Path.home() / "Downloads" / "passivetree.png"
dst = ROOT / "public" / "eclats" / "passives"
dst.mkdir(parents=True, exist_ok=True)
shutil.copyfile(src, dst / "passives_tree.png")
im = Image.open(src).convert("RGB")
im.save(dst / "passives_tree.webp", "WEBP", quality=84, method=6)
print("OK", im.size, "webp", (dst / "passives_tree.webp").stat().st_size // 1024, "KB")
