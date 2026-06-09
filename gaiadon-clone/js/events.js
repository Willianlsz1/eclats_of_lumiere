// ===== Event dispatch =====
// Handles all events emitted by tick(). One place to add new event effects.
// Estado mutável (acumuladores de hit, surge anterior) é encapsulado num contexto
// criado por createEventCtx(). main.js cria um; testes podem criar um fresh.

function createEventCtx() {
  return { floatAccum: 0, floatTick: 0, prevSurgeCount: -1, floatCritTier: "normal" };
}

function dispatchEvents(events, state, ctx) {
  for (const ev of events) {
    if (ev.type === "kill") {
      const tierPrefix = ev.tier === "champion" ? "💀 Champion " : ev.tier === "elite" ? "⚔️ Elite " : "";
      let msg = `Defeated ${tierPrefix}${ev.name}! +${fmt(ev.lumens)} Lumens, +${fmt(ev.vestiges)} Vestiges.`;
      if (ev.leveled) msg += ` Level ${state.level}!`;
      const tierCls = ev.tier === "champion" ? "champion-kill" : ev.tier === "elite" ? "elite-kill" : "";
      logMsg(msg, tierCls || undefined);

      if (ev.mapCleared) {
        const region = REGIONS[ev.map];
        logMsg(`🏆 ${region.name} concluído! Chefe final derrotado — Ascensão liberada! 🔮`, "milestone");
      } else if (ev.subareaAdvanced) {
        logMsg(`✅ Subárea ${ (ev.clearedSubarea || 0) + 1 } limpa! Avançando para a Subárea ${ ev.newSubarea + 1 }.`, "milestone");
      }
      if (ev.justMastered) {
        const rName = REGIONS[ev.masteredMap].name;
        logMsg(`⭐ ${rName} Dominado! +2% Lumens/XP/Vestiges para sempre.`, "mastered");
      }
    } else if (ev.type === "death") {
      logMsg(`💀 Derrotado na Subárea ${ev.diedOnSubarea + 1}! Progresso da subárea zerado — evolua o gear 🛡️ para avançar!`);
    } else if (ev.type === "hit") {
      ctx.floatAccum += ev.amount;
      // Acumula o tier mais alto visto neste intervalo de flush.
      if (ev.critTier === "radiant") ctx.floatCritTier = "radiant";
      else if (ev.critTier === "crit" && ctx.floatCritTier === "normal") ctx.floatCritTier = "crit";
    }
  }

  // Flush the accumulated damage every 3 ticks (~300ms).
  if (++ctx.floatTick >= 3) {
    if (ctx.floatAccum > 0) {
      const isBoss    = state.enemies && state.enemies[0] && state.enemies[0].isBoss;
      const isCrit    = ctx.floatCritTier !== "normal";
      const isRadiant = ctx.floatCritTier === "radiant";
      spawnFloatingDamage(ctx.floatAccum, isBoss, isCrit, isRadiant);
      const nm = $("enemyName");
      if (nm) { nm.classList.add("hit"); setTimeout(() => nm.classList.remove("hit"), 120); }
      const em = $("enemySprite");
      if (em) { em.classList.add("emoji-hit"); setTimeout(() => em.classList.remove("emoji-hit"), 220); }
    }
    ctx.floatAccum = 0; ctx.floatTick = 0; ctx.floatCritTier = "normal";
  }
}
