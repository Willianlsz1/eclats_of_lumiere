# GRILL ME WITH DOCS — Éclats of Lumière (Continente 1 / Era I)

> Modo entrevista adversarial. Cada pergunta está **ancorada num documento ou
> numa linha de código real** e expõe uma contradição concreta. O objetivo não é
> punir — é forçar uma decisão canônica para cada inconsistência aberta.
>
> Fonte: auditoria de 3 frentes (código `src/`, documentação `docs/`,
> cruzamento código↔canon). Data: 2026-06-23.

---

## PARTE 0 — Síntese (antes do grill)

### Acertos (o que está certo e maduro)
1. **Arquitetura de save/load robusta.** `state.load()` + `reconcile()` por módulo
   (gear, economy, memoires) + saneamento de estado inválido. Saves antigos sobem
   sem quebrar. Isto está coberto por testes (`memoires-discovery.test.js` §11–12,
   `enemies.test.js` §12).
2. **Disciplina de testes.** 11 arquivos de teste verdes, determinísticos, com
   shims de `window`/`localStorage`. Mecanismos isolados de produção (ex.: zerar
   `discoveryTable` para testar o roll).
3. **Mémoires como sistema completo e coeso** (`memoires.js`): estados
   `notFound→found→restored`, níveis Lv1–Lv10, pity anti-azar, Era Restaurada
   derivada. Fechado e testado (5 arquivos de teste).
4. **Camada de stats consistente** (`flat × (1+pct/100) × mult`) e curva de HP de
   duas camadas (`mobHpAt`) que se manteve coerente ao estender p/ 20 áreas.
5. **Workflow CP** (Change Package) disciplinado: infra-primeiro, placeholders
   marcados, balanceamento adiado p/ Fase 3. Bom para manter o jogo sempre verde.

### Onde você está errando (padrões, não bugs isolados)
- **Canon fragmentado sem "single source of truth".** O `CANONICAL_ALIGNMENT_AUDIT_V1`
  recomendou criar um `CANON_V2` consolidado — **nunca foi criado**. Hoje a verdade
  está espalhada por ~6 docs que se contradizem.
- **Documento que se intitula "canônico" está obsoleto.** `CONSTITUICAO.md` ainda
  diz "9 áreas" e "Boss Final na Área 9" — e não tem aviso de obsolescência.
- **Especificar mais rápido do que reconciliar.** Cada nova spec (MEMOIRES_V1,
  MAP1_FINAL_SPEC, ASCENSION_SYSTEM_V1) entrou sem retirar/atualizar a anterior.
  O resultado é decisão "implícita por recência", nunca declarada.
- **Placeholders viram dívida silenciosa.** Itens "dead/orphan" se acumulam
  (`spawnCount`, `awakenDropChance`, `data.tiers[].level`, `loot.js`/`inventory.js`
  dormentes) sem um registro do que é provisório vs. abandonado.
- **UI não acompanhou a expansão para 20 áreas.** O World Map ficou para trás.

### Fora de lugar (itens concretos)
- `src/ui.js:450` — `mapNodePos` tem **apenas 9 posições**; áreas 10–20 caem todas
  em `[50,50]` (`pos[i] || [50,50]`, `ui.js:507`). Os nomes nos comentários do array
  (ex.: "The Hollow Sanctum") **não batem** com `data.js` (Área 9 = "The Guardian").
- `src/combat.js:327` — log do Boss Final da Área 20 diz **"The Dreaming Wood falls
  silent … Map 1 complete"** (texto da Área 1 / nomenclatura "Map 1").
- `src/data.js` (IIFE final) — áreas 10–20 **reusam `areas[8].enemies` por
  referência compartilhada** (risco de mutação cruzada).
- `src/memoires.js:2` — header diz "implementa SOMENTE a descoberta… NÃO há
  restauração/níveis/Ascension" — **falso hoje** (o arquivo tem tudo isso).
- `data.tiers` (`data.js:9`) — `level:` morto; **duplica** `ascension.RANKS`.
- `convergence.gateLevel = 80` (`convergence.js:20`) — cai na Área 2; canon diz Área 3.

### Inconsistências reais (lista para resolver no grill)
Detalhadas abaixo, por sistema.

---

## PARTE 1 — O GRILL (perguntas ancoradas)

### A. Mémoires — mecânica ou narrativa?
> **A1.** `CANONICAL_ALIGNMENT_AUDIT_V1` §3 diz que Mémoires dão bônus mecânico
> (Clarté, ×1.07^Σ). `MEMOIRES_V1` (mais recente) trata Mémoires como restauração
> com **Éclats**, sem Clarté. O código (`memoires.js`) **não tem Clarté**.
> **Pergunta:** Mémoires restauradas concedem bônus mecânico (Clarté) ou são puro
> progresso de Era? Se sim, qual a fórmula e por que ela some de `MEMOIRES_V1`?
>
> **A2.** `memoires.js:2` afirma que o módulo "implementa SOMENTE a descoberta".
> O módulo tem `restore`, `upgrade`, `isEraRestored`. **O header está mentindo —
> qual a fonte da verdade: o header ou o código?**
>
> **A3.** `state.fresh()` **hardcoda** `memoires:{…}` duplicando `memoires.freshSet()`.
> Se você mudar o set canônico só num lugar, o outro diverge. **Quem é dono do
> conjunto inicial de Mémoires — `state.js` ou `memoires.js`?**

