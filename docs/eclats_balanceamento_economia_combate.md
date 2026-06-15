# Éclats of Lumière — Balanceamento, Economia & Combate

> **Referência única e prática** dos três pilares numéricos do jogo: **combate**,
> **economia** e **balanceamento/progressão**. Fonte da verdade: o **código real** em
> `src/` (não o GDD em abstrato). Todos os números vêm de
> `src/data/constants.js`; as fórmulas, dos módulos em `src/game/`.
>
> Estado refletido: **modelo Map 1 (rescale ×500, 14/jun/2026)** + **redesign CP-3**
> (Gold Stats removidos → Nível dá stat base; Convergence sem reset de mapa; combate
> base single-target com cleave como unlock futuro). `SCHEMA_VERSION = 6`.
>
> Legenda: ✅ implementado e ligado ao motor · ⏳ provisório (placeholder, recalibrar)
> · 🔒 não implementado / pós-MVP · 🌱 número aberto na recalibração geral.

---

## 1. Visão geral do loop

```
        ┌──────────────────────────────────────────────────────────┐
        │  COMBATE EM ONDAS (mapa atual / sub-área)                 │
        │  mata mobs → Lumens · XP · Vestiges · (Éclats) · materiais │
        └─────┬───────────┬──────────────┬──────────────┬───────────┘
   Lumens     │     XP    │   Vestiges   │    Éclats     │  materiais
      ▼       │           ▼              ▼               ▼
   GEAR       │      CONVERGENCE     PASSIVAS         MÉMOIRES        FORJA
   (nível)    │      (gate nível,    (3 árvores,      (15 relíquias,  (sobe raridade
      │       │       +15%/conv)      Vestiges)        Clarté)         do Gear)
      └───────┴── XP da run enche o nível → libera sub-áreas e a Convergence
                  XP da vida → nível de display

   Vencer o boss final do mapa + Vestiges → ASCENSION → ×poder + próximo mapa + Gatekeeper
   Vencer o Guardião da Sub 3 + Nitzotzot + Vestiges → DESPERTAR → tier T1→T5 (×poder)
```

**Resumo:** farmar gera várias moedas → cada moeda alimenta um sistema → cada sistema
soma poder (dano/HP/economia) → você desce mais fundo → vence bosses → ascende → mapa
novo com multiplicadores grandes. São **5 mapas** = jogo base (~30 dias, alvo casual).

### Moedas e persistência

| Moeda | Origem | Gasta em | Reseta? |
|---|---|---|---|
| **Lumens** | kills (∝ HP do mob) | níveis de Gear | ✅ na Convergence |
| **XP** | kills (∝ HP do mob) | nível da run (parede de Convergence) + nível da vida (display) | parede reseta; vida não |
| **Vestiges** | kills (∝ sub-área e mapa) | Passivas, Ascension, Despertar | ❌ nunca |
| **Éclats** | bolsa de Ascension + **drip** (após A1) | Mémoires | ❌ nunca |
| **Materiais** (4 tiers) | drop em kills + chunk de boss | subir raridade do Gear | ❌ nunca |
| **Nitzotzot** | drop nas Sub 3+ | Despertar (Oferenda) | ❌ nunca |

Save em `localStorage` (`eclats_save_v1`, schema **v6**), autosave a cada **10s** +
no `beforeunload`. Números nativos JS, teto do jogo base **`1e100`**. Exibição via
`src/core/format.js` (sufixos K/M/B/T → notação científica curta).

---

## 2. Núcleo de combate — constantes-âncora

`COMBAT` em `constants.js`:

