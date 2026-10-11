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
 * written as a tactic. On the shipped party Kimahri arrives **without** Doom
 * (`CAVERN_DOOM_PREP = 'not-learned'`, P-1, Bailey 2026-09-26), so step 4
 * never fires and the line is the race.
 *
 * 1. **Yuna summons an aeon when his gauge reads 96 or more**, before anything
 *    else she could do: strategy 3 [§3.3, §5.3]. Zanmato fires on his turn once
 *    the gauge is at 100 [re-ffx-ai-evrae-yojimbo-isaaru-sin §3.2], an aeon on
 *    the field is the only front line it can hit, and the aeon takes every
 *    ordinary attack he makes until then (a Bahamut lasts about five of his
 *    turns), so it is called as late as the gauge allows. His own turn adds 2
 *    and one of Lulu's casts adds 3 [§4.1], so 96 is a cast and a turn, or two
 *    of his turns, from full. **Re-parity W5 (2026-10-10, Bailey's pick "Keep
 *    1:1, rework our line")**: the line used to summon at 80 and rely on Yuna
 *    acting again at once, which the old engine allowed; the game charges her
 *    the recovery of her Summon [re-ffx-overdrive-steal-aeons §4.7, row A3], so
 *    an aeon called at 80 had ten of his turns still to stand through before
 *    Zanmato, fell in about five, and Yuna, still in her recovery, could not
 *    call the next one in time. Measured on the same tree, 500 seeds (1 to 500,
 *    then the holdout 501 to 1000): 80 wins 307 and 304, 96 wins 495 and 491;
 *    the 94 to 98 neighbours win 470 to 491, 92 wins 427 and 411, 90 wins 352
 *    and 366; calling it after the heal instead of first wins 441 and 442.
 *    96 is the best rung of the ladder in both ranges, on a plateau and not a
 *    cliff. `docs/handoff/re-parity-w5.md` has the whole ladder.
 * 2. **Revive** a downed member (`./common.ts#revive`).
 * 3. **Yuna heals** the lowest member under 45 % (Curaga when two are that
 *    low, Cura for one). A heal names no enemy, so it adds nothing to his
 *    gauge [§4.1].
 * 4. **Kimahri Dooms him** while Doom is not on him, **only if Doom is a row
 *    on his menu**: strategy 1, count 5 [§2.1, §2.3, §5.3, verified: 4
 *    sources]. The tactic reads the rows the engine offers, so with no Doom it
 *    can never suggest one.
 * 5. **Lulu casts Fira**: strategy 4, Magic Defense 0 against Defense 80
 *    [§2.1, §3.3]. One cast is one targeting, +3 [§4.1].
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
/**
 * Summon in front of Zanmato at or above this gauge. He fires it on a turn that starts at 100, his turn adds 2 and a cast of Lulu's
 * adds 3, so 96 is a turn and a cast (or two turns) from full. It was 80, research §4.1's "heightened" band, which is the band of
 * his odds and not the clock of Zanmato.
 */
const SUMMON_AT_GAUGE = 96;
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

  // 1. An aeon in front of Zanmato, the turn the gauge says it is due: before the revive and the heal, because the window is
  //    one Yuna turn wide and a heal spent in it leaves the party standing in front of Zanmato.
  if (actorId === 'yuna' && gauge >= SUMMON_AT_GAUGE) {
    for (const label of AEON_LABELS) {
      const summon = commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === label);
      if (summon) return aim(summon);
    }
  }

  // 2. Revive.
  const back = revive(commands, party);
  if (back) return back;

  // 3. Yuna keeps the party up.
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

  // 4. Kimahri's Doom.
  if (actorId === 'kimahri' && !has(boss, 'doom')) {
    const doom = row(commands, ['Doom'], YOJIMBO_CAVERN_BOSS_ID);
    if (doom && doom.command.kind === 'overdrive') return aim(doom, YOJIMBO_CAVERN_BOSS_ID);
  }

  // 5. Lulu's magic.
  if (actorId === 'lulu') {
    const spell = row(commands, SPELL_LABELS, YOJIMBO_CAVERN_BOSS_ID);
    if (spell) return aim(spell, YOJIMBO_CAVERN_BOSS_ID);
  }

  // 7. Nothing that names him.
  return defend(commands);
};

export default yojimboCavern;
