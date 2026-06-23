# MAP 1 — ESPECIFICAÇÃO FINAL (base única para a Fase 3)

> Consolida **todas as decisões canônicas do Mapa 1**. Não inventa sistemas, não
> altera números, não expande para Mapas 2–5 / Eras II–V. É a **fonte única** para
> a Fase 3 (balanceamento). Todos os números marcados **[PH]** são placeholders já
> existentes (não finais) — a Fase 3 os calibra.
>
> **Legenda de status de implementação:**
> ✅ no código · 🟡 infra no código, magnitude PH · 📄 decisão canônica, **não
> implementada** (precisa de build antes/junto da Fase 3).

---

## 1. Estrutura das 9 áreas ✅

HP do mob em **dois níveis** (`G.data.mobHpAt`): suave **dentro** da área
(`hp = hpInicial × taxa^(nível−lo)`, `taxa = (hpFim/hpInicial)^(1/(hi−lo))`) e salto
**entre** áreas. ATK global: `45 × 1.00085^(nível−1)`. Nomes de Mini Boss/Boss da
A1 são **placeholders de conteúdo**.

| # | Área | Faixa de nível | HP [início → fim] | Mini Boss | Boss |
|---|---|---|---|---|---|
| 1 | The Dreaming Wood | 1–80 | 2.000 → 2.500 | — (sem) | The Waking Bloom |
| 2 | The Lantern Mire | 81–350 | 40.000 → 80.000 | Mirewarden | The Drowned Lantern |
| 3 | The Whispering Hollows | 351–700 | 1.000.000 → 3.000.000 | Hollow Echoling | The Hollow Cantor |
| 4 | The Moonlit Canopy | 701–1.150 | 20.000.000 → 80.000.000 | Canopy Stalker | The Moonlit Sovereign |
| 5 | The Sunken Grove | 1.151–1.700 | 400.000.000 → 1.500.000.000 | Glassmere Sentinel | The Stillwater Maiden |
| 6 | The Gilded Thicket | 1.701–2.350 | 6.000.000.000 → 20.000.000.000 | Thornward Brute | The Bramble King |
| 7 | The Hollow Cathedral | 2.351–3.150 | 40.000.000.000 → 100.000.000.000 | Cathedral Warden | The Gilded Confessor |
| 8 | The Weeping Roots | 3.151–4.050 | 120.000.000.000 → 200.000.000.000 | Rootbound Colossus | The Heartroot Mourner |
| 9 | The Hollow Sanctum | 4.051–5.000 | 220.000.000.000 → 350.000.000.000 | **aleatório** (das áreas anteriores) | **The Gilded Hollow** (Boss Final) |

- O nível do mob = nível do jogador, **clampado** à faixa da área.
- A área avança ao atingir o teto + derrotar o Boss (libera a próxima; viagem livre).
- Recompensas por kill: **Lumens = HP × 0.25** · **XP = 10 × nível**.

---

## 2. Tipos de inimigos ✅ / 🟡

| Tipo | Aparição | ×HP | ×Dano | ×Recompensa | Status |
|---|---|---|---|---|---|
| **Common** | base, todas as áreas | 1 | 1 | 1 | ✅ |
| **Rare** | 8% dos commons | 3 | 1.5 | 3 | ✅ |
| **Rare+** | 15% dos rares | 6 | 2 | 6 | ✅ |
| **Elite** | chance **0.03** [PH], áreas 2–9 | 8 | 1.8 | 4 | 🟡 |
| **Mini Boss** | threshold **50** kills [PH], áreas 2–9 | 15 | 2.5 | 10 | 🟡 |
| **Boss** | teto da área; reaparece a cada **100** kills [PH] | 4 | 1.5 | 6 | ✅ |

- **Área 1:** apenas **Common + Rare + Boss** (sem Elite, sem Mini Boss).
- **Áreas 2–8:** Common · Rare · Elite · Mini Boss · Boss.
- **Área 9:** Common · Rare · Elite · **Mini Boss aleatório** · **Boss Final**.
- Prioridade de encontro: **Boss > Mini Boss > Elite > Common(/Rare)**.
- Mini Boss derrotado reinicia o threshold; Boss derrotado entra em cooldown e
  reabre por novo threshold.

---

## 3. Gear e Promoção ✅

**6 peças fixas, permanentes** (nunca substituídas; evoluem a jornada toda).
Mesmo **custo, cap e curva** para todas. Afixo **primário** por slot:

| Slot | Função (afixo primário) |
|---|---|
| Weapon | Dano (ATK) |
| Helmet | HP |
| Armor | HP / sobrevivência |
| **Gloves** | **Crítico** |
| **Boots** | **Attack Speed** |
| **Cloak** | **Economia (Lumens)** |

