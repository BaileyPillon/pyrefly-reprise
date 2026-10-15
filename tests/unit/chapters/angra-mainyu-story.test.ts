/**
 * The hidden Angra Mainyu chapter's story layer (`src/story/scripts/ffx2-angra-mainyu.ts`; FFX-2 only [AGENTS.md rule 14]): the scenes lint clean, the two mid-battle beats are wired to triggers
 * that fire on the real engine and fit their budget, and the voices keep to the writing bible (`research/writing-bible.md` §1.14 to §1.16 for the Gullwings, §2.2 for FFX-2's cutscene grammar).
 *
 * The chapter is deliberately NOT in `src/story/registry.ts` (that file's keys are the listed chapters, as the other hidden chapters' stories are not either), so the audits that file runs for the
 * registered chapters are repeated here for this one.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEvent, Command } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { ANGRA_ABILITY, ANGRA_ID, ANGRA_MAINYU_ID } from '../../../src/data/angra-mainyu-ids.ts';
import { MAX_QUIP_WORDS, lintScript } from '../../../src/story/dsl.ts';
import type { Step, StoryScript } from '../../../src/story/dsl.ts';
import { MID_SCRIPT_BUDGET_MS, blockingSteps, midBattleDeadlineMs, scriptDurationMs } from '../../../src/story/registry.ts';
import { ffx2AngraMainyuScripts } from '../../../src/story/scripts/ffx2-angra-mainyu.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';

const chapter = getChapter(ANGRA_MAINYU_ID)!;
const scripts = chapter.scriptsRef;
const lines = (script: StoryScript): Array<Extract<Step, { type: 'say' | 'narrate' }>> => script.filter((s): s is Extract<Step, { type: 'say' | 'narrate' }> => s.type === 'say' || s.type === 'narrate');
const said = (script: StoryScript, who: string): string[] => lines(script).flatMap((s) => (s.type === 'say' && (s as { who: string }).who === who ? [s.text] : []));
const all = [scripts.pre, scripts.post, ...Object.values(scripts.midScripts)];

/** The fight from the chapter's own setup (its triggers ride in the log as `script-trigger` events), the advisor's line, one seed. */
function playLog(seed: number): readonly BattleEvent[] {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init(setupForChapter(chapter, seed));
  for (let i = 0; i < 60_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    const row = d.commands.find((c) => c.enabled);
    engine.submit((intendedStrategy(d.actorId, d.commands, engine) as Command | null) ?? ({ ...row!.command, targets: row!.validTargets.slice(0, 1) } as Command));
  }
  return engine.state().log;
}

describe('the chapter carries its own story', () => {
  it('is the scripts the module exports, with a scene before the fight and the results first after it; no victory quips', () => {
    expect(scripts).toBe(ffx2AngraMainyuScripts);
    expect(scripts.pre.at(-1)!.type).toBe('battleStart');
    expect(scripts.post[0]!.type).toBe('results');
    expect(scripts.victoryQuips).toEqual({});
  });

  it('lints clean: every scene and every beat', () => {
    for (const [name, script] of [['pre', scripts.pre], ['post', scripts.post], ...Object.entries(scripts.midScripts)] as Array<[string, StoryScript]>) {
      expect(lintScript(script), name).toEqual([]);
    }
  });

  it('the sizes: pre about ten lines, post about seven', () => {
    expect(lines(scripts.pre).length).toBeGreaterThanOrEqual(8);
    expect(lines(scripts.pre).length).toBeLessThanOrEqual(12);
    expect(lines(scripts.post).length).toBeGreaterThanOrEqual(5);
    expect(lines(scripts.post).length).toBeLessThanOrEqual(9);
  });

  it('the scenes play the FFX-2 field bed, and the post scene opens in silence', () => {
    const cue = scripts.pre.find((s) => s.type === 'music');
    expect(cue && cue.type === 'music' ? cue.track : null).toBe('scene-bevelle-underground');
    const post = scripts.post.find((s) => s.type === 'music');
    expect(post && post.type === 'music' ? post.track : 'none').toBeNull();
  });
});

