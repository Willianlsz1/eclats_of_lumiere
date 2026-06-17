# Éclats — Recalibração "em branco" do Map 1 (sessão com Willian, 2026-06-17)

> Primeira sessão da **recalibração geral** pedida pelo redesign 2026-06-14. Recomeçamos
> os números **do zero**, desenhando pela *experiência do jogador* (método Anthony Pecorella,
> "The Math of Idle Games") e validando o pacing no simulador `tools/sim/map1_blank.mjs`.
>
> Legenda: ✅ valor fechado por design + validado no sim · 🔧 precisa de WIRING no código
> (a estrutura atual difere do design) · ⏳ depende de fase futura (Hollow/Defesa).

---

## Princípio-guia (Pecorella)
**Renda por segundo ÷ custo do próximo upgrade = a "batida do coração".** Calibramos de
dentro pra fora: primeiro o loop de combate cru, depois a 1ª compra, depois os sistemas que
*multiplicam* essa base. Custo geométrico + ganho linear = paredes de progresso naturais.

Referências de gênero da pesquisa: **Gaiadon: Eternal Quest** (inspiração direta do combate de
ondas + Gear), **Melvor Idle / Clicker Heroes / Realm Grinder / TT2**, e a teoria do
**Anthony Pecorella** (GDC 2016 + série "The Math of Idle Games").

---

## 1. Núcleo de combate ✅
| Constante (`constants.js`) | Valor | Decisão de design |
|---|---|---|
| `COMBAT.baseDmg` | **1.000** | dano "gordo/impactante" no 1º golpe |
| `COMBAT.baseAPS` | **2,0** | ritmo "médio" (~2 golpes/s) |
| `COMBAT.apsCap` | **10** | teto "frenético" de kills/s |
| `MAPS[0].hpLo` | **5.000** | 1º mob morre em ~5 golpes = **~2,5s** |
| `COMBAT.playerBaseHp` | **30.000** | vida inicial "resistente" |
| `COMBAT.regenPerSec` | **0,01** (1%/s) | segura o dano do early sozinha |
| `COMBAT.regenOnKill` | **0,02** (2%/kill) | torna o early "passeio seguro" |

**Resultado:** começa matando ~0,4 mob/s → no talo 10/s (25× de espaço de progressão).

## 2. Economia por kill ✅ / 🔧
| Constante | Valor | Nota |
|---|---|---|
| `ECONOMY.goldRatio` | **0,10** | Lumens/kill = 10% da vida do mob (500 no 1º) |
| `ECONOMY.xpRatio` | **0,08** | XP/kill = 8% da vida do mob |
| `ECONOMY.lumensFloor` | **0** 🔧 | **sem piso** neste design (era 30.000) |
| `LEVEL.goldPerLevel` | **0** 🔧 | Lumens vêm só do mob; nível não dá Lumens base |

## 3. Gear — arma (1ª compra) ✅ / 🔧
| Parâmetro | Valor | Nota |
|---|---|---|
| Custo do 1º nível | **~2.000 Lumens** | ~4 kills ≈ **10s** até a 1ª compra |
| `GEAR.flatPerLevel.dmg` | **50** | +5% do dano base por nível (upgrade granular) |
| Curva de custo | **dobra a cada ~10 níveis** (ramp ≈ **1,072**) 🔧 | hoje o código é custo LINEAR; mudar p/ geométrico |

> Batida do coração: pra dobrar o dano (1.000→2.000) = 20 níveis de arma; o preço dobrando
> a cada 10 níveis cria a desaceleração que empurra o jogador a "ir mais fundo".

## 4. Nível & XP (motor de stat base) ✅
| Constante | Valor | Decisão |
|---|---|---|
| `LEVEL.curveDiv` | **262** | nível-2 em ~9s |
| `LEVEL.curveExp` | **0,455** | Map 1 em **~1,3 dias** (validado no sim, c/ Gear persistente) |
| `LEVEL.dmgPerLevel` | **150** | +dano por nível |
| `LEVEL.hpPerLevel` | **150** | +vida por nível |

> `level = (xpRun / 262) ^ 0,455`. Convergence reseta **só o `xpRun`** (nível da run).
> Sem bônus de XP na Convergence (o XP escalado vem do **Gear**, decisão do Willian).

## 5. Malha do Map 1 — 9 sub-áreas ✅ / 🔧
Vida geométrica do 1º mob (5.000) à Wall (~10M). Crescimento ~**1,84× por sub-área**.

| Sub | Nome | Vida mob | Lumens/kill | Gate de nível 🔧 |
|---|---|---|---|---|
| 1 | Lanternroot Glade | 5.000 | 500 | 1 |
| 2 | Glimmercap Hollow | ~9.000 | 900 | 30 ← 1ª Convergence |
| 3 | The Lightfall Stair | ~17.000 | 1.700 | 70 |
| 4 | The Dreaming Gate | ~31.000 | 3.100 | 130 |
| 5 | The Verdant Deep | ~58.000 | 5.800 | 220 |
| 6 | The Gilded Mire | ~107.000 | 10.700 | 350 |
| 7 | The Hollowed Grove | ~197.000 | 19.700 | 520 ← **Despertar** |
| 8 | The Stillwatch | ~363.000 | 36.300 | 740 |
| 9 | The Hollow Heart | ~670.000 | 67.000 | 1.000+ ← **Wall (boss junto)** |

