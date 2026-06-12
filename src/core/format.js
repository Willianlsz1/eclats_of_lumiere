// Formatação central de números exibidos.
// Regra (CLAUDE.md): sufixos K/M/B/T, depois notação científica curta.

const SUFFIXES = [
  { value: 1e12, suffix: 'T' },
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'K' },
];

// Acima de 1e15 (esgotados os sufixos) cai na notação científica curta: "1.23e18".
const SCI_THRESHOLD = 1e15;

export function formatNumber(n) {
  if (!Number.isFinite(n)) return '∞';
  if (n < 0) return '-' + formatNumber(-n);
  if (n < 1000) {
    // valores pequenos: inteiro, ou 1 casa se tiver fração relevante
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }
  if (n >= SCI_THRESHOLD) {
    const exp = Math.floor(Math.log10(n));
    const mant = n / 10 ** exp;
    return `${mant.toFixed(2)}e${exp}`;
  }
  for (const { value, suffix } of SUFFIXES) {
    if (n >= value) {
      const v = n / value;
      // 48.2K, 1.85M — máximo 3 algarismos significativos antes do sufixo
      const decimals = v >= 100 ? 0 : v >= 10 ? 1 : 2;
      return v.toFixed(decimals) + suffix;
    }
  }
  return String(Math.round(n));
}
