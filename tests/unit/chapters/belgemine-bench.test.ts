/**
 * **The winnability bench of the hidden Belgemine's Challenge chapter** (FFX only; `docs/handoff/ch-belgemine.md` carries the table of record): each of the eight duels, and the eight chained, played on the real engine by
 * scripted players, 100 seeds a cell, on the three party presets. **Measure, never tune** (rule 15, `docs/plans/ch-belgemine-review.md` section 8): no enemy row is touched; a *line* is a plan among the party's own commands
 * (the shipped tactic, `src/engine/tactics/belgemine.ts`, and a careless one that only Attacks), a *lever* is the party preset (the tier, the aeons owned). The rows print; the pins are what the table of record says, with room:
 *
 * - the shipped tier (`'sin'`, the last sourced canonical block): every duel but Anima's is won by the shipped line on every seed; Anima's by most and the whole chain by nearly all; the careless line wins the first seven duels and loses the Sisters' about half the time, the chain about half;
 * - the tier below it (`'zanarkand'`, the preflight's recommendation) is a wall in the last two acts, the tier above it (`'endgame'`) a walkover: the lever works in both directions;
 * - the line's pieces earn their keep: Cindy first (without it the Sisters' duel stalls), Anima in the party (without her the Sisters are not beaten).
 *
 * The mirror precedent's band (the advisor's line 60 to 80 percent for the chain, a careless line under 20) is printed beside the figures; the shipped tier is above it on both (98 and 50 at the time of writing: the advisor here is a
 * near-perfect player and the careless line one that thinks of nothing, so a real player falls between them), and the handoff says so. Seeds 1 to 100 are the low block; the pins have room for the spread over other blocks.
 */

import { describe, expect, it } from 'vitest';
import { belgemineBuild, belgemineBuildOf } from '../../../src/data/ffx/builds/belgemine.ts';
import { BELGEMINE_INTENDED_LINE } from '../../../src/engine/tactics/belgemine.ts';
import { ACT_KEYS, advisor, careless, rateOfChain, rateOfDuel, share, withoutAeons } from '../helpers/belgemineDrive.ts';

const SEEDS = 100;
const pct = (n: number): string => `${Math.round((n * 100) / SEEDS)}`;

