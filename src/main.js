// main.js — inicialização e relógio do jogo

(function () {
  function init() {
    const loaded = G.state.load();

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

    G.ui.log("✦ Welcome to Éclats of Lumière.", "boss");
    if (idleMsg) G.ui.log(idleMsg, "level");
    if (!G.state.storageOk())
      G.ui.log("⚠ Opened as local file — progress will NOT be saved.", "bad");

    // combat: 10× per second
    let last = Date.now();
    setInterval(() => {
      const now = Date.now();
      const dt  = (now - last) / 1000;
      last = now;
      if (!G.combat.paused) G.combat.tick(dt);
      G.ui.renderEnemy();
      G.ui.renderHeroHp();
    }, 100);

    // UI: 1× per second
    setInterval(() => {
      G.ui.renderResources();
      G.ui.renderHud();
    }, 1000);

    // auto-save
    setInterval(() => G.state.save(), 10000);
    window.addEventListener("beforeunload", () => G.state.save());

    window.G = G;
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else
    init();
})();
