/**
 * **An ally on the floor always gets an answer** — `advisor.ts`'s own rule 4,
 * asserted against natural play instead of hand-built boards.
 *
 * Bailey, on the live build, Chapter 1, Tidus acting with Yuna face-down:
 *
 * > "im controlling tidus but the advisor is telling me to use poison fang?
 * > how does that make sense? and what about reviving yuna?"
 *
 * The second half of that sentence was still unanswered three passes later.
 * The card priced the Phoenix Down, refused it because Yuna was *still a
 * Zombie* — which is the correct canon reading, Full-Life hunts the zombied
 * body [ffx-seymour-flux §4.8 row "Full-Life"] — and then printed **nothing**,
 * because `noteFor` dropped every `'zombie'` refusal on the grounds that "cure
 * the Zombie first" is only an answer when a cure is on the card. Chapter 1's
 * boss zombifies on its way to killing someone, so that branch is the *normal*
 * case: the critic measured 166 Chapter 1 decisions with somebody on the floor
 * and **138 of them silent** [critic, fix-3 pass 3, F-A].
 *
 * The rule this file pins, in one line: while an ally is on the floor, the card
 * either **shows the raise** or **says one plain sentence about why not**.
 * Never both-empty. It is deliberately stated over hundreds of decisions of
 * real play rather than at a pinned decision index — the last version of this
 * reproduction was `seen.cards[3]`, and a legitimate change to Kimahri's
 * command list moved the board and turned it red with no rule having changed.
 *
 * ## Which game
 *
 * **Both.** "An ally on the floor always gets an answer" is a property of the
 * card, not of an FFX mechanic, and `advisor.ts` is the one card both engines
 * render. The *Zombie* reading inside it is FFX-only in fact rather than by a
 * flag: FFX-2's data layer defines no `zombie` status at all, so the branch
 * cannot fire there — asserted below, so that a future FFX-2 status does not
 * quietly inherit FFX's Full-Life sentence.
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

const MAX_STEPS = 4_000;

interface Harness {
  engine: {
    nextDecision: () => Decision;
    submit: (c: Command) => void;
    state: () => Readonly<BattleState>;
    tick?: (ms: number) => void;
  };
  options: AdvisorOptions;
}

function ffxHarness(groupId: string, seed: number, party: unknown): Harness {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx',
    party,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  } as never);
  return { engine: engine as unknown as Harness['engine'], options: { ffxContent: content } };
}

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
    : ffxHarness(chapter.enemyGroupRef.id, seed, chapter.buildRef);
}

function fallback(commands: AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.validTargets.length > 0);
  return r ? ({ ...r.command, targets: [r.validTargets[0]!] } as Command) : null;
}

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

/** Does any shown move take Zombie off somebody? */
function curesZombie(view: AdvisorView): boolean {
  return view.suggestions.some((s) => s.cures.some((c) => /zombie/i.test(c)));
}

interface FloorSeen {
  decisions: number;
  withSomebodyDown: number;
  raiseShown: number;
  noteInstead: number;
  /** The defect: nobody answered for the body on the floor. */
  silent: string[];
  /** A note that tells the player to press something the card is not showing. */
  unfollowable: string[];
  /** A note printed while an ally is down that never names them. */
  anonymous: string[];
  notes: string[];
}

function describeCard(view: AdvisorView): string {
  const moves = view.suggestions
    .map((s) => `${s.label}->${s.targetName ?? s.targetId ?? ''}${s.warning ? ` (warns: ${s.warning})` : ''}`)
    .join(' | ');
  return `${view.actorName}: ${moves} :: note="${view.note}"`;
}

/**
 * Replay a chapter with the shipped auto-battler and read every card built
 * while somebody is on the floor.
 */
