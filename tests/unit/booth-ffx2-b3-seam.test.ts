/**
 * THE KILL LINK OF CHAPTER XIII UNDER THE FOLLOWER (release 71, branch `booth-ffx2-b3`; FFX-2 only; defect class 2 of the booth treatment: a story script cutting the camera to a rig while the follower runs on top). Paragon's KO fires the mid-battle script `paragon-falls`,
 * whose first op moves the camera to the `trema-link` rig (`camera(TREMA_LINK_RIG, 700)`), and the Cloister scene starts the old man's entrance and Paragon's breaking apart only while the camera stands within `LINK_CAMERA_NEAR` (1.2) of that rig's position
 * (`scenes/cloister-100-link.ts`: the probe is the first frame rendered there). The follower camera of the treatment runs on top of whatever rig the story has put the camera on and, blended halfway to its candidates, keeps off that rig by a margin that depends on WHICH of its four candidates it stands on (review m2): candidates 0, 1 and 2 stay 1.4 or more away (no frame within 1.2), but candidate 3 comes within 0.52 on today's rig (all 480 frames) and within 1.08 under Paragon's giants frame,
 * so without the stand-down the beat starts or not by the luck of the candidate (about one fight in four), and in the other three the seam's ten lines play over a standing Paragon and no old man (the Road's M1 of batch 2, the same class). The stand-down is `ProAutoStage.SCRIPTED_RIGS['ffx2-trema']`.
 *
 * Run the way batch 2's review ran the Road's: the real `ProFollower` on the real Cloister members, then the real `ProDirector` on the real `ProLayer`.
 *
 * **The camera piece is HELD in Chapter XIII today** (`DemoGate.PIECE_HOLDS`, `cam`: the follower undoes Paragon's approved giants frame, `booth-ffx2-b3-rows.test.ts`), so the director's follower is the rig's own pose and the beat starts on any cut; the stand-down is the row that
 * waits for the hold's lift, proved here at the follower (which the lift would run): the first two sections and the follower tests below.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isTreatedChapter, setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { SCRIPTED_RIGS, autoCameraFor, scriptedShot } from '../../src/engine/procam/ProAutoStage.ts';
import { resetProCamForTests } from '../../src/engine/procam/ProCamSwitch.ts';
import { ProDirector } from '../../src/engine/procam/ProDirector.ts';
import { ProFollower, type Member } from '../../src/engine/procam/ProFollower.ts';
import { ProLayer } from '../../src/engine/procam/ProLayer.ts';
import { setCameraPreset } from '../../src/engine/CameraPreset.ts';
import type { Pose } from '../../src/engine/procam/ProTypes.ts';
import type { ActorHandle, BattleStage, CameraPort } from '../../src/engine/BattlePresenterPorts.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { GIANT_ROWS } from '../../src/engine/fx/mix/giants.ts';
import { CLOISTER_100_RIGS, CLOISTER_100_SLOTS, CLOISTER_ACTOR_HEIGHTS, CLOISTER_BOSS_SPOT } from '../../src/scenes/cloister-100.ts';
import { CLOISTER_LINK_RIG, CLOISTER_WIDE_RIGS } from '../../src/scenes/cloister-100-rigs.ts';
import { LINK_CAMERA_NEAR } from '../../src/scenes/cloister-100-link.ts';
import { TREMA_LINK_RIG } from '../../src/story/scripts/ffx2-trema.ts';
import { stillListed } from './booth-r70-withdrawn.ts';

const CHAPTER = 'ffx2-trema';
const DT = 1 / 60;
type V3 = [number, number, number];

const poseOf = (r: { position: unknown; lookAt: unknown; fov?: number | undefined }): Pose => ({ pos: [...(r.position as readonly number[])] as V3, look: [...(r.lookAt as readonly number[])] as V3, fov: r.fov ?? 32, roll: 0 });
const IDLE = poseOf(CLOISTER_WIDE_RIGS['idle']!);
const LINK = poseOf(CLOISTER_WIDE_RIGS[CLOISTER_LINK_RIG]!);
const giantView = GIANT_ROWS.find((r) => r.id === 'paragon')!.views[0]!;
const GIANT: Pose = { pos: [...giantView.pos] as V3, look: [...giantView.look] as V3, fov: giantView.fov, roll: 0 };
const dist = (a: readonly number[], b: readonly number[]): number => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
/** The scene's own probe: is the camera on the link rig for the beat? */
const onRig = (p: Pose): boolean => dist(p.pos, LINK.pos) < LINK_CAMERA_NEAR;
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({ pos: a.pos.map((v, i) => v + (b.pos[i]! - v) * t) as V3, look: a.look.map((v, i) => v + (b.look[i]! - v) * t) as V3, fov: a.fov + (b.fov - a.fov) * t, roll: 0 });

