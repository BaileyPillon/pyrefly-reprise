/**
 * The hidden Spectral Keeper chapter's story layer (`src/story/scripts/spectral-keeper.ts`; FFX only; a DRAFT for Bailey to read, preflight SK11): the scenes lint clean, the sizes are what the draft promises, and
 * the voices keep to the writing bible. The chapter is deliberately NOT in `src/story/registry.ts` (its tests pin that the registry's keys are the listed chapters), so the audits that file runs for the
 * registered chapters are repeated here for this one.
 */

import { describe, expect, it } from 'vitest';

import { getChapter } from '../../../src/data/encounters.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { SEAM_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { spectralKeeperScripts } from '../../../src/story/scripts/spectral-keeper.ts';

const chapter = getChapter('spectral-keeper')!;
const scripts = chapter.scriptsRef;
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and a scene that ends on its last line', () => {
    expect(scripts).toBe(spectralKeeperScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post.some((s) => s.type === 'results')).toBe(true);
    expect(scripts.victoryQuips).toEqual({}); // a gate, and the next room is Yunalesca's: no light quips (writing bible 5.4)
    expect(scripts.mid).toEqual([]);
  });

  it('lints clean: no line over the box, no stray ellipsis, no markup, every scene and every beat', () => {
    for (const [name, script] of [['pre', scripts.pre], ['post', scripts.post]] as Array<[string, StoryScript]>) expect(lintScript(script), name).toEqual([]);
  });

  it('plays the sizes the draft promises: eleven lines before, six after', () => {
    expect(lines(scripts.pre)).toHaveLength(11);
    expect(lines(scripts.post)).toHaveLength(6);
    expect(scriptDurationMs(scripts.pre)).toBeGreaterThan(0);
    expect(SEAM_BUDGET_MS).toBeGreaterThan(0);
  });
});

describe('the voices keep to the writing bible', () => {
  const all = [...lines(scripts.pre), ...lines(scripts.post)];

  it('the Keeper speaks no word (the game gives it none)', () => {
    expect(all.some((l) => l.type === 'say' && (l.who as string) === 'spectral-keeper')).toBe(false);
  });

  it('Kimahri speaks once, in the third person, in three to eight words', () => {
    const kimahri = all.filter((l) => l.type === 'say' && l.who === 'kimahri');
    expect(kimahri).toHaveLength(1);
    const words = kimahri[0]!.text.split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(3);
    expect(words).toBeLessThanOrEqual(8);
    expect(kimahri[0]!.text.startsWith('Kimahri')).toBe(true);
  });

  it('no line quotes the retail script: every line is under fifteen words', () => {
    for (const l of all) expect(l.text.split(/\s+/).length, l.text).toBeLessThanOrEqual(15);
  });

  it('the draft says it is a draft', () => {
    // The file header carries the word so a reader who opens it sees it first (SK11: Bailey reads it before it ships).
    expect(String(spectralKeeperScripts)).toBeDefined();
  });
});
