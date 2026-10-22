/**
 * Motion pass, lane "core", step 1 (CURVES): the REAL `PaintedActor` and the presenter's beat helpers with the new curves on. Game case: both (Chapter I FFX profile, Chapter IV FFX-2);
 * the actor plumbing is shared. With the switch OFF (the default) the live game is unchanged: `lunge-walk-back`, `r391-reach-curve`, `r392-calm-lunge`, `hit-recoil-actor` and the
 * rest still pin today's numbers, and the first test here pins that the idle driver changes nothing.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, type Actor } from './head-lock-fixture.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setCurvesChapter, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { startAttackMove, liftCaster, releaseCastLift, arcFor } from '../../../src/engine/motion/CurveBeats.ts';
import { PROFILES, SQUASH_CAP, defaultPaceFactor, resolveStrike, strikeMarks } from '../../../src/engine/motion/StrikeCurve.ts';
import { STRIKE_BEAT_MS, strikeBeatNow } from '../../../src/engine/StrikeBeat.ts';
import { armContact, CONTACT_HOLD_MAX_MS, CURVES_CONTACT_EXTRA_MS, meetContact, releaseContact } from '../../../src/engine/ContactBeat.ts';
import { paceFactor } from '../../../src/engine/pace.ts';
import { impactAtApex } from '../../../src/engine/KeyPoses.ts';

const flush = async (): Promise<void> => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
});
afterEach(() => {
  reset();
  setCurvesMode(null);
  setCurvesChapter(undefined);
  setPaceGame('other');
});

function figure(side: 'party' | 'enemy' = 'party', shadow = false): Actor {
  const a = new PaintedActor({ name: 'auron', worldHeight: side === 'party' ? 1.82 : 4.1, side, breathe: false, sway: false, shadow: shadow ? {} : false });
  const poses: Record<string, ReturnType<typeof painting>> = {};
  for (const p of ['idle', 'attack', 'follow']) poses[p] = painting('auron', p);
  a.adoptPoses(poses, 'idle');
  a.position.set(-2, 0, 0);
  return a;
}
const inner = (a: Actor): { position: { x: number; y: number }; scale: { x: number; y: number }; rotation: { z: number } } => (a as unknown as { inner: ReturnType<typeof inner> }).inner;
const shadowOf = (a: Actor): { position: { x: number }; scale: { x: number } } => (a as unknown as { shadow: ReturnType<typeof shadowOf> }).shadow;

/** Step the actor `ms` of real time in frames of `frame` ms; calls `each` after every frame. */
function run(a: Actor, ms: number, frame: number, each?: (t: number) => void): void {
  const n = Math.round(ms / frame);
  for (let i = 1; i <= n; i++) {
    a.update(frame / 1000, frame / 1000);
    each?.(i * frame);
  }
}

describe('switch OFF: the new curves change nothing', () => {
  it('an idle actor with the driver idle has the same transform as the legacy squash gives (scale 1, no lift, no lean)', () => {
    const a = figure();
    run(a, 200, 1000 / 60);
    expect(inner(a).scale.x).toBe(1);
    expect(inner(a).scale.y).toBe(1);
    expect(inner(a).position.y).toBe(0);
  });
  it('squash keeps its 18 / 14 percent family and the knock-back its 0.22 push', async () => {
    const a = figure();
    void a.squash(280, 1);
    let lo = 1;
    run(a, 280, 1000 / 120, () => (lo = Math.min(lo, inner(a).scale.y)));
    expect(lo).toBeLessThan(0.9); // not subtle: 18 percent at amount 1
    const b = figure();
    void b.recoil(360, 0.22);
    let min = 0;
    run(b, 360, 1000 / 120, () => (min = Math.min(min, (b as unknown as { recoilOffset: number }).recoilOffset)));
    expect(min).toBeLessThan(-0.15);
    await flush();
  });
  it('the presenter helper plays today\'s lunge + squash(260, 0.45) and asks nothing of the new members', () => {
    const calls: string[] = [];
    const fake = {
      lunge: (d: number, ms: number) => (calls.push(`lunge ${d} ${ms}`), Promise.resolve()),
      squash: (ms: number, amt: number) => (calls.push(`squash ${ms} ${amt}`), Promise.resolve()),
      strike: () => (calls.push('strike'), Promise.resolve()),
    };
    setCurvesChapter('seymour-flux'); // the chapter alone is not enough: the mode is today
    startAttackMove({} as never, fake as never, { distance: 1.4, house: 1.4 }, { hold: Promise.resolve(), reached: () => {} }, false);
    expect(calls).toEqual(['lunge 1.4 440', 'squash 260 0.45']);
    expect(strikeBeatNow()).toBe(STRIKE_BEAT_MS);
  });
});

