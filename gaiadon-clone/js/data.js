// ===== Dados estáticos do jogo =====

// Zonas: nome + lista de inimigos. A dificuldade escala com o índice da zona.
const ZONES = [
  { name: "Planície de Aurin", enemies: ["Slime", "Rato Gigante", "Goblin"] },
  { name: "Floresta Sussurrante", enemies: ["Lobo Sombrio", "Aranha", "Treant"] },
  { name: "Cavernas de Gelo", enemies: ["Yeti", "Golem de Gelo", "Morcego"] },
  { name: "Deserto de Cinzas", enemies: ["Escorpião", "Múmia", "Djinn"] },
  { name: "Pico de Gaiadon", enemies: ["Dragão Jovem", "Quimera", "Titã"] },
];

// Slots de equipamento.
const SLOTS = ["Arma", "Armadura", "Amuleto"];

// Raridades: nome, peso de drop, multiplicador de stats.
const RARITIES = [
  { name: "comum",    weight: 60, mult: 1.0 },
  { name: "incomum",  weight: 25, mult: 1.5 },
  { name: "raro",     weight: 10, mult: 2.2 },
  { name: "épico",    weight: 4,  mult: 3.5 },
  { name: "lendário", weight: 1,  mult: 6.0 },
];

const ITEM_NAMES = {
  "Arma":     ["Espada", "Machado", "Cajado", "Adaga", "Lança"],
  "Armadura": ["Peitoral", "Cota de Malha", "Túnica", "Couraça"],
  "Amuleto":  ["Pingente", "Anel", "Talismã", "Medalhão"],
};

// Upgrades da loja: id, nome, custo base, fator de crescimento, valor por nível.
const SHOP_UPGRADES = [
  { id: "dmg",  name: "Força (+dano)",            baseCost: 10, growth: 1.15, value: 2 },
  { id: "hp",   name: "Vitalidade (+vida)",       baseCost: 15, growth: 1.15, value: 10 },
  { id: "spd",  name: "Agilidade (+vel. ataque)", baseCost: 25, growth: 1.20, value: 0.05 },
  { id: "gold", name: "Ganância (+ouro)",         baseCost: 40, growth: 1.18, value: 0.10 },
];

if (typeof module !== "undefined") {
  module.exports = { ZONES, SLOTS, RARITIES, ITEM_NAMES, SHOP_UPGRADES };
}
