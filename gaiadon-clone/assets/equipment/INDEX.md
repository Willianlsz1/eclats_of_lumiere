# Equipment — índice de assets

6 slots: Weapon, Armor, Amulet, Ring, Gloves, Helmet.
A **arma** vive em `assets/weapons/`; os outros 5 slots ficam aqui.

## Plano atual (enxuto) — 1 ícone fixo por slot

Só a **arma** muda por mapa/raridade. Os outros 5 slots usam **um ícone único**
(PNG gerado por IA, fundo transparente), igual em toda raridade e em todo mapa.

```
equipment/
├── armor.png
├── amulet.png
├── ring.png
├── gloves.png
└── helmet.png
```

> Os SVGs do plano antigo (escada de raridade do armor + 50 peças por era) foram
> **removidos na limpeza**. Se voltar ao plano de sets temáticos por era, a gente regenera.
