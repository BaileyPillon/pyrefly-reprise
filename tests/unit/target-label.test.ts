/**
 * `src/engine/tactics/targetLabel.ts` — the target-scope word the strategy
 * guide (`guide.ts`) and the move advisor (`advisor.ts`) both print.
 *
 * Root cause of the pre-deploy critic finding (2026-09-18): the guide's NEXT
 * line named whoever `command.targets[0]` happened to be, even when the
 * ability actually hit the whole party or every enemy — "Hastega -> Tidus"
 * on the same frame the advisor correctly said "Hastega -> the party". This
 * file pins the shared helper's answer for every `Targeting` kind and for
 * the four abilities/items the critic named, in both games.
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { scopeWord, targetLabel } from '../../src/engine/tactics/targetLabel.ts';

function ability(id: string): Command {
  return { kind: 'ability', id, targets: ['someone'] };
}

function item(id: string): Command {
  return { kind: 'item', id, targets: ['someone'] };
}

describe('scopeWord', () => {
  it('reads "the party" for all-allies, "all enemies" for all-enemies, "everyone" for all', () => {
    expect(scopeWord('all-allies')).toBe('the party');
    expect(scopeWord('all-enemies')).toBe('all enemies');
    expect(scopeWord('all')).toBe('everyone');
  });

  it('has no opinion on anything that still names one combatant', () => {
    for (const t of ['single-enemy', 'single-ally', 'single-any', 'self', 'random-enemy', 'random-ally'] as const) {
      expect(scopeWord(t), t).toBeNull();
    }
    expect(scopeWord(undefined)).toBeNull();
  });
});

describe('targetLabel — the four commands the critic caught', () => {
  it('FFX Hastega (all-allies) reads "the party", not the anchor target\'s name', () => {
    expect(targetLabel('ffx', ability('hastega'), 'Tidus')).toBe('the party');
  });

  it('FFX Stamina Tonic (item, all-allies) reads "the party"', () => {
    expect(targetLabel('ffx', item('stamina-tonic'), 'Tidus')).toBe('the party');
  });

  it('FFX-2 Shell (all-allies) reads "the party"', () => {
    expect(targetLabel('ffx2', ability('x2-white-mage-shell'), 'Yuna')).toBe('the party');
  });

  it('FFX-2 Pray (all-allies) reads "the party"', () => {
    expect(targetLabel('ffx2', ability('x2-white-mage-pray'), 'Yuna')).toBe('the party');
  });
});

describe('targetLabel — everything else still names the character', () => {
  it('a single-enemy FFX spell keeps the resolved target\'s name', () => {
    expect(targetLabel('ffx', ability('fire'), 'Seymour Flux')).toBe('Seymour Flux');
  });

  it('an all-enemies FFX mix reads "all enemies"', () => {
    expect(targetLabel('ffx', ability('mix-grenade'), 'Seymour Flux')).toBe('all enemies');
  });

  it('a single-enemy FFX-2 item keeps the resolved target\'s name', () => {
    expect(targetLabel('ffx2', item('x2-poison-fang'), 'Bahamut')).toBe('Bahamut');
  });

  it('an all-enemies FFX-2 item reads "all enemies"', () => {
    expect(targetLabel('ffx2', item('x2-grenade'), 'Bahamut')).toBe('all enemies');
  });

  it('self-targeting (FFX-2 Vigor) keeps the caller\'s own name, not a scope word', () => {
    expect(targetLabel('ffx2', ability('x2-white-mage-vigor'), 'Yuna')).toBe('Yuna');
  });

  it('a command kind with no ability/item id (Attack) falls back untouched', () => {
    const attack: Command = { kind: 'attack', targets: ['tidus'] };
    expect(targetLabel('ffx', attack, 'Sinspawn')).toBe('Sinspawn');
  });

  it('an unknown id resolves to nothing and falls back untouched', () => {
    expect(targetLabel('ffx', ability('not-a-real-ability'), 'Tidus')).toBe('Tidus');
  });

  it('a null fallback stays null when the command is not scoped', () => {
    expect(targetLabel('ffx', ability('fire'), null)).toBeNull();
  });
});