- **Custo de upgrade:** `1100 × 1.05^(nível−1)` [PH].
- **Attack Speed:** base **0.9**, teto **15** aps.
- **Raridades do Mapa 1:** **Common (cap 500)** e **Uncommon (cap 1200)**. Só essas.
- **Promoção** (Common → Uncommon): exige estar **no cap atual** + **materiais**;
  **preserva o nível**, apenas **aumenta o cap**. Custo: **10 Common material** [PH].

> Fora de escopo no Mapa 1: Rare/Epic/Legendary, Reliquats/sets de Hollow.

---

## 4. Materiais ✅ / 🟡

Recurso de promoção e de Awaken, dropados por tipo de inimigo (`economy.rollDrops`,
tabela configurável [PH]):

| Material | Origem | Uso | Introdução |
|---|---|---|---|
| **Gear Material — Common** | todos os tipos | Promoção Common→Uncommon | desde o início |
| **Gear Material — Uncommon** | Elite / Mini Boss / Boss | (sink no Mapa 2+) | **Área 5** [PH] |
| **Awaken Material (firstLight)** | Mini Boss / Boss | First Light (Awaken) | **Área 6** [PH] |

- Passivas modulam drop (Vestige: `matCommon/Uncommon/General %`, `dropRate`,
  `matQuantity`; Fracture: `awakenMatPct`) — magnitudes [PH].
- **Pendência conhecida (Fase 3):** o **Uncommon material não tem sink no Mapa 1**
  (a promoção consome Common); decidir se o drop de Uncommon começa só no Mapa 2.

---

## 5. Convergence ✅ / 🟡

**Prestige gateado por NÍVEL** (`canConverge = nível ≥ gateLevel`) — não por área.

- **Gate:** hoje `gateLevel = 80` [PH]; **alvo canônico ≈ nível 350–500** (início da
  Área 3 — ver `PRE_BALANCE_REVIEW_V2`). A primeira Convergence real ~Área 4.
- **Fórmula de pontos:** `Pontos = Área + Bosses + Nível + Kills` (importância
  Área > Bosses > Nível > Kills). Pesos [PH] — hoje só o componente **Nível** ativo
  (`weights {area:0, boss:0, level:1, kills:0}`, curva legacy `C=80, k=1.25`).
- **Reseta:** nível, XP, Lumens, área da run + contadores da run.
- **Mantém:** Gear, níveis/raridades do Gear, materiais, **Passivas**, Awaken, áreas
  desbloqueadas, pontos.
- **Passivas** destravam na **1ª Convergence** (3 árvores × 15 nós; Éclat/Vestige/
  Fracture). Moeda dos pontos = **Convergence Points** (canon: **Vestiges**).
- **Meta do Mapa 1:** **8–12 Convergences** até o First Light.

> Acoplamento p/ Fase 3: `gateLevel`, pesos da fórmula e meta de 8–12 são alavancas
> que se calibram juntas.

---

## 6. Awaken (First Light) ✅ / 🟡

Marco de **poder** permanente (sobrevive à Convergence). `awakens[]`, `awakenTier`.

- **Requisitos (configuráveis, [PH]):** Área **9** · nível **4.051** · kills **0** ·
  Convergences **8** · materiais **firstLight ×1**.
- **Bônus [PH]:** ATK **×2.5** · HP **×1.5** · Lumens **+25%**.
- Requisitos lidos do estado real: `maxAreaUnlocked`, `level`, `totalKills`,
  `convergences`, `awakenMaterials.firstLight`.
- Passivas Fracture já plugadas: `awakenReqReduction` (reduz limiares) e
  `awakenEfficiency` (amplifica o bônus) — magnitudes [PH].

> Canon (`CANONICAL_ALIGNMENT_AUDIT_V1`): o Awaken implementado é o **motor do
> Despertar** (mudança de classe/tier). A identidade plena do Despertar (ritual de
> 3 camadas + material **Nitzotzot** + ×poder por tier) é **decisão canônica ainda
> não implementada** — não faz parte dos números da Fase 3 do Mapa 1, mas é o
> destino do sistema.

---

## 7. Ascension I 📄

Marco **institucional/narrativo** que **encerra o Mapa 1**. **Não implementado** —
decisão canônica (`ASCENSION_SYSTEM_V1` + `CANONICAL_ALIGNMENT_AUDIT_V1`).

- **Rank concedido:** **Seeker → Illuminate**.
- **Requisitos:** **Awaken (First Light) concluído** + **Boss Final derrotado** +
  **3 Mémoires da Era I encontradas** + (outros requisitos específicos do mapa).
- **Recompensas (4):** (1) **Rank** (Illuminate); (2) **Transformação visual**
  permanente; (3) **3 Mémoires da Era I** (recompensa principal); (4) **Bônus
  permanente pequeno** (nunca compete com Awaken).
