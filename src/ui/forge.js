// Tela The Forge — "crafting station" do ferreiro Maël (mockup v3 aprovado).
// Layout: Maël + materiais (esq) · abas Forge/Reliquats + receitas (centro) ·
// detalhe da receita com checklist de requisitos (dir).
//
// ⚠️ ESCOPO: apenas a tela e sua navegação. NENHUMA lógica de craft/economia
// está implementada — todos os números de receita/requisito são PLACEHOLDERS
// fiéis ao mockup, marcados com TODO. Só as contagens de material à esquerda
// leem o state real (display puro, sem consumir nada).
//
// Contrato (igual às outras telas): buildForgeView(root, state) monta o DOM
// uma vez; renderForge(state) atualiza por tick.

import { formatNumber } from '../core/format.js';

// Arte do ferreiro + materiais. PNG-only, fora do manifesto auto-gerado
// (src/data/assets.js), então referenciados pelo caminho que o Vite serve a
// partir de public/. TODO(assets): mover p/ o pipeline e gerar .webp.
const ART = {
  smith: 'eclats/forge/blacksmith.png',
  mat: [
    'eclats/forge/t1_kindled.png',
    'eclats/forge/t2_luminous.png',
    'eclats/forge/t3_radiant.png',
    'eclats/forge/t4_converged.png',
  ],
};

// Materiais do jogador (state.materiais = [T1..T4]). Só display.
const MATS = [
  { key: 'kindled',   label: 'Kindled',   img: ART.mat[0] },
  { key: 'luminous',  label: 'Luminous',  img: ART.mat[1] },
  { key: 'radiant',   label: 'Radiant',   img: ART.mat[2] },
  { key: 'converged', label: 'Converged', img: ART.mat[3] },
];

// Receitas — dados PLACEHOLDER do mockup (status/níveis são ilustrativos).
// TODO(lógica): derivar `status`, `reqs` e disponibilidade do state real.
// rar: classe de raridade (k/l/r/c/f). icon: {img} ou {glyph}.
const RECIPES = [
  // ---- Refining ----
  { id: 'refine_luminous',  group: 'Refining', rar: 'l', icon: { img: ART.mat[1] },
    name: 'Refine Luminous',  sub: '12 Kindled → 1 Luminous',  status: { cls: 'ok', text: 'Ready' } },
  { id: 'refine_radiant',   group: 'Refining', rar: 'r', icon: { img: ART.mat[2] },
    name: 'Refine Radiant',   sub: '12 Luminous → 1 Radiant',  status: { cls: 'ok', text: 'Ready' } },
  { id: 'refine_converged', group: 'Refining', rar: 'c', icon: { img: ART.mat[3] },
    name: 'Refine Converged', sub: '12 Radiant → 1 Converged', status: { cls: 'no', text: 'Missing' } },

  // ---- Raise rarity ----
  { id: 'veil',  group: 'Raise rarity', rar: 'k', icon: { glyph: 'V' },
    name: 'Veil of Cinders',        sub: 'Kindled → Luminous',          status: { cls: 'ok', text: 'Ready' },
    // único detalhe totalmente especificado pelo mockup aprovado
    detail: {
      ph: 'V', frame: 'k', fromLabel: 'Kindled', toLabel: 'Luminous',
      gain: 'Unlocks the next <b>100 levels</b> and a <b>new affix slot</b>.<br>Level and affixes are kept. Rarity never goes back.',
      reqs: [
        { icon: { glyph: 'V' }, name: 'Veil of Cinders at level cap', sub: 'Level 200 / 200', pct: 100, ok: true },
        { icon: { img: ART.mat[0] }, name: 'Kindled materials', sub: 'Need 40 · You hold 241', pct: 100, ok: true },
      ],
      action: 'Forge to Luminous',
      note: 'Consumes 40 Kindled. What is forged, stays forged.',
      flavor: '"The veil was woven from what remained of a fire. Feed it, and it remembers being flame."',
    } },
  { id: 'grasp', group: 'Raise rarity', rar: 'f', icon: { glyph: 'G' },
    name: 'Grasp of the Unnamed',   sub: 'Faded → Kindled',             status: { cls: 'ok', text: 'Ready' } },
  { id: 'edge',  group: 'Raise rarity', rar: 'l', icon: { glyph: 'E' },
    name: 'The Waning Edge',        sub: 'Luminous → Radiant',          status: { cls: 'no', text: 'Level 214 / 300' } },
  { id: 'vigil', group: 'Raise rarity', rar: 'k', icon: { glyph: 'S' },
    name: 'The Silent Vigil',       sub: 'Kindled → Luminous',          status: { cls: 'no', text: 'Level 168 / 200' } },
  { id: 'reson', group: 'Raise rarity', rar: 'r', icon: { glyph: 'R' },
    name: 'The Last Resonance',     sub: 'Radiant → Converged',         status: { cls: 'no', text: 'Need 40 Radiant' } },
  { id: 'band',  group: 'Raise rarity', rar: 'c', icon: { glyph: 'B' },
    name: 'Band of Dusk',           sub: 'Converged · highest rarity',  status: { cls: 'no', text: 'Max' } },
];

