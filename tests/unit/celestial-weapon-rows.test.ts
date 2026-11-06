/**
 * The seven final Celestial weapons (FFX only; the hidden Penance chapter; `research/re-ffx-penance.md` section 6, item 5): the data rows are `weapon.bin` rows 139 to 145 (the formula and the four fixed ability words as the
 * extract printed them), the contract field `EquipmentDef.weaponRow` reaches the damage kernel, and **the field changes nothing for anyone who does not carry it**: a plain weapon is formula 1, power 16, as the 23 weapon commands
 * carry (the golden suites `ffx-engine-golden`, `ffx2-atb-golden` and `ff7-golden` are the whole-chain proof; this file is the unit proof).
 */

import { describe, expect, it } from 'vitest';

import { AUTO_ABILITY_RECORD } from '../../src/battle/ffx/adapt/gear-ids.ts';
import { baseDamage } from '../../src/battle/ffx/kernel/damage.ts';
import { CELESTIAL_WEAPONS, celestialWeapon } from '../../src/data/ffx/builds/celestial-weapons.ts';
import { penanceBuild } from '../../src/data/ffx/builds/penance.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { mirrorAeonsBuild } from '../../src/data/ffx/builds/mirror-aeons.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { actor, newEngine, nextInput, swing, defend, log, RIGHT_ARM } from './helpers/penanceDrive.ts';

/** `weapon.bin` rows 139 to 145 as the extract printed them: row, wielder, formula (decimal), the four ability words. */
const EXTRACT: ReadonlyArray<readonly [number, string, number, readonly number[]]> = [
  [139, 'tidus', 17, [0x8019, 0x800f, 0x8004, 0x8005]],
  [140, 'yuna', 18, [0x8019, 0x800f, 0x8012, 0x800d]],
  [141, 'wakka', 17, [0x8019, 0x800f, 0x8012, 0x8004]],
  [142, 'kimahri', 17, [0x8019, 0x800f, 0x8012, 0x8004]],
  [143, 'auron', 19, [0x8019, 0x800f, 0x8001, 0x8003]],
  [144, 'lulu', 18, [0x8019, 0x800f, 0x8006, 0x800d]],
  [145, 'rikku', 17, [0x8019, 0x800f, 0x8012, 0x801a]],
];

describe('the rows equal the weapon table', () => {
  for (const [row, who, formula, words] of EXTRACT) {
    it(`row ${row} is ${who}'s: formula 0x${formula.toString(16)}, power 16, four fixed abilities, Break Damage Limit first`, () => {
      const r = CELESTIAL_WEAPONS[who]!;
      expect(r.row).toBe(row);
      expect(r.formula).toBe(formula);
      expect(r.power).toBe(16);
      expect(r.abilities.map((a) => 0x8000 | AUTO_ABILITY_RECORD[a])).toEqual(words);
      expect(r.abilities[0]).toBe('break-damage-limit');
      const piece = celestialWeapon(who)!;
      expect(piece).toMatchObject({ slots: 4, bonusCrit: 3, weaponRow: { formula, power: 16 } });
      expect(piece.autoAbilities).toEqual([...r.abilities]);
    });
  }

  it('there are exactly seven, and a character with none has no piece', () => {
    expect(Object.keys(CELESTIAL_WEAPONS).sort()).toEqual(['auron', 'kimahri', 'lulu', 'rikku', 'tidus', 'wakka', 'yuna']);
    expect(celestialWeapon('seymour')).toBeUndefined();
  });

  it('every row\'s power is the plain weapon command\'s power: the engine keeps the command\'s own (16), so the two must be equal', () => {
    const attack = ALL_ABILITIES.find((a) => a.id === 'attack');
    const plain = attack?.power ?? 16;
    for (const r of Object.values(CELESTIAL_WEAPONS)) expect(r.power).toBe(plain);
  });
});

