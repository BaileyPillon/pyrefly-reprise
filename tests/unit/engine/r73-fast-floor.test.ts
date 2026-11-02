/**
 * r73-fast: THE HOUSE STRIKE'S TWO CROSSINGS KEEP THEIR LENGTH AT EVERY PLAYBACK SPEED (both games; `docs/handoff/r73-fast.md`; a presentation change, no number of a fight changes).
 *
 * The cause (`r73-sinface-trace.test.ts`, which keeps release 72's strike as its control arm): the presenter plays the house strike at `SPEED_SCALE x timeScale` and `fast` is 0.32, so its travel landed in about 5 frames and its way
 * home in 8, one-frame steps of 0.46 and 0.25 of the reach (0.15 and 0.08 at normal). `StrikeCurve.crossingFloors` keeps the TRAVEL and the RETURN at the length they have at normal speed; the wind-up, the hold and the settle still
 * take the speed. The step per frame, as a share of the figure's drawn height, is a law of the reach over the height and of the crossing's length (see below), so it is then the step the same strike takes at normal speed, in Chapter I
 * too. This file proves it with the REAL `PaintedActor` read the way the continuity probe reads it, at normal (1), 0.64, `fast` (0.32), 0.1 and `skip` (`moveScale`'s floor, 0.02), at 280, 420 and 600 px drawn and reaches of 1.4,
 * 3 and 4.4 units (the solver's cap), and pins what the floor must NOT touch: normal speed (byte for byte), every real profile (Chapter I and Chapter IV play real-snappy), and the contact's timing in the presenter.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CFG, FRAME, fastest, jerksOf, play, worstSteps } from './strike-trace-fixture.ts';
import { reset } from './head-lock-fixture.ts';
import { REAL_MOTION } from '../../../src/data/motion/realMotion.ts';
import { paceFactor, paceRate, setPaceGame } from '../../../src/engine/pace.ts';
import { setDemoChapter, setTreatedScope } from '../../../src/engine/motion/DemoGate.ts';
import { setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { profileOfRow } from '../../../src/engine/motion/RealMotion.ts';
import { PROFILES, crossingFloors, defaultPaceFactor, heftFactors, resolveStrike, sampleAt, strikeMarks } from '../../../src/engine/motion/StrikeCurve.ts';
import { SPEED_SCALE } from '../../../src/engine/BattlePresenterUtil.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';
import { armContact, meetContact, releaseContact } from '../../../src/engine/ContactBeat.ts';
import { playbackScaleOf, strikeBeatNow, strikeLagMs } from '../../../src/engine/StrikeBeat.ts';
import { moveScale } from '../../../src/engine/motion/CurveBeats.ts';
import { noteSfxEvent, playCue } from '../../../src/engine/BattlePresenterSfx.ts';

beforeEach(() => {
  setPaceGame('ffx');
  setTreatedScope('all');
  setCurvesMode('new');
  setDemoChapter('evrae-airship'); // a listed FFX chapter that plays the house curves (`real` held)
});
afterEach(() => {
  setPaceGame('other');
  setTreatedScope(null);
  setCurvesMode(null);
  setDemoChapter(undefined);
  reset();
});

const NORMAL = SPEED_SCALE.normal;
const FAST = SPEED_SCALE.fast;
const SKIP = 0.02; // `moveScale`'s floor under `skip`
/** Every playback scale the game has (normal, fast, skip) and two in between that a `timeScale` knob can make. */
const SPEEDS = [NORMAL, 0.64, FAST, 0.1, SKIP] as const;
const SIZES = [280, 420, 600] as const;
const REACHES = [1.4, 3, 4.4] as const;
const FRAMES = 90;

