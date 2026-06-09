# Modelo de Progressão & Balanceamento — Éclats of Lumière

> Consenso fechado em discussão (sessão de balanceamento). Espelha o pacing de
> **Gaiadon: Eternal Quest** (Steam/itch.io): grind lento, gear como parede,
> prestígio frequente que ajuda mas não pula etapas.

## 1. Mapas & HP — ×1e12 por mapa (DESIGN §16)
- 5 mapas × 5 subáreas. `HP(map, sub) = baseHp × subareaRamp^(map×5 + sub)`.
- `subareaRamp = 251`, `bossHpMult = 25` → chefe do Mapa N ≈ 1e(12·N) (1e12, 1e24, … 1e60).
- Open-zone: spawn instantâneo; chefe da subárea por trigger oculto (killsToBoss).

## 2. Renda — LENTA e DESACOPLADA do poder
- Lumens/XP/Vestiges escalam com **profundidade** (HP do inimigo), **não** com `totalPowerMult`.
  (Remove o runaway: lvl30+epic dava 500k lumens/kill → ~36 desacoplado.)
- Materiais: drop escasso (chance baixa).
- XP-para-nível também escala com profundidade (cadência de convergence uniforme).

## 3. Gear — a parede (estilo "fully legendary" do Gaiadon)
- **Níveis SEM CAP** (gasta Lumens).
- Afixos **fracos lineares**: ex. damage = 1% + 0,01/nível (afixo cresce com o nível).
- **Raridade = ×UP** (multiplicador; materiais escassos). common→legendary = a "escada" geométrica dentro do mapa.

## 4. Convergence — sub-loop frequente
- Reseta nível/lumens; dá mult **capado (√)** — re-grind rápido.
- Gatilho: nível ≥ `minLevel`.
- **Marco de transcendência (ascensão 50):** para de resetar e passa a dar **bônus aditivos** (damage, atributos). [fase futura]

## 5. Ascension — motor geométrico (tiered)
- Até **1000 ascensões**, divididas nos **5 tiers da Ordre** (Seeker→Lumière).
- Cada ascensão = **×mult crescente** (1,5 + 0,002·n) → `ascMult = Π`. ~30/mapa, ~250 p/ zerar; 1000 = headroom.
- **Marcos** (50/200/500/1000) = saltos maiores + benefícios.
- **NÃO reseta** mapa nem gear (power spike permanente). Não reseta nível (a Convergence é o reset).
- **Gatilho: X convergences (desde a última ascensão) + custo crescente em Vestiges.**

## 6. Synergy Surge — ELIMINADO
- Era a fonte geométrica antiga (runaway). Removido; o geométrico vem da Ascensão + Raridade.

## Alvos de calibração (a afinar no jogo real)
- Margem **×2-3** no chefe de cada mapa · cada mapa um muro novo.
- Convergence/abuso **nunca** pula um mapa (√ capa).
- Ascensão **~20-30 min** cada; Convergence frequente (X conv → 1 ascensão).
- Pacing estilo Gaiadon: Mapa 1 ~muitas horas (com offline, dias).

## Valores candidatos (ponto de partida da calibração)
| Knob | Candidato |
|---|---|
| `subareaRamp` / `bossHpMult` | 251 / 25 |
| mult por ascensão | 1,5 + 0,002·n |
| raridade ×UP | ×10/tier |
| afixo | 1% + 0,01/nível |
| custo ascensão | ~150 × 1,20^n Vestiges |
| X convergences/ascensão | ~8 (a calibrar) |
| convergence minLevel | ~25 (a calibrar) |
| goldRatio / xpRatio | 0,10 / 0,12 (desacoplado) |
| materialDropChance | ~0,20 |
