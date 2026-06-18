# Log de decisões — Base v3 (folha em branco)

> Registro cronológico das decisões de design da nova base. Cada entrada: data,
> decisão, motivo. A fonte da verdade consolidada é `base_v3_blank.md`.

## 2026-06-18 — Reset
- **Decisão:** apagar a lógica de jogo, preservar todo o visual/design, e replanejar
  a base e seus sistemas do zero (folha em branco).
- **Motivo:** o design acumulado (GDD v2, redesign 14/jun, ADRs) não refletia mais a
  direção desejada; recomeçar é mais limpo que emendar.
- **Execução:** motor removido / stubado (casca visual mantida), save zerado, docs de
  sistema antigos movidos para `docs/archive/`.
