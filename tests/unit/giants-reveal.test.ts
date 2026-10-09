/**
 * r3942-stage wave 2 repair, **FFX-2 only** (AGENTS.md rule 14; the independent check of 2026-10-08): the opening of a giant's fight keeps the giant whole.
 *
 * The finding (Bahamut, Paragon, Anima on a desktop; Anima on a phone): the boss reveal pushed on the scene's own `enemy` rig, authored for the figure each room was built for, and under it a
 * giant three times as tall stood past the top edge of the frame for 2 to 3 s (Bahamut's head, Paragon's horns and back, Anima's horns), and the scene's `intro` cut them too (0.95, 0.84, 0.75 of the
 * painted quad inside). Measured live on the head 0.79 to 0.81 inside at the reveal's hold; after the repair 1.00 through the whole opening. Mechanism, as every B5 piece (`r391-reveal-fit.test.ts`):
 *
 * - `ShotRules.reveal`: where the boss in play is one of the giants (`FFX2_GIANT_SHARE`), it is held whole with the girls, with room (a dolly of `REVEAL_GIANT_ROOM` nearer the aim still keeps it whole),
 *   by the furthest blend between the master and the enemy rig, else the master; on a phone too (B5 itself is desktop only), and only when the played rig does not already keep it whole.
 * - `ShotRules.opening`: the first shot of the battle start is the scene's `intro`, unless it cuts the giant; then the furthest blend from the master toward it that keeps him whole, else the master.
 * - `ShotFit.ffx2Subjects` (A-1, the wait shots of a fight): an enemy that is one of the giants is in play only whole, where every other fiend keeps 75 percent, so a close rig that would cut one falls
 *   back to the master (pinned in `giants-wait-shots.test.ts`).
 *
 * Any other boss, FFX (CTB, no FFX-2 framing) and the giants' own phone shots that were whole are exactly as they were.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BattleMoments } from '../../src/engine/BattleMoments.ts';
import { GIANT_WHOLE_MIN, REVEAL_GIANT_ROOM, giantWholeSubject } from '../../src/engine/ShotFit.ts';
import { setCameraPreset } from '../../src/engine/CameraPreset.ts';
import type { ActorHandle } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeStage } from './helpers/FakeStage.ts';

type Frame = (rig: string, push: number, subjects: ReadonlyArray<{ actor: ActorHandle; min: number; floor?: number }>) => { fits: boolean; push: number; worst: number } | null;

afterEach(() => {
  setCameraPreset('calm');
});

/**
 * A stage whose camera blends rigs by name (`idle>enemy~<permille>`) and measures them by a rule: the girls fit a blend up to `girlsUpTo` permille, the giant up to `giantUpTo`; the push the giant
 * allows on a blend is what room it has left (`(giantUpTo - permille) / 1000`); `enemy` measures as 1000 permille and `intro` as `introAt`.
 */
