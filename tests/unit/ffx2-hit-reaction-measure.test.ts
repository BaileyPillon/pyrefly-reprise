/**
 * **RE-parity balance measurement, FFX-2: the hit reaction** (lane X2-A, slice 1; the ablation and before / after tables of
 * `docs/handoff/re-parity-rc9-x2-hit-reaction.md`).
 *
 * The SHIPPED `intendedStrategy` plays each chapter's whole chain through the app's own path (`registerBattleContent`, `setupForChapter`,
 * `setupForNextLink`, minigames auto-resolved) on a range of seeds, at one of three speeds:
 *
 * - `bench`: zero decision time (the auto-battler, what the parity measurement and the goldens use);
 * - `human`: the default Wait with its split, 1.5 s a menu of which 0.5 s is on the top list (the clock runs) and the rest inside a submenu (held), the
 *   method of `ffx2-wait-split-measure.test.ts`; the decision times are authored measurement inputs, not game data;
 * - `active`: Active ATB, 1.5 s a menu with the clock running.
 *
 * And at one of eight arms of the slice (`reaction.ts` knobs): `old` (the switch off, the engine of release 50), `new` (the shipped slice), the four
 * ablations `girls` (the girls' windows alone), `monsters` (the monsters' alone), `xa2` (the halved-tick span and forced hit alone) and `xa7` (the Haste ratio
 * on today's numbers alone), and the two Shuyin arms (`shuyin-today`: the slice on, Chapter V's Shuyin kept on today's window; `shuyin-135`: the same Shuyin
 * as the 135-frame set, a what-if). **Measure, never tune.**
 *
 * Besides wins it counts what explains a move: hits that landed on a chain (by side of the target), the longest chain an enemy took, the party's KOs and the
 * minutes the chain took. Rows carry `perSeed` (one letter a seed) and the sums behind the means, so runs split across processes merge exactly.
 *
 * Runs only with `PYREFLY_X2A_MEASURE=1`. `PYREFLY_X2A_ARM`, `PYREFLY_X2A_SPEED`, `PYREFLY_X2A_SEEDS` (`<n>` or `<a>-<b>`), `PYREFLY_X2A_CHAPTERS`
 * (comma list of chapter ids; default all twelve FFX-2 chapters), `PYREFLY_X2A_OUT` (a JSON file for the rows).
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFX2Engine, STEPS_PER_SECOND } from '../../src/battle/ffx2/index.ts';
import { NEW_REACTION, OLD_REACTION, withReactionKnobsAsync, type ReactionKnobs } from '../../src/battle/ffx2/reaction.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { getChapter, type Chapter } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_X2A_MEASURE'] === '1';
const OUT = process.env['PYREFLY_X2A_OUT'];
const ARM = process.env['PYREFLY_X2A_ARM'] ?? 'new';
const SPEED = process.env['PYREFLY_X2A_SPEED'] ?? 'bench';
const SEED_SPEC = process.env['PYREFLY_X2A_SEEDS'] ?? '12';
const SEED_RANGE = /^(\d+)-(\d+)$/.exec(SEED_SPEC);
const FIRST_SEED = SEED_RANGE ? Number(SEED_RANGE[1]) : 1;
const LAST_SEED = SEED_RANGE ? Number(SEED_RANGE[2]) : Number(SEED_SPEC);
const ALL_CHAPTERS = [
  'ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc', 'ffx2-fallen-aeons', 'ffx2-trema', 'ffx2-den-of-woe', 'ffx2-ixion-djose',
  'ffx2-masterpiece-theatre', 'ffx2-tourist-trap', 'ffx2-valefor-besaid', 'ffx2-angra-mainyu', 'exp-leblanc',
];
const CHAPTER_IDS = process.env['PYREFLY_X2A_CHAPTERS']?.split(',') ?? ALL_CHAPTERS;
const MAX_DECISIONS = 60_000;
const MAX_LINKS = 12;
/** Authored measurement inputs: a menu costs 1.5 s, 0.5 s of it on the top list. */
const MENU_MS = 1500;
const TOP_MS = 500;

const ARMS: Record<string, Partial<ReactionKnobs>> = {
  old: OLD_REACTION,
  new: NEW_REACTION,
  girls: { girls: true },
  monsters: { monsters: true },
  xa2: { coupling: true },
  xa7: { ratio: true },
  // Chapter V's Shuyin (monster row 260) alone: kept on today's window, or as the 135-frame set the note flags as a probable placeholder (a what-if).
  'shuyin-today': { girls: true, monsters: true, keepRows: [260] },
  'shuyin-135': { girls: true, monsters: true, clipsOfRow: { 260: [135, 135] } },
};

type Input = Extract<Decision, { kind: 'player-input' }>;

