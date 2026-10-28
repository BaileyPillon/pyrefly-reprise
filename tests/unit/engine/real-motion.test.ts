/**
 * `?curves=real` and `?curves=real-snappy` (integration 2, 2026-10-22; branch demo-motion-int-2; Bailey's decision 179: "Timing + camera now, full later"): the table reader, the two modes through
 * the sampler and the strike's clock, the sound's lead, the contact beat's waits, the cast lift, the hit reaction, the FFX-2 run home, the party-rig switch and the switchboard's two new keys.
 * Game cases (AGENTS.md rule 14): FFX numbers only in Chapter I, FFX-2 numbers only in Chapter IV.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REAL_MOTION } from '../../../src/data/motion/realMotion.ts';
import { PaintedActor, painting, reset, type Actor } from './head-lock-fixture.ts';
import { setMotionBeatSink, type MotionBeat } from '../../../src/engine/feel/MotionBeats.ts';
import { paceFactor, setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { curvesModeFromSearch, curvesOn, realKind, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts'; import { setMoveWord } from '../../../src/engine/motion/MoveSwitch.ts';
import { PARTY_RIG_SUBJECTS, partyRigAllowed, partyRigsModeFromSearch, setPartyRigsMode } from '../../../src/engine/motion/PartyRigsSwitch.ts';
import { APPROACH_LEAP_MIN, contactMsOf, holdMsOf, profileOfRow, realArcGainFromSearch, realHitMs, realKeyOf, realKoHoldMs, realRowOf, realStrikeProfile, realVictoryOf, setRealArcGain } from '../../../src/engine/motion/RealMotion.ts';
import { pchip } from '../../../src/engine/motion/RealStrike.ts';
import { realCastLift, realContactMsOf, realLeapBack, realProfileOf, realRecoilMs } from '../../../src/engine/motion/RealBeats.ts';
import { SQUASH_CAP, PROFILES, REAL_MIN_MS, defaultPaceFactor, resolveStrike, sampleAt, strikeMarks, type StrikeSample } from '../../../src/engine/motion/StrikeCurve.ts';
import { StrikeRun } from '../../../src/engine/motion/StrikeRun.ts';
import { strikeBeatNow } from '../../../src/engine/StrikeBeat.ts';
import { armContact, realContactPending, releaseContact } from '../../../src/engine/ContactBeat.ts';
import { blowHeld } from '../../../src/engine/motion/SkillTravel.ts';
import { SWITCHES, allNew, boardState, flipAll, switchOfCode } from '../../../src/app/demo/switchboardModel.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';
import { KO_BUCKLE_MS, fallRun } from '../../../src/engine/KoFall.ts';
import { startCheer } from '../../../src/engine/motion/ActorMoments.ts';
import { startAttackMove, strikeHoldOver } from '../../../src/engine/motion/CurveBeats.ts';
import type { StrikePlan } from '../../../src/engine/motion/StrikePlan.ts';
import type { ActorHandle } from '../../../src/engine/BattlePresenterPorts.ts';
import { realBuckleMs, realCheerShape, realFallMs } from '../../../src/engine/motion/RealMoments.ts';

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
});
afterEach(() => {
  setDemoChapter(undefined); setMoveWord('run', null); setMoveWord('strikeshape', null);
  setCurvesMode(null);
  setPartyRigsMode(null);
  setRealArcGain(null);
  setPaceGame('other');
});

/** A presenter context with only what the real beats read: art ids and actors (a head 1.82 over the floor, heft as given). */
function fakeCtx(art: Record<string, string>, heft = 0, sleeps: number[] = []): EventCtx {
  const actor = { position: { x: 0, y: 0, z: 0 }, headPoint: () => ({ x: 0, y: 1.82, z: 0 }), strikeHeft: () => heft };
  return {
    stage: { artOf: (id: string) => art[id], actor: () => actor },
    sleep: (ms: number): Promise<void> => {
      sleeps.push(ms);
      return new Promise<void>(() => {});
    },
  } as unknown as EventCtx;
}

const walk = (s: ReturnType<typeof resolveStrike>, phase: 'pre' | 'hold' | 'post', t: number): StrikeSample => sampleAt(s, phase, t, { x: 0, lift: 0, sy: 1, lean: 0 });

