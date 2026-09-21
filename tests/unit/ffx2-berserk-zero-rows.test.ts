/**
 * Critic round 05, PR-0045 (critical, **FFX-2 only**).
 *
 * A Berserked girl wearing White Mage, Black Mage or Songstress was offered no
 * command at all: `buildCommands` gates the generic Attack row on the
 * dressphere's `hasAttack` (false for those three, `research/ffx2-combat-core.md`
 * §3.4-3.6) and gates abilities, spherechange and items on `!berserked` (§2.8),
 * so the list came out empty and the HUD opened a menu that could not be
 * answered. Reachable in shipped Chapter 5: Yuna starts in White Mage
 * (`src/data/ffx2/builds/farplane.ts`) and Vegnagun's Leg casts Berserk at 75%.
 *
 * Two halves, both asserted here:
 *
 * 1. §2.8 says a Berserked character "can only use the basic Attack command;
 *    **player loses control**" — so the turn is resolved by the engine and never
 *    offered at all.
 * 2. The invariant behind it: `buildCommands` never returns zero rows for a
 *    living, present unit, whatever the status and dressphere combination.
 *
 * FFX has no dressphere concept, every FFX character always has Attack, and its
 * menu is built in `src/battle/ffx/commands.ts` — nothing here applies to it
 * (AGENTS.md rule 14).
 */

import { beforeAll, describe, expect, it } from 'vitest';
import type { AutoStrategy } from '../../src/engine/BattlePresenter.ts';
import type { BattleEvent, Command, StatusId, StatusInstance } from '../../src/battle/common/types.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { buildCommands } from '../../src/battle/ffx2/targeting.ts';
import { chainRegistries, defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import { registerBattleContent, ffx2EngineOptions } from '../../src/app/screens/BattleScreenContent.ts';
import * as ffx2data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';

beforeAll(async () => {
  await registerBattleContent();
});

/** The four statuses the acceptance check names, as real status instances. */
const STATUS_IDS = ['berserk', 'itchy', 'confuse', 'stop'] as const;

function statusInstance(id: StatusId): StatusInstance {
  return { id, turnsRemaining: null, ticksRemaining: 10_000, charges: null, stacks: 1, permanent: false };
}

function girlWearing(sphereId: string, statuses: readonly StatusId[]): Ffx2Unit {
  const unit = aiUnit('yuna', 'party');
  unit.dresspheres = {
    current: sphereId,
    owned: [sphereId],
    garmentGrid: { id: 'first-steps', nodePosition: 0, passedGates: [], wornThisBattle: [] },
    abilitiesLearned: {},
  };
  for (const id of statuses) unit.statuses[id] = statusInstance(id);
  return unit;
}

function menuFor(sphereId: string, statuses: readonly StatusId[]) {
  const opts = ffx2EngineOptions();
  const unit = girlWearing(sphereId, statuses);
  const enemy = aiUnit('fiend', 'enemy');
  return buildCommands(unit, {
    units: [unit, enemy],
    abilities: chainRegistries(opts.abilities, defaultAbilities),
    dresspheres: opts.dresspheres!,
    // Escape would paper over the hole: the Chapter 5 chain cannot be escaped.
    canEscape: false,
  });
}

/** Every subset of the four statuses, so the crossings are all covered. */
function statusSubsets(): StatusId[][] {
  const out: StatusId[][] = [];
  for (let mask = 0; mask < 1 << STATUS_IDS.length; mask++) {
    out.push(STATUS_IDS.filter((_, i) => (mask & (1 << i)) !== 0) as StatusId[]);
  }
  return out;
}

function freshEngine(seed: number): FFX2Engine {
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(ffx2data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2data.GARMENT_GRIDS)),
    minigames: false,
  });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party: farplaneBuild,
    enemies: ffx2data.ENEMY_GROUPS_BY_ID['vegnagun-leg']!,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

class SilentHud implements HudPort {
  readonly seen: BattleEvent[] = [];
  /** Any call at all is the defect: an auto-resolved turn must not ask. */
  chooseCommandCalls = 0;
  mount(): void {}
  unmount(): void {}
  sync(): void {}
  syncVitals(): void {}
  onEvent(e: BattleEvent): void {
    this.seen.push(e);
  }
  async chooseCommand(): Promise<Command> {
    this.chooseCommandCalls += 1;
    throw new Error('the auto-play strategy answers, not the HUD');
  }
  async openMinigame(): Promise<never> {
    throw new Error('minigames off');
  }
  setVisible(): void {}
  setProjector(): void {}
}

describe('PR-0045 — buildCommands never offers an empty menu (FFX-2 only)', () => {
  it('every shipped dressphere crossed with berserk, itchy, confuse and stop', () => {
    const empties: string[] = [];
    for (const sphere of Object.values(ffx2data.STANDARD_DRESSPHERES)) {
      for (const statuses of statusSubsets()) {
        const rows = menuFor(sphere.id, statuses);
        if (rows.length === 0) empties.push(`${sphere.id} [${statuses.join('+') || 'no status'}]`);
      }
    }
    expect(empties, `offered no command at all: ${empties.join(', ')}`).toEqual([]);
  });

  it('the three no-Attack dresspheres, berserked, are the case that used to be empty', () => {
    for (const id of ['white-mage', 'black-mage', 'songstress']) {
      const rows = menuFor(id, ['berserk']);
      expect(rows.length, `${id} berserked`).toBeGreaterThan(0);
      // The fallback is a pass, not an invented damage row: the sources conflict
      // (§2.8 "only Attack" vs §3.4-3.6 "no Attack command"), so nothing is made
      // up here — AGENTS.md hard rule 6.
      expect(rows.every((row) => row.command.kind !== 'attack')).toBe(true);
      expect(rows.some((row) => row.command.kind === 'defend')).toBe(true);
    }
  });

  it('a dressphere that has Attack still offers exactly Attack when berserked', () => {
    const rows = menuFor('warrior', ['berserk']);
    expect(rows.map((row) => row.command.kind)).toEqual(['attack']);
  });
});