function setup(o: { boss: string; ffx2?: boolean; giantUpTo: number; girlsUpTo?: number; introAt?: number; phone?: number | null; playedFits?: boolean }) {
  const stage = new FakeStage(['yuna', 'rikku', 'paine'], [o.boss]);
  const boss = stage.actors.get(o.boss)!;
  const asked: Array<{ rig: string; push: number; giantOnly: boolean }> = [];
  const cam = stage.camera as { frame?: Frame; blendRig?: (a: string, b: string, t: number) => string | null; rigNames: string[] };
  const permilleOf = (rig: string): number => {
    const m = /~(\d+)$/.exec(rig);
    if (m) return Number(m[1]);
    if (rig === 'enemy') return 1000;
    if (rig === 'intro') return o.introAt ?? 0;
    return 0;
  };
  cam.frame = (rig, push, subjects) => {
    const giantIn = subjects.some((s) => s.actor === (boss as unknown as ActorHandle));
    asked.push({ rig, push, giantOnly: subjects.length === 1 && giantIn });
    const at = permilleOf(rig);
    const girlsFit = subjects.some((s) => s.actor !== (boss as unknown as ActorHandle)) ? at <= (o.girlsUpTo ?? 1000) : true;
    const giantFit = !giantIn || at <= o.giantUpTo;
    const fits = girlsFit && giantFit;
    const room = giantIn ? Math.max(0, (o.giantUpTo - at) / 1000) : 1;
    return { fits, push: fits ? Math.min(push, room) : push, worst: fits ? 1 : 0 };
  };
  cam.blendRig = (a, b, t) => {
    const name = `${a}>${b}~${Math.round(t * 1000)}`;
    if (!cam.rigNames.includes(name)) cam.rigNames.push(name);
    return name;
  };
  const overlay = o.phone === undefined ? undefined : { letterbox: async () => {}, nameSlab: async () => {}, vignette: () => {}, clear: () => {}, phoneSlice: () => o.phone ?? null };
  const moments = new BattleMoments({ stage, ...(overlay ? { moments: overlay } : {}), sleep: async () => {}, speed: () => 'normal' });
  moments.shots.ffx2Framing = o.ffx2 ?? true;
  moments.shots.headline = o.boss;
  return { stage, moments, asked };
}

const cameraCalls = (stage: FakeStage): string[] => stage.calls.filter((c) => c.startsWith('camera'));
const permilleOfCall = (c: string): number => Number(/~(\d+)$/.exec(c)![1]);

describe('the reveal holds a giant whole, with room (FFX-2 only)', () => {
  it.each(['bahamut', 'paragon', 'x2-anima'])('%s: where the plain reveal would cut him the blend is the furthest that keeps him whole with room, not the one the girls alone allow', async (giant) => {
    // calm travels 0.5 of the way (the played blend is 500 permille); the girls would take any blend, the giant up to 320
    const { stage, moments } = setup({ boss: giant, giantUpTo: 320 });
    await moments.revealBoss(giant, giant);
    const calls = cameraCalls(stage);
    expect(calls[1]).toMatch(/^camera:idle>enemy~(\d+)$/);
    const permille = permilleOfCall(calls[1]!);
    expect(permille).toBeLessThanOrEqual(320 - REVEAL_GIANT_ROOM * 1000); // room: a dolly of REVEAL_GIANT_ROOM nearer the aim keeps him whole
    expect(permille).toBeGreaterThan(80); // a real push on the boss, not the master
    expect(stage.calls).not.toContain('camera:enemy');
    expect(calls.slice(2)).toEqual(['camera:release', 'camera:idle']);
  });

  it('asks the room of the giant alone, and holds the giant and the girls together for the blend', async () => {
    const { moments, asked } = setup({ boss: 'bahamut', giantUpTo: 320 });
    await moments.revealBoss('bahamut', 'Bahamut');
    const room = asked.filter((a) => a.giantOnly && a.push === REVEAL_GIANT_ROOM);
    expect(room.length).toBeGreaterThan(0);
    expect(asked.some((a) => !a.giantOnly && /~\d+$/.test(a.rig))).toBe(true);
  });

  it('where the played rig already keeps the giant (and the girls) whole with room, nothing changes: the plain rig and the plain push', async () => {
    const { stage, moments } = setup({ boss: 'bahamut', giantUpTo: 1000 });
    await moments.revealBoss('bahamut', 'Bahamut');
    const calls = cameraCalls(stage);
    expect(calls[1]).toBe('camera:enemy');
    expect(calls.slice(2)).toEqual(['camera:release', 'camera:idle']);
  });

  it('plays the master itself when no blend keeps him whole', async () => {
    const { stage, moments } = setup({ boss: 'paragon', giantUpTo: 40 }); // under the room of any blend
    await moments.revealBoss('paragon', 'Paragon');
    const calls = cameraCalls(stage);
    expect(calls[1]).toBe('camera:idle');
    expect(stage.calls).not.toContain('camera:enemy');
  });

  it('a girl cut by the blend still bounds it: the furthest blend for the girls and the giant together', async () => {
    const { stage, moments } = setup({ boss: 'bahamut', giantUpTo: 800, girlsUpTo: 180 });
    await moments.revealBoss('bahamut', 'Bahamut');
    const calls = cameraCalls(stage);
    expect(permilleOfCall(calls[1]!)).toBeLessThanOrEqual(180);
  });

  it('is for the giants only: another fiend of FFX-2 keeps the girls-only rule (B5), whatever the camera measures of it', async () => {
    const { stage, moments } = setup({ boss: 'x2-shiva', giantUpTo: 0 }); // the fake would cut a giant at once
    await moments.revealBoss('x2-shiva', 'Shiva');
    expect(cameraCalls(stage)[1]).toBe('camera:enemy');
  });

  it('is FFX-2 only: the same ids on an FFX stage (CTB, no FFX-2 framing) play the reveal as they always did', async () => {
    const { stage, moments } = setup({ boss: 'bahamut', giantUpTo: 0, ffx2: false });
    await moments.revealBoss('bahamut', 'Bahamut');
    expect(cameraCalls(stage)[1]).toBe('camera:enemy');
  });

  it('a party member with a giant\'s id is no giant (the rule is for the enemy side)', async () => {
    const stage = new FakeStage(['bahamut', 'rikku'], ['x2-shiva']);
    const moments = new BattleMoments({ stage, sleep: async () => {}, speed: () => 'normal' });
    moments.shots.ffx2Framing = true;
    moments.shots.headline = 'bahamut';
    await moments.revealBoss('x2-shiva', 'Shiva');
    expect(cameraCalls(stage)[1]).toBe('camera:enemy'); // no frame, no blend on this stage: the plain reveal
  });
});

