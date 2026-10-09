/**
 * **Chapter XII — Seymour Omnis**, the Garden of Pain inside Sin, as the game's own scripts run him (m131, m106 and
 * the `sins03_00` formation script; re-parity; `research/re-ffx-ai-seymour.md` section 5). The state and rules both
 * halves read are in `./seymour-omnis-rules.ts`, the affinity routine and the cast table in `./omnis-affinity.ts`.
 * **Game case: FFX only.**
 *
 * | State (script St) | His turn |
 * |---|---|
 * | `normal` (0) | **four spells, always**, in the order his layout fixes, at random living members, or (three or four of a kind) the first three at Character 1, 2, 3 |
 * | `red` (1, glowing) | **Dispel** on the party; his Defense becomes **100** |
 * | `dispelled` (2) | **Ultima** on the party; Defense **150** |
 * | `reset-due` (3) | **no spells**: the discs all turn to the next colour of the reset order, and the cycle starts again |
 *
 * He never Banishes an aeon: with one on the field his four spells all land on it (the party's other slots read as
 * empty, so the script falls back to "a random living member", which is the aeon; its own slot hits it directly).
 *
 * What reaches him and the discs is hook work, not a turn: his `onHit` counts the attacks and lights the glow, a
 * disc's `onHit` turns it by the hit's damage type, and the pre-turn handlers (his own and every party member's)
 * refresh his affinity from the discs.
 *
 * The script moves shared state (Defense, the reset) at decision time; an intent dry-run runs it on a cloned
 * context, so asking never moves the live fight.
 */

import type { Command, FFXCombatant } from '../../common/types.ts';
import { type Ctx, livingFriendlies, tryActor } from '../state.ts';
import { type VolleyCast, registerVolleyPlanner } from '../volley-planners.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import { DAMAGE_MAGICAL, DAMAGE_PHYSICAL, commandDamageType } from './command-class.ts';
import { type ScriptHooks, type UsedCommand, registerFormationPreTurn, registerScriptHooks } from './hooks.ts';
import { pickMatching } from './script-random.ts';
import {
  DEF_AFTER_DISPEL,
  DEF_AFTER_ULTIMA,
  MORTIPHASM_SCRIPT,
  OMNIS_DISPEL_ID,
  OMNIS_GA,
  OMNIS_ID,
  OMNIS_RA,
  OMNIS_SCRIPT,
  OMNIS_ULTIMA_ID,
  OMNIS_VOLLEY_ID,
  aimsAtSlots,
  countDiscs,
  discIndex,
  omnisCastOrder,
  omnisDiscs,
  omnisPresent,
  omnisState,
  recordOmnisHit,
  refreshOmnisAffinities,
  resetDiscs,
  setOmnisState,
  turnDisc,
} from './seymour-omnis-rules.ts';
import { OMNIS_CALLOUTS, omnisCallout, omnisCalloutAfter, omnisCalloutOnce, omnisSpend } from './seymour-omnis-callouts.ts';

export * from './seymour-omnis-rules.ts';

/**
 * What this chapter's engine still assumes, after the scripts. Each is labelled "our estimate" where a player could
 * read it. Everything the old list held about the ring, the reset order, the cast targets, the counter and the
 * aeon is now the script's.
 */
export const OMNIS_ASSUMPTIONS = {
  aeonAbsorb: 'sourced, not an assumption: Ifrit absorbs Fire, Ixion Thunder, Shiva Ice (verified: 2 sources); their default armour in every FFX battle (setup.ts AEON_INNATE_AFFINITIES, rule 14)',
  emptyAimFallback: 'our estimate: an empty-aim fallback skips the discs as a random pick does (research names random-target attacks only)',
  reflectBounce: 'our estimate: a Reflect bounce never lands on a disc (research names random-target attacks only)',
  discExtraImmunities: 'our estimate: the discs are also immune to Life and to Threaten (neither sourced for m106; both moot on an unkillable part with no turns)',
  discArt: 'our estimate: the painted discs keep the earlier ring (Fire, Water, Ice, Thunder), so a turn can read as a half turn on screen; the colour that faces him is the script\'s',
} as const;

function setDefense(ctx: Ctx, value: number): void {
  const omnis = tryActor(ctx, OMNIS_ID);
  if (omnis) omnis.stats.def = value;
}

