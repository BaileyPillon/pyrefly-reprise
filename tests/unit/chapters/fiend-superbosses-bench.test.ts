/**
 * The Fiend Arena Superbosses (the hidden FFX-2 chapter 53): what each act is like to play, MEASURED, never tuned. **FFX-2 only** [AGENTS.md rule 14]. Every number of the two fights is the game's own
 * (`research/re-ffx2-fiend-arena-superbosses.md`); nothing here moves one. A *line* is a policy standing in for a player and a *kit* a rig on the party (`helpers/fiendSuperbossBench.ts`, the cells in
 * `helpers/fiendSuperbossBenchCells.ts`): inputs to a measurement, never game data. The table of the handoff is the tool's run (`node --experimental-transform-types tools/fiend-superbosses-bench.mjs`: 200 seeds a
 * cell at bench speed, 40 at each human pace, 58 cells, about 15 minutes of CPU in all); this file runs the same cells on `SEEDS` seeds (12 by default; `PYREFLY_BENCH_SEEDS=<n>` for more) and pins the CHARACTER of
 * the result so that a change which moves it fails loudly (bands and facts, not exact counts, except where the engine is exact).
 *
 * What it pins:
 * 1. **The base party loses both acts on every seed, on every line, at every pace**, and no fight reaches the cap: it is defeated in seconds (a result, not a defect: no boss row is touched).
 * 2. **Why: the opening.** Almighty Shinra's first blow (Clione) lands about 2.6 s in and no girl's action COMPLETES before it on any seed: Rikku's first menu comes at about 1.4 s and a Light Curtain or a Mix started
 *    then has not landed; the first move alone wipes the party on most seeds of act 1. **Act 2 opens as the game opens a fight** (`opensAsSeparateBattle`: each character's random opening wait and the trim, `battle/ffx2/atb-open.ts`): the heads' first blow lands 1.6 to 2.6 s in, most seeds give a girl a menu
 *    first and none finishes an action before the blow; the first move wipes the party on 85 of 200 seeds. **The alternative, a plain continuation link** (every wait whole; measured with `continuation: true`; how the chapter opened act 2 before the fix pass) is worse: the first blow lands 2.9 to 3.4 s
 *    in, the girls are never asked for a command (the first move wipes the party on all 200 seeds, 9.0 s in).
 * 3. **The Miracle Drink loop's arithmetic.** A Drink lands about 4.8 s after Rikku's menu and Invincible lasts about 7.9 s; Rikku's menu comes about every 7.3 s when she Mixes at every one. The next Drink would
 *    land while the last still stands (a status does not stack), so it is wasted: the loop covers about half the time, not all of it. With the opening handed over for free (a rig) the loop still loses.
 * 4. **Every LG4 what-if loses both acts on every seed** (the loop, Hero Drinks, Thunder-proof girls, and the Ribbon from stage 2), alone or together.
 * 5. **The wall is invulnerability.** With Invincible for good and the HP topped up (a diagnostic rig, not an option) the Darkness line wins act 1 on most seeds and loses act 2 to Duo's Petrify (it lands through
 *    Invincible: `stoned` > 0); add a Ribbon and act 2 is won on every seed in about six minutes with every Command survived, which is the guide's "ten to thirty minutes with an invulnerability loop".
 * 6. The cells are what the handoff says they are (200 and 40 seeds, 58 cells, unique names), a run is deterministic, and each kit lays exactly what it says on the party.
 */
import { describe, expect, it } from 'vitest';

import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { runCell, runFight, buildFor, openEngine, type Pace, type Spec, type Tally } from '../helpers/fiendSuperbossBench.ts';
import { unit } from '../helpers/fiendSuperbossDrive.ts';
import { BENCH_SEEDS, CELLS, HUMAN_SEEDS, cellNamed } from '../helpers/fiendSuperbossBenchCells.ts';
import { miracleLoopTiming, openingOf } from '../helpers/fiendSuperbossOpening.ts';

const SEEDS = Math.max(12, Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 12));
const run = (spec: Spec, seeds = SEEDS): Tally => runCell(spec, seeds);

describe('the base party (as built) against both acts', () => {
  for (const act of [1, 2] as const) {
    for (const line of ['advisor', 'darkness', 'naive'] as const) {
      it(`act ${act}, the ${line} line, bench speed: defeated on every seed in seconds, never a win, never the cap`, () => {
        const t = run({ act, line });
        expect(t.wins).toBe(0);
        expect(t.caps).toBe(0);
        expect(t.defeats).toBe(t.seeds);
        expect(t.kos / t.seeds, 'all three girls fall').toBe(3);
        expect(t.seconds / t.seeds, 'a fight is over inside half a minute').toBeLessThan(30);
      });
    }
    for (const pace of ['split', 'active'] as const satisfies readonly Pace[]) {
      it(`act ${act}, the advisor line at the ${pace} pace (1.5 s a menu): the same result`, () => {
        const t = run({ act, line: 'advisor', pace }, 6);
        expect(t.wins).toBe(0);
        expect(t.caps).toBe(0);
        expect(t.seconds / t.seeds).toBeLessThan(30);
      });
    }
  }
});

