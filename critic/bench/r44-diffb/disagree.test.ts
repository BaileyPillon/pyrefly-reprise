/**
 * How often does the advisor card's top row differ from the chapter's own line, in the card-following run at the house pace?
 * (The options page's diagnostic ("FFX-2 Difficulty Options"), copied unchanged except the env names and the output folder. The run itself is the card follower, the line is only read. With DIFF-B on (the default) the answer for Chapter XIII is 0 differences.)
 */
import { describe, expect, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { buildAdvisorView, sameCommand } from '../../../src/engine/tactics/advisor.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { chapterById, type DecisionContext, type Driver } from '../advisor-v3/drive.ts';
import { runChapterX, HOUSE } from './drivex.ts';
import type { Command } from '../../../src/battle/common/types.ts';

const CHAPTERS = (process.env['R44_DIS_CH'] ?? 'ffx2-trema').split(',');
const SEEDS = Number(process.env['R44_DIS_SEEDS'] ?? 100);
const OUT = process.env['R44_DIS_OUT'] ?? 'D:/Tools/pyrefly-scratch/r44-results/disagree.json';

describe('card vs line', () => {
  for (const id of CHAPTERS) {
    it(id, async () => {
      const ch = chapterById(id);
      let decisions = 0, differ = 0, lineNull = 0;
      const pairs: Record<string, number> = {};
      const byLink: Record<string, { n: number; d: number }> = {};
      const driver: Driver = (ctx: DecisionContext): Command | null => {
        const view = buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, ctx.advisorOptions);
        const card = view?.suggestions[0]?.command ?? null;
        let line: Command | null = null;
        try { line = intendedStrategy(ctx.decision.actorId, ctx.decision.commands, ctx.engine as never); } catch { line = null; }
        decisions += 1;
        const L = (byLink[String(ctx.link)] ??= { n: 0, d: 0 });
        L.n += 1;
        if (!line) lineNull += 1;
        else if (card && !sameCommand(card, line)) {
          differ += 1;
          L.d += 1;
          const k = `${(card as { kind: string }).kind}:${(card as { abilityId?: string; itemId?: string }).abilityId ?? (card as { itemId?: string }).itemId ?? ''} -> ${(line as { kind: string }).kind}:${(line as { abilityId?: string }).abilityId ?? (line as { itemId?: string }).itemId ?? ''}`;
          pairs[k] = (pairs[k] ?? 0) + 1;
        }
        return card;
      };
      let wins = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const r = await runChapterX(ch, seed, driver, HOUSE);
        if (r.outcome === 'victory') wins += 1;
      }
      const top = Object.entries(pairs).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const res = { chapter: id, seeds: SEEDS, wins, decisions, differ, lineNull, share: differ / decisions, byLink, top };
      console.log(JSON.stringify(res));
      writeFileSync(OUT.replace('.json', `-${id}.json`), JSON.stringify(res, null, 1));
      expect(decisions).toBeGreaterThan(0);
    }, 3_600_000);
  }
});
