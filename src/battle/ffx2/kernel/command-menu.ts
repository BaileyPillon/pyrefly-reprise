/**
 * FFX-2 command menu, the data and rules half (re-parity RC7 lane X2-B; **FFX-2 only**): what a girl lists, and which list each
 * command goes to. The command-table builder (exe 0x00625fc0), the party command list (0x00629570, category 3), the list writer
 * (0x00628900) and the stable sort (0x00646ea0). Pure, deterministic, no DOM, no engine types; no draw.
 *
 * Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); the rules are the checked decompile note FFX2-G02 sections
 * 2.2 to 2.4, restated in `docs/handoff/re-parity-rc7-x2cmd.md`. Proof: `tests/fixtures/parity/ffx2/command_menu.json` holds
 * vectors of the real machine code (the builder, and the whole refresh tail) run in the harness, and `tests/unit/parity-ffx2-command-menu.test.ts`
 * replays them. Numbers: `command-menu-rows.ts` (the 554 command rows), `dressphere-grids.ts` (each dressphere's sixteen pairs, the
 * garment grids), `dressphere-rows.ts` (accessories, auto-abilities).
 *
 * What a girl lists = the save word (`Rec+0x3e`: bit 0 Item, bit 1 Escape, bit 2 Dresspheres; **a Special dressphere skips it**) plus the
 * union, in this order, of the dressphere's own sixteen pairs, the eight gate slots, the garment grid's condition-0 pairs and the two
 * accessories' pairs (a Special's main unit uses only the first two). A pair whose prerequisite field is 0 is FREE (listed without
 * being learned); any other pair needs its command learned (AP reached the row's cost) and its prerequisite met. A parent with the
 * 0x10 flag is listed only when one of its children is available (second pass); a listed parent also pulls in every child the girl
 * has learned, whichever dressphere taught it (for groups 0xb to 0xd only a child that carries the parent's own dressphere key).
 */

import { FFX2_COMMAND_ROWS, menuRow } from './command-menu-rows.ts';
import { accessoryAbilityGroup, jobAbilityGroup, plateAbilityGroup, plateIdOf, type Ffx2AbilityEnv } from './dressphere-abilities.ts';
import { abilityRow } from './dressphere-rows.ts';
import { girlJob, isSpecialJob } from './dressphere-stats.ts';

/** One save record's menu inputs (`Rec+0x36` the stored dressphere, the plate and accessory ids, the word at `+0x3e`). */
export interface Ffx2MenuRecord {
  /** The stored dressphere id (`0x5000 | index`, before the girl's own variant). */
  readonly job: number;
  /** The garment grid: 0xff for none, else a plate row. */
  readonly plate: number;
  readonly accessories: readonly [number, number];
  /** `Rec+0x3e`: bit 0 Item, bit 1 Escape, bit 2 Dresspheres. */
  readonly saveWord: number;
  /** The eight gate slots (0xff empty). */
  readonly gate: readonly number[];
  /** The character's level (the numeric prerequisites read it). */
  readonly level: number;
}

/** Everything the builder reads of the party. Records 0 to 8 are the girls (0 to 2) and their pods (3 to 8). */
export interface Ffx2MenuWorld {
  record(index: number): Ffx2MenuRecord;
  /** The record's AP for command row `low` has reached the row's cost. */
  learnedCommand(record: number, low: number): boolean;
  /** The record's AP for auto-ability row `low` has reached the row's cost. */
  learnedAbility(record: number, low: number): boolean;
  /** Key item number `bit` (0 to 127) is held. */
  keyItem(bit: number): boolean;
  /** The debug byte (live 0xdf68db) that forces the Dresspheres bit for the three girls. */
  readonly debugDresspheres: boolean;
}

/** The builder's bitfield length in halfwords, and the blank list value. */
export const MENU_BITS = 0x4a;
export const MENU_BLANK = 0xff;

/** The store lists the writer files commands into: [kind, capacity], in the writer's order. */
const STORE_KINDS: readonly (readonly [number, number])[] = [
  [0, 0x10], [0x16, 4], [1, 0xe], [2, 0x10], [3, 0x10], [6, 0xc], [7, 0x10], [8, 0xc], [9, 0xc], [0xa, 8], [0xb, 10], [0xc, 10], [0xd, 10],
];
/** Fixed list sizes of the kinds with one (the groups 0xb to 0xd have 8 or 10 by dressphere, `GROUP_CAPACITY`). */
const FIXED_CAPACITY: Readonly<Record<number, number>> = { 0: 0x10, 1: 0xe, 2: 0x10, 3: 0x10, 6: 0xc, 7: 0x10, 8: 0xc, 9: 0xc, 0xa: 8, 0x16: 4 };
/** Capacity bytes of groups 0xb, 0xc, 0xd by dressphere index (live 0xd47f78, 0xd47f9c, 0xd47fc0). */
const GROUP_CAPACITY: Readonly<Record<number, readonly number[]>> = {
  0xb: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 8, 10, 8, 10, 8, 10, 10, 8, 8, 8, 8, 8, 8, 10, 10, 10, 10, 8, 10, 10, 10, 10, 10, 0, 0],
  0xc: [10, 10, 10, 10, 10, 10, 10, 10, 8, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0],
  0xd: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0],
};

