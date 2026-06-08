# ⚔️ Éclats of Lumière — Design Document Completo

> Documento unificado de Game Design + Lore. **Fonte da verdade** do projeto.
> Data base: Junho 2026 · Última consolidação: 2026-06-08
> Status: Em construção — endgame, lista completa de Echoes e visual de projéteis ainda a definir.

---

## 📌 Decisões Resolvidas (changelog de design)

Pontos que estavam abertos e foram fechados nesta consolidação. As seções abaixo já refletem estas decisões.

1. **Modelo de tempo** — três relógios distintos (tick de combate contínuo · check-in de 2-3 min · cadência de Convergence variável). Ver §14.
2. **Crit** — **camada única**. O excedente de Crit Rate acima de 100% **transborda para Crit Damage**. Super Crit e Hyper Crit foram removidos. Ver §30.
3. **Convergence late-game** — mults por ponto + **spike ×1.5 a cada 5 Convergences** (marcos). Ver §14.
4. **Convergence trigger** — **livre** a qualquer momento; o jogo apenas *sinaliza* "recomendado" quando o crescimento estagna (plateau). Sem gate. Ver §14.
5. **"Vestige" desambiguado** — `Vestige` é exclusivamente a **moeda**. O tipo de inimigo-boss antes chamado "The Vestiges" virou **The Eidola**. Ver §4.
6. **Gloves diversificada** — deixou de ser peça 100% crit. Ver §28.

---

# PARTE I — LORE & UNIVERSO

---

## 1. IDENTIDADE DO JOGO

- **Nome:** Éclats of Lumière
- **Significado:** "Fragmentos de Luz" em francês
- **Idioma:** Inglês — nomes em outras línguas mantidos em suas formas originais
- **Inspirações:** Clair Obscur: Expedition 33, Lord of Mysteries, Kabbalah (Lurianic), mitologia Nórdica e Grega, música "Lumière" de GO!! Light Up!
- **Tom:** Melancólico, grandioso, misterioso — beleza que esconde tragédia

---

## 2. COSMOLOGIA — A ORIGEM

### Or Ein Sof — A Grande Luz
- **Or Ein Sof** (hebraico: "Luz sem Fim") — a luz primordial que existia antes de tudo
- Inspirado na Kabbalah Luriânica: Or Ein Sof preencheu todo o universo sem limite
- Para que o mundo pudesse existir, Or Ein Sof se fragmentou — não por acidente, mas como ato necessário de criação
- Os fragmentos se dispersaram pelo mundo — os **Éclats**

### La Fractura — O Evento
- **La Fractura** — o momento em que Or Ein Sof se quebrou em Éclats
- Aconteceu há milênios — ninguém sabe exatamente quando ou como
- Não foi uma tragédia acidental — foi o preço da criação do mundo
- Paralelo direto com **Shevirat HaKelim** da Kabbalah: "A Quebra dos Vasos"
- O mundo inteiro existe porque Or Ein Sof se quebrou

### Nihel, The Fracture — A Entidade
- Nasceu do **vácuo** deixado por La Fractura — não é maligno por escolha
- Existe porque a luz está fragmentada — se Or Ein Sof se reconstituir, ele desaparece
- Por isso age para **destruir os Éclats**: sobreviver é seu único imperativo
- Tem subordinados que roubam e destroem Éclats antes da Ordre chegar
- Destruiu o conhecimento teórico sobre os Éclats **intencionalmente** ao longo dos milênios
- Visual: silhueta escura com olhos brilhantes e luz dourada emanando — belo e aterrorizante
- **Nihel** = derivado de *nihil* (latim: nada)
- **The Fracture** = ele não nasceu da Quebra — ele **é** a Quebra

### A Simetria Trágica
- La Fractura (evento) e Nihel, The Fracture (entidade) compartilham a mesma raiz
- Quando o mundo fala de "La Fractura" como história, está inconscientemente falando de Nihel
- Nihel e o Seeker são feitos da mesma coisa — fragmentos de Or Ein Sof
- A escolha final do Seeker: reconstituir a luz sabendo que isso apagará algo que não escolheu existir

---

## 3. OS ÉCLATS

- Fragmentos de Or Ein Sof dispersos após La Fractura
- Cada Éclat carrega **memória do mundo** — um fragmento da história verdadeira
- Absorver um Éclat fortalece quem o carrega — mas sem o conhecimento correto, a luz consome
- Paralelo com **Tikkun Olam** (hebraico: "Reparação do Mundo") — coletar Éclats é reparar o mundo sem saber

---

## 4. OS INIMIGOS — OS CORROMPIDOS

Quem absorve Éclats sem o conhecimento da Ordre perde o controle e se transforma:

