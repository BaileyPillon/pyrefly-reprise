/**
 * Tourist Trap (the optional FFX-2 mission; the hidden chapter): the fight, measured and not tuned (D-410: nothing in the boss was tuned to a number). **FFX-2 only.**
 *
 * Re-measured on the game's own scripts and rows (RE review 2026-10-14, m170 / m174, rows 170 / 174): Yojimbo's polls (a dog pick is a poll without a turn), Daigoro's own bites, the five command
 * rows' costs (Kozuka and both Wakizashi rest 120, the bite 100, Zanmato charges 120 and rests 200) and no move that rolls to hit.
 *
 * 40 seeds a cell. The line is the shipped tactic (`src/engine/tactics/ffx2-tourist-trap.ts`: Yuna Protect first, a Mega-Potion the turn after Zanmato, Esuna for the Poison; the Knights
 * on Darkness) as `intendedStrategy` plays it; `naive` is the same party attacking every turn with no answers. The party is the Chapter 3 preset (`djoseBuild`, Lv 32 / 33 / 34, the
 * research is silent on the mission's level: an `[estimate]`), with the Chapter 5 preset (Lv 46 / 48 / 50) beside it as the other end of the research's "Chapter 3 or Chapter 5". The
 * clocks: Wait (the default a player has) at bench speed, and Active at a human pace of 1.5 s and 4 s a decision. Action time (3 s per move, the flat add-on the sibling possessed-aeon chapters
 * carry on top of their rows; kept by precedent, awaiting Bailey's pick for this chapter: his picks were per chapter) is ON as shipped; the OFF row is the control, and the Zanmato cycle is reported both ways. The table is printed; the assertions are the structure that
 * does not move (the 14th-poll Zanmato, a party without answers loses, the cycle is longer with the add-on), never a win rate: a rate is a disclosure for Bailey, not a gate.
 */
import { describe, expect, it } from 'vitest';

import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import { driveFight, withoutActionTime, type TouristTrapDriveOptions, type TouristTrapRun } from '../helpers/touristTrapDrive.ts';

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

interface Cell {
  label: string;
  wins: number;
  withZanmato: number;
  meanKos: number;
  medianPolls: number;
  meanRealActions: number;
  meanBites: number;
  /** Daigoro's bites per cycle of 14 polls (the RE step model's target is about 4.3, 3.4 to 4.5 over animation lengths). */
  bitesPerCycle: number;
  /** Mean seconds from one Zanmato to the next in this cell's fights (null when no fight had two). */
  cycleSeconds: number | null;
  /** Mean seconds to the first Zanmato (null when none reached one). */
  firstZanmatoSeconds: number | null;
  runs: TouristTrapRun[];
}

const mean = (xs: number[]): number | null => (xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length);

