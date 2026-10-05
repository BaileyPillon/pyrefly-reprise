/**
 * The two FFX-2 timed-input overlays [ffx2-combat-core §3.1, §3.12] and the
 * default outcomes the engine rolls when nobody is there to play them.
 *
 * `docs/CONTRACTS.md`, "Minigame protocol": the engine emits a
 * `minigame-request` and **stops**; the UI opens the overlay named by `kind`,
 * then re-submits the *same* command with the outcome attached as `extra`. When
 * `extra` is absent — an AI actor, auto-battle, a deterministic test — the
 * engine rolls a default from the seeded RNG and never emits the request at all.
 * That is what lets e2e run a chapter to victory headlessly.
 */

import type { AbilityDef, Command, MinigameKind, MinigameResult, ReelResult, Rng } from '../common/types.ts';
import { reelStripOf } from './reels.ts';

/**
 * The three symbols every Lady Luck set shares [§3.12]. Only used when a reel
 * command carries no strip of its own, which the shipped data never does.
 *
 * This used to be `['1hit', '2hit', 'miss']` — **Wakka's** Attack Reels strip
 * from FFX, whose symbols X-2's pay table does not contain, so an unattended
 * spin could only ever have been a Dud.
 */
const DEFAULT_REEL_STRIP: readonly string[] = ['red7', 'bar', 'cherry'];

/**
 * Trigger Happy default: one hit per R1 press, 0–16, each hit self-chaining.
 * A competent player lands most of them, so the headless default sits high
 * rather than at the midpoint. `[estimate]` — §3.1 publishes the range only.
 */
export function rollTriggerHappy(rng: Rng): number {
  return rng.int(6, 16);
}

/**
 * Reels default: three independent, uniform symbols off the strip — a spin
 * with nobody timing the presses. §3.12
 *
 * Still exactly three draws, so every replay keeps its place in the seeded
 * stream. X-2's reels have **no hit-count rule** (that is Wakka's Attack
 * Reels), so the result carries no `hits`.
 */
export function rollReels(rng: Rng, strip: readonly string[] = DEFAULT_REEL_STRIP): ReelResult {
  const symbols: [string, string, string] = [rng.pick(strip), rng.pick(strip), rng.pick(strip)];
  return {
    symbols,
    threeOfAKind: symbols[0] === symbols[1] && symbols[1] === symbols[2],
    timeRemainingMs: 0,
  };
}

/** Roll a default outcome for `kind`. `ability` supplies a reel command's own strip. */
export function rollDefault(kind: MinigameKind, rng: Rng, ability?: AbilityDef): MinigameResult | null {
  if (kind === 'gunner-trigger') {
    return { kind: 'gunner-trigger', trigger: { hits: rollTriggerHappy(rng) } };
  }
  if (kind === 'ladyluck-reels') {
    const strip = ability ? reelStripOf(ability) : [];
    return { kind: 'ladyluck-reels', reels: rollReels(rng, strip.length > 0 ? strip : DEFAULT_REEL_STRIP) };
  }
  return null;
}

/**
 * The outcome already attached to a command, if any.
 *
 * X-2's two timed inputs are ordinary menu abilities, so they arrive as
 * `kind: 'ability'` — there is no Overdrive command in this game. Reading
 * `extra` off `'overdrive'` alone meant a human's Trigger Happy count and her
 * three stopped reels were both thrown away and re-rolled by the engine.
 */
export function attachedResult(command: Command): MinigameResult | null {
  if (command.kind !== 'overdrive' && command.kind !== 'ability') return null;
  return command.extra ?? null;
}

/**
 * How many hits this action lands, given a minigame outcome.
 *
 * Trigger Happy is one hit per press. Lady Luck's reels never change a hit
 * count — a spin picks *which ability* fires (`reels.ts`), and that ability
 * keeps its own. Returns `null` when the outcome does not change the count.
 */
export function hitsFromOutcome(outcome: MinigameResult | null): number | null {
  if (!outcome) return null;
  if (outcome.kind === 'gunner-trigger') return Math.max(0, Math.min(16, outcome.trigger.hits));
  return null;
}
