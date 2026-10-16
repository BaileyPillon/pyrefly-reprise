/**
 * **Engine-level parity, kill rewards, whole battles** (re-parity RC9, lane FFX-M; **FFX only**).
 *
 * `parity-ffx-engine-loot.test.ts` proves `payKill` on built contexts. This file runs the REAL engine, whole battles and whole formations, and reads what the player's results hold, against the same
 * independent oracle (`helpers/ffxLootOracle.ts`: the routine restated from `FFX-H02` 3.5 and `FFX-G10` 3.4, fed the draws the generator really made, each with its stream):
 *
 * 1. **Battles with hand-set thresholds and real records** (Guardians, Seymour, Omnis, Natus, a Ronso): the engine kills them with real attacks; `result.gil`, `result.ap`, `result.drops`, `result.overkilled`
 *    and every member's Sphere Levels (from his own AP total, with Double, Triple and No AP and Gillionaire worn) equal the oracle's.
 * 2. **All 24 shipped formations**: every enemy and part is killed in the engine, and the result pays exactly the sum of the monsters' records (read from the independent table, with the Gui parts'
 *    script writes), the draws are the routine's and only on streams 10 and 11, and a monster whose record is all zeros still draws its three.
 * 3. **A Distiller** used on a monster (the real item, the real status step) turns the dying monster's drop into the matching sphere.
 * 4. **The same seed pays the same.**
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BattleResult, Command, Decision, EnemyGroupDef, FFXCombatant, FfxLootRecord } from '../../src/battle/common/types.ts';
import { GameStreams } from '../../src/battle/common/streams.ts';
import { FFXContentRegistry, FFXEngine, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { MIX_ITEM_IDS } from '../../src/battle/ffx/kernel/mix-table.ts';
import { koActor } from '../../src/battle/ffx/hp.ts';
import { buildBattleResult } from '../../src/battle/ffx/results.ts';
import type { Ctx } from '../../src/battle/ffx/state.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { lootRewards } from '../../src/data/ffx/loot/index.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, getChapter, type Chapter } from '../../src/data/encounters.ts';
import { ability, enemy, member, party, setup, stats } from './ffx-fixtures.test.ts';
import { PARTY_IDS, AEON_IDS, oracleKill, slotOfId, type Draw, type Field, type Kill, type LedgerFacts, type SlotSpec, emptyLedger } from './helpers/ffxLootOracle.ts';

type PlayerInput = Extract<Decision, { kind: 'player-input' }>;

/** The independent record table (the private note FFX-H02's own parse of the same files). */
const TABLE = (JSON.parse(readFileSync(new URL('../fixtures/parity/ffx/loot_records.json', import.meta.url), 'utf8')) as { rows: Record<string, Omit<FfxLootRecord, 'file' | 'source'>> }).rows;
const recordOf = (file: number): FfxLootRecord => ({ file, source: 'fixture', ...(TABLE[String(file)] as Omit<FfxLootRecord, 'file' | 'source'>) });

const idOfNumber = (n: number): string => MIX_ITEM_IDS[n - 0x2000] as string;
const stacksAsIds = (items: ReadonlyArray<{ id: number; qty: number }>) => items.map((s) => ({ itemId: idOfNumber(s.id), count: s.qty }));

/** `min(5 (L + 1) + floor(L^3 / 50), 22000)` (FFX-G10 section 3.6, `research/ffx-combat-core.md` section 10.1), written out again. */
const apForLevel = (l: number): number => Math.min(5 * (l + 1) + Math.floor((l * l * l) / 50), 22000);
function levelsFor(banked: number): number {
  let levels = 0;
  while (banked >= apForLevel(levels) && levels < 255) {
    banked -= apForLevel(levels);
    levels += 1;
  }
  return levels;
}

