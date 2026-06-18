# Éclats of Lumière — CONTEXT (glossário canônico)

Glossário da linguagem do projeto. **Não é spec nem scratchpad** — só define termos.
Fórmulas/números moram em `docs/ESTADO_DO_JOGO.md` e `src/data/constants.js`.

## Termos

### Jogo base (Base game)
Os **5 mapas** atuais (The Dreaming Wood → Nil Aeternum), de A1 a A5. É o que se
chama de "o início": a fatia que um jogador novo percorre antes do endgame.
**Alvo de duração: ~30 dias para o jogador casual** (hoje a calibração mira ~15d —
a meta é aprofundar/repacear até ~30d, sem adicionar mapas novos). Decidido 2026-06-13.

### Endgame
O que vem **depois** do Jogo base (prestige / loop infinito / conteúdo repetível).
Fora do escopo dos "30 dias do início"; desenhado à parte.

### Escala de números (decidido 2026-06-14, revisa o "teto 1e100")
- **Normal (Jogo base):** dano/HP vão de ~7 a **~1e45** ao longo dos 5 mapas (≈**44
  décadas** = o **orçamento de poder** a distribuir). Curva de HP por mapa: 1e6 · 1e14 ·
  1e24 · 1e35 · **1e45**.
- **Dificuldades** (endgame) multiplicam por cima: ~**1e70** → ~**1e190** → ~**1e280**,
  usando o range do float até **~1e308**.
- **break_infinity:** só **acima de 1e308** (futuro). O antigo "teto 1e100" era
  conservador — o float aguenta até ~1e308, e as dificuldades usam isso.

### Termos APOSENTADOS (saindo do projeto — ADR 0001, 2026-06-14)
- **Gold Stats** — compra manual de str/vit/agi/lck/frt/wis com Lumens. Removido
  ("ação repetitiva demais"). Lumens → nível do Gear. O papel de **dial base de
  dano/HP** migra principalmente para a **Convergence redesenhada** (+15%/conv).

### Nível / Level (motor de stat base — decidido 2026-06-14)
Substitui os Gold Stats. Cada **nível** (de XP/kills) dá **stat FLAT automático** — ex.:
**+10 dano/nível**, **+vida/nível**, **+3 gold(Lumens) base/nível** (números semente).
Sem compra manual de stat. Subir de nível = ficar mais forte, direto.

### Convergence (redesenhada — decidido 2026-06-14)
Volta ao projeto, **sem o reset/backtrack que incomodava**. Não te manda pro início do mapa.
- **Gate por nível:** a 1ª exige atingir um **nível** (ex.: **40**); o alvo **sobe** a
  cada convergência.
- **Recompensa:** **+15% permanente** a **dano / vida / XP / Lumens**.
- **O que reseta:** o **nível/XP da run** (você re-sobe de uma base +15% mais forte) **e
  o NÍVEL do Gear** (o que veio de Lumens). **A RARIDADE do Gear (materiais do Hollow)
  NUNCA reseta** — o poder do Hollow é permanente. **A posição no mapa NUNCA reseta.**
- **Ascension multiplica** o efeito acumulado das Convergences. Ver "Ascension".

### Gatekeeper (escada fechada — decidido 2026-06-14)
Faculdade despertada a cada Ascension (A1-A5). Recompensa = **automação/QoL + ×poder**.
Tema canônico: quanto mais alto, mais a luz automatiza por você.
- **A1 — O Ritmo:** Convergence não reseta níveis do Gear **+ auto-Convergence**.
- **A2 — A Vigília:** desbloqueia **dificuldades dos Hollows** (mais duro → mais
  materiais / Reliquat melhor).
- **A3 — O Echo:** **farm idle paralelo** num mapa já limpo (renda extra, inclui offline).
- **A4 — A Atração:** **+mobs na tela** (com cleave = +renda por golpe) **+ auto-cast
  das habilidades**. ⚠️ o "+mobs" vive AQUI, **não** nas passivas (colisão resolvida).
- **A5 — A Transcendência:** **portal pro Endgame** (prestige/loop infinito) — pós-MVP.

### Ascension (meta-multiplicador)
Marco por mapa (vencer o boss final / **Wall** + pagar Vestiges) → comissiona ao próximo
mapa + desperta um **Gatekeeper**. **Redesenho 2026-06-14:** a Ascension **multiplica**
tanto as **Convergences** quanto os **bônus de Awaken/Despertar** (ex.: Awaken dá +50%
de dano base → Ascension multiplica ×10). Estrutura **composta**: Awaken×Asc e
Conv×Asc crescem em camadas. **Gatekeeper** dá recompensa **automação/QoL + ×poder**.

