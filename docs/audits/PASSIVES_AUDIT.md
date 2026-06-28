# 🌳 Auditoria Estrutural das Passivas — Éclats of Lumière

Foco em **intenção e papel**, não em números. Fonte: `src/passives.js` (+ como
`state.js`/`combat.js` realmente consomem os efeitos).

---

## ⚠️ Achado central (leia primeiro)

O sistema tem **45 nós** (3 árvores × 15), mas mecanicamente existem só **4 tipos
de coisa**:

1. **Nós normais** (36 deles) — NÃO têm efeito individual. Cada um apenas soma um
   `%` ao **multiplicador da própria árvore**. O nome ("Execute", "Overkill",
   "Dreamwalker", "Last Light"…) é **puramente decorativo**. Dois nós normais da
   mesma árvore fazem **exatamente a mesma coisa**.
2. **Motores / engines** (9 deles, 3 por árvore) — também alimentam o
   multiplicador da árvore, mas de forma **multiplicativa** (composta), não
   aditiva. São os "grandes amplificadores".
3. **Alavancas funcionais** (3) — os únicos nós com efeito próprio de verdade:
   crit, attack speed e materiais.
4. **Alavancas mortas** (3) — têm chave declarada mas **nenhum código lê**.
   Comprá-las **não faz nada** (são uma armadilha de pontos).

Ou seja: o que define o papel de quase todo nó é **só a árvore em que ele está** +
se é normal/engine. A "variedade" sugerida pelos nomes não existe no motor.

### Para onde cada árvore aponta (em `state.js`)

| Árvore | `treeMult` aplicado em | Efeito real |
|---|---|---|
| **Éclat** | `atk.mult` (`dmgMult`) | só **dano** |
| **Vestige** | `lumensBonus.mult` + `xpBonus.mult` (`ecoMult`) | só **economia (Lumens & XP)** |
| **Fracture** | `hp.mult` (`hpMult`) | só **HP** |

### Regras comuns a todos os nós

- **Nível máximo:** `maxLevel = 12` (uniforme em todos os 45).
- **Custo de desbloqueio (nível 0→1):** `unlockLadder[posição] × groupMult[grupo]`
  - posição no grupo (0–4): `[100, 500, 2.500, 12.500, 62.500]`
  - multiplicador de grupo: G1 `×1` · G2 `×10` · G3 `×100`
- **Custo de evolução (nível n→n+1, n≥1):** `unlock × 0.3 × 1.3^(n−1)`
- **Gating:** um grupo só abre quando os 5 nós do grupo anterior estão no nível 12.
  A árvore inteira só destrava na **1ª Convergence**.
- **Moeda:** Pontos de Convergence.

> Nas tabelas abaixo, "Custo desbloqueio" é o do 1º nível (os 11 níveis seguintes
> seguem a fórmula de evolução acima). Tipo = `normal` / `engine` / `lever`.

---

## 🔴 Árvore ÉCLAT — "Combat · damage" → `atk.mult`

| # | Nome | Tipo | Custo desbloq. | Máx | Bônus concedido | Função real | Categoria |
|---|---|---|---|---|---|---|---|
| 0 | Radiant Strike | normal | 100 | 12 | +% dano (aditivo G1) | dano genérico | COMBATE |
| 1 | **Luminal Edge** | **lever:crit** | 500 | 12 | `+0.04×100` pts de **Crit** / nível | **crítico** (efeito real) | COMBATE |
| 2 | Éclat Surge | normal | 2.500 | 12 | +% dano (G1) | dano genérico | COMBATE |
| 3 | Refraction | normal | 12.500 | 12 | +% dano (G1) | dano genérico | COMBATE |
| 4 | Crit Cascade | normal | 62.500 | 12 | +% dano (G1) | dano genérico (nome promete crit, **não é crit**) | COMBATE |
| 5 | Shard Burst | normal | 1.000 | 12 | +% dano (G2) | dano genérico | COMBATE |
| 6 | Resonant Force | normal | 5.000 | 12 | +% dano (G2) | dano genérico | COMBATE |
| 7 | Momentum | normal | 25.000 | 12 | +% dano (G2) | dano genérico (nome promete atk speed, **não é**) | COMBATE |
| 8 | Fracture Weakness | normal | 125.000 | 12 | +% dano (G2) | dano genérico (nome promete dano vs boss, **não é**) | COMBATE |
| 9 | Execute | normal | 625.000 | 12 | +% dano (G2) | dano genérico (nome promete execução de HP baixo, **não é**) | COMBATE |
| 10 | Overkill | normal | 10.000 | 12 | +% dano (G3) | dano genérico | COMBATE |
| 11 | **Luminal Explosion** | **engine** | 50.000 | 12 | `×1.52^nível` dano | dano (amplificador composto) | COMBATE |
| 12 | **Or Ein Sof's Touch** | **engine** | 250.000 | 12 | `×1.52^nível` dano | dano (amplificador composto) | COMBATE |
| 13 | **Shattered Light** | **engine** | 1.250.000 | 12 | `×1.52^nível` dano | dano (amplificador composto) | COMBATE |
| 14 | **Void Piercing** | **lever:enemyPen** | 6.250.000 | 12 | `penPerLevel 0.04` — **não lido por ninguém** | ❌ **morto** (penetração não implementada) | COMBATE (intenção) |

