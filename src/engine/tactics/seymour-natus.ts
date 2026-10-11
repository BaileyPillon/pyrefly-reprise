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
 * no-Haste line's 116/200 (`tests/unit/chapters/natus-shipped-bench.test.ts`).
 *
 * **Re-parity notes (FFX only; `docs/handoff/re-parity-ai-seymour.md`, `docs/handoff/re-parity-chx-options.md`):**
 * (1) 2026-10-09: "it never calls Desperado" no longer holds. Mortibody's own script scores every Shell, Haste, Reflect and Nul on
 * the three active slots against `mod 4 + 4`, so Haste on two plus Shell on all three is a total of 5 and Desperado half the time
 * he checks; the line still beat the other two (D-185). (2) 2026-10-10: Natus's Flare takes the game's rank 3 (record 0x6079; our data
 * had 5), so he casts it about every 30 ticks, not every 50, and this line wins 302 of 500 seeds, not 386. **Nothing in the
 * shipped line changed**; the measured options for it are the other ids of `NATUS_LINE` (`src/data/guides/natus-line.ts`,
 * `./seymour-natus-lines.ts`). (3) 2026-10-10: Bailey picked `reflect` ("ill go with all your recommendations"; Bahamut alone, and Rikku Reflects
 * Natus), which is the registered line now; the rules below are the `shipped` line, kept as the baseline and as the other ids' starting point.
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
 * ## The options (`makeSeymourNatus`, `./seymour-natus-lines.ts`)
 *
 * Each knob below is off or at its shipped value in the `shipped` line, so that line is rules 1 to 10 exactly:
 * `healUnder` and `topUpUnder` (rules 5 and 8), `shellBeforeHeal` (Yuna's Shell ahead of her heal), `alBhedForStone` (rule 3 with the
 * party Al Bhed Potion), `partyOverdrives` (Tidus and Auron's own Overdrive on Natus), `detour` (rule 7 through Lulu's Bio and Rikku's
 * Reflect, `./seymour-natus-detours.ts`) and `mirror` (Provoke and Reflect, `./seymour-natus-mirror.ts`).
 *
 * The tactic only picks among the rows the engine offers and always returns a
 * command while Natus is on the field, so `intendedStrategy`'s "swing" default
 * never spends an Overdrive on Mortibody for it.
 */

import type { AvailableCommand, Command, CombatantId, FFXCombatant, BattleEngine } from '../../battle/common/types.ts';
import { NATUS_LINE, type NatusLineId } from '../../data/guides/natus-line.ts';
import { type Tactic, activeParty, has, hpFraction } from './common.ts';
import { detourStep } from './seymour-natus-detours.ts';
import { NATUS_LINES, type NatusLine } from './seymour-natus-lines.ts';
import { mirrorTactic } from './seymour-natus-mirror.ts';
import { MORTIBODY_ID, SEYMOUR_NATUS_ID, defend, hitNatus, offered, switchTo, use } from './seymour-natus-rows.ts';

export { MORTIBODY_ID, SEYMOUR_NATUS_ID };
export const SEYMOUR_NATUS_BOSS_IDS: readonly CombatantId[] = [SEYMOUR_NATUS_ID, MORTIBODY_ID];

/** Yuna puts Shell on a bare member ahead of a heal unless somebody is under this fraction (`shellBeforeHeal`). */
const SHELL_YIELDS_TO_UNDER = 0.25;
/** The order Yuna sends the aeons: Bahamut's full gauge first (B3 = b), then the rest (the bench's relay). */
const RELAY = ['bahamut', 'valefor', 'ifrit', 'ixion', 'shiva'] as const;