describe('the shape: the crossings keep their normal length, the rest takes the speed', () => {
  it.each(['ffx', 'ffx2'] as const)('%s: at normal speed (and at any scale of 1 or more, the default pace\'s own included) the shape is exactly the one without the floor, for every heft and reach', (game) => {
    for (const timeScale of [1, defaultPaceFactor(game), 1.7, 3]) {
      for (const heft of [0, 0.5, 1]) {
        for (const distance of [0.6, 1.4, 3, 4.4]) {
          const o = { distance, height: 1.82, heft, timeScale };
          expect(resolveStrike(PROFILES[game], o), `${game} ${timeScale} ${heft} ${distance}`).toEqual(resolveStrike(PROFILES[game], { ...o, floorCrossings: false }));
        }
      }
    }
  });

  it.each(['ffx', 'ffx2'] as const)('%s: at fast, at skip and in between the travel and the return are the lengths they have at normal speed; the wind-up, the hold, the settle and the snap are the speed\'s', (game) => {
    for (const timeScale of [0.64, FAST, 0.1, SKIP]) {
      for (const heft of [0, 0.4, 1]) {
        const o = { distance: 2, height: 1.82, heft, timeScale };
        const now = resolveStrike(PROFILES[game], o);
        const raw = resolveStrike(PROFILES[game], { ...o, floorCrossings: false });
        const normal = resolveStrike(PROFILES[game], { ...o, timeScale: 1 });
        const floors = crossingFloors(PROFILES[game], heftFactors(heft));
        expect(now.travelMs, `${game} ${timeScale} ${heft}`).toBeCloseTo(normal.travelMs, 9);
        expect(now.returnMs, `${game} ${timeScale} ${heft}`).toBeCloseTo(normal.returnMs, 9);
        expect(now.travelMs).toBeCloseTo(floors.travelMs, 9);
        expect(now.returnMs).toBeCloseTo(floors.returnMs, 9);
        for (const part of ['windupMs', 'holdMs', 'settleMs', 'snapMs'] as const) expect(now[part], `${game} ${part} ${timeScale}`).toBeCloseTo(raw[part], 9); // untouched: they take the speed
        expect(raw.travelMs).toBeLessThan(now.travelMs); // and without the floor they were shorter
        expect(raw.returnMs).toBeLessThan(now.returnMs);
      }
    }
  });

  it.each(['ffx', 'ffx2'] as const)('%s: the worst one-frame share of the reach, in the travel and on the way home, is the same at fast, at skip and in between as at normal speed (both games\' profiles; 60 Hz, every 0.25 ms offset); without the floor it is 2.5 to 20 times as big', (game) => {
    setPaceGame(game);
    const worst = (timeScale: number, floorCrossings?: false): { travel: number; home: number } => {
      const shape = resolveStrike(PROFILES[game], { distance: 1, height: 1.82, heft: 0, timeScale, arcGain: 1, ...(floorCrossings === false ? { floorCrossings } : {}) });
      const frame = FRAME * paceRate('action');
      let travel = 0;
      let home = 0;
      for (let t = 0; t + frame < shape.windupMs + shape.travelMs; t += 0.25) travel = Math.max(travel, sampleAt(shape, 'pre', t + frame).x - sampleAt(shape, 'pre', t).x);
      for (let t = 0; t + frame < shape.returnMs + shape.settleMs; t += 0.25) home = Math.max(home, sampleAt(shape, 'post', t).x - sampleAt(shape, 'post', t + frame).x);
      return { travel, home };
    };
    const normal = worst(1);
    expect(normal.travel).toBeGreaterThan(0.1);
    expect(normal.travel).toBeLessThan(0.3);
    for (const timeScale of [0.64, FAST, 0.1, SKIP]) {
      const now = worst(timeScale);
      expect(now.travel, `${game} travel @${timeScale}`).toBeLessThanOrEqual(normal.travel * 1.005);
      expect(now.home, `${game} home @${timeScale}`).toBeLessThanOrEqual(normal.home * 1.005);
      if (timeScale === SKIP) continue; // unfloored, the whole travel is shorter than one frame: the step is the entire reach (the actor table below reads it)
      const raw = worst(timeScale, false);
      expect(raw.travel / normal.travel, `${game} raw travel @${timeScale}`).toBeGreaterThan(timeScale === 0.64 ? 1.2 : 2.4);
      expect(raw.home / normal.home, `${game} raw home @${timeScale}`).toBeGreaterThan(timeScale === 0.64 ? 1.2 : 2.4);
    }
  });

  it('a REAL profile (Chapter I\'s and Chapter IV\'s real-snappy rows, every figure of both tables) is untouched at every speed: the floor is a house-strike rule', () => {
    let n = 0;
    for (const game of ['ffx', 'ffx2'] as const) {
      for (const row of Object.values(REAL_MOTION[game])) {
        if (!row.attack) continue;
        for (const kind of ['real', 'snappy'] as const) {
          for (const timeScale of [1, FAST, SKIP]) {
            const o = { distance: 1.4, height: 1.82, timeScale };
            expect(resolveStrike(profileOfRow(game, row.attack, kind), o)).toEqual(resolveStrike(profileOfRow(game, row.attack, kind), { ...o, floorCrossings: false }));
            n++;
          }
        }
      }
    }
    expect(n).toBeGreaterThan(40);
  });

  it('the marks at fast: the contact falls at wind-up x 0.32 + the travel (about 298 ms on screen at the default pace, not 128), the move ends later than the speed alone puts it, and at normal nothing moved', () => {
    const onScreen = (timeScale: number): ReturnType<typeof strikeMarks> => {
      const m = strikeMarks(resolveStrike(PROFILES.ffx, { distance: 1.4, height: 1.82, timeScale }));
      const k = paceFactor('action'); // paced ms are on screen at the pace's factor
      return Object.fromEntries(Object.entries(m).map(([name, v]) => [name, v * k])) as unknown as ReturnType<typeof strikeMarks>;
    };
    const fast = onScreen(FAST);
    expect(fast.contact).toBeCloseTo(150 * FAST + 250, 6);
    expect(fast.end).toBeCloseTo(150 * FAST + 250 + 200 * FAST + 400 + 100 * FAST, 6);
    const normal = onScreen(NORMAL);
    expect(normal.contact).toBeCloseTo(400, 6);
    expect(normal.end).toBeCloseTo(1100, 6);
  });
});

