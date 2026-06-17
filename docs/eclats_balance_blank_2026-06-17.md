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
| `COMBAT.baseAPS` | **0,9** | ≈ Gaiadon (0,904); cresce até **~3 no fim** do Map 1 |
| `COMBAT.apsCap` | **10** | teto GLOBAL (Map 1 chega a ~3; folga p/ mapas futuros) |
| `MAPS[0].hpLo` | **2.000** | 1º mob morre em **2 golpes** (ref. Gaiadon) = **~2,2s** |
| `COMBAT.playerBaseHp` | **30.000** | vida inicial "resistente" |
| `COMBAT.regenPerSec` | **0,01** (1%/s) | única regen base — segura o early |
| `COMBAT.regenOnKill` | **0** | ❌ removido do base (vira **passiva** no futuro — decisão Willian) |

**Resultado:** começa matando ~0,45 mob/s (2 hits ÷ 0,9 APS); APS sobe a **~3 no fim** do Map 1
(amuleto +0,0065/nv × gear ~270 + Despertar +0,3). O teto global é 10 (folga p/ mapas futuros).

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
| **Amuleto** | Atk Speed **+0,0065**/nv | Dmg **+1%**/nv |
| **Anel** | Gold **+2%**/nv | XP **+1%**/nv |

**Agregado por nível** (as 6 peças): dano flat +50 · dano% +2% (weapon+amuleto) · HP flat
+600 (elmo+manto) · HP% +1% · crit chance +0,1% · crit dmg% +2% · APS +0,0065 · gold% +4%
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
| `LEVEL.curveDiv` | **77** | nível-2 em ~6s |
| `LEVEL.curveExp` | **0,38** | Map 1 ~**27h** de combate (re-fit p/ Wall 32,5bi + APS 3 + head-start) |
| `LEVEL.dmgPerLevel` | **150** | +dano por nível |
| `LEVEL.hpPerLevel` | **150** | +vida por nível |

> `level = (xpRun / 77) ^ 0,38`. Convergence reseta o `xpRun` para um **head-start** (não pro zero).
> Sem bônus de XP na Convergence (o XP escalado vem do **Gear**, decisão do Willian).

## 5. Malha do Map 1 — 9 sub-áreas ✅ / 🔧
Vida geométrica do 1º mob (2.000) à **Wall ~32,5 bi** (decisão Willian: números grandes/orgânicos,
casa dos bilhões). Crescimento ~**5,68× por sub-área**. Packs: **2 mobs** nas sub 1–7, **3** nas 8–9.

| Sub | Nome | Vida mob | Lumens/kill | Dano/mob | Gate de nível 🔧 |
|---|---|---|---|---|---|
| 1 | Lanternroot Glade | 2.000 | 200 | 80 | 1 |
| 2 | Glimmercap Hollow | ~11.400 | 1.140 | ~250 | 30 ← 1ª Convergence |
| 3 | The Lightfall Stair | ~64.500 | 6.450 | ~770 | 70 |
| 4 | The Dreaming Gate | ~366.500 | 36.650 | ~2.400 | 130 |
| 5 | The Verdant Deep | ~2,08M | 208k | ~7.500 | 220 |
| 6 | The Gilded Mire | ~11,8M | 1,18M | ~23k | 350 |
| 7 | The Hollowed Grove | ~67,2M | 6,72M | ~72k | 520 ← **Despertar** |
| 8 | The Stillwatch | ~381,6M | 38,2M | ~225k | 740 |
| 9 | The Hollow Heart | ~2,17bi | 217M | ~698k | 1.000+ ← **Wall** |

| Constante | Valor | Nota |
|---|---|---|
| `MAPS[0].hpHi` | **2.169.085.656** | número orgânico; Wall = ×15 ≈ **32,5 bi** |
| `MAPS[0].bossHpMult` | **15** | Wall = 2,17bi × 15 ≈ **32.536.284.840** |
| **dano dos mobs = CURVA PRÓPRIA** 🔧 | `dmgLo=80 → dmgHi=700.000` | **desacoplado da vida!** (geométrico ~3,11×/sub) |
| `bossDmgMult` | **3** | dano da Wall = 698k × 3 ≈ **2,1M/s** |
| `packSizes` | **[2,2,2,2,2,2,2,3,3]** 🔧 | 2 até a sub-7; **3** nas sub-8/9 |
| Boss da sub-9 | **aparece junto com os mobs** 🔧 | sem `bossKillThreshold` |
| Nível dos mobs | **sem cap** 🔧 | sub-9 = faixa aberta 1000+ |