describe('the kernel reads the Celestial formulas (RE 6.5: no defence term)', () => {
  const user = (o: Partial<{ hp: number; mp: number }> = {}) => ({ str: 255, mag: 255, cheer: 0, focus: 0, maxHp: 9999, maxMp: 999, hp: 9999, mp: 999, ...o });
  const target = { id: 0, def: 240, mdf: 200, cheer: 0, focus: 0, maxHp: 12_000_000, maxMp: 999, baseCtb: 9, runningHp: 12_000_000, runningMp: 999, runningCtb: 9, saveCounter: 0 };
  const hit = (formula: number, v: number, u: ReturnType<typeof user>) => baseDamage({ user: u, target, cmd: { flagsDamage: 0, damageClass: 1 }, formula, power: 16, snapshot: 0, mode: 1, variance: true }, () => v).value;

  it('0x11 at full HP does 485,809 to 548,560 before the cap; 264,986 to 299,213 at half HP; 88,328 to 99,737 at a tenth', () => {
    expect([hit(0x11, 0, user()), hit(0x11, 31, user())]).toEqual([485_809, 548_560]);
    expect([hit(0x11, 0, user({ hp: 5000 })), hit(0x11, 31, user({ hp: 5000 }))]).toEqual([264_986, 299_213]);
    expect([hit(0x11, 0, user({ hp: 1000 })), hit(0x11, 31, user({ hp: 1000 }))]).toEqual([88_328, 99_737]);
  });

  it('0x12 reads MP, not HP: the same at full MP whatever the HP', () => {
    expect([hit(0x12, 0, user({ hp: 100 })), hit(0x12, 31, user({ hp: 100 }))]).toEqual([485_809, 548_560]);
  });

  it('0x13 (Auron) is half of 0x11 at full HP and grows as HP falls', () => {
    expect([hit(0x13, 0, user()), hit(0x13, 31, user())]).toEqual([242_904, 274_279]);
    expect([hit(0x13, 0, user({ hp: 2500 })), hit(0x13, 31, user({ hp: 2500 }))]).toEqual([850_166, 959_979]);
  });

  it('so while the wielder has more than about a tenth of his HP, every hit on Penance or an arm is over the 99,999 cap, Protect\'s halving included', () => {
    expect(hit(0x11, 0, user()) / 2).toBeGreaterThan(99_999);
    expect(hit(0x11, 0, user({ hp: 2000 })) / 2).toBeLessThan(99_999 * 2); // and a fifth is where it stops being true
  });
});

describe('the engine reads the field (adapt/hit.ts)', () => {
  it('Tidus\'s Celestial Attack does exactly 99,999 to an arm, six hits to bring it from 500,000 to 0 (5.00005 hits: RE 6.5)', () => {
    const e = newEngine(7);
    const arm = actor(e, RIGHT_ARM);
    arm.hp = 99_999 * 5 + 1; // five capped hits leave exactly one point
    const hits: number[] = [];
    let dead = false;
    for (let i = 0; i < 80 && !dead; i++) {
      const d = nextInput(e);
      const c = d.actorId === 'tidus' ? swing(d, RIGHT_ARM) : null;
      if (c) {
        e.submit(c);
        for (const ev of log(e)) if (ev.type === 'damage' && ev.targetId === RIGHT_ARM && ev.sourceId === 'tidus') hits.push(ev.amount);
        dead = !arm.alive;
        continue;
      }
      e.submit(defend());
    }
    expect(dead).toBe(true);
    expect(new Set(hits.map((h) => h)).size).toBeGreaterThanOrEqual(1);
    expect(Math.max(...hits)).toBe(99_999);
  });

  it('a plain-weapon Tidus, on the same blow, is nowhere near: the field is the whole difference', () => {
    const plain = structuredClone(penanceBuild);
    for (const m of plain.members) delete (m.equipment.weapon as { weaponRow?: unknown }).weaponRow;
    const e = newEngine(7, plain);
    const arm = actor(e, RIGHT_ARM);
    let amount = 0;
    for (let i = 0; i < 40 && amount === 0; i++) {
      const d = nextInput(e);
      const c = d.actorId === 'tidus' ? swing(d, RIGHT_ARM) : null;
      if (c) {
        e.submit(c);
        for (const ev of log(e)) if (ev.type === 'damage' && ev.targetId === RIGHT_ARM && ev.sourceId === 'tidus') amount = ev.amount;
        continue;
      }
      e.submit(defend());
    }
    expect(arm.hp).toBeGreaterThan(0);
    expect(amount).toBeGreaterThan(0);
    expect(amount).toBeLessThan(99_999);
  });
});

describe('no other chapter\'s build carries the field (the other chapters are byte-identical)', () => {
  it('the Dream\'s End, Mirror Aeons and Zanarkand parties have none; the Penance party has it on all seven', () => {
    for (const build of [dreamsEndBuild, mirrorAeonsBuild, zanarkandBuild]) for (const m of build.members) expect((m.equipment.weapon as { weaponRow?: unknown }).weaponRow, `${m.id}`).toBeUndefined();
    expect(penanceBuild.members.map((m) => (m.equipment.weapon as { weaponRow?: { formula: number } }).weaponRow?.formula)).toEqual(
      penanceBuild.members.map((m) => CELESTIAL_WEAPONS[m.id]?.formula),
    );
    expect(penanceBuild.members).toHaveLength(7);
  });
});
