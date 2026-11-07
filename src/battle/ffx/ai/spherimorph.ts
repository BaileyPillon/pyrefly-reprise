/**
 * **Spherimorph's script** (FFX only; the hidden Spherimorph chapter, number 41): the monster file `m121` as the game's own bytecode runs it (`research/re-ffx-spherimorph.md` section 4, "RE 4": read from the file and
 * run in the earlier lanes' interpreter). **No number here is ours**; the rules and their sources are `./spherimorph-rules.ts`, the rows `data/ffx/enemies/spherimorph-abilities.ts`.
 *
 * ## The turn (RE 4.2), once per Spherimorph turn
 *
 * 1. A draw modulo 100 is taken **every turn** (the script evaluates both halves of its test, so the stream moves above half HP too).
 * 2. **Strictly below half HP (6,000) and the draw under 50: Press** on the whole front line (half of everyone's current HP, physical class).
 * 3. Otherwise **Attack on a random living front-line member**.
 *
 * It never casts a spell on its own turn: every spell it casts is a **counter**.
 *
 * ## When it is hit (RE 4.3), once per action per target
 *
 * `onTargeted` (before the damage) reads the command and, on an **absorbed** magical hit, raises the two hint banners. `onHit` (after the damage), the first line that applies ends it:
 *
 * | # | Condition | What it does |
 * |---:|---|---|
 * | 1 | HP 0, Threaten on it, or a counter not allowed (a reaction is resolving, it cannot act) | nothing |
 * | 2 | the attacker is mid-Doublecast and the gate is not armed | arm the gate and **ignore this spell** (the first of the pair) |
 * | 3 | Scan | the monster-side row on the front line |
 * | 4 | the command does not affect HP | nothing |
 * | 5 | **magical**: absorbed -> the front line gets the monster-side row (the **player-side** row when an aeon holds the field); no element at all -> the monster-side row on the front line; the weakness -> **shift** |
 * | 6 | **physical**: it took damage and the command has an element -> **shift**; otherwise -> the player-side row on the attacker |
 * | 7 | **special**: healed -> the monster-side row on the front line if elemental; damaged -> shift if elemental, the player-side row on the attacker if not |
 * | 8 | the shift: a new state, a uniform draw over all four (the old one included), written at once, and Elemental Shift queued on itself |
 *
 * ## The deviations, said (rule 6: none of them is a number)
 *
 * - **The two banners play once each**, not on every later absorbed spell (the game raises its scene again each time; a banner on every hit is presentation noise). Presentation only: no draw, no number.
 * - **The Doublecast gate reads `FFXRuntime.doublecasting`** (the engine's `doublecast.ts` raises it for the two casts), the game's `isDoublecasting` of the last attacker.
 * - **MP.** The player-side rows carry their MP costs; a monster pays no MP in this engine and the note did not read whether the game charges its 100 (RE 8).
 */

import type { Command, CombatantId, FFXCombatant } from '../../common/types.ts';
import { resolveCommand } from '../adapt/command.ts';
import { type Ctx, has } from '../state.ts';
import { frontLine, gameMod, livingFrontLine, randomLiving } from './game-rolls.ts';
import { aeonHoldsField, counterAllowed, react, reactionAim } from './hit-gates.ts';
import { type AiContext, aiContextFor, registerAiScript, use } from './types.ts';
import { type HitReport, type UsedCommand, queueEmit, registerScriptHooks } from './hooks.ts';
import {
  PRESS_CHANCE_BELOW,
  SCAN_RECORD_ID,
  SM_CALLOUT_FIRST,
  SM_CALLOUT_SECOND,
  SM_DOUBLECAST_FLAG,
  SM_HINTS_FLAG,
  SM_ROWS,
  SM_SCRIPT,
  SM_SHIFTS_FLAG,
  ensureState,
  flagNumber,
  frontIds,
  hitBitsAtHit,
  isAbsorbed,
  pressLine,
  readHit,
  setNewState,
  smStateOf,
} from './spherimorph-rules.ts';

export * from './spherimorph-rules.ts';

/** One Spherimorph turn (RE 4.2). */
export function spherimorphTurn(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  ensureState(ctx, self);
  const front = livingFrontLine(ctx);
  if (front.length === 0) return null;
  const draw = gameMod(ctx, 100); // taken on every turn: the script's test evaluates both of its halves
  if (draw < PRESS_CHANCE_BELOW && self.hp < pressLine(self.stats.maxHp)) return use(ai, SM_ROWS.press, front.map((c) => c.id));
  const victim = randomLiving(ctx);
  return victim === undefined ? null : { kind: 'attack', targets: [victim.id] };
}