> ⚠️ **Por que o dano é uma curva PRÓPRIA (não % da vida):** com a Wall a 32,5bi, a vida cresce
> **16 milhões×**, mas o HP do jogador só ~**150×**. Se o dano fosse % da vida, ele dispararia e
> daria one-shot. A curva de dano separada (`dmgLo→dmgHi`, bem mais suave) deixa o HP acompanhar.
> **Validado no Gaiadon** (ver §9): lá o ATK do mob é ~3,3% do HP do **jogador**, não da vida do mob.

## 6. Convergence (1º prestígio) ✅ / 🔧
| Parâmetro | Valor | Nota |
|---|---|---|
| Libera | na **sub-área 2** | "cedo, como aperitivo" |
| Gatilho (1º LV) | **LV 40** | dispara na área 2 (entre 30 e 69) |
| Frequência | **frequente** (~**23** no Map 1 c/ Wall 32,5bi) | gatilho sobe ×**1,3** por convergência |
| Escada de LV | 40·52·68·…·932·1211·… | sobe ×1,3; com a Wall maior, dispara muitas vezes na área 9 |
| Bônus dano | **+15%** aditivo | 🔧 hoje `bonusPerConv` é um nº único |
| Bônus vida | **+15%** aditivo | 🔧 separar do dano |
| Bônus Lumens | **+3%** aditivo | 🔧 canal próprio |
| Bônus XP | **0%** | XP vem do Gear |
| `CONVERGENCE.gateLevelBase` | **40** | gatilho da 1ª Convergence |
| `CONVERGENCE.gateLevelGrowth` | **1,3** | cada conv exige um LV maior |
| **Head-start** (`headstartFrac`) | **0,5** ✅ | reseta p/ **50% do nível atual**, não pro nível 1 |

> 🩹 **Head-start (decisão Willian, ref. Gaiadon):** ao convergir, o nível da run reseta para
> **0,5 × o nível em que você convergiu** (não pro 1). Como o gatilho cresce, o head-start cresce
> junto. **Conserta o death-loop** (nas áreas 4–8 o pior momento agora é nível 130–470, não 1 →
> todas sobrevivem) **e** corta a tediosidade de re-upar do zero. Validado no sim.

> Reseta: **só o `xpRun`** (nível da run). **NÃO reseta o Gear** (Gear é permanente; acumula o
> mapa inteiro). Mantém: Gear, posição no mapa, convergências. Com a Wall a 32,5bi, vencer exige
> ~**23 convs** (⇒ ~+345% dano/vida) — Willian aceitou mais ciclos. Gear termina ~**nível 270**
> (cap do Faded = **400**). APS chega a **~3** no fim (cap global 10).

## 7. Despertar (sub-área 7) ✅ / 🔧
Revisado pelo Willian: **deixou de ser no Guardião da sub-3** e **não libera habilidade**.
É a "chave" pré-Wall — liga o crit e dobra o poder.

| Efeito | Valor | Nota |
|---|---|---|
| Local | **Guardião da sub-área 7** 🔧 | (era sub-3) |
| `DESPERTAR.mult` (dano + vida) | **×2** | |
| Crit Rate | **+5%** 🔧 | crit base do jogo = 0 até aqui |
| Crit Damage | **+200%** → crit vira **×4** 🔧 | base ×2 |
| Attack Speed | **+0,3** 🔧 | parte do caminho do APS rumo a ~3 |
| Habilidade ativa | **nenhuma** 🔧 | (redesign previa 1 skill; removida) |

---

## Validação de pacing (`tools/sim/map1_blank.mjs`)
Com `curveExp=0,38 / curveDiv=77` (APS 0,9→~3 · 1º mob 2 hits · sem regen-kill · Wall 32,5bi · head-start 0,5):
- **Nível 2:** ~6s ✅
- **1ª Convergence:** LV 40, ~53 min ✅ (cedo, sub-área 2)
- **Despertar (sub-7):** ~6,4h ✅ (pré-Wall)
- **Wall / Map 1 limpo:** ~**27h de combate** (~1,1 dia perfeito; ~5–9 dias reais c/ offline) ✅
- **Nº de Convergences:** ~**22** (Willian aceitou mais ciclos p/ a Wall grande)
- **APS no fim:** **~3,03** ✅ · **Gear no fim:** ~282 (cap 400)

## Sobrevivência = SÓ HP — perigo "C" VALIDADO (`fightWave`) ✅
**Removido:** mitigação/armadura/Veil + bloco `DEFENSE`. **Regen-por-kill removido** (vira passiva).
A vida é a única defesa; `dano_recebido = dano_da_onda` direto no HP.

