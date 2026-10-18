/**
 * FB-1 (visual-and-feel pass, 2026-10-10; PR-0379; both games): **one owned pose blend per actor** (`src/engine/PoseBlend.ts`).
 *
 * The controller is pure arithmetic on two planes' fades, so this file tests it as properties over random request sequences: gaps of 0 to 400 ms,
 * 30 / 60 / 120 / 144 fps, a random phase for the first frame, frames of zero time (a hit-stop holding the clock) dropped in at random, and blend
 * lengths of 120 and 140 ms (the party's and the foes'). The real `PaintedActor` through the same seam is `painted-actor-blend.test.ts`.
 *
 * The replica of the diagnosis (the measured FFX attack-to-follow plateau, and the owned blend against it) is `pose-blend-replica.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import { Easing } from '../../../src/engine/Tween.ts';
import { KO_CROSS, KO_CROSS_PEAK, PoseBlend, QUAD_IN_OUT, REPOINT_BELOW, koCross, type BlendPlane } from '../../../src/engine/PoseBlend.ts';

// ---------------------------------------------------------------- a deterministic generator

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- the seam, as PaintedActor.setPose drives it

type Idx = 0 | 1;

class Rig {
  readonly planes: [BlendPlane, BlendPlane] = [
    { fade: 1, pose: 'idle' },
    { fade: 0, pose: '' },
  ];
  active: Idx = 0;
  readonly blend = new PoseBlend(this.planes);

  request(key: string, ms: number): ReturnType<PoseBlend['request']> {
    const plan = this.blend.request(key, ms, this.active);
    if (plan.same) return plan;
    if (!plan.reversed) this.planes[plan.to].pose = key; // PaintedActor.applyPose
    this.active = plan.to;
    return plan;
  }

  /** One frame of the blend, then what `PaintedActor.update` does with a request PoseBlend rule 2 held and has begun on its own (`takeStart`). True when one began. */
  step(ms: number): boolean {
    this.blend.advance(ms);
    const s = this.blend.takeStart();
    if (!s) return false;
    if (!s.plan.reversed) this.planes[s.plan.to].pose = s.key; // PaintedActor.applyPose
    this.active = s.plan.to;
    return true;
  }

  fades(): [number, number] {
    return [this.planes[0].fade, this.planes[1].fade];
  }

  /** What the harness reads: the fade of each painting key (planes that hold one key add up), keys above `min` only. */
  keysAbove(min: number): string[] {
    const by = new Map<string, number>();
    for (const p of this.planes) if (p.pose) by.set(p.pose, (by.get(p.pose) ?? 0) + p.fade);
    return [...by].filter(([, f]) => f > min).map(([k]) => k);
  }
}

const KEYS = ['idle', 'ready', 'attack', 'follow', 'hurt', 'cast', 'ko'] as const;
const FPS = [30, 60, 120, 144] as const;
const LENGTHS = [120, 140] as const;
const EPS = 1e-9;

interface Trace {
  fades: Array<[number, number]>;
  keys: string[][];
}

/** A check cheap enough for the inner loop (vitest's `expect` costs about a millisecond a call, and this runs a million of them): throws with the message. */
function ok(cond: boolean, msg: () => string): void {
  if (!cond) throw new Error(msg());
}
const same2 = (a: readonly [number, number], b: readonly [number, number]): boolean => a[0] === b[0] && a[1] === b[1];

/**
 * One random run: requests at random gaps (0 to 400 ms; a gap of 0 is the same frame), frames of `1000 / fps` ms from a random phase, some of them
 * zero-time. Asserts every invariant as it goes, and returns the trace so a second run can be compared.
 */
