/**
 * r3942-stage wave 2 repair, **FFX-2 only** (AGENTS.md rule 14; the independent check of 2026-10-08): the wait shots of a giant's fight keep the giant whole.
 *
 * A-1 (`ShotFit.ffx2Shot`, `ffx2Push`) holds every FFX-2 shot to the enemy in play at 75 percent of its painted quad and the girls at 90. The scenes' close rigs (`enemy`, `action`, `party`) were authored
 * for the figure each room was built for; under them a giant three times as tall passed the 75 percent with its head above the frame (Bahamut's `action` shot, 0.78 inside). For the three giants
 * (`FFX2_GIANT_SHARE`) the enemy in play is held to `GIANT_WHOLE_MIN`: a close rig that would cut one falls back to the master, whose frame holds it whole; every other fiend keeps its 75 percent.
 * What this does not touch: the story's own camera steps (Bahamut's Mega Flare countdown beat is authored `camera('action')`), which are the writers' cuts and not the shot grammar.
 */
import { describe, expect, it } from 'vitest';
import { BattleMoments } from '../../src/engine/BattleMoments.ts';
import { FFX2_BOSS_MIN, GIANT_WHOLE_MIN } from '../../src/engine/ShotFit.ts';
import type { ActorHandle } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeStage } from './helpers/FakeStage.ts';

type Subjects = ReadonlyArray<{ actor: ActorHandle; min: number; floor?: number }>;

/** A stage whose camera measures the boss at a share per rig (`enemy` and `action` cut a tall figure at 0.8, the master keeps it whole) and every girl whole. */
function setup(boss: string, ffx2 = true) {
  const stage = new FakeStage(['yuna', 'rikku', 'paine'], [boss]);
  const bossActor = stage.actors.get(boss) as unknown as ActorHandle;
  const asked: Array<{ rig: string; push: number; bossFloor: number | undefined }> = [];
  const share: Record<string, number> = { enemy: 0.8, action: 0.8, party: 0.8, idle: 1 };
  (stage.camera as { frame?: unknown }).frame = (rig: string, push: number, subjects: Subjects) => {
    const b = subjects.find((s) => s.actor === bossActor);
    asked.push({ rig, push, bossFloor: b?.floor });
    const f = share[rig] ?? 1;
    const fits = !b || f + 1e-9 >= (b.floor ?? b.min);
    return { fits, push, worst: b ? f : 1 };
  };
  const moments = new BattleMoments({ stage, sleep: async () => {}, speed: () => 'normal' });
  moments.shots.ffx2Framing = ffx2;
  moments.shots.focus = boss;
  return { stage, moments, asked };
}

describe('the wait shots of a giant\'s fight keep it whole (A-1, FFX-2 only)', () => {
  it.each(['bahamut', 'paragon', 'x2-anima'])('%s: a close rig that cuts him (0.8 inside) falls back to the master', (giant) => {
    const { moments } = setup(giant);
    for (const rig of ['enemy', 'action', 'party']) expect(moments.shots.fit(rig, 0.1).rig).toBe('idle');
  });

  it('the boss is asked for at GIANT_WHOLE_MIN, not at the 75 percent of every other fiend', () => {
    const giant = setup('bahamut');
    giant.moments.shots.fit('enemy', 0.1);
    expect(giant.asked.some((a) => a.bossFloor === GIANT_WHOLE_MIN)).toBe(true);
    expect(giant.asked.some((a) => a.bossFloor === FFX2_BOSS_MIN)).toBe(false);
    expect(GIANT_WHOLE_MIN).toBeGreaterThan(FFX2_BOSS_MIN);
  });

  it('every other fiend keeps its 75 percent: the same rig that cuts a giant stays', () => {
    const { moments, asked } = setup('x2-shiva');
    expect(moments.shots.fit('enemy', 0.1).rig).toBe('enemy');
    expect(asked.every((a) => a.bossFloor === undefined || a.bossFloor === FFX2_BOSS_MIN)).toBe(true);
  });

  it('is FFX-2 only: the same ids on an FFX stage (CTB) play the shot as asked', () => {
    const { moments } = setup('bahamut', false);
    expect(moments.shots.fit('enemy', 0.1).rig).toBe('enemy');
  });

  it('a shot that keeps him whole is still played (the master with a push, or a rig that frames him)', () => {
    const { stage, moments } = setup('paragon');
    (stage.camera as unknown as { frame: (rig: string) => unknown }).frame = (rig: string) => ({ fits: true, push: 0.1, worst: rig === 'enemy' ? 0.99 : 1 });
    expect(moments.shots.fit('enemy', 0.1)).toEqual({ rig: 'enemy', push: 0.1 });
  });
});
