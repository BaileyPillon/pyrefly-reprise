/**
 * DIFF-B (PR-0227; Bailey, 2026-10-12, "I'll go with all of your recommendations"): on Chapter XIII's board the move advisor's
 * top row IS the chapter's own line. **Game case: FFX-2 only, Chapter XIII** (Paragon, then Trema); Chapters V and XV and every FFX
 * chapter keep the card they had, and these tests pin both halves.
 *
 * The measurement behind it (`critic/bench/r44-diffb/`, the options page's harness): the card-follower wins Chapter XIII 45.5 % of
 * 200 seeds at the house human pace, the player who presses the chapter's line 63.5 %; they agree on 97.5 % of the decisions, and
 * the rest are four rules of the card outranking the line (`src/engine/tactics/advisor-line.ts`). The tests below play real
 * Chapter XIII runs **with the card that did not follow the line** (`lineFirst: false`, so the run visits the very boards where
 * the two parted) and require, at every decision, that the shipped card's top row equals the line's pick.
 */
import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { buildAdvisorView, clearAdvisorCache, sameCommand } from '../../src/engine/tactics/advisor.ts';
import { ADVISOR_LINE_FIRST, lineFirstOn } from '../../src/engine/tactics/advisor-line.ts';
import { boardFor } from '../../src/engine/tactics/advisor-v3.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { chapterById, listedChapters, runChapter, type DecisionContext, type Driver } from '../../critic/bench/advisor-v3/drive.ts';
import { HOUSE, runChapterX } from '../../critic/bench/r44-diffb/drivex.ts';

const TREMA = 'ffx2-trema';
const label = (c: Command | null): string => (c ? `${c.kind}:${'id' in c ? String((c as { id?: unknown }).id ?? '') : ''}->${(c.targets as string[]).join('+')}` : 'null');
const topOf = (ctx: DecisionContext, lineFirst?: boolean): Command | null => {
  const options = lineFirst === undefined ? ctx.advisorOptions : { ...ctx.advisorOptions, lineFirst };
  return buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, options)?.suggestions[0]?.command ?? null;
};
const lineOf = (ctx: DecisionContext): Command | null => intendedStrategy(ctx.decision.actorId, ctx.decision.commands, ctx.engine as never);

/** A run that stops at its first decision and hands the whole context back. */
class FirstDecision extends Error {
  constructor(readonly ctx: DecisionContext) {
    super('first decision');
  }
}
async function firstContext(id: string): Promise<DecisionContext> {
  try {
    await runChapter(chapterById(id), 1, (ctx) => {
      throw new FirstDecision(ctx);
    });
  } catch (e) {
    if (e instanceof FirstDecision) return e.ctx;
    throw e;
  }
  throw new Error(`${id}: no decision opened`);
}

describe('DIFF-B: where the rule applies', () => {
  it('is on by default, and only Chapter XIII\'s board takes it: every other listed chapter, FFX or FFX-2, keeps its card', async () => {
    expect(ADVISOR_LINE_FIRST).toBe(true);
    const on: string[] = [];
    for (const chapter of listedChapters()) {
      const ctx = await firstContext(chapter.id);
      if (lineFirstOn(ctx.state, ctx.advisorOptions)) on.push(chapter.id);
    }
    expect(on).toEqual([TREMA]);
  }, 120_000);

  it('can be switched off for one call, and an explicit look-ahead pick (advisor v4) is left on top', async () => {
    const ctx = await firstContext(TREMA);
    expect(lineFirstOn(ctx.state, ctx.advisorOptions)).toBe(true);
    expect(lineFirstOn(ctx.state, { ...ctx.advisorOptions, lineFirst: false })).toBe(false);
    expect(lineFirstOn(ctx.state, { ...ctx.advisorOptions, lineFirst: true })).toBe(true);
    expect(lineFirstOn(ctx.state, { ...ctx.advisorOptions, lift: { kind: 'defend', targets: [] } as Command })).toBe(false);
  });
});

