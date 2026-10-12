/**
 * **The seams of the RC4 merge** (re-parity RC4 assembly: lane L1 gear and auto-statuses, lane FFX-G targets, lane L3 item reactions and Overdrive
 * results; **FFX only**; `docs/handoff/re-parity-rc4.md`).
 *
 * The three lanes were built on the same base and merged without a textual conflict in most files; three places needed a decision, and each is a rule one
 * lane wrote against the other lanes' old code. Every test here fails if that seam is lost (the change that breaks each is listed with it).
 *
 * 1. **A dry run cannot move the Tidus counters** (lane FFX-G's `coverBond` is changed in place; the dry-run clone `intent.ts#cloneCtx` of lane L3's
 *    new runtime fields had to copy it too). Mutation: drop the `coverBond` line of `cloneCtx`.
 * 2. **An item reaction is an action of its own and ends in the per-action sweep** (lane L1's rule "the sweep runs again after every reaction"; lane
 *    L3 moved Auto-Potion, Auto-Med and Auto-Phoenix out of the loop that carried the sweep, into `engine-end.ts#runItemReactions`). Mutation: drop
 *    the `sweepAutoStatuses` call after `executeCommand` in `runItemReactions`.
 * 3. **A planned Overdrive is dealt by the target builder and trimmed afterwards** (lane L3's plan over lane FFX-G's builder, which now makes the picks):
 *    all sixteen picks of Lulu's Fury are made on stream 5 first, then the casts she was not given are removed on stream 16, and the hits that are left
 *    land on the enemies in character order. This seam is pinned by lane L3's own engine-level file, `parity-ffx-engine-overdrive-result.test.ts`
 *    (an oracle that reads streams 5 and 16 from its own generator), which passes on the merged tree and fails on both mutants tried here: the builder
 *    asked for the casts instead of the full menu count (4 tests fail), and the removal skipped (3 fail). Nothing is repeated in this file.
 */

import { describe, expect, it } from 'vitest';
import { makeRng } from '../../src/battle/common/rng.ts';
import type { AbilityDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { resolveAbility } from '../../src/battle/ffx/abilities.ts';
import { runItemReactions } from '../../src/battle/ffx/engine-end.ts';
import { cloneCtx } from '../../src/battle/ffx/intent.ts';
import { bondAdd } from '../../src/battle/ffx/kernel/cover.ts';
import { bondOf } from '../../src/battle/ffx/adapt/target-world.ts';
import type { Ctx } from '../../src/battle/ffx/state.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import { PARTY, type Member, type Situation, type Wear, contextOf } from './helpers/ffxEngineReactions.ts';
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
function board(members: Member[], bag: Record<string, number> = {}): { ctx: Ctx; byId: Map<string, FFXCombatant>; log: Array<Record<string, unknown>> } {
  const sit: Situation = { members, bag: {}, steps: [] };
  const { ctx, byId, events } = contextOf(sit, makeRng(7));
  ctx.content.addAbilities(ALL_ABILITIES.filter((a) => a.game === 'ffx'));
  ctx.content.addItems(Object.values(ITEMS).filter((i) => i.game === 'ffx'));
  for (const [id, n] of Object.entries(bag)) ctx.rt.inventory.set(id, n);
  const foe = byId.get('enemy-0') as FFXCombatant;
  foe.stats = { ...foe.stats, acc: 255 };
  return { ctx, byId, log: events };
}

describe('1. a dry run cannot move the Tidus counters', () => {
  it('the clone starts with the battle\'s counters and its own changes stay in the clone', () => {
    const b = board([member('tidus'), member('auron')]);
    bondAdd(bondOf(b.ctx), 1, 2);
    const { ctx: copy } = cloneCtx(b.ctx);
    expect(bondOf(copy)).toEqual(bondOf(b.ctx));
    bondAdd(bondOf(copy), 1, 3);
    expect(bondOf(copy)[1]).toBe(5);
    expect(bondOf(b.ctx)[1]).toBe(2);
  });
  it('a clone that makes the counters does not make them for the battle', () => {
    const b = board([member('tidus'), member('auron')]);
    expect(b.ctx.rt.coverBond).toBeUndefined();
    const { ctx: copy } = cloneCtx(b.ctx);
    bondAdd(bondOf(copy), 2, 1);
    expect(b.ctx.rt.coverBond).toBeUndefined();
  });
});

describe('2. an item reaction ends in the per-action sweep', () => {
  const wound = (power: number): AbilityDef =>
    ability({ id: 'rig-wound', formula: 'strength', power, damageType: 'physical', targeting: 'single-enemy', hits: 1, canMiss: false, flags: [] });

  it('Auron in an SOS Shell armour, struck far under half and given a Potion by Auto-Potion, has the Shell the moment the reaction is over', () => {
    const wears: Wear[] = ['potion'];
    // The blow's size on a fresh board, so the board with the real one can be set to leave him at a known HP.
    const probe = board([member('auron'), member('tidus')]);
    resolveAbility(probe.ctx, probe.byId.get('enemy-0') as FFXCombatant, wound(30), ['auron']);
    const dealt = (probe.log.find((e) => e['type'] === 'damage')?.['amount'] as number | undefined) ?? 0;
    expect(dealt).toBeGreaterThan(100);

    const b = board([member('auron', { wears, hp: 500 + dealt }), member('tidus')], { potion: 5 });
    const auron = b.byId.get('auron') as FFXCombatant;
    auron.equipment?.armor.autoAbilities.push('sos-shell');
    expect(auron.statuses['shell']).toBeUndefined();
    resolveAbility(b.ctx, b.byId.get('enemy-0') as FFXCombatant, wound(30), ['auron']);
    expect(auron.hp).toBe(500); // the blow alone: no sweep has run yet, the Shell is not on
    expect(auron.statuses['shell']).toBeUndefined();
    runItemReactions({ ctx: b.ctx, push: (e) => b.ctx.emit(e), buffer: [], nextGroupId: undefined });
    expect(b.log.some((e) => e['type'] === 'counter' && e['cause'] === 'auto-potion')).toBe(true);
    expect(auron.hp).toBeGreaterThan(500); // the Potion was drunk
    expect(auron.hp).toBeLessThan(1000); // and he is still under half
    expect(auron.statuses['shell']?.permanent).toBe(true); // the reaction's own sweep put the SOS Shell on
  });
});
