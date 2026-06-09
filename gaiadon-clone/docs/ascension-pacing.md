# Ascensão — Design (Caminho A)

> Decidido com o Willian. Modelo de **uma camada**, focado em escalar com o nível.
> Documento de direção — o balanceamento fino (números) é do sim do Claude Code.

## A ideia em uma frase

**Ascender faz cada nível valer mais.** Quanto mais você ascende, mais forte fica
cada level-up. É o motor do "jogo longo".

## O que muda no sistema atual

- **Mantém e vira a estrela:** `perLevelMult` — os stats ganhos por nível crescem a
  cada ascensão (hoje 1.03^ascensões). É a "escala com o nível".
- **Remove / reposiciona:** o multiplicador flat `ascMultiplier` (1.06 por ascensão).
  Motivo: o HP do inimigo também cresce 1.06 por ascensão (`enemy.ascGrowth`), então
  os dois se cancelam — o "+6% a todos os stats" não dá ganho real e só confunde.
  - Os **tier spikes** (×10/×50/×200/×1000) continuam — são os saltos grandes ao
    virar de tier, e esses NÃO são cancelados.

## Distribuição das 1000 ascensões

Quatro "eras" (tiers) de tamanho crescente — o começo passa rápido, o fim demora:

| Tier | Ascensões | Tamanho |
|---|---|---|
| Seeker | 0–49 | 50 |
| Illuminé | 50–199 | 150 |
| Radiant | 200–499 | 300 |
| Luminary | 500–999 | 500 |
| Transcendent | 1000+ | endgame |

Esticadas automaticamente pelo **requisito de nível**: cada ascensão exige +3 níveis,
então cada run fica um pouco mais longa que a anterior.

## Requisitos para ascender

- **Asc 1–15 (fase de conteúdo):** limpar um novo stage (região × dificuldade).
  Empurra o jogador a explorar o mapa.
- **Asc 16+ (fase de grind):** atingir o nível exigido = `30 + 3 × ascensões`.

## Quando ascender (decisão do jogador)

A ascensão é **escolha do jogador**, guiada pelo **muro de poder**:

- O muro já existe na estrutura: dentro de cada zona o HP sobe ~25× da 1ª à última
  wave (`internalScale: 25`). Perto do fim da zona você trava — esse é o muro.
- **Sinal de UI:** quando o ritmo cai (waves/min ou Essence/min despencando), o jogo
  mostra um aviso pulsante: **"⚡ Muro alcançado — ascensão recomendada."**
- Por que o muro é o momento certo: no muro sua Essence/hora cai pra perto de zero;
  uma run nova reconstrói rápido (gear + Vestiges) e alcança um muro mais fundo,
  rendendo mais Essence.

## Regra de ouro (checar no sim do Claude Code)

**O nível exigido tem que ser alcançável ANTES do muro.**
Se o jogador bate no muro mas ainda não atingiu o nível, ele trava em limbo (não
avança nem ascende). Se isso acontecer no sim, baixar `levelPerAscension` ou
`firstReqLevel`.

## Pendências

- Reavaliar a pista de 50 ascensões do Seeker (hoje "plana") agora que o flat mult sai.
- Confirmar no sim se a curva per-level + tier spikes sustenta o caminho até o Pinnacle.
