/**
 * The Alchemist's Mix in the FFX-2 engine (re-parity RC9, lane X2-G; **FFX-2 only**): a Mix command that carries two items resolves by the game's recipe function to one of the 53
 * result rows, holds BOTH ingredients like any item (RC8's ledger), charges the RESULT's cast and fires the result's effect.
 *
 * The kernel is proved against the game's own function in `parity-ffx2-mix-recipe.test.ts` and the rows against the Steam table in `data-ffx2-mix-results.test.ts`; this file proves the
 * ENGINE joins them where the note says (FFX2-G06 3.8: the HUD resolves the result before it queues, the ingredients ride in the packet and are reserved like any item).
 *
 * **The oracle is independent of the code under test.** Which result a pair makes is the FIXTURE's table (what the real function answered in the harness). What each result does is
 * the row's own NUMBERS (`mix_rows.json`) read by rules a reader can check by hand: `power x 50` for a fixed hit (the note's "18-22 after the randomiser" for 20 is +-10%), `max HP x
 * power / 16` for a percent heal or a revive, the 9,999 cap, one `damage` event a hit, the side from the row's target bits. The ability that fired is found by scanning the catalog for the
 * record's id, not through the adapter's table. The enemy says nothing (a quiet script), so the only thing that moves the stock or the board is the test.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { BattleEvent, Command, Decision, FFX2PartyBuild, StatusId } from '../../src/battle/common/types.ts';
import { FFX2Engine, STEP_MS, abilityRegistryFrom, dressphereRegistryFrom, garmentGridRegistryFrom, itemRegistryFrom } from '../../src/battle/ffx2/index.ts';
import { enemy, group, setup } from '../../src/battle/ffx2/fixtures.ts';
import type { AiScript, Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { registerAiScript } from '../../src/battle/ffx2/ai/index.ts';
import { applyHpDelta } from '../../src/battle/ffx2/resolve-hp.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import { performCommand } from '../../src/battle/ffx2/execute.ts';
import { cancelCast } from '../../src/battle/ffx2/atb-engine.ts';
import { reserveIngredients, trackedStock } from '../../src/battle/ffx2/adapt/item-ledger.ts';
import { MIX_ITEM_IDS, mixPlanOf, stockShort } from '../../src/battle/ffx2/adapt/mix.ts';
import * as data from '../../src/data/ffx2/index.ts';

interface Row { flagsTarget: number; flagsMisc: number; flagsDamage: number; formula: number; power: number; hits: number; element: number; status1: Record<string, number>; status2: Record<string, number> }
const here = (name: string): string => fileURLToPath(new URL(`../fixtures/parity/ffx2/${name}`, import.meta.url));
const RECIPE = JSON.parse(readFileSync(here('mix_recipe.json'), 'utf8')) as { resultByPair: Record<string, number[]> };
const ROWS = (JSON.parse(readFileSync(here('mix_rows.json'), 'utf8')) as { rows: Record<string, Row> }).rows;

const quiet: AiScript = { id: 'zz-mix-quiet', decide: () => null };
registerAiScript(quiet);

const item = (row: number): string => MIX_ITEM_IDS[row] as string;
const POTION = item(0);
const HI_POTION = item(1);
const HERO_DRINK = item(63);
const keyOf = (id: string): string => `inventory:${id}`;
const hex = (n: number): string => `0x${n.toString(16)}`;

/** The pair of item rows the real function answers `command` for: the first in table order (an independent search of the fixture). */
function pairFor(command: number): [number, number] {
  for (const [first, answers] of Object.entries(RECIPE.resultByPair)) {
    const j = answers.indexOf(command);
    if (j >= 0) return [Number(first) - 0x2000, j];
  }
  throw new Error(`no pair makes ${hex(command)}`);
}

/** The ability of ours whose game row is `command`, found by scanning the catalog for the record's id. */
function abilityOfRow(command: number): string {
  const found = Object.values(data.ABILITIES).filter((a) => a.ffx2Record?.id === command);
  expect(found, `exactly one ability for ${hex(command)}`).toHaveLength(1);
  return (found[0] as { id: string }).id;
}

interface Board {
  engine: FFX2Engine;
  units: Record<string, Ffx2Unit>;
  flags: Record<string, unknown>;
}

