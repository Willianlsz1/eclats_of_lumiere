# Éclats of Lumière — Revisão Final de Arquitetura (pré-Fase 3)

> Auditoria **read-only** antes do balanceamento. Nenhum código foi alterado.
> Baseada no estado atual de `src/` (Convergence, Passivas, Economia, Materiais,
> Promoções, Raridades, Elite, Mini Boss, Boss, Thresholds, Awaken).

---

## 1. Nota geral de arquitetura: **82 / 100**

A espinha dorsal está sólida, modular e **escalável** (camadas de stat, eixos
run-vs-conta, drop table por tipo, requisitos de Awaken configuráveis, escada de
raridade extensível). Os 18 pontos descontados vêm de: **pacing** ainda fora do
design (Convergence cedo demais), **10 efeitos de passiva sem consumidor**, **ciclo
de material Uncommon sem sink no Mapa 1**, **funções de slot trocadas** e a grande
massa de **placeholders de magnitude** (esperado — é o trabalho da Fase 3).

| Eixo | Nota | Comentário |
|---|---|---|
| Estrutura / modularidade | 9/10 | Sistemas bem separados; namespace `G` consistente. |
| Escalabilidade (Mapa 2+) | 9/10 | Quase tudo aceita extensão sem reescrita. |
| Consistência doc × código | 6/10 | Pacing, slots e fórmula de pontos divergem. |
| Completude de ciclos | 7/10 | Uncommon material sem uso; awakenEssence morto. |
| Higiene de passivas | 6/10 | 10 efeitos órfãos; 1 redundância. |
| Dívida técnica controlada | 8/10 | Placeholders centralizados e marcados. |

---

## 2. Inconsistências restantes (doc diz A · código faz B)

| # | Documentação | Código | Severidade |
|---|---|---|---|
| C1 | Convergence **descoberta na Área 3**, 1ª na Área 4 | `gateLevel = 80` = fim da Área 1 → libera cedo demais | Alta |
| C2 | Pontos = **Área + Bosses + Nível + Kills** (Área dominante) | `weights {area:0, boss:0, level:1, kills:0}` — só Nível ativo | Alta (intencional, placeholder) |
| C3 | Gloves=**Crit** · Boots=**Atk Speed** · Cloak=**Economia** | Afixo primário (Common): Gloves=**Atk Speed** · Boots=**Lumens** · Cloak=**Crit** (rotacionado) | Média |
| C4 | Attack Speed base **0.900**, cap **15** | base `1.0`; `attackInterval` clampa em 0.1 ⇒ teto efetivo **10 aps** | Média |
| C5 | First Light impacto **~5×** | bônus `atk ×2.5 · hp ×1.5` (placeholder) | Baixa |
| C6 | Promoção introduzida na **Área 5** | mecanicamente possível assim que o gear atinge cap 500 + material Common (Área 1+) | Baixa |
| C7 | Passiva **"Mais Inimigos"** (moreEnemies) | loop de combate é de **1 inimigo**; efeito sem consumidor | Média |
| C8 | 2 afixos por peça definidos em `gearBase` | raridade Common/Uncommon usa `affixes: 1` → 2º afixo **dormente** | Baixa |

> C5 já foi corrigido em parte: a **localização** do First Light (Área 9) agora
> bate (era Área 7). Resta só a magnitude (placeholder).

---

## 3. Riscos

| Risco | Nível | Detalhe |
|---|---|---|
| **R1 — Nós de passiva "armadilha"** | 🔴 Alto | 10 efeitos sem consumidor (ver §5): o jogador pode gastar Pontos em nós que **não fazem nada**. Precisa implementar consumidor, esconder ou marcar como Mapa 2 antes do balanceamento. |
| **R2 — Pacing de Convergence** | 🟠 Médio | Liberar no fim da Área 1 quebra a curva de aprendizado planejada (C1). |
| **R3 — Dominância na Fase 3** | 🟠 Médio | Hoje nada domina (tudo placeholder). O modelo de passiva virou **aditivo** (sem os engines ×1.52 compostos do design antigo), o que é **mais seguro** contra runaway — mas `hpToDamage` e os capstones podem virar dominantes se mal-tunados. |
| **R4 — Ciclo de material incompleto** | 🟠 Médio | Uncommon material tem origem mas **nenhum uso no Mapa 1** (ver §6). Risco de recurso "inútil" percebido. |
| **R5 — Fronteira de mapas não é first-class** | 🟡 Baixo | `areas[]` é uma lista plana; Convergence sempre reseta para `areaIndex 0`. Mapa 2 funciona por extensão, mas não há conceito explícito de "mapa". |
| **R6 — Saves em transição** | 🟡 Baixo | A migração de Awaken/essência roda a cada load (idempotente), mas acumula lógica de compat em `state.load`. |

