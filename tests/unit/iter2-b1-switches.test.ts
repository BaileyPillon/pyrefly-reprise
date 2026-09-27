/**
 * Iteration 2 batch B1: the FFX-2 sourced switches, built **OFF** for Bailey (plan §8 Q4) and
 * measured in `tests/unit/iter2-b1-bench.test.ts`. **FFX-2 only** (AGENTS.md rule 14): chains,
 * dresspheres and the Leblanc Syndicate exist only in FFX-2's battle system.
 *
 * - PR-0106: Leblanc's failsafe fires **once**, on her turn 25 + No Love Lost uses, and turn 5 of
 *   her loop is Fan Slap (`research/ffx2-leblanc-syndicate.md` §19.2 and §19.3: SinirothX, GameFAQs
 *   FAQ 31807, GameFAQs' reading, our estimate; it conflicts with the wiki's "Turn 5: Repeat Turn 1").
 * - IC-1 / PR-0209: an immune hit opens no chain (`research/ffx2-combat-core.md` §10.1).
 * - PR-0124: the dressphere carries across a chain seam, gates and the special unlock do not
 *   (`research/ffx2-combat-core.md` §10.2, KADFC FAQ 38278, our estimate).
 */

import { describe, expect, it } from 'vitest';
import { aiHarness, aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { IMMUNE_HITS_SKIP_CHAIN, LEBLANC_SCRIPT_SINIROTHX } from '../../src/battle/ffx2/constants.ts';

function leblancTurns(count: number, sinirothX: boolean, withHenchmen = true): Array<string | null> {
  const self = aiUnit('leblanc', 'enemy', 1380);
  self.level = 23;
  const others = withHenchmen ? [aiUnit('ormi', 'enemy', 1344, 1), aiUnit('logos', 'enemy', 989, 2)] : [aiUnit('ormi', 'enemy', 1344, 1)];
  const h = aiHarness(self, others, 'ffx2-leblanc');
  if (sinirothX) h.flags['leblancScriptSinirothX'] = true;
  return h.run(count);
}

const GUARD = 'x2-leblanc-not-so-mighty-guard';

describe('PR-0106: the Leblanc script switch (FFX-2, Chapter VI)', () => {
  it('ships OFF (Bailey decides with the measurement, plan §8 Q4)', () => {
    expect(LEBLANC_SCRIPT_SINIROTHX).toBe(false);
  });

  it('OFF keeps the AUTHORED reading exactly: guard on turn 5, and every turn past 25 + uses', () => {
    const picks = leblancTurns(40, false);
    expect(picks[4]).toBe(GUARD);
    expect(picks.slice(29, 34)).toEqual([GUARD, GUARD, GUARD, GUARD, GUARD]);
  });

  it('ON, SinirothX turn 5 is Fan Slap on a random girl (§19.3)', () => {
    const picks = leblancTurns(12, true);
    expect(picks[0]).toBe(GUARD);
    expect(picks[1]).toBe('x2-leblanc-fan-slap');
    expect(picks[4]).toBe('x2-leblanc-fan-slap');
    expect(picks[9]).toBe('x2-leblanc-fan-slap'); // turn 10 = step 5 of the second loop
  });

  it('ON, the failsafe guard fires once, on turn 25 + uses: 29 with both henchmen (§19.2)', () => {
    const picks = leblancTurns(60, true);
    const guards = picks.map((p, i) => (p === GUARD ? i + 1 : 0)).filter(Boolean);
    // Turn 1 (the loop's opener) and turn 29 (No Love Lost on 3, 11, 19, 27 = four uses): nothing else.
    expect(guards).toEqual([1, 29]);
    const nll = picks.map((p, i) => (p === 'x2-nll-1' ? i + 1 : 0)).filter(Boolean);
    expect(nll).toEqual([3, 11, 19, 27, 35, 43, 51, 59]);
  });

  it('ON, with a henchman down early the failsafe comes at 25 (no No Love Lost at all)', () => {
    const picks = leblancTurns(40, true, false);
    const guards = picks.map((p, i) => (p === GUARD ? i + 1 : 0)).filter(Boolean);
    expect(guards).toEqual([1, 25]);
  });
});

describe('IC-1: the immune-hit chain switch stays OFF (FFX-2)', () => {
  it('ships OFF; its reading is labelled GameFAQs (Split_Infinity G1032), our estimate', () => {
    expect(IMMUNE_HITS_SKIP_CHAIN).toBe(false);
  });
});
