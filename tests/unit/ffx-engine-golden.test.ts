/**
 * **FFX engine goldens**: every listed FFX chapter, two seeds each, played by the chapter's own
 * line through its whole chain; the digest of every link's full event log (JSON, every field) is
 * pinned. Written before `src/battle/ffx/engine.ts` was split under the 400-line house limit
 * (advisor v4, 2026-09-28), so the split is proved to change nothing (AGENTS.md rules 3 and 7).
 *
 * A digest that moves means the engine's behaviour moved: that is a change to explain, never a
 * number to re-pin without a reason.
 *
 * Game case: FFX only (the FFX-2 engine has `ffx2-atb-golden.test.ts`).
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

function fnv(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
}

/** Digests of each link's whole log, then the outcome. */
async function goldenOf(chapterId: string, seed: number): Promise<string> {
  await registerBattleContent();
  const chapter = CHAPTERS.find((c) => c.id === chapterId)!;
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const e = new FFXEngine({ autoResolveMinigames: true });
  e.setSeed(setup.seed);
  e.init(setup);
  const parts: string[] = [];
  let link = 1;
  for (let step = 0; step < 200_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      parts.push(`${fnv(JSON.stringify(e.state().log))}:${d.result.outcome}`);
      if (d.result.outcome !== 'victory' || !group.nextGroupId || link >= 12) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, e.state() as BattleState, seed + link);
      group = next;
      link += 1;
      e.setSeed(setup.seed);
      e.init(setup);
      continue;
    }
    e.submit(intendedStrategy(d.actorId, d.commands, e as never) ?? fallback(d));
  }
  return parts.join(' ');
}

/** Recorded on advisor-v4 at cf3306eb (main 1a81a8ed merged), before the split. */
const GOLDEN: Record<string, string> = {
  'seymour-flux#1': 'd5fd8bf4:defeat',
  'seymour-flux#7': '420e8126:victory',
  'yunalesca#1': '608f8886:victory',
  'yunalesca#7': '9ffe2cf3:victory',
  'braskas-final-aeon#1': '8ffd48c5:victory 54f87220:victory d9c17d4d:victory a8670d62:victory d8887cc:victory 60866a38:victory 828a017a:victory',
  'braskas-final-aeon#7': '9f7b472a:victory be7e9819:victory dff628e3:victory e18e6c63:victory abbb1906:victory 3344d8b8:victory 6cc3ec46:victory',
  'seymour-anima-macalania#1': 'ca4a9a51:victory',
  'seymour-anima-macalania#7': 'd14d5e8a:victory',
  'evrae-airship#1': 'ebf9b7c4:victory',
  'evrae-airship#7': '73022786:victory',
  'yojimbo-cavern#1': '354ac345:victory',
  'yojimbo-cavern#7': '13a3322e:victory',
  'seymour-natus#1': '6fe6bbe1:defeat',
  'seymour-natus#7': '4be27cc4:defeat',
  'seymour-omnis#1': '354e0ace:victory',
  'seymour-omnis#7': 'ac28e23c:victory',
  'isaaru-via-purifico#1': 'a9b7568a:victory 5be7c9ed:victory 32b8ae86:victory',
  'isaaru-via-purifico#7': 'cc3291bd:victory a32106b5:victory 3c5d0bb6:victory',
};

describe('FFX engine goldens (every FFX chapter, the line, whole chain)', () => {
  const ids = ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'seymour-natus', 'seymour-omnis', 'isaaru-via-purifico'];
  for (const id of ids) {
    for (const seed of [1, 7]) {
      it(`${id} seed ${seed}`, async () => {
        const got = await goldenOf(id, seed);
        const want = GOLDEN[`${id}#${seed}`];
        if (want === undefined) {
          process.stderr.write(`[golden] '${id}#${seed}': '${got}',\n`);
          expect(got.length).toBeGreaterThan(0);
        } else {
          expect(got).toBe(want);
        }
      }, 300_000);
    }
  }
});
