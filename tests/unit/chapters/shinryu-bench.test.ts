/**
 * The hidden Shinryu chapter's winnability, MEASURED (FFX only; `docs/handoff/ch-shinryu.md` section 5; the preflight's section 8): scripted players on the real engine, no god mode, the boss never tuned.
 * `tests/unit/helpers/shinryuBot.ts` is the player. These bounds are a **tripwire, not a target**: the shipped party wins every battle (200 of 200 on the first 200 seeds, 100 of 100 on seeds 1000 to 1099), and if a later
 * change moves that, re-measure and update the handoff's table, never the bounds alone.
 *
 * `SHINRYU_MEASURE=1 npx vitest run tests/unit/chapters/shinryu-bench.test.ts` prints every row of the handoff's table (about 40 seconds).
 *
 * Also here: a seeded run of the whole chapter on three seeds, which ends and replays the same.
 */

import { describe, expect, it } from 'vitest';

import { swimmersBuild } from '../../../src/data/ffx/builds/swimmers.ts';
import { shinryuBuild } from '../../../src/data/ffx/builds/shinryu.ts';
import { LINES, bench, choose, play, winRate, withPlainWeapons, withoutAutoHaste, type Run } from '../helpers/shinryuBot.ts';
import { log, newEngine, shinryu } from '../helpers/shinryuDrive.ts';

/** Drive one seed with the guide line to the end and hand back the engine's whole log as text. */
function wholeLog(seed: number): { text: string; hp: number } {
  const engine = newEngine(seed);
  for (let i = 0; i < 2000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'player-input') engine.submit(choose(engine, d, LINES['guide']!));
  }
  return { text: JSON.stringify(log(engine)), hp: shinryu(engine).hp };
}

const wins = (runs: readonly Run[]): number => runs.filter((r) => r.outcome === 'victory').length;
const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const mean = (runs: readonly Run[], key: 'erasers' | 'shattered' | 'turns'): number => runs.reduce((s, r) => s + r[key], 0) / runs.length;

describe('a seeded run of the whole chapter ends, and replays the same', () => {
  for (const seed of [1, 2, 3]) {
    it(`seed ${seed}: the guide line wins, 21 blows of 99,999, and a second run of the same seed is the same log`, () => {
      const a = play(seed, LINES['guide']!);
      const b = play(seed, LINES['guide']!);
      expect(a.outcome).toBe('victory');
      expect(a).toEqual(b);
      const first = wholeLog(seed);
      expect(first.hp).toBe(0);
      expect(first.text).toBe(wholeLog(seed).text);
      expect(first.text.length).toBeGreaterThan(5_000);
    });
  }
});

describe('the shipped party (the Penance preset\'s three swimmers with the Celestial weapons)', () => {
  const guide = bench(LINES['guide']!, 200);
  const careless = bench(LINES['careless']!, 100);
  const heldOut = bench(LINES['guide']!, 100, shinryuBuild, 1000);

  it('the guide line wins at least 195 of 200 (measured: 200), none stalled, in a median of about 24 ticks', () => {
    expect(wins(guide)).toBeGreaterThanOrEqual(195);
    expect(guide.filter((r) => r.outcome === 'stalled')).toHaveLength(0);
    expect(median(guide.map((r) => r.ticks))).toBeLessThanOrEqual(30);
    expect(Math.max(...guide.map((r) => r.ticks))).toBeLessThan(80);
  });

  it('on held-out seeds 1000 to 1099 the same (measured: 100 of 100)', () => {
    expect(wins(heldOut)).toBeGreaterThanOrEqual(95);
  });

  it('even the careless line (Attack with everyone, no care) wins at least 95 of 100: the fight is a race the preset wins, which is the sourced difficulty ("strongest weapons are a necessity")', () => {
    expect(wins(careless)).toBeGreaterThanOrEqual(95);
  });

  it('Shinryu gets about one turn of its own a battle and the Eraser lands well under once (measured: 0.34 a battle for the guide line)', () => {
    expect(mean(guide, 'turns')).toBeLessThan(2);
    expect(mean(guide, 'erasers')).toBeLessThan(1);
    expect(mean(guide, 'shattered')).toBe(mean(guide, 'erasers')); // every landed Eraser is a shatter (the row's own byte and the water)
  });

  it('the guide line is no slower than the careless one (Quick Hit is a rank sooner)', () => {
    expect(median(guide.map((r) => r.ticks))).toBeLessThanOrEqual(median(careless.map((r) => r.ticks)));
  });

  it('no battle is ever lost to the Eraser: it needs two living swimmers, so at most two are ever shattered', () => {
    for (const r of [...guide, ...careless, ...heldOut]) expect(r.shattered, `seed ${r.seed}`).toBeLessThanOrEqual(2);
  });
});

