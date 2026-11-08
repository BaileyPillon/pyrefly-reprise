/**
 * The hidden Omega Ruins chapter's story layer (`src/story/scripts/omega-ruins.ts`; FFX only; a DRAFT for Bailey to read): the scenes lint clean, the sizes are what the draft promises, the two seams are wired to the
 * `all-ko` of the Weapons, and the voices keep to the writing bible. The chapter is deliberately NOT in `src/story/registry.ts` (its tests pin that the registry's keys are the listed chapters), so the audits that file runs
 * for the registered chapters are repeated here for this one.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getChapter } from '../../../src/data/encounters.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { SEAM_BUDGET_MS, midBattleDeadlineMs, scriptDurationMs } from '../../../src/story/registry.ts';
import { OMEGA_FALLS, ULTIMA_FALLS, omegaRuinsScripts } from '../../../src/story/scripts/omega-ruins.ts';

const src = readFileSync(new URL('../../../src/story/scripts/omega-ruins.ts', import.meta.url), 'utf8');
const header = src.slice(0, src.indexOf('*/'));
const chapter = getChapter('omega-ruins')!;
const scripts = chapter.scriptsRef;
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the first fight and a scene that ends on its last line', () => {
    expect(scripts).toBe(omegaRuinsScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post.some((s) => s.type === 'results')).toBe(true);
    expect(scripts.victoryQuips).toEqual({}); // the next place is the way up: no light quips (writing bible 5.4)
  });

  it('lints clean: no line over the box, no stray ellipsis, no markup, every scene and every beat', () => {
    const all: Array<[string, StoryScript]> = [['pre', scripts.pre], ['post', scripts.post], ...Object.entries(scripts.midScripts)];
    for (const [name, script] of all) expect(lintScript(script), name).toEqual([]);
  });

  it('plays the sizes the draft promises: seven lines before, six after, three in each seam', () => {
    expect(lines(scripts.pre)).toHaveLength(7);
    expect(lines(scripts.post)).toHaveLength(6);
    expect(lines(scripts.midScripts[ULTIMA_FALLS]!)).toHaveLength(3);
    expect(lines(scripts.midScripts[OMEGA_FALLS]!)).toHaveLength(3);
    expect(scriptDurationMs(scripts.pre)).toBeGreaterThan(0);
    expect(SEAM_BUDGET_MS).toBeGreaterThan(0);
  });

  it('the seams fire once each, on the all-ko of the Weapon that falls, and fit the chain-seam budget with the player\'s hands off (every line carries its own `auto`)', () => {
    expect(scripts.mid).toHaveLength(2);
    expect(scripts.mid[0]).toMatchObject({ id: ULTIMA_FALLS, once: true, when: { type: 'all-ko', ids: ['ultima-weapon'] }, script: ULTIMA_FALLS });
    expect(scripts.mid[1]).toMatchObject({ id: OMEGA_FALLS, once: true, when: { type: 'all-ko', ids: ['omega-weapon'] }, script: OMEGA_FALLS });
    for (const m of scripts.mid) expect(scripts.midScripts[m.script], m.id).toBeDefined();
    for (const id of [ULTIMA_FALLS, OMEGA_FALLS]) {
      const seam = scripts.midScripts[id]!;
      expect(scriptDurationMs(seam), id).toBeLessThanOrEqual(SEAM_BUDGET_MS);
      expect(midBattleDeadlineMs(seam), id).toBeLessThanOrEqual(SEAM_BUDGET_MS + 1_500);
      for (const step of seam) if (step.type === 'say') expect(step.auto, `${id}: ${step.text}`).toBeGreaterThan(0);
    }
  });

  it('plays the Dome\'s bed and the stand-in boss cue the chapter names', () => {
    const cues = scripts.pre.filter((s) => s.type === 'music').map((s) => (s as { track: string | null }).track);
    expect(cues).toContain(chapter.music.scene);
    expect(cues).toContain(chapter.music.battle);
  });
});

describe('the voices keep to the writing bible', () => {
  const all = [...lines(scripts.pre), ...lines(scripts.post), ...Object.values(scripts.midScripts).flatMap(lines)];

  it('the Weapons and Nemesis speak no word (the game gives them none)', () => {
    for (const l of all) expect(['ultima-weapon', 'omega-weapon', 'nemesis'], l.type === 'say' ? l.who : '').not.toContain(l.type === 'say' ? (l.who as string) : '');
  });

  it('only the front line speaks: Tidus, Yuna and Lulu', () => {
    for (const l of all) if (l.type === 'say') expect(['tidus', 'yuna', 'lulu']).toContain(l.who);
  });

  it('every seam line has a fallback among the front line, so a changed line-up still hears the scene', () => {
    for (const script of Object.values(scripts.midScripts)) for (const l of script) if (l.type === 'say') expect(l.fallback?.length ?? 0, l.text).toBeGreaterThanOrEqual(2);
  });

  it('no line quotes the retail script: every line is under sixteen words', () => {
    for (const l of all) expect(l.text.split(/\s+/).length, l.text).toBeLessThanOrEqual(15);
  });

  it('teaches the fights in the party\'s voice without a tutorial and without a number: the aeon, the second life', () => {
    const text = all.map((l) => l.text).join(' ');
    expect(text).toMatch(/aeon/i);
    expect(text).toMatch(/stand twice|standing again/i);
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
