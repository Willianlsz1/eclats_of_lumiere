# Combate vira CLEAVE total (substitui a âncora "1 kill por ataque")

A regra-âncora antiga (`CLAUDE.md`: *"máximo de 1 kill por ataque — kill rate nunca
excede o APS; isto ancora toda a economia"*) **é substituída**. Novo modelo (estilo
Gaiadon, referência que Willian joga): **cada ataque atinge TODOS os mobs na tela
(cleave total)**; cada mob morre quando o dano acumulado **≥ HP dele**. Quando você está
forte, um golpe limpa a onda inteira (renda alta); quando a onda/boss tem **HP demais
para o seu dano por hit**, você **trava** — e isso É a **Wall** (vá farmar Gear no
**Hollow**). Decidido com Willian em 2026-06-14.

## Consequência crítica (assumida conscientemente)
- **TODA a calibração atual é invalidada.** O orçamento de poder (~95 décadas), o
  simulador de sobrevivência (`tools/sim/`), e todas as fórmulas de renda por kill
  (lumens/xp/vestiges) foram construídos sobre o teto de 1 kill/ataque. **O jogo será
  recalibrado do zero** (Willian: "vamos recalibrar todo o game").
- A renda agora escala com **DPS × tamanho da onda** (não mais limitada a 1/ataque) →
  re-derivar lumens/xp/vestiges por kill e as curvas de HP/dano dos mobs.
- A **Wall** ganha definição mecânica limpa: *HP do mob/boss > dano por hit* (ou
  clear-rate baixo demais antes de morrer). Casa com o spine do ADR 0001.
- **`CLAUDE.md` precisa ser atualizado** (a regra-âncora citada lá deixou de valer).
- `packSizes` (mobs por onda) e sub-áreas (5→7-8) agora afetam renda diretamente
  (cleave) — relevante na recalibração.

## Status
accepted — mecanismo fechado (cleave total); **calibração numérica pendente** (pass próprio).
