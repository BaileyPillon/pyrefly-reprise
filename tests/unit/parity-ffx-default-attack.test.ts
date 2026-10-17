/**
 * **The default attack of a combatant, `Chr+0x6c6`** (re-parity RC9 lane FFX-G slice G-c, row G11; **FFX only**).
 *
 * The character initialiser (VA 0x0079b4f0) writes the constant 0x3000 into the field for every party member and aeon (the non-monster branch, VA 0x0079b68d) and the
 * monster record's forced-action word (`R+0x70`, VA 0x0079ba19) for a monster; nothing else in the executable writes it. The Berserk, Confuse and Provoke turns queue
 * that command and a word of **0 queues nothing**, so a monster that has none loses the turn; the holder of a counter answers with it, and a record that names no command
 * runs nothing. `research/re-ffx-targeting.md` section 7; `kernel/forced-action-table.ts` carries the words; `adapt/target-world.ts#defaultAttackOf` reads them.
 */

import { describe, expect, it } from 'vitest';
import type { FFXCombatant, StatusId } from '../../src/battle/common/types.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx/index.ts';
import { forcedTurn } from '../../src/battle/ffx/forced-turn.ts';
import { resolveAbility } from '../../src/battle/ffx/index.ts';
import { takeCounters } from '../../src/battle/ffx/counter-chain.ts';
import { defaultAttackOf } from '../../src/battle/ffx/adapt/target-world.ts';
import { FORCED_ACTION_WORD } from '../../src/battle/ffx/kernel/forced-action-table.ts';
import { type Board, type Member, combatantOfMember, contextOfBoard } from './helpers/ffxTargetBoard.ts';

const member = (id: string, side: 'party' | 'enemy', slot: number, over: Partial<Member> = {}): Member => ({
  id, side, slot, hp: 5000, dead: false, petrified: false, sleep: false, confuse: false, berserk: false, threaten: false, provokedBy: null,
  reflect: false, guard: false, sentinel: false, guardMark: false, untargetable: false, keeps: false, ...over,
});
const status = (id: StatusId, over: object = {}) => ({ id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, ...over });

