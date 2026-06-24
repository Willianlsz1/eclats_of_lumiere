// main.js — inicialização e relógio do jogo

(function () {
  function init() {
    const loaded = G.state.load();

    // progresso offline
    let idleMsg = null;
    if (loaded && G.state.data.lastSeen) {
      const away  = (Date.now() - G.state.data.lastSeen) / 1000;
      const before = { lumens: G.state.data.lumens, level: G.state.data.level };
      const r = G.combat.simulateIdle(away);
      if (r) {
        const gl = G.state.data.lumens - before.lumens;
        const gn = G.state.data.level  - before.level;
        idleMsg = `🌙 While away (${Math.floor(r.seconds / 60)} min): +${G.util.fmt(gl)} ✦, +${gn} levels.`;
      }
    }

    G.ui.cache();
    G.ui.bind();
    G.combat.spawn();
    G.ui.renderAll();
    G.ui.renderEnemy();

    G.ui.log("✦ Welcome to Éclats of Lumière — The Dreaming Wood.", "boss");
    if (idleMsg) G.ui.log(idleMsg, "level");
    if (!G.state.storageOk())
      G.ui.log("⚠ Opened as local file — progress will NOT be saved. Use the \"Jogar Eclats\" shortcut.", "bad");

    // combate: 10x por segundo
    let last = Date.now();
    setInterval(() => {
      const now = Date.now();
      const dt  = (now - last) / 1000;
      last = now;
      if (!G.combat.paused) G.combat.tick(dt);
      G.ui.renderEnemy();
      G.ui.renderHeroHp();
    }, 100);

    // UI leve: 1x por segundo
    setInterval(() => {
      G.ui.renderResources();
      G.ui.renderHero();
      G.ui.renderHud();
    }, 1000);

    // auto-save: 10s + ao fechar
    setInterval(() => G.state.save(), 10000);
    window.addEventListener("beforeunload", () => G.state.save());

    window.G = G;
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else
    init();
})();
