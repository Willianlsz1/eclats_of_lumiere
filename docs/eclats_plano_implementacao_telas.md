# Éclats of Lumière — Plano de Implementação das Telas (Claude Code / Fable)
**Versão 1.0 · 2026-06-10 · Autor: sessão de design com Claude**

## Contexto para o Claude Code

- O jogo é um **idle RPG de browser em Vanilla JS + HTML/CSS** (protótipo herdado do Gaiadon). O protótipo deve ser **atualizado para obedecer aos documentos**, nunca o contrário.
- **Fontes da verdade**, em ordem de autoridade:
  1. `eclats_gdd_final_v2.md` — números, fórmulas, economia (com as correções da seção "Decisões recentes" abaixo)
  2. `eclats_lore_bible_v2_1.md` — nomes, narrativa, cânon de cores
  3. `eclats_art_direction_v3.md` — estilo visual
  4. **Os 7 mockups aprovados** (ZIPs `mockup-*.zip`) — layout pixel-reference das telas. O HTML/CSS deles pode ser portado/adaptado diretamente.
  5. `eclats_assets_v2.zip` — todos os assets organizados (ver `MANIFEST.md` interno para pendências)
- **Decisões recentes que SOBREPÕEM o GDD onde conflitam:**
  - Passivas: 3 grupos de 5 por árvore; grupo seguinte desbloqueia ao **maximizar os 5 anteriores** (custos do §7 valem dentro dos grupos)
  - Combate: pack size do §4 = **cap lógico**; **cap visual fixo de 6–8 cards** + contador "+N"; progressão por **waves** (Wave X/Y por sub-área)
  - Mémoires: desbloqueio por **Ascension da era**, compra com Éclats, possuem níveis (Clarté ×1.07^soma)
- **Referência visual primária: desktop 1920×1080** (técnica de stage com `transform: scale()` já usada nos mockups).
- Textos/números fictícios dos mockups (custos, LVs, nomes de sub-áreas, nomes das Épopées) são **placeholders** — usar os do GDD onde existirem, manter placeholder marcado com `// TODO(canon)` onde não.

## Regras de trabalho (estilo Willian)

1. **Um CP por vez**, na ordem. Ao fim de cada CP: relatório curto com % do plano concluído + o que ficou pendente. Aguardar aprovação antes do próximo.
2. Não inventar cânon (nomes, lore, números). Na dúvida: placeholder marcado + pergunta no relatório.
3. Não misturar fases: este plano é só **implementação visual + wiring das telas**. Balanceamento fino, Echoes e monetização ficam fora.
4. Assets com `VERIFICAR` no nome podem ser usados, mas o nome final virá do Willian.

---

## CP-0 — Fundação de assets
**Objetivo:** repositório pronto para consumir os assets.
- Extrair `eclats_assets_v2.zip` para `/assets` do projeto (manter a árvore).
- Rodar `convert_webp.py` (espelho WebP q80) e fazer o jogo referenciar os `.webp` com fallback PNG.
- Recortar individualmente a folha `icons/nav/nav_icons_folha_branco_azul.png` (7 ícones) usando o método de recorte por vales + alpha por luminância (scripts da sessão 2026-06-10, descritos no registro de sessão).
- Criar `assets/manifest.js` (ou JSON): mapa id → caminho, para data wiring.
**Aceite:** página de teste exibindo cada categoria de asset carregada do manifest.

## CP-1 — Design system base
**Objetivo:** tokens e casca visual compartilhada por todas as telas.
- Extrair dos mockups: paleta (`--panel`, `--line`, `--ink`, `--dim`, `--eclat #aac8ff`, `--vest #3fd0b6`, `--frac #9d7bdb`, `--gold #d9a441`, raridades `--r-faded #6b7280`, `--r-kindled #c96a2a`, `--r-luminous #d9a441`, `--r-radiant #f0d9a0`, `--r-converged #aac8ff`), fontes (Cormorant Garamond + Inter), raio/borda/glow padrão dos cards.
- Stage 1920×1080 com scale responsivo (função `fit()` dos mockups).
- Navegação inferior/topo com os 7 ícones de nav + moedas (Lumens/Vestiges/Éclats) — posições conforme mockups.
**Aceite:** shell navegável entre telas vazias com tokens aplicados.

## CP-2 — Tela de Combate (mockup-combate-v5 + boss v3)
- Waves: rótulo "Wave X/Y" topo; spawns pré-definidos por mapa (config JSON por sub-área); inimigos espalhados, mesmo tamanho; cap visual 6–8 + badge "+N"; mortos apagados (grayscale) — *decisão "apagados vs somem" ainda aberta: implementar apagados com flag de config*.
- Alvo atual: borda dourada + nome + número de dano.
- Card do Seeker à esquerda (retrato+moldura+placa, peça única); HUD mínimo no rodapé.
- Boss: card grande com moldura completa (layout do mockup v3), substitui 1 mob do pool (GDD §4).
**Aceite:** combate jogável contra o background do Map 1 com o trio do map1.

