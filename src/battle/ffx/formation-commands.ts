/**
 * **Formation commands** (re-parity RC10, lane "FFX Isaaru commands"; **FFX only**): the commands a formation script switches off for the whole battle.
 *
 * ## What the game does (read from `FFX.exe`, the Steam build 25501027; the handoff is `docs/handoff/re-parity-rc10-ffx-isaaru-commands.md`)
 *
 * A formation script's `setCommandDisabled(who, command, flag)` (script call 0x703B, handler 0x007A6EF0) expands `who` to a set of actor slots (a plain number is
 * that slot, so 1 is Yuna; -23 is every slot that is not a monster, "all characters and aeons") and calls 0x0079B470 on each. For a command id of the form 0x3xxx
 * that routine sets (flag non-zero) or clears (flag 0) the command's bit in the actor's disabled bitmap (Chr+0x690, all clear when the character is created), and
 * the menu gate 0x0079A5B0 reads that bit: a disabled command is unusable. (A command id below 0x1000 is the other branch, the availability flag of an aeon: the mirror
 * lock `lockedAeons` already carries.) The three formations of Isaaru's contest of aeons (`bvyt09_10`, `_11`, `_12`) run the same eleven flag-1 calls before the first turn:
 * Switch, Escape and Flee for everyone, and Attack, Item, Weapon, Armor, Skill, Special, Black Magic and White Magic for Yuna. Nothing disables Summon, Grand Summon
 * (her Overdrive) or Dismiss, so Yuna's menu in those fights is Summon and Grand Summon. A scan of all 38 formation files our chapters fight shows no other one disables
 * anything beyond Escape and Flee (and Switch in two), which `canEscape` and `lineUp.noSwitch` already carry.
 *
 * ## What this module does
 *
 * | Where | Rule |
 * |---|---|
 * | `setup.ts` | {@link applyFormationCommandDisables} copies the group's `commandDisables` into `state.flags` (one boolean per who and command) |
 * | `commands.ts` | {@link withoutDisabledRows} drops every row that belongs to a command disabled for that actor (the last step of `availableCommands`) |
 * | `engine.ts#submit` | {@link commandRefused}: a command the player submits that belongs to a disabled command is refused, the turn kept open, with no message (the game's menu plays a cue; words and cue are presentation) |
 *
 * **Which row belongs to which command** ({@link menuCommandOf}): an Attack row is 0x3000, an Item row 0x3001, a Switch row 0x3002, an Escape row 0x3003, a Flee row (the
 * Escape command in `party` mode) 0x3018, and an ability row the command of its category: Skill 0x3113, Special 0x3114, Black Magic 0x3115, White Magic 0x3116. Weapon (0x3004)
 * and Armor (0x3005) are the original's equipment swaps in battle, which this engine has no row for, so those two disables take nothing away. Summon, Grand Summon (every
 * `overdrive` row), Dismiss, Defend (its own flag, `formation-flags.ts`) and the trigger rows (Talk is its own command, 0x3105, which no Isaaru script touches) belong to none.
 * A scripted reaction (Auto-Potion, a counter) and a Berserk or Confused turn do not pass the menu gate in the game; here they do not pass `submit()`, so they are not refused.
 *
 * **The switch.** {@link FORMATION_COMMAND_DISABLES} is the one switch: `false` and no group is read, so every battle plays exactly as it did before this lane.
 * The flags live in `state.flags` (like the aeon duel's), not on the runtime, so a rebuilt runtime and the advisor's dry runs see the same rule as the battle.
 *
 * ## Script locks (re-parity RC10, lane "FFX script command locks"; handoff `docs/handoff/re-parity-rc10-ffx-script-command-locks.md`)
 *
 * The same call is made by 18 **monster** scripts. Only the ten possessed aeons and Magus Sisters (m163 to m169, m178 to m180) are fought by a shipped chapter, and each makes one call at its
 * init, `setCommandDisabled(1, <its own aeon's id>, 0)`: an id below 0x1000, the setter's other branch, which writes the flag into the availability byte of that aeon (+0xDD4 of its character);
 * the summon menu's gate (0x0079A080, `aeonUnavailable`) reads the byte, so with 0 Yuna cannot summon that aeon. `EnemyGroupDef.scriptCommandDisables` carries those rows (Chapter III's five
 * possession links); {@link applyFormationCommandDisables} reads them only while {@link SCRIPT_COMMAND_DISABLES} is on (**off**). An aeon that is off leaves `availableAeons` (so its Summon row is
 * **not built**, hidden like Isaaru's rows: the driver's choice) and Grand Summon's choices, and {@link commandRefused} refuses a submitted Summon or a Grand Summon that names it. A 0x3xxx row sets
 * the same flags a formation's row sets (no shipped fight reaches one: the other eight scripts are in fights no chapter fights). The hidden Last Summoning models the same lock with
 * `lockedAeons` ("Taken by Yu Yevon") and carries no `scriptCommandDisables`.
 *
 * Layering: pure, deterministic, no DOM [AGENTS.md hard rule 1].
 */

