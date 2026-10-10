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
  canAct,
  enemies,
  friendlies,
  has,
  isAlive,
  livingEnemies,
  livingFriendlies,
  onField,
  targetable,
  tryActor,
} from './state.ts';
import { isReachZero } from './reach.ts';

/** `flagsMisc` bit 18: the command uses the weapon's properties (Wakka's weapon commands reach at range). */
const MISC_USES_WEAPON_BIT = 0x40000;

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
 * **Who reaches a foe out of melee range with a physical action**: Wakka,
 * Valefor, Anima and Mindy (her normal Attack, not Passado) — Seymour Omnis's
 * Mortiphasm discs [ffx-seymour-omnis §2, verified: 4 sources]. Mindy's
 * Passado nuance is not built: no preset owns the Magus Sisters. FFX only.
 */
export const REACHES_OUT_OF_MELEE: ReadonlySet<CombatantId> = new Set(['wakka', 'valefor', 'anima', 'mindy']);

/**
 * **Per-target reach** (`CombatantFlags.outOfMeleeReach`). Unlike the airship
 * gate above, which is a property of the whole gap, this is a property of one
 * foe: magic always reaches it, a physical action only from
 * {@link REACHES_OUT_OF_MELEE} or a ranged weapon (`ActorRuntime.rangedWeapon`).
 * True for every combatant without the flag, which is every combatant outside
 * Chapter XII, so no other battle changes.
 */
export function reachesTarget(ctx: Ctx, user: FFXCombatant, def: AbilityDef, target: FFXCombatant): boolean {
  // The game's own rule (`CombatantFlags.battleDistance`, Sinspawn Gui's head): the command's reach, from its record, against the target's distance. At distance 1 only the
  // reach-0 commands (Attack, the melee skills, the physical Overdrives) fall short; a user whose weapon reaches (Wakka's `rangedWeapon`) lands the commands that use the weapon too.
  const distance = target.flags.battleDistance ?? 0;
  if (distance > 0 && user.side !== target.side) {
    if (!isReachZero(def)) return true;
    return ctx.rt.actors.get(user.id)?.rangedWeapon === true && ((def.record?.flagsMisc ?? 0) & MISC_USES_WEAPON_BIT) !== 0;
  }
  if (target.flags.outOfMeleeReach !== true || user.side === target.side) return true;
  if (def.damageType !== 'physical') return true;
  return REACHES_OUT_OF_MELEE.has(user.id) || ctx.rt.actors.get(user.id)?.rangedWeapon === true;
}

