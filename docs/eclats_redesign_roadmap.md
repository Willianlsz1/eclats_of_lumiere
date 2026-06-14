# Éclats — Roadmap de Reimplementação (redesign 2026-06-14)

> Plano de execução do redesign. **Design fechado** (ver `eclats_redesign_2026-06-14.md`
> + `CONTEXT.md` + ADRs 0001/0002). **Método (decidido 2026-06-14):** reconstruir em **CPs
> pequenos**, e em cada um **travar os números com o simulador** (`tools/sim/`, hoje
> modelando o jogo ANTIGO — será reescrito por camada). Ordem = dependência; o
> **combate-cleave ancora tudo** e vem primeiro. Implementar APENAS o CP pedido (a
> disciplina de fases do `CLAUDE.md` continua valendo).

## Camadas de calibração (sim) e a que CP pertencem
1. Núcleo de combate (cleave) → CP-1 · 2. Malha HP/dano → CP-2 · 3. Orçamento de poder →
CP-3+ · 4. Magnitudes por sistema → CP-3..CP-10 · 5. Economia/custos → CP-4..CP-10 ·
6. Pacing 30d → CP-12 · 7. Sobrevivência → CP-12.

## Os 12 CPs

### Fundação
- **CP-1 · Combate CLEAVE + economia.** Reescreve `combat.js`: cada ataque atinge TODOS
  os mobs; mob morre quando dano acumulado ≥ HP. Re-ancora renda/kill (cai a regra "1
  kill/ataque"). *Sim Camada 1.* **É a base — tudo depende daqui.**
- **CP-2 · Malha + mapas.** 5 mapas com **7-8 sub-áreas** (hoje 5); boss final = **Wall**
  pro próximo mapa; **avanço player-driven** (mapa farma na posição; jogador decide
  empurrar). *Sim Camada 2.*

### Progressão base
- **CP-3 · Nível + Convergence.** Remove **Gold Stats**; **Nível** = stat base flat
  (+dano/+vida/+gold por nível); **Convergence** redesenhada (+15% perm, gate por nível,
  reseta nível-da-run + nível-do-gear, NÃO mapa nem raridade). *Sim Camadas 3/4.*
- **CP-4 · Gear (nível/Lumens) + Forge.** As 6 peças sobem de nível com Lumens.
- **CP-5 · Hollows + Materiais + raridade.** Instância de combate (andares escalando →
  nobre no final; dificuldade Normal/Nightmare/Tormento = eixo infinito); materiais →
  sobem **raridade** do gear; o loop **Wall→Hollow**. Divisão: mapa=moedas, Hollow=materiais.
- **CP-6 · Reliquats.** 2ª aba do Gear; 1 por nobre/Hollow; híbrido (bônus pequeno
  permanente + forte local).

### Marcos / meta
- **CP-7 · Ascension + Gatekeepers.** Marco por mapa (vence Wall + Vestiges → próximo mapa);
  **multiplica Convergence + Awaken**; os 5 **Gatekeepers** (A1 sem-reset-gear+auto-conv ·
  A2 dificuldades · A3 Echo · A4 +mobs+auto-cast · A5 portal Endgame).
- **CP-8 · Awaken + 4 habilidades.** Despertar (tiers T1→T5, no Guardião da Sub-3) +
  **4 habilidades ativas** (Surto/Torpor/Maré Dourada/Égide, cooldown).
- **CP-9 · Passivas (45).** 3 árvores reconciliadas (Vestiges) — efeitos já fechados.
- **CP-10 · Mémoires (15).** Knobs globais/meta (Éclats) — efeitos já fechados.

### Acabamento
- **CP-11 · Offline + Echo.** Offline eficiência ≤50% (teto 60%), tempo 8h→24h
  (Dreamwalker/Nil's Embrace); Echo (Gatekeeper A3) farm paralelo.
- **CP-12 · Pacing 30d + survival + recalibração final.** Sims 3-7; afina o casual pra
  ~30 dias; ajuste global.

## Convenções
- Cada CP: módulo focado, comentários PT, save versionado, commit pequeno, e **sim que
  trava os números** antes de fechar. Atualizar `ESTADO_DO_JOGO.md` conforme o código
  novo for entrando (substituindo o estado antigo).
