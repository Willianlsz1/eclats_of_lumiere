# Éclats — Mapa 1: Plano de Implementação (v1)

> Traduz [eclats_mapa1_design_v1.md](eclats_mapa1_design_v1.md) + [eclats_afixos_drop_v1.md](eclats_afixos_drop_v1.md)
> em CPs pequenos e ordenados. Regra do projeto: **implementar APENAS o CP pedido**, sem
> adiantar fases nem refactor amplo. Cada CP termina com resumo + como testar + % do todo.

## Contexto técnico
- Hoje o repo está em **modo visual-only**: as telas (`src/ui/*`) renderizam com **stubs neutros** em `src/game/*` (e `core/loop|save|dev` foram apagados). Ver branch `visual-only-shell`.
- **Estratégia:** cada CP **substitui um stub por lógica real**, preservando as **assinaturas de export** que a UI já importa → a tela continua viva a cada passo (sem big-bang).
- **Onde trabalhar:** worktree `visual-only-shell` (ou branch dedicado por CP). Commits pequenos.
- **Números:** todos vêm dos docs de design. Nunca inventar — se faltar, perguntar.

## Constantes-âncora (do design, p/ o `src/data/constants.js`)
- Player base: HP = Dano = **1.000**; `hpPerLevel = dmgPerLevel = 150`; AtkSpeed base **0.9** (cap 10).
- XP: `xpRun(L) = 4600 × L^(1/0.42)`.
- Áreas 1–9: gate `1,30,90,180,320,500,720,960,1200`; fatorÁrea `1.1→1.9` (+0.1); pack `1→4`.
- Mob: HP = `HPplayer × fatorÁrea × rand(1.3–1.9)`; Dano/s = `HPplayer × 0.03 × fatorÁrea`/mob.
- Reward: Lumens = `HPmob × 0.25`; XP = `HPmob × 0.10`. Regen base 1%/s.
- Boss: a cada **3.000 kills** (×HP, ×dano). Elite: 1% spawn (sobe por Faro), +HP/+reward.
- Convergence: gate nível **50 ×1.5**; reset run (xpRun/Lumens), mantém o resto; `Pontos = nível ao convergir`.
- Drop (M1): por raridade/kill — Common 1.0% / Uncommon 0.6% / Rare 0.3%; elite ×4; boss ×7. Cap por área (1–3 C, 4–7 +U, 8–9 +R).
- Material: tiers T1/T2/T3; descarte C=1/U=3/R=8; refino 15:1.
- Gear upgrade (Lumens): nível → +% afixos, cap por raridade ×1.4/2.3/3.2/4.1/5.0.
- Passivas: 12 nós menores (tabela no design); custo `c1 × 1.25^(rank-1)`; efeitos compostos/aditivos por nó.

---

## CPs (ordem de implementação)

### CP-1 — Núcleo: estado + loop + save  ⟶ ~10%
**Objetivo:** o jogo "vive" de novo (tick contínuo + persistência), sem combate ainda.
- Recriar `src/core/loop.js` (tick fixo ~100ms, render por tick) e `src/core/save.js` (localStorage + schema versionado + autosave).
- `src/core/state.js`: schema novo do Mapa 1 (recursos, player, área, gear, passivas, convergence, materiais) + apply/toSnapshot.
- `src/data/constants.js`: gravar as constantes-âncora acima.
- `src/main.js`: load → setupUI → startLoop(tick→render).
**Testar:** abre, recarrega, estado persiste; loop roda sem erro no console.

### CP-2 — Nível, XP e Áreas  ⟶ ~20%
**Objetivo:** subir de nível e gate de áreas funcionando.
- `src/game/stats.js`: `runLevel`, `levelProgress`, `levelXpInfo` (curva real); base+per-level de HP/Dano; `playerHpMax`, `damagePerHit`, `currentAPS`.
- `src/game/enemies.js`: faixas por área (gate levels, fatorÁrea), `getCurrentMap`/área atual.
- `src/game/combat.js`: `enterSubarea/changeSubarea/travelToMap` reais (gate por nível 1→1200).
**Testar:** ganhar XP (mesmo manual) sobe nível; áreas destravam nos níveis certos; tela de Mapa reflete.

