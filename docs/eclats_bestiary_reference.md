# ✦ Éclats of Lumière — Bestiário / Manual de Criação de Mobs

**Referência para criar criaturas dos mapas novos.** Separado da Lore Bible (`eclats_lore_bible.md`), que é a fonte da narrativa; este arquivo é o **manual de produção** de inimigos.
Data: 2026-06-12 · ✅ sessão de validação de lore jun/2026
Companheiros: Lore Bible (narrativa) · Art Direction v2 (visual) · GDD Final v2 (sistemas).

---

## 1. A REGRA DO BESTIÁRIO

As criaturas deste mundo **NÃO são monstros** — são coisas **habitadas pela luz** (ou **abandonadas por ela**). Cada inimigo é um ser que tocou, absorveu, perdeu ou foi esvaziado de luz. O tom é **belo e errado**, nunca "monstrengo".

- **Borboletas brancas** seguem várias delas: a luz reconhecendo a luz, mesmo corrompida. (Usar como motivo recorrente.)
- Antes de desenhar/nomear: pergunte **o que a luz fez (ou deixou de fazer) com este ser** — a resposta é a criatura.

---

## 2. TAXONOMIA → PAPEL DE GAMEPLAY

Cinco classes. Cada uma tem um papel mecânico e uma região-âncora — use para povoar mapas novos.

| Classe | O que são | Papel de gameplay | Região-âncora |
|---|---|---|---|
| **The Fragmented** | seres perdidos dentro de um Éclat; ainda guardam traços do que foram; tom belo/errado | **mobs comuns de regiões "inocentes"** | **Map 1** |
| **The Consumed** | ex-membros da Ordre e da primeira civilização; absorveram demais; a jaula rachou | **mobs comuns de regiões marcadas pela queda** | **Map 3** |
| **The Claimed** | os que pertencem ao Nada; vazam **escuridão**, não luz; ex-nobres e cavaleiros | **mobs de elite / regiões próximas da corte** | **Maps 4-5 e Hollows** |
| **The Qliphoth** | cascas vazias a serviço do Nada; **destroem Éclats** | **mobs do território do Nada** | **Map 5 e Hollows profundos** |
| **The Eidola** | manifestações densas de luz/vazio com forma própria; cada um **encarna a lição do seu mapa** | **EXCLUSIVAMENTE Guardiões de sub-área e Bosses** | todos os mapas |

- **The Eidola são só chefes.** Nenhum mob comum é Eidola. **Os nobres dos Hollows são Eidola da corte** (cada Hollow = um Eidola ancorando seu domínio).
- *(Map 2 é zona de transição — luz tentando se reconstituir; seus mobs são **The Fragmented** em variante cristalizada, ainda pré-queda.)*

---

## 3. REGRA DE IDIOMAS PARA NOMES NOVOS

A UI do jogo é em **inglês**; os nomes seguem as camadas (ver Lore Bible, Apêndice A).

- **Mobs comuns → INGLÊS evocativo.** Padrão dos atuais: **Substantivo+Substantivo** ou **Adjetivo+Substantivo** (*Candlewisp Shade*, *Crystalbound Husk*, *Ember Revenant*, *Fissure Stalker*). Curto, imagético, "belo e errado".
- **Bosses/Guardiões (Eidola) → "The" + nome.** *The Gilded Hollow*, *The Ashen King*.
- **Títulos altos / nobres da corte → francês** (raros) quando couber; **latim** só para o que vier de **Nil Aeternum** (a língua morta do Nada).
- **Hebraico só em texto morto / Mémoires** — nunca em nome de mob.

### A regra do "The" (taxonomia)
A classe taxonômica é **sempre "The" + capitalização** — é nome próprio: *The Consumed*, **nunca** "consumed ones" nem "the consumed". O "The" não é artigo solto; é parte do nome da classe.

### A regra dupla de HOLLOW
**Hollow = o que resta quando o Nada esvazia algo.** Use SÓ para:
- um **SER** esvaziado (*The Gilded Hollow*, *Hollowed Pilgrim*, *Hollowflame Adept*), ou
- um **LUGAR** esvaziado (*os Hollows*, as dungeons).

