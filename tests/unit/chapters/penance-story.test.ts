/**
 * The hidden Penance chapter's story layer (`src/story/scripts/penance.ts`; FFX only; a DRAFT for Bailey to read, preflight SK11): the scenes lint clean, the sizes are what the draft promises, and
 * the voices keep to the writing bible. The chapter is deliberately NOT in `src/story/registry.ts` (its tests pin that the registry's keys are the listed chapters), so the audits that file runs for the
 * registered chapters are repeated here for this one.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getChapter } from '../../../src/data/encounters.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { SEAM_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { penanceScripts } from '../../../src/story/scripts/penance.ts';

const src = readFileSync(new URL('../../../src/story/scripts/penance.ts', import.meta.url), 'utf8');
const header = src.slice(0, src.indexOf('*/'));
const chapter = getChapter('penance')!;
const scripts = chapter.scriptsRef;
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and a scene that ends on its last line', () => {
    expect(scripts).toBe(penanceScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post.some((s) => s.type === 'results')).toBe(true);
    expect(scripts.victoryQuips).toEqual({}); // no light quips after the colossus (writing bible 5.4)
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

  it('Penance speaks no word (the game gives it none)', () => {
    expect(all.some((l) => l.type === 'say' && (l.who as string) === 'penance')).toBe(false);
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

  it('the file says it is a draft for Bailey to read (SK11), first, where a reader who opens it sees it', () => {
    expect(header).toMatch(/THIS IS A DRAFT FOR BAILEY TO READ/);
    expect(src.indexOf('THIS IS A DRAFT')).toBeLessThan(src.indexOf('import '));
  });

  it('every writing-bible section the header cites is the voice it names (the review found Auron, Wakka and Lulu cited one section off)', () => {
    const bible = readFileSync(new URL('../../../research/writing-bible.md', import.meta.url), 'utf8');
    const flat = header.replace(/\r?\n \* /g, ' ');
    const cited: Array<[string, RegExp]> = [
      ['Tidus', /Tidus asking what he does not know \((\d\.\d+)\)/],
      ['Yuna', /Yuna complete and unhurried \((\d\.\d+)\)/],
      ['Auron', /Auron laconic and dry \((?:section )?(\d\.\d+)\)/],
      ['Wakka', /Wakka warm and plain with his "ya" \((\d\.\d+)\)/],
      ['Lulu', /Lulu dry \((\d\.\d+)\)/],
      ['Kimahri', /Kimahri in the third person[^(]*\*\*once\*\* \((\d\.\d+)\)/],
    ];
    for (const [who, pattern] of cited) {
      const m = pattern.exec(flat);
      expect(m, `the header cites ${who}`).not.toBeNull();
      const section = m![1]!;
      expect(bible, `${who} is section ${section} of the writing bible`).toMatch(new RegExp(`^### ${section.replace('.', '\\.')} ${who}`, 'm'));
    }
  });
});
