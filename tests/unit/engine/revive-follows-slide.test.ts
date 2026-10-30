/**
 * **A revived figure that lay slid off a neighbour stands up without a second jump** (release 69, the pop the release-68 gap pass found in FFX Chapter I, Tidus beside Kimahri's KO; BOTH games: the KO
 * topple and `ProneLay` are shared by FFX chapters 1-3 and FFX-2 chapters 4-6; Chapter I is the case that shows it, because its slide is 0.74 units while Chapter IV's is 0 and Chapter II's small).
 *
 * The revive plays the fall backwards on the standing plane: it crosses in already toppled where the body lay, then stands up from the floor pivot. While it is toppled it is slid so its head
 * meets the lying body's head (`living.ts` `meeting`, once read from the lying plane's own placement) and the slide eases away over the rise. Release 68 held `ProneLay`'s slide on the lying body until
 * the lying plane had faded (it fixed the first-frame jump of the visible KO painting); the hold ends at +75 ms, in the middle of the rise, and the lying plane then moved by the whole slide in one
 * frame. The slide target of the standing plane was read from the lying plane every frame and moved with it: the opaque standing plane jumped 0.57 units (89 px at 1600 wide in the live clip,
 * frame 6 at +117 ms; x 0.5805 to 0.0068).
 *
 * These tests run the REAL `PaintedActor` under the REAL `LivingFigure`, the REAL `layProneFigures` every frame (in the order of the stage: the mix, the actor, `layProneFigures`, the head lock), and
 * the real revive call (`setPose('idle')`), at 60, 120 and 144 Hz, with a standing neighbour that makes the stage slide the lying body, and with Chapter I's own slide (0.74 units).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setMoveWord } from '../../../src/engine/motion/MoveSwitch.ts';
import { layProneFigures } from '../../../src/engine/ProneLay.ts';
import { reset, viewOf } from './head-lock-fixture.ts';
import { anchors, ctxOf, figure, lying, record, rig, slots, type Rig } from './ko-fall-fixture.ts';
import { figureTrack } from '../../../critic/runner/lib/continuity-pure.mjs';
import type { Actor } from './head-lock-fixture.ts';

beforeEach(() => setMoveWord('kotopple', 'today'));
afterEach(() => {
  reset();
  setMoveWord('kotopple', null);
});

/** Chapter I's measured slide of the lying body, world units (the gap pass: the lying plane's mesh x went 0.74 to 0). */
const CHAPTER_ONE_SLIDE = 0.74;
/** Pixels at 1600 wide a world unit is in the live Chapter I clip (89.3 px for the 0.574 units the plane jumped). */
const PX_PER_UNIT = 155;
/**
 * The most a frame's step may change from the frame before it while the standing plane is showing and still moving, px at 1600 wide: a smooth slide has no kink; the jump was 89. The run's own last
 * step (the plane stops at its home from the speed the rise has there: 0.5 times the average for the tilt, the average for the slide, 3 to 5 px a frame at 60 Hz) is the rise's, not the release's, and is not counted.
 */
const KINK_PX = 3;

interface Scene {
  r: Rig;
  all: Actor[];
  game: 'ffx' | 'ffx2';
}

/** Tidus down beside a standing neighbour, laid by the stage's own pass at `hz`; `slide` (when given) is the lay the stage measured in the real chapter. */
function fallen(hz: number, slide?: number, game: 'ffx' | 'ffx2' = 'ffx'): Scene {
  const r = rig('tidus', { game });
  const neighbour = figure('yuna');
  neighbour.position.set(-2 + 0.6, 0, 0);
  neighbour.updateMatrixWorld(true);
  const s: Scene = { r, all: [r.a, neighbour], game };
  r.a.setPose('ko');
  for (let i = 0; i < Math.round(1.2 * hz); i++) step(s, hz);
  if (slide !== undefined) {
    r.a.setProneShift(slide);
    for (let i = 0; i < Math.round(0.2 * hz); i++) step(s, hz);
  }
  return s;
}

