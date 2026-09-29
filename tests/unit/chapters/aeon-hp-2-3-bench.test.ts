/**
 * **Chapters II and III aeon rows — the seeded bench** (Bailey 2026-09-28; `late-aeon-rows.ts`).
 *
 * Win rates on the real engine and data for the rows shipped until 2026-09-28 (`floor`,
 * `ffx-yunalesca.md` §12) and the rows shipped now (`sourced`, `ffx-combat-core.md` §6.4.3), per
 * chapter and driver:
 *
 * - **intended** — the shipped `intendedStrategy` (what `__pyrefly.autoBattle('intended')` plays).
 * - **card** — the advisor card-follower: presses the card's top suggestion every turn (planner on,
 *   as `advisor-degenerate-boards.test.ts`), else the first legal row (a decline, counted).
 *
 * Each run plays the whole chain from its first link (`setupForNextLink`, the screen's own carry), so
 * Chapter III's possessed aeons (which mirror the party's roster, §2.2) are in it. FFX is CTB: the
 * clock never runs while a menu is open (`ffx-no-active-clock.test.ts`), so the human, Active and
 * bench speeds are one run and one column here.
 *
 * **Measure, never tune.** `PYREFLY_MEASURE=1` runs 200 seeds a row (`AEON23_SEEDS` overrides) and
 * prints one JSON line per row; by default it is a two-seed smoke that pins only that every run ends.
 * `AEON23_CHAPTERS`, `AEON23_ARMS`, `AEON23_DRIVERS` narrow a run (comma lists).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: aeons exist only in FFX.
 */

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { AeonBuild, BattleSetup, Command, Decision, EnemyGroupDef, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../../src/data/ffx/builds/zanarkand.ts';
import { dreamsEndBuild } from '../../../src/data/ffx/builds/dreams-end.ts';
import { dreamsEndFloorAeons, zanarkandFloorAeons } from '../../../src/data/ffx/builds/late-aeon-rows.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../../src/engine/tactics/advisor.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = Number(process.env['AEON23_SEEDS'] ?? (MEASURE ? 200 : 2));
const list = (key: string, all: string[]): string[] => (process.env[key] ? process.env[key]!.split(',') : all);
const MAX_DECISIONS = 40_000;

type Arm = 'floor' | 'sourced';
type Driver = 'intended' | 'card';

const CHAPTERS: Record<string, { group: string; build: FFXPartyBuild; floor: () => AeonBuild[] }> = {
  yunalesca: { group: 'yunalesca', build: zanarkandBuild, floor: zanarkandFloorAeons },
  'braskas-final-aeon': { group: 'braskas-final-aeon', build: dreamsEndBuild, floor: dreamsEndFloorAeons },
};

function partyFor(chapterId: string, arm: Arm): FFXPartyBuild {
  const c = CHAPTERS[chapterId]!;
  return arm === 'sourced' ? c.build : { ...c.build, aeons: c.floor() };
}

interface Run {
  outcome: string;
  links: number;
  turns: number;
  summons: number;
  declines: number;
  lossAt: string | null;
  /** Engine turns per link, in chain order. */
  linkTurns: number[];
  hash: string;
}

function fallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row = d.commands.find((c) => c.enabled && c.validTargets.length > 0) ?? d.commands.find((c) => c.enabled);
  return (row ? { ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] } : { kind: 'defend', targets: [] }) as Command;
}

