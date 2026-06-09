# BALANCE MODEL — Éclats of Lumière
> Fonte da verdade para decisões de balanceamento. Atualizado incrementalmente.
> DESIGN.md continua sendo a fonte da verdade para lore e sistemas.
> Este arquivo registra os números e fórmulas acordados em sessão de design.

---

## 1. Estrutura de Mapas e Subáreas

### Levels por subárea
Cada subárea tem um range de levels. Os ranges crescem por mapa.

| Mapa | Sub 1 | Sub 2 | Sub 3 | Sub 4 | Sub 5 |
|------|-------|-------|-------|-------|-------|
| 1 | 1–50 | 51–100 | 101–150 | 151–200 | 201–250 |
| 2 | 251–300 | 301–350 | 351–400 | 401–450 | 451–500 |
| 3 | 501–600 | 601–700 | 701–800 | 801–900 | 901–1000 |
| 4 | 1001–1200 | 1201–1400 | 1401–1600 | 1601–1800 | 1801–2000 |
| 5 | 2001–2400 | 2401–2800 | 2801–3200 | 3201–3600 | 3601–4000 |

- Cada inimigo sorteado recebe um **level aleatório** dentro do range da subárea
- Inimigos de level mais alto dentro da mesma sub = mais difíceis (mais HP, mais dano)

---

## 2. HP dos Inimigos

### Fórmula
```
hp(level) = baseHp × 1.04^(level - 1)
```

- `baseHp = 10` — HP do inimigo de level 1 ✅ confirmado
- Crescimento de **4% por level** (`ramp = 1.04`)
- Level 50 → ~7× o HP do level 1
- Level 250 → ~16.000× o HP do level 1

### Range total (base game)
| Ponto | Level | HP (baseHp = 10) |
|-------|-------|-----------------|
| Map 1, Sub 1 mínimo | 1 | 10 |
| Map 1, Sub 5 máximo | 250 | ~160.000 |
| Map 3, Sub 5 máximo | 1.000 | ~9,6 × 10¹² |
| Map 5, Sub 5 máximo | 4.000 | **~10⁶⁸** |

- Range confirmado: **10 → ~1e68** (base game, idle puro)
- JS float padrão suporta até 1e308 — sem biblioteca especial necessária
- **Tiers futuros** estendem além de 1e68 (conteúdo adicional)
- Implicação crítica: convergence + ascension + gear precisam entregar **~10⁶⁸** de crescimento de dano total ao longo de toda a progressão

### Boss
- Level fixo = **level máximo da subárea** (ex: Sub 1 Map 1 → boss é Lv 50)
- `HP_boss = hp(levelMax) × bossHpMult` (bossHpMult a definir)
- Substitui 1 mob do campo quando spawna (mantém o cap de densidade)

---

## 3. Modelo de Spawn — Área de Densidade

Inspirado em Gaiadon Eternal Quest (patch 0.9.44+):

- **Múltiplos mobs ativos simultaneamente** na área
- Quando um mob morre, outro spawna imediatamente para manter a densidade
- O boss entra no campo ativo após o kill threshold — **não limpa os outros mobs**
- O player ataca **um mob por vez** (projétil A→B)
- **Todos os mobs ativos atacam o player ao mesmo tempo**

### Pack Size (mobs simultâneos ativos por subárea)

| | Sub 1 | Sub 2 | Sub 3 | Sub 4 | Sub 5 |
|-|-------|-------|-------|-------|-------|
| **Map 1** | 1 | 2 | 4 | 6 | 8 |
| **Map 2** | 5 | 8 | 11 | 14 | 18 |
| **Map 3** | 10 | 14 | 17 | 21 | 24 |
| **Map 4** | 14 | 18 | 22 | 26 | 29 |
| **Map 5** | 20 | 26 | 31 | 36 | 40 |

> Estes valores são referência para escalas pequenas — servirão de base para escalas maiores.

---

## 4. Kill Threshold para Boss Spawnar

### Map 1 — Apenas Sub 5 tem boss
| Subárea | Threshold |
|---------|-----------|
| Sub 1–4 | Sem boss (mapa tutorial) |
| Sub 5 | **100 kills** |

### Map 2 — Todas as subareas têm boss
| Subárea | Threshold |
|---------|-----------|
| Sub 1 | 50 |
| Sub 2 | 80 |
| Sub 3 | 120 |
| Sub 4 | 160 |
| Sub 5 | 200 |

