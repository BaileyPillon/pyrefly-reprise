/**
 * Which painting an **enemy** wears for its own action.
 *
 * Bailey, 2026-09-26 ~19:30 EDT ("i'll go with all your recommendations"),
 * recommendation 3: a boss's **physical** ability draws its `attack` painting.
 * Before this, every enemy action arrived as `{ kind: 'ability' }` (FFX's AI
 * scripts and FFX-2's alike) and `poseForCommand('ability')` is `cast`, so an
 * enemy's attack painting showed only on a counter
 * (`docs/concepts/boss-poses-2026-09-26/README.md`, "Read this first").
 *
 * The rule, read off the ability's own data row (never its name):
 * - **physical** = `damageType: 'physical'`, or a `strength` /
 *   `piercing-strength` formula on a row that is not `magical` (FFX's
 *   `overdrive-multiplied` family is `strength` with `damageType: 'other'`,
 *   `types.ts` `FormulaKey`);
 * - a physical enemy ability draws `attack` when the enemy has an attack
 *   painting of its **own**, else `cast`, whose chain (`cast`, `attack`,
 *   `idle` in `BattlePresenterArt.ts`) ends on the idle, as before;
 * - magic, and anything the table does not know, keeps `cast`;
 * - party and aeon actions are unchanged (`poseForCommand`).
 *
 * The beat follows the painting: `attack` gets the attack wind-up (lunge,
 * slash cue, roll), a fallback to `cast` gets today's cast beat, so an enemy
 * without an attack painting plays exactly as it did.
 *
 * Both games (shared presenter plumbing, `critic/CHECKS.md` CHK-020): FFX and
 * FFX-2 rows mark physical with the same `damageType` (FFX-2's engine reads it
 * in `execute.ts` `attackClass`). No `three`, no DOM (hard rule 1).
 */

import type { AbilityId, BattleEvent, FormulaKey } from '../battle/common/types.ts';
import type { AbilityFacts } from './BattlePresenterPorts.ts';
import { poseForCommand } from './BattlePresenterEvents.ts';

const STRENGTH_FORMULAS: ReadonlySet<FormulaKey> = new Set<FormulaKey>(['strength', 'piercing-strength']);

/** Is this ability row a physical blow? `undefined` (no row) is not. */
export function isPhysicalAction(facts: AbilityFacts | undefined): boolean {
  if (!facts) return false;
  if (facts.damageType === 'physical') return true;
  return facts.damageType !== 'magical' && STRENGTH_FORMULAS.has(facts.formula);
}

/**
 * The pose an `action-start` puts its actor into.
 *
 * `side` is the actor's team (`BattleStage.sideOf`), `facts` the chapter's
 * ability rows, `paints` whether the actor has its own painting for a pose
 * (`BattleStage.paints`). Any of them missing keeps today's `poseForCommand`.
 */
export function poseForAction(
  event: Extract<BattleEvent, { type: 'action-start' }>,
  side: 'party' | 'enemy' | 'aeon' | undefined,
  facts: ((id: AbilityId) => AbilityFacts | undefined) | null | undefined,
  paints: ((pose: string) => boolean) | undefined,
): string {
  const base = poseForCommand(event.command.kind);
  if (side !== 'enemy' || event.command.kind !== 'ability' || !facts) return base;
  const id = event.abilityId ?? event.command.id;
  if (!isPhysicalAction(facts(id))) return base;
  return paints?.('attack') ? 'attack' : base;
}

/**
 * The poses in a resolved `{ pose: url }` map that point at their **own**
 * painting, not a fallback: what `BattleStage.paints` answers from.
 * `urlFor` is `BattlePresenterArt.characterUrl`.
 */
export function paintedPoses(
  artId: string,
  poses: Readonly<Record<string, string>>,
  urlFor: (artId: string, pose: string) => string,
): Set<string> {
  return new Set(Object.keys(poses).filter((p) => poses[p] === urlFor(artId, p)));
}
