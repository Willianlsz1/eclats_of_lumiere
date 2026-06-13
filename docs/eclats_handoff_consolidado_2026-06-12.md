# Éclats of Lumière — Handoff Consolidado

**Data:** 2026-06-12
**Cobre:** validação de design (6 tópicos) · validação de lore (8 tópicos) · revisão de nomenclatura · fase UI/UX (telas novas) · pipeline de arte

> ## ⏸ ONDE PARAMOS (para a próxima sessão)
> A fila de telas da fase UI/UX foi **concluída**. O trabalho em andamento no momento do corte:
> **Gerando os fundos de continente (Nível 2) dos Maps 2-5** — os 4 prompts foram entregues a Willian (Cavernes Luminis azul · Ashen Ruins âmbar · picos violeta · Map 5 vermelho/Nihel, o único com vermelho permitido), mesma fórmula do fundo aprovado do Dreaming Wood (vista sobrevoada, espaço negativo, sem marcos). Willian vai gerar e mandar as imagens.
> **Próximos passos imediatos:** (1) receber/aprovar os 4 fundos; (2) gerar as folhas de 5 marcos de cada bioma (fórmula da folha do Map 1); (3) artes pendentes restantes: retratos Seeker T2-T5 (prompts prontos na seção 7) e as 4 variações de cor do banner de rank; (4) sessão só-docs para o Opus gravar tudo na Lore Bible/GDD; (5) playtest Map 1-2; (6) sessão de Escala (f(xp_run)).
> **Regras de trabalho com Willian:** validar uma etapa por vez e esperar aprovação explícita ("Aprovado") antes de seguir; prompts de geração de imagem entregues como bloco único copiável em inglês; mockups HTML 1920×1080 renderizados via Playwright com preview; recortes alpha pelos dois pipelines da seção 7; análise crítica só com ≥99% de confiança; chamá-lo de Willian.

**Status do projeto:** design + calibração fechados · código = design (§10.5 wirada, 7 passos) · fase UI/UX de telas CONCLUÍDA · agora em produção de arte dos mapas 2-5

> Regra de autoridade: este documento prevalece sobre os arquivos antigos (GDD v2, Lore Bible v2, Art Direction v3, handoff anterior) onde houver conflito. Os arquivos antigos seguem válidos como referência naquilo que este não contradiz.

---

## 1. ESTADO GERAL — onde o projeto está

Sequência já concluída, em ordem:
1. Auditoria dos 8 simuladores de calibração → 4 correções de premissa aplicadas.
2. Wiring da §10.5 no código em 7 passos (todos na main, validados): afixo canônico do Gear · Defesa/Mitigação · catálogo de 12 afixos + identidade · Craft/Materiais+Forja · Fate Keepers+Dificuldades · Mémoires (4 novos + 8 exóticos) · Despertar/Tier.
3. Calibração fina (6 blocos) + fix crítico (Clarté não multiplicava HP; heroLevel sem teto). Orçamento fecha ~100 décadas, gap de poder constante ~4 décadas (paredes em todos os mapas).
4. Validação de design (6 tópicos) — decisões na seção 3.
5. Validação de lore (8 tópicos) + revisão de nomenclatura — decisões nas seções 4 e 5.
6. Fase UI/UX em andamento — telas na seção 6.

**Ferramentas de regressão criadas:** `tools/sim/decompose.mjs` (dano por andar vs budget) e `tools/sim/powercurve.mjs` (gap nos 10 checkpoints). Regra adotada: qualquer mudança em constante de poder exige re-rodar os dois e colar o output.

---

## 2. IDENTIDADE DO JOGO (norte)

Idle RPG de browser, Vanilla JS + Vite. Ciclo central validado: **wall → grind → spike** (inspiração Gaiadon/Grand Chase) em três escalas — micro (Gold Stats, raridade), média (Awaken, Guardiões), macro (Ascension, mapa novo).
- **Língua principal: INGLÊS** (UI, Mémoires, descrições). Nomes próprios em FR/HE/LA brilham dentro do texto inglês.
- Duração: 5 mapas ≈ 2 semanas (casual) é o ritmo correto para o conteúdo atual. Mais duração vem de MAIS CONTEÚDO (mapas remix estilo Grand Chase), nunca de inflar custos.

