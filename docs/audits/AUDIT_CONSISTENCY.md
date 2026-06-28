# Éclats of Lumière — Auditoria de Consistência Arquitetural

> Comparação entre a **especificação consolidada** e a **implementação atual**
> (`src/`). **Nenhum código foi alterado** — este documento é diagnóstico.
> Legenda de status: ✅ Correto · 🟡 Parcial · 🔶 Diferente (conflito) · ❌ Ausente.

---

## 1. Matriz de Aderência (%)

| Sistema / Item | Status | Aderência |
|---|---|---|
| **Filosofia geral** — poder vem da combinação (nenhum domina) | 🔶 | ~45% |
| Recurso: **Lumens** (evoluir Gear) | ✅ | 100% |
| Recurso: **Materiais de Gear** (promoção) | ❌ | 0% |
| Recurso: **Materiais de Awaken** (`awakenEssence`) | 🟡 | 65% |
| Gear: **6 slots + permanente** | ✅ | 100% |
| Gear: **função dos slots** (Weapon/Helmet/Armor/Gloves/Boots/Cloak) | 🔶 | 50% (3/6) |
| Gear: **mesmo custo / cap / curva** | ✅ | 100% |
| Raridades: **apenas Common + Uncommon** | 🔶 | 20% |
| Caps: **Common 500 / Uncommon 1200** | 🟡 | 40% |
| Gear: **Promoção de raridade** | ❌ | 0% |
| Convergence: **só pontos / resets / o que mantém** | ✅ | 95% |
| Convergence: **pacing (descobre na Área 3, 1ª na Área 4)** | 🔶 | 45% |
| Passivas: **Éclat = combate** | 🟡 | 55% |
| Passivas: **Vestige = economia** | 🟡 | 70% |
| Passivas: **Fracture = metaprogressão** | 🔶 | 20% |
| Nível: **acesso / atributos moderados / requisitos** | ✅ | 90% |
| **Sistema defensivo = só HP** (sem armor/dodge/shield) | ✅ | 100% |
| **Sistema ofensivo** (ATK/Crit/CritDmg/AtkSpd/BossDmg/EliteDmg) | 🟡 | 60% |
| Crit Rate **atinge 100%** | ✅ | 100% |
| Attack Speed: **base 0.900 / cap 15 / fonte Boots** | 🔶 | 20% |
| Awaken: **conceito (evolução, não build/reset)** | ✅ | 90% |
| First Light: **impacto ~5×** | 🟡 | 50% |
| First Light: **requisitos (nível+mat+kills+área+conv)** | 🟡 | 55% |
| Mapa 1: **9 áreas** | ✅ | 100% |
| Inimigos: **Comum / Raro** | 🟡 | 75% |
| Inimigos: **Elite** (tier próprio) | 🔶 | 25% |
| Inimigos: **Mini Boss por threshold de kills** | ❌ | 0% |
| Mini Boss: **recompensas (mat. gear/awaken)** | ❌ | 0% |
| Bosses: **Área 1 boss simples** | ❌ | 0% |
| Bosses: **Áreas 2–8 com mini boss + boss próprios** | 🟡 | 50% |
| Bosses: **reaparecem por threshold de kills** | ❌ | 0% |
| Área 9: **1 mini boss aleatório + Boss Final** | 🟡 | 50% |
| Escala **dentro do mapa** (forte) | ✅ | 90% |
| Escala **entre mapas** (moderada, Área 1 jogável) | ⚪ | N/A (só Mapa 1) |

**Aderência global estimada: ~55%.** A *arquitetura de stats em camadas* e os
*eixos de progressão* (run vs conta) estão sólidos. As maiores lacunas são:
**economia de materiais + promoção de raridade**, **estrutura de inimigos
(elite/mini boss/threshold)** e o **papel da árvore Fracture**.

---

## 2. Lista de Divergências (detalhada)

### D1 — Função dos slots de Gear (3 de 6 trocadas) 🔶

1. **Como está:** com raridade **Common** (`affixes: 1`), `buildPiece` usa só o
   **1º afixo** de cada peça. Os primários ativos hoje são:
   Gloves → **Attack Speed** · Boots → **Lumens (economia)** · Cloak → **Crit**.
2. **Como deveria estar:** Gloves → **Crítico** · Boots → **Attack Speed** ·
   Cloak → **Economia**. (Weapon/Helmet/Armor já corretos.)
3. **Impacto:** o atributo que a spec quer em cada peça existe, mas **rotacionado**
   entre 3 slots. Quebra a identidade prometida das peças e desalinha "Boots = fonte
   de Attack Speed".
4. **Complexidade:** **Baixa** — reordenar/reatribuir os afixos primários em
   `gearBase`.

### D2 — Raridades do Mapa 1 🔶

