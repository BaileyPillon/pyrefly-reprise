/**
 * Chapter XIII — seeded benches, 200 seeds per line at bench speed and 40 at human speed (plan
 * `docs/plans/chapter-trema-review.md` §9, T10; TR6 = c: "measure first, then ask once with the
 * numbers"). **FFX-2 only.** Measure, never tune: a low rate goes to Bailey as measured options;
 * no boss number is changed to move it. The table is printed and copied into
 * `docs/plans/trema-bench.md`.
 *
 * Re-run 2026-09-25 after the method check's corrections (`docs/plans/trema-winnability-method-check.md`:
 * E1 timed ailments, E2 accessories through a spherechange, E3 Paragon's physicals always land) and
 * with the **kit options** built but OFF in the chapter (`src/data/ffx2/builds/via-infinito-kit.ts`).
 * Every line is run as an intended line and a credibly wrong one, on Paragon, on Trema fresh (full
 * HP and MP: the upper bound of link 2) and on the whole chapter as the app carries it.
 *
 * **Action time off in every row** (`AT_OFF`): since 2026-09-25 the Cloister formations carry 3 s of
 * action time (option 3, shipped), and the engine option 0 wins over a formation's value, so these
 * rows keep measuring what they always measured. The shipped setting's bench is
 * `trema-shipped-bench.test.ts`.
 *
 * Bench speed is zero decision time under Active ATB (Bailey, 2026-09-21: FFX-2 is Active only);
 * the human rows spend 1.5 s per menu under Active. Minutes are game minutes at Normal ATB speed.
 * The remaining option rows are **not built**: T-6 b swaps in the wiki's reading of Paragon's block
 * (Mag 88 / Def 244 / MDef 89), and 20 Phoenix Downs are outside the approved TR11 a bag.
 */

import { describe, expect, it } from 'vitest';
import { driveChapter, driveParagon, driveTremaFresh, LINES, type DriveOptions, type LineOptions, type LinkRun } from '../helpers/tremaDrive.ts';
import { tremaBuildFor, type TremaKitOption } from '../../../src/data/ffx2/builds/via-infinito-kit.ts';

const SEEDS = 200;
const HUMAN_SEEDS = 40;
const HUMAN = 1500;
const WIKI_T6 = { mag: 88, def: 244, mdef: 89 };
const PHOENIX_DOWNS = [{ itemId: 'x2-phoenix-down', count: 20 }];
const rows: string[] = [];

/** These rows measure with action time off (see the header); a row's own engine options are kept. */
const AT_OFF = (o: DriveOptions): DriveOptions => ({ ...o, engine: { actionTimeSeconds: 0, ...o.engine } });

interface Tally { wins: number; seeds: number; unfinished: number; minutes: number; winMinutes: number; reached: number; bigBang: number; genesis: number; meteor: number; flare: number; blocked: number; darkness: number }
type Run = LinkRun | { outcome: string | undefined; links: LinkRun[] };

function bench(run: (seed: number) => Run, seeds: number): Tally {
  const t: Tally = { wins: 0, seeds, unfinished: 0, minutes: 0, winMinutes: 0, reached: 0, bigBang: 0, genesis: 0, meteor: 0, flare: 0, blocked: 0, darkness: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r = run(seed);
    const links = 'links' in r ? r.links : [r];
    const minutes = links.reduce((m, l) => m + l.minutes, 0);
    if (r.outcome === 'victory') { t.wins += 1; t.winMinutes += minutes; }
    if (r.outcome === undefined) t.unfinished += 1;
    if (links.length > 1) t.reached += 1;
    t.minutes += minutes;
    for (const l of links) {
      t.bigBang += l.count('paragon-big-bang');
      t.genesis += l.count('paragon-genesis');
      t.meteor += l.count('trema-meteor');
      t.flare += l.count('trema-flare');
      t.blocked += l.blocked;
      t.darkness += l.count('x2-dark-knight-darkness');
    }
  }
  return t;
}

const per = (n: number, t: Tally) => (n / t.seeds).toFixed(2);

function row(kit: string, link: string, line: string, mode: string, t: Tally): void {
  const winMin = t.wins > 0 ? (t.winMinutes / t.wins).toFixed(1) : '—';
  const moves = link.startsWith('1')
    ? `BB ${per(t.bigBang, t)} · Gen ${per(t.genesis, t)}`
    : link.startsWith('2')
      ? `Met ${per(t.meteor, t)} · Flare ${per(t.flare, t)} · blocked ${per(t.blocked, t)}`
      : `reached Trema ${t.reached}/${t.seeds}`;
  rows.push(`| ${kit} | ${link} | ${line} | ${mode} | ${t.wins}/${t.seeds} | ${(t.minutes / t.seeds).toFixed(2)} | ${winMin} | ${moves} | ${per(t.darkness, t)} |`);
}

