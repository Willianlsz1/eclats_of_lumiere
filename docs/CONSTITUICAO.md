# Éclats of Lumière — Constituição do Projeto (Versão Consolidada)

> ⚠️ **[SUPERADA POR `CANON_V2.md`]** — Este documento descrevia o Continente 1
> como tendo **9 áreas / Boss Final na Área 9**. Isso ficou obsoleto: o Continente 1
> agora tem **20 áreas**, organizadas em **2 mapas** (Mapa 1 = 9 áreas, Mapa 2 =
> 11 áreas / Cavernes Luminis). Para a estrutura e as regras vigentes, consulte
> **`docs/CANON_V2.md`** — em caso de conflito, **CANON_V2 prevalece**. O restante
> deste arquivo é mantido por valor histórico/filosófico.

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
| **3** | Descobrir Convergence | Convergence desbloqueia por **nível** (≈ os níveis correspondentes ao início da Área 3). Ainda não é obrigatória. |
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

---
---

# PARTE II — Constituição Consolidada (Itens Validados)

> Revisão consolidada com os itens já validados. Onde houver divergência com a
> Parte I, **esta Parte II prevalece** (é a mais recente). Acrescenta pilares,
> estrutura de inimigos, filosofia de combate (TTK alvo) e escala de longo prazo.

## Visão do Projeto

Éclats of Lumière é um **Idle RPG** focado em:

- Progressão permanente
- Descoberta
- Exploração
- Evolução da conta
- Marcos de poder

O jogador deve sentir **crescimento constante** durante toda a jornada.

---

## Pilares do Jogo

| Pilar | Papel |
|---|---|
| **Gear** | Principal fonte de poder da **run**. |
| **Convergence** | Principal sistema de **metaprogressão**. Entrega **pontos**, não poder diretamente. |
| **Passivas** | Transformam pontos de Convergence em **bônus permanentes**. |
| **Awaken** | Marcos narrativos e mecânicos. Representam a **evolução do personagem**. |

---

## Filosofia de Progressão

O jogo **não gira em torno de um único sistema**.

O poder final do personagem vem da **combinação** de:

- Gear
- Passivas
- Convergence
- Awaken

> **Nenhum sistema deve dominar completamente os demais.**

---

## Recursos

| Recurso | Usado para |
|---|---|
| **Lumens** | Evoluir Gear · progressão geral |
| **Materiais de Gear** | Promoção de raridade |
| **Materiais de Awaken** | Evoluções do personagem · progressão de capítulos |

---

## Gear

### Filosofia

Gear é **permanente**. Nunca é substituído. A progressão ocorre sobre as **mesmas
peças**.

### Slots Iniciais (Mapa 1) — 6 peças

| Peça | Função |
|---|---|
| Weapon | Dano |
| Helmet | HP |
| Armor | HP e sobrevivência |
| Gloves | Crítico |
| Boots | Velocidade |
| Cloak | Economia |

### Raridades (Mapa 1) e Caps

| Raridade | Cap |
|---|---|
| Common | 500 |
| Uncommon | 1200 |

### Promoção

- Só pode promover ao **atingir o cap atual**.
- O **nível é preservado**.
- Apenas o **cap aumenta**.

```
Weapon Common 500
  ↓ Promoção
Weapon Uncommon 500
  ↓
Novo cap = 1200
```

---

## Convergence

### Filosofia

Convergence **não é punição**. É uma **decisão estratégica**.

### O que reseta

- Nível do personagem
- XP da run
- Recursos temporários

### O que permanece

- Gear · Níveis do Gear · Raridades
- Passivas · Awaken
- Áreas desbloqueadas

### Recompensa

Convergence concede **apenas Pontos de Convergence**.

> Os **bônus vêm das passivas**, não da Convergence diretamente.

### Meta do Mapa 1

Entre **8 e 12 Convergences** até concluir o First Light.

---

## Passivas

### Filosofia

Permanentes. **Sem respec.** Novos nós aparecem progressivamente.

