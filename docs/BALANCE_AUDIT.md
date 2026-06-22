# 🔬 Éclats of Lumière — Auditoria de Balanceamento (código real + números)

Este documento tem DUAS partes:

- **PARTE 1 — Código real** dos motores (trechos completos, verbatim).
- **PARTE 2 — Análise numérica** (DPS, HP, TTK, power breakdown), gerada por
  simulação que espelha exatamente as fórmulas da Parte 1.

> ⚠️ **Spoiler da conclusão:** o HP dos monstros cresce **~175.000.000×** ao longo
> do mapa (2K → 350B), mas o poder de **base + gear + forge + awaken** cresce só
> **~80×–800×**. O gap gigante é fechado **exclusivamente pelas passivas
> multiplicativas** (engines ×1.52^nível) compradas com Convergence. Sem
> prestige/passivas, o jogador **trava na Área 3–4**. Isso é intencional (treadmill
> de prestige), mas hoje a parede é **cedo e abrupta demais**. Detalhes na Parte 2.

---

# PARTE 1 — CÓDIGO REAL

## 1. `data.js`

### 1.1 `balance` (constantes)

```js
balance: {
  // HP do mob: NÃO está mais aqui. Migrou para o modelo em DOIS NÍVEIS,
  // definido POR ÁREA no campo hp:[inicial, final] de cada área e calculado
  // por G.data.mobHpAt(). ATK do mob segue uma curva global no nível.
  mobAtkBase: 45,       // ATK do mob no nível 1
  mobAtkGrowth: 1.00085,// +0,085% de ATK por nível
  healOnKillFrac: 0.10, // cura 10% do HP máx a cada kill (fôlego)
  retreatOnDeath: 3,    // ao morrer, recua N níveis de mob (autocorrige)
  bossHpMult: 4,        // boss tem 4× a vida normal
  bossDmgMult: 1.5,     // e bate 50% mais forte
  bossRewardMult: 6,    // multiplicador de XP do boss
  goldRatio: 0.25,      // gold-base por kill = goldRatio × vida do mob
  baseXp: 10,           // xp por kill = baseXp × nível do mob
  dropChance: 0.35,     // chance de drop por kill
  respawnDelay: 1.0,    // segundos entre matar um mob e o próximo aparecer
  // level-up de gear: custo GEOMÉTRICO
  gearCostBase: 1100,
  gearCostGrowth: 1.05,
  // Forge (weapon reforge — custo separado do gear fixo)
  forgeCostBase: 20,
  forgeCostGrowth: 1.064,
  // Awaken Essence drop chance por kill em área 7+
  awakenDropChance: 0.02,
},
```

### 1.2 Progressão de HP em DOIS NÍVEIS (`areaAt`, `areaHpGrowth`, `mobHpAt`)

```js
// encontra a área cujo levelRange contém o nível (clamp nas bordas do mapa).
areaAt(level) {
  for (const a of this.areas) {
    if (level <= a.levelRange[1]) return a;
  }
  return this.areas[this.areas.length - 1];
},

// taxa de crescimento interna de uma área (derivada de hp:[ini,fim] e span).
// span 0 (área de 1 nível) ⇒ taxa 1 (HP constante = hpInicial).
areaHpGrowth(area) {
  const [lo, hi] = area.levelRange;
  const [hpIni, hpFim] = area.hp;
  const span = hi - lo;
  if (span <= 0 || hpIni <= 0) return 1;
  return Math.pow(hpFim / hpIni, 1 / span);
},

// HP do mob num nível. Camada (1) aplicada DENTRO da área (camada (2) já está
// embutida nos hp:[ini,fim] distintos de cada área).
mobHpAt(level, area) {
  area = area || this.areaAt(level);
  const lo = area.levelRange[0];
  const hpIni = area.hp[0];
  const within = G.util.clamp(level, lo, area.levelRange[1]) - lo;
  return hpIni * Math.pow(this.areaHpGrowth(area), within);
},
```

### 1.3 Áreas (levelRange + hp:[inicial, final])

| Área | id | levelRange | hp:[inicial, final] |
|---|---|---|---|
| The Dreaming Wood | 1 | [1, 80] | [2.000, 2.500] |
| The Lantern Mire | 2 | [81, 350] | [40.000, 80.000] |
| The Whispering Hollows | 3 | [351, 700] | [1.000.000, 3.000.000] |
| The Moonlit Canopy | 4 | [701, 1150] | [20.000.000, 80.000.000] |
| The Sunken Grove | 5 | [1151, 1700] | [400.000.000, 1.500.000.000] |
| The Gilded Thicket | 6 | [1701, 2350] | [6.000.000.000, 20.000.000.000] |
| The Hollow Cathedral | 7 | [2351, 3150] | [40.000.000.000, 100.000.000.000] |
| The Weeping Roots | 8 | [3151, 4050] | [120.000.000.000, 200.000.000.000] |
| The Hollow Sanctum | 9 | [4051, 5000] | [220.000.000.000, 350.000.000.000] |

