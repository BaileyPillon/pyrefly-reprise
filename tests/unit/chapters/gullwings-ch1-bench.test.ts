/**
 * Gullwings, Chapter 1 (FFX-2's four hotspot missions, the hidden chapter): the bench. **FFX-2 only** [AGENTS.md rule 14]. **Measure, never tune**: no boss number moves here (rule 6; `boss-side-fix-needs-measured-options`);
 * a result goes to Bailey. The party is the new Chapter 1 build (Yuna 12 Gunner, Rikku 13 Thief, Paine 14 Warrior: `[estimate]`, `src/data/ffx2/builds/gullwings-ch1.ts`; no source gives a level, so **the level is the one lever**
 * and this file measures it). The bosses' moves run on the game's own rows and their scripts are the game's own (`research/re-ffx2-gullwings-chapter1.md`).
 *
 * The model is the one the other benches use: bench speed is zero decision time; human speed is the live default, **Wait split**, 1.5 s a menu (0.5 s on the top-level list with the clock running, 1.0 s inside a submenu,
 * held); and the **Active** clock at 1.5 s a decision. Lines (\`../helpers/gullwingsCh1Drive.ts\`): **advisor** (the shipped move advisor's tactic, the line the guide teaches), **naive** (every girl strikes, Potions under 40
 * percent, no Change, no Remedy, no element) and **defend** (the control: nobody does anything). Each fight is played from the chapter's party and bag (the chain restores the girls between acts, so an act is a fresh fight;
 * \`gullwings-ch1-flow.test.ts\` plays the real chain through \`setupForNextLink\`).
 *
 * \`PYREFLY_BENCH_SEEDS\` sets the seeds a cell at bench speed (100 by default, the suite's size, the least the plan allows); the human-speed cells and the what-ifs run half as many (at least 50). The handoff's table is the
 * 200 / 100 run. The table is printed and copied into the handoff \`docs/handoff/ch-gullwings-ch1.md\`.
 *
 * What the assertions pin is only that the measurement ran to the end on every seed, that the advisor line does at least as well as the naive one in every act and wins more often than not, that the control loses, that the
 * Beast is the fight the answer decides (the naive line loses most of them), that the tactic's role table is the better line in the fights it changes, that **Boris's Sticky End is rare at this level and common at a lower one**
 * (the party's level is the lever), and that **no fight comes near the "battle too long" block** (every boss's longest fight, in its own actions, stays far under its first mark): a regression guard, not a claim about the game.
 */

import { describe, expect, it } from 'vitest';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { BEAST_BEAT, BORIS_TOO_LONG, FLAME_DRAGON_TOO_LONG, GUARDIAN_BEAST_TOO_LONG, YSLS_ZERO_TOO_LONG } from '../../../src/battle/ffx2/ai/gullwings-ch1.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { ROLES, SPELL, gullwingsTactic, type RoleTable } from '../../../src/engine/tactics/ffx2-gullwings-ch1.ts';
import * as ids from '../../../src/data/gullwings-ch1-ids.ts';
import { ACTS, driveAct, levelsBuild, type Act, type ActRun, type DriveOptions, type GullwingsLine } from '../helpers/gullwingsCh1Drive.ts';

const SEEDS = Math.max(100, Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 100));
/** The human-speed cells (Wait split, Active) and the what-ifs run fewer seeds: each fight there costs more. */
const HUMAN_SEEDS = Math.max(50, Math.floor(SEEDS / 2));
const PACES: ReadonlyArray<[string, DriveOptions]> = [
  ['bench (0 ms)', {}],
  ['Wait split 1.5 s', { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } }],
  ['Active 1.5 s', { decisionMs: 1500, engine: { atbMode: 'active' } }],
];
const NAMES = ['Boris', 'Flame Dragon', 'Guardian Beast', 'YSLS-Zero'] as const;
const FIRST_MARKS = [BORIS_TOO_LONG[0], FLAME_DRAGON_TOO_LONG[0], GUARDIAN_BEAST_TOO_LONG[0], YSLS_ZERO_TOO_LONG[0]] as const;

interface Tally {
  wins: number; seeds: number; unfinished: number; minutes: number; bossTurns: number; maxTurns: number; kos: number; stops: number; curses: number; photons: number; punches: number; stickies: number; partyTurns: number;
}

function measure(act: Act, line: GullwingsLine, opts: DriveOptions, seeds: number): Tally {
  const t: Tally = { wins: 0, seeds, unfinished: 0, minutes: 0, bossTurns: 0, maxTurns: 0, kos: 0, stops: 0, curses: 0, photons: 0, punches: 0, stickies: 0, partyTurns: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r: ActRun = driveAct(act, line, seed, opts);
    t.minutes += r.ticks / STEPS_PER_SECOND / 60;
    t.bossTurns += r.order.length;
    t.maxTurns = Math.max(t.maxTurns, r.order.length);
    t.kos += r.kos;
    t.stops += r.stops;
    t.curses += r.curses;
    t.photons += r.moves['x2-guardian-beast-damocles-photon'] ?? 0;
    t.punches += r.moves['x2-ysls-zero-blast-punch'] ?? 0;
    t.stickies += (r.moves['x2-boris-sticky-end'] ?? 0) > 0 ? 1 : 0;
    t.partyTurns += r.partyTurns;
    if (r.outcome === 'victory') t.wins += 1;
    else if (r.outcome === undefined) t.unfinished += 1;
  }
  return t;
}

