/**
 * Review M5 of the motion-fluidity pass (lane L5; both games, tooling): the clip factory films moments beyond "the first command, the first target, to the next menu". The pure parts (`findEvent`,
 * `windowOf` around an event, `checkSpec`) are tested on their own; the play (`tools/measure/fight.mjs` `playOneAttack`) runs against a FAKE ENGINE (a small state machine standing in for the page: a menu,
 * an action that plays for a while and logs a blow, the menu again) so the turn, hold, `until` and per-key-wait logic is proven without a browser; `applySetup` is run against a fake page.
 */
import { describe, expect, it } from 'vitest';
import { checkSpec, findBeatFrame, findEvent, isActing, windowOf } from '../../critic/runner/lib/ab-pure.mjs';
import { playOneAttack } from '../../tools/measure/fight.mjs';
import { applySetup } from '../../tools/measure/setup.mjs';

const ev = (type: string, vt: number, o: Record<string, unknown> = {}) => ({ type, vt, f: Math.round(vt / 16.667), ...o });

describe('finding an event', () => {
  const events = [ev('damage', 400, { targetId: 'boss' }), ev('damage', 900, { targetId: 'girl' }), ev('damage', 1500, { targetId: 'boss' }), ev('ko', 1600, { targetId: 'boss', sourceId: 'girl' })];
  it('takes the nth of a type, about one figure when asked', () => {
    expect(findEvent(events, { event: 'damage' })?.vt).toBe(400);
    expect(findEvent(events, { event: 'damage', ordinal: 3 })?.vt).toBe(1500);
    expect(findEvent(events, { event: 'damage', who: 'boss', ordinal: 2 })?.vt).toBe(1500);
    expect(findEvent(events, { type: 'ko', who: 'girl' })?.vt).toBe(1600); // the source counts
    expect(findEvent(events, { event: 'ko', who: 'nobody' })).toBeNull();
    expect(findEvent(events, { event: 'damage', ordinal: 9 })).toBeNull();
    expect(findEvent(events, null)).toBeNull();
    expect(findEvent(undefined, { event: 'ko' })).toBeNull();
  });
});

describe('a visual beat (the contact of a blow, a pose change)', () => {
  // the first real card: the engine logs `damage` with `action-start`, in the frame after the key; the picture's contact is the target's shake starting later
  const frames = Array.from({ length: 200 }, (_, i) => ({
    actors: {
      tidus: { pose: i < 30 ? 'ready' : i < 70 ? 'attack' : 'idle', shL: 0 },
      seymour: { pose: i < 98 ? 'idle' : 'hurt', shL: i >= 98 && i < 140 ? 120 : i >= 160 && i < 170 ? 90 : 0 },
    },
  }));
  it('finds the frame a figure\'s hit shake starts, and the nth one', () => {
    expect(findBeatFrame(frames, { actor: 'seymour', kind: 'shake' })).toBe(98);
    expect(findBeatFrame(frames, { actor: 'seymour', kind: 'shake', ordinal: 2 })).toBe(160);
    expect(findBeatFrame(frames, { actor: 'seymour', kind: 'shake', ordinal: 3 })).toBe(-1);
  });
  it('finds a pose change, to a named pose when asked, and looks only from a frame on', () => {
    expect(findBeatFrame(frames, { actor: 'tidus', kind: 'pose' })).toBe(30);
    expect(findBeatFrame(frames, { actor: 'tidus', kind: 'pose', pose: 'idle' })).toBe(70);
    expect(findBeatFrame(frames, { actor: 'tidus', kind: 'pose' }, 31)).toBe(70);
    expect(findBeatFrame(frames, { actor: 'seymour', kind: 'pose', pose: 'hurt' })).toBe(98);
  });
  it('says -1 for a figure that is not there or a beat it does not make, and refuses a bad want', () => {
    expect(findBeatFrame(frames, { actor: 'nobody', kind: 'shake' })).toBe(-1);
    expect(findBeatFrame(frames, { actor: 'tidus', kind: 'shake' })).toBe(-1);
    expect(findBeatFrame(frames, { actor: 'tidus', kind: 'dance' as never })).toBe(-1);
    expect(findBeatFrame(frames, null)).toBe(-1);
  });
  it('is accepted in a spec as an alignment and as a strip anchor, and refused when it names no figure', () => {
    const base = { id: 'CP-98', chapter: 'seymour-flux', move: 'hit', variants: [{ id: 'V0' }, { id: 'V1' }] };
    expect(checkSpec({ ...base, align: { kind: 'beat', beat: { actor: 'seymour', kind: 'shake' } }, strip: { beat: { actor: 'seymour', kind: 'shake' }, offset: -2 } })).toEqual([]);
    expect(checkSpec({ ...base, align: { kind: 'beat', beat: { kind: 'shake' } } }).join(' ')).toMatch(/align/);
    expect(checkSpec({ ...base, align: { kind: 'sideways' } }).join(' ')).toMatch(/align/);
    expect(checkSpec({ ...base, strip: { beat: { actor: 'x', kind: 'wiggle' } } }).join(' ')).toMatch(/strip\.beat/);
  });
});