### 1.4 Raridades

```js
rarities: [
  { id: "common",    name: "Common",    affixes: 1, weight: 60,  mult: 1.0, cap: 500 },
  { id: "magic",     name: "Magic",     affixes: 2, weight: 28,  mult: 1.4, cap: 600 },
  { id: "rare",      name: "Rare",      affixes: 3, weight: 9,   mult: 1.9, cap: 700 },
  { id: "epic",      name: "Epic",      affixes: 4, weight: 2.5, mult: 2.6, cap: 800 },
  { id: "legendary", name: "Legendary", affixes: 5, weight: 0.5, mult: 3.6, cap: 1000 },
],
```

### 1.5 `gearBase` (6 peças fixas — base/perLevel por afixo)

```js
gearBase: {
  weapon: { name: "Worn Blade", affixes: [
    { id:"atk",  stat:"atk", layer:"flat", base:0, perLevel:20 },
    { id:"atkp", stat:"atk", layer:"pct",  base:0, perLevel:1 },
  ]},
  helmet: { name: "Worn Helm", affixes: [
    { id:"hp",      stat:"hp",      layer:"flat", base:0, perLevel:20 },
    { id:"critDmg", stat:"critDmg", layer:"flat", base:0, perLevel:1 },
  ]},
  armor: { name: "Worn Cuirass", affixes: [
    { id:"hpp", stat:"hp",      layer:"pct",  base:0, perLevel:1 },
    { id:"xp",  stat:"xpBonus", layer:"flat", base:0, perLevel:0.5 },
  ]},
  gloves: { name: "Worn Gloves", affixes: [
    { id:"atkspd", stat:"atkSpeed", layer:"flat", base:0,    perLevel:0.01 },
    { id:"crit",   stat:"crit",     layer:"flat", base:0.05, perLevel:0.025 },
  ]},
  boots: { name: "Worn Boots", affixes: [
    { id:"lumens", stat:"lumensBonus", layer:"flat", base:5, perLevel:1 },
    { id:"xp",     stat:"xpBonus",     layer:"flat", base:2, perLevel:0.5 },
  ]},
  cloak: { name: "Worn Cloak", affixes: [
    { id:"crit", stat:"crit", layer:"flat", base:0.05, perLevel:0.025 },
    { id:"atkp", stat:"atk",  layer:"pct",  base:0,    perLevel:1 },
  ]},
},
```

> ⚠️ **Importante:** com raridade **Common** (`affixes: 1`), `buildPiece` usa só o
> **PRIMEIRO** afixo de cada peça. Como não há mecânica de subir raridade ainda,
> na prática hoje cada peça tem **1 afixo ativo**:
> weapon→ATK flat, helmet→HP flat, armor→HP%, gloves→AtkSpeed, boots→Lumens%,
> cloak→Crit. Os 2ºs afixos (atkp, critDmg, xp…) **estão dormentes**.

### 1.6 Awaken definitions

```js
awakens: [
  {
    id: "first_light", name: "First Light",
    areaIndex: 6,        // Area 7 = index 6 (The Hollow Cathedral)
    level: 2351, essence: 50, lumens: 500000,
    bonus: { atkMult: 2.5, hpMult: 1.5, lumensBonus: 25 },
  },
],
```

### 1.7 Rare mob variants

```js
rareMobs: {
  chance: 0.08, plusChance: 0.15,
  rare: { tag:"Rare",  hpMult:3, dmgMult:1.5, rewardMult:3 },
  plus: { tag:"Rare+", hpMult:6, dmgMult:2,   rewardMult:6 },
},
```

---

## 2. `state.js` — atributos finais

### 2.1 `invalidateStats()`

```js
invalidateStats() { this._statsCache = null; },
```

### 2.2 `stats()` (completo)

