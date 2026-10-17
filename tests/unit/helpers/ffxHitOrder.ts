/**
 * Boards and strikers for the FFX hit-order tests (re-parity RC10, lane FFX hit order; **FFX only**): Tidus against `n` monsters, and a physical striker of any reach and hit count.
 * Built on the generated-board helper of the targeting tests (`ffxTargetBoard.ts`).
 */

import type { AbilityDef } from '../../../src/battle/common/types.ts';
import type { Board, Member } from './ffxTargetBoard.ts';

export type Ev = Record<string, unknown>;

export function member(id: string, side: 'party' | 'enemy', slot: number, hp: number): Member {
  return {
    id, side, slot, hp, dead: false, petrified: false, sleep: false, confuse: false, berserk: false, threaten: false, provokedBy: null,
    reflect: false, guard: false, sentinel: false, guardMark: false, untargetable: false, keeps: false,
  };
}

/** Tidus against `n` monsters of the given HP (m0, m1 ... at slots 0x14, 0x15 ...). */
export function boardOf(enemyHp: readonly number[], extraParty: readonly string[] = []): Board {
  const party = ['tidus', ...extraParty];
  const members: Member[] = party.map((id) => member(id, 'party', ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'].indexOf(id), 9999));
  enemyHp.forEach((hp, i) => members.push(member(`m${i}`, 'enemy', 0x14 + i, hp)));
  return { members, bond: [0, 0, 0, 0, 0, 0, 0, 0] };
}

let nextRecord = 0x3a00;

/** A physical striker of the given reach and hit count; its record makes it harmful. `flags` may carry the drain flags. */
export function striker(opts: { id: string; hits: number; targeting: AbilityDef['targeting']; power?: number; flags?: string[]; formula?: string; element?: string[]; mp?: boolean }): AbilityDef {
  return {
    id: opts.id,
    name: opts.id,
    game: 'ffx',
    category: 'skill',
    mpCost: 0,
    rank: 3,
    power: opts.power ?? 1,
    formula: (opts.formula ?? 'fixed-no-variance') as never,
    damageType: 'physical',
    element: (opts.element ?? []) as never,
    targeting: opts.targeting,
    hits: opts.hits,
    statusEffects: [],
    removesStatuses: [],
    flags: (opts.flags ?? []) as never,
    canMiss: false,
    record: { id: nextRecord++, type: 0, flagsMisc: 0, flagsDamage: 1, damageClass: opts.mp ? 2 : 1 },
  } as unknown as AbilityDef;
}


