# Artes do jogo (assets)

Solte suas imagens aqui com **exatamente estes nomes**. Enquanto o arquivo não
existir, o jogo mostra um emoji no lugar automaticamente (não quebra nada).

## Herói
- `assets/hero.png` — o card do Seeker (recomendado: vertical, ~3:4, ex. 600×800px, PNG com fundo transparente ou pintado)

## Mobs da Área 1 — The Dreaming Wood
- `assets/enemies/candlewisp_shade.png`
- `assets/enemies/mothlight_herald.png`
- `assets/enemies/dreamhorn_warden.png`
- `assets/enemies/gilded_hollow.png`  (boss)

## Dicas
- Proporção ideal do card de arte: **3:4** (mais alto que largo). A imagem é
  recortada pra preencher o espaço (`object-fit: cover`).
- Silhueta limpa e legível (a arte é lida em ~240px de largura).
- Para trocar o caminho/nome de um arquivo, edite `src/data.js`
  (campo `img` de cada inimigo) e `index.html` (o `src` do `hero-art`).
