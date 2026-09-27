// "PR7 Line": Pyrefly's own monoline glyph set for the FF7 battle HUD (FF7 only). Drawn from
// scratch as centre-line paths on FF7's own grid: cap height 8 u, x-height about 5.7 u, stroke
// 1.25 u, square caps, rounded-square shoulders. It is NOT traced from, and was not drawn over,
// any retail glyph or fan font (rule 8); only two measured proportions were taken from the
// reference stills: digit pitch about 0.86 to 0.90 of the cap height, and "Cloud" about 3.8 caps
// wide (spec §3.3; our reading of cs-bottom-x3). Everything else is our own letter design.
// Units: 1 glyph unit = 1 u at an 8 u cap. y grows downwards; the baseline is y = 8.
const GL = (() => {
  const T = 0.65, B = 7.35, X = 2.9, D = 9.95, Mi = 4.0, XM = 5.1;
  const f = (n) => Math.round(n * 100) / 100;
  // Polyline with rounded corners. pts: [x, y] or [x, y, r]; r is the default corner radius.
  function poly(pts, r = 0) {
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) {
      const v = pts[i], rr = v[2] ?? r;
      if (i === pts.length - 1 || !rr) { d += `L${f(v[0])} ${f(v[1])}`; continue; }
      const p = pts[i - 1], n = pts[i + 1];
      const lp = Math.hypot(p[0] - v[0], p[1] - v[1]), ln = Math.hypot(n[0] - v[0], n[1] - v[1]);
      const a = Math.min(rr, lp / 2), b = Math.min(rr, ln / 2);
      d += `L${f(v[0] + ((p[0] - v[0]) * a) / lp)} ${f(v[1] + ((p[1] - v[1]) * a) / lp)}` +
        `Q${f(v[0])} ${f(v[1])} ${f(v[0] + ((n[0] - v[0]) * b) / ln)} ${f(v[1] + ((n[1] - v[1]) * b) / ln)}`;
    }
    return d;
  }
  const seg = (x0, y0, x1, y1) => `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
  const rr = (x0, y0, x1, y1, r) => poly([[(x0 + x1) / 2, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0], [(x0 + x1) / 2, y0, 0]], r) + 'Z';
  const dot = (x, y) => seg(x, y - 0.2, x, y + 0.2);
  const onLine = (xa, ya, xb, yb, y) => xa + ((xb - xa) * (y - ya)) / (yb - ya);
  // name: [ink width, (a = left stem x, b = right stem x, c = centre) => path d]
  const G = {
    A: [6.8, (a, b, c) => { const yb = 5.4; return poly([[a, B], [c - 0.5, T], [c + 0.5, T], [b, B]]) + seg(onLine(a, B, c - 0.5, T, yb), yb, onLine(b, B, c + 0.5, T, yb), yb); }],
    B: [6.2, (a, b) => seg(a, T, a, B) + poly([[a, T], [b - 0.5, T], [b - 0.5, Mi], [a, Mi]], 1.3) + poly([[a, Mi], [b, Mi], [b, B], [a, B]], 1.5)],
    C: [6.2, (a, b) => poly([[b, T], [a, T], [a, B], [b, B]], 1.9)],
    D: [6.6, (a, b) => poly([[a, T], [b, T], [b, B], [a, B], [a, T, 0]], 2.2)],
    E: [5.4, (a, b) => poly([[b, T], [a, T], [a, B], [b, B]]) + seg(a, Mi, b - 0.6, Mi)],
    F: [5.2, (a, b) => poly([[b, T], [a, T], [a, B]]) + seg(a, Mi, b - 0.6, Mi)],
    G: [6.6, (a, b, c) => poly([[b, T], [a, T, 1.9], [a, B, 1.9], [b, B, 1.2], [b, Mi + 0.2, 0], [c, Mi + 0.2]])],
    H: [6.4, (a, b) => seg(a, T, a, B) + seg(b, T, b, B) + seg(a, Mi, b, Mi)],
    I: [1.3, (a) => seg(a, T, a, B)],
    J: [5.0, (a, b) => poly([[b, T], [b, B, 1.6], [a, B, 0], [a, B - 1.6]])],
    K: [6.2, (a, b) => { const ya = Mi + 0.4, yk = T + ((b - a - 1.6) / (b - a)) * (ya - T); return seg(a, T, a, B) + seg(b, T, a + 0.1, ya) + seg(a + 1.6, yk, b, B); }],
    L: [5.2, (a, b) => poly([[a, T], [a, B], [b, B]])],
    M: [8.0, (a, b, c) => poly([[a, B], [a, T], [c, Mi + 1.2], [b, T], [b, B]])],
    N: [6.6, (a, b) => poly([[a, B], [a, T], [b, B], [b, T]])],
    O: [6.8, (a, b) => rr(a, T, b, B, 2.2)],
    P: [6.0, (a, b) => seg(a, B, a, T) + poly([[a, T], [b, T], [b, Mi + 0.4], [a, Mi + 0.4]], 1.4)],
    Q: [6.8, (a, b, c) => rr(a, T, b, B, 2.2) + seg(c + 0.4, B - 1.6, b + 0.4, B + 0.8)],
    R: [6.2, (a, b, c) => seg(a, B, a, T) + poly([[a, T], [b, T], [b, Mi + 0.4], [a, Mi + 0.4]], 1.4) + seg(c, Mi + 0.4, b, B)],
    S: [6.0, (a, b) => poly([[b, T], [a, T, 1.5], [a, Mi, 1.2], [b, Mi, 1.2], [b, B, 1.5], [a, B]])],
    T: [6.4, (a, b, c) => seg(a, T, b, T) + seg(c, T, c, B)],
    U: [6.4, (a, b) => poly([[a, T], [a, B], [b, B], [b, T]], 2.0)],
    V: [6.8, (a, b, c) => poly([[a, T], [c, B], [b, T]])],
    W: [9.0, (a, b, c) => poly([[a, T], [a + 2.0, B], [c, T + 2.0], [b - 2.0, B], [b, T]])],
    X: [6.4, (a, b) => seg(a, T, b, B) + seg(b, T, a, B)],
    Y: [6.6, (a, b, c) => seg(a, T, c, Mi + 0.3) + seg(b, T, c, Mi + 0.3) + seg(c, Mi + 0.3, c, B)],
    Z: [6.0, (a, b) => poly([[a, T], [b, T], [a, B], [b, B]])],
    a: [5.6, (a, b) => poly([[a + 0.2, X], [b, X, 1.4], [b, B]]) + poly([[b, XM], [a, XM, 1.1], [a, B, 1.1], [b, B]])],
    b: [5.8, (a, b) => seg(a, T, a, B) + poly([[a, X], [b, X], [b, B], [a, B]], 1.6)],
    c: [5.2, (a, b) => poly([[b, X], [a, X], [a, B], [b, B]], 1.6)],
    d: [5.8, (a, b) => seg(b, T, b, B) + poly([[b, X], [a, X], [a, B], [b, B]], 1.6)],
    e: [5.6, (a, b) => poly([[a, XM], [b, XM, 0], [b, X, 1.5], [a, X, 1.6], [a, B, 1.6], [b - 0.1, B]])],
    f: [4.2, (a, b) => poly([[b + 0.3, T], [a + 1.1, T, 1.4], [a + 1.1, B]]) + seg(a, X, b, X)],
    g: [5.8, (a, b) => poly([[b, X], [b, D, 1.4], [a + 0.2, D]]) + poly([[b, X], [a, X], [a, B], [b, B]], 1.5)],
    h: [5.8, (a, b) => seg(a, T, a, B) + poly([[a, X], [b, X, 1.6], [b, B]])],
    i: [1.3, (a) => seg(a, X, a, B) + dot(a, T + 0.15)],
    j: [3.0, (a, b) => poly([[b, X], [b, D, 1.3], [a, D]]) + dot(b, T + 0.15)],
    k: [5.4, (a, b) => { const ya = XM + 0.2, yk = X + ((b - a - 1.4) / (b - a)) * (ya - X); return seg(a, T, a, B) + seg(b, X, a + 0.1, ya) + seg(a + 1.4, yk, b, B); }],
    l: [1.3, (a) => seg(a, T, a, B)],
    m: [8.6, (a, b, c) => seg(a, X, a, B) + poly([[a, X], [c, X, 1.4], [c, B]]) + poly([[c, X], [b, X, 1.4], [b, B]])],
    n: [5.8, (a, b) => seg(a, X, a, B) + poly([[a, X], [b, X, 1.6], [b, B]])],
    o: [5.8, (a, b) => rr(a, X, b, B, 1.7)],
    p: [5.8, (a, b) => seg(a, X, a, D) + poly([[a, X], [b, X], [b, B], [a, B]], 1.6)],
    q: [5.8, (a, b) => seg(b, X, b, D) + poly([[b, X], [a, X], [a, B], [b, B]], 1.6)],
    r: [4.2, (a, b) => seg(a, X, a, B) + poly([[a, XM], [a, X, 1.5], [b + 0.2, X]])],
    s: [5.0, (a, b) => poly([[b, X], [a, X, 1.2], [a, XM - 0.1, 1.0], [b, XM - 0.1, 1.0], [b, B, 1.2], [a, B]])],
    t: [4.4, (a, b) => poly([[a + 1.1, T + 1.0], [a + 1.1, B, 1.3], [b + 0.2, B]]) + seg(a, X, b, X)],
    u: [5.8, (a, b) => poly([[a, X], [a, B, 1.6], [b, B]]) + seg(b, X, b, B)],
    v: [5.8, (a, b, c) => poly([[a, X], [c, B], [b, X]])],
    w: [8.4, (a, b, c) => poly([[a, X], [a + 1.8, B], [c, X + 1.6], [b - 1.8, B], [b, X]])],
    x: [5.6, (a, b) => seg(a, X, b, B) + seg(b, X, a, B)],
    y: [5.8, (a, b) => poly([[a, X], [a, B, 1.6], [b, B]]) + poly([[b, X], [b, D, 1.4], [a + 0.2, D]])],
    z: [5.2, (a, b) => poly([[a, X], [b, X], [a, B], [b, B]])],
    0: [5.6, (a, b) => rr(a, T, b, B, 2.0)],
    1: [5.6, (a, b, c) => poly([[c - 1.5, T + 1.3], [c + 0.3, T], [c + 0.3, B]])],
    2: [5.6, (a, b) => poly([[a, T], [b, T, 1.5], [b, Mi, 1.2], [a, Mi, 1.2], [a, B, 0], [b, B]])],
    3: [5.6, (a, b) => poly([[a, T], [b, T, 1.5], [b, B, 1.5], [a, B]]) + seg(a + 1.3, Mi, b, Mi)],
    4: [5.6, (a, b) => poly([[b - 1.2, B], [b - 1.2, T], [a, B - 2.3], [b + 0.1, B - 2.3]])],
    5: [5.6, (a, b) => poly([[b, T], [a, T], [a, Mi - 0.2], [b, Mi - 0.2, 1.5], [b, B, 1.5], [a, B]])],
    6: [5.6, (a, b) => poly([[b - 0.2, T], [a, T, 1.8], [a, B, 1.6], [b, B, 1.5], [b, Mi, 1.3], [a, Mi]])],
    7: [5.6, (a, b, c) => poly([[a, T], [b, T, 0], [b, T + 1.0, 0.6], [c - 0.5, B]])],
    8: [5.6, (a, b) => rr(a + 0.3, T, b - 0.3, Mi, 1.3) + rr(a, Mi, b, B, 1.6)],
    9: [5.6, (a, b) => poly([[a + 0.2, B], [b, B, 1.6], [b, T, 1.8], [a, T, 1.5], [a, Mi, 1.3], [b, Mi]])],
    '/': [3.6, (a, b) => seg(a, B + 0.3, b, T)],
    "'": [1.3, (a) => seg(a, T, a, T + 1.8)],
    '’': [1.3, (a) => seg(a, T, a, T + 1.8)],
    '“': [3.2, (a, b) => seg(a + 0.35, T, a, T + 1.8) + seg(b + 0.35, T, b, T + 1.8)],
    '”': [3.2, (a, b) => seg(a, T, a - 0.35, T + 1.8) + seg(b, T, b - 0.35, T + 1.8)],
    '!': [1.3, (a) => seg(a, T, a, B - 2.4) + dot(a, B - 0.1)],
    '.': [1.3, (a) => dot(a, B - 0.1)],
    ',': [1.3, (a) => seg(a, B - 0.2, a, B + 1.0)],
    ':': [1.3, (a) => dot(a, X + 0.2) + dot(a, B - 0.1)],
    '-': [3.6, (a, b) => seg(a, XM, b, XM)],
    '?': [5.2, (a, b, c) => poly([[a, T], [b, T, 1.3], [b, Mi - 0.4, 1.0], [c, Mi - 0.4, 0.8], [c, B - 2.4]]) + dot(c, B - 0.1)],
  };
  const GAP = 1.25, SPACE = 3.0, DIGIT_ADV = 7.0; // digits are tabular: every digit takes 7.0 u
  const isDigit = (ch) => ch >= '0' && ch <= '9';
  // Lay out a string: [{ch, x (cell left), d (path at origin x)}], total advance.
  function layout(str, o = {}) {
    const gap = GAP + (o.track || 0), cell = o.cell || DIGIT_ADV;
    let x = 0; const out = [];
    for (const ch of str) {
      if (ch === ' ') { x += SPACE; continue; }
      const g = G[ch] || G['?'];
      const w = g[0], adv = isDigit(ch) ? cell : w + gap;
      const ox = isDigit(ch) ? x + (cell - w) / 2 : x;
      const a = ox + T, b = ox + w - T;
      out.push({ ch, d: g[1](a, b, (a + b) / 2) });
      x += adv;
    }
    const last = str[str.length - 1];
    return { glyphs: out, width: last && !isDigit(last) && last !== ' ' ? x - gap : x };
  }
  const width = (str, o) => layout(str, o).width;
  return { layout, width, GAP, DIGIT_ADV, SPACE, has: (ch) => ch === ' ' || ch in G };
})();

// One text run as an inline SVG. k = px per glyph unit. colors: one colour or one per glyph.
// Layers, back to front: outline (o.outline px), drop shadow (o.shadow px, down-right), fill.
function glyphSVG(str, k, o = {}) {
  const sw = o.stroke || 1.25, L = GL.layout(str, o);
  const padU = 2 + (o.outline || 0) / k + (o.shadow || 0) / k;
  const w = (L.width + 2 * padU) * k, h = (8 + 2 * padU + 2.6) * k;
  const cols = Array.isArray(o.color) ? o.color : null;
  const path = (g, i, col, wid) => `<path d="${g.d}" stroke="${col ?? (cols ? cols[i] : o.color || '#E7E7E7')}" stroke-width="${wid}"/>`;
  let s = '';
  if (o.outline) s += L.glyphs.map((g, i) => path(g, i, '#181818', sw + (2 * o.outline) / k)).join('');
  if (o.shadow) s += `<g transform="translate(${o.shadow / k} ${o.shadow / k})">${L.glyphs.map((g, i) => path(g, i, o.shadowColor || '#222222', sw)).join('')}</g>`;
  s += L.glyphs.map((g, i) => path(g, i, null, sw)).join('');
  return { svg: `<svg width="${w}" height="${h}" viewBox="${-padU} ${-padU} ${L.width + 2 * padU} ${8 + 2 * padU + 2.6}" ` +
    `fill="none" stroke-linecap="square" stroke-linejoin="miter" stroke-miterlimit="2" style="display:block;overflow:visible">${s}</svg>`,
    w, h, padPx: padU * k, width: L.width * k };
}
