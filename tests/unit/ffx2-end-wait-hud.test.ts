// @vitest-environment jsdom
/**
 * The FFX-2 end wait on the screen (r50-rc; **FFX-2 only**, FFX unchanged: it has no commit window, no ATB bar and no `endWindow` mark).
 *
 * Re-parity RC8's commit window (`src/battle/ffx2/end-window.ts`) stopped the engine from building the result on the last blow: the menus close and nothing new starts, but the spells already in
 * flight finish first, 1.5 to 4.5 seconds on average (3 on every Chapter XIII loss), and the result is built after them. The HUD kept doing what it did before, and so for that long the command
 * window stayed up (its owner can no longer take a turn: `inputValid` is false), with the advisor and the help line, and the party's ATB bars went on counting: a girl whose cast had just
 * fired filled to READY and shimmered, an idle girl's bar climbed toward a command nobody can give. This pins the repair:
 *
 * 1. **the engine marks the state** (`battle/ffx2/end-flag.ts`, a flag on `BattleState.flags`) on the step the window opens, keeps it once the end is committed, takes it off if the end lapses (a revive
 *    landed inside the window) and sets it again at the next end; a fight that is not ending never carries it; no event and no random number is added by it;
 * 2. **the last blow is the last blow again**: `fightDecidedBy` answers for a `ko` played under the mark, as it did for a `ko` under the result, and only for that (an ordinary KO, a message, an
 *    escape are as before);
 * 3. **the command window closes at the last blow**: a real `FFX2BattleHud` with a menu open takes it down on the `ko` and on the next `sync`, with the engine's real state; the control (the same KO with the
 *    fight going on) leaves it up;
 * 4. **the bars stop counting with nothing to do** (`ui/ffx2/endHold.ts`): a bar that is not charging is drawn as it stood and not ready, a bar that is charging keeps filling to the end of its cast, and when
 *    the end lapses every bar is live again; the rows the real HUD draws show it.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AtbSnapshot, BattleEvent, BattleState, Command, Decision } from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { enemy, group, setup } from '../../src/battle/ffx2/fixtures.ts';
import type { AiScript, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { registerAiScript } from '../../src/battle/ffx2/ai/index.ts';
import { applyHpDelta } from '../../src/battle/ffx2/resolve-hp.ts';
import { END_WINDOW_FLAG, fightEnding } from '../../src/battle/ffx2/end-flag.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';
import { EndHold } from '../../src/ui/ffx2/endHold.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { fightDecidedBy } from '../../src/ui/ffx2/fightDecided.ts';

const PD = 'x2-phoenix-down';

registerAiScript({ id: 'zz-end-wait-quiet', decide: () => null } as AiScript);

interface Battle {
  engine: FFX2Engine;
  units: Record<string, Ffx2Unit>;
  state: BattleState;
}

/** Three girls and the named monsters, a Phoenix Down in the bag (the engine's own end window tests build the same). */
function battle(foes: string[] = ['m0'], parts: string[] = []): Battle {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
  });
  const list = foes.map((id, i) => enemy(id, id.toUpperCase(), 'zz-end-wait-quiet', { agi: 30, hp: 9_999_999, maxHp: 9_999_999 }, { slot: i, immunityFlags: [], flags: {} }));
  const s = setup(group('zz-end-wait', list), { seed: 1 });
  engine.init({ ...s, party: { ...s.party, inventory: [{ itemId: PD, count: 1 }] } });
  const state = engine.state() as BattleState;
  const units = state.combatants as Record<string, Ffx2Unit>;
  for (const id of parts) (units[id] as Ffx2Unit).flags.isPart = true;
  return { engine, units, state };
}

const ctxOf = (b: Battle): Parameters<typeof applyHpDelta>[0] => (b.engine as unknown as { resolveCtx(): Parameters<typeof applyHpDelta>[0] }).resolveCtx();
const kill = (b: Battle, id: string, by?: string): void => applyHpDelta(ctxOf(b), b.units[id] as Ffx2Unit, (b.units[id] as Ffx2Unit).hp, by);

type Input = Extract<Decision, { kind: 'player-input' }>;
function nextMenu(engine: FFX2Engine): Input {
  for (let i = 0; i < 20_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'battle-over') throw new Error('the battle ended before a menu opened');
  }
  throw new Error('no menu opened');
}
function playOut(b: Battle): BattleEvent[] {
  const seen: BattleEvent[] = [];
  for (let i = 0; i < 5000; i++) {
    const d = b.engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'resolved') seen.push(...d.events);
    else if (d.kind === 'waiting') seen.push(...b.engine.tick(Math.max(1, d.nextEventMs)));
    else seen.push(...b.engine.submit({ kind: 'defend', targets: [] } as Command));
  }
  return seen;
}

