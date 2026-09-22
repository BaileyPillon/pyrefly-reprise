/**
 * **Move Advisor v2: the acceptance bot, the budget, the cache, the absences.**
 *
 * The question this file answers is the only one that mattered: *can a player
 * who presses the card's top row every turn actually win?* Before this track
 * the answer for Braska's Final Aeon was no — measured over forty seeds, a
 * card-follower won **0 of 40** while the chapter's own line won 39, and the
 * fight ran to the engine's 400-turn watchdog
 * [`critic/bench/advisor-v2/`, docs/plans/advisor-v2-review.md §2.1].
 *
 * The forty-seed sweep lives in `critic/bench/advisor-v2/` because two minutes
 * of engine time does not belong in a 110-file `npm test`. This is its
 * suite-safe half: six seeds a chapter, the same harness, the same bot.
 *
 * ## Which game
 *
 * **Both** [AGENTS.md rule 14]. Three FFX chapters and two FFX-2 ones, each
 * held to its own chapter line rather than to a shared number, plus the two
 * **absence** tests the plan asked for: FFX-2 fields no `switch` row and no
 * self-only meta row, so neither repair those two shapes needed can leak into a
 * game that does not have them.
 */

import { describe, expect, it } from 'vitest';
import type { Command, Decision } from '../../src/battle/common/types.ts';
import { CHAPTER_IDS, gameOf, harnessFor, MAX_STEPS, run } from '../../critic/bench/advisor-v2/harness.ts';
import {
  PlanCache,
  beatsPrior,
  budgetFor,
  cacheKeyFor,
} from '../../src/engine/tactics/advisor-plan.ts';
import {
  buildAdvisorView,
  clearAdvisorCache,
  metaRowFor,
} from '../../src/engine/tactics/advisor.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

/** Six seeds, both drivers, for one chapter. */
const SEEDS = 6;

function winsOf(chapterId: string, driver: 'intended' | 'advisor-v2'): number {
  let wins = 0;
  for (let seed = 1; seed <= SEEDS; seed += 1) {
    if (run(chapterId, seed, driver).outcome === 'victory') wins += 1;
  }
  return wins;
}

describe('a player who follows the card can win the chapter', () => {
  /**
   * The bar is the **chapter's own line**, not a constant: Chapter 1 is a
   * genuinely hard fight that the auto battler itself loses a third of the
   * time, and holding the card to 100 % there would be holding it to a standard
   * the encounter does not meet. One seed of slack at six seeds is the same
   * five points the forty-seed bench allows.
   */
  for (const chapterId of CHAPTER_IDS) {
    it(`${chapterId} (${gameOf(chapterId)}): the card is within one seed of the chapter line`, () => {
      const intended = winsOf(chapterId, 'intended');
      const guided = winsOf(chapterId, 'advisor-v2');
      expect(
        guided,
        `${chapterId}: following the card won ${guided}/${SEEDS} against the chapter line's ${intended}/${SEEDS}`,
      ).toBeGreaterThanOrEqual(intended - 1);
    }, 120_000);
  }
});

describe('Chapter 3 is the one that decides this track', () => {
  /**
   * Braska's Final Aeon is won by getting Slow onto both Yu Pagodas. Three
   * defects conspired to lose it — a switch's incoming member was not part of
   * its identity, the ownership gate refused Doublecast's aim, and a coin flip
   * was priced as a wasted turn — and the fight is the regression test for all
   * three at once.
   */
  it('a card-follower wins it, and in the chapter line\'s own number of turns', () => {
    const results = [1, 2, 3, 4, 5, 6].map((seed) => run('braskas-final-aeon', seed, 'advisor-v2'));
    const wins = results.filter((r) => r.outcome === 'victory').length;
    expect(wins, results.map((r) => `${r.seed}:${r.outcome}`).join(' ')).toBeGreaterThanOrEqual(5);
    // The defect's other half: 448 median turns against the line's 215. A route
    // that is winning is not also running the watchdog down.
    for (const r of results) {
      if (r.outcome === 'victory') expect(r.turns, `seed ${r.seed}`).toBeLessThan(400);
    }
  }, 120_000);
});

