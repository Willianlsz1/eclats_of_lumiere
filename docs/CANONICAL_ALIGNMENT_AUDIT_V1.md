# CANONICAL_ALIGNMENT_AUDIT_V1

> Auditoria **read-only** que unifica a visão do **GDD original** (jun/2026, commit
> raiz) com a **arquitetura moderna** (implementada nesta sessão + docs `_V1`
> recentes). Nenhum dos lados é tratado como correto a priori. O critério único é:
> **o que melhor serve à identidade final de Éclats of Lumière.**

## Mapa do terreno (3 camadas, não 2)

A pergunta "original vs recente" esconde que existem **três** estados:

1. **GDD original** — Ascension-prestige, Gatekeepers, Séraphine, **Éclats**,
   **Vestiges**, **Mémoires mecânicas (Clarté)**, **Despertar** (3 camadas, ×5/tier).
2. **Código implementado** — Convergence (gate por nível → Passivas), Passivas
   (3 árvores), Economia (Lumens + materiais), Gear/Promoção, Inimigos, **Awaken**
   (First Light, requisitos, bônus), `data.tiers` (ranks por nível, só display).
3. **Docs `_V1` recentes** — Ascension narrativa (rank+visual+Mémoire+bônus pequeno),
   Mémoires **puramente narrativas** (3/mapa).

> Achado: o **Awaken implementado já é, na prática, um Despertar simplificado**
> (marco permanente com requisitos + bônus). E os docs recentes de Ascension/
> Mémoires **ainda não estão no código** — são propostas. Então a reconciliação
> real é: *visão original × execução moderna*, não *doc velho × doc novo*.

---

## Veredito por sistema

### 1. Ascension — **ADAPTAR (híbrido)**

| | GDD original | Recente |
|---|---|---|
| Papel | 2º prestige (reseta+amplifica a Convergence) | marco narrativo |
| Entrega | Gatekeeper, bolsa de Éclats, asc_mult, Séraphine | rank, visual, 3 Mémoires, bônus pequeno |

- **Permanece (do recente):** rank por Ascension, transformação visual, entrega das
  Mémoires da era, **bônus pequeno** (a disciplina "não competir com poder" é
  correta — Ascension é marco, não bomba de dano).
- **Volta (do original):** **Séraphine** (a cerimônia precisa de rosto), o
  **Gatekeeper por Ascension** (cada marco entrega um *brinquedo novo*, não um
  número), e o papel de **portão da economia de Éclats/Mémoires da era**.
- **Sai (do original):** Ascension como **resetter/amplificador da Convergence**
  (prestige aninhado) — redundante agora que a Convergence é standalone e gateada
  por nível. E o `asc_mult ×16` como camada de poder grande.
- **Canônico:** **estrutura recente + Séraphine + Gatekeeper + gating das Mémoires.**
  Ascension = o *ato institucional* que reconhece o que o Despertar (a luz) já fez.

### 2. Awaken / Despertar — **ADAPTAR + RESTAURAR identidade**

| | GDD original | Atual |
|---|---|---|
| Conceito | mudança de classe (T1→T5, ×5/tier), **meio do mapa** | marco genérico "Awaken" (First Light) |
| Gate | Guardião + **Nitzotzot** + Tributo (3 camadas) | requisitos area/level/kills/conv/material |

- **O conceito original é melhor** e a lore o sustenta explicitamente:
  *"Awaken ≠ Ascension. O Awakening é o que a luz faz (meio do mapa); a Ascension é
  o ato institucional que certifica, atrasado, o que a luz já fez."* Os dois
  **coexistem** — o moderno os colapsou.
- **O sistema atual NÃO descaracterizou — simplificou.** O Awaken implementado
  (requisitos + persistência + bônus + `awakenTier`) é **boa infraestrutura** e
  serve como **motor do Despertar**. Falta: re-enquadrar como tier de classe
  (T1→T5), devolver o salto de poder **por tier** (o ×N), a arte/visual e o **ritual
  de 3 camadas** (Prova/Oferenda/Tributo) com o material dedicado **Nitzotzot**.
