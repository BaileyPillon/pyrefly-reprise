/**
 * Is the Penance fight winnable? MEASURED, not assumed (FFX only; the hidden Penance chapter; the plan's section 9, the Chapter XXVII bench's method): scripted players (`tests/unit/helpers/penanceBot.ts`) play the real
 * engine to an outcome with **no god mode**, 100 seeds a row (seeds 1000 to 1099), **the boss never tuned**; the only levers are the party's preset (the armour, the bag).
 *
 * **The result, written into the handoff (`docs/handoff/ch-penance.md` section 5) and pinned here as a tripwire, not a target:** on the shipped party **no line wins one battle in a hundred** (the plan's prediction
 * J2, "the advisor's line wins 45 to 85 percent with the Celestial rows", was WRONG: it priced the Celestial rows and not the arms' tempo). The arms act hasted, twice for each of Penance's turns; a standing arm's blow
 * one-shots a 9,999-HP member or Petrifies one, Tera Graviton takes three quarters and Dooms the party, and keeping the arms down (six hits each, every 24 ticks) takes four fifths of the party's actions. If a later change
 * moves these counts, re-measure and update the handoff's section 5, never the bounds alone.
 *
 * Fast rows run by default (the careless line, the two lines that leave the arms alone, the advisor's lock); the slow rows (the arms-only line and the two armour levers) print their table when `PENANCE_MEASURE=1`.
 * `PENANCE_MEASURE=1 npx vitest run tests/unit/chapters/penance-measure.test.ts` prints every row.
 */

import { describe, expect, it } from 'vitest';

import { LINES, playPenance, withArmor, type PenanceRun } from '../helpers/penanceBot.ts';

const SEEDS = Array.from({ length: 100 }, (_, i) => 1000 + i);
const FULL = process.env['PENANCE_MEASURE'] === '1';

const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

function run(line: string, build?: ReturnType<typeof withArmor>): PenanceRun[] {
  return SEEDS.map((seed) => playPenance(seed, LINES[line]!, build));
}

function summary(label: string, runs: PenanceRun[]): string {
  const out = (o: string): number => runs.filter((r) => r.outcome === o).length;
  return `${label.padEnd(34)} win ${out('victory')}/${runs.length} defeat ${out('defeat')} escape ${out('escape')} stalled ${out('stalled')} | reached the change ${runs.filter((r) => r.changed).length} | median ticks ${median(runs.map((r) => r.ticks))} | best dealt ${(12_000_000 - Math.min(...runs.map((r) => r.hp))).toLocaleString()} | Judgment Days ${runs.reduce((a, r) => a + r.judgmentDays, 0)}`;
}

const wins = (runs: PenanceRun[]): number => runs.filter((r) => r.outcome === 'victory').length;
const ended = (runs: PenanceRun[]): boolean => runs.every((r) => r.outcome !== 'stalled');

describe('the shipped party against the scripted lines (100 seeds a row, no god mode)', () => {
  it('the careless line (Attack the first enemy, heal nothing) wins none, and is over within a few turns', () => {
    const runs = run('careless');
    expect(wins(runs)).toBe(0);
    expect(ended(runs)).toBe(true);
    expect(median(runs.map((r) => r.ticks))).toBeLessThan(60);
    if (FULL) console.log(summary('careless, shipped party', runs));
  }, 120_000);

  it('the lines that leave the arms alone win none: Penance\'s first Tera Graviton or Armor Break ends them long before the change', () => {
    for (const line of ['no-arms', 'body-first']) {
      const runs = run(line);
      expect(wins(runs), line).toBe(0);
      expect(ended(runs), line).toBe(true);
      expect(runs.filter((r) => r.changed).length, `${line}: runs that reached the change`).toBeLessThanOrEqual(10);
      if (FULL) console.log(summary(`${line}, shipped party`, runs));
    }
  }, 120_000);

  it('the advisor\'s line (the arm lock: strike a standing arm before anything else, Dispel the Armor-Broken, Cheers from Hyper NulAll) wins none either, but it is the line that gets through the change and takes the Judgment Day rule to its test', () => {
    const runs = run('advisor');
    expect(wins(runs)).toBeLessThanOrEqual(10); // measured 0; a tripwire against the fight becoming easy by accident
    expect(ended(runs)).toBe(true);
    expect(runs.filter((r) => r.changed).length, 'advisor runs that reached the change').toBeGreaterThanOrEqual(10);
    expect(runs.reduce((a, r) => a + r.armDeaths, 0), 'arms fell').toBeGreaterThan(100);
    expect(Math.min(...runs.map((r) => r.hp)), 'the best run took Penance under 9,000,000').toBeLessThan(9_000_000);
    if (FULL) console.log(summary('advisor (lock), shipped party', runs));
  }, 180_000);

  it('the sustain line (what the first measurement left untried: Mighty G for Shell, Protect and Haste on everyone, Shell kept up against Tera Graviton, Yuna leading the heals, the arm lock) wins none either, and gets through the change less often than the advisor on the shipped party (it gives up the five Cheers)', () => {
    const runs = run('sustain');
    expect(wins(runs)).toBeLessThanOrEqual(10); // measured 0
    expect(ended(runs)).toBe(true);
    expect(Math.min(...runs.map((r) => r.hp)), 'the best run took Penance down a good way').toBeLessThan(11_000_000);
    if (FULL) console.log(summary('sustain (lock), shipped party', runs));
  }, 180_000);

  it('the same seed gives the same battle: a line replayed over a handful of seeds is entry for entry the same run', () => {
    for (const seed of [1000, 1007, 1042]) expect(playPenance(seed, LINES['advisor']!)).toEqual(playPenance(seed, LINES['advisor']!));
  }, 120_000);
});

describe.skipIf(!FULL)('the levers (printed only with PENANCE_MEASURE=1): the arms-only line and the guides\' other armour', () => {
  const bhl = (set: string[]) => {
    const b = withArmor(set);
    for (const m of b.members) {
      m.stats = { ...m.stats, hp: 99_999, maxHp: 99_999 };
      m.hp = 99_999;
    }
    return b;
  };

  it('prints the table', () => {
    console.log(summary('arms-only, shipped party', run('arms-only')));
    console.log(summary('advisor, Ribbon (GamerGuides)', run('advisor', withArmor(['auto-haste', 'auto-protect', 'auto-potion', 'ribbon']))));
    console.log(summary('advisor, Ribbon + Break HP Limit', run('advisor', bhl(['auto-haste', 'auto-protect', 'ribbon', 'break-hp-limit']))));
    console.log(summary('sustain-left, shipped party', run('sustain-left')));
    console.log(summary('sustain, Ribbon (GamerGuides)', run('sustain', withArmor(['auto-haste', 'auto-protect', 'auto-potion', 'ribbon']))));
    console.log(summary('sustain, Ribbon + Break HP Limit', run('sustain', bhl(['auto-haste', 'auto-protect', 'ribbon', 'break-hp-limit']))));
    expect(true).toBe(true);
  }, 3_000_000);
});
