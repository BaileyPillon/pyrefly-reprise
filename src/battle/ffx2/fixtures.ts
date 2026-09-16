/**
 * Deterministic fixtures for the FFX-2 engine's own tests and for the debug API.
 *
 * This is **not** encounter data. `src/data/ffx2/**` owns the real builds and
 * enemy groups; these are minimal, self-contained stand-ins so a unit test can
 * exercise the engine without waiting on the data agent, and so
 * `window.__pyrefly` can spin up a battle to poke at.
 *
 * Every number here is either the research's own (Bahamut's Lv 20 / HP 8 400 /
 * Def 160 / MDef 10 block, verbatim from [ffx2-bahamut §1.1]) or a deliberately
 * round placeholder.
 */

import type {
  BattleSetup,
  Command,
  EnemyDef,
  EnemyGroupDef,
  FFX2MemberBuild,
  FFX2PartyBuild,
  StatBlock,
} from '../common/types.ts';
import type { AiContext, EventDraft, Ffx2Unit } from './internal.ts';
import { SeededRng } from '../common/rng.ts';
import { aiScriptFor } from './ai/index.ts';
import { defaultAbilities } from './abilities.ts';

/** A girl at a given level in a given dressphere. Stats are derived, not passed. */
export function member(
  id: string,
  name: string,
  dressphere: string,
  level: number,
  gridId = 'first-steps',
  owned: string[] = [dressphere],
): FFX2MemberBuild {
  return {
    id,
    name,
    spriteKey: `${id}-${dressphere}`,
    portraitKey: `${id}-face`,
    level,
    currentDressphere: dressphere,
    owned,
    garmentGrid: { id: gridId, nodePosition: 0, passedGates: [], wornThisBattle: [] },
    abilitiesLearned: {},
    accessories: [],
  };
}

/** The canonical Chapter 2 trio: Gunner / Thief / Warrior at Lv 24. §4.2 */
export function bevelleParty(level = 24, gridId = 'first-steps'): FFX2PartyBuild {
  return {
    game: 'ffx2',
    members: [
      member('yuna', 'Yuna', 'gunner', level, gridId, ['gunner', 'warrior', 'white-mage']),
      member('rikku', 'Rikku', 'thief', level, gridId, ['thief', 'alchemist']),
      member('paine', 'Paine', 'warrior', level, gridId, ['warrior', 'black-mage']),
    ],
    inventory: [],
    gil: 0,
  };
}

function enemyStats(partial: Partial<StatBlock>): StatBlock {
  return {
    hp: 100,
    mp: 0,
    str: 1,
    def: 0,
    mag: 1,
    mdef: 0,
    agi: 50,
    luck: 1,
    eva: 0,
    acc: 0,
    maxHp: 100,
    maxMp: 0,
    ...partial,
  };
}

/** Build a one-off enemy. */
export function enemy(
  id: string,
  name: string,
  aiScriptId: string,
  stats: Partial<StatBlock>,
  extra: Partial<EnemyDef> = {},
): EnemyDef {
  const full = enemyStats(stats);
  return {
    id,
    name,
    spriteKey: id,
    slot: 0,
    stats: full,
    hp: full.maxHp,
    mp: full.maxMp,
    affinities: {},
    immunities: {},
    immunityFlags: ['boss'],
    forms: [{ name, spriteKey: id, hp: full.maxHp }],
    aiScriptId,
    rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0, drops: [], exp: 0 },
    abilityIds: [],
    flags: { isBoss: true },
    level: 20,
    thinkingPeriod: 0,
    ...extra,
  };
}

/** Bahamut exactly as [ffx2-bahamut §1.1] prints him. */
export function bahamutEnemy(): EnemyDef {
  return enemy(
    'bahamut',
    'Bahamut',
    'ffx2-bahamut',
    {
      hp: 8400,
      mp: 9999,
      str: 71,
      def: 160,
      mag: 86,
      mdef: 10,
      agi: 86,
      luck: 3,
      eva: 0,
      acc: 0,
      maxHp: 8400,
      maxMp: 9999,
    },
    {
      level: 20,
      // All five damage elements neutral: Holy is NOT a weakness. Gravity immune.
      affinities: { gravity: 'immune' },
      rewards: { ap: 15, apOverkill: 15, gil: 1000, overkillThreshold: 0, exp: 1300, drops: [] },
    },
  );
}