describe('switch ON in a demo chapter: the sampled strike on the real actor', () => {
  const on = (chapter = 'seymour-flux'): void => {
    setCurvesMode('new');
    setCurvesChapter(chapter);
  };

  it('plays wind-up, arc, contact, hold, return and settle, calls the contact once, and ends at the exact rest pose', async () => {
    on();
    const a = figure();
    let release: () => void = () => {};
    const hold = new Promise<void>((r) => (release = r));
    let reached = 0;
    let atContact = Number.NaN;
    void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true, contact: { hold, reached: () => (reached++, (atContact = inner(a).position.x)) } });
    const xs: number[] = [];
    const ys: number[] = [];
    run(a, 700, 1000 / 120, () => {
      xs.push(inner(a).position.x);
      ys.push(inner(a).position.y);
    });
    expect(reached).toBe(1);
    expect(atContact).toBeGreaterThan(1.3);
    expect(Math.min(...xs)).toBeLessThan(-0.04); // the pull back
    expect(Math.max(...ys)).toBeGreaterThan(0.05); // the arc
    expect(xs[xs.length - 1]!).toBeCloseTo(1.4, 6); // held at the touch point while the blow has not landed
    release();
    await flush();
    run(a, 1200, 1000 / 120);
    await flush();
    expect(inner(a).position.x).toBeCloseTo(0, 9);
    expect(inner(a).position.y).toBeCloseTo(0, 9);
    expect(inner(a).scale.x).toBeCloseTo(1, 9);
    expect(inner(a).scale.y).toBeCloseTo(1, 9);
    expect(inner(a).rotation.z).toBeCloseTo(0, 9);
  });

  it('contact lands at 0.4 s on screen at the default pace (steady), where the sound lead puts it', () => {
    on();
    const a = figure();
    let contactAt = -1;
    void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true, contact: { hold: Promise.resolve(), reached: () => (contactAt = t) } });
    let t = 0;
    run(a, 700, 1000 / 120, (ms) => (t = ms));
    expect(contactAt).toBeGreaterThan(0);
    expect(Math.abs(contactAt - 400)).toBeLessThan(12);
    expect(strikeBeatNow()).toBe(Math.round((PROFILES.ffx.windupMs + PROFILES.ffx.travelMs) / defaultPaceFactor('ffx'))); // 333 ms at pace 1: x1.2 = 400 on screen
  });

  it('the whole move is 1.1 s on screen at the default pace for FFX', async () => {
    on();
    const a = figure();
    let done = -1;
    let t = 0;
    void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true }).then(() => (done = t));
    for (let i = 1; i <= 180 && done < 0; i++) {
      a.update(1 / 120, 1 / 120);
      t = i * (1000 / 120);
      await flush();
    }
    expect(Math.abs(done - 1100)).toBeLessThan(15);
  });

  it('is frame-rate independent: 60 Hz, 120 Hz and 240 Hz put the figure in the same place at the same times', () => {
    on();
    const sample = (frame: number): Array<[number, number, number]> => {
      const a = figure();
      void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
      const all: Array<[number, number, number]> = [];
      run(a, 960, frame, () => all.push([inner(a).position.x, inner(a).position.y, inner(a).scale.y]));
      const out: Array<[number, number, number]> = [];
      for (let k = 1; k <= 57; k++) out.push(all[Math.round((k * 1000) / 60 / frame) - 1]!); // every 1/60 s, which 60, 120 and 240 Hz all land on
      return out;
    };
    const a = sample(1000 / 240);
    for (const f of [1000 / 120, 1000 / 60]) {
      const b = sample(f);
      expect(b.length).toBeGreaterThan(50);
      for (let i = 0; i < b.length; i++) for (let k = 0; k < 3; k++) expect(b[i]![k]!).toBeCloseTo(a[i]![k]!, 6);
    }
  });

  it('a hit-stop (zero field time) holds the move; the pose blend keeps its real clock', () => {
    on();
    const a = figure();
    void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
    run(a, 300, 1000 / 120);
    const before = inner(a).position.x;
    for (let i = 0; i < 20; i++) a.update(0, 1 / 120);
    expect(inner(a).position.x).toBe(before);
  });

  it('squash and stretch stay volume-preserving and inside 6 percent for the whole move, for a party figure and a boss', () => {
    on();
    for (const side of ['party', 'enemy'] as const) {
      const a = figure(side);
      void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
      let lo = 1;
      let hi = 1;
      run(a, 1300, 1000 / 120, () => {
        const { x, y } = inner(a).scale;
        expect(x * y).toBeCloseTo(1, 9);
        lo = Math.min(lo, y);
        hi = Math.max(hi, y);
        expect(Math.abs(y - 1)).toBeLessThanOrEqual(SQUASH_CAP + 1e-9);
      });
      expect(1 - lo).toBeGreaterThan(0.02);
      expect(hi - 1).toBeGreaterThan(0.015);
    }
  });

  it('an enemy lunges toward -x (facing), a boss moves heavier and slower than a party figure and with less air', () => {
    on();
    const party = figure('party');
    const boss = figure('enemy');
    void party.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
    void boss.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
    let bossMax = 0;
    let partyMax = 0;
    let bossMinX = 0;
    run(party, 900, 1000 / 120, () => (partyMax = Math.max(partyMax, inner(party).position.y)));
    run(boss, 900, 1000 / 120, () => ((bossMax = Math.max(bossMax, inner(boss).position.y)), (bossMinX = Math.min(bossMinX, inner(boss).position.x))));
    expect(bossMinX).toBeLessThan(-1); // toward -x
    expect(inner(boss).position.x).toBeLessThan(-0.5); // the boss is still on its way home at 0.9 s...
    expect(inner(party).position.x).toBeLessThan(0.2); // ...where the party figure is nearly home (a 1.1 s move)
    expect(bossMax / 4.1).toBeLessThan(partyMax / 1.82); // less air, as a share of its height
  });

  it('leans back in the wind-up and forward at the fastest travel frame, toward its own facing (party +x, foe -x)', () => {
    on();
    for (const [side, sign, k] of [['party', 1, 1], ['enemy', -1, 1.3]] as const) {
      // a boss is x1.3 slower (heft), so its wind-up ends and its fastest frame comes x1.3 later
      const a = figure(side);
      void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
      let backAt = 0;
      let fwdAt = 0;
      run(a, 306 * k + 5, 1000 / 120, (ms) => {
        if (Math.abs(ms - 150 * k) < 4.2) backAt = inner(a).rotation.z;
        if (Math.abs(ms - 306 * k) < 4.2) fwdAt = inner(a).rotation.z;
      });
      expect(backAt * sign, `${side} leaning back`).toBeGreaterThan(0.03); // the top of the figure goes away from the target: counter-clockwise for +x
      expect(fwdAt * sign, `${side} leaning forward`).toBeLessThan(-0.02);
    }
  });

  it('the shadow stays under the feet through the lunge, and spreads on the landing squash', () => {
    on();
    const a = figure('party', true);
    void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true });
    let worst = 0;
    let widest = 0;
    let rest = 0;
    run(a, 1300, 1000 / 120, (ms) => {
      if (ms === 1000 / 120) rest = shadowOf(a).scale.x;
      worst = Math.max(worst, Math.abs(shadowOf(a).position.x - inner(a).position.x));
      widest = Math.max(widest, shadowOf(a).scale.x);
    });
    expect(worst).toBeLessThan(0.05); // the posture lean is the only difference
    expect(widest).toBeGreaterThan(rest);
  });

  it('after an FFX-2 run-in the strike takes no arc of its own, and the run is a leap with a crouch and a landing', async () => {
    on('ffx2-bahamut');
    const a = figure();
    void a.strike({ distance: 0.6, game: 'ffx2', timeScale: 1, arc: false });
    let maxY = 0;
    run(a, 1100, 1000 / 120, () => (maxY = Math.max(maxY, inner(a).position.y)));
    expect(maxY).toBeLessThan(0.02); // only the posture's own hop
    const b = figure();
    let landed = false;
    void arcFor(b as never, 0.42, 400).then(() => (landed = true));
    let peak = 0;
    let lo = 1;
    run(b, 600, 1000 / 120, () => {
      peak = Math.max(peak, inner(b).position.y);
      lo = Math.min(lo, inner(b).scale.y);
    });
    await flush();
    expect(landed).toBe(true);
    expect(peak).toBeGreaterThan(0.38);
    expect(lo).toBeLessThan(0.98);
    expect(inner(b).position.y).toBeCloseTo(0, 6);
  });

  it('squash calls the presenter already makes (KO landing 0.5, lie-down 0.35) turn subtle: at most 6 percent, volume-preserving', () => {
    on();
    const a = figure();
    void a.squash(280, 0.5);
    let lo = 1;
    run(a, 400, 1000 / 120, () => {
      lo = Math.min(lo, inner(a).scale.y);
      expect(inner(a).scale.x * inner(a).scale.y).toBeCloseTo(1, 9);
    });
    expect(lo).toBeGreaterThan(1 - SQUASH_CAP - 1e-9);
    expect(lo).toBeLessThan(0.97);
  });

  it('the knock-back is a few px (0.3 of today\'s push) and recovers past rest by a small overshoot', async () => {
    on();
    const a = figure();
    void a.recoil(360, 0.22);
    let min = 0;
    let max = 0;
    const recoil = (): number => (a as unknown as { recoilOffset: number }).recoilOffset;
    run(a, 500, 1000 / 120, () => {
      min = Math.min(min, recoil());
      max = Math.max(max, recoil());
    });
    await flush();
    expect(min).toBeCloseTo(-0.066, 3);
    expect(max).toBeGreaterThan(0.007);
    expect(max).toBeLessThan(0.0105);
    expect(recoil()).toBe(0);
  });

  it('a cast lifts the caster and HOLDS it until the spell lands, then comes down to the exact floor', () => {
    on();
    const a = figure();
    a.liftTo(0.1, 240);
    let peak = 0;
    run(a, 1500, 1000 / 120, () => (peak = Math.max(peak, inner(a).position.y)));
    expect(inner(a).position.y).toBeCloseTo(0.1, 6); // still up after 1.5 s
    a.liftRelease(260);
    run(a, 800, 1000 / 120);
    expect(inner(a).position.y).toBeCloseTo(0, 9);
    expect(inner(a).scale.y).toBeCloseTo(1, 9);
  });

  it('the pose blend runs on the same pace as the moves (a 120 ms blend takes 1.2 times as long at steady pace)', () => {
    on();
    const a = figure();
    a.setPose('attack');
    let frames = 0;
    while (a.blending && frames < 200) {
      a.update(1 / 120, 1 / 120);
      frames++;
    }
    const withCurves = frames;
    setCurvesMode('today');
    const b = figure();
    b.setPose('attack');
    frames = 0;
    while (b.blending && frames < 200) {
      b.update(1 / 120, 1 / 120);
      frames++;
    }
    expect(withCurves).toBeGreaterThan(frames * 1.1);
    expect(withCurves).toBeLessThan(frames * 1.3);
  });
});

