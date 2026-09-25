/**
 * Chapter 3 (Dream's End / Inside Sin) — the possessed-aeon gauntlet.
 *
 * Covers the `possessed-*` `AbilityDef` records in
 * `src/data/ffx/enemies/braskas-final-aeon-abilities.ts` against the two
 * research sources that publish their numbers:
 *
 * - `research/ffx-combat-core.md` §6.3, the decompiled aeon action table
 *   (rows / ranks / DmgCon, `[verified: 2 sources]`).
 * - `research/ffx-bfa-yu-yevon.md` §2.2, the mirroring rule: a possessed aeon
 *   "fights with exactly the stats it has as the player's own aeon"
 *   `[verified: 2 sources]`. That is why most assertions here are written as
 *   "the possessed record equals the player-aeon record on the fields §6.3
 *   publishes" rather than as bare literals — a literal can be edited to match
 *   a regression, but the two records disagreeing is the actual defect class
 *   this file exists to catch.
 *
 * Deliberately NOT covered here: `canMiss`, which
 * `tests/unit/data-ffx-tables-abilities.test.ts` already owns for this file.
 * What IS covered is the separate always-hit question that `canMiss` checks
 * cannot see — see the last describe block.
 */

import { describe, expect, it } from 'vitest';

import type { AbilityDef, FFXCombatant } from '../../../src/battle/common/types.ts';
import { hitChance } from '../../../src/battle/ffx/accuracy.ts';
import { BRASKAS_FINAL_AEON_ABILITIES } from '../../../src/data/ffx/enemies/braskas-final-aeon-abilities.ts';
import { ABILITIES as AEON_ABILITIES_OPTIONAL } from '../../../src/data/ffx/aeons/abilities-optional.ts';
import { ABILITIES as AEON_ABILITIES_OPTIONAL_2 } from '../../../src/data/ffx/aeons/abilities-optional-2.ts';

/** The player-aeon records the possessed copies must mirror [ffx-bfa-yu-yevon.md §2.2]. */
const AEON_ABILITIES: Record<string, AbilityDef> = {
  ...AEON_ABILITIES_OPTIONAL,
  ...AEON_ABILITIES_OPTIONAL_2,
};

function possessed(id: string): AbilityDef {
  const def = BRASKAS_FINAL_AEON_ABILITIES[id];
  if (!def) throw new Error(`no possessed-aeon AbilityDef with id ${id}`);
  return def;
}

function playerAeon(id: string): AbilityDef {
  const def = AEON_ABILITIES[id];
  if (!def) throw new Error(`no player-aeon AbilityDef with id ${id}`);
  return def;
}

describe("possessed Mindy — Passado is 2 DmgCon x 15 hits, not 26 x 2", () => {
  // `research/ffx-combat-core.md` §6.3, Magus Sisters row: "Camisade (229) 21,
  // Razzia (231) 21, Passado (233) **2 x 15 hits**", formula column
  // "Strength, Physical" [verified: 2 sources].
  it('carries DmgCon 2 per hit across 15 hits', () => {
    const passado = possessed('possessed-mindy-passado');
    expect(passado.power).toBe(2);
    expect(passado.hits).toBe(15);
  });

  it('is a Strength/Physical action per the same §6.3 row', () => {
    const passado = possessed('possessed-mindy-passado');
    expect(passado.formula).toBe('strength');
    expect(passado.damageType).toBe('physical');
  });

  it('agrees with the player-aeon Passado record on every field §6.3 publishes', () => {
    // §2.2's mirroring rule. This is the assertion that would have caught the
    // original defect: the two records described different moves.
    const mine = possessed('possessed-mindy-passado');
    const theirs = playerAeon('passado');
    expect({
      power: mine.power,
      hits: mine.hits,
      formula: mine.formula,
      damageType: mine.damageType,
      targeting: mine.targeting,
    }).toEqual({
      power: theirs.power,
      hits: theirs.hits,
      formula: theirs.formula,
      damageType: theirs.damageType,
      targeting: theirs.targeting,
    });
  });

  it('does not silently transpose power and hits again', () => {
    // The specific regression shape: 26x2 was power/hits swapped AND inflated.
    // A 15-hit flurry and a 2-hit heavy pair are not interchangeable even at a
    // similar damage product — hits drive per-hit Defense subtraction, per-hit
    // crit rolls and the 9,999 cap.
    const passado = possessed('possessed-mindy-passado');
    expect(passado.hits).toBeGreaterThan(passado.power);
  });
});

