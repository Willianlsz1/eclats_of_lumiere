# Éclats of Lumière — Pirâmide de Poder dos Inimigos

> Estrutura de design (lore + gameplay). Define os **degraus de poder** dos inimigos, do mais comum ao ápice. Depois isto vira dados no jogo (`combat.js`, `economy.js dropTable`, spawns).
> Números de poder/frequência são **bandas aproximadas** (placeholder) — a estrutura é o que importa; o balance fino vem na implementação.
>
> **Nomenclatura atual (jul/2026):** os tags dos tiers de FLUXO foram renomeados — **Ember · Lumen · Corona** (antes Kindled/Luminous/Radiant) — e o Boss de Área virou **The Harbingers** (antes "Eidola"). "The Harbingers" **supersede "Eidola"** em todo o canon (outros docs ainda a reconciliar).

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
| 5 | **Mini-Boss** | encontro especial periódico | ⏸️ **parqueado** (sem nome/definição). Candidato: um Consumed/Cortice maior, com modificador; lado-vazio seria um Cortice grande ou Claimed baixo. |
| 6 | **The Harbingers** | porteiro da área (libera a próxima) | o arauto do limiar — manifestação de luz OU vazio com forma própria; nome poético em inglês ("The + algo"), **um por área** (ex. The Waking Bloom, Área 1). Sem grupo/esquadrão fixo. *(antes "Eidola")* |
| 7 | **Chefe de Mapa** | clímax do Mapa inteiro | **os 7 Archons** nos Mapas ligados ao vazio (ver tabela abaixo); Mapas fora do vazio usam nome próprio (Gilded Hollow M1, Ashen King M3) |
| 8 | **Nihel** | o ápice, confrontação final | The Fracture — *nome estilizado de "nihil" (latim: nada); a mesma receita de nome dos Archons* |

### Regras dos Marcos (5-8) — decisão do dono
- **Spawn por threshold de kill:** um contador de kills; ao atingir o limite, o Marco **sempre** aparece.
- **Morte reseta o contador:** se o Seeker morre antes de atingir o threshold, o contador zera (tem que sobreviver até lá).
- **Nunca aparecem solo:** o Mini-Boss / Boss / Chefe **sempre vem acompanhado de mobs** (a onda + o marco juntos).
- **Do Elite (Corona) pra cima todos têm um modificador** (escudo/aura/algo diferente) — o "tem algo a mais" que diferencia do mob raso.

---

## Os 7 Archons (degrau 7 — Chefe de Mapa dos Mapas ligados ao vazio)

Os Archons preenchem o degrau de **Chefe de Mapa** dos Mapas ligados ao vazio (Map 2, Map 4 e Mapas abertos). **Não** são Harbingers — Harbinger é só degrau 6. Map 3 (Ashen King) e Map 5 (o próprio Nihel) ficam **de fora**: não servem a Nihel.

**Receita de nome:** palavra real (qualquer idioma) + estilização leve — a mesma de "Nihel" (de *nihil*, latim para nada).

| Nome | Subtítulo | Raiz real |
|------|-----------|-----------|
| **Kenoth**   | the First Hollow          | grego *kenón* — vácuo |
| **Entropir**  | the Unmaking Choir        | grego *entropia* — desordem crescente |
| **Umbrar**    | the Velvet Court          | latim *umbra* — sombra/eclipse |
| **Nebulor**   | the Drowned Cartographer  | latim *nebula* — nuvem que engole estrelas |
| **Cinerath**  | the Patient Flame         | latim *cinis* — cinza/brasa |
| **Taciel**    | the Voiceless             | latim *tacitus* — silencioso |
| **Speculor**  | the Last Mirror           | latim *speculum* — espelho |

⏳ **Pendente (sem pressa):** origem dos Archons (nasceram com Nihel na Quebra, ou foram corrompidos/recrutados depois?) e qual Archon vai em qual Mapa — só decide quando os Mapas 2/4/abertos tiverem mais forma.

---

## Regras gerais da pirâmide
- **Tipo ≠ tier.** Os 5 tipos (Fragmented, Consumed, **The Harbingers**, Claimed, Cortices) são *sabores*; a pirâmide é o *poder*. Qualquer tipo ocupa vários degraus — **exceto The Harbingers**, que é sempre Boss de Área (degrau 6), de propósito.
- **Duas linguagens de cor.** Luz (Fragmented/Consumed) sobe pela régua fria teal→azul→violeta (Ember→Lumen→Corona). Vazio (Cortices/Claimed) lê por escuridão/vermelho e ocupa a escada por força bruta — não acende.
- **Recompensa escala com o degrau** (common → uncommon → awaken).
- **The Harbingers = sempre Boss de Área (degrau 6)** — nunca outro degrau. Os **7 Archons** ficam um degrau acima (Chefe de Mapa, degrau 7) e **não são Harbingers**: são um roster próprio (ver tabela acima). *(Supersede a ideia antiga de "Archons = Eidola de vazio / Yaldabaoth no topo".)*
- **Claimed e Cortices são tipos SEPARADOS** (sem fusão). Ranks internos do Claimed: **pausados** — não usar os nomes dos Qliphoth (Gamaliel/Samael/etc.; significado popular refutado como fonte primária).

## Status: ESTRUTURA APROVADA (jun/2026 · nomes jul/2026)
Os 8 degraus, a regra tipo≠tier, fluxo vs marco, cor=luz=poder, e as regras de spawn dos Marcos estão **aprovados**. **Aprovado também (sessão de lore jun/2026):** o roster dos **7 Archons** (degrau 7), a separação Archon ≠ Harbinger, Harbinger sempre no degrau 6, e Claimed/Cortices como tipos separados.

**Travado na sessão de nomes (jul/2026):**
- Tags de FLUXO: **Ember** (teal) · **Lumen** (azul) · **Corona** (violeta). Common fica **sem tag**.
- Raridade **mapeia na espécie** (Opção A): 1–2 = Fragmented, 3–4 = Consumed.
- Boss de Área renomeado de "Eidola" para **The Harbingers**.
- Princípio das **duas linguagens de cor** (luz fria vs vazio escuridão/vermelho).

Faltam ainda (adiados de propósito):
- ⏸️ **Mini-Boss (degrau 5)** — parqueado: sem nome nem definição por ora.
- ⏳ **A metade-vazio / a "corte"** — ranks Claimed (Crowned/Court/Sworn) + Cortices, com a régua de vermelho. Não iniciada.
- ⏳ **Thresholds de kill** de cada Marco → **MEDIR NUM SIM** na fase de balance (persona Marina), não chutar.
- ⏳ **Menu de modificadores** (Elite+ / Marcos: escudo, aura de dano, regen, invocar mobs…) → **PESQUISAR e listar** na fase de criação.
- Quantos **Chefes de Mapa** ao todo (provável 1 por Mapa) → definir junto com os Mapas.
- **Revisar o roster de bosses** do Map 1 + resolver o duplo-papel do Gilded Hollow (Boss de Área da área 9 *e* Chefe de Mapa).
