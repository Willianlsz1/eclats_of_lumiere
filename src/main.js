// =============================================================
// main.js — inicialização e o relógio do jogo (game loop)
// =============================================================

(function () {
  function init() {
    // 1) carrega ou cria o save
    const loaded = G.state.load();

    // 2) progresso offline (idle) — quanto tempo ficou fora?
    let idleMsg = null;
    if (loaded && G.state.data.lastSeen) {
      const away = (Date.now() - G.state.data.lastSeen) / 1000;
      const before = { lumens: G.state.data.lumens, level: G.state.data.level };
      const r = G.combat.simulateIdle(away);
      if (r) {
        const ganhoLumens = G.state.data.lumens - before.lumens;
        const ganhoNivel = G.state.data.level - before.level;
        idleMsg = `🌙 Enquanto esteve fora (${Math.floor(r.seconds / 60)} min): +${G.util.fmt(ganhoLumens)} ✦, +${ganhoNivel} níveis.`;
      }
    }

    // 3) prepara a UI
    G.ui.cache();
    G.ui.bind();
    G.combat.spawn();
    G.ui.renderAll();
    G.ui.renderEnemy();

    G.ui.log("✦ Bem-vindo a Éclats of Lumière — The Dreaming Wood.", "boss");
    if (idleMsg) G.ui.log(idleMsg, "level");
    if (!G.state.storageOk())
      G.ui.log("⚠ Aberto como arquivo local — o progresso NÃO será salvo. Use o atalho \"Jogar Eclats\" para salvar.", "bad");

    // 4) o relógio: avança o combate em passos fixos
    let last = Date.now();
    setInterval(() => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      if (!G.combat.paused) G.combat.tick(dt); // respeita a pausa
      G.ui.renderEnemy();
      G.ui.renderHeroHp();
    }, 100); // 10x por segundo

    // 5) atualiza painéis (mais leve) 1x por segundo
    setInterval(() => {
      G.ui.renderResources();
      G.ui.renderHero();
      G.ui.renderHud();
    }, 1000);

    // 6) salva automaticamente a cada 10s e ao fechar
    setInterval(() => G.state.save(), 10000);
    window.addEventListener("beforeunload", () => G.state.save());

    // atalho de debug no console: G.state.reset() + reload
    window.G = G;
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