const GIRLS: Array<[number, number]> = CLOISTER_100_SLOTS.party.map((s) => [s[0], s[2]]);
const HEIGHT = CLOISTER_ACTOR_HEIGHTS.party;
/** Link 1 as the stage stands it: the girls on the party slots and Paragon on the boss spot, drawn at 3.1 (a wide window) or at his giants height. */
const members = (paragonH: number): Member[] => [
  ...GIRLS.map(([x, z], i) => ({ id: `girl${i}`, feet: [x, 0, z] as V3, height: HEIGHT })),
  { id: 'paragon', feet: [CLOISTER_BOSS_SPOT[0], 0, CLOISTER_BOSS_SPOT[2]] as V3, height: paragonH },
];

describe('the names that must agree', () => {
  it('the follower stands down on the rig the story cuts to and the scene reads (three spellings, one rig)', () => {
    expect(TREMA_LINK_RIG).toBe(CLOISTER_LINK_RIG);
    expect(SCRIPTED_RIGS[CHAPTER]).toEqual([CLOISTER_LINK_RIG]);
    expect(scriptedShot(CHAPTER, CLOISTER_LINK_RIG)).toBe(true);
    expect(scriptedShot(CHAPTER, 'idle')).toBe(false);
    expect(scriptedShot(CHAPTER, 'action')).toBe(false);
  });

  it("the story of Chapter XIII cuts to two rigs only, `idle` and the link's, and only the link's is one the scene reads by position: a new cut is a new question (is the rig position-gated?)", () => {
    const cuts = new Set<string>();
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) node.forEach(walk);
      else if (node !== null && typeof node === 'object') {
        const o = node as Record<string, unknown>;
        if (o['type'] === 'camera' && typeof o['rig'] === 'string') cuts.add(o['rig']);
        Object.values(o).forEach(walk);
      }
    };
    walk(getChapter(CHAPTER)!.scriptsRef);
    expect([...cuts].sort()).toEqual(['idle', CLOISTER_LINK_RIG]);
    for (const rig of cuts) expect(Object.keys(CLOISTER_100_RIGS), rig).toContain(rig);
  });

  it('the link rig is the one rig the scene watches by position, within 1.2; every other rig of the room stands farther than that from it', () => {
    expect(LINK_CAMERA_NEAR).toBe(1.2);
    expect(onRig(LINK)).toBe(true);
    for (const [name, rig] of Object.entries(CLOISTER_WIDE_RIGS)) {
      if (name === CLOISTER_LINK_RIG) continue;
      expect(onRig(poseOf(rig)), name).toBe(false);
    }
    expect(scriptedShot('ffx2-bahamut', CLOISTER_LINK_RIG)).toBe(false); // the table is per chapter: Chapter IV has a rig of no such name, and none of this
    expect(scriptedShot('ffx2-fallen-aeons', CLOISTER_LINK_RIG)).toBe(false);
  });
});

