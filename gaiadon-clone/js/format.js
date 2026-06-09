'use strict';

function formatNum(n) {
  if (!isFinite(n) || isNaN(n)) return '???';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs < 1e3)  return sign + abs.toFixed(abs < 10 ? 1 : 0);
  if (abs < 1e6)  return sign + (abs/1e3).toFixed(1)  + 'k';
  if (abs < 1e9)  return sign + (abs/1e6).toFixed(2)  + 'M';
  if (abs < 1e12) return sign + (abs/1e9).toFixed(2)  + 'B';
  if (abs < 1e15) return sign + (abs/1e12).toFixed(2) + 'T';
  // Scientific for very large numbers
  const exp = Math.floor(Math.log10(abs));
  const man = abs / Math.pow(10, exp);
  return sign + man.toFixed(2) + 'e' + exp;
}

function formatTime(seconds) {
  if (seconds < 60)   return seconds.toFixed(0) + 's';
  if (seconds < 3600) return (seconds/60).toFixed(1) + 'm';
  if (seconds < 86400)return (seconds/3600).toFixed(1) + 'h';
  return (seconds/86400).toFixed(1) + 'd';
}

function formatPct(frac) {
  return (frac * 100).toFixed(1) + '%';
}
