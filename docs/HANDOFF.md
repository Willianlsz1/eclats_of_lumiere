# Éclats of Lumière — Handoff da Unificação

> **Para o próximo agente.** Este documento descreve o estado completo do projeto,
> o que já foi feito, a arquitetura, e exatamente o que falta — com caminhos de
> arquivo, API do motor e armadilhas. Última atualização: **2026-06-11**.

---

## 0. TL;DR (leia isto primeiro)

- O jogo é **Éclats of Lumière**, um **idle RPG de browser** (Vanilla JS + Vite, sem framework de UI).
- O repositório tinha **DOIS jogos paralelos**. Estamos **unificando num só**, na branch **`unify/eclats`**.
  - **`main`** = o **MOTOR** (Vite modular `src/`, fiel ao GDD) — mas tinha `assets/` vazio e UI básica.
  - **`redesign/curve-sim`** = a **CARA** (pipeline de assets + design system + telas pixel-fiéis) — mas sem motor real.
- **Decisão do Willian (dono):** base = **`main`** (o motor); trazer a arte + telas pra dentro dela; **escopo = MVP da main** (só Map 1; Gear/Passivas/Mémoires/Ascension são **pós-MVP**, ficam como nav bloqueada).
- **Branch de trabalho:** `unify/eclats` (parte da `main`). A `redesign/curve-sim` fica **intacta como backup**.
- **Já feito:** U-0 (assets), U-1 (casca), **U-2 (combate)**, **U-3 (mapa)**, **U-4 (player: Gold Stats + Convergence)** — todas as telas do MVP ligadas ao motor real. **Falta:** só o **U-final** (reconciliar nomes de assets `VERIFICAR`→kebab-case do `assets/README.md` — depende de cânon do Willian).
- **Rodar:** `npm install` (já feito) → `npm run dev` → `localhost:5173`. **Deploy:** push na `main` → GitHub Pages (`willianlsz1.github.io/Game-Teste`). Toda a unificação já está na `main`.

> **Atualização 2026-06-11 (U-2..U-4 concluídos):** Combate, Mapa e Player são telas reais
> (`src/ui/combat.js` · `map.js` · `player.js`), verificadas headless e no mobile. Correção de
> mobile aplicada (centralização do palco via `translate` — celular renderizava o palco fora da
> tela). Identidades do trio do Map 1 + boss confirmadas pela Art Direction §6. Resta o U-final.

---

## 1. Como o Willian trabalha (regras inegociáveis)

1. **Uma fase (CP/U) por vez, na ordem.** Ao fim de cada uma: relatório curto (% concluído + pendências) e **aguardar aprovação** antes da próxima. Não adiantar fases.
2. **Não inventar cânon** (nomes, lore, números). Na dúvida: usar placeholder marcado `// TODO(canon)` + perguntar no relatório.
3. **Escopo MVP = só Map 1.** Fora do MVP (NÃO implementar até pedir): Passivas, Gear, Echoes, Mémoires, Ascension, Maps 2-5.
4. **Idioma:** conversar em **português**; o **jogo é em inglês** (nomes de criaturas em EN; francês = mundo; hebraico = primordial).
5. **Commits pequenos** por entrega, mensagem clara. Commitar a cada fase concluída.

---

## 2. Fontes da verdade (ler antes de implementar)

No repositório (`docs/`):
- **`docs/eclats_gdd_final_v2.md`** — TODOS os sistemas, fórmulas e constantes. Nunca inventar número.
- **`docs/eclats_lore_bible.md`** — narrativa, nomes canônicos, cores da luz (dourado = luz presa; branco-azul = convergência).
- **`docs/eclats_art_direction.md`** — direção visual; `assets/README.md` = convenção de nomes de arte (kebab-case).
- **`docs/eclats_plano_implementacao_telas.md`** — **roadmap das 7 telas (CP-0..CP-8)**, trazido da outra branch. É o plano de UI.
- `docs/eclats_expansion_ideas.md` — ideias (nada entra sem virar decisão no GDD).
- **`CLAUDE.md`** (raiz) — instruções permanentes da `main` (disciplina de fases CP-A..G, regras de números).