describe('the table reader', () => {
  it('maps art ids to the real-motion keys, per game', () => {
    expect(realKeyOf('tidus', 'ffx')).toBe('tidus');
    expect(realKeyOf('yuna', 'ffx')).toBe('yuna');
    expect(realKeyOf('seymour-flux', 'ffx')).toBe('seymourFlux');
    expect(realKeyOf('yuna-white-mage', 'ffx2')).toBe('yuna');
    expect(realKeyOf('rikku-dark-knight', 'ffx2')).toBe('rikku');
    expect(realKeyOf('paine-warrior', 'ffx2')).toBe('paine');
    expect(realKeyOf('ffx2-bahamut', 'ffx2')).toBe('bahamut');
    expect(realKeyOf('bahamut', 'ffx2')).toBe('bahamut');
    // the games stay apart: FFX's table has no Rikku or Bahamut, FFX-2's no Tidus or Seymour
    expect(realKeyOf('rikku-dark-knight', 'ffx')).toBeUndefined();
    expect(realKeyOf('tidus', 'ffx2')).toBeUndefined();
    expect(realKeyOf('seymour-flux', 'ffx2')).toBeUndefined();
    expect(realKeyOf(undefined, 'ffx')).toBeUndefined();
    expect(realKeyOf('valefor', 'ffx')).toBeUndefined();
  });
  it('holds every figure of the two chapters with an attack, and the real totals the lane verified', () => {
    for (const k of ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'seymourFlux']) expect(REAL_MOTION.ffx[k]?.attack, `ffx ${k}`).toBeDefined();
    for (const k of ['yuna', 'rikku', 'paine', 'bahamut']) expect(REAL_MOTION.ffx2[k]?.attack, `ffx2 ${k}`).toBeDefined();
    const total = (p: { windupMs: number; travelMs: number; holdMs: number; returnMs: number; settleMs: number }): number => p.windupMs + p.travelMs + p.holdMs + p.returnMs + p.settleMs;
    const tidus = REAL_MOTION.ffx['tidus']!.attack!;
    expect(total(tidus.real)).toBeCloseTo(2033.4, 0); // README: Tidus 2033 ms
    expect(total(tidus.snappy)).toBeCloseTo(1100, -1); // Bailey's pick, about 1.1 s
    expect(tidus.real.windupMs + tidus.real.travelMs).toBeCloseTo(666.7, 0); // the contact
    expect(tidus.arc).toBeCloseTo(0.212, 3);
    expect(tidus.returnArc).toBeCloseTo(0.857, 3);
    expect(total(REAL_MOTION.ffx['seymourFlux']!.attack!.real)).toBeCloseTo(4666.5, 0);
    expect(total(REAL_MOTION.ffx2['bahamut']!.attack!.real)).toBeCloseTo(4233.4, 0);
    for (const game of ['ffx', 'ffx2'] as const)
      for (const [k, row] of Object.entries(REAL_MOTION[game]))
        if (row.attack) {
          const snappy = total(row.attack.snappy);
          expect(snappy, `${game} ${k} snappy`).toBeGreaterThan(1080);
          expect(snappy, `${game} ${k} snappy`).toBeLessThan(1120);
          expect(total(row.attack.real), `${game} ${k} real`).toBeGreaterThan(snappy);
        }
  });
  it('answers the cast, the hit, the knock-out and the victory of a figure, and nothing for an unknown one', () => {
    expect(realRowOf('ffx', 'tidus')?.cast?.windupMs).toBeCloseTo(666.7, 0);
    expect(realRowOf('ffx', 'tidus')?.cast?.liftShare).toBeCloseTo(0.068, 3);
    expect(realHitMs('ffx', 'tidus')).toBeCloseTo(900, 0);
    expect(realHitMs('ffx2', 'rikku-dark-knight')).toBeCloseTo(900, 0);
    expect(realKoHoldMs('ffx', 'tidus', 75)).toBeCloseTo(1000 - 75, 0); // the floor impact at 1000 ms, less the cross
    expect(realKoHoldMs('ffx', 'tidus', 5000)).toBe(0);
    expect(realKoHoldMs('ffx', 'valefor', 75)).toBeUndefined();
    expect(realVictoryOf('ffx', 'tidus')?.poseMs).toBeCloseTo(3666.7, 0);
    expect(realVictoryOf('ffx', 'tidus')?.riseMs).toBeGreaterThan(300);
    expect(realRowOf('ffx', 'valefor')).toBeUndefined();
    expect(realStrikeProfile('ffx', 'valefor', 'real')).toBeUndefined();
  });
  it('the real arc gain is read from ?realarc= and defaults to 1', () => {
    expect(realArcGainFromSearch(undefined)).toBe(1);
    expect(realArcGainFromSearch('?realarc=0.5')).toBe(0.5);
    expect(realArcGainFromSearch('?realarc=0')).toBe(0);
    expect(realArcGainFromSearch('?realarc=9')).toBe(1);
    expect(realArcGainFromSearch('?realarc=nope')).toBe(1);
    expect(realArcGainFromSearch('?realarc=')).toBe(1);
  });
});

describe('the switch', () => {
  it('?curves=real and ?curves=real-snappy (and snappy) are modes; the pack alone is real-snappy since release 67 (new is release 66\'s, by name); today wins', () => {
    expect(curvesModeFromSearch('?curves=real')).toBe('real');
    expect(curvesModeFromSearch('?curves=real-snappy')).toBe('real-snappy');
    expect(curvesModeFromSearch('?curves=snappy')).toBe('real-snappy');
    expect(curvesModeFromSearch('?pack=demo')).toBe('real-snappy'); // release 67; `?curves=new` (release 66's) is pinned in release67-picks.test.ts
    expect(curvesModeFromSearch('?pack=demo&curves=real')).toBe('real');
    expect(curvesModeFromSearch('?pack=demo&curves=today')).toBe('today');
    expect(curvesModeFromSearch(undefined)).toBe('today');
    expect(curvesModeFromSearch('?pack=off')).toBe('today');
    expect(curvesModeFromSearch('')).toBe('real-snappy'); // r64 (item 200b): the conference pack is the default; release 67: its mode is real-snappy
  });
  it('a real mode turns the curves on in the two demo chapters only; realKind names the sub-mode', () => {
    for (const [mode, kind] of [['new', null], ['today', null], ['real', 'real'], ['real-snappy', 'snappy']] as const) {
      setCurvesMode(mode);
      setDemoChapter('seymour-flux');
      expect([curvesOn(), realKind()]).toEqual([mode !== 'today', kind]);
      setDemoChapter('ffx2-bahamut');
      expect([curvesOn(), realKind()]).toEqual([mode !== 'today', kind]);
      setDemoChapter('yunalesca');
      expect([curvesOn(), realKind()]).toEqual([false, null]);
      setDemoChapter(undefined);
      expect([curvesOn(), realKind()]).toEqual([false, null]);
    }
  });
});

