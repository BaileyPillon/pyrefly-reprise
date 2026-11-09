/**
 * The hidden Belgemine's Challenge chapter's story layer (`src/story/scripts/belgemine.ts`; FFX only; a DRAFT for Bailey to read): the scenes lint clean, the sizes are what the draft promises, and the voices keep to the
 * writing bible. The chapter is deliberately NOT in `src/story/registry.ts` (its tests pin that the registry's keys are the listed chapters), so the audits that file runs for the registered chapters are run here.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getChapter } from '../../../src/data/encounters.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { SEAM_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { belgemineScripts } from '../../../src/story/scripts/belgemine.ts';

const src = readFileSync(new URL('../../../src/story/scripts/belgemine.ts', import.meta.url), 'utf8');
const header = src.slice(0, src.indexOf('*/'));
const chapter = getChapter('belgemine')!;
const scripts = chapter.scriptsRef;
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and a scene that ends on its last line', () => {
    expect(scripts).toBe(belgemineScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post.some((s) => s.type === 'results')).toBe(true);
    expect(scripts.victoryQuips).toEqual({});
    expect(scripts.mid).toEqual([]);
  });

  it('lints clean: no line over the box, no stray ellipsis, no markup, every scene and every beat', () => {
    for (const [name, script] of [['pre', scripts.pre], ['post', scripts.post]] as Array<[string, StoryScript]>) expect(lintScript(script), name).toEqual([]);
  });

  it('plays the sizes the draft promises: nine lines before, six after', () => {
    expect(lines(scripts.pre)).toHaveLength(9);
    expect(lines(scripts.post)).toHaveLength(6);
    expect(scriptDurationMs(scripts.pre)).toBeGreaterThan(0);
    expect(SEAM_BUDGET_MS).toBeGreaterThan(0);
  });

  it('plays the temple\'s bed and the stand-in boss cue the chapter names', () => {
    const cues = scripts.pre.filter((s) => s.type === 'music').map((s) => (s as { track: string | null }).track);
    expect(cues).toContain(chapter.music.scene);
    expect(cues).toContain(chapter.music.battle);
  });
});

describe('the voices keep to the writing bible', () => {
  const all = [...lines(scripts.pre), ...lines(scripts.post)];

  it('Belgemine has no box of her own (no speaker id exists for her): her words are reported by the narrator, who speaks in the past tense', () => {
    expect(all.some((l) => l.type === 'say' && (l.who as string) === 'belgemine')).toBe(false);
    const narration = all.filter((l) => l.type === 'narrate');
    expect(narration.length).toBeGreaterThanOrEqual(3);
    for (const n of narration) expect(n.text, n.text).toMatch(/\b(was|were|had|told|asked|bowed|laughed|did|waited)\b/);
  });

  it('Kimahri is not in a duel (Yuna fights alone), and Yuna speaks the chapter\'s opening answer', () => {
    expect(all.some((l) => l.type === 'say' && l.who === 'kimahri')).toBe(false);
    const yuna = all.filter((l) => l.type === 'say' && l.who === 'yuna');
    expect(yuna.length).toBeGreaterThanOrEqual(2);
  });

  it('Auron is laconic: every one of his lines is under ten words', () => {
    for (const l of all.filter((x) => x.type === 'say' && x.who === 'auron')) expect(l.text.split(/\s+/).length, l.text).toBeLessThanOrEqual(15);
  });

  it('the header says it is a draft, FFX only, that the lines are ours, and why Belgemine is narrated', () => {
    expect(header).toMatch(/DRAFT FOR BAILEY/);
    expect(header).toMatch(/FFX only/);
    expect(header).toMatch(/Every line is ours/);
    expect(header).toMatch(/SpeakerId/);
  });

  it('no line quotes the game\'s script: none repeats a phrase of the pre-existing chapters\' scenes verbatim', () => {
    const seen = new Set(lines(scripts.pre).map((l) => l.text));
    expect(seen.size).toBe(lines(scripts.pre).length);
  });
});
