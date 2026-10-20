/**
 * Release 59, decision 145 (Bailey, 2026-10-19, "i'll go with all of your recommendations"; his 2026-09-18 criticism of "advisor errors"): the card's top row IS the chapter's own line in the
 * FFX chapters whose card lost to it. **Game case: FFX only** (Chapter XIV, Isaaru via Purifico, and the Mirror Aeons chapter); FFX-2 Chapter XIII's is DIFF-B's (`advisor-line-first.test.ts`), and
 * every other chapter of either game keeps the card it has.
 *
 * The measurement behind it (`critic/bench/r59-advisor/sweep.ts`, 40 seeds a chapter, the card's first row pressed every turn against `intendedStrategy`; the table is in
 * `docs/handoff/r59-advisor-line.md`): Chapter XIV 13 of 40 against the line's 35, Mirror Aeons 3 of 40 against 24; no other chapter was clearly behind. As in DIFF-B's tests, the runs here are played
 * **with the card that did not follow the line** (`lineFirst: false`), so they visit the very boards where the two parted, and at every decision the shipped card's top row must equal the line's.
 */
import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { buildAdvisorView, clearAdvisorCache, sameCommand } from '../../src/engine/tactics/advisor.ts';
import { isAeonMenu } from '../../src/engine/tactics/advisor-aeons.ts';
import { LINE_FIRST_CHAPTERS, lineFirstOn } from '../../src/engine/tactics/advisor-line.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { chapterById, runChapter, type DecisionContext, type Driver } from '../../critic/bench/advisor-v3/drive.ts';

const FFX_LINE_FIRST = ['isaaru-via-purifico', 'mirror-aeons'] as const;
const label = (c: Command | null): string => (c ? `${c.kind}:${'id' in c ? String((c as { id?: unknown }).id ?? '') : ''}->${(c.targets as string[]).join('+')}` : 'null');
const topOf = (ctx: DecisionContext, lineFirst?: boolean): Command | null => {
  const options = lineFirst === undefined ? ctx.advisorOptions : { ...ctx.advisorOptions, lineFirst };
  return buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, options)?.suggestions[0]?.command ?? null;
};
const lineOf = (ctx: DecisionContext): Command | null => intendedStrategy(ctx.decision.actorId, ctx.decision.commands, ctx.engine as never);

/** Wins of a player who presses the card's top row (rule on, or off with `lineFirst: false`) over `seeds`. */
async function wins(id: string, seeds: number[], lineFirst?: boolean): Promise<number> {
  let n = 0;
  for (const seed of seeds) if ((await runChapter(chapterById(id), seed, (ctx) => topOf(ctx, lineFirst))).outcome === 'victory') n += 1;
  return n;
}

describe('release 59: which FFX chapters take the rule', () => {
  it('names the two FFX chapters that lost, beside DIFF-B\'s Chapter XIII, and no other', () => {
    expect([...LINE_FIRST_CHAPTERS].sort()).toEqual(['ffx2-trema', ...FFX_LINE_FIRST].sort());
  });
});