| Constante | Valor | Significado |
|---|---|---|
| `baseDmg` | **3 500** | dano base por hit (antes de nível/gear/multiplicadores) |
| `baseAPS` | **0.90** | ataques por segundo base (intervalo ~1.11 s) |
| `apsCap` | **5** | teto duro de APS (5 kills/s ≈ 18k/h) |
| `agiApsCap` | 3.75 | sub-cap histórico do AGI (legado; AGI removido no CP-3) |
| `apsBonusMax` | 0.45 | ganho máx de APS pelo afixo do Amuleto |
| `apsHalf` | 1.7 | meia-saturação da curva de APS do gear |
| `playerBaseHp` | **25 000** | HP base do jogador |
| `regenPerSec` | 0.01 | regen contínuo = 1% do HP máx por segundo |
| `regenOnKill` | 0.02 | regen on-kill = 2% do HP máx por kill |
| `bossHpMult` | **15** | HP do boss = HP do mob de nível máx ×15 |
| `bossDmgMult` | **3** | dano do boss ×3 |
| `deathRespawnSeconds` | 3 | morte: respawn em 3 s, HP cheio, sem perdas |
| `waveClearDelay` | 0.3 | beat entre ondas (cobre o voo do projétil) |

### Modelo de ondas (`src/game/combat.js`)

- **Single-target:** cada ataque atinge **1 mob** — o primeiro vivo da onda (frente → trás).
  Vale a âncora **máx. 1 kill por ataque** → a taxa de kill nunca passa do APS. **Esta é a
  âncora da economia base.** O excedente de dano se perde.
- **CLEAVE / AoE** é um **unlock** futuro (passiva/mecânica; ADR 0002 revisado). Hoje
  `cleaveTargets()` retorna sempre `1`. Quando ligado, retorna >1 e o ataque excede o teto.
- **Mob morto não respawna:** fica apagado na cena e para de causar dano. A **próxima onda
  só surge quando TODA a onda atual é limpa** (após o beat `waveClearDelay`).
- **Dano ao jogador** = Σ do dano dos mobs **vivos** da onda, por segundo (ver mitigação, §3).
- **Boss:** só na **última sub-área** do mapa. Ao atingir `bossKillThreshold` kills na
  sub-área, a próxima onda traz o boss no lugar do primeiro mob. Derrotá-lo abre o gate.
- **Progressão entre sub-áreas = GATE POR NÍVEL** (sem Guardião intermediário): a sub-área
  *n* libera quando `runLevel ≥ subareaUnlockLevel(map, n)` (= início da faixa de level dela).
- **Morte:** respawna na **mesma** área (não recua), HP cheio em 3 s; zera `killsInSubarea`
  (o boss some, o muro de kills tem de ser refeito).

---

## 3. Fórmulas de poder (dano, HP, APS, crit) — `src/game/stats.js`

Tudo parte de uma **base FLAT** (nível + flat do gear) multiplicada pelos fatores dos
sistemas de prestige. Sistemas ainda não ligados retornam `1`.

### Dano por hit
```
base_dano     = baseDmg(3500) + runLevel × dmgPerLevel(5000) + gearDamageFlat
dano_por_hit  = base_dano × convMult × gearDamageMult × passiveDmgMult
                          × memoireDmgMult × ascMult × despertarMult
```

### HP máximo
```
base_hp   = playerBaseHp(25000) + runLevel × hpPerLevel(2500) + gearHpFlat
hp_max    = base_hp × convMult × gearHpMult × passiveHpMult
                    × memoireHpMult × ascMult × despertarMult
```
> O HP recebe os **mesmos** fatores de prestige do dano (inclusive a Clarté das Mémoires).
> Sem isto, o HP ficaria ~70 décadas atrás do dano e o late seria injogável.

### APS (velocidade de ataque)
```
apsBonus  = apsBonusMax(0.45) × p / (p + apsHalf(1.7))   ; p = gearApsMult − 1 (afixo Amuleto)
APS_atual = min(apsCap(5),  (baseAPS(0.90) + apsBonus) × passiveApsMult)
```
- Curva **front-loaded e saturante**: o afixo de APS satura em ~+0.45 (APS ~1.35).
- `passiveApsMult` = alavanca **Fracture Pulse** (`1 + nível × 0.46`).

