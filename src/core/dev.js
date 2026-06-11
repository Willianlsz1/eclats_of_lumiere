// Modo de TESTE/QA — abre o jogo com tudo desbloqueado e recursos fartos, para
// o Willian caçar inconsistências sem grind. Ativa com ?dev (ou ?unlock) na URL.
// NÃO afeta o jogo normal (sem o parâmetro, nada acontece). Remover no release.

export function maybeApplyDevUnlock(state) {
  const q = new URLSearchParams(window.location.search);
  if (!q.has('dev') && !q.has('unlock')) return false;

  // Recursos fartos (top-up: nunca diminui o que já houver)
  state.lumens   = Math.max(state.lumens, 1e12);   // Gold Stats + Gear à vontade
  state.vestiges = Math.max(state.vestiges, 1e9);  // Passivas à vontade
  state.xpTotal  = Math.max(state.xpTotal, 1e7);   // nível do Seeker decente

  // Gates abertos
  state.convergences = Math.max(state.convergences, 1); // libera as Passivas
  state.convPoints   = Math.max(state.convPoints, 20);  // conv_factor folgado
  state.unlockedSubarea = 5;                            // mapa todo navegável
  state.bossDefeated = [true, true, true, true, true];
  state.bestSubareaRun = Math.max(state.bestSubareaRun, 5);

  // Stats básicos pra sobreviver confortável enquanto explora
  state.stats.vit = Math.max(state.stats.vit, 40);
  state.stats.str = Math.max(state.stats.str, 30);

  return true;
}

// Selo visual discreto indicando que o modo de teste está ativo
export function showDevBadge() {
  const bar = document.querySelector('.topbar');
  if (!bar || document.getElementById('dev-badge')) return;
  const b = document.createElement('div');
  b.id = 'dev-badge';
  b.textContent = 'DEV';
  b.title = 'Modo de teste (?dev) — tudo desbloqueado';
  b.style.cssText = 'position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:30;'
    + 'background:#d9a441;color:#1a1206;font:700 12px/1 Inter,sans-serif;letter-spacing:.18em;'
    + 'padding:6px 12px;border-radius:999px;box-shadow:0 0 18px -4px #d9a441;';
  bar.appendChild(b);
}