describe('is the presenter acting', () => {
  it('reads the phase when the build has one, else playing without a menu', () => {
    expect(isActing({ phase: 'play:action-start', playing: true, menu: false })).toBe(true);
    expect(isActing({ phase: 'play:turn-start', playing: true, menu: false })).toBe(true);
    expect(isActing({ phase: 'command:yuna', playing: true, menu: true })).toBe(false); // the booth build: playing stays true at a menu
    expect(isActing({ playing: true, menu: false })).toBe(true);
    expect(isActing({ playing: true, menu: true })).toBe(false);
    expect(isActing({ playing: false })).toBe(false);
    expect(isActing(null)).toBe(false);
  });
  it('the window of a moment ends a settle after the last ACTING frame, not after the last frame of a capture whose playing flag never fell', () => {
    const frames = Array.from({ length: 900 }, (_, i) => ({ vt: i * (1000 / 60), playing: true, menu: i < 40 || i >= 107, phase: i < 40 || i >= 107 ? 'command:tidus' : 'play:action-start' }));
    const w = windowOf(frames, [], { t0: 40 * (1000 / 60), leadMs: 500, settleMs: 1000, maxMs: 8000 })!;
    expect(w.truncated).toBe(false);
    expect(w.lengthMs).toBeLessThan(3500); // 0.5 s lead, ~1.1 s of action, 1 s settle: not the 8 s cap
  });
});

describe('a window around an event', () => {
  const frames = Array.from({ length: 600 }, (_, i) => ({ vt: i * (1000 / 60), playing: i > 60 && i < 400 }));
  const events = [ev('ko', 5000, { targetId: 'boss' })];
  it('runs from beforeMs before it to afterMs after, whatever the turns before it took', () => {
    const w = windowOf(frames, events, { t0: 1000, around: { event: 'ko', who: 'boss', beforeMs: 2000, afterMs: 1000 } })!;
    expect(w.startMs).toBe(3000);
    expect(w.endMs).toBe(6000);
    expect(w.around).toBe(true);
    expect(w.truncated).toBe(false);
    expect(frames[w.i0]!.vt).toBeGreaterThanOrEqual(3000);
    expect(frames[w.i1]!.vt).toBeLessThanOrEqual(6000);
  });
  it('falls back to the plain window when the event never happened', () => {
    const w = windowOf(frames, events, { t0: 1000, leadMs: 500, around: { event: 'ko', who: 'nobody' } })!;
    expect(w.around).toBeUndefined();
    expect(w.startMs).toBe(500);
  });
});

describe('the spec of a card', () => {
  const base = { id: 'CP-99', chapter: 'ffx2-bahamut', move: 'ko', variants: [{ id: 'V0' }, { id: 'V1' }] };
  it('accepts the new fields', () => {
    expect(checkSpec({ ...base, keys: ['Enter', { key: 'ArrowDown', afterMs: 300 }, 'Enter'], holdMenuMs: 5000, turns: 2, seconds: 40, until: { event: 'ko', who: 'bahamut', afterMs: 800 }, window: { event: 'ko', beforeMs: 2000 }, setup: [{ hp: { who: 'enemy', fraction: 0.04 } }, { hp: { who: 'yuna', set: 1 } }, { eval: 'window.__pyrefly.screen()' }], crop: { x: 0, y: 0, w: 640, h: 360 } })).toEqual([]);
  });
  it('refuses a malformed one, field by field', () => {
    const bad = (o: object) => checkSpec({ ...base, ...o }).join(' | ');
    expect(bad({ keys: [] })).toMatch(/keys/);
    expect(bad({ keys: [{ key: 'Enter', afterMs: -5 }] })).toMatch(/keys/);
    expect(bad({ keys: [7] })).toMatch(/keys/);
    expect(bad({ holdMenuMs: 99999 })).toMatch(/holdMenuMs/);
    expect(bad({ turns: 0 })).toMatch(/turns/);
    expect(bad({ turns: 2.5 })).toMatch(/turns/);
    expect(bad({ seconds: 500 })).toMatch(/seconds/);
    expect(bad({ until: { who: 'x' } })).toMatch(/until/);
    expect(bad({ window: {} })).toMatch(/window/);
    expect(bad({ setup: [{ hp: { who: 'enemy' } }] })).toMatch(/setup/);
    expect(bad({ setup: [{ hp: { who: 'enemy', fraction: 0 } }] })).toMatch(/setup/);
    expect(bad({ setup: [{ nothing: 1 }] })).toMatch(/setup/);
    expect(bad({ crop: { x: 0, y: 0, w: 0, h: 5 } })).toMatch(/crop/);
  });
});

