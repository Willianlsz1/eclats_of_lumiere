# Éclats — Nova Direção de Design (sessão de grilling, 2026-06-14)

> Síntese legível das decisões desta sessão. Termos canônicos em `CONTEXT.md`;
> decisões arquiteturais em `docs/adr/`. **Nada aqui está calibrado** — o jogo será
> **recalibrado do zero** (ver ADR 0002). 🌱 = semente a pesquisar/fechar.

## O Caminho (spine) — ADR 0001
Sempre **pra frente**. O combate auto te empurra pelos 5 mapas. Em cada mapa você
atravessa **7-8 sub-áreas** (hoje 5) até o **boss final = Wall**, que fecha a passagem
pro mapa seguinte. Quando o HP da onda/boss passa do seu dano, você **travou** → vai
farmar o **Hollow** daquele mapa pra ficar mais forte → quebra a Wall → segue.
**Sem reset de mapa, sem backtrack.**

## Combate — CLEAVE — ADR 0002
**Cada ataque atinge TODOS os mobs da tela.** Mob morre quando o dano ≥ HP dele. Forte =
limpa a onda num golpe; HP demais = Wall. (Substitui a velha regra "1 kill/ataque".)

## Os dois lados do loop
- **Mapa principal = renda IDLE** (passiva, offline): **Lumens** (nível do Gear),
  **Vestiges** (Passivas/Ascension), **drip de Éclats** (Mémoires).
- **Hollow = objetivo ATIVO**: instância de combate que você *entra* e luta por andares
  até o **nobre** (boss). Dropa **materiais** (raridade do Gear) + **1 Reliquat exclusivo**.
  1 Hollow por mapa (5 no total). O Gear precisa das **duas metades** → mapa e Hollow
  se alternam.

## Sistemas de poder (tudo "soma", e Ascension multiplica)
- **Nível (XP):** stat FLAT por nível (substitui os Gold Stats removidos) — ex.: +10
  dano/nível, +vida/nível, +3 Lumens/nível. 🌱 números.
- **Convergence (redesenhada):** gate por nível (1º ~40, sobe). Dá **+15% permanente**
  (dano/vida/XP/Lumens). Reseta **nível da run + NÍVEL do Gear** (a RARIDADE do Gear e a
  posição no mapa **nunca** resetam). 🌱 curva.
- **Ascension (por mapa):** vencer a Wall + Vestiges → próximo mapa + um **Gatekeeper**.
  **Multiplica** o acumulado de **Convergence** e de **Awaken** (ex.: Awaken +50% dano →
  Ascension ×10). Estrutura composta, sempre pra frente.
- **Awaken/Despertar (Guardião da Sub-3):** sobe o tier (T1→T5), dá **stat base** + **1
  habilidade ativa**. Multiplicado pela Ascension.

## Gear — duas camadas
- **6 peças-núcleo** (*o que você é*): **nível** (Lumens, do mapa) + **raridade**
  (materiais, do Hollow → Kindled→Converged, as 30 artes prontas). É o poder que quebra a Wall.
- **Reliquats** (2ª aba, *o que você venceu*): 1 por nobre/Hollow (brincos/colar/asas...).
  Híbrido: **bônus permanente pequeno + bônus local forte**. ≠ Mémoire.

## Habilidades ativas
**~5, uma por Despertar** (T1→T5). **Cooldown puro, manual** (auto-cast vem depois, via
Gatekeeper). Sem loadout, sem árvore. 🌱 **efeitos a pesquisar** (sementes: slow de atk
speed; DoT por % da vida; direção = 5 papéis: burst/DPS/farm/defesa/ult).

## Gatekeepers (recompensa = automação/QoL + ×poder)
- **A1 — O Ritmo:** Convergence deixa de resetar os níveis do Gear. ✅
- **A2-A5:** 🌱 a redefinir (partida: A2 dificuldades, A3 Echo, A4 +mobs, A5 Transcendência).

## Passivas — camada de ALAVANCAS (Vestiges) — esqueleto das 3 árvores
Não +dano% genérico (evita redundância com Nível/Convergence). 3 árvores × 15 nós; as
**exóticas/sinergias** moram nos nós profundos (grupo 3 / capstone). 🌱 lista fina a fechar.

- **ÉCLAT — combate ativo:** Crit Chance · Crit Damage · APS · **Redução de Cooldown**
  das habilidades · **Potência das habilidades** (+% efeito) · **Dano-em-Boss** (quebra
  Wall) · **Execute** (mata mob abaixo de X% HP — com cleave, ceifa ondas). *Capstone:*
  cada crit amplifica o próximo.
