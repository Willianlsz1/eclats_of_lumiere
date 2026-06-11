# ⚔️ Éclats of Lumière — GDD Final Consolidado (v2)

**Fonte da verdade única de game design e balanceamento.**
Substitui: DESIGN.md (Parte II em diante) e BALANCE_MODEL.md.
Lore: ver *docs/eclats_lore_bible.md* (Lore Bible Completo v2 — já consolida a Revisão de jun/2026).
Data: 2026-06-09 · Status: **estrutura completa e calibrada por simulação** · Pendências listadas em §16.

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

### Dano dos mobs — curva própria, desacoplada do HP deles (🔒 décadas por mapa, ⏳ validação fina)
| Mapa | Dano do mob (range) |
|---|---|
| 1 | 1 → 1e4 |
| 2 | 1e4 → 1e12 |
| 3 | 1e12 → 1e26 |
| 4 | 1e26 → 1e46 |
| 5 | 1e46 → 1e75 |

Interpolação igual à do HP. Dano recebido = Σ dano dos mobs ativos no pack. Décadas de dano ≈ 75-80% das décadas de HP por mapa → a pressão de sobrevivência cresce dentro do mapa e relaxa a cada Ascension (HP ganha o asc_mult).

### Morte (🔒)
Morrer **recua uma subárea** e respawna em segundos, sem perda de recursos. Offline, a simulação só avança até o ponto sustentável — o jogador nunca abre o app morto. Morte é muro de posicionamento, não punição.

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
- ✅ **DIREÇÃO TRAVADA (Tópico 2.1, 2026-06-11): recompensa COMPOSTA, não aditiva.** O `conv_factor` multiplica em juros compostos (`≈ base^Σpontos`, ex. ilustrativo `1.05^Σ`) — primeiros pontos valem pouco, pontos do late disparam (bola de neve estilo Synergism). E `f(xp_run)` usa **retorno decrescente** (≈ `√transbordo da parede`) → dilema "converter cedo e frequente vs farmar mais fundo". ⏳ A **base exata** (o "5%") é provisória — calibrada contra todas as camadas juntas.

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

> **✅ SISTEMA DE PASSIVAS — DESIGN COMPLETO** (efeitos + posicionamento). Resta só **calibração numérica**: valor por nível de cada efeito, custos (já há fórmula §7), maxLevel por passiva, e os caps relacionados (mobs na tela, APS, defesa — §14B). E o **wiring no código** (hoje as 45 são +5% agregado placeholder).

---

## 8. ASCENSION (🔄 EM REDESENHO — sessão de design 2026-06-11)
> A tabela abaixo é o estado **atual** (implementado). **Será redesenhada:** a Ascension passa a (1) **subir o nível máximo do Gear** (motor sem-teto, §13) e (2) trazer **Fate Keepers / game-changers** (pedido do Willian — desbloqueios que mudam a qualidade do jogo, não só números). Tópico aberto a seguir.

### Redesenho — DIREÇÃO TRAVADA 2026-06-11 (prestige aninhado, insp. AD/Synergism)
A Ascension vira o **loop de prestige de cima** (a Convergence é o de baixo):
- **🔻 Setback:** a Ascension **reseta a camada da Convergence** (pontos → 0, `conv_factor` → 1) + recomeça o mapa. *(Revisa o antigo "Ascension não reseta nada".)*
- **🔺 Leap permanente:** (1) **amplifica a Convergence** — cada ponto passa a valer mais (base composta sobe), re-subir fica mais rápido E mais forte ("perde os multiplicadores, mas agora são maiores"); (2) **`asc_mult`** (×dano/HP); (3) **sobe o teto do Gear**; (4) **desbloqueia 1 MECÂNICA nova** (Fate Keeper / game-changer); (5) **Éclats + materiais**.
- **Frequência: mantém 5 (1 por mapa)** — a Convergence é o loop frequente; a Ascension é o raro/épico (estrutura saudável dos idles: camada de cima rara).
- **Fate Keepers = game-changers / recompensas muito fortes** (5 mecânicas, 1 por Ascension) — quais 5: pesquisa + escolha numa sessão dedicada.
- ⏳ **Pendente (registrado):** as **15 Mémoires precisam do mesmo tratamento das passivas** (pesquisa + efeito de cada uma) — tópico próprio.

### FATE KEEPERS + MODOS DE DIFICULDADE (🟡 EM DEBATE 2026-06-11 — insp. Grand Chase)

