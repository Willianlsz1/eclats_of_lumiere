// ===== Event dispatch =====
// Handles all events emitted by tick(). One place to add new event effects.
// Callers (gameLoop) just pass the events array — no knowledge of handlers needed.
//
// Estado mutável (acumuladores de hit, surge anterior) é encapsulado num contexto
// criado por createEventCtx(). main.js cria um; testes podem criar um fresh.

function createEventCtx() {
  return { floatAccum: 0, floatTick: 0, prevSurgeCount: -1 };
}

function dispatchEvents(events, state, ctx) {
  // ── Synergy Surge notification ────────────────────────────────────────────
  // Detecta quando o count de surges aumenta (ocorre após um level-up de equipamento).
  const curSurge = synergySurgeCount(state);
  if (ctx.prevSurgeCount >= 0 && curSurge > ctx.prevSurgeCount) {
    logMsg(`⚡ Synergy Surge #${curSurge}! All stats ×${CONFIG.synergy.surgeMultiplier.toFixed(2)} · Total surge: ×${fmtMult(synergySurgeMult(state))}`, "milestone");
  }
  ctx.prevSurgeCount = curSurge;

  for (const ev of events) {
    if (ev.type === "kill") {
      const tierPrefix = ev.tier === "champion" ? "💀 Champion " : ev.tier === "elite" ? "⚔️ Elite " : "";
      let msg = `Defeated ${tierPrefix}${ev.name}! +${fmt(ev.gold)} gold, +${fmt(ev.shards)} shards.`;
      if (ev.leveled) msg += ` Level ${state.level}!`;
      const tierCls = ev.tier === "champion" ? "champion-kill" : ev.tier === "elite" ? "elite-kill" : "";
      logMsg(msg, tierCls || undefined);
      if (ev.walledCleared) {
        logMsg(`✨ Broke through to ${zoneName(ev.zone)}!`, "milestone");
        // Flash dourado no badge de zona
        const badge = $("zoneBadge");
        if (badge) { badge.classList.add("breakthrough"); setTimeout(() => badge.classList.remove("breakthrough"), 1400); }
      }
      if (ev.packIncreased) {
        logMsg(`⚠️ Larger packs in ${zoneName(ev.zone)} — tougher fights ahead!`);
      }
      if (ev.justMastered) logMsg(`⭐ ${zoneName(ev.masteredZone)} Mastered! +0.5% gold/xp/shards forever.`, "mastered");
    } else if (ev.type === "death") {
      logMsg(`💀 ${zoneName(ev.wallZone)} is too strong — upgrade gear 🛡️ to push through!`);
    } else if (ev.type === "hit") {
      ctx.floatAccum += ev.amount;
    }
  }

  // Flush the accumulated damage every 3 ticks (~300ms) for game-feel.
  if (++ctx.floatTick >= 3) {
    if (ctx.floatAccum > 0) {
      const isBoss = state.enemies && state.enemies[0] && state.enemies[0].isBoss;
      const isCrit = critRate(state) > 0 && Math.random() < critRate(state);
      const shown = isCrit ? ctx.floatAccum * critMult(state) : ctx.floatAccum;
      spawnFloatingDamage(shown, isBoss, isCrit);
      const nm = $("enemyName");
      nm.classList.add("hit");
      setTimeout(() => nm.classList.remove("hit"), 120);
      const em = $("enemySprite");
      if (em) { em.classList.add("emoji-hit"); setTimeout(() => em.classList.remove("emoji-hit"), 220); }
    }
    ctx.floatAccum = 0; ctx.floatTick = 0;
  }
}
