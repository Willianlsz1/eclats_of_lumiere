# Éclats — Nova Direção de Design (sessão de grilling, 2026-06-14)

> Síntese legível das decisões desta sessão. Termos canônicos em `CONTEXT.md`;
> decisões arquiteturais em `docs/adr/`. **Nada aqui está calibrado** — o jogo será
> **recalibrado do zero** (ver ADR 0002). 🌱 = semente a pesquisar/fechar.

## O Caminho (spine) — ADR 0001
Sempre **pra frente**. O combate auto te empurra pelos 5 mapas. Em cada mapa você
atravessa as sub-áreas até o **boss final = Wall**, que fecha a passagem
pro mapa seguinte. Quando o HP da onda/boss passa do seu dano, você **travou** → vai
farmar o **Hollow** daquele mapa pra ficar mais forte → quebra a Wall → segue.
**Sem reset de mapa, sem backtrack.**

> **Map 1 — estrutura travada (2026-06-14): 9 sub-áreas.** Progressão por **GATE DE NÍVEL**
> (sem Guardião intermediário): a sub-área *n* libera quando o nível alcança o início da sua
> faixa (`subareaLevelRange(map, n).lo`; Map 1 = level 1→1000 geométrico). **Boss único na
> sub-área 9** (Gilded Hollow = Wall do mapa). Nomes/lore canônicos: ver lore bible §Map 1
> (as 4 últimas, 6-9, mostram o "douramento" mínimo prenunciando o Hollow). Implementado em
> `game/combat.js` (`subareaUnlockLevel`, `updateUnlockByLevel`, boss só na última). Mobs =
> 5 tipos sem card (sprite corpo inteiro). ⏳ os 8 níveis-alvo de unlock saem da faixa
> geométrica atual; recalibrar junto do pacing.

## Combate — base SINGLE-TARGET; CLEAVE é unlock — ADR 0002 (revisado)
**Base = 1 mob por ataque** (âncora "1 kill/ataque" vale no base). O **cleave/AoE** (atingir
vários/todos) é **desbloqueável** por passiva/mecânica (estilo Gaiadon). HP do mob > seu
dano = Wall. ⚠️ Correção 2026-06-14: cleave NÃO é o estado base (era engano).

## Os dois lados do loop
- **Mapa principal = renda IDLE** (passiva, offline): **Lumens** (nível do Gear),
  **Vestiges** (Passivas/Ascension), **drip de Éclats** (Mémoires).
- **Hollow = objetivo ATIVO**: instância de combate que você *entra* e luta por andares
  até o **nobre** (boss). Dropa **materiais** (raridade do Gear) + **1 Reliquat exclusivo**.
  1 Hollow por mapa (5 no total). O Gear precisa das **duas metades** → mapa e Hollow
  se alternam.

## Sistemas de poder (tudo "soma", e Ascension multiplica)
- **Nível (XP):** stat FLAT por nível (substitui os Gold Stats removidos) — ex.: +10
  dano/nível, +vida/nível, +3 Lumens/nível. 🌱 números.
- **Convergence (redesenhada):** gate por nível (1º ~40, sobe). Dá **+15% permanente**
  (dano/vida/XP/Lumens). Reseta **nível da run + NÍVEL do Gear** (a RARIDADE do Gear e a
  posição no mapa **nunca** resetam). 🌱 curva.
- **Ascension (por mapa):** vencer a Wall + Vestiges → próximo mapa + um **Gatekeeper**.
  **Multiplica** o acumulado de **Convergence** e de **Awaken** (ex.: Awaken +50% dano →
  Ascension ×10). Estrutura composta, sempre pra frente.
- **Awaken/Despertar (Guardião da Sub-3):** sobe o tier (T1→T5), dá **stat base** + **1
  habilidade ativa**. Multiplicado pela Ascension.

## Gear — duas camadas
- **6 peças-núcleo** (*o que você é*): **nível** (Lumens, do mapa) + **raridade**
  (materiais, do Hollow → Kindled→Converged, as 30 artes prontas). É o poder que quebra a Wall.
- **Reliquats** (2ª aba, *o que você venceu*): 1 por nobre/Hollow (brincos/colar/asas...).
  Híbrido: **bônus permanente pequeno + bônus local forte**. ≠ Mémoire.

