/**
 * Release 39.1, B5 (FFX-2 desktop only): the boss reveal keeps every girl in the frame. In Den of Woe and Fallen Aeons the plain reveal (the enemy's
 * own rig, half way from the master under the calm camera) put Yuna out of the frame for about 2.7 s of the 6 s opening; it now goes as far toward
 * the boss as keeps every girl whole, in the same moves and the same times. Where the plain reveal already keeps everyone, for FFX and on the phone,
 * it is exactly what it was.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BattleMoments, MOMENT_PUSH, MOMENT_TIMING } from '../../src/engine/BattleMoments.ts';
import { setCameraPreset } from '../../src/engine/CameraPreset.ts';
import { REVEAL_PARTY_MIN, ffx2RevealSubjects } from '../../src/engine/ShotFit.ts';
import type { ActorHandle } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeStage } from './helpers/FakeStage.ts';

type Frame = (rig: string, push: number, subjects: ReadonlyArray<{ actor: ActorHandle; min: number; floor?: number }>) => { fits: boolean; push: number; worst: number } | null;

afterEach(() => {
  setCameraPreset('calm');
});

/**
 * A stage whose camera blends rigs by name (`idle>enemy~<permille>`) and measures a rig by a rule: a blend fits while it is at or under `fitUpTo` permille,
 * and the push it allows is `pushAt(permille)`. `plain` is what the unchanged reveal's rig ('enemy') measures.
 */
function setup(o: { ffx2: boolean; fitUpTo: number; plainFits?: boolean; phone?: number | null; blend?: boolean; bossNeverFits?: boolean }) {
  const stage = new FakeStage(['yuna', 'rikku', 'paine'], ['shade-baralai']);
  const asked: Array<{ rig: string; push: number; n: number; floor: number | undefined }> = [];
  const blends: string[] = [];
  const cam = stage.camera as { frame?: Frame; blendRig?: (a: string, b: string, t: number) => string | null; rigNames: string[] };
  cam.frame = (rig, push, subjects) => {
    asked.push({ rig, push, n: subjects.length, floor: subjects[0] ? (subjects[0] as { floor?: number }).floor : undefined });
    const m = /~(\d+)$/.exec(rig);
    const permille = m ? Number(m[1]) : rig === 'enemy' ? (o.plainFits === false ? 1000 : 0) : 0;
    const withBoss = subjects.length > 3; // three girls and the boss
    const fits = permille <= o.fitUpTo && !(o.bossNeverFits && withBoss);
    return { fits, push: fits ? Math.min(push, 0.05 + (o.fitUpTo - permille) / 10000) : push, worst: fits ? 1 : 0 };
  };
  if (o.blend !== false) {
    cam.blendRig = (a, b, t) => {
      const name = `${a}>${b}~${Math.round(t * 1000)}`;
      blends.push(name);
      if (!cam.rigNames.includes(name)) cam.rigNames.push(name);
      return name;
    };
  }
  const overlay = o.phone === undefined ? undefined : { letterbox: async () => {}, nameSlab: async () => {}, vignette: () => {}, clear: () => {}, phoneSlice: () => o.phone ?? null };
  const moments = new BattleMoments({ stage, ...(overlay ? { moments: overlay } : {}), sleep: async () => {}, speed: () => 'normal' });
  moments.shots.ffx2Framing = o.ffx2;
  moments.shots.headline = 'shade-baralai';
  return { stage, moments, asked, blends };
}