const category = (id: number): number => (id & 0xffff) >> 12;

function recordOf(w: Ffx2MenuWorld, idx: number): Ffx2MenuRecord {
  if (!Number.isInteger(idx) || idx < 0 || idx > 8) throw new RangeError(`command menu: record ${idx} is not a party record (0 to 8)`);
  return w.record(idx);
}

/** The dressphere a record wears (exe 0x0060c920): the stored id through the girl's own variant, with `0x5000` set. */
export function menuDressId(w: Ffx2MenuWorld, idx: number): number {
  return girlJob(idx, recordOf(w, idx).job);
}

/**
 * The record the lists are read from (exe 0x0060c170): a girl (record 0 to 2) wearing the main pod of her Special reads the pod's own record
 * (3 to 8); everything else reads itself.
 */
export function menuCharacter(w: Ffx2MenuWorld, idx: number): number {
  const d = idx < 9 ? menuDressId(w, idx) : 0;
  if (d === 0x5010 || d === 0x5013 || d === 0x5016) return idx < 3 ? idx * 2 + 3 : idx;
  if (d === 0x5011 || d === 0x5014 || d === 0x5017) return idx < 3 ? idx * 2 + 4 : idx;
  return idx;
}

/** AP has reached the cost of command or auto-ability `id` for record `c` (exe 0x0060c4d0); any other id counts as learned. */
function learnedBy(w: Ffx2MenuWorld, c: number, id: number): boolean {
  const low = id & 0xfff;
  const t = category(id);
  if (t === 3 && low < 0x250) return w.learnedCommand(c, low);
  if (t === 8 && low < 0x100) return w.learnedAbility(c, low);
  return true;
}

function envFor(w: Ffx2MenuWorld, c: number): Ffx2AbilityEnv {
  const rec = recordOf(w, c);
  return { level: rec.level, learned: (id) => learnedBy(w, c, id), keyItem: (bit) => w.keyItem(bit), gateSlots: rec.gate };
}

/** An auto-ability row with the stackable bit (special bit 2) may repeat in a list. */
function mayRepeat(id: number): boolean {
  return category(id) === 8 && (abilityRow(id).special & 4) !== 0;
}

/**
 * The girl's command list (exe 0x00629570, category 3), in the order the builder reads it: each source in turn, an entry dropped when it is
 * already listed (an auto-ability with the stackable bit excepted), the auto-abilities (category 8) left out, at most 64. The blank entries
 * the game keeps are not returned (the builder skips them).
 */
export function partyCommandList(w: Ffx2MenuWorld, idx: number): number[] {
  const c = menuCharacter(w, idx);
  const rec = recordOf(w, c);
  const env = envFor(w, c);
  const job = menuDressId(w, c);
  const sources: number[][] = [jobAbilityGroup(girlJob(c, job), env), [...rec.gate]];
  if (!isSpecialJob(job, false)) sources.push(plateAbilityGroup(plateIdOf(rec.plate), env), accessoryAbilityGroup(rec.accessories, env));
  const out: number[] = [];
  for (const source of sources) {
    for (const e of source) {
      if (e === MENU_BLANK || category(e) === 8) continue;
      if (!mayRepeat(e) && out.includes(e)) continue;
      if (out.length < 0x40) out.push(e);
    }
  }
  return out;
}

/** The bit position of a command id in the builder's bitfield: the word number and the bit in it. */
function bitPos(id: number): [number, number] {
  const low = id & 0xfff;
  let word = low >> 4;
  if ((id & 0xfffff000) === 0x4000) word += 0x25;
  return [word, low & 0xf];
}

/** Does a row count as a child of the parent that opens `group` (key `key`)? */
function childOf(rowIndex: number, group: number, key: number): boolean {
  const r = menuRow(rowIndex);
  return (r.flags & 7) === 0 && r.child === group && (group < 0xb || group > 0xd || key === r.key);
}

/** The builder's result: the command bitfield, the greyed-parent flag block and the number of rows walked. */
export interface Ffx2MenuTable {
  readonly bits: number[];
  readonly flags: number[];
  readonly rows: number;
}

function bitSet(bits: readonly number[], id: number): boolean {
  const [word, bit] = bitPos(id);
  return word < MENU_BITS && (((bits[word] ?? 0) >> bit) & 1) === 1;
}

/** True when the builder has command `id` set. */
export function menuBit(t: Pick<Ffx2MenuTable, 'bits'>, id: number): boolean {
  return bitSet(t.bits, id);
}

/**
 * The command-table builder (exe 0x00625fc0) for a party record: the save word (Item, Escape, Dresspheres; skipped by the Special forms), the
 * girl's command list, every learned child of a listed parent, and the second pass that shows or hides the 0x10 parents.
 */
