/**
 * The Experiment (FFX-2 Chapter 5, Djose Temple; the hidden chapter): the story layer, on paper and run through the engine. **FFX-2 only** [AGENTS.md rule 14].
 *
 * The chapter is registered as a hidden experiment (`EXPERIMENT_CHAPTERS`), not in `src/story/registry.ts`'s `STORY_CHAPTERS` (that table is the listed chapters' audit surface and a shared
 * file), so `tests/unit/story-scripts.test.ts` and its siblings do not see it. This file holds what they hold for a listed chapter:
 *
 * 1. **House style**: `lintScript` (line cap, ellipses, the text lint) on every script; the cast (only the girls and the unnamed technician speak, no FFX speaker); the writing bible's
 *    rations (Paine's one sincere exchange, four lines at most in a row; a mid-battle callout is ten words at most).
 * 2. **Triggers**: every trigger id is its script and unique; every script has a trigger; the seam is the Prototype's fall, the two callouts are the full body's first Lifeslicer and Annihilator.
 * 3. **Budgets**: the seam fits `SEAM_BUDGET_MS` with the runner's grace under the presenter's budget, every other mid script fits `MID_SCRIPT_BUDGET_MS`, every mid `say` carries an `auto`
 *    and nothing in a mid script can wedge it (no choice, no jump).
 * 4. **Run through the engine**: the callouts fire once, after their ability, and the seam only on Act I's fall.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEvent, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { FFX2_EXPERIMENT } from '../../../src/data/chapter-ffx2-experiment.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { ACT_II_LEVELS, EXPERIMENT_ACTIONS, type ExperimentLevels } from '../../../src/data/ffx2/enemies/experiment-levels.ts';
import { EXPERIMENT_ENEMY_ID, EXPERIMENT_PROTOTYPE_ID, experimentFormationAt } from '../../../src/data/ffx2/enemies/experiment.ts';
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
import { EXPERIMENT_SEAM, ffx2ExperimentScripts as S } from '../../../src/story/scripts/ffx2-experiment.ts';
import { driveChapterWithTriggers } from '../helpers/experimentDrive.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

const CALLOUTS = ['first-lifeslicer', 'first-annihilator'] as const;

/** The speakers of this chapter: the three girls in their FFX-2 voices, and the Faction's unnamed technician as a stage direction (`'none'`). */
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
  it('has a script to lint (the walk works), and is the chapter record\'s own', () => {
    expect(FFX2_EXPERIMENT.scriptsRef).toBe(S);
    expect(getChapter(FFX2_EXPERIMENT.id)?.scriptsRef).toBe(S);
    const lines = allScripts().flatMap(([, s]) => saysOf(s));
    expect(lines.length).toBeGreaterThan(30);
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

  it('is FFX-2 only: only the three girls in their FFX-2 voices and the unnamed technician speak; no FFX speaker, no FFX chapter or boss id', () => {
    for (const [name, script] of allScripts()) {
      for (const s of saysOf(script)) expect(CAST, `${name}: ${s.who} says "${s.text}"`).toContain(s.who);
    }
    const text = JSON.stringify([S.pre, S.post, S.midScripts]);
    for (const ffxWord of ['tidus', 'auron', 'wakka', 'lulu', 'kimahri', 'seymour', 'yunalesca', 'jecht', 'sin']) {
      expect(new RegExp(`"who":"${ffxWord}"`).test(text), ffxWord).toBe(false);
    }
  });

  it('rations the sincerity: Paine\'s one exchange is four lines in a row at most, and no one else gets a long speech', () => {
    let run = 0;
    let longest = 0;
    let runs = 0;
    for (const s of saysOf(S.post)) {
      if (s.who === 'paine') {
        run++;
        if (run === 1) runs++;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
    }
    expect(longest).toBeLessThanOrEqual(4);
    expect(longest).toBeGreaterThanOrEqual(3); // the beat is there
    expect(runs).toBeGreaterThanOrEqual(2); // and the jokes around it: she answers, the girls answer, she dries it again
    expect(saysOf(S.midScripts[EXPERIMENT_SEAM]!).filter((s) => s.who === 'paine').length).toBeLessThanOrEqual(2);
  });

  it('keeps a mid-battle callout to ten words a line (writing bible, mid-battle callouts)', () => {
    for (const id of CALLOUTS) {
      for (const s of saysOf(S.midScripts[id]!)) expect(wordsOf(s.text), `${id}: ${s.text}`).toBeLessThanOrEqual(10);
    }
  });

  it('says the girls rest at the seam, in one plain narration line (no Save Sphere at Djose, so no card plays)', () => {
    const rest = saysOf(S.midScripts[EXPERIMENT_SEAM]!).filter((s) => s.who === 'none' && /rest/i.test(s.text));
    expect(rest).toHaveLength(1);
    expect(rest[0]!.text).toContain('Machine Faction');
  });
});

describe('the triggers', () => {
  it('every trigger id is its script, unique, with a script behind it; every script has a trigger', () => {
    const ids = S.mid.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of S.mid) {
      expect(t.script, t.id).toBe(t.id);
      expect(S.midScripts[t.id], t.id).toBeDefined();
      expect(t.once, t.id).toBe(true);
    }
    expect(Object.keys(S.midScripts).sort()).toEqual([...ids].sort());
    expect(ids).toEqual([EXPERIMENT_SEAM, ...CALLOUTS]);
  });

  it('the seam is the Prototype\'s fall (Act I), the callouts are the full body\'s first Lifeslicer and Annihilator (Act II)', () => {
    const by = Object.fromEntries(S.mid.map((t) => [t.id, t.when]));
    expect(by[EXPERIMENT_SEAM]).toEqual({ type: 'ko', who: EXPERIMENT_PROTOTYPE_ID });
    expect(by['first-lifeslicer']).toEqual({ type: 'ability-used', who: EXPERIMENT_ENEMY_ID, ability: EXPERIMENT_ACTIONS.lifeslicer });
    expect(by['first-annihilator']).toEqual({ type: 'ability-used', who: EXPERIMENT_ENEMY_ID, ability: EXPERIMENT_ACTIONS.annihilator });
  });
});