// ---- a fake engine: the first command menu, the action it starts, the next menu ----
interface Fake {
  presses: Array<{ key: string; at: number }>;
  log: Array<Record<string, unknown>>;
  g: { press: (k: string) => Promise<void>; page: { evaluate: (expr: string) => Promise<unknown> } };
  stepper: { ms: number; tick: (read?: string) => Promise<unknown> };
  acc: { frames: any[]; events: any[]; logLen: number; rec: boolean };
}
/**
 * Every 2 key presses start an action: it plays 1000 ms, logs a 'damage' of the boss at +400 ms, and the menu is awaiting again after it; from the `koTurn`-th action on, a 'ko' follows the damage by 50 ms.
 * The game's clock is 60 Hz, 1000/60 ms a tick. `recordTick` reads the stepper as `tick('window.READ_')` and the log with `page.evaluate('window.NEWLOG_(n)')`: both are wired here.
 */
function fakeEngine({ koTurn = 99, stickyPlaying = false }: { koTurn?: number; stickyPlaying?: boolean } = {}): Fake {
  const presses: Array<{ key: string; at: number }> = [];
  const log: Array<Record<string, unknown>> = [];
  const state = { menu: true, playingUntil: -1, pendingKeys: 0, turn: 0, damageAt: -1, koAt: -1 };
  const stepper = {
    ms: 0,
    tick: async () => {
      stepper.ms += 1000 / 60;
      const now = stepper.ms;
      if (state.damageAt >= 0 && now >= state.damageAt) { log.push({ type: 'damage', targetId: 'boss', actorId: 'girl' }); state.damageAt = -1; }
      if (state.koAt >= 0 && now >= state.koAt) { log.push({ type: 'ko', targetId: 'boss', sourceId: 'girl' }); state.koAt = -1; }
      if (state.playingUntil >= 0 && now >= state.playingUntil) { state.playingUntil = -1; state.menu = true; }
      const acting = state.playingUntil >= 0;
      // the booth build: `playing` stays true while the next command menu is open; only the phase says whether an action runs
      return { screen: 'battle', menu: state.menu && !acting, playing: stickyPlaying ? true : acting, phase: stickyPlaying ? (acting ? 'play:action-start' : 'command:tidus') : null, nLog: log.length };
    },
  };
  const page = {
    evaluate: async (expr: string) => { const m = /NEWLOG_\((\d+)\)/.exec(String(expr)); return m ? log.slice(Number(m[1])) : null; },
  };
  const g = {
    page,
    press: async (k: string) => {
      presses.push({ key: k, at: stepper.ms });
      if (!state.menu) return;
      state.pendingKeys++;
      if (state.pendingKeys === 2) {
        state.pendingKeys = 0; state.menu = false; state.turn++;
        state.playingUntil = stepper.ms + 1000; state.damageAt = stepper.ms + 400;
        if (state.turn >= koTurn) state.koAt = stepper.ms + 450;
      }
    },
  };
  return { presses, log, g, stepper, acc: { frames: [], events: [], logLen: 0, rec: false } };
}

