/**
 * Chapter XIII — measuring the four OFF options of `docs/plans/trema-options-2026-09-25.md`
 * against each other and against the shipped chapter, plus the global effect of option 3
 * (action time, E4) on Chapters 4, 5, 6 and XI. **FFX-2 only** [AGENTS.md rule 14]. Every switch
 * stays OFF in the shipped chapter (`chapter-ffx2-trema.ts`); this file drives the option
 * formations and builds directly, the same way `trema-oversoul.test.ts` and `trema-options.test.ts`
 * already do. Measure, never tune [`docs/plans/chapter-trema-review.md` §9].
 *
 * **Pruning** (rule 15, "size the run"): a full cross of {4 kits} x {2 Paragon forms} x
 * {2 chapter shapes} x {3 action times} would be 48 rows a link; most of it cannot matter:
 * - Chapter shape `trema-alone` drops the Paragon dimension outright (there is no Paragon link),
 *   so it is measured once per kit, not per Paragon form.
 * - NightMare185's kit (option 4) is a TR10 change only; it is not crossed with Oversoul Paragon
 *   or Trema-alone, which are TR7/TR1 changes to a *different* link shape.
 * - Action time (option 3) is measured on the two shapes that matter for it: the shipped shape
 *   (normal Paragon, tr11-a) at 1.5 s and 3 s, and the best surviving option (Oversoul Paragon,
 *   sourced-kit) at 1.5 s only, to see whether it stacks.
 * That leaves the rows below.
 */

import { describe, expect, it } from 'vitest';
import {
  driveChapter, driveParagon, driveTremaFresh, LINES, type DriveOptions, type LineOptions, type LinkRun,
} from '../helpers/tremaDrive.ts';
import { tremaBuildFor, type TremaKitOption } from '../../../src/data/ffx2/builds/via-infinito-kit.ts';
import { viaInfinitoNightmareKitBuild } from '../../../src/data/ffx2/builds/via-infinito-nightmare.ts';
import { CLOISTER_PARAGON_OVERSOUL, CLOISTER_TREMA_ARENA } from '../../../src/data/ffx2/enemies/trema-options.ts';
import { driveChapter4, driveChapter5, driveChapter6 } from '../helpers/ffx2ChapterDrive.ts';
import { driveChain as driveFallenAeons, LINES as FA_LINES } from '../helpers/fallenAeonsDrive.ts';

const SEEDS = 200;
const HUMAN_SEEDS = 40;
const HUMAN = 1500;
const WAIT_SPLIT = { decisionMs: HUMAN, topMs: 500, engine: { atbMode: 'wait' as const, waitSplit: true } };
const rows: string[] = [];

interface Tally { wins: number; seeds: number; unfinished: number; minutes: number }
type Run = LinkRun | { outcome: string | undefined; links: LinkRun[] };

function bench(run: (seed: number) => Run, seeds: number): Tally {
  const t: Tally = { wins: 0, seeds, unfinished: 0, minutes: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r = run(seed);
    const links = 'links' in r ? r.links : [r];
    const minutes = links.reduce((m, l) => m + l.minutes, 0);
    if (r.outcome === 'victory') t.wins += 1;
    if (r.outcome === undefined) t.unfinished += 1;
    t.minutes += minutes;
  }
  return t;
}

function row(name: string, link: string, mode: string, t: Tally): void {
  rows.push(`| ${name} | ${link} | ${mode} | ${t.wins}/${t.seeds} | ${(t.minutes / t.seeds).toFixed(2)} |`);
}

function printTable(): void {
  console.log(['| Option | Link | Mode | Wins | Avg min |', '|---|---|---|---:|---:|', ...rows].join('\n'));
}

const kitLine = (kit: TremaKitOption | 'nightmare-kit'): LineOptions =>
  (kit === 'tr11-a' ? LINES.intended : kit === 'nightmare-kit' ? LINES.nightmare : LINES.kitIntended);
const kitBuild = (kit: TremaKitOption | 'nightmare-kit') =>
  (kit === 'nightmare-kit' ? viaInfinitoNightmareKitBuild : tremaBuildFor(kit));

describe('Option 2 (TR1 b): Trema alone, the Fiend Arena block — kit is the only lever', () => {
  const kits: (TremaKitOption | 'nightmare-kit')[] = ['tr11-a', 'sourced-kit', 'sourced-kit-ribbon', 'nightmare-kit'];
  for (const kit of kits) {
    it(`${kit}: bench (200) and human Wait split (40)`, () => {
      const opts = (extra: Partial<DriveOptions> = {}): DriveOptions => ({ build: kitBuild(kit), tremaGroup: CLOISTER_TREMA_ARENA, ...extra });
      const bt = bench((s) => driveTremaFresh(kitLine(kit), s, opts()), SEEDS);
      const ht = bench((s) => driveTremaFresh(kitLine(kit), s, opts(WAIT_SPLIT)), HUMAN_SEEDS);
      row(`2: Trema alone (${kit})`, 'chapter (one link)', 'bench D=0', bt);
      row(`2: Trema alone (${kit})`, 'chapter (one link)', 'human Wait split', ht);
      expect(bt.unfinished).toBe(0);
    }, 600_000);
  }
});