| Tipo | Descrição | Onde aparecem |
|------|-----------|---------------|
| **The Fragmented** | Humanos que tocaram um Éclat e foram parcialmente corrompidos. Ainda têm forma humana mas perderam a mente | Subáreas iniciais |
| **The Consumed** | Seekers que absorveram Éclats demais. Corpo transformado pela luz — brilhantes, deformados, poderosos | Subáreas avançadas |
| **The Eidola** | Entidades sem forma humana reconhecível — luz pura corrompida, existem há milênios (grego *εἴδωλον*, "fantasma espectral") | Chefes e bosses |

> **Nota de naming:** "The Eidola" substitui o antigo "The Vestiges" para liberar **Vestige** como nome exclusivo da moeda (§9).

### Subordinados de Nihel
| Tipo | Nome | Origem |
|------|------|--------|
| Criaturas do vácuo | **Qliphoth** | Nascidos de Nihel — extensões diretas da sua vontade |
| Corrompidos dominados | **The Claimed** | Consumed/Eidola subjugados por Nihel |

**Regra do universo:** qualquer um pode tentar absorver Éclats, mas sem o conhecimento da Ordre, a luz te consome.

---

## 5. A ORDRE DES ÉCLAIRÉS

- **Nome:** Ordre des Éclairés ("Ordem dos Iluminados")
- **Fachada:** Protetores públicos — combatem criaturas corrompidas que ameaçam o povo
- **Realidade:** Coletam Éclats silenciosamente durante as operações de proteção
- **Força:** Forte e estabelecida — respeitada pelo povo
- **O que sabem:** O procedimento de absorver Éclats — conhecimento incorporado, passado por gerações sem teoria
- **O que não sabem:** A verdade sobre Or Ein Sof, La Fractura, Nihel, e o que acontece quando a luz se reconstitui
- **Por que não sabem:** Nihel destruiu o conhecimento teórico intencionalmente
- **Ironia:** São chamados de "Iluminados" sem saber que carregam literalmente fragmentos de luz

---

## 6. O SEEKER

### Origem e Jornada
- Entra na Ordre des Éclairés como iniciante comum
- Aprende o procedimento de absorver Éclats como qualquer membro
- Conforme coleta Éclats, recebe **memórias do mundo** que ninguém mais recebeu
- Reconstrói a história verdadeira de Lumière e Or Ein Sof fragmento por fragmento
- Descobre verdades que nem os mais altos da hierarquia conhecem

### O Final
- Descobre que reconstituir Or Ein Sof apagará Nihel — que não escolheu existir
- Ele próprio já é tier Lumière — parte da luz
- A escolha carrega o peso de apagar algo que, como ele, apenas tentou existir

---

## 7. OS TIERS DE ASCENSÃO

Cada tier é uma rank dentro da Ordre des Éclairés. Os nomes ficam progressivamente mais profundos — do inglês simples ao nome da própria luz perdida.

| Tier | Nome | Significado | Mapa |
|------|------|-------------|------|
| 1 | **Seeker** | Busca sem entender | The Dreaming Wood |
| 2 | **Illuminate** | Começa a ver além do procedimento | Cavernes Luminis |
| 3 | **Éclairé** | Carrega luz conscientemente — membro pleno | The Ashen Ruins |
| 4 | **L'Éveillé** | Despertou para verdades que a ordem desconhece | The Fractured Peaks |
| 5 | **Lumière** | Tornou-se parte da própria luz — único que chegou aqui | Nil Aeternum |

---

## 8. OS 5 MAPAS

| Mapa | Nome | Tier | Background | Tom narrativo |
|------|------|------|------------|---------------|
| 1 | **The Dreaming Wood** | Seeker | Floresta de cogumelos bioluminescentes | Onírico, misterioso, ainda belo — primeiros Éclats |
| 2 | **Cavernes Luminis** | Illuminate | Caverna de cristais azuis e roxos | Majestoso, frio — Éclats cristalizados por milênios |
| 3 | **The Ashen Ruins** | Éclairé | Ruínas consumidas por raízes e névoa | Cinzas de Lumière — primeiras memórias reais chegam |
| 4 | **The Fractured Peaks** | L'Éveillé | Montanhas de lava e rocha rachada | Devastado — La Fractura ainda ativa aqui |
| 5 | **Nil Aeternum** | Lumière | Castelo sombrio com lua vermelha | Território de Nihel — o Nada Eterno |

---

## 9. MOEDAS E RECURSOS

| Nome | Significado | Uso principal |
|------|-------------|---------------|
| **Lumens** | Fragmentos de energia luminosa | Evoluir Gear, compras gerais |
| **Vestiges** | Resquícios de criaturas corrompidas | Desbloquear e evoluir Passivas |

