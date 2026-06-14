# Éclats of Lumière — Estado do Jogo & Fórmulas

> Documento técnico do que está implementado, como o jogo flui e **todas as fórmulas**
> dos sistemas. Fonte: o código real em `src/` (não o GDD em abstrato).
> Última atualização: **2026-06-11** (sessão de design — ver §10.5).
>
> Legenda: ✅ implementado e ligado ao motor · ⏳ provisório (valor placeholder, recalibrar)
> · 🔒 não implementado / pós-MVP · 🎯 **design fechado, aguarda calibração+código** · `TODO(canon)` aguarda decisão do Willian.
>
> ⚠️ **Importante:** as §§1-10 descrevem o **código atual**. A **§10.5** consolida as **decisões de
> design travadas na sessão 2026-06-11** (Defesa, Craft/Materiais, Fate Keepers, Mémoires revisadas,
> catálogo de Gear) que **ainda NÃO estão no código** — é o próximo trabalho (calibração → implementação).

---

## 0. Visão geral do estado

| Tela (nav) | Estado | Moeda |
|---|---|---|
| **Combate** | ✅ ondas, boss, drip, multi-mapa | — |
| **Mapa** | ✅ mundo (5 pinos) + continente (5 sub-áreas) | — |
| **Player / Seeker** | ✅ Gold Stats + Convergence | gasta Lumens |
| **Gear** | ✅ ⏳ (valores provisórios) | Lumens |
| **Passivas** | ✅ ⏳ (efeitos agregados provisórios) | Vestiges |
| **Mémoires** | ✅ (Clarté canônica; 8 efeitos exóticos ⏳) | Éclats |
| **Ascension** | ✅ (A1 jogável; A2-A5 ao chegar nos mapas) | Vestiges |

**As 7 telas, os 5 mapas e todos os sistemas (MVP + pós-MVP) estão implementados e jogáveis.**

- **Conteúdo:** 5 mapas jogáveis ponta a ponta (The Dreaming Wood → Nil Aeternum), progressão por Ascension (A1→A5).
- **Arte:** ✅ **completa** para tudo que existe no jogo — 5 trios + guardiões + 5 bosses (incl. Nihel), backgrounds dos 5 mapas, retratos do Seeker T1-T5, molduras do card T1-T5, e bordas de inimigo (universal + 5 bosses).
- **Design dos sistemas: ✅ COMPLETO** (sessão 2026-06-11 — Defesa, Craft/Materiais, Fate Keepers, Mémoires, Gear todos fechados, ver §10.5). Echoes fica pós-MVP (🔒 standby).
- **Falta agora:** (1) **calibração numérica única** (curvas/custos/brackets) e (2) **implementar no código** o design fechado da §10.5 — várias coisas hoje são placeholder/agregado.

---

## 1. Fluxo do jogo (loop principal)

```
                    ┌──────────────────────────────────────────────┐
                    │  COMBATE (ondas) no Mapa atual / Sub-área     │
                    │  mata mobs → Lumens, XP, Vestiges (, Éclats)  │
                    └───────┬───────────────┬──────────────┬───────┘
        gasta Lumens        │               │ enche parede │ kills até threshold
        ┌───────────────────┘               │ de XP        │
        ▼                                    ▼              ▼
  GOLD STATS (Player)                  CONVERGENCE     BOSS da Sub-área
  + GEAR (Lumens)                      reseta a run    (Guardião) → abre
        │ ↑ dano/HP/economia           +pontos, ×fator   próxima Sub-área
        │                                    │               │
        │ gasta Vestiges                     │          Sub-área 5 → BOSS FINAL
        ▼                                    │               │
  PASSIVAS (3 árvores)                       │          derrota libera A_N
  (libera na 1ª Convergence)                 │               ▼
        │ ↑ dano/HP/economia                 │          ASCENSION (Vestiges)
        │                                     │          ×asc_mult (dano+HP),
        ▼                                     │          bolsa de Éclats, rank,
  gasta Éclats                                │          + DRIP de Éclats (A1)
        ▼                                     │          → avança p/ Mapa N+1
  MÉMOIRES (15 relíquias, Clarté)  ◄──────────┘               │
  (libera por era via Ascension)                              ▼
        ↑ Clarté: dano ×1.07^Σníveis                  repete nos Maps 2→5
                                                        até A5 (derrotar Nihel)
```

**Resumo:** farmar gera 4 moedas → cada moeda alimenta um sistema → cada sistema
aumenta o dano/HP/economia → você desce mais fundo → derrota bosses → ascende →
mapa novo + multiplicadores grandes → repete por 5 mapas.