/** Three girls (Rikku an Alchemist) against one monster that does nothing; the party's stock is set by the test. */
function board(stock: Record<string, number>, seed = 1, minigames = false): Board {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames,
  });
  const foe = enemy('m0', 'M0', 'zz-mix-quiet', { agi: 30, hp: 9_999_999, maxHp: 9_999_999 }, { slot: 0, immunityFlags: [], flags: {} });
  const s = setup(group('zz-mix', [foe]), { seed });
  const base = s.party as FFX2PartyBuild;
  const [yuna, rikku, paine] = base.members;
  const party: FFX2PartyBuild = { ...base, members: [yuna, { ...rikku, currentDressphere: 'alchemist', owned: ['alchemist', 'thief'] }, paine], inventory: Object.entries(stock).map(([itemId, count]) => ({ itemId, count })) };
  engine.init({ ...s, party });
  const state = engine.state();
  return { engine, units: state.combatants as Record<string, Ffx2Unit>, flags: state.flags as Record<string, unknown> };
}

type Input = Extract<Decision, { kind: 'player-input' }>;

/** Run the battle until a girl's menu opens. */
function nextMenu(engine: FFX2Engine, maxLoops = 20_000): Input {
  for (let i = 0; i < maxLoops; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'battle-over') throw new Error('the battle ended before a menu opened');
  }
  throw new Error('no menu opened');
}

const mixCommand = (a: string, b: string, targets: string[] = [], claim: string | null = null): Command => ({
  kind: 'ability',
  id: 'x2-alchemist-mix',
  targets,
  extra: { kind: 'rikku-mix', mix: { ingredients: [a, b], resultAbilityId: claim } },
});

/** The girl whose menu opens first submits `command`; returns her and the events of the submit. */
function pick(b: Board, command: Command): { girl: Ffx2Unit; events: BattleEvent[] } {
  const d = nextMenu(b.engine);
  const events = b.engine.submit(command);
  return { girl: b.units[d.actorId] as Ffx2Unit, events };
}

/** Let the clock run (every other menu answered with Defend) until `girl`'s cast has fired; returns everything that happened. */
function runUntilFired(b: Board, girl: Ffx2Unit, events: BattleEvent[] = []): BattleEvent[] {
  for (let i = 0; i < 8000 && (girl.atb.charging !== null || girl.itemHold !== undefined); i++) {
    const d = b.engine.nextDecision();
    if (d.kind === 'waiting') events.push(...b.engine.tick(Math.max(1, d.nextEventMs)));
    else if (d.kind === 'player-input') events.push(...b.engine.submit({ kind: 'defend', targets: [] } as Command));
    else if (d.kind === 'resolved') events.push(...d.events);
    else break;
  }
  expect(girl.atb.charging, 'the cast fired').toBeNull();
  return events;
}

/** Knock a girl out through the engine's own KO routine. */
function ko(b: Board, id: string): void {
  const ctx = (b.engine as unknown as { resolveCtx(): Parameters<typeof applyHpDelta>[0] }).resolveCtx();
  const u = b.units[id] as Ffx2Unit;
  applyHpDelta(ctx, u, u.hp);
}

const damageTo = (events: BattleEvent[], target: string): number[] =>
  events.filter((e): e is Extract<BattleEvent, { type: 'damage' }> => e.type === 'damage' && e.targetId === target).map((e) => e.amount);