function cell(label: string, opts: TouristTrapDriveOptions): Cell {
  const runs = SEEDS.map((seed) => driveFight(seed, opts));
  const polls = runs.map((r) => r.polls).sort((a, b) => a - b);
  const gaps = runs.flatMap((r) => r.zanmatoSeconds.slice(1).map((t, i) => t - r.zanmatoSeconds[i]!));
  return {
    label,
    wins: runs.filter((r) => r.outcome === 'victory').length,
    withZanmato: runs.filter((r) => r.zanmatoPolls.length > 0).length,
    meanKos: runs.reduce((n, r) => n + r.kos, 0) / runs.length,
    medianPolls: polls[Math.floor(polls.length / 2)]!,
    meanRealActions: runs.reduce((n, r) => n + r.sequence.length, 0) / runs.length,
    meanBites: runs.reduce((n, r) => n + r.bites, 0) / runs.length,
    bitesPerCycle: runs.reduce((n, r) => n + r.bites, 0) / (runs.reduce((n, r) => n + r.polls, 0) / 14),
    cycleSeconds: mean(gaps),
    firstZanmatoSeconds: mean(runs.filter((r) => r.zanmatoSeconds.length > 0).map((r) => r.zanmatoSeconds[0]!)),
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
const fmt = (x: number | null): string => (x === null ? '  - ' : x.toFixed(1).padStart(5));

describe('the fight, measured over 40 seeds a cell (printed; not a gate)', () => {
  it('prints the table', () => {
    const rows = cells.map(
      (c) =>
        `${c.label.padEnd(76)} wins ${String(c.wins).padStart(2)}/40  Zanmato in ${String(c.withZanmato).padStart(2)}  KOs ${c.meanKos.toFixed(2)}  polls ${String(c.medianPolls).padStart(2)}  real actions ${c.meanRealActions.toFixed(1)}  bites ${c.meanBites.toFixed(1)} (${c.bitesPerCycle.toFixed(2)} a cycle)  first Zanmato ${fmt(c.firstZanmatoSeconds)} s  Zanmato to Zanmato ${fmt(c.cycleSeconds)} s`,
    );
    // eslint-disable-next-line no-console
    console.log(['', 'Tourist Trap bench (Yojimbo and Daigoro, the game\'s scripts and rows):', ...rows].join('\n'));
    expect(cells).toHaveLength(6);
  });

  it('every Zanmato of every fight in every cell is the 14th poll of its cycle: poll 14, 28, 42 ... and none comes earlier', () => {
    for (const c of cells) {
      for (const r of c.runs) {
        r.zanmatoPolls.forEach((p, i) => expect(p, `${c.label}: Zanmato number ${i + 1}`).toBe(14 * (i + 1)));
      }
    }
  });

  it("Daigoro's bites answer Yojimbo's calls: a fight that lasts has bites, never more than there were polls, and no bite is Yojimbo's", () => {
    for (const c of cells) {
      for (const r of c.runs) {
        expect(r.bites, c.label).toBeLessThanOrEqual(r.polls);
        expect(r.sequence.includes('x2-daigoro-bite'), c.label).toBe(false);
      }
    }
    expect(by('Chapter 3 preset, intended line, Wait clock').meanBites).toBeGreaterThan(0);
  });

  it("Daigoro's bites per cycle sit in the RE step model's range (3.4 to 4.5, about 4.3), in the cells long enough to have cycles", () => {
    for (const label of ['Chapter 3 preset, intended line, Wait clock', 'Chapter 3 preset, intended line, Wait clock, action time OFF (control)', 'Chapter 3 preset, naive']) {
      const c = by(label);
      expect(c.bitesPerCycle, label).toBeGreaterThan(3.2);
      expect(c.bitesPerCycle, label).toBeLessThan(4.7);
    }
  });

  it('a party with no answers loses every fight, and the shipped line can win some: the counter matters', () => {
    expect(by('Chapter 3 preset, naive').wins).toBe(0);
    expect(by('Chapter 3 preset, intended line, Wait clock').wins).toBeGreaterThan(0);
    expect(by('Chapter 3 preset, naive').withZanmato).toBeGreaterThan(0); // the losing fights reach the 14th poll: Zanmato is what ends them
  });

  it('the action-time add-on lengthens the Zanmato cycle (reported both ways in the handoff), and the cycle is longer than the rows alone give', () => {
    const on = by('Chapter 3 preset, intended line, Wait clock');
    const off = by('Chapter 3 preset, intended line, Wait clock, action time OFF');
    expect(on.firstZanmatoSeconds).not.toBeNull();
    expect(off.firstZanmatoSeconds).not.toBeNull();
    expect(on.firstZanmatoSeconds!).toBeGreaterThan(off.firstZanmatoSeconds!);
  });

  it('the Chapter 5 preset (Lv 46 / 48 / 50) wins at least as often as the Chapter 3 preset and sees a Zanmato no more often: the control end of the research window', () => {
    expect(by('Chapter 5 preset').wins).toBeGreaterThanOrEqual(by('Chapter 3 preset, intended line, Wait clock').wins);
    expect(by('Chapter 5 preset').withZanmato).toBeLessThanOrEqual(by('Chapter 3 preset, intended line, Wait clock').withZanmato);
  });
});