### B. Awaken / Despertar — identidade e gate
> **B1.** Dois nomes circulam: "Awaken" (código, `awaken.js`, "First Light") e
> "Despertar" (docs). **É o mesmo evento? Qual nome é canônico?**
>
> **B2.** Canon (`CONTINENT1_CANON`, `MAP1_FINAL_SPEC`): o **Guardião da Área 9**
> é o gate do Awaken. Código (`awaken.js:25`): o requisito `area` é satisfeito por
> `(maxAreaUnlocked||0)+1` — ou seja, **desbloquear** a Área 9, não **derrotar** o
> Guardião. **O Awaken deve exigir matar o Guardião? Hoje não exige.**
>
> **B3.** `data.awakens.first_light.requirements` inclui `level:4051`,
> `convergences:8`, `materials.firstLight:1`. **Esses números são canônicos ou
> placeholders?** Nenhum doc os declara. Se placeholder, onde está registrado?

### C. Ranks / Ascensão — duas escadas
> **C1.** Existem **duas escadas de rank** concorrentes:
> `ascension.RANKS = [Seeker, Illuminate, Éclairé, L'Éveillé, Lumière]`
> (`ascension.js`) vs. uma escada Mortal→Radiant Ascendant em docs antigos, vs.
> `data.tiers` (5 tiers por nível, agora indexado por `ascension.count()` em
> `ui.js`). **Qual escada é canônica? As outras duas saem?**
>
> **C2.** `data.tiers[].level` é **dado morto** (rank agora é por ascensão).
> **Removemos `data.tiers` e ficamos só com `ascension.RANKS`, ou há razão p/ manter?**
>
> **C3.** O canon de Ascensão diz que ela concede "compreensão", não Mémoires.
> No código, `ascend()` só incrementa `ascensions` e sobe rank. **A "compreensão"
> tem efeito mecânico previsto, ou é narrativa? Se mecânico, está especificado?**

### D. Moedas / Recursos
> **D1.** Éclats são, ao mesmo tempo, a **memória da luz quebrada** (lore, `LORE`/
> origem) e a **moeda de restauração** (gameplay, `economy.js`/`memoires.js`,
> `eclatsPerBoss:1`/`eclatsPerMiniBoss:1`). **Isso é intencional (o fragmento É a
> moeda) ou colisão de nomes?** Se intencional, está dito em algum doc?
>
> **D2.** `LORE` fala em **Vestiges**; o código de Convergência usa
> `convergencePoints` (`convergence.js:83`). **Vestiges == convergencePoints?
> Por que o nome canônico não aparece no código?**

### E. Áreas / Boss Final / Nomenclatura
> **E1.** Código chama a Parte II (áreas 10–20) de **"Cavernes Luminis"**; docs
> chamam isso de **"Mapa 2"**. **Cavernes Luminis é Parte II do Continente 1 ou é
> o Mapa 2? São a mesma coisa ou duas?**
>
> **E2.** `CONSTITUICAO.md` (auto-intitulada canônica) diz **9 áreas** e **Boss
> Final na Área 9** (linhas 294/298/506). O código tem **20 áreas** e Boss Final
> na **Área 20**. **A CONSTITUICAO está obsoleta, ou o canon de 20 áreas é que
> está errado? Uma das duas tem que mudar.**
>
> **E3.** `combat.js:327` loga "The Dreaming Wood… Map 1 complete" ao matar o
> Boss Final da Área 20 ("The Gilded Hollow"). **Texto órfão da Área 1 — corrigir
> para quê? Qual o evento narrativo canônico do fim do Continente 1?**
>
> **E4.** `ui.js:450` — World Map tem 9 nós; áreas 10–20 colapsam em `[50,50]`
> e os nomes nos comentários (ex.: "The Hollow Sanctum") divergem de `data.js`.
> **A Parte II aparece no mapa? Se sim, com que layout? Se não, por quê?**

### F. Convergence
> **F1.** `convergence.gateLevel = 80` (`convergence.js:20`) abre na **Área 2**;
> o comentário admite que o canônico é **Área 3** (~nível 350–500). **Qual o gate
> canônico — e por que o placeholder ainda está em produção?**
>
> **F2.** `data.js` referencia `convergence.gateLevel`. **A Convergência é gateada
> por nível ou por área?** Os dois conceitos aparecem misturados.

### G. Passivas / Fracture
> **G1.** Boa parte da árvore de passivas é **comprável mas inerte** (`UNIT=0`).
> **Isso é intencional (placeholder de balanceamento) ou bug?** O jogador gasta
> pontos sem efeito.
> **G2.** No código, **Fracture = bônus de HP**; no design, **Fracture =
> metaprogressão / La Fracture (o evento cósmico)**. **O nó "Fracture" da árvore
> de passivas e a "Fracture" da lore são a mesma coisa? Se não, renomear qual?**

---

## PARTE 2 — Decisão pendente nº1 (recomendação)
**Criar `docs/CANON_V2.md`** como única fonte da verdade do Continente 1 / Era I,
declarando explicitamente, para cada item acima, qual doc/linha prevalece — e
marcar `CONSTITUICAO.md` e specs superadas como `[SUPERSEDED por CANON_V2]`.
Sem isso, toda spec futura vai reabrir as mesmas contradições.
