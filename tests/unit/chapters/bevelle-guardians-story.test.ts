/**
 * The Bevelle Guardians (the hidden FFX-2 chapter): the story layer (a DRAFT for Bailey's read), on paper. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The chapter is registered as a hidden experiment (`EXPERIMENT_CHAPTERS`), not in `src/story/registry.ts`'s `STORY_CHAPTERS` (the listed chapters' audit surface), so `tests/unit/story-scripts.test.ts` and its
 * siblings do not see it. This file holds what they hold for a listed chapter (the Fallen Maesters' story test is the model):
 *
 * 1. **House style**: `lintScript` and the text lint on every script; the cast (only the three girls, Baralai and the unnamed narration speak, no FFX speaker); the writing bible's rations (Paine's one sincere exchange; a
 *    mid-battle callout is ten words a line at most; the girls' lines inside the 60-character box line).
 * 2. **Triggers**: every `mid` trigger id is its script and unique; every script has a trigger, but the AI's own callout, which is emitted by name and has no entry in `mid`; the seams are the KO of Georapella and of the
 *    Precepts Guard, the callouts each guardian's first named move.
 * 3. **Budgets**: every seam fits the seam budget with the runner's grace under the presenter's budget, every callout fits `MID_SCRIPT_BUDGET_MS`, every mid `say` carries an `auto`, nothing in a mid script can wedge it.
 * 4. **The draft says what the sources do**: the corridor mends the girls at every seam (no Save Sphere card plays between the acts); the entrance line names the counter (BG4); Baralai is courteous and withdraws.
 */
import { describe, expect, it } from 'vitest';

import { FFX2_BEVELLE_GUARDIANS } from '../../../src/data/chapter-ffx2-bevelle-guardians.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import * as ids from '../../../src/data/bevelle-guardians-ids.ts';
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
import { BEVELLE_GUARDIANS_AI_TRIGGERS, ffx2BevelleGuardiansScripts as S } from '../../../src/story/scripts/ffx2-bevelle-guardians.ts';

const SEAMS = [ids.GUARDIANS_SEAM_1, ids.GUARDIANS_SEAM_2] as const;
const CALLOUTS = ['first-ga', 'first-death', ids.BARALAI_COUNT_NINE_TRIGGER] as const;

/** The speakers of this chapter: the three girls in their FFX-2 voices, Baralai, and the narration as a stage direction (`'none'`). */
const CAST: readonly SpeakerId[] = ['yuna-x2', 'rikku-x2', 'paine', 'baralai', 'none'];

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
    expect(FFX2_BEVELLE_GUARDIANS.scriptsRef).toBe(S);
    expect(getChapter(ids.BEVELLE_GUARDIANS_ID)?.scriptsRef).toBe(S);
    expect(allScripts().flatMap(([, s]) => saysOf(s)).length).toBeGreaterThan(25);
  });

  it('passes lintScript() on every script it owns, and no line is over the say cap', () => {
    for (const [name, script] of allScripts()) {
      expect(lintScript(flatten(script)), `${name} lint`).toEqual([]);
      for (const s of saysOf(script)) expect(s.text.length, `${name}: ${s.text}`).toBeLessThanOrEqual(MAX_SAY_CHARS);
    }
  });

  it('keeps the spoken lines of the girls and of Baralai inside the 60-character line (narration may run to the box\'s two lines)', () => {
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

  it('is FFX-2 only: only the three girls in their FFX-2 voices, Baralai and the narration speak; no FFX speaker', () => {
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
    expect(saysOf(S.post).filter((s) => s.who === 'paine').length).toBeGreaterThanOrEqual(1);
    for (const id of SEAMS) expect(saysOf(S.midScripts[id]!).filter((s) => s.who === 'paine').length, id).toBeLessThanOrEqual(2);
  });

  it('keeps a mid-battle callout to ten words a line (writing bible, mid-battle callouts)', () => {
    for (const id of CALLOUTS) {
      for (const s of saysOf(S.midScripts[id]!)) expect(wordsOf(s.text), `${id}: ${s.text}`).toBeLessThanOrEqual(10);
    }
  });
});

