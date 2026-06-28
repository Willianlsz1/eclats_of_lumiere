# LORE ↔ GAMEPLAY — Auditoria de Consistência

> Auditoria **read-only**. Não reescreve a lore nem altera sistemas. Cruza a
> *Lore Bible* (`docs/lore/eclats_lore.md`) com o gameplay implementado (`src/`).
> Contexto importante: a própria lore (Parte IX) avisa que **os sistemas de jogo
> foram refeitos do zero** e "não correspondem mais" ao texto narrativo — então
> várias divergências aqui são **conhecidas/pendentes**, não pontos cegos.

---

## 1. Nota de integração Lore ↔ Gameplay: **60 / 100**

O **esqueleto** está surpreendentemente alinhado (ranks da Ordre existem nos dados,
boss final do Mapa 1 = Gilded Hollow, sequência de mapas ancorada em Ashen
King/Claimed Queen/Nihel, árvores de passiva com nomes da lore). O que derruba a
nota é o **enquadramento**: a Convergence narrativa (clímax único em Nil Aeternum)
virou o loop rotineiro do early-game; os ranks da Ordre se esgotam na Área 1–2; e
três pilares da lore — **Mémoires, o twist de Nihel, e a escala de poder** — não
têm representação no jogo.

| Item | Alinhamento | Severidade do gap |
|---|---|---|
| 1. Convergence | Mecânica casa com o tema, mas o *timing* conflita | 🟠 Alta |
| 2. Awaken | Tema encaixa; sem nenhuma âncora na lore | 🟡 Média |
| 3. Ranks da Ordre | Existem e batem — mas consumidos cedo demais | 🔴 Alta |
| 4. Mémoires | Premissa central da lore, **zero** no jogo | 🟠 Média-Alta |
| 5. Escala de poder | Numérica sem motivação narrativa | 🟡 Média |
| 6. Progressão dos mapas | Esqueleto alinhado; taxonomia ausente | 🟡 Média |
| 7. Nihel | Antagonista central **invisível** no Mapa 1 | 🟠 Média-Alta |
| 8. Final do jogo | Tema perfeito p/ idle, mas pré-gasto no loop | 🔴 Alta |

---

## 2. Análise por item

### 1. Convergence
- **Funciona:** o mapeamento mecânico é forte. A lore define Convergence como "o
  Seeker se quebra, dispersa a luz reunida e **mantém só a Semente**" — e o jogo
  faz exatamente isso: reseta nível/XP/área (a luz dispersa) e **preserva
  gear/passivas/awaken/áreas** (a Semente = a conta permanente). "Cada Convergence
  é HaShevirah em miniatura" descreve com precisão o loop de prestige.
- **Conflita:** na lore, a Convergence acontece **uma vez, no clímax**, no tier
  Lumière dentro de Nil Aeternum (Mapa 5). No jogo, ela é o loop **rotineiro** que
  começa na **Área 3 do Mapa 1** (nível ~350) e se repete 8–12+ vezes. O ato mais
  sagrado e final da narrativa é a mecânica mais corriqueira.
- **Ausente:** qualquer texto in-game que enquadre a Convergence como sacrifício
  (HaShevirah em miniatura) ou explique "manter só a Semente".
