/**
 * r73-fast review fixes (the adversarial review of 0663dca19: 0 critical, 2 major, 6 minor; both games for the shared plumbing, the house strike only; presentation, no number of a fight changes; the driver's call under Bailey's
 * delegation of 2026-10-31, his to overturn). `docs/handoff/r73-fast.md` section 11 maps each finding to its fix.
 *
 *  - MAJOR-1 (fast-forward is slower by design: 483 ms against 317 per party action, the speed-up 3.0x to 2.0x): no off word existed, so Bailey could not compare. `?fastfloor=floor|part|today` (`motion/FastFloor.ts`) is the comparison.
 *    The default is unchanged. `part` keeps 0.75 of the crossings (the handoff's guess of 0.6 reads a hop on the detector: pinned below as the reason it is not offered).
 *  - MINOR-1: `KeyPoses.idleAtEnd`'s pose net (900 ms, sized for the 352 ms move of release 72) put the idle up BEFORE the strike's own `end` mark at fast: `marksNetMs` follows the crossings.
 *  - MINOR-2: the sound pass's `attackBeat` call added the floor's lag to a REAL striker (Chapters I and IV), moving its blow marker from early to late: a real strike is not floored, so its marker is release 72's at every speed.
 *  - MINOR-4: mutants the lane's tests let live: the contact beat's heft, FFX-2's profile, the real branches of `armContact` / `meetContact`, the sound pass's `attackBeat` scale, the Evrae status sentence.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sfxVoiceFor } from '../../../src/app/screens/battleSfxVoice.ts';
import type { BattleEvent, BattleState } from '../../../src/battle/common/types.ts';
import { REAL_MOTION } from '../../../src/data/motion/realMotion.ts';
import { noteSfxEvent, playCue } from '../../../src/engine/BattlePresenterSfx.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';
import { SPEED_SCALE } from '../../../src/engine/BattlePresenterUtil.ts';
import { CONTACT_HOLD_MAX_MS, CONTACT_REAL_SLACK_MS, CONTACT_WAIT_MAX_MS, CURVES_CONTACT_EXTRA_MS, armContact, meetContact, releaseContact } from '../../../src/engine/ContactBeat.ts';
import { MARKS_NET_MS, idleAtEnd, impactAtApex, marksNetMs } from '../../../src/engine/KeyPoses.ts';
import { crossingLagMs, playbackScaleOf, strikeBeatNow, strikeLagMs } from '../../../src/engine/StrikeBeat.ts';
import { PROFILES, crossingFloors, defaultPaceFactor, heftFactors, resolveStrike, strikeMarks } from '../../../src/engine/motion/StrikeCurve.ts';
import { startAttackMove } from '../../../src/engine/motion/CurveBeats.ts';
import { FAST_FLOOR_KEEP, fastFloor, fastFloorFromSearch, fastFloorKeep, setFastFloor } from '../../../src/engine/motion/FastFloor.ts';
import { setCurvesMode, type CurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { PIECE_HOLDS, setDemoChapter, setTreatedScope, treatedHold } from '../../../src/engine/motion/DemoGate.ts';
import { profileOfRow } from '../../../src/engine/motion/RealMotion.ts';
import { realContactMsOf } from '../../../src/engine/motion/RealBeats.ts';
import { paceFactor, setPaceGame } from '../../../src/engine/pace.ts';
import { setAudioNew, setPassAddress, setPassChapter } from '../../../src/audio/pass/passSwitch.ts';
import { resetBlows } from '../../../src/audio/pass/passMask.ts';
import { passLogGet } from '../../../src/audio/pass/passLog.ts';
import { CFG, fastest, jerksOf, play, worstSteps } from './strike-trace-fixture.ts';
import { reset } from './head-lock-fixture.ts';

const NORMAL = SPEED_SCALE.normal;
const FAST = SPEED_SCALE.fast;
const SKIP = 0.02; // `moveScale`'s floor under `skip`
const ROOT = resolve(__dirname, '..', '..', '..');

/** A chapter that plays the house curves in each game (`real` held in Chapter VIII), and the real-snappy booth chapters. */
const HOUSE = { ffx: 'evrae-airship', ffx2: 'ffx2-leblanc' } as const;

