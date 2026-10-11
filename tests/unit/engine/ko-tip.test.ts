/**
 * FA-2 and FA-3 (visual-and-feel pass, 2026-10-10; PR-0378; both games): the geometry of a topple (`KoTip.ts`), pure.
 *
 * A plane is placed upright as always (`placePlane`), then tipped: turned about its pivot toward the side the KO painting's head lies and slid so the
 * two bodies' middles meet. Here a plain object stands for the mesh and the numbers are checked against the geometry by hand; the real
 * `PaintedActor` through the probe's corner maths is `ko-fall-actor.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import { FOOT_ROW, SLIDE_MAX, TOE_REACH_MAX, TOPPLE_RAD, contentCentreX, headCentreX, headMiddleU, placeTipped, tipPivotX, tipSide, type SlotTip } from '../../../src/engine/KoTip.ts';

/** A standing plane 2 tall, 1 wide, its content filling it, centred at x 0.3, the feet at 0 (the plane's centre is 1 up). 100 px per unit, so a pixel is a hundredth. */
const SCALE = { width: 1, unitsPerPixel: 0.01, anchorY: 200, height: 2, offsetY: 1, contentBox: { x0: -0.5, x1: 0.5, y0: 0, y1: 2 } };
const META = { width: 100 };
const mesh = (x = 0.3, scaleX = 1) => ({ position: { x, y: 1 }, rotation: { z: 0 }, scale: { x: scaleX } });
const tip = (over: Partial<SlotTip> = {}): SlotTip => ({ side: 1, full: TOPPLE_RAD, e: 1, slide: 1, target: null, by: 'middle', ...over });

describe('which way a body falls', () => {
  it('toward the side of the KO painting its head lies on, read through the mirror', () => {
    expect(tipSide(0.9, 1, 1)).toBe(1);
    expect(tipSide(0.18, 1, 1)).toBe(-1); // Yuna's KO painting has the head on the left
    expect(tipSide(0.9, -1, 1)).toBe(-1); // a mirrored plane
    expect(tipSide(0.18, -1, -1)).toBe(1);
  });

  it('forward, the way the figure faces, when the painting has no registered head', () => {
    expect(tipSide(undefined, 1, 1)).toBe(1);
    expect(tipSide(undefined, 1, -1)).toBe(-1);
    expect(tipSide(Number.NaN, -1, 1)).toBe(1);
  });

  it('reads the middle of a head box', () => {
    expect(headMiddleU([0.8, 0.3, 0.96, 0.5])).toBeCloseTo(0.88, 12);
    expect(headMiddleU(undefined)).toBeUndefined();
  });
});

describe('the pivot', () => {
  it('is the stance when a plane has one, else the plane\'s middle', () => {
    expect(tipPivotX(0.3, META, SCALE, 1, 1)).toBe(0.3);
    expect(tipPivotX(0.3, { ...META, stanceX: 60 }, SCALE, 1, 1)).toBeCloseTo(0.3 + 0.1, 12); // 10 px right of the middle
    expect(tipPivotX(0.3, { ...META, stanceX: 60 }, SCALE, -1, 1)).toBeCloseTo(0.3 - 0.1, 12); // mirrored: the other way
  });

  /** A hull: boots at the floor from x 30 to 62 px, a hand hanging at 40 percent of the height at x 95. Rows count from the top (anchor row 200). */
  const hull = (rows: Array<[number, number]>) => ({ ...META, stanceX: 45, ground: { hull: rows, cx: 50, cy: 100 } });

  it('is the front-most near-floor point of the underside in the fall direction: the toe, so no boot dips under the floor', () => {
    const m = hull([[30, 200], [45, 201], [62, 199], [95, 120]]);
    expect(tipPivotX(0, m, SCALE, 1, 1)).toBeCloseTo((62 - 50) * 0.01, 12); // the toe at 62 px, not the hand at 95
    expect(tipPivotX(0, m, SCALE, 1, -1)).toBeCloseTo((30 - 50) * 0.01, 12); // falling the other way, the heel at 30
  });

  it('never leads the stance by more than 30 percent of the body\'s height, and never sits behind it', () => {
    const far = { ...META, stanceX: 50, ground: { hull: [[50, 200], [180, 200]] as Array<[number, number]>, cx: 50, cy: 100 } }; // a hem laid 1.3 along the floor
    expect(tipPivotX(0, far, SCALE, 1, 1)).toBeCloseTo(TOE_REACH_MAX * 2, 12);
    const behind = { ...META, stanceX: 80, ground: { hull: [[30, 200], [50, 200]] as Array<[number, number]>, cx: 50, cy: 100 } };
    expect(tipPivotX(0, behind, SCALE, 1, 1)).toBeCloseTo((80 - 50) * 0.01, 12); // the stance, 80, is ahead of every hull point
  });

  it('counts only points at the floor: a point above the foot row is a hand or a weapon, not a toe', () => {
    const m = { ...META, stanceX: 50, ground: { hull: [[50, 200], [99, 200 - Math.round((FOOT_ROW + 0.05) * 200)]] as Array<[number, number]>, cx: 50, cy: 100 } };
    expect(tipPivotX(0, m, SCALE, 1, 1)).toBeCloseTo(0, 12);
  });
});