### Habilidade (Active Ability)
Efeito **acionado pelo jogador** com **cooldown** (ex.: burst em boss, buff temporário),
estilo Tap Titans 2. É a **camada ativa** sobre o combate, que continua **automático**
(idle-first). NÃO é ação em tempo real. Sistema NOVO (ainda não existe no código).
Distinto de **Passiva** (bônus permanente, comprado com Vestiges) e de **Gatekeeper**
(faculdade desbloqueada por Ascension). Decidido 2026-06-13.
**Fonte (decidido 2026-06-14):** vêm do **Despertar/Awaken** — **1 por despertar**. Como
o tier vai T1→T5 = **4 despertares**, são **4 habilidades** (encaixe exato, sem sobra).
**Todas usáveis** (sem loadout, sem árvore). Desenhadas pra **NÃO duplicar as passivas**
(foco em controle/momento ativo). NÃO confundir com **Gatekeeper** (automação, da Ascension).
**As 4 (efeitos fechados 2026-06-14, refs Grand Chase/TT2):**
- **Surto** (burst): nuke instantâneo em toda a tela **+ dano extra no alvo de maior HP** (quebra Wall).
- **Torpor** (controle): **congela** os inimigos por X s **e congelados recebem +dano**.
- **Maré Dourada** (farm): janela de X s com **×TODO o loot** (Lumens/XP/Vestiges/materiais).
- **Égide** (defesa): **invulnerabilidade + cura** por X s (botão de pânico).
**Fuel:** **todas em cooldown**, manual; **auto-cast** depois via **Gatekeeper A4**. (Sem
Ultimate, sem barra-Chaser — descartados; 4 bastam.) Números = calibração.

### Combate — base SINGLE-TARGET; CLEAVE é unlock (ADR 0002, revisado 2026-06-14)
**Base = single-target:** cada ataque atinge **1 mob**; vale a âncora **"máx 1 kill por
ataque" → kill rate ≤ APS** (ancora a economia base). O **CLEAVE/AoE** (atingir vários/
todos) é **DESBLOQUEÁVEL** por passiva/mecânica (estilo Gaiadon: começa em 1, libera
multi-alvo depois); quando ligado, **excede** o teto de kills. No código:
`cleaveTargets()` = 1 no base; >1 quando desbloqueado (⏳ unlock a wirar). **A Wall** =
HP do mob/boss maior que o seu dano por hit.

### Avanço é escolha do jogador (decidido 2026-06-14)
**"Sempre pra frente" = sem backtrack/reset**, NÃO auto-avanço. O mapa **farma sozinho
na posição atual** (renda idle); **o jogador decide** quando empurrar pra próxima
sub-área / tentar a Wall, ou ficar farmando onde está. Nunca é mandado pra trás; só não
é empurrado pra frente. Gera a decisão idle clássica: **"melhor ponto pra farmar"** —
ficar onde limpa fácil (rápido) vs empurrar fundo (mais valor/kill, mais lento).

### Wall (Parede)
Um **check de poder** no avanço. Mecanicamente: **HP do mob/boss maior que o seu dano
por hit** (você não derruba a onda/boss a tempo). A **Wall principal de cada mapa é o
BOSS FINAL**, que
**fecha a passagem para o mapa seguinte**: você só cruza quando tiver gear suficiente
(farmado no **Hollow**). Dentro do mapa, os **Guardiões de sub-área** são travas
menores. É o **principal dispositivo de pacing** do Jogo base (substitui a parede de XP
da Convergence). O jogo avança **sempre pra frente** — sem reset/backtrack. Ver ADR 0001.

### Sub-áreas (depth do mapa)
Cada mapa é dividido em sub-áreas que o jogador atravessa em ordem. **Hoje: 5 por mapa.
Alvo novo: 7-8 por mapa** (decidido 2026-06-14) — mais profundidade por mapa ajuda a
esticar o Jogo base até ~30 dias. Cada sub-área termina num **Guardião**; a última leva
ao **boss final / Wall** do mapa. (Muda a malha geométrica de HP/level — recalibrar.)

### Hollow (dungeon)
Já canônico na lore (Parte VIII-B): bolsão de Nil Aeternum por uma fissura, território
de um **nobre da corte do Nada**, **mais difícil e repetível**, **fonte de gear/Reliquats
exclusivos**. Mecanicamente: é a **atividade ativa** que o jogador escolhe mergulhar
para **farmar gear/materiais e quebrar uma Wall**. O **mapa principal é a renda idle**;
o Hollow é o **objetivo ativo**. (Regra de cor: o vermelho fora do Map 5 só aparece
dentro de um Hollow.) Ver ADR 0001.

**Como roda (decidido 2026-06-14):** é uma **instância de combate** — o jogador *entra*
e o **mesmo motor de combate** (sem engine novo) atravessa **andares de ondas até o nobre
(boss do Hollow)**; limpar **dropa gear/material**; **repetível**. O mapa principal
**pausa** enquanto o jogador está dentro (atividade focada/online; offline = mapa idle).

