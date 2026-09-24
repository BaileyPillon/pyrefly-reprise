/**
 * Which side a command's target cursor should **open** on.
 *
 * Legality is `validTargets`; this is only the opening position inside it. The
 * menu walks every legal candidate left to right on screen and used to open on
 * the leftmost one, and the party stands on the left in both games. So every
 * row that may point at either side (`single-any`: most FFX-2 skills — Power
 * Break, Drain, Doom, Cheap Shot, Flametongue — and FFX's Dispel) opened on a
 * party member, and the player had to walk the cursor over to the enemy every
 * turn (Bailey, live build, 2026-09-24: "when i click an attack it defaults to
 * targeting my party member instead of the enemy").
 *
 * **Source.** Neither `research/ffx-combat-core.md`, `research/ffx2-combat-core.md`
 * nor `research/ffx-vs-ffx2-presentation.md` states where the retail cursor
 * opens, so this is the standard Final Fantasy convention, not a sourced
 * per-game rule: an offensive command opens on an enemy, a restorative or a buff
 * on a party member, and a revive on a KO'd party member first. Both games
 * [AGENTS.md hard rule 14]: shared plumbing, and the same rule in each.
 *
 * Pure and deterministic: no DOM, no RNG [AGENTS.md hard rule 1].
 */

import type { AbilityDef, CombatantId, Side, StatusId, Targeting } from './types.ts';

/** What the classification reads from an ability or an item's effect. */
export type AimDef = Pick<AbilityDef, 'targeting' | 'flags' | 'formula' | 'statusEffects' | 'removesStatuses'>;

/** What the opening rule reads from each candidate. */
export interface AimCandidate {
  id: CombatantId;
  side: Side;
  hp: number;
  statuses: Partial<Record<StatusId, unknown>>;
}

/**
 * Statuses a player puts on their own side, in either game. Anything not here
 * (Poison, Slow, Doom, the Breaks, Scan, Berserk, the X-2 Downs...) counts as
 * something done *to* a target, and an unknown id defaults to that side too.
 */
const HELPFUL_STATUSES: ReadonlySet<StatusId> = new Set<StatusId>([
  'haste', 'protect', 'shell', 'reflect', 'regen', 'auto-life',
  'nulblaze', 'nulfrost', 'nulshock', 'nultide',
  'shield', 'boost', 'guard', 'sentinel', 'defend',
  'cheer', 'focus', 'aim', 'reflex', 'luck',
  'max-hp-x2', 'max-mp-x2', 'mp-cost-zero', 'damage-9999', 'guaranteed-critical',
  'overdrive-x1_5', 'overdrive-x2',
  'invincible', 'null-magic', 'null-physical', 'spellspring',
  'str-up', 'mag-up', 'def-up', 'mdef-up', 'accu-up', 'eva-up', 'luck-up',
]);

/** A revive: it may point at the fallen, and it restores (Phoenix Down, Life, Full-Life). */
export function isRevive(def: AimDef): boolean {
  if (!def.flags.includes('can-target-dead')) return false;
  return def.flags.includes('heals') || def.formula === 'healing' || def.flags.includes('misses-if-target-alive');
}

/**
 * `'ally'` for a heal, a revive, a buff or a cleanse; `'foe'` for everything
 * else — damage, a drain, a debuff, Dispel, Steal, and a row that says nothing
 * about itself (Copycat, Mix), because an attack is the likelier aim.
 */
export function aimSideOf(def: AimDef): 'ally' | 'foe' {
  // A drain restores its *user*; its target is the one hurt (Drain, Osmose, Pilfer HP).
  if (def.flags.includes('drains') || def.flags.includes('drains-mp')) return 'foe';
  if (isRevive(def)) return 'ally';
  if (def.flags.includes('heals') || def.formula === 'healing') return 'ally';
  const adds = def.statusEffects.map((s) => s.status);
  if (adds.length > 0) return adds.every((s) => HELPFUL_STATUSES.has(s)) ? 'ally' : 'foe';
  const removes = def.removesStatuses;
  // Esuna and Remedy take ailments off; Dispel takes buffs off (an enemy's).
  if (removes.length > 0) return removes.some((s) => HELPFUL_STATUSES.has(s)) ? 'foe' : 'ally';
  return 'foe';
}

/** Party and aeons fight on one side; enemies on the other. */
function sameSide(a: Side, b: Side): boolean {
  return (a === 'enemy') === (b === 'enemy');
}

function isDown(c: AimCandidate): boolean {
  return c.hp <= 0 || c.statuses['ko'] !== undefined;
}

/**
 * The legal candidates the cursor should open among, or `undefined` when that
 * is every legal candidate (nothing to narrow, so the row needs no hint).
 *
 * `targeting` is the **row's** (an item's own targeting wins over its effect's);
 * only a single-target row has a cursor to open, so a party-wide or random row
 * gets no hint. `candidates` is `validTargets` resolved to combatants, in any
 * order; the menu still picks the leftmost on screen of what this returns, and
 * the arrows still walk every legal candidate.
 */
export function preferredTargetIds(
  def: AimDef,
  targeting: Targeting | undefined,
  userSide: Side,
  candidates: readonly AimCandidate[],
): CombatantId[] | undefined {
  if (targeting !== 'single-any' && targeting !== 'single-ally' && targeting !== 'single-enemy') return undefined;
  if (candidates.length < 2) return undefined;
  const side = aimSideOf(def);
  let pool = candidates.filter((c) => sameSide(c.side, userSide) === (side === 'ally'));
  if (side === 'ally' && isRevive(def)) {
    const fallen = pool.filter(isDown);
    if (fallen.length > 0) pool = fallen;
  }
  if (pool.length === 0 || pool.length === candidates.length) return undefined;
  return pool.map((c) => c.id);
}