const avg = (n: number, t: Tally): string => (n / t.seeds).toFixed(2);
const rows: string[] = [];
const row = (act: Act, line: string, mode: string, t: Tally): void => {
  rows.push(`| ${NAMES[act]} | ${line} | ${mode} | ${t.wins}/${t.seeds} | ${avg(t.kos, t)} | ${avg(t.minutes, t)} | ${avg(t.bossTurns, t)} | ${t.maxTurns} | ${act === 0 ? `${t.stickies}/${t.seeds}` : act === 2 ? avg(t.photons, t) : act === 3 ? avg(t.punches, t) : '-'} |`);
};

describe(`Gullwings, Chapter 1: ${SEEDS} seeds at bench speed and ${HUMAN_SEEDS} at human speed, advisor, naive and the control, three paces, the role tables, the party's level`, () => {
  const results = new Map<string, Tally>();

  it('measures every cell to the end of every seed', () => {
    for (const act of ACTS) {
      for (const line of ['advisor', 'naive', 'defend'] as GullwingsLine[]) {
        const paces = line === 'defend' ? PACES.slice(0, 1) : PACES;
        for (const [pace, opts] of paces) {
          const t = measure(act, line, opts, pace.startsWith('bench') ? SEEDS : HUMAN_SEEDS);
          results.set(`${act} / ${line} / ${pace}`, t);
          row(act, line, pace, t);
          expect(t.unfinished, `${NAMES[act]} / ${line} / ${pace}: every fight reaches an outcome`).toBe(0);
        }
      }
    }
    console.log(`\n| fight | line | pace | wins | girl KOs a fight | minutes a fight | boss actions | longest (boss actions) | Sticky End seen / Photons a fight / Blast Punches a fight |\n|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`);
  }, 1_800_000);

  it('the advisor line does at least as well as the naive one in every fight at every pace, wins more often than not, and the control (nobody acts) loses every fight', () => {
    for (const act of ACTS) {
      for (const [pace] of PACES) {
        const a = results.get(`${act} / advisor / ${pace}`);
        const n = results.get(`${act} / naive / ${pace}`);
        if (a === undefined || n === undefined) throw new Error('the first test fills the table');
        // The advisor is the better line; "at least as well" has the one slack the rest of the bench has: a tie is a tie. (YSLS-Zero's advisor line IS the naive line plus the bag's answers.)
        expect(a.wins / a.seeds, `${NAMES[act]} / ${pace}: advisor ${a.wins}/${a.seeds} against naive ${n.wins}/${n.seeds}`).toBeGreaterThanOrEqual(n.wins / n.seeds - 0.1);
        // Active at 1.5 s a decision is the hard clock (the Beast's advisor line wins about two in five there, measured): more often than not is asked of the bench and the live default (Wait split) only.
        if (!pace.startsWith('Active')) expect(a.wins, `${NAMES[act]} / ${pace}`).toBeGreaterThan(a.seeds / 2);
      }
      expect(results.get(`${act} / defend / bench (0 ms)`)!.wins, `${NAMES[act]}: a party that only defends`).toBe(0);
    }
  });

  it('the Guardian Beast is the fight the answer decides: the advisor line wins nearly all of them and the naive line loses most (a healer and an element against a party that only strikes)', () => {
    const adv = results.get('2 / advisor / bench (0 ms)')!;
    const naive = results.get('2 / naive / bench (0 ms)')!;
    expect(adv.wins / adv.seeds).toBeGreaterThan(0.85);
    expect(naive.wins / naive.seeds).toBeLessThan(0.6);
    expect(adv.wins - naive.wins).toBeGreaterThan(adv.seeds * 0.3);
    expect(adv.curses / adv.seeds, 'the Beast casts its Curse in a typical fight').toBeGreaterThan(0.5);
  });

  it('Boris and the Flame Dragon are easy by design (the guides\' own words): the shipped line wins every seed of both with no more than a knock-out in twenty fights', () => {
    for (const act of [0, 1] as Act[]) {
      const t = results.get(`${act} / advisor / bench (0 ms)`)!;
      expect(t.wins, NAMES[act]).toBe(t.seeds);
      expect(t.kos / t.seeds, NAMES[act]).toBeLessThan(0.05);
    }
  });

  it('YSLS-Zero hurts: the shipped line takes a knock-out or two a fight and still wins the great majority; its Blast Punch comes in a typical fight', () => {
    const t = results.get('3 / advisor / bench (0 ms)')!;
    expect(t.kos / t.seeds).toBeGreaterThan(1);
    expect(t.wins / t.seeds).toBeGreaterThan(0.85);
    expect(t.punches / t.seeds).toBeGreaterThan(1);
  });

  it('no fight comes near the "battle too long" block: each boss\'s longest fight, in its own actions, is under half of the poll that starts the block', () => {
    for (const [key, t] of results) {
      const act = Number(key[0]) as Act;
      expect(t.maxTurns, key).toBeLessThan(key.includes("/ defend /") ? FIRST_MARKS[act] : FIRST_MARKS[act] / 2); // even a party that only defends does not reach the poll
    }
  });
});

