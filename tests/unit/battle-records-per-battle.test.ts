/**
 * A battle owns its records. The shipped data is read-only.
 *
 * `src/data/ffx/index.ts` and `src/data/ffx2/index.ts` publish
 * `ENEMY_GROUPS_BY_ID` as module singletons, and `src/data/encounters.ts`
 * hands every run of a chapter the *same* `EnemyGroupDef` and the same party
 * build. Both engines' `init()` copied those field by field, one level deep,
 * and both shared everything under it.
 *
 * Proved by running the engines and walking the live state — never by grep
 * [AGENTS.md hard rule 3]. The audit in the first test was red on every
 * chapter before `src/battle/common/clone.ts` existed:
 *
 * | Chapter | objects the live state shared with the shipped records |
 * |---|---:|
 * | 1 Seymour Flux | 16 |
 * | 2 Yunalesca | 16 |
 * | 3 Braska's Final Aeon | 16 |
 * | 4 FFX-2 Bahamut | 5 |
 * | 5 Vegnagun / Shuyin | 5 |
 *
 * — every member's `equipment.weapon.autoAbilities` and
 * `equipment.armor.autoAbilities`, the boss's `enemy.rewards.steal` and
 * `.bribe`, Braska's Final Aeon's `enemy.forms[1].statOverrides`, and on the
 * X-2 side every girl's `dresspheres.abilitiesLearned` plus the boss's whole
 * `enemy.forms` array and whole `enemy.rewards` object.
 *
 * **Both games** [AGENTS.md hard rule 14]: this is shared plumbing and a bug
 * fix, which `critic/CHECKS.md` CHK-020 defines as applying to both, and the
 * leak was in `src/battle/ffx/setup.ts` *and* `src/battle/ffx2/setup.ts`. Each
 * assertion below runs against every chapter of both games rather than
 * assuming one engine stands for the other.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleEvent,
  BattleSetup,
  Command,
  Decision,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as ffxData from '../../src/data/ffx/index.ts';
import * as ffx2Data from '../../src/data/ffx2/index.ts';
import { CHAPTERS, type Chapter } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const MAX_DECISIONS = 60_000;

// ---------------------------------------------------------------- harnesses

function ffxEngine(chapter: Chapter, seed: number) {
  const content = new FFXContentRegistry();
  content.addAbilities(ffxData.ALL_ABILITIES);
  content.addItems(Object.values(ffxData.ITEMS));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setupFor(chapter, seed));
  return engine;
}

function ffx2Engine(chapter: Chapter, seed: number): FFX2Engine {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(ffx2Data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2Data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2Data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2Data.GARMENT_GRIDS)),
    minigames: false,
  });
  engine.init(setupFor(chapter, seed));
  return engine;
}

/** Exactly what `BattleScreenSetup.setupForChapter` builds. */
function setupFor(chapter: Chapter, seed: number): BattleSetup {
  return {
    game: chapter.game,
    party: chapter.buildRef,
    enemies: chapter.enemyGroupRef,
    triggers: chapter.scriptsRef?.mid ?? [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
}

function fallback(commands: AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.validTargets.length > 0);
  return r ? ({ ...r.command, targets: [r.validTargets[0]!] } as Command) : null;
}

function attack(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const r = d.commands.find((c) => c.command.kind === 'attack' && c.enabled);
  const t = r?.validTargets[0];
  return { kind: 'attack', targets: t ? [t] : [] };
}

/** Play a chapter to an outcome with the shipped intended line; return its log. */
function play(chapter: Chapter, seed: number): { outcome: string | undefined; log: string } {
  if (chapter.game === 'ffx') {
    const engine = ffxEngine(chapter, seed);
    let outcome: string | undefined;
    for (let i = 0; i < MAX_DECISIONS; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        outcome = d.result.outcome;
        break;
      }
      if (d.kind === 'player-input') {
        engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? attack(d));
      }
    }
    return { outcome, log: (engine.state().log as BattleEvent[]).map((e) => JSON.stringify(e)).join('\n') };
  }
  const engine = ffx2Engine(chapter, seed);
  const log: BattleEvent[] = [];
  let outcome: string | undefined;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = d.result.outcome;
      break;
    }
    if (d.kind === 'resolved') {
      log.push(...d.events);
      continue;
    }
    if (d.kind === 'waiting') {
      log.push(...engine.tick(d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') break;
    const cmd = intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d.commands);
    if (!cmd) break;
    log.push(...engine.submit(cmd));
  }
  return { outcome, log: log.map((e) => JSON.stringify(e)).join('\n') };
}

