/**
 * r73 merge review, FINDING 4: THE FAST-SPEED STRIKE FLOOR DOES NOT APPLY IN SKIP (both games' shared plumbing, the house strike only; presentation, no number of a fight changes; the driver's call under Bailey's delegation of
 * 2026-10-31, his to overturn; `docs/handoff/r73.md` section 11).
 *
 * The floor (`StrikeCurve.crossingFloors`, r73-fast) keeps a house strike's travel and way home at their normal-speed length at every playback scale under 1. `moveScale` floors the scale at 0.02 under `skip`, so skip played the
 * crossings at full length too (about 40 frames, 0.67 s, against 2 in release 72) while everything that waits on a strike (`crossingLagMs`, `strikeLagMs`, the contact beat, and the presenter's own sleep, zero in skip) took the lag as
 * 0: the figures glided in the idle pose after the action had ended. Skip is what e2e, the critic harness and the booth reel run at. `StrikeCurve.FLOOR_MIN_SCALE` (0.05) is the threshold: the floor is on from it up to just under 1
 * (fast 0.32 and every scale a `timeScale` knob makes) and off under it (skip keeps release 72's shape exactly); `StrikeBeat`'s lags use the same `floorsAt` so the shape and the waits agree at every speed.
 *
 * Each case fails on the tree before the fix (the skip cases and the lag-agreement cases) or guards what must not move (fast, normal, `?fastfloor=`, a real profile).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FRAME, play, fastest } from './strike-trace-fixture.ts';
import { reset } from './head-lock-fixture.ts';
import { SPEED_SCALE } from '../../../src/engine/BattlePresenterUtil.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';
import { armContact, meetContact, releaseContact } from '../../../src/engine/ContactBeat.ts';
import { MARKS_NET_MS, marksNetMs } from '../../../src/engine/KeyPoses.ts';
import { crossingLagMs, strikeBeatNow, strikeLagMs } from '../../../src/engine/StrikeBeat.ts';
import { setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setDemoChapter, setTreatedScope } from '../../../src/engine/motion/DemoGate.ts';
import { FLOOR_MIN_SCALE, PROFILES, defaultPaceFactor, floorsAt, resolveStrike, strikeMarks } from '../../../src/engine/motion/StrikeCurve.ts';
import { paceFactor, setPaceGame } from '../../../src/engine/pace.ts';

const ROOT = resolve(__dirname, '..', '..', '..');
const GAMES = { ffx: 'evrae-airship', ffx2: 'ffx2-leblanc' } as const; // a listed chapter per game that plays the house curves
const NORMAL = SPEED_SCALE.normal;
const FAST = SPEED_SCALE.fast;
const SKIP = 0.02; // `moveScale`'s floor under `skip`
/** The scales a `timeScale` knob or the game makes between normal and the threshold. */
const FLOORED = [0.64, FAST, 0.1, FLOOR_MIN_SCALE] as const;
/** Skip and the scales under the threshold: release 72's shape. */
const UNFLOORED = [0, SKIP, 0.03, 0.049] as const;

function setup(game: 'ffx' | 'ffx2'): void {
  setPaceGame(game);
  setTreatedScope('all');
  setCurvesMode('new');
  setDemoChapter(GAMES[game]);
}
beforeEach(() => setup('ffx'));
afterEach(() => {
  setPaceGame('other');
  setTreatedScope(null);
  setCurvesMode(null);
  setDemoChapter(undefined);
  reset();
});

