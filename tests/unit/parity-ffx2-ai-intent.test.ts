/**
 * **Re-parity AI-FFX2-b: asking what a re-scripted boss does next must not move the fight** (**FFX-2 only**).
 *
 * The scripts of Shiva, the Magus Sisters, Anima, Paragon, the Oversoul Paragon and Trema keep richer state than the first build did
 * (Shiva's chain counter, the Sisters' flags and reset flags, Trema's queued chain links, the Oversoul's answer state and idle clock),
 * and they move it, and spend their draws, at decision time. The enemy-intent panel dry-runs a script on a clone of the board
 * (`ffx2/intent.ts#cloneAiContext`) every time a menu opens, so a script that wrote anywhere the clone shares would advance the fight
 * once per render, and one that drew from the live stream would reseed it. This plays each link twice on the same seeds, asking at
 * every player decision the first time and never the second, and compares the whole event log and every enemy's AI memory.
 *
 * The preview itself (the move it names) is the other intent tests'. A mutant that shares a unit's AI memory with the clone was caught
 * by hand (scratch, `deepCopy` removed).
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, Command, EnemyGroupDef } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { ROAD_ANIMA, ROAD_SHIVA, ROAD_SISTERS } from '../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

interface Link {
  name: string;
  party: BattleSetup['party'];
  group: EnemyGroupDef;
}

const trema = CHAPTERS.find((c) => c.id === 'ffx2-trema');
if (!trema) throw new Error('no ffx2-trema chapter');

function groupOf(id: string): EnemyGroupDef {
  const g = data.ENEMY_GROUPS_BY_ID[id];
  if (!g) throw new Error(`no group ${id}`);
  return g;
}

const LINKS: Link[] = [
  { name: 'Shiva', party: farplaneBuild, group: groupOf(ROAD_SHIVA) },
  { name: 'the Magus Sisters', party: farplaneBuild, group: groupOf(ROAD_SISTERS) },
  { name: 'Anima', party: farplaneBuild, group: groupOf(ROAD_ANIMA) },
  { name: "Chapter XIII's first link (the shipped form)", party: trema.buildRef as BattleSetup['party'], group: trema.enemyGroupRef },
  { name: 'Trema', party: trema.buildRef as BattleSetup['party'], group: groupOf(trema.enemyGroupRef.nextGroupId ?? 'ffx2-cloister-trema') },
];

/** Play one link with the shipped line; `ask` opens the intent preview at every player decision first. */
function play(link: Link, seed: number, ask: boolean): { log: string; memory: string; asked: number; named: number } {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: link.party, enemies: link.group, triggers: [], seed, condition: 'normal', canEscape: false });
  let asked = 0;
  let named = 0;
  for (let i = 0; i < 40_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    if (d.kind === 'waiting') {
      engine.tick(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    if (ask) {
      asked += 1;
      if (engine.intent() !== null) named += 1;
    }
    engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? ({ kind: 'defend', targets: [] } as Command));
  }
  const state = engine.state();
  const units = Object.values(state.combatants) as unknown as Ffx2Unit[];
  return {
    log: JSON.stringify(state.log),
    memory: JSON.stringify(units.filter((u) => u.side === 'enemy').map((u) => [u.id, u.aiMemory ?? {}])),
    asked,
    named,
  };
}

describe('asking what a re-scripted boss does next does not move it', () => {
  for (const link of LINKS) {
    it(`${link.name}: the same fight with and without the preview, seeds 1 and 2, is the same log and the same AI memory`, () => {
      let asked = 0;
      let named = 0;
      for (const seed of [1, 2]) {
        const quiet = play(link, seed, false);
        const curious = play(link, seed, true);
        expect(curious.memory, `seed ${seed}: the scripts' memory after the fight`).toBe(quiet.memory);
        expect(curious.log.length, `seed ${seed}: the event log's length`).toBe(quiet.log.length);
        expect(curious.log === quiet.log, `seed ${seed}: the event log, byte for byte`).toBe(true);
        asked += curious.asked;
        named += curious.named;
      }
      // The comparison is only worth something if the panel was really asked, and answered some of the time.
      expect(asked).toBeGreaterThan(10);
      expect(named).toBeGreaterThan(0);
    }, 120_000);
  }
});
