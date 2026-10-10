/**
 * **The real actor at each hero's height** (r3941-heights, FFX only; the maths is `party-stature.test.ts`, the stage is `stage-party-stature.test.ts`).
 *
 * The stage hands `PaintedActor` a `worldHeight` that is the party's shared height times the hero's ratio. This test builds the REAL actor (the head-lock
 * fixture's: Yuna's real pose records and registration rows, real cameras, the harness's own head measure) at the shared height times each of the seven ratios, and
 * holds what the brief asks of the consumers that live inside it:
 *
 * - the feet stay on the ground line, and every length of every pose's plane is the ratio times what it was (one pixel scale for all poses);
 * - the head and centre points, the number and cursor anchors above the head, are proportional (`aimHeight`), and a lying body's plane is proportional;
 * - the per-pose registration (the stance shift, in world units) scales with the figure, so a change of pose slides nothing;
 * - the head lock (CHK-026) holds every swap to x1.00 at every stage camera at every height, and asks for the same factor at every height: the ratio
 *   cancels, it is not a new number for the lock to chase;
 * - a revive (KO to idle) is the same.
 *
 * **Game case: FFX only** [AGENTS.md rule 14] (the heights are FFX's; the actor is shared plumbing and is told its height by the stage).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CHARACTER_IDS } from '../../../src/data/ffx/ids.ts';
import { FFX_PARTY_STATURE } from '../../../src/data/ffx/party-stature.ts';
import { HEAD_BAND, HELD, PERSPECTIVES, POSES, PaintedActor, cameraWithPerspective, frame, painting, reset, slotOf, swapRatio, swapping, type Actor, type Pose } from './head-lock-fixture.ts';

afterEach(reset);

const SHARED = 1.82;

/** Yuna's real paintings on a real actor of the given world height, as the stage stages a party member (the life layer off, so a frame is the same frame). */
function hero(worldHeight: number): Actor {
  const actor = new PaintedActor({ name: 'hero', worldHeight, side: 'party', breathe: false, sway: false, shadow: false, life: false, interimYaw: false });
  actor.adoptPoses(Object.fromEntries(POSES.map((p) => [p, painting('yuna', p)])), 'idle');
  actor.position.set(-2, 0, 0);
  return actor;
}

type Scale = { height: number; width: number; offsetY: number; anchorY: number; unitsPerPixel: number; topY: number; prone: boolean };
/** Show `pose` at once and read the plane that shows it. */
function showing(a: Actor, pose: string): { scale: Scale; x: number } {
  a.setPose(pose, { immediate: true, force: true });
  const slot = slotOf(a, pose) as unknown as { scale: Scale; mesh: { position: { x: number } } };
  return { scale: slot.scale, x: slot.mesh.position.x };
}

const RATIOS = CHARACTER_IDS.map((id) => [id, FFX_PARTY_STATURE[id].ratio] as const);

