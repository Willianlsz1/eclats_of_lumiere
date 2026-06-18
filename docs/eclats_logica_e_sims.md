# Éclats of Lumière — Lógica, Simulações e Sims (referência consolidada)

> Documento gerado a partir do código real em `src/` e `tools/sim/` (estado 2026-06-18,
> schema v8 — recalibração **"VALORES NO MAPA"**). É um mapa de leitura: para os números
> canônicos e o "porquê" de cada decisão, as fontes da verdade continuam sendo
> `docs/eclats_gdd_final_v2.md`, `docs/eclats_lore_bible.md` e os docs de balanceamento
> (`eclats_balance_mapa_2026-06-18.md`, `eclats_balance_blank_2026-06-17.md`).
>
> Convenção: toda fórmula aqui reflete o que está implementado em `src/game/*` e
> `src/core/*`. Quando o código diverge do GDD antigo, vale o código (e este doc anota).

---

## 0. O que é Éclats of Lumière (contexto)

**Éclats of Lumière** é um **idle RPG para browser** — combate automático (idle-first) com
uma camada de progressão profunda. O jogador é um **Seeker**: alguém que carrega
fragmentos de luz e atravessa o mundo reunindo-os, ficando mais forte a cada um.

### A premissa (lore — fonte: `docs/eclats_lore_bible.md`)
- No princípio só havia **Or Ein Sof**, a *Luz Sem Fim*. Para que o mundo existisse, a luz
  precisou abrir espaço dentro de si — **se quebrou**. O evento: **HaShevirah** (a Quebra),
  hoje chamado **La Fracture**.
- Cada estilhaço dessa luz é um **Éclat** — espalhado pelo mundo (florestas, cavernas,
  ruínas), cada um guardando uma memória do que o mundo foi quando era inteiro.
- No vácuo que a luz deixou ganhou forma **Nihel, The Fracture** — ele *é* a Quebra. Teme a
  reunião acima de tudo (ela o apagaria) e, por isso, caça há milênios **Le Premier Éclat**,
  o fragmento que lembra de *ter sido inteiro* (o índice da biblioteca).
- A **jornada do Seeker** é uma viagem **do dourado ao branco-azul**: de carregador de
  fragmentos a encarnação da reunião (a *Convergence*). Cor conta a história: dourado = luz
  presa/corrompida; branco-azul = luz reunida; escuridão = os *Claimed* de Nihel;
  vermelho = território do Nada (Nil Aeternum).

> Idioma: o jogo in-game é em **inglês**; nomes próprios seguem camadas (criaturas em
> inglês, o mundo em francês, a verdade primordial em hebraico, o Nada em latim). Estes docs
> de design seguem em português.

### O jogo, em uma frase
Atravesse **5 mapas** (The Dreaming Wood → Cavernes Luminis → The Ashen Ruins → The
Fractured Peaks → **Nil Aeternum**), cada um dividido em sub-áreas, derrotando o **boss
final = Wall** de cada mapa para abrir o seguinte, até enfrentar **Nihel**. Esse é o
**Jogo base** (alvo de duração: ~30 dias para o casual). O **endgame** (prestige/loop
infinito) vem depois.

### Conceitos canônicos do design (fonte: `CONTEXT.md`, redesign 2026-06-14)
- **Sempre pra frente**: sem backtrack/reset de mapa. O mapa **farma sozinho na posição
  atual** (renda idle); o **jogador decide** quando empurrar para a próxima sub-área ou
  ficar farmando. A decisão idle clássica: limpar fácil e rápido vs. ir fundo (mais valor).
- **Wall (Parede)**: um *check de poder* — quando o HP do mob/boss passa do seu dano por
  hit, você travou. A Wall principal de cada mapa é o **boss final**; só a cruza com gear
  suficiente. É o principal dispositivo de pacing.
- **Dois lados do loop**: o **mapa principal = renda idle** (Lumens → nível do Gear;
  Vestiges → Passivas/Ascension; drip de Éclats → Mémoires); o **Hollow = objetivo ativo**
  (instância repetível que dropa materiais → raridade do Gear, e Reliquats). O Gear precisa
  das duas metades. *(Hollows e Reliquats são sistemas do redesign, ainda não no código.)*
- **Combate**: base **single-target** (âncora "1 kill/ataque"); **cleave/AoE** é unlock.
- **Camadas de poder** (tudo "soma" e a **Ascension multiplica**): Nível → Gear →
  Convergence → Passivas → Mémoires/Clarté → Ascension → Despertar. Detalhe nas seções 5–14.

> ⚠️ **Redesign em andamento** (2026-06-14): a direção mudou — Gold Stats removidos, Nível
> virou o stat base, Convergence redesenhada (sem reset de mapa), 5 mapas = jogo base, e
> novos sistemas (Hollows, Reliquats, habilidades ativas) ainda **não implementados**. Este
> doc descreve a **lógica que está no código hoje** (schema v8) + o contexto que a orienta.

