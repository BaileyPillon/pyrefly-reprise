// Page-side helpers for the eye-candy settings mockups (2026-10-02). NOT product code.
// Injected into the LIVE pause screen (a scratch build of main HEAD). Everything it draws uses the pause's own
// markup and classes, so the shipped stylesheet styles it; mock.css adds only what the three layouts need.
// Nothing here writes a setting or touches the engine: it rebuilds DOM and says so in the README.
(() => {
  const NS = (window.__ecm = {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const isPhone = () => innerWidth <= 620;

  // ------------------------------------------------------------------ the switches (D-316, trimmed; both games)
  // masters keep their shipped ids; the nine others are new. effective(part) = master AND part.
  const SW = {
    fxLight:     { label: 'CINEMA LIGHT',        master: true,  help: 'The golden hour in FFX, the pink hour in FFX-2: colour grade, glow and light shafts. The parts under it only work while it is ON.', game: 'Both games. Today’s row.' },
    fxDof:       { label: 'DEPTH OF FIELD',      parent: 'fxLight',     help: 'A soft focus band that melts the far and near edges, set for each chapter’s camera. Off: today’s even focus.', game: 'Both games. New.' },
    fxFog:       { label: 'FOG',                 parent: 'fxLight',     help: 'Thin haze between your party and the big enemies, so they look far away. Off: clear air.', game: 'Both games. New.' },
    fxEdges:     { label: 'SMOOTH EDGES',        parent: 'fxLight',     help: 'Cleaner outlines on every fighter: no jagged steps and no pale fringe around the paint.', game: 'Both games. New.' },
    fxLiving:    { label: 'LIVING PAINTINGS',    master: true,  help: 'Scenery that moves, and the living portraits on this pause screen. The parts under it only work while it is ON.', game: 'Both games. Today’s row.' },
    fxBreath:    { label: 'BREATHING',           parent: 'fxLiving',    help: 'Fighters breathe at rest: shoulders rise and fall and nothing else moves. REDUCE MOTION holds them still.', game: 'Both games. New.', rm: 'STILL' },
    fxKo:        { label: 'KO COLLAPSE',         parent: 'fxLiving',    help: 'A knocked-out fighter buckles and sinks before the KO painting shows. REDUCE MOTION makes it a cut.', game: 'Both games. New.', rm: 'CUT' },
    fxSpectacle: { label: 'BATTLE SPECTACLE',    master: true,  help: 'Impact frames, spell light and the splash cut-ins. The parts under it only work while it is ON.', game: 'Both games. Today’s row.' },
    fxFraming:   { label: 'CHAPTER FRAMING',     parent: 'fxSpectacle', help: 'A camera placed for each chapter: low and wide for the giants, clear of the menus. Off: today’s calm camera.', game: 'Both games. New.' },
    fxHero:      { label: 'OVERDRIVE SHOT', parent: 'fxSpectacle', help: 'While you enter an Overdrive, the camera holds a close shot of the fighter, then cuts back. REDUCE MOTION keeps one cut.', game: 'FFX only. New.', rm: 'CUT', only: 'ffx' },
    fxSphere:    { label: 'DRESSPHERE SHOT',   parent: 'fxSpectacle', help: 'A held close shot and painted keys on a dressphere change: full the first time, instant after. REDUCE MOTION keeps one cut.', game: 'FFX-2 only. New.', rm: 'CUT', only: 'ffx2' },
    fxSplash:    { label: 'SPLASH ART',          parent: 'fxSpectacle', help: 'Painted art on the aeon and Special splash cut-ins. Off: today’s splash.', game: 'Both games. New.' },
  };
  const ORDER = ['fxLight', 'fxDof', 'fxFog', 'fxEdges', 'fxLiving', 'fxBreath', 'fxKo', 'fxSpectacle', 'fxFraming', 'fxHero', 'fxSphere', 'fxSplash'];
  NS.cfg = { game: 'ffx', on: {}, reduceMotion: false };
  NS.setup = (game, off = [], reduceMotion = false) => {
    NS.cfg = { game, on: Object.fromEntries(ORDER.map((id) => [id, !off.includes(id)])), reduceMotion };
  };
  const mine = () => ORDER.filter((id) => !SW[id].only || SW[id].only === NS.cfg.game);
  const eff = (id) => NS.cfg.on[id] && (!SW[id].parent || NS.cfg.on[SW[id].parent]);
  const kids = (m) => mine().filter((id) => SW[id].parent === m);
  const onCount = () => mine().filter(eff).length;
  const allState = () => (onCount() === mine().length ? 'ALL ON' : onCount() === 0 ? 'ALL OFF' : 'MIXED');
  NS.counts = () => ({ on: onCount(), of: mine().length });

  // ------------------------------------------------------------------ helpers on the live pause
  const root = () => $('.pause');
  const ui = () => $('[data-role="ui"]');
  const settingsCol = () => $('.pause__col[data-col="settings"]');
  const clearSel = () => $$('.pause__row--sel').forEach((r) => r.classList.remove('pause__row--sel'));

  /** A row in the shipped settings-column shape: label right-aligned in the key cell, the value after the bar slot. */
  const listRow = (id, k, v, o = {}) => {
    const d = document.createElement('div');
    d.className = 'pause__row pause__row--word' + (o.sel ? ' pause__row--sel' : '') + (o.head ? ' ec-head' : '') + (o.sub ? ' ec-sub' : '') + (o.dim ? ' ec-dimrow' : '');
    d.dataset.row = id;
    d.setAttribute('role', 'button');
    d.tabIndex = 0;
    d.innerHTML =
      `<span class="pause__k">${esc(k)}</span><span class="pause__bar">${o.glyph ? `<b class="ec-glyph">${o.glyph}</b>` : ''}</span>` +
      `<span class="pause__v">${esc(v)}${o.quiet ? `<em>${esc(o.quiet)}</em>` : ''}</span>`;
    return d;
  };
  /** Replace the three look rows (CINEMA LIGHT, LIVING PAINTINGS, BATTLE SPECTACLE) with `rows`. */
  const swapLooks = (rows) => {
    const col = settingsCol();
    // Take the shipped rows first: the new rows may reuse their ids (option B keeps the three ids as group headers).
    const old = ['fxLight', 'fxLiving', 'fxSpectacle'].map((id) => $(`[data-row="${id}"]`, col));
    for (const r of rows) old[0].before(r);
    for (const r of old) r?.remove();
    // The game scrolls the selected row into view; do the same, instantly.
    col.scrollTop = 0;
    $('.pause__row--sel', col)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    return col;
  };

  // ------------------------------------------------------------------ OPTION A: one row, one page
  NS.listA = ({ sel = true } = {}) => {
    clearSel();
    swapLooks([listRow('eyeCandy', 'EYE CANDY', allState() === 'MIXED' ? `${onCount()} OF ${mine().length}` : allState(), { sel, glyph: '▸' })]);
  };

  // ------------------------------------------------------------------ OPTION C: a preset row and CUSTOMIZE
  const PRESETS = ['FULL', 'BALANCED', 'CALM', 'OFF'];
  NS.preset = 'FULL';
  NS.listC = ({ preset = 'FULL', sel = 'preset' } = {}) => {
    NS.preset = preset;
    clearSel();
    swapLooks([
      listRow('fxPreset', 'EYE CANDY', preset, { sel: sel === 'preset' }),
      listRow('fxCustomize', 'CUSTOMIZE', '', { sel: sel === 'customize', glyph: '▸' }),
    ]);
  };

  // ------------------------------------------------------------------ OPTION B: the three looks fold open in place
  NS.listB = ({ open = [], sel = 'fxLight' } = {}) => {
    clearSel();
    root().classList.add('ec-fold');
    const rows = [];
    for (const m of ['fxLight', 'fxLiving', 'fxSpectacle']) {
      const ks = kids(m);
      const nOn = ks.filter((k) => NS.cfg.on[k]).length;
      const value = !NS.cfg.on[m] ? 'OFF' : nOn === ks.length ? 'ON' : `${nOn} OF ${ks.length}`;
      rows.push(listRow(m, SW[m].label, value, { head: true, glyph: open.includes(m) ? '▾' : '▸', sel: sel === m }));
      if (open.includes(m)) {
        for (const k of ks) rows.push(listRow(k, SW[k].label, NS.cfg.on[k] ? 'ON' : 'OFF', { sub: true, sel: sel === k, dim: !NS.cfg.on[m] }));
      }
    }
    swapLooks(rows);
  };

  // ------------------------------------------------------------------ the page (options A and C)
  const rmSuffix = (id) => (NS.cfg.reduceMotion && SW[id].rm ? SW[id].rm : '');
  const pageRow = (id, sel) => {
    const s = SW[id];
    const on = NS.cfg.on[id];
    const dim = s.parent && !NS.cfg.on[s.parent];
    const d = document.createElement('div');
    d.className = 'pause__row pause__row--word pause__row--cmd ec-row ' + (s.master ? 'ec-master' : 'ec-child') + (sel === id ? ' pause__row--sel' : '') + (on ? '' : ' ec-off') + (dim ? ' ec-dim' : '');
    d.dataset.row = id;
    d.setAttribute('role', 'button');
    d.tabIndex = 0;
    const q = on && !dim && rmSuffix(id) ? `<em>· ${rmSuffix(id)}</em>` : '';
    d.innerHTML = `<span class="pause__k">${esc(s.label)}</span><span class="pause__v">${on ? 'ON' : 'OFF'}${q}</span>`;
    return d;
  };
  const topRow = (variant, sel) => {
    const d = document.createElement('div');
    const isA = variant === 'A';
    const label = isA ? 'ALL LOOKS' : 'PRESET';
    const value = isA ? allState() : NS.preset;
    d.className = 'pause__row pause__row--word pause__row--cmd ec-row ec-master' + (sel === 'top' ? ' pause__row--sel' : '') + (value === 'ALL OFF' || value === 'OFF' ? ' ec-off' : '');
    d.dataset.row = isA ? 'fxAll' : 'fxPreset';
    d.innerHTML = `<span class="pause__k">${label}</span><span class="pause__v">${value}</span>`;
    return d;
  };
  const helpHtml = (id) => {
    if (id === 'top') {
      return NS.variant === 'A'
        ? ['ALL LOOKS', 'ALL ON or ALL OFF in one press. Every look and part below still has its own switch.', 'Both games.']
        : ['PRESET', 'FULL, BALANCED, CALM or OFF in one press. It reads CUSTOM when your switches match none of them.', 'Both games.'];
    }
    const s = SW[id];
    return [s.label, s.help, s.game];
  };
  const setHelp = (id) => {
    const [t, b, g] = helpHtml(id);
    for (const h of $$('.ec-help')) {
      $('.ec-help-t', h).textContent = t;
      $('.ec-help-b', h).textContent = b;
      $('.ec-help-g', h).textContent = g;
    }
  };

  /** Open the page. variant 'A' (ALL LOOKS on top) or 'C' (PRESET on top). */
  NS.openPage = ({ variant = 'A', sel = 'fxDof', title = 'Eye candy' } = {}) => {
    NS.variant = variant;
    $('.ec-layer')?.remove();
    $$('.ec-prompt').forEach((e) => e.remove());
    clearSel();
    const layer = document.createElement('div');
    layer.className = 'ec-layer';
    layer.dataset.role = 'ec';
    const n = NS.counts();
    layer.innerHTML = `<h3 class="ec-h">${esc(title)}<b>${n.on} of ${n.of} on</b>${NS.cfg.reduceMotion ? '<b class="ec-h-rm">Reduce motion is on</b>' : ''}</h3><div class="ec-scroll"><div class="ec-cols"><div class="ec-col" data-ec="1"></div><div class="ec-col" data-ec="2"></div></div></div>` +
      `<div class="ec-help ec-help--phone"><span class="ec-help-t"></span><span class="ec-help-b"></span><span class="ec-help-g"></span></div>`;
    ui().appendChild(layer);
    const c1 = $('[data-ec="1"]', layer);
    const c2 = $('[data-ec="2"]', layer);
    c1.appendChild(topRow(variant, sel));
    const rule = document.createElement('div');
    rule.className = 'ec-rule';
    c1.appendChild(rule);
    const place = (m, col) => { col.appendChild(pageRow(m, sel)); for (const k of kids(m)) col.appendChild(pageRow(k, sel)); };
    place('fxLight', c1);
    place('fxLiving', c1);
    place('fxSpectacle', c2);
    const help = document.createElement('div');
    help.className = 'ec-help ec-help--desk';
    help.innerHTML = '<span class="ec-help-t"></span><span class="ec-help-b"></span><span class="ec-help-g"></span>';
    c2.appendChild(help);
    setHelp(sel);

    // The page's own two prompts replace "Esc RESUME / H painting only" (the credits panel's way).
    const back = document.createElement('div');
    back.className = 'pause__back ec-prompt ec-back';
    back.setAttribute('role', 'button');
    back.innerHTML = '<span class="pause__key">Esc</span>Back';
    const hint = document.createElement('div');
    hint.className = 'pause__hide ec-prompt ec-back';
    hint.innerHTML = isPhone() ? 'Tap a row to flip it' : 'Up / Down&nbsp;&nbsp;move&nbsp;&nbsp;&middot;&nbsp;&nbsp;Left / Right&nbsp;&nbsp;flip';
    ui().append(back, hint);
    root().classList.add('pause--ec');
    // The selected row stays in view (the game scrolls it the same way).
    $('.pause__row--sel', layer)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  // ------------------------------------------------------------------ audit: what clips, what overlaps
  NS.audit = () => {
    const issues = [];
    const vw = innerWidth;
    const vh = innerHeight;
    for (const k of $$('.pause__k, .pause__v')) {
      const r = k.getBoundingClientRect();
      if (!r.width) continue;
      if (k.scrollWidth > k.clientWidth + 1) issues.push({ clip: k.textContent.trim(), sw: k.scrollWidth, cw: k.clientWidth });
      if (r.right > vw + 1 || r.left < -1) issues.push({ offscreen: k.textContent.trim(), left: Math.round(r.left), right: Math.round(r.right) });
    }
    const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), b: Math.round(r.bottom), r: Math.round(r.right) }; };
    const layer = $('.ec-layer');
    const scroll = $('.ec-scroll');
    const col = settingsCol();
    const obj = $('.pause__obj');
    return {
      issues,
      layer: box(layer),
      scroll: scroll ? { sh: scroll.scrollHeight, ch: scroll.clientHeight, st: scroll.scrollTop } : null,
      settings: col ? { box: box(col), sh: col.scrollHeight, ch: col.clientHeight, st: col.scrollTop } : null,
      objTop: obj ? Math.round(obj.getBoundingClientRect().top) : null,
      rows: $$('.ec-row').length,
      lastRowBottom: (() => { const rs = $$('.ec-row'); return rs.length ? Math.round(rs[rs.length - 1].getBoundingClientRect().bottom) : null; })(),
      help: box($('.ec-help:not([style*="none"])')),
      vp: [vw, vh],
    };
  };
})();