- **Severidade:** 🟠 Alta (a própria lore marca como pendente: "o termo Convergence
  pode ou não ser mantido").

### 2. Awaken
- **Funciona:** tematicamente encaixa — "evolução permanente do personagem". O
  lore-text do First Light ("the light you carry stirs for the first time — and
  answers") combina com o arco de cor (dourado → branco-azul).
- **Conflita:** "Awaken" **não existe na Lore Bible**. A escada de Awaken
  (Mortal → First Light → Lightbearer → Radiant Ascendant) é uma **segunda escada
  de marcos** paralela aos ranks da Ordre (Seeker → Lumière), sem ponte narrativa.
  Dois sistemas disputam o papel de "quão evoluído está o Seeker".
- **Ausente:** grounding de lore para Awaken e para os nomes Lightbearer/Radiant
  Ascendant.
- **Severidade:** 🟡 Média.

### 3. Ranks da Ordre
- **Funciona:** `data.tiers` traz **exatamente** Seeker → Illuminate → Éclairé →
  L'Éveillé → Lumière, respeitando a regra de idiomas (comuns em inglês, raros em
  francês). Alinhamento literal com a lore.
- **Conflita:** os tiers destravam nos níveis **1 / 10 / 25 / 50 / 100**. O Mapa 1
  vai até o nível **5000**. Logo, o jogador vira **Lumière (o rank máximo, o nome
  da era radiante) por volta da Área 2**, e permanece Lumière por ~4900 níveis e 8
  áreas. O ápice da Ordre — que a lore reserva para o fim da jornada — é
  banalizado no early-game. Além disso, a **Ascension** (cerimônia com Séraphine,
  a Doyenne) **não está implementada** como sistema; os tiers são só rótulo.
- **Ausente:** cerimônia de Ascension / NPC Séraphine; gates de rank significativos.
- **Severidade:** 🔴 Alta (a escada de identidade central some na Área 1–2).

### 4. Mémoires
- **Funciona:** a base de lore é riquíssima — cada Éclat "carrega uma memória" do
  mundo inteiro; Le Premier Éclat guarda "a memória de ter sido inteiro". É a
  **premissa** do universo.
- **Conflita:** nada (não há sistema para conflitar).
- **Ausente:** **não existe sistema de Mémoires** no jogo. O jogador nunca coleta
  Éclats nem memórias — coleta Lumens e materiais. O ato central da ficção
  (absorver fragmentos que carregam memória) **não tem mecânica**: não há codex,
  coleção, nem desbloqueio narrativo por kills/progresso. O recurso "Éclat" sequer
  é coletável.
- **Severidade:** 🟠 Média-Alta (um pilar da lore com representação zero).

### 5. Escala de poder
- **Funciona:** a ideia de poder crescente entre mapas combina com "a luz se
  reúne e cresce". O arco de cor (dourado marcado → branco-azul convergido → sem
  cor) poderia expressar a escala.
- **Conflita:** a lore trata poder como **qualitativo** (reunião da luz, mudança de
  cor, tornar-se inteiro), enquanto o jogo é **quantitativo** (HP de 2 mil a 350
  bilhões; alvo de longo prazo ~1e308). Nada na narrativa justifica "por que o mob
  tem 350 bilhões de HP". E a escalada astronômica tensiona o tema de que o Seeker
  **não é um escolhido/deus** ("ele e Nihel são iguais, acidentes da Fracture").
- **Ausente:** um enquadramento de "o que significa ficar mais forte" (mais luz
  reunida) ligado aos números.
- **Severidade:** 🟡 Média.

### 6. Progressão dos mapas
- **Funciona:** o esqueleto bate. Mapa 1 = The Dreaming Wood com boss final
  **Gilded Hollow** (= boss do Map 1 na lore). O gancho no código aponta para as
  **"Cavernes Luminis"** (Mapa 2, cristalino). Mapa 3 = ruínas + **Ashen King**;
  Mapa 4 = **Claimed Queen**; Mapa 5 = **Nil Aeternum / Nihel**. Sequência coerente.
- **Conflita:** a **taxonomia de criaturas** da lore (Fragmented, Consumed, Eidola,
  Claimed, Cortices) **não aparece** nos tipos do jogo (Common/Rare/Elite/
  MiniBoss/Boss são mecânicos). A lore diz "The Eidola = os chefes" — então bosses
  *deveriam* ser Eidola, mas o jogo não os marca assim. O mundo Belle Époque /
  Ordre também não se conecta ao Mapa 1 (floresta) no jogo.
- **Ausente:** mapeamento tipo-de-inimigo ↔ taxonomia narrativa; presença da Ordre/
  civilização no Mapa 1.
- **Severidade:** 🟡 Média.

