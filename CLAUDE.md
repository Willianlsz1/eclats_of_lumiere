# Éclats of Lumière — instruções permanentes

## O projeto
Idle RPG para browser. JavaScript puro (ES6 modules) + HTML + CSS, build com Vite (template vanilla). Sem frameworks de UI. Deploy futuro: Cloudflare Pages. Trabalhe sempre na branch main.

## Fontes da verdade (leia antes de implementar qualquer sistema)
- docs/eclats_gdd_final_v2.md — TODOS os sistemas, fórmulas e constantes de balanceamento. Nunca invente valores: se um número não está no GDD, pergunte.
- docs/eclats_lore_revisao_consolidada.md — nomes e nomenclatura canônica (idiomas: hebraico = primordial, francês = mundo, inglês = criaturas).
- docs/eclats_art_direction.md — direção visual; a UI segue o mockup docs/eclats_ui_mockup_v2_branco_azul.html (chrome branco/azul, 1920×1080 desktop como referência).

## Regras de números
- Number nativo do JS; teto do jogo base é 1e100 (cabe no float, sem bibliotecas).
- Todo valor exibido passa por src/core/format.js (sufixos K/M/B/T, depois notação científica curta).
- Cap físico de combate: máximo de 1 kill por ataque — kill rate nunca excede o APS atual. Esta regra ancora toda a economia.

## Estrutura
index.html · style.css · src/core/ (loop, state, save, format) · src/game/ (combat, enemies, economy, stats, convergence) · src/data/constants.js · src/ui/ · assets/ · docs/

## Disciplina de fases (inegociável)
O MVP é só o Map 1, em fases: CP-A bootstrap/loop/save · CP-B combate · CP-C gold stats · CP-D subáreas+boss · CP-E convergence · CP-F vestiges+offline · CP-G skin/assets. Implemente APENAS o CP pedido na tarefa. Nunca adiante fases, nunca faça refactors amplos não pedidos, nunca misture escopo. Fora do MVP (não implementar ainda): Passivas, Gear, Echoes, Mémoires, Ascension, Maps 2-5.

## Convenções
Módulos pequenos e focados; comentários em português; sem dependências externas além do Vite; save em localStorage com versão de schema; commits pequenos por entrega com mensagem clara.

## Ao final de cada tarefa
Resumo do que foi feito, como testar manualmente, e estimativa de % do CP concluído.