---

## 3. DECISÕES DE DESIGN (6 tópicos validados)

1. **Ritmo/duração** — calibração atual fica; conteúdo escala por mapas remix (reusar inimigos/assets). Modelo de expansão = item de futura sessão.
2. **Despertar (Awaken) vs Ascension — papéis distintos:**
   - **Awaken = mudança de classe.** ×5 poder/tier (T2-T5 nas Sub 3 dos Maps 1-4), arte + rank. Map 5 SEM Awaken (entra como Lumière/T5).
   - **Ascension = marco de progressão.** Mapa novo + bolsa de Éclats + Gatekeeper + amplifica Convergence. Mult cai p/ ×2/mapa (×16 total).
   - Orçamento: Awaken 2.8 déc + Ascension 1.2 déc = 4.0 déc combinados.
3. **Convergence = prestige de aprendizado do early.** ~5-10 por mapa manual; automatizada pós-A1 (Gatekeeper Rhythm). `f(xp_run)`: paredes longas + bônus de boss + ~50 pontos/era (requisito p/ sessão de Escala). Alternativa "desabilitar pós-A1" DESCARTADA com justificativa.
4. **Dificuldades = seleção GLOBAL** (Tópico 4 intacto; código já conforme). Desbloqueio automático via Ascension (Gatekeeper Vigil). Farm de modos altos ancora no Map 4.
   - **Relocação de UI (2026-06-12):** o seletor de dificuldade NÃO fica no painel de Ascension (jogador esquece) — vive no **modal de entrada de sub-área/mapa**, na descrição. Mecânica idêntica (estado global, inalterado); muda só onde o botão aparece. Código do Passo 5 inalterado — só camada de UI.
   - **Gate de progressão das dificuldades por mapa (TODO, não implementado):** Difícile via Ascension · **Nightmare vale até o fim do Map 3** · **Tourment desbloqueia no Map 4**. SEM bloqueio técnico: o teto do double JS é ~1e308 (não 1e100), e os piores casos cabem (Nightmare×Map3 ~1e49; Tourment×Map4 ~1e126). Além disso a **lib de big-number JÁ ESTÁ no código** (Willian pretende passar de 1e308 no futuro), então qualquer overflow está coberto. Map 5 com modos altos = decisão de design, não limitação técnica.
5. **Gatekeeper A3 = Echo of the Seeker.** Eco farma em 2º plano um mapa limpo (fração 25-40%, calibrado 35%), precursor dos pets (Echoes).
6. **Bolsas de Éclats simbólicas por design** — só o drip escala; não é bug.

---

## 4. DECISÕES DE LORE (8 tópicos validados)

Regra global: jogo em inglês; Regra dos Três Idiomas mantida para nomes próprios + 4ª linha **Latim = o registro do Nada** (canoniza Nil Aeternum). Taxonomia sempre "The" + capitalização.

