# Éclats of Lumière — Progressão (Redesign)

> Modelo de **2 camadas de reset** sobre um mundo de **nível contínuo**.
> Desenhado com o Willian. Substitui: as 3 dificuldades + o loop de 1000 ascensões.
> Os números são **pontos de partida** — o balanceamento fino é do sim do Claude Code.

---

## Em uma frase

O mundo é uma **subida contínua de nível**. Você **renasce muitas vezes** (Rebirth —
ganha multiplicadores) pra subir mais; e **5 vezes no jogo inteiro** você **Ascende**
(reset total, salto enorme, abre uma nova era).

---

## A espinha — Nível contínuo

- Um **único nível de inimigo**, subindo de 1 até o topo. **Sem** Véu Tênue/Denso/Eclipse.
- Os 5 mapas são **trechos** dessa subida (bandas de nível), com saltos grandes entre eras
  (começa curta, termina enorme — até 1 bilhão):

| Mapa | Faixa de nível | Salto vs anterior |
|---|---|---|
| Auroral | 1 – 50 | — |
| Umbral | 50 – 500 | ×10 |
| Crystalline | 500 – 50.000 | ×100 |
| Ashen | 50.000 – 1.000.000 | ×20 |
| Pinnacle | 1.000.000 – 1.000.000.000 | ×1000 |

(Números são ponto de partida — o sim do Claude Code afina. O "1 bilhão" fecha no Pinnacle;
além disso, o World Tier infinito segue subindo sem teto.)

- HP por banda: **cresce rápido por nível no começo, gentil no fim** — por isso a curva
  vai de ~10 a números massivos sem explodir nem ficar plana.
- **Preserva** o que o Claude Code já balanceou (são coisas por região, não por
  dificuldade): gold sublinear, `ratioByRegion`, `waveMult` → viram "por banda de nível".

---

## World Map (UI) — duas camadas

O mapa tem **dois níveis de zoom** (no estilo dos idle games com regiões + trilhas).

**1. Visão de mundo — as 5 eras como hexágonos numa trilha** (fraca → forte):

| Era | Faixa de nível | Tier que vira | Estado |
|---|---|---|---|
| Auroral | 1 – 50 | Illuminé | conquistado ✓ |
| Umbral | 50 – 500 | Radiant | conquistado ✓ |
| Crystalline | 500 – 50k | Luminary | **atual** (marcador) |
| Ashen | 50k – 1M | Transcendent | bloqueado |
| Pinnacle | 1M – 1B → ∞ | endgame | bloqueado |

- Cada hexágono mostra nome da era, faixa de nível e o tier que você vira.
- Estados: conquistado (✓), atual (marcador), **bloqueado** (abre só ao vencer o gatekeeper da era anterior).
- Depois do Pinnacle: o nó **∞ (World Tier)** — o NG+ infinito.

**2. Visão de região — clica numa era e abre a trilha de nós dela:**

- ~10–12 **sub-zonas** (nós) conectadas por trilha, com faixas de nível subindo
  (ex.: Crystalline = Glimmer 500–800 → Shardspring 800–1.3k → … → Sunken Lumen 20k–32k).
- Lê-se **subindo** (começo embaixo, topo em cima) — reforça a sensação de escalar.
- Nós: passados (cheios), atual (marcador), futuros (apagados).
- O **último nó é o gatekeeper** (o guardião/boss da era). Vencê-lo dispara a **Ascension**.

**Fluxo:** Mundo → clica era → Região (sobe a trilha) → gatekeeper → vence → Ascension →
volta ao Mundo com a próxima era aberta.

**Regra de geração:** cada era se subdivide em ~10–12 nós de nível (faixas geométricas, do
piso ao teto da era); o gatekeeper ocupa o nó do topo.

---

## Camada 1 — Rebirth (frequente, é o grind)

