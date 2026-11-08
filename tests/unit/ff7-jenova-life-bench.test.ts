/**
 * The winnability bench for Jenova LIFE (hidden chapter 44; FF7 only), as a test: 100 seeds of the scripted players against the
 * bands that were fixed **before the first run** (`docs/plans/ch-jenova-life-review.md` section 8). Nothing here tunes a number:
 * if a band fails, the levers in order are the party's stock, Materia and level, never hers (PRODUCT-BRIEF "mechanics never bend").
 * The full 200-seed tables, the three modes and the timed player are `tools/ff7-jenova-bench.mjs` (`docs/handoff/ch-jenova-life.md`).
 */

import { describe, expect, it } from 'vitest';
import {
  attackOnlyPolicy, distractedPolicy, jenovaSensiblePolicy, runFf7Battle, sensibleQuakePolicy, spamMagicPolicy, summarizeJenovaRun, TICKS_PER_SECOND,
  type Ff7Policy, type JenovaRunSummary,
} from '../../src/battle/ff7/index.ts';
import { JL_REG, jlSetup } from './helpers/jenova.ts';

const SEEDS = 100;
const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

function bench(policy: (seed: number) => Ff7Policy, mode: 'active' | 'recommended' | 'wait' = 'recommended'): JenovaRunSummary[] {
  const rows: JenovaRunSummary[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) rows.push(summarizeJenovaRun(runFf7Battle({ setup: jlSetup(seed), registry: JL_REG, policy: policy(seed), atbMode: mode })));
  return rows;
}

const wins = (rows: JenovaRunSummary[]): JenovaRunSummary[] => rows.filter((r) => r.outcome === 'victory');

describe('the pre-registered bands (review section 8)', () => {
  const sensible = bench(() => jenovaSensiblePolicy);

  it('sensible: wins at least 95%, the median win takes 60 to 150 s, and at most half a member falls per win', () => {
    expect(wins(sensible).length / SEEDS).toBeGreaterThanOrEqual(0.95);
    const secs = median(wins(sensible).map((r) => r.ticks)) / TICKS_PER_SECOND;
    expect(secs).toBeGreaterThanOrEqual(60);
    expect(secs).toBeLessThanOrEqual(150);
    const kos = wins(sensible).reduce((n, r) => n + r.kos, 0) / wins(sensible).length;
    expect(kos).toBeLessThanOrEqual(0.5);
  });

  it('sensible with Cloud\'s Quake2 opener: the same band', () => {
    const rows = bench(() => sensibleQuakePolicy);
    expect(wins(rows).length / SEEDS).toBeGreaterThanOrEqual(0.95);
    expect(rows.every((r) => r.reflectedCasts === 0)).toBe(true); // it opens on the free hit and then puts the spells away
  });

  it('distracted ("a party playing badly"): wins at least half', () => {
    const rows = bench((seed) => distractedPolicy(seed));
    expect(wins(rows).length / SEEDS).toBeGreaterThanOrEqual(0.5);
    expect(rows.reduce((n, r) => n + r.reflectedCasts, 0)).toBeGreaterThan(SEEDS); // it does cast into the Reflect, and pays for it
  });

  it('attack-only (never a heal, an item or a spell) is the floor and is reported, not gated: it loses most fights, because the healing is what the preset leans on', () => {
    const rows = bench(() => attackOnlyPolicy);
    expect(wins(rows).length / SEEDS).toBeLessThan(0.5);
    expect(rows.every((r) => r.reflectedCasts === 0)).toBe(true);
  });

  it('spam-magic is reported and not gated, but it is the lesson: the bounces take the party apart long before she is hurt', () => {
    const rows = bench(() => spamMagicPolicy);
    expect(wins(rows).length / SEEDS).toBeLessThan(0.1);
    expect(rows.every((r) => r.reflectedCasts > 0)).toBe(true);
  });

  it('the three Config modes give the same fights at zero decision time (Active and Wait on the first 40 seeds)', () => {
    for (const mode of ['active', 'wait'] as const) {
      const rows = bench(() => jenovaSensiblePolicy, mode).slice(0, 40);
      expect(rows.map((r) => [r.outcome, r.turns])).toEqual(sensible.slice(0, 40).map((r) => [r.outcome, r.turns]));
    }
  });

  it('Jenova uses what she is meant to: a double Blue Light in some battles, Aqualung in most, one Reflect at most', () => {
    expect(sensible.some((r) => r.doubleBlueLights > 0)).toBe(true);
    expect(sensible.filter((r) => r.aqualungs > 0).length / SEEDS).toBeGreaterThan(0.6);
    expect(sensible.every((r) => r.reflectsCast <= 1)).toBe(true);
  });
});
