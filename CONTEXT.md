# Context — Gaiadon Clone

Glossário do domínio do jogo. Apenas termos e seus significados — sem detalhes de
implementação. Texto in-game é em **inglês**; este glossário explica em português.

## Termos

### Hero
O personagem único controlado pelo jogador (por ora só 1). Tem quatro **Stats**.

### Stat
Atributo numérico do Hero. São exatamente quatro:
- **Damage** — dano por golpe.
- **Health** — vida; quanto o Hero aguenta antes de morrer.
- **Attack Speed** — golpes por segundo. `Damage × Attack Speed = DPS`.
- **Gold Find** — bônus percentual de ouro ganho (economia, não combate).

### Zone
O nível de profundidade da progressão, contínuo e **infinito** (Zone 1, 2, 3 …).
Inimigos escalam pela Zone, **não** pelo nível do Hero. "Empurrar" significa avançar
para Zones mais fundas.

### Region
Agrupamento **cosmético** de Zones (tema visual + pool de nomes de inimigos). Muda a
cada N Zones. Não afeta regras — só aparência e nomes.

### Enemy
O oponente que o Hero luta numa Zone. Inimigos normais são **cosméticos**: dentro de
uma mesma Zone todos têm os mesmos stats (vindos da escala da Zone); só o nome muda,
sorteado do pool da Region.

### Boss
Inimigo especial numa **Boss Zone** (toda Zone múltipla de 10: 10, 20, 30 …). Em vez
dos 10 abates normais, aparece **um único Boss** com Health muito maior (~×8 o de um
Enemy normal da mesma Zone). Derrotá-lo **limpa a Zone de uma vez** e concede um drop
**garantido de Rarity rare ou melhor**. Dá um pico de tensão (barra de vida épica) e
celebração ao fim de uma Region.

### Wall (parede)
A Zone onde os inimigos ficam fortes o bastante para matar o Hero antes de ele
vencer. Bater na Wall **não pune** (não perde ouro/itens); apenas impede avançar.
A resposta do jogador é farmar Zones seguras para ficar mais forte.

### Clear (limpar uma Zone)
Conseguir os abates necessários numa Zone para que ela passe a contar como segura e
liberar a tentativa da próxima.

### Item
Equipamento que o Hero pode vestir. Tem um **Slot**, uma **Rarity** e um **Item
Power**. Cai dos Enemies (loot).

### Slot
Categoria de equipamento. São três, e cada um concede um Stat:
- **Weapon → Damage** (confiável).
- **Armor → Health** (confiável).
- **Amulet → Attack Speed _ou_ Gold Find** (sorteado quando o Item é gerado; é o slot
  "surpresa"). A etiqueta do Item mostra qual stat ele dá.

### Rarity
Faixa de qualidade do Item: **common, uncommon, rare, epic, legendary**. Todas as
rarities podem cair desde a Zone 1 (loteria); rarities mais altas têm multiplicador de
Item Power maior e são mais raras.

### Item Power
O número que define a força de um Item. Escala com a **Zone** onde caiu e com o
multiplicador da **Rarity**. Consequência: uma common de Zone funda supera uma
legendary de Zone rasa — isso mantém o "re-loot" conforme se avança.

### Ascension (ascensão)
Reiniciar a jornada (zera tudo, exceto Essence) em troca de **Essence**, um
multiplicador permanente. **Desbloqueia ao limpar a Zone 25** pela primeira vez; antes
disso o botão fica travado ("Reach Zone 25 to unlock Ascension"). A primeira ascensão
é, por design, "merecida" (~30-40 min de jogo).

### Essence
Moeda permanente ganha ao ascender; concede multiplicador a Damage e ouro.
