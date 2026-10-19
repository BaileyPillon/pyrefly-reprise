/**
 * Tourist Trap (the optional FFX-2 mission; the hidden chapter): the fight, measured and not tuned (D-410: nothing in the boss was tuned to a number). **FFX-2 only.**
 *
 * Re-measured on the game's own scripts and rows (RE review 2026-10-14, m170 / m174, rows 170 / 174): Yojimbo's polls (a dog pick is a poll without a turn), Daigoro's own bites, the five command
 * rows' costs (Kozuka and both Wakizashi rest 120, the bite 100, Zanmato charges 120 and rests 200) and no move that rolls to hit.
 *
 * 40 seeds a cell. The line is the shipped tactic (`src/engine/tactics/ffx2-tourist-trap.ts`: Yuna Protect first, a Mega-Potion the turn after Zanmato, Esuna for the Poison; the Knights
 * on Darkness) as `intendedStrategy` plays it; `naive` is the same party attacking every turn with no answers. The party is the Chapter 3 preset (`djoseBuild`, Lv 32 / 33 / 34, the
 * research is silent on the mission's level: an `[estimate]`), with the Chapter 5 preset (Lv 46 / 48 / 50) beside it as the other end of the research's "Chapter 3 or Chapter 5". The
 * clocks: Wait (the default a player has) at bench speed, and Active at a human pace of 1.5 s and 4 s a decision.
 *
 * **Two timelines (r56, 2026-10-19).** The per-command action time (`ACTION_TIME_PER_COMMAND`, `action-span.ts`) is ON as shipped and supersedes the formation's flat 3 s (D-846, the flat
 * add-on the sibling possessed-aeon chapters carry on top of their rows), so the shipped fight is the first set of cells below (the span). The flat 3 s and the no-action-time control are
 * the OLD timeline: they exist only with the span put back off, through `withActionSpanKnobs({ perCommand: false })` wrapped around those cells and nothing else. The table is
 * printed; the assertions are the structure that does not move (the 14th-poll Zanmato, a party without answers loses, the old timeline's add-on lengthens the cycle, the span fight
 * is the same whether or not the formation names 3 s), never a win rate: a rate is a disclosure for Bailey, not a gate.
 */
import { describe, expect, it } from 'vitest';

import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { withActionSpanKnobs } from '../../../src/battle/ffx2/action-span.ts';
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

/** The shipped fight: the per-command span, which supersedes the formation's flat 3 s. */
const cells: Cell[] = [
  cell('Chapter 3 preset, intended line, Wait clock', { ...CH3 }),
  cell('Chapter 3 preset, intended line, Active clock, 1.5 s a decision', { engine: { atbMode: 'active' }, decisionMs: 1500 }),
  cell('Chapter 3 preset, intended line, Active clock, 4 s a decision', { engine: { atbMode: 'active' }, decisionMs: 4000 }),
  cell('Chapter 3 preset, naive (attack only, no answers), Wait clock', { line: 'naive' }),
  cell('Chapter 3 preset, intended line, Wait clock, formation names no action time', { group: withoutActionTime() }),
  cell('Chapter 5 preset, intended line, Wait clock', { ...CH5 }),
];
const by = (prefix: string): Cell => cells.find((c) => c.label.startsWith(prefix))!;

/**
 * The OLD timeline (r55): the span put back off, so the formation's flat 3 s is what it was and no formation means no action time. Computed lazily and only inside the tests that
 * read it, each cell wrapped in `withActionSpanKnobs({ perCommand: false })`; the other tests keep covering production.
 */
const oldMemo = new Map<string, Cell>();
function old(label: string, opts: TouristTrapDriveOptions): Cell {
  let c = oldMemo.get(label);
  if (!c) {
    c = withActionSpanKnobs({ perCommand: false }, () => cell(label, opts));
    oldMemo.set(label, c);
  }
  return c;
}
const oldFlat3s = (): Cell => old("old timeline: Chapter 3 preset, intended line, Wait clock, the formation's flat 3 s", { ...CH3 });
const oldNaive = (): Cell => old('old timeline: Chapter 3 preset, naive, Wait clock, the flat 3 s', { line: 'naive' });
const oldOff = (): Cell => old('old timeline: Chapter 3 preset, intended line, Wait clock, action time OFF (control)', { group: withoutActionTime() });
const fmt = (x: number | null): string => (x === null ? '  - ' : x.toFixed(1).padStart(5));