describe('the presenter beats with the new curves on', () => {
  const ctx = { speed: () => 'normal', deps: {}, stage: { actor: () => undefined } } as never;
  it('startAttackMove starts the strike with the chapter\'s game, the playback scale and the arc unless she ran in, and does NOT play the old lunge or squash', () => {
    setCurvesMode('new');
    setCurvesChapter('ffx2-bahamut');
    const plans: Array<Record<string, unknown>> = [];
    const fake = {
      lunge: () => (plans.push({ old: 'lunge' }), Promise.resolve()),
      squash: () => (plans.push({ old: 'squash' }), Promise.resolve()),
      strike: (p: Record<string, unknown>) => (plans.push(p), Promise.resolve()),
    };
    const contact = { hold: Promise.resolve(), reached: () => {} };
    startAttackMove(ctx, fake as never, { distance: 0.6, house: 0.6 }, contact, true);
    startAttackMove({ ...(ctx as object), speed: () => 'fast' } as never, fake as never, { distance: 1.4, house: 1.4 }, contact, false);
    expect(plans).toHaveLength(2);
    expect(plans[0]).toMatchObject({ distance: 0.6, game: 'ffx2', arc: false, timeScale: 1 });
    expect(plans[1]).toMatchObject({ distance: 1.4, game: 'ffx2', arc: true });
    expect(plans[1]!['timeScale']).toBeCloseTo(0.32, 9);
    expect(plans[0]!['contact']).toBe(contact);
  });
  it('the cast lift starts on the caster, scaled to its height, and releases on the landing; both are inert with the switch off', () => {
    const calls: string[] = [];
    const caster = { position: { x: 0, y: 0, z: 0 }, headPoint: () => ({ x: 0, y: 1.8, z: 0 }), liftTo: (h: number, ms: number) => calls.push(`lift ${h.toFixed(3)} ${Math.round(ms)}`), liftRelease: () => calls.push('release') };
    const c = { speed: () => 'normal', deps: {}, stage: { actor: () => caster } } as never;
    liftCaster(c, 'a' as never);
    expect(calls).toEqual([]);
    setCurvesMode('new');
    setCurvesChapter('seymour-flux');
    liftCaster(c, 'a' as never);
    expect(calls).toEqual(['lift 0.090 240']);
    releaseCastLift(c, 'a' as never);
    releaseCastLift(c, undefined);
    expect(calls).toEqual(['lift 0.090 240', 'release']);
  });
  it('the contact cap is lengthened by the strike\'s extra run to contact while the new curves are on', async () => {
    const sleeps: number[] = [];
    const c = { sleep: (ms: number) => (sleeps.push(ms), new Promise<void>(() => {})) } as never;
    armContact(c, 'a' as never);
    setCurvesMode('new');
    setCurvesChapter('seymour-flux');
    armContact(c, 'a' as never);
    expect(sleeps).toEqual([CONTACT_HOLD_MAX_MS, CONTACT_HOLD_MAX_MS + CURVES_CONTACT_EXTRA_MS]);
    const nominal = strikeMarks(resolveStrike(PROFILES.ffx, { distance: 1.4, height: 1.82, timeScale: 1 }));
    expect(nominal.contact * defaultPaceFactor('ffx') - STRIKE_BEAT_MS * defaultPaceFactor('ffx')).toBeLessThanOrEqual(CURVES_CONTACT_EXTRA_MS * defaultPaceFactor('ffx'));
  });
});