> `Vestige` é **exclusivamente** a moeda. O tipo de inimigo é "The Eidola" (§4); o afixo de economia é "Vestige Bonus %" (referente à moeda).

---

## 10. O MUNDO HOJE

- Milênios após La Fractura — civilização reconstruída com estética Belle Époque + Vitoriana
- Cidades prósperas com arquitetura grandiosa, lampiões a gás, cafés e teatros
- Pessoas vivem normalmente sem saber da ameaça real
- A Ordre des Éclairés é vista como guarda especial — "protege contra criaturas selvagens"
- La Fractura existe como mito histórico — lenda de criança
- Éclats encontrados são vendidos como joias raras — a Ordre os compra discretamente

---

## 11. PONTOS DE LORE AINDA A DEFINIR

- [ ] Lore específica de cada subárea dos 5 mapas
- [ ] Endgame após Nil Aeternum — narrativa do final

---

# PARTE II — GAME DESIGN

---

## 12. VISÃO GERAL DO JOGO

- Idle RPG casual — o jogador abre, joga um pouco, fecha, volta e vê progresso
- Não é um jogo que pune quem fica offline
- Sessões curtas de 2-3 minutos de decisão
- Progressão longa e deliberada — ~45-50 dias para completar os 5 mapas
- Plataforma primária: **Desktop** (mobile depois)
- Combate automático — herói e inimigos como cards, projéteis viajam entre eles

---

## 13. SISTEMA DE PROGRESSÃO — CAMADAS

| Camada | Nome no universo | Reseta? |
|--------|-----------------|---------|
| Level up | Level | Sim (na Convergence) |
| Gear | Gear | Sim (na Ascensão — vira material) |
| Echoes | Echoes | Nunca |
| Convergence | Convergence | — |
| Ascensão | Ascensão | — |
| Passivas | Passivas | Nunca |

---

## 14. SISTEMA DE CONVERGENCE (REBIRTH)

- **O que reseta:** stats, Lumens, Gear
- **O que permanece:** Echoes, Passivas, progresso de mapa
- **O que dá:** 1 ponto permanente que multiplica os stats do herói

### Multiplicador por ponto
- Convergences 1-4 → ×1.20 cada (multiplicativo)
- Convergences 5-8 → ×1.12 cada (multiplicativo)
- Convergences 9+ → +5% cada (aditivo, controlado)

### Spikes de marco (RESOLVIDO)
- A cada **5 Convergences** (5, 10, 15, 20…) → spike **×1.5** adicional
- Reusa o padrão `tierSpikeMultiplier` já existente em `js/progression.js`
- Efeito: ~×26 de multiplicador após 20 Convergences, com 4 "momentos grandes" de renascimento (evita late-game morno)

### Modelo de tempo (RESOLVIDO)
Três relógios distintos — **não** confundir:

| Relógio | O que é | Duração |
|---|---|---|
| **Tick de combate** | Motor real, roda contínuo (online + estimado offline) | sempre |
| **Check-in (sessão)** | Jogador abre, decide, fecha | 2-3 min |
| **Cadência de Convergence** | Tempo *real* até valer renascer | variável (curva ↓) |

Curva de cadência (wall-clock): Convergences 1-5 = minutos a ~1h · 6-12 = horas · 13-20 = ~meio dia a 1 dia. Total: **10-20 Convergences em 15-20 dias** (Mapa 1).

### Trigger (RESOLVIDO)
- **Livre** — o jogador pode disparar Convergence a qualquer momento
- Como cada Convergence vale 1 ponto e a parede de HP é geométrica, renascer cedo demais é **auto-punitivo** (subótimo, não bloqueado)
- O jogo apenas **sinaliza** "recomendado renascer" quando o crescimento estagna (plateau). Sem gate rígido.

---

## 15. SISTEMA DE ASCENSÃO

- **Gatilho:** derrotar o chefe final da Subárea 5
- **O que acontece:** Gear atual → vira material base para Gear do próximo mapa
- **O que desbloqueia:** próximo Mapa + próximo tier da Ordre

| Mapa | Tier desbloqueado | Tempo estimado |
|------|------------------|---------------|
| The Dreaming Wood | Seeker → Illuminate | 15-20 dias |
| Cavernes Luminis | Illuminate → Éclairé | 10-12 dias |
| The Ashen Ruins | Éclairé → L'Éveillé | 7-8 dias |
| The Fractured Peaks | L'Éveillé → Lumière | 5-6 dias |
| Nil Aeternum | Lumière (final) | 4-5 dias |
| **Total** | — | **~45-50 dias** |

