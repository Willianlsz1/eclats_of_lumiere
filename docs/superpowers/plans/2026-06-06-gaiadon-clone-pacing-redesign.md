# Gaiadon Clone — Pacing & Core Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o protótipo idle RPG em `gaiadon-clone/` num jogo bem ritmado, com progressão de profundidade infinita, combate com "parede" sem punição, progresso offline melhorável, efeitos de game feel, texto 100% em inglês, e a matemática crítica coberta por testes.

**Architecture:** Mantém a separação atual em camadas (vanilla JS, sem build): `data.js` (constantes/balanceamento), `game.js` (lógica pura, testável, sem DOM), `ui.js` (renderização + efeitos), `main.js` (loop, save/load, botões). Toda regra de jogo nova vai em funções puras em `game.js` e é testada por um runner mínimo em Node (`game.test.js`). A UI é verificada jogando.

**Tech Stack:** HTML, CSS, JavaScript vanilla (ES2020). Node.js (v24, já instalado) só para rodar os testes. Git para commits.

**Modelo de progressão (referência para todas as tasks):**
- `state.maxZone` = profundidade mais funda já **limpa** (10 abates nela). Começa em 0.
- `state.zone` = profundidade onde estamos lutando agora.
- `state.killsInZone` = abates acumulados na profundidade atual (limpa em 10).
- Inimigos escalam pela **profundidade** (não pelo nível do herói).
- **Auto-loop idle:** farma na profundidade segura (`maxZone`); a cada 10 abates, tenta automaticamente a fronteira (`maxZone + 1`). Se limpar a fronteira → `maxZone++`. Se **morrer** na fronteira → volta a farmar em `maxZone`, sem perder nada, com mensagem "fique mais forte".
- No início `maxZone = 0`, então `zone = 1` é a primeira fronteira (trivial, balanceada para não matar).

---

## File Structure

| Arquivo | Responsabilidade | Ação |
|---|---|---|
| `gaiadon-clone/js/data.js` | TODAS as constantes de balanceamento + textos de dados (inimigos, itens, upgrades) em inglês | Reescrever |
| `gaiadon-clone/js/game.js` | Lógica pura: combate, profundidade, loot, ascensão, offline. Sem DOM. | Reescrever |
| `gaiadon-clone/js/ui.js` | Renderização DOM + efeitos de feel (floating damage, brilho de drop) | Reescrever (inglês) |
| `gaiadon-clone/js/main.js` | Loop, save/load com timestamp, resumo offline, botões | Reescrever (inglês) |
| `gaiadon-clone/index.html` | Marcação + textos em inglês + barra de "next goal" | Editar |
| `gaiadon-clone/style.css` | Estilos + animações de feel | Editar |
| `gaiadon-clone/js/_assert.js` | Runner de testes mínimo (Node) reutilizável | Criar |
| `gaiadon-clone/js/game.test.js` | Testes da matemática crítica | Criar |
| `gaiadon-clone/README.md` | Como rodar e testar o jogo | Criar |

**Convenção de idioma:** todo texto **visível ao jogador** em inglês. Comentários de código podem ficar em português.

---

## Task 0: Inicializar git e baseline

**Files:**
- Create: `.gitignore` (raiz do projeto)

- [ ] **Step 1: Inicializar o repositório**

Run (na raiz `C:\Users\KABUM\Desktop\Game Teste`):
```bash
git init
git add -A
git commit -m "chore: baseline (protótipo + specs/plans)"
```
Expected: commit criado com os arquivos atuais.

- [ ] **Step 2: Criar `.gitignore`**

Conteúdo de `.gitignore`:
```
node_modules/
*.log
.DS_Store
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
```

---

## Task 1: Runner de testes mínimo (Node)

Objetivo: poder testar a lógica pura sem instalar nenhum framework. `game.js` e `data.js` já têm o guard `if (typeof module !== "undefined")`, então são `require`-áveis em Node. Como `game.js` referencia constantes globais (`CONFIG`, `RARITIES`...), o teste injeta os exports de `data.js` em `globalThis` antes de carregar `game.js`.

**Files:**
- Create: `gaiadon-clone/js/_assert.js`
- Create: `gaiadon-clone/js/game.test.js`

- [ ] **Step 1: Escrever o runner `_assert.js`**

```js
// Runner de testes mínimo — sem dependências.
let passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log("  ✅ " + name); }
  catch (e) { failed++; failures.push(name + " — " + e.message); console.log("  ❌ " + name + " — " + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "assert falhou"); }
function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error((msg || "esperado") + ` ${expected}, recebido ${actual}`);
}
// Para floats: tolerância relativa/absoluta.
function assertClose(actual, expected, tol, msg) {
  tol = tol == null ? 1e-6 : tol;
  if (Math.abs(actual - expected) > tol) throw new Error((msg || "esperado ~") + `${expected}, recebido ${actual}`);
}
function report() {
  console.log(`\n${passed} passaram, ${failed} falharam.`);
  if (failed > 0) { process.exitCode = 1; }
}
module.exports = { test, assert, assertEqual, assertClose, report };
```