**Mockups aprovados (referência pixel)** — em `_mockups_ref/` (⚠️ **untracked/gitignored**, só local; vieram de ZIPs do Willian). Se não estiverem na sua máquina, peça os `mockup-*.zip`:
- Combate: `_mockups_ref/mockup-combate-v5-espalhado/mockup-combate/index.html`
- Player: `_mockups_ref/_player/mockup-player/index.html`
- Gear: `_mockups_ref/_gear/mockup-gear/index.html`
- Mapa: `_mockups_ref/_mapa/mockup-mapa/index.html` + `continente.html`
- Mémoires: `_mockups_ref/_memoires/mockup-memoires/index.html`
- Passivas: `_mockups_ref/mockup-passivas/mockup-passivas/index.html`

**Atalho importante:** as telas de **Combate e Mapa já foram portadas dos mockups** na branch `redesign/curve-sim` (ver §6). Para U-2/U-3, **porte daquele código** (que já é fiel ao mockup) ligando ao motor real — não precisa reescrever do zero.

---

## 3. Estado atual do git

```
main                 → MOTOR original, intacto (NÃO trabalhar aqui)
redesign/curve-sim   → trilha antiga das telas (CP-0..CP-3); BACKUP, intacta
unify/eclats         → ★ BRANCH DE TRABALHO (parte da main) ★
```
Commits na `unify/eclats`:
- `11378ab` **U-0** — traz assets da redesign pra `public/eclats/`, manifest como módulo ES.
- `d5505ed` **U-1** — casca (nav + moedas + stage) lendo o state real.

**PR pendente:** existe um PR `redesign/curve-sim → main` com **conflito modify/delete em `index.html`**. **NÃO mergear** (criaria Frankenstein). No U-final esse PR deve ser **fechado** (a `unify/eclats` é que vira o caminho pra `main`).

⚠️ **`gh` não funciona** neste ambiente (api.github.com instável + token inválido). Use **git local**. Operações de PR ficam pro Willian / quando a rede e o `gh auth login` voltarem.

---

## 4. Arquitetura do jogo unificado

### 4.1 Estrutura de pastas (na `unify/eclats`)
```
index.html          → o stage 1920×1080 (shell). Carrega /src/main.js (Vite)
style.css           → mínimo (estilos reais estão em src/ui/)
vite.config.js      → Vite, base:'./'
src/
  main.js           → bootstrap: load → setupUI → startLoop(combatTick + renderUI)
  core/             → loop.js, state.js, save.js, format.js   (NÃO mexer sem motivo)
  game/             → combat.js, enemies.js, economy.js, stats.js, convergence.js, offline.js
  data/
    constants.js    → todas as constantes do GDD
    assets.js       → ★ manifest de assets como módulo ES (gerado) ★
  ui/
    ui.js           → ★ a UI (casca). Exporta setupUI/renderUI/showOfflineSummary ★
    tokens.css      → design tokens (paleta canon, Cormorant+Inter)
    shell.css       → chrome (nav, moedas, stage, views, placeholders)
public/eclats/      → 270 arquivos de arte (webp + png fallback), servidos pelo Vite em /eclats/
tools/eclats-pipeline/ → scripts Python do pipeline de assets (recorte, webp, crops, gerador)
docs/               → GDD, lore, art direction, plano de telas, este handoff
```

### 4.2 O loop (já pronto, não quebrar)
`src/main.js` faz:
```js
setupUI(state);
startLoop((dt) => { combatTick(state, dt); renderUI(state); });  // tick fixo 100ms
```
O **contrato da UI** que você DEVE manter em `src/ui/ui.js`:
- `setupUI(state)` — monta o DOM uma vez.
- `renderUI(state)` — chamado a cada tick; atualiza o que mudou.
- `showOfflineSummary(summary)` — banner de progresso offline.