---

## 16. ESTRUTURA DOS MAPAS — OPEN ZONE PROGRESSION

- 5 Subáreas por mapa
- Inimigos spawnam continuamente — sem "limpar" obrigatório
- Chefe como gatekeeper — trigger hidden (kills não visíveis ao jogador)
- Chefe é loop de recompensa recorrente após derrota

### Escala de HP por Mapa
| Mapa | HP início | HP fim |
|------|-----------|--------|
| The Dreaming Wood | 10 | ~1e12 |
| Cavernes Luminis | 1e12 | ~1e24 |
| The Ashen Ruins | 1e24 | ~1e36 |
| The Fractured Peaks | 1e36 | ~1e48 |
| Nil Aeternum | 1e48 | ~1e60 |

> **Nota técnica:** 1e60 está dentro do range de `double` do JS (max ≈ 1.8e308). Trabalhar sempre com multiplicadores **relativos**; aditivos pequenos somados a bases gigantes são negligenciáveis (aceitável p/ idle). Se o endgame passar de ~1e300, migrar para `break_infinity.js`/BigInt.

### Estrutura de Subáreas (Mapa 1 como referência)
| Subárea | Range de nível | Gatekeeper |
|---------|---------------|-----------|
| Subárea 1 | Nível 1-50 | Chefe aleatório |
| Subárea 2 | Nível 50-200 | Chefe aleatório |
| Subárea 3 | Nível 200-1.000 | Chefe aleatório |
| Subárea 4 | Nível 1.000-10.000 | Chefe aleatório |
| Subárea 5 | Nível 10.000-100.000 | Chefe boss final → Ascensão |

---

# PARTE III — SISTEMA DE PASSIVAS

---

## 17. VISÃO GERAL

- **3 árvores temáticas:** Éclat, Vestige, Fracture
- **15 passivas por árvore** — 45 no total
- **Todas ativas simultaneamente** — sem slots limitados
- **Permanentes** — nunca resetam em Convergence ou Ascensão
- **Como desbloquear:** Vestiges
- **Como evoluir:** Vestiges + requisitos de kills
- **Novas passivas por mapa:** cada Ascensão aprofunda as árvores
- As três árvores são **complementares** — jogador investe nas três

---

## 18. ÁRVORE ÉCLAT — Combate

> Poder que vem de absorver fragmentos de Or Ein Sof.

| # | Nome | Efeito | Mapa |
|---|------|--------|------|
| 1 | **Radiant Strike** | +% dano base | 1 |
| 2 | **Shard Burst** | Dano em área | 1 |
| 3 | **Luminal Edge** | +% Crit Rate | 1 |
| 4 | **Resonant Force** | Cada kill aumenta dano temporariamente | 2 |
| 5 | **Éclat Surge** | Chance de ataque duplo | 2 |
| 6 | **Execute** | Mata instantaneamente abaixo de X% HP | 2 |
| 7 | **Overkill** | Dano excedente transborda para próximo inimigo | 3 |
| 8 | **Momentum** | Kills consecutivas aumentam dano | 3 |
| 9 | **Refraction** | % do dano crítico retorna como cura | 3 |
| 10 | **Crit Cascade** | Crítico tem chance de triggar ataque imediato | 3 |
| 11 | **Luminal Explosion** | Kill com crítico explode em AoE | 4 |
| 12 | **Or Ein Sof's Touch** | **+% no fator de transbordo** (amplifica `CRIT_OVERFLOW_TO_DMG`) | 4 |
| 13 | **Shattered Light** | Cada 100% de Crit Rate acima do cap dá um **multiplicador extra de Crit Damage** | 4 |
| 14 | **Fracture Weakness** | +% dano contra The Claimed e Qliphoth | 4 |
| 15 | **Void Piercing** | Ignora defesa de qualquer inimigo corrompido | 5 |

> **#12 e #13 (RESOLVIDO):** substituem os antigos "Or Ein Sof's Touch (amp Super Crit)" e "Hyper Crit (3ª camada)". Com o crit camada-única, a identidade de crit no late-game é **maximizar o transbordo** (§30).

---

## 19. ÁRVORE VESTIGE — Economia

> Poder que vem dos resquícios das criaturas derrotadas.