### Crit (⏳ provisório — GDD §16.6)
```
crit_chance_raw = baseChance(0) + gearCritAdd + passiveCritAdd      ; sem LCK (removido)
crit_chance     = min(1, crit_chance_raw)
overflow        = max(0, crit_chance_raw − 1)                        ; acima de 100% transborda
crit_damage     = (baseDamageMult(2) + overflow×overflowFactor(1) + gearCritDmgAdd) × memoireCritDmgMult
```
- Fontes de crit chance: afixo **Grasp** do gear (`critPerLevel = 3e-4`/nível) +
  passiva **Luminal Edge** (`+0.04`/nível).
- O crit rola **uma vez por ataque** (vale pro golpe inteiro).

### DPS exibido (valor esperado)
```
dps = dano_por_hit × APS_atual × (1 + crit_chance × (crit_damage − 1))
```

### Defesa / mitigação (razão/armadura)
```
veilFactor    = min(veilCap(0.18),  (gearDefesaMult − 1) × veilScale(0.015) × memoireSurvivalMult)
defesa        = hp_max × veilFactor
dano_recebido = Σdano² / (defesa + Σdano)        ; nunca 100%, auto-escala, sem teto
```
- Sem Veil (early, `veilFactor = 0`) → `defesa = 0` → `dano_recebido = Σdano` (comportamento cru).
- Veil maximizado → `veilFactor 0.18` → `defesa ≈ 4× packDps` ≈ **80% de mitigação** (teto por era).
- **Defesa de inimigos** = mesma fórmula virada no hit (`hit = raw² / (def_inim + raw)`).
  Early = 0; **Void Piercing** penetra e **Weakened Void** reduz (no-op até `enemyDefBase > 0`).

---

## 4. Nível do Seeker (motor de stat base) — substitui os Gold Stats

`LEVEL` em `constants.js`. O nível vem do **XP da run** (`xpRun`, reseta na Convergence)
e dá **stat FLAT** (não multiplicador):

```
runLevel    = max(1, floor((xpRun / curveDiv(11000)) ^ curveExp(0.4)))
xp_p/_nível = curveDiv × L ^ (1/curveExp) = 11000 × L^2.5     (inverso da curva)
```

| Por nível | Valor | Onde entra |
|---|---|---|
| `dmgPerLevel` | **+5 000** dano flat | base de dano |
| `hpPerLevel` | **+2 500** HP flat | base de HP |
| `goldPerLevel` | **+1 500** Lumens base/kill | economia de Lumens |

- O **nível da run** (`xpRun`) também abre as sub-áreas (gate por nível) e enche a parede
  da Convergence. Reseta na Convergence.
- O **nível da vida** (`xpTotal`, via `heroLevel`) é só display do card do Seeker; nunca reseta.
- Calibrado para ~8 h de Map 1 (sim `tools/sim/map1_pace.mjs`).

---

## 5. Economia por kill — `src/game/economy.js`

`ECONOMY`: `goldRatio = 0.10` · `xpRatio = 0.08` · `lumensFloor = 30 000`.

```
lumens_por_kill = (mob_hpMax × 0.10  +  lumensFloor(30000)  +  runLevel × goldPerLevel(1500))
                  × convMult × bossMult(×5) × gearLumensMult × passiveEcoMult × memoireLumensMult

xp_por_kill     = mob_hpMax × 0.08 × convMult × gearXpMult × passiveEcoMult × memoireXpMult
                  → soma em xpTotal (vida/display) E xpRun (parede/nível)

vestiges_por_kill = ceil(subárea × 0.5) × 3^(mapa−1) × bossMult(×10) × memoireVestigeMult
```

- `mob_hpMax` = HP **máximo** do mob morto → renda ancorada ao mob mais fundo que você mata
  (não à velocidade).
- **Piso de Lumens (`lumensFloor`)**: pesa cedo (mob vale pouco → 1º nível de gear comprável
  em ~1 min) e some tarde (mob vale milhares). Acelera o early.
- **Boss:** Lumens ×5 (`BOSS_LUMEN_MULT`), Vestiges ×10 (`VESTIGES.bossMult`). O XP do boss
  escala sozinho pelo HP ×15.
