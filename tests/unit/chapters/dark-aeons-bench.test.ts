/**
 * **The Dark Aeons chapter's winnability, measured on the real engine** (FFX only; `docs/handoff/ch-dark-aeons.md` section 7; the harness is `tests/unit/helpers/darkAeonsBench.ts`, the table's tool `tools/dark-aeons-bench.mjs`).
 * The plan's target was about 70 percent per link and for the whole chain for the advisor's line, 60 to 80 accepted, and a careless line that "mostly loses" (under 20 percent), **measured, never tuned by editing a boss row**.
 * **What the bench found is pinned here, honestly**: it is not the target. The three shorter fights (Valefor, Ifrit, Ixion's first) are won by the advisor AND by a careless line (the Lv-99 preset kills them in a dozen
 * blows), Dark Ixion's second fight and Dark Shiva are in the band for the advisor and lost by the careless line, and **Dark Anima and Dark Bahamut are won only by Yojimbo's Zanmato** (no other line of the harness wins
 * either at all), at about 46 and 35 percent a link, so the whole chain on the first try is about one in five. A defeat retries its link in the chapter. Nothing was tuned.
 *
 * **A small always-on check** (40 seeds a cell, the first forty, which are deterministic) pins the shape; **the table of record** (200 seeds a cell) is `DARK_AEONS_BENCH=1` (about six minutes).
 */
import { describe, expect, it } from 'vitest';

import { darkAeonsBuild } from '../../../src/data/ffx/builds/dark-aeons.ts';
import { DARK_SIX_LINKS } from '../../../src/data/ffx/dark-aeons-six-ids.ts';
import { ABLATIONS, BAND, TARGET, ablatedLine, advisorLine, carelessLine, chainRate, inBand, linkRate, share, withAeonGauge, withEvasion, withGil, withLineUp, withLuck, withPhoenixDowns, withStatFraction } from '../helpers/darkAeonsBench.ts';

const SEEDS = 40;

describe('the harness levers change one thing each and touch no boss row', () => {
  it('the party levers return a changed copy and leave the preset as it was', () => {
    const before = JSON.stringify(darkAeonsBuild);
    const gauge = withAeonGauge(darkAeonsBuild, 'yojimbo', 100);
    expect(gauge.aeons.find((a) => a.id === 'yojimbo')!.overdriveGauge).toBe(100);
    expect(withGil(darkAeonsBuild, 5).gil).toBe(5);
    expect(withPhoenixDowns(darkAeonsBuild, 3).inventory.find((e) => e.itemId === 'phoenix-down')!.count).toBe(3);
    expect(withLuck(darkAeonsBuild, 30).members.every((m) => m.stats.luck === 30)).toBe(true);
    expect(withEvasion(darkAeonsBuild, 100).members.every((m) => m.stats.eva === 100)).toBe(true);
    expect(withStatFraction(darkAeonsBuild, 0.5).members.every((m) => m.stats.str === Math.round(255 * 0.5))).toBe(true);
    const lu = withLineUp(darkAeonsBuild, ['tidus', 'yuna', 'wakka']);
    expect([lu.activeSlots, [...lu.reserve].sort()]).toEqual([['tidus', 'yuna', 'wakka'], ['auron', 'kimahri', 'lulu', 'rikku']]);
    expect(JSON.stringify(darkAeonsBuild), 'the preset itself is untouched').toBe(before);
    expect(() => ablatedLine('no-such-ablation')).toThrow(/no ablation/);
    expect(Object.keys(ABLATIONS)).toEqual(expect.arrayContaining(['no-fodder', 'no-zanmato', 'pay-1m', 'no-auto-life']));
  });

  it('the preset is the Mirror Aeons\' numbers (estimates) with the Dark Aeons\' line-up: 17 Phoenix Downs, 1,500,000 gil, Luck 60, Evasion 255, Yojimbo\'s gauge 0', () => {
    expect(darkAeonsBuild.inventory.find((e) => e.itemId === 'phoenix-down')!.count).toBe(17);
    expect(darkAeonsBuild.gil).toBe(1_500_000);
    for (const m of darkAeonsBuild.members) expect([m.stats.luck, m.stats.eva, m.stats.hp, m.stats.str]).toEqual([60, 255, 9_999, 255]);
    expect(darkAeonsBuild.aeons.find((a) => a.id === 'yojimbo')!.overdriveGauge).toBe(0);
  });
});

