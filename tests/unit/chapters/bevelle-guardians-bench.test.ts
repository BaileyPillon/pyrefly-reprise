/**
 * The Bevelle Guardians (the hidden FFX-2 chapter): what each act is like to play, MEASURED, never tuned. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Every number of the three fights is the game's own (`research/re-ffx2-bevelle-underground.md`); nothing here moves one. A *line* is a small policy standing in for a player (`helpers/bevelleGuardiansDrive.ts`): an input
 * to a measurement, never game data. The table below is printed (`PYREFLY_BENCH_SEEDS=<n>` for more seeds; the suite runs 100, the handoff `docs/handoff/ch-bevelle-guardians.md` carries the 200-seed run, and
 * `node --experimental-transform-types tools/bevelle-guardians-bench.mjs --seeds 200` prints it).
 *
 * What it pins, so a change that moves an act's character fails loudly (the bounds are sampling-wide, around the 200-seed run):
 *
 * 1. **Georapella is a race the party wins without drama**: both the "everyone strikes" line and the careful line win every seed, in about a minute; a party that only defends loses every seed (it is not a stalemate: the
 *    Ga ring wears it down).
 * 2. **The Precepts Guard is the Death tax**: the careful line (curtains, Phoenix Downs, Cura) wins nearly every seed, the line that never heals wins about four in five; a girl falls in about one fight in one.
 * 3. **Baralai is the real fight**: simple lines win about a quarter (never healing) to six in ten (careful); the line that COUNTS his blows (only Paine strikes at eight or nine, so the Drill Shot is hers) does not beat the
 *    careful one by more than the sampling can show: the Drill Shot (three quarters of a MAXIMUM HP, 1,279 on Paine at 1,706) is survivable at full health, so the threat is the sum of the cycle (Chain Attack, Glint, Demi,
 *    the Attack at the soft girl) on a 690-HP healer, not the shot itself. Yuna, a White Mage, has no Attack row and never makes a result on him, so no line's shot ever lands on her.
 * 4. **No act is unresolved**: every fight ends in a victory or a defeat, never a stalemate.
 */
import { describe, expect, it } from 'vitest';

import { fight, type Act, type LineName } from '../helpers/bevelleGuardiansDrive.ts';

const SEEDS = Math.max(100, Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 100));
const NAMES = ['Georapella (floor 3)', 'Precepts Guard (floor 3)', 'Baralai (floor 7)'] as const;

interface Cell {
  wins: number;
  defeats: number;
  unresolved: number;
  kos: number;
  minutes: number;
  shots: number;
  on: { yuna: number; rikku: number; paine: number };
}

const cache = new Map<string, Cell>();

