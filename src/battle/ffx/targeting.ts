/**
 * Turning a {@link Targeting} value into actual combatants.
 *
 * The UI never re-derives legality — `AvailableCommand.validTargets` comes from
 * here already resolved [docs/CONTRACTS.md].
 */

import type { AbilityDef, CombatantId, FFXCombatant, Targeting } from '../common/types.ts';
import {
  type Ctx,
  alliesOf,
  enemies,
  friendlies,
  isAlive,
  livingEnemies,
  livingFriendlies,
  onField,
  targetable,
  tryActor,
} from './state.ts';
import { isReachZero, reachOf } from './reach.ts';
import { actorNumber } from './ai/script-random.ts';
import { rangeFilter } from './kernel/command-range.ts';

/**
 * **Reach — the airship range gate.** FFX only.
 *
 * `research/ffx-evrae-airship.md` §4.3 `[verified: 2 sources]`: while the
 * *Fahrenheit* is pulled back, the only player actions that cross the gap are
 * **Blk Magic, Wakka's physical attacks and Lancet**. Tidus, Auron, Rikku and
 * Kimahri's ordinary attacks, Steal and offensive items do not.
 *
 * Three things about the shape of this function matter:
 *
 * 1. **It returns `true` unconditionally when `state.flags['airship.range']` is
 *    unset**, which is every other battle in the project, so nothing outside
 *    this one encounter changes behaviour. The FFX-2 ATB engine never reaches
 *    it at all.
 * 2. **Allies always reach.** Items, Wht Magic, Cheer, Focus and Rikku's party
 *    Mixes target your own side, so "reach" is meaningless for them. §4.3 is
 *    explicit that this asymmetry must not be smoothed: FAR is the *setup*
 *    zone, not a dead zone, and that is the mechanical seed of the whole
 *    chapter. C-2's recommended default — offensive items and Steal do **not**
 *    reach — falls straight out of the same rule.
 * 3. **Wakka's reach is a property of the character, not of the action**
 *    (`ActorRuntime.rangedWeapon`, set by the encounter's setup hook). An
 *    `AutoAbilityId` was considered and rejected: auto-abilities are
 *    customisation slots the player can move, and the blitzball is not
 *    customisable.
 *
 * The `'long-range'` ActionFlag is honoured too, so the enemy rows that carry
 * it (Swooping Scythe, Photon Spray, Guided Missiles, Evrae's own Haste) are
 * unaffected. Note the flag keeps its **FFX-2** meaning wherever FFX-2 reads it
 * — no approach time, never breaks a chain — and nothing here touches that.
 *
 * **Reach is a property of the gap, not of the row.** It is asked per *side*,
 * because several rows point at both: Phoenix Down is `single-any` (it doubles
 * as the anti-undead item), and a whitelist of targeting tokens refused the
 * party's only revive while the ship stood off — the state the chapter's whole
 * tactic asks the player to sit in. {@link reachesFoesAtRange} answers "does
 * this cross the gap", {@link reachesAtRange} answers "is there anything at all
 * this can be pointed at", and {@link validTargets} drops the far side rather
 * than the whole row.
 */
export function reachesFoesAtRange(ctx: Ctx, user: FFXCombatant, def: AbilityDef): boolean {
  if (ctx.state.flags['airship.range'] !== 'far') return true;
  // The enemy side has its own range rules, enforced by its AI script rather
  // than by menu legality: Evrae simply does not select a melee row at FAR.
  if (user.side === 'enemy') return true;

  if (def.flags.includes('long-range')) return true;
  // "only magic, Lancet, and Wakka's physical attacks can reach Evrae" — the
  // categories are the sourced sentence, not a guess about individual rows.
  if (def.category === 'blackmagic' || def.category === 'whitemagic') return true;
  if (def.formula === 'lancet') return true;
  if (def.damageType === 'physical' && ctx.rt.actors.get(user.id)?.rangedWeapon === true) return true;
  // Overdrive Sin after his second pull (BattleDistance 1, re-parity D-32): only the reach-0 commands stay out of range.
  if (ctx.state.flags['airship.distance'] === 1) return !isReachZero(def);
  return false;
}

