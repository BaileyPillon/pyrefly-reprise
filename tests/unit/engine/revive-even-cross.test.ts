/**
 * **A revive's first frames continue from the lying figure's place: no frame of the cross moves the weighted head or feet by 40 px** (r74-revive, PR-0570; BOTH games: the KO run, the living mix and the actor
 * layer are shared by FFX chapters 1 to 3 and FFX-2 chapters 4 to 6; measured in the FFX Chapter II (Yunalesca) fight, Wakka's revive 83 to 88 px four times and 131.5 px once).
 *
 * The cause is not the knock-out's eased floor slide (`ProneLay` / `SlideEase`; round 33b's suspect) and not release 69's slide target: the release-73 jobs read the same 88 px in release 70's draw
 * (`?treated=pack`), and the offline run below reads it with NO neighbour and so no slide at all. It is the revive's old cross: the lying painting crosses to the toppled standing one, whose head is set on the lying
 * head and whose body is longer than the curled lying one, and the harness's weighted FEET travel the whole distance between the two paintings' feet (300 to 420 px) in the few frames the cross takes, 0.31 of it
 * in each of the middle two of a 75 ms cross (the demo motion's 100 ms cross, the page's, is six frames and reads about the same). The cure (`motion/ReviveCross.ts`): a 200 ms cross whose share of the incoming
 * painting is even, so no frame takes more than a twelfth of the way; the lesser plane stays under `KO_CROSS_PEAK`. `?revive=today` plays release 73's cross.
 *
 * **These tests run in the PAGE's world** (the review of the first r74 commit, round 33b's major finding 1): the demo motion ON (it is the default in a page: `koCrossMs()` is 100 ms, not the 75 ms of a headless
 * test) and the live stage's camera (Wakka's standing painting 468.7 px tall, the recording read 460 to 474; `cameraAt(3)` at 8 units out is 388). In the headless world the first commit's 160 ms cross read
 * 34.7 px for Wakka; in the page it reads 43.4 (44.7 on a live run's frame times), over the line, which is why the cross is 200 ms (34.9 and 36.0). See `revive-even-fixture.ts`.
 *
 * They run the REAL `PaintedActor` under the REAL `LivingFigure` and the REAL `layProneFigures` (with the stage's clock where the slide eases), the real revive call (`setPose('idle')`), at 60, 120 and 144 Hz,
 * and read the figure the way the continuity harness does (`figureTrack`, `detectJerks`, the policy's own thresholds) with the harness's own anchors: the registered head and stance of each painting from
 * `docs/target/pose-measure.json`, and for a LYING painting the silhouette's stance (`estimateStance`), which the pose table leaves null. The approved paintings are not in a worktree, so the silhouette stances are
 * the table `KO_STANCE` in the fixture (a guard test re-measures them where the art is on disk). The pass is the px step: `detectJerks` reads nothing for release 73's cross either in this offline run (its ratio test
 * and its ballistic exemption pass a six-frame ramp that the live harness, with a whole fight around it, flags), so it is kept as a belt, not as the proof.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { KO_CROSS_PEAK } from '../../../src/engine/PoseBlend.ts';
import { TIMING } from '../../../src/engine/BattlePresenterEvents.ts';
import { REVIVE_EVEN_MS } from '../../../src/engine/KoFall.ts';
import { setMoveWord } from '../../../src/engine/motion/MoveSwitch.ts';
import { REVIVE_CROSS_MS, setReviveWord } from '../../../src/engine/motion/ReviveCross.ts';
import { TOPPLE_RAD } from '../../../src/engine/KoTip.ts';
import { reset } from './head-lock-fixture.ts';
import { headX, lying, slots } from './ko-fall-fixture.ts';
import { ALL, FFX, FFX2, HZS, LIMIT, downed, leavePage, pageWorld, revived, step, type Steps } from './revive-even-fixture.ts';

/** The margin a live run keeps under the 40 px line (a frame time is never exactly 1000 / hz): the worst of the ten figures reads 37.3 on the recording's frame times. */
const MARGIN = LIMIT - 1.5;
/** A live run's frame times around 60 Hz, as the Yunalesca recording read them (15.4 to 18.2 ms). */
const LIVE = [15.4, 18.2, 16.4, 17.6, 15.9, 18.0, 16.7, 15.6, 17.9, 16.1];

