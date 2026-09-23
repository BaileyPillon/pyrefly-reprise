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
const TRIGGER_INK = '#5C3F0A'; // --ffx-trigger-ink, ffx-hud.css

describe('PR-0018: the FFX trigger row label (TALK) clears 4.5:1 on both faces it can wear', () => {
  it('documents the round-09 failure this replaces (both under 3:1, one under 2:1)', () => {
    expect(contrast(OLD_TOKEN, GOLD)).toBeCloseTo(1.74, 1);
    expect(contrast(OLD_TOKEN, CREAM)).toBeCloseTo(2.87, 1);
  });

  it('clears 4.5:1 on the unselected cream row', () => {
    expect(contrast(TRIGGER_INK, CREAM)).toBeGreaterThanOrEqual(4.5);
  });

  it('clears 4.5:1 on the selected gold row', () => {
    expect(contrast(TRIGGER_INK, GOLD)).toBeGreaterThanOrEqual(4.5);
  });
});
