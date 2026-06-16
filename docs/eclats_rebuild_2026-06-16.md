# Éclats of Lumière — Reconstrução da Lógica (papel em branco)

> **STATUS: PROPOSTA — PENDENTE DE APROVAÇÃO (2026-06-16).** Este documento é a nova
> **fundação matemática** do jogo. Nada de código foi alterado ainda. Visual/design,
> `src/core/*`, assets e **todas as features** são mantidos; o que muda é a **lógica de
> balanceamento** (`src/game/*`) e **todas as constantes** (`src/data/constants.js`),
> reescritas sobre o modelo abaixo. Substitui a calibração antiga por inteiro.
>
> Validação: `tools/sim` novo (orçamento + prestígio + pacing). Resultados na §8.

---

## 1. Objetivo e princípios (as 6 leis do modelo)

Alvo: **5 mapas = jogo base ≈ 30 dias** (casual), curva crescente, sem paredes nem
colapsos. As leis abaixo vêm da análise do código atual + pesquisa do gênero
(Clicker Heroes, Cookie Clicker, AdVenture Capitalist, Antimatter Dimensions, Realm Grinder).

1. **Afinar a razão `r/g`, não `r` e `g` soltos.** Custo e recompensa são ambos
   exponenciais; o que paceia é a razão custo÷recompensa, mantida pouco acima de 1.
   Banda do gênero: `r ≈ 1.07–1.15` por nível.
2. **Recompensa um pouco À FRENTE do HP.** Lumens/kill cresce levemente mais rápido que
   o HP do inimigo → toda parede é "farmável". Paredes duras só nos **bosses/gatekeepers**
   (DPS-check explícito, múltiplo fixo do HP da zona).
3. **A âncora "1 kill/ataque" é deliberada.** Kill rate ≤ APS. Cada área deve cruzar de
   **Fase A (dano-limitado, ~60-70%: comprar dano acelera a renda)** para **Fase B
   (APS-limitado, ~30-40%: dano satura, pressão pra avançar/comprar APS)**. Isso
   auto-rotaciona o stat dominante e fixa o teto de renda em `lumens/kill × APS`.
4. **Prestígio é MULTIPLICATIVO e em CAMADAS.** Nenhum bônus aditivo de prestígio
   permanente. Convergence compõe (`1.15^c`); Ascension/Despertar/Clarté são camadas
   que multiplicam o todo.
5. **Sem pilar único.** Nenhum sistema entrega >~40% do poder no late. As ~45 décadas do
   fim de jogo são repartidas entre Gear (~36%), Clarté (~32%), Ascension (~12%),
   Despertar (~9%), Convergence (~8%), Nível (~3%). Redundância = tolerância.
6. **Teto físico < 1e100.** HP máx do jogo base = 1e45 (Map 5 boss), folgado no float
   nativo. `break_infinity` continua reservado pro pós-base (Nightmare/Tormento).

---

## 2. Ladder de inimigos (suavizado)

Malha geométrica (mantém `enemies.js`: interpolação log-linear no nível). **Mudança:
bandas de HP contíguas, +9 décadas por mapa, seams limpos** (mata os artefatos de
"Map 4 = parede / Map 5 = colapso" que vinham de razões por-mapa desiguais).

| Mapa | HP mob (lo–hi) | HP boss final | dano mob | sub-áreas |
|---|---|---|---|---|
| 1 The Dreaming Wood | 1e3 – 1e8 | 1.5e9 | 0.02 × HP | 9 |
| 2 Cavernes Luminis | 1e8 – 1e17 | 1.5e18 | 0.02 × HP | 6 |
| 3 The Ashen Ruins | 1e17 – 1e26 | 1.5e27 | 0.02 × HP | 7 |
| 4 The Fractured Peaks | 1e26 – 1e35 | 1.5e36 | 0.02 × HP | 8 |
| 5 Nil Aeternum | 1e35 – 1e44 | 1.5e45 | 0.02 × HP | 8 |

- `bossHpMult = 15`, `bossDmgMult = 3` (mantidos). Boss = DPS-check (lei 2).
- Dano do mob = razão constante `0.02 × HP` em todos os mapas (mantido — a Defesa decide
  vida/morte na entrada do mapa, como já validado em `survival.mjs`).

---

## 3. Modelo de poder — orçamento por sistema