const tapOf = (engine: FFXEngine): { rng: GameStreams; draws: Draw[] } => {
  const rng = (engine as unknown as { rng: GameStreams }).rng;
  const draws: Draw[] = [];
  rng.tap = (stream, value) => draws.push({ stream, value });
  return { rng, draws };
};
const ctxOf = (engine: FFXEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;

// ------------------------------------------------------------------------------------------------------------------- 1. battles

function attackContent(): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities([ability({ id: 'attack', name: 'Attack', category: 'attack', power: 1, formula: 'fixed-no-variance', damageType: 'other', targeting: 'single-enemy', canMiss: false })]);
  return reg;
}

const WORN = (...autos: string[]) => ({ weapon: { name: 'W', slots: 4, autoAbilities: autos as never }, armor: { name: 'A', slots: 1, autoAbilities: [] } });

interface Foe { id: string; file: number; threshold: number }

/** Kill `foes` in `order` with fixed 50-damage hits (each foe has 50 HP); the party wears what `autos` says. */
function fight(foes: Foe[], order: string[], autos: Record<string, string[]>, seed: number) {
  const members = ['tidus', 'yuna', 'auron', 'kimahri'].map((id) => member({ id, equipment: WORN(...(autos[id] ?? [])) }));
  const engine = createFFXEngine({ content: attackContent() });
  engine.init(setup({
    seed,
    party: party({ members, activeSlots: ['tidus', 'yuna', 'auron'], reserve: ['kimahri'] }),
    enemies: { id: 'g', game: 'ffx', enemies: foes.map((f) => enemy({ id: f.id, stats: stats({ hp: 50, maxHp: 50 }), rewards: lootRewards(f.file, { overkillThreshold: f.threshold }) })) },
  }));
  const { draws } = tapOf(engine as FFXEngine);
  const next = (): PlayerInput | null => {
    for (let i = 0; i < 200; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') return null;
      if (d.kind === 'player-input') return d;
    }
    throw new Error('no player-input decision arrived in 200 steps');
  };
  for (const target of order) {
    if (!next()) break;
    engine.submit({ kind: 'attack', targets: [target] } as Command);
  }
  while (next()) engine.submit({ kind: 'defend', targets: [] } as Command);
  const result = engine.state().result as BattleResult;
  return { result, draws, engine: engine as FFXEngine };
}

const BATTLE_FIELD = (autos: Record<string, string[]>): Field => ({
  aeonOut: false,
  slots: [...PARTY_IDS, ...AEON_IDS].map((id): SlotSpec => ({
    id, exists: ['tidus', 'yuna', 'auron', 'kimahri'].includes(id), inBattle: ['tidus', 'yuna', 'auron'].includes(id), dead: false, ejected: false, autos: (autos[id] ?? []) as never,
  })).sort((a, b) => slotOfId(a.id) - slotOfId(b.id)),
});

/** What the oracle says a fight pays: the chain over the kills in order, then the members' Sphere Levels from their own totals. */
function expectFight(foes: Foe[], order: string[], overkilled: readonly string[], autos: Record<string, string[]>, draws: readonly Draw[]) {
  const field = BATTLE_FIELD(autos);
  let ledger: LedgerFacts = emptyLedger();
  let baseAp = 0;
  let rest = draws.filter((d) => d.stream === 10 || d.stream === 11);
  expect(draws.some((d) => d.stream === 12 || d.stream === 13), 'nothing draws the gear streams').toBe(false); // the hits draw their own streams (a character's); no one steals, so 10 and 11 are the rewards'
  for (const id of order) {
    const foe = foes.find((f) => f.id === id) as Foe;
    const kill: Kill = { rec: recordOf(foe.file), overkill: overkilled.includes(id), distill: 0, bribed: undefined, killerId: 'tidus' };
    const want = oracleKill(field, kill, ledger, rest, false);
    rest = rest.slice(want.used);
    ledger = { gil: want.gil, ap: want.ap, items: want.items };
    baseAp += want.baseAp;
  }
  expect(rest, 'every reward draw belongs to a kill').toEqual([]);
  return { ledger, baseAp };
}