describe('the mid-battle beats', () => {
  it('two triggers, each its own script, once each, on his own moves: the first Perdition\'s Flame and the first Full-Life', () => {
    expect(scripts.mid.map((t) => t.when)).toEqual([
      { type: 'ability-used', who: ANGRA_ID, ability: ANGRA_ABILITY.perditionsFlame },
      { type: 'ability-used', who: ANGRA_ID, ability: ANGRA_ABILITY.fullLife },
    ]);
    for (const t of scripts.mid) {
      expect(t.id, 'the engine emits the trigger id, so it must be the script ref').toBe(t.script);
      expect(scripts.midScripts[t.script], t.id).toBeDefined();
      expect(t.once, t.id).toBe(true);
    }
    expect(Object.keys(scripts.midScripts).sort()).toEqual(scripts.mid.map((t) => t.id).sort());
  });

  it('on the real engine, over ten seeds of the advisor\'s line: the Flame\'s beat plays in every fight (he opens with it), the revive\'s in every fight where an arm came back, each once', () => {
    const [flame, revive] = scripts.mid.map((t) => t.id);
    for (let seed = 1; seed <= 10; seed++) {
      const log = playLog(seed);
      const fired = log.flatMap((e) => (e.type === 'script-trigger' ? [e.name] : []));
      expect(fired.filter((n) => n === flame), `seed ${seed}`).toHaveLength(1);
      const revived = log.some((e) => e.type === 'part-restored');
      expect(fired.filter((n) => n === revive), `seed ${seed}`).toHaveLength(revived ? 1 : 0);
    }
  }, 120_000);

  it('every beat fits the interrupt budget, waits on no Confirm, and holds each line for an explicit time; no line is over ten words', () => {
    for (const [id, script] of Object.entries(scripts.midScripts)) {
      expect(scriptDurationMs(script), id).toBeLessThanOrEqual(MID_SCRIPT_BUDGET_MS);
      expect(midBattleDeadlineMs(script), id).toBe(MID_SCRIPT_BUDGET_MS);
      expect(blockingSteps(script), id).toEqual([]);
      for (const s of lines(script)) {
        expect(s.auto, s.text).toBeGreaterThan(0);
        expect(s.text.split(/\s+/).length, s.text).toBeLessThanOrEqual(MAX_QUIP_WORDS);
      }
    }
  });
});

describe('the voices keep to the writing bible', () => {
  it('the speakers are the three Gullwings with their FFX-2 portraits and the unnamed narration; each girl speaks before and after the fight', () => {
    const who = new Set(all.flatMap((s) => lines(s).flatMap((l) => (l.type === 'say' ? [(l as { who: string }).who] : []))));
    for (const w of who) expect(['yuna-x2', 'rikku-x2', 'paine', 'none']).toContain(w);
    for (const scene of [scripts.pre, scripts.post]) for (const girl of ['yuna-x2', 'rikku-x2', 'paine']) expect(said(scene, girl).length, girl).toBeGreaterThan(0);
  });

  it('Paine: two to eight words a line, and she ends the exchanges (§1.16: she gets the third beat)', () => {
    const paine = all.flatMap((s) => said(s, 'paine'));
    expect(paine.length).toBeGreaterThanOrEqual(5);
    for (const t of paine) {
      const words = t.split(/\s+/).length;
      expect(words, t).toBeGreaterThanOrEqual(2);
      expect(words, t).toBeLessThanOrEqual(8);
      expect(t, 'never "Yunie": that is Rikku\'s').not.toMatch(/Yunie/);
    }
    for (const beat of Object.values(scripts.midScripts)) expect((lines(beat).at(-1) as { who?: string }).who).toBe('paine');
  });

  it('nobody calls Yuna "Lady Yuna" here, and no line quotes the game (every line is ours: no transcript is in the repository)', () => {
    for (const s of all) for (const l of lines(s)) expect(l.text, l.text).not.toMatch(/Lady Yuna/);
  });
});