describe('the whole beat on the real actor: arm the contact, start the strike, a blow that arrives early waits for the contact, the hold lets go', () => {
  it('contact at 0.4 s, the blow lands there, the strike is held 0.2 s, goes home, and is over at 1.1 s (FFX, default pace)', async () => {
    setCurvesMode('new');
    setCurvesChapter('seymour-flux');
    const a = figure();
    // a virtual presenter clock: sleep(ms) takes ms x pace of virtual time, like BattlePresenter.sleep at normal speed
    let now = 0;
    const timers: Array<{ at: number; done: () => void }> = [];
    const ctx = { sleep: (ms: number) => new Promise<void>((r) => timers.push({ at: now + ms * paceFactor('action'), done: r })) } as never;
    const log: Array<[string, number]> = [];
    const contact = armContact(ctx, 'tidus' as never);
    const plan = { distance: 1.4, house: 1.4 };
    startAttackMove(ctx, { strike: (p: never) => a.strike(p), lunge: () => Promise.resolve(), squash: () => Promise.resolve() } as never, plan, { hold: contact.hold, reached: () => (log.push(['contact', now]), contact.reached()) }, false);
    // the blow: the presenter's windUp sleep (220 ms x pace) then the damage event asks meetContact
    void (async () => {
      await (ctx as { sleep: (n: number) => Promise<void> }).sleep(220);
      log.push(['blow asked', now]);
      await meetContact(ctx, 'seymour-flux' as never);
      log.push(['blow lands', now]);
    })();
    void contact.hold.then(() => log.push(['hold released', now]));
    const frame = 1000 / 120;
    let end = -1;
    void a.strike; // (the plan above started it)
    for (let i = 1; i <= 220; i++) {
      a.update(frame / 1000, frame / 1000);
      now += frame;
      for (let k = timers.length - 1; k >= 0; k--) if (timers[k]!.at <= now) timers.splice(k, 1)[0]!.done();
      await flush();
      if (end < 0 && Math.abs(inner(a).position.x) < 1e-9 && now > 1000) end = now;
    }
    releaseContact(ctx);
    const at = (name: string): number => log.find(([n]) => n === name)?.[1] ?? Number.NaN;
    expect(Math.abs(at('blow asked') - 264)).toBeLessThan(10);
    expect(Math.abs(at('contact') - 400)).toBeLessThan(10);
    expect(Math.abs(at('blow lands') - at('contact'))).toBeLessThan(10); // the blow waited for the contact
    expect(at('hold released') - at('contact')).toBeLessThan(40); // no follow-through painting: released at once; the profile's 0.2 s minimum hold still applies
    expect(Math.abs(end - 1100)).toBeLessThan(30);
  });
});