function setup(game: 'ffx' | 'ffx2' = 'ffx', chapter: string = HOUSE[game], mode: CurvesMode = 'new'): void {
  setPaceGame(game);
  setTreatedScope('all');
  setCurvesMode(mode);
  setDemoChapter(chapter);
}

beforeEach(() => setup());
afterEach(() => {
  setPaceGame('other');
  setTreatedScope(null);
  setCurvesMode(null);
  setDemoChapter(undefined);
  setFastFloor(null);
  setAudioNew(null);
  setPassAddress(undefined);
  setPassChapter(undefined);
  resetBlows();
  passLogGet(true);
  reset();
});

/** An event context with the presenter's own waits recorded (`sleep` never settles: a wait is read, not run). `strikeHeft` is the attacker's heft. */
function ctxAt(speed: 'normal' | 'fast' | 'skip', o: { heft?: number; timeScale?: number } = {}): { ctx: EventCtx; sleeps: number[] } {
  const sleeps: number[] = [];
  const actor = { strikeHeft: () => o.heft ?? 0, setPose: (): void => undefined };
  const ctx = { speed: () => speed, deps: { timeScale: o.timeScale ?? 1 }, actingId: null, stage: { actor: () => actor }, sleep: (ms: number) => (sleeps.push(ms), new Promise<void>(() => {})) } as unknown as EventCtx;
  return { ctx, sleeps };
}