function freshState(chapter: Chapter): unknown {
  return chapter.game === 'ffx' ? ffxEngine(chapter, 1).state() : ffx2Engine(chapter, 1).state();
}

// ------------------------------------------------------------- object walks

/** Every object reachable from `root`, mapped to the path it was found at. */
function reachable(root: unknown, label: string): Map<unknown, string> {
  const out = new Map<unknown, string>();
  const visit = (node: unknown, path: string): void => {
    if (node === null || typeof node !== 'object') return;
    if (out.has(node)) return;
    out.set(node, path);
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) visit(v, `${path}.${k}`);
  };
  visit(root, label);
  return out;
}

/** Paths in `state` whose object is reference-identical to one in `data`. */
function sharedWith(state: unknown, data: Map<unknown, string>): string[] {
  const hits: string[] = [];
  const seen = new Set<unknown>();
  const visit = (node: unknown, path: string): void => {
    if (node === null || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);
    const where = data.get(node);
    if (where !== undefined) {
      hits.push(`${path} === ${where}`);
      return; // its children are shared too; one line per leak is enough
    }
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) visit(v, `${path}.${k}`);
  };
  visit(state, 'state');
  return hits;
}

function deepFreeze(value: unknown, seen = new Set<unknown>()): void {
  if (value === null || typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);
  Object.freeze(value);
  for (const v of Object.values(value as Record<string, unknown>)) deepFreeze(v, seen);
}

// ------------------------------------------------------------------- tests

describe('a fresh battle shares no object with the shipped records', () => {
  for (const chapter of CHAPTERS) {
    it(`${chapter.id} (${chapter.game})`, () => {
      const data = reachable(chapter.enemyGroupRef, `group(${chapter.enemyGroupRef.id})`);
      for (const [k, v] of reachable(chapter.buildRef, `build(${chapter.id})`)) {
        if (!data.has(k)) data.set(k, v);
      }
      const hits = sharedWith(freshState(chapter), data);
      expect(hits, `live state still points at the shipped records:\n${hits.join('\n')}`).toEqual([]);
    });
  }
});

