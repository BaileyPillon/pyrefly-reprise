/**
 * Garik Ronso and the Ronso Youths (the hidden FFX-2 chapter): the bench. **FFX-2 only** [AGENTS.md rule 14]. **Measure, never tune**: no boss number moves here (rule 6; `boss-side-fix-needs-measured-options`); a result
 * goes to Bailey. The party is the Djose preset (Yuna 32, Rikku 33, Paine 34: `[estimate]`, `src/data/ffx2/builds/garik-ronso.ts`). The moves run on the game's own rows and the scripts are the game's own
 * (`research/re-ffx2-garik-ronso.md`), so the charge and recovery of every move are the rows' own. The guide calls the fight "not too difficult", so the bench confirms "easy to moderate", not a band; the lever is the party.
 *
 * The model is the one the other benches use: bench speed is zero decision time; human speed is the live default, **Wait split**, 1.5 s a menu (0.5 s on the top-level list with the clock running, 1.0 s inside a submenu,
 * held); and the **Active** clock at 1.5 s a decision. Lines (`../helpers/garikRonsoDrive.ts`): **advisor** (the shipped move advisor's tactic, the line the guide teaches), **naive** (no Protect, one plain attack) and, on
 * the hostile fight, **blackMage** (the advisor line with Yuna wearing Black Mage from her first turn: the Curse trap). Two what-if presets, measurement inputs and not shipped: the **Chapter 2 preset** carried forward
 * (Yuna 23, Rikku 24, Paine 25: harder) and the shipped preset at **Lv 40** (easier).
 *
 * **The fights have no clock.** The generic "battle too long" block is inert (`ai/garik-ronso.ts`: its guard is true only when no girl can act, and the ATB clock does not step then), so a line that cannot out-damage
 * Mighty Guard's Regen and Haste does not meet a Time Up Meteor: the fight goes on until the girls fall or the party wins. Every fight therefore ends in one of three ways, and the table counts all three: **wins**, **losses**
 * (the girls fell) and **stalled** (no outcome after {@link STALL_MINUTES} game minutes: the measurement stops there, the fight would go on).
 *
 * `PYREFLY_BENCH_SEEDS` sets the seeds a cell at bench speed (100 by default, the suite's size); the human-speed cells run half as many (at least 40) and the what-if cells a third (at least 30). The handoff's table is the
 * run printed by this file. The table is printed and copied into the handoff `docs/handoff/ch-garik-ronso.md`.
 *
 * What the assertions pin is only that the measurement ran to the end on every seed (a fight that stalls is allowed only on the hostile fight with the naive line or the Chapter 2 preset, the cells that lack the answers),
 * that the advisor line does at least as well as the naive one, that the shipped line wins more often than not, that the Chapter 2 preset does worse than the shipped one on the hostile fight and the Lv 40 one no worse, that
 * the lance finds a Black Mage on nearly every fight of the Black Mage line, that **no fight in any cell ever has a Time Up Meteor** (the inert block, at the engine) and that no advisor-line fight on the shipped preset
 * runs long: a regression guard, not a claim about the game.
 */

import { describe, expect, it } from 'vitest';
import { STEPS_PER_SECOND } from '../../../src/battle/ffx2/clock.ts';
import { RONSO_ANNOUNCEMENT_IDS, RONSO_TIME_UP_METEOR_ID } from '../../../src/data/ffx2/enemies/garik-ronso-abilities.ts';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { besaidKit, driveGarik, lv40Kit, type GarikDriveOptions, type GarikFight, type GarikLine, type GarikRun } from '../helpers/garikRonsoDrive.ts';

