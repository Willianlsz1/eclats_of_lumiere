# 🎨 Éclats of Lumière — Art Direction Document v3
**Fonte da verdade visual do projeto.**
Ferramenta de geração: Nano Banana Pro (Gemini 3 Pro Image) · Atualizado: 2026-06-10
Companheiros: Lore Bible (narrativa) · GDD Final v2 (sistemas) · Mockup HTML v3 (layout de UI)

**Changelog v3:** Maps 4 e 5 COMPLETOS e aprovados (backgrounds + trios + bosses) · **Âncora de Estilo nº 2 = NIHEL aprovado** · Map 4: trio renomeado/aprovado (Fissure Stalker, Sundered Titan, Claimed Vanguard) + boss The Claimed Queen + encontro raro The Hollowed Pilgrim · Map 5: conceito redefinido como "corte do Nada" — background cósmico (mundo se desfazendo + esfera de vazio), trio Pale Courtier / Crownless King / Crimson Wyrmlord · regra de cor expandida (Claimed vazam escuridão; dourado no Map 5 é exclusivo de Nihel). **ARTE DE MUNDO DOS 5 MAPAS COMPLETA.**

**Changelog v2:** estilo oficial aprovado por teste (anime-cenário / iluminação Shinkai) · chrome de UI branco/azul · âncora de estilo nº 1 definida (cena Tikkun Olam) · todos os prompts atualizados.

---

## 1. IDENTIDADE VISUAL GLOBAL

**Estilo (APROVADO — teste Gemini validado):** ilustração de cenário estilo anime de alta produção — cores luminosas e saturadas, bloom intenso, refrações prismáticas de arco-íris, nuvens pintadas à mão com bordas nítidas, linhas arquiteturais precisas, iluminação inspirada em Makoto Shinkai. **Nunca** fotorrealismo, hiperrealismo ou look de render 3D.

**A arquitetura de três camadas (a receita que faz o Gaiadon funcionar, com a nossa identidade):**

| Camada | Estilo | Temperatura |
|---|---|---|
| **Mundo (backgrounds)** | Anime-cenário aprovado — luz viva, bloom, prismas | Vibrante, atmosférico |
| **Criaturas e cards** | Mesmo estilo, com silhuetas limpas e legíveis (são lidas em ~250px) | Vibrante, contido |
| **UI (chrome)** | Cards escuros (navy translúcido `rgba(10,16,32,.88)`) com **molduras de luz geradas** (Seeker T1 e inimigos ✅ aprovadas), texto branco; barra superior navy `#101a30`; acentos azul-céu `#2e7cc4` e ciano `#37c8f0` | Fria, luminosa sobre escuro |

**Regra de ouro das cores:** a *interface* brilha em branco-ciano (projéteis, crit, medidor de Convergence). O **dourado de Or Ein Sof fica no MUNDO** — backgrounds, partículas, a luz vazando dos corrompidos, os olhos de Nihel. Mundo quente, interface fria — "warm world, cold clean interface".

**SISTEMA DE COR DA LUZ (APROVADO — regra mestra de todos os assets):**
- **Luz fragmentada / presa / corrompida = DOURADO quente.** Éclats soltos, a luz vazando dos corrompidos, o Gilded Hollow, os olhos de Nihel (fragmentos presos no vácuo).
- **Luz convergindo / reunida = BRANCO-AZUL frio.** A Convergence, o medidor, The Pale Reunion (quase-convergência), o Seeker em tiers altos.
- **Os Claimed vazam ESCURIDÃO, não luz.** Servos de Nihel não emitem dourado — a corrupção deles é negra (Claimed Queen, Claimed Vanguard, corte do Map 5).
- **VERMELHO = exclusivo do Map 5 (Nil Aeternum).** Nenhum vermelho nos Maps 1–4 (única exceção: o brilho vermelho dos olhos da Claimed Queen, que prenuncia o Map 5). No Map 5, o vermelho domina ambiente e inimigos — e o **dourado é exclusivo de Nihel**, a única "luz" do mapa.
- **Progressão do Seeker = progressão de cor:** a faixa nos olhos evolui de dourada (T1 — carrega fragmentos) a branca (T5 — é a convergência). Molduras de card acompanham: T1 minimalista fria → T5 filigrana celestial completa em branco-azul.

**Tipografia:** serif elegante itálica para nomes e títulos (Cormorant Garamond); sans-serif geométrica para números (Outfit).

**Luz conta história:** toda fonte de luz em cena é, canonicamente, Or Ein Sof — fragmentos, cristais, corrupção. A luz nunca é "neutra". Nesse estilo aprovado, até a tragédia é feita de luz.

---

## 2. PALETAS POR MAPA

| Mapa | Referência aprovada | Paleta | Mood |
|---|---|---|---|
| **1. The Dreaming Wood** | Aurora teal/violeta | Azul-noite `#0c0a18` · teal luminoso `#5ee0d2` · violeta `#9d7bff` · laranja-cogumelo `#ff9a4d` · dourado `#e8b54a` | Onírico, belo, levemente perturbador |
| **2. Cavernes Luminis** | Espiral azul + cascata de luz | Azul-gelo `#a8d8ff` · ciano vibrante `#37c8f0` · roxo-cristal `#7b5cd6` · pedra fria `#1a2030` · dourado | Majestoso, frio, tempo lento |
| **3. The Ashen Ruins** | (derivada) | Cinza `#3a3a40` · névoa `#8a8a96` · brasa `#e85c2a` · raízes negras `#15131a` · dourado distante e triste | Luto, grandeza caída |
| **4. The Fractured Peaks** | ✅ background v2 aprovado — mundo rachando em câmera lenta | Negro-rocha `#121014` · ouro vazando das fissuras `#e8b54a` · céu âmbar sufocante `#c9952e` rachado em escuro · fragmentos suspensos | Hostil, verdade nua — a fratura acontecendo |
| **5. Nil Aeternum** | ✅ background aprovado — fim da realidade: ruínas góticas carmesim se desfazendo, fragmentos subindo, céu rasgado revelando cosmos + esfera negra de vazio com anel vermelho | Carmesim `#c41e3a` · vinho `#5c0e1e` · negro `#0a0608` · rosa-lua `#f0a8b0` · **dourado só em Nihel** | O Nada que observa — apocalíptico e sereno |

