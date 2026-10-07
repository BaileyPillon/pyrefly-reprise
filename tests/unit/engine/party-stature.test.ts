/**
 * **The sizing maths of the FFX party's stature** (`src/engine/PartyStature.ts`, r3941-heights).
 *
 * What has to hold, with no WebGL (the stage that calls this is in `stage-party-stature.test.ts`):
 *
 * - who is scaled: a hero, in an FFX battle, on the party's side, and nobody else (FFX-2's Yuna and Rikku share two ids and are not);
 * - how: the shared height times the ratio, the shadow and ring by the same factor; a height a scene or a director names is the
 *   figure's own and carries no ratio;
 * - Tidus is unchanged and so is every figure outside the table, bit for bit;
 * - the feet: `computePoseScale` at the scaled world height puts the pose's anchor row on the ground point at every ratio, and
 *   every length of the plane is the unscaled one times the ratio, for the standing pose and the lying one alike, so the per-pose
 *   registration and the head lock (which only ever see ratios of one actor's own poses) cannot move.
 *
 * Game case: FFX only [AGENTS.md rule 14]; the FFX-2 and FF7 cases below are the proof that nothing else is touched.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { CHARACTER_IDS } from '../../../src/data/ffx/ids.ts';
import { FFX_PARTY_STATURE } from '../../../src/data/ffx/party-stature.ts';
import { figureHeight, partyStature, setStatureOff, statureOff } from '../../../src/engine/PartyStature.ts';
import { computePoseScale, type PoseFrame } from '../../../src/engine/PaintedScale.ts';

afterEach(() => setStatureOff(null));

describe('partyStature: who is scaled', () => {
  it('gives each of the seven heroes the ratio of the table in an FFX battle, on the party side', () => {
    for (const id of CHARACTER_IDS) expect(partyStature('ffx', 'party', id), id).toBe(FFX_PARTY_STATURE[id].ratio);
    expect(partyStature('ffx', 'party', 'tidus')).toBe(1);
    expect(partyStature('ffx', 'party', 'kimahri')).toBeCloseTo(1.211, 12);
  });

  it("leaves FFX-2 alone: Yuna and Rikku share ids with FFX's and are not scaled; nobody else is either", () => {
    for (const id of ['yuna', 'rikku', 'paine', 'tidus', 'kimahri', 'wakka', 'lulu', 'auron']) {
      expect(partyStature('ffx2', 'party', id), id).toBe(1);
      expect(partyStature('ff7', 'party', id), id).toBe(1);
    }
  });

  it('leaves aeons, fiends and parts alone even when they carry a hero id, and a state not yet staged', () => {
    expect(partyStature('ffx', 'enemy', 'auron')).toBe(1);
    expect(partyStature('ffx', 'aeon', 'yuna')).toBe(1);
    expect(partyStature('ffx', 'aeon', 'valefor')).toBe(1);
    expect(partyStature(undefined, 'party', 'kimahri')).toBe(1);
  });

  it('gives 1 to an id the table does not name (Seymour, a guest, an unknown)', () => {
    for (const id of ['seymour', 'cindy', 'jecht', '']) expect(partyStature('ffx', 'party', id), id).toBe(1);
  });

  it('is switched off by ?stature=off for A/B captures, and back on', () => {
    expect(statureOff()).toBe(false); // jsdom-free node: no address, no switch
    setStatureOff(true);
    for (const id of CHARACTER_IDS) expect(partyStature('ffx', 'party', id), id).toBe(1);
    setStatureOff(false);
    expect(partyStature('ffx', 'party', 'wakka')).toBe(1.201);
  });
});

describe('figureHeight: how the party stands', () => {
  const SHARED = 1.82;

  it("multiplies the party's shared height by the ratio and scales the shadow and the ring with it", () => {
    for (const id of CHARACTER_IDS) {
      const r = FFX_PARTY_STATURE[id].ratio;
      const f = figureHeight({ shared: SHARED, stature: partyStature('ffx', 'party', id) });
      expect(f.height, id).toBe(SHARED * r);
      expect(f.ringScale, id).toBe(r);
    }
  });

  it('leaves Tidus exactly as he was', () => {
    const f = figureHeight({ shared: SHARED, stature: partyStature('ffx', 'party', 'tidus') });
    expect(f.height).toBe(SHARED);
    expect(f.ringScale).toBe(1);
  });

  it("is bit-for-bit the old numbers for a figure outside the table: the shared height, a scene's, a director's", () => {
    // The stage computed these three ways before: `worldHeight ?? own ?? shared` and `own !== undefined && !worldHeight ? own / shared : 1`.
    const old = (shared: number, own?: number, given?: number): { height: number; ringScale: number } => ({
      height: given ?? own ?? shared,
      ringScale: own !== undefined && !given ? own / shared : 1,
    });
    for (const [shared, own, given] of [
      [1.82, undefined, undefined],
      [1.75, 0.73, undefined],
      [4.1 * 0.7, 3.2, undefined],
      [1.75, 0.73, 1.2],
      [1.75, undefined, 1.2],
      [4.1, undefined, 0],
      [1.75, 0.73, 0],
    ] as const) {
      const now = figureHeight({ shared, own, given, stature: 1 });
      expect(now.height, JSON.stringify([shared, own, given])).toBe(old(shared, own, given).height);
      expect(now.ringScale, JSON.stringify([shared, own, given])).toBe(old(shared, own, given).ringScale);
    }
  });

  it("takes a height the scene names for the combatant as the figure's own, with no ratio on top (Chapter XIV's Yuna)", () => {
    const yuna = FFX_PARTY_STATURE.yuna.ratio;
    const f = figureHeight({ shared: 1.68, own: 1.68, stature: yuna });
    expect(f.height).toBe(1.68);
    expect(f.ringScale).toBe(1);
    // A scene-named height that differs from the shared one still scales the ring by that ratio, as it always has, and nothing more.
    const g = figureHeight({ shared: 1.75, own: 2.0, stature: yuna });
    expect(g.height).toBe(2.0);
    expect(g.ringScale).toBeCloseTo(2.0 / 1.75, 12);
  });

  it("takes a director's height as given too", () => {
    const f = figureHeight({ shared: 1.82, given: 2.5, stature: 1.211 });
    expect(f.height).toBe(2.5);
    expect(f.ringScale).toBe(1);
  });
});

/** Real sidecar shapes (as `painted-scale.test.ts` copies them): idle and victory are portrait renders, `ko` a landscape one. */
const FRAMES = {
  idle: { width: 709, height: 1056, baselineY: 1040 },
  hurt: { width: 617, height: 1129, baselineY: 1113 },
  ko: { width: 1216, height: 823, baselineY: 813 },
  victory: { width: 605, height: 1181, baselineY: 1165 },
} satisfies Record<string, PoseFrame>;

