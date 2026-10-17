/**
 * **The 4-level reach rule** (re-parity RC9 lane FFX-G slice G-c, row G12; **FFX only**).
 *
 * A command can pick a foe when its reach (0 to 3, from its record) is at least the foe's BattleDistance (`pp_BtlRangeCheck` 0x00791fa0, the legal set 0x00799820,
 * the reach 0x00799690; `research/re-ffx-targeting.md` section 2). The engine used to carry two shapes of it: the Gui head's "reach 0 falls short" and the
 * Chapter XII `outOfMeleeReach` flag ("physical only from Wakka, Valefor, Anima, Mindy; anything else reaches"). Both are now this rule, with the distances the
 * project knows: the Gui head 1, the Mortiphasm discs 2, Sin's Genais Core 3 (0 once Genais falls).
 *
 * `kernel/legal-set.ts#commandReach` is proven against the game's own machine code in `parity-ffx-target-sets.test.ts` (every u16 value of the target word for 38
 * user ids). This file proves the DATA (the target word of every record the project ships, `kernel/command-reach-table.ts`) and the WIRING (`reach.ts#reachOf`,
 * `targeting.ts#reachesTarget`).
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { COMMAND_RECORDS } from '../../src/data/ffx/command-records/index.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { CORE_ABILITIES } from '../../src/battle/ffx/index.ts';
import { COMMAND_TARGET_WORD } from '../../src/battle/ffx/kernel/command-reach-table.ts';
import { commandReach } from '../../src/battle/ffx/kernel/legal-set.ts';
import { isReachZero, reachOf } from '../../src/battle/ffx/reach.ts';
import { reachesTarget, validTargets } from '../../src/battle/ffx/targeting.ts';
import { type Board, type Member, combatantOfMember, contextOfBoard } from './helpers/ffxTargetBoard.ts';
import { realCtx } from './helpers/seymourParity.ts';
import { gardenOfPainBuild } from '../../src/data/ffx/builds/garden-of-pain.ts';

const byId = new Map<string, AbilityDef>([...CORE_ABILITIES, ...ALL_ABILITIES].map((a) => [a.id, a]));
const def = (id: string): AbilityDef => {
  const d = byId.get(id);
  if (!d) throw new Error(`no ability ${id}`);
  return d;
};
/** An ability that is only a record id (the data under test is the table). */
const recordOnly = (id: number): AbilityDef => ({ id: `r${id.toString(16)}`, category: 'skill', damageType: 'physical', record: { id } }) as unknown as AbilityDef;

