# Éclats of Lumière — Constituição do Projeto (Versão Consolidada)

> Documento canônico de design. Define a visão, a filosofia e as regras dos
> sistemas do jogo. Em caso de conflito entre código e este documento, este
> documento é a intenção; o código deve convergir para ele.

---

## Visão do Projeto

Éclats of Lumière é um **Idle RPG** focado em:

- Progressão permanente
- Exploração
- Descoberta de conteúdo
- Evolução gradual da conta
- Marcos narrativos de poder

O prestígio principal do jogo **NÃO é dano**.

O prestígio principal é:

- **Mapa alcançado**
- **Área alcançada**
- **Awaken alcançado**

---

## Filosofia Central

O jogador não está farmando moedas.

O jogador está farmando **evolução**.

### Loop principal

```
Matar mobs
  ↓
Ganhar Lumens
  ↓
Melhorar Gear

Matar mobs
  ↓
Ganhar Materiais de Gear
  ↓
Promover Raridade

Matar mobs
  ↓
Ganhar Materiais de Awaken
  ↓
Desbloquear Awaken
  ↓
Avançar Áreas
  ↓
Convergence
  ↓
Passivas
  ↓
Nova tentativa mais eficiente
```

---

## Recursos do Jogo

### Lumens

Usados para:

- Upgrade de Gear
- Custos gerais

### Materiais de Gear

Usados para:

- Promoção de raridade

### Materiais de Awaken

Usados para:

- Evoluções do personagem

> **Regra:** Nenhum novo recurso deve ser criado sem gerar uma **nova decisão
> significativa** para o jogador.

---

## Gear

### Filosofia

Gear é a **principal fonte de poder** do jogo.

O Gear é **permanente**. Nunca é substituído. A progressão acontece sobre as
**mesmas peças** durante toda a jornada.

### Slots

- Weapon
- Helmet
- Armor
- Gloves
- Boots
- Cloak

### Função das Peças

| Peça | Função |
|---|---|
| Weapon | Dano |
| Helmet | HP |
| Armor | HP / Defesa |
| Gloves | Crítico |
| Boots | Velocidade |
| Cloak | Economia |

### Progressão

Todas as peças:

- Possuem **mesmo custo** por nível
- Possuem **mesmo cap**
- Seguem **mesma curva** de progressão

O jogador escolhe livremente quais priorizar.

### Raridades

Mapa 1 contém apenas:

- Common
- Uncommon

### Caps

| Raridade | Cap |
|---|---|
| Common | 500 |
| Uncommon | 1200 |

### Promoção

A promoção só pode ocorrer quando o item atinge o **cap atual**.

```
Weapon Common 500
  ↓ Promove
Weapon Uncommon 500   (o nível é preservado)
```

### Filosofia (reforço)

Nenhum investimento é perdido. Toda progressão é **permanente**.

---

## Convergence

### Filosofia

Convergence é uma **recompensa**, não uma punição. O jogador deve **querer**
convergir.

### O que reseta

- Nível
- XP
- Progresso da run
- Recursos temporários

### O que permanece

- Gear
- Níveis do Gear
- Raridades
- Passivas
- Áreas desbloqueadas
- Awaken

### Função

- **Convergence melhora a conta.**
- **Gear melhora a run.**

### Meta do Mapa 1

Entre **8 e 12 Convergences** até concluir o First Light.

---

## Passivas

### Filosofia

Passivas são **permanentes**. **Sem respec.** A árvore cresce junto com o jogo.

Novos nós aparecem conforme:

- Awaken
- Novos mapas
- Novos sistemas

### Éclat — Combate

Exemplos:

- Dano
- Crit Rate
- Crit Damage
- Attack Speed
- Elite Damage
- Boss Damage
- Conversão HP → Dano

### Vestige — Economia

Exemplos:

- Lumens
- XP
- Materiais
- Drops
- Farm

### Fracture — Metaprogressão

Exemplos:

- Gear
- Convergence
- Awaken
- Progressão da conta

---

## Awaken

### Filosofia

Awaken **não é build**. Awaken **não é reset**. Awaken é um **capítulo da jornada**.

### Progressão

Todos os jogadores seguem o **mesmo caminho**:

```
Mortal
  ↓
First Light
  ↓
Lightbearer
  ↓
Radiant Ascendant
  ↓
...
```

### Função

Cada Awaken deve:

- Mudar a **identidade** do personagem
- Entregar **grande salto de poder**
- Desbloquear **novo conteúdo**

### First Light

Primeiro grande objetivo do jogo. Representa a **conclusão do Capítulo 1**.

#### Requisitos Esperados

- Área 9 alcançada
- Equipamentos Uncommon
- Materiais de Awaken
- 8–12 Convergences
- Nível mínimo do personagem

#### Recompensa

- Grande salto de poder
- Desbloqueio do próximo capítulo

---

## Estrutura do Mapa 1

Mapa 1 possui:

- 9 áreas
- Mobs comuns
- Mobs especiais
- Mini Bosses
- Boss Final na Área 9

### Jornada do Jogador

| Área | Função | Aprendizado / Marco |
|---|---|---|
| **1** | Aprender o jogo | Combate, Lumens, Gear. Parede: nível necessário para a Área 2. |
| **2** | Aprender Gear | Descobre: **Gear = Poder**. |
| **3** | Descobrir Convergence | Convergence é desbloqueada. Ainda não é obrigatória. |
| **4** | Primeira parede real | Primeira Convergence acontece naturalmente. Primeiras passivas. Aprende: Gear melhora a run · Convergence melhora a conta. |
| **5** | Descobrir Raridade e Materiais | Primeiras promoções para Uncommon. Aprende: Lumens = Níveis · Materiais = Raridade. |
| **6** | Descobrir First Light | Primeiro contato com o objetivo final do capítulo. Última área relativamente confortável. |
| **7** | Integração dos sistemas | Passam a importar ao mesmo tempo: Gear, Raridade, Convergence, Passivas, Materiais. Primeira grande parede de dano e preparação. |
| **8** | Preparação Final | Jogador próximo dos requisitos. Sensação: *"Estou quase pronto."* |
| **9** | Julgamento Final | O Boss valida se o jogador realmente concluiu o capítulo. |

### Boss Final

- **Sem First Light:** impossível vencer.
- **Com First Light:** possível vencer.

---

## Estado Atual do Projeto

- **Fase 1 — Identidade do jogo:** ✅ Concluída.
- **Fase 2 — Estrutura dos sistemas:** ✅ Concluída.
- **Próxima fase — Construção da planilha matemática do Mapa 1.**

### A definir na planilha matemática

- DPS esperado por área
- Nível médio de Gear por área
- Poder médio das Convergences
- Poder médio das Passivas
- HP dos mobs
- HP dos elites
- HP dos minibosses
- HP dos bosses