describe('the result: the engine makes the row the real function answers, in the order picked', () => {
  it('every one of the 53 results is reached through the engine, announced as itself, and lands on the row\'s own side', () => {
    expect(Object.keys(ROWS)).toHaveLength(53);
    for (const key of Object.keys(ROWS)) {
      const command = Number(key);
      const row = ROWS[key] as Row;
      const [a, c] = pairFor(command);
      const b = board({ [item(a)]: 4, [item(c)]: 4 });
      const enemySide = (row.flagsTarget & 2) !== 0;
      const target = enemySide ? 'm0' : (row.flagsTarget & 0x40) !== 0 ? 'paine' : 'yuna';
      if ((row.flagsTarget & 0x40) !== 0) ko(b, 'paine'); // a revive needs a fallen girl
      const { girl, events } = pick(b, mixCommand(item(a), item(c), [target]));
      const start = events.find((e) => e.type === 'action-start') as Extract<BattleEvent, { type: 'action-start' }> | undefined;
      expect(start?.abilityId, `${hex(command)} is announced as the result, not as the Mix`).toBe(abilityOfRow(command));
      const all = runUntilFired(b, girl, [...events]);
      if (enemySide) {
        const hits = damageTo(all, 'm0');
        const stayed = (row.status1['1'] ?? 0) > 0; // a petrify rider can eject the monster after the first hit (the monster here has no resistance)
        if (row.formula === 8 || row.formula === 4) {
          expect(hits.length, `${hex(command)}: one damage event a hit`).toBeGreaterThanOrEqual(1);
          if (!stayed) expect(hits).toHaveLength(row.hits);
          expect(Math.max(...hits)).toBeLessThanOrEqual(9999);
          if (row.formula === 8) {
            const base = row.power * 50; // the fixed formula: power x 50, about +-10% after the randomiser (the note's own cross-check)
            expect(hits[0], `${hex(command)} first hit ${hits[0]} against ${base}`).toBeGreaterThanOrEqual(Math.floor(base * 0.9));
            expect(hits[0]).toBeLessThanOrEqual(Math.min(9999, Math.ceil(base * 1.1)));
          } else {
            expect(hits, 'percent of current HP of a 9,999,999 monster is far past the 9,999 cap').toEqual([9999]);
          }
        }
      } else {
        expect(damageTo(all, 'm0'), `${hex(command)} never touches the monster`).toEqual([]);
      }
    }
  });

  it('the order of the picks changes the result: the Hero Drink first is a Hero Drink, the Potion first is a Hi-Potion mix (the note\'s example)', () => {
    const heroFirst = board({ [HERO_DRINK]: 2, [POTION]: 2 });
    const a = pick(heroFirst, mixCommand(HERO_DRINK, POTION, ['yuna']));
    expect(a.events.find((e) => e.type === 'action-start')).toMatchObject({ abilityId: 'x2-mix-hero-drink' });
    const potionFirst = board({ [HERO_DRINK]: 2, [POTION]: 2 });
    const c = pick(potionFirst, mixCommand(POTION, HERO_DRINK, ['yuna']));
    expect(c.events.find((e) => e.type === 'action-start')).toMatchObject({ abilityId: 'x2-mix-hi-potion' });
    // and their effects differ the way the rows say: invincible for 15 on Yuna, against +1000 HP on a wounded Yuna
    runUntilFired(heroFirst, a.girl);
    expect((heroFirst.units['yuna'] as Ffx2Unit).statuses['invincible' as StatusId]).toBeDefined();
    (potionFirst.units['yuna'] as Ffx2Unit).hp = 100;
    const healed = runUntilFired(potionFirst, c.girl);
    expect(damageTo(healed, 'yuna')).toContain(-1000);
  });

  it('a claimed resultAbilityId is ignored: the engine resolves the result from the two items, as the game\'s HUD does', () => {
    const b = board({ [POTION]: 2 });
    const { events } = pick(b, mixCommand(POTION, POTION, ['yuna'], 'x2-mix-sunburst'));
    expect(events.find((e) => e.type === 'action-start')).toMatchObject({ abilityId: 'x2-mix-hi-potion' }); // two Potions make the Hi-Potion row (0x31A9)
  });

  it('the result\'s cast is the result row\'s 80, longer than an item\'s 40; the Mix stub itself never charges', () => {
    const b = board({ [POTION]: 2, [item(6)]: 1 });
    const mixer = pick(b, mixCommand(POTION, POTION, ['yuna']));
    const total = mixer.girl.atb.charging?.totalTicks ?? 0;
    expect(total).toBeGreaterThan(0);
    const item2 = board({ [POTION]: 2 });
    const girl2 = pick(item2, { kind: 'item', id: POTION, targets: ['yuna'] } as Command).girl;
    const itemTotal = girl2.atb.charging?.totalTicks ?? 0;
    // the same girl-agnostic ratio: the cast value is costCast x 10000 / (AGI + 1); two girls differ in AGI, so compare per unit of AGI
    const perAgi = (u: Ffx2Unit, ticks: number): number => ticks * ((u.stats.agi & 0xff) + 1);
    expect(Math.round(perAgi(mixer.girl, total) / 10000)).toBeCloseTo(80, -1);
    expect(Math.round(perAgi(girl2, itemTotal) / 10000)).toBeCloseTo(40, -1);
  });
});

