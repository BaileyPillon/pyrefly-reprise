/**
 * PREP-A, the four colour shades of the phone Party Prep (branch r46-prepshades; Bailey, 2026-10-13: option B of the shade sheet,
 * "I recommend B for all four" / "I'll go with all your recommendations").
 *
 * Game case: **both** (shared interface chrome, one stylesheet). The gold note shade shows in FFX chapters, the raspberry bag counts
 * in FFX-2 chapters, and the up and down counts exist only in FFX-2's Stats view; the three tokens are Ink & Gold tokens, so
 * `.ig--ffx2` repoints the one that has a pink twin and leaves the other two alone.
 *
 * The page the lane was built from drew four shades the tokens then lacked; r43 (commit 98bcc847) mapped them to the nearest tokens
 * (3.37:1 and 4.49:1 on the ivory, ivory counts). This file pins the shades Bailey chose, read from the sheets themselves:
 *   1. the small gold accent text on ivory (the "+10% dmg" notes)    #7f5c0a  5.41:1  (was #a67c16, 3.37:1)
 *   2. the small pink accent text on ivory (the FFX-2 bag counts)    #9c3267  6.07:1  (was #b8437e, 4.49:1)
 *   3. the UP count on a dark dressphere plate                       #7fd09a  10.75:1 (was ivory)
 *   4. the DOWN count on the same plates                             #f08a8a  8.21:1  (was ivory)
 * The live pixels are measured in a browser (docs/screenshots/r46-prepshades/); this is the stylesheet half.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p: string): string => readFileSync(join(ROOT, p), 'utf8');
const strip = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

const TOKENS = strip(read('src/ui/inkgold/tokens.css'));
const SECTIONS = strip(read('src/ui/common/prep-phone-sections.css'));
const PARTS = strip(read('src/ui/common/prep-phone-parts.css'));
const TABS = strip(read('src/ui/common/party-prep-phone-tabs.css'));

/** The text between `selector {` and the next `}` (the first rule with exactly that selector, whitespace-normalised). */
function rule(css: string, selector: string): string {
  const esc = selector.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const m = new RegExp(`(?:^|[{}])\\s*${esc}\\s*\\{([^{}]*)\\}`).exec(css);
  expect(m, `no rule for ${selector}`).not.toBeNull();
  return m![1]!;
}

const baseTokens = rule(TOKENS, '.ig');
const ffx2Tokens = rule(TOKENS, '.ig--ffx2');

function decl(block: string, prop: string): string | null {
  const m = new RegExp(`(?:^|[;\\s])${prop.replace(/[-]/g, '\\-')}\\s*:\\s*([^;]+);`).exec(block);
  return m ? m[1]!.trim() : null;
}

