/**
 * The FFX-2 item ledger in the engine (re-parity RC8, lane X2-F, row XF1; **FFX-2 only**): an item leaves the stock when the command is PICKED, the menus show the lower
 * count at once and a second girl cannot take the last one, a cast that never fires gives its item back (cap 99), a cast that fires keeps it spent, a monster never
 * touches the party's stock, and none of it draws a random number.
 *
 * The kernel is proved against the game's own function in `parity-ffx2-item-ledger.test.ts`; this file proves the ENGINE calls it where the note says
 * (FFX2-G06 sections 1 to 4: reserve at the pick, refund on every way out of the queue, the start gate as the only commit). Every expected count below is written
 * down from the note's rules, not computed by the code under test. The enemies say nothing (a quiet script), so the only thing that moves the stock is the test.
 */

import { describe, expect, it } from 'vitest';
import type { Command, Decision } from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  STEP_MS,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { enemy, group, setup } from '../../src/battle/ffx2/fixtures.ts';
import type { AiScript, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { registerAiScript } from '../../src/battle/ffx2/ai/index.ts';
import { applyHpDelta } from '../../src/battle/ffx2/resolve-hp.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import { cancelCast } from '../../src/battle/ffx2/atb-engine.ts';
import { itemAvailable, refundItem, releaseItemHolds, reserveItem, commitItem } from '../../src/battle/ffx2/adapt/item-ledger.ts';
import * as data from '../../src/data/ffx2/index.ts';

const PD = 'x2-phoenix-down';
const KEY = `inventory:${PD}`;

const quiet: AiScript = { id: 'zz-ledger-quiet', decide: () => null };
registerAiScript(quiet);

interface Battle {
  engine: FFX2Engine;
  units: Record<string, Ffx2Unit>;
  flags: Record<string, unknown>;
}

/** Three girls against one monster that does nothing; the party's stock is set by the test (`stock`: item id to count). */
function battle(stock: Record<string, number> = { [PD]: 1 }, seed = 1): Battle {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false,
  });
  const foe = enemy('m0', 'M0', 'zz-ledger-quiet', { agi: 30, hp: 9_999_999, maxHp: 9_999_999 }, { slot: 0, immunityFlags: [], flags: {} });
  const s = setup(group('zz-ledger', [foe]), { seed });
  engine.init({ ...s, party: { ...s.party, inventory: Object.entries(stock).map(([itemId, count]) => ({ itemId, count })) } });
  const state = engine.state();
  return { engine, units: state.combatants as Record<string, Ffx2Unit>, flags: state.flags as Record<string, unknown> };
}

type Input = Extract<Decision, { kind: 'player-input' }>;

/** Run the battle until a girl's menu opens. */
function nextMenu(engine: FFX2Engine, maxLoops = 20_000): Input {
  for (let i = 0; i < maxLoops; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'battle-over') throw new Error('the battle ended before a menu opened');
  }
  throw new Error('no menu opened');
}

const hasItemRow = (d: Input, id = PD): boolean => d.commands.some((c) => c.command.kind === 'item' && c.command.id === id);
const pdCommand = (target = 'paine'): Command => ({ kind: 'item', id: PD, targets: [target] });

/** Knock a girl out through the engine's own KO routine (the command in flight is dropped, Auto-Life is consumed). */
function ko(b: Battle, id: string): void {
  const ctx = (b.engine as unknown as { resolveCtx(): Parameters<typeof applyHpDelta>[0] }).resolveCtx();
  const u = b.units[id] as Ffx2Unit;
  applyHpDelta(ctx, u, u.hp);
}

/** A girl has picked the Phoenix Down for Paine (who is KO'd): the cast is in flight. */
function pickPd(b: Battle): Ffx2Unit {
  ko(b, 'paine');
  const d = nextMenu(b.engine);
  expect(d.actorId).not.toBe('paine');
  expect(hasItemRow(d), 'the Phoenix Down is offered').toBe(true);
  b.engine.submit(pdCommand());
  const girl = b.units[d.actorId] as Ffx2Unit;
  expect(girl.atb.charging, 'the item has a charge: its cast cost is 40').not.toBeNull();
  return girl;
}