import type { AbilityCategory, AvailableCommand, Command, EnemyGroupDef, FFXCombatant } from '../common/types.ts';
import { type Ctx, abilityOf } from './state.ts';
import { AEON_SLOT } from './adapt/slots.ts';

/** The one switch. `false` makes {@link applyFormationCommandDisables} a no-op, so no battle sets a flag and every menu is as before. */
export const FORMATION_COMMAND_DISABLES = true;

/**
 * The second switch, **off** (re-parity RC10; Bailey decides): when `on` is true the monster-script rows (`EnemyGroupDef.scriptCommandDisables`) are read as well. A test or a bench flips it with
 * {@link setScriptCommandDisables} and puts it back with the function that returns.
 */
export const SCRIPT_COMMAND_DISABLES: { on: boolean } = { on: false };

/** Set the script-locks switch; the returned function puts it back as it was. */
export function setScriptCommandDisables(on: boolean): () => void {
  const before = SCRIPT_COMMAND_DISABLES.on;
  SCRIPT_COMMAND_DISABLES.on = on;
  return () => {
    SCRIPT_COMMAND_DISABLES.on = before;
  };
}

/** The game's command ids this module knows (the numbers the formation scripts pass). */
export const GAME_COMMAND = {
  attack: 0x3000,
  item: 0x3001,
  switch: 0x3002,
  escape: 0x3003,
  weapon: 0x3004,
  armor: 0x3005,
  flee: 0x3018,
  skill: 0x3113,
  special: 0x3114,
  blackMagic: 0x3115,
  whiteMagic: 0x3116,
} as const;

/** The command an ability row of each category belongs to; a category not listed (summon, overdrive, aeon, enemy, ...) belongs to none of the commands a formation switches off. */
const COMMAND_OF_CATEGORY: Partial<Record<AbilityCategory, number>> = {
  skill: GAME_COMMAND.skill,
  special: GAME_COMMAND.special,
  blackmagic: GAME_COMMAND.blackMagic,
  whitemagic: GAME_COMMAND.whiteMagic,
};

/** `state.flags` key: true when the formation switched any command off (the quick test every `availableCommands` call makes first). */
export const COMMAND_OFF_ANY = 'formation.cmdOff';

/** `state.flags` key: `formation.cmdOff:<who>:<command>` is true while the formation has switched that command off for that actor (`who` is `*` for everyone). */
export const COMMAND_OFF_PREFIX = 'formation.cmdOff:';

function offKey(who: string, command: number): string {
  return `${COMMAND_OFF_PREFIX}${who === 'everyone' ? '*' : who}:${command}`;
}

/** `state.flags` key prefix: `formation.aeonOff:<aeonId>` is true while a monster's script has made that aeon unavailable (a script row whose command is below 0x1000). */
export const AEON_OFF_PREFIX = 'formation.aeonOff:';

/** The first command id of the setter's menu-command branch (0x3xxx); an id below it is an aeon's availability. */
const MENU_COMMAND_FLOOR = 0x1000;

