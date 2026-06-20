# Éclats — Afixos & Drop de Equipamento (v1)

> Spec **travado** numa sessão de design (2026-06-20) com o Willian. Esta é a fonte
> da verdade da **anatomia das peças** e das **regras de drop**. Ainda **falta**:
> ranges de valor por afixo/área e a definição do Mapa 1 (níveis/força das áreas 1–9)
> — esse é o próximo bloco. NADA aqui foi implementado em código ainda.

## Inspirações (pesquisa da sessão)
- **Loop (1 player vs mobs, waves infinitas, área com nível/força próprios):** Gaiadon: Eternal Quest. Núcleo a gente já domina pelo `gaiadon-clone/` + RECOMEÇO 19/jun.
- **Equipamento (slots, raridade, afixo primário/secundário, drop por boss):** Tap Titans 2.
- **Rebirth:** TT2 Prestige (reseta a run, mantém o permanente; moeda de prestige ligada à profundidade) → nossa **Convergence**.
- **Modelo de drop adotado:** drop **por mob** (chance baixíssima), peça **escalada pela área**, **teto de raridade sobe por área** (ideia do Willian, mais coerente com waves infinitas que o baú-de-fim-de-dungeon do Grand Chase Classic).
- **Afixos:** consolidação ARPG/idle (TT2 + Diablo/PoE + NGU/Melvor): idle single-target colapsa em multiplicadores % + par de crit + atk speed (travado) + HP/Defesa/Regen + 3 "finds" de economia. Fora de escopo (sem skills/sem multi-alvo): AoE/cleave como afixo, cooldown, mana/recurso, movimento, resistências, proc-chance.

## Raridades (escada do jogo inteiro)

| Raridade  | Nº de afixos | Composição                | Onde aparece (Mapa 1) |
|-----------|:------------:|---------------------------|-----------------------|
| Common    | 1            | só primário               | áreas 1–9             |
| Uncommon  | 2            | primário + 1 secundário   | áreas 4–9             |
| Rare      | 3            | primário + 2 secundários  | áreas 8–9             |
| Epic      | 4            | primário + 3 secundários  | mapas futuros         |
| Legendary | 5            | primário + 4 secundários  | mapas futuros         |

- **Mapa 1 para em Rare.** Epic/Legendary só aparecem em mapas posteriores.
- Legendary "termina" em 5 afixos **por enquanto** (decisão pode mudar pós-jogo-base).

## Os 6 slots (primário fixo + pool de secundários)

| Slot      | Peça             | Primário (fixo) | Pool de secundários                              |
|-----------|------------------|-----------------|--------------------------------------------------|
| Arma      | The Waning Edge  | % Dano          | Crit Damage · Dano em Boss · Crit Chance · Atk Speed |
| Manoplas  | Grasp of the Unnamed | Crit Chance | Crit Damage · Atk Speed · % Dano · Dano em Boss   |
| Amuleto   | The Last Resonance | Atk Speed     | Crit Chance · % Dano · Regen · Dano em Boss       |
| Elmo      | The Silent Vigil | % HP            | Defesa · Regen · % Dano · Lumens                  |
| Manto     | Veil of Cinders  | Defesa          | % HP · Regen · XP · Materiais                     |
| Anel      | Band of Dusk     | Lumens          | XP · Materiais · % Dano · Regen                   |

Intenção de design: ofensivo concentrado em **Arma/Manoplas/Amuleto**; defesa em
**Elmo/Manto**; economia em **Anel/Manto**. Assim **o slot importa** (caçar a Arma boa
≠ caçar o Anel bom). Cada pool tem 4 opções → cobre até Legendary (4 secundários).

## Dicionário de afixos

**Ofensivos**
- **% Dano** — multiplicador de dano.
- **Crit Chance** — chance de crítico.
- **Crit Damage** — multiplicador do dano crítico.
- **Atk Speed** — ataques por segundo (era "APS"). ⚠️ mexe no teto de kills (ver regras).
- **Dano em Boss** — dano condicional, só contra boss (pode carregar número maior).

**Defensivos**
- **% HP** — HP máximo.
- **Defesa** — mitigação de dano recebido.
- **Regen** — HP recuperado por segundo.

**Economia**
- **Lumens** — ganho de Lumens (ouro) por kill.
- **XP** — ganho de XP por kill.
- **Materiais** — ganho/drop de material.

*(Reservado p/ futuro: **Penetração de Defesa** — pareia com a defesa dos inimigos.)*

## Regras de geração (travadas)
1. O afixo **primário** é sempre o da identidade do slot.
2. **Secundários** sorteados do pool do slot, **sem repetir**, em quantidade = raridade − 1.
3. Cada afixo rola um **valor aleatório dentro de um range escalado pela área** (peça boa vs. ruim na mesma área/raridade).
4. **Drop por mob, chance baixíssima.** Teto de raridade sobe por área: 1–3 = Common; 4–7 = +Uncommon; 8–9 = +Rare.
5. A peça vai pro **inventário**. Descartar → vira **material** (quantidade pequena, escalada pela raridade).
6. **Atk Speed** entra com **range mais apertado** que os outros (é o stat que aproxima/excede o teto de 1 kill por ataque).

## Mecânica relacionada (contexto, decidido na mesma sessão)
- Combate base = **single-target**. **Atk Speed acelera os ataques, mas cada ataque ainda é 1 alvo** → kill rate máx = Atk Speed.
- O teto "**1 kill por ataque**" só é furado por **cleave/AoE**, que é **unlock de passiva** (sem skills ativas no escopo atual). A árvore de **passivas é liberada pela Convergence** — lar natural do cleave (começa 1 alvo, sobe 2/3… no late, estilo Gaiadon).

## Próximo bloco (ainda aberto)
- Ranges de valor por afixo **por área** (incluindo o range apertado do Atk Speed).
- **Mapa 1**: níveis/força das áreas 1–9, gatilho da Convergence, taxa de drop concreta.
- Ciclo de vida da peça no inventário (equipar a melhor, descarte → material, quantidades).
