/**
 * **The Mix picker's preview is gated** (re-parity RC7 follow-up to lane FFX-H; **FFX only**).
 *
 * The Mix lane made `mixablePairs` walk every pair of the bag through the game's complete chart, and `minigameParams` fed those pairs to the overlay, so the
 * preview named the result of every pair. The live build shows "? ? ?" for any pair outside the registered recipes (`src/data/ffx/mixes/recipes.ts`,
 * `FFXContentRegistry.mixPairs`). Whether the picker should name every pair is a screen choice that is Bailey's (RC7 handoff, section 11 decision 4;
 * AGENTS.md rule 9), so `MIX_PREVIEW_ALL_PAIRS` (`pickerParams.ts`) is off and the preview table holds only the registered recipes the bag can make.
 *
 * What this file pins:
 * 1. the switch is off in the shipped code;
 * 2. off: the preview's keys are exactly the bag's registered recipe pairs (a doubled item needing two, an empty stack no ingredient), with the registered
 *    results and names, and no other pair;
 * 3. on (the switch flipped for real, through the module the engine imports): the preview's keys are every pair of the bag, each with the chart's result;
 * 4. the switch gates the preview and nothing else: a pair the preview does not name, fired the way the overlay reports it (the two ingredients, no result),
 *    still makes the chart's result, and the AI / headless draw still reaches pairs the preview does not name.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Command, FFXCombatant } from '../../src/battle/common/types.ts';
import { ALL_ABILITIES, ITEMS, MIX_RECIPES } from '../../src/data/ffx/index.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { mixablePairs, mixPreviewPairs, minigameParams, rollDefaultMinigame } from '../../src/battle/ffx/overdrive.ts';
import { MIX_PREVIEW_ALL_PAIRS } from '../../src/battle/ffx/pickerParams.ts';
import { mixResultAbilityId } from '../../src/battle/ffx/kernel/mix.ts';
import { contextOfBoard, lcg, randomBoard } from './helpers/ffxTargetBoard.ts';

type BoardCtx = ReturnType<typeof contextOfBoard>;

const MIX = ALL_ABILITIES.find((a) => a.id === 'mix')!;

/** The overlay's answer for a Mix: the two ingredients and, for a pair its table does not name, no result (the "? ? ?" line). */
function mixCommand(a: string, b: string): Command {
  return { kind: 'overdrive', id: 'mix', targets: [], extra: { kind: 'rikku-mix', mix: { ingredients: [a, b], resultAbilityId: null } } } as Command;
}

/** A board with everyone alive and a bag, the registry as the app boots it (abilities, items, and the registered Mix recipes). */
function field(stock: Record<string, number>, seed = 3): BoardCtx & { rikku: FFXCombatant } {
  const board = randomBoard(lcg(seed));
  board.members.forEach((m) => Object.assign(m, { dead: false, untargetable: false, hp: 5000, reflect: false, petrified: false }));
  const f = contextOfBoard(board, 21);
  f.ctx.content.addAbilities(ALL_ABILITIES);
  f.ctx.content.addItems(Object.values(ITEMS));
  f.ctx.content.addMixRecipes(MIX_RECIPES);
  for (const [id, n] of Object.entries(stock)) f.ctx.rt.inventory.set(id, n);
  const rikku = (f.byId.get('rikku') ?? [...f.byId.values()].find((c) => c.side === 'party')) as FFXCombatant;
  (rikku as { overdrive?: unknown }).overdrive = { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['mix'] };
  return { ...f, rikku };
}

/** The bag: potions and hi-potions that pair in the registered table, an antidote and a map that mostly do not, an empty Ether stack, a single Fire Gem. */
const BAG: Record<string, number> = { potion: 2, 'hi-potion': 2, ether: 0, 'fire-gem': 1, antidote: 3, map: 2, 'ice-gem': 1 };

/** Restated from the data, not from the engine: the registered recipe pairs whose ingredients the bag holds. */
function registeredPairsOf(stock: Record<string, number>): string[] {
  const held = (id: string): number => stock[id] ?? 0;
  return Object.keys(MIX_RECIPES)
    .filter((key) => {
      const [a, b] = key.split('|') as [string, string];
      return a === b ? held(a) >= 2 : held(a) >= 1 && held(b) >= 1;
    })
    .sort();
}

/** Every pair the bag can make, restated from the bag: each distinct pair of non-empty stacks, a doubled one only with two in stock. */
function everyPairOf(stock: Record<string, number>): string[] {
  const ids = Object.keys(stock).filter((id) => (stock[id] ?? 0) > 0);
  const out: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i; j < ids.length; j++) {
      const a = ids[i] as string;
      const b = ids[j] as string;
      if (i === j && (stock[a] ?? 0) < 2) continue;
      out.push([a, b].sort().join('|'));
    }
  }
  return out.sort();
}