- [ ] **Step 2: Escrever um teste-fumaça em `game.test.js`**

```js
// Carrega data.js -> globalThis -> game.js, depois roda os testes.
const data = require("./data.js");
Object.assign(globalThis, data);
const game = require("./game.js");
const { test, assertEqual, report } = require("./_assert.js");

console.log("== Smoke ==");
test("defaultState começa em maxZone 0", () => {
  const s = game.defaultState();
  assertEqual(s.maxZone, 0);
});

report();
```

- [ ] **Step 3: Rodar para verificar que FALHA (ainda não existe o novo defaultState)**

Run: `node gaiadon-clone/js/game.test.js`
Expected: ❌ — porque `defaultState` atual não tem `maxZone` (ele tem `maxZoneReached`). Falha esperada confirma que o runner funciona e o teste cobre a mudança.

- [ ] **Step 4: Commit**

```bash
git add gaiadon-clone/js/_assert.js gaiadon-clone/js/game.test.js
git commit -m "test: add minimal node test runner + smoke test"
```

---

## Task 2: Reescrever `data.js` (constantes + textos em inglês)

**Files:**
- Modify: `gaiadon-clone/js/data.js` (reescrever por completo)

- [ ] **Step 1: Escrever o novo `data.js`**

```js
// ===== Static game data & balancing (single source of truth) =====
// Todo texto visível ao jogador em inglês.

// Cosmetic regions — purely visual, change every CONFIG.zonesPerRegion zone levels.
const REGIONS = [
  { name: "Plains of Aurin",      enemies: ["Slime", "Giant Rat", "Goblin"] },
  { name: "Whispering Forest",    enemies: ["Shadow Wolf", "Spider", "Treant"] },
  { name: "Frostbound Caverns",   enemies: ["Yeti", "Ice Golem", "Bat"] },
  { name: "Ashen Desert",         enemies: ["Scorpion", "Mummy", "Djinn"] },
  { name: "Gaiadon's Peak",       enemies: ["Young Dragon", "Chimera", "Titan"] },
];

const SLOTS = ["Weapon", "Armor", "Amulet"];

const RARITIES = [
  { name: "common",    weight: 60, mult: 1.0 },
  { name: "uncommon",  weight: 25, mult: 1.5 },
  { name: "rare",      weight: 10, mult: 2.2 },
  { name: "epic",      weight: 4,  mult: 3.5 },
  { name: "legendary", weight: 1,  mult: 6.0 },
];

const ITEM_NAMES = {
  "Weapon": ["Sword", "Axe", "Staff", "Dagger", "Spear"],
  "Armor":  ["Breastplate", "Chainmail", "Tunic", "Cuirass"],
  "Amulet": ["Pendant", "Ring", "Talisman", "Medallion"],
};

// Loja: id, nome (EN), custo base, fator de crescimento, valor por nível.
const SHOP_UPGRADES = [
  { id: "dmg",        name: "Strength (+damage)",       baseCost: 10, growth: 1.15, value: 2 },
  { id: "hp",         name: "Vitality (+health)",       baseCost: 15, growth: 1.15, value: 10 },
  { id: "spd",        name: "Agility (+attack speed)",  baseCost: 25, growth: 1.20, value: 0.05 },
  { id: "gold",       name: "Greed (+gold)",            baseCost: 40, growth: 1.18, value: 0.10 },
  { id: "offlineEff", name: "Dreamcatcher (+offline %)",baseCost: 100,growth: 1.30, value: 0.05 },
  { id: "offlineCap", name: "Hourglass (+offline cap)", baseCost: 150,growth: 1.35, value: 1 }, // +1h por nível
];

// Todas as alavancas de balanceamento num só lugar.
const CONFIG = {
  player: { baseDamage: 5, baseHp: 50, damagePerLevel: 1.5, hpPerLevel: 8, baseAttackSpeed: 1.0 },
  enemy: {
    baseHp: 20, hpGrowth: 1.18,
    baseDmg: 3, dmgGrowth: 1.15,
    baseGold: 6, goldGrowth: 1.14,
    baseXp: 4, xpGrowth: 1.12,
    killsToClear: 10,
    damageFactor: 0.5, // fração do dano do inimigo aplicada por segundo
  },
  drops: {
    baseChance: 0.22,
    guaranteedFirstKills: 3, // primeiros N abates do save sempre dropam
    powerBase: 3, powerPerZone: 1.5,
    inventoryMax: 24,
  },
  xp: { base: 20, growth: 1.25 }, // xpToNext = base * growth^(level-1)
  ascension: { perEssencePct: 0.10, zoneExp: 1.5, zoneDiv: 3, levelDiv: 5 },
  offline: {
    startEfficiency: 0.25, efficiencyMax: 0.60, // base + offlineEff*value, teto 0.60
    startCapHours: 2, capMaxHours: 8,           // base + offlineCap*value, teto 8h
  },
  zonesPerRegion: 10, // muda o tema cosmético a cada 10 de profundidade
};

if (typeof module !== "undefined") {
  module.exports = { REGIONS, SLOTS, RARITIES, ITEM_NAMES, SHOP_UPGRADES, CONFIG };
}
```