describe('the ledger: both ingredients leave the stock at the pick, stay spent when the cast fires, and come back on every way out of the queue', () => {
  it('two different items: both drop by one the moment the pick is made, the hold names both, the cast keeps them spent', () => {
    const b = board({ [POTION]: 3, [HI_POTION]: 2 });
    const { girl } = pick(b, mixCommand(POTION, HI_POTION, ['yuna']));
    expect(b.flags[keyOf(POTION)]).toBe(2);
    expect(b.flags[keyOf(HI_POTION)]).toBe(1);
    expect(girl.itemHold).toEqual({ itemId: POTION, itemId2: HI_POTION, got: 2, needed: 2 });
    runUntilFired(b, girl);
    expect(girl.itemHold).toBeUndefined();
    expect(b.flags[keyOf(POTION)]).toBe(2);
    expect(b.flags[keyOf(HI_POTION)]).toBe(1);
    // knocking the caster out afterwards refunds nothing: the record was past the gate
    ko(b, girl.id);
    b.engine.tick(STEP_MS);
    expect(b.flags[keyOf(POTION)]).toBe(2);
    expect(b.flags[keyOf(HI_POTION)]).toBe(1);
  });

  it('the same item twice needs two: a stock of two serves it, a stock of one refuses it with the turn unspent and nothing taken', () => {
    const two = board({ [POTION]: 2 });
    const { girl } = pick(two, mixCommand(POTION, POTION, ['yuna']));
    expect(two.flags[keyOf(POTION)]).toBe(0);
    expect(girl.itemHold).toEqual({ itemId: POTION, itemId2: POTION, got: 2, needed: 2 });
    const one = board({ [POTION]: 1 });
    const d = nextMenu(one.engine);
    const turn = one.engine.state().turn;
    const events = one.engine.submit(mixCommand(POTION, POTION, ['yuna']));
    expect(events).toEqual([]);
    expect(one.engine.state().turn).toBe(turn);
    expect(one.flags[keyOf(POTION)]).toBe(1);
    expect((one.units[d.actorId] as Ffx2Unit).itemHold).toBeUndefined();
    expect(one.engine.nextDecision()).toMatchObject({ kind: 'player-input', actorId: d.actorId }); // the same menu comes back
  });

  it('a pick one ingredient short is refused whole: the other ingredient is not taken', () => {
    const b = board({ [POTION]: 3, [HI_POTION]: 0 });
    const d = nextMenu(b.engine);
    expect(b.engine.submit(mixCommand(POTION, HI_POTION, ['yuna']))).toEqual([]);
    expect(b.flags[keyOf(POTION)]).toBe(3);
    expect((b.units[d.actorId] as Ffx2Unit).itemHold).toBeUndefined();
  });

  const causes: Array<[string, (b: Board, g: Ffx2Unit) => void]> = [
    ['a knock-out', (b, g) => ko(b, g.id)],
    ['Stop', (_b, g) => void applyStatus(g, { status: 'stop', chance: 255, duration: 20 })],
    ['Petrify', (_b, g) => void applyStatus(g, { status: 'petrify', chance: 255, duration: 0 })],
    ['ejection', (_b, g) => { g.removed = true; }],
    ['a magic cancel', (b, g) => cancelCast(g, Object.values(b.units))],
  ];

  it.each(causes)('%s: both ingredients are back, the hold is gone', (_name, cause) => {
    const b = board({ [POTION]: 1, [HI_POTION]: 1 });
    const { girl } = pick(b, mixCommand(POTION, HI_POTION, ['yuna']));
    expect([b.flags[keyOf(POTION)], b.flags[keyOf(HI_POTION)]]).toEqual([0, 0]);
    cause(b, girl);
    b.engine.tick(STEP_MS);
    expect([b.flags[keyOf(POTION)], b.flags[keyOf(HI_POTION)]]).toEqual([1, 1]);
    expect(girl.itemHold).toBeUndefined();
    expect(girl.atb.charging).toBeNull();
  });

  it('the same item twice comes back twice; a stack that filled to 99 meanwhile loses what does not fit (cap 99)', () => {
    const b = board({ [POTION]: 2 });
    const { girl } = pick(b, mixCommand(POTION, POTION, ['yuna']));
    ko(b, girl.id);
    b.engine.tick(STEP_MS);
    expect(b.flags[keyOf(POTION)]).toBe(2);
    const full = board({ [POTION]: 99 });
    const mixer = pick(full, mixCommand(POTION, POTION, ['yuna'])).girl;
    expect(full.flags[keyOf(POTION)]).toBe(97);
    full.flags[keyOf(POTION)] = 99; // a steal brought the stack back to full while the cast was charging
    ko(full, mixer.id);
    full.engine.tick(STEP_MS);
    expect(full.flags[keyOf(POTION)]).toBe(99);
  });

  it('an ingredient the battle does not track is free, as an untracked item is: only the tracked one is held; two untracked take nothing and still resolve', () => {
    const half = board({ [POTION]: 2 });
    const { girl } = pick(half, mixCommand(POTION, item(2), ['yuna'])); // the X-Potion is not in the bag
    expect(half.flags[keyOf(POTION)]).toBe(1);
    expect(half.flags[keyOf(item(2))]).toBeUndefined();
    expect(girl.itemHold).toEqual({ itemId: POTION, got: 1, needed: 1 });
    const free = board({});
    const mixer = pick(free, mixCommand(POTION, item(2), ['yuna']));
    expect(mixer.girl.itemHold).toBeUndefined();
    // the Potion (restorative, level 1) with the X-Potion (restorative, level 3) blends to restorative at the higher level: the fixture's answer, found by scanning the catalog for its row
    const answer = (RECIPE.resultByPair[hex(0x2000)] as number[])[2] as number;
    expect(mixer.events.find((e) => e.type === 'action-start')).toMatchObject({ abilityId: abilityOfRow(answer) });
  });

  it('a monster never reserves; a pick that gets past the menu with the stock short aborts, says so, and takes nothing (the net below `submit`)', () => {
    const b = board({ [POTION]: 3 });
    const foe = b.units['m0'] as Ffx2Unit;
    expect(reserveIngredients(b.flags, foe, [POTION, HI_POTION])).toBe(true);
    expect(b.flags[keyOf(POTION)]).toBe(3);
    expect(foe.itemHold).toBeUndefined();
    // a partial reserve is rolled back: the Potion is taken, the Hi-Potion (tracked at 0) is not there, so the Potion comes back and nothing is held
    const short = board({ [POTION]: 3, [HI_POTION]: 0 });
    const girl = short.units['yuna'] as Ffx2Unit;
    expect(reserveIngredients(short.flags, girl, [POTION, HI_POTION])).toBe(false);
    expect(short.flags[keyOf(POTION)]).toBe(3);
    expect(girl.itemHold).toBeUndefined();
    // and the same net inside the action: a script's command (no `submit` in front of it) aborts with the system message, spends the turn, and takes nothing
    const d = nextMenu(short.engine);
    const actor = short.units[d.actorId] as Ffx2Unit;
    const inside = short.engine as unknown as { env(): Parameters<typeof performCommand>[0]; beginTurn(a: Ffx2Unit): void; flush(): BattleEvent[] };
    inside.beginTurn(actor);
    performCommand(inside.env(), actor, mixCommand(POTION, HI_POTION, ['yuna']), false);
    const said = inside.flush();
    expect(said.find((e) => e.type === 'message')).toMatchObject({ text: `No ${data.ITEMS[HI_POTION]?.name} left`, kind: 'system' });
    expect(said.some((e) => e.type === 'action-end')).toBe(true);
    expect(short.flags[keyOf(POTION)]).toBe(3);
    expect(actor.itemHold).toBeUndefined();
    expect(actor.atb.charging).toBeNull();
  });
});