- **Preservar:** a infra de requisitos configuráveis e persistência (já testada).
- **Restaurar:** identidade de "mudança de classe" + Nitzotzot + as 5 tiers
  (Seeker→Lumière como **tiers de Despertar**, não como ranks por nível).
- **Canônico:** **Despertar = poder+visual+tier** (a luz); **Ascension = rank+
  cerimônia** (a Ordre). Aposentar `data.tiers` por nível.

### 3. Mémoires — **RESTAURAR a fusão (mecânica + narrativa)**

| | GDD original | Recente |
|---|---|---|
| Natureza | **motor (Clarté) + narrativa** | só narrativa |
| Moeda | **Éclats** | nenhuma |
| Cadência | 3/era | 3/mapa |

- **Devem voltar a ser motor de progressão? — SIM.** É a **assinatura** do jogo:
  *"a meta-progressão é o veículo da narrativa."* Comprar um multiplicador permanente
  **é** revelar um pedaço da verdade. Separar as duas coisas (versão recente)
  produz um idle genérico com história colada por cima — e foi exatamente o **maior
  buraco** apontado no `LORE_GAMEPLAY_AUDIT` (Mémoires/Éclats sem mecânica).
- **Clarté deve voltar? — SIM**, como o **motor global sem teto** (×`1.07^Σníveis`),
  com **tema próprio** (Passivas = mecânicas/alavancas; Mémoires = multiplicadores
  globais amplos). Sem sobreposição se cada camada mantém seu tema.
- **Éclats devem voltar? — SIM** (ver §4).
- **Cadência:** 3/era e 3/mapa **não conflitam** (5 mapas = 5 eras). Manter **3 por
  mapa/era**.