- **VESTIGE — farm/economia:** +Materiais no Hollow · **+Chance de Reliquat** ·
  **Lumens × tempo de jogo** (cresce com playtime) · +XP · **Echo melhorado** · taxa/cap
  de Offline. *Capstone:* quanto mais Reliquats coletados, +X.
- **FRACTURE — sobrevivência/Void:** Defesa/Mitigação · Regen · **Dano = % da vida máx**
  (vida vira ataque) · **Lifesteal** (cura no kill) · Escudo/Revive · Resistência ao Void
  (Hollows). *Capstone:* redução de dano % depois da armadura (Nihel's Shadow).
- **Exóticas/sinergia (nós profundos):** **+% aos stats do Gear** · "quanto mais fundo no
  mapa, +X" · "cada Reliquat equipado aumenta Y" · bônus que crescem com o tempo.

### Reconciliação das 45 (as do GDD §7 já existem; o redesign reparou algumas)
Aprovado tree-by-tree em 2026-06-14. **As 45 nomeadas+calibradas do GDD §7 ficam**, com reparos:
- **ÉCLAT (4 reparos):** *Refraction* = crit dobra no alvo de **maior HP** (era ricochete) ·
  *Shard Burst* = golpe periódico de **dano por % vida máx** (anti-tank) · *Overkill* =
  excedente vai pro **mob de maior HP** (anti-boss) · *Luminal Explosion* = **pulso
  periódico de dano massivo**. (Cleave tornou os antigos "espalhar/transbordar" redundantes;
  some o "kill paga ~50%".)
- **VESTIGE (1 refino):** *Beast Caller* = fortalece o **Echo (Gatekeeper A3)**.
- **Offline (regra global + 2 passivas):** **eficiência ≤ ~50% do ativo (teto 60%)**;
  **tempo acumula 8h inicial → 24h máx**. *Dreamwalker* = **eficiência** (rumo a 50%);
  *Nil's Embrace* = **teto de tempo** (8h→24h).
- **FRACTURE (4 reparos):** *Void Awareness* = **overflow de APS** (APS acima do cap vira
  dano bônus; par da Fracture Pulse; espelho do Momentum/crit) · *Éclat Attunement* =
  **+% ao bônus da Convergence** (era "+pontos") · *The Fracture's Gift* = **níveis grátis
  de Gear que sobrevivem ao reset da Convergence** (era "Gold Stats grátis") · *Nil's
  Embrace* = **teto de tempo do offline** (8h→24h).

> **As 45 estão fechadas (efeitos).** Posicionamento (grupos 1/2/3) e maxLevel/custos do GDD
> §7 seguem válidos; os NÚMEROS finos entram na recalibração geral.

## Mémoires — modelo "Artifacts" (TT2)
Direção: Mémoires viram algo como os **Artifacts do Tap Titans 2** — **15 bônus fortes e
diversos** (game-changers), upáveis com **Éclats**. **Sem escassez dolorosa**: dá pra
maximizar todos com o tempo (coleção, "soma tudo" — não é a camada de escolha de build).
Efeitos **diversos** (multiplicadores grandes + mudanças de mecânica), não "15× o mesmo
dano%"; a Clarté vira só **uma** delas (ou espinha leve). 🌱 **Os 15 efeitos serão
desenhados 1 a 1 com o Willian** (refs: TT2 Artifacts — wiki + tier list).
Refs: https://tap-titans-2.fandom.com/wiki/Artifacts · tier list r/TapTitans2.

## Removidos / Aposentados
- **Gold Stats** (tarefa repetitiva) → Nível assume o stat base.
- **Reset/backtrack da Convergence** (não o sistema — a Convergence ficou, sem o reset de mapa).
- **Regra "1 kill/ataque"** → cleave.

## Pendências grandes (próximas sessões)
1. **Efeitos das 5 habilidades** (pesquisa de refs — TT2/Grand Chase).
2. **Os 15 efeitos das Mémoires** — desenhar **1 a 1 com o Willian** (refs TT2 Artifacts).
3. **Passivas-alavanca** — fechar a lista fina dos 45 nós (esqueleto ✅).
4. **Pacing pra ~30 dias** (números: sub-áreas 7-8, ritmo Walls/Hollows/Convergences).
5. **RECALIBRAÇÃO GERAL** (o cleave invalidou a calibração antiga — pass próprio).

✅ **Já feito nesta sessão:** spine (ADR 0001), cleave (ADR 0002), economia/Hollows/Gear-2-camadas,
Nível/Convergence/Ascension, fonte+fuel das habilidades, **Gatekeepers A1-A5**, papel das
passivas (esqueleto), direção das Mémoires, e avisos de redesign no CLAUDE.md/GDD/ESTADO.
