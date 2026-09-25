/**
 * The in-battle strategy guide's **reasoning half** (`src/engine/tactics/guide.ts`)
 * and the written content it draws on (`src/data/guides/*.ts`).
 *
 * The panel makes one strong claim to the player: *this is the command the
 * chapter was designed to be beaten with*. That claim is only true if the NEXT
 * line is the shipped `intendedStrategy` and not a second strategy written for
 * the panel — so the central test here drives a real engine through a real
 * battle and asserts the two agree at **every** decision, not at a handful of
 * hand-built states. A guide that drifted one row from the tactic would fail
 * here on the first turn it disagreed.
 *
 * The other half of the claim is that previewing a decision cannot *take* one.
 * `stateOnlyEngine` is the enforcement; the tests below are the proof that it
 * throws rather than quietly resolving a command mid-render.
 *
 * DOM, mounting, the G key and the SaveData preference are in
 * `tests/unit/ui-strategy-guide.test.ts` — this file never touches a document.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  Decision,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import {
  GuideEngineMisuseError,
  activeCharges,
  buildGuideView,
  guideForState,
  recommendedCommand,
  rowFor,
  stateOnlyEngine,
} from '../../src/engine/tactics/guide.ts';
import { GUIDES, guideForChapter } from '../../src/data/guides/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { TACTICS } from '../../src/engine/tactics/index.ts';

const MAX_DECISIONS = 4_000;

/** One FFX engine, built the way `BattleScreenContent.ts` builds one. */
function newFfxEngine(groupId: string, seed: number, party = gagazetBuild) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

function fallback(commands: AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.validTargets.length > 0);
  return r ? ({ ...r.command, targets: [r.validTargets[0]!] } as Command) : null;
}

/** The two commands compared, reduced to what the player would actually press. */
function shape(c: Command | null): string {
  if (!c) return '(declined)';
  const id = 'id' in c ? String((c as { id?: unknown }).id) : '';
  return `${c.kind}:${id}:${[...c.targets].join(',')}`;
}

interface Walk {
  decisions: number;
  /** Decisions where the panel's NEXT and the shipped strategy disagreed. */
  mismatches: string[];
  /** Decisions where the panel printed a NEXT line at all. */
  recommended: number;
  /** Decisions whose NEXT line also carried a cited reason. */
  explained: number;
  /** Distinct `AvailableCommand.label`s the panel recommended. */
  labels: Set<string>;
}

/**
 * Walk a real battle, and at every player decision ask both halves the same
 * question before answering it with the strategy's own choice.
 *
 * Order matters: `recommendedCommand` runs **first**, on the state the engine is
 * about to be asked to act on, so a guide that mutated anything would be caught
 * by the strategy then seeing a different board.
 */
function walk(groupId: string, seed: number, party = gagazetBuild): Walk {
  const engine = newFfxEngine(groupId, seed, party);
  const out: Walk = { decisions: 0, mismatches: [], recommended: 0, explained: 0, labels: new Set() };

  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d: Decision = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'resolved') continue;
    if (d.kind !== 'player-input') break;

    out.decisions++;
    const state = engine.state();
    const decision = { actorId: d.actorId, commands: d.commands };

    const fromGuide = recommendedCommand(state, decision);
    const view = buildGuideView(state, decision);
    const fromStrategy = intendedStrategy(d.actorId, d.commands, engine);

    if (shape(fromGuide) !== shape(fromStrategy)) {
      out.mismatches.push(`turn ${out.decisions} (${d.actorId}): ${shape(fromGuide)} vs ${shape(fromStrategy)}`);
    }
    if (view?.next) {
      out.recommended++;
      out.labels.add(view.next.label);
      if (view.next.reason) out.explained++;
    }

    const chosen = fromStrategy ?? fallback(d.commands);
    if (!chosen) break;
    engine.submit(chosen);
  }
  return out;
}

// ---------------------------------------------------------- the whole claim

