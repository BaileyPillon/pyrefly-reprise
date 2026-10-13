/**
 * Driver for the 2026-10-12 "FFX-2 Difficulty Options" page (PR-0227) and its DIFF-B build, copied unchanged from the
 * options page's scratch worktree (`critic/bench/r43/drivex.ts` of D:/pyrefly-r43-options) so the same harness measures
 * the build. Not part of `npm test` (`vitest.config.ts` here is the only config that includes this folder).
 *
 * `runChapterX` is `critic/bench/advisor-v3/drive.ts` `runChapter` with the four things the house run fixes
 * made into inputs, and nothing else changed: the pace (`topMs` / `heldMs`), the Config ATB mode, Wait's split
 * and the Config ATB speed. With `{ topMs: 500, heldMs: 1000, atbMode: 'wait', waitSplit: true, atbSpeed: 'normal' }`
 * it is the house human pace exactly, and must give the scorecard's numbers seed for seed.
 */

import type { BattleEngine, BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import type { Chapter } from '../../../src/data/encounters.ts';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { fallbackCommand, liveAdvisorOptions, type DecisionContext, type Driver, type RunResult } from '../advisor-v3/drive.ts';

export interface Arm {
  /** Milliseconds the player spends on the top-level command list (the clock runs under Active, and under Wait's split). */
  topMs: number;
  /** Milliseconds the player spends in a submenu / on the target cursor (the clock is held by Wait, runs under Active). */
  heldMs: number;
  atbMode: 'wait' | 'active';
  waitSplit: boolean;
  atbSpeed: 'slow' | 'normal' | 'fast';
}

export const HOUSE: Arm = { topMs: 500, heldMs: 1000, atbMode: 'wait', waitSplit: true, atbSpeed: 'normal' };

const MAX_STEPS = 120_000;
const MAX_LINKS = 12;
const REFUSAL_STREAK = 3;

type Input = Extract<Decision, { kind: 'player-input' }>;

async function engineFor(setup: BattleSetup, arm: Arm): Promise<BattleEngine> {
  await registerBattleContent();
  const engine = new FFX2Engine({
    ...ffx2EngineOptions(),
    minigames: false,
    atbMode: arm.atbMode,
    waitSplit: arm.waitSplit,
    atbSpeed: arm.atbSpeed,
  });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

export interface RunX extends RunResult {
  /** Game ticks the chapter ran in total (all links). */
  ticks: number;
}

/** Play one FFX-2 chapter from its first link to an outcome under `driver` at the pace and clock of `arm`. */
export async function runChapterX(chapter: Chapter, seed: number, driver: Driver, arm: Arm): Promise<RunX> {
  if (chapter.game !== 'ffx2') throw new Error('FFX-2 chapters only');
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  let setup: BattleSetup = setupForChapter(chapter, seed);
  const engine = await engineFor(setup, arm);
  const x2 = engine as unknown as FFX2Engine;
  const advisorOptions = liveAdvisorOptions('ffx2', engine);
  const out: RunX = {
    chapterId: chapter.id, seed, outcome: 'unresolved', linksCleared: 0, decisions: 0, closed: 0,
    refused: 0, fallbacks: 0, minutes: 0, finalLogLength: 0, finalLogDigest: '', ticks: 0,
  };
  const groups: EnemyGroupDef[] = [];
  for (let g: EnemyGroupDef | null = group; g?.nextGroupId && groups.length < MAX_LINKS; ) {
    g = (await findEnemyGroup(g.nextGroupId)) ?? null;
    if (g) groups.push(g);
  }
  let link = 1;
  let streakActor = '';
  let streak = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    const d = engine.nextDecision();
    if (d.kind === 'waiting') {
      x2.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'resolved') continue;
    if (d.kind === 'battle-over') {
      out.outcome = d.result.outcome;
      out.minutes += engine.state().ticks / STEPS_PER_SECOND / 60;
      out.ticks += engine.state().ticks;
      out.finalLogLength = engine.state().log.length;
      if (out.outcome !== 'victory') break;
      out.linksCleared += 1;
      if (!group.nextGroupId || link >= MAX_LINKS) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    out.decisions += 1;
    const ctx: DecisionContext = {
      chapterId: chapter.id, game: 'ffx2', seed, link, index: out.decisions, engine, state: engine.state(), decision: d as Input,
      advisorOptions, chain: { setup, next: groups.slice(link - 1) },
    };
    let picked = streak >= REFUSAL_STREAK && (d as Input).actorId === streakActor ? null : driver(ctx);
    x2.setMenuLevel('top');
    x2.tick(arm.topMs, { throughInput: true });
    x2.setMenuLevel('deep');
    if (!x2.inputValid((d as Input).actorId)) {
      out.closed += 1;
      continue;
    }
    x2.tick(arm.heldMs, { throughInput: true });
    if (!x2.inputValid((d as Input).actorId)) {
      out.closed += 1;
      continue;
    }
    if (!picked) {
      out.fallbacks += 1;
      picked = fallbackCommand(d as Input);
    }
    const events = engine.submit(picked as Command);
    const held = x2.heldCommand() ?? null;
    if (events.length === 0 && !held) {
      out.refused += 1;
      streak = (d as Input).actorId === streakActor ? streak + 1 : 1;
      streakActor = (d as Input).actorId;
    } else {
      streak = 0;
      streakActor = '';
    }
  }
  return out;
}

export { FFXEngine };
