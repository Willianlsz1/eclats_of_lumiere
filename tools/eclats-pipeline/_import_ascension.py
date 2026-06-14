#!/usr/bin/env python3
"""Importa a arte da tela de Ascension (CENA ÚNICA, estilo Maël/Lucius):
  Downloads/ascension.png -> public/eclats/ascension/hall.webp
A Séraphine (a Doyenne) já vem EMBUTIDA na cena — não há recorte/overlay.
"""
from pathlib import Path
from PIL import Image
import os

ROOT = Path(__file__).resolve().parents[2]
DL = Path(os.path.expanduser("~")) / "Downloads"
OUT = ROOT / "public" / "eclats" / "ascension"
OUT.mkdir(parents=True, exist_ok=True)

hall = Image.open(DL / "ascension.png").convert("RGB")
hall.save(OUT / "hall.webp", "WEBP", quality=88, method=6)
print("hall.webp", hall.size)
