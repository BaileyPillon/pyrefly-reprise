/**
 * The hidden Dark Aeons chapter's story layer (`src/story/scripts/dark-aeons.ts`; FFX only; a DRAFT for Bailey to read, pick DA13): the scenes lint clean, the sizes are what the draft promises, every seam and callout is
 * wired to a script that exists and fits its budget, and the voices keep to the writing bible. The chapter is deliberately NOT in `src/story/registry.ts` (its tests pin that the registry's keys are the listed chapters), so the
 * audits that file runs for the registered chapters are repeated here for this one.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getChapter } from '../../../src/data/encounters.ts';
import { DARK_SIX_BODIES } from '../../../src/data/ffx/enemies/dark-aeons-six.ts';
import { blockingSteps } from '../../../src/story/registry.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { MID_SCRIPT_BUDGET_MS, SEAM_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { DARK_CALLOUTS, DARK_SEAMS, darkAeonsScripts } from '../../../src/story/scripts/dark-aeons.ts';

const src = readFileSync(new URL('../../../src/story/scripts/dark-aeons.ts', import.meta.url), 'utf8');
const header = src.slice(0, src.indexOf('*/'));
const chapter = getChapter('dark-aeons')!;
const scripts = chapter.scriptsRef;
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and a scene that ends on the results', () => {
    expect(scripts).toBe(darkAeonsScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post.some((s) => s.type === 'results')).toBe(true);
    expect(scripts.victoryQuips).toEqual({}); // six goodbyes in a row: no light quips (writing bible 5.4)
  });

  it('lints clean: no line over the box, no stray ellipsis, no markup, in every scene, seam and callout', () => {
    for (const [name, script] of [['pre', scripts.pre], ['post', scripts.post], ...Object.entries(scripts.midScripts)] as Array<[string, StoryScript]>) expect(lintScript(script), name).toEqual([]);
  });

  it('plays the sizes the draft promises: nine lines before, six after, three to a seam, one to a callout', () => {
    expect(lines(scripts.pre)).toHaveLength(9);
    expect(lines(scripts.post)).toHaveLength(6);
    for (const id of Object.values(DARK_SEAMS)) expect(lines(scripts.midScripts[id]!), id).toHaveLength(3);
    for (const id of Object.values(DARK_CALLOUTS)) expect(lines(scripts.midScripts[id]!), id).toHaveLength(1);
  });
});