---

## 4. Sistemas legados

| Item | Onde | O que é | Classificação |
|---|---|---|---|
| `awakenEssence` (campo) | state, migração | Material antigo, agora **dobrado** em `awakenMaterials.firstLight`; sem origem nem uso | **Remover depois** (manter enquanto houver saves a migrar) |
| `awakensUnlocked` (alias) | state, awaken | Espelho de `awakens[]`, sincronizado | **Remover depois** (após a UI/código migrarem 100% p/ `awakens`) |
| `awakenDropChance: 0.02` | data.balance | Config do drop por kill **removido**; nada lê | **Pode remover agora** |
| Aliases `isUnlocked/canUnlock/unlock` | awaken.js | Compat p/ a UI atual (que ainda os chama) | **Manter** até refactor da UI (depois) |
| `pointsFor(level)` | convergence.js | Compat; `pending()` é o caminho real | **Remover depois** |
| `loot.js` + `inventory.js` | módulos | Dormentes (geração de itens); **não chamados** | **Manter** (reservado p/ sistema de itens futuro) |
| `rareMobs.plus` ("Rare+") | data, combat | Variante forte de raro; sobrepõe conceito de Elite | **Remover depois** (decidir Rare+ vs Elite) |
| `spawnCount` | combat | Contador incrementado, sem leitor | **Pode remover agora** |
| `pctStats` | data.js | Helper de display parcial | **Manter** |

---

## 5. Passivas — matriz completa (45 nós · 28 efeitos distintos)

Legenda: ✅ funcional (magnitude>0 + consumidor) · 🟡 **fiado, magnitude 0**
(consumidor existe, aguarda balanceamento) · ❌ **órfão** (nenhum consumidor).

### Éclat (Combate/Vitalidade)
| Efeito | Nós | UNIT | Consumidor | Status |
|---|---|---|---|---|
| atkPct | 1,2,3,13 | 1 | state (atk.pct) | ✅ |
| critRate | 4,5 | 1 | state (crit.flat) | ✅ |
| critDmg | 6,14 | 1 | state (critDmg.flat) | ✅ |
| hpPct | 10,11 | 1 | state (hp.pct) | ✅ |
| hpToDamage | 12 | 0 | state (atk.flat += %HP) | 🟡 |
| bossDmg | 7,9 | 0 | — (combat aplica só ao mob) | ❌ |
| eliteDmg | 8 | 0 | — | ❌ |
| capstoneEclat | 15 | 0 | — | ❌ |

### Vestige (Economia)
| Efeito | Nós | UNIT | Consumidor | Status |
|---|---|---|---|---|
| lumensPct | 1,2,3,13 | 1 | state (lumensBonus) | ✅ |
| xpPct | 4,5,6 | 1 | state (xpBonus) | ✅ |
| matCommonPct | 7 | 0 | economy (qty) | 🟡 |
| matUncommonPct | 8 | 0 | economy (qty) | 🟡 |
| matGeneralPct | 9 | 0 | economy (qty geral) | 🟡 |
| dropRate | 10,11 | 0 | economy (chance) | 🟡 |
| matQuantity | 12 | 0 | economy (qty) | 🟡 |
| matPct | 14 | 0 | economy (qty geral) | 🟡 **redundante com matGeneralPct** |
| capstoneVestige | 15 | 0 | — | ❌ |

### Fracture (Metaprogressão)
| Efeito | Nós | UNIT | Consumidor | Status |
|---|---|---|---|---|
| convPointsPct | 1,2 | 0 | convergence | 🟡 |
| convPointsMin | 3 | 0 | convergence | 🟡 |
| awakenMatPct | 4,5 | 0 | economy (awaken mat) | 🟡 |
| eliteChance | 7 | 0 | combat | 🟡 |
| miniBossThreshold | 8 | 0 | combat | 🟡 |
| promotionCostReduction | 12 | 0 | gear | 🟡 |
| convEfficiency | 13 | 0 | convergence | 🟡 |
| awakenReqReduction | 6 | 0 | — (awaken.requirements não aplica) | ❌ |
| moreEnemies | 9 | 0 | — (loop de 1 inimigo) | ❌ |
| gearXp | 10 | 0 | — (sem sistema de XP de gear) | ❌ |
| upgradeCostReduction | 11 | 0 | — (gear.cost não aplica) | ❌ |
| awakenEfficiency | 14 | 0 | — | ❌ |
| capstoneFracture | 15 | 0 | — | ❌ |

