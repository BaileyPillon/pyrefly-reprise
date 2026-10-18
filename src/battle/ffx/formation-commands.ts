/**
 * **Formation commands** (re-parity RC10, lane "FFX Isaaru commands"; **FFX only**): the commands a formation script switches off for the whole battle.
 *
 * ## What the game does (read from `FFX.exe`, the Steam build 25501027; the handoff is `docs/handoff/re-parity-rc10-ffx-isaaru-commands.md`)
 *
 * A formation script's `setCommandDisabled(who, command, flag)` (script call 0x703B, handler 0x007A6EF0) expands `who` to a set of actor slots (a plain number is
 * that slot, so 1 is Yuna; -23 is every slot that is not a monster, "all characters and aeons") and calls 0x0079B470 on each. For a command id of the form 0x3xxx
 * that routine sets (flag non-zero) or clears (flag 0) the command's bit in the actor's disabled bitmap (Chr+0x690, all clear when the character is created), and
 * the menu gate 0x0079A5B0 reads that bit: a disabled command is unusable. The menu's draw loop (0x008A49B0) calls the gate's resolver (0x0089ACA0) for **every** row and
 * skips a row only for the result -4; a disabled command answers -1, so its row is drawn with a flag (read from the decompile as the grey flag; not yet watched on screen)
 * and a pick of it plays cue 3. The original prints no reason text. (A command id below 0x1000 is the other branch, the availability flag of an aeon: the mirror
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
 * | `commands.ts` | {@link greyDisabledRows} keeps every row that belongs to a command disabled for that actor and marks it `enabled: false` with **no** `disabledReason` (the last step of `availableCommands`) |
 * | `engine.ts#submit` | {@link commandRefused}: a command the player submits that belongs to a disabled command is refused, the turn kept open, with no message (the game's menu plays cue 3; the cue is presentation: the FFX menu shakes a greyed row) |
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
 * Layering: pure, deterministic, no DOM [AGENTS.md hard rule 1].
 */

import type { AbilityCategory, AvailableCommand, Command, EnemyGroupDef, FFXCombatant } from '../common/types.ts';
import { type Ctx, abilityOf } from './state.ts';

/** The one switch. `false` makes {@link applyFormationCommandDisables} a no-op, so no battle sets a flag and every menu is as before. */
export const FORMATION_COMMAND_DISABLES = true;

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

/** Copy the formation's disabled commands into the battle. A no-op for every formation that lists none, and for every formation while the switch is off. */
export function applyFormationCommandDisables(ctx: Ctx, group: EnemyGroupDef): void {
  if (!FORMATION_COMMAND_DISABLES) return;
  for (const off of group.commandDisables ?? []) {
    ctx.state.flags[offKey(off.who, off.command)] = true;
    ctx.state.flags[COMMAND_OFF_ANY] = true;
  }
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
  const id = menuCommandOf(ctx, command);
  return id !== undefined && commandOff(ctx, user, id);
}

/**
 * The menu's half of the rule: the rows that belong to a switched-off command are **kept and greyed**, as the game's draw loop does (it skips a row only for -4; a disabled
 * command answers -1 and is drawn with a flag that reads as the grey flag, and the original prints no reason). A greyed row has `enabled: false` and **no** `disabledReason`, not even the
 * duel's older "Only an aeon can fight an aeon" or an `Out of reach`, so the FFX menu's help slab prints the row's effect alone (`commandHelpText`). Returns `rows` itself,
 * untouched, when nothing is switched off; a row it greys is a copy, the input is never changed.
 */
export function greyDisabledRows(ctx: Ctx, user: FFXCombatant, rows: AvailableCommand[]): AvailableCommand[] {
  if (user.side === 'enemy' || ctx.state.flags[COMMAND_OFF_ANY] !== true) return rows;
  return rows.map((row) => {
    if (!commandRefused(ctx, user, row.command)) return row;
    const grey: AvailableCommand = { ...row, enabled: false };
    delete grey.disabledReason;
    return grey;
  });
}