```js
stats() {
  if (this._statsCache) return this._statsCache;
  const d = this.data;
  const L = {}; // L[stat] = { flat, pct, mult }
  const layer = (k) => (L[k] || (L[k] = { flat: 0, pct: 0, mult: 1 }));

  // ---- camada base (Base Game + Character Level) ----
  layer("atk").flat += 1000 + (d.level - 1) * 2;
  layer("hp").flat  += 1000 + (d.level - 1) * 2;
  layer("atk").pct  += d.weaponUpgrades * 4;      // forja: +4% ATK por reforço
  layer("crit").flat += 5;
  layer("atkSpeed").flat += 1.0;                  // ataques por segundo
  layer("critDmg").flat  += 50;                   // ×1.5 de dano crítico
  layer("xpBonus").flat  += 0;
  layer("lumensBonus").flat += 10 + d.level * 0.05;

  // ---- camada de equipamento ----
  for (const slot of G.data.slots) {
    const item = this.data.equipped[slot.id];
    if (!item) continue;
    for (const af of item.affixes) {
      layer(af.stat)[af.layer || "flat"] += G.gear.affixValue(item, af);
    }
  }

  // ---- camada Awaken (permanente) ----
  if (G.awaken) G.awaken.applyTo(layer);

  // ---- passivas (compradas com Pontos de Convergence) ----
  if (G.passives) {
    const P = G.passives;
    layer("atk").mult *= P.dmgMult();        // árvore Éclat
    layer("hp").mult  *= P.hpMult();         // árvore Fracture
    layer("crit").flat += P.critAddPts();    // alavanca Luminal Edge
    layer("atkSpeed").mult *= P.apsMult();   // alavanca Fracture Pulse
    const eco = P.ecoMult();                 // árvore Vestige
    layer("lumensBonus").mult *= eco;
    layer("xpBonus").mult *= eco;
  }

  // FÓRMULA FINAL de cada stat:
  const fin = (k) => {
    const x = layer(k);
    return x.flat * (1 + x.pct / 100) * x.mult;
  };

  this._statsCache = {
    atk:      Math.round(fin("atk")),
    hp:       Math.round(fin("hp")),
    crit:     G.util.clamp(fin("crit"), 0, 100),
    critDmg:  fin("critDmg"),
    critMult: 1 + fin("critDmg") / 100,
    atkSpeed: fin("atkSpeed"),
    xpBonus:  fin("xpBonus"),
    lumensBonus: fin("lumensBonus"),
    _layers: L,
  };
  return this._statsCache;
},

maxHp() { return this.stats().hp; },

attackInterval() {
  const aps = this.stats().atkSpeed;
  return G.util.clamp(1.0 / aps, 0.1, 5);
},

xpToNext() { return Math.ceil(14 * this.data.level); },
```

### 2.3 Resumo das fórmulas de stat

```
final(stat)  = flat × (1 + pct/100) × mult

atk          = (1000 + 2(L−1) + Σgear_flat) × (1 + (weaponUpgrades×4 + Σgear_pct)/100) × atkMult_passivas × atkMult_awaken
hp           = (1000 + 2(L−1) + Σgear_flat) × (1 + Σgear_pct/100) × hpMult_passivas × hpMult_awaken
crit         = clamp(5 + Σgear_crit + critAddPts_passiva, 0, 100)   // %
critDmg      = 50 + Σgear_critDmg   →   critMult = 1 + critDmg/100
atkSpeed     = (1.0 + Σgear_aps) × apsMult_passiva                  // ataques/s
attackInterval = clamp(1/atkSpeed, 0.1, 5)
lumensBonus  = (10 + L×0.05 + Σgear_lumens + awaken_lumens) × ecoMult_passiva  // %
xpBonus      = (0 + Σgear_xp) × ecoMult_passiva                     // %
```

---

## 3. `combat.js` — combate

### 3.1 Spawn (HP/ATK do mob, boss, raro, recompensas)

```js
spawn() {
  const b = G.data.balance;
  const area = G.data.currentArea();
  const level = G.util.clamp(G.state.data.level, area.levelRange[0], area.levelRange[1]);
  const atCap = G.state.data.level >= area.levelRange[1];
  const isBoss = atCap && !!area.boss;
  if (atCap && !area.boss) this.unlockNext();

  const hp  = G.data.mobHpAt(level, area);
  const atk = b.mobAtkBase * Math.pow(b.mobAtkGrowth, level - 1);

  let def, maxHp, dmg, lumens, xp, name, rarity = null;
  if (isBoss) {
    def = area.boss;
    maxHp = hp * b.bossHpMult;       // ×4
    dmg   = atk * b.bossDmgMult;     // ×1.5
    xp    = b.baseXp * level * b.bossRewardMult; // ×6
    name  = def.name;
  } else {
    def = G.util.pick(this.enemyPool());
    maxHp = hp; dmg = atk; xp = b.baseXp * level; name = def.name;
    const rm = G.data.rareMobs;
    if (rm && G.util.chance(rm.chance)) {          // 8% raro
      rarity = G.util.chance(rm.plusChance) ? rm.plus : rm.rare; // 15% → raro+
      maxHp *= rarity.hpMult;   // raro ×3 · raro+ ×6
      dmg   *= rarity.dmgMult;  // raro ×1.5 · raro+ ×2
      xp    *= rarity.rewardMult;
      name = G.util.pick(rarity.names);
    }
  }
  lumens = maxHp * b.goldRatio;     // ouro ancorado ao HP do mob (×0.25)
  // ...cria this.enemy com maxHp/dmg/lumens/xp (ceil)...
}
```