function run(seed: number, fps: number, ms: number): Trace {
  const tag = (): string => `seed ${seed}, ${fps} fps, ${ms} ms`;
  const rnd = mulberry32(seed * 7919 + fps * 31 + ms);
  const rig = new Rig();
  const frame = 1000 / fps;
  const trace: Trace = { fades: [], keys: [] };
  let nextAt = rnd() * 150;
  let clock = 0; // wall time of this frame's start
  const phase = rnd() * frame; // the first frame is a partial one
  let requested = 0;
  let lastKey = 'idle';
  let lastRequestPositive = 0; // positive-dt time since the last request
  let prev: [number, number] = rig.fades();

  const total = 2600;
  while (clock < total) {
    // --- requests due by now (any number, the same frame included)
    while (nextAt <= clock && requested < 14 && clock < total - 900) {
      const key = KEYS[Math.floor(rnd() * KEYS.length)]!;
      const pre = rig.fades();
      const preKeys: [string, string] = [rig.planes[0].pose, rig.planes[1].pose];
      const preActive = rig.active;
      const preBlending = rig.blend.blending;
      const plan = rig.request(key, ms);
      if (plan.same && plan.deferred) {
        // rule 2: a painting that still shows is never dropped; the request waits, nothing moves, and the running blend goes on
        const other: Idx = preActive === 0 ? 1 : 0;
        const weak: Idx = pre[other] > pre[preActive] ? preActive : other;
        ok(same2(rig.fades(), pre) && rig.active === preActive, () => `${tag()}: a held request moved something`);
        ok(preBlending && rig.blend.blending && rig.blend.holding, () => `${tag()}: a request is only held while a blend runs, and it is then held`);
        ok(pre[weak] >= REPOINT_BELOW, () => `${tag()}: held although the weaker plane was only ${pre[weak]}`);
      } else if (plan.same) {
        ok(same2(rig.fades(), pre) && rig.active === preActive, () => `${tag()}: a same request moved something`);
        ok(preKeys[preActive] === key, () => `${tag()}: same must mean the painting already on its way in`);
        ok(!rig.blend.holding, () => `${tag()}: a request for the painting on its way in left an older one held`);
      } else {
        const to = plan.to;
        const out: Idx = to === 0 ? 1 : 0;
        ok(rig.planes[to].pose === key && rig.active === to, () => `${tag()}: the plane on its way in holds the painting asked for`);
        ok(rig.planes[out].fade === pre[out], () => `${tag()}: a request never touches the outgoing plane's fade`);
        if (plan.repoint) {
          // only the weaker plane is re-pointed, and it starts from 0
          ok(rig.planes[to].fade === 0, () => `${tag()}: a re-pointed plane starts from 0`);
          ok(pre[out] >= pre[to] - EPS, () => `${tag()}: the plane re-pointed is the weaker (${pre[to]} against ${pre[out]})`);
          ok(preKeys[to] !== key, () => `${tag()}: re-pointed to the painting it already held`);
          ok(!preBlending || pre[to] < REPOINT_BELOW, () => `${tag()}: a re-point dropped a painting still showing at ${pre[to]}`);
        } else {
          // a reversal (or a stale plane that already holds the painting): not one fade moved
          ok(rig.planes[to].fade === pre[to] && preKeys[to] === key, () => `${tag()}: a reversal moved a fade`);
        }
        ok(rig.blend.blending, () => `${tag()}: a request starts a blend`);
      }
      lastKey = key;
      requested++;
      lastRequestPositive = 0;
      nextAt += rnd() * 400;
      prev = rig.fades();
      if (rnd() < 0.2) nextAt = clock; // a burst: the next request lands in this very frame
    }

    // --- the frame
    const dtMs = clock === 0 ? phase : frame;
    const hold = rnd() < 0.15; // a hit-stop frame: the field clock reads 0 (the blend is handed real time only, so a frame of none is what a caller with no time gives)
    const step = hold ? 0 : dtMs;
    const began = rig.step(step); // true: a request rule 2 held began in this frame (it re-pointed the weaker plane, which was under REPOINT_BELOW)
    lastRequestPositive += step;

    // --- the invariants of every frame
    const now = rig.fades();
    ok(now[0] >= 0 && now[0] <= 1 && now[1] >= 0 && now[1] <= 1, () => `${tag()}: a fade left 0..1: ${now}`);
    ok(rig.keysAbove(0.02).length <= 2, () => `${tag()}: more than two painting keys above 0.02`);
    const inn = rig.active;
    const out: Idx = inn === 0 ? 1 : 0;
    if (!began) {
      const slope = (2 * step) / ms + EPS; // quadInOut's steepest slope is 2
      for (const i of [0, 1] as const) ok(Math.abs(now[i] - prev[i]) <= slope, () => `${tag()}: plane ${i} moved ${Math.abs(now[i] - prev[i])} in ${step.toFixed(1)} ms`);
      // roles hold between two requests: the plane on its way in only rises, the other only falls
      ok(now[inn] >= prev[inn] - EPS && now[out] <= prev[out] + EPS, () => `${tag()}: a plane moved against its role (${prev} to ${now}, in ${inn})`);
    } else {
      ok(now[inn] === 0 && rig.blend.blending, () => `${tag()}: a held request began without a fresh plane on its way in`);
    }
    if (step === 0) ok(same2(now, prev), () => `${tag()}: a frame of no time moved a fade`);
    prev = now;
    trace.fades.push(now);
    trace.keys.push(rig.keysAbove(0.02));

    // --- the last request has reached its end: within the blend length (plus the frame it lands in), or, when rule 2 held it until the weaker painting was gone, within two
    if (lastRequestPositive >= 2 * ms + frame + 1e-6) {
      ok(!rig.blend.blending, () => `${tag()}: still blending ${lastRequestPositive} ms after the last request`);
      ok(rig.planes[rig.active].fade === 1 && rig.planes[out].fade === 0 && rig.planes[rig.active].pose === lastKey, () => `${tag()}: the last request did not land`);
    }
    clock += dtMs;
  }
  // everything settled by the end (the run is long past the last request)
  ok(!rig.blend.blending && !rig.blend.holding && rig.planes[rig.active].fade === 1 && rig.planes[rig.active].pose === lastKey, () => `${tag()}: not settled on the last request at the end`);
  ok(rig.blend.maxDropped < REPOINT_BELOW, () => `${tag()}: a painting was dropped while it still showed ${rig.blend.maxDropped}`);
  return trace;
}

