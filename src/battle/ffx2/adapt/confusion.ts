/**
 * The Confusion pick's adapter (re-parity RC9 lane X2-H; **FFX-2 only**): a Confused girl's lists, stock and the field turned into the kernel's world
 * (`kernel/confusion-pick.ts`), and the kernel's answer turned back into one of our commands.
 *
 * The kernel works in the game's terms (command ids, slots, `Chr` fields); this file is the one place that turns our units into them. Every limit is listed in
 * `docs/handoff/re-parity-rc9-x2-confusion.md` section 6; the short form:
 * - her lists are what the menu kernel lists for her worn dressphere and what she has learned (`adapt/menu.ts#confusionLists`), with the Item and Escape bits of a new game;
 * - the stock is the party inventory in the order the build lists it (the game's slot order is the order the items were first gained; the draw reaches the same
 *   items with the same odds, not on the same seed);
 * - the blocked bitfields (`Chr+0x87c`, `+0x910`, `+0x9a8`) are written only by scripts the engine does not run, so nothing is blocked;
 * - a monster is not wired: who fills a monster's lists is unread, so `kernelUnit` leaves a Confused monster to its script as before.
 */

import type { BattleRng } from '../../common/streams.ts';
import type { AbilityDef, CombatantId, Command } from '../../common/types.ts';
import type { AbilityRegistry, ItemRegistry, DressphereRegistry, Ffx2Unit } from '../internal.ts';
import { confusionPick, type Ffx2PickWorld } from '../kernel/confusion-pick.ts';
import { isItemId } from '../kernel/item-rows.ts';
import { TARGET_SLOTS, type Ffx2TargetSlot } from '../kernel/target-pick.ts';
import { abilityOfGameId } from './game-ids.ts';
import { confusionLists } from './menu.ts';
import { statusWord1 } from './words.ts';

/** The command rows that are a dressphere's plain Attack (one per dressphere family: the engine resolves them all as `attack`). */
const ATTACK_ROWS: ReadonlySet<number> = new Set([0x302c, 0x302d, 0x302e, 0x302f, 0x3030, 0x3031, 0x312f]);

/** The lists the menu kernel made for a girl, kept while her dressphere and what she has learned stay as they were (building them walks all 554 rows twice, and a Confused girl who finds nothing to pick asks every step). */
const listCache = new WeakMap<Ffx2Unit, { key: string; lists: { main: number[]; shortcut: number[] } | null }>();

function listsOf(actor: Ffx2Unit, ladder: readonly string[]): { main: number[]; shortcut: number[] } | null {
  const learned = Object.entries(actor.dresspheres?.abilitiesLearned ?? {}).map(([k, v]) => `${k}:${v.learned.length}`).join(',');
  const key = `${actor.dresspheres?.current ?? ''}|${learned}|${actor.level}|${ladder.length}`;
  const hit = listCache.get(actor);
  if (hit !== undefined && hit.key === key) return hit.lists;
  const lists = confusionLists(actor, ladder);
  listCache.set(actor, { key, lists });
  return lists;
}

/** What the pick needs of the engine. */
export interface ConfusionEnv {
  readonly units: readonly Ffx2Unit[];
  readonly abilities: AbilityRegistry;
  readonly dresspheres: DressphereRegistry;
  readonly items?: ItemRegistry;
  /** Live counts by item id. */
  readonly inventory?: Readonly<Record<string, number>>;
  readonly rng: BattleRng;
}

/** The party stock as the game's table: item ids (`0x2000 + n`) in the build's order, with the item of ours behind each. */
function stockOf(env: ConfusionEnv): { ids: number[]; items: string[] } {
  const ids: number[] = [];
  const items: string[] = [];
  for (const [itemId, count] of Object.entries(env.inventory ?? {})) {
    if (count <= 0) continue;
    const item = env.items?.get(itemId);
    if (item === undefined || !item.usableInBattle) continue;
    const effect: AbilityDef | undefined = typeof item.effect === 'string' ? env.abilities.get(item.effect) : item.effect;
    const game = effect?.ffx2Record?.id;
    if (game === undefined || !isItemId(game) || ids.length >= 0x44) continue;
    ids.push(game);
    items.push(itemId);
  }
  return { ids, items };
}

