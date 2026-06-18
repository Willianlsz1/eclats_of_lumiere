# Éclats — Recalibração "VALORES NO MAPA" do Map 1 (sessão com Willian, 2026-06-18)

> Segunda sessão da recalibração geral. O Willian redefiniu os **stats iniciais do player** e
> os **bônus dos sistemas** (Convergence, Despertar, Gear) com **alvos de fim de mapa**. Todos
> os números foram **validados rodando o combate REAL** em `tools/sim/game_harness.mjs`
> (importa `src/game/*`). Substitui a recalibração "em branco" 2026-06-17 (escala antiga).
>
> Legenda: ✅ valor fechado + validado no harness · 🔧 mudança de WIRING no código.

---

## Decisões do Willian (texto da sessão) → constantes

### 1. Stats iniciais do player ✅
| Stat | Valor | Constante |
|---|---|---|
| Dano base | **50.000** | `COMBAT.baseDmg` |
| HP base | **100.000** | `COMBAT.playerBaseHp` |
| Atk Speed | **0,9** | `COMBAT.baseAPS` |
| Crit Rate | **0** | `CRIT.baseChance` |
| Crit Damage | **0** → crit = dano normal (×1) até ganhar crit dmg | `CRIT.baseDamageMult` = **1** |
| Gold / XP bônus | **0%** | — |

> **APS = ataques por segundo = hits/s.** Com a âncora "1 kill por ataque", APS 15 ⇒ no
> máx 15 kills/s (o cleave/AoE, que é unlock, fura esse teto — fora do Map 1).
> Per-level escalado ao novo base: `LEVEL.dmgPerLevel` **7.500** (~15%/nv), `hpPerLevel` **500** (~0,5%/nv).

### 2. Mapa 1 — mobs & TTK ✅
- **2 mobs por área**, exceto a **área 9 (Wall) = 3** → `MAPS[0].packSizes = [2,2,2,2,2,2,2,2,3]`.
- **TTK inicial ~2,2s** (`ENEMY.hitsToKill = 2` ÷ APS 0,9) e **cresce com a profundidade**
  (`ENEMY.areaHp = [1, 1.4, 2.0, 2.7, 3.5, 4.5, 5.8, 7.4, 9.5]` → áreas 2/3+ com mobs bem
  mais fortes). O TTK **cai** conforme o player investe (gear/Convergence/Despertar furam o
  baseline do nível → menos golpes).
- **Objetivo: impossível limpar a área 1→9 sem gear/Despertar.** Validado por contrafactual
  (`NODESP=1` no harness): sem Despertar a Wall causa **93 mortes** (vs **0** com Despertar).

### 3. Convergence (ADITIVO, 2 canais) ✅ 🔧
| Canal | Valor | Constante |
|---|---|---|
| Dano / HP | **+20%** por conv | `CONVERGENCE.bonusPerConv = 0.20` |
| Gold (Lumens) | **+0,5%** por conv (canal próprio) | `CONVERGENCE.goldBonusPerConv = 0.005` |
| XP | **0%** (vem do Gear) | — |

> 🔧 Wiring: `stats.js` ganhou `convLumensMult()` (Gold) separado de `convMult()` (dano/HP);
> `economy.js` passou a usar `convLumensMult` no Lumens. Reseta o **nível/Gold da run**, **NÃO**
> reseta a posição no mapa; cada Convergence exige um nível maior (`gateLevelGrowth = 1.3`).

### 4. Despertar (1 por mapa, libera na **área 7**) ✅ 🔧
| Efeito | Valor | Constante |
|---|---|---|
| Dano / HP | **×2** multiplicativo | `DESPERTAR.mult = 2` |
| Crit Damage | **+400%** | `DESPERTAR.critDmgAdd = 4.0` |
| Crit Rate | **+5%** | `DESPERTAR.critRateAdd = 0.05` |
| Atk Speed | **+0,500** | `DESPERTAR.apsAdd = 0.5` 🔧 (novo; wirado no `currentAPS`) |
| Gold | **+100%** | `DESPERTAR.lumensBonus = 1.0` |
| XP | **+40%** | `DESPERTAR.xpBonus = 0.40` |