- [ ] **Step 2: Rodar os testes (ainda devem falhar no smoke, mas sem erro de carregamento)**

Run: `node gaiadon-clone/js/game.test.js`
Expected: o arquivo carrega sem `ReferenceError`; o teste-fumaça ainda ❌ porque `game.js` não foi reescrito. OK.

- [ ] **Step 3: Commit**

```bash
git add gaiadon-clone/js/data.js
git commit -m "feat(data): rewrite balancing config + English text, infinite-zone model"
```

---

## Task 3: Reescrever a lógica pura `game.js` (profundidade + combate + parede)

Esta é a task central. Escreva os testes primeiro (TDD), depois a implementação.

**Files:**
- Modify: `gaiadon-clone/js/game.js` (reescrever)
- Modify: `gaiadon-clone/js/game.test.js` (adicionar testes)

- [ ] **Step 1: Escrever os testes de estado, escala e combate**

Adicione em `game.test.js` (antes do `report()`):
```js
console.log("== Core logic ==");

test("defaultState tem campos de profundidade", () => {
  const s = game.defaultState();
  assertEqual(s.zone, 1);
  assertEqual(s.maxZone, 0);
  assertEqual(s.killsInZone, 0);
});

test("dano do jogador cresce com upgrade de força", () => {
  const s = game.defaultState();
  const d0 = game.playerDamage(s);
  s.shop.dmg = 5;
  assert(game.playerDamage(s) > d0, "dano deveria subir");
});

test("vida do inimigo escala com a profundidade", () => {
  const a = game.enemyStats(1).hp;
  const b = game.enemyStats(5).hp;
  assert(b > a, "inimigo mais fundo deveria ter mais HP");
});

test("limpar 10 abates avança a maxZone", () => {
  const s = game.defaultState();
  s.zone = 1;
  for (let i = 0; i < CONFIG.enemy.killsToClear; i++) game.registerKill(s);
  assert(s.maxZone >= 1, "deveria ter limpado a profundidade 1");
});

test("morte na fronteira não pune e recua para farm", () => {
  const s = game.defaultState();
  s.maxZone = 3; s.zone = 4; s.gold = 100;
  const inv = s.inventory.length;
  game.handleDeath(s);
  assertEqual(s.gold, 100, "não perde ouro");
  assertEqual(s.inventory.length, inv, "não perde itens");
  assert(s.zone <= s.maxZone, "recua para a profundidade segura");
});

test("essência de ascensão usa profundidade máxima", () => {
  const s = game.defaultState();
  s.maxZone = 10; s.level = 20;
  assert(game.essenceOnAscend(s) > 0, "deveria render essência");
});
```

- [ ] **Step 2: Rodar para confirmar FALHA**

Run: `node gaiadon-clone/js/game.test.js`
Expected: ❌ em vários (funções `enemyStats`, `registerKill`, `handleDeath` não existem; `defaultState` antigo).

- [ ] **Step 3: Escrever o novo `game.js`**