type Case = [kit: TremaKitOption, link: string, line: string, run: (opts: DriveOptions) => (seed: number) => Run];
const P = (l: LineOptions) => (o: DriveOptions) => (s: number) => driveParagon(l, s, AT_OFF(o));
const T = (l: LineOptions) => (o: DriveOptions) => (s: number) => driveTremaFresh(l, s, AT_OFF(o));
const C = (l: LineOptions) => (o: DriveOptions) => (s: number) => driveChapter(l, s, AT_OFF(o));

/** TR11 a (the shipped build) and each kit option, intended and credibly wrong, on every link. */
const CASES: Case[] = [
  ['tr11-a', '1 Paragon', 'intended: Attack, Shell, heals, never Darkness', P(LINES.intended)],
  ['tr11-a', '1 Paragon', 'wrong: Darkness on Paragon', P(LINES.darknessOnParagon)],
  ['tr11-a', '2 Trema (fresh)', 'intended: Protect, drain to < 10 MP, Shell before Meteor, Darkness x2', T(LINES.intended)],
  ['tr11-a', '2 Trema (fresh)', 'intended without the drain', T(LINES.noDrain)],
  ['tr11-a', '2 Trema (fresh)', 'wrong: Darkness x2, no drain, no Curtains', T(LINES.noDrainNoShell)],
  ['tr11-a', 'Chapter (1-2)', 'intended on both links', C(LINES.intended)],
  ['tr11-a', 'Chapter (1-2)', 'wrong: Darkness on Paragon', C(LINES.darknessOnParagon)],
  ['sourced-kit', '1 Paragon', 'kit intended: Tonic, Megalixir, Shell, Attack, Itchy spherechanged', P(LINES.kitIntended)],
  ['sourced-kit', '1 Paragon', 'kit wrong: Darkness on Paragon', P(LINES.kitDarknessOnParagon)],
  ['sourced-kit', '2 Trema (fresh)', 'kit intended: Soul Spring, Tonic, Three Stars, Darkness x2', T(LINES.kitIntended)],
  ['sourced-kit', '2 Trema (fresh)', 'kit wrong: no drain, no Curtains, no Stars', T(LINES.kitNoDrainNoShell)],
  ['sourced-kit', 'Chapter (1-2)', 'kit intended on both links', C(LINES.kitIntended)],
  ['sourced-kit', 'Chapter (1-2)', 'kit wrong: Darkness on Paragon', C(LINES.kitDarknessOnParagon)],
  ['sourced-kit-one-lustre', '1 Paragon', 'kit intended', P(LINES.kitIntended)],
  ['sourced-kit-one-lustre', '2 Trema (fresh)', 'kit intended', T(LINES.kitIntended)],
  ['sourced-kit-one-lustre', 'Chapter (1-2)', 'kit intended', C(LINES.kitIntended)],
  ['sourced-kit-ribbon', '1 Paragon', 'kit intended', P(LINES.kitIntended)],
  ['sourced-kit-ribbon', '2 Trema (fresh)', 'kit intended', T(LINES.kitIntended)],
  ['sourced-kit-ribbon', 'Chapter (1-2)', 'kit intended', C(LINES.kitIntended)],
];

