// A+ : FF7's battle HUD, option A made more faithful, built to docs/plans/ff7-hud-faithful-a-spec.md.
// FF7 only. Positions are FF7 picture units (u, 320 x 224). Repair pass 2026-09-27: COLUMN
// ANCHORS stretch with the frame (desk: x 5 px/u), but everything inside a column (type, the HP
// field, lines, gauge boxes, the command window) keeps FF7's own proportions at the vertical
// scale s (4.018 px/u at 900). Phone modes use one uniform scale. Tags such as [estimate] mark
// what the spec marks unsourced.
const FAM = { // body families; PR7 is our own glyph set (glyphs.js), the rest are OFL candidates
  PR7: { css: null, w: 400, hw: 400 }, MPR: { css: 'M PLUS Rounded 1c', w: 500, hw: 500 },
  Raj: { css: 'Rajdhani', w: 600, hw: 700 }, Exo: { css: 'Exo 2', w: 600, hw: 800 }, Chk: { css: 'Chakra', w: 500, hw: 700 },
};
const FM = {}; // measured font metrics (fractions of the em) and the ratios compared on the type sheet
let O = { x: 0, y: 0 }; // origin of the window being built

function measureFonts() {
  const c = document.createElement('canvas').getContext('2d');
  for (const [k, f] of Object.entries(FAM)) {
    if (!f.css) { // our glyph set: ratios straight from the glyph table (cap = 8 glyph units)
      FM[k] = { cap: 1, digitPerCap: GL.DIGIT_ADV / 8, cloudPerCap: GL.width('Cloud') / 8, barretPerCap: GL.width('Barret') / 8 };
      continue;
    }
    for (const [key, w] of [['', f.w], ['H', f.hw]]) {
      c.font = `${w} 200px "${f.css}"`;
      const m = c.measureText('H'), cap = m.actualBoundingBoxAscent / 200;
      FM[k + key] = { cap, asc: m.fontBoundingBoxAscent / 200, desc: m.fontBoundingBoxDescent / 200, w, css: f.css,
        digitPerCap: c.measureText('0').width / 200 / cap, cloudPerCap: c.measureText('Cloud').width / 200 / cap,
        barretPerCap: c.measureText('Barret').width / 200 / cap };
    }
  }
  return FM;
}