### Maps 3–5 — Referência base (calibrar com loop completo)
| | Sub 1 | Sub 2 | Sub 3 | Sub 4 | Sub 5 |
|-|-------|-------|-------|-------|-------|
| **Map 3** | 100 | 150 | 200 | 250 | 350 |
| **Map 4** | 150 | 220 | 300 | 400 | 500 |
| **Map 5** | 200 | 300 | 450 | 600 | 800 |

### Simulação de referência (tempo estimado até o boss)
| Kill rate | Map 2 Sub 1 (50 kills) | Map 5 Sub 5 (800 kills) |
|-----------|----------------------|------------------------|
| 6 kills/min (início da área) | ~8 min | ~133 min |
| 12 kills/min (player investido) | ~4 min | ~67 min |
| 20 kills/min (player forte) | ~2.5 min | ~40 min |

### Progressão de área
O player **escolhe** quando avançar após matar o boss. Ficar na subárea = mobs ficam mais fáceis conforme DPS cresce. Avançar = área mais difícil, mais densa, boss mais forte.

---

## 5. Combat — Ataque e DPS

### Fórmula de DPS
```
DPS_real = dano_por_hit × ataques_por_segundo
```

Dois eixos independentes e multiplicativos:
- **Damage** — dano por projétil (principal motor de crescimento)
- **Atk Speed** — frequência de disparo (complemento, máx 3.1× de contribuição)

### Attack Speed
Modelo de intervalo em segundos (inspirado em Melvor Idle):

| Fase | Intervalo | APS |
|------|-----------|-----|
| Início | 2.5s | 0.40 |
| Early | 2.0s | 0.50 |
| Mid | 1.5s | 0.67 |
| Late | 1.1s | 0.91 |
| **Cap** | **0.8s** | **1.25** |

- Razão início→cap: **3.1×**
- Multiplicador de DPS máximo pelo speed: **3.1×**
- Referência da indústria: Melvor Idle usa razão de ~9.6×; nosso 3.1× é conservador e prioriza legibilidade visual

### Target de kill time (early game)
- 1 mob na área: **3–4 segundos** por kill no início
- N mobs simultâneos: mesmo tempo por mob individual, mas **pressão de dano recebido cresce com N**

---

## 6. Dano do Player — Valores Âncora

```
baseHp     = 10       // HP do mob level 1
baseDmg    = 7        // dano por hit no início (baseHp / 1.4 → kill time 3.5s)
atk_speed  = 0.4 APS  // intervalo 2.5s
DPS_inicial = 2.8     // baseDmg × atk_speed
```

### Fórmula completa de dano
```
dano_por_hit = baseDmg
             × str_total           // (1 + level × 0.08) × milestone_mults
             × level_bonus         // hero level — a definir
             × gear_bonus          // weapon — persistente
             × convergence_mult    // permanente
             × ascension_mult      // permanente
```

### Sistema de milestones (Gold Stat str)
- Entre milestones: +8% dano por nível (mantém engajamento no grind)
- Milestone 10: **×2.0** — spike principal do early game
- Milestone 25: **×2.5** — permite avançar subareas
- Milestone 50: **×3.0** — endgame do mapa atual
- Milestone 100: **×4.0**
- Multiplicador cumulativo até milestone 50: ×2 × ×2.5 × ×3 = **×15** + bônus aditivos

### Simulação early game (Map 1)
| Situação | HP mob | DPS player | Kill time |
|----------|--------|------------|-----------|
| Lv 1, sem upgrades | 10 | 2.8 | 3.6s ✅ |
| Lv 50, sem upgrades | 68 | 2.8 | 24s ❌ |
| Lv 50, str milestone 10 | 68 | 9.6 | 7.1s ✅ |
| Lv 50, str milestone 25 | 68 | 40.9 | 1.7s 🔥 Sub 1 trivial |
| Lv 150, str milestone 25 | 3.410 | 40.9 | 83s ❌ → requer convergence |

## 7. HP do Player e Sobrevivência

```
playerBaseHp = 50     // HP sem upgrades (hero level 1, vit = 0)
dmgRatio     = 0.10   // mob inflige 10% do seu HP por segundo
regenRate    = 0.01   // regen passivo = 1% do HP máximo por segundo
```

### Fórmula de dano recebido
```
incoming_dps = mob_hp × dmgRatio × N_mobs_ativos
```

### Fórmula de HP máximo
```
hp_max = playerBaseHp × vit_total × level_bonus
```

