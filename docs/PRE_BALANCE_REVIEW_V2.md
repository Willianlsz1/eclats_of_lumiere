# PRE_BALANCE_REVIEW_V2 — Pacing da Convergence (gate por Nível)

> Reanálise **read-only** após a decisão oficial: **Convergence é desbloqueada por
> Nível, não por Área.** Nenhum código foi alterado. Sem números finais — apenas
> estimativas arquiteturais.

---

## Descoberta-chave (muda a leitura de toda a auditoria)

A Convergence **já é desbloqueada por Nível** no código atual:

```js
// convergence.js
gateLevel: 80,
canConverge() { return G.state.data.level >= this.gateLevel; }
// ui.js → botão mostra "Reach Lv {gateLevel}" quando bloqueado
```

Não existe gate por Área. A única referência a Área dentro de `convergence.js` é
um **fator da fórmula de pontos** (`runMaxAreaIndex`), que é correto e não tem
relação com o desbloqueio.

**Consequência:** a decisão de design ("gate por Nível") já é a arquitetura
vigente. O problema do C1 nunca foi mecânico — é apenas que o **valor 80** cai no
fim da **Área 1**, enquanto o alvo de pacing é a **Área 3**. A correção é um
**número**, não uma mudança estrutural.

---

## Base de cálculo (curva atual do Mapa 1)

| Parâmetro | Valor (atual) |
|---|---|
| XP p/ próximo nível | `ceil(14 × nível)` |
| XP por kill | `10 × nível` (×(1+xpBonus), base 0) |
| **Kills por nível** | `14L / 10L ≈ **1,4** (constante)` |
| Kills acumuladas até o nível L | `≈ 1,4 × L` |

### Mapa Área → faixa de nível

| Área | Níveis | Kills acum. p/ chegar ao início (~1,4×) |
|---|---|---|
| 1 | 1–80 | ~0 |
| 2 | 81–350 | ~113 |
| **3** | **351–700** | **~491** |
| 4 | 701–1150 | ~981 |
| 5 | 1151–1700 | ~1.611 |
| … | … | … |
| 9 | 4051–5000 | ~5.671 |

> O nível do mob acompanha o nível do jogador (clampado à faixa da área) e a área
> avança ao atingir o teto + derrotar o boss. Logo, "estar na Área 3" ≈ estar
> entre os níveis **351 e 700**.

---

## 1. Gate de Convergence (nível 80) — cedo, adequado ou tarde?

**Cedo demais.** O nível 80 é exatamente a fronteira **Área 1 → Área 2**. Com a
meta de descoberta na **Área 3 (níveis 351–700)**, o gate atual antecipa o sistema
em ~2 áreas inteiras. Isso:

- expõe a metaprogressão antes do jogador dominar Gear/Lumens (quebra a curva de
  aprendizado planejada em `PROGRESSION_MAP1`);
- permite convergências triviais e muito frequentes ainda na Área 1–2, diluindo o
  peso da decisão "convergir".

Veredito: **cedo demais** — precisa subir para a faixa da Área 3.

---

## 2. Nível alvo (estimativa arquitetural, não final)

- **Desbloqueio / descoberta da Convergence:** **nível ~350–500**
  (início da Área 3). Coloca o gate logo na entrada da Área 3, exatamente o ponto
  de pacing desejado. ~491 kills ⇒ alguns minutos de jogo ativo no early.
- **Primeira Convergence real (escolha do jogador):** **nível ~700–1150**
  (Área 4). É onde o design prevê a "primeira parede"; o jogador descobre na Área 3
  e naturalmente realiza a primeira convergência ao entrar/avançar na Área 4.

> O gate (`gateLevel`) controla a **habilidade** de convergir; a **primeira
> convergência real** é uma escolha do jogador algumas dezenas de níveis depois.
> Como a filosofia é "o jogador escolhe o ritmo", o gate deve marcar o **piso**
> (início da Área 3) e não forçar a ação.

---

## 3. Meta de 8–12 Convergences — continua viável?

**Sim, viável** — e o gate por nível a sustenta melhor que o gate por área.

- Cada convergência exige apenas **alcançar o `gateLevel`** (≈ Área 3). Como a
  Convergence **reseta o nível** mas **preserva** Gear, Passivas, Áreas
  desbloqueadas e `maxAreaUnlocked`, o jogador faz vários ciclos curtos cedo e
  ciclos mais profundos depois.
- O requisito de Área do **First Light** usa `maxAreaUnlocked` (maior já
  alcançada, **persistente**), então alcançar a Área 9 uma vez fica travado; as
  8–12 convergências acontecem em runs anteriores e a run final vai até a Área 9
  **sem** convergir.
- **Dependência a registrar (não é conflito):** o número de convergências é
  inversamente proporcional ao `gateLevel`. Gate baixo (≈ Área 3) ⇒ convergências
  frequentes ⇒ fácil atingir 8–12. Gate alto (ex.: Área 6) ⇒ poucas convergências
  grandes ⇒ risco de **não** atingir 8–12 antes do First Light. Logo, `gateLevel`
  e a meta de 8–12 são **alavancas acopladas** que a Fase 3 deve co-tunar. Com o
  alvo ~350–500, a meta de 8–12 é confortável.

