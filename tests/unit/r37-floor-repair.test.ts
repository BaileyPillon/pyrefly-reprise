/**
 * r37-ui-floor repair cycle (the independent check of f8fe37be, five blockers).
 *
 * Game case: the floor items and the phone pause are both games; the targeting hand and the phone target plate
 * are FFX only; the slab column candidates are FFX-2 only. Browser proof is in `docs/handoff/r37-ui-floor.md`.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { objLift, PHONE_FOOT_AIR } from '../../src/app/screens/pause/phoneFit.ts';
import { clearHandShift } from '../../src/ui/ffx/handClear.ts';
import { placeSlab, type SlabRect } from '../../src/ui/ffx2/intentPlacement.ts';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const css = (...p: string[]): string => readFileSync(join(SRC, ...p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('blocker 1: the remaining sub-14 labels are floored', () => {
  const floor = css('ui', 'common', 'hud-floor.css');
  it('the Sensor card lines, the CTB tile letter and the banner chip are max(authored, floor)', () => {
    for (const sel of ['.ffx-sensor__unknown', '.ffx-sensor__immune', '.ffx-sensor__failed', '.ig-ctb__tag']) {
      expect(floor, sel).toMatch(new RegExp(`\\.ffxhud ${sel.replace('.', '\\.')} \\{ font-size: max\\([\\d.]+px, var\\(--hud-floor\\)\\); \\}`));
    }
    expect(floor).toMatch(/\.ffxhud \.ig-banner__chip \{ font-size: max\(6\.22px, var\(--hud-floor\)\); \}/);
    expect(floor).toMatch(/\.ffx2hud \.ig-banner__chip \{ font-size: max\(6\.22px, var\(--hud-floor\)\); \}/);
  });
  it('the mid-battle card (scaled 0.7) and band hold 14.1 px on the desktop, 115 and 130 % included', () => {
    const card = css('ui', 'common', 'line-card.css');
    expect(card).toMatch(/\.dbox--card:not\(\.dbox--narrate\) \.dbox__role \{\s*font-size: max\(8px, 0\.76vw, calc\(14\.1px \/ var\(--lc-scale, 0\.7\)\)\);/);
    expect(card).toMatch(/\.dbox--card:not\(\.dbox--narrate\) \.dbox__text \{\s*font-size: max\(13px, 1\.67vw, calc\(14\.1px \/ var\(--lc-scale, 0\.7\)\)\);/);
    expect(card).toMatch(/\.dbox--band \.dbox__role \{ font-size: max\(8px, 0\.76vw, 14\.1px\); \}/);
    const ts = css('ui', 'common', 'text-size.css');
    expect(ts).toMatch(/\.dbox--card:not\(\.dbox--narrate\) \.dbox__role \{\s*font-size: max\(calc\(max\(8px, 0\.76vw\) \* var\(--pyr-ts\)\), calc\(14\.1px/);
  });
  it('the phone keeps 14 px for the enemy-ability band and for the bark tag at 115 and 130 %', () => {
    expect(css('ui', 'ffx', 'phone-hud-parts.css')).toMatch(/html\[data-phone-battle='ffx'\] \.ffxhud \.ffx-helpbar \{\s*font-size: 14px;/);
    const ts = css('ui', 'common', 'text-size.css');
    expect(ts).toMatch(/html\[data-phone-battle\]\[data-text-size\]:not\(\[data-text-size='100'\]\) \.dbox__role \{ font-size: calc\(14px \* var\(--pyr-ts\)\); \}/);
    expect(ts).toMatch(/html\[data-phone-battle\]\[data-text-size\]:not\(\[data-text-size='100'\]\) \.dbox__text \{ font-size: calc\(15px \* var\(--pyr-ts\)\); \}/);
  });
});

describe('blocker 2: the phone pause objective rises off the footer', () => {
  it('objLift is the overrun past the air, 0 when it clears', () => {
    expect(objLift(700, 800)).toBe(0);
    expect(objLift(800 - PHONE_FOOT_AIR, 800)).toBe(0);
    expect(objLift(809, 800)).toBeCloseTo(9 + PHONE_FOOT_AIR, 5);
  });
  it('an unmeasurable footer asks for no lift', () => {
    expect(objLift(809, Infinity)).toBe(0);
    expect(objLift(NaN, 800)).toBe(0);
  });
  it('pause-phone.css reads --pu-phone-obj-lift inside the phone query and tightens the caption', () => {
    const sheet = css('ui', 'common', 'pause-phone.css');
    expect(sheet).toMatch(/\.pause \.pause__obj \{\s*top: calc\(var\(--pu-top-obj\) - var\(--pu-phone-obj-lift, 0px\)\);/);
    expect(sheet).toMatch(/\.pause \.pause__eyebrow \{\s*letter-spacing: 0\.2em;/);
  });
});

describe('blocker 3: the targeting hand steps off the text cards (FFX only)', () => {
  const card = { left: 100, top: 100, right: 300, bottom: 160 };
  it('does not move a hand that clears every card', () => {
    expect(clearHandShift({ left: 320, top: 110, right: 364, bottom: 140 }, [card], 90)).toBe(0);
  });
  it('moves it the shorter way, with a 4 px gap', () => {
    // hand over the card's lower right: down is 130 + 4 - 150 ... up is the longer way
    const down = clearHandShift({ left: 280, top: 145, right: 324, bottom: 175 }, [card], 90);
    expect(down).toBeCloseTo(160 + 4 - 145, 5);
    const up = clearHandShift({ left: 280, top: 85, right: 324, bottom: 115 }, [card], 90);
    expect(up).toBeCloseTo(100 - 4 - 30 - 85, 5);
  });
  it('leaves it where the figure puts it when no shift within the limit clears the cards', () => {
    expect(clearHandShift({ left: 280, top: 120, right: 324, bottom: 150 }, [card], 10)).toBe(0);
  });
  it('a folded Sensor card keeps its authored top, and the open card rises only by its third chip row', () => {
    const sheet = css('ui', 'common', 'hud-floor.css');
    expect(sheet).toMatch(/\.ffxhud \.ffx-sensor:not\(\.ffx-sensor--folded\) \{\s*top: calc\(166px/);
    expect(sheet).toMatch(/--sensor-chip-h: clamp\(10\.5px/);
  });
});

describe('blocker 5: placeSlab also tries the walls and the chip-flush column (FFX-2 only)', () => {
  const LAYER = { width: 1024, height: 768 };
  const SIZE = { w: 240, h: 274 };
  const chip = { w: 79, h: 23, gap: 1.6 };
  // A guide panel on the left that the slab's chip (not its body) would touch, a girl, and a far girl.
  const guide: SlabRect = { left: 34, top: 237, right: 245, bottom: 466 };
  const yuna: SlabRect = { left: 174, top: 407, right: 311, bottom: 650, soft: true, party: true };
  const rikku: SlabRect = { left: 324, top: 400, right: 443, bottom: 612, soft: true, party: true };
  const chrome: SlabRect = { left: 480, top: 130, right: 1024, bottom: 768 }; // the advisor, command window and party column
  const at = (p: { left: number; top: number }): SlabRect => ({ left: p.left, top: p.top, right: p.left + SIZE.w, bottom: p.top + SIZE.h });
  const overlap = (a: SlabRect, b: SlabRect): number =>
    Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

  it('with only the girls and the guide to go by, it stands with its chip flush to the guide and off Rikku', () => {
    const p = placeSlab({ left: 570, top: -76 }, SIZE, [guide, chrome, yuna, rikku], LAYER, 6.4, 24.8, { tiered: true, chip });
    const box = at(p);
    expect(overlap(box, guide) + overlap(box, chrome)).toBe(0);
    expect(overlap(box, rikku)).toBeLessThan(overlap({ left: 131, top: p.top, right: 371, bottom: p.top + SIZE.h }, rikku) + 1);
    expect(p.left).toBeLessThan(131);
  });
  it('an untiered pass (every other caller) gets the old candidate set', () => {
    const a = placeSlab({ left: 570, top: -76 }, SIZE, [guide, yuna, rikku], LAYER, 6.4, 0);
    expect(a.left).toBeGreaterThanOrEqual(6.4);
  });
});
