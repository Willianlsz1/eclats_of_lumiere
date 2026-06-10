# Éclats of Lumière — Expansion Ideas
**Versão:** 1.0 · **Data:** 2026-06-10 · **Status:** documento vivo
**Regra:** nenhuma ideia aqui entra em produção sem virar decisão aprovada no GDD. Este doc registra ideias debatidas e seus status.

Legenda de status: ✅ **Aprovada como direção** · 🌱 **Precisa amadurecer** · ❌ **Descartada (com motivo)**

---

## 1. Mapas → Continentes ✅
**Ideia (Willian):** transformar os 5 mapas em continentes, estilo Grand Chase Classic, cada um com sub-áreas internas.

**Debate (2026-06-10):**
- Escala bem: expande conteúdo sem inventar lore nova — a cosmologia dos 5 mapas já está fechada (Dreaming Wood, Cavernes Luminis, Ashen Ruins, Fractured Peaks, Nil Aeternum).
- Cuidado: "continente" implica mapa-múndi visual de navegação → mais arte + UI.
- **Decisão de faseamento:** primeiro a evolução de estrutura (mapa → sub-áreas), mapa-múndi bonito como polish posterior.

---

## 2. Economia de passivas (gate por tier) ✅ *(com ajuste)*
**Ideia (Willian):** algo que gere pontos para comprar níveis de passivas; não liberar todas de uma vez — tiers 1/2/3, tier seguinte só após maximizar o anterior.

**Debate (2026-06-10):**
- Gate por tier é excelente para idle: cria objetivos de longo prazo.
- **Ajuste obrigatório: sem moeda nova.** Vestiges já são definidos na lore como "essence for passives". Moeda nova = inflação de sistemas. Usar Vestiges como ponto de compra; o que falta definir é **a fonte geradora** (kills? Convergence? relíquias?).
- Compatibilidade com regra existente: "45 passivas sempre ativas, nunca resetam" continua valendo (não resetam na Convergence). Fica explícito que **desbloqueio é progressivo**, persistência é permanente.

---

## 3. Echoes (pets): lore + bônus + raridades 🌱
**Ideia (Willian):** encaixar Echoes na lore, definir bônus e raridades.

**Debate (2026-06-10):**
- Encaixe de lore natural: Echoes = ressonâncias/memórias da luz fragmentada que acompanham o Seeker.
- Raridades: **reutilizar a escala existente** (Faded → Kindled → Luminous → Radiant → Converged) — consistência, menos arte de moldura, jogador já conhece.
- Bônus: cada Echo com bônus passivo + tema (gold, dano, Vestiges).
- **Status:** Echoes seguem em STANDBY por decisão anterior; detalhar quando Willian retomar oficialmente.

---

## 4. Mais sub-áreas + HP acima de 1e308 ✅ *(com dependência técnica)*
**Ideia (Willian):** aumentar sub-áreas para balancear melhor o range de HP dos mobs; possivelmente ultrapassar 1e308.

**Debate (2026-06-10):**
- Mais sub-áreas = curva de HP mais suave entre mapas. Conecta com a ideia 1 (continentes).
- **Dependência técnica obrigatória:** JavaScript puro estoura em ~1.8e308 (`Infinity`). Ultrapassar exige biblioteca de números grandes — padrão do gênero: **break_infinity.js** (recomendada; feita para idles, rápida) ou decimal.js.
- **Decisão de fundação:** quanto antes a biblioteca entrar no código, melhor — migrar depois (saves, fórmulas, formatação tipo "1.5e412") é caro.

---

## 5. Ascension com relíquias poderosas (game changers) ✅
**Ideia (Willian):** Ascensions usam as relíquias já implementadas; bônus precisam fazer sentido na lore, serem poderosos e do tipo **game changer** (desbloqueios que mudam a qualidade do jogo, não só números) — sem quebrar o balanceamento.

**Debate (2026-06-10):**
- As 15 relíquias de Mémoires já têm arte aprovada → ótimo uso como recompensas de Ascension.
- **Regra de ouro do balanceamento:** bônus multiplicativos *entre* categorias, aditivos *dentro* da mesma categoria (relíquias de gold somam entre si, multiplicam com passivas de gold).
- **Game changers** (padrão de Antimatter Dimensions, NGU Idle, Melvor): cada relíquia-chave desbloqueia uma *mecânica*, não só multiplicador. Exemplos candidatos para o Éclats:
  - auto-coleta de Lumens (automação)
  - manter X% dos Vestiges na Convergence (persistência)
  - offline progress melhorado
- Pesquisar referências concretas de "game changer unlocks" quando esta ideia for detalhada. *(pendência de pesquisa)*

---

## Pendências registradas
- [ ] Definir fonte geradora de Vestiges (ideia 2)
- [ ] Retomar Echoes e detalhar bônus/temas (ideia 3 — aguarda Willian)
- [x] Decidir momento de adoção do break_infinity.js (ideia 4) — **RESOLVIDO 2026-06-10:** instalado como dependência do projeto; a migração do código (saves, fórmulas, format) será um CP próprio pós-MVP
- [ ] Pesquisa de referências de game changer unlocks em idles (ideia 5)
- [ ] Mapa-múndi visual de continentes — polish futuro (ideia 1)
