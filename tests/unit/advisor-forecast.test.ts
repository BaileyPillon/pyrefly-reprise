/**
 * The enemy-intent forecast, **in the configuration the game actually ships**.
 *
 * Round 1 of this fix added a rule that refused to raise an ally into a
 * telegraphed re-kill, and shipped it dead: `AdvisorOptions.intent` was never
 * passed by either HUD, so every green assertion for the rule injected the
 * forecast by hand — a configuration no shipped code path produces. The critic
 * reproduced it on the built preview: the intent slab announcing "Lance of
 * Atrophy · Zombie 50%" over Seymour's head while the card underneath offered a
 * Mega Phoenix and said nothing [fix-3 round 1, F2 and F3].
 *
 * So every test in this file builds its advisor the way `FFXBattleHud` and
 * `FFX2BattleHud` build theirs — `{ ffxContent }` and `{ ffx2: { abilities,
 * items } }`, **never** an `intent` option — and asserts on what the card would
 * print from the board alone. `advisor-ownership.test.ts` keeps the two
 * hand-injected cases, which are still worth having: they pin the shape a HUD
 * would pass if one ever does.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleState,
  Command,
  CombatantId,
  Decision,
  FFX2PartyBuild,
  FFXPartyBuild,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as ffx2Data from '../../src/data/ffx2/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { seymourFluxGroup } from '../../src/data/ffx/enemies/seymour-flux.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';
import { buildAdvisorView, type AdvisorOptions } from '../../src/engine/tactics/advisor.ts';
import { forecastFromState } from '../../src/engine/tactics/advisor-forecast.ts';
import {
  type AdvisorIntent,
  reviveCaution,
  reviveRisk,
} from '../../src/engine/tactics/advisor-revive.ts';

// ------------------------------------------------------------------ the rig

function ffxContent(): FFXContentRegistry {
  const c = new FFXContentRegistry();
  c.addAbilities(ALL_ABILITIES);
  c.addItems(Object.values(ITEMS));
  return c;
}

interface Board {
  state: BattleState;
  decision: { actorId: CombatantId; commands: AvailableCommand[] };
  /** Exactly what `FFXBattleHud` hands its advisor: the content registry, nothing else. */
  options: AdvisorOptions;
}

/**
 * Bailey's board: Chapter 1, Tidus deciding, Yuna face-down at 0/1500, Kimahri
 * up — and `p1Step` pinned, which is the only thing standing between a test and
 * a named step of Seymour's real six-step cycle.
 */
function baileysBoard(p1Step?: number, seed = 1): Board {
  const content = ffxContent();
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: gagazetBuild,
    enemies: seymourFluxGroup,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  for (let i = 0; i < 80; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    if (d.actorId === 'tidus') {
      const state = structuredClone(engine.state()) as BattleState;
      const yuna = state.combatants['yuna']!;
      yuna.hp = 0;
      yuna.alive = false;
      if (p1Step !== undefined) {
        state.flags['seymour.p1Step'] = p1Step;
        // Nobody "acted last", so neither enemy is in the alternation guard's
        // pass branch and both answer with a real command.
        state.flags['seymour.lastEnemyActor'] = 'nobody';
      }
      return { state, decision: { actorId: d.actorId, commands: d.commands }, options: { ffxContent: content } };
    }
    const row = d.commands.find((c) => c.enabled)!;
    const fallback = { ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] } as Command;
    engine.submit(recommendedCommand(engine.state(), d) ?? fallback);
  }
  throw new Error('Chapter 1 gave no Tidus decision inside 80 steps');
}

// ------------------------------------------------- it runs with nothing wired

