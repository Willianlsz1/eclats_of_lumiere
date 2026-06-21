// =============================================================
// util.js — ferramentas básicas (RNG, formatação, namespace global)
// =============================================================
// Tudo do jogo vive dentro de um único objeto global "G" para nunca
// haver "colisão de nomes" entre arquivos. Cada sistema pendura suas
// funções aqui: G.data, G.state, G.loot, G.combat, G.ui, etc.
window.G = window.G || {};

G.util = {
  // número inteiro aleatório entre min e max (inclusivos)
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // float aleatório entre min e max
  randFloat(min, max) {
    return Math.random() * (max - min) + min;
  },

  // chance de 0 a 1 (ex: 0.25 = 25%)
  chance(p) {
    return Math.random() < p;
  },

  // escolhe um item aleatório de um array
  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // escolhe por peso: [{item, weight}] -> item
  weightedPick(entries) {
    const total = entries.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * total;
    for (const e of entries) {
      roll -= e.weight;
      if (roll <= 0) return e.item;
    }
    return entries[entries.length - 1].item;
  },

  // formata número grande de forma legível: 1234 -> "1.23K"
  fmt(n) {
    if (n < 0) return "-" + this.fmt(-n);
    n = Math.floor(n);
    if (n < 1000) return String(n);
    const units = ["", "K", "M", "B", "T", "Qa", "Qi"];
    const tier = Math.floor(Math.log10(n) / 3);
    const scaled = n / Math.pow(1000, tier);
    return scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0) + units[tier];
  },

  clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  },
};