**Proibido uso novo acidental** da palavra "hollow" fora dessas duas naturezas.

---

## 4. LISTA COMPLETA DOS MOBS/BOSSES ATUAIS (exemplos por classe)

Os 5 mapas atuais, com a classe taxonômica de cada criatura — referência de tom e nomenclatura.

### Map 1 — The Dreaming Wood — *The Fragmented*
| Criatura | Classe | Nota |
|---|---|---|
| Candlewisp Shade | The Fragmented | belo, silencioso, errado |
| Mothlight Herald | The Fragmented | — |
| Dreamhorn Warden | The Fragmented | — |
| **The Gilded Hollow** (boss) | **The Eidola** | membro da Ordre esvaziado; o primeiro espelho |

### Map 2 — Cavernes Luminis — *The Fragmented* (variante cristalizada)
| Criatura | Classe | Nota |
|---|---|---|
| Crystalbound Husk | The Fragmented | Éclat cristalizado |
| Luminis Pilgrim | The Fragmented | — |
| Hollowflame Adept | The Fragmented | *Hollow* = ser esvaziado |
| **The Pale Reunion** (boss) | **The Eidola** | reunião sem o índice = errada; espelho do tier Lumière |

### Map 3 — The Ashen Ruins — *The Consumed*
| Criatura | Classe | Nota |
|---|---|---|
| Ember Revenant | The Consumed | — |
| Emberhorn Penitent | The Consumed | sacerdote de uma fé morta, ainda servindo |
| Ash Choir | The Consumed | um hino silencioso em forma |
| **The Ashen King** (boss) | **The Eidola** | o rei que se recusou a morrer com o reino |

### Map 4 — The Fractured Peaks — *The Claimed* (+ ferida viva)
| Criatura | Classe | Nota |
|---|---|---|
| Fissure Stalker | (ferida viva / proto-Hollow) | a fissura que respira — costura com os Hollows |
| Sundered Titan | The Claimed | preso por correntes e pela própria luz; adoradores ajoelhados |
| Claimed Vanguard | The Claimed | cavaleiro sagrado que agora serve o Nada; borboletas brancas o seguem |
| **The Hollowed Pilgrim** (encontro raro) | **The Eidola** (eco) | Seeker de um ciclo esquecido; família do Echo |
| **The Claimed Queen** (boss) | **The Eidola** | ajoelhou para o Nada; primeira gota de vermelho fora do Map 5 |

### Map 5 — Nil Aeternum — *The Claimed* (corte) + *The Qliphoth*
| Criatura | Classe | Nota |
|---|---|---|
| Pale Courtier | The Claimed | nobreza do vazio |
| Crownless King | The Claimed | rei que ajoelhou |
| Crimson Wyrmlord | The Claimed | nobre-dragão da corte carmesim ("e seus pares" = reservatório de vilões dos Hollows) |
| *(Qliphoth Shell)* | The Qliphoth | casca vazia; destrói Éclats |
| **Nihel, The Fracture** (boss final) | **The Eidola** | o vácuo que a luz deixou; o único dourado do Map 5 |

> Guardiões de sub-área (Subs 1-4) são **The Eidola** menores — manifestações densas que encarnam um pedaço da lição do mapa. (No código atual usam arte de mob do mapa como placeholder.)

---

## 5. CHECKLIST PARA UM MOB NOVO

1. **Região** → define a classe (Fragmented/Consumed/Claimed/Qliphoth) e o tom de cor (dourado preso / escuridão Claimed / vermelho só em Nil Aeternum e Hollows).
2. **O que a luz fez com ele** → a forma e a lição.
3. **Nome em inglês** (Adj+Subst / Subst+Subst), belo e errado; "The" só se for Eidola (chefe).
4. **Borboletas brancas?** quando a luz ainda reconheceria o que ele foi.
5. **Hollow?** só se foi literalmente esvaziado pelo Nada (ser) — nunca por acidente.