const $ = (id) => document.getElementById(id);
const iconHTML = (icon) => icon.img ? `<img src="${icon.img}" alt="">` : (icon.glyph || '');

let selectedId = 'veil'; // seleção inicial = a receita detalhada no mockup

export function buildForgeView(root, state) {
  root.classList.remove('placeholder');
  root.classList.add('forge');

  // Agrupa receitas preservando a ordem dos grupos.
  const groups = [];
  for (const r of RECIPES) {
    let g = groups.find((x) => x.name === r.group);
    if (!g) { g = { name: r.group, items: [] }; groups.push(g); }
    g.items.push(r);
  }

  const recipesHTML = groups.map((g) => `
    <div class="fg-rgroup">${g.name}</div>
    ${g.items.map((r) => `
      <button type="button" class="fg-recipe r-${r.rar}" data-id="${r.id}">
        <span class="fg-ic">${iconHTML(r.icon)}</span>
        <span class="fg-meta">
          <span class="fg-nm">${r.name}</span>
          <span class="fg-sub">${r.sub}</span>
        </span>
        <span class="fg-st ${r.status.cls}">${r.status.text}</span>
      </button>`).join('')}
  `).join('');

  const matsHTML = MATS.map((m) => `
    <div class="fg-chip ${m.key}" id="fg-chip-${m.key}">
      <div class="fg-th"><img src="${m.img}" alt=""></div>
      <div><b id="fg-mat-${m.key}">0</b><br><span>${m.label}</span></div>
    </div>`).join('');

  root.innerHTML = `
    <div class="fg-bg"></div>
    <div class="fg-screen">

      <!-- ESQUERDA: o Blacksmith + materiais -->
      <aside class="fg-smithcol">
        <div class="fg-smithcard">
          <img src="${ART.smith}" alt="Maël, Blacksmith of the Ordre">
          <div class="fg-veilgrad"></div>
          <div class="fg-who">
            <div class="fg-nmbig">Maël</div>
            <div class="fg-tt">Blacksmith of the Ordre</div>
            <div class="fg-quote">"Light remembers the shape it is given. Hold still, and I will remind it."</div>
          </div>
        </div>
        <div class="fg-mats">
          <h4>Your materials</h4>
          <div class="fg-matrow">${matsHTML}</div>
        </div>
      </aside>

      <!-- CENTRO: abas + lista de receitas -->
      <section class="fg-recipes">
        <div class="fg-tabs">
          <button type="button" class="on">Forge</button>
          <button type="button" class="locked" disabled title="Reserved — coming later">Reliquats</button>
        </div>
        <div class="fg-rlist" id="fg-rlist">${recipesHTML}</div>
      </section>

      <!-- DIREITA: detalhe da receita selecionada -->
      <section class="fg-detail" id="fg-detail"></section>

    </div>
  `;

  // Seleção de receita (UI pura — não dispara craft). TODO(lógica): forjar.
  $('fg-rlist').querySelectorAll('.fg-recipe').forEach((btn) =>
    btn.addEventListener('click', () => selectRecipe(btn.dataset.id)));

  selectRecipe(selectedId);
  renderForge(state);
}

