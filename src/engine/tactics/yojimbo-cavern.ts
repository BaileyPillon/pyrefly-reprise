/**
 * Chapter IX — Yojimbo, in the Cavern of the Stolen Fayth: the line the fight
 * was designed to be beaten with [research/ffx-yojimbo.md §5.3].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. CTB, aeons, an enemy Overdrive
 * gauge and Ronso Rage Doom (research §0.3). Registered under the FFX game in
 * `./lookup.ts`, so an FFX-2 board never reaches it.
 *
 * ## The line, and where each rule comes from
 *
 * It is the **intended** line of `tests/unit/chapters/yojimbo-bench.test.ts`,
 * which wins 200 of 200 seeds on the real engine and the Cavern build
 * (`docs/plans/chapter-yojimbo-review.md`, "Measured"), written as a tactic:
 *
 * 1. **Revive** a downed member (`./common.ts#revive`).
 * 2. **Yuna heals** the lowest member under 45 % (Curaga when two are that
 *    low, Cura for one). A heal names no enemy, so it adds nothing to his
 *    gauge [§4.1].
 * 3. **Kimahri Dooms him** while Doom is not on him: strategy 1, count 5
 *    [§2.1, §2.3, §5.3, verified: 4 sources]. Kimahri arrives with Doom and a
 *    full gauge (B8, D-056).
 * 4. **Lulu casts Fira**: strategy 4, Magic Defense 0 against Defense 80
 *    [§2.1, §3.3]. One cast is one targeting, +3 [§4.1].
 * 5. **Yuna summons an aeon** once his gauge reads 80 or more, so Zanmato hits
 *    the aeon, not the party: strategy 3 [§3.3, §5.3]. The 80 line is the
 *    research's own "heightened" band [§4.1, verified: 2 sources].
 * 6. **An aeon on the field defends**: it is there to stand in front of
 *    Zanmato, and an attack from it would feed the gauge.
 * 7. **Everyone else defends.** Every action aimed at him adds 3 to the gauge
 *    [§4.1], so a turn that does not need to name him does not.
 *
 * The tactic only picks among the rows the engine offers, and returns `null`
 * (the generic ladder) when Yojimbo is not on the field.
 */

import type { AvailableCommand, Command, FFXCombatant } from '../../battle/common/types.ts';
import { type Tactic, activeParty, aim, has, hpFraction, revive, row } from './common.ts';

/** Yojimbo's combatant id, mirrored from `src/data/ffx/enemies/yojimbo.ts` (`YOJIMBO_ID`). */
export const YOJIMBO_CAVERN_BOSS_ID = 'yojimbo';

/** Heal under this fraction of max HP (the bench's intended line). */
const HEAL_UNDER = 0.45;
/** Summon in front of Zanmato at or above this gauge: research §4.1's 80 % band. */
const SUMMON_AT_GAUGE = 80;
/** The order Yuna's aeons are tried in: the bench's order, the sturdiest first. */
const AEON_LABELS = ['Bahamut', 'Ifrit', 'Ixion', 'Shiva', 'Valefor'] as const;
/** Lulu's -ra spells, all DC 24 into Magic Defense 0 [§3.3]; Fira first, as the bench casts. */
const SPELL_LABELS = ['Fira', 'Blizzara', 'Thundara', 'Watera'] as const;

function defend(commands: AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === 'defend');
  return r ? aim(r) : null;
}

export const yojimboCavern: Tactic = (actorId, commands, engine) => {
  const state = engine.state();
  const boss = state.combatants[YOJIMBO_CAVERN_BOSS_ID] as FFXCombatant | undefined;
  if (!boss || boss.side !== 'enemy' || !boss.alive) return null;
  const gauge = boss.overdrive?.gauge ?? 0;

  // 6. An aeon is on the field to take Zanmato.
  if (state.aeonId === actorId) return defend(commands);

  const party = activeParty(engine);

  // 1. Revive.
  const back = revive(commands, party);
  if (back) return back;

  // 2. Yuna keeps the party up.
  if (actorId === 'yuna') {
    const low = party
      .filter((c) => c.alive && hpFraction(c) < HEAL_UNDER)
      .sort((a, b) => hpFraction(a) - hpFraction(b));
    const first = low[0];
    if (first) {
      const heal = low.length >= 2 ? row(commands, ['Curaga', 'Cura'], first.id) : row(commands, ['Cura', 'Curaga'], first.id);
      if (heal) return aim(heal, first.id);
    }
  }

  // 3. Kimahri's Doom.
  if (actorId === 'kimahri' && !has(boss, 'doom')) {
    const doom = row(commands, ['Doom'], YOJIMBO_CAVERN_BOSS_ID);
    if (doom && doom.command.kind === 'overdrive') return aim(doom, YOJIMBO_CAVERN_BOSS_ID);
  }

  // 4. Lulu's magic.
  if (actorId === 'lulu') {
    const spell = row(commands, SPELL_LABELS, YOJIMBO_CAVERN_BOSS_ID);
    if (spell) return aim(spell, YOJIMBO_CAVERN_BOSS_ID);
  }

  // 5. An aeon in front of Zanmato.
  if (actorId === 'yuna' && gauge >= SUMMON_AT_GAUGE) {
    for (const label of AEON_LABELS) {
      const summon = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === label);
      if (summon) return aim(summon);
    }
  }

  // 7. Nothing that names him.
  return defend(commands);
};

export default yojimboCavern;
