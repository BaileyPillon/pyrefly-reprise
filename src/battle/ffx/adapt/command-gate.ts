/**
 * The engine's commands as the command-gate kernels see them (re-parity RC7 lane L-CMD; **FFX only**).
 *
 * `kernel/command-gate.ts` reads four bytes of a command record and the words of a character. This module is the one place that
 * builds them from the engine's ability and combatant:
 *
 * - **The record**: the MP byte is the ability's `mpCost` (the repo's data matches the game's table for every ability with a command-table
 *   record but two: Entrust and the aeons' Nul-All, `docs/handoff/re-parity-rc7-cmd.md`); the category byte and the flag word are the
 *   game's own (`AbilityDef.record`). An ability with no game record (one of ours: the Evrae chapter's `close-in`, the Omnis volley
 *   wrapper) keeps the engine's old reading, the category: Black and White Magic are boosted and Silence-gated.
 * - **The Overdrive cost** is not in the repo's record: a command the engine submits as an Overdrive costs the whole bar, 100 for a party member
 *   and 20 for an aeon (all 154 records with an Overdrive cost say so, `research/re-ffx-command-gate.md` section 4). An enemy's gauge is its
 *   script's variable (`overdrive.ts#setGauge`), so an enemy has no Overdrive cost.
 * - **The character**: the gauge and its bar (an aeon's is 20 wide, `adapt/od-world.ts#unitOf`), the Curse bit of the extra status word,
 *   the Silence counter, the MP, auto-ability word A, and the buff flags (Spellspring).
 */

import type { AbilityDef, FFXCombatant } from '../../common/types.ts';
import { type GateChr, type GateRecord, SILENCE_GATED } from '../kernel/command-gate.ts';
import { holdsGrandSummon, unitOf } from './od-world.ts';
import { buffByte } from './status.ts';
import { autoWordA, counterOf, extraWord } from './words.ts';

/** The Overdrive cost byte of a party member's commands, and of an aeon's. */
const OD_COST_PARTY = 100;
const OD_COST_AEON = 20;

/** The Overdrive cost byte of a command the engine submits as an Overdrive for `user` (0 for anything else, and for an enemy). */
export function odCostOf(user: FFXCombatant, isOverdrive: boolean): number {
  if (!isOverdrive || user.side === 'enemy') return 0;
  return user.side === 'aeon' ? OD_COST_AEON : OD_COST_PARTY;
}

/** The record bytes the gate reads for an ability. */
export function gateRecordOf(def: AbilityDef, odCost = 0): GateRecord {
  const record = def.record;
  const magic = def.category === 'blackmagic' ? 1 : def.category === 'whitemagic' ? 2 : 0;
  return {
    mp: def.mpCost,
    type: record?.type ?? magic,
    flagsMisc: record?.flagsMisc ?? (magic !== 0 ? SILENCE_GATED : 0),
    odCost,
  };
}

/** The three character facts the MP cost reads (the menu asks for every row's cost, so this is the cheap half of {@link gateChrOf}). */
export function mpChrOf(user: FFXCombatant): Pick<GateChr, 'autoA' | 'zeroCost' | 'buffs'> {
  return { autoA: autoWordA(user), zeroCost: 0, buffs: buffByte(user) };
}

/** The character facts the gate reads. */
export function gateChrOf(user: FFXCombatant): GateChr {
  const unit = unitOf(user);
  const max = 100 / unit;
  const stored = user.overdrive ? Math.floor(Math.min(100, Math.max(0, user.overdrive.gauge)) / unit) : 0;
  return {
    gauge: holdsGrandSummon(user) ? max : stored,
    gaugeMax: max,
    extra: extraWord(user),
    silence: counterOf(user, 'silence'),
    mp: user.mp,
    autoA: autoWordA(user),
    zeroCost: 0,
    buffs: buffByte(user),
  };
}
