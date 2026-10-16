/**
 * The engine's combatants as the targeting kernels see them (re-parity RC4 lane FFX-G; **FFX only**).
 *
 * The kernels (`kernel/target-builder.ts`, `cover.ts`, `legal-set.ts`, `forced-turn.ts`) work on the game's 31-slot character array. This
 * module is the one place that maps the engine's combatants onto it: the game slot of a combatant, the slot record the chain reads
 * ({@link chainWorld}), the command words of an ability ({@link chainCommand}), the picker the kernels draw through ({@link chainPick}) and the
 * Tidus counters ({@link bondOf}).
 *
 * - **The slot** is the game's actor number (`ai/script-random.ts#actorNumber`: party 0 to 7, aeons 8 to 0x11, monsters 0x14 and up in formation
 *   order). A combatant whose id the game has no slot for (a test rig's) has none and is left out of the world.
 * - **The facts the engine already keeps stand in for the game's flags**: in battle is "on the field", the dead flag is a KO, Petrified is the
 *   Petrify status, Guard and Sentinel are the statuses (and, on an enemy, the Guard mark a boss script sets, `ActorRuntime.guardMark`),
 *   Reflect is the status. **Targetable** folds in everything the engine already decides about whether an action may be aimed at a combatant:
 *   untargetable and hidden, the reach of this ability (`targeting.ts#reachesTarget`: BattleDistance and the Chapter XII discs) and, when asked,
 *   the never-a-random-pick flag. The target class and the "only targetable by" id are not modelled (open item G13), so the kernel's class test sees class 0
 *   with the ordinary-actor usage bit set. BattleDistance itself is modelled only when {@link chainWorld} is asked for it (`withDistance`: the player's Yojimbo's
 *   pick); otherwise the kernel's distance test sees 0.
 */

import type { AbilityDef, CombatantId, FFXCombatant, Targeting } from '../../common/types.ts';
import { type BondArray, newBond } from '../kernel/cover.ts';
import { ExtraBit, PermBit } from '../kernel/status-types.ts';
import {
  CMD_RANDOM_SPREAD,
  CMD_REFLECTABLE,
  type PickFn,
  SLOT_COUNT,
  type TargetCommand,
  type TargetSlot,
} from '../kernel/target-world.ts';
import { type Ctx, enemies, friendlies, has, onField, statusOf, targetable } from '../state.ts';
import { reflectableDef } from '../statuses.ts';
import { actorNumber } from '../ai/script-random.ts';
import { randomPickable, reachesTarget } from '../targeting.ts';
import { resolveCommand } from './command.ts';

/** The default attack's command id, which every slot record carries (a non-zero default attack: the engine has one generic Attack). */
const DEFAULT_ATTACK = 0x3000;

/** The game slot of a combatant for the targeting chain, or `undefined` when the game has none for it. */
export function chainSlotOf(ctx: Pick<Ctx, 'state'>, c: FFXCombatant): number | undefined {
  const n = actorNumber(ctx, c);
  return n < SLOT_COUNT ? n : undefined;
}

/** The kernels' view of the battle for one action. */
export interface ChainWorld {
  /** The 31 slots (`undefined` for nobody). */
  slots: Array<TargetSlot | undefined>;
  /** The combatant standing in each occupied slot. */
  at: Map<number, FFXCombatant>;
}

/** The scripts of the monsters that keep control of their script when Provoked (`Chr+0x5cb`): sources in `research/re-ffx-targeting.md` section 6. */
const KEEPS_CONTROL_SCRIPTS: ReadonlySet<string> = new Set([
  'seymour-natus', // research/re-ffx-ai-seymour.md, Natus init: keeps control when Provoked
  'bfa-form-1', // research/re-ffx-ai-yunalesca-bfa.md section 3.2: the monster's init sets RetainsControlWhenProvoked
  'bfa-form-2',
  'braskas-final-aeon',
  'sinspawn-gui', // research/re-ffx-ai-gui.md section 5: the body keeps control (property 256 := 1)
]);

/** Does this combatant keep control of its script when Provoked? (Only the scripts above set it; every other monster is taken as 0.) */
export function keepsControlWhenProvoked(c: FFXCombatant): boolean {
  const enemy = c.enemy;
  if (!enemy) return false;
  const id = enemy.forms?.[enemy.formIndex]?.aiScriptId ?? enemy.aiScriptId;
  return id !== undefined && KEEPS_CONTROL_SCRIPTS.has(id);
}

/** The permanent status word of a combatant, the four bits the chain reads. */
function permWord(c: FFXCombatant): number {
  let w = 0;
  if (has(c, 'confuse')) w |= PermBit.Confuse;
  if (has(c, 'berserk')) w |= PermBit.Berserk;
  if (has(c, 'provoke')) w |= PermBit.Provoke;
  if (has(c, 'threaten')) w |= PermBit.Threaten;
  return w;
}

/** The extra status word of a combatant, the bits the chain reads (Eject, Guard, Sentinel). */
function extraWord(ctx: Ctx, c: FFXCombatant): number {
  let w = 0;
  if (has(c, 'eject')) w |= ExtraBit.Eject;
  if (has(c, 'guard') || (c.side === 'enemy' && ctx.rt.actors.get(c.id)?.guardMark === true)) w |= ExtraBit.Guard;
  if (has(c, 'sentinel')) w |= ExtraBit.Sentinel;
  return w;
}

