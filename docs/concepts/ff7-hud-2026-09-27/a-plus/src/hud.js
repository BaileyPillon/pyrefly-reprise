// A+ : FF7's battle HUD, option A made more faithful, built to docs/plans/ff7-hud-faithful-a-spec.md.
// FF7 only. Every position is in FF7 picture units (u, 320 x 224) and mapped to pixels per mode:
// desk = stretched band (x 5 px/u, y 4.018 px/u), pillar = centred 4:3, phone = uniform 2.05 px/u
// with the two band windows stacked (spec §5.1, §5.2, §6). Sizes (type, frames, gauges) use the
// vertical scale. Tags such as [estimate] mark what the spec marks unsourced.
const FAM = { MPR: 'M PLUS Rounded 1c', Raj: 'Rajdhani', Hdr: 'Silkscreen', Dmg: 'Dmg' };
const FM = {};          // measured font metrics: cap, ascent, descent (fractions of the em)
const DMG_FS = 56;      // Russo One: digit height 0.72 em -> 40 px digits (10 u at 900)
let O = { x: 0, y: 0 }; // origin of the window being built

function measureFonts() {
  const c = document.createElement('canvas').getContext('2d');
  for (const [k, [fam, w]] of Object.entries({ MPR: [FAM.MPR, 500], Raj: [FAM.Raj, 600], Hdr: [FAM.Hdr, 700] })) {
    c.font = `${w} 200px "${fam}"`;
    const m = c.measureText('H');
    FM[k] = { fam, w, cap: m.actualBoundingBoxAscent / 200, asc: m.fontBoundingBoxAscent / 200, desc: m.fontBoundingBoxDescent / 200 };
  }
  return FM;
}

// ---------- geometry per mode ----------
function geo(mode) {
  if (mode === 'phone') {
    const p = 2.05;
    const L = { x: (u) => 8 + u * p, y: (u) => 597 + (u - 159) * p };
    const R = { x: (u) => 8 + (u - 137) * p, y: (u) => 710 + (u - 159) * p };
    return {
      mode, W: 390, H: 844, s: p, L, R,
      msg: { x: 8, y: 8, w: 374, h: 45 }, strip: 821,
      bandL: { x: 8, y: 597, w: 279, h: 111 }, bandR: { x: 8, y: 710, w: 374, h: 111 },
      cmd: { r: { x: 156, y: 520, w: 190, h: 196 }, tx: [168], sy: [552, 596, 640, 684], cw: 40, ch: 20, tip: 4 },
      mag: { r: { x: 8, y: 520, w: 374, h: 196 }, tx: [52, 172, 292], sy: [552, 596, 640, 684], cw: 40, ch: 20, tip: 4 },
      mpw: { x: 232, y: 462, w: 150, h: 54 },
      lim: { r: { x: 110, y: 540, w: 272, h: 100 }, hx: 130, hb: 569, tx: 180, sb: 620 },
    };
  }
  const ox = mode === 'pillar' ? 200 : 0, hx = mode === 'pillar' ? 3.75 : 5, v = 900 / 224;
  const M = { x: (u) => ox + u * hx, y: (u) => u * v };
  const R4 = (x0, y0, x1, y1) => ({ x: M.x(x0), y: M.y(y0), w: M.x(x1) - M.x(x0), h: M.y(y1) - M.y(y0) });
  const slots = [172, 184, 196, 208].map(M.y);
  return {
    mode, W: 1600, H: 900, s: v, L: M, R: M,
    msg: R4(17, 9, 303, 30), strip: M.y(213),
    bandL: R4(1, 159, 136, 213), bandR: R4(137, 159, 319, 213),
    cmd: { r: R4(72, 163, 131, 217), tx: [M.x(78)], sy: slots, cw: 20 * v, ch: 10 * v, tip: 2 * v },
    mag: { r: R4(72, 163, 228, 217), tx: [78, 130, 174].map(M.x), sy: slots, cw: 20 * v, ch: 10 * v, tip: 2 * v },
    mpw: R4(252, 163, 318, 181),
    lim: { r: R4(81, 166, 214, 190), hx: M.x(88), hb: M.y(175), tx: M.x(110), sb: M.y(186) },
  };
}

