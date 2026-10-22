/**
 * 120 Hz and above (motion program, lane "feel", 2026-10-22; both games): the same motion must land at the same TIME at 60, 120 and 144 Hz.
 *
 * Found by reading the update loops (every `+= <constant>` and every frame-counted list in `src/engine`, `src/app`, `src/ui`): two things ran per DRAWN frame, and both are fixed here:
 * - `BattleCamera`'s shake advanced its phase by 0.9 per frame (54 rad/s at 60 Hz, 108 at 120, 130 at 144: a shake twice as frantic on the booth's monitor);
 * - option C's 2-frame impact frame was a list that lost one entry per drawn frame (33 ms at 60 Hz, 17 at 120, 14 at 144).
 *
 * The comparison is made at the times the three rates share (k / 12 s: 5k frames at 60, 10k at 120, 12k at 144), where each rate has produced a frame exactly there.
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { IMPACT_FRAME_S, ImpactFrames } from '../../src/engine/fx/c/SpectacleImpact.ts';
import { HitStop, Trauma } from '../../src/engine/fx/c/Trauma.ts';
import { SETTLE_KICK } from '../../src/engine/feel/PunchCurve.ts';

const RATES = [60, 120, 144] as const;

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});
afterEach(() => vi.restoreAllMocks());

function rig(): BattleCamera {
  const cam = new PerspectiveCamera(34, 16 / 9, 0.1, 200);
  const bc = new BattleCamera(cam, { rigs: { idle: { position: [0, 3.4, 9], lookAt: [0, 1.4, 0] } }, initial: 'idle' });
  bc.swayOff = () => true;
  return bc;
}

/** The camera position at every shared time k / 12 s, after a shake of 0.12 over 340 ms and a punch of 0.1 over 400 ms, stepped at `hz`. */
function trace(hz: number): Vector3[] {
  const bc = rig();
  for (let i = 0; i < hz; i++) bc.update(1 / hz);
  bc.shake(0.12, 340);
  void bc.punch(0.1, 400);
  const out: Vector3[] = [];
  for (let i = 1; i <= hz; i++) {
    bc.update(1 / hz);
    if ((i * 12) % hz === 0) out.push(bc.camera.position.clone());
  }
  return out;
}

describe('BattleCamera', () => {
  it('shakes at the same speed at every refresh rate: the camera is in the same place at the shared times', () => {
    const traces = RATES.map(trace);
    expect(traces[0]!.length).toBe(12);
    for (let k = 0; k < 12; k++) {
      for (let r = 1; r < RATES.length; r++) {
        const d = traces[r]![k]!.distanceTo(traces[0]![k]!);
        expect(d, `${RATES[r]} Hz vs 60 Hz at ${((k + 1) * 1000) / 12} ms`).toBeLessThan(2e-4); // an eight-thousandth of a screen pixel at the battle camera's 148 px per unit
      }
    }
  });

  it('really shakes (the comparison is not of two stills)', () => {
    const t = trace(144);
    let widest = 0;
    for (let k = 1; k < t.length; k++) widest = Math.max(widest, t[k]!.distanceTo(t[0]!));
    expect(widest).toBeGreaterThan(0.01);
  });

  it('a hit-stop that holds the field (dt 0) holds the shake phase too, at any rate', () => {
    const still = (hz: number): number => {
      const bc = rig();
      for (let i = 0; i < hz; i++) bc.update(1 / hz);
      bc.shake(0.12, 340);
      bc.update(1 / hz);
      const p0 = bc.camera.position.clone();
      for (let i = 0; i < 20; i++) bc.update(0);
      return bc.camera.position.distanceTo(p0);
    };
    for (const hz of RATES) expect(still(hz)).toBe(0);
  });
});

describe('Trauma (the spectacle camera)', () => {
  it('the kick and the shake are on the animation clock: the same offset at the shared times', () => {
    const offsets = (hz: number): Array<[number, number, number]> => {
      const t = new Trauma({ max: 0.2, rollMaxDeg: 2, hz: 20, decay: 2 });
      t.add(0.7);
      t.kick(0.03, SETTLE_KICK, 9.5);
      const out: Array<[number, number, number]> = [];
      for (let i = 1; i <= hz / 2; i++) {
        t.update(1 / hz);
        if ((i * 12) % hz === 0) {
          const o = t.offset();
          out.push([o.x, o.y, o.dolly * t.dollyWorld]);
        }
      }
      return out;
    };
    const base = offsets(60);
    for (const hz of [120, 144]) {
      const other = offsets(hz);
      expect(other.length).toBe(base.length);
      base.forEach((b, k) => b.forEach((v, c) => expect(other[k]![c]!, `${hz} Hz, ${k}:${c}`).toBeCloseTo(v, 6)));
    }
  });

  it('a 50 ms hit-stop is 50 ms of real time at every rate', () => {
    for (const hz of RATES) {
      const s = new HitStop();
      s.freeze(50);
      let heldMs = 0;
      for (let i = 0; i < hz; i++) {
        const dt = 1 / hz;
        const field = s.scale(dt);
        heldMs += (dt - field) * 1000;
      }
      expect(heldMs, `${hz} Hz`).toBeCloseTo(50, 6);
    }
  });
});

describe('the impact frame', () => {
  /** Frames drawn with the strength showing, and the real time they span. */
  function run(hz: number, jitter = 0): { drawn: number[]; ms: number } {
    const f = new ImpactFrames();
    f.arm([1, 0.5]);
    const drawn: number[] = [];
    let ms = 0;
    for (let i = 0; i < 40; i++) {
      const dt = (1 / hz) * (1 + (i % 2 === 0 ? jitter : -jitter));
      const v = f.step(dt);
      if (v === 0) break;
      drawn.push(v);
      ms += dt * 1000;
    }
    return { drawn, ms };
  }

  it('60 Hz draws exactly the two frames it always drew, jitter or not', () => {
    for (const jitter of [0, 0.02, 0.05, 0.09]) expect(run(60, jitter).drawn, `jitter ${jitter}`).toEqual([1, 0.5]);
  });

  it('a 30 Hz screen draws the two levels once each (a level is never skipped)', () => {
    expect(run(30).drawn).toEqual([1, 0.5]);
  });

  it('120 and 144 Hz keep each level up for about a 60 Hz frame: 33 ms in all, not 17 and 14', () => {
    for (const hz of [120, 144, 240]) {
      const r = run(hz);
      expect(r.ms, `${hz} Hz`).toBeGreaterThan(IMPACT_FRAME_S * 1000 * 2 - 6);
      expect(r.ms, `${hz} Hz`).toBeLessThan(IMPACT_FRAME_S * 1000 * 2 + 10);
      expect(r.drawn[0]).toBe(1);
      expect(r.drawn[r.drawn.length - 1]).toBe(0.5);
    }
  });

  it('dt of 0 holds the level on screen (a capture that stopped the app)', () => {
    const f = new ImpactFrames();
    f.arm([1, 0.5]);
    for (let i = 0; i < 10; i++) expect(f.step(0)).toBe(1);
    expect(f.pending).toBe(2);
    f.step(1 / 60);
    expect(f.pending).toBe(1);
  });

  it('the soft frame (REDUCE FLASHES) is one level', () => {
    const f = new ImpactFrames();
    f.arm([1]);
    expect(f.step(1 / 60)).toBe(1);
    expect(f.step(1 / 60)).toBe(0);
    expect(f.pending).toBe(0);
  });
});
