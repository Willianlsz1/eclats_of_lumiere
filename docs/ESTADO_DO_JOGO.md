# Éclats of Lumière — Estado do Jogo (v0)

> **RECOMEÇO DO ZERO — 2026-06-20.** O modelo anterior (5 mapas, ondas+boss, gear/passivas/
> convergence/ascension/mémoires) foi **removido** e reconstruído do zero como o núcleo idle
> mínimo do recomeço. Todo o código antigo está preservado no git na tag
> **`pre-recomeco-2026-06-20`** (`git checkout pre-recomeco-2026-06-20` para recuperar).
> A auditoria que motivou isto está em `docs/eclats_auditoria_2026-06-20.md`.
> Fonte do design: `docs/eclats_recomeco_nucleo_2026-06-19.md` (§3 núcleo, §4 v0).

---

## O que o v0 entrega — "A primeira subida" (Área 1, lv 1→60)

Loop único e balanceável: **mob aparece (no seu nível) → auto-ataque (APS) mata → cai Gold +
XP → XP sobe o Nível, Gold compra upgrades → mata mais rápido → lv 60 = Área 1 limpa.**

| Sistema | Estado |
|---|---|
| **Combate** | ✅ auto, single-target, HP relativo, 1 mob por vez, regen, morte/respawn sem punição |
| **Nível/XP** | ✅ curva geométrica; mob acompanha o player até o cap da área |
| **Áreas** | ✅ Área 1 (lv 1→60); bater o cap destrava a próxima (gate por nível) |
| **Economia** | ✅ Gold/XP ∝ HP do mob; 2 upgrades (Forjar Dano, Reforçar Vida), custo geométrico |
| **UI** | ✅ pele Éclats (Seeker + mob + barras + floaties + painel de upgrades + barra de progresso da área) |
| **Save** | ✅ localStorage, schema v100 (saves antigos descartados), autosave 10s |
| **Testes** | ✅ vitest — 22 testes (player/enemy/economy/combat) |
| **Simulador** | ✅ `tools/sim/v0.mjs` — o "juiz": TTK/área, Dano÷HP, gold, décadas por fator |

**Fora do v0 (entram um por vez em v1+):** Convergence · Awaken · Gear · cleave · Ascension ·
Hollow · áreas 2+ · mobs raros/champion · passivas · mémoires · offline.

---

## Fórmulas (todas em `src/data/constants.js` — SEMENTES, afináveis pelo simulador)

```
# Player (base pequena por nível; o gold é que cresce)
dano  = baseDano(10) + (nível-1)×danoPerLevel(2) + upgrades.dano×4
hpMax = baseHp(100)  + (nível-1)×hpPerLevel(20)  + upgrades.vida×40
APS   = 1.0 (constante no v0)
regen = 4%/s do HP máx · +5% do HP máx por kill · respawn 3s (HP cheio, sem perdas)

# ÂNCORA: baseDano/baseHp = danoPerLevel/hpPerLevel = 0.1 → o Nível CANCELA na razão
#         Dano÷HP. Só upgrades de gold movem o tempo-de-kill no v0.

# Nível (curva geométrica)
xpToNext(L) = round(40 × 1.10^(L-1))

# Inimigo (HP relativo — segue o seu HP, nunca o seu dano)
hpMax = hpMax_player × 1.3(comum) × hpMult_área(1.0)
dmg   = 4 + nível × 1.5

# Economia
gold_por_kill = mob.hpMax × 0.5
xp_por_kill   = mob.hpMax × 0.45
custo_upgrade(n) = round(costBase × 1.15^n)   # dano: base 10 · vida: base 12
```

### Pacing medido (simulador, sementes atuais)
Subida lv1→60 em **~17 min** de jogo ativo · tempo-de-kill estável **~4–5s** · razão
Dano÷HP **0.33 → 0.27** (controlada). *Alvo de pacing a confirmar com o Willian.*

---

## Arquitetura (onde está cada coisa)

```
src/core/    format.js · loop.js (tick 100ms) · save.js (localStorage) · state.js (estado mínimo)
src/game/    player.js · enemy.js · economy.js  (PUROS, testáveis) · combat.js (orquestra o tick)
src/data/    constants.js (TODAS as constantes-semente) · assets.js (manifest de arte, auto-gerado)
src/ui/      shell.js (nav/coins/fit) · combat-view.js (cena) · tokens.css · shell.css · combat-view.css
src/main.js  bootstrap (load → init → loop → autosave)
tools/sim/   v0.mjs (o juiz — importa as fórmulas reais)
```

**Reset rápido (teste):** no console do navegador, `window.eclats.reset()` apaga o save e recarrega.

---

## Próximo (roadmap do recomeço — `docs/eclats_plano_v0_2026-06-19.md` §5)

1. **Tunar as sementes do v0** com o Willian (alvo de tempo da subida + feel do tempo-de-kill).
2. **v1 — Convergence** (loop de prestígio): travar a fórmula-raiz (4× / 8× / 128×) no
   simulador *antes* de codar; reseta nível+gold, mantém áreas, +% acumulativo.
3. **v2+** — Gear, Awaken, áreas 2+, etc. — **uma fatia por vez, travada no simulador**.