/** Yuna's next aeon: the first in the relay not yet sent this battle (a Banished aeon is spent). */
function nextSummon(commands: AvailableCommand[], sent: ReadonlySet<string>, relay: NatusLine['relay']): Command | null {
  for (const id of relay === 'bahamut' ? RELAY.slice(0, 1) : RELAY) {
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

/** The Al Bhed Potion: the whole party (the row aims at nobody in particular). */
function alBhedPotion(commands: AvailableCommand[]): Command | null {
  const r = offered(commands, 'item', 'al-bhed-potion');
  return r ? ({ ...r.command, targets: [] } as Command) : null;
}

/** Tidus's or Auron's own Overdrive, aimed at Natus, when one is offered. */
function overdriveOnNatus(commands: AvailableCommand[]): Command | null {
  const od = commands.find((r) => r.enabled && r.command.kind === 'overdrive' && r.validTargets.includes(SEYMOUR_NATUS_ID));
  return od ? ({ ...od.command, targets: [SEYMOUR_NATUS_ID] } as Command) : null;
}

/** The lowest active member under `line`, healed with Cura (Yuna) or a Hi-Potion. */
function healLowest(actorId: CombatantId, commands: AvailableCommand[], party: FFXCombatant[], under: number): Command | null {
  const low = party
    .filter((c) => c.hp > 0 && hpFraction(c) < under)
    .sort((a, b) => hpFraction(a) - hpFraction(b))[0];
  if (!low) return null;
  if (actorId === 'yuna' && offered(commands, 'ability', 'cura', low.id)) return use('ability', 'cura', low.id);
  if (offered(commands, 'item', 'hi-potion', low.id)) return use('item', 'hi-potion', low.id);
  return null;
}

/** Chapter X's tactic for a set of knobs (the benches pass their own; the game passes `NATUS_LINES[NATUS_LINE]`). */
export function makeNatusTactic(line: NatusLine): Tactic {
  return (actorId, commands, engine) => natusTurn(line, actorId, commands, engine);
}

/** Build Chapter X's tactic for one line (`NATUS_LINES[id]`). The registered tactic is `makeSeymourNatus(NATUS_LINE)`. */
export function makeSeymourNatus(id: NatusLineId): Tactic {
  return makeNatusTactic(NATUS_LINES[id]);
}

function natusTurn(line: NatusLine, actorId: CombatantId, commands: AvailableCommand[], engine: BattleEngine): Command | null {
  const state = engine.state();
  const natus = state.combatants[SEYMOUR_NATUS_ID] as FFXCombatant | undefined;
  if (!natus || natus.side !== 'enemy' || !natus.alive) return null;

  if (line.mirror) return mirrorTactic(actorId, commands, engine, natus);

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
    const summon = nextSummon(commands, sent, line.relay);
    if (summon) return summon;
  }

  const party = activeParty(engine).filter((c) => !(c as FFXCombatant).removed) as FFXCombatant[];

  // 3. Soft the stone before the Claw finds it (the party's Al Bhed Potion does the same and mends everyone, on the lines that use it).
  const stone = party.find((c) => has(c, 'petrify'));
  if (stone && line.alBhedForStone) {
    const potion = alBhedPotion(commands);
    if (potion) return potion;
  }
  if (stone && offered(commands, 'item', 'soft', stone.id)) return use('item', 'soft', stone.id);

  // 4. Revive.
  const down = party.find((c) => c.hp <= 0 && !has(c, 'petrify'));
  if (down) {
    if (actorId === 'yuna' && offered(commands, 'ability', 'life', down.id)) return use('ability', 'life', down.id);
    if (offered(commands, 'item', 'phoenix-down', down.id)) return use('item', 'phoenix-down', down.id);
  }

  // 5. Heal the lowest under the line's fraction; on a Shell-first line Yuna dresses a bare member before she heals.
  const bare = party.find((c) => c.hp > 0 && !has(c, 'shell') && !has(c, 'petrify'));
  if (line.shellBeforeHeal && actorId === 'yuna' && bare && offered(commands, 'ability', 'shell', bare.id)) {
    if (!party.some((c) => c.hp > 0 && hpFraction(c) < SHELL_YIELDS_TO_UNDER)) return use('ability', 'shell', bare.id);
  }
  const heal = healLowest(actorId, commands, party, line.healUnder);
  if (heal) return heal;

  // 6. Talk.
  const talk = offered(commands, 'trigger', 'talk');
  if (talk) return talk.command;

  // 7. Kimahri makes way for Auron (on the detour lines, through Lulu's Bio and Rikku's Reflect first).
  if (line.detour && (actorId === 'kimahri' || actorId === 'lulu' || actorId === 'rikku')) {
    const step = detourStep(actorId, commands, natus, line.detour);
    if (step) return step;
  }
  if (actorId === 'kimahri') {
    const swap = switchTo(commands, 'auron');
    return swap ?? hitNatus(commands);
  }

  // 8. Yuna: Shell, then top up, then wait.
  if (actorId === 'yuna') {
    if (bare && offered(commands, 'ability', 'shell', bare.id)) return use('ability', 'shell', bare.id);
    const hurt = party.filter((c) => c.hp > 0 && hpFraction(c) < line.topUpUnder).sort((a, b) => a.hp - b.hp)[0];
    if (hurt && offered(commands, 'ability', 'cura', hurt.id)) return use('ability', 'cura', hurt.id);
    return defend(commands);
  }

  // 9. Strategy 7: Tidus Hastes Tidus and Auron, never a third.
  if (actorId === 'tidus' && offered(commands, 'attack', undefined, SEYMOUR_NATUS_ID)) {
    const haste = hasteTwo(commands, state.activeIds.map((cid) => state.combatants[cid] as FFXCombatant));
    if (haste) return haste;
  }

  // 9b. A full Overdrive on Natus (the lines that spend them): Defense 0 takes every point.
  if (line.partyOverdrives && (actorId === 'tidus' || actorId === 'auron')) {
    const od = overdriveOnNatus(commands);
    if (od) return od;
  }

  // 10. Swing at Natus.
  return hitNatus(commands);
}

/** The registered tactic: the line `NATUS_LINE` names (`reflect`, Bailey's pick of 2026-10-10). */
export const seymourNatus: Tactic = makeSeymourNatus(NATUS_LINE);

export default seymourNatus;