### CP-3 — Combate base (single-target, relativo)  ⟶ ~38%
**Objetivo:** o loop de matar mobs, âncora do jogo.
- `src/game/enemies.js`: spawn de pack (1→4), HP/dano relativos (×fatorÁrea×rand), elite (1%), boss (threshold 3.000 kills).
- `src/game/combat.js`: `combatTick` real — attack timer (AtkSpeed), single-target no 1º vivo, **1 kill/ataque**, dano do pack ao player, regen 1%/s, morte/respawn 3s, troca de onda.
- `src/game/economy.js`: `awardKill` (Lumens=HP×0.25, XP=HP×0.10), contadores.
- Crit (chance/dano) em `stats.js`.
**Testar:** mobs nascem, morrem em ~TTK 2s, dão Lumens/XP, ameaça/regen batem; boss aparece a cada 3k kills.

### CP-4 — Gear: drop + afixos + inventário  ⟶ ~55%
**Objetivo:** dropar e equipar peças.
- `src/game/gear.js`: pools de afixo por slot, geração (raridade por área, primário cheio/secundário ×0.5, ranges/área), efeitos do gear nos stats.
- Drop por kill (1.0/0.6/0.3 + elite×4/boss×7, cap por área), rolls independentes.
- Inventário no `state`; equipar (1/slot), descartar → material.
- UI: tela Gear + inventário consumindo o real.
**Testar:** drops caem no pace esperado; equipar muda stats; descarte gera material do tier.

### CP-5 — Gear: upgrade (Lumens) + Material (melhorar/forjar)  ⟶ ~70%
**Objetivo:** sinks de Lumens e Material.
- Upgrade com Lumens: nível da peça → +% afixos, cap por raridade; custo linear.
- Material: tiers, **Melhorar** (subir raridade = +afixo), **Construir** (forjar: material+Lumens, mais caro por tier), **Refino 15:1**.
- UI: tela Forge consumindo o real.
**Testar:** upar peça sobe afixos até o cap; subir raridade adiciona afixo; forjar cria peça; refino converte.

### CP-6 — Convergence (rebirth)  ⟶ ~82%
**Objetivo:** o ciclo de prestige.
- `src/game/convergence.js`: gate (nível 50 ×1.5), `canConverge/doConverge`, reset (xpRun/Lumens) mantendo o resto, `Pontos = nível ao convergir`.
- `state`: pontos de Convergence, contagem.
- UI: tela/painel de Convergence real.
**Testar:** convergir no gate reseta run e dá pontos = nível; gate sobe ×1.5; permanente mantido.

### CP-7 — Passivas (nós menores)  ⟶ ~95%
**Objetivo:** gastar pontos e ganhar poder permanente.
- `src/game/passives.js`: 12 nós menores (efeitos compostos/aditivos + custo `c1×1.25^n` + caps/mapa), gates de tier por ramo (15/50), aplicar efeitos nos stats.
- UI: árvore (3 ramos) consumindo o real. (Notáveis/keystones = fora do Mapa 1.)
**Testar:** comprar rank gasta pontos com custo crescente; efeito aplica; caps respeitados.

### CP-8 — Integração & balanceamento  ⟶ 100%
**Objetivo:** amarrar tudo e validar o pacing.
- Agregação final de stats (nível + gear + passivas + Convergence) num só lugar.
- Formatação de números (format.js) em toda a UI.
- Passada de balanceamento contra o design (1ª Convergence ~30min, Mapa 1 ~5–8h, pace de drop).
- (Opcional) progresso offline.
**Testar:** run completa do início à ~área 9 sem furos; números formatados; pacing no alvo.

---

## Notas
- **Fora do Mapa 1 (não implementar):** notáveis, keystones (Cleave/Splash/Perfurar/Conversão/Ganância), Mapas 2–9, habilidades ativas.
- Cada CP é um passo de PR pequeno; ao final de cada um: resumo + como testar + % concluído (regra do CLAUDE.md).
- Ordem pode ser ajustada, mas CP-1→3 são base obrigatória antes de gear/convergence/passivas.