describe('XF1: the item leaves the stock at the pick', () => {
  it('two girls and the last Phoenix Down: the first takes it, the second\'s menu no longer lists it, and a forced pick is refused with her turn unspent', () => {
    const b = battle({ [PD]: 1 });
    expect(b.flags[KEY]).toBe(1);
    const first = pickPd(b);
    // The note: the reserve takes the item the moment the command is queued, so the count the menus show is already lower (the old engine kept 1 until the cast resolved).
    expect(b.flags[KEY]).toBe(0);
    expect(first.itemHold).toEqual({ itemId: PD, got: 1, needed: 1 });
    const second = nextMenu(b.engine);
    expect(second.actorId).not.toBe(first.id);
    expect(hasItemRow(second), 'the second girl\'s menu has no Phoenix Down').toBe(false);
    // A pick that gets through anyway (a menu built before the first girl chose) finds no stock: the gate would fail with nothing to refund. The engine refuses it.
    const turnBefore = b.engine.state().turn;
    const events = b.engine.submit(pdCommand());
    expect(events).toEqual([]);
    expect(b.engine.state().turn).toBe(turnBefore);
    expect(b.flags[KEY]).toBe(0);
    expect(b.units[second.actorId]?.itemHold).toBeUndefined();
    expect(b.engine.nextDecision()).toMatchObject({ kind: 'player-input', actorId: second.actorId }); // the same menu comes back
    // She picks something else; the first girl's cast fires and Paine rises, and the stock stays at 0 (the commit keeps it spent).
    b.engine.submit({ kind: 'defend', targets: [] } as Command);
    for (let i = 0; i < 4000 && !(b.units['paine'] as Ffx2Unit).alive; i++) {
      const d = b.engine.nextDecision();
      if (d.kind === 'waiting') b.engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') b.engine.submit({ kind: 'defend', targets: [] } as Command);
    }
    expect((b.units['paine'] as Ffx2Unit).alive).toBe(true);
    expect(b.flags[KEY]).toBe(0);
    expect(first.itemHold).toBeUndefined();
  });

  it('a stock of two serves two picks and no third; a stock the battle does not track is used freely, as before the ledger', () => {
    const b = battle({ [PD]: 2 });
    pickPd(b);
    expect(b.flags[KEY]).toBe(1);
    expect(itemAvailable(b.flags, PD)).toBe(true);
    expect(itemAvailable(b.flags, 'x2-no-such-item')).toBe(true); // untracked
    const free = battle({});
    expect(free.flags[KEY]).toBeUndefined();
    const u = free.units['yuna'] as Ffx2Unit;
    expect(reserveItem(free.flags, u, PD)).toBe(true);
    expect(u.itemHold).toBeUndefined();
    expect(free.flags[KEY]).toBeUndefined();
  });

  it('a cast that fires keeps the item spent: the commit is the start gate, and nothing comes back', () => {
    const b = battle({ [PD]: 3 });
    const girl = pickPd(b);
    expect(b.flags[KEY]).toBe(2);
    for (let i = 0; i < 4000 && !(b.units['paine'] as Ffx2Unit).alive; i++) {
      const d = b.engine.nextDecision();
      if (d.kind === 'waiting') b.engine.tick(Math.max(1, d.nextEventMs));
      else if (d.kind === 'player-input') b.engine.submit({ kind: 'defend', targets: [] } as Command);
    }
    expect((b.units['paine'] as Ffx2Unit).alive).toBe(true);
    expect(girl.itemHold).toBeUndefined();
    expect(b.flags[KEY]).toBe(2); // 3 - 1 spent, once
    // Knocking the caster out afterwards refunds nothing: the record was past the gate.
    ko(b, girl.id);
    b.engine.tick(STEP_MS);
    expect(b.flags[KEY]).toBe(2);
  });
});

