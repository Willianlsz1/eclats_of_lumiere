#!/usr/bin/env python3
"""Importa a arte da Sub-área 1 (Lanternroot Glade) do Downloads:
  icon1.png  -> ícone de nó (recorte distância-ao-fundo, lo=18/hi=55, trim)
               -> public/eclats/enemies/map1/lanternroot_glade.{png,webp}
  area1.png  -> background da sub-área (sem recorte)
               -> public/eclats/enemies/map1/lanternroot_glade_bg.webp
Uso pontual. Mesmo pipeline dos marcos (ilha sobre fundo navy chapado)."""
from PIL import Image
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DL = Path.home() / "Downloads"
DST = ROOT / "public" / "eclats" / "enemies" / "map1"
DST.mkdir(parents=True, exist_ok=True)

LO, HI = 18.0, 55.0  # limiar suave de distância-ao-fundo (em RGB 0-255)

def cutout_distance(im):
    """Alpha = distância de cada pixel à cor do fundo (medida pelos cantos)."""
    rgb = np.asarray(im.convert("RGB"), dtype=np.float32)
    h, w, _ = rgb.shape
    c = 24  # bloco de canto amostrado
    corners = np.concatenate([
        rgb[:c, :c].reshape(-1, 3), rgb[:c, -c:].reshape(-1, 3),
        rgb[-c:, :c].reshape(-1, 3), rgb[-c:, -c:].reshape(-1, 3),
    ])
    bg = np.median(corners, axis=0)
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    alpha = np.clip((dist - LO) / (HI - LO), 0.0, 1.0)
    out = np.dstack([rgb, alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")

def trim(im):
    bbox = im.split()[-1].getbbox()
    return im.crop(bbox) if bbox else im

# --- Ícone (recorte) ---
icon = trim(cutout_distance(Image.open(DL / "icon1.png")))
MAXD = 640  # 2x do tamanho de exibição do nó
if max(icon.size) > MAXD:
    s = MAXD / max(icon.size)
    icon = icon.resize((round(icon.width * s), round(icon.height * s)), Image.LANCZOS)
icon.save(DST / "lanternroot_glade.png")
icon.save(DST / "lanternroot_glade.webp", "WEBP", quality=84, method=6)
print("icone", icon.size, "->", (DST / "lanternroot_glade.webp").stat().st_size // 1024, "KB")

# --- Background (sem recorte) ---
bg = Image.open(DL / "area1.png").convert("RGB")
bg.save(DST / "lanternroot_glade_bg.webp", "WEBP", quality=84, method=6)
print("bg", bg.size, "->", (DST / "lanternroot_glade_bg.webp").stat().st_size // 1024, "KB")