describe('possessed Yojimbo — Daigoro is Strength + piercing flag, DmgCon 10', () => {
  // `research/ffx-combat-core.md` §6.3, Yojimbo row: "Daigoro (222) DmgCon 10",
  // formula column "Strength, Physical" [verified: 2 sources].
  it('uses the plain Strength formula at DmgCon 10', () => {
    const daigoro = possessed('possessed-yojimbo-daigoro');
    expect(daigoro.power).toBe(10);
    expect(daigoro.formula).toBe('strength');
    expect(daigoro.damageType).toBe('physical');
  });

  it('keeps piercing as a FLAG, never as the piercing-strength formula', () => {
    // These are two different rules in the research and must not be conflated:
    // §14's flag table (line 2055) — `piercing` = "Uses Defense 0 against
    // **Armored** targets", aeon weapons except Valefor; §2.5's formula table
    // (line 270) — `Piercing Strength` (formula 2) = "ignores Defense (treats
    // DEF as 0)" unconditionally. §6.3 puts Daigoro on plain Strength, so the
    // formula variant would zero Defense against every target, not just
    // Armored ones.
    const daigoro = possessed('possessed-yojimbo-daigoro');
    expect(daigoro.flags).toContain('piercing');
    expect(daigoro.formula).not.toBe('piercing-strength');
  });

  it('agrees with the player-aeon Daigoro record on every field §6.3 publishes', () => {
    const mine = possessed('possessed-yojimbo-daigoro');
    const theirs = playerAeon('daigoro');
    expect({
      power: mine.power,
      hits: mine.hits,
      formula: mine.formula,
      damageType: mine.damageType,
      targeting: mine.targeting,
      piercing: mine.flags.includes('piercing'),
    }).toEqual({
      power: theirs.power,
      hits: theirs.hits,
      formula: theirs.formula,
      damageType: theirs.damageType,
      targeting: theirs.targeting,
      piercing: theirs.flags.includes('piercing'),
    });
  });
});

/**
 * Ten `category: 'aeon'` possessed Attack/Special records — the set the
 * always-hit open item applies to. Overdrive copies are excluded: they are
 * `category: 'overdrive'` and carry `canMiss: false` deliberately, checked by
 * `tests/unit/data-ffx-tables-abilities.test.ts`.
 */
const POSSESSED_ATTACK_SPECIAL_IDS = [
  'possessed-valefor-sonic-wings',
  'possessed-ifrit-meteor-strike',
  'possessed-ixion-aerospark',
  'possessed-shiva-heavenly-strike',
  'possessed-bahamut-impulse',
  'possessed-anima-pain',
  'possessed-yojimbo-daigoro',
  'possessed-cindy-camisade',
  'possessed-sandy-razzia',
  'possessed-mindy-passado',
];

describe('possessed-aeon Attack/Special records match §6.3 formula and damage type', () => {
  // §6.3's per-aeon formula column, transcribed. "All five core aeon specials
  // use the Strength formula against the target's Defense" — Pain is the one
  // documented exception (Special Magic, Magical), and Meteor Strike is the
  // one Strength action typed Other. [verified: 2 sources]
  const EXPECTED: Record<string, { formula: string; damageType: string }> = {
    'possessed-valefor-sonic-wings': { formula: 'strength', damageType: 'physical' },
    'possessed-ifrit-meteor-strike': { formula: 'strength', damageType: 'other' },
    'possessed-ixion-aerospark': { formula: 'strength', damageType: 'physical' },
    'possessed-shiva-heavenly-strike': { formula: 'strength', damageType: 'physical' },
    'possessed-bahamut-impulse': { formula: 'strength', damageType: 'physical' },
    'possessed-anima-pain': { formula: 'special-magic', damageType: 'magical' },
    'possessed-yojimbo-daigoro': { formula: 'strength', damageType: 'physical' },
    'possessed-cindy-camisade': { formula: 'strength', damageType: 'physical' },
    'possessed-sandy-razzia': { formula: 'strength', damageType: 'physical' },
    'possessed-mindy-passado': { formula: 'strength', damageType: 'physical' },
  };

  it('every one of the ten matches its §6.3 row', () => {
    const offenders: string[] = [];
    for (const id of POSSESSED_ATTACK_SPECIAL_IDS) {
      const def = possessed(id);
      const want = EXPECTED[id];
      if (!want) continue;
      if (def.formula !== want.formula || def.damageType !== want.damageType) {
        offenders.push(`${id}: ${def.formula}/${def.damageType} != ${want.formula}/${want.damageType}`);
      }
    }
    expect(offenders, offenders.join('; ')).toEqual([]);
  });

  it('no possessed-aeon record uses the piercing-strength formula', () => {
    // Regression guard for the Daigoro fix, across the whole file rather than
    // one id: nothing in §6.3's aeon table is on formula 2.
    const offenders = Object.values(BRASKAS_FINAL_AEON_ABILITIES)
      .filter((a) => a.id.startsWith('possessed-') && a.formula === 'piercing-strength')
      .map((a) => a.id);
    expect(offenders, offenders.join(', ')).toEqual([]);
  });
});

