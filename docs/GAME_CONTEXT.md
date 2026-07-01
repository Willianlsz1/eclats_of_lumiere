# Éclats of Lumière — Contexto do Jogo (onboarding)

> Documento único de contexto: o que é o jogo, como se joga, suas mecânicas, sua lore, seus inimigos e mapas, o estado do projeto e o stack técnico. Feito para que **qualquer pessoa ou modelo** entenda o jogo sem ler o resto dos docs.
> Fontes de verdade: código em `src/` (implementação real) · `docs/lore/eclats_lore.md` (narrativa) · `docs/design/*` (sistemas) · `CLAUDE.md` (regras de dev). Onde este resumo divergir do código, **o código vence**.

---

## 1. O que é o jogo

**Éclats of Lumière** é um jogo **idle / loot de navegador**, em desenvolvimento ativo, com foco atual no **Mapa 1** (o loop central). Vanilla JS, sem framework, sem build.

- **Gênero:** idle/incremental com combate automático e progressão por loot/gear + prestige.
- **Premissa:** você é um **Seeker** — um caçador de fragmentos de luz (*Éclats*) — que avança por áreas de uma floresta encantada, mata inimigos automaticamente, evolui equipamento, e cresce de forma permanente via prestige (Convergence), passivas e marcos (Awaken).
- **Tom:** melancólico, belo e "errado" — uma fantasia Belle Époque onde a luz é bela mas carrega uma ferida. A narrativa é sombria por baixo de uma superfície gentil.
- **Foco de produção:** terminar o loop do Mapa 1 (não reiniciar). Mapas 2–5 e sistemas maiores (Mémoires, Ascension) estão desenhados mas **fora de escopo de implementação** por ora.

---

## 2. O core loop (minuto a minuto)

1. O herói ataca automaticamente o inimigo da área atual (combate por tick, 10×/s).
2. Matar inimigos dá **Lumens** (moeda), **XP** (nível) e **Materiais** (drops).
3. Gasta-se Lumens pra **subir o nível do Gear** (6 peças fixas) → mais dano/vida.
4. Subir de nível/área destrava inimigos mais fortes; a parede é o **gear**, não a habilidade.
5. Ao bater o gate, faz-se **Convergence** (prestige): zera nível/área, credita Pontos permanentes.
6. Pontos destravam **Passivas** (3 árvores). Materiais promovem raridade do gear e alimentam **Awaken** (marcos permanentes, ex. *First Light*).
7. Repete, mais forte a cada volta, até fechar o Mapa 1.

**Morte não tem punição:** ao morrer, cura total e o inimigo renasce cheio. É intencional — o desafio é o muro de poder, não a sobrevivência reativa. (Exceção: a morte **zera o contador de kills** que invoca os Marcos.)

---

## 3. Mecânicas & sistemas

> Estado: ✅ implementado · 🟡 infraestrutura pronta, valores placeholder · ⏳ desenhado, não implementado.

### Combate ✅
- 10 ticks/segundo (`setInterval` 100ms). O herói ataca a cada `1 / atkSpeed` s; o inimigo a cada `0.99s` fixo.
- Projétil tem `0.5s` de voo antes do dano (casa com a animação CSS).
- Progresso offline é simulado ao carregar o save.

### Stats (computação em camadas) ✅
- Cada stat acumula em 3 camadas: `flat`, `pct`, `mult`.
- Valor final = **`flat × (1 + pct/100) × mult`**.
- Ordem das fontes: base+nível → afixos de gear → bônus de Awaken → efeitos de passiva → (conversão HP→Dano da Éclat por último).

### Gear ✅
- **6 peças fixas**, sempre equipadas, nunca dropam nem trocam: weapon, helmet, armor, gloves, boots, cloak.
- Sobem de nível com **Lumens** (custo geométrico: `gearCostBase × gearCostGrowth^(nível-1)`).
- **Raridades:** Common → Uncommon → Rare (multiplicam stats e custo). Cada raridade tem cap de nível.
- **Promoção** (ex. Common → Uncommon): exige nível máximo + materiais.

### Economia / Materiais 🟡
- `gearMaterials` (common/uncommon) pra promover raridade; `awakenMaterials` (firstLight) pra Awaken.
- Drop tables existem mas os valores são placeholder (balance ainda não fechado).

