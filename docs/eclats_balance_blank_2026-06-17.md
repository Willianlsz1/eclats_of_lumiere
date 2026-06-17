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
| `COMBAT.baseAPS` | **0,9** | ≈ Gaiadon (0,904); cresce até **~1,5 no fim** do Map 1 |
| `COMBAT.apsCap` | **10** | teto GLOBAL (Map 1 só chega a ~1,5; é o teto p/ mapas futuros) |
| `MAPS[0].hpLo` | **2.000** | 1º mob morre em **2 golpes** (ref. Gaiadon) = **~2,2s** |
| `COMBAT.playerBaseHp` | **30.000** | vida inicial "resistente" |
| `COMBAT.regenPerSec` | **0,01** (1%/s) | única regen base — segura o early |
| `COMBAT.regenOnKill` | **0** | ❌ removido do base (vira **passiva** no futuro — decisão Willian) |

**Resultado:** começa matando ~0,45 mob/s (2 hits ÷ 0,9 APS); APS sobe a ~1,5 no fim do Map 1
(amuleto +0,0019/nv + Despertar +0,3). O teto global 10 só importa nos mapas seguintes.

## 2. Economia por kill ✅ / 🔧
| Constante | Valor | Nota |
|---|---|---|
| `ECONOMY.goldRatio` | **0,10** | Lumens/kill = 10% da vida do mob (500 no 1º) |
| `ECONOMY.xpRatio` | **0,08** | XP/kill = 8% da vida do mob |
| `ECONOMY.lumensFloor` | **0** 🔧 | **sem piso** neste design (era 30.000) |
| `LEVEL.goldPerLevel` | **0** 🔧 | Lumens vêm só do mob; nível não dá Lumens base |

## 3. Gear — 6 peças, 2 afixos cada (flat + bônus%) ✅ / 🔧
**Modelo (decisão Willian 2026-06-17):** cada peça tem **2 afixos** (1 flat + 1 bônus%), e
**1 nível por peça** escala os dois. **Arquitetura de CAMADAS** (lição das telas do Gaiadon,
ver §9): *soma dentro da camada, multiplica entre camadas.* Por ora **2 camadas — Flat
(Primary) + Bonus% (Bonus)** — a camada **Multiplier ×** entra com o Hollow/raridades.

| Peça | Afixo 1 (flat) | Afixo 2 (%) |
|---|---|---|
| **Weapon** | Dano **+50**/nv | Dano **+1%**/nv |
| **Elmo** | HP **+300**/nv | HP **+1%**/nv |
| **Manto** | HP **+300**/nv | Crit Damage **+2%**/nv |
| **Luvas** | Crit Chance **+0,1%**/nv | Gold **+2%**/nv |
| **Amuleto** | Atk Speed **+0,0019**/nv | Dmg **+1%**/nv |
| **Anel** | Gold **+2%**/nv | XP **+1%**/nv |

**Agregado por nível** (as 6 peças): dano flat +50 · dano% +2% (weapon+amuleto) · HP flat
+600 (elmo+manto) · HP% +1% · crit chance +0,1% · crit dmg% +2% · APS +0,0019 · gold% +4%
(luvas+anel) · XP% +1%.

**Custo (por peça):** 1º nível **~2.000 Lumens**, **dobra a cada ~10 níveis** (ramp ≈ 1,072) 🔧
(hoje o código é linear; mudar p/ geométrico). No sim assumo as 6 peças no mesmo nível
(compra equilibrada → subir L→L+1 custa 6× o custo de 1 peça). Gear termina o Map 1 ~**nível 160**.

**Crit:** base **0%** de crit damage (decisão Willian — crit ≠ ×2 no início). Crit damage =
1 + Σ(crit dmg%): Manto +2%/nv + Despertar +200%. Crit chance: Luvas +0,1%/nv + Despertar +5%.

**Cap de nível — Faded = 200** (decisão Willian): folga curta sobre os ~184 que o jogador
atinge no Map 1. O cap é **teto**, não meta — o nível alcançado é limitado pela **renda × custo**,
não pelo cap (chegar ao 200 ≈ 1,9e11 Lumens; ao 750 ≈ 6,3e27 — inviável no Map 1).

> ⏳ **Raridade (Hollow):** além de multiplicar os afixos, **adiciona afixos novos** (camada ×
> e além) — Willian define os extras depois. Caps das raridades acima (Kindled+) idem.

## 4. Nível & XP (motor de stat base) ✅
| Constante | Valor | Decisão |
|---|---|---|
| `LEVEL.curveDiv` | **262** | nível-2 em ~9s |
| `LEVEL.curveExp` | **0,43** | Map 1 em **~1,3 dias** (validado: APS 0,9, 1º mob 2 hits, sem regen-kill) |
| `LEVEL.dmgPerLevel` | **150** | +dano por nível |
| `LEVEL.hpPerLevel` | **150** | +vida por nível |