describe('the real follower on the Cloister, mid-fight, then the story cuts to the link rig', () => {
  /**
   * The follower mid-fight on candidate `candidate` (review m2: the first version of this test only ever saw candidate 0, which `effectEnd` never advances; the follower re-picks the next-ranked angle at every second effect end, `REPICK_EVERY`, so two `effectEnd`s are one re-pick).
   */
  const settle = (base: Pose, paragonH: number, host: { scripted?: () => boolean }, candidate = 0): ProFollower => {
    const m = members(paragonH);
    const f = new ProFollower({ members: () => m, held: () => false, still: () => false, fitK: () => 1, ...host }, autoCameraFor(CHAPTER));
    for (let k = 0; k < candidate * 2; k++) f.effectEnd();
    expect(f.candidate).toBe(candidate);
    for (let i = 0; i < 60 * 4; i++) f.step(DT, base); // the fight so far: the weight and the glide have settled
    return f;
  };
  const CASES = [
    ["today's rig, Paragon drawn 3.1 (a window wider than 1.79)", IDLE, 3.1, 'today'],
    ['the giants frame, Paragon at his real height (a window up to 1.79)', GIANT, 9.447, 'giants'],
  ] as const;
  const CANDIDATES = [0, 1, 2, 3] as const;
  /** Every case under every candidate: [label, candidate, base, Paragon's height, case key]. */
  const GRID = CASES.flatMap(([name, base, h, key]) => CANDIDATES.map((c) => [name, c, base, h, key] as const));
  /** Offline read, 8 s on the link rig's cut with no stand-down, per candidate: [the closest the eye comes to the rig, frames of 480 within 1.2]. Measured here (the review's own run agreed on today's rig and on every candidate but the giants frame's 3, 436 against 352 frames, by a different settle). */
  const WITHOUT: Record<'today' | 'giants', ReadonlyArray<readonly [number, number]>> = {
    today: [[2.18, 0], [1.88, 0], [1.43, 0], [0.52, 480]],
    giants: [[2.58, 0], [1.96, 0], [2.12, 0], [1.08, 352]],
  };

  it.each(GRID)(
    "WITHOUT the stand-down (what the branch would ship): %s, candidate %d: the eye comes no nearer than the number measured, and the beat's frames are the number measured",
    (_name, candidate, base, h, key) => {
      const f = settle(base, h, {}, candidate);
      let on = 0;
      let closest = Infinity;
      for (let i = 0; i < 60 * 8; i++) {
        const p = f.step(DT, LINK);
        closest = Math.min(closest, dist(p.pos, LINK.pos));
        if (onRig(p)) on++;
      }
      const [near, frames] = WITHOUT[key][candidate]!;
      expect(closest).toBeGreaterThan(near - 0.06);
      expect(closest).toBeLessThan(near + 0.06);
      expect(on === 0, `${frames} frames expected, ${on} seen`).toBe(frames === 0);
      if (frames > 0) expect(Math.abs(on - frames)).toBeLessThanOrEqual(frames === 480 ? 0 : 40);
    },
  );

  it('WITHOUT the stand-down the beat starts in one candidate of four and in no other: the stand-down is needed, and it is no mere guard against a theoretical case (review m2)', () => {
    for (const [name, base, h] of CASES) {
      const startsOn = CANDIDATES.filter((c) => {
        const f = settle(base, h, {}, c);
        let on = 0;
        for (let i = 0; i < 60 * 8; i++) if (onRig(f.step(DT, LINK))) on++;
        return on > 0;
      });
      expect(startsOn, name).toEqual([3]);
    }
  });

  it.each(GRID)('WITH it: %s, candidate %d: the very first frame of the cut is on the rig, and so is every frame after it (480 of 480)', (_name, candidate, base, h) => {
    let cut = false;
    const f = settle(base, h, { scripted: () => cut }, candidate);
    const before = f.step(DT, base);
    expect(dist(before.pos, base.pos)).toBeGreaterThan(0.3); // the follower really was off the rig
    cut = true;
    let on = 0;
    for (let i = 0; i < 60 * 8; i++) {
      const p = f.step(DT, LINK);
      if (i === 0) expect(dist(p.pos, LINK.pos)).toBeLessThan(1e-9);
      expect(p.look).toEqual(LINK.look);
      expect(p.fov).toBe(LINK.fov);
      if (onRig(p)) on++;
    }
    expect(on).toBe(480);
  });

  it('the story\'s own move is a 700 ms glide (`camera(TREMA_LINK_RIG, 700)`), not a cut: the layer hands the glide through (the follower adds nothing to it) and the beat starts the frame the glide gets within 1.2', () => {
    let cut = false;
    const f = settle(IDLE, 3.1, { scripted: () => cut });
    cut = true; // the camera's rig name is the link's from the first frame of the move
    let first = -1;
    for (let i = 0; i < 60; i++) {
      const base = lerpPose(IDLE, LINK, Math.min(1, i / 42)); // 700 ms at 60 Hz
      const p = f.step(DT, base);
      expect(dist(p.pos, base.pos), `frame ${i}`).toBeLessThan(1e-9); // exactly the glide
      if (first < 0 && onRig(p)) first = i;
    }
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThanOrEqual(42); // inside the glide, at the latest on its last frame
  });

  it('when the script cuts back to the idle rig (`camera(\'idle\', 700)`) the follower eases in from there: no jump, then it moves off the rig toward a candidate', () => {
    let cut = true;
    const f = settle(IDLE, 3.1, { scripted: () => cut });
    for (let i = 0; i < 60 * 3; i++) f.step(DT, LINK);
    cut = false;
    const first = f.step(DT, LINK); // the camera's own glide back is the base; the follower takes it whole on its first free step
    expect(dist(first.pos, LINK.pos)).toBeLessThan(0.1);
    let last = first;
    for (let i = 0; i < 60 * 8; i++) last = f.step(DT, IDLE);
    expect(dist(last.pos, IDLE.pos)).toBeGreaterThan(0.3);
    expect(f.weight).toBeGreaterThan(0.3);
  });
});