```js
// ===== Core logic (no DOM, testável) =====

function defaultState() {
  return {
    gold: 0,
    level: 1,
    xp: 0,
    essence: 0,
    zone: 1,            // profundidade em combate agora
    maxZone: 0,         // profundidade mais funda já limpa
    killsInZone: 0,     // abates na profundidade atual (limpa em killsToClear)
    totalKills: 0,       // usado para drops garantidos iniciais
    shop: { dmg: 0, hp: 0, spd: 0, gold: 0, offlineEff: 0, offlineCap: 0 },
    equipped: { Weapon: null, Armor: null, Amulet: null },
    inventory: [],
    enemy: null,
    playerHp: null,
    lastSeen: null,      // timestamp do último save (offline)
  };
}

// --- Derivados ---
function ascMultiplier(s) { return 1 + s.essence * CONFIG.ascension.perEssencePct; }

function playerDamage(s) {
  const P = CONFIG.player;
  let base = P.baseDamage + s.shop.dmg * SHOP_UPGRADES[0].value + (s.level - 1) * P.damagePerLevel;
  const w = s.equipped.Weapon;
  if (w) base += w.power;
  return Math.round(base * ascMultiplier(s));
}
function playerMaxHp(s) {
  const P = CONFIG.player;
  let base = P.baseHp + s.shop.hp * SHOP_UPGRADES[1].value + (s.level - 1) * P.hpPerLevel;
  const a = s.equipped.Armor;
  if (a) base += a.power * 3;
  return Math.round(base * ascMultiplier(s));
}
function attackSpeed(s) { return CONFIG.player.baseAttackSpeed + s.shop.spd * SHOP_UPGRADES[2].value; }
function playerDps(s) { return playerDamage(s) * attackSpeed(s); }
function goldBonus(s) {
  let b = 1 + s.shop.gold * SHOP_UPGRADES[3].value;
  const am = s.equipped.Amulet;
  if (am) b += am.power * 0.02;
  return b * ascMultiplier(s);
}

// --- Inimigos (escala por profundidade) ---
function enemyStats(zone) {
  const E = CONFIG.enemy;
  const d = zone - 1; // zone 1 = expoente 0
  return {
    hp:   Math.round(E.baseHp   * Math.pow(E.hpGrowth, d)),
    dmg:  Math.round(E.baseDmg  * Math.pow(E.dmgGrowth, d)),
    gold: Math.round(E.baseGold * Math.pow(E.goldGrowth, d)),
    xp:   Math.round(E.baseXp   * Math.pow(E.xpGrowth, d)),
  };
}
function regionFor(zone) {
  const i = Math.floor((zone - 1) / CONFIG.zonesPerRegion) % REGIONS.length;
  return REGIONS[i];
}
function spawnEnemy(s) {
  const region = regionFor(s.zone);
  const stats = enemyStats(s.zone);
  const name = region.enemies[Math.floor(Math.random() * region.enemies.length)];
  s.enemy = { name, hp: stats.hp, maxHp: stats.hp, dmg: stats.dmg, goldReward: stats.gold, xpReward: stats.xp };
  return s.enemy;
}

// --- Loot ---
function rollRarity() {
  const total = RARITIES.reduce((a, r) => a + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of RARITIES) { if (roll < r.weight) return r; roll -= r.weight; }
  return RARITIES[0];
}
function generateItem(s) {
  const D = CONFIG.drops;
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const rarity = rollRarity();
  const baseName = ITEM_NAMES[slot][Math.floor(Math.random() * ITEM_NAMES[slot].length)];
  const power = Math.round((D.powerBase + s.zone * D.powerPerZone) * rarity.mult * (0.8 + Math.random() * 0.4));
  return { id: Math.random().toString(36).slice(2, 9), slot, rarity: rarity.name, name: baseName, power };
}
function maybeDrop(s) {
  const D = CONFIG.drops;
  const guaranteed = s.totalKills <= D.guaranteedFirstKills;
  if (guaranteed || Math.random() < D.baseChance) {
    const item = generateItem(s);
    s.inventory.push(item);
    if (s.inventory.length > D.inventoryMax) s.inventory.shift();
    return item;
  }
  return null;
}

// --- Ações ---
function equipItem(s, itemId) {
  const idx = s.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) return null;
  const item = s.inventory[idx];
  const prev = s.equipped[item.slot];
  s.equipped[item.slot] = item;
  s.inventory.splice(idx, 1);
  if (prev) s.inventory.push(prev);
  return item;
}
function xpToNext(s) { return Math.round(CONFIG.xp.base * Math.pow(CONFIG.xp.growth, s.level - 1)); }
function gainXp(s, amount) {
  s.xp += amount;
  let leveled = false;
  while (s.xp >= xpToNext(s)) { s.xp -= xpToNext(s); s.level++; leveled = true; }
  return leveled;
}

// Registra um abate: recompensas + progressão de profundidade. Retorna o evento "kill".
function registerKill(s) {
  const e = s.enemy;
  const g = Math.round(e.goldReward * goldBonus(s));
  s.gold += g;
  const leveled = gainXp(s, e.xpReward);
  s.totalKills++;
  const drop = maybeDrop(s);
  s.killsInZone++;
  let advanced = false, walledCleared = false;
  if (s.killsInZone >= CONFIG.enemy.killsToClear) {
    s.killsInZone = 0;
    if (s.zone > s.maxZone) { s.maxZone = s.zone; walledCleared = true; } // limpou a fronteira
    // Próximo passo: tentar a fronteira seguinte automaticamente.
    s.zone = s.maxZone + 1;
    advanced = true;
  }
  s.playerHp = playerMaxHp(s); // cura ao matar
  return { type: "kill", name: e.name, gold: g, leveled, drop, advanced, walledCleared, zone: s.zone };
}

// Morte: sem punição. Recua para a profundidade segura (maxZone) e zera o contador.
// Captura a profundidade da PAREDE (onde morreu) antes de recuar, para a mensagem.
function handleDeath(s) {
  const wallZone = s.zone;
  s.killsInZone = 0;
  s.zone = Math.max(1, s.maxZone);
  s.playerHp = playerMaxHp(s);
  return { type: "death", wallZone, zone: s.zone };
}

// Processa dt segundos de combate. Retorna lista de eventos para a UI.
function tick(s, dt) {
  if (!s.enemy) spawnEnemy(s);
  if (s.playerHp === null) s.playerHp = playerMaxHp(s);
  const events = [];

  const dmgToEnemy = playerDps(s) * dt;
  s.enemy.hp -= dmgToEnemy;
  events.push({ type: "hit", amount: dmgToEnemy }); // para floating damage

  s.playerHp -= s.enemy.dmg * CONFIG.enemy.damageFactor * dt;

  if (s.playerHp <= 0) { events.push(handleDeath(s)); spawnEnemy(s); return events; }

  if (s.enemy.hp <= 0) { events.push(registerKill(s)); spawnEnemy(s); }
  return events;
}

// --- Ascensão ---
function essenceOnAscend(s) {
  const A = CONFIG.ascension;
  return Math.floor(Math.pow(s.maxZone + 1, A.zoneExp) / A.zoneDiv + s.level / A.levelDiv);
}
function ascend(s) {
  const gain = essenceOnAscend(s);
  if (gain <= 0) return false;
  const keepEssence = s.essence + gain;
  Object.assign(s, defaultState());
  s.essence = keepEssence;
  return gain;
}

// --- Loja ---
function shopCost(s, id) {
  const u = SHOP_UPGRADES.find(x => x.id === id);
  return Math.round(u.baseCost * Math.pow(u.growth, s.shop[id]));
}
function buyUpgrade(s, id) {
  const cost = shopCost(s, id);
  if (s.gold < cost) return false;
  s.gold -= cost; s.shop[id]++;
  return true;
}

if (typeof module !== "undefined") {
  module.exports = {
    defaultState, ascMultiplier, playerDamage, playerMaxHp, attackSpeed, playerDps, goldBonus,
    enemyStats, regionFor, spawnEnemy, rollRarity, generateItem, maybeDrop, equipItem,
    xpToNext, gainXp, registerKill, handleDeath, tick, essenceOnAscend, ascend, shopCost, buyUpgrade,
  };
}
```

