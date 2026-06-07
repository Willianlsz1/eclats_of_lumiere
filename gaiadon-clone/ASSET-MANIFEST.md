# Asset Manifest — Gaiadon: Eternal Quest

All enemy/hero/equipment images use **black background** PNG (the CSS uses `mix-blend-mode: lighten` to make black transparent automatically — no editing needed).
Region backgrounds are full opaque scenes.

**Style**: Dark fantasy, hyper-detailed, cinematic lighting, concept art — like AAA game creature design.

> **Workflow**: Generate each image with Gemini → save to the file path listed → refresh the game. The emoji fallback disappears automatically when the image file exists.

---

## 1. Hero Portraits (5 images)

**Dimensions**: 240×240 px (displayed at 120×120, 2× for retina)
**Style**: Upper body portrait, facing forward, dark fantasy. Each tier progressively more powerful.

| # | File Path | Tier | Prompt |
|---|-----------|------|--------|
| 1 | `assets/hero/adventurer.png` | Common | Dark fantasy RPG character portrait, young adventurer with basic leather armor, simple steel sword, hopeful but determined expression, upper body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 2 | `assets/hero/warrior.png` | Uncommon | Dark fantasy RPG character portrait, experienced battle-hardened warrior with iron plate armor and scars, confident powerful stance, faint green magical aura, upper body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 3 | `assets/hero/champion.png` | Rare | Dark fantasy RPG character portrait, elite champion in ornate blue steel armor with glowing runic engravings, wielding a radiant sword, blue magical energy swirling, upper body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 4 | `assets/hero/legend.png` | Epic | Dark fantasy RPG character portrait, legendary hero in enchanted purple crystal armor, ethereal arcane weapons floating around body, wise powerful gaze, purple energy aura, upper body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 5 | `assets/hero/mythic.png` | Legendary | Dark fantasy RPG character portrait, mythic godlike being in radiant golden celestial armor, divine wings of light emanating from back, crown of stars, golden holy aura, transcendent expression, upper body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |

---

## 2. Region Backgrounds (5 images)

**Dimensions**: 800×400 px (wide landscape, `background-size: cover`)
**Style**: Environment/landscape. A dark overlay gradient is applied for text readability, so keep scenes **vivid and colorful**.

| # | File Path | Region | Prompt |
|---|-----------|--------|--------|
| 1 | `assets/regions/plains.png` | Plains of Aurin | Dark fantasy RPG landscape, golden sunlit plains with rolling green hills, scattered wildflowers, distant crumbling stone ruins, warm afternoon light with god rays, wide panoramic view, hyper-detailed, cinematic lighting, concept art style, high quality digital art |
| 2 | `assets/regions/forest.png` | Whispering Forest | Dark fantasy RPG landscape, ancient enchanted forest with massive twisted trees, bioluminescent mushrooms and fungi, thick misty fog between trunks, eerie green and purple light filtering through dense canopy, wide panoramic view, hyper-detailed, cinematic lighting, concept art style, high quality digital art |
| 3 | `assets/regions/caverns.png` | Frostbound Caverns | Dark fantasy RPG landscape, vast frozen underground cavern with massive ice stalactites and stalagmites, glowing blue ice crystals embedded in walls, frost-covered stone floors, cold blue ambient light, wide panoramic view, hyper-detailed, cinematic lighting, concept art style, high quality digital art |
| 4 | `assets/regions/desert.png` | Ashen Desert | Dark fantasy RPG landscape, scorching desert with massive sand dunes, ancient half-buried Egyptian-style temples, red and orange sunset sky, heat haze shimmer, scattered bones and ruins, wide panoramic view, hyper-detailed, cinematic lighting, concept art style, high quality digital art |
| 5 | `assets/regions/peak.png` | Gaiadon's Peak | Dark fantasy RPG landscape, towering volcanic mountain peak above the clouds, ancient dragon lair entrance carved in obsidian stone, lightning storms and dark purple sky with golden highlights, epic monumental scale, wide panoramic view, hyper-detailed, cinematic lighting, concept art style, high quality digital art |

