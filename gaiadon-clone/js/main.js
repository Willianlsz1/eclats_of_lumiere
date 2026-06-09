'use strict';

function init() {
  let state = loadGame();
  const isNew = !state;
  if (isNew) {
    state = defaultState();
  } else {
    // Offline calc
    const now  = Date.now();
    const dtMs = now - (state.lastTick || now);
    if (dtMs > 5000) {
      offlineCalc(dtMs / 1000);
      const dtSec = (dtMs / 1000).toFixed(0);
      state.eventLog = state.eventLog || [];
      state.eventLog.unshift(`Welcome back! Simulated ${formatTime(dtMs/1000)} offline.`);
    }
    state.lastTick = now;
  }

  // Init player HP to max if new game
  state.playerHpMax = calcHpMax(state);
  if (isNew) state.playerHp = state.playerHpMax;

  startLoop(state);
  switchTab('combat');
  _bindButtons();

  window.addEventListener('beforeunload', () => {
    G.lastTick = Date.now();
    saveGame(G);
  });
}

function _bindButtons() {
  // Gold Stats
  const stats = ['str','vit','agi','lck','frt','wis'];
  for (const s of stats) {
    const btn = document.getElementById(`btn-${s}`);
    if (btn) {
      btn.addEventListener('click', () => buyStat(s));
      btn.addEventListener('contextmenu', e => { e.preventDefault(); buyStatMax(s); });
    }
  }

  // Converge button
  const convBtn = document.getElementById('btn-converge');
  if (convBtn) convBtn.addEventListener('click', () => {
    const wall = xpWall(G.convergences);
    if (G.xpRun >= wall && G.bestGsub >= 1) {
      // converge is triggered automatically in tick, but allow manual too
      G.xpRun = wall; // ensure trigger next tick
    }
  });

  // Desktop tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Mobile bottom nav
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchMobilePanel(btn.dataset.mobile));
  });

  // Mobile sub-tab buttons
  document.querySelectorAll('.mobile-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => _switchMobileSubtab(btn.dataset.subtab));
  });

  // Hard reset button (hold Shift + click)
  const resetBtn = document.getElementById('btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', e => {
      if (!e.shiftKey) return;
      if (confirm('Hard reset? All progress will be lost!')) {
        stopLoop();
        deleteSave();
        location.reload();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