export function buildMenuTable(w: Ffx2MenuWorld, idx: number): Ffx2MenuTable {
  const bits = new Array<number>(MENU_BITS).fill(0);
  const flags = new Array<number>(MENU_BITS).fill(0);
  const rec = recordOf(w, idx);
  if (idx < 3 && !isSpecialJob(menuDressId(w, idx), true)) bits[0] = rec.saveWord & 0xffff;
  if (w.debugDresspheres && idx < 3) bits[0] = (bits[0] ?? 0) | 4;
  const setBit = (id: number): void => {
    const [word, bit] = bitPos(id);
    if (word < MENU_BITS) bits[word] = (bits[word] ?? 0) | (1 << bit);
  };
  for (const e of partyCommandList(w, idx)) {
    setBit(e);
    if (category(e) !== 3) continue;
    const row = menuRow(e & 0xfff);
    if ((row.flags & 0xf8) === 0) continue;
    for (let k = 0; k < FFX2_COMMAND_ROWS; k++) {
      if (childOf(k, row.group, row.key) && w.learnedCommand(idx, k)) setBit(0x3000 + k);
    }
  }
  // The second pass walks every parent. The game's inner counter treats index 0xff as "empty", so command 0x30ff never counts as a child.
  for (let i = 0; i < FFX2_COMMAND_ROWS; i++) {
    const p = menuRow(i);
    const f8 = p.flags & 0xf8;
    if (f8 === 0) continue;
    let has = false;
    for (let k = 0; k < FFX2_COMMAND_ROWS && !has; k++) {
      if (k === 0xff) continue;
      has = bitSet(bits, 0x3000 + k) && childOf(k, p.group, p.key);
    }
    const [word, bit] = bitPos(0x3000 + i);
    if (f8 === 0x10) {
      if (has) bits[word] = (bits[word] ?? 0) | (1 << bit);
      else bits[word] = (bits[word] ?? 0) & ~(1 << bit) & 0xffff;
    } else if (f8 === 0x20) {
      if (has) flags[word] = (flags[word] ?? 0) & ~(1 << bit) & 0xffff;
      else flags[word] = (flags[word] ?? 0) | (1 << bit);
    }
  }
  return { bits, flags, rows: FFX2_COMMAND_ROWS };
}

/** How many entries a list of `kind` holds for this record (the groups 0xb to 0xd by dressphere, the rest fixed). */
function listCapacity(w: Ffx2MenuWorld, idx: number, kind: number): number {
  const fixed = FIXED_CAPACITY[kind];
  if (fixed !== undefined) return fixed;
  const byDressphere = GROUP_CAPACITY[kind];
  if (byDressphere === undefined) return 0;
  return byDressphere[girlJob(idx, menuDressId(w, idx)) & 0xfff] ?? 0;
}

/** A menu list by store kind: the command ids in menu order, the blank value 0xff after them. */
export type Ffx2MenuLists = Readonly<Record<number, readonly number[]>>;

/**
 * The whole refresh (exe 0x00626e50): the builder, then the list writer (every set bit goes to the first free slot of its list: kind 0 the main
 * list, kind 0x16 the shortcut list for a direct command with cursor flag 0x100, kind = the child group otherwise; a full list drops the entry),
 * then a stable bubble sort of each list by the row's order key (blanks last).
 */
export function menuLists(w: Ffx2MenuWorld, idx: number): Ffx2MenuLists {
  const t = buildMenuTable(w, idx);
  const lists = new Map<number, number[]>();
  for (const [kind, size] of STORE_KINDS) lists.set(kind, new Array<number>(size).fill(MENU_BLANK));
  for (let i = 0; i < t.rows; i++) {
    if (!menuBit(t, 0x3000 + i)) continue;
    const r = menuRow(i);
    let kind = 0;
    if ((r.flags & 7) === 0) kind = r.child;
    else if ((r.cursor & 0x100) !== 0) kind = 0x16;
    const list = lists.get(kind);
    if (list === undefined) continue;
    const cap = listCapacity(w, idx, kind);
    let first = -1;
    let present = false;
    for (let j = 0; j < cap; j++) {
      if (list[j] === MENU_BLANK && first < 0) first = j;
      if (list[j] === 0x3000 + i) {
        present = true;
        break;
      }
    }
    if (!present && first >= 0) list[first] = 0x3000 + i;
  }
  const out: Record<number, readonly number[]> = {};
  for (const [kind, list] of lists) {
    const n = list.length;
    const key = (e: number): number => (e === MENU_BLANK ? 0xffff : menuRow(e & 0xfff).order);
    for (let swapped = true; swapped; ) {
      swapped = false;
      for (let j = 0; j < n - 1; j++) {
        if (key(list[j + 1] as number) < key(list[j] as number)) {
          const tmp = list[j] as number;
          list[j] = list[j + 1] as number;
          list[j + 1] = tmp;
          swapped = true;
        }
      }
    }
    out[kind] = list;
  }
  return out;
}