### Sistema de milestones (Gold Stat vit) — mesmo padrão do str
- Entre milestones: +6% HP por nível
- Milestone 10: **×2.0**
- Milestone 25: **×2.5**
- Milestone 50: **×3.0**
- Milestone 100: **×4.0**

### Simulação de sobrevivência (sem regen)
| Situação | HP mob | Mobs | DPS recebido | Sobrevive |
|----------|--------|------|-------------|-----------|
| Sub 1, Lv 1, 1 mob | 10 | 1 | 1.0 | ~50s ✅ tutorial |
| Sub 1, Lv 50, 1 mob | 68 | 1 | 6.8 | 7.4s ⚠️ precisa DPS alto |
| Sub 2, Lv 75, 2 mobs | 107 | 2 | 21.4 | **2.3s** ❌ morre sem vit |
| Sub 3, Lv 125, 4 mobs | 267 | 4 | 106.8 | **0.5s** ❌ quase instantâneo |
| Sub 5, Lv 225, 8 mobs | 666 | 8 | 533 | **0.09s** 💀 |

### HP Regen — três camadas de sobrevivência

| Camada | Fonte | Reseta? | Papel |
|--------|-------|---------|-------|
| **HP máximo** | Base + vit + hero level | vit reseta | Buffer contra burst |
| **Regen passivo** | 1% HP máximo/seg | Deriva do HP | Sustain entre packs |
| **Regen por kill** | Afixo Armor (gear) | ❌ persistente | Recompensa DPS alto |

- Regen passivo **não salva** sem vit (diferença de ~0.1s), mas **amplifica** vit
- Dilema de investimento intencional: Lumens em str vs vit → decisão real

---

## 8. Gold Stats — Sistema Completo

Todos os 6 stats resetam na convergence. Mesmo padrão de custo e milestones.

### Fórmula de custo (universal)
```
custo(n) = 10 × 1.15^n              // levels 1–999  (exponencial pura)
custo(n) × (n / 1000)^2             // levels 1000+  (fase 2: cresce quadraticamente)
custo(n) × 1.001^(n - 10000)        // levels 10000+ (fase 3: tiers futuros)
```
- α = 1.15: entre Cookie Clicker (1.15) e Synergism (1.25)
- Paridade com renda: mob HP escala em 1.04^level → Lumens por kill escala igual → tempo por compra permanece constante em qualquer fase

### Tabela de stats

| Stat | Efeito | Bônus/nível | M10 | M25 | M50 | M100 |
|------|--------|------------|-----|-----|-----|------|
| **str** | Dano por hit | +8% | ×2.0 | ×2.5 | ×3.0 | ×4.0 |
| **vit** | HP máximo | +6% | ×2.0 | ×2.5 | ×3.0 | ×4.0 |
| **agi** | Atk speed mult | +4% | ×2.0 | ×2.5 | ×3.0 | ×4.0 |
| **lck** | Crit rate | +1.5% | ×1.5 | ×2.0 | ×2.5 | ×3.0 |
| **frt** | Lumens mult | +5% | ×2.0 | ×2.5 | ×3.0 | ×4.0 |
| **wis** | XP mult | +5% | ×2.0 | ×2.5 | ×3.0 | ×4.0 |

> lck tem milestones menores — crit 100% com mult alto domina o DPS, precisa ser controlado.

### Fórmulas individuais
```
str_total = (1 + str_level × 0.08) × Π(milestones_str)
vit_total = (1 + vit_level × 0.06) × Π(milestones_vit)
agi_total = (1 + agi_level × 0.04) × Π(milestones_agi)
  → ataques_por_seg = min(1.25, 0.4 × agi_total)
  → milestone 25 já atinge o cap: 1.96 × 5.0 × 0.4 = 3.92 → capped em 1.25
lck_total = min(1.0, lck_level × 0.015 × Π(milestones_lck))
  → overflow acima de 100% → bônus de crit damage
frt_total = (1 + frt_level × 0.05) × Π(milestones_frt)
wis_total = (1 + wis_level × 0.05) × Π(milestones_wis)
```

### Dilemas de investimento por fase
| Fase | Stats prioritários | Por quê |
|------|--------------------|---------|
| Sub 1–2 Map 1 | str + vit | DPS e sobrevivência básica |
| Sub 3–4 Map 1 | str + vit + frt | frt acelera o ciclo de upgrades |
| Sub 5 / Boss | str + vit + agi | agi aumenta DPS total |
| Pre-convergence | wis | leveling rápido para último push |
| Pós-convergence | str milestone 10 | recupera poder imediatamente |