## CP-3 — Mapa-Múndi + Visão de Continente (mockup-mapa-v2)
- Nível 1: arte do mapa + 5 pinos (estados: selecionado/desbloqueado/bloqueado).
- Nível 2: recorte 2× do cluster (já em `worldmap/continent1...`; gerar os dos maps 2–5 pelo mesmo crop), esferas = sub-áreas clicáveis, breadcrumb de volta.
- Painel direito constante: card do continente (capa = bg do mapa, lore, progresso de waves, inimigos/wave, nível dos mobs) + lista de sub-áreas com estados + botão entrar.
- Nomes de sub-áreas: `// TODO(canon)`.
**Aceite:** navegar mundo → continente → entrar numa sub-área → abre o combate dela.

## CP-4 — Tela do Player (mockup-player)
- Retrato grande + moldura T1 + nome/tier da Ordre + frase de lore.
- Barra XP/level (level é display; portão de Convergence é XP — GDD §6) + 4 painéis (Combate, Economia, Árvores com as 3 cores, Convergence X/15 relíquias).
- Background do mapa atual desfocado atrás.
**Aceite:** painéis lendo dados reais do estado do jogo.

## CP-5 — Tela de Gear (mockup-gear-v3)
- Estrutura Gaiadon: stats à esquerda · abas Equipment/Upgrade + tooltip central · 6 slots à direita · multiplicadores x1/x10/x100/x1000/MAX.
- Estilo: borda 3px da cor da raridade + badge LVL + losangos/glow gacha (CSS do mockup).
- Tooltip: nome, raridade (Faded→Converged), nível/cap, bônus com taxa, frase de lore (`// TODO(canon)` para as frases).
- Assets: `gear/` (30 recortes `peça_raridade`).
**Aceite:** equipar/upar consumindo Lumens conforme §13 (valores herdados; recalibração fica fora deste plano).

## CP-6 — Tela de Passivas (mockup-passivas)
- 3 abas coloridas (Éclat/Vestige/Fracture) com contadores.
- 3 grupos de 5 por árvore; **gate: maximizar os 5 anteriores desbloqueia o grupo seguinte**; estados visuais do mockup (maximizado dourado ✦ / em progresso / bloqueado com mensagem).
- Custos: GDD §7 (desbloqueio por posição + evolução ×1.30^(n-1)); moeda = Vestiges no topo.
- Efeitos individuais ⏳ no GDD: implementar como tabela de efeitos com valores placeholder somando ao envelope (+5% dano/nível agregado) e `// TODO(canon)`.
**Aceite:** comprar/upar/maximizar grupos com persistência (passivas nunca resetam).

## CP-7 — Tela de Mémoires (mockup-memoires)
- Galeria por 5 eras (nomes das Épopées: `// TODO(canon)`, placeholders L'Aube...Le Choix) com contador Tikkun Olam X/15; bloqueadas = caixa escura com "?".
- Detalhe: arte grande (máscara radial CSS), trecho de lore, box de bônus + linha game changer.
- **Correções sobre o mockup:** origem = "Desbloqueada na Ascension da Era N" (não Convergence); adicionar campo de **nível** da Mémoire + custo de evolução (2×1.10^n Éclats) e o motor **Clarté** (dano ×1.07^Σníveis) — GDD §11.
**Aceite:** comprar/evoluir Mémoires com Éclats e ver a Clarté afetar o dano.

## CP-8 — Integração e passada de QA
- Data wiring completo via `assets/manifest.js`; remover assets órfãos.
- Conferência cruzada com o GDD: §4 caps, §6 XP-portão, §7 custos, §11 Mémoires, §13 gear.
- Lista final de `TODO(canon)` para o Willian resolver (vira a pauta da próxima sessão de design).
**Aceite:** jogo navegável de ponta a ponta com as 7 telas novas, sem referência quebrada de asset.

---

## Pendências conhecidas que NÃO bloqueiam o início
(do MANIFEST do pacote v2 — encaixar quando os lotes chegarem)
- Background original do Map 2 (print atual é baixa-res: usar como placeholder com flag)
- Retratos Seeker T2–T5 · molduras T2–T5 e de boss · bosses M1/M2 · Nihel
- Identidades finais dos inimigos `VERIFICAR` (trio/raro/boss por mapa)
- Nomes: sub-áreas, Épopées, frases de lore do gear, efeitos individuais das 45 passivas
