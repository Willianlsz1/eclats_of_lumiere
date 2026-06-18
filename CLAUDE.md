# Éclats of Lumière — instruções permanentes

> 🧨 **RESET / FOLHA EM BRANCO (2026-06-18) — LEIA ANTES DE TUDO.**
> A lógica de jogo foi **removida**; **apenas o visual/design foi preservado**
> (telas `src/ui/*` + arte em `public/eclats/`). A base e seus sistemas estão sendo
> **replanejados do zero**.
> - **Fonte da verdade atual:** `docs/design/base_v3_blank.md` (em construção) +
>   `docs/design/decisions.md`.
> - **Design antigo (NÃO é fonte da verdade):** movido para `docs/archive/`
>   (GDD v2, redesign 14/jun, ADRs, balanceamento, CONTEXT). Só referência histórica.
> - **Não invente sistemas nem números:** se algo ainda não foi decidido em
>   `base_v3_blank.md`, **pergunte**. Não reaproveite regras do `docs/archive/`
>   sem reaprovação.

## O projeto
Idle RPG para browser. JavaScript puro (ES6 modules) + HTML + CSS, build com Vite (template vanilla). Sem frameworks de UI. Deploy futuro: Cloudflare Pages.

## Estado do código (pós-reset)
- **Visual/design (MANTIDO):** `src/ui/**` (telas `.js` + `.css`, tokens, shell,
  mobile), `index.html`, `style.css`, arte em `public/eclats/`, `src/data/assets.js`,
  `src/core/format.js`.
- **Motor (REMOVIDO):** apagados `src/core/{loop,save,dev}.js` e
  `src/game/{fatekeepers,difficulty,offline}.js`.
- **Stubs de casca (sem lógica):** `src/core/state.js` (estado de amostra estático) e
  os demais `src/game/*.js` devolvem valores de amostra só para a UI renderizar.
- **`src/data/constants.js`:** mantido por ora (a UI lê nomes/labels/estrutura dele);
  os números de balanceamento estão obsoletos e serão reescritos no replanejamento.
- **Sem persistência:** o save em localStorage é zerado no boot (`main.js`).

## Fontes da verdade
- `docs/design/base_v3_blank.md` — a NOVA base (em construção). Nada de números/sistemas
  fora do que estiver decidido aqui.
- `docs/eclats_lore_bible.md` — narrativa, nomes e nomenclatura canônica (hebraico =
  primordial, francês = mundo, inglês = criaturas).
- `docs/eclats_art_direction.md` + `docs/eclats_ui_kit.md` — direção visual; a UI segue
  o mockup `docs/eclats_ui_mockup_v2_branco_azul.html` (chrome branco/azul, 1920×1080
  desktop como referência). Convenções de arte: `assets/README.md`.
- `docs/eclats_bestiary_reference.md` — criaturas/sprites por mapa.

## Regras de números
- Number nativo do JS; `break_infinity.js` está instalado mas **não** é usado na casca.
- Todo valor exibido passa por `src/core/format.js` (sufixos K/M/B/T, depois notação
  científica curta).
- Demais regras de balanceamento: **a definir** em `docs/design/base_v3_blank.md`.

## Disciplina de trabalho
Implemente **apenas o que foi pedido**. Nunca faça refactors amplos não solicitados nem
misture escopo. Ao (re)introduzir sistemas, primeiro decida-os em `base_v3_blank.md`,
depois implemente.

## Convenções
Módulos pequenos e focados; comentários em português; sem dependências externas além do
Vite; commits pequenos por entrega com mensagem clara.

## Ao final de cada tarefa
Resumo do que foi feito, como testar manualmente, e estimativa de % concluído.