describe('the strike in the two real modes', () => {
  const tidus = (kind: 'real' | 'snappy') => profileOfRow('ffx', REAL_MOTION.ffx['tidus']!.attack!, kind);
  const shapeOf = (kind: 'real' | 'snappy', o: { heft?: number; arcGain?: number; realGain?: number } = {}) =>
    resolveStrike(tidus(kind), { distance: 1.4, height: 1.82, timeScale: 1, ...o });

  it('real keeps the real phases at the real speed; snappy the same proportions at about 1.1 s', () => {
    setMoveWord('strikeshape', 'today'); // the clip's own proportions: the default word since release 67 is travel (release67-strikeshape.test.ts)
    const k = 1 / defaultPaceFactor('ffx');
    const real = shapeOf('real');
    expect(real.windupMs).toBeCloseTo(566.7 * k, 0);
    expect(real.travelMs).toBeCloseTo(100 * k, 0);
    expect(real.holdMs).toBeCloseTo(533.3 * k, 0);
    const snap = shapeOf('snappy');
    const sum = (s: typeof real): number => s.windupMs + s.travelMs + s.holdMs + s.returnMs + s.settleMs;
    expect(sum(snap)).toBeCloseTo(1100 * k, -1);
    expect(sum(real) / sum(snap)).toBeGreaterThan(1.8); // Tidus's real attack is 46 percent longer than the pick: 2033 vs 1100
    // proportions kept: the contact sits at the same share of the move
    expect((snap.windupMs + snap.travelMs) / sum(snap)).toBeCloseTo((real.windupMs + real.travelMs) / sum(real), 1);
  });
  it('a boss: real is not stretched by its heft again, snappy keeps the house heft stretch', () => {
    setMoveWord('strikeshape', 'today'); // the clip's own proportions (release 67's default word is travel)
    const row = REAL_MOTION.ffx['seymourFlux']!.attack!;
    const k = 1 / defaultPaceFactor('ffx');
    const real = resolveStrike(profileOfRow('ffx', row, 'real'), { distance: 2, height: 4.1, heft: 1, timeScale: 1 });
    expect(real.windupMs).toBeCloseTo(row.real.windupMs * k, 0);
    const snap = resolveStrike(profileOfRow('ffx', row, 'snappy'), { distance: 2, height: 4.1, heft: 1, timeScale: 1 });
    expect(snap.windupMs).toBeCloseTo(row.snappy.windupMs * k * 1.3, 0);
    expect(snap.holdMs).toBeCloseTo(row.snappy.holdMs * k * 1.35, 0);
  });
  it('a zero-length swing (Lulu\'s doll) is floored, never a divide by zero', () => {
    const row = REAL_MOTION.ffx['lulu']!.attack!;
    expect(row.real.travelMs).toBe(0);
    for (const kind of ['real', 'snappy'] as const) {
      const s = resolveStrike(profileOfRow('ffx', row, kind), { distance: 1.4, height: 1.82, timeScale: 1 });
      expect(s.travelMs).toBeGreaterThanOrEqual(REAL_MIN_MS);
      const at = walk(s, 'pre', s.windupMs + s.travelMs);
      for (const v of [at.x, at.lift, at.sy, at.lean]) expect(Number.isFinite(v)).toBe(true);
    }
  });
  it('Tidus leaps: the approach lifts to about 21 percent of his height, x follows the recorded run, nothing sinks, the scale stays in the cap', () => {
    expect(REAL_MOTION.ffx['tidus']!.attack!.arc).toBeGreaterThanOrEqual(APPROACH_LEAP_MIN);
    const s = shapeOf('real');
    const contact = s.windupMs + s.travelMs;
    let top = 0;
    let lastX = -1;
    for (let t = 0; t <= contact; t += contact / 400) {
      const p = walk(s, 'pre', t);
      top = Math.max(top, p.lift);
      expect(p.lift).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeGreaterThanOrEqual(lastX - 1e-9); // the run only goes forward
      lastX = p.x;
      expect(p.sy).toBeGreaterThanOrEqual(1 - SQUASH_CAP - 1e-9);
      expect(p.sy).toBeLessThanOrEqual(1 + SQUASH_CAP + 1e-9);
    }
    expect(top).toBeGreaterThan(0.19);
    expect(top).toBeLessThan(0.22);
    expect(walk(s, 'pre', 0).x).toBe(0);
    expect(walk(s, 'pre', 0).lift).toBe(0);
    // hands over to the hold with no pop: x and lift at the contact are the hold's first frame's
    const end = walk(s, 'pre', contact);
    const hold = walk(s, 'hold', 0);
    expect(end.x).toBeCloseTo(hold.x, 6);
    expect(end.lift).toBeCloseTo(0, 2);
    expect(Math.abs(end.sy - hold.sy)).toBeLessThan(0.01);
  });
  it('Tidus returns in a flip: the lift of the way home peaks near 86 percent of his height, starts and ends on the floor', () => {
    const s = shapeOf('real');
    let top = 0;
    const first = walk(s, 'post', 0);
    for (let t = 0; t < s.returnMs; t += s.returnMs / 400) top = Math.max(top, walk(s, 'post', t).lift);
    expect(top).toBeGreaterThan(0.8);
    expect(top).toBeLessThan(0.88);
    expect(first.lift).toBeCloseTo(0, 6); // eased in: no pop off the hold
    expect(first.x).toBeCloseTo(1, 1);
    const home = walk(s, 'post', s.returnMs - 1e-6);
    expect(home.lift).toBeLessThan(0.01);
    expect(home.x).toBeCloseTo(-s.homeOver, 2);
  });
  it('the global gain scales every real lift, and 0 takes the arcs out (a flat real timing)', () => {
    const full = shapeOf('real', { realGain: 1 });
    const half = shapeOf('real', { realGain: 0.5 });
    const none = shapeOf('real', { realGain: 0 });
    const peak = (s: typeof full): number => {
      let m = 0;
      for (let t = 0; t <= s.windupMs + s.travelMs; t += 5) m = Math.max(m, walk(s, 'pre', t).lift);
      return m;
    };
    expect(peak(half)).toBeCloseTo(peak(full) / 2, 3);
    expect(peak(none)).toBe(0);
    const afterRunIn = shapeOf('real', { arcGain: 0 }); // after an FFX-2 run-in the leap has carried the lift: no lift of its own, going or coming
    expect(walk(afterRunIn, 'post', afterRunIn.returnMs * 0.3).lift).toBe(0);
    expect(walk(afterRunIn, 'pre', afterRunIn.windupMs * 0.9).lift).toBe(0);
  });
  it('a crouching attacker (Yuna, Auron) has no leaping approach: the house wind-up and travel with the real durations', () => {
    const yuna = profileOfRow('ffx', REAL_MOTION.ffx['yuna']!.attack!, 'real');
    expect(yuna.real?.approach).toBe(false);
    const s = resolveStrike(yuna, { distance: 1.4, height: 1.82, timeScale: 1 });
    expect(walk(s, 'pre', s.windupMs * 0.5).x).toBeLessThanOrEqual(0); // the pull back of the house wind-up
    expect(walk(s, 'pre', s.windupMs + s.travelMs).x).toBeGreaterThan(1);
    const auron = profileOfRow('ffx', REAL_MOTION.ffx['auron']!.attack!, 'real');
    expect(auron.real?.returnProfile).toBeUndefined(); // 2 percent: no leap back, the house return
  });
  it('the strike\'s clock walks the real move: the contact mark falls on wind-up plus travel and the whole move is the real total', () => {
    const s = shapeOf('real');
    const run = new StrikeRun(s, 1.4, 1.82, null, true);
    let contactAt = -1;
    let ended = -1;
    run.on('contact', () => (contactAt = run.time));
    run.on('end', () => (ended = run.time));
    for (let i = 0; i < 4000 && !run.done; i++) run.advance(1);
    const k = 1 / defaultPaceFactor('ffx');
    expect(contactAt).toBeCloseTo((566.7 + 100) * k, 0);
    expect(ended).toBeCloseTo(2033.4 * k, 0);
    expect(run.marks.contact).toBeCloseTo((566.7 + 100) * k, 0);
    // the fastest frame (the sound's and the smear's) is inside the swing, after the wind-up
    expect(run.marks.travelPeak).toBeGreaterThan(run.marks.windupEnd);
    expect(run.marks.travelPeak).toBeLessThanOrEqual(run.marks.contact);
  });
  it('120 Hz and 60 Hz walk the same real move', () => {
    const s = shapeOf('real');
    const at = (frameMs: number): StrikeSample => {
      const run = new StrikeRun(s, 1.4, 1.82, null, true);
      const target = 450;
      for (let t = 0; t < target - 1e-9; t += frameMs) run.advance(Math.min(frameMs, target - t));
      return run.sample();
    };
    const a = at(1000 / 120);
    const b = at(1000 / 60);
    expect(a.x).toBeCloseTo(b.x, 6);
    expect(a.lift).toBeCloseTo(b.lift, 6);
  });
  it('the sound\'s lead is the real contact frame', () => {
    setMoveWord('strikeshape', 'today'); // the clip's own proportions (release 67's default word is travel)
    setCurvesMode('real');
    setDemoChapter('seymour-flux');
    const ctx = fakeCtx({ tidus: 'tidus', boss: 'seymour-flux' }, 0);
    const lead = realContactMsOf(ctx, 'tidus');
    expect(lead).toBe(contactMsOf(realProfileOf(ctx, 'tidus')!, 0));
    expect(strikeBeatNow(0, lead)).toBe(lead);
    expect(lead).toBe(Math.round(666.7 / defaultPaceFactor('ffx')));
    // the house number stays for a figure with no row, and for every other mode
    expect(realContactMsOf(fakeCtx({ x: 'valefor' }), 'x')).toBeUndefined();
    setCurvesMode('new');
    expect(realContactMsOf(ctx, 'tidus')).toBeUndefined();
    expect(strikeBeatNow(0)).toBe(Math.round((PROFILES.ffx.windupMs + PROFILES.ffx.travelMs) / defaultPaceFactor('ffx')));
    // a boss's real contact carries no heft stretch; snappy's keeps it
    setCurvesMode('real');
    const boss = fakeCtx({ b: 'seymour-flux' }, 1);
    expect(realContactMsOf(boss, 'b')).toBe(Math.round((1333.3 + 133.3) / defaultPaceFactor('ffx')));
    setCurvesMode('real-snappy');
    expect(realContactMsOf(boss, 'b')).toBe(Math.round(((314 + 31) * 1.3) / defaultPaceFactor('ffx')));
  });
  it('the contact beat waits for a real contact: the hold cap and the hit\'s wait grow with it', () => {
    const sleeps: number[] = [];
    setDemoChapter('seymour-flux');
    setCurvesMode('new');
    const ctx = fakeCtx({ boss: 'seymour-flux' }, 1, sleeps);
    void armContact(ctx, 'boss');
    const house = sleeps.pop()!;
    setCurvesMode('real');
    void armContact(ctx, 'boss');
    const real = sleeps.pop()!;
    expect(real).toBeGreaterThan(house + 1000); // Seymour's contact is 1.47 s into the move
    expect(real).toBeGreaterThanOrEqual(holdMsOf(realProfileOf(ctx, 'boss')!, 1));
  });
  it('a blow\'s numeral waits for a real strike\'s contact (the HUD is told at the contact, not at the dispatch); nothing else is held', () => {
    setDemoChapter('seymour-flux');
    const ctx = fakeCtx({ tidus: 'tidus', boss: 'seymour-flux' }, 0);
    (ctx as { reveal?: unknown }).reveal = async () => undefined;
    const blow = { type: 'damage', seq: 1, sourceId: 'tidus', targetId: 'boss', amount: 700 } as unknown as Parameters<typeof blowHeld>[1];
    setCurvesMode('real');
    expect(realContactPending(ctx, 'tidus', 'boss')).toBe(false); // no contact armed yet
    void armContact(ctx, 'tidus');
    expect(realContactPending(ctx, 'tidus', 'boss')).toBe(true);
    expect(blowHeld(ctx, blow)).toBe(true);
    expect(realContactPending(ctx, 'tidus', 'tidus')).toBe(false); // the attacker's own events are not held
    expect(realContactPending(ctx, 'boss', 'tidus')).toBe(false); // a blow from someone with no armed strike
    for (const mode of ['new', 'today'] as const) { // the house curves and today's code tell the HUD at the dispatch, as before
      setCurvesMode(mode);
      expect(blowHeld(ctx, { ...blow, seq: 2 } as typeof blow)).toBe(false);
    }
    setCurvesMode('real');
    releaseContact(ctx);
    expect(blowHeld(ctx, { ...blow, seq: 3 } as typeof blow)).toBe(false); // the strike is over
  });
});

