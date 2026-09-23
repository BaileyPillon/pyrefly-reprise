/**
 * Helpers for the Macalania tactic (`./seymour-anima-macalania.ts`): the
 * formation's ids, the element tables, and the per-act command pickers. Split
 * out for the 400-line house rule (AGENTS.md rule 7). **FFX only** [rule 14].
 */

import type { AvailableCommand, BattleEngine, Command, CombatantId } from '../../battle/common/types.ts';
import { aim, activeParty, has, hpFraction, row } from './common.ts';

/** The boss combatant id `tacticFor` keys this encounter on. */
export const SEYMOUR_MACALANIA_ID = 'seymour-macalania';

export const GUARDIAN_IDS = ['guado-guardian-a', 'guado-guardian-b'] as const;
export const ANIMA_ID = 'anima-macalania';

/** Mirrors `ai/macalania-rules.ts`; kept local so the tactic reads only state. */
export const ELEMENT_CYCLE = ['ice', 'lightning', 'water', 'fire'] as const;
export const NUL_FOR: Record<string, string> = {
  ice: 'NulFrost',
  lightning: 'NulShock',
  water: 'NulTide',
  fire: 'NulBlaze',
};
export const NUL_STATUS: Record<string, string> = {
  ice: 'nulfrost',
  lightning: 'nulshock',
  water: 'nultide',
  fire: 'nulblaze',
};

/**
 * A combatant's Overdrive gauge, 0-100.
 *
 * `AnyCombatant` is the read-only union the tactic layer sees and it does not
 * publish `overdrive`, so this reads it structurally — which is also the honest
 * shape for an **enemy** gauge: Anima's is a scripted third clock, not a mode
 * [ffx-seymour-anima-macalania §3.4].
 */
export function gaugeOfId(engine: BattleEngine, id: CombatantId): number {
  const c = engine.state().combatants[id] as { overdrive?: { gauge?: number } } | undefined;
  return c?.overdrive?.gauge ?? 0;
}

export function flagNum(engine: BattleEngine, key: string, fallback: number): number {
  const v = engine.state().flags[key];
  return typeof v === 'number' ? v : fallback;
}

/** Which act is running, read off the flag the encounter script publishes. */
export function act(engine: BattleEngine): 1 | 2 | 3 {
  const v = flagNum(engine, 'macalania.act', 1);
  return v === 3 ? 3 : v === 2 ? 2 : 1;
}

/** The element Seymour will use on his **next** turn [§5.2 — fixed, never varies]. */
export function nextElement(engine: BattleEngine): string {
  const step = flagNum(engine, 'macalania.elementStep', 0) % ELEMENT_CYCLE.length;
  return ELEMENT_CYCLE[step] as string;
}

export function livingGuardians(engine: BattleEngine): CombatantId[] {
  const s = engine.state();
  return GUARDIAN_IDS.filter((id) => s.combatants[id]?.alive === true && s.combatants[id]?.removed !== true);
}

/** A living Guardian that has not been successfully stolen from yet [§2.4]. */
export function unrobbedGuardian(engine: BattleEngine): CombatantId | undefined {
  const s = engine.state();
  return livingGuardians(engine).find((id) => s.flags[`macalania.hasPotions.${id}`] === true);
}

/**
 * The Nul row for `element`, aimed at an active member who does not hold it.
 *
 * **Our Nul spells are `single-ally`, not party-wide** — that is what
 * `src/data/ffx/abilities/whitemagic-protect.ts` ships, and it is the single
 * biggest reason the measured win rate is what it is: Seymour picks a *random*
 * party member, so one cast covers one third of the risk. Raising it is a
 * change to a file this track does not own; it is written up as an open
 * question in `docs/handoff/chapter-macalania-engine.md` rather than patched
 * around here.
 */
export function nulRow(commands: AvailableCommand[], engine: BattleEngine, element: string): Command | null {
  const label = NUL_FOR[element];
  const status = NUL_STATUS[element];
  if (!label || !status) return null;
  const uncovered = activeParty(engine).filter((c) => c.alive && !has(c, status));
  if (uncovered.length === 0) return null;
  // The lowest-HP uncovered member first: a ~715 hit is a bigger fraction of a
  // 850-HP Lulu than of a 1,900-HP Auron.
  const target = uncovered.sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (!target) return null;
  const r = row(commands, [label], target.id);
  return r ? aim(r, target.id) : null;
}

/** Shell on an uncovered active member — the act-three half the Nul cannot reach. */
export function shellRow(commands: AvailableCommand[], engine: BattleEngine): Command | null {
  const uncovered = activeParty(engine).filter((c) => c.alive && !has(c, 'shell'));
  const target = uncovered.sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (!target) return null;
  const r = row(commands, ['Shell'], target.id);
  return r ? aim(r, target.id) : null;
}

