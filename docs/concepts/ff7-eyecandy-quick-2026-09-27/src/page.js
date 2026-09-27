// Assemble one eye-candy frame: the painted/composited scene (frames.py) + the A+ HUD (hud.js, reused
// unchanged) + the glossy extras. FF7 only. Party HP values and the Tail Laser damage (74 / 73) are
// the A+ mock's own placeholders (research/ff7-guard-scorpion.md §8.4 and §9, derived ranges).
const C = (hp, lim, time, extra = {}) => ({ n: 'Cloud', hp, max: 316, mp: 57, mpMax: 57, lim, time, ...extra });
const B = (hp, lim, time, extra = {}) => ({ n: 'Barret', hp, max: 317, mp: 43, mpMax: 43, lim, time, ...extra });
const FRAMES = {
  f1: { msg: null, party: [C(279, 0.48, 1), B(150, 0.4, 0.55)], cmd: { slots: ['Attack', 'Magic', '', 'Item'], cur: 0 }, ready: true },
  f2: { msg: 'Tail Laser', party: [C(205, 1, 0.08, { limState: 'limitPeach' }), B(77, 0.96, 0.7)], damage: [['cloud', '74'], ['barret', '73']] },
  f3: { msg: 'Braver', party: [C(205, 1, 1, { limState: 'limitPeach' }), B(77, 0.96, 0.78)], blaze: 0 },
};
const TAGS = {
  f1: { chip: 'EYE-CANDY QUICK MOCKUP · MAKO STORM · FF7 ONLY · EFFECTS PROCEDURAL · HP PLACEHOLDERS' },
  f2: { chip: 'EYE-CANDY QUICK MOCKUP · TAIL LASER · FF7 ONLY · EFFECTS PROCEDURAL · HP PLACEHOLDERS' },
  f3: { chip: 'EYE-CANDY QUICK MOCKUP · BRAVER · FF7 ONLY · EFFECTS PROCEDURAL · HP PLACEHOLDERS',
    cloud: 'CLOUD · STANDING PILOT TILTED = LEAP PLACEHOLDER' },
};
const FIG_TAGS = {
  cloud: 'CLOUD · UNAPPROVED HI-FI PILOT (NOT A PICK)',
  barret: 'BARRET · UNAPPROVED HI-FI PILOT · GUN ARM STILL SHOWS A FIST',
  boss: 'GUARD SCORPION · INSTALLED ART MIRRORED (SYMMETRIC MACHINE)',
};

function tag(x, y, text, ph, align = 'l') {
  const tr = align === 'r' ? 'translateX(-100%)' : align === 'c' ? 'translateX(-50%)' : '';
  return `<div class="tag${ph ? ' ph' : ''}" style="left:${x}px;top:${y}px;transform:${tr}">${text}</div>`;
}

function readyTriangle(cx, y) { // the A+ ready marker, re-centred, with a glow
  const dx = cx - 985, dy = y - 420;
  return `<g transform="translate(${dx} ${dy})" filter="url(#gl)"><path d="M966 408 L990 411 L985 437Z" fill="#F7E30D"/>
    <path d="M990 411 L1004 405 L985 437Z" fill="#BFA800"/><path d="M966 408 L990 411 L1004 405 L982 404Z" fill="#FFF27A"/></g>`;
}

function damage(cx, base, str, q = 1) { // glowing digits with a bounce trail above them (q: phone scale)
  let s = `<g transform="translate(${cx} ${base}) scale(${q}) translate(${-cx} ${-base})">`;
  // the bounce: the digits dropped in from up-left, hit, and hopped once; a glowing dotted arc marks the path
  const x0 = cx - 70, y0 = base - 120, x1 = cx - 8, y1 = base - 22;
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t * t - 30 * Math.sin(Math.PI * t) * (1 - t);
    pts.push([x, y, t]);
  }
  s += `<path d="M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')}" fill="none" stroke="#ff8ee0" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round" opacity=".7" filter="url(#gl)"/>`;
  for (const [x, y, t] of pts.filter((_, i) => i % 3 === 0)) s += `<circle cx="${x}" cy="${y}" r="${1.5 + 2.5 * t}" fill="#fff" opacity="${0.25 + 0.6 * t}" filter="url(#gl)"/>`;
  s += `<ellipse cx="${cx}" cy="${base + 6}" rx="46" ry="7" fill="none" stroke="#ffd0f4" stroke-width="2" opacity=".55" filter="url(#gl)"/>`;
  s += `<g filter="url(#dglow)">${damageDigits(cx, base, str)}</g></g>`;
  return s;
}

