/**
 * Chapter XI — **option A: 3 s of action time on the three Road links only** (Bailey, 2026-09-25,
 * "All your recommendations"). **FFX-2 only** [AGENTS.md rule 14]: FFX is CTB and has no gauge to
 * hold. The rule is sourced `[verified: 2 sources]`, the 3 s is our labelled `[estimate]`
 * (`src/battle/ffx2/action-time.ts`, `research/ffx2-trema.md` §12.4). No boss number moves: the switch
 * adds one formation field, the same one Chapter XIII's links carry.
 *
 * The measured rate is printed by `fallen-aeons-ship-bench.test.ts` (159/200 at human pace, Wait
 * split) and written up in `docs/plans/fallen-aeons-bench.md`.
 */

import { describe, expect, it } from 'vitest';
import { ACTION_TIME_ALL_FFX2, ACTION_TIME_ESTIMATE_SECONDS, ACTION_TIME_FLAG } from '../../../src/battle/ffx2/action-time.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import * as data from '../../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../../src/data/ffx2/builds/farplane.ts';
import {
  FALLEN_AEONS_CHAIN_ORDER, ROAD_ACTION_TIME, ROAD_ACTION_TIME_ON, ROAD_ACTION_TIME_SECONDS, fallenAeonsGroups, x2Anima, x2Shiva,
} from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { CLOISTER_ACTION_TIME_SECONDS } from '../../../src/data/ffx2/enemies/trema.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { driveLink, LINES } from '../helpers/fallenAeonsDrive.ts';

/** Shiva's turn starts (elapsed ticks), the girls defending, under the engine option given. */
function shivaTurns(actionTimeSeconds: number | undefined, count = 6, seed = 3): number[] {
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'active', ...(actionTimeSeconds === undefined ? {} : { actionTimeSeconds }) }));
  const group = data.ENEMY_GROUPS_BY_ID[FALLEN_AEONS_CHAIN_ORDER[0]]!;
  engine.setSeed(seed);
  engine.init({ game: 'ffx2', party: farplaneBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  const starts: number[] = [];
  for (let i = 0; i < 5000 && starts.length < count; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') break;
    const events: BattleEvent[] = d.kind === 'waiting' ? engine.tick(d.nextEventMs)
      : d.kind === 'player-input' ? engine.submit({ kind: 'defend', targets: [] }) : d.events;
    for (const e of events) if (e.type === 'turn-start' && e.actorId === x2Shiva.id) starts.push(e.elapsedTicks);
  }
  return starts;
}

describe('Chapter XI option A: 3 s of action time on the Road links only (FFX-2 only)', () => {
  it('the switch reads Bailey\'s pick, the same length as Chapter XIII; the global switch and estimate are untouched', () => {
    expect(ROAD_ACTION_TIME_ON).toBe(true);
    expect(ROAD_ACTION_TIME_SECONDS).toBe(3);
    expect(ROAD_ACTION_TIME_SECONDS).toBe(CLOISTER_ACTION_TIME_SECONDS);
    expect(ROAD_ACTION_TIME).toBe(3);
    expect(ACTION_TIME_ALL_FFX2).toBe(false);
    expect(ACTION_TIME_ESTIMATE_SECONDS).toBe(1.5);
  });

  it('all three registered Road links carry it, and the battle flag is set on each', () => {
    expect(fallenAeonsGroups.map((g) => g.id)).toEqual([...FALLEN_AEONS_CHAIN_ORDER]);
    for (const id of FALLEN_AEONS_CHAIN_ORDER) {
      const g = data.ENEMY_GROUPS_BY_ID[id]!;
      expect(g.actionTimeSeconds, id).toBe(3);
      const engine = new FFX2Engine(ffx2Options());
      engine.setSeed(1);
      engine.init({ game: 'ffx2', party: farplaneBuild, enemies: g, triggers: [], seed: 1, condition: 'normal', canEscape: false });
      expect(engine.state().flags[ACTION_TIME_FLAG], id).toBe(3);
    }
  });

  it('no boss number moved: the aeons keep their sourced HP and stats', () => {
    expect(x2Shiva.stats.hp).toBe(14800);
    expect(x2Shiva.stats.agi).toBe(119);
    expect(x2Anima.stats.hp).toBe(36000);
    expect(x2Anima.stats.agi).toBe(133);
  });

  it("each of Shiva's turns lands exactly 3 s (9,000 ticks) later than with the switch forced off", () => {
    const on = shivaTurns(undefined);
    const off = shivaTurns(0);
    expect(on.length).toBe(6);
    expect(off.length).toBe(6);
    for (let i = 1; i < on.length; i++) expect((on[i]! - on[i - 1]!) - (off[i]! - off[i - 1]!)).toBe(9000);
  });

  it('is deterministic: the same seed gives the same Sisters log', () => {
    const a = driveLink(FALLEN_AEONS_CHAIN_ORDER[1], LINES.sistersDarknessDispel, 7);
    const b = driveLink(FALLEN_AEONS_CHAIN_ORDER[1], LINES.sistersDarknessDispel, 7);
    expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log));
  });
});