### 3.2 Dano do player (ataque automático + crítico)

```js
playerHit() {
  if (!this.enemy) return;
  const s = G.state.stats();
  let dmg = s.atk;
  const crit = G.util.chance(s.crit / 100);
  if (crit) dmg *= s.critMult;       // critMult = 1 + critDmg/100 (default ×1.5)
  dmg = Math.ceil(dmg);
  // com UI dispara projétil; sem UI (idle) aplica direto
}
```

### 3.3 Dano do mob

```js
enemyHit() {
  if (!this.enemy) return;
  const dmg = this.enemy.dmg;        // = mobAtk (×1.5 boss · ×1.5/×2 raro)
  // ...aplica no player...
}
```

### 3.4 Ataque automático (ritmo) e idle

```js
tick(dt) {
  this.resolvePending(dt);
  if (!this.enemy) { this.respawnTimer -= dt; if (this.respawnTimer <= 0) this.spawn(); return; }

  this.atkTimer += dt;
  const interval = G.state.attackInterval();      // 1 / atkSpeed
  while (this.atkTimer >= interval) { this.atkTimer -= interval; this.playerHit(); if (!this.enemy) break; }

  this.enemyTimer += dt;
  while (this.enemyTimer >= this.enemyInterval) {  // enemyInterval = 0.99s
    this.enemyTimer -= this.enemyInterval; this.enemyHit(); if (!this.enemy) break;
  }
}

simulateIdle(seconds) {            // progresso offline
  if (seconds < 5) return null;
  const capped = Math.min(seconds, 8 * 3600);      // teto 8h
  const interval = G.state.attackInterval();
  const step = Math.max(interval, G.data.balance.respawnDelay);
  const ticks = Math.floor(capped / step);
  // roda this.tick(step) sem UI, até ticks ou 50.000
}
```

### 3.5 Kill — XP gain, Lumens gain, cura

```js
onKill() {
  const e = this.enemy;
  const s = G.state.stats();
  const lumens = Math.ceil(e.lumens * (1 + s.lumensBonus / 100));   // LUMENS GAIN
  G.state.data.lumens += lumens;
  G.state.data.xp += Math.round(e.xp * (1 + s.xpBonus / 100));      // XP GAIN

  // fôlego: cura 10% do HP máx a cada kill
  const heal = G.state.maxHp() * G.data.balance.healOnKillFrac;
  G.state.data.hp = Math.min(G.state.maxHp(), G.state.data.hp + heal);

  // Awakening Essence (Área 7+): 2% × materialsMult
  if (G.state.data.areaIndex >= 6 && G.util.chance(G.data.balance.awakenDropChance * matMult))
    G.state.data.awakenEssence += 1;

  if (e.isBoss) this.markBossCleared();
  this.checkLevelUp();
  this.respawnTimer = G.data.balance.respawnDelay;  // 1.0s entre mobs
}

onDeath() {                       // a "parede": cura total, mob volta cheio
  G.state.data.hp = G.state.maxHp();
  this.enemy = null;
  this.respawnTimer = G.data.balance.respawnDelay;
}

checkLevelUp() {
  while (G.state.data.xp >= G.state.xpToNext()) {   // xpToNext = ceil(14×level)
    G.state.data.xp -= G.state.xpToNext();
    G.state.data.level += 1;
    G.state.invalidateStats();
    G.state.data.hp = G.state.maxHp();
  }
}
```

> **DPS efetivo** (não existe explícito no código; é derivado):
> `DPS = atk × (1 + (crit/100)×(critMult−1)) × atkSpeed`.
> Com critMult padrão 1.5: `DPS = atk × (1 + crit/200) × atkSpeed`.

---

## 4. `gear.js`