beforeEach(() => {
  setMoveWord('kotopple', 'today');
  pageWorld();
});
afterEach(() => {
  reset();
  leavePage();
  setMoveWord('kotopple', null);
  setReviveWord(null);
});
describe('the premise: release 73\'s cross (?revive=today) steps the weighted feet or head over 40 px in one frame at 60 Hz, in the page\'s world', () => {
  beforeEach(() => setReviveWord('today'));

  it('Wakka at 60 Hz reads the live number (83 to 91 px, the harness\'s four revives in the Yunalesca fight), with no neighbour and so no slide', () => {
    const steps = revived(downed('wakka', 60), 'wakka', 200);
    expect(steps.feet, `Wakka's largest one-frame step of the weighted feet (frame ${steps.feetAt}); the live harness read 88, 89.7 and 90.6 (once 131.5, on a 2.6 ms frame)`).toBeGreaterThan(80);
    expect(steps.feet).toBeLessThan(95);
    expect(steps.feetAt, 'in the middle of the six-frame (100 ms) cross').toBeGreaterThanOrEqual(3);
    expect(steps.feetAt).toBeLessThanOrEqual(5);
  });

  for (const subject of ALL) {
    it(`${subject} at 60 Hz steps over ${LIMIT} px in a frame of the cross`, () => {
      const steps = revived(downed(subject, 60), subject, 200);
      expect(Math.max(steps.feet, steps.head), `${subject}: feet ${steps.feet.toFixed(1)} (frame ${steps.feetAt}), head ${steps.head.toFixed(1)} (frame ${steps.headAt})`).toBeGreaterThan(LIMIT);
    });
  }
});

describe('r74: the even cross, read through the harness\'s maths at 60, 120 and 144 Hz', () => {
  beforeEach(() => setReviveWord('even'));

  for (const hz of HZS) {
    for (const [game, subjects] of [['ffx', FFX], ['ffx2', FFX2]] as const) {
      for (const subject of subjects) {
        it(`${game.toUpperCase()} ${subject} at ${hz} Hz: no one-frame step of the weighted feet or head reaches ${LIMIT} px, and the harness finds no jerk in the whole revive`, () => {
          const steps = revived(downed(subject, hz, 1200, { game }), subject, 520);
          expect(steps.feet, `feet, frame ${steps.feetAt}`).toBeLessThan(MARGIN);
          expect(steps.head, `head, frame ${steps.headAt}`).toBeLessThan(MARGIN);
          expect(steps.jerks).toEqual([]);
        });
      }
    }
  }

  it('Wakka, the widest gap between the two paintings, steps 35 px at 60 Hz and about half of that at 120 Hz: a cross of 160 ms (the first commit\'s) would read 43', () => {
    const at = (hz: number): number => revived(downed('wakka', hz), 'wakka', 520).feet;
    expect(at(60)).toBeGreaterThan(32);
    expect(at(60)).toBeLessThan(37);
    expect(at(120)).toBeLessThan(0.55 * at(60));
  });

  it('the cross is no worse than release 73\'s anywhere: for every figure and rate, the largest step is under today\'s', () => {
    for (const hz of HZS) {
      for (const subject of ALL) {
        setReviveWord('today');
        const was = revived(downed(subject, hz), subject, 520);
        setReviveWord('even');
        const now = revived(downed(subject, hz), subject, 520);
        const worst = (q: Steps): number => Math.max(q.feet, q.head);
        expect(worst(now), `${subject} at ${hz} Hz: ${worst(now).toFixed(1)} against today's ${worst(was).toFixed(1)}`).toBeLessThanOrEqual(worst(was) + 1e-9);
      }
    }
  });

  it('the largest step falls with the frame time: a twelfth of the way at 60 Hz, half of that at 120 Hz', () => {
    const at = (hz: number): number => {
      const q = revived(downed('wakka', hz), 'wakka', 200);
      return q.feet;
    };
    expect(at(120)).toBeLessThan(0.6 * at(60));
    expect(at(144)).toBeLessThan(at(120));
  });

  it('a live run\'s frame times (15.4 to 18.2 ms around 60 Hz, as the Yunalesca recording read them) keep every figure\'s step under the limit with a margin', () => {
    for (const subject of ALL) {
      const s = downed(subject, 60, 1200, { game: FFX2.includes(subject) ? 'ffx2' : 'ffx' });
      s.frameMs = LIVE;
      const steps = revived(s, subject, 520);
      expect(steps.feet, `${subject}: feet, frame ${steps.feetAt}`).toBeLessThan(MARGIN);
      expect(steps.head, `${subject}: head, frame ${steps.headAt}`).toBeLessThan(MARGIN);
    }
  });
});

