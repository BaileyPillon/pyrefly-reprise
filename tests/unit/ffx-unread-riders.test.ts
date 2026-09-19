/**
 * **Four riders the FFX data shipped and nothing in the engine read.**
 *
 * An adversarial verifier refuted two of the combat track's round-02 claims by
 * taking rows straight off the shipped Chapter-1 menu and submitting them
 * verbatim. Both refutations, and the two more this file found while closing
 * them, are the same shape as Slots, Fury and Talk before them — a field the
 * data declares, documents and cites, that no code anywhere reads (AGENTS.md
 * hard rule 4, "built but wired to nothing"):
 *
 * | rider | declared in | was |
 * |---|---|---|
 * | `statusEffects` on a `power: 0` cast | `overdrive-lulu-2.ts` Bio Fury | 16 hits, **no event at all** |
 * | `extra.deathChance` | `blackmagic-advanced.ts`, `overdrive-lulu-2.ts`, aeon `pain`/`zanmato`, the two Wisps | never rolled — **Zanmato killed nobody** |
 * | `extra.stealRoll` + `EnemyFields.rewards.steal` | `special-rikku.ts`, every FFX boss | `Steal` spent a turn in silence |
 * | `MIX_RECIPES` | `data/ffx/mixes/recipes.ts` | no reader in the project; Mix ate a full gauge |
 *
 * Plus `Use`, §7.6 row 23, which is a **submenu label** and not an action at
 * all — this menu is flat, so the gems and grenades it fronts are already rows
 * beside it.
 *
 * **Game-awareness** [AGENTS.md hard rule 14]: every one of these is **FFX
 * only**. Steal, Mix, Fury, Overdrive gauges and Rikku's `Use` submenu are FFX
 * commands, in FFX data, resolved by the FFX CTB engine; FFX-2's Thief has its
 * own roll in its own ATB engine and nothing under `src/battle/ffx2` was
 * touched. `tests/unit/trigger-commands.test.ts` audits chapters 4 and 5
 * unchanged and proves that.
 *
 * Everything below runs the shipped catalog on the shipped boards. The one
 * exception is the Death roll, and it is forced: **every FFX boss the game
 * ships is `ko: 255`**, correctly, so the only way to see the rider land is a
 * fixture enemy that is not immune — which is also the proof that a boss's
 * immunity still refuses it.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleEvent,
  Command,
  Decision,
  FFXCombatant,
  FFXMemberBuild,
  FFXPartyBuild,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS, MIX_RECIPES } from '../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { enemy, member, party, stats } from './ffx-fixtures.test.ts';

type Engine = ReturnType<typeof createFFXEngine>;

function content(): FFXContentRegistry {
  const registry = new FFXContentRegistry();
  registry.addAbilities(ALL_ABILITIES);
  registry.addItems(Object.values(ITEMS));
  registry.addMixRecipes(MIX_RECIPES);
  return registry;
}

function chapterOne(seed: number, build: FFXPartyBuild = gagazetBuild): Engine {
  const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: build,
    enemies: ENEMY_GROUPS_BY_ID['seymour-flux']!,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

/** The FFX view of one combatant; `state().combatants` is typed for both games. */
function fighterIn(engine: Engine, id: string): FFXCombatant {
  return engine.state().combatants[id] as unknown as FFXCombatant;
}

/** Three slots, one of them the actor under test and two inert stand-ins. */
function soloParty(hero: FFXMemberBuild, inventory: FFXPartyBuild['inventory'] = []): FFXPartyBuild {
  const a = member({ id: 'ally-a' });
  const b = member({ id: 'ally-b' });
  return party({ members: [hero, a, b], activeSlots: [hero.id, a.id, b.id], inventory });
}

/** A Switch, taken from the live menu, with the incoming member's gauge filled. */
function bringIn(engine: Engine, who: string): Extract<Decision, { kind: 'player-input' }> {
  const opening = turn(engine);
  const bench = fighterIn(engine, who);
  if (bench?.overdrive) bench.overdrive.gauge = 100;
  const swap = opening.commands.find(
    (c) => c.enabled && c.command.kind === 'switch' && c.command.extra?.inId === who,
  );
  if (!swap) throw new Error(`${who} is not on the bench`);
  engine.submit(swap.command);
  const mine = turn(engine);
  expect(mine.actorId).toBe(who);
  return mine;
}

