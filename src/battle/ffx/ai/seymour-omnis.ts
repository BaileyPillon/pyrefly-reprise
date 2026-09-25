/**
 * **Chapter XII — Seymour Omnis**, the Garden of Pain inside Sin.
 *
 * Source: `research/ffx-seymour-omnis.md` §4.1 and §4.4 and the §4.7
 * reference pseudocode, with the preflight review's corrections
 * (`docs/plans/chapter-omnis-review.md`, Review). The rules both halves read
 * are in `./seymour-omnis-rules.ts`.
 *
 * | Stored state | His turn |
 * |---|---|
 * | `normal` | **four spells**, one per disc (the volley below) |
 * | `red` (glowing) | **Dispel** on the party; his Defense drops to **100** |
 * | `dispelled` | **Ultima** on the party; Defense **150**; the counter resets |
 * | `reset-due` | the discs reset to the next colour (B23 = a), then four spells |
 *
 * [verified: 4-5 sources] for the order; the Defense values single source
 * (wiki). The glow itself is lit by the turn-end hook
 * (`seymour-omnis-rules.ts#runOmnisTurnEnd`), never here. He never Banishes
 * an aeon (§4.5, verified: 3 sources): no row carries it.
 *
 * The script moves shared state (Defense, the counter, the reset) at
 * decision time, as Natus's and Yojimbo's do; an intent dry-run runs it on a
 * cloned context, so asking never moves the live fight.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { Command } from '../../common/types.ts';
import { type Ctx, livingFriendlies, tryActor } from '../state.ts';
import { type VolleyCast, registerVolleyPlanner } from '../volley-planners.ts';
import { type AiContext, registerAiScript, use } from './types.ts';
import {
  DEF_AFTER_DISPEL,
  DEF_AFTER_ULTIMA,
  MORTIPHASM_SCRIPT,
  OMNIS_DISPEL_ID,
  OMNIS_GA,
  OMNIS_HITS,
  OMNIS_ID,
  OMNIS_RA,
  OMNIS_SCRIPT,
  OMNIS_ULTIMA_ID,
  OMNIS_VOLLEY_ID,
  RESET_ON_NEXT_TURN,
  omnisDiscs,
  omnisState,
  resetDiscs,
  setOmnisState,
} from './seymour-omnis-rules.ts';
import { OMNIS_CALLOUTS, omnisCallout, omnisCalloutOnce, omnisSpend } from './seymour-omnis-callouts.ts';

export * from './seymour-omnis-rules.ts';

/**
 * Every assumption this chapter's engine makes that no source settles, in one
 * place for the review, the tests and the guide.
 */
export const OMNIS_ASSUMPTIONS = {
  ringOrder: 'our estimate (O-7), GameFAQs reset cycle drawn as the ring (B8 = b); unlisted until confirmed',
  resetCycle: 'single source (GameFAQs, O-11), built per B8 = b; unlisted until confirmed',
  thunderWaterOpposite: 'standard FFX pair, no Omnis source (O-5)',
  discTurns: 'our estimate (B22 = a): the discs take no turns of their own',
  whatTurnsADisc: 'our estimate (B10 = a): a single-target physical hit (left) or damaging spell (right); all-target actions and items turn nothing',
  discHitsCount: 'our estimate (B11 = no)',
  spellTargets: 'our estimate (B12 = a): disc i onto living member i in slot order, the next disc on a random member; with members down, the first discs keep their spells',
  oneAttackPerAction: 'our estimate: an action that lands on him counts once (a Doublecast once, a multi-hit action once); each reflected spell counts',
  resetTiming: 'B23 = a: on his next turn after Ultima (2 sources against 1)',
  twoWaterBug: 'B9 = faithful (single source: wiki)',
  aeonAbsorb: 'sourced, not an assumption: Ifrit absorbs Fire, Ixion Thunder, Shiva Ice (§4.5 verified: 2 sources); their default armour in every FFX battle (setup.ts AEON_INNATE_AFFINITIES, rule 14)',
  aeonHoldsField: 'our estimate: a summoned aeon is the one living member, so the volley gives it two casts (the wiki rule "one per living member plus one" says nothing about aeons)',
  emptyAimFallback: 'our estimate: an empty-aim fallback skips the discs as a random pick does (research §2 names random-target attacks only)',
  reflectBounce: 'our estimate: a Reflect bounce never lands on a disc (research §2 names random-target attacks only)',
  discExtraImmunities: 'our estimate: the discs are also immune to Life and to Threaten (neither sourced for m106; both moot on an unkillable part with no turns)',
} as const;