const SEEDS = Math.max(100, Number(process.env['PYREFLY_BENCH_SEEDS'] ?? 100));
/** The human-speed cells run fewer seeds (each fight costs more there); the what-ifs fewer still (the Chapter 2 preset's hostile fights run to the stall cap). */
const HUMAN_SEEDS = Math.max(40, Math.floor(SEEDS / 2));
const WHATIF_SEEDS = Math.max(30, Math.floor(SEEDS / 3));
/** A fight with no outcome after this many game minutes is counted stalled and the measurement stops (the shipped line finishes in about one). */
const STALL_MINUTES = 60;
/** The busiest foe's longest fight, in its own actions, that an advisor-line fight on the shipped preset may take (the longest measured is 13). */
const SHORT_FIGHT = 70;
const PACES: ReadonlyArray<[string, GarikDriveOptions]> = [
  ['bench (0 ms)', {}],
  ['Wait split 1.5 s', { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } }],
  ['Active 1.5 s', { decisionMs: 1500, engine: { atbMode: 'active' } }],
];

interface Tally {
  wins: number; seeds: number; stalled: number; minutes: number; longest: number; guards: number; blinds: number; blowouts: number; curses: number; kos: number; meteors: number;
}

function measure(fight: GarikFight, line: GarikLine, opts: GarikDriveOptions, seeds: number): Tally {
  const t: Tally = { wins: 0, seeds, stalled: 0, minutes: 0, longest: 0, guards: 0, blinds: 0, blowouts: 0, curses: 0, kos: 0, meteors: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r: GarikRun = driveGarik(fight, line, seed, { ...opts, stallMinutes: STALL_MINUTES });
    t.minutes += r.ticks / STEPS_PER_SECOND / 60;
    t.longest = Math.max(t.longest, r.longest);
    t.guards += r.moves['x2-garik-mighty-guard'] ?? 0;
    t.blinds += r.moves['x2-garik-blind'] ?? 0;
    t.blowouts += r.moves['x2-ronso-youth-mp-blowout'] ?? 0;
    t.meteors += [RONSO_TIME_UP_METEOR_ID, ...RONSO_ANNOUNCEMENT_IDS].reduce((n, id) => n + (r.moves[id] ?? 0), 0);
    t.curses += r.curses;
    t.kos += r.kos;
    if (r.outcome === 'victory') t.wins += 1;
    else if (r.outcome === undefined) t.stalled += 1;
  }
  return t;
}

const avg = (n: number, t: Tally): string => (n / t.seeds).toFixed(2);
const rows: string[] = [];
const row = (fight: string, line: string, mode: string, t: Tally): void => {
  rows.push(`| ${fight} | ${line} | ${mode} | ${t.wins}/${t.seeds} | ${t.seeds - t.wins - t.stalled} | ${t.stalled} | ${avg(t.minutes, t)} | ${t.longest} | ${avg(t.guards, t)} | ${avg(t.blinds, t)} | ${avg(t.blowouts, t)} | ${avg(t.curses, t)} | ${avg(t.kos, t)} | ${t.meteors} |`);
};