function turn(engine: Engine, who?: string): Extract<Decision, { kind: 'player-input' }> {
  for (let i = 0; i < 4000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error('battle ended before a player turn');
    if (d.kind !== 'player-input') continue;
    if (who === undefined || d.actorId === who) return d;
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error('no player turn');
}

function rowNamed(decision: Extract<Decision, { kind: 'player-input' }>, label: string): AvailableCommand {
  const row = decision.commands.find((c) => c.label === label);
  expect(row, `"${label}" is not on the menu`).toBeDefined();
  return row!;
}

function submitAndRead(engine: Engine, command: Command): BattleEvent[] {
  const before = engine.state().log.length;
  engine.submit(command);
  return engine.state().log.slice(before);
}

/** Bookkeeping and the actor paying for the row are not effects. */
function effects(events: readonly BattleEvent[]): BattleEvent[] {
  return events.filter(
    (e) =>
      e.type !== 'action-start' &&
      e.type !== 'action-end' &&
      e.type !== 'turn-start' &&
      !(e.type === 'overdrive-gauge' && e.cause === 'spent'),
  );
}

describe('a zero-damage cast is still a cast [ffx-combat-core §5.7]', () => {
  it('Bio Fury lands its hits instead of spending a full gauge in silence', () => {
    const engine = chapterOne(5);
    const mine = bringIn(engine, 'lulu');
    const bio = rowNamed(mine, 'Bio Fury');
    expect(bio.enabled).toBe(true);

    const events = effects(submitAndRead(engine, { ...bio.command, targets: [] } as Command));
    const hits = events.filter((e) => e.type === 'damage');
    // §5.7 authors Bio Fury `power: 0` on purpose — the cast is the carrier for
    // its Poison, not a blank — so every cast connects for 0.
    expect(hits.length, 'Bio Fury produced no hits').toBeGreaterThan(0);
    expect(hits.every((e) => e.type === 'damage' && e.amount === 0)).toBe(true);
    expect(fighterIn(engine, 'lulu').overdrive!.gauge).toBe(0);
  });

  it("and its Poison rider really is rolled — Seymour's resistance 90 beats chance 80, his mount is immune", () => {
    // §1.3 gives Seymour Flux `poison: 90` and the Mortiorchis `poison: 255`.
    // Bio Fury's rider is chance 80, so `80 - 90` can never clear the roll:
    // the correct outcome is 16 zeroes and no Poison, which is exactly what a
    // silent no-op used to be mistaken for.
    const engine = chapterOne(5);
    const mine = bringIn(engine, 'lulu');
    const events = submitAndRead(engine, { ...rowNamed(mine, 'Bio Fury').command, targets: [] } as Command);
    expect(events.some((e) => e.type === 'status-add' && e.status === 'poison')).toBe(false);

    // The same rider on a target that is not resistant lands, which is what
    // proves the roll is reached at all rather than dropped.
    const vulnerable = createFFXEngine({ content: content(), autoResolveMinigames: true });
    vulnerable.init({
      game: 'ffx',
      party: soloParty(member({ id: 'lulu', learnedAbilityIds: ['bio'], stats: stats({ mag: 40 }) })),
      enemies: { id: 'dummy-group', game: 'ffx', enemies: [enemy({ id: 'dummy' })], canEscape: false },
      triggers: [],
      seed: 1,
      condition: 'normal',
      canEscape: false,
    });
    const cast = rowNamed(turn(vulnerable, 'lulu'), 'Bio');
    const landed = submitAndRead(vulnerable, { ...cast.command, targets: ['dummy'] } as Command);
    expect(landed.some((e) => e.type === 'status-add' && e.status === 'poison')).toBe(true);
  });
});

describe('extra.deathChance is rolled [ffx-combat-core §7.4, §5.7]', () => {
  function deathEngine(seed: number, immune: boolean): Engine {
    const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
    engine.init({
      game: 'ffx',
      party: soloParty(
        member({ id: 'lulu', learnedAbilityIds: ['death'], mp: 999, stats: stats({ mag: 40, mp: 999, maxMp: 999 }) }),
      ),
      enemies: {
        id: 'dummy-group',
        game: 'ffx',
        enemies: [enemy({ id: 'dummy', immunities: immune ? { ko: 255 } : {} })],
        canEscape: false,
      },
      triggers: [],
      seed,
      condition: 'normal',
      canEscape: false,
    });
    return engine;
  }

  it('Death kills a target that is not immune', () => {
    // chance 80 out of 100: a handful of seeds settles it without a flake.
    const killed = [1, 2, 3, 4, 5].filter((seed) => {
      const engine = deathEngine(seed, false);
      const cast = rowNamed(turn(engine, 'lulu'), 'Death');
      return submitAndRead(engine, { ...cast.command, targets: ['dummy'] } as Command).some((e) => e.type === 'ko');
    });
    expect(killed.length, 'Death never killed anything at any seed').toBeGreaterThan(0);
  });

  it('and a ko-immune target refuses it, so no boss is weakened', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const engine = deathEngine(seed, true);
      const cast = rowNamed(turn(engine, 'lulu'), 'Death');
      const events = submitAndRead(engine, { ...cast.command, targets: ['dummy'] } as Command);
      expect(events.some((e) => e.type === 'ko')).toBe(false);
    }
  });

  it('Death Fury carries the same rider, and Seymour Flux is ko: 255 so it cannot touch him', () => {
    const engine = chapterOne(5);
    fighterIn(engine, 'lulu').learnedAbilityIds.push('death');
    const mine = bringIn(engine, 'lulu');
    const events = effects(submitAndRead(engine, { ...rowNamed(mine, 'Death Fury').command, targets: [] } as Command));
    expect(events.length, 'Death Fury did nothing at all').toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'ko' && e.targetId === 'seymour-flux')).toBe(false);
  });
});