/**
 * The next aeon onto the field — as a **named Grand Summon** when Yuna's own
 * gauge is up [§7 row 15].
 *
 * Two rules, in this order:
 *
 * 1. **Grand Summon hands the aeon a full temporary gauge**, so it Overdrives
 *    on arrival instead of spending its short life filling one. That is worth
 *    most on **Shiva**, who starts this chapter at **0 % and cannot be carried
 *    in at anything else** (§8.6) — she was obtained minutes ago — and whose
 *    Diamond Dust is ~4,700, or ~7,000 landed into a Boost turn (§6.3). The
 *    engine's default minigame outcome names no aeon at all, so the choice has
 *    to be made here or the gauge is spent on nothing.
 * 2. Otherwise the **fullest gauge first**, so the aeon that can Overdrive
 *    soonest goes in soonest.
 *
 * Measured on seeds 1-8 before the Grand Summon branch: act two ended with
 * Anima on ~3,500-5,900 of 18,000 and the party out of aeons. The four aeons
 * were dealing ~11,000 between them and nothing was closing the last fifth.
 */
export function bestSummon(commands: AvailableCommand[], engine: BattleEngine): Command | null {
  const rows = commands.filter((c) => c.enabled && c.command.kind === 'summon');
  if (rows.length === 0) return null;
  const gaugeOf = (r: AvailableCommand): number => {
    const id = r.command.kind === 'summon' ? r.command.id : undefined;
    return id ? gaugeOfId(engine, id) : 0;
  };
  const grand = commands.find((c) => c.enabled && c.command.kind === 'overdrive' && c.label === 'Grand Summon');
  if (grand) {
    // The emptiest gauge gains the most from a temporary full one.
    const worst = [...rows].sort((a, b) => gaugeOf(a) - gaugeOf(b))[0];
    if (worst && worst.command.kind === 'summon') {
      return {
        ...grand.command,
        targets: [],
        extra: { kind: 'yuna-grand-summon', grandSummon: { aeonId: worst.command.id } },
      } as Command;
    }
  }
  const best = [...rows].sort((a, b) => gaugeOf(b) - gaugeOf(a))[0];
  return best ? aim(best) : null;
}

/**
 * The aeon's own turn — act two, and the only part of the fight Anima cannot
 * simply delete.
 *
 * Order: **Shield when Oblivion is close** (her gauge is the telegraph),
 * **Overdrive into a Boost turn** (×1.5, applied immediately before the cap),
 * then the aeon's special, then Attack.
 */
export function aeonLine(commands: AvailableCommand[], engine: BattleEngine, actorId: CombatantId): Command | null {
  const anima = engine.state().combatants[ANIMA_ID];
  const self = engine.state().combatants[actorId];
  const gauge = gaugeOfId(engine, ANIMA_ID);
  const boosted = anima !== undefined && has(anima, 'boost');
  // Anima in act two; Seymour's second bar in act three [§7 row 16 / C-5].
  const target = anima && anima.alive && !anima.removed ? ANIMA_ID : SEYMOUR_MACALANIA_ID;

  // §7 row 12 — Shield before Oblivion. An unshielded Oblivion wipes the party
  // outright at this story point; shielded, an aeon eats it for ~440 (§6.3).
  //
  // The threshold is high on purpose. **Shield zeroes the aeon's own gauge
  // gain** (`overdrive.ts#addGauge`), so a Shield cast early is a Shield cast
  // instead of the Overdrive it is delaying — measured at 80, Ixion spent two
  // of its four turns Shielded and never reached a gauge at all. Her gauge
  // moves +10 a turn and +5 a targeting, so 90 is one exchange of warning.
  if (gauge >= 90 && self && !has(self, 'shield')) {
    const shield = row(commands, ['Shield']);
    if (shield) return aim(shield);
  }

  // §7 row 14 — spend the Overdrive on a Boost turn, not off it.
  const overdrive = commands.find((c) => c.enabled && c.command.kind === 'overdrive');
  if (overdrive && (boosted || gauge >= 80)) return aim(overdrive, target);

  // Drop a Shield that is no longer paying for itself, so the gauge starts
  // filling again.
  if (gauge < 60 && self && has(self, 'shield')) {
    const drop = row(commands, ['Shield']);
    if (drop) return aim(drop);
  }

  const special = row(commands, ['Heavenly Strike', 'Energy Ray', 'Meteor Strike', 'Aerospark', 'Sonic Wings'], target);
  if (special) return aim(special, target);

  const attack = commands.find((c) => c.enabled && c.command.kind === 'attack');
  return attack ? aim(attack, target) : null;
}