---

## 1. Arquitetura

Idle RPG de browser, JavaScript puro (ES6 modules), build Vite. Sem framework de UI.

```
index.html · style.css
src/
  core/   loop · state · save · format · dev      (infra: tick, estado, persistência)
  game/   combat · stats · enemies · economy ·    (TODA a lógica de simulação)
          convergence · ascension · difficulty ·
          gear · passives · memoires · offline ·
          fatekeepers
  data/   constants · assets                       (constantes de balanceamento)
  ui/     ui · combat · map · player · gear · …    (apenas apresentação)
tools/sim/  *.mjs                                  (33 simuladores de calibração)
```

Princípio central: **um único objeto `state` mutável** (`src/core/state.js`) é
compartilhado por todos os módulos. A lógica nunca guarda estado próprio; recebe
`state` e o muta. Isso torna o jogo determinístico e permite que o **mesmo
`combatTick`** rode online, offline (§ Offline) e nos sims (`game_harness.mjs`).

---

## 2. Núcleo (`src/core/`)

### 2.1 Loop (`loop.js`)
Tick fixo de **100 ms** (`TICK_SECONDS = 0.1`) com acumulador: o `setInterval`
dispara perto de 100 ms, mas o tempo real manda — o acumulador converte o tempo
decorrido em N ticks fixos, mantendo a simulação determinística. Teto de catch-up
por frame = `MAX_CATCHUP_TICKS = 50` (ausências longas vão para o offline no reload).

### 2.2 Estado (`state.js`)
`createInitialState()` define todos os campos. Categorias:
- **Recursos**: `lumens`, `xpTotal` (vida → nível de display), `xpRun` (run → parede de
  Convergence), `vestiges`, `eclats`, `nitzotzot`, `materiais[4]` (T1–T4).
- **Prestígio**: `convergences`, `ascensions`, `despertares` (0..4 = T1..T5), `memoires[15]`,
  `passives.{eclat,vestige,fracture}[15]`.
- **Gear**: 6 peças `{level, rarity}`.
- **Posição**: `map`, `maxMap` (fronteira), `subarea`, `unlockedSubarea`,
  `bossDefeated[]`, `killsInSubarea`, `mapProgress{}`.
- **Runtime (não persistido)**: `enemies[]`, `wave`, `fx[]`, `player{hp,dead,respawnTimer,attackTimer}`.

`toSnapshot()` / `applySnapshot()` separam o que persiste do que é reconstruído no load
(pack de inimigos e timers são recriados). `applySnapshot` também **migra/normaliza**
saves antigos (ex.: `bossDefeated` de 5→8 posições, deriva `despertares` das ascensions).

### 2.3 Save (`save.js`)
`localStorage` chave `eclats_save_v1`, `SCHEMA_VERSION = 8`. Autosave a cada 10 s e no
`beforeunload`; grava `savedAt` (base do offline). Save de schema diferente é
**descartado** (sem migração automática ainda). `resetSave()` apaga e recarrega.

---

## 3. Combate (`src/game/combat.js`) — o motor

Modelo de **ONDAS**, estilo Gaiadon (ADR 0002 revisado).

### 3.1 Regras-âncora
- **BASE = single-target**: cada ataque atinge **1 mob** (o primeiro vivo) → vale a âncora
  *"máx 1 kill por ataque"* (kill rate ≤ APS, ancora a economia).
- **CLEAVE/AoE** é desbloqueável (passiva/mecânica). `cleaveTargets()` hoje retorna `1`;
  quando >1, o ataque excede o teto de kills. (Unlock real fica para um CP de passivas.)
- **Mob morto não respawna**: fica na cena (apagado) e para de causar dano. Só quando
  **toda a onda** é limpa surge a próxima onda (após `waveClearDelay = 0.3 s`).
- **Dano ao jogador** = Σ dano dos mobs **vivos** da onda (contínuo/s).
- **Regen**: `regenPerSec = 1% HP máx/s` + `regenOnKill` (atualmente **0**, virou passiva futura).
- **Morte**: respawn no mesmo lugar com HP cheio em `deathRespawnSeconds = 3 s`, zera
  `killsInSubarea` (o boss "some" e o muro precisa ser farmado de novo). Não há perdas.

### 3.2 `combatTick(state, dt)` — ordem de operações
1. **Morto** → só conta `respawnTimer`; ao zerar, revive com HP cheio e `resetPack`.
2. **Ataques** (só com alvo vivo): `attackTimer += dt`; enquanto `≥ 1/currentAPS`, dispara
   `playerAttack`. Sem alvo vivo, o timer pausa (não desperdiça golpes no beat de troca).
3. **Onda limpa** → após `waveClearDelay`, `nextWave` (deixa a morte animar).
4. **Dano recebido**: `packDps = Σ dmg dos vivos`; mitigação por armadura (§3.4):
   `armored = packDps² / (def + packDps)`; `hp -= armored × postArmorDR × dt`.
