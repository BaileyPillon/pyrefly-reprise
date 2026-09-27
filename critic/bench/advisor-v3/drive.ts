/**
 * **Advisor v3 scorecard: the chapter driver.** One listed chapter, one seed, one
 * driver, played through its whole chain the way the app plays it.
 *
 * The chapter comes from its own registered record (`setupForChapter`), every later
 * link through `setupForNextLink` (the screen's own carry), and the engine is built
 * the way `BattleScreenWiring.createEngine` builds it for an automated run: the
 * process-wide content (`registerBattleContent`), FFX `autoResolveMinigames`, FFX-2
 * `minigames: false`. Nothing chapter-specific, so a chapter added later is measured
 * the day it is listed.
 *
 * ## The pace
 *
 * **FFX** is CTB: nothing moves while a menu is open [research/ffx-combat-core.md
 * §1.1], so a decision costs no game time and there is no pace to model.
 *
 * **FFX-2** runs at the house **human pace**: the live default (Wait, split), 1.5 s a
 * menu, 0.5 s of it on the top-level list with the clock running and 1.0 s held in a
 * submenu (`docs/plans/fallen-aeons-bench.md`, the model every FFX-2 chapter bench
 * uses since 2026-09-25). `topMs` / `heldMs` are measurement inputs, never game data.
 *
 * The card is read **when the decision opens**, which is when the live HUD computes it
 * (`MoveAdvisor.showDecision`, once per decision), and the card's command is what
 * gets submitted after the menu time has passed, as a player following it would.
 *
 * ## Purity
 *
 * The driver only reads the engine between steps and hands it one command per
 * decision. Observers (`./metrics.ts`) read `engine.state()` and simulate on the
 * engines' own throwaway copies (`simulate*Command`, `forecastFromState`); none of
 * them draws from the battle's RNG. `scorecard.test.ts` checks it: the same seed with
 * the observers on and off must end on the same event log.
 *
 * Game case: **both** (AGENTS.md rule 14): the harness is shared plumbing; the pace
 * half is FFX-2 only because only FFX-2 has a clock under a menu.
 */

import type { AvailableCommand, BattleEngine, BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, CHAPTER_IDS, type Chapter } from '../../../src/data/encounters.ts';
import type { AdvisorOptions } from '../../../src/engine/tactics/advisor.ts';

/** The house human pace for FFX-2 (see the module note). */
export const HUMAN_PACE = { topMs: 500, heldMs: 1000 } as const;
/** Well past every chapter's own watchdog. */
const MAX_STEPS = 120_000;
/** A chain longer than this is a data loop, not a chapter. */
const MAX_LINKS = 12;
/** The same actor refused this many times in a row: the driver presses the fallback. */
const REFUSAL_STREAK = 3;

export type Input = Extract<Decision, { kind: 'player-input' }>;

/** What a driver sees at one decision. `engine` is for reads only. */
export interface DecisionContext {
  chapterId: string;
  game: 'ffx' | 'ffx2';
  seed: number;
  link: number;
  /** Player decisions so far in this run, this one included. */
  index: number;
  engine: BattleEngine;
  state: Readonly<BattleState>;
  decision: Input;
  /** What the live HUD hands the advisor for this game. */
  advisorOptions: AdvisorOptions;
}

/** Picks a command for one decision (or `null` for the fallback). */
export type Driver = (ctx: DecisionContext) => Command | null;

export interface RunResult {
  chapterId: string;
  seed: number;
  outcome: string;
  /** Links won before the run ended. */
  linksCleared: number;
  decisions: number;
  /** FFX-2: menus the clock closed under the player (the top-list time). */
  closed: number;
  /** Submits the engine refused (no events, nothing held). */
  refused: number;
  /** Decisions the driver answered with nothing and the fallback pressed. */
  fallbacks: number;
  /** Game minutes (FFX-2 ticks / 3000 / 60; 0 for FFX). */
  minutes: number;
  /** Length of the final link's log, for the purity check. */
  finalLogLength: number;
  /** A digest of the final link's log (event types and seqs), for the purity check. */
  finalLogDigest: string;
}

export function listedChapters(): Chapter[] {
  return CHAPTER_IDS.map((id) => CHAPTERS.find((c) => c.id === id)!).filter((c) => c.game === 'ffx' || c.game === 'ffx2');
}