describe('the opening: the first blow lands before any girl has done anything', () => {
  it('act 1: Shinra\'s Clione lands 2.5 to 2.8 s in, no girl action completes before it, and it wipes the party on most seeds', () => {
    let wiped = 0;
    let menuFirst = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const o = openingOf({ act: 1, line: 'advisor' }, seed);
      expect(o.firstBlow, `seed ${seed}`).toBeGreaterThan(2.5);
      expect(o.firstBlow, `seed ${seed}`).toBeLessThan(2.8);
      expect(o.firstGirlActionEnd === null || o.firstGirlActionEnd > o.firstBlow!, `seed ${seed}: no girl has finished an action when the first blow lands`).toBe(true);
      if (o.firstMenu !== null && o.firstMenu < o.firstBlow!) menuFirst++;
      if (o.standingAfterFirstMove === 0) wiped++;
    }
    expect(menuFirst / SEEDS, 'a girl is asked for a command before the blow on most seeds: she just cannot finish one in time').toBeGreaterThan(0.5);
    expect(wiped / SEEDS, 'the first move alone wipes the party on most seeds (158 of 200 at the bench)').toBeGreaterThan(0.5);
  });

  it('act 2 as the chapter plays it (a separate battle: the game\'s own start): the first blow lands 1.5 to 2.7 s in, most seeds give a girl a menu first, and still no girl action completes before the blow; it is the same fight as one opened `normal`', () => {
    let menuFirst = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const o = openingOf({ act: 2, line: 'advisor' }, seed);
      expect(o.firstBlow, `seed ${seed}`).toBeGreaterThan(1.5);
      expect(o.firstBlow, `seed ${seed}`).toBeLessThan(2.7);
      expect(o.firstGirlActionEnd === null || o.firstGirlActionEnd > o.firstBlow!, `seed ${seed}`).toBe(true);
      expect(o.ends, `seed ${seed}: over inside twelve seconds`).toBeLessThan(12);
      if (o.firstMenu !== null && o.firstMenu < o.firstBlow!) menuFirst++;
      expect(o, `seed ${seed}: the chained act 2 opens exactly as a first link does (opensAsSeparateBattle)`).toEqual(openingOf({ act: 2, line: 'advisor', condition: 'normal' }, seed));
    }
    expect(menuFirst / SEEDS, '160 of 200 at the bench').toBeGreaterThan(0.5);
  });

  it('the alternative, a plain CONTINUATION link (every wait whole, no trim; `continuation: true`, how the chapter opened act 2 before the fix pass): the first blow lands 2.8 to 3.5 s in, the first move wipes the party on every seed, and no girl is EVER asked for a command', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const o = openingOf({ act: 2, line: 'advisor', continuation: true }, seed);
      expect(o.firstBlow, `seed ${seed}`).toBeGreaterThan(2.8);
      expect(o.firstBlow, `seed ${seed}`).toBeLessThan(3.5);
      expect(o.firstMenu, `seed ${seed}: no menu before the end`).toBeNull();
      expect(o.firstGirlActionEnd, `seed ${seed}`).toBeNull();
      expect(o.standingAfterFirstMove, `seed ${seed}: wiped by the first move`).toBe(0);
      expect(o.ends, `seed ${seed}: nine seconds (271 logic steps), the same every seed`).toBeCloseTo(271 / STEPS_PER_SECOND, 1);
    }
    const t = run({ act: 2, line: 'advisor', continuation: true });
    expect(t.wins, 'the alternative wins none either').toBe(0);
    expect(t.seconds / t.seeds).toBeCloseTo(9.0, 0);
  });
});

