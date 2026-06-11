# Éclats of Lumière — Pacote de Assets v1 · 2026-06-10

Estrutura organizada para o pipeline (conversão WebP q80 via `convert_webp.py` incluso).
⚠️ Arquivos com **VERIFICAR** no nome: mapeamento de mapa/identidade proposto por Claude, pendente de confirmação do Willian (renomear ao confirmar).

## Conteúdo (124 arquivos) · v2 2026-06-10
- **backgrounds/** — Maps 1, 3, 4, 5 ✅. ⚠️ Map 2 (Cavernes Luminis) está em BAIXA RESOLUÇÃO (print de celular) — reenviar original.
- **worldmap/** — mapa-múndi aprovado + recorte 2× do continente I.
- **characters/seeker/** — retrato T1. ❌ FALTAM: T2–T5.
- **enemies/** — lotes de 2026-06-10, distribuídos por mapa PELO CENÁRIO DE FUNDO de cada arte (ruínas+arco-íris=M3 · dourado rachado=M4 · vermelho=M5). VERIFICAR identidades e quais são trio/raro/boss em cada mapa. ❌ FALTA confirmar: raro Hollowed Pilgrim M4.
- **bosses/** — 3 recebidos (VERIFICAR; possíveis bosses adicionais dentro de enemies/map5). ❌ FALTAM: bosses M1/M2 e Nihel (Âncora de Estilo nº 2).
- **frames/** — molduras T1 e inimigo universal, JÁ COM TRANSPARÊNCIA (alpha por luminância). ❌ FALTAM: T2–T5, 5 molduras de boss.
- **icons/nav/** — folha de ícones de navegação branco-azul (recortar individualmente no pipeline). **icons/currency/** — Lumens, Vestiges, Convergence com alpha.
- **gear/** — 30 recortes transparentes (6 peças × 5 raridades), nomeados `peça_raridade`.
- **passives/** — 45 recortes transparentes nomeados conforme GDD §7, por árvore.
- **relics/** — as 15 Mémoires, nomeadas `eN_nome` (era + nome).

## Pipeline restante (CP no Claude Code)
1. Recorte individual dos ícones de nav (folha → unidades)
2. Molduras T2–T5 e bosses → alpha por luminância (script validado nesta sessão)
3. Resize 2× do tamanho de exibição onde aplicável → WebP q80 (`convert_webp.py`)
4. Camadas retrato+moldura no CSS · data wiring dos assets no código
