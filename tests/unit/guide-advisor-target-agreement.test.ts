/**
 * Cross-panel agreement on **who a command is aimed at**, between the
 * strategy guide's NEXT line (`src/engine/tactics/guide.ts`) and the move
 * advisor's top suggestion (`src/engine/tactics/advisor.ts`), across real
 * battles for all five chapters.
 *
 * ## The bug this pins
 *
 * The pre-deploy critic (2026-09-18) caught the guide printing a party-wide
 * or all-enemy command as if it were aimed at one character, on the very
 * frame the advisor correctly scoped it — same command, same decision, two
 * different answers:
 *
 *   - Chapter 1 & 2: `Hastega -> Tidus` (guide) vs `Hastega -> the party` (advisor)
 *   - Chapter 3: `Stamina Tonic -> Tidus` vs `Stamina Tonic -> the party`
 *   - Chapter 4: `Shell -> Yuna` vs `Shell -> the party`
 *   - Chapter 5: `Pray -> Yuna` vs `Pray -> the party`
 *
 * Root cause: `guide.ts` printed `target?.name` — the one combatant id the
 * command happens to carry so the engine can resolve it — with no scoping by
 * the ability's `Targeting`, while `advisor.ts`'s `candidateFor` already
 * special-cased `all-allies` / `all-enemies` / `all`. Both panels now read
 * that word from the same place: `src/engine/tactics/targetLabel.ts`
 * (`tests/unit/target-label.test.ts` covers that module directly, in
 * isolation from any engine).
 *
 * This file is the integration half: it drives all five chapters' real
 * engines with the shipped `intendedStrategy` (the same line both panels
 * preview) far enough to reach each of the four moves above, and checks that
 * whenever the guide prints a target for the strategy's command, the advisor
 * — asked about the very same command on the very same board — prints the
 * identical word. It also confirms the specific moves above now read "the
 * party", and that an ordinary single-target command still names the
 * character.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleState,
  Command,
  Decision,
  FFXPartyBuild,
  FFX2PartyBuild,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine, type FFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as ffx2Data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView, type GuideDecision } from '../../src/engine/tactics/guide.ts';
import { buildAdvisorView, type AdvisorOptions } from '../../src/engine/tactics/advisor.ts';

const SEED = 42;

// --------------------------------------------------------------- fixtures

function newFfxEngine(groupId: string, party: FFXPartyBuild): { engine: FFXEngine; content: FFXContentRegistry } {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed: SEED, condition: 'normal', canEscape: false });
  return { engine, content };
}

/** The registries `BattleScreenContent.ts` injects at boot, built the same way. */
function ffx2Options() {
  return {
    abilities: abilityRegistryFrom(Object.values(ffx2Data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2Data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2Data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2Data.GARMENT_GRIDS)),
    minigames: false,
  };
}