1. **Awaken (interno):** vencer o Guardião da Sub 3 → a luz converge a um limiar novo via Semente; físico, sem cerimônia institucional. Ranks (Seeker→Lumière) = taxonomia DESCRITIVA da Ordre para estados que ela observa sem entender nem produzir. **Ascension = comissão da Ordre para a fronteira seguinte** (certifica, atrasada, o que a luz já fez); pagamento de Vestiges = prestação de contas. Sistema = "Awaken"; evento = "Awakening"; ressonância com L'Éveillé é intencional.
2. **Convergence em três camadas:** ensaio (early, involuntário; `conv_factor` = a Semente lembrando o padrão) → prática (mid) → sacrifício (fim de ciclo, consciente diante de Nihel). O Seeker early não entende as próprias convergences; descobre via Mémoires.
3. **The Pale Reunion:** reunião sem o índice (Semente) sai ERRADA — bela, serena, vazia de sentido. Prova da regra da Parte II, não exceção. Lição 2 do Map 2: "a luz tenta se reconstituir — e o que consegue sozinha é isto."
4. **Idiomas nos ranks:** a escada sobe pelas camadas de idioma (inglês comum → francês raro). **Lumière = duplo sentido canônico** (a era primeira E o rank máximo). Títulos altos novos → FR; comuns → EN; hebraico só em texto morto.
5. **Gatekeepers = faculdades da Semente** que despertam a cada região convergida (não "Fate Keepers"). Guardam o que ficou atrás dos portões cruzados. Tema: quanto mais alto, menos o Seeker faz e mais a luz faz por ele (a automação como erosão da humanidade). A2 Vigil → as dificuldades são as marés da corte refluindo.
6. **Lumens = poeira de luz sem memória** (posse, tecida no corpo, dispersa na Convergence). Hierarquia: Lumens (temporária) < Vestiges (essência permanente) < Éclats (memória).
7. **Echo:** o A3 dá o primeiro Echo (forma do Seeker); pets futuros = Echoes de outras formas. Família narrativa do Hollowed Pilgrim.
8. **Hollows (dungeons):** bolsões de Nil Aeternum vertendo por fissuras; cada um o domínio de um nobre da corte; fonte dos Reliquats exclusivos. **Regra de cor: o vermelho fora do Map 5 só existe DENTRO dos Hollows.** Termo Hollow vale para ser E lugar (o que resta quando o Nada esvazia algo).

**Gear em duas camadas (decisão de design com lore):**
- Camada 1 = as 6 peças de Éclat: permanentes, motor eterno ("o que você é").
- Camada 2 = **Reliquats**: sets de área dropáveis de Guardiões/bosses, finitos, obsoletam por design ("o que você venceu"). Sets antigos ressoam com a região de origem (utilidade local/Echo). Expansão aditiva (Ato 2) — não toca calibração nem Convergence.

**Maël, Blacksmith of the Ordre:** primeiro NPC. Perdeu os olhos para os clarões do Façonnage; forja de visor escuro (espelho do Seeker). Guardião do ofício que a Mémoire #5 preserva.

---

## 5. NOMENCLATURA (revisão completa)

Renomeações canônicas:
| Antigo | Novo |
|---|---|
| Despertar | **Awaken** / Awakening |
| Eco do Seeker | **Echo** |
| Fate Keepers | **Gatekeepers** |
| árvore de passivas "Vestige" | **Brume** (tríade: Éclat=combate · Brume=economia · Fracture=utilidade) |
| camada 2 de gear | **Reliquats** |
| dungeons | **Hollows** |

Mantidos: Nil Aeternum (latim canonizado) · tiers Seeker/Illuminate/Éclairé/L'Éveillé/Lumière · toda a taxonomia e mobs/bosses atuais.

Gatekeepers (A1-A5): **The Rhythm · The Vigil · The Echo · The Pull · Transcendence.**

**Bestiário (arquivo separado a criar — `eclats_bestiary_reference.md`):** mapa taxonomia → papel de gameplay para criar mobs novos:
- The Fragmented = comuns de regiões "inocentes" (Map 1)
- The Consumed = comuns de regiões da queda (Map 3)
- The Claimed = elite / perto da corte (Maps 4-5, Hollows)
- The Qliphoth = território do Nada (Map 5, Hollows profundos)
- The Eidola = EXCLUSIVO de Guardiões de sub-área e Bosses (nobres dos Hollows são Eidola)

---

## 6. FASE UI/UX — TELAS