describe('the target word table (the game\'s command table, by record id)', () => {
  it('holds a row for every record the data layer attaches and for the four core abilities', () => {
    const wanted = new Set<number>();
    for (const r of Object.values(COMMAND_RECORDS)) wanted.add(r.id);
    for (const a of CORE_ABILITIES) if (a.record) wanted.add(a.record.id);
    for (const a of ALL_ABILITIES) if (a.record) wanted.add(a.record.id);
    const missing = [...wanted].filter((id) => !COMMAND_TARGET_WORD.has(id));
    expect(missing.map((id) => '0x' + id.toString(16))).toEqual([]);
  });

  it('the reach of the commands the note lists (section 5.2): the plain Attack and the melee skills 0, eight records 1, items and the reels 2, spells and Lancet 3', () => {
    const reach = (id: number, slot?: number) => reachOf(recordOnly(id), slot);
    // reach 0
    for (const id of [0x3000, 0x3010, 0x3011, 0x3012, 0x3013, 0x3014, 0x3015, 0x3016, 0x305a]) expect(reach(id, 0), '0x' + id.toString(16)).toBe(0);
    // reach 1: Spare Change, Fire Breath, Hellfire, Thor's Hammer, Diamond Dust, Mega Flare, Zanmato, Delta Attack
    for (const id of [0x3024, 0x3069, 0x30d1, 0x30d4, 0x30d7, 0x30da, 0x30e2, 0x30ea]) expect(reach(id, 0), '0x' + id.toString(16)).toBe(1);
    // reach 2: items, the reels, Seed Cannon
    for (const id of [0x2000, 0x2006, 0x3074, 0x3075, 0x3076, 0x3077, 0x306a]) expect(reach(id, 0), '0x' + id.toString(16)).toBe(2);
    // reach 3: Fire, Cure, Lancet, Doom, and the physical records of the 0x3000 table the note lists
    for (const id of [0x3041, 0x302b, 0x306f, 0x30cb, 0x30cc, 0x30d3, 0x30d6, 0x30d9, 0x30db, 0x30df, 0x30e0, 0x30e1, 0x30e8]) expect(reach(id, 0), '0x' + id.toString(16)).toBe(3);
  });

  it('the plain Attack has reach 3 for the actors 4, 8 and 13 (Wakka, Valefor, Anima) and for nobody else', () => {
    for (let slot = 0; slot < 32; slot++) expect(reachOf(recordOnly(0x3000), slot), `slot ${slot}`).toBe(slot === 4 || slot === 8 || slot === 13 ? 3 : 0);
    expect(reachOf(recordOnly(0x3000), undefined)).toBe(0);
    // a command without the 0x200 bit gets no such gift: Steal and Mug stay at reach 0 for Wakka
    expect(reachOf(recordOnly(0x3016), 4)).toBe(0);
  });

  it('the table agrees with the hand-written reach-0 set (reach.ts) on every party and aeon command that aims at somebody else', () => {
    // The set was written for the party's and the aeons' commands (ids 0x3000 on); a self-aimed command's reach never matters (the user is exempt), and a
    // monster command is never asked of the set. Everything else must agree, id for id.
    // Four commands are menu markers or airship orders (Grand Summon, the Fury and Mix menu rows, Pull back): not attacks, never aimed at a distant foe, absent from the set.
    const markers = new Set(['grand-summon', 'fury', 'mix', 'pull-back']);
    const disagree: string[] = [];
    let checked = 0;
    for (const a of [...CORE_ABILITIES, ...ALL_ABILITIES]) {
      if (a.category === 'item' || a.record === undefined || a.record.id < 0x3000 || a.record.id >= 0x4000) continue;
      const word = COMMAND_TARGET_WORD.get(a.record.id) ?? 0;
      if (((word >> 2) & 3) === 3 || markers.has(a.id)) continue;
      checked++;
      const zero = commandReach(0xff, { b1a: word & 0xff, b1b: word >> 8, misc: 0, b20: 0, hits: 0 }) === 0;
      if (zero !== isReachZero(a)) disagree.push(`${a.id} 0x${a.record.id.toString(16)}: table ${zero ? 'reach 0' : 'reach above 0'}, set ${isReachZero(a) ? 'reach 0' : 'reach above 0'}`);
    }
    expect(checked).toBeGreaterThan(150);
    expect(disagree).toEqual([]);
  });

  it('the table holds the whole command table: 979 rows, with the counts the note gives for reach (204 / 8 / 638 / 129)', () => {
    expect(COMMAND_TARGET_WORD.size).toBe(979);
    const count = [0, 0, 0, 0];
    for (const w of COMMAND_TARGET_WORD.values()) count[(w >> 7) & 3]! += 1;
    expect(count).toEqual([204, 8, 638, 129]);
  });

  it('an ability with no record stands for the command it is: an item reach 2, a spell 3, a physical command the plain Attack', () => {
    const noRecord = (over: Partial<AbilityDef>): AbilityDef => ({ id: 'x', category: 'skill', damageType: 'physical', ...over }) as unknown as AbilityDef;
    expect(reachOf(noRecord({ category: 'item' }), 0)).toBe(2);
    expect(reachOf(noRecord({ damageType: 'magical' }), 0)).toBe(3);
    expect(reachOf(noRecord({}), 0)).toBe(0);
    expect(reachOf(noRecord({}), 4)).toBe(3);
  });
});

// ------------------------------------------------------------------ the engine

function board(): Board {
  const mk = (id: string, side: 'party' | 'enemy', slot: number): Member => ({
    id, side, slot, hp: 5000, dead: false, petrified: false, sleep: false, confuse: false, berserk: false, threaten: false, provokedBy: null,
    reflect: false, guard: false, sentinel: false, guardMark: false, untargetable: false, keeps: false,
  });
  return {
    members: [mk('tidus', 'party', 0), mk('wakka', 'party', 4), mk('kimahri', 'party', 3), mk('lulu', 'party', 5), mk('valefor', 'party', 8), mk('anima', 'party', 13), mk('foe', 'enemy', 0x14)],
    bond: [0, 0, 0, 0, 0, 0, 0, 0],
  };
}

