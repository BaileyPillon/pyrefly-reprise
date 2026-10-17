/**
 * **X2-L / XL1: the path PR-0107 switches on is the game's full battle start.** FFX-2 only (AGENTS.md rule 14). No measurement here and
 * nothing shipped moves: every run sets `separateBattleGauges` itself, so these pass with the constant OFF or ON.
 *
 * FFX2-G10 sections 4 to 6 (private note; FFX-2.exe, Steam build 25501027): every `btlExe` is a full start through phases 4 to 0x19, so a
 * chained link is a new battle. Its random draws, in time order, for a boss fight the scene master presets to "no first-attack roll"
 * (preset 3: all 149 such scenes, the Chateau's three acts among them): one draw per character in play, the girls first, each on that
 * character's own purpose-0 stream (a girl's slot + 20, a monster's slot + 13); no draw at all in the first-attack step; the opening
 * trim draws nothing. The opening wait is `((draw & 63) + 32) * full / 128` of the character's own full wait (25 to 74 percent), and the
 * smallest wait on the field is then cut by two thirds off everyone.
 *
 * The expected values below are written out here from that note, not read back from the kernel, so this checks `atb-open.ts` and
 * `kernel/atb-start.ts` against the note's arithmetic on the real Chateau links with the real draws.
 *
 * Not modelled, and not claimed: the layout roll and placement draws on stream 17 and the party-side characters the game builds beyond the
 * three in play (FFX2-G10 section 6 steps 1 to 3; plan row XL2: no chapter's rolls depend on them).
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup } from '../../src/battle/common/types.ts';
import { makeFfx2Rng } from '../../src/battle/ffx2/adapt/streams.ts';
import { buildState } from '../../src/battle/ffx2/setup.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_ACT_I, LEBLANC_ACT_II, LEBLANC_ACT_III } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';

const FIRST_STRIKE_STREAM = 1;
const LAYOUT_STREAM = 17;

interface Opened { units: Ffx2Unit[]; draws: Array<[stream: number, value: number]> }

/** `buildState` for a chained link of the Chateau, with a tap on every draw it makes. */
function open(groupId: string, seed: number, separate: boolean, condition: BattleSetup['condition'] = 'scripted'): Opened {
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`no formation ${groupId}`);
  const rng = makeFfx2Rng(seed);
  const draws: Opened['draws'] = [];
  rng.tap = (stream, value) => draws.push([stream, value]);
  const setup: BattleSetup = { game: 'ffx2', party: chateauBuild, enemies: group, triggers: [], seed, condition, canEscape: false };
  const built = buildState(setup, { atbMode: 'wait', separateBattleGauges: separate }, rng);
  return { units: [...built.units].sort((a, b) => a.gauge.slot - b.gauge.slot), draws };
}

/** The stream a character's opening draw is on: a girl (slot 0 to 14) slot + 20, a monster (15 to 30) slot + 13. */
const ownStream = (slot: number): number => (slot < 15 ? slot + 20 : slot + 13);

/** The opening wait the note gives, then the trim: what remains to wait, per unit in slot order. */
function expectedWaits(units: readonly Ffx2Unit[], draws: Opened['draws']): number[] {
  const starts = units.map((u, i) => Math.trunc((((draws[i]![1] & 63) + 32) * u.gauge.recoveryMax) / 128));
  const smallest = Math.min(...starts);
  const cut = smallest > 0 ? Math.trunc((2 * smallest) / 3) : 0;
  return starts.map((s) => s - cut);
}

describe('PR-0107 ON: a chained Chateau link opens like the game opens every battle (FFX-2 only)', () => {
  for (const act of [LEBLANC_ACT_II, LEBLANC_ACT_III]) {
    describe(act, () => {
      it('takes one draw per character, the girls first then the monsters in slot order, each on its own purpose-0 stream, and none on the first-strike stream', () => {
        for (let seed = 1; seed <= 12; seed++) {
          const { units, draws } = open(act, seed, true);
          expect(units.map((u) => u.side)).toEqual(['party', 'party', 'party', ...units.slice(3).map(() => 'enemy')]);
          expect(draws.map(([s]) => s)).toEqual(units.map((u) => ownStream(u.gauge.slot)));
          expect(draws.some(([s]) => s === FIRST_STRIKE_STREAM || s === LAYOUT_STREAM)).toBe(false);
        }
      });

      it('leaves each character with ((draw & 63) + 32) / 128 of its own full wait, less two thirds of the smallest, to the unit', () => {
        for (let seed = 1; seed <= 40; seed++) {
          const { units, draws } = open(act, seed, true);
          expect(units.map((u) => u.atb.recovery), `seed ${seed}`).toEqual(expectedWaits(units, draws));
          for (const u of units) expect(u.gauge.recoveryMax).toBe(Math.trunc((70 * 10000) / (u.stats.agi + 1)));
        }
      });

      it('the first to fill started with a third of its drawn wait, and the same draws as the continuation spends are spent', () => {
        for (let seed = 1; seed <= 12; seed++) {
          const on = open(act, seed, true);
          const off = open(act, seed, false);
          expect(on.draws).toEqual(off.draws); // the continuation spends the same draws and keeps none of the result
          const starts = on.units.map((u, i) => Math.trunc((((on.draws[i]![1] & 63) + 32) * u.gauge.recoveryMax) / 128));
          const first = on.units.reduce((a, u) => (u.atb.recovery < a.atb.recovery ? u : a));
          expect(first.atb.recovery).toBe(starts[on.units.indexOf(first)]! - Math.trunc((2 * Math.min(...starts)) / 3));
        }
      });
    });
  }

  it('a chain that is NOT flagged keeps the continuation: every wait whole, nothing trimmed (Act I is a normal start and is not touched by the flag)', () => {
    for (const act of [LEBLANC_ACT_II, LEBLANC_ACT_III]) {
      const { units } = open(act, 7, false);
      for (const u of units) expect(u.atb.recovery).toBe(u.gauge.recoveryMax);
    }
    // Act I opens as a normal battle whichever way the switch is set: the same waits, the same draws.
    const a = open(LEBLANC_ACT_I, 7, true, 'normal');
    const b = open(LEBLANC_ACT_I, 7, false, 'normal');
    expect(a.units.map((u) => u.atb.recovery)).toEqual(b.units.map((u) => u.atb.recovery));
    expect(a.draws).toEqual(b.draws);
    expect(a.draws.some(([s]) => s === FIRST_STRIKE_STREAM)).toBe(false); // preset 3: a Chateau scene rolls no preemptive strike or ambush
  });
});
