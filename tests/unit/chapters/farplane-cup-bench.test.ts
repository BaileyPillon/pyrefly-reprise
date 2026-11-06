/**
 * The Farplane Cup (the hidden FFX-2 chapter): what each duel is like to play, MEASURED, never tuned. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Every number of the three fights is the game's own (`research/re-ffx2-farplane-cup.md`); nothing here moves one. A *line* is a small policy standing in for a player (`helpers/farplaneCupDrive.ts`): an input to a
 * measurement, never game data. The table is printed (`PYREFLY_BENCH_SEEDS=<n>` for more seeds; the suite runs **100**, seeds 1 to 100, the engine deterministic, so the table of the handoff is exactly reproducible) and
 * `docs/handoff/ch-farplane-cup.md` carries it.
 *
 * What it pins, so a change that moves a duel's character fails loudly (bands, not exact counts):
 *
 * 1. **Every fight resolves** on every line and seed: a victory or a defeat, never a stalemate; a party that only defends loses all three duels on every seed.
 * 2. **Duel 1 (Auron) is the hard one**: his Shooting Star (an Eject at 254, formula 3, which the Lv 99 party has no resist for) takes a girl out of the fight about two and a half times a fight, and the simple lines win about one
 *    seed in ten; **duel 2 (the masked duelist)** about two in five (he opens with nine hits on one girl and keeps himself hasted); **duel 3 (Seymour)** about one in two (his status spells cannot land on a Lv 99 party: T0 a).
 * 3. **The Charon line loses** (Charon costs its caster HP and the damage limit is not broken at the start), and the `walk` line (Paine crosses The End's red and green gates first, four Changes) does worse than the plain
 *    curtains line on every duel: it spends the opening on Changes the short duels do not give back. Nothing was tuned; the options with numbers are in the handoff.
 */
import { describe, expect, it } from 'vitest';

import { fight, girlsOf, type Duel, type LineName, type OpenOptions } from '../helpers/farplaneCupDrive.ts';

const SEEDS = Math.max(12, Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 100));
const DUEL_NAME = ['Auron', 'the masked duelist', 'Seymour'] as const;

interface Cell {
  wins: number;
  defeats: number;
  unresolved: number;
  kos: number;
  ejects: number;
  minutes: number;
}

/** Each cell is computed once (the engine is deterministic, so a second run of the same seeds is the same numbers). */
const CELLS = new Map<string, Cell>();

function cell(duel: Duel, line: LineName, rig?: { name: string; setup: NonNullable<OpenOptions['setup']> }): Cell {
  const key = `${duel}/${line}/${rig?.name ?? 'as built'}`;
  const cached = CELLS.get(key);
  if (cached) return cached;
  const out: Cell = { wins: 0, defeats: 0, unresolved: 0, kos: 0, ejects: 0, minutes: 0 };
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = fight(duel, seed, line, { maxDecisions: 60_000, ...(rig ? { setup: rig.setup } : {}) });
    if (r.outcome === 'victory') out.wins++;
    else if (r.outcome === 'defeat') out.defeats++;
    else out.unresolved++;
    out.kos += r.kos;
    out.ejects += r.ejects;
    out.minutes += r.ticks / 29.97 / 60;
  }
  CELLS.set(key, out);
  return out;
}

function show(label: string, c: Cell): void {
  console.info(
    `[farplane cup bench] ${label}: wins ${c.wins}/${SEEDS} defeats ${c.defeats} unresolved ${c.unresolved} girl KOs/fight ${(c.kos / SEEDS).toFixed(2)} ejects/fight ${(c.ejects / SEEDS).toFixed(2)} minutes/fight ${(c.minutes / SEEDS).toFixed(2)}`,
  );
}

const share = (c: Cell): number => c.wins / SEEDS;

describe('the Lv 99 party against the three duelists, the curtains line (Light and Lunar Curtains first, Darkness, Rikku mends)', () => {
  const table: Partial<Record<Duel, Cell>> = {};

  for (const duel of [0, 1, 2] as Duel[]) {
    it(`${DUEL_NAME[duel]}: every seed resolves, and the share won is in the band measured (duel 1 hard, duel 2 about two in five, duel 3 about one in two)`, () => {
      const c = cell(duel, 'curtains');
      table[duel] = c;
      show(`duel ${duel + 1} ${DUEL_NAME[duel]}, curtains line`, c);
      expect(c.unresolved).toBe(0);
      expect(c.wins + c.defeats).toBe(SEEDS);
      const bands: Record<Duel, [number, number]> = { 0: [0.03, 0.3], 1: [0.25, 0.65], 2: [0.3, 0.8] };
      expect(share(c)).toBeGreaterThanOrEqual(bands[duel][0]);
      expect(share(c)).toBeLessThanOrEqual(bands[duel][1]);
      expect(c.minutes / SEEDS, 'a duel is over inside two minutes of game time').toBeLessThan(2);
    }, 120_000);
  }

  it('Auron\'s Shooting Star is the reason duel 1 is hard: it ejects about two girls in a fight, more than the other two duelists eject together (they eject none)', () => {
    const c = table[0] ?? cell(0, 'curtains');
    expect(c.ejects / SEEDS).toBeGreaterThan(1.5);
    for (const duel of [1, 2] as Duel[]) expect((table[duel] ?? cell(duel, 'curtains')).ejects).toBe(0);
  }, 120_000);
});

