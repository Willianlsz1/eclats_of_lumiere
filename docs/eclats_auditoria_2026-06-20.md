# Auditoria de Síntese — Éclats of Lumière (recomeço Mapa 1)

*Data: 2026-06-20 · Base: código real em `src/` · Julgado contra `docs/eclats_recomeco_nucleo_2026-06-19.md` e `docs/eclats_plano_v0_2026-06-19.md` · Método: workflow de 25 agentes (8 finders + benchmark de gênero + verificação adversarial + síntese)*

---

## 1. Veredito geral

**Você acertou a forma, não a calibração — e dois dos seus acertos estruturais você ainda não percebeu que tem.** O núcleo single-target com HP relativo (`enemies.js:38`: HP do mob = HP do player × fatorÁrea × rand) está alinhado ao melhor benchmark do gênero (Melvor Idle). A Convergence, na *intenção*, é o soft-reset clássico de NGU/Trimps. E a melhor decisão de todo o redesign está escondida na matemática: como `baseDmg == playerBaseHp == 1000` e `dmgPerLevel == hpPerLevel == 150` (`constants.js:8,14,50,51`), o termo de Nível **e** o `convMult` se **cancelam exatamente** na razão Dano÷HP. Ou seja, o motor que você mais teme — Nível e Convergence — *matematicamente não pode estourar a parede*. Sobram só 3 alavancas reais movendo o TTK: APS, crit, e a assimetria dano-vs-HP de gear/passivas. Você está vigiando 8 botões; só precisa vigiar 3.

**O recomeço está sendo seguido na direção, mas violado na execução.** O plano v0 (`eclats_plano_v0`, Task 2) manda **esvaziar** a Área 1 para um único loop kill→gold antes de qualquer balanceamento. O código faz o oposto: roda o modelo antigo de ondas+boss **e** ganhou o Tapper (boss-timer de 30s + tap ativo, `constants.js:23-24`, `combat.js:86-88`). Você adicionou botões a um núcleo que o seu próprio plano diz que deveria estar sendo esvaziado — e um deles (`bossFails`, timer que zera progresso) reintroduz **punição** num jogo cuja identidade declarada é "parede sem punição" (`recomeco_nucleo` §3.1).

**O maior risco não é nenhum número — é que o seu juiz está cego.** O método oficial declara "simulador como juiz". Mas o único harness que roda o código real (`tools/sim/game_harness.mjs`) **crasha no import** (importa `ENEMY`, o export virou `ENEMY_REL`), e os ~33 sims abstratos modelam um jogo que não existe mais (HP absoluto, gear linear único). Você *acha* que está medindo, mas o instrumento mede outro jogo. **É exatamente por isso que você "se perde": não é que os botões sejam incontroláveis — é que você não tem um número confiável na tela.** Conserte o juiz antes de tocar em qualquer constante.

---

## 2. Saúde do balanceamento — a razão Dano÷HP e o orçamento de décadas

### O que está sob controle (e você não sabia)
A razão Dano÷HP do jogador é **constante = 1.000** em todos os níveis, e isso é *bom*: significa que Nível e Convergence não desancoram nada. O TTK em número de golpes é:

```
TTK_golpes = fatorÁrea × rand(1.3–1.9) × (gearHpMult · passiveHpMult) / (gearDmgMult · passiveDmgMult)
```

Nível e `convMult` somem da equação. **Esta é a sua âncora.** Documente-a no topo de `stats.js` como invariante de design.

### O que ameaça estourar
1. **Assimetria gear/passivas (dano vs HP), totalmente solta.** É a única alavanca que move o numerador/denominador da razão acima, e ela é livre: `passives.js:11,17` dão `dmg` e `hp` como `mult` independentes com `cap: Infinity`; afixos de gear `dmg`/`hp` dropam independentes. Quem empilha dano (natural — mata mais rápido) chega a TTK < 1 golpe (one-shot em toda área); quem empilha HP trava (~67 golpes ≈ 74s/mob comum). **Sem nenhuma trava estrutural.** É a tradução exata da sua dor-raiz na única razão que importa.
2. **Crit damage uncapped** (`passives.js:13`, `cap: Infinity`) — o único multiplicador genuinamente ilimitado que entra **só** no dano. Hoje freado pelo custo geométrico (`1.25^rank`) e pelo cap de 1 kill/ataque, mas é dívida latente.
3. **Convergence ao quadrado na renda** (`economy.js:13` aplica `convMult` sobre `mob.hpMax`, que *já* carrega `convMult` via `playerHpMax`). Dormente hoje (`bonusPerConv: 0`), mas explode no instante em que você ligar a Convergence.