## Habilidades ativas — ✅ EFEITOS FECHADOS (2026-06-14, refs Grand Chase/TT2)
**4 habilidades, uma por despertar** (T1→T5 = 4 despertares — encaixe exato). **Todas em
cooldown**, manual; auto-cast depois via **Gatekeeper A4**. Sem loadout, sem árvore, **sem
Ultimate/barra-Chaser** (descartados — 4 bastam). Desenhadas pra **NÃO repetir as passivas**
(que já cobrem crit/APS/%vida/pulso/defesa/revive/economia) — foco em **controle e momento ativo**:
- **Surto** (burst): nuke instantâneo em toda a tela **+ dano EXTRA no alvo de maior HP** (quebra Wall).
- **Torpor** (controle): **congela** os inimigos por X s **e congelados recebem +dano** (controle + janela).
- **Maré Dourada** (farm): janela de X s com **×TODO o loot** (Lumens/XP/Vestiges/materiais).
- **Égide** (defesa): **invulnerabilidade total + cura** por X s (botão de pânico; > revive/redução).
- ❌ "DoT por % da vida" **removida** (já em Shard Burst/Void Collapse). Nomes de lore + números = passada própria.

## Gatekeepers (recompensa = automação/QoL + ×poder)
- **A1 — O Ritmo:** Convergence deixa de resetar os níveis do Gear. ✅
- **A2-A5:** 🌱 a redefinir (partida: A2 dificuldades, A3 Echo, A4 +mobs, A5 Transcendência).

## Passivas — camada de ALAVANCAS (Vestiges) — esqueleto das 3 árvores
Não +dano% genérico (evita redundância com Nível/Convergence). 3 árvores × 15 nós; as
**exóticas/sinergias** moram nos nós profundos (grupo 3 / capstone). 🌱 lista fina a fechar.

- **ÉCLAT — combate ativo:** Crit Chance · Crit Damage · APS · **Redução de Cooldown**
  das habilidades · **Potência das habilidades** (+% efeito) · **Dano-em-Boss** (quebra
  Wall) · **Execute** (mata mob abaixo de X% HP — com cleave, ceifa ondas). *Capstone:*
  cada crit amplifica o próximo.
- **VESTIGE — farm/economia:** +Materiais no Hollow · **+Chance de Reliquat** ·
  **Lumens × tempo de jogo** (cresce com playtime) · +XP · **Echo melhorado** · taxa/cap
  de Offline. *Capstone:* quanto mais Reliquats coletados, +X.
