# ASCENSION_SYSTEM_V1

> Documento de design **canônico**. Define o sistema de **Ascension** — a
> progressão narrativa / de identidade do Seeker. Resolve lacunas apontadas em
> `LORE_GAMEPLAY_AUDIT` (Ascension/ranks/Mémoires ausentes). Sem implementação
> aqui; quando virar ordem de build, seguir o padrão de infraestrutura+testes.

---

## Propósito

Ascension é o principal sistema de **progressão narrativa** de Éclats of Lumière.

Enquanto **Awaken** representa crescimento de **poder**, **Ascension** representa
crescimento de **identidade**. A Ascension marca o **reconhecimento oficial** da
transformação do Seeker.

---

## Filosofia

| Sistema | Pergunta que responde |
|---|---|
| **Convergence** | "Como fico mais forte?" |
| **Awaken** | "Quanto eu evoluí?" |
| **Ascension** | "Quem eu me tornei?" |

---

## Estrutura

Cada mapa termina com uma **Ascension**. Ela **encerra um capítulo** da jornada e
**inicia o próximo**.

### Fluxo

```
Mapa
  ↓
Awaken
  ↓
Boss Final
  ↓
Ascension
  ↓
Mémoires
  ↓
Próximo Mapa
```

---

## Ranks da Ordre

> O rank **NÃO** é determinado por nível. O rank é determinado por **Ascension**.

| Marco | Rank | Conclui |
|---|---|---|
| Início | **Seeker** | — |
| Ascension I | **Illuminate** | Mapa 1 |
| Ascension II | **Éclairé** | Mapa 2 |
| Ascension III | **L'Éveillé** | Mapa 3 |
| Ascension IV | **Lumière** | Mapa 4 |

### Mapa 5

Não existe novo rank. **Lumière** representa o **ápice da Ordre**. O conflito deixa
de ser sobre ascensão — passa a ser sobre **Nihel**.

---

## Requisitos

Uma Ascension exige:

- **Awaken** concluído
- **Boss final** derrotado
- **Era restaurada** (as Mémoires da Era no nível máximo)
- Outros requisitos específicos do mapa

> 🔄 **Atualizado por `CONTINENT1_CANON` (CP-X):** no Continente 1, a **Ascension I**
> exige **Awaken (First Light) + Boss Final (Área 20) + Era I Restaurada (3 × Lv10)**
> → rank **Illuminate**. O requisito antigo "Mémoires encontradas" passa a ser
> **Era Restaurada** (gate mais forte).

---

## Recompensas

Uma Ascension concede **quatro** categorias de recompensa.

### 1. Rank
Novo título. Novo status dentro da Ordre.

### 2. Transformação Visual
Mudança **permanente** no personagem. Exemplos: vestimentas · halo · luz · cor ·
efeitos.

### 3. Mémoires
> 🔄 **Revisado por `MEMOIRES_V1`:** a Ascension **NÃO concede Mémoires**. As
> Mémoires são **encontradas durante a jornada** (drops). A Ascension entrega, no
> lugar, **compreensão e contextualização das 3 Mémoires da Era I já encontradas**
> — recompensa narrativa, não a posse das Mémoires.

### 4. Bônus Permanente
Pequeno bônus **global**.

- Nunca deve competir com Awaken.
- Nunca deve ser a recompensa principal.

---

## Mémoires

As Mémoires representam **fragmentos da verdade**. São a principal **recompensa
emocional** do jogo.

### Estrutura
- **3 Mémoires por mapa.**
- **15 Mémoires totais.**

### Função — revelar:
- história do mundo
- origem da Fracture
- origem da Ordre
- natureza dos Éclats
- identidade de Nihel
- verdade final

---

## Relações entre sistemas

### Ascension × Awaken
São sistemas **diferentes**.

| | Função |
|---|---|
| **Awaken** | Poder |
| **Ascension** | Narrativa · Identidade · Reconhecimento |

### Ascension × Convergence
- **Convergence** é uma **ferramenta**. **Ascension** é um **marco**.
- Convergence pode ocorrer **dezenas de vezes**.
- Ascension ocorre **apenas uma vez por mapa**.

---

## Relação com os Mapas

Cada mapa deve **responder uma pergunta**. Cada Ascension **revela parte da
resposta**.

| Mapa | Pergunta |
|---|---|
| **Mapa 1** | "O que são os Éclats?" |
| **Mapa 2** | "Por que a luz tenta se reunir?" |
| **Mapa 3** | "O que aconteceu antes?" |
| **Mapa 4** | "O que é a Fracture?" |
| **Mapa 5** | "Quem é Nihel?" |

---

## Objetivo Final

Quando o jogador alcança **Lumière**, ele possui:

- **todos os ranks** da Ordre
- **a maioria das Mémoires**
- **compreensão parcial** da verdade

O **Mapa 5** existe para **confrontar essa verdade**.

---

## Nota de reconciliação com o código atual (para a fase de build)

> Apenas registro — nenhuma alteração de código feita aqui.

- **Substitui o rank por nível.** Hoje `data.tiers` destrava Seeker→Lumière nos
  níveis **1/10/25/50/100** (consumidos na Área 1–2 — ver `LORE_GAMEPLAY_AUDIT`
  §3). Este design move o rank para **Ascension por mapa** (1 rank por mapa, 4
  Ascensions). A escada por nível deve ser **aposentada** quando Ascension for
  implementada.
- **Encadeia com sistemas já existentes:** o requisito "Awaken concluído" usa
  `awakens[]`/`awakenTier`; "Boss final derrotado" usa `mapOneCleared` /
  `markBossCleared`; "Mémoires encontradas" é um **sistema novo** (codex), ainda
  inexistente.
- **Fecha 3 buracos do audit:** Ascension/Séraphine (cerimônia), ranks
  significativos, e o sistema de **Mémoires** (a maior oportunidade narrativa).
- **Pendências de design a decidir antes do build:** como as Mémoires são
  **encontradas** (drop? boss? exploração?); a fronteira "fim de mapa" first-class
  (hoje as áreas são uma lista plana); e se Séraphine preside a Ascension (NPC).