---

## 9. Lumens por Kill — Loop Econômico

### Fórmula base
```
lumens_por_kill = mob_hp × goldRatio × frt_total
goldRatio = 0.10
```
- Level 1 mob (HP 10): **1 Lumens** → ~5-10 kills para 1ª compra ✅
- Level 50 mob (HP 68): **6.8 Lumens**
- Renda escala com HP do mob: quem empurra para mobs mais fortes ganha mais

### Paridade custo/renda (confirmada pela pesquisa)
- Custo str level n: `10 × 1.15^n`
- Renda por kill: `mob_hp × 0.10 = 10 × 1.04^(level-1) × 0.10`
- Ambos crescem exponencialmente → tempo por compra constante em qualquer fase ✅

## 10. Vestiges por Kill

```
vestiges_por_kill = floor(globalSubIdx × 0.5)
globalSubIdx      = mapIdx × 5 + subIdx

vestiges_por_boss = max(1, vestiges_por_kill) × 10
```

| Zona | globalSubIdx | Por kill | Por boss |
|------|-------------|----------|----------|
| Map 1 Sub 1–2 | 0–1 | 0 | 10 |
| Map 1 Sub 3 | 2 | 1 | 10 |
| Map 1 Sub 5 | 4 | 2 | 20 |
| Map 3 Sub 1 | 10 | 5 | 50 |
| Map 5 Sub 5 | 24 | 12 | 120 |

- Map 1+2 = ~5% dos Vestiges totais → pressão natural para avançar
- Vestiges acumulam através das Convergences (preservados no reset)
- Gastos exclusivamente em **Ascension** (não em Convergence)

---

## 11. Convergence

### Trigger
Derrote o boss de Map 1 Sub 5 pela primeira vez → botão permanentemente disponível. Sem custo de recurso.

### Reset vs. Preserva

| Item | Convergence |
|------|-------------|
| Gold Stats (str/vit/agi/lck/frt/wis) | ❌ volta a 0 |
| Lumens | ❌ reset |
| Progresso de mapa/subárea | ❌ volta Map 1 Sub 1 |
| Hero level | ✅ preservado |
| Gear | ✅ preservado |
| Vestiges | ✅ preservado |
| convergence_mult | ✅ acumula |

### Fórmula de ganho

```
subareas_limpas   = subareas com boss derrotado nesta run (0–25)
ganho_desta_run   = (subareas_limpas / 25) ^ 1.5 × 0.50
convergence_mult  = convergence_mult × (1 + ganho_desta_run)
```

| Subareas limpas | Ganho | Mult desta run |
|-----------------|-------|----------------|
| 5  (Map 1 completo) | 0.045 | ×1.045 |
| 10 (Map 2 completo) | 0.113 | ×1.113 |
| 15 (Map 3 completo) | 0.207 | ×1.207 |
| 20 (Map 4 completo) | 0.358 | ×1.358 |
| 25 (full clear)     | 0.500 | ×1.500 |

**Acumulado (full clears):** 10 conv → ×57 | 20 conv → ×3.325k | 50 conv → ×637k

```
dano_por_hit = baseDmg × str_total × level_bonus × gear_bonus
             × convergence_mult × ascension_mult
```

---

## 12. XP e Hero Level

### XP por kill
```
xp_por_kill = mob_hp × xpRatio × wis_total
xpRatio     = 0.08
```
`wis` (Gold Stat, reseta na convergence) acelera o leveling dentro do run.
Hero level é permanente — investir em `wis` antes de converge escala o nível permanente mais rápido.

### Curva de leveling
```
xp_para_nivel(n) = 50 × 1.25^n
```

| Hero Level | XP acumulado aprox. |
|-----------|---------------------|
| 5  | ~300 |
| 10 | ~1.100 |
| 25 | ~6.200 |
| 50 | ~43k |
| 100 | ~300k |

### level_bonus (dano e HP)
```
level_bonus = 1 + sqrt(heroLevel) × 0.20
```

| Hero Level | level_bonus |
|-----------|-------------|
| 10  | ×1.63 |
| 25  | ×2.00 |
| 100 | ×3.00 |
| 400 | ×5.00 |

Sqrt garante que o nível seja valioso mas nunca domine o `convergence_mult`.
Aplica-se tanto a dano quanto a HP máximo:
```
hp_max = playerBaseHp × vit_total × level_bonus
```