describe('cast, hit and the run home', () => {
  it('a cast rises over the real wind-up to the real lift, and comes down over the real recovery; none outside a real mode', () => {
    setDemoChapter('seymour-flux');
    setCurvesMode('real');
    const ctx = fakeCtx({ tidus: 'tidus' });
    const lift = realCastLift(ctx, 'tidus', 1)!;
    expect(lift.height).toBeCloseTo(1.82 * 0.068, 3);
    expect(lift.riseMs).toBeCloseTo(666.7 / defaultPaceFactor('ffx'), 0);
    expect(lift.releaseMs).toBeCloseTo(900 / defaultPaceFactor('ffx'), 0);
    setRealArcGain(0.5);
    expect(realCastLift(ctx, 'tidus', 1)!.height).toBeCloseTo(1.82 * 0.068 * 0.5, 3);
    setCurvesMode('new');
    expect(realCastLift(ctx, 'tidus', 1)).toBeUndefined();
    expect(realCastLift(fakeCtx({ x: 'valefor' }), 'x', 1)).toBeUndefined();
  });
  it('a hit reaction lasts the real recovery in a real mode and today\'s 360 ms otherwise', () => {
    setDemoChapter('ffx2-bahamut');
    const ctx = fakeCtx({ rikku: 'rikku-dark-knight', yuna: 'yuna-white-mage' });
    setCurvesMode('new');
    expect(realRecoilMs(ctx, 'rikku', 360)).toBe(360);
    setCurvesMode('real-snappy');
    expect(realRecoilMs(ctx, 'rikku', 360)).toBeCloseTo(900, 0);
    expect(realRecoilMs(fakeCtx({ x: 'valefor' }), 'x', 360)).toBe(360);
  });
  it('FFX-2: Rikku leaps back over the real return, Yuna (who stays) has no run home; FFX numbers never leak into Chapter IV', () => {
    setDemoChapter('ffx2-bahamut');
    setCurvesMode('real');
    const ctx = fakeCtx({ rikku: 'rikku-dark-knight', yuna: 'yuna-white-mage', paine: 'paine-warrior', tidus: 'tidus' });
    const rikku = realLeapBack(ctx, 'rikku')!;
    expect(rikku.ms).toBeCloseTo(400, 0);
    expect(rikku.height).toBeCloseTo(1.82 * 0.353, 2);
    expect(realLeapBack(ctx, 'paine')!.height).toBeCloseTo(1.82 * 0.142, 2);
    expect(realLeapBack(ctx, 'yuna')).toBeUndefined();
    expect(realLeapBack(ctx, 'tidus')).toBeUndefined(); // FFX's Tidus has no row in FFX-2's table
    setCurvesMode('real-snappy');
    expect(realLeapBack(ctx, 'rikku')!.ms).toBeCloseTo(197, 0);
    setCurvesMode('new');
    expect(realLeapBack(ctx, 'rikku')).toBeUndefined();
  });
});

