/**
 * **Grand Summon and a knocked-out aeon** (re-parity RC11, lane "FFX Chapter III roster"; **FFX only**; handoff `docs/handoff/re-parity-rc11-ffx-ch3-roster.md`).
 *
 * ## What the game does
 *
 * Grand Summon (command 0x3118, Yuna's Overdrive) opens the same list 5 as Summon (list builder 0x00785410, case 5). Each entry is resolved by the row resolver (0x0089ACA0); for an aeon (class 0) the
 * disabled test 0x0079A5B0 calls 0x0079A080: HP above 0, the availability byte (+0xDD4) set, the left-the-battle byte (+0xDCD) clear and +0x6D8 clear. A knocked-out or recovering aeon fails it, the
 * resolver answers -1, the draw loop draws the entry greyed (it skips only -4) and a confirm on it is refused with cue 3 (`FFX-G11` sections 4 and 9, the Summon-list answer of
 * `docs/handoff/re-parity-rc11-ffx-menu-parity.md` section 2). The player cannot call a knocked-out aeon with Grand Summon.
 *
 * ## What the engine did (proved on the tip before this lane, `docs/handoff/re-parity-rc11-ffx-ch3-roster.md` section 3)
 *
 * The picker (`pickerParams.ts#grandSummonEntries`) lists every aeon of the roster as pickable, a knocked-out one included, and `execute.ts` spends Yuna's gauge and calls `summonAeon`, which answers
 * `undefined` for an aeon with a recovery count: the pick costs the gauge and the turn and summons nothing.
 *
 * ## What this module does
 *
 * One switch, {@link GRAND_SUMMON_KO_REFUSED}, **on** (Bailey, 2026-10-18, "I'll go with all of your recommendations"; release 55). While it is on, `engine.ts#submit` refuses (0 events, the turn kept open) a Grand Summon that **names** an aeon the game's list would draw greyed, and the
 * picker draws that entry greyed (`enabled: false`), so the rule and the drawing come together. A bare Grand Summon (`aeonId: ''`, the roll a headless run makes when no aeon can come) is not refused, so no
 * strategy can loop on a refusal; no player reaches it through the picker, every entry of which is then greyed. The script lock (`formation-commands.ts`) and the mirror lock keep their own refusals.
 *
 * Layering: pure, deterministic, no DOM [AGENTS.md hard rule 1].
 */

import type { Command } from '../common/types.ts';
import type { Ctx } from './state.ts';
import { aeonSummonable } from './adapt/aeon-party.ts';
import { SISTER_IDS } from './adapt/sisters.ts';

/** The one switch, **on** as shipped (r55 RE). `{ on: false }` and no Grand Summon is refused for the aeon's state: every battle plays exactly as it did before this lane. */
export const GRAND_SUMMON_KO_REFUSED: { on: boolean } = { on: true };

/** Set the switch; the returned function puts it back as it was (the lock lane's pattern). */
export function setGrandSummonKoRefused(on: boolean): () => void {
  const before = GRAND_SUMMON_KO_REFUSED.on;
  GRAND_SUMMON_KO_REFUSED.on = on;
  return () => {
    GRAND_SUMMON_KO_REFUSED.on = before;
  };
}

/**
 * Does the game's class-0 test (0x0079A080) refuse this aeon for what has happened to it: HP 0, a recovery count, or Eject? The availability byte a script clears is not read here (it has its own lock).
 * The three Magus Sisters are one entry (Cindy stands for them) and come only when all three can. An unknown key is not refused here.
 */
export function aeonKnockedOut(ctx: Ctx, aeonKey: string): boolean {
  const aeon = ctx.rt.aeonRoster.get(aeonKey);
  if (aeon === undefined) return false;
  if (ctx.rt.sisters !== undefined && SISTER_IDS.includes(aeonKey)) {
    return SISTER_IDS.some((id) => {
      const sister = ctx.rt.aeonRoster.get(id);
      return sister === undefined || !aeonSummonable(sister);
    });
  }
  return !aeonSummonable(aeon);
}

/** `submit()`'s half of the rule: is this a Grand Summon that names an aeon the game's list would draw greyed (while the switch is on)? */
export function grandSummonKoRefused(ctx: Ctx, command: Command): boolean {
  if (!GRAND_SUMMON_KO_REFUSED.on) return false;
  if (command.kind !== 'overdrive' || command.extra?.kind !== 'yuna-grand-summon') return false;
  const named = command.extra.grandSummon.aeonId;
  return named !== '' && aeonKnockedOut(ctx, named);
}
