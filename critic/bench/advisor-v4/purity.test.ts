/**
 * **The v4 search never touches the battle** (AGENTS.md rule 1): the same seed, the same presses
 * (v3's top row), with the search run in full at every decision and without it, ends on the same
 * event log, byte for byte, and the same random stream. Both games (FFX forks advance by turn,
 * FFX-2 forks run the clock), chains included (the search plays into later links on its forks).
 *
 * ```
 * node node_modules/vitest/vitest.mjs run --config critic/bench/advisor-v4/vitest.config.ts critic/bench/advisor-v4/purity.test.ts
 * ```
 */

import { describe, expect, it } from 'vitest';
import { buildAdvisorView } from '../../../src/engine/tactics/advisor.ts';
import { chapterById, runChapter, type DecisionContext } from '../advisor-v3/drive.ts';
import { searchDecision, type SearchConfig } from './search.ts';
import { chainOf, type Forkable } from './rollout.ts';

/** Small, so the check is quick; the full horizon, so every fork plays into later links. */
const CFG: SearchConfig = { samples: 2, horizon: 400, extra: 2, margin: 0.04, confirm: 2, confirmGap: 1 };

function card(ctx: DecisionContext) {
  return buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, ctx.advisorOptions);
}

describe('advisor v4 search purity', () => {
  for (const [id, seed] of [['isaaru-via-purifico', 1], ['seymour-flux', 2], ['ffx2-fallen-aeons', 1]] as const) {
    it(`${id} seed ${seed}: the search at every decision leaves the battle on the same log`, async () => {
      let searched = 0;
      const on = await runChapter(chapterById(id), seed, (ctx) => {
        const view = card(ctx);
        const s = searchDecision(ctx.engine as unknown as Forkable, ctx.state, ctx.decision, view, ctx.advisorOptions, CFG, chainOf(ctx));
        if (s.searched) searched += 1;
        return view?.suggestions[0]?.command ?? null;
      });
      const off = await runChapter(chapterById(id), seed, (ctx) => card(ctx)?.suggestions[0]?.command ?? null);
      expect(searched, 'the search actually ran').toBeGreaterThan(0);
      expect([on.outcome, on.decisions, on.linksCleared, on.finalLogLength, on.finalLogDigest]).toEqual([off.outcome, off.decisions, off.linksCleared, off.finalLogLength, off.finalLogDigest]);
    }, 1_800_000);
  }
});