### Combate (modelo de ondas, estilo Gaiadon) ✅
- O jogador ataca **1 mob por vez** (o vivo de **menor HP** atual).
- **Cap físico:** no máximo **1 kill por ataque** (excedente de dano se perde). A taxa de kill nunca passa do APS — **âncora da economia**.
- **Mob morto some** (sem respawn individual). A **próxima onda só surge quando TODA a onda atual é limpa**.
- Dano ao jogador = **Σ dano dos mobs VIVOS** da onda. Limpar a onda alivia a pressão; a próxima onda cheia traz de volta.
- **Boss:** ao atingir o `bossKillThreshold` (oculto), a próxima onda traz o **Guardião junto** (substitui 1 mob do pack; na Sub 1 vem sozinho). Derrotar o Guardião da sub-área abre a próxima; derrotar o **boss final (Sub 5)** libera a Ascension.
- **Morte:** recua 1 sub-área, renasce com HP cheio em 3s, sem perdas.

---

## 2. Moedas & persistência

| Moeda | Origem | Gasta em | Reseta? |
|---|---|---|---|
| **Lumens** | kills | Gold Stats, Gear | ✅ na Convergence |
| **Vestiges** | kills | Passivas, custo de Ascension | ❌ nunca |
| **Éclats** | bolsa de Ascension + **drip** (após A1) | Mémoires | ❌ nunca |
| **XP** | kills | nível do Seeker (vida) + parede de Convergence (run) | parede reseta; vida não |

**Persiste sempre (nunca reseta):** convergences, convPoints, xpTotal (nível), vestiges, eclats, **gear, passivas, mémoires, ascensions**, posição de mapa.
**Reseta na Convergence:** lumens, Gold Stats, xpRun (parede), subárea, unlockedSubarea, bossDefeated, killsInSubarea, bestSubareaRun.

Save em `localStorage` (`eclats_save_v1`, schema v1), autosave a cada **10s** + no `beforeunload`. Números nativos JS, teto do jogo base **1e100**. Exibição via `formatNumber` (K/M/B/T → notação científica curta `1.23e18` acima de 1e15).

---

## 3. Núcleo de combate (constantes-âncora §4)

```
baseDmg = 7      baseAPS = 0.40 (intervalo 2.5s)     apsCap = 1.25 (mín 0.8s)
playerBaseHp = 50    regen = 1% HP máx/s    regenOnKill = 2% HP máx por kill
bossHpMult = 15      bossDmgMult = 3        deathRespawnSeconds = 3
goldRatio = 0.10     xpRatio = 0.08
```

### Dano por hit
```
dano_por_hit = baseDmg × str_total × level_bonus × conv_factor
             × gear_dano × passive_dano × memoire_dano × asc_mult
```

### DPS exibido (com crit)
```
dps = dano_por_hit × APS_atual × (1 + crit_chance × (crit_damage − 1))
```

### HP máximo
```
hp_max = playerBaseHp × vit_total × level_bonus × conv_factor
       × gear_hp × passive_hp × memoire_hp × asc_mult
```

### APS (velocidade de ataque)
```
APS_atual = min(apsCap, baseAPS × (1 + agi × 0.04))          // cap duro 1.25
```

---

## 4. Nível do Seeker & Level Bonus (§6)

```
hero_level  = max(1, floor( (xp_total_da_vida / 10) ^ 0.4 ))
level_bonus = 1 + sqrt(hero_level) × 0.20
```
- `hero_level` é display + escala o `level_bonus` (entra em dano e HP).
- `xp_total` é da **vida** (nunca reseta). O `xp_run` (paralelo) enche a parede de Convergence.

---

## 5. Gold Stats (§5) — moeda: Lumens ✅

6 stats compráveis na tela do Player. Custo e efeito:

```
custo(n)  = 10 × 1.15^n                       // n = nível atual (paridade de renda)
stat_total = (1 + nível × per) × milestones   // para str/vit/frt/wis
```

| Stat | `per` | Efeito | Milestones? |
|---|---|---|---|
| **STR** | 0.08 | ×dano (`str_total`) | sim |
| **VIT** | 0.06 | ×HP (`vit_total`) | sim |
| **AGI** | 0.04 | +APS (cap 1.25) | não |
| **LCK** | 0.015 | +crit chance | não |
| **FRT** | 0.05 | ×Lumens (`frt_total`) | sim |
| **WIS** | 0.05 | ×XP (`wis_total`) | sim |

**Milestones** (multiplicam o stat ao atingir o nível): `10→×2, 25→×2.5, 50→×3, 100→×4, 200→×4.5, 400→×5, 800→×5.5, 1600→×6, 3200→×6.5` (produto cumulativo).

---

## 6. Crit (⏳ PROVISÓRIO — GDD §16.6) ✅

```
crit_chance_raw = 0 + lck × 0.015 + gear_crit_add            // base 0
crit_chance     = min(1, crit_chance_raw)
overflow        = max(0, crit_chance_raw − 1)                 // excedente acima de 100%
crit_damage     = (2 + overflow × 1) × memoire_crit_damage    // base ×2, transbordo 1:1
```

---

## 7. Economia por kill (§6, §7, §12)

