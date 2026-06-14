# ⚔️ Éclats of Lumière — GDD Final Consolidado (v2)

**Fonte da verdade única de game design e balanceamento.**
Substitui: DESIGN.md (Parte II em diante) e BALANCE_MODEL.md.
Lore: ver *docs/eclats_lore_bible.md* (Lore Bible Completo v2 — já consolida a Revisão de jun/2026).
Data: 2026-06-09 · Status: **estrutura completa e calibrada por simulação** · Pendências listadas em §16.

> ⚠️ **REDESIGN EM ANDAMENTO (2026-06-14).** Uma sessão de design mudou a direção do jogo
> (combate **CLEAVE**, **Gold Stats removidos**, **Convergence** sem reset de mapa, **Hollows**,
> **Reliquats**, **habilidades ativas**, **Gatekeepers** redefinidos, 5 mapas = Jogo base ~30d).
> **A calibração deste GDD será refeita.** Antes de implementar qualquer sistema, leia
> **`docs/eclats_redesign_2026-06-14.md`** + **`docs/adr/0001`, `0002`** + **`CONTEXT.md`** —
> eles têm prioridade sobre as seções abaixo onde houver conflito.

Legenda de maturidade:
- ✅ **CALIBRADO** — validado pelo simulador de progressão (sim_full v3)
- 🔒 **TRAVADO** — decisão de design fechada, números finos pendentes
- ⏳ **PENDENTE** — a definir/calibrar

---

## 1. VISÃO GERAL

- Idle RPG casual, browser (JS puro). Sessões de decisão de 2-3 min; nunca pune offline.
- Combate automático: herói e inimigos como cards, projéteis A→B.
- Duração alvo da campanha (5 mapas): **~41-50 dias** para jogador casual (bot ótimo 24/7: 13.6 dias — razão casual ~×3, a confirmar em playtest).
- Plataforma primária: Desktop 1920×1080; mobile depois.
- Números grandes nativos do float JS: teto do jogo base **1e100** (folga de ~200 décadas até 1.8e308; break_infinity só se tiers futuros passarem de ~1e300).

---

## 2. MACROESTRUTURA (🔒 TRAVADA)

Cinco camadas, cada moeda com exatamente uma casa:

| Camada | Loop | Moeda | Reseta em |
|---|---|---|---|
| **Run** | minutos–horas | Lumens → Gold Stats | Convergence |
| **Convergence** | ~4h em média (81 na vida) | dá **pontos** (recompensa COMPOSTA, ✅ 2026-06-11) | — |
| **Passivas** | permanente | **Vestiges** | nunca |
| **Ascension** | 1 por mapa (5 na vida) | custa Vestiges, libera **Éclats** | — |
| **Mémoires** | permanente | **Éclats** | nunca |

**Convergence** (portão estilo Gaiadon): ao encher a parede de XP da run, o jogador converge — reseta **só o econômico** (Gold Stats, Lumens, parede); **o progresso de mapa NÃO reseta** (revisão 2026-06-11 — viagem livre pelo desbloqueado). Ganha pontos pela **luz juntada na run (`xp_run`)** com retorno decrescente + bônus único do Boss final (ver §6). A **1ª Convergence desbloqueia as Passivas** (momento de lore: a Semente desperta).

**Ascension** (marco por mapa): derrotar o boss final do mapa + custo em Vestiges → desbloqueia o próximo mapa + rank da Ordre + multiplicador grande + Éclats. A **A1 desbloqueia o sistema de Éclats/Mémoires**. Nada além do que a Convergence já reseta é perdido — o sacrifício é o custo de oportunidade dos Vestiges.

**Persistem sempre:** Gear, Echoes, Passivas, Mémoires, pontos de Convergence, XP/level do Seeker.

---

## 3. MALHA GEOMÉTRICA — MAPAS, LEVELS E HP (✅ CALIBRADO)

Levels dos mobs e do Seeker: **1 → 1.000.000.000 (1e9)**. HP dos mobs: **10 → 1e100**.

| # | Mapa | Levels | HP dos mobs | ×HP por subárea | Threshold boss (kills) |
|---|---|---|---|---|---|
| 1 | The Dreaming Wood | 1 – 1.000 | 10 – 1e6 | ×10 | 100 |
| 2 | Cavernes Luminis | 1.000 – 100k | 1e6 – 1e16 | ×100 | 200 |
| 3 | The Ashen Ruins | 100k – 10M | 1e16 – 1e34 | ×3.981 | 350 |
| 4 | The Fractured Peaks | 10M – 100M | 1e34 – 1e62 | ×398k | 500 |
| 5 | Nil Aeternum | 100M – 1e9 | 1e62 – 1e100 | ×39.8M | 800 |

- 5 subáreas por mapa; bounds de level geométricos: `lvl_lo × r^s`, com `r = (lvl_hi/lvl_lo)^(1/5)`.
- **HP interpolado geometricamente no log do level, por mapa:**
  `hp(L) = hp_lo × (hp_hi/hp_lo)^t`, onde `t = (log L − log lvl_lo) / (log lvl_hi − log lvl_lo)`
- Level de cada mob sorteado dentro do range da subárea; boss = level máximo da subárea.
- Décadas de level carregadas no início (levels "normais" cedo); décadas de HP carregadas no fim (motores compostos do late game).

---

## 4. NÚCLEO DE COMBATE (✅ CALIBRADO)

### Constantes-âncora
```
baseDmg      = 7        baseAPS   = 0.40 (intervalo 2.5s)
apsCap       = 1.25     (intervalo mínimo 0.8s — razão 3.1×)
playerBaseHp = 50       regen     = 1% HP máx/s
regenOnKill  = 2% HP máx por kill (base; afixos de Armor ampliam)
bossHpMult   = 15       bossDmgMult = 3
goldRatio    = 0.10     xpRatio   = 0.08
```

### ⚡ Regra física fundamental: cap de kill rate
**Máximo de 1 kill por ataque (base).** Kill rate máximo = APS atual.

> 🔄 **REVISTO 2026-06-11 (Tópico 2.4):** o teto de APS sobe de 1.25 para **~15** (estilo Gaiadon).
> A âncora **sobrevive** porque o que ancora a economia é o teto **existir**, não ser baixo: a renda
> (Lumens/XP/Vestiges/Éclats) continua proporcional ao **HP do mob mais fundo que você mata × teto de
> kills/s** — profundidade, nunca spam. O número exato (15? 12?) é calibração de escala.
>
> **Distribuição do APS (decisão do Willian):** nenhuma fonte sozinha chega ao teto.
> - **AGI (Gold Stat):** sobe o APS só até um **teto pequeno próprio** (sub-cap baixo);
> - **1 passiva (Fracture Pulse, árvore Fracture):** é a CHAVE que bate o teto;
> - **Gear:** contribui APS (afixo dedicado);
> - As três juntas alcançam o ~15 → todas relevantes a vida toda (conserta o AGI, que era inútil pelo cap 1.25).
>
> **Multi-kill:** "1 kill/ataque" continua a regra base, mas passivas específicas (Overkill, Execute,
> Luminal Explosion) podem furá-la — com os **kills extras pagando renda reduzida (~50%)** para serem
> ganho de poder, não exploit econômico.
>
> **Cadência (não-flash):** sensação de "muitos kills/s, mas agradável" é trabalho **visual** (mob morto
> some com fade ~0.2s + ritmo de spawn da onda), não de segurar o APS baixo.

### Fórmula de dano do jogador
```
dano_por_hit = baseDmg
             × str_total          // Gold Stat (reseta na Convergence)
             × level_bonus        // 1 + sqrt(heroLevel) × 0.20
             × conv_factor        // 1 + 0.15 × pontos de Convergence
             × asc_mult           // ×10 na A1; ×5 nas A2-A5 (acumulado: ×6.250)
             × gear_bonus         // ~×2 por tier de mapa (ver §13)
             × passive_dmg        // árvores de Passivas
             × memoire_mult       // Clarté × Mémoires multiplicativas (§11)
DPS = dano_por_hit × APS
```

### HP do jogador — recebe os MESMOS fatores de prestige (correção estrutural)
```
hp_max = playerBaseHp × vit_total × level_bonus × conv_factor × asc_mult × gear_hp × passive_hp × memoire_hp
```

### 🟡 REGRA DE OURO DE ESCALA (✅ TRAVADA 2026-06-11 — Tópico 2.2)
> **Some DENTRO da mesma categoria · Multiplique ENTRE categorias diferentes.**
- Cada andar (Gold Stats · Gear · Passivas · Mémoires · Convergence · Ascension) é um fator **multiplicativo** independente — melhorar qualquer um melhora tudo. (Já implementado: dano e HP já multiplicam todas as fontes.)
- **Todo andar de longo prazo precisa crescer SEM teto fixo** (um motor exponencial/multiplicativo repetível, como a Clarté `1.07^níveis`), senão vira irrelevante num jogo que vai a 1e100. Hoje **Gear morre** (cap ~×31/peça) e **Passivas são fracas** (linear, teto baixo) → ambos precisam de motor sem teto.
- **Gold Stats podem morrer no late** (são as "rodinhas" do early — ok).
- Cada andar tem um **tema** (Gear=bruto/dano · Passivas=mecânicas · Mémoires=motor global · Convergence=bola de neve · Ascension=o salto entre mapas) para a escolha do jogador ter identidade.

### Dano dos mobs — RAZÃO CONSTANTE do HP (✅ CALIBRADO 2026-06-11, Camada 2)
> 🔄 **REVISTO 2026-06-11:** abandonada a curva "desacoplada / 75-80% das décadas" (tornava o dano irrelevante no fundo → Defesa decorativa). Decisão do Willian: **dano dos mobs = `0.02 × HP do mob`, CONSTANTE em todos os mapas** (`dmgLo=hpLo×0.02, dmgHi=hpHi×0.02`).

```
mob_dmg(L) = 0.02 × hp(L)          // por mob, por segundo (contínuo)
dano_recebido = Σ mob_dmg dos vivos do pack, MITIGADO pela Defesa (razão/armadura)
```
**Por que 0.02** (validado em `tools/sim/survival.mjs`): mantém o mob sempre ameaçador proporcional ao próprio HP → a **Defesa decide vida/morte na entrada de cada mapa**. Resultado da simulação:
- **Farmado** (mob aguenta ~3 hits): seguro, HP cheio.
- **Mapa novo** (mob aguenta ~10 hits): **MORRE sem Defesa / SOBREVIVE com Veil** (`def≈packDps` → ~50% mit, HP mín ~50%).
- **Muito fraco** (~30+ hits): parede real (farmar / Ascender / Despertar).
- Independe da calibração de Gear/Passivas/Mémoires (sai de razão+packs+regen+HP≈5.4×dano).