function reaches(distance: number, user: string, ability: AbilityDef): boolean {
  const b = board();
  const { ctx, byId: members } = contextOfBoard(b, 1);
  const foe = members.get('foe') as FFXCombatant;
  foe.flags = distance === 0 ? {} : { battleDistance: distance };
  const who = members.get(user) as FFXCombatant;
  // `valefor` and `anima` stand on the party side in this rig; the rule reads the actor number, which `actorNumber` gives by id
  void combatantOfMember;
  return validTargets(ctx, who, ability).includes('foe');
}

describe('a foe at BattleDistance d is reached by the commands whose reach is at least d', () => {
  const item = (): AbilityDef => ({ ...def('steal'), id: 'potion-like', category: 'item', record: { id: 0x2000, type: 0, flagsMisc: 0, flagsDamage: 1, damageClass: 1 } }) as AbilityDef;
  const table: Array<[string, string, AbilityDef, boolean[]]> = [
    // [label, user, ability, reached at distance 0, 1, 2, 3]
    ['Tidus\'s Attack (reach 0)', 'tidus', def('attack'), [true, false, false, false]],
    ['Steal (reach 0)', 'tidus', def('steal'), [true, false, false, false]],
    ['Wakka\'s Attack (reach 3 by the 0x200 bit)', 'wakka', def('attack'), [true, true, true, true]],
    ['Valefor\'s Attack (reach 3)', 'valefor', def('attack'), [true, true, true, true]],
    ['Anima\'s Attack (reach 3)', 'anima', def('attack'), [true, true, true, true]],
    ['Kimahri\'s Attack (reach 0: the bit is only for 4, 8, 13)', 'kimahri', def('attack'), [true, false, false, false]],
    ['Fire (reach 3)', 'lulu', def('fire'), [true, true, true, true]],
    ['Lancet (reach 3)', 'kimahri', def('lancet'), [true, true, true, true]],
    ['Spare Change (reach 1)', 'tidus', def('spare-change'), [true, true, false, false]],
    ['Hellfire (reach 1)', 'valefor', def('hellfire'), [true, true, false, false]],
    ['Seed Cannon (reach 2)', 'kimahri', def('seed-cannon'), [true, true, true, false]],
    ['an item (reach 2)', 'tidus', item(), [true, true, true, false]],
  ];
  for (const [label, user, ability, expected] of table) {
    it(label, () => {
      expect([0, 1, 2, 3].map((d) => reaches(d, user, ability))).toEqual(expected);
    });
  }

  it('a same-side target is always reachable (the scripts aim their own side without a range test)', () => {
    const b = board();
    b.members.push({ ...(b.members[6] as Member), id: 'foe2', slot: 0x15 });
    const { ctx, byId: members } = contextOfBoard(b, 1);
    const foe = members.get('foe') as FFXCombatant;
    const mate = members.get('foe2') as FFXCombatant;
    mate.flags = { battleDistance: 3 };
    expect(reachesTarget(ctx, foe, def('attack'), mate)).toBe(true); // an ally at distance 3, a reach-0 command
    expect(reachesTarget(ctx, members.get('tidus') as FFXCombatant, def('attack'), mate)).toBe(false); // the other side is held to the rule
  });
});

describe('the distances the project knows, in its chapters', () => {
  it('the four Mortiphasm discs of Chapter XII are at distance 2: magic, items and Wakka reach them, Steal, Tidus\'s Attack and the aeon Overdrives do not', () => {
    const { ctx } = realCtx('seymour-omnis', 1, gardenOfPainBuild);
    const discs = [1, 2, 3, 4].map((n) => ctx.state.combatants[`mortiphasm-${n}`] as FFXCombatant);
    for (const d of discs) expect(d.flags.battleDistance).toBe(2);
    const reached = (user: string, ability: AbilityDef): boolean => validTargets(ctx, ctx.state.combatants[user] as FFXCombatant, ability).includes('mortiphasm-1');
    expect(reached('tidus', def('fire'))).toBe(true);
    expect(reached('wakka', def('attack'))).toBe(true);
    expect(reached('tidus', def('attack'))).toBe(false);
    expect(reached('tidus', def('steal'))).toBe(false);
  });
});
