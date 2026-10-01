/**
 * **Advisor v4: how good is a board.** One number in [0, 1] for the end of a
 * simulated future (`./rollout.ts`): 1 is the link won with everyone standing, 0 the party lost.
 *
 * - **Terminal** (the future reached the end of the chapter, or of the link when the rollout is
 *   not chain-aware): victory is worth
 *   `victory + (1 - victory) x` the party's health; a defeat or an escape is worth 0.
 * - **Leaf** (the horizon ran out first): the **damage race**, read off the two sides' health.
 *   `health` is the living active party's HP fraction with a KO worth nothing; the enemy side is
 *   the HP fraction of its main bodies (parts only when nothing else is left, as the engines'
 *   own victory check reads it). The race term is how far each side moved from the root board
 *   over the horizon, so a future that hurts the boss faster than it hurts the party scores
 *   above one that only held still.
 *
 * Deliberately simple and fully written down: every term is a reading of `BattleState`, none is
 * game data [AGENTS.md rule 6]. The weights are measurement inputs (the
 * knobs in `DEFAULT_WEIGHTS`), measured on the scorecard (docs/plans/advisor-v4-method-check.md),
 * never tuned on one board.
 *
 * Game case: **both** (a reading of the shared `BattleState`).
 */

import type { AnyCombatant, BattleState } from '../../../battle/common/types.ts';
import { raceOf } from '../advisor-race.ts';

export interface ValueWeights {
  /** What a won link is worth before the party's health is added (the rest of the way to 1). */
  victory: number;
  /** Leaf: weight of the standing health gap (party minus enemy). */
  standing: number;
  /** Leaf: weight of the race (enemy HP taken minus party HP lost since the root). */
  race: number;
  /**
   * Terminal, **race boards only** (`../advisor-race.ts`, PR-0269): what a lost future is worth per
   * unit of the chain's enemy HP it took off since the root. Everywhere else a defeat is 0, as before.
   */
  raceCredit?: number;
}

export const DEFAULT_WEIGHTS: ValueWeights = { victory: 0.9, standing: 0.35, race: 0.35, raceCredit: 0.4 };

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** The living active party's HP fraction, a KO counting as 0 (aeons included when on the field). */
export function partyHealth(s: Readonly<BattleState>): number {
  let sum = 0;
  let n = 0;
  for (const id of s.activeIds) {
    const u = s.combatants[id];
    if (!u || u.side === 'enemy' || u.removed) continue;
    n += 1;
    if (u.alive !== false && u.hp > 0) sum += u.hp / Math.max(1, u.stats.maxHp);
  }
  return n > 0 ? sum / n : 0;
}

function enemyBodies(s: Readonly<BattleState>): AnyCombatant[] {
  const all = Object.values(s.combatants).filter((c) => c.side === 'enemy' && !c.removed);
  const main = all.filter((c) => !c.flags.isPart);
  return main.length > 0 ? main : all;
}

/** The enemy side's HP fraction (main bodies; 0 when everything is down). */
export function enemyHealth(s: Readonly<BattleState>): number {
  let hp = 0;
  let max = 0;
  for (const c of enemyBodies(s)) {
    max += Math.max(1, c.stats.maxHp);
    hp += c.alive !== false ? Math.max(0, c.hp) : 0;
  }
  return max > 0 ? hp / max : 0;
}

export function terminalValue(s: Readonly<BattleState>, outcome: string, w: ValueWeights): number {
  if (outcome !== 'victory') return 0;
  return w.victory + (1 - w.victory) * partyHealth(s);
}

/**
 * **The race term** (PR-0269): on a race board (Overdrive Sin's clock, the Fins' chain;
 * `../advisor-race.ts#raceOf`) a lost future is not all alike. One that ran the clock out with Sin
 * nearly down, or wiped on the Core rather than the Left Fin, is worth `raceCredit` times the share
 * of the chain's enemy HP it took off since the root, always below any won future (`victory`).
 * Off a race board it is `terminalValue`'s 0, so every other chapter's search is unchanged.
 */
export function lostValue(
  root: Readonly<BattleState>,
  leaf: Readonly<BattleState>,
  links: { rootAhead: number; leafAhead: number },
  w: ValueWeights,
): number {
  if (!w.raceCredit || !raceOf(root)) return 0;
  const start = enemyHealth(root) + links.rootAhead;
  const taken = start - (enemyHealth(leaf) + links.leafAhead);
  return start > 0 ? clamp01(Math.min(w.raceCredit, w.victory) * clamp01(taken / start)) : 0;
}

/**
 * The value of a board the horizon stopped on, against the root board the decision was read on.
 * `links` counts the chain's links still ahead at the root and at the leaf: each one is a whole
 * enemy side still to beat, so crossing into the next link is progress in the race.
 */
export function leafValue(
  root: Readonly<BattleState>,
  leaf: Readonly<BattleState>,
  links: { rootAhead: number; leafAhead: number },
  w: ValueWeights,
): number {
  const p1 = partyHealth(leaf);
  const e1 = enemyHealth(leaf);
  if (p1 <= 0) return 0;
  const standing = p1 - e1;
  const enemyRoot = enemyHealth(root) + links.rootAhead;
  const enemyLeaf = e1 + links.leafAhead;
  const race = (enemyRoot - enemyLeaf) - (partyHealth(root) - p1);
  // Centred on 0.5 x the victory value: a leaf is never worth a won chapter.
  return clamp01(w.victory * (0.5 + w.standing * standing + w.race * race));
}