// ---------- primitives (coordinates are frame pixels; O makes them window-relative) ----------
const px = (n) => `${Math.round(n * 100) / 100}px`;
function box(x, y, w, h, cls, style = '') {
  return `<div class="${cls}" style="left:${px(x - O.x)};top:${px(y - O.y)};width:${px(w)};height:${px(h)};${style}"></div>`;
}
// Text placed by its baseline, sized by its cap height (spec §5.5: type is sized by cap).
function txt(x, base, cap, str, o = {}) {
  const f = FM[o.fam || 'MPR'];
  const fs = cap / f.cap;
  const top = base - ((fs - (f.asc + f.desc) * fs) / 2 + f.asc * fs);
  const a = o.align || 'l';
  const lx = a === 'l' ? x : a === 'r' ? x - 2000 : x - 1000;
  const w = a === 'l' ? 'auto' : a === 'r' ? '2000px' : '2000px';
  let sh = '';
  if (o.outline) {
    const d = o.outline, ds = [];
    for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) ds.push(`${dx * d}px ${dy * d}px 0 #181818`);
    sh = ds.join(',');
  } else if (o.shadow) sh = `${px(o.shadow)} ${px(o.shadow)} 0 #222222`;
  return `<div class="t" style="left:${px(lx - O.x)};top:${px(top - O.y)};width:${w};text-align:${a === 'l' ? 'left' : a === 'r' ? 'right' : 'center'};` +
    `font:${f.w} ${px(fs)}/${px(fs)} '${f.fam}';color:${o.color || '#E7E7E7'};${sh ? `text-shadow:${sh};` : ''}">${str}</div>`;
}

// A window: bilinear four-corner gradient (spec §5.3) + a grey bevel frame of 3 u, radius 2 u.
const CORNERS = {
  blue: ['#0000B0', '#000080', '#000050', '#000020'],            // TL TR BL BR [verified: 3 sources, PS1]
  limit: ['#B04A98', '#A84480', '#A84480', '#A33D4B'],           // [single source]; TR/BL = our midpoint
};
function frameShadow(t) {
  const side = ['#6C6C6C', '#939393', '#B7B7B7', '#9C9C9C', '#575757', '#272727'];
  const top = ['#C6C6C6', '#D0D0D0', '#949494', '#585858', '#333333'];
  const tb = [];
  top.forEach((c, i) => { const d = px(((i + 1) * t) / top.length); tb.push(`inset 0 ${d} 0 0 ${c}`, `inset 0 -${d} 0 0 ${c}`); });
  const sd = side.map((c, i) => `inset 0 0 0 ${px(((i + 1) * t) / side.length)} ${c}`);
  // top/bottom rings are drawn over the side rings (listed first = on top)
  return [...tb, ...sd].join(',');
}
function win(r, kind, name, inner) {
  const saved = O;
  O = { x: r.x, y: r.y };
  const g = geoNow, t = 3 * g.s, rad = 2 * g.s;
  const [tl, tr, bl, br] = CORNERS[kind === 'limit' ? 'limit' : 'blue'];
  const alpha = kind === 'msg' ? 0.5 : 1; // top window translucent: our estimate of the PS1 half blend
  const body = inner();
  O = saved;
  return `<div class="w" data-name="${name}" style="left:${px(r.x - O.x)};top:${px(r.y - O.y)};width:${px(r.w)};height:${px(r.h)}">
    <div class="bg" style="border-radius:${px(rad)};opacity:${alpha};--tl:${tl};--tr:${tr};--bl:${bl};--br:${br}"></div>
    <div class="fr" style="border-radius:${px(rad)};box-shadow:${frameShadow(t)}"></div>${body}</div>`;
}