### SISTEMA DE MAPA — MODELO DE 3 NÍVEIS (decidido e aprovado 2026-06-12)
- **Nível 1 — Mapa-múndi = a Árvore da Vida:** os 5 biomas como aglomerados de ilhas flutuantes nas suas cores (verde · azul cristal · âmbar · violeta · vermelho-fumaça), 4 dentro da moldura oval dourada + o vermelho (Nil Aeternum) vazando pelas RAÍZES, fora da moldura. Arte 16:9 nativa pronta (`worldmap-tree-1920x1080.png`). Cada bioma é clicável.
- **Nível 2 — Continente (clica num bioma):** paisagem-fundo do bioma em vista sobrevoada (arte aprovada do Dreaming Wood) + **marcos de sub-área Grand Chase-style** posicionados por cima + caminhos ramificados. **Regra técnica: o FUNDO é arte; nós, caminhos, labels e selos são CÓDIGO** (reposicionáveis sem regerar arte). Painel lateral de entrada com detalhes da sub-área + seletor de dificuldade.
- **Nível 3 — Sub-área (clica num marco):** combate (o background de batalha do mapa, ex.: floresta de cogumelos do Map 1). A ilha flutuante detalhada (gerada) pode servir de ícone/hero da sub-área.
- **REVELAÇÃO PROGRESSIVA (design confirmado):** o jogador só vê a sub-área ATUAL + as já LIMPAS; as futuras ficam OCULTAS (não travadas-visíveis) até limpar a anterior. A constelação se revela conforme avança. Estado visual: limpa ✓ · atual (selecionável) · oculta (não renderiza). O estado "locked com cadeado" deixa de existir nas sub-áreas.
- Marcos = protagonistas (escala grande, estilo Grand Chase). Numeração romana I-V como placeholder de nomes; Sub III leva tag "Awakening", Sub V tag "Guardian".

### Telas aprovadas nesta sessão (mockups HTML 1920×1080 + preview)
- **The Forge** ✅ — layout "crafting station": Maël (esq) + materiais · receitas (Refining + Raise rarity) · detalhe com checklist de requisitos. Aba **Reliquats 🔒** reservada. Padrão reutilizável para estações futuras.
- **Awakening** ✅ — cerimônia full-stage: card com moldura do tier (T2-T5) + halo branco-azul, retrato antigo→novo, revelação do rank, ganhos, fala da Semente. Partículas douradas convergindo em branco-azul.
- **Convergence** ✅ — modal compacto (rito de dispersão): 2 números (points + conv_factor), colunas "returns to the world" (dourado) vs "the Seed keeps" (azul), borda ornamental real (folha fatiada + alpha). Dispersão = Awaken ao contrário.
- **Ascension + Gatekeepers** ✅ — banner de rank ornamental no topo (borda que EVOLUI por rank; tier "ponto de virada" gerado e integrado) · comissão p/ fronteira · 5 Gatekeepers com os glifos cristalinos reais (toggle Rhythm / always-on Vigil / locked com silhueta+cadeado). **Difficulty REMOVIDO desta tela** → vive no painel de entrada de sub-área (Nível 2).
- **Continente / Nível 2 (Dreaming Wood)** ✅ — fundo real aprovado + 5 marcos íntegros + ramificações em código + painel de entrada com seletor de dificuldade (Normal/Difficile ativos; Nightmare "Map 3+"/Tourment "Map 4+"). Polimento pendente de implementação: alinhamento fino de selos/labels por marco.
- **Mapa-múndi / Nível 1** ✅ — arte 16:9 pronta; mockup de clique nos biomas a fazer na implementação (trivial: 5 hotspots sobre a arte).
- **Retorno offline** ✅ — modal cerimonial "The light did not sleep": tempo fora + eficiência, ganhos com ÍCONES REAIS dos recursos (Lumens/materiais/Éclats), teaser do Echo ("The Echo slept" 🔒 A3 — pós-A3 vira resultado da caçada do eco), botão Collect dourado, moldura ornamental (família Convergence). Valores são placeholders — regra real do offline é pendência de calibração.

### FILA DE TELAS DA FASE UI/UX: COMPLETA ✅

### Telas que faltam
- Nenhuma. A fila foi concluída (o modal de entrada de sub-área vive no painel do Nível 2; o Echo selector vive no painel Gatekeepers).

