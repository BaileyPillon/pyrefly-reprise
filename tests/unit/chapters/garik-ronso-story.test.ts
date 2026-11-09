/**
 * Garik Ronso and the Ronso Youths (the hidden FFX-2 chapter): the story layer (a DRAFT for Bailey's read), on paper. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The chapter is registered as a hidden experiment (`EXPERIMENT_CHAPTERS`), not in `src/story/registry.ts`'s `STORY_CHAPTERS` (the listed chapters' audit surface), so `tests/unit/story-scripts.test.ts` and its siblings do not
 * see it. This file holds what they hold for a listed chapter (the Yuna's Ballad and Fallen Maesters story tests are the model):
 *
 * 1. **House style**: `lintScript` on every script; the cast (only Yuna, Rikku and Paine in their FFX-2 voices and the unnamed narration speak, no FFX speaker); the girls' lines inside the 60-character box line; a mid-battle
 *    callout is ten words a line at most; Paine's one sincere exchange is three lines at most in a row.
 * 2. **Triggers**: every trigger id is its script and unique; every script has a trigger; the three callouts are Garik's first Mighty Guard, his first Bane Lance (the hostile fight) and the bout's first Protect, each on a body of its
 *    own scene, so each fires in its fight only.
 * 3. **Budgets**: every callout fits `MID_SCRIPT_BUDGET_MS`, every mid `say` carries an `auto`, nothing in a mid script can wedge it.
 * 4. **The draft says what the sources do**: Garik has no portrait or speaker id, so he speaks only as narration; the pre scene names the blockade and the lance; no line quotes the game.
 */
import { describe, expect, it } from 'vitest';

import { FFX2_GARIK_RONSO } from '../../../src/data/chapter-ffx2-garik-ronso.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { GARIK_BANE_LANCE_ID, GARIK_MIGHTY_GUARD_ID, GARIK_PROTECT_ID } from '../../../src/data/ffx2/enemies/garik-ronso-abilities.ts';
import { GARIK_RONSO_ID, X2_GARIK_BOUT_ID, X2_GARIK_ID } from '../../../src/data/garik-ronso-ids.ts';
import { MAX_LINE_CHARS, MAX_SAY_CHARS, lintScript, type SpeakerId, type Step, type StoryScript } from '../../../src/story/dsl.ts';
import { MID_LINE_HOLD_MS, MID_SCRIPT_BUDGET_MS, PRESENTER_BUDGET_MS, blockingSteps, midBattleDeadlineMs, scriptDurationMs } from '../../../src/story/registry.ts';
import { ffx2GarikRonsoScripts as S } from '../../../src/story/scripts/ffx2-garik-ronso.ts';

const CALLOUTS = ['first-mighty-guard', 'first-bane-lance', 'first-bout-protect'] as const;

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
const narrationOf = (script: StoryScript): Array<Extract<Step, { type: 'narrate' }>> => flatten(script).filter((s): s is Extract<Step, { type: 'narrate' }> => s.type === 'narrate');
const wordsOf = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

