/**
 * **The state guard**: does a recommendation change anything measurable on
 * *this* board?
 *
 * Split out of `./advisor.ts` so the card's own file stays readable, and a
 * sibling of the other four readers the advisor composes
 * (`./advisor-revive.ts`, `./advisor-forecast.ts`, `./advisor-floor.ts`,
 * `./advisor-menu.ts`). Pure, DOM-free and engine-agnostic: it reads one
 * previewed outcome and nothing else.
 */

import type { BattleEvent, Command, CombatantId } from '../../battle/common/types.ts';
import type { SimOutcome } from '../../battle/ffx/simulate.ts';

/**
 * Command kinds a preview **cannot** price, and which are therefore never
 * judged by {@link changesNothing}.
 *
 * `simulate.ts` resolves the action and nothing after it, so for these the
 * absence of damage, healing and status is not evidence of absence of effect:
 *
 *  * `switch` resolves to nothing by construction — it hands the turn to the
 *    incoming member, and `advisor.ts`'s `switchValue` / `SWITCH_PENALTY` are
 *    the whole of its pricing;
 *  * `summon` and `dismiss` change who is standing on the field;
 *  * `spherechange` changes the command set the next turns are chosen from;
 *  * `defend` halves the *next* physical hit, which is the rest of the turn;
 *  * `trigger` is FFX's Talk/Pray shape, whose effect is scripted;
 *  * `escape` never reaches the card at all.
 *
 * Measured rather than listed from memory: a guided replay of Chapter 1 over
 * twelve seeds flagged 76 flat-resolving picks and **every one** of them was a
 * summon, a switch, Auron's Talk or a Grand Summon (`tools/zz-advisor-guard`
 * probe, 2026-09-21). Nothing else in either chapter resolves to nothing.
 */
const UNPRICED_KINDS: ReadonlySet<string> = new Set([
  'switch',
  'summon',
  'dismiss',
  'spherechange',
  'defend',
  'trigger',
  'escape',
]);

/**
 * Events that are bookkeeping rather than an effect on the board.
 *
 * The list is deliberately the *exclusions*: anything a future engine emits
 * counts as "this did something" until somebody names it here, so a new effect
 * can never be silently demoted. `damage` and `heal` are excluded because the
 * HP question is answered by the outcome's own totals, which know the sign —
 * a `damage` event of 0 is not an effect, and a heal aimed at a Zombie is.
 *
 * **`miss` is deliberately not here, and that is measured.** A preview answers
 * every *branch* roll at its median [`simulate.ts` header], so a swing that
 * whiffs in the preview is one whose hit chance is at or under 50 — a coin
 * flip, not an impossibility. Calling a coin flip "nothing" costs fights: with
 * whiffs counted as no-ops, Auron's line at Yunalesca was demoted to a Remedy
 * twenty times over twelve guided seeds and the chapter went from 11 wins in 12
 * to 9 (`tools/zz-advisor-guard` probe, 2026-09-21). A move that was aimed and
 * rolled did something; whether it landed is variance, and variance is what the
 * card's own hit-chance figure is for.
 */
const BOOKKEEPING_EVENTS: ReadonlySet<string> = new Set([
  'turn-start',
  'action-start',
  'action-end',
  'damage',
  'heal',
  'status-tick',
  'message',
  'sensor',
  'script-trigger',
  'atb',
  'camera',
  'vfx',
  'sfx',
  'wait',
  'minigame-request',
]);

/**
 * **The state guard**: did this previewed action change anything measurable on
 * *this* board?
 *
 * The chapter's own line is the card's top row (`advisor.ts` rule 1), and until
 * now it was the top row whether or not it did anything. The critic measured
 * what that costs: over one guided keyboard route of Chapter 4 the card printed
 * the identical row on all 301 samples — "Shell → the party" — while Yuna cast
 * Shell on all thirteen of her turns for one Shell that ever landed, and the
 * guided route ran nine minutes without resolving against two and a half for
 * the route that ignored it [critic round 06, PR-0006, RUBRIC §2, CHK-005].
 *
 * So the tactic's pick now takes the same test the ranked rows already take,
 * and the test is read off **the simulation, not the ability record**: a buff
 * whose status is already on every named target emits no `status-add` (FFX
 * `statuses.ts#applyStatus` and FFX-2 `statuses.ts#applyStatus` both refuse a
 * status that is present), a cure with nothing to cure emits no
 * `status-remove`, an immune Break lands nothing, and a heal aimed at a party
 * already at full moves no HP. Any of those is a turn spent on nothing, and
 * `buildAdvisorView` drops it below every option that does something. A move
 * that *rolled* and whiffed is not one of them — see {@link
 * BOOKKEEPING_EVENTS}.
 *
 * `true` means **nothing measurable happened**. The default is `false`: an
 * action is assumed to do something unless the preview can show that it did
 * not, which is the safe direction for a guard that removes advice.
 *
 * ## Which game
 *
 * **Both.** This is shared advisor plumbing — one card, two engines, and the
 * rule ("do not tell the player to spend a turn on nothing") is a property of
 * advice rather than of either game's mechanics [AGENTS.md rule 14 case:
 * both; `critic/CHECKS.md` CHK-020]. The critic measured the FFX-2 half in
 * Chapter 4 and the FFX half in Chapter 1, and `advisor-noop-guard.test.ts`
 * asserts it over both.
 *
 * @param actorId whose turn this is — their own MP outlay is the *cost* of the
 *   action, never a reason to call it useful.
 */
export function changesNothing(
  actorId: CombatantId,
  command: Command,
  outcome: SimOutcome | null,
): boolean {
  // Nothing was simulated: a switch, priced by `switchValue` instead.
  if (!outcome) return false;
  if (UNPRICED_KINDS.has(command.kind)) return false;
  // The engine refused the command outright. It is already at the bottom of the
  // ranking (`scoreOutcome`), and it is the plainest no-op there is.
  if (outcome.rejected) return true;
  if (outcome.damageToEnemies > 0 || outcome.healingToAllies > 0 || outcome.harmToAllies > 0) {
    return false;
  }
  if (Object.values(outcome.hpDelta).some((d) => d !== 0)) return false;

  // A pure gauge move — FFX's `ctb` pool with no status rider — moves a counter
  // that lives in the engine *runtime*, not in `BattleState`, so a preview
  // rebuilds it and can never see the shift [`simulate.ts#runtimeFor`]. Nothing
  // shipped is shaped like that today (every `ctb` record in `src/data` carries
  // Haste or Slow), and if one ever is, the guard declines to judge it rather
  // than dropping a move whose whole effect it is blind to.
  const def = outcome.ability;
  if (def && def.formula === 'ctb' && def.statusEffects.length === 0) return false;

  for (const event of outcome.events as readonly BattleEvent[]) {
    if (BOOKKEEPING_EVENTS.has(event.type)) continue;
    // The actor's own MP outlay is what the action *costs*. Draining an enemy's
    // MP, or putting MP back into an ally, is an effect and falls through.
    if (event.type === 'mp-damage' && event.targetId === actorId) continue;
    return false;
  }
  return true;
}
