// @vitest-environment jsdom
/**
 * The dialogue card's portrait cut-in, measured rather than pattern-matched.
 *
 * FFX **and** FFX-2 (AGENTS.md rule 14 — `DialogueBox` is shared plumbing: one
 * card, one stylesheet, every chapter of both games; `critic/CHECKS.md` CHK-020
 * classes shared plumbing as "both"). The absence test for the other game is
 * the FFX-2 case at the foot of this file: the same numbers are asserted for a
 * chapter-4/5 speaker, so a fix that only held for the FFX roster would fail.
 *
 * The frame is a rectangle with `overflow: hidden` **and** `transform:
 * skewX(-12deg)`, so what it clips to is a parallelogram, and the `<img>`
 * inside counter-skews to stand upright. Those two facts together are the whole
 * defect PR-0020 keeps coming back on: an upright rectangle the size of the
 * frame cannot cover a parallelogram of the same width, so wedges of the
 * frame's own dark gradient stay visible beside the painting.
 *
 * jsdom has no layout, so the check below resolves the two rules out of
 * `dialogue-box.css` itself and does the geometry in numbers. It is a real
 * oracle, not a string match: it is run against the rule that shipped before
 * this file existed as well, and refuses it.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const CSS_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/common/dialogue-box.css');
const CSS = readFileSync(CSS_PATH, 'utf8');

/** tan(12deg) — the horizontal run the -12deg skew takes over one unit of height. */
const TAN12 = Math.tan((12 * Math.PI) / 180);

// ------------------------------------------------------------- CSS resolving

/** The declarations of one rule, last-wins, from a slice of stylesheet text. */
function declsOf(css: string, selector: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g');
  for (let m = re.exec(css); m; m = re.exec(css)) {
    for (const decl of m[1]!.split(';')) {
      const at = decl.indexOf(':');
      if (at > 0) out[decl.slice(0, at).trim()] = decl.slice(at + 1).trim();
    }
  }
  return out;
}

/**
 * The stylesheet, comments stripped, split into the desktop rules and the
 * `max-width: 560px` block. The comments go first because the stylesheet
 * annotates its declarations inline with the mockup's pixel value, and a
 * comment sitting between two semicolons would otherwise be read as part of
 * the next property name.
 */
function regions(raw: string): { desktop: string; phone: string } {
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  const at = css.indexOf('@media (max-width: 560px)');
  if (at < 0) throw new Error('the phone breakpoint is gone');
  const open = css.indexOf('{', at);
  return { desktop: css.slice(0, at), phone: css.slice(open + 1) };
}

interface Ctx {
  /** Viewport width in px, for `vw`. */
  vw: number;
  /** The percentage basis (the frame's own width), for `100%`. */
  pct: number;
  vars: Record<string, string>;
}

/**
 * One CSS length in px. Handles what these two rules actually use: `vw`, `px`,
 * `%`, bare multipliers, `var()` and a two-operand `calc()`.
 */
function len(expr: string, ctx: Ctx): number {
  const s = expr.trim();
  const calc = /^calc\((.*)\)$/s.exec(s);
  if (calc) {
    const m = /^(.+?)\s([*+-])\s(.+)$/s.exec(calc[1]!);
    if (!m) return len(calc[1]!, ctx);
    const a = len(m[1]!, ctx);
    const b = len(m[3]!, ctx);
    return m[2] === '*' ? a * b : m[2] === '+' ? a + b : a - b;
  }
  const v = /^var\(\s*(--[\w-]+)\s*\)$/.exec(s);
  if (v) {
    const raw = ctx.vars[v[1]!];
    if (raw === undefined) throw new Error(`no value for ${v[1]}`);
    return len(raw, ctx);
  }
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) throw new Error(`cannot resolve "${expr}"`);
  if (s.endsWith('vw')) return (n * ctx.vw) / 100;
  if (s.endsWith('%')) return (n * ctx.pct) / 100;
  return n; // px, or a bare multiplier inside a calc()
}

// ---------------------------------------------------------------- the oracle

interface Slot {
  /** The frame's own (pre-skew) width and height, px. */
  w: number;
  h: number;
  /** The `<img>`'s box inside it, px. */
  imgLeft: number;
  imgW: number;
  /** How far the biggest wedge of bare frame reaches, px. 0 = fully covered. */
  worstGap: number;
}

/**
 * Resolve the frame and its `<img>` at one viewport width and measure the
 * coverage.
 *
 * In the frame's own coordinates the clip is `[0, w]` at every row. The
 * `<img>`'s `skewX(12deg)` about the shared centre slides its span by
 * `tan12 * (y - h/2)`, so the extremes are the top and bottom rows; anything
 * the span fails to reach there is frame gradient showing through.
 */
function measure(css: string, viewport: number, phone: boolean): Slot {
  const { desktop, phone: phoneCss } = regions(css);
  const frame = { ...declsOf(desktop, '.dbox__portrait'), ...(phone ? declsOf(phoneCss, '.dbox__portrait') : {}) };
  const img = { ...declsOf(desktop, '.dbox__portrait img'), ...(phone ? declsOf(phoneCss, '.dbox__portrait img') : {}) };

  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(frame)) if (k.startsWith('--')) vars[k] = v;
  const base: Omit<Ctx, 'pct'> = { vw: viewport, vars };

  const w = len(frame['width']!, { ...base, pct: 0 });
  const h = len(frame['height']!, { ...base, pct: 0 });
  const ctx: Ctx = { ...base, pct: w };
  // `inset: 0` is the shorthand the pre-fix rule used for left/top/right/bottom.
  const imgLeft = len(img['left'] ?? img['inset'] ?? '0', ctx);
  const imgW = len(img['width']!, ctx);

  let worstGap = 0;
  for (const y of [0, h / 2, h]) {
    const shift = TAN12 * (y - h / 2);
    worstGap = Math.max(worstGap, imgLeft + shift - 0, w - (imgLeft + imgW + shift));
  }
  return { w, h, imgLeft, imgW, worstGap: Math.max(0, worstGap) };
}