```js
// valor efetivo de um afixo no nível atual (raridade já embutida em base/perLevel)
affixValue(item, af) {
  const lvl = item.level || 1;
  return af.base + af.perLevel * (lvl - 1);
},

// raridade escala base E perLevel; nº de afixos = rarity.affixes
buildPiece(slotId, rarityId) {
  const base = G.data.gearBase[slotId];
  const rarity = G.data.rarities.find((r) => r.id === rarityId) || G.data.rarities[0];
  const afxCount = Math.min(rarity.affixes || 1, base.affixes.length);
  return {
    slot: slotId, rarity: rarity.id, level: 1,
    affixes: base.affixes.slice(0, afxCount).map((a) => ({
      id:a.id, stat:a.stat, layer:a.layer || "flat",
      base:     a.base    * rarity.mult,   // ← raridade multiplica o valor base
      perLevel: a.perLevel * rarity.mult,  // ← e o ganho por nível
    })),
  };
},

cap(item) {                          // teto de nível por raridade
  const rarity = G.data.rarities.find((r) => r.id === item.rarity);
  return rarity && rarity.cap ? rarity.cap : 10;
},

// CUSTO de upgrade — GEOMÉTRICO
cost(item) {
  const b = G.data.balance;
  const lvl = item.level || 1;
  return Math.ceil(b.gearCostBase * Math.pow(b.gearCostGrowth, lvl - 1)); // 1100 × 1.05^(lvl−1)
},

levelUp(item) {                      // sobe 1 nível gastando Lumens
  if (this.isMaxed(item)) return false;
  const cost = this.cost(item);
  if (G.state.data.lumens < cost) return false;
  G.state.data.lumens -= cost;
  item.level = (item.level || 1) + 1;
  G.state.invalidateStats();
  return true;
},
```

---

## 5. `passives.js` — Árvore-Mundo (3 árvores × 15 nós)

### 5.1 Constantes, motores e alavancas

```js
TREES: ["eclat", "vestige", "fracture"],
GROUP_SIZE: 5, maxLevel: 12,
unlockLadder: [100, 500, 2500, 12500, 62500],
groupMult: [1, 10, 100],
evoFactor: 0.3, evoRamp: 1.3,
groupAddPct: [0.05, 0.1, 0.2],
engineMult: 1.52,
engines: {
  eclat:    ["e_luminal_explosion", "e_oreinsof_touch", "e_shattered_light"],
  vestige:  ["v_eternal_vestige", "v_fractured_soul", "v_collector"],
  fracture: ["f_void_collapse", "f_claimed_domination", "f_void_endurance"],
},
levers: {
  e_luminal_edge:"crit", e_void_piercing:"enemyPen",
  f_fracture_pulse:"aps", f_void_awareness:"mobCap", f_weakened_void:"enemyReduce",
  v_vestige_pull:"material",
},
lever: { critPerLevel:0.04, apsPerLevel:0.46, mobPerLevel:0.5,
         materialPerLevel:0.75, penPerLevel:0.04, reducePerLevel:0.04 },
```

### 5.2 Custos / gating

```js
unlocked() { return (G.state.data.convergences || 0) >= 1; }   // libera na 1ª Convergence
unlockCost(i) { return this.unlockLadder[this.posOf(i)] * this.groupMult[this.groupOf(i)]; }
nextCost(tree, i) {
  const lv = this.level(tree, i);
  if (lv === 0) return this.unlockCost(i);
  return Math.ceil(this.unlockCost(i) * this.evoFactor * Math.pow(this.evoRamp, lv - 1));
}
// grupo só abre quando o anterior está TODO no maxLevel
groupUnlocked(tree, g) { /* todos os 5 nós do grupo g−1 == maxLevel */ }
```

### 5.3 Multiplicadores finais (o coração do scaling)

```js
// multiplicador de uma árvore: nós normais somam (aditivo); motores compõem (multiplicativo)
treeMult(tree) {
  const arr = G.state.data.passives[tree];
  let add = 0, eng = 1;
  this.trees[tree].list.forEach((entry, i) => {
    const art = entry[1], lv = arr[i];
    if (!lv || this.levers[art]) return;           // alavancas não entram aqui
    if (this.isEngine(tree, art)) eng *= Math.pow(this.engineMult, lv); // ×1.52^lv
    else add += this.groupAddPct[this.groupOf(i)] * lv;                 // 0.05/0.1/0.2 × lv
  });
  return (1 + add) * eng;
}

dmgMult() { return this.treeMult("eclat"); }     // → atk.mult
hpMult()  { return this.treeMult("fracture"); }  // → hp.mult
ecoMult() { return this.treeMult("vestige"); }   // → lumensBonus.mult & xpBonus.mult

critAddPts()   { return this.leverLevel("e_luminal_edge")  * 0.04 * 100; }       // pontos de crit
apsMult()      { return 1 + this.leverLevel("f_fracture_pulse") * 0.46; }
materialsMult() { return 1 + Math.log10(1 + this.leverLevel("v_vestige_pull") * 0.75); }
```