describe('the reveal on an upright phone holds a giant whole too (FFX-2 only)', () => {
  it('Anima: the played rig cuts her, so the blend that keeps her whole is played (B5 itself is desktop only)', async () => {
    const { stage, moments } = setup({ boss: 'x2-anima', giantUpTo: 320, phone: 0.42 });
    await moments.battleStart({ partyIds: ['yuna', 'rikku', 'paine'], bossId: 'x2-anima', bossName: 'Anima' });
    expect(stage.calls.filter((c) => /^camera:idle>enemy~\d+$/.test(c)).length).toBeGreaterThan(0);
    expect(stage.calls).not.toContain('camera:enemy');
  });

  it('Bahamut and Paragon, whole under the rig the phone plays, keep it exactly as it was', async () => {
    const { stage, moments } = setup({ boss: 'bahamut', giantUpTo: 1000, phone: 0.42 });
    await moments.battleStart({ partyIds: ['yuna', 'rikku', 'paine'], bossId: 'bahamut', bossName: 'Bahamut' });
    expect(stage.calls).toContain('camera:enemy');
  });

  it('a fiend that is no giant keeps the phone\'s reveal as it was, whatever the camera measures', async () => {
    const { stage, moments } = setup({ boss: 'x2-shiva', giantUpTo: 0, phone: 0.42 });
    await moments.battleStart({ partyIds: ['yuna', 'rikku', 'paine'], bossId: 'x2-shiva', bossName: 'Shiva' });
    expect(stage.calls).toContain('camera:enemy');
    expect(stage.calls.some((c) => /idle>enemy/.test(c))).toBe(false);
  });
});

