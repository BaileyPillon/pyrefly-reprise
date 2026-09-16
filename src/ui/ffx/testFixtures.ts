import type {
  AvailableCommand,
  BattleState,
  FFXCombatant,
  FFXPartyBuild,
  TurnPreview,
} from '../../battle/common/types.ts';

/**
 * Fake FFX battle data shared by the screenshot demo screen
 * (`FFXHudDemoScreen`) and the `tests/unit/ui-ffx-*` unit tests, so both
 * exercise the exact same shapes the real engine will eventually produce.
 * Nothing here is wired to a battle engine — see `HudMock`'s own header
 * comment for why a static fixture is the right tool for this job.
 */

function combatant(overrides: Partial<FFXCombatant> & Pick<FFXCombatant, 'id' | 'name' | 'side'>): FFXCombatant {
  return {
    spriteKey: overrides.id,
    stats: { hp: 2600, mp: 92, str: 24, def: 18, mag: 16, mdef: 14, agi: 20, luck: 12, eva: 10, acc: 200, maxHp: 2600, maxMp: 92 },
    hp: 2600,
    mp: 92,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: overrides.side === 'party' ? 'player' : 'ai',
    alive: true,
    removed: false,
    slot: 0,
    flags: {},
    learnedAbilityIds: [],
    ...overrides,
  };
}

export function makeFakeParty(): FFXCombatant[] {
  return [
    combatant({
      id: 'tidus',
      name: 'Tidus',
      side: 'party',
      portraitKey: 'tidus',
      slot: 0,
      hp: 2419,
      stats: { hp: 2600, mp: 92, str: 28, def: 20, mag: 14, mdef: 12, agi: 32, luck: 18, eva: 20, acc: 210, maxHp: 2600, maxMp: 92 },
      mp: 68,
      overdrive: { gauge: 100, mode: 'warrior', unlockedModes: ['stoic', 'warrior', 'comrade'], unlockedOverdriveIds: ['spiral-cut', 'slice-and-dice'] },
    }),
    combatant({
      id: 'yuna',
      name: 'Yuna',
      side: 'party',
      portraitKey: 'yuna',
      slot: 1,
      hp: 1782,
      stats: { hp: 1900, mp: 312, str: 14, def: 16, mag: 22, mdef: 20, agi: 18, luck: 16, eva: 14, acc: 190, maxHp: 1900, maxMp: 312 },
      mp: 240,
      overdrive: { gauge: 62, mode: 'healer', unlockedModes: ['stoic', 'healer'], unlockedOverdriveIds: ['grand-summon'] },
      statuses: { protect: { id: 'protect', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false } },
    }),
    combatant({
      id: 'auron',
      name: 'Auron',
      side: 'party',
      portraitKey: 'auron',
      slot: 2,
      hp: 3080,
      stats: { hp: 3080, mp: 60, str: 30, def: 24, mag: 10, mdef: 10, agi: 12, luck: 10, eva: 8, acc: 200, maxHp: 3080, maxMp: 60 },
      mp: 34,
      overdrive: { gauge: 28, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['dragon-fang'] },
    }),
  ];
}

export function makeFakeEnemies(): FFXCombatant[] {
  return [
    combatant({
      id: 'seymour-flux',
      name: 'Seymour',
      side: 'enemy',
      slot: 0,
      hp: 32000,
      stats: { hp: 32000, mp: 500, str: 30, def: 20, mag: 40, mdef: 30, agi: 14, luck: 10, eva: 5, acc: 180, maxHp: 32000, maxMp: 500 },
      mp: 500,
      flags: { isBoss: true },
      sensorText: 'Weak to nothing in particular.',
    }),
    combatant({
      id: 'mortiorchis',
      name: 'Mortiorchis',
      side: 'enemy',
      slot: 1,
      hp: 48000,
      stats: { hp: 48000, mp: 200, str: 40, def: 30, mag: 20, mdef: 20, agi: 8, luck: 8, eva: 2, acc: 200, maxHp: 48000, maxMp: 200 },
      mp: 200,
      flags: { isBoss: true },
      sensorText: 'Charging Total Annihilation.',
    }),
  ];
}

export function makeFakeCombatants(): Record<string, FFXCombatant> {
  const record: Record<string, FFXCombatant> = {};
  for (const c of [...makeFakeParty(), ...makeFakeEnemies()]) record[c.id] = c;
  return record;
}

