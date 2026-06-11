/* ============================================================
   Éclats of Lumière — Shell (CP-1)
   Stage fit() · top bar de moedas · bottom nav · troca de views.
   Telas ainda vazias (placeholders) — preenchidas nos CP-2..CP-7.
   ============================================================ */
(function () {
  const A = window.EclatsAssets;
  if (!A) { console.error('[shell] EclatsAssets não carregou (assets/manifest.js)'); return; }

  // — moedas do topo (cânon: Lumens / Vestiges / Éclats) —
  // TODO(canon): ícone de Éclats usa provisoriamente o de Convergence.
  const COINS = [
    { id: 'lumens',   icon: 'icons.currency.lumens',      name: 'Lumens',   value: '0' },
    { id: 'vestiges', icon: 'icons.currency.vestiges',    name: 'Vestiges', value: '0' },
    { id: 'eclats',   icon: 'icons.currency.convergence', name: 'Éclats',   value: '0' },
  ];

  // — telas. icon = id de nav (confirmado) · glyph = placeholder provisório —
  // Mapeamento ícone→tela confirmado pelo Willian; Map/Gear/Train = provisório.
  const VIEWS = [
    { id: 'combat',      label: 'Combate',     icon: 'icons.nav.2', cp: 'CP-2', backdrop: 'backgrounds.map1',
      lore: 'Os Éclats carregam algo mais.' },
    { id: 'map',         label: 'Mapa',        icon: 'icons.nav.5', cp: 'CP-3', backdrop: 'backgrounds.map4', provisionalIcon: true,
      lore: 'Cinco mapas, cinco verdades.' },
    { id: 'player',      label: 'Seeker',      icon: 'icons.nav.1', cp: 'CP-4', backdrop: 'backgrounds.map1',
      lore: 'Sem escolhido, sem profecia — apenas o que ele carrega.' },
    { id: 'gear',        label: 'Gear',        glyph: '🛡', cp: 'CP-5', backdrop: 'backgrounds.map3', provisional: true,
      lore: 'Seis sobras da primeira civilização, que despertam em sua mão.' },
    { id: 'passives',    label: 'Passivas',    icon: 'icons.nav.3', cp: 'CP-6', backdrop: 'backgrounds.map1',
      lore: 'A essência dos corrompidos alimenta as três árvores.' },
    { id: 'memoires',    label: 'Mémoires',    icon: 'icons.nav.6', cp: 'CP-7', backdrop: 'backgrounds.map5',
      lore: 'Tikkun Olam — a narrativa como meta-progressão.' },
    { id: 'convergence', label: 'Convergence', icon: 'icons.nav.4', cp: '—',    backdrop: 'backgrounds.map5',
      lore: 'Ele se quebra, para que o mundo continue.' },
    { id: 'ascension',   label: 'Ascension',   icon: 'icons.nav.7', cp: '—',    backdrop: 'backgrounds.map5',
      lore: 'Seeker → Illuminate → Éclairé → L’Éveillé → Lumière.' },
    { id: 'train',       label: 'Train',       glyph: '✦', cp: '—', backdrop: 'backgrounds.map1', provisional: true,
      lore: 'Forje-se entre as eras.' },
  ];

  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // ---- monta o topo (moedas) ----
  function buildCoins() {
    const wrap = $('.coins');
    wrap.innerHTML = COINS.map(c =>
      `<div class="coin ${c.id}">
         ${A.picture(c.icon, { alt: c.name })}
         <span class="meta"><span class="v" id="coin-${c.id}">${c.value}</span></span>
       </div>`).join('');
  }

  // ---- monta as telas vazias + a bottom nav ----
  function buildViews() {
    const main = $('.stage-main');
    const nav = $('.bottomnav');
    main.innerHTML = '';
    nav.innerHTML = '';

    VIEWS.forEach((v, i) => {
      // view placeholder
      const view = el('div', 'view', '');
      view.id = 'view-' + v.id;
      const glyphHtml = v.glyph
        ? `<div class="glyph" style="font-size:96px;display:grid;place-items:center;opacity:.5">${v.glyph}</div>`
        : `<div class="glyph">${A.picture(v.icon, { alt: v.label })}</div>`;
      view.innerHTML =
        `<div class="view-empty">
           <div>
             ${glyphHtml}
             <h2>${v.label}</h2>
             <div class="cp">${v.cp === '—' ? 'tela' : v.cp + ' · em construção'}</div>
             <div class="lore">${v.lore || ''}</div>
           </div>
         </div>`;
      main.appendChild(view);

      // botão de nav
      const btn = el('button', 'navbtn' + (v.provisional ? ' provisional' : ''));
      btn.dataset.view = v.id;
      const icoInner = v.glyph ? v.glyph : A.picture(v.icon, { alt: v.label });
      btn.innerHTML = `<span class="ico">${icoInner}</span><span class="lbl">${v.label}</span>`;
      btn.addEventListener('click', () => show(v.id));
      nav.appendChild(btn);
    });
  }

  // ---- troca de tela + swap do fundo desfocado ----
  let current = null;
  function show(id) {
    const v = VIEWS.find(x => x.id === id);
    if (!v) return;
    current = id;
    document.querySelectorAll('.view').forEach(n => n.classList.toggle('active', n.id === 'view-' + id));
    document.querySelectorAll('.navbtn').forEach(n => n.classList.toggle('active', n.dataset.view === id));
    const bd = $('#stage-backdrop');
    bd.style.backgroundImage = v.backdrop ? A.bg(v.backdrop) : 'none';
  }

  // ---- fit(): escala o stage de 1920×1080 ao viewport ----
  function fit() {
    const stage = $('#stage');
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = `scale(${s})`;
    $('#toosmall').style.display = s < 0.22 ? 'grid' : 'none';
  }

  // ---- boot ----
  function boot() {
    buildCoins();
    buildViews();
    show('combat');
    fit();
    window.addEventListener('resize', fit);
    // expõe p/ os próximos CPs
    window.EclatsShell = { show, fit, VIEWS, COINS };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