describe('MAJOR-1: ?fastfloor= compares the floor with release 72\'s fast and a middle', () => {
  it('reads floor (the default) unless the address names part or today; case and spaces do not matter; a nonsense word is the default', () => {
    for (const s of [undefined, '', '?', '?fastfloor=', '?fastfloor=nonsense', '?fastfloor=off', '?x=y', '?fastfloor=floor']) expect(fastFloorFromSearch(s), String(s)).toBe('floor');
    expect(fastFloorFromSearch('?fastfloor=part')).toBe('part');
    expect(fastFloorFromSearch('?fastfloor=today')).toBe('today');
    expect(fastFloorFromSearch('?a=1&fastfloor=%20TODAY%20')).toBe('today');
  });

  it('the shares: floor keeps all of a crossing, part 0.75, today none; setFastFloor forces a word and null reads the address again', () => {
    expect(FAST_FLOOR_KEEP).toEqual({ floor: 1, part: 0.75, today: 0 });
    expect(fastFloor()).toBe('floor');
    expect(fastFloorKeep()).toBe(1);
    setFastFloor('part');
    expect(fastFloorKeep()).toBe(0.75);
    setFastFloor('today');
    expect(fastFloorKeep()).toBe(0);
    setFastFloor(null);
    expect(fastFloor()).toBe('floor');
  });

  it.each(['ffx', 'ffx2'] as const)('%s: crossingKeep scales the floor (1 = the floor, 0 = floorCrossings false, 0.75 = three quarters of the normal-speed length) and does nothing at a scale of 1 or more, in skip or on a real profile', (game) => {
    for (const timeScale of [0.64, FAST, 0.1]) {
      for (const heft of [0, 1]) {
        const o = { distance: 2, height: 1.82, heft, timeScale };
        const normal = resolveStrike(PROFILES[game], { ...o, timeScale: 1 });
        const part = resolveStrike(PROFILES[game], { ...o, crossingKeep: 0.75 });
        expect(resolveStrike(PROFILES[game], { ...o, crossingKeep: 1 }), `${game} ${timeScale}`).toEqual(resolveStrike(PROFILES[game], o));
        expect(resolveStrike(PROFILES[game], { ...o, crossingKeep: 0 }), `${game} ${timeScale}`).toEqual(resolveStrike(PROFILES[game], { ...o, floorCrossings: false }));
        expect(part.travelMs, `${game} ${timeScale} ${heft}`).toBeCloseTo(normal.travelMs * 0.75, 9);
        expect(part.returnMs).toBeCloseTo(normal.returnMs * 0.75, 9);
        for (const p of ['windupMs', 'holdMs', 'settleMs', 'snapMs'] as const) expect(part[p], p).toBeCloseTo(resolveStrike(PROFILES[game], { ...o, floorCrossings: false })[p], 9);
        expect(crossingFloors(PROFILES[game], heftFactors(heft), 0.75).travelMs).toBeCloseTo(crossingFloors(PROFILES[game], heftFactors(heft)).travelMs * 0.75, 9);
      }
    }
    for (const timeScale of [1, 1.7, SKIP]) expect(resolveStrike(PROFILES[game], { distance: 2, height: 1.82, timeScale, crossingKeep: 0.4 })).toEqual(resolveStrike(PROFILES[game], { distance: 2, height: 1.82, timeScale, floorCrossings: false }));
    let n = 0;
    for (const row of Object.values(REAL_MOTION[game])) {
      if (!row.attack) continue;
      for (const kind of ['real', 'snappy'] as const) {
        const o = { distance: 1.4, height: 1.82, timeScale: FAST };
        expect(resolveStrike(profileOfRow(game, row.attack, kind), { ...o, crossingKeep: 0.75 })).toEqual(resolveStrike(profileOfRow(game, row.attack, kind), { ...o, floorCrossings: false }));
        n++;
      }
    }
    expect(n).toBeGreaterThan(5);
  });

  it('the word reaches the strike: startAttackMove hands the actor nothing for the default, crossingKeep 0.75 for part and 0 for today', () => {
    const seen: Array<{ crossingKeep?: number; floorCrossings?: false }> = [];
    const actor = { strike: (p: { crossingKeep?: number; floorCrossings?: false }) => (seen.push(p), Promise.resolve()), strikeHeft: () => 0 };
    const ctx = { speed: () => 'fast', deps: { timeScale: 1 }, stage: { actor: () => actor } } as unknown as EventCtx;
    const contact = { hold: Promise.resolve(), reached: () => undefined };
    for (const word of ['floor', 'part', 'today'] as const) {
      setFastFloor(word);
      startAttackMove(ctx, actor as never, { distance: 1.4, house: 1 }, contact, false, 'sinspawn');
    }
    expect(seen).toHaveLength(3);
    expect('crossingKeep' in seen[0]!).toBe(false);
    expect(seen[1]!.crossingKeep).toBe(0.75);
    expect(seen[2]!.crossingKeep).toBe(0);
  });

  it('on the real actor part sits between the floor and release 72: a step 1.15 to 1.4 times normal\'s (never over 1 / 0.75), the detector\'s ratio under 2.7 and no jerk over 100 px, at 280 to 600 px, reaches 1.4 to 4.4, at 0.64, fast and 0.1', () => {
    for (const drawn of [280, 420, 600] as const) {
      for (const reach of [1.4, 3, 4.4] as const) {
        const base = { name: 'auron', drawn, reach, kind: 'strike' as const, frames: 90 };
        const normal = worstSteps(play({ ...base, timeScale: NORMAL }).track, 1, 90).fwd;
        for (const timeScale of [0.64, FAST, 0.1]) {
          const { track } = play({ ...base, timeScale, crossingKeep: 0.75 });
          const part = worstSteps(track, 1, 90).fwd;
          expect(part, `${drawn}px ${reach} @${timeScale}`).toBeLessThanOrEqual((normal / 0.75) * 1.03 + 1);
          expect(part, `${drawn}px ${reach} @${timeScale}`).toBeGreaterThan(normal * 1.15);
          expect(fastest(track, 90).ratio, `${drawn}px ${reach} @${timeScale}`).toBeLessThan(2.7);
          expect(jerksOf(track, 90).filter((e) => e.px > 100), `${drawn}px ${reach} @${timeScale}`).toEqual([]);
        }
        const floor = worstSteps(play({ ...base, timeScale: FAST }).track, 1, 90).fwd;
        const today = worstSteps(play({ ...base, timeScale: FAST, floorCrossings: false }).track, 1, 90).fwd;
        const part = worstSteps(play({ ...base, timeScale: FAST, crossingKeep: 0.75 }).track, 1, 90).fwd;
        expect(part).toBeGreaterThan(floor);
        expect(part).toBeLessThan(today * 0.6);
      }
    }
  });

  it('why the middle is 0.75 and not 0.6: at 0.6 the fastest frame reads a ratio of 3.7 or more (the detector\'s line is 3) and a jerk of over 100 px at reach 3 and 4.4', () => {
    for (const reach of [3, 4.4] as const) {
      const { track } = play({ name: 'auron', drawn: 420, reach, kind: 'strike', timeScale: FAST, frames: 90, crossingKeep: 0.6 });
      expect(fastest(track, 90).ratio, `${reach}`).toBeGreaterThan(CFG.motion.jerkRatio);
      expect(Math.max(0, ...jerksOf(track, 90).map((e) => e.px)), `${reach}`).toBeGreaterThan(100);
    }
  });

  it.each(['ffx', 'ffx2'] as const)('%s: the blow still lands on the strike under every word: strikeLagMs and the contact mark of the real actor agree to a frame (floor 443 ms at fast, part three quarters of the travel, today none)', (game) => {
    setup(game);
    const travel = (PROFILES[game].travelMs / defaultPaceFactor(game)) as number;
    expect(strikeLagMs(0, FAST)).toBe(Math.round(travel * (1 / FAST - 1)));
    setFastFloor('part');
    expect(strikeLagMs(0, FAST)).toBe(Math.round(travel * (0.75 / FAST - 1)));
    expect(strikeLagMs(0, 0.8)).toBe(0); // above the kept share the speed alone is longer than the floor
    expect(strikeLagMs(0, 0.64)).toBe(Math.round(travel * (0.75 / 0.64 - 1)));
    setFastFloor('today');
    expect(strikeLagMs(0, FAST)).toBe(0);
    expect(crossingLagMs(0, FAST)).toBe(0);
  });

  it('the blow lands on the strike under every word: the sound\'s beat is the actor\'s contact frame to two frames at normal, 0.64, fast and 0.1 (FFX profile, steady pace)', () => {
    for (const word of ['floor', 'part', 'today'] as const) {
      setFastFloor(word);
      for (const timeScale of [NORMAL, 0.64, FAST, 0.1]) {
        const { marks } = play({ name: 'auron', drawn: 420, reach: 1.4, kind: 'strike', timeScale, frames: 90, ...(word === 'part' ? { crossingKeep: 0.75 } : word === 'today' ? { floorCrossings: false as const } : {}) });
        const beat = strikeBeatNow(0, undefined, timeScale) * timeScale * paceFactor('action');
        expect(Math.abs(marks['contact']! * (1000 / 60) - beat), `${word} @${timeScale}`).toBeLessThan(2 * (1000 / 60));
      }
    }
  });
});