**Resumo:** 6 efeitos ✅ · 14 efeitos 🟡 (prontos, só falta magnitude) · **10
efeitos ❌ órfãos** (bossDmg, eliteDmg, awakenReqReduction, moreEnemies, gearXp,
upgradeCostReduction, awakenEfficiency, 3 capstones). **Consumidores sem efeito:
nenhum** (todo consumidor lê um efeito existente). **1 redundância**: `matPct` ≡
`matGeneralPct` (ambos somam ao multiplicador geral em economy).

---

## 6. Economia — ciclos

| Recurso | Origem | Uso | Ciclo |
|---|---|---|---|
| Lumens | kills (live) | upgrade de gear (live) | ✅ completo |
| XP | kills | level up | ✅ completo |
| Convergence Points | converge | passivas | ✅ completo |
| Gear Material **Common** | drops (todos os tipos) | promoção Common→Uncommon | ✅ completo (placeholders) |
| Gear Material **Uncommon** | drops (Elite/MiniBoss/Boss, área ≥5) | **nenhum no Mapa 1** (promoção p/ Rare é Mapa 2) | 🔴 **incompleto** — origem sem sink |
| Awaken Material `firstLight` | drops (MiniBoss/Boss, área ≥6) | First Light | ✅ completo |
| `awakenEssence` (legado) | **nenhuma** (drop removido) | **nenhum** (migrado) | ⚪ morto |

> **Achado-chave (§6):** o **Uncommon material** já dropa mas não tem onde ser
> gasto no Mapa 1 — a promoção para Uncommon consome **Common** material. Decisão:
> ou adiar o drop de Uncommon para o Mapa 2, ou dar a ele um uso no Mapa 1.

---

## 7. Progressão Área 1 → 9

| Verificação | Resultado |
|---|---|
| Bloqueios impossíveis | **Nenhum.** First Light é alcançável (area 9 via maxAreaUnlocked persistente + level atual + 8 convergences + 1 material). `kills: 0` é placeholder (trivial). |
| Apresentado **cedo demais** | **Convergence** (Área 1, deveria ser Área 3) — C1. **Promoção** mecanicamente possível antes da Área 5 se o gear capar cedo — C6. |
| Apresentado **tarde demais** | Nada crítico. Elite/Mini Boss entram na Área 2 (ok). Uncommon material na Área 5 e Awaken material na Área 6 (ok). |
| Risco de parede dura | Fora de escopo aqui (é Fase 3): a auditoria de balanceamento anterior mostrou TTK estourando da Área 3+ sem passivas — agora **depende inteiramente** das magnitudes da Fase 3. |

---

## 8. Awaken — verificação

| Aspecto | Estado |
|---|---|
| Requisitos | ✅ configuráveis (area/level/kills/convergences/materials); `requirements(id)` expõe have/need/met |
| Persistência | ✅ `awakens[]`, `awakenTier`, `awakenLevel`; sobrevive a save/load (testado) |
| Integração Convergence | ✅ lê `convergences` e `totalKills` (não resetam) |
| Integração Materiais | ✅ consome `awakenMaterials.firstLight` via economy |
| Integração Fracture | 🟡 **parcial**: `awakenReqReduction` e `awakenEfficiency` **não são aplicados** (efeitos órfãos). `awakenMatPct` é consumido (economy). |
| Magnitude do bônus | 🟡 placeholder (~2.5×, doc pede ~5×) |

---

## 9. Escalabilidade (sem reescrita significativa)

| Extensão | Suportado? | Observação |
|---|---|---|
| **Mapa 2** | 🟡 Sim, por extensão | Append em `areas[]`; `mobHpAt` é por-área. Mas não há conceito first-class de "mapa"; Convergence reseta sempre p/ `areaIndex 0`. |
| **Awaken 2** | ✅ Sim | `awakens[]` + `tier`; `applyTo` itera todos. Basta nova def. |
| **Novas raridades** | ✅ Sim | `RARITY_ORDER` + `rarities` + `promotionCost` por alvo + `MIGRATE_RARITY`. |
| **Novas árvores** | ✅ Sim | `TREES` + `trees` + UI itera; `POSITIONS` (15) é reutilizável. |
| **Novos materiais** | ✅ Sim | `freshMaterials` + `dropTable` + `MATERIAL_SINK` (edições pequenas). |
| **Novos efeitos de passiva** | ✅ Sim | `UNIT` + node list + 1 consumidor. |

