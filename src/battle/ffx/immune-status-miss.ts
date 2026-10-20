/**
 * **A status move the target is wholly immune to says IMMUNE** (release 55, FOC54-003 of the Release 54 focused review; **FFX only**).
 *
 * Release 54 turned on the boss-data corrections, and with them Seymour Flux cannot be Slowed (D7) and the Yu Pagodas refuse Shell, Protect, Reflect and the Nul
 * spells (D10). The status step refuses those correctly, but the move then lands nothing and the engine said nothing, which on screen reads like a broken button
 * (the review's words: "lands nothing and shows nothing"). Scan on a Pagoda was the one refusal that already read as an immune miss (`sensor.ts#revealTarget`).
 *
 * The rule, in {@link statusRefusedAsImmune}: a connecting hit that moved no HP, MP or CTB, whose status step added and removed nothing, and whose row names a status
 * the target resists with the full 255 byte, emits the same `miss` event with `reason: 'immune'` that Scan's refusal does; the presenter prints IMMUNE for it. It is
 * emitted after the status step and only reads: no roll is drawn and no number moves. A Scan row is skipped (it has its own miss).
 *
 * **Only a status move aimed at someone (PR-0383, release 56).** Defend, and any command whose ability targets its own user (`targeting: 'self'`: Defend, an aeon's Shield and Boost),
 * never says IMMUNE: an aeon is wholly immune to the Defend status, so its inert Defend row (enabled, and doing nothing; `research/ffx-combat-core.md` 6.2 lists only Shield, Boost and
 * Dismiss for an aeon) printed IMMUNE over the player's own aeon once release 55 added the miss. Slow on Flux and Shell on a Pagoda are moves aimed at a foe and keep it, and so does a
 * move that bounced (Yunalesca's Blind counter reflected back onto her lands on its own caster but is still a foe-aimed move: `targeting` is the ability's, not who ends up hit).
 *
 * One switch, {@link IMMUNE_STATUS_MISS}, **on** as shipped. `{ on: false }` and the engine plays and logs exactly as release 54 did: the pinned event-log digests of
 * `ffx-engine-golden` come back with it off (`tests/unit/ffx-immune-status-miss.test.ts`).
 *
 * Layering: pure, deterministic, no DOM [AGENTS.md hard rule 1].
 */

import type { AbilityDef, FFXCombatant } from '../common/types.ts';
import { DEFEND_ABILITY_ID } from './registry.ts';

/** The one switch, **on** as shipped. */
export const IMMUNE_STATUS_MISS: { on: boolean } = { on: true };

/** What the rule reads of a hit that connected. */
export interface RefusedStatusHit {
  /** The ability the action is (the row below may be another target's row of it), and whom it is aimed at. */
  abilityId: string;
  targeting: AbilityDef['targeting'];
  /** The row this target was hit with (`options.rowFor` or the ability). */
  row: Pick<AbilityDef, 'statusEffects'>;
  target: Pick<FFXCombatant, 'immunities'>;
  /** The hit's HP, MP and CTB amounts. */
  amounts: readonly [number, number, number];
  /** What the status step changed: statuses added or removed, a KO, an eject. */
  changed: boolean;
}

/** Should this hit say IMMUNE? See the file header. */
export function statusRefusedAsImmune(hit: RefusedStatusHit): boolean {
  if (!IMMUNE_STATUS_MISS.on || hit.changed) return false;
  if (hit.abilityId === DEFEND_ABILITY_ID || hit.targeting === 'self') return false; // Defend and a self command are never a refused move (PR-0383)
  if (hit.amounts[0] !== 0 || hit.amounts[1] !== 0 || hit.amounts[2] !== 0) return false;
  return hit.row.statusEffects.some((s) => s.status !== 'scan' && (hit.target.immunities[s.status] ?? 0) >= 255);
}