| # | Nome | Efeito | Mapa |
|---|------|--------|------|
| 1 | **Lumen's Blessing** | +% Lumens por kill | 1 |
| 2 | **Wisdom of Ruins** | +% XP por kill | 1 |
| 3 | **Remnant Harvest** | +% chance de dropar materiais | 1 |
| 4 | **Vestige Pull** | +% Vestiges por kill | 1 |
| 5 | **Scavenger** | +% drop de materiais de chefe | 2 |
| 6 | **Dreamwalker** | +% kills por segundo offline | 2 |
| 7 | **Beast Caller** | +% chance de encontrar Echoes | 2 |
| 8 | **Hoarder** | +% Lumens ganhos após cada Convergence | 3 |
| 9 | **Awakened Harvest** | Materiais raros têm chance de dropar duplo | 3 |
| 10 | **Echo of Greed** | Chefe dropa recompensa extra na segunda kill | 3 |
| 11 | **Void Scavenger** | +% materiais ao matar The Claimed e Qliphoth | 4 |
| 12 | **Eternal Vestige** | Total de Vestiges gastos dá bônus passivo de XP | 4 |
| 13 | **Fractured Soul** | Ao matar inimigo, X% chance de dropar loot de tier acima | 4 |
| 14 | **Luminal Cache** | Primeiro minuto online após offline triplica Lumens | 5 |
| 15 | **The Collector** | Cada tipo de Echo encontrado dá bônus permanente de Lumens | 5 |

---

## 20. ÁRVORE FRACTURE — Utilidade

> Poder que vem de entender a natureza de Nihel e La Fractura.

| # | Nome | Efeito | Mapa |
|---|------|--------|------|
| 1 | **Weakened Void** | -% HP dos inimigos | 1 |
| 2 | **Fracture Sense** | Chefe spawna mais rápido — afeta primeiro spawn | 1 |
| 3 | **Void Awareness** | +% recompensas de qualquer fonte | 1 |
| 4 | **Fracture Pulse** | Ao entrar numa subárea, inimigos começam com -X% HP | 2 |
| 5 | **Void Haste** | Reduz tempo de spawn dos inimigos | 2 |
| 6 | **Shard Disruption** | Chance de inimigo perder turno de ataque | 2 |
| 7 | **Nihel's Shadow** | Inimigos têm -% de dano | 3 |
| 8 | **Éclat Attunement** | Vestiges gastos amplificam Weakened Void e Nihel's Shadow | 3 |
| 9 | **La Fractura's Echo** | Segundo spawn do chefe em diante começa com HP reduzido | 3 |
| 10 | **Last Light** | Abaixo de 30% HP, dano aumenta X% | 4 |
| 11 | **Void Collapse** | Corrompidos implodem causando AoE ao morrer | 4 |
| 12 | **The Fracture's Gift** | Ao quase morrer, burst de dano temporário | 4 |
| 13 | **Claimed Domination** | The Claimed têm -% stats acima de X tier | 4 |
| 14 | **Nil's Embrace** | Quanto mais tempo numa subárea, mais forte o jogador | 5 |
| 15 | **Void Endurance** | +% defesa e HP por chefe derrotado no mapa atual | 5 |

### Notas
- **Arquétipo Berserker:** Last Light + The Fracture's Gift empilhados — jogar com HP baixo é recompensado
- **Fracture's Trial:** sistema separado de dificuldade voluntária — ver §38

---

# PARTE IV — SISTEMA DE ECHOES

---

## 21. VISÃO GERAL

- **Nome:** Echoes — resquícios de Or Ein Sof que sobreviveram na forma de criaturas
- **Função:** Stats passivos sempre ativos — nunca resetam
- **Como encontrar:** Drop de inimigos
- **Como craftar:** Recipe fixa — materiais comuns do mapa + material especial do chefe
- **Quantidade:** 5-8 Echoes por mapa, 25-40 no total
- **Stats:** Fixos por Echo, variados sem tema por mapa
- **Poder:** Crescente por mapa — Echoes de Nil Aeternum são sempre mais fortes

---

## 22. RARIDADES DOS ECHOES

Baseado na proximidade com Or Ein Sof:

| Tier | Nome | Significado |
|------|------|-------------|
| 1 | **Hollow** | Vazio — pouca luz restante |
| 2 | **Flickering** | Vacilante — luz instável |
| 3 | **Resonant** | Ressonante — vibra com Or Ein Sof |
| 4 | **Awakened** | Desperto — luz consciente de sua origem |
| 5 | **Sovereign** | Soberano — luz pura, quase reconstituída |

---

## 23. STATS DE ECHOES — TRÊS CATEGORIAS

### Categoria 1 — Amplificadores
| Stat | O que amplifica |
|------|----------------|
| Attack Bonus % | Dano do Gear |
| Crit Damage Bonus | Crit do Gear |
| Lumens Bonus % | Lumen's Blessing e economia |
| XP Bonus % | Wisdom of Ruins |
| Offline Bonus % | Dreamwalker |

