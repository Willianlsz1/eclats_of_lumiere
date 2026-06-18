# Éclats of Lumière — Base v3 (planejamento do zero)

> **Folha em branco — iniciado em 2026-06-18.**
> Documento da NOVA base. Tudo aqui é decidido **na sessão de design com o Willian**.
> Nada do design antigo (`docs/archive/`) entra sem ser reaprovado. Enquanto uma
> seção estiver vazia/"⬜ a decidir", o número/regra **não existe** — não invente.

## Estado atual do projeto
- **Visual/design preservado:** todas as telas (`src/ui/*.js` + `*.css`), tokens,
  shell, arte em `public/eclats/`, `index.html`. A casca renderiza com dados de amostra.
- **Motor removido:** `src/core/{loop,save,dev}.js` e
  `src/game/{fatekeepers,difficulty,offline}.js` apagados; os demais `src/game/*.js`
  e `src/core/state.js` são **stubs de casca** (sem lógica, valores de amostra).
- **Próximo passo:** preencher este doc, seção a seção, e só então religar a UI a um
  motor novo e reescrever `src/data/constants.js`.

---

## 1. Visão & fantasia
⬜ a decidir — que jogo é esse, para quem, qual a sensação central?

## 2. Loop central (minuto a minuto)
⬜ a decidir — o que o jogador faz nos primeiros 5 min? E numa sessão típica?

## 3. Modelo de combate
⬜ a decidir — single-target? AoE? ondas? ativo vs idle? papel do jogador no combate.

## 4. Espinha de progressão (mapas / áreas)
⬜ a decidir — estrutura do mundo, gates, ritmo, duração-alvo do jogo base.

## 5. Moedas & economia
⬜ a decidir — quais moedas existem, de onde vêm, em que são gastas (sinks/sources).

## 6. Prestígio / meta-progressão
⬜ a decidir — há reset? quantas camadas? como compõem?

## 7. Dungeons / conteúdo ativo
⬜ a decidir — existe? como entra no loop? recompensas.

## 8. Gear / equipamento
⬜ a decidir — peças, eixos de evolução, raridade, fonte.

## 9. Habilidades / poderes ativos
⬜ a decidir — existem? como são adquiridos/usados.

## 10. Pacing-alvo & calibração
⬜ a decidir — curvas, metas de tempo por etapa, constantes seed (vão para `constants.js`).

---

## Telas existentes (casca a religar)
Inventário do que a UI já desenha (pode ser mantido, repaginado ou descartado
conforme o novo design): **Combate · Mapa · Seeker (ficha) · Convergence · Gear ·
The Forge · Passivas · Mémoires · Ascension**. Decidir em cada seção acima quais
telas o novo design usa e o que cada uma passa a significar.