> **Escala máxima de um motor:** 3 motores por árvore, cada um até `maxLevel` 12 →
> `1.52^12 ≈ 79×` por motor → `79^3 ≈ 492.000×` por árvore só dos motores (×
> bônus aditivos). É **isto** que fecha o gap de HP — e exige várias Convergences
> para comprar (gating por grupo + custo `evoRamp 1.3^lv`).

---

## 6. `convergence.js` — prestige

```js
gateLevel: 80,   // nível mínimo p/ convergir
C: 80, k: 1.25,  // escala e expoente do "push"

pointsFor(level) {
  if (level < this.gateLevel) return 0;
  return Math.floor(this.C * Math.pow(level / this.gateLevel, this.k));
}

converge() {
  if (!this.canConverge()) return false;
  const d = G.state.data;
  d.convergencePoints += this.pending();
  d.convergences += 1;
  // RESET:
  d.level = 1; d.xp = 0; d.lumens = 0; d.areaIndex = 0;
  G.state.invalidateStats(); d.hp = G.state.maxHp();
  // MANTÉM: gear, materiais, Pontos, passivas, áreas desbloqueadas, recordes, awakens
}
```

Pontos por nível de convergência:

| Nível ao convergir | Pontos |
|---|---|
| 80 | 80 |
| 160 | 190 |
| 350 | 506 |
| 700 | 1.203 |
| 1.150 | 2.239 |
| 1.700 | 3.649 |
| 2.350 | 5.470 |
| 3.150 | 7.890 |
| 4.050 | 10.803 |
| 5.000 | 14.058 |

---

## 7. `awaken.js`

```js
canUnlock(id) {
  const a = this.def(id), d = G.state.data;
  return (d.maxAreaUnlocked || 0) >= a.areaIndex &&
         d.level >= a.level &&
         (d.awakenEssence || 0) >= a.essence &&
         (d.lumens || 0) >= a.lumens;
}

// injeta os bônus de TODOS os awakens desbloqueados nas camadas de stat
applyTo(layer) {
  for (const a of G.data.awakens) {
    if (!this.isUnlocked(a.id)) continue;
    const b = a.bonus;
    if (b.atkMult)     layer("atk").mult *= b.atkMult;   // ×2.5 (First Light)
    if (b.hpMult)      layer("hp").mult  *= b.hpMult;    // ×1.5
    if (b.critDmg)     layer("critDmg").flat += b.critDmg;
    if (b.crit)        layer("crit").flat += b.crit;
    if (b.lumensBonus) layer("lumensBonus").flat += b.lumensBonus; // +25%
    if (b.xpBonus)     layer("xpBonus").flat += b.xpBonus;
  }
}
```

---

# PARTE 2 — ANÁLISE NUMÉRICA

## Metodologia

Simulação tick-por-kill que reproduz exatamente as fórmulas acima. Política do
"jogador": gasta **toda** a renda em gear (6 peças niveladas juntas) e, quando
indicado, em forge. Nível sobe por XP (`~1,4 kills/nível`). Snapshot tirado no
**último nível de cada área**. Quatro cenários de poder:

- **A** — 1ª run pura: sem passivas, sem awaken, só gear.
- **B** — gear + forge.
- **C** — gear + forge + awaken (First Light, área 7+).
- **D** — end-game: forge + awaken + passivas fortes (`dmgMult ×50`, `hpMult ×20`,
  `ecoMult ×10`) — representa um jogador com várias Convergences investidas.

> `DPS = atk × (1 + crit/200) × atkSpeed`. TTK = HP_mob / DPS. "MORRE" = o mob mata
> o player partindo do HP cheio antes do player matar o mob (parede dura).

## Q1 + Q2 — DPS e HP do player no fim de cada área

**Cenário A (1ª run — gear only):**

| Área | endLv | gearLv | ATK | HP | DPS | crit% | aps |
|---|---|---|---|---|---|---|---|
| 1 | 80 | 10 | 1.34K | 1.46K | 1.50K | 5.3 | 1.09 |
| 2 | 350 | 91 | 3.50K | 6.65K | 6.89K | 7.3 | 1.90 |
| 3 | 700 | 176 | 5.90K | 16.2K | 17.0K | 9.4 | 2.75 |
| 4 | 1150 | 252 | 8.32K | 29.2K | 30.8K | 11.3 | 3.51 |
| 5 | 1700 | 321 | 10.8K | 45.4K | 48.3K | 13.1 | 4.20 |
| 6 | 2350 | 382 | 13.3K | 64.1K | 68.7K | 14.6 | 4.81 |
| 7 | 3150 | 426 | 15.8K | 82.9K | 89.4K | 15.7 | 5.25 |
| 8 | 4050 | 453 | 18.1K | 100K | 108K | 16.4 | 5.52 |
| 9 | 5000 | 471 | 20.4K | 116K | 126K | 16.8 | 5.70 |