describe('OPEN ITEM — possessed-aeon Attack/Specials currently always hit', () => {
  /**
   * This block asserts a KNOWN GAP, not desired behaviour. See the
   * "ACCURACY BYTE" section of `braskas-final-aeon-abilities.ts`'s header and
   * the 2026-09-17 entry in `docs/CONTRACT-CHANGES.md`.
   *
   * None of the ten records carries an `accuracy` byte, and
   * `src/battle/ffx/accuracy.ts` tests `user.side === 'enemy'` *before* the
   * damage-type branch — so every one of them takes the ALWAYS-hit path and
   * Darkness, Aim/Reflex, Evasion and Luck never apply. No research source
   * publishes a byte for these rows (`research/ffx-bfa-yu-yevon.md` gives one
   * accuracy figure in the entire chapter, Blade Blitz's 150 at §1.3; §6.3 has
   * no accuracy column), so none was invented.
   *
   * **If these tests start failing, that is probably progress.** Do not
   * "repair" them by reverting the data. Close the open item in
   * `docs/CONTRACT-CHANGES.md`, then rewrite this block to assert the new,
   * sourced behaviour.
   */
  const enemyUser: FFXCombatant = {
    id: 'test-possessed-aeon',
    name: 'Possessed Test Aeon',
    side: 'enemy',
    spriteKey: 'valefor',
    stats: { hp: 9999, mp: 999, str: 50, def: 50, mag: 50, mdef: 50, agi: 50, luck: 1, eva: 0, acc: 100, maxHp: 9999, maxMp: 999 },
    hp: 9999,
    mp: 999,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: 'ai',
    alive: true,
    removed: false,
    slot: 0,
    flags: {},
    learnedAbilityIds: [],
  };
  const partyTarget: FFXCombatant = {
    ...enemyUser,
    id: 'test-party-member',
    name: 'Test Party Member',
    side: 'party',
    stats: { ...enemyUser.stats, eva: 30, luck: 18 },
  };

  it('none of the ten carries an accuracy byte (no byte was invented)', () => {
    const withByte = POSSESSED_ATTACK_SPECIAL_IDS.filter((id) => possessed(id).accuracy !== undefined);
    expect(withByte, `now sourced? update docs/CONTRACT-CHANGES.md: ${withByte.join(', ')}`).toEqual([]);
  });

  it('and so all ten always hit today — the documented gap, behaviour not just fields', () => {
    const rolling: string[] = [];
    for (const id of POSSESSED_ATTACK_SPECIAL_IDS) {
      if (hitChance(enemyUser, partyTarget, possessed(id)) !== null) rolling.push(id);
    }
    expect(rolling, `these now roll — close the open item rather than reverting: ${rolling.join(', ')}`).toEqual([]);
  });

  it('by contrast the chapter action that DOES have a byte still rolls', () => {
    // Blade Blitz, `accuracy: 150` [ffx-bfa-yu-yevon.md §1.3 line 105,
    // verified: 2 sources]. Proves the two tests above measure the missing
    // byte and not some blanket enemy-side always-hit rule.
    const bladeBlitz = BRASKAS_FINAL_AEON_ABILITIES['blade-blitz'];
    expect(bladeBlitz).toBeDefined();
    if (!bladeBlitz) return;
    expect(bladeBlitz.accuracy).toBe(150);
    expect(hitChance(enemyUser, partyTarget, bladeBlitz)).not.toBeNull();
  });
});

describe('possessed aeons show their name capitalised in battle (round 11)', () => {
  // `src/battle/ffx/setup.ts` names the combatant from `forms[0].name`, so the
  // turn order read 'Possessed valefor' while the record said 'Possessed Valefor'.
  it('every link names the aeon the same way in the record and its form', async () => {
    const { buildPossessedAeonChain } = await import('../../../src/data/ffx/enemies/braskas-final-aeon.ts');
    const chain = buildPossessedAeonChain(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'yojimbo', 'anima', 'magus-sisters']);
    const aeons = chain.flatMap((g) => g.enemies).filter((e) => e.id.startsWith('possessed-'));
    expect(aeons.length).toBeGreaterThan(0);
    for (const e of aeons) {
      expect(e.forms?.[0]?.name, e.id).toBe(e.name);
      expect(e.name, e.id).toMatch(/^Possessed [A-Z]/);
    }
  });
});
