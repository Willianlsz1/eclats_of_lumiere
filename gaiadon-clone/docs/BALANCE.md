# Gaiadon Clone - Balance System

> Documento de referencia para todo o sistema de balanceamento do jogo.
> Atualizado em: 2026-06-07

---

## Visao do Pacing

| Regiao | Meta de tempo real | Descricao |
|--------|-------------------|-----------|
| Plains (Auroral Fields) | ~1 dia | Primeiras horas. Tutorial natural. |
| Forest (Umbral Thicket) | +2 dias | Primeiro desafio real. Farming necessario. |
| Caverns (Crystalline Depths) | +3-4 dias | Grind consistente. |
| Desert (Ashen Reach) | +5-6 dias | Longo. Precisa de bom equipamento. |
| Pinnacle (The Pinnacle) | +1-2 semanas | Conquista gratificante e dificil. |

**Sessao tipica:** 30-60 min de play ativo + progresso offline entre sessoes.

---

## As 3 Alavancas de Balanceamento

### 1. Wave Multiplier por Regiao (`waveMult`)

Cada regiao tem um multiplicador sobre as waves base de cada dificuldade.
Isso controla diretamente quanto TEMPO o jogador gasta em cada regiao.

**Arquivo:** `js/data.js` — campo `waveMult` em cada `REGION`

| Regiao | waveMult | Normal | Hard | Nightmare | Total waves |
|--------|----------|--------|------|-----------|-------------|
| Plains | 1 | 50 | 80 | 120 | 250 |
| Forest | 15 | 750 | 1,200 | 1,800 | 3,750 |
| Caverns | 25 | 1,250 | 2,000 | 3,000 | 6,250 |
| Desert | 50 | 2,500 | 4,000 | 6,000 | 12,500 |
| Pinnacle | 100 | 5,000 | 8,000 | 12,000 | 25,000 |

**Waves base por dificuldade:** Normal=50, Hard=80, Nightmare=120

**Formula:** `totalWaves(regionIdx, diffIdx) = DIFFICULTIES[diffIdx].waves * REGIONS[regionIdx].waveMult`

**Onde ajustar:** Mudar `waveMult` no objeto da regiao em `REGIONS[]` no `data.js`.

---

### 2. Gold Sublinear (`HP^0.75`)

Gold por kill cresce MAIS DEVAGAR que o HP do inimigo.
Isso evita o "snowball de Fortune" onde mais gold = mais Fortune = mais gold = loop infinito.

**Arquivo:** `js/data.js` — `CONFIG.enemy.goldExponent` e `CONFIG.enemy.goldRatio`

**Formula anterior:** `gold = HP * 0.5` (linear)
**Formula atual:** `gold = HP^0.75 * 1.17` (sublinear)

| Localizacao | HP | Gold (linear) | Gold (sublinear) | Reducao |
|------------|-----|---------------|------------------|---------|
| Plains Normal w1 | 30 | 15 | 15 | 1x (igual) |
| Plains NM ultima | 75,000 | 37,500 | 6,579 | 5.7x menos |
| Forest Normal w1 | 300,000 | 150,000 | 15,001 | 10x menos |
| Forest NM ultima | 7,500,000 | 3,750,000 | 493,594 | 7.6x menos |
| Pinnacle NM ultima | ~10^18 | ~5x10^17 | ~3.7x10^13 | 13,500x menos |

**Calibragem:** `goldRatio=1.17` foi escolhido para que Plains Normal wave 1 tenha gold=15 (mesmo valor do sistema anterior).

**Onde ajustar:**
- `CONFIG.enemy.goldExponent` — mais baixo = gold cresce mais devagar (0.5=sqrt, 0.75=atual, 1.0=linear)
- `CONFIG.enemy.goldRatio` — escalar para manter Plains w1 gold ~15

---

### 3. Weapon Ratio Decrescente por Regiao (`ratioByRegion`)

