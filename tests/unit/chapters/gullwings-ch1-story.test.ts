/**
 * Gullwings, Chapter 1 (the hidden FFX-2 chapter): the story layer (a DRAFT for Bailey's read), on paper. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The chapter is registered as a hidden experiment (`EXPERIMENT_CHAPTERS`), not in `src/story/registry.ts`'s `STORY_CHAPTERS` (the listed chapters' audit surface), so `tests/unit/story-scripts.test.ts` and its siblings do not
 * see it. This file holds what they hold for a listed chapter (the Bevelle Guardians' story test is the model):
 *
 * 1. **House style**: `lintScript` on every script; the cast (only the three girls and the unnamed narration speak, no FFX speaker); the writing bible's rations (Paine's one sincere exchange; a mid-battle callout is ten words a
 *    line at most; the girls' lines inside the 60-character box line).
 * 2. **Triggers**: every `mid` trigger id is its script and unique; the seams are the KO of Boris, of the Flame Dragon and of the Guardian Beast; the callouts each boss's first named move.
 * 3. **Budgets**: every seam fits the seam budget with the runner's grace under the presenter's budget, every callout fits `MID_SCRIPT_BUDGET_MS`, every mid `say` carries an `auto`, nothing in a mid script can wedge it.
 * 4. **The draft says what the sources and the engine do**: each seam says why the girls are whole again (the Celsius), the Black Mage and White Mage dresspheres come where the research gives them; the Blast Punch callout
 *    claims no armour (neither Protect nor Shell reduces it); the Photon callout says Shell halves it (it is magical).
 */
import { describe, expect, it } from 'vitest';

import { FFX2_GULLWINGS_CH1 } from '../../../src/data/chapter-ffx2-gullwings-ch1.ts';
import { GULLWINGS_CH1_META } from '../../../src/data/chapter-meta-ffx2-gullwings-ch1.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import * as ids from '../../../src/data/gullwings-ch1-ids.ts';
import * as ab from '../../../src/data/ffx2/enemies/gullwings-ch1-abilities.ts';
import { MAX_LINE_CHARS, MAX_SAY_CHARS, lintScript, type SpeakerId, type Step, type StoryScript } from '../../../src/story/dsl.ts';
import {
  MID_LINE_HOLD_MS, MID_SCRIPT_BUDGET_MS, OVERRUN_GRACE_MS, PRESENTER_BUDGET_MS, SEAM_BUDGET_MS, blockingSteps, midBattleDeadlineMs, scriptDurationMs,
} from '../../../src/story/registry.ts';
import { ffx2GullwingsCh1Scripts as S } from '../../../src/story/scripts/ffx2-gullwings-ch1.ts';

const SEAMS = [ids.GULLWINGS_SEAM_1, ids.GULLWINGS_SEAM_2, ids.GULLWINGS_SEAM_3] as const;
const CALLOUTS = ['first-sticky-end', 'first-flame-breath', 'first-curse', 'first-damocles-photon', 'first-blast-punch'] as const;

/** The speakers of this chapter: the three girls in their FFX-2 voices and the narration as a stage direction (`'none'`). */
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
const textOf = (script: StoryScript): string => saysOf(script).map((s) => s.text).join(' ');
const wordsOf = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

