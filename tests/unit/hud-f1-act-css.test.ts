import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HUD_F1_TUNE } from '../../src/ui/hudf1/HudF1Switch.ts';

/**
 * The look of the F1 step-back (`hudf1-act.css`, lane "hud-f1", decision 192): the CSS carries the same numbers as `HUD_F1_TUNE` (out 160 to 180 ms ease-in, back 220 ms), every piece that slides has a
 * REDUCE MOTION twin that fades (the game's own row, `html[data-reduce-motion]`, and the OS preference), and what the mockup says STAYS (the boss ribbon, the turn strip) is not moved by `f1-acting`.
 */
const DIR = join(__dirname, '../../src/ui/hudf1');
const act = readFileSync(join(DIR, 'hudf1-act.css'), 'utf8');
const shared = readFileSync(join(DIR, 'hudf1.css'), 'utf8');

describe('the numbers', () => {
  it('slides out in the tuned time (the ghost, the prompt bar) and back in the tuned time (the real block, the cards)', () => {
    expect(shared).toMatch(new RegExp(`\\.f1-ghost \\{[^}]*transform ${HUD_F1_TUNE.slideOutMs}ms cubic-bezier\\(0\\.5, 0, 0\\.9, 0\\.4\\)`));
    expect(act).toMatch(new RegExp(`\\.f1-acting \\.f1-prompts \\{[^}]*transform ${HUD_F1_TUNE.slideOutMs}ms cubic-bezier\\(0\\.5, 0, 0\\.9, 0\\.4\\)`));
    expect(act).toMatch(new RegExp(`transition: transform ${HUD_F1_TUNE.slideBackMs}ms cubic-bezier\\(0\\.16, 0\\.84, 0\\.3, 1\\)`));
    expect(HUD_F1_TUNE.slideOutMs).toBeGreaterThanOrEqual(160);
    expect(HUD_F1_TUNE.slideOutMs).toBeLessThanOrEqual(180);
  });
});

describe('REDUCE MOTION fades instead of sliding', () => {
  it('has the game\'s own row and the OS preference, and neither leaves a transform on a slid piece', () => {
    expect(act).toMatch(/html\[data-reduce-motion\] \.hud-f1 \.f1-ghost--out/);
    expect(act).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    const rm = act.slice(act.indexOf('REDUCE MOTION'));
    expect(rm).toMatch(/\.f1-ghost--out[^{]*\{ transform: none; \}/);
    expect(rm).toMatch(/f1-acting \.f1-prompts \{ transform: skewX\(var\(--ig-skew\)\)/); // no translateY, only the slant
    expect(rm).toMatch(/opacity/);
  });
});

describe('the slim cards have an off switch for their height transition (HUD_F1_TUNE.slimAnimates; review: the step-back frame cost is unproven)', () => {
  it('f1-slim-snap drops every height transition on a card, and the tune defaults to animating', () => {
    expect(HUD_F1_TUNE.slimAnimates).toBe(true);
    expect(act).toMatch(/\.hud-f1\.f1-slim-snap \.ig-stat[^{]*\{ transition: opacity 0\.2s ease !important; \}/);
  });
});

describe('what stays', () => {
  it('the ribbon moves only when the provisional choice says so, and the turn strip and the cards\' rows are never slid', () => {
    expect(act).toMatch(/\.f1-ribbon-hides\.f1-acting \.f1-ribbon/);
    expect(act).not.toMatch(/f1-acting[^{]*\.ig-ctb[^{]*\{[^}]*(transform|opacity)/);
    expect(act).not.toMatch(/f1-acting[^{]*\.ig-stat-list[^{]*\{[^}]*transform/);
  });
  it('the slim cards drop the bar and the /max numbers in both games', () => {
    expect(act).toMatch(/\.ffxhud\.hud-f1\.f1-acting \.ig-stat__od/);
    expect(act).toMatch(/\.ffx2hud\.hud-f1\.f1-acting \.ig-stat__od/);
    expect(act).toMatch(/f1-acting \.ig-stat__value small/);
  });
});
