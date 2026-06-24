# PASSIVES V1 — Desenho das Passivas (Continente 1)

> **Desenho canônico** das passivas do **Continente 1** (primeiro tier). Substitui a
> estrutura "larga em nomes, estreita em mecânica" auditada em `PASSIVES_AUDIT.md`.
> Ligado ao `CANON_V2.md`. Números (valores por nível) ficam para a fase de
> balanceamento — aqui se define **papel** e **identidade** de cada nó.

## Princípios
- **15 nós no Continente 1** — **5 por árvore** (Éclat / Vestige / Fracture).
- **Cada nó é distinto** dentro da sua árvore (sem clones).
- **Primeiro tier simples** — efeitos claros; a complexidade cresce nos próximos
  continentes (cada continente abre +5 por árvore: "Grupo 2", "Grupo 3"…).
- **Nível máximo por nó:** 12 (mantém a profundidade via leveling, não via nº de nós).
- **Moeda:** **Vestiges** (gerados pela Convergence).
- **Destrava:** a árvore abre na **1ª Convergence** (Área 2 / nível 80 — ver CANON_V2 §7).
- As três árvores espelham a economia de 3 camadas: **Éclat → combate**,
  **Vestige → economia**, **Fracture → defesa/utilidade**.

---

## 🔴 Árvore ÉCLAT — Dano / Combate
| Nó | Papel | Status no código |
|---|---|---|
| **Radiant Strike** | +% dano (base, aditivo) | já existe |
| **Luminal Edge** | +crítico (chance/dano) | já existe (lever crit) |
| **Momentum** | +velocidade de ataque | já existe (movido p/ Éclat — lar natural) |
| **Shattered Light** | **motor**: ×dano composto por nível | já existe (engine) |
| **Execute** | **+dano contra Boss e Mini Boss** (condicional) | 🆕 novo |

## 🟡 Árvore VESTIGE — Economia
| Nó | Papel | Status no código |
|---|---|---|
| **Lumen's Blessing** | +% Lumens | já existe |
| **Remnant Harvest** | +% materiais dropados | já existe (lever material) |
| **Vestige Pull** | **+ganho de Vestiges da Convergence** (acelera as passivas) | 🆕 novo (preenche "Sistema") |
| **Eternal Vestige** | **motor**: ×Lumens composto por nível | já existe (engine) |
| **The Collector** | **+chance de Éclats** por kill | 🆕 novo (toca a meta-moeda) |

## 🔵 Árvore FRACTURE — A Quebra / Meta-progressão
> **Identidade (Decisão 10):** a árvore leva o nome do evento cósmico *La Fracture*.
> Seus nós são **fracos no início, mas escalam até serem os mais fortes** — efeitos
> de **longo prazo / meta-progressão** que crescem com profundidade, resets e
> composição. É uma aposta de longo prazo (vs. Éclat = poder imediato, Vestige =
> recursos).

| Nó | Papel | Caráter slow-burn | Status no código |
|---|---|---|---|
| **Last Light** | +% HP base | base humilde de sobrevivência | já existe |
| **Void Endurance** | **motor**: ×HP composto por nível | composto — ínfimo cedo, enorme depois | já existe (engine) |
| **Nihel's Shadow** | bônus de poder que **cresce com a profundidade** (áreas alcançadas) | fraco na Área 2, forte na Área 20 | 🆕 novo |
| **The Fracture's Gift** | bônus global que **cresce a cada Convergence feita** | acumula a cada reset | 🆕 novo |
| **Claimed Domination** | **multiplicador global** (amplifica dano **e** economia) | minúsculo no início, domina no fim | 🆕 novo |

> **Nota:** as utilidades de encontro (chance de Elite, limite de Mini Boss — nós
> "Weakened Void"/"Void Awareness") **saíram** da Fracture (não combinam com o papel
> meta). Reservadas para um tier/árvore futura. **Void Piercing** também fica fora do
> tier 1.

---

## Notas de implementação
- **Reaproveita o código existente** para os efeitos diretos (multiplicadores de
  árvore, engines, crit, atk speed, materiais, Lumens, HP).
- **Efeitos novos (6):** Execute (dano vs Boss/Mini Boss), Vestige Pull (+ganho de
  Vestiges), The Collector (+chance de Éclats), e os 3 metas da Fracture — Nihel's
  Shadow (escala com profundidade), The Fracture's Gift (escala com Convergences),
  Claimed Domination (multiplicador global de dano+economia).
- **Nós mortos do audit:** Weakened Void, Void Awareness e Void Piercing **ficam
  fora do tier 1** (reservados para tier/árvore futura).
- Mantém o gating atual (grupo abre quando o anterior está no nível 12); aqui o
  "próximo grupo" é o próximo continente.
- **Trinca de papéis:** Éclat = poder imediato · Vestige = recursos · Fracture =
  meta/longo prazo (fraca→mais forte).

> **Pendência de balanceamento:** definir valores por nível de cada nó (Fase 3).
