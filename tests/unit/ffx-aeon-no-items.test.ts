/**
 * **PR-0155: an FFX aeon's menu has no Item command.**
 *
 * The aeon command set in `research/ffx-combat-core.md` §6.2 / §6.3 (from the
 * decompiled `ffx_command.csv`) is Attack, the aeon's own Special / Magic, its
 * Overdrive, Shield, Boost and Dismiss: no Item row. §6.1 adds that the party's
 * items cannot even be aimed at an aeon. Before this fix `commands.ts` built the
 * party's Item rows for any actor, and in the round-11 real-key win Ifrit, Ixion
 * and Shiva threw Fire Gems and Ice Gems (critic/rounds/round-11.md, PR-0155).
 *
 * The acceptance half is a seeded engine check: every aeon, summoned in the
 * chapters that ship them, is offered no `kind: 'item'` row and an Item command
 * submitted for one is refused. The measure half (`PYREFLY_MEASURE=1`) runs the
 * shipped `intendedStrategy` through every FFX chapter's whole chain on 40 seeds
 * and prints one JSON line per chapter, with how many item actions aeons took.
 * **Measure, never tune**: no win rate is pinned.
 *
 * **Game case: FFX only.** FFX-2 has no aeons on the party side [AGENTS.md rule 14].
 */

import { beforeAll, describe, expect, it } from 'vitest';
import type { BattleEngine, BattleSetup, Command, Decision, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { CHAPTERS, UNLISTED_CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView } from '../../src/engine/tactics/advisor.ts';

const MEASURE = process.env['PYREFLY_MEASURE'] === '1';
const SEEDS = Array.from({ length: MEASURE ? 40 : 3 }, (_, i) => i + 1);
const MAX_DECISIONS = 60_000;

const FFX_CHAPTERS: readonly Chapter[] = [...CHAPTERS, ...UNLISTED_CHAPTERS].filter((c) => c.game === 'ffx');

type Input = Extract<Decision, { kind: 'player-input' }>;

interface Tally {
  aeonTurns: number;
  aeonItemRows: number;
  aeonItemActions: number;
}

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const t = row.validTargets[0];
  return { ...row.command, targets: row.command.targets.length ? row.command.targets : t ? [t] : [] } as Command;
}

/** One chapter, every link, the shipped strategy; counts what aeons were offered and did. */
function runChapter(chapter: Chapter, seed: number, tally: Tally): string {
  const engine: BattleEngine = new FFXEngine({ autoResolveMinigames: true });
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group: EnemyGroupDef = chapter.enemyGroupRef;
  engine.setSeed(seed);
  engine.init(setup);
  for (let link = 1; ; link++) {
    let outcome = 'unfinished';
    for (let i = 0; i < MAX_DECISIONS; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        outcome = d.result.outcome;
        break;
      }
      if (d.kind !== 'player-input') continue;
      const actor = engine.state().combatants[d.actorId];
      const isAeon = actor?.side === 'aeon';
      if (isAeon) {
        tally.aeonTurns += 1;
        tally.aeonItemRows += d.commands.filter((c) => c.command.kind === 'item').length;
      }
      const picked = intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d);
      if (isAeon && picked.kind === 'item') tally.aeonItemActions += 1;
      engine.submit(picked);
    }
    if (outcome !== 'victory' || !group.nextGroupId) return outcome;
    const next = ENEMY_GROUPS_BY_ID[group.nextGroupId];
    if (!next) throw new Error(`${chapter.id}: chain points at ${group.nextGroupId} with no formation`);
    setup = setupForNextLink(setup, next, engine.state(), seed + link);
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }
}

beforeAll(async () => {
  await registerBattleContent();
});

describe('PR-0155: FFX aeons are offered no Item rows (FFX only)', () => {
  it('every FFX chapter is covered', () => {
    expect(FFX_CHAPTERS.map((c) => c.id)).toEqual(
      expect.arrayContaining(['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania']),
    );
  });

  it('a summoned aeon in Chapter I has no Item row, and an Item command for it is refused', () => {
    const chapter = FFX_CHAPTERS.find((c) => c.id === 'seymour-flux')!;
    const engine: BattleEngine = new FFXEngine({ autoResolveMinigames: true });
    engine.setSeed(1);
    engine.init(setupForChapter(chapter, 1));
    let summoned = 0;
    for (let i = 0; i < 4000 && summoned < 3; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const actor = engine.state().combatants[d.actorId]!;
      if (actor.side === 'aeon') {
        summoned += 1;
        expect(d.commands.some((c) => c.command.kind === 'item')).toBe(false);
        // The move advisor ranks only offered rows, so it proposes no item either.
        const view = buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands });
        expect(view?.suggestions.length ?? 0).toBeGreaterThan(0);
        expect(view!.suggestions.some((s) => s.command.kind === 'item')).toBe(false);
        // A hand-built Item command is refused: nothing is spent, no action
        // starts, and the same aeon is asked again.
        const itemId = chapter.buildRef.inventory.find((e) => e.count > 0)!.itemId;
        const foe = Object.values(engine.state().combatants).find((c) => c.side === 'enemy' && c.alive && !c.removed)!;
        const events = engine.submit({ kind: 'item', id: itemId, targets: [foe.id] });
        expect(events.some((e) => e.type === 'action-start')).toBe(false);
        const again = engine.nextDecision();
        expect(again.kind === 'player-input' && again.actorId).toBe(d.actorId);
        engine.submit({ kind: 'dismiss', targets: [] });
        continue;
      }
      // Summon at the first chance; otherwise the shipped line (which brings Yuna in).
      const summon = d.commands.find((c) => c.enabled && c.command.kind === 'summon');
      engine.submit(summon ? summon.command : (intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d)));
    }
    expect(summoned).toBeGreaterThan(0);
  });

  it.each(FFX_CHAPTERS.map((c) => [c.id, c] as const))('%s: aeons take no item action under the shipped line', (_id, chapter) => {
    const tally: Tally = { aeonTurns: 0, aeonItemRows: 0, aeonItemActions: 0 };
    let wins = 0;
    for (const seed of SEEDS) if (runChapter(chapter, seed, tally) === 'victory') wins += 1;
    if (MEASURE) {
      console.log(JSON.stringify({ chapter: chapter.id, number: chapter.number, seeds: SEEDS.length, wins, ...tally }));
    }
    expect(tally.aeonItemRows).toBe(0);
    expect(tally.aeonItemActions).toBe(0);
  }, 600_000);
});
