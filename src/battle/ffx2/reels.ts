/**
 * Lady Luck's reels: turning three stopped symbols into the ability that fires
 * [ffx2-combat-core §3.12, verified: 2 sources].
 *
 * A reel command (`x2-lady-luck-attack-reels`, `-magic-reels`) is a
 * **wrapper**: `formula: 'none'`, `power: 0`, `minigame: 'ladyluck-reels'`. It
 * does nothing itself, and until this module existed **nothing resolved a spin
 * at all** — the data file called the pay table "minigame/UI content, not
 * battle data". Measured on the Chapter 5 board with Yuna in the Lady Luck she
 * owns, taking each row exactly as offered: `turn-start, action-start,
 * action-end`, every HP on the field unchanged. No payout, and no Dud either.
 *
 * This has the same *shape* as `src/battle/ffx/reels.ts` and none of its
 * rules. Wakka's Slots match a symbol anywhere and always fire a shot; X-2's
 * are read **left to right** and most spins lose:
 *
 * | Stopped reels | Pays |
 * |---|---|
 * | X - X - X | the top result for X |
 * | X - X - any | the mid result — only where the table has one (no Red 7 / BAR pairs) |
 * | Cherry - any - any | the weakest result |
 * | anything else | **Dud** — 75% of current HP off the whole party, ignoring defence |
 *
 * The table arrives on the wrapper's own `extra.payTable` (authored in
 * `src/data/ffx2/reels.ts`); this layer imports no data.
 */

import type { AbilityDef, AbilityId, CombatantId, ReelResult, Targeting } from '../common/types.ts';
import type { AbilityRegistry, Ffx2Unit } from './internal.ts';

export type LadyLuckTier = 'three' | 'pair' | 'cherry' | 'dud';

/** What one spin resolves to. */
export interface LadyLuckOutcome {
  tier: LadyLuckTier;
  /** The payload ability to resolve instead of the wrapper. */
  abilityId: AbilityId;
  /** True when the payload is for the spinner's own side (Cura, Esuna, Auto-Life, Clean Slate). */
  friendly: boolean;
}

interface PayTable {
  three: Record<string, string>;
  pair: Record<string, string>;
  cherry: string;
  dud: string;
  friendly: string[];
}

/** One spelling per symbol; the overlay has written both `red7` and `7`. */
const ALIASES: Readonly<Record<string, string>> = {
  '7': 'red7',
  'red-7': 'red7',
  seven: 'red7',
  cherries: 'cherry',
};

function normalise(symbol: string): string {
  const key = symbol.trim().toLowerCase();
  return ALIASES[key] ?? key;
}

function stringMap(raw: unknown): Record<string, string> {
  if (typeof raw !== 'object' || raw === null) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v === 'string') out[normalise(k)] = v;
  return out;
}

function payTableOf(def: AbilityDef): PayTable | null {
  const raw = def.extra?.['payTable'];
  if (typeof raw !== 'object' || raw === null) return null;
  const t = raw as Record<string, unknown>;
  if (typeof t['cherry'] !== 'string' || typeof t['dud'] !== 'string') return null;
  const friendly = Array.isArray(t['friendly']) ? t['friendly'].filter((v): v is string => typeof v === 'string') : [];
  return { three: stringMap(t['three']), pair: stringMap(t['pair']), cherry: t['cherry'], dud: t['dud'], friendly };
}

/** The strip the wrapper's reels carry, for the engine's own unattended roll. */
export function reelStripOf(def: AbilityDef): string[] {
  const raw = def.extra?.['symbols'];
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
}

/**
 * Resolve one spin of `def` into the payload that actually fires.
 *
 * Returns `null` only when the wrapper carries no pay table, which is a data
 * error rather than a game outcome; the caller then leaves the wrapper alone so
 * the failure is visible instead of silent. A symbol the table does not know —
 * another set's strip, a typo — is simply not a win: it falls through to the
 * Dud, never to an invented payout.
 */
export function resolveLadyLuckSpin(def: AbilityDef, reels: ReelResult): LadyLuckOutcome | null {
  const table = payTableOf(def);
  if (!table) return null;

  const [a, b, c] = reels.symbols.map(normalise) as [string, string, string];
  const outcome = (tier: LadyLuckTier, abilityId: string): LadyLuckOutcome => ({
    tier,
    abilityId,
    friendly: table.friendly.includes(abilityId),
  });

  const three = a === b && b === c ? table.three[a] : undefined;
  if (three !== undefined) return outcome('three', three);

  const pair = a === b ? table.pair[a] : undefined;
  if (pair !== undefined) return outcome('pair', pair);

  if (a === 'cherry') return outcome('cherry', table.cherry);
  return outcome('dud', table.dud);
}

/** A spin, ready to hand to `resolveAbility` in the wrapper's place. */
export interface ShapedSpin {
  outcome: LadyLuckOutcome;
  /** The payload, re-cut for a reel: free, and aimed at the side it is for. */
  def: AbilityDef;
  /** The spinner's chosen targets that are legal for it; empty lets targeting pick. */
  targets: CombatantId[];
}

/**
 * Swap the wrapper for what the spin paid.
 *
 * - **Free.** The reel costs 0 MP and the payload's own cost is not charged —
 *   Ultima off three Red 7s is not a 60 MP cast. Its constant is inherited
 *   untouched [§2.9.1: "inherits that entry's constant"].
 * - **Aimed at the right side.** The reel is aimed before it is spun (`Tgt: 1 /
 *   any`), so the payload cannot be known when the target is chosen. A
 *   single-target payload keeps the chosen target when it is on the side the
 *   payload is *for* and is otherwise re-aimed by the seeded RNG; party-wide,
 *   self and random payloads keep their own targeting, which is already
 *   relative to the spinner. §3.12 does not cover a heal rolled at an enemy —
 *   this is the project's rule, not a sourced one.
 *
 * Returns `null` when the wrapper has no table or names a payload the registry
 * does not have; the caller then resolves the wrapper as it always did.
 */
export function shapeLadyLuckSpin(
  def: AbilityDef,
  reels: ReelResult,
  abilities: AbilityRegistry,
  units: readonly Ffx2Unit[],
  actor: Ffx2Unit,
  requested: readonly CombatantId[],
): ShapedSpin | null {
  const outcome = resolveLadyLuckSpin(def, reels);
  if (!outcome) return null;
  const payload = abilities.get(outcome.abilityId);
  if (!payload) return null;

  const single = payload.targeting.startsWith('single');
  const targeting: Targeting = single ? (outcome.friendly ? 'single-ally' : 'single-enemy') : payload.targeting;
  const targets = requested.filter((id) => {
    const unit = units.find((u) => u.id === id);
    return unit !== undefined && (unit.side === actor.side) === outcome.friendly;
  });
  return { outcome, def: { ...payload, mpCost: 0, targeting }, targets };
}