describe('the curve under it', () => {
  it('pchip hits its nodes, never overshoots a rise and holds a flat stretch flat', () => {
    const p = [0, 0.1, 0.4, 0.4, 0.4, 0.9, 1];
    for (let i = 0; i < p.length; i++) expect(pchip(p, i / (p.length - 1))).toBeCloseTo(p[i]!, 9);
    let last = -1;
    for (let u = 0; u <= 1; u += 0.001) {
      const v = pchip(p, u);
      expect(v).toBeGreaterThanOrEqual(0 - 1e-9);
      expect(v).toBeLessThanOrEqual(1 + 1e-9);
      expect(v).toBeGreaterThanOrEqual(last - 1e-9);
      last = v;
    }
    expect(pchip(p, 0.4)).toBeCloseTo(0.4, 6);
    expect(pchip([], 0.5)).toBe(0);
    expect(pchip([3], 0.5)).toBe(3);
    expect(pchip(p, -1)).toBe(0);
    expect(pchip(p, 2)).toBe(1);
  });
  it('the real strike\'s scale cap is the house cap', () => {
    // RealStrike.ts keeps its own copy of the cap (importing it would make a cycle): the two must agree
    const s = resolveStrike(profileOfRow('ffx', REAL_MOTION.ffx['tidus']!.attack!, 'real'), { distance: 1.4, height: 1.82, timeScale: 1, realGain: 1.5 });
    for (const phase of ['pre', 'post'] as const) {
      const n = phase === 'pre' ? s.windupMs + s.travelMs : s.returnMs;
      for (let t = 0; t <= n; t += n / 200) expect(Math.abs(walk(s, phase, t).sy - 1)).toBeLessThanOrEqual(SQUASH_CAP + 1e-9);
    }
    expect(strikeMarks(s).contact).toBeCloseTo(s.windupMs + s.travelMs, 6);
  });
});

