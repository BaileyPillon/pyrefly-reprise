/**
 * The hidden Spherimorph chapter's story layer (`src/story/scripts/spherimorph.ts`; FFX only; a DRAFT for Bailey to read): the scenes lint clean, the sizes are what the draft promises, the voices keep to the writing
 * bible, and the two banners the AI raises have a script each. The chapter is deliberately NOT in `src/story/registry.ts` (its tests pin that the registry's keys are the listed chapters), so the audits that file runs
 * for the registered chapters are repeated here for this one.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { SPHERIMORPH_CALLOUTS } from '../../../src/data/ffx/spherimorph-ids.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { SEAM_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { spherimorphScripts } from '../../../src/story/scripts/spherimorph.ts';

const src = readFileSync(new URL('../../../src/story/scripts/spherimorph.ts', import.meta.url), 'utf8');
const header = src.slice(0, src.indexOf('*/'));
const chapter = getChapter('spherimorph')!;
const scripts = chapter.scriptsRef;
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and a scene that ends on its last line', () => {
    expect(scripts).toBe(spherimorphScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post.some((s) => s.type === 'results')).toBe(true);
    expect(scripts.victoryQuips).toEqual({}); // the next place is the temple: no light quips (writing bible 5.4)
    expect(scripts.mid).toEqual([]); // the banners are raised by the AI, not by a trigger on a state change
  });

  it('lints clean: no line over the box, no stray ellipsis, no markup, every scene, every beat and each banner', () => {
    for (const [name, script] of [['pre', scripts.pre], ['post', scripts.post], ...Object.entries(scripts.midScripts)] as Array<[string, StoryScript]>) expect(lintScript(script), name).toEqual([]);
  });

  it('plays the sizes the draft promises: eleven lines before (one narration), six after', () => {
    expect(lines(scripts.pre)).toHaveLength(11);
    expect(lines(scripts.pre).filter((l) => l.type === 'narrate')).toHaveLength(1);
    expect(lines(scripts.post)).toHaveLength(6);
    expect(scriptDurationMs(scripts.pre)).toBeGreaterThan(0);
    expect(SEAM_BUDGET_MS).toBeGreaterThan(0);
  });

  it('plays the Macalania bed and the stand-in boss cue the chapter names', () => {
    const cues = scripts.pre.filter((s) => s.type === 'music').map((s) => (s as { track: string | null }).track);
    expect(cues).toContain(chapter.music.scene);
    expect(cues).toContain(chapter.music.battle);
  });
});

describe('the two banners: the names the AI emits, and a script for each', () => {
  it('there is exactly one script per emitted name, and no other mid script', () => {
    expect(Object.keys(scripts.midScripts).sort()).toEqual([SPHERIMORPH_CALLOUTS.first, SPHERIMORPH_CALLOUTS.second].sort());
  });

  it('the first is Lulu\'s (she is the one who reads it), the second Yuna\'s; each is one short line that carries its own timing', () => {
    const first = scripts.midScripts[SPHERIMORPH_CALLOUTS.first]!;
    const second = scripts.midScripts[SPHERIMORPH_CALLOUTS.second]!;
    expect(lines(first)).toHaveLength(1);
    expect(lines(second)).toHaveLength(1);
    expect((lines(first)[0] as { who: string }).who).toBe('lulu');
    expect((lines(second)[0] as { who: string }).who).toBe('yuna');
    for (const s of [first, second]) expect(scriptDurationMs(s)).toBeLessThan(6_000);
  });
});

describe('the voices keep to the writing bible', () => {
  const all = [...lines(scripts.pre), ...lines(scripts.post)];

  it('Spherimorph speaks no word (the game gives it none)', () => {
    expect(all.some((l) => l.type === 'say' && (l.who as string) === 'spherimorph')).toBe(false);
  });

  it('no line quotes the retail script: every scene line is under sixteen words, every banner under twenty-five', () => {
    for (const l of all) expect(l.text.split(/\s+/).length, l.text).toBeLessThanOrEqual(15);
    for (const s of Object.values(scripts.midScripts)) for (const l of lines(s)) expect(l.text.split(/\s+/).length, l.text).toBeLessThanOrEqual(24);
  });

  it('teaches the fight in the party\'s voice without a tutorial: one element, the first blow shows which; and puts no number in the words', () => {
    const text = [...lines(scripts.pre), ...Object.values(scripts.midScripts).flatMap(lines)].map((l) => l.text).join(' ');
    expect(text).toMatch(/one element/i);
    expect(text).toMatch(/strike it plain/i);
    expect(text).toMatch(/opposite/i);
    expect(text).not.toMatch(/\d/); // no number in the words: the numbers are the guide's
  });

  it('the file says it is a draft for Bailey to read, first, where a reader who opens it sees it', () => {
    expect(header).toMatch(/THIS IS A DRAFT FOR BAILEY TO READ/);
    expect(src.indexOf('THIS IS A DRAFT')).toBeLessThan(src.indexOf('import '));
  });

  it('every writing-bible section the header cites is the voice it names', () => {
    const bible = readFileSync(new URL('../../../research/writing-bible.md', import.meta.url), 'utf8');
    const flat = header.replace(/\r?\n \* /g, ' ');
    const cited: Array<[string, RegExp]> = [
      ['Tidus', /Tidus asking what he does not know \((\d\.\d+)\)/],
      ['Yuna', /Yuna complete and unhurried \((\d\.\d+)\)/],
      ['Auron', /Auron laconic and dry \((?:section )?(\d\.\d+)\)/],
      ['Wakka', /Wakka warm and plain with his "ya" \((\d\.\d+)\)/],
      ['Lulu', /Lulu dry \((\d\.\d+)\)/],
    ];
    for (const [who, pattern] of cited) {
      const m = pattern.exec(flat);
      expect(m, `the header cites ${who}`).not.toBeNull();
      const section = m![1]!;
      expect(bible, `${who} is section ${section} of the writing bible`).toMatch(new RegExp(`^### ${section.replace('.', '\\.')} ${who}`, 'm'));
    }
  });
});