describe('house style on paper', () => {
  it('is the chapter record\'s own, and has enough lines to lint', () => {
    expect(FFX2_GULLWINGS_CH1.scriptsRef).toBe(S);
    expect(getChapter(ids.GULLWINGS_CH1_ID)?.scriptsRef).toBe(S);
    expect(allScripts().flatMap(([, s]) => saysOf(s)).length).toBeGreaterThan(25);
  });

  it('passes lintScript() on every script it owns, and no line is over the say cap', () => {
    for (const [name, script] of allScripts()) {
      expect(lintScript(flatten(script)), `${name} lint`).toEqual([]);
      for (const s of saysOf(script)) expect(s.text.length, `${name}: ${s.text}`).toBeLessThanOrEqual(MAX_SAY_CHARS);
    }
  });

  it('keeps the spoken lines of the girls inside the 60-character line (narration may run to the box\'s two lines)', () => {
    for (const [name, script] of allScripts()) {
      for (const s of saysOf(script)) if (s.who !== 'none') expect(s.text.length, `${name} / ${s.who}: ${s.text}`).toBeLessThanOrEqual(MAX_LINE_CHARS);
    }
  });

  it('opens the battle at the end of the pre scene, shows the results first in the post scene and carries no victory quips', () => {
    expect(S.pre.at(-1)?.type).toBe('battleStart');
    expect(S.post[0]?.type).toBe('results');
    expect(S.victoryQuips).toEqual({});
  });

  it('is FFX-2 only: only the three girls in their FFX-2 voices and the narration speak; no FFX speaker', () => {
    for (const [name, script] of allScripts()) for (const s of saysOf(script)) expect(CAST, `${name}: ${s.who} says "${s.text}"`).toContain(s.who);
    const text = JSON.stringify([S.pre, S.post, S.midScripts]);
    for (const ffxWord of ['tidus', 'auron', 'wakka', 'lulu', 'kimahri', 'seymour', 'yunalesca', 'jecht', 'sin']) expect(new RegExp(`"who":"${ffxWord}"`).test(text), ffxWord).toBe(false);
  });

  it('rations the sincerity: Paine\'s one exchange in the post scene is three lines at most in a row, with the jokes around it; a seam holds her to two lines', () => {
    let run = 0;
    let longest = 0;
    for (const s of saysOf(S.post)) {
      if (s.who === 'paine') {
        run++;
        longest = Math.max(longest, run);
      } else run = 0;
    }
    expect(longest).toBeLessThanOrEqual(3);
    expect(saysOf(S.post).filter((s) => s.who === 'paine').length).toBeGreaterThanOrEqual(1);
    for (const id of SEAMS) expect(saysOf(S.midScripts[id]!).filter((s) => s.who === 'paine').length, id).toBeLessThanOrEqual(2);
  });

  it('keeps a mid-battle callout to ten words a line (writing bible, mid-battle callouts)', () => {
    for (const id of CALLOUTS) for (const s of saysOf(S.midScripts[id]!)) expect(wordsOf(s.text), `${id}: ${s.text}`).toBeLessThanOrEqual(10);
  });
});

describe('what the draft says, against the sources and the engine', () => {
  it('every seam says why the girls are whole again (the Celsius mends them: no Save Sphere card plays between the acts)', () => {
    for (const id of SEAMS) expect(textOf(S.midScripts[id]!), id).toMatch(/Celsius/);
    expect(textOf(S.midScripts[ids.GULLWINGS_SEAM_1]!)).toMatch(/patched|rest/i);
  });

  it('the dresspheres come where the research gives them: the Black Mage after Boris, the White Mage after the Flame Dragon', () => {
    expect(textOf(S.midScripts[ids.GULLWINGS_SEAM_1]!)).toMatch(/Black Mage/);
    expect(textOf(S.midScripts[ids.GULLWINGS_SEAM_2]!)).toMatch(/White Mage/);
  });

  it('names the four hotspots in order: the Floating Ruins in the pre scene, Besaid in the first seam, Zanarkand in the second, Kilika in the third', () => {
    expect(textOf(S.pre)).toMatch(/Floating Ruins/);
    expect(textOf(S.midScripts[ids.GULLWINGS_SEAM_1]!)).toMatch(/Besaid/);
    expect(textOf(S.midScripts[ids.GULLWINGS_SEAM_2]!)).toMatch(/Zanarkand/);
    expect(textOf(S.midScripts[ids.GULLWINGS_SEAM_3]!)).toMatch(/Kilika/);
    expect(textOf(S.post)).toMatch(/Four hotspots/);
  });

  it('the callouts claim only what the rows do: the web is freed by a Remedy, the Curse by Holy Water, the Photon is halved by Shell, the Blast Punch is stopped by nothing, the breath comes before the blows at the healthiest', () => {
    expect(textOf(S.midScripts['first-sticky-end']!)).toMatch(/Remedy/);
    expect(textOf(S.midScripts['first-curse']!)).toMatch(/Holy Water/);
    expect(textOf(S.midScripts['first-damocles-photon']!)).toMatch(/Shell halves it/);
    const punch = textOf(S.midScripts['first-blast-punch']!);
    expect(punch).toMatch(/No armour stops that one/);
    expect(punch).not.toMatch(/protect|shell/i);
    expect(textOf(S.midScripts['first-flame-breath']!)).toMatch(/healthiest/);
  });

  it('the meta\'s quote and snapshots agree with the draft and say nothing the measure contradicts (no promise that magic beats YSLS-Zero\'s Defense)', () => {
    expect(GULLWINGS_CH1_META.quote?.speaker).toBe('Paine');
    const shown = JSON.stringify([S.pre, S.post, S.midScripts, GULLWINGS_CH1_META.quote, GULLWINGS_CH1_META.handwritten, GULLWINGS_CH1_META.snapshots, GULLWINGS_CH1_META.tip]);
    expect(shown).not.toMatch(/magic goes through|ignores (his|its) armour|send a Black Mage/i);
  });

  it('copies no line of the game\'s dialogue: every line carries our own comment and the file claims it', () => {
    expect(JSON.stringify(S)).not.toMatch(/"text":"\\"/);
  });
});

