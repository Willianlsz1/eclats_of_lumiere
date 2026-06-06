# Design — Gaiadon Clone: Reformulação de Ritmo e Núcleo

**Data:** 2026-06-06
**Status:** Aprovado pelo usuário (aguardando revisão de spec)
**Abordagem:** A — "Polir o núcleo primeiro"

## Contexto e objetivo

Existe um protótipo funcional de idle/incremental RPG em `gaiadon-clone/`
(HTML/CSS/JS vanilla), inspirado em *Gaiadon: Eternal Quest* (Steam). O usuário é
**iniciante em game dev** e os objetivos são **aprender fazendo** e **se divertir**
(sem pressão comercial).

A meta é ser "melhor que o original" atacando o problema mais citado nas reviews do
jogo da Steam: **o jogo só fica bom depois da primeira transcendência — o começo é
lento e segura o jogador**. Nossa filosofia é o oposto: **sempre haver um próximo
objetivo a ~30-60 segundos de distância, desde o primeiro segundo**.

### Pilares (todos já existem em forma básica no protótipo)
1. Loot e gear
2. Números que explodem (crescimento incremental)
3. Ascensão / prestígio
4. Progресso parado (idle)

O escopo desta fase é **deixar esses 4 pilares excelentes e bem ritmados**, NÃO
adicionar sistemas novos do original (heróis, expedições, crafting, trials etc.).

### Decisões fundadoras
- **Tecnologia:** continuar em **vanilla JS** (HTML/CSS/JS puro, zero setup),
  melhorando o protótipo atual. Melhor para aprender fundamentos.
- **Princípio de código:** manter a separação "regras do jogo" (lógica pura) vs.
  "como aparece" (DOM).
- **Idioma do jogo:** TODO o texto visível ao jogador (interface, nomes de
  inimigos/zonas/itens, mensagens de log, tooltips, botões, resumo offline) deve ser
  em **inglês** — o protótipo atual está em português e será traduzido. Objetivo
  secundário do usuário: praticar inglês. Manter textos claros e diretos (nível
  intermediário). Comentários de código e documentação podem permanecer em português.

## Seção 1 — Modelo de ritmo (pacing)

Desenhar a curva da primeira sessão com marcos próximos e sempre visíveis:

| Momento | Quando deve acontecer | Por quê |
|---|---|---|
| Primeiro abate | < 1 segundo | Feedback imediato |
| Primeira compra na loja | ~5 segundos | Ensina o loop de upgrade cedo |
| Primeiro drop de item | Garantido nos primeiros abates | Mostra o pilar de loot logo |
| Avançar de profundidade | ~1-2 minutos | Progresso visível |
| Primeira ascensão viável | **~30-40 minutos** (desbloqueia ao limpar a Zone 25) | Primeira ascensão "merecida"; ver decisões de conteúdo |

**Levers (alavancas) de balanceamento:**
- Drops iniciais **garantidos** nos primeiros abates (em vez de 22% aleatório), para
  combater o azar que desanima no começo.
- Curva de custo (loja) e de força dos inimigos re-balanceada: sem "parede"
  intransponível nem trivialidade.
- Fórmula de ascensão ajustada para a primeira ascensão ser alcançável em ~30-40 min e
  claramente valer a pena. **Nota de implementação:** a fórmula atual
  (`essenceOnAscend`) depende de `maxZoneReached`, que é removido no modelo de
  profundidade infinita; ela será redefinida com base na **profundidade máxima
  alcançada** + nível.
- Indicador de "próximo objetivo" sempre visível na tela.

## Modelo de progressão: profundidade infinita

Substitui o sistema atual de "5 zonas fixas".

- O inimigo tem um **nível = profundidade** (1, 2, 3, 4… contínuo e **infinito**).
- **Escala pela PROFUNDIDADE, não pelo nível do personagem.** O inimigo nível 1 tem
  sempre a mesma força. Ficar mais forte serve para **furar a próxima parede**, não
  para empatar com inimigos que crescem junto (armadilha da "esteira" que mataria o
  pilar dos números que explodem).
- As "zonas" do protótipo viram **temas cosméticos** (ex.: a cada 10 níveis de
  profundidade, muda cenário/nome). O número que importa é o nível do inimigo.

## Modelo de combate e "parede"

- **Inimigos dão dano com base no nível deles (profundidade).** Quanto mais fundo,
  mais forte o golpe.
- O herói sobrevive com **Vitalidade** (vida) e **Velocidade de ataque** (mata antes
  de morrer). Esses stats passam a importar de verdade — não basta empilhar dano.
- **Modelo de resolução de combate:** mantemos o modelo atual de **DPS contínuo por
  tick** (`tick` aplica `dps * dt` ao inimigo e o inimigo aplica dano ao herói por
  tempo), apenas re-balanceado para o novo modelo de profundidade. Não migramos para
  ataques discretos nesta fase.
- **Morrer NÃO pune:** não perde ouro, itens nem equipamento. O jogador apenas **não
  fura a parede** — fica travado no nível de profundidade atual.
- Mensagem clara: *"Você ainda não é forte o bastante para o nível X. Farme um pouco
  e tente de novo."*

**Loop resultante (o coração do incremental):**
1. Empurrar fundo até bater numa parede que mata.
2. Voltar a farmar no nível mais fundo vencível → juntar ouro, XP e loot.
3. Comprar upgrades, equipar itens melhores → ficar mais forte.
4. Tentar a parede de novo → furar → empurrar até a próxima parede.
5. Quando o farm fica lento, **ascender** para o empurrão permanente.