describe('MINOR-1: the pose net waits for the strike\'s own marks', () => {
  /** The net `idleAtEnd` sleeps for an armed strike (the real `impactAtApex` arms the marks, the real `idleAtEnd` asks), ms at timeScale 1. */
  function netAsked(speed: 'normal' | 'fast' | 'skip', o: { heft?: number; timeScale?: number } = {}, attacker = 'sinspawn'): number | undefined {
    const { ctx, sleeps } = ctxAt(speed, o);
    impactAtApex(ctx, attacker, armContact(ctx, attacker));
    sleeps.length = 0;
    idleAtEnd(ctx, ctx.stage.actor(attacker) as never, attacker);
    releaseContact(ctx);
    return sleeps[0]; // undefined: no marks were armed (the curves are off), so the idle goes up at once and there is no net
  }

  it('is exactly MARKS_NET_MS at normal speed, in skip, with the curves off, under ?fastfloor=today and for a REAL striker at any speed', () => {
    for (const heft of [0, 1]) {
      expect(netAsked('normal', { heft })).toBe(MARKS_NET_MS);
      expect(netAsked('skip', { heft })).toBe(MARKS_NET_MS);
      expect(netAsked('normal', { heft, timeScale: 1.5 })).toBe(MARKS_NET_MS);
    }
    setFastFloor('today');
    expect(netAsked('fast', { heft: 1 })).toBe(MARKS_NET_MS);
    setFastFloor(null);
    expect(netAsked('fast')!).toBeGreaterThan(MARKS_NET_MS);
    setup('ffx', 'seymour-flux', 'real-snappy'); // Chapter I: Tidus plays his real row, which the floor never touches
    expect(realContactMsOf({ stage: ctxAt('fast').ctx.stage }, 'tidus')).toBeDefined();
    for (const speed of ['normal', 'fast'] as const) expect(netAsked(speed, {}, 'tidus'), speed).toBe(MARKS_NET_MS);
    expect(marksNetMs(ctxAt('fast').ctx, 'tidus')).toBe(MARKS_NET_MS);
    setup('ffx', 'evrae-airship', 'today'); // the curves off: today's lunge
    expect(netAsked('fast')).toBeUndefined(); // there is no net at all
  });

  it.each(['ffx', 'ffx2'] as const)('%s: at 0.64, fast and 0.1 the net, on screen, is at least as long as the strike\'s end mark after its contact, for heft 0, 0.4 and 1 and for the floor and part (the action cannot end before the contact); without the lengthening it was shorter', (game) => {
    setup(game);
    let shorter = 0;
    for (const word of ['floor', 'part'] as const) {
      setFastFloor(word);
      for (const heft of [0, 0.4, 1]) {
        for (const speed of [0.64, FAST, 0.1]) {
          const shape = resolveStrike(PROFILES[game], { distance: 1.4, height: 1.82, heft, timeScale: speed, crossingKeep: FAST_FLOOR_KEEP[word] });
          const m = strikeMarks(shape);
          const tail = (m.end - m.contact) * paceFactor('action'); // from the blow to the figure being home, on screen
          const net = netAsked('fast', { heft, timeScale: speed / FAST })! * speed * paceFactor('action');
          expect(net, `${game} ${word} heft ${heft} @${speed}`).toBeGreaterThanOrEqual(tail - 1);
          if (MARKS_NET_MS * speed * paceFactor('action') < tail) shorter++; // release 72's net, as it stood, would have fired before the end mark
        }
      }
    }
    expect(shorter).toBeGreaterThan(6); // the fix is not vacuous: the old net was too short in most of these
  });

  it('crossingLagMs is the travel\'s lag plus the way home\'s: floors x (1 / speed - 1), zero at 1 or more, at skip (scale 0) and with the curves off', () => {
    const f = crossingFloors(PROFILES.ffx, heftFactors(0.5));
    expect(crossingLagMs(0.5, FAST)).toBe(Math.round((f.travelMs + f.returnMs) * (1 / FAST - 1)));
    expect(crossingLagMs(0.5, FAST)).toBeGreaterThan(strikeLagMs(0.5, FAST));
    for (const s of [1, 1.5, 0]) expect(crossingLagMs(0.5, s)).toBe(0);
    setCurvesMode('today');
    expect(crossingLagMs(0.5, FAST)).toBe(0);
  });
});

