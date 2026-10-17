/**
 * Kill rewards, paid by the game's own roll at each death (re-parity RC9, lane FFX-M; **FFX only**).
 *
 * Until now the engine summed a battle's rewards at its end and rolled a percent chance per drop on its own side stream. The game pays at each monster's death
 * (`pp_BtlDamageCheckDeath`, FFX.exe 0x0078c740, calls the kill-rewards routine 0x007990d0 once per death, `research/re-ffx-overdrive-steal-aeons.md` section 3.4, FFX-G02 section 3.1
 * step 14 and FFX-G10 section 3.4): AP into every slot's running total, the gil with the Gillionaire multiplier, two item slots each rolled on stream 10 (stream 11 after a success),
 * the monster's overkill list instead of its normal one on an overkill, a Distill status turning the item into a sphere, a bribed monster leaving its Bribe item (two draws on the killer's
 * own stream), and last one more stream-10 draw for the gear roll. `kernel/drops.ts#rollDrops` is that routine (proven against FFX.exe: `tests/unit/parity-ffx-steal-rewards.test.ts`
 * replays 1,980 captured runs of the game's own code, 252 whole kill-reward rolls, 1,481 AP-award, list-add and settle runs and 247 gear rolls, and the private note FFX-H02 ran the roll on
 * the real record of all 361 monsters, 21,780 runs, 0 mismatches); this module is the seam between it and the engine.
 *
 * - **Where it is called**: `hp.ts#koActor` (a monster that dies) and `hp.ts#ejectActor` (a monster shattered or ejected: the death check's kind 2 pays the same).
 * - **What it reads**: the monster's loot record (`EnemyRewards.loot`, numbers read from the game's own monster file: `data/ffx/loot/records.ts`); whether the engine marked the death an
 *   overkill (`FFXRuntime.overkilled`, made before the KO); the Distill bits the monster carried (`ActorRuntime.distill`, set by the status step); the Bribe marker (`ActorRuntime.bribed`,
 *   nothing sets it yet: the Bribe command is not in the engine); the 18 party and aeon slots (`ApRecipient`: Double, Triple and No AP, Gillionaire, in the battle, dead, ejected).
 * - **What it writes**: {@link RewardLedger}, the game's reward struct as far as kills fill it: gil, the 18 slots' AP, the item stacks (at most eight, each at most 99). `results.ts` reads it.
 * - **The gear roll**: the routine's last draw is made (stream 10, so every later steal roll stands where the game's would), and a hit is only COUNTED (`gearDrops`): the gear piece itself, and its
 *   draws on streams 12 and 13, are not made (M2: the party has no equipment screen; Bailey's accepted answer to Q14 is no gear drops). The kernel is handed a gear chance of 0 for that reason.
 *
 * Draws: one `int(0, 0x7fffffff)` of the named stream per kernel draw, which is the raw 31-bit value the kernel reduces itself (`% 255`, `& 0xff`, `% 11`, `& 1`).
 */

import type { CombatantId, EnemyRewards, FFXCombatant, FfxLootRecord, ItemDrop } from '../../common/types.ts';
import { AUTO_B, type ApRecipient } from '../kernel/ap-award.ts';
import { type DropLoot, type DropsInput, type RewardList, rollDrops } from '../kernel/drops.ts';
import { MIX_ITEM_IDS } from '../kernel/mix-table.ts';
import { mixItemNumber } from '../kernel/mix.ts';
import { hasAuto } from '../equipment.ts';
import { friendlies, type Ctx, has, onField, rtOf } from '../state.ts';
import { AEON_SLOT, PARTY_SLOT } from './slots.ts';
import { streamsOf } from './streams.ts';
import { autoWordB } from './words.ts';

/** An overkill doubles a hand-built enemy's item quantities (PR-0258; a record has its own overkill list). Re-exported by `results.ts`. */
export const OVERKILL_DROP_MULTIPLIER = 2;

/** The number the first item of ours the game's table does not have is given; the next gets the next one (a test rig's ids). */
const FOREIGN_FIRST = 0x2800;
/** The game's 18 character slots the AP is awarded to: 0 to 7 the party, 8 to 0x11 the ten aeons. */
const SLOTS = 0x12;

/** The game's reward struct for one battle, as the kill rewards fill it. Plain data: it is cloned with the runtime. */
export interface RewardLedger {
  /** Gil, the 18 slots' AP totals, the item stacks (the game's item numbers) and the gear list (always empty: the gear drop is not wired). */
  list: RewardList;
  /** The AP the monsters were worth, before any member's multiplier: what the results screen calls the battle's AP. */
  baseAp: number;
  /** Item ids of ours the game's table has no number for (a hand-built rig's), in the order met: id `i` is number `FOREIGN_FIRST + i`. */
  foreign: string[];
  /** Deaths paid. */
  kills: number;
  /** Gear rolls made (one per paid death) and how many hit. A hit gives nothing yet (M2). */
  gearRolls: number;
  gearDrops: number;
}

export function newLedger(): RewardLedger {
  return { list: { gil: 0, ap: new Array<number>(SLOTS).fill(0), items: [], gear: [] }, baseAp: 0, foreign: [], kills: 0, gearRolls: 0, gearDrops: 0 };
}