**Estrutura interna (decidido 2026-06-14):** **número FIXO de andares** (ex.: ~5, a
calibrar), cada andar mais forte que o anterior, e o **NOBRE sempre no final** (boss-clímax
da run). Repetível. O **eixo infinito do farm é a DIFICULDADE** (Normal → Nightmare →
Tormento → …, do Gatekeeper A2), que multiplica HP/dano/recompensa do Hollow inteiro —
**não** há andares infinitos. Profundidade fixa; dificuldade cresce sem teto.

**Divisão econômica (decidido 2026-06-14):** **mapa principal = moedas** (Lumens →
*nível* do Gear; Vestiges → Passivas/Ascension; drip de Éclats → Mémoires). **Hollow =
materiais + gear exclusivo do nobre** (→ *raridade* do Gear, os saltos que quebram a
Wall). O Gear precisa das **duas metades**, então mapa (idle) e Hollow (ativo) se
alternam. O sistema de **Craft/Materiais** já desenhado **permanece**.

**Quantidade + raridade por mapa (revisado 2026-06-14):** **Hollows só do Map 2 pra
frente — 4 no total (M2, M3, M4, M5)**. **Map 1 NÃO tem Hollow** (você joga só no
**Faded**, levelando com Lumens). Cada Hollow dropa o **material específico** que sobe
**uma raridade**, encaixe 1:1 com as 5 raridades:
- Map 1 (sem Hollow): **Faded** (só level).
- Map 2 Hollow: Faded → **Kindled** · Map 3: → **Luminous** · Map 4: → **Radiant** ·
  Map 5: → **Converged** (topo).
Cada Hollow também dropa um **acessório/Reliquat** (a definir em passo próprio).

### Gear — duas camadas (decidido 2026-06-14)
- **Camada 1 — as 6 peças-núcleo** (Waning Edge, Silent Vigil, Veil of Cinders, Grasp
  of the Unnamed, Last Resonance, Band of Dusk). *O que você é.* Crescem por **nível**
  (Lumens, do mapa) e **raridade** (materiais, do **Hollow** — Faded no Map 1, sobe um
  tier por Hollow M2-M5 até Converged; as **30 artes** já feitas). É o **poder que quebra
  a Wall**. **Afixos — modelo GAIADON (revisado 2026-06-14):** cada afixo de stat tem
  **3 camadas LINEARES que MULTIPLICAM** — **Primary** (flat) × **Bonus%** (Mastery) ×
  **×Multiplier** — dando crescimento **polinomial** (~nível³). **SEM cap de nível**
  (safety 1e9 anti-overflow); o **CUSTO é o freio**: `costMult` escala por tier
  (`[1,1e8,1e18,1e29,1e39]`) acompanhando a renda do mapa (~1e44 no Map 5), então upar
  freia consistente em todo mapa (~10K nv/min). **Rarity-up gateado SÓ por material do
  Hollow** (sem requisito de nível). Números = calibração por CUSTO, não por cap.
- **Camada 2 — Reliquats** (2ª aba do Gear). *O que você venceu.* **Slots NOVOS de
  acessório** (brincos, colar, asas, etc.); cada **Hollow/nobre** dropa **1 Reliquat
  exclusivo** (troféu com arte própria). 5 no Jogo base (um por mapa).

### Reliquat (≠ Mémoire ≠ "relíquia")
Canon (lore Parte VI-B, Camada 2): gear-troféu dropado dos nobres vencidos. **É a 2ª aba
do Gear.** ⚠️ **Não confundir** com **Mémoire** (relíquia da meta-progressão, tela das
15, moeda Éclats). "Relíquia" genérico fica **proibido** como termo de sistema — usar
**Reliquat** (gear do Hollow) ou **Mémoire** (meta). Decidido 2026-06-14.
**Modelo de poder (híbrido):** cada Reliquat soma um **bônus permanente pequeno**
(coleciona e mantém) **+ um bônus local forte** na região/Hollow de origem (gancho com
o Echo). As **6 peças seguem como eixo** que quebra walls; Reliquats = eixo de coleção.

### Mémoire (≠ Reliquat)
A meta-progressão profunda (moeda **Éclats**, tela das 15). Modelo **Artifacts do TT2**:
fortes, **max-all** (sem escassez dolorosa). **Princípio canônico (2026-06-14):** cada
Mémoire é uma **knob GLOBAL ou META** — multiplica uma **categoria inteira** (todo dano /
toda economia / todos os Éclats) **ou amplifica outro sistema** (×Convergence, ×Gear,
×Hollow, ×Ascension, ×habilidades, ×todas as Mémoires). **Nunca duplica uma Passiva** (que
é granular). ≠ **Reliquat** (gear-troféu do Hollow). Os 15 efeitos: ver redesign doc.

### ~~Loadout~~ (APOSENTADO 2026-06-14)
Ideia descartada. Com apenas **~5 habilidades** (uma por Despertar), não há pool maior
que slots, então não há loadout/escolha de composição. A profundidade das Habilidades
fica em **usar bem** (timing/burst) e **evoluir** cada uma, não em montar conjunto.
