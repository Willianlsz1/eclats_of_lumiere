# SYSTEMS — Éclats of Lumière (Continente 1 / Era I)

> **FONTE DA VERDADE dos sistemas de progressão** do Continente 1 / Era I.
> Descreve o que o **CÓDIGO ATUAL** faz (`src/*.js`), alinhado ao `CANON_V2.md`
> (a fonte da verdade de *design*). Onde o código e o `CANON_V2` divergem, este
> doc descreve o **código**, mas sinaliza a divergência. Onde números são
> placeholders de balanceamento (Fase 3), está marcado **[PLACEHOLDER]**.
>
> Em caso de conflito de *design*, vale o `CANON_V2.md`; para *comportamento
> atual do jogo*, vale este doc + o código.

---

## 1. Visão geral do loop

O jogo é um idle RPG. O objeto global `G` agrega todos os módulos
(`G.data`, `G.state`, `G.combat`, `G.passives`, `G.memoires`, `G.awaken`,
`G.ascension`, `G.convergence`, `G.economy`, `G.gear`).

Loop de progressão (do micro ao meta):

1. **Matar inimigos** (`combat.js`) → dropam **Lumens** (e XP, materiais).
2. **Lumens → Gear** (`gear.js`): sobe o nível das 6 peças fixas; mais stats →
   mata mais rápido. Custo geométrico força reinvestir.
3. **Convergence** (`convergence.js`): renasce (reseta nível/área/run), recebe
   **Vestiges**.
4. **Vestiges → Passivas** (`passives.js`): 3 árvores permanentes; a árvore
   destrava na 1ª Convergence.
5. **Derrotar o Guardião (Área 9)** → libera o **Awaken / First Light**
   (`awaken.js`): herói passa de **Endormi → Seeker**, ganha bônus de stats e
   o Mapa 2 abre.
6. **Boss Final (Área 20, "The Gilded Hollow")** → fecha o Continente 1
   (`mapOneCleared = true`).
7. **Mémoires (Era I)** (`memoires.js`): descobrir → restaurar → subir Lv1–10
   pagando **Éclats**. Todas no Lv10 = **Era I Restaurada**.
8. **Ascensão I** (`ascension.js`): requer Awaken + Boss Final + Era I
   Restaurada → herói passa de **Seeker → Illuminate**. (Única ascensão do
   Continente 1.)

A "parede de dificuldade": se o Seeker morre antes de matar o inimigo, ele cura
por completo MAS o inimigo volta com vida cheia — é isso que faz o gear importar.

---

## 2. Estrutura do mundo

O **Continente 1** é um conjunto único, dividido em **2 mapas** (20 áreas no
total). A divisão é só de UI (uma tela por vez).

| Mapa | Nome | Áreas | Chefe final | Marco |
|---|---|---|---|---|
| **Mapa 1** | The Dreaming Wood | 9 (áreas 1–9) | **The Guardian** (Área 9) | derrotá-lo = Awaken + abre Mapa 2 |
| **Mapa 2** | **Cavernes Luminis** | 11 (áreas 10–20) | **The Gilded Hollow** (Área 20) | derrotá-lo = completa o Continente → Ascensão I |

> Nota de fidelidade: o `CANON_V2` chama o Mapa 1 de **"The Dreaming Wood"** como
> nome do *mapa*. No código (`data.js`), "The Dreaming Wood" é o nome da **Área 1**;
> as áreas 2–9 têm nomes próprios (ver tabela). O conjunto das áreas 1–9 é o Mapa 1.

### Mapa 1 — áreas 1–9 (definidas à mão em `data.js areas[]`)

| Área | Nome | levelRange | hp [ini, fim] | Boss | Mini Boss |
|---|---|---|---|---|---|
| 1 | The Dreaming Wood | 1–80 | 2.000 – 2.500 | The Waking Bloom | — (nenhum) |
| 2 | The Lantern Mire | 81–350 | 40 mil – 80 mil | The Drowned Lantern | Mirewarden |
| 3 | The Whispering Hollows | 351–700 | 1 mi – 3 mi | The Hollow Cantor | Hollow Echoling |
| 4 | The Moonlit Canopy | 701–1.150 | 20 mi – 80 mi | The Moonlit Sovereign | Canopy Stalker |
| 5 | The Sunken Grove | 1.151–1.700 | 400 mi – 1,5 bi | The Stillwater Maiden | Glassmere Sentinel |
| 6 | The Gilded Thicket | 1.701–2.350 | 6 bi – 20 bi | The Bramble King | Thornward Brute |
| 7 | The Hollow Cathedral | 2.351–3.150 | 40 bi – 100 bi | The Gilded Confessor | Cathedral Warden |
| 8 | The Weeping Roots | 3.151–4.050 | 120 bi – 200 bi | The Heartroot Mourner | Rootbound Colossus |
| 9 | The Hollow Sanctum | 4.051–5.000 | 220 bi – 350 bi | **The Guardian** | Sanctum Warden |