describe('the advisor builds its own forecast, from the board', () => {
  it('reads Seymour’s real cycle out of state.flags', () => {
    // Steps 0 and 2 are his Lance of Atrophy turns; the mount's step 5 is Cross
    // Cleave [`ai/seymour-flux.ts` §4.2]. Nothing is injected here: the flags
    // are the engine's own and the prediction is the engine's own script.
    const lance = forecastFromState(baileysBoard(0).state, baileysBoard(0).options);
    expect(lance?.moveName).toBe('Lance of Atrophy');
    expect(lance?.confidence).toBe('scripted');

    const cleave = forecastFromState(baileysBoard(5).state, baileysBoard(5).options);
    expect(cleave?.moveName).toBe('Cross Cleave');
    // The worst of the two enemies wins the reading: whichever acts first, both
    // act before a raised ally does.
    expect(cleave?.estimate?.perTarget.length).toBeGreaterThanOrEqual(2);
  });

  it('never throws, and never names a move that is not one, on any chapter', () => {
    for (const chapter of CHAPTERS) {
      const { engine, options } = rigFor(chapter.id, 3);
      const tick = (engine as { tick?: (ms: number) => unknown }).tick?.bind(engine);
      let seen = 0;
      for (let i = 0; i < 200 && seen < 12; i++) {
        const d: Decision = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'waiting') {
          if (!tick) break;
          tick(Math.max(1, d.nextEventMs));
          continue;
        }
        if (d.kind !== 'player-input') continue;
        const state = engine.state();
        const intent = forecastFromState(state, options);
        seen += 1;
        if (intent) {
          expect(intent.moveName.length).toBeGreaterThan(0);
          expect(typeof intent.enemyName).toBe('string');
          for (const t of intent.estimate?.perTarget ?? []) {
            expect(state.combatants[t.targetId]).toBeDefined();
          }
        }
        const row = d.commands.find((c) => c.enabled);
        if (!row) break;
        engine.submit({ ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] } as Command);
      }
      expect(seen).toBeGreaterThan(0);
    }
  }, 120_000);
});

// ------------------------------------------- the card, with no HUD wiring

describe('the safety rule fires on a live board, with no `intent` option', () => {
  it('holds the revive back from a sweep nobody can stand outside of', () => {
    const { state, decision, options } = baileysBoard(5);
    // The advisor as `FFXBattleHud` builds it. No `intent`, no forecast passed.
    expect(options.intent).toBeUndefined();
    const view = buildAdvisorView(state, decision, options)!;

    expect(view.note).toMatch(/Cross Cleave/);
    expect(view.note).toMatch(/Yuna/);
    expect(view.note).not.toMatch(/§|ffx-/i);
    // And the raise is not offered into it.
    expect(view.suggestions.some((s) => /phoenix|life/i.test(s.label))).toBe(false);
  });

  it('still offers the revive against a single-target threat, and says what is coming', () => {
    const { state, decision, options } = baileysBoard(0);
    const view = buildAdvisorView(state, decision, options)!;

    // Two of Seymour's three phase-1 turns are Lance of Atrophy and it picks
    // one random living target — which is not a reason to leave the summoner on
    // the floor for two turns out of three. The revive stands, with the
    // telegraph printed beside it.
    const revive = view.suggestions.find((s) => /phoenix|life/i.test(s.label));
    expect(revive, view.suggestions.map((s) => s.label).join(', ')).toBeDefined();
    expect(revive!.warning).toMatch(/Lance of Atrophy/);
    expect(revive!.warning).toMatch(/before Yuna can act/);
    expect(view.note).toBe('');
  });

  it('says nothing at all when the next move threatens nobody', () => {
    // Step 3 is the mount's Full-Life and Seymour's Dispel — no damage, no
    // re-kill, so no warning and no wait.
    const { state, decision, options } = baileysBoard(3);
    const view = buildAdvisorView(state, decision, options)!;
    expect(view.note).toBe('');
    const revive = view.suggestions.find((s) => /phoenix|life/i.test(s.label));
    expect(revive?.warning ?? '').toBe('');
  });
});

// --------------------------------------------------- what a refusal requires

