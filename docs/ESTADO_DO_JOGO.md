# Éclats of Lumière — Estado do Jogo & Fórmulas

> Documento técnico do que está implementado, como o jogo flui e **todas as fórmulas**
> dos sistemas. Fonte: o código real em `src/` (não o GDD em abstrato).
> Última atualização: **2026-06-11**.
>
> Legenda: ✅ implementado e ligado ao motor · ⏳ provisório (valor placeholder, recalibrar)
> · 🔒 não implementado / pós-MVP · `TODO(canon)` aguarda decisão do Willian.

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

**As 5 fases do MVP (Map 1) + todos os sistemas pós-MVP estão implementados.**
Faltam: Echoes (🔒 standby), artes definitivas, e calibração fina (ver §11).

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

- **5 sub-áreas por mapa**, `packSizes = [1,2,4,6,8]` (Sub1..Sub5) em todos.
- ⏳ **Dano dos mobs Maps 2-5 é provisório** (pendência GDD §16.1): extrapolado mantendo a razão dano/HP do Map 1 (calibrado): `dmgLo = hpLo×0.1`, `dmgHi = hpHi×0.01`.

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

### 9.1 Convergence (§6) — moeda: XP da run ✅
```
parede(c)   = 1500 × Π(i=0..c-1) [ 1.5 × 1.06^i ]      // c = nº de convergências
pode_convergir = xp_run ≥ parede(convergences)
pontos_da_run  = bestSubareaRun (sub-área mais funda alcançada na run)
conv_factor    = 1 + 0.15 × convPoints                 // entra em dano e HP
```
Ao convergir: ganha `pontos_da_run`, **reseta a run** (Lumens, Gold Stats, mapa→Sub 1), preserva o resto. **A 1ª Convergence desbloqueia as Passivas.**

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
custo_evolução(nível) = 2 × 1.10^(nível+1) Éclats
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

## 11. O que FALTA / pendências

### 🔒 Não implementado
- **Echoes (pets)** — em standby por decisão do Willian (Art Direction §8e). Sem conceito/arte definidos.
- **Reforja de Gear na Ascension** (desconto com material) — §13 menciona, não implementado.
- **Convergence relics / árvore de relíquias** — a tela do Player mostra `0/15` placeholder.

### ⏳ Provisório (recalibrar / definir cânon)
- **Dano dos mobs Maps 2-5** (§16.1) — extrapolado; falta calibração de sobrevivência.
- **Gear:** rates/caps/custos/afixos de peça (`TODO(canon)`).
- **Passivas:** `groupMult`, `maxLevel` e os **45 efeitos individuais** (§16.3) — hoje agregados.
- **Mémoires:** os **8 efeitos exóticos** ⏳ (contam só via Clarté).
- **Crit:** valores de lck, base e transbordo (§16.6).

### `TODO(canon)` (arte / nomes / posições)
- **Arte genuinamente faltando:** no **Map 4**, do trio só existe **Sundered Titan** (`chained_giant`); **Fissure Stalker** e **Claimed Vanguard** faltam (reuso `chained_giant`). Faltam também retratos **Seeker T2-T5** e molduras T2-T5. *(Confirmado no repo: trios dos Maps 1-3 e 5, **Nihel** = `fallen_angel`, e todos os bosses finais.)*
- **Sem arte própria por design:** Guardiões das Subs 1-4 usam um mob do mapa como placeholder (o GDD não define arte de sub-boss).
- **Nomes das sub-áreas** (placeholder "Sub-área N").
- **Posições** dos pinos no worldmap e dos nós no continente (provisórias).
- **Reconciliar nomes de assets** `VERIFICAR`/underscore → kebab-case do `assets/README.md` (adiado por decisão do Willian).
- **Ícone próprio de Éclats** (hoje usa o de Convergence).
- **Pipeline webp:** o bg high-res do Map 2 entrou como PNG (sem cwebp/PIL no ambiente); gerar webp depois.

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