describe('whole battles, real records, hand-set thresholds', () => {
  const FOES: Foe[] = [
    { id: 'guardian-a', file: 141, threshold: 40 },
    { id: 'seymour', file: 124, threshold: 1000 },
    { id: 'guardian-b', file: 141, threshold: 1000 },
    { id: 'omnis', file: 131, threshold: 30 },
    { id: 'natus', file: 126, threshold: 1000 },
  ];
  const ORDER = ['guardian-a', 'seymour', 'guardian-b', 'omnis', 'natus'];

  it('150 seeds: the gil, the AP, the stacked items, the overkills and every member\'s Sphere Levels are the oracle\'s', () => {
    let sawSpecial = 0;
    let sawOmnisRare = 0;
    for (let seed = 1; seed <= 150; seed++) {
      const { result, draws } = fight(FOES, ORDER, {}, seed);
      expect(result.outcome, `seed ${seed}`).toBe('victory');
      const { ledger, baseAp } = expectFight(FOES, ORDER, result.overkilled, {}, draws);
      expect(result.gil, `seed ${seed} gil`).toBe(ledger.gil);
      expect(result.ap, `seed ${seed} ap`).toBe(baseAp);
      expect(result.drops, `seed ${seed} drops`).toEqual(stacksAsIds(ledger.items));
      expect(result.overkilled.slice().sort(), `seed ${seed}: the 50-damage hit reaches 40 and 30, not 1000`).toEqual(['guardian-a', 'omnis']);
      for (const id of Object.keys(result.sphereLevelsGained)) expect(result.sphereLevelsGained[id], `seed ${seed} ${id}`).toBe(levelsFor(ledger.ap[slotOfId(id)] as number));
      if (result.drops.some((d) => d.itemId === 'special-sphere')) sawSpecial += 1;
      if (draws.some((d) => d.stream === 11)) sawOmnisRare += 1;
    }
    expect(sawSpecial, 'Seymour\'s rare Special Sphere comes about one time in eight (150 seeds)').toBeGreaterThan(5);
    expect(sawOmnisRare).toBeGreaterThan(100);
  });

  it('Double AP, Triple AP, No AP and Gillionaire worn by the three who fight: their own totals, the doubled gil, the same headline AP', () => {
    const autos = { tidus: ['double-ap'], yuna: ['triple-ap'], auron: ['no-ap', 'gillionaire'] };
    for (let seed = 1; seed <= 40; seed++) {
      const { result, draws } = fight(FOES, ORDER, autos, seed);
      const { ledger, baseAp } = expectFight(FOES, ORDER, result.overkilled, autos, draws);
      expect(result.gil, `seed ${seed}: Auron's Gillionaire doubles every kill's gil`).toBe(ledger.gil);
      expect(result.ap, `seed ${seed}: the headline AP is what the monsters were worth`).toBe(baseAp);
      expect(ledger.ap[0], 'Double AP is twice a plain total').toBe(baseAp * 2);
      expect(ledger.ap[1], 'Triple AP is three times').toBe(baseAp * 3);
      expect(ledger.ap[2], 'No AP earns nothing').toBe(0);
      expect(ledger.ap[3], 'the reserve member earns the plain AP (he is not in the battle, so no multiplier)').toBe(baseAp);
      for (const id of Object.keys(result.sphereLevelsGained)) expect(result.sphereLevelsGained[id], `seed ${seed} ${id}`).toBe(levelsFor(ledger.ap[slotOfId(id)] as number));
    }
    const plain = fight(FOES, ORDER, {}, 3);
    const worn = fight(FOES, ORDER, autos, 3);
    expect(worn.result.gil, 'Gillionaire doubles the gil').toBe(plain.result.gil * 2);
  });

  it('a Gillionaire wearer on the bench does not double the gil: he is not in the battle', () => {
    const plain = fight(FOES, ORDER, {}, 5);
    const bench = fight(FOES, ORDER, { kimahri: ['gillionaire'] }, 5);
    expect(bench.result.gil).toBe(plain.result.gil);
  });

  it('the same seed pays the same, and a different seed rolls a different rare entry sooner or later', () => {
    const a = fight(FOES, ORDER, {}, 9).result;
    expect(fight(FOES, ORDER, {}, 9).result.drops).toEqual(a.drops);
    const kinds = new Set(Array.from({ length: 60 }, (_, i) => JSON.stringify(fight(FOES, ORDER, {}, 100 + i).result.drops)));
    expect(kinds.size).toBeGreaterThan(2);
  });
});