describe('the Miracle Drink loop: its own arithmetic', () => {
  it('a Drink lands about 4.8 s after the menu, lasts about 7.9 s, and Rikku\'s menu comes about every 7.3 s: the next Drink lands while the last still stands', () => {
    for (const act of [1, 2] as const) {
      for (const seed of [1, 2, 3]) {
        const t = miracleLoopTiming(act, seed, buildFor({ darkMatter: true }));
        expect(t.landing, `act ${act} seed ${seed}`).toBeGreaterThan(4.5);
        expect(t.landing, `act ${act} seed ${seed}`).toBeLessThan(5.1);
        expect(t.lasts, `act ${act} seed ${seed}`).toBeGreaterThan(7.6);
        expect(t.lasts, `act ${act} seed ${seed}`).toBeLessThan(8.1);
        expect(t.cadence, `act ${act} seed ${seed}`).toBeGreaterThan(7);
        expect(t.cadence, `act ${act} seed ${seed}`).toBeLessThan(7.8);
        // Mixed at the next menu, the Drink lands at cadence + landing after the first menu; the first one stands until landing + lasts. A status does not stack, so that second Drink does nothing.
        expect(t.cadence + t.landing, `act ${act} seed ${seed}: the next Drink is wasted`).toBeLessThan(t.landing + t.lasts);
      }
    }
  });

  it('the Dark Matter is real: the shipped bag holds none, so as built Rikku cannot make one (the loop is a what-if)', () => {
    expect(buildFor().inventory.some((i) => i.itemId === 'x2-dark-matter')).toBe(false);
    expect(buildFor({ darkMatter: true }).inventory.find((i) => i.itemId === 'x2-dark-matter')?.count).toBe(99);
    const t = run({ act: 1, line: 'miracle' });
    expect(t.miracles, 'the as-built bag makes no Drink').toBe(0);
  });
});

describe('LG4\'s what-ifs: every one loses both acts on every seed (none of them ships)', () => {
  const WHATIFS = CELLS.filter((c) => c.group === 'whatif' && c.pace === 'bench');
  for (const cell of WHATIFS) {
    it(`${cell.name}: ${cell.line} line, ${JSON.stringify(cell.kit)}`, () => {
      const t = run(cell);
      expect(t.wins).toBe(0);
      expect(t.caps).toBe(0);
      expect(t.seconds / t.seeds).toBeLessThan(30);
    });
  }

  it('the loop casts Drinks (it is the line that was measured) and the Hero Drink line drinks; neither wins', () => {
    const loop = run({ act: 1, line: 'miracle', kit: { darkMatter: true } });
    expect(loop.miracles, 'Rikku starts a Mix on most seeds of act 1 (0.93 a fight at the bench): it never lands before Clione').toBeGreaterThan(0);
    expect(run({ act: 2, line: 'miracle', kit: { darkMatter: true } }).miracles, 'act 2 opens as the game opens a fight: Rikku is asked first on most seeds and starts a Mix on some (0.60 a fight at the bench), and the party still loses every seed').toBeGreaterThan(0);
    expect(run({ act: 2, line: 'miracle', kit: { darkMatter: true }, continuation: true }).miracles, 'the continuation alternative never asks a girl for anything: no Mix is ever started').toBe(0);
    const hero = run({ act: 1, line: 'hero', kit: { heroDrinks: 10 } });
    expect(hero.drinks).toBeGreaterThan(0);
    expect(loop.wins + hero.wins).toBe(0);
  });

  it('the opening handed over for free (Invincible for one Drink\'s length, a rig) does not save the loop, the Ribbon, or the Hero Drinks', () => {
    for (const act of [1, 2] as const) {
      for (const [line, kit] of [['miracle', { darkMatter: true, cover: 15 }], ['miracle', { darkMatter: true, cover: 15, ribbon: true, thunder: true }], ['hero', { heroDrinks: 10, cover: 15, ribbon: true }]] as const) {
        const t = run({ act, line, kit });
        expect(t.wins, `act ${act} ${line} ${JSON.stringify(kit)}`).toBe(0);
        expect(t.caps).toBe(0);
        expect(t.seconds / t.seeds, 'it lives a little longer than the bare party (7 to 8 s) and no more').toBeLessThan(60);
      }
    }
  });
});

