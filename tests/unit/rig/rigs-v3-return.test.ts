/**
 * rigs-v3 (2026-10-29; both games, shared plumbing; Rikku's Dark Knight FFX-2 and Tidus FFX are the rigs it reaches, behind `?partyrigs=`): the way a rig drawn by pose comes home from a strike, and the fold of a move in which a bone turns a long way.
 *
 * The clips of 2026-10-29 (Rikku, FFX-2 Chapter IV, follow to idle): "four frames of a visibly broken figure" (the greatsword turning flat across a body drawn in the other pose: 149 degrees in a 132 ms move at the page's pace) and
 * "the rig comes home 0.3 s after the painting" (its follow key lasted 36 frames, the painting's 18: the MF-11 hold, `RigHandoff.ts`, which a boss needs and a party figure drawn by pose does not).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { reset } from '../engine/head-lock-fixture.ts';
import { drawsKoByPose, makeRigKoHost } from '../../../src/engine/rig/RigKoHost.ts';
import { FOLD_FROM_MS, FOLD_MS, FOLD_RAD, SLOW_MS, foldMs, maxTurn, shortestWay } from '../../../src/engine/rig/RigFold.ts';
import { poseDrawnRig, readRig, rigged, type RigActorT } from './rigs-v3-fixture.ts';

const { setMoveWord } = await import('../../../src/engine/motion/MoveSwitch.ts');
const { setCurvesChapter, setCurvesMode } = await import('../../../src/engine/motion/CurvesSwitch.ts');
const { setPace, setPaceGame } = await import('../../../src/engine/pace.ts');

afterEach(() => {
  reset();
  setMoveWord('rigko', null);
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setPaceGame('other');
  setPace('steady');
});

const run = (a: RigActorT, ms: number, hz = 60, each: (t: number) => void = () => {}): void => {
  const dt = 1000 / hz;
  for (let t = dt; t <= ms + 1e-6; t += dt) {
    a.update(dt / 1000);
    each(t);
  }
};

describe('RigFold: a move in which a bone turns a long way is a short one, and a rotation takes the short way round', () => {
  const ch = (rots: number[]): Float64Array => Float64Array.from(rots.flatMap((r) => [r, 0, 0, 1, 1]));

  it('maxTurn is the largest difference of any bone\'s rotation, the shorter way round', () => {
    expect(maxTurn(ch([0, 0.5]), ch([0.2, -1.5]))).toBeCloseTo(2.0, 12);
    expect(maxTurn(ch([2.6]), ch([0]))).toBeCloseTo(2.6, 12);
    expect(maxTurn(ch([0]), ch([4.2])), 'Tidus\'s forearm in `attack` is 242 degrees: 118 the other way').toBeCloseTo(2 * Math.PI - 4.2, 12);
    expect(maxTurn(ch([]), ch([]))).toBe(0);
  });

  it('shortestWay moves a rotation by whole turns to the angle nearest the start, leaves everything else alone, and is the same array when nothing changes', () => {
    const from = ch([0, 1]);
    const to = Float64Array.from([4.2, 0.25, -3, 1, 1, 3.5, 0, 0, 1.5, 1.5]); // bone 0: 4.2 is more than pi away; bone 1: 3.5 - 1 = 2.5 is less, left
    const out = shortestWay(from, to);
    expect(out).not.toBe(to);
    expect(out[0]).toBeCloseTo(4.2 - 2 * Math.PI, 12);
    expect(out.slice(1, 5)).toEqual(to.slice(1, 5));
    expect(out[5]).toBe(3.5);
    expect(out.slice(6)).toEqual(to.slice(6));
    expect(to[0], 'the shared compiled key is never written').toBe(4.2);
    const near = ch([0.5, 2]);
    expect(shortestWay(from, near)).toBe(near);
    expect(shortestWay(ch([0]), ch([-4.2]))[0]).toBeCloseTo(-4.2 + 2 * Math.PI, 12);
  });

  it('a move that turns FOLD_RAD or more takes FOLD_MS if the file authored it at 100 to 199 ms; a shorter turn, a shorter key and a slow key (critical, sleep, victory, ko: 200 and over) are played as asked', () => {
    expect(FOLD_RAD).toBeCloseTo((115 * Math.PI) / 180, 1);
    expect([FOLD_FROM_MS, SLOW_MS, FOLD_MS]).toEqual([100, 200, 50]);
    expect(foldMs(120, ch([0]), ch([FOLD_RAD]))).toBe(FOLD_MS);
    expect(foldMs(150, ch([FOLD_RAD]), ch([0]))).toBe(FOLD_MS);
    expect(foldMs(FOLD_FROM_MS, ch([0]), ch([3]))).toBe(FOLD_MS);
    expect(foldMs(SLOW_MS - 1, ch([0]), ch([3]))).toBe(FOLD_MS);
    expect(foldMs(SLOW_MS, ch([0]), ch([3]))).toBe(SLOW_MS);
    expect(foldMs(260, ch([0]), ch([3]))).toBe(260);
    expect(foldMs(70, ch([0]), ch([3])), 'already 4 frames: a shorter move would only step the figure further a frame').toBe(70);
    expect(foldMs(120, ch([0]), ch([FOLD_RAD - 0.01]))).toBe(120);
    expect(foldMs(120, ch([0]), ch([4.2])), 'a 242 degree key is a 118 degree turn: over the line of 115, so it is capped').toBe(FOLD_MS);
    expect(foldMs(120, ch([0]), ch([5.0])), 'and a 286 degree key is a 74 degree turn: under it').toBe(120);
  });
});

describe('RigActor: the fold rule is the pose-drawn party figure\'s own', () => {
  it('a pose-drawn party rig plays idle > cast (a bone turns 143 degrees) in FOLD_MS at the page\'s pace and cast > idle likewise; the key\'s own ms stays what the file says', async () => {
    setPaceGame('ffx2');
    const a = await rigged(poseDrawnRig(true));
    expect(a.poseDrawnParty).toBe(true);
    a.update(0);
    let busy = 0;
    a.setPose('cast');
    run(a, 400, 60, () => { if (a.blending) busy++; });
    expect(a.pose).toBe('cast');
    expect(busy, `${FOLD_MS} ms x 1.1 is 3 frames at 60 Hz`).toBeLessThanOrEqual(4);
    expect(busy).toBeGreaterThanOrEqual(2);
    busy = 0;
    a.setPose('idle');
    run(a, 400, 60, () => { if (a.blending) busy++; });
    expect(busy).toBeLessThanOrEqual(4);
    expect(a.pose).toBe('idle');
  });

  it('a move that turns less is played as asked (the fixture\'s ko key is 420 ms: 1.5 radians), and `immediate` is still a snap', async () => {
    setPaceGame('ffx2');
    const a = await rigged(poseDrawnRig(true));
    a.update(0);
    let busy = 0;
    a.moveKey('ko');
    run(a, 800, 60, () => { if (a.blending) busy++; });
    expect(busy).toBeGreaterThanOrEqual(25); // 420 ms x 1.1 = 462 ms = 28 frames
    a.moveKey('idle', { immediate: true });
    expect(a.blending).toBe(false);
  });

  it('the bone turns the short way round: a key whose rotation is stored as 5.0 radians is reached by a turn of 1.28 the other way, never past pi from where the figure was', async () => {
    const f = poseDrawnRig(true);
    f.keys['cast'] = { ...f.keys['cast']!, bones: { chest: { rot: 5.0 } }, ms: 150 };
    const a = await rigged(f);
    a.update(0);
    const chest = a.figure.skeleton.data.boneIndex.get('chest')! * 5;
    let widest = 0;
    a.setPose('cast');
    run(a, 400, 60, () => { widest = Math.max(widest, Math.abs(a.figure.skeleton.pose[chest]!)); });
    expect(widest, 'it never went round the long way (5.0)').toBeLessThanOrEqual(2 * Math.PI - 5.0 + 1e-9);
    expect(a.figure.skeleton.pose[chest]!, 'it ends on the equivalent angle').toBeCloseTo(5.0 - 2 * Math.PI, 9);
    const boss = await rigged(f, 'enemy');
    boss.update(0);
    let long = 0;
    boss.setPose('cast');
    run(boss, 400, 60, () => { long = Math.max(long, Math.abs(boss.figure.skeleton.pose[boss.figure.skeleton.data.boneIndex.get('chest')! * 5]!)); });
    expect(long, 'a figure that is not drawn by pose keeps the raw interpolation').toBeCloseTo(5.0, 9);
  });

  it('the short way is measured from where the figure IS, not from the idle: from a key that stores 3.0 radians to one that stores -3.0 the turn is 0.28 forward, never back through 0 (review m2, mutant N21: every other test starts from the idle)', async () => {
    const f = poseDrawnRig(true);
    f.keys['cast'] = { ...f.keys['cast']!, bones: { chest: { rot: 3.0 } }, ms: 150 };
    f.keys['hurt'] = { bones: { chest: { rot: -3.0 } }, source: 'characters/tidus/hurt', ms: 150 };
    const a = await rigged(f);
    a.update(0);
    const chest = a.figure.skeleton.data.boneIndex.get('chest')! * 5;
    a.setPose('cast');
    run(a, 400, 60);
    expect(a.figure.skeleton.pose[chest]!).toBeCloseTo(3.0, 9);
    let lowest = Infinity;
    a.setPose('hurt');
    run(a, 400, 60, () => { lowest = Math.min(lowest, a.figure.skeleton.pose[chest]!); });
    expect(lowest, 'it never went back through 0 (the long way is 6 radians; from the idle\'s base -3.0 would be left as it is)').toBeGreaterThanOrEqual(3.0 - 1e-9);
    expect(a.figure.skeleton.pose[chest]!, 'it ends on the equivalent angle, 2 pi less than 3.283').toBeCloseTo(-3.0 + 2 * Math.PI, 9);
  });

  it('a rig that is not drawn by pose, or is not on the party\'s side, keeps its key times (the bosses, Lulu, the aeons: nothing a player sees today changes)', async () => {
    setPaceGame('ffx2');
    const boss = await rigged(poseDrawnRig(true), 'enemy');
    expect(boss.poseDrawnParty).toBe(false);
    boss.update(0);
    let busy = 0;
    boss.setPose('cast');
    run(boss, 600, 60, () => { if (boss.blending) busy++; });
    expect(busy, '150 ms x 1.1 = 165 ms: 10 frames').toBeGreaterThanOrEqual(9);
    const bent = await rigged(poseDrawnRig(true, false));
    expect(bent.poseDrawnParty).toBe(false);
  });
});

describe('RigHandoff: the idle request of a pose-drawn party rig is not held until the strike is over', () => {
  async function striking(side: 'party' | 'enemy'): Promise<RigActorT> {
    setCurvesChapter('ffx2-bahamut');
    setCurvesMode('new');
    setPaceGame('ffx2');
    setMoveWord('rigko', 'whole');
    const a = await rigged(poseDrawnRig(true), side);
    a.update(0);
    a.setPose('cast');
    void a.strike({ distance: 1.4, game: 'ffx2', timeScale: 1, arc: true });
    run(a, 700, 60);
    expect(a.striking, 'the strike is still sliding home').toBe(true);
    return a;
  }

  it('party, drawn by pose: the idle key is asked for at once, as the painting set\'s idle painting is', async () => {
    const a = await striking('party');
    a.setPose('idle');
    expect(a.pose).toBe('idle');
  });

  it('a boss (the same keys on the enemy side) keeps MF-11\'s hold: the key stays on the strike\'s pose while it slides home', async () => {
    const a = await striking('enemy');
    a.setPose('idle');
    expect(a.pose).toBe('cast');
  });
});

describe('RigKoHost: what the KO run reads of a rig', () => {
  it('only a rig whose ko key draws the lying painting\'s pieces (three parts with an image of their own) has one', () => {
    const read = (f: ReturnType<typeof poseDrawnRig>) => {
      const r = readRig(f);
      if (!r.ok) throw new Error(r.reason);
      return r.data;
    };
    expect(drawsKoByPose(read(poseDrawnRig(true)))).toBe(true);
    expect(drawsKoByPose(read(poseDrawnRig(true, false)))).toBe(false);
    const two = poseDrawnRig(true);
    two.keys['ko'] = { ...two.keys['ko']!, parts: { legs: { image: 'ko' }, body: { image: 'ko' } } };
    expect(drawsKoByPose(read(two)), 'two pieces with an image of their own are not a lying drawing (review m2, mutant N12)').toBe(false);
    const hidden = poseDrawnRig(true);
    hidden.keys['ko'] = { ...hidden.keys['ko']!, parts: { legs: { image: 'ko' }, body: { image: 'ko' }, head: { image: 'ko', show: false } } };
    expect(drawsKoByPose(read(hidden)), 'a hidden piece does not count').toBe(false);
    expect(makeRigKoHost(read(poseDrawnRig(true, false)), () => 'idle', () => {}, () => {})).toBeNull();
  });

  it('the lying head is the ko key\'s head landmark, on the right of the plane for a body that lies to the right and on the left for one that lies to the left; the span is the gate\'s box', () => {
    const r = readRig(poseDrawnRig(true));
    const l = readRig(poseDrawnRig(false));
    if (!r.ok || !l.ok) throw new Error('fixture does not read');
    const flips: string[] = [];
    const settles: number[] = [];
    const right = makeRigKoHost(r.data, (n) => n, (k) => flips.push(k), (ms) => settles.push(ms))!;
    const left = makeRigKoHost(l.data, (n) => n, () => {}, () => {})!;
    const standHead: [number, number, number, number] = [0.5, 0.12, 0.62, 0.19];
    const a = right.lying(standHead);
    const b = left.lying(standHead);
    expect(a.head![0]).toBeGreaterThan(0.5);
    expect(b.head![2]).toBeLessThan(0.5);
    expect(a.head![2] - a.head![0], 'the head box keeps the standing head\'s size').toBeCloseTo(0.12, 9);
    expect(a.u1).toBeGreaterThan(a.u0);
    right.flip('ko');
    expect(flips).toEqual(['ko']);
    expect(right.keyFor('ko')).toBe('ko');
    right.settle(132);
    expect(settles, 'the settle closure the actor made is handed through').toEqual([132]);
  });
});