// ---------- geometry per mode ----------
// L / R map a u position to px for the names / status window; s = px per u for sizes.
function geo(mode) {
  if (mode === 'phone' || mode === 'phoneB') {
    const B = mode === 'phoneB', p = B ? 1.64 : 2.05, safe = 47; // simulated safe-area top inset
    const stripY = 821, h = 54 * p;
    const rY = stripY - h, lY = B ? rY - 2 - h : 597;
    const L = { x: (u) => 8 + (u - 1) * p, y: (u) => lY + (u - 159) * p };
    const R = { x: (u) => 8 + (u - (B ? 92 : 138)) * p, y: (u) => (B ? rY : 710) + (u - 159) * p };
    const lBot = lY + h, cmdBot = lBot + 4 * p, cmdH = 196; // FF7: 4 u below the names window
    const cmdY = cmdBot - cmdH;
    return {
      mode, W: 390, H: 844, s: p, L, R, safe, namesInStatus: B,
      msg: { x: 8, y: safe + 8, w: 374, h: 45 }, strip: stripY,
      bandL: { x: 8, y: lY, w: 134 * p, h }, bandR: { x: 8, y: B ? rY : 710, w: 374, h },
      cmd: { r: { x: 156, y: cmdY, w: 190, h: cmdH }, tx: [204], sy: [0, 1, 2, 3].map((i) => cmdY + 32 + i * 44), cw: 40, ch: 20, tip: 4 },
      mag: { r: { x: 8, y: cmdY, w: 374, h: cmdH }, tx: [56, 176, 296], sy: [0, 1, 2, 3].map((i) => cmdY + 32 + i * 44), cw: 40, ch: 20, tip: 4 },
      mpw: { x: 232, y: cmdY - 58, w: 150, h: 54 },
      lim: { r: { x: 110, y: cmdY + 20, w: 272, h: 100 }, hx: 130, hb: cmdY + 49, tx: 180, sb: cmdY + 100 },
    };
  }
  const ox = mode === 'pillar' ? 200 : 0, hx = mode === 'pillar' ? 3.75 : 5, s = 900 / 224;
  const M = { x: (u) => ox + u * hx, y: (u) => u * s };
  const R4 = (x0, y0, x1, y1) => ({ x: M.x(x0), y: M.y(y0), w: M.x(x1) - M.x(x0), h: M.y(y1) - M.y(y0) });
  const slots = [172, 184, 196, 208].map(M.y);
  const cmdX = M.x(131) - 59 * s; // right edge anchored on the Barrier column, FF7's 59 u width
  const magW = 156 * s;
  return {
    mode, W: 1600, H: 900, s, L: M, R: M,
    msg: R4(17, 9, 303, 30), strip: M.y(213),
    bandL: R4(1, 159, 135, 213), bandR: R4(138, 159, 319, 213), // FF7's 3 u gap between them
    cmd: { r: { x: cmdX, y: M.y(163), w: 59 * s, h: 54 * s }, tx: [cmdX + 6 * s], sy: slots, cw: 20 * s, ch: 10 * s, tip: 2 * s },
    mag: { r: { x: cmdX, y: M.y(163), w: magW, h: 54 * s }, tx: [6, 58, 102].map((d) => cmdX + d * s), sy: slots, cw: 20 * s, ch: 10 * s, tip: 2 * s },
    mpw: { x: cmdX + magW + 1 * s, y: M.y(197), w: 66 * s, h: 18 * s }, // right of the list, over the empty third row
    lim: { r: { x: cmdX + 9 * s, y: M.y(166), w: 133 * s, h: 24 * s }, hx: cmdX + 16 * s, hb: M.y(175), tx: cmdX + 38 * s, sb: M.y(186) },
  };
}
// Column anchor: x of FF7 column u, plus an offset du inside the column at FF7's own scale.
const col = (M, u, du = 0) => M.x(u) + du * geoNow.s;

// ---------- primitives (coordinates are frame pixels; O makes them window-relative) ----------
const px = (n) => `${Math.round(n * 100) / 100}px`;
function box(x, y, w, h, cls, style = '') {
  return `<div class="${cls}" style="left:${px(x - O.x)};top:${px(y - O.y)};width:${px(w)};height:${px(h)};${style}"></div>`;
}
// Text placed by its baseline, sized by its cap height (spec §5.5). o: fam, color (or one per
// letter), shadow px, outline px, align l|r|c, head (header caps: the heavier weight).
function txt(x, base, cap, str, o = {}) {
  const fam = o.fam || 'PR7', a = o.align || 'l';
  if (fam === 'PR7') {
    const k = cap / 8, g = glyphSVG(str, k, { color: o.color, shadow: o.shadow, outline: o.outline,
      stroke: o.head ? 2.0 : 1.15, track: o.head ? 0.9 : 0 });
    const left = a === 'l' ? x : a === 'r' ? x - g.width : x - g.width / 2;
    return `<div class="t" data-s="${str.replace(/"/g, '&quot;')}" data-pad="${g.padPx}" data-w="${g.width}" style="left:${px(left - g.padPx - O.x)};top:${px(base - 8 * k - g.padPx - O.y)}">${g.svg}</div>`;
  }
  const f = FM[fam + (o.head ? 'H' : '')], fs = cap / f.cap;
  const top = base - ((fs - (f.asc + f.desc) * fs) / 2 + f.asc * fs);
  const lx = a === 'l' ? x : a === 'r' ? x - 2000 : x - 1000;
  let sh = '';
  if (o.outline) {
    const d = o.outline, ds = [];
    for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) ds.push(`${dx * d}px ${dy * d}px 0 #181818`);
    sh = ds.join(',');
  } else if (o.shadow) sh = `${px(o.shadow)} ${px(o.shadow)} 0 #222222`;
  const body = Array.isArray(o.color) ? [...str].map((ch, i) => `<span style="color:${o.color[i]}">${ch}</span>`).join('') : str;
  return `<div class="t" style="left:${px(lx - O.x)};top:${px(top - O.y)};width:${a === 'l' ? 'auto' : '2000px'};text-align:${a === 'l' ? 'left' : a === 'r' ? 'right' : 'center'};` +
    `font:${f.w} ${px(fs)}/${px(fs)} '${f.css}';color:${Array.isArray(o.color) ? '#fff' : o.color || '#E7E7E7'};${sh ? `text-shadow:${sh};` : ''}">${body}</div>`;
}