### 5. Gear — Map 1 sobe só até INCOMUM ✅ 🔧
- Raridades do Map 1: **Comum (Faded)** e **Incomum (Kindled)**. Raro+ é **pós-Map 1**.
  🔧 `MAPS[0].gearRarityCap = 1` + `gear.js: mapRarityCap()` trava o rarity-up.
- **Cap de nível:** Comum **500** · Incomum **1.400** → `GEAR.levelCap = [500, 1400, ...]`.
- **Comum:** 2 afixos — **1 flat + 1 %** (`bonusRate`). Flats escalados ao novo base:
  dano **+2.500/nv**, HP **+2.000/nv** (`GEAR.flatPerLevel`).
- **Incomum:** destrava **1 afixo MULTIPLIER ×** (camada multiplicativa) — `GEAR.multRate = 0.0003`,
  só ativo em `rarity ≥ 1` (🔧 `gear.js: primaryMult`). É o "salto" da raridade, não um "+10%".
- **Gate de raridade + materiais T1** (drop baixo, `CRAFT.dropChance = 0.01`) p/ subir cada peça.

### 6. Alvos de FIM de Map 1 (com 1 Despertar + gear Incomum) ✅
| Alvo | Valor | Como foi calibrado |
|---|---|---|
| APS | **2,5** | base 0,9 + Despertar 0,5 + Amuleto (`flatPerLevel.aps = 0.00304`) |
| Crit Rate | **30%** | Despertar +5% + Grasp (`critPerLevel = 0.0007`) |

> A **razão** `critPerLevel/apsFlat ≈ 0,23 = 0,25/1,1` faz o **crit ACOMPANHAR o APS**: quando o
> APS chega a 2,5 (gear = +1,1), o Grasp dá ~25% e o Despertar fecha os 30%. Independe do
> nível/raridade exatos do gear no fim.

---

## Resultado no harness (`node tools/sim/game_harness.mjs`)
| Métrica | Resultado |
|---|---|
| Nível 2 | ~20s |
| 1ª Convergence | ~24min (nível 40) |
| Despertar (T2) | **~8h** — Sub 7, ANTES da Wall ✅ |
| Wall / Map 1 limpo | **~10,8h** de combate · **0 mortes** (com Despertar) |
| Convergences | **13** · gear termina **Incomum (~186)** |
| **APS no fim** | **2,50** ✅ |
| **Crit rate no fim** | **30,4%** ✅ |
| Contrafactual `NODESP=1` | **93 mortes** na Wall (≈ impossível sem Despertar) ✅ |

## 8. DEFESA removida → afixo GILDED (18/jun, decisão Willian) ✅ 🔧
A **Defesa saiu do jogo**. O Manto (Veil of Cinders) agora rola **Gilded chance** — % de um mob
da onda virar **Gilded** (mais forte/rico). Reaproveita a estrutura de afixo "chance plana"
(como o crit). Sem mexer na fórmula de combate: sem afixo de defesa, `playerDefesa()` → 0
(mitigação some sozinha).

| Parâmetro | Valor | Constante |
|---|---|---|
| Chance/nível do Manto | `gildedPerLevel = 0.00018` × rarityMult | Manto ~186 Kindled ≈ **5%** (fim Map 1) |
| Teto GLOBAL da chance | **30%** | `GILDED.chanceCap` |
| Gilded T1 — HP | **×3,3** (mais tanque) | `GILDED.tiers[0].hpMult` |
| Gilded T1 — Gold | **×2,5** | `lumensMult` |
| Gilded T1 — XP | **×2,2** (usa o HP base, não o ×3,3) | `xpMult` |
| Gilded T1 — dano | **×1** (não bate mais forte) | `dmgMult` |
| Tier 2 (Gilded Eidolon) | ⏳ libera no Map 2 (placeholder) | `tiers[1]` |