- **Vestiges base no Map 1** (Subs 1-9, `ceil(sub×0.5)`): `1,1,2,2,3,3,4,4,5`. A cada mapa, ×3.

### Materiais (`CRAFT`) — moeda da Forja
```
drop comum    = dropChance(1%)  do tier do mapa atual           (mapMaterialTier: Map1→T1 … Map5→T4)
drop superior = nextTierChance(0.1%) do tier seguinte           (só se tier < T4)
boss          = bossChunk(30) garantido do tier do mapa
yield ×       = rewardMult da dificuldade × #13 du Vide × #5 du Façonnage
                × afixo Materiais do gear (amortecido log) × Vestige Pull (amortecido log)
```
- `rarityUpMaterial = 40` materiais do tier para subir 1 peça de raridade.
- `refinoRatio = 12` → refino 12:1, só pra cima (12 de Tn → 1 de Tn+1).

### Nitzotzot (`NITZOTZ`) — Oferenda do Despertar
```
drop  = dropChance(2%) por mob comum, SÓ nas Sub-áreas 3+
boss  = bossChunk(5) garantido
```

---

## 6. Malha geométrica — Mapas, Levels, HP e dano

`MAPS` em `constants.js`. Em `src/game/enemies.js`: levels e HP/dano interpolados
geometricamente no **log do level**.

| # | Mapa | Levels | HP dos mobs | Dano dos mobs | Sub-áreas | Threshold boss |
|---|---|---|---|---|---|---|
| 1 | The Dreaming Wood | 1 – 1 000 | 5e3 – 5e8 | 1e2 – 1e7 | **9** | 100 |
| 2 | Cavernes Luminis | 1e3 – 1e5 | 1e6 – 1e14 | 2e4 – 2e12 | 6 | 200 |
| 3 | The Ashen Ruins | 1e5 – 1e7 | 1e14 – 1e24 | 2e12 – 2e22 | 7 | 350 |
| 4 | The Fractured Peaks | 1e7 – 1e8 | 1e24 – 1e35 | 2e22 – 2e33 | 8 | 500 |
| 5 | Nil Aeternum | 1e8 – 1e9 | 1e35 – 1e45 | 2e33 – 2e43 | 8 | 800 |

> O dano dos mobs ≈ **2% do HP** (`dmgLo = hpLo×0.02`, `dmgHi = hpHi×0.02`) — razão
> aproximadamente constante. A Defesa decide vida/morte na entrada de cada mapa.

**Tamanhos de pack** (`PACK`, índice = sub-área − 1): `[2, 3, 4, 5, 6, 8, 10, 12, 14]`.
Cada mapa usa as primeiras N entradas. **+6 mobs** (`FATE.a4MobBonus`) quando `ascensions ≥ 4`,
**+0.5/nível** pela passiva Void Awareness (rumo ao teto prático ~24).

### Fórmulas da malha
```
r (razão entre sub-áreas) = (lvl_hi / lvl_lo) ^ (1 / subareaCount)
faixa_da_sub(s)           = [ lvl_lo × r^(s-1) ,  lvl_lo × r^s ]
level de um mob           = sorteado uniforme no log da faixa da sub-área
t                         = (log L − log lvl_lo) / (log lvl_hi − log lvl_lo)
hp(L)                     = hp_lo  × (hp_hi / hp_lo)^t
dmg(L)                    = dmg_lo × (dmg_hi / dmg_lo)^t
boss: level = máx da sub-área,  HP = hp(level) × 15,  dano = dmg(level) × 3
```

---

## 7. Sistemas de progressão (multiplicadores)

### 7.1 Convergence — `src/game/convergence.js` · moeda: nível da run

```
convMult       = 1 + bonusPerConv(0.15) × convergences          (ADITIVO; entra em dano/HP/XP/Lumens)
gate de nível  = round(gateLevelBase(40) × gateLevelGrowth(1.25) ^ convergences)
pode convergir = runLevel ≥ gate
```
- Acelerador (~×2 ao fim do Map 1, ~12 convergências), **não** motor.
- Ao convergir: **reseta `xpRun` (nível da run) e os Lumens**. O **Gear é mantido**
  (sem strand). **Não** reseta: mapa/posição, Vestiges, Éclats, materiais, gear (nível+raridade).