describe('DIFF-B: the card\'s pick equals the line\'s pick in the decisions that differed (Chapter XIII, house human pace)', () => {
  it('seeds 1, 2, 3 and 7, played with the card that did not follow the line: at every decision the shipped card is the line, and it parted from it on 6 or more (7 when written)', async () => {
    clearAdvisorCache();
    let decisions = 0;
    const parted: string[] = [];
    const wrong: string[] = [];
    const driver: Driver = (ctx) => {
      const before = topOf(ctx, false);
      const after = topOf(ctx);
      const line = lineOf(ctx);
      decisions += 1;
      if (!line || !after || !sameCommand(after, line)) wrong.push(`seed ${ctx.seed} link ${ctx.link} #${ctx.index} ${ctx.decision.actorId}: card ${label(after)}, line ${label(line)}`);
      if (before && line && !sameCommand(before, line)) parted.push(`seed ${ctx.seed} link ${ctx.link} #${ctx.index} ${ctx.decision.actorId}: ${label(before)} -> ${label(line)}`);
      return before;
    };
    for (const seed of [1, 2, 3, 7]) await runChapterX(chapterById(TREMA), seed, driver, HOUSE);
    expect(decisions).toBeGreaterThan(400);
    expect(wrong).toEqual([]);
    expect(parted.length, `the old card parted from the line on only ${parted.length} decision(s): ${parted.join('; ')}`).toBeGreaterThanOrEqual(6);
    // What the card used to put over the line was a heal or a drink, while the line swings or presses Darkness.
    expect(parted.some((p) => /item:x2-megalixir->[^ ]* -> (attack|ability):/.test(p) || /stash-mega-potion/.test(p))).toBe(true);
  }, 180_000);

  // Re-parity RC9 lane X2-A, slice 1 (FFX-2 only; reason "game-code parity", note FFX2-G01 section 7): the hit reaction moved every replay of Chapter XIII, and seed 7 no longer reaches a board
  // whose projected line differs from the live one. The board was searched again over the seeds in order (1 to 30): seeds 1, 2, 3, 8, 12, 19, 24 and 27 reach one (1, 1, 3, 1, 3, 6, 6 and 4 boards, the card
  // following the live board on every one); the first, seed 1, was used. With `CHAIN_WINDOW_PER_BODY` off seed 7 reaches it as before.
  // Re-pinned for the per-command action time (r56, 2026-10-19, FFX-2 only; it is ON, so these are the production fights): the same scan over seeds 1 to 30 finds boards on 19 seeds, 3 on seed 2 (seed 1 has none now, 4 on seed 3), the card following
  // the live board on every one, so seed 2 is used. The wrong-card count is 0 on all 30 seeds.
  it('the line is read off the live board, not the projected one: where the two differ the card follows the live board', async () => {
    clearAdvisorCache();
    let projectedParted = 0;
    const wrong: string[] = [];
    const driver: Driver = (ctx) => {
      const dec = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
      const live = recommendedCommand(ctx.state, dec);
      const projected = recommendedCommand(boardFor(ctx.state, ctx.decision.actorId, ctx.advisorOptions as never).state, dec);
      if (live && projected && !sameCommand(live, projected)) {
        projectedParted += 1;
        const after = topOf(ctx);
        if (!after || !sameCommand(after, live)) wrong.push(`seed ${ctx.seed} link ${ctx.link} #${ctx.index}: card ${label(after)}, live line ${label(live)}, projected line ${label(projected)}`);
      }
      return topOf(ctx, false);
    };
    await runChapterX(chapterById(TREMA), 2, driver, HOUSE);
    expect(wrong).toEqual([]);
    expect(projectedParted, 'seed 2 no longer reaches a board whose projected line differs from the live one: re-pin the seed').toBeGreaterThanOrEqual(1);
  }, 120_000);

  it('a line this actor cannot press stays off the card (the hard gate is untouched): with the aimed row\'s targets emptied the card does not print it', async () => {
    clearAdvisorCache();
    let checked = 0;
    const driver: Driver = (ctx) => {
      const line = lineOf(ctx);
      if (line && line.kind === 'attack' && line.targets.length > 0) {
        const crippled = ctx.decision.commands.map((c) => (c.command.kind === 'attack' ? { ...c, validTargets: [] } : c));
        const view = buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: crippled }, ctx.advisorOptions);
        const top = view?.suggestions[0]?.command ?? null;
        expect(top === null || !sameCommand(top, line), `the card printed ${label(top)}, a row this actor cannot aim`).toBe(true);
        checked += 1;
      }
      return topOf(ctx);
    };
    await runChapterX(chapterById(TREMA), 1, driver, HOUSE);
    expect(checked).toBeGreaterThan(0);
  }, 120_000);
});

describe('DIFF-B: Chapters V and XV are untouched (FFX-2 only, Chapter XIII only)', () => {
  it.each(['ffx2-vegnagun-shuyin', 'ffx2-den-of-woe'])('%s: every decision of three seeds gives the same card with the rule on and off', async (id) => {
    clearAdvisorCache();
    let decisions = 0;
    const differing: string[] = [];
    const driver: Driver = (ctx) => {
      const dec = { actorId: ctx.decision.actorId, commands: ctx.decision.commands };
      const on = buildAdvisorView(ctx.state, dec, { ...ctx.advisorOptions, lineFirst: true });
      const off = buildAdvisorView(ctx.state, dec, { ...ctx.advisorOptions, lineFirst: false });
      decisions += 1;
      if (JSON.stringify(on) !== JSON.stringify(off)) differing.push(`seed ${ctx.seed} link ${ctx.link} #${ctx.index}`);
      return off?.suggestions[0]?.command ?? null;
    };
    for (const seed of [1, 2, 3]) await runChapterX(chapterById(id), seed, driver, HOUSE);
    expect(decisions).toBeGreaterThan(50);
    expect(differing).toEqual([]);
  }, 180_000);
});