Armas dropam com baseStat = `enemyHP * ratio`. Em regioes avancadas, o ratio diminui,
fazendo armas serem relativamente mais fracas → kills mais lentos → mais grinding.

**Arquivo:** `js/data.js` — `ITEM_BASES.Weapon.ratioByRegion`

| Regiao | Ratio | Kill time base (common) | Kill time base (legendary) |
|--------|-------|------------------------|---------------------------|
| Plains | 0.12 | ~8s | ~1.4s |
| Forest | 0.08 | ~12s | ~2.1s |
| Caverns | 0.05 | ~20s | ~3.3s |
| Desert | 0.035 | ~28s | ~4.8s |
| Pinnacle | 0.025 | ~40s | ~6.7s |

**Formula:** `weaponDmg = enemyHP * ratio * rarityMult * variance(0.7-1.3)`

**Kill time base** = `1 / (ratio * rarityMult)`. Nao inclui gold stats, crit, ou outros multiplicadores. O kill time real e menor por causa desses fatores.

**Onde ajustar:** Array `ratioByRegion` em `ITEM_BASES.Weapon` no `data.js`.

> **Nota:** Armor NAO tem `ratioByRegion` — seu ratio (1.5) e fixo. Isso e intencional:
> HP do player deve escalar normalmente para que ele sobreviva em regioes altas.

---

## Resultados da Simulacao (SIM 2: Multi-Ascension)

Simulacao de autoplay continuo, 20 ascensoes. Cada ascensao = uma run completa.

```
  Asc   Time       Lvl   DPS         Stgs   Deaths   Regiao
  ───   ────       ───   ───         ────   ──────   ──────
   1    14.0m       59   297          1     0        Plains Normal
   2    50.2m       99   8,176        2     2        Plains Hard
   3    28.5m      134   328K         3     2        Plains NM
   4    42.4m      216   92.1M        4     0        Forest Normal
   5    26.4m      263   8.31B        5     0        Forest Hard
   6    30.4m      305   414B         6     0        Forest NM
   7    21.4m      351   10.1T        7     0        Caverns Normal
   8    33.9m      397   1.14Qa       8     0        Caverns Hard
   9    45.2m      439   50.6Qa       9     0        Caverns NM
  10    33.7m      487   1.86Qi      10     0        Desert Normal
  11    53.8m      531   132Qi       11     0        Desert Hard
  12    80.4m      573   8.92Sx      12     0        Desert NM
  13    58.6m      619   381Sx       13     0        Pinnacle Normal
  14    93.6m      664   35.9Sp      14     0        Pinnacle Hard
  15   120.0m      706   1.46Oc      15     0        Pinnacle NM
  16     1.1m       75   318Qi       15     0        Farming
  17     0.9m       78   359Qi       15     0        Farming
  18     1.3m       81   387Qi       15     0        Farming
  19     1.4m       84   452Qi       15     0        Farming
  20     1.5m       87   509Qi       15     0        Farming
```

### Tempo por Regiao (Autoplay)

| Regiao | Autoplay total | Sessoes estimadas (~30min) | Tempo real estimado |
|--------|---------------|---------------------------|-------------------|
| Plains (Asc 1-3) | 93m | ~3 sessoes | ~1 dia |
| Forest (Asc 4-6) | 99m | ~3 sessoes | ~1-2 dias |
| Caverns (Asc 7-9) | 101m | ~3 sessoes | ~1-2 dias |
| Desert (Asc 10-12) | 168m | ~6 sessoes | ~3 dias |
| Pinnacle (Asc 13-15) | 272m | ~9 sessoes | ~4-5 dias |
| **TOTAL** | **733m (~12h)** | **~24 sessoes** | **~10-14 dias** |

### Acumulado (Tempo para Alcancar)

| Marco | Autoplay acumulado | Tempo real estimado |
|-------|-------------------|-------------------|
| Limpar Plains | 93m | ~1 dia |
| Limpar Forest | 192m | ~2-3 dias |
| Limpar Caverns | 293m | ~4-5 dias |
| Limpar Desert | 461m | ~7-8 dias |
| Limpar Pinnacle | 733m | ~12-14 dias |