/** One Seymour Omnis turn. */
export function seymourOmnisAi(ai: AiContext): Command | null {
  const ctx = ai.ctx;
  switch (omnisState(ctx)) {
    case 'red':
      setDefense(ctx, DEF_AFTER_DISPEL);
      setOmnisState(ctx, 'dispelled');
      omnisCalloutOnce(ctx, 'dispel', OMNIS_CALLOUTS.dispel); // his line before the first Dispel (B15)
      return use(ai, OMNIS_DISPEL_ID, []);
    case 'dispelled':
      omnisCallout(ctx, OMNIS_CALLOUTS.ultima); // his line before each Ultima (B15)
      setDefense(ctx, DEF_AFTER_ULTIMA);
      setOmnisState(ctx, 'reset-due');
      return use(ai, OMNIS_ULTIMA_ID, []);
    case 'reset-due':
      // The reset turn is only the reset: the discs go to the next colour and no spell is cast.
      resetDiscs(ctx);
      setOmnisState(ctx, 'normal');
      return null;
    case 'normal':
      break;
  }
  sayDiscLesson(ctx);
  return use(ai, OMNIS_VOLLEY_ID, []);
}

/**
 * The turn-one disc lesson (B15), before his first four spells, and only while all four discs still show Fire (the
 * line says so): Lulu's line with Lulu on the field, Auron's otherwise. Spent silently once a disc has turned.
 */
function sayDiscLesson(ctx: Ctx): void {
  if (!omnisDiscs(ctx.state).every((d) => d === 'fire')) return omnisSpend(ctx, 'lesson');
  const lulu = livingFriendlies(ctx).some((c) => c.id === 'lulu');
  omnisCalloutOnce(ctx, 'lesson', lulu ? OMNIS_CALLOUTS.lessonLulu : OMNIS_CALLOUTS.lesson);
}

/**
 * **The four spells.** Always four, in the cast order his layout fixes (`omnisCastOrder`), each -ga when its element
 * shows on three or four discs and -ra otherwise. **Targets:** with three or four of a kind, spells 1 to 3 go to
 * Character 1, 2 and 3 in that order (a slot whose HP is 0 gets a random living member instead) and spell 4 to a
 * random living member; **in every other layout all four go to random living members**, each its own picker draw
 * (none when only one member stands). With an aeon on the field every spell lands on it.
 */
export function planOmnisVolley(ctx: Ctx): VolleyCast[] {
  const discs = omnisDiscs(ctx.state);
  const order = omnisCastOrder(discs);
  const living = livingFriendlies(ctx);
  if (living.length === 0 || order.length === 0) return [];
  const counts = countDiscs(discs);
  const slotted = aimsAtSlots(discs);
  const out: VolleyCast[] = [];
  for (let i = 0; i < order.length; i++) {
    const element = order[i];
    if (!element) continue;
    let target: FFXCombatant | undefined;
    if (slotted && i < 3 && !ctx.state.aeonId) {
      const member = ctx.state.activeIds[i] === undefined ? undefined : tryActor(ctx, ctx.state.activeIds[i] as string);
      target = member && member.hp > 0 ? member : pickMatching(ctx, living);
    } else {
      target = pickMatching(ctx, living);
    }
    if (!target) continue;
    out.push({ abilityId: counts[element] >= 3 ? OMNIS_GA[element] : OMNIS_RA[element], targetId: target.id });
  }
  return out;
}

/** A disc owns no turn: it is not in the queue, and if one is ever asked it passes. */
export function mortiphasmAi(): Command | null {
  return null;
}

/**
 * A disc heard of an action (its `onHit`, after the last hit record on it): a **magical** command turns it +1 on the
 * ring, a **physical** one -1, anything else nothing. Only the damage type decides: not the target mode, the item, the
 * spell, nor whether the hit missed.
 */
function onDiscHit(ctx: Ctx, disc: FFXCombatant, used: UsedCommand): void {
  const index = discIndex(disc.id);
  if (index < 0) return;
  const type = commandDamageType(used.def, used.user);
  if (type !== DAMAGE_MAGICAL && type !== DAMAGE_PHYSICAL) return;
  turnDisc(ctx, index, type === DAMAGE_MAGICAL ? 'right' : 'left');
  const by = used.user.id; // the first disc a member turns: Wakka's line if it was his (B15)
  omnisCalloutAfter(ctx, 'turned', by === 'wakka' ? OMNIS_CALLOUTS.turnedWakka : OMNIS_CALLOUTS.turned, by);
}

registerScriptHooks(OMNIS_SCRIPT, { onHit: (ctx, self) => recordOmnisHit(ctx, self) } satisfies ScriptHooks);
registerScriptHooks(MORTIPHASM_SCRIPT, { onHit: (ctx, self, used) => onDiscHit(ctx, self, used) } satisfies ScriptHooks);
// The pre-turn the formation script gives every actor; Omnis's own copy stops outside his normal state.
registerFormationPreTurn((ctx, actor) => {
  if (!omnisPresent(ctx)) return;
  if (actor.id === OMNIS_ID && omnisState(ctx) !== 'normal') return;
  refreshOmnisAffinities(ctx);
});

registerAiScript(OMNIS_SCRIPT, seymourOmnisAi);
registerAiScript(MORTIPHASM_SCRIPT, mortiphasmAi);
registerVolleyPlanner(OMNIS_VOLLEY_ID, (ctx) => planOmnisVolley(ctx));