describe('Chapter XIII benches (200 seeds a line, bench speed, Active)', () => {
  const results = new Map<string, Tally>();
  for (const [kit, link, name, run] of CASES) {
    it(`${kit} · ${link}: ${name}`, () => {
      const t = bench(run({ build: tremaBuildFor(kit) }), SEEDS);
      results.set(`${kit}|${link}|${name}`, t);
      row(kit, link, name, 'Active, D=0', t);
      expect(t.unfinished).toBe(0); // every run ends in a win or a loss
    }, 600_000);
  }

  it('the wrong line on Paragon draws Big Bang and the intended one never does', () => {
    expect(results.get('tr11-a|1 Paragon|intended: Attack, Shell, heals, never Darkness')?.bigBang).toBe(0);
    expect(results.get('sourced-kit|1 Paragon|kit intended: Tonic, Megalixir, Shell, Attack, Itchy spherechanged')?.bigBang).toBe(0);
  });

  it('option rows that are not built (T-6 b, Phoenix Downs)', () => {
    row('tr11-a', '1 Paragon', 'option T-6 b (wiki Mag 88 / Def 244 / MDef 89), intended', 'Active, D=0', bench(P(LINES.intended)({ paragonStats: WIKI_T6 }), SEEDS));
    row('sourced-kit', '1 Paragon', 'option T-6 b, kit intended', 'Active, D=0', bench(P(LINES.kitIntended)({ paragonStats: WIKI_T6, build: tremaBuildFor('sourced-kit') }), SEEDS));
    row('tr11-a', '2 Trema (fresh)', 'option: + 20 Phoenix Downs (not built), intended', 'Active, D=0', bench(T(LINES.intended)({ extraItems: PHOENIX_DOWNS }), SEEDS));
  }, 600_000);

  it('human speed: 1.5 s a menu under Active (40 seeds)', () => {
    for (const [kit, line] of [['tr11-a', LINES.intended], ['sourced-kit', LINES.kitIntended]] as const) {
      const o = { decisionMs: HUMAN, build: tremaBuildFor(kit) };
      row(kit, '1 Paragon', 'intended', 'Active, D=1.5 s', bench(P(line)(o), HUMAN_SEEDS));
      row(kit, '2 Trema (fresh)', 'intended', 'Active, D=1.5 s', bench(T(line)(o), HUMAN_SEEDS));
      row(kit, 'Chapter (1-2)', 'intended', 'Active, D=1.5 s', bench(C(line)(o), HUMAN_SEEDS));
    }
    console.log(
      ['| Kit | Link | Line | ATB | Wins | Avg min | Avg min (wins) | Boss moves / fight | Darkness / fight |',
        '|---|---|---|---|---:|---:|---:|---|---:|', ...rows].join('\n'),
    );
  }, 900_000);

  // 2026-09-25, third pass: the live default became Wait split (`DEFAULT_WAIT_SPLIT = true` since
  // release 12.3), not Active. A human under Wait split spends 0.5 s reading the top-level command
  // list, where the clock still runs exactly as it does under Active (`throughInput`), then 1.0 s
  // inside a submenu or aiming a target, where Wait's split holds the clock (`active.ts`
  // `DEFAULT_WAIT_SPLIT`; modelled the same way `fallenAeonsDrive.ts` and `ffx2ChapterDrive.ts`
  // already model it: `engine.setMenuLevel('top')`, tick `topMs`, `engine.setMenuLevel('deep')`,
  // and no further tick for the rest of the 1.5 s). Every kit x every link, intended line, 40 seeds.
  it('human speed: Wait split, 0.5 s top / 1.0 s held (40 seeds)', () => {
    const kits: TremaKitOption[] = ['tr11-a', 'sourced-kit', 'sourced-kit-one-lustre', 'sourced-kit-ribbon'];
    for (const kit of kits) {
      const line = kit === 'tr11-a' ? LINES.intended : LINES.kitIntended;
      const o = { decisionMs: HUMAN, topMs: 500, engine: { atbMode: 'wait' as const, waitSplit: true }, build: tremaBuildFor(kit) };
      row(kit, '1 Paragon', 'intended', 'Wait split, D=1.5 s (0.5 s top)', bench(P(line)(o), HUMAN_SEEDS));
      row(kit, '2 Trema (fresh)', 'intended', 'Wait split, D=1.5 s (0.5 s top)', bench(T(line)(o), HUMAN_SEEDS));
      row(kit, 'Chapter (1-2)', 'intended', 'Wait split, D=1.5 s (0.5 s top)', bench(C(line)(o), HUMAN_SEEDS));
    }
    console.log(
      ['| Kit | Link | Line | ATB | Wins | Avg min | Avg min (wins) | Boss moves / fight | Darkness / fight |',
        '|---|---|---|---|---:|---:|---:|---|---:|', ...rows].join('\n'),
    );
  }, 1_200_000);

  // The two kits that win at all at bench speed, at 200 seeds, to confirm the engine's Wait split
  // mode does not itself move a bench-speed (D=0) result: no decision time is ever ticked at D=0,
  // so the top/held split has nothing to act on and the numbers should match the Active D=0 rows.
  it('sourced-kit and sourced-kit-ribbon on Trema fresh, Wait split at bench speed (200 seeds)', () => {
    for (const kit of ['sourced-kit', 'sourced-kit-ribbon'] as const) {
      const o = { engine: { atbMode: 'wait' as const, waitSplit: true }, build: tremaBuildFor(kit) };
      const t = bench(T(LINES.kitIntended)(o), SEEDS);
      row(kit, '2 Trema (fresh)', 'kit intended', 'Wait split, D=0', t);
      expect(t.unfinished).toBe(0);
    }
    console.log(
      ['| Kit | Link | Line | ATB | Wins | Avg min | Avg min (wins) | Boss moves / fight | Darkness / fight |',
        '|---|---|---|---|---:|---:|---:|---|---:|', ...rows].join('\n'),
    );
  }, 600_000);
});
