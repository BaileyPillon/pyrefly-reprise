/**
 * The hidden Sinspawn Gui chapter's story layer (`src/story/scripts/sinspawn-gui.ts`; FFX only): the scenes lint clean, the seam fits its budget, every mid-battle beat is wired to a trigger that
 * can fire, and the voices keep to the writing bible.
 *
 * The chapter is deliberately NOT in `src/story/registry.ts` (`tests/unit/story-triggers.test.ts` pins that the registry's keys are the listed chapters, as the Experiment's story is not either),
 * so the audits that file runs for the registered chapters are repeated here for this one: the trigger-to-script agreement, the mid-battle budgets, the blocking steps and the line lint.
 */

import { describe, expect, it } from 'vitest';

import { getChapter } from '../../../src/data/encounters.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { MUSHROOM_ROCK_RUINED_PLATE } from '../../../src/data/ffx/sinspawn-gui-ids.ts';
import { MAX_QUIP_WORDS, lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { MID_SCRIPT_BUDGET_MS, PRESENTER_BUDGET_MS, SEAM_BUDGET_MS, blockingSteps, midBattleDeadlineMs, scriptDurationMs } from '../../../src/story/registry.ts';
import { GUI_HEAD_CALLOUT, GUI_REQUIEM_CALLOUT, GUI_SEAM, sinspawnGuiScripts } from '../../../src/story/scripts/sinspawn-gui.ts';

const chapter = getChapter('sinspawn-gui')!;
const scripts = chapter.scriptsRef;
const fielded = new Set(['sinspawn-gui', 'sinspawn-gui-2', 'sinspawn-gui-head', 'sinspawn-gui-arm-left', 'sinspawn-gui-arm-right', 'seymour']);
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and a scene before the results', () => {
    expect(scripts).toBe(sinspawnGuiScripts);
    expect(scripts.pre[scripts.pre.length - 1]!.type).toBe('battleStart');
    expect(scripts.post[scripts.post.length - 1]!.type).toBe('results');
    expect(scripts.victoryQuips).toEqual({}); // a grim fight: no light quips (writing bible 5.4)
  });

  it('lints clean: no line over the box, no stray ellipsis, no markup, every scene and every beat', () => {
    for (const [name, script] of [['pre', scripts.pre], ['post', scripts.post], ...Object.entries(scripts.midScripts)] as Array<[string, StoryScript]>) {
      expect(lintScript(script), name).toEqual([]);
    }
  });

  it('plays the sizes the concept pick promised: pre about ten lines, the seam three, post about nine', () => {
    expect(lines(scripts.pre).length).toBeGreaterThanOrEqual(8);
    expect(lines(scripts.pre).length).toBeLessThanOrEqual(12);
    expect(lines(scripts.midScripts[GUI_SEAM]!)).toHaveLength(3); // Concept A: three plain lines of Tidus over a white-out
    expect(lines(scripts.post).length).toBeGreaterThanOrEqual(7);
    expect(lines(scripts.post).length).toBeLessThanOrEqual(11);
  });
});

describe("the scenes and the seam use the chapter's own staging", () => {
  it("the post scene is in the ruined camp: its picture step is the second fight's plate (the story keeps its own copy of the key; this pins that it is the data's)", () => {
    const plate = scripts.post.find((st) => st.type === 'backdrop');
    expect(plate && plate.type === 'backdrop' ? plate.key : null).toBe(MUSHROOM_ROCK_RUINED_PLATE);
    expect(scripts.pre.some((st) => st.type === 'backdrop')).toBe(false); // the first scene is the camp the scene opens on
  });

  it('the seam takes the head and the arms off the field with the body (they are alive when the body falls and the battle is won)', () => {
    const seam = scripts.midScripts[GUI_SEAM]!;
    const par = seam.find((st) => st.type === 'parallel');
    const hidden = par && par.type === 'parallel' ? par.steps.flatMap((st) => (st.type === 'hideActor' ? [st.actor] : [])) : [];
    expect(hidden.sort()).toEqual(['sinspawn-gui-arm-left', 'sinspawn-gui-arm-right', 'sinspawn-gui-head']);
  });
});

