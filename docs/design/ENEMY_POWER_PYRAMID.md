# Éclats of Lumière — Pirâmide de Poder dos Inimigos

> Estrutura de design (lore + gameplay). Define os **degraus de poder** dos inimigos, do mais comum ao ápice. Depois isto vira dados no jogo (`combat.js`, `economy.js dropTable`, spawns).
> Números de poder/frequência são **bandas aproximadas** (placeholder) — a estrutura é o que importa; o balance fino vem na implementação.

---

## Gancho de lore: a COR é o poder

Quanto mais **luz de Éclat** uma criatura carrega, mais forte e mais **brilhante** ela é. A raridade de um mob não é abstrata — é *quanta luz ele absorveu*. Por isso cada degrau tem uma **cor** (já é o esquema de raridade aprovado na art-direction: Faded → Kindled → Luminous → Radiant → Converged). O jogador lê o poder pela cor do nome, como já é hoje.

---

## A Pirâmide (base = comum/fraco · topo = raro/forte)

```
                    ▲  NIHEL            (ápice — fim do jogo)
                   ╱ ╲
                  ╱ M ╲   CHEFE DE MAPA  ┐
                 ╱─────╲                 │  MARCOS
                ╱ EIDOLA╲  BOSS DE ÁREA   │  (gate, garantido, com peso de lore;
               ╱─────────╲                │   nunca solo — sempre COM mobs;
              ╱ MINI-BOSS ╲               ┘   spawn por threshold de kill)
             ╱─────────────╲
            ╱    RADIANT     ╲ (violeta) ┐  Elite — tem MODIFICADOR (escudo/aura)
           ╱─────────────────╲           │
          ╱     LUMINOUS       ╲ (azul)   │  FLUXO
         ╱─────────────────────╲          │  (aparecem nas ondas do grind;
        ╱       KINDLED          ╲ (teal) │   a cor = quanta luz carregam)
       ╱─────────────────────────╲        │
      ╱         COMMON             ╲ (cinza/Faded) ┘  o grosso das ondas
     ╱───────────────────────────────╲
```

---

> 🔗 A **chance** de Kindled/Luminous/Radiant aparecer é construída pelo jogador (gear acha + passiva levanta o teto), base 0%, caps 30/15/5 — ver `docs/design/RARITY_FIND.md`. As "frequências" abaixo eram do sistema antigo de chance fixa.

## FLUXO — os que aparecem nas ondas (a cor = o poder)

| Tier | Nome (cor) | O que é | Frequência | Poder ~×common | Recompensa |
|------|-----------|---------|------------|----------------|------------|
| 1 | **Common** (cinza) | mob base, mal tocado pela luz | toda onda | 1× | lumens + XP base |
| 2 | **Kindled** (teal) | uma fagulha de luz a mais | ~12% das ondas | ~2.5× | + chance material common |
| 3 | **Luminous** (azul) | claramente aceso | ~4% | ~5× | material common garantido |
| 4 | **Radiant** (violeta) | saturado de luz — **tem modificador** (escudo, aura, etc.) | área 3+, raro | ~10× | common + chance uncommon |

> O nome no jogo fica tipo **"Candlewisp Shade · Kindled"** com o nome na cor do tier (como os raros já aparecem hoje). Common = sem tag, nome neutro.
> *(Converged — branco-prismático — fica reservado como variante ultra-rara futura ou pra gear; não usar agora.)*

## MARCOS — encontros especiais (gate de progressão)

| Tier | Nome | Papel | Tipo/Lore |
|------|------|-------|-----------|
| 5 | **Mini-Boss** | encontro especial periódico | um Consumed/Cortice maior, com modificador |
| 6 | **Boss de Área** | porteiro da área (libera a próxima) | **The Eidola** — nome poético em inglês ("The + algo"), **um por área** (ex. The Waking Bloom, Área 1). Sem grupo/esquadrão fixo. |
| 7 | **Chefe de Mapa** | clímax do Mapa inteiro | **os 7 Archons** nos Mapas ligados ao vazio (ver tabela abaixo); Mapas fora do vazio usam nome próprio (Gilded Hollow M1, Ashen King M3) |
| 8 | **Nihel** | o ápice, confrontação final | The Fracture — *nome estilizado de "nihil" (latim: nada); a mesma receita de nome dos Archons* |

### Regras dos Marcos (5-8) — decisão do dono
- **Spawn por threshold de kill:** um contador de kills; ao atingir o limite, o Marco **sempre** aparece.
- **Morte reseta o contador:** se o Seeker morre antes de atingir o threshold, o contador zera (tem que sobreviver até lá).
- **Nunca aparecem solo:** o Mini-Boss / Boss / Chefe **sempre vem acompanhado de mobs** (a onda + o marco juntos).
- **Do Elite (Radiant) pra cima todos têm um modificador** (escudo/aura/algo diferente) — o "tem algo a mais" que diferencia do mob raso.

---

## Os 7 Archons (degrau 7 — Chefe de Mapa dos Mapas ligados ao vazio)

Os Archons preenchem o degrau de **Chefe de Mapa** dos Mapas ligados ao vazio (Map 2, Map 4 e Mapas abertos). **Não** são Eidola — Eidola é só degrau 6. Map 3 (Ashen King) e Map 5 (o próprio Nihel) ficam **de fora**: não servem a Nihel.

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
- **Tipo ≠ tier.** Os 5 tipos (Fragmented, Consumed, Eidola, Claimed, Cortices) são *sabores*; a pirâmide é o *poder*. Qualquer tipo ocupa vários degraus — **exceto Eidola**, que é sempre Boss de Área (degrau 6), de propósito.
- **Recompensa escala com o degrau** (common → uncommon → awaken).
- **Eidola = sempre Boss de Área (degrau 6)** — nunca outro degrau. Os **7 Archons** ficam um degrau acima (Chefe de Mapa, degrau 7) e **não são Eidola**: são um roster próprio (ver tabela acima). *(Supersede a ideia antiga de "Archons = Eidola de vazio / Yaldabaoth no topo".)*
- **Claimed e Cortices são tipos SEPARADOS** (sem fusão). Ranks internos do Claimed: **pausados** — não usar os nomes dos Qliphoth (Gamaliel/Samael/etc.; significado popular refutado como fonte primária).

## Status: ESTRUTURA APROVADA (jun/2026)
Os 8 degraus, a regra tipo≠tier, fluxo vs marco, cor=luz=poder, e as regras de spawn dos Marcos estão **aprovados**. **Aprovado também (sessão de lore jun/2026):** o roster dos **7 Archons** (degrau 7), a separação Archon ≠ Eidola, Eidola sempre no degrau 6 com nome poético inglês, e Claimed/Cortices como tipos separados. Faltam só números e listas, adiados de propósito:

- ⏳ **Thresholds de kill** de cada Marco (Mini-Boss / Boss / Chefe) → **MEDIR NUM SIM** na fase de balance (persona Marina), não chutar. Cada um precisa ser verificado.
- ⏳ **Menu de modificadores** (Elite+ / Marcos: escudo, aura de dano, regen, invocar mobs…) → **PESQUISAR e listar** na fase de criação. Dono adiciona ideias conforme surgirem.
- Quantos **Chefes de Mapa** ao todo (provável 1 por Mapa) → definir junto com os Mapas.
- Nome final dos tiers de Marco (manter "Mini-Boss" ou achar termo do mundo Éclats) → fase de nomes.
