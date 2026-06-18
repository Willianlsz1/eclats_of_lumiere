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

## 10. Custo do Gear "mais controlado" — CAP LINEAR por Convergence (18/jun, ref. Gaiadon) ✅ 🔧
Antes o custo dobrava a cada 10 níveis → parede exponencial em ~186 e números estourando (1e17
no cap). A referência do Willian (planilha Gaiadon) mostra **max gear ≈ LINEAR no prestígio**
(max purchasable ÷ Asc ≈ 367, constante). Adotamos o princípio: **o TETO de nível do gear cresce
+capPerConv a cada Convergence**, e é ELE quem controla a progressão (não a parede de custo).

| Parâmetro | Valor | Constante |
|---|---|---|
| Teto antes da 1ª Convergence | **50** | `GEAR.capBase` |
| +níveis de teto por Convergence | **+20** | `GEAR.capPerConv` |
| Teto = | `min(cap_duro_raridade, capBase + capPerConv × convergences)` | `gear.js: levelCapFor` |
| Custo (ramp mais gentil) | dobra a cada **~25 níveis** (era 10) | `GEAR.costRamp = 1.0280` |

**Efeito (harness):** max gear sobe **reto** 50 → 70 → … → **310** (13 convs), o gear FECHA exatamente
no teto a cada ciclo (Lumens são gastos até lá), e o custo do topo cresce suave (7,7K → 10,2M) —
sem 1e17. **Re-ancoragem:** `flatPerLevel.aps` 0.00304→**0.001817** e `critPerLevel` 0.0007→**0.000419**
(razão mantida) → APS **2,50** e crit **30,3%** seguem caindo no fim (gear ~310). A Wall subiu p/
`bossHpMult` 220→**400** (gear maior deixou o player mais forte) — sem Despertar = **32 mortes**.

## Fora do escopo desta sessão (decisão Willian)
Ascension, mecânicas/números dos Maps 2–5, e raridade **Raro+**. A Wall usa `ENEMY.bossHpMult = 220`
(× HP do mob) p/ exigir o burst do Despertar. `SCHEMA_VERSION` 7 → **8** (descarta saves v7).

## Pendências (não tocadas — fora do "valores")
- 🔧 A **tela Awaken** (`src/ui/awaken.js`) ainda mostra o gate ANTIGO (Nitzotzot/Vestiges/Sub-3)
  do redesign 13/jun; o gate REAL é profundidade (Sub 7) + kills + nível + materiais T1
  (`ascension.js: canDespertar`). Pré-existente; alinhar num CP de UI próprio.
- ⏳ Os gates por LV das áreas (`unlockLevels`) e da Convergence foram re-validados no harness,
  mas seguem ajustáveis quando o pacing dos Maps 2–5 for desenhado.
