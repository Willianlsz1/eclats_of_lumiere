# MEMOIRES_MASTER_PLAN_V1

> Documento de design **canônico** — *sujeito a mudanças (draft narrativo)*.
> Detalha as 15 Mémoires da campanha (3 por mapa) que o sistema de
> `ASCENSION_SYSTEM_V1` entrega. Conteúdo narrativo; nenhuma implementação aqui.

---

## Filosofia

As **Mémoires** são a principal recompensa **narrativa** de Éclats of Lumière.

Elas **não existem para explicar o mundo** — existem para **mudar a interpretação**
do jogador sobre o mundo.

Cada mapa **responde** uma pergunta. E **cria** uma pergunta maior.

---

## Estrutura

Cada mapa contém:

- **Mémoire Menor I**
- **Mémoire Menor II**
- **Mémoire Maior** (entregue na **Ascension**)

**Total: 15 Mémoires.**

---

## MAPA 1 — THE DREAMING WOOD

**Pergunta:** *"O que são os Éclats?"*

| # | Mémoire | Quando | Revelação |
|---|---|---|---|
| I | **Fragmentos de Luz** | Durante o mapa | Os Éclats não são apenas energia — carregam **ecos de algo maior**. |
| II | **Os Primeiros Portadores** | Próximo ao Boss Final | A Ordre acredita que os Éclats são fragmentos de uma **luz primordial**, e que seu dever é reuni-los. |
| III | **A Primeira Dúvida** | **Ascension I — Illuminate** | **Grande revelação:** ninguém sabe realmente de onde vieram os Éclats. A Ordre apenas **herdou** uma missão antiga. |

---

## MAPA 2 — CAVERNES LUMINIS

**Pergunta:** *"Por que a luz tenta se reunir?"*

| # | Mémoire | Quando | Revelação |
|---|---|---|---|
| IV | **O Chamado** | Durante o mapa | Os Éclats demonstram comportamento estranho: fragmentos distantes **procuram uns aos outros**. |
| V | **O Impulso** | Durante o mapa | A reunião da luz não é escolha — é um **impulso natural**. Algo nela **deseja voltar a ser inteiro**. |
| VI | **A Semente** | **Ascension II — Éclairé** | **Grande revelação:** existe um fragmento diferente dos demais — **Le Premier Éclat. A Semente.** |

---

## MAPA 3 — THE SUNKEN REALM

**Pergunta:** *"Isso já aconteceu antes?"*

| # | Mémoire | Quando | Revelação |
|---|---|---|---|
| VII | **As Ruínas** | Durante o mapa | Vestígios mostram que **outra civilização** enfrentou o mesmo fenômeno. |
| VIII | **O Rei de Cinzas** | Durante o mapa | O **Ashen King** não tentou impedir a reunião — tentou **controlá-la**. E falhou. |
| IX | **O Primeiro Ciclo** | **Ascension III — L'Éveillé** | **Grande revelação:** o mundo atual não é o primeiro. Já existiram **outros ciclos** — outras quedas, outras tentativas. |

---

## MAPA 4 — THE SHATTERED THRONE

**Pergunta:** *"O que é a Fracture?"*

| # | Mémoire | Quando | Revelação |
|---|---|---|---|
| X | **A Rainha Reivindicada** | Durante o mapa | A **Claimed Queen** revela que a Fracture não é apenas um evento — é uma **presença**. |
| XI | **O Nome Perdido** | Durante o mapa | Registros antigos mencionam algo **apagado da história**: um nome, uma entidade. |
| XII | **O Nada Observa** | **Ascension IV — Lumière** | **Grande revelação:** a Fracture possui uma **vontade**. Ela observa. Ela espera. |

---

## MAPA 5 — NIL AETERNUM

**Pergunta:** *"Quem é Nihel?"*

| # | Mémoire | Quando | Revelação |
|---|---|---|---|
| XIII | **O Acidente** | Durante o mapa | Nihel **não nasceu maligno**. Nasceu da **mesma origem** que o jogador. |
| XIV | **O Espelho** | Durante o mapa | Nihel e o Seeker são **reflexos** — duas respostas diferentes para a **mesma ferida**. |
| XV | **A Verdade** | **Final do jogo** | **Revelação completa:** a guerra nunca foi entre Luz e Escuridão. Foi entre **duas formas de lidar com a Fracture** — *reunir tudo* ou *aceitar a separação*. **A escolha final pertence ao jogador.** |

---

## Estrutura de Revelação

| Mapa | Pergunta | Resposta |
|---|---|---|
| 1 | O que são os Éclats? | **Ninguém sabe.** |
| 2 | Por que a luz se reúne? | **Porque deseja voltar a ser inteira.** |
| 3 | Isso já aconteceu antes? | **Muitas vezes.** |
| 4 | O que é a Fracture? | **Uma vontade.** |
| 5 | Quem é Nihel? | **O outro lado da mesma história.** |

---

## Papel das Ascensions

A Ascension entrega sempre a **Mémoire mais importante** do mapa. A Mémoire da
Ascension deve:

1. **responder** a pergunta do mapa atual;
2. **recontextualizar** as duas Mémoires anteriores;
3. **criar** a pergunta do próximo mapa.

---

## Regra Principal

> Uma Mémoire **nunca** deve apenas entregar informação. Ela deve **mudar a forma
> como o jogador interpreta tudo que descobriu antes**.

---

## Nota de reconciliação (referência — sem alterar código/lore)

- **Nomes de mapa agora definidos:** Mapa 1 *The Dreaming Wood* (✓ já no jogo),
  Mapa 2 *Cavernes Luminis* (✓ batendo com o gancho em `combat.markBossCleared`),
  Mapa 3 *The Sunken Realm*, Mapa 4 *The Shattered Throne*, Mapa 5 *Nil Aeternum*.
- **Ancoragem na Lore Bible:** Ashen King (Mapa 3), Claimed Queen (Mapa 4), Nihel/
  Nil Aeternum (Mapa 5), Le Premier Éclat/Semente — todos coerentes com
  `eclats_lore.md`. O arco "Nihel é espelho do Seeker" realiza a *Simetria Tripla*
  da lore (Parte X).
- **Dependência de sistema:** as Mémoires "durante o mapa" precisam de uma fonte de
  descoberta (drop de boss/mini boss, marco de kills ou exploração) — decisão de
  design pendente em `ASCENSION_SYSTEM_V1`. As Mémoires "Maior" são entregues pela
  **Ascension** (1 por mapa).
- **Pequena variação de texto** com `ASCENSION_SYSTEM_V1` na pergunta do Mapa 3
  ("O que aconteceu antes?" vs "Isso já aconteceu antes?") — reconciliar quando os
  textos forem finalizados; ambos marcados como *sujeito a mudanças*.
