/**
 * The hidden Oblitzerator chapter's story layer (`src/story/scripts/oblitzerator.ts`; FFX only; a DRAFT for Bailey to read): the scenes lint clean, the sizes are what the draft promises, the voices keep to the writing bible,
 * and the six banners the AI raises have a script each. The chapter is deliberately NOT in `src/story/registry.ts` (its tests pin that the registry's keys are the listed chapters), so the audits that file runs for the
 * registered chapters are repeated here for this one.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { OBLITZERATOR_CALLOUTS } from '../../../src/data/ffx/oblitzerator-ids.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { MID_SCRIPT_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { OBLITZERATOR_STORY_CALLOUTS, oblitzeratorScripts } from '../../../src/story/scripts/oblitzerator.ts';

const src = readFileSync(new URL('../../../src/story/scripts/oblitzerator.ts', import.meta.url), 'utf8');
const header = src.slice(0, src.indexOf('*/'));
const chapter = getChapter('oblitzerator')!;
const scripts = chapter.scriptsRef;
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and a scene that ends on its last line', () => {
    expect(scripts).toBe(oblitzeratorScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post.some((s) => s.type === 'results')).toBe(true);
    expect(scripts.victoryQuips).toEqual({});
    expect(scripts.mid).toEqual([]); // the banners are raised by the AI, not by a trigger on a state change
  });

  it('lints clean: no line over the box, no stray ellipsis, no markup, every scene, every beat and each banner', () => {
    for (const [name, script] of [['pre', scripts.pre], ['post', scripts.post], ...Object.entries(scripts.midScripts)] as Array<[string, StoryScript]>) expect(lintScript(script), name).toEqual([]);
  });

  it('plays the sizes the draft promises: nine lines before (one narration), five after, one line a banner', () => {
    expect(lines(scripts.pre)).toHaveLength(9);
    expect(lines(scripts.pre).filter((l) => l.type === 'narrate')).toHaveLength(1);
    expect(lines(scripts.post)).toHaveLength(5);
    expect(scriptDurationMs(scripts.pre)).toBeGreaterThan(0); // the pre and post scenes own the screen: no budget
    for (const [name, script] of Object.entries(scripts.midScripts)) {
      expect(lines(script), name).toHaveLength(1);
      expect(scriptDurationMs(script), name).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS); // a mid-battle callout carries its own timing (writing bible 2.1)
      expect((lines(script)[0] as unknown as { text: string }).text.split(/\s+/).length, name).toBeLessThanOrEqual(14); // short by construction (writing bible 3 E6 caps a callout at about ten words)
    }
  });

  it('says it is a draft for Bailey to read, first in the file', () => {
    expect(header.indexOf('THIS IS A DRAFT FOR BAILEY TO READ')).toBeGreaterThan(-1);
  });

  it('keeps to the writing bible: Kimahri speaks in three to eight words with no contraction and in the third person; Lulu has no slang; the game\'s own lines are not quoted', () => {
    const spoken = (who: string): string[] => [...lines(scripts.pre), ...lines(scripts.post), ...Object.values(scripts.midScripts).flatMap(lines)].filter((l) => l.type === 'say' && (l as unknown as { who: string }).who === who).map((l) => (l as unknown as { text: string }).text);
    for (const t of spoken('kimahri')) {
      expect(t.split(/\s+/).length, t).toBeGreaterThanOrEqual(2);
      expect(t.split(/\s+/).length, t).toBeLessThanOrEqual(8);
      expect(t, t).not.toMatch(/\b(I|me|my)\b|n't|'s\b/);
    }
    for (const t of spoken('lulu')) expect(t, t).not.toMatch(/\bya\b|\bgonna\b|\bkinda\b/i);
    for (const bad of [/the crane responds/i, /crane activated/i, /out of power/i, /seems to respond/i]) expect(src.replace(/\/\*\*[\s\S]*?\*\//, '')).not.toMatch(bad);
  });
});

describe('the six banners the battle layer raises have a script each, under the same name', () => {
  it('the story layer\'s names equal the data layer\'s, and every callout the data names has a script', () => {
    expect(OBLITZERATOR_STORY_CALLOUTS).toEqual(OBLITZERATOR_CALLOUTS);
    for (const name of Object.values(OBLITZERATOR_CALLOUTS)) expect(Object.keys(scripts.midScripts), name).toContain(name);
    expect(Object.keys(scripts.midScripts).sort()).toEqual(Object.values(OBLITZERATOR_CALLOUTS).sort());
  });
});
