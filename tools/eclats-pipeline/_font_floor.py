#!/usr/bin/env python3
"""Piso global de tipografia: toda `font-size: <N>px` com N<16 vira 16px.
Também sobe os tokens --fs-sm (15) e --fs-xs (13) para 16. Decimais cobertos.
Varre style.css + src/**/*.css. Idempotente."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FLOOR = 16.0

files = [ROOT / "style.css"] + sorted((ROOT / "src").rglob("*.css"))
fs_re = re.compile(r"(font-size:\s*)([\d.]+)px")

total = 0
for f in files:
    if not f.exists():
        continue
    txt = f.read_text(encoding="utf-8")
    changed = 0

    def repl(m):
        global changed
        v = float(m.group(2))
        if v < FLOOR:
            changed += 1
            return f"{m.group(1)}16px"
        return m.group(0)

    txt = fs_re.sub(repl, txt)
    # tokens --fs-sm / --fs-xs
    new = txt.replace("--fs-sm: 15px;", "--fs-sm: 16px;").replace("--fs-xs: 13px;", "--fs-xs: 16px;")
    if new != txt:
        changed += (txt.count("--fs-sm: 15px;") + txt.count("--fs-xs: 13px;"))
    txt = new

    if changed:
        f.write_text(txt, encoding="utf-8")
        total += changed
        print(f"{f.relative_to(ROOT)}: {changed} ajuste(s)")

print(f"\nTotal: {total} font-size(s) elevadas a 16px")
