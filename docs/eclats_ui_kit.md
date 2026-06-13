# Éclats — Kit de UI (identidade de interface)

Objetivo: um vocabulário de componentes **reutilizável** que dá a TODA tela a mesma
assinatura visual — em vez de painéis ad-hoc. Inspirado na riqueza de kits ornamentados
(ex.: EXOS SAGA), mas com a identidade do Éclats, não copiando outro jogo.

## Princípio: material = significado
Cada elemento "veste" um material que diz o que ele é. **Não é dourado em tudo.**
- **Vidro navy** (`#0b1226` translúcido) — superfícies/painéis (a base).
- **Filigrana dourada** — só a *chrome cerimonial* (molduras, títulos da Ordre); com parcimônia.
- **Azul-gelo luminoso** — a luz/Éclat (emblemas, ícones de nav).
- **Cor da raridade/material** — qualquer coisa ligada a um tier veste a cor dele:
  Faded `#6b7280` · Kindled `#c96a2a` · Luminous `#d9a441` · Radiant `#f0d9a0` · Converged `#aac8ff`.
- **Brasa/ferro** — acento próprio da Forja (puxa pro ember, não pro ouro).
- **Motivos nossos** — o **crescente** do set + cantos de filigrana (nameplate/slot).

## Regra de hierarquia: HUD/log é discreto
O rodapé/HUD (métricas kills-min, progresso, log) **não compete** com a tela principal —
recua. Molduras dramáticas (ex.: `progress_frame`, crest grande) são pra telas onde a
barra é FOCO (ex.: Mapa), não pro HUD de combate, que deve ser simples. (Willian, 13/jun.)

## Técnica: decidida POR PRIMITIVA
Não há regra única. Cada primitiva escolhe entre: 9-slice/3-slice neutro recolorido por CSS,
ou imagem fixa temática. Decisão registrada na ficha de cada uma.

## Inventário (prioridade de impacto)
1. **Barra/gauge** ← em construção
2. Frame de painel · Botão
3. Selo/badge · Banner de título
4. Aba (tab) · Divisor/ornamento de canto

Já existentes que entram no kit: slot de item (`slot_frame`, box tintado por raridade),
nameplate (Lucius/Maël), ícones de nav (azul-gelo).

---

## Primitiva 1 — Barra/gauge

**Técnica:** moldura decorativa em **overlay**, **3-slice horizontal** (pontas crocantes,
miolo estica). Largura variável, altura fixa. Aplicável sobre QUALQUER barra existente.

**Camadas (de baixo pra cima):**
1. trilho (CSS): caixa escura arredondada.
2. fill (CSS): `<i>` colorido pela **cor do material/raridade** (não dourado-padrão).
3. valor (CSS): fração sobreposta centralizada.
4. **moldura (asset, overlay):** rail de ferro/ouro com pontas ornamentadas, **miolo transparente**.

**Asset a gerar:** `ui/bar_frame` — uma barra-cartucho horizontal vazia, rail dourado/ferro
com pontas (caps) ornamentadas espelhadas, **centro 100% transparente** (o fill aparece por baixo),
sobre fundo preto pra recorte. Wide (~8:1). Caps ~12% de cada lado = a zona 3-slice.

**CSS (planejado):** `.ui-bar` recebe `border-image: url(bar_frame.webp) <slices> / <widths>`
(sem `fill`, centro transparente); `.ui-bar > i` = fill por material; `.ui-bar > em` = valor.

**Onde aplica:** gates da Forge · HP/XP do combate · progresso do mapa · barras do gear.

**Recolor por contexto:** o fill carrega a cor (CSS). Onde quisermos o rail também colorido
por raridade, um overlay `mix-blend`/filtro recolore a base neutra.
