/**
 * r392-motion, FFX-2 desktop only (Bailey, 2026-10-06: "shrink the camera push so Yuna stays in frame"). Chapter IV's Bahamut reveal plays on the rig half way from the master (the calm camera).
 * B5 measured that rig without the lens shift CHAPTER FRAMING puts on the camera (the master carries a 64 px by 36 px one), so it read "every girl whole" where the screen cut Yuna (her staff
 * tip, a 0.78 share, with no push at all) and the 0.12 push (0.06 applied) took her to 0.44. The reveal now measures through the lens (`CameraPort.frame`'s `lens`): a rig the lens cuts
 * goes less far toward the boss (B5's blend), a rig it keeps takes the push it keeps the girls with, in the same moves and times.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BattleMoments, MOMENT_PUSH, MOMENT_TIMING } from '../../src/engine/BattleMoments.ts';
import { CAMERA_PRESETS, cameraPresetFor, setCameraPreset } from '../../src/engine/CameraPreset.ts';
import { REVEAL_PARTY_MIN } from '../../src/engine/ShotFit.ts';
import type { ActorHandle } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeStage } from './helpers/FakeStage.ts';

type Frame = (rig: string, push: number, subjects: ReadonlyArray<{ actor: ActorHandle; min: number; floor?: number }>, lens?: boolean) => { fits: boolean; push: number; worst: number } | null;

afterEach(() => {
  setCameraPreset('calm');
});

interface Ask { rig: string; push: number; n: number; floor: number | undefined; lens: boolean | undefined }

/**
 * A stage whose camera blends rigs by name and measures them. The enemy's own rig ('enemy') takes any push as asked (the plain reveal measures its own rig first). A played blend
 * (`idle>enemy~<permille>`) keeps every girl at rest unless the lens cuts it (`lensCutsAbove`: permille over which the lens shift takes a girl out, only when asked through the lens), and
 * takes an applied push of at most `limit` where it fits.
 */
function setup(o: { ffx2?: boolean; limit: number; lensCutsAbove?: number; masterWorst?: number; softCut?: { above: number; share: number }; measure?: boolean; phone?: number | null }) {
  const stage = new FakeStage(['yuna', 'rikku', 'paine'], ['bahamut']);
  const asked: Ask[] = [];
  const blends: string[] = [];
  const cam = stage.camera as { frame?: Frame; blendRig?: (a: string, b: string, t: number) => string | null; rigNames: string[] };
  if (o.measure !== false) {
    cam.frame = (rig, push, subjects, lens) => {
      asked.push({ rig, push, n: subjects.length, floor: subjects[0] ? (subjects[0] as { floor?: number }).floor : undefined, lens });
      const m = /~(\d+)$/.exec(rig);
      if (!m) return { fits: true, push, worst: rig === 'idle' ? (o.masterWorst ?? 1) : 1 };
      let fits = !(lens === true && o.lensCutsAbove !== undefined && Number(m[1]) > o.lensCutsAbove);
      let worst = fits ? 1 : 0.78;
      if (o.softCut && Number(m[1]) > o.softCut.above) { worst = o.softCut.share; fits = worst >= ((subjects[0] as { floor?: number }).floor ?? 0) - 1e-9; } // a girl a few percent under the frame's edge: whole only to a floor under her share
      return { fits, push: fits ? Math.min(push, o.limit) : push, worst };
    };
  }
  cam.blendRig = (a, b, t) => {
    const name = `${a}>${b}~${Math.round(t * 1000)}`;
    blends.push(name);
    if (!cam.rigNames.includes(name)) cam.rigNames.push(name);
    return name;
  };
  const overlay = o.phone === undefined ? undefined : { letterbox: async () => {}, nameSlab: async () => {}, vignette: () => {}, clear: () => {}, phoneSlice: () => o.phone ?? null };
  const moments = new BattleMoments({ stage, ...(overlay ? { moments: overlay } : {}), sleep: async () => {}, speed: () => 'normal' });
  moments.shots.ffx2Framing = o.ffx2 !== false;
  moments.shots.headline = 'bahamut';
  return { stage, moments, asked, blends };
}

const camCalls = (stage: FakeStage): string[] => stage.calls.filter((c) => c.startsWith('camera'));
const pushOf = (calls: string[]): number => Number(/^camera:push=([\d.]+)$/.exec(calls[0]!)![1]);
const plainCalls = [`camera:push=${MOMENT_PUSH.reveal.toFixed(2)}`, 'camera:enemy', 'camera:release', 'camera:idle'];