Poder efetivo (dano) = produto dos multiplicadores de cada sistema. Em **décadas**
(log10), a contribuição de cada sistema ao CHEGAR no boss de cada mapa:

| map | need | gear | clarté | asc | desp | conv | nível | **avail** | **margem** | maior share |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 5.0 | 4.0 | 0.0 | 0.0 | 1.1 | 0.8 | 1.5 | **7.4** | **+2.4** | gear 54% |
| 2 | 14.0 | 8.0 | 2.0 | 1.5 | 2.2 | 1.6 | 1.5 | **16.8** | **+2.8** | gear 48% |
| 3 | 23.0 | 12.0 | 6.0 | 3.0 | 3.4 | 2.4 | 1.5 | **28.2** | **+5.3** | gear 43% |
| 4 | 32.0 | 16.0 | 11.0 | 4.5 | 4.5 | 3.2 | 1.5 | **40.6** | **+8.7** | gear 39% |
| 5 | 41.0 | 18.0 | 16.0 | 6.0 | 4.5 | 3.9 | 1.5 | **49.9** | **+8.9** | gear 36% |

**Propriedades validadas** (`tools/sim/spec_sim.mjs`): margens **positivas e crescentes**
(tolerância, o oposto do fio-de-navalha atual); gear domina cedo (ok, é o engine ativo) e
cai pra 36% no late; Clarté sobe controlada a 32% (vs ~95% hoje). Sem pilar único.

---

## 4. Combate & âncora 1-kill (Fase A/B)

- `currentAPS = min(apsCap, baseAPS + apsBonus(gear) ) × passiveApsMult`. **`baseAPS = 1.0`,
  `apsCap = 10`** (alcançável só no late via gear+passiva Fracture Pulse). Cleave/AoE
  permanece unlock (ADR 0002).