**Memórias de Lumière / Tikkun Olam (✅ ARTE APROVADA):** a recriação Gemini da escadaria celeste é a arte-conceito canônica — branco-dourado, azul-céu saturado, arquitetura clássica em luz plena, a esfera negra de Nihel como único escuro em cena. Usada em flashbacks de Mémoires e na cinemática do true ending. **É também a Âncora de Estilo nº 1.** O background do Map 5 ecoa intencionalmente esta cena (a mesma esfera de vazio na criação e no fim — ciclo visual fechado).

**Âncora de Estilo nº 2 (✅ NIHEL aprovado):** silhueta negra alada com veias douradas (luz presa no vácuo), anel de luz quebrado como auréola partida, olhos branco-dourados, asas de fragmentos, corvos, cidade morta vermelha ao fundo. **Anexar em todas as gerações do Map 5** (paleta/atmosfera) junto da Âncora nº 1.

---

## 3. ENTIDADES — DIREÇÃO

**The Seeker (✅ ESCADA T1–T5 REDESENHADA E APROVADA — 2026-06-13):** a progressão é a tese visual do jogo — **preto humano → branco convergido**. Esta versão **substitui** a escada encapuzada de 2026-06-10 (ver nota histórica ao fim). Cânon atual:
- **Sem capuz nunca** — rosto sempre visível, desde o T1. Jovem-adulto, **fisionomia madura e bem definida** (maxilar/maçãs/nariz marcados, traços masculinos realistas, pele clara) — NÃO um rosto liso de boneco/bishōnen. Olhos azuis, orelhas levemente pontudas, brinco.
- **Paleta FRIA branco-prata da Ordre** (vermelho permanece assinatura de Nihel/corrupção — nunca no herói). Resíduo **dourado** só como "impureza que ele carrega" no início (some no T3).
- **Marcador da escada = a mecha branca cresce**: leve no T1 → domina o cabelo no T5. Ele permanece **humano** até o fim (sem "fitas de luz").
- **Luz progressiva**: o fundo/Éclats/moldura começam apagados (T1) e ficam radiantes (T5).

| Tier | Verbo | Marcadores aprovados (2026-06-13) |
|---|---|---|
| **T1 Seeker** | carrega | Iniciante frágil; uniforme **modesto** escuro com pouco trim prata e poucos acessórios de novato; cabelo preto com **fina mecha de luz**; resíduo dourado; fundo escuro/calmo |
| **T2 Illuminate** | a luz **veio** até ele | Mais seguro; veste branco-prata um degrau melhor, acessórios finos; mecha branca **maior**; segura um pequeno Éclat; um pouco de starlight surgindo |
| **T3 Éclairé** | a luz o **reconhece** | Cabelo claramente bicolor (mecha larga); **Éclat flutua sozinho** sobre a mão; ornamentos prismáticos, resíduo dourado some; starfield moderado |
| **T4 L'Éveillé** | a luz **vive** nele | Cabelo **majoritariamente branco**; **pequenos fragmentos/pigmentos de luz flutuando ao redor** (NÃO veias na pele); vários Éclats junto ao corpo; starfield forte |
| **T5 Lumière** | ele **é** a luz | Cabelo quase todo branco, sereno; **auréola circular limpa**; vestes brancas de corte mais simples; ainda **humano**; card mais **clean** (radiância calma, sem starfield denso) — plenitude, não poder |

Regra de avaliação da escada: identidade facial idêntica T1→T5; cada salto precisa de **ao menos um marcador físico legível em silhueta a 250px**. Cada tier aprovado é âncora do seguinte.

**Card = moldura + avatar FUNDIDOS (decisão 2026-06-13):** a arte do Seeker agora é um **card vertical único** (não retrato + moldura solta) — a moldura é parte da imagem, evolui por tier (simples/fria no T1 → filigrana celestial luminosa no T5), com o terço inferior reservado escuro pro texto (nome/tier/Level) e a margem externa recortada até o frame. Assets: `seeker.card_t1`…`card_t5` (`characters/seeker/seeker_card_tN`). Estilo/render e fisionomia ancorados na arte do **blacksmith** (Maël). Prompt mestre + marcadores por tier registrados na conversa de 2026-06-13.

> **Nota histórica (2026-06-10, SUPERSEDED):** a escada anterior era encapuzada (capuz no T1, faixa de luz dourada sobre os olhos, cabelo branco a partir do T2, vestes dissolvendo em fitas de luz no T5). Substituída em 2026-06-13 pela versão acima (sem capuz, fisionomia madura, mecha branca crescente, card moldura-fundida). ⚠️ O **lore bible** ainda pode descrever o Seeker encapuzado — pendente de alinhamento.

**Nihel, The Fracture:** entidade alada, anel de luz, fragmentos/corvos orbitando — com a correção canônica: **o brilho dele é dourado, não vermelho** ("a luz de Or Ein Sof presa dentro do vácuo"). O vermelho é assinatura do *ambiente* de Nil Aeternum; o dourado é assinatura *dele*.

**Inimigos — regra geral:** perturbadores, nunca fofos. Olhos vazios brilhando em dourado. Silhuetas limpas e legíveis em tamanho de card. Quanto mais alto o mapa, menos forma humana resta.

