import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * PR-0018 (round 09, both games — this file covers FFX's half, the one the
 * round measured; `ffx2cmd__grants` already swaps to `--ig-accent` on
 * selected/overdrive so FFX-2's own tracked label never wears this token).
 *
 * Round 09 measured the trigger row's label (`.ffx-cmd--trigger > .ffx-
 * cmd__label`, TALK in Chapter 3) at `rgb(184,134,42)` (`--ig-gold-on-paper`,
 * #B8862A): 1.74:1 on the selected gold face (`--ig-accent`, #E3B94A) and
 * 2.87:1 on the unselected cream face (`--ig-paper`, #F4F1E8) — both under
 * the 4.5:1 floor. The fix gives the row its own darker mark
 * (`--ffx-trigger-ink`, `ffx-hud.css`) rather than reusing the shared
 * `--ig-gold-on-paper` token (which other, non-command-row surfaces may still
 * use correctly at a large-text size).
 *
 * This is a WCAG contrast sweep in Node, not a browser measurement — the same
 * kind of check `tests/unit/pause-remake-css.test.ts` and the round's own
 * `talk-contrast` capture already use, and it is exact for a solid colour on
 * a solid colour (no gradients or alpha involved in either face).
 */

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** WCAG 2.x contrast ratio between two opaque sRGB colours. */
function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const CREAM = '#F4F1E8'; // --ig-paper, the unselected row face
const GOLD = '#E3B94A'; // --ig-accent / --ig-gold, the selected row face
const OLD_TOKEN = '#B8862A'; // --ig-gold-on-paper, the token this row used to wear
// Round 09's `#5C3F0A` cleared 4.5:1 on paper but still measured 3.76:1 live
// (round 10, under `.ig-surface__vignette`'s corner darkening) — not enough
// margin. Round 10 darkens the mark further and, per the verifier's own
// complaint that a hard-coded copy of the value "would pass with reverting
// the CSS", reads it from `ffx-hud.css` itself instead of restating it here.
const CSS_PATH = fileURLToPath(new URL('../../src/ui/ffx/ffx-hud.css', import.meta.url));
const CSS = readFileSync(CSS_PATH, 'utf8');

function cssVarFallback(name: string, source: string): string {
  const m = source.match(new RegExp(`var\\(--${name},\\s*(#[0-9a-fA-F]{6})\\)`));
  if (!m) throw new Error(`${name} fallback not found in ffx-hud.css`);
  return m[1]!;
}

const TRIGGER_INK = cssVarFallback('ffx-trigger-ink', CSS);

/** The disabled-row treatment (round 10): a flat, opaque face independent of `slabs.css`'s opacity blend. */
function cssDecl(selector: string, prop: string, source: string): string {
  const rule = source.match(new RegExp(`${selector.replace(/[.#]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
  if (!rule) throw new Error(`selector ${selector} not found in ffx-hud.css`);
  const decl = rule[1]!.match(new RegExp(`${prop}:\\s*(#[0-9a-fA-F]{6})`));
  if (!decl) throw new Error(`${prop} not found in ${selector}`);
  return decl[1]!;
}

const DISABLED_BG = cssDecl('.ffxhud .ig-cmd--disabled', 'background', CSS);
const DISABLED_TEXT = cssDecl('.ffxhud .ig-cmd--disabled', 'color', CSS);

describe('PR-0018: the FFX trigger row label (TALK) clears 4.5:1 on both faces it can wear', () => {
  it('documents the round-09 failure this replaces (both under 3:1, one under 2:1)', () => {
    expect(contrast(OLD_TOKEN, GOLD)).toBeCloseTo(1.74, 1);
    expect(contrast(OLD_TOKEN, CREAM)).toBeCloseTo(2.87, 1);
  });

  it('clears 4.5:1 on the unselected cream row, read from ffx-hud.css', () => {
    expect(contrast(TRIGGER_INK, CREAM)).toBeGreaterThanOrEqual(4.5);
  });

  it('clears 4.5:1 on the selected gold row, read from ffx-hud.css', () => {
    expect(contrast(TRIGGER_INK, GOLD)).toBeGreaterThanOrEqual(4.5);
  });

  it('round 09 documents this row still short live (3.76:1) — this token is deliberately darker than the 4.5 floor needs, for margin', () => {
    expect(contrast(TRIGGER_INK, GOLD)).toBeGreaterThan(4.5 + 1);
  });
});

describe('PR-0018: a disabled FFX command row is opaque and clears 4.5:1, independent of what is painted behind it', () => {
  it('the disabled face/text pair, read from ffx-hud.css, clears 4.5:1', () => {
    expect(contrast(DISABLED_BG, DISABLED_TEXT)).toBeGreaterThanOrEqual(4.5);
  });

  it('documents the round-09/10 failure this replaces (`.ig-cmd--disabled`\'s opacity blend measured 1.98-2.44:1 live)', () => {
    // Not a live measurement (that needs a GPU browser) — this pins the
    // shared rule's own opacity, which is what caused the blend, so a
    // silent bump back to it is caught here too.
    expect(CSS).toMatch(/\.ffxhud \.ig-cmd--disabled \{[^}]*opacity:\s*1;/);
  });
});