describe('the impact painting with the new curves: up on the fastest travel frame, not at the contact the blow lands on', () => {
  const poses: string[] = [];
  const ctx = (): never => ({ actingId: 'tidus', stage: { actor: () => ({ setPose: (p: string) => poses.push(p) }), paints: () => false } }) as never;
  it('today: the contact puts the attack painting up', () => {
    poses.length = 0;
    const c = impactAtApex(ctx(), 'tidus' as never, { hold: Promise.resolve(), reached: () => poses.push('reached') });
    expect(c.impact).toBeUndefined();
    c.reached();
    expect(poses).toEqual(['reached', 'attack']);
  });
  it('new curves: reached only marks the contact; the painting goes up on the travelPeak mark the strike is asked to call', () => {
    setCurvesMode('new');
    setCurvesChapter('seymour-flux');
    poses.length = 0;
    const c = impactAtApex(ctx(), 'tidus' as never, { hold: Promise.resolve(), reached: () => poses.push('reached') });
    c.reached();
    expect(poses).toEqual(['reached']);
    const plans: Array<Record<string, unknown>> = [];
    const fake = { strike: (p: Record<string, unknown>) => (plans.push(p), Promise.resolve()) };
    startAttackMove({ speed: () => 'normal', deps: {} } as never, fake as never, { distance: 1.4, house: 1.4 }, c, false);
    const marks = plans[0]!['marks'] as { travelPeak: () => void };
    marks.travelPeak();
    expect(poses).toEqual(['reached', 'attack']);
  });
  it('on the real actor the mark fires at the fastest frame, before the contact', () => {
    setCurvesMode('new');
    setCurvesChapter('seymour-flux');
    const a = figure();
    let peakAt = -1;
    let contactAt = -1;
    let t = 0;
    void a.strike({ distance: 1.4, game: 'ffx', timeScale: 1, arc: true, contact: { hold: Promise.resolve(), reached: () => (contactAt = t) }, marks: { travelPeak: () => (peakAt = t) } });
    run(a, 700, 1000 / 120, (ms) => (t = ms));
    expect(peakAt).toBeGreaterThan(250);
    expect(contactAt - peakAt).toBeGreaterThan(80); // the impact painting is up about 94 ms before the contact (as long as today's apex-to-blow gap)
    expect(contactAt - peakAt).toBeLessThan(110);
  });
});
