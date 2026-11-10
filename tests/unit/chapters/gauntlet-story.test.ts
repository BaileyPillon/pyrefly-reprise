/**
 * The hidden Gauntlet chapter's story layer (`src/story/scripts/gauntlet.ts`; FFX only; a DRAFT for Bailey to read): the scenes lint clean, the sizes are what the draft promises, every seam is wired to a script that exists and
 * fits its budget, and the voices keep to the writing bible. The chapter is deliberately NOT in `src/story/registry.ts` (its tests pin that the registry's keys are the listed chapters), so the audits that file runs for the
 * registered chapters are repeated here for this one (the pattern of `dark-aeons-story.test.ts`).
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getChapter } from '../../../src/data/encounters.ts';
import { GAUNTLET_CREATURES } from '../../../src/data/ffx/gauntlet-ids.ts';
import { blockingSteps, MID_SCRIPT_BUDGET_MS, SEAM_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { GAUNTLET_SEAMS, gauntletScripts } from '../../../src/story/scripts/gauntlet.ts';

const src = readFileSync(new URL('../../../src/story/scripts/gauntlet.ts', import.meta.url), 'utf8');
const header = src.slice(0, src.indexOf('*/'));
const chapter = getChapter('gauntlet')!;
const scripts = chapter.scriptsRef;
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and a scene that ends on the results', () => {
    expect(scripts).toBe(gauntletScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post.some((s) => s.type === 'results')).toBe(true);
    expect(scripts.victoryQuips).toEqual({}); // eight goodbyes in a row: no light quips (writing bible 5.4)
  });

  it('lints clean: no line over the box, no stray ellipsis, no markup, in every scene and seam', () => {
    for (const [name, script] of [['pre', scripts.pre], ['post', scripts.post], ...Object.entries(scripts.midScripts)] as Array<[string, StoryScript]>) expect(lintScript(script), name).toEqual([]);
  });

  it('plays the sizes the draft promises: nine lines before, six after, three to a seam', () => {
    expect(lines(scripts.pre)).toHaveLength(9);
    expect(lines(scripts.post)).toHaveLength(6);
    for (const id of Object.values(GAUNTLET_SEAMS)) expect(lines(scripts.midScripts[id]!), id).toHaveLength(3);
    expect(Object.keys(scripts.midScripts)).toHaveLength(8);
  });
});

describe("the triggers and the scripts agree (the registry's audits, repeated for a chapter it does not list)", () => {
  const triggers = scripts.mid;

  it('every trigger is once-only and names a script that exists; every script has exactly one trigger; the ids are unique', () => {
    expect(new Set(triggers.map((t) => t.id)).size).toBe(triggers.length);
    for (const t of triggers) {
      expect(t.once, t.id).toBe(true);
      expect(scripts.midScripts[t.script], t.id).toBeDefined();
    }
    expect(triggers.map((t) => t.script).sort()).toEqual(Object.keys(scripts.midScripts).sort());
    expect(triggers).toHaveLength(8);
  });

  it("a seam fires on the KO of the creation that fell (eight, one per act but the last), in the order of the chain", () => {
    const seams = triggers.filter((t) => t.when.type === 'ko');
    expect(seams.map((t) => t.script)).toEqual(Object.values(GAUNTLET_SEAMS));
    expect(seams.map((t) => (t.when as { who: string }).who)).toEqual(GAUNTLET_CREATURES.slice(0, 8));
    // The last creation's fall has no seam: it is the end, and the post scene plays. No callouts: the guide card and the advisor say what each creation answers.
    expect(seams.some((t) => (t.when as { who: string }).who === 'ultima-buster')).toBe(false);
    expect(triggers.filter((t) => t.when.type !== 'ko')).toEqual([]);
  });

  it('every seam fits the chain-seam budget with the player\'s hands off (every line carries its own `auto`)', () => {
    for (const id of Object.values(GAUNTLET_SEAMS)) {
      const script = scripts.midScripts[id]!;
      expect(blockingSteps(script), `${id} has no blocking step`).toEqual([]);
      expect(scriptDurationMs(script), id).toBeLessThanOrEqual(SEAM_BUDGET_MS);
      expect(scriptDurationMs(script), `${id} is about ten seconds`).toBeGreaterThan(7_000);
      expect(scriptDurationMs(script), `${id} also fits the interrupt budget's order of magnitude`).toBeGreaterThan(MID_SCRIPT_BUDGET_MS / 2);
    }
  });

  it("every seam hides the fallen creation and ends on a white flash into the next stall's name", () => {
    for (const id of Object.values(GAUNTLET_SEAMS)) {
      const script = scripts.midScripts[id]!;
      expect(script.some((s) => s.type === 'hideActor'), id).toBe(true);
      expect(script.some((s) => s.type === 'fade' && s.to === 'white'), id).toBe(true);
      expect(script.some((s) => s.type === 'flash'), id).toBe(true);
      expect(lines(script).at(-1)!.type, 'the last line is the narrated stall').toBe('narrate');
    }
  });

  it('the seams hide the creature the trigger names', () => {
    for (const t of triggers) {
      const hidden = scripts.midScripts[t.script]!.find((s): s is Extract<Step, { type: 'hideActor' }> => s.type === 'hideActor');
      expect(hidden, t.id).toBeDefined();
      expect(hidden!.actor, t.id).toBe((t.when as { who: string }).who);
    }
  });
});

describe('the voices keep to the writing bible', () => {
  const all = [...lines(scripts.pre), ...lines(scripts.post), ...Object.values(scripts.midScripts).flatMap(lines)];

  it('the creations speak no word, and nobody is named who is not in the room', () => {
    for (const l of all) {
      if (l.type !== 'say') continue;
      expect(['tidus', 'yuna', 'auron', 'wakka', 'lulu'], l.text).toContain(l.who);
    }
    expect(all.map((l) => l.text).join(' ')).not.toMatch(/Penance|Seymour|Jecht|Yu Yevon|Belgemine/);
  });

  it('no line quotes the retail script: every line is under sixteen words', () => {
    for (const l of all) expect(l.text.split(/\s+/).length, l.text).toBeLessThanOrEqual(16);
  });

  it('Auron is laconic: every line of his is at most ten words, and there are at least six; Wakka says "ya" somewhere', () => {
    const auron = all.filter((l) => l.type === 'say' && l.who === 'auron');
    expect(auron.length).toBeGreaterThanOrEqual(6);
    for (const l of auron) expect(l.text.split(/\s+/).length, l.text).toBeLessThanOrEqual(10);
    expect(all.some((l) => l.type === 'say' && l.who === 'wakka' && /\bya\b/.test(l.text))).toBe(true);
  });

  it("says no number of the game's: no figure in any line (the guide card and the page carry those)", () => {
    for (const l of all) expect(l.text, l.text).not.toMatch(/\d/);
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
