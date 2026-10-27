/**
 * The motion-fluidity pass, lane L1, on the REAL `PaintedActor` (MF-05 `?stance=`, MF-06 `?swapcause=`; both games, in the two pack chapters; every default is today's look).
 *
 * - `setPose('ready', { paint: 'idle' })` is the ready STANCE (state, lean, ring) on the idle painting: no painting change, no blend.
 * - `?stance=v3` makes the idle-to-ready change (and back) a 50 ms three-frame blend, in a menu too.
 * - `?swapcause=cut|blend3|pick` (+ `?swapclass=`) make a swap that has a cause on screen a cut inside the smear, or a 50 ms blend, whatever the speed of the figure; an open FFX-2 menu turns a cut into the blend (D-357).
 * - With every switch at its default the swaps are today's, in the pack chapters and outside them.
 *
 * Stepped frame by frame the way the game steps it.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './head-lock-fixture.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setCurvesChapter, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { setMenuHold } from '../../../src/engine/motion/MenuHold.ts';
import { setMomentsMode } from '../../../src/engine/motion/MomentsSwitch.ts';
import { resetSmearLog, smearLog } from '../../../src/engine/motion/SmearLog.ts';
import { resetSwapLog, swapLog } from '../../../src/engine/motion/SwapLog.ts';
import { setCauseMode, setStanceMode, setSwapScope } from '../../../src/engine/motion/SwapSwitch.ts';
import type { CoarseMask } from '../../../src/engine/PoseAlign.ts';

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
  setSmearStyle('paint');
  setCurvesChapter('ffx2-bahamut');
});
afterEach(() => {
  setSmearStyle(null);
  setMomentsMode(null);
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setCauseMode(null, null);
  setStanceMode(null);
  setSwapScope(null);
  setMenuHold(null);
  setPaceGame('other');
  resetSmearLog();
  resetSwapLog();
  reset();
});

const N = 48;
const mask = (solid: (col: number, row: number) => boolean): CoarseMask => {
  const bits = new Uint8Array(N * N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) bits[r * N + c] = solid(c, r) ? 1 : 0;
  return { w: N, h: N, bits };
};
const LEFT = mask((c) => c < N / 2);
const RIGHT = mask((c) => c >= N / 2);
const ALL = mask(() => true);

/** Yuna with the paintings the classes need; `idle` is `ALL`, every other painting `other`: LEFT/RIGHT share nothing, ALL/ALL agree. */
function yuna(other: CoarseMask = RIGHT): Actor {
  const a = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  const paint = (pose: string, sil: CoarseMask) => painting('yuna', pose, { silhouette: sil });
  a.adoptPoses(
    { idle: paint('idle', other === ALL ? ALL : LEFT), ready: paint('ready', other), hurt: paint('hurt', other), cast: paint('cast', other), item: paint('item', other), attack: paint('attack', other), follow: paint('follow', other), ko: paint('ko', other) },
    'idle',
  );
  a.position.set(-2, 0, 0);
  return a;
}

interface Rec {
  t: number;
  f0: number;
  f1: number;
  showing: string;
}
/** Ask for `pose` and step `frame` ms until the blend ends. */
function playSwap(a: Actor, pose: string, opts: { paint?: string } = {}, frame = 1000 / 60): Rec[] {
  const recs: Rec[] = [];
  a.setPose(pose, opts.paint ? { paint: opts.paint } : undefined);
  for (let i = 1; i <= 60; i++) {
    a.update(frame / 1000);
    const [p, q] = slotsOf(a);
    recs.push({ t: i * frame, f0: p.fade, f1: q.fade, showing: p.fade >= q.fade ? p.pose : q.pose });
    if (!a.blending && i > 1) break;
  }
  return recs;
}
const both = (r: Rec[]): number => r.filter((x) => x.f0 > 1e-6 && x.f1 > 1e-6).length;
const lasts = (r: Rec[]): number => r.length * (1000 / 60);