- Cada área nova reaproveita mobs das anteriores + 1 mob novo (pool cumulativo,
  ver `combat.enemyPool()`).
- **Área 1** é especial: sem Mini Boss e sem Elites (`areaHasElite` retorna false
  só para `id === 1`).
- Derrotar o **Guardião (Área 9, `areaIndex === 8`)** seta `guardianDefeated = true`
  — o gate do Awaken.

### Mapa 2 — áreas 10–20 (geradas por loop em `data.js`, [PLACEHOLDER])

Geradas programaticamente: nome `Cavernes Luminis — Reach N`, mobs reaproveitam
o pool tardio da Área 9. Faixas de nível/HP provisórias:

| Área | levelRange | hp [ini, fim] | Boss |
|---|---|---|---|
| 10 | 5.001–6.000 | 5e11 – 1e12 | Hollow Warden 10 |
| 11 | 6.001–7.000 | 2e12 – 5e12 | Hollow Warden 11 |
| 12 | 7.001–8.000 | 1e13 – 3e13 | Hollow Warden 12 |
| 13 | 8.001–9.000 | 6e13 – 1.5e14 | Hollow Warden 13 |
| 14 | 9.001–10.000 | 3e14 – 8e14 | Hollow Warden 14 |
| 15 | 10.001–11.000 | 2e15 – 5e15 | Hollow Warden 15 |
| 16 | 11.001–12.000 | 1e16 – 3e16 | Hollow Warden 16 |
| 17 | 12.001–13.000 | 6e16 – 1.5e17 | Hollow Warden 17 |
| 18 | 13.001–14.000 | 3e17 – 8e17 | Hollow Warden 18 |
| 19 | 14.001–15.000 | 2e18 – 5e18 | Hollow Warden 19 |
| 20 | 15.001–16.000 | 1e19 – 3e19 | **The Gilded Hollow** (Boss Final) |

- Áreas 10–19 têm Mini Boss `Deep Sentinel N`. A **Área 20** não tem Mini Boss
  fixo: usa `miniBossRandom` (sorteia entre todos os Mini Bosses já vistos, ver
  `pickMiniBoss`).
- Derrotar o Boss da **Área 20** (última área) seta `mapOneCleared = true` (fim
  do Continente 1, ver `markBossCleared`).

### Curva de HP em dois níveis (`mobHpAt` / `areaHpGrowth`)

O HP **não** é uma curva global no nível. É calculado em duas camadas:

1. **Horizontal (dentro da área):** crescimento exponencial suave. Cada área tem
   `hp: [hpInicial, hpFinal]`. A taxa é **derivada** para que o último nível da
   área chegue ao `hpFinal`:
   - `taxa = (hpFinal / hpInicial) ^ (1 / span)`, com `span = hi − lo`.
   - `HP = hpInicial × taxa ^ (nível − lo)`.
   - `span ≤ 0` ⇒ taxa 1 (HP constante).
2. **Vertical (entre áreas):** salto **brutal** sem interpolação. O `hpInicial`
   da próxima área é muito maior que o `hpFinal` da anterior (ex.: 2.500 → 40.000).
   É o "choque de dificuldade" intencional ao trocar de região.

O ATK do mob, por outro lado, segue uma **curva global no nível do mob**:
`atk = mobAtkBase × mobAtkGrowth^(nível−1)` (`mobAtkBase = 45`,
`mobAtkGrowth = 1.00085`).

---

## 3. Economia de 3 moedas

Hierarquia canônica: **Lumens < Vestiges < Éclats**.

| Moeda | De onde vem | Pra que serve | Onde mora |
|---|---|---|---|
| **Lumens** (✦) | inimigos comuns (todo kill) | subir nível do gear | `state.lumens` |
| **Vestiges** | **Convergence** (renascer) | comprar passivas | `state.vestiges` |
| **Éclats** | **Mini Boss / Boss** | restaurar / subir Mémoires | `state.eclats` |