5. **Regen contínuo**: `hp = min(hpMax, hp + hpMax × regenPerSec × regenFactor × dt)`.
6. **Drip de Éclats** (pós-A1): `eclatsDripPerSec × dificuldade.rewardMult × #13 × #12`.
7. **Gate por nível** (`updateUnlockByLevel`): libera sub-áreas conforme o nível sobe.
8. **Morte** (hp ≤ 0): marca morto, zera onda e `killsInSubarea`.

### 3.3 Montagem da onda (`makeWave`)
- Contexto do player `ctx = {dmg, hp, level}` → inimigos são **relativos ao player** (§4).
- `pack = spawnPack(map, subarea, ctx)`; +mobs de **Fate Keeper A4** (`FATE.a4MobBonus = 6`,
  se `ascensions ≥ 4`) e da passiva **Void Awareness** (`passiveMobBonus`).
- **Boss**: só a **última** sub-área tem boss; quando `killsInSubarea ≥ bossKillThreshold`,
  o boss substitui `pack[0]`.
- **Dificuldade**: aplica `×hpMult` a HP **e** dano dos mobs.
- **Gilded** por último (§ Gear/Gilded).

### 3.4 Ataque (`playerAttack`)
- Crit rola **uma vez por ataque**: `base = damagePerHit × (isCrit ? critDamageMult : 1)`.
- Para cada alvo (até `cleaveTargets()`): aplica `bossMult` em boss
  (`gearBossDmgMult × #7 de la Chute`); mitigação de **defesa do inimigo**:
  `hit = raw² / (edef + raw)` (early `edef=0` → `hit = raw`).
- Ao zerar HP do alvo: `awardKill`, regen on-kill, e `killsInSubarea++` (ou `onBossKill`).

### 3.5 Progressão de área
- **Gate por nível** (sem guardião por sub-área): `subareaUnlockLevel(map, n)` usa
  `map.unlockLevels[n-1]` (Map 1: `[1,25,60,130,240,380,540,720,950]`) ou a malha geométrica.
- `onBossKill`: marca `bossDefeated`, abre a próxima sub-área, zera o muro.
- **Viagem entre mapas** (`travelToMap`): salva/restaura `mapProgress`; mapas antes da
  fronteira entram com tudo liberado.
- **Navegação** (`changeSubarea`/`enterSubarea`): respeita `unlockedSubarea`.

---

## 4. Inimigos (`src/game/enemies.js`) — relativos ao player

Decisão 2026-06-17 ("números grandes, mobs te seguem"): HP/dano/nível derivam do
**poder atual do player** (`ctx`), não de uma malha estática. Imune ao reset da
Convergence (mobs reescalam junto).

```
baselineDmg(lvl) = COMBAT.baseDmg + lvl × LEVEL.dmgPerLevel
baselineHp(lvl)  = COMBAT.playerBaseHp + lvl × LEVEL.hpPerLevel

mob.level = round(player.level × (1 + ENEMY.levelPerArea × (sub-1)))      // +3%/área
mob.hpMax = baselineDmg(player.level) × ENEMY.hitsToKill × ENEMY.areaHp[sub]   // ~2 golpes na entrada
mob.dmg/s = player.hp_real × ENEMY.dmgFrac × ENEMY.areaDmg[sub] / packSize     // ameaça persistente
recompensa = base fixa × ENEMY.areaReward[sub]                                 // fundo = mais ganho
```

A chave do *feel*: o HP do mob segue o **baseline do nível** (não o dano já
multiplicado). Logo os **multiplicadores do player** (gear/Convergence/Despertar)
**excedem** o baseline → você mata em menos golpes e sobrevive mais conforme investe.

- **Boss**: `hpMax × ENEMY.bossHpMult` (×100), `dmg × ENEMY.bossDmgMult` (×5).
- **Malha geométrica legada** (`subareaLevelRange`, `hpForLevel`, `dmgForLevel`): só usada
  pelo gate de unlock e por estimativas de UI/drip; **não dita** HP/dano dos mobs.

---

## 5. Stats derivados (`src/game/stats.js`)

**Nível** é o motor de stat base (substituiu os Gold Stats):
```
runLevel = max(1, floor((xpRun / LEVEL.curveDiv) ^ LEVEL.curveExp))     // div=25000, exp=0.42
```
`levelProgress` / `levelXpInfo` invertem a curva para a barra de XP.

**Convergence** (2 canais aditivos):
```
convMult       = 1 + CONVERGENCE.bonusPerConv × convergences      // dano/HP, +20%/conv
convLumensMult = 1 + CONVERGENCE.goldBonusPerConv × convergences  // Gold, +0,5%/conv
```

**Base flat** (nível + gear flat):
```
baseDamage = COMBAT.baseDmg + runLevel × LEVEL.dmgPerLevel + gearDamageFlat   // 50000 + 7500/nv
baseHp     = COMBAT.playerBaseHp + runLevel × LEVEL.hpPerLevel + gearHpFlat    // 100000 + 500/nv
```