- **Crossover Fase A→B por área:** calibrar `dano_por_hit` pra ficar ABAIXO do HP do mob
  da área por ~60-70% da travessia. Como o gear dá flat+%, o HP-dentro-da-área precisa
  rampar rápido o bastante pra você NÃO one-shotar de imediato (corrige o "renda
  congelada" — hoje você one-shota tudo e a renda só cresce por profundidade).
- APS tem razão de custo MAIOR que dano (ex.: dano `r≈1.08`, APS via gate/raridade) →
  o "melhor compra" rotaciona dano (Fase A) ↔ APS (Fase B).

---

## 5. Economia (moedas e treadmill `r/g`)

| Moeda | Fonte | Gasto | Reset |
|---|---|---|---|
| **Lumens** | kill (`HP × goldRatio` + piso + nível) | níveis de Gear | só `xpRun` na conv (Lumens **NÃO** reseta mais) |
| **XP** | kill (`HP × xpRatio`) | nível do Seeker (stat base flat) | `xpRun` reseta na conv |
| **Vestiges** | kill (`ceil(sub/2) × 3^map`) | Ascension, Despertar, Passivas | nunca |
| **Éclats** | drip (`coef × HP_frontier^EXP`) pós-A1 | Mémoires (Clarté) | nunca |
| **Materiais** | drop 1%/kill (tier do mapa) | subir raridade do Gear | nunca |
| **Nitzotzot** | drop Sub 3+ | Despertar (Oferenda) | nunca |

- **Treadmill de Gear:** `custo(L) = base × (L+1) × costMult[raridade]` (linear, mantido).
  Renda lumens ∝ HP do mob. Afina-se `r/g` pra ~5-10 s por nível no early.
- **Recompensa à frente do HP (lei 2):** `goldRatio` calibrado pra renda/kill crescer
  ~10-20% mais rápido que o HP por área → paredes farmáveis.

---

## 6. Prestígio redesenhado (multiplicativo + camadas)

| Sistema | Fórmula NOVA | Fórmula velha | Ganho |
|---|---|---|---|
| **Convergence** | `convMult = 1.15^c` (mult), gate `40×1.25^c`, reseta só `xpRun` | `1 + 0.15c` (aditivo), resetava Lumens | de "morto" (1.4% rel na 50ª) a **+15% perpétuo** |
| **Ascension** | `ascMult = 30^ascensions` (×30/asc = 1.48 déc) | `2^asc` (×2 = 0.3 déc) | camada-meta real (~6 déc A1-A4) |
| **Despertar** | `despMult = 13^despertares` (1.12 déc/tier) | `5^t` (0.7 déc) | ~4.5 déc no T5 |
| **Clarté (Mémoires)** | `1.07^Σníveis`, **com teto de nível por era** + drip mais lento | `1.07^Σ` sem teto + drip `^0.9` | de pilar único (95%) a **engine controlado (~32%)** |

**Por que Convergence multiplicativa importa** (`tools/sim/spec_sim.mjs`):

| conv nº | aditivo `1+0.15c` (ganho relativo) | multiplicativo `1.15^c` |
|---|---|---|
| 1 | 15.0% | 15.0% |
| 10 | 6.4% | 15.0% |
| 50 | 1.8% | 15.0% |
| 65 | 1.4% | 15.0% |

**Trava estrutural anti-pilar (Clarté):** como o drip cresce com o frontier, Éclats
tendem a sobrar e a Clarté `1.07^Σ` voltaria a explodir. Dois freios:
1. **Drip mais lento:** expoente `0.9 → ~0.55` → Éclats viram grind paceado, não abundante.
2. **Teto de nível por era:** cada Mémoire tem `maxLevel` que sobe por Ascension/era →
   Σníveis é limitado por mapa → Clarté **não pode** passar do share orçado, mesmo
   sobre-farmando. (Estado já tem `memoires[]`; só falta o cap — sem migração de save.)

---

## 7. Tabela de constantes proposta (mapeada por arquivo)

> ⚠️ Valores ANCORADOS no modelo; o **micro-tuning final** (especialmente pacing §9) é
> feito na implementação com o sim de combate real portado (estilo `map1_pace.mjs`).

`src/data/constants.js`
```
COMBAT.baseAPS        : 0.90 → 1.0
COMBAT.apsCap         : 5    → 10
COMBAT.bossHpMult     : 15   (mantém)
MAPS[].{hpLo,hpHi}    : ver §2 (bandas contíguas +9 déc/mapa)
ECONOMY.goldRatio     : calibrar p/ renda ~10-20% à frente do HP/área (lei 2)
LEVEL.*               : curva mantida; nível dá stat FLAT (sem Gold Stats)
CONVERGENCE.bonusPerConv : REMOVIDO  → CONV_STEP = 1.15 (multiplicativo)
CONVERGENCE.gateLevelBase/Growth : 40 / 1.25 (mantém)
ASCENSIONS[].mult     : 2  → 30   (todos os marcos)
DESPERTAR.mult        : 5  → 13
MEMOIRE_CLARTE_BASE   : 1.07 (mantém)
MEMOIRE_EVO_RAMP      : 3.0 → 2.1  (tira o fio-de-navalha)
+ MEMOIRE_MAXLEVEL_PER_ERA : NOVO — teto de nível por era (trava anti-pilar)
ECLATS_DRIP.exp       : 0.9 → ~0.55 (Éclats viram grind paceado)
GEAR.rarityMult       : [1,1.5,2.25,3.5,5] → [1,3,10,35,120] (sobe o teto de gear ~3 déc)
GEAR.levelCap         : [750,2000,3000,4000,5000] → [1000,4000,8000,16000,32000]
```

`src/game/stats.js`: `convMult = CONV_STEP ** state.convergences` (era `1 + 0.15c`).
`src/game/convergence.js`: `doConverge` reseta só `xpRun` (remover `state.lumens = 0`).
`src/game/ascension.js`: `eclatsDripPerSec` usa `max(unlockedSubarea, bestSubareaRun)` +
piso por mapa (anti-bootstrap); `despertarMult`/`ascMult` leem as constantes novas.
`src/game/memoires.js`: aplicar `maxLevel` por era no `nextCost`/`canBuy`.

---

## 8. Curva de progressão simulada (resultados)

Sims novos em `tools/sim/` (a portar do `/tmp/rebuild` na implementação):
- **Orçamento (§3):** avail ≥ need em todos os mapas, margens +2.4 → +8.9 déc (crescente);
  maior share cai de 54% (M1) a 36% (M5). ✅ sem pilar único, sem parede.
- **Prestígio (§6):** Convergence multiplicativa mantém +15% perpétuo vs 1.4% do aditivo. ✅
- **Pacing (§9):** treadmill ativo ~2.8 dias; meta-moeda confirmada como NÃO-gargalo.

---

## 9. Pacing (modelo, knob e honestidade)

**Descoberta:** o grind ATIVO dos 5 mapas é curto (~3 dias). Os **~30 dias casual vêm da
CADÊNCIA DE GATES + offline**, não do tempo ativo (o `playtime.mjs` do repo já mostra isso:
offline 24h/50% faz o casual durar ~2 semanas com pouco tempo ativo). Logo:

- **Knob global de pacing:** tempo-por-década do treadmill (via `r/g` e custos) + cadência
  dos gates (nível pra destravar sub-área, gate de Convergence `40×1.25^c`, gates de
  Ascension/Despertar) + parâmetros de offline.
- **Alongar pra 30 dias = mais GATES/conteúdo** (sub-áreas crescentes, Hollows,
  Convergences), **não inflar custos** — coerente com a decisão em `ESTADO_DO_JOGO.md`.
- **Calibração final do dia-a-dia:** feita na implementação com o sim de combate real
  portado (não dá pra cravar 30d num sim de orçamento; é a pendência honesta do CP-12).

---

## 10. Mapeamento de features (TODAS preservadas)

| Feature | Preservada como | Novo papel no modelo |
|---|---|---|
| Combate single-target + 1-kill | ✅ idêntico | âncora; Fase A/B (lei 3) |
| Cleave/AoE | ✅ unlock (ADR 0002) | multiplica o teto de renda quando ligado |
| Gear (6 peças, 5 raridades, afixos) | ✅ | engine ativo principal (~36% do poder) |
| Convergence | ✅ | acelerador **multiplicativo** real (~8%) |
| Ascension (A1-A5) | ✅ | camada-meta `30^asc` (~12%) |
| Despertar (T1-T5) | ✅ | gate de poder no meio do mapa `13^t` (~9%) |
| Mémoires / Clarté (15 relíquias) | ✅ | engine compondo, **com teto** (~32%) |
| Passivas (3 árvores × 15) | ✅ | alavancas (crit, APS, mob cap, material) — mantêm |
| Dificuldades (Normal→Tormento) | ✅ | re-run ×HP/×reward; Nightmare/Tormento = break_inf |
| Hollows / Reliquats | ✅ | conteúdo de gate/pacing (alonga p/ 30d) |
| Vestiges, Materiais, Nitzotzot, Éclats | ✅ | moedas paralelas (§5) |
| Offline | ✅ | simulação real; cap/`%` são knobs de pacing |

Nenhuma feature é removida. Estrutura de `state` (§state.js) é compatível — sem campo novo
exceto o teto de Clarté (lido de constante, não persistido).

---

## 11. Plano de reescrita por arquivo + migração

1. `src/data/constants.js` — reescrever todas as constantes (§7). Bump `SCHEMA_VERSION`
   (saves antigos descartados; números mudam por completo — esperado num papel em branco).
2. `src/game/stats.js` — `convMult` multiplicativo; ler asc/desp/clarte novos.
3. `src/game/convergence.js` — reset só de `xpRun`.
4. `src/game/ascension.js` — drip anti-bootstrap; mults novos.
5. `src/game/memoires.js` — teto de nível por era.
6. `src/game/enemies.js` — sem mudança de lógica (lê MAPS novos).
7. `src/game/economy.js`, `combat.js`, `gear.js` — ler constantes novas; ajustar crossover
   Fase A/B (combat) e o teto de gear (gear).
8. `tools/sim/` — portar os sims do modelo novo; aposentar/etiquetar os sims com SEED
   enganoso (`pacing.mjs` mostrava parede falsa por seed arbitrário).
9. UI/`core` — **intocados** (visual/design mantidos).

**Migração de saves:** bump de `SCHEMA_VERSION` → saves v6 descartados no load (já é o
comportamento). Como os números são todos novos, manter save antigo seria incoerente.

---

## 12. Knobs abertos (a calibrar na implementação, não bloqueiam aprovação)

- `goldRatio` exato (lei 2: renda à frente do HP).
- Crossover Fase A/B por área (rampa de HP intra-área vs dano comprável).
- `ECLATS_DRIP.exp` e `MEMOIRE_EVO_RAMP` finos (balancear o grind da Clarté vs gear).
- `MEMOIRE_MAXLEVEL_PER_ERA` por era (trava o share da Clarté).
- Cadência de gates + offline pra fechar os ~30 dias (CP-12).
- `ASCENSIONS[].mult` escalonado vs fixo 30 (fixo valida o orçamento; escalonar é refino).
</content>
</invoke>