- A **1ª Convergence** desbloqueia as Passivas.

### 7.2 Gear — `src/game/gear.js` · moeda: Lumens (nível) + materiais (raridade)

**6 peças fixas**, cada uma com **nível** (Lumens) e **raridade** (materiais). Cada peça tem
1 afixo **PRIMÁRIO** inerente + **SECUNDÁRIOS** que a raridade destrava em ordem (determinístico).

| Peça | Slot | Primário | Secundários (ordem de unlock) |
|---|---|---|---|
| The Waning Edge | Arma | **dmg** | critDmg · bossDmg · erosão |
| The Silent Vigil | Elmo | **hp** | defesa · regen |
| Veil of Cinders | Manto | **defesa** | hp · regen · erosão |
| Grasp of the Unnamed | Manoplas | **crit** | critDmg · aps · dmg |
| The Last Resonance | Amuleto | **aps** | crit · regen · dmg |
| Band of Dusk | Anel | **lumens** | xp · materiais |

**Raridades** (`GEAR_RARITIES`, índice 0→4): Faded · Kindled · Luminous · Radiant · Converged.

| Por raridade | 0 Faded | 1 Kindled | 2 Luminous | 3 Radiant | 4 Converged |
|---|---|---|---|---|---|
| `rarityMult` | 1 | 1.5 | 2.25 | 3.5 | 5 |
| `levelCap` | 750 | 2000 | 3000 | 4000 | 5000 |
| `costMult` (nível) | 1 | 10 | 100 | 1000 | 10000 |

**Modelo de valor (Map 1, 2 afixos por peça — flat + %):**
```
afixo flat (primário)  = nível × flatPerLevel[tipo] × rarityMult        (secundário × secondaryExp 0.30)
   flatPerLevel: dmg 30000 · hp 12500 · defesa 7500 · regen 0.0005      (demais = 0)
afixo %    (bonus)     = 1 + nível × bonusRate(0.02) × rarityMult       (multiplicativo)
afixo crit (Grasp)     = nível × critPerLevel(3e-4) × rarityMult
afixo critDmg          = nível × critDmgPerLevel(1e-3) × rarityMult
afixo FARM (lum/xp/mat)= 1 + nível × affixPctRate(0.01) × rarityMult     (LINEAR; nunca motor ×)
   materiais → drop amortecido por log: 1 + 0.5 × log10(bruto)
```
> `multRate = 0`: o "×Multiplier" do modelo Gaiadon foi **removido** (decisão 14/jun).

**Custos e gates:**
```
custo de nível      = levelCostBase(420000) × (nível+1) × costMult[raridade]      (LINEAR)
subir raridade      = MATERIAIS do tier (rarityUpMaterial=40) + LOCKSTEP
   lockstep: uma peça só sobe pra R+1 se TODAS já estão ≥ R (piso do set)
cap topo (Converged): levelCap[4] + ascensions × capPerAsc(0)                       (capPerAsc=0 hoje)
```

### 7.3 Passivas — `src/game/passives.js` · moeda: Vestiges

3 árvores × 15 nós (3 grupos de 5). Desbloqueiam na **1ª Convergence**.

```
desbloqueio (0→1) = unlockLadder[posição_no_grupo] × groupMult[grupo]
   unlockLadder = [100, 500, 2500, 12500, 62500]    (×5 por posição)
   groupMult    = [1, 10, 100]
evolução (L→L+1)  = desbloqueio × evoFactor(0.3) × evoRamp(1.30)^(L-1)
maxLevel = 12 ;  gate: maximizar os 5 do grupo anterior libera o próximo
```

**Efeitos (esquema Camada 5):**
```
mult primário da árvore = (1 + Σ %aditivo) × Π(motores ×engineMult(1.52)^nível)
   groupAddPct por grupo = [0.05, 0.10, 0.20]   (% aditivo/nível dos nós comuns)
   3 motores por árvore (grupo 3) = ×1.52/nível
   passiveDmgMult ← Éclat · passiveHpMult ← Fracture · passiveEcoMult ← Vestige
```

