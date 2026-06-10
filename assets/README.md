# assets/ — convenções de arquivos de arte

Infraestrutura para receber os assets gerados (fonte da verdade visual: `docs/eclats_art_direction.md`).
A integração no jogo (CSS/HTML) é escopo do **CP-G** — esta pasta só define onde cada arquivo entra e com que nome.

## Formato e pipeline (regras do Art Direction §8g)

- **Formato final: WebP, qualidade ~80.**
- **Tamanho: 2× o tamanho de exibição** (cards lidos a ~250px → arquivos com ~500–600px de largura).
- **Molduras:** miolo navy recortado (centro transparente). Moldura e retrato são **camadas separadas** — nunca fundir moldura + avatar em um arquivo. A moldura é reutilizada entre cards (1 decode).
- **Glow assado na imagem**, nunca via `filter`/`box-shadow` animado; animações só com `transform`/`opacity`.
- Plano B se houver lag: pré-composição offline (script Node + sharp).

## Nomes de arquivo

Tudo em **kebab-case minúsculo**, nomes canônicos do lore em inglês/francês sem acentos (ex.: `lumiere`, `eclaire`).

| Pasta | Conteúdo | Padrão de nome | Exemplos |
|---|---|---|---|
| `backgrounds/` | Backgrounds 16:9 dos 5 mapas | `mapN-nome.webp` | `map1-dreaming-wood.webp` |
| `seeker/` | Retratos do Seeker T1–T5 | `tN-nome.webp` | `t1-seeker.webp` · `t5-lumiere.webp` |
| `enemies/mapN/` | Trio de inimigos + encontros raros do mapa | `nome.webp` | `enemies/map1/candlewisp-shade.webp` · `enemies/map4/hollowed-pilgrim.webp` |
| `bosses/` | Os 5 bosses finais | `mapN-nome.webp` | `map1-gilded-hollow.webp` · `map5-nihel.webp` |
| `frames/` | Molduras (centro transparente) | `tier-tN.webp` · `enemy-universal.webp` · `boss-mN-nome.webp` | `tier-t1.webp` · `boss-m5-nihel.webp` |
| `ui/` | Ícones de moeda e navegação | `icon-nome.webp` · `nav-nome.webp` | `icon-gold.webp` · `nav-convergence.webp` |
| `relics/` | As 15 Mémoires ilustradas | `eN-nome.webp` (era 1–5) | `e1-premier-matin.webp` · `e5-choix.webp` |
| `passives/eclat\|vestige\|fracture/` | As 45 passivas ilustradas (3 árvores × 15) | `nome.webp` | `passives/vestige/lumens-blessing.webp` |
| `gear/` | 6 peças × 5 raridades (forma muda por tier; cor da raridade fica no CSS) | `peca-raridade.webp` | `waning-edge-faded.webp` · `band-of-dusk-converged.webp` |
| `refs/` | Âncoras de estilo e referências de geração (Âncora nº 1 Tikkun Olam, Âncora nº 2 Nihel etc.) — **não entram no build do jogo** | `anchor-N-nome.png` · livre | `anchor-1-tikkun-olam.png` |

## Prioridade de integração (disciplina de fases)

O MVP é o **Map 1**: `backgrounds/map1-*`, `enemies/map1/*`, `bosses/map1-*`, `seeker/t1-*`, `frames/tier-t1` + `frames/enemy-universal` + `frames/boss-m1-*` e `ui/*`. As demais pastas existem para receber a arte já aprovada (Maps 2–5, gear, relíquias, passivas), mas **nada delas é integrado antes do CP correspondente**.
