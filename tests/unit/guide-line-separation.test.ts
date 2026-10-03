/**
 * "The guide and next move advisor are completely separate entities" (Bailey, 2026-10-03).
 *
 * Until that day the strategy guide's NEXT card ran the chapter's shipped tactic read-only
 * (`intendedStrategy`), which is also what the move advisor ranks and borrows its words from, so the two
 * panels could only ever agree. The guide now reads a line of its own (`src/data/guides/lines/`,
 * `src/engine/tactics/guide-line.ts`). This file pins both halves of the cut:
 *
 *  - **The guide does not touch the tactics.** Structurally (what its modules import) and in behaviour
 *    (its NEXT is not the tactic's pick, on a board where the two differ).
 *  - **The advisor does not touch the guide's line.** Structurally (no advisor module imports it) and in
 *    behaviour (`buildGuideView` and `recommendedCommand`, the two things the advisor reads, still mirror
 *    `intendedStrategy` decision for decision).
 *
 * The advisor's own outputs are compared before and after in the release notes
 * (`docs/handoff/r38-guide-jegged.md`): byte-identical digests over every chapter's decisions.
 *
 * **Game case: both** [AGENTS.md rule 14].
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView, guideForState, recommendedCommand } from '../../src/engine/tactics/guide.ts';
import { buildGuideRail, guideLineStrategy } from '../../src/engine/tactics/guide-line.ts';
import { playChapter } from './helpers/guideLineDrive.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');

/** The module specifiers a file imports (static `from '...'` and `import('...')`). */
function importsOf(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) out.push(m[1]!);
  return out;
}

const tsFiles = (dir: string): string[] =>
  readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith('.ts'))
    .map((f) => `${dir}/${f}`);

describe('the guide does not touch the tactics', () => {
  it("the line's evaluator and its board import no tactic, no advisor and no auto-battle strategy", () => {
    for (const f of ['src/engine/tactics/guide-line.ts', 'src/engine/tactics/guide-line-board.ts']) {
      const imports = importsOf(read(f));
      expect(imports.filter((i) => /advisor|BattlePresenterStrategies|BattlePresenterTactics|\/index\.ts$/.test(i)), f).toEqual([]);
      expect(imports.filter((i) => /tactics\/[a-z0-9-]+\.ts$/.test(i) && !/guide|targetLabel/.test(i)), f).toEqual([]);
      // beside the battle types and the guide's own data it reaches only the written content and the in-flight reader
      const local = imports.filter((i) => i.startsWith('./'));
      expect(local.every((i) => /^\.\/(guide|guide-inflight|guide-line-board|targetLabel)\.ts$/.test(i)), `${f}: ${local.join(', ')}`).toBe(true);
    }
  });

  it('the chapters\' lines are data: they import the line types, the kit and chapter data, never the engine', () => {
    const files = tsFiles('src/data/guides/lines');
    expect(files.length).toBe(19); // eighteen chapters and the kit, and nothing else
    for (const f of files) {
      const bad = importsOf(read(f)).filter((i) => /engine|tactics|battle\/(?!common)|ui\//.test(i));
      expect(bad, f).toEqual([]);
    }
  });

  it("the panel reads the rail, not the tactic's view", () => {
    const imports = importsOf(read('src/ui/common/StrategyGuide.ts'));
    expect(imports.some((i) => i.endsWith('tactics/guide-line.ts'))).toBe(true);
    expect(read('src/ui/common/StrategyGuide.ts')).not.toMatch(/buildGuideView/);
  });

  it("on a real board the guide's NEXT is not always the tactic's pick: Flux, where the two plans part ways", () => {
    let compared = 0;
    let differ = 0;
    for (const seed of [1, 2, 3, 4]) {
      playChapter('seymour-flux', seed, intendedStrategy, {
        maxDecisions: 120,
        onDecision: (d) => {
          const decision = { actorId: d.actorId, commands: d.commands };
          const rail = buildGuideRail(d.state, decision)?.next?.command;
          const tactic = buildGuideView(d.state, decision)?.next?.command;
          if (!rail || !tactic) return;
          compared += 1;
          if (JSON.stringify(rail) !== JSON.stringify(tactic)) differ += 1;
        },
      });
    }
    expect(compared).toBeGreaterThan(40);
    expect(differ, 'the guide and the tactic never disagreed: the guide is still the tactic').toBeGreaterThan(0);
  });
});

describe('the advisor does not touch the guide\'s line', () => {
  const advisorFiles = [
    ...tsFiles('src/engine/tactics').filter((f) => /\/advisor[^/]*\.ts$/.test(f)),
    ...(existsSync(join(ROOT, 'src/engine/tactics/advisor-v4')) ? tsFiles('src/engine/tactics/advisor-v4') : []),
    'src/ui/common/MoveAdvisor.ts',
    'src/ui/common/advisorGuideBadge.ts',
    'src/ui/common/advisorChipFollow.ts',
  ];

  it('no advisor module imports the line or its evaluator', () => {
    expect(advisorFiles.length).toBeGreaterThan(15);
    for (const f of advisorFiles) {
      const bad = importsOf(read(f)).filter((i) => /guide-line|guides\/lines/.test(i));
      expect(bad, f).toEqual([]);
    }
  });

  it('what the advisor reads, buildGuideView and recommendedCommand, still mirrors the shipped tactic decision for decision', () => {
    let seen = 0;
    for (const chapter of ['seymour-flux', 'yunalesca', 'ffx2-bahamut', 'seymour-natus']) {
      playChapter(chapter, 2, intendedStrategy, {
        maxDecisions: 90,
        onDecision: (d, engine) => {
          const decision = { actorId: d.actorId, commands: d.commands };
          const shipped = intendedStrategy(d.actorId, d.commands, engine);
          const viaGuide = recommendedCommand(d.state, decision);
          expect(JSON.stringify(viaGuide), `${chapter} turn ${d.state.turn}`).toBe(JSON.stringify(shipped));
          if (guideForState(d.state)) seen += 1;
        },
      });
    }
    expect(seen).toBeGreaterThan(100);
  });

  it('the guide plays its own line as a whole strategy, with the tactic out of the loop', () => {
    const run = playChapter('seymour-anima-macalania', 3, guideLineStrategy, { maxDecisions: 300 });
    expect(['victory', 'defeat']).toContain(run.outcome);
  });
});