describe('the party rig pilots\' switch', () => {
  it('is off by default and with ?pack=demo alone; ?partyrigs=on turns it on', () => {
    expect(partyRigsModeFromSearch(undefined)).toBe('off');
    expect(partyRigsModeFromSearch('')).toBe('off');
    expect(partyRigsModeFromSearch('?pack=demo')).toBe('off');
    expect(partyRigsModeFromSearch('?pack=demo&partyrigs=on')).toBe('on');
    expect(partyRigsModeFromSearch('?partyrigs=ON')).toBe('on');
    expect(partyRigsModeFromSearch('?partyrigs=off')).toBe('off');
    expect(partyRigsModeFromSearch('?partyrigs=1')).toBe('off');
  });
  it('lets a pilot draw only when on, and only in its own chapter; every other figure is not this switch\'s', () => {
    expect(Object.keys(PARTY_RIG_SUBJECTS).sort()).toEqual(['rikku-dark-knight', 'tidus']);
    setPartyRigsMode('off');
    setDemoChapter('seymour-flux');
    expect(partyRigAllowed('tidus')).toBe(false);
    expect(partyRigAllowed('seymour-flux')).toBe(true); // a boss: the rig engine's own rules
    setPartyRigsMode('on');
    expect(partyRigAllowed('tidus')).toBe(true);
    expect(partyRigAllowed('rikku-dark-knight')).toBe(false); // FFX-2's pilot in an FFX chapter
    setDemoChapter('ffx2-bahamut');
    expect(partyRigAllowed('rikku-dark-knight')).toBe(true);
    expect(partyRigAllowed('tidus')).toBe(false);
    setDemoChapter('yunalesca');
    expect(partyRigAllowed('tidus')).toBe(false);
    expect(partyRigAllowed('rikku-dark-knight')).toBe(false);
    setDemoChapter(undefined);
    expect(partyRigAllowed('tidus')).toBe(false);
    expect(partyRigAllowed('valefor')).toBe(true);
  });
});

