// Componente reutilizável: LINHA DE RECOMPENSA emoldurada (ícone real + nome +
// origem + valor). Genérico e sem dependência do offline — pensado para reuso
// em drops de boss, recompensas de Ascension, qualquer tela de ganhos.
//
// API:
//   rewardRow({ icon, glyph, name, source, value, variant }) -> HTMLElement
//   rewardList(items, { className }) -> HTMLElement (container com N linhas)
//
// Campos da linha:
//   icon    — URL da imagem (caminho Vite direto, ex.: 'eclats/.../lumens.png')
//   glyph   — fallback textual quando não há icon (ex.: 'V'); default = inicial do nome
//   name    — título da recompensa (ex.: 'Lumens')
//   source  — origem/legenda (ex.: 'From The Dreaming Wood · Sub-area III')
//   value   — valor formatado (ex.: '+3.2B'); o chamador formata
//   variant — acento de cor: 'gold' | 'ember' | 'eclat' | 'vest' (default: 'eclat')

import './reward-row.css';

const ACCENTS = new Set(['gold', 'ember', 'eclat', 'vest']);

export function rewardRow(data = {}) {
  const { icon, glyph, name = '', source, value, variant } = data;
  const row = document.createElement('div');
  row.className = 'rw-row' + (variant && ACCENTS.has(variant) ? ` ${variant}` : '');

  const iconHTML = icon
    ? `<img src="${icon}" alt="">`
    : `<span class="rw-glyph">${glyph || (name ? name[0] : '◆')}</span>`;

  row.innerHTML = `
    <div class="rw-ic">${iconHTML}</div>
    <div class="rw-meta">
      <div class="rw-nm">${name}</div>
      ${source != null ? `<div class="rw-sub">${source}</div>` : ''}
    </div>
    ${value != null ? `<div class="rw-val">${value}</div>` : ''}
  `;
  return row;
}

export function rewardList(items = [], opts = {}) {
  const list = document.createElement('div');
  list.className = 'rw-list' + (opts.className ? ` ${opts.className}` : '');
  for (const it of items) list.appendChild(rewardRow(it));
  return list;
}