describe('what a result does: the row\'s own numbers', () => {
  const heals = (events: BattleEvent[], id: string): number[] => damageTo(events, id).filter((n) => n < 0).map((n) => -n);

  it('Hi-Potion (0x31A9) heals one ally exactly 1,000 (fixed, no variance: power 20 x 50); Mega-Potion (0x31AA) heals every living ally exactly 2,000', () => {
    const b = board({ [POTION]: 3, [HI_POTION]: 3 });
    for (const id of ['yuna', 'rikku', 'paine']) (b.units[id] as Ffx2Unit).hp = 100;
    const { girl, events } = pick(b, mixCommand(POTION, POTION, ['paine']));
    const all = runUntilFired(b, girl, [...events]);
    expect(heals(all, 'paine')).toEqual([1000]);
    expect(heals(all, 'yuna')).toEqual([]);
    const c = board({ [HI_POTION]: 3 });
    for (const id of ['yuna', 'rikku', 'paine']) (c.units[id] as Ffx2Unit).hp = 100;
    const m = pick(c, mixCommand(HI_POTION, HI_POTION, ['yuna'])); // two Hi-Potions: level 2 restorative, no blend: the Mega-Potion row
    expect(m.events.find((e) => e.type === 'action-start')).toMatchObject({ abilityId: 'x2-mix-mega-potion' });
    const done = runUntilFired(c, m.girl, [...m.events]);
    for (const id of ['yuna', 'rikku', 'paine']) expect(heals(done, id), id).toEqual([2000]);
  });

  it('a percent heal is max HP x power / 16, floored: Ultra Cure (0x31A5, power 8) gives half and cleanses; Ultra Potion (power 16) fills', () => {
    const [a, c] = pairFor(0x31a5);
    const b = board({ [item(a)]: 2, [item(c)]: 2 });
    const yuna = b.units['yuna'] as Ffx2Unit;
    yuna.hp = 100;
    applyStatus(yuna, { status: 'poison', chance: 255, duration: 255 });
    const { girl, events } = pick(b, mixCommand(item(a), item(c), ['yuna']));
    const all = runUntilFired(b, girl, [...events]);
    expect(heals(all, 'yuna'), 'half of max HP, floored').toEqual([Math.floor((yuna.stats.maxHp * 8) / 16)]);
    expect(yuna.statuses['poison' as StatusId], 'the cleanse takes the poison').toBeUndefined();
    const [p, q] = pairFor(0x31ab);
    const u = board({ [item(p)]: 2, [item(q)]: 2 });
    const yu = u.units['yuna'] as Ffx2Unit;
    yu.hp = 100;
    const fill = pick(u, mixCommand(item(p), item(q), ['yuna']));
    runUntilFired(u, fill.girl, [...fill.events]);
    expect(yu.hp).toBe(yu.stats.maxHp);
  });

  it('a revive stands a fallen girl at max HP x power / 16: Mega Phoenix (0x31A6, power 4) at a quarter, Final Phoenix (0x31A7, power 16) at full; a living ally is not touched by either', () => {
    for (const [command, power] of [[0x31a6, 4], [0x31a7, 16]] as const) {
      const [a, c] = pairFor(command);
      const b = board({ [item(a)]: 2, [item(c)]: 2 });
      ko(b, 'paine');
      const paine = b.units['paine'] as Ffx2Unit;
      const yuna = b.units['yuna'] as Ffx2Unit;
      yuna.hp = 100;
      const { girl, events } = pick(b, mixCommand(item(a), item(c), ['paine']));
      runUntilFired(b, girl, [...events]);
      expect(paine.alive, hex(command)).toBe(true);
      expect(paine.hp, hex(command)).toBe(Math.floor((paine.stats.maxHp * power) / 16));
      expect(yuna.hp, 'a Phoenix row needs a fallen target').toBe(100);
    }
  });

  it('a grenade is one hit on everyone; the gravity rows are a percent of current HP held at the 9,999 cap, and Tallboy\'s 254 riders always land (Defense and Magic Defense down)', () => {
    const [a, c] = pairFor(0x319f);
    const b = board({ [item(a)]: 2, [item(c)]: 2 });
    const { girl, events } = pick(b, mixCommand(item(a), item(c), ['m0']));
    const all = runUntilFired(b, girl, [...events]);
    expect(damageTo(all, 'm0')).toEqual([9999]);
    const foe = b.units['m0'] as Ffx2Unit;
    expect(foe.statuses['def-down' as StatusId]?.stacks).toBe(3);
    expect(foe.statuses['mdef-down' as StatusId]?.stacks).toBe(3);
  });

  it('the support rows put their statuses on the allies the row names: Wall (Shell and Protect, 0x31B1) on all, Hero Drink (invincible, 0x31B7) on the one named', () => {
    const [a, c] = pairFor(0x31b1);
    const b = board({ [item(a)]: 2, [item(c)]: 2 });
    const { girl, events } = pick(b, mixCommand(item(a), item(c), []));
    runUntilFired(b, girl, [...events]);
    for (const id of ['yuna', 'rikku', 'paine']) {
      expect((b.units[id] as Ffx2Unit).statuses['shell' as StatusId], id).toBeDefined();
      expect((b.units[id] as Ffx2Unit).statuses['protect' as StatusId], id).toBeDefined();
    }
    const h = board({ [HERO_DRINK]: 2, [POTION]: 2 });
    const hero = pick(h, mixCommand(HERO_DRINK, POTION, ['rikku']));
    runUntilFired(h, hero.girl, [...hero.events]);
    expect((h.units['rikku'] as Ffx2Unit).statuses['invincible' as StatusId]).toBeDefined();
    expect((h.units['yuna'] as Ffx2Unit).statuses['invincible' as StatusId]).toBeUndefined();
  });
});

