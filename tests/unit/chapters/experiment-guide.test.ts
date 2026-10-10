/**
 * The Experiment (FFX-2 Chapter 5, Djose Temple; the hidden chapter): its strategy guide, its guide document and its move-advisor tactic, registered and run against the real engine.
 * **FFX-2 only** [AGENTS.md rule 14].
 *
 * The listed chapters' sweeps (`strategy-guide.test.ts`, `guide-doc*.test.ts`, `tactics-lookup.test.ts`) see this chapter's guide because it rides in `GUIDES`; what they cannot see is that
 * it is *this* chapter's, that its hints explain the commands its tactic really picks over both acts, and that its panel opens on the right fight. That is this file:
 *
 * 1. **Registration**: one guide, one document, the same id and boss ids as the chapter; the tactic is registered under both bodies and the game is FFX-2.
 * 2. **Lookup by board**: each body on an FFX-2 board finds the guide and the tactic; the same ids on an FFX board find neither.
 * 3. **The panel over the chapter, run through the engine**: at every player decision of both acts, on several seeds, the NEXT line is the shipped strategy and carries a reason (a hint matched);
 *    the phase note is the prototype's in Act I and the rebuilt machine's in Act II.
 * 4. **The document**: it opens on the prototype's page for Act I and on the rebuilt machine's page for Act II, and prints the numbers this game uses.
 */

import { describe, expect, it } from 'vitest';

import type { BattleState } from '../../../src/battle/common/types.ts';
import { FFX2_EXPERIMENT } from '../../../src/data/chapter-ffx2-experiment.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { EXPERIMENT_BODY_IDS, EXPERIMENT_ENEMY_ID, EXPERIMENT_HP, EXPERIMENT_PROTOTYPE_ID, experimentActTwoGroup } from '../../../src/data/ffx2/enemies/experiment.ts';
import { FFX2_EXPERIMENT_GUIDE, EXPERIMENT_GUIDE_IDS } from '../../../src/data/guides/ffx2-experiment.ts';
import { FFX2_EXPERIMENT_DOC } from '../../../src/data/guides/docs/ffx2-experiment.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { GUIDE_DOCS, docForChapter } from '../../../src/data/guides/docs/index.ts';
import { RULE_SHORT_MAX, rulesOnClock } from '../../../src/data/guides/types.ts';
import { WAIT_SPLIT_HABIT_RULE } from '../../../src/data/guides/ffx2-wait-habit.ts';
import { buildGuideView, guideForState, recommendedCommand, stateOnlyEngine } from '../../../src/engine/tactics/guide.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { ffx2Experiment } from '../../../src/engine/tactics/ffx2-experiment.ts';
import { docForState, startBlockIndex } from '../../../src/ui/common/guideDoc.ts';
import { fakeBoard } from '../helpers/guideDocStrings.ts';
import { driveChapterWithTriggers } from '../helpers/experimentDrive.ts';

const ID = FFX2_EXPERIMENT.id;
const CITE = /^(ffx|ffx2)-[a-z0-9-]+ §/;

const board = (game: 'ffx' | 'ffx2', ids: readonly string[]): BattleState =>
  ({ game, combatants: Object.fromEntries(ids.map((id) => [id, { id, side: 'enemy', name: id, alive: true, hp: 1, removed: false, statuses: {}, stats: { maxHp: 1 } }])), log: [] }) as unknown as BattleState;