describe('the reveal is measured as the screen shows it: through the chapter\'s lens shift', () => {
  it('asks every measure of the played rig and its blends through the lens, and the girls as whole as the master keeps them', async () => {
    const { moments, asked } = setup({ limit: 0.2, lensCutsAbove: 300 });
    await moments.revealBoss('bahamut', 'Bahamut');
    const onPlayed = asked.filter((a) => /~\d+$/.test(a.rig));
    expect(onPlayed.length).toBeGreaterThan(1);
    expect(onPlayed.every((a) => a.lens === true)).toBe(true);
    expect(onPlayed.every((a) => a.floor === 1)).toBe(true); // the master keeps every girl whole, so the reveal does too
    expect(asked.find((a) => a.rig === 'idle')!.lens).toBe(true); // how whole the master keeps them is read through the lens as well
    // the plain reveal's own rig (A-11's `fittedPush`, which every push-in uses) is measured as it always was: no lens
    expect(asked.filter((a) => a.rig === 'enemy').every((a) => a.lens === undefined)).toBe(true);
  });

  it('a played rig the lens cuts (Chapter IV: fits without the lens, cut with it) goes less far toward the boss, in the same moves', async () => {
    // calm travels 0.5 of the way: the played blend is 500 permille; the lens cuts a girl above 430, so the furthest B5 blend that keeps her is under it
    const { stage, moments } = setup({ limit: 0.2, lensCutsAbove: 430 });
    await moments.revealBoss('bahamut', 'Bahamut');
    const calls = camCalls(stage);
    expect(calls).toHaveLength(4); // the push asked for first (it runs alongside the move), the rig, the release, the way back: each once
    expect(calls[1]).toMatch(/^camera:idle>enemy~(\d+)$/);
    const permille = Number(/~(\d+)$/.exec(calls[1]!)![1]);
    expect(permille).toBeLessThanOrEqual(430);
    expect(permille).toBeGreaterThan(300); // a reveal, not the master: the furthest step that keeps her
    expect(calls.slice(2)).toEqual(['camera:release', 'camera:idle']);
    expect(stage.calls).not.toContain('camera:enemy');
  });

  it('asks no more of the girls than the master gives: all of each where the master is whole, what the master keeps where it cuts a little, never under 97 percent', async () => {
    const floorOf = async (masterWorst: number): Promise<number | undefined> => {
      const { moments, asked } = setup({ limit: 0.2, lensCutsAbove: 300, masterWorst });
      await moments.revealBoss('bahamut', 'Bahamut');
      return asked.find((a) => /~500$/.test(a.rig))!.floor;
    };
    expect(await floorOf(1)).toBe(1);
    expect(await floorOf(0.99999999)).toBe(1);
    expect(await floorOf(0.985)).toBeCloseTo(0.985, 5);
    expect(await floorOf(0.9)).toBe(REVEAL_PARTY_MIN); // a master that already cuts a girl deeply does not lower B5's bar
  });

  it('a played rig that holds the feet of a girl a few px under the frame edge (a 0.984 share: Chapter IV at 2560x1080) goes less far, where the 97 percent of B5 let it through', async () => {
    const soft = setup({ limit: 0.2, softCut: { above: 430, share: 0.984 } });
    await soft.moments.revealBoss('bahamut', 'Bahamut');
    const calls = camCalls(soft.stage);
    expect(calls[1]).toMatch(/^camera:idle>enemy~(\d+)$/);
    expect(Number(/~(\d+)$/.exec(calls[1]!)![1])).toBeLessThanOrEqual(430);
    // a master that itself keeps her at 0.984 asks no more than that of the reveal: the played rig stays
    const level = setup({ limit: 0.2, softCut: { above: 430, share: 0.984 }, masterWorst: 0.984 });
    await level.moments.revealBoss('bahamut', 'Bahamut');
    expect(camCalls(level.stage)[1]).toBe('camera:enemy');
  });

  it('the same stage measured without the lens (the old measure) plays the plain reveal: the lens is what finds the cut', async () => {
    const { stage, moments } = setup({ limit: 0.2 }); // the lens cuts nothing here
    await moments.revealBoss('bahamut', 'Bahamut');
    expect(camCalls(stage)).toEqual(plainCalls);
  });
});

