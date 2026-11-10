/**
 * The Farplane Cup, duel 1 (Auron) and the others, with the girls able to reach their Special dresspheres: MEASURED, never tuned. **FFX-2 only** [AGENTS.md rule 14]; the `specialDressUp` switch is OFF in the
 * shipped chapter and ON here (`helpers/farplaneCupSpecials.ts`).
 *
 * A *line* is a bot standing in for a player: one girl walks her real Garment Grid to her Special and puts it on the moment the menu offers it, plays her three parts, and the rest play the bench's `curtains`
 * line; every number of the fight is the game's own (`research/re-ffx2-farplane-cup.md`, `research/re-ffx2-special-dresspheres.md`). The table is printed (`PYREFLY_BENCH_SEEDS=<n>`; seeds 1 to n, the
 * engine deterministic) and `docs/handoff/ffx2-specials.md` carries it.
 */
import { describe, expect, it } from 'vitest';
import { specialFight, type SpecialFight, type Walker } from '../helpers/farplaneCupSpecials.ts';
import type { Duel } from '../helpers/farplaneCupDrive.ts';

const SEEDS = Math.max(12, Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 100));
const DUEL_NAME = ['Auron', 'the masked duelist', 'Seymour'] as const;

interface Cell {
  fights: SpecialFight[];
  wins: number;
  entered: number;
  winsEntered: number;
  medianEntry: number | undefined;
  ejectsOnParts: number;
  ejectsOutside: number;
  kos: number;
  fell: number;
}

const CELLS = new Map<string, Cell>();

function cell(duel: Duel, walker: Walker, mastered: boolean): Cell {
  const key = `${duel}/${walker}/${mastered}`;
  const cached = CELLS.get(key);
  if (cached) return cached;
  const fights: SpecialFight[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) fights.push(specialFight(duel, seed, walker, mastered));
  const times = fights.map((f) => f.enteredAt).filter((x): x is number => x !== undefined).sort((a, b) => a - b);
  const c: Cell = {
    fights,
    wins: fights.filter((f) => f.outcome === 'victory').length,
    entered: times.length,
    winsEntered: fights.filter((f) => f.enteredAt !== undefined && f.outcome === 'victory').length,
    medianEntry: times.length === 0 ? undefined : times[Math.floor(times.length / 2)],
    ejectsOnParts: fights.reduce((s, f) => s + f.ejectsOnParts, 0),
    ejectsOutside: fights.reduce((s, f) => s + f.ejectsOutside, 0),
    kos: fights.reduce((s, f) => s + f.kos, 0),
    fell: fights.filter((f) => f.formEndedByFall).length,
  };
  CELLS.set(key, c);
  return c;
}

function show(label: string, c: Cell): void {
  console.info(
    `[farplane cup specials] ${label}: wins ${c.wins}/${SEEDS}; put the Special on in ${c.entered} (median ${c.medianEntry?.toFixed(1) ?? '-'} s; won ${c.winsEntered} of those); ` +
      `KOs/fight ${(c.kos / SEEDS).toFixed(2)}; ejects on a part ${c.ejectsOnParts}, on a girl outside the form ${c.ejectsOutside}; main body fell ${c.fell}`,
  );
}

describe('duel 1 (Auron): the reference and each girl walking to her Special', () => {
  it('the reference (nobody walks; the bench\'s curtains line) resolves every seed', () => {
    const c = cell(0, null, false);
    show('duel 1, curtains line, nobody in a Special', c);
    expect(c.fights.every((f) => f.outcome === 'victory' || f.outcome === 'defeat')).toBe(true);
    expect(c.entered).toBe(0);
  }, 300_000);

  for (const walker of ['yuna', 'rikku', 'paine'] as const) {
    for (const mastered of [false, true]) {
      it(`${walker} walks to her Special${mastered ? ', everything learned' : ', the build as given (the commands the game lists from the start)'}: every seed resolves and no Eject ever lands on a part`, () => {
        const c = cell(0, walker, mastered);
        show(`duel 1, ${walker}${mastered ? ', mastered' : ', as given'}`, c);
        expect(c.fights.every((f) => f.outcome === 'victory' || f.outcome === 'defeat'), 'a verdict on every seed').toBe(true);
        expect(c.entered, 'the walk is made on some seeds').toBeGreaterThan(0);
        expect(c.ejectsOnParts, 'Eject-proof by the game\'s own Ribbon row').toBe(0);
      }, 300_000);
    }
  }
});

describe('duels 2 and 3 with the same walks (information only: nothing is tuned)', () => {
  for (const duel of [1, 2] as Duel[]) {
    it(`${DUEL_NAME[duel]}: each girl's Special, as given and mastered, resolves every seed`, () => {
      for (const walker of ['yuna', 'rikku', 'paine'] as const) {
        for (const mastered of [false, true]) {
          const c = cell(duel, walker, mastered);
          show(`duel ${duel + 1} ${DUEL_NAME[duel]}, ${walker}${mastered ? ', mastered' : ', as given'}`, c);
          expect(c.fights.every((f) => f.outcome === 'victory' || f.outcome === 'defeat')).toBe(true);
        }
      }
    }, 600_000);
  }
});