### Categoria 2 — Exclusivos de Echoes
| Stat | O que faz |
|------|-----------|
| Enemy HP Reduction | Reduz HP dos inimigos diretamente |
| Vestige Bonus % | Mais Vestiges por kill |
| Boss Damage % | Dano específico em chefes |
| Convergence Bonus | Bônus extra após cada Convergence |
| Elemental Affinity | Bônus de dano contra tipos específicos |

### Categoria 3 — Stats Únicos
| Stat | O que faz |
|------|-----------|
| Attack Mastery | Escala com o nível do jogador |
| Attack Multiplier | Multiplicador direto de todo o dano |
| Void Resistance | Reduz dano recebido de corrompidos |
| Éclat Affinity | Bônus ao absorver Éclats |

---

## 24. EXEMPLO DE RECIPE

```
Echo "Dreaming Sprite" (Hollow):
- 10x Dim Shard
- 3x Dreamspore
→ Stats: Attack Bonus % + XP Bonus %
```

---

## 25. PONTOS AINDA A DEFINIR

- [ ] Lista completa de Echoes por mapa com stats e recipes
- [ ] Sistema de evolução/upgrade dos Echoes
- [ ] Loadouts de Echoes para diferentes objetivos

---

# PARTE V — SISTEMA DE GEAR

---

## 26. AS 6 PEÇAS

| Peça | Nome | Stat principal | Tom |
|------|------|---------------|-----|
| Weapon | **The Waning Edge** | Attack | A lâmina que diminui a luz dos inimigos |
| Armor | **Veil of Cinders** | HP | O véu das cinzas de Lumière |
| Helmet | **Crown of Hollow Stars** | Boss Damage | Coroa das estrelas vazias |
| Gloves | **Grasp of the Unnamed** | Crit Damage | O toque daquilo que não tem nome |
| Amulet | **The Last Resonance** | Lumens | O último eco de Or Ein Sof |
| Ring | **Band of Dusk** | Vestiges | O anel do crepúsculo — entre luz e nada |

---

## 27. SISTEMA DE RARIDADE E AFIXOS

- Gear evolui com **Lumens** (level up) + **Materiais** (raise rarity)
- Afixos são fixos por peça — quantidade aumenta com raridade
- Afixo Legendary exclusivo é único e fixo por peça

| Raridade | Afixos ativos | Custo para evoluir |
|----------|--------------|-------------------|
| Common | 1 | Dim Shards |
| Uncommon | 2 | Pale Fragments |
| Rare | 3 | Void Dust |
| Epic | 4 | Material especial do mapa |
| Legendary | 5 + exclusivo | Material especial do mapa (maior quantidade) |

---

## 28. AFIXOS POR PEÇA

### The Waning Edge — Weapon
| # | Afixo | Efeito |
|---|-------|--------|
| 1 | Crit Rate | +% chance de crítico |
| 2 | Attack Speed | +% velocidade de ataque |
| 3 | **Crit Damage** | +% dano de crítico *(era "Super Crit Rate" — RESOLVIDO)* |
| 4 | Boss Damage | +% dano contra chefes |
| 5 | AoE Damage | +% dano em área |
| Legendary | **Edge of the Fracture** | Ao matar inimigo, X% chance de atacar novamente |

### Veil of Cinders — Armor
| # | Afixo | Efeito |
|---|-------|--------|
| 1 | Defense | +% redução de dano (logarítmica) |
| 2 | HP Regen per Kill | +HP recuperado por kill |
| 3 | HP Regen Amplifier | ×% amplifica regen base por segundo |
| 4 | Void Resistance | -% dano de corrompidos |
| 5 | Damage Reduction | -% todo dano recebido |
| Legendary | **Ashen Ward** | Escudo ao quase morrer |

### Crown of Hollow Stars — Helmet
| # | Afixo | Efeito |
|---|-------|--------|
| 1 | Crit Rate vs Bosses | +% crit contra chefes |
| 2 | Boss HP Reduction | -% HP de chefes |
| 3 | Boss Spawn Rate | Chefes spawnam mais rápido |
| 4 | Boss Drop Rate | +% chance de drop especial de chefe |
| 5 | Boss Damage Multiplier | ×% multiplicador de dano em chefes |
| Legendary | **Hollow Triumph** | Ao matar chefe, todos os stats +X% até próxima Convergence |

### Grasp of the Unnamed — Gloves *(DIVERSIFICADA — RESOLVIDO)*
| # | Afixo | Efeito |
|---|-------|--------|
| 1 | Attack Speed | +% velocidade de ataque |
| 2 | AoE Damage | +% dano em área |
| 3 | Crit Rate | +% chance de crítico |
| 4 | Crit Damage | +% dano de crítico |
| 5 | Crit Cascade Chance | +% chance de ataque adicional ao criticar |
| Legendary | **Unnamed Precision** | Crítico tem X% de chance de não consumir contador do Execute |

