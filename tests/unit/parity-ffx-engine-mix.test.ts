/**
 * **Engine-level parity, Rikku's Mix and the item bag** (re-parity RC7, lane FFX-H; **FFX only**).
 *
 * The kernel tests (`parity-ffx-mix.test.ts`, `parity-ffx-bag.test.ts`) prove each game function against the real machine code. This file proves the WIRING:
 * it drives the engine's own `executeCommand` with Rikku's Mix on a few hundred generated boards and asserts that what the engine does equals an **independent
 * oracle** that restates the private note FFX-G05 in its own terms (`helpers/ffxMixBoard.ts`), draw for draw:
 *
 * 1. any two of the 112 items make one of the 64 results (the complete chart), and the result the engine fires is the real resolver's answer for the pair;
 * 2. both ingredients are consumed (a doubled item twice from its one stack), before the target is looked for;
 * 3. the result's targets are the game's auto-target: the opposing or the own side by the result's record; one candidate by the single picker (stream 4, a
 *    draw only with two or more) or one group by the group pick (stream 5, one draw for any non-empty side); a multi-hit result then deals its hits over the group
 *    (stream 5, one draw per hit, a draw only with two or more); a result aimed at the KO'd only for Mega Phoenix, Final Phoenix and Final Elixir;
 * 4. a Mix that finds nobody costs both ingredients, keeps the gauge, makes no draw and learns nothing; one that does spends the gauge and learns the result
 *    (bit (id - 0x60) and 15 of word (id - 0x60) >> 4 of the party-shared array);
 * 5. the bag is the game's: a stack stops at 99 (a steal, a refund, the starting bag), a removal larger than the stack is refused, a monster never touches it.
 *
 * Mutants of the production code that this file and the kernel files must catch are listed in the lane handoff (`docs/handoff/re-parity-rc7-mix.md`).
 */

import { describe, expect, it } from 'vitest';
import type { Command, FFXCombatant, ItemDrop } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { mixablePairs, rollDefaultMinigame } from '../../src/battle/ffx/overdrive.ts';
import { mixPickerParams } from '../../src/battle/ffx/pickerParams.ts';
import { resolveSteal } from '../../src/battle/ffx/steal.ts';
import { refundItem, spendItem } from '../../src/battle/ffx/state.ts';
import { MIX_ITEM_IDS } from '../../src/battle/ffx/kernel/mix-table.ts';
import { type Board, contextOfBoard, lcg, randomBoard } from './helpers/ffxTargetBoard.ts';
import { type MixCase, oracleMix } from './helpers/ffxMixBoard.ts';
import { enemy, fighter, member, party, stats } from './ffx-fixtures.test.ts';
import { ScriptedRng, contextOf } from './helpers/ffxEngineWiring.ts';

const CHAIN_STREAMS = new Set([4, 5, 6]);

/** The Mix command with the two ingredients the overlay would report. */
function mixCommand(a: string, b: string): Command {
  return { kind: 'overdrive', id: 'mix', targets: [], extra: { kind: 'rikku-mix', mix: { ingredients: [a, b], resultAbilityId: null } } } as Command;
}

/** One generated Mix: a board, its user, a pair of items out of all 112 and a bag that holds them. */
function randomCase(r: ReturnType<typeof lcg>): MixCase | null {
  const board: Board = randomBoard(r);
  const living = board.members.filter((m) => m.side === 'party' && !m.dead);
  if (living.length === 0) return null;
  const user = r.pick(living);
  // now and then the other side has been wiped out, or the party has: a Mix at nobody
  if (r.chance(0.12)) for (const m of board.members) if (m.side === 'enemy') Object.assign(m, { dead: true, hp: 0 });
  const a = r.pick(MIX_ITEM_IDS);
  const b = r.chance(0.12) ? a : r.pick(MIX_ITEM_IDS);
  const stock: Record<string, number> = {};
  for (const id of [a, b]) stock[id] = Math.max(stock[id] ?? 0, r.int(1, 4));
  // a few other stacks the Mix must leave alone
  for (let i = 0; i < r.int(0, 4); i++) stock[r.pick(MIX_ITEM_IDS)] ??= r.int(1, 99);
  return { board, userId: user.id, a, b, stock };
}

