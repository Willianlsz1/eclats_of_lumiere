# CANON V2 — Éclats of Lumière (Continente 1 / Era I)

> **Fonte única da verdade** do Continente 1 / Era I. Em caso de conflito com
> qualquer outro documento (`CONSTITUICAO.md`, `MEMOIRES_V1`, `MAP1_FINAL_SPEC`,
> `CANONICAL_ALIGNMENT_AUDIT_V1`, etc.) ou com o código, **este documento prevalece**.
>
> Consolidado a partir da entrevista "grill me with docs" (ver
> `GRILL_ME_WITH_DOCS_V1.md`). Data: 2026-06-23.
>
> Docs superados por este: `CONSTITUICAO.md` (descrevia 9 áreas — era só o Mapa 1).

---

## 1. Estrutura do Continente 1 (Decisão 5)

O **Continente 1** é **um conjunto único**, dividido internamente em **2 mapas**
(referência de design: o mapa-múndi do **Grand Chase** — um continente com vários
mapas por dentro — em escala maior). A divisão existe **para não poluir a tela**:
o jogador vê **um mapa de cada vez**, nunca os 20 nós juntos.

| Mapa | Nome | Áreas | Chefe final | Marco |
|---|---|---|---|---|
| **Mapa 1** | The Dreaming Wood | **9** (áreas 1–9) | **The Guardian** (Área 9) | derrotá-lo = **Awaken** + abre o Mapa 2 |
| **Mapa 2** | **Cavernes Luminis** | **11** (áreas 10–20) | **The Gilded Hollow** (Área 20) | derrotá-lo = completa o Continente → **Ascensão I** |

- **Total: 20 áreas.** "9 áreas" (docs antigos) referia-se **só ao Mapa 1**.
- **"Cavernes Luminis" = Mapa 2** (as 11 áreas / antiga "Parte II"). É **um nome só**,
  não um lugar separado. (Resolve o conflito de nomenclatura "Cavernes Luminis vs Mapa 2".)
- **UI:** o World Map deve ter **duas telas** (Mapa 1 e Mapa 2), trocáveis, dentro
  do mesmo continente. *(Pendência de implementação: hoje `ui.js` só tem 9 nós.)*

### Arco de 2 atos
1. **Mapa 1** termina no **Guardião (Área 9)** → derrotá-lo desperta o herói
   (**Awaken / First Light**) e abre o **Mapa 2**.
2. **Mapa 2** termina no **Boss Final (Área 20)** → derrotá-lo completa o Continente
   e libera a **Ascensão I**.

> Dois mapas, dois chefes finais, dois marcos de progressão.

---

## 2. Mémoires — bônus mecânico único por Mémoire (Decisão 1)

As Mémoires **concedem bônus mecânico** (não são só narrativa). **Cada Mémoire tem
um mecanismo próprio e distinto** — não são multiplicadores genéricos iguais.
O nível da Mémoire (Lv1–Lv10) escala a magnitude do seu efeito.

### Era I (Mapa 1) — as 3 Mémoires (IMPLEMENTADO)
> Só valem quando **restauradas**; escalam com o nível (Lv1–10). Magnitudes 1ª
> passagem em `memoires.js` (EFFECT_UNIT), ajustáveis na Fase 3.

| Mémoire | História | Mecânica única (no código) | Sabor |
|---|---|---|---|
| **du Premier Matin** | o amanhecer, a luz plena | **Motor de dano** (`damageMult` × o dano) | poder |
| **des Rires** | a alegria, os risos | **Proc:** chance de **Lumens × 2** por kill (`doubleLumensChance`) | sorte |
| **de la Marche** | a jornada, a expansão | **Escala:** ganhos crescem com **áreas alcançadas** (`gainsMult`) | jornada |

- **Princípio:** três *sabores* diferentes — **motor** (Premier Matin), **sorte**
  (des Rires), **avançar** (de la Marche). Nenhuma é "+% parado".