describe('on the real actor: the step per frame is the normal speed\'s at every speed', () => {
  const normalPeak = new Map<string, { px: number; share: number }>();
  const key = (drawn: number, reach: number): string => `${drawn}:${reach}`;

  it('at normal speed the strike is byte for byte the one without the floor: every frame\'s registered head and feet', () => {
    for (const drawn of SIZES) {
      for (const reach of REACHES) {
        const a = play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: NORMAL, frames: FRAMES });
        const b = play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: NORMAL, frames: FRAMES, floorCrossings: false });
        expect(a.track.map((s) => [s.head, s.feet]), `${drawn} ${reach}`).toEqual(b.track.map((s) => [s.head, s.feet]));
        expect(a.marks).toEqual(b.marks);
        const peak = worstSteps(a.track, 1, FRAMES).fwd;
        normalPeak.set(key(drawn, reach), { px: peak, share: peak / drawn });
      }
    }
  });

  it.each(SPEEDS.filter((s) => s !== NORMAL))('at scale %d no frame of the whole move steps further than the same strike does at normal speed (px, and as a share of the figure\'s drawn height), forward or back', (timeScale) => {
    for (const drawn of SIZES) {
      for (const reach of REACHES) {
        const base = play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: NORMAL, frames: FRAMES });
        const now = play({ name: 'auron', drawn, reach, kind: 'strike', timeScale, frames: FRAMES });
        const was = worstSteps(base.track, 1, FRAMES);
        const is = worstSteps(now.track, 1, FRAMES);
        expect(is.fwd, `forward ${drawn}px ${reach} @${timeScale}`).toBeLessThanOrEqual(was.fwd * 1.03 + 1);
        expect(is.back, `back ${drawn}px ${reach} @${timeScale}`).toBeLessThanOrEqual(was.back * 1.03 + 1);
        expect(is.fwd / drawn, `share ${drawn}px ${reach} @${timeScale}`).toBeLessThanOrEqual((was.fwd / drawn) * 1.03 + 0.003);
      }
    }
  });

  it.each(SPEEDS)('at scale %d the registered head reads no jerk over 100 px in the whole move, and the fastest frame is no spike: its ratio to its neighbours is under 1.7 (the detector\'s line is 3), at 280 to 600 px and 1.4 to 4.4 units', (timeScale) => {
    for (const drawn of SIZES) {
      for (const reach of REACHES) {
        const { track } = play({ name: 'auron', drawn, reach, kind: 'strike', timeScale, frames: FRAMES });
        expect(jerksOf(track, FRAMES).filter((e) => e.px > 100), `${drawn}px ${reach} @${timeScale}`).toEqual([]);
        const f = fastest(track, FRAMES);
        expect(f.ratio, `${drawn}px ${reach} @${timeScale}`).toBeLessThan(1.7);
        expect(f.ratio).toBeLessThan(CFG.motion.jerkRatio);
      }
    }
  });

  it('and so no isolated step the untreated lunge (what ?treated=pack plays) does not have: the lunge reads no jerk over 100 px either, its own jerks are 27 to 61 px', () => {
    let worstLunge = 0;
    let worstStrike = 0;
    for (const drawn of SIZES) {
      for (const reach of REACHES) {
        const lunge = jerksOf(play({ name: 'auron', drawn, reach, kind: 'lunge', frames: FRAMES }).track, FRAMES);
        worstLunge = Math.max(worstLunge, ...lunge.map((e) => e.px));
        for (const timeScale of SPEEDS) worstStrike = Math.max(worstStrike, ...jerksOf(play({ name: 'auron', drawn, reach, kind: 'strike', timeScale, frames: FRAMES }).track, FRAMES).map((e) => e.px));
      }
    }
    expect(worstLunge).toBeGreaterThan(20);
    expect(worstLunge).toBeLessThan(70);
    expect(worstStrike).toBeLessThan(100); // no strike jerk over 100 px at any of the five speeds (what is left is the wind-up's pull-back and the end-of-move idle swap, 28 to 69 px, the lunge's own size)
  });

  it('the travel and the way home take as many frames at fast as at normal: from the travel peak to the way-home peak is 21 frames at fast (the control arm: 10) and about 29 at normal', () => {
    const gap = (o: { timeScale: number; floorCrossings?: false }): number => {
      const { marks } = play({ name: 'auron', drawn: 420, reach: 1.4, kind: 'strike', ...o, frames: FRAMES });
      return marks['settlePeak']! - marks['travelPeak']!;
    };
    expect(gap({ timeScale: NORMAL })).toBeGreaterThanOrEqual(27);
    expect(gap({ timeScale: NORMAL })).toBeLessThanOrEqual(33);
    expect(gap({ timeScale: FAST, floorCrossings: false })).toBe(10); // the 10 frames of the review's 13 hop swaps
    expect(gap({ timeScale: FAST })).toBeGreaterThanOrEqual(19);
    expect(gap({ timeScale: FAST })).toBeLessThanOrEqual(23);
  });
});

