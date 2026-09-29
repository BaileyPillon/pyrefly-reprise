/**
 * What the two Sin tactics share (`./sin-fins-core.ts`, Chapter XVII; `./sin-face.ts`, Chapter XVIII):
 * reading the published flags, the party-care ladder, the reach swing, and the CTB race that decides
 * whether a Pull back can still dodge a charged Gravija.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3]: CTB, Cid's Trigger Command, the
 * airship range, aeons, Armor and Mental Break. Nothing here reaches an FFX-2 board (`./lookup.ts` keys the
 * tactics by game first).
 *
 * Pure: reads `engine.state()` and the offered rows, never writes. The one engine call beyond `state()` is
 * `predictTurnOrder`, which the guide's read-only engine does not have, so it is guarded (`cidActsFirst`).
 *
 * **Every threshold below is AUTHORED, not measured** (package B benches the line; plan §5). None of them is
 * a boss number: they only decide when the player-side line heals.
 */

import type { AnyCombatant, AvailableCommand, BattleEngine, Command, CombatantId, FFXBattleEngine } from '../../battle/common/types.ts';
import { AIRSHIP_ORDER, AIRSHIP_RANGE } from '../../battle/ffx/ai/evrae-rules.ts';
import { aim, has, hpFraction, row } from './common.ts';

/** §4 [verified: 4 sources]: Tidus and Rikku give Cid his orders, as at Evrae. */
export const SIN_ORDER_OWNERS: readonly CombatantId[] = ['tidus', 'rikku'];

/**
 * AUTHORED: heal when the weakest living active is below this. A Fin's Gravija leaves a quarter of current
 * HP (§3.1, 75 % of current, cannot kill), and Smack or Ram on a party at a quarter is the loss Gestahl warns
 * about ("If you don't heal after a Gravija, this will be Game Over for you", §3.1).
 */
export const SIN_HEAL_AT = 0.45;

/** AUTHORED: heal the party when two living actives are under this (Gravija and Thrashing hit everyone). */
export const SIN_HEAL_PARTY_AT = 0.6;

/** The party heals the preset carries, best first (Yuna's White Magic, then the bag; §7.3 item 5). */
const PARTY_HEALS = ['Curaga', 'Pray', 'Al Bhed Potion'] as const;
const SINGLE_HEALS = ['Cura', 'X-Potion', 'Hi-Potion'] as const;

/** Cures by status, best first (§7.3 item 5: Softs for Petrify, Holy Water for Zombie, Esuna or Remedy for the rest). */
const CURES: ReadonlyArray<readonly [status: string, labels: readonly string[]]> = [
  ['petrify', ['Soft', 'Esuna', 'Remedy']],
  ['zombie', ['Holy Water', 'Remedy']],
  ['confuse', ['Esuna', 'Remedy']],
];

/** The published airship range, `null` outside a battle that declares one. */
export function rangeOf(engine: BattleEngine): 'near' | 'far' | null {
  const v = engine.state().flags[AIRSHIP_RANGE];
  return v === 'near' || v === 'far' ? v : null;
}

/** An order is already waiting on Cid's next turn (last order wins, §4). */
export function orderQueued(engine: BattleEngine): boolean {
  const v = engine.state().flags[AIRSHIP_ORDER];
  return v === 'near' || v === 'far';
}

export function flagTrue(engine: BattleEngine, key: string): boolean {
  return engine.state().flags[key] === true;
}

export function flagNumber(engine: BattleEngine, key: string): number | null {
  const v = engine.state().flags[key];
  return typeof v === 'number' ? v : null;
}

/** A standing enemy by id (on the enemy side, alive, not removed). */
export function foe(engine: BattleEngine, id: CombatantId): AnyCombatant | undefined {
  const c = engine.state().combatants[id];
  return c && c.side === 'enemy' && c.alive && !c.removed ? c : undefined;
}

/** A Trigger Command row, found by the command it submits rather than its label. */
export function orderRow(commands: AvailableCommand[], id: 'pull-back' | 'close-in'): AvailableCommand | undefined {
  return commands.find((c) => c.enabled && c.command.kind === 'trigger' && c.command.id === id);
}

/**
 * Revive is `common.ts#revive`; this is the rest of the care ladder, in order: a status that takes the member
 * out of the fight (Petrify, Zombie, Confuse), then a party heal when the party is worn, then a single heal on a
 * member in danger. `null` when nobody needs anything.
 */
export function sinCare(commands: AvailableCommand[], living: AnyCombatant[]): Command | null {
  for (const [status, labels] of CURES) {
    const sick = living.find((c) => has(c, status));
    if (!sick) continue;
    const r = row(commands, labels, sick.id);
    if (r) return aim(r, sick.id);
  }
  const worn = living.filter((c) => hpFraction(c) < SIN_HEAL_PARTY_AT).length >= 2;
  const weakest = [...living].sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (worn) {
    const r = row(commands, PARTY_HEALS);
    if (r) return aim(r, weakest?.id);
  }
  if (weakest && hpFraction(weakest) < SIN_HEAL_AT) {
    const r = row(commands, [...PARTY_HEALS, ...SINGLE_HEALS], weakest.id);
    if (r) return aim(r, weakest.id);
  }
  return null;
}

/** Lulu's strongest Blk Magic, `-aga` first (the Fins, the Core and Overdrive Sin have no weakness, §2.2). */
const SPELLS = ['Thundaga', 'Blizzaga', 'Firaga', 'Waterga', 'Thundara', 'Blizzara', 'Fira', 'Watera'] as const;

/**
 * Hit `targetId` with whatever this actor has that reaches it: an Overdrive when it is ready, else Lulu's
 * spell, else an Attack, else Lancet (§4: at FAR only Wakka, magic and long-range rows reach; the engine has
 * already disabled the rest). `null` when nothing of this actor's reaches.
 */
export function swingAt(commands: AvailableCommand[], targetId: CombatantId, opts: { magic?: boolean } = {}): Command | null {
  const od = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.validTargets.includes(targetId));
  if (od) return aim(od, targetId);
  if (opts.magic !== false) {
    const spell = row(commands, SPELLS, targetId);
    if (spell) return aim(spell, targetId);
  }
  const attack = commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(targetId));
  if (attack) return aim(attack, targetId);
  const lancet = row(commands, ['Lancet'], targetId);
  return lancet ? aim(lancet, targetId) : null;
}

/**
 * The dodge is a race between two CTB counters (§5.1.2): a Pull back given now only lands if Cid acts before
 * the Fin does. `true` when the forecast (with this order applied to the current actor) puts Cid ahead of the
 * Fin; `true` as well when there is no forecast to read (the guide's read-only engine), so the card still
 * names the order the chapter teaches.
 */
export function cidActsFirst(engine: BattleEngine, finId: CombatantId, pull: Command): boolean {
  let order: ReadonlyArray<{ actorId: CombatantId; index: number }>;
  const ctb = engine as Partial<Pick<FFXBattleEngine, 'predictTurnOrder'>>;
  try {
    if (typeof ctb.predictTurnOrder !== 'function') return true;
    order = ctb.predictTurnOrder.call(engine, 12, pull);
  } catch {
    return true;
  }
  const next = order.filter((t) => t.index > 0);
  const cid = next.findIndex((t) => t.actorId === 'cid');
  const fin = next.findIndex((t) => t.actorId === finId);
  if (cid < 0) return false;
  return fin < 0 || cid < fin;
}