**Dano e HP** (base × todos os multiplicadores de prestígio):
```
damagePerHit = baseDamage × convMult × gearDamageMult × passiveDmgMult × memoireDmgMult × ascMult × despertarMult
playerHpMax  = baseHp     × convMult × gearHpMult     × passiveHpMult  × memoireHpMult  × ascMult × despertarMult
dps          = damagePerHit × currentAPS × (1 + critChance × (critDamageMult − 1))   // valor exibido
```

**APS** (linear, sem Gold Stats):
```
currentAPS = min(COMBAT.apsCap, (COMBAT.baseAPS + gearApsFlat + despertarApsAdd) × passiveApsMult)
           = min(10, (0.90 + afixo Amuleto + 0.5/Despertar) × …)
```

**Crit** (provisório, GDD §16.6):
```
critChanceRaw = CRIT.baseChance(0) + gearCritAdd + passiveCritAdd + despertarCritRateAdd(+5%/tier)
critChance    = min(1, raw)
critDamageMult= (CRIT.baseDamageMult(1) + overflow×overflowFactor + gearCritDmgAdd + despertarCritDmgAdd(+400%/tier)) × memoireCritDmgMult
```
> Base de crit damage = **1** (×1): um crit não multiplica até você ganhar crit damage
> (Despertar +400%/tier, afixo do Manto, ou transbordo de crit chance >100%).

**Defesa / mitigação** (§4 do GDD):
```
veilFactor   = min(DEFENSE.veilCap(0.18), (gearDefesaMult−1)×DEFENSE.veilScale(0.015) × memoireSurvivalMult)
playerDefesa = playerHpMax × veilFactor
enemyDefesa  = max(0, DEFENSE.enemyDefBase(0) × (1−Weakened Void) × (1−Void Piercing))
```
A mitigação usa razão/armadura (`dano² / (def + dano)`): nunca 100%, auto-escala, e
com `def=0` (early) reproduz o comportamento original.

> *Shims de compat* (`strTotal`, `levelBonus`, `buyStat`, …) retornam neutros — existem só
> para a UI antiga não quebrar; somem no rework do Player UI.

---

## 6. Economia (`src/game/economy.js`)

Recompensa por kill **desacoplada do HP** do mob (que = seu dano → causava bola-de-neve).