describe('the triggers and the scripts agree (the registry\'s audits, repeated for a chapter it does not list)', () => {
  const triggers = scripts.mid;

  it('every trigger is once-only and names a script that exists; every script has exactly one trigger; the ids are unique', () => {
    expect(new Set(triggers.map((t) => t.id)).size).toBe(triggers.length);
    for (const t of triggers) {
      expect(t.once, t.id).toBe(true);
      expect(scripts.midScripts[t.script], t.id).toBeDefined();
    }
    expect(triggers.map((t) => t.script).sort()).toEqual(Object.keys(scripts.midScripts).sort());
    expect(triggers).toHaveLength(13);
  });

  it('a seam fires on the KO of the foe that fell (six, one per link but the last: Dark Ixion\'s two fights are two ids); a callout on the foe\'s gauge reaching 100 (seven)', () => {
    const bodyIds = new Set(DARK_SIX_BODIES.map((b) => b.id));
    const seams = triggers.filter((t) => t.when.type === 'ko');
    const callouts = triggers.filter((t) => t.when.type === 'overdrive');
    expect(seams.map((t) => t.script)).toEqual(Object.values(DARK_SEAMS));
    expect(callouts.map((t) => t.script)).toEqual(Object.values(DARK_CALLOUTS));
    for (const t of [...seams, ...callouts]) expect(bodyIds.has((t.when as { who: string }).who), t.id).toBe(true);
    expect(seams.map((t) => (t.when as { who: string }).who)).toEqual(['dark-valefor', 'dark-ifrit', 'dark-ixion', 'dark-ixion-2', 'dark-shiva', 'dark-anima']);
    // The last foe's fall has no seam: it is the end, and the post scene plays.
    expect(seams.some((t) => (t.when as { who: string }).who === 'dark-bahamut')).toBe(false);
  });

  it('every seam fits the chain-seam budget with the player\'s hands off (every line carries its own `auto`); every callout fits the 8 s interrupt budget', () => {
    for (const id of Object.values(DARK_SEAMS)) {
      const script = scripts.midScripts[id]!;
      expect(blockingSteps(script), `${id} has no blocking step`).toEqual([]);
      expect(scriptDurationMs(script), id).toBeLessThanOrEqual(SEAM_BUDGET_MS);
      expect(scriptDurationMs(script), `${id} is about ten seconds`).toBeGreaterThan(7_000);
    }
    for (const id of Object.values(DARK_CALLOUTS)) {
      const script = scripts.midScripts[id]!;
      expect(blockingSteps(script), `${id} has no blocking step`).toEqual([]);
      expect(scriptDurationMs(script), id).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
    }
  });

  it('every seam hides the fallen foe and ends on a white flash into the next plate\'s name (the stage swaps the plate on the next link)', () => {
    for (const id of Object.values(DARK_SEAMS)) {
      const script = scripts.midScripts[id]!;
      expect(script.some((s) => s.type === 'hideActor'), id).toBe(true);
      expect(script.some((s) => s.type === 'fade' && s.to === 'white'), id).toBe(true);
      expect(script.some((s) => s.type === 'flash'), id).toBe(true);
      expect(lines(script).at(-1)!.type, 'the last line is the narrated place').toBe('narrate');
    }
  });
});

describe('the voices keep to the writing bible', () => {
  const all = [...lines(scripts.pre), ...lines(scripts.post), ...Object.values(scripts.midScripts).flatMap(lines)];

  it('the Dark Aeons and the acolytes speak no word, and nobody is named who is not in the room', () => {
    for (const l of all) {
      if (l.type !== 'say') continue;
      expect(['tidus', 'yuna', 'auron', 'wakka', 'lulu'], l.text).toContain(l.who);
    }
    expect(all.map((l) => l.text).join(' ')).not.toMatch(/Penance|Seymour|Jecht|Yu Yevon/);
  });

  it('no line quotes the retail script: every line is under sixteen words', () => {
    for (const l of all) expect(l.text.split(/\s+/).length, l.text).toBeLessThanOrEqual(16);
  });

  it('Auron is laconic: every line of his is at most nine words; Wakka says "ya" somewhere', () => {
    const auron = all.filter((l) => l.type === 'say' && l.who === 'auron');
    expect(auron.length).toBeGreaterThan(5);
    for (const l of auron) expect(l.text.split(/\s+/).length, l.text).toBeLessThanOrEqual(10);
    expect(all.some((l) => l.type === 'say' && l.who === 'wakka' && /\bya\b/.test(l.text))).toBe(true);
  });

  it('the file says it is a draft for Bailey to read (DA13), first, where a reader who opens it sees it', () => {
    expect(header).toMatch(/THIS IS A DRAFT FOR BAILEY TO READ/);
    expect(src.indexOf('THIS IS A DRAFT')).toBeLessThan(src.indexOf('import '));
  });

  it('every writing-bible section the header cites is the voice it names', () => {
    const bible = readFileSync(new URL('../../../research/writing-bible.md', import.meta.url), 'utf8');
    const flat = header.replace(/\r?\n \* /g, ' ');
    const cited: Array<[string, RegExp]> = [
      ['Tidus', /Tidus asking what he does not know \((\d\.\d+)\)/],
      ['Yuna', /Yuna complete and unhurried \((\d\.\d+)\)/],
      ['Auron', /Auron laconic and dry \((\d\.\d+)\)/],
      ['Wakka', /Wakka warm and plain with his "ya" \((\d\.\d+)\)/],
      ['Lulu', /Lulu dry \((\d\.\d+)\)/],
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