describe('the ready stance without the ready painting (MF-05 v1a, v1b)', () => {
  it('setPose(ready, { paint: idle }) keeps the idle painting and enters the ready state: no blend', () => {
    const a = yuna();
    a.setPose('ready', { paint: 'idle' });
    expect(a.blending).toBe(false);
    expect(slotsOf(a).find((s) => s.fade === 1)!.pose).toBe('idle');
    expect(a.lifeState).toBe('ready');
  });

  it('a later plain ready request then brings the ready painting in by a blend (v1a\'s wind-up)', () => {
    const a = yuna();
    a.setPose('ready', { paint: 'idle' });
    a.setPose('ready');
    expect(a.blending).toBe(true);
    const r = playSwap(yuna(), 'ready');
    expect(r.at(-1)!.showing).toBe('ready');
  });

  it('asking for the stance again on the idle painting is nothing (v1b\'s wind-up after the menu\'s stance)', () => {
    const a = yuna();
    a.setPose('ready', { paint: 'idle' });
    a.setPose('ready', { paint: 'idle' });
    expect(a.blending).toBe(false);
  });

  it('a plain ready request is today\'s: the ready painting, a blend', () => {
    const a = yuna();
    a.setPose('ready');
    expect(a.blending).toBe(true);
  });
});

describe('with every switch at its default', () => {
  it('a pose change is today\'s blend in the pack chapter: about 120 ms, both paintings showing together', () => {
    const r = playSwap(yuna(), 'hurt');
    expect(both(r)).toBeGreaterThan(3);
    expect(lasts(r)).toBeGreaterThan(100);
    expect(smearLog()).toHaveLength(0);
    expect(swapLog().designed).toHaveLength(0);
  });
});

describe('?stance=v3: the stance change is a 50 ms three-frame blend', () => {
  it('idle to ready and back, in the pack chapter, in a menu too', () => {
    setStanceMode('v3');
    setMenuHold(() => true);
    const up = playSwap(yuna(), 'ready');
    expect(lasts(up)).toBeLessThanOrEqual(67);
    expect(both(up)).toBeGreaterThanOrEqual(1);
    expect(both(up)).toBeLessThanOrEqual(3);
    expect(swapLog().designed).toHaveLength(1);
    expect(swapLog().designed[0]).toMatchObject({ actor: 'yuna', from: 'idle', to: 'ready', cls: 'stance', ms: 50 });
    const a = yuna();
    a.setPose('ready', { immediate: true });
    resetSwapLog();
    const down = playSwap(a, 'idle');
    expect(lasts(down)).toBeLessThanOrEqual(67);
    expect(swapLog().designed[0]).toMatchObject({ from: 'ready', to: 'idle', cls: 'stance' });
  });

  it('the menu opening on the drawing of her last spell is the stance too (cast to ready, 50 ms); ready to an action own drawing is not', () => {
    setStanceMode('v3');
    const a = yuna();
    a.setPose('cast', { immediate: true });
    resetSwapLog();
    const r = playSwap(a, 'ready');
    expect(lasts(r)).toBeLessThanOrEqual(67);
    expect(swapLog().designed[0]).toMatchObject({ from: 'cast', to: 'ready', cls: 'stance' });
    const b = yuna();
    b.setPose('ready', { immediate: true });
    expect(lasts(playSwap(b, 'cast'))).toBeGreaterThan(100);
  });

  it('is today\'s outside the pack chapters and for a change that is not the stance', () => {
    setStanceMode('v3');
    const hurt = playSwap(yuna(), 'hurt');
    expect(lasts(hurt)).toBeGreaterThan(100);
    setCurvesChapter('tourist-trap');
    const out = playSwap(yuna(), 'ready');
    expect(lasts(out)).toBeGreaterThan(100);
    expect(swapLog().designed).toHaveLength(0);
  });
});