function setDefense(ctx: Ctx, value: number): void {
  const omnis = tryActor(ctx, OMNIS_ID);
  if (omnis) omnis.stats.def = value;
}

/** One Seymour Omnis turn [§4.4, §4.7]. */
export function seymourOmnisAi(ai: AiContext): Command {
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
      ctx.state.flags[OMNIS_HITS] = 0;
      if (RESET_ON_NEXT_TURN) setOmnisState(ctx, 'reset-due');
      else {
        resetDiscs(ctx);
        setOmnisState(ctx, 'normal');
      }
      return use(ai, OMNIS_ULTIMA_ID, []);
    case 'reset-due':
      resetDiscs(ctx);
      setOmnisState(ctx, 'normal');
      break;
    case 'normal':
      break;
  }
  sayDiscLesson(ctx);
  return use(ai, OMNIS_VOLLEY_ID, []);
}

/**
 * The turn-one disc lesson (B15), before his first four spells, and only while
 * all four discs still show Fire (the line says so): Lulu's line with Lulu on
 * the field, Auron's otherwise. Spent silently once a disc has turned.
 */
function sayDiscLesson(ctx: Ctx): void {
  if (!omnisDiscs(ctx.state).every((d) => d === 'fire')) return omnisSpend(ctx, 'lesson');
  const lulu = livingFriendlies(ctx).some((c) => c.id === 'lulu');
  omnisCalloutOnce(ctx, 'lesson', lulu ? OMNIS_CALLOUTS.lessonLulu : OMNIS_CALLOUTS.lesson);
}

/**
 * **The four spells** [§4.1]: disc *i*, left to right, casts its element at
 * -ra (1-2 discs show it) or -ga (3-4) [verified: 4 sources]. One spell per
 * living member plus one on a random member, so 4 with three standing and 2
 * or 3 with members down [single source: wiki]. **B12 = a, our estimate
 * (both halves unsourced):** disc *i* aims at living member *i* in slot order,
 * the next disc at a random living member, and with members down the first
 * discs keep their spells. While an aeon holds the field it is the only
 * member standing, so it takes two (**our estimate**, `aeonHoldsField`).
 */
export function planOmnisVolley(ctx: Ctx): VolleyCast[] {
  const discs = omnisDiscs(ctx.state);
  const living = livingFriendlies(ctx);
  if (living.length === 0 || discs.length === 0) return [];
  const casts = Math.min(discs.length, living.length + 1);
  const out: VolleyCast[] = [];
  for (let i = 0; i < casts; i++) {
    const element = discs[i];
    if (!element) continue;
    const shown = discs.filter((d) => d === element).length;
    const target = i < living.length ? living[i] : ctx.rng.pick(living);
    if (!target) continue;
    out.push({ abilityId: shown >= 3 ? OMNIS_GA[element] : OMNIS_RA[element], targetId: target.id });
  }
  return out;
}

/** A disc owns no turn (B22 = a); if one is ever asked, it passes. */
export function mortiphasmAi(): Command | null {
  return null;
}

registerAiScript(OMNIS_SCRIPT, seymourOmnisAi);
registerAiScript(MORTIPHASM_SCRIPT, mortiphasmAi);
registerVolleyPlanner(OMNIS_VOLLEY_ID, (ctx) => planOmnisVolley(ctx));
