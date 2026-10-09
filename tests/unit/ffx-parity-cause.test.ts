/**
 * **RE-parity measurement, FFX: WHY a chapter moved** (`docs/handoff/re-parity-w2.md` section 5).
 *
 * `ffx-parity-measure.test.ts` says how often each chapter is won. This file plays the same chapters the same way (the shipped
 * `intendedStrategy` through each chapter's whole chain, seeds 1 to N) and tallies the causes, so two engines can be compared
 * line by line instead of by one win rate:
 *
 * - party and aeon KOs by the ability that was resolving ("tick" when none was: Regen on a Zombie, Poison, Doom),
 * - statuses added to the party and to the enemies, by status and ability,
 * - uses, hits, misses, crits and total damage of every ability, by side (P party and aeons, E enemies),
 * - turns by side.
 *
 * Run it on two trees and diff the two JSON files with `tools/parity-cause-compare.mjs`. It found the one wiring omission the
 * oracle tests could not see (a Regen that lands did not reset its holder's tick counter: KOs with no action resolving went from
 * 0.58 to 3.89 a seed in Chapter II).
 *
 * Runs only with `PYREFLY_MEASURE=1`; `PYREFLY_MEASURE_SEEDS=N` (default 12), `PYREFLY_MEASURE_CHAPTERS=a,b`,
 * `PYREFLY_MEASURE_CAUSE_OUT=<file>` writes the JSON. Measure, never tune: nothing here changes a number.
 *
 * Game case: **FFX only**.
 */

import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { BattleEvent, BattleSetup, BattleState, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const OUT = process.env['PYREFLY_MEASURE_CAUSE_OUT'];
const SEED_COUNT = Math.max(1, Number(process.env['PYREFLY_MEASURE_SEEDS'] ?? '12') || 12);
const ONLY = (process.env['PYREFLY_MEASURE_CHAPTERS'] ?? '').split(',').filter((s) => s.length > 0);
const MAX_STEPS = 200_000;
const MAX_LINKS = 12;

type Input = Extract<Decision, { kind: 'player-input' }>;
type Tally = Record<string, number>;

interface ChapterTally {
  seeds: number;
  wins: number;
  /** Party and aeon KOs, by the ability that was resolving ('tick' when none). */
  partyKoBy: Tally;
  /** Statuses added to the party and aeons, `status <- ability` ('tick' when none was resolving). */
  statusOnParty: Tally;
  statusOnEnemy: Tally;
  /** Per `P:ability` / `E:ability`. */
  uses: Tally;
  hits: Tally;
  misses: Tally;
  crits: Tally;
  damage: Tally;
  /** Turns taken, by side. */
  turns: Tally;
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

function bump(t: Tally, key: string, n = 1): void {
  t[key] = (t[key] ?? 0) + n;
}

/** Add one link's event log to the tally. */
function tallyLink(state: Readonly<BattleState>, into: ChapterTally): void {
  let current: { actor: string; ability: string } | null = null;
  const sideOf = (id: string | undefined): string => (id ? (state.combatants[id]?.side ?? '?') : '?');
  const mine = (side: string): boolean => side === 'party' || side === 'aeon';
  const tag = (actor: string, ability: string): string => `${mine(sideOf(actor)) ? 'P' : 'E'}:${ability}`;
  for (const e of state.log as readonly BattleEvent[]) {
    switch (e.type) {
      case 'turn-start':
        bump(into.turns, mine(sideOf(e.actorId)) ? 'party' : 'enemy');
        break;
      case 'action-start':
        current = { actor: e.actorId, ability: e.abilityId ?? e.command.kind };
        bump(into.uses, tag(current.actor, current.ability));
        break;
      case 'action-end':
        current = null;
        break;
      case 'damage':
        if (!current) break;
        bump(into.hits, tag(current.actor, current.ability));
        if (e.crit) bump(into.crits, tag(current.actor, current.ability));
        if (e.amount > 0) bump(into.damage, tag(current.actor, current.ability), e.amount);
        break;
      case 'miss':
        if (current) bump(into.misses, tag(current.actor, current.ability));
        break;
      case 'status-add':
        bump(mine(sideOf(e.targetId)) ? into.statusOnParty : into.statusOnEnemy, `${e.status} <- ${current ? current.ability : 'tick'}`);
        break;
      case 'ko':
        if (mine(sideOf(e.targetId))) bump(into.partyKoBy, current ? current.ability : 'tick');
        break;
      default:
        break;
    }
  }
}

/** Plays one seed through the chapter's whole chain (the loop of `ffx-parity-measure.test.ts`). */
async function playChain(chapter: Chapter, seed: number, into: ChapterTally): Promise<string> {
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(setup.seed);
  engine.init(setup);
  let outcome = 'unresolved';
  let link = 1;
  for (let step = 0; step < MAX_STEPS; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved' || d.kind === 'waiting') continue;
    if (d.kind === 'battle-over') {
      tallyLink(engine.state() as Readonly<BattleState>, into);
      outcome = String(d.result.outcome);
      if (outcome !== 'victory' || !group.nextGroupId || link >= MAX_LINKS) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  return outcome;
}

describe.skipIf(!MEASURE)('RE parity, FFX: the causes behind each chapter (PYREFLY_MEASURE=1)', () => {
  it('tallies KOs, statuses and ability uses over each chapter\'s whole chain', async () => {
    await registerBattleContent();
    const result: Record<string, ChapterTally> = {};
    for (const chapter of CHAPTERS.filter((c) => c.game === 'ffx' && (ONLY.length === 0 || ONLY.includes(c.id)))) {
      const t: ChapterTally = { seeds: 0, wins: 0, partyKoBy: {}, statusOnParty: {}, statusOnEnemy: {}, uses: {}, hits: {}, misses: {}, crits: {}, damage: {}, turns: {} };
      for (let seed = 1; seed <= SEED_COUNT; seed += 1) {
        const outcome = await playChain(chapter, seed, t);
        t.seeds += 1;
        if (outcome === 'victory') t.wins += 1;
      }
      result[chapter.id] = t;
    }
    if (OUT) writeFileSync(OUT, JSON.stringify(result, null, 1));
  }, 1_800_000);
});
