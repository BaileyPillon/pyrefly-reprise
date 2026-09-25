/**
 * **The guide and the tactic are keyed by the game, not by an id both games
 * share** (both games; AGENTS.md rule 14: shared lookup plumbing).
 *
 * The bug: `guideForState` and `tacticFor` asked "which registered boss id is
 * on the board?", and FFX's aeon Bahamut is `'bahamut'`, the same id as
 * Chapter IV's FFX-2 boss. The moment Yuna summoned him in an FFX fight with
 * no guide of its own (the unlisted IX Yojimbo and X Seymour Natus), the
 * strategy panel showed "BAHAMUT" and the autopilot handed every turn to the
 * FFX-2 Bahamut line, which declines a friendly Bahamut and so skipped the
 * generic revive/heal ladder too.
 *
 * Every chapter, listed and unlisted, is driven here through its real chain
 * with the intended line, and every player turn must see its own chapter's
 * guide and tactic, or none.
 *
 * `PYREFLY_LOOKUP_DUMP=<file>` writes every turn record to a JSON file, which
 * is how the listed chapters were compared byte for byte before and after
 * the fix.
 */

import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { CHAPTERS, UNLISTED_CHAPTERS, getChapter, type Chapter } from '../../src/data/encounters.ts';
import { GUIDES } from '../../src/data/guides/index.ts';
import { guideForState, stateOnlyEngine } from '../../src/engine/tactics/guide.ts';
import { TACTICS, tacticFor, ffx2Bahamut } from '../../src/engine/tactics/index.ts';
import { CHAPTER_GAME } from '../../src/engine/tactics/lookup.ts';
import { chainGroups, runChapter, type RunRecord } from './tactics-lookup-harness.ts';

/** The tactic export each chapter is played with; absent = the generic ladder. */
const OWN_TACTIC: Record<string, string> = {
  'seymour-flux': 'seymourFlux',
  yunalesca: 'yunalesca',
  'braskas-final-aeon': 'braskasFinalAeon',
  'ffx2-bahamut': 'ffx2Bahamut',
  'ffx2-vegnagun-shuyin': 'ffx2VegnagunShuyin',
  'ffx2-leblanc': 'ffx2Leblanc',
  'seymour-anima-macalania': 'seymourAnimaMacalania',
  'evrae-airship': 'evrae',
  'yojimbo-cavern': 'yojimboCavern',
  'ffx2-trema': 'ffx2Trema',
  'isaaru-via-purifico': 'isaaruViaPurifico',
};

const ALL: readonly Chapter[] = [...CHAPTERS, ...UNLISTED_CHAPTERS];
const SEEDS = [1, 2];
const MAX_TURNS = 160;

const runs: RunRecord[] = [];

describe('lookup tables agree with the chapter registry', () => {
  it('every guide and every tactic entry names a chapter of the right game', () => {
    for (const g of GUIDES) expect(CHAPTER_GAME[g.id], g.id).toBe(getChapter(g.id)?.game);
    for (const t of TACTICS) expect(CHAPTER_GAME[t.chapterId], t.bossId).toBe(getChapter(t.chapterId)?.game);
    for (const [id, game] of Object.entries(CHAPTER_GAME)) expect(getChapter(id)?.game, id).toBe(game);
  });
});

describe('a friendly Bahamut in an FFX fight picks no FFX-2 guide or tactic', () => {
  it('an FFX board with an aeon "bahamut" on it gets neither the Chapter IV guide nor its tactic', () => {
    const state = {
      game: 'ffx',
      combatants: {
        yuna: { id: 'yuna', side: 'party' },
        bahamut: { id: 'bahamut', side: 'aeon' },
        // Chapter X's boss: IX has its own guide and tactic now.
        'seymour-natus': { id: 'seymour-natus', side: 'enemy' },
      },
    } as unknown as BattleState;
    expect(guideForState(state)).toBeNull();
    expect(tacticFor(stateOnlyEngine(state))).toBeNull();
  });

  it('even an enemy-side "bahamut" in an FFX fight is not Chapter IV', () => {
    const state = { game: 'ffx', combatants: { bahamut: { id: 'bahamut', side: 'enemy' } } } as unknown as BattleState;
    expect(guideForState(state)).toBeNull();
    expect(tacticFor(stateOnlyEngine(state))).toBeNull();
  });

  it('the FFX-2 enemy Bahamut still finds Chapter IV', () => {
    const state = { game: 'ffx2', combatants: { bahamut: { id: 'bahamut', side: 'enemy' } } } as unknown as BattleState;
    expect(guideForState(state)?.id).toBe('ffx2-bahamut');
    expect(tacticFor(stateOnlyEngine(state))).toBe(ffx2Bahamut);
  });

  it('an FFX-2 board never picks an FFX guide, even on an FFX boss id', () => {
    for (const id of ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'anima-macalania', 'evrae']) {
      const state = { game: 'ffx2', combatants: { [id]: { id, side: 'enemy' } } } as unknown as BattleState;
      expect(guideForState(state), id).toBeNull();
      expect(tacticFor(stateOnlyEngine(state)), id).toBeNull();
    }
  });
});

describe('every chapter, listed and unlisted, sees its own guide and tactic or none', () => {
  for (const chapter of ALL) {
    for (const seed of SEEDS) {
      it(`${chapter.id} seed ${seed}`, async () => {
        const run = await runChapter(chapter, seed, MAX_TURNS);
        runs.push(run);
        expect(run.turns.length).toBeGreaterThan(0);
        const ownGuide = GUIDES.some((g) => g.id === chapter.id) ? chapter.id : null;
        const ownTactic = OWN_TACTIC[chapter.id] ?? null;
        for (const t of run.turns) {
          expect(t.guideId, `${chapter.id} link ${t.link} ${t.actorId}`).toBe(ownGuide);
          expect(t.tactic, `${chapter.id} link ${t.link} ${t.actorId}`).toBe(ownTactic);
        }
      }, 60_000);
    }
  }

  // A chain lost at its first link never shows the later ones (XI's Sisters
  // and Anima), so every link is also fought from a fresh build on its own.
  for (const chapter of ALL) {
    it(`${chapter.id}: every link of its chain, on its own`, async () => {
      const ownGuide = GUIDES.some((g) => g.id === chapter.id) ? chapter.id : null;
      const ownTactic = OWN_TACTIC[chapter.id] ?? null;
      for (const group of await chainGroups(chapter)) {
        const run = await runChapter(chapter, 1, 40, group);
        expect(run.turns.length, group.id).toBeGreaterThan(0);
        for (const t of run.turns) {
          expect(t.guideId, `${group.id} ${t.actorId}`).toBe(ownGuide);
          expect(t.tactic, `${group.id} ${t.actorId}`).toBe(ownTactic);
        }
      }
    }, 60_000);
  }

  it('writes the dump when asked', () => {
    const out = process.env['PYREFLY_LOOKUP_DUMP'];
    if (out) writeFileSync(out, JSON.stringify(runs, null, 1));
    expect(runs.length).toBe(ALL.length * SEEDS.length);
  });
});