**Resumo Éclat:** 15/15 nós = **dano**. Único efeito distinto = Luminal Edge
(crit). Void Piercing está morto. Todo o resto é o mesmo "+dano".

---

## 🟡 Árvore VESTIGE — "Economy · gains" → `lumensBonus.mult` + `xpBonus.mult`

| # | Nome | Tipo | Custo desbloq. | Máx | Bônus concedido | Função real | Categoria |
|---|---|---|---|---|---|---|---|
| 0 | Lumen's Blessing | normal | 100 | 12 | +% Lumens & XP (G1) | economia genérica | ECONOMIA |
| 1 | Wisdom of Ruins | normal | 500 | 12 | +% Lumens & XP (G1) | economia genérica (nome promete XP, é genérico) | ECONOMIA |
| 2 | Remnant Harvest | normal | 2.500 | 12 | +% Lumens & XP (G1) | economia genérica | ECONOMIA |
| 3 | Scavenger | normal | 12.500 | 12 | +% Lumens & XP (G1) | economia genérica (nome promete drops, **não há drop**) | ECONOMIA |
| 4 | Echo of Greed | normal | 62.500 | 12 | +% Lumens & XP (G1) | economia genérica | ECONOMIA |
| 5 | Awakened Harvest | normal | 1.000 | 12 | +% Lumens & XP (G2) | economia genérica | ECONOMIA |
| 6 | Hoarder | normal | 5.000 | 12 | +% Lumens & XP (G2) | economia genérica | ECONOMIA |
| 7 | Dreamwalker | normal | 25.000 | 12 | +% Lumens & XP (G2) | economia genérica (sem papel próprio) | ECONOMIA |
| 8 | Beast Caller | normal | 125.000 | 12 | +% Lumens & XP (G2) | economia genérica (nome promete spawn/mobs, **não é**) | ECONOMIA |
| 9 | **Vestige Pull** | **lever:material** | 625.000 | 12 | `1+log10(1+0.75×nível)` **materialsMult** | **materiais/Awaken Essence drop** (efeito real) | ECONOMIA |
| 10 | Void Scavenger | normal | 10.000 | 12 | +% Lumens & XP (G3) | economia genérica | ECONOMIA |
| 11 | **Eternal Vestige** | **engine** | 50.000 | 12 | `×1.52^nível` Lumens & XP | economia (amplificador composto) | ECONOMIA |
| 12 | **Fractured Soul** | **engine** | 250.000 | 12 | `×1.52^nível` Lumens & XP | economia (amplificador composto) | ECONOMIA |
| 13 | Luminal Cache | normal | 1.250.000 | 12 | +% Lumens & XP (G3) | economia genérica | ECONOMIA |
| 14 | **The Collector** | **engine** | 6.250.000 | 12 | `×1.52^nível` Lumens & XP | economia (amplificador composto) | ECONOMIA |

**Resumo Vestige:** 15/15 = **economia**. Único efeito distinto = Vestige Pull
(materiais). O resto é o mesmo "+Lumens & XP". Nota: XP hoje quase não importa
(level-up é linear e barato), então metade do valor da árvore é meio inerte.

---

## 🔵 Árvore FRACTURE — "Utility · HP" → `hp.mult`

