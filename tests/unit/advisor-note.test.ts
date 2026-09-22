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
 *  b. the note **tells the player to cure** something → the cure is among the
 *     shown moves (`zombieCureReason`); an instruction to press a row that is
 *     not on the card is the defect the gate threw out;
 *  c. an ally is **on the floor** and the card is not showing a raise → the
 *     note says why not, naming that ally (`advisor-floor.ts`);
 *  d. anything else → `''`.
 *
 * ## Corrected 2026-09-19 (pre-release pass): (c) and (d) were the wrong way up
 *
 * Until this pass, (c) covered only the `'aimed'` and `'sweep'` refusals and
 * (d) swallowed the rest, so a `'zombie'` refusal printed nothing — and three
 * assertions in this file *pinned that silence as correct*, including one that
 * named decisions 2 and 3 of seed 1 as decisions where "the advisor has
 * nothing honest to say and says nothing". That was wrong, not merely
 * incomplete: Chapter 1's boss zombifies on its way to killing someone, so the
 * branch it made silent is the normal case there — 138 of 166 decisions with
 * an ally down [critic, fix-3 pass 3, F-A] — and the silence *is* the half of
 * Bailey's report ("and what about reviving yuna?") that stayed open for three
 * passes. What the gate actually caught was an **unfollowable instruction**
 * ("cure the Zombie first" with no cure on the card), which is (b); the
 * conclusion that the card should therefore say nothing at all was a mistake.
 * Silence while somebody is on the floor is now itself a fault.
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
  const down = downedAllies(state);
  const showsRevive = view.suggestions.some((s) => isRevive(state, s));
  const curesZombie = view.suggestions.some((s) => s.cures.some((c) => /zombie/i.test(c)));

  // (c) Silence is only allowed when nobody is waiting on the floor for an
  //     answer — `advisor.ts` rule 4, and the half of Bailey's report that
  //     three passes left open.
  if (!note) {
    return down.length > 0 && !showsRevive
      ? 'an ally is on the floor and the card neither shows the raise nor says why not'
      : null;
  }

  // (b) An instruction to *do something about* a condition is only an answer
  //     when the row that does it is on the card. "Cure the Zombie first" over
  //     Mighty Guard is the sentence the pre-deploy gate threw out; a reading
  //     of the board that asks for nothing ("leave them down") is not.
  if (/\bZombie\b/.test(note) && /\b(cure|clear)\b/i.test(note) && !curesZombie) {
    return 'tells the player to cure a Zombie with no cure on the card';
  }
  // (a) The caution about a revive that is on the card.
  if (showsRevive) return null;
  // (c) The answer for the body on the floor names the body on the floor.
  if (down.length > 0) {
    return down.some((c) => note.includes(c.name)) || curesZombie
      ? null
      : 'an ally is on the floor and the note is about neither them nor a cure on the card';
  }
  // (b) again, for the living: the Zombie reading with the cure as the pick.
  if (/\bZombie\b/.test(note)) {
    return curesZombie ? null : 'names Zombie but no shown move cures it';
  }
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
    // The regression, stated exactly: every card that tells the player to
    // *cure* or *clear* a Zombie is a card showing the Holy Water. Before the
    // fix, decisions 2 and 3 printed "so cure the Zombie first" over Mighty
    // Guard and a thrown Poison Fang.
    //
    // Narrowed from "every card that says Zombie", which was the gate's
    // finding stated one word too wide: the sentence that answers for a body
    // on the floor also says Zombie, and asks the player for nothing.
    const offending = seen.cards.filter(
      (c) =>
        /note="[^"]*Zombie/.test(c) &&
        /note="[^"]*\b(cure|clear)\b/i.test(c) &&
        !/cures Zombie|Holy Water|Esuna/.test(c),
    );
    expect(offending, 'a cure instruction over a card with no cure on it').toEqual([]);
  });

  it('answers for the ally on the floor when the pick is neither a revive nor a cure', () => {
    // The two decisions the gate filed as correctly silent are Bailey's own
    // board: Yuna face-down and zombied, the raise refused because Full-Life
    // hunts the zombied body [ffx-seymour-flux §4.8], and the card picking a
    // thrown item. The refusal is still right; the silence was not.
    //
    // Keyed off what the card says, not off `seen.cards[1]` — the pin that
    // made three of these go red when Kimahri got his Talk row back.
    const answered = seen.cards.filter((c) => /note="Leave [^"]*still a Zombie/.test(c));
    expect(answered.length, 'the body on the floor is spoken for').toBeGreaterThan(0);
    for (const card of answered) {
      expect(card, 'the answer only ever rides above a pick that is not the raise').not.toMatch(
        /Phoenix Down|Mega Phoenix/,
      );
      expect(card, 'and never asks for a cure the card is not showing').not.toMatch(/cure the Zombie first/);
    }
    // Bailey's screenshot, decision for decision.
    expect(
      seen.cards.some((c) => /Poison Fang/.test(c) && /note="Leave Yuna down/.test(c)),
      'the Poison Fang card now says what is happening to Yuna',
    ).toBe(true);
  });

  /**
   * These three used to be pinned to decision numbers — `seen.cards[3]`, `[4]`
   * — which made them a description of one RNG stream rather than of a rule.
   * Commit 712f6e7 gave Kimahri his Talk row back, the board shifted by exactly
   * one decision, and three green tests turned red without a single rule having
   * changed. They are keyed off what the card *says* now, so the next legitimate
   * change to the command list moves the boards without moving the goalposts.
   */
  it('keeps the revive’s caution next to the revive', () => {
    // Rule (a): when the pick *is* the raise, the caution rides on that
    // suggestion's own warning and the note above the moves stays empty — one
    // sentence, printed once, beside the move it is about.
    const raises = seen.cards.filter((c) => /Phoenix Down|Mega Phoenix/.test(c) && /warns: /.test(c));
    expect(raises.length).toBeGreaterThan(0);
    expect(raises.some((c) => /warns: [^:]*Zombie/.test(c))).toBe(true);
    for (const card of raises) expect(card).toMatch(/note=""/);
  });

  it('turns the Zombie reading into the cure’s reason when the cure is the pick', () => {
    // Rule (b): Yuna is up and still a Zombie, the ranking picks the Holy Water
    // on its own, and the board reading becomes the reason for it rather than a
    // caution about a row nobody was offered.
    const cures = seen.cards.filter((c) => /Holy Water/.test(c));
    expect(cures.length).toBeGreaterThan(0);
    expect(cures.filter((c) => /note="[^"]*Zombie[^"]*Full-Life/.test(c)).length).toBeGreaterThan(0);
  });

  it('still says when to spend a revive it is holding back', () => {
    // Rule (c): a party-wide payload landing this turn is a matter of *timing*,
    // and "take it first, then raise them" is an instruction the player can
    // follow with the card exactly as it stands.
    //
    // **Restored 2026-09-19 (pre-release pass).** The version this replaces
    // asked whether the sentence appeared *anywhere* across twelve seeds and
    // accepted the revive's own `warning` as equivalent to the note. The
    // warning channel only exists when the raise is already on the card — i.e.
    // exactly when the card is not silent — so the shape the assertion was
    // written to detect had become undetectable, and the measured reality was
    // one such sentence per 479 Chapter 1 decisions [critic, fix-3 pass 3,
    // F-B]. Two universal assertions instead of one existential one:
    //
    //   1. on the sixteen decisions of seed 1 — the original scope — every
    //      board with a body on the floor is answered, through `noteFault`;
    //   2. across the wide walk, the timing sentence still reaches the player
    //      through the **note** on its own, with no warning-channel escape.
    expect(seen.faults, 'seed 1, decision by decision').toEqual([]);
    const wide = walk('seymour-flux', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 240, true);
    expect(wide.faults, 'twelve seeds, decision by decision').toEqual([]);
    const inNote = wide.cards.filter((c) => /note="[^"]*then raise/.test(c));
    expect(inNote.length, 'a refused revive says when to spend it, in the note').toBeGreaterThan(0);
  });

  it('obeys the rule on every decision', () => {
    expect(seen.faults).toEqual([]);
  });
});