- [ ] **Step 4: Rodar e verificar que PASSA**

Run: `node gaiadon-clone/js/game.test.js`
Expected: todos ✅. Se algum ❌, corrigir a lógica (não o teste, salvo erro óbvio no teste).

- [ ] **Step 5: Commit**

```bash
git add gaiadon-clone/js/game.js gaiadon-clone/js/game.test.js
git commit -m "feat(game): infinite-zone combat, wall/death, zone-based ascension"
```

---

## Task 4: Atualizar `ui.js`, `index.html`, `main.js` (estado novo + inglês + barra de next-goal)

Objetivo: o jogo volta a rodar no navegador, em inglês, com o novo modelo. Verificação é jogando.

**Files:**
- Modify: `gaiadon-clone/index.html`
- Modify: `gaiadon-clone/js/ui.js`
- Modify: `gaiadon-clone/js/main.js`

- [ ] **Step 1: Atualizar `index.html` (textos EN + elementos novos)**

Trocar todos os textos PT→EN e adaptar a seção de combate ao modelo de profundidade.

> ⚠️ **Importante (evita bug):** **substitua por completo** a `<section id="combat">` antiga e **remova** a `<div class="zone-controls">` (botões `prevZone`/`nextZone`) e os elementos antigos `#zoneName`/`#zone`. Não pode haver IDs duplicados — `getElementById` quebra se sobrar marcação velha. Os antigos `#zoneName`/`#zone` são **trocados** por `#regionName`/`#zone`.

Mudanças principais:
- `<title>`: `Gaiadon Clone — Eternal Quest (prototype)`
- Header recursos: `💰 Gold`, `⭐ Level`, `🔮 Essence`, `📈 Multiplier`.
- Seção de combate: trocar "Zona/zone" por **Zone**. Substituir o bloco de zona por:
```html
<h2><span id="regionName">Plains of Aurin</span> <small>(zone <span id="zone">1</span>)</small></h2>
<div class="enemy">
  <div class="enemy-name" id="enemyName">Slime</div>
  <div class="hpbar"><div class="hpfill" id="enemyHpFill"></div><span id="enemyHpText">0/0</span></div>
  <div class="kills">Clear progress: <b id="kills">0</b>/10</div>
</div>
<div class="player-stats">
  <span>🗡️ Damage: <b id="dmg">0</b></span>
  <span>❤️ Health: <b id="hp">0</b></span>
  <span>⚡ DPS: <b id="dps">0</b></span>
</div>
<!-- Barra de próximo objetivo -->
<div class="next-goal" id="nextGoal"></div>
<div class="combat-stage" id="combatStage"><p class="log" id="log">Adventure started...</p></div>
```
- Remover os botões `prevZone`/`nextZone` (a progressão é automática). Manter o resto.
- Painéis: `🛡️ Equipment`, `Backpack`, `🏪 Upgrade Shop`, `🔮 Ascension` (traduzir o parágrafo: "Reset your journey to gain **Essence**, a permanent multiplier to damage and gold."), `Essence on ascend now:`. Botão `Ascend`.
- Footer: `💾 Save`, `🗑️ Reset all`.

- [ ] **Step 2: Atualizar `ui.js` (EN + novo estado + floating damage helper)**