> `level = (xpRun / 262) ^ 0,455`. Convergence reseta **só o `xpRun`** (nível da run).
> Sem bônus de XP na Convergence (o XP escalado vem do **Gear**, decisão do Willian).

## 5. Malha do Map 1 — 9 sub-áreas ✅ / 🔧
Vida geométrica do 1º mob (2.000) à Wall (~10M). Crescimento ~**2,07× por sub-área**.
Packs: **2 mobs** nas sub-áreas 1–7, **3 mobs** nas 8–9.

| Sub | Nome | Vida mob | Lumens/kill | Gate de nível 🔧 |
|---|---|---|---|---|
| 1 | Lanternroot Glade | 2.000 | 200 | 1 |
| 2 | Glimmercap Hollow | ~4.100 | 410 | 30 ← 1ª Convergence |
| 3 | The Lightfall Stair | ~8.600 | 860 | 70 |
| 4 | The Dreaming Gate | ~17.700 | 1.770 | 130 |
| 5 | The Verdant Deep | ~36.600 | 3.660 | 220 |
| 6 | The Gilded Mire | ~75.700 | 7.570 | 350 |
| 7 | The Hollowed Grove | ~156.500 | 15.650 | 520 ← **Despertar** |
| 8 | The Stillwatch | ~323.600 | 32.360 | 740 |
| 9 | The Hollow Heart | ~670.000 | 67.000 | 1.000+ ← **Wall (boss junto)** |

| Constante | Valor | Nota |
|---|---|---|
| `MAPS[0].hpHi` | **670.000** | escala "contida" (Wall ~10M) |
| `MAPS[0].bossHpMult` | **15** | Wall = 670k × 15 ≈ **10M** |
| `MAPS[0].bossDmgMult` | **3** | dano da Wall = 26.800 × 3 = 80.400 |
| dano dos mobs | **4% da vida** 🔧 | `dmgLo=80`, `dmgHi=26.800` (era 2%) |
| `packSizes` | **[2,2,2,2,2,2,2,3,3]** 🔧 | 2 mobs até a sub-7; **3** nas sub-8/9 (era curva 2→14) |
| Boss da sub-9 | **aparece junto com os mobs** 🔧 | sem `bossKillThreshold`; a Wall já está na sub-9 |
| Nível dos mobs | **sem cap** 🔧 | sub-9 = faixa aberta 1000+ (não fixa em 1000) |
| Gates de unlock | array acima 🔧 | hoje o código deriva por faixa geométrica 1→1000; trocar p/ esta tabela |

## 6. Convergence (1º prestígio) ✅ / 🔧
| Parâmetro | Valor | Nota |
|---|---|---|
| Libera | na **sub-área 2** | "cedo, como aperitivo" |
| Gatilho (1º LV) | **LV 40** | dispara na área 2 (entre 30 e 69) |
| Frequência | **frequente** (~13 no Map 1) | gatilho sobe ×**1,3** por convergência |
| Escada de LV | 40·52·68·88·114·149·193·251·326·424·551·717·932 | passa de 1.000 → libera a área 9/Wall |
| Bônus dano | **+15%** aditivo | 🔧 hoje `bonusPerConv` é um nº único |
| Bônus vida | **+15%** aditivo | 🔧 separar do dano |
| Bônus Lumens | **+3%** aditivo | 🔧 canal próprio |
| Bônus XP | **0%** | XP vem do Gear |
| `CONVERGENCE.gateLevelBase` | **40** | gatilho da 1ª Convergence |
| `CONVERGENCE.gateLevelGrowth` | **1,3** | cada conv exige um LV maior |

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
Com `curveExp=0,43 / curveDiv=96` (APS 0,9 · 1º mob 2 hits · sem regen-por-kill):
- **Nível 2:** ~8s ✅
- **1ª Convergence:** LV 40, ~27 min ✅ (cedo, sub-área 2)
- **Despertar (sub-7):** ~21,6h ✅ (pré-Wall)
- **Wall derrotada / Map 1 limpo:** ~**1,3 dias** (30,7h) ✅ ("médio")
- **Nº de Convergences:** 13 ✅ ("frequente", gatilho ×1,3)
- **APS no fim:** **1,50** ✅ (teto pedido p/ Map 1) · **Gear no fim:** ~160

