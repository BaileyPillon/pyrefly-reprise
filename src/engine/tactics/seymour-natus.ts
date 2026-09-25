/**
 * Chapter X — Seymour Natus and Mortibody, on the Highbridge of Bevelle: the
 * research's strategy 7 on top of the planned line
 * [research/ffx-seymour-natus-highbridge.md §6.3; docs/plans/chapter-natus-review.md §9;
 * docs/plans/natus-bench.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. CTB, aeons, Banish, Trigger
 * Commands and the FFX status set (research §0.3: FFX-2 has no Natus, no
 * Mortibody and no Highbridge boss). Registered under the FFX game in
 * `./lookup.ts`, so an FFX-2 board never reaches it.
 *
 * ## The line, and where each rule comes from
 *
 * The plan's "brute force with the aeon burst" (strategies 3 and 4 of §6.3)
 * plus the research's strategy 7, **"Haste only two party members (three
 * triggers Desperado)"** (§6.3 row 7, [verified: 3 sources: wiki, GameFAQs,
 * Jegged]). The research does not name the two; this line Hastes **Tidus and
 * Auron**, the two swords that Talk makes stronger (§6.2). Bailey picked it on
 * 2026-09-25 ("All your recommendations"): measured 169/200 against the
 * no-Haste line's 116/200, and it never calls Desperado
 * (`tests/unit/chapters/natus-shipped-bench.test.ts`).
 *
 * 1. **An aeon on the field spends its one turn** [§4.3, verified: 4 sources:
 *    Natus Banishes it on his next turn]: its Overdrive on Natus when the
 *    gauge is full (Bahamut arrives full, B3 = b), else an attack on Natus.
 * 2. **Yuna sends the aeons one at a time**, Bahamut first (strategy 3,
 *    [verified: 3 sources]): each gets one turn before Banish.
 * 3. **A petrified member gets a Soft at once** (strategy 4 and §5: Break then
 *    the Claw shatters at 90 % [decompiled]).
 * 4. **Revive** a downed member (Life from Yuna, else a Phoenix Down).
 * 5. **Heal** the lowest member under 45 % (Cura from Yuna, else a Hi-Potion).
 * 6. **Talk** for Tidus, Auron and Yuna: +10 Strength into Defense 0 nearly
 *    triples a hit (§3.3 [derived], §6.2 [verified: 4 sources]).
 * 7. **Kimahri hands his turn to Auron** (the second Talk and the second
 *    sword; Auron starts on the bench under B2 = a).
 * 8. **Yuna Shells the three** (strategy 4: Shell halves every spell column,
 *    §3.3), then Curas anyone under 70 %, else defends.
 * 9. **Tidus Hastes Tidus and Auron, never a third** (strategy 7): on a turn
 *    he would swing, while fewer than two active members have Haste, he casts
 *    Haste on the first of Tidus and Auron without it.
 * 10. **Everyone else hits Natus.** Defense 0 behind 36,000 HP (§1.1): the
 *    wall is the HP pool.
 *
 * **Never a third Haste** (§4.3 [verified: 3 sources]: Haste on all three
 * active members calls Desperado). The Haste rule stops at two Hasted active
 * members, whoever they are.
 *
 * The tactic only picks among the rows the engine offers and always returns a
 * command while Natus is on the field, so `intendedStrategy`'s "swing" default
 * never spends an Overdrive on Mortibody for it.
 */

import type { AvailableCommand, Command, CombatantId, FFXCombatant } from '../../battle/common/types.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';

/** Seymour Natus's combatant id, mirrored from `src/battle/ffx/ai/seymour-natus-rules.ts` (`NATUS_ID`). */
export const SEYMOUR_NATUS_ID = 'seymour-natus';
/** Mortibody's id: listed with Natus so the tactic and the guide claim the same two ids. */
export const MORTIBODY_ID = 'mortibody';
export const SEYMOUR_NATUS_BOSS_IDS: readonly CombatantId[] = [SEYMOUR_NATUS_ID, MORTIBODY_ID];

/** Heal under this fraction of max HP (the bench's intended line). */
const HEAL_UNDER = 0.45;
/** Yuna's top-up Cura, once the three are Shelled (the bench's intended line). */
const TOP_UP_UNDER = 0.7;
/** The order Yuna sends the aeons: Bahamut's full gauge first (B3 = b), then the rest (the bench's relay). */
const RELAY = ['bahamut', 'valefor', 'ifrit', 'ixion', 'shiva'] as const;

/** The first enabled row of `kind` (and `id`, when given) that can aim at `target`, when given. */
function offered(commands: AvailableCommand[], kind: Command['kind'], id?: string, target?: CombatantId): AvailableCommand | undefined {
  return commands.find(
    (c) =>
      c.enabled &&
      c.command.kind === kind &&
      (id === undefined || ('id' in c.command && c.command.id === id)) &&
      (target === undefined || c.validTargets.includes(target)),
  );
}

function use(kind: 'ability' | 'item', id: string, target: CombatantId): Command {
  return { kind, id, targets: [target] } as Command;
}

function defend(commands: AvailableCommand[]): Command {
  const r = offered(commands, 'defend');
  return r ? ({ ...r.command, targets: [] } as Command) : ({ kind: 'defend', targets: [] } as Command);
}

