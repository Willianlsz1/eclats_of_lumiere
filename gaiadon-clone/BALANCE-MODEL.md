# BALANCE MODEL — Éclats of Lumière
> Fonte da verdade para decisões de balanceamento. Atualizado incrementalmente.
> DESIGN.md continua sendo a fonte da verdade para lore e sistemas.
> Este arquivo registra os números e fórmulas acordados em sessão de design.

---

## 1. Estrutura de Mapas e Subáreas

### Levels por subárea
Cada subárea tem um range de levels. Os ranges crescem por mapa.

| Mapa | Sub 1 | Sub 2 | Sub 3 | Sub 4 | Sub 5 |
|------|-------|-------|-------|-------|-------|
| 1 | 1–50 | 51–100 | 101–150 | 151–200 | 201–250 |
| 2 | 251–300 | 301–350 | 351–400 | 401–450 | 451–500 |
| 3 | 501–600 | 601–700 | 701–800 | 801–900 | 901–1000 |
| 4 | 1001–1200 | 1201–1400 | 1401–1600 | 1601–1800 | 1801–2000 |
| 5 | 2001–2400 | 2401–2800 | 2801–3200 | 3201–3600 | 3601–4000 |

- Cada inimigo sorteado recebe um **level aleatório** dentro do range da subárea
- Inimigos de level mais alto dentro da mesma sub = mais difíceis (mais HP, mais dano)

---

## 2. HP dos Inimigos

### Fórmula
```
hp(level) = baseHp × 1.04^(level - 1)
```

- `baseHp` — HP do inimigo de level 1 (a calibrar com o loop completo)
- Crescimento de **4% por level**
- Level 50 → ~7× o HP do level 1
- Level 250 → ~16.000× o HP do level 1

### Boss
- Level fixo = **level máximo da subárea** (ex: Sub 1 Map 1 → boss é Lv 50)
- `HP_boss = hp(levelMax) × bossHpMult` (bossHpMult a definir)
- Substitui 1 mob do campo quando spawna (mantém o cap de densidade)

---

## 3. Modelo de Spawn — Área de Densidade

Inspirado em Gaiadon Eternal Quest (patch 0.9.44+):

- **Múltiplos mobs ativos simultaneamente** na área
- Quando um mob morre, outro spawna imediatamente para manter a densidade
- O boss entra no campo ativo após o kill threshold — **não limpa os outros mobs**
- O player ataca **um mob por vez** (projétil A→B)
- **Todos os mobs ativos atacam o player ao mesmo tempo**

### Pack Size (mobs simultâneos ativos por subárea)

| | Sub 1 | Sub 2 | Sub 3 | Sub 4 | Sub 5 |
|-|-------|-------|-------|-------|-------|
| **Map 1** | 1 | 2 | 4 | 6 | 8 |
| **Map 2** | 5 | 8 | 11 | 14 | 18 |
| **Map 3** | 10 | 14 | 17 | 21 | 24 |
| **Map 4** | 14 | 18 | 22 | 26 | 29 |
| **Map 5** | 20 | 26 | 31 | 36 | 40 |

> Estes valores são referência para escalas pequenas — servirão de base para escalas maiores.

---

## 4. Kill Threshold para Boss Spawnar

### Map 1 — Apenas Sub 5 tem boss
| Subárea | Threshold |
|---------|-----------|
| Sub 1–4 | Sem boss (mapa tutorial) |
| Sub 5 | **100 kills** |

### Map 2 — Todas as subareas têm boss
| Subárea | Threshold |
|---------|-----------|
| Sub 1 | 50 |
| Sub 2 | 80 |
| Sub 3 | 120 |
| Sub 4 | 160 |
| Sub 5 | 200 |

### Maps 3–5 — Referência base (calibrar com loop completo)
| | Sub 1 | Sub 2 | Sub 3 | Sub 4 | Sub 5 |
|-|-------|-------|-------|-------|-------|
| **Map 3** | 100 | 150 | 200 | 250 | 350 |
| **Map 4** | 150 | 220 | 300 | 400 | 500 |
| **Map 5** | 200 | 300 | 450 | 600 | 800 |