### O que trava ou trivializa
- **Sobrevivência nas áreas altas trava de forma estrutural (HIGH, confirmado em sim).** `packDps = N_mobs × HP_player × 0.03 × fatorÁrea`. Área 9 = 4×0.03×1.9 = 0.228×HP/s de dreno; regen = 0.01×HP/s. Sem gear o jogador morre em ~4.7s e **nunca limpa o pack**. Pior: como dano do mob e HP do mob escalam *ambos* com o HP do player, **empilhar dano ou HP não ajuda a sobreviver** — só a mitigação (`veilFactor`, gear-gated, cap real 0.18) bende a curva. Death-loop silencioso, sem feedback de "área perigosa".
- **Curva de XP invertida (HIGH, confirmado em sim).** `xpForLevel = 4600 × L^2.38` cresce mais rápido que o XP/kill, então **kills-por-nível aumenta** com o nível (120/nível no lv2 → 3605/nível no lv1200). A 1ª Convergence (lv50), anunciada como ~30min (`constants.js:47`), dá **~30h** no sim — erro de ~60×.
- **Custo de upgrade trivializa o sink de Lumens.** Custo linear (`gear.js:123`) + renda que escala com HP do mob = upgrades custam ~0.04–0.21 kills sempre; Lumens vira recurso não-vinculante (o gate real é material).

### Por que você "se perde" — e a recomendação estrutural
Não é estrutura: é **instrumentação + assimetria solta + arquivo poluído**. Três consertos devolvem o controle:

1. **Conserte o harness real** (`game_harness.mjs`: `ENEMY`→`ENEMY_REL`, API de gear `equipped/inventory`, remover redefinição de constantes). Ele deve cuspir, por nível/área/conv: **TTK por área, Dano÷HP, lumens/s, e as décadas (log10) de cada fator separado** (gear, passiva, crit, conv). **Aposente os ~33 sims abstratos** — são a fonte do drift. Um único harness que roda `src/` real, em pre-commit.
2. **Trave a assimetria dano-HP**: ou acople (um afixo/nó move os dois), ou dê caps finitos e simétricos aos `mult` de dmg/hp/critDmg. Defina o intervalo permitido (ex.: razão entre 0.7 e 2.0) e faça o sim falhar fora dele.
3. **Atribua cota de décadas por sistema** num comentário/ADR (Nível: 0, pois cancela; gear: ~0.9 déc; passivas: Y; Convergence: Z) e faça o harness somar e comparar antes de cada era ligar. Mantenha `clarteExp` e Mémoires desligados.

---

## 3. Top problemas priorizados

Ordenado por impacto×confiança. Só achados não-refutados.