afterEach(() => {
  vi.doUnmock('../../src/battle/ffx/pickerParams.ts');
  vi.resetModules();
});

describe("the Mix picker's preview is gated by MIX_PREVIEW_ALL_PAIRS", () => {
  it('the switch is off in the shipped code', () => {
    expect(MIX_PREVIEW_ALL_PAIRS).toBe(false);
  });

  it('the bag used here separates the two cases: it holds registered pairs and pairs the registry does not name', () => {
    const registered = registeredPairsOf(BAG);
    const every = everyPairOf(BAG);
    expect(registered.length).toBeGreaterThanOrEqual(4);
    expect(every.length).toBeGreaterThan(registered.length + 8);
    expect(registered.every((k) => every.includes(k))).toBe(true);
    // the registered ones named by hand, so this file does not lean on its own helper alone
    for (const key of ['hi-potion|hi-potion', 'fire-gem|potion', 'antidote|fire-gem', 'fire-gem|ice-gem', 'map|map']) expect(registered, key).toContain(key);
    for (const key of ['antidote|potion', 'ether|potion', 'ice-gem|potion', 'antidote|antidote', 'antidote|map']) expect(registered, key).not.toContain(key);
  });

  it('off: the overlay is sent exactly the bag\'s registered recipe pairs, with the registered results and names, and no other pair', () => {
    const { ctx, rikku } = field(BAG);
    const params = minigameParams(ctx, MIX, rikku) as { recipes: Record<string, string>; recipeNames: Record<string, string> };
    expect(Object.keys(params.recipes).sort()).toEqual(registeredPairsOf(BAG));
    expect(Object.keys(params.recipeNames).sort()).toEqual(registeredPairsOf(BAG));
    for (const [key, id] of Object.entries(params.recipes)) {
      expect(id, key).toBe(MIX_RECIPES[key]);
      expect(params.recipeNames[key], key).toBe(ctx.content.ability(id)?.name);
    }
    expect(params.recipes['hi-potion|hi-potion']).toBe('mix-vitality');
    expect(params.recipeNames['hi-potion|hi-potion']).toBe('Vitality');
    // the pairs the table names but the bag cannot make are not listed: a single Fire Gem is no pair with itself, an empty stack is no ingredient
    expect(params.recipes).not.toHaveProperty('fire-gem|fire-gem');
    expect(params.recipes).not.toHaveProperty('ether|potion');
    // and the pairs only the chart names are not either: the overlay shows them as "? ? ?"
    expect(params.recipes).not.toHaveProperty('antidote|potion');
    // the bag itself is sent whole, as before
    expect(params).toHaveProperty('ingredients');
    expect((params as unknown as { ingredients: Array<{ itemId: string }> }).ingredients.map((i) => i.itemId).sort()).toEqual(['antidote', 'fire-gem', 'hi-potion', 'ice-gem', 'map', 'potion']);
  });

  it('off: the same stock counts the same way the live build counted them (a doubled item needs two, order does not matter)', () => {
    const keysOf = (stock: Record<string, number>): string[] => mixPreviewPairs(field(stock).ctx).map(([a, b]) => [a, b].sort().join('|')).sort();
    // one of each: Potion + Fire Gem and Hi-Potion + Fire Gem are registered, Potion + Hi-Potion is not
    expect(keysOf({ potion: 1, 'fire-gem': 1, 'hi-potion': 1 })).toEqual(['fire-gem|hi-potion', 'fire-gem|potion']);
    // Potion twice is registered (Ultra Potion) only with two in stock; the lone Hi-Potion pairs with nothing registered
    expect(keysOf({ potion: 2, 'hi-potion': 1 })).toEqual(['potion|potion']);
    expect(keysOf({ potion: 1, 'hi-potion': 1 })).toEqual([]);
    expect(keysOf({ 'hi-potion': 2 })).toEqual(['hi-potion|hi-potion']);
    expect(keysOf({})).toEqual([]);
  });

  it('on: every pair of the bag, each with the chart\'s result (the switch passed in, and the switch flipped in the module the engine imports)', async () => {
    const { ctx, rikku } = field(BAG);
    const direct = mixPreviewPairs(ctx, true);
    expect(direct.map(([a, b]) => [a, b].sort().join('|')).sort()).toEqual(everyPairOf(BAG));
    expect(direct).toEqual(mixablePairs(ctx));
    for (const [a, b, result] of direct) expect(result, `${a} + ${b}`).toBe(mixResultAbilityId(a, b));

    vi.resetModules();
    vi.doMock('../../src/battle/ffx/pickerParams.ts', async (importOriginal) => ({
      ...(await importOriginal<typeof import('../../src/battle/ffx/pickerParams.ts')>()),
      MIX_PREVIEW_ALL_PAIRS: true,
    }));
    const flipped = await import('../../src/battle/ffx/overdrive.ts');
    const params = flipped.minigameParams(ctx, MIX, rikku) as { recipes: Record<string, string>; recipeNames: Record<string, string> };
    expect(Object.keys(params.recipes).sort()).toEqual(everyPairOf(BAG));
    expect(params.recipes['antidote|potion']).toBe(mixResultAbilityId('antidote', 'potion'));
    expect(params.recipes['hi-potion|hi-potion']).toBe('mix-vitality');
    expect(Object.keys(params.recipeNames).sort()).toEqual(everyPairOf(BAG));
  });
});