- **FRACTURE — sobrevivência/Void:** Defesa/Mitigação · Regen · **Dano = % da vida máx**
  (vida vira ataque) · **Lifesteal** (cura no kill) · Escudo/Revive · Resistência ao Void
  (Hollows). *Capstone:* redução de dano % depois da armadura (Nihel's Shadow).
- **Exóticas/sinergia (nós profundos):** **+% aos stats do Gear** · "quanto mais fundo no
  mapa, +X" · "cada Reliquat equipado aumenta Y" · bônus que crescem com o tempo.

### Reconciliação das 45 (as do GDD §7 já existem; o redesign reparou algumas)
Aprovado tree-by-tree em 2026-06-14. **As 45 nomeadas+calibradas do GDD §7 ficam**, com reparos:
- **ÉCLAT:** *Refraction* = crit dobra no alvo de **maior HP** (era ricochete). ⚠️
  **Revisar (2026-06-14):** *Shard Burst* (espalhar), *Overkill* (transbordo) e *Luminal
  Explosion* (detonar a onda) eu havia "consertado" achando que **cleave era base** — mas
  o cleave é **unlock** (ADR 0002 revisado). Logo essas 3 **voltam a ser candidatas a
  CONCEDER o AoE/cleave** (efeito de espalhar dano). Mecanismo do unlock = sessão de passivas.
- **VESTIGE (1 refino):** *Beast Caller* = fortalece o **Echo (Gatekeeper A3)**.
- **Offline (regra global + 2 passivas):** **eficiência ≤ ~50% do ativo (teto 60%)**;
  **tempo acumula 8h inicial → 24h máx**. *Dreamwalker* = **eficiência** (rumo a 50%);
  *Nil's Embrace* = **teto de tempo** (8h→24h).
- **FRACTURE (4 reparos):** *Void Awareness* = **overflow de APS** (APS acima do cap vira
  dano bônus; par da Fracture Pulse; espelho do Momentum/crit) · *Éclat Attunement* =
  **+% ao bônus da Convergence** (era "+pontos") · *The Fracture's Gift* = **níveis grátis
  de Gear que sobrevivem ao reset da Convergence** (era "Gold Stats grátis") · *Nil's
  Embrace* = **teto de tempo do offline** (8h→24h).

> **As 45 estão fechadas (efeitos).** Posicionamento (grupos 1/2/3) e maxLevel/custos do GDD
> §7 seguem válidos; os NÚMEROS finos entram na recalibração geral.

## Mémoires — modelo "Artifacts" (TT2) — ✅ EFEITOS FECHADOS (2026-06-14)
Mémoires = **Artifacts do TT2**: bônus fortes, upáveis com **Éclats**, **max-all** (sem
escassez dolorosa). **Princípio de não-redundância:** Mémoire = **knob GLOBAL / META**
(multiplica uma categoria inteira **ou** amplifica outro sistema) — **nunca** duplica uma
passiva (que é granular). Clarté some como motor único. Refs: TT2 Artifacts, Grand Chase
party passive, Gaiadon.

| Era | Mémoire | Knob (global/meta) |
|---|---|---|
| 1 | **du Premier Matin** | ×TODO o dano (grande motor) |
| 1 | **des Rires** | ×TODA a economia (Lumens+XP+Vestiges+materiais) |
| 1 | **de la Marche** | ×a **Convergence** (amplifica o +15%) |
| 2 | **de la Forme** | ×todo o **Gear** (6 peças + Reliquats) |
| 2 | **du Façonnage** | ×saída dos **Hollows** (materiais + qualidade do Reliquat) |
| 2 | **des Profondeurs** | ×renda conforme a **profundidade** (mais fundo = maior) |
| 3 | **de la Chute** | ×dano em **boss/Wall** |
| 3 | **des Cendres** | ×a **Ascension** (amplifica o multiplicador) |
| 3 | **du Dernier Chant** | ×**habilidades** (potência + redução de cooldown) |
| 4 | **de la Blessure** | ×dano (**multiplicativo**, 2º motor) |
| 4 | **de la Résistance** | ×**sobrevivência** (HP+defesa+regen) |
| 4 | **du Temps Brisé** | ×**TODOS os Éclats** (drip + bolsas) — o "Book of Shadows" |
| 5 | **du Vide** | ×recompensas em **dificuldades altas** (Nightmare/Tormento) |
| 5 | **de la Lumière Entière** | ×**TODAS as outras Mémoires** ⚠️ (meta-das-metas; calibrar c/ cuidado) |
| 5 | **du Choix** | ×toda a **sua saída** (dano+economia+sobrevivência) |

🌱 Resta: números (magnitudes/custos em Éclats) na recalibração. Nomes já são canônicos.

## Removidos / Aposentados
- **Gold Stats** (tarefa repetitiva) → Nível assume o stat base.
- **Reset/backtrack da Convergence** (não o sistema — a Convergence ficou, sem o reset de mapa).
- **Regra "1 kill/ataque"** → cleave.

## Pendências grandes (próximas sessões)
1. ✅ **Efeitos das 4 habilidades** — FECHADO (Surto/Torpor/Maré Dourada/Égide). Resta: nomes de lore + números.
2. ✅ **15 efeitos das Mémoires** — FECHADO (knobs globais/meta). Resta: números (magnitudes/custos).
3. ✅ **Passivas** — 45 reconciliadas (efeitos). Resta: números (recalibração) **+ ⏳ definir o
   UNLOCK de cleave/AoE** (qual passiva concede e como escala — candidatas: Overkill / Shard
   Burst / Luminal Explosion; ADR 0002). **Sessão de passivas.**
4. **Pacing pra ~30 dias** (números: sub-áreas 7-8, ritmo Walls/Hollows/Convergences).
5. **RECALIBRAÇÃO GERAL** (o cleave invalidou a calibração antiga — pass próprio).

> **Todo o DESIGN do redesign está fechado.** O que resta é **NÚMEROS** (#4 pacing + #5
> recalibração) — um pass próprio, mais técnico.

✅ **Já feito nesta sessão:** spine (ADR 0001), cleave (ADR 0002), economia/Hollows/Gear-2-camadas,
Nível/Convergence/Ascension, fonte+fuel das habilidades, **Gatekeepers A1-A5**, papel das
passivas (esqueleto), direção das Mémoires, e avisos de redesign no CLAUDE.md/GDD/ESTADO.
