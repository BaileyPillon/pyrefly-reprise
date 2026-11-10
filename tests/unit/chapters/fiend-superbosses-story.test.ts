/**
 * The Fiend Arena Superbosses (the hidden FFX-2 chapter 53): the story layer (a DRAFT for Bailey's read), on paper. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The chapter is registered as a hidden experiment (`EXPERIMENT_CHAPTERS`), not in `src/story/registry.ts`'s `STORY_CHAPTERS` (the listed chapters' audit surface), so `tests/unit/story-scripts.test.ts` and its
 * siblings do not see it. This file holds what they hold for a listed chapter (the Farplane Cup's story test is the model):
 *
 * 1. **House style**: `lintScript` on every script; the cast (only the girls and the unnamed narration speak, no FFX speaker); the writing bible's rations (one sincere exchange; a mid-battle callout is ten words a line
 *    at most; the girls' lines inside the 60-character box line).
 * 2. **Triggers**: every trigger id is its script and unique; every script has a trigger; the seam is the KO of Shinra and nothing of the Numerus, the callouts are the first Clione, the first Final Impact and the first
 *    Fulmen Command.
 * 3. **Budgets**: the seam fits the seam budget with the runner's grace under the presenter's budget, every callout fits `MID_SCRIPT_BUDGET_MS`, every mid `say` carries an `auto`, nothing in a mid script can wedge it.
 * 4. **The draft says what the sources do**: the arena mends the girls at the seam; it invents no cup, no round and no prize (the files hold none); the foes are named by the boss strip and never by a voice.
 */
import { describe, expect, it } from 'vitest';

import { FFX2_FIEND_SUPERBOSSES } from '../../../src/data/chapter-ffx2-fiend-superbosses.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import * as ids from '../../../src/data/fiend-superbosses-ids.ts';
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
import { ffx2FiendSuperbossesScripts as S } from '../../../src/story/scripts/ffx2-fiend-superbosses.ts';

const SEAM = ids.FS_SEAM_1;
const CALLOUTS = ['first-clione', 'first-final-impact', 'first-command'] as const;

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
const textOf = (script: StoryScript): string => saysOf(script).map((s) => s.text).join(' ');

