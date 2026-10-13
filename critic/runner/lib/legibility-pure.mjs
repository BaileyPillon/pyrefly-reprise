// Critic instruments: the legibility sweep (CHK-003 and CHK-009), the page half and the judging half.
//
// Promoted from the round-25 chief's `sweep14.mjs` (critic/rounds/round-25/chief/, in the review's worktree) by lane r43-critic-tools, PR-0450 (b). Round 25's capture owner swept an
// 11 px floor, recorded no minimum and ran Chapter I only (`pause-matrix.mjs`); CHK-003's floor is 14 css px and it asks for the smallest and the count under it, on every screen of
// both games. The chief's sweep fixed all three; this is that sweep, kept in the library so the next review does not write a new one.
//
//   collectText()        runs IN THE PAGE (page.evaluate): every visible text element, its effective rendered size (font-size times the scale of every transform above it), whether it
//                        is clipped or ellipsised, and the page's width against its scroll width. It reads; it judges nothing.
//   judgeLegibility()    the numbers: how many text elements, the smallest, how many are under the floor (and the smallest dozen of them), which are cut off. Pure, held by
//                        tests/unit/critic-instruments-legibility.test.ts.
//   sweepSummary(), sweepReportLine()   one line per sweep for the report (PR-0450: "a next-round report line per instrument").
//
// Game case: both (shared critic plumbing). The floor is the same in FFX and FFX-2; which surfaces a sweep visits is the caller's (sweep.mjs).

/** CHK-003: nothing a player must read falls below this many css px, measured on the rendered size (transforms included). */
export const LEGIBILITY_FLOOR_PX = 14;

/** How many of the smallest offenders a surface keeps (the count of all of them is `underCount`). */
export const UNDER_KEPT = 14;

/**
 * Runs in the page. SELF-CONTAINED: `page.evaluate(collectText)` sends this function's source, so it may use only the browser's own globals
 * (`document`, `getComputedStyle`, `innerWidth`, `NodeFilter`, `DOMMatrix`) and nothing from this module.
 * The rules are the chief's, unchanged: one reading per element (the first text node under it), text only, skipping script and style, anything hidden
 * (visibility, display, an opacity under 0.05) and anything wholly off the viewport; the effective size multiplies in the scale of every transform from the element up to <body>.
 */
export function collectText() {
  const vw = innerWidth, vh = innerHeight;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  const items = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) continue;
    let scale = 1;
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const tr = getComputedStyle(a).transform;
      if (tr && tr !== 'none') { const m = new DOMMatrix(tr); scale *= Math.sqrt(m.a * m.a + m.b * m.b); }
    }
    const px = parseFloat(cs.fontSize) * scale;
    const wide = el.scrollWidth > el.clientWidth + 1;
    items.push({
      t: t.slice(0, 50), px, cls: (el.className || '').toString().slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth,
      clipped: wide && /hidden|clip/.test(cs.overflowX), ell: cs.textOverflow === 'ellipsis' && wide,
    });
  }
  return { vw, vh, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, items };
}

const round = (v, d) => { const k = 10 ** d; return Math.round(v * k) / k; };

/**
 * The numbers of one surface from what `collectText` read.
 * `min` is the smallest effective size of ANY text on the surface (null when nothing was read: a surface with no text is UNVERIFIED, not a pass).
 * @param {{ vw: number, vh: number, scrollW: number, clientW: number, items: Array<{ t: string, px: number, cls: string, sw: number, cw: number, clipped: boolean, ell: boolean }> }} raw
 * @param {number} [floor]
 */
export function judgeLegibility(raw, floor = LEGIBILITY_FLOOR_PX) {
  const items = (raw && raw.items) || [];
  const sized = items.filter((i) => Number.isFinite(i.px));
  const under = sized.filter((i) => i.px < floor).sort((a, b) => a.px - b.px);
  const cut = items.filter((i) => i.clipped || i.ell);
  return {
    floor,
    count: sized.length,
    min: sized.length ? round(Math.min(...sized.map((i) => i.px)), 2) : null,
    underCount: under.length,
    under: under.slice(0, UNDER_KEPT).map((i) => ({ text: i.t, px: round(i.px, 1), cls: i.cls })),
    truncatedCount: cut.length,
    truncated: cut.map((i) => ({ text: i.t, sw: i.sw, cw: i.cw, cls: i.cls })),
    scrollW: raw ? raw.scrollW : null, clientW: raw ? raw.clientW : null, vw: raw ? raw.vw : null, vh: raw ? raw.vh : null,
    hScroll: raw ? raw.scrollW > raw.clientW : null,
  };
}

/**
 * One sweep's totals, from its surfaces: `{ label, size, result }` with `result` a `judgeLegibility` answer or `{ unverified: reason }` for a surface the sweep could
 * not reach (a pause that did not open, a chapter that did not load). An unreached surface is counted and named; it is never a pass.
 */
export function sweepSummary(surfaces, floor = LEGIBILITY_FLOOR_PX) {
  const measured = surfaces.filter((s) => s.result && !s.result.unverified && s.result.count > 0);
  const unverified = surfaces.filter((s) => !measured.includes(s));
  const mins = measured.map((s) => s.result.min).filter((m) => m !== null);
  return {
    floor,
    surfaces: surfaces.length,
    measured: measured.length,
    unverified: unverified.map((s) => ({ label: s.label, size: s.size ?? null, why: s.result?.unverified ?? (s.result ? 'no text was read on it' : 'not measured') })),
    elements: measured.reduce((n, s) => n + s.result.count, 0),
    min: mins.length ? Math.min(...mins) : null,
    underCount: measured.reduce((n, s) => n + s.result.underCount, 0),
    surfacesUnder: measured.filter((s) => s.result.underCount > 0).map((s) => s.label),
    truncatedCount: measured.reduce((n, s) => n + s.result.truncatedCount, 0),
    surfacesTruncated: measured.filter((s) => s.result.truncatedCount > 0).map((s) => s.label),
    hScroll: measured.filter((s) => s.result.hScroll).map((s) => s.label),
  };
}

/** The line a report carries for a sweep: what was visited, the smallest text, the count under the floor, the cut-off names and what could not be reached. */
export function sweepReportLine(name, summary) {
  const n = (v) => Number(v).toLocaleString('en-US');
  const under = summary.underCount ? `${summary.underCount} under ${summary.floor} px on ${summary.surfacesUnder.length} surface(s) (${summary.surfacesUnder.slice(0, 4).join(', ')}${summary.surfacesUnder.length > 4 ? ', ...' : ''})` : `none under ${summary.floor} px`;
  const cut = summary.truncatedCount ? `${summary.truncatedCount} clipped or ellipsised on ${summary.surfacesTruncated.length} surface(s)` : 'none clipped or ellipsised';
  const bad = summary.unverified.length ? `; UNVERIFIED: ${summary.unverified.slice(0, 4).map((u) => `${u.label} (${u.why})`).join(', ')}${summary.unverified.length > 4 ? `, and ${summary.unverified.length - 4} more` : ''}` : '';
  const scroll = summary.hScroll.length ? `; page wider than the window on ${summary.hScroll.join(', ')}` : '';
  return `${name} (CHK-003/CHK-009, floor ${summary.floor} css px): ${summary.measured} of ${summary.surfaces} surfaces measured, ${n(summary.elements)} text elements, smallest ${summary.min === null ? 'not read' : `${summary.min} px`}, ${under}, ${cut}${scroll}${bad}`;
}