// ------------------------------------------------------------------------------------------------ through the director and the layer

interface Fig {
  side: 'party' | 'enemy';
  x: number;
  z: number;
  h: number;
}
const actorOf = (f: Fig): ActorHandle =>
  ({
    get position() {
      return { x: f.x, y: 0, z: f.z };
    },
    headPoint: () => ({ x: f.x, y: f.h * 0.92, z: f.z }),
    centerPoint: () => ({ x: f.x, y: f.h * 0.52, z: f.z }),
  }) as unknown as ActorHandle;

function world(figs: Record<string, Fig>): { stage: BattleStage; camera: CameraPort & { layer: ProLayer; rigName: string } } {
  const layer = new ProLayer();
  layer.step(0.016, IDLE, 16 / 9);
  const camera = {
    layer,
    rigName: 'idle',
    get pro() {
      return layer;
    },
    holding: false,
    rigNames: ['idle', CLOISTER_LINK_RIG],
  } as unknown as CameraPort & { layer: ProLayer; rigName: string };
  const stage = {
    camera,
    actor: (id: string) => (figs[id] ? actorOf(figs[id]!) : undefined),
    sideOf: (id: string) => figs[id]?.side,
    staged: () => Object.keys(figs),
    artOf: (id: string) => id,
  } as unknown as BattleStage;
  return { stage, camera };
}

const CLOISTER: Record<string, Fig> = {
  yuna: { side: 'party', x: GIRLS[0]![0], z: GIRLS[0]![1], h: HEIGHT },
  rikku: { side: 'party', x: GIRLS[1]![0], z: GIRLS[1]![1], h: HEIGHT },
  paine: { side: 'party', x: GIRLS[2]![0], z: GIRLS[2]![1], h: HEIGHT },
  paragon: { side: 'enemy', x: CLOISTER_BOSS_SPOT[0], z: CLOISTER_BOSS_SPOT[2], h: 3.1 },
};