describe('the threshold: FLOOR_MIN_SCALE', () => {
  it('sits above skip\'s 0.02 and at or under every scale the game or a timeScale knob makes between skip and normal; floorsAt is true from it up to just under 1 and nowhere else', () => {
    expect(FLOOR_MIN_SCALE).toBe(0.05);
    expect(SKIP).toBeLessThan(FLOOR_MIN_SCALE);
    expect(FLOOR_MIN_SCALE).toBeLessThan(FAST);
    for (const s of [0.64, FAST, 0.1]) expect(s, `${s}`).toBeGreaterThanOrEqual(FLOOR_MIN_SCALE);
    const table: Array<[number, boolean]> = [[0, false], [-1, false], [SKIP, false], [0.03, false], [0.049, false], [FLOOR_MIN_SCALE, true], [0.1, true], [FAST, true], [0.64, true], [0.999, true], [1, false], [1.7, false], [3, false]];
    for (const [scale, on] of table) expect(floorsAt(scale), `${scale}`).toBe(on);
    expect(floorsAt(SPEED_SCALE.skip)).toBe(false); // the presenter's own skip scale (0)
    expect(floorsAt(NORMAL)).toBe(false);
    expect(floorsAt(FAST)).toBe(true);
  });

  it.each(['ffx', 'ffx2'] as const)('%s: a whole unfloored strike at the threshold is under 4 frames at 60 Hz (nobody watches it), and at skip about 1 frame', (game) => {
    const p = PROFILES[game];
    const total = p.windupMs + p.travelMs + p.holdMs + p.returnMs + p.settleMs; // ms on screen at the default pace, at scale 1
    expect((total * FLOOR_MIN_SCALE) / FRAME).toBeLessThan(4);
    expect((total * SKIP) / FRAME).toBeLessThan(1.5);
  });
});

describe('the shape: skip is release 72\'s exactly; from the threshold up the floor is as r73-fast built it', () => {
  it.each(['ffx', 'ffx2'] as const)('%s: at skip (0.02) and under the threshold the shape is release 72\'s, field for field, for every heft, reach and ?fastfloor= share (the control arm: floorCrossings false)', (game) => {
    for (const timeScale of UNFLOORED) {
      for (const heft of [0, 0.5, 1]) {
        for (const distance of [0.6, 1.4, 3, 4.4]) {
          const o = { distance, height: 1.82, heft, timeScale };
          const r72 = JSON.stringify(resolveStrike(PROFILES[game], { ...o, floorCrossings: false }));
          for (const crossingKeep of [undefined, 1, 0.75, 0.4, 0]) {
            const got = JSON.stringify(resolveStrike(PROFILES[game], crossingKeep === undefined ? o : { ...o, crossingKeep }));
            expect(got, `${game} @${timeScale} heft ${heft} reach ${distance} keep ${crossingKeep}`).toBe(r72);
          }
        }
      }
    }
  });

  it.each(['ffx', 'ffx2'] as const)('%s: the whole move at skip is over in under 1.5 frames on screen (the idle pose is up at once), not the ~40 the floor made it', (game) => {
    const m = strikeMarks(resolveStrike(PROFILES[game], { distance: 1.4, height: 1.82, timeScale: SKIP }));
    expect((m.end * defaultPaceFactor(game)) / FRAME).toBeLessThan(1.5);
    const floored = strikeMarks(resolveStrike(PROFILES[game], { distance: 1.4, height: 1.82, timeScale: FLOOR_MIN_SCALE }));
    expect((floored.end * defaultPaceFactor(game)) / FRAME).toBeGreaterThan(30); // at the threshold the floor is on: the move runs its normal-speed crossings
  });

  it.each(['ffx', 'ffx2'] as const)('%s: from the threshold up to just under 1 (0.05, 0.1, fast 0.32, 0.64, 0.999) the crossings are normal speed\'s lengths, never release 72\'s; ?fastfloor=part keeps three quarters, today none', (game) => {
    for (const timeScale of [...FLOORED, 0.999]) {
      for (const heft of [0, 0.4, 1]) {
        const o = { distance: 2, height: 1.82, heft };
        const normal = resolveStrike(PROFILES[game], { ...o, timeScale: 1 });
        const now = resolveStrike(PROFILES[game], { ...o, timeScale });
        const r72 = resolveStrike(PROFILES[game], { ...o, timeScale, floorCrossings: false });
        expect(now.travelMs, `${game} @${timeScale} ${heft}`).toBeCloseTo(normal.travelMs, 9);
        expect(now.returnMs, `${game} @${timeScale} ${heft}`).toBeCloseTo(normal.returnMs, 9);
        expect(now.travelMs).toBeGreaterThan(r72.travelMs);
        expect(now.returnMs).toBeGreaterThan(r72.returnMs);
        if (timeScale < 0.75) expect(resolveStrike(PROFILES[game], { ...o, timeScale, crossingKeep: 0.75 }).travelMs, `${game} part @${timeScale} ${heft}`).toBeCloseTo(normal.travelMs * 0.75, 9); // (above 0.75 the speed alone is longer than the three quarters kept)
        expect(JSON.stringify(resolveStrike(PROFILES[game], { ...o, timeScale, crossingKeep: 0 }))).toBe(JSON.stringify(r72));
      }
    }
  });

  it.each(['ffx', 'ffx2'] as const)('%s: at normal speed and over (1, 1.7, the default pace\'s own) the shape is release 72\'s byte for byte', (game) => {
    for (const timeScale of [1, defaultPaceFactor(game), 1.7, 3, undefined]) {
      for (const heft of [0, 0.5, 1]) {
        const o = { distance: 1.4, height: 1.82, heft, ...(timeScale === undefined ? {} : { timeScale }) };
        expect(JSON.stringify(resolveStrike(PROFILES[game], o)), `${game} ${timeScale} ${heft}`).toBe(JSON.stringify(resolveStrike(PROFILES[game], { ...o, floorCrossings: false })));
      }
    }
  });
});