| Mapa | Tipos dominantes | Trio canônico (nomes p/ prompts) |
|---|---|---|
| 1 | The Fragmented | **Candlewisp Shade** · **Mothlight Herald** · **Dreamhorn Warden** (referências aprovadas — ver §6) |
| 2 | Fragmented/Consumed | **Crystalbound Husk** · **Luminis Pilgrim** · **Hollowflame Adept** (referências aprovadas — ver §6) |
| 3 | The Consumed | **Ember Revenant** · **Emberhorn Penitent** · **Ash Choir** (referências aprovadas — ver §6) |
| 4 | Consumed/Claimed | **Fissure Stalker** · **Sundered Titan** · **Claimed Vanguard** (✅ aprovados — ver §6) |
| 5 | Corte de Nihel (Claimed/Eidola) | **Pale Courtier** · **Crownless King** · **Crimson Wyrmlord** (✅ aprovados — ver §6) |

**Boss final do Map 1 — The Gilded Hollow (The Eidola):** referência aprovada — figura em vestes claras, rosto de vazio absoluto, filigranas douradas de luz crescendo pela pele, segurando um pequeno orbe de luz. Lore: um membro da Ordre que absorveu além do procedimento — a luz o esvaziou por dentro e agora veste o que sobrou dele. É a primeira lição do jogo em forma de chefe: *os Éclats carregam algo mais*.

**Boss final do Map 2 — The Pale Reunion (The Eidola):** referência aprovada — ser radiante branco-azul, rosto de vazio escuro com olhos brancos, espirais de luz branca formando uma auréola dupla, corpo de luz translúcida. Lore: no fundo das Cavernes, longe de qualquer Seeker, os Éclats cristalizados tentaram se reunir sozinhos — e quase conseguiram. The Pale Reunion é uma convergência incompleta: bela, serena e errada. É a lição do mapa em forma de chefe: *a luz tenta se reconstituir* — e o eco visual proposital do que o próprio Seeker se tornará no tier Lumière.

**Boss final do Map 3 — The Ashen King (The Eidola):** referência aprovada — espectro de fitas negras com coroa de espinhos, costelas de brasa dourada, lança fina. Lore: rei de um reino consumido pelas cinzas, ainda de pé sobre o que restou.

**Boss final do Map 4 — The Claimed Queen (✅ APROVADA):** armadura negra ornamentada com fios dourados opacos, coroa de espinhos, cabelos claros longos, **único brilho vermelho dos Maps 1–4** (olhos), vaza escuridão. Versão oficial = imagem aprovada em 2026-06-10 (coroa-máscara com olhos visíveis). Lore: esposa do Ashen King que ajoelhou para Nihel — o casal real partido entre Maps 3 e 4: ele resistiu e virou cinza; ela cedeu e virou rainha do Nada.

**Encontro raro do Map 4 — The Hollowed Pilgrim (✅ APROVADO):** um Consumed Seeker — o uniforme do jogador rasgado, a faixa de luz dos olhos quebrada/apagando. O jogador encontra a própria silhueta corrompida. Espelho narrativo direto do Seeker.

**Map 5 — A corte do Nada (conceito):** nos Maps 1–4 o jogador luta contra vítimas e corrompidos; no Map 5 enfrenta os que **escolheram** Nihel e foram recompensados com nobreza. Vestem o vazio como aristocracia — tudo elegante, cerimonial e morto. Nenhum membro da corte emite dourado (apenas vermelho e negro; Wyrmlord usa metal escuro fosco): **Nihel é a única luz do mapa.**

**Boss final do Map 5 / do jogo — NIHEL, The Fracture (✅ APROVADO — Âncora nº 2):** silhueta negra alada com veias de luz dourada vazando (luz presa no vácuo), anel de luz quebrado como auréola partida, olhos branco-dourados, asas de fragmentos negros, corvos orbitando, cidade morta em vermelho ao fundo. O anjo trágico — bonito e horrível ao mesmo tempo.

**Encontro raro do Map 5 — The First Éclairé (✅ APROVADO):** o primeiro membro da Ordre a alcançar o Nil Aeternum — viu Nihel e ajoelhou. Uniforme do Seeker **intacto e enriquecido** (bordados carmesim, ornamentos de espinhos — a corte o recompensou), faixa de luz nos olhos em **vermelho** (mesma assinatura do jogador, cor errada), postura de reverência cortesã com a mão sobre o peito. Espelho do Hollowed Pilgrim: o Pilgrim é quem falhou no caminho; o Éclairé é quem chegou — e escolheu errado. Prompt registrado na conversa de 2026-06-10 (âncoras: Seeker T1 + Nihel + background Map 5).

---

## 4. BLOCO DE ESTILO REUTILIZÁVEL (v2 — APROVADO)

Prefixe TODO prompt de asset com:

```
High-production anime fantasy scenery illustration, in the style of Japanese scenic
art: luminous saturated colors, intense bloom, prismatic rainbow light refractions,
lens flare, highly detailed hand-painted clouds with crisp edges, precise architectural
lines, Shinkai-inspired lighting. No photorealism, no hyperrealism, no 3D render look.
All light sources glow as if alive against their surroundings.
```

E termine com:
```
High detail, professional anime key visual quality. No text, no watermark, no signature.
```

**Workflow de consistência (obrigatório):**
1. **Âncora de Estilo nº 1 = a cena Tikkun Olam aprovada.** Anexe-a em TODA geração com "paint in exactly this art style".
2. **Âncora de Estilo nº 2 = NIHEL aprovado.** Anexar em toda geração do Map 5 (paleta vermelho/negro + linguagem do vazio).
3. Cada asset aprovado vira âncora adicional da sua categoria (background aprovado → âncora de backgrounds; criatura aprovada → âncora de criaturas).
4. Nunca gere uma categoria nova sem pelo menos uma âncora anexada.
5. Nota Nano Banana: a ferramenta tende a "vazar" cores das referências — quando a ref tiver cores fora da paleta do asset (ex.: dourado nas refs do Map 5), reforce a proibição no próprio prompt ("no gold, no warm golden glow").

---

## 5. PROMPTS — BACKGROUNDS DOS 5 MAPAS (v2)

Anexar sempre: Âncora nº 1. Para os mapas 1 e 2, anexar também a referência de paleta correspondente (aurora / espiral azul).

