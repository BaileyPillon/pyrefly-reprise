/**
 * The hidden Sanctuary Keeper's winnability, MEASURED (FFX only; the preflight's section 8; the Dark Aeons bench's method): scripted players (`tests/unit/helpers/sanctuaryBot.ts`) play the real engine with no god mode and the
 * results are pinned as BOUNDS, a tripwire and not a target. **No boss number was touched to get these figures** (rule 6, the product brief's "mechanics never bend"): the levers are the party's own commands, the front line,
 * Luck and the bag. The table of record is the 200-seed run in `docs/handoff/ch-sanctuary-keeper.md` section 5 (`node --experimental-transform-types tools/sanctuary-keeper-bench.mjs --seeds 200`); this file plays 60 seeds a
 * cell so the suite stays quick, and prints the 200-seed table when `SANCTUARY_BENCH=200` is set. If a later change moves a bound, re-measure and update that section, never the bounds alone.
 */

import { describe, expect, it, vi } from 'vitest';

import { LINES, bench, buildWith, play, winRate } from '../helpers/sanctuaryBot.ts';
import { sanctuaryKeeperBuild } from '../../../src/data/ffx/builds/sanctuary-keeper.ts';

// A cell is 60 seeds on the real engine and a test plays up to three cells: on the loaded machine of a full-suite run (three workers beside other work) one test ran past the 15 s default, so the budget is explicit.
vi.setConfig({ testTimeout: 240_000 });

const SEEDS = 60;
const cells = new Map<string, number>();
/** Wins of a line over seeds 1 to 60 (each cell is played once per file: the runs are deterministic, so a repeat would only repeat the cost). */
const wins = (name: string, party = sanctuaryKeeperBuild): number => {
  const key = `${name}|${party.activeSlots.join(',')}`;
  const known = cells.get(key);
  if (known !== undefined) return known;
  const n = bench(LINES[name]!, SEEDS, party).filter((r) => r.outcome === 'victory').length;
  cells.set(key, n);
  return n;
};

describe('every fight reaches a result: seeds 1 to 3, twice over', () => {
  it('the advisor\'s line plays to a victory or a defeat, never a stall, and plays the same twice', () => {
    for (const seed of [1, 2, 3]) {
      const a = play(seed, LINES['advisor']!);
      const b = play(seed, LINES['advisor']!);
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(a.outcome);
      expect(b, `seed ${seed}`).toEqual(a);
      expect(a.ticks).toBeGreaterThan(0);
    }
  });

  it('a won fight ends with the Keeper at 0 and a lost one with the party down', () => {
    const won = bench(LINES['advisor']!, 12).find((r) => r.outcome === 'victory');
    expect(won?.hp).toBe(0);
    const lost = bench(LINES['careless']!, 3)[0]!;
    expect(lost.outcome).toBe('defeat');
    expect(lost.hp).toBeGreaterThan(30_000);
  });
});

describe('the plain lines lose outright (the preflight\'s prediction 1: plain blows cannot outrun the healing)', () => {
  it('careless (everyone Attacks) and plain (care and Attack) win none of 60', () => {
    expect(wins('careless')).toBe(0);
    expect(wins('plain')).toBe(0);
  });
});

describe('the guides\' line: Reflect and Poison are what win it', () => {
  it('Tidus, Yuna, Auron (the shipped front line): the advisor wins a good share (the preflight\'s band is 60 to 80 percent; 60 seeds is noisy, so the bound is wide and not fitted to this block: seeds 1 to 60 give 33, other 200-seed blocks give 69 to 80 percent)', () => {
    const w = wins('advisor');
    expect(w).toBeGreaterThanOrEqual(25);
    expect(w).toBeLessThanOrEqual(57);
  });

  it('...and each of Reflect and Poison is a mover: without Poison it wins almost none, without Reflect it wins clearly fewer', () => {
    const full = wins('advisor');
    expect(wins('no-poison')).toBeLessThanOrEqual(5);
    expect(wins('no-reflect')).toBeLessThan(full - 5);
  });

  it('Tidus, Yuna, Lulu (the preflight\'s first pick): the same line wins far less (Lulu\'s Bio is a poison, but Auron\'s Armor Break is the damage)', () => {
    const lulu = wins('advisor', buildWith(['tidus', 'yuna', 'lulu']));
    expect(lulu).toBeGreaterThanOrEqual(1);
    expect(lulu).toBeLessThanOrEqual(25);
    expect(lulu).toBeLessThan(wins('advisor'));
  });
});

describe.skipIf(process.env['SANCTUARY_BENCH'] === undefined)('the table of record (SANCTUARY_BENCH=200)', () => {
  it('prints the win rate of every line on both front lines', () => {
    const seeds = Number(process.env['SANCTUARY_BENCH']);
    const rows: string[] = [];
    for (const front of [['tidus', 'yuna', 'auron'], ['tidus', 'yuna', 'lulu']] as Array<[string, string, string]>) {
      for (const [name, line] of Object.entries(LINES)) rows.push(`${front.join('/')} ${name}: ${winRate(bench(line, seeds, buildWith(front)))}%`);
    }
    console.log(rows.join('\n'));
    expect(rows.length).toBe(16);
  });
});