describe('the NEXT line is the shipped strategy, not a second one', () => {
  for (const [chapter, groupId, party] of [
    ['Chapter 1 (Seymour Flux)', 'seymour-flux', gagazetBuild],
    ['Chapter 2 (Yunalesca)', 'yunalesca', zanarkandBuild],
  ] as const) {
    it(`agrees with intendedStrategy at every decision of ${chapter}`, () => {
      const w = walk(groupId, 42, party);
      expect(w.decisions).toBeGreaterThan(20);
      expect(w.mismatches).toEqual([]);
    });
  }

  it('agrees across several seeds, so the match is not one lucky board', () => {
    const all = [1, 7, 20260917].flatMap((seed) => walk('seymour-flux', seed).mismatches);
    expect(all).toEqual([]);
  });
});

describe('the NEXT line is actually populated', () => {
  it('prints a recommendation on nearly every turn of a real Chapter 1 battle', () => {
    const w = walk('seymour-flux', 42);
    // The tactic declines on a board it has no opinion about and the generic
    // ladder answers; either way a NEXT line is the normal case, not the rare
    // one. A regression that made `buildGuideView` return an empty view would
    // still pass the agreement test above (null === null), so this is the
    // separate assertion that the panel is not simply blank.
    expect(w.recommended / w.decisions).toBeGreaterThan(0.9);
  });

  it('explains most of what it recommends, with a citation', () => {
    const w = walk('seymour-flux', 42);
    expect(w.explained / Math.max(1, w.recommended)).toBeGreaterThan(0.5);
    // And the hints are not all one catch-all row.
    expect(w.labels.size).toBeGreaterThan(2);
  });

  it('names the row the player has to press, using the menu label the HUD shows', () => {
    const engine = newFfxEngine('seymour-flux', 42);
    let printed = 0;
    for (let i = 0; i < MAX_DECISIONS && printed < 12; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'resolved') continue;
      if (d.kind !== 'player-input') break;
      const view = buildGuideView(engine.state(), { actorId: d.actorId, commands: d.commands });
      const next = view?.next;
      if (next) {
        printed++;
        const offered = rowFor(d.commands, next.command);
        // Either it is one of the offered rows (and the label is that row's),
        // or the strategy reached a base action with no row, and the label is
        // the readable stand-in — never an id with hyphens in it.
        if (offered) expect(next.label).toBe(offered.label);
        expect(next.label).not.toMatch(/-/);
        expect(next.label.length).toBeGreaterThan(0);
        if (next.targetId) expect(engine.state().combatants[next.targetId]).toBeDefined();
      }
      const chosen = intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d.commands);
      if (!chosen) break;
      engine.submit(chosen);
    }
    expect(printed).toBeGreaterThan(0);
  });
});

// ------------------------------------------------- previewing never plays

describe('stateOnlyEngine', () => {
  const state = {} as BattleState;

  it('reads', () => {
    const s = { turn: 3 } as unknown as BattleState;
    expect(stateOnlyEngine(s).state()).toBe(s);
  });

  for (const method of ['init', 'nextDecision', 'submit', 'setSeed'] as const) {
    it(`throws from ${method}, so a tactic can never take the turn it is previewing`, () => {
      const e = stateOnlyEngine(state) as unknown as Record<string, (arg?: unknown) => unknown>;
      expect(() => e[method]!({})).toThrow(GuideEngineMisuseError);
      expect(() => e[method]!({})).toThrow(/only engine\.state\(\) is available/);
    });
  }

  it('degrades to a panel with no NEXT line rather than throwing at the caller', () => {
    const engine = newFfxEngine('seymour-flux', 42);
    // A decision whose rows are all nonsense: the tactic and the generic ladder
    // both decline, and `buildGuideView` still returns a usable view.
    const view = buildGuideView(engine.state(), { actorId: 'tidus' as CombatantId, commands: [] });
    expect(view).not.toBeNull();
    expect(view!.next).toBeNull();
    expect(view!.rules.length).toBeGreaterThan(0);
  });
});

