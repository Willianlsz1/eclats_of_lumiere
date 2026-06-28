# Éclats of Lumière — Rarity Find (chance de mob raro)

> Como o jogador aumenta a chance de aparecer mobs raros (Kindled/Luminous/Radiant). Decisão do dono (jun/2026).

## Princípio
- **Base = 0%.** Sem gear nem passiva, NENHUM raro spawna — só Common. A chance é construída do zero pelo jogador.
- **Gear ACHA** (sobe a chance) · **Passiva LEVANTA O TETO** (sobe o cap).
- Quanto mais luz a criatura carrega = mais rara = mais forte (a cor conta a história).

## Mecânica
Para cada tier T (Kindled, Luminous, Radiant):
```
chance_T = min( rarityFind_T (do gear) , cap_T )
cap_T    = capPassivo_T   (sobe de 0 até o máximo via passivas)
```
- **Gear** dá `rarityFind_T` (afixo "Rarity Find"). Sem gear → 0 (nada acha).
- **Passiva** dá `cap_T` (nó que destrava o teto). Sem passiva → cap 0 → 0% mesmo com gear.
- **Precisa dos dois:** passiva abre o teto, gear preenche. Máximo quando ambos no talo.

## Caps máximos (TRAVADOS)
| Tier | Base | **Cap máx** | Poder (~×common) |
|------|------|-------------|------------------|
| **Kindled** | 0% | **30%** | ~3× |
| **Luminous** | 0% | **15%** | ~6× |
| **Radiant** | 0% | **5%** | ~10× (+modificador) |

## Ordem de roll (combat `_buildOne`)
Do mais raro pro mais comum (o primeiro que acertar vence):
1. **Radiant** — `chance(min(rarityFind.radiant, 5%))`
2. **Luminous** — `chance(min(rarityFind.luminous, 15%))`
3. **Kindled** — `chance(min(rarityFind.kindled, 30%))`
4. senão **Common**

## Implementação (passos)
1. **data.js** — zerar as chances base atuais (`rareMobs.chance/plusChance`, `eliteMob.chance` → 0 como fonte); adicionar `rarityCaps: {kindled:30, luminous:15, radiant:5}`.
2. **state.js stats()** — expor `rarityFind: {kindled, luminous, radiant}` (soma dos afixos de gear) e `rarityCap: {...}` (soma das passivas, clampado nos máximos).
3. **combat.js `_buildOne`** — trocar o roll atual pela ordem acima usando `min(find, cap)`.
4. **Gear (data.js gearBase + gear.js)** — novo afixo **Rarity Find** (qual peça? quanto por nível?).
5. **Passivas (passives.js)** — nós que sobem `rarityCap` de cada tier (na árvore Vestige, que é economia/drop).
6. **UI** — mostrar a chance atual de cada tier em algum lugar (ficha? Forge?).

## Pendências
- Quanto cada afixo/nível de gear dá de Rarity Find (pra chegar nos caps com gear realista) → medir no sim.
- Quanto cada nó de passiva sobe o cap (quantos nós pra destravar o máximo).
- Em qual peça de gear vai o afixo Rarity Find (uma? várias?).
