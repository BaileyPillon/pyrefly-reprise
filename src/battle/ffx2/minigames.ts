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

import type { Command, MinigameKind, MinigameResult, ReelResult, Rng } from '../common/types.ts';

/** Attack Reels-style strip. The reel sets are the Lady Luck data agent's. */
const DEFAULT_REEL_STRIP: readonly string[] = ['1hit', '2hit', 'miss'];

/**
 * Trigger Happy default: one hit per R1 press, 0–16, each hit self-chaining.
 * A competent player lands most of them, so the headless default sits high
 * rather than at the midpoint. `[estimate]` — §3.1 publishes the range only.
 */
export function rollTriggerHappy(rng: Rng): number {
  return rng.int(6, 16);
}

/** Reels default: three independent symbols off the strip. §3.12 */
export function rollReels(rng: Rng, strip: readonly string[] = DEFAULT_REEL_STRIP): ReelResult {
  const symbols: [string, string, string] = [rng.pick(strip), rng.pick(strip), rng.pick(strip)];
  const threeOfAKind = symbols[0] === symbols[1] && symbols[1] === symbols[2];
  const hits = symbols.reduce((sum, s) => sum + (s === '2hit' ? 2 : s === '1hit' ? 1 : 0), 0);
  return {
    symbols,
    threeOfAKind,
    hits: threeOfAKind ? hits * 2 : hits,
    timeRemainingMs: 0,
  };
}

/** Roll a default outcome for `kind`. */
export function rollDefault(kind: MinigameKind, rng: Rng): MinigameResult | null {
  if (kind === 'gunner-trigger') {
    return { kind: 'gunner-trigger', trigger: { hits: rollTriggerHappy(rng) } };
  }
  if (kind === 'ladyluck-reels') {
    return { kind: 'ladyluck-reels', reels: rollReels(rng) };
  }
  return null;
}

/** The outcome already attached to a command, if any. */
export function attachedResult(command: Command): MinigameResult | null {
  if (command.kind !== 'overdrive') return null;
  return command.extra ?? null;
}

/**
 * How many hits this action lands, given a minigame outcome.
 *
 * Trigger Happy is one hit per press; the reels contribute `hits` when they
 * carry one. Returns `null` when the outcome does not change the hit count.
 */
export function hitsFromOutcome(outcome: MinigameResult | null): number | null {
  if (!outcome) return null;
  if (outcome.kind === 'gunner-trigger') return Math.max(0, Math.min(16, outcome.trigger.hits));
  if (outcome.kind === 'ladyluck-reels' || outcome.kind === 'wakka-reels') {
    return outcome.reels.hits ?? null;
  }
  return null;
}
