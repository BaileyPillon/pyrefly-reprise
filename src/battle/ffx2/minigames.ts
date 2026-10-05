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

/**
 * The random half of a **human's** Lady Luck spin, drawn from the seeded stream when the overlay is asked for [FFX-2 only].
 *
 * The timed reels (`src/ui/ffx2/ladyLuckTiming.ts`, Bailey's pick A of 2026-10-04) leave exactly one thing to the player:
 * *when* each press lands. Everything else about a spin must still be a function of the seed, so the engine draws it here
 * and hands it to the overlay on the `minigame-request`: which reel each press stops (`stopOrder`, a random permutation of
 * 0..2, the order the pink arrow follows [§3.12: "the slots begin spinning in a random order"]) and where each strip starts
 * (`phases`, in symbols, 0 to `symbolCount`). Before this the overlay drew them itself with `Math.random`. The presses'
 * *timing* never reaches this layer (hard rule 1): the overlay turns it into a symbol and returns the symbols, exactly as
 * it always returned them.
 *
 * Five draws, in this fixed order, made at the request and nowhere else, so an unattended spin (`rollReels`, which never
 * emits a request) and every shipped line of play keep the stream they had.
 */
export function rollReelLayout(
  rng: Rng,
  symbolCount: number,
): { stopOrder: [number, number, number]; phases: [number, number, number] } {
  const order = [0, 1, 2];
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  const n = Math.max(1, symbolCount);
  return {
    stopOrder: order as [number, number, number],
    phases: [rng.next() * n, rng.next() * n, rng.next() * n],
  };
}

/** What a `minigame-request` for `ability` carries beyond the ability's own `extra`: the seeded layout of a Lady Luck spin. */
export function requestLayout(ability: AbilityDef, rng: Rng): Record<string, unknown> {
  if (ability.minigame !== 'ladyluck-reels') return {};
  const strip = reelStripOf(ability);
  return rollReelLayout(rng, strip.length > 0 ? strip.length : DEFAULT_REEL_STRIP.length);
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
