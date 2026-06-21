# Recorta a margem transparente ao redor do conteúdo (usa o canal alpha).
# NÃO remove branco (preserva miolos brilhantes). Uso: python trim.py <entrada> <saida>
import sys
from PIL import Image

thr = int(sys.argv[3]) if len(sys.argv) > 3 else 40  # ignora glow fraco abaixo do limiar
im = Image.open(sys.argv[1]).convert("RGBA")
mask = im.split()[3].point(lambda v: 255 if v >= thr else 0)
bbox = mask.getbbox()
if bbox:
    im = im.crop(bbox)
im.save(sys.argv[2])
print("OK:", sys.argv[2], im.size)