```
lumens_por_kill   = mob_hp × 0.10 × frt_total × boss(×5) × gear_lumens × passive_eco × memoire_lumens
xp_por_kill       = mob_hp × 0.08 × wis_total × gear_xp × passive_eco × memoire_xp
vestiges_por_kill = ceil(subárea × 0.5) × 3^(mapa−1) × boss(×10) × memoire_vestige
```
- `mob_hp` = HP **máximo** do mob morto → renda ancorada ao mob mais fundo que você mata (não à velocidade).
- Map 1: vestiges/kill base = `[1,1,2,2,3]` nas Subs 1-5.

---

## 8. Malha geométrica — Mapas, Levels e HP (§3) ✅

| # | Mapa | Levels | HP dos mobs | Threshold boss | dano dos mobs (⏳) |
|---|---|---|---|---|---|
| 1 | The Dreaming Wood | 1 – 1.000 | 10 – 1e6 | 100 | 1 – 1e4 |
| 2 | Cavernes Luminis | 1.000 – 100k | 1e6 – 1e16 | 200 | 1e5 – 1e14 |
| 3 | The Ashen Ruins | 100k – 10M | 1e16 – 1e34 | 350 | 1e15 – 1e32 |
| 4 | The Fractured Peaks | 10M – 100M | 1e34 – 1e62 | 500 | 1e33 – 1e60 |
| 5 | Nil Aeternum | 100M – 1e9 | 1e62 – 1e100 | 800 | 1e61 – 1e98 |

- **5 sub-áreas por mapa**, `packSizes = [2,4,6,9,12]` ✅ (Camada 1 da calibração; era `[1,2,4,6,8]`).
- ✅ **Dano dos mobs = `0.02 × HP`** (Camada 2, 2026-06-11) — razão constante em todos os mapas. Mitigado pela Defesa (razão/armadura). Validado em `tools/sim/survival.mjs`.

### Fórmulas da malha
```
r (razão entre sub-áreas)  = (lvl_hi / lvl_lo) ^ (1/5)
range_sub(s)               = [ lvl_lo × r^(s-1) ,  lvl_lo × r^s ]
level de um mob            = sorteado uniformemente no log de range_sub(s)
hp(L)  = hp_lo  × (hp_hi/hp_lo)^t        // t = (logL − log lvl_lo) / (log lvl_hi − log lvl_lo)
dmg(L) = dmg_lo × (dmg_hi/dmg_lo)^t      // mesma interpolação log
boss:  level = máximo da sub-área,  HP × 15,  dano × 3
```

---

## 9. Sistemas de progressão — fórmulas completas

### 9.1 Convergence (§6) — moeda: XP da run

> 🔄 **Design REVISTO em 2026-06-11** (registrado no GDD §6) — **código ainda NÃO atualizado** (faz o comportamento antigo abaixo). Decisão nova: a Convergence **não reseta o mapa** (gates/bosses persistem, viagem livre); pontos da run = **`f(xp_run)` com retorno decrescente + bônus único do Boss final** (não mais "profundidade alcançada"); 1ª parede ~1.500 XP só para encher. A forma de `f` e aditivo-vs-composto ficam para a sessão de Escala. **Implementação pendente.**

**Comportamento atual no código (a ser revisto):**
```
parede(c)   = 1500 × Π(i=0..c-1) [ 1.5 × 1.06^i ]      // c = nº de convergências
pode_convergir = xp_run ≥ parede(convergences)
pontos_da_run  = bestSubareaRun (sub-área mais funda alcançada na run)
conv_factor    = (1 + 0.04 × 1.38^ascensions)^convPoints  // COMPOSTO+ANINHADO 🔧 Camada 7
               // (era 1+0.15×pts aditivo = bug; Ascension zera pontos mas amplifica a base)
```
Hoje ao convergir: ganha `pontos_da_run`, **reseta a run** (Lumens, Gold Stats, **e o mapa→Sub 1** — isto será removido), preserva o resto. **A 1ª Convergence desbloqueia as Passivas.**

### 9.2 Gear (§13) — moeda: Lumens — ⏳ VALORES PROVISÓRIOS ✅
6 peças fixas, cada uma com **nível** + **raridade**.

```
afixo_mult(peça) = 1 + nível × 0.02 × rarityMult[raridade]      // dano/HP/XP/Lumens
crit_add(peça)   = nível × 0.0004 × rarityMult[raridade]        // peça Grasp
custo_nível      = 50 × 1.12^nível × costMult[raridade]
custo_raridade   = [—, 6.000, 90.000, 1.5M, 30M] (Lumens, p/ a próxima)  // gate: nível no cap
```

| Por raridade (0→4: Faded·Kindled·Luminous·Radiant·Converged) | | | |
|---|---|---|---|
| `rarityMult` | 1 · 1.5 · 2.25 · 3.5 · 5 | `levelCap` | 25 · 50 · 100 · 175 · 300 |
| `costMult` | 1 · 4 · 16 · 64 · 256 | | |