describe('r74: the revive\'s first frames continue from the lying figure\'s place', () => {
  beforeEach(() => setReviveWord('even'));

  for (const hz of HZS) {
    it(`${hz} Hz: on the first frame the standing plane is toppled where the body lay, its head on the lying head, and it is the lesser of the two`, () => {
      const s = downed('wakka', hz);
      const a = s.r.a;
      const lyingHeadX = headX(s.r, lying(a));
      a.setPose('idle');
      step(s);
      const idle = slots(a).find((p) => p.pose === 'idle')!;
      expect(Math.abs(idle.mesh.rotation.z)).toBeGreaterThan(0.85 * TOPPLE_RAD);
      expect(Math.abs(headX(s.r, idle) - lyingHeadX), 'the standing plane\'s head against where the lying head was, px; the meeting is exact, what is left is the first frame of the rise (20 px is 4.3 percent of the figure height at the live camera, as 15 was at z 8)').toBeLessThan(20);
      expect(idle.fade, 'one frame of a 200 ms cross').toBeLessThan(0.25);
      expect(lying(a).fade).toBeGreaterThan(0.75);
    });

    it(`${hz} Hz: the lesser plane never shows more than the old cap, the cross ends at ${REVIVE_CROSS_MS} ms, and the figure is upright inside ${REVIVE_EVEN_MS} ms`, () => {
      const s = downed('wakka', hz);
      const a = s.r.a;
      a.setPose('idle');
      const idle = slots(a).find((p) => p.pose === 'idle')!;
      let upright = -1;
      let gone = -1;
      for (let i = 1; i <= Math.round(0.7 * hz); i++) {
        step(s);
        expect(Math.min(lying(a).fade, idle.fade), `frame ${i}`).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-9);
        if (gone < 0 && lying(a).fade === 0) gone = i;
        if (upright < 0 && idle.mesh.rotation.z === 0) upright = i;
      }
      const ms = (n: number): number => (n * 1000) / hz;
      expect(ms(gone)).toBeGreaterThanOrEqual(REVIVE_CROSS_MS - 1);
      expect(ms(gone)).toBeLessThan(REVIVE_CROSS_MS + 2000 / hz);
      expect(ms(upright)).toBeGreaterThanOrEqual(REVIVE_EVEN_MS - 1000 / hz);
      expect(ms(upright)).toBeLessThan(REVIVE_EVEN_MS + 2000 / hz);
      expect(ms(upright), 'inside the presenter\'s revive wait, with a frame to spare at 60 Hz').toBeLessThan(TIMING.revive);
    });

    it(`${hz} Hz: through the real actor the standing painting's share of the pair is the elapsed share of the cross on every frame (an even share; the old cross's square stretched to ${REVIVE_CROSS_MS} ms would not be)`, () => {
      const s = downed('wakka', hz);
      const a = s.r.a;
      a.setPose('idle');
      const idle = slots(a).find((p) => p.pose === 'idle')!;
      let checked = 0;
      for (let i = 1; (i * 1000) / hz < REVIVE_CROSS_MS - 1e-6; i++) {
        step(s);
        const share = idle.fade / (idle.fade + lying(a).fade);
        expect(share, `${hz} Hz frame ${i}`).toBeCloseTo((i * 1000) / hz / REVIVE_CROSS_MS, 6);
        checked++;
      }
      expect(checked).toBeGreaterThanOrEqual(Math.floor((REVIVE_CROSS_MS / 1000) * hz) - 1);
    });
  }

  it('the eased knock-out slide at the revive, at 60, 120 and 144 Hz: reviving before, in the middle of and after the 700 ms slide, the lying body stays where it lay on EVERY frame and no frame steps 40 px', () => {
    // The presenter holds a knock-out for TIMING.ko (620 ms: the fall's 320 and the landing squash) before the next event, so no revive comes sooner than that; 60 and 250 ms are mid-fall, kept from the first commit
    // at the policy's line, and a revive 10 ms after the fall (330 ms) reads 43 px at 60 Hz (the body is still in its landing squash), which is why the early ones are not held to the margin.
    for (const [lies, limit] of [[[60, 250], LIMIT], [[500, 620, 800, 1000, 1500], MARGIN]] as const) {
      for (const hz of HZS) {
        for (const lieMs of lies) {
          const s = downed('wakka', hz, lieMs, { neighbour: true, eased: true });
          const a = s.r.a;
          const ko = lying(a);
          const x0 = ko.mesh.position.x;
          const moved: number[] = [];
          const steps = revived(s, 'wakka', 520, (frame) => {
            // a revive stops the slide where it is (ProneLay `held`): the lying plane is where it was when the revive began on EVERY frame it is shown (once its fade is 0 nothing draws it and the slide may run on)
            if (ko.fade > 0.001 && Math.abs(ko.mesh.position.x - x0) > 1e-9) moved.push(frame);
          });
          expect(steps.feet, `${hz} Hz, revived after ${lieMs} ms lying: feet frame ${steps.feetAt}`).toBeLessThan(limit);
          expect(steps.head, `${hz} Hz, revived after ${lieMs} ms lying: head frame ${steps.headAt}`).toBeLessThan(limit);
          expect(steps.jerks).toEqual([]);
          expect(moved, `${hz} Hz, ${lieMs} ms: the frames on which the lying plane moved under the figure getting up`).toEqual([]);
        }
      }
    }
  });

  it('the slide target of the toppled body is read once when the revive begins: reviving mid-slide, the standing plane\'s head leaves the lying head by the rise alone', () => {
    for (const hz of HZS) {
      const s = downed('wakka', hz, 250, { neighbour: true, eased: true });
      const a = s.r.a;
      const lyingHead = headX(s.r, lying(a));
      a.setPose('idle');
      const idle = slots(a).find((p) => p.pose === 'idle')!;
      step(s);
      expect(Math.abs(headX(s.r, idle) - lyingHead), `${hz} Hz: the first frame of the rise, px`).toBeLessThan(20);
      for (let i = 0; i < Math.round((REVIVE_CROSS_MS / 1000) * hz); i++) {
        const before = lying(a).mesh.position.x; // where the body lies (the head lock rescales a plane while the pair crosses, so the screen position of its head is not the slide)
        step(s);
        if (lying(a).fade > 0.001) expect(Math.abs(lying(a).mesh.position.x - before), `${hz} Hz frame ${i}`).toBeLessThan(1e-9);
      }
    }
  });
});
