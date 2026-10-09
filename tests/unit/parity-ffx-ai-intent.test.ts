/**
 * **Re-parity, boss AI: asking what the Seymour fights do next must not move them** (FFX only).
 *
 * The four scripts of `research/re-ffx-ai-seymour.md` keep their state in `BattleState.flags` and move it, and spend
 * their draws, at decision time: Flux's cycle state, Natus's element index, Omnis's Defense and reset, Macalania's
 * act and spell index. The enemy-intent panel dry-runs a script on a clone (`ffx/intent.ts#cloneCtx`) every time a
 * menu opens, so a script that wrote anywhere the clone shares would advance the fight once per render, and one that
 * drew from the live stream would reseed it. This plays each fight twice on the same seeds, asking at every player
 * decision the first time and never the second, and compares the whole event log and the final flags.
 *
 * Release candidate 1 added Chapters II and III (AI lane B: Yunalesca, Braska's Final Aeon with the Pagodas and Yu Yevon's
 * link) to the same check: their scripts keep memory and spend draws at decision time too, and they run on the same clone.
 *
 * Game case: FFX only. The preview itself (the move it names, the counters it lists) is `enemy-intent.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { Command } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const FIGHTS = ['seymour-flux', 'seymour-anima-macalania', 'seymour-natus', 'seymour-omnis', 'yunalesca', 'braskas-final-aeon'] as const;

function build(chapterId: string, seed: number) {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`no chapter ${chapterId}`);
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx',
    party: chapter.buildRef as never,
    enemies: ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id]!,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

/** Play a fight with the shipped line; `ask` opens the intent preview at every player decision first. */
function play(chapterId: string, seed: number, ask: boolean): { log: string; flags: string; asked: number; named: number } {
  const engine = build(chapterId, seed);
  let asked = 0;
  let named = 0;
  for (let i = 0; i < 6000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind !== 'player-input') continue;
    if (ask) {
      asked += 1;
      if (engine.intent() !== null) named += 1;
    }
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? ({ kind: 'defend', targets: [] } as Command));
  }
  const state = engine.state();
  return { log: JSON.stringify(state.log), flags: JSON.stringify(state.flags), asked, named };
}

describe('asking what a re-scripted boss fight does next does not move it', () => {
  for (const chapterId of FIGHTS) {
    it(`${chapterId}: the same fight with and without the preview, seeds 1 to 3, is the same log and the same flags`, () => {
      let asked = 0;
      let named = 0;
      for (const seed of [1, 2, 3]) {
        const quiet = play(chapterId, seed, false);
        const curious = play(chapterId, seed, true);
        expect(curious.flags, `seed ${seed}: the script's state after the fight`).toBe(quiet.flags);
        expect(curious.log.length, `seed ${seed}: the event log's length`).toBe(quiet.log.length);
        expect(curious.log === quiet.log, `seed ${seed}: the event log, byte for byte`).toBe(true);
        asked += curious.asked;
        named += curious.named;
      }
      // The comparison is only worth something if the panel was really asked, and answered most of the time.
      expect(asked).toBeGreaterThan(20);
      expect(named).toBeGreaterThan(asked / 2);
    }, 120_000);
  }
});