```
LUMENS = ECONOMY.lumBase(4000) × areaReward[sub] × (mob.lumensMult Gilded)
         × convLumensMult × gearLumensMult × passiveEcoMult × memoireLumensMult
         × despertarLumensMult × (boss ? BOSS_LUMEN_MULT(5) : 1)

XP     = (mob.baseHpMax ?? hpMax) × (mob.xpMult Gilded) × ECONOMY.xpRatio(0.10)
         × gearXpMult × memoireXpMult × despertarXpMult        // acompanha SEU poder, sobe liso
         → soma em xpTotal (vida) E xpRun (parede de Convergence)

VESTIGES = ceil(subarea × 0.5) × 3^(map−1) × (boss ? VESTIGES.bossMult(10) : 1) × memoireVestigeMult
```
- **Materiais** (`awardMaterials`): drop por kill — `CRAFT.dropChance(1%)` do tier do mapa +
  `nextTierChance(0.1%)` do tier seguinte; boss = `bossChunk(30)` garantido. Tudo ×
  `materialYieldMult` (dificuldade × #13 × #5 × afixo Materiais × Vestige Pull).
- **Nitzotzot** (`awardNitzotz`): só nas Sub-áreas 3+; `dropChance(2%)`, boss `bossChunk(5)`.
- `perKillEstimate` espelha tudo para o painel do mapa (UI).

---

## 7. Gear (`src/game/gear.js`) — 6 peças, 5 raridades

Cada peça tem 1 afixo **primário** inerente + **secundários** que a raridade destrava em
ordem (determinístico).

| key | peça | slot | primário | secundários |
|-----|------|------|----------|-------------|
| edge | The Waning Edge | Arma | dmg | critDmg, bossDmg, erosao |
| vigil | The Silent Vigil | Elmo | hp | regen, hp |
| veil | Veil of Cinders | Manto | gilded | hp, regen, erosao |
| grasp | Grasp of the Unnamed | Manoplas | crit | critDmg, aps, dmg |
| reson | The Last Resonance | Amuleto | aps | crit, regen, dmg |
| band | Band of Dusk | Anel | lumens | xp, materiais |

**Modelo de valor (Gaiadon — 2 camadas lineares que multiplicam):**
```
primaryMult(L,R)   = (1 + L×bonusRate×rarityMult[R]) × (R≥1 ? 1 + L×multRate×rarityMult[R] : 1)
secondaryMult      = primaryMult ^ GEAR.secondaryExp(0.30)
```
> A camada **MULTIPLIER ×** (`multRate`) só destrava no **Incomum (R≥1)** — é o "salto" da
> raridade, não um "+10%". No Comum (Faded) a peça tem só flat + %.

**Afixos flat por nível** (somam à base, não multiplicam):
`gearDamageFlat`, `gearHpFlat`, `gearApsFlat`, `gearDefesaFlat` =
`Σ L × flatPerLevel[type] × rarityMult` (secundário × 0.30).

**Afixos de farm** (Lumens/XP/Materiais) — **regra Bloco 3: só flat/% aditivo, nunca o
motor ×**: `farmLinear = 1 + L × affixPctRate × rarityMult`. Materiais ainda é amortecido
por log: `gearMaterialDropMult = 1 + 0.5 × log10(bruto)`.

**Afixos planos agregados**: `gearCritAdd`, `gearCritDmgAdd`, `gearGildedChance`
(soma plana, com teto global `GILDED.chanceCap = 30%`).

**Custos e gates:**
```
levelCost(piece)  = min(1e100, GEAR.levelCostBase(800) × costRamp(1.07)^L × costMult[rarity])
levelCapFor       = GEAR.levelCap[rarity] (+ capPerAsc×ascensions só na raridade topo)
rarityUpCost      = CRAFT.rarityUpMaterial(40) materiais do tier (não Lumens)
canRarityUp       = R < maxRarity & R < mapRarityCap & minSetRarity ≥ R & materiais ≥ 40
```
> **Lockstep**: uma peça só sobe para R+1 se **todas** já estão ≥ R. **mapRarityCap**: Map 1
> trava no Incomum (`gearRarityCap = 1`). **Custo geométrico** padrão do gênero: barato cedo,
> dobra a cada ~10 níveis → teto-suave income-limited bem abaixo do cap duro.

**Refino de materiais**: `refinoRatio = 12:1`, só para cima (12 de Tn → 1 de Tn+1).

### 7.1 Gilded (variante de mob)
Substitui a Defesa (removida). A chance vem do afixo do Manto. Um Gilded é mais
**tanque** (`×hp`) e dá mais Gold/XP — **não** bate mais forte (`dmgMult=1`). O XP usa
`baseHpMax` (HP antes de inflar) → segue o `xpMult` do tier, não o `×hp`. Tiers:
`Gilded` (Map 1: hp×3.3, lumens×2.5, xp×2.2) e `Gilded Eidolon` (Map 2+, placeholder).

---

## 8. Convergence (`src/game/convergence.js`)

Prestígio leve, **sem reset de mapa**. Gate por **nível**; dá bônus aditivo permanente.
```
convGateLevel(c) = round(CONVERGENCE.gateLevelBase(40) × gateLevelGrowth(1.3)^c)
canConverge      = runLevel ≥ convGateLevel(convergences)
```
`doConverge`: `convergences++`; **head-start** — o nível da run **não** volta para 1, reseta
para `headstartFrac(0.5) × nível atingido` (convertido de volta em `xpRun`). Reseta
`xpRun` (com head-start) e `lumens`. **Mantém o gear** (sem strand), mapa/posição, Vestiges.
Renasce com HP cheio. É um **acelerador** (~×2 ao fim do Map 1), não um motor.

---

## 9. Ascension + Despertar (`src/game/ascension.js`)

### 9.1 Ascension (§8/§9) — marco por mapa
Derrotar o boss final do mapa + custo em Vestiges → `asc_mult` (dano **e** HP), bolsa de
Éclats, rank, próximo mapa. **A1 libera o drip de Éclats e as Mémoires.**
```
ascMult = Π ASCENSIONS[i].mult          // ×2 por marco (×16 total A1-A4)
canAscend = reqMet (boss final do mapa) & vestiges ≥ cost
```
`doAscend`: gasta Vestiges, `ascensions++`, soma `eclats × #12`, avança para o próximo mapa
(fronteira `maxMap` avança, novo mapa zerado).

| A | mapBoss | cost (Vestiges) | mult | eclats | rank |
|---|---------|-----------------|------|--------|------|
| 1 | 1 | 500.000 | ×2 | 100 | Illuminate |
| 2 | 2 | 1.900.000 | ×2 | 300 | Éclairé |
| 3 | 3 | 4.000.000 | ×2 | 900 | L'Éveillé |
| 4 | 4 | 8.000.000 | ×2 | 2700 | Lumière |
| 5 | 5 | 0 | ×1 | 0 | Lumière |

### 9.2 Despertar / Tier (§8 Passo 7) — desacoplado das ascensions
Tier T1..T5 = `SEEKER_RANKS[despertares]`. **Ato do jogador** na tela (não dispara sozinho).
```
despertarMult         = DESPERTAR.mult(2) ^ despertares        // ×2 dano E HP por tier
despertarCritRateAdd  = +5%/tier · despertarCritDmgAdd = +400%/tier
despertarApsAdd       = +0,5/tier · despertarLumensMult = +100%/tier · despertarXpMult = +40%/tier
```
**Gate em camadas** (`canDespertar`): profundidade liberada (`req.subarea`) + kills totais +
nível da run + materiais do T1 (consumidos no ato). Map 1 → T2 exige Sub 7, 6000 kills,
nível 480, 40 T1.

### 9.3 Drip de Éclats (§10)
`eclatsDripPerSec = (ECLATS_DRIP.coef(0.1) × hpFrontier ^ exp(0.9)) / 3600` (0 antes da A1),
onde `hpFrontier` = HP do boss da sub-área mais funda desbloqueada (malha legada).

---

## 10. Dificuldade (`src/game/difficulty.js`)

Re-roda mapas com `×hpMult` (HP e dano) e `×rewardMult` (materiais/Éclats). Abre na **A2**.

| modo | hpMult | rewardMult | minAsc | break_infinity |
|------|--------|-----------|--------|----------------|
| Normal | 1 | 1 | 0 | — |
| Difícil | 1e5 | 3 | 2 | — |
| Nightmare | 1e15 | 10 | 2 | **bloqueado** |
| Tormento | 1e30 | 30 | 2 | **bloqueado** |

`difficultyAvailable`: Normal sempre; break_infinity sempre bloqueado; senão exige A2 +
sem overflow (`HP do boss mais fundo × hpMult ≤ 1e100`). `effectiveDifficulty` faz clamp
para Normal se a selecionada não couber.

---

## 11. Passivas (`src/game/passives.js`)

3 árvores (`eclat`, `vestige`, `fracture`) × 15 (3 grupos de 5). Moeda = **Vestiges**.
Desbloqueia na **1ª Convergence**. `maxLevel = 12`.
```
unlockCost(i) = PASSIVES.unlockLadder[pos] × groupMult[grupo]   // [100,500,2500,12500,62500] × [1,10,100]
nextCost      = nível 0 ? unlockCost : unlockCost × evoFactor(0.3) × evoRamp(1.30)^(L−1)
groupUnlocked = grupo 0 sempre; senão exige os 5 do grupo anterior no máximo
```
**Efeitos** (Bloco 4): a primária de cada árvore = `(1 + Σ %aditivo) × Π(motores ×1.52^nível)`.
- `passiveDmgMult` (eclat), `passiveHpMult` (fracture), `passiveEcoMult` (vestige).
- **Alavancas funcionais** (fora do mult): Luminal Edge (`+4% crit/nv`), Fracture Pulse
  (APS), Void Awareness (`+0,5 mob/nv`), Vestige Pull (×material, log), Void Piercing /
  Weakened Void (def de inimigos).

---

## 12. Mémoires + Clarté (`src/game/memoires.js`)

15 relíquias, 3 por era; era desbloqueia por Ascension. Moeda = **Éclats**.
**Clarté é o motor global** (~70 décadas de dano no jogo completo).
```
clarte   = MEMOIRE_CLARTE_BASE(1.07) ^ clarteExponent
clarteExponent = Σ níveis × (1 + amp #14)        // #14 = stub (per=0) → expoente = Σ níveis
nextCost = nível 0 ? MEMOIRE_UNLOCK[era−1] : MEMOIRE_EVO_BASE(2) × MEMOIRE_EVO_RAMP(3.0)^(L+1)
```
**Dano**: `memoireDmgMult = clarte × min(MEMOIRE_INDIV_DMG_CAP(3), (1+Σdmg)×Π dmgMult)` — a
Clarté é o motor; #1/#10 dão um bônus pequeno por cima (capado). **HP** recebe os mesmos
fatores de prestígio (inclusive a Clarté), senão o player morreria no late.
Outros efeitos: Lumens/XP/Vestiges/critDmg/survival (#11)/materiais (#5)/eclatsAll (#12)/
diffReward (#13)/bossDmg (#7)/offline (#6)/convPoint (#9, +1 ponto/5 níveis). `du Choix`
(#15) amplifica +5%/nível **todos** os efeitos individuais.

---

## 13. Fate Keepers + Eco (`src/game/fatekeepers.js`)

Desbloqueiam por Ascension; automações são **toggles** (default off): o Fate Keeper libera,
o jogador liga. `automationTick` roda no loop online **e** na simulação offline.
- **A1**: auto-stats (legado) + auto-Convergir.
- **A2**: auto-progressão (vai para a sub-área mais funda liberada); abre dificuldades.
- **A3**: **Eco do Seeker** — farma um mapa já limpo em 2º plano a `ECO.fraction(35%)` do
  rendimento (`killRate=15/s`), rendendo materiais/Lumens/Vestiges online e offline.
- **A4**: +`FATE.a4MobBonus(6)` mobs no pack (aplicado no spawn). **A5**: flag (stub).

---

## 14. Offline (`src/game/offline.js`)

O **mesmo `combatTick`** é o motor offline: `simulateOffline(state, seconds)` roda
`ticks = simSeconds / TICK_SECONDS` chamadas de `combatTick` + `automationTick`, então a
cascata de morte/recuo estabiliza no ponto sustentável **igual ao online**.
- Tempo efetivo ampliado por #6 (`memoireOfflineMult`), capado em `OFFLINE.maxSeconds`
  (30 dias, guarda de CPU). Abaixo de `minSecondsToReport(60 s)` não mostra resumo.
- Garantia: **nunca abrir morto** — completa o respawn pendente ao final.

---

## 15. Constantes-chave (`src/data/constants.js`)

| grupo | valores principais |
|-------|--------------------|
| COMBAT | baseDmg 50.000 · baseAPS 0.90 · apsCap 10 · playerBaseHp 100.000 · regenPerSec 1% · regenOnKill 0 · deathRespawn 3 s · waveClearDelay 0.3 s |
| LEVEL | curveDiv 25.000 · curveExp 0.42 · dmgPerLevel 7.500 · hpPerLevel 500 |
| ECONOMY | lumBase 4.000 · xpRatio 0.10 · BOSS_LUMEN_MULT 5 |
| ENEMY | hitsToKill 2 · dmgFrac 0.009 · bossHpMult 100 · bossDmgMult 5 · levelPerArea 0.03 · areaHp/areaDmg/areaReward (9 áreas) |
| CONVERGENCE | bonusPerConv +20% · goldBonusPerConv +0,5% · gateLevelBase 40 · gateLevelGrowth 1.3 · headstartFrac 0.5 |
| GEAR | levelCostBase 800 · costRamp 1.07 · rarityMult [1,1.5,2.25,3.5,5] · levelCap [500,1400,…] · bonusRate 0.02 · multRate 0.0003 · secondaryExp 0.30 |
| CRAFT | dropChance 1% · nextTierChance 0.1% · bossChunk 30 · rarityUpMaterial 40 · refinoRatio 12 |
| DESPERTAR | mult ×2 · critRateAdd +5% · critDmgAdd +400% · apsAdd +0,5 · lumensBonus +100% · xpBonus +40% |
| MÉMOIRES | clarteBase 1.07 · unlock [10,30,90,270,810] · evo 2×3.0^n · indivDmgCap ×3 |
| infra | TICK 0.1 s · maxCatchup 50 · autosave 10 s · schema v8 · NUMBER_CAP 1e100 |

### Mapas (`MAPS`)
| id | nome | sub-áreas | packSizes | bossThreshold | rarityCap |
|----|------|-----------|-----------|---------------|-----------|
| 1 | The Dreaming Wood | 9 | [2×8, 3] | 100 | Incomum |
| 2 | Cavernes Luminis | 6 | PACK | 200 | — |
| 3 | The Ashen Ruins | 7 | PACK | 350 | — |
| 4 | The Fractured Peaks | 8 | PACK | 500 | — |
| 5 | Nil Aeternum | 8 | PACK | 800 | — |

---

## 16. Simulações / Sims (`tools/sim/`)

### 16.0 Simulador interativo (HTML) — `tools/sim/playground.html`
Página que **edita todos os valores do Map 1** (e dos sistemas globais) em campos e roda o
**combate real** importando `src/game/*` — mesma lógica do jogo, não uma cópia. Mostra os
marcos (nível 2, 1ª Convergence, Despertar, Sub 9, Wall, limpeza), o estado final
(nível/conv/gear/APS/crit/dps/HP) e uma **tabela por sub-área** (HP do mob, golpes/mob,
dps, HP, gear, conv no momento em que cada área é liberada).
```
npm run dev                 # sobe o Vite
# abra http://localhost:5173/tools/sim/playground.html
```
Os campos vêm pré-preenchidos de `constants.js`; "Restaurar padrão" volta tudo. Como as
constantes são objetos mutáveis lidos em tempo de chamada, editar um campo + "Rodar" faz o
motor usar o novo valor na hora. É o caminho recomendado para **testar valores** sem editar
código.

### 16.1 Sims de linha de comando
33 simuladores `.mjs` (rodam com `node tools/sim/<arquivo>.mjs`). Dois tipos:
- **Harness reais**: importam `src/game/*` e rodam o **combate real** → validam o *feel* no
  jogo, não num modelo abstrato.
- **Modelos analíticos**: reimplementam a fórmula de um sistema de forma isolada para
  calibrar uma constante (orçamento de décadas, custo, pacing).

#### Harness que rodam o jogo real
| sim | o que faz |
|-----|-----------|
| `game_harness.mjs` | Roda o combate real com um "jogador sensato" (fica na sub-área mais funda, compra a peça mais barata, converge no gate). Validador-mestre da recalibração "VALORES NO MAPA". |
| `map1_report.mjs` | Relatório completo do Map 1: stats do player, HP/dano dos mobs por área 1–9, gear (afixos+custos), níveis de unlock, Convergence e Despertar — tira snapshot real por área. |
| `personas.mjs` | Tempo real que cada **perfil** de jogador leva para limpar o Map 1, modelando sessões ativas (compra/converge/desperta) + tempo offline (poder estagnado). |
| `powercurve.mjs` | Curva de poder vs necessidade nos 10 checkpoints (entrada + sub5 de cada mapa); mede o overshoot estrutural dos efeitos individuais de Mémoire. Regressão obrigatória. |
| `decompose.mjs` | Decompõe o dano endgame por sistema (andar) vs orçamento de décadas. Regressão obrigatória ao mexer em constante de poder. |
| `cp3.mjs` | Verifica CP-3 (Nível como stat base + Convergence nova) usando as funções reais de `stats.js`/`convergence.js`. |
| `cp4.mjs` | Verifica CP-4 (Gear): custo, bulk-buy, afixos flat — funções reais de `gear.js`. |
| `gear_caps.mjs` | Relatório dos stats do Gear nos caps (Faded 500, Kindled 1400) com as funções reais. |
| `sim.mjs` | Simulador de calibração geral (Camada 2): importa as fórmulas reais e mostra HP/dano/packDps por mapa/sub-área. |

#### Calibração por sistema (modelos analíticos das "7 camadas")
| sim | camada / alvo |
|-----|---------------|
| `budget.mjs` | Framework do **orçamento de poder**: quantas décadas o dano cresce e como dividir entre os sistemas (norte do balanceamento). |
| `survival.mjs` | Camada 2 (Sobrevivência): simula uma onda tick-a-tick para escolher a razão dano/HP e a curva de Defesa. |
| `gear.mjs` / `gearcal.mjs` / `gearflow.mjs` / `gearcost.mjs` / `gear_caps.mjs` | Camada 3 (Gear): orçamento ~10 décadas, modelo Gaiadon, custo vs renda, exploração sem cap, relatório nos caps. |
| `material.mjs` | Camada 4 (Craft/Materiais): % de drop, mat por peça/tier, Converged no Map 4, refino 12:1. |
| `passives.mjs` | Camada 5 (Passivas): calibra por esquema (% aditivo + 3 motores ×1.52/nv), ~8 décadas/árvore. |
| `memoires.mjs` | Camada 6 (Mémoires): acha o ramp de custo (corrigiu 1.10→3.0) para a Clarté 1.07 pacear ~70 décadas. |
| `convergence.mjs` | Camada 7 (Convergence aninhada + Dificuldades): prestígio composto e multiplicadores de dificuldade. |
| `playtime.mjs` | Duração do jogo base por arquétipo (estimativa de baixa confiança — overhead circular, anotado). |
| `pacing.mjs` | Pacing end-to-end mapeado no modelo de colunas do Gaiadon (Primary × Bonus% × Multiplier × Mastery%). |
| `cleave.mjs` | Efeito do **unlock de CLEAVE/AoE** (ADR 0002): kills/s quando o ataque atinge a onda inteira vs o base single-target. |

#### Estudos do Map 1 (iterações de design)
Conjunto de explorações isoladas do pacing do Map 1, cada uma fixando uma variável
(custo do gear, cap de nível, teto de HP do mob, gate por nível, Convergence):
`map1.mjs`, `map1_b.mjs`, `map1_v2.mjs`, `map1_blank.mjs` (recalibração "em branco"),
`map1_affix.mjs` (cálculo reverso boss→afixos), `map1_cost.mjs`, `map1_target.mjs`
(alvo de horas vs teto de HP), `map1_pace.mjs` (gate por nível), `map1_conv.mjs`
(Convergence reseta só o nível), `map1_cap_conv.mjs` (cap de nível + Convergence).

> **Disciplina de regressão** (adotada 2026-06-12): qualquer mudança em constante de poder
> exige re-rodar `decompose.mjs` + `powercurve.mjs` (e, no estado atual, `game_harness.mjs`)
> e colar o output.

---

## 17. Fluxo de poder (resumo)

```
XP da run ─→ Nível ─→ base flat de dano/HP
                         │
   Gear (flat + ×) ──────┤
   Convergence (+20%/conv)┤
   Passivas (% + motores) ┤── × ──→ damagePerHit / playerHpMax ──→ dps, sobrevivência
   Mémoires/Clarté (1.07^Σ)┤
   Ascension (×2/marco)   ┤
   Despertar (×2/tier)    ┘

Kills ─→ Lumens (gear) · XP (nível) · Vestiges (passivas/ascension) · Materiais (raridade) · Éclats (drip→Mémoires)
```

Loop de gameplay: farmar a sub-área mais funda → comprar gear (Lumens) e subir raridade
(Materiais) → subir de nível → liberar sub-áreas → Despertar (pré-Wall) → bater o boss
final → Ascender (novo mapa) → Convergir (acelerador) repetidamente. Offline roda o
mesmo combate, estabilizando no ponto sustentável.
```
```
