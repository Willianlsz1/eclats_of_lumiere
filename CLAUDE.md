# Éclats of Lumière — instruções permanentes

> ⚠️ **REDESIGN EM ANDAMENTO (2026-06-14) — LEIA ANTES DE SEGUIR REGRAS ABAIXO.**
> A direção do jogo mudou numa sessão de design. Fonte da nova direção:
> **`docs/eclats_redesign_2026-06-14.md`** + **`docs/adr/0001`, `0002`** + **`CONTEXT.md`**.
> Regras abaixo marcadas **[SUPERSEDED]** NÃO valem mais. Resumo do que mudou:
> **(1)** combate base segue **SINGLE-TARGET** (a regra "1 kill/ataque" VALE no base); o
> **CLEAVE/AoE** é **desbloqueável** por passiva/mecânica (ADR 0002 revisado);
> **(2)** **Gold Stats removidos** (Nível dá stat base); **(3) Convergence** redesenhada
> (sem reset/backtrack de mapa; +15%/conv; Ascension multiplica); **(4)** o "MVP só Map 1"
> deu lugar a **5 mapas = Jogo base = ~30 dias**; **(5)** novos sistemas: **Hollows**
> (dungeons), **Reliquats** (2ª aba do Gear), **habilidades ativas** (1/Despertar),
> **Gatekeepers** redefinidos. **Toda a calibração antiga será refeita.**

## O projeto
Idle RPG para browser. JavaScript puro (ES6 modules) + HTML + CSS, build com Vite (template vanilla). Sem frameworks de UI. Deploy futuro: Cloudflare Pages. Trabalhe sempre na branch main.

## Fontes da verdade (leia antes de implementar qualquer sistema)
- docs/eclats_gdd_final_v2.md — TODOS os sistemas, fórmulas e constantes de balanceamento. Nunca invente valores: se um número não está no GDD, pergunte.
- docs/eclats_lore_bible.md — TODA a narrativa, nomes e nomenclatura canônica (idiomas: hebraico = primordial, francês = mundo, inglês = criaturas).
- docs/eclats_art_direction.md — direção visual (v3); a UI segue o mockup docs/eclats_ui_mockup_v2_branco_azul.html (chrome branco/azul, 1920×1080 desktop como referência). Convenções de arquivos de arte: assets/README.md.
- docs/eclats_expansion_ideas.md — ideias debatidas e seus status; NADA dali entra em produção sem antes virar decisão aprovada no GDD.

## Regras de números
- Number nativo do JS; teto do jogo base é 1e100 (cabe no float).
- break_infinity.js já está instalado como dependência (decisão de fundação — ver docs/eclats_expansion_ideas.md, ideia 4) para o futuro pós-MVP ultrapassar 1e308. NÃO usar no MVP: a migração (saves, fórmulas, format) será um CP próprio quando for pedida.
- Todo valor exibido passa por src/core/format.js (sufixos K/M/B/T, depois notação científica curta).
- Cap físico de combate (BASE): máximo de 1 kill por ataque — kill rate nunca excede o APS atual. Esta regra ancora a economia base. **O CLEAVE/AoE é um unlock que excede esse teto (ADR 0002 revisado 2026-06-14).**

## Estrutura
index.html · style.css · src/core/ (loop, state, save, format) · src/game/ (combat, enemies, economy, stats, convergence) · src/data/ (constants, assets) · src/ui/ (ui = casca nav/moedas + fit; combat/map/player = telas reais; tokens/shell/combat/map/player .css) · assets/ · docs/

## Disciplina de fases (inegociável)
> **[PARCIALMENTE SUPERSEDED 2026-06-14]** O escopo "MVP só Map 1" e "Gold Stats (CP-C)"
> mudaram (ver banner no topo). Os 5 mapas são o **Jogo base**; Gold Stats saíram;
> Convergence/Combate foram redesenhados. A disciplina de **implementar só o pedido, sem
> refactor amplo nem misturar escopo, continua valendo.**

O MVP é só o Map 1, em fases: CP-A bootstrap/loop/save · CP-B combate · CP-C gold stats · CP-D subáreas+boss · CP-E convergence · CP-F vestiges+offline · CP-G skin/assets. Implemente APENAS o CP pedido na tarefa. Nunca adiante fases, nunca faça refactors amplos não pedidos, nunca misture escopo. Fora do MVP (não implementar ainda): Passivas, Echoes, Mémoires, Ascension, Maps 2-5. (Gear saiu desta lista em 13/jun/2026 — redesign aprovado, ver docs/eclats_implementacao_gear_mapas.md.)

## Convenções
Módulos pequenos e focados; comentários em português; sem dependências externas além do Vite; save em localStorage com versão de schema; commits pequenos por entrega com mensagem clara.

## Ao final de cada tarefa
Resumo do que foi feito, como testar manualmente, e estimativa de % do CP concluído.
