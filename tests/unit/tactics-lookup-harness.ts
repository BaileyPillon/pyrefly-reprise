/**
 * Drives one chapter's real engine, link by link, with the shipped
 * `intendedStrategy`, and records what the lookup side of the tactics module
 * said at every player turn: which guide (`buildGuideView`), which tactic
 * (`tacticFor`) and which command. Shared by `tactics-lookup.test.ts`.
 *
 * Not a test file itself (no `.test.ts`), so vitest only runs it through the
 * suite that imports it.
 */

import type { BattleEngine, BattleSetup, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import type { Chapter } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView } from '../../src/engine/tactics/guide.ts';
import * as tactics from '../../src/engine/tactics/index.ts';

/** One player turn as the lookup saw it. */
export interface TurnRecord {
  link: number;
  actorId: string;
  /** An aeon-side combatant is in the record (an FFX party carries its aeons from turn 1). */
  aeonInRecord: boolean;
  guideId: string | null;
  tactic: string | null;
  /** `JSON.stringify` of the whole guide view (NEXT line included). */
  view: string;
  command: string;
}

export interface RunRecord {
  chapterId: string;
  seed: number;
  links: number;
  outcome: string;
  turns: TurnRecord[];
}

/** Tactic function -> its export name, so a record names the tactic it got. */
const TACTIC_NAMES = new Map<unknown, string>(
  Object.entries(tactics).filter(([, v]) => typeof v === 'function').map(([k, v]) => [v, k]),
);

async function engineFor(setup: BattleSetup): Promise<BattleEngine> {
  await registerBattleContent();
  const engine: BattleEngine =
    setup.game === 'ffx' ? new FFXEngine({ autoResolveMinigames: true }) : new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/**
 * Fight the chapter from its first link with the intended line, following
 * `nextGroupId` exactly as `runEncounterChain` does, for at most `maxTurns`
 * player turns in total.
 */
export async function runChapter(
  chapter: Chapter,
  seed: number,
  maxTurns = 400,
  /** Start at this link of the chain instead of the first (with the chapter's fresh build). */
  startGroup?: EnemyGroupDef,
): Promise<RunRecord> {
  let group = startGroup ?? chapter.enemyGroupRef;
  let setup: BattleSetup = { ...setupForChapter(chapter, seed), enemies: group, canEscape: group.canEscape ?? false };
  const engine = await engineFor(setup);
  const turns: TurnRecord[] = [];
  let links = 1;
  let outcome = 'cap';
  for (let steps = 0; steps < 200_000 && turns.length < maxTurns; steps++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'waiting') {
      (engine as FFX2Engine).tick(d.nextEventMs);
      continue;
    }
    if (d.kind === 'resolved') continue;
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      if (outcome !== 'victory' || !group.nextGroupId || links >= 12) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state(), seed + links);
      group = next;
      links++;
      // Same engine, re-initialised, exactly as `runEncounterChain` restages a link.
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    const state = engine.state();
    const view = buildGuideView(state, { actorId: d.actorId, commands: d.commands });
    const tactic = tactics.tacticFor(engine);
    const command = intendedStrategy(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] };
    turns.push({
      link: links,
      actorId: d.actorId,
      aeonInRecord: Object.values(state.combatants).some((c) => c.side === 'aeon'),
      guideId: view?.chapterId ?? null,
      tactic: tactic ? (TACTIC_NAMES.get(tactic) ?? '?') : null,
      view: JSON.stringify(view),
      command: JSON.stringify(command),
    });
    engine.submit(command);
  }
  return { chapterId: chapter.id, seed, links, outcome, turns };
}

/** Every formation in the chapter's chain, first link first, following `nextGroupId`. */
export async function chainGroups(chapter: Chapter): Promise<EnemyGroupDef[]> {
  const out: EnemyGroupDef[] = [chapter.enemyGroupRef];
  const seen = new Set([chapter.enemyGroupRef.id]);
  for (let g = out[0]; g?.nextGroupId && !seen.has(g.nextGroupId); ) {
    seen.add(g.nextGroupId);
    const next = await findEnemyGroup(g.nextGroupId);
    if (!next) break;
    out.push(next);
    g = next;
  }
  return out;
}
