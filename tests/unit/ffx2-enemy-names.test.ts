/**
 * PR-0013 — FFX-2 names its own duplicate parts, so no FFX-2 formation needs
 * an automatic A/B letter. **Game case: FFX-2 only** [AGENTS.md rule 14]; FFX
 * keeps its own lettering (`src/battle/ffx/turnQueue.ts#letterTags`).
 *
 * Source: `research/ffx2-vegnagun-shuyin.md` §13.2 S3 [verified: 2 sources] —
 * Node A / Node B / Node C (bestiary #246-248), Right / Left Bulwark (#250-251),
 * Right / Left Redoubt (#253-254); docs/plans/questions-for-bailey-2026-09-23.md Q4.
 */

import { describe, expect, it } from 'vitest';
import * as data from '../../src/data/ffx2/index.ts';

function namesOf(groupId: string): Record<string, string> {
  const g = data.ENEMY_GROUPS_BY_ID[groupId]!;
  const out: Record<string, string> = {};
  for (const e of [...g.enemies, ...(g.parts ?? [])]) out[e.id] = e.name;
  return out;
}

describe('FFX-2 enemy names (PR-0013)', () => {
  it('no FFX-2 group carries two enemies with the same name', () => {
    for (const g of Object.values(data.ENEMY_GROUPS_BY_ID)) {
      const names = [...g.enemies, ...(g.parts ?? [])].map((e) => e.name);
      expect(new Set(names).size, `${g.id}: ${names.join(', ')}`).toBe(names.length);
    }
  });

  it('the Vegnagun parts carry the names the game gives them', () => {
    expect(namesOf('vegnagun-leg')).toMatchObject({ 'node-a': 'Node A', 'node-b': 'Node B', 'node-c': 'Node C' });
    expect(namesOf('vegnagun-body')).toMatchObject({ 'bulwark-r': 'Right Bulwark', 'bulwark-l': 'Left Bulwark' });
    expect(namesOf('vegnagun-head')).toMatchObject({ 'redoubt-r': 'Right Redoubt', 'redoubt-l': 'Left Redoubt' });
    for (const g of ['vegnagun-leg', 'vegnagun-body', 'vegnagun-head']) {
      for (const e of data.ENEMY_GROUPS_BY_ID[g]!.parts ?? []) {
        expect(e.forms.every((f) => f.name === e.name), e.id).toBe(true);
      }
    }
  });
});
