/**
 * **A stacking buff at its ceiling cannot land** — the advisor's probability
 * band (`src/engine/tactics/advisor-roll.ts#statusChances`) must say so.
 *
 * Found on Evrae (Chapter 8, 2026-09-23): following the card's top row, Aim and
 * Cheer were recommended on targets already at five stacks 208 to 272 times a
 * fight, because the band priced every stacking buff at its 254 chance byte and
 * never asked whether the engine would take another level.
 *
 * **Both games**, each with its own ceiling [AGENTS.md rule 14]: FFX's
 * `statuses.ts#applyStatus` adds a level only below five (ffx-combat-core
 * §2.9), FFX-2's `statuses.ts#applyStatus` stops at `STAT_STACK_MAX` = 10
 * (ffx2-combat-core §2.8). The advice rule ("never recommend a turn that does
 * nothing") is shared plumbing; the numbers are each game's own.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, BattleState, Command } from '../../src/battle/common/types.ts';
import type { SimOutcome } from '../../src/battle/ffx/simulate.ts';
import { STAT_STACK_MAX } from '../../src/battle/ffx2/constants.ts';
import { inertAcrossBand, statusChances } from '../../src/engine/tactics/advisor-roll.ts';

function buff(status: string, stacks: number): AbilityDef {
  return {
    id: `${status}-buff`,
    name: status,
    targeting: 'single-ally',
    flags: [],
    statusEffects: [{ status, chance: 254, duration: 255, stacks }],
  } as unknown as AbilityDef;
}

function board(game: 'ffx' | 'ffx2', status: string, stacks: number): BattleState {
  const ally = {
    id: 'a',
    side: 'party',
    alive: true,
    level: 30,
    immunities: {},
    statusResist: {},
    statuses: stacks > 0 ? { [status]: { stacks } } : {},
  };
  return {
    game,
    activeIds: ['a'],
    enemyIds: [],
    aeonId: null,
    combatants: { a: ally },
    flags: {},
  } as unknown as BattleState;
}

/** What a preview reports for a buff the engine refused: nothing landed. */
function flatOutcome(def: AbilityDef): SimOutcome {
  return {
    rejected: false,
    ability: def,
    statusChanges: [],
    events: [{ type: 'action-start' }, { type: 'action-end' }],
    damageToEnemies: 0,
    healingToAllies: 0,
    harmToAllies: 0,
    hpDelta: {},
  } as unknown as SimOutcome;
}

const command = (id: string): Command => ({ kind: 'ability', id, targets: ['a'] }) as Command;

describe('the band knows each game\'s stack ceiling', () => {
  it('FFX: a sixth stack of Aim cannot land, so Aim on a capped ally is inert', () => {
    const def = buff('aim', 1);
    const state = board('ffx', 'aim', 5);
    const chances = statusChances(state, 'a', command(def.id), flatOutcome(def));
    expect(chances.map((c) => [c.status, c.percent, c.blocked])).toEqual([['aim', 0, true]]);
    expect(inertAcrossBand('a', command(def.id), flatOutcome(def), chances)).toBe(true);
  });

  it('FFX-2: a level past STAT_STACK_MAX cannot land either', () => {
    const def = buff('str-up', 1);
    const state = board('ffx2', 'str-up', STAT_STACK_MAX);
    const chances = statusChances(state, 'a', command(def.id), flatOutcome(def));
    expect(chances.every((c) => c.blocked && c.percent === 0)).toBe(true);
  });

  it('FFX-2: five levels is not a ceiling in X-2 (the FFX number does not leak across)', () => {
    const def = buff('str-up', 1);
    const state = board('ffx2', 'str-up', 5);
    const chances = statusChances(state, 'a', command(def.id), flatOutcome(def));
    expect(chances.some((c) => !c.blocked && c.percent > 0)).toBe(true);
  });
});
