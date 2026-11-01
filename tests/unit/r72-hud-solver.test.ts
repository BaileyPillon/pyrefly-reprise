/**
 * THE ADVISOR'S SOLVER IN CHAPTERS IX AND XII (lane r72-hud, 2026-11-01; FFX ONLY, rule 14: FFX-2's HUD never reaches this solver): the real `tipZone` and the advisor chain, run on boards rebuilt from the r71 browser reads (`helpers/r72HudBoards.ts`),
 * with and without the F1 boss ribbon as an obstacle (`hudAvoidSelectors.f1RibbonEls`). The first half of this lane's proof is `r72-hud-layout.test.ts` (the stylesheets and the DOM); the browser read is `docs/handoff/r72-hud.md` jobs HUD-3 to HUD-5.
 *
 * The boards are a model of the browser: the cast's painted silhouettes grown 4 and 8 grid px (the HUD's sprite estimates were not available offline), so what is asserted is what holds on ANY board: the answer is a tip or a card, it stands clear of every box the solver
 * was given by the `GAP` it keeps, and with the ribbon known it never stands on the ribbon, the gauge or the strip.
 */
import { describe, expect, it } from 'vitest';
import { advisorZone as chain } from '../../src/ui/ffx/advisorStrip.ts';
import { tipZone } from '../../src/ui/ffx/advisorTip.ts';
import { ADVISOR_CHIP_RESERVE, GAP, STAGE, type Rect } from '../../src/ui/ffx/hudSafeZones.ts';
import { BOARDS, apart, badge, bar, chOf, everything, hits, inputOf, slideOf, tsOf } from './helpers/r72HudBoards.ts';

const R = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });

describe('Chapter IX (FFX only): the tip, solved against the ribbon and not slid, never stands on the Zanmato gauge', () => {
  const IX_TARGET = Object.keys(BOARDS).filter((k) => chOf(k) === 'IX' && k.endsWith('intel+target'));
  const IX_ALL = Object.keys(BOARDS).filter((k) => chOf(k) === 'IX');

  it('REPRODUCES r71: without the ribbon the solver stands the bar left of the gauge (x 36 to 212) and the stylesheet\'s 166 (190 at 115) slide puts it across the gauge (r71: 634 x 53 px at 2560 x 1440), at every window and TEXT SIZE', () => {
    for (const key of IX_TARGET) {
      const z = tipZone(inputOf(key, false));
      expect(z, key).not.toBeNull();
      expect(z!.left, key).toBeCloseTo(35.9, 1);
      const gauge = BOARDS[key]!.ink[0]!;
      expect(hits(bar(z!, 0), gauge), `${key}: unslid`).toBe(false);
      expect(hits(bar(z!, slideOf(tsOf(key))), gauge), `${key}: slid`).toBe(true);
    }
    // the first menu with the card (no target cursor) was never the defect: 0 overlaps in the r71 reads, and the chain places the designed card on the right
    for (const key of IX_ALL.filter((k) => k.endsWith(' intel'))) expect(chain(inputOf(key, false), false, true)!.kind, key).not.toBe('tip');
  });

  it('with the ribbon known (`keepOff`): a tip on every board, clear of the ribbon, the gauge, the strip, the Sensor card, the guide and its chips, the cast and the command stack by at least GAP, badge included', () => {
    for (const key of IX_ALL) {
      const input = inputOf(key, true);
      const z = tipZone(input);
      expect(z, key).not.toBeNull();
      expect(z!.kind, key).toBe('tip');
      const b = BOARDS[key]!;
      for (const [name, o] of [['ribbon', b.ribbon], ['gauge', b.ink[0]!], ['turn strip', b.ctb]] as const) {
        expect(apart(bar(z!), o), `${key}: bar to ${name}`).toBeGreaterThanOrEqual(GAP - 0.01);
        expect(apart(badge(z!), o), `${key}: badge to ${name}`).toBeGreaterThanOrEqual(GAP - 0.01);
      }
      for (const o of everything(input)) {
        expect(apart(bar(z!), o), `${key}: ${JSON.stringify(o)}`).toBeGreaterThanOrEqual(GAP - 0.01);
        expect(apart(badge(z!), o), `${key}: badge ${JSON.stringify(o)}`).toBeGreaterThanOrEqual(GAP - 0.01);
      }
    }
  });

  it('the ribbon is read by the tip alone: every board\'s DESIGNED card (the chain without the tip) is the same with and without it (Chapter IX\'s first menu with Intel open does not move)', () => {
    for (const key of IX_ALL) {
      const without = chain(inputOf(key, false), false, false);
      const withIt = chain(inputOf(key, true), false, false);
      expect(withIt, key).toEqual(without);
    }
  });

  it('the badge stands inside the stage and the bar reaches no further right than the stage\'s edge less GAP', () => {
    for (const key of IX_ALL) {
      const z = tipZone(inputOf(key, true))!;
      expect(bar(z).right, key).toBeLessThanOrEqual(STAGE.width - GAP + 0.01);
      expect(badge(z).left, key).toBeGreaterThanOrEqual(GAP - 0.01);
    }
  });
});

