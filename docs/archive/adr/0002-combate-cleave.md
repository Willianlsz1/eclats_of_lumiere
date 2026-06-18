# Combate: base SINGLE-TARGET; CLEAVE/AoE é desbloqueável

> **Revisado 2026-06-14** (durante o CP-1). A versão anterior dizia "combate vira cleave
> TOTAL, substitui a âncora 1-kill". **Estava errado** — Willian esclareceu: o cleave é um
> **unlock de progressão** (estilo Gaiadon: começa em 1 alvo, libera multi-alvo lá na
> frente), **não** o estado base.

**Base = SINGLE-TARGET:** cada ataque atinge **1 mob** (o primeiro vivo, frente → trás).
Vale a âncora **"máx 1 kill por ataque" → kill rate ≤ APS**, que **continua ancorando a
economia base**. O **CLEAVE / AoE** (atingir vários ou todos os mobs da onda) é
**DESBLOQUEÁVEL** por uma passiva/mecânica; quando ligado, o ataque **excede** o teto de
kills (renda escala com o nº de alvos × velocidade de limpar).

## Implementação (CP-1)
`playerAttack` atinge os primeiros `cleaveTargets()` mobs vivos. **`cleaveTargets()` = 1
por padrão** (= single-target, base correto). Quando o AoE for desbloqueado, retorna >1.
⏳ O **unlock real** (qual passiva concede, como escala — ex.: +1 alvo/nível, ou "todos")
será wirado num CP de passivas.

## Consequências
- A âncora **1-kill/ataque NÃO morreu** — ela vale no **base**; o cleave é um multiplicador
  que a ultrapassa **quando desbloqueado**. (Reverte o texto anterior; o `CLAUDE.md` e o
  redesign doc foram realinhados.)
- As passivas de AoE (**Overkill** = transbordo · **Shard Burst** = espalhar · **Luminal
  Explosion** = detonar a onda) **voltam a ser candidatas naturais a CONCEDER o cleave/AoE**
  (eu as havia "consertado" achando que cleave era base — reverter na sessão de passivas).
- A recalibração ainda vale, mas o "núcleo de combate" da Camada 1 = single-target base +
  o cleave como camada de unlock por cima.

## Status
accepted (revisado) — base single-target implementado (CP-1). **Mecanismo do unlock de
AoE: a definir** (sessão de passivas).