describe('the switch gates the preview and nothing else', () => {
  it('a pair the preview does not name, reported as the overlay reports it (no result), makes the chart\'s result and costs both ingredients', () => {
    const unregistered: Array<[string, string]> = [['antidote', 'potion'], ['map', 'rename-card'], ['pendulum', 'pendulum'], ['ice-gem', 'potion']];
    for (const [a, b] of unregistered) {
      const f = field({ ...BAG, [a]: Math.max(BAG[a] ?? 0, 2), [b]: Math.max(BAG[b] ?? 0, 2) });
      const preview = minigameParams(f.ctx, MIX, f.rikku) as { recipes: Record<string, string> };
      expect(preview.recipes, `${a} + ${b} is not previewed`).not.toHaveProperty([a, b].sort().join('|'));
      const want = mixResultAbilityId(a, b);
      expect(want, `${a} + ${b}: the chart has a result`).toMatch(/^mix-/);
      const before = [a, b].map((id) => f.ctx.rt.inventory.get(id) ?? 0);
      const res = executeCommand(f.ctx, f.rikku, mixCommand(a, b), true);
      expect(res.rejected, `${a} + ${b}`).toBeUndefined();
      const start = f.events.find((e) => e['type'] === 'action-start');
      expect(start?.['abilityId'], `${a} + ${b}: the chart's result fires`).toBe(want);
      expect(f.events.some((e) => e['type'] === 'message' && e['text'] === 'Mix failed!'), `${a} + ${b}: no failure`).toBe(false);
      if (a === b) expect(f.ctx.rt.inventory.get(a), `${a} + ${b}: both ingredients`).toBe((before[0] as number) - 2);
      else {
        expect(f.ctx.rt.inventory.get(a)).toBe((before[0] as number) - 1);
        expect(f.ctx.rt.inventory.get(b)).toBe((before[1] as number) - 1);
      }
    }
  });

  it('a registered pair fires the result the registry names, which is the chart\'s answer for it', () => {
    for (const key of ['potion|potion', 'hi-potion|hi-potion', 'antidote|fire-gem']) {
      const [a, b] = key.split('|') as [string, string];
      const f = field(BAG);
      executeCommand(f.ctx, f.rikku, mixCommand(a, b), true);
      const start = f.events.find((e) => e['type'] === 'action-start');
      expect(start?.['abilityId'], key).toBe(MIX_RECIPES[key]);
      expect(mixResultAbilityId(a, b), key).toBe(MIX_RECIPES[key]);
    }
  });

  it('the AI / headless draw is still made among every pair of the bag: a bag with no registered pair previews nothing and still mixes', () => {
    const f = field({ antidote: 1, potion: 1 }); // antidote + potion is only in the chart
    const preview = minigameParams(f.ctx, MIX, f.rikku) as { recipes: Record<string, string> };
    expect(preview.recipes).toEqual({});
    expect(mixPreviewPairs(f.ctx)).toEqual([]);
    expect(mixablePairs(f.ctx).map(([a, b]) => [a, b].sort().join('|'))).toEqual(['antidote|potion']);
    const rolled = rollDefaultMinigame(f.ctx, 'rikku-mix', MIX, f.rikku) as { mix: { ingredients: [string, string]; resultAbilityId: string | null } };
    expect([...rolled.mix.ingredients].sort()).toEqual(['antidote', 'potion']);
    expect(rolled.mix.resultAbilityId).toBe(mixResultAbilityId('antidote', 'potion'));
  });
});