**Modos de dificuldade** (🔁 REVISADO 2026-06-11 — a "expansão do que já tenho", re-usa os 5 mapas, sem lore novo):
- Re-rodar mapas limpos em dificuldade maior → mobs com **HP e dano muito maiores** + **recompensas melhores** (materiais, Éclats, drip). É o endgame de farm.
- Nomes (sujeitos a mudança): **Difícil · Nightmare · Tormento**.
- **Desbloqueio = UM gate só, na A2.** A A2 abre o **SISTEMA de dificuldades inteiro** — não libera um modo por Ascension. A partir daí o **jogador escolhe a dificuldade por sub-área** (cada sub-área roda no modo que ele quiser).
- **O gate real das dificuldades mais altas é o PODER do jogador**, não a Ascension: como cada modo multiplica MUITO o HP/dano dos mobs, você simplesmente não consegue limpar Nightmare/Tormento sem estar forte o bastante. A progressão se auto-regula (você sobe de modo quando aguenta), sem trancar atrás de marcos.
- Cada tier estende a faixa de HP/dano (ex. ilustrativo do Willian: Normal ~→1e50 · Nightmare ~1e50–1e190 · Tormento ~1e190–1e300 → **rumo a 1e300 = território break_infinity no endgame**). ⏳ brackets exatos + recompensas = calibração (**re-escalar as curvas** é decisão tomada — pode re-escalar a curva base do §3).

**Craft/Materiais = sistema BASE, NÃO Ascension** (🔁 decisão 2026-06-11): evoluir Gear (subir raridade via materiais) precisa estar disponível **cedo** no jogo, não trancado atrás de uma Ascension tardia. Sai dos Fate Keepers. Vira sistema próprio (early/mid) — sessão de design dedicada.

**Os 5 Fate Keepers (1 por Ascension):**
| A | Fate Keeper | Conteúdo |
|---|---|---|
| **A1** | **Automação básica** | auto-comprar Gold Stats + auto-Convergir (destrava o idle) |
| **A2** | **Auto-progressão + abre as Dificuldades** | auto-limpar sub-áreas/auto-Despertar + desbloqueia o **SISTEMA de dificuldades** (escolha por sub-área; modos altos gateados por poder, não por Ascension) |
| **A3** | **Motor de Éclats** | drip no mapa atual + offline 24h cheio (o "idle engine" do mid/late) |
| **A4** | **+Cap global de mobs** | sobe o teto de inimigos simultâneos na tela → mais kills/s de pico = mais farm (recursos/Éclats/materiais). Casa com o aumento de cap de mobs (insp. Synergism/Gaiadon). ⏳ valor do salto = calibração |
| **A5** | **Transcendência** | loop infinito pós-Nihel (§16.7) + meta-multiplicador permanente |

**Expansão de sub-áreas (futuro):** o nº de sub-áreas por mapa CRESCE (ex.: Map 1 ~6 → Map 5 ~11-14) p/ suavizar a curva de HP (ideia 4). A **Auto-progressão (A2)** escala com isso. *(§3 hoje fixa 5/mapa — será variável.)*
> O tier (T1→T5) deixa de ser recompensa de Ascension e vira um **gate de poder no MEIO do mapa** (estilo "awakening" do Idle Blade): você chega à região do boss final **já evoluído**, e sem despertar os mobs ficam tanky/letais demais (parede natural).
- **Quando:** ao alcançar a **Sub-área 3** do mapa + **requisito**.
- **Requisito:** **(a) derrotar o Guardião da Sub 3** (teste do despertar — só combate). ⏳ **Futuro: escalar para (b) + custo de material** (quando o sistema de craft de materiais existir — decisão do Willian).
- **Efeito:** salto de poder **permanente** (×dano/HP) necessário pra limpar Sub 4-5 + o boss final + o mapa seguinte. Permanente (sobrevive a todos os resets, incl. Ascension).
- **Progressão:** Despertar em Sub 3 dos Maps 1-4 → T2 Illuminate · T3 Éclairé · T4 L'Éveillé · T5 Lumière. Map 5 (Nihel) já é Lumière.
- **Tier ≠ Ascension:** o **Despertar** é o gate de poder no meio do mapa; a **Ascension** é o prestige no fim do mapa. Dois sistemas.
- *Código:* `currentRank`/arte/moldura passam a ler o **tier de Despertar** (novo campo de state), não `state.ascensions`.