describe('playing a moment against a fake engine', () => {
  const build = (o: { koTurn?: number; stickyPlaying?: boolean } = {}): Fake => fakeEngine(o);

  const play = (f: Fake, extra: Record<string, unknown> = {}) => playOneAttack({ g: f.g as never, stepper: f.stepper as never, acc: f.acc, hz: 60, preRollMs: 100, tailMs: 100, seconds: 30, ...extra });

  it('by default presses the first command and the first target and ends at the next menu: the first version\'s moment', async () => {
    const f = build();
    const r = await play(f);
    expect(f.presses.map((p) => p.key)).toEqual(['Enter', 'Enter']);
    expect(r.ended).toBe('menu');
    expect(r.turns).toBe(1);
    expect(r.untilAt).toBeNull();
    expect(f.acc.events.some((e) => e.type === 'damage')).toBe(true);
  });

  it('ends the action at the next menu when `playing` stays true there and only the phase says it is over (the first real card)', async () => {
    const f = build({ stickyPlaying: true });
    const r = await play(f);
    expect(r.ended).toBe('menu'); // a first version waited for `playing` to fall and ran to its 14 s timeout in the real game
    expect(f.acc.frames[f.acc.frames.length - 1]!.vt - r.t0).toBeLessThan(2500);
    const f2 = build({ stickyPlaying: true });
    const r2 = await play(f2, { turns: 2 });
    expect(r2.turns).toBe(2);
    expect(r2.ended).toBe('menu');
  });

  it('leaves the first menu open for holdMenuMs before the first key', async () => {
    const a = build(), b = build();
    await play(a);
    await play(b, { holdMenuMs: 2000 });
    expect(b.presses[0]!.at - a.presses[0]!.at).toBeGreaterThan(1900);
    expect(b.presses[0]!.at - a.presses[0]!.at).toBeLessThan(2100);
  });

  it('presses the keys again at each next command menu for `turns` turns', async () => {
    const f = build();
    const r = await play(f, { turns: 3 });
    expect(f.presses.length).toBe(6);
    expect(r.turns).toBe(3);
    expect(r.ended).toBe('menu');
    expect(f.acc.events.filter((e) => e.type === 'damage').length).toBe(3);
    expect(r.t0).toBeLessThanOrEqual(r.confirmedAt); // the moment starts at the first turn's last key
  });

  it('waits afterMs after a key, and gapMs after the others except the last', async () => {
    const f = build();
    await play(f, { keys: [{ key: 'ArrowDown', afterMs: 700 }, 'Enter'], gapMs: 250 });
    // the first press starts the 2-key action only on the second press; the 700 ms wait sits between them
    expect(f.presses[1]!.at - f.presses[0]!.at).toBeGreaterThan(650);
    expect(f.presses[1]!.at - f.presses[0]!.at).toBeLessThan(760);
  });

  it('plays on, turn after turn, until the event and stops afterMs later', async () => {
    const f = build({ koTurn: 3 });
    const r = await play(f, { until: { event: 'ko', who: 'boss', afterMs: 500 }, keepAlive: false });
    expect(r.ended).toBe('event');
    expect(r.turns).toBe(3);
    expect(r.untilAt).not.toBeNull();
    const ko = f.acc.events.find((e) => e.type === 'ko');
    expect(ko?.vt).toBe(r.untilAt);
    const last = f.acc.frames[f.acc.frames.length - 1];
    expect(last.vt - r.untilAt!).toBeGreaterThanOrEqual(480);
    expect(last.vt - r.untilAt!).toBeLessThan(700); // not the whole tail: the clip is cut around the event
  });

  it('times out, saying so, when the event never comes', async () => {
    const f = build({ koTurn: 99 });
    const r = await play(f, { until: { event: 'ko', who: 'boss' }, seconds: 6, maxTurns: 3 });
    expect(r.ended).toBe('timeout');
    expect(r.turns).toBeLessThanOrEqual(3);
    expect(r.untilAt).toBeNull();
  });
});

describe('a card\'s setup', () => {
  it('sets hit points on the figures it names and hands back what it set', async () => {
    const combatants = [{ id: 'yuna', side: 'party', hp: 500, stats: { maxHp: 500 } }, { id: 'boss', side: 'enemy', hp: 9000, stats: { maxHp: 9000 } }, { id: 'add', side: 'enemy', hp: 100, stats: { maxHp: 100 } }];
    const page = { evaluate: async (fn: unknown, arg?: unknown) => { (globalThis as any).window = { __pyrefly: { battleState: () => ({ combatants }) } }; return typeof fn === 'function' ? (fn as (a: unknown) => unknown)(arg) : null; } };
    const done = await applySetup(page, [{ hp: { who: 'enemy', fraction: 0.04 } }, { hp: { who: 'yuna', set: 1 } }]);
    expect(done.length).toBe(2);
    expect(combatants.map((c) => c.hp)).toEqual([1, 360, 4]);
    expect(done[0]!.result).toEqual([{ id: 'boss', hp: 360 }, { id: 'add', hp: 4 }]);
    expect(await applySetup(page, undefined)).toEqual([]);
    delete (globalThis as any).window;
  });
});

describe('the example card specs stay filmable', () => {
  it('both pass the spec check, with figure ids that exist in their chapters', async () => {
    const fs = await import('node:fs');
    for (const [file, ids] of [['card-ch1-attack-pack.json', ['tidus', 'seymour-flux']], ['card-ch4-attack-pack.json', ['paine', 'bahamut']]] as const) {
      const spec = JSON.parse(fs.readFileSync(`tools/measure/examples/${file}`, 'utf8'));
      expect(checkSpec(spec), file).toEqual([]);
      for (const id of ids) expect(spec.focus, file).toContain(id);
      expect(spec.align.kind, file).toBe('beat'); // the contact of the blow, not the engine's log line
    }
  });
});