// ------------------------------------------------------------------------------------------------------------------- 2. every shipped formation

/**
 * A formation no chapter's chain reaches (a chapter that picks its formations by script, as the Dark Mirror chapter does on a later release line) is fought with the party of the chapter named here.
 * Empty on this base, where every formation is in a chain; a formation added without an entry fails the coverage test below and says so.
 */
const EXTRA_FORMATION_CHAPTER: Readonly<Record<string, string>> = {};

/** Every chapter of the FFX data and the formations of its chain, so each formation is fought with the party that fights it. */
function formationsWithChapter(): Array<{ chapter: Chapter; group: EnemyGroupDef }> {
  const out: Array<{ chapter: Chapter; group: EnemyGroupDef }> = [];
  const chapters = [...CHAPTERS.filter((c) => c.game === 'ffx'), ...['sinspawn-gui', 'biran-yenke'].map((id) => getChapter(id)).filter((c): c is Chapter => c !== undefined)];
  for (const chapter of chapters) {
    let group: EnemyGroupDef | undefined = chapter.enemyGroupRef;
    for (let i = 0; i < 12 && group !== undefined; i++) {
      out.push({ chapter, group });
      group = group.nextGroupId !== undefined ? ENEMY_GROUPS_BY_ID[group.nextGroupId] : undefined;
    }
  }
  for (const [groupId, chapterId] of Object.entries(EXTRA_FORMATION_CHAPTER)) {
    const chapter = getChapter(chapterId);
    const group = ENEMY_GROUPS_BY_ID[groupId];
    if (chapter !== undefined && group !== undefined) out.push({ chapter, group });
  }
  return out;
}

/** Which monster file each shipped enemy is, from the data's own tests' table (`parity-ffx-loot-data.test.ts`), restated. */
const FILE_OF: Readonly<Record<string, number>> = {
  'seymour-flux': 142, mortiorchis: 143, yunalesca: 130, 'guado-guardian-a': 141, 'guado-guardian-b': 141, 'seymour-macalania': 124, 'anima-macalania': 125, evrae: 119, cid: 149,
  yojimbo: 288, daigoro: 266, ginnem: 249, 'seymour-natus': 126, mortibody: 127, 'seymour-omnis': 131, 'mortiphasm-1': 106, 'mortiphasm-2': 106, 'mortiphasm-3': 106, 'mortiphasm-4': 106,
  isaaru: 248, grothia: 284, pterya: 254, spathi: 287, 'overdrive-sin': 140, 'left-fin': 136, 'right-fin': 137, 'sinspawn-genais': 139, 'sin-core': 138,
  'sinspawn-gui': 117, 'sinspawn-gui-2': 117, 'sinspawn-gui-head': 160, 'sinspawn-gui-arm-left': 161, 'sinspawn-gui-arm-right': 161, 'biran-ronso': 134, 'yenke-ronso': 135,
  'braskas-final-aeon': 132, 'yu-pagoda-left': 173, 'yu-pagoda-right': 174, 'yu-yevon': 176, 'possessed-valefor': 163, 'possessed-ifrit': 164, 'possessed-ixion': 165, 'possessed-shiva': 166, 'possessed-bahamut': 167,
};
const WRITES: Readonly<Record<string, Partial<FfxLootRecord>>> = {
  'sinspawn-gui': { chance: [0, 0], gearChance: 0 }, 'sinspawn-gui-2': { ap: 0, apOverkill: 0 },
  'sinspawn-gui-head': { chance: [0, 0], gearChance: 0 }, 'sinspawn-gui-arm-left': { chance: [0, 0], gearChance: 0 }, 'sinspawn-gui-arm-right': { chance: [0, 0], gearChance: 0 },
};