- **Lumens por kill** = `maxHp do mob × goldRatio (0.25)`, depois multiplicado por
  `lumensBonus` (stats), multiplicadores dinâmicos de passiva e Mémoires (ver §5/§8).
- **Éclats:** `eclatsPerBoss = 1`, `eclatsPerMiniBoss = 1` por kill desses tipos
  [PLACEHOLDER]. Geridos por `economy.addEclats/getEclats` (clamp ≥ 0).
- **Decisão canônica (Éclat = o fragmento É a moeda):** o fragmento de luz que se
  coleta é o mesmo recurso gasto nas Mémoires (colisão temática intencional).

Além das 3 moedas há **materiais** (fundação econômica, `economy.js`), ainda sem
consumo ligado no jogo:
- `gearMaterials: { common, uncommon }` → futuras promoções de raridade.
- `awakenMaterials: { firstLight }` → consumido pelo Awaken First Light.

---

## 4. Camada de stats (`state.stats()`)

Modelo Gaiadon em camadas. Cada stat acumula três campos e finaliza com:

```
final = flat × (1 + pct/100) × mult
```

Fontes que somam nas camadas:

- **Base + nível de personagem:**
  - `atk.flat = 1000 + (level−1)×2`
  - `hp.flat  = 1000 + (level−1)×2`
  - `crit.flat += 5`, `critDmg.flat += 50` (×1.5 base), `atkSpeed.flat += 0.9`
  - `lumensBonus.flat += 10 + level×0.05`
  - Forja: `atk.pct += weaponUpgrades × 4` (+4% por reforço).
  - O nível é o **relógio das áreas**; o **poder vem do gear** (loot-driven).
- **Gear (6 peças fixas):** cada afixo soma na sua camada (`flat` ou `pct`),
  valor = `affixValue` (ver §12).
- **Awaken:** `G.awaken.applyTo(layer)` injeta `atkMult/hpMult/...` permanentes.
- **Passivas (LIVE):** `atkPct`, `hpPct`, `critRate`, `critDmg`, `lumensPct`,
  `xpPct`; capstones Éclat (×atk e ×hp) e Vestige (×lumens e ×xp).
- **HP → Dano (Iron Body):** após finalizar HP, injeta `HP_final × hpToDamage%`
  no `atk.flat`.

Derivados notáveis: `critMult = 1 + critDmg/100`; `atkSpeed` clampado em
`[0, 15]` aps; `attackInterval = 1/aps` (clamp `[1/15, 5]`s); XP p/ próximo nível
**linear**: `xpToNext = ceil(14 × nível)`. Cache em `_statsCache`, invalidado por
`invalidateStats()`.

---

## 5. Combate e inimigos (`combat.js`)

Loop automático: o Seeker ataca a cada `attackInterval`; o mob a cada `0.99s`
(`enemyInterval`). Com UI, o dano viaja como projétil (`projectileTravel = 0.5s`)
e aplica no impacto; no idle, aplica na hora.

### Tipos de encontro

`chooseEncounter` decide na prioridade **boss > miniBoss > elite > common/rare**:

| Tipo | Quando aparece | hpMult | dmgMult | rewardMult (XP) | Notas |
|---|---|---|---|---|---|
| **Common** | padrão | 1 | 1 | 1 | pode virar Raro |
| **Rare** | 8% dos commons | ×3 | ×1.5 | ×3 | nome de lore |
| **Rare+** | 15% dos raros | ×6 | ×2 | ×6 | nome de lore |
| **Elite** | chance `eliteChance` (3% base) por encontro; nunca na Área 1 | ×8 | ×1.8 | ×4 | [PLACEHOLDER] |
| **Mini Boss** | quando `miniBossProgress ≥ miniBossRequired` (50 kills) | ×15 | ×2.5 | ×10 | dá Éclats; [PLACEHOLDER] |
| **Boss** | no **cap de nível da área** e `!bossOnCooldown` | ×4 | ×1.5 | ×6 | dá Éclats; libera próxima área |

- **Thresholds são por sessão de área:** `miniBossProgress`, `bossProgress`,
  `bossOnCooldown` zeram ao trocar de área.
- **Respawn de Boss:** ao matar o Boss, entra em cooldown (`bossOnCooldown = true`)
  e o respawn exige `bossRespawnKillsRequired = 100` kills comuns
  (`bossProgress`) para voltar a aparecer [PLACEHOLDER].
