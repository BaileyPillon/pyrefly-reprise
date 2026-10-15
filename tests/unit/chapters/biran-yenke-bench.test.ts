/**
 * **The Biran and Yenke bench** (the hidden chapter; FFX only [AGENTS.md rule 14]): what the shipped advisor line makes of the duel on the real engine and the gate preset, over many seeds,
 * against the line it must beat. Human pace equals bench speed (FFX is CTB: the clock moves only on turns). **Measure, never tune**: every move is the game's own row and the Ronso's numbers are
 * written from Kimahri's (`research/ffx-biran-yenke.md` §2.2); Kimahri's preset is an ESTIMATE (`data/ffx/builds/gagazet-gate.ts`), so if the duel reads too hard or too easy the preset is what
 * may move, inside its stated range, and the move is recorded.
 *
 * The figures the tactic was built against (200 seeds, seeds 1 to 200, measured 2026-10-15): the advisor line wins every seed, learns White Wind on every seed and Mighty Guard on 195 (all eight
 * Rages on the same 195), in a mean of about 44 engine turns, and Kimahri ends no lower than half his HP; attack-only loses every seed it was tried on. The tactic's two reach constants are the
 * bench's own maxima rounded up (the largest breath 1,148 against 1,300, the largest Lancet 136 against 150), pinned below. The bounds are loose on purpose.
 */

import { describe, expect, it } from 'vitest';

import { BREATH_REACH, LANCET_REACH } from '../../../src/engine/tactics/biran-yenke.ts';
import { type DuelReading, attackOnly, intendedLine, pct, runDuel } from '../helpers/ronsoDuel.ts';

const SEEDS = 200;
const sweep = (line: typeof intendedLine, n: number): DuelReading[] => Array.from({ length: n }, (_, i) => runDuel(line, i + 1));
const wins = (runs: readonly DuelReading[]): DuelReading[] => runs.filter((r) => r.outcome === 'victory');
const share = (runs: readonly DuelReading[], f: (r: DuelReading) => boolean): number => runs.filter(f).length / Math.max(1, runs.length);

describe('the advisor\'s line on the real engine and the gate preset (the tactic\'s own bench)', () => {
  const runs = sweep(intendedLine, SEEDS);
  const won = wins(runs);

  it('wins on at least 19 seeds in 20, and a loss is always an ordinary fall, never a stall', () => {
    const learnedAll = runs.filter((r) => r.learned.length === 8).length;
    const turns = won.reduce((a, r) => a + r.turns, 0) / Math.max(1, won.length);
    // eslint-disable-next-line no-console
    console.log(
      `RONSO BENCH advisor (${SEEDS} seeds): wins ${pct(won.length, SEEDS)}, all eight Rages ${pct(learnedAll, SEEDS)}, mean ${turns.toFixed(1)} engine turns, ` +
        `lowest HP at the end ${Math.min(...won.map((r) => r.hpAtEnd)).toFixed(2)}, largest breath ${Math.max(...runs.map((r) => r.maxBreath))}, largest Lancet ${Math.max(...runs.map((r) => r.maxLancet))}`,
    );
    expect(won.length / SEEDS).toBeGreaterThanOrEqual(0.95);
    for (const r of runs.filter((x) => x.outcome !== 'victory')) expect(r.cause, `seed ${r.seed}`).toMatch(/^down:/);
  });

  it('teaches what the chapter is about: White Wind nearly always, Mighty Guard on at least nine seeds in ten, and every Rage it learns is one of the eight', () => {
    expect(share(runs, (r) => r.learned.includes('White Wind'))).toBeGreaterThanOrEqual(0.95);
    expect(share(runs, (r) => r.learned.includes('Mighty Guard'))).toBeGreaterThanOrEqual(0.9);
    const eight = new Set(['Self-Destruct', 'Thrust Kick', 'Doom', 'Mighty Guard', 'Fire Breath', 'Stone Breath', 'Aqua Breath', 'White Wind']);
    for (const r of runs) {
      for (const rage of r.learned) expect(eight.has(rage), `seed ${r.seed}: ${rage}`).toBe(true);
      expect(new Set(r.learned).size, `seed ${r.seed}: a Rage taught twice`).toBe(r.learned.length);
    }
  });

  it('plays the fight it describes: never swings into the guard, spends its gauge on the breaths, and sees the two part', () => {
    for (const r of runs) expect(r.coveredHits, `seed ${r.seed}: an Attack into the guard`).toBe(0);
    expect(share(runs, (r) => (r.rages['aqua-breath'] ?? 0) + (r.rages['fire-breath'] ?? 0) > 0)).toBeGreaterThanOrEqual(0.9);
    expect(share(runs, (r) => r.apart >= 1)).toBeGreaterThanOrEqual(0.9);
    expect(share(runs, (r) => (r.rages['self-destruct'] ?? 0) > 0)).toBe(0);
  });

  it('keeps Kimahri standing: no win ends with him under a fifth of his HP', () => {
    for (const r of won) expect(r.hpAtEnd, `seed ${r.seed}`).toBeGreaterThan(0.2);
  });

  it('the tactic\'s reach constants hold: no breath of Kimahri\'s exceeds BREATH_REACH, no Lancet exceeds LANCET_REACH', () => {
    expect(Math.max(...runs.map((r) => r.maxBreath))).toBeLessThanOrEqual(BREATH_REACH);
    expect(Math.max(...runs.map((r) => r.maxLancet))).toBeLessThanOrEqual(LANCET_REACH);
  });
}, 120_000);

describe('the line it must beat', () => {
  it('attack-only loses: the guard eats the blows and nothing heals Kimahri', () => {
    const runs = sweep(attackOnly, 40);
    // eslint-disable-next-line no-console
    console.log(`RONSO BENCH attack only (40 seeds): wins ${pct(wins(runs).length, 40)}`);
    expect(wins(runs).length / runs.length).toBeLessThanOrEqual(0.05);
  }, 60_000);
});

describe('determinism', () => {
  it('the same seeds give the same readings', () => {
    const a = sweep(intendedLine, 8).map((r) => [r.outcome, r.turns, r.actions, r.learned]);
    const b = sweep(intendedLine, 8).map((r) => [r.outcome, r.turns, r.actions, r.learned]);
    expect(a).toEqual(b);
  });
});
