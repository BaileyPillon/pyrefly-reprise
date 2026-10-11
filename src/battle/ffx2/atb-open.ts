/**
 * How a battle's gauges open (re-parity W4; **FFX-2 only**): the kernels' `MsChrAtbInit`, the preemptive / ambush resets
 * and the opening trim (`kernel/atb-start.ts`, `research/re-ffx2-atb-status.md` section 4), laid on the engine's units.
 *
 * In the game, in this order: every character in play gets its random opening wait (`((draw & 63) + 32) * full / 128`, 25 to 74
 * percent of its own standard wait, one draw each, the party first); the preemptive / ambush result is decided (preset by the
 * encounter, or rolled from the two sides' average Agility); a result of 1 or 2 resets all 31 slots (one draw each); and the
 * smallest wait on the field is cut by two thirds off everyone. Measured on the running game on 2026-10-09: 13 of 13 opening
 * counters, 9 trims and one preemptive strike matched (`research/re-ffx2-timing-measured.md` section 4).
 *
 * What the engine adds: a CONTINUATION link of a chained fight (`condition: 'scripted'`) opens with every wait whole and no trim
 * ("zero", as it always did: the sources do not say what the game does there); `condition: 'preemptive'` and `'ambush'`
 * are the game's PRESET results.
 */

import type { BattleSetup } from '../common/types.ts';
import type { BattleRng } from '../common/streams.ts';
import { modDraw } from './adapt/draws.ts';
import type { Ffx2Unit } from './internal.ts';
import { ATB_BASE_VALUE } from './constants.ts';
import { assignSlots, partyCountsOf } from './atb-engine.ts';
import { baseRequired, refreshGauge } from './gauges.ts';
import { statByte } from './adapt/inputs.ts';
import { has } from './adapt/words.ts';
import { Ffx2AtbState } from './kernel/atb-gauge.ts';
import {
  applyFirstAttack,
  atbInit,
  averageAgi,
  firstAttackRoll,
  openingTrim,
  type Ffx2FirstAttackChr,
  type Ffx2TrimChr,
} from './kernel/atb-start.ts';

/** How the opening is decided (the engine's options and the group's flags). */
export interface OpeningOptions {
  /** `condition: 'scripted'` and not a separate battle: every wait whole, no trim. */
  continuation: boolean;
  /** Roll the preemptive / ambush result for a `'normal'` battle (`Ffx2EngineOptions.rollFirstAttack`). */
  rollFirstAttack: boolean;
}

const SLOTS = 31;

/** Open the gauges of every unit. Draws: one per unit, then the roll (two) if rolled, then 31 for a reset result. */
export function openBattleGauges(
  units: readonly Ffx2Unit[],
  condition: BattleSetup['condition'],
  options: OpeningOptions,
  rng: BattleRng,
): void {
  assignSlots(units);
  const ordered = [...units].sort((a, b) => a.gauge.slot - b.gauge.slot);
  const counts = partyCountsOf(units);

  // 1. MsChrAtbInit for everyone: the party's three, then every monster.
  for (const u of ordered) {
    const r = atbInit(
      {
        chrId: u.gauge.slot,
        agi: statByte(u.stats.agi),
        costAtb: ATB_BASE_VALUE,
        carry: 0,
        randomStart: !options.continuation,
        deadOrStone: !u.alive || has(u, 'petrify'),
        lead: false, // Initiative (`ABILITY_LEAD`) is an auto-ability the engine does not model
        isMonster: u.side === 'enemy',
        aided: false,
        thinkingBaseArg: 0,
        thinking: { baseBefore: 0, partyCount: counts.count, partyStanding: counts.standing },
      },
      modDraw(rng, 64), // `& 0x3f` of a draw of each unit's own purpose-0 stream, which the kernel names (its thinking time draws nothing: the base is 0 in play)
    );
    u.atb.recovery = r.start;
    u.gauge.recoveryMax = r.full;
    u.gauge.thinking = r.thinking;
    u.gauge.carry = r.carry;
    u.gauge.state = Ffx2AtbState.Idle;
    u.atb.required = baseRequired(u.stats.agi);
  }
  if (options.continuation) {
    for (const u of ordered) refreshGauge(u);
    return;
  }

  // 2. MsCalcFirstAttack: the result is preset by the encounter, or rolled (two draws from the first-strike stream).
  const preset = condition === 'preemptive' ? 1 : condition === 'ambush' ? 2 : 0;
  const rolled = preset !== 0 || options.rollFirstAttack;
  if (rolled) {
    const sides = ordered.filter((u) => !u.removed);
    const party = sides.filter((u) => u.side === 'party').map((u) => statByte(u.stats.agi));
    const monsters = sides.filter((u) => u.side === 'enemy').map((u) => statByte(u.stats.agi));
    const first = firstAttackRoll(
      { preset, firstStrikeCount: 0, partyAgi: averageAgi(party), monsterAgi: averageAgi(monsters) },
      modDraw(rng, 256), // `& 0xff`, twice, on the first-strike stream (1)
    );
    // 3. A preemptive strike or an ambush resets all 31 slots, one draw each, occupied or not.
    if (first.result === 1 || first.result === 2) {
      const bySlot = new Map(ordered.map((u) => [u.gauge.slot, u]));
      const chrs: Ffx2FirstAttackChr[] = Array.from({ length: SLOTS }, (_, id) => {
        const u = bySlot.get(id);
        return u === undefined
          ? { full: 0, lead: false, deadOrStone: false, recovery: 0 }
          : { full: u.gauge.recoveryMax, lead: false, deadOrStone: !u.alive || has(u, 'petrify'), recovery: u.atb.recovery };
      });
      const next = applyFirstAttack(first.result, chrs, modDraw(rng, 16)); // `& 0xf` of a draw of each slot's own stream
      for (const u of ordered) u.atb.recovery = next[u.gauge.slot] ?? u.atb.recovery;
    }
  }

  // 4. The opening trim: two thirds of the smallest wait come off everyone, so the first to act starts with a third of its wait.
  const bySlot = new Map(ordered.map((u) => [u.gauge.slot, u]));
  const trimIn: Ffx2TrimChr[] = Array.from({ length: SLOTS }, (_, id) => {
    const u = bySlot.get(id);
    return u === undefined
      ? { atbEnabled: false, inBattle: false, dead: true, petrified: false, recovery: 0 }
      : { atbEnabled: true, inBattle: !u.removed, dead: !u.alive, petrified: has(u, 'petrify'), recovery: u.atb.recovery };
  });
  const trimmed = openingTrim(trimIn);
  for (const u of ordered) u.atb.recovery = trimmed.recovery[u.gauge.slot] ?? u.atb.recovery;
  for (const u of ordered) refreshGauge(u);
}
