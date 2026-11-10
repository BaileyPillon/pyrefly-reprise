/**
 * **The Greater Sphere's script** (FFX only; the hidden Gauntlet chapter's act 5, the Monster Arena's Original beside Spherimorph, monster file `m281`, 1,500,000 HP), as the game's own bytecode runs it
 * (`research/re-ffx-monster-arena-creations.md` 3.5, "RE n": 3,853 bytes of code). **No number here is ours.** The note had it "read in outline only"; this lane **ran the real bytecode end to end** in the earlier lanes'
 * interpreter (the Spherimorph lane's harness, read only, adapted to this file's variables) and the reply table below is that run's, row for row, over four states, twenty commands and both signs of the damage
 * (`tests/unit/chapters/gauntlet-greater-sphere.test.ts` pins it, with the exact tallies). The rows are `data/ffx/enemies/gauntlet-abilities.ts` (Attack, Hydraulic Press, Ultima 0x40F3, Elemental Shift) and the party's own
 * -aga spells and Flare; the record is `data/ffx/enemies/gauntlet.ts`.
 *
 * It is **Spherimorph's machine with different answers**: the same four starting states, the same affinities, the same Doublecast gate and the same shift; the replies differ, and so does the turn.
 *
 * ## The state (`v5`, 0 to 3; init draws `GetRandomValue() mod 4`, 16,384 of 65,536 each)
 *
 * Weak Fire, Ice, Thunder or Water: the weakness takes damage, **the other three elements and Holy are absorbed** (`./spherimorph-rules.ts#applyState`, the same writes). Each state carries two counter rows: the **player-side
 * row** (`v7`), the -aga of the element **opposite** the weakness (Fire and Ice are a pair, Thunder and Water the other: state 0 Blizzaga, 1 Firaga, 2 Waterga, 3 Thundaga), and the **monster-side row** (`v8`), which is
 * **Ultima (0x40F3) in all four states**.
 *
 * ## The turn (once per Greater Sphere turn)
 *
 * A draw modulo 100 is taken **every turn** (both halves of the test are evaluated). **Below half its HP (strictly) and the draw under 50: Hydraulic Press** on the front line. Otherwise a second draw modulo 2:
 * 0 = **Hydraulic Press** on the front line, 1 = **Attack** on a random living member. So above half it presses 50.00 percent of its turns, below half 75.01 percent. It never casts on its own turn.
 *
 * ## When it is hit (once per action per target; the first line that applies ends it)
 *
 * | # | Condition | What it does |
 * |---:|---|---|
 * | 1 | Threaten on it, a counter not allowed (a reaction is resolving, it cannot act), HP 0 | nothing |
 * | 2 | the attacker is mid-Doublecast and the gate is not armed | arm the gate and **ignore this spell** (the first of the pair) |
 * | 3 | the command is **Scan** | **Ultima** on the front line |
 * | 4 | the command does not affect HP | nothing |
 * | 5 | **magical**: *absorbed* -> the **monster-side row (Ultima) on the front line**, or the **player-side -aga on the front line** when an aeon holds the field; no element at all (Flare, Demi, Ultima) -> Ultima on the front line; the weakness -> **shift** |
 * | 6 | **physical**: it took damage **and** the command carries an element (a weapon's counts) -> **Hydraulic Press** on the front line; otherwise (a plain blow, a miss) -> **Ultima** on the front line. **A physical hit never shifts it.** |
 * | 7 | **special**: absorbed -> Ultima on the front line; **healed** -> **Flare on one random member**; elemental -> **shift**; otherwise -> Hydraulic Press on the front line |
 * | 8 | the shift: a new state, a uniform draw over all four (the old one included), written at once, and Elemental Shift queued on itself |
 *
 * *Absorbed* is Spherimorph's reading (`v9 = 128` in the bytes): the command affects HP, carries at least one of the five elements, and either lacks the weakness' bit or carries Holy. The elements a command carries are read
 * as Spherimorph's script reads them (`./spherimorph-rules.ts#readHit`: a magical command its own five bits, any other the actor's reading, which adds the attacker's weapon element). Wakka's commands are re-read at the
 * hit without the weapon and without Holy (the same list of record ids).
 *
 * ## Deviations, said (rule 6: none is a number)
 *
 * - **No banners.** Spherimorph raises two hint banners; this script has none.
 * - **The Doublecast gate reads `FFXRuntime.doublecasting`**, as Spherimorph's does.
 * - **MP.** A monster pays no MP in this engine; the note did not read whether the game charges the Sphere's 999.
 */

