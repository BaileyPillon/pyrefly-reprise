/**
 * MF-03 (motion-fluidity pass, lane L2 "moves"; curves audit C-01; both games, shared plumbing): the struck figure's reaction, three variants behind `?hit=` (`today` default, `ramp`, `knock`).
 *
 * The curve (`motion/HitReaction.ts`, pure), the presenter glue (`motion/HitBeat.ts`) and the REAL `PaintedActor` stepped on a 60, 120 and 144 Hz display. The numbers the plan sets for V2:
 * the first frame moves 3 px or less at the median, nothing moves toward the attacker, at most three reversals of direction, the size follows `hitPower`, and a hit-stop holds a deliberate frame.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaintedActor, painting, reset, type Actor } from './engine/head-lock-fixture.ts';
import { FADE_MS, KNOCK_MS, PEAK_MS, RAMP_MS, SQUASH_MS, hitSeed, knockAmplitude, knockShare, rattleAt, squashFor, squashShare, HitReaction, type HitOffset } from '../../src/engine/motion/HitReaction.ts';
import { hitReact, pushDirection } from '../../src/engine/motion/HitBeat.ts';
import { moveWord, moveWordFromSearch, setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { hitPower } from '../../src/engine/motion/DemoHit.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';

afterEach(() => {
  reset();
  setMoveWord('hit', null);
  setPaceGame('other');
  setPace('steady');
});

const PX = 146; // px per world unit at the party's depth, 1600 wide
const FRAME: Record<number, number> = { 60: 1000 / 60, 120: 1000 / 120, 144: 1000 / 144 };

describe('the switch word', () => {
  it('reads knock (the release 67 pick) unless ?hit= names today or ramp; today is the release 66 look', () => {
    expect(moveWordFromSearch(undefined, 'hit')).toBe('knock');
    expect(moveWordFromSearch('', 'hit')).toBe('knock');
    expect(moveWordFromSearch('?hit=today', 'hit')).toBe('today');
    expect(moveWordFromSearch('?hit=TODAY', 'hit')).toBe('today');
    expect(moveWordFromSearch('?hit=ramp', 'hit')).toBe('ramp');
    expect(moveWordFromSearch('?hit=KNOCK', 'hit')).toBe('knock');
    expect(moveWordFromSearch('?hit=wobble', 'hit')).toBe('knock');
    expect(moveWord('hit')).toBe('knock');
  });
  it('refuses a word the table does not list', () => {
    // @ts-expect-error a word outside the table
    expect(setMoveWord('hit', 'wobble')).toBe(false);
    expect(setMoveWord('hit', 'knock')).toBe(true);
    expect(moveWord('hit')).toBe('knock');
  });
});

/** The curves audit's velocity-jolt probe (`curves/jolts.mjs`): a frame-to-frame speed change of 2.5 px per 60 Hz frame or more AND 30 percent of the local peak speed (40 frames either side). */
function jolts(xs: number[], hz: number): number {
  const V = xs.map((x, i) => (i ? (x - xs[i - 1]!) * hz : 0)); // px per second
  let n = 0;
  for (let i = 3; i < xs.length - 3; i++) {
    const dv = Math.abs(V[i]! - V[i - 1]!);
    if (dv / 60 < 2.5) continue;
    let peak = 0;
    for (let k = Math.max(1, i - 40); k < Math.min(xs.length, i + 40); k++) peak = Math.max(peak, Math.abs(V[k]!));
    if (dv / (peak || 1) >= 0.3) n++;
  }
  return n;
}