describe('a Mix held for a chain lock is picked when it fires, like an item', () => {
  /** A chained girl confirms a Mix: it is held; the clock runs until the lock lifts and the hold either fires or is dropped. */
  const hold = (stockAtFire: Record<string, number>): { b: Board; girl: Ffx2Unit; held: BattleEvent[] } => {
    const b = board({ [POTION]: 2, [HI_POTION]: 2 });
    const d = nextMenu(b.engine);
    const girl = b.units[d.actorId] as Ffx2Unit;
    girl.chainWindowTicks = 90;
    girl.chainCount = 1;
    const held = b.engine.submit(mixCommand(POTION, HI_POTION, ['yuna']));
    expect(held, 'confirming while chained spends nothing and starts nothing').toEqual([]);
    expect(b.engine.heldCommand()).not.toBeNull();
    expect([b.flags[keyOf(POTION)], b.flags[keyOf(HI_POTION)]], 'nothing is reserved while the command is held').toEqual([2, 2]);
    for (const [id, count] of Object.entries(stockAtFire)) b.flags[keyOf(id)] = count; // what is left when the lock lifts
    const seen: BattleEvent[] = [];
    for (let i = 0; i < 400 && b.engine.heldCommand() !== null; i++) {
      const next = b.engine.nextDecision();
      if (next.kind === 'waiting') seen.push(...b.engine.tick(Math.max(1, next.nextEventMs)));
      else if (next.kind === 'resolved') seen.push(...next.events);
      else if (next.kind === 'player-input') seen.push(...b.engine.submit({ kind: 'defend', targets: [] } as Command));
    }
    expect(b.engine.heldCommand(), 'the hold is gone').toBeNull();
    return { b, girl, held: seen };
  };

  it('when the lock lifts it fires: the ingredients are reserved then and the result charges', () => {
    const { b, girl, held } = hold({});
    const answer = (RECIPE.resultByPair[hex(0x2000)] as number[])[1] as number; // the Potion then the Hi-Potion, from the fixture
    expect(held.some((e) => e.type === 'action-start' && e.actorId === girl.id && e.abilityId === abilityOfRow(answer))).toBe(true);
    expect([b.flags[keyOf(POTION)], b.flags[keyOf(HI_POTION)]]).toEqual([1, 1]);
    expect(girl.itemHold).toMatchObject({ got: 2, needed: 2 });
    expect(girl.atb.charging).not.toBeNull();
  });

  it('if the stock was used up while it waited, it is dropped when the lock lifts: nothing taken, the turn not spent', () => {
    const { b, girl, held } = hold({ [POTION]: 0 });
    expect(held.some((e) => e.type === 'action-start' && e.actorId === girl.id)).toBe(false);
    // dropped, not aborted: no "No Potion left" message, no turn begun for her (the abort path of `performCommand` would have spent it), and she keeps her menu
    expect(held.some((e) => e.type === 'message' && e.kind === 'system')).toBe(false);
    expect(held.some((e) => e.type === 'turn-start' && e.actorId === girl.id)).toBe(false);
    expect(b.flags[keyOf(POTION)]).toBe(0);
    expect(b.flags[keyOf(HI_POTION)]).toBe(2);
    expect(girl.itemHold).toBeUndefined();
  });
});