| Peça | Slot | Afixo |
|---|---|---|
| The Waning Edge | Arma | **dano** |
| The Silent Vigil | Elmo | **HP** |
| Veil of Cinders | Manto | **HP** |
| Grasp of the Unnamed | Manoplas | **crit** |
| The Last Resonance | Amuleto | **XP** |
| Band of Dusk | Anel | **Lumens** |

Agregação: `gear_dano` = Π afixo das peças de dano; `gear_hp` = Π das de HP; idem XP/Lumens; `gear_crit_add` = Σ. (No topo, Converged nível 300 ≈ ×31 por peça.)

### 9.3 Passivas (§7) — moeda: Vestiges — efeitos ⏳ AGREGADOS ✅
3 árvores × 15 (3 grupos de 5). Desbloqueiam na **1ª Convergence**.

```
custo_desbloqueio(i) = unlockLadder[posição_no_grupo] × groupMult[grupo]
   unlockLadder = [100, 500, 2.500, 12.500, 62.500]   (§7, ×5 por posição)
   groupMult    = [1, 10, 100]                         (⏳ provisório por grupo)
custo_evolução(nível) = custo_desbloqueio × 0.3 × 1.30^(nível−1)   (§7)
maxLevel = 5  (⏳ provisório)
```
**Gate:** maximizar os **5 do grupo anterior** libera o próximo grupo.

**Efeitos (⏳ agregados — efeitos individuais das 45 a definir, GDD §16.3):**
```
passive_dano = 1 + 0.05 × Σ(níveis Éclat)       // Éclat = combate
passive_eco  = 1 + 0.03 × Σ(níveis Vestige)     // Vestige = Lumens/XP
passive_hp   = 1 + 0.04 × Σ(níveis Fracture)    // Fracture = HP
```

### 9.4 Mémoires (§10/§11) — moeda: Éclats — motor CANÔNICO ✅
15 relíquias em 5 eras (3 por era). Desbloqueiam por **Ascension da era** (`ascensions ≥ era`).

```
CLARTÉ (motor global): dano × 1.07 ^ (Σ todos os níveis de Mémoires)
custo_desbloqueio = [10, 30, 90, 270, 810] Éclats   (por era 1..5)
custo_evolução(nível) = 2 × 3.0^n Éclats   🔧 Camada 6 (era 1.10 — bug: maximizava instantâneo)
```

| # | Mémoire | Era | Efeito por nível | Ligado? |
|---|---|---|---|---|
| 1 | du Premier Matin | 1 | +10% dano global | ✅ |
| 2 | des Rires | 1 | +10% Lumens | ✅ |
| 3 | de la Marche | 1 | +8% XP | ✅ |
| 4 | de la Forme | 2 | +8% Crit Damage | ✅ |
| 5 | du Façonnage | 2 | +6% efeito de Gear | ⏳ via Clarté |
| 6 | des Profondeurs | 2 | +10% offline | ⏳ via Clarté |
| 7 | de la Chute | 3 | +12% dano em boss | ⏳ via Clarté |
| 8 | des Cendres | 3 | +10% Vestiges | ✅ |
| 9 | du Dernier Chant | 3 | +1 ponto Convergence/run a cada 5 níveis | ⏳ via Clarté |
| 10 | de la Blessure | 4 | ×1.10 dano (multiplicativo) | ✅ |
| 11 | de la Résistance | 4 | +12% HP e regen | ✅ (HP) |
| 12 | du Temps Brisé | 4 | +15% Éclats do drip | ⏳ via Clarté |
| 13 | du Vide | 5 | −1% HP de inimigos (cap 50) | ⏳ via Clarté |
| 14 | de la Lumière Entière | 5 | amplifica o expoente da Clarté | ⏳ via Clarté |
| 15 | du Choix | 5 | +5% a todos os efeitos de Mémoires | ⏳ via Clarté |

> **Nota:** os 8 efeitos ⏳ ainda **contam via Clarté** (cada nível dá ×1.07 no dano), mas o
> efeito específico (ex.: dano em boss, drip, HP de inimigo) ainda não está ligado — fica
> para um passe futuro. Os 7 ✅ somam aos fatores `memoire_*`.
>
> 🎯 **A tabela acima é o CÓDIGO atual.** O **design dos efeitos foi revisado em 2026-06-11**: os
> Mémoires **#5, #11, #12, #13 mudaram** (ver §10.5.4). Ao fazer o wiring, usar os efeitos novos.

```
memoire_dano        = Clarté × (1 + Σ%dano [Premier Matin]) × Π(×1.10 [Blessure])
memoire_hp          = 1 + 0.12 × níveis(Résistance)
memoire_lumens      = 1 + 0.10 × níveis(Rires)
memoire_xp          = 1 + 0.08 × níveis(Marche)
memoire_vestige     = 1 + 0.10 × níveis(Cendres)
memoire_crit_damage = 1 + 0.08 × níveis(Forme)
```