/**
 * **Who reaches a foe out of melee range with a physical action**: Wakka, Valefor, Anima and Mindy (her normal Attack, not Passado). Kept as the
 * documentation of the old per-target rule and for the guides that cite it: since re-parity RC9 (lane FFX-G slice G-c) the engine no longer asks it, because
 * the game's own 4-level reach rule says the same thing and more ({@link reachesTarget}): their Attack records have reach 3 (Wakka, Valefor and Anima by the
 * record's 0x200 bit and their actor number, Mindy by her own record), every other plain Attack has reach 0. FFX only.
 */
export const REACHES_OUT_OF_MELEE: ReadonlySet<CombatantId> = new Set(['wakka', 'valefor', 'anima', 'mindy']);

/**
 * **Per-target reach, the game's rule** (`pp_BtlRangeCheck` 0x00791fa0 and the legal set 0x00799820; `kernel/legal-set.ts#commandReach`, `reach.ts#reachOf`; re-parity
 * RC9 lane FFX-G slice G-c). A target carries a signed BattleDistance (`CombatantFlags.battleDistance`, 0 for nearly everybody) and a command a reach of 0 to 3 from its
 * record: the command can pick the target only when the reach is **at least** the distance, or when the target is the user. A foe at distance 1 stops the reach-0
 * commands (Attack, the melee skills, Steal, the physical Overdrives); at distance 2 the reach-1 ones too (Spare Change, the aeon Overdrives); at distance 3 every item
 * (reach 2) as well, leaving the spells, Lancet and the commands of Wakka, Valefor, Anima and Mindy's Attack. The distances the project knows: Sinspawn Gui's head 1,
 * the Mortiphasm discs 2 (the formation script's battle-start worker, `research/re-ffx-ai-seymour.md` section 5.1, from lines 9906 to 9918 of the disassembly of `sins03_00`) and Sin's Genais Core 3 until Genais falls, then 0.
 *
 * A same-side target is always reachable here (the engine's scripts aim their own side's commands without a range test). The airship gap (Evrae's FAR, Overdrive
 * Sin's second pull) is not per target: it is decided by {@link reachesFoesAtRange}.
 */
export function reachesTarget(ctx: Ctx, user: FFXCombatant, def: AbilityDef, target: FFXCombatant): boolean {
  const distance = target.flags.battleDistance ?? 0;
  if (distance <= 0 || user.side === target.side) return true;
  return reachOf(def, actorNumber(ctx, user)) >= distance;
}

/** False for a combatant a random pick must skip (`CombatantFlags.neverRandomTarget`). */
export function randomPickable(c: FFXCombatant): boolean {
  return c.flags.neverRandomTarget !== true;
}

/** True when a targeting value can legally land on one of the user's own side. */
function canPointAtAllies(def: AbilityDef): boolean {
  switch (def.targeting) {
    case 'self':
    case 'single-ally':
    case 'all-allies':
    case 'random-ally':
    case 'single-any':
    case 'all':
      return true;
    default:
      return false;
  }
}

/**
 * True when *something* is still in reach of this row — the predicate
 * `commands.ts` turns into "Out of reach".
 *
 * §4.3: "Items and Wht Magic are irrelevant to reach **because they target your
 * own party**." So any row that can point at an ally stays legal at FAR; only
 * its enemy-side candidates are taken away.
 */
export function reachesAtRange(ctx: Ctx, user: FFXCombatant, def: AbilityDef): boolean {
  if (ctx.state.flags['airship.range'] !== 'far') return true;
  if (user.side === 'enemy') return true;
  return canPointAtAllies(def) || reachesFoesAtRange(ctx, user, def);
}

/** Candidates a command may legally be pointed at. */
export function validTargets(ctx: Ctx, user: FFXCombatant, def: AbilityDef): CombatantId[] {
  const canTargetDead = def.flags.includes('can-target-dead');
  const alive = (c: FFXCombatant): boolean => (canTargetDead ? onField(c) : isAlive(c));
  // The far side simply is not on the list. A foe-only row therefore comes back
  // empty exactly as it used to, and a `single-any` row keeps its allies.
  const reachable = reachesFoesAtRange(ctx, user, def) ? (user.side === 'enemy' ? friendlies(ctx) : enemies(ctx)) : [];
  const foes = reachable.filter(
    (c) => targetable(c) && alive(c) && reachesTarget(ctx, user, def, c) && (def.targeting !== 'random-enemy' || randomPickable(c)),
  );
  const mates = alliesOf(ctx, user).filter((c) => targetable(c) && alive(c));

  switch (def.targeting) {
    case 'single-enemy':
    case 'all-enemies':
    case 'random-enemy':
      return foes.map((c) => c.id);
    case 'single-ally':
    case 'all-allies':
    case 'random-ally':
      return mates.map((c) => c.id);
    case 'single-any':
    case 'all':
      return [...mates, ...foes].map((c) => c.id);
    case 'self':
      return [user.id];
    default:
      return [];
  }
}

