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

## 2026-06-18 — Sessão de design da Base v3 (seções 1–9 fechadas)
Direção da nova base (detalhe em `base_v3_blank.md`):
- **Visão:** idle RPG casual no mundo Éclats; pilares = ficar forte + explorar + superar muros.
- **Loop:** idle farma parado (não avança sozinho); jogador volta p/ gastar + escolher rumo;
  muros duros se quebram com **prestígio**.
- **Combate:** 100% automático; single-target → AoE (desbloqueio); **muro = sobrevivência**
  (inimigos te matam) → defesa = avançar, dano = renda.
- **Espinha:** 1–2 mapas na base (resto = expansão); linear + backtrack; ~2–4 semanas.
- **Economia:** 2 moedas (farm Lumens + prestígio); **nível automático** dá stats base;
  renda = base por área × multiplicadores.
- **Prestígio:** 1 camada; reseta progresso, mantém moeda+árvore de multiplicadores
  permanentes (com ramos de HP/defesa obrigatórios).
- **Dungeons:** fora da base. **Gear:** com loot/raridade (sink de Lumens, 2 eixos de afixo).
  **Habilidades ativas:** nenhuma (combate auto).
- **Gear no prestígio:** **persiste inteiro** (nível + itens); prestígio reseta só Nível,
  posição e Lumens não gastos. Virada "macia"; calibrar p/ prestigiar ainda valer a pena.
