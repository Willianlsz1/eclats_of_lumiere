# 🌌 Éclats of Lumière — Documentação dos Motores

Documentação dos arquivos-motor do jogo: arquitetura, fórmulas, e cada sistema
(stats, combat, HP, gear, passives, convergence, awaken).

---

## Arquitetura geral

Todo o jogo vive dentro de um único objeto global **`G`** (definido em `util.js`).
Cada arquivo "pendura" seu sistema nele — nunca há colisão de nomes.

| Arquivo | Papel |
|---|---|
| `util.js` | RNG, formatação, namespace `G` |
| `data.js` | **Conteúdo** (fonte da verdade): áreas, inimigos, gear base, raridades, balance |
| `state.js` | **Estado** do jogador + atributos derivados + save/load + idle |
| `combat.js` | **Loop central**: ataque automático, kill, morte, respawn |
| `gear.js` | Level-up das 6 peças fixas (custo geométrico) |
| `passives.js` | Árvore-Mundo (3 árvores × 15 nós) |
| `convergence.js` | Prestige / rebirth |
| `awaken.js` | 3ª fonte de poder (desbloqueia na Área 7+) |
| `loot.js` | Geração de itens (⚠️ **dormente** — gear virou peças fixas) |
| `inventory.js` | Inventário (dormente junto com loot) |
| `main.js` | Init + game loop (relógio) |

Fluxo de poder: **base do nível → gear → passivas → awaken**, todos somando em
camadas no `state.stats()`.

---

## ⚙️ Modelo de Stats em Camadas (`state.js`)

Todo atributo final é montado em **3 camadas** e fechado por uma fórmula única:

```
final = flat × (1 + pct/100) × mult
```

- **flat** (Primary) → soma direta
- **pct** (Bonus %) → bônus percentual
- **mult** (Multiplier) → multiplicadores compostos (passivas, awaken)

### Camada base (nível de personagem)

```js
atk.flat        = 1000 + (level − 1) × 2
hp.flat         = 1000 + (level − 1) × 2
atk.pct        += weaponUpgrades × 4        // forja: +4% ATK por reforço
crit.flat       = 5
atkSpeed.flat   = 1.0                        // ataques por segundo
critDmg.flat    = 50                         // → critMult = 1.5×
lumensBonus.flat = 10 + level × 0.05         // %
```

> A base é **alta e cresce devagar** de propósito: o nível é o "relógio" das
> áreas; o **poder vem do gear** (loot-driven). O Mapa 1 vai do nível 1 ao 5000.

### Derivados

```js
critMult        = 1 + critDmg/100
attackInterval  = clamp(1 / atkSpeed, 0.1, 5)   // segundos entre ataques
maxHp           = stats().hp
xpToNext        = ceil(14 × level)              // LINEAR (~1,4 kills/nível)
```

O resultado é **cacheado** (`_statsCache`); qualquer mudança chama
`invalidateStats()`.

---

## ❤️ Progressão de HP dos Monstros — modelo em DOIS NÍVEIS (`data.js`)

> O HP **não** é uma curva global no nível total — é calculado em duas camadas
> independentes, balanceáveis por área.

### Camada 1 — Horizontal (dentro da área): crescimento suave

Cada área tem `hp: [inicial, final]`. Dentro dela:

```
HP = hpInicial × (taxa ^ nívelDentroDaArea)

nívelDentroDaArea = nível − levelRange[0]
taxa = (hpFinal / hpInicial) ^ (1 / span)      // DERIVADA automaticamente
span = levelRange[1] − levelRange[0]
```

A taxa se ajusta sozinha para que o último nível da área chegue exatamente ao
`hpFinal`. O crescimento por nível fica imperceptível (+0,05% a +0,3%).

### Camada 2 — Vertical (entre áreas): salto brutal

Não há interpolação entre áreas. O `hpInicial` da próxima área é muito maior que
o `hpFinal` da anterior → **choque de dificuldade** intencional.

### Funções

```js
areaAt(level)        // descobre em qual área o nível cai
areaHpGrowth(area)   // taxa interna derivada de hp:[ini,fim] e span
mobHpAt(level, area) // (1) resolve a área, (2) aplica a curva interna
```

### Tabela atual (9 áreas)