**Resultado (perigo "C" = a Wall pode matar), com head-start 0,5:**
- Áreas 1–7: seguras (98–100% HP no pior momento).
- Área 8: aperta (87%).
- **Área 9 / Wall:** chegando **sub-preparado → MORRE** (o perigo real, prenuncia o Hollow);
  no **poder pleno → sobrevive a ~30%** (tenso-mas-vencível). `dmgHi=700k`, boss ~2,1M/s.
- Morte = recua 1 sub-área + HP cheio (sem perdas) → regroup.

> ✅ **Death-loop das áreas intermediárias resolvido pelo head-start** (o pior momento nas áreas
> 4–8 passou de nível 1 → nível 130–470, todas sobrevivem). A Wall segue como o **único** portão de
> morte, por design (C). Resta o cuidado de **não auto-convergir bem em cima da Wall** (código).

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

### Mobs (telas de combate Gaiadon) — 2026-06-17
Telas enviadas (Dewdrop Dale lvl 1501; Boreal Bay lvl 42701). Observações úteis:
- **ATK do mob ≈ 3,3% do HP do JOGADOR** (lvl 1501: ATK 164K / HP 4,73M ≈ 3,5%; lvl 42701:
  ATK 344M / HP 10,3B ≈ 3,3%) — **constante** entre eras. ✅ **Valida** nossa decisão de
  desacoplar o dano e ancorá-lo ao HP do jogador (não à vida do mob). Nosso dmgHi 700k vs
  HP ~70M no clear ≈ 1% (boss ×3 ≈ 3%) — na mesma faixa do Gaiadon.
- **Mobs têm raridades** (Champion roxo · Elite vermelho · Fiend laranja) com ATK/HP bem
  maiores (Fiend: ATK ~13% do HP do jogador). 🌱 **Ideia futura:** variantes de elite no pack
  (não no Map 1 base; talvez Hollow/dificuldades).
- **Layout em grade de cards** com vários mobs (até ~9–12 no late). Nosso redesign usa sprite
  corpo-inteiro, 2–3 por onda — diferença estética **proposital** (não copiar).
- Vida do mob no Gaiadon em lvl 1501 ≈ 99M; em 42701 ≈ 9–72T. Confirma que **números grandes**
  são a norma do gênero (reforça a decisão da Wall a 32,5bi).

### Lote 2 de telas (stat-breakdowns + arma/anel) — 2026-06-17
- **Camadas confirmadas em TODO stat** (Attack, XP, HP, Crit Damage, Enemy HP Reduction, APS):
  Primary · Bonus · Multiplier · Mastery · … Nosso **2 camadas (Flat+Bonus%)** = subconjunto early;
  Multiplier/Mastery = raridade/prestígio. ✅