describe('PoseBlend: properties over random request sequences', () => {
  for (const fps of FPS) {
    for (const ms of LENGTHS) {
      it(`${fps} fps, ${ms} ms blends, 40 random sequences: two planes only, no pop, roles hold, the last request lands, zero-time frames move nothing`, () => {
        for (let seed = 1; seed <= 40; seed++) run(seed, fps, ms);
      });
    }
  }

  it('is deterministic: the same sequence gives the same fades frame for frame', () => {
    for (const fps of FPS) {
      const a = run(77, fps, 120);
      const b = run(77, fps, 120);
      expect(b).toEqual(a);
    }
  });
});

describe('PoseBlend: the plain swap is exactly today\'s quadInOut, on whatever clock it is handed', () => {
  it('the incoming fade at an elapsed time is quadInOut(elapsed / length) at 30, 60, 120 and 144 fps from any phase, and a zero-time frame adds nothing', () => {
    const rnd = mulberry32(5);
    for (const fps of FPS) {
      for (const ms of LENGTHS) {
        for (let k = 0; k < 25; k++) {
          const rig = new Rig();
          rig.request('attack', ms);
          const frame = 1000 / fps;
          let elapsed = 0;
          const phase = rnd() * frame;
          for (let i = 0; i < 40; i++) {
            const step = i === 0 ? phase : rnd() < 0.2 ? 0 : frame;
            rig.step(step);
            elapsed += step;
            const want = Easing.quadInOut(Math.min(1, elapsed / ms));
            expect(rig.planes[1].fade).toBeCloseTo(want, 12);
            expect(rig.planes[0].fade).toBeCloseTo(1 - want, 12);
          }
          expect(rig.planes[1].fade).toBe(1);
          expect(rig.planes[0].fade).toBe(0);
        }
      }
    }
  });

  it('the default shape is Easing.quadInOut', () => {
    expect(QUAD_IN_OUT).toBe(Easing.quadInOut);
  });
});

