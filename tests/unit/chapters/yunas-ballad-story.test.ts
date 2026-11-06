/**
 * Yuna's Ballad (the possessed Rikku, then the possessed Paine; the hidden FFX-2 chapter): the story layer (a DRAFT for Bailey's read), on paper. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The chapter is registered as a hidden experiment (`EXPERIMENT_CHAPTERS`), not in `src/story/registry.ts`'s `STORY_CHAPTERS` (the listed chapters' audit surface), so `tests/unit/story-scripts.test.ts` and its siblings do not
 * see it. This file holds what they hold for a listed chapter (the Fallen Maesters' story test is the model):
 *
 * 1. **House style**: `lintScript` on every script; the cast (only Yuna, Rikku and Paine in their FFX-2 voices and the unnamed narration speak, no FFX speaker); the girls' lines inside the 60-character box line; a mid-battle
 *    callout is ten words a line at most; Paine's one sincere exchange is three lines at most in a row.
 * 2. **Triggers**: every trigger id is its script and unique; every script has a trigger; the seam is the KO of the possessed Rikku (never Paine's: her fall is the close), the callouts are Rikku's first Grenade and Paine's first Attack.
 * 3. **Budgets**: the seam fits the seam budget with the runner's grace under the presenter's budget, every callout fits `MID_SCRIPT_BUDGET_MS`, every mid `say` carries an `auto`, nothing in a mid script can wedge it.
 * 4. **The draft says what the sources do**: the two girls are silent while possessed (the shades' precedent, GP13 a: only Yuna and the narration speak before the close); Rikku and Paine speak only after the fight in the post
 *    scene; the Den's three shades are still to come.
 */
import { describe, expect, it } from 'vitest';

import { FFX2_YUNAS_BALLAD } from '../../../src/data/chapter-ffx2-yunas-ballad.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import * as ids from '../../../src/data/yunas-ballad-ids.ts';
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
import { BALLAD_FIRST_BLADE, BALLAD_FIRST_GRENADE, ffx2YunasBalladScripts as S } from '../../../src/story/scripts/ffx2-yunas-ballad.ts';

const CALLOUTS = [BALLAD_FIRST_GRENADE, BALLAD_FIRST_BLADE] as const;

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
    expect(FFX2_YUNAS_BALLAD.scriptsRef).toBe(S);
    expect(getChapter(ids.YUNAS_BALLAD_ID)?.scriptsRef).toBe(S);
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
    expect(saysOf(S.post).filter((s) => s.who === 'paine').length).toBeGreaterThanOrEqual(1);
    expect(saysOf(S.post).some((s) => s.who === 'rikku-x2'), 'the joke returns').toBe(true);
  });

  it('keeps a mid-battle callout to ten words a line (writing bible, mid-battle callouts)', () => {
    for (const id of CALLOUTS) {
      for (const s of saysOf(S.midScripts[id]!)) expect(wordsOf(s.text), `${id}: ${s.text}`).toBeLessThanOrEqual(10);
    }
  });
});

describe('what the draft says, against the sources (research/ffx2-gippal-den-of-woe.md §2 and §8)', () => {
  it('the two girls are silent while possessed (the shades\' precedent): before the close only Yuna and the narration speak; Rikku and Paine speak only in the post scene', () => {
    for (const [name, script] of allScripts()) {
      if (name === 'post') continue;
      for (const s of saysOf(script)) expect(['yuna-x2', 'none'], `${name}: ${s.who} says "${s.text}"`).toContain(s.who);
    }
    expect(saysOf(S.post).map((s) => s.who)).toEqual(expect.arrayContaining(['paine', 'rikku-x2']));
  });

  it('the pre scene sets the place (the sealed cave) and the premise (they see someone with a gun); the seam moves the pyreflies on to Paine; the post scene points at the three shades still to come', () => {
    const pre = narrationOf(S.pre).map((n) => n.text).join(' ');
    expect(pre).toMatch(/cave/i);
    expect(pre).toMatch(/gun/i);
    const seam = saysOf(S.midScripts[ids.BALLAD_SEAM_RIKKU]!).map((s) => s.text).join(' ');
    expect(seam).toMatch(/Paine/);
    expect(seam).toMatch(/pyreflies/i);
    expect(saysOf(S.post).map((s) => s.text).join(' ')).toMatch(/three more/i);
  });

  it('copies no line of the game\'s dialogue: the file claims it and no speaker\'s line is quoted', () => {
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
    expect(triggerIds).toEqual([BALLAD_FIRST_GRENADE, ids.BALLAD_SEAM_RIKKU, BALLAD_FIRST_BLADE]);
  });

  it('the seam is the KO of the possessed Rikku (never Paine\'s: her fall is the close); the callouts are Rikku\'s first Grenade and Paine\'s first Attack', () => {
    const by = Object.fromEntries(S.mid.map((t) => [t.id, t.when]));
    expect(by[ids.BALLAD_SEAM_RIKKU]).toEqual({ type: 'ko', who: ids.X2_POSSESSED_RIKKU_ID });
    expect(by[BALLAD_FIRST_GRENADE]).toEqual({ type: 'ability-used', who: ids.X2_POSSESSED_RIKKU_ID, ability: 'x2-possessed-rikku-grenade' });
    expect(by[BALLAD_FIRST_BLADE]).toEqual({ type: 'ability-used', who: ids.X2_POSSESSED_PAINE_ID, ability: 'x2-possessed-paine-attack' });
    expect(Object.values(by).some((w) => (w as { type: string; who?: string }).type === 'ko' && (w as { who?: string }).who === ids.X2_POSSESSED_PAINE_ID)).toBe(false);
  });
});

describe('the budgets (a seam plays with the player\'s hands off)', () => {
  it('the seam is a seam (longer than an interrupt), fits the seam budget, and the runner\'s deadline for it leaves headroom under the presenter\'s own', () => {
    const script = S.midScripts[ids.BALLAD_SEAM_RIKKU]!;
    const ms = scriptDurationMs(script, MID_LINE_HOLD_MS);
    console.info(`[yunas ballad story] ${ids.BALLAD_SEAM_RIKKU} is ${Math.round(ms)} ms of ${SEAM_BUDGET_MS}`);
    expect(ms).toBeGreaterThan(MID_SCRIPT_BUDGET_MS);
    expect(ms).toBeLessThanOrEqual(16_000);
    expect(midBattleDeadlineMs(script)).toBe(Math.min(ms, SEAM_BUDGET_MS) + OVERRUN_GRACE_MS);
    expect(midBattleDeadlineMs(script)).toBeLessThan(PRESENTER_BUDGET_MS);
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
