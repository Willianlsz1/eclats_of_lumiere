// ===== Event dispatch =====
// Handles all events emitted by tick(). One place to add new event effects.
// Estado mutável (acumuladores de hit, surge anterior) é encapsulado num contexto
// criado por createEventCtx(). main.js cria um; testes podem criar um fresh.

function createEventCtx() {
  return { floatAccum: 0, floatTick: 0, prevSurgeCount: -1 };
}

function dispatchEvents(events, state, ctx) {
  // ── Synergy Surge notification ──
  const curSurge = synergySurgeCount(state);
  if (ctx.prevSurgeCount >= 0 && curSurge > ctx.prevSurgeCount) {
    logMsg(`⚡ Synergy Surge #${curSurge}! All stats ×${CONFIG.synergy.surgeMultiplier.toFixed(2)} · Total surge: ×${fmtMult(synergySurgeMult(state))}`, "milestone");
  }
  ctx.prevSurgeCount = curSurge;

  for (const ev of events) {
    if (ev.type === "kill") {
      const tierPrefix = ev.tier === "champion" ? "💀 Champion " : ev.tier === "elite" ? "⚔️ Elite " : "";
      let msg = `Defeated ${tierPrefix}${ev.name}! +${fmt(ev.lumens)} Lumens, +${fmt(ev.vestiges)} Vestiges.`;
      if (ev.leveled) msg += ` Level ${state.level}!`;
      const tierCls = ev.tier === "champion" ? "champion-kill" : ev.tier === "elite" ? "elite-kill" : "";
      logMsg(msg, tierCls || undefined);

      if (ev.difficultyCleared) {
        const region = REGIONS[ev.region];
        const diff   = DIFFICULTIES[ev.difficulty];
        logMsg(`🏆 ${region.name} · ${diff.name} cleared! New paths open on the world map.`, "milestone");
      }
      if (ev.waveAdvanced) {
        const total = totalWaves(state.difficulty);
        const nextBoss = isBossWave(state.wave, state.difficulty);
        if (nextBoss) {
          logMsg(`⚠️ Boss incoming! Prepare yourself!`, "milestone");
        }
      }
      if (ev.packIncreased) {
        logMsg(`⚠️ Larger packs ahead — tougher fights!`);
      }
      if (ev.justMastered) {
        const rName = REGIONS[ev.masteredRegion].name;
        logMsg(`⭐ ${rName} Mastered! +2% Lumens/XP/Vestiges forever.`, "mastered");
      }
    } else if (ev.type === "death") {
      const region = REGIONS[ev.region];
      const diff   = DIFFICULTIES[ev.difficulty];
      logMsg(`💀 Defeated on wave ${ev.diedOnWave}! Retreating to wave 1 — upgrade gear 🛡️ to push through!`);
    } else if (ev.type === "hit") {
      ctx.floatAccum += ev.amount;
    }
  }

  // Flush the accumulated damage every 3 ticks (~300ms).
  if (++ctx.floatTick >= 3) {
    if (ctx.floatAccum > 0) {
      const isBoss = state.enemies && state.enemies[0] && state.enemies[0].isBoss;
      const isCrit = critRate(state) > 0 && Math.random() < critRate(state);
      const shown = isCrit ? ctx.floatAccum * critMult(state) : ctx.floatAccum;
      spawnFloatingDamage(shown, isBoss, isCrit);
      const nm = $("enemyName");
      if (nm) { nm.classList.add("hit"); setTimeout(() => nm.classList.remove("hit"), 120); }
      const em = $("enemySprite");
      if (em) { em.classList.add("emoji-hit"); setTimeout(() => em.classList.remove("emoji-hit"), 220); }
    }
    ctx.floatAccum = 0; ctx.floatTick = 0;
  }
}
