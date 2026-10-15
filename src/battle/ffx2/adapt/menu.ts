/**
 * The FFX-2 command menu's adapter (re-parity RC7 lane X2-B; **FFX-2 only**): what the game lists for one of our girls, asked of the menu
 * kernel (`kernel/command-menu.ts`), and the numbers the menu's rules read of her (auto-ability words, the Special family).
 *
 * The kernel works in the game's terms (save records, command ids); the engine's girl is a unit with a dressphere id, a list of learned ability ids
 * and a garment grid. This file is the one place that turns one into the other. Two limits are deliberate and listed in
 * `docs/handoff/re-parity-rc7-x2cmd.md`: the engine models no key items, gate slots, garment-grid pairs or accessory pairs of commands, so the kernel
 * is given none (the plates and accessories it knows are proven in the kernel's own vectors, not wired); and the build's learned list stays the
 * authority on what she has learned (a build cannot say which AP she holds), so the kernel adds only what the game lists without learning
 * (the free pairs), never a command the build did not give her.
 */

import type { AbilityDef } from '../../common/types.ts';
import { menuRow } from '../kernel/command-menu-rows.ts';
import { buildMenuTable, menuBit, type Ffx2MenuWorld } from '../kernel/command-menu.ts';
import { MISC_SILENCEABLE, silenceable } from '../kernel/command-usable.ts';
import { abilityList, abilityWords } from '../kernel/dressphere-abilities.ts';
import { FFX2_JOB_ABILITIES } from '../kernel/dressphere-grids.ts';
import { girlJob } from '../kernel/dressphere-stats.ts';
import type { DressphereDef, Ffx2Unit } from '../internal.ts';
import { ABILITY_GAME_ID, DRESSPHERE_JOB, SPECIAL_DRESSPHERE_IDS, abilityOfGameId, gameIdOf } from './game-ids.ts';

/** The save record of each girl, by the id the builds give her. */
const GIRL_RECORD: Readonly<Record<string, number>> = { yuna: 0, rikku: 1, paine: 2 };

/**
 * The auto-ability rows our garment-grid tags stand for, when the tag moves a word something reads: the MP cost (the menu) and the reward abilities (the kill
 * roll, `kill-rewards.ts`: Double AP 0x8009, Triple AP 0x800a, Butterfingers 0x800e, Gillionaire 0x800f, Double Items 0x8010, Double EXP 0x8011, Item Hunter 0x8012;
 * note FFX2-G03 section 4.8, re-parity RC9 lane X2-C).
 */
const TAG_ABILITY: Readonly<Record<string, number>> = {
  'magic-booster': 0x8005,
  'half-mp-cost': 0x801c,
  'one-mp-cost': 0x801d,
  'double-ap': 0x8009,
  'triple-ap': 0x800a,
  butterfingers: 0x800e,
  gillionaire: 0x800f,
  'double-items': 0x8010,
  'double-exp': 0x8011,
  'item-hunter': 0x8012,
};

const category = (id: number): number => (id & 0xffff) >> 12;
const BLANK_GATE: readonly number[] = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

/** The pairs of every dressphere's ladder, flattened: [prerequisite, id] in job order. */
function pairsOf(job: number): ReadonlyArray<readonly [number, number]> {
  const row = FFX2_JOB_ABILITIES[job & 0xfff] ?? [];
  const out: Array<readonly [number, number]> = [];
  for (let k = 0; k + 1 < row.length; k += 2) if ((row[k + 1] as number) !== 0) out.push([row[k] as number, row[k + 1] as number]);
  return out;
}

/** Each command or ability's own prerequisite (the first ladder that names it), for closing a learned set under what must precede it. */
const PREREQUISITE = new Map<number, number>();
for (let job = 0x5001; job <= 0x5021; job++) {
  for (const [pre, id] of pairsOf(job)) if (pre !== 0 && pre !== 1 && !PREREQUISITE.has(id)) PREREQUISITE.set(id, pre);
}
/** The composite prerequisites (exe 0x00629260): all of these must be learned. */
const COMPOSITE: Readonly<Record<number, readonly number[]>> = {
  0x100: [0x3069, 0x306a, 0x306b, 0x306c],
  0x101: [0x8006, 0x8007],
  0x102: [0x802d, 0x8031, 0x8035, 0x8039],
  0x103: [0x3200, 0x3201, 0x3202, 0x3203],
  0x104: [0x3206, 0x3207, 0x3208, 0x3209],
  0x105: [0x320c, 0x320d, 0x320e, 0x320f],
};