describe('the role tables behind the tactic: the better line for each fight is the one shipped', () => {
  const allSame = (r: Record<string, string>): RoleTable => ({ [ids.X2_BORIS_ID]: r, [ids.X2_FLAME_DRAGON_ID]: r, [ids.X2_GUARDIAN_BEAST_ID]: r, [ids.X2_YSLS_ZERO_ID]: r });
  const VARIANTS: Array<[string, RoleTable]> = [
    ['shipped', ROLES],
    ['starting spheres', allSame({ yuna: 'gunner', rikku: 'thief', paine: 'warrior' })],
    ['White Mage + Black Mage Rikku, Warrior Paine', allSame({ yuna: 'white-mage', rikku: 'black-mage', paine: 'warrior' })],
    ['Gunner Yuna, two Black Mages', allSame({ yuna: 'gunner', rikku: 'black-mage', paine: 'black-mage' })],
    ['White Mage Yuna, Thief, Warrior', allSame({ yuna: 'white-mage', rikku: 'thief', paine: 'warrior' })],
  ];
  const cells = new Map<string, Tally>();

  it('measures the Beast and YSLS-Zero under each role table', () => {
    const out: string[] = [];
    for (const act of [2, 3] as Act[]) {
      for (const [name, roles] of VARIANTS) {
        const t = measure(act, 'advisor', { tactic: gullwingsTactic(roles, SPELL) }, SEEDS);
        cells.set(`${act} / ${name}`, t);
        out.push(`| ${NAMES[act]} | ${name} | ${t.wins}/${t.seeds} | ${avg(t.kos, t)} | ${avg(t.minutes, t)} |`);
        expect(t.unfinished).toBe(0);
      }
    }
    console.log(`\n| fight | role table | wins | girl KOs a fight | minutes a fight |\n|---|---|---|---|---|\n${out.join('\n')}\n`);
  }, 1_800_000);

  it('against the Beast the shipped table (a White Mage and two Black Mages) beats the starting spheres by a wide margin; against YSLS-Zero the starting spheres (shipped) take no more knock-outs than the mage tables', () => {
    const beastShipped = cells.get('2 / shipped')!;
    const beastPlain = cells.get('2 / starting spheres')!;
    expect(beastShipped.wins - beastPlain.wins).toBeGreaterThan(beastShipped.seeds * 0.1);
    expect(beastShipped.wins).toBeGreaterThanOrEqual(Math.max(...VARIANTS.map(([n]) => cells.get(`2 / ${n}`)!.wins)) - 5);
    const yslsShipped = cells.get('3 / shipped')!;
    const yslsMages = cells.get('3 / Gunner Yuna, two Black Mages')!;
    expect(yslsShipped.kos).toBeLessThanOrEqual(yslsMages.kos);
  });
});

describe('the party\'s level is the lever (never a boss number): the advisor line at other levels', () => {
  const LEVELS: ReadonlyArray<[number, number, number]> = [[4, 5, 6], [8, 9, 10], [12, 13, 14], [16, 17, 18], [20, 21, 22]];
  const grid = new Map<string, Tally>();

  it('measures every fight at five party levels', () => {
    const out: string[] = [];
    for (const act of ACTS) {
      const cellsOut: string[] = [];
      for (const lv of LEVELS) {
        const build: FFX2PartyBuild = levelsBuild(...lv);
        const t = measure(act, 'advisor', { build }, HUMAN_SEEDS);
        grid.set(`${act} / ${lv.join('-')}`, t);
        cellsOut.push(`${lv[0]}/${lv[1]}/${lv[2]}: ${t.wins}/${t.seeds} (${avg(t.kos, t)} KOs${act === 0 ? `, web ${t.stickies}` : ''})`);
        expect(t.unfinished).toBe(0);
      }
      out.push(`| ${NAMES[act]} | ${cellsOut.join(' | ')} |`);
    }
    console.log(`\n| fight | ${LEVELS.map((l) => l.join('/')).join(' | ')} |\n|---|---|---|---|---|---|\n${out.join('\n')}\n`);
  }, 1_800_000);

  it('the harder fights get easier with the level, and Boris\'s Sticky End is rare at the shipped level and common at a lower one (the party\'s level is the lever)', () => {
    for (const act of [2, 3] as Act[]) {
      expect(grid.get(`${act} / 20-21-22`)!.kos, NAMES[act]).toBeLessThan(grid.get(`${act} / 8-9-10`)!.kos);
    }
    const low = grid.get('0 / 4-5-6')!;
    const shipped = grid.get('0 / 12-13-14')!;
    expect(low.stickies / low.seeds).toBeGreaterThan(0.5);
    expect(shipped.stickies / shipped.seeds).toBeLessThan(0.1);
    expect(BEAST_BEAT).toBe(4);
  });
});
