/**
 * FFX-2: what a Confused character does with her turn (re-parity RC9 lane X2-H; **FFX-2 only**). The Confusion pick (exe 0x00649350, the autopilot the ATB process
 * asks every step of a character in state 7) with its candidate filter (0x00649240). Pure, deterministic, no DOM, no engine types (AGENTS.md rule 1).
 *
 * Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69). The routine was run for real in the emulator harness (Unicorn, the live machine code,
 * the random generator hooked and logged) over random battle worlds and compared with an independent model written from the disassembly: `docs/handoff/re-parity-rc9-x2-confusion.md`
 * has the counts. `tests/fixtures/parity/ffx2/confusion_pick.json` holds a stratified subset of those runs and `tests/unit/parity-ffx2-confusion-pick.test.ts` replays it.
 * The checked note FFX2-G06 (section 3.7 "Confusion") described the filter; the pick itself is new here.
 *
 * What it does, in order:
 * 1. The candidate pass over her main list (`Chr` list kind 0, 16 entries; a monster slot skips the first entry) and then her shortcut list (kind 0x16, 4 entries): an
 *    entry is a candidate when it is not blank (0xff), is not in her blocked bitfields, and its command row has the Confusion bit (`Cmd+0x14` & 0x20000000). A row with a
 *    sub-menu (`Cmd+0x0d` & 0xf8) is a candidate only when its sub-list holds at least one usable entry, and carries that count; any other row carries -1. In the game only
 *    the Item command (0x3000, sub-list = the stock) is a sub-menu row with the bit; 245 of the 554 command rows and all 68 item rows have it.
 * 2. No candidate: the pick queues nothing and returns 0 (the character stays idle and asks again).
 * 3. Draw 1, on the character's own stream (`rngStreamForChr(chr, 0)`): `draw % candidates` picks the command.
 * 4. A sub-menu candidate: draw 2, the same stream, `draw % sub count` picks the (index)-th usable entry of the sub-list in table order (an item id of the stock).
 * 5. The valid-target set of the picked command (`target-pick.ts#validTargets`).
 * 6. A row with the all-targets choice (cursor flag 0x80): draw 3, the same stream, bit 0 is the choice. A row without it never draws.
 * 7. The dispatcher (`target-pick.ts#aimTargets`): one draw of stream 4 for a single target out of two or more, one of stream 5 for the team split of a multiple row.
 * 8. The command is queued with the mask and the all-targets byte (the engine's part; an empty mask queues nothing).
 *
 * What this module does not do (read, not ported): the preamble 0x00648e70 that queues the plain Attack for a player-side monster (a party slot whose save index is 15 to 22)
 * before any of this; the queue add itself and its item reservation (lane X2-F's ledger, in the engine); who fills a monster's lists.
 */

import { menuRow } from './command-menu-rows.ts';
import { isItemId, itemRow } from './item-rows.ts';
import { rngStreamForChr, drawValue, type Ffx2Draw } from './rng.ts';
import { aimTargets, canChooseAll, validTargets, type Ffx2TargetSlot } from './target-pick.ts';

/** `Cmd+0x14` bit: a Confused character may pick the command. */
export const MISC_CONFUSION = 0x20000000;

/** The blank list entry. */
export const PICK_BLANK = 0xff;

/** The Item command: the one sub-menu row a Confused character can pick. */
export const COMMAND_ITEM = 0x3000;

/** The list kind of the Item command's sub-list: the party stock. */
export const LIST_KIND_STOCK = 4;

/** One command row as the pick reads it. */
export interface Ffx2PickRow {
  /** `Cmd+0x0d`: `& 0xf8` non-zero is a parent with a sub-menu. */
  readonly flags: number;
  /** `Cmd+0x0e`: the kind of the sub-list a parent opens. */
  readonly group: number;
  /** `Cmd+0x10`: the target flags. */
  readonly cursor: number;
  /** `Cmd+0x14`: the misc flags. */
  readonly misc: number;
}

/** What the pick reads of the battle. */
export interface Ffx2PickWorld {
  /** The picking character's slot, 0 to 30. */
  readonly chr: number;
  /** Her main list (kind 0): 16 entries, 0xff for blank. */
  readonly main: readonly number[];
  /** Her shortcut list (kind 0x16): 4 entries. */
  readonly shortcut: readonly number[];
  /** The party stock's item ids by slot (0xff for an empty slot), in table order. */
  readonly stock: readonly number[];
  /** Is the command in her blocked bitfields (`Chr+0x87c`, `+0x910`; an item in `+0x9a8`)? The engine runs no script that sets them: it answers false. */
  readonly blocked: (id: number) => boolean;
  /** Her view of the 31 slots. */
  readonly slots: readonly Ffx2TargetSlot[];
}