1. **Como está:** 5 raridades — `common, magic, rare, epic, legendary` — caps
   500/600/700/800/1000. Não existe "Uncommon".
2. **Como deveria estar:** apenas **Common (cap 500)** e **Uncommon (cap 1200)**.
3. **Impacto:** o espaço de progressão de raridade do Mapa 1 está modelado errado;
   o teto Uncommon 1200 (o "andar de cima" do Mapa 1) não existe.
4. **Complexidade:** **Baixa** (dados) — mas acoplada a D3 (promoção) e ao loot.

### D3 — Promoção de raridade ❌

1. **Como está:** inexistente. `reconcile()` preserva a raridade salva, mas nada
   promove; não há custo, gate de cap, nem material.
2. **Como deveria estar:** ao atingir o **cap atual**, gastar **Materiais de Gear**
   para promover (Common 500 → Uncommon 500, cap vira 1200, **nível preservado**).
3. **Impacto:** remove um pilar inteiro do loop ("Matar → Materiais → Promover").
   Sem isso o gear satura no cap 500 e morre como fonte de poder.
4. **Complexidade:** **Média** — novo recurso + UI + função de promoção + drop.

### D4 — Materiais de Gear (recurso) ❌

1. **Como está:** não existe. O único material é `awakenEssence`. `loot.js` está
   dormente.
2. **Como deveria estar:** recurso próprio, dropado principalmente por **Mini
   Bosses**, gasto em promoção (D3).
3. **Impacto:** sem ele, D3 não funciona e os Mini Bosses não têm propósito.
4. **Complexidade:** **Média** — campo de estado + fonte de drop + sink.

### D5 — Árvore Fracture: HP vs Metaprogressão 🔶

1. **Como está:** `Fracture` → `hpMult` (multiplica HP). É a árvore de **HP/
   sobrevivência**. As alavancas "utilitárias" (`mobCap`, `enemyReduce`) estão
   **mortas** (sem código que as leia).
2. **Como deveria estar:** `Fracture = Metaprogressão` (Gear, Convergence, Awaken,
   progressão da conta).
3. **Impacto:** **conflito de identidade**. O HP precisa migrar de árvore (a spec
   o lista em Helmet/Armor/Éclat "HP→dano", não em Fracture), e Fracture precisa de
   efeitos de meta (ex.: + pontos de Convergence, + drop de materiais, descontos).
   Hoje não há **nenhuma** passiva de metaprogressão.
4. **Complexidade:** **Alta** — redesenho de árvore + novos efeitos que tocam
   convergence/awaken/gear.

### D6 — Atributos ofensivos Boss Damage / Elite Damage 🟡

1. **Como está:** existem ATK, Crit, Crit Damage, Attack Speed. **Não existe** Boss
   Damage nem Elite Damage no lado do player. (Há `bossHpMult`/`bossDmgMult`, mas
   são do *mob*.)
2. **Como deveria estar:** Boss Damage e Elite Damage como stats ofensivos
   (alimentados por passivas Éclat).
3. **Impacto:** combate sem camadas situacionais; bosses/elites viram só "saco de
   HP". Várias passivas Éclat prometidas não têm onde atuar.
4. **Complexidade:** **Média** — novos stats + hook no cálculo de dano por tipo de
   alvo.

### D7 — Attack Speed (base, cap e fonte) 🔶

1. **Como está:** base `atkSpeed = 1.0`; `attackInterval = clamp(1/aps, 0.1, 5)`
   ⇒ teto **efetivo de 10 aps**; cresce via **Gloves**.
2. **Como deveria estar:** base **0.900**; cap **15 aps**; fonte principal
   **Boots**.
3. **Impacto:** teto e ritmo de progressão do atributo errados; fonte no slot
   errado (liga-se a D1).
4. **Complexidade:** **Baixa** — ajustar base, o clamp e a atribuição de slot.

### D8 — Estrutura de inimigos: Elite + Mini Boss + threshold ❌/🔶

1. **Como está:** mob comum + variantes **Rare (8%)** e **Rare+ (1,2%)**. Bosses
   aparecem **ao atingir o teto de nível** da área (uma vez). **Não há** Elite como
   tier próprio, **nem** Mini Boss, **nem** spawn por threshold de kills, **nem**
   reaparição de boss.
2. **Como deveria estar:** Comum · Raro · **Elite** (chance baixa) · **Mini Boss**
   (por threshold, ex.: 2000 kills) · Boss. Bosses podem **reaparecer** por
   threshold.
3. **Impacto:** falta o motor de **Materiais de Gear** (Mini Boss) e a textura de
   encontros. O "loop de materiais" inteiro depende disto.
4. **Complexidade:** **Alta** — contador de kills, spawner por threshold, tier
   elite, tabela de loot por tipo.