> Detalhe a definir no balanceamento: começa com **1 herói** (o jogador). Mais heróis
> ficam para uma fase futura, fora deste escopo.

## Seção 2 — Progresso offline (idle)

- Ao salvar, gravar **timestamp**. Ao abrir, calcular o tempo decorrido e simular os
  ganhos de forma **barata** (fórmula matemática, não rodar horas de ticks).
- Mostrar resumo: *"Enquanto você esteve fora (3h 20min): +12.4K ouro, +840 XP, 3
  itens."*
- **Eficiência offline** começa baixa (~25%) e o **teto de acúmulo** começa baixo
  (~2h).
- Offline **não fura paredes novas** sozinho — só acumula recursos na profundidade já
  alcançada. Empurrar mais fundo continua sendo decisão ativa.

### Offline como pilar de upgrade
- Upgrades (loja e/ou ascensão) aumentam **o teto** ("+1h offline") e a **eficiência**
  ("+5% offline"), eventualmente passando de 50%.
- Cria objetivo de longo prazo que amarra o pilar idle ao pilar de números crescentes.

### Constantes de offline (fonte única em `data.js`, chutes iniciais a afinar)
| Constante | Valor inicial | Observação |
|---|---|---|
| Eficiência inicial | 25% | dos ganhos ativos |
| Teto de eficiência (via upgrade) | 50%+ | upgrades aumentam em passos (~+5%) |
| Acúmulo inicial | 2h | tempo máximo creditado de início |
| Teto de acúmulo (via upgrade) | 8h | upgrades aumentam em passos (~+1h) |

## Seção 3 — Sensação de jogo (game feel) e correções

**Correções de bugs do protótipo:**
- **Morte sem efeito** (`game.js:136`): resolvido pelo modelo de "parede" acima
  (morrer = não avança, sem punição).
- **Reset de progresso ao voltar de zona** (`game.js:169`): desaparece naturalmente no
  modelo de profundidade contínua.
- **Código morto** (`game.js:151-153`) e crescimento sem-teto de HP por abate
  (`game.js:57`): removidos/limpos no novo modelo.

**Melhorias de "feel" (baratas, alta dopamina):**
- Números de dano que pulam e somem ("floating damage").
- Feedback de drop com brilho/flash na cor da raridade.
- Barra de "próximo objetivo" sempre visível.
- Marcos comemorados (nova profundidade, primeira lendária, primeira ascensão).

## Seção 4 — Estrutura do código

Manter e reforçar a separação existente; mudanças cirúrgicas, sem reescrever:

- **`data.js`** — TODOS os números de balanceamento (custos, curvas, drops, offline)
  num lugar só. Facilita afinar o jogo mexendo em um arquivo.
- **`game.js`** — lógica pura (combate, profundidade, loot, ascensão, cálculo
  offline). Permanece testável, sem DOM.
- **`ui.js`** — renderização + efeitos de "feel".
- **`main.js`** — loop, save/load com timestamp, ligação dos botões.

Princípio pedagógico: **separar "o que o jogo É" (regras) de "como ele aparece"
(tela)**.

## Seção 5 — Testes (leve)

- Testar **só a matemática crítica**: dano/vida, custo de upgrade, ganhos offline,
  essência de ascensão.
- Ferramenta simples: `game.test.js` em Node puro (sem framework pesado) ou funções de
  checagem que imprimem ✅/❌, rodáveis por um comando.
- Resto (efeitos visuais, cliques, save/load) verificado jogando.
- Objetivo: segurança ao mexer no balanceamento, sem virar fardo.

## Decisões de conteúdo (sessão de grilling — ver `CONTEXT.md`)

- **Stats do Hero (4):** Damage, Health, Attack Speed, Gold Find.
- **Inimigos:** cosméticos dentro de uma Zone (mesma matemática, só o nome muda,
  sorteado do pool da Region).
- **Boss:** a cada 10 Zones (Boss Zone). Um único Boss com Health ~×8 substitui os 10
  abates, limpa a Zone de uma vez e dá drop garantido de rarity `rare`+.
- **Loot:** 3 slots — Weapon→Damage, Armor→Health, Amulet→**sorteia** Attack Speed _ou_
  Gold Find (slot "surpresa"). Todas as rarities caem desde a Zone 1; o **Item Power**
  escala com a Zone (re-loot conforme avança).
- **Ascensão:** desbloqueia ao limpar a **Zone 25**; primeira ascensão "merecida"
  (~30-40 min). Antes disso o botão fica travado.

## Fora de escopo (fases futuras)
- Múltiplos heróis, expedições, crafting, skill books, fame trials, batalhas
  cronometradas.
- Migração para framework/engine.

## Critérios de sucesso
- Primeira sessão segue a curva de marcos da Seção 1 (objetivo sempre a ~30-60s).
- Primeira ascensão desbloqueia ao limpar a Zone 25 (~30-40 min) e é claramente vantajosa.
- Progresso offline funciona, é melhorável por upgrade, e não quebra o jogo.
- Morrer nunca pune além de "não avança"; a mensagem ensina a farmar.
- Bugs do protótipo corrigidos; lógica crítica coberta por testes simples.