describe('tipping a plane', () => {
  it('upright is untouched (e of 0): nothing moves, nothing turns', () => {
    const m = mesh();
    placeTipped(m, tip({ e: 0, slide: 0, target: 5 }), META, SCALE);
    expect(m).toEqual(mesh());
  });

  it('turns about the pivot toward the side: fully toppled to the right the head (2 above the pivot) is 2 sin 80 to the right and 2 cos 80 up, whatever the plane\'s own middle', () => {
    for (const side of [1, -1] as const) {
      const m = mesh(0.3);
      placeTipped(m, tip({ side }), META, SCALE);
      expect(m.rotation.z).toBeCloseTo(-side * TOPPLE_RAD, 12);
      // the plane's local point at the head (its top edge, x 0): turn it through the mesh's rotation and add its position
      const head = { x: m.position.x - Math.sin(m.rotation.z) * 1, y: m.position.y + Math.cos(m.rotation.z) * 1 };
      expect(head.x - 0.3).toBeCloseTo(side * 2 * Math.sin(TOPPLE_RAD), 12);
      expect(head.y).toBeCloseTo(2 * Math.cos(TOPPLE_RAD), 12);
    }
  });

  it('the pivot stays where it is: the stance point of the plane is the same point before and after, with no slide', () => {
    const m = mesh(0.3);
    const px = tipPivotX(0.3, META, SCALE, 1, 1);
    placeTipped(m, tip({ side: 1, e: 0.6 }), META, SCALE);
    // the plane's local foot point (0, -1) relative to its middle, put through the new position and rotation
    const a = m.rotation.z;
    const foot = { x: m.position.x + 0 * Math.cos(a) + 1 * Math.sin(a), y: m.position.y + 0 * Math.sin(a) - 1 * Math.cos(a) };
    expect(foot.x).toBeCloseTo(px, 12);
    expect(foot.y).toBeCloseTo(0, 12);
  });

  it('slides so the toppled body\'s middle meets the target: all the way at a slide of 1, a share of the way before (the slide has its own clock)', () => {
    const target = -0.8;
    const full = mesh(0.3);
    placeTipped(full, tip({ target }), META, SCALE);
    // the content's middle (x 0, y 1 in the plane) after the turn is the plane's middle itself here (the box is centred): its position is the middle
    expect(full.position.x).toBeCloseTo(target, 12);
    const half = mesh(0.3);
    placeTipped(half, tip({ target, e: 0.5, slide: 0.5 }), META, SCALE);
    const noSlide = mesh(0.3);
    placeTipped(noSlide, tip({ e: 0.5, slide: 0.5 }), META, SCALE);
    // the target is the slide at e 1; at 0.5 the slide is half of that
    const fullSlide = target - (() => {
      const p = mesh(0.3);
      placeTipped(p, tip({ target: null }), META, SCALE);
      return p.position.x;
    })();
    expect(half.position.x - noSlide.position.x).toBeCloseTo(0.5 * fullSlide, 12);
  });

  it('is the same for a mirrored plane: the middle of the content is read through the mirror', () => {
    const lopsided = { ...SCALE, contentBox: { x0: -0.1, x1: 0.5, y0: 0, y1: 2 } }; // the content leans right in an unmirrored plane
    const target = 1.5;
    for (const mirror of [1, -1] as const) {
      const m = mesh(0.3, mirror);
      placeTipped(m, tip({ side: -1, target }), META, lopsided);
      // after the slide the content's middle sits on the target: it is the middle of the content box, turned
      const cx = 0.3 + (mirror * (-0.1 + 0.5)) / 2;
      const cy = 1;
      const px = tipPivotX(0.3, META, lopsided, mirror, -1);
      const a = TOPPLE_RAD; // the full turn toward the left is counter-clockwise by 80 degrees
      const turned = px + (cx - px) * Math.cos(a) - cy * Math.sin(a);
      const slide = target - turned;
      const placed = mesh(0.3, mirror);
      placeTipped(placed, tip({ side: -1, target: null }), META, lopsided);
      expect(m.position.x).toBeCloseTo(placed.position.x + slide, 12);
    }
  });

  it('never throws a figure across the field: the slide is at most 1.2 plane heights', () => {
    const far = mesh(0.3);
    const none = mesh(0.3);
    placeTipped(far, tip({ target: 1e6 }), META, SCALE);
    placeTipped(none, tip({ target: null }), META, SCALE);
    expect(far.position.x - none.position.x).toBeCloseTo(SLIDE_MAX * SCALE.height, 12);
  });

  it('adds to a roll the plane already has (a prone plane is rolled to rest) and leaves its height alone otherwise', () => {
    const m = mesh();
    m.rotation.z = 0.2;
    placeTipped(m, tip({ side: -1, e: 0.5 }), META, SCALE);
    expect(m.rotation.z).toBeCloseTo(0.2 + 0.5 * TOPPLE_RAD, 12);
  });
});

