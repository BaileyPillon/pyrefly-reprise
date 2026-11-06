/**
 * **The Flooded Ways chapter's winnability, measured on the real engine** (FFX only; `docs/handoff/ch-flooded-ways.md` section 5; the harness is `tests/unit/helpers/floodedBench.ts`, the table's tool `tools/flooded-ways-bench.mjs`).
 * The plan's target was about 70 percent per fight for the informed line, 60 to 80 accepted, and a careless line that "mostly loses" (under 20 percent), **measured, never tuned by editing a boss row**.
 * What the bench found is pinned here, honestly: **Evrae Altana is won by every line that thinks** (two Phoenix Downs kill it, and so does opening the locks and striking: the Gagazet-cell party outlives it) and lost by the plain
 * Attack; **Geosgaeno is won about four times in five by the elemental line and never by the plain Attack, and never at all without the gems and the Poison Fang the preflight's kit adds** (the Highbridge bag has no elemental answer).
 * The two levers the bench moved (the Stone Wards, the kit) are the party's estimates, not the monsters'.
 *
 * Always on: 120 seeds for the shipped party's cells and 60 for the ablations (seeds 1 up, deterministic). **The table of record** (200 seeds a cell) is the tool's output; `FLOODED_WAYS_BENCH=1` prints it from here.
 */
import { describe, expect, it } from 'vitest';

import { swimmersBuild } from '../../../src/data/ffx/builds/swimmers.ts';
import { evraeCareless, evraeOrdinary, evraePhoenix, evraeRate, geosgaenoCareless, geosgaenoLine, geosgaenoRate, share, withBag, withWards } from '../helpers/floodedBench.ts';
import { unwarded } from '../helpers/floodedDrive.ts';

const SEEDS = 120;
const ABLATION_SEEDS = 60;
const TIMEOUT = 300_000;

describe('the harness levers change one thing each and touch no monster', () => {
  it('withWards and withBag return a changed copy and leave the preset as it was', () => {
    const before = JSON.stringify(swimmersBuild);
    const all = withWards(swimmersBuild, ['tidus', 'wakka', 'rikku']);
    for (const m of all.members) expect(m.equipment.armor.autoAbilities, m.id).toContain('stone-ward');
    const none = withWards(swimmersBuild, []);
    for (const m of none.members) expect(m.equipment.armor.autoAbilities, m.id).not.toContain('stone-ward');
    const bare = withBag(swimmersBuild, false);
    expect(bare.inventory.map((e) => e.itemId)).not.toContain('fire-gem');
    expect(bare.inventory.find((e) => e.itemId === 'phoenix-down')!.count).toBe(12);
    expect(JSON.stringify(swimmersBuild), 'the preset itself is untouched').toBe(before);
  });
});

describe(`the shipped party, ${SEEDS} seeds a cell`, () => {
  it('Evrae Altana: the two-Phoenix-Down line and the ordinary line (open the locks, strike, mend) win, the plain Attack loses (FINDING: the fight is easy for any line that thinks)', async () => {
    expect(share(await evraeRate(SEEDS, evraePhoenix))).toBeGreaterThanOrEqual(0.95);
    expect(share(await evraeRate(SEEDS, evraeOrdinary))).toBeGreaterThanOrEqual(0.9);
    expect(share(await evraeRate(SEEDS, evraeCareless))).toBeLessThanOrEqual(0.05);
  }, TIMEOUT);

  it('Evrae Altana: the water is live: the ordinary line sees a member shattered in most fights (the plan\'s rule), and no member is ever shattered by the two-item line, which ends it before a second gaze', async () => {
    const ordinary = await evraeRate(SEEDS, evraeOrdinary);
    expect(ordinary.shatterAvg).toBeGreaterThan(0.3);
    expect((await evraeRate(SEEDS, evraePhoenix)).shatterAvg).toBeLessThan(0.05);
  }, TIMEOUT);

  it('Geosgaeno: the elemental line wins about four in five (0.65 to 0.95) whatever the held character does; the plain Attack never wins', () => {
    for (const policy of ['smart', 'struggle', 'wait'] as const) {
      const r = geosgaenoRate(SEEDS, geosgaenoLine(policy));
      expect(share(r), policy).toBeGreaterThanOrEqual(0.65);
      expect(share(r), policy).toBeLessThanOrEqual(0.95);
      expect(r.unfinished, policy).toBe(0);
    }
    expect(share(geosgaenoRate(SEEDS, geosgaenoCareless))).toBeLessThanOrEqual(0.05);
  }, TIMEOUT);
});

describe(`the ablations, ${ABLATION_SEEDS} seeds a cell`, () => {
  it('FINDING: without the preflight\'s kit (the Highbridge bag as it was) Geosgaeno is never won: its weakness to every element has no answer in the bag', () => {
    expect(share(geosgaenoRate(ABLATION_SEEDS, geosgaenoLine('smart'), withBag(swimmersBuild, false)))).toBeLessThanOrEqual(0.05);
  }, TIMEOUT);

  it('a Stone Ward on all three (the preflight\'s pick) never lets the water shatter anyone and makes Geosgaeno easier (at least the shipped rate); no Ward at all shatters more', async () => {
    const shipped = geosgaenoRate(ABLATION_SEEDS, geosgaenoLine('smart'));
    const three = geosgaenoRate(ABLATION_SEEDS, geosgaenoLine('smart'), withWards(swimmersBuild, ['tidus', 'wakka', 'rikku']));
    const none = geosgaenoRate(ABLATION_SEEDS, geosgaenoLine('smart'), unwarded());
    expect(three.shatterAvg).toBe(0);
    expect(share(three)).toBeGreaterThanOrEqual(share(shipped));
    expect(none.shatterAvg).toBeGreaterThan(shipped.shatterAvg);
    expect((await evraeRate(ABLATION_SEEDS, evraeOrdinary, withWards(swimmersBuild, ['tidus', 'wakka', 'rikku']))).shatterAvg).toBe(0);
  }, TIMEOUT);
});

describe.skipIf(process.env['FLOODED_WAYS_BENCH'] === undefined)('the table of record (FLOODED_WAYS_BENCH=1, 200 seeds a cell)', () => {
  it('prints the table', async () => {
    const rows: string[] = [];
    for (const [name, party] of [['shipped', swimmersBuild], ['wards3', withWards(swimmersBuild, ['tidus', 'wakka', 'rikku'])], ['unwarded', unwarded()], ['nokit', withBag(swimmersBuild, false)]] as const) {
      for (const [lineName, line] of [['phoenix', evraePhoenix], ['ordinary', evraeOrdinary], ['careless', evraeCareless]] as const) {
        const r = await evraeRate(200, line, party);
        rows.push(`| ${name} | Evrae Altana | ${lineName} | ${r.wins}/200 | ${r.shatterAvg.toFixed(2)} |`);
      }
      for (const [lineName, line] of [['smart', geosgaenoLine('smart')], ['struggle', geosgaenoLine('struggle')], ['wait', geosgaenoLine('wait')], ['careless', geosgaenoCareless]] as const) {
        const r = geosgaenoRate(200, line, party);
        rows.push(`| ${name} | Geosgaeno | ${lineName} | ${r.wins}/200 | ${r.shatterAvg.toFixed(2)} |`);
      }
    }
    console.log(['| party | fight | line | wins | shattered a fight |', '|---|---|---|---:|---:|', ...rows].join('\n'));
    expect(rows.length).toBeGreaterThan(0);
  }, 1_800_000);
});
