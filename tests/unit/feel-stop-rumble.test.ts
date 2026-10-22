/**
 * The short hit-stop (`?hitstop=short`) and the gamepad rumble (`?rumble=on`): motion program, lane "feel", 2026-10-22; both games. The stop extends `planHit`'s own; the
 * rumble's presenter gates (`FeelHooks`) and the page-side gates (`app/gamepadRumble.ts`: never on keyboard play, never under REDUCE MOTION, Firefox and Safari's missing actuator
 * is silence).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BOSS_BIG_MOVES, SHORT_STOP_CRIT_MS, SHORT_STOP_FINISHER_MS, isBossBigMove, shortStopMs } from '../../src/engine/feel/HitStopShort.ts';
import { planHit, type HitInfo, type SpectacleFlags } from '../../src/engine/fx/c/SpectacleRules.ts';
import { HitStop } from '../../src/engine/fx/c/Trauma.ts';
import { RUMBLE_MAX_MS, rumbleForHit, rumbleForOpen, rumbleForWin, rumbleLength, setRumbleSink, type RumblePattern } from '../../src/engine/feel/Rumble.ts';
import { rumbleHit, rumbleOpen, rumbleWin } from '../../src/engine/feel/FeelHooks.ts';
import { resetFeelForTests, setFeelChapter, setFeelPack } from '../../src/engine/feel/FeelSwitch.ts';
import { fxActionOpen, fxHit, fxVictory } from '../../src/engine/fx/c/presenterHooks.ts';
import { playRumble, resetRumbleForTests, rumbleLog, stopRumble, type RumbleDeps } from '../../src/app/gamepadRumble.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';

const flags = (o: Partial<SpectacleFlags> = {}): SpectacleFlags => ({ tier: 'full', reduceMotion: false, reduceFlashes: false, dial: () => 1, ...o });
const hit = (o: Partial<HitInfo> = {}): HitInfo => ({ crit: false, heavy: false, hitIndex: 0, hitCount: 1, big: false, speed: 'normal', ...o });
const SHORT = { punch: 'today', stop: 'short' } as const;

afterEach(() => {
  resetFeelForTests();
  setRumbleSink(null);
  resetRumbleForTests();
});

describe('the short hit-stop', () => {
  it('Mega Flare (a headline move that is also a Special) on three girls stops ONCE, 67 ms on its last blow; Impulse (a headline move, not a Special) stops once, 50 ms on its first (review fix F4)', () => {
    const stops = (big: boolean, game: 'ffx' | 'ffx2' = 'ffx2'): number[] =>
      [0, 1, 2].map((i) => planHit(game, hit({ hitIndex: i, hitCount: 3, big, bossBig: true, heavy: true, magic: true }), flags({ feel: SHORT })).freezeMs);
    expect(stops(true)).toEqual([0, 0, 67]);
    expect(stops(false)).toEqual([50, 0, 0]);
    expect(stops(true, 'ffx').filter((ms) => ms > 0)).toHaveLength(1); // FFX Total Annihilation, the same rule
    expect(shortStopMs({ crit: false, big: true, last: true, bossBig: true, hitIndex: 0, hitCount: 1 })).toBe(67); // a single-target Special still stops, on its one blow
  });

  it('is 3 frames (50 ms) on a crit or a boss headline move and 4 frames (67 ms) on the last blow of an Overdrive or Special, at 60 Hz', () => {
    expect(SHORT_STOP_CRIT_MS).toBe(50);
    expect(SHORT_STOP_FINISHER_MS).toBe(67);
    const base = { crit: false, big: false, last: false, bossBig: false, hitIndex: 0, hitCount: 1 };
    expect(shortStopMs({ ...base, crit: true })).toBe(50);
    expect(shortStopMs({ ...base, bossBig: true })).toBe(50);
    expect(shortStopMs({ ...base, big: true, last: true, hitIndex: 3, hitCount: 4 })).toBe(67);
    expect(shortStopMs({ ...base, big: true, last: true, crit: true })).toBe(67);
  });

  it('stops nothing else: not an ordinary blow, not an overkill, not the middle of an Overdrive, not a crit in the middle of a flurry', () => {
    const base = { crit: false, big: false, last: false, bossBig: false, hitIndex: 0, hitCount: 1 };
    expect(shortStopMs(base)).toBe(0);
    expect(shortStopMs({ ...base, big: true, hitIndex: 1, hitCount: 4 })).toBe(0);
    expect(shortStopMs({ ...base, crit: true, hitIndex: 2, hitCount: 5 })).toBe(0);
    expect(shortStopMs({ ...base, crit: true, hitIndex: 4, hitCount: 5, last: true })).toBe(50); // the last blow of a flurry
    expect(shortStopMs({ ...base, bossBig: true, hitIndex: 1, hitCount: 2 })).toBe(0); // a headline move holds on its first blow only
  });

  it('boss headline moves are the demo bosses\' damaging leads, by ability id', () => {
    for (const id of ['lance-of-atrophy', 'cross-cleave', 'total-annihilation', 'impulse', 'mega-flare']) expect(isBossBigMove(id), id).toBe(true);
    for (const id of ['attack', 'bahamut-curse', 'x2-bahamut-impulse']) expect(isBossBigMove(id), id).toBe(false); // an ordinary swing, Curse, and an id no event carries
    expect(isBossBigMove('banish')).toBe(false);
    expect(isBossBigMove(undefined)).toBe(false);
    expect(BOSS_BIG_MOVES.size).toBe(5);
  });

  it('planHit: today unchanged without the flag; short replaces the stop; off removes it; REDUCE MOTION, fast and skip stop nothing', () => {
    const crit = hit({ crit: true, heavy: true });
    expect(planHit('ffx', crit, flags()).freezeMs).toBe(85); // today (FFX heavy)
    expect(planHit('ffx', hit(), flags()).freezeMs).toBe(40); // today's light hold on an ordinary first blow
    expect(planHit('ffx', crit, flags({ feel: SHORT })).freezeMs).toBe(50);
    expect(planHit('ffx', hit(), flags({ feel: SHORT })).freezeMs).toBe(0); // an ordinary blow: no stop at all
    expect(planHit('ffx', hit({ heavy: true }), flags({ feel: SHORT })).freezeMs).toBe(0); // heavy but not a crit
    expect(planHit('ffx', hit({ big: true, hitIndex: 3, hitCount: 4 }), flags({ feel: SHORT })).freezeMs).toBe(67);
    expect(planHit('ffx2', hit({ bossBig: true }), flags({ feel: SHORT })).freezeMs).toBe(50);
    expect(planHit('ffx', crit, flags({ feel: { punch: 'today', stop: 'off' } })).freezeMs).toBe(0);
    expect(planHit('ffx', crit, flags({ feel: SHORT, reduceMotion: true })).freezeMs).toBe(0);
    expect(planHit('ffx', hit({ crit: true, heavy: true, speed: 'fast' }), flags({ feel: SHORT })).freezeMs).toBe(0);
    expect(planHit('ffx', hit({ crit: true, heavy: true, speed: 'skip' }), flags({ feel: SHORT })).freezeMs).toBe(0);
  });

  it('wins over the demo\'s power-scaled stop (100 to 150 ms) when both are named', () => {
    const f = flags({ demo: true, feel: SHORT });
    expect(planHit('ffx', hit({ crit: true, heavy: true, power: 1.5 }), f).freezeMs).toBe(50);
    expect(planHit('ffx', hit({ crit: true, heavy: true, power: 1.5 }), flags({ demo: true })).freezeMs).toBe(150);
  });

  it('holds REAL time: 50 ms is 3 frames at 60 Hz and 7 at 144 Hz, then lets the field go', () => {
    for (const [hz, frames] of [[60, 3], [144, 7]] as const) {
      const s = new HitStop();
      s.freeze(50);
      let held = 0;
      for (let i = 0; i < 20; i++) if (s.scale(1 / hz) === 0) held++;
      expect(held, `${hz} Hz`).toBeGreaterThanOrEqual(frames - 1);
      expect(held, `${hz} Hz`).toBeLessThanOrEqual(frames);
    }
  });
});

describe('the rumble patterns', () => {
  const base = { crit: false, heavy: false, big: false, special: false, last: false, bossBig: false, first: true, taken: false };

  it('are light and short: nothing over 0.8, nothing over 600 ms; ordinary blows are silent', () => {
    const all: Array<RumblePattern | null> = [
      rumbleForHit({ ...base, crit: true }),
      rumbleForHit({ ...base, crit: true, taken: true }),
      rumbleForHit({ ...base, heavy: true }),
      rumbleForHit({ ...base, big: true, last: true }),
      rumbleForHit({ ...base, big: true, special: true, last: true, taken: true }),
      rumbleForHit({ ...base, bossBig: true, taken: true }),
      rumbleForOpen('overdrive'),
      rumbleForWin(),
    ];
    for (const p of all) {
      expect(p).not.toBeNull();
      expect(rumbleLength(p!)).toBeLessThanOrEqual(RUMBLE_MAX_MS);
      for (const s of p!) {
        expect(s.weak).toBeLessThanOrEqual(0.8);
        expect(s.strong).toBeLessThanOrEqual(0.8);
        expect(s.ms).toBeGreaterThan(0);
      }
    }
    expect(rumbleForHit(base)).toBeNull();
    expect(rumbleForHit({ ...base, big: true, last: false })).toBeNull(); // the middle of an Overdrive's flurry
    expect(rumbleForHit({ ...base, bossBig: true, first: false, taken: true })).toBeNull(); // a headline move that hits three targets rumbles once
    expect(rumbleForOpen('other')).toBeNull();
  });

  it('a blow taken is felt more than a blow dealt; Mega Flare is the longest', () => {
    const dealt = rumbleForHit({ ...base, crit: true })![0]!;
    const taken = rumbleForHit({ ...base, crit: true, taken: true })![0]!;
    expect(taken.strong).toBeGreaterThan(dealt.strong);
    expect(taken.ms).toBeGreaterThan(dealt.ms);
    const od = rumbleForHit({ ...base, big: true, last: true })!;
    const mega = rumbleForHit({ ...base, big: true, special: true, last: true })!;
    expect(rumbleLength(mega)).toBeGreaterThan(rumbleLength(od));
  });
});

/** A presenter context stub: just what the hooks read. */
function ctx(o: { speed?: string; reduced?: boolean; sideOf?: (id: string) => string | undefined } = {}): EventCtx {
  return {
    speed: () => o.speed ?? 'normal',
    moments: { reducedMotion: o.reduced === true, shots: { ffx2Framing: false } },
    stage: { sideOf: o.sideOf ?? ((id: string) => (id === 'tidus' ? 'party' : 'enemy')) },
    deps: {},
    menuOpen: () => false,
  } as unknown as EventCtx;
}
const dmg = (o: Partial<Extract<BattleEvent, { type: 'damage' }>> = {}): Extract<BattleEvent, { type: 'damage' }> =>
  ({ type: 'damage', targetId: 'flux', sourceId: 'tidus', amount: 900, element: 'none', crit: false, hitIndex: 0, hitCount: 1, ...o }) as Extract<BattleEvent, { type: 'damage' }>;