describe('registration', () => {
  it('has one guide and one document, for the chapter, with the chapter\'s boss ids', () => {
    expect(ID).toBe('ffx2-masterpiece-theatre');
    expect(guideForChapter(ID)).toBe(FFX2_EXPERIMENT_GUIDE);
    expect(docForChapter(ID)).toBe(FFX2_EXPERIMENT_DOC);
    expect(GUIDES.filter((g) => g.id === ID)).toHaveLength(1);
    expect(GUIDE_DOCS.filter((d) => d.id === ID)).toHaveLength(1);
    expect([...FFX2_EXPERIMENT_GUIDE.bossIds]).toEqual([...EXPERIMENT_BODY_IDS]);
    expect([...EXPERIMENT_GUIDE_IDS]).toEqual([...EXPERIMENT_BODY_IDS]);
    expect([...FFX2_EXPERIMENT_DOC.bossIds]).toEqual([...EXPERIMENT_BODY_IDS]);
    expect(FFX2_EXPERIMENT_DOC.game).toBe('ffx2');
    expect(CHAPTER_GAME[ID]).toBe('ffx2');
    expect(getChapter(ID)?.game).toBe('ffx2');
  });

  it('shapes its words as every guide does: 3 to 5 rules with a short form that fits the rail, every sentence cited, the Wait habit leading under Wait', () => {
    const g = FFX2_EXPERIMENT_GUIDE;
    expect(g.rules.length).toBeGreaterThanOrEqual(3);
    expect(g.rules.length).toBeLessThanOrEqual(5);
    for (const r of g.rules) {
      expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
      expect(r.cite, r.text.slice(0, 40)).toMatch(CITE);
    }
    for (const h of g.hints) expect(h.cite, h.text).toMatch(CITE);
    for (const p of g.phases) expect(p.cite, p.label).toMatch(CITE);
    expect(rulesOnClock(g, 'wait')[0]).toBe(WAIT_SPLIT_HABIT_RULE);
    expect(rulesOnClock(g, 'active')).toBe(g.rules);
    // FFX-2 only: no FFX citation anywhere in it.
    for (const c of [...g.rules, ...g.hints, ...g.phases].map((x) => x.cite)) expect(c.startsWith('ffx2-'), c).toBe(true);
  });

  it('the tactic is registered under both bodies, for this chapter, and nothing else is registered for them', () => {
    const mine = TACTICS.filter((t) => EXPERIMENT_BODY_IDS.includes(t.bossId));
    expect(mine.map((t) => t.bossId).sort()).toEqual([...EXPERIMENT_BODY_IDS].sort());
    for (const t of mine) {
      expect(t.chapterId).toBe(ID);
      expect(t.tactic).toBe(ffx2Experiment);
    }
  });
});

describe('lookup by board', () => {
  it('each body on an FFX-2 board finds this guide and this tactic', () => {
    for (const id of EXPERIMENT_BODY_IDS) {
      const state = board('ffx2', [id]);
      expect(guideForState(state)?.id, id).toBe(ID);
      expect(tacticFor(stateOnlyEngine(state)), id).toBe(ffx2Experiment);
    }
  });

  it('the same ids on an FFX board find neither (rule 14: an FFX board never reaches an FFX-2 guide or tactic)', () => {
    for (const id of EXPERIMENT_BODY_IDS) {
      const state = board('ffx', [id]);
      expect(guideForState(state), id).toBeNull();
      expect(tacticFor(stateOnlyEngine(state)), id).toBeNull();
    }
  });
});