describe('Option 1 (TR7 b): Oversoul Paragon, then the shipped Trema link', () => {
  const kits: (TremaKitOption | 'nightmare-kit')[] = ['tr11-a', 'sourced-kit', 'sourced-kit-ribbon'];
  for (const kit of kits) {
    it(`${kit}: Paragon link and whole chapter, bench (200) and human (40)`, () => {
      const opts = (extra: Partial<DriveOptions> = {}): DriveOptions => ({ build: kitBuild(kit), paragonGroup: CLOISTER_PARAGON_OVERSOUL, ...extra });
      const pb = bench((s) => driveParagon(kitLine(kit), s, opts()), SEEDS);
      const ph = bench((s) => driveParagon(kitLine(kit), s, opts(WAIT_SPLIT)), HUMAN_SEEDS);
      const cb = bench((s) => driveChapter(kitLine(kit), s, opts()), SEEDS);
      const ch = bench((s) => driveChapter(kitLine(kit), s, opts(WAIT_SPLIT)), HUMAN_SEEDS);
      row(`1: Oversoul Paragon (${kit})`, '1 Paragon', 'bench D=0', pb);
      row(`1: Oversoul Paragon (${kit})`, '1 Paragon', 'human Wait split', ph);
      row(`1: Oversoul Paragon (${kit})`, 'Chapter (1-2)', 'bench D=0', cb);
      row(`1: Oversoul Paragon (${kit})`, 'Chapter (1-2)', 'human Wait split', ch);
      expect(pb.unfinished).toBe(0);
    }, 600_000);
  }
});

describe('Option 4 (TR10): NightMare185\'s kit, normal Paragon and the shipped Trema link', () => {
  it('Paragon, Trema fresh and the chapter, bench (200) and human (40)', () => {
    const opts = (extra: Partial<DriveOptions> = {}): DriveOptions => ({ build: viaInfinitoNightmareKitBuild, ...extra });
    for (const [label, drive] of [
      ['1 Paragon', driveParagon], ['2 Trema (fresh)', driveTremaFresh], ['Chapter (1-2)', driveChapter],
    ] as const) {
      const bt = bench((s) => (drive as typeof driveParagon)(LINES.nightmare, s, opts()), SEEDS);
      const ht = bench((s) => (drive as typeof driveParagon)(LINES.nightmare, s, opts(WAIT_SPLIT)), HUMAN_SEEDS);
      row('4: NightMare185\'s kit', label, 'bench D=0', bt);
      row('4: NightMare185\'s kit', label, 'human Wait split', ht);
    }
  }, 600_000);
});

describe('Option 3 (E4): action time, on the shipped shape and on the best surviving option', () => {
  for (const seconds of [1.5, 3]) {
    it(`shipped shape (tr11-a, normal Paragon), action time ${seconds}s`, () => {
      const opts = (extra: Partial<DriveOptions> = {}): DriveOptions => ({ engine: { actionTimeSeconds: seconds }, ...extra });
      const pb = bench((s) => driveParagon(LINES.intended, s, opts()), SEEDS);
      const cb = bench((s) => driveChapter(LINES.intended, s, opts()), SEEDS);
      const ph = bench((s) => driveParagon(LINES.intended, s, opts({ ...WAIT_SPLIT, engine: { ...WAIT_SPLIT.engine, actionTimeSeconds: seconds } })), HUMAN_SEEDS);
      const ch = bench((s) => driveChapter(LINES.intended, s, opts({ ...WAIT_SPLIT, engine: { ...WAIT_SPLIT.engine, actionTimeSeconds: seconds } })), HUMAN_SEEDS);
      row(`3: action time ${seconds}s (normal Paragon, tr11-a)`, '1 Paragon', 'bench D=0', pb);
      row(`3: action time ${seconds}s (normal Paragon, tr11-a)`, 'Chapter (1-2)', 'bench D=0', cb);
      row(`3: action time ${seconds}s (normal Paragon, tr11-a)`, '1 Paragon', 'human Wait split', ph);
      row(`3: action time ${seconds}s (normal Paragon, tr11-a)`, 'Chapter (1-2)', 'human Wait split', ch);
    }, 600_000);
  }

  it('stacked on the best surviving option (Oversoul Paragon, sourced-kit), action time 1.5s', () => {
    const opts: DriveOptions = { build: tremaBuildFor('sourced-kit'), paragonGroup: CLOISTER_PARAGON_OVERSOUL, engine: { actionTimeSeconds: 1.5 } };
    const pb = bench((s) => driveParagon(LINES.kitIntended, s, opts), SEEDS);
    const cb = bench((s) => driveChapter(LINES.kitIntended, s, opts), SEEDS);
    row('3+1: Oversoul Paragon (sourced-kit) + action time 1.5s', '1 Paragon', 'bench D=0', pb);
    row('3+1: Oversoul Paragon (sourced-kit) + action time 1.5s', 'Chapter (1-2)', 'bench D=0', cb);
  }, 600_000);

  it('prints the option table', () => printTable());
});

