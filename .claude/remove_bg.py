# Remove fundo branco E preserva transparência já existente; recorta ao conteúdo.
# Uso: python remove_bg.py <entrada> <saida>
import sys
from PIL import Image, ImageChops, ImageFilter

src = sys.argv[1]
dst = sys.argv[2]
# hi/lo: >=hi vira transparente; <=lo fica opaco; entre = rampa.
# erode: 1 = encolhe 1px a borda (mata halo) — use 0 p/ criaturas CLARAS/translúcidas
#        (água, vidro), senão o corpo pálido some junto com o fundo.
# Padrão = agressivo (bom p/ criaturas escuras). Suave: python remove_bg.py in out 252 240 0
hi = int(sys.argv[3]) if len(sys.argv) > 3 else 242
lo = int(sys.argv[4]) if len(sys.argv) > 4 else 200
erode = int(sys.argv[5]) if len(sys.argv) > 5 else 1

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
# erode 1px a borda do alpha p/ matar o halo branco residual (MinFilter = mínimo 3x3)
if erode:
    a = a.filter(ImageFilter.MinFilter(3))
im.putalpha(a)

# recorta ao conteúdo SÓLIDO (ignora glow/sparkles fracos que esticam o bbox)
solid = a.point(lambda v: 255 if v >= 40 else 0)
bbox = solid.getbbox()
if bbox:
    im = im.crop(bbox)

im.save(dst)
print("OK:", dst, im.size)