Pontos-chave (manter estrutura atual de funções `render*`):
- `renderResources`: `Gold/Level/Essence`, multiplicador `"x" + ascMultiplier(s).toFixed(2)`.
- `renderCombat`: usar `regionFor(s).name` em `regionName`, `s.zone` em `zone`, `s.enemy` HP, `s.killsInZone` em `kills`, `playerDamage/playerMaxHp/playerDps`. Remover lógica de botões de zona.
- `renderNextGoal(s)`: texto do próximo marco, ex.:
```js
function renderNextGoal(s) {
  const left = CONFIG.enemy.killsToClear - s.killsInZone;
  const target = s.zone > s.maxZone ? `Breaking through zone ${s.zone}` : `Clearing zone ${s.zone}`;
  $("nextGoal").textContent = `Next: ${target} — ${left} kill${left===1?"":"s"} left`;
}
```
- `itemLabel`/`renderGear`/`renderShop`/`renderAscend`: traduzir strings ("empty", "Backpack empty — defeat enemies to drop items.", "click to equip", "Nv"→"Lv", "Lv " + level).
- Classes de raridade: renomear `rar-comum`→`rar-common` etc. (combinar com `data.js` e `style.css`).
- Adicionar `spawnFloatingDamage(amount)` que cria um `<span class="floating-dmg">` dentro de `#combatStage` e o remove após a animação (será usado na Task 7; por ora só definir e exportar via escopo global).

- [ ] **Step 3: Atualizar `main.js` (EN + handlers + remover botões de zona)**

- `handleEvents`: mensagens em inglês. Tratar `kill`, `death` (usar `ev.wallZone`: `"You're not strong enough for zone ${ev.wallZone} yet. Farm and grow stronger!"`), `walledCleared` (`"Broke through to zone X!"`).
- `bindButtons`: remover `prevZone`/`nextZone`. Manter `ascendBtn` (confirm em inglês), `saveBtn`, `resetBtn` (confirms em inglês).
- `gameLoop`: chamar `renderNextGoal(state)` junto com os outros renders.
- Save/load: ver Task 5 (timestamp já incluído aqui só como `state.lastSeen = Date.now()` no `save()`).

- [ ] **Step 4: Verificação manual (jogar)**

Abrir `gaiadon-clone/index.html` no navegador.
Expected:
- Texto todo em inglês.
- Combate roda; "Clear progress" sobe; ao limpar 10, a zone avança sozinha.
- Loja compra; dano/vida sobem.
- Sem erros no console (F12).

- [ ] **Step 5: Commit**

```bash
git add gaiadon-clone/index.html gaiadon-clone/js/ui.js gaiadon-clone/js/main.js
git commit -m "feat(ui): English UI, zone model wiring, next-goal bar"
```

---

## Task 5: Progresso offline (cálculo puro + resumo no load)

**Files:**
- Modify: `gaiadon-clone/js/game.js` (adicionar `offlineConfig`, `computeOfflineGains`)
- Modify: `gaiadon-clone/js/game.test.js`
- Modify: `gaiadon-clone/js/main.js` (save com timestamp, aplicar no load, mostrar resumo)
- Modify: `gaiadon-clone/index.html` (modal simples de resumo) + `style.css`

- [ ] **Step 1: Escrever testes de offline**

```js
console.log("== Offline ==");
test("eficiência offline sobe com upgrade e respeita o teto", () => {
  const s = game.defaultState();
  const e0 = game.offlineConfig(s).efficiency;
  s.shop.offlineEff = 100; // muito
  const e1 = game.offlineConfig(s).efficiency;
  assert(e1 > e0, "eficiência deveria subir");
  assert(e1 <= CONFIG.offline.efficiencyMax + 1e-9, "não pode passar do teto");
});
test("ganhos offline são proporcionais ao tempo, com teto de acúmulo", () => {
  const s = game.defaultState();
  s.maxZone = 3; s.zone = 3;
  const oneHour = game.computeOfflineGains(s, 3600);
  const tenHours = game.computeOfflineGains(s, 36000); // > teto inicial (2h)
  assert(oneHour.gold > 0, "deveria render ouro");
  assert(tenHours.seconds <= game.offlineConfig(s).capHours * 3600 + 1, "respeita o teto de horas");
});
```

- [ ] **Step 2: Rodar para confirmar FALHA**

Run: `node gaiadon-clone/js/game.test.js`
Expected: ❌ (`offlineConfig`/`computeOfflineGains` não existem).

- [ ] **Step 3: Implementar em `game.js`**