describe.each(FFX_LINE_FIRST)('release 59: %s, the card is the line', (id) => {
  it('is on for the chapter\'s board, off for one call that says so, and an explicit look-ahead pick (advisor v4) is left on top', async () => {
    let first: DecisionContext | null = null;
    await runChapter(chapterById(id), 1, (ctx) => {
      first ??= ctx;
      return null;
    }).catch(() => undefined);
    const ctx = first as DecisionContext | null;
    expect(ctx, 'the chapter opened no decision').not.toBeNull();
    expect(lineFirstOn(ctx!.state, ctx!.advisorOptions)).toBe(true);
    expect(lineFirstOn(ctx!.state, { ...ctx!.advisorOptions, lineFirst: false })).toBe(false);
    expect(lineFirstOn(ctx!.state, { ...ctx!.advisorOptions, lift: { kind: 'defend', targets: [] } as Command })).toBe(false);
  }, 120_000);

  it('seeds 1, 2 and 3, played with the card that did not follow the line: at every decision the shipped card\'s top row is the line\'s', async () => {
    clearAdvisorCache();
    let decisions = 0;
    let silent = 0;
    const parted: string[] = [];
    const wrong: string[] = [];
    const driver: Driver = (ctx) => {
      const before = topOf(ctx, false);
      const after = topOf(ctx);
      const line = lineOf(ctx);
      decisions += 1;
      // Yuna's own Yojimbo and the Magus Sisters print no card by design (`advisor-aeons.ts`: the payment screen does not exist yet), so there is no top row to compare; the player is handed the line there.
      if (after === null && isAeonMenu(ctx.decision.commands)) {
        silent += 1;
        return before ?? line;
      }
      if (!line || !after || !sameCommand(after, line)) wrong.push(`seed ${ctx.seed} link ${ctx.link} #${ctx.index} ${ctx.decision.actorId}: card ${label(after)}, line ${label(line)}`);
      if (before && line && !sameCommand(before, line)) parted.push(`seed ${ctx.seed} link ${ctx.link} #${ctx.index} ${ctx.decision.actorId}: ${label(before)} -> ${label(line)}`);
      return before ?? line;
    };
    for (const seed of [1, 2, 3]) await runChapter(chapterById(id), seed, driver);
    expect(decisions - silent).toBeGreaterThan(30);
    expect(wrong).toEqual([]);
    expect(parted.length, 'the old card never parted from the line on these seeds: the test no longer visits the boards the change is about').toBeGreaterThanOrEqual(1);
  }, 240_000);
});

describe('release 59: following the shipped card wins what the line wins', () => {
  it('Chapter XIV (Isaaru via Purifico), seeds 1 to 10: the card that did not follow the line won 3, the shipped card wins at least 8', async () => {
    clearAdvisorCache();
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(await wins('isaaru-via-purifico', seeds, false)).toBeLessThanOrEqual(5);
    expect(await wins('isaaru-via-purifico', seeds)).toBeGreaterThanOrEqual(8);
  }, 300_000);

  // Mirror Aeons is measured in `docs/handoff/r59-advisor-line.md` (40 seeds, about 25 s a run, too long for a unit test): the card alone 3 of 40 before and 9 after, with the line played where the card is
  // silent (Yojimbo's and the Sisters' menus) 14 before and 24 after, the line's own 24. The test above holds the part a unit test can: at every decision the card has, its top row is the line's.
});

describe('release 59: the other FFX chapters keep the card they have', () => {
  it.each(['seymour-flux', 'yunalesca', 'seymour-anima-macalania', 'seymour-natus'])('%s: every decision of two seeds gives the same card with the rule on and off', async (id) => {
    clearAdvisorCache();
    let decisions = 0;
    const differing: string[] = [];
    const driver: Driver = (ctx) => {
      const dec = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
      // The first card built on a battle's first menu can differ from the second on the same board (Chapter VII, Rikku, seed 1: Steal, then Petrify Grenade, with the rule on or off; the same at the commit
      // before this change, noted for the driver), so each side is built twice and the second card is compared.
      buildAdvisorView(ctx.state, dec, { ...ctx.advisorOptions, lineFirst: true });
      buildAdvisorView(ctx.state, dec, { ...ctx.advisorOptions, lineFirst: false });
      const on = buildAdvisorView(ctx.state, dec, { ...ctx.advisorOptions, lineFirst: true });
      const off = buildAdvisorView(ctx.state, dec, { ...ctx.advisorOptions, lineFirst: false });
      decisions += 1;
      if (JSON.stringify(on) !== JSON.stringify(off)) differing.push(`seed ${ctx.seed} link ${ctx.link} #${ctx.index}`);
      return off?.suggestions[0]?.command ?? null;
    };
    for (const seed of [1, 2]) await runChapter(chapterById(id), seed, driver);
    expect(decisions).toBeGreaterThan(10);
    expect(differing).toEqual([]);
  }, 240_000);
});
