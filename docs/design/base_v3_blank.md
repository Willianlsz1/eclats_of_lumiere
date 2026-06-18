# Éclats of Lumière — Base v3 (planejamento do zero)

> **Folha em branco — iniciado em 2026-06-18.**
> Documento da NOVA base. Tudo aqui é decidido **na sessão de design com o Willian**.
> Nada do design antigo (`docs/archive/`) entra sem ser reaprovado. Enquanto uma
> seção estiver vazia/"⬜ a decidir", o número/regra **não existe** — não invente.

## Estado atual do projeto
- **Visual/design preservado:** todas as telas (`src/ui/*.js` + `*.css`), tokens,
  shell, arte em `public/eclats/`, `index.html`. A casca renderiza com dados de amostra.
- **Motor removido:** `src/core/{loop,save,dev}.js` e
  `src/game/{fatekeepers,difficulty,offline}.js` apagados; os demais `src/game/*.js`
  e `src/core/state.js` são **stubs de casca** (sem lógica, valores de amostra).
- **Próximo passo:** preencher este doc, seção a seção, e só então religar a UI a um
  motor novo e reescrever `src/data/constants.js`.

---

## 1. Visão & fantasia ✅ (2026-06-18)

**O que é:** um **idle RPG de browser**, casual/idle-pesado, no mundo de **Éclats of
Lumière** — o Seeker carrega a luz para remendar um mundo fraturado (lore/arte/nomes
preservados de `eclats_lore_bible.md` + arte em `public/eclats/`).

**Para quem:** jogador casual de idle — volta de tempos em tempos para gastar recursos
e decidir upgrades; o jogo **roda praticamente sozinho** (inclusive offline).

**Sensação central (3 pilares):**
1. **Ficar absurdamente forte** — power fantasy / números explodindo; o coração do
   gênero. Camadas de poder multiplicativas que crescem sem teto perceptível.
2. **Explorar e descobrir** — avançar por um mundo para frente, desbloquear regiões
   novas e querer ver "o que vem depois".
3. **Superar muros** — bater em paredes de progressão e sentir a virada ao quebrá-las
   (o momento de mestria que recompensa o tempo investido).

**Como os pilares se sustentam (direção, não regra final):** mundo que avança para
frente (explorar) → pontuado por **muros** que travam até você ficar forte o bastante
(superar) → resolvidos por **sistemas de poder multiplicativos** que sobem no idle
(ficar forte). O ritmo idle-pesado é a espinha: tudo progride sozinho; a presença do
jogador é para **decidir gastos e upgrades**, não para microgerenciar combate.

> Os pilares acima são o filtro das próximas seções: cada sistema precisa servir a pelo
> menos um deles, sem brigar com o "idle-pesado/casual".

## 2. Loop central (minuto a minuto) ✅ (2026-06-18)

**Idle (inclusive offline):** o Seeker luta **sozinho na área atual** e **acumula
recursos** (moedas/XP). **Não avança de área sozinho** — a fronteira só anda com o
jogador presente. Offline = o mesmo, simulado/abstraído ao voltar.

**Sessão ativa (quando o jogador volta):**
1. **Coleta** o acumulado do idle.
2. **Gasta em upgrades** — investe nos sistemas de poder (a decisão de *onde* gastar é
   o jogo). Poder é multiplicativo e sobe sem teto perceptível.
3. **Escolhe o rumo** — para qual área avançar, qual muro atacar, onde farmar melhor.
4. **Empurra o muro.** Sai; o idle volta a acumular na fronteira atual. Repete.

**Quebrar muros = virada de prestígio.** Os muros "duros" não se vencem só esperando:
a virada satisfatória vem de uma **mecânica de prestígio** — um reset que **multiplica
o poder** e relança o Seeker mais forte (detalhes na §6). Há, portanto, uma camada meta
de prestígio no núcleo do jogo, e não só no endgame.

**Tensão resolvida:** idle nunca avança o mundo sozinho (acumula na fronteira); só o
jogador decide avançar — isso protege o pilar "explorar/descobrir" de virar automático
e dá propósito à sessão ativa, mantendo o casual/idle-pesado.

## 3. Modelo de combate ✅ (2026-06-18)

**100% automático.** O jogador **nunca age dentro do combate** — o Seeker luta sozinho.
Toda decisão é FORA do combate (upgrades, rumo, prestígio). Sem habilidades manuais no
núcleo. (Coerente com idle-pesado + "gastar/escolher rumo".)

**Alvos: começa em 1, evolui para vários.** No início é **single-target** (mata um por
vez; a velocidade de kill ancora a economia base). **AoE/cleave** entra como um
**desbloqueio de poder** mais à frente — a fantasia de "ficar absurdamente forte" é
sentida ao passar de matar 1 por vez para limpar grupos/telas inteiras.

**O muro é de SOBREVIVÊNCIA, não de HP de chefe.** Avançar para a próxima área expõe o
Seeker a inimigos que **causam dano demais**: você **morre** e não se sustenta até ficar
mais resistente (HP/defesa) — ou **prestigiar** pelo multiplicador. Logo:
- **Defesa/HP = chave para EXPLORAR** (atravessar o muro de sobrevivência e avançar).
- **Dano/velocidade de kill = THROUGHPUT** (farmar recursos mais rápido na fronteira).

