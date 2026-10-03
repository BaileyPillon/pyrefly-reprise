/**
 * The steps every chapter's line shares: bring a fallen member back, heal, and the plain swing
 * that ends every line. A chapter that needs something stricter writes its own step instead of
 * bending these (`./<chapter>.ts`).
 *
 * Plain data, like the lines that use it (`../line-types.ts`). The sentences are the player's:
 * one plain clause each, no source named, no section number.
 */

import type { LineStep } from '../line-types.ts';

/** FFX: every single-target heal a party owns, strongest first. A Zombie is never aimed at (a heal would hurt it). */
export const FFX_HEALS = ['Curaga', 'Cura', 'Cure', 'X-Potion', 'Hi-Potion', 'Potion'] as const;

/** FFX: the party-wide items, for a board where several members are hurt. */
export const FFX_PARTY_HEALS = ['Healing Water', 'Mega-Potion', 'Al Bhed Potion'] as const;

/** Stand a fallen member back up, single-target only (a revive kills a living Zombie). */
export function revive(from: string, labels: readonly string[] = ['Phoenix Down', 'Life', 'Full-Life']): LineStep {
  return { labels, when: { downed: true }, aim: 'downed', why: 'Stand {target} back up before the next hit', from };
}

/** Heal whoever is lowest once anyone is under `below` of their max HP. */
export function heal(from: string, below: number, labels: readonly string[] = FFX_HEALS, why?: string): LineStep {
  return {
    labels,
    when: { anyBelowHp: below },
    aim: 'weakest',
    why: why ?? 'Heal {target} before the next hit lands',
    from,
  };
}

/** The step every line ends on: hit the boss. */
export function swing(from: string, why = 'Keep hitting {target}'): LineStep {
  return { kinds: ['attack'], aim: 'boss', why, from };
}

/** FFX-2: the single-target heals a girl may own, the cheapest that does the job first. */
export const FFX2_HEALS = ['Cura', 'Cure', 'Hi-Potion', 'X-Potion', 'Potion'] as const;

/** FFX-2: the party-wide heals, for a board where several girls are hurt or a hit on all three is coming. */
export const FFX2_PARTY_HEALS = ['Curaga', 'Mega-Potion', 'Pray', 'Vigor'] as const;

/** FFX-2: the rows that stand a fallen girl back up. */
export const FFX2_REVIVES = ['Phoenix Down', 'Life', 'Full-Life'] as const;

/**
 * FFX-2 only: Itchy seals every command on a girl's menu except a dressphere Change, and a Change
 * clears it (`research/ffx2-combat-core.md` §2.8, two sources), so for an Itchy girl the Change is the
 * turn. `home` names the dresspheres to go back to first, when the chapter has a line-up to keep.
 * Not part of any encounter guide's plan, so every step here is `support`.
 */
export function leaveItchy(from: string, home: readonly string[] = []): LineStep[] {
  const why = 'Itchy seals every command but Change: changing dressphere clears it';
  const steps: LineStep[] = [];
  if (home.length > 0) steps.push({ labels: home, when: { actorHas: 'itchy' }, why, from, support: true });
  steps.push({ kinds: ['spherechange'], when: { actorHas: 'itchy' }, why, from, support: true });
  return steps;
}

/**
 * FFX-2: the turn a healer has nothing urgent to do. Pray tops the whole party up for no item and
 * names no enemy, so it is the idle that does some good.
 */
export function pray(from: string): LineStep {
  return { labels: ['Pray'], aim: 'first', why: 'Nothing urgent: Pray tops the whole party up', from, support: true };
}