describe('the rumble hooks (presenter side)', () => {
  let sent: RumblePattern[];
  beforeEach(() => {
    sent = [];
    setRumbleSink((p) => sent.push(p));
  });

  it('are silent until the switch is on in a demo chapter', () => {
    rumbleHit(ctx(), dmg({ crit: true }), true, undefined, true);
    rumbleWin(ctx());
    rumbleOpen(ctx(), 'overdrive');
    expect(sent).toEqual([]);
    resetFeelForTests('?rumble=on'); // named, but no demo chapter running
    rumbleWin(ctx());
    expect(sent).toEqual([]);
    setFeelChapter('seymour-flux');
    rumbleWin(ctx());
    expect(sent).toHaveLength(1);
  });

  describe('in a demo chapter with the pack', () => {
    beforeEach(() => {
      resetFeelForTests('?pack=demo');
      setFeelChapter('ffx2-bahamut');
    });

    it('rumble on a crit dealt and a crit taken, not on an ordinary blow; taken is stronger', () => {
      rumbleHit(ctx(), dmg({ crit: true }), true, undefined, true);
      rumbleHit(ctx(), dmg({ crit: true, targetId: 'tidus', sourceId: 'flux' }), true, undefined, true);
      rumbleHit(ctx(), dmg(), false, undefined, true);
      expect(sent).toHaveLength(2);
      expect(sent[1]![0]!.strong).toBeGreaterThan(sent[0]![0]!.strong);
    });

    it('rumble on an Overdrive\'s opening and its last blow only, on Mega Flare\'s last blow, on a boss headline move taken, and on the win', () => {
      rumbleOpen(ctx(), 'overdrive');
      rumbleHit(ctx(), dmg({ hitIndex: 0, hitCount: 4 }), false, { kind: 'overdrive', bossBig: false }, false);
      rumbleHit(ctx(), dmg({ hitIndex: 3, hitCount: 4 }), false, { kind: 'overdrive', bossBig: false }, true);
      rumbleHit(ctx(), dmg({ targetId: 'tidus' }), false, { kind: 'special', bossBig: true }, true);
      rumbleHit(ctx(), dmg({ targetId: 'tidus' }), false, { kind: 'other', bossBig: true }, true);
      rumbleWin(ctx());
      expect(sent.map(rumbleLength)).toEqual([140, 240, 420, 200, 600]);
    });

    it('is silent at fast and skip speed and under REDUCE MOTION (the presenter\'s own flag)', () => {
      rumbleWin(ctx({ speed: 'fast' }));
      rumbleWin(ctx({ speed: 'skip' }));
      rumbleHit(ctx({ reduced: true }), dmg({ crit: true }), true, undefined, true);
      rumbleOpen(ctx({ reduced: true }), 'overdrive');
      expect(sent).toEqual([]);
    });

    it('a HELD win (FFX-2 Chapter IV: the girls do not pose after Bahamut) does not rumble; a posed win does (review fix F2)', () => {
      expect(fxVictory(ctx(), 'hold')).toBe(0);
      expect(sent).toEqual([]);
      expect(fxVictory(ctx(), 'pose')).toBe(0);
      expect(sent).toHaveLength(1);
    });

    it('the presenter hooks reach it: fxVictory, fxActionOpen and fxHit each ask, and a stub with no port still returns what it did before', async () => {
      const c = ctx();
      expect(fxVictory(c, 'pose')).toBe(0);
      await fxActionOpen(c, { type: 'action-start', actorId: 'tidus', command: { kind: 'overdrive' }, abilityName: 'Slice & Dice', abilityId: 'slice-and-dice' } as unknown as Extract<BattleEvent, { type: 'action-start' }>);
      expect(fxHit(c, dmg({ crit: true }), true)).toBeNull();
      expect(sent).toHaveLength(3); // the win, the Overdrive's opening, the crit
    });
  });
});

