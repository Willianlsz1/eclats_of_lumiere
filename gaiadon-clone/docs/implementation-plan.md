# Redesign — Plano de Implementação

> Como construir o redesign de progressão (`progression-redesign.md`) sem improviso.
> **Pré-requisito:** pasta livre (Claude Code não editando junto) — implementar exige mão única.
> Ordem: **mecânica primeiro, UI depois** (skin em cima do que já roda).

---

## Princípios

- Implementar com **números placeholder**; o balanceamento fino vem do sim depois.
- **Reusar** o máximo do que existe (combate por waves, gold sublinear, ratioByRegion, Vestiges).
- Uma fase por vez, testável, sem quebrar o build entre fases.

---

## Ordem de implementação (fases)

| Fase | O quê | Arquivos | Reusa / Reescreve |
|---|---|---|---|
| 0 | Janela limpa (CC parado) + branch/checkpoint | git | — |
| 1 | **Nível contínuo:** trocar região×dificuldade por nível → HP | `data.js`, `zones.js` | reescreve escala; reusa gold sublinear + ratio |
| 2 | **Combate/herói** no novo eixo (XP, nível do herói vs nível do mob) | `game.js` | reusa waves/packs |
| 3 | **Rebirth:** renomear ascension atual; +Attunement; Essence √(depth); tirar ascGrowth | `progression.js`, `data.js` | reusa Essence/Vestiges |
| 4 | **Ascension:** 5 tiers, gatekeepers, reset total, spikes, 5 Vestiges de era | `progression.js` | novo |
| 5 | **Loot/Essence por nível** (raridade e fontes escalam por nível, não dificuldade) | `loot.js` | adapta |
| 6 | **World Tier / NG+** (endgame infinito) | novo módulo | novo |
| 7 | **Migração de save** (jogadores do sistema antigo) | `migrate.js` | adapta |
| 8 | **UI:** World Map (2 visões), prestígio (2 abas), tela de combate | `index.html`, `render.js`, `ui.js`, css | design em cima |
| 9 | **Balanceamento** (sim do Claude Code mira os alvos do doc) | `data.js`, `tests/` | tuning |

---

## Decisões fechadas

- **D1 — o que é um "nível":** um nível = uma **wave** de hoje (pack de mobs); limpa → sobe pro
  próximo. Nós do mapa = grupos visuais de ~N níveis.
  - UI: **o nível some do HUD** — aparece discreto no próprio monstro ("Lv N").
  - UI: o **gatekeeper/chefe** ganha uma **moldura ornamentada** própria (crista + barra de vida
    brilhante), **recolorida por mapa/era**.
- **D2 — herói × mob:** **dois números separados.** Nível do herói (XP) = seu poder neste run,
  reseta no Rebirth. Nível do mob = sua profundidade (mostrado no monstro). A **distância** entre
  os dois = a dificuldade / o sinal do muro. Reaproveita o que já existe.
  - UI: **mostrar quanto XP cada inimigo dá ao morrer** (hoje é invisível) — e, idealmente, XP/seg.
- **D3 — HP por nível:** definido **por era** (HP de entrada → saída), interpolando geométrico
  dentro da banda (curva = `h0 × (h1/h0)^progresso`, reusa o `internalScale^progresso` atual).
  Cap base = **1e60** no nível 1 bilhão (prestígio multiplica por cima). Âncoras (sim afina):

  | Era | Níveis | HP base: início → fim |
  |---|---|---|
  | Auroral | 1 – 50 | 10 → 1e3 |
  | Umbral | 50 – 500 | 1e3 → 1e7 |
  | Crystalline | 500 – 50k | 1e7 → 1e16 |
  | Ashen | 50k – 1M | 1e16 → 1e30 |
  | Pinnacle | 1M – 1B | 1e30 → **1e60** |

- **Combate / kill-time:** dano por **tick** (ataque) = `(dano base + arma) × crít médio`; modelo
  **DPS contínuo** (tempo = HP ÷ DPS) com ticks visuais. **Âncora: ~4-5s** pra matar um mob *no seu
  nível*. O espectro emerge da distância poder×nível: re-limpando = ~1-2s; no nível = ~4-5s; muro = 10s+.
- **D5 — muro (sinal de Rebirth):** quando o kill-time passa de **~2,5× a âncora** (~10-12s),
  dispara a dica "Rebirth recomendado". (Saiu de graça do espectro de kill-time.)
- **D4 — loot:** superado pelo `equipment-redesign.md` — mobs dropam **materiais por era** (não
  itens); raridade vem do **upgrade** (material + marcos), não de drop aleatório.

## Decisões fechadas (continuação)

- **D7 — migração:** **reset total** — não há players ainda, e os sistemas mudam demais pra
  uma conversão fazer sentido. Save antigo é zerado no update.

## Adiado pro futuro

- **D6 — World Tier (endgame):** **adiado.** Risco identificado pelo Willian: um NG+ que
  "reseta tudo só pra ganhar um multiplicador" tende a ficar **massante** ("cheguei no endgame
  pra recomeçar do zero e ver um ×10?"). Quando voltar, mirar um endgame que **adiciona algo
  novo** (mecânica, variedade de build, metas, desafios) — não só reset por multiplicador.
  Não bloqueia o resto da implementação.

---

## O que NÃO muda (pra tranquilizar)

- Combate por waves/packs, archetypes, elites/champions.
- Gold sublinear, `ratioByRegion`, `waveMult` (viram "por banda de nível").
- Sistema de Vestiges/Essence (ganha papel maior).
- Os assets de armas por raridade/região que já criamos.

---

## Próximo passo

Trabalhar as decisões **D1 → D7** uma a uma (começando pela D1, que é a base de tudo).
Quando estiverem fechadas, este plano vira um checklist executável assim que a pasta liberar.
