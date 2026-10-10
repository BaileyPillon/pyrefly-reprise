/**
 * A battle that opens with a member under half HP (a chain's later link, no heal between links) used to throw
 * `FFXEngine: init(setup) has not been called`: `buildBattle` gives such a member the Critical status and announces it before the
 * engine holds its context. The engine now keeps what the build announces and logs it once the context exists (re-parity W5; FFX only).
 */

import { describe, expect, it } from 'vitest';
import { createFFXEngine } from '../../src/battle/ffx/index.ts';
import { member, party, setup, stats } from './ffx-fixtures.test.ts';

describe('opening a battle with a member under half HP', () => {
  it('does not throw, and the log carries the Critical status the build gave the member', () => {
    const hurt = member({ id: 'tidus', stats: stats({ maxHp: 2000, hp: 2000 }), hp: 700 });
    const engine = createFFXEngine({ autoResolveMinigames: true });
    engine.init(setup({ party: party({ members: [hurt, member({ id: 'yuna' }), member({ id: 'auron' })] }) }));
    const log = engine.state().log;
    expect(log.some((e) => e.type === 'status-add' && e.targetId === 'tidus' && e.status === 'critical')).toBe(true);
    // the events are in the stream the first decision hands out, in order, with their sequence numbers
    const seqs = log.map((e) => e.seq);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
    expect(new Set(seqs).size).toBe(seqs.length);
    engine.nextDecision();
  });
});
