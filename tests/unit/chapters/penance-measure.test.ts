/**
 * Is the Penance fight winnable? MEASURED, not assumed (FFX only; the hidden Penance chapter; the plan's section 9, the Chapter XXVII bench's method): scripted players (`tests/unit/helpers/penanceBot.ts`) play the real
 * engine to an outcome with **no god mode**, 100 seeds a row (seeds 1000 to 1099), **the boss never tuned**; the only levers are the party's preset (the armour, the bag).
 *
 * **The result, written into the handoff (`docs/handoff/ch-penance.md` section 5) and pinned here as a tripwire, not a target:** on the shipped party **no line wins one battle in a hundred** (the plan's prediction
 * J2, "the advisor's line wins 45 to 85 percent with the Celestial rows", was WRONG: it priced the Celestial rows and not the arms' tempo). The arms act hasted, twice for each of Penance's turns; a standing arm's blow
 * one-shots a 9,999-HP member or Petrifies one, Tera Graviton takes three quarters and Dooms the party, and keeping the arms down (six hits each, every 24 ticks) takes four fifths of the party's actions. If a later change
 * moves these counts, re-measure and update the handoff's section 5, never the bounds alone.
 *
 * Fast rows run by default (the careless line, the two lines that leave the arms alone, the advisor's lock); the slow rows (the arms-only line and the two armour levers) print their table when `PENANCE_MEASURE=1`.
 * `PENANCE_MEASURE=1 npx vitest run tests/unit/chapters/penance-measure.test.ts` prints every row.
 */

import { describe, expect, it } from 'vitest';

import { LINES, drivePenance, playPenance, withArmor, type PenanceRun } from '../helpers/penanceBot.ts';
import { PENANCE, actor, log } from '../helpers/penanceDrive.ts';

const SEEDS = Array.from({ length: 100 }, (_, i) => 1000 + i);
const FULL = process.env['PENANCE_MEASURE'] === '1';

const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

function run(line: string, build?: ReturnType<typeof withArmor>): PenanceRun[] {
  return SEEDS.map((seed) => playPenance(seed, LINES[line]!, build));
}

function summary(label: string, runs: PenanceRun[]): string {
  const out = (o: string): number => runs.filter((r) => r.outcome === o).length;
  return `${label.padEnd(34)} win ${out('victory')}/${runs.length} defeat ${out('defeat')} escape ${out('escape')} stalled ${out('stalled')} | reached the change ${runs.filter((r) => r.changed).length} | median ticks ${median(runs.map((r) => r.ticks))} | best dealt ${(12_000_000 - Math.min(...runs.map((r) => r.hp))).toLocaleString()} | Judgment Days ${runs.reduce((a, r) => a + r.judgmentDays, 0)}`;
}

const wins = (runs: PenanceRun[]): number => runs.filter((r) => r.outcome === 'victory').length;
const ended = (runs: PenanceRun[]): boolean => runs.every((r) => r.outcome !== 'stalled');

describe('the shipped party against the scripted lines (100 seeds a row, no god mode)', () => {
  it('the careless line (Attack the first enemy, heal nothing) wins none, and is over within a few turns', () => {
    const runs = run('careless');
    expect(wins(runs)).toBe(0);
    expect(ended(runs)).toBe(true);
    expect(median(runs.map((r) => r.ticks))).toBeLessThan(60);
    if (FULL) console.log(summary('careless, shipped party', runs));
  }, 120_000);

  it('the lines that leave the arms alone win none: Penance\'s first Tera Graviton or Armor Break ends them long before the change', () => {
    for (const line of ['no-arms', 'body-first']) {
      const runs = run(line);
      expect(wins(runs), line).toBe(0);
      expect(ended(runs), line).toBe(true);
      expect(runs.filter((r) => r.changed).length, `${line}: runs that reached the change`).toBeLessThanOrEqual(10);
      if (FULL) console.log(summary(`${line}, shipped party`, runs));
    }
  }, 120_000);

  it('the advisor\'s line (the arm lock: strike a standing arm before anything else, Dispel the Armor-Broken, Cheers from Hyper NulAll) wins none either, but it is the line that gets through the change and takes the Judgment Day rule to its test', () => {
    const runs = run('advisor');
    expect(wins(runs)).toBeLessThanOrEqual(10); // measured 0; a tripwire against the fight becoming easy by accident
    expect(ended(runs)).toBe(true);
    expect(runs.filter((r) => r.changed).length, 'advisor runs that reached the change').toBeGreaterThanOrEqual(10);
    expect(runs.reduce((a, r) => a + r.armDeaths, 0), 'arms fell').toBeGreaterThan(100);
    expect(Math.min(...runs.map((r) => r.hp)), 'the best run took Penance under 9,000,000').toBeLessThan(9_000_000);
    if (FULL) console.log(summary('advisor (lock), shipped party', runs));
  }, 180_000);

  it('the sustain line (what the first measurement left untried: Mighty G for Shell, Protect and Haste on everyone, Shell kept up against Tera Graviton, Yuna leading the heals, the arm lock) wins none either, and gets through the change less often than the advisor on the shipped party (it gives up the five Cheers)', () => {
    const runs = run('sustain');
    expect(wins(runs)).toBeLessThanOrEqual(10); // measured 0
    expect(ended(runs)).toBe(true);
    expect(Math.min(...runs.map((r) => r.hp)), 'the best run took Penance down a good way').toBeLessThan(11_000_000);
    if (FULL) console.log(summary('sustain (lock), shipped party', runs));
  }, 180_000);

  it('the same seed gives the same battle: a line replayed over a handful of seeds is entry for entry the same run', () => {
    for (const seed of [1000, 1007, 1042]) expect(playPenance(seed, LINES['advisor']!)).toEqual(playPenance(seed, LINES['advisor']!));
    for (const seed of [1000, 1003]) expect(playPenance(seed, LINES['guide']!)).toEqual(playPenance(seed, LINES['guide']!));
  }, 120_000);
});