function rgb(hex: string): [number, number, number] {
  expect(hex, 'a 6-digit hex').toMatch(/^#[0-9a-f]{6}$/i);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}
function lum([r, g, b]: [number, number, number]): number {
  const c = [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (hi! + 0.05) / (lo! + 0.05);
}
/** `rgba(r, g, b, a)` laid over an opaque ground, rounded the way a compositor stores 8 bits per channel. */
function over(rgba: string, ground: [number, number, number]): [number, number, number] {
  const m = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/.exec(rgba.trim());
  expect(m, `rgba() expected, got ${rgba}`).not.toBeNull();
  const a = Number(m![4]);
  return [1, 2, 3].map((i, k) => Math.round(Number(m![i]) * a + ground[k]! * (1 - a))) as [number, number, number];
}

/** What each token is, per game: FFX reads the `.ig` block, FFX-2 the `.ig--ffx2` block first and `.ig` for everything it leaves alone. */
const tokenIn = (game: 'ffx' | 'ffx2', name: string): string => {
  const v = (game === 'ffx2' ? decl(ffx2Tokens, name) : null) ?? decl(baseTokens, name);
  expect(v, `${name} (${game})`).not.toBeNull();
  return v!;
};

describe('the three tokens', () => {
  it('are additive Ink & Gold tokens with the sheet\'s values', () => {
    expect(decl(baseTokens, '--ig-accent-text-on-paper')).toBe('#7f5c0a');
    expect(decl(baseTokens, '--ig-gain-on-ink')).toBe('#7fd09a');
    expect(decl(baseTokens, '--ig-loss-on-ink')).toBe('#f08a8a');
  });

  it('.ig--ffx2 repoints the on-paper accent text to the raspberry and leaves gain and loss alone', () => {
    expect(decl(ffx2Tokens, '--ig-accent-text-on-paper')).toBe('#9c3267');
    expect(decl(ffx2Tokens, '--ig-gain-on-ink')).toBeNull();
    expect(decl(ffx2Tokens, '--ig-loss-on-ink')).toBeNull();
  });

  it('do not move the older roles: --ig-accent-deep and --ig-accent-on-paper keep the shades other screens print in', () => {
    expect(decl(baseTokens, '--ig-accent-deep')).toBe('#a67c16');
    expect(decl(baseTokens, '--ig-accent-on-paper')).toBe('var(--ig-gold-on-paper)');
    expect(decl(baseTokens, '--ig-gold-on-paper')).toBe('#b8862a');
    expect(decl(ffx2Tokens, '--ig-accent-on-paper')).toBe('#b8437e');
    expect(decl(ffx2Tokens, '--ig-accent-deep')).toBe('var(--ig-accent-on-paper)');
  });
});

describe('the phone page reads them, and nothing else changed in how it reads colour', () => {
  const host = rule(SECTIONS, ".prep[data-phone='page'] .prph");

  it('maps the three page variables to the tokens (no literal, and no longer --ig-accent-deep or ivory)', () => {
    expect(decl(host, '--prph-acc-text')).toBe('var(--ig-accent-text-on-paper)');
    expect(decl(host, '--prph-good')).toBe('var(--ig-gain-on-ink)');
    expect(decl(host, '--prph-bad')).toBe('var(--ig-loss-on-ink)');
  });

  it('keeps the ivory-body deltas on their two shipped literals', () => {
    expect(decl(host, '--prph-up')).toBe('#2f7a46');
    expect(decl(host, '--prph-down')).toBe('#a5323a');
  });

  it('has no per-game override of the variables: the tokens carry FFX gold and FFX-2 pink', () => {
    expect(SECTIONS).not.toMatch(/ig--ffx2[^{]*\.prph\s*\{[^}]*--prph-/);
    expect(SECTIONS + PARTS).not.toMatch(/#7f5c0a|#9c3267|#7fd09a|#f08a8a/i);
  });

  it('feeds exactly the four elements the sheet measured', () => {
    expect(decl(rule(SECTIONS, ".prep[data-phone='page'] .prph-bonus"), 'color')).toBe('var(--prph-acc-text)');
    expect(decl(rule(PARTS, ".prep[data-phone='page'] .prph-item__qty"), 'color')).toBe('var(--prph-acc-text)');
    expect(decl(rule(SECTIONS, ".prep[data-phone='page'] .prph-ud__up"), 'color')).toBe('var(--prph-good)');
    expect(decl(rule(SECTIONS, ".prep[data-phone='page'] .prph-ud__dn"), 'color')).toBe('var(--prph-bad)');
  });

  it('puts a triangle in front of each count, so direction never depends on the colour alone', () => {
    const views = read('src/ui/ffx2/party-prep/phoneViews.ts');
    expect(views).toContain('<span class="prph-ud__up">&#9650;${up}</span>');
    expect(views).toContain('<span class="prph-ud__dn">&#9660;${down}</span>');
  });
});

describe('contrast against each shade\'s real background', () => {
  const paper = tokenIn('ffx', '--ig-paper');
  // The ivory body of an open section.
  const body = rule(SECTIONS, ".prep[data-phone='page'] .prph-sec__b");
  // The plate behind the head's counts: `--ig-ink-panel` over the page's own opaque ground.
  const head = rule(SECTIONS, ".prep[data-phone='page'] .prph-sec__h");
  const pageGround = decl(rule(TABS, ".prep[data-phone='page']"), 'background');
  const plate = over(tokenIn('ffx', '--ig-ink-panel'), rgb(pageGround ?? ''));

  it('the backgrounds are the ones measured on the live build', () => {
    expect(decl(body, 'background')).toBe('var(--ig-paper)');
    expect(paper).toBe('#f4f1e8');
    expect(decl(head, 'background')).toBe('var(--ig-ink-panel)');
    expect(pageGround).toBe('#04060b');
    expect(plate).toEqual(rgb('#0a0911'));
  });

  it('1. the gold note on ivory: 5.41:1, at least 4.5:1 (small text)', () => {
    const c = contrast(rgb(tokenIn('ffx', '--ig-accent-text-on-paper')), rgb(paper));
    expect(c).toBeGreaterThanOrEqual(4.5);
    expect(c.toFixed(2)).toBe('5.41');
  });

  it('2. the pink bag count on ivory: 6.07:1, at least 4.5:1', () => {
    const c = contrast(rgb(tokenIn('ffx2', '--ig-accent-text-on-paper')), rgb(paper));
    expect(c).toBeGreaterThanOrEqual(4.5);
    expect(c.toFixed(2)).toBe('6.07');
  });

  it('3. the UP count on the dark plate: 10.75:1, at least 7:1', () => {
    const c = contrast(rgb(tokenIn('ffx2', '--ig-gain-on-ink')), plate);
    expect(c).toBeGreaterThanOrEqual(7);
    expect(c.toFixed(2)).toBe('10.75');
  });

  it('4. the DOWN count on the dark plate: 8.21:1, at least 7:1', () => {
    const c = contrast(rgb(tokenIn('ffx2', '--ig-loss-on-ink')), plate);
    expect(c).toBeGreaterThanOrEqual(7);
    expect(c.toFixed(2)).toBe('8.21');
  });

  it('the shades it replaced would not have cleared the bar the gold one now clears (the reason for the change)', () => {
    expect(contrast(rgb(tokenIn('ffx', '--ig-accent-deep')), rgb(paper))).toBeLessThan(4.5);
  });
});
