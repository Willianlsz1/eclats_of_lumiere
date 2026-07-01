# Éclats of Lumière — Pirâmide de Poder dos Inimigos

> Estrutura de design (lore + gameplay). Define os **degraus de poder** dos inimigos, do mais comum ao ápice. Depois isto vira dados no jogo (`combat.js`, `economy.js dropTable`, spawns).
> Números de poder/frequência são **bandas aproximadas** (placeholder) — a estrutura é o que importa; o balance fino vem na implementação.
>
> **Nomenclatura atual (jul/2026):** os tags dos tiers de FLUXO foram renomeados — **Ember · Lumen · Corona** (antes Kindled/Luminous/Radiant) — e o Boss de Área virou **The Harbingers** (antes "Eidola").
>
> ⚠️ **REVISADO pela sessão jul/2026 — ver `docs/lore/DECISOES_JUL26.md` (que VENCE onde divergir):**
> a apresentação oficial virou a **escada de 4 nomes**: **The Vessels** (mobs, Common→Ember→Lumen→Corona) → **The Harbingers** (chefe de GRUPO, 1 a cada 3 áreas) → **NIHELIM** (chefe de mapa, os 7 de Nihel — substituem "Archons"; roster novo: Vhorel, Séveth, Okhra, Naameth, Duskarion, Mireuth, Cindrel) → **NIHEL**. Os tipos (Fragmented/Consumed/Claimed/Cortices) foram **rebaixados a texto de bestiário** — deixam de ser sistema. A estrutura de 8 degraus abaixo segue válida como esqueleto mecânico.

---

## Gancho de lore: a COR é o poder

Quanto mais **luz de Éclat** uma criatura carrega, mais forte e mais **brilhante** ela é. A raridade de um mob não é abstrata — é *quanta luz ele absorveu*. Por isso cada degrau tem uma **cor** (cinza → teal → azul → violeta, as cores de raridade aprovadas na art-direction). O jogador lê o poder pela cor do nome, como já é hoje.

> **Duas linguagens de cor.** Os de **luz** (Fragmented/Consumed) sobem pela régua fria **teal → azul → violeta** (Ember → Lumen → Corona) — a cor conta quanta luz absorveram. Os de **vazio** (Cortices/Claimed) **não acendem**: leem por **escuridão/vermelho** (proximidade de Nihel) e ocupam a escada por força bruta, não por grau de luz. *(Essa metade-vazio — a "corte" — ainda está por fazer.)*

---

## A Pirâmide (base = comum/fraco · topo = raro/forte)

```
                         ▲  NIHEL              degrau 8 · ápice
                        ╱ ╲
                       ╱ A ╲    ARCHON         degrau 7 · Chefe de Mapa       ┐
                      ╱─────╲                  (7 nomeados / nome próprio)     │  MARCOS
                     ╱ HARB. ╲  THE HARBINGERS degrau 6 · Boss de Área         │  entidades únicas
                    ╱─────────╲                (1 por área · "The + …")        │  (nunca solo;
                   ╱ MINI-BOSS ╲ (parqueado)   degrau 5                        ┘  spawn por threshold)
                  ╱─────────────╲
                 ╱    CORONA      ╲ violeta     degrau 4 · elite (modificador) ┐
                ╱─────────────────╲                                            │  FLUXO
               ╱      LUMEN         ╲ azul       degrau 3                       │  mesmo mob, + luz
              ╱─────────────────────╲                                          │  = + raro
             ╱        EMBER           ╲ teal     degrau 2                       │  (a cor = o poder)
            ╱─────────────────────────╲                                        │
           ╱         COMMON             ╲ cinza   degrau 1 · sem tag            ┘
          ╱───────────────────────────────╲
```

---

> 🔗 A **chance** de Ember/Lumen/Corona aparecer é construída pelo jogador (gear acha + passiva levanta o teto), base 0%, caps 30/15/5 — ver `docs/design/RARITY_FIND.md`.

