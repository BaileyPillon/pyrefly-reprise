/**
 * `AdvisorView.note` — the one sentence the card prints above the moves — and
 * the single rule it lives by: **it may only explain something the card is
 * actually showing.**
 *
 * This file exists because it did not. `advisor-revive.ts` writes cautions to
 * be printed *beside a recommended revive* ("…so cure the Zombie first", "take
 * the hit, then raise them"), and `advisor.ts` was asking it for one whenever
 * anybody was on the floor — whether or not a raise had been offered, and
 * whatever the card had actually picked. The pre-deploy gate replayed Chapter 1
 * at seed 1 and found the Zombie caution printed directly above Mighty Guard,
 * above Hastega and above a thrown Poison Fang, on three decisions out of four
 * [critic, pre-deploy gate 2026-09-18]. A card that tells the player to cure a
 * Zombie above a recommendation that is not a cure is worse than a card that
 * says nothing: it reads as the advisor contradicting itself.
 *
 * So the rule, as asserted here at every single decision of every chapter:
 *
 *  a. a **revive** is among the shown moves → its caution rides on that
 *     suggestion's own `warning`, and the note stays empty;
 *  b. the **cure** the note names is among the shown moves → the note is that
 *     pick's reason (`zombieCureReason`);
 *  c. an ally is **KO** and the revive was priced and refused as a guaranteed
 *     re-kill → the note says why it is missing and when to spend it;
 *  d. anything else → `''`.
 *
 * The scoring, the ranking and the card's DOM are elsewhere
 * (`advisor.test.ts`, `advisor-simulate.test.ts`, `ui-move-advisor.test.ts`);
 * nothing here touches a document.
 */

import { describe, expect, it } from 'vitest';
import type {
  AnyCombatant,
  AvailableCommand,
  BattleState,
  Command,
  Decision,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import * as ffx2data from '../../src/data/ffx2/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import {
  buildAdvisorView,
  type AdvisorOptions,
  type AdvisorView,
  type MoveSuggestion,
} from '../../src/engine/tactics/advisor.ts';

/** A generous bound per battle — a spinning engine must fail, not hang. */
const MAX_STEPS = 4_000;

// --------------------------------------------------------------- the engines

interface Harness {
  engine: {
    nextDecision: () => Decision;
    submit: (c: Command) => void;
    state: () => Readonly<BattleState>;
    tick?: (ms: number) => void;
  };
  options: AdvisorOptions;
}

function ffxHarness(groupId: string, seed: number, party = gagazetBuild): Harness {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return { engine: engine as unknown as Harness['engine'], options: { ffxContent: content } };
}

