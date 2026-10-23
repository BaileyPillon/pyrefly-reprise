import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * r63-play (FFX-2 only; the F1 HUD): the command window's fourth row ran over the first party card in a list with a title (SKILL > White Magic). The window is a fixed box with a sticky title; the title pushes the
 * rows down by about 17 grid px, so the rule gives such a list three rows and a shorter box. The numbers are measured in the real Chapter IV run at 2560 x 1440 (grid px are the stage's 640 x 360, 4 px each):
 * the box starts at 146, the first party card at 251 (1004 px), the top level's fourth row ends at 250.5.
 */
const css = readFileSync('src/ui/hudf1/hudf1-ffx2.css', 'utf8');
const BOX_TOP = 146;
const CARD_TOP = 251;

describe('the F1 FFX-2 command window', () => {
  it('keeps four rows at the top level (114 grid px) and ends a list with a title above the first party card', () => {
    const top = /\.ffx2hud\.hud-f1 \.ffx2hud__command \{[^}]*max-height: (\d+)px/.exec(css);
    expect(top, 'the base window rule').not.toBeNull();
    expect(Number(top![1])).toBe(114);
    const titled = /\.ffx2hud\.hud-f1 \.ffx2hud__command:has\(\.ffx2cmd__title\) \{ max-height: (\d+)px; scroll-padding-top: (\d+)px; \}/.exec(css);
    expect(titled, 'the titled-list rule').not.toBeNull();
    const h = Number(titled![1]);
    expect(Number(titled![2]), 'rows come into view below the 52 px (13 grid) sticky title and its 6 px padding').toBeGreaterThanOrEqual(19);
    expect(h).toBeLessThan(114);
    expect(BOX_TOP + h).toBeLessThan(CARD_TOP); // the box (and everything it clips to) ends above the first party card
    // three rows (22 grid px, 3.5 gap) after the 6 px padding and the title's roughly 17.5 px still fit in it; a fourth does not start inside it
    const thirdRowEnd = 6 + 17.5 + 3 * 22 + 2 * 3.5;
    const fourthRowTop = thirdRowEnd + 3.5;
    expect(thirdRowEnd).toBeLessThanOrEqual(h + 1);
    expect(fourthRowTop).toBeGreaterThanOrEqual(h);
  });

  it('is scoped to FFX-2 and the F1 HUD (every selector starts with .ffx2hud.hud-f1)', () => {
    const rule = css.split('\n').find((l) => l.includes(':has(.ffx2cmd__title)'))!;
    expect(rule.startsWith('.ffx2hud.hud-f1 ')).toBe(true);
  });
});