function newFfx2Engine(groupId: string, party: FFX2PartyBuild): FFX2Engine {
  const group = ffx2Data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the data layer`);
  const engine = new FFX2Engine(ffx2Options());
  engine.init({ game: 'ffx2', party, enemies: group, triggers: [], seed: SEED, condition: 'normal', canEscape: false });
  return engine;
}

/** Any enabled row with a legal target — only used if the strategy declines. */
function fallback(commands: AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.validTargets.length > 0);
  return r ? ({ ...r.command, targets: [r.validTargets[0]!] } as Command) : null;
}

/** The two commands compared, reduced to what the player would actually press. */
function shape(c: Command): string {
  const id = 'id' in c ? String((c as { id?: unknown }).id) : '';
  return `${c.kind}:${id}:${[...c.targets].join(',')}`;
}

// -------------------------------------------------------------- the check

interface Watch {
  /** `"<ability-or-item id>"` this run is specifically looking for. */
  id: string;
  /** Set once the guide has printed a target for that command. */
  seenLabel: string | null;
}

interface Comparison {
  /** Player decisions walked. */
  decisions: number;
  /** Decisions where the guide printed a NEXT target and the advisor showed the same command. */
  compared: number;
  mismatches: string[];
}

function compareOne(
  state: Readonly<BattleState>,
  decision: GuideDecision,
  advisorOptions: AdvisorOptions,
  result: Comparison,
  watch: Watch,
): void {
  const view = buildGuideView(state, decision);
  const next = view?.next;
  if (!next || next.targetId === null) return; // no-target commands (Defend, Escape…) carry nothing to compare

  if ('id' in next.command && String((next.command as { id: unknown }).id) === watch.id) {
    watch.seenLabel = next.targetName;
  }

  const advisorView = buildAdvisorView(state, decision, advisorOptions);
  const match = advisorView?.suggestions.find((s) => shape(s.command) === shape(next.command));
  if (!match) return; // not one of the one-or-two rows the card actually shows this turn

  result.compared++;
  if (match.targetName !== next.targetName) {
    result.mismatches.push(
      `${next.label} (${shape(next.command)}): guide said "${next.targetName}", advisor said "${match.targetName}"`,
    );
  }
}

function walkFfx(
  engine: FFXEngine,
  content: FFXContentRegistry,
  maxDecisions: number,
  watch: Watch,
): Comparison {
  const result: Comparison = { decisions: 0, compared: 0, mismatches: [] };
  const advisorOptions: AdvisorOptions = { ffxContent: content };
  for (let i = 0; i < maxDecisions; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'resolved') continue;
    if (d.kind !== 'player-input') break;
    result.decisions++;
    const state = engine.state();
    const decision: GuideDecision = { actorId: d.actorId, commands: d.commands };
    compareOne(state, decision, advisorOptions, result, watch);
    const chosen = intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d.commands);
    if (!chosen) break;
    engine.submit(chosen);
  }
  return result;
}

function walkFfx2(engine: FFX2Engine, maxDecisions: number, watch: Watch): Comparison {
  const result: Comparison = { decisions: 0, compared: 0, mismatches: [] };
  const options = ffx2Options();
  const advisorOptions: AdvisorOptions = { ffx2: { abilities: options.abilities, items: options.items } };
  for (let i = 0; i < maxDecisions; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'resolved') continue;
    if (d.kind === 'waiting') {
      engine.tick(d.nextEventMs);
      continue;
    }
    if (d.kind !== 'player-input') break;
    result.decisions++;
    const state = engine.state();
    const decision: GuideDecision = { actorId: d.actorId, commands: d.commands };
    compareOne(state, decision, advisorOptions, result, watch);
    const chosen = intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d.commands);
    if (!chosen) break;
    engine.submit(chosen);
  }
  return result;
}

// ------------------------------------------------------------------ tests

describe('the guide and the advisor never disagree about who a command hits', () => {
  // Budgets below are counts of raw `nextDecision()` calls, not player
  // decisions — most of them come back `'resolved'` (an animation/log step)
  // between the actual player-input turns, so the number always looks
  // generous next to how few real decisions it takes to reach the named
  // move (checked directly against a real run of each chapter at seed 42,
  // not guessed).
  it('Chapter 1 (Seymour Flux): Hastega reads "the party" on both panels', () => {
    const { engine, content } = newFfxEngine('seymour-flux', gagazetBuild);
    const watch: Watch = { id: 'hastega', seenLabel: null };
    // Hastega is Tidus's 4th decision (raw index 9 of 20).
    const result = walkFfx(engine, content, 15, watch);
    expect(result.decisions).toBeGreaterThan(0);
    expect(result.mismatches).toEqual([]);
    expect(watch.seenLabel, 'Hastega should have been recommended within the walked decisions').toBe('the party');
  });

  it('Chapter 2 (Yunalesca): Hastega reads "the party" on both panels', () => {
    const { engine, content } = newFfxEngine('yunalesca', zanarkandBuild);
    const watch: Watch = { id: 'hastega', seenLabel: null };
    const result = walkFfx(engine, content, 10, watch);
    expect(result.decisions).toBeGreaterThan(0);
    expect(result.mismatches).toEqual([]);
    expect(watch.seenLabel).toBe('the party');
  });

  it("Chapter 3 (Braska's Final Aeon): Stamina Tonic reads \"the party\" on both panels", () => {
    const { engine, content } = newFfxEngine('braskas-final-aeon', dreamsEndBuild);
    const watch: Watch = { id: 'stamina-tonic', seenLabel: null };
    // Stamina Tonic is the very first decision of the chapter (raw index 2).
    const result = walkFfx(engine, content, 10, watch);
    expect(result.decisions).toBeGreaterThan(0);
    expect(result.mismatches).toEqual([]);
    expect(watch.seenLabel).toBe('the party');
  });

  it('Chapter 4 (FFX-2 Bahamut): Shell reads "the party" on both panels', () => {
    const engine = newFfx2Engine('ffx2-bahamut', bevelleBuild);
    const watch: Watch = { id: 'x2-white-mage-shell', seenLabel: null };
    // Shell is Yuna's 2nd decision (raw index 4 of 20).
    const result = walkFfx2(engine, 15, watch);
    expect(result.decisions).toBeGreaterThan(0);
    expect(result.mismatches).toEqual([]);
    expect(watch.seenLabel).toBe('the party');
  });

  it('Chapter 5 (FFX-2 Vegnagun/Shuyin): Pray reads "the party" on both panels', () => {
    const group = VEGNAGUN_CHAIN_ORDER[0]!;
    const engine = newFfx2Engine(group, farplaneBuild);
    const watch: Watch = { id: 'x2-white-mage-pray', seenLabel: null };
    // Pray is Yuna's 2nd decision (raw index 4 of 20); the very first decision
    // (Paine's Black Sky) is an all-enemies move too, covered by the mismatch
    // check across the whole walk.
    const result = walkFfx2(engine, 15, watch);
    expect(result.decisions).toBeGreaterThan(0);
    expect(result.mismatches).toEqual([]);
    expect(watch.seenLabel).toBe('the party');
  });

  it('a single-target command still names the character, on both panels', () => {
    // Chapter 1's very first player decision (seed 42) is Holy Water on Tidus
    // himself — single-ally, so both panels must keep his name rather than
    // scoping it (raw index 3 of 6).
    const { engine, content } = newFfxEngine('seymour-flux', gagazetBuild);
    const watch: Watch = { id: 'holy-water', seenLabel: null };
    const result = walkFfx(engine, content, 6, watch);
    expect(result.decisions).toBeGreaterThan(0);
    expect(result.mismatches).toEqual([]);
    expect(watch.seenLabel).toBe('Tidus');
  });

  it('an all-enemies command reads "all enemies" on both panels (Chapter 5 opener)', () => {
    const group = VEGNAGUN_CHAIN_ORDER[0]!;
    const engine = newFfx2Engine(group, farplaneBuild);
    // Black Sky is the chapter's very first decision (raw index 2).
    const watch: Watch = { id: 'x2-dark-knight-black-sky', seenLabel: null };
    const result = walkFfx2(engine, 3, watch);
    expect(result.decisions).toBeGreaterThan(0);
    expect(result.mismatches).toEqual([]);
    expect(watch.seenLabel).toBe('all enemies');
  });
});
