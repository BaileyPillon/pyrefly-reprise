/**
 * Review round 2 of the measuring lane, R2-M3 (motion-fluidity pass, lane L5; both games, tooling): the clip factory's flagship use, "the boss at a sliver so the first blow is its last, played on to its
 * knock-out", did not work on the real game and failed silently. Proven here without a browser: `setup` reaches the enemy side only (it set five of the party's aeons to 2 percent of their hit points),
 * a sliver is `set: 1` (a fraction of a 70,000-hit-point boss is not one) and says so, `quiet` marks the chapter's own threshold scripts as played, `until` can wait for what the PICTURE does (a figure's
 * life becoming `down`), a moment that never happened is a FAILED card, and the plain window ends when the action finished playing, not after the next actor's cut-in.
 */
import { describe, expect, it } from 'vitest';
import { actionEnd, checkSpec, findBeatFrame, momentFailures, windowOf } from '../../critic/runner/lib/ab-pure.mjs';
import { playOneAttack } from '../../tools/measure/fight.mjs';
import { SLIVER_HP, applySetup, hpWarnings } from '../../tools/measure/setup.mjs';
import { wrapText } from '../../tools/measure/ab-compose.mjs';

// ---- setup: against a fake page that evaluates the in-page functions on a fake battle state ----
function fakeState() {
  const combatants = [
    { id: 'tidus', side: 'party', hp: 1000, stats: { maxHp: 1000 } },
    { id: 'valefor', side: 'aeon', hp: 3000, stats: { maxHp: 3000 } },
    { id: 'ifrit', side: 'aeon', hp: 4000, stats: { maxHp: 4000 } },
    { id: 'seymour-flux', side: 'enemy', hp: 70000, stats: { maxHp: 70000 } },
    { id: 'mortiorchis', side: 'enemy', hp: 4000, stats: { maxHp: 4000 } },
  ];
  const state = {
    combatants,
    triggers: [
      { id: 'seymour-half', when: { type: 'hp-below', who: 'seymour-flux', fraction: 0.5 }, once: true },
      { id: 'mortiorchis-first-charge', when: { type: 'charge-started', who: 'mortiorchis' }, once: true },
      { id: 'tidus-low', when: { type: 'hp-below', who: 'tidus', fraction: 0.2 }, once: true },
    ],
    firedTriggerIds: [] as string[],
  };
  const page = { evaluate: async (fn: unknown, arg?: unknown) => { (globalThis as any).window = { __pyrefly: { battleState: () => state } }; return typeof fn === 'function' ? (fn as (a: unknown) => unknown)(arg) : null; } };
  return { state, combatants, page };
}

describe('setup reaches the side it names (R2-M3, 1)', () => {
  it('"enemy" is the enemy side only: the party\'s aeons keep their hit points', async () => {
    const { combatants, page } = fakeState();
    const [done] = await applySetup(page, [{ hp: { who: 'enemy', fraction: 0.02 } }]);
    expect(done!.result).toEqual([{ id: 'seymour-flux', side: 'enemy', hp: 1400, maxHp: 70000 }, { id: 'mortiorchis', side: 'enemy', hp: 80, maxHp: 4000 }]);
    expect(combatants.find((c) => c.id === 'valefor')!.hp).toBe(3000);
    expect(combatants.find((c) => c.id === 'ifrit')!.hp).toBe(4000);
    expect(combatants.find((c) => c.id === 'tidus')!.hp).toBe(1000);
    delete (globalThis as any).window;
  });
  it('"boss" is the one enemy with the most hit points, "aeon" the summon reserve, "party" the party side, a figure id that one', async () => {
    const { combatants, page } = fakeState();
    await applySetup(page, [{ hp: { who: 'boss', set: 1 } }]);
    expect(combatants.map((c) => c.hp)).toEqual([1000, 3000, 4000, 1, 4000]);
    await applySetup(page, [{ hp: { who: 'aeon', set: 7 } }, { hp: { who: 'party', set: 3 } }, { hp: { who: 'mortiorchis', fraction: 0.5 } }]);
    expect(combatants.map((c) => c.hp)).toEqual([3, 7, 7, 1, 2000]);
    delete (globalThis as any).window;
  });
  it('a set is clamped to 1 .. the maximum', async () => {
    const { combatants, page } = fakeState();
    await applySetup(page, [{ hp: { who: 'tidus', set: 99999 } }, { hp: { who: 'valefor', set: 0.2 } }]);
    expect(combatants[0]!.hp).toBe(1000);
    expect(combatants[1]!.hp).toBe(1);
    delete (globalThis as any).window;
  });
});

