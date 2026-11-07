/**
 * The hidden Wendigo chapter's winnability, MEASURED (FFX only; the preflight's section 9; the Sanctuary Keeper's bench method): scripted players (`tests/unit/helpers/wendigoBot.ts`) play the real engine to an outcome, no
 * god mode. **The target is not the chain's 70 percent band**: this fight is a status puzzle with one-shot damage, so the sourced line (the advisor) should win about 90 percent or more, and an unmanaged line (Attack only,
 * no status work) should lose almost always. **No boss number was touched to get these figures** (rule 6, the product brief's "mechanics never bend"): the levers would have been the Phoenix Down and Hi-Potion stock,
 * Yuna's Protect and Shell, the front line and the Petrify Grenades, in that order; none was needed. The table of record is the 200-seed run in `docs/handoff/ch-wendigo.md`
 * (`node --experimental-transform-types tools/wendigo-bench.mjs --seeds 200 --tactic`); this file plays 100 seeds for the lines that carry the claim and fewer for the ablations, and pins BOUNDS (a tripwire, not a
 * target). If a later change moves a bound, re-measure and update the handoff, never the bounds alone.
 */

import { describe, expect, it, vi } from 'vitest';

import { LINES, bench, benchTactic, buildWith, play, playTactic, winRate } from '../helpers/wendigoBot.ts';
import { wendigoBuild } from '../../../src/data/ffx/builds/wendigo.ts';

// A cell is up to 100 fights on the real engine; on the loaded machine of a full-suite run (three workers beside other work) one test ran far longer than alone.
vi.setConfig({ testTimeout: 240_000 });

const cells = new Map<string, ReturnType<typeof bench>>();
/** Seeds 1 to `seeds` of a line (each cell is played once per file: the runs are deterministic, so a repeat would only repeat the cost). */
const runs = (name: string, seeds: number, party = wendigoBuild): ReturnType<typeof bench> => {
  const key = `${name}|${party.activeSlots.join(',')}|${seeds}`;
  const known = cells.get(key);
  if (known !== undefined) return known;
  const out = bench(LINES[name]!, seeds, party);
  cells.set(key, out);
  return out;
};
const wins = (name: string, seeds: number, party = wendigoBuild): number => runs(name, seeds, party).filter((r) => r.outcome === 'victory').length;

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

  it('a won fight ends with Wendigo at 0 and a lost one with the party down and Wendigo barely scratched', () => {
    const won = runs('advisor', 12).find((r) => r.outcome === 'victory');
    expect(won?.hp).toBe(0);
    const lost = runs('careless', 3)[0]!;
    expect(lost.outcome).toBe('defeat');
    expect(lost.hp).toBeGreaterThan(15_000);
  });
});

describe('the unmanaged lines lose outright (the preflight\'s prediction 1: a Berserk or plain punch ends a front line in a round)', () => {
  it('careless (everyone Attacks Wendigo) and plain (care and Attack) win none of 100', () => {
    expect(wins('careless', 100)).toBe(0);
    expect(wins('plain', 100)).toBe(0);
  });
});

describe('the sourced line wins (the preflight\'s target: about 90 percent or more)', () => {
  it('the advisor, on the shipped front line (Tidus, Yuna, Rikku; Auron and Wakka one Switch away): at least 90 of 100', () => {
    const w = wins('advisor', 100);
    expect(w).toBeGreaterThanOrEqual(90);
    expect(winRate(runs('advisor', 100))).toBeGreaterThanOrEqual(90);
  });

  it('the preflight\'s alternative front line (Tidus, Auron, Rikku) also wins at least 90 of 100: the choice of line-up is not what decides the fight', () => {
    expect(wins('advisor', 100, buildWith(['tidus', 'auron', 'rikku']))).toBeGreaterThanOrEqual(90);
  });

  it('the line the game ships (the registered tactic, played through the generic ladder the card and the auto-battler use) is decision for decision the advisor\'s: the same fights, the same results, on seeds 1 to 30', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const a = play(seed, LINES['advisor']!);
      const t = playTactic(seed);
      expect(t.outcome, `seed ${seed}`).toBe(a.outcome);
      expect(t.ticks, `seed ${seed}`).toBe(a.ticks);
      expect(t.hp, `seed ${seed}`).toBe(a.hp);
    }
  });

  it('...and wins at least 90 of 100 seeds', () => {
    const t = benchTactic(100);
    expect(t.filter((r) => r.outcome === 'victory').length).toBeGreaterThanOrEqual(90);
  });
});

describe('what the pieces do (the ablations: the advisor with one piece removed, 60 seeds)', () => {
  it('Power Break is the mover: without it the same line wins almost none', () => {
    expect(wins('no-power-break', 60)).toBeLessThanOrEqual(12);
  });

  it('without the Petrify Grenade and the Steal both, the Guardians keep Wendigo furious and healed and the line wins far less than the full line', () => {
    expect(wins('no-steal', 60)).toBeLessThan(wins('advisor', 60) - 15);
  });

  it('with the Switch left out (the preset\'s front line alone: no Power Break, no Dark Attack) the line wins far less', () => {
    expect(wins('front-line-only', 60)).toBeLessThan(wins('advisor', 60) - 15);
  });

  it('Protect, the Darkness and the wait while the arms are up are comforts, not movers: each removed, the line still wins 90 percent or more', () => {
    for (const name of ['no-protect', 'no-blind', 'no-stance']) expect(wins(name, 60), name).toBeGreaterThanOrEqual(54);
  });
});