| Ascension | Requisito | Custo (Vestiges) | asc_mult | Éclats (bolsa) | Rank desbloqueado |
|---|---|---|---|---|---|
| A1 | Boss Map 1 | **500.000** | **×10** | 100 + desbloqueia drip | Illuminate |
| A2 | Boss Map 2 | **1.900.000** | ×5 | 300 | Éclairé |
| A3 | Boss Map 3 | **4.000.000** | ×5 | 900 | L'Éveillé |
| A4 | Boss Map 4 | **8.000.000** | ×5 | 2.700 | Lumière |
| A5 | Derrotar Nihel | **grátis** | — | final do jogo base | — |

- **Os custos são o cronômetro de cada mapa** — todas as durações são vestige-gated por design. Cinco números controlam o ritmo do jogo inteiro. asc_mult aplica a dano **e** HP.
- A1 = ×10 ("a primeira é algo maior"); entrada no mapa novo com kill time ~6s — poder palpável.
- Cerimônia: rank da Ordre + memória de lore do mapa.
- **Gear persiste**; o mapa novo abre o tier seguinte de gear e o antigo pode ser **reforjado** como material (desconto na forja — nunca perda forçada).
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

## 11. MÉMOIRES (✅ motor · 🔒 lista)

15 relíquias, 3 por era, desbloqueadas pela Ascension da era. Cada compra revela um texto de memória — **a meta-progressão é o veículo da narrativa**.

- **Desbloqueio:** 10 / 30 / 90 / 270 / 810 Éclats (por Mémoire, conforme era)
- **Evolução:** nível n custa `2 × 1.10^n` Éclats
- **Clarté (motor global):** dano ×`1.07^(soma de todos os níveis de Mémoires)`
- **Mémoires multiplicativas (×1.10/nível):** a partir da **A3**, ~metade dos níveis novos (la Blessure e similares) — o turbo do endgame. As Mémoires carregam ~75 das 99 décadas do jogo.

| # | Mémoire | Era | Efeito por nível |
|---|---|---|---|
| 1 | du Premier Matin | 1 | +10% dano global |
| 2 | des Rires | 1 | +10% Lumens |
| 3 | de la Marche | 1 | +8% XP |
| 4 | de la Forme | 2 | +8% Crit Damage |
| 5 | du Façonnage | 2 | +6% efeito de Gear |
| 6 | des Profondeurs | 2 | +10% offline |
| 7 | de la Chute | 3 | +12% dano em boss |
| 8 | des Cendres | 3 | +10% Vestiges |
| 9 | du Dernier Chant | 3 | +1 ponto de Convergence/run a cada 5 níveis |
| 10 | de la Blessure | 4 | ×1.10 dano (multiplicativo entre níveis) |
| 11 | de la Résistance | 4 | +12% HP e regen |
| 12 | du Temps Brisé | 4 | +15% Éclats do gotejamento |
| 13 | du Vide | 5 | −1% HP de inimigos (cap 50) |
| 14 | de la Lumière Entière | 5 | amplifica o expoente da Clarté |
| 15 | du Choix | 5 | +5% a todos os efeitos de Mémoires |

---

## 12. LUMENS (✅)

```
lumens_por_kill = mob_hp × 0.10 × frt_total       (boss ×5)
```
Renda e custo de stats crescem em paridade → tempo por compra constante em qualquer fase.

---

## 13. GEAR (🔄 REVISTO na sessão de design 2026-06-11)

### Modelo aprovado (2026-06-11)
- **6 peças FIXAS** (sempre equipadas; sem inventário/loot/comparar — idle-friendly). Expansível p/ mais peças no futuro.
- Começa **Faded · LV 1 · afixos baixos**. Evolui por dois eixos:
  - **Item level** (Lumens) — escala os afixos. *Motor sem-teto:* leveling continua sempre (custo crescente) → Gear nunca "morre" (conserta a violação da regra de ouro). [forma exata na calibração]
  - **Raridade** (Faded→Kindled→Luminous→Radiant→Converged) — paga **MATERIAIS** (recurso de boss, §14B; Vestige Pull turbina). Cada raridade **adiciona afixos** à peça.
- **Nº de afixos cresce com a raridade:** ~1 no Faded → **~6-7 no Converged** (estilo Gaiadon/Grand Chase). Determinístico (sem re-roll).
- Afixos **iguais somam** (regra de ouro: somam dentro da categoria, multiplicam entre). Tema do Gear = **multiplicadores brutos** (mecânicas ficam nas Passivas).
- Raridades futuras possíveis (Art Direction): **Primordial · Ein Sof** (extensão do teto no endgame).
- Persiste sempre (não reseta).
- ⏳ **Em debate:** catálogo de afixos (primário por peça + pool secundário; now vs future), motor sem-teto exato, sistema de materiais.