### Passivas 🟡
- 3 árvores, destravadas com **Pontos de Convergence**:
  - **Éclat** — ofensiva (ATK%, HP%, Crit, CritDmg, BossDmg, EliteDmg, HP→Dano).
  - **Vestige** — economia (Lumens%, XP%, materiais, drop rate).
  - **Fracture** — meta de Convergence (Pontos, eficiência de Awaken, redução de custo, chance de elite).
- Efeitos agregam em `passives.effects()`. Valores atuais em `data.js` são 0 (inertes até balance).

### Awaken 🟡
- Marcos **permanentes** (não é prestige). Requisitos: área alcançada, nível, kills, convergences, materiais.
- O marco do Mapa 1 é **First Light**. Magnitudes dos bônus são placeholder.

### Convergence (prestige) 🟡
- Gate atual: nível ≥ 80 (placeholder; o gate canônico é limpar a Área 3).
- **Zera:** nível, XP, Lumens, área, contadores da run. **Mantém:** gear, materiais, passivas, awakens, Pontos, recordes.
- Pontos = `área + bosses + nível + kills` (só o termo de nível está ativo hoje).
- Cada Convergence dá também +ATK% e +HP% diretos que empilham (sente forte no clique).

### Rarity Find (chance de mob raro) ⏳
- Base **0%**: sem gear nem passiva, nenhum raro aparece. **Gear acha** (sobe a chance), **passiva levanta o teto** (sobe o cap).
- Caps travados: Ember 30% · Lumen 15% · Corona 5%.

### Save ✅
- `localStorage`, chave `eclats_save_v2` (JSON). Cai pra memória se rodar via `file://`.

---

## 4. Os inimigos — Pirâmide de Poder (8 degraus) ✅

**Gancho central:** a **cor é o poder** — quanta luz de Éclat a criatura absorveu. O jogador lê a força pela cor do nome.

```
 8 · NIHEL              ápice — confrontação final
 7 · ARCHON             Chefe de Mapa (7 nomeados / nome próprio)   ┐
 6 · THE HARBINGERS     Boss de Área (1 por área, "The + …")        │ MARCOS
 5 · MINI-BOSS          encontro periódico (⏸️ parqueado)           ┘ (entidades únicas)
 4 · CORONA   (violeta) elite — tem MODIFICADOR                     ┐
 3 · LUMEN    (azul)    claramente aceso                            │ FLUXO
 2 · EMBER    (teal)    uma fagulha a mais                          │ (mesmo mob, + luz = + raro)
 1 · COMMON   (cinza)   mob base, sem tag                           ┘
```

- **FLUXO (1–4)** = o *mesmo* mob com mais ou menos luz (grau de raridade). A raridade **mapeia na espécie**: degraus 1–2 = **Fragmented**, 3–4 = **Consumed** (a luz demais racha o vaso; o modificador do Corona *é* a rachadura). Nameplate: `Thornlight Stalker · Corona`.
- **MARCOS (5–8)** = bichos próprios, únicos. Spawn por threshold de kills, nunca solo (vêm com escolta), morte zera o contador. Do Corona pra cima todos têm modificador.
- **Duas linguagens de cor:** os de **luz** (Fragmented/Consumed) sobem pela régua fria teal→azul→violeta. Os de **vazio** (Cortices/Claimed) **não acendem** — leem por **escuridão/vermelho** (proximidade de Nihel).

### Os 5 tipos (sabores, não graus) — *tipo ≠ tier*
- **The Fragmented** — tocados de leve; vítimas. · **The Consumed** — absorveram demais; o vaso racha.
- **The Harbingers** — as manifestações-chefe (ecos de luz/vazio com forma); **sempre degrau 6**, a única exceção ao tipo≠tier.
- **The Claimed** — pertencem a Nihel; vazam escuridão. · **The Cortices** — cascas vazias que destroem Éclats.

### Os 7 Archons (degrau 7)
Chefe de Mapa dos mapas ligados ao vazio (Map 2, 4 e abertos; **não** Map 3/5). Receita de nome: palavra real + estilização (como "Nihel" ← *nihil*).