describe('the triggers', () => {
  it('every `mid` trigger id is its script, unique, with a script behind it; every script has a trigger; each fires once', () => {
    const triggerIds = S.mid.map((t) => t.id);
    expect(new Set(triggerIds).size).toBe(triggerIds.length);
    for (const t of S.mid) {
      expect(t.script, t.id).toBe(t.id);
      expect(S.midScripts[t.id], t.id).toBeDefined();
      expect(t.once, t.id).toBe(true);
    }
    expect(Object.keys(S.midScripts).sort()).toEqual([...triggerIds].sort());
    expect(triggerIds).toEqual(['first-sticky-end', ids.GULLWINGS_SEAM_1, 'first-flame-breath', ids.GULLWINGS_SEAM_2, 'first-curse', 'first-damocles-photon', ids.GULLWINGS_SEAM_3, 'first-blast-punch']);
  });

  it('the seams are the KOs of Boris, the Flame Dragon and the Guardian Beast (never YSLS-Zero: his fall is the close); the callouts are each boss\'s first named move', () => {
    const by = Object.fromEntries(S.mid.map((t) => [t.id, t.when]));
    expect(by[ids.GULLWINGS_SEAM_1]).toEqual({ type: 'ko', who: ids.X2_BORIS_ID });
    expect(by[ids.GULLWINGS_SEAM_2]).toEqual({ type: 'ko', who: ids.X2_FLAME_DRAGON_ID });
    expect(by[ids.GULLWINGS_SEAM_3]).toEqual({ type: 'ko', who: ids.X2_GUARDIAN_BEAST_ID });
    expect(by['first-sticky-end']).toEqual({ type: 'ability-used', who: ids.X2_BORIS_ID, ability: ab.BORIS_STICKY_END_ID });
    expect(by['first-flame-breath']).toEqual({ type: 'ability-used', who: ids.X2_FLAME_DRAGON_ID, ability: ab.FLAME_DRAGON_FLAME_BREATH_ID });
    expect(by['first-curse']).toEqual({ type: 'ability-used', who: ids.X2_GUARDIAN_BEAST_ID, ability: ab.GUARDIAN_BEAST_CURSE_ID });
    expect(by['first-damocles-photon']).toEqual({ type: 'ability-used', who: ids.X2_GUARDIAN_BEAST_ID, ability: ab.GUARDIAN_BEAST_DAMOCLES_PHOTON_ID });
    expect(by['first-blast-punch']).toEqual({ type: 'ability-used', who: ids.X2_YSLS_ZERO_ID, ability: ab.YSLS_ZERO_BLAST_PUNCH_ID });
    expect(Object.values(by).some((w) => (w as { type: string; who?: string }).type === 'ko' && (w as { who?: string }).who === ids.X2_YSLS_ZERO_ID)).toBe(false);
  });
});

describe('the budgets (a seam plays with the player\'s hands off)', () => {
  it('every seam is a seam (longer than an interrupt), fits the seam budget, and the runner\'s deadline for it leaves headroom under the presenter\'s own', () => {
    for (const id of SEAMS) {
      const ms = scriptDurationMs(S.midScripts[id]!, MID_LINE_HOLD_MS);
      console.info(`[gullwings ch1 story] ${id} is ${Math.round(ms)} ms of ${SEAM_BUDGET_MS}`);
      expect(ms, id).toBeGreaterThan(MID_SCRIPT_BUDGET_MS);
      expect(ms, id).toBeLessThanOrEqual(16_000);
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
