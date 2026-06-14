#!/usr/bin/env python3
"""Audita imagens em public/eclats nao referenciadas pelo codigo.
Heuristica: um arquivo e 'usado' se algum token dele (caminho relativo, nome,
nome limpo, chave do manifesto ou prefixo da chave) aparece no codigo-fonte
(src/*.js|css + index.html + style.css), EXCLUINDO o manifesto auto-gerado."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
ECLATS = ROOT / "public" / "eclats"

# 1) blob do codigo-fonte (sem o manifesto assets.js)
blob = []
for ext in ("*.js", "*.mjs", "*.css"):
    for f in (ROOT / "src").rglob(ext):
        if f.name == "assets.js":
            continue
        blob.append(f.read_text(encoding="utf-8", errors="ignore"))
for extra in (ROOT / "index.html", ROOT / "style.css"):
    if extra.exists():
        blob.append(extra.read_text(encoding="utf-8", errors="ignore"))
SRC = "\n".join(blob)

# 2) mapa caminho->chave-pontilhada do manifesto
data = json.loads(re.search(r"const DATA = (\{.*?\});", (ECLATS.parent.parent / "src/data/assets.js").read_text(encoding="utf-8"), re.S).group(1))
val2key = {}
def walk(d, pre):
    for k, v in d.items():
        if isinstance(v, dict):
            walk(v, pre + [k])
        else:
            val2key[v] = ".".join(pre + [k])
walk(data, [])

STRIP = ["enemy_VERIFICAR_", "rare_VERIFICAR_", "boss_", "_VERIFICAR", "VERIFICAR_",
         "_alpha", "frame_", "nav_", "icon_"]

def cleaned(stem):
    s = stem
    for p in STRIP:
        s = s.replace(p, "")
    return s

# 3) varre as imagens (agrupa por stem; png/webp = 1 asset logico)
seen = {}
for p in sorted(ECLATS.rglob("*")):
    if p.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
        continue
    rel = str(p.relative_to(ECLATS).with_suffix("")).replace("\\", "/")
    seen.setdefault(rel, []).append(p.suffix.lower())

unused = []
for rel, exts in seen.items():
    name = rel.split("/")[-1]
    key = val2key.get(rel)
    cands = {rel, name, cleaned(name)}
    # prefixos pra caminhos dinamicos: tira digitos finais ('splash_t2'->'splash_t')
    # e tira o ultimo _segmento ('fruit_eclat'->'fruit', 'passives/fruit_eclat'->'passives/fruit_')
    cands.add(re.sub(r"\d+$", "", name))
    cands.add(re.sub(r"\d+$", "", rel))
    cands.add(re.sub(r"_[a-z0-9]+$", "_", name))
    cands.add(re.sub(r"_[a-z0-9]+$", "_", rel))
    if key:
        cands.add(key)
        cands.add(key.rsplit(".", 1)[0])  # prefixo (cobre chaves dinamicas)
    used = any(len(c) > 4 and c in SRC for c in cands)
    if not used:
        unused.append((rel, "+".join(exts), "no-manifest" if key is None else "key:" + key))

print(f"=== {len(unused)} assets NAO referenciados (de {len(seen)}) ===")
for rel, exts, info in sorted(unused):
    print(f"  {rel}  [{exts}]  {info}")
