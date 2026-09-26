/**
 * PR-0213 (round 13): a capture's `asserted` must name the state the harness read
 * back, never "in battle" over a pause frame. `critic/runner/lib/route-index.mjs`
 * is the acceptance check over an evidence index; these are its cases, including
 * round 13's own two failures (23-midfight asserted "in battle" with the stale
 * roots reading pause). Both games: shared critic plumbing.
 */
import { describe, expect, it } from 'vitest';

import { indexMismatches, parseIndex } from '../../critic/runner/lib/route-index.mjs';

describe('the capture index check (PR-0213)', () => {
  it('flags round 13 midfight: "in battle" asserted over a pause frame', () => {
    const bad = indexMismatches([{ file: 'x/23-midfight.png', asserted: 'in battle', staleRoots: { screen: 'pause' } }]);
    expect(bad).toHaveLength(1);
    expect(bad[0]?.why).toMatch(/names no screen/);
  });

  it('flags an asserted screen that differs from the stale-root read', () => {
    expect(indexMismatches([{ file: 'a', asserted: 'screen=battle awaitingMenu=true', staleRoots: { screen: 'pause' } }])).toHaveLength(1);
  });

  it('passes a matching read and an honest UNVERIFIED capture', () => {
    expect(
      indexMismatches([
        { file: 'a', asserted: 'screen=battle awaitingMenu=true', staleRoots: { screen: 'battle' } },
        { file: 'b', asserted: 'UNVERIFIED (targeting wanted true got false) screen=battle targeting=false', verified: false, staleRoots: { screen: 'battle' } },
        { file: 'c', asserted: 'awaitingMenu=true' },
      ]),
    ).toEqual([]);
  });

  it('reads both the runner index.json and a round index.jsonl', () => {
    expect(parseIndex('[{"file":"a"}]')).toHaveLength(1);
    expect(parseIndex('{"file":"a"}\n{"file":"b"}\n')).toHaveLength(2);
    expect(parseIndex('')).toEqual([]);
  });
});
