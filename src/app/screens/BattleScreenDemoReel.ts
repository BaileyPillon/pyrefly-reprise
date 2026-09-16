/**
 * A canned battle, for when the real engine has not landed yet.
 *
 * This is **not** an engine and holds no rules: it is a hand-written
 * `BattleEvent[]` plus the synthetic `BattleState` needed to stage the actors,
 * fed straight to `BattlePresenter.play()`. It exists so the presenter, the
 * painted stage, the HUD and the screenshot pipeline are all exercisable today,
 * and so `docs/screenshots` has a real battle frame in it rather than a mock.
 *
 * The moment `src/battle/ffx` compiles, `BattleScreen` picks the real engine up
 * and never touches this file.
 */

import type {
  BattleEvent,
  BattleState,
  FFXCombatant,
  StatBlock,
} from '../../battle/common/types.ts';

function stats(over: Partial<StatBlock> = {}): StatBlock {
  return {
    hp: 1000,
    mp: 100,
    str: 24,
    def: 20,
    mag: 20,
    mdef: 20,
    agi: 20,
    luck: 18,
    eva: 10,
    acc: 20,
    maxHp: 1000,
    maxMp: 100,
    ...over,
  };
}

function member(id: string, name: string, slot: number): FFXCombatant {
  return {
    id,
    name,
    side: 'party',
    spriteKey: id,
    portraitKey: `${id}-face`,
    stats: stats(),
    hp: 1000,
    mp: 100,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: 'player',
    alive: true,
    removed: false,
    slot,
    flags: {},
    learnedAbilityIds: [],
    overdrive: { gauge: 30, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: [] },
  };
}

function foe(id: string, name: string, slot: number, hp: number, boss: boolean): FFXCombatant {
  return {
    id,
    name,
    side: 'enemy',
    spriteKey: id,
    stats: stats({ hp, maxHp: hp, str: 30, def: 40 }),
    hp,
    mp: 512,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: boss ? ['boss'] : [],
    controller: 'ai',
    alive: true,
    removed: false,
    slot,
    flags: { isBoss: boss },
    learnedAbilityIds: [],
    enemy: {
      aiScriptId: 'demo',
      formIndex: 0,
      forms: [{ name, spriteKey: id, hp }],
      rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: hp, drops: [] },
    },
  };
}

/** The synthetic state the stage builds actors from. */
export function demoState(): BattleState {
  const combatants: Record<string, FFXCombatant> = {
    tidus: member('tidus', 'Tidus', 0),
    yuna: member('yuna', 'Yuna', 1),
    auron: member('auron', 'Auron', 2),
    'seymour-flux': foe('seymour-flux', 'Seymour Flux', 0, 70000, true),
    mortiorchis: foe('mortiorchis', 'Mortiorchis', 1, 4000, false),
  };
  return {
    game: 'ffx',
    combatants,
    activeIds: ['tidus', 'yuna', 'auron'],
    reserveIds: [],
    enemyIds: ['seymour-flux', 'mortiorchis'],
    aeonId: null,
    turn: 1,
    ticks: 0,
    log: [],
    nextSeq: 0,
    triggers: [],
    firedTriggerIds: [],
    result: null,
    seed: 1,
    flags: {},
  };
}

/**
 * One full exchange: Tidus attacks, the servant starts counting, Seymour
 * answers, Yuna heals, and the party takes the fight.
 *
 * Every event carries a monotonic `seq`, exactly as a real engine would, so the
 * presenter's ordering and trace behave identically.
 */