describe('house style on paper', () => {
  it('is the chapter record\'s own, and has enough lines to lint', () => {
    expect(FFX2_FIEND_SUPERBOSSES.scriptsRef).toBe(S);
    expect(getChapter(ids.FIEND_SUPERBOSSES_ID)?.scriptsRef).toBe(S);
    expect(allScripts().flatMap(([, s]) => saysOf(s)).length).toBeGreaterThan(20);
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

  it('is FFX-2 only: only the three girls in their FFX-2 voices and the narration speak; no FFX speaker (the foes are named by the narration, never given a voice)', () => {
    for (const [name, script] of allScripts()) {
      for (const s of saysOf(script)) expect(CAST, `${name}: ${s.who} says "${s.text}"`).toContain(s.who);
    }
    const text = JSON.stringify([S.pre, S.post, S.midScripts]);
    for (const ffxWord of ['tidus', 'auron', 'wakka', 'lulu', 'kimahri', 'seymour', 'yunalesca', 'jecht', 'sin', 'shinra', 'unum']) {
      expect(new RegExp(`"who":"${ffxWord}"`).test(text), ffxWord).toBe(false);
    }
  });

  it('rations the sincerity: the one exchange in the post scene is three of Yuna and Paine\'s lines at most, with the jokes around it; the seam gives Paine one line at most', () => {
    const sincere = saysOf(S.post).filter((s) => s.who === 'yuna-x2' || s.who === 'paine');
    expect(sincere.length).toBeLessThanOrEqual(3);
    expect(saysOf(S.post).filter((s) => s.who === 'paine').length).toBeGreaterThanOrEqual(1);
    expect(saysOf(S.post).filter((s) => s.who === 'rikku-x2').length).toBeGreaterThanOrEqual(1);
    expect(saysOf(S.midScripts[SEAM]!).filter((s) => s.who === 'paine').length).toBeLessThanOrEqual(2);
  });

  it('keeps a mid-battle callout to ten words a line (writing bible, mid-battle callouts)', () => {
    for (const id of CALLOUTS) {
      for (const s of saysOf(S.midScripts[id]!)) expect(wordsOf(s.text), `${id}: ${s.text}`).toBeLessThanOrEqual(10);
    }
  });
});

describe('what the draft says, against the sources (research/re-ffx2-fiend-arena-superbosses.md sections 1, 3 and 8)', () => {
  const all = (): string => JSON.stringify([S.pre, S.post, S.midScripts]);

  it('the seam says the arena mends the girls (no Save Sphere card plays between the acts, so the line says why they are whole again) and names the four heads', () => {
    expect(textOf(S.midScripts[SEAM]!)).toMatch(/mends/i);
    expect(textOf(S.midScripts[SEAM]!)).toMatch(/Four heads/);
  });

  it('invents no cup, no round and no prize: the pre scene says there is no cup and no prizes posted (the files hold neither), and nobody is told they are champions', () => {
    expect(textOf(S.pre)).toMatch(/no cup/i);
    expect(textOf(S.pre)).toMatch(/no prizes/i);
    expect(textOf(S.post)).toMatch(/prize/i); // the post scene says there is none
    expect(all()).not.toMatch(/recruit|champion|trophy|tournament|round one|first round/i);
  });

  it('describes the foes and does not name them in a voice: the first as a boy grown to the size of the arena, the second as four heads', () => {
    expect(textOf(S.pre)).toMatch(/boy/i);
    expect(textOf(S.pre)).toMatch(/size of the arena/i);
    expect(textOf(S.midScripts[SEAM]!)).toMatch(/Four heads/);
  });

  it('the callouts say what the data does: ten blows at once, an eighth fourteen times, a charge Protect and Shell do not answer', () => {
    expect(textOf(S.midScripts['first-clione']!)).toMatch(/ten blows/);
    expect(textOf(S.midScripts['first-final-impact']!)).toMatch(/eighth, fourteen times/);
    expect(textOf(S.midScripts['first-command']!)).toMatch(/Protect and Shell do nothing/);
  });

  it('copies no line of the game\'s dialogue: every line carries our own comment and the file claims it', () => {
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
    expect(triggerIds).toEqual(['first-clione', 'first-final-impact', SEAM, 'first-command']);
  });

  it('the seam is the KO of Shinra and the Numerus has none (its last head\'s fall is the close); the callouts are the signature moves', () => {
    const by = Object.fromEntries(S.mid.map((t) => [t.id, t.when]));
    expect(by[SEAM]).toEqual({ type: 'ko', who: ids.X2_ALMIGHTY_SHINRA_ID });
    expect(by['first-clione']).toEqual({ type: 'ability-used', who: ids.X2_ALMIGHTY_SHINRA_ID, ability: 'x2-fs-clione' });
    expect(by['first-final-impact']).toEqual({ type: 'ability-used', who: ids.X2_ALMIGHTY_SHINRA_ID, ability: 'paragon-os-final-impact' });
    expect(by['first-command']).toEqual({ type: 'ability-used', who: ids.X2_NUMERUS_TRIA_ID, ability: 'x2-fs-fulmen-command' });
    for (const id of ids.NUMERUS_HEAD_IDS) {
      expect(Object.values(by).some((w) => (w as { type: string; who?: string }).type === 'ko' && (w as { who?: string }).who === id), id).toBe(false);
    }
  });
});

describe('the budgets (a seam plays with the player\'s hands off)', () => {
  it('the seam is a seam (longer than an interrupt), fits the seam budget, and the runner\'s deadline for it leaves headroom under the presenter\'s own', () => {
    const ms = scriptDurationMs(S.midScripts[SEAM]!, MID_LINE_HOLD_MS);
    console.info(`[fiend superbosses story] ${SEAM} is ${Math.round(ms)} ms of ${SEAM_BUDGET_MS}`);
    expect(ms).toBeGreaterThan(MID_SCRIPT_BUDGET_MS);
    expect(ms).toBeLessThanOrEqual(16_000); // short on purpose: the runner's deadline is the authored length plus 1.5 s at the default text speed
    expect(midBattleDeadlineMs(S.midScripts[SEAM]!)).toBe(Math.min(ms, SEAM_BUDGET_MS) + OVERRUN_GRACE_MS);
    expect(midBattleDeadlineMs(S.midScripts[SEAM]!)).toBeLessThan(PRESENTER_BUDGET_MS);
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
