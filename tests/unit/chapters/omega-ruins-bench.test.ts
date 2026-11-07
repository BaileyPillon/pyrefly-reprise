/**
 * **The bench for the hidden Omega Ruins chapter: winnability measured, never tuned** (preflight section 8; the plan is `docs/plans/ch-weapon-review.md`, the table of record `docs/handoff/ch-omega-ruins.md`, printed by
 * `tools/omega-ruins-bench.mjs`). The target for the one fight that is a fight, Nemesis: **the advisor's line wins about 70 percent, 60 to 80 accepted, and a careless line (no Auto-Life, Overdrives into the Ultima reply) loses
 * under 20**. Ultima Weapon and Omega Weapon are expected to be formalities against the endgame preset (above 99 percent for the advisor and for a plain-Attack line alike), and the bench reports that honestly rather than
 * tuning anything. **No boss row is ever touched**: the only lever is the party preset (`data/ffx/builds/omega-ruins.ts`: Piercing on the weapons, the Phoenix Downs, the Turbo Ethers).
 *
 * The always-on 100-seed samples are held to a wider band than the table's (`SAMPLE_BAND`, 55 to 85): one hundred seeds carry a standard error of about 5 points and seeds 1 to 100 measure 62 and 61 where the 200 and 400 seed cells
 * measure 66.5 and 68.5, so the table's 60 to 80 would fail on a harmless engine change; the table of record keeps the real band.
 *
 * What this file holds: the harness (always on); **100 seeds of each fight and of the whole chain** with the advisor's line and a careless one (always on: the engine is deterministic and a fight takes about a tenth of a
 * second); and the **table of record's relations** (the shared preset without the levers, each lever alone, the ablations, the Yojimbo line), on with `OMEGA_RUINS_BENCH=1` (200 seeds a cell: about ten minutes).
 */
import { describe, expect, it } from 'vitest';

import { mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import { OMEGA_RUINS_PHOENIX_DOWNS, OMEGA_RUINS_TURBO_ETHERS, SHARED_PRESET_PHOENIX_DOWNS, omegaRuinsBuild } from '../../../src/data/ffx/builds/omega-ruins.ts';
import {
  BAND, CARELESS_AT_MOST, SHARED_PRESET, TARGET, ablatedLine, advisorLine, carelessLine, inBand, rateOfAct, rateOfChain, share, withBag, withPhoenixDowns, withPiercing, withYojimbo,
} from '../helpers/omegaRuinsBench.ts';

/** The band the always-on 100-seed samples are held to (see the header): wider than `BAND` by one sample's noise. */
const SAMPLE_BAND: readonly [number, number] = [0.55, 0.85];

/** The table-of-record relations run only when the driver re-runs the bench (see the header); the rest of the file always runs. */
const BENCH = process.env['OMEGA_RUINS_BENCH'] === '1';

describe('the harness (always on)', () => {
  it('the band is 60 to 80 percent around a target of 70; careless is "mostly loses" under 20', () => {
    expect([TARGET, BAND, CARELESS_AT_MOST]).toEqual([0.7, [0.6, 0.8], 0.2]);
    expect([0.59, 0.6, 0.7, 0.8, 0.81].map(inBand)).toEqual([false, true, true, true, false]);
  });

  it('the levers change only what they name, and never the shared object', () => {
    const base = mirrorAeonsBuild;
    const before = JSON.stringify(base);
    const pd = withPhoenixDowns(base, 3);
    expect(pd.inventory.find((e) => e.itemId === 'phoenix-down')?.count).toBe(3);
    expect(pd.inventory.filter((e) => e.itemId !== 'phoenix-down')).toEqual(base.inventory.filter((e) => e.itemId !== 'phoenix-down'));
    const te = withBag(base, { 'turbo-ether': 9 });
    expect(te.inventory.find((e) => e.itemId === 'turbo-ether')?.count).toBe(9);
    const p = withPiercing(base);
    for (const m of p.members) {
      const was = base.members.find((x) => x.id === m.id)!.equipment.weapon.autoAbilities;
      expect(m.equipment.weapon.autoAbilities, m.id).toHaveLength(was.length);
      expect(m.equipment.weapon.autoAbilities.filter((a, i) => a !== was[i]), m.id).toEqual(['piercing']); // exactly one slot changed, to Piercing
    }
    expect(JSON.stringify(base), 'the shared build is never mutated').toBe(before);
    expect(withPiercing(base, ['tidus']).members.filter((m) => m.equipment.weapon.autoAbilities.includes('piercing')).map((m) => m.id)).toEqual(['tidus']);
  });

  it('the shipped preset is the shared one with exactly the three levers', () => {
    expect(SHARED_PRESET).toBe(mirrorAeonsBuild);
    expect(SHARED_PRESET_PHOENIX_DOWNS).toBe(17);
    expect([OMEGA_RUINS_PHOENIX_DOWNS, OMEGA_RUINS_TURBO_ETHERS]).toEqual([26, 6]);
    expect(omegaRuinsBuild.inventory.find((e) => e.itemId === 'phoenix-down')?.count).toBe(OMEGA_RUINS_PHOENIX_DOWNS);
    expect(omegaRuinsBuild.inventory.find((e) => e.itemId === 'turbo-ether')?.count).toBe(OMEGA_RUINS_TURBO_ETHERS);
    const rest = (b: typeof omegaRuinsBuild) => ({ ...b, inventory: b.inventory.filter((e) => e.itemId !== 'phoenix-down' && e.itemId !== 'turbo-ether'), members: b.members.map((m) => ({ ...m, equipment: { ...m.equipment, weapon: { ...m.equipment.weapon, autoAbilities: [] } } })) });
    expect(JSON.stringify(rest(omegaRuinsBuild))).toBe(JSON.stringify(rest(mirrorAeonsBuild)));
  });
});

describe('100 seeds of each fight and of the whole chain (always on; the table of record has 200 and 400)', () => {
  it('Ultima Weapon and Omega Weapon are formalities against the preset: 100 of 100 for the advisor and for a careless line, no member ever falls', () => {
    for (const act of [0, 1] as const) {
      for (const [name, line] of [['advisor', advisorLine], ['careless', carelessLine]] as const) {
        const r = rateOfAct(100, act, line);
        expect([r.wins, r.lost, r.unfinished], `act ${act + 1} ${name}`).toEqual([100, 0, 0]);
        expect(r.koTotal, `act ${act + 1} ${name}: no KO`).toBe(0);
      }
    }
  }, 120_000);

  it('Nemesis: the advisor\'s line wins inside the 55 to 85 percent sample band (about 66 to 70 at 200 and 400 seeds) and a careless line loses (under 20 percent), 100 seeds each', () => {
    const advisor = rateOfAct(100, 2, advisorLine);
    expect(advisor.unfinished).toBe(0);
    expect(share(advisor), `${advisor.wins} of ${advisor.seeds}`).toBeGreaterThanOrEqual(SAMPLE_BAND[0]);
    expect(share(advisor), `${advisor.wins} of ${advisor.seeds}`).toBeLessThanOrEqual(SAMPLE_BAND[1]);
    const careless = rateOfAct(100, 2, carelessLine);
    expect(careless.unfinished).toBe(0);
    expect(share(careless), `${careless.wins} of ${careless.seeds}`).toBeLessThanOrEqual(CARELESS_AT_MOST);
    // eslint-disable-next-line no-console
    console.info(`[omega-ruins bench] Nemesis, seeds 1 to 100: advisor ${advisor.wins}/${advisor.seeds}, careless ${careless.wins}/${careless.seeds}`);
  }, 180_000);

  it('the whole chapter, three acts chained with the heal between them: the advisor\'s line is inside the band and loses only in the third act; a careless line loses there every time', () => {
    const advisor = rateOfChain(100, advisorLine);
    expect(advisor.unfinished).toBe(0);
    expect(advisor.lostIn.slice(0, 2), 'Acts I and II are never lost').toEqual([0, 0]);
    expect(share(advisor), `${advisor.wins} of ${advisor.seeds}`).toBeGreaterThanOrEqual(SAMPLE_BAND[0]);
    expect(share(advisor), `${advisor.wins} of ${advisor.seeds}`).toBeLessThanOrEqual(SAMPLE_BAND[1]);
    const careless = rateOfChain(100, carelessLine);
    expect(careless.lostIn.slice(0, 2)).toEqual([0, 0]);
    expect(share(careless)).toBeLessThanOrEqual(CARELESS_AT_MOST);
    // eslint-disable-next-line no-console
    console.info(`[omega-ruins bench] the chain, seeds 1 to 100: advisor ${advisor.wins}/${advisor.seeds} (lost in III ${advisor.lostIn[2]}), careless ${careless.wins}/${careless.seeds}`);
  }, 180_000);
});

describe.skipIf(!BENCH)('the table of record\'s relations (200 seeds a cell; on with OMEGA_RUINS_BENCH=1)', () => {
  const piercing = withPiercing(SHARED_PRESET);

  it('against the shared preset the advisor all but never wins Nemesis (the table: 1 of 200), and Piercing is the biggest single lever (26 percent alone)', () => {
    const shared = rateOfAct(200, 2, advisorLine, SHARED_PRESET);
    expect(share(shared)).toBeLessThanOrEqual(0.05);
    const alone = rateOfAct(200, 2, advisorLine, piercing);
    expect(share(alone)).toBeGreaterThanOrEqual(0.15);
    expect(share(alone)).toBeLessThanOrEqual(0.4);
  }, 300_000);

  it('the Phoenix Down stock moves the win rate monotonically (17 < 22 < 26 < 30 Phoenix Downs at 6 Turbo Ethers), and the shipped 26 is inside the band', () => {
    const at = (n: number): number => share(rateOfAct(200, 2, advisorLine, withBag(withPhoenixDowns(piercing, n), { 'turbo-ether': 6 })));
    const series = [17, 22, 26, 30].map(at);
    for (let i = 1; i < series.length; i++) expect(series[i]!, `${series}`).toBeGreaterThanOrEqual(series[i - 1]!);
    expect(inBand(series[2]!), `26 Phoenix Downs: ${series[2]}`).toBe(true);
  }, 300_000);

  it('the ablations: without Auto-Life, without the MP items, and with Auto-Life on one member alone the advisor loses every time; on two it is far worse; Quick Hit is worth only a few points', () => {
    const wins = (name: string): number => share(rateOfAct(200, 2, ablatedLine(name)));
    expect(wins('no-auto-life')).toBe(0);
    expect(wins('no-mp-items')).toBe(0);
    expect(wins('life-one')).toBe(0);
    expect(wins('life-two')).toBeLessThan(0.4);
    expect(wins('no-quick-hit')).toBeGreaterThan(0.6);
  }, 600_000);

  it('the Zanmato lottery (WP9): Yojimbo opening beside the advisor wins more than the advisor alone, and even a careless line wins a third of the time with him (the game\'s own rule, reported and not tuned)', () => {
    const alone = share(rateOfAct(200, 2, advisorLine));
    const withHim = share(rateOfAct(200, 2, withYojimbo(advisorLine)));
    const carelessWithHim = share(rateOfAct(200, 2, withYojimbo(carelessLine)));
    expect(withHim).toBeGreaterThan(alone);
    expect(carelessWithHim).toBeGreaterThan(0.2);
    // eslint-disable-next-line no-console
    console.info(`[omega-ruins bench] Nemesis with Yojimbo: advisor alone ${alone}, Yojimbo + advisor ${withHim}, Yojimbo + careless ${carelessWithHim}`);
  }, 600_000);
});