- **Lumens por kill** (em `onKill`): `e.lumens × (1 + lumensBonus/100) ×
  dynLumensMult (passivas) × gainsMult (Mémoire de la Marche)`; depois, chance de
  ×2 por `doubleLumensChance` (Mémoire des Rires).
- **Dano por tipo** (`typeDamageMult`): multiplicadores dinâmicos de passiva
  (Bloodlust, Fractured Destiny, Ancient Memory, Perfect Cycle) **+** Slayer
  (`bossDmg` vs Boss/Mini Boss) e Exterminator (`eliteDmg` vs Elite), **×**
  `memoires.damageMult()` (Premier Matin).
- **Fôlego:** cada kill cura `healOnKillFrac = 10%` do HP máx. Ao **morrer**,
  cura total mas o encontro reinicia.
- `respawnDelay = 1.0s` entre matar um mob e o próximo aparecer.
- **Idle/offline** (`simulateIdle`): simula até 8h, com UI desligada.

---

## 6. Convergence (`convergence.js`)

Prestígio. **Não dá poder direto** — só **Vestiges** (moeda das passivas).

- **Gate = nível 80** (canônico, ~Área 2). `canConverge = level ≥ 80`.
- **Fórmula (estrutura canônica):** `Vestiges = Área + Bosses + Nível + Kills`,
  com pesos configuráveis. **Hoje só o componente de NÍVEL está ativo**
  (`weights = { area:0, boss:0, level:1, kills:0 }` [PLACEHOLDER]):
  - `levelTerm = floor(C × (nível/gate)^k)`, com `C = 80`, `k = 1.25`, e 0 abaixo
    do gate.
  - Modificadores de passiva Fracture sobre os pontos: `convPointsPct`,
    `convEfficiency`, `capstoneFracture` (multiplicam) e `convPointsMin`
    (piso garantido).
- **Reseta:** nível, XP, Lumens, `areaIndex`, contadores da run
  (`runKills/runBosses/runMaxAreaIndex`), thresholds de encontro; HP volta ao
  máximo; inimigo e projéteis são descartados.
- **Mantém:** gear, raridades, materiais, **passivas**, awaken, áreas
  desbloqueadas (`maxAreaUnlocked`), Vestiges, Éclats, Mémoires, recordes
  (`highestLevel`, `totalKills`).

---

## 7. Passivas (`passives.js`)

Três árvores: **Éclat** (combate), **Vestige** (economia), **Fracture** (meta).
Moeda = **Vestiges**.

> **Nota:** o `CANON_V2 §7` (revisado) confirma a estrutura **3 árvores × 15 nós
> (45)** que o código implementa — em **3 grupos de 5**. A simplificação antiga
> "5 por árvore" (`PASSIVES_V1`) foi superada na implementação. Cada nó tem efeito
> real e descrito; mecânicas memoráveis concentradas na Fracture.

### Regras gerais
- **Destrava na 1ª Convergence** (`unlocked = convergences ≥ 1`).
- **Nível máximo por nó:** 12 (`maxLevel`); **capstones = nível único (1)**.
- **Gating por grupo:** 3 grupos de 5 nós. Um grupo só abre quando **todos os
  nós compráveis do grupo anterior estão no máximo** (`groupUnlocked`). Nós
  adiados ao Mapa 2 não travam o grupo.
- **Custo:** `unlockLadder × groupMult` para o 1º ponto; depois evolução
  geométrica (`evoFactor 0.3`, `evoRamp 1.3`) [PLACEHOLDERS herdados].
- **Nós adiados ao Mapa 2** (`MAP2 = ["moreEnemies","gearXp"]`): indisponíveis
  (não compráveis, sem efeito) — exigem sistemas inexistentes.
- **Magnitudes (`UNIT`):** 1ª passagem **funcional e ajustável** na Fase 3 — comprar
  um nó já FAZ algo (não é 0).

### Efeitos LIVE vs DYNAMIC
- **LIVE** (entram no motor de stats estático): `atkPct`, `hpPct`, `critRate`,
  `critDmg`, `lumensPct`, `xpPct`.
- **DYNAMIC** (escalam com o estado do jogo, aplicados em combate/economia):
  `dmgPerKill` (kills da run), `dmgPerArea`/`lumensPerArea` (áreas alcançadas),
  `atkPerConvergence` (convergences), `globalPerCycle` (convergences/10).