describe('V2: the knock-back curve', () => {
  const at = (ms: number): number => knockShare(ms);
  it('starts at rest, peaks once at about 120 ms, swings back once through zero and ends exactly at rest', () => {
    expect(at(0)).toBe(0);
    let peak = 0;
    let peakMs = 0;
    let trough = 0;
    for (let t = 0; t <= KNOCK_MS + 20; t += 0.5) {
      const v = at(t);
      if (v > peak) [peak, peakMs] = [v, t];
      trough = Math.min(trough, v);
    }
    expect(peak).toBeGreaterThan(0.995);
    expect(peak).toBeLessThanOrEqual(1.0001);
    expect(Math.abs(peakMs - PEAK_MS)).toBeLessThan(6);
    expect(trough).toBeLessThan(-0.2); // one visible counter-swing
    expect(trough).toBeGreaterThan(-0.4);
    expect(at(KNOCK_MS)).toBe(0);
    expect(at(KNOCK_MS + 100)).toBe(0);
    expect(Math.abs(at(KNOCK_MS - FADE_MS))).toBeLessThan(0.1);
  });

  for (const hz of [60, 120, 144]) {
    it(`at ${hz} Hz the first frame is under 3 px for a middling blow and never moves toward the attacker`, () => {
      const amp = knockAmplitude(0.68, false, 0); // a 300-damage hit on a 1,100 HP girl
      let min = Infinity;
      for (let t = FRAME[hz]!; t < PEAK_MS; t += FRAME[hz]!) min = Math.min(min, amp * PX * at(t));
      const first = amp * PX * at(FRAME[hz]!) * (hz / 60); // px per 60 Hz frame at the speed of that first frame
      expect(first).toBeLessThan(3);
      expect(min).toBeGreaterThanOrEqual(0); // the rise never goes toward the attacker
    });

    it(`at ${hz} Hz it turns at most three times and the curves audit's jolt probe finds none (one at most for a crit)`, () => {
      for (const [amp, most] of [[knockAmplitude(0.3, false, 0), 0], [knockAmplitude(1, false, 0), 0], [knockAmplitude(1, true, 0), 1]] as const) {
        const xs: number[] = [0, 0, 0, 0];
        for (let t = FRAME[hz]!; t <= KNOCK_MS + 60; t += FRAME[hz]!) xs.push(amp * PX * at(t));
        const v = xs.map((x, i) => (i ? (x - xs[i - 1]!) * (hz / 60) : 0)); // px per 60 Hz frame
        let turns = 0;
        for (let i = 2; i < v.length; i++) if (Math.abs(v[i - 1]!) > 1.5 && Math.sign(v[i]!) !== Math.sign(v[i - 1]!) && Math.abs(v[i]!) > 1.5) turns++;
        expect(turns).toBeLessThanOrEqual(3);
        if (hz >= 120) expect(jolts(xs, hz)).toBeLessThanOrEqual(most);
      }
    });
  }

  it('the same wall time at every display rate: the displacement 200 ms after the blow agrees within one percent of the push', () => {
    const at200 = [60, 120, 144].map((hz) => {
      const r = new HitReaction();
      const out: HitOffset = { x: 0, y: 0, sy: 1 };
      r.start({ style: 'knock', amp: 0.12, dirX: 1, seed: 0.3, squash: 0.05 });
      let t = 0;
      let x = 0;
      while (t < 200 - 1e-6) {
        r.step(FRAME[hz]!, FRAME[hz]!, out);
        t += FRAME[hz]!;
        x = out.x;
      }
      return x / 0.12;
    });
    expect(Math.abs(at200[0]! - at200[1]!)).toBeLessThan(0.05);
    expect(Math.abs(at200[1]! - at200[2]!)).toBeLessThan(0.05);
  });

  it('the push follows the blow: lightest 0.05, full power 0.16, a crit a quarter more, a boss up to 40 percent less', () => {
    expect(knockAmplitude(0, false)).toBeCloseTo(0.05, 5);
    expect(knockAmplitude(1, false)).toBeCloseTo(0.16, 5);
    expect(knockAmplitude(1.5, false)).toBeLessThan(0.18);
    expect(knockAmplitude(0.5, true)).toBeCloseTo(knockAmplitude(0.5, false) * 1.25, 5);
    expect(knockAmplitude(0.5, false, 1)).toBeCloseTo(knockAmplitude(0.5, false, 0) * 0.6, 5);
    const a29 = knockAmplitude(hitPower(29, 1100), false);
    const a553 = knockAmplitude(hitPower(553, 1100), false);
    expect(a553).toBeGreaterThan(a29 * 1.5); // a 29-damage hit and a 553-damage hit no longer move the figure the same
    expect(squashFor(1, true)).toBeGreaterThan(squashFor(0, false));
  });

  it('the contact compression is up on the first frame and gone by SQUASH_MS', () => {
    expect(squashShare(0)).toBe(1);
    expect(squashShare(SQUASH_MS)).toBe(0);
    expect(squashShare(SQUASH_MS / 2)).toBeCloseTo(0.5, 5);
  });
});