describe('the wall is invulnerability (diagnostic rigs: Invincible for good and HP topped up; not options)', () => {
  it('act 1: the Darkness line wins most seeds, the rest run to the 40-minute cap (Shinra\'s Regen), none is lost', () => {
    const t = run({ act: 1, line: 'darkness', kit: { cover: Infinity, topUp: true } });
    expect(t.defeats).toBe(0);
    expect(t.wins / t.seeds, 'about four seeds in five at the bench (160 of 200)').toBeGreaterThan(0.5);
    expect(t.wins + t.caps).toBe(t.seeds);
  });

  it('act 2: invulnerable girls still lose it to Duo\'s Petrify, which lands through Invincible; with a Ribbon every seed is won, in about six minutes, with every Command survived', () => {
    const bare = run({ act: 2, line: 'darkness', kit: { cover: Infinity, topUp: true } });
    expect(bare.wins, 'about none (0 of 200)').toBeLessThanOrEqual(1);
    expect(bare.stoned, 'Petrify is what ends it').toBeGreaterThan(0);
    const ribbon = run({ act: 2, line: 'darkness', kit: { cover: Infinity, topUp: true, ribbon: true } });
    expect(ribbon.wins).toBe(ribbon.seeds);
    expect(ribbon.stoned).toBe(0);
    expect(ribbon.headsDown / ribbon.seeds).toBe(4);
    expect(ribbon.seconds / ribbon.seeds, 'five to seven minutes (346 s at the bench)').toBeGreaterThan(300);
    expect(ribbon.seconds / ribbon.seeds).toBeLessThan(420);
    expect(ribbon.commands, 'the Commands are cast, many of them').toBeGreaterThan(ribbon.seeds * 15);
    expect(ribbon.commandsClean / ribbon.commands, 'and nearly all of them leave every girl standing').toBeGreaterThan(0.9);
  });
});

describe('the cells are what the handoff says', () => {
  it('58 unique cells: 200 seeds at bench speed and 40 at each human pace, both acts of every family', () => {
    expect(CELLS).toHaveLength(58);
    expect(new Set(CELLS.map((c) => c.name)).size).toBe(58);
    for (const c of CELLS) expect(c.seeds, c.name).toBe(c.pace === 'bench' ? BENCH_SEEDS : HUMAN_SEEDS);
    expect(BENCH_SEEDS).toBe(200);
    expect(HUMAN_SEEDS).toBe(40);
    for (const c of CELLS.filter((x) => x.act === 1)) expect(CELLS.some((x) => x.act === 2 && x.name === c.name.replace('/act1/', '/act2/')), c.name).toBe(true);
    expect(cellNamed('base/advisor/act1/bench').kit).toEqual({});
  });

  it('a run is deterministic: the same cell on the same seed is the same fight', () => {
    const spec: Spec = { act: 2, line: 'miracle', kit: { darkMatter: true } };
    expect(runFight(spec, 5)).toEqual(runFight(spec, 5));
    expect(runFight({ act: 1, line: 'advisor' }, 3).ticks / STEPS_PER_SECOND).toBeLessThan(30);
  });
});

describe('the kits are laid on the party, and only the kit asked for', () => {
  const girlsOf = (spec: Spec): Array<{ id: string; affinities: Record<string, string>; accessories: string[]; statuses: Record<string, { ticksRemaining: number | null } | undefined> }> =>
    ['yuna', 'rikku', 'paine'].map((id) => unit(openEngine(spec, 1), id) as unknown as ReturnType<typeof girlsOf>[number]);

  it('Thunder-proof makes every girl immune to lightning (a rig: no accessory does it), and nothing does it otherwise', () => {
    for (const g of girlsOf({ act: 2, line: 'advisor', kit: { thunder: true } })) expect(g.affinities['lightning'], g.id).toBe('immune');
    for (const g of girlsOf({ act: 2, line: 'advisor' })) expect(g.affinities['lightning'], g.id).toBeUndefined();
  });

  it('the Ribbon stands in for the Crystal Bangle on every girl and the Rabite\'s Foot stays', () => {
    const build = buildFor({ ribbon: true });
    for (const m of build.members) expect(m.accessories).toEqual(['ribbon', "rabite's-foot"]);
    for (const m of buildFor().members) expect(m.accessories).toEqual(['crystal-bangle', "rabite's-foot"]);
  });

  it('the opening cover lays Invincible on all three girls: one Drink\'s length (about 7.9 s, a clock that runs out) or for good (no clock), and none otherwise', () => {
    for (const g of girlsOf({ act: 1, line: 'advisor', kit: { cover: 15 } })) expect(g.statuses['invincible']?.ticksRemaining, g.id).toBeGreaterThan(20_000);
    for (const g of girlsOf({ act: 1, line: 'advisor', kit: { cover: Infinity } })) expect(g.statuses['invincible'], g.id).toMatchObject({ ticksRemaining: null });
    for (const g of girlsOf({ act: 1, line: 'advisor' })) expect(g.statuses['invincible'], g.id).toBeUndefined();
  });

  it('the bag: Hero Drinks and Dark Matter with Potions only when the kit says so', () => {
    expect(buildFor({ heroDrinks: 10 }).inventory.find((i) => i.itemId === 'x2-hero-drink')?.count).toBe(10);
    expect(buildFor().inventory.some((i) => i.itemId === 'x2-hero-drink')).toBe(false);
    expect(buildFor({ darkMatter: true }).inventory.find((i) => i.itemId === 'x2-potion')?.count).toBe(99);
  });
});
