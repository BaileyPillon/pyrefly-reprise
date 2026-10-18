/**
 * **The seams of the FFX counter chain** (re-parity RC9 lane FFX-G slice G-c; **FFX only**): what the generated boards of `parity-ffx-engine-counters.test.ts` do not reach.
 *
 * 1. A dry run (`intent.ts#cloneCtx`, the move advisor's and the enemy-intent preview's copy of the battle) starts with the counters a hit has queued and keeps its own
 *    hits' counters to itself, so a preview can never queue an answer into the battle's list.
 * 2. An ability the data marks `is-counter` (a boss's counter move) is a reaction wherever it is run: the attacker's reaction byte (`Chr+0xdf1`) is non-zero, so it
 *    meets no counter, even when the engine runs it outside the reaction phase.
 * 3. A holder that is down when the answers come swings at nobody: the death check normally removes its queued answer, and the loop of `engine-end.ts#afterAction`
 *    holds it back a second time for a holder that fell some other way.
 * 4. The reach of a command for a user the game has no slot for (a test rig's) is the plain command's, never Wakka's, Valefor's or Anima's gift.
 *
 * Mutants of the production code that these tests catch are listed in `docs/handoff/re-parity-rc9-ffx-counters.md`.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, AutoAbilityId, BattleEvent, FFXCombatant, StatusId } from '../../src/battle/common/types.ts';
import { resolveAbility } from '../../src/battle/ffx/index.ts';
import { afterAction } from '../../src/battle/ffx/engine-end.ts';
import { cloneCtx } from '../../src/battle/ffx/intent.ts';
import { takeCounters } from '../../src/battle/ffx/counter-chain.ts';
import { reachOf } from '../../src/battle/ffx/reach.ts';
import { type Board, type Member, contextOfBoard } from './helpers/ffxTargetBoard.ts';

const member = (id: string, side: 'party' | 'enemy', slot: number): Member => ({
  id, side, slot, hp: 5000, dead: false, petrified: false, sleep: false, confuse: false, berserk: false, threaten: false, provokedBy: null,
  reflect: false, guard: false, sentinel: false, guardMark: false, untargetable: false, keeps: false,
});
const room = (): Board => ({
  members: [member('tidus', 'party', 0), member('auron', 'party', 2), member('m0', 'enemy', 0x14), member('m1', 'enemy', 0x15)],
  bond: [0, 0, 0, 0, 0, 0, 0, 0],
});
/** A plain physical blow at one foe: no record of its own, so the engine derives the harmful test from the ability's flags. */
const blow = (flags: string[] = []): AbilityDef =>
  ({ id: 't-blow', name: 'blow', game: 'ffx', category: 'skill', mpCost: 0, rank: 3, power: 1, formula: 'fixed-no-variance', element: [], hits: 1, statusEffects: [], removesStatuses: [], canMiss: false, damageType: 'physical', targeting: 'single-enemy', flags }) as unknown as AbilityDef;
const wear = (c: FFXCombatant, autos: AutoAbilityId[]): void => {
  c.equipment = { weapon: { name: 'Sword', slots: 3, autoAbilities: [...autos] }, armor: { name: 'Armour', slots: 3, autoAbilities: [] } };
};
const status = (id: StatusId) => ({ id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false });

describe('a dry run of an action cannot queue an answer into the battle', () => {
  it('the copy starts with the counters already queued, as a list of its own, and its hits queue into that list only', () => {
    const { ctx, byId } = contextOfBoard(room(), 11);
    wear(byId.get('tidus') as FFXCombatant, ['counterattack']);
    resolveAbility(ctx, byId.get('m0') as FFXCombatant, blow(), ['tidus']);
    expect(ctx.rt.counters).toHaveLength(1);

    const { ctx: dry } = cloneCtx(ctx);
    expect(dry.rt.counters).toEqual(ctx.rt.counters);
    expect(dry.rt.counters).not.toBe(ctx.rt.counters);
    const attacker = dry.state.combatants['m1'] as FFXCombatant;
    resolveAbility(dry, attacker, blow(), ['tidus']);
    expect(dry.rt.counters).toHaveLength(2);
    expect(ctx.rt.counters).toHaveLength(1);
  });

  it('a dry run made while nothing is queued leaves the battle with nothing queued', () => {
    const { ctx, byId } = contextOfBoard(room(), 12);
    wear(byId.get('tidus') as FFXCombatant, ['counterattack']);
    expect(ctx.rt.counters).toBeUndefined();
    const { ctx: dry } = cloneCtx(ctx);
    resolveAbility(dry, dry.state.combatants['m0'] as FFXCombatant, blow(), ['tidus']);
    expect(dry.rt.counters).toHaveLength(1);
    expect(ctx.rt.counters).toBeUndefined();
  });
});

