/**
 * The hidden Spectral Keeper chapter's winnability, MEASURED (FFX only; the ch-keeper review's major 2, the paper preflight's T10: "a bench of scripted lines"). The engine test's old victory case is god mode (every member reset
 * to 99,999 HP each step), so it proves the payout and nothing about whether the party can win. These cases play the real engine with the shipped `zanarkandBuild` (an `[estimate]` snapshot with a sourced build point) and the
 * scripted players of `../helpers/keeperBot.ts`, no god mode.
 *
 * What is pinned is a MEASURED LINE, not a design target: the boss's numbers are sourced (`research/re-ffx-spectral-keeper.md`) and the party's are not ours to tune (rule 6, "mechanics never bend"). If a later change moves
 * these bounds, re-measure and update `docs/handoff/ch-keeper.md` section 5a; do not edit the bounds to make the test pass. To print the full table: `KEEPER_MEASURE=300 npx vitest run tests/unit/chapters/spectral-keeper-measure.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import { POLICIES, partyWithHp, playBot, type BotRun } from '../helpers/keeperBot.ts';

const policy = (name: string) => POLICIES.find((p) => p.name === name)!;
const BEST = policy('aeons, dodge, heal');
const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[xs.length >> 1] ?? 0;

describe('the harness plays the real engine to an outcome, no god mode', () => {
  it('every policy ends every battle (no stall, no exception) and the Keeper never ends below 0', () => {
    for (const p of POLICIES) {
      for (const seed of [3, 4, 5, 6]) {
        const run = playBot(seed, p);
        expect(run.outcome, `${p.name} seed ${seed}`).not.toBe('stalled');
        expect(run.dealt).toBeGreaterThanOrEqual(0);
        expect(run.dealt).toBeLessThanOrEqual(52_000);
      }
    }
  });
});

describe('the measured line on the shipped build (seeds 1000 to 1039)', () => {
  const runs = new Map<string, BotRun[]>();
  const of = (name: string): BotRun[] => {
    let r = runs.get(name);
    if (!r) {
      r = Array.from({ length: 40 }, (_, i) => playBot(1000 + i, policy(name)));
      runs.set(name, r);
    }
    return r;
  };

  it('standing still or only swinging never wins, and the party is swept before it does 10 percent of the Keeper', () => {
    expect(of('defend only').filter((r) => r.outcome === 'victory').length).toBe(0);
    const swing = of('attack only');
    expect(swing.filter((r) => r.outcome === 'victory').length).toBe(0);
    expect(median(swing.map((r) => r.dealt))).toBeLessThan(5_200);
  });

  it('no line that skips the aeons wins either (healing, Overdrives, stepping out of the zone and off the lit glyphs included)', () => {
    for (const name of ['attack, heal, overdrive', 'dodge, heal, overdrive']) {
      expect(of(name).filter((r) => r.outcome === 'victory').length, name).toBe(0);
    }
  });

  it('the best crude line (aeons, stepping out of the zone, healing) is WINNABLE but hard: a few wins in 40, a median of about half the Keeper', () => {
    const best = of(BEST.name);
    const wins = best.filter((r) => r.outcome === 'victory').length;
    expect(wins).toBeGreaterThanOrEqual(1); // winnable without god mode: a lower bound
    expect(wins).toBeLessThanOrEqual(10); // and not a walkover: a later change that makes it easy must re-measure
    const med = median(best.map((r) => r.dealt));
    expect(med).toBeGreaterThan(10_000);
    expect(med).toBeLessThan(40_000);
  });

  it('a real win pays the sourced spoils with nobody made invincible (7,000 gil, at least 12,000 AP)', () => {
    const win = of(BEST.name).find((r) => r.outcome === 'victory');
    expect(win).toBeDefined();
    expect(win!.gil).toBe(7_000);
    expect(win!.ap).toBeGreaterThanOrEqual(12_000);
    expect(win!.dealt).toBe(52_000);
    expect(playBot(win!.seed, BEST).outcome).toBe('victory'); // and it replays
  });
});

describe.skipIf(!process.env.KEEPER_MEASURE)('the full table (KEEPER_MEASURE=<seeds>)', () => {
  it('prints it', () => {
    const n = Number(process.env.KEEPER_MEASURE) || 100;
    const lines: string[] = [];
    for (const k of [1, 1.5, 2, 3]) {
      for (const p of POLICIES) {
        const party = partyWithHp(k);
        const rs = Array.from({ length: n }, (_, i) => playBot(1000 + i, p, party));
        const dealt = rs.map((r) => r.dealt).sort((a, b) => a - b);
        lines.push(`party HP x${k} | ${p.name.padEnd(24)} | wins ${String(rs.filter((r) => r.outcome === 'victory').length).padStart(3)}/${n} | dealt p10 ${dealt[Math.floor(n * 0.1)]} median ${dealt[n >> 1]} p90 ${dealt[Math.floor(n * 0.9)]} max ${dealt[n - 1]}`);
      }
    }
    console.log(lines.join('\n'));
    expect(lines.length).toBeGreaterThan(0);
  }, 900_000);
});