### 7. Nihel
- **Funciona:** a árvore de metaprogressão chama-se **Fracture** — o nome da
  entidade (*Nihel, The Fracture*). E **Convergence** (reunir a luz) é o oposto
  temático de Fracture (o Nada). Há ressonância (ainda que possivelmente acidental).
- **Conflita:** o **twist central** da lore — a guerra que ninguém percebe, a
  **Ordre como sistema de descarte de Nihel**, o jogador (membro da Ordre,
  absorvendo Éclats) **servindo ao Nada sem saber** — não tem **nenhuma**
  representação. O jogo enquadra absorver/matar como heroísmo de progressão. Pior:
  o jogador gasta **Pontos de Convergence** (reunião da luz) para comprar nós
  **Fracture** (Nihel) — tematicamente invertido (reunir luz para empoderar a
  Fenda?).
- **Ausente:** presságios de Nihel no Mapa 1; o twist da Ordre; Claimed/Cortices
  no elenco de inimigos.
- **Severidade:** 🟠 Média-Alta.

### 8. Final do jogo
- **Funciona:** o tema "a reparação não é um evento, é uma tarefa que não termina"
  é **perfeito** para um idle/prestige — a Convergence como ciclo eterno é o gênero.
  O alvo de endgame (Maps 2–5 culminando em Nihel) está ancorado.
- **Conflita:** a **escolha final** da lore (apagar tudo / recusar / a terceira via
  = Convergence), que deveria ser o clímax emocional em Nil Aeternum, é
  **mecanicamente pré-gasta** como o grind do early-game. O momento de catarse
  vira rotina antes mesmo do Mapa 2.
- **Ausente:** um endgame narrativo distinto do loop de prestige; o confronto com
  Nihel como evento.
- **Severidade:** 🔴 Alta (mesma raiz do item 1).

---

## 3. Elementos da lore SEM representação no gameplay

| Elemento | Status |
|---|---|
| **Mémoires / Éclats como coletáveis** | Ausente — premissa central sem mecânica |
| **Le Premier Éclat (a Semente)** | Implícito (a conta que sobrevive à Convergence), nunca nomeado in-game |
| **Nihel + o twist da Ordre** | Ausente no Mapa 1 |
| **Taxonomia** (Fragmented/Consumed/Eidola/Claimed/Cortices) | Ausente (tipos são mecânicos) |
| **Ascension + Séraphine** | Ausente como sistema (tiers são só rótulo) |
| **Arco de cor** (dourado→branco-azul→sem cor) | Ausente como expressão de progressão |
| **Névoa Dourada, Or Ein Sof, HaShevirah, The Mending** | Ausentes do texto in-game |
| **Claimed Queen / Ashen King** | Planejados (Maps 3–4), ainda não no jogo |

---

## 4. Sistemas do gameplay SEM suporte narrativo

| Sistema | Suporte na lore |
|---|---|
| **Awaken** (Mortal→First Light→Lightbearer→Radiant Ascendant) | Nenhum — escada inventada fora da lore |
| **Lumens** (moeda) | A lore chama a moeda de "Vestiges"; o jogo usa Lumens e reaproveitou "Vestige" como árvore |
| **Gear Materials / Promoção / Raridade (Common/Uncommon)** | Sem âncora narrativa (por que promover gear?) |
| **Mini Boss / Elite / thresholds de kills** | Mecânicos; sem nomes/papéis na lore |
| **Pontos de Convergence → árvores** | A *ideia* casa; os nomes das 3 árvores (Éclat/Vestige/Fracture) só parcialmente |
| **Escala numérica (1e308)** | Sem significado narrativo |
| **Bosses do Mapa 1** (Drowned Lantern, Hollow Cantor, etc.) | Nomes novos, não mapeados à taxonomia/Eidola |

---

## 5. Riscos para os Mapas 2–5

1. **R-L1 — Clímax pré-gasto (crítico).** Se a Convergence continuar sendo o loop
   de prestige desde o Mapa 1, o confronto-Nihel/escolha-final do Mapa 5 chega
   **sem novidade narrativa**. Decidir já se "Convergence" narrativa ≠ a mecânica
   (renomear a mecânica, ou reservar o significado para o endgame).