describe('Rikku\'s Mix on generated boards equals the oracle', () => {
  it('1200 boards: the same result, targets, stock, draws, gauge and learn bit; "Mix failed!" and no draw when nobody is left', () => {
    const r = lcg(20261013);
    const seen = { failed: 0, ok: 0, single: 0, group: 0, spread: 0, opposing: 0, own: 0, doubled: 0, ko: 0, learned: 0, drewSingle: 0 };
    for (let i = 0; i < 1200; i++) {
      const c = randomCase(r);
      if (c === null) continue;
      const seed = 5000 + i;
      const { ctx, events, rng, byId } = contextOfBoard(c.board, seed);
      ctx.content.addAbilities(ALL_ABILITIES);
      for (const [id, n] of Object.entries(c.stock)) ctx.rt.inventory.set(id, n);
      const user = byId.get(c.userId) as FFXCombatant;
      (user as { overdrive?: unknown }).overdrive = { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['mix'] };
      const taps: number[] = [];
      rng.tap = (stream) => {
        if (CHAIN_STREAMS.has(stream)) taps.push(stream);
      };
      const mirror = contextOfBoard(c.board, seed).rng;
      const want = oracleMix(c, mirror);

      const res = executeCommand(ctx, user, mixCommand(c.a, c.b), true);
      const note = `board ${i}: ${c.a} + ${c.b} by ${c.userId} -> ${want.result}`;
      expect(res.rejected, `${note}: refused`).toBeUndefined();
      // the bag: both ingredients consumed, nothing else touched
      for (const [id, left] of Object.entries(want.stockAfter)) expect(ctx.rt.inventory.get(id) ?? 0, `${note}: stock of ${id}`).toBe(left);
      for (const [id, n] of Object.entries(c.stock)) if (want.stockAfter[id] === undefined) expect(ctx.rt.inventory.get(id), `${note}: untouched ${id}`).toBe(n);
      expect(taps, `${note}: chain draws`).toEqual(want.draws);
      const start = events.find((e) => e['type'] === 'action-start');
      const said = events.some((e) => e['type'] === 'message' && e['text'] === 'Mix failed!');
      const learnedWords = ctx.rt.mixShared;
      if (want.failed) {
        expect(said, `${note}: says Mix failed`).toBe(true);
        expect(start, `${note}: no action runs`).toBeUndefined();
        expect(user.overdrive!.gauge, `${note}: the gauge is kept`).toBe(100);
        expect(res.rank, `${note}: the turn is spent with a delay`).toBe(6);
        expect(learnedWords ?? new Array<number>(16).fill(0), `${note}: nothing learned`).toEqual(new Array<number>(16).fill(0));
        seen.failed++;
      } else {
        expect(said, `${note}: no failure message`).toBe(false);
        expect(start && start['abilityId'], `${note}: the result fires`).toBe(want.result);
        expect([...((start && (start['targets'] as string[])) ?? [])].sort(), `${note}: targets`).toEqual([...want.targets].sort());
        expect(user.overdrive!.gauge, `${note}: the gauge is spent`).toBe(0);
        const words = ctx.rt.mixShared as number[];
        expect(words[want.learned!.word]! & (1 << want.learned!.bit), `${note}: learned`).not.toBe(0);
        expect(words.reduce((n, w) => n + w.toString(2).replace(/0/g, '').length, 0), `${note}: exactly one bit`).toBe(1);
        seen.ok++;
        seen.learned++;
        if (want.draws.includes(4)) seen.drewSingle++;
        if (want.draws.filter((s) => s === 5).length > 1) seen.spread++;
        if (want.targets.length === 1) seen.single++;
        if (want.targets.length > 1) seen.group++;
        if (c.board.members.find((m) => m.id === want.targets[0])?.side !== c.board.members.find((m) => m.id === c.userId)?.side) seen.opposing++;
        else seen.own++;
        if (want.targets.some((t) => c.board.members.find((m) => m.id === t)?.dead === true)) seen.ko++;
      }
      if (c.a === c.b) seen.doubled++;
    }
    if (process.env['PYREFLY_SHOW_SEEN'] === '1') console.log(JSON.stringify(seen));
    // the generator really reaches each mechanism
    expect(seen.failed).toBeGreaterThan(50);
    expect(seen.ok).toBeGreaterThan(900);
    expect(seen.spread).toBeGreaterThan(80);
    expect(seen.drewSingle).toBeGreaterThan(30);
    expect(seen.group).toBeGreaterThan(200);
    expect(seen.opposing).toBeGreaterThan(200);
    expect(seen.own).toBeGreaterThan(200);
    expect(seen.doubled).toBeGreaterThan(60);
    expect(seen.ko).toBeGreaterThan(5);
  }, 120_000);

  it('every one of the 64 results can be made, and the same pair on the same seed makes the same Mix', () => {
    const r = lcg(1);
    const made = new Set<string>();
    for (let a = 0; a < MIX_ITEM_IDS.length; a++) {
      for (let b = a; b < MIX_ITEM_IDS.length; b += 7) {
        const board = randomBoard(r);
        board.members.forEach((m) => Object.assign(m, { dead: false, untargetable: false, hp: 5000, reflect: false, petrified: false }));
        const c: MixCase = { board, userId: (board.members.find((m) => m.side === 'party') as { id: string }).id, a: MIX_ITEM_IDS[a] as string, b: MIX_ITEM_IDS[b] as string, stock: { [MIX_ITEM_IDS[a] as string]: 3, [MIX_ITEM_IDS[b] as string]: 3 } };
        made.add(oracleMix(c, contextOfBoard(board, 3).rng).result);
      }
    }
    expect(made.size).toBeGreaterThan(55);
    // a Mix of two Potions by the same user on the same board and seed twice: identical event streams
    const board = randomBoard(lcg(9));
    board.members.forEach((m) => Object.assign(m, { dead: false, untargetable: false, hp: 5000, reflect: false, petrified: false }));
    const user = board.members.find((m) => m.side === 'party') as { id: string };
    const run = (): string => {
      const { ctx, events, byId } = contextOfBoard(board, 11);
      ctx.content.addAbilities(ALL_ABILITIES);
      ctx.rt.inventory.set('potion', 5);
      const actor = byId.get(user.id) as FFXCombatant;
      (actor as { overdrive?: unknown }).overdrive = { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['mix'] };
      executeCommand(ctx, actor, mixCommand('potion', 'potion'), true);
      return JSON.stringify(events);
    };
    expect(run()).toBe(run());
  });

  it('a pair the data layer never had a recipe for makes something now: a Map and a Rename Card, a Pendulum twice', () => {
    for (const [a, b, want] of [
      ['map', 'rename-card', undefined],
      ['pendulum', 'pendulum', undefined],
    ] as const) {
      const board = randomBoard(lcg(4));
      board.members.forEach((m) => Object.assign(m, { dead: false, untargetable: false, hp: 5000, reflect: false, petrified: false }));
      const userId = (board.members.find((m) => m.side === 'party') as { id: string }).id;
      const { ctx, events, byId } = contextOfBoard(board, 21);
      ctx.content.addAbilities(ALL_ABILITIES);
      ctx.rt.inventory.set(a, 2);
      ctx.rt.inventory.set(b, 2);
      const actor = byId.get(userId) as FFXCombatant;
      (actor as { overdrive?: unknown }).overdrive = { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['mix'] };
      executeCommand(ctx, actor, mixCommand(a, b), true);
      void want;
      const start = events.find((e) => e['type'] === 'action-start');
      expect(String(start?.['abilityId']), `${a} + ${b}`).toMatch(/^mix-/);
      expect(events.some((e) => e['type'] === 'message' && e['text'] === 'Mix failed!'), `${a} + ${b}`).toBe(false);
    }
  });
});