// Reconstrói o painel de detalhe ao trocar de receita.
function selectRecipe(id) {
  selectedId = id;
  const r = RECIPES.find((x) => x.id === id) || RECIPES[0];

  document.querySelectorAll('.fg-recipe').forEach((el) =>
    el.classList.toggle('sel', el.dataset.id === id));

  const detail = $('fg-detail');
  if (!detail) return;
  detail.innerHTML = r.detail ? detailFull(r) : detailStub(r);
}

// Detalhe completo (mockup aprovado): hoje só "Veil of Cinders".
function detailFull(r) {
  const d = r.detail;
  const reqs = d.reqs.map((q) => `
    <div class="fg-req ${q.ok ? 'ok' : 'no'}">
      <div class="fg-ric">${iconHTML(q.icon)}</div>
      <div class="fg-rmeta">
        <div class="fg-rnm">${q.name}</div>
        <div class="fg-rsub">${q.sub}</div>
        <div class="fg-bar"><i style="width:${q.pct}%"></i></div>
      </div>
      <div class="fg-seal">${q.ok ? '✓' : '✕'}</div>
    </div>`).join('');

  return `
    <div class="fg-smithbg"><img src="${ART.smith}" alt=""></div>
    <div class="fg-dhead">
      <div class="fg-dimg r-${d.frame}"><span class="fg-ph">${d.ph}</span></div>
      <div class="fg-did">
        <h3>${r.name}</h3>
        <div class="fg-dpath">
          <span class="fg-from">${d.fromLabel}</span><span class="fg-fa">→</span><span class="fg-to">${d.toLabel}</span>
        </div>
        <div class="fg-dgain">${d.gain}</div>
      </div>
    </div>
    <div class="fg-reqs">${reqs}</div>
    <div class="fg-dactions">
      <div class="fg-qty"><div class="fg-q">1</div><button type="button">Max</button></div>
      <button type="button" class="fg-forgebtn">${d.action}</button>
    </div>
    <div class="fg-dnote">${d.note}</div>
    <p class="fg-dflavor">${d.flavor}</p>
  `;
  // TODO(lógica): qty/Max e o botão Forge não fazem nada ainda.
}

// Detalhe genérico p/ receitas sem cópia/canon aprovada no mockup. Mostra só o
// que a própria linha já traz (nome, caminho, status) + aviso de placeholder.
// TODO(canon): cópia de gain/flavor e TODO(lógica): requisitos reais.
function detailStub(r) {
  const [from, to] = r.sub.split('→').map((s) => s.trim());
  const path = to
    ? `<div class="fg-dpath"><span class="fg-from">${from}</span><span class="fg-fa">→</span><span class="fg-to">${to}</span></div>`
    : `<div class="fg-dpath"><span class="fg-from">${from}</span></div>`;
  return `
    <div class="fg-smithbg"><img src="${ART.smith}" alt=""></div>
    <div class="fg-dhead">
      <div class="fg-dimg r-${r.rar}"><span class="fg-ph">${r.icon.glyph || '◆'}</span></div>
      <div class="fg-did">
        <h3>${r.name}</h3>
        ${path}
        <div class="fg-dgain"><span class="fg-st ${r.status.cls}">${r.status.text}</span></div>
      </div>
    </div>
    <div class="fg-reqs">
      <div class="fg-req no">
        <div class="fg-ric">?</div>
        <div class="fg-rmeta">
          <div class="fg-rnm">Recipe requirements</div>
          <div class="fg-rsub">TODO — pending game logic &amp; canon copy.</div>
        </div>
      </div>
    </div>
    <div class="fg-dactions">
      <div class="fg-qty"><div class="fg-q">1</div><button type="button">Max</button></div>
      <button type="button" class="fg-forgebtn" disabled>Forge</button>
    </div>
    <p class="fg-dflavor">« Detalhe da receita aguarda lógica de craft e cânon. »</p>
  `;
}

export function renderForge(state) {
  // Único laço "vivo": contagens de material lendo o state real (só display).
  const m = state.materiais || [0, 0, 0, 0];
  MATS.forEach((mat, i) => {
    const el = $(`fg-mat-${mat.key}`);
    if (el) el.textContent = formatNumber(Math.floor(m[i] || 0));
    const chip = $(`fg-chip-${mat.key}`);
    if (chip) chip.classList.toggle('empty', !(m[i] > 0));
  });
}