| Área | Níveis | HP inicial | HP final | Taxa/nível | Salto vs. anterior |
|---|---|---|---|---|---|
| 1 | 1–80 | 2.000 | 2.500 | +0,283% | — |
| 2 | 81–350 | 40.000 | 80.000 | +0,258% | ×16 |
| 3 | 351–700 | 1.000.000 | 3.000.000 | +0,315% | ×12,5 |
| 4 | 701–1150 | 20.000.000 | 80.000.000 | +0,309% | ×6,7 |
| 5 | 1151–1700 | 400.000.000 | 1.500.000.000 | +0,241% | ×5,0 |
| 6 | 1701–2350 | 6.000.000.000 | 20.000.000.000 | +0,186% | ×4,0 |
| 7 | 2351–3150 | 40.000.000.000 | 100.000.000.000 | +0,115% | ×2,0 |
| 8 | 3151–4050 | 120.000.000.000 | 200.000.000.000 | +0,057% | ×1,2 |
| 9 | 4051–5000 | 220.000.000.000 | 350.000.000.000 | +0,049% | ×1,1 |

> Para rebalancear uma região, basta mudar o `hp: [inicial, final]` dela — a taxa
> se reajusta sozinha.

### ATK do mob (curva global separada)

```js
atk = mobAtkBase × mobAtkGrowth^(level − 1)   // 45 × 1,00085^(level−1)
```

---

## ⚔️ Loop de Combate (`combat.js`)

Estado transitório (não salvo): `enemy`, timers, projéteis em voo.

### Spawn de inimigo

```js
level   = clamp(playerLevel, area.range[0], area.range[1])  // mob acompanha você
atCap   = playerLevel ≥ area.range[1]
isBoss  = atCap && area.boss existe
hp      = mobHpAt(level, area)
atk     = mobAtkBase × mobAtkGrowth^(level−1)
```

Modificadores:

```js
boss:   hp ×4 · dmg ×1.5 · xp ×6           (bossHpMult/DmgMult/RewardMult)
raro:   8% chance → hp ×3 · dmg ×1.5 · reward ×3
raro+:  15% dos raros → hp ×6 · dmg ×2 · reward ×6
lumens/kill = hp × goldRatio (0.25)        // ancorado ao HP
xp/kill     = baseXp (10) × level
```

### Ataque e dano

- **Player**: a cada `attackInterval`, dispara projétil; crítico =
  `chance(crit/100)` → `dmg × critMult`.
- **Mob**: ataca a cada `enemyInterval` (0,99s).
- Dano aplica **no impacto** do projétil (`projectileTravel` 0,5s), ou na hora no
  modo idle.

### Morte e kill

```js
onDeath  → cura TOTAL, mob volta com vida cheia (a "parede de dificuldade")
onKill   → +Lumens, +XP, cura healOnKillFrac (10%) do maxHp, checkLevelUp()
boss morto → unlockNext() (libera próxima sub-área)
```

### Idle / offline

`simulateIdle(seconds)` roda o `tick` sem UI, em passos de
`max(interval, respawnDelay)`, limitado a 8h e 50.000 ticks.

---

## 🛡️ Gear — 6 peças fixas (`gear.js` + `data.gearBase`)

Modelo estilo Gaiadon: as peças são **permanentes** (não dropam, não trocam).
Você sobe o **nível** de cada uma com Lumens.

### Valor de um afixo

```js
affixValue = base + perLevel × (nível − 1)
```

(o multiplicador de raridade já está embutido em `base`/`perLevel` via `buildPiece`)

### Custo de level-up (GEOMÉTRICO)

```js
cost = gearCostBase × gearCostGrowth^(nível−1)   // 1100 × 1,05^(nível−1)
```

> A renda cresce exponencial (ancorada ao HP do mob), então o custo do gear
> também precisa ser geométrico — senão reinvestir trivializa o jogo.

### Raridade → afixos + teto

| Raridade | Afixos | Mult | Cap (nível) |
|---|---|---|---|
| Common | 1 | 1.0 | 500 |
| Magic | 2 | 1.4 | 600 |
| Rare | 3 | 1.9 | 700 |
| Epic | 4 | 2.6 | 800 |
| Legendary | 5 | 3.6 | 1000 |

### Peças e afixos (`gearBase`)

| Slot | Afixos (stat · layer · base/perLevel) |
|---|---|
| Weapon ⚔️ | Attack flat (0/20) · Attack pct (0/1) |
| Helmet 🪖 | HP flat (0/20) · Crit Damage flat (0/1) |
| Armor 🛡️ | HP pct (0/1) · XP flat (0/0.5) |
| Gloves 🧤 | Atk Speed flat (0/0.01) · Crit Rate flat (0.05/0.025) |
| Boots 🥾 | Lumens flat (5/1) · XP flat (2/0.5) |
| Cloak 🧥 | Crit Rate flat (0.05/0.025) · Attack pct (0/1) |