describe('a sliver is a set of 1, and a fraction that is not a sliver says so (R2-M3, 2)', () => {
  it('warns when a fraction leaves a figure above one blow, never for a set of 1', async () => {
    const { page } = fakeState();
    const steps = await applySetup(page, [{ hp: { who: 'boss', fraction: 0.02 } }, { hp: { who: 'boss', set: 1 } }, { hp: { who: 'boss', fraction: 0.00001 } }]);
    expect(steps[0]!.warnings.join(' ')).toMatch(/seymour-flux is left at 1400 of 70000 hit points; one blow takes about 1000 here \(Chapter I: 778\)/);
    expect(steps[1]!.warnings).toEqual([]);
    expect(steps[2]!.warnings).toEqual([]); // rounds up to 1
    expect(SLIVER_HP).toBe(1000);
    delete (globalThis as any).window;
  });
  it('warns when a step matched nobody', async () => {
    const { page } = fakeState();
    const [a, b] = await applySetup(page, [{ hp: { who: 'nobody', set: 1 } }, { quiet: 'nobody' }]);
    expect(a!.warnings[0]).toMatch(/matched no figure/);
    expect(b!.warnings[0]).toMatch(/quiet: "nobody" matched no figure/);
    expect(hpWarnings({ who: 'x', set: 1 }, [])[0]).toMatch(/matched no figure/);
    delete (globalThis as any).window;
  });
});

describe('quiet marks the chapter\'s own threshold scripts as played (R2-M3, 2)', () => {
  it('pushes only the hp-below triggers about the named figure, once', async () => {
    const { state, page } = fakeState();
    const [a] = await applySetup(page, [{ quiet: 'boss' }]);
    expect(a!.result).toEqual({ figures: ['seymour-flux'], fired: ['seymour-half'] });
    expect(state.firedTriggerIds).toEqual(['seymour-half']);
    const [b] = await applySetup(page, [{ quiet: 'seymour-flux' }]);
    expect((b!.result as any).fired).toEqual([]); // not twice
    expect(state.firedTriggerIds).toEqual(['seymour-half']);
    await applySetup(page, [{ quiet: 'enemy' }, { quiet: 'party' }]);
    expect(state.firedTriggerIds).toEqual(['seymour-half', 'tidus-low']); // the charge trigger is not an hp trigger: it still runs
    delete (globalThis as any).window;
  });
});

describe('the spec accepts the new fields and refuses the old mistakes', () => {
  const base = { id: 'CP-06', chapter: 'seymour-flux', move: 'last-blow', variants: [{ id: 'V0' }, { id: 'V1' }] };
  it('accepts quiet, a beat until, a beat window and the life kind', () => {
    expect(checkSpec({ ...base, setup: [{ hp: { who: 'boss', set: 1 } }, { quiet: 'boss' }], until: { beat: { actor: 'seymour-flux', kind: 'life', life: 'down' }, afterMs: 1500 }, window: { beat: { actor: 'seymour-flux', kind: 'life', life: 'down' }, beforeMs: 2000, afterMs: 1500 } })).toEqual([]);
    expect(checkSpec({ ...base, align: { kind: 'beat', beat: { actor: 'seymour-flux', kind: 'life' } }, strip: { beat: { actor: 'seymour-flux', kind: 'life', life: 'down' } } })).toEqual([]);
  });
  it('refuses a set below 1, a quiet with no figure and a beat with no actor', () => {
    const bad = (o: object) => checkSpec({ ...base, ...o }).join(' | ');
    expect(bad({ setup: [{ hp: { who: 'boss', set: 0 } }] })).toMatch(/setup/);
    expect(bad({ setup: [{ quiet: '' }] })).toMatch(/setup/);
    expect(bad({ until: { beat: { kind: 'life' } } })).toMatch(/until/);
    expect(bad({ window: { beat: { actor: 'x', kind: 'wiggle' } } })).toMatch(/window/);
  });
});