/** The roster key of the aeon a game slot (8 to 17) names. */
const AEON_OF_SLOT: ReadonlyMap<number, string> = new Map(Object.entries(AEON_SLOT).map(([key, slot]) => [slot, key]));

/**
 * Copy the formation's disabled commands into the battle. A no-op for every formation that lists none, and for every formation while the switch is off. Then, only while
 * {@link SCRIPT_COMMAND_DISABLES} is on, the monster scripts' rows: a command below 0x1000 makes that aeon unavailable, any other sets the same flags a formation's row sets.
 */
export function applyFormationCommandDisables(ctx: Ctx, group: EnemyGroupDef): void {
  if (FORMATION_COMMAND_DISABLES) {
    for (const off of group.commandDisables ?? []) {
      ctx.state.flags[offKey(off.who, off.command)] = true;
      ctx.state.flags[COMMAND_OFF_ANY] = true;
    }
  }
  if (!SCRIPT_COMMAND_DISABLES.on) return;
  for (const off of group.scriptCommandDisables ?? []) {
    if (off.command < MENU_COMMAND_FLOOR) {
      const aeon = AEON_OF_SLOT.get(off.command);
      if (aeon !== undefined) ctx.state.flags[AEON_OFF_PREFIX + aeon] = true;
      continue;
    }
    ctx.state.flags[offKey(off.who, off.command)] = true;
    ctx.state.flags[COMMAND_OFF_ANY] = true;
  }
}

/** Has a monster's script made this aeon unavailable (the roster key)? Always false while the switch is off, or in a battle whose group lists none. */
export function aeonScriptOff(ctx: Ctx, aeonId: string): boolean {
  return ctx.state.flags[AEON_OFF_PREFIX + aeonId] === true;
}

/**
 * The game command a command belongs to, or `undefined` when it belongs to none of the commands a formation can switch off here (Summon, Grand Summon, Dismiss,
 * Defend, the trigger rows). The one mapping the menu and `submit()` share.
 */
export function menuCommandOf(ctx: Ctx, command: Command): number | undefined {
  switch (command.kind) {
    case 'attack':
      return GAME_COMMAND.attack;
    case 'item':
      return GAME_COMMAND.item;
    case 'switch':
      return GAME_COMMAND.switch;
    case 'escape':
      return command.extra?.mode === 'party' ? GAME_COMMAND.flee : GAME_COMMAND.escape;
    case 'ability': {
      const category = abilityOf(ctx, command.id)?.category;
      return category === undefined ? undefined : COMMAND_OF_CATEGORY[category];
    }
    default:
      return undefined;
  }
}

/** Is this game command switched off for this actor? A monster has no menu, and "everyone" never names one. */
export function commandOff(ctx: Ctx, user: FFXCombatant, command: number): boolean {
  if (user.side === 'enemy') return false;
  const flags = ctx.state.flags;
  return flags[offKey('everyone', command)] === true || flags[offKey(user.id, command)] === true;
}

/** Does this submitted command belong to a command the formation switched off for this actor? `submit()`'s half of the rule. */
export function commandRefused(ctx: Ctx, user: FFXCombatant, command: Command): boolean {
  if (command.kind === 'summon') return aeonScriptOff(ctx, command.id);
  if (command.kind === 'overdrive' && command.extra?.kind === 'yuna-grand-summon') {
    const named = command.extra.grandSummon.aeonId;
    return named !== '' && aeonScriptOff(ctx, named);
  }
  const id = menuCommandOf(ctx, command);
  return id !== undefined && commandOff(ctx, user, id);
}

/** The menu's half of the rule: the rows that belong to a switched-off command are not offered. Returns `rows` itself, untouched, when nothing is switched off. */
export function withoutDisabledRows(ctx: Ctx, user: FFXCombatant, rows: AvailableCommand[]): AvailableCommand[] {
  if (user.side === 'enemy' || ctx.state.flags[COMMAND_OFF_ANY] !== true) return rows;
  return rows.filter((row) => !commandRefused(ctx, user, row.command));
}