function play(chapterId: string, arm: Arm, driver: Driver, seed: number): Run {
  clearAdvisorCache();
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  let group: EnemyGroupDef = ENEMY_GROUPS_BY_ID[CHAPTERS[chapterId]!.group]!;
  let setup: BattleSetup = {
    game: 'ffx', party: partyFor(chapterId, arm), enemies: group, triggers: [], seed, condition: 'normal', canEscape: false,
  } as BattleSetup;
  engine.setSeed(seed);
  engine.init(setup);
  const hash = createHash('sha1');
  const run: Run = { outcome: 'stalled', links: 0, turns: 0, summons: 0, declines: 0, lossAt: null, linkTurns: [], hash: '' };
  for (;;) {
    run.links += 1;
    let outcome = 'stalled';
    for (let i = 0; i < MAX_DECISIONS; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        outcome = String(d.result.outcome);
        break;
      }
      if (d.kind !== 'player-input') continue;
      let cmd: Command | null;
      if (driver === 'intended') cmd = intendedStrategy(d.actorId, d.commands, engine);
      else {
        const view = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, { ffxContent: content, planner: true });
        cmd = (view?.suggestions[0]?.command as Command | undefined) ?? null;
        if (!cmd) run.declines += 1;
      }
      const chosen = cmd ?? fallback(d);
      if (chosen.kind === 'summon') run.summons += 1;
      engine.submit(chosen);
    }
    const state = engine.state();
    run.turns += state.turn;
    run.linkTurns.push(state.turn);
    hash.update(JSON.stringify(state.log));
    run.outcome = outcome;
    if (outcome !== 'victory') {
      run.lossAt = `link ${run.links} [${group.id}]`;
      break;
    }
    const nextId = group.nextGroupId;
    if (nextId === undefined) break;
    const next = ENEMY_GROUPS_BY_ID[nextId];
    if (!next) break;
    setup = { ...setup, ...setupForNextLink(setup, next, state, seed + run.links) } as BattleSetup;
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }
  run.hash = hash.digest('hex').slice(0, 16);
  return run;
}

describe(`Chapters II and III aeon rows, floor vs sourced (${SEEDS} seeds a row, FFX only)`, () => {
  it('every run reaches an outcome; one JSON line per row', () => {
    for (const chapterId of list('AEON23_CHAPTERS', Object.keys(CHAPTERS))) {
      for (const driver of list('AEON23_DRIVERS', ['intended', 'card']) as Driver[]) {
        const byArm: Partial<Record<Arm, Run[]>> = {};
        for (const arm of list('AEON23_ARMS', ['floor', 'sourced']) as Arm[]) {
          const t0 = Date.now();
          const runs = Array.from({ length: SEEDS }, (_, i) => play(chapterId, arm, driver, i + 1));
          byArm[arm] = runs;
          for (const r of runs) expect(r.outcome, `${chapterId} ${arm} ${driver}`).not.toBe('stalled');
          const wins = runs.filter((r) => r.outcome === 'victory');
          const mean = (xs: Run[], k: 'turns' | 'summons' | 'declines') => (xs.length ? xs.reduce((n, r) => n + r[k], 0) / xs.length : 0);
          const lossAt: Record<string, number> = {};
          for (const r of runs) if (r.lossAt) lossAt[r.lossAt] = (lossAt[r.lossAt] ?? 0) + 1;
          const links = Math.max(...wins.map((r) => r.linkTurns.length), 0);
          const perLink = Array.from({ length: links }, (_, k) => +(wins.reduce((n, r) => n + (r.linkTurns[k] ?? 0), 0) / Math.max(wins.length, 1)).toFixed(1));
          console.log(JSON.stringify({
            chapterId, arm, driver, seeds: SEEDS, wins: wins.length,
            turnsAll: +mean(runs, 'turns').toFixed(1), turnsWins: +mean(wins, 'turns').toFixed(1),
            turnsPerLinkWins: perLink, summons: +mean(runs, 'summons').toFixed(2), declines: +mean(runs, 'declines').toFixed(2), lossAt,
            ms: Date.now() - t0,
          }));
        }
        if (byArm.floor && byArm.sourced) {
          const moved = byArm.floor.filter((r, i) => r.hash !== byArm.sourced![i]!.hash).length;
          const flips = byArm.floor.map((r, i) => `${r.outcome[0]}${byArm.sourced![i]!.outcome[0]}`);
          const count = (s: string) => flips.filter((f) => f === s).length;
          console.log(JSON.stringify({ chapterId, driver, logsMoved: moved, lostToWon: count('dv'), wonToLost: count('vd') }));
        }
      }
    }
  }, MEASURE ? 0 : 180_000);
});