/**
 * The 31-slot world for an action by `user` with `def`. `neverRandom` also takes the never-a-random-pick flag into Targetable (a Reflect bounce
 * and a random-target pick skip such a combatant; a Berserk or Confuse pick does not).
 *
 * `withDistance` also gives every slot its BattleDistance (`CombatantFlags.battleDistance`), so the kernel's own reach test runs (a slot whose distance is above the
 * command's reach, 0 to 3, is not in the legal set: `kernel/legal-set.ts#legalSet`). It is for a pick whose command words carry the GAME's reach: the player's Yojimbo's
 * (`kernel/yojimbo.ts#YOJIMBO_COMMAND_B1A`, Zanmato and Wakizashi on all reach 1, so a foe at distance 2 or 3 is out). Every other caller builds its command words with
 * `chainCommand` (no reach bits, reach 0) and the engine's one-bit reach is already folded into Targetable, so they leave it off and nothing about them changes.
 */
export function chainWorld(ctx: Ctx, user: FFXCombatant, def: AbilityDef, neverRandom: boolean, withDistance = false): ChainWorld {
  const slots: Array<TargetSlot | undefined> = new Array<TargetSlot | undefined>(SLOT_COUNT).fill(undefined);
  const at = new Map<number, FFXCombatant>();
  for (const c of [...friendlies(ctx), ...enemies(ctx)]) {
    const slot = chainSlotOf(ctx, c);
    if (slot === undefined || at.has(slot)) continue;
    at.set(slot, c);
    const provoke = statusOf(c, 'provoke');
    const provoker = provoke?.sourceId === undefined ? undefined : ctx.state.combatants[provoke.sourceId];
    const provokerSlot = provoker === undefined ? undefined : chainSlotOf(ctx, provoker as FFXCombatant);
    slots[slot] = {
      inBattle: onField(c) ? 1 : 0,
      dead: c.alive && !has(c, 'ko') ? 0 : 1,
      stoned: has(c, 'petrify') ? 1 : 0,
      hp: c.hp,
      perm: permWord(c),
      sleep: has(c, 'sleep') ? 1 : 0,
      extra: extraWord(ctx, c),
      reflect: has(c, 'reflect') ? 1 : 0,
      targetable: targetable(c) && reachesTarget(ctx, user, def, c) && (!neverRandom || randomPickable(c)) ? 1 : 0,
      ...(withDistance ? { far: c.flags.battleDistance ?? 0 } : {}),
      only: 0xff,
      defAtk: DEFAULT_ATTACK,
      keeps: keepsControlWhenProvoked(c) ? 1 : 0,
      ...(provokerSlot !== undefined ? { provokedBy: provokerSlot } : {}),
    };
  }
  return { slots, at };
}

/** The target type bits of `Cmd+0x1a` for an engine targeting value (0 single, 1 group, 2 all, 3 self; a random row is a group-type command). */
function targetTypeOf(targeting: Targeting): number {
  switch (targeting) {
    case 'single-enemy':
    case 'single-ally':
    case 'single-any':
      return 0;
    case 'all-enemies':
    case 'all-allies':
    case 'all':
      return 2;
    case 'self':
      return 3;
    default:
      return 1;
  }
}

/** The damage kind of the ability's command (`Cmd+0x20` low bits): 1 physical, 2 magical. */
export function damageKindOf(def: AbilityDef, user: FFXCombatant): number {
  return resolveCommand(def, user).record.flagsDamage & 3;
}

/** The command words the chain reads, for an engine ability with `hits` hits per target (`spread`: the hits are dealt over the whole set). */
export function chainCommand(user: FFXCombatant, def: AbilityDef, hits: number, spread: boolean): TargetCommand {
  const opposite = def.targeting === 'single-enemy' || def.targeting === 'all-enemies' || def.targeting === 'random-enemy';
  return {
    b1a: (targetTypeOf(def.targeting) << 2) | (opposite ? 0x02 : 0) | (def.flags.includes('can-target-dead') ? 0x40 : 0),
    b1b: 0x04, // the ordinary-actor usage bit: every engine combatant is class 0
    misc: (reflectableDef(def) ? CMD_REFLECTABLE : 0) | (spread ? CMD_RANDOM_SPREAD : 0),
    b20: damageKindOf(def, user),
    hits,
  };
}

/**
 * The picker the kernels draw through: one draw of `stream`, `value % candidates`. The candidates go to the generator as objects that carry the
 * combatant's id, so a preview policy (`RollPolicyRng`, which steers a pick toward an aimed combatant by its id, PR-0153) still answers as it always did.
 */
export function chainPick(ctx: Pick<Ctx, 'rng'>, world: ChainWorld): PickFn {
  return (stream, slots) => {
    const items = slots.map((slot) => ({ slot, id: world.at.get(slot)?.id }));
    return ctx.rng.on(stream).pick(items).slot;
  };
}

/** The battle's Tidus counters (created at 0 the first time they are read). */
export function bondOf(ctx: Ctx): BondArray {
  ctx.rt.coverBond ??= newBond();
  return ctx.rt.coverBond;
}

/** The combatants of a slot mask, ascending. */
export function combatantsOf(world: ChainWorld, mask: number): FFXCombatant[] {
  const out: FFXCombatant[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    if (((mask >>> i) & 1) === 0) continue;
    const c = world.at.get(i);
    if (c !== undefined) out.push(c);
  }
  return out;
}

/** The ids of a slot mask, ascending. */
export function idsOf(world: ChainWorld, mask: number): CombatantId[] {
  return combatantsOf(world, mask).map((c) => c.id);
}