function walkFloor(chapterId: string, seeds: readonly number[], want: number): FloorSeen {
  const seen: FloorSeen = {
    decisions: 0,
    withSomebodyDown: 0,
    raiseShown: 0,
    noteInstead: 0,
    silent: [],
    unfollowable: [],
    anonymous: [],
    notes: [],
  };
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
      const down = downedAllies(state);
      if (view && down.length > 0) {
        seen.withSomebodyDown += 1;
        const where = `${chapterId} seed ${seed} decision ${seen.decisions}: ${describeCard(view)}`;
        if (view.suggestions.some((s) => isRevive(state, s))) {
          seen.raiseShown += 1;
        } else if (!view.note) {
          seen.silent.push(where);
        } else {
          seen.noteInstead += 1;
          seen.notes.push(view.note);
          // The instruction has to be one the player can follow from this card:
          // "cure the Zombie first" with no cure on it is the sentence the
          // pre-deploy gate threw out, and it is not allowed back.
          if (/cure the Zombie first/i.test(view.note) && !curesZombie(view)) {
            seen.unfollowable.push(where);
          }
          if (!down.some((c) => view.note.includes(c.name)) && !curesZombie(view)) {
            seen.anonymous.push(where);
          }
        }
      }

      const chosen = intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d.commands);
      if (!chosen) break;
      engine.submit(chosen);
    }
  }
  return seen;
}

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

describe('an ally on the floor always gets an answer — Chapter 1, the board Bailey reported', () => {
  const seen = walkFloor('seymour-flux', SEEDS, 1_200);

  it('reaches a real sample of boards with somebody down', () => {
    // The critic's replay of the same chapter found 166 across twelve seeds.
    // Anything in this range means the walk is looking at the fight Bailey
    // played, not at a battle that ended before anyone fell over.
    expect(seen.withSomebodyDown).toBeGreaterThan(100);
  });

  it('is never silent while an ally is on the floor', () => {
    // Before the fix: 138 of 166. Every one of them was a Zombie refusal the
    // card swallowed whole.
    expect(seen.silent.slice(0, 5)).toEqual([]);
    expect(seen.silent.length).toBe(0);
  });

  it('never prints an instruction the card cannot carry out', () => {
    expect(seen.unfollowable.slice(0, 5)).toEqual([]);
  });

  it('names the ally it is talking about', () => {
    expect(seen.anonymous.slice(0, 5)).toEqual([]);
  });

  it('answers with one sentence, not a paragraph', () => {
    // The HUD prints the note as a single lead line and appends the full stop
    // itself (`MoveAdvisor.ts`), so a note that ends in one, or runs to three
    // clauses, reads as broken chrome.
    for (const note of new Set(seen.notes)) {
      expect(note.endsWith('.'), `note ends in a full stop: "${note}"`).toBe(false);
      expect(note.length, `note is too long for the card: "${note}"`).toBeLessThanOrEqual(120);
    }
  });
});

describe('the same rule in FFX-2, where there is no Zombie to refuse over', () => {
  for (const chapter of CHAPTERS.filter((c) => c.game === 'ffx2')) {
    it(`holds across ${chapter.number}. ${chapter.title}`, () => {
      const seen = walkFloor(chapter.id, SEEDS, 400);
      expect(seen.silent.slice(0, 5)).toEqual([]);
      expect(seen.silent.length).toBe(0);
      // FFX-2's data layer has no `zombie` status, so the FFX reading must
      // never reach an X-2 card — the standing rule that a change true to one
      // game is not true of the other until the sources say so.
      expect(seen.notes.filter((n) => /zombie/i.test(n))).toEqual([]);
    });
  }
});

describe('the rest of FFX', () => {
  for (const chapter of CHAPTERS.filter((c) => c.game !== 'ffx2' && c.id !== 'seymour-flux')) {
    it(`holds across ${chapter.number}. ${chapter.title}`, () => {
      const seen = walkFloor(chapter.id, SEEDS, 400);
      expect(seen.silent.slice(0, 5)).toEqual([]);
      expect(seen.silent.length).toBe(0);
      expect(seen.unfollowable.slice(0, 5)).toEqual([]);
    });
  }
});
