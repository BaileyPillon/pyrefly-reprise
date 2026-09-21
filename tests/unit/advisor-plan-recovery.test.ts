/**
 * **The card recovers a fight it did not start.**
 *
 * The acceptance bot in `advisor-plan.test.ts` starts every chapter from its
 * opening board. A player does not: they arrive at the card after several turns
 * of their own, often with an ally on the floor, a status on and MP spent. The
 * question here is whether the advice is still an answer from *there*.
 *
 * Each chapter is walked to a real mid-fight board under a **wasteful** prefix —
 * a driver that deliberately spends turns on the least useful legal row it can
 * find — and the card then has to take the fight from wherever that left it.
 * The bar is not "always wins": a board can be lost before the card ever sees
 * it, and a card that claimed otherwise would be lying. The bar is that the
 * card **keeps giving a legal, non-empty answer every turn and the fight
 * resolves**, on every chapter, in both games.
 *
 * ## Which game
 *
 * **Both** [AGENTS.md rule 14] — five chapters, three FFX and two FFX-2. The
 * recovery rule is a property of advice; what a bad board *looks* like is each
 * game's own business, which is why the prefix is the engine's own rows rather
 * than a hand-written state.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, Command, Decision } from '../../src/battle/common/types.ts';
import { CHAPTER_IDS, gameOf, harnessFor, MAX_STEPS } from '../../critic/bench/advisor-v2/harness.ts';
import { buildAdvisorView, ownedRow, metaRowFor } from '../../src/engine/tactics/advisor.ts';

/**
 * The least useful thing on the menu: no heal, no revive, no attack if anything
 * else is offered. Spending eight turns on this is how a seeded bad state is
 * produced without inventing one.
 */
function wasteful(commands: readonly AvailableCommand[]): Command | null {
  const legal = commands.filter((c) => c.enabled && c.validTargets.length > 0);
  if (legal.length === 0) return null;
  const rank = (c: AvailableCommand): number => {
    if (/potion|cure|life|phoenix|elixir|remedy|revive/i.test(c.label)) return 3;
    if (c.command.kind === 'attack' || c.command.kind === 'overdrive') return 2;
    return 1;
  };
  const worst = [...legal].sort((a, b) => rank(a) - rank(b))[0]!;
  return { ...worst.command, targets: [worst.validTargets[0]!] } as Command;
}

describe('the card takes over a fight that was already going badly', () => {
  for (const chapterId of CHAPTER_IDS) {
    it(`${chapterId} (${gameOf(chapterId)}): answers every turn and resolves`, () => {
      const { engine, options } = harnessFor(chapterId, 5);
      // Five, not ten: Chapter 1 is lost outright in six decisions of wasteful
      // play, and a prefix that ends the fight before the card is consulted is
      // not a recovery test.
      const PREFIX = 5;
      let decisions = 0;
      let silent = 0;
      const illegal: string[] = [];
      let outcome = 'unresolved';

      for (let i = 0; i < MAX_STEPS; i += 1) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') {
          outcome = String((d as { result?: { outcome?: string } }).result?.outcome ?? 'over');
          break;
        }
        if (d.kind === 'waiting') {
          engine.tick?.(Math.max(1, (d as { nextEventMs: number }).nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        decisions += 1;

        let chosen: Command | null;
        if (decisions <= PREFIX) {
          chosen = wasteful(d.commands);
        } else {
          const state = engine.state();
          const view = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, options);
          if (!view || view.suggestions.length === 0) {
            silent += 1;
            chosen = wasteful(d.commands);
          } else {
            // Whatever the board looks like, the card still only ever names a
            // row this actor can press right now.
            for (const s of view.suggestions) {
              const owned =
                ownedRow(d.commands, s.command) ?? metaRowFor(d.commands, d.actorId, s.command);
              if (owned === null || !owned.enabled) {
                illegal.push(`${chapterId} decision ${decisions}: ${s.label}`);
              }
            }
            expect(view.actorId).toBe(d.actorId);
            chosen = view.suggestions[0]!.command;
          }
        }
        if (!chosen) break;
        engine.submit(chosen);
      }

      expect(decisions, `${chapterId} reached the card`).toBeGreaterThan(PREFIX);
      expect(illegal).toEqual([]);
      // Silence is the failure the fix-3 passes were about: 138 of 166
      // decisions with an ally down once produced no card at all.
      expect(silent, `${chapterId}: the card went silent ${silent} times`).toBe(0);
      expect(outcome, `${chapterId} never resolved`).not.toBe('unresolved');
    }, 120_000);
  }
});

describe('an ally on the floor always gets an answer', () => {
  /**
   * Kept from the shipped behaviour and re-asserted from a *bad* board rather
   * than a clean one: the wasteful prefix above is exactly how somebody ends up
   * on the floor with no Phoenix Down left.
   */
  for (const chapterId of ['seymour-flux', 'ffx2-bahamut'] as const) {
    it(`${chapterId}: a downed ally is never answered with silence`, () => {
      // Driven by the wasteful bot throughout: nobody falls over while the card
      // is playing well, which is the point — the board this asserts on is one
      // the player made, not one the card made.
      let sawDown = 0;
      for (let seed = 1; seed <= 12 && sawDown < 6; seed += 1) {
      const { engine, options } = harnessFor(chapterId, seed);
      for (let i = 0; i < MAX_STEPS && sawDown < 6; i += 1) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          engine.tick?.(Math.max(1, (d as { nextEventMs: number }).nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        const state = engine.state();
        const down = state.activeIds.filter((id) => state.combatants[id]?.alive === false);
        const view = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, options);
        if (down.length > 0) {
          sawDown += 1;
          expect(view, `${chapterId}: no card with ${down.length} down`).not.toBeNull();
          expect(view!.suggestions.length).toBeGreaterThan(0);
          // Either the raise is on the card, or the note says what to do about
          // the body — never both silent.
          const mentions =
            view!.note.length > 0 ||
            view!.suggestions.some((s) => (s.command.targets as readonly string[]).some((t) => down.includes(t)));
          expect(mentions, `${chapterId}: card said nothing about the floor`).toBe(true);
        }
        const chosen = wasteful(d.commands);
        if (!chosen) break;
        engine.submit(chosen);
      }
      }
      expect(sawDown, `${chapterId} put nobody on the floor`).toBeGreaterThan(0);
    }, 120_000);
  }
});