describe('XF1: every way out of the queue gives the item back', () => {
  /** The cast is in flight with the item reserved (stock 0 of 1); `cause` ends it; one logic step later the stock is back. */
  const gone = (cause: (b: Battle, girl: Ffx2Unit) => void): { stock: unknown; hold: unknown; charging: unknown } => {
    const b = battle({ [PD]: 1 });
    const girl = pickPd(b);
    expect(b.flags[KEY]).toBe(0);
    cause(b, girl);
    b.engine.tick(STEP_MS);
    return { stock: b.flags[KEY], hold: girl.itemHold, charging: girl.atb.charging };
  };

  const causes: Array<[string, (b: Battle, g: Ffx2Unit) => void]> = [
    ['a knock-out', (b, g) => ko(b, g.id)],
    ['Stop', (_b, g) => void applyStatus(g, { status: 'stop', chance: 255, duration: 20 })],
    ['Petrify', (_b, g) => void applyStatus(g, { status: 'petrify', chance: 255, duration: 0 })],
    ['ejection', (_b, g) => { g.removed = true; }],
    ['a magic cancel', (b, g) => cancelCast(g, Object.values(b.units))],
  ];

  it.each(causes)('%s: the item is back, the hold is gone', (_name, cause) => {
    const out = gone(cause);
    expect(out.stock).toBe(1);
    expect(out.hold).toBeUndefined();
    expect(out.charging).toBeNull();
  });

  it('the stack is capped at 99: a returned item is lost when the stack has filled again meanwhile', () => {
    const b = battle({ [PD]: 98 });
    const girl = pickPd(b);
    expect(b.flags[KEY]).toBe(97);
    b.flags[KEY] = 99; // a steal brought the stack back to full while the cast was charging
    ko(b, girl.id);
    b.engine.tick(STEP_MS);
    expect(b.flags[KEY]).toBe(99);
  });

  it('a refund into an emptied stack makes a stack of one; the sweep leaves a unit whose cast is still charging alone', () => {
    const b = battle({ [PD]: 1 });
    const girl = pickPd(b);
    releaseItemHolds(Object.values(b.units), b.flags); // the cast is in flight: nothing to give back
    expect(b.flags[KEY]).toBe(0);
    expect(girl.itemHold).toBeDefined();
    girl.atb.charging = null;
    releaseItemHolds(Object.values(b.units), b.flags);
    expect(b.flags[KEY]).toBe(1);
    refundItem(b.flags, girl); // a second refund of a released hold changes nothing
    expect(b.flags[KEY]).toBe(1);
  });
});

describe('XF1: the adapter\'s own rules', () => {
  it('a monster never reserves: its item command touches nothing and holds nothing', () => {
    const b = battle({ [PD]: 5 });
    const foe = b.units['m0'] as Ffx2Unit;
    expect(reserveItem(b.flags, foe, PD)).toBe(true);
    expect(b.flags[KEY]).toBe(5);
    expect(foe.itemHold).toBeUndefined();
  });

  it('the commit passes a whole reservation and keeps the item spent; a dead owner fails the gate and the removal refunds', () => {
    const b = battle({ [PD]: 2 });
    const girl = b.units['yuna'] as Ffx2Unit;
    expect(reserveItem(b.flags, girl, PD)).toBe(true);
    expect(b.flags[KEY]).toBe(1);
    expect(commitItem(b.flags, girl)).toBe(true);
    expect(b.flags[KEY]).toBe(1);
    expect(girl.itemHold).toBeUndefined();
    const rikku = b.units['rikku'] as Ffx2Unit;
    expect(reserveItem(b.flags, rikku, PD)).toBe(true);
    expect(b.flags[KEY]).toBe(0);
    rikku.alive = false;
    expect(commitItem(b.flags, rikku)).toBe(false); // "dead" fails the gate (G06 3.6), the removal refunds
    expect(b.flags[KEY]).toBe(1);
  });

  it('the ledger spends no random number: reserving, refunding and the sweep leave every stream where it was', () => {
    const b = battle({ [PD]: 3 });
    const streams = (b.engine as unknown as { rng: { states: ArrayLike<bigint | number> } }).rng.states;
    const before = Array.from(streams);
    const girl = b.units['yuna'] as Ffx2Unit;
    expect(reserveItem(b.flags, girl, PD)).toBe(true);
    refundItem(b.flags, girl);
    expect(reserveItem(b.flags, girl, PD)).toBe(true);
    commitItem(b.flags, girl);
    expect(Array.from(streams)).toEqual(before);
    expect(b.flags[KEY]).toBe(2);
  });
});