### 9.5 Ascension (§8) — moeda: Vestiges — motor CANÔNICO ✅
Marco por mapa: derrotar o **boss final do mapa** + pagar Vestiges → multiplicador, Éclats, rank, próximo mapa.

| A | Requisito | Custo (Vestiges) | asc_mult | Éclats (bolsa) | Rank (Tier) |
|---|---|---|---|---|---|
| **A1** | Boss Map 1 | 500.000 | **×10** | 100 + **libera drip** | Illuminate (II) |
| **A2** | Boss Map 2 | 1.900.000 | ×5 | 300 | Éclairé (III) |
| **A3** | Boss Map 3 | 4.000.000 | ×5 | 900 | L'Éveillé (IV) |
| **A4** | Boss Map 4 | 8.000.000 | ×5 | 2.700 | Lumière (V) |
| **A5** | Derrotar Nihel | grátis | — | fim do jogo base | — |

```
asc_mult = Π (mult das Ascensions concluídas)     // aplica a DANO e HP
ao ascender: −Vestiges, +Éclats, +1 ascension, AVANÇA para o Mapa N+1
             (reinicia subárea/unlockedSubarea/bossDefeated/killsInSubarea)
```

**Drip de Éclats (§10, liberado pela A1):**
```
éclats_por_hora = 0.1 × (HP_frontier) ^ 0.9
   HP_frontier = HP do boss da sub-área mais funda desbloqueada do mapa atual
```
A **1ª Convergence** libera Passivas; a **A1** libera Éclats/Mémoires + o drip. O **rank** reflete no card do Seeker e na tela do Player (Tier I→V).

---

## 10. Offline (§15) ✅
Ao reabrir, simula o tempo ausente rodando o **mesmo `combatTick`** (tick fixo 100ms),
teto **30 dias**, mínimo **60s** para mostrar o resumo. Garante que o jogador **nunca abre morto**.

---

## 10.5 ✅ DESIGN FECHADO (2026-06-11) · ✅ WIRADO NO CÓDIGO (Passos 1-7) · ⏳ calibração fina (§11)

O design abaixo foi **decidido** (sessão 2026-06-11), **wirado no código** (7 passos de wiring, 2026-06) e **revalidado** na sessão de validação 2026-06-12 (6 decisões, ver notas ✅ VALIDADO). Resta a **calibração fina única** (§11) e dois itens de código novos da validação: **Eco do Seeker (A3)** e **asc_mult ×2**.

> **📐 Calibração em andamento** (sessão 2026-06-11, simulador em `tools/sim/`):
> - ✅ **Camada 1 (Caps):** APS 15 + sub-cap AGI 3.75× · kills extras 50% · mobs `[2,4,6,9,12]` teto ~24 · crit distribuído.
> - ✅ **Camada 2 (Sobrevivência):** dano dos mobs = **0.02×HP** constante + alvo de Defesa `def≈1-4×packDps`. *(já no `constants.js`: dano + packSizes; `apsCap` e Defesa esperam o wiring dos sistemas de suporte.)*
> - ✅ **Camada 3 (Gear):** orçamento **~10 décadas** (de 100); modelo `(1+L×0.02×rarityMult) × 1.008^L` (× liga em Luminous), **+500 níveis/Ascension** = sem-teto; **Veil maximizado = 80% mit** (`tools/sim/gear.mjs`). Sobe de ×1.5 a ×1.4 tri — nunca morre.
> - ✅ **Camada 4 (Craft/Materiais):** material = **~1% drop/mob** (tier=tier do mapa) **+0.1% tier seguinte**; **240 mat = 6 peças/tier** (~8-27 min); **Converged no Map 4**; raridade **independe de dificuldade**; refino 12:1 (`tools/sim/material.mjs` + pesquisa de gênero).
> - ✅ **Camada 5 (Passivas):** maxLevel **12**, custo grupo **[1,10,100]×**; ~8 déc/árvore (maioria % aditivo + **3 motores no grupo 3** ×1.52/nv); alavancas Fracture Pulse(APS)/Luminal Edge(crit)/Void Awareness(mobs)/Vestige Pull(mat) (`tools/sim/passives.mjs`).
> - ✅ **Camada 6 (Mémoires):** Clarté **1.07** = ~70 décadas (~159 niv/Mémoire); **custo corrigido 1.10→3.0** (era bug: maximizava instantâneo) — paceia pela profundidade (`tools/sim/memoires.mjs`). *(já no `constants.js`: MEMOIRE_EVO_RAMP=3.0.)*
> - ✅ **Camada 7 (Convergence + Dificuldades):** conv_factor **aditivo→composto+aninhado** `(1+0.04×1.38^asc)^pts` (era bug: morria em 1.57 déc; agora pico ~4 déc na era final, base sobe por Ascension). Dificuldades ×HP/dano 1e5/1e15/1e30, ×recompensa 3/10/30 (Nightmare+ = break_infinity futuro). *(constants.js + stats.js atualizados; `tools/sim/convergence.mjs`.)*
> - 🎉 **AS 7 CAMADAS DE CALIBRAÇÃO ESTÃO FECHADAS.**
>
> **📅 Duração do jogo base (5 mapas)** — `tools/sim/playtime.mjs` (cross-check c/ orçamento §9 do GDD):
> Intenso **~14d** · **Casual (alvo) ~15d** · Leve **~41d**. Offline generoso faz casual≈intenso; o leve perde pelo cap 24h.
> **Benchmark do gênero** (pesquisa): Gaiadon/Synergism/NGU = **meses** pro endgame; o **jogador-padrão do gênero = nosso CASUAL**.
> **Decisão:** 5 mapas ≈ 2 semanas = "Ato 1". "Alguns meses" vem de **mais conteúdo** (mais mapas + sub-áreas crescentes §8), **não** de inflar custos — calibração é escalável, estende sem re-calibrar. (Detalhe no GDD §14B "Duração & Ritmo".)

