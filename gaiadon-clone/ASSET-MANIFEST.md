# Asset Manifest — Gaiadon: Eternal Quest

All images use **transparent PNG** backgrounds (except region backgrounds).
Style: **fantasy RPG pixel art / painterly illustration** — consistent across all assets.

> **Workflow**: Generate each image with Gemini → save to the file path listed → refresh the game. The emoji fallback disappears automatically when the image file exists.

---

## 1. Hero Portraits (5 images)

**Dimensions**: 240×240 px (displayed at 120×120, 2× for retina)
**Style**: Upper body portrait, facing forward, fantasy RPG character. Each tier looks progressively more powerful.

| # | File Path | Tier | Suggested Prompt |
|---|-----------|------|------------------|
| 1 | `assets/hero/adventurer.png` | Common | "Fantasy RPG character portrait, young adventurer with basic leather armor, simple sword, hopeful expression, upper body, transparent background, painterly style" |
| 2 | `assets/hero/warrior.png` | Uncommon | "Fantasy RPG character portrait, experienced warrior with iron plate armor, battle scars, confident stance, green accent glow, upper body, transparent background, painterly style" |
| 3 | `assets/hero/champion.png` | Rare | "Fantasy RPG character portrait, elite champion in ornate blue steel armor, glowing runic sword, determined expression, blue magical aura, upper body, transparent background, painterly style" |
| 4 | `assets/hero/legend.png` | Epic | "Fantasy RPG character portrait, legendary hero in enchanted purple crystal armor, ethereal weapons floating around, wise powerful gaze, purple arcane energy, upper body, transparent background, painterly style" |
| 5 | `assets/hero/mythic.png` | Legendary | "Fantasy RPG character portrait, mythic godlike being in radiant golden celestial armor, divine wings of light, crown of stars, golden holy aura, transcendent expression, upper body, transparent background, painterly style" |

---

## 2. Region Backgrounds (5 images)

**Dimensions**: 800×400 px (wide landscape, used as `background-size: cover`)
**Style**: Environment/landscape scene. A dark overlay gradient is applied on top for text readability, so keep the scene **vivid**.

| # | File Path | Region | Suggested Prompt |
|---|-----------|--------|------------------|
| 1 | `assets/regions/plains.png` | Plains of Aurin | "Fantasy RPG landscape, golden sunlit plains with rolling green hills, scattered wildflowers, distant stone ruins, warm afternoon light, painterly style, wide aspect ratio" |
| 2 | `assets/regions/forest.png` | Whispering Forest | "Fantasy RPG landscape, dark enchanted forest with massive ancient trees, bioluminescent mushrooms, misty fog between trunks, eerie green and purple light filtering through canopy, painterly style, wide aspect ratio" |
| 3 | `assets/regions/caverns.png` | Frostbound Caverns | "Fantasy RPG landscape, vast frozen underground cavern with ice stalactites, glowing blue ice crystals, frost-covered stone floors, cold blue ambient light, painterly style, wide aspect ratio" |
| 4 | `assets/regions/desert.png` | Ashen Desert | "Fantasy RPG landscape, scorching desert with massive sand dunes, ancient half-buried temples, red and orange sunset sky, heat haze, scattered bones, painterly style, wide aspect ratio" |
| 5 | `assets/regions/peak.png` | Gaiadon's Peak | "Fantasy RPG landscape, towering mountain peak above the clouds, ancient dragon lair entrance carved in stone, lightning storms, epic scale, dark purple and gold sky, painterly style, wide aspect ratio" |

---

## 3. Enemy Illustrations (15 images)

**Dimensions**: 280×280 px (displayed at 140×140, 2× for retina)
**Style**: Full-body creature/monster on transparent background. Each should look distinct and recognizable at small sizes.

### Plains of Aurin
| # | File Path | Enemy | Suggested Prompt |
|---|-----------|-------|------------------|
| 1 | `assets/enemies/plains/slime.png` | Slime | "Fantasy RPG creature, green translucent slime monster with glowing core, cute but dangerous, bouncy gelatinous body, transparent background, painterly style" |
| 2 | `assets/enemies/plains/giant-rat.png` | Giant Rat | "Fantasy RPG creature, oversized aggressive rat with matted brown fur, red glowing eyes, sharp teeth, crouching attack pose, transparent background, painterly style" |
| 3 | `assets/enemies/plains/goblin.png` | Goblin | "Fantasy RPG creature, small green goblin warrior with crude wooden club, tattered leather armor, mischievous grin, full body, transparent background, painterly style" |

### Whispering Forest
| # | File Path | Enemy | Suggested Prompt |
|---|-----------|-------|------------------|
| 4 | `assets/enemies/forest/shadow-wolf.png` | Shadow Wolf | "Fantasy RPG creature, spectral dark wolf made of shadow and smoke, glowing purple eyes, ethereal mist trailing from body, menacing stance, transparent background, painterly style" |
| 5 | `assets/enemies/forest/spider.png` | Spider | "Fantasy RPG creature, giant forest spider with dark green and black chitin, multiple glowing eyes, venomous fangs dripping, web strands, transparent background, painterly style" |
| 6 | `assets/enemies/forest/treant.png` | Treant | "Fantasy RPG creature, ancient tree creature with face in bark, glowing green eyes, moss-covered branches as arms, roots as legs, towering and slow, transparent background, painterly style" |