**Cenário D (end-game juiced):**

| Área | endLv | gearLv | forge | ATK | HP | DPS |
|---|---|---|---|---|---|---|
| 1 | 80 | 18 | 104 | 966K | 52.6K | 1.16M |
| 2 | 350 | 123 | 188 | 4.41M | 276K | 10.2M |
| 3 | 700 | 210 | 256 | 9.24M | 610K | 30.0M |
| 4 | 1150 | 287 | 316 | 15.4M | 1.04M | 63.0M |
| 5 | 1700 | 355 | 372 | 22.8M | 1.56M | 111M |
| 6 | 2350 | 417 | 420 | 31.2M | 2.17M | 173M |
| 7 | 3150 | 461 | 455 | 39.6M | 2.77M | 240M |
| 8 | 4050 | 487 | 476 | 47.1M | 3.31M | 300M |
| 9 | 5000 | 500(cap) | 495 | 54.5M | 3.77M | 355M |

## Q3 — De onde vem o poder (breakdown em Lv1700, gearLv200, forge300)

| Fonte | ATK | HP | DPS | Multiplicador acumulado |
|---|---|---|---|---|
| Base (só nível) | 4.40K | 4.40K | 4.51K | ×1 |
| + Gear (Lv200) | 8.38K | 25.1K | 26.3K | DPS ×5.8 · HP ×5.7 |
| + Forge (300) | 109K | 25.1K | 342K | DPS ×13 (sobre gear) |
| + Awaken | 272K | 37.6K | 855K | ATK ×2.5 · HP ×1.5 |
| + Passivas (×50/×20) | 13.6M | 752K | 42.7M | **dominante** |

**Ranking de impacto no poder:**

1. **Passivas (Convergence)** — de longe a maior alavanca. Motores `1.52^lv`
   compõem multiplicativamente; sozinhas valem centenas a milhares de ×. **São o
   que torna o late-game possível.**
2. **Forge** — segunda maior em ATK puro (`+4%` aditivo por nível, custo barato
   `1.064^n`); chega a ×13 no DPS no exemplo. **Hoje está forte demais vs gear.**
3. **Gear** — ~×5–6 em DPS/HP ao longo de uma área; cresce devagar e **bate no cap
   500 (Common)**.
4. **Awaken** — salto fixo único (×2.5 ATK / ×1.5 HP), só área 7+.
5. **Nível** — quase irrelevante para o poder (`+2 flat/nível`); serve de relógio
   das áreas e de fonte de Lumens/XP.

## Q4 — O HP atual dos monstros está correto?

**Os valores que você definiu estão batendo exatamente** (a fórmula reproduz
`hp[0]` no início e `hp[1]` no fim de cada área):

| Área | HP fim (sim) | Alvo | ✓ |
|---|---|---|---|
| 1 | 2.50K | 2–2.5K | ✓ |
| 2 | 80.0K | 40–80K | ✓ |
| 3 | 3.00M | 1–3M | ✓ |
| 4 | 80.0M | 20–80M | ✓ |
| 5 | 1.50B | 400M–1.5B | ✓ |
| 6 | 20.0B | 6–20B | ✓ |
| 7 | 100.0B | 40–100B | ✓ |
| 8 | 200B | 120–200B | ✓ |
| 9 | 350B | 220–350B | ✓ |

**Mas há um problema estrutural de escala** (independe dos números exatos): de Lv1
a Lv5000 o HP do mob cresce **×175.000.000**, enquanto o poder de base+gear+forge+
awaken cresce só **~×80 (cenário A)** a **~×800 (cenário C)**. **Toda** a diferença
(≈ 5 ordens de grandeza) precisa vir das passivas. Veja Q5.

## Q5 — Riscos