// ---------- gauges (spec §3.4, §5.7) ----------
const CYL = {
  track: ['#181818', '#6B6B6B', '#7B7B7B'],
  limit: ['#86476A', '#DE9CC0', '#FFD0E8'],
  limitMint: ['#6E9A70', '#C2F6C4', '#EEFFEE'],   // full, blink phase 1 (shade/highlight: our estimate)
  limitPeach: ['#8E6038', '#EDB682', '#FFE2C4'],  // full, blink phase 2 (shade/highlight: our estimate)
  time: ['#51857A', '#9FD8BA', '#BCF1D1'],
  timeFull: ['#94955A', '#F1EE9D', '#FDF9BD'],
};
const cyl = ([sh, base, hi]) => `linear-gradient(${sh} 0%,${base} 25%,${hi} 40%,${base} 60%,${sh} 100%)`;
function gauge(M, x0, x1, yc, hU, frac, state) {
  const g = geoNow, s = g.s;
  const x = M.x(x0), w = M.x(x1) - x, y = M.y(yc) - (hU * s) / 2, h = hU * s;
  const iw = w - 2 * s, ih = h - 2 * s;
  return box(x, y, w, h, 'gb', `border-width:${px(s)}`) +
    box(x + s, y + s, iw, ih, 'tr', `background:${cyl(CYL.track)}`) +
    (frac > 0 ? box(x + s, y + s, iw * Math.min(1, frac), ih, 'fl', `background:${cyl(CYL[state])}`) : '');
}
function barrierBox(M, yc) { // two stacked bars: Barrier (top), MBarrier (bottom); both empty in this fight
  const s = geoNow.s, x = M.x(96), w = M.x(131) - x, y = M.y(yc) - 5 * s, h = 10 * s;
  const ih = (h - 2 * s) / 2;
  return box(x, y, w, h, 'gb', `border-width:${px(s)}`) +
    box(x + s, y + s, w - 2 * s, ih, 'tr', `background:${cyl(CYL.track)}`) +
    box(x + s, y + s + ih, w - 2 * s, ih, 'tr', `background:${cyl(CYL.track)}`);
}
function line(M, x0, x1, yc, frac, grad) { // HP / MP line: filled part shows the full-field gradient
  const s = geoNow.s, x = M.x(x0), w = M.x(x1) - x, y = M.y(yc + 5), h = s;
  return box(x, y, w, h, 'ln', 'background:#2D0908') +
    box(x, y, w * frac, h, 'ln', `background:linear-gradient(90deg,${grad});background-size:${px(w)} 100%`);
}

// ---------- the band (spec §5.4) ----------
const HDR = (M, x, str, align) => txt(M.x(x), M.y(165), 4 * geoNow.s, str, { fam: 'Hdr', color: '#ACACAC', outline: Math.max(1, geoNow.s / 2), align });
function bandLeft(party, fam) {
  const g = geoNow, M = g.L;
  return win(g.bandL, 'blue', 'band-left', () => {
    let h = HDR(M, 13, 'NAME') + HDR(M, 131, 'BARRIER', 'r');
    party.forEach((p, i) => {
      const yc = [171, 187, 203][i];
      h += txt(M.x(13), M.y(yc + 4), 8 * g.s, p.n, { fam, shadow: g.s }) + barrierBox(M, yc);
    });
    return h;
  });
}
function bandRight(party, fam) {
  const g = geoNow, M = g.R, s = g.s;
  return win(g.bandR, 'blue', 'band-right', () => {
    let h = HDR(M, 144, 'HP') + HDR(M, 211, 'MP') + HDR(M, 240, 'LIMIT') + HDR(M, 280, 'TIME');
    party.forEach((p, i) => {
      const yc = [171, 187, 203][i], base = M.y(yc + 4), cap = 8 * s;
      const hpCol = p.hp <= p.max / 4 ? '#F8F070' : '#E7E7E7'; // yellow at or below 1/4 [verified]; hue our estimate
      const o = { fam, shadow: s, color: hpCol };
      h += txt(M.x(172), base, cap, String(p.hp), { ...o, align: 'r' }) + txt(M.x(172), base, cap, '/', o) +
        txt(M.x(204), base, cap, String(p.max), { ...o, align: 'r' }) +
        line(M, 144, 204, yc, p.hp / p.max, '#4774E4,#CDC4DE') +
        txt(M.x(236), base, cap, String(p.mp), { fam, shadow: s, align: 'r' }) +
        line(M, 207, 236, yc, p.mp / p.mpMax, '#67C2D1,#C3C7BF') +
        gauge(M, 239, 275, yc, 9, p.lim, p.limState || 'limit') +
        gauge(M, 277, 313, yc, 9, p.time, p.time >= 1 ? 'timeFull' : 'time');
    });
    return h;
  });
}

