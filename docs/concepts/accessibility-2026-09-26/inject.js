// Page-side helpers, injected into the LIVE build to fake the proposed rows.
// Everything drawn here uses the live pause's own markup and classes, so the
// rows are styled by the shipped stylesheet, not by this mockup.
window.__a11y = {
  row(id, label, value, ratio = null, opts = {}) {
    const d = document.createElement('div');
    d.className = 'pause__row' + (ratio === null ? ' pause__row--word' : '') + (opts.cmd ? ' pause__row--cmd' : '') + (opts.sel ? ' pause__row--sel' : '');
    d.dataset.row = id;
    d.innerHTML = `<span class="pause__k">${label}</span><span class="pause__bar">${ratio === null ? '' : `<i style="width:${(ratio * 100).toFixed(1)}%"></i>`}</span><span class="pause__v">${value}</span>`;
    if (opts.newRow) d.style.setProperty('--a11y-new', '1');
    return d;
  },
  rule() {
    const d = document.createElement('div');
    d.className = 'pause__row pause__row--rule';
    d.innerHTML = '<span></span>';
    return d;
  },
  head(text) {
    const h = document.createElement('h3');
    h.textContent = text;
    h.style.marginTop = '0.9em';
    return h;
  },
  clearSel() { document.querySelectorAll('.pause__row--sel').forEach((r) => r.classList.remove('pause__row--sel')); },

  /** The build widens the phone key column (today's live phone OPTIONS already clips MASTER VOLUM…). */
  phoneFit() {
    const st = document.createElement('style');
    st.textContent = '@media (max-width:620px){.pause__col--wide .pause__k{width:140px!important}.pause{--pu-bar:84px!important}}';
    document.head.append(st);
  },

  /** Option A: three rows + a CONTROLS pointer in the live SETTINGS column. */
  optionA() {
    const col = document.querySelector('.pause__col[data-col="settings"]');
    const after = col.querySelector('[data-row="textSpeed"]');
    this.clearSel();
    const rows = [
      this.row('textSize', 'TEXT SIZE', '100%', 0, { sel: true }),
      this.row('reduceMotion', 'REDUCE MOTION', 'OFF'),
      this.row('reduceFlashes', 'REDUCE FLASHES', 'OFF'),
    ];
    let at = after;
    for (const r of rows) { at.after(r); at = r; }
    const help = col.querySelector('[data-row="battleHelp"]') || col.lastElementChild;
    // A touch-only phone has no keys to remap: the row is shown once a keyboard or pad is used.
    if (innerWidth > 620) help.after(this.row('remap', 'REMAP CONTROLS', '▸', null, { cmd: true }));
  },

  /** Option A, second frame: the existing CONTROLS tab, rebinding one row. */
  controlsRebind() {
    // Only the first column is redrawn; THIS SCREEN is the live column, untouched.
    const c1 = document.querySelector('.pause__col[data-col="move"]');
    c1.innerHTML = '<h3>Keys  ·  Enter to change</h3>';
    const keys = [
      ['confirm', 'Confirm', 'Enter  /  Space  /  Z'],
      ['cancel', 'Back', 'PRESS A KEY …', true],
      ['move', 'Move', 'Arrows  /  WASD'],
      ['triangle', 'Triangle', 'Shift  /  Tab  /  Q'],
      ['start', 'Start', 'E  /  C'],
      ['l1', 'L1', 'F  /  PgUp'],
      ['r1', 'R1', 'R  /  PgDn'],
    ];
    this.clearSel();
    for (const [id, k, v, sel] of keys) {
      const r = this.row(id, k, v, null, { sel });
      if (sel) r.querySelector('.pause__v').style.color = 'var(--pu-accent)';
      c1.append(r);
    }
    c1.append(this.rule(), this.row('reset', 'Reset to defaults', '▸', null, { cmd: true }));
    // Today four CONTROLS labels clip at 1600x900 ("RESUME THE FIG…"); A rebuilds this
    // tab anyway, so its labels take the width they need, as OPTIONS' command rows do.
    document.querySelectorAll('.pause__col[data-col="screen"] .pause__row').forEach((r) => r.classList.add('pause__row--cmd'));
  },

  /** Option B: a new ACCESSIBILITY tab after OPTIONS. */
  optionB() {
    const opt = document.querySelector('.pause__tab[data-tab="options"]');
    opt.classList.remove('pause__tab--on');
    const tab = opt.cloneNode(false);
    tab.textContent = 'Accessibility';
    tab.dataset.tab = 'access';
    tab.classList.add('pause__tab--on');
    opt.after(tab);
    tab.scrollIntoView({ inline: 'center', block: 'nearest' });
    const body = document.querySelector('.pause__body');
    body.dataset.tab = 'access';
    body.innerHTML = '';
    const c1 = document.createElement('div');
    c1.className = 'pause__col pause__col--wide';
    c1.dataset.col = 'settings';
    c1.innerHTML = '<h3>Reading and comfort</h3>';
    c1.append(
      this.row('textSize', 'TEXT SIZE', '100%', 0, { sel: true }),
      this.row('reduceMotion', 'REDUCE MOTION', 'OFF'),
      this.row('reduceFlashes', 'REDUCE FLASHES', 'OFF'),
    );
    const c2 = document.createElement('div');
    c2.className = 'pause__col pause__col--wide';
    c2.dataset.col = 'encounter';
    c2.innerHTML = '<h3>Controls</h3>';
    c2.append(
      this.row('confirm', 'Confirm', 'Enter  /  Z'),
      this.row('cancel', 'Back', 'Esc  /  X'),
      ...(innerWidth > 620 ? [this.row('triangle', 'Triangle', 'Shift  /  Q')] : []),
      this.rule(),
      this.row('remapAll', 'Remap every key', '▸', null, { cmd: true }),
      this.row('reset', 'Reset to defaults', '▸', null, { cmd: true }),
    );
    body.append(c1, c2);
  },


  /** Scale every text-bearing element under `root` by k (TEXT SIZE simulation). */
  scaleText(root, k) {
    const els = [...root.querySelectorAll('*')].filter((e) =>
      !e.closest('.pause') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
    const px = els.map((e) => parseFloat(getComputedStyle(e).fontSize));
    els.forEach((e, i) => { e.dataset.a11yFs = e.style.fontSize || ''; e.style.fontSize = (px[i] * k).toFixed(2) + 'px'; });
    return els.length;
  },
  /**
   * TEXT SIZE as it would be built: every HUD panel grows as a unit (type and
   * the box around it) from the corner it is anchored to, so nothing inside a
   * panel re-wraps or clips. Panels = the children of the 640x360 HUD stage
   * and of the coach layer.
   */
  /**
   * The desktop FFX HUD at 130 %, laid out the way it would be built:
   * the command stack shows four rows and scrolls (its own more-arrow already
   * exists), the turn queue shows five, the enemy card steps up and in so it
   * clears the queue and the party list, and the advisor steps right by
   * however much the guide grew.
   */
  hud130Desk(k = 1.3) {
    const cmds = [...document.querySelectorAll('.ig-cmd-stack > .ig-cmd')];
    cmds[0].style.display = 'none';
    cmds[cmds.length - 1].style.display = 'none';
    const up = document.querySelector('.ffx-cmd-more');
    if (up) {
      const a = up.cloneNode(true);
      a.classList.remove('ffx-cmd-more--down');
      a.style.top = '-14px';
      a.style.bottom = 'auto';
      a.style.transform = (getComputedStyle(up).transform.replace('none', '') + ' rotate(180deg)').trim();
      up.parentElement.append(a);
    }
    const ctb = [...document.querySelectorAll('.ig-ctb__row')];
    if (ctb.length > 5) ctb[ctb.length - 1].style.display = 'none';
    // The advisor re-fits itself around the guide every frame; hold it where it
    // stood at 100 % (a built version would budget the space instead).
    const hold = [...document.querySelectorAll('.mad > *')].map((e, i) => {
      const s = e.style;
      const d = getComputedStyle(e).display;
      return `.mad > :nth-child(${i + 1}){${['left', 'width', 'bottom', 'max-height'].filter((p) => s.getPropertyValue(p)).map((p) => `${p}:${s.getPropertyValue(p)}!important`).join(';')};display:${d}!important;top:auto!important}`;
    }).join('\n');
    const st = document.createElement('style');
    st.textContent = hold;
    document.head.append(st);
    const guide = [...document.querySelectorAll('.sgd > *')].find((e) => e.getBoundingClientRect().width > 50);
    const gw = guide ? guide.getBoundingClientRect().width : 0;
    return this.scalePanels(k,
      '.ffxhud__stage > .ig-ctb, .ffxhud__stage > .ffx-cmd-area, .ffxhud__stage > .ig-cutin__info, .ffxhud__stage > .ig-stat-list, .ffxhud__stage > .ffx-sensor, .ffxhud__stage > .ffx-telegraph, .sgd > *, .mad > *',
      { '.ffx-sensor': [-85, -140], '.mad > *': [gw * (k - 1) + 8, 0] });
  },

  scalePanels(k, sel = '.ffxhud__stage > *, .ffx2hud__stage > *, .coach-layer > *', offsets = {}) {
    const W = innerWidth, H = innerHeight;
    const stage = document.querySelector('.ffxhud__stage, .ffx2hud__stage');
    const m = stage && getComputedStyle(stage).transform;
    const stageScale = m && m !== 'none' ? parseFloat(m.slice(7)) : 1;
    const els = [...document.querySelectorAll(sel)].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.width < W * 0.9;
    });
    for (const e of els) {
      const r = e.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const ox = cx < W / 2 ? 'left' : 'right';
      const oy = cy < H / 2 ? 'top' : 'bottom';
      // transform-origin is in the element's own (pre-transform) box
      const base = getComputedStyle(e).transform;
      e.dataset.a11yTf = e.style.transform || '';
      let off = [0, 0];
      for (const [s, v] of Object.entries(offsets)) if (e.matches(s)) off = v;
      const inStage = stage && stage.contains(e) ? stageScale : 1;
      const tr = off[0] || off[1] ? `translate(${off[0] / inStage}px, ${off[1] / inStage}px) ` : '';
      e.style.transformOrigin = `${ox} ${oy}`;
      e.style.transform = tr + (base && base !== 'none' ? base + ' ' : '') + `scale(${k})`;
    }
    return els.map((e) => e.className).join(' | ');
  },
  unscaleText(root) {
    root.querySelectorAll('[data-a11y-fs]').forEach((e) => { e.style.fontSize = e.dataset.a11yFs; delete e.dataset.a11yFs; });
  },

  /** Option C: the first-launch comfort prompt, over the real title frame. */
  prompt(phone) {
    const css = `
    .a11y-veil{position:fixed;inset:0;z-index:99990;background:rgba(11,10,18,.46);}
    .a11y-card{position:fixed;z-index:99991;background:#F4F1E8;color:#0B0A12;box-shadow:0 8px 20px rgba(0,0,0,.45);
      border-left:6px solid #E3B94A;font-family:'Exo 2',sans-serif;}
    .a11y-card .eb{font:700 14px/1 'Chakra Petch',sans-serif;letter-spacing:.3em;color:#B8862A;text-transform:uppercase;}
    .a11y-card h2{font:700 italic 46px/1.02 'Cormorant Garamond',var(--font-serif),serif;margin:.22em 0 .12em;}
    .a11y-card .sub{font-size:17px;line-height:1.4;color:#3a3544;margin:0 0 18px;}
    .a11y-card .r{display:grid;grid-template-columns:172px 1fr;align-items:center;gap:14px;padding:11px 0;border-top:1px solid rgba(11,10,18,.14);}
    .a11y-card .k{font:700 15px/1.2 'Chakra Petch',sans-serif;letter-spacing:.16em;text-transform:uppercase;}
    .a11y-card .k small{display:block;font:400 14px/1.3 'Exo 2',sans-serif;letter-spacing:0;text-transform:none;color:#5a5466;margin-top:3px;}
    .a11y-card .chips{display:flex;gap:8px;flex-wrap:wrap;}
    .a11y-card .c{min-width:74px;padding:7px 12px 6px;border:2px solid #0B0A12;font:700 14px/1 'Rajdhani',sans-serif;letter-spacing:.06em;display:flex;align-items:baseline;gap:6px;justify-content:center;}
    .a11y-card .c b{font-family:'Cormorant Garamond',serif;font-style:italic;}
    .a11y-card .c.on{background:#0B0A12;color:#E3B94A;}
    .a11y-card .foot{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:18px;}
    .a11y-card .go{background:#0B0A12;color:#E3B94A;font:700 16px/1 'Chakra Petch',sans-serif;letter-spacing:.24em;padding:14px 26px 13px;text-transform:uppercase;white-space:nowrap;}
    .a11y-card .later{font:600 14px/1.35 'Exo 2',sans-serif;color:#5a5466;}
    .a11y-card .later b{font-family:'Chakra Petch';letter-spacing:.12em;color:#0B0A12;}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
    const veil = document.createElement('div');
    veil.className = 'a11y-veil';
    const card = document.createElement('div');
    card.className = 'a11y-card';
    Object.assign(card.style, phone
      ? { left: '12px', right: '12px', bottom: '16px', padding: '22px 18px 20px' }
      : { left: '50%', top: '50%', width: '640px', transform: 'translate(-50%,-50%)', padding: '30px 36px 28px' });
    const size = (n, on, px) => `<span class="c${on ? ' on' : ''}"><b style="font-size:${px}px">Aa</b>${n}%</span>`;
    card.innerHTML = `
      <div class="eb">Before the first fight</div>
      <h2>Make it comfortable</h2>
      <p class="sub">Three choices, all off unless you turn them on. You can change them any time in Pause › Options.</p>
      <div class="r"><div class="k">Text size<small>Battle, dialogue, menus</small></div>
        <div class="chips">${size(100, true, 18)}${size(115, false, 21)}${size(130, false, 24)}</div></div>
      <div class="r"><div class="k">Reduce motion<small>Still camera, no shake or parallax</small></div>
        <div class="chips"><span class="c on">OFF</span><span class="c">ON</span></div></div>
      <div class="r"><div class="k">Reduce flashes<small>Softer white-outs and hit flashes</small></div>
        <div class="chips"><span class="c on">OFF</span><span class="c">ON</span></div></div>
      <div class="foot"><span class="later"><b>ESC</b> skip · asked once</span><span class="go">▸ Begin</span></div>`;
    if (phone) {
      card.querySelectorAll('.r').forEach((r) => { r.style.gridTemplateColumns = '1fr'; r.style.gap = '8px'; });
      card.querySelector('h2').style.fontSize = '38px';
    }
    document.body.append(veil, card);
  },
};