/**
 * **The guide line wins real battles (fix pass 2, 2026-11-06; closes the handoff's open issue M-2).** `penanceGuide.ts` plays the strategy the four guides give as the engine allows: Hyper NulAll first, Three Stars, the arms never
 * get a turn (five blows when there is room, the last one held until just before the arm acts, the Left Arm first), Quick Hit, Dispel on the Breaks and on Penance's Haste and Regen, a standing arm down at each of Penance's
 * turns. On seeds 1000 to 1099 and the shipped party it wins 55 of 100 (and the held-out seeds 2000 to 2099: see the handoff, section 5). **These are tripwires, not targets:** if a later change moves them, re-measure and
 * update the handoff's section 5, never the bounds alone. Every number is from `submit` alone: the helper never writes to the engine (the second test proves it from the log).
 */
describe('the guide line (the guides\' strategy as the engine allows): real wins, no state edit', () => {
  it('wins between 35 and 85 of 100 on the shipped party (Left Arm first: GamerGuides, Jegged), and every win is a victory with Penance at 0 after the change', () => {
    const left = run('guide');
    const w = wins(left);
    expect(ended(left)).toBe(true);
    expect(w, 'guide (Left Arm first)').toBeGreaterThanOrEqual(35); // measured 55
    expect(w, 'guide (Left Arm first)').toBeLessThanOrEqual(85); // a tripwire against the fight becoming easy by accident
    expect(left.filter((r) => r.outcome === 'victory').every((r) => r.hp <= 0 && r.changed)).toBe(true);
    if (FULL) console.log(summary('guide (Left first), shipped party', left));
  }, 240_000);

  it('a win is accounted to the point: at every decision of a winning battle the HP of Penance is what the damage and healing in the log replay to, and the last blow takes it to 0 (no edit of its HP)', () => {
    const winner = SEEDS.find((seed) => playPenance(seed, LINES['guide']!).outcome === 'victory');
    expect(winner, 'a winning seed in 1000 to 1099').toBeDefined();
    const MAX = 12_000_000;
    let replay = MAX;
    let cursor = 0;
    let looked = 0;
    const advance = (events: ReturnType<typeof log>): void => {
      for (; cursor < events.length; cursor++) {
        const e = events[cursor]!;
        if (e.type === 'damage' && e.targetId === PENANCE) replay = Math.max(0, Math.min(MAX, replay - e.amount)); // a negative amount is a heal; a heal event reports its nominal amount (a full body takes none), so the replay clamps at the maximum
        else if (e.type === 'heal' && e.targetId === PENANCE) replay = Math.min(MAX, replay + e.amount);
      }
    };
    const { engine, outcome } = drivePenance(winner!, LINES['guide']!, undefined, 4_000, (eng) => {
      advance(log(eng));
      looked++;
      expect(actor(eng, PENANCE).hp, `decision ${looked}: the engine's HP for Penance is the replay of its log`).toBe(replay);
    });
    expect(outcome).toBe('victory');
    expect(looked).toBeGreaterThan(300);
    const events = log(engine);
    advance(events);
    expect(replay, 'the log takes Penance to 0').toBe(0);
    expect(actor(engine, PENANCE).hp).toBe(0);
    expect(events.some((e) => e.type === 'ko' && e.targetId === PENANCE)).toBe(true);
    // Nothing but the party's blows: every damage event on Penance names a party member (or a counter of one) as its source.
    const party = ['tidus', 'yuna', 'rikku'];
    expect(events.filter((e) => e.type === 'damage' && e.targetId === PENANCE && e.amount > 0).every((e) => e.type === 'damage' && e.sourceId !== undefined && party.includes(e.sourceId))).toBe(true);
  }, 120_000);

  it('the guides\' other last slots (GamerGuides: Auto-Phoenix or Defense +20 percent in place of Auto-Potion) win none: no heal at each of Obliteration\'s three blows, and the party never reaches the change', () => {
    for (const set of [['auto-haste', 'auto-protect', 'ribbon', 'auto-phoenix'], ['auto-haste', 'auto-protect', 'ribbon', 'defense-20']]) {
      const runs = SEEDS.slice(0, 30).map((seed) => playPenance(seed, LINES['guide']!, withArmor(set)));
      expect(wins(runs), set.join('+')).toBe(0);
      expect(ended(runs)).toBe(true);
      expect(runs.filter((r) => r.changed).length, `${set.join('+')}: runs that reached the change`).toBeLessThanOrEqual(3);
    }
  }, 120_000);
});