// A window: bilinear four-corner gradient (spec §5.3) + a grey bevel frame of 3 u, radius 2 u.
const CORNERS = {
  blue: ['#0000B0', '#000080', '#000050', '#000020'],  // TL TR BL BR [verified: 3 sources, PS1]
  limit: ['#B04A98', '#A84480', '#A84480', '#A33D4B'], // TL, BR [single source]; TR / BL = our estimate (midpoint)
};
function frameShadow(t) {
  const side = ['#6C6C6C', '#939393', '#B7B7B7', '#9C9C9C', '#575757', '#272727'];
  const top = ['#C6C6C6', '#D0D0D0', '#949494', '#585858', '#333333'];
  const tb = [];
  top.forEach((c, i) => { const d = px(((i + 1) * t) / top.length); tb.push(`inset 0 ${d} 0 0 ${c}`, `inset 0 -${d} 0 0 ${c}`); });
  const sd = side.map((c, i) => `inset 0 0 0 ${px(((i + 1) * t) / side.length)} ${c}`);
  return [...tb, ...sd].join(','); // top / bottom rings drawn over the side rings (listed first = on top)
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
  limitMint: ['#6E9A70', '#C2F6C4', '#EEFFEE'],  // full, blink phase 1 (base measured; shade/highlight our estimate)
  limitPeach: ['#8E6038', '#EDB682', '#FFE2C4'], // full, blink phase 2 (base measured; shade/highlight our estimate)
  time: ['#51857A', '#9FD8BA', '#BCF1D1'],
  timeFull: ['#94955A', '#F1EE9D', '#FDF9BD'],
};
const cyl = ([sh, base, hi]) => `linear-gradient(${sh} 0%,${base} 25%,${hi} 40%,${base} 60%,${sh} 100%)`;
function gauge(x, w, yc, frac, state) { // FF7's 36 x 9 u box at the vertical scale (4:1)
  const s = geoNow.s, h = 9 * s, y = yc - h / 2, iw = w - 2 * s, ih = h - 2 * s;
  return box(x, y, w, h, 'gb', `border-width:${px(s)}`) +
    box(x + s, y + s, iw, ih, 'tr', `background:${cyl(CYL.track)}`) +
    (frac > 0 ? box(x + s, y + s, iw * Math.min(1, frac), ih, 'fl', `background:${cyl(CYL[state])}`) : '');
}
function barrierBox(right, yc) { // two stacked bars: Barrier (top), MBarrier (bottom); both empty in this fight
  const s = geoNow.s, w = 35 * s, x = right - w, y = yc - 5 * s, h = 10 * s, ih = (h - 2 * s) / 2;
  return box(x, y, w, h, 'gb', `border-width:${px(s)}`) +
    box(x + s, y + s, w - 2 * s, ih, 'tr', `background:${cyl(CYL.track)}`) +
    box(x + s, y + s + ih, w - 2 * s, ih, 'tr', `background:${cyl(CYL.track)}`);
}
function line(x, w, y, frac, grad) { // HP / MP line: the filled part shows the full-field gradient
  const s = geoNow.s;
  return box(x, y, w, s, 'ln', 'background:#2D0908') +
    box(x, y, w * frac, s, 'ln', `background:linear-gradient(90deg,${grad});background-size:${px(w)} 100%`);
}