## FLUXO — os que aparecem nas ondas (a cor = o poder)

A raridade **mapeia na espécie** (decisão jul/2026, "Opção A"): quanto mais luz, mais fundo na transformação Fragmented → Consumed. Degraus 1–2 = **Fragmented**; 3–4 = **Consumed** (a luz demais racha o vaso — o modificador do Corona *é* a rachadura).

| Tier | Tag (cor) | O que é | Tipo (lore) | Poder ~×common | Cap |
|------|-----------|---------|-------------|----------------|-----|
| 1 | **Common** (cinza, *sem tag*) | mob base, mal tocado pela luz | Fragmented | 1× | — (toda onda) |
| 2 | **Ember** (teal) | uma fagulha de luz a mais | Fragmented | ~2.5–3× | 30% |
| 3 | **Lumen** (azul) | claramente aceso | Consumed | ~5–6× | 15% |
| 4 | **Corona** (violeta) | saturado de luz — **tem modificador** (escudo, aura, etc.) | Consumed | ~10× | 5% (área 3+) |

> Nameplate: **`Thornlight Stalker`** (comum) → **`… · Ember`** → **`… · Lumen`** → **`… · Corona`**, com o tag na cor do tier. Common = sem tag, nome neutro. O tipo (Fragmented/Consumed) fica por baixo, na camada de lore.
> *(Converged — branco-prismático — fica reservado como variante ultra-rara futura ou pra gear; não usar agora.)*

## MARCOS — encontros especiais (gate de progressão)

| Tier | Nome | Papel | Tipo/Lore |
|------|------|-------|-----------|
| 5 | **Mini-Boss** | encontro especial periódico | ⏸️ **parqueado** (sem nome/definição). *(Os 6 Harbingers da floresta que perderam o posto de grupo NÃO viram Mini-Boss — decidido jul/2026; ficam guardados.)* |
| 6 | **The Harbingers** | **chefe de GRUPO — 1 a cada 3 áreas** (libera o próximo grupo) | o arauto do limiar — manifestação com forma própria; nome poético em inglês ("The + algo"). Do mais fraco ao mais forte dentro do mapa (progressão reta única). *(antes "Eidola"; antes 1 por área — revisado jul/2026)* |
| 7 | **Chefe de Mapa** | clímax do Mapa inteiro | **um dos 7 NIHELIM** (ver tabela abaixo) — 1 por mapa, Mapas 1–7. Okhra é o do Mapa 1 (Gilded Hollow rebaixado a Harbinger). |
| 8 | **Nihel** | o ápice, confrontação final | The Fracture — dimensão/mapa próprio, separado da numeração. *Nome de "nihil" (latim: nada).* |

### Regras dos Marcos (5-8) — decisão do dono
- **Spawn por threshold de kill:** um contador de kills; ao atingir o limite, o Marco **sempre** aparece.
- **Morte reseta o contador:** se o Seeker morre antes de atingir o threshold, o contador zera (tem que sobreviver até lá).
- **Nunca aparecem solo:** o Mini-Boss / Boss / Chefe **sempre vem acompanhado de mobs** (a onda + o marco juntos).
- **Do Elite (Corona) pra cima todos têm um modificador** (escudo/aura/algo diferente) — o "tem algo a mais" que diferencia do mob raso.

---

## Os 7 NIHELIM (degrau 7 — Chefe de Mapa, 1 por mapa)

*(Substituem os "Archons" — os 7 nomes antigos, Kenoth etc., saíram do canon em jul/2026. Ver `docs/lore/DECISOES_JUL26.md` §2–3.)*

**Nihelim** — plural hebraico de Nihel ("os de Nihel", eco de Nephilim/Seraphim). Cada um é um **órgão da Guerra Silenciosa** — uma forma de impedir a convergência. Todo Nihelim carrega um **eco do anel quebrado de Nihel**, distorcido pela sua função; nenhum lê por vermelho (assinatura selada pro Nihel).

