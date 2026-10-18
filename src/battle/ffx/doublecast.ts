/**
 * **Doublecast**, resolved: two Black Magic casts for one turn, each its own sub-action.
 *
 * Sources: `research/ffx-combat-core.md` §7.4 row 41 — *"Two Blk Magic casts at
 * a fixed rank 3"*, MP *"0 (+ both spells' MP)"* — and
 * `research/ffx-bfa-yu-yevon.md` §4.2, whose preset recommendation grants
 * *"Doublecast + Firaga/Thundaga"* `[verified: 2 sources]`; §3.4.1's worked
 * example is *"Doublecast Firaga/Firaga"*, two damage instances in one action.
 * The game's composition and its MP (re-parity RC10 lane FFX-N, FFX-G07 3.5, 3.6 and 3.11, finding 13):
 *
 * - **Two picks.** The menu closes one sub-action at each target pick, and a Doublecast asks for two: spell 1 and its target, then spell 2 and its target. The two
 *   spells may differ. {@link castsOf} is the engine's model of that (`AbilityCommand.casts`); the older shape — one spell in `wrappedId`, one target or two in
 *   `targets` — is read as the pair it always stood for (the adapter), draw for draw and event for event.
 * - **The MP is paid at each cast, at its own cost.** Each sub-action starts with a fresh cost check, and the payment follows it. **Measured on the Steam copy**
 *   (live session 4, 2026-10-17, case 1, FFX-G07 open question 1 closed): Lulu with Half MP chose Doublecast, Fire, Firaga; the MP went 452 -> 450 as Fire
 *   was cast (2 = half of 4) and 450 -> 442 about 4.6 s later as Firaga was cast (8 = half of 16). So the first spell's cost is paid when the first spell is
 *   cast and the second's when the second is, each with the caster's modifiers (Half, One, Magic Booster, Spellspring) applied to **that spell**, and a second
 *   spell the MP that is left cannot pay does not start. While the second spell is *chosen* the first one's cost is the menu's pending MP (3.6): {@link doublecastPicks}.
 *
 * Moved out of `execute.ts` (which routes here) when the self-aim defect was
 * fixed [critic round 09, PR-0125]. The command the menu offered for the
 * Doublecast row carried the row's own self placeholder as its aim —
 * `targets: ['lulu']`, no `wrappedId` — and this resolver took both the
 * fallback spell and that aim literally: Firaga twice on Lulu, a self-KO on
 * seeds 1 and 7. The menu now asks for the spell and its target
 * (`ui/ffx/CommandMenu.ts`, `AvailableCommand.wrapsCategory`); {@link aimFor}
 * is the engine's own guarantee that an offensive spell is never pointed back
 * at its caster by a self-only placeholder, whoever submitted it.
 *
 * **FFX only** [AGENTS.md rule 14]: Doublecast is Lulu's FFX ability, and the
 * only builds that give it to a line are Chapter 3's `dreams-end` and the Sin chapters'.
 *
 * Pure and deterministic like the rest of `battle/`: the one fallback pick uses
 * the battle's engine-side stream, exactly as `resolveTargets` does for an empty
 * aim (the game draws nothing for a target the player chose).
 */

import type { AbilityCommand, AbilityDef, CombatantId, FFXCombatant, Targeting } from '../common/types.ts';
import { type Ctx, abilityOf, rankOf } from './state.ts';
import { blockedBySilence, mpCostFor, resolveAbility } from './abilities.ts';
import { applyMpDelta } from './hp.ts';
import { validTargets } from './targeting.ts';
import { aimGate, costGate } from './command-start.ts';
import { usableCost } from './kernel/command-gate.ts';
import { gateChrOf, gateRecordOf } from './adapt/command-gate.ts';
import type { ExecutionResult } from './execute.ts';

/** Targeting values that point at the caster's opponents. */
const AIMS_AT_FOES = new Set<Targeting>(['single-enemy', 'all-enemies', 'random-enemy']);

/** One cast, planned: the spell and the aim it goes to. */
export interface PlannedCast {
  spell: AbilityDef;
  aim: CombatantId[];
}

/** The two casts of a Doublecast (a slot is `null` when its pick could not be resolved to a spell) and the targets the single bracket of a one-spell pair announces. */
export interface DoublecastPlan {
  casts: [PlannedCast | null, PlannedCast | null];
  announce: CombatantId[];
}

/**
 * Resolve one Doublecast.
 *
 * The caller's command names the two casts (`command.casts`) or, in the older shape, one spell (`wrappedId`) twice. A pick that is not Black Magic the caster has
 * learned falls back to the strongest spell the caster can pay for twice rather than being refused, because refusing a row the menu offered is how a headless
 * caller ends up resubmitting it for ever. Each cast is a sub-action with its own checks and its own payment, and the pair costs a single rank-3 turn.
 */