```js
function offlineConfig(s) {
  const O = CONFIG.offline;
  const efficiency = Math.min(O.efficiencyMax, O.startEfficiency + s.shop.offlineEff * SHOP_UPGRADES[4].value);
  const capHours   = Math.min(O.capMaxHours,   O.startCapHours   + s.shop.offlineCap * SHOP_UPGRADES[5].value);
  return { efficiency, capHours };
}

// Estima ganhos enquanto offline, de forma barata (fórmula, sem rodar ticks).
function computeOfflineGains(s, elapsedSec) {
  const { efficiency, capHours } = offlineConfig(s);
  const seconds = Math.max(0, Math.min(elapsedSec, capHours * 3600));
  const farmZone = Math.max(1, s.maxZone); // farma na profundidade segura
  const stats = enemyStats(farmZone);
  const killsPerSec = playerDps(s) / Math.max(1, stats.hp);
  const kills = killsPerSec * seconds * efficiency;
  const gold = Math.round(kills * stats.gold * goldBonus(s));
  const xp = Math.round(kills * stats.xp);
  return { seconds, kills: Math.floor(kills), gold, xp };
}
```
Exportar `offlineConfig` e `computeOfflineGains` no `module.exports`.

- [ ] **Step 4: Rodar e verificar PASSA**

Run: `node gaiadon-clone/js/game.test.js`
Expected: ✅.

- [ ] **Step 5: Aplicar no load (em `main.js`)**

- No `save()`: `state.lastSeen = Date.now();` antes de serializar. ⚠️ O `save()` atual faz `delete copy.enemy; delete copy.playerHp;` — **NÃO** delete `lastSeen` (ele precisa persistir).
- No `load()`: a ordem importa. Primeiro faça o merge existente (`Object.assign(defaultState(), parsed)` + as garantias de `shop`/`equipped`). **Depois** rode o crédito offline abaixo. **Só então** chame `spawnEnemy(state)` e `state.playerHp = playerMaxHp(state)`. Se `state.lastSeen`:
```js
const elapsed = (Date.now() - state.lastSeen) / 1000;
if (elapsed > 60) { // só vale a pena acima de 1 min
  const g = computeOfflineGains(state, elapsed);
  state.gold += g.gold; gainXp(state, g.xp);
  showOfflineSummary(g); // função de UI que preenche o modal
}
```
- `showOfflineSummary(g)`: preencher um modal simples (criado no index/css) com tempo (`Math.floor(g.seconds/3600)h`), `+gold`, `+xp`, `+kills`. Texto em inglês: `"While you were away (Xh Ym): +<gold> gold, +<xp> XP, <kills> kills."` com botão `Collect`.

- [ ] **Step 6: Verificação manual**

Jogar, salvar, fechar a aba, esperar ~2 min, reabrir.
Expected: modal de "While you were away..." aparece com ganhos > 0.

- [ ] **Step 7: Commit**

```bash
git add gaiadon-clone/js/game.js gaiadon-clone/js/game.test.js gaiadon-clone/js/main.js gaiadon-clone/index.html gaiadon-clone/style.css
git commit -m "feat: offline progress (upgradable efficiency & cap) + summary modal"
```

---

## Task 6: Game feel (floating damage, brilho de drop, marcos)

Verificação por jogo. Sem testes unitários (é visual).

**Files:**
- Modify: `gaiadon-clone/style.css`
- Modify: `gaiadon-clone/js/ui.js`
- Modify: `gaiadon-clone/js/main.js`

- [ ] **Step 1: CSS de animações**

Adicionar a `style.css`:
```css
.combat-stage { position: relative; min-height: 60px; }
.floating-dmg {
  position: absolute; left: 50%; top: 10px; transform: translateX(-50%);
  font-weight: bold; color: var(--gold); pointer-events: none;
  animation: floatUp 0.8s ease-out forwards;
}
@keyframes floatUp { to { transform: translate(-50%, -28px); opacity: 0; } }
.drop-flash { animation: dropGlow 0.6s ease-out; }
@keyframes dropGlow { 0% { box-shadow: 0 0 0 0 var(--accent); } 100% { box-shadow: 0 0 12px 4px transparent; } }
.milestone { color: var(--gold); font-weight: bold; }
```

- [ ] **Step 2: `ui.js` — floating damage + flash**

- Implementar `spawnFloatingDamage(amount)` (cria/remova o span). Acumular dano e mostrar a cada ~0.3s (não a cada tick) para não poluir.
- Ao dropar item raro+, aplicar classe `drop-flash` no painel de inventário por 600ms.

- [ ] **Step 3: `main.js` — disparar efeitos e marcos**

- Em `handleEvents`/`gameLoop`: para eventos `hit`, alimentar o acumulador de floating damage; para `drop` de raridade ≥ rare, disparar flash; para `walledCleared`, logar com classe `milestone` ("Broke through to zone X!"). Primeira lendária e primeira ascensão também com `milestone`.

- [ ] **Step 4: Verificação manual**

Expected: números de dano sobem na tela; drop raro pisca; avançar de profundidade mostra mensagem destacada. Sem travar (performance ok).

- [ ] **Step 5: Commit**

```bash
git add gaiadon-clone/js/ui.js gaiadon-clone/js/main.js gaiadon-clone/style.css
git commit -m "feat(feel): floating damage, drop flash, milestone messages"
```

---