| Constante | Valor | Nota |
|---|---|---|
| `MAPS[0].hpHi` | **670.000** | escala "contida" (Wall ~10M) |
| `MAPS[0].bossHpMult` | **15** | Wall = 670k × 15 ≈ **10M** |
| `MAPS[0].bossDmgMult` | **3** | dano da Wall = 26.800 × 3 = 80.400 |
| dano dos mobs | **4% da vida** 🔧 | `dmgLo=200`, `dmgHi=26.800` (era 2%) |
| `packSizes` | **[2,2,2,2,2,2,2,3,3]** 🔧 | 2 mobs até a sub-7; **3** nas sub-8/9 (era curva 2→14) |
| Boss da sub-9 | **aparece junto com os mobs** 🔧 | sem `bossKillThreshold`; a Wall já está na sub-9 |
| Nível dos mobs | **sem cap** 🔧 | sub-9 = faixa aberta 1000+ (não fixa em 1000) |
| Gates de unlock | array acima 🔧 | hoje o código deriva por faixa geométrica 1→1000; trocar p/ esta tabela |

## 6. Convergence (1º prestígio) ✅ / 🔧
| Parâmetro | Valor | Nota |
|---|---|---|
| 1ª Convergence | ao **entrar na sub-área 2** (nível 30) | "cedo, como aperitivo" |
| Frequência | **frequente** (~14 no Map 1) | gate ×**1,3** por convergência |
| Bônus dano | **+15%** aditivo | 🔧 hoje `bonusPerConv` é um nº único |
| Bônus vida | **+15%** aditivo | 🔧 separar do dano |
| Bônus Lumens | **+3%** aditivo | 🔧 canal próprio |
| Bônus XP | **0%** | XP vem do Gear |
| `CONVERGENCE.gateLevelBase` | **30** | = gate da sub-área 2 |
| `CONVERGENCE.gateLevelGrowth` | **1,3** | |

> Reseta: **só o `xpRun`** (nível da run). **NÃO reseta o nível do Gear** (correção Willian
> 2026-06-17 — o Gear é permanente; a arma acumula o mapa inteiro). Mantém: nível e raridade
> do Gear, posição no mapa, contagem de convergências. ~14 convs no Map 1 ⇒ ~+210% dano/vida.
> Por o Gear persistir, o jogador termina o Map 1 com a **arma no nível ~173** (cap do Faded ≥ ~175).

## 7. Despertar (sub-área 7) ✅ / 🔧
Revisado pelo Willian: **deixou de ser no Guardião da sub-3** e **não libera habilidade**.
É a "chave" pré-Wall — liga o crit e dobra o poder.

| Efeito | Valor | Nota |
|---|---|---|
| Local | **Guardião da sub-área 7** 🔧 | (era sub-3) |
| `DESPERTAR.mult` (dano + vida) | **×2** | |
| Crit Rate | **+5%** 🔧 | crit base do jogo = 0 até aqui |
| Crit Damage | **+200%** → crit vira **×4** 🔧 | base ×2 |
| Attack Speed | **+0,3** (APS 2,0→2,3) 🔧 | |
| Habilidade ativa | **nenhuma** 🔧 | (redesign previa 1 skill; removida) |

---

## Validação de pacing (`tools/sim/map1_blank.mjs`)
Com `curveExp=0,455 / curveDiv=262` (Gear persistente):
- **Nível 2:** ~9s ✅ (alvo ~8s)
- **1ª Convergence:** ~11 min ✅ (cedo, sub-área 2)
- **Despertar (sub-7):** ~18,7h ✅ (pré-Wall, ~metade do mapa)
- **Wall derrotada / Map 1 limpo:** ~**1,3 dias** (32h) de tempo-de-combate ✅ ("médio")
- **Nº de Convergences:** 14 ✅ ("frequente")
- **Nível final da arma:** ~173 (Gear persiste através das Convergences)

> ⚠️ O sim mede **renda/poder** (pacing), **não morte**. A Wall aqui é "parede de dano".
> A camada de **sobrevivência/Defesa (Veil)** depende do **Hollow + materiais** (fase futura)
> e será validada em `tools/sim/survival.mjs`. ⏳

---

## Pendências desta recalibração
- 🔧 **WIRING no código** (a estrutura atual difere do design): curva de custo do Gear
  (linear→geométrica), gates de sub-área (geométrico→tabela), Convergence (bônus único →
  dano/vida/Lumens separados; sem XP), Despertar (sub-3→sub-7 + crit/APS + sem skill), dano
  do mob (2%→4%), `lumensFloor`/`goldPerLevel`→0.
- ⏳ **Próximas fases de design (números):** Hollow + materiais + Defesa/Veil (sobrevivência),
  Reliquats, Ascension (×mult por mapa), Mémoires (knobs globais), Passivas (alavancas),
  habilidades ativas, e o **pacing dos Maps 2–5** rumo aos ~30 dias.