describe('MINOR-2: the sound pass\'s blow marker for a real striker is release 72\'s at every speed', () => {
  const state = { combatants: { tidus: { side: 'party' }, sinspawn: { side: 'enemy' } } } as unknown as BattleState;
  const hit = { type: 'damage', targetId: 'sinspawn', sourceId: 'tidus', amount: 100, element: 'none', crit: true, hitIndex: 0, hitCount: 1 } as unknown as BattleEvent;
  const start = { type: 'action-start', actorId: 'tidus', command: { kind: 'attack', targets: [] }, targets: ['sinspawn'] } as unknown as BattleEvent;
  const end = { type: 'action-end', actorId: 'tidus' } as unknown as BattleEvent;

  /** The dip a critical's swing cue asks for, ms ahead of the blow (what `attackBeat` was handed, already scaled): the sound pass is on in Chapter I's address. */
  function dipAhead(speed: 'normal' | 'fast', heft: number): number | undefined {
    setPassAddress('?pack=demo');
    setPassChapter('seymour-flux');
    const ahead: number[] = [];
    const audio = { playSfx: (): void => undefined, musicDip: (aheadMs: number): void => void ahead.push(aheadMs) };
    const ctx = { speed: () => speed, deps: { audio, sfxVoice: sfxVoiceFor('ffx', () => state), timeScale: 1 }, actingId: 'tidus', burst: { events: [start, hit, end], at: 0 }, stage: { vfx: {}, actor: () => ({ strikeHeft: () => heft }) }, sleep: () => Promise.resolve() } as unknown as EventCtx;
    noteSfxEvent(ctx, start);
    playCue(ctx, 'attack');
    return ahead[0];
  }

  it('a house striker: the marker is the contact on screen, with the floor\'s lag at fast (298 ms for a party figure, 128 + 170 at the default pace) and none at normal', () => {
    const at = (speed: 'normal' | 'fast', heft: number): number => strikeBeatNow(heft, undefined, speed === 'fast' ? FAST : NORMAL) * (speed === 'fast' ? FAST : NORMAL) * paceFactor('action');
    for (const heft of [0, 1]) {
      expect(dipAhead('normal', heft), `normal ${heft}`).toBeCloseTo(at('normal', heft), 6);
      expect(dipAhead('fast', heft), `fast ${heft}`).toBeCloseTo(at('fast', heft), 6);
    }
    expect(dipAhead('fast', 0)!).toBeCloseTo(150 * FAST + 250, 0);
    expect(dipAhead('fast', 0)!).toBeGreaterThan(dipAhead('normal', 0)! * FAST + 150); // the lag is in it: wind-up x 0.32 + the whole travel, not (wind-up + travel) x 0.32
  });

  it('a real striker (Tidus on his real-snappy row in Chapter I): the marker is release 72\'s, the house beat times the speed, with no lag at fast', () => {
    setup('ffx', 'seymour-flux', 'real-snappy');
    expect(realContactMsOf({ stage: { actor: () => ({ strikeHeft: () => 0 }) } as never }, 'tidus')).toBeDefined();
    const old = (speed: number): number => strikeBeatNow(0) * speed * paceFactor('action'); // release 72: `strikeBeatNow(heft)`, no scale argument
    expect(dipAhead('normal', 0)!).toBeCloseTo(old(NORMAL), 6);
    expect(dipAhead('fast', 0)!).toBeCloseTo(old(FAST), 6);
  });
});

