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

### Era I (Mapa 1) — as 3 Mémoires
| Mémoire | História | Mecânica única | Escala por nível (rascunho, a balancear) |
|---|---|---|---|
| **du Premier Matin** | o amanhecer, a luz plena | **Acúmulo (ramp):** cada inimigo morto soma dano, empilhando até um teto; zera ao trocar de área (um novo amanhecer) | teto cresce com o nível (ex.: Lv1 +20% → Lv10 +200%) |
| **des Rires** | a alegria, os risos | **Proc (sorte):** chance no kill de soltar **loot dobrado** (Lumens + materiais) | chance cresce com o nível (ex.: Lv1 5% → Lv10 50%) |
| **de la Marche** | a jornada, a expansão | **Escala com progresso:** bônus permanente que cresce com o **nº de áreas já desbloqueadas** | valor por área cresce (ex.: Lv1 +1%/área → Lv10 +5%/área) |

- **Princípio:** três *verbos de jogo* diferentes — **caçar** (ramp), **torcer pela
  sorte** (proc), **avançar** (exploração). Nenhuma é "+% num número parado".
- **Números acima são rascunho** — a fechar na fase de balanceamento.
- **Pendência:** o motor global **Clarté** (×1.07^Σníveis) do design original
  **não está decidido** aqui — as Mémoires da Era I usam os mecanismos próprios acima.
  Decidir depois se Clarté coexiste como camada global.

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

## 7. Passivas (Decisão 9)

- **Continente 1 = 15 nós** (5 por árvore: Éclat / Vestige / Fracture), **primeiro
  tier simples**, **cada nó distinto** (sem clones). Desenho completo em
  **`docs/PASSIVES_V1.md`**.
- Próximos continentes abrem +5 por árvore (Grupo 2, 3…).
- Moeda = **Vestiges**; árvore destrava na 1ª Convergence.
- Supera a estrutura auditada em `PASSIVES_AUDIT.md` (45 nós, ~28 clones, 3 mortos).

## 8. Pendências ainda em aberto

- **"Fracture"**: nó/árvore de passiva (HP/defesa) vs. La Fracture (evento cósmico da
  lore) — mesmo nome, coisas diferentes. (Última pergunta do grill.)

---

## 9. Tarefas de implementação geradas por este canon
*(infra/código — a executar em CPs futuros, fora desta entrevista)*

1. **UI World Map:** duas telas (Mapa 1 / Mapa 2), trocáveis; corrigir `ui.js`
   (hoje só 9 nós; áreas 10–20 colapsam em `[50,50]`).
2. **Awaken gate:** marcar "Guardião (Área 9) derrotado" e exigir no `awaken.js`.
3. **Ranks:** adicionar `Endormi`; rank vira `Seeker` no Awaken; remover `data.tiers`
   e a escada Mortal→Radiant Ascendant.
4. **Mémoires Era I:** implementar os 3 mecanismos próprios (ramp / proc / escala).
5. **Lore:** herói começa `Endormi`; First Light = despertar em Seeker.
6. **Economia:** renomear `convergencePoints → Vestiges` (Decisão 7).
7. **Convergence:** remover comentário "PLACEHOLDER" do gate=80 (agora canônico);
   adicionar aviso/tutorial ao destravar (Decisão 8).
8. **Passivas:** implementar os 15 nós de `PASSIVES_V1.md` (4 efeitos novos; reviver
   Weakened Void e Void Awareness; tirar Void Piercing do tier 1).
9. **Higiene:** corrigir log órfão do Boss Final (`combat.js` "Dreaming Wood / Map 1
   complete"); corrigir header mentiroso de `memoires.js`.
