/**
 * **Advisor v4 never touches the battle** (AGENTS.md rule 1): a chapter played with the look-ahead
 * attached exactly as the battle screen attaches it (`attachAdvisorV4`: the engine's `init`,
 * `submit` and back-out calls start searches on serialized copies in the worker) ends on the same
 * event log, link by link, as the same presses without it. The presses are v3's top row both
 * times, so any difference could only come from the look-ahead reaching the battle.
 *
 * Game case: FFX only (the look-ahead is attached to FFX battles only).
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { BattleSetup, BattleState, Command, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { buildAdvisorView } from '../../src/engine/tactics/advisor.ts';
import type { MoveAdvisorLookAhead } from '../../src/ui/common/MoveAdvisor.ts';
import { attachAdvisorV4 } from '../../src/app/advisorV4/wiring.ts';
import type { AdvisorV4Host } from '../../src/app/advisorV4/host.ts';
import { InProcWorker } from '../../critic/bench/advisor-v4/inproc-worker.ts';

const G = globalThis as { __pyreflyAdvisorV4Force?: boolean; __pyreflyAdvisorV4?: unknown };
afterEach(() => {
  delete G.__pyreflyAdvisorV4Force;
  delete G.__pyreflyAdvisorV4;
});

function fnv(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
}

async function play(chapterId: string, seed: number, withV4: boolean): Promise<{ logs: string[]; host: AdvisorV4Host | null; shown: number }> {
  await registerBattleContent();
  const chapter = CHAPTERS.find((c) => c.id === chapterId)!;
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const e = new FFXEngine({ autoResolveMinigames: true });
  e.setSeed(setup.seed);
  e.init(setup);
  let source: MoveAdvisorLookAhead | null = null;
  const worker = new InProcWorker();
  let host: AdvisorV4Host | null = null;
  if (withV4) {
    G.__pyreflyAdvisorV4Force = true;
    const owner = { moveAdvisor: { setLookAhead: (s: MoveAdvisorLookAhead | null) => { source = s; } } };
    host = attachAdvisorV4(owner, e, 'ffx', { spawn: () => worker, budget: 'mini' });
    expect(host).not.toBeNull();
  }
  const logs: string[] = [];
  let shown = 0;
  let link = 1;
  for (let step = 0; step < 100_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      logs.push(`${fnv(JSON.stringify(e.state().log))}:${d.result.outcome}`);
      if (d.result.outcome !== 'victory' || !group.nextGroupId) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, e.state() as BattleState, seed + link);
      group = next;
      link += 1;
      e.setSeed(setup.seed);
      e.init(setup);
      continue;
    }
    // The menu opens: the worker has had all the time it wants (the most it can ever touch).
    await worker.idle();
    const card = (source as MoveAdvisorLookAhead | null)?.cardFor(e.state(), d) ?? null;
    if (card) shown += 1;
    (source as MoveAdvisorLookAhead | null)?.closed();
    const v3 = buildAdvisorView(e.state(), d, {});
    const row = d.commands.find((c) => c.enabled);
    const press: Command = v3?.suggestions[0]?.command ?? ({ ...row!.command, targets: row!.validTargets.slice(0, 1) } as Command);
    e.submit(press);
  }
  host?.dispose();
  return { logs, host, shown };
}

describe('advisor v4 purity (FFX): the battle log is the same with the look-ahead on and off', () => {
  for (const [id, seed] of [['isaaru-via-purifico', 1], ['seymour-flux', 2]] as const) {
    it(`${id} seed ${seed}`, async () => {
      const on = await play(id, seed, true);
      const off = await play(id, seed, false);
      expect(on.logs).toEqual(off.logs);
      expect(on.logs.length).toBeGreaterThan(0);
      expect(on.host!.stats.results, 'the worker answered').toBeGreaterThan(0);
      expect(on.shown, 'the card read finished answers').toBeGreaterThan(0);
      expect(on.host!.stats.ready).toBe(on.shown);
      // With the time it wants, every menu finds its pre-started answer: the copy reaches the very board.
      expect(on.host!.stats.ready).toBe(on.host!.stats.opened);
    }, 900_000);
  }
});
