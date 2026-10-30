/**
 * MF-22 on the REAL `PaintedActor`, in each of the nineteen chapters (lane pc-scope, 2026-10-28; `motion/SwapSwitch.ts`; both games): under `?swapscope=wide` (the default since release 68) a hit is a cut on its cause in
 * every chapter but the three named exceptions (four until release 69), under `all` in every one of the nineteen, under `pack` (release 67's reach) in the two pack chapters only; everywhere else it is today's blend. The smear's style follows the same gate.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../../src/data/encounters.ts';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './head-lock-fixture.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setCurvesChapter, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { setMomentsMode } from '../../../src/engine/motion/MomentsSwitch.ts';
import { resetSmearLog, smearLog } from '../../../src/engine/motion/SmearLog.ts';
import { resetSwapLog } from '../../../src/engine/motion/SwapLog.ts';
import { SCOPE_EXCEPTIONS, setCauseMode, setStanceMode, setSwapScope, type SwapScope } from '../../../src/engine/motion/SwapSwitch.ts';
import { DEMO_CHAPTERS } from '../../../src/engine/motion/DemoGate.ts';
import type { CoarseMask } from '../../../src/engine/PoseAlign.ts';

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
  setSmearStyle('paint');
});
afterEach(() => {
  setSmearStyle(null);
  setMomentsMode(null);
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setCauseMode(null, null);
  setStanceMode(null);
  setSwapScope(null);
  setPaceGame('other');
  resetSmearLog();
  resetSwapLog();
  reset();
});

const N = 48;
const half = (left: boolean): CoarseMask => {
  const bits = new Uint8Array(N * N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) bits[r * N + c] = (c < N / 2) === left ? 1 : 0;
  return { w: N, h: N, bits };
};

function yuna(): Actor {
  const a = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  const paint = (pose: string, left: boolean) => painting('yuna', pose, { silhouette: half(left) });
  a.adoptPoses({ idle: paint('idle', true), hurt: paint('hurt', false), cast: paint('cast', false), ko: paint('ko', false) }, 'idle');
  a.position.set(-2, 0, 0);
  return a;
}

/** Ask for `pose` and step until the blend ends; the frames in which both paintings show, and how long it took (ms). */
function play(a: Actor, pose: string): { both: number; ms: number } {
  a.setPose(pose);
  let both = 0;
  let i = 0;
  for (; i < 60; i++) {
    a.update(1 / 60);
    const [p, q] = slotsOf(a);
    if (p.fade > 1e-6 && q.fade > 1e-6) both++;
    if (!a.blending && i > 1) break;
  }
  return { both, ms: (i + 1) * (1000 / 60) };
}

const IDS = CHAPTERS.map((c) => c.id);
const PACK = Object.keys(DEMO_CHAPTERS);

describe('a hit in each of the nineteen chapters', () => {
  const hitIn = (id: string, scope: SwapScope): { cut: boolean; both: number; logged: number } => {
    setCurvesChapter(id);
    setSwapScope(scope);
    setCauseMode('pick');
    resetSmearLog();
    const r = play(yuna(), 'hurt');
    return { cut: r.both === 0, both: r.both, logged: smearLog().filter((e) => e.cause === 'hit').length };
  };

  it('scope pack (release 67\'s reach): a cut in Chapter I and Chapter IV, today\'s see-through blend in the other seventeen', () => {
    let cuts = 0;
    for (const id of IDS) {
      const r = hitIn(id, 'pack');
      if (PACK.includes(id)) {
        cuts++;
        expect(r, id).toMatchObject({ cut: true, logged: 1 });
      } else {
        expect(r.both, id).toBeGreaterThan(3);
        expect(r.logged, id).toBe(0);
      }
    }
    expect(cuts).toBe(2);
  });

  it('scope wide: a cut in every chapter but the exceptions; the exceptions keep today\'s blend', () => {
    let cuts = 0;
    for (const id of IDS) {
      const r = hitIn(id, 'wide');
      if (id in SCOPE_EXCEPTIONS) {
        expect(r.both, id).toBeGreaterThan(3);
        expect(r.logged, id).toBe(0);
      } else {
        cuts++;
        expect(r, id).toMatchObject({ cut: true, logged: 1 });
      }
    }
    expect(cuts).toBe(19 - Object.keys(SCOPE_EXCEPTIONS).length);
  });

  it('scope all: a cut in every one of the nineteen, the exceptions included', () => {
    for (const id of IDS) expect(hitIn(id, 'all'), id).toMatchObject({ cut: true, logged: 1 });
  });

  it('the smear off is today\'s blend in every chapter and every scope (?smear=off beats the scope)', () => {
    setSmearStyle('off');
    for (const id of IDS) for (const scope of ['pack', 'wide', 'all'] as const) expect(hitIn(id, scope).logged, `${id} ${scope}`).toBe(0);
  });

  it('a hidden chapter (the 3D fayth chapter, the experiments) keeps today\'s blend under wide and pack; only the measuring word reaches it', () => {
    for (const id of ['fayth', 'windwaker']) {
      expect(hitIn(id, 'wide').logged, id).toBe(0);
      expect(hitIn(id, 'pack').logged, id).toBe(0);
      expect(hitIn(id, 'all').logged, id).toBe(1);
    }
  });

  it('an open FFX-2 command menu still allows no cut in the wide chapters (D-357): the rule is the pack\'s everywhere', async () => {
    const { setMenuHold } = await import('../../../src/engine/motion/MenuHold.ts');
    setMenuHold(() => true);
    for (const id of ['ffx2-trema', 'ffx2-leblanc']) {
      setCurvesChapter(id);
      setSwapScope('wide');
      setCauseMode('pick');
      resetSmearLog();
      play(yuna(), 'hurt');
      expect(smearLog(), id).toHaveLength(0);
    }
    setMenuHold(null);
  });
});