describe('the forced-action word table', () => {
  it('holds a word for every enemy of every shipped group except the five whose monster file is not matched yet', () => {
    const ids = new Set<string>();
    for (const g of Object.values(ENEMY_GROUPS_BY_ID)) for (const e of g.enemies) ids.add(e.id);
    const unmatched = [...ids].filter((id) => !FORCED_ACTION_WORD.has(id)).sort();
    // The four possessed aeons other than Valefor, and Isaaru's Pterya: no monster file matched in the private census yet (they keep the generic Attack).
    expect(unmatched).toEqual(['possessed-bahamut', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'pterya']);
    for (const id of FORCED_ACTION_WORD.keys()) expect(ids.has(id), `${id} is not a shipped enemy`).toBe(true);
  });

  it('every boss of the story chapters has no default attack; the Sinspawn Gui has the monster Attack 0x6000; Biran has Bulldoze, Yenke none', () => {
    const word = (id: string) => FORCED_ACTION_WORD.get(id);
    for (const id of ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-natus', 'seymour-omnis', 'evrae', 'isaaru', 'sin-core', 'overdrive-sin', 'yojimbo']) expect(word(id), id).toBe(0);
    expect([word('sinspawn-gui'), word('sinspawn-gui-2')]).toEqual([0x6000, 0x6000]);
    expect([word('biran-ronso'), word('yenke-ronso')]).toEqual([0x60a5, 0]);
  });

  it('defaultAttackOf: 0x3000 for a party member and an aeon, the table\'s word for a matched monster, 0x3000 for one that is not matched', () => {
    const board: Board = {
      members: [member('tidus', 'party', 0), member('valefor', 'party', 8), member('seymour-flux', 'enemy', 0x14), member('sinspawn-gui', 'enemy', 0x15), member('possessed-ifrit', 'enemy', 0x16)],
      bond: [0, 0, 0, 0, 0, 0, 0, 0],
    };
    const { byId } = contextOfBoard(board, 1);
    const at = (id: string) => defaultAttackOf(byId.get(id) as FFXCombatant);
    expect([at('tidus'), at('valefor'), at('seymour-flux'), at('sinspawn-gui'), at('possessed-ifrit')]).toEqual([0x3000, 0x3000, 0, 0x6000, 0x3000]);
    // an aeon on the field is a combatant of side 'aeon' in the real engine; only a monster reads the table
    const aeon = { ...(byId.get('valefor') as FFXCombatant), side: 'aeon' as const };
    expect(defaultAttackOf(aeon)).toBe(0x3000);
  });
});

describe('a monster with no default attack loses the turn Berserk, Confuse or Provoke would have forced', () => {
  const field = (): Board => ({
    members: [member('tidus', 'party', 0), member('auron', 'party', 2), member('seymour-flux', 'enemy', 0x14), member('biran-ronso', 'enemy', 0x15), member('m9', 'enemy', 0x16)],
    bond: [0, 0, 0, 0, 0, 0, 0, 0],
  });
  const run = (actor: string, state: 'berserk' | 'confuse' | 'provoke') => {
    const board = field();
    const { ctx, byId } = contextOfBoard(board, 5);
    const c = byId.get(actor) as FFXCombatant;
    if (state === 'provoke') c.statuses['provoke' as StatusId] = status('provoke' as StatusId, { sourceId: 'tidus' }) as never;
    else c.statuses[state as StatusId] = status(state as StatusId) as never;
    return forcedTurn(ctx, c);
  };

  it('a Berserk, Confused or Provoked boss with the word 0 does nothing (the turn is dropped)', () => {
    for (const state of ['berserk', 'confuse', 'provoke'] as const) expect(run('seymour-flux', state), state).toEqual({ kind: 'dropped' });
  });

  it('Biran, whose word is Bulldoze, swings: Berserk at the party, Provoke at the provoker; an enemy the table does not match still swings as before', () => {
    expect(run('biran-ronso', 'berserk')).toMatchObject({ kind: 'attack' });
    expect(run('biran-ronso', 'provoke')).toEqual({ kind: 'attack', targets: ['tidus'] });
    expect(run('m9', 'provoke')).toEqual({ kind: 'attack', targets: ['tidus'] });
  });
});

describe('a counter holder with no default attack answers nothing', () => {
  it('a party member answers with its Attack; a boss that wore the gear would have no command to run', () => {
    const wearing = (id: string, side: 'party' | 'enemy', slot: number) => {
      const board: Board = { members: [member('tidus', 'party', 0), member('m9', 'enemy', 0x14), member(id, side, slot)], bond: [0, 0, 0, 0, 0, 0, 0, 0] };
      const { ctx, byId } = contextOfBoard(board, 3);
      const holder = byId.get(id) as FFXCombatant;
      holder.equipment = { weapon: { name: 'Sword', slots: 3, autoAbilities: ['counterattack'] }, armor: { name: 'Armour', slots: 3, autoAbilities: [] } };
      void combatantOfMember;
      const attacker = byId.get(side === 'party' ? 'm9' : 'tidus') as FFXCombatant;
      const blow = { id: 't-blow', name: 'blow', game: 'ffx', category: 'skill', mpCost: 0, rank: 3, power: 1, formula: 'fixed-no-variance', element: [], hits: 1, statusEffects: [], removesStatuses: [], canMiss: false, damageType: 'physical', targeting: 'single-enemy', flags: [] };
      resolveAbility(ctx, attacker, blow as never, [id]);
      return takeCounters(ctx);
    };
    expect(wearing('auron', 'party', 2)).toHaveLength(1);
    expect(wearing('seymour-flux', 'enemy', 0x15)).toEqual([]); // the word 0
    expect(wearing('biran-ronso', 'enemy', 0x15)).toHaveLength(1); // Bulldoze
  });
});