function cell(act: Act, line: LineName): Cell {
  const key = `${act}/${line}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const out: Cell = { wins: 0, defeats: 0, unresolved: 0, kos: 0, minutes: 0, shots: 0, on: { yuna: 0, rikku: 0, paine: 0 } };
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = fight(act, seed, line, { maxDecisions: 60_000 });
    if (r.outcome === 'victory') out.wins++;
    else if (r.outcome === 'defeat') out.defeats++;
    else out.unresolved++;
    out.kos += r.kos;
    out.minutes += r.ticks / 29.97 / 60;
    out.shots += r.drillShots.length;
    for (const who of r.drillShots) if (who in out.on) out.on[who as keyof Cell['on']]++;
  }
  cache.set(key, out);
  return out;
}

function show(act: Act, line: LineName, c: Cell): void {
  console.info(
    `[bevelle guardians bench] ${NAMES[act]}, ${line}: wins ${c.wins}/${SEEDS} defeats ${c.defeats} unresolved ${c.unresolved} girl KOs/fight ${(c.kos / SEEDS).toFixed(2)} minutes/fight ${(c.minutes / SEEDS).toFixed(2)} Drill Shots/fight ${(c.shots / SEEDS).toFixed(2)} on Yuna/Rikku/Paine ${c.on.yuna}/${c.on.rikku}/${c.on.paine}`,
  );
}

const share = (c: Cell): number => c.wins / SEEDS;

describe('act 1, Georapella: a race the party wins', { timeout: 180_000 }, () => {
  it('both a striking line and the careful line win every seed in about a minute, and nobody is knocked out on the careful line', () => {
    const attack = cell(0, 'attack');
    const careful = cell(0, 'careful');
    show(0, 'attack', attack);
    show(0, 'careful', careful);
    expect(share(attack)).toBeGreaterThanOrEqual(0.97);
    expect(share(careful)).toBeGreaterThanOrEqual(0.97);
    expect(careful.kos / SEEDS).toBeLessThanOrEqual(0.1);
    expect(careful.minutes / SEEDS).toBeLessThan(2);
    expect(careful.minutes / SEEDS).toBeGreaterThan(0.5);
  });

  it('a party that only defends loses every seed: the ring wears it down, the fight ends in a defeat and never in a stalemate', () => {
    const c = cell(0, 'defend');
    show(0, 'defend', c);
    expect(c.wins).toBe(0);
    expect(c.unresolved).toBe(0);
  });
});

describe('act 2, the Precepts Guard: the Death tax', { timeout: 180_000 }, () => {
  it('the careful line (curtains, Phoenix Downs, Cura) wins nearly every seed; the line that never heals still wins most of them', () => {
    const attack = cell(1, 'attack');
    const careful = cell(1, 'careful');
    show(1, 'attack', attack);
    show(1, 'careful', careful);
    expect(share(careful)).toBeGreaterThanOrEqual(0.93);
    expect(share(attack)).toBeGreaterThanOrEqual(0.65);
    expect(share(attack)).toBeLessThanOrEqual(0.92);
    expect(share(careful), 'healing and raising is worth doing').toBeGreaterThan(share(attack));
    expect(careful.unresolved + attack.unresolved).toBe(0);
  });

  it('a girl falls to its Death in about one fight in one on the careful line (Death lands and nothing guards against it), and a party that only defends loses', () => {
    const careful = cell(1, 'careful');
    expect(careful.kos / SEEDS).toBeGreaterThanOrEqual(0.5);
    expect(careful.kos / SEEDS).toBeLessThanOrEqual(2);
    const defend = cell(1, 'defend');
    show(1, 'defend', defend);
    expect(defend.wins).toBe(0);
    expect(defend.unresolved).toBe(0);
  });
});

describe('act 3, Baralai: the real fight, and the count', { timeout: 180_000 }, () => {
  it('the careful line wins between half and four in five; the line that never heals wins only a quarter or so; a party that only defends loses every seed', () => {
    const careful = cell(2, 'careful');
    const attack = cell(2, 'attack');
    const defend = cell(2, 'defend');
    show(2, 'careful', careful);
    show(2, 'attack', attack);
    show(2, 'defend', defend);
    expect(share(careful)).toBeGreaterThanOrEqual(0.45);
    expect(share(careful)).toBeLessThanOrEqual(0.8);
    expect(share(attack)).toBeGreaterThanOrEqual(0.12);
    expect(share(attack)).toBeLessThanOrEqual(0.42);
    expect(share(careful), 'healing is worth doing').toBeGreaterThan(share(attack));
    expect(defend.wins).toBe(0);
    expect([careful.unresolved, attack.unresolved, defend.unresolved]).toEqual([0, 0, 0]);
  });

  it('the Drill Shot comes about once a fight (every tenth result), and on every line it lands on Rikku or Paine: Yuna has no Attack row and never makes a result on him', () => {
    for (const line of ['attack', 'careful', 'counter'] as const) {
      const c = cell(2, line);
      expect(c.on.yuna, line).toBe(0);
      expect(c.shots / SEEDS, line).toBeGreaterThan(0.5);
      expect(c.shots / SEEDS, line).toBeLessThan(1.6);
    }
  });

  it('counting his blows (only Paine strikes at eight or nine) puts EVERY shot on Paine, and does not beat the careful line by more than the sampling shows: the shot is survivable at full health, the cycle is the threat', () => {
    const careful = cell(2, 'careful');
    const counter = cell(2, 'counter');
    show(2, 'counter', counter);
    expect(counter.on.rikku).toBe(0);
    expect(counter.on.paine).toBe(counter.shots);
    expect(careful.on.paine + careful.on.rikku).toBe(careful.shots);
    expect(careful.on.rikku, 'without counting the shot falls on Rikku sometimes').toBeGreaterThan(0);
    expect(share(counter)).toBeGreaterThanOrEqual(0.4);
    expect(share(counter)).toBeLessThanOrEqual(0.78);
    expect(Math.abs(share(counter) - share(careful))).toBeLessThanOrEqual(0.2);
  });

  it('the acts get harder in order for the careful line: Georapella, then the Precepts Guard, then Baralai', () => {
    expect(share(cell(0, 'careful'))).toBeGreaterThanOrEqual(share(cell(1, 'careful')));
    expect(share(cell(1, 'careful'))).toBeGreaterThan(share(cell(2, 'careful')));
  });
});
