/**
 * Tourist Trap (the optional FFX-2 mission; the hidden chapter): the fight, measured and not tuned (D-410: nothing in the boss was tuned to a number). **FFX-2 only.**
 *
 * 40 seeds a cell. The line is the shipped tactic (`src/engine/tactics/ffx2-tourist-trap.ts`: Yuna Protect first, a Mega-Potion the turn after Zanmato, Esuna for the Poison; the Knights
 * on Darkness) as `intendedStrategy` plays it; `naive` is the same party attacking every turn with no answers. The party is the Chapter 3 preset (`djoseBuild`, Lv 32 / 33 / 34, the
 * research is silent on the mission's level: an `[estimate]`), with the Chapter 5 preset (Lv 46 / 48 / 50) beside it as the other end of the research's "Chapter 3 or Chapter 5". The
 * clocks: Wait (the default a player has) at bench speed, and Active at a human pace of 1.5 s and 4 s a decision. Action time (3 s per move, Bailey's pick for the other possessed
 * aeons) is ON as shipped; the OFF rows are the control. The table is printed; the assertions are the structure that does not move (the 14th-turn Zanmato, a party without answers loses),
 * never a win rate: a rate is a disclosure for Bailey, not a gate.
 */
import { describe, expect, it } from 'vitest';

import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { YOJIMBO_ACTIONS } from '../../../src/data/ffx2/enemies/tourist-trap-abilities.ts';
import { driveFight, withoutActionTime, type TouristTrapDriveOptions, type TouristTrapRun } from '../helpers/touristTrapDrive.ts';

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

interface Cell {
  label: string;
  wins: number;
  withZanmato: number;
  meanKos: number;
  medianYojimboMoves: number;
  runs: TouristTrapRun[];
}

function cell(label: string, opts: TouristTrapDriveOptions): Cell {
  const runs = SEEDS.map((seed) => driveFight(seed, opts));
  const moves = runs.map((r) => r.sequence.length).sort((a, b) => a - b);
  return {
    label,
    wins: runs.filter((r) => r.outcome === 'victory').length,
    withZanmato: runs.filter((r) => r.sequence.includes(YOJIMBO_ACTIONS.zanmato)).length,
    meanKos: runs.reduce((n, r) => n + r.kos, 0) / runs.length,
    medianYojimboMoves: moves[Math.floor(moves.length / 2)]!,
    runs,
  };
}

const CH3 = {} as const;
const CH5: TouristTrapDriveOptions = { build: farplaneBuild as FFX2PartyBuild };

const cells: Cell[] = [
  cell('Chapter 3 preset, intended line, Wait clock', { ...CH3 }),
  cell('Chapter 3 preset, intended line, Active clock, 1.5 s a decision', { engine: { atbMode: 'active' }, decisionMs: 1500 }),
  cell('Chapter 3 preset, intended line, Active clock, 4 s a decision', { engine: { atbMode: 'active' }, decisionMs: 4000 }),
  cell('Chapter 3 preset, naive (attack only, no answers), Wait clock', { line: 'naive' }),
  cell('Chapter 3 preset, intended line, Wait clock, action time OFF (control)', { group: withoutActionTime() }),
  cell('Chapter 5 preset, intended line, Wait clock', { ...CH5 }),
];
const by = (prefix: string): Cell => cells.find((c) => c.label.startsWith(prefix))!;

describe('the fight, measured over 40 seeds a cell (printed; not a gate)', () => {
  it('prints the table', () => {
    const rows = cells.map((c) => `${c.label.padEnd(76)} wins ${String(c.wins).padStart(2)}/40   fights with a Zanmato ${String(c.withZanmato).padStart(2)}   KOs a fight ${c.meanKos.toFixed(2)}   median Yojimbo moves ${c.medianYojimboMoves}`);
    // eslint-disable-next-line no-console
    console.log(['', 'Tourist Trap bench (Yojimbo and Daigoro):', ...rows].join('\n'));
    expect(cells).toHaveLength(6);
  });

  it('every fight that lasts 14 of his moves has its first Zanmato on the 14th, in every cell, and no fight has one earlier', () => {
    for (const c of cells) {
      for (const r of c.runs) {
        const z = r.sequence.indexOf(YOJIMBO_ACTIONS.zanmato);
        if (z >= 0) expect(z + 1, `${c.label}`).toBe(14);
        expect(r.sequence.slice(0, 13).includes(YOJIMBO_ACTIONS.zanmato), c.label).toBe(false);
        // The reset: after a Zanmato the next one is 14 moves later again.
        const second = r.sequence.indexOf(YOJIMBO_ACTIONS.zanmato, z + 1);
        if (z >= 0 && second >= 0) expect(second - z, `${c.label}: the second Zanmato`).toBe(14);
      }
    }
  });

  it('a party with no answers loses every fight, and the shipped line can win some: the counter matters', () => {
    expect(by('Chapter 3 preset, naive').wins).toBe(0);
    expect(by('Chapter 3 preset, intended line, Wait clock').wins).toBeGreaterThan(0);
    expect(by('Chapter 3 preset, naive').withZanmato).toBeGreaterThan(0); // the losing fights reach the 14th move: Zanmato is what ends them
  });

  it('the Chapter 5 preset (Lv 46 / 48 / 50) wins at least as often as the Chapter 3 preset and rarely lives to see a Zanmato: the control end of the research window', () => {
    expect(by('Chapter 5 preset').wins).toBeGreaterThanOrEqual(by('Chapter 3 preset, intended line, Wait clock').wins);
    expect(by('Chapter 5 preset').withZanmato).toBeLessThanOrEqual(by('Chapter 3 preset, intended line, Wait clock').withZanmato);
  });
});