describe('Chapter XII (FFX only): the tip and the designed card, solved against the ribbon and not slid, never stand on the ribbon, the strip or the turn strip', () => {
  const XII = Object.keys(BOARDS).filter((k) => chOf(k) === 'XII');

  it('REPRODUCES r71: without the ribbon the designed card (and its chip) stand on the ribbon\'s foot at 1600 x 900 with the target cursor up and at 2560 x 1440, and at 115 the slid bar is across the disc strip', () => {
    for (const key of ['XII 100 1600x900 intel+target', 'XII 100 2560x1440 intel']) {
      const z = chain(inputOf(key, false), false, true)!;
      expect(z.kind, key).not.toBe('tip');
      const box = R(z.left - 9, STAGE.height - z.bottom - z.maxHeight - ADVISOR_CHIP_RESERVE, z.left + z.width + 9, STAGE.height - z.bottom);
      expect(hits(box, BOARDS[key]!.ribbon), key).toBe(true);
    }
    for (const key of XII.filter((k) => k.startsWith('XII 115'))) {
      const z = tipZone(inputOf(key, false))!;
      expect(hits(bar(z, slideOf(1.15)), BOARDS[key]!.ink[0]!), `${key}: slid`).toBe(true);
    }
  });

  it('with the ribbon known (ink for the designed card, `keepOff` for the tip): whatever the chain answers stands clear of the ribbon by GAP, a card with its chip above it and a tip with its badge', () => {
    for (const key of XII) {
      const input = inputOf(key, true);
      const z = chain(input, false, true);
      expect(z, key).not.toBeNull();
      const rib = BOARDS[key]!.ribbon;
      if (z!.kind === 'tip') {
        expect(apart(bar(z!), rib), `${key}: bar`).toBeGreaterThanOrEqual(GAP - 0.01);
        expect(apart(badge(z!), rib), `${key}: badge`).toBeGreaterThanOrEqual(GAP - 0.01);
      } else {
        const box = R(z!.left - 9, STAGE.height - z!.bottom - z!.maxHeight - ADVISOR_CHIP_RESERVE, z!.left + z!.width + 9, STAGE.height - z!.bottom);
        expect(apart(box, rib), `${key}: card with its chip`).toBeGreaterThanOrEqual(GAP - 0.01);
      }
    }
  });

  it('and clear of the disc strip, its note, the Enemy Intent card and the turn strip, on every board, by the same GAP', () => {
    for (const key of XII) {
      const input = inputOf(key, true);
      const z = chain(input, false, true)!;
      const b = BOARDS[key]!;
      const painted = z.kind === 'tip' ? [bar(z), badge(z)] : [R(z.left - 9, STAGE.height - z.bottom - z.maxHeight - ADVISOR_CHIP_RESERVE, z.left + z.width + 9, STAGE.height - z.bottom)];
      for (const p of painted) for (const o of [...b.ink, b.ctb, b.ribbon]) expect(apart(p, o), `${key}: ${JSON.stringify(o)}`).toBeGreaterThanOrEqual(GAP - 0.01);
    }
  });

  it('the tip alone, on every XII board: a tip, not slid, clear of the strip, the ribbon and the turn strip', () => {
    for (const key of XII) {
      const input = inputOf(key, true);
      const z = tipZone(input)!;
      expect(z.kind, key).toBe('tip');
      const b = BOARDS[key]!;
      for (const o of [...b.ink, b.ctb, b.ribbon]) expect(apart(bar(z), o), `${key}: ${JSON.stringify(o)}`).toBeGreaterThanOrEqual(GAP - 0.01);
    }
  });
});

