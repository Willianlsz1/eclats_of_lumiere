# Gaiadon Clone — Domain & Architecture Context

Glossário de termos do domínio e decisões arquiteturais do projeto.
Atualizado durante sessões de code review e grilling.

---

## Domínio

**Zone** — cada nível de combate. O jogador avança matando inimigos; ao limpar uma zone, desbloqueia a próxima. Zones têm packs (grupos de inimigos) e um boss final.

**Region** — agrupamento temático de zones com nome e paleta visual próprios (ex.: "Plains of Aurin", "Whispering Forest"). Cada region funciona como um **portão de progressão**: ao entrar numa nova region, os inimigos são `regionPowerMult×` mais fortes que os da region anterior, criando paredes de dificuldade bem definidas (ao estilo dos level ranges do Gaiadon original). Recompensas (gold, xp, shards) escalam proporcionalmente.

**Pack** — grupo de inimigos que atacam juntos na mesma zone.

**Ascension** — reset suave: zera gold, zones e level, mantém equipment. Cada ascensão aplica um multiplicador permanente de stats. Acumular ascensões suficientes promove o herói a um **Tier** maior (com power spike).

**Tier** — nível de prestígio do herói (Common → Uncommon → Rare → Epic → Legendary). Desbloqueado ao atingir um número mínimo de ascensões.

**Shard** — moeda secundária usada para subir raridade de equipamento.

---

## Arquitetura

**Render dispatch** (`js/render.js`) — módulo central de despacho de render. Callers declaram *o que mudou no estado* via um `Set` de categorias sujas (`dirty`); o módulo decide quais render functions chamar. Throttle timing permanece nos callers.

Categorias do dirty set:

| Categoria    | Render functions disparadas          |
|-------------|--------------------------------------|
| `resources`  | `renderResources`                    |
| `combat`     | `renderCombat`, `renderNextGoal`     |
| `hero`       | `renderHero`                         |
| `equipment`  | `renderEquipment`                    |
| `ascension`  | `renderAscend`                       |

**Regra:** adicionar uma nova tela/render function = uma linha em `RENDER_DISPATCH` em `render.js`. Nenhum caller precisa ser editado.

**Event dispatch** (`js/events.js`) — módulo que trata todos os eventos emitidos por `tick()`. Callers (gameLoop) passam o array de eventos; o módulo decide o efeito de cada tipo (`kill` → log, `death` → log, `hit` → float damage + flash). Mantém o acumulador de hit interno (stateful). Novo evento = novo `else if` neste arquivo. `main.js` não precisa saber que o evento existe.

**Save migration chain** (`js/migrate.js`) — array de funções de migração aplicadas em sequência a cada `load()`. Cada função recebe o estado carregado e retorna o estado corrigido. Idempotentes: seguras de rodar num save já migrado. Novo campo no save ou campo obsoleto = nova função no array `MIGRATIONS`. `load()` nunca muda.

**CSS modules** (`css/`) — estilos divididos por view, cada módulo mapeia 1:1 a uma render function em ui.js. Ordem de carregamento no `index.html`:

| Módulo          | Conteúdo                                                        |
|----------------|-----------------------------------------------------------------|
| `tokens.css`    | Design tokens (:root) — cores, espaçamento, tipografia, raridade. Sem seletores. |
| `shared.css`    | Cross-view: reset, header, nav, buttons, panels, rarity text utils, footer, modal, responsive base. Inclui `rarity-fill-*` (gradients unificados usados por equipment E ascension). |
| `combat.css`    | Enemy card, HP bars, pack, mastery, kill-track, danger, zone nav, log, floating damage, animações. |
| `equipment.css` | Equip cards, level bars, affixes, action buttons, slot flash, synergy panel. |
| `stats.css`     | Hero level, XP bar, stats grid, growth footer.                  |
| `ascension.css` | Tier name, progress bar, requirements, milestones, zone-num-label. |

**Regra:** adicionar estilos de uma nova view = criar um novo `css/<view>.css` e adicionar um `<link>` no `index.html`. Estilos cross-view (rarity text, progress fills) ficam em `shared.css`.
