# CONTINENT1_CANON — Consolidação do Continente 1 (CP-X)

> Consolidação **documental** das decisões aprovadas após a revisão de design.
> **Não** implementa balanceamento, **não** cria sistemas, **não** muda gameplay —
> apenas fixa o canon. Substitui a antiga moldura "Mapa 1" pela de **Continente 1**.
>
> **Supersede a estrutura** de `MAP1_FINAL_SPEC`, `PROGRESSION_MAP1`,
> `ASCENSION_SYSTEM_V1` e `MEMOIRES_V1` no que toca a: nº de áreas, posição do
> Awaken/Boss Final, proteção anti-azar e requisitos da Ascension I.

---

## 1. Estrutura do Continente 1

A estrutura baseada em **"Mapa 1"** é substituída por **Continente 1**:

| Bloco | Áreas |
|---|---|
| **Parte I** | Áreas **1–9** |
| **Parte II** | Áreas **10–20** |
| **Total** | **20 áreas** |

> **Status de implementação:** o código atual implementa **apenas a Parte I
> (Áreas 1–9)** — ver `data.js`/`MAP1_FINAL_SPEC` §1. A **Parte II (Áreas 10–20)**
> é canon **não implementada** (sem balanceamento/conteúdo aqui).

---

## 2. Awaken

- No Continente 1 existe **apenas o First Light**. **Não há segundo Awaken.**
- **Localização:** **Área 9.**
- **Fluxo:**

```
Área 9
  ↓
Guardião
  ↓
Awaken (First Light)
```

> Reconciliação: o requisito de Awaken já existe no código (`data.awakens` /
> `awaken.js`). O canon **fixa a localização na Área 9** (via Guardião) — a
> calibração dos requisitos é da Fase 3, fora do escopo desta consolidação.

---

## 3. Mémoires

Continuam sendo as **3 da Era I** (sistema retroativo já implementado — CP-2A…2E):

1. **du Premier Matin**
2. **des Rires**
3. **de la Marche**

Ciclo já existente: `notFound → found → restored → Lv1…Lv10 → Era I Restaurada`.

---

## 4. Descoberta das Mémoires — Proteção Anti-Azar

**Regra principal:** podem cair em **qualquer área** (todas as fontes; chance
maior em conteúdo mais difícil — ver `MEMOIRES_V1`).

**Proteção anti-azar** (garantia caso ainda **não** tenham sido encontradas):

| Mémoire | Garantida até |
|---|---|
| **Mémoire 1** — du Premier Matin | **Área 8** |
| **Mémoire 2** — des Rires | **Área 14** |
| **Mémoire 3** — de la Marche | **Área 18** |

**Objetivo:** garantir que **todo jogador termine o Continente 1 com as 3
encontradas** (antes da Parte II avançar demais e antes do Boss Final na Área 20).

> Status: a regra de garantia (pity por área) é **canon, não implementada**. A
> descoberta base (CP-2B `rollDiscovery`) já existe; o *pity* entra junto da Fase 3
> (chances reais). Sem números finais aqui.

---

## 5. Boss Final

- Permanece na **Área 20** (Parte II).
- **Lore ainda não definida.** Nenhuma implementação necessária.

> No código atual o Boss Final do conteúdo existente está na **Área 9** (Gilded
> Hollow). Com o Continente 1, a Área 9 passa a hospedar o **Guardião** (gate do
> Awaken) e o **Boss Final move-se para a Área 20** (Parte II, não implementada).

---

## 6. Era I Restaurada

- **Ocorre após o Boss Final** (Área 20).
- **Exige** as **3 Mémoires no Lv10** (`du Premier Matin`, `des Rires`,
  `de la Marche` — todas no nível máximo).

> Mecânica: `isEraRestored(1)` (CP-2E) já deriva isso de `3 × Lv10`. O canon
> apenas **posiciona** a conclusão **após o Boss Final** no fluxo de progressão —
> **nenhuma mudança** em `isEraRestored` é necessária.

---

## 7. Ascension I

**Requisitos (todos):**

```
Awaken (First Light)
  +
Boss Final (Área 20)
  +
Era I Restaurada (3 Mémoires no Lv10)
```

**Resultado:** **Rank Illuminate.**

> Atualiza o requisito anterior ("3 Mémoires *encontradas*") para **Era I
> Restaurada** (3 × Lv10) — um gate mais forte. As demais recompensas da Ascension
> permanecem como em `ASCENSION_SYSTEM_V1` (rank, transformação visual,
> contextualização das Mémoires, bônus pequeno; Séraphine preside).

---

## 8. Fora de escopo (não alterar)

Fórmulas das Mémoires · custos de Éclats · balanceamento · economia · HP · dano ·
drops · lore do Boss Final. Nenhuma mudança de gameplay além desta consolidação
documental.

---

## Fluxo canônico consolidado do Continente 1

```
Parte I (Áreas 1–9)
  · Mémoires podem cair em qualquer área (anti-azar: M1≤Á8)
  · Área 9 → Guardião → Awaken (First Light)
        ↓
Parte II (Áreas 10–20)
  · Mémoires continuam caindo (anti-azar: M2≤Á14, M3≤Á18)
  · restaurar + subir as 3 Mémoires até Lv10
  · Área 20 → Boss Final
        ↓
Era I Restaurada (3 × Lv10, após o Boss Final)
        ↓
Ascension I  →  Rank Illuminate
```
