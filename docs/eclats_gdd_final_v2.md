# ⚔️ Éclats of Lumière — GDD Final Consolidado (v2)

**Fonte da verdade única de game design e balanceamento.**
Substitui: DESIGN.md (Parte II em diante) e BALANCE_MODEL.md.
Lore: ver *Lore Bible + Revisão Consolidada* (documento separado — inalterado).
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
| **Convergence** | ~4h em média (81 na vida) | dá **pontos** (bônus aditivo) | — |
| **Passivas** | permanente | **Vestiges** | nunca |
| **Ascension** | 1 por mapa (5 na vida) | custa Vestiges, libera **Éclats** | — |
| **Mémoires** | permanente | **Éclats** | nunca |

**Convergence** (portão estilo Gaiadon): ao encher a parede de XP da run, o jogador converge — reseta Gold Stats, Lumens e progresso de mapa; ganha pontos pela profundidade alcançada. A **1ª Convergence desbloqueia as Passivas** (momento de lore: a Semente desperta).

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
**Máximo de 1 kill por ataque.** Kill rate máximo absoluto = APS atual (teto 1.25/s).
Consequência de design: toda renda de farm (Lumens, XP, Vestiges, Éclats) tem teto proporcional ao **HP do mob mais fundo que você mata**, nunca à velocidade de spam. É a constraint que ancora a economia inteira.

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

### Convergence — pontos e fator
```
pontos_da_run = índice global da subárea mais funda alcançada (1–25)
conv_factor   = 1 + 0.15 × Σ pontos      // aditivo entre si, multiplicativo na fórmula
```
A 1ª Convergence desbloqueia as Passivas + concede os Vestiges acumulados da run (onboarding garantido pela fórmula de Vestiges, §7).

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

---

## 8. ASCENSION (✅ CALIBRADO)

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

## 13. GEAR (🔒 estrutura herdada · ⏳ recalibrar valores na malha v2)

- 6 peças (The Waning Edge, Veil of Cinders, Crown of Hollow Stars, Grasp of the Unnamed, The Last Resonance, Band of Dusk) com afixos fixos por peça e Legendary exclusivo — tabelas do DESIGN.md §26-28 permanecem válidas como estrutura.
- Dois eixos: item level (Lumens) + raridade (Lumens + materiais de boss), com regressão intencional de taxa ao subir raridade (Common 0.5%/lv cap 100 → Legendary 0.025%/lv cap alto).
- **Persiste em tudo**; reforja na Ascension é opcional (material/desconto).
- No simulador, gear entra como ×2 por Ascension (envelope ~×32 na vida). Os valores de afixo da malha v2 devem somar a esse envelope. ⏳ recalibrar tabela de rates/caps.
- Gloves diversificada e crit camada única: decisões mantidas.

## 14. ECHOES (🔒 estrutura herdada · ⏳ lista e recalibração)

Sistema mantido do DESIGN.md §21-24 (5 raridades Hollow→Sovereign, 3 categorias de stats, recipes com materiais de mapa + boss). Nunca resetam. ⏳ lista completa por mapa, evolução e envelope numérico dentro do orçamento de décadas.

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

1. **Contradições resolvidas:** Convergence re-climb (reseta progresso de mapa, preserva Gear/hero); Ascension = marco por mapa (5 na vida) com custo em Vestiges; Vestiges → exclusivamente Passivas + custo de Ascension; Gear persiste (reforja opcional).
2. **Malha geométrica** substitui levels lineares 1-4000 e HP 1.04^level: levels 1→1e9, HP 10→1e100, interpolação por mapa.
3. **Portão de Convergence** (parede de XP geométrica) substitui trigger livre + plateau.
4. **Convergence aditiva** (+15%/ponto) substitui mults ×1.20/×1.12 e spikes ×1.5.
5. **Mémoires/Éclats** (novo sistema, motor principal do late game) — Éclats deixam de ser só lore.
6. **HP do jogador recebe fatores de prestige** e dano dos mobs ganhou curva própria (conserta o colapso de sobrevivência do modelo antigo).
7. **Cap físico de kill rate** (1 kill/ataque) — nova constraint fundamental.
8. **Morte definida** (knockback de subárea, sem perda).
9. **The Eidola**, crit camada única, Gloves diversificada, pack sizes, modelo de spawn: **mantidos**.
10. Nomenclatura de lore: "La Fractura" → **La Fracture** em todos os textos (ver revisão de lore).
