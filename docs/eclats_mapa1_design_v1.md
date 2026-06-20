# Éclats — Mapa 1: Design & Balanceamento (v1)

> Decisões **travadas** em sessão com o Willian (2026-06-20). Companion de
> [eclats_afixos_drop_v1.md](eclats_afixos_drop_v1.md) (anatomia das peças/afixos).
> Todos os números são **placeholders de teste** — os valores finais saem da
> **simulação (item 4)**. NADA implementado em código ainda.
>
> **Aberto ainda:** 3c (árvore de passivas) · 4 (taxa de drop + material no descarte
> + simulação de tuning). Sink dos Lumens = upgrade de gear (já definido).

## Modelo de combate (contexto)
- 1 player vs mobs, **waves infinitas**, combate **single-target** (Atk Speed acelera, cada ataque ainda é 1 alvo). Teto "1 kill/ataque" só é furado por **cleave** = passiva futura (via Convergence).
- Modelo de força = **RELATIVO ao player** (mob escala com o seu poder; nunca trivial, nunca impossível).
- **Stats base (nível 1):** HP = Dano = **1.000** (razão 1). Atk Speed base **0.9** (→ ~2.5 no fim do mapa; apsCap global 10).
- **Crescimento por nível:** `hpPerLevel = dmgPerLevel = +150/nível` (15% do base). ⚠️ HP e Dano crescem JUNTOS de propósito — se divergirem, o combate trivializa (ver achado da simulação). No nível 1200: HP=Dano ≈ 181K antes de gear/Convergence.
- **TTK alvo ~2s** no início (área 1, AtkSpeed 0.9, ~1.76 hits), caindo p/ ~0.9s conforme o Atk Speed sobe.
- Regen base **1%/s**; regen-on-kill = passiva futura.

---

## 1. Áreas 1–9 (LOCKED, sujeito a tuning)

Fórmulas (relativas ao player):
- **HP do mob** = `HP_player × fatorÁrea × rand(1.3–1.9)`  → mob sempre ≥ 1.43× seu HP
- **Dano do mob/s** = `HP_player × 0.03 × fatorÁrea` (por mob)
- **Reward/kill** = `HP_mob × 0.25` (Lumens) · `HP_mob × 0.10` (XP)
  - ⚠️ Propriedade do modelo: como hits-pra-matar ∝ HP_mob e reward ∝ HP_mob, **renda/s = `0.25 × AtkSpeed × Dano`** (o HP do mob se cancela). Ir fundo **não** dá mais renda/s — paga via **drops de raridade maior** e por permitir continuar subindo de nível. (Se um dia quisermos "fundo = mais renda/s", o reward teria que crescer mais rápido que o HP.)
  - Mesmo p/ XP: **XP/s = `0.10 × AtkSpeed × Dano`**. Velocidade de nível depende só do seu dano × atk speed.

| Área | Gate (nível) | fatorÁrea | Mobs no pack | HP do mob (× seu HP) | Ameaça/s do pack | Teto raridade |
|------|:------------:|:---------:|:------------:|----------------------|------------------|---------------|
| 1 | 1    | 1.1 | 1 | 1.43 – 2.09 | ~3.3%  | Common |
| 2 | 30   | 1.2 | 1 | 1.56 – 2.28 | ~3.6%  | Common |
| 3 | 90   | 1.3 | 2 | 1.69 – 2.47 | ~7.8%  | Common |
| 4 | 180  | 1.4 | 2 | 1.82 – 2.66 | ~8.4%  | +Uncommon |
| 5 | 320  | 1.5 | 3 | 1.95 – 2.85 | ~13.5% | +Uncommon |
| 6 | 500  | 1.6 | 3 | 2.08 – 3.04 | ~14.4% | +Uncommon |
| 7 | 720  | 1.7 | 3 | 2.21 – 3.23 | ~15.3% | +Uncommon |
| 8 | 960  | 1.8 | 4 | 2.34 – 3.42 | ~21.6% | +Rare |
| 9 | 1200 | 1.9 | 4 | 2.47 – 3.61 | ~22.8% | +Rare |

- Gate = nível do player p/ liberar a área. Mapa 1 vai do nível **1 ao 1200**.
- Pack cresce **1 → 4** mobs ao longo do mapa.
- Raridade por área: **1–3 Common · 4–7 +Uncommon · 8–9 +Rare**. Epic/Legendary só em mapas futuros.

## Curva de XP
- `xpRun(nível) = curveDiv × nível^(1/curveExp)`, com **curveExp = 0.42** e **curveDiv afrouxado de 25.000 → ~4.600** (÷5.4) p/ a 1ª Convergence (nível 50) dar **~30 min** na primeira run (sem gear). Placeholder — ajustável na simulação.

