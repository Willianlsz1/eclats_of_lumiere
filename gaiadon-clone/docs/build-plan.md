# Build Plan — Implementação do Redesign

> Plano executável. Lê junto com `progression-redesign.md`, `equipment-redesign.md`,
> `implementation-plan.md` (decisões D1–D7).
> Regra de ouro: **mecânica primeiro, UI depois; uma fase por vez; build sempre rodando.**

---

## Fase 0 — Pré-requisitos (ANTES de qualquer código)

Sem isso, a obra corrompe (aconteceu 3× hoje).

1. **Mão única:** o Claude Code **parado**. Só um agente mexe no repo por vez.
2. **Reparar o git:** remover o lock travado do `.git` (o repo ficou danificado pelas
   colisões — hoje não dava pra commitar). Sem git saudável, não dá pra commitar por fase.
3. **Commit baseline:** snapshot do estado recuperado atual (lore + balance do CC), pra ter
   ponto de retorno.
4. **Smoke test de referência:** rodar a carga estilo-navegador (vm shared scope) e guardar
   o resultado de `enemyStatsFor(0,0,1)` como baseline.

> Cada fase abaixo termina com: smoke test + commit. Se quebrar, reverte a fase.

---

## Fase 1 — Núcleo de nível contínuo  *(fundação — tudo depende disto)*

**Arquivos:** `data.js`, `zones.js`

1. `data.js`: trocar `REGIONS` (com 3 dificuldades) por **5 eras** com banda de nível +
   âncoras de HP (tabela da D3): Auroral 1–50, … Pinnacle 1M–1B (cap 1e60).
2. `data.js`: remover `DIFFICULTIES`/`powerMult`. Mover gold sublinear e `ratioByRegion`
   pra "por era/banda" (preservar o balance do CC).
3. `zones.js`: `enemyStatsFor(level)` — HP por interpolação geométrica dentro da era
   (reusa o `internalScale^progresso`). "Nível" = a antiga "wave" (D1).
4. Nível discreto: a função que monta o card do mob expõe `Lv N` pequeno.

**Verificar:** `enemyStatsFor(1)=~10`, `enemyStatsFor(1e9)=~1e60`, curva suave entre eras.

---

## Fase 2 — Camada Rebirth  *(o grind frequente)*

**Arquivos:** `progression.js`, `data.js`

1. Renomear a "ascension" atual → **Rebirth** (reset leve: nível/Lumin/Channeling).
2. Adicionar **Attunement** (+1 por Rebirth): +2% poder base e +1% por nível (placeholder).
3. **Remover `ascGrowth`** do inimigo (acaba o treadmill — agora Attunement é ganho líquido).
4. Essence no Rebirth = `√(profundidade) × scale` (já existe a fonte Depth).

**Verificar:** após N Rebirths, poder base cresce ~×1.0 + N·0.02; inimigo NÃO escala por reset.

---

## Fase 3 — Camada Ascension  *(5 marcos)*

**Arquivos:** `progression.js`, `game.js`

1. Os 5 tiers viram os 5 marcos. Gatekeeper de cada era = requisito (vencer o boss no teto).
2. Ascension **reseta tudo** da camada de baixo (incl. gear + Attunement); mantém o tier.
3. Aplicar os **spikes** (×10/×50/×200/×1000) ao virar tier.
4. Cada Ascension desbloqueia a próxima era + o **Vestige de era** (Selo da Aurora, etc.).
5. Tier 4 (Transcendent): **Channeling para de resetar**.

**Verificar:** vencer gatekeeper → tier sobe, spike aplicado, próxima era abre, gear zera.

---

## Fase 4 — Equipamento (crafting/upgrade)  *(substitui loot puro)*

**Arquivos:** `loot.js` → crafting, `data.js`

1. Drop vira **material por era** (não item inteiro).
2. **Eixo raridade:** upgrade com material + marco → define nº de afixos + a arte (assets prontos).
3. **Eixo nível da arma:** sobe com Gold/Lumin, **sem cap**; escala o valor dos afixos. Persiste
   até a Ascension.
4. **Afixos** em 3 famílias (Ofensa aditiva / Economia / Prime multiplicativo só no legendary).
5. Mapear as **15 armas SVG** como a escada visual (universal common→rare, era epic/legendary).

**Verificar:** upar raridade troca a arte certa por era; nível da arma engorda afixos; gold é consumido.

---

## Fase 5 — Combate (afinação do kill-time)

**Arquivos:** `data.js`, `game.js`

1. Calibrar o stat primário (ratio) pra **kill ~4-5s no ponto equilibrado** (poder = nível do mob).
2. O espectro (rápido re-limpando / lento no muro) emerge sozinho da distância poder×nível.
3. **Muro (D5):** quando kill-time passa de ~2,5× a âncora → flag "Rebirth recomendado".

**Verificar:** mob no nível ~4-5s; muito abaixo ~1-2s; perto do muro ~10s+ dispara a flag.

---

## Fase 6 — UI  *(skin em cima da mecânica)*

**Arquivos:** `index.html`, `render.js`, `ui.js`, `css/*`

1. **World Map** — duas visões (5 hexágonos de era → trilha de nós com gatekeeper).
2. **Prestígio** — duas abas (Rebirth / Ascension), no estilo do mock que aprovamos.
3. **Combate** — fundo cobrindo a arena, herói e mobs sobre ele (sem painel opaco), log no rodapé.
4. **Tela de upgrade** de equipamento (arma transformando cinza→legendary).
5. **Chefe** com moldura ornamentada por cor de era; **XP por kill** visível; nível discreto no mob.
6. **Renome de moedas na UI:** Gold→**Lumin**, Shards→**Éclats**, Artifacts→**Vestiges**,
   Gold Stats→**Channeling**, título→**Éclats of Lumière** (tarefa antiga, fechar aqui).

**Verificar:** screenshots de cada tela; navegação mundo↔região↔combate; labels novos.

---

## Fase 7 — Migração de save

**Arquivos:** `migrate.js`

- **Reset total** (D7) — não há players; bump de versão zera o save antigo com segurança.

**Verificar:** save antigo carrega → detecta versão → zera limpo, sem crash.

---

## Fase 8 — Balanceamento (Claude Code)

- Com a mecânica pronta, o CC roda o sim e mira os alvos: kill-time ~4-5s no ponto, ~2 semanas
  até o Pinnacle, requisito de nível alcançável **antes** do muro, spikes cobrindo o salto de era.
- Re-sincronizar os arquivos de teste (`game.test.js`, `verify-*.js`) com a mecânica nova.

---

## Adiado

- **D6 — World Tier (endgame):** não bloqueia nada. Quando voltar, mirar um endgame que
  **adiciona algo novo**, não só "reset por multiplicador".

---

## Ordem resumida

`Fase 0 (prep) → 1 (nível) → 2 (Rebirth) → 3 (Ascension) → 4 (equipamento) → 5 (combate) →
6 (UI) → 7 (migração) → 8 (balance + testes)`

Cada fase: implementa → smoke test → commit. Build roda do começo ao fim.