describe('what the draft says, against the sources (research/re-ffx2-bevelle-underground.md, research/ffx2-bahamut.md §5)', () => {
  const all = (): string => JSON.stringify([S.pre, S.post, S.midScripts]);

  it('every seam says the corridor mends the girls (no Save Sphere card plays between the acts, so the line says why they are whole again)', () => {
    for (const id of SEAMS) {
      const text = saysOf(S.midScripts[id]!).map((s) => s.text).join(' ');
      expect(text, id).toMatch(/pyreflies/i);
      expect(text, id).toMatch(/(mends?|heals?|closes?)/i);
    }
  });

  it('names the floors in order: three in the pre scene, seven in the second seam', () => {
    expect(saysOf(S.pre).map((s) => s.text).join(' ')).toMatch(/third floor/i);
    expect(saysOf(S.midScripts[ids.GUARDIANS_SEAM_2]!).map((s) => s.text).join(' ')).toMatch(/floor seven/i);
  });

  it('the entrance line names the counter (BG4: the game shows none), and the one callout says the next blow calls the drill', () => {
    expect(saysOf(S.midScripts[ids.GUARDIANS_SEAM_2]!).map((s) => s.text).join(' ')).toMatch(/counts every blow/i);
    expect(saysOf(S.midScripts[ids.BARALAI_COUNT_NINE_TRIGGER]!).map((s) => s.text).join(' ')).toMatch(/nine.*next blow.*drill/i);
  });

  it('Baralai is courteous and says `Lady Yuna` (writing bible section 1.20), he withdraws rather than dies, and the close teases Vegnagun\'s side of the dungeon', () => {
    const baralai = [...saysOf(S.midScripts[ids.GUARDIANS_SEAM_2]!), ...saysOf(S.post)].filter((s) => s.who === 'baralai');
    expect(baralai.length).toBeGreaterThanOrEqual(2);
    for (const s of baralai) expect(s.text, s.text).toMatch(/Lady Yuna/);
    expect(saysOf(S.post).map((s) => s.text).join(' ')).toMatch(/steps back into the dark/i);
    expect(saysOf(S.post).map((s) => s.text).join(' ')).toMatch(/Far below/i);
  });

  it('copies no line of the game\'s dialogue: every line carries our own comment and the file claims it', () => {
    expect(JSON.stringify(S)).not.toMatch(/"text":"\\"/);
    expect(all()).not.toMatch(/Geosgaeno/);
  });
});

describe('the triggers', () => {
  it('every `mid` trigger id is its script, unique, with a script behind it; every script has a trigger but the AI\'s own callout; each fires once', () => {
    const triggerIds = S.mid.map((t) => t.id);
    expect(new Set(triggerIds).size).toBe(triggerIds.length);
    for (const t of S.mid) {
      expect(t.script, t.id).toBe(t.id);
      expect(S.midScripts[t.id], t.id).toBeDefined();
      expect(t.once, t.id).toBe(true);
    }
    expect(Object.keys(S.midScripts).sort()).toEqual([...triggerIds, ...BEVELLE_GUARDIANS_AI_TRIGGERS].sort());
    expect(triggerIds).toEqual(['first-ga', ids.GUARDIANS_SEAM_1, 'first-death', ids.GUARDIANS_SEAM_2]);
    expect([...BEVELLE_GUARDIANS_AI_TRIGGERS]).toEqual(['baralai-count-nine']);
  });

  it('the seams are the KOs of Georapella and of the Precepts Guard (never Baralai: his fall is the close); the callouts are each guardian\'s first named move', () => {
    const by = Object.fromEntries(S.mid.map((t) => [t.id, t.when]));
    expect(by[ids.GUARDIANS_SEAM_1]).toEqual({ type: 'ko', who: ids.X2_GEORAPELLA_ID });
    expect(by[ids.GUARDIANS_SEAM_2]).toEqual({ type: 'ko', who: ids.X2_PRECEPTS_GUARD_ID });
    expect(by['first-ga']).toEqual({ type: 'ability-used', who: ids.X2_GEORAPELLA_ID, ability: 'x2-georapella-thundaga' });
    expect(by['first-death']).toEqual({ type: 'ability-used', who: ids.X2_PRECEPTS_GUARD_ID, ability: 'x2-precepts-guard-death' });
    expect(Object.values(by).some((w) => (w as { type: string; who?: string }).type === 'ko' && (w as { who?: string }).who === ids.X2_BARALAI_ID)).toBe(false);
  });
});

describe('the budgets (a seam plays with the player\'s hands off)', () => {
  it('every seam is a seam (longer than an interrupt), fits the seam budget, and the runner\'s deadline for it leaves headroom under the presenter\'s own', () => {
    for (const id of SEAMS) {
      const ms = scriptDurationMs(S.midScripts[id]!, MID_LINE_HOLD_MS);
      console.info(`[bevelle guardians story] ${id} is ${Math.round(ms)} ms of ${SEAM_BUDGET_MS}`);
      expect(ms, id).toBeGreaterThan(MID_SCRIPT_BUDGET_MS); // it IS a seam: the runner gives it its own length, not the interrupt's cap
      expect(ms, id).toBeLessThanOrEqual(16_000); // short on purpose (the Experiment's seam is 17 s and its note says never back toward the 26 s cap)
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
