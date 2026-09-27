/**
 * PR-0094 (FFX-2 only, Ch V link 4) and the link-3 Charge Core slab: the
 * intent slab treats a part's face and weapon as hard obstacles.
 *
 * Under the colossus staging (D-228) Vegnagun's head fills the frame, so its
 * body box is soft and `placeSlab`'s tiered rule lets the slab sit on it when
 * nothing is free. Before this fix that is how the Right Redoubt card came to
 * cover the head's horn (13 % at 2000x1012, 42 % while aiming), and the Charge
 * Core slab the body's core rim (18 %). The key-feature boxes
 * (`engine/keyFeatures.ts`) now rank with the chrome.
 */
import { describe, expect, it } from 'vitest';
import { placeSlab, type SlabRect } from '../../src/ui/ffx2/intentPlacement.ts';
import { keyFeatureObstacles } from '../../src/ui/ffx2/intentBoard.ts';
import { KEY_FEATURES, featureRect } from '../../src/engine/keyFeatures.ts';

const LAYER = { width: 1600, height: 900 };
const SLAB = { w: 375, h: 110 };
const overlap = (a: SlabRect, b: SlabRect) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

/** The link-4 first menu at 1600x900 (docs/screenshots/vegnagun-a/build-desk-4-head-menu.jpg), rounded. */
const CHROME: SlabRect[] = [
  { left: 50, top: 100, right: 655, bottom: 220 }, // enemy bars
  { left: 50, top: 262, right: 382, bottom: 520 }, // guide
  { left: 1244, top: 417, right: 1570, bottom: 608 }, // command stack
  { left: 700, top: 660, right: 1135, bottom: 830 }, // moves card
  { left: 1160, top: 650, right: 1580, bottom: 880 }, // party
];
/**
 * The part fills the frame under the colossus staging, and the girls and the
 * part's own reach take the free pockets; modelled as one soft box over the
 * whole layer, so every spot costs the same soft cover.
 */
const HEAD: SlabRect = { left: 0, top: 0, right: 1600, bottom: 900, soft: true };
/** The horn and its Right Redoubt ring, where the card came to rest. */
const HORN = { x: 890, y: 205, w: 180, h: 185 };

describe('PR-0094: a part\'s face and weapon are hard obstacles for the intent slab', () => {
  it('without the key feature the tiered solver may leave the slab on the horn; with it, the slab clears it', () => {
    const natural = { left: 880, top: 230 };
    const hornRect: SlabRect = { left: HORN.x, top: HORN.y, right: HORN.x + HORN.w, bottom: HORN.y + HORN.h };
    const before = placeSlab(natural, SLAB, [...CHROME, HEAD], LAYER, 4, 0, { tiered: true });
    const boxBefore = { left: before.left, top: before.top, right: before.left + SLAB.w, bottom: before.top + SLAB.h };
    expect(overlap(boxBefore, hornRect)).toBeGreaterThan(0);

    const after = placeSlab(natural, SLAB, [...CHROME, HEAD, ...keyFeatureObstacles([HORN])], LAYER, 4, 0, { tiered: true });
    const boxAfter = { left: after.left, top: after.top, right: after.left + SLAB.w, bottom: after.top + SLAB.h };
    expect(overlap(boxAfter, hornRect)).toBe(0);
    for (const c of CHROME) expect(overlap(boxAfter, c)).toBe(0);
  });

  it('the key features are hard (not soft) rectangles', () => {
    const [r] = keyFeatureObstacles([{ x: 10, y: 20, w: 30, h: 40 }]);
    expect(r).toEqual({ left: 10, top: 20, right: 40, bottom: 60 });
    expect(r!.soft).toBeUndefined();
  });

  it('each Vegnagun part names its face or weapon; the head names both, the body its core', () => {
    expect(Object.keys(KEY_FEATURES).sort()).toEqual(['vegnagun-body', 'vegnagun-head', 'vegnagun-leg', 'vegnagun-tail']);
    expect(Object.keys(KEY_FEATURES['vegnagun-head']!.boxes).sort()).toEqual(['horn', 'skullFace']);
    expect(Object.keys(KEY_FEATURES['vegnagun-body']!.boxes)).toEqual(['core']);
  });

  it('a feature box maps through the plane to a padded screen box', () => {
    const t = KEY_FEATURES['vegnagun-body']!;
    const r = featureRect(t, t.boxes['core']!, (u, v) => ({ x: u * 1000, y: v * 500 }), 8)!;
    expect(r.x).toBeCloseTo((770 / 1213) * 1000 - 8, 3);
    expect(r.w).toBeCloseTo((100 / 1213) * 1000 + 16, 3);
    expect(featureRect(t, t.boxes['core']!, () => null)).toBeNull();
  });
});