describe('the middle of a plane\'s content', () => {
  it('is the box\'s middle through the mirror, and through the roll a lying painting rests at', () => {
    const scale = { offsetY: 0.3, contentBox: { x0: -0.4, x1: 0.8, y0: -0.2, y1: 0.6 } };
    expect(contentCentreX(scale, 1, { x: 0.5, y: 0.3 }, 0)).toBeCloseTo(0.5 + 0.2, 12);
    expect(contentCentreX(scale, -1, { x: 0.5, y: 0.3 }, 0)).toBeCloseTo(0.5 - 0.2, 12);
    // rolled by 90 degrees: the box's middle (0.2, 0.2 - 0.3 = -0.1 from the plane's middle) turns to (0.1, 0.2)
    expect(contentCentreX(scale, 1, { x: 0, y: 0 }, Math.PI / 2)).toBeCloseTo(0.1, 12);
  });
});

describe('meeting at the head', () => {
  /** The standing plane's head box sits at the top middle of the 1 by 2 plane (u 0.4 to 0.6, t 0.05 to 0.15): a point 0.8 above the plane's middle. */
  const HEAD: readonly [number, number, number, number] = [0.4, 0.05, 0.6, 0.15];

  it('the middle of a head box is read through the mirror and the roll', () => {
    expect(headCentreX(HEAD, SCALE, 1, { x: 0.3, y: 1 }, 0)).toBeCloseTo(0.3, 12); // u 0.5: straight above the middle
    const off: readonly [number, number, number, number] = [0.8, 0.4, 1, 0.6]; // the right edge, at the middle height
    expect(headCentreX(off, SCALE, 1, { x: 0, y: 0 }, 0)).toBeCloseTo(0.4, 12);
    expect(headCentreX(off, SCALE, -1, { x: 0, y: 0 }, 0)).toBeCloseTo(-0.4, 12);
    // rolled a quarter turn counter-clockwise, a point 0.4 to the right of the middle is 0.4 above it: x 0
    expect(headCentreX(off, SCALE, 1, { x: 0, y: 0 }, Math.PI / 2)).toBeCloseTo(0, 12);
    expect(headCentreX(undefined, SCALE, 1, { x: 0, y: 0 }, 0)).toBeUndefined();
  });

  it('slides the toppled plane until its head is on the target (a target within the slide limit), and the other points go with it', () => {
    const target = 0.5; // the toppled head would be 2.07 to the right; the slide is 1.57, inside 1.2 plane heights
    const m = mesh(0.3);
    placeTipped(m, tip({ target, by: 'head' }), { ...META, head: HEAD }, SCALE);
    // the head's local point (0, +0.8 from the plane's middle) turned through the plane's rotation and placed at its position
    const a = m.rotation.z;
    const head = { x: m.position.x + 0 * Math.cos(a) - 0.8 * Math.sin(a), y: m.position.y + 0 * Math.sin(a) + 0.8 * Math.cos(a) };
    expect(head.x).toBeCloseTo(target, 12);
    expect(head.y).toBeGreaterThan(0); // above the floor: it was turned about the feet
  });

  it('is at the middle of the content when the plane has no head (or when the middle is asked for)', () => {
    const noHead = mesh(0.3);
    placeTipped(noHead, tip({ target: -0.8, by: 'head' }), META, SCALE);
    const middle = mesh(0.3);
    placeTipped(middle, tip({ target: -0.8, by: 'middle' }), { ...META, head: HEAD }, SCALE);
    expect(noHead.position.x).toBeCloseTo(-0.8, 12);
    expect(middle.position.x).toBeCloseTo(-0.8, 12);
  });
});
