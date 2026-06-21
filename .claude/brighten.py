# Clareia uma imagem (brilho + leve contraste). Uso: python brighten.py <entrada> <saida> [fator]
import sys
from PIL import Image, ImageEnhance

src = sys.argv[1]
dst = sys.argv[2]
factor = float(sys.argv[3]) if len(sys.argv) > 3 else 1.22

im = Image.open(src).convert("RGB")
im = ImageEnhance.Brightness(im).enhance(factor)
im = ImageEnhance.Contrast(im).enhance(1.05)
im.save(dst)
print("OK:", dst, im.size)
