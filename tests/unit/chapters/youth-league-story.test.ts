/**
 * The Youth League Tournament (the hidden FFX-2 chapter): the story layer (a DRAFT for Bailey's read), on paper. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The chapter is registered as a hidden experiment (`EXPERIMENT_CHAPTERS`), not in `src/story/registry.ts`'s `STORY_CHAPTERS` (the listed chapters' audit surface), so `tests/unit/story-scripts.test.ts` and its siblings do
 * not see it. This file holds what they hold for a listed chapter (the Farplane Cup's story test is the model):
 *
 * 1. **House style**: `lintScript` and the text lint on every script; the cast (only the girls and the unnamed narration speak, no FFX speaker); the writing bible's rations (one sincere exchange; a mid-battle callout is ten
 *    words a line at most; the girls' lines inside the 60-character box line).
 * 2. **Triggers**: every trigger id is its script and unique; every script has a trigger; the barks fire when an act's whole line is down (`all-ko`), the callouts on Yaibal's Phoenix Down, Elma's guard and Lucil's Harbinger.
 * 3. **Budgets**: every bark and callout is an interrupt (under the 8 s cap), every mid `say` carries an `auto`, nothing in a mid script can wedge it.
 * 4. **The draft says what the sources do**: nothing mends the party between the bouts (the chapter carries everything, pick YL3, and the lines say so); Yaibal's care for Yuna is told; the tournament ends with Lucil.
 */
import { describe, expect, it } from 'vitest';

import { FFX2_YOUTH_LEAGUE } from '../../../src/data/chapter-ffx2-youth-league.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import * as ids from '../../../src/data/youth-league-ids.ts';
import { YL_ABILITY } from '../../../src/data/ffx2/enemies/youth-league-abilities.ts';
import { MAX_LINE_CHARS, MAX_SAY_CHARS, lintScript, type SpeakerId, type Step, type StoryScript } from '../../../src/story/dsl.ts';
import { MID_LINE_HOLD_MS, MID_SCRIPT_BUDGET_MS, PRESENTER_BUDGET_MS, blockingSteps, midBattleDeadlineMs, scriptDurationMs } from '../../../src/story/registry.ts';
import { ffx2YouthLeagueScripts as S } from '../../../src/story/scripts/ffx2-youth-league.ts';

const BARKS = [...ids.YL_SEAM_IDS] as string[];
const CALLOUTS = ['first-phoenix-down', 'first-guard', 'first-harbinger'] as const;

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
    expect(FFX2_YOUTH_LEAGUE.scriptsRef).toBe(S);
    expect(getChapter(ids.YOUTH_LEAGUE_ID)?.scriptsRef).toBe(S);
    expect(allScripts().flatMap(([, s]) => saysOf(s)).length).toBeGreaterThan(35);
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

  it('is FFX-2 only: only the three girls in their FFX-2 voices and the narration speak; no FFX speaker (the League is named by the narration, never given a voice)', () => {
    for (const [name, script] of allScripts()) {
      for (const s of saysOf(script)) expect(CAST, `${name}: ${s.who} says "${s.text}"`).toContain(s.who);
    }
    const text = JSON.stringify([S.pre, S.post, S.midScripts]);
    for (const ffxWord of ['tidus', 'auron', 'wakka', 'lulu', 'kimahri', 'seymour', 'yunalesca', 'jecht', 'sin']) {
      expect(new RegExp(`"who":"${ffxWord}"`).test(text), ffxWord).toBe(false);
    }
  });

  it('rations the sincerity: the one exchange in the post scene is three of Yuna and Paine\'s lines at most, with the jokes around it; a bark has Paine twice at most', () => {
    const sincere = saysOf(S.post).filter((s) => s.who === 'yuna-x2' || s.who === 'paine');
    expect(sincere.length).toBeLessThanOrEqual(3);
    expect(saysOf(S.post).filter((s) => s.who === 'paine').length).toBeGreaterThanOrEqual(1);
    expect(saysOf(S.post).filter((s) => s.who === 'rikku-x2').length).toBeGreaterThanOrEqual(1);
    for (const id of BARKS) expect(saysOf(S.midScripts[id]!).filter((s) => s.who === 'paine').length, id).toBeLessThanOrEqual(2);
  });

  it('keeps a mid-battle callout to ten words a line, and a girl\'s line in a bark too (writing bible, mid-battle callouts)', () => {
    for (const id of CALLOUTS) {
      for (const s of saysOf(S.midScripts[id]!)) expect(wordsOf(s.text), `${id}: ${s.text}`).toBeLessThanOrEqual(10);
    }
    for (const id of BARKS) {
      for (const s of saysOf(S.midScripts[id]!)) if (s.who !== 'none') expect(wordsOf(s.text), `${id}: ${s.text}`).toBeLessThanOrEqual(10);
    }
  });
});