> Antes era 100% crit (Super/Hyper Crit). Com o crit camada-única, virou peça **híbrida** de velocidade/AoE/crit.

### The Last Resonance — Amulet
| # | Afixo | Efeito |
|---|-------|--------|
| 1 | XP Bonus | +% XP por kill |
| 2 | Vestige Bonus | +% Vestiges por kill |
| 3 | Offline Bonus | +% progressão offline |
| 4 | Material Drop Rate | +% chance de drop de materiais |
| 5 | Lumens Multiplier | ×% multiplicador de todo Lumens ganho |
| Legendary | **Last Echo** | Primeiros 60s online após offline — todos os drops triplicam |

### Band of Dusk — Ring
| # | Afixo | Efeito |
|---|-------|--------|
| 1 | Attack Multiplier | ×% multiplicador de dano base |
| 2 | Enemy HP Reduction | -% HP de todos os inimigos |
| 3 | Convergence Bonus | +% bônus após cada Convergence |
| 4 | Éclat Affinity | +% bônus ao absorver Éclats |
| 5 | All Stats Bonus | +% bônus em todos os stats |
| Legendary | **Dusk Compact** | Cada Convergence aumenta permanentemente X% todos os afixos desta peça |

---

## 29. NOTAS DO SISTEMA DE GEAR

- Cada mapa tem seu próprio conjunto de Gear — The Dreaming Wood Gear, Cavernes Luminis Gear, etc.
- Na Ascensão: Gear atual vira material base para Gear do próximo mapa
- Sistema de gems para tiers além de Legendary — a definir

---

# PARTE VI — SISTEMAS DE COMBATE

---

## 30. SISTEMA DE ATAQUE

### Attack Speed
- Early game: 1 ataque a cada 2 segundos
- Late game: até 20 ataques por segundo (teto)
- Fórmula: `ataques_por_segundo = min(20, √atkSpeed × fator)`
- Visual: projétil viajando do herói até o inimigo
- Velocidade do projétil escala com Attack Speed

### Sistema de Crítico (RESOLVIDO — camada única + transbordo)

Existe **um único tier de crítico**. O excedente de Crit Rate acima de 100% **transborda para Crit Damage**.

```
critRate_raw = baseCritRate + afixos(Crit Rate) + LCK + passivas
critRate_eff = min(1.0, critRate_raw)          # chance efetiva (capa em 100%)
overflow     = max(0, critRate_raw − 1.0)      # o que passou de 100%

critMult = baseCritMult (2.0)
         + afixos(Crit Damage)
         + itemPower(Gloves) × critDmgPerPower
         + overflow × CRIT_OVERFLOW_TO_DMG      # transbordo vira dano (default 1.0)
         + Shattered Light (passiva): mult extra por cada 100% de overflow

# Valor esperado (motor sem-RNG por tick):
EV_por_hit = 1 + critRate_eff × (critMult − 1)
```

- `CRIT_OVERFLOW_TO_DMG` é constante no CONFIG (default 1.0 = 1% de crit acima de 100% → +1% de crit damage). Tunável.
- Passiva **Or Ein Sof's Touch** amplifica esse fator; **Shattered Light** dá mult extra por cada 100% de overflow.
- Super Crit e Hyper Crit **não existem mais**.

---

## 31. SISTEMA DE DEFESA

```
regen_base = level × fator_pequeno
regen_total = regen_base × (1 + afixo_veil_regen)

dano_reduzido = dano_inimigo × (1 - log10(defense + 1) / 10)
dano_recebido = dano_reduzido × dt
```

| Defense | Redução |
|---------|---------|
| 0 | 0% |
| 100 | 20% |
| 1.000 | 30% |
| 10.000 | 40% |
| 100.000 | 50% |

Nunca chega a 100% — jogador nunca fica imortal. (Tabela usa `log10`.)

---

## 32. HP REGEN — TRÊS FONTES

| Fonte | Como funciona |
|-------|--------------|
| Regen base/s | `level × fator_pequeno` — sempre ativo |
| HP Regen Amplifier | Afixo do Veil of Cinders — multiplica regen base |
| Regen por kill | Afixo do Veil of Cinders — HP fixo por kill |
| Refraction (Passiva) | % do dano crítico retorna como HP |

---

## 33. DANO CRÍTICO DOS INIMIGOS

```
inimigo_crit_chance = random(3%, 8%) — escala aleatória por subárea
inimigo_crit_mult = 2.5x

chefe_crit_chance = random(15%, 25%)
chefe_crit_mult = 3.0x

dano_crit_recebido = dano_normal × crit_mult × (1 - log10(defense + 1) / 10)
```