2. **R-L2 — Ranks da Ordre obsoletos.** Com Lumière atingido no nível 100, os Maps
   2–5 não têm escada de identidade. Risco de o jogador "ser Lumière" enquanto
   ainda luta contra mobs triviais por 4 mapas. A escada de Awaken pode assumir
   esse papel — mas precisa de lore.
3. **R-L3 — Twist de Nihel sem preparo.** A revelação "a Ordre serve a Nihel /
   você ajudou o Nada" precisa de **presságios plantados desde o Mapa 1**. Sem
   sementes narrativas cedo, o twist do Mapa 5 cai no vazio.
4. **R-L4 — Taxonomia divergente trava o conteúdo.** Maps 3–4 dependem de Ashen
   King e Claimed Queen (Eidola/Claimed). Se o sistema de inimigos nunca souber da
   taxonomia, esses bosses entram como "mais um Boss" mecânico, perdendo peso.
5. **R-L5 — Cor como dívida.** O arco de cor é o fio condutor visual da lore. Se
   não for ligado a tiers/awaken/mapas cedo, retrofitá-lo em 5 mapas de arte vira
   caro.
6. **R-L6 — Pendências de lore não fechadas** (corte Cortices, rosto Lumière,
   nomes além do francês, nomes das 9 sub-áreas) podem **bifurcar** a produção de
   arte/conteúdo dos Maps 2–5 se decididas tarde.

---

## 6. Recomendações (sem alterar nada agora)

1. **Decidir o destino do termo "Convergence"** (pendência #6 da lore). Opção A:
   renomear a **mecânica** de prestige (ex.: "Reconvergence", "Shedding",
   "Fracture cycle") e **reservar "Convergence"** para o ato narrativo final. Opção
   B: assumir que o loop É a tarefa-que-não-termina (The Mending) e abraçar isso no
   texto — então o "final" não é a Convergence, e sim **conter Nihel**.
2. **Ressignificar os ranks da Ordre.** Desacoplar Seeker→Lumière dos níveis 1–100
   (que se esgotam cedo) e amarrá-los a **marcos de mapa/Awaken** (ex.: 1 rank por
   mapa, ou rank = tier de Awaken), dando à Ascension um sistema real.
3. **Plantar Nihel e o twist no Mapa 1** via texto de boss/área (já há lore-blurbs
   nas áreas) — sem mecânica nova, só narrativa: a Névoa Dourada, fragmentos que
   "morrem" ao serem absorvidos, ecos do Nada.
4. **Projetar o sistema de Mémoires** como a representação da premissa: cada
   kill/boss libera um fragmento de memória (codex), transformando a coleta abstrata
   (Lumens) numa coleta **narrativa** (Éclats/memórias). É o maior buraco e a maior
   oportunidade.
5. **Mapear taxonomia ↔ tipos mecânicos** (Boss = Eidola, variantes Claimed/
   Cortices para Maps 4–5) antes de produzir os inimigos dos Maps 2–5.
6. **Amarrar o arco de cor** a tiers/awaken/mapas desde já (decisão barata agora,
   cara depois) — é o que dá significado **visual** à escala de poder numérica.
7. **Alinhar moeda/termos**: decidir Lumens vs Vestiges; reconciliar os nomes das 3
   árvores com a lore (Éclat ✓; Vestige ↔ Eidola/Vestiges; Fracture = Nihel — checar
   se "comprar Fracture com luz reunida" é intencional ou precisa de releitura).

> **Síntese:** o casamento lore↔gameplay é **estrutural, não temático**. Os ossos
> certos estão no lugar (ranks, bosses, mapas, nomes de árvore), mas a **alma** da
> lore — Mémoires, Nihel, o sacrifício da Convergence, o arco de cor — ainda não
> tem mecânica nem texto. Como a Lore Bible já marca a maioria disso como
> *pendente*, o momento de decidir é **antes** de produzir os Maps 2–5, não depois.
