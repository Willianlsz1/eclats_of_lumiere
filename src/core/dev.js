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