---

## 3. Enemy Illustrations (15 images)

**Dimensions**: 280×280 px (displayed at 140×140, 2× for retina)
**Style**: Full-body creature on pure black background. CSS `mix-blend-mode: lighten` makes black = transparent.

### Plains of Aurin

| # | File Path | Enemy | Prompt |
|---|-----------|-------|--------|
| 1 | `assets/enemies/plains/slime.png` | Slime | Dark fantasy RPG creature, a large translucent green slime monster with a glowing magical core inside, gelatinous body reflecting light, small bubbles and particles floating within, menacing yet simple creature, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 2 | `assets/enemies/plains/giant-rat.png` | Giant Rat | Dark fantasy RPG creature, a massive mutant rat the size of a wolf, matted dark brown fur with scars, glowing red eyes, long sharp yellowed fangs bared aggressively, muscular hunched body, long scaly tail, crouching attack stance, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 3 | `assets/enemies/plains/goblin.png` | Goblin | Dark fantasy RPG creature, a vicious goblin warrior with mottled green skin, wearing crude rusted iron armor pieces, wielding a jagged bone club, pointed ears, sharp teeth in a wicked grin, glowing yellow eyes, small but fierce and muscular, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |

### Whispering Forest

| # | File Path | Enemy | Prompt |
|---|-----------|-------|--------|
| 4 | `assets/enemies/forest/shadow-wolf.png` | Shadow Wolf | Dark fantasy RPG creature, a spectral wolf made of living shadows and dark smoke, glowing purple eyes piercing through darkness, ethereal dark mist trailing from its body, sharp ghostly fangs, muscular predatory stance, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 5 | `assets/enemies/forest/spider.png` | Spider | Dark fantasy RPG creature, a giant forest spider with dark green and black armored chitin exoskeleton, eight glowing venomous green eyes, massive dripping fangs, thick hairy legs with sharp barbs, silk web strands hanging from body, aggressive pose, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 6 | `assets/enemies/forest/treant.png` | Treant | Dark fantasy RPG creature, an ancient corrupted tree creature with a twisted face carved in dark bark, glowing green eyes deep in wood hollows, moss and mushrooms growing on body, massive gnarled branch arms with claw-like twigs, thick root legs, towering and menacing, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |

### Frostbound Caverns

| # | File Path | Enemy | Prompt |
|---|-----------|-------|--------|
| 7 | `assets/enemies/caverns/yeti.png` | Yeti | Dark fantasy RPG creature, a massive yeti beast with thick matted white fur covered in frost and ice crystals, piercing icy blue eyes, enormous clawed hands, powerful muscular build, roaring with visible frozen breath, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 8 | `assets/enemies/caverns/ice-golem.png` | Ice Golem | Dark fantasy RPG creature, a towering golem constructed of solid glacial blue ice and frozen stone, glowing frost runes etched across body, cracked crystalline armor plates, cold mist emanating from joints, massive frozen fists, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 9 | `assets/enemies/caverns/bat.png` | Bat | Dark fantasy RPG creature, a giant cave bat with frost-covered dark leathery wings spread wide, pale white fur on body, sharp ice-crystal fangs, sonar waves visible as faint rings, screeching attack pose, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |

### Ashen Desert

| # | File Path | Enemy | Prompt |
|---|-----------|-------|--------|
| 10 | `assets/enemies/desert/scorpion.png` | Scorpion | Dark fantasy RPG creature, a giant desert scorpion with obsidian-black armored exoskeleton, glowing orange veins between armor plates, massive razor-sharp pincers, venomous stinger tail raised and dripping, sand particles clinging to body, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 11 | `assets/enemies/desert/mummy.png` | Mummy | Dark fantasy RPG creature, an ancient cursed mummy pharaoh with tattered rotting bandages, glowing golden eyes burning with dark magic, ornate Egyptian gold jewelry and crown fragments, sand and dust particles swirling around body, skeletal hands reaching forward, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 12 | `assets/enemies/desert/djinn.png` | Djinn | Dark fantasy RPG creature, a powerful fire djinn with upper body of a muscular burning figure, lower body dissolving into flame and smoke, glowing molten eyes, ornate golden bracelets and chains, fire and ember particles swirling around, fierce wrathful expression, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |

### Gaiadon's Peak

| # | File Path | Enemy | Prompt |
|---|-----------|-------|--------|
| 13 | `assets/enemies/peak/young-dragon.png` | Young Dragon | Dark fantasy RPG creature, a young dragon with deep crimson scales, small but fierce with wings spread, breathing a stream of fire, sharp curved horns, glowing orange eyes, powerful clawed legs, barbed tail, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 14 | `assets/enemies/peak/chimera.png` | Chimera | Dark fantasy RPG creature, a monstrous three-headed chimera with lion head breathing fire, goat head with curved dark horns, serpent tail with fanged head, muscular beast body with mismatched fur scales and feathers, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |
| 15 | `assets/enemies/peak/titan.png` | Titan | Dark fantasy RPG creature, a colossal ancient stone titan covered in crumbling runic carvings, cracked volcanic rock skin with glowing magma veins underneath, enormous stone fists, burning ember eyes deep in carved face, earthquake stance, full body centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art |

---

## 4. Equipment Icons (6 images)

**Dimensions**: 44×44 px (displayed at 22×22, 2× for retina)
**Style**: Item icon on black background. Keep it simple — readable at very small sizes.

| # | File Path | Slot | Prompt |
|---|-----------|------|--------|
| 1 | `assets/equipment/weapon.png` | Weapon | Dark fantasy RPG item icon, ornate steel sword with golden hilt and faint glow, centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset icon |
| 2 | `assets/equipment/armor.png` | Armor | Dark fantasy RPG item icon, steel chest plate armor with blue magical rune accents, centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset icon |
| 3 | `assets/equipment/amulet.png` | Amulet | Dark fantasy RPG item icon, golden amulet necklace with glowing gemstone pendant, centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset icon |
| 4 | `assets/equipment/ring.png` | Ring | Dark fantasy RPG item icon, ornate golden ring with embedded glowing diamond, centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset icon |
| 5 | `assets/equipment/gloves.png` | Gloves | Dark fantasy RPG item icon, dark leather combat gauntlets with metal studs and faint magical glow, centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset icon |
| 6 | `assets/equipment/helmet.png` | Helmet | Dark fantasy RPG item icon, dark steel knight helmet with visor and faint glowing runes, centered, isolated on pure black background, hyper-detailed, cinematic lighting, concept art style, game asset icon |

---

## Summary

| Category | Count | Dimensions | Background | Blend Mode |
|----------|-------|------------|------------|------------|
| Hero Portraits | 5 | 240×240 | Black (→ transparent via CSS) | `lighten` |
| Region Backgrounds | 5 | 800×400 | Opaque scene | none |
| Enemy Illustrations | 15 | 280×280 | Black (→ transparent via CSS) | `lighten` |
| Equipment Icons | 6 | 44×44 | Black (→ transparent via CSS) | `lighten` |
| **Total** | **31** | | | |

## Tips for Gemini Generation

1. **Style suffix for all prompts**: already included — "hyper-detailed, cinematic lighting, concept art style, game asset, high quality digital art"
2. **Black backgrounds**: Use "isolated on pure black background" — the CSS `mix-blend-mode: lighten` makes black = transparent automatically, no image editing needed
3. **Consistency**: Generate all enemies for one region in the same session to keep the art style consistent
4. **Region backgrounds**: The ONLY images that should have a full scene (no black bg) — keep them vivid since a dark overlay is applied
5. **Save as PNG**: Always save as `.png` — the code expects this format
6. **Dimensions don't need to be exact**: The CSS uses `object-fit: contain` so any aspect ratio works, but try to keep creatures roughly square
