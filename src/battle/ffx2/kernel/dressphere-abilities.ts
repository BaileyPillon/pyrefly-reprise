/**
 * FFX-2 stat builder, part 2: which auto-abilities a girl has, and what the equipment and those abilities add into the
 * stats.  The five sources of the list, the prerequisite test, the bonus block, and the OR of the ability words.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69).  Spec:
 * `research/re-ffx2-dressphere.md` sections 1 and 4.  Pure, deterministic, no DOM, no engine types.  Not wired into the
 * engine.
 *
 * Exe addresses (live build):
 * - 0x00629570  the list of one kind (auto-abilities are kind 8) from the groups below
 * - 0x00629260  MsCheckAbility: the prerequisite test
 * - 0x006294d0  duplicate test
 * - 0x00629ad0  group 0x1a, the dressphere's own abilities;  0x00629d10  group 0x1c, the garment grid's equip effects
 * - 0x006296d0  group 0x1e, the accessories' abilities;  `Gate array` at VA 0x00df7ff0 (+0x10 per girl)  group 0x23
 * - 0x00618e90  the bonus block;  0x0061be70  one source's contribution to it
 * - 0x0060c4d0  "mastered" (AP reaches the cost);  0x0062a6e0  the key-item bit test
 *
 * The bonus block is 30 ints (see `BLOCK_SIZE` in `dressphere-stats.ts`): slots 0 to 9 are the first layer of the `up_status`
 * arrays (HP %, MP %, then flat Strength, Defense, Magic, Magic Defense, Agility, Accuracy, Evasion, Luck), 10 to 19 a second
 * layer only a player-side monster's dressphere fills, 20 to 29 the Special dresspheres' scale terms.
 */

import { BLOCK_SCALE, BLOCK_SIZE, isSpecialJob } from './dressphere-stats.ts';
import { FFX2_JOB_ABILITIES, plateRow } from './dressphere-grids.ts';
import { abilityRow, accessoryRow, type Ffx2UpStatus } from './dressphere-rows.ts';

/** The game state the prerequisite and "mastered" tests read. */
export interface Ffx2AbilityEnv {
  /** The girl's level (MsCalcChrLevel). */
  readonly level: number;
  /** AP has reached the cost of this command (0x3000 range) or auto-ability (0x8000 range). */
  readonly learned: (id: number) => boolean;
  /** Key item number `bit` (0 to 127) is held: the `0x7000 + bit` prerequisites. */
  readonly keyItem: (bit: number) => boolean;
  /** The girl's eight gate-ability slots (0xff = empty), filled by `gateAbilities` in `spherechange.ts`. */
  readonly gateSlots: readonly number[];
}

/** An auto-ability id is category 8 of the id's top nibble; commands are 3 and 4, key items 7, accessories 9, garment grids 6. */
const category = (id: number): number => (id & 0xffff) >> 12;

/** `MsCheckAbility` (exe 0x00629260): is a prerequisite met?  `level` is the number the caller passes (the girl's level, 0, or -1). */
export function prerequisiteMet(cond: number, level: number, env: Pick<Ffx2AbilityEnv, 'learned' | 'keyItem'>): boolean {
  const all = (...ids: number[]): boolean => ids.every((i) => env.learned(i));
  switch (category(cond)) {
    case 3:
    case 4:
    case 8:
      return env.learned(cond);
    case 7:
      return (cond & 0xfff) < 0x80 && env.keyItem(cond & 0xfff);
    default:
      switch (cond) {
        case 0x100:
          return all(0x3069, 0x306a, 0x306b, 0x306c);
        case 0x101:
          return all(0x8006, 0x8007);
        case 0x102:
          return all(0x802d, 0x8031, 0x8035, 0x8039);
        case 0x103:
          return all(0x3200, 0x3201, 0x3202, 0x3203);
        case 0x104:
          return all(0x3206, 0x3207, 0x3208, 0x3209);
        case 0x105:
          return all(0x320c, 0x320d, 0x320e, 0x320f);
        default:
          // a plain number: a level requirement; a negative level means "do not test" (the menu's view)
          return !(level < cond && level > -1);
      }
  }
}

/** True when `id` may not be added because it is already in `list` (an auto-ability whose row has bit 2, "stackable", is exempt). */
function isDuplicate(id: number, list: readonly number[]): boolean {
  const exempt = category(id) === 8 && (abilityRow(id).special & 4) !== 0;
  return !exempt && list.includes(id);
}

/**
 * Group 0x1a (exe 0x00629ad0, "learned" mode, which is what the battle uses): the dressphere's sixteen (prerequisite, ability)
 * pairs.  An ability is listed when it is not 0, its prerequisite is met, it is not a duplicate, and either it has no
 * prerequisite or AP has mastered the ability itself.  At most 16.
 */
export function jobAbilityGroup(job: number, env: Ffx2AbilityEnv): number[] {
  const pairs = FFX2_JOB_ABILITIES[job & 0xfff] ?? [];
  const out: number[] = [];
  for (let k = 0; k < 16; k++) {
    const pre = pairs[2 * k] ?? 0;
    const id = pairs[2 * k + 1] ?? 0;
    if (id === 0) continue;
    if ((pre === 0 || env.learned(id)) && prerequisiteMet(pre, env.level, env) && !isDuplicate(id, out) && out.length < 16) out.push(id);
  }
  return out;
}

