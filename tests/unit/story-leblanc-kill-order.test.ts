// @vitest-environment jsdom
/**
 * PR-0103: Chapter VI's Act III KO beats in either kill order.
 *
 * **Game case: FFX-2 only** (Chapter VI's lines); the flag lifetime is shared
 * plumbing (both), because every chapter's mid-battle beats share one runner.
 *
 * `logos-down` played Ormi ("Logos! Logos, get up!") and Paine ("Ormi next.")
 * whatever state Ormi was in, and `ormi-down` had Leblanc say "Nobody left to
 * be clever with" while Logos still stood. Research `ffx2-leblanc-syndicate.md`
 * §5.4 treats both kill orders as live, so each beat now sets a flag and reads
 * the other's. That needs chapter flags to outlive a beat: the DSL documents
 * them as living "for the chapter", but the mid-battle runner cleared them at
 * the top of every beat.
 */

import { describe, expect, it } from 'vitest';

import { createMidBattleCutscenes } from '../../src/app/screens/BattleScreenCutscenes.ts';
import type { BattleStage } from '../../src/engine/BattlePresenterPorts.ts';
import { ifFlag, setFlag, setPose, type SayStep, type StoryScript } from '../../src/story/dsl.ts';
import { CutsceneRunner, createNoopPorts } from '../../src/story/runner/CutsceneRunner.ts';
import { ffx2LeblancScripts } from '../../src/story/scripts/ffx2-leblanc.ts';

/** Play the beats in order on one runner, as the battle does, and return what each said. */
async function playInOrder(names: string[]): Promise<Array<{ beat: string; lines: SayStep[] }>> {
  let lines: SayStep[] = [];
  const runner = new CutsceneRunner(
    createNoopPorts({
      dialogue: {
        say: (step) => {
          lines.push(step);
          return Promise.resolve();
        },
        narrate: () => Promise.resolve(),
        choice: (step) => Promise.resolve(step.options[0]?.value ?? ''),
      },
    }),
  );
  const out: Array<{ beat: string; lines: SayStep[] }> = [];
  for (const beat of names) {
    lines = [];
    runner.reset({ keepFlags: true });
    const script = ffx2LeblancScripts.midScripts[beat];
    expect(script, beat).toBeDefined();
    await runner.run(script as StoryScript);
    out.push({ beat, lines });
  }
  return out;
}

describe('PR-0103: Act III KO beats stay true in either kill order', () => {
  it('Ormi first, then Logos: no KO\'d speaker talks and no line names a dead target as next', async () => {
    const [ormi, logos] = await playInOrder(['ormi-down', 'logos-down']);
    // Ormi's KO: his bark and Leblanc's kindness still play (the "seam" of §9.3)...
    expect(ormi!.lines.map((l) => l.text)).toContain('Boss... I held the door.');
    // ...but nobody claims Logos is gone while he stands.
    expect(ormi!.lines.map((l) => l.text).join(' ')).not.toMatch(/Nobody left/);
    // Logos's KO after Ormi's: Ormi is down, so Ormi does not speak and nobody targets him.
    expect(logos!.lines.map((l) => l.who)).not.toContain('ormi');
    expect(logos!.lines.map((l) => l.text).join(' ')).not.toMatch(/Ormi next/);
  });

  it('Logos first, then Ormi: the authored order plays as written', async () => {
    const [logos, ormi] = await playInOrder(['logos-down', 'ormi-down']);
    expect(logos!.lines.map((l) => l.text)).toEqual([
      'Logos! Logos, get up!',
      "Leave him, lamb. He's resting.",
      '...And there goes the routine.',
      "Combo's gone. Ormi next.",
    ]);
    expect(ormi!.lines.map((l) => l.text)).toEqual([
      'Boss... I held the door.',
      'You did, lamb. Badly. But you did.',
      'Well. Nobody left to be clever with.',
      'No more combo! Go, go, go!',
    ]);
  });
});

describe('chapter flags outlive a mid-battle beat', () => {
  it('reset() still clears flags by default; reset({ keepFlags: true }) keeps them', async () => {
    const runner = new CutsceneRunner(createNoopPorts());
    await runner.run([setFlag('seen', true)]);
    runner.reset({ keepFlags: true });
    expect(runner.getFlag('seen')).toBe(true);
    runner.reset();
    expect(runner.getFlag('seen')).toBeUndefined();
  });

  it('a flag set by one battle beat is read by the next', async () => {
    const posed: string[] = [];
    const stage = {
      camera: { moveTo: () => Promise.resolve(), snapTo: () => {}, shake: () => {} },
      vfx: { play: () => Promise.resolve(), screenFlash: () => {} },
      actor: (id: string) => ({ setPose: (s: string) => posed.push(`${id}:${s}`) }),
    } as unknown as BattleStage;
    const root = document.createElement('div');
    const cutscenes = createMidBattleCutscenes({ root, stage, sleep: () => Promise.resolve() });
    cutscenes.setAutoAdvance(true, { instant: true });
    await cutscenes.play([setFlag('first-done', true)], { midBattle: true, name: 'a' });
    await cutscenes.play([ifFlag('first-done', [setPose('yuna-x2', 'victory')], [setPose('yuna-x2', 'hurt')])], {
      midBattle: true,
      name: 'b',
    });
    expect(posed).toEqual(['yuna-x2:victory']);
    cutscenes.dispose();
  });
});