- **Taxas/nível da arma lendária (Warlord's Greatsword)** batem com as nossas: **+50 Attack/nv (flat)**,
  **+2%/nv**, Crit Damage +0,132%/**3 nv**, Crit Rate +0,062%/**25 nv**, APS +0,0017/**50 nv**.
  → confirma crit/APS escalando bem devagar (stats delicados). (Nós: +50 flat ✅, +1% bonus, crit +0,1%/nv.)
- **HP base do jogo = 300** no Gaiadon (nível/equip carregam). Filosofia igual; diferença nossa
  **proposital**: Convergence reseta o nível → o **Gear permanente é o motor**, nível é transiente.
- 🌱 **IDEIA — overflow de stat capado → dano.** Padrão recorrente: APS (cap 15→Mastery 1:100),
  Enemy HP Reduction (cap 50→Mastery 1:0.8). **Generalizar:** todo stat utilitário no teto
  (crit rate 100%, redução de inimigo…) **vira dano** em vez de desperdiçar. Já temos p/ APS.
- 🌱 **IDEIA — "Rage" (maestria por KILLS).** A arma tem um nível Rage que sobe **matando**
  (10,9B/21,2B kills → +448k% Attack), não com gold. Eixo de progressão por uso acumulado.

### Tela Ascension/Transcendence (prestígio de 2 níveis) — 2026-06-17
**SACRIFICE ASCENSION** (interno): por sacrifício → **+15% Attack/Level**, **+15% Health/Level**,
**+0,5% Crit Rate**, **+2 Starting Ascension** (recomeça à frente). **SACRIFICE TRANSCENDENCE**
(externo): reseta a Ascension, dá **+50% Attack Mastery** (camada ×) + masteries + **+10 Starting
Ascension** + redução de penalidade de XP.
- ✅ **Valida nosso Convergence:** +15% Attack/+15% Health por ciclo = exatamente o que o Willian
  escolheu. **+15%/prestígio é magnitude padrão do gênero.**
- **Mapa de hierarquia:** Gaiadon Ascension ≈ nosso **Convergence** (interno, +15%/level); Gaiadon
  Transcendence ≈ nossa **Ascension** (externa, dá camada **Mastery ×** + grande head-start).
- ✅ **IMPLEMENTADO — head-start:** aplicado à Convergence (`headstartFrac = 0,5` → reseta p/ 50%
  do nível atual, não pro 1). Conserta o death-loop das áreas 4–8 e a tediosidade. Ver §6.

### Lote 3 — Corruption/World Tiers + Ranks de inimigos + Spawn Streak (2026-06-17)
Planilhas "Gem_Cly_Calc" do Gaiadon (Map 5, World Tiers WT31–56). **Referência p/ fases FUTURAS**
(Maps 2–5, World Tiers/Corruption, escala de Convergence/Ascension) — **nada entra no Map 1**.

- **Curva de HP dos inimigos em 2 eixos** (tela "Enemy Corruption Level"):
  - **Por World Tier:** ~**×11–12,5 por tier** (wt31 `1.79e51` → wt40 `1.37e61` → wt56 `1e92`).
  - **Por nível (dentro do tier):** ~**+7,4%/nível** (`1.76e51`→`1.89e51`→`2.03e51`…).
  - 🌱 Norte p/ esticar Maps 2–5 e a escala das eras (geométrico em 2 eixos: tier × nível).
- **"Atk to 1-shot" ≈ HP do mob** é coluna de 1ª classe → eles raciocinam em *"dano pra matar em
  1 hit"* (= nosso "matar em N hits"). **Splash 101,625%** = AoE/overkill (= nosso cleave, stub
  `cleaveTargets()`).
- 🌱 **MECÂNICA NOVA — Ranks de inimigos / "Kills to Spawn"** (tela de bestiário): inimigos têm
  **ranks** (Normals → Fiends → Demons → Titans), cada rank **surge após X kills acumulados**
  (50, 100, 250, 500…4k), gateado por **Min World Tier**, dando **pontos/kill** crescentes. Tipo
  elites/mini-bosses por kill-streak. Hoje só temos 1 boss final (threshold 100). Candidato a
  enriquecer o combate (ver também "variantes de elite", Lote 1). ⏳ vira proposta quando pedido.
- 🌱 **MECÂNICA NOVA — Spawn Streak / KPM** (tela "KPM 2170"): cadência de recompensa por
  **sequência de kills** — streaks de 7k–30k kills, ~115–781 streaks/dia a um dado KPM. Modelo de
  pacing de drops por kill-rate; relevante p/ o loop de drops/Hollow. ⏳ referência.

## 10. Offline (decisão Willian 2026-06-17) ✅ / 🔧
| Parâmetro | Valor | Nota |
|---|---|---|
| `OFFLINE.maxSeconds` | **8h** (28.800s) 🔧 | hoje o código tem 30 dias (guarda de engenharia) — virar **8h** de gameplay |
| Eficiência offline | **40%** do ativo 🔧 | ganha 40% da renda/combate que ganharia ativo; **campo novo** no código |

**Banco offline cheio = 8h × 40% = 3,2h de combate/dia.** As ~30,7h de combate do Map 1
são **tempo de combate**, não wall-clock; os "dias reais" dependem do estilo + offline:

| Perfil | Combate/dia | Dias reais (Map 1) |
|---|---|---|
| Perfeito (24/7 ativo) | 24h | ~1,3 dia |
| Dedicado (3h ativo + offline) | 6,2h | ~5 dias |
| Casual (1h ativo + offline) | 4,2h | ~7,3 dias |
| Leve (só 1 banco/dia) | 3,2h | ~9,6 dias |

> Cresce via passivas futuras: *Dreamwalker* = +eficiência (rumo a ~50%); *Nil's Embrace* =
> +teto de tempo (8h→24h). Offline modesto estica o casual p/ ~1 semana no Map 1 (gênero-friendly).

## ✅ WIRING NO JOGO (2026-06-17) — IMPLEMENTADO
A recalibração foi conectada ao código e **validada rodando o combate REAL do jogo**
(`tools/sim/game_harness.mjs` importa `src/game/*` e simula um jogador sensato: farma a
sub-área mais funda sustentável, compra gear guloso, converge no gate). Resultado no jogo:

| Métrica | Alvo (sim) | No jogo (harness) |
|---|---|---|
| Nível 2 | ~8s | **9s** |
| Map 1 limpo | ~27h | **26,7h** |
| Convergences | ~22 | **24** |
| APS no fim | ~3 | **2,91** |
| Gear no fim | ~282 | **309** (teto-suave; cap duro 400) |
| Wall | perigo C | **deadly** (centenas de mortes no death-grind até o poder bastar) |

**Mudanças no código:**
- `constants.js`: `COMBAT` (baseDmg 1000 · apsCap 10 · playerBaseHp 30000 · regenOnKill 0 ·
  bossDmg×3), `LEVEL` (curveDiv 77 · curveExp 0.38 · dmg/hpPerLevel 150), `MAPS[0]` (mesh
  2.000→2,169bi · dmg 80→700k · Wall ×15 = 32,5bi), `CONVERGENCE` (growth 1.3 + **headstartFrac 0.5**),
  `GEAR` (afixos reescalados p/ o agregado do sim · custo **EXPONENCIAL** `costRamp`=2^(1/10),
  `levelCostBase` 600, cap Faded 400), `ECONOMY.lumensFloor` 0, `SCHEMA_VERSION` 7.
- `stats.js`: APS agora **linear** no afixo do Amuleto (`gearApsFlat`), não mais saturante.
- `gear.js`: custo de nível exponencial (cria teto-suave ~300) + `buyLevels` por loop.
- `convergence.js`: **head-start** — `xpRun` reseta p/ `headstartFrac × nível`, não pro 1.

### ✅ DESPERTAR religado (2026-06-17, decisão Willian)
O bug (Prova exigia o Guardião da Sub 3, removido no redesign) foi corrigido. **Novo gate:**
profundidade (Sub 7 liberada) + **kills** (15.000) + **nível** (2.000) + **materiais do T1** (50,
consumidos no ato). **Efeitos por tier** (decisão Willian): **×2 dano, ×2 vida, +200% crit damage,
+5% crit rate, +30% Lumens, +20% XP** (Lumens/XP calibrados). `DESPERTAR.mult` 5→2 (global; afeta
os 5 tiers — Willian ciente). Validado no harness:

| Marco | Tempo |
|---|---|
| Despertar (T2) | **~11,4h** (Sub 9, nível 2.000, gear ~196, 15k kills) — spike de meio-fim |
| Wall derrotada | **~17,9h** (~6,5h curtindo o ×2+crit antes de arrombar a Wall) |
| Convergences / APS fim / mortes | 22 · 2,56 · **401** (perigo C forte) |

### ✅ GATE DE NÍVEL re-espaçado estilo Gaiadon (2026-06-17, decisão Willian)
Referência: o mapa-mundi do Gaiadon usa **poucas zonas com faixas LARGAS** (a inicial cobre Lvl
1–250). Adotamos o princípio **só no gate de nível** (resto do design intacto): os limiares de
unlock das sub-áreas foram **desacoplados** da faixa de nível dos mobs (lvlLo/lvlHi → HP/dano
seguem iguais) e **espalhados pela jornada real** (que vai a ~12k via Convergence):

`unlockLevels = [1, 40, 120, 300, 700, 1500, 3000, 5000, 7500]` (Sub 1..9)

**Efeito (harness):** a Sub 9 deixa de abrir em ~4h; agora as Sub 7/8/9 são marcos **tardios**.
O **Despertar acontece de fato na Sub 7** (nível 3000, ~21h) e o Map 1 fecha em **~25h**.

> ✅ **Efeito colateral aceito (decisão Willian):** como agora você **chega na Sub 9 já forte**
> (nível ~6k + despertado, HP ~118M), a Wall caiu de ~400 mortes (perigo C) p/ **~4 mortes** —
> virou um **clímax vencível**, não mais um death-grind. **Decisão: deixar vencível** (menos
> frustrante). A Wall segue 32,5bi; o "perigo C" foi aposentado em favor de um boss-clímax.

## Pendências desta recalibração
- 🔧 **WIRING restante:** `DEFENSE`/Veil ainda ativo (o sim usou "só HP"; mantido modesto, o
  harness considera a mitigação real); **Despertar inalcançável** (ver bug acima); dano do mob
  segue curva própria (não 2%/4%). Maps 2–5 ainda nos números antigos.
- ⏳ **Próximas fases de design (números):** Hollow + materiais (HP/Gear), Reliquats,
  Ascension (×mult por mapa), Mémoires (knobs globais), Passivas (alavancas), habilidades
  ativas, e o **pacing dos Maps 2–5** rumo aos ~30 dias.
