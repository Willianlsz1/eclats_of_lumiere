# 🎨 Éclats of Lumière — Art Direction Document v2
**Fonte da verdade visual do projeto.**
Ferramenta de geração: Nano Banana Pro (Gemini 3 Pro Image) · Atualizado: 2026-06-09
Companheiros: Lore Bible (narrativa) · GDD Final v2 (sistemas) · Mockup HTML v2 branco/azul (layout de UI)

**Changelog v2:** estilo oficial aprovado por teste (anime-cenário / iluminação Shinkai) · chrome de UI branco/azul · âncora de estilo nº 1 definida (cena Tikkun Olam) · todos os prompts atualizados.

---

## 1. IDENTIDADE VISUAL GLOBAL

**Estilo (APROVADO — teste Gemini validado):** ilustração de cenário estilo anime de alta produção — cores luminosas e saturadas, bloom intenso, refrações prismáticas de arco-íris, nuvens pintadas à mão com bordas nítidas, linhas arquiteturais precisas, iluminação inspirada em Makoto Shinkai. **Nunca** fotorrealismo, hiperrealismo ou look de render 3D.

**A arquitetura de três camadas (a receita que faz o Gaiadon funcionar, com a nossa identidade):**

| Camada | Estilo | Temperatura |
|---|---|---|
| **Mundo (backgrounds)** | Anime-cenário aprovado — luz viva, bloom, prismas | Vibrante, atmosférico |
| **Criaturas e cards** | Mesmo estilo, com silhuetas limpas e legíveis (são lidas em ~250px) | Vibrante, contido |
| **UI (chrome)** | Flat branco/azul — branco-gelo `#f5f8ff`, hairlines `#c2d3ef`, navy `#101a30`, azul-céu `#2e7cc4`, ciano `#37c8f0` | Fria, neutra, utilitária |

**Regra de ouro das cores:** a *interface* brilha em branco-ciano (projéteis, crit, medidor de Convergence). O **dourado de Or Ein Sof fica no MUNDO** — backgrounds, partículas, a luz vazando dos corrompidos, os olhos de Nihel. Mundo quente, interface fria — "warm world, cold clean interface".

**Tipografia:** serif elegante itálica para nomes e títulos (Cormorant Garamond); sans-serif geométrica para números (Outfit).

**Luz conta história:** toda fonte de luz em cena é, canonicamente, Or Ein Sof — fragmentos, cristais, corrupção. A luz nunca é "neutra". Nesse estilo aprovado, até a tragédia é feita de luz.

---

## 2. PALETAS POR MAPA

| Mapa | Referência aprovada | Paleta | Mood |
|---|---|---|---|
| **1. The Dreaming Wood** | Aurora teal/violeta | Azul-noite `#0c0a18` · teal luminoso `#5ee0d2` · violeta `#9d7bff` · laranja-cogumelo `#ff9a4d` · dourado `#e8b54a` | Onírico, belo, levemente perturbador |
| **2. Cavernes Luminis** | Espiral azul + cascata de luz | Azul-gelo `#a8d8ff` · ciano vibrante `#37c8f0` · roxo-cristal `#7b5cd6` · pedra fria `#1a2030` · dourado | Majestoso, frio, tempo lento |
| **3. The Ashen Ruins** | (derivada) | Cinza `#3a3a40` · névoa `#8a8a96` · brasa `#e85c2a` · raízes negras `#15131a` · dourado distante e triste | Luto, grandeza caída |
| **4. The Fractured Peaks** | (derivada da lua vermelha, sem a lua) | Negro-rocha `#121014` · lava `#ff4d1a` · céu dourado sufocante `#c9952e` · fissuras `#ff7a3c` | Hostil, verdade nua |
| **5. Nil Aeternum** | Lua vermelha + rio carmesim | Carmesim `#c41e3a` · vinho `#5c0e1e` · negro `#0a0608` · rosa-lua `#f0a8b0` · **dourado só nos olhos de Nihel** | O Nada que observa |

**Memórias de Lumière / Tikkun Olam (✅ ARTE APROVADA):** a recriação Gemini da escadaria celeste é a arte-conceito canônica — branco-dourado, azul-céu saturado, arquitetura clássica em luz plena, a esfera negra de Nihel como único escuro em cena. Usada em flashbacks de Mémoires e na cinemática do true ending. **É também a Âncora de Estilo nº 1.**