/** The last enemy falls to a girl while Paine's Phoenix Down is on the purple bar: the window opens and waits for the cast. */
function endingWithACastInFlight(): Battle {
  const b = battle();
  kill(b, 'paine');
  const d = nextMenu(b.engine);
  b.engine.submit({ kind: 'item', id: PD, targets: ['paine'] });
  kill(b, 'm0', d.actorId);
  return b;
}

// ---------------------------------------------------------------------------------------------------------------------------------------
describe('1. the engine marks the state while the fight is ending', () => {
  it('is off for a fight that is not ending, on the step the window opens, and still on once the end is committed', () => {
    const b = battle();
    expect(fightEnding(b.state)).toBe(false);
    expect(END_WINDOW_FLAG in b.state.flags).toBe(false);
    const quiet = playOutSteps(b, 200);
    expect(quiet, 'a fight going on carries no mark').toBe(false);

    const c = endingWithACastInFlight();
    expect(c.engine.nextDecision().kind).toBe('waiting'); // the window opened: a cast is in flight
    expect(c.state.result).toBeNull();
    expect(fightEnding(c.state), 'the mark is on before the result exists').toBe(true);
    expect(c.state.flags[END_WINDOW_FLAG]).toBe(true);
    playOut(c);
    expect(c.state.result?.outcome).toBe('victory');
    expect(fightEnding(c.state), 'and stays on once the result is built').toBe(true);
  });

  it('the end with nothing in flight commits in the same call and carries the mark too', () => {
    const b = battle();
    kill(b, 'm0', 'yuna');
    expect(b.engine.nextDecision().kind).toBe('battle-over');
    expect(b.state.result?.outcome).toBe('victory');
    expect(fightEnding(b.state)).toBe(true);
  });

  it('comes off when the end lapses (a part\'s Phoenix Down raised the last enemy) and goes on again at the next end', () => {
    const b = battle(['a', 'p'], ['p']);
    const part = b.units['p'] as Ffx2Unit;
    const units = 30 * 95;
    part.atb.charging = { commandRef: { kind: 'ability', id: 'x2-item-phoenix-down', targets: ['a'] } as Command, remainingTicks: units, totalTicks: units };
    part.pendingCommand = part.atb.charging.commandRef;
    kill(b, 'a', 'yuna');
    expect(b.engine.nextDecision().kind).toBe('waiting');
    expect(fightEnding(b.state), 'the window is open').toBe(true);
    for (let i = 0; i < 400 && fightEnding(b.state); i++) {
      const d = b.engine.nextDecision();
      if (d.kind === 'waiting') b.engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'battle-over') break;
    }
    expect((b.units['a'] as Ffx2Unit).alive, 'the revive landed').toBe(true);
    expect(b.state.result).toBeNull();
    expect(fightEnding(b.state), 'the end lapsed: the fight goes on and the mark is off').toBe(false);
    expect(END_WINDOW_FLAG in b.state.flags).toBe(false);
    kill(b, 'a', 'yuna');
    expect(b.engine.nextDecision().kind).toBe('battle-over');
    expect(fightEnding(b.state), 'the next end sets it again').toBe(true);
  });

  it('adds no event and draws no random number: the log of an ending is the log it was (flags are not events)', () => {
    const b = endingWithACastInFlight();
    const events = playOut(b);
    const kinds = events.map((e) => e.type);
    expect(kinds.filter((t) => t === 'victory')).toHaveLength(1);
    expect(JSON.stringify(b.state.log)).not.toContain(END_WINDOW_FLAG);
  });
});

/** A fight going on: a few hundred steps with nothing killed; the mark never appears. */
function playOutSteps(b: Battle, steps: number): boolean {
  let marked = false;
  for (let i = 0; i < steps; i++) {
    const d = b.engine.nextDecision();
    if (d.kind === 'waiting') b.engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'player-input') b.engine.submit({ kind: 'defend', targets: [] } as Command);
    else if (d.kind === 'resolved' || d.kind === 'battle-over') break;
    marked ||= fightEnding(b.state);
  }
  return marked;
}

