# Éclats of Lumière — Handoff de Implementação

**Data:** 2026-06-12
**Cobre:** assets de arte aprovados nesta sessão + plano de implementação da tela de Gear (paper-doll) + fluxo de teste de gear
**Para:** execução no PC (fim de semana)

> Este documento é instrução acionável. Os assets citados são os aprovados na sessão de arte; recortes e integração ainda pendentes.

---

## 1. INVENTÁRIO DE ASSETS APROVADOS

### Fundos de continente (Nível 2) — fórmula Dreaming Wood
Vista sobrevoada · espaço negativo para UI · sem marcos na arte (marcos = código).

| Map | Bioma | Cor | Status |
|---|---|---|---|
| 2 | Cavernes Luminis | azul cristal | ✅ aprovado |
| 3 | Ashen Ruins | âmbar | ✅ aprovado |
| 4 | Peak (picos) | violeta | ✅ aprovado |
| 5 | Nihel | vermelho-sangue + buraco/lua negra topo-centro | ✅ aprovado |

### Marcos de sub-área (Nível 2)
Ilha/diorama isolado · fundo navy chapado · escala grande Grand Chase · recorte **distância-ao-fundo** (lo=18/hi=55).
Papéis fixos: **I** = entrada · **III** = Awakening (feixe branco-azul #aac8ff) · **V** = Guardian.

- **Map 2 — Cavernes Luminis (5/5)** ✅ — I La Première Lueur · II L'Amas Cristallin · III L'Escalier de Lumière · IV La Grotte Sacrée · V La Porte du Gardien
  - NOTA: saíram com render mais realista/3D (exceção aceita).
- **Map 3 — Ashen Ruins (5/5)** ✅ — estilo anime/painterly travado (correto). Nomes = placeholder.
- **Maps 4 e 5 — marcos PENDENTES** (gerar com estilo anime + negatives).

### Gear — peças de arte
| Asset | Recorte | Status |
|---|---|---|
| Moldura do modal (navy+dourado, padrão Ascension) | luminância→alpha | ✅ |
| NPC "Armeiro" (frio/escuro azul-acinzentado, fundo off-white) | distância-ao-fundo | ✅ |
| Slot mestre — Luminous (dourado) | luminância→alpha | ✅ |
| Slot Radiant (branco-azul #aac8ff) | luminância→alpha | ✅ |
| Slot Converged (violeta #9d7bdb) | luminância→alpha | ✅ |
| Slot Faded / Kindled | via CSS (ver §3) | receita pronta |

---

## 2. PIPELINES DE RECORTE (lembrete)

1. **Luminância→alpha** — para molduras, ornamentos, glifos LUMINOSOS sobre fundo escuro. (molduras do modal e os 5 slots)
2. **Distância-ao-fundo→alpha** — mede a cor do fundo pelos cantos; preserva partes escuras. (marcos de sub-área; NPC sobre off-white)

---

## 3. IMPLEMENTAÇÃO DA TELA DE GEAR (paper-doll)

### Layout — 3 zonas dentro da moldura do modal
- **Esquerda:** painel de stats totais (reaproveita o Gear v3)
- **Centro:** NPC Armeiro de corpo inteiro + 6 molduras de slot ao redor (paper-doll)
- **Direita:** detalhe da peça selecionada (nome, raridade, stats, lore, Level Up + x1/x10/x100/x1000/MAX)

### 6 slots (peças de Éclat — Camada 1, permanentes)
Dispostas anatomicamente ao redor do NPC via `position:absolute` em % (reposicionáveis sem mexer na arte).
Slots: Arma · Elmo · Peitoral · Luvas · Botas · Anel/Acessório *(confirmar com o data-model real)*.

### Data-model por peça
`slot` · `tier` (faded/kindled/luminous/radiant/converged) · `level` · `maxLevel` · `stats[]` · `art` (imagem do item já em 45°) · `lore`.
O `tier` dirige qual moldura é aplicada.

### CSS — moldura por tier
```css
.slot { position: relative; aspect-ratio: 1; }
.slot-art { position: absolute; inset: 8%; object-fit: contain; } /* respiro ~88% testado */
.slot-frame { position: absolute; inset: 0; pointer-events: none; }

.tier-luminous  .slot-frame { /* asset mestre, sem filtro */ }
.tier-kindled   .slot-frame { filter: brightness(.7) sepia(.3) saturate(1.2); }
.tier-faded     .slot-frame { filter: saturate(.25) brightness(.85) hue-rotate(190deg); }
.tier-radiant   .slot-frame { /* trocar background-image pelo asset radiant */ }
.tier-converged .slot-frame { /* trocar background-image pelo asset converged */ }
```
*(valores de filtro são ponto de partida — afinar no PC)*

### Estados do slot
- **vazio:** moldura apagada + ícone-fantasma do tipo de peça
- **equipado:** moldura no tier + arte 45° centralizada
- **hover/selecionado:** glow intensificado + abre detalhe à direita

### Ordem de execução no PC
1. Recortar os 8 assets pelos pipelines (§2)
2. Montar grid de 3 zonas dentro da moldura
3. Posicionar os 6 slots ao redor do NPC (coordenadas % — iterar ao vivo)
4. Ligar data-model → tier → classe CSS
5. Estados (vazio/equipado/hover) + painel de detalhe
6. Retrofits (ver §4)

---

## 4. RETROFITS (do handoff, entram nesta tela)
- **Tudo em inglês** (Gear v3 ainda em PT: "Stats totais", "Dano", "Bônus de…")
- **Reservar espaço para Reliquats** (Camada 2) — manter aba "Reliquats 🔒"
- **Padrão de exibição de recompensas** (linha ícone-real + nome + origem + valor, emoldurada) no painel de detalhe
- **Tipografia global** quando trocar a fonte do sistema

---

## 5. MINI-CHECKLIST — FLUXO DE TESTE DE GEAR NA MOLDURA
Quando redesenhar um gear e quiser ver o encaixe, fornecer:
- [ ] Arte do gear **já em 45° nativo** (não vertical — rotacionar distorce luz/sombra)
- [ ] Sobre **fundo liso** (navy chapado ou off-white) — "flat solid dark navy background, clean silhouette for cutout"
- [ ] Dizer **qual tier** testar (os 5 slots já estão salvos; não precisa reenviar moldura)
Encaixe alvo: contido 100%, preenchendo bem (~88% da diagonal), centralizado.

---

## 6. PENDÊNCIAS DE ARTE
- Marcos dos **Maps 4 (Peak/violeta)** e **5 (Nihel/vermelho)** — fórmula folha Map 1 + estilo anime + negatives (`photorealistic, 3D render, octane, sharp specular`)
- **Redesign dos equipamentos em 45°** (fundo liso)

## 7. DECISÕES DESTA SESSÃO (para a sessão só-docs / Lore Bible+GDD)
- Layout do Gear migra de **lista vertical → paper-doll**
- **NPC Armeiro** (frio/sóbrio) como contraponto ao Maël — "mais do mundo, menos cósmico/luz"
- **Molduras de slot por tier** (forma única, 5 cores: faded/kindled/luminous/radiant/converged)
- **Itens redesenhados em 45°** para o slot quadrado
- Estilo anime/painterly travado para marcos a partir do Map 3 (Map 2 = exceção realista aceita)