### D9 — Boss da Área 1 ❌

1. **Como está:** `areas[0].boss = null`. A Área 1 libera a próxima ao atingir o
   teto, **sem boss**.
2. **Como deveria estar:** **Boss simples de progressão** na Área 1.
3. **Impacto:** menor — quebra o padrão "toda área tem boss" e o primeiro marco de
   conclusão.
4. **Complexidade:** **Baixa** — definir o boss + arte/fallback.

### D10 — First Light: magnitude e requisitos 🟡

1. **Como está:** bônus `atkMult 2.5 · hpMult 1.5 · lumensBonus +25`. Requisitos:
   `maxAreaUnlocked ≥ 6 (Área 7) · level ≥ 2351 · essence ≥ 50 · lumens ≥ 500k`.
2. **Como deveria estar:** impacto **~5× poder efetivo**; requisitos combinando
   **nível + materiais + kills + área + possivelmente Convergences**. (A spec
   localiza First Light no encerramento do Mapa 1 ⇒ **Área 9**, não 7.)
3. **Impacto:** salto de poder abaixo do alvo (~2,5× dano); gate na área errada;
   faltam requisitos de **kills** e **Convergences**.
4. **Complexidade:** **Baixa–Média** — números + condições extra de `canUnlock`.

### D11 — Pacing de Convergence vs jornada das áreas 🔶

1. **Como está:** `gateLevel = 80`, e a **Área 1 vai até o nível 80** — logo a
   Convergence libera já na transição Área 1→2.
2. **Como deveria estar:** **descobrir** na Área 3, **1ª Convergence** na Área 4.
3. **Impacto:** o jogador encontra o sistema de meta cedo demais, fora da curva de
   aprendizado planejada.
4. **Complexidade:** **Baixa** — alinhar `gateLevel` às faixas de nível das áreas.

### D12 — Drop Rate / loot (Vestige) 🟡

1. **Como está:** `loot.js`/`inventory.js` dormentes; `dropChance` não usado para
   itens. Vestige cobre Lumens, XP e materiais (via `vestige_pull`), mas **não há
   "Drop Rate"** porque não há drops.
2. **Como deveria estar:** economia inclui **Drop Rate** de materiais.
3. **Impacto:** uma alavanca econômica prometida não tem alvo.
4. **Complexidade:** **Baixa** depois de D4 (basta ligar drop de materiais ao
   multiplicador).

---

## 3. Sistemas Ausentes (não existem hoje)

- **Materiais de Gear** (recurso) — D4.
- **Promoção de raridade** — D3.
- **Raridade Uncommon** (cap 1200) — D2.
- **Mini Boss** + **spawn por threshold de kills** + **reaparição de boss** — D8.
- **Tier Elite** como categoria própria — D8.
- **Boss Damage / Elite Damage** (stats ofensivos) — D6.
- **Passivas de Metaprogressão** (Gear/Convergence/Awaken na árvore Fracture) — D5.
- **Boss da Área 1** — D9.
- **HP → Dano** (conversão da Éclat) — não implementado.
- **3 alavancas de passiva mortas** (`enemyPen`, `mobCap`, `enemyReduce`) — efeito
  declarado, sem código que leia (também ausência funcional).

---

## 4. Sistemas Conflitantes (existem, mas divergem)

- **Fracture = HP** vs spec **Fracture = Metaprogressão** (D5). *Maior conflito.*
- **Funções de Gloves/Boots/Cloak** rotacionadas (D1).
- **Conjunto de raridades** (5 vs 2; sem Uncommon) (D2).
- **Attack Speed** base/cap/fonte (D7).
- **First Light** na Área 7 (código) vs Área 9 (spec), e magnitude 2,5× vs ~5×
  (D10).
- **Convergence** disponível ao fim da Área 1 vs Área 3–4 (D11).
- **Variantes de mob** (Rare/Rare+) vs **Raro/Elite** da spec (D8).

---

## 5. Riscos Arquiteturais

1. **R1 — Economia de poder desbalanceada (crítico).** Com gear saturando no cap
   500 (sem Uncommon/promoção) e sem materiais, o poder real do late-game só vem das
   passivas multiplicativas. Isso **viola** o pilar "nenhum sistema domina"
   (passivas dominam; gear é secundário). Corrigir D2–D4 é pré-requisito para
   reequilibrar.
2. **R2 — Loop de materiais inexistente.** Mini Boss → Materiais de Gear → Promoção
   é um pilar do design e está 0% implementado (D3, D4, D8). Sem ele, dois dos três
   loops centrais da Constituição não rodam.
