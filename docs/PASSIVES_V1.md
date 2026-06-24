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

## 🔵 Árvore FRACTURE — Defesa / Utilidade
| Nó | Papel | Status no código |
|---|---|---|
| **Last Light** | +% HP | já existe |
| **Void Endurance** | **motor**: ×HP composto por nível | já existe (engine) |
| **Nihel's Shadow** | **regeneração de HP** (sustain) | 🆕 novo |
| **Weakened Void** | **+chance de Elite** (mais elites = mais loot) | código já suporta (`eliteChance`) — revive nó morto |
| **Void Awareness** | **reduz o limite do Mini Boss** (aparecem mais cedo) | código já suporta (`miniBossThreshold`) — revive nó morto |

---

## Notas de implementação
- **Reaproveita o código existente** para 11 dos 15 nós (multiplicadores de árvore,
  engines, crit, atk speed, materiais, `eliteChance`, `miniBossThreshold`).
- **Apenas 4 efeitos novos:** Execute (dano condicional vs Boss/Mini Boss),
  Vestige Pull (+ganho de Vestiges), The Collector (+chance de Éclats), Nihel's
  Shadow (regen de HP).
- **Resolve 2 dos 3 nós mortos** do audit (Weakened Void, Void Awareness). O 3º
  (Void Piercing) **sai** do tier do Continente 1 (penetração fica p/ continente futuro).
- Mantém o gating atual (grupo abre quando o anterior está no nível 12); aqui o
  "próximo grupo" é o próximo continente.

> **Pendência de balanceamento:** definir valores por nível de cada nó (Fase 3).
