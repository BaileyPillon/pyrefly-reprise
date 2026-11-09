/**
 * The hidden Shinryu chapter's story layer (`src/story/scripts/shinryu.ts`; FFX only; a DRAFT for Bailey to read): the scenes lint clean, the sizes are what the draft promises, the one callout is wired to a script that exists
 * and fits its budget, and the voices keep to the writing bible. The chapter is deliberately NOT in `src/story/registry.ts` (its tests pin that the registry's keys are the listed chapters), so the audits that file runs for
 * the registered chapters are repeated here for this one.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';
import { SHINRYU_ID } from '../../../src/data/ffx/shinryu-ids.ts';
import { blockingSteps, MID_SCRIPT_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { SHINRYU_CALLOUTS, shinryuScripts } from '../../../src/story/scripts/shinryu.ts';

const src = readFileSync(new URL('../../../src/story/scripts/shinryu.ts', import.meta.url), 'utf8');
const header = src.slice(0, src.indexOf('*/'));
const chapter = getChapter('shinryu')!;
const scripts = chapter.scriptsRef;
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and a scene that ends on the results', () => {
    expect(scripts).toBe(shinryuScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post.some((s) => s.type === 'results')).toBe(true);
    expect(scripts.victoryQuips).toEqual({});
  });

  it('lints clean: no line over the box, no stray ellipsis, no markup, in every scene and callout', () => {
    for (const [name, script] of [['pre', scripts.pre], ['post', scripts.post], ...Object.entries(scripts.midScripts)] as Array<[string, StoryScript]>) expect(lintScript(script), name).toEqual([]);
  });

  it('plays the sizes the draft promises: seven lines before, five after, one to the callout', () => {
    expect(lines(scripts.pre)).toHaveLength(7);
    expect(lines(scripts.post)).toHaveLength(5);
    for (const id of Object.values(SHINRYU_CALLOUTS)) expect(lines(scripts.midScripts[id]!), id).toHaveLength(1);
  });
});

describe("the trigger and the script agree (the registry's audits, repeated for a chapter it does not list)", () => {
  const triggers = scripts.mid;

  it('the one trigger is once-only and names a script that exists; every script has exactly one trigger', () => {
    expect(new Set(triggers.map((t) => t.id)).size).toBe(triggers.length);
    for (const t of triggers) {
      expect(t.once, t.id).toBe(true);
      expect(scripts.midScripts[t.script], t.id).toBeDefined();
    }
    expect(triggers.map((t) => t.script).sort()).toEqual(Object.keys(scripts.midScripts).sort());
    expect(triggers).toHaveLength(1);
  });

  it('the callout fires on the first Eraser, an ability that exists; the dragon\'s fall is the end: no seam, the post scene plays', () => {
    const when = triggers.find((t) => t.script === SHINRYU_CALLOUTS.eraser)!.when;
    expect(when).toMatchObject({ type: 'ability-used', who: SHINRYU_ID, ability: 'shinryu-eraser' });
    expect(ALL_ABILITIES.some((a) => a.id === (when as { ability: string }).ability)).toBe(true);
    expect(triggers.some((t) => t.when.type === 'ko')).toBe(false);
  });

  it('the callout fits the 8 s interrupt budget with no blocking step', () => {
    for (const id of Object.values(SHINRYU_CALLOUTS)) {
      const script = scripts.midScripts[id]!;
      expect(blockingSteps(script), `${id} has no blocking step`).toEqual([]);
      expect(scriptDurationMs(script), id).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
    }
  });
});

describe('the voices keep to the writing bible', () => {
  const all = [...lines(scripts.pre), ...lines(scripts.post), ...Object.values(scripts.midScripts).flatMap(lines)];

  it('only the three who swim speak, and the dragon speaks no word', () => {
    for (const l of all) {
      if (l.type !== 'say') continue;
      expect(['tidus', 'wakka', 'rikku'], l.text).toContain(l.who);
    }
    expect(all.map((l) => l.text).join(' ')).not.toMatch(/Seymour|Jecht|Yu Yevon|Yunalesca/);
  });

  it('no line quotes the retail script: every line is under seventeen words', () => {
    for (const l of all) expect(l.text.split(/\s+/).length, l.text).toBeLessThanOrEqual(16);
  });

  it('Wakka says "ya" somewhere and calls Tidus brudda; Rikku stacks her words ("okay okay okay"); Tidus asks or wonders', () => {
    expect(all.some((l) => l.type === 'say' && l.who === 'wakka' && /\bya\b/.test(l.text))).toBe(true);
    expect(all.some((l) => l.type === 'say' && l.who === 'wakka' && /\bbrudda\b/.test(l.text))).toBe(true);
    expect(all.some((l) => l.type === 'say' && l.who === 'rikku' && /okay okay okay/i.test(l.text))).toBe(true);
    expect(all.some((l) => l.type === 'say' && l.who === 'tidus')).toBe(true);
  });

  it('the post scene names no count of swimmers: about one win in three has a swimmer the Eraser shattered, and the scene (its own screen and runner, no battle roster) cannot know', () => {
    const post = lines(scripts.post).map((l) => l.text).join(' ');
    expect(post).not.toMatch(/\b(all|both)\b[^.!?]*\b(three|two)\b|\bthree of you\b|\ball of you\b|\bone,? two\b|\bevery one of (you|us)\b|\bthe three\b|\bwe all (made|lived|survived)\b/i);
    expect(post).not.toMatch(/\b(one|two|three)\b/i);
    // the count line is a question and its answer is true for one, two or three
    expect(lines(scripts.post).some((l) => l.type === 'say' && l.who === 'rikku' && /count off/i.test(l.text))).toBe(true);
    expect(lines(scripts.post).some((l) => l.type === 'say' && /however many/i.test(l.text))).toBe(true);
  });

  it('the lines teach the fight without a tutorial: it strikes back, the Eraser turns one to stone, the water breaks stone', () => {
    const text = all.map((l) => l.text).join(' ');
    expect(text).toMatch(/strikes back/);
    expect(text).toMatch(/turn to stone|turns to stone/);
    expect(text).toMatch(/water breaks/);
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
      ['Wakka', /Wakka warm and plain with his "ya" \((\d\.\d+)\)/],
      ['Rikku', /Rikku fast and self-correcting \((\d\.\d+)\)/],
    ];
    for (const [who, pattern] of cited) {
      const m = pattern.exec(flat);
      expect(m, `${who}: the header cites a section`).not.toBeNull();
      const heading = new RegExp(`^#{2,4} ${m![1]!.replace('.', '\\.')}[ .].*`, 'm').exec(bible);
      expect(heading, `${who}: section ${m![1]} exists in the bible`).not.toBeNull();
      expect(heading![0].toLowerCase(), `${who}: section ${m![1]} is about ${who}`).toContain(who.toLowerCase());
    }
  });
});