**Simulação:** após 10 convergences (full clears) → hero level ~30–40 → level_bonus ≈ ×2.1

---

## 13. Boss — Parâmetros

```
bossHpMult      = 15   // boss HP = mob HP regular × 15
bossGoldMult    =  5   // boss drops 5× Lumens
bossXpMult      =  5   // boss drops 5× XP
bossVestigesMult = 10  // boss drops 10× Vestiges (ver §10)
```

### Kill time target no boss
| Fase | Boss HP | DPS player | Kill time |
|------|---------|------------|-----------|
| Map 1 Sub 1 (após 20 kills) | 150 | ~4 | **~38s** |
| Map 1 Sub 5 (str M10) | 480 | ~20 | **~24s** |
| Map 3 Sub 3 (str M25) | 1.605 | ~200 | **~8s** |
| Frontier (limite do player) | escala | equilibrado | **20–40s** target |

Boss final do mapa (Sub 5) = mesmo `bossHpMult`, diferenciado por nome/emoji especial e kill threshold mais alto.

---

## 14. Gear — Sistema Completo

Inspirado em Gaiadon: Eternal Quest. Dois eixos independentes de upgrade:
- **Item Level** — gasto contínuo de Lumens, taxa por nível varia com raridade
- **Raridade** — milestone com Lumens + materiais; adiciona affixes e muda a taxa por nível

### Slots (fixos, sempre presentes desde o início)
| Slot | Affix 1 | Affix 2 | Affix 3 (Rare+) | Affix 4 (Epic+) | Affix 5 + Único (Legendary) |
|------|---------|---------|-----------------|-----------------|------------------------------|
| **Weapon** | atkMult | critChance | atkSpeed | critDamage | atkMult (2ª) + único |
| **Armor** | hpMult | regenOnKill | enemyHpReduct | hpMult (2ª) | regenOnKill (2ª) + único |

Gear é **preservado na Convergence** e reseta apenas na Ascension (a definir).

### Fórmula de valor de affix
```
affix_valor = baseAffix × gearLevel × ratePerLevel[rarity]
```

### Taxa por nível e level cap por raridade
| Raridade | Rate/nível | Level cap | Affix máx no cap (ex: atkMult) |
|---------|-----------|-----------|-------------------------------|
| Common | 0.50%/lv | 100 | **+50%** |
| Rare | 0.20%/lv | 500 | **+100%** |
| Epic | 0.08%/lv | 2.000 | **+160%** |
| Legendary | 0.025%/lv | 25.000 × ascensions | **+625%** por ascension |

### Regressão intencional ao fazer upgrade de raridade
O level não reseta ao subir de raridade — mas a taxa por nível cai:
```
// Exemplo com atkMult:
Common  nível 100 (cap) →  +50%
  ↓ upgrade para Rare (level permanece em 100)
Rare    nível 100       →  +20%  ← REGRESSÃO (-30%)
Rare    nível 250       →  +50%  ← recupera o valor anterior
Rare    nível 500 (cap) → +100%  ← dobra o teto do Common
```
Sensação: curto prazo mais fraco, longo prazo com teto muito maior.

### Custo de upgrade de raridade
| Upgrade | Lumens | Material | Drop |
|---------|--------|----------|------|
| Common → Rare | 5.000 | 5× Shard Bruto | Boss Map 2+ (20% chance) |
| Rare → Epic | 50.000 | 5× Shard Refinado | Boss Map 4+ (10% chance) |
| Epic → Legendary | 500.000 | 5× Essência Mítica | Boss Map 5 Sub 5 (5% chance) |

### Custo de item level (Lumens)
```
level_cost(n) = 50 × 1.20^n
```
Mesmo expoente dos Gold Stats — familiar para o player.

### baseAffix por tipo de affix
| Affix | baseAffix | Efeito |
|-------|-----------|--------|
| atkMult | 1 | +X% dano por hit |
| critChance | 1 | +X% chance de crit |
| atkSpeed | 1 | −X% intervalo de ataque (cap: 0.8s) |
| critDamage | 1 | +X% dano no crit |
| hpMult | 1 | +X% HP máximo |
| regenOnKill | 1 | +X% HP máximo recuperado por kill |
| enemyHpReduct | 1 | −X% HP dos inimigos |

> `baseAffix = 1` significa que os valores são todos derivados de `gearLevel × rate`. Ex: Weapon Common nível 50 → atkMult = 1 × 50 × 0.005 = 0.25 → +25% dano.