### Telas já aprovadas em sessões anteriores (handoff antigo)
Combate v5 · Player · Gear v3 · Mapa-Múndi · Continente · Mémoires · Passivas.

### Retrofits e polimentos pendentes (implementação)
- Passivas: aba "Vestige" → **Brume** (arte teal fica, só o rótulo).
- Tudo para **inglês**.
- Gear: reservar espaço futuro para Reliquats.
- **Tipografia de todo o sistema** — troca de fonte global (decisão de polimento, não por tela).
- **Padrão de exibição de recompensas** — linha com ícone-real + nome + origem + valor, emoldurada (estabelecido no offline; vale para drops de boss, recompensas de Ascension, qualquer tela de ganhos).
- Nível 2: alinhamento fino de selos ✓/labels por marco (coordenadas no código ao vivo).
- Painel Ascension: remover bloco Difficulty do rodapé do mockup (relocado p/ Nível 2).

---

## 7. PIPELINE DE ARTE

**🔑 PROMPT-CHAVE DO VISUAL (estilo mestre — decisão de Willian, 2026-06-12):** o prompt do Maël é a KEY visual do jogo. TODA geração de imagem parte desta estrutura, adaptando só o assunto e as cores da era:
> *High-production anime fantasy [character/landmark/emblem/background] illustration, Japanese scenic art, dynamic composition: [assunto detalhado]. Color palette strictly dark navy, warm gold, amber and ember orange [ajustar à cor da era: teal/branco-azul/violeta; vermelho SÓ Map 5/Hollows] — no red anywhere. No photorealism, no 3D render, no text, no watermark. High detail, professional anime key visual quality.*

Elementos fixos: "High-production anime fantasy … Japanese scenic art" · paleta estrita declarada · "no red anywhere" (exceto Map 5/Hollows) · "No photorealism, no 3D render, no text, no watermark" · "High detail, professional anime key visual quality". Anexar sempre a arte do Maël (ou asset aprovado do mesmo tipo) como âncora de estilo.

**Técnicas de recorte validadas (DOIS pipelines, escolher pelo tipo de arte):**
1. **Luminância→alpha** (lum máx por pixel, piso percentil) — para filigranas, molduras, ornamentos e glifos LUMINOSOS sobre fundo escuro. Falha em ilustrações com áreas escuras (come rochas/bases).
2. **Distância-ao-fundo→alpha** (mede a cor do fundo pelos cantos; alpha = distância de cada pixel a essa cor) — para ILUSTRAÇÕES com partes escuras (marcos, ilhas, props). Preserva rochas, musgo, bases. Limiar suave lo=18/hi=55.
Mockups podem aproximar com `mix-blend-mode:screen`; assets finais sempre com alpha real.

**Estilo travado dos EMBLEMAS/GLIFOS (todos):** sigilo cristalino ornamentado, simétrico — filigrana espinhada + diamantes facetados + estrela-bússola central + pingentes pendentes, sobre navy chapado, na cor da era. (Substitui a 1ª folha de glifos, que saiu fotográfica demais.)

**Sistema de cor canônico (inalterado):** dourado `#d9a441` = luz fragmentada/Lumens · branco-azul `#aac8ff` = convergência · teal `#3fd0b6` = Vestige/Brume · violeta `#9d7bdb` = Fracture · **vermelho = EXCLUSIVO Map 5/Nihel + interior dos Hollows** · escuridão vazando = Claimed.