describe('PoseBlend: a request in mid-blend', () => {
  /** idle -> ready running 50 ms of 120 (ready 0.347, idle 0.653). */
  function midBlend(): Rig {
    const rig = new Rig();
    rig.request('ready', 120);
    rig.step(50);
    return rig;
  }

  it('keeps the stronger plane going out and re-points only the weaker one, from 0, when the weaker one is under REPOINT_BELOW (rule 2)', () => {
    const rig = new Rig();
    rig.request('ready', 120);
    rig.step(10); // ready 0.014, idle 0.986: the weaker painting is all but gone
    const [idle, ready] = [rig.planes[0].fade, rig.planes[1].fade];
    expect(idle).toBeGreaterThan(ready);
    expect(ready).toBeLessThan(REPOINT_BELOW);
    const plan = rig.request('attack', 120);
    expect(plan).toEqual({ same: false, to: 1, repoint: true, reversed: false });
    expect(rig.planes[0]).toEqual({ fade: idle, pose: 'idle' }); // the painting the player sees keeps its fade
    expect(rig.planes[1]).toEqual({ fade: 0, pose: 'attack' }); // the weaker painting is dropped (0.014); the new one starts from 0
    expect(rig.active).toBe(1);
    expect(rig.blend.maxDropped).toBeCloseTo(ready, 12);
    expect(rig.blend.maxDropped).toBeLessThan(REPOINT_BELOW);
  });

  it('naming the weaker plane\'s painting reverses without a pop', () => {
    const rig = midBlend();
    const pre = rig.fades();
    const plan = rig.request('idle', 120); // idle is the stronger plane (0.653): the blend turns round onto it
    expect(plan).toEqual({ same: false, to: 0, repoint: false, reversed: true });
    expect(rig.fades()).toEqual(pre);
    rig.step(1000 / 60);
    expect(Math.abs(rig.planes[0].fade - pre[0])).toBeLessThan(0.1);
    expect(Math.abs(rig.planes[1].fade - pre[1])).toBeLessThan(0.1);
    expect(rig.planes[0].fade).toBeGreaterThanOrEqual(pre[0]);
    expect(rig.planes[1].fade).toBeLessThanOrEqual(pre[1]);
    for (let i = 0; i < 20; i++) rig.step(10);
    expect(rig.planes[0].fade).toBe(1);
    expect(rig.planes[1].fade).toBe(0);
  });

  it('naming the painting that is already on its way in is nothing: the running blend goes on untouched', () => {
    const rig = midBlend();
    const pre = rig.fades();
    expect(rig.request('ready', 120)).toEqual({ same: true });
    expect(rig.fades()).toEqual(pre);
    rig.step(70);
    expect(rig.planes[1].fade).toBe(1); // 50 + 70 = 120: it did not restart
  });

  it('two requests in the same frame never show the middle painting (a chain that fires at once is ready > follow)', () => {
    const rig = new Rig();
    rig.planes[0].pose = 'ready';
    rig.request('attack', 120);
    rig.request('follow', 120);
    expect(rig.planes[0]).toEqual({ fade: 1, pose: 'ready' });
    expect(rig.planes[1]).toEqual({ fade: 0, pose: 'follow' });
    expect(rig.keysAbove(0)).toEqual(['ready']);
  });

  it('a request every frame keeps the stronger painting up and never shows a third; the last one then lands in one blend length', () => {
    const rig = new Rig();
    const keys = ['ready', 'attack', 'follow', 'hurt', 'cast', 'ko'];
    for (let i = 0; i < 40; i++) {
      rig.request(keys[i % keys.length]!, 120);
      rig.step(1000 / 60);
      expect(rig.keysAbove(0.02).length).toBeLessThanOrEqual(2);
    }
    const last = keys[39 % keys.length]!;
    for (let i = 0; i < 8; i++) rig.step(1000 / 60);
    expect(rig.planes[rig.active]).toEqual({ fade: 1, pose: last });
  });
});