describe('the control arm: without the floor the same strike hops at fast and at skip (release 72)', () => {
  it('at fast the unfloored strike\'s fastest frame is a spike (ratio over 8) and a jerk over 90 px in all nine configurations, over 100 px in eight; floored, none (the table of r73-fast.md section 3)', () => {
    let over100 = 0;
    for (const drawn of SIZES) {
      for (const reach of REACHES) {
        const raw = play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: FAST, frames: FRAMES, floorCrossings: false });
        const f = fastest(raw.track, FRAMES);
        expect(f.ratio, `${drawn}px ${reach}`).toBeGreaterThan(8);
        const biggest = Math.max(0, ...jerksOf(raw.track, FRAMES).map((e) => e.px));
        expect(biggest, `${drawn}px ${reach}`).toBeGreaterThan(90);
        if (biggest > 100) over100++;
        const now = play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: FAST, frames: FRAMES });
        expect(fastest(now.track, FRAMES).peak, `${drawn}px ${reach}`).toBeLessThan(f.peak / 2.5); // the peak step is a third of it
      }
    }
    expect(over100).toBeGreaterThanOrEqual(8);
  });

  it('at skip the unfloored strike crosses the stage in one frame (a step of 0.25 to 0.9 of the drawn height, ratio over 10); floored it does not', () => {
    for (const drawn of SIZES) {
      for (const reach of REACHES) {
        const raw = fastest(play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: SKIP, frames: FRAMES, floorCrossings: false }).track, FRAMES);
        expect(raw.ratio, `${drawn}px ${reach}`).toBeGreaterThan(10);
        expect(raw.peak / drawn, `${drawn}px ${reach}`).toBeGreaterThan(0.24);
        expect(fastest(play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: SKIP, frames: FRAMES }).track, FRAMES).ratio).toBeLessThan(1.7);
      }
    }
  });
});