### 4.3 API do motor (o que as telas leem/chamam)
- **`core/format.js`** → `formatNumber(n)` (K/M/B/T + notação curta). **Todo número exibido passa por aqui.**
- **`core/state.js`** → `state` (singleton). Campos: `lumens, xpTotal, xpRun, vestiges, convergences, convPoints, bestSubareaRun, stats{str,vit,agi,lck,frt,wis}, map, subarea, unlockedSubarea, bossDefeated[5], killsInSubarea, player{hp,dead,respawnTimer,attackTimer}, enemies[], fx[], killsTotal`.
- **`game/stats.js`** → `heroLevel(xpTotal)`, `dps(state)`, `playerHpMax(state)`, `currentAPS(state)`, `critChance(state)`, `critDamageMult(state)`, `convFactor(state)`, `strTotal/vitTotal/frtTotal/wisTotal(state)`, `statCostNext(level)`, `buyStat(state,key)`, `buyStatMax(state,key)`.
- **`game/combat.js`** → `combatTick(state,dt)`, `changeSubarea(state,dir)`, `resetPack(state)`.
- **`game/enemies.js`** → `getCurrentMap()`, `subareaLevelRange(map,subarea)`.
- **`game/convergence.js`** → `xpWall(convergences)`, `canConverge(state)`, `runPoints(state)`, `doConverge(state)`.
- **Inimigo (mob):** `{ id, name, hp, hpMax, dmg, level, isBoss }`.
- **`state.fx`** (fila de dano): `[{ mobId, amount, isCrit }]` — preenchida pelo combate, consumida e esvaziada pela UI a cada render.
- **Progressão Map 1** (`constants.js` MAP_1): `packSizes:[1,2,4,6,8]` por sub-área; `bossKillThreshold:100` (kills ocultos pro boss entrar no pack); 5 sub-áreas; o boss da sub-área abre a próxima (`unlockedSubarea`).

### 4.4 Assets (módulo `src/data/assets.js`)
Importe e use:
```js
import { picture, bg, url, path } from '../data/assets.js';
picture('icons.nav.1', { alt: 'Seeker' })   // → <picture> com webp + fallback png
bg('backgrounds.map1')                       // → image-set(...) p/ background-image
url('seeker.t1')                             // → 'eclats/characters/seeker/seeker_t1.webp'
```
Categorias em `ASSETS.DATA`: `backgrounds(map1..5)`, `worldmap(atlas, continent1..5)`, `seeker(t1)`, `frames(tier1, enemy)`, `icons.nav(1..7)`, `icons.currency(lumens,vestiges,convergence)`, `gear(peça_raridade ×30)`, `passives.{eclat,vestige,fracture}(×15)`, `relics(e1..e5 ×15)`, `enemies.map1..5`, `bosses`.
- `ASSETS.FLAGS.verify` (21 ids `VERIFICAR` — identidades não confirmadas) e `ASSETS.FLAGS.lowres` (map2 bg é low-res).
- Regenerar após mudar arte: `python tools/eclats-pipeline/gen_assets_module.py`.

---

## 5. O que JÁ foi feito

### Trilha antiga (branch `redesign/curve-sim`, sobre o protótipo vanilla — agora é referência)
- **CP-0** Fundação de assets: extração, WebP q80, recorte de 7 ícones de nav (alpha por luminância), manifest, página de teste.
- **CP-1** Design system: tokens + casca.
- **CP-2** Tela de Combate (port do mockup): bg, Wave X/Y, card do Seeker, inimigos espalhados, alvo dourado, dano flutuante, mortos apagados, HUD, badge "+N". **Com loop de apresentação (mentira).**
- **CP-3** Mapa-Múndi + Continente (port do mockup): 5 pinos, crop 2×, sub-áreas, painel direito, fluxo mundo→continente→entrar→combate.

### Trilha de unificação (branch `unify/eclats` — a que vale)
- **U-0** (`11378ab`): base na `main`; **270 assets → `public/eclats/`**; **manifest → módulo ES `src/data/assets.js`** (BASE=`eclats/`); scripts → `tools/eclats-pipeline/`; plano de telas → `docs/`; `.gitignore` ignora `.claude/` e `_mockups_ref/`.
- **U-1** (`d5505ed`): **casca sobre o motor**. `src/ui/ui.js` reescrito (mantendo o contrato); `index.html` virou o stage; tokens+shell em `src/ui/`. **Moedas leem o state real** (verificado: Lumens/Vestiges sobem sozinhos com o motor rodando). Nav: Combate/Mapa/Player ativos; Gear/Passivas/Mémoires/Ascension **bloqueados**. Telas ainda são placeholders.

---

## 6. O que FALTA fazer (detalhado)

> ✅ **RESOLVIDO (U-2..U-4):** os controles de interação que o U-1 tirou da casca voltaram:
> - **comprar Gold Stats** (`buyStat`/`buyStatMax`) — tela do Player (U-4). ✅
> - **Convergir** (`doConverge`, quando `canConverge`) — tela do Player (U-4). ✅
> - **mudar de sub-área** (`changeSubarea`/`enterSubarea`) — setas no Combate (U-2) e nós no Mapa (U-3). ✅

