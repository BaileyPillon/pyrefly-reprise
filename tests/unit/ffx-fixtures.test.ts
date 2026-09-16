/**
 * Shared fixtures for the FFX engine tests, plus a sanity check that they
 * build. The other `ffx-*.test.ts` files import from here.
 *
 * Deliberately inline: `src/data/ffx/**` is being filled in by other agents
 * right now, so the engine tests must not depend on it.
 */

import { describe, expect, it } from 'vitest';
import type {
  AbilityDef,
  AeonBuild,
  BattleSetup,
  EnemyDef,
  EquipmentDef,
  FFXCombatant,
  FFXMemberBuild,
  FFXPartyBuild,
  StatBlock,
} from '../../src/battle/common/types.ts';

/** A stat block with sane defaults. */
export function stats(overrides: Partial<StatBlock> = {}): StatBlock {
  const base: StatBlock = {
    hp: 2000,
    mp: 200,
    str: 20,
    def: 20,
    mag: 20,
    mdef: 20,
    agi: 20,
    luck: 20,
    eva: 0,
    acc: 100,
    maxHp: 2000,
    maxMp: 200,
  };
  return { ...base, ...overrides };
}

const BARE: EquipmentDef = { name: 'Bare', slots: 1, autoAbilities: [] };

/** A combatant built straight from literals, for formula-level tests. */
export function fighter(overrides: Partial<FFXCombatant> & { id: string }): FFXCombatant {
  const s = overrides.stats ?? stats();
  return {
    name: overrides.id,
    side: 'party',
    spriteKey: overrides.id,
    hp: s.maxHp,
    mp: s.maxMp,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: 'player',
    alive: true,
    removed: false,
    slot: 0,
    flags: {},
    learnedAbilityIds: [],
    ...overrides,
    stats: s,
  };
}

/** An ability record with everything defaulted to "does nothing". */
export function ability(overrides: Partial<AbilityDef> & { id: string }): AbilityDef {
  return {
    name: overrides.id,
    game: 'ffx',
    category: 'skill',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    ...overrides,
  };
}

/** The standard Attack: Strength, Physical, DmgCon 16, one hit [§2.5]. */
export function attackAbility(): AbilityDef {
  return ability({
    id: 'attack',
    name: 'Attack',
    category: 'attack',
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    flags: ['crit-eligible', 'adds-equipment-crit', 'inherits-weapon-properties', 'affected-by-darkness'],
  });
}

/** A party member build. */
export function member(overrides: Partial<FFXMemberBuild> & { id: string }): FFXMemberBuild {
  const s = overrides.stats ?? stats();
  return {
    name: overrides.id,
    spriteKey: overrides.id,
    portraitKey: overrides.id,
    hp: s.maxHp,
    mp: s.maxMp,
    learnedAbilityIds: [],
    equipment: { weapon: { ...BARE }, armor: { ...BARE } },
    overdrive: { gauge: 0, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: [] },
    sphereGrid: { position: 'n0', activatedNodeIds: [], sLv: 0, ap: 0, spheres: {} },
    ...overrides,
    stats: s,
  };
}

/** An enemy formation entry. */
export function enemy(overrides: Partial<EnemyDef> & { id: string }): EnemyDef {
  const s = overrides.stats ?? stats({ hp: 5000, maxHp: 5000, agi: 20 });
  return {
    name: overrides.id,
    spriteKey: overrides.id,
    slot: 0,
    hp: s.maxHp,
    mp: s.maxMp,
    affinities: {},
    immunities: {},
    immunityFlags: [],
    forms: [{ name: overrides.name ?? overrides.id, spriteKey: overrides.id, hp: s.maxHp }],
    aiScriptId: 'none',
    rewards: { ap: 100, apOverkill: 150, gil: 50, overkillThreshold: 1000, drops: [] },
    abilityIds: [],
    flags: {},
    ...overrides,
    stats: s,
  };
}

/** An aeon build. */
export function aeon(overrides: Partial<AeonBuild> & { id: string }): AeonBuild {
  const s = overrides.stats ?? stats({ hp: 3000, maxHp: 3000, agi: 20 });
  return {
    name: overrides.id,
    spriteKey: overrides.id,
    hp: s.maxHp,
    mp: s.maxMp,
    overdriveGauge: 0,
    abilityIds: [],
    overdriveIds: [],
    ...overrides,
    stats: s,
  };
}

/** A three-member party. */
export function party(overrides: Partial<FFXPartyBuild> = {}): FFXPartyBuild {
  const members = overrides.members ?? [
    member({ id: 'tidus' }),
    member({ id: 'yuna' }),
    member({ id: 'auron' }),
  ];
  return {
    game: 'ffx',
    members,
    activeSlots: [members[0]?.id ?? 'tidus', members[1]?.id ?? 'yuna', members[2]?.id ?? 'auron'],
    reserve: [],
    aeons: [],
    inventory: [],
    gil: 1000,
    sphereInventory: {},
    ...overrides,
  };
}

/** A complete, runnable battle setup. */
export function setup(overrides: Partial<BattleSetup> = {}): BattleSetup {
  return {
    game: 'ffx',
    party: party(),
    enemies: { id: 'test-group', game: 'ffx', enemies: [enemy({ id: 'dummy' })], canEscape: false },
    triggers: [],
    seed: 12345,
    condition: 'scripted',
    canEscape: false,
    ...overrides,
  };
}

describe('ffx test fixtures', () => {
  it('builds a party, an enemy and a runnable setup', () => {
    const s = setup();
    expect(s.party.game).toBe('ffx');
    expect(s.enemies.enemies).toHaveLength(1);
    expect(fighter({ id: 'x' }).hp).toBe(2000);
    expect(attackAbility().power).toBe(16);
  });
});