## Sobrevivência = SÓ HP — VALIDADA (`fightWave` no sim) ✅
**Removido do jogo:** mitigação/armadura/Veil e o bloco `DEFENSE`. A vida é a única defesa.
**Regen-por-kill removido do base** (vira passiva futura) → só regen passivo 1%/s.
- `dano_recebido = dano_da_onda` (direto no HP; sem fórmula de razão/armadura).
- A peça **Veil of Cinders** deixa de ser "defesa" → vira **HP** (ou é repensada no Hollow).
- A Mémoire *de la Résistance* e a passiva *de sobrevivência* multiplicam **HP/regen**.

**Resultado da validação:** o jogador **sobrevive a 100% das ondas em todas as áreas**;
a única que arranha é a **Wall (96% de HP no pior momento)**. Map 1 é **passeio seguro
ponta a ponta** — a ameaça de morte real fica pros Maps 2+ / gating por Hollow. ✅

## Avançar de área = NÍVEL (LVs por área) ✅
Cada sub-área pede um nível maior do Seeker pra desbloquear. Tabela atual (ajustável):

| Área | LV p/ desbloquear | | Área | LV p/ desbloquear |
|---|---|---|---|---|
| 1 | 1 | | 6 | 350 |
| 2 | 30 ← Convergence libera | | 7 | 520 ← Despertar |
| 3 | 70 | | 8 | 740 |
| 4 | 130 | | 9 | 1.000 (Wall) |
| 5 | 220 | | | |

> **Gatilho da Convergence** = um LV escolhido (⏳ a decidir). Ela *libera* na área 2 (LV 30),
> mas dispara quando o nível da run atinge o gatilho; cresce ×1,3 a cada Convergence e reseta o
> nível da run. O gatilho precisa subir além de 1.000 p/ o jogador enfim alcançar a área 9 — é
> isso que produz as ~14 Convergences. Gatilho menor = mais Convergences; maior = menos.

---

## 9. Aprendizados do Gaiadon (referência, NÃO cópia) — 2026-06-17
Análise das telas do Gaiadon enviadas pelo Willian (ATTACK, XP, anéis, ATTACK SPEED).
**Pegamos o princípio, jogamos fora os números.**

### Motor de CAMADAS (a regra de ouro = Pecorella)
As colunas do Gaiadon (Primary · Bonus · Multiplier · Mastery · Apotheosis · Gemcraft ·
Soulcraft) são **camadas de cálculo**. As linhas (Equipment, Pets, Fame, Skills…) são as
**fontes**, cada uma despeja em uma ou mais camadas:
```
Total = Primary × (1+ΣBonus%) × (ΠMultiplier) × (1+ΣMastery%) × (1+ΣApotheosis%) × …
```
> **Soma DENTRO da camada, multiplica ENTRE camadas.** Somar = adicionar conteúdo infinito sem
> quebrar o balanço; multiplicar = a explosão idle. Subir de raridade **destrava afixos de
> camadas MAIS ALTAS** (Multiplier/Mastery) — por isso raridade nova é um salto, não um "+10%".

**Nossa pilha (enxuta, cresce com o jogo):**
| Camada | De onde vem (nosso jogo) | Quando |
|---|---|---|
| Flat (Primary) | afixo flat do Gear + Nível | Map 1 ✅ |
| Bonus % | afixo % do Gear | Map 1 ✅ |
| Multiplier × | afixos de raridade alta + Despertar + Ascension | Hollow / Despertar |
| Meta % (Mastery) | Mémoires / Passivas (knobs globais) | pós-Ascension |

### Attack Speed (tela "Capped at 15")
Gaiadon: base 0,95/s, **teto 15**, e *"values exceeding the cap → Attack Mastery a 1:100"*.
Ou seja: APS bruto pode ser enorme, mas trava no teto e o **excedente vira dano** (camada
Mastery). **Lição p/ nós:** o teto de APS (10) **não desperdiça** — passado o teto, velocidade
**vira dano** (já temos o gancho: passiva *Void Awareness*). APS é stat de 1 camada (flat),
contido de propósito, pois a economia é ancorada em "1 kill/ataque". ⏳ Calibrar fontes de APS
(amuleto + Despertar + passivas) rumo ao teto + a conversão overflow→dano numa fase própria.

## Pendências desta recalibração
- 🔧 **WIRING no código** (a estrutura atual difere do design): curva de custo do Gear
  (linear→geométrica), gates de sub-área (geométrico→tabela), Convergence (bônus único →
  dano/vida/Lumens separados; sem XP), Despertar (sub-3→sub-7 + crit/APS + sem skill), dano
  do mob (2%→4%), `lumensFloor`/`goldPerLevel`→0, **remoção do sistema `DEFENSE`/Veil**.
- ⏳ **Próximas fases de design (números):** Hollow + materiais (HP/Gear), Reliquats,
  Ascension (×mult por mapa), Mémoires (knobs globais), Passivas (alavancas), habilidades
  ativas, e o **pacing dos Maps 2–5** rumo aos ~30 dias.