describe('every shipped formation: kill everything in it, and the result pays the sum of the records', () => {
  const pairs = formationsWithChapter();

  it('covers every formation of the data layer (24 on this base)', () => {
    const covered = new Set(pairs.map((p) => p.group.id));
    const missing = Object.keys(ENEMY_GROUPS_BY_ID).filter((id) => !covered.has(id));
    expect(missing, `formations no chapter's chain reaches: add each to EXTRA_FORMATION_CHAPTER with the chapter whose party fights it`).toEqual([]);
    expect(Object.keys(ENEMY_GROUPS_BY_ID).length).toBeGreaterThanOrEqual(24);
  });

  for (const overkill of [false, true]) {
    it(`${overkill ? 'every death an overkill (the overkill lists and the overkill AP)' : 'every death plain'}: gil, AP, items and the draws of each formation equal the oracle's`, async () => {
      const { registerBattleContent } = await import('../../src/app/screens/BattleScreenContent.ts');
      await registerBattleContent();
      for (const { chapter, group } of pairs) {
        const base = setupForChapter(chapter, 7);
        const engine = new FFXEngine({ autoResolveMinigames: true });
        engine.setSeed(7);
        engine.init({ ...base, enemies: group });
        const { draws } = tapOf(engine);
        const ctx = ctxOf(engine);
        const field: Field = {
          aeonOut: false,
          slots: [...PARTY_IDS, ...AEON_IDS].map((id): SlotSpec => {
            const c = ctx.state.combatants[id] as FFXCombatant | undefined;
            const autos = (c?.equipment ? [...c.equipment.weapon.autoAbilities, ...c.equipment.armor.autoAbilities] : []).filter((a) => ['double-ap', 'triple-ap', 'no-ap', 'gillionaire'].includes(a));
            return { id, exists: c !== undefined, inBattle: c !== undefined && ctx.state.activeIds.includes(id) && !c.removed, dead: false, ejected: false, autos: autos as never };
          }).sort((a, b) => slotOfId(a.id) - slotOfId(b.id)),
        };
        let ledger: LedgerFacts = emptyLedger();
        let baseAp = 0;
        const fought = [...ctx.state.enemyIds];
        for (const id of fought) {
          const e = ctx.state.combatants[id] as FFXCombatant;
          if (overkill) ctx.rt.overkilled.push(id);
          for (let guard = 0; e.alive && guard < 6; guard++) koActor(ctx, e, 'tidus');
          expect(e.alive, `${group.id}/${id} dies`).toBe(false);
        }
        expect(draws.every((d) => d.stream === 10 || d.stream === 11), `${group.id}: only streams 10 and 11`).toBe(true);
        let rest: Draw[] = draws.slice();
        for (const id of fought) {
          const file = FILE_OF[id] as number;
          expect(file, `${group.id}/${id} is in the table`).toBeDefined();
          const kill: Kill = { rec: { ...recordOf(file), ...(WRITES[id] ?? {}) }, overkill, distill: 0, bribed: undefined, killerId: 'tidus' };
          const want = oracleKill(field, kill, ledger, rest, false);
          rest = rest.slice(want.used);
          ledger = { gil: want.gil, ap: want.ap, items: want.items };
          baseAp += want.baseAp;
        }
        expect(rest, `${group.id}: every reward draw belongs to a death`).toEqual([]);
        const result = buildBattleResult(ctx, 'victory', undefined);
        expect(result.gil, `${group.id} gil`).toBe(ledger.gil);
        expect(result.ap, `${group.id} ap`).toBe(baseAp + (group.victoryBonusAp ?? 0)); // the formation-level bonus (Chapter XIV's 5,000) is paid on top, by the formation, not by a kill
        expect(result.drops, `${group.id} drops`).toEqual(stacksAsIds(ledger.items));
      }
    }, 120_000);
  }

  it('a formation of monsters that pay nothing still draws: each Yu Pagoda\'s, Mortiphasm\'s and Cid\'s death is three draws on stream 10', async () => {
    const { registerBattleContent } = await import('../../src/app/screens/BattleScreenContent.ts');
    await registerBattleContent();
    const found = pairs.find((p) => p.group.id === 'seymour-omnis');
    expect(found).toBeDefined();
    const engine = new FFXEngine({ autoResolveMinigames: true });
    engine.setSeed(3);
    engine.init({ ...setupForChapter(found!.chapter, 3), enemies: found!.group });
    const { draws } = tapOf(engine);
    const ctx = ctxOf(engine);
    for (const id of ctx.state.enemyIds.filter((e) => e.startsWith('mortiphasm'))) koActor(ctx, ctx.state.combatants[id] as FFXCombatant, 'tidus');
    expect(draws.map((d) => d.stream)).toEqual(new Array(12).fill(10));
    expect(ctx.rt.rewards!.list.gil).toBe(0);
    expect(ctx.rt.rewards!.list.items).toEqual([]);
  });
});

