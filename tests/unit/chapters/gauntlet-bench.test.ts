/**
 * **The bench of the hidden Gauntlet chapter's tier 1** (FFX only; chapter 54; stage 2), pinned on the real engine with the harness the table's tool uses (`tests/unit/helpers/gauntletBench.ts`,
 * `tools/gauntlet-bench.mjs`). The committed table is 100 seeds a cell (`docs/handoff/ch-gauntlet.md`); this test plays a few seeds of each cell so a change to the engine, the data, the tactic or the party that moves
 * a result shows here. **No boss row is ever touched**: a cell is a choice of line or of the party's own estimate.
 *
 * What it pins (all measured, preflight section 8: the plan's target was about 70 percent per act): at the shipped preset the three area creations are won every time by the advisor's line, with Yojimbo's Zanmato and
 * without, and by the careless line (the preflight's own prediction 1); the party's stat estimate is the lever that moves them (a cliff between a quarter and a half of the caps for the careless line, and the
 * advisor's line holds on far below it).
 */
import { describe, expect, it } from 'vitest';

import { gauntletBuild } from '../../../src/data/ffx/builds/gauntlet.ts';

import {
  ABLATIONS, BUILT, actRate, ablatedLine, advisorLine, carelessLine, chainRate, playChain, share, withKills, withStatFraction,
} from '../helpers/gauntletBench.ts';

const SEEDS = 12;

describe('the harness', () => {
  it('the acts built are the three of tier 1; every named ablation builds a line; an unknown one is refused', () => {
    expect(BUILT).toEqual(['cactuar-king', 'don-tonberry', 'jormungand']);
    for (const name of Object.keys(ABLATIONS)) expect(typeof ablatedLine(name)).toBe('function');
    expect(typeof ablatedLine('no-zanmato', 'no-fodder')).toBe('function');
    expect(() => ablatedLine('nonsense')).toThrow(/no ablation/);
  });
});

describe('tier 1 at the shipped preset: every act is won, by every line', () => {
  for (const creature of BUILT) {
    it(`${creature}: the advisor's line, the line with Yojimbo against every act, the line without him and the careless line win all ${SEEDS} seeds, none unfinished`, () => {
      for (const [name, line] of [['advisor', advisorLine], ['zanmato-all', ablatedLine('zanmato-all')], ['no-zanmato', ablatedLine('no-zanmato')], ['careless', carelessLine]] as const) {
        const r = actRate(SEEDS, creature, line);
        expect([name, r.wins, r.losses, r.escapes, r.unfinished], creature).toEqual([name, SEEDS, 0, 0, 0]);
      }
    });
  }

  it('the chain of the three: won by the advisor\'s line and the careless line on every seed (the carry between the acts, the kill counts included)', () => {
    for (const [name, line] of [['advisor', advisorLine], ['careless', carelessLine]] as const) {
      const r = chainRate(SEEDS, line);
      expect([name, r.wins, r.lostAt], name).toEqual([name, SEEDS, [0, 0, 0, 0]]);
    }
    const one = playChain(1, advisorLine);
    expect(one.outcome).toBe('victory');
    expect(one.fights.map((f) => f.outcome)).toEqual(['victory', 'victory', 'victory']);
  });
});

describe('the levers: the stat estimate moves the careless line off a cliff, and the advisor\'s line holds', () => {
  it('at a quarter of the stat caps the careless line loses the Cactuar King and Don Tonberry on nearly every seed, the advisor\'s line wins them (measured over 100 seeds: 6 and 0 against 96 and 100)', () => {
    const weak = withStatFraction(gauntletBuild, 0.25);
    expect(share(actRate(SEEDS, 'cactuar-king', carelessLine, weak))).toBeLessThanOrEqual(0.25);
    expect(share(actRate(SEEDS, 'don-tonberry', carelessLine, weak))).toBeLessThanOrEqual(0.15);
    expect(share(actRate(SEEDS, 'cactuar-king', advisorLine, weak))).toBeGreaterThanOrEqual(0.75); // 96 of 100 measured: the King's counters cost a member or two a fight
    expect(share(actRate(SEEDS, 'don-tonberry', advisorLine, weak))).toBeGreaterThanOrEqual(0.9);
    expect(share(actRate(SEEDS, 'jormungand', advisorLine, weak))).toBeGreaterThanOrEqual(0.9);
  });

  it('a party with no kill count takes Karma\'s teeth: Don Tonberry\'s walk-in costs the careless line nothing (the build holds the number, preflight GA5)', () => {
    const weakNoKills = withKills(withStatFraction(gauntletBuild, 0.25), 0);
    const weak = withStatFraction(gauntletBuild, 0.25);
    expect(share(actRate(SEEDS, 'don-tonberry', carelessLine, weakNoKills))).toBeGreaterThan(share(actRate(SEEDS, 'don-tonberry', carelessLine, weak)));
  });
});