/** False for a combatant a random pick must skip (`CombatantFlags.neverRandomTarget`). */
function randomPickable(c: FFXCombatant): boolean {
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
 * The combatants one hit of this action lands on.
 *
 * `chosen` is what the command carried; an empty list falls back to the
 * targeting rule so an AI script can submit `targets: []` and get sane
 * behaviour.
 */
export function resolveTargets(
  ctx: Ctx,
  user: FFXCombatant,
  def: AbilityDef,
  chosen: readonly CombatantId[],
): FFXCombatant[] {
  const pickAll = (list: FFXCombatant[]): FFXCombatant[] => list;
  // Resolution honours the same gap the menu does, so an explicitly submitted
  // target cannot cross a gap the menu refused to offer — nor land on a foe the
  // menu never offers (`targetable`: untargetable or hidden, like Macalania's
  // Seymour or Yojimbo's Ginnem and Daigoro). A same-side pick is unchanged.
  const crosses = reachesFoesAtRange(ctx, user, def);
  // Per-target reach and the never-a-random-pick flag (Chapter XII's discs)
  // filter nothing for any combatant without those flags, so the arrays below
  // — and every RNG draw made from them — are unchanged elsewhere.
  const foes = (crosses ? (user.side === 'enemy' ? livingFriendlies(ctx) : livingEnemies(ctx)) : []).filter((c) =>
    reachesTarget(ctx, user, def, c),
  );
  const randomFoes = foes.filter(randomPickable);
  const mates = alliesOf(ctx, user).filter((c) => targetable(c) && (def.flags.includes('can-target-dead') || isAlive(c)));

  // A scripted group (the game's `performCommand(group, command)`): exactly the combatants the script named, whatever the
  // row's own single or multi flag says [re-ffx-ai-yunalesca-bfa §1.4]. Only rows with `extra.groupTarget`: Yu Yevon's
  // Gravija (the front line and himself, not his Pagodas), his and the Pagodas' Osmose, and the possessed aeons' specials
  // the script aims at one actor or at the whole front line. It comes before the switch because the multi rows
  // ('all', 'all-enemies') would otherwise ignore the list.
  if (def.extra?.['groupTarget'] === true && chosen.length > 0) {
    return chosen.map((id) => tryActor(ctx, id)).filter((c): c is FFXCombatant => c !== undefined && onField(c) && isAlive(c));
  }

  switch (def.targeting) {
    case 'self':
      return [user];
    case 'all-enemies':
      return pickAll(foes);
    case 'all-allies':
      return pickAll(mates);
    case 'all':
      return [...mates, ...foes];
    case 'random-enemy':
      return randomFoes.length > 0 ? [ctx.rng.pick(randomFoes)] : [];
    case 'random-ally':
      return mates.length > 0 ? [ctx.rng.pick(mates)] : [];
    default:
      break;
  }

  const explicit = chosen
    .map((id) => tryActor(ctx, id))
    .filter(
      (c): c is FFXCombatant =>
        c !== undefined &&
        onField(c) &&
        (c.side === user.side || (crosses && targetable(c) && reachesTarget(ctx, user, def, c))),
    );
  if (explicit.length > 0) return explicit.slice(0, 1);

  // The empty-aim fallback skips never-random foes too (Chapter XII's discs;
  // our estimate — research §2 names random-target attacks only).
  const fallback =
    def.targeting === 'single-ally' ? mates : def.targeting === 'single-any' ? [...randomFoes, ...mates] : randomFoes;
  return fallback.length > 0 ? [ctx.rng.pick(fallback)] : [];
}

/**
 * The target of hit `h` of a per-hit-random action: a fresh pick from the same pool as
 * `resolveTargets(ctx, user, def, [])`, one RNG draw.
 *
 * A row the script aims (`extra.scriptAims`) never comes through here: its hits go to the targets the script
 * named, one by one ({@link aimedTargetForHit}).
 */
export function nextHitTargets(ctx: Ctx, user: FFXCombatant, def: AbilityDef): FFXCombatant[] {
  return resolveTargets(ctx, user, def, []);
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
 * `FUN_007ac9c0`, rejects any other with a "TARGET ERROR" and that command is dropped). Otherwise nobody: the hit is
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

/** True for the action class that either side's Cover intercepts. */
function coverable(def: AbilityDef): boolean {
  return def.damageType === 'physical' && def.targeting === 'single-enemy';
}

/**
 * **Enemy Cover** — the mirror image of Guard/Sentinel, and until the Macalania
 * encounter it simply did not exist: `redirectTarget` opened with
 * `if (attacker.side !== 'enemy') return target`, so a party-side action was
 * never redirected at all.
 *
 * "While at least one Guardian lives, **physical** attacks targeted at Seymour
 * are intercepted by a Guardian. **Magic is never covered.**"
 * [ffx-seymour-anima-macalania §2.3, verified: 2 sources]
 *
 * **The game's rule** (re-parity, `research/re-ffx-ai-seymour.md` section 3.5; the exe's cover routine 0x78eef0,
 * run for every single-target physical command): the target is handed to **an ally that holds the Guard status and
 * can act**, the one with the most HP when several do. Seymour's script is what puts the Guard on a Guardian: when
 * a physical command names him, on one chosen by a coin that skips a sleeper (`ai/macalania-seymour.ts`); the
 * Guardian's own script takes it off when it is next hit. The mark is {@link ActorRuntime.guardMark}. A holder
 * that dies, falls asleep or is Threatened stops covering by that, and nobody else is ever a cover: no other
 * enemy sets the mark, so no other battle changes.
 */
function coverOf(ctx: Ctx, target: FFXCombatant, def: AbilityDef): FFXCombatant {
  if (!coverable(def) || target.side !== 'enemy') return target;
  let best: FFXCombatant | undefined;
  for (const c of livingEnemies(ctx)) {
    if (c.id === target.id || !canAct(c)) continue;
    if (ctx.rt.actors.get(c.id)?.guardMark !== true) continue;
    if (!best || c.hp > best.hp) best = c;
  }
  return best ?? target;
}

/**
 * Guard / Sentinel interception, enemy Cover, and Provoke redirection.
 *
 * A Guard user intercepts **all single-target physical attacks** aimed at the
 * other two members [ffx-combat-core §4.2]. Provoke forces an enemy to target
 * the provoker. Going the other way, an enemy may cover an ally — see
 * {@link coverOf}.
 */
export function redirectTarget(
  ctx: Ctx,
  attacker: FFXCombatant,
  target: FFXCombatant,
  def: AbilityDef,
): FFXCombatant {
  if (attacker.side !== 'enemy') return coverOf(ctx, target, def);

  if (coverable(def)) {
    for (const c of livingFriendlies(ctx)) {
      if (c.id === target.id) continue;
      if (has(c, 'guard') || has(c, 'sentinel')) return c;
    }
  }
  // Provoke forces the enemy to target the provoker [ffx-combat-core §4.2]; an
  // action it aims at **itself** targets no one on the other side, so it stays
  // put. Sourced for Seymour Natus, whose 24,000 Protect counter is decompiled
  // as "Counter Self" [ffx-seymour-natus-highbridge §2.1, verified: 3 sources];
  // the general reading is ours. Every other Provoke-landable FFX enemy in our
  // data is Braska's Final Aeon, whose only self action is the form-change cue.
  if (has(attacker, 'provoke') && target.id !== attacker.id) {
    const inst = attacker.statuses['provoke'];
    const provoker = inst?.sourceId ? tryActor(ctx, inst.sourceId) : undefined;
    if (provoker && isAlive(provoker) && targetable(provoker)) return provoker;
  }
  return target;
}

/**
 * Where a reflected spell lands: a random living member of the side opposite
 * the reflector [ffx-combat-core §4.2].
 */
export function reflectBounceTarget(ctx: Ctx, reflector: FFXCombatant): FFXCombatant | undefined {
  // A foe that is never a random pick is never a bounce target either
  // (Chapter XII's discs; our estimate — research §2 names random-target attacks).
  const other = (reflector.side === 'enemy' ? livingFriendlies(ctx) : livingEnemies(ctx)).filter(randomPickable);
  return other.length > 0 ? ctx.rng.pick(other) : undefined;
}