---

## 34. VISUAL DOS PROJÉTEIS (RESOLVIDO — 3 tiers por magnitude)

Colapsado de 4 → **3 tiers cosméticos**, baseados na *magnitude do crit damage* (não em rolagem separada):

| Tipo | Cor | Número de dano | Quando |
|------|-----|----------------|--------|
| Normal | Dourado/branco | Branco | hit sem crit |
| Crit | Dourado intenso com rastro | Dourado | hit com crit |
| **Radiant Crit** | Azul→branco puro, fragmenta em Éclats | Branco com borda dourada | crit damage acima de limiar cosmético (builds de overflow pesado) |

> Funde os antigos visuais de Super+Hyper Crit num só "crit grande". É puramente cosmético — sem efeito mecânico.

---

# PARTE VII — MATERIAIS E CRAFT

---

## 35. MATERIAIS UNIVERSAIS

| Raridade | Nome | Fonte | Uso |
|----------|------|-------|-----|
| Common | **Dim Shard** | Inimigos normais | Gear Common → Uncommon |
| Uncommon | **Pale Fragment** | Inimigos elite | Gear Uncommon → Rare |
| Rare | **Void Dust** | Inimigos champion | Gear Rare → Epic |

---

## 36. MATERIAIS ESPECIAIS POR MAPA

| Mapa | Material | Raridade |
|------|----------|----------|
| The Dreaming Wood | **Dreamspore** | Rare |
| Cavernes Luminis | **Crystal Tear** | Rare |
| The Ashen Ruins | **Cinder Shard** | Epic |
| The Fractured Peaks | **Rift Fragment** | Epic |
| Nil Aeternum | **Nil Essence** | Legendary |

---

## 37. USOS DOS MATERIAIS

| Uso | Materiais |
|-----|-----------|
| Gear Common → Uncommon | Dim Shards |
| Gear Uncommon → Rare | Pale Fragments |
| Gear Rare → Epic | Void Dust |
| Gear Epic → Legendary | Material especial do mapa |
| Craftar Echoes básicos | Dim Shards + material especial Mapa 1-2 |
| Craftar Echoes avançados | Pale Fragments + material especial Mapa 3-4 |
| Craftar Echoes raros | Void Dust + Nil Essence |
| Ascensão | Gear atual → material base para próximo mapa |

---

# PARTE VIII — FRACTURE'S TRIAL

---

## 38. FRACTURE TIERS

- **Conceito:** corromper voluntariamente a realidade do mapa atual
- **Ativação:** manual — jogador controla o tier
- **Persistência:** não reseta com Convergence ou Ascensão

```
inimigo_HP = HP_base × (1 + tier × 0.5)
inimigo_dano = dano_base × (1 + tier × 0.3)
recompensas = 1 + tier × 0.4
```

| Tier | HP inimigos | Dano inimigos | Recompensas |
|------|-------------|---------------|-------------|
| 0 | 1x | 1x | 1x |
| 5 | 3.5x | 2.5x | 3x |
| 10 | 6x | 4x | 5x |
| 20 | 11x | 7x | 9x |

> Recompensas crescem mais devagar que o HP — em tiers altos vira parede de eficiência (intencional).

---

# PARTE IX — MECÂNICAS EXCLUSIVAS DE CADA MAPA

---

## 39. MECÂNICAS POR MAPA

| Mapa | Mecânica | Efeito | Tom |
|------|----------|--------|-----|
| The Dreaming Wood | **Dream Pulse** | Efeitos aleatórios positivos/negativos a cada X segundos | Imprevisível |
| Cavernes Luminis | **Luminis Echo** | Kills têm chance de dropar Éclat extra | Recompensa farm |
| The Ashen Ruins | **Ashen Memory** | Fragmentos acumulam e ativam bônus temporários poderosos | Recompensa progressão |
| The Fractured Peaks | **Fracture Surge** | Dano ambiental de lava — sobreviver acumula stacks de +% dano | Recompensa sobrevivência |
| Nil Aeternum | **Nihel's Drain** | Nihel drena stats — kills recuperam, matar chefe reverte tudo | Recompensa persistência |

---

## 40. PONTOS AINDA A DEFINIR

- [ ] Endgame após Nil Aeternum
- [ ] Lista completa de Echoes por mapa com stats e recipes
- [ ] Sistema de evolução/upgrade dos Echoes
- [ ] Loadouts de Echoes
- [ ] Visual final dos projéteis (referência de arte)
- [ ] Sistema de gems para tiers além de Legendary
- [ ] Lore específica de cada subárea dos 5 mapas