describe('the panel over the whole chapter, run through the engine', () => {
  it('at every decision of both acts the NEXT line is the shipped strategy and says why; the phase note follows the act', () => {
    const labelsWithoutReason = new Set<string>();
    let seen = 0;
    let withNext = 0;
    const phases = new Map<number, Set<string>>();
    for (const seed of [1, 2, 3, 4]) {
      driveChapterWithTriggers(seed, {
        onDecision: (engine, d, link) => {
          seen++;
          const state = engine.state();
          const view = buildGuideView(state, { actorId: d.actorId, commands: d.commands });
          expect(view, `seed ${seed} link ${link}`).not.toBeNull();
          expect(view!.chapterId).toBe(ID);
          if (view!.phase) (phases.get(link) ?? phases.set(link, new Set()).get(link)!).add(view!.phase.label);
          if (view!.next) {
            withNext++;
            expect(view!.next.command, `seed ${seed} link ${link} ${d.actorId}`).toEqual(recommendedCommand(state, { actorId: d.actorId, commands: d.commands }));
            if (view!.next.reason === '') labelsWithoutReason.add(view!.next.label);
          }
        },
      });
    }
    expect(seen).toBeGreaterThan(40);
    expect(withNext).toBeGreaterThan(20);
    expect([...labelsWithoutReason], 'a pick the guide cannot explain').toEqual([]);
    expect([...(phases.get(1) ?? [])]).toEqual(['THE PROTOTYPE']);
    expect([...(phases.get(2) ?? [])]).toEqual(['REBUILT']);
  });

  it('its hints name rows the tactic really asks for: every hint label turns up in a pick somewhere over the chapter, or is a stand-by the tactic keeps for a state the bench does not reach', () => {
    // The labels the shipped line presses over both acts, several seeds.
    const picked = new Set<string>();
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      driveChapterWithTriggers(seed, {
        onDecision: (engine, d) => {
          const view = buildGuideView(engine.state(), { actorId: d.actorId, commands: d.commands });
          if (view?.next) picked.add(view.next.label);
        },
      });
    }
    // The core of the line must be explained: Darkness for the knights, Protect for Yuna. The rest (Shell, Phoenix Down, the heals) depend on how a fight goes.
    expect(picked.has('Darkness')).toBe(true);
    expect(picked.has('Protect')).toBe(true);
    const labels = new Set(FFX2_EXPERIMENT_GUIDE.hints.flatMap((h) => (h.when.labels ?? []).map((l) => l.toLowerCase())));
    for (const l of picked) expect(labels.has(l.toLowerCase()), `the tactic picks "${l}" and no hint explains it`).toBe(true);
  });
});

describe('the document', () => {
  it('opens on the prototype\'s page for Act I and on the rebuilt machine\'s page for Act II', () => {
    const d = FFX2_EXPERIMENT_DOC;
    const protoHead = d.blocks.findIndex((b) => b.t === 'head' && (b.at ?? []).includes(EXPERIMENT_PROTOTYPE_ID));
    const fullHead = d.blocks.findIndex((b) => b.t === 'head' && (b.at ?? []).includes(EXPERIMENT_ENEMY_ID));
    expect(protoHead).toBeGreaterThan(-1);
    expect(fullHead).toBeGreaterThan(protoHead);
    expect(docForState(fakeBoard('ffx2', [{ id: EXPERIMENT_PROTOTYPE_ID }]))?.id).toBe(ID);
    expect(docForState(fakeBoard('ffx', [{ id: EXPERIMENT_PROTOTYPE_ID }]))).toBeNull(); // an FFX board never reaches an FFX-2 document
    expect(startBlockIndex(d, fakeBoard('ffx2', [{ id: EXPERIMENT_PROTOTYPE_ID }]))).toBe(protoHead);
    expect(startBlockIndex(d, fakeBoard('ffx2', [{ id: EXPERIMENT_ENEMY_ID }]))).toBe(fullHead);
  });

  it('prints the numbers this game uses: HP 18,324, Steal Turbo Ether, Drop Elixir, one row for the one machine', () => {
    const rows = FFX2_EXPERIMENT_DOC.blocks.flatMap((b) => (b.t === 'loot' ? b.rows : []));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({ enemy: 'Experiment', hp: EXPERIMENT_HP.toLocaleString('en-US'), steal: 'Turbo Ether', drop: 'Elixir' });
    const e = experimentActTwoGroup.enemies[0]!;
    expect(e.rewards.steal?.common.itemId).toBe('x2-turbo-ether');
    expect(e.rewards.drops?.[0]?.itemId).toBe('x2-elixir');
    expect(e.stats.maxHp).toBe(EXPERIMENT_HP);
  });

  it('says the plan in the machine\'s own order, without the dig, the manuals or Auto-Life, which this game does not model', () => {
    const text = JSON.stringify(FFX2_EXPERIMENT_DOC.blocks);
    for (const word of ['dig', 'manual', 'Auto-Life', 'Primer', 'trophy']) expect(text.toLowerCase().includes(word.toLowerCase()), word).toBe(false);
    for (const word of ['Protect', 'Darkness', 'Lifeslicer', 'Annihilator', 'Phoenix Down', 'Shell']) expect(text.includes(word), word).toBe(true);
  });
});
