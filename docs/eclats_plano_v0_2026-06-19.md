# Plano de Implementação — v0 "A primeira subida" (recomeço Éclats)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recomendado) ou superpowers:executing-plans para implementar este plano tarefa-a-tarefa.
> Os passos usam checkbox (`- [ ]`) para tracking.

**Goal:** Reconstruir o Éclats do zero como um núcleo idle mínimo, limpo e balanceável — a
"primeira subida" (Área 1, lv 1→60) — mantendo a pele Éclats (arte, CSS, shell).

**Architecture:** Árvore `src/` nova com **lógica pura separada do DOM** (testável por
unidade) e um **simulador** que importa as fórmulas reais. Núcleo: combate auto single-target
com **HP relativo** (HP do mob = HP do player × raridade × ×área), motor de stat
`base(Nível) + upgrades(gold)`, áreas com gate por nível. Sistemas do modelo antigo (gear,
passivas, mémoires, ascension, convergence, ondas) são **removidos** (git preserva o
histórico) — entram de volta um por vez em v1+.

**Tech Stack:** Vite 8 + JS puro (ES6 modules), `break_infinity.js` (presente, não usado no
v0), **vitest** (novo, p/ TDD da lógica pura), localStorage (save). Sem frameworks de UI.

**Fonte da verdade do design:** `docs/eclats_recomeco_nucleo_2026-06-19.md` (§3 núcleo, §4 v0).
**Todos os números são SEMENTES** — afinados pelo simulador (Task 18). Não invente fora disso.

---

## Estrutura de arquivos