**Alavancas funcionais** (fora do mult da árvore; efeito especial):

| Alavanca | Árvore | Efeito por nível |
|---|---|---|
| Luminal Edge | Éclat | +0.04 crit chance |
| Void Piercing | Éclat | penetra 4% da defesa de inimigos |
| Fracture Pulse | Fracture | fator de APS (`+0.46`) |
| Void Awareness | Fracture | +0.5 mob na onda |
| Weakened Void | Fracture | reduz 4% da defesa de inimigos |
| Vestige Pull | Vestige | ×drop de material (amortecido log) |

### 7.4 Mémoires — `src/game/memoires.js` · moeda: Éclats · **motor principal de poder**

15 relíquias em 5 eras (3 por era). Desbloqueiam por **Ascension da era** (`ascensions ≥ era`).

```
CLARTÉ (motor global)  = MEMOIRE_CLARTE_BASE(1.07) ^ (Σ todos os níveis × (1 + amp#14))
                         #14 amplia o expoente — STUB desarmado (MEMOIRE_CLARTE_EXP_PER = 0)
custo de desbloqueio   = MEMOIRE_UNLOCK[era-1] = [10, 30, 90, 270, 810] Éclats
custo de evolução(L)   = MEMOIRE_EVO_BASE(2) × MEMOIRE_EVO_RAMP(3.0)^(L+1)
```
- A **Clarté entra no dano E no HP** (~70 décadas de orçamento; ~159 níveis/Mémoire).
- `du Choix` (#15) amplia **+5%/nível** todos os efeitos individuais.
- O dano individual (#1 + #10) é **capado** em `MEMOIRE_INDIV_DMG_CAP = 3×` sobre a Clarté
  (para o andar somar ~70 déc no total, não 70 + extras).

| # | Mémoire | Era | Tipo / efeito por nível | wired |
|---|---|---|---|---|
| 1 | du Premier Matin | 1 | dmg +10% (global) | ✅ |
| 2 | des Rires | 1 | lumens +10% | ✅ |
| 3 | de la Marche | 1 | xp +8% | ✅ |
| 4 | de la Forme | 2 | critDmg +8% | ✅ |
| 5 | du Façonnage | 2 | materiais +5% | ✅ |
| 6 | des Profondeurs | 2 | offline +10% | ✅ |
| 7 | de la Chute | 3 | bossDmg +12% | ✅ |
| 8 | des Cendres | 3 | vestiges +10% | ✅ |
| 9 | du Dernier Chant | 3 | +1 ponto Convergence/run a cada 5 níveis | ✅ |
| 10 | de la Blessure | 4 | ×1.10 dano (multiplicativo) | ✅ |
| 11 | de la Résistance | 4 | survival +12% (HP, regen, defesa) | ✅ |
| 12 | du Temps Brisé | 4 | +15% a TODOS os Éclats (drip + bolsas) | ✅ |
| 13 | du Vide | 5 | +10% recompensa nas dificuldades | ✅ |
| 14 | de la Lumière Entière | 5 | amplifica o expoente da Clarté (stub) | ✅ |
| 15 | du Choix | 5 | +5% a todos os efeitos de Mémoires | ✅ |

### 7.5 Ascension — `src/game/ascension.js` · moeda: Vestiges · **motor canônico**

Marco por mapa: derrotar o **boss final** + pagar Vestiges → multiplicador, bolsa de Éclats,
rank, **avança para o mapa seguinte**.

| A | Requisito | Custo (Vestiges) | `mult` | Éclats (bolsa) | Rank (Tier) |
|---|---|---|---|---|---|
| A1 | Boss Map 1 | 500 000 | **×2** | 100 + **libera o drip** | Illuminate (II) |
| A2 | Boss Map 2 | 1 900 000 | ×2 | 300 | Éclairé (III) |
| A3 | Boss Map 3 | 4 000 000 | ×2 | 900 | L'Éveillé (IV) |
| A4 | Boss Map 4 | 8 000 000 | ×2 | 2 700 | Lumière (V) |
| A5 | Derrotar Nihel | — | — | fim do jogo base | — |

```
ascMult = Π (mult das Ascensions concluídas)     ; aplica a DANO e HP (×16 total A1-A4)
```

**Drip de Éclats** (`ECLATS_DRIP`, liberado pela A1):
```
éclats_por_segundo = (coef(0.1) × HP_frontier ^ exp(0.9)) / 3600
   HP_frontier = HP do boss da sub-área mais funda desbloqueada do mapa atual
   × rewardMult da dificuldade × #13 du Vide × #12 du Temps Brisé
```

### 7.6 Despertar / Tier — `src/game/ascension.js` · desacoplado das Ascensions

Tier **T1→T5** (`SEEKER_RANKS`); `despertarMult = DESPERTAR.mult(5) ^ despertares` (dano E HP).
Gate em 3 camadas (**ato do jogador** na tela):

```
Prova    = vencer o Guardião da Sub 3 do mapa do tier alvo (bossDefeated[2] = true)
Oferenda = Nitzotzot ; Tributo = Vestiges   (DESPERTAR_REQ por tier alvo)
```

| Tier alvo | Nitzotzot | Vestiges |
|---|---|---|
| T2 Illuminate | 20 | 75 000 |
| T3 Éclairé | 40 | 285 000 |
| T4 L'Éveillé | 80 | 600 000 |
| T5 Lumière | 160 | 1 200 000 |

---

## 8. Dificuldades — `src/game/difficulty.js`

`DIFFICULTIES`: re-rodar mapas com HP/dano ×`hpMult` e recompensa ×`rewardMult`. O sistema
abre na **A2** (`minAscension`); o gate dos modos é por **poder** (você morre se fraco) +
bloqueio de **overflow** (HP do boss mais fundo × `hpMult` ≤ `1e100`).

| Modo | `hpMult` | `rewardMult` | `minAscension` | break_infinity |
|---|---|---|---|---|
| Normal | ×1 | ×1 | 0 | não |
| Difícil | ×1e5 | ×3 | 2 | não |
| Nightmare | ×1e15 | ×10 | 2 | **sim** (visível, sempre bloqueado) |
| Tormento | ×1e30 | ×30 | 2 | **sim** (visível, sempre bloqueado) |

Nightmare/Tormento são território **break_infinity** (>1e100) → 🔒 bloqueados por design até a
migração. Map 5 = Normal-only por enquanto (já encosta em 1e100).

---

## 9. Offline — `src/game/offline.js`

Ao reabrir, simula o tempo ausente rodando o **mesmo `combatTick`** (tick fixo 100 ms) +
automações (`automationTick`). Garante que o jogador **nunca abre morto** (completa o respawn
pendente). Teto `OFFLINE.maxSeconds` = **30 dias** (guarda de engenharia, não balanceamento);
mínimo **60 s** para mostrar o resumo. `#6 des Profondeurs` amplia o tempo efetivo (capado).

---

## 10. Orçamento de poder & pacing

> Fonte: simuladores em `tools/sim/` (resumidos em `docs/ESTADO_DO_JOGO.md` §10.5).

- **Dano cresce ~95–100 décadas** ao longo do jogo base. Split aproximado:
  **Mémoires ~70 · Gear ~10 · Passivas ~8 · Convergence ~4 · Ascension ~3.8 · Despertar ~2.8 · Nível ~1.**
  O HP segue a mesma curva (mesmos fatores).
- **Duração (5 mapas):** intenso ~14 d · **casual (alvo) ~15 d** · leve ~41 d. O jogador-padrão
  do gênero = nosso casual. "Alguns meses" viria de **mais conteúdo**, não de inflar custos.
- **Cap físico de combate:** máx. 1 kill/ataque (single-target) → kill rate ≤ APS. É a âncora
  que mantém a economia previsível. O cleave/AoE (unlock futuro) é o que excede esse teto.

---

## 11. ⚠️ Redesign em andamento (recalibração geral pendente)

A direção mudou na sessão de 14/jun (ver `docs/eclats_redesign_2026-06-14.md`, ADR 0001/0002,
`CONTEXT.md`). **Os números deste doc serão refeitos** na recalibração geral. Principais mudanças
de direção (design fechado, números 🌱):

- **Combate base = single-target** (a regra "1 kill/ataque" voltou a valer); **cleave é unlock**.
- **Gold Stats removidos** → o **Nível** dá o stat base (já refletido aqui).
- **Convergence** redesenhada: gate por nível, +15% permanente, **sem reset/backtrack de mapa**.
- **5 mapas = jogo base (~30 dias)**; Map 1 travado em **9 sub-áreas**.
- Novos sistemas (🌱 a implementar/calibrar): **Hollows** (dungeons por mapa, dropam materiais +
  Reliquat), **Reliquats** (2ª aba do Gear), **4 habilidades ativas** (1 por Despertar),
  **Gatekeepers** redefinidos (A1 já = "Convergence não reseta níveis do Gear").
- Mémoires viram **knobs globais/meta** (modelo Artifacts do TT2); as 45 passivas reconciliadas.

---

## 12. Tabela-resumo das constantes (`src/data/constants.js`)

| Grupo | Constantes-chave |
|---|---|
| **COMBAT** | baseDmg 3500 · baseAPS 0.90 · apsCap 5 · playerBaseHp 25000 · regen 1%/s · onKill 2% · bossHp ×15 · bossDmg ×3 · respawn 3s |
| **ECONOMY** | goldRatio 0.10 · xpRatio 0.08 · lumensFloor 30000 |
| **LEVEL** | curveDiv 11000 · curveExp 0.4 · dmg/nv 5000 · hp/nv 2500 · gold/nv 1500 |
| **CONVERGENCE** | bonusPerConv 0.15 · gate base 40 · growth 1.25 |
| **CRIT** | baseChance 0 · baseDmgMult ×2 · overflow 1:1 |
| **DEFENSE** | veilScale 0.015 · veilCap 0.18 · enemyDefBase 0 |
| **GEAR** | rarityMult [1,1.5,2.25,3.5,5] · levelCap [750,2000,3000,4000,5000] · costMult [1,10,100,1e3,1e4] · levelCostBase 420000 · bonusRate 0.02 · secondaryExp 0.30 |
| **CRAFT** | drop 1% · nextTier 0.1% · bossChunk 30 · rarityUp 40 · refino 12:1 |
| **NITZOTZ** | drop 2% (Sub 3+) · bossChunk 5 |
| **VESTIGES** | bossMult ×10 |
| **PASSIVES** | unlockLadder [100,500,2500,12500,62500] · groupMult [1,10,100] · evo 0.3×1.30^n · maxLevel 12 · engineMult 1.52 |
| **MÉMOIRES** | Clarté 1.07 · unlock [10,30,90,270,810] · evo 2×3.0^n · indivCap ×3 |
| **ASCENSIONS** | custo 500k/1.9M/4M/8M · mult ×2 cada · éclats 100/300/900/2700 |
| **DESPERTAR** | mult ×5/tier · reqs (20/40/80/160 Nitzotz; 75k/285k/600k/1.2M Vestiges) |
| **DIFFICULTIES** | Normal/Difícil/Nightmare/Tormento · hpMult 1/1e5/1e15/1e30 · reward 1/3/10/30 |
| **OFFLINE** | maxSeconds 30 d · minReport 60 s |
| **Núcleo** | tick 100 ms · autosave 10 s · schema v6 · NUMBER_CAP 1e100 |

---

*Documento gerado a partir do código em `src/` (06/2026). Para o design narrativo e a direção
futura, ver `docs/eclats_gdd_final_v2.md`, `docs/eclats_redesign_2026-06-14.md` e
`docs/ESTADO_DO_JOGO.md`.*
