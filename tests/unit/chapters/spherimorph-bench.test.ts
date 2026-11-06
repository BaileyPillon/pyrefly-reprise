/**
 * Spherimorph's winnability, MEASURED (FFX only; the preflight's section 8; the Dark Aeons and Sanctuary Keeper benches' method): scripted players (`tests/unit/helpers/spherimorphBot.ts`) play the real engine with no god
 * mode and the results are pinned as BOUNDS, a tripwire and not a target. **No boss number was touched to get these figures** (rule 6, the product brief's "mechanics never bend"): a line is a plan among the party's own
 * commands, and the one lever is the preset's front line. It is a PUZZLE fight, so the preflight's target differs from the chain's 70 percent band: the informed line (the shipped tactic) should win about 95 percent or
 * more, and a line that guesses should lose almost always. The table of record is the 200-seed run in `docs/handoff/ch-spherimorph.md` section 6
 * (`node --experimental-transform-types tools/spherimorph-bench.mjs --seeds 200`); this file plays 100 seeds for each of the informed and the careless lines and fewer for the slow guessing ones, and prints the 200-seed
 * table when `SPHERIMORPH_BENCH=200` is set. If a later change moves a bound, re-measure and update that section, never the bounds alone.
 *
 * **The puzzle is one of three ways through, and the bench says so (the review of 2026-11-06, M1).** Two lines never read the clue and are the game's own rules, not guesses: **poison** (one Poison Fang: it lands on it and
 * ticks 600 a turn) and **brute** (Auron's Armor Break once, then plain blows: a plain blow never shifts it and is only ever answered on the one who struck). The Temple's bag has two Poison Fangs and one throw then
 * Defend wins every fight with no healing at all, so the Woods' bag does not carry them (`builds/spherimorph.ts`, a lever on an estimate, the driver's call); the brute line wins either way and no preset lever
 * removes it, because the numbers are the game's. Both are pinned below as what they are: disclosed, not tuned.
 */

import { describe, expect, it, vi } from 'vitest';

import { spherimorphBuild } from '../../../src/data/ffx/builds/spherimorph.ts';
import { macalaniaBuild } from '../../../src/data/ffx/builds/macalania.ts';
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

  it('Protect is not what wins it (the fight is gentle once it is read), and healing matters but is not everything: with no heal at all the informed line wins about one fight in two (94 of 200 on seeds 1 to 200), and with Auron in front, who ends it sooner, still every one', () => {
    expect(wins('no-protect', SHIPPED, 30).won).toBeGreaterThanOrEqual(28);
    const none = wins('no-care', SHIPPED, 60).won;
    expect(none).toBeGreaterThanOrEqual(15);
    expect(none).toBeLessThanOrEqual(40);
    expect(wins('no-care', ALTERNATIVE, 30).won).toBeGreaterThanOrEqual(28);
  });
});

describe(`the lines that never read the clue: disclosed, not tuned (the review's M1)`, () => {
  it(`the Woods' bag is the Temple's bag with its two Poison Fangs taken out, and nothing else changed`, () => {
    const temple = macalaniaBuild.inventory;
    expect(temple.find((s) => s.itemId === 'poison-fang')?.count).toBe(2);
    expect(spherimorphBuild.inventory.find((s) => s.itemId === 'poison-fang')).toBeUndefined();
    expect(spherimorphBuild.inventory).toEqual(temple.filter((s) => s.itemId !== 'poison-fang'));
  });

  it(`on the Temple's bag ONE Poison Fang and then Defend wins every fight, with no healing at all, without ever reading the clue: why the Woods' bag has no Fangs (200 of 200 on seeds 1 to 200, median 71 decisions)`, () => {
    expect(wins('poison', SHIPPED, 20, 1, 'temple').won).toBeGreaterThanOrEqual(19);
    expect(wins('poison-no-care', SHIPPED, 20, 1, 'temple').won).toBeGreaterThanOrEqual(19);
  });

  it(`on the Woods' bag (no Fang to throw) the same line wins none: it stalls, or the party falls with no healing`, () => {
    expect(wins('poison', SHIPPED, 5).won).toBe(0);
    expect(wins('poison-no-care', SHIPPED, 5).won).toBe(0);
  });

  it(`brute (Auron's Armor Break once, then plain blows, healing as it goes) wins whatever the bag: every fight of the shipped line after a Switch for Auron, about nineteen in twenty with Auron already in front (200 of 200 and 190 of 200 on seeds 1 to 200; 64 decisions against the puzzle's 23)`, () => {
    expect(wins('brute', SHIPPED, 40).won).toBeGreaterThanOrEqual(38);
    expect(wins('brute', ALTERNATIVE, 40).won).toBeGreaterThanOrEqual(34);
    expect(wins('brute', SHIPPED, 20, 1, 'temple').won).toBeGreaterThanOrEqual(19);
  });

  it('the siege is the slow way: it takes at least twice the decisions of the informed line', () => {
    const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
    const brute = median(wins('brute', SHIPPED, 20).runs.map((r) => r.decisions));
    const informed = median(wins('advisor', SHIPPED, 20).runs.map((r) => r.decisions));
    expect(brute).toBeGreaterThanOrEqual(informed * 2);
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
    expect(rows.length).toBe(18);
  });
});