/** A formation wrapper. */
export function group(id: string, enemies: EnemyDef[], extra: Partial<EnemyGroupDef> = {}): EnemyGroupDef {
  return { id, game: 'ffx2', canEscape: false, enemies, ...extra };
}

/** A complete, deterministic `BattleSetup`. */
export function setup(
  enemies: EnemyGroupDef,
  options: { seed?: number; level?: number; gridId?: string } = {},
): BattleSetup {
  return {
    game: 'ffx2',
    party: bevelleParty(options.level ?? 24, options.gridId ?? 'first-steps'),
    enemies,
    triggers: [],
    seed: options.seed ?? 1,
    // `'scripted'` starts every bar at exactly 0 so tick maths in a test is
    // arithmetic, not a race against the opening randomised fill. §1.6
    condition: 'scripted',
    canEscape: false,
  };
}

/** The Chapter 4 fixture: the Lv 24 trio against Bahamut. */
export function bahamutSetup(seed = 1): BattleSetup {
  return setup(group('ffx2-bahamut', [bahamutEnemy()]), { seed });
}

// ---------------------------------------------------------------------------
// AI harness
// ---------------------------------------------------------------------------

/** A bare combatant, for driving one AI script without a whole battle. */
export function aiUnit(id: string, side: 'party' | 'enemy', maxHp = 1000, slot = 0): Ffx2Unit {
  return {
    id,
    name: id,
    side,
    spriteKey: id,
    stats: {
      hp: maxHp, mp: 999, str: 50, def: 30, mag: 40, mdef: 30,
      agi: 40, luck: 3, eva: 0, acc: 0, maxHp, maxMp: 999,
    },
    hp: maxHp,
    mp: 999,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: side === 'party' ? 'player' : 'ai',
    alive: true,
    removed: false,
    slot,
    flags: {},
    level: 48,
    atb: { ticks: 0, required: 10000, gauge: 0, charging: null, recovery: 0 },
    accessories: [],
    chainCount: 0,
    chainWindowTicks: 0,
    aiMemory: {},
  };
}

/** A driven AI script plus everything a test wants to inspect afterwards. */
export interface AiHarness {
  ctx: AiContext;
  emitted: EventDraft[];
  flags: Record<string, number | string | boolean>;
  /** Run `times` turns and return the ability id chosen each turn (`null` = flavour). */
  run(times: number): Array<string | null>;
}

/**
 * Drive one AI script in isolation.
 *
 * Boss scripts are the part of the engine most worth testing directly: the
 * research publishes them as fixed tables, so a test that walks the table is a
 * transcription check rather than a behavioural guess.
 */
export function aiHarness(
  self: Ffx2Unit,
  others: Ffx2Unit[] = [],
  scriptId = self.id,
  seed = 5,
): AiHarness {
  const party = [
    aiUnit('yuna', 'party'),
    aiUnit('rikku', 'party', 1000, 1),
    aiUnit('paine', 'party', 1000, 2),
  ];
  const emitted: EventDraft[] = [];
  const flags: Record<string, number | string | boolean> = {};
  const units = [self, ...others, ...party];
  const ctx: AiContext = {
    self,
    units,
    rng: new SeededRng(seed),
    flags,
    ticks: 0,
    ability: (id) => defaultAbilities.get(id),
    party: () => party.filter((p) => p.alive),
    allies: () => [self, ...others].filter((u) => u.alive && u.id !== self.id),
    emit: (e) => emitted.push(e),
  };
  const script = aiScriptFor(scriptId);
  return {
    ctx,
    emitted,
    flags,
    run(times: number) {
      const out: Array<string | null> = [];
      for (let i = 0; i < times; i++) {
        const command: Command | null = script.decide(ctx);
        out.push(command && 'id' in command ? command.id : null);
      }
      return out;
    },
  };
}