// -------------------------------------------------------------- WATCH

/** A state carrying nothing but the fields the WATCH reader looks at. */
function stateWithCharges(log: BattleEvent[], hp = 40_000): BattleState {
  return {
    game: 'ffx',
    combatants: {
      'seymour-flux': {
        id: 'seymour-flux',
        side: 'enemy',
        name: 'Seymour Flux',
        alive: true,
        hp,
        statuses: {},
        stats: { maxHp: 70_000 },
      },
    },
    log,
  } as unknown as BattleState;
}

function charge(seq: number, name: string, turnsLeft: number, stage: 1 | 2): BattleEvent {
  return { seq, type: 'charge', enemyId: 'seymour-flux', name, turnsLeft, stage } as BattleEvent;
}

describe('WATCH', () => {
  it('prints the telegraphed payload and what to do about it, with a citation', () => {
    const view = buildGuideView(stateWithCharges([charge(1, 'Auto-Attack Mode', 2, 1)]), null);
    expect(view!.watch).toHaveLength(1);
    const w = view!.watch[0]!;
    expect(w.payload).toBe('Total Annihilation');
    expect(w.timing).toBe('in 2 turns');
    expect(w.advice).toMatch(/Shell|Defend/);
    expect(w.cite).toMatch(/ffx-seymour-flux/);
    expect(w.stage).toBe(1);
  });

  it('keeps only the newest charge per enemy, so a counted-down telegraph is not printed twice', () => {
    const view = buildGuideView(
      stateWithCharges([charge(1, 'Auto-Attack Mode', 2, 1), charge(2, 'Ready To Annihilate', 1, 2)]),
      null,
    );
    expect(view!.watch).toHaveLength(1);
    expect(view!.watch[0]!.timing).toBe('in 1 turn');
    expect(view!.watch[0]!.stage).toBe(2);
  });

  it('shows a fired telegraph as "this turn", then drops it once the battle has moved on', () => {
    const fired = charge(1, 'Ready To Annihilate', 0, 2);
    expect(buildGuideView(stateWithCharges([fired]), null)!.watch[0]!.timing).toBe('this turn');

    const later: BattleEvent[] = [fired];
    for (let seq = 2; seq < 30; seq++) later.push({ seq, type: 'action-end' } as BattleEvent);
    expect(buildGuideView(stateWithCharges(later), null)!.watch).toHaveLength(0);
  });

  it('ignores a charge whose owner is dead', () => {
    const state = stateWithCharges([charge(1, 'Auto-Attack Mode', 2, 1)]);
    (state.combatants['seymour-flux'] as { alive: boolean }).alive = false;
    expect(activeCharges(state)).toHaveLength(0);
  });

  it('matches Bahamut’s bare countdown through the "#" wildcard', () => {
    const bahamut = {
      game: 'ffx2',
      combatants: {
        bahamut: { id: 'bahamut', side: 'enemy', name: 'Bahamut', alive: true, hp: 8_400, statuses: {}, stats: { maxHp: 8_400 } },
      },
      log: [{ seq: 1, type: 'charge', enemyId: 'bahamut', name: '3', turnsLeft: 3, stage: 1 }],
    } as unknown as BattleState;
    const view = buildGuideView(bahamut, null);
    expect(view!.chapterId).toBe('ffx2-bahamut');
    expect(view!.watch).toHaveLength(1);
    expect(view!.watch[0]!.payload).toMatch(/Mega Flare/i);
  });
});

describe('phase notes', () => {
  it('switches Seymour’s note at the half-HP line the research draws it at', () => {
    const above = buildGuideView(stateWithCharges([], 40_000), null)!.phase;
    const below = buildGuideView(stateWithCharges([], 20_000), null)!.phase;
    expect(above!.label).not.toBe(below!.label);
    expect(above!.cite).toMatch(/ffx-seymour-flux/);
    expect(below!.cite).toMatch(/ffx-seymour-flux/);
  });
});