describe('V1: the ramped, seeded rattle', () => {
  const o = { x: 0, y: 0 };
  it('starts at zero and reaches full size at RAMP_MS; V0 would have started at full size', () => {
    for (const phase of [0.3, 1.9, 4.4]) {
      expect(Math.abs(rattleAt(0, 340, 0.1, phase, true, o).x)).toBe(0);
      const full = rattleAt(RAMP_MS, 340, 0.1, phase, false, { x: 0, y: 0 });
      const ramped = rattleAt(RAMP_MS, 340, 0.1, phase, true, o);
      expect(ramped.x).toBeCloseTo(full.x, 9);
      expect(Math.abs(rattleAt(17, 340, 0.1, phase, true, o).x)).toBeLessThan(Math.abs(rattleAt(17, 340, 0.1, phase, false, { x: 0, y: 0 }).x) + 1e-12);
    }
  });
  it('is the same blow every take: the seed is a hash of the blow, 0 up to 1', () => {
    const a = hitSeed('tidus', 'mortiorchis', 0, 134, 77);
    expect(a).toBe(hitSeed('tidus', 'mortiorchis', 0, 134, 77));
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
    expect(a).not.toBe(hitSeed('tidus', 'mortiorchis', 1, 134, 78));
  });
  it('decays linearly to nothing at its length, as the shake it replaces did', () => {
    expect(Math.abs(rattleAt(340, 340, 0.1, 1.2, true, o).x)).toBe(0);
    expect(Math.abs(rattleAt(200, 340, 0.1, 1.2, true, o).x)).toBeLessThanOrEqual(0.1 * (140 / 340) + 1e-9);
  });
});

// ------------------------------------------------------------------ the presenter glue

interface Stub {
  position: { x: number; y: number; z: number };
  calls: string[];
  spec?: unknown;
  recoilArgs?: unknown[];
  shakeArgs?: unknown[];
  strikeHeft?: () => number;
  hitReact?: (s: unknown) => boolean;
  shake: (a?: number, ms?: number) => void;
  recoil: (ms?: number, d?: number, k?: unknown) => Promise<void>;
}

function stub(x: number, accept = true, withReact = true): Stub {
  const s: Stub = {
    position: { x, y: 0, z: 0 },
    calls: [],
    shake: (a, ms) => {
      s.calls.push('shake');
      s.shakeArgs = [a, ms];
    },
    recoil: (ms, d, k) => {
      s.calls.push('recoil');
      s.recoilArgs = [ms, d, k];
      return Promise.resolve();
    },
  };
  if (withReact) {
    s.hitReact = (spec) => {
      s.calls.push('hitReact');
      s.spec = spec;
      return accept;
    };
  }
  return s;
}

const event = (over: Record<string, unknown> = {}): never => ({ type: 'damage', seq: 7, targetId: 'tidus', sourceId: 'boss', amount: 300, element: 'physical', crit: false, hitIndex: 0, hitCount: 1, ...over }) as never;

function ctxOf(target: Stub, source?: Stub | undefined, side: 'party' | 'enemy' = 'party'): never {
  return {
    stage: { actor: (id: string) => (id === 'boss' ? source : id === 'tidus' ? target : undefined), sideOf: () => side },
    hpMaxOf: () => 1100,
  } as never;
}