| Risco | Veredito | Evidência |
|---|---|---|
| **Jogador travar numa área** | 🔴 **ALTO (crítico)** | Cenário A: TTK normal já é **177s na Área 3** e **2.593s na Área 4**; boss da Área 3 **mata** o player. Sem passivas, a run morre na Área 3–4. |
| **Pular áreas inteiras** | 🟢 Baixo | O mob acompanha seu nível e o salto vertical entre áreas é grande; não dá pra "passar batido". |
| **Gear escalar devagar demais** | 🟡 Médio | Gear sozinho dá só ×5–6 por área e **satura no cap 500 (Common)**. Como não há mecânica de subir raridade, gear "morre" como fonte de poder no late-game. |
| **Gear escalar rápido demais** | 🟢 Não | O oposto é o problema. |
| **Forge forte demais** | 🟡 Médio | Forge é barato (`1.064^n`) e dá `+4%/nível` aditivo sem teto prático → no breakdown vale **×13**, mais que o gear inteiro. Vira a alavanca "óbvia", ofuscando o gear. |
| **Power creep / inflação** | 🟡 Médio (intencional, mas extremo) | As passivas precisam valer **~10⁵–10⁷×** pra fechar o gap. Isso é "ok" no gênero idle/prestige, mas a curva de números explode (TTK em cenário A chega a **milhões de segundos**), o que é frágil a pequenos erros de tuning. |
| **2ºs afixos dormentes** | 🟡 Médio | Como tudo é Common (1 afixo), metade dos afixos do `gearBase` (atkp, critDmg, xp extra) **nunca entra**. crit/critDmg/atkSpeed do player ficam baixos o jogo todo. |

## Q6 — Time To Kill esperado (segundos)

**Cenário A (1ª run — sem passivas):** já é inviável a partir da Área 3.

| Área | normal | raro (×3) | raro+ (×6) | boss (×4) |
|---|---|---|---|---|
| 1 | 1.67 | 5.01 | 10.0 | 6.68 |
| 2 | 11.6 | 34.8 | 69.7 | 46.5 |
| 3 | **176** | 530 | 1.060 | 707 |
| 4 | **2.593** | 7.780 | 15.559 | 10.373 |
| 5 | 31.049 | … | … | … |
| 9 | 2.777.003 | … | … | … |

**Cenário C (gear + forge + awaken):**

| Área | normal | raro | raro+ | boss |
|---|---|---|---|---|
| 1 | 0.18 | 0.54 | 1.09 | 0.73 |
| 2 | 0.72 | 2.16 | 4.32 | 2.88 |
| 3 | 7.75 | 23.2 | 46.5 | 31.0 |
| 4 | 89.7 | 269 | 538 | 359 |
| 5 | 903 | 2.708 | 5.416 | 3.611 |
| 6 | 7.395 | … | … | 29.581 |
| 9 | 59.712 | … | … | 238.846 |

**Cenário D (end-game com passivas fortes ×50/×20/×10):** finalmente jogável.

| Área | normal | raro | raro+ | boss |
|---|---|---|---|---|
| 1 | ~0 | 0.01 | 0.01 | 0.01 |
| 5 | 13.6 | 40.7 | 81.4 | 54.2 |
| 6 | 115 | 346 | 692 | 461 |
| 7 | 417 | 1.250 | 2.499 | 1.666 |
| 8 | 667 | 2.000 | 4.000 | 2.667 |
| 9 | 985 | 2.955 | 5.910 | 3.940 |

**Banda de TTK saudável para idle ≈ 1–8s (mob) / 10–30s (boss).** Hoje só se
encaixa nas **Áreas 1–2** (cenário B/C) ou **Áreas 1–5** (cenário D end-game). De
resto, ou é trivial (sub-segundo) ou é parede de minutos/horas.

---

## 🎯 Recomendações de tuning (prioridade)

1. **Achatar a escada vertical de HP** ou **acelerar muito o poder não-prestige.**
   O gap base+gear de ×80 contra HP ×175M obriga o jogador a depender de passivas
   já na Área 3 — cedo demais para um sistema que só abre na 1ª Convergence.
   - Opção A: reduzir os saltos de HP entre áreas (ex.: ×4–6 em vez de ×16/×12,5
     nas primeiras transições).
   - Opção B: dar ao **gear/forge** crescimento multiplicativo por área (afixos
     que escalam com a área, ou subir raridade automaticamente por área).

2. **Ligar os 2ºs afixos** (subir raridade das 6 peças por progressão), senão
   crit, crit damage, atk speed e atk% ficam mortos o jogo inteiro.

3. **Limitar o forge** (cap ou custo mais íngreme): hoje ele sozinho supera o gear,
   o que esvazia a decisão de upgrade.

4. **Calibrar para uma banda de TTK alvo** (ex.: mob 2–5s, boss 15–30s) e derivar
   o HP/poder a partir dela — em vez de fixar HP e poder separadamente. A
   simulação acima pode virar um teste de regressão para isso.
