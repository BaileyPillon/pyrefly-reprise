/**
 * The Oblitzerator's winnability, MEASURED (FFX only; the preflight's section 8 and AGENTS.md rule 15): scripted players play the real engine to an outcome with no god mode (`tests/unit/helpers/oblitzeratorBot.ts`,
 * the same one `node --experimental-transform-types tools/oblitzerator-bench.mjs` prints). **No boss number is touched**: the levers are the build fraction and the bag. The preflight's target is a tutorial-grade fight: the
 * **crane line wins at least 95 percent**; the slog (no crane), with and without the cures, and the naive line (no crane, no care) are reported, not tuned.
 *
 * The bounds below are a tripwire, not a target: if a later change moves them, re-measure with the tool and update the handoff's table (section 6 of `docs/handoff/ch-oblitzerator.md`), never the bounds alone. The 200-seed
 * table is printed behind `OBLITZERATOR_BENCH=200` (about 80 s).
 */

import { describe, expect, it } from 'vitest';

import { lucaBuildAt } from '../../../src/data/ffx/builds/luca.ts';
import { LINES, bench, benchTactic, play, winRate } from '../helpers/oblitzeratorBot.ts';

const SEEDS = 40;

describe('the lines, 40 seeds each at the shipped build (stop 3 of ten)', () => {
  it('the crane line wins every fight, in about thirteen decisions, with one Rush thrown and nobody falling (the preflight\'s target: 95 percent)', () => {
    const runs = bench(LINES['crane']!, SEEDS);
    expect(winRate(runs)).toBeGreaterThanOrEqual(95);
    expect(runs.every((r) => r.rushes <= 2)).toBe(true);
    expect(runs.every((r) => r.koCount === 0)).toBe(true);
    expect(runs.every((r) => r.crane === 2)).toBe(true);
    const med = [...runs.map((r) => r.decisions)].sort((a, b) => a - b)[Math.floor(runs.length / 2)]!;
    expect(med).toBeGreaterThanOrEqual(10);
    expect(med).toBeLessThanOrEqual(17);
  });

  it('the line the game ships (the registered tactic through the generic ladder) wins exactly as the bench\'s crane line does', () => {
    const shipped = benchTactic(SEEDS);
    const ours = bench(LINES['crane']!, SEEDS);
    expect(winRate(shipped)).toBeGreaterThanOrEqual(95);
    expect(shipped.map((r) => [r.outcome, r.decisions])).toEqual(ours.map((r) => [r.outcome, r.decisions]));
  });

  it('the ablations of the crane line: no care and no Haste still win (care matters only after a spread of balls; Haste only sooner); wrong spells never wake it', () => {
    expect(winRate(bench(LINES['crane-no-care']!, SEEDS))).toBeGreaterThanOrEqual(95);
    expect(winRate(bench(LINES['crane-no-haste']!, SEEDS))).toBeGreaterThanOrEqual(95);
    const wrong = bench(LINES['wrong-spells']!, SEEDS);
    expect(winRate(wrong)).toBe(0); // Fire, Blizzard and Water at the crane do nothing: it is dark to the end
    expect(wrong.every((r) => r.crane === 0)).toBe(true);
  });

  it('the slog (no crane, with care and the cures the guides name) is reported: it wins, at about two and a half times the decisions and seven Rushes; without the cures a Silenced Lulu or a Darkened swinger costs it a few fights', () => {
    const runs = bench(LINES['slog-cure']!, SEEDS);
    expect(winRate(runs)).toBeGreaterThanOrEqual(90);
    expect(winRate(bench(LINES['slog']!, SEEDS))).toBeGreaterThanOrEqual(75);
    const med = [...runs.map((r) => r.decisions)].sort((a, b) => a - b)[Math.floor(runs.length / 2)]!;
    expect(med).toBeGreaterThan(20);
    expect(runs.reduce((n, r) => n + r.rushes, 0) / runs.length).toBeGreaterThan(4);
    expect(runs.every((r) => r.crane === 0)).toBe(true);
  });

  it('the naive line (no crane, no care) and the careless line lose most fights: the machine\'s speed-up and its Rush are not forgiving to a party that does not heal', () => {
    expect(winRate(bench(LINES['naive']!, SEEDS))).toBeLessThan(25);
    expect(winRate(bench(LINES['careless']!, SEEDS))).toBeLessThan(10);
    expect(winRate(bench(LINES['no-thunder']!, SEEDS))).toBeLessThan(35);
  });
});

describe('the lower bound: the raw start records (stop 0)', () => {
  it('the crane line still wins every fight; the slog is a long shot (about 17 percent without the cures and 26 percent with them, measured over 200 seeds)', () => {
    expect(winRate(bench(LINES['crane']!, SEEDS, lucaBuildAt(0)))).toBeGreaterThanOrEqual(95);
    expect(winRate(bench(LINES['slog']!, SEEDS, lucaBuildAt(0)))).toBeLessThan(50);
    expect(winRate(bench(LINES['slog-cure']!, SEEDS, lucaBuildAt(0)))).toBeLessThan(60);
  });
});

describe('the engine is deterministic and the bench is honest', () => {
  it('the same seed gives the same run twice', () => {
    expect(play(17, LINES['crane']!)).toEqual(play(17, LINES['crane']!));
    expect(play(17, LINES['slog']!)).toEqual(play(17, LINES['slog']!));
  });

  it('every run ends in a result (no stall) on the lines that play the fight through', () => {
    for (const name of ['careless', 'naive', 'slog', 'slog-cure', 'crane']) {
      for (const r of bench(LINES[name]!, 10)) expect(r.outcome, `${name} seed ${r.seed}`).not.toBe('stalled');
    }
  });
});

describe.skipIf(process.env['OBLITZERATOR_BENCH'] === undefined)('the 200-seed table (OBLITZERATOR_BENCH=200)', () => {
  it('prints the table', () => {
    const seeds = Number(process.env['OBLITZERATOR_BENCH']);
    const rows: string[] = ['| line | wins | rate |', '|---|---:|---:|'];
    for (const name of Object.keys(LINES)) {
      const runs = bench(LINES[name]!, seeds);
      rows.push(`| ${name} | ${runs.filter((r) => r.outcome === 'victory').length} / ${seeds} | ${winRate(runs)}% |`);
    }
    console.log(rows.join('\n'));
    expect(rows.length).toBeGreaterThan(2);
  }, 600_000);
});