/** Global action-time effect: Chapters 4, 5, 6 and XI, intended lines, against the current (0s) numbers. */
describe('Option 3 (E4), global: Chapters 4, 5, 6 and XI at their intended lines', () => {
  const gRows: string[] = [];
  const grow = (chapter: string, seconds: number, mode: string, t: Tally) =>
    gRows.push(`| ${chapter} | ${seconds === 0 ? 'off' : `${seconds}s`} | ${mode} | ${t.wins}/${t.seeds} | ${(t.minutes / t.seeds).toFixed(2)} |`);

  function chapterTally(
    drive: (seed: number, decisionMs: number, extra: Record<string, unknown>, prepare?: undefined, topMs?: number) => { outcome: string | undefined; ticks: number },
    seeds: number,
    decisionMs: number,
    seconds: number,
    topMs?: number,
  ): Tally {
    const t: Tally = { wins: 0, seeds, unfinished: 0, minutes: 0 };
    for (let seed = 1; seed <= seeds; seed++) {
      const r = drive(seed, decisionMs, { actionTimeSeconds: seconds || undefined, atbMode: topMs !== undefined ? 'wait' : 'active', waitSplit: topMs !== undefined }, undefined, topMs);
      if (r.outcome === 'victory') t.wins += 1;
      if (r.outcome === undefined) t.unfinished += 1;
      t.minutes += r.ticks / 3000 / 60;
    }
    return t;
  }

  const chapters: [string, typeof driveChapter4][] = [['Ch4 Bahamut', driveChapter4], ['Ch5 Vegnagun', driveChapter5], ['Ch6 Leblanc', driveChapter6]];
  for (const [name, drive] of chapters) {
    it(`${name}: bench (100) and human Wait split (40) at 0s / 1.5s / 3s`, () => {
      for (const seconds of [0, 1.5, 3]) {
        grow(name, seconds, 'bench D=0', chapterTally(drive, 100, 0, seconds));
        grow(name, seconds, 'human Wait split', chapterTally(drive, HUMAN_SEEDS, HUMAN, seconds, 500));
      }
    }, 600_000);
  }

  it('Ch11 Fallen Aeons: bench (100) and human Wait split (40) at 0s / 1.5s / 3s', () => {
    const lines = [FA_LINES.shivaIntended, FA_LINES.sistersDarknessDispel, FA_LINES.animaIntended] as const;
    for (const seconds of [0, 1.5, 3]) {
      const bt: Tally = { wins: 0, seeds: 100, unfinished: 0, minutes: 0 };
      for (let seed = 1; seed <= 100; seed++) {
        const r = driveFallenAeons(lines, seed, { engine: { actionTimeSeconds: seconds || undefined } });
        if (r.outcome === 'victory') bt.wins += 1;
        if (r.outcome === undefined) bt.unfinished += 1;
        bt.minutes += r.links.reduce((m, l) => m + l.ticks / 3000 / 60, 0);
      }
      grow('Ch11 Fallen Aeons', seconds, 'bench D=0', bt);
      const ht: Tally = { wins: 0, seeds: HUMAN_SEEDS, unfinished: 0, minutes: 0 };
      for (let seed = 1; seed <= HUMAN_SEEDS; seed++) {
        const r = driveFallenAeons(lines, seed, { decisionMs: HUMAN, topMs: 500, engine: { atbMode: 'wait', waitSplit: true, actionTimeSeconds: seconds || undefined } });
        if (r.outcome === 'victory') ht.wins += 1;
        if (r.outcome === undefined) ht.unfinished += 1;
        ht.minutes += r.links.reduce((m, l) => m + l.ticks / 3000 / 60, 0);
      }
      grow('Ch11 Fallen Aeons', seconds, 'human Wait split', ht);
    }
  }, 600_000);

  it('prints the global table', () => {
    console.log(['| Chapter | Action time | Mode | Wins | Avg min |', '|---|---|---|---:|---:|', ...gRows].join('\n'));
  });
});
