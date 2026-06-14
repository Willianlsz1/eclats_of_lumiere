#!/usr/bin/env python3
"""
Gera src/data/assets.js (modulo ES) a partir de public/eclats/.
BASE = 'eclats/' (Vite serve public/ na raiz). Helpers path/url/picture/bg
com fallback raster nativo. Adaptado de tools/eclats-pipeline/_gen_manifest.py.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]      # tools/eclats-pipeline -> tools -> repo
ECLATS = ROOT / "public" / "eclats"
OUT = ROOT / "src" / "data" / "assets.js"
BASE = "eclats/"
IMG_EXT = (".png", ".jpg", ".jpeg")

def stem_rel(p):
    return str(p.relative_to(ECLATS).with_suffix("")).replace("\\", "/")

data = {
    "backgrounds": {}, "worldmap": {}, "seeker": {}, "frames": {},
    "icons": {"nav": {}, "currency": {}},
    "gear": {}, "passives": {"eclat": {}, "vestige": {}, "fracture": {}},
    "relics": {}, "enemies": {}, "bosses": {},
}
flags = {"lowres": [], "verify": []}
fallback_ext = {}

for p in sorted(ECLATS.rglob("*")):
    if p.suffix.lower() not in IMG_EXT:
        continue
    rel = stem_rel(p)
    parts = rel.split("/")
    top = parts[0]
    name = p.stem
    if "VERIFICAR" in name:
        flags["verify"].append(rel)
    if p.suffix.lower() != ".png":
        fallback_ext[rel] = p.suffix.lower()

    if top == "backgrounds":
        data["backgrounds"][name.split("_")[0]] = rel
        if "BAIXA-RES" in name or "print" in name:
            flags["lowres"].append(rel)
    elif top == "worldmap":
        data["worldmap"]["atlas" if name == "worldmap" else name.split("_")[0]] = rel
    elif top == "characters":
        data["seeker"][name.replace("seeker_", "")] = rel
    elif top == "frames":
        data["frames"][name.replace("frame_", "").replace("_alpha", "")] = rel
    elif top == "icons":
        if parts[1] == "nav":
            data["icons"]["nav"][name.replace("nav_", "")] = rel
        else:
            data["icons"]["currency"][name.replace("icon_", "").replace("_alpha", "")] = rel
    elif top == "gear":
        data["gear"][name] = rel
    elif top == "passives":
        # só passives/<arvore>/<icone> entra no manifesto; arquivos diretos em
        # passives/ (fundo da árvore, frutos) são referenciados por caminho direto.
        if len(parts) >= 3 and parts[1] in data["passives"]:
            data["passives"][parts[1]][name] = rel
    elif top == "relics":
        data["relics"][name] = rel
    elif top == "enemies":
        key = name.replace("enemy_VERIFICAR_", "").replace("rare_VERIFICAR_", "rare_")
        data["enemies"].setdefault(parts[1], {})[key] = rel
    elif top == "bosses":
        key = name.replace("boss_", "").replace("_VERIFICAR", "").replace("VERIFICAR_", "")
        data["bosses"][key] = rel

dj = json.dumps(data, indent=2, ensure_ascii=False)
fj = json.dumps(flags, indent=2, ensure_ascii=False)
ej = json.dumps(fallback_ext, indent=2, ensure_ascii=False)

js = f"""// AUTO-GERADO por tools/eclats-pipeline/gen_assets_module.py — nao editar a mao.
// Manifest de assets como modulo ES. BASE relativo (Vite serve public/ na raiz).
const BASE = "{BASE}";
const DATA = {dj};
const FLAGS = {fj};
const FALLBACK_EXT = {ej};

export function path(id) {{
  const v = id.split(".").reduce((o, k) => (o == null ? o : o[k]), DATA);
  if (v == null || typeof v !== "string") {{ console.warn("[assets] id desconhecido:", id); return null; }}
  return v;
}}
const rasterExt = (p) => FALLBACK_EXT[p] || ".png";
export const url = (id, ext) => {{ const p = path(id); return p ? BASE + p + (ext || ".webp") : ""; }};

// <picture> com fallback raster nativo
export function picture(id, opts) {{
  opts = opts || {{}};
  const p = path(id); if (!p) return "";
  const cls = opts.className ? ` class="${{opts.className}}"` : "";
  const alt = (opts.alt || "").replace(/"/g, "&quot;");
  const style = opts.style ? ` style="${{opts.style}}"` : "";
  return `<picture${{cls}}><source srcset="${{BASE}}${{p}}.webp" type="image/webp">`
    + `<img src="${{BASE}}${{p}}${{rasterExt(p)}}" alt="${{alt}}"${{style}} loading="lazy"></picture>`;
}}

// background-image com fallback nativo via image-set()
export function bg(id) {{
  const p = path(id); if (!p) return "";
  return `image-set(url("${{BASE}}${{p}}.webp") type("image/webp"), url("${{BASE}}${{p}}${{rasterExt(p)}}"))`;
}}

export const ASSETS = {{ BASE, DATA, FLAGS, FALLBACK_EXT, path, url, picture, bg }};
export default ASSETS;
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(js, encoding="utf-8")
total = sum(1 for _ in ECLATS.rglob("*.webp"))
print(f"src/data/assets.js gerado · {total} webp em public/eclats · verify={len(flags['verify'])} lowres={len(flags['lowres'])}")