describe('a visual beat of a figure\'s life state', () => {
  const frames = Array.from({ length: 300 }, (_, i) => ({ vt: i * (1000 / 60), actors: { boss: { life: i < 120 ? 'idle' : i < 200 ? 'hurt' : 'down', pose: 'idle' } } }));
  it('finds the frame a figure goes down, and the first change when no state is named', () => {
    expect(findBeatFrame(frames, { actor: 'boss', kind: 'life', life: 'down' })).toBe(200);
    expect(findBeatFrame(frames, { actor: 'boss', kind: 'life' })).toBe(120);
    expect(findBeatFrame(frames, { actor: 'boss', kind: 'life', life: 'victory' })).toBe(-1);
  });
  it('cuts a window around the beat, not around the log\'s instant of the key press', () => {
    const w = windowOf(frames, [{ vt: 100, type: 'ko' } as never], { t0: 0, around: { beat: { actor: 'boss', kind: 'life', life: 'down' }, beforeMs: 1000, afterMs: 500 } })!;
    expect(w.around).toBe(true);
    expect(w.fellBack).toBeUndefined();
    expect(w.startMs).toBeCloseTo(200 * (1000 / 60) - 1000, 3);
  });
  it('and falls back, saying so, when the beat never happens', () => {
    const w = windowOf(frames, [], { t0: 0, around: { beat: { actor: 'boss', kind: 'life', life: 'victory' } } })!;
    expect(w.fellBack).toBe(true);
    expect(w.wanted).toMatchObject({ beat: { actor: 'boss' } });
  });
});

describe('the plain window ends when the action finished playing, not after the next actor\'s cut-in (m10)', () => {
  // the phases of the first real card: command, action-start, damage, action-end, then the NEXT actor's turn-start cut-in, then its command menu
  const phaseAt = (i: number): string => (i < 45 ? 'command:tidus' : i < 60 ? 'play:action-start' : i < 86 ? 'play:damage' : i < 100 ? 'play:action-end' : i < 150 ? 'play:turn-start' : 'command:yuna');
  const frames = Array.from({ length: 300 }, (_, i) => ({ vt: i * (1000 / 60), phase: phaseAt(i), playing: i >= 45 && i < 150, menu: i < 45 || i >= 150 }));
  it('actionEnd is the last frame of the nth run of the action-end phase', () => {
    expect(actionEnd(frames, 45 * (1000 / 60))).toBe(99);
    expect(actionEnd(frames, 45 * (1000 / 60), 2)).toBe(-1); // only one action finished
    expect(actionEnd(frames.map((f) => ({ ...f, phase: null })) as never, 0)).toBe(-1); // a build with no phase: the caller falls back
  });
  it('two actions: the window ends after the second', () => {
    const two = Array.from({ length: 400 }, (_, i) => ({ vt: i * (1000 / 60), phase: i < 100 ? phaseAt(i) : i < 150 ? 'command:tidus' : i < 200 ? 'play:damage' : i < 230 ? 'play:action-end' : i < 260 ? 'play:turn-start' : 'command:yuna' }));
    expect(actionEnd(two, 0, 1)).toBe(99);
    expect(actionEnd(two, 0, 2)).toBe(229);
  });
  it('windowOf ends where the next actor\'s cut-in begins, or settleMs after the action when that is sooner', () => {
    const w = windowOf(frames, [], { t0: 45 * (1000 / 60), leadMs: 500, settleMs: 1000, maxMs: 8000 })!;
    expect(w.endMs).toBeCloseTo(100 * (1000 / 60), 3); // the next actor's cut-in begins at frame 100, a frame after the action: the clip ends there (the old end: the menu at frame 150 (2.5 s) plus a second)
    expect(w.fellBack).toBeUndefined();
    const late = frames.map((f, i) => ({ ...f, phase: i >= 100 && i < 170 ? 'idle:waiting' : i >= 170 && i < 200 ? 'play:turn-start' : f.phase })); // a quiet stretch of 2.8 s before the next cut-in
    const wl = windowOf(late, [], { t0: 45 * (1000 / 60), leadMs: 500, settleMs: 1000 })!;
    expect(wl.endMs).toBeCloseTo(99 * (1000 / 60) + 1000, 3); // the settle is the shorter: the clip keeps the move's reaction
    const w2 = windowOf(frames, [], { t0: 45 * (1000 / 60), settleMs: 1000, turns: 2 })!;
    expect(w2.endMs).toBeGreaterThan(w.endMs); // two actions asked, one finished: the old rule (the last acting frame) takes over
  });
});