/** One frame of the game at `hz`, in the order of the stage: the mix (`updateLivingScene`), the actor, `layProneFigures`, the head lock. */
function step(s: Scene, hz: number): void {
  const dt = 1 / hz;
  s.r.living.update(ctxOf({ dt, realDt: dt, game: s.game }));
  s.r.a.update(dt, dt);
  layProneFigures(s.all, s.r.cam);
  s.r.a.holdHead(viewOf(s.r.cam));
  s.r.a.updateMatrixWorld(true);
}

const slideOf = (a: Actor): number => (a as unknown as { proneShift: number }).proneShift;
const standingPlane = (a: Actor): ReturnType<typeof slots>[number] => slots(a).find((p) => p.pose === 'idle')!;

interface Row {
  /** The tracked head, px at 1600 wide in the test's camera (the harness's point). */
  head: [number, number];
  /** The standing plane's mesh position and roll, world units / radians. */
  x: number;
  y: number;
  z: number;
  fades: [number, number];
  slide: number;
}

/** Revive and read `ms` of it frame by frame. `holdForever` is the control: the lying body's slide is never released (what the run shows when nothing moves the lying plane). */
function revive(s: Scene, hz: number, ms: number, holdForever = false): Row[] {
  const a = s.r.a;
  if (holdForever) {
    const real = a.setProneShift.bind(a);
    a.setProneShift = (dx: number): void => {
      if (dx !== 0) real(dx);
    };
  }
  const an = anchors(a);
  const rows: Row[] = [];
  const read = (): void => {
    const t = figureTrack(record(s.r), an as never);
    const p = standingPlane(a);
    rows.push({ head: t?.head ? [t.head[0], t.head[1]] : [NaN, NaN], x: p.mesh.position.x, y: p.mesh.position.y, z: p.mesh.rotation.z, fades: [lying(a).fade, p.fade], slide: slideOf(a) });
  };
  a.setPose('idle');
  read();
  for (let i = 0; i < Math.round((ms / 1000) * hz); i++) {
    step(s, hz);
    read();
  }
  return rows;
}

/** The standing figure's place at rest (the idle plane's own x, y and roll), read from a figure that never fell. */
function homeOf(hz: number): { x: number; y: number } {
  const r = rig('tidus');
  r.a.setPose('idle', { immediate: true, force: true });
  for (let i = 0; i < hz; i++) r.frame();
  const p = standingPlane(r.a);
  return { x: p.mesh.position.x, y: p.mesh.position.y };
}