/** A copy a dry run can write to. */
export function cloneLedger(l: RewardLedger): RewardLedger {
  return {
    list: { gil: l.list.gil, ap: [...l.list.ap], items: l.list.items.map((s) => ({ ...s })), gear: [] },
    baseAp: l.baseAp,
    foreign: [...l.foreign],
    kills: l.kills,
    gearRolls: l.gearRolls,
    gearDrops: l.gearDrops,
  };
}

/** A copy of an enemy's rewards (the setup's and the forecast's): the lists and the record are the battle's own. */
export function cloneRewards(r: EnemyRewards): EnemyRewards {
  return { ...r, drops: r.drops.map((d) => ({ ...d })), ...(r.loot !== undefined ? { loot: cloneRecord(r.loot) } : {}) };
}

function cloneRecord(rec: FfxLootRecord): FfxLootRecord {
  return {
    ...rec,
    chance: [rec.chance[0], rec.chance[1]],
    items: [rec.items[0], rec.items[1], rec.items[2], rec.items[3]],
    qty: [rec.qty[0], rec.qty[1], rec.qty[2], rec.qty[3]],
    overkillItems: [rec.overkillItems[0], rec.overkillItems[1], rec.overkillItems[2], rec.overkillItems[3]],
    overkillQty: [rec.overkillQty[0], rec.overkillQty[1], rec.overkillQty[2], rec.overkillQty[3]],
  };
}

// --------------------------------------------------------------------------------------------------------------------- item numbers

/** The game's number of an item id of ours (0x2000 + index), or a foreign number from the ledger. */
function numberOf(ledger: RewardLedger, id: string): number {
  const known = mixItemNumber(id);
  if (known !== undefined) return known;
  let i = ledger.foreign.indexOf(id);
  if (i < 0) {
    i = ledger.foreign.length;
    ledger.foreign.push(id);
  }
  return FOREIGN_FIRST + i;
}

/** Our id of a game item number. */
export function itemIdOf(ledger: RewardLedger, number: number): string {
  const id = number >= FOREIGN_FIRST ? ledger.foreign[number - FOREIGN_FIRST] : MIX_ITEM_IDS[number - 0x2000];
  if (id === undefined) throw new Error(`FFX loot: item number 0x${number.toString(16)} has no id`);
  return id;
}

// --------------------------------------------------------------------------------------------------------------------- the record

/** What the roll reads of one monster, in the kernel's own shape, with the gear roll's true chance beside it. */
interface Loot {
  kernel: DropLoot;
  /** The record's gear chance byte; the kernel is given 0 (see the file header). */
  gearChance: number;
}

function lootOfRecord(rec: FfxLootRecord): Loot {
  return {
    gearChance: rec.gearChance,
    kernel: {
      gil: rec.gil,
      ap: rec.ap,
      apOverkill: rec.apOverkill,
      chance: [rec.chance[0], rec.chance[1]],
      gearChance: 0,
      items: [...rec.items],
      qty: [...rec.qty],
      overkillItems: [...rec.overkillItems],
      overkillQty: [...rec.overkillQty],
      bribeItem: rec.bribeItem,
      bribeFactor: rec.bribeFactor,
      slotBase: 0,
      copy2e: 0,
      copy2f: 0,
      copy30: 0,
      abilityBase: 0,
      rows: new Map(),
    },
  };
}

/** The chance byte of a hand-built drop: its percent on the byte scale, a guaranteed entry (no chance listed) 255. */
function chanceByte(d: ItemDrop | undefined): number {
  if (d === undefined) return 0;
  if (d.chance === undefined) return 255;
  return Math.max(0, Math.min(255, Math.round((d.chance * 255) / 100)));
}

/**
 * A record for an enemy that has none (a hand-built rig): its first two drops are the two item slots, a `rare` entry the slot's rare item, a guaranteed entry chance byte 255, a percent its
 * share of 255; the overkill list is the same items at double the quantity (PR-0258). Every enemy the game ships has a record, so this is only for tests and tools.
 */
function lootOfLegacy(r: EnemyRewards, ledger: RewardLedger): Loot {
  const items: number[] = [0, 0, 0, 0];
  const qty: number[] = [0, 0, 0, 0];
  for (let k = 0; k < 2; k++) {
    const d = r.drops[k];
    if (d === undefined) continue;
    items[2 * k] = numberOf(ledger, d.itemId);
    qty[2 * k] = d.count;
    items[2 * k + 1] = d.rare !== undefined ? numberOf(ledger, d.rare.itemId) : items[2 * k]!;
    qty[2 * k + 1] = d.rare !== undefined ? d.rare.count : d.count;
  }
  const bribe = r.bribe?.item;
  return {
    gearChance: 0,
    kernel: {
      gil: r.gil,
      ap: r.ap,
      apOverkill: r.apOverkill,
      chance: [chanceByte(r.drops[0]), chanceByte(r.drops[1])],
      gearChance: 0,
      items,
      qty,
      overkillItems: [...items],
      overkillQty: qty.map((q) => Math.min(99, q * OVERKILL_DROP_MULTIPLIER)),
      bribeItem: bribe !== undefined ? numberOf(ledger, bribe.itemId) : 0,
      bribeFactor: bribe?.count ?? 0,
      slotBase: 0,
      copy2e: 0,
      copy2f: 0,
      copy30: 0,
      abilityBase: 0,
      rows: new Map(),
    },
  };
}