/** What the kernel was asked and answered for one girl. */
export interface MenuAvailability {
  /** The game's ids of the commands she has learned (the build's lists, every dressphere's; all of the worn ladder when the build names none). */
  readonly learned: ReadonlySet<number>;
  /** The game's ids of the commands the game lists for her (children and direct commands; no parent, no Item, Escape or Dresspheres). */
  readonly listed: ReadonlySet<number>;
  /** The worn ladder's pairs with prerequisite 0: listed without being learned. */
  readonly free: ReadonlySet<number>;
}

/** The girl's save record and her worn dressphere as the game stores it, or null when the unit is not one of the three girls. */
function girlOf(actor: Ffx2Unit): { record: number; job: number } | null {
  const record = GIRL_RECORD[actor.id];
  const sphere = actor.dresspheres?.current;
  const stored = sphere === undefined ? undefined : DRESSPHERE_JOB[sphere];
  return record === undefined || stored === undefined ? null : { record, job: stored };
}

/**
 * The learned game ids of a girl: every dressphere's list, and the whole worn ladder when the build names no list for it (the pairs of the game's ladder, and every
 * ability of our own ladder, which includes the Blue Bullets that are children and in no pair).
 */
function learnedOf(actor: Ffx2Unit, record: number, stored: number, ladder: readonly string[] = []): Set<number> {
  const out = new Set<number>();
  const progress = actor.dresspheres?.abilitiesLearned ?? {};
  for (const p of Object.values(progress)) {
    for (const id of p.learned) {
      const g = gameIdOf(id);
      if (g !== undefined) out.add(g);
    }
  }
  // A heading the worn ladder names (the Mascot's Swordplay and Arcana, the Gun Mage's Blue Bullet) is learned with the ladder: our builds can only name the
  // moves, and a heading is what lets the moves she learned under another dressphere show.
  for (const [, id] of pairsOf(girlJob(record, stored))) if ((menuRow(id & 0xfff).flags & 0xf8) !== 0 && category(id) === 3) out.add(id);
  const own = progress[actor.dresspheres?.current ?? ''];
  if (own === undefined || own.learned.length === 0) {
    for (const [, id] of pairsOf(girlJob(record, stored))) out.add(id);
    for (const id of ladder) {
      const g = gameIdOf(id);
      if (g !== undefined) out.add(g);
    }
  }
  return out;
}

/** Close a learned set under the prerequisites: whoever learned a command learned what the ladder put before it. */
function closed(learned: ReadonlySet<number>): Set<number> {
  const out = new Set(learned);
  const queue = [...learned];
  while (queue.length > 0) {
    const id = queue.pop() as number;
    const pre = PREREQUISITE.get(id);
    const needs = pre === undefined ? [] : (COMPOSITE[pre] ?? [pre]);
    for (const n of needs) {
      if (!out.has(n)) {
        out.add(n);
        queue.push(n);
      }
    }
  }
  return out;
}

function worldOf(actor: Ffx2Unit, record: number, stored: number, learnedClosed: ReadonlySet<number>): Ffx2MenuWorld {
  const blank = { job: 0x5000, plate: 0xff, accessories: [0xffff, 0xffff] as [number, number], saveWord: 0, gate: BLANK_GATE, level: actor.level };
  return {
    record: (i) => (i === record ? { ...blank, job: stored } : blank),
    learnedCommand: (_r, low) => learnedClosed.has(0x3000 + low),
    learnedAbility: (_r, low) => learnedClosed.has(0x8000 + low),
    keyItem: () => false,
    debugDresspheres: false,
  };
}

/** What the game lists for this girl, or null when the kernel does not apply (not one of the three girls, or a dressphere with no game id). */
export function menuAvailability(actor: Ffx2Unit, ladder: readonly string[] = []): MenuAvailability | null {
  const girl = girlOf(actor);
  if (girl === null) return null;
  const learned = learnedOf(actor, girl.record, girl.job, ladder);
  const table = buildMenuTable(worldOf(actor, girl.record, girl.job, closed(learned)), girl.record);
  const listed = new Set<number>();
  // Item, Escape and Dresspheres (0x3000 to 0x3002) are the engine's own rows; a parent is listed too (Mix is an ability of ours that opens the picker)
  for (let k = 3; k < table.rows; k++) if (menuBit(table, 0x3000 + k)) listed.add(0x3000 + k);
  const free = new Set<number>();
  for (const [pre, id] of pairsOf(girlJob(girl.record, girl.job))) if (pre === 0) free.add(id);
  return { learned, listed, free };
}

