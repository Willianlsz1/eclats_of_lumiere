# Éclats — Recomeço do núcleo (design, 2026-06-19)

> **Status:** design do NÚCLEO fechado nesta sessão de brainstorming. Mantém a **pele
> Éclats** (lore, 30 artes de gear, mundo, UI) e **refaz a mecânica/economia por baixo**,
> começando simples. Revisa pontos do `eclats_redesign_2026-06-14.md` e do `CONTEXT.md`
> (ver §8). **Números são sementes** — a calibração é por simulador, fatia por fatia.

## 1. Por que recomeçar
A visão do jogo está boa; o problema é **balanceamento**: toda vez que se mexe nos números,
o designer se perde e sai errado, e não há um critério claro de **como distribuir o "power
level" entre os sistemas**. Causa-raiz: **botões livres demais que se multiplicam entre si**.
A correção é reduzir botões, ancorar tudo numa razão central e **construir uma fatia de cada
vez**.

## 2. Método (blend aprovado)
- **v0-first / incremental:** construir o menor núcleo jogável, validar no **simulador**,
  **travar**, e só então somar o próximo sistema. Nunca balancear o que ainda não existe.
- **Orçamento de poder em décadas (ordens de grandeza):** o jogo base cresce ~**44 décadas**
  de poder (dano ~10 → ~1e45). "Distribuir power level" = dar a cada sistema uma **cota** de
  décadas. Balancear vira "esse sistema entrega a cota dele?", não adivinhação.
- **HP relativo como âncora:** o HP do inimigo é **derivado do poder do player** (ver §3.1),
  então não há tabela de HP absoluto pra desregular. ~90% da dor some aqui.
- **Simulador é o juiz:** cada fatia é aprovada quando a curva sentida no simulador está boa.

## 3. O núcleo (TRAVADO)

### 3.1 Combate — HP relativo, single-target
- **Auto-combate, idle-first, single-target** (cada ataque atinge 1 mob; cleave é unlock
  futuro). Cadência pelo **APS** (ataques por segundo).
- **HP do mob = (seu HP) × (raridade) × (×área)** — raridade **comum 1.3**, **raro 1.8**.
  O **×área da Área 1 = 1.0** (a fórmula colapsa pra ×raridade). O HP do mob **segue o seu
  HP, nunca o seu Dano**.
- **Consequência central (a chave do jogo):** como o HP do mob acompanha seu HP mas não seu
  Dano, **só se progride quando o Dano cresce mais rápido que o HP**. Comprar HP serve pra
  **sobreviver** ao dano do mob (que também escala); comprar Dano é o que **fura**. O
  balanceamento se reduz a cuidar de **uma razão: Dano ÷ HP**.
- Mob também causa dano ao player; player tem **regen**; **sem morte punitiva** (recuo/respawn).

### 3.2 Motor de stat — soma aditiva × multiplicadores
```
Stat final = ( Nível + Gear )  ×  Convergence%  ×  Awaken  ×  Ascension
              \___ soma base __/   \_ +% acum. _/   \_ × próprio _/  \_ × (a definir) _/
```
- **Soma base (aditivo):** **Nível** (base pequena por nível) + **Gear** (flat, + %).
- **Convergence:** **+% acumulativo** em Dano/Vida/Gold/XP (cresce somando %; aplica como
  ×(1+Σ%)). **Começa fraca e cresce** — é o motor de longo prazo.
- **Awaken:** **multiplicador próprio** (saltos de tier + bônus).
- **Ascension:** **outro multiplicador** (interno a definir — §7).
- Vale pra Dano, Vida, APS etc.; economia (Gold/XP) recebe o ramo aditivo + Convergence%.

### 3.3 Áreas — gate por nível
- Cada **área** é uma **faixa de nível**. **Área 1 = lv 1 → 60.**
- O mob **nasce no nível do player** e **acompanha** conforme ele sobe, **até o cap da área**
  (depois fica no cap).
- **Bater o cap destrava a próxima área.** Cada área tem seu próprio **×HP**.
- **Áreas destravadas nunca resetam.**

### 3.4 Convergence — o loop de prestige
- **Gate (sobe a cada vez):** exige um **nível** maior que a Convergence anterior **+ mais
  gold**.
- **Reseta:** seu **nível** (volta ao lv 1) e seu **gold** (volta a zero).
- **Mantém:** as **áreas destravadas**.
- **Recompensa:** **+% acumulativo** em **Dano / Vida / Gold / XP** (compensa o reset →
  re-sobe mais forte e mais rápido, empurrando o cap).

### 3.5 Papéis — quem carrega o poder, e quando
- **Nível:** base **pequena** (~10%), forte/relevante **cedo**; vira tempero depois.
- **Gear:** o **2º que ajuda** — apoio ativo e constante (upado com Gold/Lumens), nunca o
  primário.
