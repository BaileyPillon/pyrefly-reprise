/**
 * **A girl in a Special dressphere cannot be Ejected** (FFX-2 only; round 35's PR-0636).
 *
 * The rule is sourced twice (`research/ffx2-combat-core.md` section 2.8, the Eject row: "Characters in a special dressphere cannot be ejected"; section 3.15, the universal Special rules: every SDSP part "cannot be Ejected";
 * `[verified: 2 sources]`) and `dresspheres.ts` and `spherechange.ts` state it in comments, but until this pass nothing applied it: a Floral Fallal wearer was ejected by Auron's Shooting Star exactly like a girl in a normal
 * dress, which left the Farplane Cup's duel 1 at about one win in nine. The rule is now one function (`adapt/words.ts#cannotBeEjected`) read where the engine resolves Eject: the Eject byte of the resist tables the hit and
 * status kernels read (`resistTables`, which makes the formula-3 hit immune: the game's own 255), the odds the previews show (`resistByte`), the riders' rolls, and the last door, `addStatus`.
 *
 * What is pinned: (1) the byte, for each of the three Specials and for the transformed state, and that a normal dress is untouched; (2) the previews and the advisor's odds agree with the roll; (3) on the real engine, the
 * real Auron's Shooting Star on a Special wearer never ejects (20 of 20 seeds) and on a normal dress ejects (20 of 20 seeds: the control, so the test cannot pass for a different reason); (4) the same on the unforced duelist
 * over his first eight actions, the probe of the round (p3: Floral Fallal on all three girls). **Without the rule the (3) and (4) Special rows fail** (the girl is ejected on every seed).
 */
import { describe, expect, it } from 'vitest';

import type { FFX2Combatant } from '../../src/battle/common/types.ts';
import { statusOddsFFX2 } from '../../src/battle/ffx2/intent.ts';
import { cannotBeEjected, resistByte, resistTables } from '../../src/battle/ffx2/adapt/words.ts';
import { GROUP1_STATUS } from '../../src/battle/ffx2/adapt/slots.ts';
import { CUP_ABILITY as A } from '../../src/data/ffx2/enemies/farplane-cup-abilities.ts';
import { forced, girlsOf, bossOf, move, openDuel, playUntilBossActed, unit, type Unit } from './helpers/farplaneCupDrive.ts';

const SPECIALS = ['floral-fallal', 'machina-maw', 'full-throttle'] as const;
const EJECT_SLOT = GROUP1_STATUS.indexOf('eject');
const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

/** A fresh girl of the Farplane Cup's party, worn in `sphere` (the stats stay as built: the rule reads the dressphere, not the numbers). */
function girlIn(sphere: string | null): Unit {
  const girl = girlsOf(openDuel(0, 1))[0]!;
  if (sphere !== null) girl.dresspheres!.current = sphere;
  return girl;
}

/** Shooting Star on `target` with the girls in `sphere` (null = as built); the girl's Eject status afterwards. */
function shootingStar(seed: number, sphere: string | null): boolean {
  const f = forced(0);
  const engine = openDuel(0, seed, { group: f.group });
  if (sphere !== null) for (const g of girlsOf(engine)) g.dresspheres!.current = sphere;
  f.forced.queue.push(move(A.shootingStar, ['yuna']));
  expect(playUntilBossActed(engine, bossOf(0), 1)).toBe(true);
  return unit(engine, 'yuna').statuses['eject'] !== undefined;
}