### Simulação de referência (tempo estimado até o boss)
| Kill rate | Map 2 Sub 1 (50 kills) | Map 5 Sub 5 (800 kills) |
|-----------|----------------------|------------------------|
| 6 kills/min (início da área) | ~8 min | ~133 min |
| 12 kills/min (player investido) | ~4 min | ~67 min |
| 20 kills/min (player forte) | ~2.5 min | ~40 min |

### Progressão de área
O player **escolhe** quando avançar após matar o boss. Ficar na subárea = mobs ficam mais fáceis conforme DPS cresce. Avançar = área mais difícil, mais densa, boss mais forte.

---

## 5. Combat — Ataque e DPS

### Fórmula de DPS
```
DPS_real = dano_por_hit × ataques_por_segundo
```

Dois eixos independentes e multiplicativos:
- **Damage** — dano por projétil (principal motor de crescimento)
- **Atk Speed** — frequência de disparo (complemento, máx 3.1× de contribuição)

### Attack Speed
Modelo de intervalo em segundos (inspirado em Melvor Idle):

| Fase | Intervalo | APS |
|------|-----------|-----|
| Início | 2.5s | 0.40 |
| Early | 2.0s | 0.50 |
| Mid | 1.5s | 0.67 |
| Late | 1.1s | 0.91 |
| **Cap** | **0.8s** | **1.25** |

- Razão início→cap: **3.1×**
- Multiplicador de DPS máximo pelo speed: **3.1×**
- Referência da indústria: Melvor Idle usa razão de ~9.6×; nosso 3.1× é conservador e prioriza legibilidade visual

### Target de kill time (early game)
- 1 mob na área: **3–4 segundos** por kill no início
- N mobs simultâneos: mesmo tempo por mob individual, mas **pressão de dano recebido cresce com N**

---

## 6. A Definir (próximos passos em ordem)

- [ ] **Damage scaling** — como `dano_por_hit` começa e cresce (gold stats, gear, level)
- [ ] **HP do player** — base + crescimento por vitalidade
- [ ] **Dano recebido** — fórmula de dano dos mobs vs defesa do player
- [ ] **Lumens por kill** — fórmula de reward (goldRatio × hp ou outra)
- [ ] **Vestiges por kill** — drop da moeda de prestige
- [ ] **XP e leveling** — curva de level do hero
- [ ] **Gold Stats** — custo e bônus por stat (str, vit, agi, lck, frt, wis)
- [ ] **Convergence** — fórmula do multiplicador, requisito de ativação
- [ ] **Ascension** — custo em Vestiges, power-up resultante
- [ ] `baseHp` absoluto — calibrar com loop completo rodando
- [ ] `bossHpMult` — multiplicador de HP do boss vs regular

---

## 7. Referências de Design

### Jogos pesquisados
| Jogo | Lição principal |
|------|----------------|
| **Synergism** | 7 camadas de prestige; produto de multiplicadores independentes; `break_infinity.js` para números grandes |
| **Gaiadon Eternal Quest** | Área de densidade com boss no pool ativo; hard caps por patch; 4 camadas multiplicativas de stat |
| **Melvor Idle** | Intervalo de ataque em ms, cap de 250ms; DPS = (hit × accuracy) / interval |
| **Idle Skilling Crusades** | 4 mobs + 1 boss simultâneos por encounter |
| **Clicker Heroes** | 10 mobs/zona sequencial, boss sozinho a cada 5 zonas; DPS totalmente abstraído |

### Princípios acordados
1. **Soft cap com `sqrt`** para stats que podem dominar
2. **Produto de multiplicadores independentes** para crescimento modular (não uma única fórmula com expoente gigante)
3. **Prestige gain** = `(recurso / threshold)^α` com α < 1 — grinding extra não deve dominar o prestige
4. **Attack speed como intervalo visível**, não APS abstrato — cada projétil deve ser legível
5. **Boss no campo ativo** cria pressão de DPS dupla (HP wall + dano recebido), não só HP wall
6. **Pack size como dimensão de tempo** — mais mobs = mais tempo na área, não mobs mais difíceis individualmente