describe('the switchboard\'s new keys', () => {
  it('keys , and . exist and no key is used twice', () => {
    expect(switchOfCode('Comma')?.key).toBe(',');
    expect(switchOfCode('Period')?.key).toBe('.');
    const codes = SWITCHES.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
  it('the real-clips key cycles off, snappy, real, off and the label says so on both rows', () => {
    const real = switchOfCode('Comma')!;
    const curves = switchOfCode('Digit7')!;
    setCurvesMode('new');
    expect(real.read()).toBe('off');
    expect(real.isNew()).toBe(false);
    expect(real.flip!()).toContain('snappy');
    expect(curves.read()).toBe('real-snappy'); // the curves row tells the truth too
    expect(real.isNew()).toBe(true);
    expect(real.flip!()).toContain('real');
    expect(curves.read()).toBe('real');
    expect(real.flip!()).toBe('off');
    expect(curves.read()).toBe('new');
    setCurvesMode('today');
    expect(real.flip!()).toContain('snappy'); // from today's it turns the curves on, in the real mode
    expect(curves.isNew()).toBe(true);
  });
  it('key 7 goes from a real mode back to today\'s; the master key keeps a real mode and never flips the pilots', () => {
    const curves = switchOfCode('Digit7')!;
    setCurvesMode('real');
    expect(curves.flip!()).toBe('today');
    setCurvesMode('real-snappy');
    expect(allNew()).toBe(false); // the other pieces are not new in this fresh process
    flipAll();
    expect(curves.read()).toBe('real-snappy'); // set(on) keeps what was chosen
    flipAll(); // all were new: everything goes to today's
    expect(curves.read()).toBe('today');
    setPartyRigsMode('off');
    flipAll();
    expect(switchOfCode('Period')!.read()).toBe('off'); // judged on their own
  });
  it('the party rigs key flips on and off and the board state lists both new rows', () => {
    const rigs = switchOfCode('Period')!;
    setPartyRigsMode('off');
    expect(rigs.flip!()).toBe('on');
    expect(rigs.isNew()).toBe(true);
    expect(rigs.flip!()).toBe('off');
    const names = boardState().map((s) => s.name);
    expect(names).toContain('real clips');
    expect(names).toContain('party rigs');
  });
});

describe('the real knock-out and victory', () => {
  it('the fall reaches the floor when the real clip does, the buckle is that less the cross; none outside a real mode or for an unknown figure', () => {
    setDemoChapter('seymour-flux');
    setCurvesMode('new');
    expect(realFallMs('tidus')).toBeUndefined();
    setCurvesMode('real');
    expect(realFallMs('tidus')).toBeCloseTo(1000, 0);
    expect(realBuckleMs('tidus', 75)).toBeCloseTo(925, 0);
    expect(realFallMs('valefor')).toBeUndefined();
    setDemoChapter('ffx2-bahamut');
    expect(realFallMs('rikku')).toBeCloseTo(1600, 0); // FFX-2's own table: Rikku's fall is 2.5 s and lands at 1.6 s
    expect(realFallMs('tidus')).toBeUndefined(); // FFX's Tidus has no row in FFX-2's table
    setCurvesMode('real-snappy');
    expect(realFallMs('rikku')).toBeCloseTo(1600, 0); // no 1.1 s pick covers a knock-out
  });
  it('the knock-out run buckles for the real hold; the house run is unchanged', () => {
    expect(fallRun('topple', 'ffx', undefined, 925)!.opts.holdMs).toBe(925);
    expect(fallRun('topple', 'ffx', undefined)!.opts.holdMs).toBe(KO_BUCKLE_MS.ffx);
    expect(fallRun('buckle-cross', 'ffx2', undefined, 500)!.opts.holdMs).toBe(500);
    expect(fallRun('cut', 'ffx', undefined, 500)).toBeNull();
  });
  it('FFX\'s victory is the real crouch and spring at the real lift; FFX-2\'s Chapter IV never reads a real cheer', () => {
    setDemoChapter('seymour-flux');
    setCurvesMode('real');
    const s = realCheerShape('ffx', 'tidus')!;
    expect(s.height).toBeCloseTo(0.082, 3);
    expect(s.ms).toBeGreaterThan(800);
    expect(s.ms).toBeLessThan(1500);
    expect(s.options.anticipation).toBeGreaterThanOrEqual(0.1);
    expect(s.options.anticipation).toBeLessThanOrEqual(0.4);
    expect(s.swapU).toBeGreaterThan(s.options.anticipation!);
    expect(s.swapU).toBeLessThan(1);
    expect(realCheerShape('ffx2', 'rikku')).toBeUndefined();
    expect(realCheerShape('ffx', 'valefor')).toBeUndefined();
    setCurvesMode('new');
    expect(realCheerShape('ffx', 'tidus')).toBeUndefined();
  });
  it('the cheer helper asks the real shape for a named figure and the house shape for any other', () => {
    setDemoChapter('seymour-flux');
    setCurvesMode('real');
    const calls: Array<{ h: number; ms: number }> = [];
    const host = { worldHeight: 1.82, name: 'tidus', leap: (h: number, ms: number): Promise<void> => (calls.push({ h, ms }), Promise.resolve()) };
    void startCheer(host, 'ffx', null);
    void startCheer({ ...host, name: 'valefor' }, 'ffx', null);
    void startCheer({ worldHeight: 1.82, leap: host.leap }, 'ffx', null);
    expect(calls[0]!.h).toBeCloseTo(1.82 * 0.082, 3);
    expect(calls[1]!.h).toBeCloseTo(1.82 * 0.18, 3); // the house cheer
    expect(calls[2]!.h).toBeCloseTo(1.82 * 0.18, 3);
    expect(calls[0]!.ms).not.toBe(calls[1]!.ms);
  });
});

describe('the real strike in Chapter IV: her run home waits for the hold', () => {
  const contact = { hold: Promise.resolve(), reached: (): void => {} };
  const actorOf = (plans: StrikePlan[]): ActorHandle => ({ strike: (p: StrikePlan): Promise<void> => (plans.push(p), Promise.resolve()) }) as unknown as ActorHandle;
  it('arms the strike\'s holdEnd for a real strike after a run-in, hands the actor\'s promise to the run home and settles it on the mark', async () => {
    setDemoChapter('ffx2-bahamut');
    setCurvesMode('real');
    const plans: StrikePlan[] = [];
    const rikku = actorOf(plans);
    startAttackMove(fakeCtx({ rikku: 'rikku-dark-knight' }), rikku, { distance: 1, house: 1 }, contact, true, 'rikku');
    expect(plans[0]!.profile?.real).toBeDefined();
    expect(plans[0]!.arc).toBe(false); // she ran in: the leap carried the lift
    expect(plans[0]!.marks?.holdEnd).toBeTypeOf('function');
    const held = strikeHoldOver(rikku)!;
    let settled = false;
    void held.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    plans[0]!.marks!.holdEnd!();
    await held;
    expect(settled).toBe(true);
  });
  it('arms nothing without a run-in, in the house curves, or for a figure the table does not cover', () => {
    setDemoChapter('ffx2-bahamut'); setMoveWord('run', 'today'); // the house profile is the strike after a run that does not flow; the default word is flow since release 67 (flow has its own profile)
    const plans: StrikePlan[] = [];
    setCurvesMode('real');
    const noRun = actorOf(plans);
    startAttackMove(fakeCtx({ rikku: 'rikku-dark-knight' }), noRun, { distance: 1, house: 1 }, contact, false, 'rikku');
    expect(strikeHoldOver(noRun)).toBeUndefined();
    const unknown = actorOf(plans);
    startAttackMove(fakeCtx({ x: 'valefor' }), unknown, { distance: 1, house: 1 }, contact, true, 'x');
    expect(strikeHoldOver(unknown)).toBeUndefined();
    expect(plans[1]!.profile).toBeUndefined(); // no row: the house profile
    setCurvesMode('new');
    const house = actorOf(plans);
    startAttackMove(fakeCtx({ rikku: 'rikku-dark-knight' }), house, { distance: 1, house: 1 }, contact, true, 'rikku');
    expect(strikeHoldOver(house)).toBeUndefined();
    expect(plans[2]!.profile).toBeUndefined();
  });
});

describe('the real strike on a real actor', () => {
  const beats: MotionBeat[] = [];
  beforeEach(() => {
    beats.length = 0;
    setMotionBeatSink((b) => void beats.push(b));
  });
  afterEach(() => {
    setMotionBeatSink(null);
    reset();
  });
  function tidus(): Actor {
    const a = new PaintedActor({ name: 'tidus', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
    a.adoptPoses({ idle: painting('auron', 'idle'), attack: painting('auron', 'attack') }, 'idle');
    a.position.set(-2, 0, 0);
    return a;
  }
  const step = (a: Actor, ms: number, frame = 1000 / 120): void => {
    for (let i = 0; i < Math.round(ms / frame); i++) a.update(frame / 1000);
  };
  it('a leaping attack asks its whoosh at once, peaking at the approach\'s apex, and the leap lifts the actor off the floor then returns it', () => {
    setDemoChapter('seymour-flux');
    setCurvesMode('real');
    const profile = realStrikeProfile('ffx', 'tidus', 'real')!;
    const a = tidus();
    void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true, profile });
    const lunges = beats.filter((b) => b.kind === 'lunge');
    expect(lunges).toHaveLength(1); // no waiting for a wind-up that is the run itself
    const onScreen = paceFactor('action');
    expect(lunges[0]!.atMs).toBeCloseTo(0.45 * contactMsOf(profile) * onScreen, 0); // contactMsOf rounds to a millisecond
    step(a, 300);
    expect(beats.filter((b) => b.kind === 'lunge')).toHaveLength(1); // exactly one
    let top = 0;
    for (let t = 0; t < 2600; t += 8) {
      step(a, 8);
      top = Math.max(top, (a as unknown as { curves: { out: { lift: number } } }).curves.out.lift);
    }
    expect(top).toBeGreaterThan(1.4); // the return flip, 0.86 of 1.82
    expect((a as unknown as { curves: { out: { lift: number; x: number } } }).curves.out.lift).toBe(0); // and home again
    expect((a as unknown as { curves: { out: { x: number } } }).curves.out.x).toBe(0);
  });
});