- **Fragment Resonance** (`resonancePerConv`): escalar global no fim de
  `effects()` — `1 + (resonancePerConv/100) × convergences` multiplica **TODAS**
  as outras passivas.

### 🔴 Árvore ÉCLAT — "Combat & Vitality" (15 nós)
| # | Nó | Efeito (chave) | UNIT/nível | O que faz |
|---|---|---|---|---|
| 1 | ATK % | atkPct | 3% | +ATK |
| 2 | **Bloodlust** | dmgPerKill | 0,02%/kill | +dano por kill **na run** (zera na Convergence) |
| 3 | Crit Rate | critRate | 0,5% | +chance de crítico |
| 4 | Crit Damage | critDmg | 5 | +dano crítico |
| 5 | **Iron Body** | hpToDamage | 0,5% | converte parte do **HP final em ATK** |
| 6 | **Slayer** | bossDmg | 4% | +dano vs **Boss / Mini Boss** |
| 7 | **Exterminator** | eliteDmg | 4% | +dano vs **Elite** |
| 8 | ATK % | atkPct | 3% | +ATK |
| 9 | Crit Rate | critRate | 0,5% | +crítico |
| 10 | HP % | hpPct | 3% | +HP |
| 11 | ATK % | atkPct | 3% | +ATK |
| 12 | Crit Damage | critDmg | 5 | +dano crítico |
| 13 | HP % | hpPct | 3% | +HP |
| 14 | ATK % | atkPct | 3% | +ATK |
| 15 | **Hybrid Capstone** | capstoneEclat | 10% | multiplica **ATK e HP** (nó único) |

### 🟡 Árvore VESTIGE — "Economy & Farm" (15 nós)
| # | Nó | Efeito (chave) | UNIT/nível | O que faz |
|---|---|---|---|---|
| 1 | Lumens % | lumensPct | 4% | +Lumens |
| 2 | Lumens % | lumensPct | 4% | +Lumens |
| 3 | Material Quantity | matQuantity | 3% | +quantidade de materiais |
| 4 | Drop Rate | dropRate | 2% | +chance de drop |
| 5 | **Deep Explorer** | lumensPerArea | 2%/área | +Lumens por área alcançada |
| 6 | Material Common % | matCommonPct | 4% | +material Common |
| 7 | Material Uncommon % | matUncommonPct | 4% | +material Uncommon |
| 8 | Upgrade Cost Reduction | upgradeCostReduction | 2% | -custo de upgrade de gear |
| 9 | General Materials % | matGeneralPct | 3% | +todos os materiais |
| 10 | Promotion Cost Reduction | promotionCostReduction | 2% | -custo de promoção |
| 11 | Lumens % | lumensPct | 4% | +Lumens |
| 12 | XP % | xpPct | 4% | +XP |
| 13 | Drop Rate | dropRate | 2% | +chance de drop |
| 14 | Materials % | matGeneralPct | 3% | +todos os materiais |
| 15 | **Infinite Prosperity Capstone** | capstoneVestige | 10% | multiplica **Lumens e XP** (nó único) |

### 🔵 Árvore FRACTURE — "Metaprogression & World Rules" (15 nós)
> Fraca no início, escala até dominar. Concentra as mecânicas memoráveis.

| # | Nó | Efeito (chave) | UNIT/nível | O que faz |
|---|---|---|---|---|
| 1 | Vestiges % | convPointsPct | 5% | +Vestiges na Convergence |
| 2 | **Ancient Memory** | atkPerConvergence | 0,5%/conv | +ATK que cresce a cada **Convergence** |
| 3 | **Fractured Destiny** | dmgPerArea | 1%/área | +dano por **área alcançada** (permanente) |
| 4 | Vestiges % | convPointsPct | 5% | +Vestiges na Convergence |
| 5 | Awaken Materials % | awakenMatPct | 5% | +material de Awaken |
| 6 | Awaken Requirement Reduction | awakenReqReduction | 2% | -limiares numéricos do Awaken |
| 7 | Elite Chance | eliteChance | 1% | +chance de Elite |
| 8 | Lower Mini Boss Threshold | miniBossThreshold | 3% | -kills até o Mini Boss |
| 9 | More Simultaneous Enemies | moreEnemies | — | **adiado ao Mapa 2** (indisponível) |
| 10 | Gear XP | gearXp | — | **adiado ao Mapa 2** (indisponível) |
| 11 | **Perfect Cycle** | globalPerCycle | 5% | mult global a cada **10 Convergences** |
| 12 | **Fragment Resonance** | resonancePerConv | 0,1%/conv | cada Convergence **amplifica TODAS** as passivas |
| 13 | Convergence Efficiency | convEfficiency | 3% | +eficiência da Convergence |
| 14 | Awaken Efficiency | awakenEfficiency | 4% | amplifica os bônus do Awaken |
| 15 | **Hybrid Capstone** | capstoneFracture | 10% | amplifica o poder meta da conta (nó único) |