- **Convergence:** o **motor que cresce** (fraco→forte) ao longo do jogo. Já no Map 1.
- **Awaken:** saltos + 1 habilidade ativa por despertar. Já no Map 1.
- **Ascension:** o **carro-chefe do fim** (multiplica tudo entre mapas).
- **Passivas / Mémoires / Hollow:** endgame — **amplificam** o resto, não ganham cota de
  décadas própria (por isso não estouram o orçamento).

## 4. v0 — "A primeira subida" (TRAVADO)
A menor fatia que já é um jogo completo e balanceável. **Área 1, lv 1 → 60.**

**Loop:** mob aparece (no seu nível) → auto-ataque (APS) mata → cai **Gold + XP** → XP sobe
**Nível**, Gold compra upgrades → mata mais rápido → **lv 60 = Área 1 limpa**.

**Existe no v0:**
- **Stats:** Dano · HP · APS.
- **Gold compra (custo escala):** **Forjar Dano** (+dano) e **Reforçar Vida** (+HP).
- **Combate:** single-target; mob **comum** (HP = seu HP × 1.3); mob dá dano + **regen**, sem
  morte punitiva; **Nível** dá +base pequena de Dano/HP e o mob acompanha.

**FORA do v0 (entram depois, um por vez):** Convergence · Awaken · Gear (6 peças) · cleave ·
Ascension · Hollow · áreas 2+ · mobs raros/champion · passivas · mémoires · daily quests.

**Critério de aprovação:** o loop fecha do lv 1 ao 60 com curva sentida boa no simulador.

**Notas pro plano do v0:**
- O "~10%" do Nível (§3.5) é **alvo de jogo longo** (share do poder final), não uma regra do
  v0. No v0 — sem Convergence/Awaken/Ascension — o Nível é só uma **base pequena por nível**;
  não force a curva do v0 a respeitar os 10%.
- **Números são por simulador:** o plano do v0 pode escolher **sementes provisórias** pra
  **dano do mob**, **regen** e **APS inicial** (e custo dos upgrades) e afinar no simulador —
  a ausência delas no design não é bloqueio.

## 5. Roadmap incremental (cada passo travado antes do próximo)
- **v0** — Núcleo puro (acima).
- **v1** — + **Convergence** (loop de prestige; §3.4).
- **v2** — + **Gear** (as 6 peças, upadas com Gold) + **Awaken** (saltos + 1ª habilidade).
- **v3** — + **áreas 2+** e seus ×HP + **mobs raros/champion** (×1.8) + **cleave** (unlock).
- **v4** — + **Hollow** (dungeon ativa → raridade do Gear) e o resto da economia de materiais.
- **v5** — + **Ascension** (multiplicador entre mapas).
- **v6+** — Passivas · Habilidades restantes · Mémoires · Reliquats (endgame amplificador).
> A ordem pode mudar conforme a gente joga e sente — não é rígida.

## 6. Disciplina de orçamento (como não se perder de novo)
Antes de um sistema entrar (v1+), ele recebe uma **cota de décadas** dentro das ~44 totais, e
o simulador confirma que ele entrega só a sua cota — sem estourar os sistemas já travados.
Distribuição-semente: **Nível** forte cedo mas cota total pequena; **Gear** apoio constante;
**Convergence + Ascension** carregam o grosso do fim. Ajustar com os números reais.

## 7. Aberto / a definir
- **Convergence:** magnitude do +% por convergência, curva do gate (nível e gold) por nº de
  convergências.
- **Awaken:** quantos despertares, tamanho do multiplicador por tier, e as habilidades ativas.
- **Ascension:** mecânica interna do multiplicador e gatilho (entre mapas).
- **Gear:** como as 6 peças entram no ramo aditivo (flat + %), custo, e ligação com raridade
  (Hollow).
- **Áreas 2+:** faixas de nível e ×HP de cada área; nº de áreas por mapa.
- **Números:** todos — calibração por simulador, fatia por fatia.

## 8. Relação com a canon existente (o que isto revisa)
- **Combate:** adota **HP relativo** (mob = seu HP × raridade × área) como âncora — detalha e
  concretiza o "Fluxo contínuo"/Wall do `CONTEXT.md`.
- **Convergence:** agora é **+% acumulativo (aditivo) em Dano/Vida/Gold/XP** que reseta
  **nível + gold** (mantém áreas) — substitui a formulação "+15%/conv que reseta nível+gear"
  do redesign 2026-06-14. **Sem backtrack de mapa** (segue valendo).
- **Nível:** base **pequena** (~10%), potencializada pela Convergence (antes era o motor de
  stat base "automático").
- **Awaken/Ascension:** confirmados como **multiplicadores**; entram **já no Map 1**
  (Awaken sai do "movido pro Map 2").
- **Gold Stats:** seguem **aposentados** (ADR 0001).
- **Abordagem:** **v0-first incremental** + **orçamento de poder em décadas** + **simulador
  como juiz** passam a ser o método oficial de balanceamento.