describe('the revive of a figure lying slid off a neighbour: the opaque standing plane has no second jump', () => {
  it('the premise: the stage slid the lying body off her neighbour, and the revive makes the standing plane the active one at once', () => {
    const s = fallen(60);
    expect(Math.abs(slideOf(s.r.a))).toBeGreaterThan(0.1);
    s.r.a.setPose('idle');
    expect(s.r.a.isProne).toBe(false);
  });

  for (const hz of [60, 120, 144]) {
    for (const slide of [undefined, CHAPTER_ONE_SLIDE] as const) {
      const lay = slide === undefined ? "the stage's own lay" : `Chapter I's slide (${CHAPTER_ONE_SLIDE})`;

      it(`${hz} Hz, ${lay}: the standing plane and the tracked head move exactly as they do when the lying body's slide is never released`, () => {
        const real = revive(fallen(hz, slide), hz, 700);
        const control = revive(fallen(hz, slide), hz, 700, true);
        expect(real.length).toBe(control.length);
        let worstPlane = 0;
        let worstHead = 0;
        real.forEach((row, i) => {
          const c = control[i]!;
          worstPlane = Math.max(worstPlane, Math.abs(row.x - c.x), Math.abs(row.y - c.y), Math.abs(row.z - c.z));
          worstHead = Math.max(worstHead, Math.hypot(row.head[0] - c.head[0], row.head[1] - c.head[1]));
        });
        expect(worstPlane, "the largest difference in the standing plane's x, y and roll over the whole revive").toBeLessThan(1e-9);
        expect(worstHead, "the largest difference in the tracked head's place, px").toBeLessThan(0.01);
      });

      it(`${hz} Hz, ${lay}: while the standing plane shows, its slide has no kink over ${KINK_PX} px from one frame to the next`, () => {
        const rows = revive(fallen(hz, slide), hz, 700);
        const shown = rows.filter((r) => r.fades[1] >= 0.5 && r.slide !== undefined);
        expect(shown.length, 'the standing plane showed for most of the revive').toBeGreaterThan(Math.round(0.25 * hz));
        const first = rows.indexOf(shown[0]!);
        const dx = shown.slice(1).map((r, i) => (r.x - rows[first + i]!.x) * PX_PER_UNIT);
        while (dx.length && Math.abs(dx.at(-1)!) < 1e-9) dx.pop(); // the figure is home and still
        let kink = 0;
        for (let i = 1; i < dx.length; i++) kink = Math.max(kink, Math.abs(dx[i]! - dx[i - 1]!));
        expect(kink, `the largest change of the slide's step (steps ${dx.slice(0, 14).map((v) => v.toFixed(1)).join(' ')} ... px)`).toBeLessThanOrEqual(KINK_PX);
      });

      it(`${hz} Hz, ${lay}: it ends upright at home, the slide let go, the lying plane gone`, () => {
        const home = homeOf(hz);
        const rows = revive(fallen(hz, slide), hz, 700);
        const last = rows.at(-1)!;
        expect(last.fades).toEqual([0, 1]);
        expect(last.z).toBe(0);
        expect(last.slide).toBe(0);
        expect(Math.abs(last.x - home.x)).toBeLessThan(1e-9);
        expect(Math.abs(last.y - home.y)).toBeLessThan(1e-9);
      });
    }
  }

  it('FFX-2 (the mix is told the game): the same revive, the same plane, frame by frame', () => {
    const ffx = revive(fallen(60, CHAPTER_ONE_SLIDE, 'ffx'), 60, 700);
    const ffx2 = revive(fallen(60, CHAPTER_ONE_SLIDE, 'ffx2'), 60, 700);
    const control = revive(fallen(60, CHAPTER_ONE_SLIDE, 'ffx2'), 60, 700, true);
    ffx2.forEach((row, i) => {
      expect(Math.abs(row.x - control[i]!.x), `frame ${i} against the never-released control`).toBeLessThan(1e-9);
      expect(Math.abs(row.x - ffx[i]!.x), `frame ${i} against FFX's revive (the run is one shape for both games; the fall before it differs by 50 ms of buckle)`).toBeLessThan(1e-4);
    });
  });

  it('the eased revive (?kotopple=eased, a held switch) has no second jump either', () => {
    setMoveWord('kotopple', 'eased');
    const real = revive(fallen(60, CHAPTER_ONE_SLIDE), 60, 800);
    const control = revive(fallen(60, CHAPTER_ONE_SLIDE), 60, 800, true);
    real.forEach((row, i) => expect(Math.abs(row.x - control[i]!.x), `frame ${i}`).toBeLessThan(1e-9));
  });

  it('a figure revived with no slide on it (nothing beside it) is unchanged: the target is where the body lies', () => {
    const r = rig('tidus');
    const s: Scene = { r, all: [r.a], game: 'ffx' };
    r.a.setPose('ko');
    for (let i = 0; i < 72; i++) step(s, 60);
    expect(slideOf(r.a)).toBe(0);
    const rows = revive(s, 60, 700);
    expect(rows.at(-1)!.fades).toEqual([0, 1]);
    const dx = rows.slice(1).map((q, i) => Math.abs(q.x - rows[i]!.x) * PX_PER_UNIT);
    expect(Math.max(...dx), 'no frame of a revive from where the body fell moves the plane by a jump').toBeLessThan(KINK_PX + 5);
  });
});