// ---------------------------------------------------------------------------------------------------------------------------------------
describe('2. a KO under the mark is the last blow again', () => {
  const live = makeFakeBattleState();
  const ko: BattleEvent = { seq: 1, type: 'ko', targetId: 'bahamut' };
  const marked = { ...live, flags: { ...live.flags, [END_WINDOW_FLAG]: true } } as BattleState;

  it('answers for a ko played under the mark, and for nothing else the result did not answer for', () => {
    expect(fightDecidedBy(ko, live)).toBe(false); // an ordinary KO
    expect(fightDecidedBy(ko, marked)).toBe(true); // the last blow, the window open
    expect(fightDecidedBy(ko, null)).toBe(false);
    expect(fightDecidedBy({ seq: 2, type: 'message', text: 'x', kind: 'ability' }, marked)).toBe(false);
    expect(fightDecidedBy({ seq: 2, type: 'damage', targetId: 'bahamut', amount: 5 } as BattleEvent, marked), 'only a KO is the last blow').toBe(false);
    expect(fightDecidedBy({ seq: 3, type: 'defeat', result: { outcome: 'escape' } } as unknown as BattleEvent, marked)).toBe(false); // over, not beaten
    expect(fightDecidedBy({ seq: 3, type: 'victory', result: { outcome: 'victory' } } as unknown as BattleEvent, live)).toBe(true);
  });

  it('a mark with the wrong value is no mark', () => {
    for (const v of [false, 0, 1, 'true', undefined]) {
      expect(fightEnding({ flags: { [END_WINDOW_FLAG]: v as never } }), String(v)).toBe(false);
    }
    expect(fightEnding(undefined)).toBe(false);
    expect(fightEnding({ flags: {} })).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
type Bar = AtbSnapshot['bars'][number];
const bar = (actorId: string, fill: number, charge: number | null, ready = false): Bar => ({ actorId, fill, required: 100, ready, charge, state: 'normal' });

describe('4. the bars stop counting with nothing to do (EndHold)', () => {
  const on = { flags: { [END_WINDOW_FLAG]: true } };
  const off = { flags: {} };

  it('a fight that is not ending: every bar is live', () => {
    const hold = new EndHold();
    const b = bar('rikku', 0.4, null, false);
    expect(hold.bar(off, 'rikku', b)).toBe(b);
    expect(hold.bar(undefined, 'rikku', b)).toBe(b);
    expect(hold.bar(off, 'rikku', null)).toBeNull();
  });

  it('while it ends, a bar that is not charging stays where it stood and is not ready; a charging bar is the spell\'s and keeps filling', () => {
    const hold = new EndHold();
    const first = hold.bar(on, 'rikku', bar('rikku', 0.2, null))!;
    expect(first).toMatchObject({ fill: 0.2, ready: false, charge: null });
    const later = hold.bar(on, 'rikku', bar('rikku', 1, null, true))!; // the clock ran on: filled, ready
    expect(later, 'held at what it was when the ending began').toMatchObject({ fill: 0.2, ready: false });
    const spell = bar('yuna', 0.5, 0.4);
    expect(hold.bar(on, 'yuna', spell)).toBe(spell);
    const spellLater = bar('yuna', 0.5, 0.9);
    expect(hold.bar(on, 'yuna', spellLater), 'the cast runs to its end').toBe(spellLater);
  });

  it('a cast that fires inside the ending leaves a bar that is then held where it stands, not ready', () => {
    const hold = new EndHold();
    expect(hold.bar(on, 'paine', bar('paine', 1, 0.8))).toMatchObject({ charge: 0.8 });
    const after = hold.bar(on, 'paine', bar('paine', 1, null, true))!; // the cast fired, the gauge is full and "ready"
    expect(after).toMatchObject({ fill: 1, ready: false, charge: null });
    expect(hold.bar(on, 'paine', bar('paine', 0.3, null))).toMatchObject({ fill: 1 }); // and counts no further
  });

  it('keeps one bar per girl, and gives every bar back when the end lapses', () => {
    const hold = new EndHold();
    hold.bar(on, 'rikku', bar('rikku', 0.2, null));
    hold.bar(on, 'paine', bar('paine', 0.6, null));
    expect(hold.bar(on, 'paine', bar('paine', 0.9, null))).toMatchObject({ fill: 0.6 });
    expect(hold.bar(on, 'rikku', bar('rikku', 0.5, null))).toMatchObject({ fill: 0.2 });
    const live = bar('rikku', 0.7, null);
    expect(hold.bar(off, 'rikku', live), 'the mark is gone: live again').toBe(live);
    expect(hold.bar(on, 'rikku', bar('rikku', 0.95, null))).toMatchObject({ fill: 0.95 }); // a later ending holds afresh
  });

  it('keeps the engine\'s other fields (haste, slow, stop colours; the runway) and changes nothing it was not asked to', () => {
    const hold = new EndHold();
    const hasted: Bar = { actorId: 'yuna', fill: 0.3, required: 62, ready: true, charge: null, state: 'haste' };
    expect(hold.bar(on, 'yuna', hasted)).toEqual({ ...hasted, ready: false });
    expect(hasted.ready, 'the live bar is not edited').toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------
describe('3 and 4, on the real HUD: the command window closes at the last blow and the bars stop', () => {
  let root: HTMLElement | null = null;
  afterEach(() => {
    root?.remove();
    root = null;
    vi.useRealTimers();
  });

  function mounted(state: BattleState, snapshot: AtbSnapshot): FFX2BattleHud {
    root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFX2BattleHud();
    hud.mount(root);
    hud.sync(state, snapshot);
    return hud;
  }
  const commandWindow = (): HTMLElement => root!.querySelector<HTMLElement>('.ffx2hud__command')!;
  const rows = (): HTMLElement[] => [...root!.querySelectorAll<HTMLElement>('.ig-stat')];
  const fillOf = (who: string): string | null => rows().find((r) => /rikku|paine|yuna/i.test(r.textContent ?? '') && new RegExp(who, 'i').test(r.textContent ?? ''))?.querySelector<HTMLElement>('.ffx2atb__fill')?.style.width ?? null;
  const readyOf = (who: string): boolean => !!rows().find((r) => new RegExp(who, 'i').test(r.textContent ?? ''))?.querySelector('.ffx2atb--ready');
  const chargeOf = (who: string): string | null => rows().find((r) => new RegExp(who, 'i').test(r.textContent ?? ''))?.querySelector<HTMLElement>('.ffx2atb__charge')?.style.width ?? null;

  it('closes the command window on the last blow\'s KO, the advisor and the help line with it; the same KO with the fight going on leaves it up (control)', async () => {
    vi.useFakeTimers();
    const b = battle();
    const d = nextMenu(b.engine);
    const empty: AtbSnapshot = { elapsedMs: 0, bars: [] };
    const hud = mounted(b.state, empty);
    void hud.chooseCommand(d.actorId, d.commands, () => empty);
    expect(commandWindow().hidden, 'a menu is open').toBe(false);

    void hud.onEvent({ seq: 1, type: 'ko', targetId: 'paine' }); // an ordinary KO, the fight goes on: the menu stays
    expect(commandWindow().hidden, 'control: an ordinary KO leaves the menu up').toBe(false);

    kill(b, 'm0', d.actorId); // the last blow: the engine opens its window on its next evaluation (nothing in flight here, so it commits at once; the mark is on either way)
    const ending = b.engine.nextDecision();
    expect(['waiting', 'battle-over']).toContain(ending.kind);
    expect(fightEnding(b.state)).toBe(true);
    void hud.onEvent({ seq: 2, type: 'ko', targetId: 'm0' });
    expect(commandWindow().hidden, 'the last blow takes the command window down').toBe(true);
    hud.unmount();
  });

  it('closes it with a window that is still open (a cast in flight, no result yet), and a sync after it keeps it closed', () => {
    vi.useFakeTimers();
    const b = battle();
    const d = nextMenu(b.engine);
    const empty: AtbSnapshot = { elapsedMs: 0, bars: [] };
    const hud = mounted(b.state, empty);
    void hud.chooseCommand(d.actorId, d.commands, () => empty);
    expect(commandWindow().hidden).toBe(false);
    // the state a presenter holds while the burst plays: the window open, the result not built
    const ending = endingWithACastInFlight();
    ending.engine.nextDecision();
    expect(ending.state.result).toBeNull();
    expect(fightEnding(ending.state)).toBe(true);
    hud.sync(ending.state, empty); // the next sync of the decision loop: the fight is ending on the engine's side
    expect(commandWindow().hidden, 'a sync under the mark is the end of the fight on screen').toBe(true);
    hud.unmount();
  });

  it('draws the idle bars frozen and not ready while the fight ends, the casting bar live, and every bar live again without the mark', () => {
    const b = battle();
    const girls = b.state.activeIds;
    expect(girls).toHaveLength(3);
    const [yuna, rikku, paine] = girls as [string, string, string];
    const one: AtbSnapshot = { elapsedMs: 100, bars: [bar(yuna, 0.5, 0.3), bar(rikku, 0.2, null), bar(paine, 0.7, null)] };
    const hud = mounted(b.state, one);
    expect([fillOf('rikku'), fillOf('paine'), chargeOf('yuna')], 'before the end: live').toEqual(['20%', '70%', '30%']);

    b.state.flags[END_WINDOW_FLAG] = true; // the engine's window opened
    hud.sync(b.state, one);
    const two: AtbSnapshot = { elapsedMs: 900, bars: [bar(yuna, 0.5, 0.9), bar(rikku, 1, null, true), bar(paine, 0.95, null, true)] };
    hud.syncGauges(two); // the clock ran on: Rikku and Paine would be full and READY
    expect(fillOf('rikku'), 'Rikku\'s bar stayed where it stood').toBe('20%');
    expect(fillOf('paine')).toBe('70%');
    expect(readyOf('rikku'), 'no READY shimmer for a turn that cannot come').toBe(false);
    expect(readyOf('paine')).toBe(false);
    expect(chargeOf('yuna'), 'the cast in flight runs to its end').toBe('90%');

    delete b.state.flags[END_WINDOW_FLAG]; // the end lapsed: the fight goes on
    hud.syncGauges(two);
    expect(fillOf('rikku')).toBe('100%');
    expect(readyOf('rikku')).toBe(true);
    hud.unmount();
  });
});