// -------------------------------------------------------------------- tests

describe('the portrait covers its leaning frame at every size (critic PR-0020)', () => {
  it('leaves no wedge of the frame bare at 1600x900 — the size the defect was measured at', () => {
    const slot = measure(CSS, 1600, false);
    // The 15.28vw x 20.83vw frame, and the bounding box of its parallelogram.
    expect(slot.w).toBeCloseTo(244.48, 1);
    expect(slot.h).toBeCloseTo(333.28, 1);
    expect(slot.imgW).toBeCloseTo(slot.w + TAN12 * slot.h, 0);
    expect(slot.imgLeft).toBeCloseTo((-TAN12 * slot.h) / 2, 0);
    expect(slot.worstGap).toBeLessThan(0.5);
  });

  it('leaves no wedge bare at the desktop sizes the verifier sampled either', () => {
    for (const vw of [1280, 1920, 2000, 2560]) {
      expect(measure(CSS, vw, false).worstGap).toBeLessThan(0.5);
    }
  });

  it('leaves no wedge bare at phone width, where the frame is fixed px', () => {
    const slot = measure(CSS, 390, true);
    expect(slot.w).toBeCloseTo(62, 3);
    expect(slot.h).toBeCloseTo(82, 3);
    expect(slot.worstGap).toBeLessThan(0.5);
  });

  it('derives the phone shear from the phone height, so the two cannot drift apart', () => {
    // The phone block overrides the height only; `--dbox-shear` is computed
    // from it, so nothing has to be kept in step by hand.
    const { phone } = regions(CSS);
    const frame = declsOf(phone, '.dbox__portrait');
    expect(frame['--dbox-portrait-h']).toBe('82px');
    expect(frame['height']).toBeUndefined();
    expect(declsOf(phone, '.dbox__portrait img')['width']).toBeUndefined();
  });

  it('keeps the painting upright: the frame skews -12deg, the <img> +12deg about the same centre', () => {
    expect(CSS).toMatch(/\.dbox__portrait \{[^}]*transform: skewX\(-12deg\)/s);
    expect(CSS).toMatch(/\.dbox__portrait img \{[^}]*transform: skewX\(12deg\)/s);
    // Centres coincide only while the <img> is inset by exactly half the shear
    // on the left and nothing on the top; a `bottom`/`right` here would move it.
    const img = declsOf(regions(CSS).desktop, '.dbox__portrait img');
    expect(img['top']).toBe('0');
    expect(img['height']).toBe('100%');
    expect(img['object-fit']).toBe('cover');
  });

  it('gives the frame no fill of its own, so a cut-out painting has no grey to leave behind', () => {
    // Every portrait in `public/art/portraits/` is a figure on an alpha canvas,
    // so a backing plate on the frame is visible in exactly the corners the
    // figure does not reach — measured at 1600x900 on chapter 4 as a constant
    // 113,112,112 for 47px across the row under Rikku's braid. There is nothing
    // to show through now; a transparent corner shows the ivory slab.
    const frame = declsOf(regions(CSS).desktop, '.dbox__portrait');
    expect(frame['background']).toBeUndefined();
    expect(frame['background-color']).toBeUndefined();
    expect(frame['background-image']).toBeUndefined();
    expect(declsOf(regions(CSS).phone, '.dbox__portrait')['background']).toBeUndefined();
    // The cut-in still casts its shadow onto the card.
    expect(frame['box-shadow']).toBeDefined();
  });

  // ------------------------------------------------ the oracle discriminates

  it('refuses the rule that shipped before this test: frame-sized <img>, two wedges', () => {
    const shipped = CSS.replace(
      /\.dbox__portrait img \{[^}]*\}/s,
      `.dbox__portrait img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: skewX(12deg);
  display: block;
}`,
    );
    const slot = measure(shipped, 1600, false);
    // Half the shear at the top row and again at the bottom: the 35px column
    // the verifier measured from x=102 to x=131 on chapter 2 and 4.
    expect(slot.worstGap).toBeCloseTo((TAN12 * slot.h) / 2, 0);
    expect(slot.worstGap).toBeGreaterThan(34);
    expect(measure(shipped, 390, true).worstGap).toBeGreaterThan(8);
  });

  it('refuses the rule before that one too, for the opposite reason it was replaced', () => {
    // 20.83vw wide at a fixed -2.78vw: wide enough to cover, but pinned to the
    // viewport rather than to this frame, which is how it overhung on one size
    // and under-reached on another. Coverage is not the whole contract — the
    // width has to be the frame's own, which the assertions above check.
    const old = CSS.replace(
      /\.dbox__portrait img \{[^}]*\}/s,
      '.dbox__portrait img {\n  position: absolute;\n  left: -2.78vw;\n  top: 0;\n  width: 20.83vw;\n  height: 100%;\n  display: block;\n}',
    );
    const slot = measure(old, 1600, false);
    expect(slot.imgW).toBeGreaterThan(slot.w + TAN12 * slot.h + 10); // overhangs
    // and the phone block, which never overrode it, is far too wide for a 62px frame
    expect(measure(old, 390, true).imgW).toBeGreaterThan(70);
  });
});
