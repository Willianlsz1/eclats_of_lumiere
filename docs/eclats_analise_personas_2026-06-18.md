# Éclats — Análise crítica por personas + público-alvo (2026-06-18)

> Análise pedida pelo Willian após jogar **só o Map 1**. Base: pesquisa do gênero
> (idle/incremental RPG) + simulação real (`tools/sim/personas.mjs`, `map1_report.mjs`,
> `game_harness.mjs`). Foco em ser **crítico e acionável**, não elogioso.

---

## 1. O público-alvo deste gênero (pesquisa)

**Quem são** (refs: Melvor Idle, NGU Idle, Antimatter Dimensions, Realm Grinder):
- O núcleo retido é o **"optimizer"** — quem curte *otimizar sistemas*, não clicar. A graça é
  "produce → upgrade → prestige → repeat", cada ciclo destravando crescimento mais rápido.
- Jogos com **muitas camadas de prestígio** têm "pernas" longas — Melvor/AD seguram **200–500h**.
- O jogador migra de **executor → estrategista**: o clique vira opcional, a atenção vai pra *decisões*.
- Pagam por experiência **limpa** (sem ad): Melvor/Idle Iktah pagos retêm mais que os free.

**Benchmarks de retenção** (mobile idle, referência): D1 **35–40%**, D7 **10–15%**, D30 **5–10%**.
Idle tem stickiness ~**18%** (vs 10,5% hyper-casual), sessões ~8 min, várias/dia.

**Por que abandonam** (o achado mais importante p/ nós):
- **"Content desert" do mid-game** dirige a MAIORIA do churn: prestígios repetitivos sem novidade.
- Alguns saem no **early** (acham "Skinner box" sem decisão); outros no **grind** (acham que é só clicar).
- Onboarding: o **hook é nos primeiros 0–30 min** (gratificação imediata + complexidade revelada aos poucos).

---

## 2. As 3 personas

### 🏆 PRO — "Diego, o no-lifer otimizador" (10h ativo/dia, 4 logins)
- 22, joga NGU/AD/Melvor, lê wiki, busca o build ótimo. Quer **decisões** e **números explodindo**.
- **No nosso jogo:** limpa o **Map 1 em ~1 dia**. Problema: depois de ~30 min ele já **viu todas as
  decisões** (comprar a peça mais barata, convergir no gate, despertar quando dá). Não há build, nem
  trade-off, nem otimização real. Ele vai achar **raso** e sair na transição pro Map 2 se não houver
  profundidade. É o público que mais **valoriza** o jogo E o mais fácil de **perder por falta de teto**.

### 🌓 CASUAL — "Marina, 1,5h/dia em 2 sessões" (almoço + noite)
- 30, joga no celular nos intervalos, gosta de **voltar e ver progresso**. Não otimiza; segue o óbvio.
- **No nosso jogo:** Map 1 em **~2–3 dias**. É a persona **mais bem servida** hoje — o loop "volto,
  gasto o banco, subo de área" funciona pra ela. Risco: as **13 convergences** do Map 1 podem cansar
  ("de novo resetar o nível?") — é exatamente o "content desert" que o gênero avisa.

### 🌙 LIGHT — "Caio, abre 15 min/dia, 1 login" (banco offline)
- 38, pai, joga no busão. Quer **zero fricção**: abrir, coletar, fechar.
- **No nosso jogo:** Map 1 em **~3 dias** (offline atual) — **quase tão rápido quanto o PRO**. Esse é
  o **sintoma do problema #1**: o offline está fazendo o jogo *sozinho*.

| Persona | ativo/dia | **offline ATUAL (100%/30d)** | **offline INTENCIONAL (8h×40%)** |
|---|---|---|---|
| PRO | 10h | **1 dia** · 14 conv · gear 178 | **1 dia** |
| CASUAL | 1,5h | **2 dias** · 10 conv · gear 164 | **3 dias** |
| LIGHT | 0,25h | **3 dias** · 9 conv · gear 169 | **6 dias** |

---

## 3. Análise crítica (priorizada)

### 🔴 P0 — O offline faz o jogo sozinho (o problema central)
O código roda o combate **100% offline, teto de 30 dias** (o GDD §15 queria **8h × 40%**, nunca foi
wirado). Resultado: o LIGHT (15 min/dia) chega quase junto do PRO (10h/dia) — **40× mais tempo rende
só 3× mais rápido**. Mata o incentivo de jogar ativo, que é onde mora a diversão (otimizar, decidir).
- **Fix:** wirar `OFFLINE.maxSeconds = 8h` + eficiência **40%** (campo novo). No sim isso reabre o
  leque pra **1 / 3 / 6 dias** — o ativo passa a valer, e o LIGHT ganha um Map 1 de ~6 dias (alinhado
  ao "5 mapas ≈ 30 dias").