describe('PR-0045 — a Berserked FFX-2 turn resolves without the player (§2.8)', () => {
  it('nextDecision resolves it instead of returning player-input', () => {
    const engine = freshEngine(3);
    // Run the clock until Yuna's turn is the open decision.
    let decision = engine.nextDecision();
    let guard = 0;
    while (decision.kind !== 'player-input' && guard++ < 200) {
      if (decision.kind === 'waiting') engine.tick(decision.nextEventMs);
      decision = engine.nextDecision();
    }
    expect(decision.kind).toBe('player-input');
    const actorId = decision.kind === 'player-input' ? decision.actorId : '';
    const actor = engine.state().combatants[actorId]!;
    expect(actor.controller).toBe('player');

    // Berserk lands (Vegnagun's Leg, x2-vegnagun-leg-berserk, 75%).
    actor.statuses['berserk'] = statusInstance('berserk');
    const berserked = engine.nextDecision();
    expect(berserked.kind, 'a berserked girl must not be asked for a command').toBe('resolved');
    if (berserked.kind === 'resolved') {
      expect(berserked.events.some((e) => e.type === 'turn-start' && e.actorId === actorId)).toBe(true);
      expect(berserked.events.some((e) => e.type === 'action-end' && e.actorId === actorId)).toBe(true);
    }
  });

  it('White Mage (no Attack) passes the turn, so the ATB keeps running', () => {
    const engine = freshEngine(3);
    let decision = engine.nextDecision();
    let guard = 0;
    while (!(decision.kind === 'player-input' && decision.actorId === 'yuna') && guard++ < 200) {
      if (decision.kind === 'waiting') engine.tick(decision.nextEventMs);
      decision = engine.nextDecision();
    }
    expect(decision.kind === 'player-input' && decision.actorId).toBe('yuna');
    const yuna = engine.state().combatants['yuna'] as Ffx2Unit;
    expect(yuna.dresspheres?.current, 'Yuna starts Chapter 5 in White Mage').toBe('white-mage');
    yuna.statuses['berserk'] = statusInstance('berserk');

    const resolved = engine.nextDecision();
    expect(resolved.kind).toBe('resolved');
    // A pass, not a damage roll she has no command for.
    if (resolved.kind === 'resolved') {
      expect(resolved.events.some((e) => e.type === 'damage' && e.targetId !== 'yuna')).toBe(false);
    }
    // The gauge was spent, so the turn genuinely moved on and Berserk's own
    // 133-tick clock can run out (§2.8 duration table): she is no longer the
    // ready actor, and the engine's next decision is not hers.
    expect((engine.state().combatants['yuna'] as Ffx2Unit).atb.ticks).toBe(0);
    const after = engine.nextDecision();
    expect(after.kind === 'player-input' && after.actorId === 'yuna').toBe(false);
  });
});

describe('PR-0045 — Chapter 5 link 2 reaches an outcome on every seed', () => {
  it('vegnagun-leg through the real presenter, seeds 1-32 (seeds 3 and 13 are the reported stalls)', async () => {
    const stalls: string[] = [];
    let wins = 0;
    let losses = 0;
    for (let seed = 1; seed <= 32; seed++) {
      const engine = freshEngine(seed);
      const state = engine.state();
      const stage = new FakeStage([...state.activeIds], [...state.enemyIds]);
      const hud = new SilentHud();
      let zeroRow: string | null = null;
      const strategy: AutoStrategy = (actorId, commands, e) => {
        if (commands.length === 0) {
          zeroRow = `seed ${seed}: ${actorId} was offered no command`;
          return null;
        }
        return intendedStrategy(actorId, commands, e);
      };
      const presenter = new BattlePresenter({
        stage,
        hud,
        damageNumbers: new FakeDamageNumbers(),
        messageBar: new FakeMessageBar(),
        audio: new FakeAudio(),
        cutscenes: new FakeCutscenes(),
        sleep: () => Promise.resolve(),
      });
      presenter.setAutoPlay(strategy);
      const outcome = await presenter.run(engine);
      if (zeroRow) stalls.push(zeroRow);
      expect(outcome.kind, `seed ${seed} ended as ${outcome.kind}`).not.toBe('aborted');
      if (hud.seen.some((e) => e.type === 'victory')) wins++;
      else losses++;
      expect(hud.chooseCommandCalls, `seed ${seed} asked the HUD for a command`).toBe(0);
    }
    expect(stalls, stalls.join('\n')).toEqual([]);
    expect(wins + losses, 'every seed reached victory or defeat').toBe(32);
  }, 300_000);
});