/** True when a targeting value picks a fresh target for every hit. */
export function isPerHitRandom(targeting: Targeting): boolean {
  return targeting === 'random-enemy' || targeting === 'random-ally';
}

/**
 * What an action's aim comes to when it starts: who is left, whether one of them is still to be drawn, and how much of the aim fell short.
 * `targets` are the survivors (when `pick` is set, the candidates one of which an empty aim draws on the engine-side stream); `named` is how
 * many targets the command named; `outOfReach` counts the targets the reach rule dropped (`kernel/command-range.ts`).
 */
export interface Aim {
  targets: FFXCombatant[];
  pick: boolean;
  named: number;
  outOfReach: number;
}

/**
 * The aim of an action, worked out without drawing anything (re-parity RC7 lane L-CMD; FFX only).
 *
 * **There is no retarget** (`kernel/command-range.ts`, the game's `pp_BtlRangeCheck`): a target the command named that is gone from the field,
 * out of reach or dead (unless the command may target the dead) is dropped, and nothing takes its place. `resolveTargets` used to draw a
 * fresh random target when none of the named ones was left; the game starts nothing instead. An empty aim (a script's `targets: []`, a placeholder)
 * is not a named target: it is the engine's stand-in for the game's script choosing, so it still draws one legal target.
 */
export function aimOf(ctx: Ctx, user: FFXCombatant, def: AbilityDef, chosen: readonly CombatantId[]): Aim {
  // Resolution honours the same gap the menu does, so an explicitly submitted
  // target cannot cross a gap the menu refused to offer — nor land on a foe the
  // menu never offers (`targetable`: untargetable or hidden, like Macalania's
  // Seymour or Yojimbo's Ginnem and Daigoro). A same-side pick is unchanged.
  const crosses = reachesFoesAtRange(ctx, user, def);
  const opposite = user.side === 'enemy' ? livingFriendlies(ctx) : livingEnemies(ctx);
  // Per-target reach and the never-a-random-pick flag (Chapter XII's discs)
  // filter nothing for any combatant without those flags, so the arrays below
  // — and every RNG draw made from them — are unchanged elsewhere.
  const foes = (crosses ? opposite : []).filter((c) => reachesTarget(ctx, user, def, c));
  const randomFoes = foes.filter(randomPickable);
  const mates = alliesOf(ctx, user).filter((c) => targetable(c) && (def.flags.includes('can-target-dead') || isAlive(c)));
  const all = (targets: FFXCombatant[], named = 0): Aim => ({ targets, pick: false, named, outOfReach: targets.length === 0 ? opposite.length - foes.length : 0 });

  // A scripted group (the game's `performCommand(group, command)`): exactly the combatants the script named, whatever the
  // row's own single or multi flag says [re-ffx-ai-yunalesca-bfa §1.4]. Only rows with `extra.groupTarget`: Yu Yevon's
  // Gravija (the front line and himself, not his Pagodas), his and the Pagodas' Osmose, and the possessed aeons' specials
  // the script aims at one actor or at the whole front line. It comes before the switch because the multi rows
  // ('all', 'all-enemies') would otherwise ignore the list.
  if (def.extra?.['groupTarget'] === true && chosen.length > 0) {
    const group = chosen.map((id) => tryActor(ctx, id)).filter((c): c is FFXCombatant => c !== undefined && onField(c) && isAlive(c));
    return { targets: group, pick: false, named: chosen.length, outOfReach: 0 };
  }

  switch (def.targeting) {
    case 'self':
      return all([user]);
    case 'all-enemies':
      return all(foes);
    case 'all-allies':
      return all(mates);
    case 'all':
      return all([...mates, ...foes]);
    // A random-target row's action carries the whole set. The picks (one per hit) are made by the target builder once the action's targets
    // are built (`target-build.ts`, the game's pp_BtlBuildTargetHits), not here.
    case 'random-enemy':
      return all(randomFoes);
    case 'random-ally':
      return all(mates);
    default:
      break;
  }

  if (chosen.length > 0) {
    // What the command named, through the game's range filter: out of reach and dead targets are dropped (the dead unless the command may
    // target them), and nobody takes their place.
    const named = chosen
      .map((id) => tryActor(ctx, id))
      .filter((c): c is FFXCombatant => c !== undefined && onField(c) && (c.side === user.side || targetable(c)));
    const seen = named.map((c) => ({
      isUser: c === user,
      far: c.side === user.side || (crosses && reachesTarget(ctx, user, def, c)) ? 0 : 1,
      dead: !isAlive(c),
    }));
    const out = rangeFilter(0, def.flags.includes('can-target-dead'), seen);
    return { targets: named.filter((_, i) => out.kept[i]).slice(0, 1), pick: false, named: chosen.length, outOfReach: out.outOfReach };
  }

  // The empty-aim fallback skips never-random foes too (Chapter XII's discs;
  // our estimate — research §2 names random-target attacks only).
  const fallback =
    def.targeting === 'single-ally' ? mates : def.targeting === 'single-any' ? [...randomFoes, ...mates] : randomFoes;
  // No aim at all (a script's `targets: []`, a placeholder): the game has no draw for this, so it is an engine stand-in on the engine-side stream.
  return { targets: fallback, pick: true, named: 0, outOfReach: fallback.length === 0 ? opposite.length - foes.length : 0 };
}