describe('MINOR-4: the contact beat\'s waits under the mutants the lane\'s tests let live', () => {
  const asked = (speed: 'normal' | 'fast' | 'skip', attacker: string, heft = 0): { hold: number; wait: number } => {
    const { ctx, sleeps } = ctxAt(speed, { heft });
    const c = armContact(ctx, attacker);
    const hold = sleeps[0]!;
    void meetContact(ctx, 'foe');
    const wait = sleeps[1]!;
    c.reached();
    releaseContact(ctx);
    return { hold, wait };
  };

  it('a heavy attacker\'s waits grow with ITS heft, not a party figure\'s: heft 1 at fast waits strikeLagMs(1) longer, heft 0.5 in between', () => {
    const base = { hold: CONTACT_HOLD_MAX_MS + CURVES_CONTACT_EXTRA_MS, wait: CONTACT_WAIT_MAX_MS };
    for (const heft of [0, 0.5, 1]) {
      const lag = strikeLagMs(heft, FAST);
      expect(asked('fast', 'sinspawn', heft), `heft ${heft}`).toEqual({ hold: base.hold + lag, wait: base.wait + lag });
      expect(asked('normal', 'sinspawn', heft)).toEqual(base);
    }
    expect(strikeLagMs(1, FAST)).toBeGreaterThan(strikeLagMs(0.5, FAST));
    expect(strikeLagMs(0.5, FAST)).toBeGreaterThan(strikeLagMs(0, FAST));
  });

  it('FFX-2 reads its own profile: the lag, the sound\'s beat, the whole-move lag and the contact beat are Rikku-sized (200 ms travel at the 1.1 pace), not Tidus-sized', () => {
    setup('ffx2');
    const travel = PROFILES.ffx2.travelMs / defaultPaceFactor('ffx2');
    const ret = PROFILES.ffx2.returnMs / defaultPaceFactor('ffx2');
    expect(strikeLagMs(0, FAST)).toBe(Math.round(travel * (1 / FAST - 1)));
    expect(strikeLagMs(0, FAST)).toBe(386);
    expect(strikeLagMs(0, FAST)).not.toBe(443);
    expect(crossingLagMs(0, FAST)).toBe(Math.round((travel + ret) * (1 / FAST - 1)));
    expect(strikeBeatNow(0, undefined, FAST) * FAST * paceFactor('action')).toBeCloseTo(100 * FAST + 200, 0);
    expect(asked('fast', 'sinspawn')).toEqual({ hold: CONTACT_HOLD_MAX_MS + CURVES_CONTACT_EXTRA_MS + 386, wait: CONTACT_WAIT_MAX_MS + 386 });
    expect(netAskedIn('ffx2')).toBe(MARKS_NET_MS + crossingLagMs(0, FAST));
    expect(strikeMarks(resolveStrike(PROFILES.ffx2, { distance: 1.4, height: 1.82, timeScale: FAST })).contact * paceFactor('action')).toBeCloseTo(strikeBeatNow(0, undefined, FAST) * FAST * paceFactor('action'), 0); // the beat is the real shape's contact, to a ms
  });

  function netAskedIn(game: 'ffx' | 'ffx2'): number {
    setup(game);
    const { ctx, sleeps } = ctxAt('fast');
    impactAtApex(ctx, 'sinspawn', armContact(ctx, 'sinspawn'));
    sleeps.length = 0;
    idleAtEnd(ctx, ctx.stage.actor('sinspawn') as never, 'sinspawn');
    releaseContact(ctx);
    return sleeps[0]!;
  }

  it('a REAL striker\'s waits are the real contact\'s and do not move with the playback speed: no lag at fast or skip (Tidus on his real-snappy row)', () => {
    setup('ffx', 'seymour-flux', 'real-snappy');
    const { ctx } = ctxAt('normal');
    const real = realContactMsOf(ctx, 'tidus');
    expect(real).toBeDefined();
    const want = { hold: Math.max(CONTACT_HOLD_MAX_MS + CURVES_CONTACT_EXTRA_MS, real! + CONTACT_HOLD_MAX_MS), wait: Math.max(CONTACT_WAIT_MAX_MS, real! + CONTACT_REAL_SLACK_MS) };
    for (const speed of ['normal', 'fast', 'skip'] as const) expect(asked(speed, 'tidus'), speed).toEqual(want);
    expect(want.hold).toBeGreaterThan(CONTACT_HOLD_MAX_MS + CURVES_CONTACT_EXTRA_MS); // a real row's cap is its own
  });

  it('playbackScaleOf feeds the sound\'s beat: the swing\'s lead at fast is the contact on screen to a millisecond, not the unscaled beat', () => {
    const { ctx } = ctxAt('fast');
    expect(playbackScaleOf(ctx)).toBe(FAST);
    expect(strikeBeatNow(0, undefined, playbackScaleOf(ctx))).toBe(strikeBeatNow(0) + strikeLagMs(0, FAST));
  });
});