| Nihelim | Epíteto | Órgão da guerra | Mapa |
|---|---|---|---|
| **Okhra**     | the Starving Tide   | a Fome (afundou o porto do Mapa 1) | **1** |
| **Naameth**   | the Hollow Choir    | a Voz que Enjaula (fabrica os Consumed) | 2 |
| **Cindrel**   | the Last Ember      | o Fim (colhe a última luz) | 3 |
| **Duskarion** | the Patient Court   | a Sedução (todo Claimed passou pela mesa dele) | 4 |
| **Mireuth**   | the Drowned Silence | o Silenciamento (território neutro, sem amarra com a Ordre) | 5 |
| **Séveth**    | the Gilded Wound    | a Corrupção da Marca | 6 |
| **Vhorel**    | the Unwritten       | o Esquecimento (comeu HaShevirah — derrotá-lo abre Nil Aeternum) | 7 |

---

## Regras gerais da pirâmide *(revisadas jul/2026)*
- **A escada oficial tem 4 nomes:** The Vessels → The Harbingers → Nihelim → Nihel. "The Vessels" (raiz: *Shevirat ha-Kelim*, a quebra dos vasos) é nome de LORE/bestiário — nunca aparece na tela; o nameplate segue `Nome · Ember/Lumen/Corona`.
- **Fragmented / Consumed / Claimed / Cortices = texto de bestiário**, não sistema. A regra antiga "tipo ≠ tier" fica obsoleta junto (não há mais tipos mecânicos). A pendência "corte-vazio com régua vermelha" **morreu como sistema**.
- **Cores: assinaturas, não paleta** (ver `DECISOES_JUL26.md` §5): "ouro sangrando por rachaduras" = a ferida da luz; "vermelho que não ilumina" = o Nada. Fora do comportamento, cor é só cor.
- **Recompensa escala com o degrau** (common → uncommon → awaken).
- **Harbinger = chefe de grupo (1 a cada 3 áreas)**, do mais fraco ao mais forte dentro do mapa. Os **Nihelim** ficam um degrau acima (Chefe de Mapa, 1 por mapa).
- Fora da escada: **Ashen King** (recusa Nihel e a morte; exceção reversível).

## Status: ESTRUTURA APROVADA (jun/2026 · nomes jul/2026 · hierarquia final jul/2026)

**Travado (acumulado):**
- Escada de 4 nomes: **Vessels → Harbingers → Nihelim → Nihel** (apresentação oficial; os 8 degraus seguem como esqueleto mecânico).
- Tags de FLUXO: **Ember** (teal) · **Lumen** (azul) · **Corona** (violeta). Common **sem tag**.
- **Harbinger = chefe de grupo, 1 a cada 3 áreas** (Map 1: 18 áreas → 6 Harbingers). Gilded Hollow rebaixado a Harbinger; **Okhra** é o Chefe do Mapa 1.
- Roster dos **7 Nihelim** + mapa de cada um (tabela acima). Tipos rebaixados a bestiário.
- Cores como **assinaturas** de comportamento, não paleta.

Faltam ainda (adiados de propósito):
- ⏸️ **Mini-Boss (degrau 5)** — parqueado (os 6 Harbingers da floresta guardados NÃO viram Mini-Boss).
- ⏳ **Thresholds de kill** de cada Marco → **MEDIR NO SIM** (`tools/sim.js`), não chutar.
- ⏳ **Menu de modificadores** (Corona+ / Marcos: escudo, aura, regen, invocar…) → pesquisar e listar na fase de criação.
- 🔍 Quais 3 Harbingers da floresta viram titulares de grupo (e quais 6 ficam guardados).
- 🔍 Import do doc `mapa1_tema_b_porto_afundado.md` + ajuste Nebulor → Okhra na área 17.
