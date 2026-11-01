import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { EnemyGroupDef } from '../../src/battle/common/types.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { findEnemyGroup } from '../../src/app/screens/BattleScreenSetup.ts';
import { TREATED_CHAPTERS, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { RIM_COMPANIONS, TREATED_RIM_FOES } from '../../src/engine/look/pro/RimFigures.ts';

/**
 * THE REVIEW OF `booth-b4` (2026-10-31), MINORS m1, m2 AND m3 (both games; presentation records and one table pin, nothing a player sees).
 *
 *  m1. `TREATED_RIM_FOES` is the one shared table the merge grew (`evrae`, `overdrive-sin`) and nothing pinned its reach against the booth pair: a booth boss id added to it passed all 95 rim and boss-clean tests. It is pinned here by DATA:
 *      the foes of Chapter I and Chapter IV (every enemy and part of every link of their chains) and the booth's own companion are not on it, and every listed chapter that stages a foe on it is a treated chapter of that foe's game.
 *  m2. The doc comment of `engine/HeadlineBoss.ts` called the Mirror Aeons chapter untreated; it is treated (`mirror-aeons`) and its second link's declared boss is what the ribbon reads. The comment is pinned to the data.
 *  m3. The resolved tests still counted the list as fourteen in a title and in two headers; the assertions use eighteen. The words are pinned so a later merge does not bring them back.
 */
const BOOTH = ['seymour-flux', 'ffx2-bahamut'] as const;

beforeEach(() => setTreatedScope('all'));
afterEach(() => setTreatedScope(null));

/** Every combatant id (enemy and part) of every link of a chapter's chain, in the chapter's own game. */
async function stagedIds(chapterId: string): Promise<{ ids: Set<string>; declared: string[] }> {
  const ids = new Set<string>();
  const declared: string[] = [];
  const seen = new Set<string>();
  let g: EnemyGroupDef | null = getChapter(chapterId)!.enemyGroupRef;
  while (g && !seen.has(g.id)) {
    seen.add(g.id);
    for (const e of [...g.enemies, ...(g.parts ?? [])]) ids.add(e.id);
    if (g.bossId !== undefined) declared.push(g.bossId);
    g = g.nextGroupId ? await findEnemyGroup(g.nextGroupId) : null;
  }
  return { ids, declared };
}

describe('m1: TREATED_RIM_FOES against the booth pair and the treated list', () => {
  it('no foe of Chapter I or Chapter IV is on it, and neither is Mortiorchis (the booth pair\'s rim is the approved target\'s own, through `BOSS_CLEAN_ARTS` and `RIM_COMPANIONS`; it moves with Bailey\'s pick, not with a merge)', async () => {
    for (const id of BOOTH) {
      const { ids } = await stagedIds(id);
      expect(ids.size, `${id} stages foes`).toBeGreaterThan(0);
      for (const foe of ids) expect(Object.prototype.hasOwnProperty.call(TREATED_RIM_FOES, foe), `${id}: ${foe}`).toBe(false);
    }
    expect(Object.keys(RIM_COMPANIONS)).toEqual(['mortiorchis']);
    expect(Object.prototype.hasOwnProperty.call(TREATED_RIM_FOES, 'mortiorchis')).toBe(false);
  });

  it('every listed chapter that stages a foe on it is a treated chapter of that foe\'s game (rule 14), and the batch\'s two foes are staged by Chapters VIII and XVIII only', async () => {
    const stagedBy = new Map<string, string[]>();
    for (const c of CHAPTERS) {
      const { ids } = await stagedIds(c.id);
      for (const foe of ids) if (Object.prototype.hasOwnProperty.call(TREATED_RIM_FOES, foe)) stagedBy.set(foe, [...(stagedBy.get(foe) ?? []), c.id]);
    }
    expect(stagedBy.size, 'the walk finds the table\'s foes').toBeGreaterThan(20);
    for (const [foe, chapters] of stagedBy) {
      for (const id of chapters) {
        expect(Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, id), `${foe} is staged by ${id}, which is not on the treated list`).toBe(true);
        expect(TREATED_CHAPTERS[id]!.game, `${foe} in ${id}`).toBe(TREATED_RIM_FOES[foe]);
      }
    }
    expect(stagedBy.get('evrae')).toEqual(['evrae-airship']);
    expect(stagedBy.get('overdrive-sin')).toEqual(['sin-face']);
  });

  it('every key is a string the table owns with a game the registry knows', () => {
    for (const [foe, game] of Object.entries(TREATED_RIM_FOES)) expect(['ffx', 'ffx2'], foe).toContain(game);
  });
});

describe('m2: the HeadlineBoss comment tells the truth about the list', () => {
  it('the chapters whose formations declare a boss are Chapter VII and the Mirror Aeons chapter on the treated list, and Biran and Yenke, the Last Summoning, Sinspawn Gui and the Tourist Trap off it', async () => {
    const declaring: string[] = [];
    for (const c of [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS]) if ((await stagedIds(c.id)).declared.length > 0) declaring.push(c.id);
    const treated = declaring.filter((id) => Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, id));
    expect(treated.sort()).toEqual(['mirror-aeons', 'seymour-anima-macalania']);
    expect(declaring.filter((id) => !treated.includes(id)).length, 'the others are all off the list').toBeGreaterThan(0);
    expect((await stagedIds('mirror-aeons')).declared, 'only the second link declares a boss; the first reads the first visible foe, Dark Mindy').toEqual(['dark-yojimbo']);
  });

  it('the comment names Chapter 27 as treated and no longer lists the Mirror aeons among the formations off the list', () => {
    const doc = readFileSync(resolve('src/engine/HeadlineBoss.ts'), 'utf8').replace(/\r\n/g, '\n');
    expect(doc).not.toMatch(/Yenke,\s*\n?\s*\*?\s*the Mirror aeons/);
    expect(doc).toMatch(/Chapter 27/);
    expect(doc).toMatch(/none of which is on `DemoGate\.TREATED_CHAPTERS`/);
  });
});

describe('m3: no resolved test counts the list as fourteen', () => {
  it('booth-treated-chapters and booth-b3-r70-verdicts say eighteen where they say how many the list holds', () => {
    const read = (f: string): string => readFileSync(resolve('tests/unit', f), 'utf8').replace(/\r\n/g, '\n');
    const treated = read('./booth-treated-chapters.test.ts');
    const verdicts = read('./booth-b3-r70-verdicts.test.ts');
    expect(treated).not.toMatch(/put IX, XII, V and XI back: fourteen/);
    expect(verdicts).not.toMatch(/so the list is the union, FOURTEEN/);
    expect(verdicts).not.toMatch(/so the list is FOURTEEN/);
    expect(treated).toMatch(/eighteen/);
    expect(verdicts).toMatch(/EIGHTEEN/);
  });
});

describe('the full-suite finding of the review fixes: a hold reason names no .json file', () => {
  it('no reason in PIECE_HOLDS contains ".json" (tests/unit/art-sidecar-redact.test.ts counts any string literal in src/ that does as a reader of an art JSON, and PieceHoldsLast.ts tripped it by naming the approved-hashes file)', async () => {
    const { PIECE_HOLDS } = await import('../../src/engine/motion/DemoGate.ts');
    let n = 0;
    for (const [id, holds] of Object.entries(PIECE_HOLDS)) {
      for (const [piece, why] of Object.entries(holds)) {
        n += 1;
        expect(why, `${id}.${piece}`).not.toMatch(/\.json\b/);
      }
    }
    expect(n, 'the walk reads the rows').toBeGreaterThan(40);
  });
});