describe('MINOR-4 and MINOR-6: the hold rows and the handoff say what they should', () => {
  it.each(['evrae-airship', 'sin-face', 'mirror-aeons'] as const)('%s: the `real` reason carries a "Status at r73-fast" sentence before the unchanged "Lifts when" clause, and names no local path', (id) => {
    const why = treatedHold(id, 'real');
    expect(why, id).toBeDefined();
    const at = why!.indexOf('Status at r73-fast');
    expect(at, id).toBeGreaterThan(why!.indexOf('Status at release 72'));
    expect(why!.indexOf('Lifts when'), id).toBeGreaterThan(at);
    if (id !== 'sin-face') expect(at).toBeGreaterThan(why!.indexOf('Status at r73-fit'));
    expect(why).not.toMatch(/[A-Za-z]:[\\/]/);
    expect(Object.keys(PIECE_HOLDS[id]!).at(-1)).toBe('real');
  });

  it('Chapter VIII\'s sentence reads the fast speed off the swaps (29 / 31 / 28 / 16 at normal, 10 and 8 at fast) and says lifting the hold gains nothing', () => {
    const why = treatedHold('evrae-airship', 'real')!;
    const s = why.slice(why.indexOf('Status at r73-fast'), why.indexOf('Lifts when'));
    expect(s).toMatch(/Tidus 29 frames x 3, Kimahri 31 x 3, Rikku 28, Wakka 16 x 18/);
    expect(s).toMatch(/10 for the house strike and 8 for Wakka/);
    expect(s).toMatch(/lifting the hold gains nothing/);
  });

  it('the handoff states the review\'s counts and scopes: no stale test counts, the F-2 contact check reads the swap-to-damage frames, the smooth-at-every-speed claim is about house strikes, the flow profile is exact', () => {
    const p = resolve(ROOT, 'docs/handoff/r73-fast.md');
    expect(existsSync(p)).toBe(true);
    const text = readFileSync(p, 'utf8');
    const at = text.indexOf('## 11.');
    expect(at, 'section 11 maps the review to its fixes').toBeGreaterThan(0);
    const s11 = text.slice(at);
    for (const finding of ['MAJOR-1', 'MAJOR-2', 'MINOR-1', 'MINOR-2', 'MINOR-3', 'MINOR-4', 'MINOR-5', 'MINOR-6']) expect(s11, finding).toContain(finding);
    expect(text).not.toMatch(/\b28 tests\b/); // section 3 said 28, section 8 said 29
    expect(text).toMatch(/house-strike figures/);
    expect(s11).toMatch(/FLOW_PROFILE[\s\S]{0,120}house times[\s\S]{0,40}exact/);
  });
});