describe(`Garik Ronso: ${SEEDS} seeds a fight at bench speed and ${HUMAN_SEEDS} at human speed, advisor and naive, three paces, and the two what-if presets`, () => {
  const results = new Map<string, Tally>();
  const FIGHTS: GarikFight[] = ['hostile', 'friendly'];
  const LINES: GarikLine[] = ['advisor', 'naive'];
  /** A stall is allowed only where the party lacks the answers: the hostile fight with the naive line, or on the Chapter 2 preset. Everywhere else every fight must end. */
  const mayStall = (fight: GarikFight, line: GarikLine, scenario: string): boolean => fight === 'hostile' && (line === 'naive' || scenario.startsWith('Chapter 2'));

  it('measures every cell to the end of every seed', () => {
    for (const fight of FIGHTS) {
      for (const line of LINES) {
        for (const [pace, opts] of PACES) {
          const t = measure(fight, line, opts, pace.startsWith('bench') ? SEEDS : HUMAN_SEEDS);
          results.set(`${fight} / ${line} / ${pace}`, t);
          row(fight, line, pace, t);
          if (!mayStall(fight, line, pace)) expect(t.stalled, `${fight} / ${line} / ${pace}: every fight reaches an outcome`).toBe(0);
        }
      }
    }
    const trap = measure('hostile', 'blackMage', {}, SEEDS);
    results.set('hostile / blackMage / bench (0 ms)', trap);
    row('hostile', 'blackMage (Yuna wears Black Mage)', 'bench (0 ms)', trap);
    expect(trap.stalled).toBe(0);
    const whatIfs: Array<[string, () => FFX2PartyBuild]> = [['Chapter 2 preset (23/24/25)', besaidKit], ['Lv 40', lv40Kit]];
    for (const [name, build] of whatIfs) {
      for (const fight of FIGHTS) {
        for (const line of LINES) {
          const t = measure(fight, line, { build: build() }, WHATIF_SEEDS);
          results.set(`${fight} / ${line} / ${name}`, t);
          row(fight, line, `${name}, bench (0 ms)`, t);
          if (!mayStall(fight, line, name)) expect(t.stalled, `${fight} / ${line} / ${name}: every fight reaches an outcome`).toBe(0);
        }
      }
    }
    console.log(
      `\n| fight | line | mode | wins | losses | stalled (${STALL_MINUTES} game min) | minutes | longest (a foe's actions) | Mighty Guard | Blind | MP Blowout | Curse landed | KOs | Meteor rows |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`,
    );
  }, 3_600_000);

  const cell = (key: string): Tally => {
    const t = results.get(key);
    if (t === undefined) throw new Error(`the first test fills the table: ${key}`);
    return t;
  };

  it('the advisor line does at least as well as the naive one at every pace on both fights, and wins more often than not at bench speed and at the live default', () => {
    for (const fight of FIGHTS) {
      for (const [pace] of PACES) expect(cell(`${fight} / advisor / ${pace}`).wins, `${fight} / ${pace}`).toBeGreaterThanOrEqual(cell(`${fight} / naive / ${pace}`).wins);
      expect(cell(`${fight} / advisor / bench (0 ms)`).wins, fight).toBeGreaterThan(SEEDS / 2);
      expect(cell(`${fight} / advisor / Wait split 1.5 s`).wins, fight).toBeGreaterThan(HUMAN_SEEDS / 2);
    }
  });

  it('the block is inert at the engine: no fight in any cell has an announcement or a Time Up Meteor, and no advisor-line fight on the shipped preset runs long (the busiest foe\'s longest fight, in its own actions, stays under 70)', () => {
    for (const [key, t] of results) {
      expect(t.meteors, `${key}: the "battle too long" block never runs`).toBe(0);
      if (key.includes('/ advisor /') && !key.includes('preset') && !key.includes('Lv 40')) expect(t.longest, key).toBeLessThan(SHORT_FIGHT);
    }
  });

  it('the Chapter 2 preset does worse than the shipped one on the hostile fight (its fights stall or are lost, with no clock to end them), and the Lv 40 preset no worse', () => {
    const shipped = cell('hostile / advisor / bench (0 ms)');
    const early = cell('hostile / advisor / Chapter 2 preset (23/24/25)');
    const late = cell('hostile / advisor / Lv 40');
    expect(early.wins / early.seeds).toBeLessThan(shipped.wins / shipped.seeds);
    expect(late.wins / late.seeds).toBeGreaterThanOrEqual(shipped.wins / shipped.seeds);
  });

  it('the Black Mage trap: with Yuna in Black Mage the lance finds her on nearly every fight and the curse lands, and the party still wins most fights', () => {
    const trap = cell('hostile / blackMage / bench (0 ms)');
    expect(trap.curses / trap.seeds).toBeGreaterThan(0.5);
    expect(trap.wins).toBeGreaterThan(SEEDS / 2);
    expect(cell('hostile / advisor / bench (0 ms)').curses).toBe(0);
  });
});
