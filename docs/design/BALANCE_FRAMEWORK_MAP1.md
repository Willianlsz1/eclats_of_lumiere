# Balance Framework — Mapa 1 (18 áreas) · Escada de Decisões

> **Doc de trabalho vivo.** Reconstrução do balance do Mapa 1 em cima da estrutura nova
> (18 áreas · 2 temas · 6 grupos de 3 áreas · Harbinger por grupo · Okhra no topo).
> Método: cada passo tem UMA pergunta central → decide → **valida no sim** (`tools/sim.js`) → ✅ trava → próximo.
> Um passo só abre quando o anterior travou. Decisão travada não reabre sem número novo.
> Status: ⬜ aberto · 🔶 decidido (aguarda sim) · ✅ travado (com sim)

## A estrutura que tudo referencia

```
MAPA 1 = 18 áreas = 6 grupos de 3 = 2 temas
┌─ TEMA A · Floresta ──────────────┐ ┌─ TEMA B · Porto Afundado ────────┐
│ G1 (1-3)   G2 (4-6)   G3 (7-9)   │ │ G4 (10-12)  G5 (13-15)  G6 (16-18)│
│    ▲H1        ▲H2        ▲H3     │ │    ▲H4         ▲H5         ▲H6    │
└──────────────────────────────────┘ └──────────────────────── ▲OKHRA ──┘
H = Harbinger (chefe de grupo, fim da 3ª área). Okhra = Chefe de Mapa (após H6).
G1 < G2 < … < G6 (progressão reta). Tema A inteiro < Tema B.
```

A cadência natural de beats: **fim de grupo = parede + Harbinger** (6×), **troca de tema = a parede do meio do mapa** (1×), **Okhra = o exame final** (1×).

---

## PASSO 0 — O Relógio ✅ TRAVADO (jul/2026)

**Pergunta central:** quanto TEMPO o Mapa 1 deve custar, e em que ritmo?

| # | Decisão | Valor travado |
|---|---------|---------------|
| 1 | Duração total do Mapa 1 (ativo, até o First Light) | **18 horas** |
| 2 | Sessão típica | **30–50 min**, com a regra do beat: toda sessão fecha ≥1 beat (área, Harbinger ou convergence) — especialmente no início, sempre há algo a fazer |
| 3 | Split ativo/idle | **~50/50** (cap offline de 8h existente sustenta) |
| 4 | Timing do 1º prestige | **25–40 min** de jogo ativo |

Validação: decisão de produto do dono (sessão jul/2026). Consequência aritmética: ~25–35 sessões pra fechar o mapa; calendário casual ≈ 2–3 semanas com idle.

## PASSO 1 — O Esqueleto (áreas × níveis × tempo) ⬜ ← ESTAMOS AQUI

**Pergunta central:** que faixa de nível cobre cada uma das 18 áreas, e quanto tempo cada grupo custa?

Decide: level cap do mapa · faixas por área (redistribuir — hoje 9 áreas cobrem 1–5000) · orçamento de tempo por grupo (curva crescente, ex. G1=5% … G6=30% do total) · curva de XP (`xpCurveExp`) que entrega isso · threshold de kills do Harbinger.
Insumos: PASSO 0 · TTK-alvo provisório (~3s).
Valida: `sim baseline` — tempo real até cada área/grupo bate o orçamento (±20%).

## PASSO 2 — A Fricção (onde ficam as paredes) ⬜

**Pergunta central:** onde o jogador DEVE parar de avançar de graça — e o que o segura?

Decide: TTK-alvo por posição (entrada de área 3–8s · fim de área 1–2s · Harbinger 15–30s · Okhra 45–90s) · TTD/papel da morte (hoje só existe nos min 0–15) · **o freio do runaway F3** (o loop income×lumensBonus composto — decisão estrutural: goldRatio decrescente por área, ou lumensBonus fora do gear, ou custo de gear mais íngreme) · curvas de HP das 18 áreas (vale-e-rampa por área, degrau por grupo).
Insumos: PASSO 1 · achado F3 do sim (TTK colapsa pra 0.1s sem freio).
Valida: `sim baseline` — TTK na entrada/fim de cada área dentro da banda; zero paredes não-planejadas; paredes planejadas nos fins de grupo.

## PASSO 3 — A Economia (income vs sinks) ⬜

**Pergunta central:** quanto o jogador ganha, e em que ele é OBRIGADO a gastar, área por área?

Decide: goldRatio/bonus por área (consequência do freio do P2) · curva de custo do gear (`gearCostBase/Growth`) · **cadência de materiais re-mapeada pros 6 grupos** (hoje: elite A3+, uncommon A5+, awaken A6+ — re-ancorar em grupos, ex. G2/G4/G5) · custos de promoção.
Insumos: PASSO 2 travado.
Valida: `sim baseline` — surplus de Lumens por grupo (o jogador deve ficar "quase rico" antes de cada parede, nunca rico demais).