/**
 * The ability ids her command rows are made of, in the order they are offered. An ability on a ladder is offered when the game lists it for her and she
 * has learned it or the game lists it free; a passive auto-ability is not a command and is never offered; an ability on no ladder keeps the old rule (offered
 * when her list names it). The old order is kept (her learned list, or the ladder when the build names none), the free pairs her list left out follow in
 * ladder order.
 */
export function offeredAbilityIds(actor: Ffx2Unit, sphere: DressphereDef | undefined): readonly string[] {
  const sphereId = actor.dresspheres?.current ?? '';
  const named = actor.dresspheres?.abilitiesLearned?.[sphereId]?.learned ?? [];
  const old: readonly string[] = named.length > 0 ? named : (sphere?.abilityIds ?? []);
  // a dressphere the registry does not know (the Specials: no ladder of ours) keeps the old rule, which offers it nothing
  const avail = sphere === undefined ? null : menuAvailability(actor, sphere.abilityIds);
  if (avail === null) return old;
  const out: string[] = [];
  const add = (id: string): void => {
    if (!out.includes(id)) out.push(id);
  };
  const wanted = (g: number): boolean => category(g) === 3 && avail.listed.has(g) && (avail.learned.has(g) || avail.free.has(g));
  for (const id of old) {
    const g = gameIdOf(id);
    if (g === undefined || wanted(g)) add(id);
  }
  for (const id of sphere?.abilityIds ?? []) {
    const g = gameIdOf(id);
    if (g !== undefined && wanted(g)) add(id);
  }
  // a child she learned under another dressphere, listed under a parent the worn ladder names
  for (const g of avail.listed) {
    const id = abilityOfGameId(g);
    if (id !== undefined && wanted(g)) add(id);
  }
  return out;
}

/** True when the ability's dressphere is a Special (its forms have no Item, no Escape and no Dresspheres command). */
export function isSpecialWearer(actor: Ffx2Unit): boolean {
  const sphere = actor.dresspheres?.current;
  return sphere !== undefined && SPECIAL_DRESSPHERE_IDS.has(sphere);
}

/** Is this ability stopped by Silence? The row's own bit decides (88 rows, no parent); an ability with no game row keeps the old rule (the two spell menus). */
export function isSilenceable(ability: AbilityDef): boolean {
  const record = ability.ffx2Record;
  if (record !== undefined) return (record.flagsMisc & MISC_SILENCEABLE) !== 0;
  const g = ABILITY_GAME_ID[ability.id];
  if (g !== undefined && category(g) === 3) return silenceable(g);
  return ability.category === 'blackmagic' || ability.category === 'whitemagic';
}

/** The menu category byte the Magic Booster reads (`Cmd+0x0e`: 1 Black Magic, 2 White Magic). */
export function menuCategoryOf(ability: AbilityDef): number {
  if (ability.ffx2Record !== undefined) return ability.ffx2Record.category;
  const g = ABILITY_GAME_ID[ability.id];
  if (g !== undefined && category(g) === 3) return menuRow(g & 0xfff).group;
  return ability.category === 'blackmagic' ? 1 : ability.category === 'whitemagic' ? 2 : 0;
}

/**
 * The three auto-ability words of a girl (`Chr+0x650`, `+0x652`, `+0x654`): the OR of the rows of her listed auto-abilities (the worn ladder's, learned or
 * free) and of the auto-abilities her garment grid's tags stand for. Only the MP-cost words are read by the menu so far; the rest wait for the SOS lane.
 */
export function autoWordsOf(actor: Ffx2Unit, gridTags: readonly string[], sphereLadder: readonly string[] = []): readonly [number, number, number] {
  const words: [number, number, number] = [0, 0, 0];
  const girl = girlOf(actor);
  if (girl !== null) {
    const learned = closed(learnedOf(actor, girl.record, girl.job, sphereLadder));
    const list = abilityList({
      job: girlJob(girl.record, girl.job),
      plateId: 0xff,
      accessories: [0xffff, 0xffff],
      env: { level: actor.level, learned: (id) => learned.has(id) || category(id) === 4, keyItem: () => false, gateSlots: BLANK_GATE },
    });
    const own = abilityWords(list);
    words[0] |= own[0];
    words[1] |= own[1];
    words[2] |= own[2];
  }
  for (const tag of gridTags) {
    const id = TAG_ABILITY[tag];
    if (id !== undefined) {
      const w = abilityWords([id]);
      words[0] |= w[0];
      words[1] |= w[1];
      words[2] |= w[2];
    }
  }
  return words;
}