### Morte (🔒)
Morrer **recua uma subárea** e respawna em segundos, sem perda de recursos. Offline, a simulação só avança até o ponto sustentável — o jogador nunca abre o app morto. Morte é muro de posicionamento, não punição.

### DEFESA / MITIGAÇÃO (✅ DESIGN FECHADO 2026-06-11 — sessão de design)
Antes a defesa não existia (dano batia direto no HP); o afixo **Veil** e as passivas defensivas não tinham fórmula. Fechado:

**Forma = RAZÃO / armadura** (decisão do Willian — padrão ARPG, auto-escala):
```
mitigação    = defesa / (defesa + Σdano_do_pack)
dano_recebido = Σdano × Σdano / (defesa + Σdano)        // = Σdano × (1 − mitigação)
```
- **defesa = Σdano → 50%** mitigado; **defesa ≫ dano → perto de 100% mas NUNCA 100%** (sempre toma um fio → morte por se arriscar continua existindo, casa com "morte = muro de posicionamento").
- **Auto-escala pela RAZÃO** defesa/dano → defesa nunca morre nem trivializa, **sem teto** (encaixa na regra de ouro §4).
- Aplica sobre o **Σ dano do pack** por tick; **regen** (1%/s + 2%/kill) cura por cima, inalterado.