---

## 3. ENTIDADES — DIREÇÃO

**The Seeker:** figura encapuzada, rosto oculto exceto por uma faixa horizontal de luz dourada sobre os olhos. A faixa **fica mais intensa por tier** — em Lumière, a luz vaza pelas bordas do capuz. Roupas sóbrias da Ordre, tecido escuro com detalhes dourados discretos.

**Nihel, The Fracture:** entidade alada, anel de luz, fragmentos/corvos orbitando — com a correção canônica: **o brilho dele é dourado, não vermelho** ("a luz de Or Ein Sof presa dentro do vácuo"). O vermelho é assinatura do *ambiente* de Nil Aeternum; o dourado é assinatura *dele*.

**Inimigos — regra geral:** perturbadores, nunca fofos. Olhos vazios brilhando em dourado. Silhuetas limpas e legíveis em tamanho de card. Quanto mais alto o mapa, menos forma humana resta.

| Mapa | Tipos dominantes | Trio canônico (nomes p/ prompts) |
|---|---|---|
| 1 | The Fragmented | **Candlewisp Shade** · **Mothlight Herald** · **Dreamhorn Warden** (referências aprovadas pelo Willian — ver §6) |
| 2 | Fragmented/Consumed | **Crystalbound Husk** · **Prism Crawler** · **Shardlight Stalker** |
| 3 | The Consumed | **Ember Revenant** · **Rootbound Colossus** · **Ash Choir** |
| 4 | Consumed/Claimed | **Fissure Stalker** · **Magma-Scarred Titan** · **Claimed Vanguard** |
| 5 | Qliphoth/Claimed/Eidola | **Qliphoth Shell** · **Claimed Knight** · **Crimson Eidolon** |

**Boss final do Map 1 — The Gilded Hollow (The Eidola):** referência aprovada — figura em vestes claras, rosto de vazio absoluto, filigranas douradas de luz crescendo pela pele, segurando um pequeno orbe de luz. Lore: um membro da Ordre que absorveu além do procedimento — a luz o esvaziou por dentro e agora veste o que sobrou dele. É a primeira lição do jogo em forma de chefe: *os Éclats carregam algo mais*.

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
2. Cada asset aprovado vira âncora adicional da sua categoria (background aprovado → âncora de backgrounds; criatura aprovada → âncora de criaturas).
3. Nunca gere uma categoria nova sem pelo menos uma âncora anexada.

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

### Map 5 — Nil Aeternum
```
[BLOCO DE ESTILO] A dark gothic castle territory under a permanently red moon: crimson
storm clouds glowing from within, a river of luminous crimson light flowing from the
castle gate with intense bloom, razor peaks on the horizon, hooded figures with red
torches lining the path. In the castle's facade, a giant eye-like opening that watches.
The color gold appears nowhere in this scene. Wide 16:9 game background, open space
in the center and right side for UI cards. [SUFIXO]
```

---

## 6. PROMPTS — ENTIDADES (v2)

### The Seeker (retrato para o card)
```
[BLOCO DE ESTILO] Portrait of a hooded figure facing forward, face hidden in shadow
except for a single horizontal band of warm golden light glowing where the eyes would
be, the light softly blooming. Dark fabric cloak of a secretive order, subtle gold
thread details, Belle Époque elegance. Calm, mysterious, quietly luminous. Dark
background with faint golden particles and a soft prismatic glow. Vertical card
portrait, clean readable silhouette. [SUFIXO]
```

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
7. Backgrounds Maps 2-5
8. Trios de inimigos Maps 2-5 (usar as âncoras de criaturas do Map 1)
9. Nihel (arte de boss + variação para a tela de Nil Aeternum)
10. Bosses intermediários (1 por mapa — usar The Gilded Hollow como âncora)
11. Ícones de Mémoires (15) e telas de menu (Passivas, Gear, Echoes)

**Regra de produção:** gere, aprove, e a imagem aprovada vira âncora da sua categoria. Nunca gere categoria nova sem âncora anexada.