### Map 1 — The Dreaming Wood
```
[BLOCO DE ESTILO] A nocturnal bioluminescent mushroom forest: giant mushroom caps
glowing warm orange and gold like lanterns, a winding stream of teal and violet light
flowing across the forest floor, golden dust particles drifting in the air, deep
blue-violet night sky with a glowing teal aurora between the dark tree silhouettes,
its light refracting in faint prisms. Dreamlike, beautiful, slightly unsettling —
a dream that refuses to end. Wide 16:9 game background, open space in the center
and right side for UI cards. [SUFIXO]
```

### Map 2 — Cavernes Luminis
```
[BLOCO DE ESTILO] A vast underground crystal cavern: towering blue and violet crystals
glowing with their own inner light, crystalline corridors and descending staircases,
light refracting through the crystal faces in rainbow prisms, cold still air as faint
icy mist, reflections on polished stone. No sunlight — the crystals are the only light.
Majestic, cold, as if time moves slower here. Wide 16:9 game background, open space
in the center and right side for UI cards. [SUFIXO]
```

### Map 3 — The Ashen Ruins
```
[BLOCO DE ESTILO] Colossal ancient ruins consumed by black roots and gray mist:
broken columns that once reached the sky, embers still glowing on the scorched ground
after millennia, a soft sad golden light filtering from far away through the haze
with faint prismatic refraction. Architecture of impossible scale, now silent.
Grief and fallen grandeur rendered in light. Wide 16:9 game background, open space
in the center and right side for UI cards. [SUFIXO]
```

### Map 4 — The Fractured Peaks
```
[BLOCO DE ESTILO] Black razor-sharp mountain peaks with fissures bleeding glowing lava,
a suffocating golden-amber sky reflecting constant heat, heat shimmer and intense bloom
over the lava light, cracked rock terrain with embers drifting upward. No beauty —
only truth. The world here is still breaking, slowly and continuously.
Wide 16:9 game background, open space in the center and right side for UI cards. [SUFIXO]
```

### Map 5 — Nil Aeternum (✅ APROVADO — versão cósmica; substitui o conceito antigo do castelo)
```
[BLOCO DE ESTILO] The end of reality: ruins of a gothic crimson cathedral citadel in
the foreground, broken towers and a grand shattered stairway, dim red ember light
glowing from cracks in the stone. The world itself is disintegrating — the ground and
architecture break apart into massive floating rock fragments drifting upward into the
sky, frozen mid-collapse. Behind the crumbling world the sky is torn open, revealing a
vast cosmic void: a colossal black sphere of nothingness surrounded by swirling dark
clouds and faint starlight, dominating the upper sky. Deep red and black color palette,
crimson light leaking from fissures, black crows scattered in the air, no human
figures. Apocalyptic yet serene, melancholic, sublime cosmic horror atmosphere.
The color gold appears nowhere in this scene. [SUFIXO]
```
Notas: continuidade direta do Map 4 (mundo rachando → estágio final); a esfera de vazio ecoa a Âncora nº 1 (Tikkun Olam) fechando o ciclo visual criação→fim; sem figuras humanas para recorte limpo de gameplay.

---

## 6. PROMPTS — ENTIDADES (v2)

