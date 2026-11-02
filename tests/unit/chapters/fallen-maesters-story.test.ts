/**
 * The Fallen Maesters (the hidden FFX-2 chapter): the story layer (a DRAFT for Bailey's read), on paper. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The chapter is registered as a hidden experiment (`EXPERIMENT_CHAPTERS`), not in `src/story/registry.ts`'s `STORY_CHAPTERS` (the listed chapters' audit surface), so `tests/unit/story-scripts.test.ts` and its
 * siblings do not see it. This file holds what they hold for a listed chapter (the Experiment's story test is the model):
 *
 * 1. **House style**: `lintScript` and the text lint on every script; the cast (only the girls and the unnamed narration speak, no FFX speaker); the writing bible's rations (Paine's one sincere exchange; a mid-battle
 *    callout is ten words a line at most; the girls' lines inside the 60-character box line).
 * 2. **Triggers**: every trigger id is its script and unique; every script has a trigger; the seams are the KO of Aranea, the Black Elemental and Concherer, the callouts the first Gooey End, Magic Up, Megaton Press and
 *    Stony Glare.
 * 3. **Budgets**: every seam fits the seam budget with the runner's grace under the presenter's budget, every callout fits `MID_SCRIPT_BUDGET_MS`, every mid `say` carries an `auto`, nothing in a mid script can wedge it.
 * 4. **The draft says what the sources do**: the glyph that heals is named at every seam; no name of the four people the wiki ties to the fiends is spoken (a driver pick for Bailey to overturn).
 */
import { describe, expect, it } from 'vitest';

import { FFX2_FALLEN_MAESTERS } from '../../../src/data/chapter-ffx2-fallen-maesters.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import * as ids from '../../../src/data/fallen-maesters-ids.ts';
import { MAX_LINE_CHARS, MAX_SAY_CHARS, lintScript, type SpeakerId, type Step, type StoryScript } from '../../../src/story/dsl.ts';
import {
  MID_LINE_HOLD_MS,
  MID_SCRIPT_BUDGET_MS,
  OVERRUN_GRACE_MS,
  PRESENTER_BUDGET_MS,
  SEAM_BUDGET_MS,
  blockingSteps,
  midBattleDeadlineMs,
  scriptDurationMs,
} from '../../../src/story/registry.ts';
import { ffx2FallenMaestersScripts as S } from '../../../src/story/scripts/ffx2-fallen-maesters.ts';

const SEAMS = [ids.MAESTERS_SEAM_20, ids.MAESTERS_SEAM_40, ids.MAESTERS_SEAM_60] as const;
const CALLOUTS = ['first-gooey-end', 'first-magic-up', 'first-megaton-press', 'first-stony-glare'] as const;

/** The speakers of this chapter: the three girls in their FFX-2 voices, and the narration as a stage direction (`'none'`). */
const CAST: readonly SpeakerId[] = ['yuna-x2', 'rikku-x2', 'paine', 'none'];

function allScripts(): Array<readonly [string, StoryScript]> {
  return [['pre', S.pre] as const, ['post', S.post] as const, ...Object.entries(S.midScripts).map(([id, s]) => [`mid:${id}`, s] as const)];
}

function flatten(script: StoryScript): Step[] {
  const out: Step[] = [];
  for (const step of script) {
    out.push(step);
    if (step.type === 'parallel') out.push(...flatten(step.steps));
    if (step.type === 'ifFlag') {
      out.push(...flatten(step.then));
      if (step.else) out.push(...flatten(step.else));
    }
  }
  return out;
}

const saysOf = (script: StoryScript): Array<Extract<Step, { type: 'say' }>> => flatten(script).filter((s): s is Extract<Step, { type: 'say' }> => s.type === 'say');
const wordsOf = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