| Nome | Subtítulo | Raiz |
|------|-----------|------|
| Kenoth | the First Hollow | grego *kenón* (vácuo) |
| Entropir | the Unmaking Choir | grego *entropia* |
| Umbrar | the Velvet Court | latim *umbra* |
| Nebulor | the Drowned Cartographer | latim *nebula* |
| Cinerath | the Patient Flame | latim *cinis* |
| Taciel | the Voiceless | latim *tacitus* |
| Speculor | the Last Mirror | latim *speculum* |

---

## 5. A lore (essencial)

### Cosmologia
- No princípio só havia **Or Ein Sof**, a Luz Sem Fim. Para o mundo existir, a luz teve que se quebrar: **HaShevirah, a Quebra** (o mundo de hoje a chama *La Fracture*).
- Os fragmentos da luz são os **Éclats**. Ao atravessarem o vácuo da Quebra, ficaram marcados: a luz sem cor virou **dourada** — o **dourado é a cor da ferida**, não a natureza da luz.
- Existem incontáveis Éclats-poeira e **288 Grandes Fragmentos** (cada um guarda uma memória do mundo inteiro; pulsam e chamam uns aos outros).

### Nihel — o antagonista
- **Nihel, The Fracture:** nasceu do vácuo que a luz deixou. Não escolheu existir — é a sombra inevitável da luz que partiu. É feito de **ausência**. Pelo corpo do Nada a luz sangra **dourada** (o que ele não consegue expulsar); onde não há luz pra sangrar (em *Nil Aeternum*), a cor verdadeira é **vermelho**.
- É o **trono escondido**: governa como gravidade, não como general. Apagou o nome verdadeiro (HaShevirah) e a teoria dos Éclats, porque a reunificação (Convergence) é a única coisa que o apagaria.

### A Ordre des Éclairés — o engano
- A instituição mais admirada do mundo: heróis que "protegem" enjaulando a luz solta, achando que é **misericórdia**. Sem saber, são o **sistema de descarte de Nihel** — cada Éclat absorvido é um fragmento que nunca converge. "A mentira mais perfeita": não corromper o coração da Ordre, mas dar a ela uma razão *nobre*.

### O Seeker (o jogador)
- Carrega **Le Premier Éclat** (a Semente) — a memória de ter sido inteiro. Nele, a luz não silencia: **converge**. É o que Nihel caça há milênios.
- **Simetria Tripla:** Or Ein Sof se quebrou sem escolher; Nihel nasceu sem escolher; o Seeker escolhe se quebrar (Convergence), volta após volta. A reparação do mundo não é um evento — é uma tarefa que não termina.

### A estrutura de poder de Nihel (os três braços) 🔶
- **Os Coroados (Claimed)** — escolheram o Nada e foram coroados (a sedução; Claimed Queen é a arquétipa).
- **Os Ocos (Archons + Cortices)** — nascidos do vazio (a gravidade).
- **Os Cegos (a Ordre)** — servem sem saber (o engano).
- *Fora da estrutura:* o **Ashen King** recusa Nihel e a morte — apenas permanece.

### Regra de cor (leitura simbólica, não veto de paleta)
- **Dourado** = a marca da ferida (está em toda parte; todo Éclat é dourado). **Vermelho** = o Nada sem máscara — exclusivo **contextualmente** dentro de *Nil Aeternum*. Os **Claimed vazam escuridão**, não luz.

---

## 6. Os mapas

| Mapa | Tema | Chefe de Mapa | Status |
|------|------|---------------|--------|
| **1** | Floresta (sonho/aurora) | a definir *(candidato: The Gilded Hollow)* | **em jogo** (9 áreas) |
| **2** | Relojoaria + Circo dos Pesadelos (2 biomas) | The Pale Reunion | em design |
| **3** | Ruínas da era de Lumière | The Ashen King (sub: Claimed Queen) | conceito |
| **4** | Corte Claimed | The Claimed Queen | conceito |
| **Final** | *Nil Aeternum* — o reino do Nada | **Nihel** | lore fechada (nº TBD) |

### Mapa 1 — A Floresta (o loop atual)
É um **tutorial expandido**: ensina todos os sistemas (Gear, Lumens, Convergence, Passivas, Materiais, Promoções, Awaken, First Light). 9 áreas, cada uma com um Boss de Área (Harbinger); o clímax é o Mapa inteiro.