### The Seeker (CARD moldura+avatar fundidos — PROMPT MESTRE, 2026-06-13)
Anexar: arte do **blacksmith** (estilo de render + âncora de fisionomia, "match the
mature facial structure but keep fair skin") + Âncora de Estilo nº 1. Trocar
`[TIER MARKERS]` pelos marcadores do tier (ver tabela §3 e a conversa de 2026-06-13).
A luz do fundo e a riqueza da moldura **crescem por tier** (T1 calmo/simples → T5 radiante).
```
High-production anime key-visual illustration, very high detail, painterly rendering
and lighting quality matching the blacksmith reference. No photorealism, no 3D render
look. COLD palette only — white, silver, pale blue; NO warm ember, NO orange/gold glow,
NO red.
A young ADULT man, face fully VISIBLE, NO hood. Grounded, MATURE facial physiognomy —
defined cheekbones, firm jawline, straight nose, mature browline, realistic feature
definition like the blacksmith reference, but keep FAIR / LIGHT skin; NOT a smooth or
doll-like bishōnen face. Black hair with a WHITE STREAK in the fringe (it GROWS larger
each tier), blue eyes, slightly pointed ears. Ornate layered white-silver uniform of a
secretive luminous order, fine silver trim, small star/crescent emblems.
[TIER MARKERS]
Vertical character card, 3:4. The portrait is FUSED inside a single decorative card
frame (simple/cold at T1 → full celestial filigree at T5); behind him a faint circular
order-emblem. LOWER THIRD = calm dark area reserved for overlaid name/stats, draw NO
text. Plain dark background outside the outer border. Clean readable silhouette.
[SUFIXO]
```
*(O prompt encapuzado antigo — "hooded figure, golden light band over the eyes" — foi
aposentado em 2026-06-13; ver nota histórica na §3.)*

### Nihel, The Fracture (arte de boss)
```
[BLOCO DE ESTILO] A terrifying and beautiful dark entity: a black-winged silhouette
hovering at the center of a swirling vortex of smoke and black feathers, surrounded by
a thin ring of light. Its eyes and the ring glow trapped warm GOLD — the only gold in
the scene — golden light leaking from inside the dark figure like something imprisoned,
blooming intensely against the darkness. The environment around it is crimson and
black, ember particles, crows scattering. Beautiful and horrifying at once.
Vertical boss artwork, clean readable silhouette. [SUFIXO]
```

### Inimigos do Map 1 — referências aprovadas (anexar a referência de cada um + Âncora nº 1)

**Candlewisp Shade** (The Fragmented)
```
[BLOCO DE ESTILO] Recreate the attached creature faithfully: a slender dark ethereal
humanoid whose head is a living white-blue flame, body like a night sky filled with
faint constellations, draped in a tattered golden lattice cloak with torn wing-like
edges. Small glowing white butterflies orbit it, drawn to its flame. One pale hand
raised gently. Dark background, soft bloom on every light. Beautiful, silent,
predatory. Vertical enemy card portrait, clean readable silhouette. [SUFIXO]
```

**Mothlight Herald** (The Fragmented)
```
[BLOCO DE ESTILO] Recreate the attached creature faithfully: an elegant moth-knight —
a faceless figure in a smooth pale helmet with two long antennae, body of glossy black
chitin armor leaking warm light from its core, draped in torn white ceremonial robes,
one great luminous white moth wing on its back, holding a small iron lantern from one
clawed hand. White butterflies around it. Graceful and wrong at the same time.
Vertical enemy card portrait, clean readable silhouette. [SUFIXO]
```

**Dreamhorn Warden** (The Fragmented)
```
[BLOCO DE ESTILO] Recreate the attached creature faithfully: a towering antlered
forest deity with a dark stag-like mask face, glowing pale eyes and a third light on
its brow, vast black antlers against a purple-pink cosmic dusk sky. Its dark moss-and-
feather body opens at the chest into a blooming core of blue starlight surrounded by
small flowers, its hands cupped around the glow. Drifting light motes everywhere.
Majestic, sorrowful, vast. Vertical enemy card portrait, clean readable silhouette. [SUFIXO]
```

**The Gilded Hollow — BOSS do Map 1** (The Eidola)
```
[BLOCO DE ESTILO] Recreate the attached figure faithfully: a tall robed being in
flowing pale blue-white garments with a dark belt, its exposed skin pure black void —
the face an empty silhouette with no features — while ornate golden filigree patterns
of light grow across its chest, arms and hands like living engravings. Its hair is
made of flowing golden flame strands rising upward. One white hand holds a small
ringed orb of warm light. Dark background, the gold blooming intensely.
Divine, hollow, almost beautiful — a saint emptied by the light it carried.
Vertical boss artwork, clean readable silhouette. [SUFIXO]
```

### Map 2 — Cavernes Luminis (referências aprovadas; anexar referência + Âncora nº 1)

**Background — Cavernes Luminis**
```
[BLOCO DE ESTILO] Recreate the attached crystal cavern faithfully: a vast underground
cavern filled with towering translucent crystals in blue, violet and pink, glowing
with their own inner light and refracting it in rainbow prisms. Stone staircases
descend between crystal clusters toward a still, luminous underground lake that
mirrors everything. No sunlight — the crystals are the only light. Cold, majestic,
as if time moves slower here. Wide 16:9 game background, open space in the center
and right side for UI cards. [SUFIXO]
```

**Crystalbound Husk** (The Fragmented)
```
[BLOCO DE ESTILO] Recreate the attached creature faithfully: a humanoid figure formed
entirely of faceted translucent blue ice-crystal, sharp crystal spikes crowning its
head and shoulders, a bright star of white light burning inside its chest, two small
white glowing eyes in an angular crystalline face. Cold cosmic dark background.
A person who touched a crystallized Éclat and became its vessel. Unsettling, frozen
mid-existence. Vertical enemy card portrait, clean readable silhouette. [SUFIXO]
```

**Luminis Pilgrim** (The Fragmented)
```
[BLOCO DE ESTILO] Recreate the attached creature faithfully: a serene hooded figure
in flowing white robes and scarf, its exposed skin replaced by translucent flowing
teal-cyan light like liquid energy — arms and legs of pure luminous current — a calm
pale mask-like face with glowing cyan eyes and a faint wrong smile, walking slowly
forward leaving a trail of glowing droplets. Dark cavern background with floating
cyan motes. Graceful, peaceful, deeply unsettling. Vertical enemy card portrait,
clean readable silhouette. [SUFIXO]
```

**Hollowflame Adept** (The Consumed)
```
[BLOCO DE ESTILO] Recreate the attached creature faithfully: a tall dark-skinned
humanoid of shadow with a featureless black face and small glowing eyes, hair made of
writhing teal flame strands like serpents, glowing teal tribal patterns across its
arms and chest, ornate dark metal belt and leg armor, one hand raised holding a teal
flame. Its forearms and feet burn in translucent teal fire. Pitch black background.
A Seeker who absorbed too much — the light now wears him. Powerful, wrong, regal.
Vertical enemy card portrait, clean readable silhouette. [SUFIXO]
```

**The Pale Reunion — BOSS do Map 2** (The Eidola)
```
[BLOCO DE ESTILO] Recreate the attached figure faithfully: a radiant humanoid being of
white and pale blue translucent light, muscular luminous body like living porcelain,
a dark void face with two oval white glowing eyes, wild white flame-like hair, and two
great swirling rings of white light orbiting its head like a double halo. Flowing
ribbons of white light stream from its shoulders. Bright pale background, overwhelming
soft light, intense bloom. Beautiful, serene and wrong — light that tried to reunite
itself and almost succeeded. Vertical boss artwork, clean readable silhouette. [SUFIXO]
```

### Map 3 — The Ashen Ruins (referências aprovadas; assinatura: cinza rachada + veias de brasa DOURADA, nunca vermelha + espinhos do mapa + névoa prismática)

**Ember Revenant** (The Consumed) — figura curvada em manto negro espinhoso, cabeça facetada rachada com veias de brasa dourada, luz vazando do peito.

**Emberhorn Penitent** (The Consumed) — humanoide carbonizado de chifres com brasa nas cristas, rachaduras de luz âmbar, vestes cerimoniais queimando nas bainhas. Um sacerdote de uma fé morta, ainda servindo.

**Ash Choir** (The Consumed) — aglomerado de figuras de cinza fundidas, rostos lisos em espiral, muitos braços, veias douradas crepitando entre os corpos. Um hino silencioso em forma.

**The Ashen King** (BOSS, The Eidola) — espectro de fitas negras com coroa de espinhos, costelas de brasa dourada, lança fina. Prompts completos registrados na conversa de 2026-06-09/10; todos seguem o padrão: recriar a referência adaptada ao background do Map 3, brasa sempre dourada (nunca vermelha/azul), névoa prismática, silhueta legível.

### Map 4 — The Fractured Peaks (✅ TODOS APROVADOS — anexar Âncora nº 1 + background Map 4 + referência de cada um)

**Fissure Stalker** (The Consumed) — fissura viva: massa de matéria rachada com tentáculos espiralados, núcleo central de vazio negro vazando OURO intenso, fragmentos orbitando. Nota de produção: em recorte de card, o núcleo é a silhueta legível.

**Sundered Titan** (The Consumed) — gigante de pedra rachada acorrentado a um trono entre pilares, brasa dourada nas fissuras do corpo, cabelos negros cobrindo o rosto baixo, adoradores encapuzados ajoelhados em silhueta aos pés (vendem a escala). Prisioneiro adorado, não monstro. *(Renomeado: ex-"Magma-Scarred Titan".)*

**Claimed Vanguard** (The Claimed) — paladino em armadura branco-dourada ornamentada com VAZIO total no elmo, capa negra esfarrapada (a corrupção lê pela capa e bordas escurecidas), espada de luz dourada cravada à frente, borboletas brancas orbitando. O horror é o contraste: paladino lindo + elmo vazio.

**The Claimed Queen** (BOSS) e **The Hollowed Pilgrim** (encontro raro) — ver §3.

### Map 5 — Nil Aeternum (✅ TODOS APROVADOS — anexar Âncora nº 1 + Âncora nº 2/Nihel + background Map 5 + referência de cada um)

Regra do mapa nos prompts: *"Color palette strictly black and deep red — no gold, no warm golden glow, no white radiance."* O dourado pertence só a Nihel.

**Pale Courtier** (corte do Nada)
```
[BLOCO DE ESTILO] A dead aristocrat-priest of the court of Nothing: tall thin figure in
elaborate ceremonial black court robes with intricate crimson embroidery and thorn-like
ornaments, layered liturgical vestments. An expressionless white porcelain mask covers
the face entirely, smooth and featureless. Where skin should be visible at the neck and
hands there is only pure black void. Holding a slender ceremonial rapier with formal
duelist posture, eternally bowing etiquette. Background: dark red apocalyptic sky with
floating rock fragments and cosmic void, crimson light. Color palette strictly black,
deep red and porcelain white — no gold. Elegant, funereal, unsettling serenity.
Vertical enemy card portrait, clean readable silhouette. [SUFIXO]
```

**Crownless King** (corte do Nada)
```
[BLOCO DE ESTILO] A fallen king wandering the end of reality: broad heavy figure
standing upright in battered black ornate armor and a ragged royal mantle in tatters,
hood casting his face in complete shadow. He holds his own royal crown in both hands in
front of his chest, never wearing it. From beneath the hood, glowing red tears of light
stream down. Posture defeated and mournful, not aggressive. Background: dark red
apocalyptic sky, floating rock fragments, cosmic void above, crimson light leaking from
ground fissures. Color palette strictly black and deep red — no gold. Melancholic,
tragic, funereal grandeur. Vertical enemy card portrait, clean readable silhouette. [SUFIXO]
```

**Crimson Wyrmlord** (corte do Nada)
```
[BLOCO DE ESTILO] An aristocratic humanoid dragon knight of the court of Nothing:
elegant bipedal draconic figure with long flowing pale hair, curved black horns,
refined noble bearing. Black dragon scales covered in glowing crimson fissures,
tattered dark wings draping like a noble cape, dark gunmetal partial armor with matte
ornamentation. Piercing red eyes. Wielding a long ceremonial lance in duelist stance —
a fencer's poise, not a beast's. Background: dark red apocalyptic sky, floating rock
fragments, cosmic void, crimson light. Color palette strictly black and deep red with
muted dark metal accents — no bright gold glow, no white radiance. Elegant, menacing,
tragic nobility. Vertical enemy card portrait, clean readable silhouette. [SUFIXO]
```

**NIHEL** (BOSS FINAL) — ✅ aprovado, ver §3 e Âncora nº 2. A arte aprovada é a versão definitiva; o prompt da §6 anterior fica como registro histórico.

---

## 7. PROMPT — UI COMPLETA (v4 · chrome branco/azul)

Anexar: Âncora nº 1 (estilo) + UI dourada v3 ("keep this exact layout and composition") + mockup branco/azul (paleta de chrome).

```
[BLOCO DE ESTILO] A complete game UI screenshot for a fantasy idle RPG, desktop 16:9.
Keep the exact same layout and composition as the attached UI reference: thin top bar,
tall hero card on the left, full 3x3 grid of nine equal enemy cards on the right,
spawn thumbnails, bottom progress bar.

Restyle all interface chrome: cards and panels are ice-white surfaces with thin
light-blue borders and soft sky-blue corner ornaments, dark navy serif text on white —
like clean porcelain plaques. The top bar is deep navy with pale ice-blue icons and
two currency displays: a gold orb "48.2K" and a violet crystal "1,847", plus an ornate
white nameplate "The Dreaming Wood". HP bars stay red, the XP bar stays violet.

The hero card shows a hooded figure with a golden light band over the eyes, named
"The Seeker", with bars "158/180" and "155/200". The nine enemy cards cycle exactly
three creatures with these exact names: "Luminous Triplecap", "Fragmented Wanderer",
"Dreambound Wisp" — unsettling and corrupted, hollow golden glowing eyes, no cute or
friendly expressions, no smiling faces. No extra cards, no overlapping or floating
cards outside the grid.

The projectile, floating damage numbers, the large "CRIT" and the bottom Convergence
progress bar labeled "Convergence 62%" all glow luminous white-cyan — cold radiant
light like an aurora. The background is the nocturnal bioluminescent mushroom forest
with warm golden mushrooms and the teal-violet stream, untouched and vibrant:
warm world, cold clean interface.

Render only the texts quoted above, all crisp and legible; no other words anywhere.
[SUFIXO]
```

---

## 8. BACKLOG DE ASSETS (ordem de produção)

1. ✅ **Âncora de Estilo nº 1** — cena Tikkun Olam (aprovada; arte canônica do true ending e das memórias de Lumière)
2. ✅ UI Map 1 layout/composição (v3 dourada aprovada como referência de layout) → gerar **v4 branco/azul** (§7)
3. ✅ Background Map 1 gerado (decisão pendente: manter ou não o vórtice de Nihel no céu — recomendação: manter, foreshadowing)
4. ✅ **Trio de inimigos Map 1 APROVADO** — Candlewisp Shade, Mothlight Herald, Dreamhorn Warden (âncoras de criaturas)
5. ✅ **Boss Map 1 APROVADO** — The Gilded Hollow (âncora de bosses)
6. ✅ **Retrato do Seeker Tier 1 APROVADO** — rosto humano + faixa dourada + vestimenta da Ordre (âncora do personagem). **ARTE DO MVP MAP 1 COMPLETA.**
7. ✅ **Map 2 visual APROVADO** — background Cavernes Luminis + Crystalbound Husk, Luminis Pilgrim, Hollowflame Adept + boss The Pale Reunion
8. ✅ **Map 3 visual APROVADO** — background Ashen Ruins + Ember Revenant, Emberhorn Penitent, Ash Choir + boss The Ashen King
9. ✅ **Map 4 visual COMPLETO** — background v2 + Fissure Stalker, Sundered Titan, Claimed Vanguard + boss The Claimed Queen + encontro raro The Hollowed Pilgrim
10. ✅ **Map 5 visual COMPLETO** — background cósmico + Pale Courtier, Crownless King, Crimson Wyrmlord + boss NIHEL (**Âncora de Estilo nº 2**). **ARTE DE MUNDO DOS 5 MAPAS COMPLETA.**
11. **Kit de UI:** molduras Seeker T1 + inimigos ✅ · ícones de moeda ✅ · 7 ícones da nav (Seeker, Gear, Passivas, Echoes, Mémoires, Ascension, Convergence) ✅ — **KIT FUNCIONAL DO MVP COMPLETO** (integração CSS pendente, aguardando acesso ao PC)
12. ⏭️ **Próximos (ordem recomendada):**
    a. ✅ Encontro raro Map 5 — "The First Éclairé" APROVADO (2026-06-10). **MAP 5 100% COMPLETO.**
    b. ✅ **Molduras de tier T1–T5 APROVADAS** (2026-06-10) — progressão: T1 minimalista fria → T2 cantos estrelados + meio-anel → T3 volutas barrocas → T4 banda ornamental contínua, luz mais branca → T5 Lumière: luz branca pura, auréola completa de raios no emblema, estrelas de convergência nos cantos. **T5 aprovado em caráter provisório** (pontos de atenção: raios invadem o centro — resolver via camadas no CSS ou ajustar; bloom no limite da legibilidade em 250px; emblema pode ganhar versão própria no futuro). Prompts registrados na conversa de 2026-06-10; cada moldura aprovada é âncora da seguinte.
    c. ✅ **Seeker Tiers 2–5 (retratos) APROVADOS** (2026-06-10) — escada completa T1–T5, ver §3. Cada retrato casa com a moldura do seu tier.
    d. ✅ **Molduras de inimigos + bosses APROVADAS** (2026-06-10). DECISÃO DE DESIGN: inimigos comuns usam **uma moldura universal** — espinhos retorcidos em cinza-pálido neutro, traço fino, glow frio sutil (substitui a moldura de inimigos do kit antigo do Map 1). Apenas os **5 bosses finais** ganham moldura diferenciada, todas derivadas da base espinhosa ("boss ainda é inimigo"), cada uma corrompida pela assinatura do seu boss, com emblema próprio no topo:
       - **M1 Gilded Hollow:** filigrana dourada tomando os espinhos · emblema: orbe anelado dourado
       - **M2 Pale Reunion:** espinhos transfigurados em luz branca, fitas tecidas · emblema: espiral/auréola dupla incompleta
       - **M3 Ashen King:** espinhos carbonizados, brasas DOURADAS (nunca vermelhas), cinzas · emblema: coroa de espinhos em brasa
       - **M4 Claimed Queen:** espinhos negros densos, névoa de escuridão, ouro fosco trançado · emblema: coroa negra com gema VERMELHA única (único vermelho dos frames M1–M4)
       - **M5 NIHEL:** estrutura própria — galhos orgânicos vivos negros com fissuras vermelhas, fragmentos se desprendendo · emblema: anel de luz dourada QUEBRADO (único ouro do frame)
       - **Linguagem dos emblemas = os três estados da convergência:** auréola fechada (Seeker T5) · auréola incompleta (Pale Reunion) · auréola quebrada (Nihel).
       - Prompts registrados na conversa de 2026-06-10. Receita de âncoras de boss frame: moldura comum + arte do boss (+ ref estrutural só no Nihel).
    e. Echoes (pets) — **EM STANDBY por decisão de Willian (2026-06-10):** conceito visual e histórias ainda não definidos; não gerar arte nem propor direção até ele retomar o tema
    f. ✅ **MÉMOIRES — ARTE DE RELÍQUIA ILUSTRADA (15) APROVADA** (2026-06-10) — **substitui os 15 medalhões flat** (gerados e aprovados antes na mesma data, agora DEPRECIADOS; podem sobreviver como mini-ícones de lista). Decisão de Willian: Mémoires e passivas ganham arte ilustrada individual estilo gacha (refs: ampulheta estrelada, lanterna espectral, orbe Granblue) em vez de ícones flat — mais trabalho, mais qualidade e originalidade.
       - **BLOCO DE ESTILO DE RELÍQUIA:** "Ornate anime fantasy relic illustration, painterly anime style like high-quality gacha game item art: a single beautiful magical object centered on a plain very dark navy background, rich ornamental detail, soft magical glow and floating light particles, elegant and mysterious. No photorealism, no 3D render, no text, no watermark." Paleta das Mémoires: branco-dourado quente (Tikkun Olam).
       - Os 15 objetos: **E1** espelho que guarda o amanhecer (Premier Matin) · caixa de música com figuras de luz dançando (Rires) · botas com trilha de pegadas de luz (Marche). **E2** cinzel + estátua despertando em luz (Forme) · bigorna com fagulha sendo forjada (Façonnage) · lanterna-relicário com cristais (Profondeurs). **E3** esfera armilar com anel rachado e estrela caindo (Chute) · urna com última brasa (Cendres) · lira de corda partida com nota suspensa (Dernier Chant). **E4** coração de mármore enfaixado vazando luz (Blessure) · escudo florescendo pelas rachaduras (Résistance) · ampulheta quebrada com areia congelada no ar (Temps Brisé). **E5** suporte relicário com esfera negra que devora partículas (Vide) · MESMO suporte com esfera de luz radiante — par espelhado (Lumière Entière) · balança perfeitamente nivelada com vazio e luz (Choix).
       - Prompts registrados na conversa de 2026-06-10; cada relíquia aprovada é âncora das seguintes.
    f2. ⏳ **PASSIVAS — 45 artes ilustradas EM ANDAMENTO** (3 árvores × 15; nomes no GDD §7). Mesmo estilo de relíquia, produção em folhas de 3 (validada). Identidade de cor: **Éclat = branco-azul** (exceção: Or Ein Sof's Touch em branco-dourado) · **Vestige = teal** · **Fracture = violeta-escuro** (sem vermelho). **Progresso 2026-06-10: Éclat 15/15 ✅ COMPLETA** (5 folhas aprovadas) · **Vestige 9/15** (folhas 1–3 aprovadas: Lumen's Blessing, Wisdom of Ruins, Remnant Harvest / Vestige Pull, Scavenger, Dreamwalker / Beast Caller, Hoarder, Awakened Harvest; folha 4 — Echo of Greed, Void Scavenger, Eternal Vestige — prompt entregue, geração pendente; folha 5 — Fractured Soul, Luminal Cache, The Collector — pendente) · **Fracture 0/15** (5 folhas pendentes: Weakened Void, Fracture Sense, Void Awareness / Fracture Pulse, Void Haste, Shard Disruption / Nihel's Shadow, Éclat Attunement, La Fracture's Echo / Last Light, Void Collapse, The Fracture's Gift / Claimed Domination, Nil's Embrace, Void Endurance). Prompts das folhas aprovadas registrados na conversa de 2026-06-10.
    g. Telas de menu (Passivas, Gear, Echoes) — referência de layout da tela de Gear: organização estilo Gaiadon (grid de slots com fundo colorido pela raridade, tag de level, tooltip lateral, aba Upgrade com materiais)
    h. ✅ **GEAR — ARTE COMPLETA (6 peças × 5 raridades) APROVADA** (2026-06-10):
       - **Mudança de peça:** Crown of Hollow Stars → **The Silent Vigil** (elmo; coroa virou linguagem de reis caídos). Set final: The Waning Edge (espada) · Veil of Cinders (manto) · The Silent Vigil (elmo) · Grasp of the Unnamed (manoplas) · The Last Resonance (amuleto-sino) · Band of Dusk (anel).
       - **Raridades na lore** (substituem Common→Legendary): **Faded** (cinza) → **Kindled** (teal) → **Luminous** (azul) → **Radiant** (violeta) → **Converged** (branco-prismático). Futuras: **Primordial** (branco-dourado Tikkun Olam) e **Ein Sof** (prismático arco-íris). Nada de dourado-quente nem laranja-Legendary: o topo é convergência.
       - **Decisão de design:** raridade evolui a **FORMA** da peça (cada tier é uma versão fisicamente diferente, do bruto à obra-prima — silhueta-base e motivo mantidos); a **COR da raridade fica no fundo do box/slot via CSS**, não na arte. Produção em folha-escada: 1 folha por peça com os 5 estágios lado a lado.
       - **BLOCO DE ESTILO OFICIAL DE GEAR:** "Anime fantasy concept art style, strongly stylized: bold visible outlines, flat cel-shaded coloring in two or three tone steps, simplified expressive shapes, minimal texture detail, soft bloom only on glowing elements — like concept art from a high-quality anime or JRPG artbook. Absolutely no photorealism, no realistic rendering, no 3D render." (O termo "painted illustration style" foi BANIDO — puxa render realista.)
       - Assinaturas por peça: crescente na guarda (Edge) · brasas esmaecendo, nunca fogo vivo (Veil) · recriação fiel da ref EV Ganiin (Vigil) · dedos agarrando algo invisível (Grasp) · badalo de cristal, relíquia silenciosa (Resonance) · gradiente do crepúsculo + gema-estrela no ponto do ocaso (Band). Sem vermelho em nenhuma peça.
       - Prompts das 6 folhas registrados na conversa de 2026-06-10; recorte individual dos 30 estados entra no pipeline técnico do PC.
    g. **Nota técnica de integração (molduras + retratos no jogo):** NÃO fundir moldura e avatar em um arquivo; usar 2 camadas (`<img>` retrato + `<img>` moldura com centro transparente em `position:absolute`), moldura reutilizada entre cards (1 decode). Pipeline de otimização: recortar o miolo navy das molduras (transparência), redimensionar para 2× o tamanho de exibição (~500–600px), converter para WebP q~80. Glow assado na imagem, nunca `filter`/`box-shadow` animado; animações só com `transform`/`opacity`. Plano B se houver lag: pré-composição offline (script Node + sharp). Vira CP no Claude Code quando houver acesso ao PC.
    c. Molduras de card dos inimigos Maps 2–5 (padrão do kit existente)
    d. Echoes (pets) — nunca iniciados
    e. Ícones de Mémoires (15) e telas de menu (Passivas, Gear, Echoes)

**Regra de produção:** gere, aprove, e a imagem aprovada vira âncora da sua categoria. Nunca gere categoria nova sem âncora anexada.