---

## Constantes de Balanceamento Completas

### Regioes

| Regiao | startPower | waveMult | Gap vs anterior |
|--------|-----------|----------|-----------------|
| Plains | 30 | 1 | - |
| Forest | 300,000 | 15 | 10,000x HP |
| Caverns | 1,500,000,000 | 25 | 5,000x HP |
| Desert | 8,000,000,000,000 | 50 | 5,333x HP |
| Pinnacle | 40,000,000,000,000,000 | 100 | 5,000x HP |

### Dificuldades

| Dificuldade | powerMult | Waves base | Pack base/max |
|------------|-----------|-----------|---------------|
| Normal | 1x | 50 | 1-2 |
| Hard | 10x | 80 | 2-4 |
| Nightmare | 100x | 120 | 3-6 |

### Escala Interna (intrazona)

| Parametro | Valor | Efeito |
|-----------|-------|--------|
| `internalScale` | 25 | HP da ultima wave = 25x a primeira |
| `dmgRatio` | 0.15 | Enemy DMG = 15% do HP |
| `damageFactor` | 0.3 | Fracao do DMG aplicada/segundo |
| `ascGrowth` | 1.06 | HP/DMG inimigo x1.06 por ascensao (ADR) |

### Jogador

| Parametro | Valor | Efeito |
|-----------|-------|--------|
| `baseDamage` | 5 | Dano inicial |
| `baseHp` | 50 | HP inicial |
| `damagePerLevel` | 1.5 | +1.5 dano por nivel (x perLevelMult) |
| `hpPerLevel` | 8 | +8 HP por nivel (x perLevelMult) |
| `baseAttackSpeed` | 1.0 | Ataques por segundo |
| `perLevelGrowth` | 1.03 | Stats por nivel x1.03 por ascensao |
| `firstReqLevel` | 30 | Nivel minimo para 1a ascensao |
| `levelPerAscension` | 3 | +3 nivel requerido por ascensao |

### Gold Stats

| Stat | Custo base | Expoente | Por nivel |
|------|-----------|----------|-----------|
| STR (Strength) | 10 | 1.8 | +2 dano |
| VIT (Vitality) | 12 | 1.8 | +10 HP |
| AGI (Agility) | 15 | 2.0 | +0.03 atk speed |
| LCK (Luck) | 20 | 2.0 | +0.5% crit rate |
| FRT (Fortune) | 25 | 2.2 | +5% gold bonus |
| WIS (Wisdom) | 25 | 2.2 | +5% XP bonus |

**Custo do nivel N:** `baseCost * (N+1)^exponent`
**Resetam na ascensao.** Amplificados por Artifacts.

### Weapon Ratio por Regiao

```
ratioByRegion: [0.12, 0.08, 0.05, 0.035, 0.025]
```

### Raridades (multiplicador de baseStat)

| Raridade | Mult | Cap de nivel |
|----------|------|-------------|
| Common | 1.0x | 25 |
| Uncommon | 1.5x | 75 |
| Rare | 2.2x | 150 |
| Epic | 3.5x | 300 |
| Legendary | 6.0x | Infinito |

---

## Formulas Chave

### HP do Inimigo

```
enemyHP = startPower * powerMult * internalScale^progress * ascGrowth^ascensions
```

Onde:
- `startPower` = HP base da regiao
- `powerMult` = multiplicador da dificuldade (1/10/100)
- `progress` = (wave-1) / (totalWaves-1), de 0 a 1
- `totalWaves` = waves_base * waveMult
- `ascGrowth^ascensions` = escala com ascensoes do jogador

### Gold por Kill

```
gold = HP^goldExponent * goldRatio * archetypeReward * eliteTierReward
```

Onde:
- `goldExponent` = 0.75 (sublinear)
- `goldRatio` = 1.17

### Weapon baseStat