describe('where the played rig keeps every girl, the push is the one it keeps them with', () => {
  it('is the push as it was where the applied push already keeps them (every chapter the girls are whole in): 0.12, the enemy\'s rig', async () => {
    const { stage, moments } = setup({ limit: 0.2 });
    await moments.revealBoss('bahamut', 'Bahamut');
    expect(camCalls(stage)).toEqual(plainCalls);
  });

  it('is cut to what the rig takes where it does not: asked of the rig at the push the camera applies, the same rig and moves', async () => {
    const limit = 0.0166; // applied: the played rig loses its last girl at 1.66 percent of the camera distance, where the asked 0.12 gave 0.06
    const { stage, moments, asked } = setup({ limit });
    await moments.revealBoss('bahamut', 'Bahamut');
    const calls = camCalls(stage);
    expect(calls).toHaveLength(4);
    expect(calls.slice(1)).toEqual(['camera:enemy', 'camera:release', 'camera:idle']);
    expect(pushOf(calls)).toBeCloseTo(limit, 2);
    expect(pushOf(calls)).toBeLessThan(MOMENT_PUSH.reveal / 2);
    const q = asked.find((a) => /~500$/.test(a.rig) && a.push > 0)!;
    expect(q.n).toBe(3); // the girls alone decide
    expect(q.lens).toBe(true);
    expect(q.push).toBeCloseTo(MOMENT_PUSH.reveal * CAMERA_PRESETS.calm.push, 12); // the push the camera applies, 0.12 of the moment halved
  });

  it('asks the camera for exactly the push the rig takes, to the digit: the calm camera applies half of it, which leaves the girls the other half of the room for the idle sway', async () => {
    const limit = 0.0166;
    const { stage, moments } = setup({ limit });
    const seen: number[] = [];
    (stage.camera as { push?: (f?: number) => Promise<void> }).push = async (f) => void seen.push(f ?? Number.NaN);
    await moments.revealBoss('bahamut', 'Bahamut');
    expect(seen).toEqual([limit]);
    expect(seen[0]! * cameraPresetFor('ffx2').push).toBeCloseTo(limit / 2, 12);
  });

  it('a push exactly at the limit is left alone; one over it is cut', async () => {
    const at = setup({ limit: MOMENT_PUSH.reveal * CAMERA_PRESETS.calm.push });
    await at.moments.revealBoss('bahamut', 'Bahamut');
    expect(pushOf(camCalls(at.stage))).toBeCloseTo(MOMENT_PUSH.reveal, 12);
    const over = setup({ limit: MOMENT_PUSH.reveal * CAMERA_PRESETS.calm.push - 0.01 });
    await over.moments.revealBoss('bahamut', 'Bahamut');
    expect(pushOf(camCalls(over.stage))).toBeLessThan(MOMENT_PUSH.reveal);
  });

  it('follows the camera preset: the camera that applies the whole push (`current`) is measured at the whole push', async () => {
    setCameraPreset('current');
    expect(cameraPresetFor('ffx2').push).toBe(1);
    const { moments, asked } = setup({ limit: 0.05 });
    await moments.revealBoss('bahamut', 'Bahamut');
    const q = asked.find((a) => /~1000$/.test(a.rig) && a.push > 0)!;
    expect(q.push).toBeCloseTo(MOMENT_PUSH.reveal, 12);
  });

  it('frames only the girls still standing (a KO\'d girl is not framed for)', async () => {
    const { stage, moments, asked } = setup({ limit: 0.0166 });
    stage.actors.get('rikku')!.setPose('ko');
    await moments.revealBoss('bahamut', 'Bahamut');
    expect(asked.find((a) => /~500$/.test(a.rig) && a.push > 0)!.n).toBe(2);
  });
});

describe('FFX-2 desktop only, and the opening is as long as it was', () => {
  it('FFX plays the reveal as it always did, the phone keeps its refitted master, and a camera that cannot measure plays as asked', async () => {
    const ffx = setup({ ffx2: false, limit: 0.0166, lensCutsAbove: 0 });
    await ffx.moments.revealBoss('bahamut', 'Bahamut');
    expect(camCalls(ffx.stage)).toEqual(plainCalls);
    expect(ffx.blends).toEqual([]);
    const phone = setup({ limit: 0.0166, lensCutsAbove: 0, phone: 0.42 });
    await phone.moments.battleStart({ partyIds: ['yuna', 'rikku', 'paine'], bossId: 'bahamut', bossName: 'Bahamut' });
    expect(phone.blends).toEqual([]);
    const blind = setup({ limit: 0.0166, measure: false });
    await blind.moments.revealBoss('bahamut', 'Bahamut');
    expect(camCalls(blind.stage)).toEqual(plainCalls);
  });

  it('keeps the push time, the plate hold and the way back the constants they were, and still asks for 0.12 (only the rule that fits it to the girls is new)', () => {
    expect(MOMENT_TIMING.revealPush).toBe(1500);
    expect(MOMENT_TIMING.revealSlab).toBe(1400);
    expect(MOMENT_TIMING.returnOut).toBe(620);
    expect(MOMENT_PUSH.reveal).toBe(0.12);
  });
});