describe('a moment that never happened is a failed card (R2-M3, 3)', () => {
  it('names the variant by its blind letter and says the clip is not the moment', () => {
    const spec = { until: { event: 'ko', who: 'seymour-flux' } };
    const f = momentFailures(spec, [{ letter: 'A', untilAt: null, ended: 'timeout', turns: 3, win: { fellBack: true, wanted: spec.until } }, { letter: 'B', untilAt: 4200, ended: 'event', turns: 2, win: { fellBack: false } }]);
    expect(f.length).toBe(1);
    expect(f[0]).toMatch(/^A: the play never saw the event ko of seymour-flux \(it ended by timeout after 3 turn\(s\)\); the clip is NOT the moment the card is about/);
  });
  it('a window that fell back with no until is a failure of its own; a beat is named as a beat', () => {
    expect(momentFailures({}, [{ letter: 'A', win: { fellBack: true, wanted: { beat: { actor: 'x', kind: 'life' } } } }])[0]).toMatch(/^A: the window's the beat .* never happened/);
    expect(momentFailures({ until: { beat: { actor: 'boss', kind: 'life' } } }, [{ letter: 'B', untilAt: null, ended: 'left-battle' }])[0]).toMatch(/never saw the beat/);
    expect(momentFailures({}, [{ letter: 'A', win: { fellBack: false } }])).toEqual([]);
  });
});

describe('the footer of a still wraps (m8)', () => {
  it('breaks at spaces within the line length and keeps a long word whole', () => {
    const t = 'DO NOT SEND: this clip ends as the blow lands, so the reaction is not in it and the strip shows a flash fading';
    const lines = wrapText(t, 60);
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(60);
    expect(lines.join(' ')).toBe(t);
    expect(wrapText('x'.repeat(90), 60)).toEqual(['x'.repeat(90)]);
    expect(wrapText('', 60)).toEqual(['']);
  });
});

// ---- playing on to a beat against a fake engine ----
function fakeLifeEngine({ downAfterTurn = 2, leaveBattleAfterDown = false }: { downAfterTurn?: number; leaveBattleAfterDown?: boolean } = {}) {
  const presses: number[] = [];
  const log: Array<Record<string, unknown>> = [];
  const state = { menu: true, playingUntil: -1, pending: 0, turn: 0, downAt: -1, down: false };
  const stepper = {
    ms: 0,
    tick: async () => {
      stepper.ms += 1000 / 60;
      const now = stepper.ms;
      if (state.downAt >= 0 && now >= state.downAt) { state.down = true; state.downAt = -1; }
      if (state.playingUntil >= 0 && now >= state.playingUntil) { state.playingUntil = -1; state.menu = true; }
      const acting = state.playingUntil >= 0;
      const left = leaveBattleAfterDown && state.down && now > state.downAt + 1; // the victory screen
      return { screen: left ? 'results' : 'battle', menu: state.menu && !acting, playing: true, phase: acting ? 'play:action-start' : 'command:tidus', nLog: log.length, actors: { boss: { life: state.down ? 'down' : 'idle', pose: 'idle' } } };
    },
  };
  const g = {
    page: { evaluate: async (expr: string) => { const m = /NEWLOG_\((\d+)\)/.exec(String(expr)); return m ? log.slice(Number(m[1])) : null; } },
    press: async () => {
      presses.push(stepper.ms);
      if (!state.menu) return;
      state.pending++;
      if (state.pending === 2) {
        state.pending = 0; state.menu = false; state.turn++; state.playingUntil = stepper.ms + 1000;
        log.push({ type: 'ko', targetId: 'boss' }); // the log says KO the instant the key is pressed...
        if (state.turn >= downAfterTurn && state.downAt < 0 && !state.down) state.downAt = stepper.ms + 1500; // ...the picture a second and a half later
      }
    },
  };
  return { presses, g, stepper, acc: { frames: [] as any[], events: [] as any[], logLen: 0, rec: false } };
}

describe('playing on to a visual beat (R2-M3)', () => {
  const play = (f: ReturnType<typeof fakeLifeEngine>, extra: Record<string, unknown> = {}) => playOneAttack({ g: f.g as never, stepper: f.stepper as never, acc: f.acc, hz: 60, preRollMs: 100, tailMs: 100, seconds: 30, ...extra });
  it('waits for the picture: the beat is 1.5 s after the logged event, and the play stops afterMs after the BEAT', async () => {
    const f = fakeLifeEngine({ downAfterTurn: 1 });
    const r = await play(f, { until: { beat: { actor: 'boss', kind: 'life', life: 'down' }, afterMs: 500 } });
    expect(r.ended).toBe('event');
    const logAt = f.acc.events.find((e) => e.type === 'ko')!.vt;
    expect(r.untilAt! - logAt).toBeGreaterThan(1400); // the log's KO is not the picture's
    const last = f.acc.frames[f.acc.frames.length - 1];
    expect(last.vt - r.untilAt!).toBeGreaterThanOrEqual(480);
    expect(last.vt - r.untilAt!).toBeLessThan(700);
  });
  it('plays turn after turn until the beat, and times out saying so when it never comes', async () => {
    const f = fakeLifeEngine({ downAfterTurn: 3 });
    const r = await play(f, { until: { beat: { actor: 'boss', kind: 'life', life: 'down' }, afterMs: 200 } });
    expect(r.ended).toBe('event');
    expect(r.turns).toBeGreaterThanOrEqual(3); // the picture falls 1.5 s after the third blow: the next menu opens before it
    expect(r.turns).toBeLessThanOrEqual(4);
    const g = fakeLifeEngine({ downAfterTurn: 99 });
    const r2 = await play(g, { until: { beat: { actor: 'boss', kind: 'life', life: 'down' } }, seconds: 5, maxTurns: 2 });
    expect(r2.ended).toBe('timeout');
    expect(r2.untilAt).toBeNull();
  });
  it('still ends by the event when the screen leaves the battle after it was seen (the victory), not as left-battle', async () => {
    const f = fakeLifeEngine({ downAfterTurn: 1, leaveBattleAfterDown: true });
    const r = await play(f, { until: { beat: { actor: 'boss', kind: 'life', life: 'down' }, afterMs: 3000 } });
    expect(r.ended).toBe('event');
    expect(r.untilAt).not.toBeNull();
  });
  it('ends by the event when there is no battle left to read (the page reads null after the victory) and does not run to the time cap', async () => {
    const f = fakeLifeEngine({ downAfterTurn: 1 });
    const live = f.stepper.tick;
    let seen = -1;
    f.stepper.tick = (async () => { const st = (await live()) as any; if (st.actors.boss.life === 'down' && seen < 0) seen = f.stepper.ms; return seen >= 0 && f.stepper.ms - seen > 200 ? null : st; }) as never;
    const r = await play(f, { until: { beat: { actor: 'boss', kind: 'life', life: 'down' }, afterMs: 900 }, seconds: 60 });
    expect(r.ended).toBe('event');
    expect(f.stepper.ms).toBeLessThan(8000); // not 60 s of nothing
  });
  it('and a battle that ends before any event is left-battle', async () => {
    const f = fakeLifeEngine({ downAfterTurn: 99 });
    f.stepper.tick = async () => ({ screen: 'results', menu: false, playing: false, phase: null, nLog: 0, actors: {} }) as never;
    const r = await play(f, { until: { event: 'ko', who: 'boss' }, seconds: 4 });
    expect(r.ended).toBe('left-battle');
  });
});

describe('the example cards stay filmable (R2-M3, m10)', () => {
  it('the four examples pass the spec check, none names a build folder that can be deleted (--dist does), the Chapter I pair has a fixed crop', async () => {
    const fs = await import('node:fs');
    const read = (f: string) => JSON.parse(fs.readFileSync(`tools/measure/examples/${f}`, 'utf8'));
    for (const f of ['card-ch1-attack-pack.json', 'card-ch4-attack-pack.json', 'card-ch1-last-blow.json', 'card-ch4-three-turns-control.json']) {
      const spec = read(f);
      expect(checkSpec(spec), f).toEqual([]);
      expect(spec.build, f).toBeUndefined();
    }
    expect(read('card-ch1-attack-pack.json').crop).toMatchObject({ w: 1600, h: 900 });
    const last = read('card-ch1-last-blow.json');
    expect(last.setup).toEqual([{ hp: { who: 'boss', set: 1 } }, { quiet: 'boss' }]); // a sliver is a set of 1, never a fraction
    expect(last.until.beat).toMatchObject({ actor: 'seymour-flux', kind: 'life', life: 'down' });
    expect(last.holdMenuMs).toBeGreaterThan(0);
    const control = read('card-ch4-three-turns-control.json');
    expect(control.turns).toBe(3);
    expect(control.variants.map((v: { query: string }) => v.query)).toEqual(['', '&motion=classic']); // variants that really differ
  });
});

describe('turns: the window follows the pressed turn, and a card that reached fewer turns than it asked fails (the first real three-turn card reached two)', () => {
  // an ATB fight: an ENEMY's action finishes (frames 20 to 30) before the girl's confirmed turn (pressed at frame 40) has played (frames 50 to 80)
  const phaseAt = (i: number): string => (i >= 20 && i < 30 ? 'play:action-end' : i >= 40 && i < 50 ? 'play:action-start' : i >= 50 && i < 80 ? 'play:action-end' : 'command:rikku');
  const frames = Array.from({ length: 200 }, (_, i) => ({ vt: i * (1000 / 60), phase: phaseAt(i) }));
  it('counting actions would stop at the enemy\'s; afterMs picks the first action that finished after the press', () => {
    expect(actionEnd(frames, 0, 1)).toBe(29);
    expect(actionEnd(frames, 0, 1, 40 * (1000 / 60))).toBe(79);
    expect(actionEnd(frames, 0, 1, 90 * (1000 / 60))).toBe(-1); // nothing finished after it: the caller falls back
    const w = windowOf(frames, [], { t0: 35 * (1000 / 60), leadMs: 0, settleMs: 500, afterPressMs: 40 * (1000 / 60) })!;
    expect(w.endMs).toBeCloseTo(79 * (1000 / 60) + 500, 3);
  });
  it('momentFailures names the shortfall in blind letters', () => {
    const f = momentFailures({ turns: 3 }, [{ letter: 'A', turns: 2, ended: 'timeout' }, { letter: 'B', turns: 3, ended: 'menu' }]);
    expect(f).toEqual(["A: the play reached 2 of the 3 turns the card asks for (it ended by timeout); the clip is NOT the moment the card is about"]);
    expect(momentFailures({ turns: 1 }, [{ letter: 'A', turns: 1 }])).toEqual([]);
    expect(momentFailures({}, [{ letter: 'A' }])).toEqual([]);
  });
  it('playOneAttack reports the virtual time each turn was confirmed', async () => {
    const f = fakeLifeEngine({ downAfterTurn: 99 });
    const r = await playOneAttack({ g: f.g as never, stepper: f.stepper as never, acc: f.acc, hz: 60, preRollMs: 100, tailMs: 100, seconds: 30, turns: 3 });
    expect(r.pressAt.length).toBe(r.pressedTurns);
    expect(r.pressAt[0]).toBe(r.t0);
    for (let k = 1; k < r.pressAt.length; k++) expect(r.pressAt[k]!).toBeGreaterThan(r.pressAt[k - 1]!);
  });
});

describe('a menu that is still opening ignores the keys (the first real three-turn card sat 29 s at its second menu)', () => {
  // from the second menu on, keys pressed within `lockMs` of the menu opening do nothing
  function lockedEngine(lockMs: number) {
    const presses: number[] = [];
    const state = { menu: true, openedAt: 0, playingUntil: -1, pending: 0, turn: 0 };
    const stepper = {
      ms: 0,
      tick: async () => {
        stepper.ms += 1000 / 60;
        if (state.playingUntil >= 0 && stepper.ms >= state.playingUntil) { state.playingUntil = -1; state.menu = true; state.openedAt = stepper.ms; }
        const acting = state.playingUntil >= 0;
        return { screen: 'battle', menu: state.menu && !acting, playing: true, phase: acting ? 'play:action-start' : 'command:yuna', nLog: 0, actors: {} };
      },
    };
    const g = {
      page: { evaluate: async () => null },
      press: async () => {
        presses.push(stepper.ms);
        if (!state.menu) return;
        if (state.turn >= 1 && stepper.ms - state.openedAt < lockMs) return; // the menu is still opening
        state.pending++;
        if (state.pending === 2) { state.pending = 0; state.menu = false; state.turn++; state.playingUntil = stepper.ms + 1000; }
      },
    };
    return { presses, g, stepper, acc: { frames: [] as any[], events: [] as any[], logLen: 0, rec: false } };
  }
  const play = (f: ReturnType<typeof lockedEngine>, extra: Record<string, unknown> = {}) => playOneAttack({ g: f.g as never, stepper: f.stepper as never, acc: f.acc, hz: 60, preRollMs: 500, tailMs: 100, seconds: 30, ...extra });
  it('waits for the menu to open before the keys of the next turn, and reaches the turns it was asked for', async () => {
    const f = lockedEngine(400);
    const r = await play(f, { turns: 3 });
    expect(r.turns).toBe(3);
    expect(r.ended).toBe('menu');
    expect(r.retried).toBe(0); // the wait was enough
  });
  it('presses the keys again when they started no action, and says how often', async () => {
    const f = lockedEngine(2600); // longer than the wait: the first presses are ignored
    const r = await play(f, { turns: 2 });
    expect(r.turns).toBe(2);
    expect(r.ended).toBe('menu');
    expect(r.retried).toBeGreaterThanOrEqual(1);
    expect(r.pressAt.length).toBe(2);
    expect(r.pressAt[1]!).toBeGreaterThan(r.pressAt[0]! + 2000); // the press time is the one that worked
  });
  it('and gives up after two retries a turn rather than pressing for ever', async () => {
    const f = lockedEngine(1e9);
    const r = await play(f, { turns: 2, seconds: 12 });
    expect(r.ended).toBe('timeout');
    expect(r.turns).toBe(1); // played
    expect(r.pressedTurns).toBe(2); // pressed, the second one ignored
    expect(r.retried).toBeLessThanOrEqual(2);
  });
});