- Ligadas em `combat.js` (dano no `typeDamageMult`; Lumens no `onKill`). Testes:
  `tests/memoires-effects.test.js`.
- **Pendência futura:** o motor global **Clarté** (×1.07^Σníveis) do design original
  fica fora por ora — as Mémoires usam os mecanismos próprios acima.

---

## 3. Awaken / First Light (Decisões 2 e 4)

- **Nome canônico:** **Awaken** (evento "First Light"). *("Despertar" é só a
  tradução PT — usar "Awaken/First Light" como termo do jogo.)*
- **Requisito do gate (Decisão 2):** o Awaken exige **DERROTAR o Guardião da
  Área 9** — não basta chegar/desbloquear a área.
  *(Pendência de código: `awaken.js` hoje cumpre o requisito só ao desbloquear a
  Área 9. Precisa de uma marca "Guardião derrotado".)*
- **Efeito de identidade (Decisão 4):** o Awaken **transforma o herói de
  `Endormi` em `Seeker`**. Antes do First Light, o herói é **Endormi** (adormecido);
  o Awaken o desperta em **Seeker**; a Ascensão I depois o eleva a **Illuminate**.
  - **Tarefa de lore:** atualizar a narrativa para refletir que o herói começa
    **Endormi** e que o First Light é o despertar que o torna um Seeker.

---

## 4. Ranks / Ascensão (Decisão 3)

**Escada oficial — por Ascensão** (1 degrau a cada Era completa):

| Rank | Como se obtém |
|---|---|
| **Endormi** | estado inicial, antes do Awaken |
| **Seeker** | após o **Awaken** (First Light) |
| **Illuminate** | após a **Ascensão I** (fim do Continente 1) |
| **Éclairé** | Ascensão II |
| **L'Éveillé** | Ascensão III |
| **Lumière** | Ascensão IV (apex) |

- **Apagar do projeto** as outras duas escadas concorrentes:
  - a antiga **Mortal → … → Radiant Ascendant** (docs antigos);
  - o **`data.tiers[].level`** (rank por nível — dado morto; duplica esta escada).
- O Awaken **não** é um degrau da escada de Ascensão — ele é a transição
  `Endormi → Seeker` (ver §3).

---

## 5. Economia de 3 camadas (Decisões 6 e 7)

| Recurso | De onde vem | Pra que serve |
|---|---|---|
| **Lumens** | inimigos comuns | gear / básico |
| **Vestiges** | **Convergence** | **passivas** |
| **Éclats** | Mini Boss / Boss | **Mémoires** (meta) |

- **Decisão 6 — Éclat = o fragmento É a moeda.** O fragmento sagrado da luz quebrada
  (lore) é o mesmo recurso que se coleta dos inimigos e gasta nas Mémoires. Colisão
  **intencional e temática**: juntar a luz quebrada de volta.
- **Decisão 7 — "Vestiges" = os pontos da Convergence.** Renomear no código
  `convergencePoints → Vestiges`. Reaproveita o nome que, no design antigo, já era a
  moeda das passivas. Fecha a hierarquia canônica **Lumens < Vestiges < Éclats**.

## 6. Convergence (Decisão 8)

- **Gate = nível 80 (Área 2)** — **canônico** (não é mais placeholder). A Convergence
  abre **cedo**, depois de o jogador sentir um pouco o jogo.
- **Onboarding:** ao destravar, **avisar o jogador** (mensagem/tutorial) explicando o
  que é a Convergence e suas vantagens.
- *(Atualiza/supera os docs que diziam "Área 3".)*

## 7. Passivas (Decisão 9 — REVISADA na implementação)