---

## 2. Convergence = rebirth (LOCKED)

- **Gatilho:** gate por **nível**. 1ª Convergence em **nível 50** (~30 min). Cada próxima **×1.5**:
  `50 · 75 · 113 · 169 · 253 · 380 · 570 · 854` → ~8 Convergences no Mapa 1.
- **Reseta:** nível da run (XP→0, volta ao nível 1) · Lumens · acesso às áreas fundas (re-sobe pelo gate de nível).
- **Mantém:** Pontos de Convergence · passivas · gear (equipado + inventário) + materiais · recordes (nível/área máx).
- **Recompensa:** **só Pontos de Convergence** (sem +15% automático). Pontos são gastos na **árvore de passivas** (liberada na 1ª Convergence) — todo poder permanente vem das passivas **escolhidas**.
- **Fórmula de pontos:** `Pontos = nível da run no momento que converge` (segurar e ir mais fundo = mais pontos → "push before prestige" do TT2).

---

## 3a. Upgrade de gear com Lumens (LOCKED — modelo de teste)

- **Lumens** (recompensa de kill) é gasto p/ **subir o nível da peça**.
- Cada nível dá **+% em TODOS os afixos** da peça (primário + secundários juntos).
- **Ganho linear + custo linear + cap rígido por raridade** (vs. exponencial-infinito dos idle clássicos — escolhemos cap rígido porque a progressão principal é por **raridade/drop**, empurrando a caçar a próxima raridade).
- `custo(n) = base × (n+1) × multRaridade`.
- Upgrades **persistem** pela Convergence (gear é mantido); só os Lumens resetam.

| Raridade  | Cap nível | Cap multiplicador | +/nível |
|-----------|:---------:|:-----------------:|:-------:|
| Common    | 20  | ×1.4 | +2.0%   |
| Uncommon  | 40  | ×2.3 | +3.25%  |
| Rare      | 60  | ×3.2 | +3.67%  |
| Epic      | 80  | ×4.1 | +3.875% |
| Legendary | 100 | ×5.0 | +4.0%   |

(Mapa 1 vê até **Rare → cap ×3.2**.)

---

## 3b. Ranges de afixo por área (LOCKED — placeholder de teste)

`valor final = rollBase(área) × multNível(upgrade)`. Áreas 2–8 = interpolação linear
entre as âncoras. **Primário** rola cheio; o mesmo tipo como **secundário** rola **×0.5**.
% cresce com a área (drop fundo = rolls maiores) → é o que puxa a progressão.

### Ofensivos
| Afixo | Área 1 (primário) | Área 9 (primário) | Obs. |
|---|---|---|---|
| % Dano | +8% a +15% | +25% a +45% | workhorse |
| Crit Chance | +2% a +5% | +8% a +15% | teto 100% |
| Crit Damage | +15% a +30% | +50% a +100% | soma à base ×2 |
| Atk Speed ⚠️ | +0.05 a +0.10 /s | +0.15 a +0.30 /s | flat, tight; limitado por apsCap (~2.5 no Map 1) |
| Dano em Boss | +20% a +40% | +60% a +120% | condicional |

### Defensivos
| Afixo | Área 1 | Área 9 | Obs. |
|---|---|---|---|
| % HP | +8% a +15% | +25% a +45% | espelha o Dano |
| Defesa (mitigação) | +3% a +8% | +15% a +30% | precisa **cap de mitigação** (~75%) |
| Regen (% HP/s) | +0.2% a +0.5% /s | +1.0% a +2.0% /s | soma ao regen base 1%/s |

### Economia
| Afixo | Área 1 | Área 9 | Obs. |
|---|---|---|---|
| Lumens | +10% a +25% | +50% a +120% | acelera upgrade |
| XP | +8% a +20% | +40% a +100% | acelera nível/Convergence |
| Materiais | +10% a +25% | +50% a +120% | acelera raridade |

**Notas p/ a simulação (item 4):**
- Crit Chance + Crit Damage = pico multiplicativo → orçar como par.
- Defesa precisa de teto (~75%) senão empilhar Manto = imortal.
- Atk Speed é o afixo mais perigoso (mexe no teto de kills) → range apertado.

---

## 3c. Árvore de passivas (LOCKED — estrutura; custos finos → item 4)

Comprada com **Pontos de Convergence** (liberada na 1ª Convergence). Persiste sempre.
Vocabulário (PoE/Last Epoch): **menor** (espelha afixo, rankável) · **notável** (bundle) ·
**keystone** (muda regra). Gate por **investimento acumulado no ramo** (Last Epoch/TT2),
não por grafo livre — um inteiro por tier, fácil de implementar.