export function resolveDoublecast(ctx: Ctx, actor: FFXCombatant, def: AbilityDef, command: AbilityCommand): ExecutionResult {
  const plan = castsOf(ctx, actor, command);
  const [first, second] = plan.casts;
  const firstSpell = first?.spell ?? second?.spell;
  if (!firstSpell) {
    ctx.emit({ type: 'message', text: `${actor.name} has no spell to double`, kind: 'system' });
    return { rank: rankOf(def), damageDealt: 0, def };
  }
  // A pair of one spell is one bracket, as it always was. A pair of two different spells opens a bracket per spell (the Omnis volley's precedent, `volley.ts`) so
  // the presenter plays each spell's own effect.
  const mixed = first !== null && second !== null && first.spell.id !== second.spell.id;
  const open = (spell: AbilityDef, targets: CombatantId[]): void => {
    ctx.emit({
      type: 'action-start',
      actorId: actor.id,
      command: { kind: 'ability', id: def.id, targets: targets.slice(), wrappedId: spell.id },
      abilityId: spell.id,
      abilityName: `${def.name}: ${spell.name}`,
      targets: targets.slice(),
    });
  };
  open(firstSpell, mixed ? (first?.aim ?? []) : plan.announce);
  let dealt = 0;
  let last = firstSpell;
  for (const [i, cast] of plan.casts.entries()) {
    if (cast === null) continue;
    const { spell, aim } = cast;
    // Each cast is a sub-action of its own and starts with its own checks (re-parity RC7 lane L-CMD, `command-start.ts`): Silence and the MP again — the MP that is
    // left after the cast before it — and the range filter (a target the first cast killed is dropped, and nobody takes its place). A cast that does not start pays
    // nothing; the next one is checked on its own.
    if (!costGate(actor, spell, false) || !aimGate(ctx, actor, spell, aim, spell.hits).ok) continue;
    if (mixed && i === 1) {
      ctx.emit({ type: 'action-end', actorId: actor.id });
      open(spell, aim);
    }
    // Paid at this cast's own cost check, at this spell's own cost, with the caster's modifiers as they stand now.
    const cost = mpCostFor(actor, spell);
    if (cost > 0) applyMpDelta(ctx, actor, cost, actor.id);
    last = spell;
    const seqBefore = ctx.state.nextSeq;
    dealt += resolveAbility(ctx, actor, spell, aim);
    // Yunalesca (FFX only): a form dying in the first cast cancels the second, which would otherwise hit the next form
    // (`pp_BtlSubHp` marks it and `pp_BtlExecuteAction` drops the sub-action; research/re-ffx-ai-yunalesca-bfa.md 2.11).
    if ((ctx.rt.formDiedAtSeq ?? -1) >= seqBefore) break;
  }
  ctx.emit({ type: 'action-end', actorId: actor.id });
  return { rank: rankOf(def), damageDealt: dealt, def: last };
}

/**
 * The two casts a Doublecast command stands for.
 *
 * `command.casts` is the game's composition: spell 1 with target 1, spell 2 with target 2, each aim checked by {@link aimFor}. Without it the older shape is the adapter:
 * `wrappedId` is the spell (a command without a usable one falls back to the strongest spell the caster can pay for twice), `targets` holds one aim for both casts or,
 * with two ids, one for each — which is how the chapter's line takes both Yu Pagodas off the board in one turn (§1.4). The spell is resolved from its own record, so
 * everything it carries — `canMiss: false` for all Black Magic [AGENTS.md hard rule 5], its element, its reflectability — rides through unchanged.
 */
export function castsOf(ctx: Ctx, actor: FFXCombatant, command: AbilityCommand): DoublecastPlan {
  if (command.casts !== undefined) {
    const planned = command.casts.map((pick): PlannedCast | null => {
      const spell = pickedSpell(ctx, actor, pick.id) ?? strongestAffordableBlackMagic(ctx, actor);
      return spell ? { spell, aim: aimFor(ctx, actor, spell, pick.targets) } : null;
    }) as DoublecastPlan['casts'];
    const announce: CombatantId[] = [];
    for (const cast of planned) for (const id of cast?.aim ?? []) if (!announce.includes(id)) announce.push(id);
    return { casts: planned, announce };
  }
  const spell = pickedSpell(ctx, actor, command.wrappedId) ?? strongestAffordableBlackMagic(ctx, actor);
  if (!spell) return { casts: [null, null], announce: [] };
  const targets = aimFor(ctx, actor, spell, command.targets);
  const aims: CombatantId[][] = targets.length >= 2 ? [[targets[0]!], [targets[1]!]] : [targets.slice(), targets.slice()];
  return { casts: [{ spell, aim: aims[0]! }, { spell, aim: aims[1]! }], announce: targets };
}