> **Decisão de criador (implementada):** mantém-se a estrutura **3 árvores × 15 nós
> (45)** que o motor, a UI (Árvore-Mundo) e o gating já suportavam — em vez de
> encolher para 5/árvore (que seria churn sem ganho). O problema real do audit
> (clones + nós mortos) foi resolvido por **dar a cada nó um efeito real e descrito**
> e **injetar mecânicas memoráveis**, concentradas na Fracture. Isto **supera** a
> simplificação "15 nós / 5 por árvore" do `PASSIVES_V1.md`.

- **Continente 1 = 45 nós** (3 árvores × 15), **moeda = Vestiges**, destrava na 1ª
  Convergence; gating: maximizar um grupo de 5 libera o próximo; nível máx 12.
- **Cada nó FAZ algo** (magnitudes reais, 1ª passagem ajustável). Nenhum nó morto.
- **Mecânicas memoráveis** (não "+%" genérico):
  - **Éclat:** Bloodlust (dano por kill na run, zera na Convergence), Iron Body
    (HP→dano), Slayer (Boss/Mini Boss), Exterminator (Elite).
  - **Vestige:** Deep Explorer (Lumens por área), + economia/eficiência.
  - **Fracture:** Ancient Memory (ATK/Convergence), Fractured Destiny (dano/área,
    permanente), Perfect Cycle (mult global a cada 10 Convergences), Fragment
    Resonance (cada Convergence amplifica TODAS as passivas).
- Implementação: `src/passives.js` (UNIT/trees/EFFECT_DESC/dynDamageMult/dynLumensMult,
  Resonance em `effects()`), ligada em `combat.js`/`economy.js`. Testes:
  `tests/passives.test.js`. Próximos continentes abrem mais grupos.
- Supera a estrutura auditada em `PASSIVES_AUDIT.md` (clones/mortos).

## 8. Identidade das árvores de passiva (Decisão 10)

A palavra **"Fracture"** é mantida na árvore (não renomear) — é **proposital**: a
árvore homônima de *La Fracture* (o evento cósmico) é a **mais forte**, a da
**meta-progressão**. Trinca de papéis:

- **Éclat** → poder **imediato** (dano agora).
- **Vestige** → **recursos** (economia).
- **Fracture** → **longo prazo / meta** — seus nós são **fracos no início mas escalam
  até dominar** (composição, profundidade, resets). Aposta de longo prazo. Ver a
  árvore redesenhada em `PASSIVES_V1.md`.

> Entrevista "grill me with docs" **encerrada** — 10 decisões registradas.

---

## 9. Tarefas de implementação geradas por este canon — STATUS

1. ⏳ **UI World Map:** duas telas (Mapa 1 / Mapa 2), trocáveis; corrigir `ui.js`
   (hoje só 9 nós; áreas 10–20 colapsam em `[50,50]`). **PENDENTE.**
2. ✅ **Awaken gate:** `guardianDefeated` marcado em `combat.js`, exigido em `awaken.js`.
3. ✅ **Ranks:** `Endormi → Seeker` no Awaken; escada por Ascensão; `data.tiers` removido.
4. ✅ **Mémoires Era I:** 3 bônus implementados (motor/proc/escala) — `memoires.js` + combate.
5. ✅ **Lore:** `docs/LORE_AND_GAMEPLAY.md` (Endormi → First Light → Seeker). *(texto in-game/UI a revisar)*
6. ✅ **Economia:** `convergencePoints → vestiges` + migração de save.
7. ✅/⏳ **Convergence:** gate=80 canônico (✅); aviso/tutorial ao destravar (⏳ pendente).
8. ✅ **Passivas:** 45 nós funcionais + mecânicas memoráveis (`passives.js`) — ver §7 revisado.
9. ✅ **Higiene:** log do Boss Final corrigido; header de `memoires.js` corrigido.

> Documentos-fonte: `SYSTEMS.md` (sistemas), `LORE_AND_GAMEPLAY.md` (lore↔gameplay),
> `PASSIVES_V1.md` (intenção das passivas), este `CANON_V2.md` (decisões).