### 🔴 P0 — Falta AGÊNCIA / decisão (o que retém o gênero)
O núcleo retido são **otimizadores**, e hoje **não há o que otimizar**: comprar é "a peça mais barata",
convergir é "no gate", despertar é "quando libera". Tudo é **automatizável e óbvio** — não há build,
trade-off, nem escolha que importe. O PRO enjoa em 30 min.
- **Fixes candidatos (escolher 1-2 já no Map 1):** (a) o jogador **distribui** pontos/foco entre peças
  com trade-off (dano vs sobrevivência vs Gold); (b) escolher *qual* afixo subir; (c) decidir **quando**
  convergir (cedo = mais ciclos baratos, tarde = mais bônus) com um trade-off real; (d) o Despertar
  exigir uma **escolha** (ex.: 1 de 3 bênçãos). Sem isso, o jogo é um "Skinner box" pro público-alvo.

### 🟠 P1 — Convergence vira "content desert" (13 resets/Map 1)
13 convergences resetando o nível é **repetição** — o gênero avisa que prestígio repetitivo é o
**maior motor de churn** no mid-game. Cada uma é mecanicamente idêntica.
- **Fix:** menos convergences **com mais peso cada** (ex.: gate ×1,5 → ~8-9 no Map 1), e/ou cada
  convergence **destrava algo** (um afixo, um slot, um %); dar **textura** (não ser sempre igual).

### 🟠 P1 — Map 1 curto demais pro PRO, e sem "teto"
Mesmo com offline corrigido, o PRO limpa em **~1 dia** e não tem o que perseguir (sem leaderboard,
sem desafio opcional, sem "fazer melhor"). O gênero segura o PRO com **metas paralelas** (achievements,
speed-run, dificuldades, coleções).
- **Fix:** uma meta opcional já no Map 1 (ex.: limpar com X convergences, ou um modo "mais rápido").

### 🟡 P2 — Crit é stat morto cedo
`crit damage base ×1`: um crit **não faz nada** até o Despertar (área 7, ~horas). A Luva sobe *crit
rate* o jogo todo, mas crit rate sem crit damage = inútil. O jogador vê "crit 15%" e não sente efeito.
- **Fix:** dar um piso de crit damage (ex.: ×1,5) OU esconder/atrasar o stat de crit até o Despertar.

### 🟡 P2 — Portão do Despertar enfraqueceu (base 800)
Com o gear mais fraco (base 800), a Wall sem Despertar virou "**~3× mais lento**", não "**impossível**".
Um jogador pode **brutar** sem engajar o sistema — perde o momento de "chave" que o Despertar deveria ser.
- **Fix:** subir HP da Wall (você já autorizou "aumentar HP dos mobs") OU travar a área 9 atrás do
  Despertar.

### 🟡 P2 — Curva de ameaça não-monotônica
Áreas 2–4 são proporcionalmente **mais letais** que 5–6 (o `areaHp` sobe mais rápido que `areaDmg` no
meio), então o "perigo" oscila em vez de crescer. Confunde a leitura de progresso.
- **Fix:** suavizar `areaDmg`/`areaHp` pra a ameaça crescer monotônica.

### ✅ O que está BOM (manter)
- **Pilha de camadas** (Nível · Gear · Convergence · Despertar · Gilded) = a estrutura certa do gênero
  ("muitas camadas = pernas longas").
- **Hook inicial no tempo certo:** 1ª Convergence em ~28 min (dentro da janela 0–30 min).
- **Gilded** adiciona variância/"momentos" (bom — o gênero ama "números loucos").
- **Mobs relativos ao player** mantêm os números sempre relevantes.
- **Custo geométrico** padrão do gênero (base pequena, escala) = familiar pro público.

---

## 4. Top 3 ações recomendadas (ordem)
1. **Wirar offline 8h × 40%** (P0, fácil) — devolve valor ao jogo ativo; reabre 1/3/6 dias.
2. **Injetar 1 decisão real no loop** (P0) — começar pelo "quando convergir" com trade-off, ou escolha
   de afixo. É o que separa "Skinner box" de "jogo de otimização".
3. **Reduzir/texturizar as convergences** (P1) — menos resets, cada um com novidade, p/ evitar o
   content desert que derruba o mid-game.

> Fontes: ver o resumo de pesquisa no chat (Melvor/NGU/AD, GameAnalytics, mobilefreetoplay,
> r/incremental_games, Pecorella).