### 3 ramos
| Ramo | Nós menores | Notáveis | Keystone(s) |
|---|---|---|---|
| **Ofensiva** | % Dano (sink ∞) · Crit Chance · Crit Damage · Atk Speed · Dano em Boss | *Fúria* (+%Dano +Crit Chance) · *Precisão* (+Crit Chance +Crit Damage) | **Cleave → Splash → Perfurar** |
| **Resistência** | % HP (sink ∞) · Defesa · Regen | *Muralha* (+HP +Defesa) · *Recuperação* (+Regen +regen-on-kill) | **Conversão** (Defesa→Dano) |
| **Fortuna** | Lumens · XP · Materiais | *Prosperidade* (+Lumens +XP) | **Ganância** (+raridade / +HP mob) |

- **% Dano e % HP sem cap** = sink infinito de pontos (estilo D3 Paragon) p/ o late.

### Keystones de AoE (Ofensiva) — ACUMULAM (pega os 3)
- **Cleave** 🗡️ — atinge os N mobs da **frente**, dano dividido (split). Multi-rank: +1 alvo, teto por área.
- **Splash** 💥 — alvo cheio + mobs **ao redor** levam X% do dano. Multi-rank: +split% / +raio.
- **Perfurar** 🏹 — ataque **atravessa** e bate no(s) de **trás na linha**. Multi-rank: +1 alvo perfurado.
- Furam o teto "1 kill/ataque" → gates escalonados e fundos (ter os 3 = fim do ramo).

### Keystones (Resistência/Fortuna)
- **Conversão** — converte X% da mitigação (Defesa) em % Dano (vira glass-cannon por escolha).
- **Ganância** — +X% chance do drop subir 1 raridade (pode furar o teto de raridade da área), **mas** mobs +Y% HP.

### ⚠️ Gate por MAPA — keystones só no Mapa 3/4
Decisão 2026-06-20: **TODOS os keystones** (Cleave, Splash, Perfurar, Conversão, Ganância)
ficam **gated p/ o Mapa 3/4** (gate de progressão + gate de pontos). **Mapas 1 e 2 = só
nós menores + notáveis**, combate **100% single-target**. O "furar o teto" (AoE) é o carro-
chefe dos mapas 3/4, não do começo. O Mapa 1 cresce via **stats (passivas) + gear + Convergence**.

### Economia de pontos (contexto)
- `Pontos = nível ao convergir` → 1ª Convergence (nível 50) = 50 pts de uma vez;
  Mapa 1 inteiro (~8 convergences) ≈ **~2.500 pontos**.

### Modelo de custo/efeito dos nós menores (LOCKED — 1º node definido)
- **Efeito: multiplicativo/composto** por rank (×fator por rank).
- **Custo: sobe por rank** (`custo(1) × growth^(rank-1)`), cada rank mais caro que o anterior.

**1º node — % Dano (travado 2026-06-20):**
- Efeito: **×1.05 por rank** (composto — "5% + 5% de 5%…").
- Custo: rank 1 = **15 pts**, **×1.25 por rank** → 15, 19, 23, 29, 37…
- 1ª run (50 pts) = **2 ranks (+10.25% dano)**. Passiva = investimento que pesa, não enche rápido.

| Rank | Dano total | Custo do rank | Acum. |
|---|---|---|---|
| 1 | +5% | 15 | 15 |
| 2 | +10.25% | 19 | 34 |
| 3 | +15.76% | 23 | 57 |
| 4 | +21.6% | 29 | 86 |
| 5 | +27.6% | 37 | 123 |

**Nós menores definidos (mesmo formato: efeito composto + custo crescente):**

| Node | Efeito/rank | Custo rank 1 | Growth custo |
|---|---|---|---|
| % Dano | ×1.05 (composto) | 15 | ×1.25 |
| % HP | ×1.05 (composto) | 15 | ×1.25 |
| Crit Chance | +0.5% (aditivo, teto 100%) | 20 | ×1.25 |
| Crit Damage | ×1.05 (composto) | 18 | ×1.25 |
| Atk Speed | +1% (aditivo, cap/mapa: M1 = +25%) | 30 | ×1.25 |
| Dano em Boss | ×1.08 (composto) | 12 | ×1.25 |
| Defesa | +1% mitigação (aditivo, teto 75%) | 18 | ×1.25 |
| Regen | +0.1%/s (aditivo) | 12 | ×1.25 |
| Lumens | ×1.05 (composto) | 10 | ×1.25 |
| XP | ×1.05 (composto) | 10 | ×1.25 |
| Materiais | ×1.05 (composto) | 10 | ×1.25 |
| Faro (chance elite) | +0.2% (aditivo, cap/mapa: M1 = +4%, base 1%) | 25 | ×1.25 |