import type { Command, CombatantId, FFXCombatant } from '../../common/types.ts';
import { resolveCommand } from '../adapt/command.ts';
import { type Ctx, has, tryActor } from '../state.ts';
import { gameMod, livingFrontLine, randomLiving } from './game-rolls.ts';
import { aeonHoldsField, counterAllowed, react, reactionAim } from './hit-gates.ts';
import { type HitReport, type UsedCommand, registerScriptHooks, scriptIdOf } from './hooks.ts';
import { type AiContext, aiContextFor, registerAiScript, use } from './types.ts';
import { PRESS_CHANCE_BELOW, SCAN_RECORD_ID, type SmState, applyState, drawState, flagNumber, frontIds, hitBitsAtHit, isAbsorbed, pressLine, readHit } from './spherimorph-rules.ts';
import {
  GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, SPHERE_DOUBLECAST_FLAG, SPHERE_SHIFTS_FLAG, SPHERE_STATE_FLAG,
} from './gauntlet-rules.ts';

/** The four states (RE n 3.5, the run): the weakness, the player-side counter row and the monster-side counter row. State 0 to 3 is Fire, Ice, Thunder, Water, as Spherimorph's. */
export const GS_STATES: readonly SmState[] = [
  { weak: 'fire', physical: ROW.blizzaga, magic: ROW.ultima },
  { weak: 'ice', physical: ROW.firaga, magic: ROW.ultima },
  { weak: 'lightning', physical: ROW.waterga, magic: ROW.ultima },
  { weak: 'water', physical: ROW.thundaga, magic: ROW.ultima },
];

/** The second draw of a turn is `mod 2`: 0 is Hydraulic Press, 1 the Attack. */
export const GS_COIN_MODULO = 2;
export const GS_PRESS_DRAW = 0;

/** The state now, 0 to 3, or `undefined` before it was drawn. */
export function sphereStateIndex(ctx: Pick<Ctx, 'state'>): number | undefined {
  const v = ctx.state.flags[SPHERE_STATE_FLAG];
  return typeof v === 'number' && v >= 0 && v < GS_STATES.length ? v : undefined;
}

/** The current state's row (state 0 if it was never drawn: the callers draw first). */
export function sphereStateOf(ctx: Pick<Ctx, 'state'>): SmState {
  return GS_STATES[sphereStateIndex(ctx) ?? 0] as SmState;
}

/** Draw a state, write it and its affinities. `shifts` counts only the changes a hit made (the battle's start is not one). */
export function setNewState(ctx: Ctx, self: FFXCombatant): number {
  const state = drawState(ctx);
  ctx.state.flags[SPHERE_STATE_FLAG] = state;
  applyState(self, state);
  return state;
}

/** The state, drawn and written on first need (the battle's start, `./gauntlet-setup.ts`, or the first hook of a runtime rebuilt without the set-up: the advisor's dry runs). */
export function ensureSphereState(ctx: Ctx, self: FFXCombatant): number {
  const have = sphereStateIndex(ctx);
  if (have !== undefined) return have;
  ctx.state.flags[SPHERE_DOUBLECAST_FLAG] = false;
  ctx.state.flags[SPHERE_SHIFTS_FLAG] = 0;
  return setNewState(ctx, self);
}

/** The battle's start: one draw picks the state and the affinities are written at once. A no-op unless `self` is the Greater Sphere. */
export function applySphereSetup(ctx: Ctx, id: string): void {
  const self = tryActor(ctx, id);
  if (self === undefined || scriptIdOf(self) !== GAUNTLET_SCRIPTS.greaterSphere) return;
  ensureSphereState(ctx, self);
}