describe('the budgets (the seam plays with the player\'s hands off)', () => {
  it('the seam fits the seam budget with room, and the runner\'s deadline for it leaves headroom under the presenter\'s own', () => {
    const ms = scriptDurationMs(S.midScripts[EXPERIMENT_SEAM]!, MID_LINE_HOLD_MS);
    console.info(`[experiment story] the seam is ${Math.round(ms)} ms of ${SEAM_BUDGET_MS}`);
    expect(ms).toBeLessThanOrEqual(SEAM_BUDGET_MS - 1000); // a second of margin, so a line added later does not tip it
    expect(ms).toBeGreaterThan(MID_SCRIPT_BUDGET_MS); // it IS a seam: the runner gives it its own length, not the interrupt's cap
    expect(midBattleDeadlineMs(S.midScripts[EXPERIMENT_SEAM]!)).toBe(Math.min(ms, SEAM_BUDGET_MS) + OVERRUN_GRACE_MS);
    expect(midBattleDeadlineMs(S.midScripts[EXPERIMENT_SEAM]!)).toBeLessThan(PRESENTER_BUDGET_MS);
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

  it('the seam brings the camera in and puts it back', () => {
    const cams = S.midScripts[EXPERIMENT_SEAM]!.filter((s) => s.type === 'camera').map((s) => (s as { rig: string }).rig);
    expect(cams).toEqual(['action', 'idle']);
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------- run through the engine

type Ev = BattleEvent & { name?: string; actorId?: string; abilityId?: string };
const names = (log: readonly BattleEvent[]): string[] => (log as readonly Ev[]).filter((e) => e.type === 'script-trigger').map((e) => e.name!);

/** The party defends and the clock runs until `until` says stop or the fight ends: the Experiment's own moves, undisturbed. */
function playDefending(engine: FFX2Engine, until: (log: readonly BattleEvent[]) => boolean, guard = 30_000): readonly BattleEvent[] {
  for (let i = 0; i < guard; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
    else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
    if (until(engine.state().log)) break;
  }
  return engine.state().log;
}

function startWithTriggers(levels: ExperimentLevels, seed: number, step?: number): FFX2Engine {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: FFX2_EXPERIMENT.buildRef as FFX2PartyBuild, enemies: experimentFormationAt(levels), triggers: S.mid, seed, condition: 'normal', canEscape: false });
  if (step !== undefined) {
    const boss = engine.state().combatants[EXPERIMENT_ENEMY_ID] as unknown as { aiMemory?: Record<string, number> };
    boss.aiMemory = { experimentStep: step };
  }
  return engine;
}

const used = (log: readonly BattleEvent[], ability: string): number => (log as readonly Ev[]).filter((e) => e.type === 'action-start' && e.actorId === EXPERIMENT_ENEMY_ID && e.abilityId === ability).length;

describe('the triggers, by running the engine (AGENTS.md rule 3)', () => {
  it('the first Lifeslicer fires its callout once, after the Lifeslicer is used, and a second Lifeslicer in the same fight does not fire it again', () => {
    let twice = 0;
    for (let seed = 1; seed <= 40 && twice === 0; seed++) {
      const engine = startWithTriggers({ attack: 1, defense: 1, special: 4 }, seed); // Special 4 rolls a Lifeslicer one poll in six
      const log = playDefending(engine, (l) => used(l, EXPERIMENT_ACTIONS.lifeslicer) >= 2);
      const fired = names(log).filter((n) => n === 'first-lifeslicer');
      if (used(log, EXPERIMENT_ACTIONS.lifeslicer) >= 2) {
        twice++;
        expect(fired, `seed ${seed}`).toHaveLength(1);
      }
      const at = (log as readonly Ev[]).findIndex((e) => e.type === 'script-trigger' && e.name === 'first-lifeslicer');
      if (at >= 0) {
        const firstUse = (log as readonly Ev[]).findIndex((e) => e.type === 'action-start' && e.actorId === EXPERIMENT_ENEMY_ID && e.abilityId === EXPERIMENT_ACTIONS.lifeslicer);
        expect(firstUse, `seed ${seed}`).toBeGreaterThanOrEqual(0);
        expect(at, `seed ${seed}`).toBeGreaterThan(firstUse);
      }
    }
    expect(twice, 'a seed with two Lifeslicers in one fight was found').toBeGreaterThan(0);
  });

  it('the first Annihilator fires its callout once, after it lands; the whole cycle before it fires nothing else', () => {
    const engine = startWithTriggers(ACT_II_LEVELS, 3, 5); // the sixth poll of Special 5 is the Annihilator
    const log = playDefending(engine, (l) => names(l).includes('first-annihilator') || used(l, EXPERIMENT_ACTIONS.annihilator) >= 2);
    expect(names(log).filter((n) => n === 'first-annihilator')).toHaveLength(1);
    expect(names(log)).not.toContain(EXPERIMENT_SEAM); // the seam is Act I's: the Prototype's id never falls here
  });

  it('through both acts: the seam fires once, in Act I; the callouts never fire in Act I (the Prototype has neither move)', () => {
    for (const seed of [1, 2, 3]) {
      const r = driveChapterWithTriggers(seed);
      expect(r.outcome, `seed ${seed}`).toBe('victory');
      expect(names(r.logs[0]!), `seed ${seed}`).toEqual([EXPERIMENT_SEAM]);
      expect(names(r.logs[1]!), `seed ${seed}`).not.toContain(EXPERIMENT_SEAM);
    }
  });
});