## PASSO 4 — O Gear (a fonte de poder da run) ⬜

**Pergunta central:** que fatia do poder vem do gear em cada grupo, e quando acontecem as promoções?

Decide: mapa raridade→grupo (ex.: Common maxa no G2, promove; Uncommon carrega G3–G4, maxa no G4, promove; Rare carrega G5–G6) — **12 beats de promoção** (2 × 6 peças) distribuídos no mapa · caps por raridade re-derivados · papéis de afixo por slot (manter) + 2ºs afixos.
Insumos: PASSO 3 (custos/materiais definem o ritmo de promoção).
Valida: `sim baseline` — nível médio do gear por grupo segue o plano; promoções acontecem nos grupos planejados.

## PASSO 5 — Convergence (o loop de prestige) ⬜

**Pergunta central:** quando convergir vale a pena, e quanto pagar por empurrar mais fundo?

Decide: `gateLevel` (âncora natural: fim do G1 / entrada do G2) · fórmula com termo de ÁREA ativo (proposta: `pontos = levelTerm × (1 + areaBonus×(grupoMax−grupoDoGate))` — empurrar 1 grupo além ≈ +35–50%) · meta de convergences no mapa (era 8–12 com 9 áreas; com 18 revisar: 10–16?) · Legacy (+8%/+8% — manter? curva?) · o que acontece com `runMaxAreaIndex` na fórmula com grupos.
Insumos: PASSOS 1–2 (o gate é um beat do esqueleto) · achado F2 do sim (fórmula flat mata a decisão).
Valida: `sim gates` + `sim campaign` — 1º prestige no alvo do P0; empurrar +1 grupo rende visivelmente mais; meta de convergences bate.

## PASSO 6 — Passivas (o motor permanente) ⬜

**Pergunta central:** quanto poder permanente o Mapa 1 inteiro deve render, e em que ordem o jogador o compra?

Decide: orçamento total de pontos do mapa (= convergences × pontos médios, sai do P5) · custo dos tiers re-calibrado pra esse orçamento (intenção: tier 1 de UMA árvore ≈ o mapa inteiro? ou mais?) · **UNIT re-derivado da escala real** (achado F4: flats mortos — converter pra % ou escalar) · elenco final dos nós (crit stack ×3 → ×2? atkSpeed node? nós de custo de gear na Fracture? `miniBossThreshold` adiado?) · orçamento de poder por tier (T1 ≈ ×2–3 no eixo · T2 especializado · T3 = Mapa 2).
Insumos: PASSO 5 travado (renda define custo).
Valida: `sim campaign` — % da árvore comprada ao fim do mapa bate a intenção; nenhum nó morto; poder das passivas ≈ fatia planejada do total.

## PASSO 7 — Awaken / First Light (o exame final) ⬜

**Pergunta central:** o que o First Light exige (o "diploma" do Mapa 1) e quanto poder dá (a ponte pro Mapa 2)?

Decide: requisitos re-mapeados (área 18 · nível ~cap do mapa · convergences = meta do P5 · materiais = cadência do P3) · magnitude do bônus (hoje ×2.5/×1.5 placeholder) dimensionada pra "Área 1 do Mapa 2 farmável na chegada, sem trivializar".
Insumos: PASSOS 1–6.
Valida: `sim campaign` — First Light cai dentro do orçamento total do P0; poder pós-Awaken vs HP hipotético do início do Mapa 2.

## PASSO 8 — Encontros especiais (a textura) ⬜

**Pergunta central:** o que quebra a monotonia do grind, e com que frequência?

Decide: **Rarity Find entra** (spec pronta em `RARITY_FIND.md`: base 0%, gear acha, passiva sobe teto — precisa dos afixos/nós novos do P4/P6) · menu de modificadores do Corona+ e dos Marcos (pesquisar e listar) · design da luta de Harbinger (escolta, threshold, recompensa especial?) · luta do Okhra.
Insumos: PASSOS 4–6 (onde os afixos/nós de rarity moram).
Valida: `sim baseline` com rarity find — frequência de Ember/Lumen/Corona por grupo; recompensa de Harbinger vs orçamento do P3.

---

## Regras do processo
1. **Um passo por vez.** Discutir o passo N+1 antes de travar o N = anotar e voltar.
2. **Travar = número + sim + registro aqui.** Cada passo travado ganha seção "✅ TRAVADO" com os valores e o comando de sim que os validou.
3. **`data.js` só muda depois do ✅.** O sim aceita override em memória pra testar candidatos.
4. **Decisão travada não reabre** sem número novo do sim (mesma disciplina da lore).

## Log de decisões travadas
- **jul/2026 — PASSO 0 (Relógio):** 18h ativas · sessão 30–50min c/ regra do beat · ~50/50 ativo/idle · 1º prestige 25–40min.
