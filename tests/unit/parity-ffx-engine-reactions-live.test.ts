/**
 * **The item reactions through the real hit pipeline** (re-parity RC4 lane F; **FFX only**). `parity-ffx-engine-reactions.test.ts` drives the
 * engine's reaction functions with generated facts; this file fires real abilities (the engine's own hit pipeline, the real item records)
 * and watches what the party does about it, so the wiring in `hit-apply.ts`, `hp.ts` and `engine-end.ts` is exercised end to end, and so is
 * the one thing the generated test cannot see: **an item reaction spends its item once** (the engine used to spend it twice).
 *
 * Source: `FFX-G02` sections 3.8, 3.9 and 3.12 (private note): a reaction is decided inside the hit (Auto-Med and Auto-Potion after the hit's
 * damage and the statuses it newly inflicted, Auto-Phoenix in the death check) and its item is paid when the record is queued.
 */

import { describe, expect, it } from 'vitest';
import { makeRng } from '../../src/battle/common/rng.ts';
import type { AbilityDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { resolveAbility } from '../../src/battle/ffx/abilities.ts';
import { runItemReactions } from '../../src/battle/ffx/engine-end.ts';
import { type Ctx } from '../../src/battle/ffx/state.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import { PARTY, type Member, type Situation, type Wear, contextOf, ITEM_NUMBER } from './helpers/ffxEngineReactions.ts';
import { ability } from './ffx-fixtures.test.ts';

const ZERO = (): number[] => new Array<number>(13).fill(0);

function member(id: (typeof PARTY)[number], over: Partial<Member> = {}): Member {
  return {
    id, slot: PARTY.indexOf(id), maxHp: 2000, hp: 2000, dead: false, bench: false, wears: [], autoLife: false,
    words: { perm: 0, counters: ZERO(), extra: 0 }, given: { poison: false, zombie: false, darkness: false, silence: false },
    ...over,
  };
}

/** A board of party members and one enemy, with the real abilities and items registered, and the given bag (by item id). */
function board(members: Member[], bag: Record<string, number>): { ctx: Ctx; byId: Map<string, FFXCombatant>; log: Array<Record<string, unknown>> } {
  const sit: Situation = { members, bag: {}, steps: [] };
  const { ctx, byId, events } = contextOf(sit, makeRng(7));
  ctx.content.addAbilities(ALL_ABILITIES.filter((a) => a.game === 'ffx'));
  ctx.content.addItems(Object.values(ITEMS).filter((i) => i.game === 'ffx'));
  for (const [id, n] of Object.entries(bag)) ctx.rt.inventory.set(id, n);
  const foe = byId.get('enemy-0') as FFXCombatant;
  foe.stats = { ...foe.stats, acc: 255 };
  return { ctx, byId, log: events };
}

const poison: AbilityDef = ability({ id: 'rig-poison', formula: 'none', damageType: 'other', targeting: 'single-enemy', statusEffects: [{ status: 'poison', chance: 254, duration: 254 }] });
const darken: AbilityDef = ability({ id: 'rig-darken', formula: 'none', damageType: 'other', targeting: 'single-enemy', statusEffects: [{ status: 'darkness', chance: 254, duration: 3 }] });
const wound = (power: number, hits = 1): AbilityDef =>
  ability({ id: 'rig-wound', formula: 'strength', power, damageType: 'physical', targeting: 'single-enemy', hits, canMiss: false, flags: [] });

/** What `def` deals to Auron on a fresh board (the same seed gives the same damage the first time round). */
function damageOf(def: AbilityDef): number {
  const b = board([member('auron'), member('tidus')], {});
  resolveAbility(b.ctx, b.byId.get('enemy-0') as FFXCombatant, def, ['auron']);
  const hit = b.log.find((e) => e['type'] === 'damage');
  return (hit?.['amount'] as number | undefined) ?? 0;
}

const fire = (b: ReturnType<typeof board>, def: AbilityDef, targets: string[]): void => {
  resolveAbility(b.ctx, b.byId.get('enemy-0') as FFXCombatant, def, targets);
  runItemReactions({ ctx: b.ctx, push: (e) => b.ctx.emit(e), buffer: [], nextGroupId: undefined });
};
const reactions = (b: ReturnType<typeof board>): Array<{ cause: string; item: string; user: string; target: string }> =>
  b.log.filter((e) => e['type'] === 'counter').map((e) => ({ cause: e['cause'] as string, item: e['abilityId'] as string, user: e['actorId'] as string, target: e['targetId'] as string }));
const bagOf = (b: ReturnType<typeof board>, id: string): number => b.ctx.rt.inventory.get(id) ?? 0;
const has = (c: FFXCombatant, status: string): boolean => c.statuses[status as 'poison'] !== undefined;
const wears = (...w: Wear[]): Wear[] => w;

describe('Auto-Med through a real status hit (FFX-G02 3.9)', () => {
  it('a Poison that lands is answered once with an Antidote, and the Antidote is spent once', () => {
    const b = board([member('auron', { wears: wears('med') }), member('tidus')], { antidote: 3, remedy: 2 });
    fire(b, poison, ['auron']);
    expect(reactions(b)).toEqual([{ cause: 'auto-med', item: 'antidote', user: 'auron', target: 'auron' }]);
    expect(bagOf(b, 'antidote')).toBe(2); // once, not twice
    expect(bagOf(b, 'remedy')).toBe(2);
    expect(has(b.byId.get('auron') as FFXCombatant, 'poison')).toBe(false); // the Antidote worked
  });
  it('a hit that only repeats a status the wearer already has is not answered', () => {
    const b = board([member('auron', { wears: wears('med') }), member('tidus')], { antidote: 0, remedy: 0 });
    fire(b, poison, ['auron']); // no cure in the bag: nothing to use, and the Poison stays
    expect(reactions(b)).toEqual([]);
    expect(has(b.byId.get('auron') as FFXCombatant, 'poison')).toBe(true);
    b.ctx.rt.inventory.set('antidote', 4);
    fire(b, wound(16), ['auron']); // still Poisoned, but this hit inflicted nothing new
    expect(reactions(b)).toEqual([]);
    expect(bagOf(b, 'antidote')).toBe(4);
  });
  it('two new statuses in one hit are answered with a Remedy, one Remedy', () => {
    const b = board([member('auron', { wears: wears('med') }), member('tidus')], { antidote: 3, 'eye-drops': 3, remedy: 2 });
    const both: AbilityDef = ability({
      id: 'rig-both', formula: 'none', damageType: 'other', targeting: 'single-enemy',
      statusEffects: [{ status: 'poison', chance: 254, duration: 254 }, { status: 'darkness', chance: 254, duration: 3 }],
    });
    fire(b, both, ['auron']);
    expect(reactions(b).map((r) => r.item)).toEqual(['remedy']);
    expect(bagOf(b, 'remedy')).toBe(1);
    expect(bagOf(b, 'antidote')).toBe(3);
    expect(bagOf(b, 'eye-drops')).toBe(3);
  });
  it('a character who cannot act (asleep) does not react, and nothing is spent', () => {
    const b = board([member('auron', { wears: wears('med') }), member('tidus')], { antidote: 3 });
    (b.byId.get('auron') as FFXCombatant).statuses['sleep'] = { id: 'sleep', turnsRemaining: 3, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    fire(b, darken, ['auron']);
    fire(b, poison, ['auron']);
    expect(reactions(b)).toEqual([]);
    expect(bagOf(b, 'antidote')).toBe(3);
  });
});

describe('Auto-Potion through a real wound (FFX-G02 3.9)', () => {
  it('a hit that takes the wearer to half or below is answered with one Potion, spent once', () => {
    const d = damageOf(wound(30));
    expect(d).toBeGreaterThan(100);
    // Auron stands a little above half, so this blow takes him to just below it (and well above 0)
    const b = board([member('auron', { wears: wears('potion'), hp: 1000 + Math.floor(d / 2) }), member('tidus')], { potion: 5, 'hi-potion': 2 });
    const c = b.byId.get('auron') as FFXCombatant;
    fire(b, wound(30), ['auron']);
    expect(b.log.some((e) => e['type'] === 'damage' && e['amount'] === d)).toBe(true);
    expect(c.hp).toBeGreaterThan(1000 - d); // the Potion was drunk after the blow
    const log = reactions(b);
    expect(log).toEqual([{ cause: 'auto-potion', item: 'potion', user: 'auron', target: 'auron' }]);
    expect(bagOf(b, 'potion')).toBe(4); // once, not twice
    expect(bagOf(b, 'hi-potion')).toBe(2);
  });
  it('a hit that leaves the wearer above half is not answered; a heal or a status-only hit never is', () => {
    const b = board([member('auron', { wears: wears('potion'), hp: 2000 }), member('tidus')], { potion: 5 });
    fire(b, wound(1), ['auron']);
    expect(reactions(b)).toEqual([]);
    const c = b.byId.get('auron') as FFXCombatant;
    c.hp = 400; // already far below half
    fire(b, darken, ['auron']); // no HP damage: no Potion
    expect(reactions(b)).toEqual([]);
    expect(bagOf(b, 'potion')).toBe(5);
  });
  it('a wearer killed by the blow loses the Potion it queued: spent, never used', () => {
    const b = board([member('auron', { wears: wears('potion'), hp: 30 }), member('tidus')], { potion: 5 });
    fire(b, wound(60), ['auron']);
    const c = b.byId.get('auron') as FFXCombatant;
    expect(c.alive).toBe(false);
    expect(reactions(b)).toEqual([]);
    expect(bagOf(b, 'potion')).toBe(4);
  });
  it('two heavy hits in one action queue one Potion, not two (one record per class per character)', () => {
    const b = board([member('auron', { wears: wears('potion'), hp: 1990, maxHp: 2000 }), member('tidus')], { potion: 5 });
    fire(b, wound(40, 3), ['auron']);
    expect(reactions(b).length).toBeLessThanOrEqual(1);
    expect(bagOf(b, 'potion')).toBeGreaterThanOrEqual(4);
  });
});

describe('Auto-Phoenix through a real death (FFX-G02 3.8)', () => {
  it('an ally killed by the blow is raised by the first able wearer with a Phoenix Down, spent once', () => {
    const b = board([member('tidus', { wears: wears('phoenix') }), member('yuna', { hp: 30 })], { 'phoenix-down': 3, 'mega-phoenix': 2 });
    fire(b, wound(60), ['yuna']);
    const yuna = b.byId.get('yuna') as FFXCombatant;
    expect(reactions(b)).toEqual([{ cause: 'auto-phoenix', item: 'phoenix-down', user: 'tidus', target: 'yuna' }]);
    expect(yuna.alive).toBe(true);
    expect(yuna.hp).toBeGreaterThan(0);
    expect(bagOf(b, 'phoenix-down')).toBe(2);
    expect(bagOf(b, 'mega-phoenix')).toBe(2); // never the Mega Phoenix
  });
  it('without a Phoenix Down nothing happens (a Mega Phoenix is not a fallback)', () => {
    const b = board([member('tidus', { wears: wears('phoenix') }), member('yuna', { hp: 30 })], { 'phoenix-down': 0, 'mega-phoenix': 2 });
    fire(b, wound(60), ['yuna']);
    expect(reactions(b)).toEqual([]);
    expect((b.byId.get('yuna') as FFXCombatant).alive).toBe(false);
    expect(bagOf(b, 'mega-phoenix')).toBe(2);
  });
  it('a victim with Auto-Life is raised by its own status and the Phoenix Down is not touched', () => {
    const b = board([member('tidus', { wears: wears('phoenix') }), member('yuna', { hp: 30, autoLife: true })], { 'phoenix-down': 3 });
    fire(b, wound(60), ['yuna']);
    expect(reactions(b)).toEqual([]);
    expect((b.byId.get('yuna') as FFXCombatant).alive).toBe(true);
    expect(bagOf(b, 'phoenix-down')).toBe(3);
  });
  it('the wearer who dies in the same blow cannot rescue (its queued record is cancelled; the Phoenix Down is lost)', () => {
    // the AoE-like case: Tidus (wearer) and Yuna both fall in one action; Yuna is checked first, Tidus (alive then) is queued to raise her, then Tidus dies
    const b = board([member('tidus', { wears: wears('phoenix'), hp: 30 }), member('yuna', { hp: 30 })], { 'phoenix-down': 3 });
    resolveAbility(b.ctx, b.byId.get('enemy-0') as FFXCombatant, wound(60), ['yuna']);
    resolveAbility(b.ctx, b.byId.get('enemy-0') as FFXCombatant, wound(60), ['tidus']);
    runItemReactions({ ctx: b.ctx, push: (e) => b.ctx.emit(e), buffer: [], nextGroupId: undefined });
    expect(reactions(b)).toEqual([]);
    expect((b.byId.get('yuna') as FFXCombatant).alive).toBe(false);
    expect(bagOf(b, 'phoenix-down')).toBe(2); // paid when queued, lost with the rescuer
  });
});

describe('the old double spend is gone', () => {
  it('every item reaction costs exactly one item', () => {
    const d = damageOf(wound(30));
    const b = board([member('auron', { wears: wears('med', 'potion'), hp: 1000 + Math.floor(d / 2) }), member('tidus', { wears: wears('phoenix') }), member('yuna', { hp: 30 })], {
      antidote: 6, potion: 6, 'phoenix-down': 6,
    });
    fire(b, poison, ['auron']);
    fire(b, wound(30), ['auron']);
    fire(b, wound(60), ['yuna']);
    const log = reactions(b);
    const used = (id: string): number => log.filter((r) => r.item === id).length;
    expect(used('antidote')).toBe(1);
    expect(used('potion')).toBe(1);
    expect(used('phoenix-down')).toBe(1);
    expect(bagOf(b, 'antidote')).toBe(6 - used('antidote'));
    expect(bagOf(b, 'potion')).toBe(6 - used('potion'));
    expect(bagOf(b, 'phoenix-down')).toBe(6 - used('phoenix-down'));
    expect(ITEM_NUMBER['potion']).toBe(0x2000);
  });
});