describe('the real actor: at skip the strike is release 72\'s, frame for frame, and over within a few frames', () => {
  const SIZES = [280, 420, 600] as const;
  const REACHES = [1.4, 3, 4.4] as const;

  it('every frame\'s registered head and feet and every mark equal the unfloored strike\'s, the move ends within 4 frames, and nothing moves after it (280 to 600 px, reaches 1.4 to 4.4)', () => {
    for (const drawn of SIZES) {
      for (const reach of REACHES) {
        const now = play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: SKIP, frames: 90 });
        const r72 = play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: SKIP, frames: 90, floorCrossings: false });
        expect(now.track.map((s) => [s.head, s.feet]), `${drawn}px ${reach}`).toEqual(r72.track.map((s) => [s.head, s.feet]));
        expect(now.marks).toEqual(r72.marks);
        const end = now.marks['end']!;
        expect(end, `${drawn}px ${reach}`).toBeLessThanOrEqual(4);
        for (let i = end + 2; i < now.track.length; i++) expect(Math.abs(now.track[i]!.head[0] - now.track[i - 1]!.head[0]), `${drawn}px ${reach} frame ${i}`).toBeLessThan(0.04 * drawn); // nothing glides after the action ended: only the idle's own settle (the floor's crossing steps 0.1 of the drawn height a frame)
        for (let i = 60; i < now.track.length; i++) expect(Math.abs(now.track[i]!.head[0] - now.track[i - 1]!.head[0]), `${drawn}px ${reach} frame ${i}`).toBeLessThan(0.5); // and the figure is at rest well before the end of the run
      }
    }
  });

  it('and the floor is what lengthens it: at the threshold the same strike ends in 30 frames or more, and at fast in 20 or more (guards the threshold against drifting to 0 or past fast)', () => {
    const end = (timeScale: number): number => play({ name: 'auron', drawn: 420, reach: 1.4, kind: 'strike', timeScale, frames: 90 }).marks['end']!;
    expect(end(0.049)).toBeLessThanOrEqual(4);
    expect(end(FLOOR_MIN_SCALE)).toBeGreaterThanOrEqual(30);
    expect(end(FAST)).toBeGreaterThanOrEqual(20);
    expect(end(NORMAL)).toBeGreaterThan(end(FAST));
    for (const drawn of [280, 600] as const) {
      const { track } = play({ name: 'auron', drawn, reach: 1.4, kind: 'strike', timeScale: FLOOR_MIN_SCALE, frames: 90 });
      const steps = track.slice(5, 31).map((s, i) => Math.abs(s.head[0] - track[4 + i]!.head[0]));
      expect(Math.max(...steps) / drawn, `${drawn}px`).toBeGreaterThan(0.08); // the floored figure is crossing the stage over frames 5 to 30; the skipped one has long since stopped
    }
  });

  it('skip still crosses the stage in one frame, as in release 72 (kept on purpose: the whole move is under 2 frames), and fast does not (guards the floor at fast)', () => {
    for (const drawn of SIZES) {
      for (const reach of REACHES) {
        const skip = fastest(play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: SKIP, frames: 90 }).track, 90);
        expect(skip.ratio, `${drawn}px ${reach}`).toBeGreaterThan(10);
        expect(fastest(play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: FAST, frames: 90 }).track, 90).ratio, `${drawn}px ${reach}`).toBeLessThan(1.7);
      }
    }
  });
});