**Implicações (alimentam §5, §8):** existem dois eixos de poder que importam por motivos
diferentes — **ofensa** (renda) e **defesa/sobrevivência** (avanço). O balanceamento dos
muros é calibrado pela razão dano-dos-inimigos × resistência-do-Seeker, não por HP de
boss. Não há "luta de chefe" ativa; a satisfação de superar o muro vem de **ficar
tanque o suficiente** e/ou da **virada de prestígio** (§6).

## 4. Espinha de progressão (mapas / áreas) ✅ (2026-06-18)

**Escopo da base: 1–2 mapas bem calibrados** (começar pelo **The Dreaming Wood**;
possivelmente **Cavernes Luminis** como 2º). Cada mapa tem várias sub-áreas. Os mapas
3–5 (Ashen Ruins, Fractured Peaks, Nil Aeternum) ficam para **expansão pós-base** — a
arte já existe, mas não entram no jogo base.

**Avanço linear + backtrack para farmar:** as sub-áreas são uma sequência; você avança
**uma de cada vez** ao superar o muro de sobrevivência (§3). Pode **voltar a áreas já
limpas** para farmar com segurança a uma **renda menor** — recurso natural quando a
fronteira ainda te mata (junta poder no seguro e volta a empurrar).

**Duração-alvo: ~2–4 semanas (idle casual).** Sustentada **principalmente pelos loops de
prestígio** (§6) sobre conteúdo enxuto (1–2 mapas), e não por volume bruto de áreas. Ou
seja: poucos mapas, mas represtigiados várias vezes, cada volta mais forte e mais fundo.

**A calibrar (§10):** nº de sub-áreas por mapa, onde ficam os muros, curva de
risco/renda da fronteira vs. áreas seguras, e quantos prestígios cabem nas ~2–4 semanas.

## 5. Moedas & economia ✅ (2026-06-18)

**Duas moedas (idle casual = simples):**
- **Moeda de farm** (provis. *Lumens* — nome canônico da lore): gerada pelo idle (kills),
  gasta em **upgrades do dia a dia** (poder que pode resetar no prestígio).
- **Moeda de prestígio** (nome a confirmar com a lore — *Vestiges/Éclats*): ganha **ao
  prestigiar**, gasta em **upgrades permanentes** (não resetam). É o motor de longo prazo.

**Nível automático dá stats base.** Matar dá XP → sobe de nível → ganha **dano/HP base de
graça** (motor passivo). As moedas investem **por cima** disso. *(Se o nível reseta no
prestígio: decidir na §6 — provável que sim.)*

**Modelo de renda = taxa base (por tempo) × multiplicadores.** Previsível de calibrar:
- A **taxa base** depende da **área** — fronteira mais funda/perigosa rende mais; áreas
  seguras de backtrack rendem menos (concilia com a §4).
- O **crescimento de longo prazo** vem do **empilhamento de multiplicadores** (upgrades de
  farm + upgrades permanentes de prestígio + nível), não da taxa base. Isso mantém a
  bola-de-neve no controle dos sistemas que calibramos, não num acoplamento perigoso a
  dano/profundidade.

**Sinks principais:** Lumens → upgrades de farm (ofensa/defesa, §8); moeda de prestígio →
upgrades permanentes/meta (§6). A definir na §10: taxas base por área, custos e curvas.

## 6. Prestígio / meta-progressão ✅ (2026-06-18)

**Uma camada de prestígio** (foco para a base; dá para somar uma 2ª camada depois).

**Reseta progresso, mantém meta:**
- **RESETA:** posição no mapa (volta ao início), **Nível**, e **Lumens não gastos**.
- **PERSISTE:** **gear inteiro** (nível + itens, §8), **moeda de prestígio** + **árvore de
  multiplicadores permanentes**.
- Você recomeça do início **bem mais forte** → atravessa rápido o que antes era muro e
  vai mais fundo do que na run anterior.

> **Nota (decisão 2026-06-18):** o **gear não reseta** (nem o nível pago em Lumens). Logo,
> o que o jogador gastou em gear é **progresso permanente**; só perde **Lumens não gastos**,
> **Nível** e **posição**. Isso torna o prestígio mais "macio" (você mantém o poder do gear)
> e desloca a virada para a **árvore de prestígio** + recomeçar acumulando. ⚠️ Na §10,
> calibrar para que prestigiar ainda valha a pena mesmo mantendo o gear.

**Gasto = árvore de multiplicadores permanentes.** A moeda de prestígio compra uma
árvore/lista de upgrades que multiplicam **dano, HP/defesa, renda, etc.** — molda a build
de longo prazo. **Crítico p/ o modelo:** como o muro é de **sobrevivência** (§3), a árvore
**precisa** ter ramos de **HP/defesa permanentes**, senão prestigiar não ajuda a cruzar os
muros. É a fonte primária de avanço de fronteira ao longo do jogo.