/** An event context with the presenter's own waits recorded: `sleep` never settles, so a wait is read, not run. */
function ctxAt(speed: 'normal' | 'fast' | 'skip', timeScale = 1): { ctx: EventCtx; sleeps: number[] } {
  const sleeps: number[] = [];
  const ctx = { speed: () => speed, deps: { timeScale }, stage: { actor: () => ({ strikeHeft: () => 0 }) }, sleep: (ms: number) => (sleeps.push(ms), new Promise<void>(() => {})) } as unknown as EventCtx;
  return { ctx, sleeps };
}

describe('the blow still lands on the strike: the presenter\'s waits and the swing\'s lead follow the later contact', () => {
  it('strikeLagMs: none at normal speed, with the curves off, at skip (scale 0) and for any scale of 1 or more; at fast the travel\'s 208 ms again for each 0.32 of it (443 ms at scale 1), and heft stretches it', () => {
    expect(strikeLagMs(0, 1)).toBe(0);
    expect(strikeLagMs(0, 1.5)).toBe(0);
    expect(strikeLagMs(0, 0)).toBe(0);
    expect(strikeLagMs(0, SPEED_SCALE.skip)).toBe(0);
    expect(strikeLagMs(0, FAST)).toBe(Math.round((PROFILES.ffx.travelMs / defaultPaceFactor('ffx')) * (1 / FAST - 1)));
    expect(strikeLagMs(0, FAST)).toBe(443);
    expect(strikeLagMs(1, FAST)).toBeGreaterThan(strikeLagMs(0, FAST));
    expect(strikeLagMs(1, FAST)).toBe(Math.round(((PROFILES.ffx.travelMs * 1.3) / defaultPaceFactor('ffx')) * (1 / FAST - 1)));
    setCurvesMode('today');
    expect(strikeLagMs(0, FAST)).toBe(0);
  });

  it('strikeBeatNow at speed 1 (the default) is what it was; at fast, times the speed and the pace, it is the contact on screen: 298 ms, wind-up x 0.32 + the whole travel', () => {
    expect(strikeBeatNow()).toBe(Math.round((PROFILES.ffx.windupMs + PROFILES.ffx.travelMs) / defaultPaceFactor('ffx')));
    expect(strikeBeatNow(0, undefined, NORMAL) * NORMAL * paceFactor('action')).toBeCloseTo(400, 0);
    expect(strikeBeatNow(0, undefined, FAST) * FAST * paceFactor('action')).toBeCloseTo(150 * FAST + 250, 0);
    expect(strikeBeatNow(0, 777, FAST)).toBe(777); // a real strike\'s contact is its own: no lag added
    expect(strikeBeatNow(1, undefined, FAST) * FAST * paceFactor('action')).toBeCloseTo(150 * 1.3 * FAST + 250 * 1.3, 0);
  });

  it('the beat the sound is asked for lands on the actor\'s contact frame: ask-to-contact on the real actor agrees with the beat to a frame, at normal and at fast', () => {
    for (const timeScale of [NORMAL, FAST]) {
      const { marks } = play({ name: 'auron', drawn: 420, reach: 1.4, kind: 'strike', timeScale, frames: FRAMES });
      const beat = strikeBeatNow(0, undefined, timeScale) * timeScale * paceFactor('action'); // ms on screen
      expect(Math.abs(marks['contact']! * FRAME - beat), `@${timeScale}`).toBeLessThan(2 * FRAME);
    }
  });

  it('the swing cue the presenter plays asks for its peak on the contact on screen: 400 ms at normal speed, 298 at fast, a boss\'s 520 at normal and 387 at fast (steady pace)', () => {
    const hefts: Record<string, number> = { tidus: 0, 'seymour-flux': 1 };
    const beat = (who: string, speed: 'normal' | 'fast', seq: number): number | undefined => {
      let asked: { beatMs?: number } | undefined;
      const ctx = { actingId: who, speed: () => speed, deps: { audio: { playSfx: (_k: string, o: { beatMs?: number }) => (asked = o) }, sfxVoice: () => ({ key: 'swing', events: ['swing-flux'] }) }, stage: { actor: (id: string) => ({ strikeHeft: () => hefts[id] ?? 0 }) } } as never;
      noteSfxEvent(ctx, { type: 'action-start', seq, actorId: who, command: { kind: 'attack' } } as never);
      playCue(ctx, 'attack');
      return asked?.beatMs;
    };
    expect(beat('tidus', 'normal', 0)).toBeCloseTo(400, 0);
    expect(beat('tidus', 'fast', 1)).toBeCloseTo(150 * FAST + 250, 0);
    expect(beat('seymour-flux', 'normal', 2)).toBeCloseTo(520, 0);
    expect(beat('seymour-flux', 'fast', 3)).toBeCloseTo(1.3 * (150 * FAST + 250), 0);
  });

  it('playbackScaleOf is the speed times the timeScale (0 under skip), and tolerates a context with no speed', () => {
    expect(playbackScaleOf(ctxAt('normal').ctx)).toBe(1);
    expect(playbackScaleOf(ctxAt('fast').ctx)).toBe(FAST);
    expect(playbackScaleOf(ctxAt('fast', 2).ctx)).toBeCloseTo(0.64, 10);
    expect(playbackScaleOf(ctxAt('skip').ctx)).toBe(0);
    expect(playbackScaleOf({} as never)).toBe(1);
    expect(moveScale(ctxAt('skip').ctx)).toBe(SKIP); // the strike\'s own scale is floored; the waits\' is not
  });

  it('the contact beat waits for the strike it will meet: CONTACT_WAIT_MAX_MS and the hold cap grow by the lag at fast, stay what they were at normal speed and at skip', () => {
    const asked = (speed: 'normal' | 'fast' | 'skip'): { hold: number; wait: number } => {
      const { ctx, sleeps } = ctxAt(speed);
      const c = armContact(ctx, 'tidus');
      const hold = sleeps[0]!;
      void meetContact(ctx, 'seymour-flux');
      const wait = sleeps[1]!;
      c.reached();
      releaseContact(ctx);
      return { hold, wait };
    };
    const normal = asked('normal');
    expect(normal).toEqual({ hold: 700 + 150, wait: 400 });
    const lag = strikeLagMs(0, FAST);
    expect(asked('fast')).toEqual({ hold: 700 + 150 + lag, wait: 400 + lag });
    expect(asked('skip')).toEqual(normal); // the presenter's sleep is zero there anyway
    // on screen the fast wait is the blow's 128 ms plus the travel kept, and it covers the contact (298 ms) with room: it never gives up on the strike before it lands
    expect((400 + lag) * FAST * paceFactor('action')).toBeGreaterThan(150 * FAST + 250 - 150 * FAST); // the wait counts from the end of the wind-up sleep
    expect((400 + lag) * FAST * paceFactor('action')).toBeGreaterThan(250);
  });

  it('with the curves off (today\'s lunge) the contact beat is exactly what it was at every speed', () => {
    setCurvesMode('today');
    for (const speed of ['normal', 'fast'] as const) {
      const { ctx, sleeps } = ctxAt(speed);
      const c = armContact(ctx, 'tidus');
      void meetContact(ctx, 'seymour-flux');
      c.reached();
      releaseContact(ctx);
      expect(sleeps).toEqual([700, 400]);
    }
  });
});