**Todos os nós menores do Mapa 1 estão definidos.** ✅ (Notáveis e keystones = passos futuros / Mapa 3-4.)

## 4. Drop & Material (LOCKED — Mapa 1)

### 4a. Taxa de drop (Mapa 1 — versão simples)
Chance **por raridade do item**, por kill de mob comum (só rola a raridade que a área permite):

| Raridade | Chance / kill (mob comum) |
|---|---|
| Common | 1.0% |
| Uncommon | 0.6% |
| Rare | 0.3% |

- **Rolls independentes** por raridade (um kill pode, raramente, dropar 2 itens).
- **Elite/raro** (1% dos spawns, sobe por passiva da Fortuna): **×4** nas chances.
- **Boss** (a cada **3.000 kills**): **×7** + enviesa p/ raridade alta + Rare garantido.
- Pace resultante (kills ~0.5/s): áreas 1–3 ~1 drop/3.3min · áreas 8–9 ~1 drop/1.75min.

### 4a-bis. Modelo escalável (Mapas 2+)
A partir do Mapa 2, migrar p/ o padrão da indústria (mais limpo p/ N mapas):
1. **Drop-gate** ("dropou gear?" — uma chance) → 2. **tabela de pesos de raridade = função do TIER da área**.
   - **Teto móvel:** raridade destrava a partir de um tier (já é nosso cap por área).
   - **Piso móvel:** raridade baixa **decai** conforme o tier sobe (mapas fundos param de cuspir Common).
3. Magic Find = 2 stats separados (quantidade vs raridade) com retornos decrescentes.
4. Anti-frustração: **pity** no topo da raridade + **drop garantido no 1º clear** + smart-loot (enviesa pro slot).
Adicionar mapa novo = só plugar um `tier` maior; sem reescrever tabelas.

### 4b. Material (estilo Grand Chase) — melhorar + construir
- **Tiers por profundidade:** T1 (áreas 1–3 / Common) · T2 (4–7 / Uncommon) · T3 (8–9 / Rare).
- **Descarte → material do tier:** Common 1 (T1) · Uncommon 3 (T2) · Rare 8 (T3).
- **Refino entre tiers: 15:1** (sobe um tier).
- **Uso 1 — Melhorar (subir raridade):** gasta material do tier → +1 raridade na peça (+1 afixo do pool + sobe o cap de upgrade).
- **Uso 2 — Construir (Forjar):** gasta **material + Lumens** → cria peça nova do slot escolhido, raridade do tier, afixos sorteados. **Cada tier mais caro** que o anterior.
- Divisão: **Lumens** sobe o NÍVEL da peça (+% afixos); **Material** MUDA a peça (raridade / forja nova).

## Achados da simulação no papel (2026-06-20)
1. ✅ **1ª Convergence ≈ 33 min** no nível 50 (base, AtkSpeed 0.9) — no alvo dos 30 min; `curveDiv ~4.600` validado.
2. 🔴 **Correção crítica:** com `dmgPerLevel ≫ hpPerLevel` o combate virava 1-hit (mob HP segue seu HP, que crescia devagar). **Fix travado: `hpPerLevel = dmgPerLevel`** → hits-pra-matar constantes (1.43–3.61 por área).
3. ✅ Tempo-a-nível (run 1, base): 50≈33min · 100≈1.6h · 300≈8h. Caminho real = ~8 ciclos de Convergence → Mapa 1 ≈ ~5–8h ativas.
4. **Economia:** Lumens/s ≈ 0.25×AtkSpeed×Dano (HP do mob se cancela); ~Pontos de Convergence 2.500 no mapa → dimensionar custos de nó/upgrade a isso.

## Slots & pools de afixo
Ver [eclats_afixos_drop_v1.md](eclats_afixos_drop_v1.md) — 6 slots (Arma/Manoplas/Amuleto/Elmo/Manto/Anel), cada um com primário fixo + pool de secundários, raridade Common(1)→Legendary(5) afixos.

## Status: design do Mapa 1 COMPLETO ✅
Itens 1 (áreas) · 2 (Convergence) · 3a (upgrade) · 3b (afixos) · 3c (passivas) · 4 (drop/material) — todos travados.

## Próximos passos (fora do design do Mapa 1)
- **Custos finos das passivas** (pontos por nó/rank, gates exatos) — calibrar contra os ~2.500 pontos/mapa.
- **Plano de implementação** (quando for pedido): traduzir este design em CPs pequenos.