describe('a refusal needs a re-kill that is actually guaranteed', () => {
  const board = (): Board => baileysBoard(3);

  function intent(over: Partial<AdvisorIntent> = {}): AdvisorIntent {
    return {
      enemyName: 'Seymour Flux',
      moveName: 'Lance of Atrophy',
      abilityId: 'lance-of-atrophy',
      actsNext: true,
      turnsAway: 0,
      estimate: { perTarget: [{ targetId: 'tidus', lethal: false, amount: 900 }] },
      charge: null,
      ...over,
    };
  }

  it('refuses when the forecast is aimed at the body on the floor', () => {
    const { state } = board();
    const aimed = intent({ estimate: { perTarget: [{ targetId: 'yuna', lethal: true, amount: 9999 }] } });
    expect(reviveRisk(state, 'yuna', aimed)?.kind).toBe('aimed');
  });

  it('refuses a sweep only when it out-damages what the raise gives back', () => {
    const { state } = board();
    const sweep = (amount: number): AdvisorIntent =>
      intent({
        moveName: 'Cross Cleave',
        abilityId: 'cross-cleave',
        estimate: {
          perTarget: [
            { targetId: 'tidus', lethal: false, amount },
            { targetId: 'kimahri', lethal: false, amount },
          ],
        },
      });
    // A Phoenix Down's sliver — 120 HP back against 2,400 a head.
    expect(reviveRisk(state, 'yuna', sweep(2_400), 120)?.kind).toBe('sweep');
    // A Mega Phoenix's full bar against a scratch: worth the turn.
    expect(reviveRisk(state, 'yuna', sweep(80), 1_500)).toBeNull();
  });

  it('does not refuse for a single-target move that may pick somebody else', () => {
    const { state } = board();
    expect(reviveRisk(state, 'yuna', intent())).toBeNull();
    expect(reviveCaution(state, 'yuna', intent(), 120)).toMatch(/Lance of Atrophy/);
  });

  it('never refuses on a branch the forecast only calls likely', () => {
    const { state } = board();
    const coinToss = intent({
      confidence: 'likely',
      estimate: { perTarget: [{ targetId: 'yuna', lethal: true, amount: 9999 }] },
    });
    expect(reviveRisk(state, 'yuna', coinToss)).toBeNull();
  });

  it('says nothing beside a raise that comes back above the hit', () => {
    const { state } = board();
    const scratch = intent({
      moveName: 'Water',
      abilityId: 'water',
      estimate: { perTarget: [{ targetId: 'tidus', lethal: false, amount: 200 }] },
    });
    expect(reviveCaution(state, 'yuna', scratch, 1_500)).toBe('');
    expect(reviveCaution(state, 'yuna', scratch, 100)).toMatch(/before Yuna can act/);
  });
});

// ------------------------------------------------------------------- FFX-2

describe('X-2 gets the same reading, from the same place', () => {
  it('forecasts an X-2 boss with the registries the HUD already passes', () => {
    const { engine, options } = rigFor('ffx2-bahamut', 5);
    const tick = (engine as { tick?: (ms: number) => unknown }).tick?.bind(engine);
    let intent: AdvisorIntent | null = null;
    for (let i = 0; i < 200 && !intent; i++) {
      const d: Decision = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        if (!tick) break;
        tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      intent = forecastFromState(engine.state(), options);
      if (intent) break;
      const row = d.commands.find((c) => c.enabled);
      if (!row) break;
      engine.submit({ ...row.command, targets: row.validTargets[0] ? [row.validTargets[0]] : [] } as Command);
    }
    expect(intent).not.toBeNull();
    expect(intent!.moveName.length).toBeGreaterThan(0);
    expect(intent!.actsNext).toBe(true);
  }, 60_000);
});

// ---------------------------------------------------------------- shared rig

function ffx2Options() {
  return {
    abilities: abilityRegistryFrom(Object.values(ffx2Data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2Data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2Data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2Data.GARMENT_GRIDS)),
  };
}

/** One chapter's engine and exactly the advisor options its HUD would pass. */
function rigFor(chapterId: string, seed: number) {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`${chapterId} is not a chapter`);
  const setup = {
    game: chapter.game,
    party: chapter.buildRef as FFXPartyBuild | FFX2PartyBuild,
    enemies: chapter.enemyGroupRef,
    triggers: [],
    seed,
    condition: 'normal' as const,
    canEscape: false,
  };
  if (chapter.game === 'ffx') {
    const content = ffxContent();
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init(setup);
    return { engine, options: { ffxContent: content } as AdvisorOptions };
  }
  const opts = ffx2Options();
  const engine = new FFX2Engine({ ...opts, minigames: false });
  engine.setSeed(seed);
  engine.init(setup);
  return {
    engine,
    options: { ffx2: { abilities: opts.abilities, items: opts.items } } as AdvisorOptions,
  };
}