/** One Greater Sphere turn (RE n 3.5). */
export function greaterSphereTurn(ai: AiContext): Command | null {
  const { ctx, self } = ai;
  ensureSphereState(ctx, self);
  const front = livingFrontLine(ctx);
  if (front.length === 0) return null;
  const draw = gameMod(ctx, 100); // taken on every turn: the script's test evaluates both of its halves
  const press = (): Command => use(ai, ROW.hydraulicPress, front.map((c) => c.id));
  if (draw < PRESS_CHANCE_BELOW && self.hp < pressLine(self.stats.maxHp)) return press();
  if (gameMod(ctx, GS_COIN_MODULO) === GS_PRESS_DRAW) return press();
  const victim = randomLiving(ctx);
  return victim === undefined ? null : use(ai, ROW.attack, [victim.id]);
}

/** The Greater Sphere hears it was hit, after the damage and before the death check (RE n 3.5). */
export function greaterSphereOnHit(ctx: Ctx, self: FFXCombatant, used: UsedCommand, report: HitReport): void {
  if (has(self, 'threaten')) return; // Threaten on it: nothing
  if (!counterAllowed(ctx, self)) return; // a reaction is resolving, or it cannot act: nothing
  if (self.hp <= 0 || !self.alive) return; // HP 0: nothing
  ensureSphereState(ctx, self);
  const state = sphereStateOf(ctx);
  const facts = readHit(used.def, used.user);
  const bits = hitBitsAtHit(used.def, used.user, facts);

  // The Doublecast gate: the first spell of a pair is ignored, the second handled normally.
  if (ctx.rt.doublecasting === true && ctx.state.flags[SPHERE_DOUBLECAST_FLAG] !== true) {
    ctx.state.flags[SPHERE_DOUBLECAST_FLAG] = true;
    return;
  }
  ctx.state.flags[SPHERE_DOUBLECAST_FLAG] = false;

  const ai = aiContextFor(ctx, self);
  const aim = reactionAim(ctx, used.user);
  const answer = (id: string, targets: CombatantId[]): void => void react(ctx, self, aim, use(ai, id, targets));
  const onFront = (id: string): void => answer(id, frontIds(ctx));

  if (resolveCommand(used.def, used.user).record.id === SCAN_RECORD_ID) return onFront(state.magic);
  if (!facts.affectsHp) return;

  const absorbed = isAbsorbed(state, facts);
  let shift = false;
  if (facts.damageType === 2) {
    if (absorbed) onFront(aeonHoldsField(ctx) ? state.physical : state.magic); // an aeon on the field: the player-side -aga, on the aeon
    else if (bits === 0) onFront(state.magic); // element-free magic that affects HP (Flare, Demi, Ultima)
    else shift = true; // the weakness
  }
  if (facts.damageType === 1) {
    if (report.lastDamage > 0 && bits !== 0) onFront(ROW.hydraulicPress); // it took damage from an elemental blow
    else onFront(state.magic); // a plain blow, or a miss
  }
  if (facts.damageType === 0) {
    if (absorbed) onFront(state.magic);
    else if (report.lastDamage < 0) {
      const victim = randomLiving(ctx); // healed by an element it absorbs without a bit that says so: Flare on one member
      if (victim !== undefined) answer(ROW.flare, [victim.id]);
    } else if (bits !== 0) shift = true;
    else onFront(ROW.hydraulicPress);
  }

  if (!shift) return;
  setNewState(ctx, self); // the affinities and the counter rows are rewritten at once, before the shift action runs
  ctx.state.flags[SPHERE_SHIFTS_FLAG] = flagNumber(ctx, SPHERE_SHIFTS_FLAG) + 1;
  react(ctx, self, self.id, use(ai, ROW.elementalShift, [self.id]));
}

registerAiScript(GAUNTLET_SCRIPTS.greaterSphere, greaterSphereTurn);
registerScriptHooks(GAUNTLET_SCRIPTS.greaterSphere, { preTurn: (ctx, self) => void ensureSphereState(ctx, self), onHit: greaterSphereOnHit });