describe(`the shape, ${SEEDS} seeds a cell (seeds 1 to ${SEEDS}, deterministic)`, () => {
  const rate = (key: (typeof DARK_SIX_LINKS)[number]['key'], line: Parameters<typeof linkRate>[2]) => linkRate(SEEDS, key, line);

  it('Dark Ixion\'s second fight and Dark Shiva: the advisor wins nearly all and a careless line loses nearly all (in the band, and a careless line "mostly loses")', () => {
    for (const key of ['ixion-2', 'shiva'] as const) {
      expect(share(rate(key, advisorLine)), `${key} advisor`).toBeGreaterThanOrEqual(0.9);
      expect(share(rate(key, carelessLine)), `${key} careless`).toBeLessThanOrEqual(0.1);
    }
  });

  it('FINDING: the three shorter fights are easy for the preset: a careless line wins Valefor, Ifrit and Ixion\'s first fight (above the 20 percent the plan allows a careless line); the lever is the preset\'s stats, a cliff, not a dial', () => {
    for (const key of ['valefor', 'ifrit', 'ixion-1'] as const) {
      expect(share(rate(key, advisorLine)), `${key} advisor`).toBeGreaterThanOrEqual(0.9);
      expect(share(rate(key, carelessLine)), `${key} careless`).toBeGreaterThanOrEqual(0.9);
    }
  });

  it('Dark Ixion\'s blade never touches the preset (Evasion 255 plus Luck 60 is 315): the first fight is as easy with Evasion 0, so Evasion is not its lever either', () => {
    expect(share(linkRate(SEEDS, 'ixion-1', advisorLine, withEvasion(darkAeonsBuild, 0)))).toBeGreaterThanOrEqual(0.9);
  });

  it('FINDING: Dark Anima and Dark Bahamut are won only by Yojimbo\'s Zanmato: no line without it wins one fight of the forty, with it the advisor wins between a fifth and two thirds', () => {
    for (const key of ['anima', 'bahamut'] as const) {
      expect(linkRate(SEEDS, key, ablatedLine('no-zanmato')).wins, `${key} without Zanmato`).toBe(0);
      expect(rate(key, carelessLine).wins, `${key} careless`).toBe(0);
      const s = share(rate(key, advisorLine));
      expect(s, `${key} advisor`).toBeGreaterThan(0.2);
      expect(s, `${key} advisor`).toBeLessThan(0.7);
    }
  });

  it('Auto-Life is what keeps Dark Shiva\'s Diamond Dust and Heavenly Strike from ending the fight: without it the advisor wins markedly fewer', () => {
    const with_ = linkRate(SEEDS, 'shiva', advisorLine).wins;
    const without = linkRate(SEEDS, 'shiva', ablatedLine('no-auto-life')).wins;
    expect(without).toBeLessThan(with_ - 5);
  });

  it('the Yojimbo lever: his starting gauge raises the odds of a Zanmato on the two long fights (a full gauge adds 20 to the Pay\'s motivation)', () => {
    for (const key of ['anima', 'bahamut'] as const) {
      const base = linkRate(SEEDS, key, advisorLine).wins;
      const full = linkRate(SEEDS, key, advisorLine, withAeonGauge(darkAeonsBuild, 'yojimbo', 100)).wins;
      expect(full, key).toBeGreaterThan(base);
    }
  });
});

describe.runIf(process.env['DARK_AEONS_BENCH'] === '1')('the table of record, 200 seeds a cell (DARK_AEONS_BENCH=1)', () => {
  const N = 200;
  it('per link: the advisor wins 100, 99, 100, 100, 100 percent of the first five and about 46 and 35 of the last two; a careless line wins the first three and loses the rest', () => {
    const adv = DARK_SIX_LINKS.map((l) => share(linkRate(N, l.key, advisorLine)));
    expect(adv.slice(0, 5).every((s) => s >= 0.97)).toBe(true);
    expect(adv[5]).toBeGreaterThan(0.38);
    expect(adv[5]).toBeLessThan(0.54);
    expect(adv[6]).toBeGreaterThan(0.27);
    expect(adv[6]).toBeLessThan(0.43);
    const care = DARK_SIX_LINKS.map((l) => share(linkRate(N, l.key, carelessLine)));
    expect(care.slice(0, 3).every((s) => s >= 0.97)).toBe(true);
    expect(care.slice(3).every((s) => s <= 0.02)).toBe(true);
  });

  it('the whole chapter on the first try: about one in five (19 percent of 200 seeds), lost at link 6 or 7 almost always; the plan\'s 70 percent (60 to 80) is NOT met and is reported, not tuned', () => {
    const r = chainRate(N, advisorLine);
    expect(inBand(share(r)), 'outside the plan\'s band, honestly').toBe(false);
    expect(share(r)).toBeGreaterThan(0.12);
    expect(share(r)).toBeLessThan(0.28);
    expect(r.lostAt[6]! + r.lostAt[7]!).toBeGreaterThan(0.9 * r.losses);
    expect([TARGET, BAND]).toEqual([0.7, [0.6, 0.8]]);
  });
});