> *(Estrutura herdada do DESIGN.md §26-28 fica como histórico; substituída pelo modelo acima.)*

### Decisões 2026-06-11 (cont.) — inspiração: equipment do Gaiadon (print do Willian)
- ✅ **Motor SEM-TETO = a Ascension sobe o nível máximo do Gear** (igual ao "Transcendence increases max level" do Gaiadon). Entre Ascensions a peça bate o teto; ao ascender, o teto sobe → Gear nunca morre + salto por mapa. **⚠️ Implica REDESENHAR a Ascension** (§8) — ela ganha esse papel (e o pedido do Willian de Fate Keepers/game-changers).
- ❌ **Synergy** (bônus por subir todas as peças parelho) — **descartado** (decisão do Willian).
- ✅ **Stats em camadas (multi-flavor, estilo Gaiadon):** cada stat de afixo vem em "sabores" que empilham — **flat (+X) · bônus (+%) · multiplicador (×) · mastery (% lento)**. **A raridade desbloqueia sabores mais fortes** (Faded = flat/%; Converged = também × e mastery), além de mais afixos. Empilham estilo ARPG (`flat → ×(1+Σ%) → ×Π mult → ×(1+mastery)`). [forma exata na calibração]
- 🔮 **Gems / Set bonus** — camada FUTURA (colecionável, set 2/3/4/5; pode encaixar com Echoes). Pesquisar via prints do Willian (Steam bloqueia fetch).
- Afixos primários por peça ✅ (Edge=dano · Vigil=HP · Veil=defesa · Grasp=crit · Resonance=APS · Band=Lumens). Pool secundário "agora" aprovado; "futuros" a pesquisar.

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

### Pontos em debate (próximos)
- **Ponto 4 — Automação/idle:** botão "subir tudo" + passiva **Vestige Pull** (turbina ganho, já travada §14B). ⏳ travar.
- ⏳ **Calibração (por último):** quantidade por salto × 6 peças, taxa de drop, multiplicadores de dificuldade, custo do refino.

---

## 14. ECHOES (🔒 estrutura herdada · ⏳ lista e recalibração)

Sistema mantido do DESIGN.md §21-24 (5 raridades Hollow→Sovereign, 3 categorias de stats, recipes com materiais de mapa + boss). Nunca resetam. ⏳ lista completa por mapa, evolução e envelope numérico dentro do orçamento de décadas.

---

## 14B. CAPS & TETOS (🟡 EM DEFINIÇÃO — sessão de design 2026-06-11)

Seção dedicada: os tetos do jogo interagem (APS × kills/ataque × mobs na tela definem o **teto de renda**), então são decididos juntos, não dentro de cada sistema.

| Cap | Valor atual (código) | Decisão | Status |
|---|---|---|---|
| **APS (teto global)** | 1.25 | subir p/ **~15** (Tópico 2.4) — nº exato a calibrar | 🟡 direção ✅, valor ⏳ |
| **APS por AGI (sub-cap)** | sem sub-cap (per 0.04) | AGI sobe só até um **teto pequeno**; o grosso vem da passiva **Fracture Pulse** (chave p/ bater o teto) + gear | ⏳ definir o sub-cap |
| **Kills por ataque** | 1 (fixo) | base 1; passivas (Overkill/Execute/Luminal Explosion) furam, extras pagam ~50% | 🟡 regra ✅, máx de extras ⏳ |
| **Mobs na tela (onda)** | [1,2,4,6,8] por sub-área | base + passiva **Void Awareness** (aumenta o cap) | ⏳ definir base e teto |
| **Crit (distribuição)** | LCK domina | **distribuído** (como APS): LCK (Gold Stat) dá fração mínima; o resto (chance e damage) vem de passivas (Luminal Edge…) + gear (Grasp) | ✅ direção 2026-06-11 |
| **Crit chance (teto)** | 100% | ✅ **transbordo confirmado**: acima de 100% (geralmente via gear) o excedente vira crit damage (~101% → +1% dmg). Valores finos ⏳ §16.6 | ✅ direção |
| **Defesa de inimigos** | 🔒 não existe | **novo sistema a implementar:** mobs/bosses mitigam dano; **Void Piercing** (Éclat) penetra, **Weakened Void** (Fracture) reduz. Definir forma (plana? %? escala?) | ⏳ a desenhar |
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

⏳ Prioridade de decisão (bloqueiam o design das passivas): **APS exato + sub-cap do AGI · máx de kills extras · cap de mobs na tela (base e teto)**. O resto é calibração ou já decidido.

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