describe('the boss headline flag through the presenter hooks', () => {
  it('is set for a foe headline move and its own blows only: under the FFX-2 ATB another actor blow landing meanwhile is not the boss big attack', async () => {
    const seen: Array<{ bossBig?: boolean; big: boolean; menuOpen?: boolean }> = [];
    const c = ctx();
    (c.stage as unknown as { fx: unknown }).fx = { enabled: () => true, hit: (o: { bossBig?: boolean; big: boolean; menuOpen?: boolean }) => (seen.push(o), { freezeMs: 0, shook: false }) };
    const start = (actorId: string, abilityId: string): Extract<BattleEvent, { type: 'action-start' }> =>
      ({ type: 'action-start', actorId, abilityId, command: { kind: 'ability' } }) as unknown as Extract<BattleEvent, { type: 'action-start' }>;
    await fxActionOpen(c, start('bahamut', 'impulse'));
    fxHit(c, dmg({ sourceId: 'bahamut', targetId: 'tidus' }), false);
    fxHit(c, dmg({ sourceId: 'rikku' }), false);
    await fxActionOpen(c, start('bahamut', 'attack')); // an ordinary swing of the same boss
    fxHit(c, dmg({ sourceId: 'bahamut', targetId: 'tidus' }), false);
    await fxActionOpen(c, start('tidus', 'lance-of-atrophy')); // a headline NAME used by a party member is not a boss move
    fxHit(c, dmg({ sourceId: 'tidus' }), false);
    expect(seen.map((o) => o.bossBig)).toEqual([true, false, false, false]);
    expect(seen.every((o) => o.menuOpen === false)).toBe(true);
  });

  it('under the FFX-2 ATB overlap the boss blows still count after another actor action has opened (found in a browser run: Impulse landed after a girl attack began)', async () => {
    const seen: Array<{ bossBig?: boolean; big: boolean }> = [];
    const c = ctx();
    (c.stage as unknown as { fx: unknown }).fx = { enabled: () => true, hit: (o: { bossBig?: boolean; big: boolean }) => (seen.push(o), { freezeMs: 0, shook: false }) };
    const start = (actorId: string, abilityId: string): Extract<BattleEvent, { type: 'action-start' }> =>
      ({ type: 'action-start', actorId, abilityId, command: { kind: 'ability' } }) as unknown as Extract<BattleEvent, { type: 'action-start' }>;
    resetFeelForTests('?pack=demo');
    setFeelChapter('ffx2-bahamut');
    await fxActionOpen(c, start('bahamut', 'impulse'));
    await fxActionOpen(c, start('rikku', 'attack')); // the next action opens before Impulse's blows land
    fxHit(c, dmg({ sourceId: 'bahamut', targetId: 'tidus' }), false);
    fxHit(c, dmg({ sourceId: 'rikku' }), false);
    expect(seen.map((o) => o.bossBig)).toEqual([true, false]);
  });
});