| # | Título | Subsistema | Sev | Tipo | Fix de uma linha |
|---|--------|-----------|-----|------|------------------|
| 1 | Harness real crasha (`ENEMY` vs `ENEMY_REL`); sims abstratos modelam jogo morto — juiz oficial fora de campo | Economia/Sim | **crítico** | bug | Consertar `game_harness.mjs` import+API de gear, aposentar os ~33 sims abstratos, rodar em pre-commit |
| 2 | Nível não fura a parede: Dano÷HP fixo em 1.0 (`dmgPerLevel==hpPerLevel`) e único eixo ativo é neutro | Nível/XP | **crítico** | balance | Decidir conscientemente: ou Nível dá tilt de dano, ou a furada vem 100% de gear/conv — e documentar a âncora em `stats.js` |
| 3 | Convergence dá só Pontos; `bonusPerConv:0` mata o motor +% aditivo do design (§3.4) | Convergence | **alto** | genre-gap | Reintroduzir `bonusPerConv` > 0 (ramos Dano/Vida separados) como recompensa primária; passivas viram amplificador |
| 4 | Assimetria dano-vs-HP de gear/passivas solta e uncapped — trivializa ou trava o TTK | Economia/Gear | **alto** | balance | Acoplar dmg+hp ou caps finitos simétricos; sim reporta Dano÷HP por área |
| 5 | Sobrevivência quebra nas áreas altas: packDps > capacidade de clear, death-loop silencioso | Combate | **alto** | balance | Validar `packDps/(regen+mitigação)` por área no sim; baixar `dmgFrac`/packs ou subir regen + aviso de "área perigosa" |
| 6 | Curva de XP invertida: 1ª Convergence ~30h vs ~30min prometido (erro ~60×) | Nível/XP | **alto** | balance | Recalibrar `curveDiv`/`curveExp` mirando o tempo-alvo real no sim antes de travar |
| 7 | Convergence RESETA `unlockedSubarea` — viola "áreas nunca resetam" (§3.3/§3.4) | Convergence | **alto** | bug | Remover resets de subárea/unlock em `doConverge` + persistir piso `maxUnlockedSubarea` que o gate nunca abaixa |
| 8 | Passivas são a ÚNICA fonte de poder do prestígio (uncapped, multiplicativas) — viola §3.5 | Passivas | **alto** | balance | Capar ranks dos nós ofensivos por cota de décadas OU somar dmg/critDmg num bucket aditivo aplicado 1× |
| 9 | Dois sistemas de gear paralelos (bloco `GEAR/CRAFT` morto vs `UPGRADE/AFFIX_RANGE` ativo) | Gear | **alto** | quality | Deletar bloco `GEAR`+`CRAFT` de `constants.js`, mover `AFFIX_RANGE`/`DROP_CHANCE`/etc. de `gear.js` para `constants.js` |
| 10 | Zero onboarding: primeiros minutos sem nenhuma orientação | UX | **alto** | missing | Flag `firstRun`; 1 frase no 1º level-up: "Inimigos escalam com você — faça o DANO crescer mais que o HP" |
| 11 | Tapper integrado: boss-timer (30s, `bossFails`) injeta punição + tap ativo num idle | Combate/UX | **alto** | genre-gap | Não manter como está: cortar o timer de boss (boss = gate por DANO) ou modelar tap como burst sem downside |
| 12 | Convergence escondida em aba terciária, sem CTA quando `canConverge` | UX | **alto** | ux | Badge/pulso na nav + chip na HUD quando `canConverge(state)` |
| 13 | Sem gate de gold na Convergence — pacing 100% num único botão (nível ×1.5) | Convergence | **alto** | missing | Adicionar `gateGold` em `CONVERGENCE` e exigir `lumens >=` no `canConverge` |
| 14 | `discardItem` indexa material por `rarity` mas clampa tier por `length` — Legendary credita tier errado | Gear | **médio** | bug | Unificar escala raridade→tier numa função única em `constants.js` |
| 15 | Custo de upgrade linear (não geométrico) — late do Map 1 fica trivial | Gear | **médio** | balance | `lumCostBase × ramp^level` (ramp ~1.05–1.10), validar tempo-de-maxar no sim |
| 16 | `ESTADO_DO_JOGO.md` descreve modelo antigo (5 mapas, Gold Stats, pontos=bestSubareaRun) | Docs | **médio** | quality | Marcar SUPERSEDED no topo ou reescrever a partir do código atual |
| 17 | Boss-timer corre durante catch-up de aba (até ~10s saem de uma vez) | Combate | **baixo** | bug | Pausar `bossTimer` em passos de catch-up (flag `isCatchup`) |

---

## 4. Melhorias de feel/gênero (do benchmark)

**Copiar de Melvor/NGU/Trimps/Cookie Clicker:**

- **Travar a fórmula-raiz da Convergence AGORA** (o botão de pacing mais alavancado). Decida o ritmo: raiz quadrada → ~4× por reset (resets frequentes, ativos); raiz cúbica → ~8× (Cookie Clicker, médio); 7ª raiz → ~128× (Egg Inc., raros/longos). Trave isso *antes* de implementar v1.
- **Softcap explícito por fator** como ferramenta de primeira classe contra a composição multiplicativa — é exatamente a técnica que o gênero usa para a sua dor declarada. Se Conv% sozinha entrega mais décadas que a cota, vira softcap, não re-tuning ad-hoc.
- **Múltiplos "relógios"** (Eric Guan): ciclos de ~20min / ~5h / ~2 dias coexistindo. Hoje há **um só relógio** (kill→gold→upgrade, segundos). Reserve no orçamento relógios lentos para Convergence (horas) e Awaken/Ascension (dias), senão o meio-jogo fica oco.
- **Barra "próximo unlock" sempre visível** (progresso até o cap da área) — gancho de retenção barato e canônico.
- **Offline antes de v6.** É o recurso nº1 que separa "idle" de "clicker" — todos os 5 benchmarks têm.
- **Áudio (4–5 SFX):** hit, kill, level-up e um som cerimonial de Convergence. Você investiu pesado em arte; o áudio é o complemento óbvio que falta.
- **Celebração de level-up:** hoje a barra azul só zera silenciosamente — o drop de material tem *mais* juice que subir de nível. Flash + floatie "LEVEL UP" + ding.

**Evitar (o gênero penaliza):**
- Empilhar mais multiplicadores antes do sim validar a cota de cada um — é como NGU vira planilha incontrolável. A promessa "passivas não ganham cota própria" (§3.5) precisa ser um **teste no sim**, não uma intenção.
- Mecânicas de pressão/fracasso disfarçadas (boss-timer e tap ativo puxam para "clicker com timer", o oposto do idle-first de Melvor).
- Implementar sistemas antes do anterior estar travado no sim (o plano v0 já impõe isso; o Tapper viola).