- **Melhor dos dois:** **motor + moeda + nomes franceses do original** como sistema;
  **o arco de revelação por mapa do recente** (pergunta→resposta, "A Primeira
  Dúvida", "A Semente"…) como **conteúdo narrativo** — ele é mais bem estruturado
  emocionalmente que os nomes-relíquia secos do original.

### 4. Éclats — **RESTAURAR (essenciais, não redundantes)**

- **Devem voltar? — SIM.** O jogo se chama *Éclats* of Lumière; o ato central é
  **juntar fragmentos com memória**. Remover Éclats é remover o substantivo do
  título do gameplay.
- **Em qual papel:** **moeda da memória** — gasta nas **Mémoires**; dropada por
  bosses/mini-bosses/elites (fonte already-built no `economy.js`). Permanente
  (sobrevive à Convergence).
- **Redundantes? — Não.** Hoje o código tem **Lumens** (run) e **Convergence
  Points** (passivas). Éclats ocupam um **terceiro papel distinto** (memória/
  narrativa). A hierarquia das 3 moedas (lore) resolve a confusão "por que 4
  moedas" dando a cada uma um significado.

### 5. Gatekeepers — **RESTAURAR seletivamente (roadmap)**

- **Devem voltar? — SIM, o conceito.** "1 game-changer por Ascension" é o que dá a
  cada marco um **brinquedo novo** — exatamente o que o "bônus pequeno" recente não
  entrega. Cada Ascension deixa de ser "+número" e vira "+capacidade".
- **Ainda fazem sentido?** A escada original é sólida: **A1 Ritmo** (automação/auto-
  converge — o mais valioso cedo) · **A2 Vigília** (dificuldades) · **A3 Eco**
  (farm em 2º plano) · **A4 Cap global** (mais mobs) · **A5 Transcendência**.
- **Adaptar:** restaurar a **estrutura** (1 mecânica/Ascension) e o **A1 (automação)**
  já; os pesados (dificuldades, eco, transcendência) ficam como **conteúdo dos
  Maps 2–5** (deferidos, como já fazemos com `moreEnemies/gearXp`).

### 6. Séraphine — **RESTAURAR**

- **Deve voltar? — SIM.** Custo baixo, identidade alta.
- **Função narrativa:** a **Doyenne de l'Ordre**, vidente vendada que "vê a luz por
  dentro" (eco do Premier Éclat que lembra sem ver) — dá rosto e gravitas à
  Ascension; é o reconhecimento institucional em pessoa.
- **Função sistêmica:** o **NPC da tela de Ascension** (mesma "house style" de
  Maël/Lucius). Sem ela, "subir de rank" é uma tela sem alma.

### 7. Hierarquia das moedas — **RESTAURAR como modelo canônico**

`Lumens < Vestiges < Éclats` = `posse < essência < memória`.

- **Continua forte/necessária/coerente? — SIM nos três.** É o modelo mais limpo e
  **perfeitamente lore-backed** (cada moeda tem um significado cosmológico).
- **Mapeamento ao código atual:**
  | Lore | Papel | Hoje no código |
  |---|---|---|
  | **Lumens** | run/gear, **temporária** (dispersa na Convergence) | ✓ Lumens |
  | **Vestiges** | permanente, compra **Passivas/Ascension** | = "Convergence Points" (reenquadrar) |
  | **Éclats** | permanente, compra **Mémoires** | ✗ restaurar |
- **Decisão pendente:** renomear "Convergence Points" → **Vestiges** (alinha à lore)
  ou manter o nome mecânico. Recomendo **Vestiges**.

### 8. Identidade do projeto — **a VISÃO ORIGINAL vence**

> **"Meta-progressão = narrativa" representa melhor Éclats of Lumière.**

Justificativa: o jogo é, no osso, *sobre reunir fragmentos que carregam memória*.
Quando o jogador **gasta Éclats numa Mémoire e ganha poder permanente + um pedaço
da verdade no mesmo gesto**, a mecânica e a emoção viram **um ato só** — algo raro
e memorável. A versão recente (narrativa **separada** da meta-progressão) é mais
fácil de balancear, mas é **genérica**: poderia ser qualquer idle com lore colada.
A fusão é o que torna o jogo *este* jogo. (O `LORE_GAMEPLAY_AUDIT` chegou
independentemente à mesma conclusão: o maior buraco era justamente Mémoires/Éclats
sem mecânica.)

**Mas:** a **disciplina da arquitetura moderna** (camadas com tema próprio, "nenhum
sistema domina", infra+testes, compat de saves) é o **modo certo de construir**.
⇒ **Visão original · execução moderna.**

---

## Entregáveis

### 1. Sistema por sistema

| Sistema | Decisão |
|---|---|
| **Convergence** (gate nível → Vestiges → Passivas) | **MANTER** (moderno) |
| **Passivas** (3 árvores, infra de efeitos) | **MANTER** (moderno) |
| **Economia/Materiais/Promoção/Inimigos** | **MANTER** (moderno) |
| **Awaken implementado** | **ADAPTAR** → vira motor do **Despertar** |
| **Despertar** (tier/classe, Nitzotzot, ritual 3 camadas, ×poder/tier) | **RESTAURAR** |
| **Ascension** | **ADAPTAR** (recente + Séraphine + Gatekeeper + gating de Mémoires) |
| **Mémoires** (mecânica + narrativa, Clarté) | **RESTAURAR** (fundindo com o arco narrativo recente) |
| **Éclats** (moeda da memória) | **RESTAURAR** |
| **Vestiges** (moeda permanente = CP reenquadrado) | **RESTAURAR/ADAPTAR** |
| **Gatekeepers** | **RESTAURAR** (A1 já; A2–A5 deferidos p/ Maps 2–5) |
| **Séraphine** | **RESTAURAR** |
| **`data.tiers` (rank por nível)** | **REMOVER** (rank migra p/ Despertar/Ascension) |
| Ascension-reseta/amplifica-Convergence | **REMOVER** (redundante) |
| asc_mult ×16 como camada grande | **REMOVER** (Ascension fica leve) |

### 2. Elementos do GDD original que devem VOLTAR
Éclats · Vestiges · hierarquia das 3 moedas · Mémoires mecânicas (Clarté, motor
global sem teto) · nomes franceses das 15 Mémoires · Despertar (tier/classe + ritual
3 camadas + Nitzotzot + ×poder/tier) · Gatekeepers (1/Ascension) · Séraphine.

### 3. Elementos modernos que devem PERMANECER
Convergence standalone gateada por nível · Passivas (3 árvores + infra de efeitos +
deferidos Mapa 2) · Economia/drops por tipo · Materiais (common/uncommon) + Promoção
· estrutura de Inimigos (Elite/MiniBoss/threshold) · a **infra do Awaken**
(requisitos/persistência/compat/testes) como base do Despertar · o **arco narrativo
por mapa** das Mémoires (perguntas→respostas) · a disciplina "nenhum sistema domina"
+ infra+testes+migração de saves.

### 4. Conflitos reais (a resolver)
1. **Dono do rank:** `data.tiers` (nível) × Ascension (recente) × Despertar (original)
   → **Despertar = poder/visual/tier; Ascension = título/cerimônia; aposentar tiers
   por nível.**
2. **Natureza das Mémoires:** mecânica × narrativa → **fusão (mecânica + narrativa).**
3. **Moeda da meta:** Convergence Points × Éclats/Vestiges → **hierarquia de 3 moedas;
   CP→Vestiges; Éclats p/ Mémoires.**
4. **Contagem de camadas de poder:** Gear+Passivas+Despertar+Convergence+Mémoires+
   Ascension corre risco de inchaço → **resolver por TEMA distinto por camada**
   (Gear=bruto · Passivas=mecânicas · Mémoires=motor global · Convergence=bola de
   neve · Despertar=salto de tier · Ascension=marco leve) + **restrição** (Ascension
   pequena; Mémoires = o motor global).
5. **Papel da Convergence:** original a fazia ser resetada pela Ascension → **manter
   a Convergence moderna standalone; Ascension NÃO a reseta.**
6. **Cadência das Mémoires:** 3/era × 3/mapa → **sem conflito (mapa = era).**

### 5. Documento canônico recomendado
Criar **`CANON_V2`** (substituindo os `_V1` de Ascension/Mémoires) com:
estados-alvo dos 6 sistemas abaixo + hierarquia de moedas + tabela de Despertar
(tiers) + tabela das 15 Mémoires (efeito **e** texto narrativo por mapa) + escada de
Gatekeepers + ficha da Séraphine. Marcar números como placeholders (Fase de
balanceamento). Aposentar `ASCENSION_SYSTEM_V1` e `MEMOIRES_MASTER_PLAN_V1` como
*superseded* (mantidos como histórico).

### 6. Visão final consolidada

- **Ascension** — marco **leve** de fim-de-mapa, presidido por **Séraphine**:
  confere **rank**, **transformação visual**, libera as **3 Mémoires da era**,
  desbloqueia **1 Gatekeeper** e dá um **bônus pequeno**. NÃO reseta a Convergence.
- **Despertar (Awaken)** — **mudança de classe por tier** (Seeker→Lumière), no meio
  do mapa, salto de **poder+visual** por tier, gate de **3 camadas** (Prova/
  Oferenda **Nitzotzot**/Tributo). Usa a infra de Awaken já implementada.
- **Mémoires** — **15 (3/mapa)**, compradas com **Éclats**, **motor global
  (Clarté ×1.07^Σ)** **+** a revelação narrativa por mapa. A assinatura do jogo.
- **Éclats** — moeda **permanente da memória**, dropada por bosses/elites, gasta nas
  Mémoires. O recurso-título.
- **Gatekeepers** — **1 game-changer por Ascension** (A1 automação agora; A2–A5
  como conteúdo dos Maps 2–5).
- **Séraphine** — **NPC** da tela de Ascension; a vidente vendada que reconhece o
  Seeker.
- **Moedas** — **Lumens (run) < Vestiges (permanente/Passivas) < Éclats (Mémoires)**.

### 7. Nota final — qual versão representa melhor Éclats of Lumière?

> **A versão ORIGINAL — onde a meta-progressão É a narrativa — representa melhor
> Éclats of Lumière.** Ela transforma o loop de poder no veículo da verdade do
> mundo, o que nenhum outro idle faz da mesma forma e o que o título do jogo promete.
> A arquitetura moderna não deve ser descartada: ela é o **rigor de construção** que
> faltava ao GDD (camadas com tema, sem dominância, infra+testes). O canon correto
> não é escolher um lado — é **construir a alma do GDD original com a disciplina da
> arquitetura moderna.**
