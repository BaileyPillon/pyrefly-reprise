/**
 * Chapter XIII — Paragon and Trema (FFX-2): the data and the AI, pinned to
 * `research/ffx2-trema.md` §3, §4 and §5 and to Bailey's picks on
 * `docs/plans/chapter-trema-review.md` (TR2 a, TR3 a, TR4 b, TR7, TR8 a). **Game case: FFX-2
 * only** [AGENTS.md rule 14]. Every claim is run against the shipped records [hard rule 3].
 */

import { describe, expect, it } from 'vitest';
import { dressphereStats } from '../../../src/battle/ffx2/dressphere-stats.ts';
import { hitPercent } from '../../../src/battle/ffx2/hit.ts';
import { resolveAbility } from '../../../src/battle/ffx2/resolve.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { paragon } from '../../../src/data/ffx2/enemies/paragon.ts';
import { trema } from '../../../src/data/ffx2/enemies/trema.ts';
import { board } from '../helpers/tremaUnits.ts';

describe('Lv 99 dressphere rows (TR-G1; research §5, [single source])', () => {
  const rows: Array<[string, number[]]> = [
    ['dark-knight', [5355, 338, 175, 109, 151, 105, 42, 105, 3, 11]],
    ['warrior', [4122, 168, 168, 56, 132, 13, 54, 103, 6, 13]],
    ['alchemist', [2553, 107, 125, 29, 52, 35, 58, 124, 4, 12]],
    ['white-mage', [2294, 350, 20, 154, 21, 194, 55, 103, 7, 12]],
    ['gun-mage', [2523, 288, 152, 149, 51, 97, 59, 127, 4, 11]],
    // MDef 48, the growth algorithm's, not the wiki's duplicated 58 (combat-core §5.1a).
    ['gunner', [2837, 123, 137, 73, 58, 48, 57, 131, 4, 24]],
  ];
  for (const [id, want] of rows) {
    it(`${id} at Lv 99 equals the table`, () => {
      const s = dressphereStats(id, 99);
      expect([s.hp, s.mp, s.str, s.mag, s.def, s.mdef, s.agi, s.acc, s.eva, s.luck]).toEqual(want);
    });
  }

  it('changes nothing at the levels the shipped builds use (Lv 20 to 50)', () => {
    expect(dressphereStats('dark-knight', 50)).toMatchObject({ hp: 2931, str: 116, def: 139 });
    expect(dressphereStats('white-mage', 46)).toMatchObject({ hp: 1244, mag: 102 });
    expect(dressphereStats('gunner', 23)).toMatchObject({ hp: 969 });
  });
});

describe('the stat blocks (research §3)', () => {
  it('Trema: Lv 99, HP 999,999, MP 999, 255 x4, Agi 129, Eva 99, Luck 26, Spellspring, every status immune', () => {
    expect(trema.level).toBe(99);
    expect(trema.stats).toMatchObject({ maxHp: 999999, maxMp: 999, str: 255, mag: 255, def: 255, mdef: 255, agi: 129, eva: 99, luck: 26 });
    expect(trema.autoStatuses).toEqual(['spellspring']);
    // Re-parity W3: 'reflect' left the list. Trema's game row resists Slow, Stop, the stat stages and Doom (255) but not the good
    // statuses (Shell, Protect, Reflect, Regen, Haste), so Reflect is not immune (research/re-ffx2-commands.md §7).
    for (const s of ['ko', 'poison', 'slow', 'stop', 'str-down', 'def-down', 'doom']) {
      expect(trema.immunities[s as keyof typeof trema.immunities], s).toBe(255);
    }
    expect(trema.affinities.gravity).toBe('immune');
  });

  it('Paragon: Lv 99, HP 200,000, TR8 a (Mag 244 / Def 88 / MDef 88), the same list without Reflect', () => {
    expect(paragon.stats).toMatchObject({ maxHp: 200000, maxMp: 9999, str: 244, mag: 244, def: 88, mdef: 88, agi: 188, luck: 13 });
    expect(paragon.immunities.reflect ?? 0).toBe(0);
    expect(paragon.immunities.stop).toBe(255);
  });

  it('Meteor is magical (TR3 a), 12 hits of 1/8 max HP, free; Flare 54 MP, Ultima 90, Demi 10', () => {
    const a = data.ABILITIES;
    expect(a['trema-meteor']).toMatchObject({ damageType: 'magical', hits: 12, power: 2, formula: 'percent-total', mpCost: 0, targeting: 'random-enemy' });
    expect(a['trema-flare']?.mpCost).toBe(54);
    expect(a['trema-ultima']?.mpCost).toBe(90);
    expect(a['trema-demi']?.mpCost).toBe(10);
    expect(a['paragon-big-bang']?.power).toBe(250);
  });
});

// Re-parity W3 (FFX-2 only; reason "game-code parity"). This block used to pin the engine's own hit race for the Dark Knight's
// Darkness against Trema's Evasion 99: 0 % without Rabite's Foot, 91 % with one (the plan's TR-G2 / TR9 b problem and its answer).
// The game's command row for Darkness (0x307f) is accuracy formula 0: it never rolls, so Trema's Evasion has no say and the
// answer to TR-G2 is that there was never a problem (research/re-ffx2-commands.md §4; listed for Bailey in the W3 handoff, since
// the chapter's plan makes Rabite's Foot the key to this move). The engine now follows the row; what stays pinned is that the
// move lands on every seed, with or without the accessory, and that its odds print as 100 %.
describe('Darkness against Evasion 99 (TR-G2, TR9 b; run, not read)', () => {
  it("lands 100 % with or without Rabite's Foot: the game's row never rolls", () => {
    const b = board('trema');
    const yuna = b.unit('yuna');
    const t = b.unit('trema');
    const darkness = data.ABILITIES['x2-dark-knight-darkness']!;
    expect(yuna.stats.luck).toBe(111); // 11 + Rabite's Foot's 100
    expect(hitPercent(yuna, t, darkness)).toBe(100);
    const bare = { ...yuna, stats: { ...yuna.stats, luck: 11 } };
    expect(hitPercent(bare, t, darkness)).toBe(100);
    for (let seed = 1; seed <= 20; seed++) {
      const before = t.hp;
      resolveAbility(b.resolveCtx(seed), bare, darkness, []);
      expect(t.hp, `seed ${seed}`).toBeLessThan(before);
    }
  });
});

// Re-parity AI-FFX2-b (FFX-2 only; reason "game-script parity"). The two blocks that stood here pinned the first build's Trema and Paragon scripts (SinirothX's dump:
// a story table of 1/8 Demi and 1/8 Flare, a fixed Meteor-Meteor-Ultima order with one trigger a turn, a chain taken one link a turn, a Big Bang counter that needed a
// damaging hit). The game's own scripts (m295 / m328 and m152) replaced them: the exact outcome tables are in tests/unit/parity-ffx2-ai-trema.test.ts and
// parity-ffx2-ai-paragon.test.ts. The rows Bailey decided stay pinned there too: the MP gate on Trema's spells (TR4 b) and Big Bang as an immediate counter (TR12 b).