/** Attack Natus, or defend when the row is not there. */
function hitNatus(commands: AvailableCommand[]): Command {
  return offered(commands, 'attack', undefined, SEYMOUR_NATUS_ID)
    ? ({ kind: 'attack', targets: [SEYMOUR_NATUS_ID] } as Command)
    : defend(commands);
}

/** Yuna's next aeon: the first in the relay not yet sent this battle (a Banished aeon is spent). */
function nextSummon(commands: AvailableCommand[], sent: ReadonlySet<string>): Command | null {
  for (const id of RELAY) {
    if (sent.has(id)) continue;
    const r = offered(commands, 'summon', id);
    if (r) return { ...r.command, targets: [] } as Command;
  }
  return null;
}

/** Who strategy 7 Hastes: the two swords Talk makes stronger (§6.2); the research says only "two". */
const HASTE_TWO = ['tidus', 'auron'] as const;

/**
 * Strategy 7 [§6.3 row 7]: Haste on the first of Tidus and Auron without it, while fewer than two
 * active members are Hasted (a third calls Desperado, §4.3). Null when there is nothing to Haste.
 */
function hasteTwo(commands: AvailableCommand[], active: FFXCombatant[]): Command | null {
  const members = active.filter((m) => m !== undefined && !m.removed);
  if (members.filter((m) => m.statuses.haste !== undefined).length >= 2) return null;
  const bare = members.find((m) => (HASTE_TWO as readonly string[]).includes(m.id) && m.hp > 0 && m.statuses.haste === undefined);
  return bare && offered(commands, 'ability', 'haste', bare.id) ? use('ability', 'haste', bare.id) : null;
}

export const seymourNatus: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const natus = state.combatants[SEYMOUR_NATUS_ID] as FFXCombatant | undefined;
  if (!natus || natus.side !== 'enemy' || !natus.alive) return null;

  // 1. The aeon's one turn.
  if (state.aeonId === actorId) {
    const od = offered(commands, 'overdrive');
    if (od) return { ...od.command, targets: od.validTargets.includes(SEYMOUR_NATUS_ID) ? [SEYMOUR_NATUS_ID] : [] } as Command;
    return hitNatus(commands);
  }

  // 2. The relay.
  if (actorId === 'yuna') {
    const sent = new Set<string>();
    for (const e of state.log) if (e.type === 'summon') sent.add((e as { aeonId: string }).aeonId);
    const summon = nextSummon(commands, sent);
    if (summon) return summon;
  }

  const party = activeParty(engine).filter((c) => !(c as FFXCombatant).removed);

  // 3. Soft the stone before the Claw finds it.
  const stone = party.find((c) => has(c, 'petrify'));
  if (stone && offered(commands, 'item', 'soft', stone.id)) return use('item', 'soft', stone.id);

  // 4. Revive.
  const down = party.find((c) => c.hp <= 0 && !has(c, 'petrify'));
  if (down) {
    if (actorId === 'yuna' && offered(commands, 'ability', 'life', down.id)) return use('ability', 'life', down.id);
    if (offered(commands, 'item', 'phoenix-down', down.id)) return use('item', 'phoenix-down', down.id);
  }

  // 5. Heal the lowest under 45 %.
  const low = party
    .filter((c) => c.hp > 0 && hpFraction(c) < HEAL_UNDER)
    .sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (low) {
    if (actorId === 'yuna' && offered(commands, 'ability', 'cura', low.id)) return use('ability', 'cura', low.id);
    if (offered(commands, 'item', 'hi-potion', low.id)) return use('item', 'hi-potion', low.id);
  }

  // 6. Talk.
  const talk = offered(commands, 'trigger', 'talk');
  if (talk) return talk.command;

  // 7. Kimahri makes way for Auron.
  if (actorId === 'kimahri') {
    const swap = commands.find(
      (c) => c.enabled && c.command.kind === 'switch' && (c.command.extra as { inId?: string } | undefined)?.inId === 'auron',
    );
    return swap ? swap.command : hitNatus(commands);
  }

  // 8. Yuna: Shell, then top up, then wait.
  if (actorId === 'yuna') {
    const bare = party.find((c) => c.hp > 0 && !has(c, 'shell') && !has(c, 'petrify'));
    if (bare && offered(commands, 'ability', 'shell', bare.id)) return use('ability', 'shell', bare.id);
    const hurt = party.filter((c) => c.hp > 0 && hpFraction(c) < TOP_UP_UNDER).sort((a, b) => a.hp - b.hp)[0];
    if (hurt && offered(commands, 'ability', 'cura', hurt.id)) return use('ability', 'cura', hurt.id);
    return defend(commands);
  }

  // 9. Strategy 7: Tidus Hastes Tidus and Auron, never a third.
  if (actorId === 'tidus' && offered(commands, 'attack', undefined, SEYMOUR_NATUS_ID)) {
    const haste = hasteTwo(commands, state.activeIds.map((id) => state.combatants[id] as FFXCombatant));
    if (haste) return haste;
  }

  // 10. Swing at Natus.
  return hitNatus(commands);
};

export default seymourNatus;