/** An event context with the presenter's own waits recorded: `sleep` never settles, so a wait is read, not run. `strikeHeft` is the attacker's heft. */
function ctxAt(speed: 'normal' | 'fast' | 'skip', timeScale = 1, heft = 0): { ctx: EventCtx; sleeps: number[] } {
  const sleeps: number[] = [];
  const ctx = { speed: () => speed, deps: { timeScale }, stage: { actor: () => ({ strikeHeft: () => heft }) }, sleep: (ms: number) => (sleeps.push(ms), new Promise<void>(() => {})) } as unknown as EventCtx;
  return { ctx, sleeps };
}

describe('the waits agree with the shape at every speed: the lag is owed exactly where the shape is floored', () => {
  const SCALES = [0.02, 0.03, 0.049, FLOOR_MIN_SCALE, 0.1, FAST, 0.64, 0.9, 1, 1.5] as const; // (0.999 rounds its lag to 0 ms: not a scale to read it at)

  it.each(['ffx', 'ffx2'] as const)('%s: strikeLagMs and crossingLagMs are positive exactly where resolveStrike lengthened the crossings, and the beat the sound is asked for is the shape\'s contact on screen, at every scale', (game) => {
    setup(game);
    for (const heft of [0, 0.5, 1]) {
      for (const s of SCALES) {
        const shape = resolveStrike(PROFILES[game], { distance: 1.4, height: 1.82, heft, timeScale: s });
        const r72 = resolveStrike(PROFILES[game], { distance: 1.4, height: 1.82, heft, timeScale: s, floorCrossings: false });
        const floored = shape.travelMs > r72.travelMs + 1e-9;
        expect(floored, `${game} @${s}`).toBe(floorsAt(s));
        expect(strikeLagMs(heft, s) > 0, `${game} strikeLagMs @${s} heft ${heft}`).toBe(floored);
        expect(crossingLagMs(heft, s) > 0, `${game} crossingLagMs @${s} heft ${heft}`).toBe(floored);
        const onScreen = strikeMarks(shape).contact * paceFactor('action'); // paced ms are on screen at the pace's factor
        const rounding = 1.01 * Math.max(1, s) * paceFactor('action'); // the beat and the lag are each rounded to a ms at scale 1
        expect(Math.abs(strikeBeatNow(heft, undefined, s) * s * paceFactor('action') - onScreen), `${game} contact beat @${s} heft ${heft}`).toBeLessThan(rounding);
      }
    }
  });

  it('strikeLagMs and crossingLagMs are 0 at skip (scale 0) and at every scale under the threshold, and positive at it and at fast; the FFX numbers at fast are as r73-fast set them', () => {
    for (const s of [0, SKIP, 0.03, FLOOR_MIN_SCALE - 0.001]) {
      expect(strikeLagMs(0, s), `${s}`).toBe(0);
      expect(crossingLagMs(1, s), `${s}`).toBe(0);
    }
    expect(strikeLagMs(0, FLOOR_MIN_SCALE)).toBeGreaterThan(0);
    expect(crossingLagMs(0, FLOOR_MIN_SCALE)).toBeGreaterThan(strikeLagMs(0, FLOOR_MIN_SCALE));
    expect(strikeLagMs(0, FAST)).toBe(443);
  });

  it('the contact beat\'s waits and the pose net owe nothing at a scale under the threshold (fast x a 0.1 timeScale = 0.032) and still grow at 0.16 and at fast', () => {
    const asked = (speed: 'normal' | 'fast' | 'skip', timeScale: number): { hold: number; wait: number; net: number } => {
      const { ctx, sleeps } = ctxAt(speed, timeScale);
      const c = armContact(ctx, 'tidus');
      void meetContact(ctx, 'seymour-flux');
      const out = { hold: sleeps[0]!, wait: sleeps[1]!, net: marksNetMs(ctx, 'sinspawn') };
      c.reached();
      releaseContact(ctx);
      return out;
    };
    const normal = asked('normal', 1);
    expect(normal).toEqual({ hold: 700 + 150, wait: 400, net: MARKS_NET_MS });
    expect(asked('skip', 1)).toEqual(normal);
    expect(asked('fast', 0.1)).toEqual(normal); // scale 0.032: under the threshold, release 72's waits
    const slow = asked('fast', 0.5); // scale 0.16
    expect(slow.hold).toBeGreaterThan(normal.hold);
    expect(slow.wait).toBeGreaterThan(normal.wait);
    expect(slow.net).toBeGreaterThan(MARKS_NET_MS);
    const fast = asked('fast', 1);
    expect(fast.hold).toBe(850 + strikeLagMs(0, FAST));
    expect(fast.net).toBe(MARKS_NET_MS + crossingLagMs(0, FAST));
  });
});