### Frostbound Caverns
| # | File Path | Enemy | Suggested Prompt |
|---|-----------|-------|------------------|
| 7 | `assets/enemies/caverns/yeti.png` | Yeti | "Fantasy RPG creature, massive white-furred yeti beast, icy blue eyes, frost on fur, powerful clawed hands, roaring pose, transparent background, painterly style" |
| 8 | `assets/enemies/caverns/ice-golem.png` | Ice Golem | "Fantasy RPG creature, towering golem made of solid blue ice and crystal, glowing frost runes on body, cracked glacial armor, cold mist, transparent background, painterly style" |
| 9 | `assets/enemies/caverns/bat.png` | Bat | "Fantasy RPG creature, giant cave bat with frost-covered wings, pale white fur, sonar waves visible, screeching pose, transparent background, painterly style" |

### Ashen Desert
| # | File Path | Enemy | Suggested Prompt |
|---|-----------|-------|------------------|
| 10 | `assets/enemies/desert/scorpion.png` | Scorpion | "Fantasy RPG creature, giant desert scorpion with obsidian-black exoskeleton, glowing orange stinger tail raised, massive pincers, sand particles, transparent background, painterly style" |
| 11 | `assets/enemies/desert/mummy.png` | Mummy | "Fantasy RPG creature, ancient cursed mummy with tattered bandages, glowing golden eyes, sand and dust swirling, Egyptian-style jewelry, shambling pose, transparent background, painterly style" |
| 12 | `assets/enemies/desert/djinn.png` | Djinn | "Fantasy RPG creature, powerful fire djinn made of flame and smoke, golden ornate bracelets, fierce expression, floating above ground, fire and ember particles, transparent background, painterly style" |

### Gaiadon's Peak
| # | File Path | Enemy | Suggested Prompt |
|---|-----------|-------|------------------|
| 13 | `assets/enemies/peak/young-dragon.png` | Young Dragon | "Fantasy RPG creature, young dragon with crimson scales, small but fierce, wings spread, breathing a small flame, sharp horns and claws, transparent background, painterly style" |
| 14 | `assets/enemies/peak/chimera.png` | Chimera | "Fantasy RPG creature, three-headed chimera with lion body, goat head, and serpent tail, each head breathing different element, muscular and terrifying, transparent background, painterly style" |
| 15 | `assets/enemies/peak/titan.png` | Titan | "Fantasy RPG creature, colossal stone titan covered in ancient runes, cracked volcanic skin, glowing magma veins, enormous fists, earthquake stance, transparent background, painterly style" |

---

## 4. Equipment Icons (6 images)

**Dimensions**: 44×44 px (displayed at 22×22, 2× for retina)
**Style**: Simple, clean item icon on transparent background. Should be readable at very small sizes — avoid fine detail.

| # | File Path | Slot | Suggested Prompt |
|---|-----------|------|------------------|
| 1 | `assets/equipment/weapon.png` | Weapon | "RPG game item icon, simple steel sword with golden hilt, clean linework, small icon, transparent background" |
| 2 | `assets/equipment/armor.png` | Armor | "RPG game item icon, steel chest plate armor with blue accent, clean linework, small icon, transparent background" |
| 3 | `assets/equipment/amulet.png` | Amulet | "RPG game item icon, golden amulet necklace with glowing gemstone pendant, clean linework, small icon, transparent background" |
| 4 | `assets/equipment/ring.png` | Ring | "RPG game item icon, golden ring with small embedded diamond, clean linework, small icon, transparent background" |
| 5 | `assets/equipment/gloves.png` | Gloves | "RPG game item icon, leather combat gauntlets with metal studs, clean linework, small icon, transparent background" |
| 6 | `assets/equipment/helmet.png` | Helmet | "RPG game item icon, steel knight helmet with visor, clean linework, small icon, transparent background" |

---

## Summary

| Category | Count | Dimensions | Format |
|----------|-------|------------|--------|
| Hero Portraits | 5 | 240×240 | PNG (transparent bg) |
| Region Backgrounds | 5 | 800×400 | PNG (opaque, vivid) |
| Enemy Illustrations | 15 | 280×280 | PNG (transparent bg) |
| Equipment Icons | 6 | 44×44 | PNG (transparent bg) |
| **Total** | **31** | | |

## Tips for Gemini Generation

1. **Append to every prompt**: "digital art, high quality, game asset"
2. **Transparent backgrounds**: Add "isolated on transparent background" or "no background"
3. **Consistency**: Generate all enemies for one region in the same session to keep the style consistent
4. **Equipment icons**: These are tiny — ask for "simple", "icon-style", "minimal detail"
5. **Region backgrounds**: These are the only images that should NOT have a transparent background
6. **Save as PNG**: Always export/save as `.png` — the code expects this format