| Árvore | Foco | Exemplos | Objetivo |
|---|---|---|---|
| **Éclat** | Combate | Dano · Crit Rate · Crit Damage · Boss Damage · Elite Damage · HP convertido em dano | — |
| **Vestige** | Economia | Lumens · XP · Materiais · Drop Rate | **Acelerar o farm** |
| **Fracture** | Metaprogressão | Gear · Convergence · Awaken · Progressão da conta | — |

---

## Awaken

### Filosofia

Awaken **não é build**. **Não é reset**. É um **capítulo da jornada**.

### Progressão (mesma linha evolutiva para todos)

```
Mortal → First Light → Lightbearer → Radiant Ascendant → ...
```

### First Light

- Primeiro grande objetivo do jogo; encerra o **Capítulo 1**.
- **Sensação desejada:** transformação.
- **Impacto:** aproximadamente **5× mais poder efetivo**.
- **Função:** encerrar o Mapa 1 · validar todos os sistemas · permitir a derrota do
  Boss Final.

---

## Estrutura do Mapa 1

Mapa 1 contém: **9 áreas**, mobs comuns, mobs raros, mobs elites, mini bosses e um
Boss Final.

### Jornada das Áreas

| Área | Função |
|---|---|
| **1** | Aprender o jogo: combate, Lumens, Gear. |
| **2** | Aprender Gear — Gear passa a importar. |
| **3** | Descobrir Convergence. |
| **4** | Primeira parede real. Primeira Convergence. Primeiras passivas. |
| **5** | Descobrir Materiais e Raridade. Primeiras promoções. |
| **6** | Primeiro contato com First Light. |
| **7** | Integração dos sistemas: Gear, Convergence, Passivas, Materiais e Raridade passam a importar simultaneamente. |
| **8** | Preparação Final. Sensação: *"Estou quase pronto."* |
| **9** | Conclusão dos requisitos. Preparação para First Light. |

---

## Estrutura dos Inimigos

| Inimigo | Aparição | Papel / Recompensa |
|---|---|---|
| **Mob Comum** | Maioria das kills | Base da economia. |
| **Mob Raro** | Chance reduzida | Melhores recompensas. |
| **Mob Elite** | Chance baixa | Bônus agradável. Não é o foco principal da progressão. |
| **Mini Boss** | Por **threshold de kills** (ex.: 2000 kills → aparece) | **Principal:** Materiais de Gear · **Secundária:** Materiais de Awaken. |
| **Boss** | Marco de área | Responsável por concluir áreas. |

---

## Filosofia de Combate (TTK alvo)

| Alvo | Tempo ideal para matar |
|---|---|
| Mob Comum | **1 a 3 segundos** |
| Elite | **10 a 20 segundos** |
| Mini Boss | **30 a 60 segundos** |
| Boss | **1 a 3 minutos** |

---

## Escala Global

- **Dentro de um mapa:** crescimento **forte** — as áreas devem escalar
  significativamente.
- **Entre mapas:** transição **controlada** — o jogador deve conseguir farmar a
  primeira área do mapa seguinte.

```
Fim do mapa anterior
  ↓
Primeira área do próximo mapa
  ↓
Jogável imediatamente
```

### Filosofia de Progressão dos Mapas

O jogador **nunca** deve sentir *"Estou travado."*

Mas **deve** sentir: *"Consigo avançar, porém preciso evoluir novamente."*

---

## Escala de Longo Prazo

- Objetivo final do projeto: trabalhar com números **extremamente altos**.
- Faixa alvo: até **aproximadamente 1e308**.
- Mapas finais devem operar em ordens de grandeza **muito superiores** aos mapas
  iniciais.

---

## Estado Atual

- **Fase de arquitetura do Mapa 1:** praticamente concluída.
- **Próxima etapa — Construção das planilhas de:**
  - Progressão
  - Economia
  - Combate
  - HP dos inimigos
  - DPS esperado do jogador
  - Custos de Gear
  - Curvas de Convergence