interface One {
  outcome: string;
  link1Won: boolean;
  partyTurns: number;
  engineTurns: number;
  steps: number;
  partyKos: number;
  invalidated: number;
  /** Hits that landed on a running chain (a `chain` event with a count above 0), by the side of the target. */
  chainHitsOnEnemies: number;
  chainHitsOnGirls: number;
  /** The longest chain any enemy took in the battle. */
  longestChain: number;
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

function tally(state: Readonly<BattleState>, one: One): void {
  const longest = new Map<string, number>();
  for (const e of state.log) {
    if (e.type === 'ko') {
      const side = state.combatants[e.targetId]?.side;
      if (side === 'party' || side === 'aeon') one.partyKos += 1;
    } else if (e.type === 'chain' && e.count > 0) {
      const side = state.combatants[e.targetId]?.side;
      if (side === 'enemy') {
        one.chainHitsOnEnemies += 1;
        longest.set(e.targetId, Math.max(longest.get(e.targetId) ?? 0, e.count + 1));
      } else {
        one.chainHitsOnGirls += 1;
      }
    }
  }
  for (const n of longest.values()) one.longestChain = Math.max(one.longestChain, n);
}

/** Wait a decision's worth of menu time as the speed says; returns false when the clock closed her menu under her. */
function menuTime(engine: FFX2Engine, actorId: string, one: One): boolean {
  if (SPEED === 'bench') return true;
  if (SPEED === 'human') {
    engine.setMenuLevel('top');
    engine.tick(TOP_MS, { throughInput: true });
    engine.setMenuLevel('deep');
    if (!engine.inputValid(actorId)) {
      one.invalidated += 1;
      return false;
    }
    engine.tick(MENU_MS - TOP_MS, { throughInput: true });
    return true;
  }
  engine.tick(MENU_MS, { throughInput: true });
  if (!engine.inputValid(actorId)) {
    one.invalidated += 1;
    return false;
  }
  return true;
}

async function playChain(chapter: Chapter, seed: number): Promise<One> {
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false, ...(SPEED === 'active' ? { atbMode: 'active' as const } : {}) });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const one: One = { outcome: 'unresolved', link1Won: false, partyTurns: 0, engineTurns: 0, steps: 0, partyKos: 0, invalidated: 0, chainHitsOnEnemies: 0, chainHitsOnGirls: 0, longestChain: 0 };
  let link = 1;
  for (let i = 0; i < MAX_DECISIONS; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'battle-over') {
      const state = engine.state() as Readonly<BattleState>;
      one.engineTurns += d.result.turns;
      one.steps += state.ticks;
      tally(state, one);
      one.outcome = String(d.result.outcome);
      if (link === 1) one.link1Won = one.outcome === 'victory';
      if (one.outcome !== 'victory' || !group.nextGroupId || link >= MAX_LINKS) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    if (!menuTime(engine, d.actorId, one)) continue;
    one.partyTurns += 1;
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  return one;
}

const mean = (xs: readonly number[]): number => (xs.length === 0 ? 0 : Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100);

describe.skipIf(!MEASURE)('RE parity, FFX-2: the hit reaction, wins by chapter, arm and speed (PYREFLY_X2A_MEASURE=1)', () => {
  it('plays the chapters and writes the rows', async () => {
    await registerBattleContent();
    const knobs = ARMS[ARM];
    if (knobs === undefined) throw new Error(`no arm "${ARM}"`);
    const rows: Array<Record<string, unknown>> = [];
    for (const id of CHAPTER_IDS) {
      const chapter = getChapter(id);
      if (!chapter || chapter.game !== 'ffx2') {
        console.log(JSON.stringify({ chapter: id, skipped: 'not an FFX-2 chapter on this build' }));
        continue;
      }
      const runs: One[] = [];
      for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) runs.push(await withReactionKnobsAsync(knobs, () => playChain(chapter, seed)));
      const sum = (f: (r: One) => number): number => runs.reduce((a, r) => a + f(r), 0);
      rows.push({
        chapter: id,
        arm: ARM,
        speed: SPEED,
        seeds: runs.length,
        firstSeed: FIRST_SEED,
        perSeed: runs.map((r) => (r.outcome === 'victory' ? 'W' : r.outcome === 'defeat' ? 'L' : 'U')).join(''),
        wins: runs.filter((r) => r.outcome === 'victory').length,
        losses: runs.filter((r) => r.outcome === 'defeat').length,
        unresolved: runs.filter((r) => r.outcome !== 'victory' && r.outcome !== 'defeat').length,
        link1Wins: runs.filter((r) => r.link1Won).length,
        sums: {
          partyTurns: sum((r) => r.partyTurns), engineTurns: sum((r) => r.engineTurns), minutes: Math.round((sum((r) => r.steps) / STEPS_PER_SECOND / 60) * 100) / 100,
          partyKos: sum((r) => r.partyKos), invalidated: sum((r) => r.invalidated), chainHitsOnEnemies: sum((r) => r.chainHitsOnEnemies),
          chainHitsOnGirls: sum((r) => r.chainHitsOnGirls), longestChain: sum((r) => r.longestChain),
        },
        meanLongestChain: mean(runs.map((r) => r.longestChain)),
      });
    }
    for (const row of rows) console.log(JSON.stringify(row));
    if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 1));
  }, 20_000_000);
});