export function chapterById(id: string): Chapter {
  const c = CHAPTERS.find((x) => x.id === id);
  if (!c) throw new Error(`no listed chapter "${id}"`);
  return c;
}

/** The registries the live FFX-2 HUD passes (`FFX2BattleHud`'s `advisor` option); FFX passes none. */
export function liveAdvisorOptions(game: 'ffx' | 'ffx2', engine?: BattleEngine): AdvisorOptions {
  const v3 = process.env['SCORECARD_V3'];
  const flag: AdvisorOptions = v3 === '1' ? { v3: true } : v3 === '0' ? { v3: false } : {};
  if (game === 'ffx') return flag;
  const o = ffx2EngineOptions();
  // Since advisor v3 the live HUD also hands over the engine (read and forked, never driven).
  const live = engine instanceof FFX2Engine ? { engine: () => engine } : {};
  return { ...flag, ...live, ffx2: { ...(o.abilities ? { abilities: o.abilities } : {}), ...(o.items ? { items: o.items } : {}) } };
}

async function engineFor(setup: BattleSetup): Promise<BattleEngine> {
  await registerBattleContent();
  const engine: BattleEngine =
    setup.game === 'ffx'
      ? new FFXEngine({ autoResolveMinigames: true })
      : new FFX2Engine({ ...ffx2EngineOptions(), minigames: false, atbMode: 'wait', waitSplit: true });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

/** The first enabled Attack, else the first enabled row, aimed at its first target. */
export function fallbackCommand(d: Input): Command {
  const row: AvailableCommand | undefined =
    d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const target = row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

function digest(log: readonly { type: string; seq: number }[]): string {
  let h = 2166136261;
  for (const e of log) {
    const s = `${e.seq}:${e.type};`;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  }
  return h.toString(16);
}

/** Play one chapter from its first link to an outcome under `driver`. */
export async function runChapter(chapter: Chapter, seed: number, driver: Driver): Promise<RunResult> {
  const game = chapter.game === 'ffx2' ? 'ffx2' : 'ffx';
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  let setup: BattleSetup = setupForChapter(chapter, seed);
  const engine = await engineFor(setup);
  const x2 = game === 'ffx2' ? (engine as unknown as FFX2Engine) : null;
  const advisorOptions = liveAdvisorOptions(game, engine);
  const out: RunResult = {
    chapterId: chapter.id, seed, outcome: 'unresolved', linksCleared: 0, decisions: 0, closed: 0,
    refused: 0, fallbacks: 0, minutes: 0, finalLogLength: 0, finalLogDigest: '',
  };
  let link = 1;
  let streakActor = '';
  let streak = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    const d = engine.nextDecision();
    if (d.kind === 'waiting') {
      x2?.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'resolved') continue;
    if (d.kind === 'battle-over') {
      out.outcome = d.result.outcome;
      if (x2) out.minutes += engine.state().ticks / 3000 / 60;
      out.finalLogLength = engine.state().log.length;
      out.finalLogDigest = digest(engine.state().log);
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
      chapterId: chapter.id, game, seed, link, index: out.decisions, engine, state: engine.state(), decision: d, advisorOptions,
    };
    // The card is read as the menu opens, like the live HUD.
    let picked = streak >= REFUSAL_STREAK && d.actorId === streakActor ? null : driver(ctx);
    if (x2) {
      x2.setMenuLevel('top');
      x2.tick(HUMAN_PACE.topMs, { throughInput: true });
      x2.setMenuLevel('deep');
      if (!x2.inputValid(d.actorId)) {
        out.closed += 1;
        continue;
      }
      x2.tick(HUMAN_PACE.heldMs, { throughInput: true });
      if (!x2.inputValid(d.actorId)) {
        out.closed += 1;
        continue;
      }
    }
    if (!picked) {
      out.fallbacks += 1;
      picked = fallbackCommand(d);
    }
    const events = engine.submit(picked);
    const held = x2?.heldCommand() ?? null;
    if (events.length === 0 && !held) {
      out.refused += 1;
      streak = d.actorId === streakActor ? streak + 1 : 1;
      streakActor = d.actorId;
    } else {
      streak = 0;
      streakActor = '';
    }
  }
  return out;
}
