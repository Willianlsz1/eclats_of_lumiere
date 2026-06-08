# AGENTS.md — Guia para Agentes

Instruções para qualquer agente (Claude Code ou outro) que trabalhe neste repositório.
Leia este arquivo antes de fazer mudanças.

---

## 1. O que é este projeto

**Éclats of Lumière** — um **Idle RPG** casual de navegador (combate automático,
herói e inimigos como cards, progressão de prestígio em camadas). Tema: dark fantasy
melancólico baseado em Kabbalah Luriânica.

O código vive em **`gaiadon-clone/`** (nome de protótipo herdado — o jogo está em
**pivot** do tema antigo "Gaiadon" para "Éclats of Lumière").

### Documentos canônicos (fonte da verdade)
- **`gaiadon-clone/DESIGN.md`** — Game Design + Lore completo. **O quê construir.**
- **`gaiadon-clone/ROADMAP.md`** — fases de implementação. **Em que ordem.**
- **`gaiadon-clone/CONTEXT.md`** — glossário de domínio + decisões de arquitetura.
- `gaiadon-clone/ASSET-MANIFEST.md` — ⚠️ **obsoleto** (tema antigo). Será substituído na Fase 7.

> Em caso de conflito entre código e DESIGN.md, **DESIGN.md vence** — o código está
> mid-pivot e implementa ~30-40% do design alvo.

---

## 2. Stack & como rodar

- **Vanilla JS (ES6+), HTML5, CSS3.** Sem framework, sem build, sem bundler.
- Persistência: `localStorage`. Sem dependências externas.
- **Rodar o jogo:** abrir `gaiadon-clone/index.html` no navegador (ou servir estático). A raiz `index.html` redireciona para lá.
- **Rodar os testes:** `node gaiadon-clone/js/game.test.js` (lib de assert própria em `_assert.js`).
- Há verificações extras em `gaiadon-clone/tests/` (`node tests/verify-*.js`).

---

## 3. Arquitetura (e como estendê-la)

Ordem de carregamento dos módulos JS (definida em `index.html`, **respeitar dependências**):

```
data → progression → loot → zones → game → ui → render → events → migrate → main
```

| Arquivo | Responsabilidade |
|---|---|
| `js/data.js` | Constantes, `CONFIG`, dados estáticos. **Single source of truth de balanceamento.** |
| `js/progression.js` | Tiers, ascensão, synergy, multiplicadores. **Puro.** |
| `js/loot.js` | Equipamento, afixos, crítico, level/rarity. **Puro.** |
| `js/zones.js` | Escala de inimigos, archetypes, spawn, mastery. **Puro.** |
| `js/game.js` | Estado, stats do jogador, loop de combate (`tick`), ascensão. **Puro (sem DOM).** |
| `js/ui.js` | Render functions (leem o `state`, nunca escrevem). |
| `js/render.js` | Dispatch central de render. |
| `js/events.js` | Dispatch de eventos emitidos por `tick()`. |
| `js/migrate.js` | Cadeia de migração de saves. |
| `js/main.js` | Game loop, save/load, bind de botões. |

### Padrões a seguir (não reinventar)
- **Lógica de jogo é pura:** funções recebem `state` como parâmetro, **sem tocar no DOM**. Isso permite testar sem navegador. Mantenha assim.
- **Nova tela/render:** adicione uma linha em `RENDER_DISPATCH` (`render.js`). Callers só declaram categorias "dirty"; não chamam render functions direto.
- **Novo evento de combate:** adicione um ramo em `events.js`. `main.js` não precisa saber que o evento existe.
- **Mudança no formato do save:** adicione uma função **idempotente** ao array `MIGRATIONS` (`migrate.js`). Nunca altere `load()`.
- **Novo CSS de view:** crie `css/<view>.css` e um `<link>` no `index.html`. Estilos cross-view ficam em `shared.css`.

---

## 4. Convenções de código

- **Texto visível ao jogador: sempre em inglês.** Nomes próprios em outras línguas (francês/latim/grego/hebraico) mantêm a forma original.
- **Comentários podem ficar em português.**
- Constantes de balanceamento vão no `CONFIG` de `data.js`, **não hardcoded** em funções.
- Exporte para Node nos testes com o padrão `if (typeof module !== "undefined") { module.exports = {...} }`.
- Mantenha funções pequenas e o estilo do arquivo vizinho (densidade de comentário, nomes, idioma).
- **Números gigantes:** use multiplicadores **relativos**; formate com `fmt()`. HP chega a ~1e60 (ok em `double`); só migrar para BigInt/`break_infinity` se passar de ~1e300.

---

## 5. Fluxo de trabalho Git

- Branch de desenvolvimento: **`claude/game-analysis-jYIGn`** (criar localmente se não existir).
- Commitar com mensagens claras e descritivas. **Não** abrir Pull Request sem pedido explícito.
- Push: `git push -u origin <branch>` (retry com backoff em erro de rede).
- Lembre: o ambiente remoto/web só enxerga o que está **commitado e no GitHub** — trabalho local não-commitado não chega aqui.

---

## 6. Antes de considerar uma tarefa "pronta"

1. `node gaiadon-clone/js/game.test.js` passa (atualize testes quando mudar fórmulas).
2. A mudança está alinhada ao `DESIGN.md` e à fase correspondente do `ROADMAP.md`.
3. Texto de jogador em inglês; sem números mágicos fora do `CONFIG`.
4. Lógica de jogo continua pura (sem DOM em `game.js`/`progression.js`/`loot.js`/`zones.js`).