/** The 31 slots as `Chr` fields: the party first, the enemies from slot 15 (`atb-engine.ts#assignSlots`). */
function slotsOf(units: readonly Ffx2Unit[]): Ffx2TargetSlot[] {
  const out: Ffx2TargetSlot[] = Array.from({ length: TARGET_SLOTS }, () => ({ loaded: false, inBattle: false, out: false, dead: false, hidden: 0, selectable: 0, status1: 0 }));
  for (const u of units) {
    const s = u.gauge.slot;
    if (s < 0 || s >= TARGET_SLOTS) continue;
    out[s] = {
      loaded: true,
      inBattle: !u.removed,
      out: false,
      dead: !u.alive,
      hidden: u.flags['hidden'] === true ? 1 : 0,
      selectable: u.flags['untargetable'] === true ? 0 : 1,
      status1: statusWord1(u),
    };
  }
  return out;
}

/** The kernel's draw: the raw 31-bit value of one draw of the stream the kernel names. */
function rawDraw(rng: BattleRng): (stream: number) => number {
  return (stream) => rng.on(stream).int(0, 0x7fffffff);
}

/** The ids of the units in the slots of `mask`, in ascending slot order. */
function idsOfMask(units: readonly Ffx2Unit[], mask: number): CombatantId[] {
  const out: CombatantId[] = [];
  for (let s = 0; s < TARGET_SLOTS; s++) {
    if ((mask & (1 << s)) === 0) continue;
    const unit = units.find((u) => u.gauge.slot === s);
    if (unit !== undefined) out.push(unit.id);
  }
  return out;
}

/** What the Confusion pick produced for one girl this step. */
export interface ConfusedTurn {
  /** The command to resolve as her; `kind: 'defend'` is a move of the game's that our data cannot run (the turn passes). */
  readonly command: Command;
  readonly candidates: number;
  readonly gameCommand: number;
}

/**
 * The Confusion pick for `actor` (exe 0x00649350), or null when it queues nothing (no candidate, or nobody to aim at: the game's pick returns 0, her state goes
 * back to IDLE and it asks again on the next logic step) or the kernel does not apply (not one of the three girls). It draws as the game does.
 */
export function confusedTurn(actor: Ffx2Unit, env: ConfusionEnv): ConfusedTurn | null {
  const sphere = env.dresspheres.get(actor.dresspheres?.current ?? '');
  const lists = listsOf(actor, sphere?.abilityIds ?? []);
  if (lists === null) return null;
  const stock = stockOf(env);
  const world: Ffx2PickWorld = {
    chr: actor.gauge.slot,
    main: lists.main,
    shortcut: lists.shortcut,
    stock: stock.ids,
    blocked: () => false,
    slots: slotsOf(env.units),
  };
  const r = confusionPick(world, rawDraw(env.rng));
  if (r.mask === 0 || r.command === 0xff) return null;
  const targets = idsOfMask(env.units, r.mask);
  if ((r.command >> 12) === 2) {
    const at = stock.ids.indexOf(r.command);
    const item = stock.items[at];
    if (item === undefined) return null;
    return { command: { kind: 'item', id: item, targets, exactTargets: true }, candidates: r.candidates.length, gameCommand: r.command };
  }
  const ability = abilityOfGameId(r.command);
  if (ATTACK_ROWS.has(r.command)) return { command: { kind: 'attack', targets }, candidates: r.candidates.length, gameCommand: r.command };
  if (ability === undefined || env.abilities.get(ability) === undefined) {
    return { command: { kind: 'defend', targets: [] }, candidates: r.candidates.length, gameCommand: r.command };
  }
  // the game queues the mask the dispatcher made; a multi-target row is aimed at exactly that mask, whatever side our row's own targeting would take
  return { command: { kind: 'ability', id: ability, targets, exactTargets: true }, candidates: r.candidates.length, gameCommand: r.command };
}