// ---------- command window, submenus, message (spec §5.8, §5.9) ----------
const LIMIT_CYCLE = ['#58E058', '#F0E040', '#A8A8A8', '#F04848', '#48E0E0', '#FFFFFF', '#5868F8', '#E058E0']; // hues our estimate
const limitWord = (phase) => [...'Limit'].map((ch, i) => `<span style="color:${LIMIT_CYCLE[(phase + i) % 8]}">${ch}</span>`).join('');
function cursorAt(c, textX, yc) {
  return `<div class="cur" style="left:${px(textX - c.tip - c.cw - O.x)};top:${px(yc - c.ch / 2 - O.y)}">${gloveSVG(c.cw, c.ch)}</div>`;
}
function cmdWin(cmd, fam) {
  const g = geoNow, c = g.cmd, cap = 8 * (g.mode === 'phone' ? 2.05 : g.s);
  return win(c.r, 'blue', 'command', () => cmd.slots.map((label, i) => {
    if (!label) return ''; // an empty slot stays blank (no Summon materia)
    const str = label === 'Limit' ? limitWord(cmd.phase || 0) : label;
    return txt(c.tx[0], c.sy[i] + cap / 2, cap, str, { fam, shadow: g.s / (g.mode === 'phone' ? 1 : 1), color: '#FFFFFF' }) +
      (cmd.cur === i ? cursorAt(c, c.tx[0], c.sy[i]) : '');
  }).join(''));
}
function magicWin(m, fam) {
  const g = geoNow, c = g.mag, cap = 8 * g.s;
  const list = win(c.r, 'blue', 'magic', () => m.spells.map((sp, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    return txt(c.tx[col], c.sy[row] + cap / 2, cap, sp, { fam, shadow: g.s, color: '#FFFFFF' }) +
      (m.cur === i ? cursorAt(c, c.tx[col], c.sy[row]) : '');
  }).join(''));
  const r = g.mpw, mid = r.y + r.h / 2;
  const mp = win(r, 'blue', 'mp-needed', () => txt(r.x + 6 * g.s, mid + 2 * g.s, 4 * g.s, 'MP', { fam: 'Hdr', color: '#ACACAC', outline: Math.max(1, g.s / 2) }) +
    txt(r.x + r.w - 26 * g.s, mid + 4 * g.s, 8 * g.s, `${m.mp[0]}/`, { fam, shadow: g.s, color: '#FFFFFF', align: 'r' }) +
    txt(r.x + r.w - 6 * g.s, mid + 4 * g.s, 8 * g.s, `${m.mp[1]}`, { fam, shadow: g.s, color: '#FFFFFF', align: 'r' }));
  return list + mp;
}
function limitWin(l, fam) {
  const g = geoNow, c = g.lim;
  const cc = { cw: g.cmd.cw, ch: g.cmd.ch, tip: g.cmd.tip };
  return win(c.r, 'limit', 'limit', () =>
    txt(c.hx, c.hb, 4 * g.s, 'LIMIT LEVEL 1', { fam: 'Hdr', color: '#ACACAC', outline: Math.max(1, g.s / 2) }) +
    txt(c.tx, c.sb, 8 * g.s, l.name, { fam, shadow: g.s, color: '#FFFFFF' }) + cursorAt(cc, c.tx, c.sb - 4 * g.s));
}
function msgWin(text, fam) {
  const g = geoNow, r = g.msg, cap = 8 * g.s;
  return win(r, 'msg', 'message', () => txt(r.x + r.w / 2, r.y + r.h / 2 + cap / 2, cap, text, { fam, shadow: g.s, color: '#FFFFFF', align: 'c' }));
}

// ---------- one frame ----------
let geoNow = null;
function hud(f, mode, fam) {
  const g = (geoNow = geo(mode));
  O = { x: 0, y: 0 };
  let h = `<div class="strip" style="top:${px(g.strip)};height:${px(g.H - g.strip)}"></div>`;
  h += bandLeft(f.party, fam) + bandRight(f.party, fam);
  if (f.cmd && !f.magic) h += cmdWin(f.cmd, fam);
  if (f.magic) h += magicWin(f.magic, fam);
  if (f.limitWin) h += limitWin(f.limitWin, fam);
  if (f.msg) h += msgWin(f.msg, fam);
  return `<div class="hud">${h}</div>`;
}