> **Orçamento de poder** (`tools/sim/budget.mjs`): dano cresce **~95 décadas** no jogo. Split: Mémoires 70 · Gear 10 · Passivas 8 · Gold Stats 4 · Convergence 4 · Ascension 3.8 · Level 1 = ~100. HP segue o mesmo.

### 10.5.1 Defesa / Mitigação (GDD §4) 🎯
Antes o dano batia direto no HP. Fechado:
```
mitigação     = defesa / (defesa + Σdano_do_pack)          // razão/armadura
dano_recebido = Σdano × Σdano / (defesa + Σdano)            // nunca 100%, auto-escala, sem teto
```
- **Dois eixos de sobrevivência:** VIT (Gold Stat) = poça de HP · **Veil (Gear) = defesa**. Sem stat nova.
- **Duas camadas:** afixos/passivas de **defesa** alimentam a razão; passivas de **"reduz dano recebido"** (Nihel's Shadow) = redução % à parte, DEPOIS da armadura.
- **Defesa de inimigos** = mesma fórmula virada (`seu_dano/(def_inim+seu_dano)`); **Void Piercing** fura, **Weakened Void** reduz. Early ≈ 0.
- ⚠️ Código hoje: dano direto no HP (sem `defesa`). Falta o termo `defesa` no cálculo de dano recebido + o afixo Veil real.

### 10.5.2 Craft / Materiais (GDD §13B) — sistema BASE, early/mid 🎯
1. **Material TIERED por raridade:** T1→Kindled · T2→Luminous · T3→Radiant · T4→Converged.
2. **Drop:** **T1 (comum) de mobs normais**; **T2-4 (raros) só de bosses** (Guardião=médios, boss final=altos+chance do próximo). **Dificuldade** multiplica qtd e empurra o tier.
3. **Forja:** subir raridade = **gate duplo** (peça no nível MÁX da raridade **+** pagar material); **refino** = N tier baixo → 1 tier alto (só pra cima).
4. **Leveling MANUAL, por peça, independente** (sem auto-level); raridade só com tier anterior maximizado, em ordem. **Vestige Pull** turbina material.
- ⚠️ Código hoje: `custo_raridade` em **Lumens** (§9.2). Muda para **materiais**; criar recurso `materiais[tier]` + drop nos kills/bosses + tela da Forja.

### 10.5.3 Fate Keepers + Dificuldades (GDD §8) — ✅ VALIDADO 2026-06-12
**Escada dos Fate Keepers** (A1 automatiza o early · A2 reabre o passado · A3 desdobra o jogador · A4 adensa o presente · A5 transcende):
| A | Fate Keeper |
|---|---|
| A1 | Automação básica (auto-Gold Stats + auto-Convergir) — *codado (Passo 5)* |
| A2 | Auto-progressão + **abre o SISTEMA de dificuldades** (seleção **GLOBAL**; modos altos gateados por PODER) — *codado* |
| A3 | **Eco do Seeker** 🔁 (substitui "Motor de Éclats"): um eco farma **em 2º plano** um mapa já limpo, rendendo materiais/Lumens/Vestiges a **25-40%** (⏳ calibrar). Precursor dos **Echoes (pets)** pós-MVP. **⏳ código pendente** |
| A4 | **+Cap global de mobs na tela** — *codado* |
| A5 | Transcendência (pós-MVP) — *flag* |

**Dificuldades:** Difícil · Nightmare · Tormento — re-rodar mapas com HP/dano maiores + recompensas. ✅ **seleção GLOBAL** (não por sub-área — código do Passo 5 já é assim; corrigido no GDD). Endgame ancora no **Map 4** (Tormento ×1e30 cabe em 1e100); **Map 5 = Normal-only** até break_infinity, **por design**.
**Despertar/Tier (✅ codado — Passo 7):** tier T1→T5 = **mudança de classe** (insp. Grand Chase), **×5 poder/tier** + arte + rank; Sub 3 dos Maps 1-4 (T2-T5); **Map 5 sem Despertar** (já Lumière). Desacoplado das ascensions (`state.despertares`). `DESPERTAR.mult=×5` ⏳ provisório.
**Ascension (✅ validado):** asc_mult **passa de ×10/×5/×5/×5 (×6250) → ×2/mapa (×16)** — ⏳ **lista de calibração, código não alterado**. Bolsas (100/300/900/2700) **simbólicas por design** (perdem relevância vs drip — não é bug).

### 10.5.4 Mémoires — 4 efeitos revisados (GDD §11) 🎯
Os 15 efeitos foram revisados item-a-item (pesquisa: TT2/Synergism/Gaiadon). **Mudaram 4** vs o §9.4 atual:
| # | Mémoire | Efeito NOVO (era) |
|---|---|---|
| 5 | du Façonnage | **+% materiais dropados** (era "+6% efeito de Gear") — engata no Craft |
| 11 | de la Résistance | **+% sobrevivência: HP, regen E defesa** (era só "+HP/regen") — engata na Defesa |
| 12 | du Temps Brisé | **+% a TODOS os Éclats** (drip + bolsas de Ascension) (era "só drip") — o "Book of Shadows" |
| 13 | du Vide | **+% recompensas nas dificuldades altas** (era "−1% HP cap 50" quebrado) — sem teto |
Os outros 11 mantidos. Os efeitos exóticos ainda contam só via Clarté no código — falta o wiring individual.

### 10.5.5 Gear — catálogo de afixos + identidade das peças (GDD §13) 🎯
**Modelo:** primário inerente por peça + raridade abre slots do **pool**; cada afixo nos 4 sabores (flat·%·×·mastery), determinístico.

**Pool (12 afixos):**
- **Combate (now):** Dano · HP · Defesa · Crit Chance · Crit Damage · APS · Regen
- **Anti-inimigo:** Dano em Boss (now) · Erosão do Vazio / penetração (future)
- **Farm (now):** Lumens · XP · Materiais (+% drop, modesto)
- **FORA do Gear (decisão):** Vestiges · Éclats · Offline (vêm de Passivas/Mémoires)

**Identidade das 6 peças** (primário + secundários-assinatura):
| Peça | Primário | Secundários |
|---|---|---|
| The Waning Edge (Arma) | Dano | Crit Damage · Dano em Boss · Erosão |
| Grasp of the Unnamed (Manoplas) | Crit Chance | Crit Damage · APS · Dano |
| The Last Resonance (Amuleto) | APS | Crit Chance · Regen · Dano |
| The Silent Vigil (Elmo) | HP | Defesa · Regen |
| Veil of Cinders (Manto) | Defesa | HP · Regen · Erosão |
| Band of Dusk (Anel) | Lumens | XP · Materiais |
- ⚠️ **Fix de código:** `constants.js` GEAR.pieces tem `veil` afixo `hp` e `reson` afixo `xp` — **errado**; canon é **Veil=defesa, Resonance=APS**.

---

## 11. O que FALTA / pendências

### ✅ Design da §10.5 — CODADO (Passos 1-7) + CALIBRADO (Blocos 1-6, 2026-06-12)
- ✅ **Defesa/Mitigação** · **Craft/Materiais + Forja** · **catálogo de 12 afixos + identidade** · **Fate Keepers A1-A4 + Dificuldades (global)** · **Mémoires (4 novos + 8 exóticos; #14 stub)** · **Despertar/Tier** · **Eco do Seeker (A3)** · **asc_mult ×2** · **45 passivas** · **Crit** · **apsCap 15**.
- ⏳ **Falta codar (não-bloqueante):** **offline 24h cap** (código ainda 30d — guarda de engenharia, não balanceamento).

### 🔒 Não implementado (pós-MVP)
- **Echoes (pets)** — herdam o sistema do **Eco do Seeker (A3)** quando implementados. **break_infinity** (libera Nightmare/Tormento + Map 5 alto). **A5 Transcendência**. **Convergence relics**.

### ✅ CALIBRAÇÃO FINA — FECHADA na sessão 2026-06-12 (6 blocos)
| Item | Status |
|---|---|
| **asc_mult ×2 (×16) + Despertar no orçamento** | ✅ Bloco 1 — `ASCENSIONS[].mult=2`, budget Despertar 2.8 + Asc 1.2 = 4.0 (total 101 déc) |
| **veilScale + veilCap** | ✅ Bloco 2 — `veilScale=0.015`, `veilCap=0.18` (80% mit teto; ramp por era; nunca invencível) |
| **afixo Materiais amortecido + Eco do Seeker (A3)** | ✅ Bloco 3 — Farm sem motor × (Lumens/XP linear); drop `1+0.5×log10` (×~2 endgame); Eco `fraction=0.35` |
| **45 passivas individuais** | ✅ Bloco 4 — esquema Camada 5 (maxLevel 12, %/grupo + 3 motores ×1.52); Éclat = 7.62 déc; alavancas wiradas |
| **Crit + valores das Mémoires** | ✅ Bloco 5 — `critPerLevel 0.0015`, `lck 0.002` (mínima), afixo Crit Damage wirado; Mémoires canônicas |
| **apsCap = 15 + fontes** | ✅ Bloco 6 — AGI sub-cap 3.75 · Fracture Pulse · Resonance (amortecido); rampa 1.5→7→15 |
| **Clarté também no HP** | ✅ fix da validação final (§4: HP recebe os mesmos fatores; sem isto o late era injogável) |

### ⏳ O QUE SOBRA (só isto + pós-MVP)
| Item | Pendência |
|---|---|
| **f(xp_run)** | a função de pontos da Convergence — **única pendência de calibração**: paredes longas, retorno decrescente + bônus do boss, **~50 pts de pico/era** (sessão de Escala) |
| **#14 de la Lumière Entière** | `MEMOIRE_CLARTE_EXP_PER = 0` — **stub desarmado de propósito** (a alavanca mais perigosa; armar só com cuidado extremo na Escala) |
| **DESPERTAR.mult / ECO.fraction / etc.** | valores ✅ definidos, abertos a ajuste fino em playtest (não bloqueiam) |
| **pós-MVP** | break_infinity (Nightmare/Tormento + Map 5 alto) · Echoes (herdam o Eco) · A5 Transcendência · Convergence relics |

### Arte — estado atual
- ✅ **Mobs:** todos os 5 trios + guardiões + 5 bosses finais (incl. Nihel = `fallen_angel`) e o Map 4 completo (Fissure Stalker, Sundered Titan, Claimed Vanguard).
- ✅ **Retratos do Seeker T1-T5** (avatar evolui com o tier/Ascension).
- ✅ **Bordas de inimigo:** moldura comum (universal) + 5 bordas de boss (M1-M5), aplicadas no card de combate.
- ✅ **Backgrounds** dos 5 mapas (Map 2 em high-res).
- ✅ **Molduras do card do Seeker T1-T5** (T4 = radiante, T5 = Lumière — confirmadas).
- ✅ **Telas de NPC (cena única):** Forge (Maël), Gear (Lucius) e **Ascension (Séraphine, a Doyenne)** — arte do salão da Ordre com a NPC embutida ao pé da escada (`eclats/ascension/hall.webp`, 2026-06-13). Ver `eclats_art_direction.md` §9 + lore bible (Séraphine).
- ✅ **Tipografia:** piso global de **16px** em toda a UI (acessibilidade, 2026-06-13; `_font_floor.py`).

### `TODO(canon)` (nomes / posições / outros)
- **Sem arte própria por design:** Guardiões das Subs 1-4 usam um mob do mapa como placeholder (o GDD não define arte de sub-boss).
- **Nomes das sub-áreas** (placeholder "Sub-área N").
- **Posições** dos pinos no worldmap e dos nós no continente (provisórias).
- **Reconciliar nomes de assets** `VERIFICAR`/underscore → kebab-case do `assets/README.md` (adiado por decisão do Willian).
- **Ícone próprio de Éclats** (hoje usa o de Convergence).
- **Pipeline webp:** os assets novos (bg Map 2, retratos T2-T5, molduras T2-T5, bordas de boss, mobs do Map 4) entraram como **PNG** — sem cwebp/PIL no ambiente, o `<source webp>` cai no fallback PNG. Gerar os `.webp` pelo pipeline quando houver acesso ao PC.

---

## 12. Arquitetura (onde está cada coisa)

```
src/core/    loop.js · state.js · save.js · format.js · dev.js (modo de teste ?dev / botão DEV)
src/game/    combat.js (ondas) · enemies.js (malha+arte) · economy.js · stats.js
             convergence.js · gear.js · passives.js · memoires.js · ascension.js · offline.js
src/data/    constants.js (TODAS as constantes/fórmulas) · assets.js (manifest gerado)
src/ui/      ui.js (casca: nav, moedas, fit, roteia telas)
             combat.js · map.js · player.js · gear.js · passives.js · memoires.js · ascension.js
             + tokens/shell/<tela>.css
```
Todas as fórmulas e números vivem em **`src/data/constants.js`** — é o arquivo de recalibração.

**Modo de teste:** abra com `?dev` na URL **ou** clique no botão **DEV 🔓** (canto inferior
esquerdo). Concede Lumens/Vestiges/Éclats, 1ª Convergence, boss final batido (A1 disponível)
e stats básicos — sem afetar o jogo normal.
