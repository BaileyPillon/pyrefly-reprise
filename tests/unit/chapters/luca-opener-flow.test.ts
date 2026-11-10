/**
 * The Luca Opener (the hidden FFX-2 chapter): the flow around the fights. **FFX-2 only** [AGENTS.md rule 14].
 *
 * 1. **The setup**: `setupForChapter` hands the engine the chapter's party and the first formation, no escape, and the four story triggers; the chain has exactly two links, in order.
 * 2. **The triggers**: the seam fires once, when BOTH Logos and Ormi are down (never when only one is); the Potion callout once, the shield callout once (the first Pirouette Pitch), the Thunder callout once; as the real
 *    engine plays the fights.
 * 3. **The pause objectives** (`evaluateObjectives` over the real engine's logs): the second link, Leblanc's first swing and the win are each reached in a real run, and none reads true early.
 * 4. **The store**: an attempt and a clear go to the experiments' own store (`pyrefly-reprise:experiments:v1`), never the save (`pyrefly-reprise:save:v1`): no save change, no migration.
 */
import { describe, expect, it } from 'vitest';

import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { EXPERIMENTS_KEY, experimentProgress, experimentRecord, setExperimentStorageForTests } from '../../../src/app/experiments/experimentRecords.ts';
import { SAVE_KEY } from '../../../src/app/SaveData.ts';
import { lucaOpenerBuild } from '../../../src/data/ffx2/builds/luca-opener.ts';
import { FFX2_LUCA_OPENER, LUCA_OPENER_ID } from '../../../src/data/chapter-ffx2-luca-opener.ts';
import { lucaLeblancGroup, lucaLogosOrmiGroup } from '../../../src/data/ffx2/enemies/luca-opener.ts';
import * as ids from '../../../src/data/luca-opener-ids.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/enemies/index.ts';
import { getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { evaluateObjectives } from '../../../src/ui/common/chapterObjectives.ts';
import { ffx2LucaOpenerScripts as S, LUCA_THUNDER_TRIGGER } from '../../../src/story/scripts/ffx2-luca-opener.ts';
import { driveLuca } from '../helpers/lucaOpenerDrive.ts';

type Ev = BattleEvent & { name?: string; targetId?: string };
const fired = (log: readonly BattleEvent[]): string[] => (log as readonly Ev[]).filter((e) => e.type === 'script-trigger').map((e) => e.name ?? '');

describe('the two-link setup', () => {
  it('plays the chapter\'s preset against the first formation, cannot be fled, and carries the four triggers; the chain is Logos and Ormi, then Leblanc, and ends there', () => {
    const setup = setupForChapter(FFX2_LUCA_OPENER, 7);
    expect(setup).toMatchObject({ game: 'ffx2', seed: 7, condition: 'normal', canEscape: false });
    expect(setup.party).toBe(lucaOpenerBuild);
    expect(setup.enemies).toBe(lucaLogosOrmiGroup);
    expect(setup.triggers.map((t) => t.id)).toEqual([ids.LUCA_POTION_TRIGGER, ids.LUCA_SHIELD_TRIGGER, ids.LUCA_SEAM_1, LUCA_THUNDER_TRIGGER]);
    expect(lucaLogosOrmiGroup.nextGroupId).toBe(ids.LUCA_DOCK_LEBLANC_GROUP_ID);
    expect(ENEMY_GROUPS_BY_ID[lucaLogosOrmiGroup.nextGroupId!]).toBe(lucaLeblancGroup);
    expect(lucaLeblancGroup.nextGroupId).toBeUndefined();
    expect([...ids.LUCA_OPENER_GROUP_IDS]).toEqual([lucaLogosOrmiGroup.id, lucaLeblancGroup.id]);
  });
});

describe('the story triggers fire once each in the real engine', () => {
  it('a whole chapter, three seeds, the shipped advisor line: the seam fires exactly once, after the last of Logos and Ormi falls and never before; the chapter is won', () => {
    for (const seed of [1, 2, 3]) {
      const run = driveLuca('advisor', seed, { triggers: S.mid });
      expect(run.won, `seed ${seed}`).toBe(2);
      const seams = run.logs.map((log) => fired(log).filter((n) => n === ids.LUCA_SEAM_1).length);
      expect(seams, `seed ${seed}: the seam is in the first link only`).toEqual([1, 0]);
      // The seam comes after the second of the two kills on the log.
      const log = run.logs[0] as readonly Ev[];
      const at = log.findIndex((e) => e.type === 'script-trigger' && e.name === ids.LUCA_SEAM_1);
      const kills = log.map((e, i) => (e.type === 'ko' && (e.targetId === ids.X2_LUCA_LOGOS_ID || e.targetId === ids.X2_LUCA_ORMI_ID) ? i : -1)).filter((i) => i >= 0);
      expect(kills.length, `seed ${seed}`).toBe(2);
      expect(at, `seed ${seed}`).toBeGreaterThan(kills[1]!);
    }
  });

  it('with the girls idle: the shield callout fires once on the first Pirouette Pitch, never twice; the Thunder callout once on Leblanc\'s first Thunder (never before it)', () => {
    for (const seed of [4, 5]) {
      const one = driveLuca('idle', seed, { triggers: S.mid, maxEnemyActions: 60 });
      expect(fired(one.logs[0]!).filter((n) => n === ids.LUCA_SHIELD_TRIGGER), `seed ${seed}`).toHaveLength(1);
      expect(fired(one.logs[0]!).filter((n) => n === ids.LUCA_SEAM_1), `seed ${seed}: nobody has fallen`).toHaveLength(0);
      expect(one.moves[ 'x2-luca-ormi-pirouette-pitch' ]! > 1).toBe(true); // the callout survived more than one throw
      const two = driveLuca('idle', seed, { triggers: S.mid, startAtLink2: true, maxEnemyActions: 12 });
      expect(fired(two.logs[0]!).filter((n) => n === LUCA_THUNDER_TRIGGER), `seed ${seed}`).toHaveLength(1);
      expect(two.moves['x2-luca-leblanc-thunder']).toBe(3);
    }
  });

  it('Logos\' Potion callout fires once with the Potion (Ormi rigged under a fifth), and not at all in a fight where no Potion is thrown', () => {
    const rigged = driveLuca('idle', 6, {
      triggers: S.mid,
      maxEnemyActions: 20,
      rig: (engine) => {
        (engine.state().combatants as unknown as Record<string, { hp: number }>)[ids.X2_LUCA_ORMI_ID]!.hp = 15;
      },
    });
    expect(fired(rigged.logs[0]!).filter((n) => n === ids.LUCA_POTION_TRIGGER)).toHaveLength(1);
    const plain = driveLuca('idle', 6, { triggers: S.mid, maxEnemyActions: 20 });
    expect(fired(plain.logs[0]!).filter((n) => n === ids.LUCA_POTION_TRIGGER)).toHaveLength(0);
  });
});

describe('the pause objectives, evaluated over the real engine\'s logs', () => {
  const objectives = getChapterMeta(LUCA_OPENER_ID)!.objectives;
  type Ctx = Parameters<typeof evaluateObjectives>[1];
  const done = (state: Ctx['state'], log: readonly BattleEvent[], links: number): boolean[] => evaluateObjectives(objectives, { state, log, links }).map((o) => o.done);

  it('act 1 reads neither the second link nor Leblanc\'s swing; act 2 reads all three once Leblanc has struck and fallen, and Ormi\'s Attack never stands in for hers', () => {
    for (const seed of [1, 2, 3, 4]) {
      const run = driveLuca('advisor', seed, { triggers: S.mid });
      expect(run.won, `seed ${seed}`).toBe(2);
      // Act 1's last log (a link's victory is on it, so the win row reads true there; the pause is never open at that moment): the second link is not reached and Leblanc has not swung.
      expect(done(run.states[0]!, run.logs[0]!, 1).slice(0, 2), `seed ${seed}: in act 1, Ormi has attacked and the second link is not reached`).toEqual([false, false]);
      expect(done(run.states[1]!, run.logs[1]!, 2), `seed ${seed}: after act 2`).toEqual([true, true, true]);
    }
  });

  it('the swing is reached in a fast fight (the bench pace and the Active clock): Leblanc strikes once and the girls stand (the first draft\'s Thunder row was dropped on the unfixed stat table, when she fell before her fourth action; under the fixed table she casts it in 92 to 100 percent of the shipped runs: handoff section 6)', () => {
    for (const [name, opts] of [['bench', {}], ['Active 1.5 s', { decisionMs: 1500, engine: { atbMode: 'active' as const } }]] as const) {
      for (const seed of [11, 12, 13]) {
        const run = driveLuca('advisor', seed, { ...opts, triggers: S.mid });
        expect(run.won, `${name} ${seed}`).toBe(2);
        expect(done(run.states[1]!, run.logs[1]!, 2)[1], `${name} ${seed}: Leblanc struck once and the girls stood`).toBe(true);
      }
    }
  });

  it('mid-fight in act 1 the row is false even after Ormi has attacked', () => {
    const run = driveLuca('idle', 5, { triggers: S.mid, maxEnemyActions: 12 });
    expect(run.moves['x2-luca-ormi-attack']! > 0).toBe(true);
    expect(done(run.states[0]!, run.logs[0]!, 1)[1]).toBe(false);
  });
});

describe('the experiments\' store, never the save', () => {
  it('an attempt and a clear are kept under the chapter\'s id in the experiments\' key, and the save key is never written', () => {
    const written = new Map<string, string>();
    const fake = { getItem: (k: string): string | null => written.get(k) ?? null, setItem: (k: string, v: string): void => void written.set(k, v) };
    try {
      setExperimentStorageForTests(fake);
      expect(experimentRecord(LUCA_OPENER_ID)).toMatchObject({ attempts: 0, clears: 0, bestTimeMs: null });
      experimentProgress.recordAttempt(LUCA_OPENER_ID);
      experimentProgress.recordClear(LUCA_OPENER_ID, 61_000, 3);
      experimentProgress.recordAttempt(LUCA_OPENER_ID);
      experimentProgress.recordClear(LUCA_OPENER_ID, 90_000, 4);
      expect(experimentRecord(LUCA_OPENER_ID)).toMatchObject({ attempts: 2, clears: 2, bestTimeMs: 61_000 });
      expect([...written.keys()]).toEqual([EXPERIMENTS_KEY]);
      expect(written.has(SAVE_KEY)).toBe(false);
      expect(Object.keys(JSON.parse(written.get(EXPERIMENTS_KEY)!) as Record<string, unknown>)).toEqual([LUCA_OPENER_ID]);
    } finally {
      setExperimentStorageForTests(undefined);
    }
  });
});
