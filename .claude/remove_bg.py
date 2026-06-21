# Remove fundo branco E preserva transparência já existente; recorta ao conteúdo.
# Uso: python remove_bg.py <entrada> <saida>
import sys
from PIL import Image, ImageChops

src = sys.argv[1]
dst = sys.argv[2]
hi, lo = 248, 222  # >=hi vira transparente; <=lo fica opaco; entre = rampa

im = Image.open(src).convert("RGBA")
r, g, b, a0 = im.split()
mn = ImageChops.darker(ImageChops.darker(r, g), b)  # min(R,G,B) por pixel

lut = []
for v in range(256):
    if v >= hi:
        lut.append(0)
    elif v <= lo:
        lut.append(255)
    else:
        lut.append(int(255 * (hi - v) / (hi - lo)))
white_alpha = mn.point(lut)

# alpha final = mínimo(alpha original, remoção-do-branco)
# -> transparente se já era transparente OU se é branco
a = ImageChops.darker(a0, white_alpha)
im.putalpha(a)

# recorta ao conteúdo SÓLIDO (ignora glow/sparkles fracos que esticam o bbox)
solid = a.point(lambda v: 255 if v >= 40 else 0)
bbox = solid.getbbox()
if bbox:
    im = im.crop(bbox)

im.save(dst)
print("OK:", dst, im.size)
