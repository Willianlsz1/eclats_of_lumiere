# PROGRESSION_MAP1

> Documento de design — define a jornada do jogador no Mapa 1. **Nomes são
> placeholders a definir depois.** Sem balanceamento numérico final.
>
> ⚠️ **Reenquadrado por `CONTINENT1_CANON` (CP-X):** "Mapa 1" = **Parte I (Áreas
> 1–9) do Continente 1** (20 áreas no total). As 9 áreas abaixo continuam válidas
> como Parte I; a Parte II (10–20), a proteção anti-azar das Mémoires, o Boss Final
> na Área 20 e a Ascension I (exige Era I Restaurada) estão em `CONTINENT1_CANON`.

## Objetivo

Este documento define a **jornada completa** do jogador durante o Mapa 1.

Não contém balanceamento numérico final. Define apenas:

- Ordem de descoberta dos sistemas
- Progressão das áreas
- Introdução de mecânicas
- Função de cada área
- Papel dos inimigos
- Progressão até First Light

---

## Filosofia do Mapa 1

O Mapa 1 é um **tutorial expandido**.

Seu objetivo não é apenas apresentar combate — é **ensinar todos os sistemas
principais** do jogo.

Ao final do Mapa 1 o jogador deve compreender:

- Gear
- Lumens
- Convergence
- Passivas
- Materiais
- Promoções
- Awaken
- First Light

---

## Estrutura Geral

| Elemento | Quantidade |
|---|---|
| Áreas | 9 |
| Mini Bosses | 8 |
| Bosses | 9 |
| First Light | 1 |

---

## Jornada das Áreas

### Área 1 — O Despertar

- **Objetivo:** ensinar Combate, XP, Nível, Lumens.
- **Sistemas disponíveis:** Gear Common · Lumens · XP.
- **Sistemas bloqueados:** Convergence · Passivas · Promoção · Awaken.
- **Inimigos:** Comuns · Raros.
- **Boss:** simples — ensina progressão de área.
- **Sensação desejada:** *"Entendi como o jogo funciona."*

### Área 2 — Primeiras Escolhas

- **Objetivo:** ensinar a importância do Gear.
- **Sistemas introduzidos:** Evolução de Gear · diferenças entre slots.
- **Inimigos:** Comuns · Raros.
- **Mini Boss:** o **primeiro** — introduz o threshold de kills.
- **Sensação desejada:** *"Meu Gear importa."*

### Área 3 — Ecos da Convergence

- **Objetivo:** apresentar a existência da Convergence.
- **Desbloqueio:** Convergence desbloqueia por **nível** — aproximadamente entre
  os níveis correspondentes ao **início da Área 3** (não é um gate por Área; ver
  `PRE_BALANCE_REVIEW_V2`).
- **Sistemas introduzidos:** interface de Convergence · primeiras informações
  sobre Passivas.
- **Inimigos:** Comuns · Raros · **Elites**.
- **Mini Boss:** próprio da área.
- **Sensação desejada:** *"Existe uma forma permanente de crescer."*

### Área 4 — Primeira Parede

- **Objetivo:** forçar a primeira Convergence.
- **Sistemas introduzidos:** primeira Convergence · primeiros Pontos · primeiras
  Passivas.
- **Sensação desejada:** *"Voltei mais forte."*

### Área 5 — Materiais e Promoção

- **Objetivo:** introduzir progressão de raridade.
- **Sistemas introduzidos:** Materiais Common · Materiais Uncommon · Promoção
  Common → Uncommon.
- **Drops:** Material Uncommon começa a aparecer (chance baixa).
- **Sensação desejada:** *"Agora existe outro nível de progressão."*

### Área 6 — Ecos da Primeira Luz

- **Objetivo:** apresentar First Light.
- **Sistemas introduzidos:** Materiais de Awaken · requisitos de Awaken.
- **Sensação desejada:** *"Existe algo maior me esperando."*

### Área 7 — Integração

- **Objetivo:** fazer todos os sistemas trabalharem juntos.
- **Sistemas ativos:** Gear · Convergence · Passivas · Promoções · Awaken.
- **Sensação desejada:** *"Preciso otimizar minha conta."*

### Área 8 — Preparação

- **Objetivo:** preparar o jogador para o encerramento.
- **Foco:** últimas Convergences · últimas Promoções · últimos Materiais.
- **Sensação desejada:** *"Estou quase pronto."*

### Área 9 — O Limiar da Luz

- **Objetivo:** concluir os requisitos do First Light.
- **Mini Boss:** **aleatório** — selecionado dentre os Mini Bosses das áreas
  anteriores.
- **Boss Final:** último desafio do Mapa 1.
- **Sensação desejada:** *"Cheguei ao fim de uma jornada."*

---

## Estrutura dos Inimigos

### Comum

- Principal fonte de **XP**, **Lumens** e **Materiais**.
- Presente em **todas** as áreas.

### Raro

- Recompensas superiores: maior quantidade de Lumens, XP e Materiais.

### Elite

- Encontro especial, **chance baixa** de aparecer.
- Recompensas significativamente melhores.

### Mini Boss

- Marco intermediário. Aparece por **threshold de kills**.
- **Recompensas:** Materiais de Gear · maior chance de materiais raros ·
  Materiais de Awaken.

### Boss

- Progressão de área · marco narrativo · fonte de recompensas relevantes.
- Pode **reaparecer** mediante threshold de kills.

---

## Materiais de Gear

### Material Common

- Disponível desde o início.
- Dropado por: Comuns · Raros · Elites · Mini Bosses · Bosses.

### Material Uncommon

- Introduzido na **Área 5**.
- Dropado por:
  - Comuns (chance baixa)
  - Raros (chance melhor)
  - Elites (chance elevada)
  - Mini Bosses
  - Bosses

---

## Materiais de Awaken

- Introduzidos na **Área 6**.
- Utilizados para: **First Light**.

---

## Progressão Esperada

Durante o Mapa 1 o jogador deve:

- Evoluir Gear Common
- Realizar múltiplas Convergences
- Desbloquear passivas
- Promover algumas peças para Uncommon
- Coletar materiais de Awaken
- Preparar First Light

### Estado Esperado ao Final do Mapa 1

O jogador normalmente possui:

- 8 a 12 Convergences realizadas
- Diversas passivas adquiridas
- Algumas peças Uncommon
- Materiais suficientes para First Light
- Conhecimento completo dos sistemas principais

---

## First Light

- **Não exige** Gear específico.
- **Exige** a combinação de:
  - Nível mínimo
  - Área alcançada
  - Materiais de Awaken
  - Kills acumuladas
  - Convergences realizadas

---

## Transição para o Mapa 2

Ao entrar na **Área 1 do Mapa 2** o jogador deve:

- Conseguir farmar **imediatamente**
- Sentir-se mais forte
- Perceber que existe uma **nova jornada** de crescimento

| Nunca deve sentir | Sentimento correto |
|---|---|
| *"Estou travado."* | *"Consigo avançar, mas ainda tenho muito para evoluir."* |
| *"Estou overpowered."* | |