**Sobrevivência em DOIS eixos** (decisão do Willian — defesa só de Gear+Passivas, sem stat nova no §5):
- **VIT** (Gold Stat) = **poça de HP** (`hp_max`) — segura o early; pode morrer no late como toda gold stat.
- **Veil** (afixo de Gear) = **defesa** (a mitigação) — motor de longo prazo, cresce com o gear.
- **Passivas** reforçam os dois. Duas sub-camadas:
  1. passivas/gear que dão **defesa** → alimentam a fórmula de razão;
  2. passivas de **"reduz dano recebido"** (Nihel's Shadow) → **redução % à parte, aplicada DEPOIS** da armadura (armadura + DR separado, estilo ARPG).
  - **Last Light** (sobrevive a golpe fatal) e **Void Endurance** (+HP/regen sem teto) seguem como já definidos (§7).

**Defesa dos INIMIGOS** (sistema irmão — §14B): a MESMA fórmula virada → `dano_no_mob = seu_dano × seu_dano / (def_inimigo + seu_dano)`. **Void Piercing** (Éclat) fura X% da def; **Weakened Void** (Fracture) reduz; **Shard Disruption** estilhaça temporário. ✅ *forma* travada; se/quando mobs têm defesa relevante (early ≈ 0) = calibração.

⏳ **Calibração (por último):** curva de `defesa` por nível de Veil, % de cada passiva de DR, def dos inimigos por mapa/dificuldade, % do Void Piercing/Weakened Void.

### Pack size (mobs simultâneos por subárea) — herdado do BALANCE
```
        Sub1  Sub2  Sub3  Sub4  Sub5
Map 1:    1     2     4     6     8
Map 2:    5     8    11    14    18
Map 3:   10    14    17    21    24
Map 4:   14    18    22    26    29
Map 5:   20    26    31    36    40
```
O jogador ataca um mob por vez (projétil A→B); todos os ativos atacam o jogador. Boss entra no pool ativo após o kill threshold (oculto) e substitui 1 mob. Após a primeira derrota, o boss vira loop recorrente de recompensa (fonte do drip de Éclats — §11).

---

## 5. GOLD STATS (✅ estrutura · 🔒 milestones estendidos)

6 stats, todos resetam na Convergence. Custo universal: `custo(n) = 10 × 1.15^n` (paridade com a renda: tempo por compra ~constante).

| Stat | Efeito | Bônus/nível |
|---|---|---|
| str | dano por hit | +8% |
| vit | HP máximo | +6% |
| agi | attack speed (cap 1.25 APS) | +4% |
| lck | crit rate (overflow → crit damage) | +1.5% |
| frt | Lumens | +5% |
| wis | XP | +5% |

**Milestones estendidos (geométricos):** ×2 @10 · ×2.5 @25 · ×3 @50 · ×4 @100 · ×4.5 @200 · ×5 @400 · ×5.5 @800 · ×6 @1600 · ×6.5 @3200 (lck com milestones menores, como no BALANCE original). Crit camada única: excedente de Crit Rate acima de 100% transborda para Crit Damage (decisão mantida).

---

## 6. XP, LEVEL DO SEEKER E O PORTÃO DE CONVERGENCE (✅ CALIBRADO)

### O portão é uma parede de XP geométrica — o level é display
```
xp_por_kill        = mob_hp × 0.08 × wis_total
parede_da_run(c)   = 1500 × Π(i=0..c-1) [1.5 × 1.06^i]     // c = convergences feitas
level_do_Seeker    = (XP_total_da_vida / 10)^0.4            // display: explode rumo a 1e9
```
- Quando o XP da run enche a parede → **Convergence disponível** (botão acende; portão estilo Gaiadon).
- A razão da parede cresce (×1.5 no início → ×15+ no fim): **~81 Convergences na vida**, cadência média ~4h, sem deadlock em nenhum ponto (validado).
- O level exibido é função do XP acumulado da vida — números enormes e satisfatórios (milhões de níveis por run no late game) sem quebrar o portão.

### Convergence — reset, pontos e fator  (🔄 REVISTO 2026-06-11 — sessão de design)

**Reset:** a Convergence reseta **só o econômico** — Lumens, Gold Stats e a parede de XP da run.
- **O progresso de mapa NÃO reseta** (revisão): sub-áreas desbloqueadas e Guardiões derrotados persistem. O jogador volta a farmar com stats zerados, mas **viaja livre** por qualquer sub-área já aberta (a morte/recuo corrige quem se arrisca além do que aguenta). Re-subir vira *recuperar poder*, não *re-pagar pedágio* — elimina o tédio de re-gatear o mapa a cada run.
- Ascension continua sem resetar nada.

**Pontos da run (revisão — substitui "profundidade alcançada"):**
```
pontos_da_run = f(xp_run)  +  bônus_boss_final     // f com retorno decrescente (sqrt/log)
```
- A run rende pela **"luz juntada" = `xp_run`** (já é HP destruído × 0.08 × wis → pondera profundidade: mob fundo vale ordens de grandeza mais). O retorno decrescente cria o dilema *convergir cedo e frequente* vs *farmar mais fundo*.
- **Bônus único** por matar o **Boss final do mapa** na run — objetivo de run (prêmio extra, não requisito da Convergence).
- **Anti-cheese:** spam de trash da Sub 1 dá luz desprezível; ir fundo é exponencialmente melhor. **Escala entre mapas:** mob do Map 2 dá ~1e10× mais luz → convergir lá vale ordens de grandeza mais (com o `asc_mult`, é o que faz "tudo do Map 1 não bastar pro Map 2").
- ✅ **DIREÇÃO TRAVADA (Tópico 2.1): recompensa COMPOSTA, não aditiva.** `conv_factor ≈ base^Σpontos` — primeiros pontos valem pouco, pontos do late disparam (bola de neve estilo Synergism). `f(xp_run)` usa **retorno decrescente** → dilema "converter cedo e frequente vs farmar mais fundo".
- ✅ **CALIBRADO (Camada 7, 2026-06-11)** — `tools/sim/convergence.mjs`: `conv_factor = (1 + 0.04 × 1.38^ascensions)^(Σ pontos)`. A Ascension **zera os pontos mas AMPLIFICA a base** (§8 aninhado): base **1.04 (A0) → 1.20 (A5)**; pico por era **0.85 → 3.96 décadas** (era final = orçamento ~4). O aditivo antigo `1+0.15×pts` era um **bug** (morria em 1.57 déc).
- ⚠️ **DEPENDÊNCIA ABERTA (auditoria 2026-06-11):** o pico de ~4 décadas assume **~50 pontos de pico por era**, mas os pontos vêm de **`f(xp_run)`** — função **ainda não desenhada**. **Requisito de design p/ a futura sessão de Escala** (ver abaixo).

**✅ PAPEL E RITMO — VALIDADO 2026-06-12 (sessão de validação com Willian):**
- A Convergence é o **prestige de APRENDIZADO do early game**: no jogo manual (Map 1) são **~5 a 10 convergences por mapa**, cada uma **significativa**. **Pós-A1** ela é **automatizada pelo Fate Keeper A1** e vira **motor de fundo** (zero cliques).
- **Requisito formal para a sessão de Escala** — `f(xp_run)` deve produzir: (1) **paredes longas** (poucas convergences por sessão), (2) **retorno decrescente** que, junto com o **bônus único do boss**, **incentive runs longas**, e (3) **pico de ~50 pontos por era** (sustenta as ~3-4 décadas do `conv_factor` aninhado).
- ❌ **DESCARTADA (com justificativa) — "desabilitar a Convergence após a A1 em troca de bônus estático":** mataria as **~3 décadas das eras finais** do `conv_factor` aninhado, **esvaziaria o Fate Keeper A1** (que existe justamente para automatizar a Convergence), e **bônus estático é recompensa fraca**. A **automação já entrega a mesma experiência de zero cliques** sem nenhum desses custos.

**1ª Convergence:** requisito = **só encher a parede** (~1.500 XP, sem gate extra); alvo de pacing ~5-10 min de jogo ativo. Desbloqueia as Passivas (lore: a Semente desperta) + concede os Vestiges da run.

---

## 7. VESTIGES → PASSIVAS (✅ economia · ⏳ efeitos individuais)

### Renda
```
vestiges_por_kill = ceil((subÍndice_no_mapa + 1) × 0.5) × 3^(índice_do_mapa)
vestiges_por_boss = vestiges_por_kill × 10
```
Map 1: [1, 1, 2, 2, 3] por kill nas Subs 1-5 (onboarding: a 1ª Convergence já chega com ~1-2k Vestiges). Map 5 Sub 5: 243/kill.

### Custos das Passivas
- **Desbloqueio** (posição na árvore, por era): 100 / 500 / 2.500 / 12.500 / 62.500 (×5)
- **Evolução:** nível n custa `desbloqueio × 0.3 × 1.30^(n-1)`
- Orçamento natural: jogador engajado investe ~40% da renda de Vestiges em passivas; 60% poupa para Ascension (dilema estratégico central da economia).

### As 3 árvores (estrutura herdada do DESIGN — 45 passivas, efeitos numéricos ⏳)
**Éclat (combate):** Radiant Strike, Shard Burst, Luminal Edge, Resonant Force, Éclat Surge, Execute, Overkill, Momentum, Refraction, Crit Cascade, Luminal Explosion, Or Ein Sof's Touch, Shattered Light, Fracture Weakness, Void Piercing.
**Vestige (economia):** Lumen's Blessing, Wisdom of Ruins, Remnant Harvest, Vestige Pull, Scavenger, Dreamwalker, Beast Caller, Hoarder, Awakened Harvest, Echo of Greed, Void Scavenger, Eternal Vestige, Fractured Soul, Luminal Cache, The Collector.
**Fracture (utilidade):** Weakened Void, Fracture Sense, Void Awareness, Fracture Pulse, Void Haste, Shard Disruption, Nihel's Shadow, Éclat Attunement, La Fracture's Echo*, Last Light, Void Collapse, The Fracture's Gift, Claimed Domination, Nil's Embrace, Void Endurance.
*(renomear para "La Fracture's Echo" conforme revisão de lore)*

Nota de calibração: no simulador as passivas entram como agregado (+5% dano/nível de passiva); a distribuição individual dos 45 efeitos deve somar a esse envelope por era.

### 🟡 DIREÇÃO DAS PASSIVAS (✅ TRAVADA 2026-06-11 — Tópico 2.3)
> **Passivas = o andar das MECÂNICAS e dos multiplicadores de economia.** Cada uma das 45 tem **efeito único** (não o "+5% genérico" do placeholder atual).
- **Éclat (combate):** mecânicas agressivas (Execute, Overkill, Momentum, Crit Cascade…). ⚠️ As que furam o cap de 1 kill/ataque (Execute/Overkill) só entram após a decisão "15 APS + âncora de kills".
- **Vestige (economia):** multiplicadores de ganhos (Lumens/XP/Vestiges) com **crescimento sem teto** (regra de ouro §4).
- **Fracture (utilidade):** QoL e defesa (HP, regen, velocidade, offline…).
- Mantidos: moeda = Vestiges · gate por grupo (max 5 → abre próximos 5) · nunca resetam.
- **🟢 PRINCÍPIO (2026-06-11): passivas são PURO-POSITIVO, sem trade-offs.** Todas são desbloqueadas/maximizadas com o tempo (não há escolha de build), então nenhuma passiva tem lado ruim/custo de oportunidade — cada uma é só "uma coisa boa que você vai ter". Vale para as 3 árvores.
- **Ideias do Willian já registradas como candidatas:** aumentar o **cap de mobs na tela**; aumentar **recursos** (incl. futuros, ainda não implementados); **stats extras**.
- ⏳ Tabela dos 45 efeitos: em construção — catálogo de referências (Synergism · Gaiadon skill/apoteose · Tap Titans 2) em pesquisa; tabela final aprovada pelo Willian antes de produção.

#### Tabela de efeitos — EM CONSTRUÇÃO (sessão in-chat, 2026-06-11)
> **Método:** primeiro define-se SÓ o efeito de cada passiva (as 3 árvores). O **POSICIONAMENTO** (quais 5 ficam em early/mid/late = grupos 1/2/3, gate sequencial: max grupo N → abre N+1) é uma **passada dedicada DEPOIS**, com as 3 árvores prontas. A coluna "hint" abaixo é só dica leve, não final.

**Éclat (combate) — efeitos definidos:**
| Passiva | Efeito aprovado | Hint |
|---|---|---|
| **Radiant Strike** | +X% dano/nível — motor de dano direto, sem teto (âncora da árvore) | early |
| **Luminal Edge** | +crit damage/nível (LCK dá fração mínima; resto = aqui + gear) | early |
| **Éclat Surge** | a cada X s, o próximo ataque é massivamente amplificado (carga/pulso) | early |
| **Refraction** | crit tem chance de **ricochetear** num 2º mob (sinergia com crit) | early |
| **Shard Burst** | a cada N ataques, dano numa fração da onda (não mata extra; só espalha) | mid |
| **Resonant Force** | **streak**: +dano acumulando por kill seguido (zera ao parar/morrer) | mid |
| **Execute** | mobs abaixo de X% HP morrem na hora — ⚠️ kill por Execute paga ~50% | mid/late |
| **Overkill** | dano excedente do kill vaza p/ o próximo mob — ⚠️ extra paga ~50% | mid/late |
| **Crit Cascade** | um crit **aumenta a chance do próximo** (acumula até um não-crit) | mid |
| **Momentum** | **streak→crit chance**: +crit chance por kill seguido. Ao passar de 100% (com gear), o excedente vira **crit damage** (overflow §14B). Par do Resonant Force | mid |
| **Luminal Explosion** | ao matar, **chance de detonar dano em TODA a onda viva** — ⚠️ kills da explosão pagam ~50% | late |
| **Or Ein Sof's Touch** | a bênção dourada (única branco-dourado da árvore): **multiplicador global de dano sem teto** — passiva-prêmio do fim | late |
| **Shattered Light** | **+crit damage elevado/nível** (amplificador forte de crit; sem trade-off — todas as passivas são desbloqueadas) | late |
| **Fracture Weakness** | aplica **fraqueza**: inimigos recebem +X% de dano (debuff; vetor que multiplica com o resto) | mid/late |
| **Void Piercing** | **penetra X% da DEFESA** dos inimigos (anti-tank) — ⚠️ requer o sistema de **defesa de inimigos** (a implementar) | late |

**✅ Árvore Éclat 15/15 definida (efeitos).** Posicionamento (grupos) na passada dedicada.

**Vestige (economia) — efeitos definidos** *(loot é AUTOMÁTICO — renda direta no kill, sem coleta no chão):*
| Passiva | Efeito aprovado | Hint |
|---|---|---|
| **Lumen's Blessing** | +X% Lumens/nível — sem teto (âncora de economia) | early |
| **Wisdom of Ruins** | +X% XP/nível — acelera a parede de Convergence (motor indireto) | early |
| **Remnant Harvest** | +X% Vestiges/nível (⚠️ leve laço Vestige→Vestige — conter na calibração) | early |
| **Scavenger** | chance de um kill render **em dobro** (saque; ×2, não +%) | early |
| **Vestige Pull** | ⏳ **redirecionada para MATERIAIS** (recurso de boss p/ subir raridade de gear, §13): +ganho de materiais. Efeito e o sistema de materiais a desenhar | — |
| **Dreamwalker** | aumenta a eficiência do **progresso offline** até o teto de **100% do ativo** (nunca acima; cap de acúmulo 24h) | mid |
| **Beast Caller** | gancho de **Echoes** (futuro): fortalece o bônus deles. Ponte sem Echoes: +% de Vestiges de **bosses** | mid |
| **Hoarder** | **juros sobre o cofre**: quanto mais Vestiges guardados, +% Lumens/XP (X turbina Y, sem teto) | mid |
| **Awakened Harvest** | multiplicador **global** de toda a colheita (Lumens+XP+Vestiges) — o "guarda-chuva" | mid |
| **Echo of Greed** | a cada X s, **explosão de Lumens** (pulso dourado de renda, estilo Heart of Midas) | mid |
| **Void Scavenger** | saque duplo (Scavenger) que **escala com a profundidade** — premia farmar fundo | late |
| **Eternal Vestige** | cada **Convergence feita** dá bônus permanente de ganhos (prestige→economia, sem teto) | late |
| **Fractured Soul** | uma fração do **dano causado** vira Lumens bônus (combate ↔ economia) | late |
| **Luminal Cache** | **cofre** que acumula % da renda e você coleta ao voltar (sinergia c/ Dreamwalker, cap 24h) | late |
| **The Collector** | meta: **fortalece todas as outras passivas de economia** (% por nível) — fecho da árvore | late |

**✅ Árvore Vestige 15/15 definida.** Nota XP: cobertura proposital de 1 dedicada (**Wisdom of Ruins**) + globais (Awakened Harvest, Hoarder, Scavenger/Void Scavenger) + Mémoire "de la Marche" — XP é "double-dip" (nível do Seeker **e** parede de Convergence), logo potente por ponto; não se inunda de passivas de XP de propósito. *(Willian pode pedir +peso em XP.)*

**Fracture (utilidade / defesa / QoL) — efeitos definidos:**
| Passiva | Efeito aprovado | Hint |
|---|---|---|
| **Weakened Void** | **reduz a defesa** dos inimigos (par do Void Piercing) — req. sistema de defesa | mid |
| **Fracture Sense** | chance de **pular onda** / parte da contagem ao limpar (stage skip) | early |
| **Void Awareness** | **+mobs por onda** (aumenta o cap da tela — §14B) | mid |
| **Fracture Pulse** | **+APS** — a passiva-CHAVE para bater o teto de ~15 (com gear; AGI é só a base pequena) | early/mid |
| **Void Haste** | +velocidade de **respawn da onda** (menos tempo morto entre ondas) | early |
| **Shard Disruption** | chance de **estilhaçar a defesa** do alvo por alguns segundos (debuff temporário) | mid |
| **Nihel's Shadow** | **defensiva**: reduz o dano recebido / devolve parte ao atacante (sobreviver ondas cheias) | mid |
| **Éclat Attunement** | aumenta o ganho de **pontos de Convergence** (a luz juntada rende mais) | mid/late |
| **Last Light** | **sobrevive a um golpe fatal** com 1 HP (1×/onda ou cooldown) — rede de segurança | mid |
| **Void Collapse** | a cada X kills, colapso que tira **% da vida MÁX** de todos os mobs (não escala c/ seu dano) + reduz o dano deles — **anti-tank** (destrava ondas onde seu dano empaca). *Distinto do Luminal Explosion (ofensivo, escala c/ seu dano)* | late |
| **La Fracture's Echo** | efeitos periódicos (surge/burst/colapso) têm chance de **ecoar** (disparar 2×) — turbina todo efeito temporizado | late |
| **The Fracture's Gift** | concede **níveis grátis de Gold Stats** por nível — empurrão que **sobrevive ao reset** da Convergence (a "stats extras" do Willian) | late |
| **Claimed Domination** | bônus forte contra **bosses/Guardiões** (+dano e/ou +defesa contra eles) — matador de boss | mid/late |
| **Nil's Embrace** | eleva o **teto do offline** (dentro das 24h) / reduz dano ao voltar — par do Dreamwalker, sem furar "offline ≤ ativo" | mid |
| **Void Endurance** | **+HP e regen sem teto** — motor defensivo de longo prazo (o "prêmio" defensivo da árvore) | late |

**✅ Árvore Fracture 15/15.** 🎉 **AS 3 ÁRVORES ESTÃO COMPLETAS — 45/45 passivas com efeito definido.**

#### GRADE DE POSICIONAMENTO — ✅ APROVADA 2026-06-11 (gate: maximizar o grupo → abre o próximo)
| Árvore | Grupo 1 (early) | Grupo 2 (mid) | Grupo 3 (late — os mais fortes / escalam c/ o jogo) |
|---|---|---|---|
| **Éclat** | Radiant Strike · Luminal Edge · Éclat Surge · Refraction · Crit Cascade | Shard Burst · Resonant Force · Momentum · Fracture Weakness · Execute | Overkill · Luminal Explosion · Or Ein Sof's Touch · Shattered Light · Void Piercing |
| **Vestige** | Lumen's Blessing · Wisdom of Ruins · Remnant Harvest · Scavenger · Echo of Greed | Awakened Harvest · Hoarder · Dreamwalker · Beast Caller · **Vestige Pull (materiais)** | **Void Scavenger** · Eternal Vestige · Fractured Soul · Luminal Cache · The Collector |
| **Fracture** | Fracture Pulse (APS) · Void Haste · Fracture Sense · Void Awareness · Last Light | Weakened Void · Shard Disruption · Nihel's Shadow · Éclat Attunement · The Fracture's Gift | Void Collapse · La Fracture's Echo · Claimed Domination · Nil's Embrace · Void Endurance |

> **✅ SISTEMA DE PASSIVAS — DESIGN COMPLETO** (efeitos + posicionamento).
>
> **✅ CALIBRAÇÃO (Camada 5) 2026-06-11** — `tools/sim/passives.mjs`. Esquema (não 45 números soltos):
> - **maxLevel = 12** p/ toda passiva (capado → o gate grupo→grupo sempre funciona); **custo por grupo = [1,10,100]× Vestiges**.
> - **Orçamento ~8 décadas** por árvore (Éclat=dano, Fracture=HP): a **maioria** são **% aditivos** (g1 5% · g2 10% · g3 20% por nível) ⇒ ×~14; e **3 passivas "motor" no grupo 3** (×1.52/nível, capadas) ⇒ ×3.5M. Total **~7.7 décadas** ✅. Respeita §14B (grupo 3 concentra as mais fortes: Fractured Soul, Or Ein Sof's Touch, Luminal Explosion…).
> - **Alavancas funcionais:** Fracture Pulse → APS ~1.5→10 (gear fecha p/ 15) · Luminal Edge → crit p/ 100% · Void Awareness → +cap mobs (→24) · Void Piercing/Weakened Void → def inimigos · Vestige Pull → × material.
> - ⏳ resta: aplicar o esquema aos 45 valores no `constants.js` (wiring; hoje +5% agregado placeholder).

---

## 8. ASCENSION + DESPERTAR (✅ REDESENHADO 2026-06-11 · ✅ VALIDADO 2026-06-12 · ✅ wirado Passos 1-7)
> **Ascension = marco de progressão** (mapa novo + bolsa + Fate Keeper + amplifica a base da Convergence); **Despertar = mudança de classe** (×poder/tier + arte, no meio do mapa). Dois sistemas distintos — ver blocos ✅ VALIDADO abaixo. ⏳ asc_mult ×2 e Eco do Seeker (A3) = código pendente (calibração/wiring).

### Redesenho — DIREÇÃO TRAVADA 2026-06-11 (prestige aninhado, insp. AD/Synergism)
A Ascension vira o **loop de prestige de cima** (a Convergence é o de baixo):
- **🔻 Setback:** a Ascension **reseta a camada da Convergence** (pontos → 0, `conv_factor` → 1) + recomeça o mapa. *(Revisa o antigo "Ascension não reseta nada".)*
- **🔺 Leap permanente:** (1) **amplifica a Convergence** — cada ponto passa a valer mais (base composta sobe), re-subir fica mais rápido E mais forte ("perde os multiplicadores, mas agora são maiores"); (2) **`asc_mult`** (×dano/HP); (3) **sobe o teto do Gear**; (4) **desbloqueia 1 MECÂNICA nova** (Fate Keeper / game-changer); (5) **Éclats + materiais**.
- **Frequência: mantém 5 (1 por mapa)** — a Convergence é o loop frequente; a Ascension é o raro/épico (estrutura saudável dos idles: camada de cima rara).
- **Fate Keepers = game-changers / recompensas muito fortes** (5 mecânicas, 1 por Ascension) — quais 5: pesquisa + escolha numa sessão dedicada.
- ⏳ **Pendente (registrado):** as **15 Mémoires precisam do mesmo tratamento das passivas** (pesquisa + efeito de cada uma) — tópico próprio.

### FATE KEEPERS + MODOS DE DIFICULDADE (✅ FECHADO 2026-06-11 — insp. Grand Chase)

**Modos de dificuldade** (🔁 REVISADO 2026-06-11 — a "expansão do que já tenho", re-usa os 5 mapas, sem lore novo):
- Re-rodar mapas limpos em dificuldade maior → mobs com **HP e dano muito maiores** + **recompensas melhores** (materiais, Éclats, drip). É o endgame de farm.
- Nomes (sujeitos a mudança): **Difícil · Nightmare · Tormento**.
- **Desbloqueio = UM gate só, na A2.** A A2 abre o **SISTEMA de dificuldades inteiro** — não libera um modo por Ascension.
- ✅ **VALIDADO (sessão de validação com Willian, 2026-06-12): seleção GLOBAL, não por sub-área.** A escolha de dificuldade vale para o jogo todo (o código do Passo 5 já é assim). **Justificativa:** o comportamento real do jogador (insp. Grand Chase) é *farmar o mapa mais alto que aguenta, na maior dificuldade que aguenta*; com **viagem livre** (a Convergence não reseta o mapa), **seletor global + viajar = escolha por mapa, sem UI extra**. *(Substitui o texto anterior "escolha por sub-área".)*
- ✅ **VALIDADO 2026-06-12 — âncora do endgame no Map 4:** o farm de modos altos ancora no **Map 4** (até **Tormento ×1e30 cabe no teto 1e100** lá). O **Map 5 é Normal-only** até a migração break_infinity — **POR DESIGN**, não limitação.
- **O gate real das dificuldades mais altas é o PODER do jogador**, não a Ascension: como cada modo multiplica MUITO o HP/dano dos mobs, você simplesmente não consegue limpar Nightmare/Tormento sem estar forte o bastante. A progressão se auto-regula (você sobe de modo quando aguenta), sem trancar atrás de marcos.
- Cada tier estende a faixa de HP/dano (ex. ilustrativo do Willian: Normal ~→1e50 · Nightmare ~1e50–1e190 · Tormento ~1e190–1e300 → **rumo a 1e300 = território break_infinity no endgame**).
- ✅ **CALIBRADO (Camada 7, 2026-06-11)** — `tools/sim/convergence.mjs`. Multiplicadores por tier (×HP **e** ×dano dos mobs / ×recompensa material+Éclats):
  | Tier | ×HP/dano | ×recompensa | Teto |
  |---|---|---|---|
  | **Difícil** | ×1e5 | ×3 | cabe dentro de 1e100 (jogável no base) |
  | **Nightmare** | ×1e15 | ×10 | ⚠️ passa de 1e100 → **break_infinity (CP futuro)** |
  | **Tormento** | ×1e30 | ×30 | ⚠️ **break_infinity (CP futuro)** |
  A renda já sobe naturalmente com o ×HP; o ×recompensa é **bônus por cima**. No jogo base só **Difícil** cabe inteiro; Nightmare/Tormento ficam prontos no design pra quando o break_infinity entrar.

**Craft/Materiais = sistema BASE, NÃO Ascension** (🔁 decisão 2026-06-11): evoluir Gear (subir raridade via materiais) precisa estar disponível **cedo** no jogo, não trancado atrás de uma Ascension tardia. Sai dos Fate Keepers. Vira sistema próprio (early/mid) — sessão de design dedicada.

**Os 5 Fate Keepers (1 por Ascension)** — ✅ **escada VALIDADA 2026-06-12:** A1 automatiza o early · A2 reabre o passado · A3 desdobra o jogador · A4 adensa o presente · A5 transcende.
| A | Fate Keeper | Conteúdo |
|---|---|---|
| **A1** | **Automação básica** (automatiza o early) | auto-comprar Gold Stats + auto-Convergir (destrava o idle) |
| **A2** | **Auto-progressão + abre as Dificuldades** (reabre o passado) | auto-limpar sub-áreas/auto-Despertar + desbloqueia o **SISTEMA de dificuldades** (seleção **GLOBAL**; modos altos gateados por poder, não por Ascension) |
| **A3** | **Eco do Seeker** (desdobra o jogador) | ✅ **VALIDADO 2026-06-12 (substitui "Motor de Éclats"):** um **eco** farma **EM SEGUNDO PLANO** um mapa já limpo à escolha do jogador, rendendo **materiais/Lumens/Vestiges a uma fração** do normal (⏳ **25-40%, calibrar**), em paralelo ao jogo ativo. Resolve a dor de voltar a mapas antigos por material de refino. **Nota de arquitetura:** é o **precursor dos Echoes (pets)** pós-MVP — quando implementados, herdam este sistema. |
| **A4** | **+Cap global de mobs** (adensa o presente) | sobe o teto de inimigos simultâneos na tela → mais kills/s de pico = mais farm (recursos/Éclats/materiais). Insp. Synergism/Gaiadon. ⏳ valor do salto = calibração |
| **A5** | **Transcendência** | loop infinito pós-Nihel (§16.7) + meta-multiplicador permanente (pós-MVP) |

**Expansão de sub-áreas (futuro):** o nº de sub-áreas por mapa CRESCE (ex.: Map 1 ~6 → Map 5 ~11-14) p/ suavizar a curva de HP (ideia 4). A **Auto-progressão (A2)** escala com isso. *(§3 hoje fixa 5/mapa — será variável.)*
> ✅ **VALIDADO 2026-06-12 — Despertar = a MUDANÇA DE CLASSE** (insp. Grand Chase). O tier (T1→T5) é **desacoplado das ascensions** e vira **gate de poder no MEIO do mapa** (estilo "awakening"): você chega à região do boss final **já evoluído**, e sem despertar os mobs ficam tanky/letais demais (parede natural).
- **Quando:** ao alcançar a **Sub-área 3** do mapa + **requisito** (agora em 3 camadas).
- **Requisito — 3 camadas (✅ APROVADO 2026-06-13, insp. job-change do Grand Chase):** o Despertar deixa de ser automático e vira um **ato do jogador na tela de Awakening** quando as três camadas fecham:
  1. **Prova (combate):** derrotar o **Guardião da Sub 3** do mapa. Vencer o Guardião apenas **destrava** a Prova (não desperta sozinho).
  2. **Oferenda (material dedicado):** juntar **Nitzotzot** — *as fagulhas sagradas espalhadas na HaShevirah* (hebraico, língua primordial; é literalmente "a luz dispersa" do credo da Ordre e a moeda da tese de Convergência). **Recurso DEDICADO** (estado próprio, NÃO os materiais do Forge — evita disputa com o craft). **Fonte:** chunk garantido ao vencer o Guardião + filete nas **Sub-áreas 3+** do mapa (espelha `awardMaterials`). Como cada Despertar é num mapa diferente, o Nitzotz é farmado **no próprio mapa** do tier.
  3. **Tributo (Vestiges):** custo em Vestiges, **fração da Ascension daquele mapa** (~10–20%) — o Despertar é no MEIO do mapa, então não pode drenar o relógio de Vestiges duas vezes.
- **Efeito:** **×5 de poder PERMANENTE por tier** (dano E HP) + **arte (card moldura-fundida) + rank** novos. Sobrevive a todos os resets, incl. Ascension. *(⏳ `DESPERTAR.mult` provisório = ×5 — calibração.)*
- **⏳ NÚMEROS = LISTA DE CALIBRAÇÃO** (estrutura aprovada, valores provisórios a afinar):

| Tier | Prova | Oferenda (Nitzotzot) — provisório | Tributo (Vestiges) — provisório |
|---|---|---|---|
| **T2 Illuminate** | Guardião Sub3 Map1 | 20 | ~15% Asc Map1 (≈75k) |
| **T3 Éclairé** | Sub3 Map2 | 40 | ~15% Asc Map2 (≈285k) |
| **T4 L'Éveillé** | Sub3 Map3 | 80 | ~15% Asc Map3 (≈600k) |
| **T5 Lumière** | Sub3 Map4 | 160 | ~15% Asc Map4 (≈1.2M) |

  - *Drop do Nitzotz e quantidades calibram juntos (deve custar "um pedaço sentido" do farm da região do Guardião).* Opcional debatido: **atalho** pagando mais Vestiges/Éclats pra cortar parte da Oferenda — NÃO entra sem nova decisão.
  - *Tela de Awakening mostra: card alvo + ganhos **antes→depois** (×5) + as 3 barras de gate + botão "Awaken" → cerimônia. Arte: os 5 cards por tier + fundo dedicado da aba + 1 splash de cerimônia por tier.*
- **Distribuição:** **T2-T5 nas Sub 3 dos Maps 1-4** (T2 Illuminate · T3 Éclairé · T4 L'Éveillé · T5 Lumière). **O Map 5 NÃO tem Despertar** — o jogador enfrenta Nihel já como **Lumière (T5)**.
- **Despertar ≠ Ascension (papéis distintos, ✅ validado):** o **Despertar** é a *mudança de classe* (poder + arte) no meio do mapa; a **Ascension** é o *marco de progressão* (mapa novo + bolsa + Fate Keeper + amplifica a base da Convergence) no fim do mapa. Dois sistemas.
- *Código (Passo 7, feito):* `currentRank`/arte/moldura leem o **tier de Despertar** (`state.despertares`), não `state.ascensions`.
- *⏳ Código (pendente, redesign 2026-06-13):* hoje `checkDespertar` ([combat.js](../src/game/combat.js)) **incrementa `state.despertares` automaticamente** ao vencer o Guardião. Com as 3 camadas, isso muda: o Guardião só **destrava a Prova**; o incremento passa a ser disparado pelo **botão "Awaken"** da tela (gastando Nitzotzot + Vestiges). Adicionar: `state.nitzotzot` + drop no `economy.js` + gate/ação no `awaken.js`.

| Ascension | Requisito | Custo (Vestiges) | asc_mult | Éclats (bolsa) | Rank desbloqueado |
|---|---|---|---|---|---|
| A1 | Boss Map 1 | **500.000** | **×10** | 100 + desbloqueia drip | Illuminate |
| A2 | Boss Map 2 | **1.900.000** | ×5 | 300 | Éclairé |
| A3 | Boss Map 3 | **4.000.000** | ×5 | 900 | L'Éveillé |
| A4 | Boss Map 4 | **8.000.000** | ×5 | 2.700 | Lumière |
| A5 | Derrotar Nihel | **grátis** | — | final do jogo base | — |

- **Os custos são o cronômetro de cada mapa** — todas as durações são vestige-gated por design. Cinco números controlam o ritmo do jogo inteiro. asc_mult aplica a dano **e** HP.
- ✅ **VALIDADO 2026-06-12 — asc_mult passa para ×2 por mapa (×16 total)**, não mais ×10/×5/×5/×5 (×6.250). Motivo: o **Despertar** (×5/tier) assume o grosso do salto de poder por mapa; a Ascension fica como **marco de progressão** (mapa+bolsa+Fate Keeper+amplifica a Convergence), com um empurrão modesto. ⏳ **Vai para a LISTA DE CALIBRAÇÃO — NÃO alterar o código agora** (a tabela acima mostra os valores atuais do código).
- ✅ **VALIDADO 2026-06-12 — bolsas de Éclats (100/300/900/2.700) são SIMBÓLICAS por design.** São o empurrão do early e **perdem relevância frente ao drip DE PROPÓSITO** — não é bug, não "consertar" nem escalar. A recompensa *sentida* da Ascension é **mapa novo + Fate Keeper + proximidade do Despertar**. O Mémoire **#12** segue multiplicando drip **e** bolsas, sem ajuste.
- A1 = ×10 hoje (vira ×2 na calibração); cerimônia: rank da Ordre + memória de lore do mapa.
- **Gear persiste**; o mapa novo abre o tier seguinte de gear e o antigo pode ser **reforjado** como material.
- Nada além do que a Convergence já reseta é perdido.

---

## 9. DURAÇÕES VALIDADAS (✅ simulador v3)

| Mapa | Bot ótimo 24/7 | Casual estimado (×3) | Alvo |
|---|---|---|---|
| 1 | 2.8 d | ~8-9 d | 15-20 (esticável via A1) |
| 2 | 3.3 d | ~10 d | 10-12 ✓ |
| 3 | 2.3 d | ~7 d | 7-8 ✓ |
| 4 | 1.8 d | ~5.5 d | 5-6 ✓ |
| 5 | 3.5 d | ~10.5 d | 4-5 (afinar drip era 5) |
| **Total** | **13.6 d** | **~41 d** | **45-50 ✓** |

---

## 10. ÉCLATS — MOEDA-RELÍQUIA DE NÚMERO GRANDE (✅ CALIBRADO)

Duas fontes, ambas liberadas pela **A1**:
1. **Bolsas de Ascension** (cerimônia de compras): 100 / 300 / 900 / 2.700.
2. **Gotejamento (boss farm):** `éclats_por_hora = 0.1 × (HP_do_frontier)^0.9` enquanto farma mapas já limpos. Escala com a profundidade — Éclats viram número grande como tudo no jogo (como Relics no TT2, que chegam a e3000). Lore: quanto mais fundo o Seeker alcança, mais fragmentos a Semente atrai.

---

## 11. MÉMOIRES (✅ motor · ✅ efeitos fechados · ✅ CALIBRADO Camada 6 2026-06-11)

> **✅ Calibração (Camada 6):** Clarté **1.07** entrega ~**70 décadas** em ~159 níveis/Mémoire (alcançados no Map 5 no ritmo certo). **Custo corrigido p/ `2×3.0^n`** (o `1.10^n` era um bug: renda > custo por ~80 ordens → instantâneo). Drip `0.1×HP^0.9`, unlocks `10/30/90/270/810` e os 15 efeitos inalterados. Validado em `tools/sim/memoires.mjs`.

15 relíquias, 3 por era, desbloqueadas pela Ascension da era. Cada compra revela um texto de memória — **a meta-progressão é o veículo da narrativa**. Nomes/eras são **canônicos** (lore bible); o **motor** (Clarté, custos) está calibrado; os **efeitos** estão recebendo o mesmo tratamento item-a-item das passivas.

> **Princípios dos efeitos** (sessão 2026-06-11): (1) **tema = motor global** — efeitos são *amplificadores amplos* (dano, renda, outros sistemas), não mecânicas novas (mecânica = Passivas); (2) **casam com o NOME** (narrativa é o veículo); (3) **sem teto / não saturam** (nível é infinito — nada de "+X% chance" que estoura 100%); (4) **podem alimentar os sistemas novos** (materiais, defesa, dificuldades).
>
> **Referências de recompensa-forte** (pesquisa 2026-06-11 — TT2, Synergism, Gaiadon): os arquétipos de recompensa mais potentes do gênero são, em ordem: **(a) acelerar a própria meta-moeda** (TT2 *Book of Shadows* = +relíquias/prestige; Synergism *Quark Hepteract*) → nossa âncora é o **ganho de Éclats** (#12); **(b) multiplicador GLOBAL amplo** (TT2 *All Hero Damage / All Gold*) > bônus estreito; **(c) multiplicativo sem teto** (Synergism *Way Too Many Multipliers*) = nossas Mémoires ×1.10/nível; **(d) compressão de TEMPO** (Chronos/Portar/offline) = #6 offline; **(e) APEX = amplificar o próprio motor / todas as outras recompensas** (boost de expoente) = #14 (expoente da Clarté) e #15 (+% a todas as Mémoires). ⇒ a estrutura atual **já contém os arquétipos apex nas Eras 4-5** — a pesquisa valida a direção.

- **Desbloqueio:** 10 / 30 / 90 / 270 / 810 Éclats (por Mémoire, conforme era)
- **Evolução:** nível n custa **`2 × 3.0^n`** Éclats 🔧 (Camada 6, 2026-06-11: era `1.10^n` — raso demais vs o drip → maximizava instantâneo e trivializava o jogo; **3.0** paceia o leveling pela profundidade, validado em `tools/sim/memoires.mjs`)
- **Clarté (motor global):** dano ×`1.07^(soma de todos os níveis de Mémoires)`
- **Mémoires multiplicativas (×1.10/nível):** a partir da **A3**, ~metade dos níveis novos (la Blessure e similares) — o turbo do endgame. As Mémoires carregam ~75 das 99 décadas do jogo.

| # | Mémoire | Era | Efeito por nível | Status |
|---|---|---|---|---|
| 1 | du Premier Matin | 1 | +10% dano global | ✅ travado 2026-06-11 |
| 2 | des Rires | 1 | +10% Lumens (acelera o re-stat a cada Convergence) | ✅ travado 2026-06-11 |
| 3 | de la Marche | 1 | +8% XP (a Mémoire dedicada de XP — double-dip level+Convergence) | ✅ travado 2026-06-11 |
| 4 | de la Forme | 2 | +8% Crit Damage (nunca satura — casa com o transbordo de crit, §14B) | ✅ travado 2026-06-11 |
| 5 | du Façonnage | 2 | **+% materiais dropados** *(troca de "+6% efeito de Gear")* — "façonnage"=forjar; alimenta o Craft (§13B) | ✅ travado 2026-06-11 |
| 6 | des Profondeurs | 2 | +10% offline (respeita teto 24h / ≤ ativo) | ✅ travado 2026-06-11 |
| 7 | de la Chute | 3 | +12% dano em boss (acelera materiais+Éclats — bosses são a fonte) | ✅ travado 2026-06-11 |
| 8 | des Cendres | 3 | +10% Vestiges (arquétipo (a): acelera a Convergence) | ✅ travado 2026-06-11 |
| 9 | du Dernier Chant | 3 | +1 ponto de Convergence/run a cada 5 níveis | ✅ travado 2026-06-11 |
| 10 | de la Blessure | 4 | ×1.10 dano (multiplicativo entre níveis) — apex (c) | ✅ travado 2026-06-11 |
| 11 | de la Résistance | 4 | **+% sobrevivência: HP, regen E defesa** *(ampliado de "+12% HP e regen")* — engata na Defesa (§4) | ✅ travado 2026-06-11 |
| 12 | du Temps Brisé | 4 | **+% a TODOS os Éclats** (gotejamento + bolsas de Ascension) *(ampliado de "só gotejamento")* — o "Book of Shadows", arquétipo (a) | ✅ travado 2026-06-11 |
| 13 | du Vide | 5 | **+% recompensas nas dificuldades altas** *(troca do "−1% HP cap 50" quebrado)* — engata nas Dificuldades (§8), sem teto | ✅ travado 2026-06-11 |
| 14 | de la Lumière Entière | 5 | amplifica o expoente da Clarté — apex (e), forma exata na calibração | ✅ travado 2026-06-11 |
| 15 | du Choix | 5 | +5% a todos os efeitos de Mémoires — apex (e), clímax narrativo | ✅ travado 2026-06-11 |

---

## 12. LUMENS (✅)

```
lumens_por_kill = mob_hp × 0.10 × frt_total       (boss ×5)
```
Renda e custo de stats crescem em paridade → tempo por compra constante em qualquer fase.

---

## 13. GEAR (✅ DESIGN FECHADO 2026-06-11 — ⏳ só calibração + wiring)

### Modelo aprovado (2026-06-11)
- **6 peças FIXAS** (sempre equipadas; sem inventário/loot/comparar — idle-friendly). Expansível p/ mais peças no futuro.
- Começa **Faded · LV 1 · afixos baixos**. Evolui por dois eixos:
  - **Item level** (Lumens) — escala os afixos. *Motor sem-teto:* leveling continua sempre (custo crescente) → Gear nunca "morre" (conserta a violação da regra de ouro). [forma exata na calibração]
  - **Raridade** (Faded→Kindled→Luminous→Radiant→Converged) — paga **MATERIAIS** (recurso de boss, §14B; Vestige Pull turbina). Cada raridade **adiciona afixos** à peça.
- **Nº de afixos cresce com a raridade:** ~1 no Faded → **~6-7 no Converged** (estilo Gaiadon/Grand Chase). Determinístico (sem re-roll).
- Afixos **iguais somam** (regra de ouro: somam dentro da categoria, multiplicam entre). Tema do Gear = **multiplicadores brutos** (mecânicas ficam nas Passivas).
- Raridades futuras possíveis (Art Direction): **Primordial · Ein Sof** (extensão do teto no endgame).
- Persiste sempre (não reseta).
- ✅ **Catálogo de afixos FECHADO** (ver abaixo). ⏳ resta: motor sem-teto exato (calibração) e assignment determinístico por peça (passada leve).

> *(Estrutura herdada do DESIGN.md §26-28 fica como histórico; substituída pelo modelo acima.)*

### Decisões 2026-06-11 (cont.) — inspiração: equipment do Gaiadon (print do Willian)
- ✅ **Motor SEM-TETO = a Ascension sobe o nível máximo do Gear** (igual ao "Transcendence increases max level" do Gaiadon). Entre Ascensions a peça bate o teto; ao ascender, o teto sobe → Gear nunca morre + salto por mapa. **⚠️ Implica REDESENHAR a Ascension** (§8) — ela ganha esse papel (e o pedido do Willian de Fate Keepers/game-changers).
- ❌ **Synergy** (bônus por subir todas as peças parelho) — **descartado** (decisão do Willian).
- ✅ **Stats em camadas (multi-flavor, estilo Gaiadon):** cada stat de afixo vem em "sabores" que empilham — **flat (+X) · bônus (+%) · multiplicador (×) · mastery (% lento)**. **A raridade desbloqueia sabores mais fortes** (Faded = flat/%; Converged = também × e mastery), além de mais afixos. Empilham estilo ARPG (`flat → ×(1+Σ%) → ×Π mult → ×(1+mastery)`). [forma exata na calibração]
- 🔮 **Gems / Set bonus** — camada FUTURA (colecionável, set 2/3/4/5; pode encaixar com Echoes). Pesquisar via prints do Willian (Steam bloqueia fetch).
- Afixos primários por peça ✅ (Edge=dano · Vigil=HP · Veil=defesa · Grasp=crit · Resonance=APS · Band=Lumens). Pool secundário ✅ enumerado abaixo.

### Catálogo de afixos ✅ FECHADO 2026-06-11 (insp. Gaiadon equipment + Grand Chase; pesquisa idle/ARPG)
**Modelo:** cada peça garante seu **primário** (afixo inerente, estilo Diablo); a **raridade abre slots** que puxam deste **pool**; cada afixo rola nos **4 sabores** (flat · Bonus% · Multiplier× · Mastery) já travados, com os fortes gateados por raridade. **Determinístico** (sem re-roll). **Só multiplicadores brutos** — procs/mecânicas ficam nas Passivas.

**12 afixos no pool:**

| Grupo | Afixo | Now/Future | Nota |
|---|---|---|---|
| **A — Combate** | **Dano** | now | primário *Edge* |
| | **HP máximo** | now | primário *Vigil* |
| | **Defesa** | now | primário *Veil* (mitigação, §4) |
| | **Crit Chance** | now | primário *Grasp*; transbordo >100% → crit damage (§14B) |
| | **Crit Damage** | now | o multiplicador-rei, uncapped (pesquisa idle) |
| | **APS** | now | primário *Resonance*; 1 das 3 fontes de APS (§4) |
| | **Regen** | now | sobrevivência (HP recovery) |
| **B — Anti-inimigo** | **Dano em Boss** | now | acelera materiais + Éclats (bosses são a fonte) |
| | **Erosão do Vazio** (penetração / Enemy HP Reduction) | future | precisa da defesa de inimigos; par do Void Piercing |
| **C — Farm/economia** | **Lumens** | now | primário *Band* |
| | **XP** | now | — |
| | **Materiais** | now | **+% drop de materiais** (qtd por kill/boss) — modesto de propósito; engata no Craft (§13B) e na Mémoire #5 |

**Exclusões deliberadas** (decisão do Willian 2026-06-11): **Vestiges, Éclats e Offline ficam FORA do Gear**. Linha de design: **Gear acelera FARM** (Lumens/XP/Materiais); **moedas de prestígio (Vestiges/Éclats) e Offline vêm de Passivas/Mémoires** — evita empilhar fontes da mesma moeda de prestígio (inflação) e dá identidade a cada andar.

### Identidade das 6 peças ✅ FECHADO 2026-06-11
Cada peça **prioriza** seus secundários-assinatura nas raridades baixas (identidade clara); nas raridades altas pode ampliar (rumo aos ~6-7 afixos). O conjunto cobre os 12 afixos.

| Peça | Slot | Primário | Lean | Secundários-assinatura |
|---|---|---|---|---|
| **The Waning Edge** | Arma | Dano | gume ofensivo / matador | **Crit Damage · Dano em Boss · Erosão do Vazio** |
| **Grasp of the Unnamed** | Manoplas | Crit Chance | precisão | **Crit Damage · APS · Dano** |
| **The Last Resonance** | Amuleto | APS | ritmo/tempo | **Crit Chance · Regen · Dano** |
| **The Silent Vigil** | Elmo | HP | núcleo tank | **Defesa · Regen** |
| **Veil of Cinders** | Manto | Defesa | mitigação | **HP · Regen · Erosão do Vazio** |
| **Band of Dusk** | Anel | Lumens | economia | **XP · Materiais** |

- **Toda a economia (Lumens/XP/Materiais) concentra no Anel** → cria a decisão de leveling manual ("subo o Anel por farm ou a Arma por dano?", §13B ponto 4). Crit chance+damage andam juntos (Grasp+Edge), como a pesquisa idle recomenda.
- ⚠️ **Fix de implementação:** o código (`constants.js` GEAR.pieces) tem `veil` com afixo `hp` e `reson` com `xp` — **provisório/errado**; o canon é Veil=defesa, Resonance(reson)=APS. Corrigir no wiring.

### Calibração (Camada 3) ✅ 2026-06-11 — validada em `tools/sim/gear.mjs`
**Orçamento:** Gear carrega **~10 décadas** de dano (e HP/defesa análogos) no jogo todo (§14B).
> 🔧 **CORREÇÃO DE AUDITORIA 2026-06-11 (orçamento AGREGADO, não por peça):** `gear_dano` é o **PRODUTO dos afixos de DANO**, e no catálogo novo o Dano é **primário na arma (Edge)** e **secundário em Grasp e Resonance**. As 10 décadas são o **TOTAL agregado das 3 peças**, não de 1. **Split** (peças multiplicam → décadas somam): **secundário = 30% das décadas do primário** (faixa de design 25-35%). ⇒ primário (Edge) ~**6.25 déc**, cada secundário ~**1.88 déc** × 2 = **~10.00 déc** pós-A4. O `multBase` foi reajustado de 1.008 (premissa antiga "1 peça = total") p/ **1.0039** (o agregado é que bate 10).
```
gear_mult(L,R) por AFIXO = (1 + L × pctRate × rarityMult[R])      // sabor % (toda raridade) — linear
                         × multBase ^ L   (se R ≥ Luminous)        // sabor × — EXPONENCIAL, sem-teto
   pctRate = 0.02   rarityMult = [1,1.5,2.25,3.5,5]   multBase = 1.0039/nível (× liga em Luminous)
   capPerAsc = +500 níveis no teto a cada Ascension   secondaryWeight = 0.30   N_secundário = 2 (Grasp+Resonance)
   gear_dano_AGREGADO_déc = primário_déc × (1 + 2×0.30)  // ×1.6
```
**Jornada AGREGADA validada:** Faded 0.28 déc → Luminous 1.46 → Converged 3.20 → **pós-A4 10.00 déc** → pós-A5 11.49. **Monotônica = nunca morre.** Salto ~1.7 déc por Ascension.
**Early gentil, late exponencial:** Faded/Kindled modestos (flat/%); o motor × liga em Luminous.

**Veil (defesa) — fecha o alvo da Camada 2:** `def = hp_max × veilFactor`. Veil maximizado → `veilFactor ≈ 0.18` → **def ≈ 4× packDps (80% mitigação)**. Sem Veil → ~0 (você morre na entrada de mapa). Tabela: vf 0.045→1×packDps(50%) · 0.09→2×(67%) · 0.18→4×(80%).

⏳ Resta (fino): nº exato de slots por raridade, custo de nível em Lumens (Camada 4 cuida do gate de material). ✅ *Split do gear_dano (Edge primário + secundários) resolvido na correção de auditoria acima.*

## 13B. CRAFT / MATERIAIS (🟡 EM DESIGN 2026-06-11 — sistema BASE, early/mid)

Sistema próprio (NÃO Ascension — saiu dos Fate Keepers em 2026-06-11 porque o Gear precisa evoluir cedo). Serve o Gear (§13): subir raridade custa materiais. Disponível desde o começo do jogo.

### Ponto 1 — Estrutura do material ✅ TRAVADO 2026-06-11
- **Materiais TIERED por raridade.** O **tier do material decide qual salto de raridade do Gear ele paga:**
  | Material | Paga o salto |
  |---|---|
  | **Tier 1** | Faded → Kindled |
  | **Tier 2** | Kindled → Luminous |
  | **Tier 3** | Luminous → Radiant |
  | **Tier 4** | Radiant → Converged |
  | *(Tier 5+)* | *futuro: Primordial · Ein Sof (§13, teto endgame)* |
- Tiers **baixos dropam de conteúdo early** (Map 1-2 / dificuldade Normal); **altos de mapas/dificuldades late**. Escala sozinho com o jogo.
- Idle-friendly: pouca gestão de inventário (1 família, ~4-5 contadores), sem receita multi-mapa.
- Nomes (lore) ⏳ — puxar do lore bible (tema: fragmentos de luz/Lumière).

### Ponto 2 — Fontes de drop ✅ TRAVADO 2026-06-11
**Split mob vs boss** (decisão do Willian): o material comum cai de mob, os raros só de boss.
- **Tier 1 ("comum")** → dropa de **mobs normais** (fluxo imediato; a 1ª evolução Faded→Kindled não depende de boss). Bosses também soltam T1, em maior quantia.
- **Tiers 2-4 ("raros")** → **só de bosses:** Guardião de sub-área dá os médios; boss final do mapa dá os altos + chance do tier seguinte. ⇒ os tiers que gateiam a progressão ficam **fora da inflação do APS** (não viram função de kills/s — protege a economia de 1-kill).
- **Dificuldade** multiplica a quantia E empurra o tier dropado → farmar tier alto em mapa antigo = evoluir gear cedo.
- ⏳ *fino:* a linha "comum vs raro" está em **T1=mob, T2+=boss**; mover p/ T1-2=mob é ajuste aberto. Drop rate exato = calibração.

### Ponto 3 — A Forja (tela de craft) ✅ TRAVADO 2026-06-11
Tela própria com as 6 peças + painel de refino.
- **(a) Subir raridade = GATE DUPLO** (decisão do Willian, mescla dos 2 gates): a peça precisa estar **no nível MÁXIMO da raridade atual** **E** você **paga o material** do tier (T1→Kindled…). Cada salto adiciona afixos + libera sabores de stat mais fortes (§13).
  - **Catraca:** nivela c/ Lumens → bate o teto da raridade → sobe raridade c/ material → abre níveis novos → repete. Sempre tem "próximo objetivo" claro.
  - **Encaixe no motor sem-teto:** a **Ascension** levanta o TETO geral (libera as raridades/bandas de nível altas no topo — incl. Primordial/Ein Sof futuras). Dois motores aninhados: rarity↔level (curto) dentro de Ascension (longo).
- **(b) Refino** = converter **N de tier baixo → 1 de tier alto** (só pra cima; dá uso ao excedente de T1 do farm de mob). Idle-friendly.
- ⏳ *calibração:* nº de níveis por raridade, custo de material por salto, razão do refino.

### Ponto 4 — Leveling & automação ✅ TRAVADO 2026-06-11
**Leveling é MANUAL** (decisão do Willian — "nível depende do usuário"):
- **Nível: manual, por peça, INDEPENDENTE.** O jogador escolhe em qual das 6 peças gasta Lumens; cada peça tem seu próprio nível. O Gear vira ponto de **decisão** (onde investir), não auto-invisível. QoL "maximizar esta peça" (jogar Lumens disponíveis numa peça) é aceitável — a escolha de QUAL peça continua do jogador.
- **SEM auto-level.** Automação de Gear ficou fora de tudo (nem base, nem Fate Keeper — A4 virou +cap de mobs). *(Auto-level = possível QoL futura, fora de escopo.)*
- **Raridade:** sobe só com o **tier anterior MAXIMIZADO** (nível máx) **+ material** — reconfirma o gate duplo (ponto 3); tiers em ordem, sem pular.
- **Vestige Pull** (passiva, §14B) turbina o ganho de material.

### ✅ Craft/Materiais — DESIGN FECHADO 2026-06-11 (4 pontos)

### Calibração (Camada 4) ✅ 2026-06-11 — `tools/sim/material.mjs` + pesquisa de gênero
**Pesquisa** (Idle Slayer ~10% drop · Melvor tabelas de peso + Luck · materiais de progressão = comuns, "caça" = raros): o gênero usa **% de drop**; o nº certo depende do **ritmo de kills**. Como matamos 15-50 mobs/s (Idle Slayer mata devagar), **~1% aqui ≈ ~10% deles** (normalizado). Validado.
- **Drop = % por MOB**, do **tier do MAPA atual** (Map 1→T1 … Map 4→T4): **~1%** do tier do mapa **+ ~0.1%** do **tier seguinte** (tabela com peso, estilo Melvor — deixa pré-estocar). **Vestige Pull** (passiva) + futuros bônus tipo Luck **multiplicam** a taxa.
- **Custo p/ subir 1 peça um tier ≈ 40** material → **240 p/ as 6 peças**. Subir a raridade do mapa todo ≈ **24k mob kills** ≈ **~27 min** de farm.
  - 🔧 **Correção de âncora (auditoria 2026-06-11):** o cenário "180k kills/h" foi **removido** — viola a âncora física (1 kill/ataque × APS 15 = **máx 54k kills/h**). O **teto real é 54k/h**, então o pacing canônico é **~27 min/tier** (não "8-27 min"). *(Multi-kill de passivas pode subir um pouco, mas paga 50% e não é a base.)*
- **Bosses** (Guardião/final): bônus garantido (~+30) + chance melhor do tier seguinte — **aceleram, nunca são requisito**.
- **Decisões do Willian:** (1) raridade **independe de dificuldade** — tudo farmável no **Normal**; dificuldade (×3/×10/×30) só **acelera**. (2) **Converged abre no Map 4** (último tier pronto antes do Map 5). (3) material = **% do mob** (mata-se muitos).
- **Refino:** 12:1 entre tiers (usa excedente; rushar tier alto cedo é proibitivo — mantém o ritmo).
- ⏳ resta (fino): nomes de lore dos materiais, valor exato do bônus do Vestige Pull.

---

## 14. ECHOES (🔒 estrutura herdada · ⏳ lista e recalibração)

Sistema mantido do DESIGN.md §21-24 (5 raridades Hollow→Sovereign, 3 categorias de stats, recipes com materiais de mapa + boss). Nunca resetam. ⏳ lista completa por mapa, evolução e envelope numérico dentro do orçamento de décadas.

---

## 14B. CAPS & TETOS (🟡 EM DEFINIÇÃO — sessão de design 2026-06-11)

Seção dedicada: os tetos do jogo interagem (APS × kills/ataque × mobs na tela definem o **teto de renda**), então são decididos juntos, não dentro de cada sistema.

| Cap | Valor atual (código) | Decisão | Status |
|---|---|---|---|
| **APS (teto global)** | 1.25 | ✅ **CALIBRADO 2026-06-11 = 15.0** (intervalo mín ~0.067s). Cap duro. | ✅ |
| **APS por AGI (sub-cap)** | sem sub-cap (per 0.04) | ✅ **agiSubCap = 3.75×** → AGI sozinho leva o APS só até **~1.5** (a "rodinha" early). O grosso (1.5→15) vem de **Fracture Pulse** (passiva, o motor) × **Resonance** (gear), multiplicativo. Ninguém sozinho chega a 15 | ✅ CALIBRADO |
| **Kills por ataque** | 1 (fixo) | ✅ **base 1**; Overkill/Execute/Luminal Explosion furam, **extra paga 50%**; **sem cap rígido** — limitado pelos maxLevel (capados) das passivas (~+1 a +3 no late) | ✅ CALIBRADO |
| **Mobs na tela (onda)** | [1,2,4,6,8] por sub-área | ✅ **base = `[2,4,6,9,12]`** (Sub1-5); **Void Awareness** (passiva) + **Fate Keeper A4** somam; **teto global ~24**. Mais mobs = mais farm E mais Σdano | ✅ CALIBRADO |
| **Crit (distribuição)** | LCK domina | **distribuído** (como APS): LCK (Gold Stat) dá fração mínima (~15-20% sozinho); o resto até 100% vem de passivas (Luminal Edge…) + gear (Grasp) | ✅ CALIBRADO (forma); valor/nível §16.6 |
| **Crit chance (teto)** | 100% | ✅ **transbordo**: acima de 100% (geralmente via gear) o excedente vira crit damage. **Crit damage base ×2**, sem teto (de la Forme + afixo Crit Damage). Valores finos ⏳ §16.6 | ✅ direção |
| **Defesa (sua, mitigação)** | 🔒 não existia | ✅ **FECHADO 2026-06-11:** forma = **razão/armadura** `mit = def/(def+dano)`, nunca 100%. Fonte = **Veil (gear) + passivas**. **Alvo (Camada 2):** build de sobrevivência alcança `def ≈ 1-4× packDps` (50-80% mit) — curva do Veil sai na Camada 3 | ✅ design + alvo / curva Camada 3 |
| **Defesa de inimigos** | 🔒 não existe | ✅ **forma travada 2026-06-11:** mesma razão virada (`seu_dano/(def_inim+seu_dano)`); **Void Piercing** fura, **Weakened Void** reduz. Se/quando mobs têm def relevante (early ≈ 0) = calibração | ✅ forma / valores ⏳ |
| **Tier do Seeker (Despertar)** | tier = nº de ascensions (código) | 🔄 vira gate de poder na **Sub 3** (vencer o Guardião) → ×poder permanente; arte/rank leem o tier de Despertar, não ascensions | ✅ direção / impl. pendente |
| **Loot / coleta** | direta no kill | **automático, sem drop no chão** (confirmado) — não haverá passivas de "raio de coleta" | ✅ |
| **Materiais** | 🔒 não existe | **novo recurso a desenhar:** materiais de boss para subir **raridade de gear** (§13); passiva **Vestige Pull** turbina o ganho. Definir: o quê, de onde (bosses?), por mapa? | ⏳ a desenhar |
| **Gear: nível por raridade** | 25/50/100/175/300 | provisório | ⏳ calibrar |
| **Passiva: nível máximo** | 5 (provisório) | ✅ **RESOLVIDO 2026-06-11:** TODA passiva tem nível máx (o gate "maximizar grupo → abre o próximo" sempre funciona). O crescimento sem teto vem de (1) os **grupos 3 (late) concentram as mais fortes** + (2) passivas cujo **efeito escala com o JOGO, não com o nível** (Hoarder=cofre · Eternal Vestige=nº de Convergences · Fractured Soul=seu dano) — nível capado, efeito sobe sozinho. Valor do maxLevel ⏳ calibrar | ✅ regra |
| **Mémoires: nível** | sem teto | proposital (motor do late) | ✅ |
| **Número do jogo** | 1e100 (JS estoura ~1e308) | break_infinity além de 1e308 (CP próprio) | ✅ decidido |
| **Offline** | 30 dias (código) | 🔄 **cap = 24h** + **renda ≤ 100% do ativo** (nunca rende mais que jogar) + base generosa (não-fraco); **Dreamwalker** leva ao teto. Implementação pendente (código ainda faz 30d) | 🟡 direção ✅ |
| **Ascension** | 5 na vida | = 5 mapas | ✅ |
| **Convergence** | ~81 na vida (soft) | cadência, não cap rígido | ✅ |

✅ **AS 7 CAMADAS DE CALIBRAÇÃO FECHADAS 2026-06-11** (simuladores em `tools/sim/`):
1. Caps (APS 15, mobs `[2,4,6,9,12]` teto 24, kills extra 50%, crit distribuído) · 2. Sobrevivência (dano = **0.02×HP** constante, Veil até 80% mit) · 3. Gear (**~10 décadas**, sem-teto `1.008^L`+500niv/Asc) · 4. Craft (**1% drop/mob**, tier=mapa, Converged no Map 4) · 5. Passivas (maxLevel 12, ~8 déc, 3 motores no g3) · 6. Mémoires (Clarté 1.07 ~70 déc, **custo 1.10→3.0** [era bug]) · 7. Convergence (**composto+aninhado** `(1+0.04×1.38^asc)^pts` [era bug aditivo]) + Dificuldades (×1e5/1e15/1e30).
**Orçamento de poder fecha:** Mémoires 70 + Gear 10 + Passivas 8 + Gold 4 + Conv 4 + **Despertar 2.8 + Ascension 1.2 (= 4.0 combinados)** + Level 1 ≈ **100 décadas** (alvo ~95).
> ✅ **VALIDADO 2026-06-12 (Decisão 2):** a linha "Asc 3.8" foi **substituída** por **Despertar 2.8 (×5^4=×625) + Ascension 1.2 (×2^4=×16)**. Com o asc_mult caindo de ×6.250 → ×16, o salto de poder por mapa migra para o **Despertar** (a mudança de classe). ⏳ pendência de calibração; anotado em `tools/sim/budget.mjs`.

### DURAÇÃO & RITMO (registrado 2026-06-11 — `tools/sim/playtime.mjs` + pesquisa de gênero)
> ⚠️ **ESTIMATIVA DE BAIXA CONFIANÇA (auditoria externa 2026-06-11):** o `CLIMB_OVERHEAD` do sim foi **AJUSTADO para reproduzir** o alvo do §9 (~14d/~41d) → a duração é **premissa circular, não derivação** (o overhead foi escolhido para casar com o número que ele "valida"). Derivar de verdade exige um **simulador END-TO-END** (tick econômico real: combate→renda→compras→prestígio), que **NÃO existe ainda**. Tratar os números abaixo como **ordem de grandeza**, pendentes desse simulador.

**Duração do jogo base (5 mapas), por arquétipo** (cross-check com o orçamento §9: ~14d ótimo / ~41d realista):
| Arquétipo | Padrão | Duração |
|---|---|---|
| Intenso | ~6h/dia, loga 3×/dia | **~14 dias** |
| **Casual (alvo = jogador-padrão do gênero)** | ~1.5h/dia, loga 1×/dia | **~15 dias** |
| Leve | ~2 logins/semana | **~41 dias** |
- **Insight:** o offline generoso (24h, 70%) faz o **casual quase empatar com o intenso** (bom p/ o alvo); o **leve** perde pelo **cap de 24h** desperdiçar ausências longas.
- **Benchmark do gênero** (pesquisa): Gaiadon = "um dos idles mais lentos" (2-3 dias/nível de Transcendence no mid) → **meses**; Synergism = ~294h só p/ a 1ª Singularity → **meses/anos**; NGU = endgame em "**alguns meses**". ⇒ "alguns meses" é a **norma do gênero**, e o **jogador-padrão do gênero = nosso CASUAL** (não o intenso).
- ✅ **VALIDADO 2026-06-12 (Decisão 1) — a calibração atual de 5 mapas ≈ 2 semanas (casual) é o RITMO CORRETO** para o conteúdo existente. É um "**Ato 1**". A duração de longo prazo ("alguns meses", a norma do gênero) vem de **MAIS CONTEÚDO, NUNCA de inflar custos/curvas**.
- **Modelo de expansão de mapas (REMIX), estilo Grand Chase** — *item de futura sessão de design de conteúdo:* estágios novos **reusando inimigos/assets com variantes** e **remix de packs** (composições novas dos mesmos mobs), + a **expansão de sub-áreas** (§8: 6→11-14/mapa). A calibração é **uniforme/escalável** → estender as tabelas, **sem re-calibrar**. Projeção: ~7-8 mapas + sub-áreas crescentes ≈ **2-3 meses** p/ o jogador-padrão.

---

## 15. MODELO DE TEMPO (🔒 atualizado)

| Relógio | O que é | Duração |
|---|---|---|
| Tick de combate | motor real (online + offline estimado) | contínuo |
| Check-in | jogador abre, decide, fecha | 2-3 min |
| Cadência de Convergence | parede de XP da run | ~minutos no início → horas → ~meio dia no fim (média ~4h, 81 na vida) |
| Ascension | marco por mapa | dias (vestige-gated) |

Offline: progressão simulada até o ponto sustentável (nunca abre morto); afixos/passivas de offline ampliam.

---

## 15B. ORDEM DE TRABALHO (✅ 2026-06-11)
> **Fechar TODO o design primeiro** (mecânicas, sistemas, regras). **Calibração numérica** (valores por nível, custos, caps numéricos, envelopes) e **wiring no código** ficam por **último**, numa passada dedicada com o simulador — calibrar antes de o design fechar é re-trabalho.

---

## 16. PENDÊNCIAS DE CALIBRAÇÃO (⏳)

1. Passada de **sobrevivência** no simulador (curvas de dano dos mobs §4 contra HP do jogador, mapa a mapa; pack sizes como pressão).
2. **Drip da era 5** (Map 5 em 3.5d ótimo vs alvo ~1.5) e **esticamento Map 1** (custo A1 ou span de HP).
3. Efeitos numéricos individuais das **45 passivas** dentro do envelope por era.
4. **Gear e Echoes**: tabelas de valores na malha v2 dentro dos envelopes (×32 e a definir).
5. **Multiplicador casual real** (×2.5-4?) — só playtest responde.
6. Crit: valores de lck, base crit damage e fator de transbordo.
7. Fracture's Trial (dificuldade voluntária) e endgame pós-Nil Aeternum (loop canônico de Convergence — ver lore).
8. Visual de projéteis e lista de Echoes (pendências antigas mantidas).

---

## 17. CHANGELOG — O QUE MUDOU vs DESIGN.md/BALANCE.md ANTIGOS

1. **Contradições resolvidas:** Convergence re-climb (reseta progresso de mapa, preserva Gear/hero) — *⚠️ REVISTO 2026-06-11: o progresso de mapa NÃO reseta mais; ver §6*; Ascension = marco por mapa (5 na vida) com custo em Vestiges; Vestiges → exclusivamente Passivas + custo de Ascension; Gear persiste (reforja opcional).
2. **Malha geométrica** substitui levels lineares 1-4000 e HP 1.04^level: levels 1→1e9, HP 10→1e100, interpolação por mapa.
3. **Portão de Convergence** (parede de XP geométrica) substitui trigger livre + plateau.
4. **Convergence aditiva** (+15%/ponto) substitui mults ×1.20/×1.12 e spikes ×1.5.
5. **Mémoires/Éclats** (novo sistema, motor principal do late game) — Éclats deixam de ser só lore.
6. **HP do jogador recebe fatores de prestige** e dano dos mobs ganhou curva própria (conserta o colapso de sobrevivência do modelo antigo).
7. **Cap físico de kill rate** (1 kill/ataque) — nova constraint fundamental.
8. **Morte definida** (knockback de subárea, sem perda).
9. **The Eidola**, crit camada única, Gloves diversificada, pack sizes, modelo de spawn: **mantidos**.
10. Nomenclatura de lore: "La Fractura" → **La Fracture** em todos os textos (ver revisão de lore).