// ------------------------------------------------------------------------------------------------------------------- 3. a Distiller

describe('a Distiller on a monster turns its drop into a sphere', () => {
  const real = new FFXContentRegistry();
  real.addAbilities([...ALL_ABILITIES]);
  real.addItems(Object.values(ITEMS));

  function distilledFight(item: string, seed: number) {
    const engine = createFFXEngine({ content: real, autoResolveMinigames: true });
    engine.init(setup({
      seed,
      party: party({
        members: [member({ id: 'tidus' }), member({ id: 'yuna' }), member({ id: 'auron' })],
        inventory: [{ itemId: item, count: 3 }],
      }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'boss', stats: stats({ hp: 50, maxHp: 50 }), rewards: lootRewards(141, { overkillThreshold: 1000 }) })] },
    }));
    const { draws } = tapOf(engine as FFXEngine);
    let used = false;
    for (let i = 0; i < 300; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') return { result: d.result, draws, engine: engine as FFXEngine };
      if (d.kind !== 'player-input') continue;
      if (!used) {
        used = true;
        engine.submit({ kind: 'item', id: item, targets: ['boss'] } as Command);
        continue;
      }
      ctxOf(engine as FFXEngine).state.combatants['boss']!.hp = 1;
      engine.submit({ kind: 'attack', targets: ['boss'] } as Command);
    }
    throw new Error('no victory');
  }

  const SPHERE: Readonly<Record<string, [string, number]>> = {
    'power-distiller': ['power-sphere', 0x2], 'mana-distiller': ['mana-sphere', 0x4], 'speed-distiller': ['speed-sphere', 0x8], 'ability-distiller': ['ability-sphere', 0x20],
  };

  for (const [item, [sphere, bit]] of Object.entries(SPHERE)) {
    it(`${item}: the Guardian's Ability Sphere becomes a ${sphere}, the quantity stays, and the status goes with the life`, () => {
      const { result, draws, engine } = distilledFight(item, 4);
      expect(result.outcome).toBe('victory');
      // the Guardian's record: slot 1 always drops its Ability Sphere x1; the oracle replaces the item by the Distill sphere
      const field = BATTLE_FIELD({});
      const want = oracleKill(field, { rec: recordOf(141), overkill: result.overkilled.includes('boss'), distill: bit, bribed: undefined, killerId: 'tidus' }, emptyLedger(), draws.filter((d) => d.stream === 10 || d.stream === 11));
      expect(result.drops).toEqual(stacksAsIds(want.items));
      expect(result.drops.map((d) => d.itemId)).toEqual([sphere]);
      expect(ctxOf(engine).rt.actors.get('boss')!.distill, 'read and cleared by the death').toBeUndefined();
    });
  }

  it('without a Distiller the same fight pays the Ability Sphere', () => {
    const engine = createFFXEngine({ content: real, autoResolveMinigames: true });
    engine.init(setup({
      seed: 4,
      party: party(),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'boss', stats: stats({ hp: 1, maxHp: 1 }), rewards: lootRewards(141, { overkillThreshold: 1000 }) })] },
    }));
    for (let i = 0; i < 300; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        expect(d.result.drops.map((x) => x.itemId)).toEqual(['ability-sphere']);
        return;
      }
      if (d.kind === 'player-input') engine.submit({ kind: 'attack', targets: ['boss'] } as Command);
    }
    throw new Error('no victory');
  });
});