describe('the job specs: finding 3\'s correction to the CHK-026 bar for Chapter XVIII, and finding 4 recorded', () => {
  const text = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
  const ROWS: Array<[string, string, RegExp]> = [
    ['docs/handoff/r73.md', 'J73-2', /^\| \*\*J73-2\*\*.*$/m],
    ['docs/handoff/r73.md', 'J73-3', /^\| \*\*J73-3\*\*.*$/m],
    ['docs/handoff/r73-fast.md', 'F-1', /^\| \*\*F-1\*\*.*$/m],
    ['docs/handoff/r73-fast.md', 'F-2', /^\| \*\*F-2\*\*.*$/m],
  ];
  it.each(ROWS)('%s, job %s: the CHK-026 bar is "no worse than ?treated=pack at the same seed", not PASS (a carried class: Chapter VIII, the Mirror Aeons and live fail it too)', (file, job, re) => {
    const row = text(file).match(re)?.[0];
    expect(row, `${file} has the ${job} row`).toBeTruthy();
    expect(row).toMatch(/no worse than `\?treated=pack` at the same seed/);
    expect(row).toMatch(/carried class/);
    expect(row).not.toMatch(/CHK-026 PASS/);
    expect(row).toMatch(/CHK-027 PASS/);
  });

  it('r73.md records finding 4 (the skip threshold, FLOOR_MIN_SCALE 0.05, its proof) and r73-fast.md no longer says the floor applies in skip', () => {
    const r73 = text('docs/handoff/r73.md');
    expect(r73).toMatch(/^\| 4 \|.*skip.*FLOOR_MIN_SCALE.*$/m);
    expect(r73).toMatch(/r73-skip-floor\.test\.ts/);
    const fast = text('docs/handoff/r73-fast.md');
    expect(fast).not.toMatch(/at the fast playback speed \(and in skip\)/);
    expect(fast).toMatch(/FLOOR_MIN_SCALE/);
  });
});