describe('an ability flagged is-counter is a reaction wherever it runs', () => {
  it('it meets no counter outside the reaction phase; the same blow without the flag does', () => {
    const run = (flags: string[]) => {
      const { ctx, byId } = contextOfBoard(room(), 13);
      wear(byId.get('tidus') as FFXCombatant, ['counterattack']);
      expect(ctx.rt.inReaction).not.toBe(true);
      resolveAbility(ctx, byId.get('m0') as FFXCombatant, blow(flags), ['tidus']);
      return takeCounters(ctx);
    };
    expect(run([])).toHaveLength(1);
    expect(run(['is-counter'])).toEqual([]);
  });
});

describe('a holder that is down when the answers come swings at nobody', () => {
  it('the loop of afterAction holds back a holder that fell without the death check removing its queued answer', () => {
    const { ctx, events, byId } = contextOfBoard(room(), 14);
    const holder = byId.get('tidus') as FFXCombatant;
    wear(holder, ['counterattack']);
    const attacker = byId.get('m0') as FFXCombatant;
    resolveAbility(ctx, attacker, blow(), ['tidus']);
    expect(ctx.rt.counters).toHaveLength(1);
    expect(ctx.rt.counters?.[0]?.lost).toBe(false);
    holder.hp = 0;
    holder.alive = false;
    holder.statuses['ko' as StatusId] = status('ko' as StatusId) as never;
    const start = events.length;
    afterAction({ ctx, push: (e) => ctx.emit(e), buffer: ctx.state.log as readonly BattleEvent[], nextGroupId: undefined }, attacker, events as never, { kind: 'attack', targets: ['tidus'] });
    expect(events.slice(start).filter((e) => e['type'] === 'counter' || (e['type'] === 'damage' && e['sourceId'] === 'tidus'))).toEqual([]);
  });
});

describe('the reach of a command for a user the game has no slot for', () => {
  const attackRecord = (id: number): AbilityDef => ({ id: 'rig', name: 'rig', category: 'skill', damageType: 'physical', record: { id } }) as unknown as AbilityDef;

  it('is the plain command\'s: Wakka\'s, Valefor\'s and Anima\'s gift (reach 3 for the Attack) goes to those three actor numbers and nobody else', () => {
    const attack = attackRecord(0x3000);
    expect(reachOf(attack, undefined)).toBe(0);
    expect(reachOf(attack, 0)).toBe(0);
    expect(reachOf(attack, 4)).toBe(3);
    expect(reachOf(attack, 8)).toBe(3);
    expect(reachOf(attack, 13)).toBe(3);
    expect(reachOf(attack, 5)).toBe(0);
  });

  it('an ability with no record of its own stands for the command it is: an item 2, a spell 3, a physical command the plain Attack (0)', () => {
    expect(reachOf({ category: 'item', damageType: 'none' } as unknown as AbilityDef, undefined)).toBe(2);
    expect(reachOf({ category: 'skill', damageType: 'magical' } as unknown as AbilityDef, undefined)).toBe(3);
    expect(reachOf({ category: 'skill', damageType: 'physical' } as unknown as AbilityDef, undefined)).toBe(0);
    expect(reachOf({ category: 'skill', damageType: 'physical' } as unknown as AbilityDef, 4)).toBe(3);
  });
});
