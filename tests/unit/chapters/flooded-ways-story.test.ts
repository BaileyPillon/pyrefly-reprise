/**
 * The hidden Flooded Ways chapter's story layer (`src/story/scripts/flooded-ways.ts`; FFX only; a DRAFT for Bailey to read, pick GV1): the scenes lint clean, the sizes are what the draft promises, every seam and callout is
 * wired to a script that exists and fits its budget, and the voices keep to the writing bible. The chapter is deliberately NOT in `src/story/registry.ts` (its tests pin that the registry's keys are the listed chapters), so the
 * audits that file runs for the registered chapters are repeated here for this one.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getChapter } from '../../../src/data/encounters.ts';
import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';
import { EVRAE_ALTANA_ID, GATE_LOCK_IDS, GEOSGAENO_ID } from '../../../src/data/ffx/flooded-ways-ids.ts';
import { blockingSteps, MID_SCRIPT_BUDGET_MS, SEAM_BUDGET_MS, scriptDurationMs } from '../../../src/story/registry.ts';
import { lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { FLOODED_CALLOUTS, FLOODED_SEAMS, floodedWaysScripts } from '../../../src/story/scripts/flooded-ways.ts';

const src = readFileSync(new URL('../../../src/story/scripts/flooded-ways.ts', import.meta.url), 'utf8');
const header = src.slice(0, src.indexOf('*/'));
const chapter = getChapter('flooded-ways')!;
const scripts = chapter.scriptsRef;
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and a scene that ends on the results', () => {
    expect(scripts).toBe(floodedWaysScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post.some((s) => s.type === 'results')).toBe(true);
    expect(scripts.victoryQuips).toEqual({});
  });

  it('lints clean: no line over the box, no stray ellipsis, no markup, in every scene, seam and callout', () => {
    for (const [name, script] of [['pre', scripts.pre], ['post', scripts.post], ...Object.entries(scripts.midScripts)] as Array<[string, StoryScript]>) expect(lintScript(script), name).toEqual([]);
  });

  it('plays the sizes the draft promises: eight lines before, six after, three to the seam, one to a callout', () => {
    expect(lines(scripts.pre)).toHaveLength(8);
    expect(lines(scripts.post)).toHaveLength(6);
    expect(lines(scripts.midScripts[FLOODED_SEAMS.evrae]!)).toHaveLength(3);
    for (const id of Object.values(FLOODED_CALLOUTS)) expect(lines(scripts.midScripts[id]!), id).toHaveLength(1);
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
    expect(triggers).toHaveLength(4);
  });

  it("the seam fires on the KO of Evrae Altana, whichever area it falls in; the callouts on the first Stone Gaze, on a lock opened (the first lock's KO; its line holds whichever lock goes first) and on the Swallow, with abilities that exist", () => {
    const seam = triggers.find((t) => t.script === FLOODED_SEAMS.evrae)!;
    expect(seam.when).toEqual({ type: 'ko', who: EVRAE_ALTANA_ID });
    expect(triggers.find((t) => t.script === FLOODED_CALLOUTS.lock)!.when).toEqual({ type: 'ko', who: GATE_LOCK_IDS[0] });
    const gaze = triggers.find((t) => t.script === FLOODED_CALLOUTS.gaze)!.when;
    const swallow = triggers.find((t) => t.script === FLOODED_CALLOUTS.swallow)!.when;
    expect(gaze).toMatchObject({ type: 'ability-used', who: EVRAE_ALTANA_ID });
    expect(swallow).toMatchObject({ type: 'ability-used', who: GEOSGAENO_ID });
    for (const w of [gaze, swallow]) expect(ALL_ABILITIES.some((a) => a.id === (w as { ability: string }).ability), JSON.stringify(w)).toBe(true);
    // Geosgaeno's fall is the end: no seam, the post scene plays.
    expect(triggers.some((t) => t.when.type === 'ko' && (t.when as { who: string }).who === GEOSGAENO_ID)).toBe(false);
  });

  it("the seam fits the chain-seam budget with the player's hands off (every line carries its own `auto`); every callout fits the 8 s interrupt budget", () => {
    const seam = scripts.midScripts[FLOODED_SEAMS.evrae]!;
    expect(blockingSteps(seam), 'the seam has no blocking step').toEqual([]);
    expect(scriptDurationMs(seam)).toBeLessThanOrEqual(SEAM_BUDGET_MS);
    expect(scriptDurationMs(seam), 'about ten seconds').toBeGreaterThan(7_000);
    for (const id of Object.values(FLOODED_CALLOUTS)) {
      const script = scripts.midScripts[id]!;
      expect(blockingSteps(script), `${id} has no blocking step`).toEqual([]);
      expect(scriptDurationMs(script), id).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
    }
  });

  it("the seam hides the fallen foe and ends on a white flash into the next place's name", () => {
    const script = scripts.midScripts[FLOODED_SEAMS.evrae]!;
    expect(script.some((s) => s.type === 'hideActor')).toBe(true);
    expect(script.some((s) => s.type === 'fade' && s.to === 'white')).toBe(true);
    expect(script.some((s) => s.type === 'flash')).toBe(true);
    expect(lines(script).at(-1)!.type, 'the last line is the narrated place').toBe('narrate');
  });
});

describe('the voices keep to the writing bible', () => {
  const all = [...lines(scripts.pre), ...lines(scripts.post), ...Object.values(scripts.midScripts).flatMap(lines)];

  it('only the three who swim speak, and the two monsters speak no word', () => {
    for (const l of all) {
      if (l.type !== 'say') continue;
      expect(['tidus', 'wakka', 'rikku'], l.text).toContain(l.who);
    }
    expect(all.map((l) => l.text).join(' ')).not.toMatch(/Seymour|Jecht|Yu Yevon|Yunalesca/);
  });

  it('no line quotes the retail script: every line is under seventeen words', () => {
    for (const l of all) expect(l.text.split(/\s+/).length, l.text).toBeLessThanOrEqual(16);
  });

  it('Wakka says "ya" somewhere and calls Tidus brudda; Rikku restarts and stacks her words ("okay okay okay"); Tidus asks', () => {
    expect(all.some((l) => l.type === 'say' && l.who === 'wakka' && /\bya\b/.test(l.text))).toBe(true);
    expect(all.some((l) => l.type === 'say' && l.who === 'wakka' && /\bbrudda\b/.test(l.text))).toBe(true);
    expect(all.some((l) => l.type === 'say' && l.who === 'rikku' && /okay okay okay/i.test(l.text))).toBe(true);
    expect(all.some((l) => l.type === 'say' && l.who === 'tidus' && /\?/.test(l.text))).toBe(true);
  });

  it('the file says it is a draft for Bailey to read (GV1), first, where a reader who opens it sees it', () => {
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
