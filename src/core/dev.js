// Modo de TESTE/QA — abre o jogo com tudo desbloqueado e recursos fartos, para
// o Willian caçar inconsistências sem grind. Ativa por ?dev na URL OU clicando
// no botão "DEV 🔓" (canto inferior esquerdo). NÃO afeta o jogo normal até ser
// ativado. Isolado aqui; remover no release.

// Aplica os desbloqueios no state (top-up: nunca diminui o que já houver)
export function applyDevUnlock(state) {
  state.lumens   = Math.max(state.lumens, 1e12);   // Gold Stats + Gear à vontade
  state.vestiges = Math.max(state.vestiges, 1e9);  // Passivas à vontade
  state.eclats   = Math.max(state.eclats, 1e9);    // Mémoires à vontade
  state.xpTotal  = Math.max(state.xpTotal, 1e7);   // nível do Seeker decente

  state.convergences = Math.max(state.convergences, 1); // libera as Passivas
  state.convPoints   = Math.max(state.convPoints, 20);  // conv_factor folgado
  state.unlockedSubarea = 5;                            // mapa todo navegável
  // boss final batido → A1 fica disponível pra testar a Ascension (não força
  // ascensions: assim dá pra clicar Ascender e ver o fluxo). Mémoires abrem
  // por era conforme você ascende.
  state.bossDefeated = [true, true, true, true, true];
  state.bestSubareaRun = Math.max(state.bestSubareaRun, 5);

  state.stats.vit = Math.max(state.stats.vit, 40);
  state.stats.str = Math.max(state.stats.str, 30);
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
    btn.remove();
    if (onApplied) onApplied();
  });
  document.body.appendChild(btn);
}