describe('the mid-battle beats are wired and fit their budgets', () => {
  it('every trigger id equals its script and resolves, and fires on a combatant the chapter really fields', () => {
    expect(scripts.mid.length).toBeGreaterThanOrEqual(2);
    for (const t of scripts.mid) {
      expect(t.id, 'the engine emits the trigger id, so it must be the script ref').toBe(t.script);
      expect(scripts.midScripts[t.script], `no script for ${t.id}`).toBeDefined();
      const who = 'who' in t.when ? t.when.who : undefined;
      if (who !== undefined) expect(fielded.has(who), `${t.id} names ${who}`).toBe(true);
    }
    expect(Object.keys(scripts.midScripts).sort()).toEqual(scripts.mid.map((t) => t.id).sort()); // no beat nothing can ask for
  });

  it("the seam fires on the first body's KO only (the second fight's body has its own id, so it never re-fires), once", () => {
    const seam = scripts.mid.find((t) => t.id === GUI_SEAM)!;
    expect(seam.when).toEqual({ type: 'ko', who: 'sinspawn-gui' });
    expect(seam.once).toBe(true);
    expect(ENEMY_GROUPS_BY_ID['sinspawn-gui-1']!.enemies[0]!.id).toBe('sinspawn-gui');
    expect(ENEMY_GROUPS_BY_ID['sinspawn-gui-2']!.enemies[0]!.id).not.toBe('sinspawn-gui');
  });

  it("the head's callout answers its shake (a charge) and is at most ten words", () => {
    const callout = scripts.mid.find((t) => t.id === GUI_HEAD_CALLOUT)!;
    expect(callout.when).toEqual({ type: 'charge-started', who: 'sinspawn-gui-head' });
    for (const s of lines(scripts.midScripts[GUI_HEAD_CALLOUT]!)) expect(s.text.split(/\s+/).length).toBeLessThanOrEqual(MAX_QUIP_WORDS);
  });

  it("Seymour's gauge filling is answered once, in his own voice, in ten words or fewer (the guest hour only: he is not a combatant of the first fight, so it can never fire there)", () => {
    const callout = scripts.mid.find((t) => t.id === GUI_REQUIEM_CALLOUT)!;
    expect(callout.when).toEqual({ type: 'overdrive', who: 'seymour' });
    expect(callout.once).toBe(true);
    const say = lines(scripts.midScripts[GUI_REQUIEM_CALLOUT]!)[0]!;
    expect(say.type === 'say' && say.who).toBe('seymour-macalania');
    expect(say.text.split(/s+/).length).toBeLessThanOrEqual(MAX_QUIP_WORDS);
    expect(say.text).toMatch(/Lady Yuna/);
  });

  it('the callout has a stand-in for every party member who may be benched in the first fight (only a fielded character speaks mid-battle, PR-0037)', () => {
    const say = lines(scripts.midScripts[GUI_HEAD_CALLOUT]!)[0]!;
    expect(say.type).toBe('say');
    const who = new Set([(say as { who: string }).who, ...((say as { fallback?: Array<{ who: string }> }).fallback ?? []).map((f) => f.who)]);
    for (const m of ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu']) expect(who.has(m), m).toBe(true);
  });

  it('the seam fits the seam budget and the callout the interrupt budget, and the runner is given a deadline under the presenter\'s abandon time', () => {
    const seam = scripts.midScripts[GUI_SEAM]!;
    const callout = scripts.midScripts[GUI_HEAD_CALLOUT]!;
    expect(scriptDurationMs(seam)).toBeLessThanOrEqual(SEAM_BUDGET_MS);
    expect(scriptDurationMs(callout)).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
    expect(midBattleDeadlineMs(seam)).toBeLessThan(PRESENTER_BUDGET_MS);
    expect(midBattleDeadlineMs(callout)).toBe(MID_SCRIPT_BUDGET_MS);
  });

  it('no mid-battle beat waits on a Confirm: every line carries an explicit hold and nothing blocks', () => {
    for (const script of Object.values(scripts.midScripts)) {
      expect(blockingSteps(script)).toEqual([]);
      for (const s of lines(script)) expect(s.auto, s.text).toBeGreaterThan(0);
    }
  });
});

describe('the voices keep to the writing bible', () => {
  const all = [...lines(scripts.pre), ...lines(scripts.post)];

  it('Seymour is the courteous one: "Lady Yuna", long balanced clauses, nothing true only after Macalania', () => {
    const seymour = all.filter((s) => s.type === 'say' && s.who === 'seymour-macalania').map((s) => s.text);
    expect(seymour.length).toBeGreaterThanOrEqual(4);
    expect(seymour.some((t) => /Lady Yuna/.test(t))).toBe(true);
    for (const t of seymour) expect(t, 'he has not been crossed yet').not.toMatch(/Kinoc|Natus|Macalania|Guado|Zanarkand|sending|end all|mercy of death/i);
  });

  it('the scenes carry the parts the chapter is built from: the cage, the head, nobody left alone', () => {
    const text = all.map((s) => s.text).join('\n');
    expect(text).toMatch(/cage/i);
    expect(text).toMatch(/Weapons/);
  });

  it('every speaker is someone the chapter has: the six, Seymour in his human form, and Tidus narrates the seam', () => {
    const speakers = new Set(all.filter((s) => s.type === 'say').map((s) => (s as { who: string }).who));
    for (const who of speakers) expect(['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'seymour-macalania']).toContain(who);
    expect(lines(scripts.midScripts[GUI_SEAM]!).every((s) => s.type === 'narrate')).toBe(true);
  });
});