describe('the presenter glue', () => {
  it('?hit=today (the release 66 look, no longer the default): the shake and the recoil exactly as before, nothing else', () => {
    setMoveWord('hit', 'today');
    const t = stub(-2);
    hitReact(ctxOf(t, stub(2)), event(), t as never, 360);
    expect(t.calls).toEqual(['shake', 'recoil']);
    expect(t.shakeArgs).toEqual([0.1, 340]);
    expect(t.recoilArgs).toEqual([360, 0.22, undefined]);
    const c = stub(-2);
    hitReact(ctxOf(c, stub(2)), event({ crit: true }), c as never, 360);
    expect(c.shakeArgs).toEqual([0.16, 340]);
    expect(c.recoilArgs).toEqual([360, 0.34, undefined]);
  });

  it('?hit=ramp: the rattle comes from the actor\'s reaction, not shake(); the recoil is today\'s', () => {
    setMoveWord('hit', 'ramp');
    const t = stub(-2);
    hitReact(ctxOf(t, stub(2)), event(), t as never, 360);
    expect(t.calls).toEqual(['hitReact', 'recoil']);
    expect(t.spec).toMatchObject({ style: 'ramp', amp: 0.1, ms: 340 });
    expect(t.recoilArgs).toEqual([360, 0.22, undefined]);
  });

  it('?hit=knock: pushed away from the attacker, sized by the blow, the recoil only keeps the pose and the hint', () => {
    setMoveWord('hit', 'knock');
    const t = stub(-2);
    hitReact(ctxOf(t, stub(2)), event({ amount: 553 }), t as never, 360);
    expect(t.calls).toEqual(['hitReact', 'recoil']);
    const spec = t.spec as { style: string; amp: number; dirX: number; squash: number };
    expect(spec.style).toBe('knock');
    expect(spec.dirX).toBe(-1); // the attacker stands to the right of a party figure: pushed left
    expect(spec.amp).toBeCloseTo(knockAmplitude(hitPower(553, 1100), false, 0), 9);
    expect(t.recoilArgs).toEqual([360, 0.22, { reach: spec.amp, ms: PEAK_MS }]);
    const e = stub(2);
    hitReact(ctxOf(e, stub(-2), 'enemy'), event({ targetId: 'tidus' }), e as never, 360);
    expect((e.spec as { dirX: number }).dirX).toBe(1);
  });

  it('?hit=knock with REDUCE MOTION (the actor answers false) or a figure with no reaction plays today\'s', () => {
    setMoveWord('hit', 'knock');
    const rm = stub(-2, false);
    hitReact(ctxOf(rm, stub(2)), event(), rm as never, 360);
    expect(rm.calls).toEqual(['hitReact', 'shake', 'recoil']);
    expect(rm.recoilArgs).toEqual([360, 0.22, undefined]);
    const plain = stub(-2, true, false);
    hitReact(ctxOf(plain, stub(2)), event(), plain as never, 360);
    expect(plain.calls).toEqual(['shake', 'recoil']);
  });

  it('pushDirection: away from an attacker on the field, else back from the side it stands on', () => {
    expect(pushDirection(ctxOf(stub(-2), stub(2)), event(), stub(-2) as never)).toBe(-1);
    expect(pushDirection(ctxOf(stub(2), stub(-2), 'enemy'), event(), stub(2) as never)).toBe(1);
    expect(pushDirection(ctxOf(stub(-2), undefined, 'party'), event({ sourceId: undefined }), stub(-2) as never)).toBe(-1);
    expect(pushDirection(ctxOf(stub(2), undefined, 'enemy'), event({ sourceId: 'tidus' }), stub(2) as never)).toBe(1); // a self-hit has no direction: the side decides
  });
});

// ------------------------------------------------------------------ the real actor