describe('the FFX-2 boss reveal keeps every girl whole (B5)', () => {
  it('goes less far toward the boss when the plain reveal would cut a girl: the furthest blend that keeps everyone, in the same moves', async () => {
    // calm travels 0.5 of the way: the played blend is 500 permille; blends up to 200 fit
    const { stage, moments } = setup({ ffx2: true, fitUpTo: 220, plainFits: false });
    await moments.revealBoss('shade-baralai', 'Baralai');
    const calls = stage.calls.filter((c) => c.startsWith('camera'));
    // the push is asked for first (it runs alongside the move), then the move to a blend (not 'enemy'), the release and the way back to idle: each once
    expect(calls[0]).toMatch(/^camera:push=0\.0[0-9]$/);
    expect(calls[1]).toMatch(/^camera:idle>enemy~(\d+)$/);
    const permille = Number(/~(\d+)$/.exec(calls[1]!)![1]);
    expect(permille).toBeLessThanOrEqual(220);
    expect(permille).toBeGreaterThan(100); // a real reveal, not the master
    expect(calls.slice(2)).toEqual(['camera:release', 'camera:idle']);
    expect(stage.calls).not.toContain('camera:enemy');
  });

  it('asks about every girl at 97 percent or more and the boss in play, and takes the push the camera allows', async () => {
    const { moments, asked } = setup({ ffx2: true, fitUpTo: 220, plainFits: false });
    await moments.revealBoss('shade-baralai', 'Baralai');
    const q = asked.find((a) => /~\d+$/.test(a.rig) && a.n === 4)!;
    expect(q.floor).toBe(REVEAL_PARTY_MIN);
    expect(REVEAL_PARTY_MIN).toBeGreaterThanOrEqual(0.97);
    // whether the plain reveal has to change is asked of the three girls alone, at the rig the camera plays (500 permille)
    const first = asked.find((a) => /~500$/.test(a.rig))!;
    expect(first.n).toBe(3);
    const stage = new FakeStage(['yuna', 'rikku'], ['shade-baralai']);
    stage.actors.get('rikku')!.setPose('ko');
    expect(ffx2RevealSubjects(stage, 'shade-baralai')).toHaveLength(2); // a KO'd girl is not framed for; Yuna and the boss
  });

  it('is exactly the plain reveal where the rig of the plain reveal already keeps everyone (Leblanc, Vegnagun)', async () => {
    const { stage, moments } = setup({ ffx2: true, fitUpTo: 1000 });
    await moments.revealBoss('shade-baralai', 'Baralai');
    const calls = stage.calls.filter((c) => c.startsWith('camera'));
    expect(calls).toEqual([`camera:push=${MOMENT_PUSH.reveal.toFixed(2)}`, 'camera:enemy', 'camera:release', 'camera:idle']);
  });

  it('a boss the master itself half shows is no reason to change the reveal (Vegnagun): only a girl cut by the played rig is', async () => {
    const { stage, moments } = setup({ ffx2: true, fitUpTo: 1000, bossNeverFits: true });
    await moments.revealBoss('shade-baralai', 'Baralai');
    const calls = stage.calls.filter((c) => c.startsWith('camera'));
    expect(calls).toEqual([`camera:push=${MOMENT_PUSH.reveal.toFixed(2)}`, 'camera:enemy', 'camera:release', 'camera:idle']);
  });

  it('keeps the girls when a girl is cut and no blend keeps the boss in play as well: the furthest blend for the girls alone', async () => {
    const { stage, moments } = setup({ ffx2: true, fitUpTo: 220, plainFits: false, bossNeverFits: true });
    await moments.revealBoss('shade-baralai', 'Baralai');
    const calls = stage.calls.filter((c) => c.startsWith('camera'));
    expect(calls[1]).toMatch(/^camera:idle>enemy~(\d+)$/);
    expect(Number(/~(\d+)$/.exec(calls[1]!)![1])).toBeLessThanOrEqual(220);
    expect(stage.calls).not.toContain('camera:enemy');
  });

  it('falls back to the master with a push that keeps everyone when not even a small blend fits', async () => {
    const { stage, moments } = setup({ ffx2: true, fitUpTo: -1, plainFits: false });
    await moments.revealBoss('shade-baralai', 'Baralai');
    const calls = stage.calls.filter((c) => c.startsWith('camera'));
    expect(calls[1]).toBe('camera:idle'); // the master itself (the push is asked for first)
    expect(calls).not.toContain('camera:enemy');
  });

  it('is FFX-2 only: FFX plays the reveal as it always did, whatever the camera measures', async () => {
    const { stage, moments, blends } = setup({ ffx2: false, fitUpTo: 0, plainFits: false });
    await moments.revealBoss('shade-baralai', 'Baralai');
    expect(stage.calls).toContain('camera:enemy');
    expect(blends).toEqual([]);
  });

  it('leaves the upright phone to its refitted master (A-12), as before', async () => {
    const { stage, moments, blends } = setup({ ffx2: true, fitUpTo: 0, plainFits: false, phone: 0.42 });
    await moments.battleStart({ partyIds: ['yuna', 'rikku', 'paine'], bossId: 'shade-baralai', bossName: 'Baralai' });
    expect(blends).toEqual([]);
    expect(stage.calls).toContain('camera:enemy');
  });

  it('plays as asked on a camera that cannot blend, and under a camera that holds the master wide', async () => {
    const a = setup({ ffx2: true, fitUpTo: 0, plainFits: false, blend: false });
    await a.moments.revealBoss('shade-baralai', 'Baralai');
    expect(a.stage.calls).toContain('camera:enemy');
    setCameraPreset('steady');
    const b = setup({ ffx2: true, fitUpTo: 0, plainFits: false });
    await b.moments.revealBoss('shade-baralai', 'Baralai');
    expect(b.stage.calls).toContain('camera:enemy'); // the preset keeps the master: nothing moves for a girl to leave by
    expect(b.blends).toEqual([]);
  });

  it('keeps the opening as long as it was: the reveal asks for the same push time and the same plate hold', () => {
    expect(MOMENT_TIMING.revealPush).toBe(1500);
    expect(MOMENT_TIMING.revealSlab).toBe(1400);
    expect(MOMENT_TIMING.returnOut).toBe(620);
  });
});