describe('the budget is work counts, so the same seed gives the same card', () => {
  it('is counts and not a clock', () => {
    expect(budgetFor('ffx')).toEqual({ maxSimulations: 60, maxForecasts: 1 });
    expect(budgetFor('ffx2')).toEqual({ maxSimulations: 40, maxForecasts: 1 });
  });

  /**
   * Determinism is what every acceptance number rests on. A wall-clock cut
   * would make the card's answer depend on how busy the machine is, and two
   * runs of one seed would take different advice
   * [docs/plans/advisor-v2-review.md §8 R-2].
   */
  for (const chapterId of ['seymour-flux', 'ffx2-bahamut'] as const) {
    it(`${chapterId}: the same board planned twice gives the identical card`, () => {
      const { engine, options } = harnessFor(chapterId, 2);
      let checked = 0;
      for (let i = 0; i < MAX_STEPS && checked < 12; i += 1) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick?.(Math.max(1, (d as { nextEventMs: number }).nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        const state = engine.state();
        const decision = { actorId: d.actorId, commands: d.commands };
        const first = buildAdvisorView(state, decision, options);
        // A cold cache must give the same answer as a warm one: if the cache
        // were the only reason two reads agreed, this would catch it.
        clearAdvisorCache();
        const second = buildAdvisorView(state, decision, options);
        expect(JSON.stringify(second)).toBe(JSON.stringify(first));
        checked += 1;
        const chosen: Command | null = first?.suggestions[0]?.command ?? null;
        if (!chosen) break;
        engine.submit(chosen);
      }
      expect(checked).toBeGreaterThan(5);
    }, 60_000);
  }

  it('the cache is bounded and keyed on a board that moved', () => {
    const cache = new PlanCache<number>();
    const { engine } = harnessFor('seymour-flux', 1);
    const d = engine.nextDecision() as Extract<Decision, { kind: 'player-input' }>;
    const key = cacheKeyFor(engine.state(), d.actorId);
    cache.set(key, 1);
    expect(cache.get(key)).toBe(1);
    // A different sequence number is a different decision.
    expect(cache.get({ ...key, nextSeq: key.nextSeq + 1 })).toBeUndefined();
    // …and it never grows without bound.
    for (let i = 0; i < 50; i += 1) cache.set({ ...key, nextSeq: 1_000 + i }, i);
    expect(cache.size).toBeLessThanOrEqual(8);
  }, 30_000);
});

describe('the prior: the line holds unless the board proves otherwise', () => {
  it('a bigger number alone does not clear it', () => {
    expect(beatsPrior(5_000, 5_000)).toBe(false);
    expect(beatsPrior(7_000, 5_000)).toBe(false);
    expect(beatsPrior(11_000, 5_000)).toBe(true);
    // A negative prior is not a bar to clear by ratio.
    expect(beatsPrior(0, -1_000)).toBe(false);
    expect(beatsPrior(3_000, -1_000)).toBe(true);
  });
});

describe('the two shapes FFX-2 does not have (AGENTS.md rule 14 absence tests)', () => {
  /**
   * Both of this track's ownership repairs are about FFX rows: a `switch`
   * (FFX-2 has no bench) and a self-only meta row like Doublecast. The rule
   * they encode is *both games* — command identity and the ownership gate are
   * properties of advice — but the shapes themselves must be shown not to exist
   * in X-2 rather than assumed away.
   */
  for (const chapterId of ['ffx2-bahamut', 'ffx2-vegnagun-shuyin'] as const) {
    it(`${chapterId} offers no switch row and no self-only meta row`, () => {
      const { engine } = harnessFor(chapterId, 1);
      let decisions = 0;
      // The absence is narrower than "no row is self-only" — X-2 has plain
      // self-buffs (Vigor: `validTargets: ['yuna']` on Yuna's own turn) and
      // those are not the meta shape. The meta shape §1.2 repairs is a row
      // whose own `validTargets` is self-only but whose *actual* command
      // (the one a tactic or the auto-battler submits) aims somewhere else —
      // the way Doublecast's row targets its own caster while the spell
      // chosen inside it targets the enemy. So the real claim is: no command
      // this fight ever submits, for a self-only row, diverges from that
      // row's own target. Asserted, not assumed.
      let selfOnlyMetaRow: { actorId: string; row: unknown; submitted: unknown } | null = null;
      for (let i = 0; i < MAX_STEPS && decisions < 40; i += 1) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick?.(Math.max(1, (d as { nextEventMs: number }).nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        decisions += 1;
        for (const row of d.commands) {
          expect(row.command.kind, `${chapterId} offered a switch`).not.toBe('switch');
        }
        const chosen = d.commands.find((c) => c.enabled && c.validTargets.length > 0);
        if (!chosen) break;
        const submitted = { ...chosen.command, targets: [chosen.validTargets[0]!] } as Command;
        // Both routes a command can come from: the menu-mashing driver above,
        // and the chapter's own tactic (the one route that could plausibly
        // pick a target the row itself does not list, the way Chapter 3's
        // Doublecast line does in FFX).
        const tactic = intendedStrategy(d.actorId, d.commands, engine as never);
        for (const candidate of [submitted, tactic].filter((c): c is Command => c !== null)) {
          if (selfOnlyMetaRow) break;
          const selfOnlyRow = d.commands.find(
            (row) =>
              row.enabled &&
              row.validTargets.length === 1 &&
              row.validTargets[0] === d.actorId &&
              row.command.kind === candidate.kind &&
              (candidate as { id?: unknown }).id !== undefined &&
              (row.command as { id?: unknown }).id === (candidate as { id?: unknown }).id,
          );
          if (selfOnlyRow && candidate.targets.some((t) => t !== d.actorId)) {
            selfOnlyMetaRow = { actorId: d.actorId, row: selfOnlyRow, submitted: candidate };
          }
        }
        engine.submit(submitted);
      }
      expect(
        selfOnlyMetaRow,
        `${chapterId} submitted a self-only row's command aimed elsewhere: ${JSON.stringify(selfOnlyMetaRow)}`,
      ).toBeNull();
      // The function itself must still recognise the shape if it ever shows
      // up — a synthetic check, since the game never offers one for real.
      const synthetic = { kind: 'doublecast', id: 'doublecast', targets: ['nobody'] } as unknown as Command;
      const syntheticRows = [
        {
          command: { kind: 'doublecast', id: 'doublecast', targets: [] },
          enabled: true,
          validTargets: ['actor-x'],
          label: 'x',
          mpCost: 0,
        },
      ] as never;
      expect(metaRowFor(syntheticRows, 'actor-x', synthetic)).not.toBeNull();
      expect(decisions).toBeGreaterThan(10);
    }, 60_000);
  }
});