describe('the protocol of the picker, which step two will use, already works on the engine side', () => {
  it('a bare Mix from a human raises the rikku-mix overlay; the same command re-submitted with the items charges the RESULT, ends the suspension, and the next Mix asks again', () => {
    const b = board({ [POTION]: 4, [HI_POTION]: 4 }, 1, true);
    const awaiting = (): Command | null => (b.engine as unknown as { awaitingMinigame: Command | null }).awaitingMinigame;
    const bare: Command = { kind: 'ability', id: 'x2-alchemist-mix', targets: ['yuna'] };
    const d = nextMenu(b.engine);
    const asked = b.engine.submit(bare);
    expect(asked.find((e) => e.type === 'minigame-request')).toMatchObject({ kind: 'rikku-mix', who: d.actorId });
    expect(awaiting()).toMatchObject({ id: 'x2-alchemist-mix' });
    expect([b.flags[keyOf(POTION)], b.flags[keyOf(HI_POTION)]], 'nothing is taken until the items are picked').toEqual([4, 4]);
    const girl = b.units[d.actorId] as Ffx2Unit;
    const answered = b.engine.submit({ ...bare, extra: { kind: 'rikku-mix', mix: { ingredients: [POTION, HI_POTION], resultAbilityId: null } } } as Command);
    expect(answered.find((e) => e.type === 'action-start')).toMatchObject({ abilityId: 'x2-mix-mega-potion', actorId: d.actorId }); // the answer went to the girl who asked, and the result is what charges
    expect(awaiting(), 'the suspension of the overlay ends when the result starts charging').toBeNull();
    expect([b.flags[keyOf(POTION)], b.flags[keyOf(HI_POTION)]]).toEqual([3, 3]);
    expect(girl.itemHold).toMatchObject({ got: 2, needed: 2 });
    runUntilFired(b, girl);
    expect([b.flags[keyOf(POTION)], b.flags[keyOf(HI_POTION)]]).toEqual([3, 3]);
    // another girl's bare Mix asks for its own overlay: it is not mistaken for a re-submit of the first
    const next = nextMenu(b.engine);
    const again = b.engine.submit(bare);
    expect(again.find((e) => e.type === 'minigame-request')).toMatchObject({ kind: 'rikku-mix', who: next.actorId });
  });
});