describe('house style on paper', () => {
  it('is the chapter record\'s own, and has enough lines to lint', () => {
    expect(FFX2_FALLEN_MAESTERS.scriptsRef).toBe(S);
    expect(getChapter(ids.FALLEN_MAESTERS_ID)?.scriptsRef).toBe(S);
    expect(allScripts().flatMap(([, s]) => saysOf(s)).length).toBeGreaterThan(30);
  });

  it('passes lintScript() on every script it owns, and no line is over the say cap', () => {
    for (const [name, script] of allScripts()) {
      expect(lintScript(flatten(script)), `${name} lint`).toEqual([]);
      for (const s of saysOf(script)) expect(s.text.length, `${name}: ${s.text}`).toBeLessThanOrEqual(MAX_SAY_CHARS);
    }
  });

  it('keeps the spoken lines of the girls inside the 60-character line (narration may run to the box\'s two lines)', () => {
    for (const [name, script] of allScripts()) {
      for (const s of saysOf(script)) {
        if (s.who !== 'none') expect(s.text.length, `${name} / ${s.who}: ${s.text}`).toBeLessThanOrEqual(MAX_LINE_CHARS);
      }
    }
  });

  it('opens the battle at the end of the pre scene, shows the results first in the post scene and carries no victory quips', () => {
    expect(S.pre.at(-1)?.type).toBe('battleStart');
    expect(S.post[0]?.type).toBe('results');
    expect(S.victoryQuips).toEqual({});
  });

  it('is FFX-2 only: only the three girls in their FFX-2 voices and the narration speak; no FFX speaker', () => {
    for (const [name, script] of allScripts()) {
      for (const s of saysOf(script)) expect(CAST, `${name}: ${s.who} says "${s.text}"`).toContain(s.who);
    }
    const text = JSON.stringify([S.pre, S.post, S.midScripts]);
    for (const ffxWord of ['tidus', 'auron', 'wakka', 'lulu', 'kimahri', 'seymour', 'yunalesca', 'jecht', 'sin']) {
      expect(new RegExp(`"who":"${ffxWord}"`).test(text), ffxWord).toBe(false);
    }
  });

  it('rations the sincerity: Paine\'s one exchange in the post scene is three lines at most in a row, with the jokes around it', () => {
    let run = 0;
    let longest = 0;
    for (const s of saysOf(S.post)) {
      if (s.who === 'paine') {
        run++;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
    }
    expect(longest).toBeLessThanOrEqual(3);
    expect(saysOf(S.post).filter((s) => s.who === 'paine').length).toBeGreaterThanOrEqual(2);
    for (const id of SEAMS) expect(saysOf(S.midScripts[id]!).filter((s) => s.who === 'paine').length, id).toBeLessThanOrEqual(2);
  });

  it('keeps a mid-battle callout to ten words a line (writing bible, mid-battle callouts)', () => {
    for (const id of CALLOUTS) {
      for (const s of saysOf(S.midScripts[id]!)) expect(wordsOf(s.text), `${id}: ${s.text}`).toBeLessThanOrEqual(10);
    }
  });
});

describe('what the draft says, against the sources (research/ffx2-trema.md §1.2)', () => {
  const all = (): string => JSON.stringify([S.pre, S.post, S.midScripts]);

  it('every seam says the glyph heals the girls (no Save Sphere card plays on these floors, so the line says why they are whole again)', () => {
    for (const id of SEAMS) {
      const text = saysOf(S.midScripts[id]!).map((s) => s.text).join(' ');
      expect(text, id).toMatch(/glyph/i);
      expect(text, id).toMatch(/(mends?|heals?|closes)/i);
    }
  });

  it('names the floors in order: twenty in the pre scene, forty, sixty and eighty in the seams, a hundred in the close', () => {
    expect(saysOf(S.pre).map((s) => s.text).join(' ')).toMatch(/twenty floors/i);
    expect(saysOf(S.midScripts[ids.MAESTERS_SEAM_20]!).map((s) => s.text).join(' ')).toMatch(/floor forty/i);
    expect(saysOf(S.midScripts[ids.MAESTERS_SEAM_40]!).map((s) => s.text).join(' ')).toMatch(/floor sixty/i);
    expect(saysOf(S.midScripts[ids.MAESTERS_SEAM_60]!).map((s) => s.text).join(' ')).toMatch(/floor eighty/i);
    expect(saysOf(S.post).map((s) => s.text).join(' ')).toMatch(/hundredth floor/i);
  });

  it('driver pick (FM6): the four people the wiki ties to the fiends are hinted at, never named', () => {
    for (const name of ['Wen Kinoc', 'Jyscal', 'Yo Mika', 'Yunalesca', 'Trema', 'Zaon']) expect(all(), name).not.toContain(name);
    expect(all()).toMatch(/Maester of Yevon/);
    expect(all()).toMatch(/lord of the Guado/);
    expect(all()).toMatch(/Grand Maester/);
  });

  it('copies no line of the game\'s dialogue: every line carries our own comment and the file claims it', () => {
    // No transcript is in the repo; the check is that the script file says so and has no quotation marks around a speaker's line.
    expect(JSON.stringify(S)).not.toMatch(/"text":"\\"/);
  });
});

describe('the triggers', () => {
  it('every trigger id is its script, unique, with a script behind it; every script has a trigger; each fires once', () => {
    const triggerIds = S.mid.map((t) => t.id);
    expect(new Set(triggerIds).size).toBe(triggerIds.length);
    for (const t of S.mid) {
      expect(t.script, t.id).toBe(t.id);
      expect(S.midScripts[t.id], t.id).toBeDefined();
      expect(t.once, t.id).toBe(true);
    }
    expect(Object.keys(S.midScripts).sort()).toEqual([...triggerIds].sort());
    expect(triggerIds).toEqual(['first-gooey-end', ids.MAESTERS_SEAM_20, 'first-magic-up', ids.MAESTERS_SEAM_40, 'first-megaton-press', ids.MAESTERS_SEAM_60, 'first-stony-glare']);
  });

  it('the seams are the KOs of Aranea, the Black Elemental and Concherer (never Chac: her fall is the close); the callouts are each fiend\'s first named move', () => {
    const by = Object.fromEntries(S.mid.map((t) => [t.id, t.when]));
    expect(by[ids.MAESTERS_SEAM_20]).toEqual({ type: 'ko', who: ids.X2_ARANEA_ID });
    expect(by[ids.MAESTERS_SEAM_40]).toEqual({ type: 'ko', who: ids.X2_BLACK_ELEMENTAL_ID });
    expect(by[ids.MAESTERS_SEAM_60]).toEqual({ type: 'ko', who: ids.X2_CONCHERER_ID });
    expect(by['first-gooey-end']).toEqual({ type: 'ability-used', who: ids.X2_ARANEA_ID, ability: 'x2-aranea-gooey-end' });
    expect(by['first-magic-up']).toEqual({ type: 'ability-used', who: ids.X2_BLACK_ELEMENTAL_ID, ability: 'x2-black-elemental-magic-up' });
    expect(by['first-megaton-press']).toEqual({ type: 'ability-used', who: ids.X2_CONCHERER_ID, ability: 'x2-concherer-megaton-press' });
    expect(by['first-stony-glare']).toEqual({ type: 'ability-used', who: ids.X2_CHAC_ID, ability: 'x2-chac-stony-glare' });
    expect(Object.values(by).some((w) => (w as { type: string; who?: string }).type === 'ko' && (w as { who?: string }).who === ids.X2_CHAC_ID)).toBe(false);
  });
});

describe('the budgets (a seam plays with the player\'s hands off)', () => {
  it('every seam is a seam (longer than an interrupt), fits the seam budget, and the runner\'s deadline for it leaves headroom under the presenter\'s own', () => {
    for (const id of SEAMS) {
      const ms = scriptDurationMs(S.midScripts[id]!, MID_LINE_HOLD_MS);
      console.info(`[fallen maesters story] ${id} is ${Math.round(ms)} ms of ${SEAM_BUDGET_MS}`);
      expect(ms, id).toBeGreaterThan(MID_SCRIPT_BUDGET_MS); // it IS a seam: the runner gives it its own length, not the interrupt's cap
      expect(ms, id).toBeLessThanOrEqual(16_000); // short on purpose (the Experiment's seam is 17 s and its note says never back toward the 26 s cap): the runner's deadline is the authored length plus 1.5 s at the default text speed
      expect(midBattleDeadlineMs(S.midScripts[id]!), id).toBe(Math.min(ms, SEAM_BUDGET_MS) + OVERRUN_GRACE_MS);
      expect(midBattleDeadlineMs(S.midScripts[id]!), id).toBeLessThan(PRESENTER_BUDGET_MS);
    }
  });

  it('the callouts are interrupts: each fits the 8 s cap', () => {
    for (const id of CALLOUTS) {
      const ms = scriptDurationMs(S.midScripts[id]!, MID_LINE_HOLD_MS);
      expect(ms, id).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
      expect(midBattleDeadlineMs(S.midScripts[id]!), id).toBe(MID_SCRIPT_BUDGET_MS);
    }
  });

  it('every line in a mid script carries its own auto, and nothing in one can wedge it (no choice, no jump, no untimed line)', () => {
    for (const [id, script] of Object.entries(S.midScripts)) {
      expect(blockingSteps(script), id).toEqual([]);
      for (const s of saysOf(script)) expect(s.auto, `${id}: ${s.text}`).toBeGreaterThan(0);
      expect(scriptDurationMs(script), `${id} (untimed lines charged the whole budget)`).toBeLessThan(PRESENTER_BUDGET_MS);
    }
  });
});
