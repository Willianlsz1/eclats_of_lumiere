# Equipamento — Redesign

> Modelo de **equipamento fixo por era + upgrade** (não loot aleatório).
> Desenhado com o Willian. Substitui o ADR-0002 (loot puro / sem upgrade manual).
> Números são ponto de partida — o sim do Claude Code afina.

---

## A virada (vs. hoje)

- **Hoje:** loot aleatório — você acha itens, equipa o melhor, recicla o resto (ADR-0002).
- **Novo:** cada era tem um **equipamento fixo** (1 por slot). Os mobs dropam **materiais**
  (não itens inteiros). Você usa material + marcos pra **subir a raridade** da peça, e gold
  pra **subir o nível** dela.

---

## Os dois eixos

### Eixo 1 — Raridade (common → legendary)
- Sobe com **materiais daquele mapa + marcos** (ex.: chegar a tal nível, bater o gatekeeper).
- Define **quantos afixos** a peça tem (mais raridade = mais slots).
- Dirige o **visual** (as 5 artes por era — ver "Sinergia").

### Eixo 2 — Nível da arma (sem cap)
- Sobe gastando **Gold/Lumin** — infinito (o ralo permanente de Lumin).
- Escala o **valor** de cada afixo (`+X por nível`).
- Custo por nível sobe (polinomial) → grind sem fim, sem maxar de graça.

**Resumo:** raridade decide *quantos* afixos; nível decide o *tamanho* deles.

---

## Reset / persistência

- **Nível da arma:** persiste pelos Rebirths; **reseta só na Ascension** (com o gear).
  É um grind longo dentro da era — você despeja Lumin nele ao longo de vários Rebirths.
- **Raridade + peça:** mantida no Rebirth; **resetada na Ascension** (era nova = peça nova,
  começa no common, mas o piso de poder da era nova já supera o legendary da era velha).
- *Pendência:* nível-da-arma e Channeling são dois ralos de Gold — talvez fundir um dia.

---

## Afixos

### A regra de ouro
O **stat primário** da arma (ancorado no HP do mob via `ratio`) é a **espinha** — mantém o
kill-time ~constante. Os **afixos** são o **tempero por cima**: deixam matar mais rápido que o
baseline e empurrar mais fundo. Com afixos medianos = bate o tempo-alvo; com afixos ótimos =
supera e avança. **Afixos otimizam, não substituem a espinha.**

### Aditivo vs multiplicativo (o botão da explosão)
- **Aditivos** (`+X%`) somam entre si → crescimento controlado.
- **Multiplicativos** (`×`) se multiplicam → explodem os números (e quebram o balanço se exagerar).
- Regra: **a maioria é aditiva; só uns poucos raros (slot "Prime", só no legendary) são `×`.**

### As 3 famílias
| Família | Tipo | Afixos |
|---|---|---|
| **Ofensa** | aditivo | +Attack%, +Crit Rate, +Crit Dmg, +Atk Speed, +Boss Dmg |
| **Economia** | aditivo | +Gold, +XP, +Material find, +Essence |
| **Prime** | multiplicativo (raro) | ×Attack Multiplier — só no legendary, o "afixo dos sonhos" |

### Slots por raridade (ponto de partida)
| Raridade | Slots de afixo |
|---|---|
| Common | 1 |
| Uncommon | 2 |
| Rare | 3 |
| Epic | 4 |
| Legendary | 5 + 1 slot **Prime** |

---

## As 3 alavancas de balanceamento (pro sim)

1. **Quantos slots por raridade** (tabela acima).
2. **Quanto cada afixo cresce por nível** da arma.
3. **Curva de custo de Gold** do nível da arma.

Alvo: "kill-time com build **mediano** = o tempo-alvo de kill" (a decidir). Build ótimo supera; build fraco fica pra trás.

---

## Sinergia com os assets (já prontos)

As 15 armas que desenhamos **são** a escada de upgrade visual:
- common / uncommon / rare → as armas **universais** (cinza, verde, azul)
- epic / legendary → as armas **da era** (auroral-epic, auroral-legendary, …)

Upar no Auroral mostra, ao vivo: cinza → verde → azul → auroral-epic → auroral-legendary.
5 eras = 5 jornadas visuais completas, sem arte nova.

---

## Pendências

- Materiais: nomes e quantos tipos por era (ex.: "Cristal Bruto", "Bigorna", etc.).
- Quais marcos exatos destravam cada degrau de raridade.
- Se todos os 6 slots upam igual à arma (provável que sim).
- Possível tier **Mythic** acima de legendary, pro endgame/World Tier (onde o gear não reseta).
- Valores finais dos afixos (sim).