describe('what the draft says, against the sources (research/re-ffx2-youth-league-tournament.md §2, §5, §8)', () => {
  const all = (): string => JSON.stringify([S.pre, S.post, S.midScripts]);

  it('the bracket is seven bouts and the pre scene says so; nothing mends the girls between them, and the first barks say it (the chapter carries the party whole: pick YL3)', () => {
    expect(textOf(S.pre)).toMatch(/Seven bouts/);
    expect(textOf(S.pre)).toMatch(/nobody refills/i);
    expect(textOf(S.midScripts[ids.YL_SEAM_IDS[0]]!)).toMatch(/No\./);
    expect(textOf(S.midScripts[ids.YL_SEAM_IDS[1]]!)).toMatch(/Everyone count/);
    expect(textOf(S.midScripts[ids.YL_SEAM_IDS[4]]!)).toMatch(/no pause/i);
  });

  it('each bark names who comes next, in the road\'s order: the mages and the veteran, the warrior and two veterans, the slashers and the master, four veterans, Elma, Lucil', () => {
    const next = ids.YL_SEAM_IDS.map((id) => textOf(S.midScripts[id]!));
    expect(next[0]).toMatch(/mages and a veteran/i);
    expect(next[1]).toMatch(/warrior and two veterans/i);
    expect(next[2]).toMatch(/slashers and a master/i);
    expect(next[3]).toMatch(/Four of them/i);
    expect(next[4]).toMatch(/Elma/);
    expect(next[5]).toMatch(/Lucil/);
  });

  it('Yaibal\'s care for Yuna is told (the callout says "only Yuna"), Elma\'s guard covers her line, Lucil\'s Harbinger is a countdown', () => {
    expect(textOf(S.midScripts['first-phoenix-down']!)).toMatch(/Only Yuna/);
    expect(textOf(S.midScripts['first-guard']!)).toMatch(/whole line/i);
    expect(textOf(S.midScripts['first-harbinger']!)).toMatch(/countdown/i);
    expect(textOf(S.midScripts['first-harbinger']!)).toMatch(/Fifth beat/i);
  });

  it('the tournament ends with Lucil: the post scene says the board is chalked clean and the League has had its day; Yaibal hands Yuna a small potion', () => {
    expect(textOf(S.post)).toMatch(/chalked clean/i);
    expect(textOf(S.post)).toMatch(/Youth League has had its day/);
    expect(textOf(S.post)).toMatch(/Yaibal hands Yuna a potion/);
  });

  it('invents no prize: no trophy is given (Rikku asks for one and gets none), and no rule the files do not hold is told as fact', () => {
    expect(all()).not.toMatch(/champion|you win a|awarded/i);
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
    expect(triggerIds).toEqual(['first-phoenix-down', ...ids.YL_SEAM_IDS.slice(0, 5), 'first-guard', ids.YL_SEAM_IDS[5], 'first-harbinger']);
  });

  it('the barks are the fall of each act\'s WHOLE line (all-ko over the act\'s own ids), never Lucil\'s (her fall is the close); the callouts are each named fighter\'s signature move', () => {
    const by = Object.fromEntries(S.mid.map((t) => [t.id, t.when]));
    for (let act = 0; act < 6; act++) expect(by[ids.YL_SEAM_IDS[act]!], `act ${act + 1}`).toEqual({ type: 'all-ko', ids: [...ids.ACT_ENEMY_IDS[act]!] });
    expect(by['first-phoenix-down']).toEqual({ type: 'ability-used', who: ids.X2_YAIBAL_ID, ability: YL_ABILITY.phoenixDown });
    expect(by['first-guard']).toEqual({ type: 'ability-used', who: ids.X2_ELMA_ID, ability: YL_ABILITY.guard });
    expect(by['first-harbinger']).toEqual({ type: 'ability-used', who: ids.X2_LUCIL_ID, ability: YL_ABILITY.harbinger });
    expect(Object.values(by).some((w) => (w as { type: string; ids?: string[] }).type === 'all-ko' && (w as { ids?: string[] }).ids?.includes(ids.X2_LUCIL_ID))).toBe(false);
  });
});

describe('the budgets (a bark plays with the player\'s hands off)', () => {
  it('every bark and every callout is an interrupt: it fits the 8 s cap, and its deadline is the cap', () => {
    for (const id of [...BARKS, ...CALLOUTS]) {
      const ms = scriptDurationMs(S.midScripts[id]!, MID_LINE_HOLD_MS);
      console.info(`[youth league story] ${id} is ${Math.round(ms)} ms of ${MID_SCRIPT_BUDGET_MS}`);
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
