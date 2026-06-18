# Éclats of Lumière — Código completo

> Dump de todo o código-fonte do projeto (gerado automaticamente a partir dos arquivos
> reais). Organizado por diretório. Para a explicação da lógica, ver
> `docs/eclats_logica_e_sims.md`.

## Índice
1. Raiz do projeto (4)
2. Núcleo — src/core (5)
3. Dados — src/data (2)
4. Lógica de jogo — src/game (12)
5. Interface — src/ui (JS) (13)
6. Interface — src/ui (CSS) (15)
7. Entrada — src/main.js (1)
8. Simuladores — tools/sim (34)

---

## Raiz do projeto

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Éclats of Lumière</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div id="screen">
    <div id="stage">
      <div id="stage-backdrop"></div>
      <main class="stage-main"><!-- views (JS) --></main>
      <header class="topbar">
        <nav class="nav"><!-- navbtns (JS) --></nav>
        <div class="coins"><!-- moedas (JS) --></div>
      </header>
    </div>
  </div>
  <div id="toosmall">Tela muito pequena —<br>aumente a janela para jogar.</div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### `style.css`

```css
/* Estilos da UI Éclats moram em src/ui/ (tokens.css + shell.css + telas),
   importados como módulos pelo Vite via src/ui/ui.js. Este arquivo é só o
   ponto de entrada histórico que src/main.js importa — mantido mínimo. */
```

### `vite.config.js`

```javascript
import { defineConfig } from 'vite';

// base relativo: o build funciona tanto na raiz de um domínio (Cloudflare Pages
// futuramente) quanto em subcaminho (GitHub Pages em /Game-Teste/)
export default defineConfig({
  base: './',
});
```

### `package.json`

```json
{
  "name": "eclats-of-lumiere",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^8.0.16"
  },
  "dependencies": {
    "break_infinity.js": "^2.2.0"
  }
}
```

## Núcleo — src/core

### `src/core/dev.js`

```javascript
// Modo de TESTE/QA — abre o jogo com tudo desbloqueado e recursos fartos, para
// o Willian caçar inconsistências sem grind. Ativa por ?dev na URL OU clicando
// no botão "DEV 🔓" (canto inferior esquerdo). NÃO afeta o jogo normal até ser
// ativado. Isolado aqui; remover no release.

import { MAPS } from '../data/constants.js';

// Nº de sub-áreas do mapa atual (CP-2: 8) — p/ desbloquear o mapa todo sem cravar.
const fullSubs = (state) => (MAPS[(state.map || 1) - 1] || MAPS[0]).subareaCount;

// Aplica os desbloqueios no state (top-up: nunca diminui o que já houver)
export function applyDevUnlock(state) {
  state.lumens   = Math.max(state.lumens, 1e12);   // Gold Stats + Gear à vontade
  state.vestiges = Math.max(state.vestiges, 1e9);  // Passivas à vontade
  state.eclats   = Math.max(state.eclats, 1e9);    // Mémoires à vontade
  state.xpTotal  = Math.max(state.xpTotal, 1e7);   // nível do Seeker decente

  state.convergences = Math.max(state.convergences, 1); // libera as Passivas
  state.convPoints   = Math.max(state.convPoints, 20);  // conv_factor folgado
  state.unlockedSubarea = fullSubs(state);             // mapa todo navegável
  state.maxMap = 5;                                     // os 5 mapas viajáveis
  // boss final batido → A1 fica disponível pra testar a Ascension (não força
  // ascensions: assim dá pra clicar Ascender e ver o fluxo). Mémoires abrem
  // por era conforme você ascende.
  state.bossDefeated = new Array(fullSubs(state)).fill(true);
  state.bestSubareaRun = Math.max(state.bestSubareaRun, fullSubs(state));

  state.stats.vit = Math.max(state.stats.vit, 40);
  state.stats.str = Math.max(state.stats.str, 30);

  state.nitzotzot = Math.max(state.nitzotzot || 0, 9999); // Oferenda do Despertar à vontade
  return true;
}

// Ativa via URL (?dev ou ?unlock) — chamado no boot, antes da UI
export function maybeApplyDevUnlock(state) {
  const q = new URLSearchParams(window.location.search);
  if (!q.has('dev') && !q.has('unlock')) return false;
  return applyDevUnlock(state);
}

// Selo visual indicando que o modo de teste está ativo
export function showDevBadge() {
  const bar = document.querySelector('.topbar');
  if (!bar || document.getElementById('dev-badge')) return;
  const b = document.createElement('div');
  b.id = 'dev-badge';
  b.textContent = 'DEV';
  b.title = 'Modo de teste ativo — tudo desbloqueado';
  b.style.cssText = 'position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:30;'
    + 'background:#d9a441;color:#1a1206;font:700 12px/1 Inter,sans-serif;letter-spacing:.18em;'
    + 'padding:6px 12px;border-radius:999px;box-shadow:0 0 18px -4px #d9a441;';
  bar.appendChild(b);
}

// ─── Painel DEV flutuante: dar recursos/materiais "infinitos" a qualquer hora ───
const HUGE = 1e30; // "infinito" prático (cabe no teto 1e100 e formata curto)

function devGrant(state, kind) {
  switch (kind) {
    case 'lumens': state.lumens = HUGE; break;
    case 'vestiges': state.vestiges = HUGE; break;
    case 'eclats': state.eclats = HUGE; break;
    case 'nitzotzot': state.nitzotzot = 1e9; break;
    case 'materials': state.materiais = [1e9, 1e9, 1e9, 1e9]; break;
    case 'xp': state.xpTotal += 1e15; break;
    case 'maps':
      state.maxMap = 5; state.unlockedSubarea = fullSubs(state);
      state.bossDefeated = new Array(fullSubs(state)).fill(true);
      state.convergences = Math.max(state.convergences, 1);
      state.ascensions = Math.max(state.ascensions, 5); // abre Mémoires (eras) + ranks
      break;
    case 'all':
      ['lumens', 'vestiges', 'eclats', 'nitzotzot', 'materials', 'xp', 'maps'].forEach((k) => devGrant(state, k));
      break;
    default: break;
  }
}

const DEV_ITEMS = [
  ['★ MAX TUDO', 'all'],
  ['Lumens ∞', 'lumens'],
  ['Vestiges ∞', 'vestiges'],
  ['Éclats ∞', 'eclats'],
  ['Nitzotzot ∞', 'nitzotzot'],
  ['Materiais ∞', 'materials'],
  ['XP +1Qa', 'xp'],
  ['Mapas/Subs', 'maps'],
];

export function setupDevPanel(state, onChange) {
  if (document.getElementById('dev-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'dev-panel';
  panel.style.cssText = 'position:fixed;left:12px;bottom:56px;z-index:300;display:flex;flex-direction:column;gap:5px;'
    + 'background:rgba(14,20,36,.92);border:1px solid #d9a441;border-radius:12px;padding:10px;'
    + 'width:160px;backdrop-filter:blur(5px);box-shadow:0 8px 26px -8px #000;';
  panel.innerHTML = '<div style="font:700 11px/1 Inter,sans-serif;letter-spacing:.2em;color:#d9a441;'
    + 'text-transform:uppercase;padding:2px 2px 6px;border-bottom:1px solid rgba(217,164,65,.25);margin-bottom:2px">Dev · recursos</div>'
    + DEV_ITEMS.map(([label, k]) =>
      `<button type="button" data-k="${k}" style="cursor:pointer;text-align:left;`
      + 'border:1px solid rgba(217,164,65,.4);border-radius:8px;background:rgba(20,26,37,.7);'
      + `color:#f0d9a0;font:600 12px/1 Inter,sans-serif;padding:8px 10px">${label}</button>`).join('');
  panel.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => { devGrant(state, b.dataset.k); if (onChange) onChange(); }));
  document.body.appendChild(panel);
}

// Botão RESET — apaga o save e recomeça do zero (com confirmação). Fica ao lado
// do botão DEV. Útil pra QA: testar o jogo desde o início.
export function setupResetButton(resetFn) {
  if (document.getElementById('reset-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'reset-btn';
  btn.type = 'button';
  btn.textContent = 'RESET ⟳';
  btn.title = 'Apagar o save e recomeçar do zero';
  btn.style.cssText = 'position:fixed;left:108px;bottom:12px;z-index:300;cursor:pointer;'
    + 'background:rgba(37,20,22,.85);color:#e0807f;border:1px solid #b05a59;border-radius:999px;'
    + 'font:700 13px/1 Inter,sans-serif;letter-spacing:.12em;padding:10px 16px;backdrop-filter:blur(4px);';
  btn.addEventListener('click', () => {
    if (window.confirm('Apagar TODO o progresso e recomeçar do zero?')) resetFn();
  });
  document.body.appendChild(btn);
}

// Botão clicável para ativar o modo de teste (quando não veio por URL).
// onApplied() é chamado após ativar (ex.: salvar). Fica fora do #stage para
// não escalar — sempre legível no celular.
export function setupDevButton(state, onApplied) {
  if (document.getElementById('dev-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'dev-btn';
  btn.type = 'button';
  btn.textContent = 'DEV 🔓';
  btn.title = 'Ativar modo de teste — desbloqueia tudo';
  btn.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:300;cursor:pointer;'
    + 'background:rgba(20,26,37,.85);color:#d9a441;border:1px solid #d9a441;border-radius:999px;'
    + 'font:700 13px/1 Inter,sans-serif;letter-spacing:.12em;padding:10px 16px;backdrop-filter:blur(4px);';
  btn.addEventListener('click', () => {
    applyDevUnlock(state);
    showDevBadge();
    setupDevPanel(state, onApplied); // painel flutuante de recursos
    btn.remove();
    if (onApplied) onApplied();
  });
  document.body.appendChild(btn);
}
```

### `src/core/format.js`

```javascript
// Formatação central de números exibidos.
// Regra (CLAUDE.md): sufixos K/M/B/T, depois notação científica curta.

const SUFFIXES = [
  { value: 1e12, suffix: 'T' },
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'K' },
];

// Acima de 1e15 (esgotados os sufixos) cai na notação científica curta: "1.23e18".
const SCI_THRESHOLD = 1e15;

// Multiplicador exibido como PORCENTAGEM total: ×3.89 → "389%", ×495 → "49.5K%",
// ×1 → "100%". Decisão do Willian (mais amigável que "×N" para crit/bônus).
export function formatMult(v) {
  if (!Number.isFinite(v)) return '∞%';
  return `${formatNumber(v * 100)}%`;
}

export function formatNumber(n) {
  if (!Number.isFinite(n)) return '∞';
  if (n < 0) return '-' + formatNumber(-n);
  if (n < 1000) {
    // valores pequenos: inteiro, ou 1 casa se tiver fração relevante
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }
  if (n >= SCI_THRESHOLD) {
    const exp = Math.floor(Math.log10(n));
    const mant = n / 10 ** exp;
    return `${mant.toFixed(2)}e${exp}`;
  }
  for (const { value, suffix } of SUFFIXES) {
    if (n >= value) {
      const v = n / value;
      // 48.2K, 1.85M — máximo 3 algarismos significativos antes do sufixo
      const decimals = v >= 100 ? 0 : v >= 10 ? 1 : 2;
      return v.toFixed(decimals) + suffix;
    }
  }
  return String(Math.round(n));
}
```

### `src/core/loop.js`

```javascript
// Game loop: tick fixo de 100ms com acumulador.
// O setInterval dispara perto de 100ms, mas o tempo real manda: o acumulador
// converte o tempo decorrido em N ticks fixos, mantendo a simulação determinística.

import { TICK_SECONDS, MAX_CATCHUP_TICKS } from '../data/constants.js';

export function startLoop(tickFn) {
  let last = performance.now();
  let accumulator = 0;

  setInterval(() => {
    const now = performance.now();
    accumulator += (now - last) / 1000;
    last = now;

    let ticks = 0;
    while (accumulator >= TICK_SECONDS && ticks < MAX_CATCHUP_TICKS) {
      tickFn(TICK_SECONDS);
      accumulator -= TICK_SECONDS;
      ticks++;
    }
    // Aba em background por muito tempo: descarta o excedente.
    // Ausências longas são cobertas pelo progresso offline (§15) no reload.
    if (ticks >= MAX_CATCHUP_TICKS) accumulator = 0;
  }, TICK_SECONDS * 1000);
}
```

### `src/core/save.js`

```javascript
// Persistência em localStorage com versão de schema.
// Autosave a cada 10s e no beforeunload.

import { SAVE_KEY, SCHEMA_VERSION, AUTOSAVE_MS } from '../data/constants.js';
import { toSnapshot, applySnapshot } from './state.js';

export function save() {
  try {
    // savedAt marca o momento do save — base do progresso offline (§15)
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...toSnapshot(), savedAt: Date.now() }));
  } catch (e) {
    // localStorage cheio ou indisponível — não derruba o jogo
    console.warn('Falha ao salvar:', e);
  }
}

// Retorna o snapshot carregado (já aplicado ao estado) ou null.
export function load() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let snapshot;
  try {
    snapshot = JSON.parse(raw);
  } catch {
    console.warn('Save corrompido — começando do zero.');
    return null;
  }
  if (snapshot.schemaVersion !== SCHEMA_VERSION) {
    // Migrações entram aqui quando o schema evoluir; por ora, descarta.
    console.warn(`Schema ${snapshot.schemaVersion} ≠ ${SCHEMA_VERSION} — save descartado.`);
    return null;
  }
  applySnapshot(snapshot);
  return snapshot;
}

export function setupAutosave() {
  setInterval(save, AUTOSAVE_MS);
  window.addEventListener('beforeunload', save);
}

// Apaga o save e recomeça do zero. Remove o listener de beforeunload pra o
// autosave NÃO regravar o estado antigo antes do reload.
export function resetSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* indisponível */ }
  window.removeEventListener('beforeunload', save);
  window.location.reload();
}
```

### `src/core/state.js`

```javascript
// Estado central do jogo. Único objeto mutável compartilhado entre os módulos.

import { SCHEMA_VERSION, SEEKER_RANKS, MAPS } from '../data/constants.js';

// Nº de sub-áreas de um mapa (default Map 1). CP-2: 8 por mapa.
const subCountOf = (mapId) => (MAPS[(mapId || 1) - 1] || MAPS[0]).subareaCount;
// Normaliza um array de bossDefeated para o comprimento certo (pad false / trunca).
const normBossDefeated = (arr, mapId) =>
  Array.from({ length: subCountOf(mapId) }, (_, i) => !!(arr && arr[i]));

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,

    // Recursos
    lumens: 0,
    xpTotal: 0, // XP acumulado da vida — alimenta o level de display (§6 do GDD)
    xpRun: 0,   // XP da run — enche a parede de Convergence, reseta ao convergir

    // Vestiges (§7) — nunca resetam
    vestiges: 0,

    // Éclats (§10) — moeda-relíquia; fonte é a Ascension (A1). Nunca resetam.
    eclats: 0,
    ascensions: 0, // marcos de Ascension concluídos (§9) — gate das Mémoires por era
    despertares: 0, // §8 (Passo 7): tier de Despertar (0..4 = T1..T5), gate de poder no meio do mapa
    nitzotzot: 0, // §8 (redesign 13/jun): material dedicado do Despertar (Oferenda). Dropa nas Sub 3+. PERSISTE.
    memoires: new Array(15).fill(0), // níveis das 15 Mémoires (§11); 0 = bloqueada. PERSISTE.

    // Convergence (§6) — persistem para sempre
    convergences: 0,
    convPoints: 0,
    bestSubareaRun: 1, // subárea mais funda alcançada na run (vira pontos)

    // Gold Stats (§5) — resetam na Convergence (CP-E)
    stats: { str: 0, vit: 0, agi: 0, lck: 0, frt: 0, wis: 0 },

    // Passivas (§7) — 3 árvores × 15 níveis (0 = bloqueada). PERSISTE sempre;
    // desbloqueia na 1ª Convergence. Índice = ordem canônica do GDD.
    passives: {
      eclat:    new Array(15).fill(0),
      vestige:  new Array(15).fill(0),
      fracture: new Array(15).fill(0),
    },

    // Gear (§13) — 6 peças fixas, cada uma com nível + raridade. PERSISTE sempre
    // (não reseta na Convergence). rarity = índice em GEAR_RARITIES (0=Faded).
    gear: {
      edge:  { level: 0, rarity: 0 },
      vigil: { level: 0, rarity: 0 },
      veil:  { level: 0, rarity: 0 },
      grasp: { level: 0, rarity: 0 },
      reson: { level: 0, rarity: 0 },
      band:  { level: 0, rarity: 0 },
    },
    materiais: [0, 0, 0, 0], // §13B (Passo 4): T1-T4. materiais[r] paga a raridade r→r+1.

    // §8 (Passo 5): dificuldade selecionada (índice em DIFFICULTIES) + automações dos Fate Keepers
    difficulty: 0,
    auto: { stats: false, converge: false, progress: false }, // toggl_es (default off; desbloqueiam por Ascension)
    ecoMap: 0, // §8 Eco do Seeker (A3): mapa que o eco farma em 2º plano (0 = nenhum)

    // Posição no mundo
    map: 1,
    maxMap: 1,          // fronteira: maior mapa já alcançado (permite voltar a anteriores)
    subarea: 1,         // 1..subareaCount (CP-2: 8)
    unlockedSubarea: 1, // gate: maior subárea acessível (abre ao derrotar o boss)
    bossDefeated: normBossDefeated([], 1), // 1ª derrota por subárea (comprimento = subareaCount)
    killsInSubarea: 0,  // contador oculto rumo ao threshold do boss
    mapProgress: {},    // progresso salvo por mapa {id: {subarea, unlockedSubarea, bossDefeated, killsInSubarea}}

    // Jogador (valores derivados ficam em src/game/stats.js)
    player: {
      hp: 0,            // inicializado com hpMax no bootstrap
      dead: false,
      respawnTimer: 0,  // segundos até o respawn quando morto
      attackTimer: 0,   // acumulador do intervalo de ataque
    },

    // Onda ativa de inimigos (runtime, não persistido). Mobs mortos ficam na
    // cena (apagados) até a onda ser limpa — sem respawn individual.
    enemies: [],
    wave: 1, // número da onda atual na subárea (runtime)

    // Fila de efeitos visuais (runtime) — hits para os números flutuantes
    fx: [],

    // Métricas
    killsTotal: 0,
  };
}

// Estado vivo da sessão (singleton simples)
export const state = createInitialState();

// Aplica um snapshot persistido por cima do estado inicial (campos salvos apenas)
export function applySnapshot(snapshot) {
  state.lumens = snapshot.lumens ?? 0;
  state.xpTotal = snapshot.xpTotal ?? 0;
  state.map = snapshot.map ?? 1;
  state.subarea = snapshot.subarea ?? 1;
  state.killsTotal = snapshot.killsTotal ?? 0;
  // saves antigos (sem stats) entram com tudo zerado
  Object.assign(state.stats, snapshot.stats ?? {});
  // saves anteriores ao gate: herda a subárea atual como desbloqueada
  state.unlockedSubarea = snapshot.unlockedSubarea ?? state.subarea;
  // CP-2: normaliza o comprimento ao nº de sub-áreas do mapa (saves antigos = 5 → 8)
  state.bossDefeated = normBossDefeated(snapshot.bossDefeated, state.map);
  state.killsInSubarea = snapshot.killsInSubarea ?? 0;
  state.subarea = Math.min(state.subarea, state.unlockedSubarea);
  // viagem entre mapas: fronteira + progresso por mapa (saves antigos: fronteira = mapa atual)
  state.maxMap = Math.max(snapshot.maxMap ?? state.map, state.map);
  state.mapProgress = snapshot.mapProgress ?? {};
  state.xpRun = snapshot.xpRun ?? 0;
  state.vestiges = snapshot.vestiges ?? 0;
  state.convergences = snapshot.convergences ?? 0;
  state.convPoints = snapshot.convPoints ?? 0;
  state.bestSubareaRun = snapshot.bestSubareaRun ?? state.subarea;
  // Éclats / Ascension / Mémoires persistem
  state.eclats = snapshot.eclats ?? 0;
  state.ascensions = snapshot.ascensions ?? 0;
  if (Array.isArray(snapshot.memoires)) {
    for (let i = 0; i < state.memoires.length; i++) state.memoires[i] = snapshot.memoires[i] ?? 0;
  }
  // Passivas persistem; saves antigos (sem passives) mantêm tudo bloqueado
  if (snapshot.passives) {
    for (const tree of Object.keys(state.passives)) {
      const arr = snapshot.passives[tree];
      if (Array.isArray(arr)) {
        for (let i = 0; i < state.passives[tree].length; i++) state.passives[tree][i] = arr[i] ?? 0;
      }
    }
  }
  // Gear persiste; saves antigos (sem gear) mantêm o default (tudo Faded nível 0)
  if (snapshot.gear) {
    for (const key of Object.keys(state.gear)) {
      const g = snapshot.gear[key];
      if (g) state.gear[key] = { level: g.level ?? 0, rarity: g.rarity ?? 0 };
    }
  }
  // Materiais (§13B, schema v2): default 0 p/ saves antigos (sem materiais). Normaliza sempre.
  const mats = Array.isArray(snapshot.materiais) ? snapshot.materiais : [];
  for (let i = 0; i < state.materiais.length; i++) state.materiais[i] = mats[i] ?? 0;
  // §8 (schema v3): dificuldade + automações. Normaliza sempre (default p/ saves antigos).
  state.difficulty = snapshot.difficulty ?? 0;
  const a = snapshot.auto || {};
  state.auto = { stats: !!a.stats, converge: !!a.converge, progress: !!a.progress };
  state.ecoMap = snapshot.ecoMap ?? 0; // §8 Eco do Seeker (schema v5)
  // §8 (schema v4): tier de Despertar. MIGRA de saves antigos a partir das ascensions p/
  // NÃO regredir o tier — cada ascension passada implica um Despertar (você passou a Sub 3
  // do mapa p/ vencer o boss e ascender); +1 se já passou a Sub 3 do mapa ATUAL.
  state.despertares = snapshot.despertares ?? Math.min(
    SEEKER_RANKS.length - 1,
    state.ascensions + (state.unlockedSubarea > 3 ? 1 : 0),
  );
  state.nitzotzot = snapshot.nitzotzot ?? 0; // §8 redesign (material do Despertar)
}

// Extrai só o que deve ser persistido (pack e timers são reconstruídos no load)
export function toSnapshot() {
  return {
    schemaVersion: state.schemaVersion,
    lumens: state.lumens,
    xpTotal: state.xpTotal,
    map: state.map,
    subarea: state.subarea,
    killsTotal: state.killsTotal,
    stats: { ...state.stats },
    unlockedSubarea: state.unlockedSubarea,
    bossDefeated: [...state.bossDefeated],
    killsInSubarea: state.killsInSubarea,
    maxMap: state.maxMap,
    mapProgress: JSON.parse(JSON.stringify(state.mapProgress)),
    xpRun: state.xpRun,
    vestiges: state.vestiges,
    convergences: state.convergences,
    convPoints: state.convPoints,
    bestSubareaRun: state.bestSubareaRun,
    gear: JSON.parse(JSON.stringify(state.gear)),         // persiste sempre (§13)
    materiais: [...state.materiais],                      // §13B (persiste sempre)
    difficulty: state.difficulty,                         // §8 (Passo 5)
    auto: { ...state.auto },                              // §8 automações
    ecoMap: state.ecoMap,                                 // §8 Eco do Seeker (A3)
    passives: JSON.parse(JSON.stringify(state.passives)), // persiste sempre (§7)
    eclats: state.eclats,                                 // §10
    ascensions: state.ascensions,                         // §9
    despertares: state.despertares,                       // §8 (Passo 7) tier de Despertar
    nitzotzot: state.nitzotzot,                           // §8 redesign — material do Despertar
    memoires: [...state.memoires],                        // §11
  };
}
```

## Dados — src/data

### `src/data/assets.js`

```javascript
// AUTO-GERADO por tools/eclats-pipeline/gen_assets_module.py — nao editar a mao.
// Manifest de assets como modulo ES. BASE relativo (Vite serve public/ na raiz).
const BASE = "eclats/";
const DATA = {
  "backgrounds": {
    "map1": "backgrounds/map1_dreaming_wood",
    "map2": "backgrounds/map2_cavernes_luminis",
    "map3": "backgrounds/map3_ashen_ruins",
    "map4": "backgrounds/map4_fractured_peaks",
    "map5": "backgrounds/map5_nil_aeternum"
  },
  "worldmap": {
    "continent1": "worldmap/continent1_dreaming_wood_crop2x",
    "continent2": "worldmap/continent2_crop2x",
    "continent3": "worldmap/continent3_crop2x",
    "continent4": "worldmap/continent4_crop2x",
    "continent5": "worldmap/continent5_crop2x",
    "atlas": "worldmap/worldmap"
  },
  "seeker": {
    "card_t1": "characters/seeker/seeker_card_t1",
    "card_t2": "characters/seeker/seeker_card_t2",
    "card_t3": "characters/seeker/seeker_card_t3",
    "card_t4": "characters/seeker/seeker_card_t4",
    "card_t5": "characters/seeker/seeker_card_t5",
    "nameplate": "characters/seeker/seeker_nameplate"
  },
  "frames": {
    "card": "frames/card_frame_alpha",
    "boss_m1": "frames/frame_boss_m1",
    "boss_m2": "frames/frame_boss_m2",
    "boss_m3": "frames/frame_boss_m3",
    "boss_m4": "frames/frame_boss_m4",
    "boss_m5": "frames/frame_boss_m5",
    "enemy": "frames/frame_enemy_alpha",
    "enemy_universal": "frames/frame_enemy_universal",
    "universal": "frames/frame_universal"
  },
  "icons": {
    "nav": {
      "1": "icons/nav/nav_1",
      "2": "icons/nav/nav_2",
      "3": "icons/nav/nav_3",
      "4": "icons/nav/nav_4",
      "5": "icons/nav/nav_5",
      "6": "icons/nav/nav_6",
      "7": "icons/nav/nav_7",
      "forge": "icons/nav/nav_forge"
    },
    "currency": {
      "convergence": "icons/currency/icon_convergence_alpha",
      "lumens": "icons/currency/icon_lumens_alpha",
      "vestiges": "icons/currency/icon_vestiges_alpha"
    }
  },
  "gear": {
    "band_converged": "gear/band_converged",
    "band_faded": "gear/band_faded",
    "band_kindled": "gear/band_kindled",
    "band_luminous": "gear/band_luminous",
    "band_radiant": "gear/band_radiant",
    "edge_converged": "gear/edge_converged",
    "edge_faded": "gear/edge_faded",
    "edge_kindled": "gear/edge_kindled",
    "edge_luminous": "gear/edge_luminous",
    "edge_radiant": "gear/edge_radiant",
    "grasp_converged": "gear/grasp_converged",
    "grasp_faded": "gear/grasp_faded",
    "grasp_kindled": "gear/grasp_kindled",
    "grasp_luminous": "gear/grasp_luminous",
    "grasp_radiant": "gear/grasp_radiant",
    "nameplate": "gear/nameplate",
    "reson_converged": "gear/reson_converged",
    "reson_faded": "gear/reson_faded",
    "reson_kindled": "gear/reson_kindled",
    "reson_luminous": "gear/reson_luminous",
    "reson_radiant": "gear/reson_radiant",
    "screen": "gear/screen",
    "slot_frame": "gear/slot_frame",
    "veil_converged": "gear/veil_converged",
    "veil_faded": "gear/veil_faded",
    "veil_kindled": "gear/veil_kindled",
    "veil_luminous": "gear/veil_luminous",
    "veil_radiant": "gear/veil_radiant",
    "vigil_converged": "gear/vigil_converged",
    "vigil_faded": "gear/vigil_faded",
    "vigil_kindled": "gear/vigil_kindled",
    "vigil_luminous": "gear/vigil_luminous",
    "vigil_radiant": "gear/vigil_radiant"
  },
  "passives": {
    "eclat": {
      "e_crit_cascade": "passives/eclat/e_crit_cascade",
      "e_eclat_surge": "passives/eclat/e_eclat_surge",
      "e_execute": "passives/eclat/e_execute",
      "e_fracture_weakness": "passives/eclat/e_fracture_weakness",
      "e_luminal_edge": "passives/eclat/e_luminal_edge",
      "e_luminal_explosion": "passives/eclat/e_luminal_explosion",
      "e_momentum": "passives/eclat/e_momentum",
      "e_oreinsof_touch": "passives/eclat/e_oreinsof_touch",
      "e_overkill": "passives/eclat/e_overkill",
      "e_radiant_strike": "passives/eclat/e_radiant_strike",
      "e_refraction": "passives/eclat/e_refraction",
      "e_resonant_force": "passives/eclat/e_resonant_force",
      "e_shard_burst": "passives/eclat/e_shard_burst",
      "e_shattered_light": "passives/eclat/e_shattered_light",
      "e_void_piercing": "passives/eclat/e_void_piercing"
    },
    "vestige": {
      "v_awakened_harvest": "passives/vestige/v_awakened_harvest",
      "v_beast_caller": "passives/vestige/v_beast_caller",
      "v_collector": "passives/vestige/v_collector",
      "v_dreamwalker": "passives/vestige/v_dreamwalker",
      "v_echo_greed": "passives/vestige/v_echo_greed",
      "v_eternal_vestige": "passives/vestige/v_eternal_vestige",
      "v_fractured_soul": "passives/vestige/v_fractured_soul",
      "v_hoarder": "passives/vestige/v_hoarder",
      "v_lumens_blessing": "passives/vestige/v_lumens_blessing",
      "v_luminal_cache": "passives/vestige/v_luminal_cache",
      "v_remnant_harvest": "passives/vestige/v_remnant_harvest",
      "v_scavenger": "passives/vestige/v_scavenger",
      "v_vestige_pull": "passives/vestige/v_vestige_pull",
      "v_void_scavenger": "passives/vestige/v_void_scavenger",
      "v_wisdom_ruins": "passives/vestige/v_wisdom_ruins"
    },
    "fracture": {
      "f_claimed_domination": "passives/fracture/f_claimed_domination",
      "f_eclat_attunement": "passives/fracture/f_eclat_attunement",
      "f_fracture_pulse": "passives/fracture/f_fracture_pulse",
      "f_fracture_sense": "passives/fracture/f_fracture_sense",
      "f_fractures_echo": "passives/fracture/f_fractures_echo",
      "f_fractures_gift": "passives/fracture/f_fractures_gift",
      "f_last_light": "passives/fracture/f_last_light",
      "f_nihels_shadow": "passives/fracture/f_nihels_shadow",
      "f_nils_embrace": "passives/fracture/f_nils_embrace",
      "f_shard_disruption": "passives/fracture/f_shard_disruption",
      "f_void_awareness": "passives/fracture/f_void_awareness",
      "f_void_collapse": "passives/fracture/f_void_collapse",
      "f_void_endurance": "passives/fracture/f_void_endurance",
      "f_void_haste": "passives/fracture/f_void_haste",
      "f_weakened_void": "passives/fracture/f_weakened_void"
    }
  },
  "relics": {
    "e1_marche": "relics/e1_marche",
    "e1_matin": "relics/e1_matin",
    "e1_rires": "relics/e1_rires",
    "e2_faconnage": "relics/e2_faconnage",
    "e2_forme": "relics/e2_forme",
    "e2_profondeurs": "relics/e2_profondeurs",
    "e3_cendres": "relics/e3_cendres",
    "e3_chant": "relics/e3_chant",
    "e3_chute": "relics/e3_chute",
    "e4_blessure": "relics/e4_blessure",
    "e4_resistance": "relics/e4_resistance",
    "e4_temps": "relics/e4_temps",
    "e5_choix": "relics/e5_choix",
    "e5_lumiere": "relics/e5_lumiere",
    "e5_vide": "relics/e5_vide"
  },
  "enemies": {
    "map1": {
      "dreaming_gate": "enemies/map1/dreaming_gate",
      "gilded_hollow": "enemies/map1/gilded_hollow",
      "mothlight_herald": "enemies/map1/mothlight_herald",
      "candlewisp_shade": "enemies/map1/candlewisp_shade",
      "dreamhorn_warden": "enemies/map1/dreamhorn_warden",
      "hollowroot_crawler": "enemies/map1/hollowroot_crawler",
      "glowmere_drifter": "enemies/map1/glowmere_drifter",
      "glimmercap_hollow": "enemies/map1/glimmercap_hollow",
      "lanternroot_glade": "enemies/map1/lanternroot_glade",
      "lightfall_stair": "enemies/map1/lightfall_stair",
      "verdant_deep": "enemies/map1/verdant_deep",
      "wooding": "enemies/map1/wooding"
    },
    "map2": {
      "crystal_being": "enemies/map2/enemy_VERIFICAR_crystal_being",
      "cyan_ghost": "enemies/map2/enemy_VERIFICAR_cyan_ghost",
      "teal_flame": "enemies/map2/enemy_VERIFICAR_teal_flame",
      "hourglass_pillar": "enemies/map2/hourglass_pillar",
      "lucent_gate": "enemies/map2/lucent_gate",
      "luminis": "enemies/map2/luminis",
      "prism_stair": "enemies/map2/prism_stair",
      "shardbloom_rise": "enemies/map2/shardbloom_rise",
      "stillwater_deep": "enemies/map2/stillwater_deep"
    },
    "map3": {
      "ashen_throne": "enemies/map3/ashen_throne",
      "asheruins": "enemies/map3/asheruins",
      "cindergate": "enemies/map3/cindergate",
      "horned_statue": "enemies/map3/enemy_VERIFICAR_horned_statue",
      "thorn_sentinel": "enemies/map3/enemy_VERIFICAR_thorn_sentinel",
      "three_faces": "enemies/map3/enemy_VERIFICAR_three_faces",
      "vortex": "enemies/map3/enemy_VERIFICAR_vortex",
      "fallen_colonnade": "enemies/map3/fallen_colonnade",
      "pyre_ascent": "enemies/map3/pyre_ascent",
      "silent_choir": "enemies/map3/silent_choir"
    },
    "map4": {
      "chained_giant": "enemies/map4/enemy_VERIFICAR_chained_giant",
      "claimed_vanguard": "enemies/map4/enemy_VERIFICAR_claimed_vanguard",
      "fissure_stalker": "enemies/map4/enemy_VERIFICAR_fissure_stalker",
      "fracturedpeaks": "enemies/map4/fracturedpeaks"
    },
    "map5": {
      "crown_bearer": "enemies/map5/enemy_VERIFICAR_crown_bearer",
      "dragon_lancer": "enemies/map5/enemy_VERIFICAR_dragon_lancer",
      "fallen_angel": "enemies/map5/enemy_VERIFICAR_fallen_angel",
      "hooded_redeyes": "enemies/map5/enemy_VERIFICAR_hooded_redeyes",
      "white_mask_priest": "enemies/map5/enemy_VERIFICAR_white_mask_priest",
      "nilaeternum": "enemies/map5/nilaeternum",
      "rare_first_eclaire": "enemies/map5/rare_VERIFICAR_first_eclaire"
    }
  },
  "bosses": {
    "m3_ashen_king": "bosses/boss_m3_ashen_king_VERIFICAR",
    "m4_claimed_queen": "bosses/boss_m4_claimed_queen_VERIFICAR",
    "pale_reunion": "bosses/boss_VERIFICAR_pale_reunion"
  }
};
const FLAGS = {
  "lowres": [],
  "verify": [
    "bosses/boss_m3_ashen_king_VERIFICAR",
    "bosses/boss_m4_claimed_queen_VERIFICAR",
    "bosses/boss_VERIFICAR_pale_reunion",
    "enemies/map2/enemy_VERIFICAR_crystal_being",
    "enemies/map2/enemy_VERIFICAR_cyan_ghost",
    "enemies/map2/enemy_VERIFICAR_teal_flame",
    "enemies/map3/enemy_VERIFICAR_horned_statue",
    "enemies/map3/enemy_VERIFICAR_thorn_sentinel",
    "enemies/map3/enemy_VERIFICAR_three_faces",
    "enemies/map3/enemy_VERIFICAR_vortex",
    "enemies/map4/enemy_VERIFICAR_chained_giant",
    "enemies/map4/enemy_VERIFICAR_claimed_vanguard",
    "enemies/map4/enemy_VERIFICAR_fissure_stalker",
    "enemies/map5/enemy_VERIFICAR_crown_bearer",
    "enemies/map5/enemy_VERIFICAR_dragon_lancer",
    "enemies/map5/enemy_VERIFICAR_fallen_angel",
    "enemies/map5/enemy_VERIFICAR_hooded_redeyes",
    "enemies/map5/enemy_VERIFICAR_white_mask_priest",
    "enemies/map5/rare_VERIFICAR_first_eclaire"
  ]
};
const FALLBACK_EXT = {};

export function path(id) {
  const v = id.split(".").reduce((o, k) => (o == null ? o : o[k]), DATA);
  if (v == null || typeof v !== "string") { console.warn("[assets] id desconhecido:", id); return null; }
  return v;
}
const rasterExt = (p) => FALLBACK_EXT[p] || ".png";
export const url = (id, ext) => { const p = path(id); return p ? BASE + p + (ext || ".webp") : ""; };

// <picture> com fallback raster nativo
export function picture(id, opts) {
  opts = opts || {};
  const p = path(id); if (!p) return "";
  const cls = opts.className ? ` class="${opts.className}"` : "";
  const alt = (opts.alt || "").replace(/"/g, "&quot;");
  const style = opts.style ? ` style="${opts.style}"` : "";
  return `<picture${cls}><source srcset="${BASE}${p}.webp" type="image/webp">`
    + `<img src="${BASE}${p}${rasterExt(p)}" alt="${alt}"${style} loading="lazy"></picture>`;
}

// background-image com fallback nativo via image-set()
export function bg(id) {
  const p = path(id); if (!p) return "";
  return `image-set(url("${BASE}${p}.webp") type("image/webp"), url("${BASE}${p}${rasterExt(p)}"))`;
}

export const ASSETS = { BASE, DATA, FLAGS, FALLBACK_EXT, path, url, picture, bg };
export default ASSETS;
```

### `src/data/constants.js`

```javascript
// Constantes de balanceamento — fonte: docs/eclats_gdd_final_v2.md
// NUNCA inventar valores: tudo aqui vem do GDD (seções 3, 4, 6 e 12).

// §4 — Constantes-âncora do núcleo de combate
export const COMBAT = {
  // ✅ RECALIBRAÇÃO "VALORES NO MAPA" (2026-06-18, decisão Willian). Stats iniciais do
  // player redefinidos; o resto (Convergence/Despertar/Gear) acompanha. Ver o doc novo
  // docs/eclats_balance_mapa_2026-06-18.md. Substitui a recalibração "em branco" 17/jun.
  baseDmg: 50000,         // dano base do Seeker (decisão Willian: 50.000)
  baseAPS: 0.90,          // atk speed inicial 0,9 (intervalo ~1,11s)
  apsCap: 10,             // teto GLOBAL de APS (decisão Willian); Map 1 termina em ~2,5
  // APS cresce LINEAR com o afixo do Amuleto (gearApsFlat) + Despertar (+0,5/tier).
  // Mantemos as 2 chaves abaixo só por compat de imports (não usadas).
  apsBonusMax: 0.45,
  apsHalf: 1.7,
  playerBaseHp: 100000,   // HP base inicial (decisão Willian: 100k)
  regenPerSec: 0.01,      // 1% do HP máx por segundo
  regenOnKill: 0,         // regen-por-kill REMOVIDO (vira passiva futura — decisão Willian)
  bossHpMult: 15,         // Wall = mob da Sub 9 (nível 1000) × 15 = ~32,5 bi
  bossDmgMult: 3,         // dano do boss ×3 (sim BOSSDMG)
  deathRespawnSeconds: 3, // morte: respawn com HP cheio, sem perdas
  waveClearDelay: 0.3,    // beat entre ondas: cobre o voo do projétil (PROJ_BASE_MS 200ms + frame)
                          // p/ a morte do ÚLTIMO mob chegar ANTES da próxima onda surgir.
};

// §12 — Lumens · §6 — XP
// ✅ recalibração 2026-06-17 (mobs relativos ao player): a recompensa é DESACOPLADA do HP do
// mob (que agora = seu dano → criava feedback explosivo no nível). XP/Lumens por kill =
// BASE FIXA × areaReward[área] × convMult × gear/mémoires. Assim o nível paceia pela
// PROFUNDIDADE + taxa de kill, não pelo seu dano. (goldRatio/xpRatio viram legado.)
export const ECONOMY = {
  lumBase: 4000,    // Lumens base por kill (× areaReward × convMult × gear …) → compra de gear
  xpRatio: 0.10,    // XP por kill = HP do mob × xpRatio (HP = seu dano × 3 → sobe LISO com nível)
  goldRatio: 0.10,  // legado
  xpBase: 90,       // legado
  lumensFloor: 0,
};

// CP-3 (redesign) — NÍVEL = motor de stat base (substitui os Gold Stats).
// O nível vem do XP da RUN (xpRun): level = (xpRun / div)^exp. Reseta na Convergence.
// Cada nível dá stat FLAT. ⏳ VALORES PLACEHOLDER — Willian vai calibrar por teste.
export const LEVEL = {
  // ✅ RECALIBRAÇÃO "VALORES NO MAPA" (18/jun): per-level escalado ao novo dano/HP base
  // (baseDmg 50k → +7.500/nv mantém a mesma fração ~15%/nv; baseHp 100k → +500/nv ~0,5%/nv).
  // O nível segue motor de stat base; XP da run reseta na Convergence. level=(xpRun/div)^exp.
  curveDiv: 25000, curveExp: 0.42, // ⏳ div ×50 p/ compensar o mobHp ×50 (X=mobHp×ratio) e restaurar o pace
  dmgPerLevel: 7500, // +dano flat por nível (≈15% do base/nv, como antes)
  hpPerLevel: 500,   // +HP flat por nível (≈0,5% do base/nv, como antes)
  goldPerLevel: 0,   // sem bônus de Lumens por nível
};

// ✅ INIMIGOS RELATIVOS AO PLAYER (recalibração 2026-06-17, decisão Willian: "números
// grandes, mobs te seguem"). HP/dano/nível dos mobs derivam do PODER ATUAL do player —
// não mais da malha estática. Coerente por construção (e imune ao reset da Convergence):
//   mob.level   = nível do player × (fator leve por área)
//   mob.hpMax   = dano_por_hit do player × hitsToKill × areaHp[área]   → ~3 golpes p/ matar
//   mob.dmg/s   = HP_máx do player × dmgFrac × areaDmg[área]           → ameaça real (~30%+)
//   recompensa  = HP do mob × ratio × areaReward[área]                 → fundo = mais ganho
// Boss (Wall) = mob × bossHpMult (HP) e × bossDmgMult (dano). Índices = sub-área − 1.
export const ENEMY = {
  // ✅ RECALIBRAÇÃO "VALORES NO MAPA" (18/jun): TTK inicial ~2,2s (2 golpes ÷ APS 0,9) e CRESCE
  // com a profundidade (áreas 2/3+ com mobs "bem mais fortes" — decisão Willian). O TTK CAI
  // conforme o player investe (gear/Convergence/Despertar furam o baseline → menos golpes).
  hitsToKill: 2,
  areaHp:     [1, 1.4, 2.0, 2.7, 3.5, 4.5, 5.8, 7.4, 9.5],     // deeper = mobs bem mais fortes (TTK sobe)
  dmgFrac:    0.009,                                           // dano da ONDA = HP_baseline × dmgFrac × areaDmg /s
  areaDmg:    [1, 1.4, 1.9, 2.6, 3.4, 4.4, 5.6, 7.0, 9.0],     // profundidade = MUITO mais perigo (Wall mata)
  areaReward: [1, 1.6, 2.6, 4.2, 6.8, 11, 18, 29, 47],         // Lumens crescem com a profundidade
  // ✅ "VALORES NO MAPA" (18/jun): Wall (área 9) = mob × 100 de HP. Com Despertar = clímax tenso
  // (~20 mortes, ~12h). SEM Despertar = grind ~3× mais longo (~37h) — Despertar fortemente necessário.
  // (Ajustado p/ a base de custo 800, que deixa o gear ~174 no fim, mais fraco que antes.)
  bossHpMult: 100,
  bossDmgMult: 5,                                              // boss causa 5× o dano-onda de um mob
  levelPerArea: 0.03,                                          // mob.level = playerLevel × (1 + 0.03×(área−1))
};

// §3 — Malha geométrica dos 5 mapas (✅ levels/HP/threshold canônicos).
// ⚠️ HP/dano dos mobs agora vêm de ENEMY (relativo ao player); os campos hp*/dmg* abaixo
// viram LEGADO (mantidos p/ compat de imports e do nível geométrico de unlock).
// packSizes: densidade de mobs por sub-área (índice = sub-área − 1).
// CP-2 (redesign): nº de sub-áreas CRESCENTE por mapa — Map1=5 · Map2=6 · Map3=7 ·
// Map4=Map5=8 (era 5 fixo). PACK tem 8 entradas; cada mapa usa as primeiras N.
// ⏳ números a re-ancorar na recalibração; curva suave 2→12 por enquanto.
// TODO canon: vínculo nome↔arte dos Maps 2-5 (arte de alguns trios incompleta).
const PACK = [2, 3, 4, 5, 6, 8, 10, 12, 14];
export const MAPS = [
  {
    id: 1, name: 'The Dreaming Wood', continent: 'worldmap.continent1', bg: 'backgrounds.map1',
    // ✅ RECALIBRAÇÃO "EM BRANCO": mob 2.000 (2 hits) → Sub 9 nível 1000 = 2,169 bi;
    // Wall (boss ×15) = ~32,5 bi. Dano dos mobs = curva PRÓPRIA (80 → 700k), Wall "perigo C".
    lvlLo: 1, lvlHi: 1000, hpLo: 2000, hpHi: 2169085656, dmgLo: 80, dmgHi: 7e5,
    // ✅ "VALORES NO MAPA" (18/jun): 2 mobs por área, EXCETO a área 9 (Wall) com 3 (decisão Willian).
    subareaCount: 9, packSizes: [2, 2, 2, 2, 2, 2, 2, 2, 3], bossKillThreshold: 100,
    // ✅ Map 1 sobe o gear só até INCOMUM (Kindled, índice 1) — raro+ é pós-Map 1 (decisão Willian).
    gearRarityCap: 1,
    // ✅ GATE DE NÍVEL re-calibrado e VALIDADO no harness (18/jun): bandas espalhadas pela
    // jornada real de níveis (cresce via Convergence). Sub 7 (nível 540) = Despertar de fato
    // ANTES da Wall; Sub 9 (nível 950) = Wall. unlockLevels[n-1] = nível p/ liberar a Sub n.
    unlockLevels: [1, 25, 60, 130, 240, 380, 540, 720, 950],
    enemyNames: ['Candlewisp Shade', 'Mothlight Herald', 'Dreamhorn Warden', 'Hollowroot Crawler', 'Glowmere Drifter'],
    enemyArts: ['enemies.map1.candlewisp_shade', 'enemies.map1.mothlight_herald', 'enemies.map1.dreamhorn_warden', 'enemies.map1.hollowroot_crawler', 'enemies.map1.glowmere_drifter'],
    guardianArt: 'enemies.map1.dreamhorn_warden',
    bossName: 'The Gilded Hollow', bossArt: 'enemies.map1.gilded_hollow',
    subareaNames: [
      'Lanternroot Glade', 'Glimmercap Hollow', 'The Lightfall Stair', 'The Dreaming Gate',
      'The Verdant Deep', 'The Gilded Mire', 'The Hollowed Grove', 'The Stillwatch', 'The Hollow Heart',
    ],
  },
  {
    id: 2, name: 'Cavernes Luminis', continent: 'worldmap.continent2', bg: 'backgrounds.map2',
    lvlLo: 1000, lvlHi: 1e5, hpLo: 1e6, hpHi: 1e14, dmgLo: 2e4, dmgHi: 2e12,
    subareaCount: 6, packSizes: PACK, bossKillThreshold: 200,
    enemyNames: ['Crystalbound Husk', 'Luminis Pilgrim', 'Hollowflame Adept'],
    enemyArts: ['enemies.map2.crystal_being', 'enemies.map2.cyan_ghost', 'enemies.map2.teal_flame'],
    guardianArt: 'enemies.map2.crystal_being',
    bossName: 'The Pale Reunion', bossArt: 'bosses.pale_reunion',
  },
  {
    id: 3, name: 'The Ashen Ruins', continent: 'worldmap.continent3', bg: 'backgrounds.map3',
    lvlLo: 1e5, lvlHi: 1e7, hpLo: 1e14, hpHi: 1e24, dmgLo: 2e12, dmgHi: 2e22,
    subareaCount: 7, packSizes: PACK, bossKillThreshold: 350,
    enemyNames: ['Ember Revenant', 'Emberhorn Penitent', 'Ash Choir'],
    enemyArts: ['enemies.map3.thorn_sentinel', 'enemies.map3.horned_statue', 'enemies.map3.three_faces'],
    guardianArt: 'enemies.map3.vortex',
    bossName: 'The Ashen King', bossArt: 'bosses.m3_ashen_king',
  },
  {
    id: 4, name: 'The Fractured Peaks', continent: 'worldmap.continent4', bg: 'backgrounds.map4',
    lvlLo: 1e7, lvlHi: 1e8, hpLo: 1e24, hpHi: 1e35, dmgLo: 2e22, dmgHi: 2e33,
    subareaCount: 8, packSizes: PACK, bossKillThreshold: 500,
    enemyNames: ['Fissure Stalker', 'Sundered Titan', 'Claimed Vanguard'],
    enemyArts: ['enemies.map4.fissure_stalker', 'enemies.map4.chained_giant', 'enemies.map4.claimed_vanguard'],
    guardianArt: 'enemies.map4.chained_giant',
    bossName: 'The Claimed Queen', bossArt: 'bosses.m4_claimed_queen',
  },
  {
    id: 5, name: 'Nil Aeternum', continent: 'worldmap.continent5', bg: 'backgrounds.map5',
    lvlLo: 1e8, lvlHi: 1e9, hpLo: 1e35, hpHi: 1e45, dmgLo: 2e33, dmgHi: 2e43,
    subareaCount: 8, packSizes: PACK, bossKillThreshold: 800,
    enemyNames: ['Pale Courtier', 'Crownless King', 'Crimson Wyrmlord'],
    enemyArts: ['enemies.map5.white_mask_priest', 'enemies.map5.crown_bearer', 'enemies.map5.dragon_lancer'],
    guardianArt: 'enemies.map5.hooded_redeyes',
    bossName: 'Nihel, The Fracture', bossArt: 'enemies.map5.fallen_angel', // fallen_angel = Nihel (arte real)
  },
];
export const MAP_1 = MAPS[0]; // compat
export const BOSS_LUMEN_MULT = 5; // §12: lumens_por_kill de boss ×5

// §5 — Gold Stats (resetam na Convergence — CP-E)
// custo(n) = costBase × costRamp^n · stat_total = (1 + nível × per) × milestones
export const GOLD_STATS = {
  costBase: 10,
  costRamp: 1.15,
  per: { str: 0.08, vit: 0.06, agi: 0.04, lck: 0.002, frt: 0.05, wis: 0.05 }, // ✅ lck 0.015→0.002 (Bloco 5: LCK = fração MÍNIMA de crit; o grosso vem de Grasp + Luminal Edge)
  // Milestones geométricos (não se aplicam a agi — cap duro de APS — nem a lck)
  milestones: [[10, 2], [25, 2.5], [50, 3], [100, 4], [200, 4.5], [400, 5], [800, 5.5], [1600, 6], [3200, 6.5]],
};

// ⏳ PROVISÓRIO (GDD §16.6 — pendência de calibração, aprovado pelo Willian):
// crit damage base ×2, transbordo 1:1 (1% de rate acima de 100% → +1% de crit dmg),
// lck sem milestones. Recalibrar quando o GDD fechar os valores.
export const CRIT = {
  baseChance: 0,
  // ✅ "VALORES NO MAPA" (18/jun, decisão Willian): crit damage inicial = 0 → um crit NÃO
  // multiplica (×1) até você ganhar crit damage (Despertar +400%/tier, afixo do Manto, transbordo).
  // critDamageMult = 1 + Σ(crit dmg). (Antes a base era ×2.)
  baseDamageMult: 1,
  overflowFactor: 1,
};

// §4 — DEFESA / MITIGAÇÃO (razão/armadura). Camada 2/3 (Passo 2 do wiring §10.5.1).
//   dano_recebido = Σdano × Σdano / (defesa + Σdano)   → nunca 100%, auto-escala.
//   def_jogador = hp_max × veilFactor ; veilFactor = (gearDefesaMult − 1) × veilScale (+ passivas).
//   Alvo (gear.mjs): Veil maximizado ≈ veilFactor 0.18 → def ≈ 4× packDps ≈ 80% mit.
//   Sem Veil (early) → veilFactor 0 → def 0 → reproduz o comportamento original.
export const DEFENSE = {
  veilScale: 0.015, // ✅ CALIBRADO (Bloco 2): Veil da raridade do mapa rampa rumo ao teto por era
  veilCap: 0.18,    // ✅ teto de veilFactor → def ≈ 4× packDps ≈ 80% mit ("com tudo": Veil+#11+passivas)
  enemyDefBase: 0,  // defesa de inimigos: early = 0 (hooks: Void Piercing penetra · Weakened Void reduz)
};

// CP-3 (redesign): Convergence SEM reset de mapa. Gate por NÍVEL; +15% ADITIVO
// permanente (dano/HP/XP/Lumens). Reseta o nível da run (xpRun) + o nível do Gear.
// ⏳ VALORES PLACEHOLDER — Willian vai calibrar por teste (15% fixo? variável?).
export const CONVERGENCE = {
  // ✅ "VALORES NO MAPA" (18/jun, decisão Willian): bônus ADITIVO de +20% em dano/HP base e
  // +0,5% em Gold por Convergence. XP fica 0% (vem do Gear). Reseta o nível/Gold da run,
  // NÃO reseta a posição no mapa. Cada Convergence exige um nível maior.
  bonusPerConv: 0.20,        // dano/HP: convMult = 1 + 0.20 × convergences (ADITIVO)
  goldBonusPerConv: 0.005,   // Gold (Lumens): convLumensMult = 1 + 0.005 × convergences (canal próprio)
  gateLevelBase: 40,     // 1ª Convergence: atingir nível 40 (⏳ re-calibrado no harness)
  gateLevelGrowth: 1.3,  // cada Convergence exige um nível maior (×1.3)
  // ✅ HEAD-START (2026-06-17, ref. Gaiadon "Starting Ascension"): ao convergir, o nível da
  // run NÃO volta pro 1 — reseta p/ headstartFrac × nível atingido. Conserta o death-loop
  // das áreas fundas e corta a tediosidade de re-upar do zero. Validado no sim.
  headstartFrac: 0.5,
};

// §7 — Vestiges (renda; gasto em Passivas/Ascension é pós-MVP)
// vestiges_por_kill = ceil(subárea × 0.5) × 3^(índice_do_mapa) · boss ×10
export const VESTIGES = {
  bossMult: 10,
};

// §13 — GEAR · ⏳ PROVISÓRIO (aprovado pelo Willian, 2026-06-11)
// O GDD §13 fixa a ESTRUTURA (6 peças, 5 raridades, 2 eixos: nível+raridade),
// mas marca os VALORES como "a definir" (§16.4) e o DESIGN.md §26-28 não está
// no repo. Tudo abaixo é PLACEHOLDER para recalibrar na malha v2 — não é cânon.
// TODO(canon): rates/caps por raridade, custos. ✅ Afixo PRIMÁRIO de cada peça = canon (§10.5.5, Passo 1).
export const GEAR_RARITIES = ['faded', 'kindled', 'luminous', 'radiant', 'converged'];
export const GEAR_RARITY_LABELS = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
export const GEAR = {
  // 6 peças canônicas (§10.5.5). Cada peça: PRIMÁRIO inerente + SECUNDÁRIOS que a raridade
  // destrava em ordem (secondary[i] ativo quando rarity ≥ i+1). Determinístico.
  // Pool de afixos: dmg · hp · gilded · crit · critDmg · aps · regen · bossDmg · lumens · xp · materiais
  //   (✅ 18/jun: DEFESA removida do jogo — decisão Willian. O Manto agora rola GILDED = chance de
  //    aparecer um mob mais forte/rico, ver bloco GILDED. erosao = future, só reservado.)
  pieces: [
    { key: 'edge',  name: 'The Waning Edge',      slot: 'Arma',     primary: 'dmg',    secondary: ['critDmg', 'bossDmg', 'erosao'] },
    { key: 'vigil', name: 'The Silent Vigil',     slot: 'Elmo',     primary: 'hp',     secondary: ['regen', 'hp'] },
    { key: 'veil',  name: 'Veil of Cinders',      slot: 'Manto',    primary: 'gilded', secondary: ['hp', 'regen', 'erosao'] },
    { key: 'grasp', name: 'Grasp of the Unnamed', slot: 'Manoplas', primary: 'crit',   secondary: ['critDmg', 'aps', 'dmg'] },
    { key: 'reson', name: 'The Last Resonance',   slot: 'Amuleto',  primary: 'aps',    secondary: ['crit', 'regen', 'dmg'] },
    { key: 'band',  name: 'Band of Dusk',         slot: 'Anel',     primary: 'lumens', secondary: ['xp', 'materiais'] },
  ],
  // por raridade (índice 0..4): força do afixo e CUSTO sobem
  rarityMult: [1, 1.5, 2.25, 3.5, 5],
  // ✅ "VALORES NO MAPA" (18/jun): CAP de nível — comum (Faded) 500 · incomum (Kindled) 1400
  // (decisão Willian). M2+ = placeholder.
  levelCap:   [500, 1400, 3000, 4000, 5000],
  // CUSTO por tier. Faded = ×1; Kindled = ×10. M2+ = placeholder seguro.
  costMult:   [1, 10, 100, 1000, 10000],
  // ── MODELO MAP 1 (✅ "VALORES NO MAPA" 18/jun) ──
  // COMUM (Faded): 2 AFIXOS por peça — 1 flat + 1 % (bonusRate). Flats escalados ao novo
  // dano/HP base (dmg 50k → +2.500/nv; hp 100k → +2.000/nv). APS/crit calibrados p/ os ALVOS
  // de fim de Map 1: APS 2,5 e crit rate 30% (com 1 Despertar: +0,5 APS e +5% crit).
  // INCOMUM (Kindled+): destrava 1 afixo MULTIPLIER × (camada multiplicativa — ver gear.js;
  // só ativo em rarity ≥ 1). É o "salto" da raridade, não um "+10%".
  // rates calibrados ao FIM income-limited do Map 1 (gear ~260, custo geométrico padrão do gênero).
  flatPerLevel: { dmg: 2500, hp: 2000, aps: 0.00326, regen: 0.0005, bossDmg: 0, lumens: 0, xp: 0, crit: 0, critDmg: 0, materiais: 0 },
  bonusRate: 0.02,           // afixo % : 1 + nível × bonusRate × rarityMult (2%/nv no Faded)
  multRate:  0.0003,         // afixo MULTIPLIER × (só rarity ≥ 1 = Incomum+): 1 + nível × multRate × rarityMult
  affixPctRate: 0.04,        // FARM (lumens/xp/materiais): % linear/nível (Anel 4% Lumens/nv)
  secondaryExp: 0.30,        // afixo SECUNDÁRIO = primário^0.30 (e flat/camadas × secondaryExp)
  capPerAsc: 0,
  critPerLevel: 0.00075,   // afixo crit (chance) — RAZÃO calibrada p/ crit ACOMPANHAR o APS
                             // (critPerLevel/apsFlat ≈ 0.230 = 0.25/1.1). Re-ancorado ao MAX do Incomum
                             // (gear 1400 no fim): APS 2,5 → Grasp ~25% + 5% do Despertar = 30%.
  critDmgPerLevel: 0.0667,   // afixo critDmg (secundário a 0.30 → ~+2%/nv efetivo)
  gildedPerLevel: 0.00018, // afixo GILDED (chance, afixo do Manto): nível × × rarityMult, teto GILDED.chanceCap.
                             // Manto MAXADO no fim do Map 1 (1400 Kindled) ≈ 5%; cap GLOBAL 30%.
  // ✅ recalibração "em branco": custo EXPONENCIAL por peça (sim) — barato cedo, dobra a cada
  // 10 níveis (costRamp) → cria teto-SUAVE (~280) bem abaixo do cap duro (400). custo(L) =
  // base × costRamp^L × costMult[raridade], clampado a NUMBER_CAP (M2+ recalibra à parte).
  // ✅ "CUSTO CONTROLADO DENTRO DO TIER" (18/jun, decisão Willian, ref. img): o custo NÃO estoura
  // dentro de um mesmo tier — só a TROCA de tier sobe (costMult ×10). Ramp bem gentil (dobra a
  // cada ~90 níveis) → no topo do Comum (500) ~9,5K/nv e no topo do Incomum (1400) ~98M/nv
  // (leg​ível, sem 1e17). Quem limita a progressão é a renda (Lumens) + o cap duro + materiais.
  // ✅ "CUSTO ESTILO GÊNERO" (18/jun, decisão Willian + pesquisa): GEOMÉTRICO padrão (Clicker
  // Heroes/Cookie Clicker): base PEQUENA e ESCALA. Comum (base ×1) começa baratíssimo (~50) e o
  // custo dobra a cada ~10 níveis; o Incomum é a MESMA curva ×10 (base maior). Números grandes
  // (1eX) são esperados (e ok): o gear para income-limited (~260 no Map 1), longe do cap.
  levelCostBase: 800,        // base do Comum (decisão Willian: 800 → early menos instantâneo)
  costRamp: 1.07,            // +7%/nível (≈ dobra a cada ~10): a "escala" do custo
  // (Subir raridade = gate duplo: nível no cap + MATERIAIS do tier — ver CRAFT, Passo 4.)
};

// §13B — CRAFT / MATERIAIS (Camada 4, Passo 4). Material TIERED por raridade:
// materiais[r] paga o salto da raridade r→r+1 (T1=idx0: Faded→Kindled … T4=idx3: Radiant→Converged).
export const CRAFT = {
  dropChance: 0.01,        // 1% por mob comum, do tier do MAPA atual
  nextTierChance: 0.001,   // 0.1% do tier seguinte (tabela com peso — pré-estoca)
  bossChunk: 30,           // boss (Guardião/final): chunk garantido do tier do mapa (acelera, não gate)
  rarityUpMaterial: 40,    // 40 materiais do tier p/ subir 1 PEÇA de raridade (gate duplo c/ nível máx)
  refinoRatio: 12,         // refino 12:1 (só pra cima): 12 de Tn → 1 de Tn+1
};
// tier do material que o mapa dropa (índice 0..3 = T1..T4); Map 5 = T4 (future T5)
export const mapMaterialTier = (map) => Math.min(map - 1, 3);

// ✅ "VALORES NO MAPA" (18/jun, decisão Willian): GILDED — variante de mob "mais forte" que
// substitui a DEFESA (removida). A chance vem do afixo do Manto (gear); teto GLOBAL de 30%
// (no Map 1 chega a ~5% no fim). Um Gilded é mais TANQUE (×hp) e dá mais Gold/XP — NÃO bate
// mais forte (dmgMult 1). Tiers: T1 no Map 1; T2+ liberam em mapas futuros (placeholder).
// Nome canônico "Gilded" (o douramento do Dreaming Wood; eco do boss The Gilded Hollow).
export const GILDED = {
  chanceCap: 0.30, // teto GLOBAL da chance de Gilded (qualquer tier)
  // unlockMap = mapa que libera o tier; o spawn usa o MAIOR tier com unlockMap ≤ mapa atual.
  tiers: [
    { name: 'Gilded',         hpMult: 3.3, lumensMult: 2.5, xpMult: 2.2, dmgMult: 1, unlockMap: 1 },
    { name: 'Gilded Eidolon', hpMult: 6.0, lumensMult: 5.0, xpMult: 4.0, dmgMult: 1, unlockMap: 2 }, // ⏳ placeholder Map 2
  ],
};

// §8 — DIFICULDADES (Camada 7, Passo 5). hpMult aplica a HP E dano dos mobs;
// rewardMult a materiais/Éclats. O SISTEMA abre na A2 (minAscension); o gate dos
// modos é por PODER (você morre se fraco) + bloqueio de OVERFLOW (≤ 1e100).
// Nightmare/Tormento = território break_infinity → VISÍVEIS mas sempre bloqueados (breakInf).
export const DIFFICULTIES = [
  { key: 'normal',    name: 'Normal',    hpMult: 1,    rewardMult: 1,  minAscension: 0, breakInf: false },
  { key: 'dificil',   name: 'Difícil',   hpMult: 1e5,  rewardMult: 3,  minAscension: 2, breakInf: false },
  { key: 'nightmare', name: 'Nightmare', hpMult: 1e15, rewardMult: 10, minAscension: 2, breakInf: true  },
  { key: 'tormento',  name: 'Tormento',  hpMult: 1e30, rewardMult: 30, minAscension: 2, breakInf: true  },
];

// Fate Keepers (A1-A5) — desbloqueio = state.ascensions ≥ N. A4 soma mobs na tela.
export const FATE = {
  a4MobBonus: 6, // +6 mobs no pack quando ascensions ≥ 4 (respeita o teto ~24: sub5 12→18)
};
// Fate Keeper A3 — ECO DO SEEKER (Bloco 3): um eco farma um mapa já limpo em 2º plano.
export const ECO = {
  fraction: 0.35, // ✅ rende 35% do farm daquele mapa (faixa 25-40%). Útil p/ material de refino,
                  // mas SEMPRE < farm ativo (o eco roda um mapa MAIS BAIXO/limpo, não o atual).
  killRate: 15,   // kills/s equivalentes do eco (= teto de APS)
};

// §7 — PASSIVAS · economia ✅ canônica · efeitos individuais ⏳ PROVISÓRIOS.
// 3 árvores × 15 (3 grupos de 5). Moeda = Vestiges. Desbloqueia na 1ª Convergence.
// Custo de desbloqueio (posição ×5) e evolução (×0.3×1.30^(n-1)) são do GDD §7;
// groupMult, maxLevel e os efeitos por nível são PLACEHOLDER (TODO canon §16.3).
export const PASSIVE_TREES = ['eclat', 'vestige', 'fracture'];
export const PASSIVES = {
  unlockLadder: [100, 500, 2500, 12500, 62500], // §7: custo por posição no grupo (×5)
  groupMult: [1, 10, 100],                        // ⏳ multiplicador por grupo (provisório)
  evoFactor: 0.3, evoRamp: 1.30,                  // §7: evolução = desbloqueio × 0.3 × 1.30^(n-1)
  maxLevel: 12,                                   // ✅ CALIBRADO (Bloco 4, esquema Camada 5)
  // ── Esquema dos 45 efeitos (Bloco 4) ──
  groupAddPct: [0.05, 0.10, 0.20],  // % aditivo/nível na primária da árvore, por grupo (g1/g2/g3)
  engineMult: 1.52,                 // 3 MOTORES por árvore (no grupo 3): ×1.52/nível
  // motores (×1.52) por árvore — as 3 mais fortes do grupo 3
  engines: {
    eclat:   ['e_luminal_explosion', 'e_oreinsof_touch', 'e_shattered_light'],
    vestige: ['v_eternal_vestige', 'v_fractured_soul', 'v_collector'],
    fracture:['f_void_collapse', 'f_claimed_domination', 'f_void_endurance'],
  },
  // alavancas FUNCIONAIS (efeito especial, fora do mult da árvore) — art key → tipo
  levers: {
    e_luminal_edge: 'crit', e_void_piercing: 'enemyPen',
    f_fracture_pulse: 'aps', f_void_awareness: 'mobCap', f_weakened_void: 'enemyReduce',
    v_vestige_pull: 'material',
  },
  lever: {
    critPerLevel: 0.04,     // Luminal Edge: +4% crit chance/nível (com Grasp fecha 100% mid)
    apsPerLevel: 0.46,      // Fracture Pulse: fator de APS rumo a ~6.5 maxado (Bloco 6 fecha p/ 15)
    mobPerLevel: 0.5,       // Void Awareness: +0.5 mob/nível (maxado +6 → rumo ao teto 24)
    materialPerLevel: 0.75, // Vestige Pull: ×drop de material (FARM, amortecido por log → ×~2 maxado)
    penPerLevel: 0.04,      // Void Piercing: penetra 4%/nível da def de inimigos (no-op até enemyDef>0)
    reducePerLevel: 0.04,   // Weakened Void: reduz 4%/nível a def de inimigos (no-op até enemyDef>0)
  },
  // nomes na grade de posicionamento APROVADA do GDD §7 (g1 early · g2 mid · g3 late) + chave de arte
  trees: {
    eclat: { label: 'Éclat', sub: 'Combate · dano', cls: 't-eclat', list: [
      ['Radiant Strike','e_radiant_strike'], ['Luminal Edge','e_luminal_edge'], ['Éclat Surge','e_eclat_surge'], ['Refraction','e_refraction'], ['Crit Cascade','e_crit_cascade'],
      ['Shard Burst','e_shard_burst'], ['Resonant Force','e_resonant_force'], ['Momentum','e_momentum'], ['Fracture Weakness','e_fracture_weakness'], ['Execute','e_execute'],
      ['Overkill','e_overkill'], ['Luminal Explosion','e_luminal_explosion'], ["Or Ein Sof's Touch",'e_oreinsof_touch'], ['Shattered Light','e_shattered_light'], ['Void Piercing','e_void_piercing'],
    ] },
    vestige: { label: 'Vestige', sub: 'Economia · ganhos', cls: 't-vest', list: [
      ["Lumen's Blessing",'v_lumens_blessing'], ['Wisdom of Ruins','v_wisdom_ruins'], ['Remnant Harvest','v_remnant_harvest'], ['Scavenger','v_scavenger'], ['Echo of Greed','v_echo_greed'],
      ['Awakened Harvest','v_awakened_harvest'], ['Hoarder','v_hoarder'], ['Dreamwalker','v_dreamwalker'], ['Beast Caller','v_beast_caller'], ['Vestige Pull','v_vestige_pull'],
      ['Void Scavenger','v_void_scavenger'], ['Eternal Vestige','v_eternal_vestige'], ['Fractured Soul','v_fractured_soul'], ['Luminal Cache','v_luminal_cache'], ['The Collector','v_collector'],
    ] },
    fracture: { label: 'Fracture', sub: 'Utilidade · HP', cls: 't-frac', list: [
      ['Fracture Pulse','f_fracture_pulse'], ['Void Haste','f_void_haste'], ['Fracture Sense','f_fracture_sense'], ['Void Awareness','f_void_awareness'], ['Last Light','f_last_light'],
      ['Weakened Void','f_weakened_void'], ['Shard Disruption','f_shard_disruption'], ["Nihel's Shadow",'f_nihels_shadow'], ['Éclat Attunement','f_eclat_attunement'], ["The Fracture's Gift",'f_fractures_gift'],
      ['Void Collapse','f_void_collapse'], ["La Fracture's Echo",'f_fractures_echo'], ['Claimed Domination','f_claimed_domination'], ["Nil's Embrace",'f_nils_embrace'], ['Void Endurance','f_void_endurance'],
    ] },
  },
};

// §8 — ASCENSION (✅ CALIBRADO). Marco por mapa: derrotar o boss final do mapa
// + custo em Vestiges → asc_mult (dano E HP), bolsa de Éclats, rank da Ordre e
// o próximo mapa. A1 libera o sistema de Éclats/Mémoires + o drip. Só Map 1
// existe no MVP, então só A1 é completável; A2-A5 aguardam Maps 2-5.
// ✅ CALIBRADO (Bloco 1, 2026-06-12): asc_mult = ×2 por Ascension (×16 total A1-A4),
// substituindo ×10/×5/×5/×5 (×6250). O salto de fim-de-mapa migrou para o DESPERTAR
// (×5/tier, ×625 total). Orçamento: Ascension 1.2 déc + Despertar 2.8 déc = 4.0 combinados.
export const ASCENSIONS = [
  { id: 1, mapBoss: 1, req: 'Boss do Map 1',  cost: 500_000,   mult: 2, eclats: 100,  rank: 'Illuminate', tier: 'II' },
  { id: 2, mapBoss: 2, req: 'Boss do Map 2',  cost: 1_900_000, mult: 2, eclats: 300,  rank: 'Éclairé',    tier: 'III' },
  { id: 3, mapBoss: 3, req: 'Boss do Map 3',  cost: 4_000_000, mult: 2, eclats: 900,  rank: 'L’Éveillé',  tier: 'IV' },
  { id: 4, mapBoss: 4, req: 'Boss do Map 4',  cost: 8_000_000, mult: 2, eclats: 2700, rank: 'Lumière',    tier: 'V' },
  { id: 5, mapBoss: 5, req: 'Derrotar Nihel', cost: 0,         mult: 1, eclats: 0,    rank: 'Lumière',    tier: 'V' },
];
// §10 — drip de Éclats (liberado pela A1): éclats_por_hora = 0.1 × HP_frontier^0.9
export const ECLATS_DRIP = { coef: 0.1, exp: 0.9 };

// §8 — DESPERTAR / TIER (Passo 7). O tier T1→T5 é DESACOPLADO do nº de ascensions:
// vence o Guardião da Sub 3 do mapa → +1 tier (gate de poder no meio do mapa).
// Map N Sub3 → despertares=N (T_{N+1}); Map 5 já é T5. index despertares = 0..4.
export const SEEKER_RANKS = [
  { name: 'Seeker',     tier: 'I' },
  { name: 'Illuminate', tier: 'II' },
  { name: 'Éclairé',    tier: 'III' },
  { name: 'L’Éveillé',  tier: 'IV' },
  { name: 'Lumière',    tier: 'V' },
];
// ✅ DESPERTAR (recalibração "em branco" 2026-06-17) — pacote de efeitos por tier, igual ao
// "awaken" do sim + economia. Ato do jogador, alcançável ANTES da Wall (Sub 7).
export const DESPERTAR = {
  // ✅ "VALORES NO MAPA" (18/jun, decisão Willian): pacote por tier. Map 1 libera 1 Despertar
  // (na área 7). É a "chave" pré-Wall: liga o crit e multiplica o poder.
  mult: 2,            // ×2 dano E vida por tier (multiplicativo)
  critRateAdd: 0.05,  // +5% crit rate por tier
  critDmgAdd: 4.0,    // +400% crit damage por tier (somado ao gear; base de crit dmg = 0)
  apsAdd: 0.5,        // +0,500 de atk speed por tier (somado ao base/gear, antes do apsCap)
  lumensBonus: 1.0,   // +100% Gold (Lumens) por tier
  xpBonus: 0.40,      // +40% XP por tier
};

// ✅ GATE do Despertar (recalibração "em branco" 2026-06-17, decisão Willian): profundidade
// (Sub 7+) + KILLS (total) + NÍVEL (da run) + MATERIAIS do T1 (consumidos no ato). Substitui
// o gate Prova-Sub3/Nitzotzot/Vestiges (a Prova-Sub3 era inalcançável após o redesign 14/jun).
// Drop do Nitzotz mantido (vestigial por ora; pode virar moeda de outra coisa).
export const NITZOTZ = { dropChance: 0.02, bossChunk: 5 };
// Requisito por TIER ALVO (índice = despertares+1 = 1..4 → T2..T5). [0] não usado (T1 = início).
// subarea = profundidade mín. liberada · kills = total de kills · level = nível da run · t1 = materiais[0].
export const DESPERTAR_REQ = [
  null,
  { subarea: 7, kills: 6000,   level: 480,    t1: 40 },   // → T2 (Map 1): cai na Sub 7 (decisão Willian)
  { subarea: 5, kills: 30_000, level: 5_000,  t1: 120 },  // → T3 (Map 2) ⏳ placeholder
  { subarea: 6, kills: 1e5,    level: 1e5,    t1: 300 },  // → T4 (Map 3) ⏳ placeholder
  { subarea: 7, kills: 3e5,    level: 1e6,    t1: 600 },  // → T5 (Map 4) ⏳ placeholder
];

// §10/§11 — ÉCLATS + MÉMOIRES (✅ motor canônico do GDD). 15 relíquias, 3 por era,
// desbloqueadas pela Ascension da era; moeda = Éclats. Clarté é o motor global.
// Os efeitos `wired:true` já somam aos fatores memoire_*; os `wired:false` são
// exibidos mas ainda contam só via Clarté (efeito específico em CP futuro).
export const MEMOIRE_CLARTE_BASE = 1.07;        // Clarté: dano × 1.07^(Σ níveis)
export const MEMOIRE_UNLOCK = [10, 30, 90, 270, 810]; // §11: desbloqueio por era
export const MEMOIRE_EVO_BASE = 2, MEMOIRE_EVO_RAMP = 3.0; // §11: evolução = 2 × 3.0^n (Camada 6: 1.10 era raso → maximizava instantâneo; 3.0 paceia pela profundidade)
// ⚠️ #14 de la Lumière Entière amplifica o EXPOENTE da Clarté — a alavanca MAIS PERIGOSA
// (multiplica o expoente que monta as ~70 décadas). STUB = 0 até a sessão de Escala (auditoria).
export const MEMOIRE_CLARTE_EXP_PER = 0; // por nível; 0 = wired mas desarmado
// AMORTECE os efeitos INDIVIDUAIS de dano (#1 du Premier Matin + #10 de la Blessure): teto no bônus
// sobre a Clarté, p/ o andar Mémoires somar ~70 déc no TOTAL (Clarté + indiv), não 70 + extras.
// Sem isto, #10 (×1.10/nível) abria ~9 déc no late (gap-opener). Os níveis ainda contam via Clarté.
export const MEMOIRE_INDIV_DMG_CAP = 3; // ×3 máx de bônus individual sobre a Clarté (~0.5 déc)
// Nomes das eras (Épopées) — ⏳ TODO(canon): placeholders L'Aube…Le Choix.
export const MEMOIRE_ERAS = ['L’Aube', 'Le Façonnage', 'La Chute', 'La Blessure', 'Le Choix'];
export const MEMOIRES = [
  { name: 'du Premier Matin',     era: 1, art: 'e1_matin',       label: '+10% dano global',                 type: 'dmg',       per: 0.10, wired: true },
  { name: 'des Rires',            era: 1, art: 'e1_rires',       label: '+10% Lumens',                      type: 'lumens',    per: 0.10, wired: true },
  { name: 'de la Marche',         era: 1, art: 'e1_marche',      label: '+8% XP',                           type: 'xp',        per: 0.08, wired: true },
  { name: 'de la Forme',          era: 2, art: 'e2_forme',       label: '+8% Crit Damage',                  type: 'critDmg',   per: 0.08, wired: true },
  { name: 'du Façonnage',         era: 2, art: 'e2_faconnage',   label: '+5% materiais dropados',           type: 'materiais', per: 0.05, wired: true },
  { name: 'des Profondeurs',      era: 2, art: 'e2_profondeurs', label: '+10% offline',                     type: 'offline',   per: 0.10, wired: true },
  { name: 'de la Chute',          era: 3, art: 'e3_chute',       label: '+12% dano em boss',                type: 'bossDmg',   per: 0.12, wired: true },
  { name: 'des Cendres',          era: 3, art: 'e3_cendres',     label: '+10% Vestiges',                    type: 'vestiges',  per: 0.10, wired: true },
  { name: 'du Dernier Chant',     era: 3, art: 'e3_chant',       label: '+1 ponto de Convergence/run a cada 5 níveis', type: 'convPoint', per: 0, wired: true },
  { name: 'de la Blessure',       era: 4, art: 'e4_blessure',    label: '×1.10 dano (multiplicativo)',      type: 'dmgMult',   per: 0.10, wired: true },
  { name: 'de la Résistance',     era: 4, art: 'e4_resistance',  label: '+12% HP, regen e defesa',          type: 'survival',  per: 0.12, wired: true },
  { name: 'du Temps Brisé',       era: 4, art: 'e4_temps',       label: '+15% a TODOS os Éclats',           type: 'eclatsAll', per: 0.15, wired: true },
  { name: 'du Vide',              era: 5, art: 'e5_vide',        label: '+10% recompensa nas dificuldades', type: 'diffReward',per: 0.10, wired: true },
  { name: 'de la Lumière Entière',era: 5, art: 'e5_lumiere',     label: 'amplifica o expoente da Clarté (stub)', type: 'clarteExp', per: 0, wired: true },
  { name: 'du Choix',             era: 5, art: 'e5_choix',       label: '+5% a todos os efeitos de Mémoires',type: 'allMemoire',per: 0.05, wired: true },
];

// §15 — Offline: simulação real do combate enquanto fora.
// Teto de 30 dias é guarda de engenharia (custo de CPU), não balanceamento.
export const OFFLINE = {
  maxSeconds: 30 * 24 * 3600,
  minSecondsToReport: 60, // abaixo disso não mostra o resumo
};

// Núcleo / infraestrutura
export const TICK_SECONDS = 0.1;     // tick fixo de 100ms
export const MAX_CATCHUP_TICKS = 50; // teto de catch-up por frame (ausências longas: offline §15 no reload)
export const AUTOSAVE_MS = 10_000;
export const SAVE_KEY = 'eclats_save_v1';
export const SCHEMA_VERSION = 8; // v8 (18/jun): recalibração "VALORES NO MAPA" — baseDmg 50k/HP 100k, Conv +20%/+0,5% Gold, Despertar (+400% crit dmg, +0,5 APS, +100% Gold, +40% XP), gear cap 500/1400, Incomum c/ Multiplier, packs 2/área-9=3. Descarta saves v7.
export const NUMBER_CAP = 1e100;     // teto do jogo base — cabe no float nativo
```

## Lógica de jogo — src/game

### `src/game/ascension.js`

```javascript
// Motor de Ascension — GDD §8. Marco por mapa: derrotar o boss final + custo
// em Vestiges → asc_mult (dano E HP), bolsa de Éclats, rank, próximo mapa.
// A1 também libera o drip de Éclats (§10). Persiste sempre. Só Map 1 existe
// no MVP → só A1 é completável; A2-A5 exigem Maps 2-5.

import { ASCENSIONS, ECLATS_DRIP, MAPS, SEEKER_RANKS, DESPERTAR, DESPERTAR_REQ } from '../data/constants.js';
import { hpForLevel, subareaLevelRange, getCurrentMap } from './enemies.js';
import { memoireEclatsAllMult } from './memoires.js';
import { runLevel } from './stats.js';

// Próximo marco de Ascension (ou null se já no fim)
export const nextAscension = (state) =>
  state.ascensions < ASCENSIONS.length ? ASCENSIONS[state.ascensions] : null;

// Multiplicador acumulado de Ascension (aplica a dano E HP — §8)
export function ascMult(state) {
  let m = 1;
  for (let i = 0; i < state.ascensions; i++) m *= ASCENSIONS[i].mult;
  return m;
}

// Requisito do próximo marco: boss final do mapa correspondente derrotado.
// (state.map só é 1 no MVP; bossDefeated é do mapa atual.)
export function reqMet(state) {
  const a = nextAscension(state);
  if (!a) return false;
  return a.mapBoss === state.map && state.bossDefeated[state.bossDefeated.length - 1];
}

export function canAscend(state) {
  const a = nextAscension(state);
  return !!a && reqMet(state) && state.vestiges >= a.cost;
}

export function doAscend(state) {
  if (!canAscend(state)) return false;
  const a = nextAscension(state);
  state.vestiges -= a.cost;
  state.ascensions += 1;
  state.eclats += a.eclats * memoireEclatsAllMult(state); // bolsa da cerimônia (§10) × #12 (todos os Éclats)
  // Avança para o próximo mapa (§8) e reinicia o progresso do mapa. A onda é
  // recriada pelo chamador (resetPack) — evita ciclo de import com combat.js.
  if (a.mapBoss < MAPS.length) {
    state.map = a.mapBoss + 1;
    state.maxMap = Math.max(state.maxMap || 1, state.map); // fronteira avança
    delete state.mapProgress[state.map]; // mapa novo começa zerado
    state.subarea = 1;
    state.unlockedSubarea = 1;
    state.bossDefeated = state.bossDefeated.map(() => false);
    state.killsInSubarea = 0;
  }
  return true;
}

// ───── Despertar / Tier (§8, Passo 7) — DESACOPLADO das ascensions ─────

// Índice de tier = nº de Despertares (0..4). Tier T1..T5 = SEEKER_RANKS[idx].
export const despertarTier = (state) => Math.min(SEEKER_RANKS.length - 1, state.despertares || 0);

// Rank/tier atual da Ordre — lê o tier de DESPERTAR (não as ascensions).
export const currentRank = (state) => SEEKER_RANKS[despertarTier(state)];

// ×poder permanente do Despertar (dano E HP): mult^despertares (×2 por tier).
export const despertarMult = (state) => DESPERTAR.mult ** (state.despertares || 0);
// Efeitos ADITIVOS do Despertar por tier (somam ao gear/base): crit rate, crit damage,
// e bônus de economia (Lumens/XP). Todos = valor × nº de despertares.
export const despertarCritRateAdd = (state) => DESPERTAR.critRateAdd * (state.despertares || 0);
export const despertarCritDmgAdd  = (state) => DESPERTAR.critDmgAdd  * (state.despertares || 0);
// +0,5 de atk speed por tier (somado antes do apsCap) — ✅ 18/jun, decisão Willian.
export const despertarApsAdd      = (state) => DESPERTAR.apsAdd      * (state.despertares || 0);
export const despertarLumensMult  = (state) => 1 + DESPERTAR.lumensBonus * (state.despertares || 0);
export const despertarXpMult      = (state) => 1 + DESPERTAR.xpBonus    * (state.despertares || 0);

// ── Gate do Despertar em 3 camadas (§8 redesign, 13/jun) — ATO DO JOGADOR ──
// Não dispara mais sozinho: vencer o Guardião só destrava a Prova.

// Tier alvo do próximo despertar (despertares+1), ou null se já é Lumière (T5).
export function despertarTarget(state) {
  const t = (state.despertares || 0) + 1;
  return t <= SEEKER_RANKS.length - 1 ? t : null;
}

// Requisito (Oferenda Nitzotzot + Tributo Vestiges) do próximo despertar, ou null.
export function despertarReq(state) {
  const t = despertarTarget(state);
  return t == null ? null : DESPERTAR_REQ[t];
}

// Prova (recalibração "em branco"): ter LIBERADO a profundidade exigida (Sub 7 no Map 1).
export function despertarProvaMet(state) {
  const req = despertarReq(state);
  if (!req) return false;
  return (state.unlockedSubarea || 1) >= req.subarea;
}

// Pode despertar? Profundidade + Kills + Nível + Materiais do T1, todos atendidos.
export function canDespertar(state) {
  const req = despertarReq(state);
  if (!req || !despertarProvaMet(state)) return false;
  return (state.killsTotal || 0) >= req.kills
    && runLevel(state) >= req.level
    && (state.materiais?.[0] || 0) >= req.t1;
}

// Executa o despertar (consome os materiais do T1; kills/nível são limiares, não gastos). Seguro.
export function doDespertar(state) {
  if (!canDespertar(state)) return false;
  const req = despertarReq(state);
  state.materiais[0] -= req.t1;
  state.despertares = despertarTarget(state);
  return true;
}

// §10 — drip de Éclats por segundo (0 antes da A1). Escala com a HP do frontier
// (boss da subárea mais funda desbloqueada do mapa atual).
export function eclatsDripPerSec(state) {
  if (state.ascensions < 1) return 0;
  const map = getCurrentMap(state);
  const frontierLevel = subareaLevelRange(map, state.unlockedSubarea).hi;
  const hpFrontier = hpForLevel(map, frontierLevel);
  return (ECLATS_DRIP.coef * hpFrontier ** ECLATS_DRIP.exp) / 3600;
}
```

### `src/game/combat.js`

```javascript
// Núcleo de combate — modelo de ONDAS, estilo Gaiadon (ADR 0002, revisado).
// - BASE = SINGLE-TARGET: cada ataque atinge 1 mob (o primeiro vivo). Vale a âncora
//   "máx 1 kill por ataque" → kill rate ≤ APS (ancora a economia base).
// - CLEAVE / AoE (atingir vários/todos) é DESBLOQUEÁVEL por passiva/mecânica na
//   progressão (estilo Gaiadon: começa em 1, libera multi-alvo lá na frente). Quando
//   ligado, `cleaveTargets()` retorna >1 e o ataque excede o teto de kills. ⏳ o
//   unlock real (qual passiva, como escala) será wirado num CP de passivas.
// - Mob morto NÃO respawna: fica na cena (apagado) e para de causar dano. Só
//   quando TODA a onda é limpa é que a próxima onda surge. Reset da onda só
//   acontece ao trocar de subárea ou morrer.
// - Dano ao jogador = Σ dano dos mobs VIVOS da onda (contínuo/s).
// - Regen: 1% HP máx/s + 2% HP máx por kill.
// - Morte: recua uma subárea, respawn com HP cheio em 3s, sem perdas.
// - Boss (CP-D): após o kill threshold (oculto), a próxima onda é o Guardião
//   (sozinho); derrotá-lo abre o gate da próxima subárea e vira loop recorrente.

import { COMBAT, NUMBER_CAP, FATE, GILDED } from '../data/constants.js';
import { spawnPack, spawnBoss, spawnMob, getCurrentMap, subareaLevelRange } from './enemies.js';
import { damagePerHit, currentAPS, playerHpMax, critChance, critDamageMult, playerDefesa, postArmorDR, enemyDefesa, runLevel } from './stats.js';
import { awardKill } from './economy.js';
import { eclatsDripPerSec } from './ascension.js';
import { effectiveDifficulty } from './difficulty.js';
import { gearBossDmgMult, gearRegenMult, gearGildedChance } from './gear.js';
import { memoireSurvivalMult, memoireBossDmgMult, memoireEclatsAllMult, memoireDiffRewardMult } from './memoires.js';
import { passiveMobBonus } from './passives.js';

// Regen efetivo (§4): COMBAT.regenPerSec × afixo Regen do gear × #11 de la Résistance
const regenFactor = (state) => gearRegenMult(state) * memoireSurvivalMult(state);

// Tier de Gilded ativo no mapa = o MAIOR tier cujo unlockMap ≤ id do mapa (ou null).
function activeGildedTier(map) {
  let best = null;
  for (const t of GILDED.tiers) if (t.unlockMap <= map.id) best = t;
  return best;
}
// GILDED (18/jun): cada mob NÃO-boss da onda rola a chance do afixo do Manto p/ virar "mais
// forte". Fica mais TANQUE (×hp) e dá mais Gold/XP (economy.js). O XP usa baseHpMax (o HP
// ANTES do inflar) → o ganho de XP segue o xpMult do tier, não o ×hp.
function applyGilded(state, pack, map) {
  const chance = gearGildedChance(state);
  const tier = activeGildedTier(map);
  if (chance <= 0 || !tier) return;
  for (const m of pack) {
    if (m.isBoss || m.gilded) continue;
    if (Math.random() < chance) {
      m.gilded = tier.name;
      m.baseHpMax = m.hpMax;                 // XP usa o HP base (não o inflado)
      m.hpMax *= tier.hpMult; m.hp = m.hpMax;
      m.dmg *= tier.dmgMult;
      m.lumensMult = tier.lumensMult;
      m.xpMult = tier.xpMult;
    }
  }
}

// Monta a onda da subárea. Se já bateu o threshold, o Guardião entra JUNTO,
// substituindo 1 mob do pack (§4); na Sub 1 (pack de 1) ele vem sozinho.
function makeWave(state) {
  const map = getCurrentMap(state);
  // Contexto do player (poder atual): inimigos derivam disso → sempre ~no seu nível/poder.
  const ctx = { dmg: damagePerHit(state), hp: playerHpMax(state), level: runLevel(state) };
  const pack = spawnPack(map, state.subarea, ctx);
  // +cap de mobs: Fate Keeper A4 + passiva Void Awareness (rumo ao teto ~24)
  const extra = (state.ascensions >= 4 ? FATE.a4MobBonus : 0) + passiveMobBonus(state);
  for (let i = 0; i < extra; i++) pack.push(spawnMob(map, state.subarea, ctx));
  // Redesign 14/jun: SEM Guardião nas sub-áreas 1..N-1; só a ÚLTIMA tem boss
  // (o boss final do mapa). O threshold de kills ainda é o muro que invoca o boss.
  if (state.subarea === map.subareaCount && state.killsInSubarea >= map.bossKillThreshold) {
    pack[0] = spawnBoss(map, state.subarea, ctx);
  }
  // Dificuldade (§8): ×HP e ×dano nos mobs da onda
  const d = effectiveDifficulty(state);
  if (d.hpMult !== 1) {
    for (const m of pack) { m.hpMax *= d.hpMult; m.hp = m.hpMax; m.dmg *= d.hpMult; }
  }
  applyGilded(state, pack, map); // GILDED por último (baseHpMax já reflete a dificuldade)
  return pack;
}

// Reinicia a onda (boot, troca de subárea, respawn) — zera a contagem de ondas.
export function resetPack(state) {
  state.wave = 1;
  state.enemies = makeWave(state);
}

// Próxima onda (após limpar a atual) — incrementa o contador.
function nextWave(state) {
  state.wave += 1;
  state.enemies = makeWave(state);
}

export function bossActive(state) {
  return state.enemies.some((m) => m.isBoss && m.hp > 0);
}

// Redesign 14/jun: a progressão entre sub-áreas é GATE POR NÍVEL (sem Guardião).
// ✅ 17/jun (estilo Gaiadon): se o mapa define unlockLevels (bandas largas, DESACOPLADAS
// da faixa de nível dos mobs), usa-as; senão cai no início da faixa geométrica (Maps 2-5).
// Sub-área 1 sempre aberta.
export function subareaUnlockLevel(map, n) {
  if (n <= 1) return 0;
  if (map.unlockLevels && map.unlockLevels[n - 1] != null) return map.unlockLevels[n - 1];
  return Math.max(1, Math.round(subareaLevelRange(map, n).lo));
}

// Avança o high-water de sub-áreas liberadas conforme o nível sobe. unlockedSubarea
// é persistente (não recua na Convergence, mesmo que runLevel zere).
function updateUnlockByLevel(state) {
  const map = getCurrentMap(state);
  const lvl = runLevel(state);
  let u = state.unlockedSubarea || 1;
  while (u < map.subareaCount && lvl >= subareaUnlockLevel(map, u + 1)) u += 1;
  if (u !== state.unlockedSubarea) state.unlockedSubarea = u;
}

export function combatTick(state, dt) {
  const player = state.player;
  const hpMax = playerHpMax(state);

  // --- Morto: só conta o timer de respawn ---
  if (player.dead) {
    player.respawnTimer -= dt;
    if (player.respawnTimer <= 0) {
      player.dead = false;
      player.hp = hpMax; // HP cheio, sem perdas
      player.attackTimer = 0;
      resetPack(state);
    }
    return;
  }

  // --- Ataques do jogador (só com alvo VIVO; senão pausa — não desperdiça golpes
  //     nem acumula timer durante o beat de troca de onda). ---
  const hasLive = state.enemies.some((m) => m.hp > 0);
  if (hasLive) {
    const interval = 1 / currentAPS(state);
    player.attackTimer += dt;
    while (player.attackTimer >= interval) {
      player.attackTimer -= interval;
      playerAttack(state, hpMax);
    }
  }

  // --- Onda limpa (todos mortos) → próxima onda APÓS um beat. Sem o beat, o novo
  //     mob substituía na hora o que ainda estava morrendo (projétil no ar) → parecia
  //     que "o mob virou outro". O beat deixa a morte animar e a posição esvaziar. ---
  if (state.enemies.length > 0 && !hasLive) {
    state.waveClearT = (state.waveClearT || 0) + dt;
    if (state.waveClearT >= COMBAT.waveClearDelay) {
      state.waveClearT = 0;
      nextWave(state);
    }
  } else {
    state.waveClearT = 0;
  }

  // --- Dano só dos mobs VIVOS (mortos ficam apagados até a onda virar) ---
  // Mitigação por razão/armadura (§4): dano_recebido = Σdano² / (defesa + Σdano).
  // Sem defesa (early, def=0) → Σdano²/Σdano = Σdano = comportamento original.
  // Camada % à parte (postArmorDR) aplicada DEPOIS da armadura.
  const packDps = state.enemies.reduce((sum, m) => sum + (m.hp > 0 ? m.dmg : 0), 0);
  const def = playerDefesa(state);
  const armored = packDps > 0 ? (packDps * packDps) / (def + packDps) : 0;
  player.hp -= armored * postArmorDR(state) * dt;

  // --- Regen contínuo de 1% HP máx/s (× afixo Regen do gear × #11 Résistance) ---
  player.hp = Math.min(hpMax, player.hp + hpMax * COMBAT.regenPerSec * regenFactor(state) * dt);

  // --- Drip de Éclats (§10): renda passiva após a A1, escala com o frontier ---
  // §8 dificuldade ×rewardMult · #13 du Vide amplia a recompensa · #12 du Temps Brisé = todos os Éclats
  const drip = eclatsDripPerSec(state)
    * effectiveDifficulty(state).rewardMult * memoireDiffRewardMult(state)
    * memoireEclatsAllMult(state);
  if (drip > 0) state.eclats = Math.min(NUMBER_CAP, state.eclats + drip * dt);

  // Gate por nível: libera sub-áreas conforme o nível sobe (sem Guardião)
  updateUnlockByLevel(state);

  // --- Morte: respawna na MESMA área (sem recuar). O jogador volta de área só
  //     se quiser, pelas setas de navegação. ---
  if (player.hp <= 0) {
    player.dead = true;
    player.respawnTimer = COMBAT.deathRespawnSeconds;
    state.killsInSubarea = 0; // boss some; o muro exige farmar de novo
    state.wave = 1;
    state.enemies = [];
  }
}

// Quantos mobs um ataque atinge. BASE = 1 (single-target — âncora "1 kill/ataque").
// O CLEAVE/AoE é DESBLOQUEÁVEL (passiva/mecânica); quando ligado, retorna >1 e o
// ataque limpa vários alvos. ⏳ TODO(CP passivas): ler o unlock real (qual passiva /
// como escala — ex.: +1 alvo por nível, ou "todos"). Hoje sempre 1 = base correto.
function cleaveTargets() {
  return 1;
}

// Um ataque: atinge os primeiros `cleaveTargets()` mobs vivos da onda (frente → trás).
// BASE = 1 (single-target). Cada mob atingido morre quando seu HP zera. SEM respawn —
// os mortos ficam na cena (apagados) até a onda inteira ser limpa.
function playerAttack(state, hpMax) {
  // Crit ⏳ provisório (GDD §16.6): rola UMA vez por ataque; vale pro golpe inteiro
  // (se/quando o cleave atingir vários, todos herdam o mesmo crit).
  const isCrit = Math.random() < critChance(state);
  const base = damagePerHit(state) * (isCrit ? critDamageMult(state) : 1);

  let remaining = cleaveTargets(); // BASE 1; >1 quando o AoE estiver desbloqueado
  for (const target of state.enemies) {
    if (remaining <= 0) break;
    if (target.hp <= 0) continue; // pula mortos (mantém a ordem frente → trás)
    remaining -= 1;
    // Dano em boss (§13/§11): afixo bossDmg do gear × #7 de la Chute — só no boss
    const bossMult = target.isBoss ? gearBossDmgMult(state) * memoireBossDmgMult(state) : 1;
    const raw = base * bossMult;
    // Defesa de INIMIGOS (§4, razão virada): hit = raw² / (def_inimigo + raw).
    // Early (def_inimigo=0) → hit = raw = comportamento original.
    const edef = enemyDefesa(state, target);
    const hit = edef > 0 ? (raw * raw) / (edef + raw) : raw;
    target.hp -= hit;
    // Fila dos números flutuantes (a UI consome; teto evita acúmulo em background)
    if (state.fx.length < 50) state.fx.push({ mobId: target.id, amount: hit, isCrit });
    if (target.hp <= 0) {
      awardKill(state, target);
      // Regen on-kill: 2% do HP máx por kill (× afixo Regen × #11 Résistance)
      state.player.hp = Math.min(hpMax, state.player.hp + hpMax * COMBAT.regenOnKill * regenFactor(state));
      if (target.isBoss) onBossKill(state);
      else state.killsInSubarea += 1;
    }
  }
}

// Derrota do boss: abre o gate da próxima subárea e reinicia o ciclo
// (loop recorrente de recompensa — o boss volta a cada threshold).
function onBossKill(state) {
  const map = getCurrentMap(state);
  state.bossDefeated[state.subarea - 1] = true;
  state.unlockedSubarea = Math.max(state.unlockedSubarea, Math.min(map.subareaCount, state.subarea + 1));
  state.killsInSubarea = 0;
  // §8 redesign: vencer o Guardião da Sub 3 só DESTRAVA a Prova (bossDefeated[2]);
  // o Despertar agora é ato do jogador na tela (doDespertar, gasta Nitzotzot+Vestiges).
}

// Viagem entre mapas já alcançados (id ≤ maxMap). Guarda o progresso do mapa
// atual em mapProgress e restaura o do destino; mapas anteriores à fronteira
// já foram concluídos → entram com tudo liberado por padrão.
export function travelToMap(state, id) {
  const dest = Math.max(1, Math.min(state.maxMap, Math.round(id)));
  if (dest === state.map) return false;
  state.mapProgress[state.map] = {
    subarea: state.subarea,
    unlockedSubarea: state.unlockedSubarea,
    bossDefeated: [...state.bossDefeated],
    killsInSubarea: state.killsInSubarea,
  };
  state.map = dest;
  const map = getCurrentMap(state);
  const saved = state.mapProgress[dest];
  const cleared = dest < state.maxMap; // mapa já concluído (a fronteira passou dele)
  state.unlockedSubarea = saved ? saved.unlockedSubarea : (cleared ? map.subareaCount : 1);
  // CP-2: bossDefeated com o comprimento do mapa destino (normaliza saves de 5 → 8)
  state.bossDefeated = Array.from({ length: map.subareaCount },
    (_, i) => (saved ? !!(saved.bossDefeated && saved.bossDefeated[i]) : cleared));
  state.subarea = Math.min(saved ? saved.subarea : 1, state.unlockedSubarea);
  state.killsInSubarea = saved ? saved.killsInSubarea : 0;
  state.bestSubareaRun = Math.max(state.bestSubareaRun, state.subarea);
  if (!state.player.dead) resetPack(state);
  return true;
}

// Navegação entre subáreas, respeitando o gate (boss abre a próxima)
export function changeSubarea(state, delta) {
  enterSubarea(state, state.subarea + delta);
}

// Entra direto numa subárea n (1-indexada), respeitando o gate da maior
// desbloqueada. Usado pela tela de Mapa (U-3) e pelas setas do Combate.
export function enterSubarea(state, n) {
  const next = Math.min(state.unlockedSubarea, Math.max(1, n));
  if (next === state.subarea) return;
  state.subarea = next;
  state.killsInSubarea = 0; // threshold conta kills na subárea atual
  state.bestSubareaRun = Math.max(state.bestSubareaRun, next); // pontos da run (§6)
  if (!state.player.dead) resetPack(state);
}
```

### `src/game/convergence.js`

```javascript
// Convergence — redesign (calibrado Map 1, 14/jun). SEM reset de mapa. Gate por NÍVEL;
// dá +15% ADITIVO permanente (convMult vive em stats.js: dano/HP/XP/Lumens). É um
// ACELERADOR (~×2 ao fim do Map 1), não um motor. O botão RESETA só o nível da RUN
// (xpRun→0); o GEAR é MANTIDO (sem strand). NÃO reseta: mapa/posição, Lumens, Vestiges.

import { CONVERGENCE, LEVEL } from '../data/constants.js';
import { runLevel, playerHpMax } from './stats.js';
import { resetPack } from './combat.js';

// Nível-alvo da próxima Convergence (sobe a cada converge). 1ª = nível 40.
export function convGateLevel(convergences) {
  return Math.round(CONVERGENCE.gateLevelBase * CONVERGENCE.gateLevelGrowth ** convergences);
}

export function canConverge(state) {
  return runLevel(state) >= convGateLevel(state.convergences);
}

// Progresso rumo ao gate (0..1) — pra UI.
export function convergeProgress(state) {
  return Math.min(1, runLevel(state) / convGateLevel(state.convergences));
}

export function doConverge(state) {
  if (!canConverge(state)) return false;

  // HEAD-START (2026-06-17): o nível da run NÃO volta pro 1 — reseta p/ headstartFrac ×
  // nível atingido. Convertemos esse nível-alvo de volta em xpRun (inverso da curva).
  const startLevel = Math.max(1, Math.floor(CONVERGENCE.headstartFrac * runLevel(state)));
  state.convergences += 1;
  // Reset: nível da run (via xpRun) com head-start + os Lumens. O GEAR é MANTIDO (sem strand)
  // — Convergence = acelerador ×: +15% permanente sem perder o gear.
  state.xpRun = LEVEL.curveDiv * startLevel ** (1 / LEVEL.curveExp);
  state.lumens = 0;
  // NÃO reseta: gear (nível+raridade), map/subarea/unlockedSubarea/bossDefeated, Vestiges.

  // Renasce cheio na posição atual; reinicia a onda (você está mais fraco agora).
  state.player.dead = false;
  state.player.respawnTimer = 0;
  state.player.attackTimer = 0;
  state.player.hp = playerHpMax(state);
  resetPack(state);
  return true;
}
```

### `src/game/difficulty.js`

```javascript
// Dificuldades — §8 (Camada 7, Passo 5). Re-roda mapas com HP/dano ×mult e
// recompensa (materiais/Éclats) ×rewardMult. Sistema abre na A2; gate dos modos
// = PODER (você morre se fraco) + bloqueio de OVERFLOW (≤ 1e100). Nightmare/Tormento
// = break_infinity → visíveis mas sempre bloqueados (não implementa a lib agora).

import { DIFFICULTIES, NUMBER_CAP, COMBAT } from '../data/constants.js';
import { getCurrentMap, hpForLevel, subareaLevelRange } from './enemies.js';

export const currentDifficulty = (state) => DIFFICULTIES[state.difficulty] || DIFFICULTIES[0];

// HP do boss mais fundo do mapa atual (proxy de overflow) × hpMult ≤ 1e100 ?
function noOverflow(state, hpMult) {
  const map = getCurrentMap(state);
  const deepBossHp = hpForLevel(map, subareaLevelRange(map, map.subareaCount).hi) * COMBAT.bossHpMult;
  return deepBossHp * hpMult <= NUMBER_CAP;
}

// Uma dificuldade está DISPONÍVEL p/ o conteúdo atual?
export function difficultyAvailable(state, idx) {
  const d = DIFFICULTIES[idx];
  if (!d) return false;
  if (idx === 0) return true;                         // Normal sempre
  if (d.breakInf) return false;                       // Nightmare/Tormento: visível mas bloqueado (break_infinity)
  if (state.ascensions < d.minAscension) return false; // sistema abre na A2
  return noOverflow(state, d.hpMult);                 // não pode estourar 1e100
}

// Dificuldade EFETIVA (clamp p/ Normal se a selecionada não está disponível no conteúdo atual)
export function effectiveDifficulty(state) {
  return difficultyAvailable(state, state.difficulty) ? currentDifficulty(state) : DIFFICULTIES[0];
}

// Tenta selecionar uma dificuldade (respeita disponibilidade). Retorna true se aplicou.
export function setDifficulty(state, idx) {
  if (!difficultyAvailable(state, idx)) return false;
  state.difficulty = idx;
  return true;
}
```

### `src/game/economy.js`

```javascript
// Economia de kill — GDD §6 e §12.
// lumens_por_kill = mob_hp × 0.10 × frt_total (boss ×5 — CP-D)
// xp_por_kill     = mob_hp × 0.08 × wis_total

import { ECONOMY, LEVEL, NUMBER_CAP, BOSS_LUMEN_MULT, VESTIGES, CRAFT, NITZOTZ, ENEMY, mapMaterialTier } from '../data/constants.js';
import { convLumensMult, runLevel, damagePerHit } from './stats.js';
import { gearLumensMult, gearXpMult, gearMaterialDropMult } from './gear.js';
import { passiveEcoMult, passiveMaterialMult } from './passives.js';
import { memoireLumensMult, memoireXpMult, memoireVestigeMult, memoireMateriaisMult, memoireDiffRewardMult } from './memoires.js';
import { effectiveDifficulty } from './difficulty.js';
import { getCurrentMap, subareaLevelRange, hpForLevel, areaReward } from './enemies.js';
import { despertarLumensMult, despertarXpMult } from './ascension.js';

// Multiplicador de YIELD de material (§13B): DIFICULDADE ×rewardMult (×3/×10/×30) ×
//   #13 du Vide (recompensa de dificuldade) × #5 du Façonnage (+% materiais, aditivo, sem motor ×).
// ⛓️ hooks reservados (= 1): Vestige Pull (passiva) · afixo Materiais do gear (⏳ amortecer a curva).
function materialYieldMult(state) {
  return effectiveDifficulty(state).rewardMult * memoireDiffRewardMult(state)
    * memoireMateriaisMult(state) * gearMaterialDropMult(state)  // afixo Materiais (amortecido, Bloco 3)
    * passiveMaterialMult(state); // Vestige Pull (passiva, amortecido, Bloco 4)
}

// §13B: drop de materiais no kill. 1% do tier do MAPA + 0.1% do tier seguinte; boss = chunk garantido.
function awardMaterials(state, mob) {
  const tier = mapMaterialTier(state.map);
  const y = materialYieldMult(state);
  if (Math.random() < CRAFT.dropChance) state.materiais[tier] += y;
  if (tier < 3 && Math.random() < CRAFT.nextTierChance) state.materiais[tier + 1] += y;
  if (mob.isBoss) state.materiais[tier] += CRAFT.bossChunk * y; // Guardião/final: chunk garantido
}

// §8 redesign: drop de Nitzotzot (Oferenda do Despertar). Só nas Sub-áreas 3+
// (a região do Guardião); chunk garantido em boss. Acumula no mapa do tier.
function awardNitzotz(state, mob) {
  if (state.subarea < 3) return;
  if (mob.isBoss) state.nitzotzot += NITZOTZ.bossChunk;
  else if (Math.random() < NITZOTZ.dropChance) state.nitzotzot += 1;
}

// §7: vestiges_por_kill = ceil(subárea × 0.5) × 3^(índice_do_mapa)
// Map 1 (índice 0): [1, 1, 2, 2, 3] nas Subs 1-5
export function vestigesPerKill(state) {
  return Math.ceil(state.subarea * 0.5) * 3 ** (state.map - 1);
}

// Estimativa de ganho POR MOB numa sub-área (para o painel do mapa). Usa o mob
// de nível "médio" da área (média geométrica do range) e os multiplicadores
// atuais do jogador (conv, gear, passivas, mémoires), espelhando awardKill.
// Materiais é drop-based: devolvemos a chance e o yield por drop.
export function perKillEstimate(state, subarea) {
  const map = getCurrentMap(state);
  // recompensa DESACOPLADA do HP: base fixa × areaReward × multiplicadores.
  const rew = areaReward(subarea);
  const eco = passiveEcoMult(state);
  const cm = convLumensMult(state); // Gold: canal próprio da Convergence (+0,5%/conv)
  const lumens = ECONOMY.lumBase * rew * cm * gearLumensMult(state) * eco * memoireLumensMult(state);
  const vestiges = Math.ceil(subarea * 0.5) * 3 ** (map.id - 1) * memoireVestigeMult(state);
  const tier = mapMaterialTier(state.map);
  const matPerDrop = materialYieldMult(state);
  return { lumens, vestiges, tier, matChance: CRAFT.dropChance, matPerDrop };
}

export function awardKill(state, mob) {
  // §12: o ×5 de boss só se aplica a Lumens; o XP já escala pelo HP ×15
  const bossMult = mob.isBoss ? BOSS_LUMEN_MULT : 1;
  const eco = passiveEcoMult(state); // §7 Vestige tree (Lumens/XP) — provisório
  const cm = convLumensMult(state);  // 18/jun: Gold = canal próprio da Convergence (+0,5%/conv); XP não leva conv
  // Lumens base = HP×goldRatio + PISO fixo + nível×goldPerLevel. O piso (✅ Map 1) garante
  // que os primeiros níveis do gear sejam compráveis cedo (mob de HP baixo rende pouco).
  // recompensa: LUMENS = base fixa × areaReward (profundidade) × multiplicadores (p/ gear).
  // XP = HP do mob × xpRatio (acompanha SEU poder via mobHp = dano×3, sobe LISO com o nível;
  // SEM areaReward/convMult em cima — esses amplificadores causavam a bola-de-neve).
  const rew = mob.rewardMult || 1;
  // GILDED (18/jun): mob mais forte dá mais Gold (lumensMult) e mais XP (xpMult). O XP usa
  // baseHpMax (o HP ANTES de inflar) → o ganho segue o xpMult do tier, não o ×hp tanque.
  const lumBase = ECONOMY.lumBase * rew * (mob.lumensMult || 1);
  state.lumens = Math.min(NUMBER_CAP, state.lumens + lumBase * cm * bossMult * gearLumensMult(state) * eco * memoireLumensMult(state) * despertarLumensMult(state));
  const xpHp = mob.baseHpMax ?? mob.hpMax;
  const xp = xpHp * (mob.xpMult || 1) * ECONOMY.xpRatio * gearXpMult(state) * memoireXpMult(state) * despertarXpMult(state);
  state.xpTotal = Math.min(NUMBER_CAP, state.xpTotal + xp); // vida (level display)
  state.xpRun = Math.min(NUMBER_CAP, state.xpRun + xp);     // run (parede de Convergence)
  // §7: Vestiges nunca resetam; boss paga ×10
  const vest = vestigesPerKill(state) * (mob.isBoss ? VESTIGES.bossMult : 1) * memoireVestigeMult(state);
  state.vestiges = Math.min(NUMBER_CAP, state.vestiges + vest);
  awardMaterials(state, mob); // §13B (Passo 4)
  awardNitzotz(state, mob);   // §8 redesign (Oferenda do Despertar)
  state.killsTotal += 1;
}
```

### `src/game/enemies.js`

```javascript
// Inimigos — ✅ RELATIVOS AO PLAYER (recalibração 2026-06-17, decisão Willian:
// "números grandes, mobs te seguem"). HP/dano/nível derivam do PODER ATUAL do player,
// passado como `ctx = { dmg, hp, level }` pelo combate ao gerar a onda. Coerente por
// construção e imune ao reset da Convergence (mobs reescalam junto). Ver ENEMY em constants.
// As funções da malha geométrica (subareaLevelRange/hpForLevel) ficam por compat (unlock + UI).

import { MAPS, ENEMY, COMBAT, LEVEL } from '../data/constants.js';

let nextEnemyId = 1;

// ── Fatores por sub-área (1-indexada → índice n−1), com clamp seguro ──
const aIdx = (sub, n) => Math.max(0, Math.min((sub || 1) - 1, n - 1));
const areaHp  = (sub) => ENEMY.areaHp[aIdx(sub, ENEMY.areaHp.length)];
const areaDmg = (sub) => ENEMY.areaDmg[aIdx(sub, ENEMY.areaDmg.length)];
export const areaReward = (sub) => ENEMY.areaReward[aIdx(sub, ENEMY.areaReward.length)];

// ── Escala pelo BASELINE DO NÍVEL (não pelo dano/HP já multiplicado) ──
// HP/dano do mob seguem só o que o NÍVEL dá (base + nível×perLevel). Assim os
// MULTIPLICADORES do player (gear/convergence/despertar) EXCEDEM o baseline → você mata
// em MENOS golpes e sobrevive MAIS conforme investe. Poder importa; e o mob fica no seu nível.
const baselineDmg = (lvl) => COMBAT.baseDmg + (lvl || 1) * LEVEL.dmgPerLevel;
const baselineHp  = (lvl) => COMBAT.playerBaseHp + (lvl || 1) * LEVEL.hpPerLevel;

const mobLevelOf = (ctx, sub) => Math.max(1, Math.round((ctx.level || 1) * (1 + ENEMY.levelPerArea * ((sub || 1) - 1))));
// HP = baseline do nível → seus multiplicadores (gear/conv/despertar) o EXCEDEM → mata mais rápido.
const mobHpOf    = (ctx, sub) => Math.max(1, baselineDmg(ctx.level) * ENEMY.hitsToKill * areaHp(sub));
// DANO = % do seu HP REAL (atual) → perigo persiste (mobs sempre podem matar). A defesa real é
// matar rápido (ofensa). Onda inteira = HP_real × dmgFrac × areaDmg; por mob = /pack.
const packBaseOf = (map, sub) => Math.max(1, (map.packSizes[(sub || 1) - 1] || 1));
const mobDmgOf   = (ctx, map, sub) => Math.max(0, (ctx.hp || 1) * ENEMY.dmgFrac * areaDmg(sub) / packBaseOf(map, sub));

// ── Malha geométrica (LEGADO): bounds de level por sub-área — usada só pelo gate de
//    unlock por nível e por estimativas de UI. Não dita mais HP/dano dos mobs. ──
function subareaRatio(map) {
  return (map.lvlHi / map.lvlLo) ** (1 / map.subareaCount);
}
export function subareaLevelRange(map, subarea) {
  const r = subareaRatio(map);
  return { lo: map.lvlLo * r ** (subarea - 1), hi: map.lvlLo * r ** subarea };
}
function interp(map, level, lo, hi) {
  const t = (Math.log(level) - Math.log(map.lvlLo)) / (Math.log(map.lvlHi) - Math.log(map.lvlLo));
  return lo * (hi / lo) ** t;
}
export function hpForLevel(map, level) { return interp(map, level, map.hpLo, map.hpHi); }
export function dmgForLevel(map, level) { return interp(map, level, map.dmgLo, map.dmgHi); }

// ── Spawns (player-relativo): recebem ctx = { dmg, hp, level } ──
const CTX0 = { dmg: 1, hp: 1, level: 1 };

export function spawnMob(map, subarea, ctx = CTX0) {
  const id = nextEnemyId++;
  const k = id % map.enemyNames.length; // trio do mapa
  const hpMax = mobHpOf(ctx, subarea);
  return {
    id,
    name: map.enemyNames[k],
    art: map.enemyArts[k],
    frame: 'frames.enemy_universal',
    level: mobLevelOf(ctx, subarea),
    hpMax,
    hp: hpMax,
    dmg: mobDmgOf(ctx, map, subarea),  // dano/s ao jogador (onda inteira ~ HP × dmgFrac × areaDmg)
    rewardMult: areaReward(subarea),   // XP/Lumens crescem com a profundidade (economia)
  };
}

// Boss da sub-área: mob × bossHpMult (HP) e × bossDmgMult (dano). Só a ÚLTIMA = boss final.
export function spawnBoss(map, subarea, ctx = CTX0) {
  const isFinal = subarea === map.subareaCount;
  const hpMax = mobHpOf(ctx, subarea) * ENEMY.bossHpMult;
  return {
    id: nextEnemyId++,
    name: isFinal ? map.bossName : `Guardian — Sub-area ${subarea}`,
    art: isFinal ? map.bossArt : map.guardianArt,
    frame: isFinal ? `frames.boss_m${map.id}` : 'frames.enemy_universal',
    isBoss: true,
    isFinalBoss: isFinal,
    level: mobLevelOf(ctx, subarea),
    hpMax,
    hp: hpMax,
    dmg: mobDmgOf(ctx, map, subarea) * ENEMY.bossDmgMult,  // boss ≈ bossDmgMult mobs
    rewardMult: areaReward(subarea),
  };
}

// Pack completo da sub-área atual (tamanhos do GDD §4)
export function spawnPack(map, subarea, ctx = CTX0) {
  const size = map.packSizes[subarea - 1];
  return Array.from({ length: size }, () => spawnMob(map, subarea, ctx));
}

// Mapa atual conforme state.map (1-indexado). Aceita state ou nada (default Map 1).
export function getCurrentMap(state) {
  const id = state && state.map ? state.map : 1;
  return MAPS[id - 1] || MAPS[0];
}
```

### `src/game/fatekeepers.js`

```javascript
// Fate Keepers (A1-A5) — §8 (Passo 5). Desbloqueiam por Ascension:
//   A1 auto-Gold Stats + auto-Convergir · A2 auto-progressão + abre dificuldades ·
//   A3 motor de Éclats (drip + offline 24h) · A4 +cap de mobs · A5 Transcendência (stub).
// As automações são TOGGLES (default off): o Fate Keeper LIBERA, o jogador LIGA.

import { buyStatMax } from './stats.js';
import { canConverge, doConverge } from './convergence.js';
import { enterSubarea } from './combat.js';
import { hpForLevel } from './enemies.js';
import { MAPS, ECO, CRAFT, ECONOMY, VESTIGES, NUMBER_CAP, mapMaterialTier } from '../data/constants.js';

// Fate Keeper N desbloqueado?
export const fateKeeperUnlocked = (state, n) => state.ascensions >= n;

// A3 — Eco do Seeker: farma `ecoMap` (já limpo) em 2º plano a ECO.fraction do rendimento daquele mapa.
// Rende materiais (do tier do eco map) + Lumens + Vestiges, online E offline (roda no automationTick).
export function ecoTick(state, dt) {
  if (state.ascensions < 3 || !state.ecoMap) return;
  const ecoMap = MAPS[state.ecoMap - 1];
  if (!ecoMap) return;
  const kills = ECO.killRate * dt;          // kills equivalentes no período
  const f = ECO.fraction;
  const frontierHp = hpForLevel(ecoMap, ecoMap.lvlHi); // mob mais fundo do eco map
  // Materiais do tier do eco map (valor esperado = chance × kills), a fração
  state.materiais[mapMaterialTier(state.ecoMap)] += f * CRAFT.dropChance * kills;
  // Lumens e Vestiges a fração (sempre < farm ativo, pois o eco map é mais baixo)
  state.lumens = Math.min(NUMBER_CAP, state.lumens + f * frontierHp * ECONOMY.goldRatio * kills);
  const vestPerKill = Math.ceil(ecoMap.subareaCount * 0.5) * 3 ** (state.ecoMap - 1);
  state.vestiges = Math.min(NUMBER_CAP, state.vestiges + f * vestPerKill * kills);
}

// Tick de automação (roda no loop online e na simulação offline)
export function automationTick(state, dt = 0) {
  // A1 — auto-Gold Stats + auto-Convergir
  if (state.ascensions >= 1) {
    if (state.auto.stats) for (const key of Object.keys(state.stats)) buyStatMax(state, key);
    if (state.auto.converge && canConverge(state)) doConverge(state);
  }
  // A2 — auto-progressão (vai p/ a sub-área mais funda desbloqueada)
  if (state.ascensions >= 2 && state.auto.progress) {
    if (state.subarea < state.unlockedSubarea) enterSubarea(state, state.unlockedSubarea);
  }
  // A3 — Eco do Seeker (2º plano). A4 (+cap de mobs) é aplicado no spawn (combat.js); A5 = flag.
  ecoTick(state, dt);
}
```

### `src/game/gear.js`

```javascript
// Motor de Gear — GDD §13 / §10.5.5 (Passo 3 do wiring).
// 6 peças fixas, cada uma com nível (Lumens) e raridade. Cada peça tem 1 afixo
// PRIMÁRIO inerente + SECUNDÁRIOS que a raridade destrava em ordem (determinístico).
// Modelo de valor calibrado (Camada 3): linear × motor exponencial (Luminous+);
// secundário = primário^0.30 (30% das décadas). Cap de nível da raridade topo sobe
// +capPerAsc por Ascension (motor sem-teto). Persiste sempre (não reseta).

import { GEAR, GEAR_RARITIES, CRAFT, NUMBER_CAP, MAPS, GILDED } from '../data/constants.js';

const maxRarity = GEAR_RARITIES.length - 1;

// Cap de raridade do MAPA atual (✅ 18/jun: Map 1 = Incomum/Kindled, índice 1). Sem o campo
// `gearRarityCap` no mapa → sem cap (maxRarity). Trava o rarity-up na raridade do mapa.
export function mapRarityCap(state) {
  const map = MAPS[((state && state.map) || 1) - 1] || MAPS[0];
  return map.gearRarityCap != null ? map.gearRarityCap : maxRarity;
}

// ───── Modelo de valor de um afixo ─────

// multiplicador do afixo PRIMÁRIO = 2 camadas LINEARES que multiplicam (modelo Gaiadon):
//   Bonus% = (1 + nível × bonusRate × rarityMult) · ×Multiplier = (1 + nível × multRate × rarityMult)
// Lineares → o produto cresce ~nível² (polinomial); com a base flat (Primary) → ~nível³.
export function primaryMult(level, rarity) {
  const rm = GEAR.rarityMult[rarity];
  const bonus = 1 + level * GEAR.bonusRate * rm;
  // ✅ 18/jun: afixo MULTIPLIER × (camada multiplicativa) só destrava no INCOMUM (rarity ≥ 1).
  // No COMUM (Faded) a peça tem só flat + % (mult = 1).
  const mult = rarity >= 1 ? 1 + level * GEAR.multRate * rm : 1;
  return bonus * mult;
}
// afixo SECUNDÁRIO multiplicativo = primário^0.30 (30% das décadas — gear.mjs corrigido)
export const secondaryMult = (level, rarity) => primaryMult(level, rarity) ** GEAR.secondaryExp;

// crit chance (afixo plano): nível × critPerLevel × rarityMult
export const critOf = (level, rarity) => level * GEAR.critPerLevel * GEAR.rarityMult[rarity];
// Gilded chance (afixo plano do Manto): nível × gildedPerLevel × rarityMult (teto global no agregado)
export const gildedOf = (level, rarity) => level * GEAR.gildedPerLevel * GEAR.rarityMult[rarity];
// crit damage (afixo plano, bônus sobre a base): nível × critDmgPerLevel × rarityMult
export const critDmgOf = (level, rarity) => level * GEAR.critDmgPerLevel * GEAR.rarityMult[rarity];

// Secundários ATIVOS de uma peça conforme a raridade. ✅ 14/jun: TODA peça comum
// (Faded) tem 2 afixos. Peças cujo PRIMÁRIO tem flat (dmg/hp/defesa/aps) já fecham
// 2 com flat + % → 0 secundário no Faded. Peças sem flat no primário (lumens=anel,
// crit=grasp) ganham 1 secundário já no Faded pra fechar 2. Cada raridade acima
// destrava +1 secundário, capado pelo tamanho da lista.
export function activeSecondaries(def, rarity) {
  const primaryHasFlat = (GEAR.flatPerLevel[def.primary] || 0) > 0;
  return def.secondary.slice(0, rarity + (primaryHasFlat ? 0 : 1));
}

// ───── Agregação por tipo de afixo ─────

// Produto dos afixos MULTIPLICATIVOS de um tipo (primário + secundários ativos a 30%)
function gearMultBy(state, type) {
  let m = 1;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === type) m *= primaryMult(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === type) m *= secondaryMult(p.level, p.rarity);
    }
  }
  return m;
}

export const gearDamageMult   = (s) => gearMultBy(s, 'dmg');
export const gearHpMult       = (s) => gearMultBy(s, 'hp');
export const gearDefesaMult   = (s) => gearMultBy(s, 'defesa');   // consumido na mitigação (Passo 2)
export const gearApsMult      = (s) => gearMultBy(s, 'aps');      // ⛓️ consumidor no apsCap (passo futuro)
export const gearRegenMult    = (s) => gearMultBy(s, 'regen');    // ⛓️ consumidor no regen (passo futuro)
export const gearBossDmgMult  = (s) => gearMultBy(s, 'bossDmg');  // ⛓️ consumidor no hit em boss (passo futuro)

// ── Afixo FLAT por nível (CP-4): soma flat à BASE do stat (não multiplica).
//    Primário = valor cheio; secundário = × secondaryExp. Escala pela raridade.
function gearFlatBy(state, type) {
  const per = GEAR.flatPerLevel[type] || 0;
  if (!per) return 0;
  let flat = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    const rm = GEAR.rarityMult[p.rarity];
    if (def.primary === type) flat += p.level * per * rm;
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === type) flat += p.level * per * rm * GEAR.secondaryExp;
    }
  }
  return flat;
}
export const gearDamageFlat = (s) => gearFlatBy(s, 'dmg'); // soma na base de dano
export const gearHpFlat     = (s) => gearFlatBy(s, 'hp');  // soma na base de HP
export const gearApsFlat    = (s) => gearFlatBy(s, 'aps'); // soma na base de APS (capado depois)
export const gearDefesaFlat = (s) => gearFlatBy(s, 'defesa'); // soma na base de Defesa

// ── Afixos de FARM (Lumens/XP/Materiais) — REGRA Bloco 3: só flat/% ADITIVO, NUNCA o motor ×.
// Valor LINEAR do afixo (sem o 1.0039^L): mantém o farm como bônus modesto, não motor de décadas.
function farmLinear(level, rarity, isSec) {
  return 1 + level * GEAR.affixPctRate * GEAR.rarityMult[rarity] * (isSec ? GEAR.secondaryExp : 1);
}
function farmMultBy(state, type) {
  let m = 1;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === type) m *= farmLinear(p.level, p.rarity, false);
    for (const sec of activeSecondaries(def, p.rarity)) if (sec === type) m *= farmLinear(p.level, p.rarity, true);
  }
  return m;
}
export const gearLumensMult = (s) => farmMultBy(s, 'lumens'); // Farm: linear (sem motor)
export const gearXpMult     = (s) => farmMultBy(s, 'xp');     // Farm: linear (sem motor)
// Materiais → DROP: AMORTECIDO por log (o bruto linear ~×70 viraria pacing absurdo). yield = 1 + 0.5×log10(bruto).
// Justificativa: log transforma o crescimento do afixo em bônus ADITIVO limitado; 0.5 lança ≈ ×2 no endgame
// (linear bruto ×70 → log10=1.85 → ×1.9), preservando o pacing de ~27 min/tier (drop base 1% intocado).
export const gearMaterialDropMult = (s) => 1 + 0.5 * Math.log10(Math.max(1, farmMultBy(s, 'materiais')));

// Gilded chance: soma plana dos afixos 'gilded' (primário Manto + secundários a 30%),
// limitada ao teto GLOBAL (GILDED.chanceCap = 30%).
export function gearGildedChance(state) {
  let a = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === 'gilded') a += gildedOf(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === 'gilded') a += gildedOf(p.level, p.rarity) * GEAR.secondaryExp;
    }
  }
  return Math.min(GILDED.chanceCap, a);
}

// Crit chance: soma plana (primário Grasp + secundário Resonance a 30%)
export function gearCritAdd(state) {
  let a = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === 'crit') a += critOf(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === 'crit') a += critOf(p.level, p.rarity) * GEAR.secondaryExp;
    }
  }
  return a;
}

// Crit damage: bônus plano sobre a base ×2 (só secundário — Edge/Grasp), a 30% como secundário.
export function gearCritDmgAdd(state) {
  let a = 0;
  for (const def of GEAR.pieces) {
    const p = state.gear[def.key];
    if (def.primary === 'critDmg') a += critDmgOf(p.level, p.rarity);
    for (const sec of activeSecondaries(def, p.rarity)) {
      if (sec === 'critDmg') a += critDmgOf(p.level, p.rarity) * GEAR.secondaryExp;
    }
  }
  return a; // ⛓️ consumidor em critDamageMult (wiring quando o Crit fechar — §16.6)
}

// ───── Custos e gates ─────

// Cap de nível da peça = cap DURO da raridade (Comum 500 · Incomum 1400). A raridade TOPO
// (Converged) ganha +capPerAsc por Ascension (sem-teto §13). NÃO é atrelado à Convergence.
export function levelCapFor(piece, state) {
  const base = GEAR.levelCap[piece.rarity];
  return piece.rarity === maxRarity ? base + (state.ascensions || 0) * GEAR.capPerAsc : base;
}
export const atLevelCap = (piece, state) => piece.level >= levelCapFor(piece, state);

// ✅ recalibração "em branco": custo de 1 nível EXPONENCIAL (sim) — dobra a cada 10 níveis.
// cost(L) = base × costRamp^L × costMult[raridade]. Cria teto-SUAVE (~280) abaixo do cap
// duro (400). Clampado a NUMBER_CAP (caps altos de M2+ serão recalibrados num CP próprio).
export function levelCost(piece) {
  const c = GEAR.levelCostBase * GEAR.costRamp ** piece.level * GEAR.costMult[piece.rarity];
  return Math.min(NUMBER_CAP, c);
}

// Tier de material que paga a raridade atual→próxima (= índice da raridade atual: T1 paga 0→1)
export const rarityUpTier = (piece) => piece.rarity;
// custo de raridade = MATERIAIS do tier (não mais Lumens, §13B); Infinity se já no topo.
export function rarityUpCost(piece) {
  return piece.rarity >= maxRarity ? Infinity : CRAFT.rarityUpMaterial;
}

// Menor raridade entre TODAS as peças (piso do set, pro gate lockstep).
function minSetRarity(state) {
  let m = Infinity;
  for (const def of GEAR.pieces) m = Math.min(m, state.gear[def.key].rarity);
  return m;
}

// Rarity-up gateado por: (1) MATERIAL do tier + (2) LOCKSTEP — uma peça só sobe pra
// R+1 se TODAS já estão ≥ R (✅ 14/jun: não passa pra Luminous enquanto nem todas
// estiverem Kindled). Uma peça por vez, na ordem que o jogador quiser, dentro do piso.
export function canRarityUp(state, key) {
  const p = state.gear[key];
  return p.rarity < maxRarity
    && p.rarity < mapRarityCap(state)               // ✅ 18/jun: trava no cap de raridade do mapa (Map 1 = Incomum)
    && minSetRarity(state) >= p.rarity              // a peça está no piso do set
    && state.materiais[rarityUpTier(p)] >= CRAFT.rarityUpMaterial;
}

// ───── Ações (gastam Lumens) ─────

export function buyLevel(state, key) {
  const p = state.gear[key];
  if (atLevelCap(p, state)) return false;
  const cost = levelCost(p);
  if (state.lumens < cost) return false;
  state.lumens -= cost;
  p.level += 1;
  return true;
}

// Bulk-buy: compra o máximo de níveis que o orçamento permite. Com custo EXPONENCIAL o
// teto duro é baixo (≤ 400 no Faded; ≤ 5000 nas raridades altas) → loop simples e seguro
// (sem closed-form). O custo cresce rápido, então poucas iterações por chamada na prática.
export function buyLevels(state, key, n) {
  const p = state.gear[key];
  let bought = 0;
  while (bought < n && !atLevelCap(p, state)) {
    const cost = levelCost(p);
    if (state.lumens < cost) break;
    state.lumens -= cost;
    p.level += 1;
    bought += 1;
  }
  return bought;
}

export function doRarityUp(state, key) {
  if (!canRarityUp(state, key)) return false;
  const p = state.gear[key];
  state.materiais[rarityUpTier(p)] -= CRAFT.rarityUpMaterial; // paga em materiais do tier
  p.rarity += 1; // mantém o nível: segue subindo até o cap maior da nova raridade
  return true;
}

// ───── Refino de materiais (§13B): 12:1, SÓ pra cima ─────
export const canRefino = (state, fromTier) =>
  fromTier >= 0 && fromTier < 3 && state.materiais[fromTier] >= CRAFT.refinoRatio;

export function doRefino(state, fromTier) {
  if (!canRefino(state, fromTier)) return false;
  state.materiais[fromTier] -= CRAFT.refinoRatio;
  state.materiais[fromTier + 1] += 1;
  return true;
}
```

### `src/game/memoires.js`

```javascript
// Motor de Mémoires — GDD §10/§11. Moeda = Éclats. Clarté é o motor global
// (dano × 1.07^Σ níveis). Desbloqueio por era via Ascension; evolução barata
// que escala. Persiste sempre. Efeitos `wired:false` ainda contam via Clarté.

import {
  MEMOIRES, MEMOIRE_CLARTE_BASE, MEMOIRE_UNLOCK, MEMOIRE_EVO_BASE, MEMOIRE_EVO_RAMP,
  MEMOIRE_CLARTE_EXP_PER, MEMOIRE_INDIV_DMG_CAP,
} from '../data/constants.js';

export const eraOf = (i) => MEMOIRES[i].era;
export const eraUnlocked = (state, era) => state.ascensions >= era;

// Custo do próximo passo (Éclats): desbloqueio (nível 0→1) ou evolução
export function nextCost(state, i) {
  const level = state.memoires[i];
  if (level === 0) return MEMOIRE_UNLOCK[MEMOIRES[i].era - 1];   // §11: desbloqueio por era
  return MEMOIRE_EVO_BASE * MEMOIRE_EVO_RAMP ** (level + 1);     // §11: evolução 2 × 1.10^n
}

export function canBuy(state, i) {
  return eraUnlocked(state, MEMOIRES[i].era) && state.eclats >= nextCost(state, i);
}

export function buyMemoire(state, i) {
  if (!canBuy(state, i)) return false;
  state.eclats -= nextCost(state, i);
  state.memoires[i] += 1;
  return true;
}

// ───── Efeitos ─────
export function totalLevels(state) {
  let s = 0;
  for (const l of state.memoires) s += l;
  return s;
}

// Σ aditivo de um tipo (1 + Σ per×nível) — só efeitos wired
function addType(state, type) {
  let s = 0;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === type) s += m.per * state.memoires[i]; });
  return s;
}
// du Choix (#15): +5%/nível a TODOS os efeitos INDIVIDUAIS (não à Clarté nem ao motor ×Blessure)
const allMult = (state) => 1 + addType(state, 'allMemoire');
// Σ aditivo de um tipo, JÁ amplificado por du Choix
const eff = (state, type) => addType(state, type) * allMult(state);
// Π multiplicativo de um tipo (Π (1+per)^nível)
function mulType(state, type) {
  let p = 1;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === type) p *= (1 + m.per) ** state.memoires[i]; });
  return p;
}

// ⚠️ Clarté: o expoente é amplificado por #14 (de la Lumière Entière) — STUB (per=0, sem efeito).
// Com MEMOIRE_CLARTE_EXP_PER=0 o expoente = Σníveis ⇒ Clarté = 1.07^Σníveis (Camada 6 INTACTA).
function clarteExponent(state) {
  let amp = 0;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === 'clarteExp') amp += MEMOIRE_CLARTE_EXP_PER * state.memoires[i]; });
  return totalLevels(state) * (1 + amp);
}
export const clarte = (state) => MEMOIRE_CLARTE_BASE ** clarteExponent(state);

// dano = Clarté × bônus individual AMORTECIDO (#1 + #10), capado p/ não abrir gap no late.
// A Clarté é O motor (70 déc); #1/#10 dão um bônus pequeno por cima (teto ×CAP) e seus níveis
// ainda alimentam a Clarté via totalLevels. Andar Mémoires ≈ 70 déc no TOTAL.
export const memoireDmgMult = (s) =>
  clarte(s) * Math.min(MEMOIRE_INDIV_DMG_CAP, (1 + eff(s, 'dmg')) * mulType(s, 'dmgMult'));
// HP recebe os MESMOS fatores de prestige (§4) — INCLUSIVE a Clarté. Sem isto o HP fica ~70 déc
// atrás do dano e o jogador morre instantâneo no late (a sobrevivência da Camada 2 assume HP∝dano).
export const memoireHpMult      = (s) => clarte(s) * (1 + eff(s, 'hp') + eff(s, 'survival'));
export const memoireLumensMult  = (s) => 1 + eff(s, 'lumens');
export const memoireXpMult      = (s) => 1 + eff(s, 'xp');
export const memoireVestigeMult = (s) => 1 + eff(s, 'vestiges');
export const memoireCritDmgMult = (s) => 1 + eff(s, 'critDmg');
// ── Passo 6: efeitos novos/wired ──
export const memoireSurvivalMult   = (s) => 1 + eff(s, 'survival');   // #11 → regen (combat) + defesa (veilFactor)
export const memoireMateriaisMult  = (s) => 1 + eff(s, 'materiais');  // #5  → yield de material (economy)
export const memoireEclatsAllMult  = (s) => 1 + eff(s, 'eclatsAll');  // #12 → drip + bolsas de Ascension
export const memoireDiffRewardMult = (s) => 1 + eff(s, 'diffReward'); // #13 → multiplica rewardMult da dificuldade
export const memoireBossDmgMult    = (s) => 1 + eff(s, 'bossDmg');    // #7  → dano em boss (path do gearBossDmg)
export const memoireOfflineMult    = (s) => 1 + eff(s, 'offline');    // #6  → ganho offline
// #9 du Dernier Chant: +1 ponto de Convergence/run a cada 5 níveis
export function memoireConvPointBonus(state) {
  let b = 0;
  MEMOIRES.forEach((m, i) => { if (m.wired && m.type === 'convPoint') b += Math.floor(state.memoires[i] / 5); });
  return b;
}

// Progresso por era (desbloqueadas / total) para a UI
export function eraProgress(state, era) {
  let unlocked = 0, total = 0;
  MEMOIRES.forEach((m, i) => { if (m.era === era) { total++; if (state.memoires[i] > 0) unlocked++; } });
  return { unlocked, total };
}
```

### `src/game/offline.js`

```javascript
// Progresso offline — GDD §15.
// O tick de combate é o motor real também offline: simulamos o tempo ausente
// com o mesmo combatTick (mesmo dt), então morte/recuo acontecem como online
// e a cascata estabiliza no ponto sustentável. O jogador NUNCA abre morto.

import { TICK_SECONDS, OFFLINE } from '../data/constants.js';
import { combatTick, resetPack } from './combat.js';
import { automationTick } from './fatekeepers.js';
import { playerHpMax } from './stats.js';
import { memoireOfflineMult } from './memoires.js';

// Simula `seconds` de ausência. Retorna o resumo dos ganhos (ou null se curto).
export function simulateOffline(state, seconds) {
  // #6 des Profondeurs amplia o tempo offline efetivo (capado pelo teto de engenharia)
  const simSeconds = Math.min(Math.max(0, seconds) * memoireOfflineMult(state), OFFLINE.maxSeconds);
  if (simSeconds < OFFLINE.minSecondsToReport) return null;

  const before = {
    lumens: state.lumens,
    xp: state.xpTotal,
    vestiges: state.vestiges,
    kills: state.killsTotal,
    subarea: state.subarea,
  };

  const ticks = Math.floor(simSeconds / TICK_SECONDS);
  for (let i = 0; i < ticks; i++) {
    combatTick(state, TICK_SECONDS);
    automationTick(state, TICK_SECONDS); // §8: automações + Eco do Seeker rodam offline também
  }

  // Garantia do §15: nunca abrir morto — completa o respawn pendente
  if (state.player.dead) {
    state.player.dead = false;
    state.player.respawnTimer = 0;
    state.player.hp = playerHpMax(state);
    resetPack(state);
  }

  return {
    seconds: simSeconds,
    lumens: state.lumens - before.lumens,
    xp: state.xpTotal - before.xp,
    vestiges: state.vestiges - before.vestiges,
    kills: state.killsTotal - before.kills,
    retreated: state.subarea < before.subarea, // recuou até o sustentável?
  };
}
```

### `src/game/passives.js`

```javascript
// Motor de Passivas — GDD §7. Economia canônica; efeitos ⏳ PROVISÓRIOS
// (ver PASSIVES em constants.js). 3 árvores × 15 (3 grupos de 5).
// Moeda = Vestiges. Desbloqueia na 1ª Convergence. Persiste sempre.
//
// Estrutura de custo (§7):
//  - desbloqueio (level 0→1) = unlockLadder[posição] × groupMult[grupo]
//  - evolução (level L→L+1, L≥1) = desbloqueio × 0.3 × 1.30^(L-1)
//  - gate: maximizar os 5 do grupo anterior libera o próximo grupo.

import { PASSIVES, PASSIVE_TREES } from '../data/constants.js';

const GROUP_SIZE = 5;
const groupOf = (i) => Math.floor(i / GROUP_SIZE);
const posOf = (i) => i % GROUP_SIZE;

// Sistema todo só abre na 1ª Convergence (momento de lore §6)
export const passivesUnlocked = (state) => state.convergences >= 1;

// Custo de desbloqueio de uma passiva (índice i na árvore)
export function unlockCost(i) {
  return PASSIVES.unlockLadder[posOf(i)] * PASSIVES.groupMult[groupOf(i)];
}

// Custo do próximo nível de uma passiva (Vestiges)
export function nextCost(state, tree, i) {
  const level = state.passives[tree][i];
  if (level === 0) return unlockCost(i);                 // desbloqueio
  return unlockCost(i) * PASSIVES.evoFactor * PASSIVES.evoRamp ** (level - 1); // evolução
}

export const isMax = (state, tree, i) => state.passives[tree][i] >= PASSIVES.maxLevel;

// Um grupo (0..2) está liberado se for o 1º ou se todos os 5 do anterior estão no máximo
export function groupUnlocked(state, tree, group) {
  if (group === 0) return true;
  const arr = state.passives[tree];
  const prev = group - 1;
  for (let p = 0; p < GROUP_SIZE; p++) {
    if (arr[prev * GROUP_SIZE + p] < PASSIVES.maxLevel) return false;
  }
  return true;
}

export function canBuy(state, tree, i) {
  if (!passivesUnlocked(state)) return false;
  if (isMax(state, tree, i)) return false;
  if (!groupUnlocked(state, tree, groupOf(i))) return false;
  return state.vestiges >= nextCost(state, tree, i);
}

// Compra/evolui uma passiva (gasta Vestiges)
export function buyPassive(state, tree, i) {
  if (!canBuy(state, tree, i)) return false;
  state.vestiges -= nextCost(state, tree, i);
  state.passives[tree][i] += 1;
  return true;
}

// ───── Efeitos individuais (Bloco 4, esquema Camada 5) ─────
// Multiplicador da PRIMÁRIA de uma árvore (Éclat→dano · Fracture→HP · Vestige→economia):
//   (1 + Σ %aditivo dos default) × Π(motores ×1.52^nível). Levers ficam FORA (efeito especial).
function treeMult(state, tree) {
  const arr = state.passives[tree];
  let add = 0, eng = 1;
  PASSIVES.trees[tree].list.forEach(([, art], i) => {
    const lv = arr[i];
    if (lv === 0) return;
    if (PASSIVES.levers[art]) return;                                  // lever: fora do mult
    if (PASSIVES.engines[tree].includes(art)) eng *= PASSIVES.engineMult ** lv; // motor ×1.52/nível
    else add += PASSIVES.groupAddPct[groupOf(i)] * lv;                 // default: % do grupo
  });
  return (1 + add) * eng;
}
export const passiveDmgMult = (s) => treeMult(s, 'eclat');
export const passiveHpMult  = (s) => treeMult(s, 'fracture');
export const passiveEcoMult = (s) => treeMult(s, 'vestige');

// Nível de uma passiva pela chave de arte (busca nas 3 árvores)
function leverLevel(state, art) {
  for (const tree of PASSIVE_TREES) {
    const idx = PASSIVES.trees[tree].list.findIndex(([, a]) => a === art);
    if (idx >= 0) return state.passives[tree][idx];
  }
  return 0;
}

// ── Alavancas funcionais (efeitos especiais, consumidos pelos sistemas reais) ──
const L = PASSIVES.lever;
export const passiveCritAdd      = (s) => leverLevel(s, 'e_luminal_edge') * L.critPerLevel;   // crit chance
export const passiveApsMult      = (s) => 1 + leverLevel(s, 'f_fracture_pulse') * L.apsPerLevel; // APS (Bloco 6)
export const passiveMobBonus     = (s) => Math.floor(leverLevel(s, 'f_void_awareness') * L.mobPerLevel); // +mobs
// Vestige Pull → ×drop de material (FARM: amortecido por log, nunca motor)
export const passiveMaterialMult = (s) => 1 + Math.log10(1 + leverLevel(s, 'v_vestige_pull') * L.materialPerLevel);
// Void Piercing (penetra) / Weakened Void (reduz) a defesa de INIMIGOS — consome o hook do Passo 2
export const passiveEnemyPen     = (s) => leverLevel(s, 'e_void_piercing') * L.penPerLevel;   // fração penetrada
export const passiveEnemyReduce  = (s) => leverLevel(s, 'f_weakened_void') * L.reducePerLevel; // fração reduzida

// Contadores para a UI (quantas desbloqueadas / maximizadas por árvore)
export function treeProgress(state, tree) {
  const arr = state.passives[tree];
  let unlocked = 0, maxed = 0;
  for (const lv of arr) { if (lv > 0) unlocked++; if (lv >= PASSIVES.maxLevel) maxed++; }
  return { unlocked, maxed, total: arr.length };
}

export { PASSIVE_TREES };
```

### `src/game/stats.js`

```javascript
// Stats derivados do jogador — modelo CP-3 (redesign).
// NÍVEL (do XP da run) dá dano/HP FLAT — substitui os Gold Stats. APS/crit/economia
// vêm de Gear/Passivas/Mémoires (sem str/vit/agi/lck/frt/wis). Convergence = +15%
// ADITIVO por converge. Fatores de sistemas ainda-não-wirados valem 1.
//
// ⏳ Os shims no fim (strTotal/levelBonus/etc.) existem só pra UI antiga não quebrar
// no CP-3a; somem no CP-3b (rework do Player UI).

import { COMBAT, LEVEL, CRIT, CONVERGENCE, DEFENSE } from '../data/constants.js';
import { gearDamageMult, gearHpMult, gearCritAdd, gearDefesaMult, gearCritDmgAdd, gearApsMult,
  gearDamageFlat, gearHpFlat, gearApsFlat } from './gear.js';
import { passiveDmgMult, passiveHpMult, passiveCritAdd, passiveEnemyPen, passiveEnemyReduce, passiveApsMult } from './passives.js';
import { memoireDmgMult, memoireHpMult, memoireCritDmgMult, memoireSurvivalMult } from './memoires.js';
import { ascMult, despertarMult, despertarCritRateAdd, despertarCritDmgAdd, despertarApsAdd } from './ascension.js';

// ───── Nível (motor de stat base) ─────
// O nível vem do XP da RUN (reseta na Convergence). level = (xpRun / div)^exp.
export function runLevel(state) {
  return Math.max(1, Math.floor((state.xpRun / LEVEL.curveDiv) ** LEVEL.curveExp));
}
// Nível a partir de um XP qualquer (usado pra display; mesma curva).
export const heroLevel = (xp) => Math.max(1, Math.floor(((xp || 0) / LEVEL.curveDiv) ** LEVEL.curveExp));

// XP do nível atual: xp(L) = curveDiv × L^(1/curveExp) (inverso da curva).
function levelXpBounds(state) {
  const L = runLevel(state);
  const inv = 1 / LEVEL.curveExp;
  return { xpL: LEVEL.curveDiv * L ** inv, xpN: LEVEL.curveDiv * (L + 1) ** inv };
}
// Progresso (0..1) do XP da run dentro do nível atual → enche a barra de LVL.
export function levelProgress(state) {
  const { xpL, xpN } = levelXpBounds(state);
  return Math.max(0, Math.min(1, (state.xpRun - xpL) / (xpN - xpL)));
}
// Valores de XP do nível: acumulado no nível atual / total p/ subir / faltando.
export function levelXpInfo(state) {
  const { xpL, xpN } = levelXpBounds(state);
  return {
    into: Math.max(0, state.xpRun - xpL),
    total: xpN - xpL,
    remaining: Math.max(0, xpN - state.xpRun),
  };
}

// ───── Convergence (ADITIVO por converge) — 2 canais (18/jun) ─────
// dano/HP: +20% por conv. Gold (Lumens): +0,5% por conv (canal próprio, bem menor).
// XP fica 0% (vem do Gear). O reset (nível/Gold da run) é feito em convergence.js.
export function convMult(state) {
  return 1 + CONVERGENCE.bonusPerConv * state.convergences;        // dano/HP
}
export function convLumensMult(state) {
  return 1 + CONVERGENCE.goldBonusPerConv * state.convergences;    // Gold (Lumens)
}

// ───── APS e crit (sem Gold Stats — vêm de gear/passivas) ─────
// APS = baseAPS + bônus LINEAR do afixo de APS (Amuleto) — recalibração "em branco":
//   gearApsFlat ≈ nível × 0.0065 → APS sobe 0.90 → ~2.7 no fim do Map 1 (gear ~280),
//   bem abaixo do teto global apsCap=10. (Era a curva saturante ~1.35; agora linear, como o sim.)
export function apsBonus(state) {
  return gearApsFlat(state);
}
export function currentAPS(state) {
  // base + afixo do Amuleto (gear) + Despertar (+0,5/tier), tudo somado ANTES do apsCap.
  const aps = (COMBAT.baseAPS + apsBonus(state) + despertarApsAdd(state)) * passiveApsMult(state);
  return Math.min(COMBAT.apsCap, aps);
}

// Crit ⏳ provisório: rate vem de gear (Grasp) + passivas (Luminal Edge) + Despertar (+5%/tier). Sem LCK.
export function critChanceRaw(state) {
  return CRIT.baseChance + gearCritAdd(state) + passiveCritAdd(state) + despertarCritRateAdd(state);
}
export function critChance(state) {
  return Math.min(1, critChanceRaw(state));
}
export function critDamageMult(state) {
  const overflow = Math.max(0, critChanceRaw(state) - 1); // crit chance > 100% transborda
  // base ×2 + transbordo + gear + Despertar (+200%/tier)
  return (CRIT.baseDamageMult + overflow * CRIT.overflowFactor + gearCritDmgAdd(state) + despertarCritDmgAdd(state)) * memoireCritDmgMult(state);
}

// ───── Dano e HP (base FLAT: nível do Seeker + flat do Gear) × multiplicadores ─────
const baseDamage = (state) => COMBAT.baseDmg + runLevel(state) * LEVEL.dmgPerLevel + gearDamageFlat(state);
const baseHp = (state) => COMBAT.playerBaseHp + runLevel(state) * LEVEL.hpPerLevel + gearHpFlat(state);

// dano_por_hit = (baseDmg + nível×dmgPerLevel) × convMult × gear × passiva × mémoire × asc × despertar
export function damagePerHit(state) {
  return baseDamage(state) * convMult(state) * gearDamageMult(state) * passiveDmgMult(state)
    * memoireDmgMult(state) * ascMult(state) * despertarMult(state);
}

// DPS exibido: valor esperado incluindo crit
export function dps(state) {
  const critBonus = 1 + critChance(state) * (critDamageMult(state) - 1);
  return damagePerHit(state) * currentAPS(state) * critBonus;
}

// hp_max = (playerBaseHp + nível×hpPerLevel) × convMult × gear × passiva × mémoire × asc × despertar
export function playerHpMax(state) {
  return baseHp(state) * convMult(state) * gearHpMult(state) * passiveHpMult(state)
    * memoireHpMult(state) * ascMult(state) * despertarMult(state);
}

// ───── Defesa / mitigação (§4 — inalterado pelo CP-3) ─────
export function veilFactor(state) {
  const fromVeil = Math.max(0, gearDefesaMult(state) - 1) * DEFENSE.veilScale;
  const fromPassives = 0; // ⛓️ hook reservado (Void Endurance etc.)
  const total = (fromVeil + fromPassives) * memoireSurvivalMult(state); // #11 amplia a defesa
  return Math.min(DEFENSE.veilCap, total);
}
export function playerDefesa(state) {
  return playerHpMax(state) * veilFactor(state);
}
export function postArmorDR(_state) {
  return 1; // ⛓️ hook reservado (Nihel's Shadow etc.)
}
export function enemyDefesa(state, _mob) {
  const reduced = DEFENSE.enemyDefBase * (1 - passiveEnemyReduce(state)); // Weakened Void
  return Math.max(0, reduced * (1 - passiveEnemyPen(state)));             // Void Piercing
}

// ───── Compat shims (removidos no CP-3b — UI antiga ainda os importa) ─────
export const strTotal = () => 1;
export const vitTotal = () => 1;
export const frtTotal = () => 1;
export const wisTotal = () => 1;
export const levelBonus = () => 1;             // o nível agora é flat, não multiplicador
export const convFactor = (state) => convMult(state); // a UI mostra a Convergence
export const statCostNext = () => Infinity;    // Gold Stats não são mais compráveis
export function buyStat() { return false; }
export function buyStatMax() {}
```

## Interface — src/ui (JS)

### `src/ui/ascension.js`

```javascript
// Tela de Ascension (pós-MVP) — marcos da Ordre (GDD §8). Layout v5: PALCO
// full-bleed (salão cerimonial da Ordre) + Séraphine, a Doyenne, por cima ·
// rank/comissão/Gatekeepers flutuam sobre a arte (sem caixas pesadas, no estilo
// Mémoires/Passivas). Derrotar o boss final do mapa + pagar Vestiges → asc_mult
// (dano e HP), bolsa de Éclats, rank e o próximo mapa. A1 libera Éclats/Mémoires
// + o drip. Só A1 é completável no MVP.
//
// ⚠️ O seletor de Difficulty saiu desta tela (relocado para o painel de entrada
// de sub-área do Nível 2). Aqui só restam rank, comissão e Gatekeepers.
//
// Arte (caminho direto, fora do manifesto — cena única, estilo Maël/Lucius):
//   eclats/ascension/hall.webp → o salão COM a Séraphine embutida (NPC + fundo juntos)
//
// Contrato: buildAscensionView(root, state) monta o DOM; renderAscension(state) atualiza.

import { formatNumber } from '../core/format.js';
import { ASCENSIONS, MAPS } from '../data/constants.js';
import {
  nextAscension, ascMult, reqMet, canAscend, doAscend, currentRank, eclatsDripPerSec,
} from '../game/ascension.js';
import { resetPack } from '../game/combat.js';

const $ = (id) => document.getElementById(id);
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const roman = (n) => ROMAN[n - 1] || String(n);

// Arte (fora do manifesto — referência por caminho Vite). Cena única: o salão
// JÁ com a Séraphine embutida (NPC + fundo numa imagem só, como Maël/Lucius).
const HALL = 'eclats/ascension/hall.webp';
const glyphSrc = (g) => `eclats/ascension/glyphs/${g}.png`;

// Os 5 Gatekeepers — a Semente aprende a guardar o que você deixa para trás.
// `asc` = Ascension que o desperta. `type`:
//   toggle  → controle real (liga/desliga); bind = chaves de state.auto.
//   always  → passivo "Always on" quando desbloqueado.
//   soon    → desbloqueia na Ascension `asc`, mas o controle real vive noutro
//             lugar / ainda não existe → TODO(lógica).
const GATEKEEPERS = [
  { glyph: 'rhythm', name: 'The Rhythm', asc: 1, type: 'toggle', bind: ['stats', 'converge'],
    desc: 'Auto-converges and tends your Gold Stats. The light breathes on its own.' },
  { glyph: 'vigil', name: 'The Vigil', asc: 2, type: 'always',
    desc: 'Opens difficulties — the court’s tides reflood the regions you reclaimed.' },
  { glyph: 'echo', name: 'The Echo', asc: 3, type: 'soon',
    desc: 'Deploy an echo of yourself to farm a cleared region while you press on.' },
  { glyph: 'pull', name: 'The Pull', asc: 4, type: 'soon',
    desc: 'You pulse like a great Éclat — the corrupted are drawn to you in greater numbers.' },
  { glyph: 'transcendence', name: 'Transcendence', asc: 5, type: 'soon',
    desc: 'The final waking of the Seed. Sealed beyond the frontier.' },
];

export function buildAscensionView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('ascension');
  root.innerHTML = `
    <div class="as-stage" id="as-stage" style="--art:url('${HALL}')"></div>

    <div class="as-rank">
      <div class="as-rk-lbl" id="as-rk-lbl">Current standing</div>
      <h1 id="as-rk-name">Seeker</h1>
      <div class="as-rk-map" id="as-rk-map"></div>
      <div class="as-rk-pips" id="as-rk-pips">
        ${SEEKER_PIPS()}
      </div>
      <div class="as-rk-stats">
        <span>Ascension power <b id="as-mult" class="t-gold">×1</b></span>
        <span>Éclats drip <b id="as-drip">0/h</b></span>
      </div>
    </div>

    <aside class="as-commission" id="as-commission"></aside>

    <section class="as-gk">
      <div class="as-gk-head">
        <h2 class="as-title">Gatekeepers</h2>
        <span class="as-gk-sub">The Seed learns to guard what you leave behind</span>
      </div>
      <div class="as-gk-ladder" id="as-gk-ladder"></div>
    </section>
  `;

  // Escada de Gatekeepers
  const ladder = $('as-gk-ladder');
  GATEKEEPERS.forEach((g, idx) => {
    const step = document.createElement('div');
    step.className = 'as-gk-step';
    step.dataset.idx = idx;
    step.innerHTML = `
      <div class="as-gk-em"><img src="${glyphSrc(g.glyph)}" alt=""></div>
      <div class="as-gk-body">
        <div class="as-gk-nm">${g.name} <em>· Ascension ${roman(g.asc)}</em></div>
        <div class="as-gk-desc">${g.desc}</div>
      </div>
      <div class="as-gk-side" data-side="${idx}"></div>
    `;
    // Rhythm: toggle real ligado a state.auto (stats + converge juntos).
    if (g.type === 'toggle') {
      const side = step.querySelector('.as-gk-side');
      side.innerHTML = `<label class="as-gk-toggle">Active <span class="as-sw"></span></label>`;
      side.querySelector('.as-gk-toggle').addEventListener('click', () => {
        if (state.ascensions < g.asc) return; // travado
        const on = !(state.auto[g.bind[0]] && state.auto[g.bind[1]]);
        for (const k of g.bind) state.auto[k] = on;
        renderAscension(state);
      });
    }
    ladder.appendChild(step);
  });

  buildCommission(state);
  renderAscension(state);
}

// 5 pips de rank (preenchidos em render conforme o tier de Despertar)
function SEEKER_PIPS() {
  return [0, 1, 2, 3, 4].map((i) => `<i data-pip="${i}"></i>`).join('');
}

// (Re)constrói o painel de comissão — depende do próximo marco.
function buildCommission(state) {
  const host = $('as-commission');
  const a = nextAscension(state);

  if (!a) {
    host.innerHTML = `
      <div class="as-eyebrow">The Ordre has no further commission</div>
      <h3>You are <b>Lumière</b></h3>
      <div class="as-rew"><div class="r">Every fragment has found its place.</div></div>
      <div class="as-note">"The light promoted you long ago."</div>`;
    return;
  }

  // Nome da próxima fronteira: doAscend avança para o mapa a.mapBoss+1.
  const nextMap = MAPS[a.mapBoss]; // 0-indexed: id a.mapBoss+1
  const gk = GATEKEEPERS.find((g) => g.asc === a.id);

  // Recompensas derivadas dos dados reais (sem inventar cânon).
  const rew = [];
  rew.push('Open the next frontier &amp; its Hollows');
  if (gk) rew.push(`Awaken the next Gatekeeper — <b>${gk.name}</b>`);
  if (a.mult > 1) rew.push(`<b>×${a.mult}</b> damage &amp; vitality`);
  if (a.id === 1) rew.push('Unlocks <b>Éclats</b> / Mémoires &amp; the drip');

  host.innerHTML = `
    <div class="as-eyebrow">The Ordre commissions you onward</div>
    <h3>To <b>${nextMap ? nextMap.name : 'the next frontier'}</b></h3>
    <div class="as-rew">
      ${rew.map((r) => `<div class="r"><span class="k"></span>${r}</div>`).join('')}
      ${a.eclats > 0 ? `<div class="r g"><span class="k"></span>Bag of <b id="as-rew-eclats">${formatNumber(a.eclats)} Éclats</b></div>` : ''}
    </div>
    <div class="as-cost">
      <span class="cl">Tribute · Vestiges</span>
      <span class="cv">${a.cost > 0 ? formatNumber(a.cost) : 'Free'}</span>
    </div>
    <button type="button" class="as-btn" id="as-ascend">Ascend to ${a.rank}</button>
    <div class="as-note" id="as-note"></div>
    <!-- TODO(canon): fala da Semente por rank. Placeholder aprovado pelo mockup. -->
  `;
  $('as-ascend').addEventListener('click', () => {
    if (doAscend(state)) {
      resetPack(state);     // respawna a onda do novo mapa
      buildCommission(state); // o próximo marco mudou → reconstrói o painel
    }
    renderAscension(state);
  });
}

export function renderAscension(state) {
  const rank = currentRank(state);
  const tierIdx = ROMAN.indexOf(rank.tier); // 0..4

  // Banner de rank
  $('as-rk-lbl').textContent = `Current standing · Ascension ${roman(Math.max(1, state.ascensions))}`;
  $('as-rk-name').textContent = rank.name;
  const curMap = MAPS[Math.min(state.map, MAPS.length) - 1];
  $('as-rk-map').textContent = curMap ? `Frontier · ${curMap.name}` : '';
  $('as-rk-pips').querySelectorAll('i').forEach((pip) => {
    const i = Number(pip.dataset.pip);
    pip.classList.toggle('on', i < tierIdx);
    pip.classList.toggle('cur', i === tierIdx);
  });
  $('as-mult').textContent = `×${formatNumber(ascMult(state))}`;
  $('as-drip').textContent = `${formatNumber(eclatsDripPerSec(state) * 3600)}/h`;

  // Comissão — botão habilitado + nota de estado
  const a = nextAscension(state);
  const btn = $('as-ascend');
  const note = $('as-note');
  if (a && btn) {
    const met = reqMet(state);
    const able = canAscend(state);
    btn.disabled = !able;
    if (note) {
      note.textContent = met
        ? (able ? 'The rite is ready.' : `Gather ${formatNumber(a.cost)} Vestiges for Ascension ${roman(a.id)}.`)
        : `Defeat the map’s final boss to unlock Ascension ${roman(a.id)}.`;
    }
  }

  // Gatekeepers — estado por desbloqueio
  $('as-gk-ladder').querySelectorAll('.as-gk-step').forEach((step) => {
    const g = GATEKEEPERS[Number(step.dataset.idx)];
    const unlocked = state.ascensions >= g.asc;
    const side = step.querySelector('.as-gk-side');
    step.classList.toggle('locked', !unlocked);
    step.classList.remove('on', 'passive');

    if (!unlocked) {
      step.classList.add('locked');
      if (g.type === 'toggle') { // preserva o switch (montado no build), só desliga
        const sw = side.querySelector('.as-sw'); if (sw) sw.classList.remove('on');
      } else {
        side.textContent = 'Locked';
      }
      return;
    }

    if (g.type === 'toggle') {
      const on = state.auto[g.bind[0]] && state.auto[g.bind[1]];
      step.classList.toggle('on', on);
      const sw = side.querySelector('.as-sw');
      if (sw) sw.classList.toggle('on', on);
    } else if (g.type === 'always') {
      step.classList.add('on', 'passive');
      side.textContent = 'Always on';
    } else { // soon: desbloqueado mas controle ainda não existe aqui
      step.classList.add('passive');
      side.textContent = 'Active'; // TODO(lógica): controle real (Echo/Pull/Transcendência)
    }
  });
}
```

### `src/ui/awaken.js`

```javascript
// Aba AWAKENING da tela Seeker — a "mudança de classe" (estilo Grand Chase).
// Formato Gear/Forge: cena full-bleed (câmara de despertar) + resumo (esq) +
// palco central com o CARD do tier + trilha dos 5 tiers (dir).
// Gate REAL (recalibração 17-18/jun): Profundidade (liberar a Sub 7) + Kills (total) +
// Nível (da run) + Materiais do Tier 1 (consumidos no ato). Botão "Awaken" → doDespertar.
//
// Contrato: buildAwakenPane(root, state) monta uma vez; renderAwakenPane(state) por tick.

import './awaken.css';
import { formatNumber } from '../core/format.js';
import { picture, url } from '../data/assets.js';
import { SEEKER_RANKS, DESPERTAR } from '../data/constants.js';
import {
  despertarTier, despertarMult, despertarReq,
  despertarProvaMet, canDespertar, doDespertar,
} from '../game/ascension.js';
import { damagePerHit, playerHpMax, runLevel } from '../game/stats.js';

const $ = (id) => document.getElementById(id);
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const roman = (n) => ROMAN[n] || String(n + 1);

// Arte por índice de tier (0..4)
const cardId = (t) => `seeker.card_t${t + 1}`;
const splashSrc = (t) => `eclats/awakening/splash_t${t + 1}.webp`; // fora do manifesto
const tierPower = (t) => DESPERTAR.mult ** t;

let selectedTier = null; // tier em preview no palco (default = atual)
let lastHeroSig = '';    // evita reconstruir o card (e recarregar a img) a cada tick

// Verdade do mundo revelada a cada despertar (índice = tier alcançado 1..4).
// Escala da inocência à verdade sombria (a Ordre serve ao Nada; só a Semente converge).
const RITE_LORE = [
  '',
  'In every other vessel the light sleeps caged. In you, it answered.',
  'The Order names what it cannot do. In you, the scattered fragments remember each other.',
  'Every Éclat they gather is a light caged to die slowly. You are the only place it converges instead.',
  "The Ordre des Éclairés is the Void's quiet furnace. You are its single repair. Tikkun Olam begins in you.",
];

function tierState(t, cur) {
  if (t < cur) return 'awakened';
  if (t === cur) return 'current';
  if (t === cur + 1) return 'next';
  return 'locked';
}

// Barra de gate (label + fração sobreposta + estado ok)
function gateRow(label, ok, frac, pct) {
  return `
    <div class="awk-gate ${ok ? 'ok' : ''}">
      <span class="awk-glabel">${label}</span>
      <span class="awk-bar"><i style="width:${Math.min(100, Math.max(0, pct))}%"></i><em>${frac}</em></span>
    </div>`;
}

export function buildAwakenPane(root, state) {
  root.classList.add('awaken');
  root.innerHTML = `
    <div class="awk-screen"></div>

    <aside class="awk-summary">
      <h3>Awakening</h3>
      <div class="awk-now">
        <div class="awk-now-rank" id="awk-now-rank">Seeker</div>
        <div class="awk-now-tier" id="awk-now-tier">Tier I of V</div>
      </div>
      <dl class="awk-totals">
        <div><dt>Damage</dt><dd id="awk-t-dmg">×1</dd></div>
        <div><dt>Vitality</dt><dd id="awk-t-hp">×1</dd></div>
        <div><dt>Materials · T1</dt><dd id="awk-t-mat">0</dd></div>
      </dl>
      <p class="awk-note">Awakening is the Seeker's change of class — reaching the depths
        and spending Tier-1 Materials to converge to a new threshold. Its power is
        permanent: it survives every reset, Ascension included.</p>
    </aside>

    <section class="awk-stage" id="awk-stage"></section>

    <aside class="awk-rail">
      <div class="awk-rail-head">The Five Tiers</div>
      <div class="awk-rlist" id="awk-rlist"></div>
    </aside>

    <!-- cerimônia absorvida (overlay dentro do palco) -->
    <div class="awk-rite" id="awk-rite" hidden></div>
  `;

  const rlist = $('awk-rlist');
  SEEKER_RANKS.forEach((rank, t) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'awk-tier';
    row.dataset.tier = t;
    row.innerHTML = `
      <span class="awk-th">${picture(cardId(t), { alt: rank.name })}</span>
      <span class="awk-meta">
        <span class="awk-nm">${rank.name}</span>
        <span class="awk-sub">Tier ${roman(t)}</span>
      </span>
      <span class="awk-st" id="awk-st-${t}"></span>`;
    row.addEventListener('click', () => { selectedTier = t; renderAwakenPane(state); });
    rlist.appendChild(row);
  });

  // Delegação no palco (estável): o botão Awaken é reconstruído, o listener não.
  $('awk-stage').addEventListener('click', (e) => {
    const b = e.target.closest('#awk-do');
    if (!b || b.disabled) return;
    if (doDespertar(state)) {
      selectedTier = despertarTier(state);
      lastHeroSig = ''; // força rebuild do card pro novo tier
      playRite(despertarTier(state));
    }
    renderAwakenPane(state);
  });

  renderAwakenPane(state);
}

export function renderAwakenPane(state) {
  const cur = despertarTier(state);
  if (selectedTier == null) selectedTier = cur;

  // Resumo (esquerda) — tier ATUAL + estoque de Nitzotzot
  $('awk-now-rank').textContent = SEEKER_RANKS[cur].name;
  $('awk-now-tier').textContent = `Tier ${roman(cur)} of V`;
  const power = `×${formatNumber(despertarMult(state))}`;
  $('awk-t-dmg').textContent = power;
  $('awk-t-hp').textContent = power;
  $('awk-t-mat').textContent = formatNumber(Math.floor(state.materiais?.[0] || 0));

  // Trilha (direita) — estado por tier + seleção
  SEEKER_RANKS.forEach((rank, t) => {
    const row = document.querySelector(`.awk-tier[data-tier="${t}"]`);
    if (!row) return;
    const st = tierState(t, cur);
    row.className = `awk-tier s-${st}` + (t === selectedTier ? ' sel' : '');
    const stEl = $(`awk-st-${t}`);
    if (stEl) {
      stEl.textContent = st === 'awakened' ? '✓'
        : st === 'current' ? 'Current'
        : st === 'next' ? 'Next' : 'Locked';
    }
  });

  renderStage(state, cur);
}

// Esqueleto do rodapé por estado (montado 1× por tier; o BOTÃO é estável).
function footSkeleton(t, st) {
  if (st === 'awakened') {
    return `<div class="awk-foot ok"><span class="awk-badge">✓ Awakened</span>
      <p class="awk-flavor">The light has already taken this shape in you.</p></div>`;
  }
  if (st === 'current') {
    return `<div class="awk-foot cur"><span class="awk-badge">Current standing</span>
      <p class="awk-flavor">"He carries the light, he is not the light yet."</p></div>`;
  }
  if (st === 'next') {
    return `
      <div class="awk-foot next">
        <div class="awk-gains" id="awk-gains"></div>
        <div class="awk-gates" id="awk-gates"></div>
        <button type="button" class="awk-btn" id="awk-do">Awaken to ${SEEKER_RANKS[t].name}</button>
      </div>`;
  }
  return `<div class="awk-foot locked"><span class="awk-badge">Locked</span>
    <p class="awk-req">Awaken <b>${SEEKER_RANKS[t - 1].name}</b> first.</p></div>`;
}

// Atualiza só os VALORES do rodapé 'next' por tick (sem recriar o botão).
function updateNextFoot(state) {
  const req = despertarReq(state);
  const prova = despertarProvaMet(state);
  const sub = state.unlockedSubarea || 1;
  const kills = Math.floor(state.killsTotal || 0);
  const lvl = runLevel(state);
  const mats = Math.floor(state.materiais?.[0] || 0);
  const dmgB = damagePerHit(state), hpB = playerHpMax(state), m = DESPERTAR.mult;
  const gains = $('awk-gains');
  if (gains) {
    const p = (v) => `+${formatNumber(v * 100)}%`;
    gains.innerHTML = `
      <div><span>Damage</span><b>${formatNumber(dmgB)} <i>→</i> ${formatNumber(dmgB * m)}</b></div>
      <div><span>HP Max</span><b>${formatNumber(hpB)} <i>→</i> ${formatNumber(hpB * m)}</b></div>
      <div><span>Crit Rate</span><b>${p(DESPERTAR.critRateAdd)}</b></div>
      <div><span>Crit Damage</span><b>${p(DESPERTAR.critDmgAdd)}</b></div>
      <div><span>Attack Speed</span><b>+${DESPERTAR.apsAdd.toFixed(3)}</b></div>
      <div><span>Gold</span><b>${p(DESPERTAR.lumensBonus)}</b></div>
      <div><span>XP</span><b>${p(DESPERTAR.xpBonus)}</b></div>`;
  }
  const gates = $('awk-gates');
  if (gates) {
    gates.innerHTML =
      gateRow(`Depth · Reach Sub-area ${req.subarea}`, prova, prova ? 'Done' : `Sub ${formatNumber(sub)} / ${req.subarea}`, (sub / req.subarea) * 100)
      + gateRow('Kills', kills >= req.kills, `${formatNumber(kills)} / ${formatNumber(req.kills)}`, (kills / req.kills) * 100)
      + gateRow('Level', lvl >= req.level, `${formatNumber(lvl)} / ${formatNumber(req.level)}`, (lvl / req.level) * 100)
      + gateRow(`Materials · Tier I (spent)`, mats >= req.t1, `${formatNumber(mats)} / ${formatNumber(req.t1)}`, (mats / req.t1) * 100);
  }
  const btn = $('awk-do');
  if (btn) btn.disabled = !canDespertar(state);
}

// Palco central — card + rodapé estável (cacheados por tier) + valores por tick.
function renderStage(state, cur) {
  const t = selectedTier;
  const rank = SEEKER_RANKS[t];
  const st = tierState(t, cur);
  const stage = $('awk-stage');
  if (!stage) return;

  const heroSig = `${t}|${st}`;
  if (lastHeroSig !== heroSig) {
    lastHeroSig = heroSig;
    stage.className = `awk-stage s-${st}`;
    stage.innerHTML = `
      <div class="awk-hero">
        <div class="awk-hero-art">${picture(cardId(t), { alt: rank.name })}</div>
      </div>
      <div class="awk-hero-id">
        <h2 class="awk-hero-name">${rank.name}</h2>
        <div class="awk-hero-tier">Tier ${roman(t)} of V · <b>×${formatNumber(tierPower(t))}</b> power</div>
      </div>
      ${footSkeleton(t, st)}`;
  }
  if (st === 'next') updateNextFoot(state); // só valores; botão permanece estável
}

// Cerimônia absorvida — splash do tier + revelação do novo rank.
function playRite(tier) {
  const rite = $('awk-rite');
  if (!rite) return;
  const rank = SEEKER_RANKS[tier];
  // splash do tier; se não existir ainda, cai pro CARD daquele tier (centro nunca vazio)
  const fallback = url(cardId(tier));
  rite.innerHTML = `
    <div class="awk-rite-veil"></div>
    <div class="awk-rite-inner">
      <img class="awk-rite-splash" src="${splashSrc(tier)}" alt=""
           onerror="this.onerror=null;this.src='${fallback}'">
      <div class="awk-rite-text">
        <p class="awk-rite-lore">${RITE_LORE[tier] || 'The light within you converges.'}</p>
        <h1>${rank.name.toUpperCase()}</h1>
        <div class="awk-rite-sub">You awaken · Tier ${roman(tier)} of V · ×${formatNumber(DESPERTAR.mult ** tier)} power</div>
        <button type="button" class="awk-rite-close" id="awk-rite-close">Continue</button>
      </div>
    </div>`;
  rite.hidden = false;
  requestAnimationFrame(() => rite.classList.add('show'));
  $('awk-rite-close').addEventListener('click', () => {
    rite.classList.remove('show');
    rite.hidden = true;
  }, { once: true });
}
```

### `src/ui/combat.js`

```javascript
// Tela de Combate (U-2) — liga o motor real (combatTick) à cena do mockup.
// Card do Seeker à esquerda; pack de inimigos espalhado à direita; alvo atual
// com borda dourada; números de dano flutuantes; HUD no rodapé + setas de
// navegação entre sub-áreas (respeitando o gate do boss).
//
// Contrato: buildCombatView(root, state) monta o DOM uma vez;
//           renderCombat(state) atualiza a cada tick.
// Lê o state REAL: state.enemies, state.fx, state.player, stats derivados.

import { formatNumber } from '../core/format.js';
import { picture, bg } from '../data/assets.js';
import { runLevel, playerHpMax, currentAPS, levelProgress, levelXpInfo } from '../game/stats.js';
import { changeSubarea, subareaUnlockLevel } from '../game/combat.js';
import { getCurrentMap, subareaLevelRange } from '../game/enemies.js';
import { currentRank } from '../game/ascension.js';

// tier romano → número do card (seeker.card_tN)
const TIER_NUM = { I: 1, II: 2, III: 3, IV: 4, V: 5 };

const $ = (id) => document.getElementById(id);

// Background POR SUB-ÁREA (caminho direto pro WebP). Map 1 tem arte dedicada das
// 9 áreas; mapas/áreas sem arte caem no fundo único do mapa (bg(map.bg)).
const SUBAREA_BG = {
  1: [
    'lanternroot_glade', 'glimmercap_hollow', 'lightfall_stair', 'dreaming_gate',
    'verdant_deep', 'gilded_mire', 'hollowed_grove', 'stillwatch', 'hollow_heart',
  ],
};
function subareaBg(state) {
  const slug = (SUBAREA_BG[state.map] || [])[state.subarea - 1];
  return slug
    ? `url('eclats/enemies/map${state.map}/${slug}_bg.webp')`
    : bg(getCurrentMap(state).bg);
}

// A arte de cada inimigo/boss vem do mapa (mob.art, definido em enemies.js a
// partir de MAPS em constants). Fallback caso falte.
const ENEMY_ART_FALLBACK = 'enemies.map1.candlewisp_shade';

// Pontos de spawn fixos dentro da arena (%) — pack ≤ 8 (packSizes do GDD),
// então renderizamos todos, sem badge "+N".
// Grade 4×2 com espaçamento horizontal de 17% (≥217px no palco mais estreito,
// 1280) e cards de 190px (285 de altura) — NUNCA há sobreposição entre mobs.
// Verticalmente a arena útil (topbar→HUD, ~100..988px) comporta exatamente
// 3 bandas de 285px com ~17px de folga: linha de cima (y 22.5%), faixa
// exclusiva do boss no meio (y 50.5%) e linha de baixo (y 78%).
// Packs grandes (9..12, GDD packSizes=[2,4,6,9,12]) usam grade 6×2 com cards
// menores (140px) — TODOS os mobs do pack aparecem, nunca menos.
const BOSS_POINT = { x: 55, y: 50.5 };
const ARENA_CX = 66; // centro horizontal da arena de mobs (à DIREITA do card do Seeker)

// Layout COUNT-AWARE: poucos mobs ficam grandes e centrados; muitos viram grade
// densa. Sempre deslocado pra direita (ARENA_CX) pra não encostar no Seeker.
//   ≤3 mobs  → 1 fileira centrada (cards grandes)
//   4-6 mobs → 2 fileiras (cards normais)
//   7-8 mobs → grade 4×2 (cards médios)
//   9-12     → grade 6×2 (cards densos)
function mobLayout(total) {
  if (total <= 3) return { perRow: total, rows: 1, spacing: 19 };
  if (total <= 6) return { perRow: Math.ceil(total / 2), rows: 2, spacing: 17 };
  if (total <= 8) return { perRow: 4, rows: 2, spacing: 13.5 };
  if (total <= 12) return { perRow: 6, rows: 2, spacing: 11.5 };
  // Packs grandes (13..20+): mais fileiras, sprites menores (.swarm). Distribui
  // em N fileiras pra caber na vertical sem colisão; colunas centradas.
  const rows = total <= 16 ? 3 : 4;
  const perRow = Math.ceil(total / rows);
  return { perRow, rows, spacing: Math.min(10.5, 60 / perRow) };
}

// Posição do i-ésimo mob (ordinal entre os NÃO-boss) num pack de `total`.
// Colunas centradas em ARENA_CX; a última fileira (se incompleta) também centra.
function spawnPos(i, total, bossOut) {
  const { perRow, rows, spacing } = mobLayout(total);
  const row = Math.floor(i / perRow);
  const col = i % perRow;
  const colsInRow = row === rows - 1 ? total - perRow * row : perRow;
  const x = ARENA_CX + spacing * (col - (colsInRow - 1) / 2);
  let y;
  if (rows === 1) {
    y = bossOut ? 22.5 : 50;
  } else if (rows === 2) {
    // 2 fileiras → bandas alta/baixa (mais separadas: sprites altos não colidem)
    y = bossOut ? (row === 0 ? 21 : 78) : (row === 0 ? 28 : 71);
  } else {
    // 3+ fileiras → distribui uniformemente entre o topo e a base da arena
    const top = 18, bot = 86;
    y = top + row * ((bot - top) / (rows - 1));
  }
  return { x, y };
}

// Janela de suavização das taxas do HUD (EMA simples)
let rates = null;
let prevT1 = null;   // último total de material T1 (pra detectar o drop)
let lastDropAt = 0;  // quando dropou material pela última vez (pra sumir o box depois)
let dropAccum = 0;   // quanto DROPOU no burst atual (some/zera quando o box some)

// Troca o retrato e a moldura do Seeker conforme o tier (só quando muda)
function updateSeekerCard(seekerEl, cardId) {
  const art = seekerEl.querySelector('.scard-art');
  if (!art) return;
  if (seekerEl.dataset.card !== cardId) {
    seekerEl.dataset.card = cardId;
    art.innerHTML = picture(cardId, { className: 'scard-art-img', alt: 'The Seeker' });
  }
  // imagens absolutas não disparam lazy-load — força carregamento imediato
  seekerEl.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
}

export function buildCombatView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('combat');
  root.innerHTML = `
    <div class="cb-backdrop" id="cb-backdrop"></div>

    <aside class="cb-seeker sfig" id="cb-seeker">
      <div class="sfig-label">
        ${picture('seeker.nameplate', { className: 'sfig-banner', alt: '' })}
        <div class="sfig-nametext">
          <div class="scard-name">Seeker</div>
        </div>
      </div>
      <div class="scard-art sfig-art">
        ${picture('seeker.card_t1', { className: 'scard-art-img', alt: 'The Seeker' })}
      </div>
      <div class="sfig-info">
        <div class="scard-hpbar"><i id="cb-hp-fill"></i>
          <span id="cb-hp-text">—</span></div>
        <div class="scard-lvbar"><i id="cb-lv-fill"></i>
          <span id="cb-lv-text">LVL 1</span></div>
        <div class="cb-status" id="cb-status" hidden></div>
      </div>
    </aside>

    <div class="cb-arena" id="cb-arena"><!-- enemy cards (JS) --></div>

    <!-- Box de drops do mapa (T1) — bg = arte do material; mostra o que DROPOU -->
    <div class="cb-drops" id="cb-drops">
      <div class="cb-drop-info">
        <b class="cb-drop-val" id="cb-drop-t1">+0</b>
      </div>
    </div>

    <!-- camada de FX: cortes de luz do Seeker voando até o alvo -->
    <div class="cb-fx" id="cb-fx" aria-hidden="true"></div>

    <footer class="cb-hud">
      <div class="cb-nav">
        <button type="button" class="cb-arrow" id="cb-prev" title="Previous sub-area">◀</button>
        <div class="cb-zone">
          <span id="cb-zone-sub">LV 1</span>
        </div>
        <button type="button" class="cb-arrow" id="cb-next" title="Next sub-area">▶</button>
      </div>
      <div class="cb-progress">
        <span class="cb-progress-label" id="cb-progress-label">Wave 1</span>
        <div class="cb-progress-bar"><i id="cb-progress-fill"></i></div>
      </div>
      <dl class="cb-metrics">
        <div><dt>Kills /min</dt><dd id="cb-kpm">0</dd></div>
        <div><dt>Lumens /min</dt><dd id="cb-lpm">0</dd></div>
        <div><dt>Vestiges /min</dt><dd id="cb-vpm">0</dd></div>
        <div class="cb-metric-total"><dt>Total kills</dt><dd id="cb-kills">0</dd></div>
      </dl>
    </footer>
  `;

  // Setas de navegação entre sub-áreas (gate do boss respeitado em changeSubarea)
  $('cb-prev').addEventListener('click', () => changeSubarea(state, -1));
  $('cb-next').addEventListener('click', () => changeSubarea(state, +1));

  // Fundo da sub-área atual (atualizado também no render, em troca de área/mapa)
  $('cb-backdrop').style.backgroundImage = subareaBg(state);
}

export function renderCombat(state) {
  const map = getCurrentMap(state);
  const hpMax = playerHpMax(state);

  // ── Card do Seeker ──
  const rank = currentRank(state);
  // tier removido do banner (vai pra outra tela); rank ainda escolhe o sprite do tier
  updateSeekerCard($('cb-seeker'), `seeker.card_t${TIER_NUM[rank.tier] || 1}`);
  $('cb-hp-fill').style.width = `${Math.max(0, (state.player.hp / hpMax) * 100)}%`;
  $('cb-hp-text').textContent =
    `HP: ${formatNumber(Math.max(0, state.player.hp))}/${formatNumber(hpMax)}`;
  const xpi = levelXpInfo(state);
  $('cb-lv-text').textContent =
    `LVL ${formatNumber(runLevel(state))} · ${formatNumber(xpi.into)}/${formatNumber(xpi.total)} XP`;
  $('cb-lv-fill').style.width = `${levelProgress(state) * 100}%`;

  // Box de drops T1: SÓ aparece ao dropar; mostra o QUANTO dropou (burst), não o
  // total guardado; some + zera após ~3.5s sem drop novo (não fixo).
  const t1 = state.materiais[0] || 0;
  const drops = $('cb-drops');
  if (prevT1 !== null && t1 > prevT1) {
    dropAccum += t1 - prevT1;
    lastDropAt = performance.now();
    drops.classList.add('show');
    drops.classList.remove('drop'); void drops.offsetWidth; drops.classList.add('drop');
  }
  if (lastDropAt && performance.now() - lastDropAt > 3500) { drops.classList.remove('show'); dropAccum = 0; }
  $('cb-drop-t1').textContent = `+${formatNumber(dropAccum)}`;
  prevT1 = t1;

  const status = $('cb-status');
  const seeker = $('cb-seeker');
  if (state.player.dead) {
    status.textContent = `Fallen — returns in ${Math.ceil(state.player.respawnTimer)}s`;
    status.hidden = false;
    seeker.classList.add('dead');
  } else {
    status.hidden = true;
    seeker.classList.remove('dead');
  }

  // ── Navegação / zona (segue o mapa atual) ──
  const bd = $('cb-backdrop');
  if (bd) bd.style.backgroundImage = subareaBg(state);
  const range = subareaLevelRange(map, state.subarea);
  $('cb-zone-sub').textContent =
    `LV ${formatNumber(Math.round(range.lo))}–${formatNumber(Math.round(range.hi))}`;
  const prev = $('cb-prev');
  const next = $('cb-next');
  prev.disabled = state.subarea <= 1;
  next.disabled = state.subarea >= state.unlockedSubarea;
  next.title = next.disabled && state.subarea < map.subareaCount
    ? `Reach level ${formatNumber(subareaUnlockLevel(map, state.subarea + 1))} to advance`
    : 'Next sub-area';

  // ── Onda atual + progresso. Sem Guardião: sub-áreas 1..N-1 mostram o avanço de
  //    NÍVEL até liberar a próxima; a última mostra o progresso até o boss. ──
  const isFinalArea = state.subarea === map.subareaCount;
  const bossOut = state.enemies.some((m) => m.isBoss && m.hp > 0);
  const alive = state.enemies.reduce((n, m) => n + (m.hp > 0 ? 1 : 0), 0);
  let pct, label;
  if (bossOut) {
    pct = 100;
    label = `⚔ ${map.bossName} · ${alive} in the wave`;
  } else if (isFinalArea) {
    pct = Math.min(100, (state.killsInSubarea / map.bossKillThreshold) * 100);
    label = `Wave ${state.wave} · ${alive} alive · ${Math.floor(pct)}% to ${map.bossName}`;
  } else if (state.unlockedSubarea < map.subareaCount) {
    // Progresso de NÍVEL até destravar a próxima área da fronteira (não a atual)
    const tgt = state.unlockedSubarea + 1;
    const lv = runLevel(state);
    const cur = subareaUnlockLevel(map, state.unlockedSubarea);
    const nxt = subareaUnlockLevel(map, tgt);
    const tgtName = (map.subareaNames || [])[tgt - 1] || `area ${tgt}`;
    pct = Math.max(0, Math.min(100, ((lv - cur) / Math.max(1, nxt - cur)) * 100));
    label = `Wave ${state.wave} · ${alive} alive · level ${formatNumber(lv)}/${formatNumber(nxt)} → ${tgtName}`;
  } else {
    pct = 100;
    label = `Wave ${state.wave} · ${alive} alive`;
  }
  $('cb-progress-fill').style.width = `${pct}%`;
  $('cb-progress-label').textContent = label;

  // ── HUD: taxas suavizadas ──
  renderRates(state);

  // ── Inimigos + dano flutuante ──
  // processa impactos cujo projétil já chegou ANTES de desenhar os cards
  processPending(performance.now());
  renderEnemies(state);
  renderDamageFloats(state);
}

// ── Inimigos: reconstrói os cards quando o pack muda; senão só atualiza ──
function renderEnemies(state) {
  const arena = $('cb-arena');

  const totalMobs = state.enemies.reduce((n, m) => n + (m.isBoss ? 0 : 1), 0);
  const bossPresent = state.enemies.some((m) => m.isBoss);
  arena.classList.toggle('with-boss', bossPresent);
  // ordinal entre os NÃO-boss (boss fica no slot 0 quando presente → mobs começam em 1)
  const ordOf = (i) => (bossPresent ? Math.max(0, i - 1) : i);
  if (arena.children.length !== state.enemies.length) {
    arena.innerHTML = '';
    state.enemies.forEach((mob, i) => arena.appendChild(buildEnemyCard(mob, ordOf(i), totalMobs, bossPresent)));
  }

  // limpa o HP exibido / impactos pendentes de mobs que saíram (troca de onda)
  const liveIds = new Set(state.enemies.map((m) => m.id));
  for (const id of shownHp.keys()) if (!liveIds.has(id)) shownHp.delete(id);
  if (pendingHits.length) pendingHits = pendingHits.filter((h) => liveIds.has(h.mobId));

  // Alvo do motor: o PRIMEIRO vivo na ordem da onda (frente → trás) recebe a borda dourada
  let targetId = null;
  for (const m of state.enemies) {
    if (m.hp > 0) { targetId = m.id; break; }
  }

  state.enemies.forEach((mob, i) => {
    let card = arena.children[i];
    if (!card || card.dataset.mobId !== String(mob.id)) {
      const fresh = buildEnemyCard(mob, ordOf(i), totalMobs, bossPresent);
      if (card) arena.replaceChild(fresh, card); else arena.appendChild(fresh);
      card = fresh;
    }
    // HP EXIBIDO (bufferizado até o projétil chegar); o motor já aplicou o dano real.
    let vh = displayHp(mob);
    // reconciliação: motor já matou E não há projétil a caminho NEM impacto a agendar
    // (state.fx ainda não virou projétil — renderEnemies roda antes de renderDamageFloats).
    // Sem o check de state.fx, o mob morria ANTES do projétil sair → some antes do corte chegar.
    const projComing = pendingHits.some((h) => h.mobId === mob.id) || state.fx.some((h) => h.mobId === mob.id);
    if (mob.hp <= 0 && !projComing) { vh = 0; shownHp.set(mob.id, 0); }
    // Mob (visualmente) morto SOME — fica fora da cena até a onda virar.
    if (vh <= 0) {
      card.style.display = 'none';
      return;
    }
    card.style.display = '';
    const pct = Math.max(0, (vh / mob.hpMax) * 100);
    card.querySelector('.ecard-fill').style.width = `${pct}%`;
    card.querySelector('.ecard-hp').textContent = `HP: ${formatNumber(Math.max(0, vh))}`;
    card.classList.toggle('target', mob.id === targetId);
    if (!card.dataset.fitted) { fitEnemyName(card); card.dataset.fitted = '1'; }
  });
}

function buildEnemyCard(mob, i, total, bossOut) {
  const pos = mob.isBoss ? BOSS_POINT : spawnPos(i, total, bossOut);
  // tamanho por contagem: ≤3 grande · 4-6 normal · 7-8 médio · 9+ denso
  const size = mob.isBoss ? ' boss' : total <= 3 ? ' big' : total <= 6 ? '' : total <= 8 ? ' mid' : total <= 12 ? ' dense' : ' swarm';
  const artId = mob.art || ENEMY_ART_FALLBACK; // arte vem do mapa (enemies.js)
  const card = document.createElement('article');
  card.className = `cb-enemy emob${size}${mob.gilded ? ' gilded' : ''}`;
  card.dataset.mobId = mob.id;
  card.style.left = `${pos.x}%`;
  card.style.top = `${pos.y}%`;
  // SEM card: sprite de corpo inteiro (recorte transparente) · nome+LV acima ·
  // ATK/HP + barra abaixo · floats de dano sobre o sprite. Gilded = prefixo ✦ + nome dourado.
  card.innerHTML = `
    <div class="emob-label">
      <div class="ecard-name">${mob.isBoss ? '👑 ' : mob.gilded ? '✦ ' : ''}${mob.gilded ? `${mob.gilded} ` : ''}${mob.name}</div>
      <div class="ecard-lvl">LVL ${formatNumber(mob.level)}${mob.isBoss ? ' · BOSS' : mob.gilded ? ' · GILDED' : ''}</div>
    </div>
    <div class="emob-art">
      ${picture(artId, { className: 'emob-art-img', alt: mob.name })}
      <div class="ecard-floats"></div>
    </div>
    <div class="emob-info">
      <div class="emob-statline">
        <span class="ecard-atk">ATK: ${formatNumber(mob.dmg)}</span>
        <span class="ecard-hp">HP: ${formatNumber(mob.hp)}</span>
      </div>
      <div class="ecard-bar"><i class="ecard-fill"></i></div>
    </div>
  `;
  card.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
  return card;
}

// Auto-shrink do nome para não vazar a largura da janela de arte.
function fitEnemyName(card) {
  const el = card.querySelector('.ecard-name');
  if (!el || !el.clientWidth) return;
  el.style.fontSize = '';
  let size = parseFloat(getComputedStyle(el).fontSize);
  let guard = 0;
  while (el.scrollWidth > el.clientWidth && size > 9 && guard++ < 24) {
    size -= 1; el.style.fontSize = `${size}px`;
  }
}

// Ângulo do "tip" na arte do corte (tail→tip ≈ 234° em coords de tela). Usado
// pra rotacionar o projétil de modo que a ponta aponte pro alvo.
const SLASH_NATURAL_ANGLE = 234;
const MAX_PROJ_PER_FRAME = 6; // teto de projéteis por render (evita pileup no APS alto)

// Escala atual do palco (o stage é transformado por scale no fit())
function stageScale() {
  const st = $('#stage') || document.getElementById('stage');
  if (!st) return 1;
  const w = parseFloat(st.style.width) || 1920;
  const rect = st.getBoundingClientRect();
  return rect.width / w || 1;
}
// Centro de um elemento nas coords (não-escaladas) da camada `layer`
function centerIn(layer, el, scale) {
  const r = el.getBoundingClientRect();
  const l = layer.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - l.left) / scale, y: (r.top + r.height / 2 - l.top) / scale };
}

// Duração do voo escalada pelo APS: piso no APS 1 (velocidade base PROJ_BASE_MS);
// acima de 1 fica proporcionalmente mais curta (APS 2 = metade do tempo → dois
// projéteis em sequência), com piso pra não virar piscada no APS altíssimo.
// ⚠️ ligado a COMBAT.waveClearDelay: o beat de troca de onda deve cobrir este voo
// (senão a onda troca antes do projétil do último mob chegar). 200ms ↔ beat 0.3s.
const PROJ_BASE_MS = 200;
function projDuration(aps) {
  return Math.max(75, Math.min(PROJ_BASE_MS, PROJ_BASE_MS / Math.max(1, aps)));
}

// Dispara um corte de luz do card do Seeker até o card do mob alvo
function spawnProjectile(targetCard, isCrit, aps) {
  const fx = document.getElementById('cb-fx');
  const seeker = document.getElementById('cb-seeker');
  if (!fx || !seeker || !targetCard) return;
  const scale = stageScale();
  const fr = fx.getBoundingClientRect();
  const o = centerIn(fx, seeker, scale);
  // alvo pela POSIÇÃO % do card (style.left/top) — funciona mesmo se o mob morreu
  // no golpe e o card já está display:none (getBoundingClientRect daria zero → 0,0).
  const lx = parseFloat(targetCard.style.left) || 50;
  const ty = parseFloat(targetCard.style.top) || 50;
  const t = { x: (lx / 100) * (fr.width / scale), y: (ty / 100) * (fr.height / scale) };
  // origem na borda direita do card do Seeker (parece sair "dele")
  const sr = seeker.getBoundingClientRect();
  o.x = (sr.right - sr.width * 0.12 - fr.left) / scale;
  const ang = Math.atan2(t.y - o.y, t.x - o.x) * 180 / Math.PI;
  const proj = document.createElement('div');
  proj.className = isCrit ? 'cb-proj crit' : 'cb-proj';
  proj.style.left = `${o.x}px`;
  proj.style.top = `${o.y}px`;
  proj.style.setProperty('--dx', `${t.x - o.x}px`);
  proj.style.setProperty('--dy', `${t.y - o.y}px`);
  proj.style.animationDuration = `${projDuration(aps)}ms`;
  proj.innerHTML = `<i class="cb-proj-img" style="transform:rotate(${ang - SLASH_NATURAL_ANGLE}deg)"></i>`;
  proj.addEventListener('animationend', () => proj.remove());
  fx.appendChild(proj);
  // Fallback: garante a remoção mesmo se animationend NÃO disparar (aba oculta /
  // animação interrompida) — senão os projéteis pilham invisíveis (opacity 0) e vazam.
  setTimeout(() => proj.remove(), projDuration(aps) + 200);
}

// ── Dano sincronizado com o projétil ───────────────────────────────────────
// O motor aplica o dano e mata o mob na hora (economia/offline corretos), mas
// VISUALMENTE o HP só cai e o card só some quando o corte de luz chega. A UI
// mantém um HP "exibido" por mob (shownHp) e uma fila de impactos agendados.
const shownHp = new Map();   // mobId -> HP exibido (bufferizado)
let pendingHits = [];        // { mobId, amount, isCrit, impactAt }

// HP exibido do mob (inicia cheio na primeira vez que aparece em cena)
function displayHp(mob) {
  let v = shownHp.get(mob.id);
  if (v === undefined) { v = mob.hpMax; shownHp.set(mob.id, v); }
  return v;
}

// Aplica um hit ao visual: baixa o HP exibido e solta o número de dano no card.
function applyVisualHit(h) {
  const cur = shownHp.get(h.mobId);
  if (cur === undefined) return; // mob já saiu de cena
  shownHp.set(h.mobId, Math.max(0, cur - h.amount));
  const card = document.querySelector(`.cb-enemy[data-mob-id="${h.mobId}"]`);
  if (!card) return;
  const host = card.querySelector('.ecard-floats') || card;
  const el = document.createElement('span');
  el.className = h.isCrit ? 'ecard-dmg crit' : 'ecard-dmg';
  el.textContent = `-${formatNumber(h.amount)} HP`;
  host.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

// Processa os impactos cujo projétil já chegou (chamado a cada frame).
function processPending(now) {
  if (pendingHits.length === 0) return;
  const rest = [];
  for (const h of pendingHits) {
    if (h.impactAt <= now) applyVisualHit(h); else rest.push(h);
  }
  pendingHits = rest;
}

// Consome state.fx: dispara o projétil e AGENDA o impacto (HP/número/morte) pra
// quando o corte chegar. Hits acima do teto de projéteis/frame aplicam na hora.
function renderDamageFloats(state) {
  if (state.fx.length === 0) return;
  let projCount = 0;
  const aps = currentAPS(state);
  const now = performance.now();
  for (const hit of state.fx) {
    const card = document.querySelector(`.cb-enemy[data-mob-id="${hit.mobId}"]`);
    if (!card) continue; // mob já substituído — descarta
    if (projCount < MAX_PROJ_PER_FRAME) {
      spawnProjectile(card, hit.isCrit, aps);
      projCount++;
      pendingHits.push({ mobId: hit.mobId, amount: hit.amount, isCrit: hit.isCrit, impactAt: now + projDuration(aps) });
    } else {
      applyVisualHit({ mobId: hit.mobId, amount: hit.amount, isCrit: hit.isCrit });
    }
  }
  state.fx.length = 0;
}

// Taxas do HUD: EMA das variações reais do state (verdade, não estimativa).
function renderRates(state) {
  const now = performance.now();
  if (!rates) {
    rates = { t: now, lumens: state.lumens, vest: state.vestiges, kills: state.killsTotal,
      lpm: 0, vpm: 0, kpm: 0 };
  } else {
    const dt = (now - rates.t) / 1000;
    if (dt >= 0.5) {
      const inst = 60 / dt;
      const a = 0.35;
      // max(0,…) absorve resets (Convergence zera Lumens/run)
      rates.lpm = rates.lpm * (1 - a) + Math.max(0, state.lumens - rates.lumens) * inst * a;
      rates.vpm = rates.vpm * (1 - a) + Math.max(0, state.vestiges - rates.vest) * inst * a;
      rates.kpm = rates.kpm * (1 - a) + Math.max(0, state.killsTotal - rates.kills) * inst * a;
      rates.t = now; rates.lumens = state.lumens; rates.vest = state.vestiges; rates.kills = state.killsTotal;
    }
  }
  $('cb-kpm').textContent = formatNumber(rates.kpm);
  $('cb-lpm').textContent = formatNumber(rates.lpm);
  $('cb-vpm').textContent = formatNumber(rates.vpm);
  $('cb-kills').textContent = formatNumber(state.killsTotal);
}
```

### `src/ui/components/reward-row.js`

```javascript
// Componente reutilizável: LINHA DE RECOMPENSA emoldurada (ícone real + nome +
// origem + valor). Genérico e sem dependência do offline — pensado para reuso
// em drops de boss, recompensas de Ascension, qualquer tela de ganhos.
//
// API:
//   rewardRow({ icon, glyph, name, source, value, variant }) -> HTMLElement
//   rewardList(items, { className }) -> HTMLElement (container com N linhas)
//
// Campos da linha:
//   icon    — URL da imagem (caminho Vite direto, ex.: 'eclats/.../lumens.png')
//   glyph   — fallback textual quando não há icon (ex.: 'V'); default = inicial do nome
//   name    — título da recompensa (ex.: 'Lumens')
//   source  — origem/legenda (ex.: 'From The Dreaming Wood · Sub-area III')
//   value   — valor formatado (ex.: '+3.2B'); o chamador formata
//   variant — acento de cor: 'gold' | 'ember' | 'eclat' | 'vest' (default: 'eclat')

import './reward-row.css';

const ACCENTS = new Set(['gold', 'ember', 'eclat', 'vest']);

export function rewardRow(data = {}) {
  const { icon, glyph, name = '', source, value, variant } = data;
  const row = document.createElement('div');
  row.className = 'rw-row' + (variant && ACCENTS.has(variant) ? ` ${variant}` : '');

  const iconHTML = icon
    ? `<img src="${icon}" alt="">`
    : `<span class="rw-glyph">${glyph || (name ? name[0] : '◆')}</span>`;

  row.innerHTML = `
    <div class="rw-ic">${iconHTML}</div>
    <div class="rw-meta">
      <div class="rw-nm">${name}</div>
      ${source != null ? `<div class="rw-sub">${source}</div>` : ''}
    </div>
    ${value != null ? `<div class="rw-val">${value}</div>` : ''}
  `;
  return row;
}

export function rewardList(items = [], opts = {}) {
  const list = document.createElement('div');
  list.className = 'rw-list' + (opts.className ? ` ${opts.className}` : '');
  for (const it of items) list.appendChild(rewardRow(it));
  return list;
}
```

### `src/ui/convergence.js`

```javascript
// Overlay cerimonial CONVERGENCE — NÃO é uma tela de navegação. Modal de
// dispersão (o inverso do Awaken): a luz branco-azul reunida se desfaz em
// fragmentos DOURADOS que voltam ao mundo. Compacto — acontece 5-10x por mapa.
//
// Uso: openConvergence(data?) monta e mostra; closeConvergence() fecha.
// ⚠️ Sem lógica de jogo: QUANDO dispara e o CÁLCULO de points/conv_factor vêm
// depois. TODO(lógica): "Converge" deve aplicar a dispersão real no state.

import './convergence.css';

const ornSrc = (n) => `eclats/convergence/ornaments/${n}.png`;

// Dados (o disparador passa os reais via openConvergence({...})).
const PLACEHOLDER = {
  convergences: 0,
  bonus: '+0%',                 // bônus permanente acumulado
  gateLabel: 'Level 1 / 40',
  progressPct: 0,
  able: false,                 // já pode convergir?
  gate: 40,
  grant: '+20%',
  grantTags: ['Damage', 'HP', '+0.5% Gold'],
  tribute: '0',                // Lumens pagos como tributo ao convergir
  returns: ['Your Level (run XP)'],
  keeps: ['Gear rarity', 'Map position', 'Lumens &amp; Vestiges', 'Passives &amp; Mémoires'],
  lore: 'To keep the world, you let it go. Each new threshold lets the Seed disperse the light it gathered — and remember the pattern stronger.',
  note: 'Auto-Convergence available after Ascension I — the Rhythm will carry this rite for you.',
};

// Fragmentos da dispersão (branco-azul no centro → dourado nas bordas)
const PARTICLES = [
  { c: 'c s', x: 46, y: 44 }, { c: 'c', x: 53, y: 56 }, { c: '', x: 34, y: 36 }, { c: 's', x: 64, y: 32 },
  { c: '', x: 70, y: 62 }, { c: 's', x: 28, y: 64 }, { c: '', x: 16, y: 48 }, { c: 's', x: 82, y: 46 },
  { c: '', x: 22, y: 18 }, { c: 's', x: 76, y: 14 }, { c: '', x: 80, y: 84 }, { c: 's', x: 18, y: 84 },
];

// Agora é uma TELA (pane), não overlay: renderConvergence(host, data) preenche um
// container — usado como conteúdo da aba "Convergence" na tela do Seeker.
export function renderConvergence(host, data) {
  const d = { ...PLACEHOLDER, ...(data || {}) };
  host.classList.add('cv-pane');
  host.innerHTML = `
    <div class="cv-burst">
      <div class="cv-core"></div>
      ${PARTICLES.map((p) => `<span class="cv-p ${p.c}" style="left:${p.x}%;top:${p.y}%"></span>`).join('')}
    </div>

    <div class="cv-modal">
      <div class="cv-orn crest"><img src="${ornSrc('crest')}" alt=""></div>
      <div class="cv-orn tl"><img src="${ornSrc('tl')}" alt=""></div>
      <div class="cv-orn tr"><img src="${ornSrc('tr')}" alt=""></div>
      <div class="cv-orn bl"><img src="${ornSrc('bl')}" alt=""></div>
      <div class="cv-orn br"><img src="${ornSrc('br')}" alt=""></div>

      <div class="cv-eyebrow">The rite of dispersal</div>
      <h1 class="cv-title">Convergence</h1>
      <p class="cv-lore">${d.lore}</p>

      <div class="cv-gain-strip">
        <div class="cv-g points">
          <div class="cv-l">Permanent bonus</div>
          <div class="cv-v">${d.bonus}</div>
        </div>
      </div>

      <div class="cv-threshold">
        <div class="cv-thr-top">
          <span class="cv-l">Next threshold</span>
          <span class="cv-thr-v"><b>${d.gateLabel}</b> · ${d.progressPct}%</span>
        </div>
        <div class="cv-bar"><i style="width:${d.progressPct}%"></i></div>
      </div>

      <div class="cv-effect">
        <div class="cv-effect-head">
          <span class="cv-effect-l">Each Convergence grants</span>
          <b class="cv-effect-v">${d.grant}</b>
        </div>
        <div class="cv-effect-chips">${d.grantTags.map((t) => `<span class="cv-chip">${t}</span>`).join('')}</div>
      </div>

      <div class="cv-cols">
        <div class="cv-col lost">
          <h4>Returns to the world</h4>
          <ul>${d.returns.map((r) => `<li>${r}</li>`).join('')}</ul>
        </div>
        <div class="cv-col kept">
          <h4>The Seed keeps</h4>
          <ul>${d.keeps.map((k) => `<li>${k}</li>`).join('')}</ul>
        </div>
      </div>

      <div class="cv-actions">
        <button type="button" class="cv-converge" ${d.able ? '' : 'disabled'}>${d.able ? 'Converge' : `Reach Level ${d.gate}`}</button>
      </div>
    </div>
  `;
  host.querySelector('.cv-converge').addEventListener('click', (e) => {
    if (e.currentTarget.disabled) return;         // ainda não atingiu o threshold
    if (typeof d.onConverge === 'function') d.onConverge();
  });
}
```

### `src/ui/forge.js`

```javascript
// Tela The Forge — redesign A+C: cena full-bleed da forja (Maël) + "Altar da
// Transformação" central com PREVIEW antes→depois do salto de raridade.
// Identidade: rito solene e permanente; o peso vem da atmosfera + do preview.
//
// LIGADA AO MOTOR (src/game/gear.js + economy.js): refino 12:1 (com qty/Max) e
// subir raridade (gate duplo: nível no cap + 40 materiais do tier). Drops já
// caem no combate. Motor intocado — esta tela só consome e mostra.
//
// Contrato: buildForgeView(root, state) monta uma vez; renderForge(state) por tick.

import { formatNumber } from '../core/format.js';
import { picture } from '../data/assets.js';
import { GEAR, GEAR_RARITIES, GEAR_RARITY_LABELS, CRAFT } from '../data/constants.js';
import {
  canRefino, doRefino, canRarityUp, doRarityUp,
  levelCapFor, atLevelCap, rarityUpTier,
  primaryMult, secondaryMult, critOf, critDmgOf, gildedOf,
} from '../game/gear.js';

// Arte: cena full-bleed + materiais (PNG-only, fora do manifesto auto-gerado).
const SCREEN = 'eclats/forge/forge_screen.webp';
const NAMEPLATE = 'eclats/gear/nameplate.webp';
const MAT_IMG = [
  'eclats/forge/t1_kindled.png',
  'eclats/forge/t2_luminous.png',
  'eclats/forge/t3_radiant.png',
  'eclats/forge/t4_converged.png',
];

const MAT_LABELS = ['Kindled', 'Luminous', 'Radiant', 'Converged'];
const MATS = MAT_LABELS.map((label, i) => ({ key: label.toLowerCase(), label, img: MAT_IMG[i] }));
const RLETTER = ['f', 'k', 'l', 'r', 'c'];      // classe de cor por raridade 0..4
const RAR_COLOR = ['#6b7280', '#c96a2a', '#d9a441', '#f0d9a0', '#aac8ff']; // faded..converged
const matColor = (tier) => RAR_COLOR[tier + 1]; // material tier 0..3 = Kindled..Converged
const MAXR = GEAR_RARITIES.length - 1;          // 4 (Converged)

const AFFIX_LABELS = {
  dmg: 'Damage', hp: 'HP', gilded: 'Gilded chance', crit: 'Crit', critDmg: 'Crit dmg',
  aps: 'Attack speed', regen: 'Regen', bossDmg: 'Boss dmg', lumens: 'Lumens',
  xp: 'XP', materiais: 'Materials', erosao: 'Erosion',
};

const FLAVOR = {
  veil: '"The veil was woven from what remained of a fire. Feed it, and it remembers being flame."',
};

// Trilho: grupo MATERIALS (4 materiais, hover = estoque + usos; refino ao
// selecionar) + grupo GEAR (6 peças, próximo tier + requisito).
const MATERIALS = [0, 1, 2, 3].map((t) => ({
  id: `mat_${t}`, type: 'material', group: 'Materials', tier: t,
  name: MAT_LABELS[t], iconImg: MAT_IMG[t],
}));
const RAISES = GEAR.pieces.map((p) => ({ id: p.key, type: 'rarity', group: 'Gear', key: p.key, name: p.name }));
const RECIPES = [...MATERIALS, ...RAISES];

const $ = (id) => document.getElementById(id);
const fmt = (n) => formatNumber(Math.floor(n || 0));

let selectedId = 'edge';
let refineQty = 1;
let S = null;
let lastSig = '';

// Valor textual de um afixo num nível/raridade (primário ou secundário a 30%).
function affixVal(type, level, rarity, isSec) {
  const w = isSec ? 0.30 : 1;
  if (type === 'crit') return `+${(critOf(level, rarity) * w * 100).toFixed(2)}%`;
  if (type === 'gilded') return `+${(gildedOf(level, rarity) * w * 100).toFixed(2)}%`;
  if (type === 'critDmg') return `+${(critDmgOf(level, rarity) * w * 100).toFixed(0)}%`;
  const m = isSec ? secondaryMult(level, rarity) : primaryMult(level, rarity);
  return `×${formatNumber(m)}`;
}

// Linhas de delta antes→depois ao subir R→R+1 (primário + secundários + o NOVO).
function deltaLines(def, level, rar) {
  const lines = [{
    label: AFFIX_LABELS[def.primary],
    before: affixVal(def.primary, level, rar, false),
    after: affixVal(def.primary, level, rar + 1, false),
    isNew: false,
  }];
  for (let i = 0; i < rar; i++) {
    const sec = def.secondary[i];
    lines.push({ label: AFFIX_LABELS[sec], before: affixVal(sec, level, rar, true), after: affixVal(sec, level, rar + 1, true), isNew: false });
  }
  if (def.secondary.length > rar) {
    const sec = def.secondary[rar];
    lines.push({ label: AFFIX_LABELS[sec], before: '—', after: affixVal(sec, level, rar + 1, true), isNew: true });
  }
  return lines;
}

function rarityInfo(state, key) {
  const p = state.gear[key];
  const rar = p.rarity;
  const tier = rarityUpTier(p);
  return {
    def: GEAR.pieces.find((d) => d.key === key), p, rar, tier,
    maxed: rar >= MAXR,
    cap: levelCapFor(p, state),
    atCap: atLevelCap(p, state),
    held: Math.floor(state.materiais[tier] || 0),
    need: CRAFT.rarityUpMaterial,
    ready: canRarityUp(state, key),
  };
}

const maxRefines = (state, tier) => Math.floor((state.materiais[tier] || 0) / CRAFT.refinoRatio);

export function buildForgeView(root, state) {
  S = state;
  root.classList.remove('placeholder');
  root.classList.add('forge');

  const groups = [];
  for (const r of RECIPES) {
    let g = groups.find((x) => x.name === r.group);
    if (!g) { g = { name: r.group, items: [] }; groups.push(g); }
    g.items.push(r);
  }
  const railHTML = groups.map((g) => `
    <div class="fg-rgroup">${g.name}</div>
    ${g.items.map((r) => `
      <button type="button" class="fg-recipe" data-id="${r.id}">
        <span class="fg-ic" id="fg-ic-${r.id}"></span>
        <span class="fg-meta"><span class="fg-nm">${r.name}</span><span class="fg-sub" id="fg-sub-${r.id}"></span></span>
        <span class="fg-st" id="fg-st-${r.id}"></span>
      </button>`).join('')}
  `).join('');

  root.innerHTML = `
    <div class="fg-screen"></div>

    <!-- nameplate do Maël (mesma moldura do Lucius) -->
    <div class="fg-mael-id">
      <div class="fg-mael-text">
        <div class="fg-mael-name">Maël</div>
        <div class="fg-mael-title">Blacksmith of the Ordre</div>
      </div>
    </div>

    <!-- altar central (preview antes→depois / refino) -->
    <section class="fg-altar" id="fg-altar"></section>

    <!-- trilho de receitas (direita) -->
    <aside class="fg-rail">
      <div class="fg-tabs">
        <button type="button" class="on">Forge</button>
        <button type="button" class="locked" disabled title="Reserved — coming later">Reliquats</button>
      </div>
      <div class="fg-rlist" id="fg-rlist">${railHTML}</div>
    </aside>
  `;

  $('fg-rlist').addEventListener('click', (e) => {
    const btn = e.target.closest('.fg-recipe');
    if (!btn) return;
    selectedId = btn.dataset.id;
    refineQty = 1;
    lastSig = '';
    if (S) renderForge(S);
  });

  // Ações do altar (delegação): forjar / refinar / stepper qty / max.
  $('fg-altar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b || b.disabled || !S) return;
    const r = RECIPES.find((x) => x.id === selectedId);
    if (!r) return;
    const act = b.dataset.act;
    const ft = r.type === 'material' ? r.tier : -1; // refino CONSOME este material → próximo tier
    if (act === 'qminus') { refineQty = Math.max(1, refineQty - 1); lastSig = ''; }
    else if (act === 'qplus') { refineQty = Math.min(Math.max(1, maxRefines(S, ft)), refineQty + 1); lastSig = ''; }
    else if (act === 'refine') { for (let i = 0; i < refineQty && doRefino(S, ft); i++) { /* */ } refineQty = 1; lastSig = ''; }
    else if (act === 'refineMax') { let g = 1000; while (g-- > 0 && doRefino(S, ft)) { /* */ } refineQty = 1; lastSig = ''; }
    else if (act === 'forge') { doRarityUp(S, r.key); lastSig = ''; }
    renderForge(S);
  });

  renderForge(state);
}

export function renderForge(state) {
  S = state;
  const m = state.materiais || [0, 0, 0, 0];

  MATS.forEach((mat, i) => {
    const el = $(`fg-mat-${mat.key}`);
    if (el) el.textContent = fmt(m[i]);
    const chip = $(`fg-chip-${mat.key}`);
    if (chip) chip.classList.toggle('empty', !(m[i] > 0));
  });

  for (const r of RECIPES) {
    const btn = document.querySelector(`.fg-recipe[data-id="${r.id}"]`);
    if (!btn) continue;
    const stEl = $(`fg-st-${r.id}`), subEl = $(`fg-sub-${r.id}`), icEl = $(`fg-ic-${r.id}`);
    let status, letter, subText;

    if (r.type === 'material') {
      const t = r.tier;
      status = { cls: 'no', text: '' }; // sem status no material (clicar abre o refino)
      letter = RLETTER[t + 1]; // cor da raridade do material
      subText = `${fmt(m[t])} held`; // quantidade em estoque
      if (icEl && !icEl.dataset.done) { icEl.innerHTML = `<img src="${r.iconImg}" alt="">`; icEl.dataset.done = '1'; }
    } else {
      const info = rarityInfo(state, r.key);
      if (info.maxed) { status = { cls: 'no', text: 'Max' }; subText = `${GEAR_RARITY_LABELS[info.rar]} · top`; }
      else {
        if (info.ready) status = { cls: 'ok', text: 'Ready' };
        else if (!info.atCap) status = { cls: 'no', text: `Lv ${fmt(info.p.level)}/${fmt(info.cap)}` };
        else status = { cls: 'no', text: `Need ${fmt(info.need - info.held)}` };
        subText = `${GEAR_RARITY_LABELS[info.rar]} → ${GEAR_RARITY_LABELS[info.rar + 1]}`;
      }
      letter = RLETTER[info.rar];
      const rarName = GEAR_RARITIES[info.rar];
      if (icEl && icEl.dataset.rar !== rarName) { icEl.dataset.rar = rarName; icEl.innerHTML = picture(`gear.${r.key}_${rarName}`, { alt: r.name }); }
    }
    if (subEl) subEl.textContent = subText;
    if (stEl) { stEl.textContent = status.text; stEl.className = `fg-st ${status.cls}`; }
    btn.className = `fg-recipe r-${letter}` + (r.id === selectedId ? ' sel' : '');
  }

  renderAltar(state, m);
}

// Rebuild do altar só quando a assinatura muda (evita flicker das imagens).
function renderAltar(state, m) {
  const r = RECIPES.find((x) => x.id === selectedId) || RECIPES[0];
  let sig;
  if (r.type === 'material') {
    const above = r.tier < 3 ? Math.floor(m[r.tier + 1] || 0) : 0;
    sig = `M|${r.id}|${Math.floor(m[r.tier] || 0)}|${above}|${refineQty}`;
  } else {
    const i = rarityInfo(state, r.key);
    sig = `G|${r.id}|${i.rar}|${i.p.level}|${i.cap}|${i.held}`;
  }
  if (sig === lastSig) return;
  lastSig = sig;
  const altar = $('fg-altar');
  if (!altar) return;
  if (r.type === 'material') altar.innerHTML = r.tier < 3 ? refineAltar(state, r.tier) : materialInfoAltar(state, r.tier);
  else altar.innerHTML = rarityAltar(state, r);
}

// Linha de requisito: ÍCONE real (diz o que é) + barra grande na cor do material
// com a fração sobreposta + selo ✓/✕. Sem label de texto (o ícone já identifica).
function gateRow(ok, icHTML, frac, pct, tone) {
  const fill = `linear-gradient(90deg, color-mix(in srgb, ${tone} 62%, #000), ${tone})`;
  return `
    <div class="fg-gate ${ok ? 'ok' : 'no'}">
      <span class="fg-gic" style="--tint:${tone}">${icHTML}</span>
      <span class="fg-gbar"><i style="width:${Math.min(100, pct)}%; background:${fill}"></i><em>${frac}</em></span>
      <span class="fg-gseal"><img src="eclats/ui/${ok ? 'seal_ok' : 'seal_no'}.webp" alt=""></span>
    </div>`;
}

function rarityAltar(state, r) {
  const info = rarityInfo(state, r.key);
  const rarName = GEAR_RARITIES[info.rar];
  const flavor = FLAVOR[r.key] || '« The light remembers the shape it is given. »';

  if (info.maxed) {
    return `
      <div class="fg-altar-head"><h3>${r.name}</h3>
        <div class="fg-path"><span class="r-${RLETTER[info.rar]}">${GEAR_RARITY_LABELS[info.rar]}</span></div></div>
      <div class="fg-morph solo">
        <div class="fg-piece r-${RLETTER[info.rar]}">${picture(`gear.${r.key}_${rarName}`, { alt: r.name })}</div>
      </div>
      <p class="fg-altar-note">Already at the highest rarity. The light has fully converged.</p>
      <p class="fg-flavor">${flavor}</p>`;
  }

  const nextName = GEAR_RARITIES[info.rar + 1];
  const lines = deltaLines(info.def, info.p.level, info.rar).map((l) => `
    <div class="fg-dl ${l.isNew ? 'new' : ''}">
      <span class="fg-dlk">${l.label}${l.isNew ? ' <em>NEW</em>' : ''}</span>
      <span class="fg-dlb">${l.before}</span><span class="fg-dla">→</span><span class="fg-dlv">${l.after}</span>
    </div>`).join('');

  return `
    <div class="fg-altar-head"><h3>${r.name}</h3>
      <div class="fg-path">
        <span class="r-${RLETTER[info.rar]}">${GEAR_RARITY_LABELS[info.rar]}</span>
        <span class="fg-fa">→</span>
        <span class="r-${RLETTER[info.rar + 1]}">${GEAR_RARITY_LABELS[info.rar + 1]}</span>
      </div></div>

    <div class="fg-preview">
      <div class="fg-morph">
        <div class="fg-piece r-${RLETTER[info.rar]}">${picture(`gear.${r.key}_${rarName}`, { alt: '' })}</div>
        <div class="fg-spark">➜</div>
        <div class="fg-piece next r-${RLETTER[info.rar + 1]}">${picture(`gear.${r.key}_${nextName}`, { alt: '' })}</div>
      </div>
      <div class="fg-delta">${lines}</div>
    </div>

    <div class="fg-gates">
      ${gateRow(info.atCap, picture(`gear.${r.key}_${rarName}`, { alt: '' }), `Lv ${fmt(info.p.level)} / ${fmt(info.cap)}`, (info.p.level / info.cap) * 100, RAR_COLOR[info.rar])}
      ${gateRow(info.held >= info.need, `<img src="${MAT_IMG[info.tier]}" alt="">`, `${fmt(info.held)} / ${info.need}`, (info.held / info.need) * 100, matColor(info.tier))}
    </div>

    <button type="button" class="fg-forgebtn" data-act="forge" ${info.ready ? '' : 'disabled'}>Forge to ${GEAR_RARITY_LABELS[info.rar + 1]}</button>
    <p class="fg-flavor">${flavor}</p>`;
}

function refineAltar(state, fromTier) {
  const from = MAT_LABELS[fromTier], to = MAT_LABELS[fromTier + 1];
  const held = Math.floor(state.materiais[fromTier] || 0);
  const maxN = maxRefines(state, fromTier);
  const qty = Math.min(Math.max(1, refineQty), Math.max(1, maxN));
  const cost = CRAFT.refinoRatio * qty;
  const ok = held >= cost && maxN >= 1;

  return `
    <div class="fg-altar-head"><h3>Refine ${to}</h3>
      <div class="fg-path"><span class="r-${RLETTER[fromTier]}">${from}</span><span class="fg-fa">→</span><span class="r-${RLETTER[fromTier + 1]}">${to}</span></div></div>

    <div class="fg-morph mat">
      <div class="fg-mpiece">
        <div class="fg-mbox r-${RLETTER[fromTier + 1]}"><img src="${MAT_IMG[fromTier]}" alt=""></div>
        <b>${CRAFT.refinoRatio * qty}</b>
      </div>
      <div class="fg-spark">➜</div>
      <div class="fg-mpiece">
        <div class="fg-mbox r-${RLETTER[fromTier + 2]}"><img src="${MAT_IMG[fromTier + 1]}" alt=""></div>
        <b>${qty}</b>
      </div>
    </div>

    <div class="fg-qty">
      <button type="button" data-act="qminus" ${qty <= 1 ? 'disabled' : ''}>−</button>
      <span class="fg-qn">${qty}</span>
      <button type="button" data-act="qplus" ${qty >= maxN ? 'disabled' : ''}>+</button>
      <button type="button" class="fg-maxq" data-act="refineMax" ${maxN < 1 ? 'disabled' : ''}>Max (${maxN})</button>
    </div>

    <div class="fg-gates">
      ${gateRow(ok, `<img src="${MAT_IMG[fromTier]}" alt="">`, `${fmt(held)} / ${cost}`, (held / cost) * 100, matColor(fromTier))}
    </div>

    <button type="button" class="fg-forgebtn" data-act="refine" ${ok ? '' : 'disabled'}>Refine ${qty} ${to}</button>`;
}

// Altar do material do TOPO (Converged): não há tier acima pra converter.
function materialInfoAltar(state, t) {
  const held = Math.floor(state.materiais[t] || 0);
  return `
    <div class="fg-altar-head"><h3>${MAT_LABELS[t]}</h3>
      <div class="fg-path"><span class="r-${RLETTER[t + 1]}">Highest material</span></div></div>

    <div class="fg-morph mat">
      <div class="fg-mpiece big">
        <div class="fg-mbox r-${RLETTER[t + 1]}"><img src="${MAT_IMG[t]}" alt=""></div>
        <b>${fmt(held)}</b>
      </div>
    </div>`;
}
```

### `src/ui/gear.js`

```javascript
// Tela de Gear / Equipment — REDESIGN paper-doll (alvo: tela de referência).
// Moldura do modal (vitrine dourada) + Armeiro ao centro com os 6 slots das
// peças de Éclat ao redor (3 esq + 3 dir). Cada slot tem Level Up INLINE
// (badge LVL + custo + ação). Multiplicador GLOBAL no rodapé. Stats à esquerda.
// Subir raridade NÃO fica aqui — vai pra Forja (só upgrade de nível aqui).
//
// Contrato: buildGearView(root, state) monta o DOM; renderGear(state) atualiza.

import { formatNumber } from '../core/format.js';
import { picture } from '../data/assets.js';
import { GEAR, GEAR_RARITIES, GEAR_RARITY_LABELS, COMBAT } from '../data/constants.js';
import { apsBonus } from '../game/stats.js';
import {
  primaryMult, secondaryMult, critOf, critDmgOf, gildedOf, activeSecondaries,
  levelCost, atLevelCap, buyLevels,
} from '../game/gear.js';

const $ = (id) => document.getElementById(id);
const pieceDef = (key) => GEAR.pieces.find((p) => p.key === key);
const rarityName = (r) => GEAR_RARITIES[r];

const SLOT_EN = { Arma: 'Weapon', Elmo: 'Helm', Manto: 'Cloak', Manoplas: 'Gauntlets', Amuleto: 'Amulet', Anel: 'Ring' };
const SLOT_LAYOUT = { left: ['edge', 'vigil', 'veil'], right: ['grasp', 'reson', 'band'] };
const AFFIX_LABELS = {
  dmg: 'damage', hp: 'HP', gilded: 'gilded chance', crit: 'crit', critDmg: 'crit damage',
  aps: 'attack speed', regen: 'regen', bossDmg: 'boss damage', lumens: 'Lumens', xp: 'XP',
  materiais: 'materials', erosao: 'erosion',
};
// flat do afixo (CP-4): nível × flatPerLevel × rarityMult × (secundário? secondaryExp)
function affixFlat(type, level, rarity, isSec) {
  const per = GEAR.flatPerLevel[type] || 0;
  return level * per * GEAR.rarityMult[rarity] * (isSec ? GEAR.secondaryExp : 1);
}
// gain de um multiplicador em +% (sem ".0" sobrando), NUNCA "×1"
const affGain = (m) => `+${String(formatNumber((m - 1) * 100)).replace(/\.0$/, '')}%`;

// descritor "per N levels" (estilo Gaiadon): escolhe N pra o número ficar legível
function perN(ratePerLevel, suffix = '', prefix = '+') {
  for (const n of [1, 5, 25, 100, 1000, 10000, 100000]) {
    if (ratePerLevel * n >= 0.1) {
      const val = String(formatNumber(ratePerLevel * n)).replace(/\.0$/, '');
      return `${prefix}${val}${suffix} per ${n === 1 ? 'level' : `${formatNumber(n)} levels`}`;
    }
  }
  return `${prefix}${formatNumber(ratePerLevel * 1e6)}${suffix} per 1M levels`;
}

// Multiplicador GLOBAL de level-up (aplica a qualquer slot)
const MULTS = [1, 10, 100, 1000, 100000];
let mult = 100;

function slotMarkup(def) {
  return `
    <div class="gr-slot" data-key="${def.key}">
      <span class="gr-slot-box">
        <span class="gr-slot-lvl" id="gr-lvl-${def.key}"></span>
        <span class="gr-slot-art" id="gr-art-${def.key}"></span>
        <i class="gr-slot-frame"></i>
        <div class="gr-tip" id="gr-tip-${def.key}"></div>
      </span>
      <span class="gr-slot-actions">
        <button type="button" class="gr-slot-up" id="gr-up-${def.key}">Level up</button>
        <span class="gr-slot-cost" id="gr-cost-${def.key}"></span>
      </span>
    </div>`;
}

// Afixos exibíveis: cada um vira { val, label, per (descritor por nível), primary }.
// Afixos de stat (dano/HP/APS/defesa/regen) viram 2 linhas: FLAT (base) e % (multiplicador).
function affixEntries(def, piece, state) {
  const lvl = piece.level, rar = piece.rarity, rm = GEAR.rarityMult[rar];
  const out = [];
  // Cada afixo vira 1+ linhas no estilo da referência: VALOR + label + "+x per N levels".
  // bonus:true = camada multiplicativa/bônus (cor verde); false = base/flat/chance (branco).
  const add = (type, isSec) => {
    const w = isSec ? GEAR.secondaryExp : 1;
    const prim = !isSec;
    if (type === 'aps') {
      // APS: mostra o GANHO REAL de velocidade (% mais rápido). Só no primário (Amuleto).
      if (!prim) return;
      const pctFaster = state ? (apsBonus(state) / COMBAT.baseAPS) * 100 : 0;
      out.push({ val: `+${pctFaster.toFixed(0)}%`, label: 'attack speed', per: '', primary: true, bonus: false });
      return;
    }
    // Chances planas (crit / gilded) — valor base (branco)
    if (type === 'crit') {
      out.push({ val: `+${formatNumber(critOf(lvl, rar) * w * 100)}%`, label: 'crit rate',
        per: perN(GEAR.critPerLevel * rm * w * 100, '%'), primary: prim, bonus: false });
      return;
    }
    if (type === 'gilded') {
      out.push({ val: `+${formatNumber(gildedOf(lvl, rar) * w * 100)}%`, label: 'gilded chance',
        per: perN(GEAR.gildedPerLevel * rm * w * 100, '%'), primary: prim, bonus: false });
      return;
    }
    if (type === 'critDmg') {
      out.push({ val: `+${formatNumber(critDmgOf(lvl, rar) * w * 100)}%`, label: 'crit dmg',
        per: perN(GEAR.critDmgPerLevel * rm * w * 100, '%'), primary: prim, bonus: true });
      return;
    }
    // FARM (Lumens/XP/Materiais): % linear (afixPctRate). Primário branco · secundário verde.
    if (type === 'lumens' || type === 'xp' || type === 'materiais') {
      out.push({ val: `+${formatNumber(lvl * GEAR.affixPctRate * rm * w * 100)}%`, label: AFFIX_LABELS[type],
        per: perN(GEAR.affixPctRate * rm * w * 100, '%'), primary: prim, bonus: isSec });
      return;
    }
    const label = AFFIX_LABELS[type];
    // 1) FLAT (base, branco) — se a peça tiver flat nesse tipo
    if ((GEAR.flatPerLevel[type] || 0) > 0) {
      out.push({ val: `+${formatNumber(affixFlat(type, lvl, rar, isSec))}`, label,
        per: perN(GEAR.flatPerLevel[type] * rm * w), primary: prim, bonus: false });
    }
    if (isSec) {
      // SECUNDÁRIO: bônus % combinado (verde)
      out.push({ val: `+${formatNumber((secondaryMult(lvl, rar) - 1) * 100)}%`, label: `${label} bonus`, per: '', primary: false, bonus: true });
    } else {
      // 2) BÔNUS % (verde)
      out.push({ val: `+${formatNumber(lvl * GEAR.bonusRate * rm * 100)}%`, label: `${label} bonus`,
        per: perN(GEAR.bonusRate * rm * 100, '%'), primary: true, bonus: true });
      // 3) MULTIPLIER × (verde) — só INCOMUM+ (rar≥1) e nos tipos multiplicativos consumidos
      if (rar >= 1 && (type === 'dmg' || type === 'hp')) {
        const m = 1 + lvl * GEAR.multRate * rm;
        out.push({ val: `×${formatNumber(m)}`, label: `${label} multiplier`,
          per: perN(GEAR.multRate * rm * 100, '%'), primary: true, bonus: true });
      }
    }
  };
  add(def.primary, false);
  // Mostra SÓ os afixos já LIBERADOS (ativos pela raridade); os bloqueados aparecem
  // conforme a raridade sobe (sem listar os travados).
  for (const sec of activeSecondaries(def, rar)) add(sec, true);
  return out;
}
const multLabel = (m) => (m >= 100000 ? '×100K' : `×${m}`);

export function buildGearView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('gear');
  root.innerHTML = `
    <div class="gr-screen"></div>

    <aside class="gr-summary">
      <h3>Equipment Bonuses</h3>
      <div class="gr-breakdown" id="gr-breakdown"></div>
      <p class="gr-note">Raise rarity at The Forge.</p>
    </aside>

    <div class="gr-slots-col side-left">${SLOT_LAYOUT.left.map((k) => slotMarkup(pieceDef(k))).join('')}</div>
    <div class="gr-slots-col side-right">${SLOT_LAYOUT.right.map((k) => slotMarkup(pieceDef(k))).join('')}</div>

    <!-- Identidade do Armeiro, fixada aos pés (mesmo estilo do nameplate do Maël) -->
    <div class="gr-npc-id">
      <div class="gr-npc-text">
        <div class="gr-npc-name">Lucius</div><!-- TODO(canon): ratificar nome no lore bible -->
        <div class="gr-npc-title">Armorer of the Ordre</div>
      </div>
    </div>

    <div class="gr-multbar">
      <span class="gr-multbar-l">Equipment level</span>
      <div class="gr-mults" id="gr-mults">
        ${MULTS.map((m) => `<button type="button" data-m="${m}">${multLabel(m)}</button>`).join('')}
        <button type="button" data-m="max" class="gr-max">LEVEL MAX</button>
      </div>
    </div>
  `;

  // o botão Level up de cada slot upa a peça com o multiplicador global
  root.querySelectorAll('.gr-slot').forEach((el) =>
    el.querySelector('.gr-slot-up').addEventListener('click', () => {
      buyLevels(state, el.dataset.key, mult === 'max' ? 1e9 : mult);
      renderGear(state);
    }));

  // barra de multiplicador (global)
  root.querySelectorAll('.gr-mults button').forEach((b) => {
    b.classList.toggle('active', String(mult) === b.dataset.m);
    b.addEventListener('click', () => {
      mult = b.dataset.m === 'max' ? 'max' : Number(b.dataset.m);
      root.querySelectorAll('.gr-mults button').forEach((x) => x.classList.toggle('active', x === b));
      renderGear(state);
    });
  });
}

export function renderGear(state) {
  // Breakdown POR PEÇA: lista cada afixo LIBERADO (primário flat+% + secundários
  // ativos) com seu valor. Mais detalhado que o agregado por stat.
  const bd = $('gr-breakdown');
  if (bd) {
    // estilo da referência: VALOR + label + "+x per N levels" (verde = camada bônus/multiplier)
    bd.innerHTML = GEAR.pieces.map((def) =>
      affixEntries(def, state.gear[def.key], state).map((e) =>
        `<li class="${e.bonus ? 'bonus' : ''}"><b>${e.val}</b> <span>${e.label}</span><i>${e.per || ''}</i></li>`).join('')
    ).join('');
  }

  for (const def of GEAR.pieces) {
    const slot = document.querySelector(`.gr-slot[data-key="${def.key}"]`);
    if (!slot) continue;
    const piece = state.gear[def.key];
    const rar = rarityName(piece.rarity);
    const capped = atLevelCap(piece, state);
    slot.className = `gr-slot tier-${rar}${capped ? ' capped' : ''}`;

    const art = $(`gr-art-${def.key}`);
    if (art && art.dataset.rar !== rar) {
      art.dataset.rar = rar;
      art.innerHTML = picture(`gear.${def.key}_${rar}`, { alt: def.name });
    }
    $(`gr-lvl-${def.key}`).textContent = `LVL ${formatNumber(piece.level)}`;
    const tip = $(`gr-tip-${def.key}`);
    if (tip) {
      tip.innerHTML = `
        <h4 class="gr-tip-name r-${rar}">${def.name}</h4>
        <div class="gr-tip-sub">${GEAR_RARITY_LABELS[piece.rarity]} ${SLOT_EN[def.slot]} · Lv ${formatNumber(piece.level)}</div>
        <div class="gr-tip-affixes">
          ${affixEntries(def, piece, state).map((e) => e.locked
            ? `<div class="gr-aff locked"><span class="gr-aff-v">🔒</span> <span class="gr-aff-l">${e.label}</span>`
              + `<i class="gr-aff-per">${e.unlock}</i></div>`
            : `<div class="gr-aff ${e.primary ? 'primary' : ''} ${e.bonus ? 'bonus' : ''}">`
              + `<span class="gr-aff-v">${e.val}</span> <span class="gr-aff-l">${e.label}</span>`
              + `<i class="gr-aff-per">${e.per}</i></div>`).join('')}
        </div>`;
    }
    const cost = levelCost(piece);
    const afford = state.lumens >= cost;
    const upBtn = $(`gr-up-${def.key}`);
    upBtn.textContent = capped ? 'Max' : 'Level up';
    upBtn.disabled = capped || !afford;
    const costEl = $(`gr-cost-${def.key}`);
    costEl.innerHTML = capped
      ? `<span class="gr-cost-max">${GEAR_RARITY_LABELS[piece.rarity]} max</span>`
      : `<img class="gr-cost-ic" src="eclats/offline/icons/lumens.png" alt=""><span>${formatNumber(cost)}</span>`;
    slot.classList.toggle('afford', afford && !capped);
    slot.classList.toggle('capped', capped);
  }
}
```

### `src/ui/map.js`

```javascript
// Tela de Mapa (U-3) — Mapa-Múndi + Continente, lendo o state real.
// Dois níveis: mundo (5 mapas, só Map 1 jogável no MVP) → continente (5
// sub-áreas do Map 1). "Entrar" numa sub-área liga o motor (enterSubarea) e
// devolve à tela de Combate.
//
// Contrato: buildMapView(root, state, goToCombat) monta o DOM uma vez;
//           renderMap(state) atualiza estados a cada exibição.

import { formatNumber } from '../core/format.js';
import { picture, bg } from '../data/assets.js';
import { getCurrentMap, subareaLevelRange } from '../game/enemies.js';
import { enterSubarea, travelToMap, subareaUnlockLevel } from '../game/combat.js';
import { perKillEstimate } from '../game/economy.js';

const $ = (id) => document.getElementById(id);

// Nomes canônicos dos mapas (Art Direction §2). O desbloqueio é por progressão:
// um mapa abre quando você ascende até ele (mapId ≤ state.map). Pinos no atlas —
// coords provisórias. TODO(canon): posição exata dos pinos no worldmap.
// Pinos posicionados sobre os reinos da arte nova (worldmap.png — árvore
// celestial com 5 reinos): verde topo-esq · azul topo-dir · dourado
// esq-baixo · violeta dir-baixo · carmesim base central.
const WORLD = [
  { id: 1, name: 'The Dreaming Wood',   pin: { x: 31, y: 26 } },
  { id: 2, name: 'Cavernes Luminis',    pin: { x: 70, y: 25 } },
  { id: 3, name: 'The Ashen Ruins',     pin: { x: 22, y: 60 } },
  { id: 4, name: 'The Fractured Peaks', pin: { x: 81, y: 62 } },
  { id: 5, name: 'Nil Aeternum',        pin: { x: 50, y: 86 } },
];

// Posições das 5 sub-áreas sobre o continente (à esquerda do painel direito,
// que começa em ~78%). Trilha em diagonal subindo, do começo (baixo-esq) ao
// fundo do bosque (topo).
// Map 1 = 9 sub-áreas. Trilha em S: sobe pela esquerda, cruza o centro, desce e
// volta pela direita até o topo-centro (boss final, mais fundo da floresta).
// Layout aprovado pelo Willian (2026-06-14). Coords em % do continente.
const SUB_NODES = [
  { x: 12.5, y: 74 }, // 1 base-esq (Lanternroot)
  { x: 18.5, y: 57 }, // 2 esq-meio
  { x: 20.5, y: 37 }, // 3 esq-alto
  { x: 37.5, y: 44 }, // 4 centro
  { x: 44.5, y: 75 }, // 5 base-centro
  { x: 62.5, y: 74 }, // 6 base-dir
  { x: 76.0, y: 57 }, // 7 dir-meio
  { x: 70.5, y: 36 }, // 8 dir-alto
  { x: 50.0, y: 32 }, // 9 topo-centro (boss final)
];

// Sub-áreas por mapa: imagem + nome temático. Mapas sem arte ainda caem no
// fallback numérico (icon=null). Caminho Vite direto (assets.js é gerado).
const SUBAREAS = {
  1: [
    { icon: 'eclats/enemies/map1/lanternroot_glade',  name: 'Lanternroot Glade' },
    { icon: 'eclats/enemies/map1/glimmercap_hollow',  name: 'Glimmercap Hollow' },
    { icon: 'eclats/enemies/map1/lightfall_stair',    name: 'The Lightfall Stair' },
    { icon: 'eclats/enemies/map1/dreaming_gate',      name: 'The Dreaming Gate' },
    { icon: 'eclats/enemies/map1/verdant_deep',       name: 'The Verdant Deep' },
    { icon: 'eclats/enemies/map1/gilded_mire',        name: 'The Gilded Mire' },
    { icon: 'eclats/enemies/map1/hollowed_grove',     name: 'The Hollowed Grove' },
    { icon: 'eclats/enemies/map1/stillwatch',         name: 'The Stillwatch' },
    { icon: 'eclats/enemies/map1/hollow_heart',       name: 'The Hollow Heart' },
  ],
  2: [
    { icon: 'eclats/enemies/map2/shardbloom_rise',   name: 'Shardbloom Rise' },
    { icon: 'eclats/enemies/map2/hourglass_pillar',  name: 'The Hourglass Pillar' },
    { icon: 'eclats/enemies/map2/prism_stair',       name: 'The Prism Stair' },
    { icon: 'eclats/enemies/map2/lucent_gate',       name: 'The Lucent Gate' },
    { icon: 'eclats/enemies/map2/stillwater_deep',   name: 'The Stillwater Deep' },
  ],
  3: [
    { icon: 'eclats/enemies/map3/cindergate',        name: 'The Cindergate' },
    { icon: 'eclats/enemies/map3/fallen_colonnade',  name: 'The Fallen Colonnade' },
    { icon: 'eclats/enemies/map3/pyre_ascent',       name: 'The Pyre Ascent' },
    { icon: 'eclats/enemies/map3/silent_choir',      name: 'The Silent Choir' },
    { icon: 'eclats/enemies/map3/ashen_throne',      name: 'The Ashen Throne' },
  ],
};
// Fundo do continente por mapa (sobrepõe map.continent quando há arte dedicada)
const CONTINENT_BG = {
  1: 'eclats/enemies/map1/wooding',
  2: 'eclats/enemies/map2/luminis',
  3: 'eclats/enemies/map3/asheruins',
  4: 'eclats/enemies/map4/fracturedpeaks',
  5: 'eclats/enemies/map5/nilaeternum',
};

// Lore curta POR MAPA (condensada da lore bible, em inglês — cada mapa "conta"
// o seu capítulo do mundo). Sem travessões. TODO(canon): revisar textos 2-5
// com o Willian / lore bible final.
const MAP_LORE = {
  1: 'A night forest of bioluminescent mushrooms, veined by a stream of teal-violet light. Far above, a dark vortex turns in the sky, and no one below seems to notice. The first chapter of the world: the Éclats carry something more.',
  2: 'Caves of blue and violet crystals that shine with their own light, where time itself seems to slow. The crystals are Éclats that tried to reunite alone, far from any witness, and came out beautiful and empty. The light learns it cannot mend itself.',
  3: 'The colossal ruins of the first civilization: broken columns, black thorns veined with ember gold, embers that never die. A whole world of light has already fallen here. The lesson the present buries is simple: this has happened before.',
  4: 'The world breaking in slow motion. Shattered peaks float in the air and fissures bleed the golden light of the world itself. La Fracture was never a single event. It is still happening, slow and endless, and now the wounds leak dark.',
  5: 'The territory of the Nothing: a moon fixed red, crimson clouds, a river of red light pouring from the castle gate. No gold survives in this place. Here the world reaches its last page, and asks only to be carried.',
};

// Lore por SUB-ÁREA (Map 1 — segue a trilha até o Guardião). Mapas sem texto
// próprio caem na lore do mapa. TODO(canon): escrever as sub-áreas dos Maps 2-5.
const SUBAREA_LORE = {
  1: [
    'Where the forest begins. A great lantern tree drips slow drops of golden light, and the Fragmented gather beneath it as if they still remembered warmth.',
    'A hollow of giant glowing caps, humming with spores of light. The deeper glow is not the mushrooms. Something underneath them is dreaming.',
    'A stairway climbs beside a fall of pure light. Those who built the steps are gone, but the light still comes down to meet whoever dares to climb.',
    'An arch of stone and vine, flooded with teal light. It is not a door out of the forest. It is the forest deciding who may go deeper.',
    'The oldest grove, an emerald deep where the canopy closes overhead like a vault. The light grows thick and old here. The forest is no longer welcoming you. It is swallowing you.',
    'Past the deep grove, the gold begins. Thin threads of golden filigree creep across the bark and the still water, and the glow here is no longer the forest’s own. Something is gilding the Wood from within.',
    'The deepest grove, ancient and dim. The forest still stands, but thin veins of gold thread through the old bark and roots, quiet and wrong. Something at the heart of the Wood is reaching back this far.',
    'The last clearing before the heart. The Wood holds its breath here, no spores drift, no glow flickers, nothing moves. Above, the dark vortex hangs wide and close, and something ahead is already watching.',
    'The heart of the Dreaming Wood, open to the sky. The vortex hangs directly overhead, and beneath it the forest has drawn all its gold into a single place. At the center waits the Gilded Hollow, the first mirror of the journey, and its first lesson.',
  ],
  2: [
    'The first chamber of the caves, where crystals bloom from the rock like flowers of frozen light. Each one is an Éclat that stopped waiting to be found.',
    'A pillar shaped like an hourglass, dripping slow beads of light. Time runs thinner here. Some drops have been falling since before the Fracture.',
    'A stairway of pure prism, climbing through a column of light. Every step refracts the climber a little more, as if the caves were studying you.',
    'A gate of living crystal at the threshold of the deep. The light beyond it does not flicker. It waits, patient, the way only old things wait.',
    'A still lake that mirrors the cavern perfectly. In the deepest dark beyond it, the crystals tried to become whole again. The Pale Reunion is what they managed.',
  ],
  3: [
    'A gate of scorched stone, still raining embers that never cool. The first civilization built it to welcome pilgrims. Now it only marks where the burning began.',
    'Columns that held a sky of light, now broken at the knee. Gold dust drifts between them like the memory of a crowd that never left.',
    'The grand stair of a temple, climbing into a beam that still falls from nowhere. The faith died with its priests. The light never noticed.',
    'The nave of a roofless cathedral, where the Ash Choir still stands in formation. No sound comes out. The hymn continues anyway.',
    'The heart of the ruins, where the throne room once stood. The king who refused to die with his world is still here, grieving in ember and gold.',
  ],
};

// Recursos por sub-área: ganho POR MOB morto (economy.perKillEstimate).
// Materiais é drop-based → mostra a chance por kill.
function mapResources(state, n) {
  const est = perKillEstimate(state, n);
  return [
    { name: 'Lumens', amount: `+${formatNumber(est.lumens)}` },
    { name: 'Vestiges', amount: `+${formatNumber(est.vestiges)}` },
    { name: `Materials · T${est.tier + 1}`, amount: `${(est.matChance * 100).toFixed(0)}% / kill` },
  ];
}

let goToCombatFn = null;

export function buildMapView(root, state, goToCombat) {
  goToCombatFn = goToCombat;
  root.classList.remove('placeholder');
  root.classList.add('map');
  root.innerHTML = `
    <!-- Nível 1: mundo -->
    <section class="map-world" id="map-world">
      <!-- moldura no aspect da arte (1456×819): a imagem INTEIRA aparece
           (raízes de Nil Aeternum incluídas) e os pinos ficam presos a ela -->
      <div class="map-frame">
        <div class="map-canvas">
          <div class="map-bg world" id="world-bg"></div>
          <div class="map-pins" id="world-pins"></div>
        </div>
      </div>
      <div class="map-title"><b>Le Monde Fracturé</b><span>Choose a realm</span></div>
    </section>

    <!-- Nível 2: continente -->
    <section class="map-continent" id="map-continent" hidden>
      <div class="map-bg" id="cont-bg"></div>
      <button type="button" class="map-back" id="map-back">◀ World</button>
      <svg class="cont-trail" id="cont-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
      <div class="map-nodes" id="cont-nodes"></div>
      <aside class="map-panel" id="cont-panel"></aside>
    </section>
  `;

  // Fundo + pinos do mundo
  $('world-bg').style.backgroundImage = bg('worldmap.atlas');
  const pins = $('world-pins');
  for (const m of WORLD) {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'map-pin';
    pin.dataset.map = m.id;
    pin.style.left = `${m.pin.x}%`;
    pin.style.top = `${m.pin.y}%`;
    pin.innerHTML = `<span class="dot"></span><span class="lbl">${m.name}</span>`;
    // Mapa atual abre o continente; mapas já alcançados (≤ maxMap) viajam até lá
    pin.addEventListener('click', () => {
      if (m.id === state.map) { openContinent(state); return; }
      if (m.id <= (state.maxMap || state.map)) {
        travelToMap(state, m.id);
        openContinent(state);
      }
    });
    pins.appendChild(pin);
  }

  $('map-back').addEventListener('click', () => {
    $('map-continent').hidden = true;
    $('map-world').hidden = false;
  });
}

// Abre a visão de continente do mapa ATUAL
function openContinent(state) {
  $('map-world').hidden = true;
  $('map-continent').hidden = false;
  const map = getCurrentMap(state);
  // fundo: arte dedicada do continente (direct path) ou o crop genérico
  const contArt = CONTINENT_BG[map.id];
  $('cont-bg').style.backgroundImage = contArt ? `url('${contArt}.webp')` : bg(map.continent);
  const subs = SUBAREAS[map.id] || [];
  const nodes = $('cont-nodes');
  nodes.innerHTML = '';
  for (let i = 1; i <= map.subareaCount; i++) {
    const pos = SUB_NODES[i - 1];
    const info = subs[i - 1];
    const node = document.createElement('button');
    node.type = 'button';
    node.className = info ? 'sub-node art' : 'sub-node';
    node.dataset.sub = i;
    node.style.left = `${pos.x}%`;
    node.style.top = `${pos.y}%`;
    node.innerHTML = info
      ? `<span class="ico"><img src="${info.icon}.webp" alt="" loading="eager"></span>`
        + `<span class="nm">${info.name}</span>`
      : `<span class="ring"></span><span class="num">${i}</span>`;
    node.addEventListener('click', () => selectSub(state, i));
    nodes.appendChild(node);
  }
  // Trilha: segmento i liga o nó i ao i+1 (ordem da jornada)
  const trail = $('cont-trail');
  trail.innerHTML = '';
  for (let i = 1; i < map.subareaCount; i++) {
    const a = SUB_NODES[i - 1];
    const b = SUB_NODES[i];
    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ln.setAttribute('x1', a.x); ln.setAttribute('y1', a.y);
    ln.setAttribute('x2', b.x); ln.setAttribute('y2', b.y);
    ln.dataset.seg = i + 1; // o segmento "leva" ao nó i+1
    trail.appendChild(ln);
  }
  // Painel fica oculto até o jogador clicar num ícone de sub-área.
  panelSig = '';
  selectedSub = 0;
  $('cont-panel').hidden = true;
  document.querySelectorAll('.sub-node').forEach((el) => el.classList.remove('selected'));
  renderMap(state);
}

// Seleciona uma sub-área e mostra seus dados no painel.
let selectedSub = 1;
function selectSub(state, n) {
  selectedSub = n;
  $('cont-panel').hidden = false;        // clique no ícone revela o painel
  document.querySelectorAll('.sub-node').forEach((el) =>
    el.classList.toggle('selected', Number(el.dataset.sub) === n));
  renderPanel(state);
}

// Fecha o painel e limpa a seleção (botão X).
function closePanel() {
  selectedSub = 0;
  $('cont-panel').hidden = true;
  document.querySelectorAll('.sub-node').forEach((el) => el.classList.remove('selected'));
}

// Reconstrói o painel só quando muda algo relevante (evita rebuild por tick).
let panelSig = '';
function renderPanel(state) {
  const panel = $('cont-panel');
  if (!panel) return;
  const map = getCurrentMap(state);
  const n = selectedSub;
  const accessible = n <= state.unlockedSubarea;
  // Sem Guardião nas 1..N-1: "cleared" = já passou (liberou a seguinte). A última
  // sub-área (boss final) só fica cleared ao derrotar o boss.
  const cleared = n === map.subareaCount
    ? !!state.bossDefeated[n - 1]
    : n < state.unlockedSubarea;

  const resources = mapResources(state, n);
  const sig = `${n}|${accessible}|${cleared}|${resources.map((r) => r.amount).join(',')}`;
  if (sig === panelSig) return;
  panelSig = sig;

  const range = subareaLevelRange(map, n);
  const packSize = map.packSizes[n - 1];
  const subInfo = (SUBAREAS[map.id] || [])[n - 1];
  const subName = subInfo?.name || `Sub-area ${n}`;
  // Capa do painel = background da própria sub-área (icon + "_bg"); fallback no mapa
  const coverBg = subInfo ? `url('${subInfo.icon}_bg.webp')` : bg(map.bg);
  const status = !accessible ? 'Locked' : (cleared ? 'Cleared' : 'Open');
  const lore = (SUBAREA_LORE[map.id] || [])[n - 1] || MAP_LORE[map.id] || '';
  panel.innerHTML = `
    <button type="button" class="panel-close" id="panel-close" aria-label="Fechar">✕</button>
    <div class="cover" id="cont-cover"></div>
    <div class="panel-body">
      <h2>${map.name}</h2>
      <div class="sub-name">${subName} · ${n}/${map.subareaCount}${cleared ? ' ✓' : ''}</div>
      ${lore ? `<p class="lore">${lore}</p>` : ''}
      <dl class="facts">
        <div><dt>Level</dt><dd>${formatNumber(Math.round(range.lo))}–${formatNumber(Math.round(range.hi))}</dd></div>
        <div><dt>Enemies</dt><dd>${packSize} per wave</dd></div>
        <div><dt>Status</dt><dd>${status}</dd></div>
      </dl>
      <div class="rewards">
        <div class="rewards-h">Resources</div>
        <ul class="rewards-list">
          ${resources.map((r) => `<li><span>${r.name}</span><b>${r.amount}</b></li>`).join('')}
        </ul>
      </div>
      <div class="panel-foot">
        <button type="button" class="enter-btn" id="enter-btn" ${accessible ? '' : 'disabled'}>
          ${accessible ? 'Enter' : `🔒 Reach level ${formatNumber(subareaUnlockLevel(map, n))}`}
        </button>
      </div>
    </div>
  `;
  $('cont-cover').style.backgroundImage = coverBg;
  $('panel-close').addEventListener('click', () => closePanel());
  if (accessible) {
    $('enter-btn').addEventListener('click', () => {
      enterSubarea(state, n);
      if (goToCombatFn) goToCombatFn();
    });
  }
}

export function renderMap(state) {
  const map = getCurrentMap(state);
  // Pinos do mundo: liberado se mapId ≤ maxMap (fronteira); atual destacado; futuros 🔒
  const frontier = state.maxMap || state.map;
  document.querySelectorAll('.map-pin').forEach((pin) => {
    const id = Number(pin.dataset.map);
    pin.classList.toggle('locked', id > frontier);
    pin.classList.toggle('current', id === state.map);
    pin.classList.toggle('done', id !== state.map && id <= frontier);
  });
  // Estados dos nós da sub-área (se o continente estiver montado)
  document.querySelectorAll('.sub-node').forEach((el) => {
    const i = Number(el.dataset.sub);
    el.classList.toggle('current', i === state.subarea);
    el.classList.toggle('cleared', !!state.bossDefeated[i - 1]);
    el.classList.toggle('locked', i > state.unlockedSubarea);
  });
  // Trilha: segmento aceso até onde o jogador já chegou (nó destino liberado)
  document.querySelectorAll('.cont-trail line').forEach((ln) => {
    const dest = Number(ln.dataset.seg);
    ln.classList.toggle('open', dest <= state.unlockedSubarea);
    ln.classList.toggle('locked', dest > state.unlockedSubarea);
  });
  // Mantém o painel coerente com o gate (ex.: boss recém-derrubado libera nó)
  if (!$('map-continent')?.hidden && !$('cont-panel')?.hidden) renderPanel(state);
}
```

### `src/ui/memoires.js`

```javascript
// Tela de Mémoires — LINHA DO TEMPO: UMA era por vez em tela cheia (respiro),
// com um seletor de timeline embaixo (os 5 marcos). A arte da era é a "janela
// da memória"; as relíquias daquela era ficam num espaço generoso ao lado.
// Reuni-las (Éclats) = o Tikkun Olam. Mecânica intacta (era abre na Ascension).
//
// Contrato: buildMemoiresView(root, state); renderMemoires(state).

import { formatNumber } from '../core/format.js';
import { picture } from '../data/assets.js';
import { MEMOIRES, MEMOIRE_ERAS } from '../data/constants.js';
import { nextCost, canBuy, buyMemoire, eraUnlocked, eraProgress } from '../game/memoires.js';

const $ = (id) => document.getElementById(id);

const ERA_ART = { // eras com arte própria
  1: 'eclats/memoires/era1.webp',
  2: 'eclats/memoires/era2.webp',
  3: 'eclats/memoires/era3.webp',
  4: 'eclats/memoires/era4.webp',
  5: 'eclats/memoires/era5.webp',
};
const ERA_BEAT = ['the first light, whole', 'the world takes form', 'the Shattering',
  'the wound of the Void', 'the convergence'];
// passagem de lore por era (visível na tela)
const ERA_LORE = [
  'Before the first word, there was only the Light. Or Ein Sof, whole and without end. Nothing had yet been broken.',
  'The Light poured into vessels, and the world took form: rivers, names, the first songs.',
  'The vessels could not hold so much light. They shattered in HaShevirah, and the Light scattered. Where it tore away, the Void remained: Nihel.',
  'The world bled light into the absence. The fragments wandered, half-asleep, forgetting they were ever one.',
  'One fragment still remembers the whole: the Seed you carry. To gather the scattered light is to repair the world. Tikkun Olam.',
];
// posições de scatter das 3 relíquias por era (left%/top%) — fragmentos perdidos.
// ⚙️ afinar quando a arte 16:9 chegar.
const SCATTER = [
  { x: 60, y: 24 }, { x: 76, y: 52 }, { x: 58, y: 78 },
];

let activeEra = 1;

export function buildMemoiresView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('memoires');
  root.innerHTML = `
    <div class="mm-stage" id="mm-stage"></div>
    <div class="mm-selector" id="mm-selector"></div>
  `;

  // seletor de timeline (5 marcos)
  const sel = $('mm-selector');
  for (let era = 1; era <= 5; era++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `mm-mark era-${era}`;
    b.dataset.era = era;
    b.innerHTML = `<span class="mm-mark-dot"></span>
      <span class="mm-mark-lbl"><b>${MEMOIRE_ERAS[era - 1]}</b><i id="mm-mark-prog-${era}"></i></span>`;
    b.addEventListener('click', () => switchEra(state, era));
    sel.appendChild(b);
  }

  switchEra(state, activeEra);
}

function switchEra(state, era) {
  activeEra = era;
  document.querySelectorAll('.mm-mark').forEach((m) => m.classList.toggle('on', Number(m.dataset.era) === era));

  const stage = $('mm-stage');
  stage.className = `mm-stage era-${era}${ERA_ART[era] ? ' has-art' : ''}`;
  if (ERA_ART[era]) stage.style.setProperty('--art', `url('${ERA_ART[era]}')`);

  // relíquias da era, espalhadas (cada uma numa posição de scatter)
  let order = 0;
  const relics = MEMOIRES.map((m, i) => (m.era === era ? relicHtml(m, i, order++) : '')).join('');

  stage.innerHTML = `
    <div class="mm-stage-veil" id="mm-stage-veil"></div>
    <div class="mm-era-title">
      <span class="mm-era-num">Era ${era}</span>
      <b class="mm-era-name">${MEMOIRE_ERAS[era - 1]}</b>
      <span class="mm-era-beat">${ERA_BEAT[era - 1]}</span>
    </div>
    <p class="mm-lore">${ERA_LORE[era - 1]}</p>
    ${relics}
  `;

  stage.addEventListener('click', (e) => {
    const r = e.target.closest('.mm-relic');
    if (!r) return;
    buyMemoire(state, Number(r.dataset.i));
    renderMemoires(state);
  });

  renderMemoires(state);
}

// Relíquia "espalhada" — só ícone + texto (sem fundo), posicionada no scatter.
function relicHtml(m, i, order) {
  const p = SCATTER[order] || { x: 50, y: 50 };
  return `
    <button type="button" class="mm-relic" data-i="${i}" style="left:${p.x}%;top:${p.y}%">
      <span class="mm-relic-art">${picture(`relics.${m.art}`, { alt: m.name })}</span>
      <span class="mm-relic-text">
        <span class="mm-relic-name">Mémoire ${m.name}</span>
        <span class="mm-relic-eff">${m.label}</span>
        <span class="mm-relic-foot" id="mm-foot-${i}"></span>
      </span>
    </button>`;
}

export function renderMemoires(state) {
  // seletor: progresso + travado por era
  for (let era = 1; era <= 5; era++) {
    const unlocked = eraUnlocked(state, era);
    const mark = document.querySelector(`.mm-mark[data-era="${era}"]`);
    if (mark) mark.classList.toggle('locked', !unlocked);
    const pr = eraProgress(state, era);
    const pe = $(`mm-mark-prog-${era}`);
    if (pe) pe.textContent = unlocked ? `${pr.unlocked}/${pr.total}` : `🔒 Asc ${era}`;
  }

  // véu da era ativa se travada
  const unlockedNow = eraUnlocked(state, activeEra);
  const veil = $('mm-stage-veil');
  if (veil) {
    veil.style.display = unlockedNow ? 'none' : '';
    veil.innerHTML = unlockedNow ? '' : `<span class="mm-lock-i">🔒</span><span>Unlocks at Ascension ${activeEra}</span>`;
  }

  document.querySelectorAll('.mm-relic').forEach((r) => {
    const i = Number(r.dataset.i);
    const level = state.memoires[i];
    r.classList.toggle('owned', level > 0);
    r.classList.toggle('buyable', canBuy(state, i));
    const foot = $(`mm-foot-${i}`);
    if (foot) {
      foot.textContent = (level > 0 ? `Lv ${formatNumber(level)} · ` : '')
        + `${level === 0 ? 'Reunite' : 'Evolve'} · ${formatNumber(nextCost(state, i))} Éclats`;
    }
  });
}
```

### `src/ui/offline.js`

```javascript
// Modal de boas-vindas OFFLINE — "the light did not sleep". Aparece ao abrir o
// jogo (modal de ENTRADA, não overlay cerimonial): tempo fora + eficiência,
// ganhos acumulados (via componente reward-row), teaser do Echo (pré-A3) e
// botão Collect. Monta em #modal-host (separado do #overlay-host).
//
// Uso: openOffline(data?) monta e mostra; closeOffline() fecha. Esc e Collect fecham.
// ⚠️ Sem lógica de jogo: cálculo dos ganhos, regra de eficiência, gatilho na
// inicialização e o resultado da caçada do Echo (pós-A3) são TODO(lógica).
// Os valores abaixo são PLACEHOLDERS do mockup.

import './offline.css';
import { rewardList } from './components/reward-row.js';

const icon = (n) => `eclats/offline/icons/${n}.png`;
const orn = (n) => `eclats/offline/ornaments/${n}.png`;
const ECHO_IMG = 'eclats/offline/echo.png';

// Dados PLACEHOLDER (mockup v2) — substituir pelos reais no disparo.
const PLACEHOLDER = {
  rank: 'Seeker',
  awayText: '7h 24m',
  efficiency: '60%',
  rewards: [
    { icon: icon('lumens'),      name: 'Lumens',            source: 'From The Dreaming Wood · Sub-area III', value: '+3.2B', variant: 'gold' },
    { icon: icon('mat_kindled'), name: 'Kindled materials', source: 'Gathered along the way',               value: '+38',   variant: 'ember' },
    { icon: icon('eclats'),      name: 'Éclats drip',       source: 'The Seed’s steady pull',               value: '+2',    variant: 'eclat' },
  ],
  echo: {
    unlocked: false, asc: 3,
    title: 'The Echo slept.',
    desc: 'After Ascension III, an echo of you will keep hunting while you are gone.',
  },
  lore: '"You closed your eyes. The light counted every moment you were gone — and kept them for you."',
};

const PARTICLES = [
  { c: '', x: 30, y: 24 }, { c: 's', x: 24, y: 60 }, { c: '', x: 72, y: 30 }, { c: 's', x: 78, y: 66 },
  { c: 's', x: 50, y: 14 }, { c: '', x: 64, y: 82 }, { c: 's', x: 36, y: 84 },
];

let host = null;
let onCollect = null;

function modalHost() {
  return document.getElementById('modal-host')
    || document.getElementById('overlay-host')
    || document.getElementById('stage')
    || document.body;
}

export function openOffline(data) {
  const d = { ...PLACEHOLDER, ...(data || {}) };
  const echo = { ...PLACEHOLDER.echo, ...(data && data.echo ? data.echo : {}) };
  onCollect = d.onCollect || null;
  closeOffline(); // instância única

  host = document.createElement('div');
  host.className = 'of-modal-wrap';
  host.innerHTML = `
    <div class="of-combat-bg"></div>
    <div class="of-veil"></div>
    ${PARTICLES.map((p) => `<span class="of-p ${p.c}" style="left:${p.x}%;top:${p.y}%"></span>`).join('')}

    <div class="of-modal">
      <div class="of-orn crest"><img src="${orn('crest')}" alt=""></div>
      <div class="of-orn tl"><img src="${orn('tl')}" alt=""></div>
      <div class="of-orn tr"><img src="${orn('tr')}" alt=""></div>
      <div class="of-orn bl"><img src="${orn('bl')}" alt=""></div>
      <div class="of-orn br"><img src="${orn('br')}" alt=""></div>

      <div class="of-eyebrow">The light did not sleep</div>
      <h1 class="of-title">Welcome back, ${d.rank}</h1>
      <div class="of-away">You were away for <b>${d.awayText}</b> · gathered at <b>${d.efficiency}</b> efficiency</div>

      <div class="of-gains" id="of-gains"></div>

      <div class="of-echo ${echo.unlocked ? 'unlocked' : ''}">
        <div class="of-echo-ic"><img src="${ECHO_IMG}" alt=""></div>
        <div class="of-echo-meta">
          <div class="of-echo-nm">${echo.title}</div>
          <div class="of-echo-sub">${echo.desc}</div>
        </div>
        <div class="of-echo-lk">${echo.unlocked ? '✦' : `🔒 A${echo.asc}`}</div>
      </div>

      <button type="button" class="of-collect">Collect</button>
      <p class="of-lore">${d.lore}</p>
    </div>
  `;

  // Ganhos via componente reutilizável (reward-row)
  host.querySelector('#of-gains').appendChild(rewardList(d.rewards));

  modalHost().appendChild(host);

  host.querySelector('.of-collect').addEventListener('click', () => {
    // TODO(lógica): creditar os ganhos offline calculados no state ao coletar.
    if (typeof onCollect === 'function') onCollect();
    closeOffline();
  });
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => host && host.classList.add('show'));
  return host;
}

export function closeOffline() {
  document.removeEventListener('keydown', onKey);
  if (host && host.parentNode) host.parentNode.removeChild(host);
  host = null;
  onCollect = null;
}

function onKey(e) { if (e.key === 'Escape') closeOffline(); }
```

### `src/ui/passives.js`

```javascript
// Tela de Passivas — 3 árvores em ABAS sobre o FUNDO da Árvore-Mundo.
// Os 15 nós de cada aba são posicionados SOBRE os limbos da arte (POSITIONS):
// base = Grupo 1 → meio = Grupo 2 → copa central = Grupo 3 (motores).
// Redesign visual + apresentação (cartão "Passive", EN, sem jargão). Mecânica
// intacta: maximizar um grupo libera o próximo. Ícones recoloridos por CSS (mask).
//
// ⚙️ POSITIONS é o mapa fácil de afinar (left%/top% por índice) — ajustar no F5.
//
// Contrato: buildPassivesView(root, state); renderPassives(state).

import { formatNumber } from '../core/format.js';
import { url } from '../data/assets.js';
import { PASSIVES, PASSIVE_TREES } from '../data/constants.js';
import {
  passivesUnlocked, nextCost, canBuy, buyPassive, groupUnlocked, isMax, treeProgress,
  passiveDmgMult, passiveEcoMult, passiveHpMult,
} from '../game/passives.js';

const $ = (id) => document.getElementById(id);
const GROUP_SIZE = 5;
let activeTab = 'eclat';

const TREE_SUB = { eclat: 'Combat · damage', vestige: 'Economy · gains', fracture: 'Utility · HP' };
// Árvores que já têm banner de arte próprio (aba com placa). Vestige/Fracture
// entram aqui quando os banners chegarem.
const HAS_BANNER = new Set(['eclat', 'vestige', 'fracture']);
const TREE_STAT = { eclat: 'damage', vestige: 'gains (Lumens & XP)', fracture: 'HP' };
const TREE_MULT = { eclat: passiveDmgMult, vestige: passiveEcoMult, fracture: passiveHpMult };

// Posição de cada nó (left%/top%) sobre a Árvore-Mundo. Índices 0-4 = Grupo 1
// (base), 5-9 = Grupo 2 (meio), 10-14 = Grupo 3 (copa central). ⚙️ AFINAR NO F5.
const POSITIONS = [
  { x: 31, y: 70 }, { x: 41, y: 65 }, { x: 50, y: 63 }, { x: 61, y: 63 }, { x: 73, y: 66 }, // G1 base
  { x: 25, y: 48 }, { x: 37, y: 42 }, { x: 50, y: 39 }, { x: 66, y: 39 }, { x: 79, y: 44 }, // G2 meio
  { x: 35, y: 26 }, { x: 43, y: 20 }, { x: 50, y: 16 }, { x: 59, y: 18 }, { x: 69, y: 23 }, // G3 copa
];

const isEngine = (tree, art) => PASSIVES.engines[tree].includes(art);
const leverOf = (art) => PASSIVES.levers[art];
const roleClass = (tree, art) => (isEngine(tree, art) ? 'role-engine' : leverOf(art) ? 'role-lever' : '');

const LEVER_TEXT = {
  crit: 'Increases your critical chance.',
  aps: 'Increases your attack speed.',
  mobCap: 'More enemies appear on screen at once.',
  material: 'Increases the materials you find.',
  enemyPen: 'Your hits ignore part of enemy defense.',
  enemyReduce: 'Weakens enemy defense.',
};
function effectText(tree, i, level) {
  const stat = TREE_STAT[tree];
  const art = PASSIVES.trees[tree].list[i][1];
  const lev = leverOf(art);
  if (lev) return LEVER_TEXT[lev] || 'A special effect.';
  if (isEngine(tree, art)) {
    return `Multiplies your ${stat}, compounding with every level — the strongest growth in the tree.`;
  }
  const pct = PASSIVES.groupAddPct[Math.floor(i / GROUP_SIZE)] * 100;
  return level > 0
    ? `Increases your ${stat} by ${formatNumber(level * pct)}%.`
    : `Increases your ${stat} by ${formatNumber(pct)}% per level.`;
}

const maskStyle = (tree, key) => {
  const u = url(`passives.${tree}.${key}`);
  return `-webkit-mask-image:url('${u}');mask-image:url('${u}')`;
};

export function buildPassivesView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('passives');
  root.innerHTML = `
    <div class="pv-screen" aria-hidden="true"></div>
    <div class="pv-tabs" id="pv-tabs"></div>
    <div class="pv-body" id="pv-body"></div>
    <div class="pv-lock" id="pv-lock" hidden>
      <div class="glyph">✦</div>
      <h2>The passives sleep</h2>
      <p>The Seed awakens at your <b>first Convergence</b>. Fill the XP wall and converge to open the three trees.</p>
    </div>
  `;

  const tabs = $('pv-tabs');
  for (const tree of PASSIVE_TREES) {
    const t = PASSIVES.trees[tree];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pv-tab ${t.cls}`;
    btn.dataset.tree = tree;
    btn.innerHTML = `
      <span class="pv-emblem"><img class="pv-fruit" src="eclats/passives/fruit_${tree}.webp" alt=""></span>
      <span class="pv-tab-name">${t.label}</span>`;
    btn.addEventListener('click', () => switchTab(state, tree));
    tabs.appendChild(btn);
  }

  switchTab(state, activeTab);
}

// Um nó posicionado sobre a árvore (com cartão-tooltip embutido)
function nodeHtml(tree, i) {
  const [name, key] = PASSIVES.trees[tree].list[i];
  const p = POSITIONS[i];
  const below = i >= 10 ? ' tip-below' : ''; // copa: cartão abre pra baixo
  return `
    <button type="button" class="pv-node ${roleClass(tree, key)}${below}" data-i="${i}"
            style="left:${p.x}%;top:${p.y}%">
      <span class="pv-disc">
        <span class="pv-icon" style="${maskStyle(tree, key)}"></span>
        <i class="pv-ring"></i>
      </span>
      <span class="pv-node-name">${name}</span>
      <span class="pv-node-lvl" id="pv-lvl-${i}"></span>
      <div class="pv-tip">
        <div class="pv-tip-head">
          <span class="pv-tip-icon"><span class="pv-icon" style="${maskStyle(tree, key)}"></span></span>
          <div class="pv-tip-htext">
            <div class="pv-tip-name">${name} <span class="pv-tip-tag">Passive</span></div>
            <div class="pv-tip-lvl" id="pv-tlvl-${i}"></div>
          </div>
        </div>
        <p class="pv-tip-eff" id="pv-teff-${i}"></p>
        <div class="pv-tip-foot" id="pv-tfoot-${i}"></div>
      </div>
    </button>`;
}

function switchTab(state, tree) {
  activeTab = tree;
  document.querySelectorAll('.pv-tab').forEach((b) => b.classList.toggle('active', b.dataset.tree === tree));

  const t = PASSIVES.trees[tree];
  const body = $('pv-body');
  body.className = `pv-body ${t.cls}`;

  let nodes = '';
  for (let i = 0; i < 15; i++) nodes += nodeHtml(tree, i);
  body.innerHTML = `
    <div class="pv-summary" id="pv-summary"></div>
    <div class="pv-tree" id="pv-tree">${nodes}</div>`;

  // clique compra (desbloqueia/evolui) — delegação no palco
  $('pv-tree').addEventListener('click', (e) => {
    const node = e.target.closest('.pv-node');
    if (!node) return;
    buyPassive(state, activeTab, Number(node.dataset.i));
    updateCards(state);
  });

  renderPassives(state);
}

export function renderPassives(state) {
  const unlocked = passivesUnlocked(state);
  $('pv-lock').hidden = unlocked;
  $('pv-tabs').style.visibility = unlocked ? '' : 'hidden';
  $('pv-body').style.visibility = unlocked ? '' : 'hidden';
  if (!unlocked) return;

  for (const tree of PASSIVE_TREES) {
    const pr = treeProgress(state, tree);
    const el = $(`pv-count-${tree}`);
    if (el) el.textContent = `${pr.unlocked}/${pr.total}${pr.maxed ? ` · ✦${pr.maxed}` : ''}`;
  }
  updateCards(state);
}

function updateCards(state) {
  const tree = activeTab;
  const t = PASSIVES.trees[tree];
  const stat = TREE_STAT[tree];

  const summary = $('pv-summary');
  if (summary) {
    summary.innerHTML = `<span class="pv-sum-orb"></span>`
      + `<span class="pv-sum-l">${t.label} bonus</span>`
      + `<span class="pv-sum-div"></span>`
      + `<span class="pv-total">×${formatNumber(TREE_MULT[tree](state))}</span>`
      + `<span class="pv-sum-stat">${stat}</span>`;
  }

  document.querySelectorAll('#pv-tree .pv-node').forEach((node) => {
    const i = Number(node.dataset.i);
    const level = state.passives[tree][i];
    const maxed = isMax(state, tree, i);
    const locked = !groupUnlocked(state, tree, Math.floor(i / GROUP_SIZE));
    node.classList.toggle('maxed', maxed);
    node.classList.toggle('buyable', canBuy(state, tree, i));
    node.classList.toggle('owned', level > 0 && !maxed);
    node.classList.toggle('locked', locked && level === 0);
    node.style.setProperty('--p', (level / PASSIVES.maxLevel).toFixed(3));

    const lvlEl = $(`pv-lvl-${i}`);
    if (lvlEl) lvlEl.textContent = maxed ? '✦' : (level > 0 ? `${level}/${PASSIVES.maxLevel}` : '');

    const tlvl = $(`pv-tlvl-${i}`);
    if (tlvl) tlvl.textContent = `Level ${level}/${PASSIVES.maxLevel}`;
    const teff = $(`pv-teff-${i}`);
    if (teff) teff.textContent = effectText(tree, i, level);
    const tfoot = $(`pv-tfoot-${i}`);
    if (tfoot) {
      tfoot.className = 'pv-tip-foot' + (maxed ? ' max' : locked ? ' locked' : ' cost');
      tfoot.textContent = maxed ? 'Max Level'
        : locked ? 'Locked — max the tier below'
        : `${level === 0 ? 'Unlock' : 'Upgrade'} · ${formatNumber(nextCost(state, tree, i))} Vestiges`;
    }
  });
}
```

### `src/ui/player.js`

```javascript
// Tela do Player / Seeker (U-4) — FICHA do personagem + Convergence.
// Abas: Codex (ficha) | Convergence | Awakening.
// Codex: CARD do Seeker (evolui por tier) + lista de All Stats clicáveis (breakdown).
// Convergence (CP-3b): status (nº de converges, bônus +15%×N), barra de progresso
//   até o gate de NÍVEL, e o botão Converge real (gate por nível; reseta nível da
//   run + nível do gear, mantém raridade/mapa). A cerimônia usa o overlay existente.
//
// Contrato: buildPlayerView(root, state) monta o DOM uma vez;
//           renderPlayer(state) atualiza a cada exibição.

import { formatNumber, formatMult } from '../core/format.js';
import { picture } from '../data/assets.js';
import {
  runLevel, dps, playerHpMax, currentAPS, critChance, critChanceRaw, critDamageMult,
  convMult, convLumensMult, damagePerHit,
} from '../game/stats.js';
import { gearDamageMult, gearHpMult, gearCritAdd, gearCritDmgAdd, gearApsMult, gearLumensMult, gearXpMult } from '../game/gear.js';
import { passiveDmgMult, passiveHpMult, passiveCritAdd, passiveApsMult, passiveEcoMult } from '../game/passives.js';
import { memoireDmgMult, memoireHpMult, memoireCritDmgMult, memoireLumensMult, memoireXpMult } from '../game/memoires.js';
import { ascMult, despertarMult, currentRank, despertarCritRateAdd, despertarCritDmgAdd, despertarLumensMult, despertarXpMult } from '../game/ascension.js';
import { canConverge, doConverge, convGateLevel, convergeProgress } from '../game/convergence.js';
import { renderConvergence } from './convergence.js';
import { COMBAT, CRIT, LEVEL } from '../data/constants.js';
import { buildAwakenPane, renderAwakenPane } from './awaken.js';

// tier romano → número do card (seeker.card_tN). Espelha ascension.js.
const TIER_NUM = { I: 1, II: 2, III: 3, IV: 4, V: 5 };

const $ = (id) => document.getElementById(id);
const pct = (x) => `${(x * 100).toFixed(1)}%`;
// ganho de um multiplicador em +% (×1.30 → "+30%") — mais agradável que "×1.30"
const gainPct = (mult) => `+${formatNumber((mult - 1) * 100).replace(/\.0$/, '')}%`;

// fatores de um breakdown — kind: base | active | idle (×1) | locked (pós-MVP).
// Mostra o GANHO em +% (×1.30 → "+30%"); ×1 vira "+0%".
const M = (label, v, postMvp = false) => {
  const one = Math.abs(v - 1) < 1e-9;
  return { label, disp: gainPct(v), kind: one ? (postMvp ? 'locked' : 'idle') : 'active' };
};
const ADDP = (label, frac) => ({ label, disp: `+${formatNumber(frac * 100)}%`, kind: frac > 1e-9 ? 'active' : 'idle' });

// base FLAT de dano/HP do nível (CP-3): baseDmg + nível×perLevel
const baseDamage = (s) => COMBAT.baseDmg + runLevel(s) * LEVEL.dmgPerLevel;
const baseHp = (s) => COMBAT.playerBaseHp + runLevel(s) * LEVEL.hpPerLevel;
const CONV_BONUS_PER = 0.20; // espelha CONVERGENCE.bonusPerConv (dano/HP, só display)

// ───── catálogo de stats da ficha (modelo CP-3) ─────
const STATS = {
  dmg: {
    label: 'Damage / hit',
    value: (s) => formatNumber(damagePerHit(s)),
    note: 'The damage of a single hit. The base scales with your Level (flat).',
    breakdown: (s) => [
      { label: `Base + Level ${formatNumber(runLevel(s))}`, disp: formatNumber(baseDamage(s)), kind: 'base' },
      M('Convergence', convMult(s)),
      M('Ascension', ascMult(s)),
      M('Despertar', despertarMult(s)),
      M('Gear', gearDamageMult(s), true),
      M('Passives', passiveDmgMult(s), true),
      M('Mémoires', memoireDmgMult(s), true),
    ],
  },
  dps: {
    label: 'DPS',
    value: (s) => formatNumber(dps(s)),
    note: 'Your real damage per second, crits included.',
    breakdown: (s) => {
      const critBonus = 1 + critChance(s) * (critDamageMult(s) - 1);
      return [
        { label: 'Damage / hit', disp: formatNumber(damagePerHit(s)), kind: 'base' },
        { label: 'Attack Speed', disp: `×${currentAPS(s).toFixed(2)}`, kind: 'active' },
        M('Crit bonus', critBonus),
      ];
    },
  },
  aps: {
    label: 'Attack Speed',
    value: (s) => currentAPS(s).toFixed(2),
    note: `How many times you attack each second. Capped at ${COMBAT.apsCap}/s.`,
    breakdown: (s) => {
      const resonance = 1 + 0.3 * Math.log10(Math.max(1, gearApsMult(s)));
      return [
        { label: 'Base', disp: COMBAT.baseAPS.toFixed(2), kind: 'base' },
        M('Fracture Pulse', passiveApsMult(s), true),
        M('Resonance (Gear)', resonance, true),
      ];
    },
  },
  critRate: {
    label: 'Critical Rate',
    value: (s) => pct(critChance(s)),
    note: 'Your chance to crit. Past 100% turns into extra Critical Damage. Comes from Gear & Passives.',
    breakdown: (s) => [
      { label: 'Base', disp: pct(CRIT.baseChance), kind: 'base' },
      ADDP('Gear (Grasp)', gearCritAdd(s)),
      ADDP('Despertar', despertarCritRateAdd(s)),
      ADDP('Passives', passiveCritAdd(s)),
    ],
  },
  critDmg: {
    label: 'Critical Damage',
    value: (s) => formatMult(critDamageMult(s)),
    note: 'How hard your critical hits strike.',
    breakdown: (s) => {
      const overflow = Math.max(0, critChanceRaw(s) - 1);
      return [
        { label: 'Base', disp: formatMult(CRIT.baseDamageMult), kind: 'base' },
        ADDP('Crit overflow', overflow * CRIT.overflowFactor),
        ADDP('Gear', gearCritDmgAdd(s)),
        ADDP('Despertar', despertarCritDmgAdd(s)),
        M('Mémoire de la Forme', memoireCritDmgMult(s), true),
      ];
    },
  },
  hpMax: {
    label: 'HP Max',
    value: (s) => formatNumber(playerHpMax(s)),
    note: 'Your maximum health. The base scales with your Level (flat).',
    breakdown: (s) => [
      { label: `Base + Level ${formatNumber(runLevel(s))}`, disp: formatNumber(baseHp(s)), kind: 'base' },
      M('Convergence', convMult(s)),
      M('Ascension', ascMult(s)),
      M('Despertar', despertarMult(s)),
      M('Gear', gearHpMult(s), true),
      M('Passives', passiveHpMult(s), true),
      M('Mémoires', memoireHpMult(s), true),
    ],
  },
  lumensMult: {
    label: 'Lumens / kill',
    value: (s) => gainPct(convLumensMult(s) * despertarLumensMult(s) * gearLumensMult(s) * passiveEcoMult(s) * memoireLumensMult(s)),
    note: 'Multiplier on the Lumens (Gold) you earn from each kill.',
    breakdown: (s) => [
      { label: 'Base', disp: formatMult(1), kind: 'base' },
      M('Convergence', convLumensMult(s)),   // Gold: +0,5%/conv (canal próprio)
      M('Despertar', despertarLumensMult(s)),
      M('Gear', gearLumensMult(s), true),
      M('Passives', passiveEcoMult(s), true),
      M('Mémoires', memoireLumensMult(s), true),
    ],
  },
  xpMult: {
    label: 'XP / kill',
    value: (s) => gainPct(despertarXpMult(s) * gearXpMult(s) * passiveEcoMult(s) * memoireXpMult(s)),
    note: 'Multiplier on the XP you earn from each kill. (Convergence does not boost XP.)',
    breakdown: (s) => [
      { label: 'Base', disp: formatMult(1), kind: 'base' },
      M('Despertar', despertarXpMult(s)),
      M('Gear', gearXpMult(s), true),
      M('Passives', passiveEcoMult(s), true),
      M('Mémoires', memoireXpMult(s), true),
    ],
  },
  level: {
    label: 'Level',
    value: (s) => formatNumber(runLevel(s)),
    note: 'Your current Level, from this run’s XP. Each level gives flat Damage and HP. Resets on Convergence.',
    breakdown: (s) => [
      { label: 'Run XP', disp: formatNumber(s.xpRun), kind: 'base' },
      ADDP('Damage / level', LEVEL.dmgPerLevel / 100),
      ADDP('HP / level', LEVEL.hpPerLevel / 100),
    ],
  },
  convergence: {
    label: 'Convergence',
    value: (s) => gainPct(convMult(s)),
    note: 'A permanent boost to Damage & HP (+20% each per Convergence) and Gold (+0.5%). XP is unaffected.',
    breakdown: (s) => [
      { label: 'Base', disp: formatMult(1), kind: 'base' },
      ADDP(`Convergences (${formatNumber(s.convergences)})`, CONV_BONUS_PER * s.convergences),
    ],
  },
};

const STAT_GROUPS = [
  { title: 'Combat', ids: ['dmg', 'dps', 'aps', 'critRate', 'critDmg', 'hpMax'] },
  { title: 'Economy', ids: ['lumensMult', 'xpMult'] },
  { title: 'Progression', ids: ['level', 'convergence'] },
];

let openStatId = null;
let activePane = 'codex'; // codex | converge | awaken

export function buildPlayerView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('player');
  root.innerHTML = `
    <div class="pl-tabs">
      <button type="button" class="pl-tab on" data-tab="codex">Codex</button>
      <button type="button" class="pl-tab" data-tab="converge">Convergence</button>
      <button type="button" class="pl-tab" data-tab="awaken">Awakening</button>
    </div>

    <div class="pl-pane pl-codex-pane" data-pane="codex">
    <div class="pl-screen" aria-hidden="true"></div>
    <aside class="pl-hero">
      <div class="pl-hero-art">
        ${picture('seeker.card_t1', { className: 'pl-portrait-img', alt: 'The Seeker' })}
      </div>
      <div class="pl-hero-inner">
        <h2 class="pl-name">The Seeker</h2>
        <div class="pl-tier" id="pl-tier">Order of the Watchers · Tier I</div>
        <div class="pl-hero-vitals">
          <div class="pl-vital">
            <span class="pl-vital-lbl">Level</span>
            <b class="pl-vital-val" id="pl-level">1</b>
          </div>
        </div>
      </div>
    </aside>

    <div class="pl-sheet">
      <div class="pl-codex-panel">
        <h3 class="pl-codex-title"><span id="pl-codex-rank">Seeker</span> Codex</h3>
        <p class="pl-codex-motto">Carry the light onward. Through you, the world remembers how to mend.</p>
        <div class="pl-stats-list" id="pl-stats-list"></div>
      </div>
    </div>
    </div><!-- /pl-codex-pane -->

    <!-- Convergence: tela (pane) renderizada por renderConvergence -->
    <div class="pl-pane pl-conv-pane" data-pane="converge" hidden></div>

    <div class="pl-pane pl-awaken-pane" data-pane="awaken" hidden></div>

    <!-- breakdown (modal) -->
    <div class="pl-modal" id="pl-modal" hidden>
      <div class="pl-modal-back" id="pl-modal-back"></div>
      <div class="pl-modal-card">
        <button type="button" class="pl-modal-x" id="pl-modal-x" aria-label="Close">×</button>
        <div class="pl-modal-head">
          <h3 id="pl-modal-title"></h3>
          <div class="pl-modal-total" id="pl-modal-total"></div>
        </div>
        <div class="pl-modal-rows" id="pl-modal-rows"></div>
        <p class="pl-modal-note" id="pl-modal-note"></p>
      </div>
    </div>
  `;

  $('pl-stats-list').innerHTML = STAT_GROUPS.map((g) =>
    `<div class="pl-section">
       <h4 class="pl-sec-h">${g.title}</h4>
       ${g.ids.map((id) =>
        `<button type="button" class="pl-stat" data-stat="${id}">
           <span class="pl-stat-l">${STATS[id].label}</span>
           <span class="pl-stat-v" id="plv-${id}">—</span>
         </button>`).join('')}
     </div>`).join('');

  root.querySelectorAll('[data-stat]').forEach((el) =>
    el.addEventListener('click', () => openStat(state, el.dataset.stat)));

  $('pl-modal-x').addEventListener('click', closeModal);
  $('pl-modal-back').addEventListener('click', closeModal);

  // Aba Awakening — pane no formato Gear/Forge (módulo próprio)
  buildAwakenPane(root.querySelector('.pl-awaken-pane'), state);

  // Troca de abas Codex | Convergence | Awakening
  root.querySelectorAll('.pl-tab').forEach((tab) =>
    tab.addEventListener('click', () => {
      activePane = tab.dataset.tab;
      root.querySelectorAll('.pl-tab').forEach((t) => t.classList.toggle('on', t === tab));
      root.querySelectorAll('.pl-pane').forEach((p) => { p.hidden = p.dataset.pane !== activePane; });
      if (activePane === 'awaken') renderAwakenPane(state);
      if (activePane === 'converge') renderConvergence(root.querySelector('.pl-conv-pane'), convData(state));
    }));
}

// "The Seed keeps": só o que está LIBERADO. Map 1 = só Gear; os sistemas Map 2+
// (posição no mapa multi, Vestiges, Passivas, Mémoires) entram quando desbloqueiam.
function convKeeps(state) {
  const list = ['Gear rarity &amp; levels'];
  if ((state.maxMap || state.map || 1) >= 2) list.push('Map position', 'Vestiges', 'Passives &amp; Mémoires');
  return list;
}

// Monta os dados reais do overlay de Convergence a partir do state.
export function convData(state) {
  const lvl = runLevel(state);
  const gate = convGateLevel(state.convergences);
  return {
    convergences: formatNumber(state.convergences),
    bonus: gainPct(convMult(state)),
    gateLabel: `Level ${formatNumber(lvl)} / ${formatNumber(gate)}`,
    progressPct: Math.floor(convergeProgress(state) * 100),
    able: canConverge(state),
    gate: formatNumber(gate),
    grant: '+20%',
    grantTags: ['Damage', 'HP', '+0.5% Gold'],
    // RESETA ao convergir: LVL (nível da run) + Lumens. MANTÉM: gear.
    returns: ['LVL', 'Lumens'],
    keeps: convKeeps(state),
    lore: 'To keep the world, you let it go. Each new threshold lets the Seed disperse the light it gathered — and remember the pattern stronger.',
    note: 'Auto-Convergence available after Ascension I — the Rhythm will carry this rite for you.',
    onConverge: () => { doConverge(state); renderPlayer(state); },
  };
}

function openStat(state, id) {
  if (!STATS[id]) return;
  openStatId = id;
  renderModal(state);
  $('pl-modal').hidden = false;
}
function closeModal() {
  openStatId = null;
  $('pl-modal').hidden = true;
}
function renderModal(state) {
  if (!openStatId) return;
  const st = STATS[openStatId];
  $('pl-modal-title').textContent = st.label;
  $('pl-modal-total').textContent = st.value(state);
  $('pl-modal-rows').innerHTML = st.breakdown(state).map((r) =>
    `<div class="pl-mrow ${r.kind}">
       <span>${r.label}${r.kind === 'locked' ? ' <i class="pl-lock">🔒</i>' : ''}</span>
       <b>${r.disp}</b>
     </div>`).join('');
  const note = $('pl-modal-note');
  note.textContent = st.note || '';
  note.hidden = !st.note;
}

export function renderPlayer(state) {
  if (activePane === 'awaken') renderAwakenPane(state);
  if (activePane === 'converge') {
    const cp = document.querySelector('#view-player .pl-conv-pane');
    if (cp) renderConvergence(cp, convData(state));
  }

  const rank = currentRank(state);
  $('pl-codex-rank').textContent = rank.name;
  const hero = document.querySelector('#view-player .pl-hero');
  if (hero) {
    const nm = hero.querySelector('.pl-name');
    if (nm) nm.textContent = rank.name;
    const tierEl = hero.querySelector('#pl-tier');
    if (tierEl) tierEl.textContent = `The Seeker · Tier ${rank.tier}`;
    const cardId = `seeker.card_t${TIER_NUM[rank.tier] || 1}`;
    const port = hero.querySelector('.pl-hero-art');
    if (port && port.dataset.card !== cardId) {
      port.dataset.card = cardId;
      port.innerHTML = picture(cardId, { className: 'pl-portrait-img', alt: 'The Seeker' });
    }
    hero.querySelectorAll('img').forEach((im) => { im.loading = 'eager'; });
  }
  // Level exibido = o nível da RUN (que dá os stats e reseta na Convergence)
  $('pl-level').textContent = formatNumber(runLevel(state));

  for (const g of STAT_GROUPS) for (const id of g.ids) $(`plv-${id}`).textContent = STATS[id].value(state);

  if (openStatId) renderModal(state);
}
```

### `src/ui/ui.js`

```javascript
// UI — casca Éclats (unificação). Mantém o contrato que src/main.js consome:
// setupUI / renderUI / showOfflineSummary.
// Chrome do mockup: nav (topo-esq) + moedas (topo-dir) + stage 1920×1080.
// Todas as 7 telas (Combate, Mapa, Player, Gear, Passivas, Mémoires, Ascension)
// são reais e ligadas ao motor. Nenhuma nav fica mais bloqueada.

import './tokens.css';
import './shell.css';
import './combat.css';
import './map.css';
import './player.css';
import './gear.css';
import './forge.css';
import './passives.css';
import './memoires.css';
import './ascension.css';
import './mobile.css';
import { formatNumber } from '../core/format.js';
import { picture, bg } from '../data/assets.js';
import { buildCombatView, renderCombat } from './combat.js';
import { buildMapView, renderMap } from './map.js';
import { buildPlayerView, renderPlayer, convData } from './player.js';
import { renderConvergence } from './convergence.js';
import { doConverge } from '../game/convergence.js';
import { buildGearView, renderGear } from './gear.js';
import { buildForgeView, renderForge } from './forge.js';
import { buildPassivesView, renderPassives } from './passives.js';
import { buildMemoiresView, renderMemoires } from './memoires.js';
import { buildAscensionView, renderAscension } from './ascension.js';
import { getCurrentMap } from '../game/enemies.js';

const $ = (sel, root = document) => root.querySelector(sel);

let gameState = null;       // ref do state (pra saber o mapa atual no chrome)
let backdropMap = null;     // último mapa pintado no backdrop (evita repintar por tick)

// Fundo desfocado do palco = mapa ATUAL do jogador (telas de menu)
function paintBackdrop() {
  if (!gameState) return;
  const map = getCurrentMap(gameState);
  if (backdropMap === map.id) return;
  backdropMap = map.id;
  $('#stage-backdrop').style.backgroundImage = bg(map.bg);
}

// moedas do topo — leem o state real
// 3ª moeda = Éclats (§10), fonte das Mémoires. Usa o ícone de convergence
// (branco-azul) como placeholder até haver ícone próprio. TODO(canon): ícone Éclats.
// ícones: PNGs dedicados das moedas (caminho Vite direto em public/)
const COINS = [
  { id: 'lumens',   src: 'eclats/offline/icons/lumens.png',   name: 'Lumens',   get: (s) => formatNumber(s.lumens) },
  // Vestiges: sink (Passivas/Ascension/Despertar) é Map 2+. Esconde no Map 1 — só
  // aparece quando o jogador alcança o Map 2. ⏳ TODO: tooltip da Vestige.
  { id: 'vestiges', src: 'eclats/offline/icons/vestiges.png', name: 'Vestiges', get: (s) => formatNumber(s.vestiges),
    visible: (s) => (s.maxMap || s.map || 1) >= 2 },
  // Éclats: fonte = Mémoires/Ascension (Map 2+). Esconde no Map 1 (igual Vestiges).
  { id: 'eclats',   src: 'eclats/offline/icons/eclats.png',   name: 'Éclats',   get: (s) => formatNumber(s.eclats),
    visible: (s) => (s.maxMap || s.map || 1) >= 2 },
];

// telas. icon = id de nav confirmado pelo Willian. locked = pós-MVP da main.
const VIEWS = [
  { id: 'combat',      label: 'Combate',     icon: 'icons.nav.2' },
  { id: 'map',         label: 'Mapa',        icon: 'icons.nav.5' },
  { id: 'player',      label: 'Seeker',      icon: 'icons.nav.1' },
  { id: 'convergence', label: 'Convergence', icon: 'icons.currency.convergence' },
  { id: 'gear',        label: 'Gear',        icon: 'icons.nav.4' },
  { id: 'forge',     label: 'The Forge', iconSrc: 'eclats/icons/nav/nav_forge.webp' },
  { id: 'passives',  label: 'Passivas',  icon: 'icons.nav.3' },
  { id: 'memoires',  label: 'Mémoires',  icon: 'icons.nav.6' },
  { id: 'ascension', label: 'Ascension', icon: 'icons.nav.7' },
];

let current = 'combat';

// Dados da tela de Convergence (reusa o builder do Seeker); ao convergir, refresca a casca.
function convergeData(state) {
  return { ...convData(state), onConverge: () => { doConverge(state); renderUI(state); } };
}

export function setupUI(state) {
  gameState = state;
  buildCoins();
  buildNav();
  buildViews(state);
  ensureOverlayHost();
  show('combat');
  fit();
  window.addEventListener('resize', fit);
}

// HUD de moedas (.chud): 3 pills agrupadas no vocabulário visual da navbar.
// Os spans #coin-<id> são atualizados pelo renderUI (fluxo de render existente).
function buildCoins() {
  $('.coins').innerHTML =
    `<div class="chud">` + COINS.map((c) =>
      `<div class="chud-pill chud-${c.id}" title="${c.name}">` +
      `<img class="chud-ico" src="${c.src}" alt="${c.name}">` +
      `<span class="chud-v" id="coin-${c.id}">0</span></div>`
    ).join('') + `</div>`;
}

function buildNav() {
  const nav = $('.nav'); nav.innerHTML = '';
  for (const v of VIEWS) {
    const btn = document.createElement('button');
    btn.className = 'navbtn' + (v.locked ? ' locked' : '') + (v.glyph && !v.icon ? ' provisional' : '');
    btn.dataset.view = v.id;
    btn.title = v.locked ? `${v.label} — pós-MVP` : v.label;
    const ico = v.iconSrc
      ? `<img src="${v.iconSrc}" alt="${v.label}">`
      : (v.glyph ? v.glyph : picture(v.icon, { alt: v.label }));
    btn.innerHTML = `<span class="ico">${ico}</span><span class="lbl">${v.label}</span>`;
    if (!v.locked) btn.addEventListener('click', () => show(v.id));
    nav.appendChild(btn);
  }
}

function buildViews(state) {
  const main = $('.stage-main'); main.innerHTML = '';
  for (const v of VIEWS) {
    const view = document.createElement('div');
    view.id = 'view-' + v.id;

    // Combate: cena real ligada ao motor (U-2).
    if (v.id === 'combat') {
      view.className = 'view';
      main.appendChild(view);
      buildCombatView(view, state);
      continue;
    }
    // Mapa: mundo + continente lendo o state (U-3). Entrar → volta ao Combate.
    if (v.id === 'map') {
      view.className = 'view';
      main.appendChild(view);
      buildMapView(view, state, () => show('combat'));
      continue;
    }
    // Player: retrato + Gold Stats + Convergence lendo o state (U-4).
    if (v.id === 'player') {
      view.className = 'view';
      main.appendChild(view);
      buildPlayerView(view, state);
      continue;
    }
    // Convergence: tela própria (atalho do rito que também vive no Seeker).
    if (v.id === 'convergence') {
      view.className = 'view';
      main.appendChild(view);
      renderConvergence(view, convergeData(state));
      continue;
    }
    // Gear: 6 peças upáveis com Lumens (pós-MVP, valores provisórios).
    if (v.id === 'gear') {
      view.className = 'view';
      main.appendChild(view);
      buildGearView(view, state);
      continue;
    }
    // The Forge: estação de craft do ferreiro Maël (só a tela; lógica TODO).
    if (v.id === 'forge') {
      view.className = 'view';
      main.appendChild(view);
      buildForgeView(view, state);
      continue;
    }
    // Passivas: 3 árvores upáveis com Vestiges (pós-MVP, efeitos provisórios).
    if (v.id === 'passives') {
      view.className = 'view';
      main.appendChild(view);
      buildPassivesView(view, state);
      continue;
    }
    // Mémoires: 15 relíquias upáveis com Éclats; Clarté é o motor (pós-MVP).
    if (v.id === 'memoires') {
      view.className = 'view';
      main.appendChild(view);
      buildMemoiresView(view, state);
      continue;
    }
    // Ascension: marcos da Ordre — boss + Vestiges → asc_mult + Éclats (pós-MVP).
    if (v.id === 'ascension') {
      view.className = 'view';
      main.appendChild(view);
      buildAscensionView(view, state);
      continue;
    }

    // (todas as telas têm implementação real; nada cai mais no placeholder)
    view.className = 'view placeholder';
    const glyph = v.glyph
      ? `<div class="glyph" style="font-size:96px;display:grid;place-items:center;opacity:.5">${v.glyph}</div>`
      : `<div class="glyph">${picture(v.icon, { alt: v.label })}</div>`;
    view.innerHTML = `<div>${glyph}<h2>${v.label}</h2><div class="cp">pós-MVP</div></div>`;
    main.appendChild(view);
  }
}

// Host único para overlays cerimoniais (Awakening, Convergence). Fica dentro
// de #stage para escalar junto com o fit() do palco 1920×1080. Os módulos de
// overlay (awakening.js / convergence.js) montam sua raiz aqui.
// Também cria #modal-host (acima), para modais de ENTRADA não-cerimoniais
// (ex.: boas-vindas offline) — separado por design.
function ensureOverlayHost() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  if (!document.getElementById('overlay-host')) {
    const host = document.createElement('div');
    host.id = 'overlay-host';
    stage.appendChild(host);
  }
  if (!document.getElementById('modal-host')) {
    const modal = document.createElement('div');
    modal.id = 'modal-host';
    stage.appendChild(modal);
  }
}

function show(id) {
  current = id;
  document.querySelectorAll('.view').forEach((n) => n.classList.toggle('active', n.id === 'view-' + id));
  document.querySelectorAll('.navbtn').forEach((n) => n.classList.toggle('active', n.dataset.view === id));
  paintBackdrop();
  fit(); // re-avalia o modo (só o Gear reflui no mobile; o resto fica escalado)
}

function fit() {
  const W = window.innerWidth, H = window.innerHeight;
  const stage = $('#stage');
  // MODO MOBILE: janela estreita (celular, ex. Redmi Note 13 Pro). Decisão Willian:
  // só o GEAR precisava melhorar — o resto já é jogável escalado. Então SÓ a tela de
  // Gear reflui em lista fluida (body.m-flow); as outras telas seguem escaladas.
  const isMobile = W <= 920;
  const flow = isMobile && current === 'gear';
  document.body.classList.toggle('mobile', isMobile);
  document.body.classList.toggle('m-flow', flow);
  if (flow) {
    stage.style.transform = 'none';
    stage.style.width = '';
    document.documentElement.style.removeProperty('--stage-w');
    $('#toosmall').style.display = 'none';
    return;
  }
  // Palco com altura de referência fixa (1080) e LARGURA DINÂMICA seguindo a
  // proporção da janela: o jogo preenche a tela toda (sem letterbox) em
  // qualquer aspect ratio, sem distorcer nem cortar. Clamp de segurança para
  // proporções extremas (ultrawide / retrato).
  const stageW = Math.max(1280, Math.min(2560, Math.round(1080 * (W / H))));
  stage.style.width = `${stageW}px`;
  document.documentElement.style.setProperty('--stage-w', `${stageW}px`);
  const s = Math.min(W / stageW, H / 1080);
  // Centraliza explicitamente (origem top-left): evita o bug de centralização
  // via grid em telas menores que o palco (celular renderizava o palco fora da área).
  const x = (W - stageW * s) / 2;
  const y = (H - 1080 * s) / 2;
  stage.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  $('#toosmall').style.display = s < 0.12 ? 'grid' : 'none';
}

export function renderUI(state) {
  gameState = state;
  paintBackdrop(); // mantém o backdrop no mapa atual (atualiza ao viajar/ascender)
  // moedas (state real) — algumas só aparecem quando desbloqueadas (ex.: Vestiges)
  for (const c of COINS) {
    const el = document.getElementById('coin-' + c.id);
    if (el) el.textContent = c.get(state);
    const pill = document.querySelector('.chud-' + c.id);
    if (pill) pill.style.display = (c.visible && !c.visible(state)) ? 'none' : '';
  }
  // só renderiza a tela ativa (por custo)
  if (current === 'combat') renderCombat(state);
  else if (current === 'map') renderMap(state);
  else if (current === 'player') renderPlayer(state);
  else if (current === 'convergence') renderConvergence(document.getElementById('view-convergence'), convergeData(state));
  else if (current === 'gear') renderGear(state);
  else if (current === 'forge') renderForge(state);
  else if (current === 'passives') renderPassives(state);
  else if (current === 'memoires') renderMemoires(state);
  else if (current === 'ascension') renderAscension(state);
}

// Resumo de progresso offline (§15) — toast simples sobre a casca
export function showOfflineSummary(summary) {
  const hours = summary.seconds / 3600;
  const time = hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(summary.seconds / 60)}min`;
  const retreat = summary.retreated ? ' Recuou até o ponto sustentável.' : '';
  let el = document.getElementById('offline-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'offline-toast';
    document.getElementById('screen').appendChild(el);
  }
  el.innerHTML =
    `<b>🌙 Enquanto você esteve fora (${time})</b><br>` +
    `${formatNumber(summary.kills)} kills · +${formatNumber(summary.lumens)} Lumens · ` +
    `+${formatNumber(summary.xp)} XP · +${formatNumber(summary.vestiges)} Vestiges.${retreat}` +
    `<button id="offline-close">OK</button>`;
  el.style.display = 'block';
  document.getElementById('offline-close').addEventListener('click', () => { el.style.display = 'none'; }, { once: true });
}
```

## Interface — src/ui (CSS)

### `src/ui/ascension.css`

```css
/* ============================================================
   Éclats of Lumière — Tela de Ascension (pós-MVP) · layout v5
   PALCO full-bleed: salão cerimonial da Ordre (fundo) + Séraphine (overlay).
   Rank/comissão/Gatekeepers FLUTUAM sobre a arte (sem caixas pesadas), no
   estilo Mémoires/Passivas. Classes prefixadas as-, escopadas em .view.ascension.
   ============================================================ */

.view.ascension { display: block; padding: 0; overflow: hidden; }
.ascension { --frac: #9d7bdb; }
.ascension .as-title { font-family: var(--font-display); font-weight: 600; font-size: 24px; color: #eef4ff;
  text-shadow: 0 2px 8px #000, 0 0 18px #000; }
.ascension .as-eyebrow { font-size: 16px; letter-spacing: .3em; text-transform: uppercase; color: var(--eclat);
  text-shadow: 0 1px 5px #000, 0 0 10px #000; }

/* ---------------- Palco (salão, ARTE FULL-BLEED) ---------------- */
.as-stage { position: absolute; inset: 0; z-index: 1; overflow: hidden;
  background: var(--art) center / cover no-repeat,
    radial-gradient(120% 90% at 50% 0%, #1c1810 0%, #0c0a06 60%, #060507 100%); }
/* scrim: abafa a arte p/ casar com o fundo escuro do jogo + legibilidade
   (esquerda p/ rank/comissão, direita p/ Gatekeepers, base e topo). */
.as-stage::after { content: ""; position: absolute; inset: 0; pointer-events: none;
  background:
    linear-gradient(90deg, rgba(4,6,12,.62) 0%, rgba(4,6,12,.18) 26%, transparent 42%),
    linear-gradient(270deg, rgba(4,6,12,.6) 0%, rgba(4,6,12,.12) 30%, transparent 50%),
    linear-gradient(180deg, rgba(4,6,12,.45) 0%, transparent 22%, transparent 64%, rgba(4,6,12,.6)); }

/* ---------------- Rank (texto flutuante, topo-centro) ---------------- */
.as-rank { position: absolute; left: 50%; top: 4%; transform: translateX(-50%); z-index: 4;
  text-align: center; width: 520px; max-width: 46%; }
.as-rk-lbl { font-size: 18px; letter-spacing: .34em; text-transform: uppercase; color: var(--eclat);
  text-shadow: 0 1px 5px #000, 0 0 12px #000; }
.as-rank h1 { font-family: var(--font-display); font-weight: 700; font-size: 46px; color: #f6f9ff;
  line-height: 1; letter-spacing: .03em; margin: 2px 0 0;
  text-shadow: 0 2px 6px #000, 0 0 28px rgba(170,200,255,.45), 0 0 14px #000; }
.as-rk-map { font-size: 18px; color: #cdd7ea; margin-top: 5px; text-shadow: 0 1px 4px #000, 0 0 10px #000; }
.as-rk-pips { display: flex; gap: 8px; justify-content: center; margin-top: 9px; }
.as-rk-pips i { width: 11px; height: 11px; transform: rotate(45deg); border-radius: 2px;
  background: rgba(170,200,255,.2); box-shadow: 0 1px 3px #000; }
.as-rk-pips i.on { background: var(--eclat); box-shadow: 0 0 9px rgba(170,200,255,.85); }
.as-rk-pips i.cur { background: #fff; box-shadow: 0 0 12px rgba(255,255,255,.95); }
.as-rk-stats { display: flex; gap: 24px; justify-content: center; margin-top: 11px;
  font-size: 18px; color: #c3cee2; text-transform: uppercase; letter-spacing: .1em;
  text-shadow: 0 1px 4px #000, 0 0 10px #000; }
.as-rk-stats b { font-variant-numeric: tabular-nums; color: #fff; font-size: 18px; }
.as-rk-stats b.t-gold { color: var(--gold); }

/* ---------------- Comissão (painel flutuante, esquerda) ---------------- */
.as-commission { position: absolute; left: 3.2%; top: 50%; transform: translateY(-50%); z-index: 4;
  width: 380px; max-width: 33%; display: flex; flex-direction: column;
  padding: 22px 24px; border-radius: 16px; border-left: 2px solid rgba(170,200,255,.4);
  background: linear-gradient(180deg, rgba(7,11,20,.72), rgba(7,11,20,.58));
  backdrop-filter: blur(5px); box-shadow: 0 18px 50px -16px #000; }
.as-commission h3 { font-family: var(--font-display); font-size: 26px; color: #eef4ff; margin: 5px 0 14px;
  text-shadow: 0 2px 6px #000; }
.as-commission h3 b { color: var(--eclat); }
.as-rew { display: grid; gap: 11px; }
.as-rew .r { display: flex; align-items: center; gap: 11px; font-size: 16px; color: #d4dcec; }
.as-rew .r .k { width: 7px; height: 7px; border-radius: 50%; flex: none;
  background: var(--eclat); box-shadow: 0 0 7px rgba(170,200,255,.7); }
.as-rew .r.g .k { background: var(--gold); box-shadow: 0 0 7px rgba(217,164,65,.7); }
.as-rew .r b { color: #fff; }
.as-cost { margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(170,200,255,.18);
  display: flex; justify-content: space-between; align-items: baseline; }
.as-cost .cl { font-size: 16px; letter-spacing: .14em; text-transform: uppercase; color: #aab6cc; }
.as-cost .cv { font-size: 22px; font-weight: 700; color: var(--vest); font-variant-numeric: tabular-nums;
  text-shadow: 0 0 12px rgba(157,123,219,.5); }
.as-btn { appearance: none; cursor: pointer; height: 54px; border: 0; border-radius: 13px; margin-top: 14px;
  font-weight: 700; font-size: 16px; letter-spacing: .16em; text-transform: uppercase;
  background: linear-gradient(180deg, #c4d8ff, var(--eclat)); color: #06101f;
  box-shadow: 0 0 30px -6px rgba(170,200,255,.7), inset 0 1px 0 rgba(255,255,255,.5);
  transition: filter .14s ease, transform .1s ease; }
.as-btn:hover:not(:disabled) { filter: brightness(1.07); transform: translateY(-1px); }
.as-btn:disabled { background: rgba(20,26,37,.7); color: var(--faint); box-shadow: none; cursor: not-allowed; }
.as-note { margin-top: 10px; text-align: center; font-family: var(--font-display); font-style: italic;
  font-size: 16px; color: #c3cee2; text-shadow: 0 1px 4px #000; }

/* ---------------- Gatekeepers (lista flutuante, direita) ---------------- */
.as-gk { position: absolute; right: 3.2%; top: 50%; transform: translateY(-50%); z-index: 4;
  width: 400px; max-width: 35%; display: flex; flex-direction: column; gap: 11px; max-height: 86%; }
.as-gk-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.as-gk-sub { font-family: var(--font-display); font-style: italic; font-size: 16px; color: #cdd7ea;
  text-shadow: 0 1px 4px #000, 0 0 10px #000; }
.as-gk-ladder { display: grid; gap: 9px; align-content: start; overflow-y: auto; padding-right: 2px; }
.as-gk-step { display: grid; grid-template-columns: 64px 1fr auto; align-items: center; gap: 14px;
  border: 1px solid rgba(170,200,255,.16); border-left: 4px solid rgba(170,200,255,.3); border-radius: 13px;
  background: linear-gradient(180deg, rgba(7,11,20,.7), rgba(7,11,20,.55)); backdrop-filter: blur(4px);
  padding: 10px 16px; box-shadow: 0 10px 30px -14px #000; }
.as-gk-em { width: 60px; height: 60px; border-radius: 12px; display: grid; place-items: center;
  overflow: hidden; position: relative; border: 1.5px solid rgba(170,200,255,.22);
  background: radial-gradient(circle at 50% 40%, rgba(170,200,255,.08), transparent 70%), rgba(10,14,22,.8); }
.as-gk-em img { width: 130%; height: 130%; object-fit: contain; }
.as-gk-nm { font-family: var(--font-display); font-size: 19px; color: #eef4ff; text-shadow: 0 1px 4px #000; }
.as-gk-nm em { font-style: normal; color: #9fabc2; font-size: 16px; letter-spacing: .1em; margin-left: 8px; }
.as-gk-desc { font-size: 16px; color: #c3cee2; margin-top: 2px; text-shadow: 0 1px 3px #000; }
.as-gk-side { justify-self: end; text-align: right; font-size: 16px; color: var(--eclat); letter-spacing: .08em; }

/* toggle do Rhythm */
.as-gk-toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 16px; color: #cdd7ea; cursor: pointer; }
.as-sw { width: 38px; height: 21px; border-radius: 11px; background: rgba(20,26,37,.8);
  border: 1px solid rgba(170,200,255,.2); position: relative; transition: background .15s ease, border-color .15s ease; }
.as-sw::after { content: ''; position: absolute; top: 2px; left: 2px; width: 15px; height: 15px;
  border-radius: 50%; background: var(--faint); transition: left .15s ease, background .15s ease; }
.as-sw.on { background: rgba(217,164,65,.25); border-color: var(--gold); }
.as-sw.on::after { left: 19px; background: var(--gold); }

/* estados do step */
.as-gk-step.on { border-left-color: var(--gold); }
.as-gk-step.on .as-gk-em { border-color: var(--gold); box-shadow: 0 0 18px -5px rgba(217,164,65,.5); }
.as-gk-step.passive .as-gk-side { font-size: 16px; color: var(--eclat); letter-spacing: .08em; }
.as-gk-step.locked { opacity: .8; }
.as-gk-step.locked .as-gk-em img { filter: grayscale(.45) brightness(.66); }
.as-gk-step.locked .as-gk-em::after { content: '\1F512'; position: absolute; font-size: 16px;
  right: 4px; bottom: 2px; filter: grayscale(1) brightness(1.5); opacity: .85; }
.as-gk-step.locked .as-gk-nm { color: #aab6cc; }
.as-gk-step.locked .as-gk-side { font-size: 16px; color: var(--faint); letter-spacing: .08em; }
```

### `src/ui/awaken.css`

```css
/* Aba AWAKENING (dentro da tela Seeker) — formato Gear/Forge, paleta FRIA
   (azul-gelo, a chrome de interface do kit). Tudo prefixado awk- e ancorado
   em .pl-awaken-pane.awaken. Pane ocupa o palco inteiro (inset:0). */

.pl-awaken-pane.awaken {
  --awk-panel: rgba(8,12,24,.86);
  --awk-panel-2: rgba(14,20,36,.92);
  --awk-line: rgba(170,200,255,.26);
  --awk-line-soft: rgba(170,200,255,.13);
  --awk-ice: #aac8ff;            /* azul-gelo: a luz reunida / chrome de UI */
  --awk-ink: #dbe6ff; --awk-dim: #8fa3c8; --awk-faint: #5a6678;
  --awk-ok: #7fd08a;
  position: absolute; inset: 0; overflow: hidden;
  font-family: 'Inter', sans-serif; color: var(--awk-ink);
}

/* cena full-bleed = câmara de despertar dedicada (cobre o backdrop do mapa) */
.awaken .awk-screen {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: url('eclats/awakening/awaken_screen.webp') center / cover no-repeat, #0b1226;
}

/* ---------------- Resumo (esquerda) ---------------- */
.awaken .awk-summary {
  position: absolute; left: 3%; top: 11%; width: 320px; z-index: 3;
  background: var(--awk-panel); border: 1px solid var(--awk-line);
  border-radius: 14px; padding: 18px 20px; backdrop-filter: blur(3px);
}
.awaken .awk-summary h3 {
  margin: 0 0 12px; font-family: 'Cormorant Garamond', serif; font-size: 26px;
  color: #eaf1ff; letter-spacing: .02em;
}
.awaken .awk-now { padding-bottom: 12px; border-bottom: 1px solid var(--awk-line-soft); margin-bottom: 12px; }
.awaken .awk-now-rank { font-size: 22px; font-weight: 700; color: var(--awk-ice); }
.awaken .awk-now-tier { font-size: 16px; letter-spacing: .12em; text-transform: uppercase; color: var(--awk-dim); margin-top: 2px; }
.awaken .awk-totals { margin: 0 0 14px; display: grid; gap: 8px; }
.awaken .awk-totals div { display: flex; justify-content: space-between; align-items: baseline; }
.awaken .awk-totals dt { font-size: 16px; color: var(--awk-dim); }
.awaken .awk-totals dd { margin: 0; font-size: 19px; font-weight: 700; color: #eef4ff; font-variant-numeric: tabular-nums; }
.awaken .awk-note { font-size: 16px; line-height: 1.55; color: #9fb0cc; font-style: italic; }

/* ---------------- Trilha dos 5 tiers (direita) ---------------- */
.awaken .awk-rail {
  position: absolute; right: 2.5%; top: 11%; bottom: 7%; width: 360px; z-index: 3;
  display: flex; flex-direction: column;
}
.awaken .awk-rail-head {
  font-size: 16px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase;
  color: #c3d3ee; padding: 0 4px 10px;
}
.awaken .awk-rlist {
  flex: 1; border: 1px solid var(--awk-line); border-radius: 14px;
  background: var(--awk-panel); padding: 12px; display: flex; flex-direction: column; gap: 8px;
  backdrop-filter: blur(3px);
}
.awaken .awk-tier {
  display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
  border: 1.5px solid var(--awk-line-soft); border-radius: 11px;
  background: var(--awk-panel-2); padding: 9px 12px; cursor: pointer; transition: border-color .14s, opacity .14s;
}
.awaken .awk-tier:hover { border-color: var(--awk-ice); }
.awaken .awk-tier.sel { border-color: var(--awk-ice); box-shadow: 0 0 0 1px var(--awk-ice), 0 0 18px -6px rgba(170,200,255,.6); }
.awaken .awk-tier.s-locked { opacity: .5; }
.awaken .awk-th {
  width: 52px; height: 52px; border-radius: 9px; overflow: hidden; flex: none;
  border: 2px solid var(--awk-line); background: #0a1024; display: grid; place-items: center;
}
.awaken .awk-th img, .awaken .awk-th picture { width: 100%; height: 100%; object-fit: cover; object-position: top center; }
.awaken .awk-tier.s-awakened .awk-th { border-color: var(--awk-ok); }
.awaken .awk-tier.s-current .awk-th, .awaken .awk-tier.s-next .awk-th { border-color: var(--awk-ice); }
.awaken .awk-meta { flex: 1; min-width: 0; }
.awaken .awk-nm { display: block; font-size: 16px; font-weight: 600; color: #eef4ff; }
.awaken .awk-sub { display: block; font-size: 16px; letter-spacing: .12em; text-transform: uppercase; color: var(--awk-dim); margin-top: 2px; }
.awaken .awk-st { flex: none; font-size: 16px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--awk-faint); }
.awaken .awk-tier.s-awakened .awk-st { color: var(--awk-ok); font-size: 16px; }
.awaken .awk-tier.s-current .awk-st { color: var(--awk-ice); }
.awaken .awk-tier.s-next .awk-st { color: #e6d39a; }

/* ---------------- Palco central (preview do tier) ---------------- */
.awaken .awk-stage {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2;
  width: 440px; max-height: 92%; display: flex; flex-direction: column; align-items: center;
  text-align: center;
}
/* palco mostra o CARD do tier (moldura embutida) */
.awaken .awk-hero { position: relative; width: 250px; aspect-ratio: 966 / 1488; }
.awaken .awk-hero-art { position: absolute; inset: 0; overflow: hidden; border-radius: 6px; }
.awaken .awk-hero-art img, .awaken .awk-hero-art picture { width: 100%; height: 100%; object-fit: cover; object-position: center; }
/* tiers ainda não alcançados leem como silhueta apagada */
.awaken .awk-stage.s-locked .awk-hero-art img { filter: brightness(.4) grayscale(.5); }
.awaken .awk-stage.s-next .awk-hero-art img { filter: brightness(.72) grayscale(.18); }

.awaken .awk-hero-id { margin-top: 14px; }
.awaken .awk-hero-name { margin: 0; font-family: 'Cormorant Garamond', serif; font-weight: 700;
  font-size: 44px; line-height: 1.02; color: #fff; text-shadow: 0 2px 6px #000, 0 0 20px rgba(0,0,0,.7); }
.awaken .awk-hero-tier { margin-top: 4px; font-size: 16px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--awk-dim); }
.awaken .awk-hero-tier b { color: var(--awk-ice); }

/* bloco de estado (pé) */
.awaken .awk-foot { margin-top: 16px; width: 100%; max-width: 400px; }
.awaken .awk-badge { display: inline-block; font-size: 16px; font-weight: 700; letter-spacing: .14em;
  text-transform: uppercase; padding: 5px 16px; border-radius: 999px; border: 1px solid var(--awk-line); }
.awaken .awk-foot.ok .awk-badge { color: var(--awk-ok); border-color: rgba(127,208,138,.45); }
.awaken .awk-foot.cur .awk-badge { color: var(--awk-ice); border-color: rgba(170,200,255,.45); }
.awaken .awk-foot.locked .awk-badge { color: var(--awk-faint); }
.awaken .awk-flavor { margin-top: 10px; font-family: 'Cormorant Garamond', serif; font-style: italic;
  font-size: 16px; color: #d4def2; text-shadow: 0 1px 5px #000; }
.awaken .awk-req { margin-top: 10px; font-size: 16px; color: #b9c6e0; }
.awaken .awk-req b { color: var(--awk-ice); }

/* ganhos antes→depois */
.awaken .awk-gains { width: 100%; max-width: 400px; display: grid; gap: 7px; margin-bottom: 12px; }
.awaken .awk-gains > div { display: flex; justify-content: space-between; align-items: baseline;
  padding: 8px 12px; border-radius: 9px; background: rgba(8,12,24,.6); border: 1px solid var(--awk-line-soft); }
.awaken .awk-gains span { font-size: 16px; color: var(--awk-dim); letter-spacing: .04em; }
.awaken .awk-gains b { font-size: 16px; color: #eef4ff; font-variant-numeric: tabular-nums; }
.awaken .awk-gains b i { font-style: normal; color: var(--awk-faint); margin: 0 5px; }

/* gates — 3 camadas (Prova / Oferenda / Tributo) */
.awaken .awk-gates { width: 100%; max-width: 400px; display: grid; gap: 9px; margin-bottom: 14px; }
.awaken .awk-gate { display: grid; gap: 4px; }
.awaken .awk-glabel { font-size: 16px; letter-spacing: .08em; text-transform: uppercase; color: var(--awk-dim);
  display: flex; justify-content: space-between; }
.awaken .awk-bar { position: relative; display: block; height: 24px; border-radius: 7px;
  background: rgba(0,0,0,.42); overflow: hidden; border: 1px solid rgba(255,255,255,.08); }
.awaken .awk-bar i { position: absolute; inset: 0; border-radius: 7px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--awk-ice) 55%, #2a3b66), var(--awk-ice)); }
.awaken .awk-bar em { position: absolute; inset: 0; display: grid; place-items: center; font-style: normal;
  font-size: 16px; font-weight: 700; color: #fff; text-shadow: 0 1px 3px #000; font-variant-numeric: tabular-nums; }
.awaken .awk-gate.ok .awk-bar i { background: linear-gradient(90deg, #6fbf7c, var(--awk-ok)); }
.awaken .awk-gate.ok .awk-glabel { color: var(--awk-ok); }

/* botão Awaken */
.awaken .awk-btn { appearance: none; cursor: pointer; width: 100%; max-width: 400px; height: 50px;
  border: 0; border-radius: 12px; font-weight: 700; font-size: 16px; letter-spacing: .14em; text-transform: uppercase;
  background: linear-gradient(180deg, #cfe0ff, var(--awk-ice)); color: #0a1430;
  box-shadow: 0 0 26px -5px rgba(170,200,255,.7), inset 0 1px 0 rgba(255,255,255,.5); }
.awaken .awk-btn:hover:not(:disabled) { filter: brightness(1.08); }
.awaken .awk-btn:disabled { filter: grayscale(.6) brightness(.6); cursor: not-allowed; }

/* cerimônia absorvida — overlay full-pane */
.awaken .awk-rite { position: absolute; inset: 0; z-index: 20; display: grid; place-items: center;
  opacity: 0; transition: opacity .5s ease; pointer-events: none; }
.awaken .awk-rite.show { opacity: 1; pointer-events: auto; }
.awaken .awk-rite[hidden] { display: none; }
.awaken .awk-rite-veil { position: absolute; inset: 0;
  background: radial-gradient(58% 58% at 50% 46%, rgba(18,38,86,.55), rgba(4,7,16,.96)); }
/* grupo centralizado: imagem grande (foco) + texto logo abaixo.
   height:100% (definida) p/ o max-height % do splash resolver e não estourar. */
.awaken .awk-rite-inner { position: relative; z-index: 2; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
  padding-top: 3%; gap: 8px; }
.awaken .awk-rite-splash { max-height: 50%; max-width: 74%; width: auto; object-fit: contain;
  filter: drop-shadow(0 0 70px rgba(170,200,255,.55)); }
.awaken .awk-rite-text { text-align: center; text-shadow: 0 2px 12px #000; }
.awaken .awk-rite-lore { max-width: 620px; margin: 0 auto 4px; font-family: 'Cormorant Garamond', serif;
  font-style: italic; font-size: 21px; line-height: 1.45; color: #d4e2ff; text-shadow: 0 1px 8px #000; }
.awaken .awk-rite-text h1 { margin: 6px 0 2px; font-family: 'Cormorant Garamond', serif; font-weight: 700;
  font-size: 72px; line-height: 1; color: #fff; letter-spacing: .04em;
  text-shadow: 0 2px 16px #000, 0 0 40px rgba(170,200,255,.4); }
.awaken .awk-rite-sub { font-size: 16px; letter-spacing: .12em; text-transform: uppercase; color: #aac8ff; }
.awaken .awk-rite-close { margin-top: 20px; appearance: none; cursor: pointer; height: 46px; padding: 0 34px;
  border: 1px solid var(--awk-ice); border-radius: 11px; background: rgba(14,20,36,.8); color: #eaf1ff;
  font-size: 16px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.awaken .awk-rite-close:hover { background: rgba(170,200,255,.18); }

/* ---------------- Abas Codex | Awakening (topo da tela Seeker) ---------------- */
/* topo-CENTRO, no alto — acima do card (não colide com a moldura dele) */
.view.player .pl-tabs {
  position: absolute; left: 50%; transform: translateX(-50%); top: 16px;
  z-index: 7; display: flex; gap: 6px;
}
.view.player .pl-tab {
  height: 40px; padding: 0 22px; border: 1px solid var(--awk-line, rgba(170,200,255,.26));
  border-radius: 10px; background: rgba(8,12,24,.66); color: #8fa3c8;
  font-size: 16px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; cursor: pointer;
  backdrop-filter: blur(3px);
}
.view.player .pl-tab.on { background: rgba(14,20,36,.92); color: #aac8ff; border-color: #aac8ff;
  box-shadow: 0 0 0 1px rgba(170,200,255,.2); }
```

### `src/ui/combat.css`

```css
/* ============================================================
   Éclats of Lumière — Tela de Combate (U-2)
   Cena 1920×1080: Seeker à esquerda, arena de inimigos à direita,
   HUD no rodapé. Segue a direção visual (chrome branco/azul frio,
   dourado = luz presa nos inimigos/alvo).
   ============================================================ */

.view.combat { display: block; padding: 0; overflow: hidden; }

/* fundo nítido do mapa (a tela de combate não usa o blur do menu) */
.cb-backdrop {
  position: absolute; inset: 0; z-index: 0;
  background-size: cover; background-position: center;
}
.cb-backdrop::after {
  content: ""; position: absolute; inset: 0;
  background:
    linear-gradient(180deg, rgba(5,7,15,.55), rgba(5,7,15,.15) 30%, rgba(5,7,15,.65)),
    radial-gradient(1200px 700px at 28% 45%, rgba(5,7,15,.5), transparent 70%);
}

/* ============================================================
   Seeker SEM CARD — sprite de corpo inteiro (como os mobs):
   nome + tier acima · sprite no meio · barra de HP (vermelha) e LV (azul) abaixo.
   ============================================================ */
.cb-seeker.sfig {
  position: absolute; z-index: 6;
  left: 56px; top: 150px; width: 300px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: transparent; transition: filter .25s ease;
}
.cb-seeker.sfig.dead { filter: grayscale(.7) brightness(.8); }

/* sprite (recorte transparente; sem moldura/fundo) */
.sfig-art { position: relative; width: 100%; line-height: 0; }
.sfig-art picture, .sfig-art img, .scard-art-img, .scard-art-img img {
  width: 100%; height: auto; display: block; object-fit: contain;
  filter: drop-shadow(0 8px 14px rgba(0,0,0,.6));
}

/* nome / tier sobre o banner (placa navy/filigrana) */
.sfig-label { position: relative; width: 114%; text-align: center; }
.sfig-banner, .sfig-banner img {
  display: block; width: 100%; height: auto; pointer-events: none;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,.5));
}
/* o texto fica na faixa navy central da placa (o topo do banner tem a crista) */
.sfig-nametext {
  position: absolute; left: 8%; right: 8%; top: 30%; bottom: 14%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0;
}
.scard-name {
  font-family: var(--font-display); font-weight: 700; color: #fff;
  font-size: 15px; line-height: 1.05; letter-spacing: .04em;
  text-transform: uppercase; white-space: nowrap; text-shadow: 0 1px 4px #000;
}
.scard-tier {
  font-size: 11px; color: #bcd2ff;
  letter-spacing: .12em; text-transform: uppercase; text-shadow: 0 1px 3px #000;
}

/* infos abaixo do sprite */
.sfig-info { width: 100%; }

/* barra de HP (vermelha, com texto) e barra de LV (azul) */
.scard-hpbar, .scard-lvbar {
  position: relative; height: 20px; border-radius: 7px; overflow: hidden;
  background: #1a0d0d;
}
.scard-lvbar { margin-top: 6px; background: #0c1428; }
.scard-hpbar i, .scard-lvbar i {
  position: absolute; inset: 0; display: block; width: 100%;
  transition: width .12s linear;
}
.scard-hpbar i { background: #d6443c; }
.scard-lvbar i { background: #2f6fd6; }
.scard-hpbar span, .scard-lvbar span {
  position: absolute; inset: 0; display: grid; place-items: center;
  font-size: 16px; font-weight: 700; color: #fff;
  font-variant-numeric: tabular-nums; text-shadow: 0 1px 3px #000c;
}

.cb-status {
  margin-top: 8px; padding: 5px 8px; border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--gold) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--gold) 45%, transparent);
  color: var(--gold); font-size: var(--fs-xs); font-weight: 600; text-align: center;
}

/* ---------------- Arena de inimigos (direita) ---------------- */
.cb-arena { position: absolute; inset: 0; z-index: 5; pointer-events: none; }

/* ============================================================
   Inimigo SEM CARD — sprite de corpo inteiro (recorte transparente):
   nome+LV acima · sprite no meio · ATK/HP + barra abaixo · floats sobre o sprite.
   ============================================================ */
.cb-enemy.emob {
  position: absolute; z-index: 5;
  /* sprites são ALTOS (~2:1) → largura menor p/ a altura caber em 2 fileiras sem colidir */
  width: min(calc(var(--stage-w) * 0.10), 175px);
  transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  pointer-events: auto; background: transparent;
  transition: filter .25s ease, opacity .25s ease;
}
.cb-enemy.emob.slain { filter: grayscale(1) brightness(.55); opacity: .45; }

/* sprite */
.emob-art { position: relative; width: 100%; line-height: 0; }
.emob-art-img, .emob-art-img img {
  width: 100%; height: auto; display: block; object-fit: contain;
  filter: drop-shadow(0 6px 10px rgba(0,0,0,.55));
}

/* nome / LV (acima do sprite) */
.emob-label { text-align: center; }
.ecard-name {
  font-family: var(--font-display); font-weight: 700; color: #fff;
  font-size: 18px; line-height: 1.05; letter-spacing: .02em;
  text-transform: uppercase; white-space: nowrap;
  text-shadow: 0 1px 2px #000, 0 2px 8px #000;
}
/* Gilded — variante mais forte/rica: nome dourado + brilho no sprite */
.cb-enemy.gilded .ecard-name { color: #f0d9a0; text-shadow: 0 0 10px rgba(217,164,65,.7), 0 1px 2px #000; }
.cb-enemy.gilded .ecard-lvl { color: #d9a441; }
.cb-enemy.gilded .emob-art-img { filter: drop-shadow(0 0 12px rgba(217,164,65,.55)); }
.ecard-lvl {
  font-size: 16px; font-weight: 700; color: #dce8ff;
  letter-spacing: .14em; text-transform: uppercase;
  text-shadow: 0 1px 2px #000, 0 2px 6px #000;
}

/* ATK / HP + barra (abaixo do sprite) */
.emob-info { width: 100%; }
.emob-statline {
  display: flex; justify-content: space-between;
  font-weight: 800; font-size: 16px; font-variant-numeric: tabular-nums;
  padding: 0 2px 2px; text-shadow: 0 1px 3px #000c;
}
.ecard-atk { color: #ff963c; }   /* ATK laranja */
.ecard-hp  { color: #96ebaa; }   /* HP verde */
.ecard-bar {
  height: 12px; background: rgba(40,18,18,.85);
  border-radius: 6px; overflow: hidden;
  box-shadow: 0 1px 3px #000a;
}
.ecard-fill {
  display: block; height: 100%; width: 100%;
  background: #d6443c; transition: width .2s ease;
}

/* dano flutuante: popup vermelho por golpe, sobe e some (sobre o sprite) */
.ecard-floats { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
.ecard-dmg {
  position: absolute; left: 50%; top: 6%; transform: translateX(-50%);
  color: #ff5050; font-weight: 800; font-size: 22px; white-space: nowrap;
  text-shadow: 0 0 8px #000, 0 2px 4px #000;
  animation: ecard-float .8s ease-out forwards;
}
.ecard-dmg.crit { font-size: 28px; }
@keyframes ecard-float {
  0%   { opacity: 0; transform: translate(-50%, 12px); }
  18%  { opacity: 1; transform: translate(-50%, 2px); }
  100% { opacity: 0; transform: translate(-50%, -40px); }
}

/* tamanhos por contagem (largura do sprite) */
.cb-enemy.emob.big   { width: min(calc(var(--stage-w) * 0.15),  260px); }
.cb-enemy.emob.mid   { width: min(calc(var(--stage-w) * 0.105), 175px); }
.cb-enemy.emob.dense { width: min(calc(var(--stage-w) * 0.09),  150px); }
.cb-enemy.emob.swarm { width: min(calc(var(--stage-w) * 0.048), 78px); gap: 2px; }
.cb-enemy.emob.swarm .ecard-name { font-size: 13px; }
.cb-enemy.emob.swarm .ecard-lvl  { font-size: 12px; letter-spacing: .06em; }
.cb-enemy.emob.swarm .emob-statline { font-size: 12px; }
.cb-enemy.emob.swarm .ecard-bar { height: 8px; }
.cb-enemy.emob.boss  { width: min(calc(var(--stage-w) * 0.20),  360px); }
/* com boss em cena, os mobs comuns encolhem pra abrir espaço */
.cb-arena.with-boss .cb-enemy.emob:not(.boss) {
  width: min(calc(var(--stage-w) * 0.10), 160px);
}
.cb-enemy.ecard.dense .ecard-name { font-size: 16px; }
.cb-enemy.ecard.dense .ecard-lvl { font-size: 16px; }
.cb-enemy.ecard.dense .ecard-stats { font-size: 16px; }
.cb-enemy.ecard.dense .ecard-bar { height: 11px; }
.cb-enemy.ecard.dense .ecard-sigil { width: 17px; height: 17px; font-size: 16px; }
.cb-enemy.ecard.dense .ecard-dmg { font-size: 16px; }

/* boss: cabe exato na faixa do meio; destaque por glow dourado */
.cb-enemy.ecard.boss {
  width: min(calc(var(--stage-w) * 0.12), 190px);
  z-index: 7; filter: drop-shadow(0 0 14px var(--gold));
}
.cb-enemy.ecard.boss .ecard-name { font-size: 16px; }

/* ---------------- FX: cortes de luz do Seeker ---------------- */
.cb-fx { position: absolute; inset: 0; z-index: 7; pointer-events: none; overflow: hidden; }

/* Box de drops do mapa (T1) — bg = ARTE do material; canto inf-esq, acima do HUD */
.cb-drops {
  position: absolute; z-index: 8; left: 36px; bottom: 104px;
  display: flex; align-items: center; justify-content: flex-end;
  min-width: 190px; min-height: 64px; padding: 10px 18px 10px 70px;
  /* arte do material à esquerda + gradiente escuro p/ o texto ficar legível à direita */
  background-image:
    linear-gradient(90deg, rgba(8,12,24,.25), rgba(8,12,24,.94) 62%),
    url('eclats/forge/t1_kindled.webp');
  background-size: cover, auto 130%;
  background-position: center, left -6px center;
  background-repeat: no-repeat, no-repeat;
  border: 1px solid rgba(217,164,65,.5); border-radius: 14px;
  box-shadow: 0 8px 26px -10px #000, inset 0 0 0 1px rgba(217,164,65,.12);
  /* oculto por padrão — só aparece quando dropa material */
  opacity: 0; visibility: hidden; transform: translateY(8px);
  transition: opacity .25s ease, transform .25s ease, visibility .25s;
}
.cb-drops.show { opacity: 1; visibility: visible; transform: translateY(0); }
.cb-drop-info { display: flex; flex-direction: column; align-items: flex-end; text-align: right; }
.cb-drop-lbl { font-size: 13px; color: var(--dim); text-transform: uppercase; letter-spacing: .1em; }
.cb-drop-val { font-size: 22px; font-weight: 700; color: var(--gold); font-variant-numeric: tabular-nums; }
.cb-drops.drop { animation: cb-drop-pulse .45s ease; }
@keyframes cb-drop-pulse {
  0% { transform: scale(1); box-shadow: 0 8px 26px -10px #000, 0 0 0 0 rgba(217,164,65,.5); }
  40% { transform: scale(1.06); box-shadow: 0 8px 26px -10px #000, 0 0 18px 3px rgba(217,164,65,.6); }
  100% { transform: scale(1); box-shadow: 0 8px 26px -10px #000, 0 0 0 0 rgba(217,164,65,0); }
}
/* container voa da origem (left/top) até origem+dx,dy; a imagem dentro rotaciona
   pra apontar no alvo. mix-blend-mode: screen some com o fundo preto da arte. */
.cb-proj {
  position: absolute; width: 0; height: 0;
  animation: cb-proj-fly 340ms ease-out forwards;
}
/* arte já tem alfa (fundo preto removido) — sem blend, só um glow suave */
.cb-proj-img {
  position: absolute; left: -55px; top: -55px; width: 110px; height: 110px;
  background: url('eclats/fx/projectil.webp') center / contain no-repeat;
  filter: drop-shadow(0 0 9px rgba(120, 190, 255, .65));
}
.cb-proj.crit .cb-proj-img { left: -80px; top: -80px; width: 160px; height: 160px;
  filter: drop-shadow(0 0 16px rgba(150, 210, 255, .9)); }
@keyframes cb-proj-fly {
  0%   { translate: 0 0; opacity: 0; }
  14%  { opacity: 1; }
  82%  { opacity: 1; }
  100% { translate: var(--dx) var(--dy); opacity: 0; }
}

/* ---------------- HUD (rodapé) ---------------- */
.cb-hud {
  position: absolute; z-index: 8; left: 0; right: 0; bottom: 0; height: 92px;
  display: flex; align-items: center; gap: 28px; padding: 0 36px;
  background: linear-gradient(180deg, transparent, rgba(8,11,17,.92) 55%);
}

.cb-nav { display: flex; align-items: center; gap: 12px; }
.cb-arrow {
  appearance: none; cursor: pointer; width: 44px; height: 44px;
  border: var(--border); border-radius: 12px; background: var(--panel);
  color: var(--ink); font-size: 18px; line-height: 1;
  transition: border-color .15s ease, background .15s ease, transform .1s ease;
}
.cb-arrow:hover:not(:disabled) { border-color: var(--eclat); background: var(--panel-2); transform: translateY(-1px); }
.cb-arrow:disabled { opacity: .32; cursor: not-allowed; }
.cb-zone { text-align: center; min-width: 240px; }
.cb-zone b { display: block; font-family: var(--font-display); font-size: 28px;
  color: var(--ink); letter-spacing: .03em; }
.cb-zone span { font-size: 16px; color: var(--dim);
  text-transform: uppercase; letter-spacing: .12em; }

.cb-progress { flex: 1; max-width: 560px; }
.cb-progress-label { font-size: 16px; color: var(--gold);
  text-transform: uppercase; letter-spacing: .14em; }
.cb-progress-bar { height: 12px; margin-top: 6px; border-radius: 6px;
  background: #0c1119; border: var(--border-soft); overflow: hidden; }
.cb-progress-bar i { display: block; height: 100%; width: 0;
  background: linear-gradient(90deg, var(--gold), #f0d9a0);
  box-shadow: var(--glow-gold); transition: width .2s ease; }

/* Métricas: rates por minuto agrupados (com divisória) + total de kills à parte */
.cb-metrics { display: flex; align-items: center; gap: 18px; margin: 0; padding: 0; }
.cb-metrics > div {
  display: flex; flex-direction: column; align-items: flex-end;
  min-width: 76px;
}
.cb-metrics dt { font-size: 13px; color: var(--dim); font-weight: 600;
  text-transform: uppercase; letter-spacing: .08em; white-space: nowrap; }
.cb-metrics dd { margin: 1px 0 0; font-size: 22px; font-weight: 700;
  color: var(--ink); font-variant-numeric: tabular-nums; line-height: 1.1; }
/* separa o trio "/min" do total de Kills */
.cb-metrics > div.cb-metric-total {
  margin-left: 6px; padding-left: 18px;
  border-left: 1px solid rgba(159,182,230,.2);
}
.cb-metrics > div.cb-metric-total dd { color: var(--gold); }
```

### `src/ui/components/reward-row.css`

```css
/* ============================================================
   Componente reutilizável — linha de recompensa (reward-row).
   Classes rw-. Genérico: usado pelo modal offline, drops de boss,
   recompensas de Ascension, etc. Tokens globais com fallback literal
   (o componente pode ser montado em qualquer contexto).
   ============================================================ */

.rw-list { display: grid; gap: 9px; }

.rw-row { display: flex; align-items: center; gap: 14px;
  border: 1px solid var(--line-soft, rgba(170, 200, 255, .13)); border-radius: 11px;
  background: var(--panel-2, rgba(14, 20, 36, .95)); padding: 11px 16px; }

.rw-ic { width: 52px; height: 52px; border-radius: 10px; flex: none; display: grid; place-items: center;
  overflow: hidden; border: 1.5px solid var(--line, rgba(170, 200, 255, .26));
  color: var(--eclat, #aac8ff);
  background: radial-gradient(circle at 50% 40%, rgba(170, 200, 255, .05), transparent 70%), #0d1322; }
.rw-ic img { width: 120%; height: 120%; object-fit: contain; }
.rw-glyph { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 22px; color: currentColor; }

.rw-meta { flex: 1; min-width: 0; }
.rw-nm { font-size: 16px; font-weight: 600; color: #eef4ff; }
.rw-sub { font-size: 16px; color: var(--faint, #5a6678); margin-top: 1px; }
.rw-val { font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ink, #dbe6ff); }

/* acentos de cor por variante */
.rw-row.gold  .rw-ic { border-color: var(--gold, #d9a441); color: var(--gold, #d9a441); }
.rw-row.gold  .rw-val { color: var(--gold, #d9a441); }
.rw-row.ember .rw-ic { border-color: #e8854a; color: #e8854a; }
.rw-row.ember .rw-val { color: #e8854a; }
.rw-row.eclat .rw-ic { border-color: var(--eclat, #aac8ff); color: var(--eclat, #aac8ff); }
.rw-row.eclat .rw-val { color: var(--eclat, #aac8ff); }
.rw-row.vest  .rw-ic { border-color: var(--vest, #3fd0b6); color: var(--vest, #3fd0b6); }
.rw-row.vest  .rw-val { color: var(--vest, #3fd0b6); }
```

### `src/ui/convergence.css`

```css
/* ============================================================
   CONVERGENCE — overlay/modal de dispersão (inverso do Awaken).
   Compacto, centralizado. Branco-azul no centro → dourado fugindo.
   Classes cv-. Monta em #overlay-host (inset:0 do palco 1920×1080).
   ============================================================ */

/* começa ABAIXO do HUD (topbar 84px) pra a barra de moedas/nav ficar visível */
.cv-overlay { position: absolute; top: 84px; left: 0; right: 0; bottom: 0; z-index: 10; overflow: hidden;
  opacity: 0; transition: opacity .3s ease; font-family: var(--font-ui, 'Inter', sans-serif); }
.cv-overlay.show { opacity: 1; }

/* mesmo fundo (e MESMA faixa de cor) da tela do Codex/HUD — sem escurecer demais */
.cv-combat-bg { position: absolute; inset: 0; filter: brightness(.92) saturate(.95);
  background: url('eclats/codex/codex_screen.webp') center / cover no-repeat, #0b1226; }
.cv-veil { position: absolute; inset: 0; background: rgba(8, 12, 26, .32); }

/* núcleo branco-azul se desfazendo + fragmentos */
.cv-burst { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 1000px; height: 1000px; pointer-events: none; }
.cv-core { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 240px; height: 240px;
  border-radius: 50%; background: radial-gradient(circle, rgba(170, 200, 255, .20), rgba(170, 200, 255, .05) 55%, transparent 70%);
  animation: cv-pulse 3.2s ease-in-out infinite; }
@keyframes cv-pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: .85; } 50% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; } }
.cv-p { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: var(--gold, #d9a441);
  box-shadow: 0 0 10px 2px rgba(217, 164, 65, .55); opacity: .9; animation: cv-drift 4s ease-in-out infinite; }
.cv-p.s { width: 3px; height: 3px; opacity: .55; animation-duration: 5s; }
.cv-p.c { background: var(--eclat, #aac8ff); box-shadow: 0 0 12px 3px rgba(170, 200, 255, .6); }
@keyframes cv-drift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(0, -8px); } }

/* modal */
/* modo TELA (pane): card centralizado, estático (não overlay flutuante) */
.cv-pane { position: relative; width: 100%; height: 100%; display: grid; place-items: center; padding: 24px 0; }
.cv-pane .cv-modal { position: static; transform: none; }

.cv-modal { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 640px;
  border: 1px solid var(--eclat, #aac8ff); border-radius: 16px; background: rgba(8, 12, 24, .92);
  box-shadow: 0 0 0 1px rgba(170, 200, 255, .18), 0 0 80px -20px rgba(170, 200, 255, .55), 0 30px 90px -30px #000;
  padding: 34px 38px 30px; z-index: 5; outline: 1px solid rgba(170, 200, 255, .14); outline-offset: 7px; }

.cv-eyebrow { text-align: center; font-size: 16px; letter-spacing: .4em; text-transform: uppercase; color: var(--dim, #8fa3c8); }
.cv-title { font-family: var(--font-display, 'Cormorant Garamond', serif); font-weight: 700; font-size: 44px; text-align: center;
  color: #f2f7ff; margin-top: 4px; letter-spacing: .04em; text-shadow: 0 0 24px rgba(170, 200, 255, .45); }
.cv-lore { margin: 10px auto 22px; max-width: 540px; text-align: center;
  font-family: var(--font-display, 'Cormorant Garamond', serif); font-style: italic; font-size: 21px; color: var(--ink, #cdd9f0); line-height: 1.5; }

/* ganho central */
.cv-gain-strip { display: flex; gap: 12px; justify-content: center; margin-bottom: 20px; }
.cv-g { flex: 1; text-align: center; border: 1px solid var(--line, rgba(170, 200, 255, .26)); border-radius: 12px;
  background: rgba(14, 20, 36, .9); padding: 13px 10px; }
.cv-g .cv-l { font-size: 16px; letter-spacing: .24em; text-transform: uppercase; color: var(--faint, #5a6678); }
.cv-g .cv-v { font-family: var(--font-display, 'Cormorant Garamond', serif); font-weight: 700; font-size: 30px;
  color: var(--eclat, #aac8ff); margin-top: 2px; text-shadow: 0 0 16px rgba(170, 200, 255, .4); font-variant-numeric: tabular-nums; }
.cv-g .cv-d { font-size: 16px; color: var(--dim, #8fa3c8); margin-top: 2px; font-variant-numeric: tabular-nums; }
.cv-g.points .cv-v { color: #f2f7ff; }

/* threshold (estado "ainda não pronto") */
.cv-threshold { margin-bottom: 18px; }
.cv-thr-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 7px; }
.cv-thr-top .cv-l { font-size: 16px; letter-spacing: .2em; text-transform: uppercase; color: var(--faint, #5a6678); }
.cv-thr-v { font-size: 17px; color: var(--ink, #dbe6ff); font-variant-numeric: tabular-nums; }
.cv-thr-v b { color: #f2f7ff; }
.cv-bar { height: 12px; border-radius: 7px; overflow: hidden;
  background: rgba(14, 20, 36, .9); border: 1px solid var(--line-soft, rgba(170, 200, 255, .13)); }
.cv-bar i { display: block; height: 100%; width: 0;
  background: linear-gradient(90deg, var(--eclat, #aac8ff), #f2f7ff); box-shadow: 0 0 14px rgba(170, 200, 255, .6); }

/* efeito por Convergence — título centralizado + chips dos stats */
.cv-effect { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 20px; }
.cv-effect-head { display: flex; align-items: baseline; gap: 10px; }
.cv-effect-l { font-size: 16px; color: var(--faint, #5a6678); text-transform: uppercase; letter-spacing: .14em; }
.cv-effect-v { color: var(--gold, #d9a441); font-weight: 700; font-size: 24px; }
.cv-effect-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.cv-chip { font-size: 15px; color: var(--eclat, #aac8ff); letter-spacing: .04em;
  background: rgba(170, 200, 255, .1); border: 1px solid rgba(170, 200, 255, .26);
  border-radius: 999px; padding: 4px 13px; }

/* botão Converge desabilitado (threshold não atingido) */
.cv-converge:disabled { cursor: default; background: rgba(20, 28, 46, .85);
  color: var(--dim, #8fa3c8); box-shadow: none; filter: none; }

/* dispersa / permanece */
.cv-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 22px; }
.cv-col { border: 1px solid var(--line-soft, rgba(170, 200, 255, .13)); border-radius: 12px; background: rgba(10, 15, 28, .7); padding: 13px 16px; }
.cv-col h4 { font-size: 16px; letter-spacing: .26em; text-transform: uppercase; margin-bottom: 9px; }
.cv-col.lost h4 { color: var(--gold, #d9a441); }
.cv-col.kept h4 { color: var(--eclat, #aac8ff); }
.cv-col ul { list-style: none; display: grid; gap: 6px; }
.cv-col li { font-size: 16px; color: var(--dim, #8fa3c8); display: flex; align-items: center; gap: 8px; }
.cv-col li::before { content: ''; width: 5px; height: 5px; border-radius: 50%; flex: none; }
.cv-col.lost li::before { background: var(--gold, #d9a441); box-shadow: 0 0 6px rgba(217, 164, 65, .6); }
.cv-col.kept li::before { background: var(--eclat, #aac8ff); box-shadow: 0 0 6px rgba(170, 200, 255, .6); }
.cv-col.kept li b { color: var(--ink, #dbe6ff); font-weight: 600; }

/* tributo (Lumens pagos ao convergir) */
.cv-tribute { display: flex; align-items: baseline; flex-wrap: wrap; gap: 9px; justify-content: center;
  margin-bottom: 16px; padding: 12px 14px; border-radius: 12px;
  background: rgba(40, 30, 14, .55); border: 1px solid var(--gold, #d9a441); }
.cv-tribute-l { font-size: 16px; letter-spacing: .22em; text-transform: uppercase; color: var(--gold, #d9a441); }
.cv-tribute-v { font-family: var(--font-display, serif); font-weight: 700; font-size: 22px; color: #f2dca0;
  font-variant-numeric: tabular-nums; }
.cv-tribute-note { width: 100%; text-align: center; font-size: 15px; color: var(--faint, #5a6678); font-style: italic; }

.cv-actions { display: flex; gap: 12px; }
.cv-later { appearance: none; cursor: pointer; flex: 1; height: 54px; border: 1px solid var(--line, rgba(170, 200, 255, .26));
  border-radius: 12px; background: transparent; color: var(--dim, #8fa3c8); font-weight: 600; font-size: 16px; letter-spacing: .14em; text-transform: uppercase; }
.cv-later:hover { border-color: var(--dim, #8fa3c8); color: var(--ink, #dbe6ff); }
.cv-converge { appearance: none; cursor: pointer; flex: 2; height: 54px; border: 0; border-radius: 12px;
  font-weight: 700; font-size: 16px; letter-spacing: .18em; text-transform: uppercase;
  background: linear-gradient(180deg, #c4d8ff, var(--eclat, #aac8ff)); color: #06101f;
  box-shadow: 0 0 32px -6px rgba(170, 200, 255, .75), inset 0 1px 0 rgba(255, 255, 255, .5); }
.cv-converge:hover { filter: brightness(1.07); }
.cv-note { margin-top: 12px; text-align: center; font-size: 16px; color: var(--faint, #5a6678); font-style: italic; }

/* borda ornamental (assets reais, transbordando o modal) */
.cv-orn { position: absolute; pointer-events: none; z-index: 6; }
.cv-orn img { display: block; width: 100%; height: auto; filter: drop-shadow(0 0 10px rgba(170, 200, 255, .35)); }
.cv-orn.crest { top: -128px; left: 50%; transform: translateX(-50%); width: 300px; }
.cv-orn.tl { top: -56px; left: -58px; width: 150px; }
.cv-orn.tr { top: -56px; right: -58px; width: 150px; }
.cv-orn.bl { bottom: -66px; left: -62px; width: 170px; }
.cv-orn.br { bottom: -66px; right: -62px; width: 170px; }
```

### `src/ui/forge.css`

```css
/* The Forge — redesign A+C: cena full-bleed (Maël) + Altar da Transformação.
   Tudo prefixado fg- e ancorado em .forge. Palco: 1920×1080 (view = inset:0). */

.forge {
  --fg-panel: rgba(8,12,24,.86);
  --fg-panel-2: rgba(14,20,36,.92);
  --fg-line: rgba(170,200,255,.26);
  --fg-line-soft: rgba(170,200,255,.13);
  --fg-ink: #dbe6ff; --fg-dim: #8fa3c8; --fg-faint: #5a6678;
  --fg-gold: #d9a441; --fg-ember: #c96a2a; --fg-ok: #7fd08a; --fg-no: #d0807f;
  --fg-r-faded: #6b7280; --fg-r-kindled: #c96a2a; --fg-r-luminous: #d9a441;
  --fg-r-radiant: #f0d9a0; --fg-r-converged: #aac8ff;
  font-family: 'Inter', sans-serif; color: var(--fg-ink);
}
.view.forge { display: block; padding: 0; overflow: hidden; }

/* cena full-bleed (com fallback de forja atmosférica enquanto a arte não chega) */
.forge .fg-screen {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background:
    url('eclats/forge/forge_screen.webp') center / 100% 100% no-repeat,
    radial-gradient(1100px 700px at 22% 78%, rgba(201,106,42,.18), transparent 60%),
    radial-gradient(900px 600px at 60% 20%, rgba(217,164,65,.10), transparent 60%),
    #0b0f16;
}

/* mapeamento de cor por raridade (texto + tint do box) */
.forge .r-f { color: #aab4c6; }               .forge .fg-piece.r-f { --tint: var(--fg-r-faded); }
.forge .r-k { color: #e8854a; }              .forge .fg-piece.r-k { --tint: var(--fg-r-kindled); }
.forge .r-l { color: #ecc05e; }              .forge .fg-piece.r-l { --tint: var(--fg-r-luminous); }
.forge .r-r { color: #f5e4b8; }              .forge .fg-piece.r-r { --tint: var(--fg-r-radiant); }
.forge .r-c { color: #c5dbff; }              .forge .fg-piece.r-c { --tint: var(--fg-r-converged); }

/* ---------------- Nameplate do Maël (mesma moldura do Lucius) ---------------- */
.forge .fg-mael-id {
  position: absolute; left: 3%; bottom: 5%; z-index: 3; pointer-events: none;
  width: 420px; aspect-ratio: 1672 / 941;
  background: url('eclats/gear/nameplate.webp') center / 100% 100% no-repeat;
}
.forge .fg-mael-text {
  position: absolute; left: 50%; top: 52%; transform: translate(-50%, -50%); text-align: center;
  white-space: nowrap; padding: 2px 26px; border-radius: 999px;
  background: radial-gradient(68% 96% at 50% 50%, rgba(0,0,0,.8), rgba(0,0,0,.42) 60%, transparent 78%);
}
.forge .fg-mael-name { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 34px; color: #f5ecd8;
  line-height: 1; text-shadow: 0 2px 4px #000, 0 0 22px rgba(217,164,65,.22); }
.forge .fg-mael-title { margin-top: 3px; font-size: 16px; letter-spacing: .26em; text-transform: uppercase;
  font-weight: 600; color: var(--fg-ember); text-shadow: 0 1px 4px #000; }

/* ---------------- Materiais (chips, topo-esquerda) ---------------- */
.forge .fg-mats { position: absolute; left: 3%; top: 9%; z-index: 3; width: 350px; }
.forge .fg-matrow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.forge .fg-chip {
  display: flex; align-items: center; gap: 11px; border: 1.5px solid; border-radius: 10px;
  background: var(--fg-panel-2); padding: 9px 11px; backdrop-filter: blur(3px);
}
.forge .fg-th { width: 44px; height: 44px; border-radius: 7px; overflow: hidden; flex: none; --tint: #6b7280;
  border: 1.5px solid var(--tint);
  background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--tint) 28%, #0a0f1c), color-mix(in srgb, var(--tint) 74%, #0a0f1c)); }
.forge .fg-th img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.2); }
.forge .fg-chip.kindled { --tint: var(--fg-r-kindled); }
.forge .fg-chip.luminous { --tint: var(--fg-r-luminous); }
.forge .fg-chip.radiant { --tint: var(--fg-r-radiant); }
.forge .fg-chip.converged { --tint: var(--fg-r-converged); }
.forge .fg-chip b { font-size: 20px; color: #eef4ff; font-variant-numeric: tabular-nums; }
.forge .fg-chip span { display: block; font-size: 16px; letter-spacing: .14em; text-transform: uppercase; }
.forge .fg-chip.kindled { border-color: var(--fg-r-kindled); color: var(--fg-r-kindled); } .forge .fg-chip.kindled span { color: #e8854a; }
.forge .fg-chip.luminous { border-color: var(--fg-r-luminous); color: var(--fg-r-luminous); } .forge .fg-chip.luminous span { color: #ecc05e; }
.forge .fg-chip.radiant { border-color: var(--fg-r-radiant); color: var(--fg-r-radiant); } .forge .fg-chip.radiant span { color: #f5e4b8; }
.forge .fg-chip.converged { border-color: var(--fg-r-converged); color: var(--fg-r-converged); } .forge .fg-chip.converged span { color: #c5dbff; }
.forge .fg-chip.empty { opacity: .42; }

/* ---------------- Trilho de receitas (direita) ---------------- */
.forge .fg-rail { position: absolute; right: 2.5%; top: 9%; bottom: 6%; width: 426px; z-index: 3; display: flex; flex-direction: column; }
.forge .fg-tabs { display: flex; gap: 6px; }
.forge .fg-tabs button {
  height: 42px; padding: 0 20px; border: 1px solid var(--fg-line); border-bottom: none; border-radius: 10px 10px 0 0;
  background: rgba(8,12,24,.6); color: var(--fg-dim); font-size: 16px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; cursor: pointer;
}
.forge .fg-tabs button.on { background: var(--fg-panel); color: var(--fg-ember); border-color: var(--fg-ember); }
.forge .fg-tabs button.locked { opacity: .45; cursor: not-allowed; }
.forge .fg-tabs button.locked::after { content: ' 🔒'; font-size: 16px; }
.forge .fg-rlist {
  flex: 1; border: 1px solid var(--fg-ember); border-radius: 0 14px 14px 14px; background: var(--fg-panel);
  padding: 12px; display: flex; flex-direction: column; gap: 7px; overflow: visible;
  box-shadow: 0 0 0 1px rgba(201,106,42,.14); backdrop-filter: blur(3px);
}
.forge .fg-rgroup { font-size: 16px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: #c9b78a; padding: 8px 4px 3px; }
.forge .fg-recipe {
  display: flex; align-items: center; gap: 11px; border: 1.5px solid var(--fg-line-soft); border-radius: 10px;
  background: var(--fg-panel-2); padding: 8px 11px; cursor: pointer; width: 100%; text-align: left; transition: border-color .14s;
}
.forge .fg-recipe:hover { border-color: var(--fg-ember); }
.forge .fg-recipe.sel { border-color: var(--fg-ember); box-shadow: 0 0 0 1px var(--fg-ember), 0 0 18px -6px rgba(201,106,42,.7); }
.forge .fg-ic { width: 52px; height: 52px; border-radius: 9px; overflow: hidden; flex: none; --tint: #6b7280;
  border: 2px solid var(--tint); display: grid; place-items: center;
  background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--tint) 28%, #0a0f1c), color-mix(in srgb, var(--tint) 74%, #0a0f1c)); }
.forge .fg-ic img, .forge .fg-ic picture { width: 100%; height: 100%; object-fit: contain; }
.forge .fg-recipe .fg-meta { flex: 1; min-width: 0; }
.forge .fg-recipe .fg-nm { display: block; font-size: 16px; font-weight: 600; color: #eef4ff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.forge .fg-recipe .fg-sub { display: block; font-size: 16px; color: var(--fg-dim); margin-top: 2px; }
.forge .fg-st { flex: none; font-size: 16px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.forge .fg-st.ok { color: var(--fg-ok); } .forge .fg-st.no { color: var(--fg-faint); }
.forge .fg-recipe.r-f .fg-ic { --tint: var(--fg-r-faded); }
.forge .fg-recipe.r-k .fg-ic { --tint: var(--fg-r-kindled); }
.forge .fg-recipe.r-l .fg-ic { --tint: var(--fg-r-luminous); }
.forge .fg-recipe.r-r .fg-ic { --tint: var(--fg-r-radiant); }
.forge .fg-recipe.r-c .fg-ic { --tint: var(--fg-r-converged); }

/* ---------------- Altar da Transformação (centro) ---------------- */
.forge .fg-altar {
  /* conteúdo sobre a bigorna, SEM painel/fundo — a cena da forja aparece atrás */
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 2;
  width: 520px; max-height: 90%;
  background: transparent;
  padding: 4px 14px; display: flex; flex-direction: column; align-items: center; overflow-y: auto;
}
.forge .fg-altar-head { text-align: center; }
.forge .fg-altar-head h3 { font-family: 'Cormorant Garamond', serif; font-size: 32px; color: #f5ecd8;
  text-shadow: 0 2px 6px #000, 0 0 18px rgba(0,0,0,.8); }
.forge .fg-path { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 4px;
  font-size: 16px; letter-spacing: .18em; text-transform: uppercase; font-weight: 700;
  text-shadow: 0 1px 4px #000; }
.forge .fg-path .fg-fa { color: var(--fg-faint); }

/* morph antes→depois (peças) */
.forge .fg-morph { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 16px 0; }
.forge .fg-morph.solo { gap: 0; }
/* cada gear na sua box com moldura + cor da raridade bem definida; arte grande dentro */
.forge .fg-piece { position: relative; width: 160px; aspect-ratio: 1; --tint: #6b7280;
  border: 2.5px solid var(--tint); border-radius: 13px; padding: 7%;
  /* preenche com a COR DA RARIDADE (forte nas bordas, centro mais escuro p/ a arte ler) */
  background: radial-gradient(circle at 50% 42%,
    color-mix(in srgb, var(--tint) 32%, #0a0f1c) 0%,
    color-mix(in srgb, var(--tint) 88%, #0a0f1c) 100%);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tint) 45%, transparent);
  display: grid; place-items: center; }
.forge .fg-piece.next { width: 186px;
  border-color: color-mix(in srgb, var(--tint) 80%, #fff);
  box-shadow: 0 0 26px -6px color-mix(in srgb, var(--tint) 75%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--tint) 40%, transparent); }
.forge .fg-piece img, .forge .fg-piece picture { width: 100%; height: 100%; object-fit: contain;
  filter: drop-shadow(0 4px 10px #0008); }
.forge .fg-spark { font-size: 30px; color: var(--fg-gold); text-shadow: 0 0 16px rgba(217,164,65,.8); }

/* morph de materiais (refino) */
.forge .fg-morph.mat .fg-mpiece { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.forge .fg-morph.mat .fg-mpiece b { font-size: 19px; color: #eef4ff; font-variant-numeric: tabular-nums; }
.forge .fg-morph.mat .fg-mpiece.big b { font-size: 24px; }
/* box do material — moldura + cor da raridade bem definida (igual aos gears) */
.forge .fg-mbox { width: 96px; aspect-ratio: 1; --tint: #6b7280;
  border: 2.5px solid var(--tint); border-radius: 12px; padding: 11%;
  background: radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--tint) 32%, #0a0f1c), color-mix(in srgb, var(--tint) 88%, #0a0f1c));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tint) 45%, transparent); display: grid; place-items: center; }
.forge .fg-mbox img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 3px 8px #0008); }
.forge .fg-mpiece.big .fg-mbox { width: 136px; }
.forge .fg-mbox.r-f { --tint: var(--fg-r-faded); }
.forge .fg-mbox.r-k { --tint: var(--fg-r-kindled); }
.forge .fg-mbox.r-l { --tint: var(--fg-r-luminous); }
.forge .fg-mbox.r-r { --tint: var(--fg-r-radiant); }
.forge .fg-mbox.r-c { --tint: var(--fg-r-converged); }

/* bloco "usado em" (material info + tooltip do trilho) */
.forge .fg-uses { width: 100%; max-width: 420px; text-align: center; margin: 6px 0 12px; padding: 12px 14px;
  background: rgba(0,0,0,.3); border-radius: 10px; border: 1px solid var(--fg-line-soft); }
.forge .fg-use-l { font-size: 16px; color: var(--fg-dim); letter-spacing: .04em; }
.forge .fg-use-n { font-size: 16px; color: #dbe6ff; margin-top: 3px; }

/* tooltip do material no trilho (hover) — estoque + usos */
.forge .fg-recipe { position: relative; }
.forge .fg-mtip {
  display: none; position: absolute; right: calc(100% + 10px); top: 50%; transform: translateY(-50%);
  z-index: 30; width: 260px; text-align: left; pointer-events: none;
  background: rgba(6,9,18,.97); border: 1px solid rgba(217,164,65,.4); border-radius: 11px; padding: 11px 13px;
  box-shadow: 0 12px 30px -8px #000;
}
.forge .fg-recipe:hover .fg-mtip { display: block; }
.forge .fg-mtip b { display: block; font-size: 16px; color: #f5ecd8; }
.forge .fg-mtip .fg-tip-hold { display: block; font-size: 16px; color: var(--fg-gold); margin: 2px 0 9px; font-variant-numeric: tabular-nums; }
.forge .fg-mtip .fg-use-n { font-size: 16px; }

/* preview (itens) + bônus por HOVER (sem aviso) */
.forge .fg-preview { position: relative; display: flex; flex-direction: column; align-items: center; margin-bottom: 4px; }

/* delta de stats — tooltip flutuante revelado no hover do preview */
.forge .fg-delta {
  display: none; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  z-index: 8; width: 440px; gap: 5px; padding: 10px;
  background: rgba(6, 9, 18, .96); border: 1px solid rgba(217,164,65,.35); border-radius: 12px;
  box-shadow: 0 14px 36px -10px #000;
}
.forge .fg-preview:hover .fg-delta { display: grid; }
.forge .fg-dl { display: grid; grid-template-columns: 1fr auto auto auto; align-items: baseline; gap: 10px;
  font-size: 17px; padding: 8px 13px; border-radius: 7px; background: rgba(0,0,0,.32); }
.forge .fg-dl .fg-dlk { color: #c3d0e8; }
.forge .fg-dl .fg-dlk em { font-style: normal; font-size: 16px; letter-spacing: .12em; color: #9be08a; margin-left: 6px; }
.forge .fg-dl .fg-dlb { color: var(--fg-dim); font-variant-numeric: tabular-nums; }
.forge .fg-dl .fg-dla { color: var(--fg-faint); }
.forge .fg-dl .fg-dlv { color: var(--fg-gold); font-weight: 700; font-size: 18px; font-variant-numeric: tabular-nums; }
.forge .fg-dl.new { background: rgba(155,224,138,.08); }
.forge .fg-dl.new .fg-dlv { color: #9be08a; }

/* qty stepper (refino) */
.forge .fg-qty { display: flex; align-items: center; gap: 9px; margin-bottom: 16px; }
.forge .fg-qty button { appearance: none; cursor: pointer; height: 42px; min-width: 42px; padding: 0 14px; border-radius: 9px;
  border: 1.5px solid var(--fg-ember); background: rgba(201,106,42,.16); color: #f3c79a; font-weight: 700; font-size: 20px; line-height: 1; }
.forge .fg-qty button:hover:not(:disabled) { background: rgba(201,106,42,.32); color: #fff; }
.forge .fg-qty button:disabled { opacity: .35; cursor: not-allowed; }
.forge .fg-qty .fg-qn { min-width: 48px; text-align: center; font-size: 21px; font-weight: 700; color: #f5ecd8; font-variant-numeric: tabular-nums; }
.forge .fg-qty .fg-maxq { font-size: 16px; letter-spacing: .08em; text-transform: uppercase;
  background: linear-gradient(180deg, #e08438, var(--fg-ember)); color: #1a0e04; border-color: transparent;
  box-shadow: 0 0 18px -5px rgba(201,106,42,.7); }
.forge .fg-qty .fg-maxq:hover:not(:disabled) { filter: brightness(1.1); color: #1a0e04; }

/* gates — ícone real do item + barra com a fração + selo (cada um com sua cara) */
.forge .fg-gates { width: 100%; max-width: 440px; display: grid; gap: 10px; margin-bottom: 16px; }
.forge .fg-gate { display: grid; grid-template-columns: 74px 1fr auto; align-items: center; gap: 14px;
  border: 1px solid var(--fg-line-soft); border-radius: 12px; background: var(--fg-panel-2); padding: 10px 13px; }
.forge .fg-gic { width: 74px; height: 74px; border-radius: 10px; overflow: hidden; --tint: #6b7280;
  border: 2px solid var(--tint); display: grid; place-items: center;
  background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--tint) 28%, #0a0f1c), color-mix(in srgb, var(--tint) 74%, #0a0f1c)); }
.forge .fg-gic img, .forge .fg-gic picture { width: 100%; height: 100%; object-fit: contain; }
.forge .fg-gbar { position: relative; height: 28px; border-radius: 7px; background: rgba(0,0,0,.42);
  overflow: hidden; border: 1px solid rgba(255,255,255,.08); }
.forge .fg-gbar i { position: absolute; inset: 0; border-radius: 7px; background: linear-gradient(90deg, var(--fg-ember), var(--fg-gold)); }
.forge .fg-gbar em { position: absolute; inset: 0; display: grid; place-items: center; font-style: normal;
  font-size: 16px; font-weight: 700; color: #fff; text-shadow: 0 1px 3px #000; font-variant-numeric: tabular-nums; letter-spacing: .04em; }
.forge .fg-gseal { width: 46px; height: 46px; display: grid; place-items: center; flex: none; }
.forge .fg-gseal img { width: 100%; height: 100%; object-fit: contain; }
.forge .fg-gate.ok { border-color: rgba(127,208,138,.35); }

/* botão forjar */
.forge .fg-forgebtn {
  appearance: none; cursor: pointer; width: 100%; max-width: 420px; height: 52px; border: 0; border-radius: 12px;
  font-weight: 700; font-size: 16px; letter-spacing: .14em; text-transform: uppercase;
  background: linear-gradient(180deg, #e08438, var(--fg-ember)); color: #1a0e04;
  box-shadow: 0 0 28px -4px rgba(201,106,42,.65), inset 0 1px 0 rgba(255,255,255,.35);
}
.forge .fg-forgebtn:hover:not(:disabled) { filter: brightness(1.1); }
.forge .fg-forgebtn:disabled { filter: grayscale(.6) brightness(.7); cursor: not-allowed; }
.forge .fg-altar-note { margin-top: 10px; font-size: 16px; color: #9fb0cc; font-style: italic; text-align: center;
  text-shadow: 0 1px 4px #000; }
.forge .fg-flavor { margin-top: 8px; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 17px;
  color: #d8c9a0; line-height: 1.5; text-align: center; max-width: 440px; text-shadow: 0 1px 5px #000, 0 0 12px rgba(0,0,0,.6); }
```

### `src/ui/gear.css`

```css
/* ============================================================
   Éclats of Lumière — Tela de Gear / Equipment (REDESIGN paper-doll)
   Moldura do modal (vitrine dourada) + Armeiro ao centro + 6 slots
   (3 esq + 3 dir) com Level Up inline + barra de multiplicador global.
   Slot por tier (raridade). Subir raridade = na Forja.
   ============================================================ */

/* NÃO sobrescrever position: a .view base já é absolute inset:0 (containing block) */
.view.gear { display: block; padding: 0; overflow: hidden; }

/* fundo ÚNICO da tela — moldura + forja + Armeiro integrados (full-bleed) */
.gr-screen {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: url('eclats/gear/screen.webp') center / 100% 100% no-repeat;
}

/* ---------- esquerda: stats (sobreposto, dentro da área limpa) ---------- */
.gr-summary {
  position: absolute; left: 7.5%; top: 15.5%; width: 270px; max-height: 64%; z-index: 3;
  background: color-mix(in srgb, #0b1226 92%, transparent);
  border: 1px solid rgba(217, 164, 65, .35); border-radius: 14px;
  box-shadow: 0 0 40px -14px #000, inset 0 0 0 1px rgba(217,164,65,.1);
  backdrop-filter: blur(3px);
  padding: 18px; overflow-y: auto; overflow-x: hidden;
}

/* colunas de slots nas áreas LATERAIS (o Armeiro da arte fica entre elas) */
.gr-summary h3 { margin: 0 0 14px; font-family: var(--font-display); font-weight: 700;
  font-size: var(--fs-lg); color: var(--ink); letter-spacing: .02em; }
.gr-totals { display: grid; gap: 8px; margin: 0; }
.gr-totals > div { display: flex; justify-content: space-between; align-items: baseline;
  background: var(--panel-2); border: var(--border-soft); border-radius: var(--radius-sm); padding: 9px 12px; }
.gr-totals dt { font-size: var(--fs-xs); color: var(--dim); text-transform: uppercase; letter-spacing: .1em; }
.gr-totals dd { margin: 0; display: flex; align-items: baseline; gap: 7px;
  font-variant-numeric: tabular-nums; }
.gr-totals dd b { font-size: var(--fs-md); font-weight: 700; color: var(--gold); }
.gr-totals dd i { font-size: var(--fs-xs); font-style: normal; font-weight: 600; color: var(--dim); }
.gr-note { margin-top: 14px; font-size: var(--fs-xs); color: var(--faint); font-style: italic; }

/* Breakdown — só os bônus liberados (1 linha por afixo, sem nome/raridade) */
.gr-breakdown { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.gr-breakdown li { display: flex; align-items: baseline; gap: 8px;
  background: var(--panel-2); border: var(--border-soft); border-radius: var(--radius-sm);
  padding: 8px 12px; font-size: var(--fs-sm); font-variant-numeric: tabular-nums; }
.gr-breakdown li b { color: var(--ink); font-weight: 700; }      /* base/flat = branco (ref.) */
.gr-breakdown li span { color: var(--ink); }
.gr-breakdown li i { margin-left: auto; font-style: normal; font-size: 12px; color: var(--faint); }
.gr-breakdown li.bonus b { color: #6fdc8c; }                     /* camada bônus/multiplier = verde */

/* ---------- centro: Armeiro (pés ancorados na base = plataforma) ---------- */
/* ---------- slots (colunas flanqueando o Armeiro da arte) — frame dourado uniforme ---------- */
.gr-slots-col {
  position: absolute; top: 49%; transform: translateY(-50%); z-index: 2;
  display: flex; flex-direction: column; justify-content: center; gap: 22px; width: 252px;
}
.gr-slots-col.side-left { left: 21.5%; }
.gr-slots-col.side-right { right: 21.5%; }
/* slot em LINHA: caixa + ações (Level up + custo) no lado EXTERNO (longe do Armeiro) */
.gr-slot { display: flex; align-items: center; gap: 9px; width: 100%; }
.side-left .gr-slot { flex-direction: row-reverse; }   /* ações à esquerda (externo) */
.side-right .gr-slot { flex-direction: row; }          /* ações à direita (externo) */

/* caixa quadrada: moldura dourada (do canvas) + arte do item dentro */
.gr-slot-box { position: relative; width: 150px; flex: none; aspect-ratio: 1; }
.gr-slot-art {
  /* fundo preenche a JANELA da moldura (inset pequeno, estilo card do Seeker);
     a moldura fica levemente maior e sobrepõe a borda — sem vão.
     padding dá a margem interna pra arte (contain) não bater nos ornamentos. */
  position: absolute; inset: 0; z-index: 1; border-radius: 6px; overflow: hidden;
  /* fundo do box pinta a COR DA RARIDADE (não navy fixo); a arte é recortada por cima */
  --tint: #6b7280;
  background: radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--tint) 45%, #0a1024), #0a1024);
  display: grid; place-items: center; padding: 13%;
}
.gr-slot.tier-faded     .gr-slot-art { --tint: var(--r-faded); }
.gr-slot.tier-kindled   .gr-slot-art { --tint: var(--r-kindled); }
.gr-slot.tier-luminous  .gr-slot-art { --tint: var(--r-luminous); }
.gr-slot.tier-radiant   .gr-slot-art { --tint: var(--r-radiant); }
.gr-slot.tier-converged .gr-slot-art { --tint: var(--r-converged); }
.gr-slot-art picture, .gr-slot-art img { width: 100%; height: 100%; object-fit: contain; display: block; }
.gr-slot-frame {
  /* levemente maior que o box: a borda interna da moldura sobrepõe o fundo (sem vão) */
  position: absolute; inset: -3%; z-index: 2; pointer-events: none;
  background: url('eclats/gear/slot_frame.webp') center / 100% 100% no-repeat;
}
.gr-slot-lvl {
  position: absolute; top: -7px; left: 50%; transform: translateX(-50%); z-index: 3;
  font-size: 16px; font-weight: 700; color: #fff; font-variant-numeric: tabular-nums;
  background: rgba(8,12,24,.88); border: 1px solid rgba(217,164,65,.45); border-radius: 5px;
  padding: 1px 8px; white-space: nowrap; text-shadow: 0 1px 2px #000;
}
.gr-slot:hover .gr-slot-frame { filter: drop-shadow(0 0 9px var(--gold)); }

/* ações ao lado externo: Level up + custo (ícone Lumens), ambos em caixa escura */
.gr-slot-actions { display: flex; flex-direction: column; align-items: stretch; gap: 7px; width: 92px; flex: none; }
.gr-slot-up {
  width: 100%; cursor: pointer; appearance: none; text-align: center;
  font-size: 16px; font-weight: 700; letter-spacing: .02em;
  color: #d7c79c; background: rgba(11, 18, 38, .9); border: 1px solid rgba(217,164,65,.45);
  border-radius: 8px; padding: 8px 0; transition: filter .12s, opacity .12s;
}
.gr-slot-up:disabled { cursor: not-allowed; }
.gr-slot.afford .gr-slot-up { color: #1a1204; background: linear-gradient(180deg, #e8c477, var(--gold));
  border-color: transparent; box-shadow: 0 0 16px -4px var(--gold); }
.gr-slot.afford .gr-slot-up:hover { filter: brightness(1.08); }
.gr-slot.capped .gr-slot-up { color: var(--eclat); }
/* custo na própria caixa escura (pra aparecer sobre o dourado) */
.gr-slot-cost { display: flex; align-items: center; justify-content: center; gap: 5px;
  background: rgba(11, 18, 38, .9); border: 1px solid rgba(217,164,65,.4); border-radius: 8px;
  padding: 5px 6px; font-size: 16px; font-weight: 700; color: #e8d49a; font-variant-numeric: tabular-nums; }
.gr-cost-ic { width: 18px; height: 18px; object-fit: contain; flex: none; }
.gr-cost-max { color: var(--eclat); font-size: 16px; }

/* tooltip de atributos (hover do slot) */
.gr-tip {
  display: none; position: absolute; top: 50%; transform: translateY(-50%); z-index: 20;
  width: 320px; text-align: left; pointer-events: none;
  background: rgba(8, 12, 24, .97); border: 1px solid rgba(217, 164, 65, .6); border-radius: 14px;
  padding: 18px 20px; box-shadow: 0 12px 34px -8px #000;
}
.gr-slot:hover .gr-tip { display: block; }
.side-left .gr-tip { left: 114%; }
.side-right .gr-tip { right: 114%; }
.gr-tip-name { margin: 0 0 3px; font-family: var(--font-display); font-size: 22px; font-weight: 700; }
.gr-tip-sub { font-size: 16px; color: var(--dim); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 14px; }
.gr-tip-affixes { display: grid; gap: 9px; }
/* cada afixo: valor (bold) + label, e o descritor "per level" (dim) à direita */
.gr-aff { display: flex; align-items: baseline; gap: 7px; font-size: 17px; color: var(--dim);
  font-variant-numeric: tabular-nums; }
.gr-aff-v { color: var(--ink); font-weight: 700; }
.gr-aff-l { color: var(--ink); }
.gr-aff-per { margin-left: auto; font-style: normal; font-size: 14px; color: var(--faint); }
.gr-aff.primary .gr-aff-v { color: var(--gold); }
.gr-aff.bonus .gr-aff-v { color: #6fdc8c; }   /* camada bônus/multiplier = verde (ref.) */
/* afixo bloqueado: dimmed, mostra a raridade que destrava à direita */
.gr-aff.locked { opacity: .5; }
.gr-aff.locked .gr-aff-l { color: var(--dim); }
.gr-aff.locked .gr-aff-per { color: var(--gold); opacity: .8; text-transform: uppercase; letter-spacing: .06em; }

/* ---------- nameplate do Armeiro (Lucius), aos pés — mesmo estilo do Maël ---------- */
.gr-npc-id {
  position: absolute; left: 48%; bottom: 4%; transform: translateX(-50%);
  z-index: 3; pointer-events: none;
  /* moldura ornamental dourada (filigrana + campo navy) atrás do nome — maior pra caber o texto */
  width: 560px; aspect-ratio: 1672 / 941;
  background: url('eclats/gear/nameplate.webp') center / 100% 100% no-repeat;
}
/* texto ancorado no CENTRO do campo navy da imagem (medido: y 52%) */
.gr-npc-text {
  position: absolute; left: 50%; top: 52%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; text-align: center;
  white-space: nowrap;
  /* backdrop preto suave (contido no campo navy, sem vazar pra moldura) */
  padding: 2px 26px; border-radius: 999px;
  background: radial-gradient(68% 96% at 50% 50%, rgba(0,0,0,.8), rgba(0,0,0,.42) 60%, transparent 78%);
}
.gr-npc-name {
  font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 38px; color: #f5ecd8;
  letter-spacing: .02em; line-height: 1;
  text-shadow: 0 2px 4px #000, 0 0 22px rgba(217,164,65,.22);
}
.gr-npc-title {
  margin-top: 3px;
  font-size: 16px; letter-spacing: .26em; text-transform: uppercase; font-weight: 600;
  color: #c96a2a; text-shadow: 0 1px 4px #000;
}

/* ---------- multiplicador global — pílula no canto inferior direito ---------- */
.gr-multbar {
  position: absolute; right: 6.5%; bottom: 6.5%; z-index: 3;
  display: flex; align-items: center; gap: 12px;
  background: rgba(8, 12, 24, .82); border: 1px solid rgba(217, 164, 65, .35);
  border-radius: 12px; padding: 8px 14px; box-shadow: 0 6px 20px -8px #000;
}
.gr-multbar-l { font-size: var(--fs-sm); color: #c9b78a; letter-spacing: .04em; }
.gr-mults { display: flex; gap: 7px; }
.gr-mults button {
  appearance: none; cursor: pointer; padding: 8px 14px; border-radius: 8px;
  border: 1px solid rgba(217,164,65,.35); background: color-mix(in srgb, #0a1024 80%, transparent);
  color: var(--dim); font-size: var(--fs-sm); font-weight: 700; font-variant-numeric: tabular-nums;
  transition: border-color .14s, color .14s, background .14s;
}
.gr-mults button:hover { border-color: var(--gold); color: var(--ink); }
.gr-mults button.active { border-color: var(--gold); color: var(--gold);
  background: color-mix(in srgb, var(--gold) 18%, #0a1024); }
.gr-mults .gr-max { color: #9be08a; border-color: rgba(155,224,138,.45); }
.gr-mults .gr-max.active { color: #9be08a; border-color: #9be08a; background: color-mix(in srgb, #9be08a 16%, #0a1024); }
```

### `src/ui/map.css`

```css
/* ============================================================
   Éclats of Lumière — Tela de Mapa (U-3)
   Nível 1: Mapa-Múndi (atlas + 5 pinos). Nível 2: Continente
   (crop + 5 nós de sub-área + painel direito). Chrome branco/azul frio.
   ============================================================ */

.view.map { display: block; padding: 0; overflow: hidden; }
.map-world, .map-continent { position: absolute; inset: 0; }

.map-bg {
  position: absolute; inset: 0; z-index: 0;
  background-size: cover; background-position: center;
}

/* mundo em tela cheia: o canvas mantém o aspect da arte e COBRE o palco
   inteiro (transborda centrado no eixo que sobrar; overflow escondido).
   Os pinos ficam dentro do canvas, então seguem presos à imagem. */
.map-frame {
  position: absolute; inset: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.map-canvas {
  /* altura do palco é fixa (1080): largura mínima p/ cobrir = 1080×(1672/941)
     ≈ 1919px; em palcos mais largos o 100% assume e o excesso vertical corta. */
  position: relative; flex: none; aspect-ratio: 1672 / 941;
  width: max(1919px, 100%);
}
.map-bg.world { background-size: contain; background-repeat: no-repeat; }
.map-bg.world::after { background: none; } /* sem vinheta cortando a arte */
.map-bg::after {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(120% 90% at 50% 30%, transparent 40%, rgba(5,7,15,.6));
}

/* título do mundo — véu escuro radial atrás do texto pra destacar da arte */
.map-title {
  position: absolute; z-index: 3; top: 88px; left: 0; right: 0; text-align: center;
  padding: 18px 0 22px; pointer-events: none;
}
.map-title::before {
  content: ""; position: absolute; inset: 0; z-index: -1;
  background: radial-gradient(60% 100% at 50% 45%, rgba(5,7,15,.78), rgba(5,7,15,.32) 55%, transparent 78%);
}
.map-title b { display: block; font-family: var(--font-display); font-weight: 700;
  font-size: var(--fs-xxl); letter-spacing: .04em; color: #fff;
  text-shadow: 0 2px 4px #000, 0 4px 22px #000e, 0 0 40px rgba(217,164,65,.25); }
.map-title span { display: inline-block; margin-top: 4px;
  font-size: var(--fs-sm); color: #cbd6ea; font-weight: 600;
  text-transform: uppercase; letter-spacing: .24em;
  text-shadow: 0 1px 3px #000, 0 2px 10px #000c; }

/* ---------------- Pinos do mundo ---------------- */
.map-pins { position: absolute; inset: 0; z-index: 4; }
.map-pin {
  position: absolute; transform: translate(-50%, -50%);
  appearance: none; background: none; border: 0; cursor: pointer;
  display: grid; justify-items: center; gap: 8px; padding: 0;
}
.map-pin .dot {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--eclat); border: 3px solid #06101f;
  box-shadow: var(--glow-eclat), 0 0 0 4px color-mix(in srgb, var(--eclat) 30%, transparent);
  transition: transform .14s ease;
}
.map-pin .lbl {
  font-family: var(--font-display); font-size: var(--fs-lg); color: var(--ink);
  background: color-mix(in srgb, var(--panel) 80%, transparent);
  border: var(--border-soft); border-radius: 999px; padding: 3px 14px;
  white-space: nowrap; backdrop-filter: blur(4px);
}
.map-pin:hover .dot { transform: scale(1.18); }
.map-pin.locked, .map-pin.done { cursor: default; }
.map-pin.locked:hover .dot, .map-pin.done:hover .dot { transform: none; }
.map-pin.locked .dot { background: var(--faint); box-shadow: none; border-color: #06101f; }
.map-pin.locked .lbl { color: var(--dim); }
.map-pin.locked .lbl::after { content: ' 🔒'; }
/* mapa conquistado (já passou) */
.map-pin.done .dot { background: var(--vest); box-shadow: var(--glow-vest); }
.map-pin.done .lbl::after { content: ' ✓'; color: var(--vest); }
/* mapa atual — pino pulsante, é o único clicável */
.map-pin.current { cursor: pointer; }
.map-pin.current .dot { animation: map-pulse 1.4s ease-in-out infinite; }
@keyframes map-pulse { 0%,100% { box-shadow: var(--glow-eclat), 0 0 0 4px color-mix(in srgb, var(--eclat) 30%, transparent); } 50% { box-shadow: var(--glow-eclat), 0 0 0 9px color-mix(in srgb, var(--eclat) 12%, transparent); } }

/* ---------------- Continente ---------------- */
.map-back {
  position: absolute; z-index: 5; top: 104px; left: 40px;
  appearance: none; cursor: pointer; padding: 10px 18px;
  background: var(--panel); border: var(--border); border-radius: 12px;
  color: var(--ink); font-size: var(--fs-md); font-family: var(--font-ui);
  transition: border-color .15s ease, background .15s ease;
}
.map-back:hover { border-color: var(--eclat); background: var(--panel-2); }

/* trilha entre as sub-áreas (atrás dos nós) — pontilhada, acende ao avançar */
.cont-trail { position: absolute; inset: 0; z-index: 3; width: 100%; height: 100%; pointer-events: none; }
.cont-trail line {
  stroke: var(--faint); stroke-width: 3; stroke-linecap: round;
  stroke-dasharray: 2.5 6; vector-effect: non-scaling-stroke; opacity: .35;
  transition: stroke .25s ease, opacity .25s ease;
}
.cont-trail line.open {
  stroke: var(--gold); opacity: .9;
  filter: drop-shadow(0 0 5px color-mix(in srgb, var(--gold) 70%, transparent));
}
.cont-trail line.locked { stroke: var(--faint); opacity: .28; }

/* nós das sub-áreas */
.map-nodes { position: absolute; inset: 0; z-index: 4; }
.sub-node {
  position: absolute; transform: translate(-50%, -50%);
  width: 76px; height: 76px; cursor: pointer; padding: 0;
  appearance: none; background: none; border: 0;
  display: grid; place-items: center;
}
.sub-node .ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 3px solid var(--eclat); background: color-mix(in srgb, var(--panel) 70%, transparent);
  box-shadow: var(--glow-eclat); backdrop-filter: blur(3px);
  transition: transform .14s ease;
}
.sub-node .num {
  position: relative; font-family: var(--font-display); font-weight: 700;
  font-size: 28px; color: var(--ink);
}
.sub-node:hover .ring { transform: scale(1.1); }
.sub-node.selected .ring { border-color: #fff; box-shadow: 0 0 24px -4px var(--eclat); }
.sub-node.current .ring { border-color: var(--gold); box-shadow: var(--glow-gold); }
.sub-node.current .num { color: var(--gold); }
.sub-node.cleared .ring { background: color-mix(in srgb, var(--vest) 28%, var(--panel)); }
.sub-node.locked .ring { border-color: var(--faint); box-shadow: none; }
.sub-node.locked .num { color: var(--faint); }
.sub-node.locked { cursor: not-allowed; }

/* nó com arte: ícone da sub-área + nome embaixo (substitui ring/num I–V) */
.sub-node.art { width: 172px; height: auto; display: grid; justify-items: center; gap: 4px; }
.sub-node.art .ico {
  width: 158px; height: 158px; display: grid; place-items: center;
  filter: drop-shadow(0 6px 14px #000a);
  transition: transform .15s ease, filter .15s ease;
}
.sub-node.art .ico img { width: 100%; height: 100%; object-fit: contain; display: block; }
.sub-node.art .nm {
  font-family: var(--font-display); font-weight: 700; font-size: 16px; color: #fff;
  letter-spacing: .02em; white-space: nowrap; text-align: center;
  padding: 2px 12px; border-radius: 999px;
  background: color-mix(in srgb, var(--panel) 78%, transparent);
  border: var(--border-soft); backdrop-filter: blur(4px);
  text-shadow: 0 1px 3px #000;
}
.sub-node.art:hover .ico { transform: scale(1.07); filter: drop-shadow(0 8px 18px #000c); }
.sub-node.art.selected .nm { border-color: #fff; color: #fff; box-shadow: 0 0 18px -4px var(--eclat); }
.sub-node.art.current .ico { filter: drop-shadow(0 0 16px var(--gold)); }
.sub-node.art.current .nm { border-color: var(--gold); color: var(--gold); }
.sub-node.art.cleared .nm::after { content: ' ✓'; color: var(--vest); }
.sub-node.art.locked { cursor: not-allowed; }
.sub-node.art.locked .ico { filter: grayscale(.85) brightness(.55); }
.sub-node.art.locked .nm { color: var(--faint); }
.sub-node.art.locked .nm::after { content: ' 🔒'; }

/* ---------------- Painel direito ---------------- */
.map-panel {
  position: absolute; z-index: 5; top: 104px; right: 40px; bottom: 40px;
  width: 380px;
  display: flex; flex-direction: column;
  background: color-mix(in srgb, var(--panel) 90%, transparent);
  border: var(--border); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-panel); backdrop-filter: blur(8px);
  overflow: hidden;
}
/* hidden vence o display:flex (painel só aparece ao clicar num ícone) */
.map-panel[hidden] { display: none; }
/* botão de fechar o painel */
.map-panel .panel-close {
  position: absolute; z-index: 6; top: 10px; right: 10px;
  width: 30px; height: 30px; padding: 0; border: none; cursor: pointer;
  border-radius: 50%; background: #000a; color: var(--ink);
  font: inherit; font-size: var(--fs-md); line-height: 30px; text-align: center;
}
.map-panel .panel-close:hover { background: #000d; color: #fff; }
.map-panel .cover {
  flex: none; height: 170px; background-size: cover; background-position: center;
  -webkit-mask-image: linear-gradient(#000 55%, transparent);
          mask-image: linear-gradient(#000 55%, transparent);
}
/* corpo ocupa o resto e distribui as seções (rola se faltar espaço) */
.panel-body {
  flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column;
  padding: 0 0 22px; overflow-y: auto;
}
.map-panel h2 {
  margin: -40px 22px 4px; position: relative;
  font-family: var(--font-display); font-weight: 700; font-size: var(--fs-xl);
  color: var(--ink); letter-spacing: .03em; text-shadow: 0 2px 10px #000c;
}
.map-panel .sub-name {
  margin: 0 22px 14px; font-size: var(--fs-sm); color: var(--eclat);
  text-transform: uppercase; letter-spacing: .14em;
}
/* lore — descritivo do mapa (o mapa conta a história do mundo) */
.map-panel .lore {
  margin: 0 22px 22px; font-family: var(--font-display);
  font-size: var(--fs-lg); line-height: 1.55; color: #d3deef;
  font-style: italic;
  border-left: 3px solid color-mix(in srgb, var(--eclat) 55%, transparent);
  padding-left: 14px; text-shadow: 0 1px 3px #0008;
}
/* recursos da área */
.map-panel .rewards { margin: 0 22px 22px; }
.map-panel .rewards-h { font-size: var(--fs-xs); color: var(--dim);
  text-transform: uppercase; letter-spacing: .14em; margin-bottom: 10px; }
.map-panel .rewards-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 9px; }
.map-panel .rewards-list li {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 11px 12px; border-radius: var(--radius-sm);
  background: var(--panel-2); border: var(--border-soft);
}
.map-panel .rewards-list span { font-size: var(--fs-md); color: var(--ink); }
.map-panel .rewards-list b { font-size: var(--fs-md); color: var(--gold);
  font-variant-numeric: tabular-nums; }
/* rodapé colado embaixo (só o botão) */
.map-panel .panel-foot { margin-top: auto; padding-top: 8px; }
.map-panel .facts { margin: 0 22px 22px; padding: 0; display: grid; gap: 13px; }
.map-panel .facts > div {
  display: flex; justify-content: space-between; align-items: baseline;
  border-bottom: var(--border-soft); padding-bottom: 11px;
}
.map-panel .facts dt { font-size: var(--fs-xs); color: var(--dim);
  text-transform: uppercase; letter-spacing: .12em; }
.map-panel .facts dd { margin: 0; font-size: var(--fs-md); font-weight: 600;
  color: var(--ink); font-variant-numeric: tabular-nums; }

.map-panel .panel-foot .enter-btn,
.enter-btn {
  display: block; margin: 0 22px; width: calc(100% - 44px); padding: 14px;
  cursor: pointer; border: 0; border-radius: 12px;
  background: var(--eclat); color: #06101f; font-weight: 700; font-size: var(--fs-md);
  box-shadow: var(--glow-eclat); transition: filter .14s ease, transform .1s ease;
}
.enter-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
.enter-btn:disabled { background: var(--panel-2); color: var(--faint);
  box-shadow: none; cursor: not-allowed; }
.map-panel .hint { margin: 12px 22px 0; font-size: var(--fs-xs); color: var(--faint);
  font-style: italic; font-family: var(--font-display); }
```

### `src/ui/memoires.css`

```css
/* ============================================================
   Éclats of Lumière — Tela de Mémoires (LINHA DO TEMPO)
   UMA era por vez em tela cheia: arte-janela (esq) + relíquias (dir),
   com seletor de timeline embaixo. Reuni-las = Tikkun Olam.
   ============================================================ */

.view.memoires { display: block; padding: 0; overflow: hidden; }

/* ---------------- Banner (Clarté / Tikkun Olam) ---------------- */
/* inscrições flutuantes (sem caixa) — combinam com o resto da tela */
.mm-banner { position: absolute; left: 50%; top: 14px; transform: translateX(-50%); z-index: 6;
  display: flex; align-items: center; gap: 40px; }
.mm-pill { display: grid; grid-template-columns: auto auto; align-items: baseline; gap: 0 12px;
  background: none; border: 0; padding: 0; position: relative; }
.mm-total::before { content: ""; position: absolute; left: -20px; top: 4px; bottom: 4px; width: 1px;
  background: rgba(240,220,160,.3); }
.mm-lbl { grid-row: 1; font-size: 16px; color: #e5cf94; text-transform: uppercase; letter-spacing: .2em;
  font-weight: 600; text-shadow: 0 1px 3px #000, 0 2px 8px #000, 0 0 12px #000; }
.mm-pill b { grid-row: 1; grid-column: 2; font-family: var(--font-display); font-weight: 700;
  font-size: 32px; line-height: 1; color: #fff3d6; font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 5px #000, 0 0 16px #000; }
.mm-sub { grid-column: 1 / 3; grid-row: 2; margin-top: 3px; font-size: 16px; color: #dbe2f0; font-style: italic;
  text-shadow: 0 1px 4px #000, 0 0 10px #000; }

/* ---------------- Stage (a era ativa, ARTE FULL-BLEED) ---------------- */
.mm-stage { position: absolute; inset: 0; z-index: 1; overflow: hidden; }
/* clima-fallback por era (até a arte 16:9 chegar) — segue a jornada de humor */
.mm-stage.era-1 { background: linear-gradient(135deg,#2a2410,#0f0c06); }
.mm-stage.era-2 { background: linear-gradient(135deg,#241f12,#0d0b07); }
.mm-stage.era-3 { background: linear-gradient(135deg,#1a0e0c,#080507); }
.mm-stage.era-4 { background: linear-gradient(135deg,#1c0d16,#0a0509); }
.mm-stage.era-5 { background: linear-gradient(135deg,#0e1830,#070b16); }
.mm-stage.has-art { background: var(--art) center / cover no-repeat; }
/* véu: abafa a arte pra casar com o fundo escuro do jogo (uniforme) +
   scrim à esquerda (legibilidade do título/lore) + base. Ajustável no 1º rgba. */
.mm-stage::after { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: rgba(5,7,14,.5),
    linear-gradient(90deg, rgba(4,6,12,.55) 0%, rgba(4,6,12,.1) 34%, transparent 55%),
    linear-gradient(180deg, transparent 58%, rgba(4,6,12,.55)); }

/* título da era (canto superior-esquerdo) */
.mm-era-title { position: absolute; left: 5%; top: 12%; z-index: 3; }
.mm-era-num { font-size: 17px; letter-spacing: .3em; text-transform: uppercase; color: #dcc792;
  text-shadow: 0 1px 4px #000; }
.mm-era-name { display: block; margin-top: 4px; font-family: var(--font-display); font-weight: 700;
  font-size: 64px; line-height: 1.02; color: #fbeec8; letter-spacing: .02em;
  text-shadow: 0 2px 4px #000, 0 3px 18px #000, 0 0 30px rgba(0,0,0,.9); }
.mm-era-beat { display: block; margin-top: 6px; font-family: var(--font-display); font-style: italic;
  font-size: 24px; color: #e6edf8; text-shadow: 0 1px 3px #000, 0 2px 10px #000; }

/* lore da era (passagem visível, esquerda) — maior e com placa escura de leitura */
.mm-lore { position: absolute; left: 4%; top: 30%; width: 33%; z-index: 3; margin: 0;
  padding: 16px 20px; border-radius: 14px;
  background: linear-gradient(180deg, rgba(6,9,16,.62), rgba(6,9,16,.5));
  backdrop-filter: blur(3px); border-left: 2px solid rgba(240,220,160,.45);
  font-family: var(--font-display); font-style: italic; font-size: 26px; line-height: 1.55; color: #fdf6e6;
  text-shadow: 0 1px 3px #000, 0 2px 10px rgba(0,0,0,.7); }

/* relíquia ESPALHADA — só ícone + texto (sem fundo), posicionada no scatter */
.mm-relic { position: absolute; transform: translate(-50%, -50%); cursor: pointer; appearance: none;
  background: none; border: 0; padding: 6px; z-index: 2; display: flex; align-items: center; gap: 18px;
  text-align: left; max-width: 560px; transition: transform .12s ease, filter .14s ease; }
.mm-relic:hover { transform: translate(-50%, -50%) scale(1.04); }
.mm-relic-art { width: 190px; height: 190px; flex: none; display: grid; place-items: center; }
.mm-relic-art picture, .mm-relic-art img { max-width: 100%; max-height: 190px; object-fit: contain;
  filter: drop-shadow(0 2px 4px #000) drop-shadow(0 0 14px color-mix(in srgb, var(--gold) 45%, transparent)); }
.mm-relic-text { min-width: 0; }
.mm-relic-name { display: block; font-family: var(--font-display); font-style: italic; font-size: var(--fs-xl);
  color: #fff; line-height: 1.12; text-shadow: 0 2px 6px #000, 0 0 14px #000; }
.mm-relic-eff { display: block; margin-top: 4px; font-size: 16px; color: #f0d9a0; font-weight: 600;
  text-shadow: 0 1px 4px #000, 0 0 10px #000; }
.mm-relic-foot { display: block; margin-top: 5px; font-size: 16px; font-weight: 700; color: #bfe3ff;
  font-variant-numeric: tabular-nums; text-shadow: 0 1px 4px #000, 0 0 10px #000; }
.mm-relic.buyable .mm-relic-art { filter: drop-shadow(0 2px 4px #000) drop-shadow(0 0 16px var(--eclat)); }
.mm-relic:not(.owned) .mm-relic-art { opacity: .72; }

/* véu da era travada */
.mm-stage-veil { position: absolute; inset: 0; z-index: 5; display: grid; place-content: center; gap: 10px;
  justify-items: center; text-align: center; background: rgba(6,9,16,.66); backdrop-filter: blur(2px);
  font-family: var(--font-display); font-size: var(--fs-lg); color: #d9c187; letter-spacing: .04em; }
.mm-stage-veil .mm-lock-i { font-size: 40px; }

/* ---------------- Seletor de timeline (5 marcos, rodapé) ---------------- */
.mm-selector { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 6;
  display: flex; align-items: flex-start; padding: 12px 28px 10px;
  background: rgba(6,9,16,.78); backdrop-filter: blur(6px); border-radius: 16px;
  border: 1px solid rgba(170,200,255,.16); box-shadow: 0 10px 30px -10px #000; }
.mm-selector::before { content: ""; position: absolute; top: 19px; left: 13%; right: 13%; height: 2px;
  background: rgba(170,200,255,.28); z-index: 0; }
.mm-mark { position: relative; z-index: 1; appearance: none; background: none; border: 0; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 0 30px; color: #c3cee2;
  transition: color .14s ease; }
.mm-mark-dot { width: 16px; height: 16px; border-radius: 50%; background: #141b2e;
  border: 2px solid rgba(170,200,255,.45); transition: all .15s ease; }
.mm-mark-lbl { text-align: center; line-height: 1.15; }
.mm-mark-lbl b { display: block; font-family: var(--font-display); font-weight: 700; font-size: var(--fs-md); color: inherit; }
.mm-mark-lbl i { font-style: normal; font-size: 16px; color: #97a3bb; font-variant-numeric: tabular-nums; }
.mm-mark:hover { color: #fff; }
.mm-mark.on { color: #f6e8c4; }
.mm-mark.on .mm-mark-dot { background: var(--gold); border-color: #fff;
  box-shadow: 0 0 16px var(--gold); }
.mm-mark.locked { opacity: .45; }
.mm-mark.locked .mm-mark-dot { background: #10141f; }
```

### `src/ui/mobile.css`

```css
/* ============================================================
   Éclats of Lumière — MODO MOBILE (só a tela de GEAR)
   Decisão Willian (2026-06-17): no celular (ex. Redmi Note 13 Pro) o resto do
   jogo já é jogável escalado; SÓ comprar gear era ruim (slots minúsculos). Então
   apenas a tela de Gear reflui numa LISTA fluida e rolável — ativada por
   body.m-flow (definido no fit() quando é mobile E a tela ativa é o Gear). As
   demais telas seguem no palco 1920×1080 escalado, como já estavam.
   ============================================================ */
@media (max-width: 920px) {
  /* ---- documento rolável (sai do palco escalado só enquanto o Gear está aberto) ---- */
  body.m-flow { overflow: auto; height: auto; }
  body.m-flow #screen { position: static; inset: auto; overflow: visible; height: auto; }
  body.m-flow #stage {
    position: static; transform: none !important; transform-origin: 0 0;
    width: 100% !important; height: auto; min-height: 100vh; box-shadow: none;
  }
  body.m-flow #stage-backdrop { position: fixed; inset: 0; }   /* fundo borrado fixo atrás */
  body.m-flow .stage-main { position: static; inset: auto; height: auto; }
  body.m-flow #toosmall { display: none !important; }

  /* ---- barra de topo FIXA: moedas em cima, nav (rolável, COM rótulos) embaixo ---- */
  body.m-flow .topbar {
    position: fixed; inset: 0 0 auto 0; height: auto; z-index: 60;
    flex-direction: column-reverse; align-items: stretch; gap: 6px;
    padding: 8px; background: rgba(5,7,15,.96); border-bottom: 1px solid var(--line);
    backdrop-filter: blur(8px);
  }
  body.m-flow .topbar .nav {
    display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px;
    -webkit-overflow-scrolling: touch; justify-content: flex-start;
  }
  body.m-flow .navbtn {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
    width: auto; min-width: 56px; height: auto; flex: none; padding: 7px 9px;
  }
  body.m-flow .navbtn .ico { position: relative; inset: auto; width: 26px; height: 26px; }
  body.m-flow .navbtn .lbl {
    display: block; font-size: 10px; line-height: 1; color: var(--dim);
    white-space: nowrap; letter-spacing: .02em;
  }
  body.m-flow .navbtn.active .lbl { color: var(--eclat); }
  body.m-flow .coins { display: flex; justify-content: center; }

  /* ============================================================
     GEAR — paper-doll vira LISTA vertical (mult no topo · 6 peças · bônus no fim)
     ============================================================ */
  body.m-flow .view.gear {
    position: static !important; inset: auto !important;
    opacity: 1 !important; visibility: visible !important; pointer-events: auto !important;
    display: flex; flex-direction: column; height: auto; min-height: 100vh;
    padding: 128px 12px 28px; overflow: visible;
  }
  body.m-flow .gr-screen,
  body.m-flow .gr-npc-id { display: none !important; }   /* arte de fundo + nameplate decorativos */
  body.m-flow .gr-tip { display: none !important; }      /* tooltip de hover não serve no toque */

  /* barra de multiplicador no TOPO (escolhe ×1/×100/MAX antes de comprar) */
  body.m-flow .gr-multbar {
    position: static !important; inset: auto !important; order: 1;
    margin: 0 0 14px; flex-wrap: wrap; justify-content: center; row-gap: 8px;
  }
  body.m-flow .gr-mults { flex-wrap: wrap; justify-content: center; }
  body.m-flow .gr-mults button { padding: 10px 14px; }

  /* as 6 peças, em linhas full-width (alvo de toque grande no "Level up") */
  body.m-flow .gr-slots-col {
    position: static !important; transform: none !important; inset: auto !important;
    order: 2; width: auto; display: block;
  }
  body.m-flow .gr-slot {
    flex-direction: row !important; align-items: center; gap: 12px;
    width: 100%; margin-bottom: 12px; padding: 10px;
    background: color-mix(in srgb, #0b1226 90%, transparent);
    border: 1px solid rgba(217,164,65,.3); border-radius: 12px;
  }
  body.m-flow .gr-slot-box { width: 76px; }
  body.m-flow .gr-slot-lvl { font-size: 13px; top: -8px; }
  body.m-flow .gr-slot-actions { width: auto; flex: 1 1 auto; }
  body.m-flow .gr-slot-up { padding: 16px 0; font-size: 17px; }
  body.m-flow .gr-slot-cost { padding: 10px; font-size: 16px; }

  /* resumo de bônus por último (referência) */
  body.m-flow .gr-summary {
    position: static !important; inset: auto !important; order: 3;
    width: auto; max-height: none; margin: 4px 0 0;
  }
}
```

### `src/ui/offline.css`

```css
/* ============================================================
   Modal de boas-vindas OFFLINE — "the light did not sleep".
   Modal de entrada (não cerimonial). Classes of-. Monta em
   #modal-host (inset:0 do palco 1920×1080). Ganhos = reward-row.
   ============================================================ */

.of-modal-wrap { position: absolute; inset: 0; z-index: 10; overflow: hidden;
  opacity: 0; transition: opacity .3s ease; font-family: var(--font-ui, 'Inter', sans-serif); }
.of-modal-wrap.show { opacity: 1; }

.of-combat-bg { position: absolute; inset: 0; filter: brightness(.35) saturate(.6);
  background:
    radial-gradient(900px 600px at 20% 75%, rgba(63, 208, 182, .14), transparent 60%),
    radial-gradient(1000px 700px at 85% 20%, rgba(157, 123, 219, .10), transparent 60%),
    #0b0f16; }
.of-veil { position: absolute; inset: 0; background: rgba(4, 6, 12, .7); }

/* partículas suaves de luz acumulada */
.of-p { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: var(--gold, #d9a441);
  box-shadow: 0 0 9px 2px rgba(217, 164, 65, .5); opacity: .7; animation: of-float 5s ease-in-out infinite; }
.of-p.s { width: 3px; height: 3px; opacity: .45; animation-duration: 6.5s; }
@keyframes of-float { 0%, 100% { transform: translateY(0); opacity: .45; } 50% { transform: translateY(-9px); opacity: .8; } }

/* modal */
.of-modal { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 560px;
  border: 1px solid var(--line, rgba(170, 200, 255, .26)); border-radius: 16px; background: rgba(8, 12, 24, .94);
  box-shadow: 0 0 0 1px rgba(170, 200, 255, .14), 0 0 70px -18px rgba(170, 200, 255, .45), 0 30px 90px -30px #000;
  padding: 30px 34px 26px; z-index: 5; outline: 1px solid rgba(170, 200, 255, .12); outline-offset: 6px; }

.of-eyebrow { text-align: center; font-size: 16px; letter-spacing: .38em; text-transform: uppercase; color: var(--dim, #8fa3c8); }
.of-title { font-family: var(--font-display, 'Cormorant Garamond', serif); font-weight: 700; font-size: 38px; text-align: center;
  color: #f2f7ff; margin-top: 4px; text-shadow: 0 0 22px rgba(170, 200, 255, .4); }
.of-away { margin: 6px auto 20px; text-align: center; font-size: 16px; color: var(--dim, #8fa3c8); }
.of-away b { color: var(--gold, #d9a441); font-weight: 600; font-variant-numeric: tabular-nums; }

/* ganhos — reward-row cuida das linhas; aqui só o espaçamento do bloco */
.of-gains { margin-bottom: 16px; }

/* echo teaser (pré-A3) */
.of-echo { display: flex; align-items: center; gap: 14px; border: 1px dashed rgba(170, 200, 255, .22); border-radius: 11px;
  background: rgba(10, 15, 28, .6); padding: 11px 16px; margin-bottom: 20px; opacity: .85; }
.of-echo.unlocked { border-style: solid; border-color: var(--eclat, #aac8ff); opacity: 1; }
.of-echo-ic { width: 38px; height: 38px; border-radius: 9px; flex: none; overflow: hidden;
  border: 1.5px solid var(--line, rgba(170, 200, 255, .26)); background: #10162a; display: grid; place-items: center; position: relative; }
.of-echo-ic img { width: 130%; height: 130%; object-fit: contain; filter: grayscale(.3) brightness(.9); }
.of-echo.unlocked .of-echo-ic img { filter: none; }
.of-echo-meta { flex: 1; }
.of-echo-nm { font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 16px; color: var(--dim, #8fa3c8); }
.of-echo.unlocked .of-echo-nm { color: var(--ink, #dbe6ff); }
.of-echo-sub { font-size: 16px; color: var(--faint, #5a6678); margin-top: 1px; font-style: italic; }
.of-echo-lk { font-size: 16px; color: var(--faint, #5a6678); }
.of-echo.unlocked .of-echo-lk { color: var(--eclat, #aac8ff); }

.of-collect { appearance: none; cursor: pointer; width: 100%; height: 54px; border: 0; border-radius: 12px;
  font-weight: 700; font-size: 16px; letter-spacing: .18em; text-transform: uppercase;
  background: linear-gradient(180deg, #e8c477, var(--gold, #d9a441)); color: #1a1204;
  box-shadow: 0 0 30px -6px rgba(217, 164, 65, .7), inset 0 1px 0 rgba(255, 255, 255, .45); }
.of-collect:hover { filter: brightness(1.07); }
.of-lore { margin-top: 14px; text-align: center; font-family: var(--font-display, 'Cormorant Garamond', serif);
  font-style: italic; font-size: 16px; color: var(--faint, #5a6678); line-height: 1.5; }

/* borda ornamental (assets reais, transbordando o modal) */
.of-orn { position: absolute; pointer-events: none; z-index: 6; }
.of-orn img { display: block; width: 100%; height: auto; filter: drop-shadow(0 0 10px rgba(170, 200, 255, .3)); }
.of-orn.crest { top: -112px; left: 50%; transform: translateX(-50%); width: 270px; }
.of-orn.tl { top: -50px; left: -52px; width: 135px; }
.of-orn.tr { top: -50px; right: -52px; width: 135px; }
.of-orn.bl { bottom: -58px; left: -56px; width: 152px; }
.of-orn.br { bottom: -58px; right: -56px; width: 152px; }
```

### `src/ui/passives.css`

```css
/* ============================================================
   Éclats of Lumière — Tela de Passivas (redesign ÁRVORE-MUNDO)
   1 fundo fixo (a Árvore-Mundo) p/ as 3 abas; os 15 nós de cada aba
   pousam SOBRE os limbos (base=G1 → copa central=G3). Cor por árvore/papel.
   ============================================================ */

.view.passives { display: block; padding: 0; overflow: hidden; }

/* fundo full-bleed = a Árvore-Mundo (cobre o backdrop do mapa) */
.passives .pv-screen { position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: url('eclats/passives/passives_tree.webp') center / cover no-repeat, #070b16; }

/* ---------------- Abas = EMBLEMAS REDONDOS (fruto da árvore) na lateral -------- */
.pv-tabs { position: absolute; left: 3%; top: 50%; transform: translateY(-50%); z-index: 6;
  display: flex; flex-direction: column; gap: 40px; align-items: center; }
.pv-tab { cursor: pointer; appearance: none; background: none; border: 0; padding: 0;
  display: flex; flex-direction: column; align-items: center; gap: 16px; --c: #aac8ff;
  transition: transform .12s ease; }
.pv-tab.t-eclat { --c: var(--eclat); }
.pv-tab.t-vest  { --c: var(--vest); }
.pv-tab.t-frac  { --c: var(--frac); }
.pv-tab:hover { transform: translateY(-2px); }

/* emblema = só o fruto (sem borda/anel); glow na cor só quando ativo */
.pv-emblem { position: relative; width: 92px; height: 92px; display: grid; place-items: center; }
.pv-fruit { width: 100%; height: 100%; object-fit: contain; }

/* nome em serifa dourada com glow (estilo cerimonial, sem box) */
.pv-tab-name { font-family: var(--font-display); font-weight: 700; font-size: var(--fs-xl);
  letter-spacing: .02em; color: #f0dca6;
  text-shadow: 0 1px 4px #000, 0 0 14px rgba(240,220,166,.45); }
.pv-tab-count { font-size: var(--fs-sm); font-weight: 600; color: #c5d3ea;
  font-variant-numeric: tabular-nums; text-shadow: 0 1px 3px #000; }

/* selecionada: o fruto acende (glow na cor); as outras recuam */
.pv-tab.active .pv-fruit { filter: drop-shadow(0 0 18px color-mix(in srgb, var(--c) 75%, transparent)); }
.pv-tab.active .pv-tab-name { color: #fbeec2; }
.pv-tab:not(.active) .pv-emblem { filter: saturate(.8) brightness(.82); }

/* ---------------- Corpo / cor da árvore ---------------- */
.pv-body { position: absolute; inset: 0; z-index: 2; }
.pv-body.t-eclat { --tree-c: var(--eclat); }
.pv-body.t-vest  { --tree-c: var(--vest); }
.pv-body.t-frac  { --tree-c: var(--frac); }

/* bonus indicator (rodapé) — placa refinada na cor da árvore */
.pv-summary { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 3;
  display: flex; align-items: center; gap: 12px; padding: 9px 22px; border-radius: 999px;
  background:
    radial-gradient(120% 180% at 0% 50%, color-mix(in srgb, var(--tree-c) 16%, transparent), transparent 60%),
    rgba(8,12,24,.86);
  backdrop-filter: blur(5px);
  border: 1px solid color-mix(in srgb, var(--tree-c) 38%, transparent);
  box-shadow: 0 8px 26px -10px #000, 0 0 24px -10px var(--tree-c),
    inset 0 1px 0 color-mix(in srgb, var(--tree-c) 16%, transparent); }
.pv-sum-orb { width: 9px; height: 9px; border-radius: 50%; flex: none;
  background: var(--tree-c); box-shadow: 0 0 10px 1px var(--tree-c); }
.pv-sum-l { font-size: var(--fs-sm); color: var(--dim); text-transform: uppercase; letter-spacing: .18em; }
.pv-sum-div { width: 1px; height: 16px; background: color-mix(in srgb, var(--tree-c) 35%, transparent); }
.pv-total { font-family: var(--font-display); font-weight: 700; font-size: var(--fs-xl); line-height: 1;
  color: #fff; font-variant-numeric: tabular-nums;
  text-shadow: 0 0 18px color-mix(in srgb, var(--tree-c) 60%, transparent); }
.pv-sum-stat { font-size: var(--fs-sm); font-weight: 600; color: var(--tree-c);
  text-transform: uppercase; letter-spacing: .1em; }

/* ---------------- A árvore (área dos nós) ---------------- */
.pv-tree { position: absolute; inset: 0; }

/* ---------------- NÓ (posicionado por left%/top%) ---------------- */
.pv-node { position: absolute; transform: translate(-50%, -50%); appearance: none; cursor: pointer;
  background: none; border: 0; display: flex; flex-direction: column; align-items: center; gap: 4px;
  color: var(--ink); --c: var(--tree-c); }
.pv-node.role-engine { --c: #f0e3b0; }   /* motores = coroa branca-quente */
.pv-node.role-lever  { --c: #66d9f2; }   /* alavancas = ciano */

.pv-disc { position: relative; width: 58px; height: 58px; border-radius: 50%;
  background: radial-gradient(circle at 50% 38%,
    color-mix(in srgb, var(--c) 26%, #0a1024), color-mix(in srgb, var(--c) 9%, #0a1024));
  border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
  display: grid; place-items: center; transition: box-shadow .15s ease, transform .1s ease;
  box-shadow: 0 4px 14px -4px #000a; }
.pv-node.role-engine .pv-disc { width: 66px; height: 66px; }
.pv-ring { position: absolute; inset: -4px; border-radius: 50%;
  background: conic-gradient(var(--c) calc(var(--p, 0) * 360deg), rgba(170,200,255,.14) 0);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px)); }
.pv-icon { width: 58%; height: 58%; background: var(--c);
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  -webkit-mask-position: center; mask-position: center;
  -webkit-mask-size: contain; mask-size: contain;
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--c) 50%, transparent)); }

.pv-node-name { font-family: var(--font-display); font-size: 16px; line-height: 1.05; text-align: center;
  color: #e7eefb; max-width: 120px; text-shadow: 0 1px 4px #000, 0 0 8px #000; }
.pv-node-lvl { font-size: 16px; color: #c5d3ea; font-variant-numeric: tabular-nums; min-height: 13px;
  text-shadow: 0 1px 3px #000; }

/* estados */
.pv-node.locked .pv-disc { filter: grayscale(.85) brightness(.65); }
.pv-node.locked .pv-icon { background: #4a5570; filter: none; }
.pv-node.locked .pv-node-name { color: #8a97ad; }
.pv-node.owned .pv-disc { box-shadow: 0 0 16px -3px color-mix(in srgb, var(--c) 65%, transparent); }
.pv-node.buyable .pv-disc { box-shadow: 0 0 0 2px var(--c), 0 0 22px -3px var(--c); }
.pv-node.maxed .pv-disc { box-shadow: 0 0 0 2px var(--c), 0 0 28px -2px var(--c); }
.pv-node.maxed .pv-node-lvl { color: var(--c); font-weight: 700; }
.pv-node:not(.locked):hover .pv-disc { transform: translateY(-2px); }
/* nó em hover sobe acima dos vizinhos pro tooltip não ser coberto */
.pv-node:hover { z-index: 50; }

/* ---------------- CARTÃO (tooltip estilo refs) ---------------- */
.pv-tip { display: none; position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%);
  z-index: 30; width: 308px; text-align: left; pointer-events: none; overflow: hidden;
  background:
    radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--c) 13%, transparent), transparent 55%),
    linear-gradient(180deg, rgba(10,14,28,.98), rgba(6,9,18,.98));
  border: 1px solid color-mix(in srgb, var(--c) 42%, var(--line)); border-radius: 13px;
  padding: 13px 15px 12px; box-shadow: 0 18px 40px -12px #000, 0 0 26px -12px var(--c); }
/* fio de luz no topo na cor da árvore */
.pv-tip::before { content: ""; position: absolute; top: 0; left: 14px; right: 14px; height: 2px;
  background: linear-gradient(90deg, transparent, var(--c), transparent); opacity: .8; }
.pv-node:hover .pv-tip { display: block; }
.pv-node.tip-below .pv-tip { bottom: auto; top: calc(100% + 10px); }
.pv-tip-head { display: flex; align-items: center; gap: 11px; margin-bottom: 10px; }
.pv-tip-icon { width: 44px; height: 44px; flex: none; border-radius: 10px;
  background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--c) 28%, #0a1024), #0a1024);
  border: 1px solid color-mix(in srgb, var(--c) 45%, transparent); display: grid; place-items: center;
  box-shadow: inset 0 0 14px -6px var(--c); }
.pv-tip-icon .pv-icon { width: 62%; height: 62%; }
.pv-tip-htext { min-width: 0; }
.pv-tip-name { font-family: var(--font-display); font-weight: 700; font-size: 21px; color: #f3f7ff;
  display: flex; align-items: center; gap: 8px; }
.pv-tip-tag { font-size: 16px; font-weight: 700; color: #8be0a0; letter-spacing: .12em; text-transform: uppercase;
  padding: 2px 9px; border-radius: 999px; background: rgba(127,208,138,.14);
  border: 1px solid rgba(127,208,138,.4); }
.pv-tip-lvl { font-size: 16px; color: var(--dim); font-variant-numeric: tabular-nums; letter-spacing: .06em;
  text-transform: uppercase; margin-top: 3px; }
.pv-tip-eff { margin: 0 0 12px; font-size: 16px; line-height: 1.5; color: #d3deef; }
.pv-tip-foot { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: .02em;
  padding-top: 10px; border-top: 1px solid color-mix(in srgb, var(--c) 16%, rgba(255,255,255,.06)); }
.pv-tip-foot.cost { color: #f0d9a0; }
.pv-tip-foot.max { color: var(--c); }
.pv-tip-foot.locked { color: var(--faint); }

/* ---------------- Sistema bloqueado (pré-Convergence) ---------------- */
.pv-lock { position: absolute; inset: 0; z-index: 10; display: grid; place-content: center;
  text-align: center; padding: 60px; background: rgba(6,9,18,.6); }
.pv-lock[hidden] { display: none; }
.pv-lock .glyph { font-size: 96px; color: var(--eclat); filter: drop-shadow(var(--glow-eclat)); margin-bottom: 12px; }
.pv-lock h2 { margin: 0 0 8px; font-family: var(--font-display); font-weight: 700; font-size: var(--fs-xxl); color: var(--ink); }
.pv-lock p { max-width: 520px; margin: 0 auto; color: var(--dim); font-size: var(--fs-lg);
  font-family: var(--font-display); font-style: italic; line-height: 1.4; }
.pv-lock b { color: var(--eclat); font-style: normal; }
```

### `src/ui/player.css`

```css
/* ============================================================
   Éclats of Lumière — Tela do Player / Seeker (U-4) — FICHA
   Esquerda: retrato (identidade) + Level + parede de Convergence.
   Direita: build summary · All Stats (clicáveis → breakdown modal) ·
   Gold Stats (interativo) · Convergence.
   ============================================================ */

/* mantém position:absolute; inset:0 da base .view (não sobrescrever, senão a
   view colapsa pra altura 0 e os panes absolutos somem) */
.view.player { display: block; padding: 0; overflow: hidden; }

/* Panes das abas (Codex | Awakening) ocupam o palco inteiro */
.view.player .pl-pane { position: absolute; inset: 0; }
.view.player .pl-pane[hidden] { display: none; }

/* Codex = cena full-bleed (igual Gear/Forge): card central + painel à esquerda
   flutuando sobre o fundo do santuário da Ordre. */
.view.player .pl-codex-pane { display: block; overflow: hidden; }

/* fundo do santuário (cobre o backdrop do mapa) */
.view.player .pl-screen {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background: url('eclats/codex/codex_screen.webp') center / cover no-repeat, #0b1226;
}

/* ---------------- Coluna do herói (identidade) ----------------
   Modelo dos cards de combate: a arte do Seeker PREENCHE a moldura do tier
   (que evolui com a progressão); o texto fica sobreposto na base, sobre um
   gradiente escuro, legível. Card esticado até o fim da tela. */
/* hero = CARD no centro do palco, sobre o emblema do fundo */
.pl-hero { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 2; height: 84%; aspect-ratio: 966 / 1488; }

/* CAMADA 0 — o CARD inteiro (moldura + avatar fundidos) preenche o hero.
   A moldura agora é parte da imagem; nada de frame solto por cima. */
.pl-hero-art { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
.pl-portrait-img, .pl-portrait-img img { width: 100%; height: 100%;
  object-fit: cover; object-position: center; display: block; }
/* scrim sutil só no rodapé do card pra legibilidade do nome/level */
.pl-hero-art::after { content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, transparent 60%, rgba(5,8,18,.5) 86%); }

/* CAMADA 1 — texto enxuto no terço inferior reservado do card */
.pl-hero-inner { position: absolute; inset: 0; z-index: 2;
  display: flex; flex-direction: column; justify-content: flex-end;
  padding: 0 10% 6%; text-align: center; }
.pl-name { margin: 0; font-family: var(--font-display); font-weight: 700;
  font-size: 36px; line-height: 1.04; letter-spacing: .03em; color: #fff;
  text-shadow: 0 2px 4px #000, 0 2px 16px #000; }
.pl-tier { font-size: 16px; color: #c5d3ea; font-weight: 600;
  text-transform: uppercase; letter-spacing: .16em; margin-top: 4px;
  text-shadow: 0 1px 3px #000; }
.pl-hero-vitals { margin-top: 10px; }
.pl-vital { display: flex; flex-direction: column; gap: 2px; }
.pl-vital-lbl { font-size: 16px; color: #c5d3ea;
  text-transform: uppercase; letter-spacing: .2em; text-shadow: 0 1px 3px #000; }
.pl-vital-val { font-family: var(--font-display); font-size: 40px;
  font-weight: 700; color: #fff; font-variant-numeric: tabular-nums; line-height: 1;
  text-shadow: 0 2px 8px #000; }

/* ---------------- A ficha (direita) — painel central ÚNICO ----------------
   Todos os stats numa lista em sequência, num só painel (alvo da moldura +
   imagem da Ordre de fundo no futuro). Centralizado na área. */
/* painel da ficha — flutua à ESQUERDA sobre o fundo do santuário (abaixo da
   navbar). O painel NÃO rola; só a lista de stats rola por dentro (título/motto
   ficam fixos) — assim o topo nunca corta. */
.pl-sheet { position: absolute; left: 3%; top: 13%; bottom: 6%; width: 560px; z-index: 3;
  display: flex; }
/* painel da ficha — leitura CALMA e serena: vidro navy frio, borda fina
   azul-gelo, respiro generoso e um leve banho de luz no topo. */
.pl-codex-panel { position: relative; width: 100%; max-width: none;
  display: flex; flex-direction: column; max-height: 100%; overflow: hidden;
  background:
    radial-gradient(120% 60% at 50% -8%, rgba(170,200,255,.10), transparent 60%),
    color-mix(in srgb, var(--panel) 92%, transparent);
  border: 1px solid rgba(170,200,255,.22); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-panel), inset 0 1px 0 rgba(170,200,255,.08);
  padding: 34px 34px 22px; }

/* só a lista de stats rola; título + motto ficam fixos no topo do painel */
.pl-stats-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding-right: 10px;
  scrollbar-width: thin; scrollbar-color: rgba(170,200,255,.45) transparent; }
.pl-stats-list::-webkit-scrollbar { width: 6px; }
.pl-stats-list::-webkit-scrollbar-track { background: transparent; }
.pl-stats-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(170,200,255,.55), rgba(120,150,220,.35));
  border-radius: 99px; }
.pl-stats-list::-webkit-scrollbar-thumb:hover { background: rgba(170,200,255,.75); }

.pl-codex-title { margin: 0; font-family: var(--font-display); font-weight: 700;
  font-size: 40px; color: var(--ink); letter-spacing: .02em; text-align: center; }
.pl-codex-motto { margin: 8px auto 22px; max-width: 92%; text-align: center; font-family: var(--font-display);
  font-style: italic; font-size: 23px; color: #c6d3e8; line-height: 1.45; }
.pl-sub { font-family: var(--font-ui); font-size: 16px;
  color: var(--faint); text-transform: none; letter-spacing: .04em; }

/* seções da lista única, separadas por divisória */
.pl-section + .pl-section { margin-top: 22px; padding-top: 20px;
  border-top: 1px solid color-mix(in srgb, var(--eclat) 14%, transparent); }
.pl-sec-h { margin: 0 0 13px; font-size: 16px; color: var(--eclat); font-weight: 700;
  text-transform: uppercase; letter-spacing: .16em; }
.pl-stat {
  appearance: none; cursor: pointer; width: 100%; text-align: left;
  display: flex; justify-content: space-between; align-items: baseline; gap: 10px;
  padding: 12px 14px; margin-bottom: 7px; border-radius: var(--radius-sm);
  background: var(--panel-2); border: var(--border-soft); color: var(--ink);
  transition: border-color .14s ease, background .14s ease;
}
.pl-stat::after { content: 'ⓘ'; position: absolute; opacity: 0; }
.pl-stat:hover { border-color: var(--eclat); background: color-mix(in srgb, var(--eclat) 10%, var(--panel-2)); }
.pl-stat-l { font-size: 16px; color: var(--dim); }
.pl-stat-v { font-size: 19px; font-weight: 700; color: var(--ink);
  font-variant-numeric: tabular-nums; }

/* Convergence */
.pl-mini { display: grid; gap: 9px; margin: 0; }
.pl-mini > div { display: flex; justify-content: space-between; align-items: baseline;
  background: var(--panel-2); border: var(--border-soft); border-radius: var(--radius-sm);
  padding: 9px 12px; }
.pl-mini dt { font-size: var(--fs-xs); color: var(--dim);
  text-transform: uppercase; letter-spacing: .1em; }
.pl-mini dd { margin: 0; font-size: var(--fs-md); font-weight: 700;
  color: var(--ink); font-variant-numeric: tabular-nums; }
.pl-converge {
  display: block; width: 100%; margin-top: 14px; padding: 13px; cursor: pointer;
  border: var(--border); border-radius: 12px; font-weight: 700; font-size: var(--fs-md);
  background: var(--panel-2); color: var(--faint); transition: all .16s ease;
}
.pl-converge.ready { background: var(--eclat); color: #06101f; border-color: var(--eclat);
  box-shadow: var(--glow-eclat); }
.pl-converge:disabled { cursor: not-allowed; }

/* ---------------- breakdown (modal) ---------------- */
.pl-modal { position: absolute; inset: 0; z-index: 30; display: grid; place-items: center; }
.pl-modal[hidden] { display: none; }
.pl-modal-back { position: absolute; inset: 0; background: rgba(5,7,15,.72); backdrop-filter: blur(3px); }
.pl-modal-card {
  position: relative; width: min(460px, 86%); max-height: 80%;
  background: var(--panel); border: var(--border); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-panel); padding: 22px 24px; overflow-y: auto;
}
.pl-modal-x {
  position: absolute; top: 14px; right: 14px; width: 32px; height: 32px;
  appearance: none; cursor: pointer; border: var(--border-soft); border-radius: 8px;
  background: var(--panel-2); color: var(--dim); font-size: 18px; line-height: 1;
}
.pl-modal-x:hover { border-color: var(--eclat); color: var(--ink); }
/* título + total empilhados; padding-right abre espaço pro botão × (sem sobrepor) */
.pl-modal-head { display: flex; flex-direction: column; align-items: flex-start;
  gap: 6px; padding: 0 44px 14px 0; margin-bottom: 10px; border-bottom: var(--border); }
.pl-modal-head h3 { margin: 0; font-family: var(--font-display); font-weight: 700;
  font-size: var(--fs-xl); color: var(--ink); line-height: 1.05; }
.pl-modal-total { font-family: var(--font-display); font-size: var(--fs-xxl); font-weight: 700;
  color: var(--gold); font-variant-numeric: tabular-nums; line-height: 1; }
.pl-modal-rows { display: grid; gap: 2px; }
.pl-mrow { display: flex; justify-content: space-between; align-items: baseline;
  padding: 9px 4px; border-bottom: var(--border-soft); }
.pl-mrow span { font-size: var(--fs-sm); color: var(--dim); }
.pl-mrow b { font-size: var(--fs-md); font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ink); }
.pl-mrow.base span { color: var(--faint); }
.pl-mrow.base b { color: var(--dim); }
.pl-mrow.active b { color: var(--gold); }
.pl-mrow.idle { opacity: .5; }
.pl-mrow.locked { opacity: .45; }
.pl-mrow.locked b { color: var(--faint); }
.pl-lock { font-size: 16px; font-style: normal; }
.pl-modal-note { margin: 14px 0 0; font-size: var(--fs-sm); color: var(--dim);
  font-style: italic; line-height: 1.45; }

/* ───── Aba Convergence (CP-3b, redesign organizado) ───── */
.pl-conv-pane { display: grid; place-items: center; padding: 28px; overflow-y: auto; }
.pl-conv-card { width: min(600px, 94%); background: var(--panel); border: var(--border);
  border-radius: 18px; padding: 28px 30px; box-shadow: 0 18px 50px -20px #000; }

/* header */
.pl-conv-head { text-align: center; }
.pl-conv-eyebrow { font-size: 15px; letter-spacing: .3em; text-transform: uppercase; color: var(--eclat); }
.pl-conv-title { font-family: var(--font-display); font-weight: 700; font-size: 38px; color: #eef4ff; margin: 4px 0 8px; }
.pl-conv-lore { font-family: var(--font-display); font-style: italic; font-size: 16px; color: var(--dim);
  line-height: 1.5; margin: 0 auto; max-width: 44ch; }

/* dois cards de status */
.pl-conv-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 22px 0 18px; }
.pl-conv-stat { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 16px;
  background: var(--panel-2); border: var(--border-soft); border-radius: 14px; }
.pl-conv-v { font-family: var(--font-display); font-size: 32px; line-height: 1; color: var(--ink); font-variant-numeric: tabular-nums; }
.pl-conv-v.t-gold { color: var(--gold); }
.pl-conv-l { font-size: 15px; letter-spacing: .1em; text-transform: uppercase; color: var(--faint); }

/* painel de ação (progresso + botão) = o foco */
.pl-conv-action { background: var(--panel-2); border: var(--border-soft); border-radius: 14px; padding: 18px 20px; margin-bottom: 18px; }
.pl-conv-action-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 9px; }
.pl-conv-action-l { font-size: 15px; letter-spacing: .1em; text-transform: uppercase; color: var(--faint); }
.pl-conv-action-v { font-size: 16px; color: var(--dim); font-variant-numeric: tabular-nums; }
.pl-conv-action-v b { color: var(--ink); }
.pl-conv-bar { height: 12px; border-radius: 7px; background: rgba(0,0,0,.35); border: var(--border-soft); overflow: hidden; }
.pl-conv-bar i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, var(--eclat), #c4d8ff);
  transition: width .2s ease; box-shadow: 0 0 12px var(--eclat); }
.pl-conv-btn { display: block; width: 100%; margin-top: 16px; appearance: none; cursor: pointer; height: 52px;
  border: 0; border-radius: 12px; font-weight: 700; font-size: 16px; letter-spacing: .14em; text-transform: uppercase;
  background: linear-gradient(180deg, #c4d8ff, var(--eclat)); color: #06101f;
  box-shadow: 0 0 30px -8px rgba(170,200,255,.6); transition: filter .14s ease, transform .1s ease; }
.pl-conv-btn:hover:not(:disabled) { filter: brightness(1.07); transform: translateY(-1px); }
.pl-conv-btn:disabled { background: var(--panel); color: var(--faint); border: var(--border-soft); box-shadow: none; cursor: not-allowed; }

/* linha de efeito (o que o +15% faz) */
.pl-conv-effect { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap;
  padding: 12px 0; border-top: var(--border-soft); border-bottom: var(--border-soft); margin-bottom: 18px; }
.pl-conv-effect-l { font-size: 15px; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); }
.pl-conv-effect-v { font-family: var(--font-display); font-size: 22px; color: var(--gold); }
.pl-conv-effect-tags { font-size: 16px; font-weight: 600; color: var(--eclat); }

/* colunas Returns / Keeps */
.pl-conv-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.pl-conv-col h4 { font-size: 14px; letter-spacing: .14em; text-transform: uppercase; margin: 0 0 8px; }
.pl-conv-col.returns h4 { color: var(--gold); }
.pl-conv-col.keeps h4 { color: var(--eclat); }
.pl-conv-col ul { margin: 0; padding: 0; list-style: none; }
.pl-conv-col li { font-size: 16px; color: var(--dim); padding: 3px 0 3px 16px; position: relative; }
.pl-conv-col li::before { content: ""; position: absolute; left: 0; top: 11px; width: 5px; height: 5px; border-radius: 50%; }
.pl-conv-col.returns li::before { background: var(--gold); }
.pl-conv-col.keeps li::before { background: var(--eclat); }
.pl-conv-col li em { font-style: normal; color: var(--faint); }
```

### `src/ui/shell.css`

```css
/* ============================================================
   Éclats of Lumière — Shell / casca compartilhada (CP-1 → revisto no CP-2)
   Chrome portado do mockup de combate: nav (topo-esq) + moedas (topo-dir),
   stage 1920×1080 full-bleed com fit(). Cada tela pinta seu próprio conteúdo.
   ============================================================ */

* { box-sizing: border-box; }

/* ---- barra de rolagem temática (navy + dourado), global ---- */
* { scrollbar-width: thin; scrollbar-color: rgba(217,164,65,.55) transparent; }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: rgba(8,12,24,.5); border-radius: 8px; }
::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(217,164,65,.75), rgba(168,120,40,.7));
  border-radius: 8px; border: 2px solid rgba(8,12,24,.6); background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #e7c47a, #c79a44); background-clip: padding-box; }
::-webkit-scrollbar-corner { background: transparent; }
/* controles herdam a fonte (sem o default ~13.33px do <button> do navegador) */
button, input, select, textarea { font-family: inherit; font-size: inherit; }
html, body { height: 100%; margin: 0; }
body {
  background: #05070f;
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: var(--fs-md);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* viewport: contém o stage + letterbox */
#screen {
  position: fixed; inset: 0;
  background:
    radial-gradient(1400px 900px at 50% -20%, #16223a44, transparent 60%),
    #05070f;
  overflow: hidden;
}

/* palco de referência — posicionado e escalado por fit() via translate+scale
   (origem no canto: centralizar via grid falha em alguns navegadores móveis
   quando o palco 1920×1080 é maior que a viewport). */
#stage {
  position: absolute; top: 0; left: 0;
  width: var(--stage-w); height: var(--stage-h);
  transform-origin: top left;
  background: var(--bg-stage);
  overflow: hidden;
  box-shadow: 0 0 0 1px var(--line-soft), 0 30px 90px -30px #000;
}

/* fundo do mapa atual, desfocado — usado pelas telas de MENU
   (a tela de combate pinta seu próprio fundo nítido por cima) */
#stage-backdrop {
  position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background-size: cover; background-position: center;
  filter: blur(13px) brightness(.5) saturate(.95);
  transform: scale(1.06);
  transition: opacity .45s ease;
  will-change: background-image;
}
#stage-backdrop::after {
  content: ""; position: absolute; inset: 0;
  background: rgba(5,7,15,.4);
}

/* ---------------- TOP BAR (flutua sobre tudo) ---------------- */
.topbar {
  position: absolute; top: 0; left: 0; right: 0; height: 84px; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px; pointer-events: none;
}
.topbar > * { pointer-events: auto; }

.nav { display: flex; gap: 9px; }
.navbtn {
  appearance: none; cursor: pointer; position: relative;
  width: 62px; height: 62px; padding: 11px;
  border: 1px solid var(--line); border-radius: 11px;
  background: var(--panel); backdrop-filter: blur(6px);
  display: grid; place-items: center;
  color: var(--dim); transition: border-color .16s ease, background .16s ease, transform .12s ease;
}
/* .ico absoluto: dá um box de tamanho DEFINITIVO pros 100% da picture/img
   (height:100% em filho de grid entra em loop com a linha e o ícone estoura) */
.navbtn .ico { position: absolute; inset: 11px; display: grid; place-items: center; }
.navbtn .ico picture { position: absolute; inset: 0; }
.navbtn .ico img { display: block; width: 100%; height: 100%; object-fit: contain;
  opacity: .6; transition: opacity .16s ease, filter .16s ease; }
.navbtn .lbl { display: none; }                 /* tooltip nativo via title */
.navbtn:hover { border-color: var(--eclat); background: var(--panel-2); transform: translateY(-1px); }
.navbtn:hover .ico img { opacity: .92; }
.navbtn.active { border-color: var(--eclat); }
.navbtn.active .ico img { opacity: 1; filter: drop-shadow(var(--glow-eclat)); }
.navbtn.active::after {
  content: ""; position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%);
  width: 26px; height: 3px; border-radius: 3px; background: var(--eclat); box-shadow: var(--glow-eclat);
}
.navbtn.provisional .ico { font-size: 22px; color: var(--dim); border: 1px dashed var(--line-soft); border-radius: 8px; }

/* ---------------- HUD de moedas (.chud) — topo-direita ----------------
   Mesmo vocabulário visual da navbar: var(--panel) + var(--line) + radius 11
   + blur(6px). 3 pills agrupadas: ícone (glow na cor da moeda) + valor. */
.chud { display: flex; align-items: center; gap: 9px; }
.chud-pill {
  display: flex; align-items: center; gap: 8px;
  height: 52px; padding: 0 16px 0 12px;
  border: 1px solid var(--line); border-radius: 11px;
  background: var(--panel); backdrop-filter: blur(6px);
}
.chud-ico { width: 30px; height: 30px; object-fit: contain; display: block; }
.chud-lumens   .chud-ico { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--gold)  75%, transparent)); }
.chud-vestiges .chud-ico { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--frac)  75%, transparent)); }
.chud-eclats   .chud-ico { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--eclat) 75%, transparent)); }
.chud-v {
  font-size: 16px; font-weight: 700; letter-spacing: .02em;
  font-variant-numeric: tabular-nums; line-height: 1;
}
.chud-lumens   .chud-v { color: var(--gold); }
.chud-vestiges .chud-v { color: var(--frac); }
.chud-eclats   .chud-v { color: var(--eclat); }
/* janelas estreitas: pills mais compactas pra caberem lado a lado */
@media (max-width: 760px) {
  .chud { gap: 6px; }
  .chud-pill { height: 40px; padding: 0 10px 0 8px; gap: 6px; }
  .chud-ico { width: 18px; height: 18px; }
  .chud-v { font-size: 16px; }
}

/* ---------------- MAIN (views) ---------------- */
.stage-main { position: absolute; inset: 0; z-index: 5; }
.view {
  position: absolute; inset: 0;
  opacity: 0; visibility: hidden; pointer-events: none;
  transition: opacity .26s ease;
}
.view.active { opacity: 1; visibility: visible; pointer-events: auto; }

/* placeholder das telas ainda não construídas */
.view.placeholder { display: grid; place-items: center; text-align: center; padding: 80px; }
.view.placeholder .glyph { width: 120px; height: 120px; margin: 0 auto 18px; opacity: .5;
  filter: drop-shadow(var(--glow-eclat)); }
.view.placeholder .glyph img, .view.placeholder .glyph picture { width: 100%; height: 100%; object-fit: contain; }
.view.placeholder h2 { font-family: var(--font-display); font-weight: 700; font-size: var(--fs-xxl);
  margin: 0 0 6px; letter-spacing: .03em; }
.view.placeholder .cp { font-size: var(--fs-sm); color: var(--faint);
  text-transform: uppercase; letter-spacing: .22em; }
.view.placeholder .lore { margin-top: 14px; max-width: 520px; color: var(--dim);
  font-family: var(--font-display); font-style: italic; font-size: var(--fs-lg); line-height: 1.4; }

/* host dos overlays cerimoniais (Awakening, Convergence) — sobre views + topbar.
   Não captura cliques; cada overlay reativa pointer-events na própria raiz. */
#overlay-host { position: absolute; inset: 0; z-index: 50; pointer-events: none; }
#overlay-host > * { pointer-events: auto; }

/* host de modais de entrada não-cerimoniais (ex.: boas-vindas offline),
   acima dos overlays cerimoniais. */
#modal-host { position: absolute; inset: 0; z-index: 60; pointer-events: none; }
#modal-host > * { pointer-events: auto; }

/* telas muito pequenas */
#toosmall { position: fixed; inset: 0; display: none; place-items: center; text-align: center;
  background: #05070f; color: var(--dim); padding: 24px; z-index: 100;
  font-family: var(--font-display); font-size: 20px; }

/* ---- nav bloqueada (telas pós-MVP) ---- */
.navbtn.locked { opacity: .38; cursor: not-allowed; }
.navbtn.locked:hover { border-color: var(--line); background: var(--panel); transform: none; }
.navbtn.locked:hover .ico img { opacity: .6; }

/* ---- toast de progresso offline ---- */
#offline-toast {
  position: fixed; top: 18px; left: 50%; transform: translateX(-50%);
  max-width: 620px; z-index: 200; display: none;
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 12px;
  box-shadow: var(--shadow-panel); padding: 14px 18px; color: var(--ink);
  font-size: 16px; line-height: 1.5;
}
#offline-toast b { font-family: var(--font-display); font-size: 18px; color: var(--eclat); }
#offline-toast button {
  display: block; margin: 10px auto 0; padding: 6px 22px; cursor: pointer;
  background: var(--eclat); color: #06101f; border: 0; border-radius: 8px; font-weight: 600;
}
```

### `src/ui/tokens.css`

```css
/* ============================================================
   Éclats of Lumière — Design tokens (CP-1)
   Fonte: paleta do plano de implementação + cânon de cores da Lore Bible
   (dourado = luz presa/fragmentada · branco-azul = convergência).
   Sem seletores além de :root — só variáveis.
   ============================================================ */
:root {
  /* — superfícies / neutros — */
  --bg:        #080b11;   /* fundo do letterbox (fora do stage) */
  --bg-stage:  #0b0f16;   /* fundo base do stage */
  --panel:     #141a25;   /* cartões / painéis */
  --panel-2:   #1b2230;   /* painel elevado / hover */
  --line:      #283344;   /* bordas / divisores */
  --line-soft: #1d2533;   /* divisores sutis */
  --ink:       #e8eef7;   /* texto principal */
  --dim:       #8a98ac;   /* texto secundário */
  --faint:     #5a6678;   /* texto terciário / placeholder */

  /* — identidade da luz (cânon) — */
  --eclat: #aac8ff;   /* branco-azul frio: Éclats / Convergence */
  --vest:  #3fd0b6;   /* teal: Vestiges (essência dos corrompidos) */
  --frac:  #9d7bdb;   /* violeta: Fracture / o vazio */
  --gold:  #d9a441;   /* dourado quente: luz presa, fragmentada, corrompida */

  /* — raridades de gear: Faded → Converged — */
  --r-faded:     #6b7280;
  --r-kindled:   #c96a2a;
  --r-luminous:  #d9a441;
  --r-radiant:   #f0d9a0;
  --r-converged: #aac8ff;

  /* — tipografia — */
  --font-display: 'Cormorant Garamond', 'Georgia', serif;  /* títulos / nomes / lore */
  --font-ui:      'Inter', system-ui, -apple-system, sans-serif; /* números / UI */
  --fs-xxl: 46px; --fs-xl: 34px; --fs-lg: 24px; --fs-md: 18px;
  --fs-sm: 16px;  --fs-xs: 16px;
  --tracking: .02em;

  /* — forma dos cards / padrões — */
  --radius:    14px;
  --radius-sm: 9px;
  --radius-lg: 20px;
  --border:      1px solid var(--line);
  --border-soft: 1px solid var(--line-soft);

  /* glows padrão (usam color-mix p/ derivar da cor de cada contexto) */
  --glow-eclat: 0 0 26px -8px color-mix(in srgb, var(--eclat) 70%, transparent);
  --glow-vest:  0 0 26px -8px color-mix(in srgb, var(--vest)  70%, transparent);
  --glow-frac:  0 0 26px -8px color-mix(in srgb, var(--frac)  70%, transparent);
  --glow-gold:  0 0 26px -8px color-mix(in srgb, var(--gold)  70%, transparent);

  /* sombra padrão dos painéis */
  --shadow-panel: 0 8px 28px -14px #000c, 0 2px 6px -4px #000a;
  --shadow-card:  0 4px 18px -10px #000c;

  /* espaçamento base */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px;

  /* dimensões do stage de referência (desktop 1920×1080) */
  --stage-w: 1920px;
  --stage-h: 1080px;
}

/* utilitários de cor de texto por raridade / identidade (cross-view) */
.t-eclat { color: var(--eclat); }
.t-vest  { color: var(--vest);  }
.t-frac  { color: var(--frac);  }
.t-gold  { color: var(--gold);  }
.r-faded     { color: var(--r-faded); }
.r-kindled   { color: var(--r-kindled); }
.r-luminous  { color: var(--r-luminous); }
.r-radiant   { color: var(--r-radiant); }
.r-converged { color: var(--r-converged); }

/* ===== Kit de UI — Frame de painel (azul-gelo, 9-slice border-image) =====
   Moldura ornamental cristalina reutilizável em qualquer painel. Cantos fixos,
   bordas esticam. O fundo/conteúdo do painel fica dentro (centro transparente). */
.ui-panel {
  border: 46px solid transparent;
  border-image: url('eclats/ui/panel_frame.webp') 350 / 46px / 0 stretch;
}
```

## Entrada — src/main.js

### `src/main.js`

```javascript
// Bootstrap do Éclats of Lumière — liga núcleo, combate e UI.

import '../style.css';
import { state } from './core/state.js';
import { load, save, setupAutosave, resetSave } from './core/save.js';
import { startLoop } from './core/loop.js';
import { combatTick, resetPack } from './game/combat.js';
import { automationTick } from './game/fatekeepers.js';
import { playerHpMax } from './game/stats.js';
import { simulateOffline } from './game/offline.js';
import { maybeApplyDevUnlock, showDevBadge, setupDevButton, setupDevPanel, setupResetButton } from './core/dev.js';
import { setupUI, renderUI, showOfflineSummary } from './ui/ui.js';
import { openOffline, closeOffline } from './ui/offline.js';

// Carrega o save (se houver) e reconstrói o runtime
const snapshot = load();
const devMode = maybeApplyDevUnlock(state); // modo de teste via ?dev (sem efeito sem o param)
state.player.hp = playerHpMax(state);
resetPack(state);

setupUI(state);
// Modo de teste: por URL (?dev) já vem ativo; senão, botão "DEV 🔓" para ativar
if (devMode) { showDevBadge(); setupDevPanel(state, () => { save(); renderUI(state); }); }
else setupDevButton(state, () => { save(); renderUI(state); }); // salva + refresca na hora
setupResetButton(resetSave); // botão RESET (apaga o save e recomeça)

// Progresso offline (§15): simula o tempo ausente antes do loop começar
if (snapshot?.savedAt) {
  const away = (Date.now() - snapshot.savedAt) / 1000;
  const summary = simulateOffline(state, away);
  if (summary) showOfflineSummary(summary);
}

setupAutosave();

// Tick de simulação (100ms fixo) + render por tick
startLoop((dt) => {
  combatTick(state, dt);
  automationTick(state, dt); // §8 Fate Keepers: auto-stats/converge/progress + Eco do Seeker (A3)
  renderUI(state);
});

renderUI(state);

// Cerimônias (overlays) — expostas para teste manual no console enquanto a
// lógica de disparo não existe. Ex.: eclatsCeremonies.awaken({ tier: 3 }).
// TODO(lógica): disparar Awakening ao vencer o Guardião da Sub 3 (checkDespertar)
// e Convergence no ciclo de dispersão; passar dados reais (ganhos calculados).
// Convergence agora é uma TELA (aba do Seeker), não um overlay — sem hooks de cerimônia.

// Modal de entrada offline — exposto para teste manual. Ex.: eclatsOffline.open().
// TODO(lógica): disparar na inicialização com os ganhos offline reais (o
// showOfflineSummary atual permanece; a troca pelo modal é decisão futura).
window.eclatsOffline = { open: openOffline, close: closeOffline };
```

## Simuladores — tools/sim

### `tools/sim/.gitignore`

```
node_modules
```

### `tools/sim/budget.mjs`

```javascript
// FRAMEWORK do orçamento de poder (redesign 2026-06-14).
// Quantas décadas o dano cresce no Jogo base (Normal) e como distribuí-las entre os
// sistemas NOVOS. O alvo do Normal é ~1e45 (dificuldades estendem até ~1e308 por cima).
// Os números do split são o NORTE; o lock-in por sistema acontece nos CPs 5-10 + CP-12.
// Uso: node tools/sim/budget.mjs

import { COMBAT, MAPS } from '../../src/data/constants.js';
import { hpForLevel, subareaLevelRange } from '../../src/game/enemies.js';

// Mob mais fundo do Normal = sub-área mais funda do Map 5 (boss = ×bossHpMult).
const m5 = MAPS[4];
const deepLevel = Math.round(subareaLevelRange(m5, m5.subareaCount).hi);
const deepHp = hpForLevel(m5, deepLevel) * COMBAT.bossHpMult;
const decadesNeeded = Math.log10(deepHp / COMBAT.baseDmg);

console.log(`Boss final do Normal (M5) HP ≈ ${deepHp.toExponential(2)}`);
console.log(`baseDmg = ${COMBAT.baseDmg}`);
console.log(`→ DÉCADAS de dano no Jogo base (Normal) ≈ ${decadesNeeded.toFixed(1)}\n`);
console.log('Dificuldades (endgame) multiplicam por cima: ~1e70 → ~1e190 → ~1e280 (float ~1e308).');
console.log('break_infinity só acima de 1e308.\n');

// ── SPLIT proposto (norte) — soma ≈ décadas do Normal ──
const budget = [
  ['Mémoires (Artifacts ×todo dano)', 18, 'engrenagem profunda do late (Éclats)'],
  ['Gear (flat + % + níveis altos + raridade)', 13, 'agora pesa muito (milhões de níveis)'],
  ['Passivas (alavancas)',             4, 'crit/APS/dano-em-boss + motores do grupo 3'],
  ['Ascension (multiplica Conv+Awaken)', 3, 'meta-multiplicador por mapa'],
  ['Despertar/Awaken (×poder/tier)',   2.5, 'mudança de classe'],
  ['Nível (flat/nível, reseta na conv)', 2, 'base por-run (limitada)'],
  ['Convergence (+15% aditivo)',       1.5, 'dial inicial, bola-de-neve leve'],
];

let total = 0;
console.log('SISTEMA                                  | décadas | papel');
console.log('-'.repeat(82));
for (const [name, dec, role] of budget) {
  total += Number(dec);
  console.log(`${name.padEnd(40)} | ${String(dec).padStart(7)} | ${role}`);
}
console.log('-'.repeat(82));
console.log(`${'TOTAL'.padEnd(40)} | ${total.toFixed(1).padStart(7)} | (alvo ≈ ${decadesNeeded.toFixed(0)})`);
console.log(`\nO HP do jogador segue o MESMO orçamento (gear_hp/passive_hp/memoire_hp/etc.).`);
console.log('⏳ Cada fatia é calibrada quando o sistema é reimplementado (CP-5..CP-10); CP-12 junta.');
```

### `tools/sim/cleave.mjs`

```javascript
// Simulador — efeito do UNLOCK de CLEAVE/AoE (ADR 0002 revisado).
// ⚠️ O combate BASE é single-target (1 kill/ataque, renda ≤ APS). Este sim modela
// o que acontece QUANDO o cleave/AoE é DESBLOQUEADO: o ataque atinge a onda
// inteira, então kills/s = (tamanho da onda) × APS ao ONE-SHOTAR, e caem quando o
// HP do mob passa do dano (= a Wall). A coluna "ANTIGO/base" = single-target (≤ APS).
// Uso: `node tools/sim/cleave.mjs`

import { MAPS, COMBAT, ECONOMY } from '../../src/data/constants.js';
import { hpForLevel, subareaLevelRange } from '../../src/game/enemies.js';

const fmt = (x) => {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e < 6) return x.toLocaleString('en', { maximumFractionDigits: 1 });
  return x.toExponential(2);
};
const geomean = (lo, hi) => Math.sqrt(lo * hi);

const APS = COMBAT.apsCap;              // teto de ataques/s (player forte)
const map = MAPS[0];                    // Map 1 (ilustrativo)

console.log('='.repeat(82));
console.log('CAMADA 1 — Combate CLEAVE. Map 1. APS=' + APS + ' · goldRatio=' + ECONOMY.goldRatio);
console.log('Cada ataque atinge a onda inteira; kills/s e Lumens/s escalam com o TAMANHO da onda.');
console.log('='.repeat(82));

// Para vários níveis de DANO POR HIT do jogador, ver kills/s e Lumens/s por sub-área.
const DMG_TIERS = [10, 100, 1e3, 1e4, 1e5, 1e6];

for (const dmg of DMG_TIERS) {
  console.log(`\n### dano/hit = ${fmt(dmg)}`);
  console.log('  sub | pack | mobHP(rep) | golpes p/ limpar | kills/s CLEAVE | kills/s ANTIGO | Lumens/s CLEAVE');
  for (let s = 1; s <= map.subareaCount; s++) {
    const { lo, hi } = subareaLevelRange(map, s);
    const mobHp = hpForLevel(map, geomean(lo, hi));
    const pack = map.packSizes[s - 1];
    const hitsToClear = Math.max(1, Math.ceil(mobHp / dmg)); // golpes p/ derrubar 1 mob (cleave derruba todos juntos)
    const killsCleave = (pack * APS) / hitsToClear;          // a onda toda cai em hitsToClear golpes
    const killsOld = Math.min(APS, killsCleave / pack * 1);  // antigo: teto de 1 kill/ataque (≤ APS)
    const lumensCleave = killsCleave * (mobHp * ECONOMY.goldRatio);
    const wall = hitsToClear > 1 ? (hitsToClear > 50 ? '  ← WALL DURA' : '  ← devagar') : '';
    console.log(
      `   ${s}  | ${String(pack).padStart(4)} | ${fmt(mobHp).padStart(10)} | ${String(hitsToClear).padStart(16)} | ${fmt(killsCleave).padStart(13)} | ${fmt(killsOld).padStart(13)} | ${fmt(lumensCleave).padStart(13)}${wall}`
    );
  }
}

console.log('\n' + '='.repeat(82));
console.log('LEITURA:');
console.log(' • Quando voce ONE-SHOTA (golpes=1): kills/s = pack × APS (renda escala com a onda).');
console.log('   No modelo ANTIGO isso era TRAVADO em APS (1 kill/ataque) — eis a re-ancoragem.');
console.log(' • Quando mobHP > dano (golpes>1): kills/s despenca = a WALL (vá farmar Hollow/Gear).');
console.log(' • Lumens/s = kills/s × (mobHP × goldRatio): farmar FUNDO (mobHP alto) e RÁPIDO paga mais.');
console.log('='.repeat(82));
```

### `tools/sim/convergence.mjs`

```javascript
// Camada 7 — CONVERGENCE (prestige ANINHADO) + DIFICULDADES.
// A Ascension ZERA os pontos de Convergence mas AMPLIFICA a base composta (§8).
// Logo conv_factor = base(ascensions)^convPoints, e o orçamento ~4 décadas é o
// PICO da era final. Uso: node tools/sim/convergence.mjs

const dec = (x) => Math.log10(x).toFixed(2);
// ⚠️ DEPENDÊNCIA NÃO DEFINIDA (auditoria 2026-06-11): os ~4 décadas assumem 50 pontos
// de pico por era, mas os pontos vêm de f(xp_run) — função AINDA NÃO DESENHADA. Isto é
// um REQUISITO DE DESIGN p/ a futura sessão de Escala: f(xp_run) deve ser calibrada
// para entregar ~50 pontos de pico por era (senão as 4 décadas não se sustentam).
const PEAK_POINTS = 50;            // pontos de pico numa era (entre 2 Ascensions) — REQUISITO p/ f(xp_run)
// base sobe por Ascension: base = 1 + b0 × growth^asc  (o "amplifica a Convergence")
const b0 = 0.04, growth = 1.38;
const baseFor = (asc) => 1 + b0 * growth ** asc;

console.log('CONVERGENCE (aninhada) — conv_factor = base(asc)^pontos. Reset por Ascension.\n');
console.log(' era (após A) | base composta | pico conv_factor | décadas (pico)');
console.log(' ' + '-'.repeat(62));
for (let asc = 0; asc <= 5; asc++) {
  const base = baseFor(asc);
  const peak = base ** PEAK_POINTS;
  console.log(`   A${asc}          | ${base.toFixed(3).padStart(9)}     | ${('×'+peak.toExponential(1)).padStart(11)}      | ${dec(peak).padStart(6)}`);
}
console.log(`\nb0=${b0}, growth=${growth}/Ascension, pico ~${PEAK_POINTS} pontos/era.`);
console.log('→ Era inicial ~0.85 déc (snowball modesto); era FINAL ~4 décadas (orçamento). ✅');
console.log('Cada Ascension: pontos→0 mas base sobe → "perde os multiplicadores, mas agora são maiores".');

console.log('\nDIFICULDADES (re-roda mapas; A2 abre; escolha por sub-área):');
console.log(' tier      | ×HP/×dano | ×recompensa | teto');
console.log(' ' + '-'.repeat(58));
for (const [t, hp, rw, c] of [
  ['Normal','×1','×1','1e100 (base)'],
  ['Difícil','×1e5','×3','dentro de 1e100'],
  ['Nightmare','×1e15','×10','⚠️ break_infinity (futuro)'],
  ['Tormento','×1e30','×30','⚠️ break_infinity (futuro)'],
]) console.log(`  ${t.padEnd(9)} | ${hp.padEnd(9)} | ${rw.padEnd(11)} | ${c}`);
```

### `tools/sim/cp3.mjs`

```javascript
// Verificação CP-3 — Nível (stat base) + Convergence nova. Importa as funções REAIS.
// Uso: node tools/sim/cp3.mjs
import { runLevel, convMult, damagePerHit, playerHpMax } from '../../src/game/stats.js';
import { convGateLevel, canConverge, doConverge } from '../../src/game/convergence.js';

const mockState = (over = {}) => ({
  xpRun: 0, xpTotal: 0, convergences: 0, ascensions: 0, despertares: 0,
  gear: { edge: { level: 5, rarity: 2 }, vigil: { level: 3, rarity: 1 }, veil: { level: 0, rarity: 0 },
    grasp: { level: 0, rarity: 0 }, reson: { level: 0, rarity: 0 }, band: { level: 0, rarity: 0 } },
  passives: { eclat: Array(15).fill(0), vestige: Array(15).fill(0), fracture: Array(15).fill(0) },
  memoires: Array(15).fill(0), materiais: [0, 0, 0, 0],
  player: { hp: 100, dead: false, respawnTimer: 0, attackTimer: 0 },
  map: 1, subarea: 3, unlockedSubarea: 3, bossDefeated: [true, true, false, false, false],
  killsInSubarea: 0, enemies: [], wave: 1, fx: [], difficulty: 0, auto: {}, lumens: 1000, vestiges: 50,
  ...over,
});

console.log('='.repeat(70));
console.log('CP-3 — verificação do modelo (Nível flat + Convergence aditiva)');
console.log('='.repeat(70));

console.log('\nGate de nível por Convergence (0..5):', [0, 1, 2, 3, 4, 5].map(convGateLevel));
console.log('convMult por nº de convergences (0..5):', [0, 1, 2, 3, 4, 5].map((c) => convMult({ convergences: c })));

console.log('\nNível e dano por xpRun (sem gear/passivas):');
for (const xp of [0, 1e3, 1e5, 1e7]) {
  const s = mockState({ xpRun: xp });
  console.log(`  xpRun ${xp.toExponential(0).padStart(8)} → nível ${String(runLevel(s)).padStart(6)} · dano ${damagePerHit(s).toExponential(2)}`);
}

console.log('\nConverge (nível alto o bastante):');
const s = mockState({ xpRun: 1e7, convergences: 0 });
console.log(`  antes: nível ${runLevel(s)} · gate ${convGateLevel(0)} · canConverge ${canConverge(s)} · convMult ${convMult(s)} · gear.edge`, s.gear.edge);
doConverge(s);
console.log(`  depois: convergences ${s.convergences} · xpRun ${s.xpRun} · convMult ${convMult(s)} · gear.edge`, s.gear.edge, '(raridade preservada?)');
console.log(`  mapa intacto? map=${s.map} subarea=${s.subarea} lumens=${s.lumens} (NÃO resetaram)`);
console.log('='.repeat(70));
```

### `tools/sim/cp4.mjs`

```javascript
// Verificação CP-4 — Gear: custo linear, bulk-buy fechado (milhões), afixo flat.
// Uso: node tools/sim/cp4.mjs
import { GEAR } from '../../src/data/constants.js';
import { levelCost, buyLevels, gearDamageFlat, gearHpFlat, gearApsFlat, levelCapFor } from '../../src/game/gear.js';

const mk = (over = {}) => ({
  lumens: 0, ascensions: 0,
  gear: { edge: { level: 0, rarity: 0 }, vigil: { level: 0, rarity: 0 }, veil: { level: 0, rarity: 0 },
    grasp: { level: 0, rarity: 0 }, reson: { level: 0, rarity: 0 }, band: { level: 0, rarity: 0 } },
  ...over,
});
const fmt = (x) => (Math.abs(x) >= 1e6 ? x.toExponential(2) : x.toLocaleString('en', { maximumFractionDigits: 2 }));

console.log('='.repeat(72));
console.log('CP-4 — Gear: custo linear + bulk-buy fechado + afixo flat');
console.log('='.repeat(72));

console.log('\nCusto de 1 nível (linear) — peça edge, raridade 0 (Faded):');
for (const L of [0, 100, 10000, 1e6]) console.log(`  nível ${String(L).padStart(8)} → custo ${fmt(levelCost({ level: L, rarity: 0 }))}`);

console.log('\nCaps de nível por raridade:', GEAR.levelCap.map((_, r) => `${['Faded','Kindled','Luminous','Radiant','Converged'][r]}=${fmt(levelCapFor({ rarity: r, level: 0 }, { ascensions: 0 }))}`).join(' · '));

console.log('\nBulk-buy (MAX) com orçamentos crescentes — edge Faded:');
for (const budget of [1e4, 1e7, 1e10, 1e13]) {
  const s = mk({ lumens: budget });
  const bought = buyLevels(s, 'edge', 1e12); // n enorme = MAX
  console.log(`  lumens ${fmt(budget).padStart(9)} → comprou ${fmt(bought).padStart(9)} níveis · sobrou ${fmt(s.lumens)}`);
}

console.log('\nAfixo FLAT escala com nível e raridade (gearDamageFlat):');
for (const [lvl, rar] of [[100, 0], [10000, 1], [1e6, 3], [20e6, 4]]) {
  const s = mk({ gear: { ...mk().gear, edge: { level: lvl, rarity: rar } } });
  console.log(`  edge nível ${fmt(lvl).padStart(8)} raridade ${rar} → +dano flat ${fmt(gearDamageFlat(s))} · +HP flat ${fmt(gearHpFlat(s))} · +APS flat ${fmt(gearApsFlat(s))}`);
}
console.log('='.repeat(72));
```

### `tools/sim/decompose.mjs`

```javascript
// Decomposição do dano endgame por ANDAR vs budget. Uso: node tools/sim/decompose.mjs
import { createInitialState } from '../../src/core/state.js';
import { COMBAT, PASSIVES, GOLD_STATS } from '../../src/data/constants.js';
import { strTotal, levelBonus, convFactor, damagePerHit } from '../../src/game/stats.js';
import { gearDamageMult } from '../../src/game/gear.js';
import { passiveDmgMult } from '../../src/game/passives.js';
import { memoireDmgMult, clarte } from '../../src/game/memoires.js';
import { ascMult, despertarMult } from '../../src/game/ascension.js';

const d = (x) => Math.log10(x);

// estado MAXADO (o que gerou as 121 déc) e um BALANCEADO (investimento "apropriado" ~budget)
function build(maxed) {
  const s = createInitialState();
  s.ascensions = 4; s.despertares = 4; s.convergences = 1;
  s.convPoints = maxed ? 200 : 50;                       // budget assume ~50 pico/era
  s.xpTotal = maxed ? 1e30 : 1e30;                       // level_bonus realista (não 0)
  for (const k of Object.keys(s.stats)) s.stats[k] = maxed ? 3200 : 800;
  for (const k of Object.keys(s.gear)) s.gear[k] = { level: maxed ? 2300 : 2300, rarity: 4 };
  for (const t of Object.keys(PASSIVES.trees)) s.passives[t] = Array(15).fill(12);
  s.memoires = s.memoires.map(() => 159);
  return s;
}

function rows(s) {
  const clt = d(clarte(s));
  const memTot = d(memoireDmgMult(s));
  return [
    ['baseDmg (×7)',        d(COMBAT.baseDmg),    '—'],
    ['Gold Stats (str)',    d(strTotal(s)),       4],
    ['Level bonus',         d(levelBonus(s.xpTotal)), 1],
    ['Convergence',         d(convFactor(s)),     4],
    ['Gear (dano)',         d(gearDamageMult(s)), 10],
    ['Passivas (Éclat)',    d(passiveDmgMult(s)), 8],
    ['Mémoires — Clarté',   clt,                  70],
    ['Mémoires — indiv. #1+#10', memTot - clt,    0],
    ['Ascension (×16)',     d(ascMult(s)),        1.2],
    ['Despertar (×625)',    d(despertarMult(s)),  2.8],
  ];
}

for (const [tag, maxed] of [['MAXADO (121 déc)', true], ['BALANCEADO (stats 800, conv 50)', false]]) {
  const s = build(maxed);
  console.log(`\n=== ${tag} ===  dano total = ${d(damagePerHit(s)).toFixed(1)} déc`);
  console.log('andar                        | medido | budget | extra');
  console.log('-'.repeat(58));
  let tot = 0, bud = 0;
  for (const [name, meas, b] of rows(s)) {
    tot += meas; if (typeof b === 'number') bud += b;
    const extra = typeof b === 'number' ? (meas - b).toFixed(1) : '—';
    console.log(`${name.padEnd(28)} | ${meas.toFixed(1).padStart(6)} | ${String(b).padStart(6)} | ${String(extra).padStart(5)}`);
  }
  console.log('-'.repeat(58));
  console.log(`${'TOTAL'.padEnd(28)} | ${tot.toFixed(1).padStart(6)} | ${(bud+0.85).toFixed(1).padStart(6)} | ${(tot-bud-0.85).toFixed(1).padStart(5)}`);
}
```

### `tools/sim/game_harness.mjs`

```javascript
// HARNESS DE VERIFICAÇÃO — roda o COMBATE REAL do jogo (importa os módulos de src/)
// pra conferir que a recalibração "em branco" produz o feel desejado NO JOGO (não no
// modelo abstrato do sim). Política do "jogador": fica na sub-área mais funda liberada,
// compra gear na peça mais barata sempre que dá, e converge assim que o gate abre.
// Uso: node tools/sim/game_harness.mjs

import { createInitialState } from '../../src/core/state.js';
import { combatTick, enterSubarea, bossActive, resetPack } from '../../src/game/combat.js';
import { currentAPS, dps, playerHpMax, runLevel } from '../../src/game/stats.js';
import { buyLevel } from '../../src/game/gear.js';
import { canConverge, doConverge, convGateLevel } from '../../src/game/convergence.js';
import { canDespertar, doDespertar } from '../../src/game/ascension.js';
import { GEAR, GEAR_RARITY_LABELS, DESPERTAR_REQ, ENEMY, ECONOMY, LEVEL, COMBAT } from '../../src/data/constants.js';
import { levelCost, atLevelCap, canRarityUp, doRarityUp, levelCapFor } from '../../src/game/gear.js';
import { getCurrentMap } from '../../src/game/enemies.js';
import { playerDefesa, damagePerHit, critChance, critDamageMult } from '../../src/game/stats.js';

const DT = 0.1;
if (process.env.GCOST) GEAR.levelCostBase = +process.env.GCOST; // sweep do custo de gear
if (process.env.XPRATIO) ECONOMY.xpRatio = +process.env.XPRATIO; // XP = mobHp × xpRatio
if (process.env.LUMBASE) ECONOMY.lumBase = +process.env.LUMBASE;
if (process.env.CDIV) LEVEL.curveDiv = +process.env.CDIV;
if (process.env.DFRAC) ENEMY.dmgFrac = +process.env.DFRAC;
if (process.env.DKILLS) DESPERTAR_REQ[1].kills = +process.env.DKILLS; // sweep do gate do Despertar
if (process.env.DLEVEL) DESPERTAR_REQ[1].level = +process.env.DLEVEL;
if (process.env.DT1) DESPERTAR_REQ[1].t1 = +process.env.DT1;
const fmtT = (s) => s == null ? '  —  ' : s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s/60).toFixed(1)}min` : s < 86400*2 ? `${(s/3600).toFixed(1)}h` : `${(s/86400).toFixed(2)}d`;
const fmt = (n) => n >= 1e9 ? (n/1e9).toFixed(2)+'bi' : n >= 1e6 ? (n/1e6).toFixed(2)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'k' : Math.round(n).toString();

// compra gulosa: gasta lumens na peça mais barata que não está no cap, até não dar mais
function buyGearGreedy(state) {
  let guard = 0;
  while (guard++ < 5000) {
    let best = null, bestCost = Infinity;
    for (const def of GEAR.pieces) {
      const p = state.gear[def.key];
      if (atLevelCap(p, state)) continue;
      const c = levelCost(p);
      if (c < bestCost) { bestCost = c; best = def.key; }
    }
    if (!best || state.lumens < bestCost) break;
    if (!buyLevel(state, best)) break;
  }
}
// sobe a raridade de QUALQUER peça que possa (materiais + lockstep + cap do mapa)
function rarityUpGreedy(state) {
  let did = true;
  while (did) { did = false; for (const def of GEAR.pieces) if (canRarityUp(state, def.key)) { doRarityUp(state, def.key); did = true; } }
}
const minRarity = (state) => Math.min(...GEAR.pieces.map((d) => state.gear[d.key].rarity));
const totalGearLevel = (state) => GEAR.pieces.reduce((s, d) => s + state.gear[d.key].level, 0);
const avgGearLevel = (state) => totalGearLevel(state) / GEAR.pieces.length;

// Jogador sensato: farma a sub-área mais funda LIBERADA onde ele (a) mata o mob
// representativo rápido o bastante e (b) sobrevive à onda. Mob/dano representativos =
// nível médio-geométrico da faixa da sub-área. Sobrevivência ≈ dano levado p/ limpar < HP.
function bestFarmArea(state) {
  const map = getCurrentMap(state);
  const d = dps(state), hp = playerHpMax(state), def = playerDefesa(state), lvl = runLevel(state);
  const bDmg = COMBAT.baseDmg + lvl * LEVEL.dmgPerLevel;             // baseline do nível (sem multiplicadores)
  const bHp = COMBAT.playerBaseHp + lvl * LEVEL.hpPerLevel;
  for (let s = state.unlockedSubarea; s >= 1; s--) {
    const mobHp = bDmg * ENEMY.hitsToKill * ENEMY.areaHp[s - 1];     // baseline → gear/conv/despertar matam mais rápido
    const size = map.packSizes[s - 1];
    const tClear = (size * mobHp) / d;              // tempo p/ limpar a onda (dps REAL do player)
    const packDps = hp * ENEMY.dmgFrac * ENEMY.areaDmg[s - 1];       // onda inteira (HP REAL → perigo persiste)
    const armored = (packDps * packDps) / (def + packDps);
    const taken = armored * (tClear / 2) - hp * 0.01 * (tClear / 2); // ~metade da onda viva, menos regen
    if (taken < hp * 0.8) return s;                  // sobrevive com folga
  }
  return 1;
}

const state = createInitialState();
state.player.hp = playerHpMax(state);
resetPack(state); // boot da 1ª onda (o main.js faz isso no jogo)

const M = { lvl2: null, conv1: null, despertar: null, sub9: null, wallSpawn: null, wallKill: null };
let despSnap = null;
let t = 0, deaths = 0, wallAttempts = 0, prevDead = false;
let firstWallHp = null, firstWallSnap = null;
const CAP_T = 60 * 3600; // 60h de teto

let reTick = 0;
while (t < CAP_T) {
  // re-decide a área a cada ~3s (jogador sensato: mais funda sustentável)
  if (reTick-- <= 0) { const tgt = bestFarmArea(state); if (tgt !== state.subarea) enterSubarea(state, tgt); reTick = 30; }

  combatTick(state, DT);
  t += DT;

  buyGearGreedy(state);
  rarityUpGreedy(state);
  if (canConverge(state)) { doConverge(state); if (M.conv1 === null) M.conv1 = t; }
  // NODESP=1 → jogador NUNCA desperta (contrafactual: "é impossível sem Despertar?")
  if (!process.env.NODESP && canDespertar(state)) { doDespertar(state); if (M.despertar === null) { M.despertar = t; despSnap = { lvl: runLevel(state), gear: avgGearLevel(state), kills: state.killsTotal, sub: state.unlockedSubarea }; } }

  const lvl = runLevel(state);
  if (M.lvl2 === null && lvl >= 2) M.lvl2 = t;
  if (M.sub9 === null && state.unlockedSubarea >= 9) M.sub9 = t;

  // detecta o boss da Wall na cena
  if (state.subarea === 9 && bossActive(state)) {
    if (M.wallSpawn === null) {
      M.wallSpawn = t; wallAttempts++;
      firstWallHp = playerHpMax(state);
      firstWallSnap = { lvl, gear: avgGearLevel(state), aps: currentAPS(state), dps: dps(state), conv: state.convergences };
    }
  }
  // morte
  if (state.player.dead && !prevDead) { deaths++; if (state.subarea === 9) wallAttempts++; }
  prevDead = state.player.dead;

  // boss final derrotado?
  if (state.bossDefeated[8] && M.wallKill === null) { M.wallKill = t; break; }
}

const g = avgGearLevel(state);
console.log('=== HARNESS: combate REAL do jogo (recalibração "VALORES NO MAPA" 18/jun) ===');
console.log(`nível 2 .............. ${fmtT(M.lvl2)}`);
console.log(`1ª Convergence ....... ${fmtT(M.conv1)}  (gate nível ${convGateLevel(0)})`);
console.log(`Despertar (T2) ....... ${fmtT(M.despertar)}${despSnap ? `  (Sub ${despSnap.sub} · nível ${despSnap.lvl} · gear ${despSnap.gear.toFixed(0)} · ${despSnap.kills} kills)` : ''}`);
console.log(`Sub 9 liberada ....... ${fmtT(M.sub9)}`);
console.log(`Wall (boss) surge .... ${fmtT(M.wallSpawn)}`);
console.log(`Wall derrotada ....... ${fmtT(M.wallKill)}  ${M.wallKill ? '✅ Map 1 limpo' : '(não limpou no teto de 60h)'}`);
console.log(`mortes totais ........ ${deaths}`);
console.log('--- estado no FIM ---');
console.log(`tempo ................ ${fmtT(t)}`);
console.log(`nível da run ......... ${runLevel(state)}  · convergences ${state.convergences}`);
console.log(`gear médio ........... ${g.toFixed(0)}  · raridade mín ${GEAR_RARITY_LABELS[minRarity(state)]} (cap ${levelCapFor({ rarity: minRarity(state), level: 0 }, state)})`);
console.log(`APS .................. ${currentAPS(state).toFixed(2)}  (ALVO 2,5)  · dps ${fmt(dps(state))}`);
console.log(`crit rate ............ ${(critChance(state) * 100).toFixed(1)}%  (ALVO 30%)  · crit dmg ×${critDamageMult(state).toFixed(2)}  · despertares ${state.despertares || 0}`);
console.log(`HP máx ............... ${fmt(playerHpMax(state))}`);
if (firstWallSnap) {
  console.log('--- 1º encontro com a Wall ---');
  console.log(`nível ${firstWallSnap.lvl} · gear ${firstWallSnap.gear.toFixed(0)} · conv ${firstWallSnap.conv} · APS ${firstWallSnap.aps.toFixed(2)} · dps ${fmt(firstWallSnap.dps)} · HP ${fmt(firstWallHp)}`);
}
```

### `tools/sim/gear_caps.mjs`

```javascript
// Relatório dos stats do Gear nos CAPS — Comum (Faded, nível 500) e Incomum (Kindled, 1400).
// Usa as funções REAIS de src/game/gear.js. Uso: node tools/sim/gear_caps.mjs
import { GEAR, GEAR_RARITY_LABELS } from '../../src/data/constants.js';
import {
  primaryMult, secondaryMult, critOf, critDmgOf, gildedOf, activeSecondaries,
  gearDamageMult, gearHpMult, gearGildedChance, gearApsFlat, gearDamageFlat, gearHpFlat,
  gearCritAdd, gearCritDmgAdd, gearLumensMult, gearXpMult,
} from '../../src/game/gear.js';

const pe = (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(x < 0.01 ? 3 : 1)}%`;
const fnum = (n) => n >= 1e9 ? (n / 1e9).toFixed(2) + 'bi' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : (Math.round(n * 1000) / 1000).toString();
const TYPE_PT = { dmg: 'Dano', hp: 'HP', gilded: 'Gilded chance', aps: 'Atk Speed', crit: 'Crit Rate', critDmg: 'Crit Dmg', bossDmg: 'Dano em Boss', regen: 'Regen', lumens: 'Gold', xp: 'XP', materiais: 'Materiais', erosao: 'Erosão' };

// Afixos de UMA peça num dado nível/raridade (espelha a agregação do gear.js).
function pieceAffixes(def, level, rarity) {
  const rm = GEAR.rarityMult[rarity];
  const out = [];
  const hasFlat = (GEAR.flatPerLevel[def.primary] || 0) > 0;
  // PRIMÁRIO: flat (se houver) + bônus% + (multiplier× se rarity≥1)
  if (hasFlat) out.push(`${TYPE_PT[def.primary]} flat ${fnum(level * GEAR.flatPerLevel[def.primary] * rm)}`);
  if (['dmg', 'hp', 'aps'].includes(def.primary)) {
    const bonus = 1 + level * GEAR.bonusRate * rm;
    out.push(`${TYPE_PT[def.primary]} ${pe(bonus - 1)} (bônus%)`);
    if (rarity >= 1 && (def.primary === 'dmg' || def.primary === 'hp')) { const mult = 1 + level * GEAR.multRate * rm; out.push(`${TYPE_PT[def.primary]} ${pe(mult - 1)} (MULTIPLIER ×)`); }
  } else if (def.primary === 'crit') {
    out.push(`${TYPE_PT.crit} ${pe(critOf(level, rarity))}`);
  } else if (def.primary === 'gilded') {
    out.push(`${TYPE_PT.gilded} ${pe(gildedOf(level, rarity))}`);
  } else if (['lumens', 'xp', 'materiais'].includes(def.primary)) {
    out.push(`${TYPE_PT[def.primary]} ${pe(level * GEAR.affixPctRate * rm)}`);
  }
  // SECUNDÁRIOS ativos (a 0.30): valor já amortecido
  for (const sec of activeSecondaries(def, rarity)) {
    if (sec === 'crit') out.push(`${TYPE_PT.crit} ${pe(critOf(level, rarity) * GEAR.secondaryExp)} (sec)`);
    else if (sec === 'critDmg') out.push(`${TYPE_PT.critDmg} +${(critDmgOf(level, rarity) * GEAR.secondaryExp).toFixed(2)}× (sec)`);
    else if (['lumens', 'xp', 'materiais'].includes(sec)) out.push(`${TYPE_PT[sec]} ${pe(level * GEAR.affixPctRate * rm * GEAR.secondaryExp)} (sec)`);
    else { const sm = secondaryMult(level, rarity); out.push(`${TYPE_PT[sec]} ${pe(sm - 1)} (sec ×)`); }
  }
  return out;
}

function report(rarity, level) {
  console.log(`\n══════ ${GEAR_RARITY_LABELS[rarity]} (${rarity === 0 ? 'Comum' : 'Incomum'}) — nível CAP ${level} ══════`);
  for (const def of GEAR.pieces) {
    console.log(`  ${def.slot.padEnd(9)} ${def.name}`);
    for (const a of pieceAffixes(def, level, rarity)) console.log(`      · ${a}`);
  }
  // AGREGADO do set completo (todas as 6 peças no cap) — o que chega no player
  const state = { gear: {}, map: 1 };
  for (const def of GEAR.pieces) state.gear[def.key] = { level, rarity };
  console.log(`  ── AGREGADO do set (todas as 6 peças no cap) ──`);
  console.log(`      Dano:  flat +${fnum(gearDamageFlat(state))}   ×${gearDamageMult(state).toFixed(2)} (mult)`);
  console.log(`      HP:    flat +${fnum(gearHpFlat(state))}   ×${gearHpMult(state).toFixed(2)} (mult)`);
  console.log(`      Gilded chance: ${(gearGildedChance(state) * 100).toFixed(1)}% (teto global 30%)`);
  console.log(`      Atk Speed: +${gearApsFlat(state).toFixed(3)} (flat, antes do cap)`);
  console.log(`      Crit Rate: ${pe(gearCritAdd(state))}   ·   Crit Dmg: +${gearCritDmgAdd(state).toFixed(2)}×`);
  console.log(`      Gold: ×${gearLumensMult(state).toFixed(2)}   ·   XP: ×${gearXpMult(state).toFixed(2)}`);
}

console.log('STATS DO GEAR NOS CAPS — Map 1 (cada peça = 1 nível escala todos os afixos)');
report(0, GEAR.levelCap[0]); // Comum / Faded — cap 500
report(1, GEAR.levelCap[1]); // Incomum / Kindled — cap 1400
```

### `tools/sim/gear.mjs`

```javascript
// Camada 3 — GEAR. Calibra o multiplicador AGREGADO do Gear p/ ~10 décadas, NUNCA
// morre, com salto por mapa. Uso: node tools/sim/gear.mjs
//
// 🔧 CORREÇÃO DE AUDITORIA 2026-06-11 (orçamento por peça vs PRODUTO de peças):
//   gear_dano é o PRODUTO dos afixos de DANO, e no catálogo novo (§13) o Dano aparece
//   como PRIMÁRIO na arma (Edge) e SECUNDÁRIO em Grasp e Resonance. Logo as 10 décadas
//   são o TOTAL AGREGADO das 3 peças, não de 1 peça. Split: primário carrega o grosso,
//   secundário = 30% das décadas do primário (faixa de design 25-35%).
//
// Modelo (por afixo de dano):
//   linear (% flavor, toda raridade):  1 + L × pctRate × rarityMult[R]
//   expo   (× flavor, Luminous+):      multBase ^ L     ← MOTOR SEM-TETO

const RARITY = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
const rarityMult = [1, 1.5, 2.25, 3.5, 5];     // §13 (código)
const baseCaps   = [25, 50, 100, 175, 300];    // teto de nível por raridade

// ── constantes a calibrar (PRIMÁRIO) ──
const pctRate   = 0.02;    // % por nível (× rarityMult)
const multBase  = 1.0039;  // × por nível (Luminous+) — ajustado p/ o AGREGADO bater ~10 déc
const multFromRarity = 2;  // idx da raridade que destrava o sabor × (Luminous)
const capPerAsc = 500;     // a Ascension soma isto ao teto de nível (sem-teto)

// SPLIT do orçamento entre afixos de dano (§13):
const secondaryWeight = 0.30;   // secundário (Grasp/Resonance) = 30% das décadas do primário
const N_SECONDARY = 2;          // Grasp + Resonance têm Dano como secundário

// décadas do afixo PRIMÁRIO (Edge) num nível/raridade
function primaryDec(L, rIdx) {
  const linear = 1 + L * pctRate * rarityMult[rIdx];
  const expo = rIdx >= multFromRarity ? multBase ** L : 1;
  return Math.log10(linear * expo);
}
// AGREGADO = primário + N×(secundário). Secundário = 30% das décadas do primário (peças multiplicam → décadas somam)
function aggregateDec(L, rIdx) {
  const p = primaryDec(L, rIdx);
  return p * (1 + N_SECONDARY * secondaryWeight);   // ×1.6
}

const f = (d) => d.toFixed(2);

console.log('JORNADA do gear_dano AGREGADO (Edge primário + Grasp/Resonance secundário 30%)\n');
console.log('marco                         | nível | déc PRIMÁRIO | déc AGREGADO');
console.log('-'.repeat(66));
for (let r = 0; r < 5; r++) {
  const L = baseCaps[r];
  console.log(`${RARITY[r].padEnd(12)} (cap base)       | ${String(L).padStart(5)} |     ${f(primaryDec(L, r)).padStart(6)}   |    ${f(aggregateDec(L, r)).padStart(6)}`);
}
console.log('-'.repeat(66));
for (let a = 1; a <= 5; a++) {
  const L = 300 + a * capPerAsc;
  console.log(`Converged pós-A${a}            | ${String(L).padStart(5)} |     ${f(primaryDec(L, 4)).padStart(6)}   |    ${f(aggregateDec(L, 4)).padStart(6)}`);
}
console.log('-'.repeat(66));
console.log('CHECK nunca-morre: AGREGADO sobe sempre (monotônico).');
console.log('ALVO do orçamento (§14B): AGREGADO ~10 décadas no endgame (Converged pós-A4).');
console.log(`SPLIT: primário ~${f(primaryDec(2300,4))} déc · cada secundário ~${f(secondaryWeight*primaryDec(2300,4))} déc × ${N_SECONDARY} = total ~${f(aggregateDec(2300,4))} déc.`);

// ── Veil (defesa) — alvo Camada 2: def ≈ 1-4× packDps ──
console.log('\nVEIL (defesa) — def = hp_max × veilFactor; alvo def/packDps ∈ [1,4]:');
for (const vf of [0.02, 0.045, 0.09, 0.18]) {
  const ratio = 22.5 * vf;
  console.log(`  veilFactor=${String(vf).padEnd(5)} → def ≈ ${ratio.toFixed(1)}× packDps (mit ${(ratio/(ratio+1)*100).toFixed(0)}%)`);
}
```

### `tools/sim/gearcal.mjs`

```javascript
// Calibração do GEAR à sua fatia do orçamento (~13 décadas no Normal).
// Mede a contribuição de dano do gear por raridade (set inteiro maximizado) vs uma
// base de referência, e mostra as décadas. Uso: node tools/sim/gearcal.mjs
import { GEAR, COMBAT, LEVEL } from '../../src/data/constants.js';
import { gearDamageFlat, gearDamageMult } from '../../src/game/gear.js';

const RAR = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
// base de referência SEM gear: baseDmg + nível-de-run típico (~100) × dmgPerLevel
const baseRef = COMBAT.baseDmg + 100 * LEVEL.dmgPerLevel;

// set inteiro numa raridade r, todas as peças no cap daquela raridade
const setAt = (r) => {
  const lvl = GEAR.levelCap[r];
  const gear = {};
  for (const def of GEAR.pieces) gear[def.key] = { level: lvl, rarity: r };
  return { gear };
};

console.log('='.repeat(78));
console.log(`Gear — décadas de dano por raridade (set maximizado). baseRef = ${baseRef}`);
console.log('='.repeat(78));
console.log('Raridade   | +dano flat | ×dano (%)  | déc FLAT | déc % | DÉC total');
console.log('-'.repeat(78));
for (let r = 0; r < 5; r++) {
  const s = setAt(r);
  const flat = gearDamageFlat(s);
  const mult = gearDamageMult(s);
  const flatDec = Math.log10((baseRef + flat) / baseRef); // décadas que o flat dá (sobre a base)
  const pctDec = Math.log10(mult);                        // décadas que o % dá (multiplicativo)
  const total = flatDec + pctDec;
  console.log(
    `${RAR[r].padEnd(10)} | ${flat.toExponential(2).padStart(10)} | ${mult.toExponential(2).padStart(10)} | ${flatDec.toFixed(1).padStart(8)} | ${pctDec.toFixed(1).padStart(5)} | ${total.toFixed(1).padStart(6)}`
  );
}
console.log('-'.repeat(78));
console.log('ALVO: ~13 décadas no Converged (a fatia do gear). Ajustar flatPerLevel/affixPctRate/');
console.log('affixMultBase/levelCap até a linha Converged bater ~13.');
```

### `tools/sim/gearcost.mjs`

```javascript
// Custo de upar gear vs renda do mapa — pra ver se o CUSTO é um freio natural (sem cap).
// Uso: node tools/sim/gearcost.mjs
import { GEAR, ECONOMY, MAPS } from '../../src/data/constants.js';
import { hpForLevel, subareaLevelRange } from '../../src/game/enemies.js';

// custo total p/ ir de 0 ao nível N (custo linear: base×(L+1)×costMult → soma quadrática)
const costToLevel = (N, rarity) => GEAR.levelCostBase * GEAR.costMult[rarity] * (N * (N + 1) / 2);
// Lumens por kill no mapa (base, convMult=1): mob_hp(rep mais fundo) × goldRatio
const lumensPerKill = (map) => hpForLevel(map, Math.round(subareaLevelRange(map, map.subareaCount).hi)) * ECONOMY.goldRatio;

const fmt = (x) => (Math.abs(x) >= 1e4 ? x.toExponential(2) : x.toLocaleString('en', { maximumFractionDigits: 0 }));
const KPS = 30; // kills/seg representativo (cleave: ~pack×APS). Só p/ estimar tempo.
const milestones = [1e4, 1e5, 1e6, 1e7];

// Map 1 = Faded · Map 2 = Kindled · ... (raridade = mapa-1, capada em Converged)
for (let m = 1; m <= 5; m++) {
  const map = MAPS[m - 1];
  const rarity = Math.min(m - 1, 4);
  const lpk = lumensPerKill(map);
  console.log('\n' + '='.repeat(86));
  console.log(`MAP ${m} — ${map.name} · raridade ${['Faded','Kindled','Luminous','Radiant','Converged'][rarity]} · Lumens/kill ≈ ${lpk.toExponential(2)}`);
  console.log('='.repeat(86));
  console.log('  nível | custo total (Lumens) | kills p/ pagar | tempo @30 kills/s');
  console.log('  ' + '-'.repeat(72));
  for (const N of milestones) {
    const cost = costToLevel(N, rarity);
    const kills = cost / lpk;
    const secs = kills / KPS;
    const t = secs < 90 ? `${secs.toFixed(0)}s` : secs < 5400 ? `${(secs/60).toFixed(0)}min` : secs < 1.3e5 ? `${(secs/3600).toFixed(1)}h` : `${(secs/86400).toFixed(1)}d`;
    console.log(`  ${N.toExponential(0).padStart(5)} | ${fmt(cost).padStart(20)} | ${fmt(kills).padStart(14)} | ${t.padStart(16)}`);
  }
}
console.log('\nLEITURA: se "kills p/ pagar" e o tempo crescem RÁPIDO com o nível, o custo é o freio');
console.log('natural — você para de upar quando fica caro demais, sem precisar de cap.');
```

### `tools/sim/gearflow.mjs`

```javascript
// Exploração SEM CAP — modelo Gaiadon (3 camadas lineares que multiplicam).
// Mostra até onde cada número vai conforme o nível sobe livre. Uso: node tools/sim/gearflow.mjs
//
// Modelo (por peça, por afixo de stat):
//   Primary (flat)  = level × primaryRate × rarityMult           → soma à base
//   Bonus%          = 1 + level × bonusRate   × rarityMult       → camada %
//   ×Multiplier     = 1 + level × multRate    × rarityMult       → camada ×
//   contribuição da peça ao DANO = (base + Primary) × Bonus% × Multiplier
// Total cresce ~ nível³ (polinomial), não exponencial.

const RAR = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
const RARMULT = [1, 1.5, 2.25, 3.5, 5];

// taxas-semente (estilo Gaiadon — a print: Primary +50/nv, Mult +0.01/nv, Mastery +0.006%/nv)
const primaryRate = 50;     // flat por nível
const multRate = 0.01;      // +0.01 ao ×Multiplier por nível
const bonusRate = 6e-5;     // +0.006% por nível (×Mastery)
const baseRef = 1007;       // base sem gear (baseDmg + nível-run ~100 × dmgPerLevel)

const fmt = (x) => (Math.abs(x) >= 1e5 || (x !== 0 && Math.abs(x) < 0.01) ? x.toExponential(2) : x.toLocaleString('en', { maximumFractionDigits: 2 }));

const levels = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9];

for (const r of [0, 4]) { // Faded e Converged (extremos)
  const rm = RARMULT[r];
  console.log('\n' + '='.repeat(92));
  console.log(`${RAR[r]} (rarityMult ${rm}) — UMA peça de dano, sem cap. baseRef=${baseRef}`);
  console.log('='.repeat(92));
  console.log('nível      | Primary(flat) | Bonus%      | ×Multiplier | dano c/ peça | décadas');
  console.log('-'.repeat(92));
  for (const L of levels) {
    const primary = L * primaryRate * rm;
    const bonus = 1 + L * bonusRate * rm;     // ex.: ×1140 = +114k%
    const mult = 1 + L * multRate * rm;       // ex.: ×191k
    const dmg = (baseRef + primary) * bonus * mult;
    const dec = Math.log10(dmg / baseRef);
    console.log(
      `${L.toExponential(0).padStart(9)} | ${fmt(primary).padStart(13)} | ${fmt(bonus).padStart(11)} | ${fmt(mult).padStart(11)} | ${dmg.toExponential(2).padStart(12)} | ${dec.toFixed(1).padStart(6)}`
    );
  }
}
console.log('\nLEITURA: veja em que NÍVEL cada raridade chega na fatia de ~13 décadas do gear.');
console.log('Isso vira o "alcance natural" de níveis por raridade (sem cravar cap antes).');
```

### `tools/sim/map1_affix.mjs`

```javascript
// MAP 1 — cálculo REVERSO: do boss → dano necessário → distribuição dos afixos.
// cap arma 1000 · APS rampa 0.90→1.5 (cap do M1) · duração mín 6h (ativo, com conv).
// Reporta o dano-por-hit no boss (com/sem conv) e a margem. Uso: node tools/sim/map1_affix.mjs

const BASE = 7, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08, DIV = 10, EXP = 0.4, BOSSMULT = 15;
const N = 5, hpLo = 10, hpHi = 1e6, KILLGATE = 100, GATE_DIV = 13, CAP = 1000;
const APS_LO = 0.90, APS_HI = 1.5; // rampa de APS ao longo do mapa (afixo do Amuleto)
const CONV_PER = 0.15, GATE_BASE = 40;

// APS sobe com o progresso da arma (proxy do afixo de APS subindo junto): 0.90→1.5 no cap
const apsOf = (wl) => APS_LO + (APS_HI - APS_LO) * Math.min(1, wl / CAP);

function run({ useConv, FLAT, PCT, costBase, gateGrowth, lumFloor = 0 }) {
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0, convMult: 1, convs: 0, gate: GATE_BASE };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, CAP) * FLAT) * (1 + Math.min(p.wl, CAP) * PCT) * p.convMult;
  const cost = () => costBase * (p.wl + 1);
  let total = 0, walled = false, bossDmgHit = 0, bossHp = 0, bossKillS = 0, totalKills = 0, firstBuyT = -1, lvl5T = -1; const rows = [];
  for (let s = 1; s <= N; s++) {
    const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
    const bHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
    let kills = 0, subTime = 0, guard = 0, broke = false;
    while (guard++ < 5e6) {
      const aps = apsOf(p.wl);
      const dps = dmgHit() * aps;
      const tpk = Math.max(1 / aps, mobHp / dps);
      const dt = Math.max(tpk, 0.5); const k = dt / tpk;
      kills += k; subTime += dt; total += dt; totalKills += k;
      p.lumens += k * (mobHp * GOLD + lumFloor); // + PISO fixo de lumens (ajuda o early)
      if (firstBuyT < 0 && p.wl >= 1) firstBuyT = total;
      if (lvl5T < 0 && p.wl >= 5) lvl5T = total; p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      while (useConv && p.level >= p.gate) { p.convMult += CONV_PER; p.convs++; p.gate *= gateGrowth; p.xpRun = 0; p.level = 1; }
      let b = 0; while (p.wl < CAP && p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      if (kills >= KILLGATE && dps >= bHp / GATE_DIV) { broke = true; break; }
      if (subTime > 30 * 86400) { walled = true; break; }
    }
    // breakdown do crossover: décadas do FLAT da arma vs décadas do % da arma
    const addBase = BASE + p.level * DMG_PER_LVL;            // base + nível (aditivo, sem arma)
    const wFlat = Math.min(p.wl, CAP) * FLAT;                // flat da arma (aditivo)
    const wPctMult = 1 + Math.min(p.wl, CAP) * PCT;          // % da arma (multiplicador)
    const flatDec = Math.log10((addBase + wFlat) / addBase); // quanto o FLAT da arma soma
    const pctDec = Math.log10(wPctMult);                     // quanto o % da arma multiplica
    rows.push({ s, wl: p.wl, flatDec, pctDec, prot: pctDec > flatDec ? '%' : 'flat' });
    if (s === N) { bossDmgHit = dmgHit(); bossHp = bHp; bossKillS = bHp / (dmgHit() * apsOf(p.wl)); }
    if (!broke) { walled = true; break; }
  }
  return { total, walled, bossDmgHit, bossHp, bossKillS, convMult: p.convMult, convs: p.convs, wl: p.wl, rows, totalKills, firstBuyT, lvl5T };
}

const fmtT = (s) => s < 5400 ? `${(s/60).toFixed(1)}min` : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(1)}d`;

const GROWTH = 1.25;
console.log('='.repeat(82));
console.log(`MAP 1 — flat→% protagonista · cap ${CAP} · APS ${APS_LO}→${APS_HI} · Boss 1.5e7 (~7.7e5/hit)`);
console.log('='.repeat(82));
// splits + custo ajustado p/ conv ~6h. Mostra onde o % assume.
const FLAT = 60, PCT = 0.02;
console.log(`Config: flat ${FLAT} + ${PCT*100}% · cap ${CAP} · piso de lumens + custo p/ segurar ≥6h`);
console.log('  piso | custo | 1º nível | nível 5  | TOTAL(conv) | TOTAL(sem)');
console.log('  ' + '-'.repeat(62));
for (const [lumFloor, COST] of [[60, 1400], [60, 1700], [60, 1900], [30, 1600], [120, 2000]]) {
  const a = run({ useConv: false, FLAT, PCT, costBase: COST, gateGrowth: GROWTH, lumFloor });
  const r = run({ useConv: true, FLAT, PCT, costBase: COST, gateGrowth: GROWTH, lumFloor });
  console.log(`  ${String(lumFloor).padStart(4)} | ${String(COST).padStart(5)} | ${fmtT(r.firstBuyT).padStart(8)} | ${fmtT(r.lvl5T).padStart(8)} | ${fmtT(r.total).padStart(11)} | ${fmtT(a.total).padStart(10)}`);
}
```

### `tools/sim/map1_b.mjs`

```javascript
// MAP 1 — Config B. Base SEM convergence + cap no gear → alvo ~12h (referência).
// Depois a convergence acelera p/ ~5-6h. Aqui só a BASE de 12h. Uso: node tools/sim/map1_b.mjs

const BASE = 7, APS = 0.90, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15;
const N = 5, hpLo = 10, hpHi = 1e9, FLAT = 50, PCT = 0.02, KILLGATE = 100, GATE_DIV = 13;

function run(cap, costBase, convMult = 1) {
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0 };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, cap) * FLAT) * (1 + Math.min(p.wl, cap) * PCT) * convMult;
  const cost = () => costBase * (p.wl + 1);
  let total = 0, walled = false, hitCap = false;
  for (let s = 1; s <= N; s++) {
    const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
    const bossHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
    let kills = 0, subTime = 0, guard = 0, broke = false;
    while (guard++ < 5e6) {
      const dps = dmgHit() * APS;
      const tpk = Math.max(1 / APS, mobHp / dps);
      const dt = Math.max(tpk, 0.5); const k = dt / tpk;
      kills += k; subTime += dt; total += dt;
      p.lumens += k * mobHp * GOLD; p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      let b = 0;
      while (p.wl < cap && p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      if (p.wl >= cap) hitCap = true;
      if (kills >= KILLGATE && dps >= bossHp / GATE_DIV) { broke = true; break; }
      if (subTime > 30 * 86400) { walled = true; break; }
    }
    if (!broke) break;
  }
  return { total, walled, finalWl: p.wl, hitCap };
}

const fmtT = (s) => s < 5400 ? `${(s/60).toFixed(1)}min` : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(1)}d`;

console.log('BASE sem conv: cap 40k, custo 280 →', fmtT(run(40000, 280).total), '\n');
console.log('Convergence como ACELERADOR multiplicativo (×M na vida toda), cap 40k, custo 280:');
console.log('  convMult | tempo M1   | arma fim | vs 12.5h');
console.log('  ' + '-'.repeat(46));
const base = run(40000, 280).total;
for (const M of [1, 2, 3, 5, 10, 30, 100]) {
  const r = run(40000, 280, M);
  console.log(`  ${('×'+M).padStart(8)} | ${fmtT(r.total).padStart(10)} | ${r.finalWl.toExponential(2)} | ${(r.total/base*100).toFixed(0)}%`);
}
```

### `tools/sim/map1_blank.mjs`

```javascript
// MAP 1 — pacing da RECALIBRAÇÃO "EM BRANCO" (sessão 2026-06-17 c/ Willian).
// Valores definidos por design 1-a-1 (ver docs/eclats_balance_blank_2026-06-17.md).
// Modela: combate single-target, gate de sub-área por NÍVEL, compra gulosa de Gear,
// Convergence (reseta nível da run + nível do Gear; +15% dano/vida e +3% Lumens, frequente),
// e Despertar na sub-área 7 (×2 dano/vida, +5% crit, crit dmg ×2→×4, +0.3 APS).
// Uso: node tools/sim/map1_blank.mjs

// ── Combate base ──
const BASE = 1000;        // baseDmg
const DMG_LVL = 150;      // +dano por nível do Seeker
const HP_LVL = 150;       // +vida por nível do Seeker
const BASE_HP = 30000;    // playerBaseHp
const APS0 = 0.9;         // baseAPS (≈ Gaiadon 0.904)
const APSCAP = 10;        // teto GLOBAL de APS (decisão Willian); Map 1 chega a ~3
// ── Economia ──
const GOLD = 0.10;        // lumens/kill = mobHp × GOLD
let   XP_RATIO = 0.08;    // xp/kill = mobHp × XP_RATIO  (livre — ajustável)
// ── Gear: 6 peças, 2 afixos cada (flat + bônus%), 2 CAMADAS (Flat + Bonus%).
//    1 nível por peça escala os 2 afixos. Assumo as 6 no MESMO nível L (compra
//    equilibrada): subir L→L+1 custa 6× o custo de 1 peça. Camada Multiplier ×
//    fica pro Hollow/raridades (decisão Willian: "versão 2 camadas" agora).
const GEAR_COST0 = 2000;          // custo do 1º nível (1 peça)
const GEAR_RAMP = 2 ** (1 / 10);  // dobra a cada 10 níveis (~1.0718)
const PIECES = 6;
const GEAR_CAP = 400; // cap de nível do Faded (decisão Willian; jogador alcança ~278)
// afixos por nível (agregados das 6 peças):
const G_DMG_FLAT = 50;            // Weapon: +50 dano flat/nv
const G_DMG_PCT = 0.01 + 0.01;    // Weapon 1% + Amuleto 1% = dano%/nv
const G_HP_FLAT = 300 + 300;      // Elmo 300 + Manto 300 = HP flat/nv
const G_HP_PCT = 0.01;            // Elmo: HP%/nv
const G_CRIT = 0.001;             // Luvas: +0.1% crit chance/nv
const G_CDMG_PCT = 0.02;          // Manto: +2% crit damage/nv (base 0%)
let   G_APS = 0.0016;             // Amuleto: atk speed/nv (calibrado p/ APS ~1,5 no fim)
const G_GOLD_PCT = 0.02 + 0.02;   // Luvas 2% + Anel 2% = gold%/nv
const G_XP_PCT = 0.01;            // Anel: +1% XP/nv
// ── Malha do Map 1 ──
// Wall ≈ 32,5 bi (número orgânico, não-redondo): hpHi × 15. 1º mob 2.000 (2 hits).
const N = 9, hpLo = 2000, hpHi = 2169085656, BOSSMULT = 15; // Wall = 32.536.284.840
const mobHpOf = (s) => hpLo * (hpHi / hpLo) ** ((s - 1) / (N - 1));
const bossHp = () => mobHpOf(N) * BOSSMULT;
// DANO dos mobs = CURVA PRÓPRIA (desacoplada da vida — senão o dano dispara 16M× e o HP só ~150×).
// dmgLo early baixo (passeio seguro) → dmgHi calibrado p/ a Wall ser tensa-mas-vencível (perigo "C").
let DMG_LO = 80, DMG_HI = 7e5;
const BOSSDMG = 3;
const dmgOf = (s) => DMG_LO * (DMG_HI / DMG_LO) ** ((s - 1) / (N - 1));
// ── Convergence ──
const CONV_DMG = 0.15, CONV_LUM = 0.03; // por convergência (aditivo; XP = 0, vem do Gear)
let HEADSTART_FRAC = 0.5; // head-start: Convergence reseta p/ FRAC × nível atual (não nível 1)
// ── Despertar (sub-área 7) ──
const AWAKEN_SUB = 7, AWAKEN_MULT = 2, AWAKEN_APS = 0.3, AWAKEN_CRIT = 0.05, AWAKEN_CDMG = 2.0; // crit dmg base 0% +200%

const fmtT = (s) => s == null ? '  —  ' : s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s / 60).toFixed(1)}min` : s < 86400 * 2 ? `${(s / 3600).toFixed(1)}h` : `${(s / 86400).toFixed(2)}d`;
const REGEN_S = 0.01, REGEN_KILL = 0.00; // só 1%/s (regen-por-kill removido → vira passiva futura)
const PACK_OF = (s) => s <= 7 ? 2 : 3;    // 2 mobs até sub7, 3 nas sub8/9

// Luta UMA onda cheia, tick a tick. Só HP (sem defesa). Retorna {vive, minFrac, t}.
// snap = {maxHp, hit, aps, cc, cm} ; mob = {hp, dmg} ; boss = {hp, dmg}|null
function fightWave(snap, pack, mob, boss) {
  const eff = snap.hit * (1 + snap.cc * (snap.cm - 1)); // golpe esperado (com crit médio)
  let hp = snap.maxHp, trash = pack, bossHp = boss ? boss.hp : 0, atkCD = 0, t = 0, minFrac = 1;
  const dt = 0.02;
  while (t < 600) {
    const incoming = trash * mob.dmg + (bossHp > 0 ? boss.dmg : 0);
    hp -= incoming * dt;
    hp = Math.min(snap.maxHp, hp + snap.maxHp * REGEN_S * dt);
    if (hp <= 0) return { vive: false, minFrac: 0, t };
    minFrac = Math.min(minFrac, hp / snap.maxHp);
    atkCD -= dt;
    while (atkCD <= 0 && (trash > 0 || bossHp > 0)) {
      atkCD += 1 / snap.aps;
      if (trash > 0) { trash--; hp = Math.min(snap.maxHp, hp + snap.maxHp * REGEN_KILL); } // 1 kill/ataque
      else { bossHp -= eff; if (bossHp <= 0) hp = Math.min(snap.maxHp, hp + snap.maxHp * REGEN_KILL); }
    }
    if (trash <= 0 && bossHp <= 0) return { vive: true, minFrac, t };
    t += dt;
  }
  return { vive: true, minFrac, t };
}

function pace(curveDiv, curveExp, gates, convGrowth, convBase = gates[1]) {
  // estado persistente (sobrevive à Convergence)
  let conv = 0, unlocked = 1, t = 0, awakened = false, convGate = convBase;
  const events = [];
  // estado da run (reseta na Convergence — exceto o Gear)
  let xpRun = 0, level = 1, gearLvl = 0, lumens = 0;
  let convCount = 0;
  const M = { lvl2: null, sub2: null, conv1: null, awaken: null, wall: null };

  const convDmg = () => 1 + CONV_DMG * conv;
  const convLum = () => 1 + CONV_LUM * conv;
  const awMult = () => awakened ? AWAKEN_MULT : 1;
  const aps = () => Math.min(APSCAP, APS0 + gearLvl * G_APS + (awakened ? AWAKEN_APS : 0));
  const critChance = () => Math.min(1, gearLvl * G_CRIT + (awakened ? AWAKEN_CRIT : 0));
  const critMult = () => 1 + gearLvl * G_CDMG_PCT + (awakened ? AWAKEN_CDMG : 0); // base 0% bônus
  const dmgHit = () => (BASE + level * DMG_LVL + gearLvl * G_DMG_FLAT) * (1 + gearLvl * G_DMG_PCT) * convDmg() * awMult();
  const dps = () => dmgHit() * aps() * (1 + critChance() * (critMult() - 1));
  const maxHp = () => (BASE_HP + level * HP_LVL + gearLvl * G_HP_FLAT) * (1 + gearLvl * G_HP_PCT) * convDmg() * awMult();
  const goldMult = () => (1 + gearLvl * G_GOLD_PCT) * convLum();
  const xpMult = () => 1 + gearLvl * G_XP_PCT;
  const stepCost = () => PIECES * GEAR_COST0 * GEAR_RAMP ** gearLvl; // subir as 6 de L→L+1
  // pior momento (menor HP) por área, p/ a checagem de sobrevivência
  const worst = {}; const snap = () => ({ maxHp: maxHp(), hit: dmgHit(), aps: aps(), cc: critChance(), cm: critMult(), level, gearLvl, conv });

  let guard = 0;
  while (guard++ < 5e7) {
    const mobHp = mobHpOf(unlocked);
    const d = dps();
    const tpk = Math.max(1 / aps(), mobHp / d);
    t += tpk;
    // registra o pior momento (menor maxHp) na área atual
    const mh = maxHp();
    if (!worst[unlocked] || mh < worst[unlocked].maxHp) worst[unlocked] = snap();
    lumens += mobHp * GOLD * goldMult();
    xpRun += mobHp * XP_RATIO * xpMult();
    level = Math.max(1, Math.floor((xpRun / curveDiv) ** curveExp));
    if (M.lvl2 === null && level >= 2) M.lvl2 = t;
    while (unlocked < N && level >= gates[unlocked]) {
      unlocked++;
      if (unlocked === 2 && M.sub2 === null) M.sub2 = t;
      if (unlocked === AWAKEN_SUB) { awakened = true; if (M.awaken === null) M.awaken = t; }
      if (unlocked === N) worst[N] = snap(); // captura o estado na ENTRADA da Wall
    }
    // compra gulosa de Gear (as 6 peças juntas; PERSISTE pela Convergence)
    let b = 0; while (gearLvl < GEAR_CAP && lumens >= stepCost() && b++ < 5000) { lumens -= stepCost(); gearLvl++; }
    // Convergence: reseta SÓ o nível da run (Gear persiste)
    if (level >= convGate && unlocked >= 2) {
      conv++; convCount++; events.push({ area: unlocked, lvl: level });
      if (M.conv1 === null) M.conv1 = t;
      convGate = Math.max(convGate * convGrowth, level + 1);
      level = Math.max(1, Math.floor(HEADSTART_FRAC * level)); // head-start (não reseta pro 1)
      xpRun = curveDiv * level ** (1 / curveExp); lumens = 0;
    }
    if (unlocked === N && d >= bossHp() / 30) { M.wall = t; worst.wallClear = snap(); break; }
    if (t > 86400 * 10) break;
  }
  return { t, conv: convCount, unlocked, awakened, gearLvl, M, events, worst };
}

// ── calibração: varrer curveDiv / curveExp / gates ──
// gates[0]=sub1(=1), depois níveis de unlock crescentes.
const gates = [1, 30, 70, 130, 220, 350, 520, 740, 1000];
const XP1 = hpLo * XP_RATIO; // xp do 1º mob
// curveDiv fixado p/ level-2 acontecer em ~3 kills (≈8s): xpRun(lvl2)=3×XP1
const fitDiv = (curveExp) => (3 * XP1) / (2 ** (1 / curveExp));
console.log('gates de unlock (sub1..sub9):', gates.join(' '));
console.log('curveExp | curveDiv | t→lvl2 | t→sub2(1ª conv) | t→despertar | tempo Map1 | nº conv | gearLvl fim');
// ✅ ESCOLHIDO (Willian, 2026-06-17): curveExp=0.455 / curveDiv≈262 → Map 1 ~1,3 dias
// (com Gear persistente, packs 2×7+3+3, boss junto na sub9, sem cap de nível de mob).
// Convergence: gatilho 1º = LV 40 (decisão Willian); cresce ×1,3 a cada conv.
const CONV_BASE = 40, CONV_GROWTH = 1.3;
// ✅ ESCOLHIDO (Willian): com Gear completo (6 peças, 2 afixos flat+%, 2 camadas),
// curveExp=0.41 / curveDiv≈221 → Map 1 ~1,2 dias. Gear termina ~nível 184.
// ✅ ESCOLHIDO: Wall 32,5bi · aceitar ~24 conv · apsCap 3 · gear cap 400.
G_APS = 0.0065; // amuleto: APS chega a ~3 no fim do Map 1 (gear ~280)
// ✅ ESCOLHIDO: head-start 0.5 → re-fit curveExp 0,38 p/ ~30h (1,3 dia perfeito)
const curveExp = 0.38, curveDiv = Math.round(fitDiv(curveExp));
{
  const r = pace(curveDiv, curveExp, gates, CONV_GROWTH, CONV_BASE);
  const m = r.M;
  const endAps = Math.min(APSCAP, APS0 + r.gearLvl * G_APS + 0.3);
  console.log(`${String(curveExp).padStart(8)} | ${String(curveDiv).padStart(8)} | ${fmtT(m.lvl2).padStart(6)} | ${fmtT(m.sub2 ?? m.conv1).padStart(15)} | ${fmtT(m.awaken).padStart(11)} | ${fmtT(r.t).padStart(10)} | ${String(r.conv).padStart(6)} | ${String(r.gearLvl).padStart(8)} | APSfim ${endAps.toFixed(2)}`);
}

const fmt = (n) => n >= 1e9 ? (n / 1e9).toFixed(2) + 'bi' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : Math.round(n).toLocaleString('pt-BR');

// ── CALIBRAR dmgHi: a Wall (poder pleno) tem que ser TENSA-mas-vencível (perigo "C") ──
// A linha-chave é "Wall@clear": estado no momento em que o jogador CONSEGUE vencer a Wall.
console.log('\n=== calibração do dano (Wall poder pleno) — varrer dmgHi ===');
console.log('dmgHi   | HP no clear | boss dmg/s | vive a Wall? | HP mín. na luta');
for (const dh of [3e5, 5e5, 7e5, 9e5, 1.2e6]) {
  DMG_HI = dh;
  const r = pace(curveDiv, curveExp, gates, CONV_GROWTH, CONV_BASE);
  const w = r.worst.wallClear;
  const boss = { hp: bossHp(), dmg: dmgOf(N) * BOSSDMG };
  const res = fightWave(w, PACK_OF(N), { hp: mobHpOf(N), dmg: dmgOf(N) }, boss);
  console.log(`${dh.toExponential(0).padStart(7)} | ${fmt(w.maxHp).padStart(11)} | ${fmt(boss.dmg).padStart(10)} | ${(res.vive ? ' SIM ' : '☠ MORRE').padStart(12)} | ${(res.vive ? (res.minFrac * 100).toFixed(0) + '%' : '0%').padStart(15)}`);
}
DMG_HI = 1.2e6; // ✅ travado: Wall tensa-mas-vencível (~30% no poder pleno)

// ── SOBREVIVÊNCIA por área — pior momento (nível 1 pós-Convergence) ──
console.log('\n=== sobrevivência (só HP) — pior momento por área (perigo "C") ===');
console.log('área | HP pior momento | dano onda/s | vive? | HP mín | nota');
{
  const r = pace(curveDiv, curveExp, gates, CONV_GROWTH, CONV_BASE);
  for (let s = 1; s <= N; s++) {
    const w = r.worst[s]; if (!w) continue;
    const mob = { hp: mobHpOf(s), dmg: dmgOf(s) };
    const boss = s === N ? { hp: bossHp(), dmg: dmgOf(N) * BOSSDMG } : null;
    const pack = PACK_OF(s);
    const res = fightWave(w, pack, mob, boss);
    const wave = pack * mob.dmg + (boss ? boss.dmg : 0);
    const nota = s === N ? `Wall` : `lvl ${w.level}, gear ${w.gearLvl}, conv ${w.conv}`;
    console.log(`${String(s).padStart(4)} | ${fmt(w.maxHp).padStart(15)} | ${fmt(wave).padStart(11)} | ${(res.vive ? ' SIM ' : '☠ MORRE').padStart(7)} | ${(res.vive ? (res.minFrac * 100).toFixed(0) + '%' : '0%').padStart(6)} | ${nota}`);
  }
}

// ── Estudo do GATILHO da Convergence (Willian vai escolher) ──
console.log('\n=== gatilho da Convergence (1º LV) → quantas conv e em que áreas ===');
console.log('gatilho | nº conv | áreas onde dispara (a cada conv) | tempo Map1');
for (const convBase of [30, 50, 80, 120, 180, 250]) {
  const r = pace(curveDiv, curveExp, gates, 1.3, convBase);
  const areas = r.events.map(e => e.area).join(',');
  console.log(`${String(convBase).padStart(7)} | ${String(r.conv).padStart(7)} | ${areas.padEnd(32)} | ${fmtT(r.t)}`);
}
```

### `tools/sim/map1_cap_conv.mjs`

```javascript
// MAP 1 — testar: (a) ~5 hits/mob, (b) cap de nível por raridade (700, estilo Gaiadon)
// vs SEM cap, (c) como o Convergence (+15% aditivo) entra. Uso: node tools/sim/map1_cap_conv.mjs
//
// Estrutura nossa: raridade FIXA (Faded) o Map 1 inteiro — diferente do Gaiadon, que sobe
// raridade dentro da progressão (por isso o cap 700 funciona lá: você rarity-up e segue).

const BASE = 7, APS = 0.90, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15;
const N = 5, hpLo = 10, hpHi = 1e9;
const FLAT = 50, PCT = 0.02, COST_BASE = 120, KILLGATE = 100, GATE_DIV = 6; // boss em 6s → frontier ~5 hits

// roda o Map 1 com um cap de nível de arma (Infinity = sem cap) e convMult fixo
function run(cap, convMult) {
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0 };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, cap) * FLAT)
    * (1 + Math.min(p.wl, cap) * PCT) * convMult;
  const cost = () => COST_BASE * (p.wl + 1);
  const rows = [];
  let total = 0, walled = false;
  for (let s = 1; s <= N; s++) {
    const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
    const bossHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
    const hitsEntry = Math.max(1, mobHp / dmgHit());
    let kills = 0, subTime = 0, guard = 0, broke = false;
    while (guard++ < 5e6) {
      const dps = dmgHit() * APS;
      const tpk = Math.max(1 / APS, mobHp / dps);
      const dt = Math.max(tpk, 0.5);
      const k = dt / tpk;
      kills += k; subTime += dt; total += dt;
      p.lumens += k * mobHp * GOLD;
      p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      let b = 0;
      while (p.wl < cap && p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      if (kills >= KILLGATE && dps >= bossHp / GATE_DIV) { broke = true; break; }
      if (subTime > 20 * 86400) { walled = true; break; } // 20d sem limpar = PAREDE
    }
    rows.push({ s, mobHp, hitsEntry, subTime, wl: Math.min(p.wl, cap), level: p.level, cleared: broke });
    if (!broke) break;
  }
  return { rows, total, walled, finalWl: p.wl };
}

const fmtT = (s) => s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s/60).toFixed(1)}min`
  : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(1)}d`;

function report(title, r) {
  console.log(`\n### ${title}`);
  console.log(' sub | mob HP   | hits/mob | tempo sub  | arma lvl | nível    | limpou?');
  console.log(' ' + '-'.repeat(70));
  for (const x of r.rows) {
    console.log(` ${x.s}   | ${x.mobHp.toExponential(1)} | ${x.hitsEntry.toFixed(1).padStart(8)} | ${fmtT(x.subTime).padStart(10)} | ${x.wl.toExponential(2).padStart(8)} | ${x.level.toString().padStart(8)} | ${x.cleared ? 'sim' : 'NÃO (parede)'}`);
  }
  console.log(` TOTAL: ${r.walled ? 'NÃO LIMPA (parede)' : fmtT(r.total)}`);
}

console.log('='.repeat(74));
console.log('MAP 1 — ~5 hits/mob · SEM cap vs COM cap 700 · convMult variando');
console.log('='.repeat(74));

report('SEM cap · conv 0 (×1)', run(Infinity, 1));
report('COM cap 700 · conv 0 (×1)', run(700, 1));
report('COM cap 700 · 10 convergências (×2.5)', run(700, 1 + 0.15 * 10));
report('COM cap 700 · 100 convergências (×16)', run(700, 1 + 0.15 * 100));

console.log('\n' + '='.repeat(74));
console.log('CONVERGENCE — quanto +15% aditivo realmente move (e o custo: reseta gear+nível)');
console.log('='.repeat(74));
for (const c of [1, 5, 10, 50, 100, 1000]) {
  const m = 1 + 0.15 * c;
  console.log(`  ${String(c).padStart(4)} convergências → convMult ×${m.toFixed(2)}  (= ${Math.log10(m).toFixed(2)} décadas)`);
}
```

### `tools/sim/map1_conv.mjs`

```javascript
// MAP 1 Config B FINAL — convergence reseta SÓ o nível (mantém o gear), +15%/converge.
// Mecânica (decisão Willian 14/jun): converge quando nível ≥ gate; convMult += 0.15;
// gate ×= growth; xpRun=0 (nível→1); GEAR PERMANECE. Sem strand. Uso: node tools/sim/map1_conv.mjs

const BASE = 7, APS = 0.90, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15;
const N = 5, hpLo = 10, FLAT = 50, PCT = 0.02, KILLGATE = 100, GATE_DIV = 13;
const CAP = 1000; // ← cap do Faded = 1000 (decisão Willian)
const CONV_PER = 0.15, GATE_BASE = 40;

function run({ useConv, hpHi, costBase, gateGrowth }) {
  const COST_BASE = costBase, GATE_GROWTH = gateGrowth;
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0, convMult: 1, convs: 0, gate: GATE_BASE };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, CAP) * FLAT) * (1 + Math.min(p.wl, CAP) * PCT) * p.convMult;
  const cost = () => COST_BASE * (p.wl + 1);
  const rows = [];
  let total = 0, walled = false;
  for (let s = 1; s <= N; s++) {
    const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
    const bossHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
    const hitsEntry = Math.max(1, mobHp / dmgHit());
    let kills = 0, subTime = 0, guard = 0, broke = false;
    while (guard++ < 5e6) {
      const dps = dmgHit() * APS;
      const tpk = Math.max(1 / APS, mobHp / dps);
      const dt = Math.max(tpk, 0.5); const k = dt / tpk;
      kills += k; subTime += dt; total += dt;
      p.lumens += k * mobHp * GOLD; p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      // convergence: reseta SÓ o nível, mantém o gear
      while (useConv && p.level >= p.gate) {
        p.convMult += CONV_PER; p.convs++; p.gate *= GATE_GROWTH; p.xpRun = 0; p.level = 1;
      }
      let b = 0;
      while (p.wl < CAP && p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      if (kills >= KILLGATE && dmgHit() * APS >= bossHp / GATE_DIV) { broke = true; break; }
      if (subTime > 30 * 86400) { walled = true; break; }
    }
    rows.push({ s, subTime, wl: p.wl, convs: p.convs, convMult: p.convMult, hitsEntry });
    if (!broke) { walled = true; break; }
  }
  return { total, rows, convs: p.convs, convMult: p.convMult, walled };
}

const fmtT = (s) => s < 5400 ? `${(s/60).toFixed(1)}min` : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(1)}d`;

const hpHi = 1e6;
console.log(`CAP Faded ${CAP} · HP teto ${hpHi.toExponential(0)} · alvo: SEM conv 12h, COM conv 6h\n`);
console.log('PASSO 2 — custo 900 (SEM conv ≈12.4h) · gate growth p/ COM conv ≈ 6h:');
console.log('  growth | COM conv (convs, ×mult)');
console.log('  ' + '-'.repeat(38));
for (const gateGrowth of [1.25, 1.35, 1.45, 1.6, 1.8]) {
  const b = run({ useConv: true, hpHi, costBase: 900, gateGrowth });
  console.log(`  ${String(gateGrowth).padStart(6)} | ${b.walled ? 'PAREDE' : `${fmtT(b.total)} (${b.convs}c, ×${b.convMult.toFixed(1)})`}`);
}
// config escolhida
const COST12 = 900, GROWTH = 1.25;
console.log(`\nDETALHE FINAL — custo ${COST12}, gate growth ${GROWTH}, cap ${CAP}:`);
for (const useConv of [false, true]) {
  const r = run({ useConv, hpHi, costBase: COST12, gateGrowth: GROWTH });
  console.log(`\n  ${useConv ? 'COM' : 'SEM'} conv — TOTAL ${r.walled ? 'PAREDE' : fmtT(r.total)} · ${r.convs} convs · ×${r.convMult.toFixed(2)}`);
  console.log('   sub | hits/mob | tempo sub  | arma lvl | convs | convMult');
  for (const x of r.rows)
    console.log(`   ${x.s}   | ${x.hitsEntry.toFixed(1).padStart(8)} | ${fmtT(x.subTime).padStart(10)} | ${x.wl.toExponential(2).padStart(8)} | ${String(x.convs).padStart(5)} | ×${x.convMult.toFixed(2)}`);
}
```

### `tools/sim/map1_cost.mjs`

```javascript
// MAP 1 — achar a curva de CUSTO do gear que dá ~6-8h ativas. APS REAL (0.90).
// Modelo limpo: Base × Gear(2 afixos, Faded) × Conv(0). Mob HP teto = 1e6 (atual).
// custo(L) = costBase × (L+1) × costRamp^L  (ramp=1 → linear). Uso: node tools/sim/map1_cost.mjs

const BASE = 7, APS = 0.90, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15;

function clear(N, hpHi, { flat = 50, pct = 0.02, costBase = 5, costRamp = 1, killGate = 100 } = {}) {
  const hpLo = 10;
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0 };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + p.wl * flat) * (1 + p.wl * pct);
  const cost = () => costBase * (p.wl + 1) * costRamp ** p.wl;
  let total = 0, maxWl = 0;
  for (let s = 1; s <= N; s++) {
    const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
    const bossHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
    let kills = 0, subTime = 0, guard = 0;
    while (guard++ < 5e6) {
      const dps = dmgHit() * APS;
      const tpk = Math.max(1 / APS, mobHp / dps);
      const dt = Math.max(tpk, 0.5);
      const k = dt / tpk;
      kills += k; subTime += dt; total += dt;
      p.lumens += k * mobHp * GOLD;
      p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      let b = 0;
      while (p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      if (kills >= killGate && dmgHit() * APS >= bossHp / 10) break;
      if (subTime > 200 * 86400) return { total: Infinity };
    }
    maxWl = p.wl;
  }
  return { total, wl: maxWl };
}

const fmtT = (s) => !isFinite(s) ? 'FALHOU' : s < 5400 ? `${(s/60).toFixed(1)}min`
  : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(2)}d`;

console.log('='.repeat(78));
console.log('MAP 1 (5 subs, HP teto 1e9, APS 0.90) — re-tunar CUSTO p/ casar c/ o climb de 1e9');
console.log('='.repeat(78));
console.log(' costBase | costRamp  | tempo M1   | arma lvl fim');
console.log(' ' + '-'.repeat(52));
const tests = [
  [5, 1], [20, 1], [50, 1], [100, 1], [200, 1],
  [5, 1.0005], [5, 1.001], [5, 1.0015], [5, 1.002], [5, 1.003], [5, 1.004],
];
for (const [cb, cr] of tests) {
  const r = clear(5, 1e9, { costBase: cb, costRamp: cr });
  console.log(` ${String(cb).padStart(8)} | ${String(cr).padStart(8)} | ${fmtT(r.total).padStart(10)} | ${r.wl ? r.wl.toExponential(2) : '-'}`);
}
```

### `tools/sim/map1_pace.mjs`

```javascript
// MAP 1 — pacing do GATE POR NÍVEL (sem guardião). Farma a maior área liberada,
// sobe de nível, libera as 9 (área n exige level = lvlLo×r^(n-1)), e bate o boss.
// Tuna curveDiv pra bater ~8h. Uso: node tools/sim/map1_pace.mjs
const BASE = 3500, DMG_PER_LVL = 5000, GOLD = 0.10, XP = 0.08, EXP = 0.4, GOLD_PER_LVL = 1500, LUM_FLOOR = 30000;
const N = 9, hpLo = 5000, hpHi = 5e8, BOSSMULT = 15, lvlLo = 1, lvlHi = 1000, KILLGATE = 100;
const CAP = 750, COSTBASE = 420000, APS0 = 0.90, APS_FLAT = 2e-4, CRIT_PER = 3e-4, DMG_FLAT = 30000, PCT = 0.02, APSCAP = 5;
const R = (lvlHi / lvlLo) ** (1 / N);
const unlockLvl = (n) => n <= 1 ? 0 : Math.round(lvlLo * R ** (n - 1)); // = subareaLevelRange(.lo)
const mobHpOf = (s) => hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
const bossHp = () => hpLo * (hpHi / hpLo) ** 1 * BOSSMULT;

function pace(DIV, COSTX = 1) {
  const p = { xpRun: 0, level: 1, wl: 0, lumens: 0, unlocked: 1, t: 0, kills9: 0 };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, CAP) * DMG_FLAT) * (1 + Math.min(p.wl, CAP) * PCT);
  const aps = () => Math.min(APSCAP, (APS0 + Math.min(p.wl, CAP) * APS_FLAT) * (1 + 0.3 * Math.log10(1 + Math.min(p.wl, CAP) * PCT)));
  const crit = () => Math.min(1, Math.min(p.wl, CAP) * CRIT_PER);
  const cost = () => COSTBASE * COSTX * (p.wl + 1);
  let guard = 0;
  while (guard++ < 5e7) {
    const area = p.unlocked;
    const onBoss = area === N && p.kills9 >= KILLGATE;
    const mobHp = onBoss ? bossHp() : mobHpOf(area);
    const dps = dmgHit() * aps() * (1 + crit());
    const tpk = Math.max(1 / aps(), mobHp / dps);
    const dt = Math.max(tpk, 0.5), k = dt / tpk;
    p.t += dt;
    p.lumens += k * (mobHpOf(area) * GOLD + LUM_FLOOR + p.level * GOLD_PER_LVL);
    p.xpRun += k * mobHpOf(area) * XP;
    p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
    if (area === N) p.kills9 += k;
    while (p.unlocked < N && p.level >= unlockLvl(p.unlocked + 1)) p.unlocked++;
    let b = 0; while (p.wl < CAP && p.lumens >= cost() && b++ < 20000) { p.lumens -= cost(); p.wl++; }
    if (onBoss && dps >= bossHp() / 13) break; // boss derrotável → Map 1 limpo
    if (p.t > 60 * 86400) break;
  }
  return { t: p.t, lvl: p.level, wl: p.wl, unlocked: p.unlocked };
}

const fmtT = (s) => s < 5400 ? `${(s / 60).toFixed(1)}min` : `${(s / 3600).toFixed(2)}h`;
console.log('unlock levels:', Array.from({ length: N }, (_, i) => unlockLvl(i + 1)).join(' '));
console.log('curveDiv | cost× | tempo Map1 | level fim | gear wl');
for (const COSTX of [1]) {
  for (const DIV of [11000]) {
    const r = pace(DIV, COSTX);
    console.log(`${String(DIV).padStart(8)} | ${String(COSTX).padStart(4)} | ${fmtT(r.t).padStart(10)} | ${String(r.lvl).padStart(8)} | ${r.wl}`);
  }
}
```

### `tools/sim/map1_report.mjs`

```javascript
// RELATÓRIO COMPLETO DO MAP 1 — todos os stats: player, mobs (HP/dano) por área 1-9,
// gear (afixos + custos), níveis de unlock, Convergence e Despertar. Os mobs são
// RELATIVOS ao player, então tiramos um SNAPSHOT de cada área no momento em que o
// jogador (sensato) a alcança numa run real do combate. Uso: node tools/sim/map1_report.mjs
import { createInitialState } from '../../src/core/state.js';
import { combatTick, enterSubarea, resetPack, bossActive } from '../../src/game/combat.js';
import { currentAPS, dps, playerHpMax, runLevel, damagePerHit, critChance, critDamageMult, playerDefesa } from '../../src/game/stats.js';
import { buyLevel, levelCost, atLevelCap, canRarityUp, doRarityUp, levelCapFor,
  critOf, critDmgOf, gildedOf, activeSecondaries, gearGildedChance } from '../../src/game/gear.js';
import { canConverge, doConverge, convGateLevel, convergeProgress } from '../../src/game/convergence.js';
import { canDespertar, doDespertar } from '../../src/game/ascension.js';
import { GEAR, GEAR_RARITY_LABELS, ENEMY, COMBAT, LEVEL, CONVERGENCE, MAPS, DESPERTAR, DESPERTAR_REQ, GILDED, CRAFT } from '../../src/data/constants.js';
import { getCurrentMap } from '../../src/game/enemies.js';
import { formatNumber as f } from '../../src/core/format.js';

const DT = 0.1, MAP = MAPS[0];
const pct = (x) => `${(x * 100).toFixed(1)}%`;
const gearAvg = (s) => GEAR.pieces.reduce((a, d) => a + s.gear[d.key].level, 0) / 6;
const minRar = (s) => Math.min(...GEAR.pieces.map((d) => s.gear[d.key].rarity));

// jogador sensato (igual game_harness): farma a área mais funda sustentável, compra guloso, converge/desperta
function buyGearGreedy(s){ let g=0; while(g++<5000){ let best=null,bc=Infinity; for(const d of GEAR.pieces){const p=s.gear[d.key]; if(atLevelCap(p,s))continue; const c=levelCost(p); if(c<bc){bc=c;best=d.key;}} if(!best||s.lumens<bc)break; if(!buyLevel(s,best))break; } }
function rarityUp(s){ let d=true; while(d){d=false; for(const def of GEAR.pieces) if(canRarityUp(s,def.key)){doRarityUp(s,def.key);d=true;}} }
function bestArea(s){ const map=getCurrentMap(s); const d=dps(s),hp=playerHpMax(s),lvl=runLevel(s); const bD=COMBAT.baseDmg+lvl*LEVEL.dmgPerLevel;
  for(let a=s.unlockedSubarea;a>=1;a--){ const mhp=bD*ENEMY.hitsToKill*ENEMY.areaHp[a-1]; const sz=map.packSizes[a-1]; const t=(sz*mhp)/d; const pk=hp*ENEMY.dmgFrac*ENEMY.areaDmg[a-1]; const taken=pk*(t/2)-hp*0.01*(t/2); if(taken<hp*0.8)return a; } return 1; }

const snap = {}; // área → snapshot
const s = createInitialState();
s.player.hp = playerHpMax(s); resetPack(s);
let t = 0, reTick = 0;
while (t < 60 * 3600) {
  if (reTick-- <= 0) { const tg = bestArea(s); if (tg !== s.subarea) enterSubarea(s, tg); reTick = 30; }
  combatTick(s, DT); t += DT;
  buyGearGreedy(s); rarityUp(s);
  if (canConverge(s)) doConverge(s);
  if (canDespertar(s)) doDespertar(s);
  // snapshot da área atual (1ª vez que farma, com mob vivo)
  const a = s.subarea, mob = s.enemies.find((m) => !m.isBoss && m.hp > 0);
  if (mob && !snap[a]) {
    const wave = s.enemies.reduce((x, m) => x + (m.hp > 0 ? m.dmg : 0), 0);
    snap[a] = { t, mobHp: mob.hpMax, mobLvl: mob.level, waveDmg: wave, pack: MAP.packSizes[a-1],
      pl: runLevel(s), dmg: damagePerHit(s), hp: playerHpMax(s), aps: currentAPS(s), dps: dps(s),
      gear: gearAvg(s), rar: minRar(s), conv: s.convergences, crit: critChance(s), critD: critDamageMult(s),
      gild: gearGildedChance(s), desp: s.despertares || 0 };
  }
  // Wall (boss área 9)
  if (a === 9 && bossActive(s) && !snap.wall) {
    const b = s.enemies.find((m) => m.isBoss);
    snap.wall = { mobHp: b.hpMax, dmg: b.dmg, pl: runLevel(s), pdmg: damagePerHit(s), php: playerHpMax(s), dps: dps(s), conv: s.convergences, desp: s.despertares||0 };
  }
  if (s.bossDefeated[8]) break;
}

const L = (...a) => console.log(...a);
L('══════════════════════════════════════════════════════════════════');
L('  RELATÓRIO COMPLETO — MAP 1 (The Dreaming Wood)  ·  snapshot de uma run real');
L('══════════════════════════════════════════════════════════════════');

L('\n### 1. PLAYER — base ###');
L(`  Dano base ........ ${f(COMBAT.baseDmg)}   (+${f(LEVEL.dmgPerLevel)}/nível)`);
L(`  HP base .......... ${f(COMBAT.playerBaseHp)}   (+${f(LEVEL.hpPerLevel)}/nível)`);
L(`  Atk Speed base ... ${COMBAT.baseAPS}  (teto ${COMBAT.apsCap})`);
L(`  Crit rate base ... ${pct(0)}   ·  Crit damage base ... ×1 (crit = dano normal até ganhar crit dmg)`);
L(`  Regen ............ ${pct(COMBAT.regenPerSec)}/s do HP máx   ·  morte: recua 1 área, respawn ${COMBAT.deathRespawnSeconds}s`);

L('\n### 2. ÁREAS 1-9 — mobs (relativos ao player) + estado do player ao alcançar ###');
L('  área | unlock LV | mob HP    | dano onda/s | mobs | mob LV || player LV | dano/hit | HP máx   | APS  | DPS     | gear(rar) | conv');
L('  -----+-----------+-----------+-------------+------+--------++----------+----------+----------+------+---------+-----------+-----');
for (let a = 1; a <= 9; a++) {
  const u = MAP.unlockLevels[a-1], k = snap[a];
  if (!k) { L(`   ${a}   | ${String(u).padStart(7)}   |    (não farmada no snapshot)`); continue; }
  L(`   ${a}   | ${String(u).padStart(7)}   | ${f(k.mobHp).padStart(8)}  | ${f(k.waveDmg).padStart(10)}  |  ${k.pack}   | ${String(k.mobLvl).padStart(5)}  || ${String(k.pl).padStart(7)}  | ${f(k.dmg).padStart(7)}  | ${f(k.hp).padStart(7)}  | ${k.aps.toFixed(2)} | ${f(k.dps).padStart(6)}  | ${String(Math.round(k.gear)).padStart(4)} ${GEAR_RARITY_LABELS[k.rar].slice(0,4)} | ${k.conv}`);
}
if (snap.wall) { const w = snap.wall; L(`  WALL (boss área 9): HP ${f(w.mobHp)} · dano/s ${f(w.dmg)} || no 1º encontro: player LV ${w.pl} · dano/hit ${f(w.pdmg)} · HP ${f(w.php)} · DPS ${f(w.dps)} · conv ${w.conv} · despertares ${w.desp}`); }
L(`  (fatores por área — areaHp ${JSON.stringify(ENEMY.areaHp)}, areaDmg ${JSON.stringify(ENEMY.areaDmg)}, areaReward ${JSON.stringify(ENEMY.areaReward)})`);
L(`  mob HP = (baseDmg + LV×${LEVEL.dmgPerLevel}) × ${ENEMY.hitsToKill} hits × areaHp[área] · dano onda = HP_player × ${ENEMY.dmgFrac} × areaDmg[área] · Wall = mob × ${ENEMY.bossHpMult} HP, × ${ENEMY.bossDmgMult} dano`);

L('\n### 3. GEAR — 6 peças, afixos e custos ###');
L(`  Raridades no Map 1: Comum (Faded) → Incomum (Kindled). Cap de nível: Comum ${GEAR.levelCap[0]} · Incomum ${GEAR.levelCap[1]}.`);
L(`  Custo de 1 nível = ${f(GEAR.levelCostBase)} × ${GEAR.costRamp}^nível × (Comum ×${GEAR.costMult[0]} / Incomum ×${GEAR.costMult[1]})`);
L('  peça        | slot     | afixo primário     | afixos secundários (raridade destrava em ordem)');
L('  ------------+----------+--------------------+-----------------------------------------------');
const AFN = { dmg:'dano', hp:'HP', gilded:'gilded chance', crit:'crit rate', critDmg:'crit dmg', aps:'atk speed', regen:'regen', bossDmg:'dano boss', lumens:'Gold', xp:'XP', materiais:'materiais', erosao:'erosão' };
for (const d of GEAR.pieces) L(`  ${d.name.padEnd(24).slice(0,24)} | ${d.slot.padEnd(8)} | ${AFN[d.primary].padEnd(18)} | ${d.secondary.map(x=>AFN[x]).join(', ')}`);
L('\n  Valor agregado das 6 peças por NÍVEL (no fim ~170) e custo de 1 nível:');
L('  nível | custo Comum | custo Incomum');
L('  ------+-------------+--------------');
for (const lv of [1, 50, 100, 170, 300, 500, 1000, 1400]) {
  const cc = lv <= GEAR.levelCap[0] ? f(levelCost({level:lv,rarity:0})) : '— cap';
  L(`  ${String(lv).padStart(4)}  | ${cc.padStart(10)}  | ${f(levelCost({level:lv,rarity:1})).padStart(11)}`);
}
L(`  Subir raridade Comum→Incomum: ${CRAFT.rarityUpMaterial} materiais T1 por peça (lockstep) · drop ${pct(CRAFT.dropChance)}/mob + chunk de boss.`);

L('\n### 4. NÍVEL & XP ###');
L(`  nível = (xpRun / ${f(LEVEL.curveDiv)})^${LEVEL.curveExp}  ·  reseta na Convergence (head-start ${pct(CONVERGENCE.headstartFrac)})`);
L(`  cada nível: +${f(LEVEL.dmgPerLevel)} dano e +${f(LEVEL.hpPerLevel)} HP (flat)`);

L('\n### 5. CONVERGENCE — gate (LV p/ disparar) + reset + bônus ###');
L(`  +${pct(CONVERGENCE.bonusPerConv)} dano/HP e +${pct(CONVERGENCE.goldBonusPerConv)} Gold por conv · XP 0% · reseta LV/Gold, não a posição`);
L('  conv | precisa LV | reseta p/ LV | dano/HP acum | Gold acum');
L('  -----+------------+--------------+--------------+----------');
for (let n=1;n<=14;n++){ const g=convGateLevel(n-1); L(`   ${String(n).padStart(2)}  |   ${String(g).padStart(7)}  |    ${String(Math.max(1,Math.floor(CONVERGENCE.headstartFrac*g))).padStart(6)}    | ×${(1+CONVERGENCE.bonusPerConv*n).toFixed(2)} (+${(CONVERGENCE.bonusPerConv*n*100).toFixed(0)}%) | +${(CONVERGENCE.goldBonusPerConv*n*100).toFixed(1)}%`); }

L('\n### 6. DESPERTAR (área 7, 1 por mapa) ###');
const r = DESPERTAR_REQ[1];
L(`  gate: liberar Sub ${r.subarea} + ${f(r.kills)} kills + nível ${f(r.level)} + ${r.t1} materiais T1 (consumidos)`);
L(`  efeito: ×${DESPERTAR.mult} dano/HP · +${pct(DESPERTAR.critRateAdd)} crit rate · +${(DESPERTAR.critDmgAdd*100).toFixed(0)}% crit dmg · +${DESPERTAR.apsAdd} APS · +${pct(DESPERTAR.lumensBonus)} Gold · +${pct(DESPERTAR.xpBonus)} XP`);

L('\n### 7. GILDED (mob mais forte, afixo do Manto) ###');
const gt = GILDED.tiers[0];
L(`  chance: afixo do Manto (teto global ${pct(GILDED.chanceCap)}; ~5% no fim do Map 1) · tier 1 "${gt.name}": ×${gt.hpMult} HP, ×${gt.lumensMult} Gold, ×${gt.xpMult} XP`);
L('\n══════════════════════════════════════════════════════════════════');
```

### `tools/sim/map1_target.mjs`

```javascript
// MAP 1 — alvo de 36h. Quanto de HP os mobs precisam? (sem o cap de 1e6)
// Testa N=5 e N=9 sub-áreas, varrendo o TETO de HP do mob (hpHi). Modelo limpo do M1:
// Base(Nível) × Gear(2 afixos, Faded) × Convergence. Gasta só na arma. Uso: node tools/sim/map1_target.mjs

const APS = 5, BASE = 7, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15, KILLGATE = 100;

// modelo de poder (Faded, conv=0): dmgHit = (base + nível×10 + wl×flat) × (1 + wl×pct)
function clear(N, hpHi, { flat = 50, pct = 0.02, costBase = 5, costRamp = 1, killGate = KILLGATE } = {}) {
  const hpLo = 10;
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0 };
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + p.wl * flat) * (1 + p.wl * pct);
  const cost = () => costBase * (p.wl + 1) * costRamp ** p.wl;
  let total = 0;
  for (let s = 1; s <= N; s++) {
    const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
    const bossHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
    let kills = 0, subTime = 0, guard = 0;
    while (guard++ < 2e7) {
      const dps = dmgHit() * APS;
      const tpk = Math.max(1 / APS, mobHp / dps);
      const dt = Math.max(tpk, 0.5);
      const k = dt / tpk;
      kills += k; subTime += dt; total += dt;
      p.lumens += k * mobHp * GOLD;
      p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      let b = 0;
      while (p.lumens >= cost() && b++ < 20000) { p.lumens -= cost(); p.wl++; }
      if (kills >= killGate && dmgHit() * APS >= bossHp / 10) break;
      if (subTime > 400 * 86400) return { total: Infinity, wl: p.wl }; // trava (>400d = falhou)
    }
  }
  return { total, wl: p.wl };
}

const fmtT = (s) => !isFinite(s) ? 'FALHOU(>400d)' : s < 5400 ? `${(s/60).toFixed(1)}min`
  : s < 1.3e5 ? `${(s/3600).toFixed(2)}h` : `${(s/86400).toFixed(2)}d`;

console.log('='.repeat(82));
console.log('MAP 1 → quanto de HP precisa pra ~36h? · custo do gear ATUAL (5×(L+1), linear)');
console.log('='.repeat(82));
const ceilings = [1e6, 1e9, 1e12, 1e15, 1e20, 1e30, 1e45, 1e60, 1e80];
for (const N of [5, 9]) {
  console.log(`\n── ${N} sub-áreas ──`);
  console.log(' HP teto (hpHi) | tempo M1     | arma lvl fim');
  console.log(' ' + '-'.repeat(46));
  for (const H of ceilings) {
    const r = clear(N, H);
    console.log(` ${H.toExponential(0).padStart(13)} | ${fmtT(r.total).padStart(12)} | ${r.wl.toExponential(2)}`);
  }
}
console.log('\n' + '='.repeat(82));
console.log('TESTE 2 — e se apertar o CUSTO do gear (a renda não acompanha)? N=5, HP teto 1e12');
console.log('='.repeat(82));
console.log(' costBase | costRamp | tempo M1');
console.log(' ' + '-'.repeat(36));
for (const [cb, cr] of [[5, 1], [5, 1.00002], [5, 1.00005], [50, 1.00005], [5, 1.0001]]) {
  const r = clear(5, 1e12, { costBase: cb, costRamp: cr });
  console.log(` ${String(cb).padStart(8)} | ${String(cr).padStart(8)} | ${fmtT(r.total)} (arma ${r.wl.toExponential(1)})`);
}
```

### `tools/sim/map1_v2.mjs`

```javascript
// MAP 1 v2 — 9 sub-áreas, rescale ×500, crit gradual, APS→~1.3. Modelo fiel ao engine.
// Uso: node tools/sim/map1_v2.mjs
const BASE = 3500, DMG_PER_LVL = 5000, HP_PER_LVL = 2500, BASE_HP = 25000;
const GOLD = 0.10, XP = 0.08, DIV = 5000, EXP = 0.4, GOLD_PER_LVL = 1500, LUM_FLOOR = 30000;
const N = 9, hpLo = 5000, hpHi = 5e8, BOSSMULT = 15, KILLGATE = 100;
const CAP = 750, COSTBASE = 420000;
const APS0 = 0.90, APS_FLAT = 2e-4, CRIT_PER = 3e-4, DMG_FLAT = 30000, PCT = 0.02;
const CONV_PER = 0.15, GATE_BASE = 40, GATE_GROWTH = 1.25, APSCAP = 5;

const mobHpOf = (s) => hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
const bossHpOf = () => hpLo * (hpHi / hpLo) ** (N / N) * BOSSMULT;

function sim({ useConv }) {
  const p = { lumens: 0, xpRun: 0, level: 1, wl: 0, convMult: 1, convs: 0, gate: GATE_BASE };
  // dano por hit = (base + nivel*dmgPerLvl + arma_flat) * (1 + wl*PCT) * conv   (Edge: flat + %)
  const dmgHit = () => (BASE + p.level * DMG_PER_LVL + Math.min(p.wl, CAP) * DMG_FLAT) * (1 + Math.min(p.wl, CAP) * PCT) * p.convMult;
  const apsOf = () => {
    const reson = 1 + 0.3 * Math.log10(1 + Math.min(p.wl, CAP) * PCT * 9); // ~mult do afixo aps (Reson)
    return Math.min(APSCAP, (APS0 + Math.min(p.wl, CAP) * APS_FLAT) * reson);
  };
  const critOf = () => Math.min(1, Math.min(p.wl, CAP) * CRIT_PER);
  const cost = () => COSTBASE * (p.wl + 1);
  let total = 0; const rows = [];
  for (let s = 1; s <= N; s++) {
    const mobHp = s < N ? mobHpOf(s) : bossHpOf();
    const entryHit = dmgHit(), entryAps = apsOf(), entryCrit = critOf();
    let kills = 0, guard = 0, broke = false;
    while (guard++ < 5e6) {
      const aps = apsOf();
      const effDmg = dmgHit() * (1 + critOf() * 1); // crit = ×2 → +100% no proc
      const dps = effDmg * aps;
      const tpk = Math.max(1 / aps, mobHp / dps);
      const dt = Math.max(tpk, 0.5), k = dt / tpk;
      kills += k; total += dt;
      p.lumens += k * (mobHp * GOLD + LUM_FLOOR + p.level * GOLD_PER_LVL);
      p.xpRun += k * mobHp * XP;
      p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
      while (useConv && p.level >= p.gate) { p.convMult += CONV_PER; p.convs++; p.gate *= GATE_GROWTH; p.xpRun = 0; p.level = 1; }
      let b = 0; while (p.wl < CAP && p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
      const gate = s < N ? kills >= KILLGATE : (kills >= KILLGATE && dps >= mobHp / 13);
      if (gate) { broke = true; break; }
      if (total > 30 * 86400) break;
    }
    rows.push({ s, mobHp, mobAtk: mobHp * 0.02, hit: entryHit, aps: entryAps, crit: entryCrit, wl: p.wl, lvl: p.level });
    if (!broke) { rows.push({ walled: true }); break; }
  }
  return { total, rows, convs: p.convs, convMult: p.convMult, wl: p.wl, crit: Math.min(1, p.wl * CRIT_PER), aps: apsOf.call ? null : null };
}

const fmt = (n) => n >= 1e6 ? n.toExponential(2) : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toFixed(1);
const fmtT = (s) => s < 5400 ? `${(s / 60).toFixed(1)}min` : s < 1.3e5 ? `${(s / 3600).toFixed(2)}h` : `${(s / 86400).toFixed(1)}d`;

for (const useConv of [true, false]) {
  const r = sim({ useConv });
  console.log('='.repeat(78));
  console.log(`MAP 1 v2 — ${useConv ? 'COM Convergence' : 'SEM Convergence'} | total ${fmtT(r.total)} | convs ${r.convs} | gear wl ${r.wl} | crit fim ${(r.crit * 100).toFixed(1)}%`);
  console.log(' area |   mobHP  | mobATK |  hit@entry | APS  | crit% | wl  | lvl');
  for (const x of r.rows) {
    if (x.walled) { console.log('  >> WALL'); continue; }
    console.log(`   ${x.s}/${N} | ${fmt(x.mobHp).padStart(8)} | ${fmt(x.mobAtk).padStart(6)} | ${fmt(x.hit).padStart(10)} | ${x.aps.toFixed(2)} | ${(x.crit * 100).toFixed(1).padStart(5)} | ${String(x.wl).padStart(3)} | ${x.lvl}`);
  }
}
```

### `tools/sim/map1.mjs`

```javascript
// PACING DO MAP 1 (isolado) — 2026-06-14. Config ESCOLHIDA pelo Willian:
//   Base(Nível) × Gear(2 afixos, Faded) × Convergence(0) · APS REAL 0.90
//   custo arma = 5×(L+1)×1.006^L (geométrico) · HP do mob até 1e9 (climb visceral)
// Sem Despertar/Ascension/Mémoires/Passivas. ENTRADA = jogador novo. SAÍDA = boss Sub-5.
// "hits/mob" mostra o climb: >1 = mob aguenta vários golpes (você sente "preciso upar").
// Uso: node tools/sim/map1.mjs

const BASE = 7, APS = 0.90, DMG_PER_LVL = 10, GOLD = 0.10, XP = 0.08;
const DIV = 10, EXP = 0.4, BOSSMULT = 15;

// ── parâmetros do Map 1 (a config aprovada) ──
const N = 5, hpLo = 10, hpHi = 1e9;
// HP 1e9 exige ~40k níveis de arma → custo LINEAR (ramp geométrico deadlocka aqui).
const FLAT = 50, PCT = 0.02, COST_BASE = 160, COST_RAMP = 1, KILLGATE = 100;
const GATE_DIV = 13; // avança quando o boss cai em ~bossHp/GATE_DIV → frontier ~5 hits (hits≈0.38×GATE_DIV)

const p = { lumens: 0, xpRun: 0, level: 1, wl: 0 };
const dmgHit = () => (BASE + p.level * DMG_PER_LVL + p.wl * FLAT) * (1 + p.wl * PCT);
const dps = () => dmgHit() * APS;
const cost = () => COST_BASE * (p.wl + 1) * COST_RAMP ** p.wl;
const fmtT = (s) => s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s/60).toFixed(1)}min` : `${(s/3600).toFixed(2)}h`;

console.log('='.repeat(100));
console.log(`MAP 1 — config: custo ${COST_BASE}×(L+1)${COST_RAMP !== 1 ? `×${COST_RAMP}^L` : ' linear'} · HP até ${hpHi.toExponential(0)} · APS ${APS} · ${N} subs`);
console.log('='.repeat(100));
console.log(' sub | mob HP    | boss HP   | hits/mob entrada | tempo sub | arma lvl | nível | DPS');
console.log('-'.repeat(100));

let total = 0;
for (let s = 1; s <= N; s++) {
  const mobHp = hpLo * (hpHi / hpLo) ** ((s - 0.5) / N);
  const bossHp = hpLo * (hpHi / hpLo) ** (s / N) * BOSSMULT;
  const hitsEntry = Math.max(1, mobHp / dmgHit()); // quantos golpes p/ matar AO ENTRAR na sub
  let kills = 0, subTime = 0, guard = 0;
  while (guard++ < 5e6) {
    const tpk = Math.max(1 / APS, mobHp / dps());
    const dt = Math.max(tpk, 0.5);
    const k = dt / tpk;
    kills += k; subTime += dt; total += dt;
    p.lumens += k * mobHp * GOLD;
    p.xpRun += k * mobHp * XP;
    p.level = Math.max(1, Math.floor((p.xpRun / DIV) ** EXP));
    let b = 0;
    while (p.lumens >= cost() && b++ < 5000) { p.lumens -= cost(); p.wl++; }
    if (kills >= KILLGATE && dps() >= bossHp / GATE_DIV) break;
    if (subTime > 50 * 86400) break;
  }
  console.log(
    `  ${s}  | ${mobHp.toExponential(1).padStart(8)} | ${bossHp.toExponential(1).padStart(8)} | ${hitsEntry.toFixed(1).padStart(16)} | ${fmtT(subTime).padStart(9)} | ${p.wl.toExponential(2).padStart(8)} | ${p.level.toString().padStart(5)} | ${dps().toExponential(2)}`
  );
}
console.log('-'.repeat(100));
console.log(`TEMPO TOTAL Map 1 (1ª limpa, só na arma): ${fmtT(total)}`);
console.log(`SAÍDA → entrada M2: arma lvl ${p.wl.toExponential(2)} · nível ${p.level} · DPS ${dps().toExponential(2)}`);
console.log('\nhits/mob entrada >1 = você NÃO one-shota ao chegar na sub → precisa upar (climb visceral).');
```

### `tools/sim/material.mjs`

```javascript
// Camada 4 — CRAFT/MATERIAIS (REVISTO 2026-06-11 c/ feedback do Willian).
// Pontos: (1) raridade NÃO depende de dificuldade — tudo no Normal; (2) Converged
// abre no Map 4 (antes do Map 5); (3) material = % de drop do MOB (~1%).
// Uso: node tools/sim/material.mjs

const PIECES = 6;

// Mob solta material do TIER DO MAPA atual, por CHANCE % (Willian: ~0.8-1%).
// Map 1→T1 ... Map 4→T4 (Map 5 = T4/future). Isso pacing-a "1 raridade por mapa"
// SEM precisar de boss nem dificuldade: você sobe a raridade do mapa só farmando.
const dropChance = 0.01;          // 1% por mob
const bossBonus  = 30;            // Guardião/boss final: chunk garantido (acelera, não gate)

// custo p/ subir 1 PEÇA um tier (mesmo p/ todos — o gate real é o tier estar no mapa)
const upgradePerPiece = 40;       // → 240 p/ as 6 peças por tier

const refino = 12;
const diffMult = { Normal: 1, Difícil: 3, Nightmare: 10, Tormento: 30 };

// TETO de kills/hora = ÂNCORA FÍSICA: 1 kill/ataque × APS 15 = 15 kills/s = 54.000/h.
// 🔧 Correção de auditoria 2026-06-11: o cenário antigo "180k/h" (=50 kills/s) VIOLAVA
// a âncora (excede o cap de 15 kills/s) e foi REMOVIDO. 54k/h é o teto canônico.
const KILLS_PER_HOUR_CEIL = 54000;

const totalPerTier = PIECES * upgradePerPiece;   // 240
const killsNeeded = totalPerTier / dropChance;   // 24.000 mobs

console.log(`Drop: ${dropChance*100}% por mob (tier = tier do MAPA). Boss bônus: +${bossBonus} garantido.`);
console.log(`Custo p/ subir TODAS as 6 peças 1 tier: ${totalPerTier} materiais.`);
console.log(`→ ${killsNeeded.toLocaleString('en')} mob kills (sem contar bônus de boss).\n`);

console.log('TEMPO p/ subir a raridade do mapa (todas as 6 peças):');
const minCeil = (killsNeeded / KILLS_PER_HOUR_CEIL) * 60;
console.log(`  teto 15 APS (${KILLS_PER_HOUR_CEIL/1000}k kills/h) → ~${minCeil.toFixed(0)} min de farm  ← pacing canônico`);
console.log(`  (multi-kill de passivas sobe um pouco, mas paga 50% e não é a base)`);

console.log('\nPACING por mapa (raridade alvo de cada mapa, no Normal):');
const plan = [['Map 1','Kindled (T1)'],['Map 2','Luminous (T2) — motor × liga'],
  ['Map 3','Radiant (T3)'],['Map 4','Converged (T4) — ÚLTIMO TIER, antes do Map 5'],['Map 5','já Converged + nível/Ascension']];
for (const [m, r] of plan) console.log(`  ${m}: ${r}`);

console.log(`\nRefino: ${refino}:1 entre tiers (usa excedente). Dificuldade só MULTIPLICA o yield (opcional):`);
for (const [k, v] of Object.entries(diffMult)) console.log(`  ${k.padEnd(9)} ×${v}  (acelera; NUNCA requisito p/ raridade)`);
```

### `tools/sim/memoires.mjs`

```javascript
// Camada 6 — MÉMOIRES. PROBLEMA achado: custo 2×1.10^n é raso demais vs drip
// 0.1×HP^0.9 → maximiza instantâneo. Acha o RAMP de custo que paceia o leveling
// pela profundidade. Uso: node tools/sim/memoires.mjs

const CLARTE = 1.07;
const NM = 15;
const MEMOIRE_SHARE = 0.74;            // Mémoires carregam ~74% das décadas de dano
const dripPerHour = (H) => 0.1 * H ** 0.9;
const FARM_HOURS = 2;                  // Éclats acumulados em ~2h de drip na profundidade

// nível/Mémoire NECESSÁRIO p/ a fatia de décadas do mapa de HP frontier H
const neededLevel = (H) => (MEMOIRE_SHARE * Math.log10(H) / Math.log10(CLARTE)) / NM;
// nível/Mémoire AFORDÁVEL: maior L com 15×Σ(2×ramp^n) ≤ Éclats de FARM_HOURS
function affordableLevel(H, ramp) {
  const eclats = FARM_HOURS * dripPerHour(H);
  let cum = 0, L = 0;
  while (true) {
    const next = 2 * ramp ** (L + 1);
    if (15 * (cum + next) > eclats) break;
    cum += next; L++;
    if (L > 100000) break;
  }
  return L;
}

const maps = [['Map1', 1e6], ['Map2', 1e16], ['Map3', 1e34], ['Map4', 1e62], ['Map5', 1e100]];

for (const ramp of [1.10, 2.5, 3.0, 4.0]) {
  console.log(`\n=== RAMP de custo = ×${ramp}/nível ===`);
  console.log(' mapa  | nível necessário | nível afordável(2h) | veredito');
  console.log(' '.repeat(2) + '-'.repeat(58));
  for (const [m, H] of maps) {
    const need = neededLevel(H);
    const aff = affordableLevel(H, ramp);
    const verdict = aff > need * 3 ? 'QUEBRA (super afford)' : aff < need * 0.5 ? 'lento demais' : 'OK paceado';
    console.log(`  ${m}  |       ${need.toFixed(0).padStart(3)}        |        ${String(aff).padStart(4)}         | ${verdict}`);
  }
}
console.log('\nAlvo: nível afordável ≈ nível necessário (paceado pela profundidade).');
```

### `tools/sim/pacing.mjs`

```javascript
// SIMULADOR DE PACING end-to-end (2026-06-14) — o que faltava (ver playtime.mjs).
// Mapeia nossas fórmulas no MODELO DE COLUNAS do Gaiadon (as 3 prints do Willian):
//
//   STAT = Primary(Σflat) × (1+Bonus%) × Multiplier(Σ×) × (1+Mastery%)
//
//   Coluna      | fonte no Éclats                                   | papel
//   ------------|--------------------------------------------------|---------------------
//   Primary     | baseDmg + Nível×dmgPerLevel + GEAR flat (afixo 1) | base que sobe linear
//   Bonus%      | GEAR %dano (afixo 2)                              | 1ª camada % (gear)
//   Multiplier  | Convergence × Ascension × Despertar              | meta-mult por mapa
//   Mastery%    | Passivas + Mémoires (Clarté)                      | motor profundo (late)
//
// GEAR NOVO (decisão Willian 14/jun): tier 1 = 2 AFIXOS por peça (flat + %),
// SEM a 3ª camada ×Multiplier (era cópia do Gaiadon). Raridade = mapa.
//
// O sim roda a ESPIRAL econômica real: matar → renda → comprar gear → mais dano →
// avançar sub-área. Mede TEMPO POR MAPA. Uso: node tools/sim/pacing.mjs

import { MAPS, COMBAT, ECONOMY, LEVEL } from '../../src/data/constants.js';
import { hpForLevel, subareaLevelRange } from '../../src/game/enemies.js';

// ───────── SEMENTES AJUSTÁVEIS (é isto que a gente varre) ─────────
const SEED = {
  // GEAR — 2 afixos por peça de dano (a arma): flat + %
  flatDmgPerLevel: 50,    // afixo 1 (Primary): +flat dano por nível da arma
  pctDmgPerLevel:  0.02,  // afixo 2 (Bonus%): +2%/nível da arma (fração)
  rarityMult: [1, 1.5, 2.25, 3.5, 5],
  costBase: 5,
  // ✅ ACHADO DO SIM: o custo precisa deixar a arma CHEGAR aos ~1e15 níveis que o late
  // exige. Com renda ~1e43/s no M5, costMult[4]~1e16 (não 1e39, que CONGELAVA tudo).
  costMult: [1, 1e4, 1e8, 1e12, 1e16],
  // META-MULT (coluna Multiplier) que o jogador CARREGA ao chegar em cada mapa.
  // Conv (~run) × Asc (×2/asc) × Despertar (×5/tier). ~1.5 década/mapa no late.
  metaMult: [1, 30, 300, 3000, 3e6],     // índice = mapa-1
  // MASTERY% (Passivas+Mémoires) por mapa. Back-loaded: Mémoires (18 déc) são late.
  masteryPct: [0, 2, 200, 5e4, 1e9],     // (1+x): ~0…9 décadas no M5
};

// ───────── modelo de poder (colunas) ─────────
function dpsOf(p, mapIdx) {
  const rm = SEED.rarityMult[p.rarity];
  const primary = COMBAT.baseDmg + p.level * LEVEL.dmgPerLevel + p.wlevel * SEED.flatDmgPerLevel * rm;
  const bonus = 1 + p.wlevel * SEED.pctDmgPerLevel * rm;
  const mult = SEED.metaMult[mapIdx];
  const mastery = 1 + SEED.masteryPct[mapIdx];
  const dmgHit = primary * bonus * mult * mastery;
  return dmgHit * COMBAT.apsCap; // crit≈1; APS no teto quando one-shota
}
const weaponCost = (p) => SEED.costBase * (p.wlevel + 1) * SEED.costMult[p.rarity];

const geomean = (lo, hi) => Math.sqrt(lo * hi);
const fmtT = (s) => s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s/60).toFixed(1)}min`
  : s < 1.3e5 ? `${(s/3600).toFixed(1)}h` : `${(s/86400).toFixed(1)}d`;

// ───────── espiral econômica por mapa ─────────
function runMap(p, mapIdx) {
  const map = MAPS[mapIdx];
  p.rarity = mapIdx; // raridade = mapa (Faded→Converged)
  let mapTime = 0;
  const subTimes = [];
  for (let s = 1; s <= map.subareaCount; s++) {
    const { lo, hi } = subareaLevelRange(map, s);
    const mobHp = hpForLevel(map, geomean(lo, hi));
    const bossHp = hpForLevel(map, Math.round(hi)) * COMBAT.bossHpMult;
    let kills = 0, subTime = 0;
    const need = map.bossKillThreshold;
    let guard = 0;
    while (guard++ < 1e7) {
      const dps = dpsOf(p, mapIdx);
      // tempo por kill: teto de APS OU limitado pelo dano (single-target)
      const tpk = Math.max(1 / COMBAT.apsCap, mobHp / dps);
      // passo adaptativo: avança ~1 compra de cada vez
      const dt = Math.max(tpk, 1);
      const k = dt / tpk;
      kills += k; subTime += dt; mapTime += dt;
      // renda (escala com HP do mob): lumens + xp
      p.lumens += k * mobHp * ECONOMY.goldRatio;
      p.xpRun += k * mobHp * ECONOMY.xpRatio;
      p.level = Math.max(1, Math.floor((p.xpRun / LEVEL.curveDiv) ** LEVEL.curveExp));
      // gasta lumens na ARMA (driver de dano), 1 nível por vez enquanto puder
      let buys = 0;
      while (p.lumens >= weaponCost(p) && buys++ < 5000) { p.lumens -= weaponCost(p); p.wlevel++; }
      // gate de avanço: matou o suficiente E o boss cai em ≤10s
      if (kills >= need && dpsOf(p, mapIdx) >= bossHp / 10) break;
      if (subTime > 30 * 86400) break; // trava de segurança (30d)
    }
    subTimes.push(subTime);
  }
  return { mapTime, subTimes, p };
}

// ───────── playthrough completo ─────────
console.log('='.repeat(92));
console.log('PACING end-to-end — gear NOVO (2 afixos: flat + %) · modelo de colunas (Gaiadon-mapeado)');
console.log('='.repeat(92));
console.log(`SEED: flat=${SEED.flatDmgPerLevel}/nv · pct=${(SEED.pctDmgPerLevel*100)}%/nv · metaMult=[${SEED.metaMult}] · mastery=[${SEED.masteryPct}]`);
console.log('-'.repeat(92));
console.log('mapa | raridade   | HP mobs            | tempo do mapa | arma lvl fim | nível fim | décadas dano');
console.log('-'.repeat(92));

const RAR = ['Faded', 'Kindled', 'Luminous', 'Radiant', 'Converged'];
const p = { lumens: 0, xpRun: 0, level: 1, wlevel: 0, rarity: 0 };
let totalTime = 0;
for (let m = 0; m < 5; m++) {
  const map = MAPS[m];
  const before = dpsOf(p, m) / COMBAT.apsCap;
  const r = runMap(p, m);
  totalTime += r.mapTime;
  const decadesDmg = Math.log10((dpsOf(p, m) / COMBAT.apsCap) / COMBAT.baseDmg);
  console.log(
    `  ${map.id}  | ${RAR[m].padEnd(10)} | ${map.hpLo.toExponential(0)}–${map.hpHi.toExponential(0)} | ${fmtT(r.mapTime).padStart(13)} | ${p.wlevel.toExponential(2).padStart(12)} | ${p.level.toExponential(2).padStart(9)} | ${decadesDmg.toFixed(1).padStart(12)}`
  );
}
console.log('-'.repeat(92));
console.log(`TEMPO TOTAL (5 mapas, ativo): ${fmtT(totalTime)}  (${(totalTime/3600).toFixed(1)}h)`);
console.log('\nLEITURA: começo (M1) pode ser lento; M2+ deve acelerar. Nada de mapa em segundos');
console.log('(rápido demais) nem em dias (lento demais). Varrer SEED.* pra achar o ritmo.');
```

### `tools/sim/passives.mjs`

```javascript
// Camada 5 — PASSIVAS. Calibra por ESQUEMA (não 45 números soltos): a maioria é
// % aditivo capado; poucas late são o motor multiplicativo que entrega as décadas.
// Orçamento: árvore Éclat ~8 décadas de dano (Fracture ~8 de HP; Vestige = economia).
// Uso: node tools/sim/passives.mjs

const maxLevel = 12;                  // teto de nível de TODA passiva (gate grupo→grupo funciona)
const groupMult = [1, 10, 100];      // custo em Vestiges por grupo (mantido)

// % aditivo por nível, por grupo (a maioria das passivas)
const addPct = [0.05, 0.10, 0.20];   // g1 5% · g2 10% · g3 20% por nível
const addPassivesPerGroup = [5, 4, 2]; // qtd de passivas "% aditivo" por grupo (resto = motor/funcional)

// MOTOR multiplicativo: 3 passivas late (grupo 3) — game-changers (Fractured Soul, etc.)
const enginePassives = 3;
const engineMultPerLevel = 1.52;     // ×1.52/nível, capado em maxLevel

// passive_dano = (1 + Σ% aditivo) × Π motor
let addSum = 0;
for (let g = 0; g < 3; g++) addSum += addPassivesPerGroup[g] * addPct[g] * maxLevel;
const additive = 1 + addSum;
const engine = (engineMultPerLevel ** maxLevel) ** enginePassives;
const passiveDano = additive * engine;

const dec = (x) => Math.log10(x).toFixed(2);
console.log('ÁRVORE ÉCLAT (dano) — calibração por esquema:\n');
console.log(`  parte ADITIVA (maioria):  ×${additive.toFixed(0)}  (${dec(additive)} déc)`);
console.log(`  MOTOR (3 late ×${engineMultPerLevel}/nv, max ${maxLevel}): ×${engine.toExponential(2)}  (${dec(engine)} déc)`);
console.log(`  → passive_dano total: ×${passiveDano.toExponential(2)}  = ${dec(passiveDano)} décadas  (alvo ~8)\n`);

console.log('ALAVANCAS FUNCIONAIS (targets, não décadas de dano):');
console.log('  Fracture Pulse (APS): leva o APS de ~1.5 (AGI) a ~10; o gear (Resonance) fecha p/ 15.');
console.log('  Luminal Edge (crit chance): + a fração que falta p/ 100% (com Grasp/gear); transbordo→dmg.');
console.log('  Void Awareness (cap de mobs): + base [2,4,6,9,12] rumo ao teto ~24.');
console.log('  Void Piercing / Weakened Void: penetra/reduz a defesa de inimigos (§4).');
console.log('  Vestige Pull (materiais): × na taxa de drop de material (§13B).');
console.log('\nGATE: maximizar os 5 de um grupo (no maxLevel) libera o próximo. groupMult custo =', JSON.stringify(groupMult));
console.log('HP (árvore Fracture) e economia (Vestige) seguem o MESMO esquema nos seus temas.');
```

### `tools/sim/personas.mjs`

```javascript
// SIM DE PERSONAS — quanto tempo REAL cada perfil leva pra limpar o Map 1, modelando
// sessões ativas (compra/converge/desperta) + tempo OFFLINE (combate roda em poder
// ESTAGNADO, sem comprar, até logar de novo). Uso: node tools/sim/personas.mjs
import { createInitialState } from '../../src/core/state.js';
import { combatTick, enterSubarea, resetPack } from '../../src/game/combat.js';
import { currentAPS, dps, playerHpMax, runLevel } from '../../src/game/stats.js';
import { buyLevel, levelCost, atLevelCap, canRarityUp, doRarityUp } from '../../src/game/gear.js';
import { canConverge, doConverge } from '../../src/game/convergence.js';
import { canDespertar, doDespertar } from '../../src/game/ascension.js';
import { GEAR, ENEMY, COMBAT, LEVEL } from '../../src/data/constants.js';
import { getCurrentMap } from '../../src/game/enemies.js';
import { formatNumber as f } from '../../src/core/format.js';

const gearAvg = (s) => GEAR.pieces.reduce((a, d) => a + s.gear[d.key].level, 0) / 6;
function buyGreedy(s){ let g=0; while(g++<5000){ let best=null,bc=Infinity; for(const d of GEAR.pieces){const p=s.gear[d.key]; if(atLevelCap(p,s))continue; const c=levelCost(p); if(c<bc){bc=c;best=d.key;}} if(!best||s.lumens<bc)break; if(!buyLevel(s,best))break; } }
function rarityUp(s){ let d=true; while(d){d=false; for(const def of GEAR.pieces) if(canRarityUp(s,def.key)){doRarityUp(s,def.key);d=true;}} }
function bestArea(s){ const map=getCurrentMap(s); const d=dps(s),hp=playerHpMax(s),lvl=runLevel(s); const bD=COMBAT.baseDmg+lvl*LEVEL.dmgPerLevel;
  for(let a=s.unlockedSubarea;a>=1;a--){ const mhp=bD*ENEMY.hitsToKill*ENEMY.areaHp[a-1]; const sz=map.packSizes[a-1]; const t=(sz*mhp)/d; const pk=hp*ENEMY.dmgFrac*ENEMY.areaDmg[a-1]; const taken=pk*(t/2)-hp*0.01*(t/2); if(taken<hp*0.8)return a; } return 1; }

// SESSÃO ATIVA: joga "bem" por `secs` (compra guloso, converge, desperta, re-escolhe área)
function active(s, secs, DT=0.1){ let t=0,reTick=0; while(t<secs){ if(reTick--<=0){const tg=bestArea(s); if(tg!==s.subarea)enterSubarea(s,tg); reTick=30;} combatTick(s,DT); t+=DT; buyGreedy(s); rarityUp(s); if(canConverge(s))doConverge(s); if(canDespertar(s))doDespertar(s); if(s.bossDefeated[8])return; } }
// OFFLINE: só combate, poder ESTAGNADO (sem comprar/converger), na área atual. Antes, o login
// "spend" é feito no active() seguinte. dt maior p/ velocidade (aproximação).
// OFFCAP_H (h) e OFFEFF (0..1): se setados, limitam o offline (modelo "intencional" 8h×40%).
const OFFCAP = process.env.OFFCAP_H ? +process.env.OFFCAP_H * 3600 : Infinity;
const OFFEFF = process.env.OFFEFF ? +process.env.OFFEFF : 1;
function offline(s, secs, DT=0.5){ const eff = Math.min(secs, OFFCAP) * OFFEFF; let t=0; while(t<eff){ combatTick(s,DT); t+=DT; if(s.bossDefeated[8])return; } }

function persona(name, activeHrs, sessions){
  const s = createInitialState(); s.player.hp = playerHpMax(s); resetPack(s);
  const offHrs = 24 - activeHrs;
  const actPerSession = (activeHrs*3600)/sessions, offPerSession = (offHrs*3600)/sessions;
  let day=0;
  while(day<40 && !s.bossDefeated[8]){
    day++;
    for(let k=0;k<sessions && !s.bossDefeated[8];k++){
      active(s, actPerSession);                 // loga: gasta o banco + joga
      if(!s.bossDefeated[8]) { const tg=bestArea(s); if(tg!==s.subarea) enterSubarea(s,tg); offline(s, offPerSession); } // fecha numa área sustentável
    }
  }
  const cleared = s.bossDefeated[8];
  return { name, activeHrs, sessions, day: cleared?day:null, conv:s.convergences, gear:Math.round(gearAvg(s)), lvl:runLevel(s), desp:s.despertares||0, cleared };
}

console.log('SIM DE PERSONAS — dias REAIS p/ limpar o Map 1 (combate ativo ~11,5h no harness ótimo)');
console.log('offline = combate em poder ESTAGNADO (sem comprar), 100% efic., teto 30 dias (como no código)\n');
console.log('persona                     | ativo/dia | sessões | DIAS p/ limpar | conv | gear | desp');
console.log('----------------------------+-----------+---------+----------------+------+------+-----');
for(const p of [
  persona('PRO (no-lifer)', 10, 4),
  persona('CASUAL (1,5h/dia, 2 logins)', 1.5, 2),
  persona('LIGHT (só checa, 15min, 1x)', 0.25, 1),
]){
  console.log(`${p.name.padEnd(27)} |   ${String(p.activeHrs).padStart(4)}h   |    ${p.sessions}    |  ${(p.day?p.day+' dias':'>40 dias').padStart(9)}     |  ${p.conv}  | ${String(p.gear).padStart(4)} |  ${p.desp}`);
}
```

### `tools/sim/playground.html`

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Éclats — Simulador de Valores (Map 1)</title>
<style>
  :root{
    --bg:#f4f7fb; --card:#ffffff; --ink:#11233b; --muted:#5b6b80;
    --line:#d9e3ef; --blue:#2f6fed; --blue-d:#1c4fbf; --ok:#0f9d58; --warn:#d98300; --bad:#d23f3f;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,Segoe UI,Roboto,sans-serif}
  header{background:linear-gradient(180deg,#ffffff,#eef4ff);border-bottom:1px solid var(--line);padding:14px 20px}
  header h1{margin:0;font-size:18px}
  header p{margin:4px 0 0;color:var(--muted);font-size:12px}
  .wrap{display:grid;grid-template-columns:minmax(360px,460px) 1fr;gap:16px;padding:16px;align-items:start}
  @media(max-width:980px){.wrap{grid-template-columns:1fr}}
  .panel{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px}
  .panel h2{margin:0 0 10px;font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:var(--blue-d)}
  .toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
  button{font:inherit;border:1px solid var(--blue);background:var(--blue);color:#fff;border-radius:8px;padding:9px 16px;cursor:pointer}
  button.ghost{background:#fff;color:var(--blue-d)}
  button:hover{background:var(--blue-d);border-color:var(--blue-d);color:#fff}
  details{border:1px solid var(--line);border-radius:8px;margin-bottom:8px;overflow:hidden}
  details>summary{cursor:pointer;padding:8px 10px;background:#f0f5ff;font-weight:600;list-style:none}
  details>summary::-webkit-details-marker{display:none}
  details>summary::before{content:'▸ ';color:var(--blue)}
  details[open]>summary::before{content:'▾ '}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;padding:10px}
  .fld{display:flex;flex-direction:column;gap:2px}
  .fld.full{grid-column:1 / -1}
  .fld label{font-size:11px;color:var(--muted)}
  .fld input{font:inherit;border:1px solid var(--line);border-radius:6px;padding:5px 7px;background:#fbfdff}
  .fld input:focus{outline:2px solid #bcd2ff;border-color:var(--blue)}
  #out{white-space:pre-wrap;font:12.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
  table{border-collapse:collapse;width:100%;font:12px/1.4 ui-monospace,monospace;margin-top:8px}
  th,td{border:1px solid var(--line);padding:4px 6px;text-align:right}
  th{background:#f0f5ff;color:var(--blue-d)}
  td:first-child,th:first-child{text-align:left}
  .sum{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;margin-bottom:10px}
  .sum div{display:flex;justify-content:space-between;border-bottom:1px dotted var(--line);padding:2px 0}
  .sum b{font-variant-numeric:tabular-nums}
  .ok{color:var(--ok)} .warn{color:var(--warn)} .bad{color:var(--bad)}
  .hint{color:var(--muted);font-size:11px;margin:6px 0 0}
  .running{opacity:.5}
</style>
</head>
<body>
<header>
  <h1>Éclats of Lumière — Simulador de Valores</h1>
  <p>Edita as constantes do <b>Map 1</b> (e dos sistemas globais) e roda o <b>combate REAL</b>
     (importa <code>src/game/*</code>). Um "jogador sensato" farma a área mais funda sustentável,
     compra gear na peça mais barata, sobe raridade, converge e desperta nos gates — até limpar o Map 1.</p>
</header>

<div class="wrap">
  <div class="panel">
    <h2>Valores</h2>
    <div class="toolbar">
      <button id="run">▶ Rodar simulação</button>
      <button id="reset" class="ghost">↺ Restaurar padrão</button>
      <button id="export" class="ghost">⬇ Exportar preset</button>
      <button id="import" class="ghost">⬆ Importar preset</button>
      <input id="importFile" type="file" accept="application/json" hidden />
    </div>
    <div id="form"></div>
    <p class="hint">Dica: notação científica funciona (ex.: <code>1e5</code>). Arrays = lista
       separada por vírgula (9 áreas no Map 1). Os campos vêm pré-preenchidos com os valores
       atuais de <code>constants.js</code>.</p>
  </div>

  <div class="panel">
    <h2>Resultado</h2>
    <div id="result"><p class="hint">Clique em <b>Rodar simulação</b>. Pode levar 1–3 s
       dependendo do teto de horas (a simulação roda tick a tick, 100 ms cada).</p></div>
  </div>
</div>

<script type="module">
import { createInitialState } from '../../src/core/state.js';
import { combatTick, enterSubarea, bossActive, resetPack } from '../../src/game/combat.js';
import { currentAPS, dps, playerHpMax, runLevel, damagePerHit, critChance, critDamageMult, playerDefesa } from '../../src/game/stats.js';
import { buyLevel, levelCost, atLevelCap, canRarityUp, doRarityUp, levelCapFor } from '../../src/game/gear.js';
import { canConverge, doConverge, convGateLevel } from '../../src/game/convergence.js';
import { canDespertar, doDespertar } from '../../src/game/ascension.js';
import { getCurrentMap } from '../../src/game/enemies.js';
import {
  COMBAT, LEVEL, ECONOMY, ENEMY, GEAR, GEAR_RARITY_LABELS, CRAFT,
  CONVERGENCE, DESPERTAR, DESPERTAR_REQ, GILDED, MAPS,
} from '../../src/data/constants.js';

const M1 = MAPS[0];
const fmtT = (s) => s == null ? '—' : s < 90 ? `${s.toFixed(0)}s` : s < 5400 ? `${(s/60).toFixed(1)}min` : s < 86400*2 ? `${(s/3600).toFixed(1)}h` : `${(s/86400).toFixed(2)}d`;
const fmt = (n) => !isFinite(n) ? '∞' : n >= 1e12 ? (n/1e12).toFixed(2)+'T' : n >= 1e9 ? (n/1e9).toFixed(2)+'bi' : n >= 1e6 ? (n/1e6).toFixed(2)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'k' : Math.round(n).toString();

// ── Spec dos campos: cada um lê/escreve direto no objeto de constantes (mutável) ──
// num: input numérico ligado a obj[key]. arr: lista (vírgula) ligada a obj[key] (mantém tamanho).
const groups = [
  { t:'Sim — opções', open:true, f:[
    { l:'Teto de horas', kind:'num', get:()=>SIM.capHours, set:v=>SIM.capHours=v, step:1 },
    { l:'Sem Despertar (1=nunca desperta)', kind:'num', get:()=>SIM.noDesp, set:v=>SIM.noDesp=v?1:0, step:1 },
  ]},
  { t:'Combate (COMBAT)', open:true, f:[
    { l:'baseDmg (dano base)', kind:'num', o:COMBAT, k:'baseDmg' },
    { l:'playerBaseHp (HP base)', kind:'num', o:COMBAT, k:'playerBaseHp' },
    { l:'baseAPS (atk/s inicial)', kind:'num', o:COMBAT, k:'baseAPS', step:0.05 },
    { l:'apsCap (teto APS)', kind:'num', o:COMBAT, k:'apsCap', step:0.5 },
    { l:'regenPerSec (% HP/s)', kind:'num', o:COMBAT, k:'regenPerSec', step:0.005 },
  ]},
  { t:'Nível (LEVEL)', f:[
    { l:'curveDiv', kind:'num', o:LEVEL, k:'curveDiv' },
    { l:'curveExp', kind:'num', o:LEVEL, k:'curveExp', step:0.01 },
    { l:'dmgPerLevel', kind:'num', o:LEVEL, k:'dmgPerLevel' },
    { l:'hpPerLevel', kind:'num', o:LEVEL, k:'hpPerLevel' },
  ]},
  { t:'Economia (ECONOMY)', f:[
    { l:'lumBase (Lumens/kill base)', kind:'num', o:ECONOMY, k:'lumBase' },
    { l:'xpRatio (XP = HP×ratio)', kind:'num', o:ECONOMY, k:'xpRatio', step:0.01 },
  ]},
  { t:'Inimigos (ENEMY)', f:[
    { l:'hitsToKill (alvo de golpes)', kind:'num', o:ENEMY, k:'hitsToKill', step:0.5 },
    { l:'dmgFrac (dano onda = HP×frac)', kind:'num', o:ENEMY, k:'dmgFrac', step:0.001 },
    { l:'bossHpMult (Wall ×HP)', kind:'num', o:ENEMY, k:'bossHpMult' },
    { l:'bossDmgMult (boss ×dano)', kind:'num', o:ENEMY, k:'bossDmgMult' },
    { l:'levelPerArea', kind:'num', o:ENEMY, k:'levelPerArea', step:0.01 },
    { l:'areaHp[] (9 áreas)', kind:'arr', o:ENEMY, k:'areaHp' },
    { l:'areaDmg[] (9 áreas)', kind:'arr', o:ENEMY, k:'areaDmg' },
    { l:'areaReward[] (9 áreas)', kind:'arr', o:ENEMY, k:'areaReward' },
  ]},
  { t:'Mapa 1 (MAPS[0])', open:true, f:[
    { l:'bossKillThreshold (muro)', kind:'num', o:M1, k:'bossKillThreshold' },
    { l:'gearRarityCap (0=Faded,1=Kindled)', kind:'num', o:M1, k:'gearRarityCap', step:1 },
    { l:'unlockLevels[] (nível p/ liberar Sub n)', kind:'arr', o:M1, k:'unlockLevels' },
    { l:'packSizes[] (mobs por área)', kind:'arr', o:M1, k:'packSizes' },
  ]},
  { t:'Gear (GEAR)', f:[
    { l:'levelCostBase', kind:'num', o:GEAR, k:'levelCostBase' },
    { l:'costRamp (+/nível)', kind:'num', o:GEAR, k:'costRamp', step:0.01 },
    { l:'bonusRate (afixo %)', kind:'num', o:GEAR, k:'bonusRate', step:0.005 },
    { l:'multRate (afixo × Incomum+)', kind:'num', o:GEAR, k:'multRate', step:0.0001 },
    { l:'secondaryExp', kind:'num', o:GEAR, k:'secondaryExp', step:0.05 },
    { l:'affixPctRate (farm %/nv)', kind:'num', o:GEAR, k:'affixPctRate', step:0.01 },
    { l:'critPerLevel', kind:'num', o:GEAR, k:'critPerLevel', step:0.0001 },
    { l:'gildedPerLevel', kind:'num', o:GEAR, k:'gildedPerLevel', step:0.0001 },
    { l:'flat dmg/nível', kind:'num', o:GEAR.flatPerLevel, k:'dmg' },
    { l:'flat hp/nível', kind:'num', o:GEAR.flatPerLevel, k:'hp' },
    { l:'flat aps/nível', kind:'num', o:GEAR.flatPerLevel, k:'aps', step:0.0005 },
    { l:'levelCap[] (por raridade)', kind:'arr', o:GEAR, k:'levelCap' },
    { l:'costMult[] (por raridade)', kind:'arr', o:GEAR, k:'costMult' },
    { l:'rarityMult[] (por raridade)', kind:'arr', o:GEAR, k:'rarityMult' },
  ]},
  { t:'Craft / Materiais (CRAFT)', f:[
    { l:'dropChance', kind:'num', o:CRAFT, k:'dropChance', step:0.005 },
    { l:'nextTierChance', kind:'num', o:CRAFT, k:'nextTierChance', step:0.001 },
    { l:'bossChunk', kind:'num', o:CRAFT, k:'bossChunk' },
    { l:'rarityUpMaterial', kind:'num', o:CRAFT, k:'rarityUpMaterial' },
    { l:'refinoRatio', kind:'num', o:CRAFT, k:'refinoRatio' },
  ]},
  { t:'Convergence (CONVERGENCE)', f:[
    { l:'bonusPerConv (+dano/HP)', kind:'num', o:CONVERGENCE, k:'bonusPerConv', step:0.05 },
    { l:'goldBonusPerConv (+Gold)', kind:'num', o:CONVERGENCE, k:'goldBonusPerConv', step:0.005 },
    { l:'gateLevelBase (1º gate)', kind:'num', o:CONVERGENCE, k:'gateLevelBase' },
    { l:'gateLevelGrowth (×gate)', kind:'num', o:CONVERGENCE, k:'gateLevelGrowth', step:0.05 },
    { l:'headstartFrac', kind:'num', o:CONVERGENCE, k:'headstartFrac', step:0.05 },
  ]},
  { t:'Despertar (DESPERTAR + req T2)', f:[
    { l:'mult (×poder/tier)', kind:'num', o:DESPERTAR, k:'mult', step:0.5 },
    { l:'critRateAdd (/tier)', kind:'num', o:DESPERTAR, k:'critRateAdd', step:0.01 },
    { l:'critDmgAdd (/tier)', kind:'num', o:DESPERTAR, k:'critDmgAdd', step:0.5 },
    { l:'apsAdd (/tier)', kind:'num', o:DESPERTAR, k:'apsAdd', step:0.1 },
    { l:'lumensBonus (/tier)', kind:'num', o:DESPERTAR, k:'lumensBonus', step:0.1 },
    { l:'xpBonus (/tier)', kind:'num', o:DESPERTAR, k:'xpBonus', step:0.05 },
    { l:'req T2: subárea', kind:'num', o:DESPERTAR_REQ[1], k:'subarea', step:1 },
    { l:'req T2: kills', kind:'num', o:DESPERTAR_REQ[1], k:'kills' },
    { l:'req T2: nível', kind:'num', o:DESPERTAR_REQ[1], k:'level' },
    { l:'req T2: materiais T1', kind:'num', o:DESPERTAR_REQ[1], k:'t1' },
  ]},
  { t:'Gilded (GILDED)', f:[
    { l:'chanceCap (teto global)', kind:'num', o:GILDED, k:'chanceCap', step:0.05 },
    { l:'T1 hpMult', kind:'num', o:GILDED.tiers[0], k:'hpMult', step:0.1 },
    { l:'T1 lumensMult', kind:'num', o:GILDED.tiers[0], k:'lumensMult', step:0.1 },
    { l:'T1 xpMult', kind:'num', o:GILDED.tiers[0], k:'xpMult', step:0.1 },
  ]},
];

const SIM = { capHours: 48, noDesp: 0 };

// Guarda os valores padrão (deep) p/ o botão Restaurar
const DEFAULTS = groups.flatMap(g => g.f).map(f => ({ f, val: read(f) }));

function read(f){
  if (f.get) return f.get();
  if (f.kind === 'arr') return [...f.o[f.k]];
  return f.o[f.k];
}
function write(f, raw){
  if (f.kind === 'arr'){
    const parts = String(raw).split(',').map(s => Number(s.trim())).filter(x => !isNaN(x));
    const arr = f.get ? f.get() : f.o[f.k];
    for (let i = 0; i < arr.length && i < parts.length; i++) arr[i] = parts[i];
    return;
  }
  const v = Number(raw);
  if (isNaN(v)) return;
  if (f.set) f.set(v); else f.o[f.k] = v;
}

// ── Monta o formulário ──
const form = document.getElementById('form');
for (const g of groups){
  const d = document.createElement('details'); if (g.open) d.open = true;
  const s = document.createElement('summary'); s.textContent = g.t; d.appendChild(s);
  const grid = document.createElement('div'); grid.className = 'grid';
  for (const f of g.f){
    const wrap = document.createElement('div'); wrap.className = 'fld' + (f.kind === 'arr' ? ' full' : '');
    const lab = document.createElement('label'); lab.textContent = f.l;
    const inp = document.createElement('input');
    inp.value = f.kind === 'arr' ? read(f).join(', ') : read(f);
    if (f.kind === 'num'){ inp.type = 'text'; inp.inputMode = 'decimal'; }
    inp.dataset.idx = groups.flatMap(x=>x.f).indexOf(f);
    f._input = inp;
    wrap.appendChild(lab); wrap.appendChild(inp); grid.appendChild(wrap);
  }
  d.appendChild(grid); form.appendChild(d);
}

function applyInputs(){
  for (const g of groups) for (const f of g.f) write(f, f._input.value);
}

// ── Simulação (adaptada de tools/sim/game_harness.mjs) ──
const DT = 0.1;
const avgGearLevel = (st) => GEAR.pieces.reduce((s,d)=>s+st.gear[d.key].level,0) / GEAR.pieces.length;
const minRarity = (st) => Math.min(...GEAR.pieces.map(d=>st.gear[d.key].rarity));

function buyGearGreedy(st){
  let guard=0;
  while(guard++<5000){
    let best=null,bestCost=Infinity;
    for(const def of GEAR.pieces){ const p=st.gear[def.key]; if(atLevelCap(p,st))continue; const c=levelCost(p); if(c<bestCost){bestCost=c;best=def.key;} }
    if(!best||st.lumens<bestCost)break;
    if(!buyLevel(st,best))break;
  }
}
function rarityUpGreedy(st){ let did=true; while(did){did=false; for(const def of GEAR.pieces) if(canRarityUp(st,def.key)){doRarityUp(st,def.key);did=true;}} }

function bestFarmArea(st){
  const map=getCurrentMap(st);
  const d=dps(st), hp=playerHpMax(st), def=playerDefesa(st), lvl=runLevel(st);
  const bDmg=COMBAT.baseDmg+lvl*LEVEL.dmgPerLevel;
  for(let s=st.unlockedSubarea;s>=1;s--){
    const mobHp=bDmg*ENEMY.hitsToKill*ENEMY.areaHp[s-1];
    const size=map.packSizes[s-1];
    const tClear=(size*mobHp)/d;
    const packDps=hp*ENEMY.dmgFrac*ENEMY.areaDmg[s-1];
    const armored=(packDps*packDps)/(def+packDps);
    const taken=armored*(tClear/2)-hp*0.01*(tClear/2);
    if(taken<hp*0.8) return s;
  }
  return 1;
}

function runSim(){
  const st = createInitialState();
  st.player.hp = playerHpMax(st);
  resetPack(st);

  const M = { lvl2:null, conv1:null, despertar:null, sub9:null, wallSpawn:null, wallKill:null };
  const areas = [];           // snapshot quando cada sub-área é liberada
  let despSnap=null, firstWallSnap=null, firstWallHp=null;
  let t=0, deaths=0, wallAttempts=0, prevDead=false, prevUnlocked=0;
  const CAP_T = SIM.capHours*3600;
  const MAX_TICKS = Math.min(CAP_T/DT, 5_000_000);

  // snapshot da área inicial
  const snap = (s) => ({ area:s, t, lvl:runLevel(st), dps:dps(st), hp:playerHpMax(st),
    aps:currentAPS(st), crit:critChance(st), gear:avgGearLevel(st), conv:st.convergences,
    mobHp:(COMBAT.baseDmg+runLevel(st)*LEVEL.dmgPerLevel)*ENEMY.hitsToKill*ENEMY.areaHp[s-1] });

  let ticks=0;
  while(ticks++<MAX_TICKS){
    if(ticks%30===1){ const tgt=bestFarmArea(st); if(tgt!==st.subarea) enterSubarea(st,tgt); }
    combatTick(st,DT); t+=DT;
    if(ticks%10===0){ buyGearGreedy(st); rarityUpGreedy(st); }
    if(canConverge(st)){ doConverge(st); if(M.conv1===null)M.conv1=t; }
    if(!SIM.noDesp && canDespertar(st)){ doDespertar(st); if(M.despertar===null){ M.despertar=t; despSnap={lvl:runLevel(st),gear:avgGearLevel(st),kills:st.killsTotal,sub:st.unlockedSubarea}; } }

    const lvl=runLevel(st);
    if(M.lvl2===null&&lvl>=2)M.lvl2=t;
    // registra snapshot a cada nova sub-área liberada
    if(st.unlockedSubarea>prevUnlocked){ for(let s=prevUnlocked+1;s<=st.unlockedSubarea;s++) areas.push(snap(s)); prevUnlocked=st.unlockedSubarea; }
    if(M.sub9===null&&st.unlockedSubarea>=9)M.sub9=t;

    if(st.subarea===9&&bossActive(st)&&M.wallSpawn===null){
      M.wallSpawn=t; wallAttempts++; firstWallHp=playerHpMax(st);
      firstWallSnap={lvl,gear:avgGearLevel(st),aps:currentAPS(st),dps:dps(st),conv:st.convergences};
    }
    if(st.player.dead&&!prevDead){ deaths++; if(st.subarea===9)wallAttempts++; }
    prevDead=st.player.dead;

    if(st.bossDefeated[8]&&M.wallKill===null){ M.wallKill=t; break; }
  }
  return { st, M, areas, despSnap, firstWallSnap, firstWallHp, t, deaths, wallAttempts, timedOut: t>=CAP_T };
}

// ── Render ──
function render(r){
  const { st, M, areas, despSnap, firstWallSnap, firstWallHp, t, deaths } = r;
  const cls = (v) => v ? 'ok' : 'bad';
  const sum = `
    <div class="sum">
      <div><span>nível 2</span><b>${fmtT(M.lvl2)}</b></div>
      <div><span>1ª Convergence (gate ${convGateLevel(0)})</span><b>${fmtT(M.conv1)}</b></div>
      <div><span>Despertar T2</span><b>${fmtT(M.despertar)}</b></div>
      <div><span>Sub 9 liberada</span><b>${fmtT(M.sub9)}</b></div>
      <div><span>Wall (boss) surge</span><b>${fmtT(M.wallSpawn)}</b></div>
      <div><span>Wall derrotada</span><b class="${cls(M.wallKill)}">${M.wallKill?fmtT(M.wallKill):'não limpou'}</b></div>
      <div><span>mortes totais</span><b>${deaths}</b></div>
      <div><span>tempo simulado</span><b>${fmtT(t)}</b></div>
    </div>`;

  const fim = `<b>Estado no fim:</b>  nível ${runLevel(st)} · conv ${st.convergences} · despertares ${st.despertares||0}
gear médio ${avgGearLevel(st).toFixed(0)} · raridade mín ${GEAR_RARITY_LABELS[minRarity(st)]} (cap ${levelCapFor({rarity:minRarity(st),level:0},st)})
APS ${currentAPS(st).toFixed(2)} · dps ${fmt(dps(st))} · crit ${(critChance(st)*100).toFixed(1)}% ×${critDamageMult(st).toFixed(2)} · HP ${fmt(playerHpMax(st))}`;

  const wall = despSnap ? `\n<b>No Despertar:</b> Sub ${despSnap.sub} · nível ${despSnap.lvl} · gear ${despSnap.gear.toFixed(0)} · ${despSnap.kills} kills` : '';
  const wall2 = firstWallSnap ? `\n<b>1º encontro c/ a Wall:</b> nível ${firstWallSnap.lvl} · gear ${firstWallSnap.gear.toFixed(0)} · conv ${firstWallSnap.conv} · APS ${firstWallSnap.aps.toFixed(2)} · dps ${fmt(firstWallSnap.dps)} · HP ${fmt(firstWallHp)}` : '';

  let rows = areas.map(a => {
    const htk = a.mobHp / damagePerHitAt(a);
    return `<tr><td>${a.area}</td><td>${fmtT(a.t)}</td><td>${a.lvl}</td><td>${fmt(a.mobHp)}</td><td>${htk.toFixed(1)}</td><td>${fmt(a.dps)}</td><td>${fmt(a.hp)}</td><td>${a.aps.toFixed(2)}</td><td>${(a.crit*100).toFixed(0)}%</td><td>${a.gear.toFixed(0)}</td><td>${a.conv}</td></tr>`;
  }).join('');
  const table = `<table><thead><tr><th>Área</th><th>quando</th><th>nível</th><th>HP mob</th><th>golpes/mob</th><th>dps</th><th>HP máx</th><th>APS</th><th>crit</th><th>gear</th><th>conv</th></tr></thead><tbody>${rows}</tbody></table>`;

  document.getElementById('result').innerHTML = sum + `<pre id="out">${fim}${wall}${wall2}</pre>` +
    `<canvas id="chart" width="720" height="280" style="width:100%;max-width:720px;border:1px solid var(--line);border-radius:8px;background:#fff;margin-top:6px"></canvas>` +
    `<p class="hint">Gráfico (escala log): <b style="color:#2f6fed">dps do player</b> vs <b style="color:#d23f3f">HP do mob</b> por área. Quando o HP do mob encosta/ultrapassa o dps você "trava" (Wall). Tabela: snapshot no momento em que cada sub-área é liberada — <b>golpes/mob</b> &gt; 1 = precisa upar.</p>` + table;
  drawChart(areas);
}

// Gráfico em canvas (sem libs): 2 séries em escala log10 por área
function drawChart(areas){
  const cv = document.getElementById('chart'); if(!cv||!areas.length) return;
  const ctx = cv.getContext('2d'); const W=cv.width, H=cv.height;
  const padL=54, padR=14, padT=14, padB=28;
  ctx.clearRect(0,0,W,H);
  const xs = areas.map(a=>a.area);
  const series = [
    { key:'dps', color:'#2f6fed', label:'dps' },
    { key:'mobHp', color:'#d23f3f', label:'HP mob' },
  ];
  let lo=Infinity, hi=-Infinity;
  for(const a of areas) for(const s of series){ const v=Math.log10(Math.max(1,a[s.key])); lo=Math.min(lo,v); hi=Math.max(hi,v); }
  if(!isFinite(lo)){lo=0;hi=1;} if(hi-lo<1)hi=lo+1;
  const xMin=Math.min(...xs), xMax=Math.max(...xs);
  const X = (x)=> padL + (xMax===xMin?0.5:(x-xMin)/(xMax-xMin))*(W-padL-padR);
  const Y = (logv)=> H-padB - (logv-lo)/(hi-lo)*(H-padT-padB);
  // grid + rótulos y (potências de 10)
  ctx.strokeStyle='#eef2f8'; ctx.fillStyle='#5b6b80'; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='right'; ctx.textBaseline='middle';
  for(let p=Math.floor(lo); p<=Math.ceil(hi); p++){ const y=Y(p); ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke(); ctx.fillText('1e'+p, padL-6, y); }
  // eixo x (áreas)
  ctx.textAlign='center'; ctx.textBaseline='top';
  for(const x of xs){ ctx.fillText('A'+x, X(x), H-padB+6); }
  // linhas
  for(const s of series){
    ctx.strokeStyle=s.color; ctx.fillStyle=s.color; ctx.lineWidth=2; ctx.beginPath();
    areas.forEach((a,i)=>{ const px=X(a.area), py=Y(Math.log10(Math.max(1,a[s.key]))); i?ctx.lineTo(px,py):ctx.moveTo(px,py); });
    ctx.stroke();
    areas.forEach(a=>{ const px=X(a.area), py=Y(Math.log10(Math.max(1,a[s.key]))); ctx.beginPath(); ctx.arc(px,py,3,0,7); ctx.fill(); });
  }
  // legenda
  ctx.textAlign='left'; ctx.textBaseline='middle'; let lx=padL+6;
  for(const s of series){ ctx.fillStyle=s.color; ctx.fillRect(lx,padT+2,12,4); ctx.fillText(s.label, lx+16, padT+4); lx+=90; }
}
// damagePerHit no momento do snapshot não é guardado; recalculamos pelo dps/aps/crit aproximado:
// dps = dmgHit × aps × (1 + crit×(critMult-1)). Para golpes/mob basta dmgHit ≈ dps / (aps×fatorCrit).
function damagePerHitAt(a){
  const fatorCrit = 1 + a.crit*1; // aproxima (crit dmg ~×2 médio); golpes/mob é indicativo
  return Math.max(1, a.dps / (a.aps*fatorCrit));
}

document.getElementById('run').addEventListener('click', () => {
  const btn = document.getElementById('run');
  btn.disabled = true; btn.textContent = '⏳ rodando…';
  document.getElementById('result').classList.add('running');
  setTimeout(() => {
    try { applyInputs(); render(runSim()); }
    catch(e){ document.getElementById('result').innerHTML = `<pre class="bad">Erro: ${e.message}\n${e.stack||''}</pre>`; }
    finally { btn.disabled=false; btn.textContent='▶ Rodar simulação'; document.getElementById('result').classList.remove('running'); }
  }, 30);
});

document.getElementById('reset').addEventListener('click', () => {
  for (const {f,val} of DEFAULTS){
    if (f.set) f.set(val); else if (f.kind==='arr'){ const arr=f.o[f.k]; for(let i=0;i<arr.length;i++)arr[i]=val[i]; } else f.o[f.k]=val;
    f._input.value = f.kind==='arr' ? read(f).join(', ') : read(f);
  }
});

// ── Presets: exporta/importa os valores dos campos (na ordem do form) ──
const allFields = () => groups.flatMap(g => g.f);
document.getElementById('export').addEventListener('click', () => {
  const preset = { _meta:'eclats playground preset', values: allFields().map(f => f._input.value) };
  const blob = new Blob([JSON.stringify(preset, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `eclats-preset-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0]; if(!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const p = JSON.parse(r.result);
      const vals = Array.isArray(p) ? p : p.values;
      if(!Array.isArray(vals)) throw new Error('formato inválido (esperado {values:[...]})');
      allFields().forEach((f,i)=>{ if(vals[i]!==undefined) f._input.value = vals[i]; });
      alert('Preset carregado. Clique em Rodar para aplicar.');
    } catch(err){ alert('Falha ao importar: '+err.message); }
    e.target.value='';
  };
  r.readAsText(file);
});
</script>
</body>
</html>
```

### `tools/sim/playtime.mjs`

```javascript
// DURAÇÃO DO JOGO por arquétipo de jogador. Estimativa com premissas explícitas.
// Relógio-mestre = custos de Ascension em Vestiges (§8); + overhead do "climb" de
// poder; + offline capado 24h (≤ ativo). Uso: node tools/sim/playtime.mjs
//
// ⚠️ ESTIMATIVA DE BAIXA CONFIANÇA (auditoria externa 2026-06-11):
//   O CLIMB_OVERHEAD foi AJUSTADO para reproduzir o alvo do GDD §9 (~14d/~41d).
//   Portanto a duração de ~14 dias é PREMISSA, não derivação — há CIRCULARIDADE
//   (o overhead foi escolhido para casar com o número que ele "valida").
//   Derivar o overhead de verdade exige um SIMULADOR END-TO-END (tick econômico
//   real: combate→renda→compras→prestígio), que NÃO existe ainda. Tratar os
//   números abaixo como ordem de grandeza, pendentes desse simulador.

import { ASCENSIONS } from '../../src/data/constants.js';

// ── relógio-mestre: Vestiges p/ cada Ascension (custo) e renda por mapa ──
// vestiges/kill no farm de sub-5 do mapa N ≈ ceil(5×0.5)×3^(N-1) = 3^N
const ascCost = [500000, 1900000, 4000000, 8000000]; // A1-A4 (A5 = grátis, só vencer Nihel)
const vestPerKill = (mapN) => 3 ** mapN;             // Map1=3 … Map4=81
const EFF_KILLS_PER_SEC = 5;   // média no climb (cap 15, mas boa parte sob-poder em vários hits)
const CLIMB_OVERHEAD = 6.0;    // ⚠️ PREMISSA CIRCULAR, não derivada (ver cabeçalho): 6.0 foi
                               // ESCOLHIDO p/ reproduzir o orçamento do GDD §9 (~14d/~41d), não
                               // calculado a partir da economia. Pendente de simulador end-to-end.

// horas ATIVAS-equivalentes p/ completar (floor do relógio × overhead do climb)
let vestHours = 0;
for (let n = 1; n <= 4; n++) vestHours += ascCost[n - 1] / (EFF_KILLS_PER_SEC * vestPerKill(n) * 3600);
const map5Hours = 8; // climb p/ vencer Nihel (sem custo de Vestige)
const TOTAL_ACTIVE_H = (vestHours + map5Hours) * CLIMB_OVERHEAD;

// ── offline: ≤ ativo, generoso mas não 100%; cap 24h por retorno ──
const OFFLINE_EFF = 0.7;   // offline rende 70% do ativo (Willian: "não deixe fraco", mas ≤ ativo)
const OFFLINE_CAP_H = 24;

// efetivo de horas de progresso por dia, dado: horas com aba aberta + ausência capada
function effHoursPerDay({ activeH, hoursBetweenLogin }) {
  // num de logins por dia e ausência média por login
  const loginsPerDay = 24 / hoursBetweenLogin;
  const offlinePerLogin = Math.min(OFFLINE_CAP_H, hoursBetweenLogin - activeH / loginsPerDay);
  const offlineEffPerDay = loginsPerDay * offlinePerLogin * OFFLINE_EFF;
  return Math.min(24, activeH + offlineEffPerDay);
}

const archetypes = {
  'INTENSO (botão muito ativo)': { activeH: 6,   hoursBetweenLogin: 8 },   // ~6h/dia aba aberta, loga 3×/dia
  'CASUAL (alvo do game)':       { activeH: 1.5, hoursBetweenLogin: 24 },  // ~1.5h/dia, loga 1×/dia (pega offline)
  'LEVE (entra pouco)':          { activeH: 1.5, hoursBetweenLogin: 84 },  // ~2 logins/semana (a cada 3.5d)
};

console.log('DURAÇÃO TOTAL DO JOGO BASE (A1→A5, vencer Nihel) — estimativa\n');
console.log(`Premissas: ${TOTAL_ACTIVE_H.toFixed(0)}h ativas-equiv. p/ completar`);
console.log(`  (relógio Vestige ${vestHours.toFixed(0)}h + Map5 ${map5Hours}h, × overhead climb ${CLIMB_OVERHEAD})`);
console.log(`  offline = ${OFFLINE_EFF*100}% do ativo, cap ${OFFLINE_CAP_H}h/retorno.\n`);
console.log('arquétipo                      | aba/dia | login | h efetivas/dia | DURAÇÃO');
console.log('-'.repeat(78));
for (const [name, p] of Object.entries(archetypes)) {
  const eff = effHoursPerDay(p);
  const days = TOTAL_ACTIVE_H / eff;
  const dur = days < 14 ? `${days.toFixed(0)} dias` : days < 60 ? `${(days/7).toFixed(1)} semanas` : `${(days/30).toFixed(1)} meses`;
  console.log(`${name.padEnd(30)} | ${(p.activeH+'h').padStart(6)} | ${(p.hoursBetweenLogin+'h').padStart(5)} | ${eff.toFixed(1).padStart(11)}   | ${dur} (${days.toFixed(0)}d)`);
}
console.log('\nINSIGHT: o offline generoso (24h, 70%) faz o CASUAL quase acompanhar o INTENSO');
console.log('(bom p/ o alvo do game). O LEVE perde tempo: o cap de 24h desperdiça ausências longas.');
console.log('Ajuste premissas (overhead, offline%, horas) p/ ver sensibilidade.');
```

### `tools/sim/powercurve.mjs`

```javascript
// Curva de poder vs necessidade nos 10 checkpoints (entrada + sub5 de cada mapa).
// Modela o investimento de Mémoire APROPRIADO p/ a profundidade (Clarté ≈ 0.74×h, Camada 6)
// e mede o OVERSHOOT estrutural = quanto os efeitos INDIVIDUAIS (#1 du Premier Matin + #10 de
// la Blessure) empurram o dano ACIMA do necessário. Gap deve ser pequeno e CONSTANTE.
// Uso: node tools/sim/powercurve.mjs
import { createInitialState } from '../../src/core/state.js';
import { MAPS } from '../../src/data/constants.js';
import { hpForLevel, subareaLevelRange } from '../../src/game/enemies.js';
import { memoireDmgMult, clarte } from '../../src/game/memoires.js';
import { levelBonus as lvlBonus } from '../../src/game/stats.js';

const d = (x) => Math.log10(x);
const MEMOIRE_SHARE = 0.74;
const CLARTE_LOG = Math.log10(1.07);

// nível de Mémoire (por relíquia) apropriado p/ one-shotar HP=H: Clarté ≈ 0.74×log10(H)
const memLevelFor = (h) => Math.round((MEMOIRE_SHARE * h / CLARTE_LOG) / 15);

function memOvershoot(h) {
  const L = memLevelFor(h);
  const s = createInitialState();
  s.memoires = s.memoires.map(() => L);
  const indiv = d(memoireDmgMult(s)) - d(clarte(s)); // #1 + #10 acima da Clarté
  return { L, indiv };
}

// xpTotal típico ao farmar HP=H (xp/kill ∝ mob_hp): ~H acumulado → level_bonus
const levelBonusAt = (h) => d(lvlBonus(10 ** h));

console.log('checkpoint           |  h (log10 HP) | Mém L | gap Mém #1+#10 | gap level_bonus');
console.log('-'.repeat(78));
const rows = [];
for (const m of MAPS) {
  for (const [tag, sub] of [['entrada(sub1)', 1], ['sub5', m.subareaCount]]) {
    const r = subareaLevelRange(m, sub);
    const hp = hpForLevel(m, Math.sqrt(r.lo * r.hi));
    const h = d(hp);
    const { L, indiv } = memOvershoot(h);
    const lb = levelBonusAt(h);
    rows.push({ map: m.id, tag, h, L, indiv, lb });
    console.log(`Map${m.id} ${tag.padEnd(14)} | ${h.toFixed(1).padStart(11)} | ${String(L).padStart(5)} | ${indiv.toFixed(2).padStart(11)}    | ${lb.toFixed(2).padStart(11)}`);
  }
}
const first = rows[0], last = rows[rows.length - 1];
console.log('-'.repeat(78));
console.log(`\nGap Mémoire (#1+#10): ${first.indiv.toFixed(1)} déc (Map1) → ${last.indiv.toFixed(1)} déc (Map5) — ABRE ${(last.indiv - first.indiv).toFixed(1)} déc na jornada`);
console.log(`Gap level_bonus:      ${first.lb.toFixed(1)} déc (Map1) → ${last.lb.toFixed(1)} déc (Map5) — quase constante (offset)`);
console.log(`\nVEREDITO: gap total abre ${((last.indiv+last.lb)-(first.indiv+first.lb)).toFixed(0)} déc do Map1 ao Map5.`);
console.log(`(quebrado se >20; "paredes constantes" se pequeno e estável)`);
```

### `tools/sim/sim.mjs`

```javascript
// Simulador de calibração — Éclats of Lumière
// Importa as fórmulas REAIS (malha §3, combate §4, economia §12) e mostra os
// números que o jogo produz por mapa/sub-área. Uso: `node tools/sim/sim.mjs`.
//
// Objetivo da Camada 2 (Sobrevivência): ver dano dos mobs × HP × packDps e o
// "headroom" de sobrevivência, e comparar a curva de dano do CÓDIGO com a
// curva canônica do GDD §4 (que divergem nos Maps 2-5).

import { MAPS, COMBAT } from '../../src/data/constants.js';
import { hpForLevel, dmgForLevel, subareaLevelRange } from '../../src/game/enemies.js';

const fmt = (x) => {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e < 6) return x.toLocaleString('en', { maximumFractionDigits: 1 });
  return x.toExponential(2);
};

// Curva de dano CANÔNICA do GDD §4 (tabela "Dano dos mobs"), p/ comparar com o código.
const GDD_DMG = [
  { lo: 1, hi: 1e4 },     // M1
  { lo: 1e4, hi: 1e12 },  // M2
  { lo: 1e12, hi: 1e26 }, // M3
  { lo: 1e26, hi: 1e46 }, // M4
  { lo: 1e46, hi: 1e75 }, // M5
];

// (CP-2: o pack agora vem direto de map.packSizes — 8 sub-áreas.)

// Média geométrica = mob "representativo" do range (a malha sorteia no log)
const geomean = (lo, hi) => Math.sqrt(lo * hi);

console.log('='.repeat(78));
console.log('SIMULADOR — Camada 2 (Sobrevivência). Números reais da malha §3/§4.');
console.log('='.repeat(78));

for (const map of MAPS) {
  console.log(`\n### MAP ${map.id} — ${map.name}`);
  console.log(`    levels ${fmt(map.lvlLo)}–${fmt(map.lvlHi)} · HP ${fmt(map.hpLo)}–${fmt(map.hpHi)}`);
  console.log(`    dano CÓDIGO ${fmt(map.dmgLo)}–${fmt(map.dmgHi)}  |  dano GDD§4 ${fmt(GDD_DMG[map.id-1].lo)}–${fmt(GDD_DMG[map.id-1].hi)}`);
  console.log('    sub | mobHP(rep) | mobDmg(cod) | mobDmg(GDD) | pack | packDps(cod) | dmg/HP(cod)');

  for (let s = 1; s <= map.subareaCount; s++) {
    const { lo, hi } = subareaLevelRange(map, s);
    const repLevel = geomean(lo, hi);
    const mobHp = hpForLevel(map, repLevel);
    const mobDmgCode = dmgForLevel(map, repLevel);
    // dano GDD §4 interpolado na mesma malha (log do level)
    const t = (Math.log(repLevel) - Math.log(map.lvlLo)) / (Math.log(map.lvlHi) - Math.log(map.lvlLo));
    const g = GDD_DMG[map.id - 1];
    const mobDmgGdd = g.lo * (g.hi / g.lo) ** t;
    const pack = map.packSizes[s - 1]; // CP-2: pack real do mapa (8 sub-áreas)
    const packDps = pack * mobDmgCode;
    const ratio = mobDmgCode / mobHp;
    console.log(
      `     ${s}  | ${fmt(mobHp).padStart(9)} | ${fmt(mobDmgCode).padStart(11)} | ${fmt(mobDmgGdd).padStart(11)} | ${String(pack).padStart(4)} | ${fmt(packDps).padStart(12)} | ${ratio.toExponential(1)}`
    );
  }
  // boss final do mapa (Sub 5)
  const bl = Math.round(subareaLevelRange(map, map.subareaCount).hi);
  const bossHp = hpForLevel(map, bl) * COMBAT.bossHpMult;
  const bossDmg = dmgForLevel(map, bl) * COMBAT.bossDmgMult;
  console.log(`    BOSS final: HP ${fmt(bossHp)} (×${COMBAT.bossHpMult}) · dano ${fmt(bossDmg)} (×${COMBAT.bossDmgMult})`);
}

console.log('\n' + '='.repeat(78));
console.log('LEITURA: dmg/HP(cod) mostra quão letal é o mob vs o próprio HP.');
console.log('No código M2-5 dmg≈HP×0.01..0.1 (alto); no GDD§4 o dano é MUITO menor.');
console.log('='.repeat(78));
```

### `tools/sim/survival.mjs`

```javascript
// Camada 2 — Sobrevivência. Simula uma ONDA tick-a-tick (igual ao combatTick)
// com jogador parametrizado, p/ escolher a razão dano/HP CONSTANTE e a curva
// de Defesa. Uso: `node tools/sim/survival.mjs`.
//
// Modelo do jogador é power-independent: descrito por
//   k  = damagePerHit / mobHp   (k≥1 = one-shot; k<1 = precisa de 1/k hits)
//   hp = 5.4 × damagePerHit     (HP rastreia o dano: hp_max/dano = (50/7)×(vit/str)≈5.4)
//   def = defMult × packDps     (defMult=0 sem Veil; 1 = def≈packDps = 50% mit)

import { COMBAT } from '../../src/data/constants.js';

const APS = 15;                 // Camada 1
const PACK = [2, 4, 6, 9, 12];  // Camada 1
const RATIO = 0.02;             // razão dano/HP CONSTANTE candidata

// Simula uma onda. Retorna {survived, clearTime, minHpFrac}.
function simWave({ mobHp, packSize, k, hpMax, def }) {
  const dt = 0.1;
  const damagePerHit = k * mobHp;
  const mobDmg = RATIO * mobHp;
  let mobs = Array.from({ length: packSize }, () => mobHp);
  let hp = hpMax, t = 0, minHp = hpMax, attackAcc = 0;
  const interval = 1 / APS;
  while (t < 600) {
    // ataques do jogador (1 alvo: menor HP vivo; máx 1 kill/ataque)
    attackAcc += dt;
    while (attackAcc >= interval) {
      attackAcc -= interval;
      let ti = -1, lo = Infinity;
      for (let i = 0; i < mobs.length; i++) if (mobs[i] > 0 && mobs[i] < lo) { lo = mobs[i]; ti = i; }
      if (ti < 0) break;
      mobs[ti] -= damagePerHit;
      if (mobs[ti] <= 0) hp = Math.min(hpMax, hp + hpMax * COMBAT.regenOnKill); // regen on-kill
    }
    if (mobs.every((m) => m <= 0)) return { survived: true, clearTime: t, minHpFrac: minHp / hpMax };
    // dano do pack (vivos) com mitigação por razão/armadura
    const packDps = mobs.reduce((s, m) => s + (m > 0 ? mobDmg : 0), 0);
    const taken = (packDps * packDps) / (def + packDps); // = packDps×(1−def/(def+packDps))
    hp -= taken * dt;
    hp = Math.min(hpMax, hp + hpMax * COMBAT.regenPerSec * dt); // regen/s
    minHp = Math.min(minHp, hp);
    if (hp <= 0) return { survived: false, clearTime: t, minHpFrac: 0 };
    t += dt;
  }
  return { survived: false, clearTime: t, minHpFrac: minHp / hpMax };
}

const mobHp = 1e6; // escala arbitrária (resultado é power-independent, só razões importam)
console.log(`Razão dano/HP CONSTANTE = ${RATIO}.  APS=${APS}.  (mobHp de referência = ${mobHp})\n`);

for (const packSize of [2, 12]) {
  console.log(`--- pack ${packSize} (${packSize === 2 ? 'sub1' : 'sub5'}) ---`);
  for (const k of [1, 0.3, 0.1, 0.03, 0.01]) {
    const hpMax = 5.4 * k * mobHp;
    const packDps = packSize * RATIO * mobHp;
    for (const defMult of [0, 1, 4]) {
      const def = defMult * packDps;
      const r = simWave({ mobHp, packSize, k, hpMax, def });
      const tag = r.survived ? `OK  limpa em ${r.clearTime.toFixed(1)}s, HP mín ${(r.minHpFrac*100).toFixed(0)}%`
                             : `MORRE em ${r.clearTime.toFixed(1)}s`;
      console.log(`  k=${String(k).padEnd(5)} def=${defMult}×packDps : ${tag}`);
    }
  }
  console.log('');
}
```