describe('house style on paper', () => {
  it('is the chapter record\'s own, and has enough lines to lint', () => {
    expect(FFX2_GARIK_RONSO.scriptsRef).toBe(S);
    expect(getChapter(GARIK_RONSO_ID)?.scriptsRef).toBe(S);
    expect(allScripts().flatMap(([, s]) => [...saysOf(s), ...narrationOf(s)]).length).toBeGreaterThan(14);
  });

  it('passes lintScript() on every script it owns, and no line is over the say cap', () => {
    for (const [name, script] of allScripts()) {
      expect(lintScript(flatten(script)), `${name} lint`).toEqual([]);
      for (const s of saysOf(script)) expect(s.text.length, `${name}: ${s.text}`).toBeLessThanOrEqual(MAX_SAY_CHARS);
      for (const n of narrationOf(script)) expect(n.text.length, `${name}: ${n.text}`).toBeLessThanOrEqual(MAX_SAY_CHARS * 2);
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

  it('is FFX-2 only: only the three girls in their FFX-2 voices and the narration speak; no FFX speaker (Kimahri, the FFX Ronso, is not here)', () => {
    for (const [name, script] of allScripts()) {
      for (const s of saysOf(script)) expect(CAST, `${name}: ${s.who} says "${s.text}"`).toContain(s.who);
    }
    const text = JSON.stringify([S.pre, S.post, S.midScripts]);
    for (const ffxWord of ['tidus', 'auron', 'wakka', 'lulu', 'kimahri', 'biran', 'yenke', 'kelk', 'seymour', 'yunalesca', 'jecht', 'sin']) {
      expect(new RegExp(`"who":"${ffxWord}"`).test(text), ffxWord).toBe(false);
    }
  });

  it('rations the sincerity: Paine\'s lines never run more than three in a row, with a joke around them and the joke restored at the end', () => {
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
    expect(saysOf(S.post).some((s) => s.who === 'paine')).toBe(true);
    expect(saysOf(S.post).some((s) => s.who === 'rikku-x2'), 'the joke returns').toBe(true);
    expect(saysOf(S.post).at(-1)?.who, 'Paine kills the joke').toBe('paine');
  });

  it('keeps a mid-battle callout to ten words a line (writing bible, mid-battle callouts)', () => {
    for (const id of CALLOUTS) {
      for (const s of saysOf(S.midScripts[id]!)) expect(wordsOf(s.text), `${id}: ${s.text}`).toBeLessThanOrEqual(10);
    }
  });
});

describe('what the draft says, against the sources (research/re-ffx2-garik-ronso.md section 4)', () => {
  it('Garik has no speaker id and no portrait: he is narration only; the pre scene sets the summit, the blockade and the lance, and the Youths of his clan', () => {
    const pre = narrationOf(S.pre).map((n) => n.text).concat(saysOf(S.pre).filter((s) => s.who === 'none').map((s) => s.text)).join(' ');
    expect(pre).toMatch(/Gagazet/);
    expect(pre).toMatch(/lance/i);
    expect(pre).toMatch(/Youths/);
    expect(saysOf(S.pre).map((s) => s.text).join(' ')).toMatch(/teleporters/);
    expect(JSON.stringify(S)).not.toMatch(/"who":"garik"/);
  });

  it('the two tones of the two fights are the callouts\': the hostile fight\'s guard and curse, the bout\'s Protect; the post scene reads true after either', () => {
    const guard = saysOf(S.midScripts['first-mighty-guard']!).map((s) => s.text).join(' ');
    expect(guard).toMatch(/all of them/i);
    const lance = saysOf(S.midScripts['first-bane-lance']!).map((s) => s.text).join(' ');
    expect(lance).toMatch(/curse/i);
    expect(lance).toMatch(/Black Mage/);
    const bout = saysOf(S.midScripts['first-bout-protect']!).map((s) => s.text).join(' ');
    expect(bout).toMatch(/guarding himself|holding back/i);
    const post = [...saysOf(S.post), ...narrationOf(S.post)].map((s) => s.text).join(' ');
    expect(post).not.toMatch(/Youth|two of them|three of them|bout/i);
  });

  it('copies no line of the game\'s dialogue: no speaker\'s line is quoted', () => {
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
    expect(triggerIds).toEqual([...CALLOUTS]);
  });

  it('the callouts are Garik\'s first Mighty Guard and first Bane Lance (the hostile body) and the bout\'s first Protect (the bout\'s body): each trigger names a body of its own scene', () => {
    const by = Object.fromEntries(S.mid.map((t) => [t.id, t.when]));
    expect(by['first-mighty-guard']).toEqual({ type: 'ability-used', who: X2_GARIK_ID, ability: GARIK_MIGHTY_GUARD_ID });
    expect(by['first-bane-lance']).toEqual({ type: 'ability-used', who: X2_GARIK_ID, ability: GARIK_BANE_LANCE_ID });
    expect(by['first-bout-protect']).toEqual({ type: 'ability-used', who: X2_GARIK_BOUT_ID, ability: GARIK_PROTECT_ID });
  });
});

describe('the budgets', () => {
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
