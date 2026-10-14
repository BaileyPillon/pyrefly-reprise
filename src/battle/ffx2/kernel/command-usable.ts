/**
 * FFX-2 command usability and cost (re-parity RC7 lane X2-B; **FFX-2 only**): can this girl pick this command now, and what does it cost her.
 * Exe 0x0061a840 (usability, with the blocked test 0x006252d0 under it) and 0x0061acd0 (the MP cost, `auto-ability.ts#commandMpCost`).
 * Pure, deterministic, no DOM, no engine types; no draw.
 *
 * Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); the checked decompile note FFX2-G02 section 2.5 (restated in
 * `docs/handoff/re-parity-rc7-x2cmd.md`). Proof: 60,000 harness vectors for the command ids of category 3 (`0x3000 + n`) and the dress ids
 * (`0x5000 + n`) only; the blocked-test branches for the other categories are read only and are not ported (this function refuses them).
 *
 * In this order: (1) the blocked bits (`Chr+0x87c` and the flag block `Chr+0x910` for a command, `Chr+0x9a4` for a dress command), then,
 * when the caller asks for the menu's view, status bit 17 (0x20000, "Itch") blocks every command but Escape (0x3001); (2) a dress command
 * under Curse (status bit 8) and a silenceable row (misc 0x8000) under Silence (status bit 3) are unusable; (3) the MP cost through
 * Spellspring, Half MP Cost, One MP Cost and Magic Booster; (4) unusable when MP is short (HP for a row paid in HP: cost x max HP / 128,
 * and the girl must keep HP above it).
 */

import { commandMpCost } from './auto-ability.ts';
import { menuRow, type Ffx2MenuRow } from './command-menu-rows.ts';

/** Status word 1 bits the rules read. */
export const STATUS_SILENCE = 0x8;
export const STATUS_CURSE = 0x100;
export const STATUS_SPELLSPRING = 0x2000;
export const STATUS_ITCH = 0x20000;

/** `Cmd+0x14` bits: 0x8000 silenceable, 0x10000000 paid in HP. */
export const MISC_SILENCEABLE = 0x8000;
export const MISC_PAID_IN_HP = 0x10000000;

/** The Escape command: the one command Itch leaves usable. */
export const COMMAND_ESCAPE = 0x3001;

/** The row the game hands out for any dress command (exe 0x00625130): two flag words and zeros. */
const DRESS_ROW: Ffx2MenuRow = { flags: 0, group: 0, child: 0, key: 0, order: 0, ap: 0, cursor: 0x4d, misc: 0x3e00000, mp: 0 };

export interface Ffx2UsableInput {
  /** `Chr+0x434`. */
  readonly status1: number;
  readonly hp: number;
  readonly mp: number;
  readonly maxHp: number;
  /** The auto-ability words `Chr+0x650` and `Chr+0x654`. */
  readonly word0: number;
  readonly word2: number;
  /** `Chr+0x87c`, `Chr+0x910` (74 halfwords each) and `Chr+0x9a4` (2 halfwords); empty arrays mean nothing is blocked. */
  readonly blocked?: readonly number[];
  readonly flagBlock?: readonly number[];
  readonly dressBlocked?: readonly number[];
  /** The command id: `0x3000 + n` or `0x5000 + n`. */
  readonly command: number;
  /** The caller's extra cost (the menu passes 0). */
  readonly extra: number;
  /** The menu's view: the Itch rule applies (the HUD passes 1). */
  readonly menuView: boolean;
  /** The debug byte (live 0xdf68c5) that zeroes every cost. */
  readonly debugFree?: boolean;
}

/** The row a command id reads: the command table for `0x3000 + n`, the shared dress row for `0x5000 + n`. */
export function usableRow(command: number): Ffx2MenuRow {
  const t = (command & 0xffff) >> 12;
  if (t === 3) return menuRow(command & 0xfff);
  if (t === 5) return DRESS_ROW;
  throw new RangeError(`command usability: category ${t} of ${command.toString(16)} is read only and not ported`);
}

/** Is the command's bit in the blocked bitfields (category 3 and 5 only)? */
function isBlocked(i: Ffx2UsableInput): boolean {
  const t = (i.command & 0xffff) >> 12;
  const low = i.command & 0xfff;
  const word = low >> 4;
  const bit = 1 << (low & 15);
  if (t === 3) return word < 0x25 && (((i.blocked?.[word] ?? 0) | (i.flagBlock?.[word] ?? 0)) & bit) !== 0;
  return word < 2 && ((i.dressBlocked?.[word] ?? 0) & bit) !== 0;
}

/**
 * The game's answer: -1 when the girl cannot pick the command, else the cost to show (the MP cost, or the HP cost of a row paid in HP).
 */
export function commandUsable(i: Ffx2UsableInput): number {
  const row = usableRow(i.command);
  const t = (i.command & 0xffff) >> 12;
  if (isBlocked(i)) return -1;
  if (i.menuView && (i.status1 & STATUS_ITCH) !== 0 && i.command !== COMMAND_ESCAPE) return -1;
  if ((t === 5 && (i.status1 & STATUS_CURSE) !== 0) || ((row.misc & MISC_SILENCEABLE) !== 0 && (i.status1 & STATUS_SILENCE) !== 0)) return -1;
  let cost = commandMpCost({ costMp: row.mp, flagsMisc: row.misc, menuCategory: row.group, status1: i.status1, word0: i.word0, word2: i.word2 });
  let extra = i.extra;
  if ((row.misc & MISC_PAID_IN_HP) === 0) {
    if ((i.status1 & STATUS_SPELLSPRING) !== 0 || i.debugFree === true) {
      cost = 0;
      extra = 0;
    }
    if (i.mp < extra + cost) return -1;
  } else {
    cost = Math.floor((cost * i.maxHp) / 128);
    if (i.debugFree === true) {
      cost = 0;
      extra = 0;
    }
    if (i.hp <= extra + cost) return -1;
  }
  return cost;
}

/** Does Silence stop this command (its row carries the silenceable bit)? Parents are never silenceable. */
export function silenceable(command: number): boolean {
  return (usableRow(command).misc & MISC_SILENCEABLE) !== 0;
}
