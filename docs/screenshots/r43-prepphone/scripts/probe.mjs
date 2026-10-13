// The CHK-003 walk, as one function that runs inside the page (critic/CHECKS.md CHK-003, CHK-009).
//
// `page.evaluate(textFloorProbe, { floor: 14 })` walks every visible text node under the root and reports, for each
// element that owns text: its computed font-size, the scale its ancestors put on it (transform, the `scale` property
// and `zoom`, so a 640x360 stage drawn at 2.5x reads as the 2.5x it is), and so the EFFECTIVE css px the player
// reads. It also lists text boxes that overprint each other (the affinity chips of PR-0391) and text that is cut off
// by its own box. It has no closure: Playwright serialises it, so it must stay self-contained.
//
// The effective size is the one the critic's sweeps use (`font-size x ancestor scale`), except that a skew counts as
// 1 (the Ink & Gold slabs lean 8 to 12 degrees and counter-skew their text): the scale of one transform is
// sqrt(|det|), which is the scale for a pure scale, a rotation or a skew.

// Derived from tools/text-floor-probe.mjs (origin/r43-textfloor) with the `offscreen` option added.
export function textFloorProbe(arg) {
  const floor = (arg && arg.floor) || 14;
  const root = arg && arg.rootSel ? document.querySelector(arg.rootSel) : document.body;
  if (!root) return { error: 'no root' };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scaleCache = new Map();
  const opacityCache = new Map();

  const ownScale = (n) => {
    const cs = getComputedStyle(n);
    let s = 1;
    if (cs.transform && cs.transform !== 'none') {
      const m = new DOMMatrixReadOnly(cs.transform);
      s *= Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;
    }
    if (cs.scale && cs.scale !== 'none') {
      const p = cs.scale.split(/\s+/).map(Number);
      s *= Math.sqrt((p[0] || 1) * (p[1] !== undefined ? p[1] : p[0] || 1));
    }
    const z = parseFloat(cs.zoom);
    if (Number.isFinite(z) && z > 0 && z !== 1) s *= z;
    return s;
  };
  const scaleOf = (el) => {
    if (!el || el === document.documentElement) return 1;
    if (scaleCache.has(el)) return scaleCache.get(el);
    const v = ownScale(el) * scaleOf(el.parentElement);
    scaleCache.set(el, v);
    return v;
  };
  const opacityOf = (el) => {
    if (!el || el === document.documentElement) return 1;
    if (opacityCache.has(el)) return opacityCache.get(el);
    const v = (parseFloat(getComputedStyle(el).opacity) || 0) * opacityOf(el.parentElement);
    opacityCache.set(el, v);
    return v;
  };
  const label = (el) => {
    const parts = [];
    for (let n = el, i = 0; n && n !== document.body && i < 3; n = n.parentElement, i++) {
      const raw = typeof n.className === 'string' ? n.className : n.getAttribute('class') || '';
      const cls = raw.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
      parts.unshift(n.tagName.toLowerCase() + (cls ? '.' + cls : ''));
    }
    return parts.join(' > ');
  };
  const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

  // Group the text nodes by the element that owns them.
  const owners = new Map();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let tn = walker.nextNode(); tn; tn = walker.nextNode()) {
    const t = (tn.nodeValue || '').replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const el = tn.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE'].includes(el.tagName)) continue;
    const rec = owners.get(el) || { el, text: '', nodes: [] };
    rec.text += (rec.text ? ' ' : '') + t;
    rec.nodes.push(tn);
    owners.set(el, rec);
  }

  const items = [];
  const elOf = [];
  const clipped = [];
  // True when an ancestor that clips its overflow (a scrolling list, a masked well) hides the whole text box: the row is in the DOM but not on screen.
  const clippedAway = (el, x0, y0, x1, y1) => {
    for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      const r = n.getBoundingClientRect();
      if (x1 <= r.left + 1 || x0 >= r.right - 1 || y1 <= r.top + 1 || y0 >= r.bottom - 1) return true;
    }
    return false;
  };
  for (const { el, text, nodes } of owners.values()) {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (opacityOf(el) < 0.1) continue;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const tn of nodes) {
      const rg = document.createRange();
      rg.selectNodeContents(tn);
      for (const r of rg.getClientRects()) {
        if (r.width < 0.5 || r.height < 0.5) continue;
        x0 = Math.min(x0, r.left);
        y0 = Math.min(y0, r.top);
        x1 = Math.max(x1, r.right);
        y1 = Math.max(y1, r.bottom);
      }
    }
    if (!Number.isFinite(x0)) continue;
    if (!(arg && arg.offscreen) && (x1 <= 0 || y1 <= 0 || x0 >= vw || y0 >= vh)) continue; // wholly off the window (kept with offscreen: true)
    const fs = parseFloat(cs.fontSize);
    const scale = scaleOf(el);
    const cut = el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && (cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis');
    elOf.push(el);
    clipped.push(clippedAway(el, x0, y0, x1, y1));
    items.push({
      text: text.slice(0, 48),
      at: label(el),
      fs: round(fs),
      scale: round(scale, 4),
      eff: round(fs * scale),
      color: cs.color,
      rect: [round(x0, 1), round(y0, 1), round(x1 - x0, 1), round(y1 - y0, 1)],
      cut: cut || undefined,
      clipped: clipped[clipped.length - 1] || undefined,
    });
  }

  // Text boxes that overprint: two owners, neither inside the other, sharing more than a quarter of the smaller box.
  const overlaps = [];
  for (let a = 0; a < items.length; a++) {
    for (let b = a + 1; b < items.length; b++) {
      if (clipped[a] || clipped[b]) continue;
      if (elOf[a].contains(elOf[b]) || elOf[b].contains(elOf[a])) continue;
      const [ax, ay, aw, ah] = items[a].rect;
      const [bx, by, bw, bh] = items[b].rect;
      const w = Math.min(ax + aw, bx + bw) - Math.max(ax, bx);
      const h = Math.min(ay + ah, by + bh) - Math.max(ay, by);
      if (w <= 1 || h <= 1) continue;
      const share = (w * h) / Math.min(aw * ah, bw * bh);
      if (share > 0.25) overlaps.push({ a: items[a].text, b: items[b].text, at: items[a].at + ' | ' + items[b].at, share: round(share, 2) });
    }
  }

  const under = items.filter((i) => i.eff < floor - 0.05).sort((p, q) => p.eff - q.eff);
  return {
    viewport: vw + 'x' + vh,
    floor,
    nText: items.length,
    minEff: items.length ? Math.min(...items.map((i) => i.eff)) : null,
    underCount: under.length,
    under,
    overlaps,
    cut: items.filter((i) => i.cut),
    items: items.slice(0, 600),
  };
}
