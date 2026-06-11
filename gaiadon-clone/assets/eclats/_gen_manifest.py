#!/usr/bin/env python3
"""
Gera gaiadon-clone/assets/manifest.js a partir da arvore eclats/.
Mapa id -> caminho (sem extensao); helpers resolvem .webp com fallback .png
nativo (<picture> / image-set). Tambem emite flags (lowres, verify).
"""
from pathlib import Path
import json

ECLATS = Path(__file__).parent            # .../assets/eclats
ASSETS = ECLATS.parent                    # .../assets
GAMEROOT = ASSETS.parent                  # .../gaiadon-clone
BASE = "assets/eclats/"                   # prefixo a partir do index.html

IMG_EXT = (".png", ".jpg", ".jpeg")
SKIP = {"nav_icons_folha_branco_azul.png"}

def stem_rel(p: Path) -> str:
    """caminho relativo a eclats/, sem extensao, com / como separador."""
    rel = p.relative_to(ECLATS).with_suffix("")
    return str(rel).replace("\\", "/")

def clean_id(name: str) -> str:
    return name

# coletor por categoria
data = {
    "backgrounds": {}, "worldmap": {}, "seeker": {}, "frames": {},
    "icons": {"nav": {}, "currency": {}},
    "gear": {}, "passives": {"eclat": {}, "vestige": {}, "fracture": {}},
    "relics": {}, "enemies": {}, "bosses": {},
}
flags = {"lowres": [], "verify": []}
fallback_ext = {}   # relpath -> ".jpg" quando o original nao e PNG

for p in sorted(ECLATS.rglob("*")):
    if p.suffix.lower() not in IMG_EXT:
        continue
    if p.name.startswith("_") or p.name in SKIP:
        continue
    rel = stem_rel(p)               # ex: backgrounds/map1_dreaming_wood
    parts = rel.split("/")
    top = parts[0]
    stem = parts[-1]
    name = p.stem

    is_verify = "VERIFICAR" in name
    if is_verify:
        flags["verify"].append(rel)
    if p.suffix.lower() != ".png":
        fallback_ext[rel] = p.suffix.lower()

    if top == "backgrounds":
        key = name.split("_")[0]                    # map1..map5
        data["backgrounds"][key] = rel
        if "BAIXA-RES" in name or "print" in name:
            flags["lowres"].append(rel)
    elif top == "worldmap":
        key = "atlas" if name == "worldmap" else "continent1"
        data["worldmap"][key] = rel
    elif top == "characters":
        data["seeker"][name.replace("seeker_", "")] = rel   # t1
    elif top == "frames":
        key = name.replace("frame_", "").replace("_alpha", "")  # tier1 / enemy
        data["frames"][key] = rel
    elif top == "icons":
        sub = parts[1]
        if sub == "nav":
            key = name.replace("nav_", "")          # 1..7
            data["icons"]["nav"][key] = rel
        else:
            key = name.replace("icon_", "").replace("_alpha", "")
            data["icons"]["currency"][key] = rel
    elif top == "gear":
        data["gear"][name] = rel                    # edge_faded ...
    elif top == "passives":
        tree = parts[1]                             # eclat/vestige/fracture
        data["passives"][tree][name] = rel
    elif top == "relics":
        data["relics"][name] = rel                  # e1_matin ...
    elif top == "enemies":
        mp = parts[1]                               # map1..map5
        key = name.replace("enemy_VERIFICAR_", "").replace("rare_VERIFICAR_", "rare_")
        data["enemies"].setdefault(mp, {})[key] = rel
    elif top == "bosses":
        key = name.replace("boss_", "").replace("_VERIFICAR", "")
        key = key.replace("VERIFICAR_", "")
        data["bosses"][key] = rel

# valida que existe .webp irmao p/ cada entrada
missing_webp = []
def walk(d, path=""):
    for k, v in d.items():
        if isinstance(v, dict):
            walk(v, path + k + ".")
        else:
            if not (ECLATS / (v + ".webp")).exists():
                missing_webp.append(v)
walk(data)

data_json = json.dumps(data, indent=2, ensure_ascii=False)
flags_json = json.dumps(flags, indent=2, ensure_ascii=False)
fbext_json = json.dumps(fallback_ext, indent=2, ensure_ascii=False)

js = f"""// AUTO-GERADO por assets/eclats/_gen_manifest.py — nao editar a mao.
// Mapa id -> caminho (sem extensao, relativo a index.html). CP-0.
(function (global) {{
  const BASE = "{BASE}";
  const DATA = {data_json};
  const FLAGS = {flags_json};
  const FALLBACK_EXT = {fbext_json};   // relpath -> extensao do original (default .png)

  // resolve um id pontilhado (ex: "backgrounds.map1") -> caminho sem extensao
  function path(id) {{
    const v = id.split(".").reduce((o, k) => (o == null ? o : o[k]), DATA);
    if (v == null || typeof v !== "string") {{
      console.warn("[EclatsAssets] id desconhecido:", id);
      return null;
    }}
    return v;
  }}
  const rasterExt = (p) => FALLBACK_EXT[p] || ".png";
  const url = (id, ext) => {{ const p = path(id); return p ? BASE + p + (ext || ".webp") : ""; }};

  // <picture> com fallback raster nativo (sem JS de deteccao)
  function picture(id, opts) {{
    opts = opts || {{}};
    const p = path(id); if (!p) return "";
    const cls = opts.className ? ` class="${{opts.className}}"` : "";
    const alt = (opts.alt || "").replace(/"/g, "&quot;");
    const style = opts.style ? ` style="${{opts.style}}"` : "";
    return `<picture${{cls}}>`
      + `<source srcset="${{BASE}}${{p}}.webp" type="image/webp">`
      + `<img src="${{BASE}}${{p}}${{rasterExt(p)}}" alt="${{alt}}"${{style}} loading="lazy">`
      + `</picture>`;
  }}

  // background-image com fallback nativo via image-set()
  function bg(id) {{
    const p = path(id); if (!p) return "";
    return `image-set(url("${{BASE}}${{p}}.webp") type("image/webp"), url("${{BASE}}${{p}}${{rasterExt(p)}}"))`;
  }}

  global.EclatsAssets = {{ BASE, DATA, FLAGS, FALLBACK_EXT, path, url, picture, bg }};
}})(window);
"""

out = ASSETS / "manifest.js"
out.write_text(js, encoding="utf-8")

# relatorio
total = len(missing_webp)
print(f"manifest.js gerado em {out}")
print(f"  categorias: {', '.join(data.keys())}")
print(f"  flags.lowres: {flags['lowres']}")
print(f"  flags.verify: {len(flags['verify'])} itens")
print(f"  .webp faltando: {total} -> {missing_webp[:5]}")