/**
 * The combatants one hit of this action lands on.
 *
 * `chosen` is what the command carried; an empty list falls back to the
 * targeting rule so an AI script can submit `targets: []` and get sane
 * behaviour. A named target that is gone, out of reach or dead is dropped and not replaced ({@link aimOf}).
 */
export function resolveTargets(
  ctx: Ctx,
  user: FFXCombatant,
  def: AbilityDef,
  chosen: readonly CombatantId[],
): FFXCombatant[] {
  const aim = aimOf(ctx, user, def, chosen);
  if (!aim.pick) return aim.targets;
  return aim.targets.length > 0 ? [ctx.rng.aux.pick(aim.targets)] : [];
}

/**
 * **A row whose script names who it hits** (`AbilityDef.extra.scriptAims`; re-parity, FFX only).
 *
 * The record says "random character", but the game's scripts do not leave it to the record: they pick the victim
 * themselves (`findMatchingChr`, or one of the three party slots) and queue the command *at* that actor
 * (`performCommand(target, command)`), so the hits go where the script aimed them. A row that sets the key is
 * resolved that way: hit `h` lands on the `h`-th target the command names (the last one when it names fewer), and
 * a command that names nobody is the record's own random pick, as before. See {@link aimedTargetForHit}.
 */
export function scriptAimsAt(def: AbilityDef): boolean {
  return def.extra?.['scriptAims'] === true;
}

/**
 * Whom hit `hit` of a script-aimed row lands on: the target the command named for it, **if the game's queue would
 * accept it** — on the field, targetable, and alive unless the command can target the dead (the exe's queue,
 * the function at 0x007ac9c0, rejects any other with a "TARGET ERROR" and that command is dropped). Otherwise nobody: the hit is
 * lost, which is how Natus's script loses half a Multi-ra when it aims the second half at a fallen third party slot.
 */
export function aimedTargetForHit(
  ctx: Ctx,
  def: AbilityDef,
  chosen: readonly CombatantId[],
  hit: number,
): FFXCombatant[] {
  const id = chosen[Math.min(hit, chosen.length - 1)];
  const c = id === undefined ? undefined : tryActor(ctx, id);
  if (!c || !onField(c) || !targetable(c)) return [];
  if (!isAlive(c) && !def.flags.includes('can-target-dead')) return [];
  return [c];
}

/** Every distinct target a script-aimed command names that the queue would accept (the `onTargeted` set). */
export function aimedTargets(ctx: Ctx, def: AbilityDef, chosen: readonly CombatantId[]): FFXCombatant[] {
  const out: FFXCombatant[] = [];
  for (let h = 0; h < chosen.length; h++) {
    for (const c of aimedTargetForHit(ctx, def, chosen, h)) if (!out.includes(c)) out.push(c);
  }
  return out;
}