describe('the pad-side sink', () => {
  interface Call { type: string; startDelay: number; duration: number; weakMagnitude: number; strongMagnitude: number }
  function deps(o: { pad?: boolean; actuator?: boolean; padActive?: boolean; reduce?: boolean; now?: () => number; calls?: Call[]; reject?: boolean; throws?: boolean; resets?: number[] } = {}): RumbleDeps {
    const calls = o.calls ?? [];
    const actuator = {
      playEffect: (type: string, p: Omit<Call, 'type'>): Promise<unknown> => {
        if (o.throws) throw new Error('boom');
        calls.push({ type, ...p });
        return o.reject ? Promise.reject(new Error('gone')) : Promise.resolve('complete');
      },
      reset: (): Promise<unknown> => (o.resets?.push(1), Promise.resolve()),
    };
    const pads = o.pad === false ? [null] : [{ connected: true, ...(o.actuator === false ? {} : { vibrationActuator: actuator }) }];
    return { pads: () => pads, padActive: () => o.padActive !== false, reduceMotion: () => o.reduce === true, now: o.now ?? (() => 1000) };
  }
  const pattern: RumblePattern = [{ atMs: 0, ms: 160, weak: 0.3, strong: 0.5 }, { atMs: 200, ms: 100, weak: 1.4, strong: -1 }];

  /** A hand-cranked scheduler: run(ms) fires what is due by then, in order. */
  function clock(): { later: NonNullable<RumbleDeps['later']>; run(ms: number): void; waiting(): number } {
    const q: Array<{ at: number; fn: () => void; live: boolean }> = [];
    let t = 0;
    return {
      later: (fn, ms) => {
        const e = { at: t + ms, fn, live: true };
        q.push(e);
        return () => {
          e.live = false;
        };
      },
      run: (ms) => {
        t += ms;
        for (const e of q.filter((x) => x.live && x.at <= t).sort((a, b) => a.at - b.at)) {
          e.live = false;
          e.fn();
        }
      },
      waiting: () => q.filter((x) => x.live).length,
    };
  }

  it('plays dual-rumble on the connected pad with clamped magnitudes: the first segment now, the next when its moment comes (one on the pad at a time)', () => {
    const calls: Call[] = [];
    const c = clock();
    expect(playRumble(pattern, { ...deps({ calls }), later: c.later })).toBe('played');
    expect(calls).toEqual([{ type: 'dual-rumble', startDelay: 0, duration: 160, weakMagnitude: 0.3, strongMagnitude: 0.5 }]); // NOT queued with a delay: that call would preempt this one
    c.run(199);
    expect(calls).toHaveLength(1);
    c.run(1);
    expect(calls).toEqual([
      { type: 'dual-rumble', startDelay: 0, duration: 160, weakMagnitude: 0.3, strongMagnitude: 0.5 },
      { type: 'dual-rumble', startDelay: 0, duration: 100, weakMagnitude: 1, strongMagnitude: 0 },
    ]);
  });

  it('the win is two calls in time order, never two at once (review fix F3: the second used to cut the first)', () => {
    const calls: Array<Call & { at: number }> = [];
    const c = clock();
    let now = 0;
    const d = deps({ now: () => now });
    const act = (d.pads() as Array<{ vibrationActuator: { playEffect: (t: string, p: Omit<Call, 'type'>) => Promise<unknown> } }>)[0]!.vibrationActuator;
    const inner = act.playEffect;
    act.playEffect = (type, p) => (calls.push({ type, ...p, at: now }), inner(type, p));
    playRumble(rumbleForWin(), { ...d, later: c.later });
    expect(calls.map((x) => [x.at, x.startDelay, x.duration])).toEqual([[0, 0, 160]]);
    now = 240;
    c.run(240);
    expect(calls.map((x) => [x.at, x.startDelay, x.duration])).toEqual([[0, 0, 160], [240, 0, 360]]);
    expect(calls.every((x) => x.startDelay === 0)).toBe(true); // no call carries a delay that would preempt an effect still playing
  });

  it('stopRumble resets the pad only when a pattern has gone to it (a pause with the rumble off leaves the pad alone)', () => {
    const resets: number[] = [];
    const d = deps({ resets, now: () => 1000 });
    stopRumble(d);
    expect(resets).toEqual([]);
    playRumble(pattern, d);
    stopRumble(d);
    expect(resets).toEqual([1]);
    stopRumble(d);
    expect(resets).toEqual([1]);
  });

  it('stopRumble cancels the segment that has not been sent and resets the pad; a new pattern cancels the old tail', () => {
    const calls: Call[] = [];
    const c = clock();
    let now = 1000;
    const d = { ...deps({ calls, now: () => now }), later: c.later };
    playRumble(pattern, d);
    expect(c.waiting()).toBe(1);
    stopRumble(d);
    expect(c.waiting()).toBe(0);
    c.run(500);
    expect(calls).toHaveLength(1); // the second segment never went out
    now = 5000;
    playRumble(pattern, d);
    now = 6000;
    playRumble([{ atMs: 0, ms: 50, weak: 0.1, strong: 0.1 }], d); // a later pattern preempts: the old tail must not come after it
    expect(c.waiting()).toBe(0);
    c.run(500);
    expect(calls).toHaveLength(3); // one first segment per pattern played: the cancelled and the preempted tails never went out
  });

  it('never on keyboard play, whatever is plugged in', () => {
    const calls: Call[] = [];
    expect(playRumble(pattern, deps({ calls, padActive: false }))).toBe('keyboard');
    expect(calls).toEqual([]);
  });

  it('never under REDUCE MOTION', () => {
    const calls: Call[] = [];
    expect(playRumble(pattern, deps({ calls, reduce: true }))).toBe('reduce-motion');
    expect(calls).toEqual([]);
  });

  it('is silence where there is no actuator (Firefox, Safari) or no pad, and never throws', () => {
    expect(playRumble(pattern, deps({ actuator: false }))).toBe('no-pad');
    expect(playRumble(pattern, deps({ pad: false }))).toBe('no-pad');
    expect(playRumble(pattern, { pads: () => null, padActive: () => true, reduceMotion: () => false, now: () => 1 })).toBe('no-pad');
    expect(playRumble(pattern, { ...deps(), pads: () => { throw new Error('no gamepads'); } })).toBe('error');
    expect(playRumble(pattern, deps({ throws: true, now: () => 90_000 }))).toBe('error');
  });

  it('a pad that goes away mid-pattern (a rejected promise) is not an unhandled rejection', async () => {
    const unhandled: unknown[] = [];
    const on = (e: unknown): number => unhandled.push(e);
    process.on('unhandledRejection', on);
    expect(playRumble(pattern, deps({ reject: true, now: () => 50_000 }))).toBe('played');
    await new Promise((r) => setTimeout(r, 20));
    process.off('unhandledRejection', on);
    expect(unhandled).toEqual([]);
  });

  it('two big moments a few frames apart are one rumble; a later one plays', () => {
    const calls: Call[] = [];
    let now = 1000;
    const d = deps({ calls, now: () => now });
    expect(playRumble(pattern, d)).toBe('played');
    now = 1050;
    expect(playRumble(pattern, d)).toBe('busy');
    now = 1400;
    expect(playRumble(pattern, d)).toBe('played');
    expect(rumbleLog().map((r) => r.result)).toEqual(['played', 'busy', 'played']);
  });

  it('trims a pattern to 600 ms', () => {
    const calls: Call[] = [];
    playRumble([{ atMs: 0, ms: 2000, weak: 1, strong: 1 }, { atMs: 900, ms: 100, weak: 1, strong: 1 }], deps({ calls, now: () => 77_000 }));
    expect(calls).toHaveLength(1);
    expect(calls[0]!.duration).toBe(600);
  });
});

describe('the pack is not the rumble by itself outside a demo chapter', () => {
  it('?pack=demo in Chapter III turns nothing on', () => {
    const sent: RumblePattern[] = [];
    setRumbleSink((p) => sent.push(p));
    resetFeelForTests('?pack=demo');
    setFeelPack(true);
    setFeelChapter('braskas-final-aeon');
    rumbleWin(ctx());
    expect(sent).toEqual([]);
  });
});