/** The registries `BattleScreenContent.ts` injects at boot, built the same way. */
function ffx2Harness(groupId: string, seed: number, party: unknown): Harness {
  const abilities = abilityRegistryFrom(Object.values(ffx2data.ABILITIES));
  const items = itemRegistryFrom(Object.values(ffx2data.ITEMS));
  const engine = new FFX2Engine({
    abilities,
    items,
    dresspheres: dressphereRegistryFrom(Object.values(ffx2data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2data.GARMENT_GRIDS)),
    minigames: false,
  });
  const group = ffx2data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the FFX-2 data layer`);
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  } as never);
  return { engine: engine as unknown as Harness['engine'], options: { ffx2: { abilities, items } } };
}

function harnessFor(chapterId: string, seed: number): Harness {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`no chapter "${chapterId}"`);
  return chapter.game === 'ffx2'
    ? ffx2Harness(chapter.enemyGroupRef.id, seed, chapter.buildRef)
    : ffxHarness(chapter.enemyGroupRef.id, seed, chapter.buildRef as never);
}

function fallback(commands: AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.validTargets.length > 0);
  return r ? ({ ...r.command, targets: [r.validTargets[0]!] } as Command) : null;
}

// ------------------------------------------------------------------ the rule

function downedAllies(state: Readonly<BattleState>): AnyCombatant[] {
  return state.activeIds
    .map((id) => state.combatants[id])
    .filter((c): c is AnyCombatant => c !== undefined && !c.alive && c.removed !== true);
}

/** A suggestion that stands somebody back up, read the way the card prints it. */
function isRevive(state: Readonly<BattleState>, s: MoveSuggestion): boolean {
  if (/revives a fallen ally/i.test(s.effect)) return true;
  return s.targetId !== null && state.combatants[s.targetId]?.alive === false;
}

/**
 * Why this decision's note breaks the rule, or `null`.
 *
 * Written as a *reason* rather than a boolean so a failure names the decision
 * and prints the card that produced it — which is the whole of what the gate's
 * report had to be reconstructed by hand.
 */
function noteFault(state: Readonly<BattleState>, view: AdvisorView): string | null {
  const note = view.note;
  if (!note) return null;

  // (b) A note that names a condition is an instruction to cure it, and it is
  //     only an answer when the cure is a row the player can actually press.
  const named = /\bZombie\b/.exec(note);
  if (named) {
    const cured = view.suggestions.some((s) => s.cures.some((c) => c === named[0]));
    return cured ? null : `names ${named[0]} but no shown move cures it`;
  }
  // (a) The caution about a revive that is on the card.
  if (view.suggestions.some((s) => isRevive(state, s))) return null;
  // (c) A revive the advisor refused: somebody is down, and the note says when.
  const down = downedAllies(state);
  if (down.length > 0 && down.some((c) => note.includes(c.name))) return null;
  return 'nobody is down and neither a revive nor a cure is on the card';
}

function describeCard(view: AdvisorView): string {
  const moves = view.suggestions
    .map((s) => `${s.label}->${s.targetName ?? s.targetId ?? ''}${s.warning ? ` (warns: ${s.warning})` : ''}`)
    .join(' | ');
  return `${view.actorName}: ${moves} :: note="${view.note}"`;
}

interface Seen {
  decisions: number;
  cards: string[];
  faults: string[];
  notes: number;
}

/**
 * Replay a chapter with the shipped auto-battler, building the advisor's card
 * at every player decision and checking the rule on each one.
 *
 * The strategy is `intendedStrategy` — the same line the game plays — so the
 * boards this walks are boards a player actually reaches, not hand-built
 * states. Battles that end before `want` decisions are re-run on the next seed.
 */
function walk(chapterId: string, seeds: readonly number[], want: number, collect = false): Seen {
  const seen: Seen = { decisions: 0, cards: [], faults: [], notes: 0 };
  for (const seed of seeds) {
    if (seen.decisions >= want) break;
    const { engine, options } = harnessFor(chapterId, seed);
    for (let i = 0; i < MAX_STEPS && seen.decisions < want; i += 1) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick?.(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;

      seen.decisions += 1;
      const state = engine.state();
      const view = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, options);
      if (view) {
        if (view.note) seen.notes += 1;
        const fault = noteFault(state, view);
        if (fault) seen.faults.push(`${chapterId} seed ${seed} decision ${seen.decisions}: ${fault} — ${describeCard(view)}`);
        if (collect) seen.cards.push(describeCard(view));
      }
      const chosen = intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d.commands);
      if (!chosen) break;
      engine.submit(chosen);
    }
  }
  return seen;
}

// ------------------------------------------------- the gate's own reproduction

describe('Chapter 1 at seed 1 — the board the gate reported', () => {
  const seen = walk('seymour-flux', [1], 16, true);

  it('walks the decisions the gate named', () => {
    expect(seen.decisions).toBe(16);
  });

  it('never prints a cure instruction above a move that is not the cure', () => {
    // The regression, stated exactly: every card that says "Zombie" is a card
    // showing the Holy Water. Before the fix, decisions 2 and 3 printed it over
    // Mighty Guard and a thrown Poison Fang.
    const offending = seen.cards.filter((c) => /note="[^"]*Zombie/.test(c) && !/cures Zombie|Holy Water|Esuna/.test(c));
    expect(offending, 'a Zombie note over a card with no cure on it').toEqual([]);
  });

  it('is silent on the decisions whose pick is neither a revive nor a cure', () => {
    // Decisions 2 and 3: Yuna is on the floor and still a Zombie, the raise is
    // correctly refused, and the actor has no cure for it — so the advisor has
    // nothing honest to say and says nothing.
    expect(seen.cards[1]).toMatch(/note=""/);
    expect(seen.cards[2]).toMatch(/note=""/);
  });

  it('keeps the revive’s caution next to the revive', () => {
    // Decision 4: the pick *is* the Phoenix Down, so the caution is the
    // suggestion's own warning — rule (a), and the one case the gate agreed
    // was already right.
    expect(seen.cards[3]).toMatch(/Phoenix Down/);
    expect(seen.cards[3]).toMatch(/warns: .*Zombie/);
    expect(seen.cards[3]).toMatch(/note=""/);
  });

  it('turns the Zombie reading into the cure’s reason when the cure is the pick', () => {
    // Decision 5: Yuna is up and still a Zombie, the ranking picks the Holy
    // Water on its own, and the same board reading is now the reason for it —
    // rule (b).
    expect(seen.cards[4]).toMatch(/Holy Water/);
    expect(seen.cards[4]).toMatch(/note="[^"]*Zombie[^"]*Full-Life/);
  });

  it('still says when to spend a revive it refused', () => {
    // Rule (c) survives the fix: a party-wide payload landing this turn is a
    // matter of *timing*, and "take it first, then raise them" is an
    // instruction the player can follow with the card exactly as it stands.
    const timing = seen.cards.filter((c) => /note="[^"]*then raise/.test(c));
    expect(timing.length).toBeGreaterThan(0);
  });

  it('obeys the rule on every decision', () => {
    expect(seen.faults).toEqual([]);
  });
});

// ---------------------------------------------- every chapter, both engines

describe('the note explains the card, in every chapter', () => {
  for (const chapter of CHAPTERS) {
    it(`holds across 200+ decisions of ${chapter.number}. ${chapter.title}`, () => {
      // Enough seeds that the short links reach 200 decisions: Chapter 5's
      // first formation is over in twenty-odd turns, so one battle is nowhere
      // near a sample. The walk stops at 200 whichever seed it is on.
      const seen = walk(
        chapter.id,
        [1, 7, 42, 101, 202, 303, 404, 505, 606, 707, 808, 909, 20260918, 20260919],
        200,
      );
      expect(seen.decisions, 'the replay must reach the boards, not stall').toBeGreaterThanOrEqual(200);
      expect(seen.faults).toEqual([]);
    });
  }
});