export function demoReel(): BattleEvent[] {
  // `Omit` does not distribute over a union on its own, so spell it out —
  // otherwise every event collapses to the union's common keys.
  type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;
  const e = (event: Unsequenced<BattleEvent>): Unsequenced<BattleEvent> => event;

  const reel: Array<Unsequenced<BattleEvent>> = [
    e({ type: 'message', text: 'Seymour Flux blocks the trail', kind: 'system' }),
    e({ type: 'camera', rig: 'enemy', ms: 900 }),
    e({ type: 'wait', ms: 500 }),
    e({ type: 'camera', rig: 'idle', ms: 700 }),

    e({ type: 'turn-start', actorId: 'tidus', turn: 1, elapsedTicks: 0 }),
    e({
      type: 'action-start',
      actorId: 'tidus',
      command: { kind: 'attack', targets: ['seymour-flux'] },
      abilityName: 'Attack',
      targets: ['seymour-flux'],
    }),
    e({ type: 'vfx', key: 'slash', at: 'seymour-flux' }),
    e({
      type: 'damage',
      targetId: 'seymour-flux',
      sourceId: 'tidus',
      amount: 1846,
      element: 'none',
      crit: false,
      hitIndex: 0,
      hitCount: 1,
    }),
    e({ type: 'action-end', actorId: 'tidus' }),

    e({ type: 'turn-start', actorId: 'mortiorchis', turn: 2, elapsedTicks: 12 }),
    e({ type: 'charge', enemyId: 'mortiorchis', name: 'Auto-Attack Mode', turnsLeft: 2, stage: 1 }),
    e({ type: 'action-end', actorId: 'mortiorchis' }),

    e({ type: 'turn-start', actorId: 'auron', turn: 3, elapsedTicks: 11 }),
    e({
      type: 'action-start',
      actorId: 'auron',
      command: { kind: 'ability', id: 'power-break', targets: ['seymour-flux'] },
      abilityName: 'Power Break',
      targets: ['seymour-flux'],
    }),
    e({
      type: 'damage',
      targetId: 'seymour-flux',
      sourceId: 'auron',
      amount: 2410,
      element: 'none',
      crit: true,
      hitIndex: 0,
      hitCount: 1,
    }),
    e({
      type: 'status-add',
      targetId: 'seymour-flux',
      sourceId: 'auron',
      status: 'power-break',
      instance: {
        id: 'power-break',
        turnsRemaining: 254,
        ticksRemaining: null,
        charges: null,
        stacks: 0,
        permanent: false,
      },
    }),
    e({ type: 'action-end', actorId: 'auron' }),

    e({ type: 'turn-start', actorId: 'seymour-flux', turn: 4, elapsedTicks: 10 }),
    e({
      type: 'action-start',
      actorId: 'seymour-flux',
      command: { kind: 'ability', id: 'lance-of-atrophy', targets: ['tidus'] },
      abilityName: 'Lance of Atrophy',
      targets: ['tidus'],
    }),
    e({ type: 'vfx', key: 'dark', at: 'tidus' }),
    e({
      type: 'damage',
      targetId: 'tidus',
      sourceId: 'seymour-flux',
      amount: 780,
      element: 'none',
      crit: false,
      hitIndex: 0,
      hitCount: 1,
    }),
    e({ type: 'action-end', actorId: 'seymour-flux' }),

    e({ type: 'turn-start', actorId: 'yuna', turn: 5, elapsedTicks: 9 }),
    e({
      type: 'action-start',
      actorId: 'yuna',
      command: { kind: 'ability', id: 'cura', targets: ['tidus'] },
      abilityName: 'Cura',
      targets: ['tidus'],
    }),
    e({ type: 'vfx', key: 'cure', at: 'tidus' }),
    e({
      type: 'damage',
      targetId: 'tidus',
      sourceId: 'yuna',
      amount: -1240,
      element: 'none',
      crit: false,
      hitIndex: 0,
      hitCount: 1,
    }),
    e({ type: 'action-end', actorId: 'yuna' }),

    e({ type: 'camera', rig: 'action', ms: 600 }),
    e({ type: 'message', text: 'The servant is counting', kind: 'telegraph' }),
    e({ type: 'charge', enemyId: 'mortiorchis', name: 'Ready to Annihilate', turnsLeft: 0, stage: 2 }),
    e({ type: 'wait', ms: 600 }),
    e({ type: 'camera', rig: 'idle', ms: 800 }),
  ];

  // `state().log[i].seq === i` holds here exactly as it does for a real engine.
  return reel.map((event, i) => ({ ...event, seq: i }) as BattleEvent);
}