// ------------------------------------------------------- written content

describe('src/data/guides', () => {
  it('has one guide per chapter, and every chapter that ships a tactic has one', () => {
    expect(GUIDES).toHaveLength(13);
    for (const id of [
      'seymour-flux',
      'yunalesca',
      'braskas-final-aeon',
      'ffx2-bahamut',
      'ffx2-vegnagun-shuyin',
      'ffx2-leblanc',
      'seymour-anima-macalania',
      'evrae-airship',
      'yojimbo-cavern',
      'ffx2-trema',
      'seymour-omnis', // Chapter XII (FFX)
      'seymour-natus', // Chapter X (FFX)
      'isaaru-via-purifico', // Chapter XIV (FFX)
    ]) {
      expect(guideForChapter(id), id).toBeDefined();
    }
  });

  it('lists 3-5 RULES per chapter, as the panel is sized for', () => {
    for (const g of GUIDES) {
      expect(g.rules.length, g.id).toBeGreaterThanOrEqual(3);
      expect(g.rules.length, g.id).toBeLessThanOrEqual(5);
    }
  });

  /**
   * The guide is the one surface in the game that makes explicit claims about
   * canon mechanics *to the player*, so an uncited sentence here is a bug — see
   * `src/data/guides/types.ts`. Citations are checked for shape, not spelling:
   * a research slug plus at least one section number.
   */
  it('cites every sentence it prints, in the corpus’s own citation form', () => {
    const cite = /^(ffx|ffx2)-[a-z0-9-]+ §/;
    for (const g of GUIDES) {
      for (const r of g.rules) expect(r.cite, `${g.id} rule: ${r.text.slice(0, 40)}`).toMatch(cite);
      for (const h of g.hints) expect(h.cite, `${g.id} hint: ${h.text.slice(0, 40)}`).toMatch(cite);
      for (const w of g.watch) expect(w.cite, `${g.id} watch: ${w.name}`).toMatch(cite);
      for (const p of g.phases) expect(p.cite, `${g.id} phase: ${p.label}`).toMatch(cite);
    }
  });

  it('claims no boss id twice, so a board can never match two chapters', () => {
    const seen = new Map<CombatantId, string>();
    for (const g of GUIDES) {
      for (const id of g.bossIds) {
        expect(seen.get(id), `${id} is claimed by both ${seen.get(id)} and ${g.id}`).toBeUndefined();
        seen.set(id, g.id);
      }
    }
  });

  /**
   * The panel finds its chapter the same way `tacticFor` finds its tactic, so
   * a boss the tactics register and the guides do not is a board that plays by
   * a line the panel cannot explain. This is the check that catches a chain
   * link being added to one registry and not the other.
   */
  it('covers every boss id the tactics register', () => {
    const guided = new Set(GUIDES.flatMap((g) => [...g.bossIds]));
    const missing = TACTICS.map((t) => t.bossId).filter((id) => !guided.has(id));
    expect(missing).toEqual([]);
  });

  it('finds the right chapter from whichever boss is on the field', () => {
    for (const g of GUIDES) {
      for (const bossId of g.bossIds) {
        const state = {
          game: getChapter(g.id)?.game,
          combatants: { [bossId]: { id: bossId, side: 'enemy', name: bossId, alive: true, hp: 1, statuses: {}, stats: { maxHp: 1 } } },
          log: [],
        } as unknown as BattleState;
        expect(guideForState(state)?.id, bossId).toBe(g.id);
      }
    }
  });

  it('has no guide for a board that is not one of the five chapters', () => {
    const state = { combatants: { 'sinspawn-gui': {} }, log: [] } as unknown as BattleState;
    expect(guideForState(state)).toBeNull();
    expect(buildGuideView(state, null)).toBeNull();
  });
});
