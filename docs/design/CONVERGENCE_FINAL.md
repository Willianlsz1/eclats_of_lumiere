# CONVERGENCE_FINAL

> Especificação canônica do sistema de Convergence e das três Árvores de Passivas.
> Documento de design — define intenção e regras. O código deve convergir para cá.

## Objetivo

Convergence é o **principal sistema de metaprogressão** de Éclats of Lumière.

Sua função é permitir que o jogador **reinicie uma run** para obter **Pontos de
Convergence** e investir nas **Árvores de Passivas**.

- Convergence **não concede poder diretamente**.
- O poder é obtido **através das passivas** adquiridas com os pontos recebidos.

---

## Filosofia

- Convergence **não é punição**.
- Convergence é uma **decisão estratégica**.
- O jogador troca **progresso temporário** por **crescimento permanente da conta**.

---

## O que é resetado

Ao realizar uma Convergence:

- Nível do personagem
- XP atual
- Progresso da run
- Progresso da área atual
- Recursos temporários da run

---

## O que é preservado

- Gear
- Níveis do Gear
- Raridades do Gear
- Materiais de Gear
- Materiais de Awaken
- Passivas
- Awaken
- Áreas desbloqueadas
- Convergences anteriores

---

## Desbloqueio

> **Decisão oficial:** Convergence é desbloqueada por **NÍVEL**, não por Área
> (ver `PRE_BALANCE_REVIEW_V2`). `canConverge() = nível ≥ gateLevel`.

- Convergence desbloqueia **aproximadamente entre os níveis correspondentes ao
  início da Área 3** (faixa estimada ~350–500; valor final na Fase 3).
- A **primeira** Convergence normalmente ocorre por volta dos níveis da **Área 4**
  (~700–1150).
- O sistema deve ser **descoberto naturalmente** através da progressão; o gate por
  nível deixa o jogador escolher o ritmo (convergir cedo ou tarde).

---

## Meta do Mapa 1

O jogador deve realizar aproximadamente **8 a 12 Convergences** antes de concluir o
**First Light**.

---

## Recompensa

Convergence concede **Pontos de Convergence** — e nada além disso.

**Não** concede diretamente:

- Dano
- HP
- Lumens
- XP

---

## Pontos de Convergence

Os pontos recebidos devem considerar:

- Área alcançada
- Nível do personagem
- Bosses derrotados
- Kills realizadas

### Filosofia da Fórmula

A **maior parte** da recompensa deve vir da **área alcançada**.

Importância relativa:

```
Área > Bosses > Nível > Kills
```

O jogador deve ser **incentivado a avançar** — não apenas a farmar infinitamente.

### Estrutura Conceitual

```
Pontos = Área + Bosses + Nível + Kills
```

> Os valores exatos serão definidos durante o balanceamento.

---

## Árvores de Passivas

Todos os pontos obtidos são utilizados em uma das **três árvores**.

### Éclat — Combate e Vitalidade

Pergunta: *"Como fico mais forte?"*

| # | Nó | | # | Nó |
|---|---|---|---|---|
| 1 | ATK % | | 9 | Boss Damage |
| 2 | ATK % | | 10 | HP % |
| 3 | ATK % | | 11 | HP % |
| 4 | Crit Rate | | 12 | HP → Dano |
| 5 | Crit Rate | | 13 | ATK % |
| 6 | Crit Damage | | 14 | Crit Damage |
| 7 | Boss Damage | | 15 | Capstone Híbrido |
| 8 | Elite Damage | | | |

### Vestige — Economia e Farm

Pergunta: *"Como evoluo mais rápido?"*

| # | Nó | | # | Nó |
|---|---|---|---|---|
| 1 | Lumens % | | 9 | Materiais Gerais % |
| 2 | Lumens % | | 10 | Drop Rate |
| 3 | Lumens % | | 11 | Drop Rate |
| 4 | XP % | | 12 | Quantidade de Materiais |
| 5 | XP % | | 13 | Lumens % |
| 6 | XP % | | 14 | Materiais % |
| 7 | Material Common % | | 15 | Capstone Prosperidade Infinita |
| 8 | Material Uncommon % | | | |

### Fracture — Metaprogressão e Manipulação das Regras do Mundo

Pergunta: *"Como acelero minha conta?"*

| # | Nó | | # | Nó |
|---|---|---|---|---|
| 1 | Pontos de Convergence % | | 9 | Mais inimigos simultâneos |
| 2 | Pontos de Convergence % | | 10 | XP de Gear |
| 3 | Pontos mínimos garantidos | | 11 | Redução de custo de Upgrade |
| 4 | Materiais de Awaken % | | 12 | Redução de custo de Promoção |
| 5 | Materiais de Awaken % | | 13 | Eficiência de Convergence |
| 6 | Redução de requisitos de Awaken | | 14 | Eficiência de Awaken |
| 7 | Chance de Elite | | 15 | Capstone Híbrido |
| 8 | Threshold menor para Mini Boss | | | |

---

## Regras das Árvores

- **Sem respec.**
- Escolhas **permanentes**.
- Novos nós podem surgir em **mapas futuros**.
- Cada árvore possui **15 nós** visíveis inicialmente.
- Algumas passivas possuem **múltiplos níveis**.
- Algumas passivas possuem **apenas um nível**.

---

## Relação com Awaken

- Convergence **acelera** o acesso aos Awaken.
- Awaken **não substitui** Convergence.
- Convergence **não substitui** Awaken.
- Os dois sistemas **coexistem**.

---

## Relação com Gear

- Gear é a principal fonte de poder da **run**.
- Convergence é a principal fonte de poder **permanente**.
- **Nenhum** dos dois deve dominar completamente o outro.

---

## Critérios de Balanceamento

O jogador deve sentir:

| Fase | Impacto |
|---|---|
| Primeiras Convergences | moderado |
| Convergences intermediárias | significativo |
| Convergences avançadas | transformador |

Sem criar **saltos absurdos** de poder.

---

## Objetivo Final

Criar um ciclo:

```
Matar
  ↓
Evoluir Gear
  ↓
Avançar Áreas
  ↓
Convergence
  ↓
Comprar Passivas
  ↓
Retornar mais forte
  ↓
Avançar novamente
```

Este é o **principal loop de progressão** do jogo.