Não há conflito estrutural entre Awaken, progressão de áreas e nº de convergências.

---

## 4. Dependência de Área — algum sistema ainda pressupõe gate por Área?

**Não.** Varredura do código:

| Local | Usa Área para gate de Convergence? |
|---|---|
| `convergence.canConverge()` | ❌ usa `level >= gateLevel` |
| `convergence.pending()/points()` | ❌ Área entra só como **fator** da fórmula de pontos (`runMaxAreaIndex`) — correto |
| `ui.js` (botão/painel) | ❌ mostra `Reach Lv {gateLevel}` |
| `passives.unlocked()` | ❌ usa `convergences >= 1` |

Nenhum sistema gateia Convergence por Área. A "Área 3" aparece **apenas na
documentação** (`CONSTITUICAO`, `PROGRESSION_MAP1`) como linguagem narrativa de
pacing — deve ser reinterpretada como "o **nível** correspondente ao início da
Área 3". **Ação documental:** ajustar esses textos para falar em nível/faixa, não
em Área, evitando reintroduzir a confusão.

> Observação: o **Awaken** usa Área (`maxAreaUnlocked`) como requisito — mas isso é
> Awaken, não Convergence, e é intencional. Fora do escopo desta decisão.

---

## 5. Revisão dos riscos C1 e R2

### C1 — "doc diz Área 3 / código gateia no nível 80 (Área 1)"
**Reclassificado.** Não é uma contradição arquitetural (o mecanismo já é por
nível, como o design agora exige). É um **valor de pacing placeholder**: o
`gateLevel = 80` cai na Área 1 e deve subir para a faixa da Área 3 (~350–500).
- Severidade anterior: *Alta (contradição de pacing)*.
- Severidade revisada: **Baixa-Média (ajuste de 1 número na Fase 3)** + ação
  documental (reescrever "Área 3" como faixa de nível).
- **Continua válido?** Sim, como **tarefa de tuning**, não como defeito de
  arquitetura.

### R2 — "pacing de Convergence quebra a curva de aprendizado"
**Continua válido enquanto `gateLevel` permanecer 80**, mas deixa de ser um
**risco arquitetural** e passa a ser um **item de calibração** com remédio trivial
e conhecido (subir o gate para ~350–500). Sem mudança de código estrutural; um
único número resolve.
- Severidade anterior: *Médio*.
- Severidade revisada: **Baixo (tuning na Fase 3)**.

---

## 6. Higiene pré-balanceamento — lista atualizada

| Item | Classificação | Mudou? |
|---|---|---|
| 10 efeitos de passiva **órfãos** (bossDmg, eliteDmg, moreEnemies, gearXp, upgradeCostReduction, awakenReqReduction, awakenEfficiency, 3 capstones) | **Obrigatório antes** | não |
| Funções de slot rotacionadas (Gloves/Boots/Cloak) — C3 | **Obrigatório antes** | não |
| Attack Speed base/cap — C4 | **Obrigatório antes** | não |
| Redundância `matPct` ≡ `matGeneralPct` | **Recomendado** | não |
| Uncommon material sem sink no Mapa 1 | **Recomendado** | não |
| **Gate de Convergence (subir de 80 → ~350–500)** | **Recomendado / início da Fase 3** | **sim** — sai de "obrigatório/pacing" e vira um número da Fase 3 |
| Reescrever docs "Área 3" → faixa de nível | **Recomendado (documental)** | **novo** |
| Remoção de legados, Rare+ vs Elite, arte/nomes, 2º afixo | **Pode esperar (Mapa 2)** | não |

> O gate de Convergence **deixou de ser pré-requisito de higiene** e tornou-se um
> dos primeiros números a definir na Fase 3 — porque o mecanismo já está correto.

---

## 7. Recomendação final sobre o pacing da Convergence

1. **Manter o gate por Nível** (já implementado) — alinhado com a filosofia de
   "o jogador escolhe o ritmo". Nenhuma mudança de mecanismo.
2. **Subir `gateLevel` de 80 para a faixa ~350–500** (início da Área 3) na Fase 3.
   Isso entrega "descoberta na Área 3" sem amarrar a Convergence a uma Área.
3. **Co-tunar `gateLevel` com a meta de 8–12 Convergences** e com a curva de
   pontos (`weights` + `legacy.C/k`), pois são alavancas acopladas. Ao subir o
   gate, lembrar que a referência `level/gateLevel` da fórmula de pontos também
   muda (hoje placeholder).
4. **Atualizar a documentação** (`CONSTITUICAO`, `PROGRESSION_MAP1`) para descrever
   o desbloqueio como **faixa de nível** (~350–500), não como "Área 3", eliminando
   a ambiguidade que originou o C1.
5. **Não** introduzir gate por Área nem mecânica de "teaser" separada — o botão
   "Reach Lv X" já cumpre o papel de descoberta antecipada.

**Síntese:** a decisão oficial confirma a arquitetura existente. O C1/R2 colapsam
em **um único ajuste numérico** (gate ~350–500) + uma correção de texto na
documentação, ambos a serem feitos no **início da Fase 3**. A meta de 8–12
Convergences permanece viável e fica mais saudável com o gate na Área 3.
