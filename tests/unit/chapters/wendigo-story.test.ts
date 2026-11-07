/**
 * The hidden Wendigo chapter's scenes (FFX only; `src/story/scripts/wendigo.ts`): silent, by the preflight's CW15 (the game's battle script has no message and no scene; nothing is quoted, nothing is invented). The lint
 * passes, the script says no word, the pre scene ends in the fight and the post scene shows the results, and the chapter is NOT in the listed chapters' registry.
 */

import { describe, expect, it } from 'vitest';

import { lintScript } from '../../../src/story/dsl.ts';
import { CHAPTER_KEYS } from '../../../src/story/registry.ts';
import { wendigoScripts } from '../../../src/story/scripts/wendigo.ts';

describe('the scenes are silent', () => {
  it('no line of dialogue, narration or choice in the pre scene, the post scene or anywhere else', () => {
    const all = [...wendigoScripts.pre, ...wendigoScripts.post];
    for (const step of all) expect(['say', 'narrate', 'choice'], step.type).not.toContain(step.type);
    expect(wendigoScripts.victoryQuips).toEqual({});
    expect(wendigoScripts.mid).toEqual([]);
  });

  it('the lint finds nothing', () => {
    expect(lintScript(wendigoScripts.pre)).toEqual([]);
    expect(lintScript(wendigoScripts.post)).toEqual([]);
  });

  it('the pre scene ends in the fight, the post scene holds the results page', () => {
    expect(wendigoScripts.pre.at(-1)?.type).toBe('battleStart');
    expect(wendigoScripts.post.some((s) => s.type === 'results')).toBe(true);
  });

  it('the pre scene fades the lake in and sets the Temple\'s bed, then the stand-in boss cue', () => {
    const music = wendigoScripts.pre.filter((s) => s.type === 'music').map((s) => (s as { track: string | null }).track);
    expect(music).toEqual(['scene-macalania-temple', 'boss-challenge']);
    expect(wendigoScripts.pre.some((s) => s.type === 'fade')).toBe(true);
  });

  it('the chapter is hidden: it is not in the listed chapters\' story registry', () => {
    expect((CHAPTER_KEYS as string[])).not.toContain('wendigo');
  });
});