## Task 7: Passe de balanceamento (bater as metas de ritmo)

Objetivo: ajustar **somente `CONFIG` em `data.js`** para atingir as metas da spec. Usar um teste de simulação como guia (aproximado, não exato).

**Files:**
- Modify: `gaiadon-clone/js/game.test.js` (teste de simulação)
- Modify: `gaiadon-clone/js/data.js` (afinar `CONFIG`)

- [ ] **Step 1: Escrever um teste de simulação de sanidade**

> ℹ️ **Esperado:** com os valores iniciais de `CONFIG`, estes dois testes provavelmente **falham de propósito** (ex.: 5 DPS contra 20 de HP não mata em 1s). Isso **não é bug no seu código** — é o sinal de que falta balancear. Você ajusta o `CONFIG` no Step 2 até ficarem verdes.

```js
console.log("== Pacing sanity ==");
test("o primeiro abate acontece em < 1s de combate", () => {
  const s = game.defaultState();
  game.spawnEnemy(s); s.playerHp = game.playerMaxHp(s);
  const evs = game.tick(s, 1.0); // 1 segundo
  assert(evs.some(e => e.type === "kill"), "deveria matar o 1º inimigo em ~1s");
});
test("primeiro upgrade de dano fica acessível cedo", () => {
  const s = game.defaultState();
  game.spawnEnemy(s); s.playerHp = game.playerMaxHp(s);
  let t = 0;
  while (s.gold < game.shopCost(s, "dmg") && t < 30) { game.tick(s, 0.1); t += 0.1; }
  assert(t < 10, `1º upgrade deveria caber em <10s, levou ${t.toFixed(1)}s`);
});
```

- [ ] **Step 2: Rodar e ajustar `CONFIG`**

Run: `node gaiadon-clone/js/game.test.js`
Se algum ❌, ajustar `CONFIG.enemy.baseHp/baseGold/...` e `SHOP_UPGRADES[*].baseCost` em `data.js` até passar. Iterar.
Expected ao fim: todos ✅.

- [ ] **Step 3: Verificação manual da meta dos ~20 min**

Jogar uma sessão real (ou usar uma simulação maior) e conferir que a primeira ascensão fica viável por volta dos 15-20 min e claramente vale a pena (multiplicador perceptível). Ajustar `CONFIG.ascension.*` conforme necessário.

- [ ] **Step 4: Commit**

```bash
git add gaiadon-clone/js/data.js gaiadon-clone/js/game.test.js
git commit -m "balance: tune CONFIG to hit first-session pacing targets"
```

---

## Task 8: README + sweep final de tradução e QA

**Files:**
- Create: `gaiadon-clone/README.md`
- Modify: qualquer string PT remanescente

- [ ] **Step 1: Escrever `README.md`** (em inglês, já que é parte do aprendizado)

Conteúdo: o que é o jogo, como rodar (`abrir index.html`), como testar (`node js/game.test.js`), e um resumo do modelo de profundidade/parede/offline para referência futura.

- [ ] **Step 2: Sweep de tradução**

Procurar strings em português visíveis ao jogador. No Windows (PowerShell):
```powershell
Select-String -Path gaiadon-clone\index.html, gaiadon-clone\js\*.js -Pattern "Ouro|Vida|Dano|Derrotou|Salvo|Próxima|Zona|Mochila|vazio|essência" -CaseSensitive:$false
```
Revisar cada resultado e traduzir o que escapou (lembrando: comentários em PT podem ficar; só o texto visível ao jogador vira inglês).

- [ ] **Step 3: Checklist de QA manual**

Abrir o jogo e confirmar:
- [ ] Todo texto visível em inglês.
- [ ] Combate, drops garantidos iniciais, avanço de profundidade automático.
- [ ] Morte mostra mensagem e recua sem perder nada.
- [ ] Loja (inclui upgrades de offline) funciona.
- [ ] Ascensão reseta e dá essência/multiplicador.
- [ ] Save/Reset funcionam; offline mostra resumo.
- [ ] Sem erros no console.
- [ ] `node js/game.test.js` → tudo ✅.

- [ ] **Step 4: Commit**

```bash
git add gaiadon-clone/README.md gaiadon-clone/
git commit -m "docs: add README; final English translation sweep"
```

---

## Resumo de execução

Ordem: Task 0 → 8. Cada task termina rodável (navegador) ou verde (testes) e com commit. As tasks 1-3 e 5 são TDD puro (lógica). As tasks 4, 6, 8 são verificadas jogando. A task 7 usa simulação + jogo para balancear.

**Metas de aceite (da spec):**
- Primeiro abate <1s; primeiro upgrade ~5s; drops iniciais garantidos.
- Avanço de profundidade automático; parede = morte sem punição, só não avança.
- Offline funciona, é melhorável por upgrade, com teto.
- Primeira ascensão viável ~20 min e claramente vantajosa.
- Todo texto do jogo em inglês.
- Matemática crítica coberta por `game.test.js`.
