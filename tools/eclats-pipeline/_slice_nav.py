#!/usr/bin/env python3
"""
Recorta a folha nav_icons_folha_branco_azul.png em ícones individuais.
Método: segmentação por vales de densidade (linhas -> colunas) sobre a
máscara de luminância, depois alpha por luminância (brilho -> alpha).
Saída: nav_1.png .. nav_N.png (esquerda->direita, linha de cima primeiro)
       + _contact_nav.png para conferência.
"""
from PIL import Image
import numpy as np
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "nav_icons_folha_branco_azul.png"

# --- parametros ---
SEG_THRESH = 95       # limiar p/ SEGMENTAR (isola os tracos brilhantes do glow)
ALPHA_FLOOR = 22      # luminancia <= isto vira totalmente transparente (alpha)
ALPHA_GAMMA = 0.85    # <1 reforca brilhos medios
PAD = 10              # respiro em volta de cada recorte (px)
DEBUG = True

def luminance(arr):
    # arr: HxWx3 float
    return 0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]

def runs(profile, thresh, min_gap, min_len):
    """Retorna [(start,end)] de trechos ativos; funde trechos separados por
    gaps menores que min_gap; descarta trechos menores que min_len."""
    active = profile > thresh
    segs = []
    i = 0
    n = len(active)
    while i < n:
        if active[i]:
            j = i
            while j < n and active[j]:
                j += 1
            segs.append([i, j])
            i = j
        else:
            i += 1
    # funde gaps pequenos
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [tuple(s) for s in merged if s[1] - s[0] >= min_len]

def main():
    img = Image.open(SRC).convert("RGBA")
    arr = np.asarray(img).astype(np.float32)
    W, H = img.width, img.height
    rgb = arr[..., :3]
    L = luminance(rgb)
    mask = L > SEG_THRESH

    print(f"Folha: {W}x{H}  pixels acesos(>{SEG_THRESH}): {int(mask.sum())}")

    # 1) bandas (linhas) — soma de pixels acesos por linha
    row_sum = mask.sum(axis=1)
    if DEBUG:
        prof = [int(row_sum[int(i * H / 48)]) for i in range(48)]
        print("row_sum/48:", prof)
    bands = runs(row_sum, thresh=W * 0.003, min_gap=int(H * 0.05), min_len=int(H * 0.08))
    print(f"Bandas detectadas: {len(bands)} -> {bands}")

    boxes = []
    for bi, (r0, r1) in enumerate(bands):
        band_mask = mask[r0:r1, :]
        col_sum = band_mask.sum(axis=0)
        if DEBUG:
            prof = [int(col_sum[int(i * W / 64)]) for i in range(64)]
            print(f"band {bi} col_sum/64:", prof)
        cols = runs(col_sum, thresh=(r1 - r0) * 0.008,
                    min_gap=int(W * 0.015), min_len=int(W * 0.03))
        for (c0, c1) in cols:
            # bbox apertado dentro do retangulo banda x coluna
            sub = mask[r0:r1, c0:c1]
            ys = np.where(sub.any(axis=1))[0]
            xs = np.where(sub.any(axis=0))[0]
            if len(ys) == 0 or len(xs) == 0:
                continue
            y0 = r0 + ys[0]; y1 = r0 + ys[-1] + 1
            x0 = c0 + xs[0]; x1 = c0 + xs[-1] + 1
            boxes.append((x0, y0, x1, y1))

    print(f"Icones detectados: {len(boxes)}")

    # alpha por luminancia (na imagem inteira, reaproveitada por crop)
    a = np.clip((L - ALPHA_FLOOR) / (255.0 - ALPHA_FLOOR), 0, 1) ** ALPHA_GAMMA
    a = (a * 255).astype(np.uint8)
    out_rgba = arr.copy()
    out_rgba[..., 3] = a
    out_img = Image.fromarray(out_rgba.astype(np.uint8), "RGBA")

    saved = []
    for idx, (x0, y0, x1, y1) in enumerate(boxes, start=1):
        bx0 = max(0, x0 - PAD); by0 = max(0, y0 - PAD)
        bx1 = min(W, x1 + PAD); by1 = min(H, y1 + PAD)
        crop = out_img.crop((bx0, by0, bx1, by1))
        name = f"nav_{idx}.png"
        crop.save(HERE / name)
        saved.append((name, bx1 - bx0, by1 - by0))
        print(f"  {name}  {bx1-bx0}x{by1-by0}  bbox=({x0},{y0},{x1},{y1})")

    # contact sheet para conferencia (fundo cinza)
    if saved:
        thumbs = [Image.open(HERE / n).convert("RGBA") for n, _, _ in saved]
        th = 96
        scaled = []
        for t in thumbs:
            r = th / t.height
            scaled.append(t.resize((max(1, int(t.width * r)), th)))
        gap = 10
        cw = sum(s.width for s in scaled) + gap * (len(scaled) + 1)
        contact = Image.new("RGBA", (cw, th + gap * 2), (60, 64, 72, 255))
        x = gap
        for s in scaled:
            contact.alpha_composite(s, (x, gap))
            x += s.width + gap
        contact.save(HERE / "_contact_nav.png")
        print("contact -> _contact_nav.png")

if __name__ == "__main__":
    main()