---

## 15. Ascension

### Custo
```
custo(n) = 50.000 × 1.4^(n-1)    // Vestiges
```

| Ascension | Custo | Vestiges acumulados necessários |
|-----------|-------|---------------------------------|
| 1ª | 50k | 50k |
| 3ª | 98k | ~220k |
| 5ª | 192k | ~580k |
| 10ª | 1.49M | ~5.6M |

### Reset vs. Preserva

| Item | Ascension |
|------|-----------|
| Gold Stats + Lumens + map progress | ❌ reset |
| `convergence_mult` | ❌ **reset** — sacrifício real |
| Hero level | ❌ reset |
| Gear (rarity + item levels) | ✅ preservado |
| Vestiges (saldo após custo) | ✅ preservado |
| `ascension_mult` acumulado | ✅ cresce permanentemente |

Perder `convergence_mult` é o custo real: o player sacrifica o trabalho de 50+ convergences, recupera em ~15 convergences pós-Ascension e depois supera o patamar anterior.

### Ganho: `ascension_mult`
```
ascension_mult = ascension_mult × 5     // ×5 por Ascension, multiplicativo
```

| Ascensions | ascension_mult |
|-----------|----------------|
| 1 | ×5 |
| 5 | ×3.125 |
| 10 | ×9.77M |

Aplica-se a dano e HP máximo:
```
dano_por_hit = baseDmg × str_total × level_bonus × gear_bonus
             × convergence_mult × ascension_mult

hp_max = playerBaseHp × vit_total × level_bonus × ascension_mult
```

### Mob HP escala com Ascension (`ascMult`, já no código)
```
mob_hp_efetivo = mob_hp × ascGrowth ^ ascensions
ascGrowth = 2.0    // mob HP dobra por Ascension
```
Player damage +×5, mob HP +×2 → **net ×2.5 por Ascension** relativo aos mobs.
Garante que cada Ascension desafia o player a empurrar para zonas mais profundas.

### Vestiges por kill também escalam
```
vestiges_por_kill = floor(globalSubIdx × 0.5) × (1 + ascensions)
vestiges_por_boss = max(1, vestiges_por_kill) × 10
```
Após A5: Map 5 Sub 5 dá 12 × 6 = **72 vestiges/kill** (vs 12 na A0).
O loop de Ascension acelera naturalmente — cada ciclo é mais rápido que o anterior.

### Fórmula de dano completa (todos os multiplicadores)
```
dano_por_hit = baseDmg
             × str_total           // Gold Stat — reseta na Convergence
             × level_bonus         // hero level — reseta na Ascension
             × gear_bonus          // Weapon atkMult — permanente
             × convergence_mult    // reseta na Ascension
             × ascension_mult      // permanente, nunca reseta
```

---

## 16. Calibração Pendente

- [ ] `baseHp` absoluto — validar com loop completo rodando (kill time, income, custo de upgrade)
- [ ] Playtesting das primeiras 3 Convergences — confirmar pacing do early game
- [ ] Playtesting da 1ª Ascension — confirmar sacrifício vs. recuperação em ~15 convergences

---

## 7. Referências de Design

### Jogos pesquisados
| Jogo | Lição principal |
|------|----------------|
| **Synergism** | 7 camadas de prestige; produto de multiplicadores independentes; `break_infinity.js` para números grandes |
| **Gaiadon Eternal Quest** | Área de densidade com boss no pool ativo; hard caps por patch; 4 camadas multiplicativas de stat |
| **Melvor Idle** | Intervalo de ataque em ms, cap de 250ms; DPS = (hit × accuracy) / interval |
| **Idle Skilling Crusades** | 4 mobs + 1 boss simultâneos por encounter |
| **Clicker Heroes** | 10 mobs/zona sequencial, boss sozinho a cada 5 zonas; DPS totalmente abstraído |

### Princípios acordados
1. **Soft cap com `sqrt`** para stats que podem dominar
2. **Produto de multiplicadores independentes** para crescimento modular (não uma única fórmula com expoente gigante)
3. **Prestige gain** = `(recurso / threshold)^α` com α < 1 — grinding extra não deve dominar o prestige
4. **Attack speed como intervalo visível**, não APS abstrato — cada projétil deve ser legível
5. **Boss no campo ativo** cria pressão de DPS dupla (HP wall + dano recebido), não só HP wall
6. **Pack size como dimensão de tempo** — mais mobs = mais tempo na área, não mobs mais difíceis individualmente