/** The banners (RE 4.3 onTargeted, `v13`): the first when Lulu stands in the front line, the second on the next absorbed spell. Each is spent once. Emitted after the action's own events. */
function raiseHint(ctx: Ctx): void {
  const shown = flagNumber(ctx, SM_HINTS_FLAG);
  if (shown >= 2) return;
  if (shown === 0 && !frontLine(ctx).some((c) => c.id === 'lulu')) return;
  ctx.state.flags[SM_HINTS_FLAG] = shown + 1;
  queueEmit(ctx, { type: 'script-trigger', name: shown === 0 ? SM_CALLOUT_FIRST : SM_CALLOUT_SECOND, payload: {} });
}

/** Spherimorph hears a command name it as a target, before any damage (RE 4.3 onTargeted). */
function spherimorphOnTargeted(ctx: Ctx, self: FFXCombatant, used: UsedCommand): void {
  if (used.user.id === self.id) return; // its own spell bounced back at it
  ensureState(ctx, self);
  const facts = readHit(used.def, used.user);
  if (facts.damageType === 2 && isAbsorbed(smStateOf(ctx), facts)) raiseHint(ctx);
}

/** Spherimorph hears it was hit, after the damage and before the death check (RE 4.3 onHit). */
function spherimorphOnHit(ctx: Ctx, self: FFXCombatant, used: UsedCommand, report: HitReport): void {
  if (self.hp <= 0 || !self.alive) return; // HP 0: nothing
  if (has(self, 'threaten')) return; // Threaten on it: nothing
  if (!counterAllowed(ctx, self)) return; // a reaction is resolving, or it cannot act: nothing
  if (used.user.id === self.id) return; // its own spell bounced back at it
  ensureState(ctx, self);
  const state = smStateOf(ctx);
  const facts = readHit(used.def, used.user);
  const bits = hitBitsAtHit(used.def, used.user, facts);

  // The Doublecast gate: the first spell of a pair is ignored, the second handled normally.
  if (ctx.rt.doublecasting === true && ctx.state.flags[SM_DOUBLECAST_FLAG] !== true) {
    ctx.state.flags[SM_DOUBLECAST_FLAG] = true;
    return;
  }
  ctx.state.flags[SM_DOUBLECAST_FLAG] = false;

  const ai = aiContextFor(ctx, self);
  const aim = reactionAim(ctx, used.user);
  const answer = (id: string, targets: CombatantId[]): void => void react(ctx, self, aim, use(ai, id, targets));
  const onFront = (id: string): void => answer(id, frontIds(ctx));
  const onAttacker = (): void => { if (used.user.alive) answer(state.physical, [used.user.id]); }; // the game's queue refuses a command aimed at a combatant that is gone

  if (resolveCommand(used.def, used.user).record.id === SCAN_RECORD_ID) return onFront(state.magic);
  if (!facts.affectsHp) return;

  let shift = false;
  if (facts.damageType === 2) {
    if (isAbsorbed(state, facts)) {
      if (aeonHoldsField(ctx)) onFront(state.physical); // an aeon on the field: the player-side row, on the aeon
      else onFront(state.magic);
    } else if (bits === 0) onFront(state.magic); // element-free magic that affects HP (Flare, Demi, Ultima)
    else shift = true; // the weakness
  }
  if (facts.damageType === 1) {
    if (report.lastDamage > 0 && bits !== 0) shift = true; // it took damage from an elemental blow
    else onAttacker();
  }
  if (facts.damageType === 0) {
    if (report.lastDamage < 0) {
      if (bits !== 0) onFront(state.magic); // healed by an elemental special
    } else if (bits !== 0) shift = true;
    else onAttacker();
  }

  if (!shift) return;
  setNewState(ctx, self); // the flags, the counter rows and the affinities are rewritten at once, before the shift action runs
  ctx.state.flags[SM_SHIFTS_FLAG] = flagNumber(ctx, SM_SHIFTS_FLAG) + 1;
  react(ctx, self, self.id, use(ai, SM_ROWS.shift, [self.id]));
}

registerAiScript(SM_SCRIPT, spherimorphTurn);
registerScriptHooks(SM_SCRIPT, { preTurn: (ctx, self) => void ensureState(ctx, self), onTargeted: spherimorphOnTargeted, onHit: spherimorphOnHit });
