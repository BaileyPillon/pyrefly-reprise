// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { ActionHelpBar, actionHelpName } from '../../src/ui/ffx/actionBanner.ts';
import type { AnyCombatant, BattleEvent, CombatantId } from '../../src/battle/common/types.ts';

/**
 * PR-0180: retail FFX names a non-attack enemy ability, centred, in the top
 * HELP bar for the span of the action, and names nothing for a plain attack
 * (`research/observed-ffx-steam-2026-09-26.md` §2.2, Spherimorph's Fire).
 * FFX only (rule 14); the party half is unsourced and not built.
 */

const COMBATANTS = {
  tidus: { id: 'tidus', name: 'Tidus', side: 'party' },
  'seymour-natus': { id: 'seymour-natus', name: 'Seymour Natus', side: 'enemy' },
} as unknown as Record<CombatantId, AnyCombatant>;

function start(actorId: string, name: string | undefined, kind: 'ability' | 'attack' = 'ability'): BattleEvent {
  return {
    seq: 1,
    type: 'action-start',
    actorId,
    command: kind === 'attack' ? { kind: 'attack', targets: ['tidus'] } : { kind: 'ability', id: 'x', targets: ['tidus'] },
    ...(name ? { abilityName: name } : {}),
    targets: ['tidus'],
  } as unknown as BattleEvent;
}

describe('actionHelpName', () => {
  it('names an enemy ability', () => {
    expect(actionHelpName(start('seymour-natus', 'Total Annihilation'), COMBATANTS)).toBe('Total Annihilation');
  });
  it('names nothing for a plain attack, a party action or a nameless action', () => {
    expect(actionHelpName(start('seymour-natus', 'Attack', 'attack'), COMBATANTS)).toBeNull();
    expect(actionHelpName(start('seymour-natus', 'Attack'), COMBATANTS)).toBeNull();
    expect(actionHelpName(start('tidus', 'Spiral Cut'), COMBATANTS)).toBeNull();
    expect(actionHelpName(start('seymour-natus', undefined), COMBATANTS)).toBeNull();
  });
});

describe('ActionHelpBar: shown for the span of the action', () => {
  it('shows on action-start and hides on action-end', () => {
    const bar = new ActionHelpBar();
    bar.onEvent(start('seymour-natus', 'Mortiphasm'), COMBATANTS);
    expect(bar.el.hidden).toBe(false);
    expect(bar.el.textContent).toBe('Mortiphasm');
    bar.onEvent({ seq: 2, type: 'action-end', actorId: 'seymour-natus' } as BattleEvent, COMBATANTS);
    expect(bar.el.hidden).toBe(true);
  });

  it('a plain attack clears a stale name', () => {
    const bar = new ActionHelpBar();
    bar.onEvent(start('seymour-natus', 'Mortiphasm'), COMBATANTS);
    bar.onEvent(start('seymour-natus', 'Attack', 'attack'), COMBATANTS);
    expect(bar.el.hidden).toBe(true);
  });

  it('a new turn clears it (an action cut off by the battle ending)', () => {
    const bar = new ActionHelpBar();
    bar.onEvent(start('seymour-natus', 'Mortiphasm'), COMBATANTS);
    bar.onEvent({ seq: 3, type: 'turn-start', actorId: 'tidus' } as unknown as BattleEvent, COMBATANTS);
    expect(bar.el.hidden).toBe(true);
  });
});