```
weaponDmg = _enemyHpAt(region, diff, wave) * ratio * rarityMult * variance
```

Onde:
- `_enemyHpAt` = HP SEM ascGrowth (armas baseadas no HP base)
- `ratio` = `ratioByRegion[regionIdx]` ou `0.12` default
- `rarityMult` = 1.0 a 6.0
- `variance` = random 0.7 a 1.3

### DPS do Jogador

```
charDmg = (baseDamage + (level-1) * damagePerLevel * perLevelMult + STR_bonus) * ascMultiplier
equipDmg = weapon.baseStat
totalDmg = (charDmg + equipDmg) * (1 + affix_dmgMult)
DPS = totalDmg * attackSpeed * critExpectedMult
```

### Gold Bonus (multiplicador de gold ganho)

```
goldBonus = (1 + affix_goldMult) * (1 + FRT_bonus) * ascMultiplier * regionMasteryBonus
```

### Ascensao

```
ascStagesRequired = min(ascensions + 1, totalStages)
ascLevelRequired = 30 + ascensions * 3
canAscend = level >= ascLevelRequired AND stagesCleared >= ascStagesRequired
```

---

## Problema Resolvido: Gold Stat Snowball

### O Problema

Com gold linear (`gold = HP * 0.5`), ao entrar em Forest (HP = 300K vs Plains = 30),
o gold por kill era 10,000x maior. Isso financiava gold stats massivos,
especialmente Fortune (que auto-compoe: mais gold = mais Fortune = mais gold).

Resultado: cada regiao era MAIS RAPIDA que a anterior.
Plains = 60m, Forest = 12m, Pinnacle = 2m.

### A Solucao (3 frentes)

1. **Gold sublinear (HP^0.75):** Gold cresce mais devagar que HP. Forest gold = 100x Plains (nao 10,000x).
2. **waveMult por regiao:** Mais waves = mais tempo bruto. Escala com a regiao.
3. **Weapon ratio decrescente:** Kill time sobe em regioes avancadas.

Resultado: cada regiao e MAIS LENTA que a anterior. Progressao natural e gratificante.

---

## ADRs Relevantes (nao relitigar)

- **ADR-0001:** ascGrowth = 1.06 para AMBOS player e inimigos. Nao muda.
- **ADR-0002:** Pure loot — sem upgrades manuais de equipamento.
- **ADR-0003:** Equipamento persiste entre ascensoes. Gold stats resetam.

---

## Como Tunar o Pacing

Para ajustar o tempo de uma regiao especifica:

1. **Mais rapido:** Diminuir `waveMult` da regiao
2. **Mais lento:** Aumentar `waveMult` da regiao
3. **Kill time maior:** Diminuir ratio em `ratioByRegion`
4. **Gold mais escasso:** Diminuir `goldExponent` (afeta TODAS as regioes)
5. **Gold mais generoso:** Aumentar `goldExponent` (afeta TODAS as regioes)

**Regra de ouro:** Dobrar `waveMult` aumenta o tempo em ~50-70% (nao 100%, por causa do gold stat snowball residual).

**Para rodar a simulacao:** `node tests/simulate.js`

---

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|--------|
| `js/data.js` | `waveMult` em cada REGION, `goldExponent`/`goldRatio` em CONFIG.enemy, `ratioByRegion` em ITEM_BASES.Weapon |
| `js/zones.js` | `totalWaves(regionIdx, diffIdx)` com waveMult, `isBossWave(wave, regionIdx, diffIdx)`, `enemyStatsFor` com gold sublinear |
| `js/loot.js` | `_enemyHpAt` e `generateBaseStat` usam waveMult e ratioByRegion |
| `js/progression.js` | `totalWavesCleared` usa waveMult por regiao |
| `js/game.js` | Callers atualizados para nova assinatura de `isBossWave` |
| `js/events.js` | Callers atualizados |
| `js/ui.js` | Callers atualizados |
| `js/game.test.js` | Testes atualizados para novos valores |
