# 🛠️ PASSIVES — PLANILHA DE TRABALHO (Continente 1)

> Documento **para você preencher**. Cada nó tem campos em branco (`____`) para
> você definir o **efeito** e os **números**. Baseado no desenho aprovado
> (`PASSIVES_V1.md` / `CANON_V2.md §7`): **15 nós = 5 por árvore**, primeiro tier
> simples, nível máx **12**, moeda = **Vestiges**.
>
> Use o **Cardápio de alavancas** (no fim) para escolher efeitos que o motor **já
> aplica** (sem código novo) ou marcar 🆕 quando for efeito novo.

---

## Como preencher cada nó
- **Efeito:** o que o nó faz, em 1 linha.
- **Tipo:** `aditivo` (+X% que soma) · `motor` (×fator composto por nível) ·
  `escala` (cresce com algo: profundidade/Convergences/etc.) · `condicional`
  (só vale em certo caso) · `proc` (chance).
- **Valor/nível:** o número por nível (ex.: `+3%`, `×1.05`, `+0,5%/área`).
- **Teto/Máx:** se houver limite (ou "sem teto").
- **Hook:** a chave do motor (ver Cardápio) ou 🆕 se for novo.

---

# 🔴 Árvore ÉCLAT — Dano / Combate (poder imediato)

### E1 · Radiant Strike
- Efeito: `+% dano base` (sugestão)
- Tipo: `aditivo` · Valor/nível: `____` · Teto/Máx: `nível 12` · Hook: `atkPct`

### E2 · Luminal Edge
- Efeito: `+crítico` (chance e/ou dano) — `____`
- Tipo: `aditivo` · Valor/nível: `____` · Teto/Máx: `____` · Hook: `critRate` / `critDmg`

### E3 · Momentum
- Efeito: `+velocidade de ataque` — `____`
- Tipo: `aditivo` · Valor/nível: `____` · Teto/Máx: `____` · Hook: `atkSpeed` (gear) / 🆕

### E4 · Shattered Light  *(motor)*
- Efeito: `×dano composto por nível` — `____`
- Tipo: `motor` · Valor/nível: `____` (ex.: ×1.05) · Teto/Máx: `sem teto` · Hook: engine

### E5 · Execute  🆕
- Efeito: `+dano contra Boss e Mini Boss` — `____`
- Tipo: `condicional` · Valor/nível: `____` · Teto/Máx: `____` · Hook: `bossDmg` (+ mini boss) 🆕

---

# 🟡 Árvore VESTIGE — Economia (recursos)

### V1 · Lumen's Blessing
- Efeito: `+% Lumens` — `____`
- Tipo: `aditivo` · Valor/nível: `____` · Teto/Máx: `nível 12` · Hook: `lumensPct`

### V2 · Remnant Harvest
- Efeito: `+% materiais dropados` — `____`
- Tipo: `aditivo` · Valor/nível: `____` · Teto/Máx: `____` · Hook: `matGeneralPct`

### V3 · Vestige Pull  🆕
- Efeito: `+ganho de Vestiges da Convergence` — `____`
- Tipo: `____` · Valor/nível: `____` · Teto/Máx: `____` · Hook: `convPointsPct` (→ vestiges)

### V4 · Eternal Vestige  *(motor)*
- Efeito: `×Lumens composto por nível` — `____`
- Tipo: `motor` · Valor/nível: `____` · Teto/Máx: `sem teto` · Hook: engine

### V5 · The Collector  🆕
- Efeito: `+chance de Éclats por kill` — `____`
- Tipo: `proc` ou `aditivo` · Valor/nível: `____` · Teto/Máx: `____` · Hook: 🆕 (Éclats)

---

# 🔵 Árvore FRACTURE — Meta / Longo prazo (fraca → mais forte)

> Identidade: nós **fracos no início que escalam até dominar**. Pense em efeitos
> que crescem com **profundidade**, **Convergences feitas** e **composição**.

### F1 · Last Light
- Efeito: `+% HP base` — `____`
- Tipo: `aditivo` · Valor/nível: `____` · Teto/Máx: `nível 12` · Hook: `hpPct`

### F2 · Void Endurance  *(motor)*
- Efeito: `×HP composto por nível` — `____`
- Tipo: `motor` · Valor/nível: `____` · Teto/Máx: `sem teto` · Hook: engine

### F3 · Nihel's Shadow  🆕  *(escala c/ profundidade)*
- Efeito: `bônus que cresce com áreas alcançadas` — `____`
- Tipo: `escala` · Valor/nível: `____` (ex.: `+0,5% por área × nível`) · Teto/Máx: `____` · Hook: 🆕

### F4 · The Fracture's Gift  🆕  *(escala c/ resets)*
- Efeito: `bônus global que cresce a cada Convergence feita` — `____`
- Tipo: `escala` · Valor/nível: `____` · Teto/Máx: `____` · Hook: 🆕

### F5 · Claimed Domination  🆕  *(multiplicador global)*
- Efeito: `amplifica dano E economia` — `____`
- Tipo: `motor/global` · Valor/nível: `____` · Teto/Máx: `____` · Hook: 🆕

---

# 📋 Cardápio de alavancas (o que o motor JÁ aplica)
*(use estas chaves p/ efeito sem código novo; magnitude hoje é placeholder)*

| Chave (hook) | O que faz | Onde aplica |
|---|---|---|
| `atkPct` | +% ATK (dano) | `atk.mult` |
| `hpPct` | +% HP | `hp.mult` |
| `critRate` | +chance de crítico | crit |
| `critDmg` | +dano de crítico | critDmg |
| `lumensPct` | +% Lumens | economia |
| `xpPct` | +% XP | economia |
| `atkSpeed` | +velocidade de ataque | combate (via gear hoje) |
| `bossDmg` | +dano a Bosses | combate |
| `eliteDmg` | +dano a Elites | combate |
| `matGeneralPct` | +% todos os materiais | drops |
| `matCommonPct` / `matUncommonPct` | +material por raridade | drops |
| `dropRate` / `matQuantity` | +taxa / +quantidade de drop | drops |
| `convPointsPct` | +Vestiges ganhos na Convergence | meta |
| `convPointsMin` | garante mínimo de Vestiges | meta |
| `awakenMatPct` | +materiais de Awaken | meta |
| `awakenReqReduction` | reduz requisitos do Awaken | meta |
| `eliteChance` | +chance de Elite aparecer | mundo |
| `miniBossThreshold` | reduz kills p/ Mini Boss | mundo |
| `upgradeCostReduction` | -custo de upgrade de gear | economia |
| `promotionCostReduction` | -custo de promoção de raridade | economia |
| `convEfficiency` | melhora eficiência da Convergence | meta |
| `awakenEfficiency` | amplifica o bônus do Awaken | meta |
| **engine** | `×fator^nível` (composto) — o "motor" da árvore | multiplicador da árvore |

**Efeitos novos sugeridos no desenho (🆕 — precisam de código):**
- **Execute** → dano condicional vs Boss **e** Mini Boss (`bossDmg` cobre Boss; falta Mini Boss).
- **The Collector** → +chance/ganho de **Éclats** por kill.
- **Nihel's Shadow** → bônus que **escala com áreas alcançadas**.
- **The Fracture's Gift** → bônus que **escala com nº de Convergences**.
- **Claimed Domination** → **multiplicador global** (dano + economia).

---

# 📝 Notas livres (suas)
- 

> Quando terminar de preencher, me devolva este arquivo (ou só os números) que eu
> implemento os 15 nós em `passives.js` conforme você definiu.