describe(`Belgemine's Challenge bench (${SEEDS} seeds a cell, the shipped tier; measured, not tuned)`, () => {
  const shippedAdvisor = ACT_KEYS.map((k) => [k, rateOfDuel(SEEDS, k, advisor(), belgemineBuild)] as const);
  const shippedCareless = ACT_KEYS.map((k) => [k, rateOfDuel(SEEDS, k, careless, belgemineBuild)] as const);
  const chainAdvisor = rateOfChain(SEEDS, advisor(), belgemineBuild);
  const chainCareless = rateOfChain(SEEDS, careless, belgemineBuild);

  it('every duel on the shipped tier, the shipped line against the careless one: the rows', () => {
    const lines = ['| Duel | Shipped line | Careless | Shipped: aeon KOs a duel |', '|---|---:|---:|---:|'];
    shippedAdvisor.forEach(([k, a], i) => lines.push(`| ${k} | ${a.wins} / ${a.seeds} | ${shippedCareless[i]![1].wins} / ${SEEDS} | ${a.koMean.toFixed(1)} |`));
    lines.push(`| **the chain** | **${chainAdvisor.wins} / ${SEEDS}** (lost in act ${chainAdvisor.lostIn.map((n, i) => (n > 0 ? `${i + 1}: ${n}` : '')).filter(Boolean).join(', ') || 'none'}) | ${chainCareless.wins} / ${SEEDS} (lost in act ${chainCareless.lostIn.map((n, i) => (n > 0 ? `${i + 1}: ${n}` : '')).filter(Boolean).join(', ')}) | |`);
    console.log(`\n${lines.join('\n')}\n`);
    expect(shippedAdvisor).toHaveLength(8);
  });

  it('the shipped line wins the first six duels on every seed, Anima\'s on most and the Sisters\' on most; a duel ends, it never stalls', () => {
    for (const [k, r] of shippedAdvisor) {
      expect(r.unfinished, `${k} stalls`).toBe(0);
      expect(share(r), k).toBeGreaterThanOrEqual(k === 'anima' ? 0.7 : 0.9);
    }
  });

  it('the whole chain: the shipped line wins most of the time; the careless line mostly does not (the Sisters\' duel is where it falls)', () => {
    expect(share(chainAdvisor)).toBeGreaterThanOrEqual(0.85);
    expect(share(chainCareless)).toBeLessThanOrEqual(0.6);
    expect(share(chainAdvisor)).toBeGreaterThan(share(chainCareless) + 0.3);
    expect(chainCareless.lostIn[7]!, 'the careless line is lost at the Sisters').toBeGreaterThan(chainCareless.lostIn.slice(0, 7).reduce((a, b) => a + b, 0));
    expect(chainAdvisor.unfinished).toBeLessThanOrEqual(3);
  });

  it('the party is the lever: the Zanarkand tier is a wall in the last two acts, the endgame tier a walkover', () => {
    const rows: string[] = ['| Tier | Shipped line, the chain | Careless, the chain |', '|---|---:|---:|'];
    const out: Record<string, { a: number; c: number }> = {};
    for (const tier of ['zanarkand', 'sin', 'endgame'] as const) {
      const party = belgemineBuildOf(tier);
      const a = rateOfChain(SEEDS, advisor(), party);
      const c = rateOfChain(SEEDS, careless, party);
      out[tier] = { a: share(a), c: share(c) };
      rows.push(`| ${tier} | ${pct(a.wins)} % | ${pct(c.wins)} % |`);
    }
    console.log(`\n${rows.join('\n')}\n`);
    expect(out['zanarkand']!.a).toBeLessThanOrEqual(0.2);
    expect(out['zanarkand']!.c).toBeLessThanOrEqual(0.05);
    expect(out['endgame']!.a).toBeGreaterThanOrEqual(0.95);
    expect(out['endgame']!.c).toBeGreaterThanOrEqual(0.95);
    expect(out['sin']!.a).toBeGreaterThan(out['zanarkand']!.a);
    expect(out['sin']!.a).toBeLessThanOrEqual(out['endgame']!.a);
  }, 300_000);

  it('the Grand Summon against Anima costs her duel: the shipped line (a plain Summon there) wins it more often than the same line with the Grand Summon', () => {
    const anima = ACT_KEYS.indexOf('anima');
    const withGrand = rateOfDuel(SEEDS, 'anima', advisor({ ...BELGEMINE_INTENDED_LINE, noGrandSummonVs: [] }), belgemineBuild);
    console.log(`\nAnima, ${SEEDS} seeds: plain Summon ${shippedAdvisor[anima]![1].wins}, Grand Summon ${withGrand.wins}\n`);
    expect(shippedAdvisor[anima]![1].wins).toBeGreaterThan(withGrand.wins);
  }, 300_000);

  it('what each piece of the line is worth, on the chain: Cindy first, the Grand Summon, Dismiss, Anima in the party', () => {
    const base = share(chainAdvisor);
    const rows: Array<[string, number]> = [
      ['Cindy first (shipped)', base],
      ['weakest Sister first', share(rateOfChain(SEEDS, advisor({ ...BELGEMINE_INTENDED_LINE, sistersTarget: 'weakest' }), belgemineBuild))],
      ['no Grand Summon', share(rateOfChain(SEEDS, advisor({ ...BELGEMINE_INTENDED_LINE, grandSummon: false }), belgemineBuild))],
      ['no Shield before the big move', share(rateOfChain(SEEDS, advisor({ ...BELGEMINE_INTENDED_LINE, shieldWhenDue: false }), belgemineBuild))],
      ['Dismiss an aeon under a third of its HP', share(rateOfChain(SEEDS, advisor({ ...BELGEMINE_INTENDED_LINE, dismissUnder: 0.33 }), belgemineBuild))],
      ['Anima not owned', share(rateOfChain(SEEDS, advisor(), withoutAeons(belgemineBuild, ['anima'])))],
      ['Grand Summon against Anima too', share(rateOfChain(SEEDS, advisor({ ...BELGEMINE_INTENDED_LINE, noGrandSummonVs: [] }), belgemineBuild))],
      ['no Overdrive against Anima', share(rateOfChain(SEEDS, advisor({ ...BELGEMINE_INTENDED_LINE, holdOverdriveVs: ['belg-anima'] }), belgemineBuild))],
    ];
    console.log(`\n| Line | Chain wins |\n|---|---:|\n${rows.map(([n, s]) => `| ${n} | ${Math.round(s * 100)} % |`).join('\n')}\n`);
    expect(rows[1]![1], 'weakest-first loses ground to Cindy-first').toBeLessThan(base - 0.1);
    expect(rows[4]![1], 'a Dismiss costs more than it saves').toBeLessThan(base);
    expect(rows[5]![1], 'the Sisters are not beaten without Anima').toBeLessThanOrEqual(0.1);
    expect(rows[7]![1], 'holding every Overdrive against Anima costs the chain (measured: the loss moves to the Sisters)').toBeLessThan(base - 0.1);
  }, 300_000);
});
