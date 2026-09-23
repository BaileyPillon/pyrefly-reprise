/**
 * Reflect against the Vegnagun chain [research/ffx2-vegnagun-shuyin.md §3.1,
 * §3.2, §3.5, §7.2 CORRECTION].
 *
 * The research contradicted itself here and shipped the wrong half to the
 * player. §7.2's Leg row — the only untagged table in §7 — told the player to
 * "**Cast Reflect on the Leg**", and the chapter-5 strategy guide repeated it.
 * §3.2 line 236 lists the Leg as immune "as Tail **plus Reflect**" under
 * `[verified: 2 sources]`, the Nodes inherit that list ("as Leg plus Def/MDef
 * Up-Down"), and §3.5 line 441 restates it a third time: every Vegnagun part
 * but the Tail is Reflect-immune. The doc's own source-ranking policy (§0, §3
 * header) settles it in favour of the immunity, and §7.2 now carries a
 * CORRECTION note saying so.
 *
 * Two independent things stop the advice, and this file pins both so neither
 * can be relaxed by accident:
 *
 *  1. **The shipped spell cannot be aimed at an enemy at all.**
 *     `x2-white-mage-reflect` is `targeting: 'all-allies'`
 *     (`src/data/ffx2/abilities/white-mage.ts`), matching
 *     `ffx2-combat-core.md` §3.5's own target column ("party", against the "1
 *     any" rows beside it). `targeting.ts#resolveTargets` maps that to
 *     `alliesOf()`, so a requested enemy id is discarded in silence.
 *  2. **The Leg and the Nodes refuse the rider.** `LEG_IMMUNITIES.reflect =
 *     255` (`src/data/ffx2/enemies/vegnagun-leg.ts`), and `resolve.ts`'s
 *     `applyRiders` does `if (resist >= 255) continue` — no status, and no
 *     `miss` event either, so nothing on screen says it failed.
 *
 * The paired positive is what makes this a real check rather than an assertion
 * that nothing happened: §3.1 line 209 lists the **Tail** as explicitly *not*
 * Reflect-immune, and the same retargeted cast lands on it on every seed.
 *
 * **FFX-2 only** (hard rule 14): this is the X-2 ATB engine and the X-2 data
 * tables. FFX's Reflect — including the bounce `src/battle/ffx` implements and
 * X-2 does not — is sourced separately and untouched here.
 */

import { describe, expect, it } from 'vitest';
import type {
  AbilityDef,
  BattleEvent,
  BattleSetup,
  Command,
  Decision,
  EnemyGroupDef,
} from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import vegnagunLegGroup from '../../src/data/ffx2/enemies/vegnagun-leg.ts';
import vegnagunTailGroup from '../../src/data/ffx2/enemies/vegnagun-tail.ts';

/** Enough seeds to be a measurement, few enough to stay a unit test. */
const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

const REFLECT_ID = 'x2-white-mage-reflect';
const PARTY_IDS = ['yuna', 'rikku', 'paine'];
const NODE_IDS = ['node-a', 'node-b', 'node-c'];

/** The registries the app injects at boot, so this runs the shipped tables. */
function engineOptions(abilities: readonly AbilityDef[]) {
  return {
    abilities: abilityRegistryFrom(abilities),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    // Nobody can play a timed overlay headlessly; the engine rolls it instead.
    minigames: false,
  };
}

const SHIPPED_ABILITIES: readonly AbilityDef[] = Object.values(data.ABILITIES);

/**
 * The shipped table with Reflect widened to `single-any`.
 *
 * This exists **only** to take targeting off the table as an explanation. With
 * it the menu offers every unit on the board, so a zero result can only be the
 * `reflect: 255` immunity. It is a test-local copy: nothing in `src/` changes.
 */
const SINGLE_ANY_ABILITIES: readonly AbilityDef[] = SHIPPED_ABILITIES.map((a) =>
  a.id === REFLECT_ID ? { ...a, targeting: 'single-any' } : a,
);

