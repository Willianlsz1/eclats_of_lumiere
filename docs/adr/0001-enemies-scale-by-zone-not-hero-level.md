# Inimigos escalam pela Zone, não pelo nível do Hero

**Status:** accepted

A força dos inimigos (Health, Damage, recompensas) é função da **Zone** — a
profundidade até onde o jogador empurrou — e **não** do nível do Hero. Escolhemos isso
porque o coração de um incremental é *sentir* que ficou mais forte: com escala por
Zone, subir de nível e equipar itens deixa as Zones já alcançadas triviais e permite
furar a próxima "Wall". A alternativa rejeitada — inimigos que escalam com o nível do
Hero — cria efeito "esteira" (você sobe, o inimigo sobe junto, e o progresso nunca é
sentido), o que mataria o pilar "números que explodem".

## Consequências

- O balanceamento vive numa curva única por Zone (em `CONFIG.enemy`), fácil de afinar.
- O nível do Hero e os itens são "alavancas de poder" do jogador contra uma dificuldade
  fixa por Zone — nunca um gatilho que aumenta a dificuldade.
- Reverter isso significaria repensar todo o loop de progressão e a sensação central do
  jogo; por isso está registrado aqui.