describe('Steal takes the item the enemy record offers [ffx-combat-core §7.8.1]', () => {
  /** One thief, one inert target, an empty bag — so every count is readable. */
  function thiefBoard(seed: number, baseChance: number | null): Engine {
    const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
    const rewards = {
      ap: 0,
      apOverkill: 0,
      gil: 0,
      overkillThreshold: 1000,
      drops: [],
      ...(baseChance === null
        ? {}
        : {
            steal: {
              baseChance,
              common: { itemId: 'elixir', count: 1 },
              rare: { itemId: 'elixir', count: 1 },
            },
          }),
    };
    engine.init({
      game: 'ffx',
      party: soloParty(member({ id: 'rikku', learnedAbilityIds: ['steal'] })),
      enemies: {
        id: 'dummy-group',
        game: 'ffx',
        enemies: [enemy({ id: 'dummy', stats: stats({ hp: 99999, maxHp: 99999, agi: 1 }), rewards })],
        canEscape: false,
      },
      triggers: [],
      seed,
      condition: 'normal',
      canEscape: false,
    });
    return engine;
  }

  function stealOnce(engine: Engine): BattleEvent[] {
    const steal = rowNamed(turn(engine, 'rikku'), 'Steal');
    expect(steal.enabled).toBe(true);
    return submitAndRead(engine, { ...steal.command, targets: ['dummy'] } as Command);
  }

  it('is guaranteed on the first attempt against a baseChance-100 table, and says what it took', () => {
    // §7.8.1: the decompiled byte 255 means "guaranteed on the first attempt";
    // `EnemyFields.steal.baseChance` clamps that to the contract's 0-100 range,
    // and Seymour Flux's own record carries exactly `baseChance: 100` (§1.4).
    for (const seed of [1, 2, 3, 4, 5]) {
      const engine = thiefBoard(seed, 100);
      const events = stealOnce(engine);
      const said = events.find((e) => e.type === 'message');
      expect(said && said.type === 'message' && said.text, `seed ${seed}`).toContain('Stole');
      expect(engine.state().flags['inventory:elixir']).toBe(1);
    }
  });

  it('and the shipped Chapter-1 board really is where a player meets it', () => {
    // The refuted claim was taken from this exact menu: Rikku is one Switch
    // away and her `Steal` row emitted nothing at all.
    const engine = chapterOne(3);
    const mine = bringIn(engine, 'rikku');
    const steal = rowNamed(mine, 'Steal');
    expect(steal.enabled).toBe(true);
    const events = effects(submitAndRead(engine, { ...steal.command, targets: ['seymour-flux'] } as Command));
    expect(events.length, 'Steal spent a turn in silence').toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'message' && e.text.startsWith('Stole'))).toBe(true);
  });

  it('halves on success only, so the table decays to nothing after at most eight', () => {
    // 100 -> 50 -> 25 -> 12 -> 6 -> 3 -> 1 -> 0 [§7.8.1's schedule].
    const engine = thiefBoard(7, 100);
    let stolen = 0;
    for (let i = 0; i < 25; i++) {
      const events = stealOnce(engine);
      const said = events.find((e) => e.type === 'message');
      // Every attempt speaks, whether it took something or not.
      expect(said, 'a Steal attempt said nothing').toBeDefined();
      if (said && said.type === 'message' && said.text.startsWith('Stole')) stolen++;
    }
    expect(stolen).toBeGreaterThan(0);
    expect(stolen, '§7.8.1 caps a 100-table at eight steals').toBeLessThanOrEqual(8);
    expect(engine.state().flags['inventory:elixir']).toBe(stolen);
  });

  it('and a monster with no steal table says so rather than eating the turn', () => {
    const engine = thiefBoard(1, null);
    const events = effects(stealOnce(engine));
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'message' && e.text.includes('Nothing to steal'))).toBe(true);
  });
});