describe('what is not a Mix: the bare command is what it always was', () => {
  const nothingHappens = (b: Board, command: Command): void => {
    const before = JSON.stringify(Object.entries(b.flags).filter(([k]) => k.startsWith('inventory:')));
    const events = (() => { nextMenu(b.engine); return b.engine.submit(command); })();
    expect(events.some((e) => e.type === 'damage'), 'no damage, no healing').toBe(false);
    expect(JSON.stringify(Object.entries(b.flags).filter(([k]) => k.startsWith('inventory:')))).toBe(before);
    for (const u of Object.values(b.units)) expect(u.itemHold).toBeUndefined();
  };

  it('a Mix with no outcome, with one item, or with an item the game\'s table does not have does nothing and spends nothing', () => {
    nothingHappens(board({ [POTION]: 3 }), { kind: 'ability', id: 'x2-alchemist-mix', targets: ['m0'] });
    nothingHappens(board({ [POTION]: 3 }), { kind: 'ability', id: 'x2-alchemist-mix', targets: ['m0'], extra: { kind: 'rikku-mix', mix: { ingredients: [POTION] as unknown as [string, string], resultAbilityId: null } } });
    nothingHappens(board({ [POTION]: 3, 'x2-no-such-item': 3 }), mixCommand(POTION, 'x2-no-such-item', ['m0']));
  });

  it('only the Alchemist\'s Mix command is a Mix, and the plan needs the result in the registry', () => {
    const abilities = abilityRegistryFrom(Object.values(data.ABILITIES));
    const plan = mixPlanOf(abilities, mixCommand(POTION, HERO_DRINK));
    expect(plan?.ability.id).toBe('x2-mix-hi-potion');
    expect(plan?.command).toBe(0x31a9);
    expect(mixPlanOf(abilities, { ...mixCommand(POTION, HERO_DRINK), id: 'x2-alchemist-stash-potion' } as Command)).toBeUndefined();
    expect(mixPlanOf(abilityRegistryFrom([]), mixCommand(POTION, HERO_DRINK))).toBeUndefined();
  });
});

describe('no random number is spent by the resolver or the reservation', () => {
  it('planning, reserving and asking whether the stock is short leave every stream where it was', () => {
    const b = board({ [POTION]: 4, [HI_POTION]: 4 });
    const streams = (b.engine as unknown as { rng: { states: ArrayLike<bigint | number> } }).rng.states;
    const before = Array.from(streams);
    const abilities = abilityRegistryFrom(Object.values(data.ABILITIES));
    const girl = b.units['yuna'] as Ffx2Unit;
    expect(mixPlanOf(abilities, mixCommand(POTION, HI_POTION))).toBeDefined();
    expect(stockShort(b.flags, abilities, mixCommand(POTION, HI_POTION))).toBe(false);
    expect(reserveIngredients(b.flags, girl, [POTION, HI_POTION])).toBe(true);
    expect(Array.from(streams)).toEqual(before);
    expect([trackedStock(b.flags, POTION), trackedStock(b.flags, HI_POTION)]).toEqual([3, 3]);
  });
});