---

## 8. Mémoires (Era I) (`memoires.js`)

Três Mémoires da Era I, em ordem canônica:

| id | Nome | Pity (área garantida) | discoveryTable |
|---|---|---|---|
| `premierMatin` | du Premier Matin | até a Área 8 | 2% [PLACEHOLDER] |
| `desRires` | des Rires | até a Área 14 | 2% [PLACEHOLDER] |
| `deLaMarche` | de la Marche | até a Área 18 | 2% [PLACEHOLDER] |

### Ciclo de vida (estados)
`notFound → found → restored`. (Campo `state` string; nível separado.)

- **Descoberta** (`notFound → found`): por **drop** a cada kill
  (`rollDiscovery`, chance da `discoveryTable`) **+ pity por área** (`applyPity`):
  se a área atual ≥ o limite de pity da Mémoire e ela ainda está `notFound`, é
  garantida. Encontrada = sai da "tabela" (não pode ser re-rolada).
- **Restauração** (`found → restored`, entra no **Lv1**): paga **Éclats**
  (`RESTORE_COST = 1` [PLACEHOLDER]).
- **Níveis Lv1–Lv10** (`MAX_LEVEL = 10`): cada subida paga Éclats
  (`LEVEL_COSTS`, todos 1 [PLACEHOLDER]; a Fase 3 define a curva).
- **Era I Restaurada** (estado **derivado**, sem campo no save): quando **todas
  as 3** Mémoires estão no **Lv10** (`isEraRestored(1)`). Requisito da Ascensão I.

### Bônus mecânico (CANON_V2 §2 — Decisão 1)
Cada Mémoire tem um **verbo de jogo** distinto; o efeito escala com o nível e só
vale quando **restaurada** (`bonusLevel = 0` se não restaurada). Magnitudes em
`EFFECT_UNIT` [1ª passagem]:

| Mémoire | Mecânica | Fórmula no código | UNIT |
|---|---|---|---|
| **du Premier Matin** | **motor de dano** (×TODO o dano) | `damageMult = 1 + nível × 0.06` | 0,06 |
| **des Rires** | **proc**: chance de Lumens ×2 no kill | `doubleLumensChance = nível × 0.04` | 0,04 |
| **de la Marche** | **escala com áreas**: mult de ganhos cresce com áreas alcançadas | `gainsMult = 1 + nível × 0.015 × maxAreaUnlocked` | 0,015 |

> Nota: o `CANON_V2 §2` (revisado) confirma os 3 sabores como implementados —
> **Premier Matin = motor de dano** (×dano por nível), **des Rires = proc** de
> Lumens×2, **de la Marche = escala** com áreas. (O "ramp por kill" foi substituído
> pelo motor de dano simples; o ramp-por-kill vive hoje na passiva Bloodlust.)

---

## 9. Awaken / First Light (`awaken.js` + `data.js awakens[]`)

Evento permanente que **desperta o herói** (`Endormi → Seeker`). Único Awaken do
Continente 1: `first_light` (tier 1).

### Requisitos (`data.awakens[0].requirements`, números [PLACEHOLDER])
| Requisito | Valor | Como é checado |
|---|---|---|
| `area` | 9 | área alcançada (`maxAreaUnlocked + 1`, 1-based) |
| `guardian` | true | **derrotar** o Guardião da Área 9 (`guardianDefeated`) — gate canônico, independe do `area` |
| `level` | 4.051 | nível do personagem |
| `kills` | 0 | `totalKills` (acumulado, não reseta) |
| `convergences` | 8 | nº de Convergences |
| `materials` | `firstLight: 1` | consome `awakenMaterials.firstLight` |

- A passiva Fracture `awakenReqReduction` reduz os **limiares numéricos**
  (level/kills/convergences/materials) — **não** o gate de Área nem o do Guardião.