### U-2 — Tela de Combate ligada ao motor real
**Objetivo:** trocar o loop de mentira pelo `combatTick` real.
1. Porte os estilos: `redesign/curve-sim:gaiadon-clone/css/eclats/combat.css` → `src/ui/combat.css` (use `cmd /c "git show ref:path > arquivo"` p/ preservar UTF-8 — ver §7).
2. Crie `src/ui/combat.js` (ou método em ui.js) que **renderiza** a cena lendo o state:
   - Card do Seeker: `playerHpMax`, `state.player.hp`, `heroLevel`, tier.
   - Inimigos: itere `state.enemies` (cada um `{id,name,hp,hpMax,dmg,level,isBoss}`). Posições espalhadas (pontos de spawn fixos, ver combat.js antigo). Pack ≤ 8 (packSizes), então **não precisa de "+N"** no MVP — renderize todos.
   - Alvo: o primeiro vivo recebe borda dourada. Mortos: grayscale.
   - **Dano flutuante:** consuma `state.fx` (cada `{mobId,amount,isCrit}`) e anime sobre o card do mob — esvazie `state.fx` ao fim (como a UI antiga fazia em `renderDamageFloats`).
   - **Boss:** se algum mob tem `isBoss`, card maior/moldura completa. ⚠️ **arte do boss M1 (The Gilded Hollow) está faltando** — use placeholder ou `enemies.map1.golden_figure`.
   - HUD rodapé: Lumens/min, Kills/min, Dano, Vestiges/min (derivar do state; pode aproximar).
3. **"Wave X/Y" — wrinkle de design:** o motor NÃO tem waves literais; usa `killsInSubarea` rumo a `bossKillThreshold` (100). Mapeie o rótulo para algo real (ex.: progresso de kills até o boss, ou "Sub-área X/5"). **Decisão de design — pergunte ao Willian** se quiser manter "Wave".
4. Reexponha **`changeSubarea(state,±1)`** (setas ◀▶), respeitando o gate `unlockedSubarea`.
5. **Referência de wiring:** o `renderEnemies`/`renderDamageFloats` da UI ANTIGA (em `main:src/ui/ui.js`, recuperável via `git show main:src/ui/ui.js`) mostra exatamente como ler `state.enemies` e `state.fx`. **Copie essa lógica** para dentro do visual do mockup.

### U-3 — Mapa-Múndi + Continente lendo o state real
1. Porte `redesign/curve-sim:gaiadon-clone/css/eclats/map.css` → `src/ui/map.css` e `.../js/eclats/map.js` → `src/ui/map.js`.
2. Ligue ao state: `state.map`, `state.subarea`, `state.unlockedSubarea`, `state.bossDefeated[]`. Só **Map 1 é MVP** (maps 2-5 ficam bloqueados/visuais).
3. "Entrar na sub-área" → `changeSubarea` (ou setar `state.subarea`) + voltar pra tela de Combate.
4. Sub-áreas do Map 1: nomes placeholder (`// TODO(canon)`). Crops dos continentes 2-5 são **provisórios** (gerados de `tools/eclats-pipeline/_gen_continent_crops.py`).

### U-4 — Tela do Player (CP-4)
1. Porte do mockup `_mockups_ref/_player/mockup-player/index.html`: retrato + moldura T1 à esquerda; à direita XP/parede + 4 painéis (Combate, Economia, Árvores, Convergence).
2. Leia: `heroLevel`, `dps`, `currentAPS`, `critChance/critDamageMult`, `playerHpMax`, economia (frt/wis/lumens), `convFactor`, `convergences/convPoints`, parede (`xpRun`/`xpWall`).
3. **Inclua os Gold Stats** (os 6 stats com `buyStat`/`buyStatMax` + custo `statCostNext`) — é onde o jogador gasta Lumens pra progredir (estava na UI antiga; **precisa voltar**).
4. **Botão Convergir** (`doConverge` quando `canConverge`) + barra da parede.
5. Árvores de passivas/Convergence relíquias: leitura **placeholder** (pós-MVP) — mostrar 0/15 etc.