export function makeFakeTurnPreview(): TurnPreview[] {
  return [
    { actorId: 'tidus', tickValue: 0, index: 0, isParty: true, portraitKey: 'tidus', statusIcons: [], overdriveReady: true },
    { actorId: 'seymour-flux', tickValue: 40, index: 1, isParty: false, letterTag: 'A', statusIcons: [], overdriveReady: false, chargeStage: 1 },
    { actorId: 'yuna', tickValue: 55, index: 2, isParty: true, portraitKey: 'yuna', statusIcons: ['protect'], overdriveReady: false },
    { actorId: 'mortiorchis', tickValue: 70, index: 3, isParty: false, letterTag: 'B', statusIcons: [], overdriveReady: false, chargeStage: 2 },
    { actorId: 'auron', tickValue: 90, index: 4, isParty: true, portraitKey: undefined, statusIcons: [], overdriveReady: false },
    { actorId: 'tidus', tickValue: 120, index: 5, isParty: true, portraitKey: 'tidus', statusIcons: [], overdriveReady: true },
    { actorId: 'seymour-flux', tickValue: 140, index: 6, isParty: false, letterTag: 'A', statusIcons: [], overdriveReady: false },
    { actorId: 'yuna', tickValue: 155, index: 7, isParty: true, portraitKey: 'yuna', statusIcons: [], overdriveReady: false },
    { actorId: 'mortiorchis', tickValue: 170, index: 8, isParty: false, letterTag: 'B', statusIcons: [], overdriveReady: false },
    { actorId: 'auron', tickValue: 190, index: 9, isParty: true, portraitKey: undefined, statusIcons: [], overdriveReady: false },
  ];
}

export function makeFakeCommands(): AvailableCommand[] {
  return [
    { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, rank: 3, enabled: true, validTargets: ['seymour-flux', 'mortiorchis'], help: 'A basic physical attack.' },
    { command: { kind: 'ability', id: 'spiral-cut', targets: [] }, label: 'Spiral Cut', category: 'skill', mpCost: 0, rank: 8, enabled: true, validTargets: ['seymour-flux', 'mortiorchis'], opensMinigame: 'tidus-timing', help: 'Rank 8 · Overdrive.' },
    { command: { kind: 'ability', id: 'quick-hit', targets: [] }, label: 'Quick Hit', category: 'skill', mpCost: 0, rank: 2, enabled: true, validTargets: ['seymour-flux', 'mortiorchis'], help: 'Rank 2 · A fast, weak strike.' },
    { command: { kind: 'ability', id: 'cure', targets: [] }, label: 'Cure', category: 'whitemagic', mpCost: 8, rank: 4, enabled: true, validTargets: ['tidus', 'yuna', 'auron'], help: 'Restores HP.' },
    { command: { kind: 'ability', id: 'firaga', targets: [] }, label: 'Firaga', category: 'blackmagic', mpCost: 30, rank: 5, enabled: false, disabledReason: 'Silenced', validTargets: ['seymour-flux', 'mortiorchis'] },
    { command: { kind: 'item', id: 'potion', targets: [] }, label: 'Potion', category: 'item', mpCost: 0, rank: 4, enabled: true, validTargets: ['tidus', 'yuna', 'auron'] },
    { command: { kind: 'defend', targets: [] }, label: 'Defend', category: 'special', mpCost: 0, enabled: true, validTargets: [] },
    { command: { kind: 'switch', targets: [], extra: { outId: 'tidus', inId: 'wakka' } }, label: 'Switch', category: 'special', mpCost: 0, enabled: true, validTargets: [] },
  ];
}

export function makeFakePartyBuild(): FFXPartyBuild {
  const members = makeFakeParty();
  return {
    game: 'ffx',
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      spriteKey: m.spriteKey,
      portraitKey: m.portraitKey ?? m.id,
      stats: m.stats,
      hp: m.hp,
      mp: m.mp,
      learnedAbilityIds: m.learnedAbilityIds,
      equipment: m.equipment ?? {
        weapon: { name: `${m.name}'s Blade`, slots: 2, autoAbilities: ['sensor', 'strength-3'] },
        armor: { name: `${m.name}'s Armor`, slots: 2, autoAbilities: ['defense-3'] },
      },
      overdrive: {
        gauge: m.overdrive?.gauge ?? 0,
        mode: m.overdrive?.mode ?? 'stoic',
        unlockedModes: m.overdrive?.unlockedModes ?? ['stoic'],
        unlockedOverdriveIds: m.overdrive?.unlockedOverdriveIds ?? [],
      },
      sphereGrid: { position: '0', activatedNodeIds: ['0', '2', '3', '4'], sLv: 22, ap: 340, spheres: { 'power-sphere': 3 } },
    })),
    activeSlots: ['tidus', 'yuna', 'auron'],
    reserve: [],
    aeons: [],
    inventory: [
      { itemId: 'potion', count: 15 },
      { itemId: 'hi-potion', count: 6 },
      { itemId: 'phoenix-down', count: 4 },
      { itemId: 'holy-water', count: 2 },
    ],
    gil: 12500,
    sphereInventory: { 'power-sphere': 3, 'mana-sphere': 2 },
  };
}

/** A minimal but well-typed `BattleState` for `sync()` in the demo screen and tests. */
export function makeFakeBattleState(): BattleState {
  const combatants = makeFakeCombatants();
  return {
    game: 'ffx',
    combatants,
    activeIds: ['tidus', 'yuna', 'auron'],
    reserveIds: [],
    enemyIds: ['seymour-flux', 'mortiorchis'],
    aeonId: null,
    turn: 3,
    ticks: 480,
    log: [{ seq: 0, type: 'turn-start', actorId: 'tidus', turn: 3, elapsedTicks: 12 }],
    nextSeq: 1,
    triggers: [],
    firedTriggerIds: [],
    result: null,
    seed: 1,
    flags: {},
  };
}
