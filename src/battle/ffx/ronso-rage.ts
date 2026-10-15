/**
 * **Lancet teaches Kimahri a Ronso Rage** (FFX only; the hidden Biran and Yenke chapter, `docs/plans/ch-biran-yenke-review.md` section 4).
 *
 * Until this chapter, Lancet carried `extra.learnsRonsoRage` on its ability record and **nothing read it**: Kimahri's Rage list was whatever his build gave him. This module is the rule, and it is inert
 * everywhere it finds no lesson row: only the two brothers below teach anything, so Lancet on every other enemy returns before it touches a list, a gauge or an event.
 *
 * **Source: the game's own files**, `research/re-ffx-biran-yenke.md` section 7 ("RE section 7"; `[bytes]` for the two scripts, `[note: FFX-G09]` for the engine's learning rule):
 *
 * - Kimahri learns a Rage only when he uses **Lancet** on a monster that offers one he does not know yet; **learning a Rage fills his Overdrive gauge to its maximum**; **one Lancet learns at most one Rage**;
 * - each brother's script offers the **first Rage on a fixed list that Kimahri does not know**: Biran Mighty Guard, Thrust Kick, Self-Destruct, Doom; Yenke White Wind, Fire Breath, Aqua Breath, Stone Breath;
 * - **Mighty Guard and White Wind are offered only after that brother has queued his own half-HP Rage** (a private flag set at the moment he queues it, not when it resolves). If the brother dies first
 *   the pending half-HP action is cancelled and the Rage is never offered (`ai/biran-yenke-rules.ts`).
 *
 * **Not in the note, so not modelled:** whether a Berserk Biran can still teach. Jegged's walkthrough says he cannot ("learn his abilities first"); the note's script writes the offered Rage on every Lancet
 * whatever his status, and a Berserk Biran is one whose half-HP action was cancelled by Yenke's death, so his Mighty Guard is never offered but the other three are. The note wins (it is the game's own file);
 * the disagreement is listed in the handoff and the status is NOT checked here.
 *
 * The lessons are keyed by combatant id. The battle layer does not import `src/data`, so the ids are copied here and `tests/unit/chapters/biran-yenke-data.test.ts` pins that they agree with the data.
 * Nothing here writes the save: a learned Rage lives in the battle's own combatant (`overdrive.unlockedOverdriveIds`, the list the command menu and the Rage picker draw) and ends with it.
 */

import type { AbilityId, FFXCombatant } from '../common/types.ts';
import { type Ctx, rtOf } from './state.ts';
import { setGauge } from './overdrive.ts';

/** One Rage a monster can offer. `afterQueued`: only once the monster has queued its own half-HP Rage (its AI memory holds `queued:<rage>`). */
export interface RageLesson {
  readonly rage: AbilityId;
  readonly afterQueued: boolean;
}

/** The AI-memory key a script writes when it QUEUES the half-HP Rage that unlocks `rage` for teaching (the note's private flag v15). */
export function queuedKey(rage: AbilityId): string {
  return `queued:${rage}`;
}

/** Combatant ids that teach, and what, in the order the script walks its list (RE section 7). */
export const RAGE_LESSONS: Readonly<Record<string, readonly RageLesson[]>> = {
  'biran-ronso': [
    { rage: 'mighty-guard', afterQueued: true },
    { rage: 'thrust-kick', afterQueued: false },
    { rage: 'self-destruct', afterQueued: false },
    { rage: 'doom', afterQueued: false },
  ],
  'yenke-ronso': [
    { rage: 'white-wind', afterQueued: true },
    { rage: 'fire-breath', afterQueued: false },
    { rage: 'aqua-breath', afterQueued: false },
    { rage: 'stone-breath', afterQueued: false },
  ],
};

/** The Rage this target offers right now, or undefined: the first row the user does not know whose gate is open. */
export function nextLesson(ctx: Ctx, user: FFXCombatant, target: FFXCombatant): RageLesson | undefined {
  const lessons = RAGE_LESSONS[target.id];
  if (lessons === undefined) return undefined;
  const known = new Set(user.overdrive?.unlockedOverdriveIds ?? []);
  const memory = rtOf(ctx, target.id).ai;
  return lessons.find((l) => !known.has(l.rage) && (!l.afterQueued || memory[queuedKey(l.rage)] === true));
}

/**
 * Lancet landed on `target`: teach the next Rage, if there is one. The Rage joins the user's list (the menu and the picker draw it), the gauge goes to 100 (the learn rule), and a banner says so.
 * Returns the Rage learned, or undefined when nothing was taught (every other enemy, every Rage known, a gated Rage whose brother has not queued his own yet).
 */
export function learnRonsoRage(ctx: Ctx, user: FFXCombatant, target: FFXCombatant): AbilityId | undefined {
  if (user.overdrive === undefined || user.side !== 'party' || target.side !== 'enemy') return undefined;
  const lesson = nextLesson(ctx, user, target);
  if (lesson === undefined) return undefined;
  user.overdrive.unlockedOverdriveIds.push(lesson.rage);
  const name = ctx.content.ability(lesson.rage)?.name ?? lesson.rage;
  ctx.emit({ type: 'message', text: `${user.name} learns ${name}`, kind: 'system' });
  setGauge(ctx, user, 100, 'lancet-learn'); // a new Rage fills the gauge at once (RE section 7; ffx-combat-core 5.8; ffx-seymour-flux 7.9.2)
  return lesson.rage;
}