describe('the real director and layer in Chapter XIII', () => {
  beforeEach(() => {
    resetProCamForTests('?pack=demo');
    setCameraPreset('calm');
    setTreatedScope('all');
    setDemoChapter(CHAPTER);
  });
  afterEach(() => {
    resetProCamForTests();
    setDemoChapter(undefined);
    setTreatedScope(null);
    setCameraPreset('calm');
  });
  const run = (l: ProLayer, n: number, base: Pose): Pose => {
    let p = base;
    for (let i = 0; i < n; i++) p = l.step(DT, base, 16 / 9)?.pose ?? base;
    return p;
  };
  const turn = (w: ReturnType<typeof world>): void => {
    new ProDirector(w.stage).turnStart?.({ camera: w.camera, speed: 'normal', skipping: false, ms: (b: number) => b, reducedMotion: false, actor: { id: 'yuna', side: 'party' } } as never);
    w.camera.layer.setBoxes(() => null);
  };

  it('the camera piece is held in Chapter XIII (Paragon\'s approved giants frame stays): the director installs no follower, the layer answers nothing and the camera is the rig\'s own in every frame of the fight', () => {
    expect(isTreatedChapter(CHAPTER, 'cam')).toBe(false);
    expect(isTreatedChapter(CHAPTER, 'hud')).toBe(true);
    const w = world(CLOISTER);
    turn(w);
    for (let i = 0; i < 60 * 6; i++) expect(w.camera.layer.step(DT, IDLE, 16 / 9), `frame ${i}`).toBeNull();
  });

  it('Paragon falls, the story moves the camera to `trema-link`: the layer draws the rig itself from the first frame on, so the beat starts (480 of 480; held today, stood down after the lift)', () => {
    const w = world(CLOISTER);
    turn(w);
    run(w.camera.layer, 60 * 6, IDLE); // the fight
    w.camera.rigName = CLOISTER_LINK_RIG; // `camera('trema-link', ...)`
    let on = 0;
    for (let i = 0; i < 60 * 8; i++) {
      const p = w.camera.layer.step(DT, LINK, 16 / 9)?.pose ?? LINK; // no answer = the camera's own pose, which is the rig
      if (onRig(p)) on++;
    }
    expect(on).toBe(480);
  });

  it("the seam ends (`camera('idle', ...)`): the layer takes the rig whole, without a jump (the follower stays the rig's own while the camera is held)", () => {
    const w = world(CLOISTER);
    turn(w);
    run(w.camera.layer, 60 * 6, IDLE);
    w.camera.rigName = CLOISTER_LINK_RIG;
    run(w.camera.layer, 60 * 6, LINK);
    w.camera.rigName = 'idle';
    const first = w.camera.layer.step(DT, LINK, 16 / 9)?.pose ?? LINK;
    expect(dist(first.pos, LINK.pos)).toBeLessThan(0.1); // the base's own glide is taken whole
    const later = run(w.camera.layer, 60 * 8, IDLE);
    expect(dist(later.pos, IDLE.pos)).toBeLessThan(1e-9); // held: no follower to ease in (the follower-level test above proves the ease for the lift)
  });

  it("Chapter IV and the Road are not affected: a follower there runs on a rig of the same name (the table is per chapter)", () => {
    // The Road (Chapter XI) is treated again (booth-ffx2-b4-sky) but holds the camera, so no follower is installed there and this case cannot read it; it reads the Road the day the `cam` hold lifts (the filter), and Chapter IV now.
    for (const other of stillListed(['ffx2-bahamut', 'ffx2-fallen-aeons']).filter((id) => treatedHold(id, 'cam') === undefined)) {
      setDemoChapter(other);
      const w = world(CLOISTER);
      turn(w);
      run(w.camera.layer, 60 * 6, IDLE);
      w.camera.rigName = CLOISTER_LINK_RIG;
      const p = run(w.camera.layer, 60 * 6, LINK);
      expect(onRig(p), other).toBe(false);
    }
  });
});