- `canAwaken` = existe + não concluído + todos os requisitos `met`.

### Efeito
- **Identidade:** o herói passa de **Endormi → Seeker** (a Ascensão é que checa
  `isDone("first_light")` para considerar o herói "desperto").
- **Bônus de stats** (`applyTo`, magnitudes [PLACEHOLDER]):
  `atkMult 2.5`, `hpMult 1.5`, `lumensBonus +25`. Aplicados como multiplicadores/
  flats nas camadas; a passiva `awakenEfficiency` amplifica esses bônus.

---

## 10. Ascensão (`ascension.js`)

Marco institucional / rank da Ordre. **Não** concede novos recursos ou camadas de
poder — só registra o marco e o rank.

### Escada de ranks (por nº de Ascensões)
| Rank | Como se obtém |
|---|---|
| **Endormi** | estado inicial (antes do Awaken) |
| **Seeker** | após o **Awaken** (First Light) |
| **Illuminate** | após a **Ascensão I** (fim do Continente 1) |
| **Éclairé** | Ascensão II (continentes futuros) |
| **L'Éveillé** | Ascensão III |
| **Lumière** | Ascensão IV (apex) |

No código: `RANKS = ["Seeker","Illuminate","Éclairé","L'Éveillé","Lumière"]`
indexado por `ascensions`; o rank é **"Endormi"** enquanto o First Light não
estiver concluído (`isAwakened`).

### Requisitos da Ascensão I (única no Continente 1)
| Requisito | Checagem |
|---|---|
| Awaken (First Light) | `awaken.isDone("first_light")` |
| Boss Final (Área 20) | `mapOneCleared` |
| Era I Restaurada | `memoires.isEraRestored(1)` (3 Mémoires no Lv10) |

`canAscend` exige `ascensions < 1` (só a Ascensão I existe no Continente 1) e
todos os requisitos atendidos. `ascend()` faz `ascensions += 1` → rank **Illuminate**.

---

## 11. Save / compatibilidade (`state.load()`)

- **Chave:** `eclats_save_v2` (localStorage; fallback em memória quando `file://`
  bloqueia o storage).
- **Shallow-merge:** `Object.assign(fresh(), loaded)` garante campos escalares
  novos em saves antigos. Objetos aninhados são reconciliados por módulo:
  - **Gear:** `G.gear.reconcile` reconstrói as 6 peças com a definição atual,
    preservando nível/raridade (e migrando raridades do modelo antigo de 5 tiers
    → Common/Uncommon).
  - **Economia:** `G.economy.reconcile` garante materiais e `eclats` (sem
    sobrescrever).
  - **Mémoires:** `G.memoires.reconcile` garante o campo, saneia estados/níveis
    inválidos.
  - **Passivas:** deep merge por índice, preservando níveis salvos e clampando ao
    novo teto de cada nó.
- **Migrações notáveis:**
  - `convergencePoints → vestiges` (CANON_V2 §5/7): soma e remove o campo antigo.
  - `awakenEssence → awakenMaterials.firstLight` (dobra a essência legada uma vez).
  - `awakensUnlocked` (legado) ↔ `awakens` (canônico): consolida a lista e
    sincroniza `awakenTier`.
- Após carregar: `invalidateStats()` e, se `hp ≤ 0`, preenche com o HP máximo.

---

## 12. Gear (`gear.js`) — referência de apoio

6 peças **fixas** (não dropam, não trocam): weapon, helmet, armor, gloves, boots,
cloak. Sobem de **nível** com **Lumens**.

- **Afixos por peça** (`gearBase`): cada afixo escala `valor = base + perLevel ×
  (nível − 1)`, em camada `flat` (Primary) ou `pct` (Bonus%). Ex.: weapon dá
  ATK flat (+20/nível) e ATK% (+1/nível); cloak dá Lumens; gloves dá crítico;
  boots dá attack speed.
- **Custo de nível** geométrico: `gearCostBase (1100) × gearCostGrowth (1.05)
  ^(nível−1)` — acopla à renda exponencial (forçando reinvestir). Reduzível pela
  passiva `upgradeCostReduction`.
- **Cap por raridade:** Common 500, Uncommon 1200 (Mapa 1 só tem essas duas).
- **Promoção** Common → Uncommon (por slot): exige estar no cap + materiais
  (`promotionCost`, [PLACEHOLDER]); só aumenta o cap, preserva o nível.