| # | Nome | Tipo | Custo desbloq. | Máx | Bônus concedido | Função real | Categoria |
|---|---|---|---|---|---|---|---|
| 0 | **Fracture Pulse** | **lever:aps** | 100 | 12 | `1+0.46×nível` **atk speed** | **velocidade de ataque** (efeito real) | COMBATE |
| 1 | Void Haste | normal | 500 | 12 | +% HP (G1) | HP genérico (nome promete haste, **é HP**) | COMBATE |
| 2 | Fracture Sense | normal | 2.500 | 12 | +% HP (G1) | HP genérico | COMBATE |
| 3 | **Void Awareness** | **lever:mobCap** | 12.500 | 12 | `mobPerLevel 0.5` — **não lido por ninguém** | ❌ **morto** (mob cap não implementado) | UTILIDADE (intenção: spawn) |
| 4 | Last Light | normal | 62.500 | 12 | +% HP (G1) | HP genérico (nome promete "sobreviver com 1 HP", **não é**) | COMBATE |
| 5 | **Weakened Void** | **lever:enemyReduce** | 1.000 | 12 | `reducePerLevel 0.04` — **não lido por ninguém** | ❌ **morto** (redução de inimigo não implementada) | COMBATE (intenção) |
| 6 | Shard Disruption | normal | 5.000 | 12 | +% HP (G2) | HP genérico | COMBATE |
| 7 | Nihel's Shadow | normal | 25.000 | 12 | +% HP (G2) | HP genérico | COMBATE |
| 8 | Éclat Attunement | normal | 125.000 | 12 | +% HP (G2) | HP genérico (nome sugere sinergia com Éclat, **não há**) | COMBATE |
| 9 | The Fracture's Gift | normal | 625.000 | 12 | +% HP (G2) | HP genérico | COMBATE |
| 10 | **Void Collapse** | **engine** | 10.000 | 12 | `×1.52^nível` HP | HP (amplificador composto) | COMBATE |
| 11 | La Fracture's Echo | normal | 50.000 | 12 | +% HP (G3) | HP genérico | COMBATE |
| 12 | **Claimed Domination** | **engine** | 250.000 | 12 | `×1.52^nível` HP | HP (amplificador composto) | COMBATE |
| 13 | Nil's Embrace | normal | 1.250.000 | 12 | +% HP (G3) | HP genérico | COMBATE |
| 14 | **Void Endurance** | **engine** | 6.250.000 | 12 | `×1.52^nível` HP | HP (amplificador composto) | COMBATE |

**Resumo Fracture:** apesar do rótulo "Utility · HP", é **HP + 1 alavanca de atk
speed**. As 2 alavancas "utilitárias" (Void Awareness, Weakened Void) estão
**mortas**. Na prática a árvore é **defesa/sobrevivência (COMBATE)**.

---

# 📊 Classificação consolidada

Categoria atribuída pelo **efeito mecânico real** (cada nó em uma só categoria).

## 1. Contagem por categoria

| Categoria | Qtde | Nós |
|---|---|---|
| **COMBATE** | **29** | Éclat inteira (15) + Fracture exceto Void Awareness (14) |
| **ECONOMIA** | **15** | Vestige inteira |
| **GEAR** | **0** | — |
| **UTILIDADE** | **1** | Void Awareness (e mesmo esse está morto) |
| **SISTEMA** | **0** | — |
| **Total** | **45** | |

## 2. Categorias SUPER-representadas

- **COMBATE (29/45 ≈ 64%)** — esmagadoramente dominante. Considerando que toda a
  Éclat e quase toda a Fracture viram "dano" ou "HP", o sistema é, no fundo, **dois
  baldes de stat de combate**.
- Dentro de COMBATE, **dano puro** sozinho (Éclat) já é 15 nós — o maior bloco
  único.

## 3. Categorias SUB-representadas

- **GEAR (0)** — nenhuma passiva toca em upgrade, raridade, afixos ou progressão de
  equipamento. Buraco total, ainda mais grave porque o gear satura no cap e os 2ºs
  afixos estão dormentes (ver auditoria de balanceamento).
- **SISTEMA (0)** — nada interage com Convergence (ganho de pontos, custo, reset) ou
  Awaken. A meta-progressão não tem passivas que a alimentem.
- **UTILIDADE (1, morta)** — spawn/respawn/velocidade de progresso/desbloqueios não
  têm representação funcional. O único candidato (Void Awareness) não faz nada.