describe('the Eject byte of a Special wearer (research/ffx2-combat-core.md 2.8 and 3.15)', () => {
  it('a girl in a normal dress has the Eject byte her record gives (0 for the Farplane Cup party): the rule touches nobody else', () => {
    const girl = girlIn(null);
    expect(cannotBeEjected(girl)).toBe(false);
    expect(resistTables(girl).resist1[EJECT_SLOT]).toBe(0);
    expect(resistByte(girl, 'eject')).toBe(0);
    girl.immunities['eject'] = 40;
    expect(resistTables(girl).resist1[EJECT_SLOT], 'a byte her accessories or record give stands').toBe(40);
  });

  for (const sphere of SPECIALS) {
    it(`${sphere}: cannot be ejected, in the resist tables the kernels read and in the byte the previews read; no other byte moves`, () => {
      const normal = girlIn(null);
      const girl = girlIn(sphere);
      expect(cannotBeEjected(girl)).toBe(true);
      const tables = resistTables(girl);
      expect(tables.resist1[EJECT_SLOT]).toBe(0xff);
      expect(resistByte(girl, 'eject')).toBe(0xff);
      // Every other byte is exactly what it was in the normal dress.
      const was = resistTables(normal);
      expect(tables.resist1.filter((_, i) => i !== EJECT_SLOT)).toEqual(was.resist1.filter((_, i) => i !== EJECT_SLOT));
      expect(tables.resist2).toEqual(was.resist2);
      expect(resistByte(girl, 'petrify')).toBe(resistByte(normal, 'petrify'));
    });
  }

  it('the transformed state (dresspheres.special) counts too, whatever dress the record still names', () => {
    const girl = girlIn(null);
    girl.dresspheres!.special = { id: 'floral-fallal' } as NonNullable<FFX2Combatant['dresspheres']>['special'];
    expect(cannotBeEjected(girl)).toBe(true);
    expect(resistTables(girl).resist1[EJECT_SLOT]).toBe(0xff);
  });

  it('a unit with no dresspheres (every enemy) is never Eject-proof by this rule: the bosses keep their own bytes', () => {
    const f = forced(0);
    const engine = openDuel(0, 1, { group: f.group });
    const auron = unit(engine, bossOf(0));
    expect(auron.dresspheres).toBeUndefined();
    expect(cannotBeEjected(auron)).toBe(false);
    expect(resistByte(auron, 'eject')).toBe((auron.immunities['eject'] ?? 0) & 0xff);
  });
});

describe('what the panel and the advisor show is what the roll does', () => {
  it("Shooting Star's odds on a Special wearer read blocked (0 percent); on a normal dress they read the guaranteed Eject", () => {
    const f = forced(0);
    const engine = openDuel(0, 1, { group: f.group });
    const auron = unit(engine, bossOf(0));
    const normal = unit(engine, 'yuna');
    const wearer = unit(engine, 'rikku');
    wearer.dresspheres!.current = 'machina-maw';
    const app = { status: 'eject', chance: 254 };
    const asBuilt = statusOddsFFX2(normal, app, auron);
    expect(asBuilt.blocked).toBe(false);
    expect(asBuilt.percent).toBe(100);
    const special = statusOddsFFX2(wearer, app, auron);
    expect(special.blocked).toBe(true);
    expect(special.percent).toBe(0);
  });
});

describe('on the real engine: Auron\'s Shooting Star (Eject at 254, accuracy formula 3)', () => {
  it('ejects the girl in a normal dress on every seed (the control: 20 of 20)', () => {
    expect(SEEDS.filter((seed) => shootingStar(seed, null))).toHaveLength(20);
  });

  for (const sphere of SPECIALS) {
    it(`never ejects a girl in ${sphere} (0 of 20 seeds)`, () => {
      expect(SEEDS.filter((seed) => shootingStar(seed, sphere))).toEqual([]);
    });
  }

  it("the round's probe (p3): the unforced duelist's first eight actions eject someone in a normal dress on most seeds and never when all three girls wear Floral Fallal", () => {
    let normal = 0;
    let special = 0;
    for (let seed = 2001; seed < 2021; seed++) {
      for (const wearing of [true, false]) {
        const engine = openDuel(0, seed, { immortal: true });
        if (wearing) for (const g of girlsOf(engine)) g.dresspheres!.current = 'floral-fallal';
        playUntilBossActed(engine, bossOf(0), 8, () => null, { immortal: true });
        const ejected = girlsOf(engine).filter((g) => g.statuses['eject'] !== undefined).length;
        if (wearing) special += ejected > 0 ? 1 : 0;
        else normal += ejected > 0 ? 1 : 0;
      }
    }
    expect(special, 'a Floral Fallal wearer is never ejected').toBe(0);
    expect(normal, 'the normal dress still is (16 of 20 in the round)').toBeGreaterThanOrEqual(12);
  }, 120_000);
});