/** A candidate: the command id and its sub-list count (-1 for a command without a sub-menu). */
export interface Ffx2PickCandidate {
  readonly id: number;
  readonly sub: number;
}

/** The pick's answer. */
export interface Ffx2PickResult {
  readonly candidates: readonly Ffx2PickCandidate[];
  /** The command queued: a command id, or an item id when the Item command was picked; 0xff when there was no candidate. */
  readonly command: number;
  /** The all-targets byte. */
  readonly all: boolean;
  /** The target mask (bit = slot); 0 when nobody could be aimed at. */
  readonly mask: number;
}

/** The row of a command or item id (categories 2 and 3 only: the others are not in a Confusion list). */
export function pickRow(id: number): Ffx2PickRow {
  const category = (id & 0xffff) >> 12;
  if (category === 3) {
    const r = menuRow(id & 0xfff);
    return { flags: r.flags, group: r.group, cursor: r.cursor, misc: r.misc };
  }
  if (category === 2 && isItemId(id)) {
    const r = itemRow(id);
    return { flags: 0, group: LIST_KIND_STOCK, cursor: r.cursor, misc: r.misc };
  }
  throw new RangeError(`confusion pick: command ${id.toString(16)} is not a category 2 or 3 row`);
}

/** The sub-list of a parent (the kind its row names): only the stock (kind 4) is modelled, the one the Item command opens. */
function subList(w: Ffx2PickWorld, kind: number): readonly number[] {
  if (kind !== LIST_KIND_STOCK) throw new RangeError(`confusion pick: sub-list kind ${kind} is not modelled`);
  return w.stock;
}

/**
 * The candidate filter (0x00649240). `collect` gathers candidates (with the nested count of a sub-menu row) after `start` earlier ones; otherwise the count of usable
 * entries is returned, or, with `pick` >= 0, the id of the (pick)-th usable entry.
 */
function filter(w: Ffx2PickWorld, list: readonly number[], count: number, collect: Ffx2PickCandidate[] | null, pick: number): number {
  let n = 0;
  for (let k = 0; k < count; k++) {
    const e = (list[k] ?? PICK_BLANK) & 0xffff;
    if (e === PICK_BLANK || w.blocked(e)) continue;
    const row = pickRow(e);
    if ((row.misc & MISC_CONFUSION) === 0) continue;
    let sub = -1;
    if ((row.flags & 0xf8) !== 0) {
      // a sub-menu row is only looked into when the caller wants candidates; elsewhere it is skipped
      if (collect === null || pick >= 0) continue;
      const items = subList(w, row.group);
      sub = filter(w, items, items.length, null, -1);
      if (sub === 0) continue;
    }
    if (pick >= 0 && n >= pick) return e;
    if (collect !== null && pick < 0) collect.push({ id: e, sub });
    n++;
  }
  return n;
}

/** The candidates of a character's lists, in the order the pick indexes them. */
export function confusionCandidates(w: Ffx2PickWorld): readonly Ffx2PickCandidate[] {
  const out: Ffx2PickCandidate[] = [];
  // a monster's main list starts after its first entry
  const skip = w.chr >= 15 && w.chr < 31 ? 1 : 0;
  filter(w, w.main.slice(skip), 16 - skip, out, -1);
  filter(w, w.shortcut, 4, out, -1);
  return out;
}

/**
 * The Confusion pick (0x00649350): what a Confused character queues this step. `draw(stream)` returns the raw 31-bit value of the game's generator for the stream
 * named (the character's own purpose-0 stream, then 4 or 5 for the target); the draws are taken in the game's order and only when the game takes them.
 */
export function confusionPick(w: Ffx2PickWorld, draw: Ffx2Draw): Ffx2PickResult {
  const candidates = confusionCandidates(w);
  if (candidates.length === 0) return { candidates, command: PICK_BLANK, all: false, mask: 0 };
  const own = rngStreamForChr(w.chr, 0);
  const picked = candidates[drawValue(draw, own) % candidates.length] as Ffx2PickCandidate;
  let command = picked.id;
  if (picked.sub >= 0) {
    const index = drawValue(draw, own) % picked.sub;
    const items = subList(w, pickRow(picked.id).group);
    command = filter(w, items, items.length, null, index);
  }
  const row = pickRow(command);
  const valid = validTargets(w.chr, row.cursor, w.slots);
  const all = canChooseAll(row.cursor) && (drawValue(draw, own) & 1) === 1;
  return { candidates, command, all, mask: aimTargets(w.chr, row.cursor, valid, all, draw) };
}