- **ECONOMIA (15)** — numericamente ok, mas **metade do valor é inerte**: o ramo
  multiplica Lumens **e** XP juntos, e XP hoje é trivial. Funciona quase só como
  "+Lumens".

## 4. Passivas redundantes

Praticamente todos os **nós normais** são redundantes entre si dentro da árvore —
têm efeito idêntico, mudando só o peso aditivo do grupo:

- **Éclat (10 normais idênticos):** Radiant Strike, Éclat Surge, Refraction, Crit
  Cascade, Shard Burst, Resonant Force, Momentum, Fracture Weakness, Execute,
  Overkill. Todos = "+dano".
- **Vestige (10 normais idênticos):** Lumen's Blessing, Wisdom of Ruins, Remnant
  Harvest, Scavenger, Echo of Greed, Awakened Harvest, Hoarder, Dreamwalker, Beast
  Caller, Void Scavenger, Luminal Cache. Todos = "+Lumens & XP".
- **Fracture (8 normais idênticos):** Void Haste, Fracture Sense, Last Light, Shard
  Disruption, Nihel's Shadow, Éclat Attunement, The Fracture's Gift, La Fracture's
  Echo, Nil's Embrace. Todos = "+HP".

Os **3 engines de cada árvore** também são redundantes entre si (mesma fórmula
`×1.52^nível`, mesmo alvo). São 3 cópias do mesmo amplificador por árvore.

## 5. Passivas que existem só para aumentar dano

Toda a **Éclat** funciona apenas para empurrar `atk.mult`:

- 10 normais (Radiant Strike → Overkill) + 3 engines (Luminal Explosion, Or Ein
  Sof's Touch, Shattered Light) = **13 nós que são literalmente "+dano"**.
- Luminal Edge (crit) também é, no fim, aumento de dano efetivo, só que via crit.
- Void Piercing pretendia ser dano (penetração), mas está morto.

→ **14 dos 15 nós da Éclat existem só para escalar dano**, sem nenhuma textura
mecânica distinta.

## 6. Passivas sem papel claro no jogo

**Mortas (compram e não fazem nada — bug/armadilha):**

- **Void Piercing** (Éclat) — lever `enemyPen`, nunca lido.
- **Void Awareness** (Fracture) — lever `mobCap`, nunca lido.
- **Weakened Void** (Fracture) — lever `enemyReduce`, nunca lido.

> As 3 estão **excluídas do `treeMult`** (porque são "levers") **e** sem
> implementação própria → contribuem **zero**. Gastar pontos nelas é perda pura.

**Papel ambíguo (nome promete mecânica que não existe):** Crit Cascade, Momentum,
Fracture Weakness, Execute, Overkill (Éclat); Scavenger, Dreamwalker, Beast Caller
(Vestige); Void Haste, Last Light, Éclat Attunement (Fracture). Mecanicamente são o
genérico da árvore; o "papel" prometido pelo nome é fantasma.

---

# 🗺️ Mapa de intenção vs. realidade (síntese)

| O que o sistema **aparenta** ter (pelos nomes) | O que o sistema **realmente** tem |
|---|---|
| Crit, execução, overkill, momentum, dano vs boss, penetração | **1 balde de "+dano"** (Éclat) + 1 alavanca de crit |
| XP, drops, materiais, "beast caller", "dreamwalker" | **1 balde de "+Lumens&XP"** (Vestige) + 1 alavanca de materiais |
| Utilidade, haste, sobrevivência, awareness, redução de inimigo | **1 balde de "+HP"** (Fracture) + 1 alavanca de atk speed + 2 alavancas mortas |
| 45 efeitos distintos | **6 efeitos reais**: dano, crit, economia, materiais, HP, atk speed (+ 9 engines que são 3 desses ×3, + 3 mortos) |

**Conclusão estrutural:** a árvore é **larga em nomes, estreita em mecânicas**. O
papel de um nó é determinado quase só pela árvore. As lacunas reais são **GEAR
(0)**, **SISTEMA (0)** e **UTILIDADE funcional (0)**; o excesso está em **COMBATE
(dano + HP)**. Há ainda **3 nós mortos** que deveriam ser implementados ou
removidos, e **~28 nós normais** que são clones internos de 3 efeitos.