describe('?swapcause: a swap with a cause on screen', () => {
  it('cut: a hit on a figure at rest is a cut inside the smear, one flip, never both paintings, logged as a cut on its cause', () => {
    setCauseMode('cut');
    const r = playSwap(yuna(), 'hurt');
    expect(both(r)).toBe(0);
    expect(r.filter((x, i) => i > 0 && x.showing !== r[i - 1]!.showing)).toHaveLength(1);
    expect(lasts(r)).toBeLessThanOrEqual(80);
    const log = smearLog();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ actor: 'yuna', from: 'idle', to: 'hurt', cause: 'hit', kind: 'plane' });
  });

  it('cut: a pair of drawings that agree is cut too, and the log says the engine meant it (big)', () => {
    setCauseMode('cut');
    const r = playSwap(yuna(ALL), 'hurt');
    expect(both(r)).toBe(0);
    expect(smearLog()[0]).toMatchObject({ cause: 'hit', big: true });
  });

  it('blend3: the same hit is a 50 ms blend, logged as a designed blend and not as a smear', () => {
    setCauseMode('blend3');
    const r = playSwap(yuna(), 'hurt');
    expect(lasts(r)).toBeLessThanOrEqual(67);
    expect(both(r)).toBeGreaterThanOrEqual(1);
    expect(both(r)).toBeLessThanOrEqual(3);
    expect(smearLog()).toHaveLength(0);
    expect(swapLog().designed).toEqual([expect.objectContaining({ actor: 'yuna', from: 'idle', to: 'hurt', cls: 'hit', ms: 50 })]);
  });

  it('pick: the cut where the moment has a cover (the hit, the glow, the contact), the blend where it has none (the recovery, the cast\'s end, the return home)', () => {
    setCauseMode('pick');
    const a = yuna();
    expect(both(playSwap(a, 'hurt'))).toBe(0); // the hit: a cut
    const b = yuna();
    b.setPose('hurt', { immediate: true });
    resetSmearLog();
    const rec = playSwap(b, 'idle'); // the recovery: a blend
    expect(lasts(rec)).toBeLessThanOrEqual(67);
    expect(smearLog()).toHaveLength(0);
    expect(swapLog().designed.at(-1)).toMatchObject({ cls: 'recover' });
    const c = yuna();
    expect(both(playSwap(c, 'cast'))).toBe(0); // the glow: a cut
    const d = yuna();
    d.setPose('follow', { immediate: true });
    resetSwapLog();
    playSwap(d, 'idle');
    expect(swapLog().designed.at(-1)).toMatchObject({ cls: 'home' });
  });

  it('swapclass limits it to the classes named; the others are today\'s', () => {
    setCauseMode('cut', ['hit']);
    expect(both(playSwap(yuna(), 'hurt'))).toBe(0);
    const cast = playSwap(yuna(), 'cast');
    expect(both(cast)).toBeGreaterThan(3);
    expect(lasts(cast)).toBeGreaterThan(100);
  });

  it('an open FFX-2 command menu allows no cut and no flash (D-357): a cut asked for there is the 50 ms blend; today\'s stays today\'s', () => {
    setMenuHold(() => true);
    setCauseMode('cut');
    const r = playSwap(yuna(), 'hurt');
    expect(smearLog()).toHaveLength(0);
    expect(lasts(r)).toBeLessThanOrEqual(67);
    expect(swapLog().designed[0]).toMatchObject({ cls: 'hit' });
    setCauseMode('today');
    resetSwapLog();
    const t = playSwap(yuna(), 'hurt');
    expect(lasts(t)).toBeGreaterThan(100);
    expect(swapLog().designed).toHaveLength(0);
  });

  it('a knock-out and the pack\'s other chapters are never touched', () => {
    setCauseMode('cut');
    const ko = playSwap(yuna(), 'ko');
    expect(smearLog().filter((e) => e.cause)).toHaveLength(0);
    expect(ko.length).toBeGreaterThan(0);
    setCurvesChapter('tourist-trap');
    const out = playSwap(yuna(), 'hurt');
    expect(lasts(out)).toBeGreaterThan(100);
  });

  it('the smear off keeps today\'s blend whatever the cause word says', () => {
    setSmearStyle('off');
    setCauseMode('cut');
    const r = playSwap(yuna(), 'hurt');
    expect(lasts(r)).toBeGreaterThan(100);
    expect(smearLog()).toHaveLength(0);
  });
});

describe('?swapscope=all (MF-22): the looks in any chapter', () => {
  it('a cut on its cause and the stance blend play in a chapter outside the pack; without the word they do not', () => {
    setCurvesChapter('yunalesca');
    setCauseMode('cut');
    setStanceMode('v3');
    expect(lasts(playSwap(yuna(), 'hurt'))).toBeGreaterThan(100); // pack scope: today's blend
    expect(smearLog()).toHaveLength(0);
    setSwapScope('all');
    resetSmearLog();
    const hit = playSwap(yuna(), 'hurt');
    expect(both(hit)).toBe(0);
    expect(smearLog()[0]).toMatchObject({ cause: 'hit', to: 'hurt' });
    const up = playSwap(yuna(), 'ready');
    expect(lasts(up)).toBeLessThanOrEqual(67);
    expect(swapLog().designed.at(-1)).toMatchObject({ cls: 'stance' });
  });
});
