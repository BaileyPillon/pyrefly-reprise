/**
 * **Re-parity, boss AI: asking what the Syndicate, the Den of Woe shades and Ixion do next must not move the fight**
 * (FFX-2 only; AI lane C).
 *
 * The scripts of `research/re-ffx2-ai-leblanc-den-ixion.md` keep their state in the unit's AI memory (Leblanc's trio
 * counter, Baralai's burst counter and his queued second command, Ixion's action counter) and spend their draws at
 * decision time. The enemy-intent panel dry-runs a script on a clone (`ffx2/intent.ts#cloneAiContext`) every time a menu
 * opens, so a script that wrote anywhere the clone shares would advance the fight once per render, and one that drew from
 * the live stream would reseed it. This plays each chapter's whole chain twice on the same seeds, asking the engine for
 * its intent at every player decision the first time and never the second, and compares the whole event log of every
 * link, the final flags and the counters kept on the enemies.
 *
 * Game case: FFX-2 only. The preview itself (the move it names, the counters it lists) is `enemy-intent.test.ts`
 * and the lines at the end of this file.
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, BattleState, Command, Decision } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { countersFor } from '../../src/battle/ffx2/intent.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter, setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';

const FIGHTS = ['ffx2-leblanc', 'ffx2-den-of-woe', 'ffx2-ixion-djose'] as const;

type Input = Extract<Decision, { kind: 'player-input' }>;

function fallback(d: Input): Command {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] } as Command;
  const t = row.validTargets[0];
  return { ...row.command, targets: t ? [t] : [] } as Command;
}

interface Played {
  logs: string[];
  flags: string[];
  memory: string[];
  asked: number;
  named: number;
}

/** Play the chapter's chain with the shipped line; `ask` opens the intent preview at every player decision first. */
async function play(chapterId: string, seed: number, ask: boolean): Promise<Played> {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`no chapter ${chapterId}`);
  let setup: BattleSetup = setupForChapter(chapter, seed);
  let group = chapter.enemyGroupRef;
  const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  const out: Played = { logs: [], flags: [], memory: [], asked: 0, named: 0 };
  let link = 1;
  for (let step = 0; step < 60_000; step += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind === 'battle-over') {
      const state = engine.state() as Readonly<BattleState>;
      out.logs.push(JSON.stringify(state.log));
      out.flags.push(JSON.stringify(state.flags));
      out.memory.push(
        JSON.stringify(Object.values(state.combatants).map((c) => [c.id, (c as Ffx2Unit).aiMemory ?? null])),
      );
      if (d.result.outcome !== 'victory' || !group.nextGroupId || link >= 12) break;
      const next = await findEnemyGroup(group.nextGroupId);
      if (!next) break;
      setup = setupForNextLink(setup, next, engine.state() as BattleState, seed + link);
      group = next;
      link += 1;
      engine.setSeed(setup.seed);
      engine.init(setup);
      continue;
    }
    if (ask) {
      out.asked += 1;
      if (engine.intent() !== null) out.named += 1;
    }
    engine.submit(intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d));
  }
  return out;
}

describe('asking what a re-scripted FFX-2 boss does next does not move the fight', () => {
  for (const chapterId of FIGHTS) {
    it(`${chapterId}: the same chain with and without the preview, seeds 1 to 3, is the same logs, flags and counters`, async () => {
      await registerBattleContent();
      let asked = 0;
      let named = 0;
      for (const seed of [1, 2, 3]) {
        const quiet = await play(chapterId, seed, false);
        const curious = await play(chapterId, seed, true);
        expect(curious.logs.length, `seed ${seed}: links played`).toBe(quiet.logs.length);
        expect(curious.flags, `seed ${seed}: the flags after each link`).toEqual(quiet.flags);
        expect(curious.memory, `seed ${seed}: the AI counters after each link`).toEqual(quiet.memory);
        expect(curious.logs.map((l) => l.length), `seed ${seed}: the event logs' lengths`).toEqual(quiet.logs.map((l) => l.length));
        expect(curious.logs.every((l, i) => l === quiet.logs[i]), `seed ${seed}: every event log, byte for byte`).toBe(true);
        asked += curious.asked;
        named += curious.named;
      }
      // The comparison is only worth something if the panel was really asked, and answered most of the time.
      expect(asked).toBeGreaterThan(20);
      expect(named).toBeGreaterThan(asked / 2);
    }, 600_000);
  }
});

describe('the panel names the rules these scripts now follow', () => {
  const unitOf = (scriptId: string): Ffx2Unit => {
    const u = aiUnit('x', 'enemy', 100, 0);
    u.enemy = { ...(u.enemy as NonNullable<Ffx2Unit['enemy']>), aiScriptId: scriptId };
    return u;
  };

  it("Baralai's and Ixion's counters are listed as per result, not per action", () => {
    const baralai = countersFor(unitOf('shade-baralai')).join(' ');
    expect(baralai).toMatch(/result/i);
    const ixion = countersFor(unitOf('x2-ixion')).join(' ');
    expect(ixion).toMatch(/result/i);
    expect(ixion).toMatch(/100/);
  });

  it('a script with no counter lists none', () => {
    expect(countersFor(unitOf('ffx2-leblanc'))).toEqual([]);
    expect(countersFor(unitOf('shade-gippal'))).toEqual([]);
  });
});