describe('the opening shot holds a giant whole where the scene\'s intro would cut him (FFX-2 only)', () => {
  it.each([['bahamut', 950], ['paragon', 840], ['x2-anima', 750]])('%s: an intro that cuts him is replaced by the furthest blend from the master toward it that keeps him whole', async (giant, introAt) => {
    // the fake measures the intro at `introAt` permille (plus a thousand: over every blend) and the giant fits up to 600: the intro does not, the blends up to 600 do
    const { stage, moments } = setup({ boss: giant, giantUpTo: 600, introAt: introAt + 1000 });
    await moments.battleStart({ partyIds: ['yuna', 'rikku', 'paine'], bossId: giant, bossName: giant });
    const cuts = stage.calls.filter((c) => c.startsWith('camera!:'));
    expect(cuts[0]).toMatch(/^camera!:idle>intro~(\d+)$/);
    const permille = Number(/~(\d+)$/.exec(cuts[0]!)![1]);
    expect(permille).toBeLessThanOrEqual(600);
    expect(permille).toBeGreaterThan(300); // the furthest of the steps that fits: still most of an establishing shot
    expect(stage.calls).not.toContain('camera!:intro');
  });

  it('opens on the master itself where not even a small blend keeps him whole', async () => {
    const { stage, moments } = setup({ boss: 'bahamut', giantUpTo: 20, introAt: 2000 });
    await moments.battleStart({ partyIds: ['yuna', 'rikku', 'paine'], bossId: 'bahamut', bossName: 'Bahamut' });
    expect(stage.calls.filter((c) => c.startsWith('camera!:'))[0]).toBe('camera!:idle');
  });

  it('an intro that keeps him whole is the first shot, as it was (the phone\'s Bahamut and Paragon)', async () => {
    const { stage, moments } = setup({ boss: 'bahamut', giantUpTo: 600, introAt: 100 });
    await moments.battleStart({ partyIds: ['yuna', 'rikku', 'paine'], bossId: 'bahamut', bossName: 'Bahamut' });
    expect(stage.calls.filter((c) => c.startsWith('camera!:'))[0]).toBe('camera!:intro');
  });

  it('another boss, and FFX, keep the scene\'s intro whatever the camera measures of it', async () => {
    const a = setup({ boss: 'x2-shiva', giantUpTo: 0, introAt: 5000 });
    await a.moments.battleStart({ partyIds: ['yuna', 'rikku', 'paine'], bossId: 'x2-shiva', bossName: 'Shiva' });
    expect(a.stage.calls.filter((c) => c.startsWith('camera!:'))[0]).toBe('camera!:intro');
    const b = setup({ boss: 'bahamut', giantUpTo: 0, introAt: 5000, ffx2: false });
    await b.moments.battleStart({ partyIds: ['yuna', 'rikku', 'paine'], bossId: 'bahamut', bossName: 'Bahamut' });
    expect(b.stage.calls.filter((c) => c.startsWith('camera!:'))[0]).toBe('camera!:intro');
  });

  it('a scene with no intro, or a camera that cannot measure, opens as it did', async () => {
    const stage = new FakeStage(['yuna'], ['bahamut']);
    const moments = new BattleMoments({ stage, sleep: async () => {}, speed: () => 'normal' });
    moments.shots.ffx2Framing = true;
    moments.shots.headline = 'bahamut';
    expect(moments.shots.opening('intro')).toBe('intro'); // the fake stage's camera has no `frame`
    expect(moments.shots.opening(null)).toBeNull();
    expect(moments.shots.opening('idle')).toBe('idle');
  });
});

describe('the giant subject the opening is measured with', () => {
  it('holds a quad to `whole` with the sway margin on top, and needs the actor staged', () => {
    const stage = new FakeStage(['yuna'], ['bahamut']);
    const s = giantWholeSubject(stage, 'bahamut', GIANT_WHOLE_MIN)!;
    expect(s.floor).toBe(GIANT_WHOLE_MIN);
    expect(s.min).toBeGreaterThan(GIANT_WHOLE_MIN);
    expect(s.min).toBeLessThanOrEqual(1);
    expect(giantWholeSubject(stage, 'paragon', 1)).toBeNull();
    expect(GIANT_WHOLE_MIN).toBeGreaterThanOrEqual(0.97);
  });
});