/** World y of pixel row `row` (from the top of the PNG) in a plane placed as the actor places it: centred at `offsetY` above the ground point. */
const rowY = (s: ReturnType<typeof computePoseScale>, row: number): number => s.offsetY + s.height / 2 - row * s.unitsPerPixel;

describe('sizing about the feet: computePoseScale at the scaled world height', () => {
  const BASE = 1.82;
  const unscaled = Object.fromEntries(
    Object.entries(FRAMES).map(([pose, f]) => [pose, computePoseScale(f, { worldHeight: BASE, reference: FRAMES.idle })]),
  ) as Record<keyof typeof FRAMES, ReturnType<typeof computePoseScale>>;

  it('keeps the feet row on the ground point for every hero and every pose', () => {
    for (const id of CHARACTER_IDS) {
      const r = FFX_PARTY_STATURE[id].ratio;
      for (const [pose, frame] of Object.entries(FRAMES)) {
        const s = computePoseScale(frame, { worldHeight: BASE * r, reference: FRAMES.idle });
        expect(rowY(s, s.anchorY), `${id} ${pose}`).toBeCloseTo(0, 10);
      }
    }
  });

  it('scales every length of the plane by the ratio and nothing else, so one pixel scale serves all of a hero\'s poses', () => {
    for (const id of CHARACTER_IDS) {
      const r = FFX_PARTY_STATURE[id].ratio;
      for (const [pose, frame] of Object.entries(FRAMES) as Array<[keyof typeof FRAMES, PoseFrame]>) {
        const s = computePoseScale(frame, { worldHeight: BASE * r, reference: FRAMES.idle });
        const u = unscaled[pose];
        const tag = `${id} ${pose}`;
        expect(s.unitsPerPixel, tag).toBeCloseTo(u.unitsPerPixel * r, 12);
        expect(s.width, tag).toBeCloseTo(u.width * r, 10);
        expect(s.height, tag).toBeCloseTo(u.height * r, 10);
        expect(s.offsetY, tag).toBeCloseTo(u.offsetY * r, 10);
        expect(s.topY, tag).toBeCloseTo(u.topY * r, 10);
        expect(s.footprint, tag).toBeCloseTo(u.footprint * r, 10);
        expect(s.contentBox.y1, tag).toBeCloseTo(u.contentBox.y1 * r, 10);
        // What does not scale: the anchor row (a pixel), whether the body lies down, whether a safety net bit.
        expect(s.anchorY, tag).toBe(u.anchorY);
        expect(s.prone, tag).toBe(u.prone);
        expect(s.clamped, tag).toBe(u.clamped);
      }
    }
  });

  it("makes a standing Kimahri 21 percent taller than Tidus and a standing Yuna 9 percent shorter, about the same feet", () => {
    const tidus = computePoseScale(FRAMES.idle, { worldHeight: BASE * 1, reference: FRAMES.idle });
    const kimahri = computePoseScale(FRAMES.idle, { worldHeight: BASE * FFX_PARTY_STATURE.kimahri.ratio, reference: FRAMES.idle });
    const yuna = computePoseScale(FRAMES.idle, { worldHeight: BASE * FFX_PARTY_STATURE.yuna.ratio, reference: FRAMES.idle });
    expect(kimahri.topY / tidus.topY).toBeCloseTo(1.211, 6);
    expect(yuna.topY / tidus.topY).toBeCloseTo(0.911, 6);
    // The standing figure's painted top (the idle's first painted row, 16 px below the PNG's top) keeps the same share of the height.
    const topRow = (s: ReturnType<typeof computePoseScale>): number => rowY(s, 16);
    expect(topRow(kimahri) / topRow(tidus)).toBeCloseTo(1.211, 6);
  });

  it('is the identical plane at a ratio of 1 (Tidus, and every figure outside the table)', () => {
    for (const [pose, frame] of Object.entries(FRAMES)) {
      expect(computePoseScale(frame, { worldHeight: BASE * 1, reference: FRAMES.idle }), pose).toEqual(unscaled[pose as keyof typeof FRAMES]);
    }
  });

  it('keeps the safety nets relative to the hero: a lying body is never clamped for being a tall hero\'s', () => {
    for (const id of CHARACTER_IDS) {
      const s = computePoseScale(FRAMES.ko, { worldHeight: BASE * FFX_PARTY_STATURE[id].ratio, reference: FRAMES.idle });
      expect(s.clamped, id).toBe(false);
      expect(s.prone, id).toBe(true);
    }
  });
});