> Desenhado seguindo o padrão consagrado dos idle games (Cookie Clicker, NGU Idle):
> moeda de reset em √(progresso) + **recompensa dupla** (uma pra gastar + um passivo) +
> uma meta que compõe.

- **Quando:** você escolhe, ao bater no **muro** (os kills ficam lentos → dica "Rebirth recomendado").
  É o "resete quando o tempo de clear desacelerar" que o material de design recomenda.
- **Reseta:** nível do herói, Lumin, Channeling — e te devolve ao começo da subida da era atual.
- **Mantém:** gear, Vestiges, Essence, **Attunement**, progresso de era.

### As duas recompensas (todo reset entrega as duas)

**1. Essence — pra gastar.**
Ganha por profundidade, na fórmula `√(waves) × scale`. A raiz é de propósito: resetar
cedo rende pouco, runs fundas rendem mais mas com retorno decrescente → é o que cria o
**momento ótimo de resetar**. Gasta em **Vestiges** (multiplicadores permanentes).

**2. Attunement — o passivo permanente.** *(novo)*
Sintonia do Seeker com os ecos da Lumière. **+1 por Rebirth.** Cada ponto dá:
- **+2% de poder na base** (dano e vida) — ganho **imediato**, sentido já no nível 1.
- **+1% no valor de cada nível** subido — recompensa **subir** (o "Caminho A"); faz
  re-subir mais rápido a cada reset (o "rebuild faster" do NGU).
- (2% e 1% são pontos de partida — o sim do Claude Code afina.)

> Como o `ascGrowth` do inimigo **sai** neste redesign, esses dois ganhos são **líquidos**
> — nada os cancela. Era exatamente o conserto que faltava pra "resetar sempre valer a pena".

### A meta que compõe

- **Soul Prism** (Vestige) aumenta o ganho de Essence → mais Essence por reset → mais
  Vestiges → mais Essence… É o laço de composição que os clássicos usam (já existe no jogo).

### Sensação de escala (exemplo)

| Rebirths | Poder base (flat) | Valor por nível |
|---|---|---|
| 50 | ×2.0 | +50% |
| 200 | ×5.0 | +200% |

Cresce gostoso sem explodir. Você faz Rebirth **muitas vezes** dentro de cada era.

---

## Camada 2 — Ascension (rara — 5 no jogo todo)

> Padrão da super-prestige (Antimatter Dimensions, Realm Grinder): reset em **marcos fixos**,
> zera a camada de baixo mas **mantém o contador de tier**, e cada marco abre uma **alavanca nova**.
> São exatamente os 5 tiers: `Seeker → Illuminé → Radiant → Luminary → Transcendent`.

### O gatekeeper de cada era (o requisito)

Cada mapa tem um **guardião** no seu nível-teto. **Derrotá-lo é o único requisito** pra
Ascender — acabou o gate de "nível 30+3n" / "limpar X stages" (era do modelo antigo). Você
sobe os níveis via Rebirth até estar forte o bastante pra furar até o guardião; vencê-lo
dispara a Ascension pro tier seguinte.

| Era | Faixa de nível | Guardião (gatekeeper) | Você vira | Spike |
|---|---|---|---|---|
| Auroral | 1 – 50 | Dawn Sentinel | **Illuminé** | ×10 |
| Umbral | 50 – 500 | The Whispering One | **Radiant** | ×50 |
| Crystalline | 500 – 50.000 | Crystal Wyrm | **Luminary** | ×200 |
| Ashen | 50.000 – 1.000.000 | The Ashen Pharaoh | **Transcendent** | ×1000 |
| Pinnacle | 1.000.000 – 1.000.000.000 | Eclipsed One | **endgame / World Tier** | ×∞ |

> Calibragem (Claude Code): o spike de cada Ascension deve **mais ou menos cobrir o salto de
> nível da era seguinte**, senão o jogador ascende e não consegue nem entrar na era nova.

### O que reseta / mantém