describe('the what-ifs (the levers are the party, never a boss number)', () => {
  it('plain weapons with Break Damage Limit only: the same 21 blows of 99,999, the same result (measured: 200 of 200)', () => {
    const runs = bench(LINES['guide']!, 60, withPlainWeapons(shinryuBuild));
    expect(wins(runs)).toBeGreaterThanOrEqual(57);
  });

  it('no Auto-Haste: about four turns of its own a battle and one Eraser, and still every battle won (measured: 200 of 200, median 57 ticks)', () => {
    const runs = bench(LINES['guide']!, 60, withoutAutoHaste(shinryuBuild));
    expect(wins(runs)).toBeGreaterThanOrEqual(57);
    expect(mean(runs, 'turns')).toBeGreaterThan(2.5);
    expect(median(runs.map((r) => r.ticks))).toBeGreaterThan(40);
  });

  it('the Flooded Ways\' swimmers (the Highbridge cells, 9,999 a blow, a few thousand HP) win none: Shinryu\'s claws end them in about 15 ticks', () => {
    const runs = bench(LINES['guide']!, 60, swimmersBuild);
    expect(wins(runs)).toBe(0);
    expect(median(runs.map((r) => r.ticks))).toBeLessThan(40);
  });

  it('without Break Damage Limit (9,999 a blow, 201 of them) the Eraser takes exactly two swimmers and the last one wins alone: the one-alive rule', () => {
    const party = structuredClone(shinryuBuild);
    for (const m of party.members) m.equipment.weapon = { ...m.equipment.weapon, autoAbilities: m.equipment.weapon.autoAbilities.filter((a) => a !== 'break-damage-limit') };
    const runs = bench(LINES['guide']!, 8, party);
    expect(wins(runs)).toBe(8);
    for (const r of runs) {
      expect(r.erasers, `seed ${r.seed}`).toBe(2);
      expect(r.shattered, `seed ${r.seed}`).toBe(2);
    }
  });
});

describe.runIf(process.env['SHINRYU_MEASURE'] === '1')('the table of record (prints)', () => {
  it('prints every row', () => {
    const rows: Array<[string, Run[]]> = [
      ['shipped, careless', bench(LINES['careless']!, 200)],
      ['shipped, attack', bench(LINES['attack']!, 200)],
      ['shipped, guide', bench(LINES['guide']!, 200)],
      ['shipped, guide, seeds 1000..1099', bench(LINES['guide']!, 100, shinryuBuild, 1000)],
      ['plain weapons + BDL, guide', bench(LINES['guide']!, 200, withPlainWeapons(shinryuBuild))],
      ['no Auto-Haste, guide', bench(LINES['guide']!, 200, withoutAutoHaste(shinryuBuild))],
      ['Flooded Ways swimmers, guide', bench(LINES['guide']!, 200, swimmersBuild)],
    ];
    for (const [label, runs] of rows) {
      console.log(`${label.padEnd(36)} wins ${wins(runs)}/${runs.length} (${winRate(runs)}%) | Erasers ${mean(runs, 'erasers').toFixed(2)} | Shinryu turns ${mean(runs, 'turns').toFixed(2)} | ticks median ${median(runs.map((r) => r.ticks))}`);
    }
    expect(rows.length).toBe(7);
  });
});