function setupFor(group: EnemyGroupDef, seed: number): BattleSetup {
  return {
    game: 'ffx2',
    party: farplaneBuild,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
}

/** Plain Attack on the first legal target — what everyone but Yuna does here. */
function fallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row =
    d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

interface CastResult {
  /** Was the Reflect row in Yuna's menu at all? */
  offered: boolean;
  /** Ids the menu would let the cursor land on. */
  validTargets: readonly string[];
  /**
   * Did the cast actually finish?
   *
   * X-2 is ATB with per-ability charge time, so `submit` only *starts* the
   * spell. On some seeds Yuna is KO'd or the link ends before it lands; those
   * seeds prove nothing either way and are counted, not retried.
   */
  resolved: boolean;
  /** Everyone carrying Reflect once the cast resolved. */
  reflectOn: readonly string[];
  events: readonly BattleEvent[];
}

/**
 * Run `group` until Yuna's menu opens, cast Reflect at `aimAt`, then pump the
 * board until her action ends so the ATB charge has actually elapsed.
 */
function castReflectAt(
  group: EnemyGroupDef,
  aimAt: string,
  seed: number,
  abilities: readonly AbilityDef[],
): CastResult {
  const engine = new FFX2Engine(engineOptions(abilities));
  engine.setSeed(seed);
  engine.init(setupFor(group, seed));

  const miss: CastResult = { offered: false, validTargets: [], resolved: false, reflectOn: [], events: [] };

  for (let i = 0; i < 4000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return miss;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (d.actorId !== 'yuna') {
      engine.submit(fallback(d));
      continue;
    }

    const row = d.commands.find((c) => c.command.kind === 'ability' && c.command.id === REFLECT_ID);
    if (!row) return miss;

    const events: BattleEvent[] = [...engine.submit({ kind: 'ability', id: REFLECT_ID, targets: [aimAt] })];
    let resolved = events.some((e) => e.type === 'action-end' && e.actorId === 'yuna');
    for (let j = 0; j < 400 && !resolved; j++) {
      const n = engine.nextDecision();
      if (n.kind === 'battle-over') break;
      if (n.kind === 'waiting') events.push(...engine.tick(Math.max(1, n.nextEventMs)));
      else if (n.kind === 'resolved') events.push(...n.events);
      else if (n.kind === 'player-input') events.push(...engine.submit(fallback(n)));
      resolved = events.some((e) => e.type === 'action-end' && e.actorId === 'yuna');
    }

    const state = engine.state();
    return {
      offered: true,
      validTargets: row.validTargets,
      resolved,
      reflectOn: Object.values(state.combatants)
        .filter((c) => c.statuses['reflect'])
        .map((c) => c.id),
      events,
    };
  }
  return miss;
}

/** Every `status-add` of Reflect in an event log, by who received it. */
function reflectedBy(events: readonly BattleEvent[]): string[] {
  return events
    .filter((e): e is Extract<BattleEvent, { type: 'status-add' }> => e.type === 'status-add')
    .filter((e) => e.status === 'reflect')
    .map((e) => e.targetId);
}

// ---------------------------------------------------------------------------

describe('the data says what §3.1/§3.2 say', () => {
  it('the Leg and all three Nodes block Reflect; the Tail does not [§3.2, §3.1]', () => {
    const leg = vegnagunLegGroup.enemies.find((e) => e.id === 'vegnagun-leg');
    const tail = vegnagunTailGroup.enemies.find((e) => e.id === 'vegnagun-tail');
    expect(leg, 'the Leg record is missing').toBeDefined();
    expect(tail, 'the Tail record is missing').toBeDefined();

    // §3.2 line 236: "as Tail **plus Reflect**", `[verified: 2 sources]`.
    expect(leg?.immunities['reflect']).toBe(255);
    // §3.2 Node block: "as Leg plus Def Up/Down and MDef Up/Down".
    for (const part of vegnagunLegGroup.parts ?? []) {
      expect(part.immunities['reflect'], `${part.id} should inherit the Leg's list`).toBe(255);
    }
    // §3.1 line 209: the Tail's "**Not** immune" row names Reflect first.
    expect(tail?.immunities['reflect']).toBeUndefined();
  });

  it('the shipped Reflect is party-only, matching ffx2-combat-core §3.5', () => {
    const reflect = data.ABILITIES[REFLECT_ID];
    expect(reflect, 'Yuna learns this in farplaneBuild; it has to exist').toBeDefined();
    // `ffx2-combat-core.md` §3.5 gives its Tgt column as "party" — "Reflect on
    // all of target party" — against the "1 any" rows around it.
    expect(reflect?.targeting).toBe('all-allies');
    expect(reflect?.statusEffects).toEqual([{ status: 'reflect', chance: 254, duration: 255 }]);
  });
});

describe('the shipped Reflect cannot reach the Leg [§7.2 CORRECTION]', () => {
  it('never offers an enemy as a target, on any seed', () => {
    let offered = 0;
    for (const seed of SEEDS) {
      const r = castReflectAt(vegnagunLegGroup, 'vegnagun-leg', seed, SHIPPED_ABILITIES);
      if (!r.offered) continue;
      offered++;
      expect([...r.validTargets].sort(), `seed ${seed}`).toEqual([...PARTY_IDS].sort());
      for (const enemy of ['vegnagun-leg', ...NODE_IDS]) {
        expect(r.validTargets, `seed ${seed}: ${enemy} must not be aimable`).not.toContain(enemy);
      }
    }
    expect(offered, 'Yuna owns Reflect in farplaneBuild, so the row must appear').toBe(SEEDS.length);
  });

  it('aimed at the Leg anyway, it lands on the party and on no enemy', () => {
    let resolved = 0;
    for (const seed of SEEDS) {
      const r = castReflectAt(vegnagunLegGroup, 'vegnagun-leg', seed, SHIPPED_ABILITIES);
      // The aim is accepted by `submit` and discarded by `resolveTargets`; no
      // `miss` is emitted, so the only trace is where the status went.
      const landed = reflectedBy(r.events);
      for (const enemy of ['vegnagun-leg', ...NODE_IDS]) {
        expect(landed, `seed ${seed}: Reflect must never reach ${enemy}`).not.toContain(enemy);
      }
      expect(r.reflectOn, `seed ${seed}`).not.toContain('vegnagun-leg');
      if (!r.resolved) continue;
      resolved++;
      // The positive half: the cast really happened, it just went elsewhere.
      expect([...landed].sort(), `seed ${seed}`).toEqual([...PARTY_IDS].sort());
    }
    // A floor, not an equality: on a few seeds Yuna is KO'd mid-charge.
    expect(resolved, 'most seeds must actually resolve the cast').toBeGreaterThanOrEqual(
      SEEDS.length - 2,
    );
  });
});

describe('with targeting removed as a cause, the immunity is what refuses it', () => {
  it('a single-any Reflect still never lands on the Leg or on a Node', () => {
    let resolved = 0;
    for (const seed of SEEDS) {
      const atLeg = castReflectAt(vegnagunLegGroup, 'vegnagun-leg', seed, SINGLE_ANY_ABILITIES);
      // The widened row really can aim at the whole board — otherwise this
      // test would pass for the wrong reason.
      if (atLeg.offered) {
        expect(atLeg.validTargets, `seed ${seed}`).toContain('vegnagun-leg');
        expect(atLeg.validTargets, `seed ${seed}`).toContain('node-a');
      }
      expect(reflectedBy(atLeg.events), `seed ${seed}`).not.toContain('vegnagun-leg');
      expect(atLeg.reflectOn, `seed ${seed}`).not.toContain('vegnagun-leg');

      const atNode = castReflectAt(vegnagunLegGroup, 'node-a', seed, SINGLE_ANY_ABILITIES);
      expect(reflectedBy(atNode.events), `seed ${seed}`).not.toContain('node-a');
      expect(atNode.reflectOn, `seed ${seed}`).not.toContain('node-a');
      if (atLeg.resolved && atNode.resolved) resolved++;
    }
    expect(resolved, 'most seeds must actually resolve both casts').toBeGreaterThanOrEqual(
      SEEDS.length - 2,
    );
  });

  it('the same cast lands on the Tail every seed — §3.1 says it is not immune', () => {
    let landed = 0;
    let resolved = 0;
    for (const seed of SEEDS) {
      const r = castReflectAt(vegnagunTailGroup, 'vegnagun-tail', seed, SINGLE_ANY_ABILITIES);
      if (!r.resolved) continue;
      resolved++;
      expect(reflectedBy(r.events), `seed ${seed}`).toContain('vegnagun-tail');
      expect(r.reflectOn, `seed ${seed}`).toContain('vegnagun-tail');
      landed++;
    }
    expect(resolved, 'the Tail link is short; every seed should resolve').toBe(SEEDS.length);
    expect(landed, 'the paired positive: the engine can Reflect an enemy').toBe(SEEDS.length);
  });
});
