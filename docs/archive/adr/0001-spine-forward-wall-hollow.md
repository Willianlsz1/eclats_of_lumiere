# Progressão forward-only: Wall → Hollow → Gear (sem prestige-reset)

O spine do Éclats passa a ser **sempre pra frente**: o combate automático empurra o
jogador pelos 5 mapas até bater numa **Wall** (um check de poder que o farm normal não
vence). Para quebrar a Wall, o jogador **mergulha num Hollow** (dungeon repetível,
território de um nobre da corte do Nada — já canônico na lore) e farma **gear/materiais**
até ficar forte o bastante para seguir. Decidido com Willian em 2026-06-14, inspirado no
loop de Grand Chase (área difícil → dungeons por equipamento melhor → avança).

O **mapa principal é a renda idle** (passiva, offline); o **Hollow é o objetivo ativo**
(a decisão deliberada de entrar e farmar).

## Considered options
- **Convergence com reset/backtrack ao início do mapa** (o sistema atual): **rejeitado** —
  Willian achou o backtracking ruim ("prefiro sempre em frente e enfrentar uma wall").
  **A Convergence NÃO foi removida** — foi **redesenhada** (revisão 2026-06-14): vira um
  prestige que **nunca reseta a posição no mapa**, gated por nível (1º ~40), dando
  **+15% permanente a dano/vida/XP/Lumens**; a **Ascension multiplica** o acumulado.
  Só o **reset-para-o-início** foi cortado, não o sistema.
- **Gold Stats** (compra manual de str/vit/... com Lumens): **removido** — "ação
  repetitiva demais". A dial base de dano/HP migra para a Convergence redesenhada.

## Consequences (a resolver em decisões seguintes)
- A nova estrutura de poder é **composta**: Awaken×Ascension e Convergence×Ascension.
  O antigo `conv_factor` aninhado é recuperado em espírito, sem o backtrack.
- O **gatilho que destravava as Passivas** era a 1ª Convergence → ainda vale? (a Convergence
  voltou, então talvez sim) — a confirmar.
- Lumens passa a alimentar **nível do Gear** (Gold Stats saíram).
- A **Wall = boss final do mapa** vira o principal pacing (sub-áreas 5→7-8 por mapa).
- **Hollows** viram **sistema jogável** (instância de combate; 1 por mapa; materiais +
  Reliquat exclusivo): ver `CONTEXT.md`.