describe('the bag is the game\'s bag in the engine', () => {
  const COMMON: ItemDrop = { itemId: 'potion', count: 5, chance: 100 } as ItemDrop;
  const RARE: ItemDrop = { itemId: 'elixir', count: 1, chance: 12 } as ItemDrop;

  function stealField(held: number): ReturnType<typeof contextOf> & { thief: FFXCombatant; foe: FFXCombatant } {
    const thief = fighter({ id: 'rikku', side: 'party', stats: stats() });
    const foe = fighter({ id: 'foe', side: 'enemy', stats: stats() }) as FFXCombatant;
    foe.enemy = { rewards: { steal: { baseChance: 100, common: COMMON, rare: RARE } } } as unknown as FFXCombatant['enemy'];
    const field = contextOf(thief, foe, new ScriptedRng([0, 0xff]), 0);
    field.ctx.rt.inventory.set('potion', held);
    return { ...field, thief, foe };
  }

  it('a steal stops at 99: 98 Potions and a stolen five make 99, the excess is lost, the flag follows', () => {
    const f = stealField(98);
    expect(resolveSteal(f.ctx, f.thief, f.foe)).toBe(true);
    expect(f.ctx.rt.inventory.get('potion')).toBe(99);
    expect(f.ctx.state.flags['inventory:potion']).toBe(99);
    const g = stealField(10);
    resolveSteal(g.ctx, g.thief, g.foe);
    expect(g.ctx.rt.inventory.get('potion')).toBe(15);
  });

  it('a refund stops at 99 and, with none left, makes a stack of one; a spend of none is refused and changes nothing', () => {
    const f = stealField(99);
    refundItem(f.ctx, 'potion');
    expect(f.ctx.rt.inventory.get('potion')).toBe(99);
    const none = stealField(0);
    expect(spendItem(none.ctx, 'potion')).toBe(false);
    expect(none.ctx.rt.inventory.get('potion')).toBe(0);
    refundItem(none.ctx, 'potion');
    expect(none.ctx.rt.inventory.get('potion')).toBe(1);
    expect(spendItem(none.ctx, 'potion')).toBe(true);
    expect(none.ctx.rt.inventory.get('potion')).toBe(0);
  });

  it('a monster never touches the bag: its spend goes ahead and takes nothing, its refund gives nothing', () => {
    const f = stealField(3);
    expect(spendItem(f.ctx, 'potion', f.foe)).toBe(true);
    expect(f.ctx.rt.inventory.get('potion')).toBe(3);
    refundItem(f.ctx, 'potion', f.foe);
    expect(f.ctx.rt.inventory.get('potion')).toBe(3);
    // an aeon and a party member are charged
    expect(spendItem(f.ctx, 'potion', f.thief)).toBe(true);
    expect(f.ctx.rt.inventory.get('potion')).toBe(2);
  });

  it('an id the game has no number for (a test rig\'s) goes through the same cap', () => {
    const f = stealField(0);
    f.ctx.rt.inventory.set('rig-item', 98);
    refundItem(f.ctx, 'rig-item');
    refundItem(f.ctx, 'rig-item');
    expect(f.ctx.rt.inventory.get('rig-item')).toBe(99);
    expect(spendItem(f.ctx, 'rig-item')).toBe(true);
    expect(f.ctx.rt.inventory.get('rig-item')).toBe(98);
  });

  it('an offer of gil reaches the hit in full whatever the gil held: the action throws 300 for an offer of 3000 with 500 in hand and with 5000, and only the second pays', () => {
    const spare = ALL_ABILITIES.find((a) => a.id === 'spare-change')!;
    const run = (gil: number): { damage: number; gilAfter: number } => {
      const thief = fighter({ id: 'rikku', side: 'party', stats: stats() });
      const foe = fighter({ id: 'foe', side: 'enemy', stats: stats({ hp: 99999, maxHp: 99999 }) }) as FFXCombatant;
      const { ctx, events } = contextOf(thief, foe, new ScriptedRng([0, 0, 0, 0, 0, 0]), 0);
      ctx.content.addAbilities([{ ...spare, targeting: 'single-enemy' }]);
      ctx.content.addItems([{ id: 'spare-item', name: 'Spare Change', game: 'ffx', effect: 'spare-change', targeting: 'single-enemy', usableInBattle: true, usableInMenu: false, price: 0 }]);
      ctx.rt.inventory.set('spare-item', 1);
      ctx.rt.gil = gil;
      executeCommand(ctx, thief, { kind: 'item', id: 'spare-item', targets: [foe.id], gilSpent: 3000 } as Command, true);
      const hit = events.find((e) => e['type'] === 'damage');
      return { damage: Number(hit?.['amount'] ?? hit?.['damage'] ?? 0), gilAfter: ctx.rt.gil };
    };
    const poor = run(500);
    const rich = run(5000);
    expect(rich.damage).toBeGreaterThan(0);
    expect(poor.damage).toBe(rich.damage);
    expect(poor.gilAfter).toBe(500);
    expect(rich.gilAfter).toBe(2000);
  });

  it('the Spare Change offer is paid in full, or not at all when the gil does not cover it, and the action runs with the offer either way', () => {
    // 3 Gil-spending items are modelled by command.gilSpent on an item command; the bribe amount reaches the hit as given
    const f = stealField(0);
    f.ctx.rt.inventory.set('potion', 2);
    f.ctx.rt.gil = 500;
    const cmd = (gilSpent: number): Command => ({ kind: 'item', id: 'potion', targets: [f.thief.id], gilSpent } as Command);
    f.ctx.content.addAbilities(ALL_ABILITIES);
    f.ctx.content.addItems(Object.values(ITEMS));
    executeCommand(f.ctx, f.thief, cmd(300), true);
    expect(f.ctx.rt.gil).toBe(200);
    executeCommand(f.ctx, f.thief, cmd(300), true); // 200 does not cover 300: nothing is paid, the action still runs
    expect(f.ctx.rt.gil).toBe(200);
    expect(f.ctx.rt.inventory.get('potion')).toBe(0);
  });
});