function build(cfg) {
  const phone = cfg.mode === 'phone';
  const W = phone ? 390 : 1600, H = phone ? 844 : 900, k = cfg.k; // k: scene px -> CSS px
  const f = FRAMES[cfg.id];
  const an = cfg.an;
  const s = document.createElement('section');
  s.id = 'shot';
  s.className = phone ? 'phone' : 'desk';
  s.style.width = W + 'px';
  s.style.height = H + 'px';
  let fxs = '';
  if (f.ready) fxs += readyTriangle(an.cloud.x * k, (an.cloud.top - 48) * k);
  for (const [who, str] of f.damage || []) {
    const a = an[who];
    fxs += damage(a.x * k, (a.top + (a.feet - a.top) * 0.5) * k, str, phone ? 0.557 : 1);
  }
  const svg = `<svg class="fx" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><filter id="gl" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="dglow" x="-1" y="-1" width="3" height="3"><feGaussianBlur in="SourceAlpha" stdDeviation="7" result="a"/>
      <feFlood flood-color="#ff7ad9" flood-opacity=".95"/><feComposite in2="a" operator="in" result="g"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="a2"/><feFlood flood-color="#ffffff"/><feComposite in2="a2" operator="in" result="g2"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="g2"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${fxs}</svg>`;
  let html = `<img class="scene" src="${cfg.scene}">${svg}${hud(f, phone ? 'phone' : 'desk', 'PR7')}`;
  const g = geoNow;
  const extra = [];
  if (f.cmd && f.cmd.cur != null) { // glow on the active row
    const c = g.cmd, y = c.sy[f.cmd.cur];
    extra.push(`<div class="rowglow" style="left:${c.r.x + 5 * g.s}px;top:${y - c.ch * 0.75}px;width:${c.r.w - 10 * g.s}px;height:${c.ch * 1.5}px"></div>`);
  }
  if (f.blaze != null) { // the full Limit gauge blazing
    const M = g.R, gs = g.s, yc = M.y(171 + 16 * f.blaze), x = col(M, 239), w = 36 * gs, h = 9 * gs;
    extra.push(`<div class="blaze" style="left:${x + gs}px;top:${yc - h / 2 + gs}px;width:${w - 2 * gs}px;height:${h - 2 * gs}px"></div>`);
    for (let i = 0; i < 7; i++) {
      const fw = w * (0.13 + 0.05 * ((i * 37) % 3)), fh = h * (1.1 + 0.5 * ((i * 53) % 4) / 3);
      extra.push(`<div class="flame" style="left:${x + (w * (i + 0.5)) / 7 - fw / 2}px;top:${yc - h / 2 - fh * 0.8}px;width:${fw}px;height:${fh}px"></div>`);
    }
  }
  const t = TAGS[cfg.id];
  const tags = [];
  const chipY = phone ? 110 : 132;
  tags.push(tag(W - (phone ? 8 : 14), chipY, phone ? 'EYE-CANDY QUICK MOCKUP · FF7 ONLY · HP PLACEHOLDERS' : t.chip, false, 'r'));
  const figTag = (who, dy, align) => {
    const a = an[who];
    const text = (who === 'cloud' && t.cloud) || FIG_TAGS[who];
    const y = phone ? Math.min((a.feet * k) + 4, 575) : Math.min(a.feet * k + dy, 612);
    return tag(Math.max(6, Math.min(W - 6, a.x * k)), y, text, true, align);
  };
  if (!phone) {
    tags.push(tag(14, an.barret.top * k - 30, FIG_TAGS.barret, true));
    tags.push(figTag('cloud', cfg.id === 'f3' ? -8 : -4, 'c'));
    tags.push(figTag('boss', -4, 'c'));
  } else {
    tags.push(tag(8, chipY + 16, 'CLOUD + BARRET · UNAPPROVED HI-FI PILOTS', true));
    tags.push(tag(8, chipY + 30, 'BARRET · GUN ARM STILL SHOWS A FIST', true));
    tags.push(tag(8, chipY + 44, 'GUARD SCORPION · INSTALLED ART MIRRORED (SYMMETRIC)', true));
  }
  s.innerHTML = html + `<div class="hud">${extra.join('')}</div>` + tags.join('');
  document.getElementById('root').appendChild(s);
}