describe('the fight, measured over 40 seeds a cell (printed; not a gate)', () => {
  it('prints the table', () => {
    const rows = [...cells, oldFlat3s(), oldNaive(), oldOff()].map(
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

  it("OLD timeline: Daigoro's bites per cycle sit in the RE step model's range (3.4 to 4.5, about 4.3), in the cells long enough to have cycles", () => {
    // The step model's range is for the flat 3 s (or no) animation window; the span has its own animation lengths and is asserted on its own below.
    for (const c of [oldFlat3s(), oldOff(), oldNaive()]) {
      expect(c.bitesPerCycle, c.label).toBeGreaterThan(3.2);
      expect(c.bitesPerCycle, c.label).toBeLessThan(4.7);
    }
  });

  it("the span (as shipped): Daigoro's bites per cycle stay near the model's range, a little above it, in every cell long enough to have cycles", () => {
    // A regression guard around the measured 4.4 to 4.74 with the span, not a sourced range (the sourced 3.4 to 4.5 is the old timeline's, above). The Chapter 5 cell ends
    // inside its first cycle (10 polls), so it has no cycle to measure.
    for (const prefix of ['Chapter 3 preset, intended line, Wait clock', 'Chapter 3 preset, intended line, Active clock, 1.5 s', 'Chapter 3 preset, intended line, Active clock, 4 s', 'Chapter 3 preset, naive']) {
      const c = by(prefix);
      expect(c.bitesPerCycle, c.label).toBeGreaterThan(3.2);
      expect(c.bitesPerCycle, c.label).toBeLessThan(5.0);
    }
  });

  it('a party with no answers loses every fight, and the shipped line can win some: the counter matters', () => {
    expect(by('Chapter 3 preset, naive').wins).toBe(0);
    expect(by('Chapter 3 preset, intended line, Wait clock').wins).toBeGreaterThan(0);
    expect(by('Chapter 3 preset, naive').withZanmato).toBeGreaterThan(0); // the losing fights reach the 14th poll: Zanmato is what ends them
  });

  it("OLD timeline: the formation's flat 3 s add-on lengthens the Zanmato cycle (reported both ways in the handoff), and the cycle is longer than the rows alone give", () => {
    const on = oldFlat3s();
    const off = oldOff();
    expect(on.firstZanmatoSeconds).not.toBeNull();
    expect(off.firstZanmatoSeconds).not.toBeNull();
    expect(on.firstZanmatoSeconds!).toBeGreaterThan(off.firstZanmatoSeconds!);
  });

  it("the span (as shipped) supersedes the formation's flat 3 s: the fight is the same whether or not the formation names it, and the span is longer than the rows alone give", () => {
    const named = by('Chapter 3 preset, intended line, Wait clock');
    const unnamed = by('Chapter 3 preset, intended line, Wait clock, formation names no action time');
    expect(named.firstZanmatoSeconds).not.toBeNull();
    expect(unnamed.firstZanmatoSeconds).toBe(named.firstZanmatoSeconds); // D-846's 3 s gives way to the per-command span (supersedeFormation)
    expect(unnamed.cycleSeconds).toBe(named.cycleSeconds);
    expect(unnamed.bitesPerCycle).toBe(named.bitesPerCycle);
    // and the span is real action time: longer to the first Zanmato than the rows alone (old timeline, no action time at all)
    expect(named.firstZanmatoSeconds!).toBeGreaterThan(oldOff().firstZanmatoSeconds!);
  });

  it('the Chapter 5 preset (Lv 46 / 48 / 50) wins at least as often as the Chapter 3 preset and sees a Zanmato no more often: the control end of the research window', () => {
    expect(by('Chapter 5 preset').wins).toBeGreaterThanOrEqual(by('Chapter 3 preset, intended line, Wait clock').wins);
    expect(by('Chapter 5 preset').withZanmato).toBeLessThanOrEqual(by('Chapter 3 preset, intended line, Wait clock').withZanmato);
  });
});