- **Reseta:** tudo da camada de baixo — nível, **gear**, Lumin, Channeling, Essence, Vestiges, Attunement.
- **Mantém:** o **tier** (o contador nunca zera) + as eras já desbloqueadas.
- O reset do **gear** é de propósito (padrão da super-prestige): na era nova você re-equipa
  muito melhor em minutos, então o gear velho ficaria obsoleto de qualquer jeito.

### As 5 recompensas (cada uma abre uma alavanca diferente)

| # | Ascensão | Vestige / desbloqueio exclusivo | Efeito |
|---|---|---|---|
| 1 | → Illuminé | **Selo da Aurora** | + ganho de Attunement por Rebirth (acelera o loop de base) |
| 2 | → Radiant | **Rasga-Véu** | + ganho de Essence (mais moeda por Rebirth) |
| 3 | → Luminary | **Núcleo Prismático** | todos os outros Vestiges ficam +X% mais fortes (amplifica o acervo) |
| 4 | → Transcendent | **Transcendência** | o **Channeling para de resetar** no Rebirth — stats comprados viram **permanentes** |
| 5 | Conquistar Pinnacle | **Estilhaço da Lumière** | **World Tier infinito**: o mundo reinicia mais alto e cada volta dá **×10 a tudo, pra sempre** |

A escada de alavancas: acelerar Attunement → mais Essence → amplificar Vestiges → **stats
permanentes** → **motor infinito ×10/volta**. Cada ato muda *como* você fica forte, não só *quanto*.

É o "ato" do jogo: **5 renascimentos épicos**, um por era.

---

## As moedas (só 2 — pra manter simples)

| Moeda | De onde vem | Pra que serve | Reseta quando |
|---|---|---|---|
| **Lumin** (ouro) | matar inimigos | comprar Channeling (stats temporários) | no Rebirth |
| **Essence** | fazer Rebirth | comprar Vestiges (multiplicadores permanentes) | na Ascension |

Ascension **não tem moeda de loja** — é um marco que entrega o salto + o unlock direto.

---

## O loop completo (passo a passo)

1. Você luta → sobe de nível → gear dropa → avança nos níveis do mapa.
2. Bate no muro → **Rebirth**: ganha Essence, compra Vestiges, volta e sobe mais rápido/fundo.
3. Repete o Rebirth várias vezes até dominar a era inteira.
4. Conquista a era → **Ascension**: reset total, vira o próximo tier, ganha o spike e
   abre a próxima era de níveis.
5. Repete por 5 eras, até virar **Transcendent** no Pinnacle.

---

## Decisões (fechadas com o Willian)

- **[GEAR NA ASCENSION]** ✅ Sim — a Ascension reseta o gear também (renascimento total).
- **[NOME da camada de baixo]** ✅ **Rebirth**.
- **[Nº de Rebirths por era]** Não é fixo — você faz quantos precisar pra furar a era.
  O sim do Claude Code define a média alvo.

## Pendências de calibragem (pro sim do Claude Code)

- Spike de cada Ascension deve cobrir o salto de nível da era seguinte (ver tabela de eras).
- Curva de HP por nível dentro de cada banda (rápida no começo, gentil no fim).
- Valores do Attunement (+2% base / +1% por nível por Rebirth são chute inicial).
- Quanto cada Vestige novo (Selo da Aurora, etc.) concede.

---

## O que muda no código (alto nível — pra quando o balanceamento fechar)

- `data.js` / `zones.js`: nível contínuo no lugar de dificuldade (`powerMult` sai; HP vem do nível/banda).
- `progression.js`: separar 2 camadas — Rebirth (a ascension atual, renomeada) + Ascension nova (5 marcos = os tiers).
- Essence passa a **resetar** na Ascension (hoje é permanente).
- UI: a tela de mapa vira uma **barra de subida**; a tela de prestígio ganha **2 abas** (Rebirth / Ascension).
- **Preserva:** gold sublinear, `ratioByRegion`, `waveMult` (viram "por banda de nível").
