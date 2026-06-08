# 🗺️ Roadmap de Implementação — Éclats of Lumière

> Plano de evolução do protótipo atual (`gaiadon-clone`, tema "Gaiadon") para o jogo
> descrito em [DESIGN.md](./DESIGN.md). Fonte da verdade de *o quê* construir: DESIGN.md.
> Este arquivo define *a ordem* e *como*.

## Princípio estratégico

A **arquitetura atual é boa e sobrevive ao pivot** — dispatch de render (`render.js`),
dispatch de eventos (`events.js`), cadeia de migração (`migrate.js`) e a lógica pura
sem DOM (`game.js`/`progression.js`/`loot.js`/`zones.js`). O que muda é **conteúdo e
fórmulas**, não a estrutura.

→ **Evoluir em fases**, não recomeçar do zero. Cada fase deve manter o jogo jogável e
com testes passando (`node js/game.test.js`).

Legenda de esforço: `[S]` pequeno · `[M]` médio · `[L]` grande.

---

## Fase 0 — Fundação & Renomeação `[S]`

Trocar o vocabulário e travar as fórmulas resolvidas **antes** de construir em cima.

- Renames de domínio: Gold→**Lumens** · Shards→**Vestiges** · Region→**Map** · Zone→**Subárea** · enemy "The Vestiges"→**The Eidola**.
- Travar no `CONFIG` (`js/data.js`) as constantes resolvidas: `CRIT_OVERFLOW_TO_DMG` (1.0), spikes de Convergence (×1.5/5), escala de HP por mapa (~×1e12/mapa).
- Nova função em `MIGRATIONS` (`js/migrate.js`) para renomear campos do save.
- **Reusa:** `data.js` CONFIG · `migrate.js` · `fmt()`/`NUMBER_SUFFIXES`.
- **Done-when:** jogo roda idêntico, só renomeado; 37 testes passam (atualizados aos novos nomes).

## Fase 1 — Combate Core `[M]`

Reescrever o motor de combate conforme PARTE VI do DESIGN.

- **Crit camada-única + overflow→dano** em `loot.js:critExpectedMult`/`critMult` (§30).
- **Defesa logarítmica** (`1 − log10(def+1)/10`) + **HP Regen** (3 fontes) + **crit dos inimigos** em `game.js:tick`.
- **Attack Speed** `min(20, √atkSpeed × fator)`.
- Estender eventos de `tick` com **tier de crit** (normal/crit/radiant) p/ futuro visual de projétil — `events.js`.
- **Reusa:** `game.js:tick/playerDps/playerDamage` · `events.js` · `affixTotals`.
- **Done-when:** combate com defesa/regen/crit-overflow; testes de EV de crit e de redução de defesa.

## Fase 2 — Progressão: Convergence + Ascensão `[M]`

Separar os dois eixos de prestígio (§13-16).

- **Convergence** (rebirth frequente): mults por ponto (1.20/1.12/+5%) + **spike ×1.5 a cada 5** → reusa `tierSpikeMultiplier` (`progression.js:13`).
- **Ascensão** (completar mapa): Gear→material, desbloqueia próximo mapa + tier.
- Tiers **Seeker→Lumière** + 5 mapas com escala de HP por mapa.
- Sinal de "recomendado renascer" no plateau (UI).
- **Reusa:** `progression.js` quase inteiro (ascMultiplier, tiers, perLevelMult, offlineConfig).
- **Done-when:** loop de Convergence funcional + transição de mapa via boss final da Subárea 5.

## Fase 3 — Passivas (3 árvores, 45 nós) `[L]`

PARTE III do DESIGN.

- Economia de **Vestiges** (desbloquear/evoluir) + gate de kills + desbloqueio progressivo por mapa.
- 3 árvores: Éclat (combate) · Vestige (economia) · Fracture (utilidade).
- **Novo:** `js/passives.js` + dados em `data.js` + nova view (1 linha em `RENDER_DISPATCH`).
- **Substitui** o sistema Artifacts/Essence (que estava só desenhado, nunca ligado).
- **Done-when:** comprar/evoluir passivas; efeitos refletidos nas fórmulas de combate/economia.

## Fase 4 — Echoes `[L]`

PARTE IV do DESIGN.

- Stats permanentes via craft (materiais comuns + material de chefe), 5 raridades (Hollow→Sovereign), 3 categorias de stats.
- Sistema de **materiais/recipes** (PARTE VII).
- **Novo:** `js/echoes.js` + `js/materials.js` + view.
- **Done-when:** dropar materiais, craftar Echo via recipe, stats sempre ativos (não resetam).

## Fase 5 — Gear reformulado `[M]`

PARTE V do DESIGN.

- 6 peças nomeadas + afixos novos por peça (com **Gloves diversificada**), set por mapa, Gear→material na Ascensão.
- **Reusa:** `loot.js` inteiro (level/rarity/afixos já existem) — troca dados (`SLOTS`/`AFFIXES`/`RARITIES`) e regras de afixo Legendary.
- **Done-when:** evoluir gear, afixo Legendary exclusivo por peça, reset correto na Ascensão.

## Fase 6 — Mapas & Fracture's Trial `[M]`

PARTES VIII-IX do DESIGN.

- 5 mecânicas únicas de mapa (Dream Pulse, Luminis Echo, Ashen Memory, Fracture Surge, Nihel's Drain).
- Open-zone com chefe de **trigger oculto** (kills não visíveis) + chefe como loop de recompensa.
- **Fracture's Trial**: dificuldade voluntária, não-reseta — `HP×(1+t·0.5)`, `dano×(1+t·0.3)`, `reward×(1+t·0.4)`.
- **Depende de:** Fase 2.
- **Done-when:** cada mapa com sua mecânica; trial ajustável e persistente.

## Fase 7 — Conteúdo, Lore & Polish `[L, contínuo]`

- Assets novos (tema Éclats — substitui `ASSET-MANIFEST.md`, hoje obsoleto).
- Lore de subáreas, visuais de projétil, UI desktop, endgame após Nil Aeternum.
- Resolve os "pontos a definir" de DESIGN §11, §25, §40.

---

## Ordem de dependência

```
0 → 1 → 2   (tronco — sequencial, obrigatório primeiro)
        ├── 3  (Passivas)      ┐
        ├── 4  (Echoes)        ├─ paralelizáveis
        ├── 5  (Gear)          ┘
        └── 6  (Mapas/Trial — depende de 2)
7 (Polish) — contínuo, ao longo de tudo
```

## Mapa de renomeação (referência rápida da Fase 0)

| Atual (código "Gaiadon") | Novo (Éclats) |
|---|---|
| Gold | Lumens |
| Shards | Vestiges |
| Region / Difficulty / Wave | Map / Subárea / (open-zone) |
| Ascension (tiers) | Convergence (rebirth) + Ascensão (mapa) |
| Gold Stats | (revisar — provável fundir em Passivas/Echoes) |
| Artifacts / Essence | Passivas (3 árvores) + Echoes |
| Region Mastery | Mecânicas únicas por mapa |
| enemy "The Vestiges" | The Eidola |