---

## 5. Higiene de código/docs

**Bugs reais (não-balanceamento):**
- `discardItem` (`gear.js:109-115`): tier de material clampado por `materiais.length-1`=3, mas quantidade usa `DISCARD_MAT[item.rarity]` (5 entradas) — descartar Epic/Legendary credita material errado.
- `applySnapshot` (`state.js:128-129`): adota `snap.inventory`/`equipped` por referência sem validar shape — save editado à mão pode injetar item sem `affixes` e quebrar combate/UI com TypeError.
- `currentAPS` (`stats.js:48-51`): só tem teto, sem piso. Se um afixo/passiva futura zerar `passiveApsMult`, `interval = 1/0 = Infinity` trava o laço de ataque. Aplicar `Math.max(0.1, ...)`.

**Estado morto / desalinhamento docs↔código:**
- **`ESTADO_DO_JOGO.md` descreve o modelo ANTIGO** (5 mapas, Gold Stats, pontos = `bestSubareaRun`). O código dá pontos = `runLevel` (`convergence.js:31`). → marcar SUPERSEDED.
- `state.mapProgress` (`state.js:77,131,147`): serializado e restaurado, **nunca escrito nem lido** — vestígio do multi-mapa. Remover.
- `state.stats` (Gold Stats) + shims `strTotal/buyStat=()=>1` (`stats.js:90-99`): Gold Stats foi **removido** mas persiste no estado. Auditar importadores e remover.
- `GEAR.flatPerLevel` (`constants.js:199`): código morto — `gearDamageFlat/gearHpFlat` são shims `()=>0`. Os sims antigos ainda leem esse flat (fonte do drift).
- `constants.js` tem ~3× mais constantes mortas/futuras (GOLD_STATS, DIFFICULTIES, ECO, ASCENSIONS, Mémoires) do que ativas. → separar `constants.js` (ativo Map 1) de `constants.future.js`.

---

## 6. Roadmap acionável (uma fatia por vez, travar no simulador)

Do mais urgente ao desejável. **[C]** = conserto · **[V]** = nova fatia (v2+).

1. **[C] Consertar o juiz.** `game_harness.mjs`: `ENEMY`→`ENEMY_REL`, API de gear `equipped/inventory`, remover redefinição de constantes. Importar **só** de `src/`. Aposentar os ~33 sims abstratos. Saída obrigatória: TTK/área, Dano÷HP/área, lumens/s, décadas por fator. **Nada de tocar em número antes disto.**
2. **[C] Documentar a âncora.** Comentário no topo de `stats.js`: "Nível e Convergence cancelam na razão Dano÷HP; só APS/crit/assimetria-gear movem o TTK."
3. **[C] Decidir o Tapper.** Brainstorming primeiro. Provavelmente: cortar o boss-timer (boss = gate por dano), remover `bossFails`+HUD de falhas e o reset de `killsInSubarea`. Se mantiver o tap, modelá-lo como burst de teto fixo no orçamento e no harness.
4. **[C] Travar a assimetria dano-HP** (achado #4): caps finitos simétricos ou acoplamento. O harness falha fora do intervalo. É a **única** alavanca estrutural que ameaça a razão central.
5. **[C] Recalibrar a curva de XP** (achado #6) com o harness consertado, mirando a 1ª Convergence no tempo real desejado.
6. **[C] Consertar sobrevivência das áreas altas** (achado #5): validar `packDps/(regen+mitigação)` por área; ajustar `dmgFrac`/packs/regen + aviso de "área perigosa".
7. **[C] Remover o reset de áreas na Convergence** (achado #7) + persistir piso `maxUnlockedSubarea`.
8. **[C] Limpar `constants.js`**: deletar bloco `GEAR/CRAFT` morto (#9), `GEAR.flatPerLevel`, separar ativo de futuro. Marcar `ESTADO_DO_JOGO.md` como SUPERSEDED.
9. **[V] Reintroduzir o +% aditivo da Convergence** (#3, #13): `bonusPerConv` > 0 em ramos Dano/Vida + gate de gold. **Travar a fórmula-raiz** (4× / 8× / 128×) antes de codar. Passivas viram amplificador capado.
10. **[V] Feel pass:** badge/CTA de Convergence na HUD (#12), onboarding de 1 frase (#10), 4–5 SFX e celebração de level-up.

**Disciplina:** passos 1–8 são consertos do que já existe e não saem da Área 1. Passos 9–10 só depois do harness ser confiável e da razão Dano÷HP estar travada — caso contrário você empilha botões sobre um juiz cego, exatamente o ciclo que o recomeço existe para quebrar.