describe('PoseBlend: the injected shape', () => {
  it('a symmetric shape function drives both planes: outgoing = start x (1 - s), incoming = start + (1 - start) x s', () => {
    const rig = new Rig();
    const blend = new PoseBlend(rig.planes, (u) => u); // linear
    blend.request('ready', 100, 0);
    rig.planes[1]!.pose = 'ready';
    blend.advance(25);
    expect(rig.planes[1].fade).toBeCloseTo(0.25, 12);
    expect(rig.planes[0].fade).toBeCloseTo(0.75, 12);
  });

  it('a shape can be named per request, and a request without one uses the controller\'s', () => {
    const rig = new Rig();
    const blend = new PoseBlend(rig.planes);
    blend.request('ready', 100, 0, (u) => u * u);
    rig.planes[1]!.pose = 'ready';
    blend.advance(50);
    expect(rig.planes[1].fade).toBeCloseTo(0.25, 12);
    blend.cancel();
    expect(blend.blending).toBe(false);
  });

  it('the KO cross is out = 1 - s, in = s squared, and its lesser plane is never above 0.382 at any frame rate or phase', () => {
    expect(KO_CROSS_PEAK).toBeCloseTo(0.381966, 6);
    expect(koCross(0)).toEqual({ from: 1, to: 0 });
    expect(koCross(1)).toEqual({ from: 0, to: 1 });
    expect(koCross(0.5)).toEqual({ from: 0.5, to: 0.25 });
    let seen = 0;
    const rnd = mulberry32(11);
    for (const fps of FPS) {
      for (let k = 0; k < 1000; k++) {
        const rig = new Rig();
        const blend = new PoseBlend(rig.planes);
        blend.request('ko', 100, 0, KO_CROSS);
        rig.planes[1]!.pose = 'ko';
        const frame = 1000 / fps;
        let step = rnd() * frame;
        for (let t = 0; t < 140; t += step, step = frame) {
          blend.advance(step);
          seen = Math.max(seen, Math.min(rig.planes[0].fade, rig.planes[1].fade));
        }
      }
    }
    expect(seen).toBeLessThanOrEqual(KO_CROSS_PEAK + EPS);
    expect(seen).toBeGreaterThan(0.3); // and it does reach near the peak: the cap is tight, not vacuous
  });
});

describe('PoseBlend: edges', () => {
  it('a length of 0 or less still ends at 1 and 0 on the next advance, and a bad or negative time moves nothing', () => {
    const rig = new Rig();
    rig.request('ready', 0);
    rig.step(Number.NaN);
    rig.step(-5);
    expect(rig.fades()).toEqual([1, 0]);
    rig.step(1);
    expect(rig.fades()).toEqual([0, 1]);
    expect(rig.blend.blending).toBe(false);
  });

  it('cancel leaves the fades where they are and nothing writes them again', () => {
    const rig = new Rig();
    rig.request('ready', 120);
    rig.step(50);
    const pre = rig.fades();
    rig.blend.cancel();
    rig.step(500);
    expect(rig.fades()).toEqual(pre);
    expect(rig.blend.blending).toBe(false);
    expect(rig.blend.progress).toBe(1);
  });

  it('with nothing running, advance writes nothing and says so', () => {
    const rig = new Rig();
    expect(rig.blend.advance(16)).toBe(false);
    expect(rig.fades()).toEqual([1, 0]);
  });

  it('a stale plane that already holds the painting is reused without a re-point', () => {
    const rig = new Rig();
    rig.request('ready', 120);
    rig.step(200); // settled on ready (plane 1); plane 0 still holds idle at 0
    const plan = rig.request('idle', 120);
    expect(plan).toEqual({ same: false, to: 0, repoint: false, reversed: false }); // not a reversal: nothing was running
    rig.step(60);
    expect(rig.planes[0].fade).toBeGreaterThan(0.3);
  });
});