- **NPC:** **Séraphine, Doyenne de l'Ordre** (preside a cerimônia).
- **NÃO** reseta a Convergence (decisão canônica — Ascension é marco leve).

> Pergunta da Era I respondida na Ascension I: **"O que são os Éclats?" → ninguém
> sabe; a Ordre herdou a missão.**

---

## 8. Éclats 📄

**Moeda da memória** — **não implementada** (decisão canônica de restauração,
`CANONICAL_ALIGNMENT_AUDIT_V1`).

- **Papel:** permanente (nunca reseta); **compra as Mémoires**.
- **Hierarquia das moedas:** **Lumens (run) < Vestiges (permanente/Passivas) <
  Éclats (Mémoires)**.
- **Origem no Mapa 1:** drops de Bosses / Mini Bosses / Elites (fonte já prevista no
  sistema de drop) — magnitudes [PH] / a definir na Fase 3.
- É o recurso-título do jogo (Éclats *of Lumière*); essencial, não redundante.

---

## 9. Mémoires da Era I 📄

**3 Mémoires** (Era I = Mapa 1), liberadas pela **Ascension I**, compradas com
**Éclats**, movidas pelo motor **Clarté** (dano × `1.07^Σníveis`). **Não
implementadas.** Tema: **o amanhecer de Lumière**.

| # | Mémoire | Relíquia (arte aprovada) | História | Efeito (knob) |
|---|---|---|---|---|
| 1 | **du Premier Matin** | espelho que guarda o amanhecer | o nascer da era radiante | × **TODO o dano** *(GDD: +10% dano/nível)* |
| 2 | **des Rires** | caixa de música com figuras de luz dançando | a vida e a alegria | × **TODA a economia** *(GDD: +10% Lumens)* |
| 3 | **de la Marche** | botas com trilha de pegadas de luz | a jornada / expansão | × **a Convergence** *(GDD: +8% XP)* |

- **Desbloqueio (Era 1):** 10 Éclats por Mémoire [PH]; evolução `2 × 3.0^n` [PH].
- Texto narrativo por Mémoire = a memória de Lumière (veículo da narrativa).

> Detalhes completos das 15: `MEMOIRES_CODEX_FULL.md`. Aqui **só a Era I**.

---

## 10. Critério oficial de conclusão do Mapa 1

O Mapa 1 está concluído quando o jogador realiza a **Ascension I** — o que exige,
em conjunto:

1. **Boss Final derrotado** — *The Gilded Hollow* (Área 9). ✅ (`mapOneCleared` /
   `markBossCleared` já marcam isso no código.)
2. **Awaken concluído** — *First Light*. 🟡 (sistema implementado; requisitos [PH].)
3. **3 Mémoires da Era I encontradas**. 📄 (depende de Éclats + Mémoires.)
4. **Ascension I executada** → rank **Illuminate** + 3 Mémoires + bônus pequeno. 📄

**Estado esperado ao concluir** (canon): **8–12 Convergences**, várias passivas,
algumas peças **Uncommon**, materiais suficientes para o First Light, e a
**compreensão parcial** da verdade (Era I). O Mapa 2 deve ser **farmável de
imediato** ao entrar.

> Nota p/ Fase 3: os critérios **1–2** já existem no código (foco do balanceamento
> numérico imediato). Os critérios **3–4** dependem de **construir Éclats +
> Mémoires + Ascension** — pré-requisito de build para a conclusão *narrativa*, mas
> fora dos números de combate/economia que a Fase 3 calibra primeiro.

---

## ⛔ Explicitamente FORA DE ESCOPO (Mapa 1 / Era I)

Nenhum destes entra nesta spec nem na Fase 3 do Mapa 1:

- **Dungeons / Hollows** (instâncias, Reliquats, materiais de Hollow).
- **Gatekeepers** (A1–A5) — o game-changer por Ascension.
- **Despertar pleno** — ritual de 3 camadas, **Nitzotzot**, ×poder por tier além de
  Illuminate.
- **Ranks acima de Illuminate** (Éclairé, L'Éveillé, Lumière) e o `data.tiers` por
  nível (a aposentar).
- **Mapas 2–5** (Cavernes Luminis, The Sunken Realm, The Shattered Throne, Nil
  Aeternum) e seus bosses/Eidola/Claimed/Qliphoth.
- **Eras II–V** (Mémoires 4–15) e a moeda **Vestiges** como sistema próprio de
  prestige avançado.
- **Dificuldades** (Nightmare/Tormento), **Echoes (pets)**, **Habilidades ativas**.
- **Balanceamento numérico** — esta spec **fixa a estrutura**; os valores [PH] são
  calibrados na Fase 3.