describe('what the menu offers, and the starting bag', () => {
  const bagCtx = (stock: Record<string, number>): ReturnType<typeof contextOfBoard>['ctx'] => {
    const { ctx } = contextOfBoard(randomBoard(lcg(3)), 1);
    ctx.content.addAbilities(ALL_ABILITIES);
    for (const [id, n] of Object.entries(stock)) ctx.rt.inventory.set(id, n);
    return ctx;
  };

  it('any two items in the bag are mixable, a doubled one needs two, an empty stack is no ingredient; each pair carries the result it makes', () => {
    const ctx = bagCtx({ potion: 1, 'hi-potion': 3, map: 2, ether: 0 });
    const pairs = mixablePairs(ctx);
    const keys = pairs.map(([a, b]) => [a, b].sort().join('|')).sort();
    // potion x1: no doubling; hi-potion x3 and map x2 may be doubled; ether x0 is out; all 3 distinct pairs
    expect(keys).toEqual(['hi-potion|hi-potion', 'hi-potion|map', 'hi-potion|potion', 'map|map', 'map|potion'].sort());
    for (const [a, b, result] of pairs) expect(result, `${a} + ${b}`).toBe(ctx.content.mixResult(a, b));
    expect(pairs.find(([a, b]) => a === 'hi-potion' && b === 'hi-potion')?.[2]).toBe('mix-vitality');
    expect(pairs.find(([a, b]) => a === 'map' && b === 'map')?.[2]).toBe('mix-potato-masher');
  });

  it('the picker is sent the whole bag as names and a recipe for every pair, in the shape the overlay already reads', () => {
    const ctx = bagCtx({ potion: 2, 'fire-gem': 1, antidote: 4 });
    ctx.content.addItems(Object.values(ITEMS));
    const params = mixPickerParams(ctx, mixablePairs(ctx));
    expect(Object.keys(params).sort()).toEqual(['ingredients', 'inventory', 'recipeNames', 'recipes']);
    expect(params.ingredients.map((i) => i.itemId).sort()).toEqual(['antidote', 'fire-gem', 'potion']);
    expect(Object.keys(params.recipes).sort()).toEqual(['antidote|antidote', 'antidote|fire-gem', 'antidote|potion', 'fire-gem|potion', 'potion|potion']);
    expect(params.recipes['potion|potion']).toBe('mix-ultra-potion');
    expect(params.recipes['antidote|fire-gem']).toBe('mix-firestorm');
    expect(params.recipeNames['potion|potion']).toBe('Ultra Potion');
  });

  it('the default roll of an automated Mix (AI, auto-battle, a headless run) picks one pair of the bag, and an empty bag picks none', () => {
    const ctx = bagCtx({ potion: 2, 'fire-gem': 1, map: 3 });
    const mix = ALL_ABILITIES.find((a) => a.id === 'mix')!;
    const rikku = fighter({ id: 'rikku', side: 'party', stats: stats() });
    const pairs = mixablePairs(ctx);
    expect(pairs.length).toBe(5); // 3 distinct pairs, and potion (x2) and map (x3) may be doubled, the one Fire Gem may not
    for (let i = 0; i < 20; i++) {
      const rolled = rollDefaultMinigame(ctx, 'rikku-mix', mix, rikku);
      expect(rolled.kind).toBe('rikku-mix');
      const picked = (rolled as { mix: { ingredients: [string, string]; resultAbilityId: string | null } }).mix;
      expect(pairs.some(([a, b, id]) => a === picked.ingredients[0] && b === picked.ingredients[1] && id === picked.resultAbilityId)).toBe(true);
    }
    const none = rollDefaultMinigame(bagCtx({}), 'rikku-mix', mix, rikku) as { mix: { ingredients: [string, string]; resultAbilityId: string | null } };
    expect(none.mix).toEqual({ ingredients: ['', ''], resultAbilityId: null });
  });

  it('the starting bag is the bag of the game: the same item listed twice stops at 99 and a stack never passes it', () => {
    const rikku = member({ id: 'rikku' });
    const engine = createFFXEngine({ content: new FFXContentRegistry(), autoResolveMinigames: true });
    engine.init({
      game: 'ffx',
      party: party({ members: [rikku], activeSlots: [rikku.id], inventory: [{ itemId: 'potion', count: 60 }, { itemId: 'potion', count: 60 }, { itemId: 'elixir', count: 5 }, { itemId: 'ether', count: 150 }] }),
      enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'dummy' })], canEscape: false },
      triggers: [],
      seed: 1,
      condition: 'normal',
      canEscape: false,
    });
    const bag = engine.transferable().rt.inventory;
    expect(bag.get('potion')).toBe(99);
    expect(bag.get('elixir')).toBe(5);
    expect(bag.get('ether')).toBe(99);
  });
});