function girl(): Actor {
  const a = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  a.adoptPoses({ idle: painting('yuna', 'idle'), hurt: painting('yuna', 'hurt'), ko: painting('yuna', 'ko') }, 'idle');
  a.position.set(-2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  return a;
}
const innerOf = (a: Actor): { position: { x: number; y: number }; scale: { x: number; y: number } } => (a as unknown as { inner: { position: { x: number; y: number }; scale: { x: number; y: number } } }).inner;

describe('the real actor', () => {
  it('REDUCE MOTION: hitReact answers false and moves nothing', () => {
    const a = girl();
    a.still = () => true;
    expect(a.hitReact({ style: 'knock', amp: 0.12, dirX: -1, seed: 0.5, squash: 0.05 })).toBe(false);
    a.update(1 / 60);
    expect(innerOf(a).position.x).toBe(0);
  });

  for (const hz of [60, 120, 144]) {
    it(`at ${hz} Hz a knock pushes the figure away from the attacker and it comes to rest exactly where it began`, () => {
      const a = girl();
      a.update(0, 0);
      const x0 = innerOf(a).position.x;
      expect(a.hitReact({ style: 'knock', amp: 0.12, dirX: -1, seed: 0.5, squash: 0.05 })).toBe(true);
      let minX = Infinity;
      let toward = 0;
      for (let t = 0; t < KNOCK_MS + 200; t += FRAME[hz]!) {
        a.update(FRAME[hz]! / 1000);
        const dx = innerOf(a).position.x - x0;
        minX = Math.min(minX, dx);
        if (t < PEAK_MS && dx > 1e-6) toward++;
      }
      expect(minX).toBeLessThan(-0.11); // pushed left, to the full 0.12
      expect(toward).toBe(0);
      expect(innerOf(a).position.x - x0).toBeCloseTo(0, 9);
      expect(innerOf(a).scale.y).toBeCloseTo(1, 6);
    });
  }

  it('a hit-stop (field dt 0) holds the figure on the contact frame: at rest and compressed, then the push begins', () => {
    const a = girl();
    a.update(0, 0);
    const y0 = innerOf(a).scale.y;
    a.hitReact({ style: 'knock', amp: 0.12, dirX: -1, seed: 0.5, squash: 0.06 });
    for (let i = 0; i < 8; i++) a.update(0, 1 / 60); // eight frames of hit-stop: the field is frozen, real time runs
    expect(innerOf(a).position.x).toBe(0);
    expect(innerOf(a).scale.y).toBeLessThan(y0 - 0.05); // compressed by 6 percent while it holds
    for (let i = 0; i < 6; i++) a.update(1 / 60);
    expect(innerOf(a).position.x).toBeLessThan(-0.001);
  });

  it('a second blow in a string adds to the first and nothing snaps', () => {
    const a = girl();
    a.update(0, 0);
    a.hitReact({ style: 'knock', amp: 0.1, dirX: -1, seed: 0.1, squash: 0.04 });
    let last = 0;
    let worst = 0;
    for (let i = 0; i < 40; i++) {
      if (i === 8) a.hitReact({ style: 'knock', amp: 0.1, dirX: -1, seed: 0.2, squash: 0.04 });
      a.update(1 / 120);
      const x = innerOf(a).position.x;
      if (i) worst = Math.max(worst, Math.abs(x - last));
      last = x;
    }
    expect(worst * PX).toBeLessThan(3); // px in one 120 Hz frame
  });

  it('with no reaction asked for the actor draws exactly what it drew before this item (scale exactly 1, no offset)', () => {
    const a = girl();
    for (let i = 0; i < 30; i++) a.update(1 / 60);
    expect(innerOf(a).position.x).toBe(0);
    expect(innerOf(a).scale.y).toBe(1);
  });

  it('recoil with a knock hint plays the hurt painting and no push of its own', async () => {
    const a = girl();
    const p = a.recoil(360, 0.22, { reach: 0.12, ms: PEAK_MS });
    const spy = vi.fn();
    void p.then(spy);
    for (let i = 0; i < 20; i++) a.update(1 / 60);
    await Promise.resolve();
    expect(spy).toHaveBeenCalled();
    expect((a as unknown as { recoilOffset: number }).recoilOffset).toBe(0);
    expect(a.pose).toBe('hurt');
  });
});