3. **R3 — Identidade da árvore Fracture (acoplamento).** Mudar Fracture para
   metaprogressão mexe em HP (precisa de novo lar) **e** cria dependências com
   convergence/awaken/gear. É a mudança de maior raio de impacto (D5).
4. **R4 — Passivas com efeito fantasma.** Nós com nome de mecânica que não existe e
   3 alavancas mortas → jogador gasta pontos sem retorno (armadilha de progressão).
5. **R5 — Curva de TTK fora dos alvos.** A spec fixa TTK (mob 1–3s, elite 10–20s,
   mini boss 30–60s, boss 1–3min), mas hoje o TTK estoura a partir da Área 3 sem
   passivas (ver auditoria de balanceamento). Risco de "travar" — proibido pela
   Regra obrigatória.
6. **R6 — Conteúdo prometido sem hooks.** Elite/Mini Boss/threshold exigem
   infra nova (contador de kills, spawner). Adiar aumenta o custo de retrofit.

---

## 6. Ordem Recomendada de Correção

> Da fundação econômica para o conteúdo, minimizando retrabalho.

1. **Fundação de recursos** — implementar **Materiais de Gear** (D4) e **Drop Rate**
   como hooks (D12). *Baixa/Média.*
2. **Raridade + Promoção** — reduzir para **Common/Uncommon** com caps 500/1200 e a
   mecânica de **promoção** preservando nível (D2, D3). *Baixa/Média.*
3. **Correções rápidas de identidade** — afixos de slot (D1), Attack Speed base/cap/
   fonte (D7), boss da Área 1 (D9), pacing de Convergence (D11). *Baixa.*
4. **Estrutura de inimigos** — contador de kills + **Mini Boss por threshold** +
   **tier Elite** + recompensas; reaparição de boss (D8). *Alta.*
5. **Stats ofensivos situacionais** — **Boss Damage / Elite Damage** + hook de dano
   por tipo de alvo (D6). *Média.*
6. **Redesenho de passivas** — **Fracture → Metaprogressão**, realocar HP, implementar
   alavancas mortas e remover efeitos fantasma; ligar "HP→dano" na Éclat (D5, R4).
   *Alta.*
7. **First Light** — realinhar gate para a **Área 9**, impacto **~5×** e requisitos
   (kills/convergences) (D10). *Baixa/Média.*
8. **Recalibração final (Fase 3)** — planilhas de HP/DPS/custos/convergence para
   bater os **TTK alvo** (R5).

---

## 7. Itens que Exigem Decisão de Design (antes de implementar)

1. **Onde vive o HP nas passivas?** Se Fracture vira metaprogressão, o HP migra para
   Éclat (defensivo?), para os slots de gear (Helmet/Armor já dão), ou para um 4º
   eixo? *(Decisão estrutural — bloqueia D5.)*
2. **O que exatamente faz "metaprogressão" como bônus de passiva?** Ex.: +% Pontos de
   Convergence, +% drop de Materiais de Awaken, desconto em promoção, redução de
   requisitos. Precisa de uma lista canônica de efeitos.
3. **Threshold de Mini Boss é global ou por área?** Reseta na Convergence? Conta só
   mobs comuns ou tudo? *(Define o spawner de D8.)*
4. **Reaparição de boss por threshold** coexiste com o boss de "teto de área"? Qual
   recompensa em cada caso (progressão vs farm)?
5. **Mapeamento Rare/Rare+ → Raro/Elite:** renomear/reusar as variantes atuais ou
   criar Elite como categoria nova com regras próprias?
6. **Promoção: custo e fonte.** Quantos Materiais de Gear por promoção? Drop fixo do
   Mini Boss ou acumulado? Há promoção além de Uncommon no Mapa 1? (spec diz que não.)
7. **First Light na Área 9:** confirmar a mudança de gate (hoje Área 7) e se passa a
   **exigir N Convergences** explicitamente.
8. **Attack Speed:** cap 15 aps exige afrouxar o `clamp` de `attackInterval` (hoje
   teto 10). Confirmar 15 como alvo e o impacto no ritmo de combate/score.
9. **XP tem peso real?** Vestige multiplica XP, mas level-up é linear/barato. Decidir
   se XP importa ou se Vestige foca em Lumens/Materiais.

---

### Resumo executivo

A **espinha dorsal** (camadas de stat, run-vs-conta, 6 peças permanentes, HP como
único eixo defensivo, Convergence = só pontos) está **fiel** à spec. As lacunas são
de **conteúdo e economia**: materiais + promoção + raridade Uncommon, estrutura de
inimigos (elite/mini boss/threshold) e o **novo papel da Fracture**. Recomenda-se
construir a **fundação econômica primeiro** (recursos → raridade/promoção), depois o
**conteúdo de inimigos**, e por último o **redesenho de passivas** e a
**recalibração matemática** da Fase 3.
