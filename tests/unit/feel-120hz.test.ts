/**
 * 120 Hz and above (motion program, lane "feel", 2026-10-22; both games): the same motion must land at the same TIME at 60, 120 and 144 Hz.
 *
 * Found by reading the update loops (every `+= <constant>` and every frame-counted list in `src/engine`, `src/app`, `src/ui`): two things ran per DRAWN frame, and both are fixed here:
 * - `BattleCamera`'s shake advanced its phase by 0.9 per frame (54 rad/s at 60 Hz, 108 at 120, 130 at 144: a shake twice as frantic on the booth's monitor);
 * - option C's 2-frame impact frame was a list that lost one entry per drawn frame (33 ms at 60 Hz, 17 at 120, 14 at 144).
 *
 * The comparison is made at the times the three rates share (k / 12 s: 5k frames at 60, 10k at 120, 12k at 144), where each rate has produced a frame exactly there.
 *
 * Review fix F1 (2026-10-22): both are behind `?timing=time` (`FeelSwitch.timingByTime`). **Post-conference plan (2026-10-26): the switch is ON BY DEFAULT in every chapter, pack or not** (it
 * removes a glitch, a shake twice as frantic on a 120 Hz screen, and is the same at 60 Hz); `?timing=frames` is the off word. The first suites run in a demo chapter; 'every chapter' runs the same
 * comparison in the others and with nothing named; the last suite pins that with `?timing=frames` both pieces are exactly release 64's: 0.9 radians per drawn frame, one impact level per drawn frame.
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { IMPACT_FRAME_S, ImpactFrames } from '../../src/engine/fx/c/SpectacleImpact.ts';
import { HitStop, Trauma } from '../../src/engine/fx/c/Trauma.ts';
import { SETTLE_KICK } from '../../src/engine/feel/PunchCurve.ts';
import { resetFeelForTests, setFeelChapter, setTimingByTime, timingByTime } from '../../src/engine/feel/FeelSwitch.ts';
import { SHAKE_RAD_PER_FRAME, SHAKE_RAD_PER_S, shakeStepByTime, shakeStepPerFrame } from '../../src/engine/feel/TimeBased.ts';

const RATES = [60, 120, 144] as const;

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  resetFeelForTests('?timing=time');
  setFeelChapter('seymour-flux'); // a demo chapter with the switch named: time mode
});
afterEach(() => {
  vi.restoreAllMocks();
  resetFeelForTests();
});

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

describe('every chapter, pack or not (post-conference plan, 2026-10-26)', () => {
  const CHAPTER_IDS = ['seymour-flux', 'ffx2-bahamut', 'yunalesca', 'braskas-final-aeon', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc', null] as const;
  const ADDRESSES = [undefined, '', '?pack=off', '?pack=demo'] as const;

  /** The wall time the shake takes to spend itself and the phase rate it ran at, stepped at `hz`. */
  function shakeRun(hz: number): { ms: number; radPerS: number } {
    const bc = rig();
    for (let i = 0; i < 4; i++) bc.update(1 / hz);
    bc.shake(0.12, 340);
    const field = bc as unknown as { shakePhase: number; shakeLeftMs: number };
    const p0 = field.shakePhase;
    let frames = 0;
    while (field.shakeLeftMs > 0 && frames < 10 * hz) {
      bc.update(1 / hz);
      frames++;
    }
    const ms = (frames * 1000) / hz;
    return { ms, radPerS: (field.shakePhase - p0) / (frames / hz) };
  }

  it('the shake runs at the same rate (54 rad/s: what this change fixes) at 60, 120 and 144 Hz, in every chapter and under every address; its wall time was always real time (unchanged by it, within a 60 Hz frame)', () => {
    for (const search of ADDRESSES) {
      for (const id of CHAPTER_IDS) {
        resetFeelForTests(search);
        setFeelChapter(id);
        const base = shakeRun(60);
        expect(base.radPerS, `${search}, ${id}, 60 Hz`).toBeCloseTo(SHAKE_RAD_PER_S, 6);
        for (const hz of [120, 144]) {
          const r = shakeRun(hz);
          expect(Math.abs(r.ms - base.ms) / base.ms, `${search}, ${id}, ${hz} Hz wall time`).toBeLessThan(0.05);
          expect(Math.abs(r.radPerS - base.radPerS) / base.radPerS, `${search}, ${id}, ${hz} Hz rate`).toBeLessThan(0.05);
        }
      }
    }
  });

  it('the camera is in the same place at the shared times at 60 and 144 Hz in a chapter that is not a demo chapter (the case the switch used to leave out)', () => {
    for (const id of ['yunalesca', 'ffx2-vegnagun-shuyin']) {
      resetFeelForTests();
      setFeelChapter(id);
      const a = trace(60);
      const b = trace(144);
      for (let k = 0; k < 12; k++) expect(b[k]!.distanceTo(a[k]!), `${id} at ${((k + 1) * 1000) / 12} ms`).toBeLessThan(2e-4);
    }
  });

  it('the impact frame is 33 ms at 60, 120 and 144 Hz in every chapter, and never less than one drawn frame', () => {
    for (const id of CHAPTER_IDS) {
      resetFeelForTests();
      setFeelChapter(id);
      for (const hz of RATES) {
        const f = new ImpactFrames();
        f.arm([1, 0.5]);
        let drawn = 0;
        for (let i = 0; i < 40 && f.step(1 / hz) > 0; i++) drawn++;
        expect((drawn * 1000) / hz, `${id}, ${hz} Hz`).toBeGreaterThan(IMPACT_FRAME_S * 2000 - 6);
        expect((drawn * 1000) / hz, `${id}, ${hz} Hz`).toBeLessThan(IMPACT_FRAME_S * 2000 + 10);
      }
    }
  });

  it('at an exact 60 Hz the default and ?timing=frames put the camera in the same place on every frame of a shake (nothing moves for a 60 Hz player), except through a hit-stop hold', () => {
    const frames = (search: string, hold: number): Vector3[] => {
      resetFeelForTests(search);
      setFeelChapter('yunalesca');
      const bc = rig();
      for (let i = 0; i < 60; i++) bc.update(1 / 60);
      bc.shake(0.16, 340);
      const out: Vector3[] = [];
      for (let i = 0; i < 30; i++) {
        bc.update(i >= 5 && i < 5 + hold ? 0 : 1 / 60); // a hit-stop holds the field clock: dt 0 for `hold` frames
        out.push(bc.camera.position.clone());
      }
      return out;
    };
    const a = frames('', 0);
    const b = frames('?timing=frames', 0);
    expect(a.length).toBe(30);
    let widest = 0;
    a.forEach((p, i) => { widest = Math.max(widest, p.distanceTo(b[i]!)); });
    expect(widest).toBeLessThan(1e-9);
    let moved = 0;
    for (let i = 1; i < a.length; i++) moved = Math.max(moved, a[i]!.distanceTo(a[0]!));
    expect(moved, 'the shake really moves the camera').toBeGreaterThan(0.01);
    const held = frames('', 3); // the one 60 Hz difference: the camera holds still through a 3-frame hit-stop (frames mode kept jittering through it)
    const heldOld = frames('?timing=frames', 3);
    for (let i = 5; i < 8; i++) expect(held[i]!.distanceTo(held[i - 1]!), `hold frame ${i}`).toBe(0);
    let jitterOld = 0;
    for (let i = 5; i < 8; i++) jitterOld = Math.max(jitterOld, heldOld[i]!.distanceTo(heldOld[i - 1]!));
    expect(jitterOld, 'frames mode jitters through the hold').toBeGreaterThan(0.001);
  });

  it('Chapter I and Chapter IV answer what they answered in release 64: real time, 54 rad/s (the default, the old pack word and the key all agree)', () => {
    for (const search of ['', '?pack=demo', '?pack=demo&timing=time', '?timing=time']) {
      for (const id of ['seymour-flux', 'ffx2-bahamut']) {
        resetFeelForTests(search);
        setFeelChapter(id);
        expect(timingByTime(), `${search}, ${id}`).toBe(true);
        expect(shakeStepPerFrame()).toBe(0);
        expect(shakeStepByTime(1 / 144)).toBeCloseTo(SHAKE_RAD_PER_S / 144, 12);
      }
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

  it('the honest table (review F-2): a level is a whole number of drawn frames, so only 60, 90, 120, 144 and 240 Hz land within 5 percent of 33.3 ms; 50, 75 and 100 Hz read 40, 165 Hz 36.4, and none is ever shorter than 33 ms', () => {
    const full: Record<number, number> = { 30: 66.7, 50: 40, 60: 33.3, 75: 40, 90: 33.3, 100: 40, 120: 33.3, 144: 34.7, 165: 36.4, 240: 33.3 };
    for (const [hz, want] of Object.entries(full)) {
      const r = run(Number(hz));
      expect(r.ms, `${hz} Hz, full frame`).toBeCloseTo(want, 0);
      expect(r.ms, `${hz} Hz, never short`).toBeGreaterThan(IMPACT_FRAME_S * 2000 - 3);
      expect(r.ms, `${hz} Hz, at most one drawn frame long`).toBeLessThan(IMPACT_FRAME_S * 2000 + 1000 / Number(hz) + 0.5);
    }
    for (const hz of [60, 90, 120, 144, 240]) expect(Math.abs(run(hz).ms - 33.3) / 33.3, `${hz} Hz within 5 percent`).toBeLessThan(0.05);
    // the one-level soft frame (REDUCE FLASHES): 16.7 ms at 60 Hz, one drawn frame or two on the rest
    const soft: Record<number, number> = { 60: 16.7, 75: 26.7, 90: 22.2, 120: 16.7, 144: 20.8, 240: 16.7 };
    for (const [hz, want] of Object.entries(soft)) {
      const f = new ImpactFrames();
      f.arm([1]);
      let ms = 0;
      for (let i = 0; i < 20 && f.step(1 / Number(hz)) > 0; i++) ms += 1000 / Number(hz);
      expect(ms, `${hz} Hz, soft frame`).toBeCloseTo(want, 0);
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

describe('the off word (`?timing=frames`) is release 64 (review fix F1; the default became real time on 2026-10-26)', () => {
  /** The shake phase after `n` updates of `dt`, `hold` of them with dt 0 first (a hit-stop), read off the private field. */
  function phaseAfter(n: number, dt: number, hold = 0): number {
    const bc = rig();
    for (let i = 0; i < 4; i++) bc.update(1 / 60);
    bc.shake(0.12, 340);
    const p0 = (bc as unknown as { shakePhase: number }).shakePhase;
    for (let i = 0; i < hold; i++) bc.update(0);
    for (let i = 0; i < n; i++) bc.update(dt);
    return (bc as unknown as { shakePhase: number }).shakePhase - p0;
  }

  it('the helpers answer today\'s step with ?timing=frames, and the time step by default, with or without the pack and a chapter', () => {
    resetFeelForTests('?timing=frames'); // the off word, no chapter
    expect(shakeStepPerFrame()).toBe(SHAKE_RAD_PER_FRAME);
    expect(shakeStepByTime(1 / 60)).toBe(0);
    for (const search of [undefined, '', '?pack=off', '?pack=demo']) {
      for (const id of [null, 'seymour-flux', 'yunalesca']) {
        resetFeelForTests(search);
        setFeelChapter(id);
        expect(shakeStepPerFrame(), `${search}, ${id}`).toBe(0);
        expect(shakeStepByTime(1 / 60), `${search}, ${id}`).toBeCloseTo(SHAKE_RAD_PER_FRAME, 12);
      }
    }
    expect(SHAKE_RAD_PER_S / 60).toBeCloseTo(SHAKE_RAD_PER_FRAME, 12);
  });

  it('off, the shake phase advances 0.9 per drawn frame at any rate, and keeps going through a hold (dt 0), as release 64 does', () => {
    resetFeelForTests('?timing=frames');
    for (const hz of RATES) expect(phaseAfter(10, 1 / hz), `${hz} Hz`).toBeCloseTo(9, 9);
    expect(phaseAfter(10, 1 / 60, 3)).toBeCloseTo(0.9 * 13, 9); // three held frames still jitter
  });

  it('on in a demo chapter, it advances 54 rad/s: the same at every rate, still through a hold', () => {
    for (const hz of RATES) expect(phaseAfter(hz / 6, 1 / hz), `${hz} Hz`).toBeCloseTo(9, 9); // 1/6 s
    expect(phaseAfter(10, 1 / 60, 3)).toBeCloseTo(9, 9); // three held frames add nothing
  });

  it('a chapter that is not a demo chapter is real time too, by default, with the pack named or not (post-conference plan); ?timing=frames puts the frame count back there', () => {
    for (const search of [undefined, '', '?pack=off', '?pack=demo', '?pack=demo&timing=time']) {
      resetFeelForTests(search);
      for (const id of ['yunalesca', 'ffx2-vegnagun-shuyin', 'braskas-final-aeon', 'ffx2-leblanc']) {
        setFeelChapter(id);
        for (const hz of RATES) expect(phaseAfter(hz / 6, 1 / hz), `${search}, ${id}, ${hz} Hz`).toBeCloseTo(9, 9);
      }
    }
    resetFeelForTests('?timing=frames');
    for (const id of ['yunalesca', 'ffx2-vegnagun-shuyin']) {
      setFeelChapter(id);
      expect(phaseAfter(10, 1 / 144), id).toBeCloseTo(9, 9); // 10 drawn frames x 0.9, at any rate
      expect(phaseAfter(24, 1 / 144), id).toBeCloseTo(21.6, 9); // a sixth of a second at 144 Hz: 2.4 times the 9 radians a 60 Hz screen shows
    }
  });

  it('off, a 144 Hz screen draws each impact level for one drawn frame (7 ms), as release 64 does; 60 Hz is unchanged', () => {
    resetFeelForTests('?timing=frames');
    for (const [hz, frames] of [[60, 2], [120, 2], [144, 2]] as const) {
      const f = new ImpactFrames();
      f.arm([1, 0.5]);
      const drawn: number[] = [];
      for (let i = 0; i < 10; i++) {
        const v = f.step(1 / hz);
        if (v === 0) break;
        drawn.push(v);
      }
      expect(drawn, `${hz} Hz`).toEqual([1, 0.5]);
      expect(drawn.length).toBe(frames);
    }
    const held = new ImpactFrames();
    held.arm([1, 0.5]);
    for (let i = 0; i < 5; i++) expect(held.step(0)).toBe(1); // a capture that stopped the app still holds
    expect(held.pending).toBe(2);
  });

  it('the switch is read when an impact frame starts: one already running keeps its mode', () => {
    resetFeelForTests('?timing=frames');
    const f = new ImpactFrames();
    f.arm([1, 0.5]); // off
    setFeelChapter('seymour-flux');
    setTimingByTime(true);
    expect(f.step(1 / 144)).toBe(1);
    expect(f.step(1 / 144)).toBe(0.5); // still one level per drawn frame
    expect(f.step(1 / 144)).toBe(0);
  });
});