describe.skipIf(!FULL)('the levers (printed only with PENANCE_MEASURE=1): the arms-only line, the guides\' other armour and the guide line on every set', () => {
  const bhl = (set: string[]) => {
    const b = withArmor(set);
    for (const m of b.members) {
      m.stats = { ...m.stats, hp: 99_999, maxHp: 99_999 };
      m.hp = 99_999;
    }
    return b;
  };

  it('prints the table', () => {
    console.log(summary('arms-only, shipped party', run('arms-only')));
    console.log(summary('advisor, Ribbon (GamerGuides)', run('advisor', withArmor(['auto-haste', 'auto-protect', 'auto-potion', 'ribbon']))));
    console.log(summary('advisor, Ribbon + Break HP Limit', run('advisor', bhl(['auto-haste', 'auto-protect', 'ribbon', 'break-hp-limit']))));
    console.log(summary('sustain-left, shipped party', run('sustain-left')));
    console.log(summary('sustain, Ribbon (GamerGuides)', run('sustain', withArmor(['auto-haste', 'auto-protect', 'auto-potion', 'ribbon']))));
    console.log(summary('sustain, Ribbon + Break HP Limit', run('sustain', bhl(['auto-haste', 'auto-protect', 'ribbon', 'break-hp-limit']))));
    // Fix pass 2: the guide line (handoff section 5.1) on every armour set a guide names, Left Arm first and Right Arm first.
    const sets: Array<[string, ReturnType<typeof withArmor>]> = [
      ['A1 Auto-Haste, Auto-Protect, Auto-Potion, Defense +20 (Jegged, Game8; shipped)', withArmor(['auto-haste', 'auto-protect', 'auto-potion', 'defense-20'])],
      ['A2 Ribbon, Auto-Haste, Auto-Protect, Auto-Potion (GamerGuides)', withArmor(['auto-haste', 'auto-protect', 'auto-potion', 'ribbon'])],
      ['A3 Ribbon, Auto-Haste, Auto-Protect, Auto-Phoenix (GamerGuides)', withArmor(['auto-haste', 'auto-protect', 'ribbon', 'auto-phoenix'])],
      ['A4 Ribbon, Auto-Haste, Auto-Protect, Defense +20 (GamerGuides)', withArmor(['auto-haste', 'auto-protect', 'ribbon', 'defense-20'])],
      ['A5 Break HP Limit, Auto-Haste, Auto-Protect, Auto-Potion (eip.gg)', bhl(['auto-haste', 'auto-protect', 'auto-potion', 'break-hp-limit'])],
      ['A6 Break HP Limit, Ribbon, Auto-Haste, Auto-Protect', bhl(['auto-haste', 'auto-protect', 'ribbon', 'break-hp-limit'])],
      ['X1 Auto-Haste, Auto-Protect, Defense +20, Stoneproof (extra)', withArmor(['auto-haste', 'auto-protect', 'defense-20', 'stoneproof'])],
      ['X2 Auto-Haste, Auto-Protect, Auto-Potion, Stoneproof (extra)', withArmor(['auto-haste', 'auto-protect', 'auto-potion', 'stoneproof'])],
    ];
    for (const [label, build] of sets) for (const line of ['guide', 'guide-right']) console.log(summary(`${line}, ${label}`, run(line, build)));
    expect(true).toBe(true);
  }, 3_000_000);
});
