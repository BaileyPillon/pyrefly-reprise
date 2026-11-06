/**
 * Spherimorph's winnability, MEASURED (FFX only; the preflight's section 8; the Dark Aeons and Sanctuary Keeper benches' method): scripted players (`tests/unit/helpers/spherimorphBot.ts`) play the real engine with no god
 * mode and the results are pinned as BOUNDS, a tripwire and not a target. **No boss number was touched to get these figures** (rule 6, the product brief's "mechanics never bend"): a line is a plan among the party's own
 * commands, and the one lever is the preset's front line. It is a PUZZLE fight, so the preflight's target differs from the chain's 70 percent band: the informed line (the shipped tactic) should win about 95 percent or
 * more, and a line that guesses should lose almost always. The table of record is the 200-seed run in `docs/handoff/ch-spherimorph.md` section 6
 * (`node --experimental-transform-types tools/spherimorph-bench.mjs --seeds 200`); this file plays 100 seeds for each of the informed and the careless lines and fewer for the slow guessing ones, and prints the 200-seed
 * table when `SPHERIMORPH_BENCH=200` is set. If a later change moves a bound, re-measure and update that section, never the bounds alone.
 */

import { describe, expect, it, vi } from 'vitest';

import { LINES, play, wins } from '../helpers/spherimorphBot.ts';

// A cell is up to 100 fights on the real engine; the slow lines (a guessing player stalls for hundreds of turns) are played at fewer seeds, and on the loaded machine of a full-suite run the default 15 s is too little.
vi.setConfig({ testTimeout: 240_000 });

const SHIPPED = ['tidus', 'yuna', 'lulu'] as const;
const ALTERNATIVE = ['tidus', 'auron', 'lulu'] as const;

describe('every fight reaches a result: seeds 1 to 3, twice over', () => {
  it('the advisor line plays to a victory, and plays the same twice', () => {
    for (const seed of [1, 2, 3]) {
      const a = play(seed, 'advisor');
      const b = play(seed, 'advisor');
      expect(a.outcome, `seed ${seed}`).toBe('victory');
      expect(b, `seed ${seed}`).toEqual(a);
      expect(a.ticks).toBeGreaterThan(0);
    }
  });

  it('a won fight ends with Spherimorph at 0; a lost one with it nearly whole', () => {
    expect(play(1, 'advisor').hp).toBe(0);
    const lost = play(1, 'careless');
    expect(lost.outcome).toBe('defeat');
    expect(lost.hp).toBeGreaterThan(11_000);
  });
});

describe('a player who does not read the answers loses (the preflight\'s prediction: a blind cast feeds it)', () => {
  it('careless (everyone Attacks) wins none of 100', () => {
    expect(wins('careless', SHIPPED, 100).won).toBe(0);
  });

  it('blind (a random element at the highest tier every turn, the care of the skeleton) wins almost none: 5 of 200 on seeds 1 to 200', () => {
    expect(wins('blind', SHIPPED, 40).won).toBeLessThanOrEqual(6);
  });

  it('reading the clue once and trusting it for ever (no re-probe after a shift) wins almost none: the shift makes the clue stale', () => {
    expect(wins('no-reprobe', SHIPPED, 20).won).toBeLessThanOrEqual(2);
  });
});

describe('the informed line (the shipped tactic) wins: probe, read the answer, cast its opposite, probe again', () => {
  it('Tidus, Yuna, Lulu (the shipped front line): 95 of 100 or better (200 of 200 on seeds 1 to 200)', () => {
    const { won, runs } = wins('advisor', SHIPPED, 100);
    expect(won).toBeGreaterThanOrEqual(95);
    for (const r of runs.filter((x) => x.outcome === 'victory')) expect(r.absorbed, `seed ${r.seed}: it takes in no spell of the informed line`).toBe(0);
  });

  it('Tidus, Auron, Lulu (the alternative, the line of the 2026-09-26 Steam session): the same', () => {
    expect(wins('advisor', ALTERNATIVE, 100).won).toBeGreaterThanOrEqual(95);
  });

  it('Protect is not what wins it (the fight is gentle once it is read), and healing matters but is not everything: with no heal at all the informed line wins about two fights in five (88 of 200 on seeds 1 to 200), and with Auron in front, who ends it sooner, still every one', () => {
    expect(wins('no-protect', SHIPPED, 30).won).toBeGreaterThanOrEqual(28);
    const none = wins('no-care', SHIPPED, 60).won;
    expect(none).toBeGreaterThanOrEqual(15);
    expect(none).toBeLessThanOrEqual(40);
    expect(wins('no-care', ALTERNATIVE, 30).won).toBeGreaterThanOrEqual(28);
  });
});

describe.skipIf(process.env['SPHERIMORPH_BENCH'] === undefined)('the table of record (SPHERIMORPH_BENCH=200)', () => {
  it('prints the win rate of every line on both front lines', () => {
    const seeds = Number(process.env['SPHERIMORPH_BENCH']);
    const rows: string[] = [];
    for (const front of [SHIPPED, ALTERNATIVE]) {
      for (const name of Object.keys(LINES)) rows.push(`${front.join('/')} ${name}: ${wins(name, front, seeds).won} of ${seeds}`);
    }
    console.log(rows.join('\n'));
    expect(rows.length).toBe(12);
  });
});