describe('Mix resolves through the recipe table [ffx-combat-core §5.9]', () => {
  it('turns two ingredients into a real mix and consumes both', () => {
    // Exactly two Potions in the bag, so the only recipe available is §5.9's
    // Potion + Potion -> Ultra Potion and both counts are readable afterwards.
    const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
    engine.init({
      game: 'ffx',
      party: soloParty(
        member({
          id: 'rikku',
          overdrive: { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['mix'] },
        }),
        [{ itemId: 'potion', count: 2 }],
      ),
      enemies: { id: 'dummy-group', game: 'ffx', enemies: [enemy({ id: 'dummy' })], canEscape: false },
      triggers: [],
      seed: 4,
      condition: 'normal',
      canEscape: false,
    });

    const mix = rowNamed(turn(engine, 'rikku'), 'Mix');
    expect(mix.enabled).toBe(true);
    const events = submitAndRead(engine, { ...mix.command, targets: [] } as Command);
    const start = events.find((e) => e.type === 'action-start');
    expect(start && start.type === 'action-start' && start.abilityId, 'Mix stayed the selector').toBe(
      'mix-ultra-potion',
    );
    expect(effects(events).length, 'Mix produced no effect').toBeGreaterThan(0);
    expect(engine.state().flags['inventory:potion'], 'Mix consumed neither Potion').toBe(0);
  });

  it('and an empty bag is told "Mix failed!" with the gauge kept, not spent in silence', () => {
    const engine = createFFXEngine({ content: content(), autoResolveMinigames: true });
    engine.init({
      game: 'ffx',
      party: soloParty(
        member({
          id: 'rikku',
          learnedAbilityIds: [],
          overdrive: { gauge: 100, mode: 'stoic', unlockedModes: ['stoic'], unlockedOverdriveIds: ['mix'] },
        }),
      ),
      enemies: { id: 'dummy-group', game: 'ffx', enemies: [enemy({ id: 'dummy' })], canEscape: false },
      triggers: [],
      seed: 1,
      condition: 'normal',
      canEscape: false,
    });
    const mix = rowNamed(turn(engine, 'rikku'), 'Mix');
    const events = submitAndRead(engine, { ...mix.command, targets: [] } as Command);
    expect(events.some((e) => e.type === 'message' && e.text === 'Mix failed!')).toBe(true);
    expect(fighterIn(engine, 'rikku').overdrive!.gauge, 'a failed Mix ate the gauge').toBe(100);
  });
});

describe('Use is a submenu label, not an action [ffx-combat-core §7.6 row 23]', () => {
  it('is no longer offered as a row, because the items it fronts are rows already', () => {
    const engine = chapterOne(3);
    const mine = bringIn(engine, 'rikku');
    expect(mine.commands.some((c) => c.label === 'Use')).toBe(false);
    // The submenu's contents are still there, which is the whole justification.
    for (const label of ['Grenade', 'Fire Gem', 'Poison Fang']) {
      expect(mine.commands.some((c) => c.label === label), `${label} is missing`).toBe(true);
    }
  });

  it('and is refused out loud if a caller submits it anyway', () => {
    const engine = chapterOne(3);
    bringIn(engine, 'rikku');
    const events = submitAndRead(engine, { kind: 'ability', id: 'use', targets: [] } as Command);
    expect(events.some((e) => e.type === 'message' && e.text.includes('menu marker'))).toBe(true);
    // Refused means the turn stays open: the same actor is asked again.
    expect(turn(engine).actorId).toBe('rikku');
  });
});