`reconcile()` reaplica a definição atual aos saves antigos, preservando nível e
raridade.

---

## 🌳 Árvore-Mundo / Passivas (`passives.js`)

3 árvores × 15 nós cada. Liberada na **1ª Convergence**. Moeda = **Pontos de
Convergence**.

| Árvore | Domínio | Multiplica |
|---|---|---|
| **Éclat** | Combate · dano | `atk.mult` (`dmgMult`) |
| **Vestige** | Economia | `lumensBonus.mult` + `xpBonus.mult` (`ecoMult`) |
| **Fracture** | Utilidade · HP | `hp.mult` (`hpMult`) |

### Estrutura

- 3 grupos de 5 nós por árvore. Maximizar um grupo (todos no `maxLevel` 12)
  libera o próximo.
- **Motores** (3 por árvore): compõem multiplicativamente → `engineMult^lv`
  (×1.52/nível).
- **Nós normais**: somam aditivo → `groupAddPct[grupo] × lv` (0.05 / 0.1 / 0.2).
- **Alavancas**: efeitos especiais (crit, atk speed, materiais).

### Fórmulas

```js
treeMult = (1 + Σ add) × Π motores            // base de cada árvore

unlockCost(i) = unlockLadder[pos] × groupMult[grupo]
                unlockLadder = [100,500,2500,12500,62500] · groupMult = [1,10,100]
nextCost(lv>0) = ceil(unlockCost × evoFactor(0.3) × evoRamp(1.3)^(lv−1))

// alavancas
critAddPts    = nível(Luminal Edge)     × 0.04 × 100   // pontos de crit
apsMult       = 1 + nível(Fracture Pulse) × 0.46
materialsMult = 1 + log10(1 + nível(Vestige Pull) × 0.75)
```

---

## 🔄 Convergence — Prestige (`convergence.js`)

O loop central: empurra fundo, **converge** (renasce), e os Pontos compram
passivas permanentes. Curva super-linear ("push before prestige", estilo Tap
Titans 2).

```js
gateLevel = 80     // nível mínimo para convergir
C = 80, k = 1.25   // escala e expoente do push

pointsFor(level) = level < 80 ? 0 : floor(C × (level / gateLevel)^k)
```

**Reseta:** nível (XP→0), Lumens, volta pra Área 1.
**Mantém:** gear, materiais, Pontos, passivas, áreas desbloqueadas, recordes,
awakens.

---

## ✨ Awaken — 3ª fonte de poder (`awaken.js` + `data.awakens`)

Pacotes de bônus **permanentes** (sobrevivem à Convergence). Desbloqueiam uma vez
gastando nível + Awakening Essence + Lumens. Essence dropa na **Área 7+**
(`awakenDropChance` 2% × `materialsMult`).

### Requisitos

```js
canUnlock = maxAreaUnlocked ≥ areaIndex
          && level ≥ a.level
          && awakenEssence ≥ a.essence
          && lumens ≥ a.lumens
```

### Aplicação (injeta nas camadas de stat)

```js
atkMult → atk.mult ×=    hpMult → hp.mult ×=
critDmg/crit/lumensBonus/xpBonus → .flat +=
```

### Definido hoje

| Awaken | Área | Nível | Essence | Lumens | Bônus |
|---|---|---|---|---|---|
| **First Light** | 7 | 2351 | 50 | 500.000 | atk ×2.5 · hp ×1.5 · +25% Lumens |

---

## 🧮 Constantes de Balanceamento (`data.balance`)

```js
mobAtkBase: 45         mobAtkGrowth: 1.00085
healOnKillFrac: 0.10   retreatOnDeath: 3
bossHpMult: 4          bossDmgMult: 1.5      bossRewardMult: 6
goldRatio: 0.25        baseXp: 10            dropChance: 0.35
respawnDelay: 1.0
gearCostBase: 1100     gearCostGrowth: 1.05
forgeCostBase: 20      forgeCostGrowth: 1.064
awakenDropChance: 0.02
```

> **HP do mob não está mais aqui** — migrou para o modelo em dois níveis
> (`hp:[ini,fim]` por área + `mobHpAt`).

---

## 🛠️ Util — fórmulas auxiliares (`util.js`)

```js
randInt(min,max) · randFloat(min,max) · chance(p) · pick(arr) · weightedPick([{item,weight}])
clamp(v,min,max)
fmt(n)  // 1234 → "1.23K"; unidades: K M B T Qa Qi (log10/3)
```