// ---------------------------------------------- every chapter, both engines

// Enough seeds that the short links reach 200 decisions: Chapter 5's first
// formation is over in twenty-odd turns, so one battle is nowhere near a
// sample, and `walk` only ever plays a chapter's *first* formation (no chain
// advance, same as every other chapter here) — Chapter 6's Act I entrance is
// shorter still, "the cheapest possible form" of its own lesson
// (`docs/handoff/chapter-leblanc-engine.md` §2), at roughly 3 decisions per
// seed against the first fourteen seeds. The trailing seeds below cost
// nothing for a chapter whose first fourteen already clear 200 — `walk`
// breaks out of the seed loop the moment `want` is reached — so they exist
// only to give Leblanc enough runway.
const NOTE_WALK_SEEDS = [
  1, 7, 42, 101, 202, 303, 404, 505, 606, 707, 808, 909, 20260918, 20260919,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35, 36, 37, 38, 39,
  41, 43, 44, 45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 56, 57, 58, 59, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71,
];

describe('the note explains the card, in every chapter', () => {
  for (const chapter of CHAPTERS) {
    it(`holds across 200+ decisions of ${chapter.number}. ${chapter.title}`, () => {
      const seen = walk(chapter.id, NOTE_WALK_SEEDS, 200);
      expect(seen.decisions, 'the replay must reach the boards, not stall').toBeGreaterThanOrEqual(200);
      expect(seen.faults).toEqual([]);
    });
  }
});
