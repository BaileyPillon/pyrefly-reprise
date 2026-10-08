/**
 * **The engine keeps the head steady: the plane's half** (D-510, Bailey's pick of 2026-10-06; lane r394-headlock; both games).
 * The real `PaintedActor` under real cameras, read the way CHK-026 reads it (see `head-lock-fixture.ts`): every swap of pose is held to x1.00 at
 * the stage cameras of the evidence (perspective 0.98 to 1.04), from the frame the new painting goes up, through the fall's tilt, the interim yaw,
 * a lunge and a squash; a revive under a camera that moved since the fall is held; and the same scene with nothing holding the head is the failure.
 * The band, what is left alone and the steadiness are `head-lock-actor-edges.test.ts`; the maths is `head-lock.test.ts`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CHECK, HELD, PERSPECTIVES, cameraWithPerspective, frame, perspectiveOf, reset, slotOf, swapRatio, swapping, yuna, type Pose } from './head-lock-fixture.ts';

afterEach(reset);

describe('the stage cameras the swaps are read under', () => {
  it('reach the perspectives of the evidence (0.98 to 1.04), and with nothing holding it a lying head runs away from the standing one as the camera looks down', () => {
    const rows = PERSPECTIVES.map((p) => {
      const cam = cameraWithPerspective(p);
      const a = yuna({ life: false, interimYaw: false });
      swapping(a, cam, 'idle', 'ko', false);
      return { p: perspectiveOf(a, cam), ratio: swapRatio(a, cam, 'idle', 'ko') };
    });
    expect(rows.map((r) => r.p.toFixed(3))).toEqual(['0.980', '1.000', '1.040']);
    expect(Math.abs(rows[0]!.ratio - 1)).toBeGreaterThan(CHECK); // a CHK-026 FAIL at the first camera, as Chapter V's
    expect(Math.abs(rows[0]!.ratio - rows[2]!.ratio)).toBeGreaterThan(CHECK);
  });
});

describe('the lock holds every swap to x1.00 under every stage camera', () => {
  const PAIRS: Array<[Pose, Pose]> = [['idle', 'ko'], ['ko', 'idle'], ['hurt', 'ko'], ['idle', 'hurt'], ['hurt', 'idle'], ['idle', 'victory'], ['victory', 'idle'], ['victory', 'ko']];

  for (const p of PERSPECTIVES) {
    it(`at perspective ${p}: ${PAIRS.map(([f, t]) => `${f}>${t}`).join(', ')}, from the first frame on and every frame after`, () => {
      const cam = cameraWithPerspective(p);
      for (const [from, to] of PAIRS) {
        const a = yuna(); // the life layer and the interim yaw ride on both planes: the KO falls, the figure turns and tilts
        swapping(a, cam, from, to);
        // never drawn unlocked: the new plane is held by the view the last frame saw, before the stage's pass of this one
        expect(Math.abs(swapRatio(a, cam, from, to) - 1), `${from} to ${to} before the pass`).toBeLessThan(HELD);
        for (let i = 0; i < 8; i++) {
          frame(a, cam);
          expect(Math.abs(swapRatio(a, cam, from, to) - 1), `${from} to ${to}, frame ${i}`).toBeLessThan(HELD);
        }
      }
    });
  }

  it('is the failure it was without the lock (Chapter V\'s x1.04 at the lowest camera), and a few thousandths with it', () => {
    const cam = cameraWithPerspective(0.98);
    const off = yuna({ life: false, interimYaw: false });
    swapping(off, cam, 'idle', 'ko', false);
    const on = yuna({ life: false, interimYaw: false });
    swapping(on, cam, 'idle', 'ko');
    expect(Math.abs(swapRatio(off, cam, 'idle', 'ko') - 1)).toBeGreaterThan(CHECK);
    expect(Math.abs(swapRatio(on, cam, 'idle', 'ko') - 1)).toBeLessThan(HELD);
    expect(slotOf(on, 'ko').lock).toBeLessThan(0.97); // it drew the lying body a few percent smaller than the table's scale
  });

  it('holds when the figure is mirrored (an enemy\'s painting turned to face the other way)', () => {
    const cam = cameraWithPerspective(0.98);
    const a = yuna({ side: 'enemy', artFacing: 'right' });
    expect(a.mirrored).toBe(true);
    swapping(a, cam, 'idle', 'ko');
    frame(a, cam);
    expect(Math.abs(swapRatio(a, cam, 'idle', 'ko') - 1)).toBeLessThan(HELD);
  });

  it('holds with the body slid along the floor (the prone shift that keeps it off a neighbour) and with the figure in mid-lunge, squashed and tilted', () => {
    const cam = cameraWithPerspective(1.04);
    const a = yuna();
    swapping(a, cam, 'idle', 'ko');
    a.setProneShift(0.9);
    frame(a, cam);
    expect(Math.abs(swapRatio(a, cam, 'idle', 'ko') - 1)).toBeLessThan(HELD);

    const b = yuna();
    swapping(b, cam, 'idle', 'hurt');
    void b.lunge(1.4, 400);
    void b.squash(300, 1);
    for (let i = 0; i < 14; i++) frame(b, cam);
    expect(Math.abs(swapRatio(b, cam, 'idle', 'hurt') - 1)).toBeLessThan(HELD);
  });
});

describe('the strike solver\'s look at a pose it is not showing (PaintedActor.poseShape)', () => {
  const near = (a: ReadonlyArray<{ x: number; y: number; z: number }>, b: ReadonlyArray<{ x: number; y: number; z: number }>): void => {
    expect(a).toHaveLength(4);
    a.forEach((v, i) => {
      expect(v.x).toBeCloseTo(b[i]!.x, 6);
      expect(v.y).toBeCloseTo(b[i]!.y, 6);
      expect(v.z).toBeCloseTo(b[i]!.z, 6);
    });
  };

  it('is the plane the stage will draw, held to the idle\'s head: the box of a pose not yet showing is the box the pose has once it is', () => {
    const cam = cameraWithPerspective(0.98);
    const asked = yuna({ life: false, interimYaw: false });
    asked.setPose('idle', { immediate: true, force: true });
    frame(asked, cam);
    const shape = asked.poseShape('victory')!; // idle is showing; the blow, the cheer or the follow-through is not
    const drawn = yuna({ life: false, interimYaw: false });
    drawn.setPose('victory', { immediate: true, force: true });
    frame(drawn, cam);
    expect(slotOf(drawn, 'victory').lock).not.toBe(1);
    near(shape.corners, drawn.contentQuad());
  });

  it('differs from the table\'s box by what the lock does, and is the table\'s own where nothing holds the head', () => {
    const cam = cameraWithPerspective(0.98);
    const held = yuna({ life: false, interimYaw: false });
    held.setPose('idle', { immediate: true, force: true });
    frame(held, cam);
    const bare = yuna({ life: false, interimYaw: false });
    bare.setPose('idle', { immediate: true, force: true });
    frame(bare, cam, false);
    const a = held.poseShape('victory')!.corners;
    const b = bare.poseShape('victory')!.corners;
    const height = (q: ReadonlyArray<{ y: number }>): number => q[2]!.y - q[0]!.y;
    const shown = yuna({ life: false, interimYaw: false });
    shown.setPose('victory', { immediate: true, force: true });
    frame(shown, cam);
    const f = slotOf(shown, 'victory').lock;
    expect(Math.abs(f - 1)).toBeGreaterThan(0.01); // the camera asks for more than a percent of her here, which the table does not know
    expect(height(a) / height(b)).toBeCloseTo(f, 6); // and the solver is told exactly that much
  });

  it('is the showing pose\'s own box (contentQuad) for the pose that is showing, held or not', () => {
    const cam = cameraWithPerspective(1.04);
    for (const held of [true, false]) {
      const a = yuna({ life: false, interimYaw: false });
      a.setPose('hurt', { immediate: true, force: true });
      frame(a, cam, held);
      near(a.poseShape('hurt')!.corners, a.contentQuad());
    }
  });
});

describe('a revive under a camera that moved since the fall', () => {
  it('is held at x1.00 because the factor is recomputed every frame; a factor fixed at the swap would read what the camera did since', () => {
    const lowCam = cameraWithPerspective(0.98);
    const highCam = cameraWithPerspective(1.04);
    const a = yuna();
    swapping(a, lowCam, 'idle', 'ko');
    for (let i = 0; i < 20; i++) frame(a, lowCam);
    const lockedLow = slotOf(a, 'ko').lock;

    // the camera moves while the body lies there
    for (let i = 0; i < 20; i++) frame(a, highCam);
    const lockedHigh = slotOf(a, 'ko').lock;
    expect(lockedHigh - lockedLow).toBeGreaterThan(0.03); // the lying head wanted 4 percent less at the first camera and about 1 percent more at the second

    // ... and she is revived: the swap is read under the new camera
    a.setPose('idle', { force: true });
    frame(a, highCam);
    expect(Math.abs(swapRatio(a, highCam, 'ko', 'idle') - 1)).toBeLessThan(HELD);

    // control: the same fall, the same camera move, and a factor that stayed where the swap put it
    const frozen = yuna();
    swapping(frozen, lowCam, 'idle', 'ko');
    for (let i = 0; i < 20; i++) frame(frozen, lowCam);
    for (let i = 0; i < 20; i++) frame(frozen, highCam, false);
    frozen.setPose('idle', { force: true });
    frame(frozen, highCam, false);
    expect(Math.abs(swapRatio(frozen, highCam, 'ko', 'idle') - 1)).toBeGreaterThan(CHECK);
  });
});
