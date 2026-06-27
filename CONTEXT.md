# Éclats of Lumière — Contexto

Glossário canônico dos termos de **design e balanceamento** do Mapa 1. Não é spec
nem lista de tarefas — só vocabulário. Em conflito de termos, este arquivo manda.
Visão e pilares completos: `docs/CONSTITUICAO.md`.

## Language

**The Loop** (o Loop):
O ciclo central de poder: lutar → bater na Wall → Convergence → comprar Passiva →
voltar mais forte. É o que precisa "sentir bom" para o jogo ser jogável.
_Avoid_: grind, ciclo de farm.

**The Wall** (a Parede):
Ponto deliberado onde o poder do jogador para de acompanhar a dificuldade e ele
precisa **evoluir** para seguir. É projetada de propósito — nunca um beco sem
saída. Sensação alvo: *"consigo avançar, mas preciso crescer de novo"*, nunca
*"estou travado"*.
_Avoid_: gate de dano, soft-cap.

**Playable Slice** (a Fatia Jogável):
O alvo do passe de balanceamento atual: o trecho inicial do Mapa 1 onde o Loop
completo é experimentável e tunado para ser divertido — do jogo novo até a
primeira Convergence + primeira Passiva, sentindo-se mais forte na run seguinte.
Não inclui sistemas ainda não construídos (promoção Uncommon, Mini Boss, Elite).
_Avoid_: MVP, demo.

**Convergence**:
Reset da run (nível, XP, Lumens, área) que concede **Pontos de Convergence**.
Desbloqueada por **nível** — o gate é **Lv 80**, não uma área. Não dá poder
direto: o poder vem das Passivas compradas com os Pontos.
_Avoid_: prestige (no chat tudo bem, mas o termo do jogo é Convergence).

**Convergence Point** (Ponto de Convergence):
Moeda concedida pela Convergence, gasta para desbloquear e subir nós de Passiva.
A primeira Convergence deve render Pontos suficientes para comprar **alguns nós +
1–2 níveis**, não só um único nó.

**Tier** (de Passiva):
Um grupo de 5 nós numa árvore de Passiva. Cada árvore tem 3 Tiers; maximizar um
Tier libera o próximo. A **Playable Slice usa só o Tier 1** (os 5 primeiros nós de
cada árvore); Tiers 2–3 ficam travados e serão desenhados depois. O alvo de
balanceamento é o **Tier 1 valer ~40% do poder** (gear ~60%).
_Avoid_: grupo, group, camada.

**Additive fades / Multiplier persists**:
Bônus aditivos (Primary/Bonus) são diluídos quando o gear cresce — o gear vence
essas colunas. Multiplicadores (×more) e o par de crit não diluem. Por isso o valor
que "segura" os ~40% das Passivas vem das partes multiplicativas (crit), não do flat.

**Increased vs More** (buckets de dano):
**Increased** = bônus % que somam num único balde e têm retorno decrescente
(mapa: camada `pct`). **More** = multiplicadores que se multiplicam entre si,
raros e fortes (mapa: camada `mult`). **Flat** = soma na base (camada `flat`).
Variedade num galho de dano vem de usar baldes diferentes, não repetir o mesmo.

**Spike node vs Throughput node**:
Throughput = ajuda em toda kill (dano/crit/atk speed comum). Spike = só dispara
em situações específicas (ex.: dano vs Boss/Elite/Rare). Spikes "quebram paredes";
não melhoram o farm de mob comum.

**TTK** (Time-To-Kill):
Tempo-alvo para matar cada tipo de inimigo, a régua de balanceamento de combate
(de `CONSTITUICAO.md`): Mob 1–3s · Elite 10–20s · Mini Boss 30–60s · Boss 1–3min.

**Power Curve / Difficulty Curve**:
Power Curve = quão forte o jogador fica (Gear + Passivas + Convergence + Awaken).
Difficulty Curve = quão forte o inimigo fica (HP e ATK do mob). Balancear é manter
as duas próximas, com Walls deliberadas.