🔧 Wiring: `gear.js` (`gildedOf`, `gearGildedChance` com teto), `combat.js` (`applyGilded` rola por
mob na onda), `economy.js` (Gold ×lumensMult, XP usa `baseHpMax` × xpMult). UI: Gear/Forge/Player
trocam "Defense" por "Gilded chance"; combate marca o mob Gilded (✦ + nome dourado).

## 9. Exibição dos stats do Gear reorganizada (18/jun, ref. card do Willian) ✅
A lista de afixos (tela Gear + tooltip) virou o formato da referência: **VALOR + label +
"+x per N levels"**, com **cor**: base/flat/chance = branco · **bônus% / MULTIPLIER × / secundário
= verde**. O afixo **MULTIPLIER ×** do Incomum agora aparece como linha própria (antes era invisível).

## 10. Custo do Gear "controlado dentro do tier" — MAXAR o tier é a meta (18/jun) ✅ 🔧
Antes o custo dobrava a cada 10 níveis → estourava DENTRO do tier (1e17 no cap do Comum). Decisão
Willian (ref. img Gaiadon, tiers curtos): **o custo NÃO explode dentro de um tier; só a TROCA de tier
sobe** (costMult ×10). E a **meta do Map 1 é MAXAR o gear** (Incomum 1400) — o que segura o ritmo é
RENDA (Lumens) + MATERIAIS (rarity-up), não a parede de custo.

| Parâmetro | Valor | Efeito |
|---|---|---|
| Cap de nível | **Comum 500 · Incomum 1400** (FIXO, cap duro) | `GEAR.levelCap` |
| Ramp do custo | dobra a cada **~200 níveis** (`costRamp 1.00347`) | Comum **×5,6** · Incomum **×22** ponta-a-ponta (flat) |
| Base do custo | **15.000** (`levelCostBase`) | maxa o Incomum (1400) ~quando a Wall cai (~7h) |
| Troca de tier | **×10** (`costMult`) | "tier seguinte sobe ok" |

**Custo de 1 nível (controlado):** Comum **15K → 85K** (1→500) · Incomum **151K → 19M** (1→1400) —
sem 1e17. Maxar 1 peça = ~5,3B; set de 6 maxado = **~33B**.

**Re-ancoragem ao endpoint do max (gear 1400):** como o gear MAXA em 1400 (não ~310), TODOS os rates
por-nível foram ÷~4,5 (factor 310/1400) p/ o poder do max-1400 ≈ o fim antigo: `flatPerLevel.dmg`
2500→**554**, `hp` 2000→**443**, `bonusRate` 0.02→**0.00443**, `multRate` 0.0003→**0.0000664**,
`flatPerLevel.aps`→**0.000403**, `critPerLevel`→**0.0000929**, `gildedPerLevel`→**0.0000238**. No cap
Incomum 1400: **APS +1,1 → 2,50** · **crit 25,4% +5% Despertar = 30,4%** · **Gilded 5,0%**. Wall subiu
p/ `bossHpMult` **2500** (gear maxado deixa o dps muito acima do baseline) → **sem Despertar não limpa
em 60h (2667 mortes)**; com Despertar = clear limpo (~7h, 11 mortes).

## Fora do escopo desta sessão (decisão Willian)
Ascension, mecânicas/números dos Maps 2–5, e raridade **Raro+**. A Wall usa `ENEMY.bossHpMult = 220`
(× HP do mob) p/ exigir o burst do Despertar. `SCHEMA_VERSION` 7 → **8** (descarta saves v7).

## Pendências (não tocadas — fora do "valores")
- 🔧 A **tela Awaken** (`src/ui/awaken.js`) ainda mostra o gate ANTIGO (Nitzotzot/Vestiges/Sub-3)
  do redesign 13/jun; o gate REAL é profundidade (Sub 7) + kills + nível + materiais T1
  (`ascension.js: canDespertar`). Pré-existente; alinhar num CP de UI próprio.
- ⏳ Os gates por LV das áreas (`unlockLevels`) e da Convergence foram re-validados no harness,
  mas seguem ajustáveis quando o pacing dos Maps 2–5 for desenhado.