/** The spell a pick names, if it is Black Magic the caster has learned. */
function pickedSpell(ctx: Ctx, actor: FFXCombatant, id: string | undefined): AbilityDef | undefined {
  const spell = id !== undefined ? abilityOf(ctx, id) : undefined;
  return spell && spell.category === 'blackmagic' && actor.learnedAbilityIds.includes(spell.id) ? spell : undefined;
}

/**
 * Where a cast goes.
 *
 * **The safety net [PR-0125].** The Doublecast row targets its own caster
 * (`targeting: 'self'`) because the enemy is chosen inside it, so a caller that
 * submits the row as offered hands over `[casterId]` — or nothing. For a spell
 * that points at the caster's opponents that aim is a placeholder, not a
 * choice, and it is replaced by the spell's own legal targets: all of them for
 * a spell that hits every foe, otherwise one foe picked with the battle's seeded
 * RNG (the rule `resolveTargets` already applies to an empty aim). Any other aim
 * — a real foe, or an ally someone chose on purpose — is left exactly as
 * submitted.
 */
export function aimFor(
  ctx: Ctx,
  actor: FFXCombatant,
  spell: AbilityDef,
  submitted: readonly CombatantId[],
): CombatantId[] {
  if (!AIMS_AT_FOES.has(spell.targeting)) return submitted.slice();
  if (!submitted.every((id) => id === actor.id)) return submitted.slice();
  const legal = validTargets(ctx, actor, spell);
  if (legal.length === 0) return [];
  return spell.targeting === 'all-enemies' ? legal : [ctx.rng.aux.pick(legal)]; // a placeholder aim the player would have chosen: the engine-side stream
}

/** The biggest Black Magic spell this caster knows and can pay for twice. */
function strongestAffordableBlackMagic(ctx: Ctx, actor: FFXCombatant): AbilityDef | undefined {
  let best: AbilityDef | undefined;
  for (const id of actor.learnedAbilityIds) {
    const d = abilityOf(ctx, id);
    if (!d || d.category !== 'blackmagic' || d.power <= 0) continue;
    if (mpCostFor(actor, d) * 2 > actor.mp) continue;
    if (!best || d.power > best.power) best = d;
  }
  return best;
}

/** One Black Magic spell as a pick of the Doublecast menu, with the real numbers the picker shows. */
export interface DoublecastPick {
  id: string;
  name: string;
  /** The MP this spell costs this caster, Half MP and the other modifiers applied to this spell. */
  mpCost: number;
  /** Offered as the **first** pick: not Silenced, and the cost is within the MP. */
  first: { enabled: boolean; reason?: 'Silenced' | 'Not enough MP' };
  /** Offered as the **second** pick after `firstId`: the first cast's cost is pending MP, so first cost + this cost must be within the MP. `mpAfter` is the MP left once both are paid. */
  second?: { enabled: boolean; reason?: 'Silenced' | 'Not enough MP'; pendingMp: number; mpAfter: number };
}

/**
 * The Black Magic a Doublecast offers, for the picker (the menu-side gate, FFX-G07 3.6; `kernel/command-gate.ts#usableCost` with its pending-MP argument).
 * With `firstId` it also says which spells are still offered as the second pick: the first spell's cost is the pending MP while the second is chosen.
 * Pure: it reads, it pays nothing and draws nothing. The picker is the release driver's job; this is the data it reads.
 */
export function doublecastPicks(ctx: Ctx, actor: FFXCombatant, firstId?: string): DoublecastPick[] {
  const first = firstId !== undefined ? pickedSpell(ctx, actor, firstId) : undefined;
  const pending = first ? mpCostFor(actor, first) : 0;
  const rows: DoublecastPick[] = [];
  for (const id of actor.learnedAbilityIds) {
    const def = abilityOf(ctx, id);
    if (!def || def.category !== 'blackmagic') continue;
    const cost = mpCostFor(actor, def);
    const gate = (pendingMp: number): { enabled: boolean; reason?: 'Silenced' | 'Not enough MP' } => {
      if (blockedBySilence(actor, def)) return { enabled: false, reason: 'Silenced' };
      const ok = usableCost(gateRecordOf(def), gateChrOf(actor), { monster: actor.side === 'enemy' }, pendingMp) >= 0;
      return ok ? { enabled: true } : { enabled: false, reason: 'Not enough MP' };
    };
    const row: DoublecastPick = { id: def.id, name: def.name, mpCost: cost, first: gate(0) };
    if (first) row.second = { ...gate(pending), pendingMp: pending, mpAfter: actor.mp - pending - cost };
    rows.push(row);
  }
  return rows;
}