### Assets gerados e aprovados nesta sessão
- **Materiais T1-T4** (Forge): T1 Kindled · T2 Luminous · T3 Radiant · T4 Converged. Estilo splash pintado.
- **Maël** (Blacksmith) — personagem original, visor escuro, lenço ember, ateliê Belle Époque.
- **Molduras de tier T2-T5** (Awakening) — filigrana crescente, branco-azul, com alpha.
- **Ornamentos de borda** (Convergence) — crista + 4 cantos, com alpha.
- **Glifos dos 5 Gatekeepers** (estilo cristalino TRAVADO): Rhythm (orrery dourada) · Vigil (olho teal) · Echo (figura encapuzada azul) · Pull (estrela-bússola dourada) · Transcendence (estrela coroada azul).
- **Banner de rank** (Ascension) — tier "ponto de virada" (ouro + cristal azul), com alpha. Faltam as 4 variações de cor (bronze T1 / ouro T2 / prata-azul T4 / branco-azul T5).
- **MAPA — Nível 1:** Árvore da Vida 16:9 nativa (5 biomas, vermelho nas raízes fora da moldura) — `worldmap-tree-1920x1080.png`. (A versão vertical 2:3 fica como pôster/key art.)
- **MAPA — Nível 2:** fundo do continente Dreaming Wood (vista sobrevoada, vórtice no céu, espaço negativo p/ UI).
- **MAPA — marcos das 5 sub-áreas do Dreaming Wood** (recorte distância-ao-fundo, íntegros): sub1_lantern · sub2_cluster · sub3_stairway (Awakening) · sub4_grotto · sub5_gateway (Guardian).
- **Ilha-mundo detalhada do Dreaming Wood** (com moldura de constelação) — ícone/hero de sub-área.
- **Ícones dos recursos** (recortados com alpha): Lumens (espiral dourada) · Vestiges (cristal violeta com tendris) · Éclats (estrela-chama azul) · materiais Kindled (rocha ember).

### Arte que ainda falta gerar
- **Retratos do Seeker T2-T5** (Awakening): faixa dourada→branco-azul, capuz caindo, cabelo branco, halo formando, rosto se esvaziando no T5. Prompts prontos (4).
- **Bordas de rank da Ascension — 4 variações de cor** (bronze T1 / ouro T2 / prata-azul T4 / branco-azul puro T5) sobre a forma já aprovada do tier III.
- **MAPA — fundos de continente dos Maps 2-5** (mesma fórmula do Dreaming Wood: vista sobrevoada do bioma) + **folhas de 5 marcos** de cada (mesma fórmula da folha do Map 1).
- (Futuro/expansão) Fissure Stalker + Claimed Vanguard (M4), Nihel (M5), bg original do Map 2, Reliquats, nobres dos Hollows.

---

## 8. PRÓXIMOS PASSOS (ordem recomendada)

1. **Fechar a fase UI/UX:** mockup do retorno offline · bordas de rank da Ascension (testar tier III) · retratos T2-T5 · retrofits (Brume, inglês).
2. **Atualizar documentação** (sessão só-docs para o Opus): Lore Bible + GDD + ESTADO com tudo das seções 3-5; criar o bestiário (seção 5).
3. **Playtest real** do Map 1-2 (sentir o ritmo das paredes/Forja/primeira Convergence) — alimenta a sessão de Escala.
4. **Sessão de Escala:** desenhar `f(xp_run)` (única peça de design ainda aberta).
5. **Conteúdo novo:** mapas remix, Hollows, Reliquats, nobres da corte.

### Pendências de calibração registradas (§11 do ESTADO)
asc_mult ×2 + Awaken no orçamento (feito) · veilScale · afixo Materiais amortecido (Farm = sem motor ×) · passivas individuais · apsCap=15 + fontes de APS · Echo fraction · `f(xp_run)` (sessão de Escala).

### Pendências de design registradas
Dificuldade por sub-área → global (TODO no GDD) · Gatekeeper A3 efeito real do offline · nomes das 5 Épopées das Mémoires · nomes das sub-áreas · nomes dos raros M1/M3/M5.

### Fora de escopo / pós-MVP
Echoes (pets) · A5 Transcendência (loop infinito) · React Doctor · true ending cinematográfico.
(NOTA: a lib de big-number / break_infinity JÁ ESTÁ no código — não é pendência. Willian pretende passar de 1e308 no futuro. Onde docs antigos disserem "depende de break_infinity", reler como "já disponível".)