describe('the real actor at the shared height times each hero\'s ratio', () => {
  const tidus = hero(SHARED * 1);
  tidus.setPose('idle', { immediate: true, force: true });

  it('is exactly the old actor at a ratio of 1', () => {
    expect(tidus.height).toBe(SHARED);
    expect(tidus.headPoint().y).toBeCloseTo(0.92 * SHARED, 12);
    expect(tidus.centerPoint().y).toBeCloseTo(0.52 * SHARED, 12);
  });

  for (const [id, r] of RATIOS) {
    it(`${id} (x${r}): the feet stay on the ground line and every pose's plane is x${r} of Tidus's`, () => {
      const a = hero(SHARED * r);
      a.setPose('idle', { immediate: true, force: true });
      expect(a.height).toBeCloseTo(SHARED * r, 12);
      for (const pose of POSES) {
        const { scale: s, x } = showing(a, pose);
        const { scale: t, x: tx } = showing(tidus, pose);
        // the feet row (the anchor) sits on the actor's ground point, whatever the height
        expect(s.offsetY + s.height / 2 - s.anchorY * s.unitsPerPixel, `${id} ${pose} feet`).toBeCloseTo(0, 9);
        // one pixel scale for the whole figure, and every length of the plane is the ratio times Tidus's
        expect(s.unitsPerPixel / t.unitsPerPixel, `${id} ${pose} pixel scale`).toBeCloseTo(r, 9);
        expect(s.height / t.height, `${id} ${pose} plane height`).toBeCloseTo(r, 9);
        expect(s.width / t.width, `${id} ${pose} plane width`).toBeCloseTo(r, 9);
        expect(s.prone, `${id} ${pose} prone`).toBe(t.prone);
        // the registration (the stance shift that keeps the feet where the idle's are) is in world units, so it scales with the figure
        if (tx !== 0) expect(x / tx, `${id} ${pose} stance shift`).toBeCloseTo(r, 6);
        else expect(x, `${id} ${pose} stance shift`).toBeCloseTo(0, 12);
      }
      tidus.setPose('idle', { immediate: true, force: true });
    });

    it(`${id}: the number and cursor anchors are x${r} of the height, over a standing figure and over a body lying down`, () => {
      const a = hero(SHARED * r);
      a.setPose('idle', { immediate: true, force: true });
      expect(a.headPoint().y).toBeCloseTo(0.92 * SHARED * r, 9);
      expect(a.centerPoint().y).toBeCloseTo(0.52 * SHARED * r, 9);
      a.setPose('ko', { immediate: true, force: true });
      tidus.setPose('ko', { immediate: true, force: true });
      expect(a.isProne).toBe(true);
      expect(a.poseSize[0] / tidus.poseSize[0]).toBeCloseTo(r, 9);
      expect(a.poseSize[1] / tidus.poseSize[1]).toBeCloseTo(r, 9);
      // over a lying body the numerals aim at the top of the plane, which is also x r of Tidus's
      expect(a.headPoint().y / tidus.headPoint().y).toBeCloseTo(r, 9);
      tidus.setPose('idle', { immediate: true, force: true });
    });
  }
});

describe('the head lock (CHK-026) at each hero\'s height', () => {
  const PAIRS: Array<[Pose, Pose]> = [['idle', 'ko'], ['ko', 'idle'], ['hurt', 'ko'], ['idle', 'hurt'], ['victory', 'idle']];

  for (const p of PERSPECTIVES) {
    it(`holds every swap to x1.00 for all seven heights at perspective ${p}, with the same factor it asks of Tidus`, () => {
      const cam = cameraWithPerspective(p);
      const locks = new Map<string, number>();
      for (const [id, r] of RATIOS) {
        for (const [from, to] of PAIRS) {
          const a = hero(SHARED * r);
          swapping(a, cam, from, to);
          for (let i = 0; i < 4; i++) {
            expect(Math.abs(swapRatio(a, cam, from, to) - 1), `${id} ${from} to ${to} frame ${i}`).toBeLessThan(HELD);
            frame(a, cam);
          }
          const lock = (slotOf(a, to) as unknown as { lock: number }).lock;
          const key = `${from}>${to}`;
          if (id === 'tidus') locks.set(key, lock);
          // Nearly the same factor: the height cancels. Not to the digit, because the camera is fixed and a taller figure spans more of it, so the
          // perspective the lock removes (the head's own) is a little stronger: Kimahri's (x1.304 since 2026-10-07, his body at his datamined height) asks 1.05 percent
          // more than Tidus's at the strongest camera (1.04), 0.7 percent at his old 1.211; the band is 0.9 to 1.1, so he sits a tenth of the way in.
          else expect(Math.abs(lock - locks.get(key)!), `${id} ${key}: the lock's factor against Tidus's`).toBeLessThan(0.015);
          expect(lock, `${id} ${key}: inside the band`).toBeGreaterThan(HEAD_BAND[0]);
          expect(lock, `${id} ${key}: inside the band`).toBeLessThan(HEAD_BAND[1]);
          expect(a.headLock.clamped, `${id} ${key}: the band did not bite`).toBe(0);
        }
      }
    });
  }

  it('does not move the head a camera and a height together would let drift: a KO of the tallest hero and of the shortest read the same as Tidus\'s', () => {
    const cam = cameraWithPerspective(0.98); // the camera that fails Chapter V without the lock
    const ratios = RATIOS.map(([, r]) => {
      const a = hero(SHARED * r);
      swapping(a, cam, 'idle', 'ko');
      return swapRatio(a, cam, 'idle', 'ko');
    });
    for (const x of ratios) expect(Math.abs(x - 1)).toBeLessThan(HELD);
  });
});