// ---------- the band (spec §5.4) ----------
const HDR_COL = '#ACACAC';
const HDR = (M, x, str, fam, align) => txt(x, M.y(165), 4.5 * geoNow.s, str, { fam, head: true, color: HDR_COL, outline: Math.max(1, geoNow.s / 2), align });
const ROWS = [171, 187, 203];
function nameCol(p) { return p.grey ? '#6B6B6B' : '#E7E7E7'; }
function bandLeft(party, fam) {
  const g = geoNow, M = g.L, s = g.s;
  return win(g.bandL, 'blue', 'band-left', () => {
    let h = HDR(M, M.x(13), 'NAME', fam) + HDR(M, M.x(131), 'BARRIER', fam, 'r');
    party.forEach((p, i) => {
      const yc = M.y(ROWS[i]);
      h += txt(M.x(13), M.y(ROWS[i] + 4), 8 * s, p.n, { fam, shadow: s, color: nameCol(p) }) + barrierBox(M.x(131), yc);
    });
    return h;
  });
}
function bandRight(party, fam) {
  const g = geoNow, M = g.R, s = g.s;
  return win(g.bandR, 'blue', 'band-right', () => {
    let h = HDR(M, col(M, 144), 'HP', fam) + HDR(M, col(M, 207, 4), 'MP', fam) + HDR(M, col(M, 239, 1), 'LIMIT', fam) + HDR(M, col(M, 277, 3), 'TIME', fam);
    if (g.namesInStatus) h += HDR(M, M.x(98), 'NAME', fam);
    party.forEach((p, i) => {
      const yc = M.y(ROWS[i]), base = M.y(ROWS[i] + 4), cap = 8 * s, lineY = M.y(ROWS[i] + 5);
      const hpCol = p.hp <= p.max / 4 ? '#F8F070' : '#E7E7E7'; // yellow at or below 1/4 [verified]; this yellow is our estimate
      const o = { fam, shadow: s, color: hpCol };
      const hp0 = col(M, 144), curEnd = col(M, 144, 28), maxEnd = col(M, 144, 60); // FF7: cur field, "/", max field: 28 + 32 u
      const mp0 = col(M, 207), mpEnd = col(M, 207, 29);
      if (g.namesInStatus) h += txt(M.x(98), base, cap, p.n, { fam, shadow: s, color: nameCol(p) });
      h += txt(curEnd, base, cap, String(p.hp), { ...o, align: 'r' }) + txt(curEnd, base, cap, '/', o) +
        txt(maxEnd, base, cap, String(p.max), { ...o, align: 'r' }) +
        line(hp0, maxEnd - hp0, lineY, p.hp / p.max, '#4774E4,#CDC4DE') +
        txt(mpEnd, base, cap, String(p.mp), { fam, shadow: s, align: 'r' }) +
        line(mp0, mpEnd - mp0, lineY, p.mp / p.mpMax, '#67C2D1,#C3C7BF') +
        gauge(col(M, 239), 36 * s, yc, p.lim, p.limState || 'limit') +
        gauge(col(M, 277), 36 * s, yc, p.time, p.time >= 1 ? 'timeFull' : 'time');
    });
    return h;
  });
}