/**
 * Group 0x1c (exe 0x00629d10): the garment grid's eight (condition, ability) pairs, tested with level 0.  Only a pair with
 * condition 0 can pass, so this is the grid's always-on abilities; the gate conditions (1 to 7, 100 to 102) are met through the
 * gate slots instead.  No mastery is needed.  `plateId` is 0xff for no grid; the table then answers with its first row.
 */
export function plateAbilityGroup(plateId: number, env: Ffx2AbilityEnv): number[] {
  const out: number[] = [];
  for (const [cond, id] of plateRow(plateId).abilities) {
    if (id === 0) continue;
    if (prerequisiteMet(cond, 0, env) && !isDuplicate(id, out) && out.length < 16) out.push(id);
  }
  return out;
}

/**
 * Group 0x1e (exe 0x006296d0): the two accessories' (condition, ability) pairs, conditions tested with the girl's level.  The
 * table is read for any slot value (an empty slot reads the first accessory's row, which has no abilities).
 */
export function accessoryAbilityGroup(slots: readonly [number, number], env: Ffx2AbilityEnv): number[] {
  const out: number[] = [];
  for (const slot of slots) {
    for (const [cond, id] of accessoryRow(slot).abilities) {
      if (id === 0) continue;
      if (prerequisiteMet(cond, env.level, env) && !isDuplicate(id, out) && out.length < 16) out.push(id);
    }
  }
  return out;
}

export interface Ffx2AbilityListInput {
  /** The dressphere being worn, `0x5000 | index`, already mapped to this girl's variant. */
  readonly job: number;
  readonly plateId: number;
  readonly accessories: readonly [number, number];
  readonly env: Ffx2AbilityEnv;
}

/**
 * The girl's auto-abilities (`MsGetAbilityList` kind 8, exe 0x00629570), in order.  A Special dressphere's main unit
 * (ids 0x500f, 0x5012, 0x5015) draws only from its own list and the gate slots; every other dressphere (the pods included)
 * draws from its own list, the gate slots, the grid's equip effects and the accessories.  The player-side monsters' two groups
 * (0x29, 0x2a) are empty for a girl.  Duplicates are dropped unless the ability is stackable; at most 64.
 */
export function abilityList(i: Ffx2AbilityListInput): number[] {
  const groups: number[][] = isSpecialJob(i.job, false)
    ? [jobAbilityGroup(i.job, i.env), [...i.env.gateSlots]]
    : [jobAbilityGroup(i.job, i.env), [...i.env.gateSlots], plateAbilityGroup(i.plateId, i.env), accessoryAbilityGroup(i.accessories, i.env)];
  const out: number[] = [];
  for (const group of groups) {
    for (const id of group) {
      if (category(id) !== 8) continue;
      if (!isDuplicate(id, out) && out.length < 0x40) out.push(id);
    }
  }
  return out;
}

/** The three auto-ability words (`Chr+0x650`, `+0x652`, `+0x654`): the OR of every listed ability's words. */
export function abilityWords(list: readonly number[]): [number, number, number] {
  const w: [number, number, number] = [0, 0, 0];
  for (const id of list) {
    if (id === 0 || id === 0xff) continue;
    const r = abilityRow(id).words;
    w[0] |= r[0];
    w[1] |= r[1];
    w[2] |= r[2];
  }
  return w;
}

// ---------------------------------------------------------------------------------------------------
// The bonus block
// ---------------------------------------------------------------------------------------------------

/** `0x0061be70` for a girl: one source's contribution. */
function contribute(block: number[], id: number, special: boolean): void {
  const add = (up: Ffx2UpStatus): void => {
    for (let k = 0; k < 10; k++) block[k] = (block[k] ?? 0) + (up[k] as number);
  };
  switch (category(id)) {
    case 6: {
      const row = plateRow(id);
      if (special) {
        for (let k = 0; k < 6; k++) block[BLOCK_SCALE + k] = row.bonus;
      } else {
        add(row.up);
      }
      break;
    }
    case 8:
      add(abilityRow(id).up);
      break;
    case 9:
      if (!special) add(accessoryRow(id).up);
      break;
    default:
      break; // 5 (a dressphere) only counts for a player-side monster; 7 and the rest add nothing
  }
}

export interface Ffx2BlockInput {
  readonly accessories: readonly [number, number];
  /** `abilityList(...)`. */
  readonly abilities: readonly number[];
  /** The plate id as the game forms it: 0xff for none, else `0x6000 | (record & 0xfff)`. */
  readonly plateId: number;
  /** `isSpecialJob(job, true)`. */
  readonly special: boolean;
}

/**
 * The bonus block (exe 0x00618e90), built in this order: the two accessory slots, then each listed ability, then the garment
 * grid.  A Special dressphere skips the accessories' and the grid's `up_status` (it keeps the abilities') and instead takes the
 * grid's node count as the scale term of HP, MP, Strength, Defense, Magic and Magic Defense.
 */
export function bonusBlock(i: Ffx2BlockInput): number[] {
  const block = new Array<number>(BLOCK_SIZE).fill(0);
  for (const slot of i.accessories) contribute(block, slot, i.special);
  for (const id of i.abilities) contribute(block, id, i.special);
  if (i.plateId !== 0xff) contribute(block, i.plateId, i.special);
  return block;
}

/** The plate id the block builder uses for the record's plate field (exe 0x0060c7c0): 0xff stays, anything else is forced into 0x6000..0x6fff. */
export function plateIdOf(recordPlate: number): number {
  const p = recordPlate & 0xffff;
  return p === 0xff ? 0xff : (p & 0xfff) | 0x6000;
}