// --------------------------------------------------------------------------------------------------------------------- the slots

/** The combatant of each of the 18 slots (a party member of an id the game has no slot for, a rig's, takes a free one). */
export function slotMembers(ctx: Ctx): Array<FFXCombatant | undefined> {
  const out = new Array<FFXCombatant | undefined>(SLOTS).fill(undefined);
  const spare: FFXCombatant[] = [];
  for (const id of Object.keys(ctx.state.combatants)) {
    const c = ctx.state.combatants[id] as FFXCombatant;
    if (c.side === 'enemy') continue;
    const slot = c.side === 'aeon' ? AEON_SLOT[c.id] : PARTY_SLOT[c.id];
    if (slot !== undefined && slot < SLOTS && out[slot] === undefined) out[slot] = c;
    else spare.push(c);
  }
  for (const c of spare) {
    const free = out.indexOf(undefined);
    if (free >= 0) out[free] = c;
  }
  return out;
}

/** Double AP, Triple AP, No AP and Gillionaire as the AP award reads them (`Chr+0x6be`), beside the words the gauge kernels read. */
function autoBOf(c: FFXCombatant): number {
  let word = autoWordB(c);
  if (hasAuto(c, 'double-ap')) word |= AUTO_B.ApDouble;
  if (hasAuto(c, 'triple-ap')) word |= AUTO_B.ApTriple;
  if (hasAuto(c, 'no-ap')) word |= AUTO_B.ApNone;
  if (hasAuto(c, 'gillionaire')) word |= AUTO_B.GilDouble;
  return word;
}

function recipientsOf(ctx: Ctx, members: ReadonlyArray<FFXCombatant | undefined>): ApRecipient[] {
  const present = new Set(friendlies(ctx).map((c) => c.id));
  return members.map((c) =>
    c === undefined
      ? { autoB: 0, inBattle: false, dead: false, apBlocked: true }
      : { autoB: autoBOf(c), inBattle: present.has(c.id) && onField(c), dead: !c.alive || has(c, 'ko'), apBlocked: has(c, 'eject') },
  );
}

/** Each party member's AP total so far (the 18 slots' running totals read back by member), before the end-of-battle settle. */
export function memberTotals(ctx: Ctx): Map<CombatantId, number> {
  const out = new Map<CombatantId, number>();
  const ledger = ctx.rt.rewards;
  if (ledger === undefined) return out;
  slotMembers(ctx).forEach((c, slot) => {
    if (c !== undefined) out.set(c.id, ledger.list.ap[slot] ?? 0);
  });
  return out;
}

// --------------------------------------------------------------------------------------------------------------------- the roll

/**
 * One monster's death pays. `killer` is whoever's action it was (only a bribed monster's quantity uses it: the killer's own stream). A monster with no rewards block pays nothing.
 */
export function payKill(ctx: Ctx, victim: FFXCombatant, killer?: FFXCombatant): void {
  const rewards = victim.enemy?.rewards;
  if (rewards === undefined) return;
  const ledger = (ctx.rt.rewards ??= newLedger());
  const rt = rtOf(ctx, victim.id);
  const loot = rewards.loot !== undefined ? lootOfRecord(rewards.loot) : lootOfLegacy(rewards, ledger);
  const overkill = ctx.rt.overkilled.includes(victim.id);
  const bribed = rt.bribed !== undefined;
  const members = slotMembers(ctx);

  const draws: Array<[number, number]> = [];
  const draw = (stream: number): number => {
    const value = ctx.rng.on(stream).int(0, 0x7fffffff);
    draws.push([stream, value]);
    return value;
  };
  const input: DropsInput = {
    killerStream: bribed && killer !== undefined ? streamsOf(ctx, killer).damage : 0,
    killerId: 0,
    loot: loot.kernel,
    overkill,
    statusWord: rt.distill ?? 0,
    bribed,
    bribeValue: rt.bribed ?? 0,
    recipients: recipientsOf(ctx, members),
    joined: [false, false, false, false, false, false, false],
    groupOf: () => -1,
    nameOf: () => 0,
    opts: { language: 1 },
  };
  rollDrops(input, ledger.list, draw);

  ledger.baseAp += overkill ? loot.kernel.apOverkill : loot.kernel.ap;
  ledger.kills += 1;
  // The routine's last draw is the gear roll (stream 10, `% 255`): a hit is counted, no piece is made.
  const gear = draws[draws.length - 1];
  if (gear !== undefined) {
    ledger.gearRolls += 1;
    if ((gear[1] % 255) < loot.gearChance) ledger.gearDrops += 1;
  }
  // The Distill status goes with the life the death ended (the death handler's reset clears the extra word).
  delete rt.distill;
}