**Veredito:** arquitetura **pronta para escalar**. Único gap estrutural: fronteira
de mapas implícita (R5).

---

## 10. Dívida técnica / placeholders

### 🔴 Crítico (bloqueia balanceamento correto)
- **Magnitudes de passiva** (`UNIT`): 22 efeitos com magnitude placeholder (14 🟡 + parte dos órfãos). Sem isso, as passivas quase não fazem nada.
- **Fórmula de Pontos** (`convergence.weights`): só Nível ativo; Área/Bosses/Kills inertes (C2).
- **HP/DPS/custos/thresholds**: todos os números de combate/economia são placeholders (é o núcleo da Fase 3).
- **10 efeitos órfãos** de passiva (§5) — decidir implementar/ocultar antes de tunar.

### 🟠 Importante (qualidade/consistência antes de tunar)
- Funções de slot rotacionadas (C3) e 2º afixo dormente (C8).
- Attack Speed base/cap (C4).
- Uncommon material sem sink no Mapa 1 (§6).
- Redundância `matPct` ≡ `matGeneralPct`.
- Pacing de Convergence (C1).

### 🟡 Opcional (cosmético / pode esperar)
- Nomes/sprites placeholder (Boss da Área 1, Mini Bosses).
- Config morta `awakenDropChance`; campo `spawnCount`.
- `pointsFor`, aliases de Awaken, `loot.js`/`inventory.js` dormentes.
- Rare+ vs Elite (decidir sobreposição).

---

## Entregável 6 — Ordem recomendada da Fase 3

1. **Higiene pré-balanceamento** (barato, destrava tudo):
   - Resolver os **10 efeitos órfãos** (implementar consumidor mínimo OU ocultar/marcar Mapa 2). Sem isso, balancear passivas é tunar nós mortos.
   - Corrigir **funções de slot** (C3) e **Attack Speed** base/cap (C4) — definem QUAIS stats escalam.
   - Alinhar **pacing de Convergence** (C1) ao gate da Área 3.
2. **Definir a banda de TTK alvo** (mob 1–3s · elite 10–20s · mini boss 30–60s · boss 1–3min) e derivar dela: HP de mobs/elites/minibosses/bosses, DPS esperado por área, níveis de gear.
3. **Curvas de economia**: custo de gear, custo/quantidade de materiais, custo de promoção, drop rates — calibrar para a meta de 8–12 Convergences.
4. **Fórmula de Pontos** (Área > Bosses > Nível > Kills) com pesos reais (C2).
5. **Magnitudes de passiva** (`UNIT`) por efeito, garantindo que **nenhum sistema domine** (Gear/Passivas/Convergence/Awaken equilibrados).
6. **Requisitos e bônus de First Light** (level/kills/convergences/material e o ~5×).
7. **Validação por simulação** (reaproveitar o harness de auditoria) contra a banda de TTK e a meta de horas.

## Entregável 7 — Corrigir ANTES do balanceamento

- 🔴 Os **10 efeitos órfãos** de passiva (implementar ou remover do conjunto ativo).
- 🔴 **Funções de slot** (C3) e **Attack Speed** (C4) — mudam o que se tuna.
- 🟠 **Pacing de Convergence** (C1).
- 🟠 Redundância `matPct`/`matGeneralPct` (unificar antes de atribuir magnitude).
- 🟠 Decisão sobre **Uncommon material** (dar sink no Mapa 1 ou adiar o drop).

## Entregável 8 — Pode esperar até o Mapa 2

- Fronteira first-class de mapas (R5) e reset de área por mapa.
- Remoção de legados (`awakenEssence`, `awakensUnlocked`, `pointsFor`, `awakenDropChance`, `spawnCount`).
- Decisão Rare+ vs Elite.
- Reativação de `loot.js`/`inventory.js` (se o sistema de itens voltar).
- Arte/nomes definitivos de Bosses/Mini Bosses.
- 2º afixo de gear / tuning de stats da raridade Uncommon.
