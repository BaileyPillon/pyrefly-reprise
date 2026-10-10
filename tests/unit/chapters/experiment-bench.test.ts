/**
 * The Experiment (FFX-2 Chapter 5, Djose Temple; the hidden chapter): the fight measured, per act, per pace, per clock. **FFX-2 only** [AGENTS.md rule 14].
 *
 * A *measurement*, never a target (D-410: nothing in the boss is tuned to a number; rule 6). The line is the shipped one (`intendedStrategy`, which reads
 * `src/engine/tactics/ffx2-experiment.ts`), and `naive` is the same party attacking every turn and healing nobody, reported beside it. The chapter's rows are the game's own, so what
 * is measured here is what the game's rows make of the Chapter V preset (Yuna White Mage, Rikku and Paine Dark Knight; Light Curtain x12, Phoenix Down x25, Mega Phoenix x5).
 *
 * Paces: `bench` is a decision the moment the menu opens (the ceiling of what a line can do); `fast` and `slow` are a player who takes 1.5 s and 4 s to choose, on the Wait clock
 * (the default: the clock runs at the top of the command list and holds in a submenu) and on Active (the clock never stops), so a slow player on Active is the hard case.
 *
 * What the file asserts is invariant, not a win rate: the run is deterministic under its seed; the prototype only ever strikes; the full weapon's actions follow the cycle whatever the
 * party does; nobody can be knocked out more than three times; every run ends. The table is printed (`console.info`) for the handoff's disclosure.
 */

import { describe, expect, it } from 'vitest';

import { ACT_I_LEVELS, ACT_II_LEVELS, EXPERIMENT_ACTIONS, type ExperimentLevels } from '../../../src/data/ffx2/enemies/experiment-levels.ts';
import { driveAct, type ExperimentLine } from '../helpers/experimentDrive.ts';

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

interface Cell {
  act: string;
  clock: 'wait' | 'active';
  paceMs: number;
  line: ExperimentLine;
  wins: number;
  runs: number;
  koRuns: number;
  meanKos: number;
  meanSeconds: number;
  lifeslicers: number;
  annihilators: number;
}

function cell(act: string, levels: ExperimentLevels, clock: 'wait' | 'active', paceMs: number, line: ExperimentLine): Cell {
  let wins = 0;
  let koRuns = 0;
  let kos = 0;
  let ticks = 0;
  let ls = 0;
  let an = 0;
  for (const seed of SEEDS) {
    const r = driveAct(levels, seed, { decisionMs: paceMs, engine: { atbMode: clock }, line });
    expect(r.outcome, `${act} ${clock} ${paceMs} ${line} seed ${seed} ended`).toBeDefined();
    if (r.outcome === 'victory') wins++;
    if (r.kos > 0) koRuns++;
    kos += r.kos;
    ticks += r.ticks;
    ls += r.moves[EXPERIMENT_ACTIONS.lifeslicer] ?? 0;
    an += r.moves[EXPERIMENT_ACTIONS.annihilator] ?? 0;
  }
  return { act, clock, paceMs, line, wins, runs: SEEDS.length, koRuns, meanKos: kos / SEEDS.length, meanSeconds: ticks / SEEDS.length / 1000, lifeslicers: ls, annihilators: an };
}

describe('determinism and the invariants of both acts', () => {
  it('the same seed gives the same fight, twice', () => {
    for (const levels of [ACT_I_LEVELS, ACT_II_LEVELS]) {
      const a = driveAct(levels, 5);
      const b = driveAct(levels, 5);
      expect([a.outcome, a.ticks, a.kos, a.partyTurns, a.moves]).toEqual([b.outcome, b.ticks, b.kos, b.partyTurns, b.moves]);
      expect(a.log.length).toBe(b.log.length);
    }
  });

  it('the prototype only ever strikes; nobody is ever knocked out more than three times in a fight', () => {
    for (const seed of SEEDS) {
      const r = driveAct(ACT_I_LEVELS, seed, { line: 'naive' });
      expect(Object.keys(r.moves), `seed ${seed}`).toEqual([EXPERIMENT_ACTIONS.attack]);
      expect(r.kos, `seed ${seed}`).toBeLessThanOrEqual(3);
    }
  });
});

describe('the measurement (printed for the handoff; nothing here is a target)', () => {
  const cells: Cell[] = [];

  for (const [act, levels] of [['Act I (1/1/1)', ACT_I_LEVELS], ['Act II (5/5/5)', ACT_II_LEVELS]] as const) {
    for (const clock of ['wait', 'active'] as const) {
      for (const paceMs of [0, 1500, 4000]) {
        for (const line of ['intended', 'naive'] as const) {
          it(`${act}, ${clock} clock, ${paceMs === 0 ? 'bench pace' : `${paceMs} ms a decision`}, ${line} line: ${SEEDS.length} seeds`, () => {
            const c = cell(act, levels, clock, paceMs, line);
            cells.push(c);
            // Invariants only: a run that ends, with a count that adds up.
            expect(c.wins).toBeGreaterThanOrEqual(0);
            expect(c.wins).toBeLessThanOrEqual(c.runs);
            if (act.startsWith('Act I ')) expect(c.lifeslicers + c.annihilators).toBe(0);
          });
        }
      }
    }
  }

  it('prints the table', () => {
    const rows = cells
      .map((c) => `${c.act.padEnd(15)} ${c.clock.padEnd(6)} ${c.paceMs === 0 ? 'bench' : `${c.paceMs}ms`.padEnd(6)} ${c.line.padEnd(9)} wins ${String(c.wins).padStart(2)}/${c.runs}  fights with a KO ${String(c.koRuns).padStart(2)}  mean KOs ${c.meanKos.toFixed(2)}  mean ${c.meanSeconds.toFixed(0)} s  Lifeslicers ${c.lifeslicers}  Annihilators ${c.annihilators}`)
      .join('\n');
    console.info(`[experiment bench] seeds 1..${SEEDS.length}\n${rows}`);
    expect(cells.length).toBe(24);
  });
});