### Mantém como está (a pele + infra boa — NÃO tocar)
- `index.html` — shell (#stage, .stage-main, .topbar). Bom.
- `public/**` — toda a arte Éclats (backgrounds, mobs, ícones).
- `src/core/format.js` — formatação de números. Reuso verbatim.
- `src/core/loop.js` — tick fixo 100ms com acumulador. Reuso verbatim (importa
  `TICK_SECONDS`, `MAX_CATCHUP_TICKS` das constants novas).
- `src/core/save.js` — persistência localStorage. Reuso verbatim (depende de
  `toSnapshot`/`applySnapshot` do state novo + `SAVE_KEY`/`SCHEMA_VERSION`/`AUTOSAVE_MS`).
- `src/data/assets.js` — pipeline de assets (picture/bg/url/path). Reuso verbatim.
- `src/ui/tokens.css`, `src/ui/shell.css`, `src/ui/combat.css`, `src/ui/player.css` — skin
  reutilizada. Mantém as classes; o JS novo as consome.
- `tools/eclats-pipeline/**` — geração de assets. Não tocar.

### Remove (modelo antigo — git preserva; serão recriados ou reintroduzidos em v1+)
- `src/game/*.js` TODOS (combat, stats, economy, enemies, convergence, ascension, gear,
  passives, memoires, difficulty, fatekeepers, offline).
- `src/ui/*.js` TODOS (ui, combat, player, map, gear, forge, passives, memoires, ascension,
  awaken, convergence, offline) e `src/ui/components/`.
- `src/ui/{map,gear,forge,passives,memoires,ascension}.css` (telas fora do v0).
- `src/core/{state,dev}.js` (state recriado; dev opcional fora do v0).
- `src/data/constants.js` (recriado, enxuto).
- `src/main.js` (recriado).
- `tools/sim/*` (recriado: `v0.mjs`).
> `save.js`, `format.js`, `loop.js`, `assets.js` e os 4 CSS **permanecem**.

### Cria (núcleo v0)
| Arquivo | Responsabilidade |
|---|---|
| `src/data/constants.js` | Sementes de tuning + defs de Área (1 só no v0). |
| `src/core/state.js` | Shape mínimo do estado + `createInitialState`/`toSnapshot`/`applySnapshot`. |
| `src/game/player.js` | **Puro.** Nível a partir de XP; Dano/HP/APS derivados. |
| `src/game/enemy.js` | **Puro.** `spawnEnemy` (HP = HP player × raridade × ×área; dmg por nível). |
| `src/game/economy.js` | **Puro.** Gold/XP por kill; custo e compra de upgrades. |
| `src/game/combat.js` | Orquestra o tick (ataque por APS, dano, kill, regen, morte/respawn, gate). |
| `src/ui/shell.js` | Casca: nav/coins/fit (versão enxuta do antigo ui.js). |
| `src/ui/combat-view.js` | Cena: card do Seeker + 1 mob + floaties + painel de upgrades. |
| `src/main.js` | Bootstrap: load → init → loop → autosave. |
| `src/game/*.test.js` | Testes vitest (player, enemy, economy, combat). |
| `tools/sim/v0.mjs` | Simulador da subida lv1→60 (importa fórmulas reais) p/ tunar sementes. |

---

## Fase 0 — Fundação

### Task 1: Instalar vitest e script de teste

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar vitest**

Run: `npm install -D vitest`
Expected: vitest aparece em devDependencies.

- [ ] **Step 2: Adicionar scripts de teste**

Em `package.json`, no bloco `"scripts"`, adicionar:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Verificar que o runner sobe (sem testes ainda)**

Run: `npm test`
Expected: vitest roda e reporta "No test files found" (ou 0 testes) — sem erro de runner.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(v0): adiciona vitest para TDD do nucleo"
```

### Task 2: Remover o modelo antigo (quarentena via git)

**Files:** Remoções (ver "Remove" acima). `save/format/loop/assets` e os 4 CSS **permanecem**.

- [ ] **Step 1: Remover os módulos de jogo e UI antigos**

```bash
git rm src/game/*.js
git rm src/ui/ui.js src/ui/combat.js src/ui/player.js src/ui/map.js src/ui/gear.js \
       src/ui/forge.js src/ui/passives.js src/ui/memoires.js src/ui/ascension.js \
       src/ui/awaken.js src/ui/convergence.js src/ui/offline.js
git rm -r src/ui/components
git rm src/ui/map.css src/ui/gear.css src/ui/forge.css src/ui/passives.css \
       src/ui/memoires.css src/ui/ascension.css
git rm src/core/state.js src/core/dev.js src/data/constants.js src/main.js
git rm -r tools/sim
```
> Se algum caminho não existir, ignore o erro daquele arquivo. Confirme com `git status`.

- [ ] **Step 2: Confirmar que a pele permanece**

Run: `ls src/core src/data src/ui`
Expected: existem `src/core/format.js`, `src/core/loop.js`, `src/core/save.js`,
`src/data/assets.js`, `src/ui/tokens.css`, `src/ui/shell.css`, `src/ui/combat.css`,
`src/ui/player.css`. (O jogo NÃO roda agora — vamos recriar nas próximas tasks.)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(v0): remove modelo antigo (mantem pele: format/loop/save/assets/css)"
```

### Task 3: Constantes do v0 (sementes)

**Files:**
- Create: `src/data/constants.js`

- [ ] **Step 1: Escrever as constantes**

```javascript
// Constantes do v0. TODOS os números são SEMENTES — afinar pelo simulador (tools/sim/v0.mjs).
// Fonte do design: docs/eclats_recomeco_nucleo_2026-06-19.md §4.

// Save / loop
export const SAVE_KEY = 'eclats_v0_save';
export const SCHEMA_VERSION = 100;      // recomeço: schema novo (saves antigos descartados)
export const AUTOSAVE_MS = 10000;
export const TICK_SECONDS = 0.1;        // consumido por core/loop.js
export const MAX_CATCHUP_TICKS = 50;    // consumido por core/loop.js

// Player: base + ganho por nível (Nível = base pequena; §3.5)
export const PLAYER = {
  baseDano: 10,          // dano ~10 no início (orçamento de décadas começa aqui)
  baseHp: 100,
  baseAPS: 1.0,          // ataques/seg — constante no v0 (sem upgrade de APS)
  danoPerLevel: 2,       // pequeno: o gold é que cresce o Dano
  hpPerLevel: 20,
  regenPerSec: 0.02,     // 2%/s do HP máx
  regenOnKill: 0.02,     // +2% do HP máx ao matar
  respawnSeconds: 3,     // sem punição: respawn com HP cheio
};

// Upgrades comprados com gold (custo escala). §4: Forjar Dano + Reforçar Vida.
export const UPGRADES = {
  dano: { stat: 'dano', label: 'Forjar Dano',   perLevel: 5,  costBase: 10, costGrowth: 1.15 },
  vida: { stat: 'hp',   label: 'Reforçar Vida', perLevel: 50, costBase: 10, costGrowth: 1.15 },
};

// Inimigo: HP relativo ao player; dano escala com o nível (não com seu HP). §3.1
export const ENEMY = {
  hpMultCommon: 1.3,
  hpMultRare: 1.8,       // hook p/ v1 (v0 só usa comum)
  dmgBase: 2,
  dmgPerLevel: 1.5,
};

// Economia: gold/xp por kill, proporcionais ao HP do mob.
export const ECONOMY = {
  goldPerKillRatio: 0.5,
  xpPerKillRatio: 0.4,
};

// Curva de nível: XP p/ ir de L → L+1 (geométrica).
export const LEVEL = {
  base: 50,
  growth: 1.12,
};

// Áreas. v0 = só a Área 1 (lv 1→60, ×HP da área = 1.0). IDs de asset confirmados em assets.js.
export const AREAS = [
  {
    id: 1, name: 'The Dreaming Wood',
    lvlLo: 1, lvlCap: 60, hpMult: 1.0,
    bg: 'backgrounds.map1',
    enemyName: 'Candlewisp Shade',
    enemyArt: 'enemies.map1.candlewisp_shade',
  },
];
```

- [ ] **Step 2: Verificar import de assets**

Run: `node -e "import('./src/data/assets.js').then(m=>console.log(typeof m.picture, m.path('backgrounds.map1')))"`
Expected: imprime `function` e um caminho não-vazio. Se `backgrounds.map1` ou
`enemies.map1.candlewisp_shade` não resolverem, abra `src/data/assets.js`, procure o ID
correto do background/mob do Map 1 e ajuste as strings em `AREAS`.

- [ ] **Step 3: Commit**

```bash
git add src/data/constants.js
git commit -m "feat(v0): constantes-semente do nucleo"
```

### Task 4: Estado mínimo + snapshot

**Files:**
- Create: `src/core/state.js`

- [ ] **Step 1: Escrever o state**

```javascript
// Estado central do v0. Único objeto mutável compartilhado. Mínimo e plano.
import { SCHEMA_VERSION } from '../data/constants.js';

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,

    // Recursos / progressão persistida
    gold: 0,
    xpTotal: 0,                 // XP acumulado → nível (derivado em game/player.js)
    upgrades: { dano: 0, vida: 0 },
    area: 1,
    unlockedArea: 1,            // maior área destravada (bater o cap destrava a próxima)
    killsTotal: 0,

    // Runtime (não persistido)
    player: { hp: 0, attackTimer: 0, dead: false, respawnTimer: 0 },
    enemy: null,                // mob atual (1 por vez no v0)
    fx: [],                     // fila de números flutuantes p/ a UI
  };
}

export const state = createInitialState();

// Só o que persiste (runtime é reconstruído no load).
export function toSnapshot() {
  return {
    schemaVersion: state.schemaVersion,
    gold: state.gold,
    xpTotal: state.xpTotal,
    upgrades: { ...state.upgrades },
    area: state.area,
    unlockedArea: state.unlockedArea,
    killsTotal: state.killsTotal,
  };
}

export function applySnapshot(s) {
  state.gold = s.gold ?? 0;
  state.xpTotal = s.xpTotal ?? 0;
  state.upgrades = { dano: s.upgrades?.dano ?? 0, vida: s.upgrades?.vida ?? 0 };
  state.area = s.area ?? 1;
  state.unlockedArea = s.unlockedArea ?? 1;
  state.killsTotal = s.killsTotal ?? 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/state.js
git commit -m "feat(v0): estado minimo + snapshot"
```

---

## Fase 1 — Lógica pura (TDD)

> Todas as funções abaixo são **puras** (entrada → saída, sem DOM). Padrão TDD: teste vermelho
> → implementação mínima → verde → commit.

### Task 5: Nível a partir de XP (player.js — parte 1)

**Files:**
- Create: `src/game/player.js`
- Test: `src/game/player.test.js`

- [ ] **Step 1: Teste vermelho**

```javascript
// src/game/player.test.js
import { describe, it, expect } from 'vitest';
import { xpToNext, xpForLevel, levelFromXp } from './player.js';

describe('curva de nível', () => {
  it('nível 1 começa em 0 XP acumulado', () => {
    expect(xpForLevel(1)).toBe(0);
  });
  it('xpForLevel é a soma cumulativa de xpToNext', () => {
    expect(xpForLevel(3)).toBe(xpToNext(1) + xpToNext(2));
  });
  it('levelFromXp é o inverso de xpForLevel', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(xpForLevel(10))).toBe(10);
    expect(levelFromXp(xpForLevel(10) - 1)).toBe(9);
  });
  it('XP cresce a cada nível (geométrico)', () => {
    expect(xpToNext(2)).toBeGreaterThan(xpToNext(1));
  });
});
```

- [ ] **Step 2: Rodar — falha**

Run: `npx vitest run src/game/player.test.js`
Expected: FAIL ("xpToNext is not a function" / módulo não encontrado).

- [ ] **Step 3: Implementação mínima**

```javascript
// src/game/player.js
import { PLAYER, UPGRADES, LEVEL } from '../data/constants.js';

// XP para ir de `level` → `level+1` (geométrico).
export function xpToNext(level) {
  return Math.round(LEVEL.base * LEVEL.growth ** (level - 1));
}

// XP acumulado para ALCANÇAR `level` (level 1 = 0).
export function xpForLevel(level) {
  let total = 0;
  for (let L = 1; L < level; L++) total += xpToNext(L);
  return total;
}

// Nível atual a partir do XP acumulado.
export function levelFromXp(xp) {
  let L = 1;
  while (xp >= xpForLevel(L + 1)) L++;
  return L;
}
```

- [ ] **Step 4: Rodar — verde**

Run: `npx vitest run src/game/player.test.js`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/game/player.js src/game/player.test.js
git commit -m "feat(v0): curva de nivel (xp <-> level)"
```

### Task 6: Stats derivados Dano/HP/APS (player.js — parte 2)

**Files:**
- Modify: `src/game/player.js`
- Test: `src/game/player.test.js`

- [ ] **Step 1: Teste vermelho** (adicionar ao arquivo de teste)

```javascript
import { playerDano, playerHpMax, playerAPS, dps } from './player.js';

describe('stats derivados', () => {
  const base = { xpTotal: 0, upgrades: { dano: 0, vida: 0 } };
  it('no lv 1 sem upgrades = base', () => {
    expect(playerDano(base)).toBe(10);   // PLAYER.baseDano
    expect(playerHpMax(base)).toBe(100); // PLAYER.baseHp
    expect(playerAPS(base)).toBe(1.0);
  });
  it('upgrades de dano somam perLevel', () => {
    expect(playerDano({ ...base, upgrades: { dano: 3, vida: 0 } })).toBe(10 + 3 * 5);
  });
  it('upgrades de vida somam perLevel', () => {
    expect(playerHpMax({ ...base, upgrades: { dano: 0, vida: 2 } })).toBe(100 + 2 * 50);
  });
  it('nível soma a base por nível', () => {
    const atLv10 = { xpTotal: xpForLevel(10), upgrades: { dano: 0, vida: 0 } };
    expect(playerDano(atLv10)).toBe(10 + 9 * 2); // 9 níveis acima do 1
  });
  it('dps = dano × aps', () => {
    expect(dps(base)).toBe(playerDano(base) * playerAPS(base));
  });
});
```

- [ ] **Step 2: Rodar — falha** → `npx vitest run src/game/player.test.js` → FAIL.

- [ ] **Step 3: Implementação** (adicionar a `player.js`)

```javascript
export function playerDano(state) {
  const lvl = levelFromXp(state.xpTotal);
  return PLAYER.baseDano + (lvl - 1) * PLAYER.danoPerLevel
       + state.upgrades.dano * UPGRADES.dano.perLevel;
}

export function playerHpMax(state) {
  const lvl = levelFromXp(state.xpTotal);
  return PLAYER.baseHp + (lvl - 1) * PLAYER.hpPerLevel
       + state.upgrades.vida * UPGRADES.vida.perLevel;
}

export function playerAPS() {
  return PLAYER.baseAPS; // constante no v0
}

export function dps(state) {
  return playerDano(state) * playerAPS(state);
}
```

- [ ] **Step 4: Rodar — verde** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/player.js src/game/player.test.js
git commit -m "feat(v0): stats derivados (dano/hp/aps/dps)"
```

### Task 7: Inimigo com HP relativo (enemy.js)

**Files:**
- Create: `src/game/enemy.js`
- Test: `src/game/enemy.test.js`

- [ ] **Step 1: Teste vermelho**

```javascript
// src/game/enemy.test.js
import { describe, it, expect } from 'vitest';
import { spawnEnemy } from './enemy.js';
import { playerHpMax, xpForLevel } from './player.js';

const mk = (over = {}) => ({ xpTotal: 0, upgrades: { dano: 0, vida: 0 }, area: 1, ...over });

describe('spawnEnemy (HP relativo)', () => {
  it('HP do mob comum = HP do player × 1.3 × ×área(1.0)', () => {
    const s = mk();
    const e = spawnEnemy(s);
    expect(e.hpMax).toBeCloseTo(playerHpMax(s) * 1.3, 5);
    expect(e.hp).toBe(e.hpMax);
  });
  it('comprar HP aumenta o HP do mob junto', () => {
    const fraco = spawnEnemy(mk());
    const forte = spawnEnemy(mk({ upgrades: { dano: 0, vida: 5 } }));
    expect(forte.hpMax).toBeGreaterThan(fraco.hpMax);
  });
  it('nível do mob acompanha o player, capado no cap da área (60)', () => {
    const e = spawnEnemy(mk({ xpTotal: xpForLevel(80) }));
    expect(e.level).toBe(60);
  });
  it('dano do mob cresce com o nível', () => {
    const lvl1 = spawnEnemy(mk());
    const lvl30 = spawnEnemy(mk({ xpTotal: xpForLevel(30) }));
    expect(lvl30.dmg).toBeGreaterThan(lvl1.dmg);
  });
});
```

- [ ] **Step 2: Rodar — falha.**

- [ ] **Step 3: Implementação**

```javascript
// src/game/enemy.js
import { ENEMY, AREAS } from '../data/constants.js';
import { playerHpMax, levelFromXp } from './player.js';

export function spawnEnemy(state, rarity = 'common') {
  const area = AREAS[state.area - 1];
  const hpMult = rarity === 'rare' ? ENEMY.hpMultRare : ENEMY.hpMultCommon;
  const hpMax = playerHpMax(state) * hpMult * area.hpMult;
  const level = Math.min(levelFromXp(state.xpTotal), area.lvlCap);
  return {
    hpMax, hp: hpMax,
    dmg: ENEMY.dmgBase + level * ENEMY.dmgPerLevel,
    level, rarity,
    name: area.enemyName,
    art: area.enemyArt,
  };
}
```

- [ ] **Step 4: Rodar — verde** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/enemy.js src/game/enemy.test.js
git commit -m "feat(v0): inimigo com HP relativo (mob = HP player x raridade x area)"
```

### Task 8: Economia — gold/xp e upgrades (economy.js)

**Files:**
- Create: `src/game/economy.js`
- Test: `src/game/economy.test.js`

- [ ] **Step 1: Teste vermelho**

```javascript
// src/game/economy.test.js
import { describe, it, expect } from 'vitest';
import { goldForKill, xpForKill, upgradeCost, buyUpgrade } from './economy.js';

describe('recompensas por kill', () => {
  it('gold e xp são proporcionais ao HP máx do mob', () => {
    const mob = { hpMax: 1000 };
    expect(goldForKill(mob)).toBe(500); // 1000 × 0.5
    expect(xpForKill(mob)).toBe(400);   // 1000 × 0.4
  });
});

describe('upgrades', () => {
  it('custo cresce geometricamente com o nº já comprado', () => {
    expect(upgradeCost('dano', 0)).toBe(10);                 // costBase
    expect(upgradeCost('dano', 1)).toBe(Math.round(10 * 1.15));
    expect(upgradeCost('dano', 5)).toBeGreaterThan(upgradeCost('dano', 4));
  });
  it('buyUpgrade desconta gold e incrementa quando dá', () => {
    const s = { gold: 100, upgrades: { dano: 0, vida: 0 } };
    expect(buyUpgrade(s, 'dano')).toBe(true);
    expect(s.upgrades.dano).toBe(1);
    expect(s.gold).toBe(90);
  });
  it('buyUpgrade falha sem gold suficiente (sem efeito)', () => {
    const s = { gold: 5, upgrades: { dano: 0, vida: 0 } };
    expect(buyUpgrade(s, 'dano')).toBe(false);
    expect(s.upgrades.dano).toBe(0);
    expect(s.gold).toBe(5);
  });
});
```

- [ ] **Step 2: Rodar — falha.**

- [ ] **Step 3: Implementação**

```javascript
// src/game/economy.js
import { ECONOMY, UPGRADES } from '../data/constants.js';

export function goldForKill(enemy) { return enemy.hpMax * ECONOMY.goldPerKillRatio; }
export function xpForKill(enemy)   { return enemy.hpMax * ECONOMY.xpPerKillRatio; }

export function upgradeCost(kind, owned) {
  const u = UPGRADES[kind];
  return Math.round(u.costBase * u.costGrowth ** owned);
}

// Compra 1 nível do upgrade `kind` ('dano'|'vida'). Retorna true se efetuou.
export function buyUpgrade(state, kind) {
  const cost = upgradeCost(kind, state.upgrades[kind]);
  if (state.gold < cost) return false;
  state.gold -= cost;
  state.upgrades[kind] += 1;
  return true;
}
```

- [ ] **Step 4: Rodar — verde** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/economy.js src/game/economy.test.js
git commit -m "feat(v0): economia (gold/xp por kill + upgrades com custo escalado)"
```

---

## Fase 2 — Orquestração do combate (TDD)

### Task 9: combatTick — matar, premiar, próximo mob

**Files:**
- Create: `src/game/combat.js`
- Test: `src/game/combat.test.js`

- [ ] **Step 1: Teste vermelho**

```javascript
// src/game/combat.test.js
import { describe, it, expect } from 'vitest';
import { createInitialState } from '../core/state.js';
import { combatTick } from './combat.js';
import { playerHpMax } from './player.js';

function fresh() {
  const s = createInitialState();
  s.player.hp = playerHpMax(s);
  return s;
}

describe('combatTick — loop básico', () => {
  it('spawna um mob no primeiro tick', () => {
    const s = fresh();
    combatTick(s, 0.1);
    expect(s.enemy).not.toBeNull();
  });
  it('matar o mob dá gold e xp e limpa o inimigo', () => {
    const s = fresh();
    s.upgrades.dano = 1000;           // muito dano: mata num golpe
    combatTick(s, 1);                 // 1s: pelo menos 1 ataque
    expect(s.gold).toBeGreaterThan(0);
    expect(s.xpTotal).toBeGreaterThan(0);
    expect(s.killsTotal).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Rodar — falha.**

- [ ] **Step 3: Implementação mínima**

```javascript
// src/game/combat.js
import { PLAYER, AREAS } from '../data/constants.js';
import { playerDano, playerAPS, playerHpMax, levelFromXp } from './player.js';
import { spawnEnemy } from './enemy.js';
import { goldForKill, xpForKill } from './economy.js';

export function combatTick(state, dt) {
  const hpMax = playerHpMax(state);

  // Respawn sem punição
  if (state.player.dead) {
    state.player.respawnTimer -= dt;
    if (state.player.respawnTimer <= 0) {
      state.player.dead = false;
      state.player.hp = hpMax;
    }
    return;
  }

  if (!state.enemy) state.enemy = spawnEnemy(state);
  const e = state.enemy;

  // Ataques do player na cadência do APS
  state.player.attackTimer += dt;
  const interval = 1 / playerAPS(state);
  while (state.player.attackTimer >= interval && e.hp > 0) {
    state.player.attackTimer -= interval;
    const dmg = playerDano(state);
    e.hp -= dmg;
    state.fx.push({ kind: 'hit', amount: dmg });
    if (e.hp <= 0) { onKill(state, e); break; }
  }

  // Regen contínuo
  state.player.hp = Math.min(hpMax, state.player.hp + hpMax * PLAYER.regenPerSec * dt);

  // Dano do mob (se vivo)
  if (state.enemy && state.enemy.hp > 0) {
    state.player.hp -= state.enemy.dmg * dt;
    if (state.player.hp <= 0) {
      state.player.hp = 0;
      state.player.dead = true;
      state.player.respawnTimer = PLAYER.respawnSeconds;
    }
  }
}

function onKill(state, e) {
  state.gold += goldForKill(e);
  state.xpTotal += xpForKill(e);
  state.killsTotal += 1;
  state.fx.push({ kind: 'gold', amount: goldForKill(e) });
  state.player.hp = Math.min(playerHpMax(state),
    state.player.hp + playerHpMax(state) * PLAYER.regenOnKill);
  state.enemy = null; // próximo spawna no próximo tick

  // Gate por nível: bater o cap destrava a próxima área (v0 = marca "Área 1 limpa")
  const area = AREAS[state.area - 1];
  if (levelFromXp(state.xpTotal) >= area.lvlCap && state.unlockedArea < state.area + 1) {
    state.unlockedArea = state.area + 1;
  }
}
```

- [ ] **Step 4: Rodar — verde** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/combat.js src/game/combat.test.js
git commit -m "feat(v0): combatTick (ataque por APS, kill, premio, proximo mob)"
```

### Task 10: combatTick — morte/respawn e gate de área

**Files:**
- Modify: `src/game/combat.test.js`

- [ ] **Step 1: Teste vermelho** (adicionar)

```javascript
import { ENEMY } from '../data/constants.js';

describe('combatTick — sobrevivência e gate', () => {
  it('HP zera → morre e agenda respawn, depois volta cheio', () => {
    const s = fresh();
    s.player.hp = 1;
    s.enemy = { hpMax: 1e9, hp: 1e9, dmg: 1e6, level: 1, rarity: 'common', name: 'x', art: 'x' };
    combatTick(s, 0.1);                 // toma dano fatal
    expect(s.player.dead).toBe(true);
    combatTick(s, 5);                   // passa o respawnTimer
    expect(s.player.dead).toBe(false);
    expect(s.player.hp).toBe(playerHpMax(s));
  });
  it('alcançar o cap da área destrava a próxima', () => {
    const s = fresh();
    s.xpTotal = 1e12;                   // bem acima do cap (lv 60)
    s.upgrades.dano = 1e6;
    combatTick(s, 1);                   // mata e roda o gate
    expect(s.unlockedArea).toBe(2);
  });
});
```

- [ ] **Step 2: Rodar — deve PASSAR** (a lógica já existe na Task 9). Se falhar, corrija
`combat.js` — não os testes.

Run: `npx vitest run src/game/combat.test.js`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/game/combat.test.js
git commit -m "test(v0): cobre morte/respawn e gate de area no combatTick"
```

### Task 11: Suíte completa verde

- [ ] **Step 1: Rodar tudo**

Run: `npm test`
Expected: PASS em todos os arquivos (player, enemy, economy, combat).

- [ ] **Step 2: Commit (se houve ajuste)** — senão, pule.

---

## Fase 3 — UI (pele Éclats) + verificação no preview

> A UI reusa o vocabulário REAL de `combat.css` (escopado sob `.view.combat`): Seeker e mob são
> **sprites de corpo inteiro sem card** (`.cb-seeker.sfig` / `.cb-enemy.emob`). O objetivo é
> replicar o visual: **Seeker à esquerda, 1 mob ao centro, floaties de dano** + um **painel de
> upgrades** (CSS novo). Verificação por `preview_*` (não pedir ao Willian pra testar à mão).

### Task 12: Casca (shell.js) — nav, coins, fit

**Files:**
- Create: `src/ui/shell.js`

- [ ] **Step 1: Implementar a casca enxuta**

Baseie-se no antigo `ui.js` (git: `git show HEAD~N:src/ui/ui.js`), mas **só com o necessário
do v0**: importar os CSS reusados, montar `.nav` (1 botão: Combate), `.coins` (1 pill: gold),
o `#stage-backdrop` com o bg da Área 1, e a função `fit()` (copiar verbatim do ui.js antigo).
Exportar `setupUI(state, handlers)` e `renderUI(state)`.

```javascript
// src/ui/shell.js
import './tokens.css';
import './shell.css';
import './combat.css';
import './player.css';
import { formatNumber } from '../core/format.js';
import { bg } from '../data/assets.js';
import { AREAS } from '../data/constants.js';
import { buildCombatView, renderCombat } from './combat-view.js';

const $ = (sel, root = document) => root.querySelector(sel);

export function setupUI(state) {
  // Coins: só Lumens (gold) no v0
  $('.coins').innerHTML =
    `<div class="chud"><div class="chud-pill chud-lumens" title="Lumens">` +
    `<span class="chud-v" id="coin-gold">0</span></div></div>`;
  // Nav: só Combate (v0 é uma tela)
  $('.nav').innerHTML = `<button class="navbtn active" title="Combate"><span class="ico">⚔</span></button>`;
  // Backdrop da Área 1
  $('#stage-backdrop').style.backgroundImage = bg(AREAS[state.area - 1].bg);
  // Monta a cena de combate
  const view = document.createElement('div');
  view.id = 'view-combat';
  view.className = 'view combat active'; // 'combat' ativa o CSS de combat.css (.view.combat)
  $('.stage-main').appendChild(view);
  buildCombatView(view, state);
  fit();
  window.addEventListener('resize', fit);
}

export function renderUI(state) {
  const g = document.getElementById('coin-gold');
  if (g) g.textContent = formatNumber(state.gold);
  renderCombat(state);
}

function fit() {
  // COPIAR verbatim a função fit() do antigo src/ui/ui.js (escala do palco 1920×1080).
}
```

- [ ] **Step 2: Recuperar e colar o `fit()` antigo**

Run: `git log --oneline -- src/ui/ui.js | head -1` → pegue o hash; depois
`git show <hash>:src/ui/ui.js` e copie o corpo da função `fit()` para `shell.js`.

- [ ] **Step 3: Commit**

```bash
git add src/ui/shell.js
git commit -m "feat(v0): casca da UI (nav/coins/backdrop/fit) reusando a pele"
```

### Task 13: Cena de combate + upgrades (combat-view.js)

**Files:**
- Create: `src/ui/combat-view.js`

- [ ] **Step 1: Implementar build + render**

Replicar o visual do antigo `src/ui/combat.js` (consultar via `git show <hash>:src/ui/combat.js`).
A pele do combate (`combat.css`) é toda escopada sob **`.view.combat`** e usa o vocabulário de
classes abaixo — **REUSE essas classes** pra herdar a pele de graça (o Seeker e o mob são
sprites de corpo inteiro **sem card**):
- **Seeker:** `.cb-seeker.sfig` › `.sfig-art` (o `<img>` é estilizado por `.sfig-art img`) ·
  `.sfig-info` › `.scard-hpbar` (`i` = preenchimento vermelho, `span` = texto) + `.scard-lvbar`
  (`i` azul, `span`) · status opcional `.cb-status`.
- **Inimigo (1 só):** `.cb-enemy.emob.big` dentro de `.cb-arena` › `.emob-label`
  (`.ecard-name` + `.ecard-lvl`) · `.emob-art` · `.emob-info` › `.ecard-bar` › `i.ecard-fill`
  (HP) · floats em `.ecard-floats` (cada dano = `.ecard-dmg`, crit = `.ecard-dmg.crit`).
- **Fundo nítido:** `.cb-backdrop` (a tela de combate NÃO usa o blur do menu) · **FX:** `.cb-fx`.

```javascript
// src/ui/combat-view.js
import { picture, bg } from '../data/assets.js';
import { formatNumber } from '../core/format.js';
import { UPGRADES, AREAS } from '../data/constants.js';
import { playerDano, playerHpMax, playerAPS, levelFromXp, xpForLevel, xpToNext } from '../game/player.js';
import { upgradeCost, buyUpgrade } from '../game/economy.js';

// ⚠️ Confirme em assets.js o id do sprite do Seeker (o antigo combat.js usa seeker.card_t1..t5).
const SEEKER_ART = 'seeker.card_t1';

let els = {};
let mobArt = null;

export function buildCombatView(root, state) {
  const area = AREAS[state.area - 1];
  root.innerHTML = `
    <div class="cb-backdrop" id="cb-backdrop"></div>
    <div class="cb-seeker sfig" id="seeker">
      <div class="sfig-art">${picture(SEEKER_ART, { alt: 'Seeker' })}</div>
      <div class="sfig-info">
        <div class="scard-hpbar"><i id="seeker-hp-fill"></i><span id="seeker-hp-text"></span></div>
        <div class="scard-lvbar"><i id="seeker-xp-fill"></i><span id="seeker-lvl-text"></span></div>
      </div>
      <div class="cb-status" id="seeker-stats"></div>
    </div>
    <div class="cb-arena" id="cb-arena"></div>
    <div class="cb-fx" id="cb-fx"></div>
    <div class="upgrade-panel" id="upgrade-panel"></div>
  `;
  document.getElementById('cb-backdrop').style.backgroundImage = bg(area.bg);

  els = {
    hpFill: root.querySelector('#seeker-hp-fill'),
    hpText: root.querySelector('#seeker-hp-text'),
    xpFill: root.querySelector('#seeker-xp-fill'),
    lvlText: root.querySelector('#seeker-lvl-text'),
    stats: root.querySelector('#seeker-stats'),
    arena: root.querySelector('#cb-arena'),
    fx: root.querySelector('#cb-fx'),
    panel: root.querySelector('#upgrade-panel'),
  };

  // Botões de upgrade (delegação)
  els.panel.innerHTML = ['dano', 'vida'].map((k) =>
    `<button class="upg-btn" data-kind="${k}"><b>${UPGRADES[k].label}</b>` +
    `<span class="upg-cost" id="upg-cost-${k}"></span></button>`
  ).join('');
  els.panel.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.upg-btn');
    if (btn) buyUpgrade(state, btn.dataset.kind);
  });
  mobArt = null;
}

export function renderCombat(state) {
  const hpMax = playerHpMax(state);
  const lvl = levelFromXp(state.xpTotal);

  // Seeker HP / nível / stats
  els.hpFill.style.width = `${Math.max(0, (state.player.hp / hpMax) * 100)}%`;
  els.hpText.textContent = `${formatNumber(Math.max(0, state.player.hp))}/${formatNumber(hpMax)}`;
  const into = state.xpTotal - xpForLevel(lvl);
  els.xpFill.style.width = `${(into / xpToNext(lvl)) * 100}%`;
  els.lvlText.textContent = `LV ${lvl}`;
  els.stats.textContent = `DANO ${formatNumber(playerDano(state))} · ${playerAPS(state).toFixed(2)} APS`;

  // Mob (1 só; centro-direita da arena)
  const e = state.enemy;
  if (e) {
    if (mobArt !== e.art) {
      els.arena.innerHTML =
        `<div class="cb-enemy emob big" id="mob" style="left:62%;top:46%">` +
          `<div class="emob-label"><div class="ecard-name">${e.name}</div>` +
            `<div class="ecard-lvl">LV ${e.level}</div></div>` +
          `<div class="emob-art">${picture(e.art, { alt: e.name })}</div>` +
          `<div class="emob-info"><div class="ecard-bar"><i class="ecard-fill" id="mob-hp-fill"></i></div></div>` +
          `<div class="ecard-floats" id="mob-floats"></div>` +
        `</div>`;
      mobArt = e.art;
    }
    const fill = els.arena.querySelector('#mob-hp-fill');
    if (fill) fill.style.width = `${Math.max(0, (e.hp / e.hpMax) * 100)}%`;
  } else if (mobArt !== null) {
    els.arena.innerHTML = ''; mobArt = null;
  }

  // Floaties: dano sobre o mob (.ecard-dmg), gold no FX layer
  const floats = document.getElementById('mob-floats');
  while (state.fx.length) {
    const f = state.fx.shift();
    const span = document.createElement('span');
    if (f.kind === 'hit' && floats) {
      span.className = 'ecard-dmg';
      span.textContent = '-' + formatNumber(f.amount);
      floats.appendChild(span);
    } else {
      span.className = 'floaty-gold';
      span.textContent = '+' + formatNumber(f.amount);
      els.fx.appendChild(span);
    }
    setTimeout(() => span.remove(), 800);
  }

  // Custos dos upgrades
  for (const k of ['dano', 'vida']) {
    const c = document.getElementById(`upg-cost-${k}`);
    if (!c) continue;
    const cost = upgradeCost(k, state.upgrades[k]);
    c.textContent = formatNumber(cost);
    const btn = c.closest('.upg-btn');
    if (btn) btn.classList.toggle('affordable', state.gold >= cost);
  }
}
```

- [ ] **Step 2: Adicionar SÓ o CSS novo (o resto vem da pele)**

As classes do Seeker/mob/fundo já existem em `combat.css` (sob `.view.combat`) e são herdadas.
O **único CSS novo** é o painel de upgrades + um fallback de sizing do sprite do mob (porque o
`picture()` pode não pôr a classe `.emob-art-img` no `<img>`). Adicione ao fim de
`src/ui/combat.css` (usa os tokens existentes `--border`/`--panel`/`--eclat`/`--gold`/`--ink`):

```css
/* ---- v0: painel de upgrades (CSS novo) ---- */
.view.combat .upgrade-panel {
  position: absolute; z-index: 8; right: 36px; top: 150px;
  display: flex; flex-direction: column; gap: 10px; width: 260px;
}
.view.combat .upg-btn {
  display: flex; justify-content: space-between; align-items: center; gap: 10px;
  padding: 12px 16px; border: var(--border); border-radius: 12px;
  background: var(--panel); color: var(--ink); cursor: pointer; font: inherit;
  opacity: .5; transition: border-color .15s ease, background .15s ease, opacity .15s ease;
}
.view.combat .upg-btn.affordable { opacity: 1; border-color: var(--eclat); }
.view.combat .upg-btn:hover.affordable { background: var(--panel-2); }
.view.combat .upg-cost { color: var(--gold); font-weight: 700; font-variant-numeric: tabular-nums; }
/* fallback: garante o sizing do sprite do mob mesmo sem a classe .emob-art-img */
.view.combat .emob-art img { width: 100%; height: auto; display: block; object-fit: contain; }
/* floaty de gold simples (o de dano usa .ecard-dmg, que já existe) */
.view.combat .floaty-gold {
  position: absolute; left: 50%; bottom: 120px; color: var(--gold);
  font-weight: 800; font-size: 20px; text-shadow: 0 1px 4px #000;
  animation: ecard-float .8s ease-out forwards;
}
```
> Se algum token (`--panel-2`, `--eclat`) não existir em `tokens.css`, troque por um existente
> ou um valor literal — o loop de preview (Task 15) revela qualquer classe sem estilo.

- [ ] **Step 3: Commit**

```bash
git add src/ui/combat-view.js src/ui/combat.css
git commit -m "feat(v0): cena de combate (card/mob/floaties) + painel de upgrades"
```

### Task 14: Bootstrap (main.js)

**Files:**
- Create: `src/main.js`

- [ ] **Step 1: Implementar**

```javascript
// Bootstrap do Éclats v0 — liga núcleo, combate e UI.
import '../style.css';
import { state } from './core/state.js';
import { load, setupAutosave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { combatTick } from './game/combat.js';
import { playerHpMax } from './game/player.js';
import { setupUI, renderUI } from './ui/shell.js';

load();                          // aplica save (se houver e schema bater)
state.player.hp = playerHpMax(state);
setupUI(state);
setupAutosave();

startLoop((dt) => {
  combatTick(state, dt);
  renderUI(state);
});
renderUI(state);

// Reset rápido p/ teste (apaga o save) — exposto no console
import { resetSave } from './core/save.js';
window.eclatsReset = resetSave;
```

- [ ] **Step 2: Commit**

```bash
git add src/main.js
git commit -m "feat(v0): bootstrap (load -> init -> loop -> autosave)"
```

### Task 15: Verificação no preview

- [ ] **Step 1: Subir o dev server** — `preview_start` (Vite, `npm run dev`).
- [ ] **Step 2: Checar console** — `preview_console_logs`: sem erros de import/asset.
- [ ] **Step 3: Snapshot** — `preview_snapshot`: existe o card do Seeker, 1 mob, e 2 botões de upgrade.
- [ ] **Step 4: Ver o loop girar** — esperar alguns segundos, `preview_snapshot` de novo: gold subiu, HP do mob oscila, floaties aparecem.
- [ ] **Step 5: Comprar upgrade** — `preview_click` no botão "Forjar Dano"; `preview_snapshot`: gold caiu, custo subiu, kills mais rápidas.
- [ ] **Step 6: Screenshot de prova** — `preview_screenshot` pra registrar a cena funcionando.
- [ ] **Step 7: Corrigir o que aparecer** (CSS/wiring), repetindo 2-6. Não avance com erro no console.

---

## Fase 4 — Balanceamento por simulador

### Task 16: Simulador da subida (tools/sim/v0.mjs)

**Files:**
- Create: `tools/sim/v0.mjs`

- [ ] **Step 1: Escrever o simulador**

Importa as fórmulas REAIS (`constants`, `player`, `enemy`, `economy`, `combat`) e simula a
subida lv1→60 com uma política simples de compra (regra de bolso: se o tempo-de-kill passar de
um alvo, investe em Dano; senão, mantém uma folga de HP). Mede: tempo até lv 60, gold/min,
tempo-de-kill por faixa de nível, e nº de mortes.

```javascript
// tools/sim/v0.mjs — simulador da subida v0 (lv1→60). Roda: node tools/sim/v0.mjs
import { createInitialState } from '../../src/core/state.js';
import { combatTick } from '../../src/game/combat.js';
import { playerHpMax, playerDano, playerAPS, levelFromXp } from '../../src/game/player.js';
import { upgradeCost, buyUpgrade } from '../../src/game/economy.js';
import { AREAS } from '../../src/data/constants.js';

const DT = 0.1;
const s = createInitialState();
s.player.hp = playerHpMax(s);

let t = 0, deaths = 0, lastDead = false;
const cap = AREAS[0].lvlCap;
const samples = [];
let nextSample = 10;

while (levelFromXp(s.xpTotal) < cap && t < 60 * 60 * 24) { // teto 24h de sim
  combatTick(s, DT);
  t += DT;
  if (s.player.dead && !lastDead) deaths++;
  lastDead = s.player.dead;

  // Política de compra: prioriza Dano; compra Vida se o tempo-de-kill estiver baixo demais.
  const ttk = (playerHpMax(s) * 1.3) / (playerDano(s) * playerAPS(s));
  const wantVida = ttk < 1.5; // se mata rápido demais, pode encorpar
  for (let i = 0; i < 50; i++) {
    const kind = wantVida ? 'vida' : 'dano';
    if (s.gold >= upgradeCost(kind, s.upgrades[kind])) buyUpgrade(s, kind); else break;
  }

  const lvl = levelFromXp(s.xpTotal);
  if (lvl >= nextSample) {
    samples.push({ lvl, min: (t / 60).toFixed(1), gold: Math.round(s.gold), ttk: ttk.toFixed(2) });
    nextSample += 10;
  }
}

console.log(`lv 60 em ${(t / 60).toFixed(1)} min · ${deaths} mortes · ${s.killsTotal} kills`);
console.table(samples);
```

- [ ] **Step 2: Rodar**

Run: `node tools/sim/v0.mjs`
Expected: imprime o tempo até lv 60, mortes, e uma tabela (nível → minutos, gold, tempo-de-kill).

- [ ] **Step 3: Commit**

```bash
git add tools/sim/v0.mjs
git commit -m "feat(v0): simulador da subida lv1->60"
```

### Task 17: Tunar as sementes (com o Willian)

**Files:**
- Modify: `src/data/constants.js`

- [ ] **Step 1: Definir o alvo de pacing do v0 com o Willian**

Pergunte: quanto tempo a subida lv1→60 deve levar (ex.: ~1-2h de jogo ativo) e o "feel" do
tempo-de-kill (ex.: 2-4 s/mob). **Não chute sozinho — é decisão de design dele.**

- [ ] **Step 2: Ajustar e re-rodar**

Mexa em `LEVEL.base/growth`, `ECONOMY.*Ratio`, `UPGRADES.*.costGrowth`, `ENEMY.dmg*` e re-rode
`node tools/sim/v0.mjs` até bater o alvo. Mantenha o tempo-de-kill numa faixa estável (a razão
Dano÷HP não deve explodir nem travar).

- [ ] **Step 3: Confirmar testes ainda verdes** — `npm test` (alguns asserts usam números-semente; se você mudar um valor citado num teste, atualize o teste junto).

- [ ] **Step 4: Commit**

```bash
git add src/data/constants.js src/game/*.test.js
git commit -m "balance(v0): tuna sementes p/ o alvo de pacing da Area 1"
```

---

## Fase 5 — Fechamento

### Task 18: Playtest manual + ESTADO do jogo

**Files:**
- Modify/Create: `docs/ESTADO_DO_JOGO.md` (registrar o estado do v0)

- [ ] **Step 1: Playtest no preview** — jogar a subida por alguns minutos: comprar Dano/Vida, ver o gold/kills/nível subir, confirmar que bater lv 60 marca "Área 1 limpa" (logue `state.unlockedArea === 2`). Sem erros no console.
- [ ] **Step 2: Atualizar `docs/ESTADO_DO_JOGO.md`** com o que o v0 entrega, os números-semente atuais e o que falta (v1: Convergence).
- [ ] **Step 3: Commit**

```bash
git add docs/ESTADO_DO_JOGO.md
git commit -m "docs(v0): registra o estado da primeira subida (Area 1)"
```

---

## Notas de execução
- **Branch:** `main` (convenção do projeto — CLAUDE.md). Commits pequenos por task; o modelo
  antigo fica recuperável pelo histórico.
- **Ordem:** Fases 0→5 em sequência. Dentro de cada task, os steps são atômicos (2-5 min).
- **TDD:** Fases 1-2 são teste-primeiro. UI (Fase 3) é verificada por `preview_*`. Balance
  (Fase 4) é verificada pelo simulador.
- **Pele:** nunca editar `public/**` nem os 4 CSS reusados além de pequenos blocos de layout
  para os elementos novos (painel de upgrades, floaties).
- **Fora do escopo (NÃO implementar):** Convergence, Awaken, Gear, cleave, Ascension, Hollow,
  áreas 2+, mobs raros/champion, passivas, mémoires, offline, daily quests. Entram em v1+.