**Ganho por run:** a quantidade de moeda de prestígio ganha **escala com o quão fundo/forte
você chegou** na run. Isso cria o ritmo idle clássico: empurrar a fronteira até o muro,
**colher o prestígio**, resetar, e voltar mais forte — repetido ao longo das ~2–4 semanas
(§4). Os muros "duros" são justamente os pontos onde a run rende o suficiente para a
próxima virada valer a pena.

**A calibrar (§10):** quando o 1º prestígio fica disponível, fórmula do ganho por run,
custos/curva da árvore, e quantos prestígios cabem na duração-alvo.

## 7. Dungeons / conteúdo ativo ✅ (2026-06-18)

**Fora do jogo base.** A base é só a espinha: **mapa idle + muros de sobrevivência +
prestígio**. Dungeons (ex.: as "Hollows" do design arquivado) ficam para **expansão
pós-base**. Mantém o foco e fecha a base mais rápido — coerente com o casual.

## 8. Gear / equipamento ✅ (2026-06-18)

**Gear com loot/raridade** — principal **sink de Lumens** e o sistema com mais
profundidade ("montar/otimizar build" entra por aqui).
- **Fonte:** itens **dropam dos kills** (idle), com **raridades + afixos**.
- **Dois eixos de afixo:** **ofensa** (dano/velocidade → renda) e **defesa/HP**
  (sobrevivência → avançar) — alimenta diretamente o modelo de muro da §3.
- **Sink de Lumens:** subir/evoluir o gear com Lumens; a raridade vem dos drops.

**⚠️ Manter idle-casual (calibração):** loot/raridade adiciona complexidade que pode
brigar com "casual". Regras p/ evitar tédio: **auto-equipar o melhor** (ou comparação
1-clique), **sem micro-gerência de inventário** e **sem re-rolls manuais cansativos**. O
loot é para sentir progressão, não para virar trabalho.

**Reset no prestígio: o gear NÃO reseta (decisão 2026-06-18).** Nível e itens/raridade
**persistem** integralmente. O que o jogador investiu em gear é **progresso permanente**;
o prestígio reseta só Nível, posição e Lumens não gastos (§6). ⚠️ Calibrar (§10) para o
prestígio continuar valendo a pena apesar de o gear ser mantido.

## 9. Habilidades / poderes ativos ✅ (2026-06-18)

**Sem habilidades ativas no base.** Coerente com o **combate 100% automático** (§3): todo
poder é **passivo/upgrade** (nível, gear, árvore de prestígio). Mantém o casual puro.
Poderes ativos/auto-cast podem ser uma adição de expansão, se desejado.

## 10. Pacing-alvo & calibração 🟡 (estrutura fechada; números na implementação)

Meta global: **~2–4 semanas** de jogo base (idle casual), sustentada por **vários
prestígios** sobre **1–2 mapas**. Os números abaixo são definidos com um **simulador**
durante a implementação (não inventar agora).

**Alvos a calibrar:**
1. **Mapa:** nº de sub-áreas por mapa; posição dos muros; curva risco/renda
   **fronteira vs. áreas seguras** (backtrack).
2. **Muro (sobrevivência):** razão **dano-dos-inimigos × resistência-do-Seeker** que
   define cada parede e quando ela só cede via prestígio.
3. **Economia:** taxa **base de renda por área**; curva de custos do **gear (níveis)** e
   da **árvore de prestígio**; quanto **stat por nível** e a curva de XP.
4. **Prestígio:** quando o 1º fica disponível; **fórmula do ganho por run** (escala com
   profundidade/poder); quantos prestígios cabem nas ~2–4 semanas.
5. **AoE/cleave:** em que ponto da progressão o multi-alvo desbloqueia.
6. **Gear:** drop rates, raridades e valores de afixo (ofensa/defesa).

**Método:** construir um pequeno **simulador** para validar curvas antes de cravar em
`src/data/constants.js`; ajustar até o pacing bater na meta.

---

## Telas existentes vs. nova base (mapa de religação)
Com o design fechado, as telas da casca se encaixam assim:
- **Combate** → cena idle automática (mapa atual). ✅ central.
- **Mapa** → espinha linear + backtrack (1–2 mapas). ✅ central.
- **Seeker (ficha)** → stats/Nível. ✅.
- **Gear** → gear com loot/raridade (sink de Lumens). ✅ (repaginar p/ afixos/raridade).
- **Prestígio** → reaproveitar a tela **Convergence** OU **Ascension** como a tela de
  prestígio (árvore de multiplicadores). 🟡 escolher qual.
- **Passivas / Mémoires / Ascension / The Forge** → **fora do base** (Hollows, múltiplas
  camadas meta, craft) — telas ficam ocultas/arquivadas para expansão. 🟡.

---

## Telas existentes (casca a religar)
Inventário do que a UI já desenha (pode ser mantido, repaginado ou descartado
conforme o novo design): **Combate · Mapa · Seeker (ficha) · Convergence · Gear ·
The Forge · Passivas · Mémoires · Ascension**. Decidir em cada seção acima quais
telas o novo design usa e o que cada uma passa a significar.