### U-final — Limpeza + jogo único
1. Remover leftovers untracked do working tree: `docs/adr/`, `docs/superpowers/` (são da branch antiga; recuperáveis via `git show redesign/curve-sim:...`).
2. Reconciliar nomes de assets: meu `public/eclats/` usa nomes `VERIFICAR`/underscore; a `assets/README.md` da main define kebab-case canônico. Alinhar **com o Willian** (depende do cânon).
3. **Fechar o PR** `redesign/curve-sim → main` (não mergear). Definir como `unify/eclats` chega na `main` (PR `unify/eclats → main`, provável fast-forward já que parte da main).
4. QA ponta a ponta no Map 1: combate jogável, gold stats, sub-áreas, boss, convergence, offline, save.
5. Atualizar `CLAUDE.md` se a estrutura de UI mudou as convenções.

---

## 7. Armadilhas / convenções técnicas (importante!)

- **`preview_screenshot` SEMPRE trava** (timeout 30s) nesta página por causa do letterbox + `transform: scale` no stage. **Não é bug do código** — o renderer responde a `preview_eval` na hora. **Verifique tudo via `preview_eval`** (estado do DOM, `naturalWidth` das imgs, etc.) e peça pro Willian abrir `localhost:5173` pro visual.
- **Rodar/verificar:** preview config **"vite"** em `.claude/launch.json` (`npm run dev`, porta 5173). `preview_start("vite")`.
- **`git show` + PowerShell corrompe UTF-8** (acentos viram mojibake nos comentários). Para extrair arquivos de outra branch byte-a-byte: `cmd /c "git -C <repo> show <ref>:<path> > <arquivo>"`.
- **Mensagens de commit:** neste PowerShell, **aspas duplas dentro do here-string `@'...'@` quebram** o `git commit -m`. Use mensagens sem aspas internas. Termine com a linha `Co-Authored-By:` exigida.
- **Encoding ao escrever arquivos** que outros leem: PowerShell escreve UTF-16 por padrão; use a ferramenta `Write` (não `Out-File`) ou `[System.IO.File]::WriteAllText(path, txt, (New-Object System.Text.UTF8Encoding $false))`.
- **`.claude/` e `_mockups_ref/` são gitignored** (ferramentas de dev + mockups de referência). Não commitar.
- **Plataforma:** Windows 11, PowerShell 5.1 (ver quirks no system prompt — `$null`, backtick, etc.). Bash POSIX também disponível.
- **Vite + assets:** arte vai em `public/eclats/`; referência relativa `eclats/...` (BASE no manifest). `base:'./'` no vite.config.

---

## 8. Lista de `TODO(canon)` (pendências do Willian)

1. **Identidades dos 21 assets `VERIFICAR`** (trio/raro/boss por mapa).
2. **Mapeamento ícone-de-nav → tela** para Map/Gear/Train (ordem dos 7 ícones já confirmada; ver `src/ui/ui.js`).
3. **Background do Map 2** é low-res (placeholder) — Willian vai reenviar PNG (dropar em `public/eclats/backgrounds/` e regenerar manifest).
4. **Nomes das sub-áreas** (Map 1 tem placeholders "Orla do Bosque" etc.; 2-5 genéricos).
5. **"Wave X/Y" vs progressão real** (killsInSubarea/bossKillThreshold) — decidir o rótulo.
6. **Reconciliar nomes de arte** com a convenção kebab-case de `assets/README.md`.
7. **Boss arts faltando**: M1 (Gilded Hollow), M2 (Pale Reunion já tem?), Nihel; retratos Seeker T2-T5; molduras T2-T5.
8. **Éclats como moeda** (pós-MVP, p/ Mémoires) — hoje a 3ª moeda mostra contagem de Convergence.

---

## 9. Como continuar (passo a passo para o próximo agente)

1. `git checkout unify/eclats` · `npm install` · `npm run dev` (ou `preview_start("vite")`).
2. Abra `localhost:5173` — você verá a casca (nav + moedas vivas + placeholders).
3. Pegue **U-2** (próxima fase). Leia o §6 U-2 e o §4.3 (API). Porte `combat.css`/`combat.js` da `redesign/curve-sim` e ligue ao `state.enemies`/`state.fx`/`combatTick` (referência: `git show main:src/ui/ui.js` → `renderEnemies`/`renderDamageFloats`).
4. Verifique via `preview_eval` (0 imgs quebradas, console limpo, mobs do state aparecendo, dano flutuando, HP drenando pelo motor).
5. Commit pequeno (`U-2: ...` + Co-Authored-By). Relatório curto pro Willian com % e pendências. **Aguarde aprovação** antes do U-3.

> Memória persistente do projeto: ver `eclats-telas-plano.md` no diretório de memória do agente (resumo do roadmap, decisões e status).
