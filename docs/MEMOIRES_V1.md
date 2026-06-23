# MEMOIRES_V1 — Especificação Canônica (Mapa 1)

> Fecha a **primeira versão jogável** das Mémoires para o Mapa 1. **Não** define
> balanceamento final — define **estrutura, fluxo, aquisição e integração**. Todos
> os valores numéricos ficam para a **Fase 3**.
>
> **Supersede** (no que toca à aquisição de Mémoires): a entrega "3 Mémoires na
> Ascension" de `ASCENSION_SYSTEM_V1` / `MEMOIRES_MASTER_PLAN_V1`. **Aqui as
> Mémoires são ENCONTRADAS na jornada; a Ascension NÃO as concede.**

---

## Conceito

As Mémoires são **fragmentos da memória de Lumière**. O jogador pode **encontrá-las
durante a jornada**; depois de encontradas, podem ser **restauradas e evoluídas**
com **Éclats**. São, ao mesmo tempo:

- **sistema narrativo**;
- **sistema de progressão permanente**.

Nenhuma Mémoire é obrigatória para concluir uma run. Todas fazem parte da
progressão de **longo prazo da conta**.

---

## Estrutura

- **15 Mémoires · 5 Eras · 3 por Era.**
- **Escopo do Mapa 1: apenas a Era I.**

### Era I
1. **du Premier Matin**
2. **des Rires**
3. **de la Marche**

---

## Estados da Mémoire (3)

| Estado | Nível | Descrição |
|---|---|---|
| **Não Encontrada** | Lv0 | o jogador ainda não descobriu a memória |
| **Encontrada** | Lv0 | descoberta, ainda **não restaurada**; pode receber Éclats |
| **Restaurada** | Lv1 | recebeu o 1º investimento; passa ao nível 1; torna-se **ativa** |

---

## Evolução

- **Nível mínimo: 1 · Nível máximo: 10.**
- `Lv0 → Encontrada · Lv1 → Restaurada · Lv2–10 → Evolução`.

**Filosofia:** cada nível deve ser **significativo**; o **Lv10 é uma conquista**; as
Mémoires **não devem ser maximizadas durante o Mapa 1**.

---

## Descoberta (encontrar a Mémoire)

- **Regra geral:** podem ser encontradas em **qualquer área**.
- **Fontes:** Common · Rare · Elite · Mini Boss · Boss.
- **Probabilidade:** **aumenta com a dificuldade do conteúdo** (conteúdo mais
  difícil = maior chance). Valores exatos na **Fase 3**.
- **Proteção:** cada Mémoire é encontrada **apenas uma vez**; após descoberta é
  **removida da tabela de drop**.
- **Meta do Mapa 1:** ao concluir, as **3 Mémoires da Era I** devem ter sido
  encontradas.

---

## Éclats (moeda)

- **Função:** moeda **exclusiva** das Mémoires. **Nenhum outro sistema consome
  Éclats.**
- **Natureza:** recurso **automático**; **não ocupa inventário**.
- **Fontes:** Mini Boss · Boss · Ascension. Valores na **Fase 3**.

---

## Era I — temas e funções

| Mémoire | Tema | Função |
|---|---|---|
| **du Premier Matin** | O primeiro amanhecer de Lumière | **Poder ofensivo global** |
| **des Rires** | A prosperidade da Era Radiante | **Economia global** |
| **de la Marche** | A jornada e a expansão | **Convergence e progressão permanente** |

---

## Era Restaurada

Quando as **3 Mémoires da Era I atingem o nível 10**:

- **Estado:** *Era I Restaurada*.
- **Recompensa:** **amplificação das 3 Mémoires da Era I**. Valor exato na **Fase 3**.

---

## Relação com a Ascension

- **A Ascension NÃO concede Mémoires.**
- As Mémoires podem ser encontradas **antes** da Ascension.
- A Ascension **fornece contexto e compreensão** sobre as memórias já encontradas.
- Ascension e Mémoires são **complementares, não dependentes**.

---

## Estado esperado ao final do Mapa 1

- **3 Mémoires da Era I encontradas.**
- **Algumas restauradas.**
- **Nenhuma obrigação** de possuir Mémoires maximizadas.
- **Éclats acumulados** para evolução futura.
- A progressão das Mémoires **continua nos mapas seguintes**.

---

## Status de implementação

📄 **Decisão canônica — não implementada.** Depende de construir: o recurso
**Éclats** (automático), o **codex de Mémoires** (estados Não Encontrada/Encontrada/
Restaurada + níveis 1–10), a **descoberta via drop** (uma vez, removível da tabela)
e a **Era Restaurada**. Os números (chances, custos em Éclats, efeitos por nível,
amplificação da Era) são da **Fase 3**.

> Fora de escopo do Mapa 1: Eras II–V (Mémoires 4–15) e o motor/efeitos finais.
