/**
 * The Vegnagun chain is five battles linked by `nextGroupId` with no menu
 * between [ffx2-vegnagun-shuyin.md §2]: Tail -> Leg -> Body -> Head -> Shuyin.
 * Shuyin is the terminus and must not chain further.
 */

import { describe, expect, it } from 'vitest';

import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx2/index.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';

describe('Vegnagun -> Shuyin chain', () => {
  it('VEGNAGUN_CHAIN_ORDER walks tail -> leg -> body -> head -> shuyin', () => {
    expect(VEGNAGUN_CHAIN_ORDER).toEqual(['vegnagun-tail', 'vegnagun-leg', 'vegnagun-body', 'vegnagun-head', 'shuyin']);
  });

  it('every link in the chain points to the next, ending at shuyin', () => {
    for (let i = 0; i < VEGNAGUN_CHAIN_ORDER.length - 1; i++) {
      const group = ENEMY_GROUPS_BY_ID[VEGNAGUN_CHAIN_ORDER[i]!];
      expect(group, VEGNAGUN_CHAIN_ORDER[i]).toBeDefined();
      expect(group!.nextGroupId, `${VEGNAGUN_CHAIN_ORDER[i]}.nextGroupId`).toBe(VEGNAGUN_CHAIN_ORDER[i + 1]);
    }
  });

  it('shuyin is the terminus: no further nextGroupId', () => {
    const shuyin = ENEMY_GROUPS_BY_ID['shuyin'];
    expect(shuyin).toBeDefined();
    expect(shuyin!.nextGroupId).toBeUndefined();
  });

  it('bahamut is a standalone encounter, not part of the chain', () => {
    const bahamut = ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
    expect(bahamut).toBeDefined();
    expect(bahamut!.nextGroupId).toBeUndefined();
  });

  it('every Vegnagun/Shuyin group carries the Vegnagun boss-vegnagun or boss-shuyin music cue', () => {
    for (const id of VEGNAGUN_CHAIN_ORDER) {
      const group = ENEMY_GROUPS_BY_ID[id]!;
      const startCue = group.musicCues?.find((c) => c.at === 'start');
      expect(startCue, `${id} start music cue`).toBeDefined();
      expect(['boss-vegnagun', 'boss-shuyin']).toContain(startCue!.track);
    }
  });
});