// ---------- command window, submenus, message (spec §5.8, §5.9) ----------
// "Limit" letter colours: each letter runs its own order through the same eight colours, read
// letter by letter off the reference animation (FFVII_Limit.gif, 8 frames). The order is a fact
// read off the animation; the hex values are our rough sampling of it; the step rate (100 ms) is
// the spec's reading, unverified in game.
const LC = { G: '#60F080', Y: '#F0F000', Gy: '#707070', R: '#D80000', C: '#00F0F0', W: '#F0F0F0', B: '#0060B8', M: '#F000F0' };
const LIMIT_TABLE = [
  ['G', 'Y', 'Gy', 'R', 'C', 'W', 'B', 'M'], // L
  ['M', 'C', 'W', 'B', 'G', 'Y', 'Gy', 'R'], // i
  ['R', 'G', 'Y', 'Gy', 'M', 'C', 'W', 'B'], // m
  ['B', 'M', 'C', 'W', 'R', 'G', 'Y', 'Gy'], // i
  ['Gy', 'R', 'G', 'Y', 'B', 'M', 'C', 'W'], // t
];
const limitColours = (phase) => LIMIT_TABLE.map((row) => LC[row[phase % 8]]);
function cursorAt(c, textX, yc) {
  return `<div class="cur" style="left:${px(textX - c.tip - c.cw - O.x)};top:${px(yc - c.ch / 2 - O.y)}">${gloveSVG(c.cw, c.ch)}</div>`;
}
function capFor(g) { return g.mode.startsWith('phone') ? 16.4 : 8 * g.s; } // phone commands keep a 16 px cap for touch
function cmdWin(cmd, fam) {
  const g = geoNow, c = g.cmd, cap = capFor(g);
  return win(c.r, 'blue', 'command', () => cmd.slots.map((label, i) => {
    if (!label) return ''; // an empty slot stays blank (no Summon materia)
    const color = label === 'Limit' ? limitColours(cmd.phase || 0) : '#FFFFFF';
    return txt(c.tx[0], c.sy[i] + cap / 2, cap, label, { fam, shadow: g.s, color }) +
      (cmd.cur === i ? cursorAt(c, c.tx[0], c.sy[i]) : '');
  }).join(''));
}
function magicWin(m, fam) { // [layout unsourced, our estimate] (spec §5.8)
  const g = geoNow, c = g.mag, cap = capFor(g), s = g.s;
  const list = win(c.r, 'blue', 'magic', () => m.spells.map((sp, i) => {
    const colI = i % 3, row = Math.floor(i / 3);
    return txt(c.tx[colI], c.sy[row] + cap / 2, cap, sp, { fam, shadow: s, color: '#FFFFFF' }) +
      (m.cur === i ? cursorAt(c, c.tx[colI], c.sy[row]) : '');
  }).join(''));
  const r = g.mpw, base = r.y + r.h / 2 + cap / 2;
  const mp = win(r, 'blue', 'mp-needed', () => txt(r.x + 6 * s, base - 2 * s, 4.5 * s, 'MP', { fam, head: true, color: HDR_COL, outline: Math.max(1, s / 2) }) +
    txt(r.x + r.w - 30 * s, base, cap, `${m.mp[0]}/`, { fam, shadow: s, color: '#FFFFFF', align: 'r' }) +
    txt(r.x + r.w - 6 * s, base, cap, `${m.mp[1]}`, { fam, shadow: s, color: '#FFFFFF', align: 'r' }));
  return list + mp;
}
function limitWin(l, fam) {
  const g = geoNow, c = g.lim, s = g.s;
  const cc = { cw: g.cmd.cw, ch: g.cmd.ch, tip: g.cmd.tip };
  return win(c.r, 'limit', 'limit', () =>
    txt(c.hx, c.hb, 4.5 * s, 'LIMIT LEVEL 1', { fam, head: true, color: HDR_COL, outline: Math.max(1, s / 2) }) +
    txt(c.tx, c.sb, 8 * s, l.name, { fam, shadow: s, color: '#FFFFFF' }) + cursorAt(cc, c.tx, c.sb - 4 * s));
}
function msgWin(text, fam) {
  const g = geoNow, r = g.msg, cap = 8 * (g.mode.startsWith('phone') ? 2.05 : g.s);
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