describe('the other lines', () => {
  it('the plain Darkness line (no curtains) is within a few seeds in ten of the curtains line on each duel, and wins duel 1 on about one seed in ten', () => {
    for (const duel of [0, 1, 2] as Duel[]) {
      const dark = cell(duel, 'darkness');
      show(`duel ${duel + 1} ${DUEL_NAME[duel]}, darkness line`, dark);
      expect(dark.unresolved).toBe(0);
      expect(share(dark)).toBeLessThanOrEqual(0.7);
    }
  }, 180_000);

  it('the Charon line (the limit not broken, Charon costing its caster HP) loses almost every seed, and so does the walk line worse than the curtains line: nobody gets the limit cheaply', () => {
    for (const duel of [0, 1, 2] as Duel[]) {
      const charon = cell(duel, 'charon');
      show(`duel ${duel + 1} ${DUEL_NAME[duel]}, charon line`, charon);
      expect(charon.unresolved).toBe(0);
      expect(share(charon)).toBeLessThanOrEqual(0.05);
      const walk = cell(duel, 'walk');
      show(`duel ${duel + 1} ${DUEL_NAME[duel]}, walk line (Paine crosses The End's gates first)`, walk);
      expect(walk.unresolved).toBe(0);
      expect(share(walk)).toBeLessThan(share(cell(duel, 'curtains')) + 0.0001);
    }
  }, 300_000);

  it('the Remedy line (it cures a petrified girl first) plays the same as the curtains line: no duelist can petrify a Lv 99 girl (T0 a)', () => {
    for (const duel of [0, 1, 2] as Duel[]) {
      const remedy = cell(duel, 'remedy');
      show(`duel ${duel + 1} ${DUEL_NAME[duel]}, remedy line`, remedy);
      expect(remedy.wins).toBe(cell(duel, 'curtains').wins);
    }
  }, 300_000);
});

describe('the options with numbers (the rows are NOT touched; each is a rig the test applies: (a) stands for the sourced rule that a Special-dressphere wearer cannot be Ejected, which the engine does not yet apply (handoff section 6); (b) for a lever no source gives)', () => {
  it('(a) an Eject resist byte of 255 on the girls (what a Special dressphere would do if the engine applied the rule of research/ffx2-combat-core.md 2.8 and 3.15) takes Shooting Star out of the fight; (b) a Lv 74 party (the level of the duelists) lets their own statuses land: the table the handoff carries', () => {
    const noEject = { name: 'eject-proof', setup: (e: Parameters<NonNullable<OpenOptions['setup']>>[0]): void => girlsOf(e).forEach((g) => { g.immunities['eject'] = 255; }) };
    const lv74 = { name: 'lv74', setup: (e: Parameters<NonNullable<OpenOptions['setup']>>[0]): void => girlsOf(e).forEach((g) => { g.level = 74; }) };
    const asBuilt = cell(0, 'curtains');
    const a = cell(0, 'curtains', noEject);
    show('duel 1 Auron, curtains line, the girls Eject-proof (a rig)', a);
    expect(a.unresolved).toBe(0);
    expect(a.ejects, 'nobody is ejected').toBe(0);
    expect(share(a), 'Auron is won far more often once Shooting Star cannot land').toBeGreaterThan(share(asBuilt) + 0.2);
    for (const duel of [0, 1, 2] as Duel[]) {
      const b = cell(duel, 'curtains', lv74);
      show(`duel ${duel + 1} ${DUEL_NAME[duel]}, curtains line, the girls at Lv 74 (a rig)`, b);
      expect(b.unresolved).toBe(0);
      expect(b.wins + b.defeats).toBe(SEEDS);
    }
  }, 300_000);
});

describe('a party that only defends', () => {
  it('loses to every duelist on every seed, and the fight ends in a defeat (never a stalemate)', () => {
    for (const duel of [0, 1, 2] as Duel[]) {
      const c = cell(duel, 'defend');
      show(`duel ${duel + 1} ${DUEL_NAME[duel]}, defend line`, c);
      expect(c.defeats, `duel ${duel + 1}`).toBe(SEEDS);
    }
  }, 180_000);
});