| # | Área | Nível | Mobs (comuns) | Boss (Harbinger) |
|---|------|-------|---------------|------------------|
| 1 | The Dreaming Wood | 1–80 | Candlewisp Shade · Mothlight Herald · Dreamhorn Warden | The Waking Bloom |
| 2 | The Lantern Mire | 81–350 | Mirelight Drifter · Candlewisp Shade · Mothlight Herald | The Drowned Lantern |
| 3 | The Whispering Hollows | 351–700 | Husklight Murmur · Dreamhorn Warden · Mirelight Drifter | The Hollow Cantor |
| 4 | The Moonlit Canopy | 701–1150 | Boughlight Creeper · Mothlight Herald · Husklight Murmur | The Moonlit Sovereign |
| 5 | The Sunken Grove | 1151–1700 | Glasswater Wraith · Mirelight Drifter · Boughlight Creeper | The Stillwater Maiden |
| 6 | The Gilded Thicket | 1701–2350 | Thornlight Stalker · Candlewisp Shade · Glasswater Wraith | The Bramble King |
| 7 | The Hollow Cathedral | 2351–3150 | Hollowed Acolyte · Husklight Murmur · Thornlight Stalker | The Gilded Confessor |
| 8 | The Weeping Roots | 3151–4050 | Rootbound Weeper · Thornlight Stalker · Hollowed Acolyte | The Heartroot Mourner |
| 9 | The Hollow Sanctum | 4051–5000 | Rootbound Weeper · Hollowed Acolyte · Thornlight Stalker | The Gilded Hollow *(também Chefe de Mapa)* |

*Regra de arte: mobs da floresta não têm rosto humano.*

---

## 7. Estado do projeto & escopo

**Trabalhar em:** conteúdo/balance do Mapa 1 (9 áreas, gear, passivas, Awaken, Convergence), bugs de UI/render, dados de balance em `src/data.js`, completar sistemas parciais.

**Não tocar / não implementar agora:** Mémoires, Ascension/Divinity, conteúdo de Mapa 2+; não adicionar frameworks/bundlers/dependências/TypeScript.

**Pendências de design abertas:** Mini-Boss (degrau 5) parqueado · a "corte-vazio" (ranks Claimed/Cortices + régua de vermelho) · revisão do roster de bosses do Map 1 (e o duplo-papel do Gilded Hollow) · thresholds de kill dos Marcos (medir em sim) · menu de modificadores · divisão do Map 1 em duas temáticas.

---

## 8. Stack técnico & arquitetura

| Camada | Detalhe |
|--------|---------|
| Runtime | Navegador (Chrome/Edge) |
| Linguagem | Vanilla JS (ES6 ok; sem classes, sem módulos ES) |
| Módulos | Objeto global **`G`** — cada módulo registra `G.modulo = {...}` |
| Entrada | `index.html` carrega CSS e depois JS via `<script>` (a **ordem importa** = ordem de dependência) |
| Save | `localStorage` `eclats_save_v2` |
| Dev server | `node .claude/static-server.js` → `http://localhost:3000` |
| Testes | Nenhum |

**Mapa de arquivos (`src/`):**
- `data.js` — todas as constantes de conteúdo/balance (**tuning = só aqui**).
- `util.js` — helpers puros. · `state.js` — fonte única da verdade + cálculo de stats + save/load.
- `combat.js` — loop de tick, spawn, kill/morte, level-up, offline. · `gear.js` — as 6 peças, level-up, promoção.
- `economy.js` — materiais/drops. · `passives.js` — as 3 árvores. · `awaken.js` — marcos. · `convergence.js` — prestige.
- `ui.js` — só DOM (sem lógica). · `main.js` — init + os dois clocks (100ms combate, 1000ms UI).

**Fluxo de mutação de estado:** muta `G.state.data.*` → `invalidateStats()` se mexeu em stat → `renderAll()` (ou render específico) → `save()` se persiste. Render é **explícito** (sem reatividade). Números são só de `data.js`.

---

> Resumo em uma frase: *um Seeker caça fragmentos de uma luz que se quebrou para o mundo existir, crescendo em ciclos de sacrifício — sem saber que a instituição que o treina, e o Nada que o caça, são o mesmo inimigo.*