describe('writing through the live state cannot reach the shipped records', () => {
  it('FFX: the boss steal table is the battle’s own copy', () => {
    const group = ffxData.ENEMY_GROUPS_BY_ID['seymour-flux'];
    const shipped = group?.enemies[0]?.rewards.steal;
    expect(shipped, 'the fixture needs a boss with a steal table').toBeDefined();
    const before = shipped!.baseChance;

    const state = ffxEngine(CHAPTERS.find((c) => c.id === 'seymour-flux')!, 1).state();
    const live = (state.combatants['seymour-flux'] as { enemy?: { rewards: { steal?: { baseChance: number } } } })
      .enemy?.rewards.steal;
    expect(live).toBeDefined();
    live!.baseChance = 1;

    expect(shipped!.baseChance, 'a battle must not rewrite the shipped steal table').toBe(before);
  });

  it('FFX: a form override written in one battle does not leak into the next', () => {
    const chapter = CHAPTERS.find((c) => c.id === 'braskas-final-aeon')!;
    const shipped = chapter.enemyGroupRef.enemies[0]?.forms[1]?.statOverrides as Record<string, number> | undefined;
    expect(shipped, 'the fixture needs a boss whose second form overrides stats').toBeDefined();
    const before = JSON.stringify(shipped);

    const state = ffxEngine(chapter, 1).state();
    const forms = (state.combatants[chapter.enemyGroupRef.enemies[0]!.id] as {
      enemy?: { forms: Array<{ statOverrides?: Record<string, number> }> };
    }).enemy?.forms;
    expect(forms?.[1]?.statOverrides).toBeDefined();
    forms![1]!.statOverrides!['str'] = 999;

    expect(JSON.stringify(shipped)).toBe(before);
  });

  it('FFX-2: the boss form list and reward block are the battle’s own copies', () => {
    const chapter = CHAPTERS.find((c) => c.id === 'ffx2-bahamut')!;
    const shippedEnemy = chapter.enemyGroupRef.enemies[0]!;
    const before = JSON.stringify({ forms: shippedEnemy.forms, rewards: shippedEnemy.rewards });

    const state = ffx2Engine(chapter, 1).state();
    const live = (state.combatants[shippedEnemy.id] as {
      enemy?: { forms: Array<{ name: string }>; rewards: { gil: number } };
    }).enemy;
    expect(live).toBeDefined();
    live!.forms.push({ name: 'not a real form' } as never);
    live!.rewards.gil = -1;

    expect(JSON.stringify({ forms: shippedEnemy.forms, rewards: shippedEnemy.rewards })).toBe(before);
  });

  it('FFX-2: a girl’s learned-ability record is the battle’s own copy', () => {
    const chapter = CHAPTERS.find((c) => c.id === 'ffx2-vegnagun-shuyin')!;
    const shipped = (chapter.buildRef as { members: Array<{ id: string; abilitiesLearned: unknown }> }).members[0]!;
    const before = JSON.stringify(shipped.abilitiesLearned);

    const state = ffx2Engine(chapter, 1).state();
    const live = (state.combatants[shipped.id] as { dresspheres?: { abilitiesLearned: Record<string, unknown> } })
      .dresspheres?.abilitiesLearned;
    expect(live).toBeDefined();
    (live as Record<string, unknown>)['zz-not-a-real-dressphere'] = { ap: 1 };

    expect(JSON.stringify(shipped.abilitiesLearned)).toBe(before);
  });
});

describe('the shipped records survive a whole chapter, frozen', () => {
  it('no engine writes through them, in either game', () => {
    for (const chapter of CHAPTERS) {
      deepFreeze(chapter.enemyGroupRef);
      deepFreeze(chapter.buildRef);
    }
    deepFreeze(ffxData.ENEMY_GROUPS_BY_ID);
    deepFreeze(ffx2Data.ENEMY_GROUPS_BY_ID);

    // ES modules are strict mode, so a write to a frozen property throws.
    for (const chapter of CHAPTERS) {
      const r = play(chapter, 7);
      expect(r.outcome, `${chapter.id} must still reach an outcome`).toBeDefined();
    }
  }, 60_000);
});

describe('a chapter at a fixed seed does not depend on what ran before it', () => {
  it('Chapter 1 at seed 1 replays identically in both orders, with other chapters in between', () => {
    const ch1 = CHAPTERS.find((c) => c.id === 'seymour-flux')!;
    const others = CHAPTERS.filter((c) => c.id !== 'seymour-flux');

    // Order A: Chapter 1 first, then everything else, then Chapter 1 again.
    const first = play(ch1, 1);
    for (const c of others) play(c, 1);
    const afterOthers = play(ch1, 1);

    expect(afterOthers.log, 'the same seed must produce the same battle').toBe(first.log);
    expect(afterOthers.outcome).toBe(first.outcome);

    // Order B: the other chapters twice over, in the opposite order, first.
    for (const c of [...others].reverse()) play(c, 1);
    for (const c of others) play(c, 1);
    const afterReversed = play(ch1, 1);

    expect(afterReversed.log, 'and the order the others ran in must not matter').toBe(first.log);
  }, 60_000);

  it('Chapter 4 at seed 1 replays identically after the FFX chapters have run', () => {
    const ch4 = CHAPTERS.find((c) => c.id === 'ffx2-bahamut')!;
    const first = play(ch4, 1);
    for (const c of CHAPTERS.filter((c) => c.game === 'ffx')) play(c, 1);
    const again = play(ch4, 1);
    expect(again.log).toBe(first.log);
  }, 60_000);
});
