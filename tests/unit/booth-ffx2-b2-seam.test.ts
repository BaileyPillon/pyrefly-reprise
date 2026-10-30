/**
 * THE SHIVA SEAM OF CHAPTER XI UNDER THE FOLLOWER (release 70, branch `booth-ffx2-b2`; FFX-2 only; review finding M1 of 2026-10-30). Shiva's KO fires the mid-battle script `shiva-falls`, whose first op cuts the camera to the
 * `road-links` rig, and the Road draws plate B (D-119, "O-3 A with B as the between-links shot") only while the camera stands within `ROAD_LINKS_RADIUS` of that rig. The follower camera of the treatment runs on top of whatever rig the
 * story has put the camera on; every one of its four candidates stands 1.5 to 2.7 away from the links rig, so before the fix the seam's four lines played on plate A with the camera half way to a candidate (0 of 480 frames on the rig).
 * The fix: while the camera's rig is one the chapter's script cut to for a position-gated shot (`ProAutoStage.SCRIPTED_RIGS`), the follower is the rig's own at once (`FollowerHost.scripted`).
 *
 * Run the way the review ran it: the real `ProFollower` on the real Road members, then the real `ProDirector` on the real `ProLayer` (the harness of `engine/procam-director.test.ts`), and the scene's own `onLinksShot`.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TREATED_CHAPTERS, setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { SCRIPTED_RIGS, autoCameraFor, scriptedShot } from '../../src/engine/procam/ProAutoStage.ts';
import { resetProCamForTests } from '../../src/engine/procam/ProCamSwitch.ts';
import { ProDirector } from '../../src/engine/procam/ProDirector.ts';
import { ProFollower, type Member } from '../../src/engine/procam/ProFollower.ts';
import { ProLayer } from '../../src/engine/procam/ProLayer.ts';
import { setCameraPreset } from '../../src/engine/CameraPreset.ts';
import type { Pose } from '../../src/engine/procam/ProTypes.ts';
import type { ActorHandle, BattleStage, CameraPort } from '../../src/engine/BattlePresenterPorts.ts';
import { ROAD_FIGURE_HEIGHTS, ROAD_IDS, ROAD_LINKS_RIG, ROAD_PARTY_HEIGHT, ROAD_RIGS, ROAD_SPOTS, onLinksShot } from '../../src/scenes/road-to-the-farplane.ts';
import { FALLEN_AEONS_LINKS_RIG } from '../../src/story/scripts/ffx2-fallen-aeons.ts';

const CHAPTER = 'ffx2-fallen-aeons';
const DT = 1 / 60;
type V3 = [number, number, number];

/** The Road's rigs are tuples in the table (the type also allows a Vector3, which this scene does not use). */
const poseOf = (r: { position: unknown; lookAt: unknown; fov?: number | undefined }): Pose => ({ pos: [...(r.position as readonly number[])] as V3, look: [...(r.lookAt as readonly number[])] as V3, fov: r.fov ?? 32, roll: 0 });
const IDLE = poseOf(ROAD_RIGS.idle);
const LINKS = poseOf(ROAD_RIGS[ROAD_LINKS_RIG]!);
const dist = (a: readonly number[], b: readonly number[]): number => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
const onRig = (p: Pose): boolean => onLinksShot({ x: p.pos[0], y: p.pos[1], z: p.pos[2] });

/** The Road's first link as the stage stands it: the three girls on the held slots and Shiva on the boss spot. */
const PARTY: Array<[number, number]> = [[-2.48, 1.45], [-1.44, 0.1], [-0.33, -1.3]];
const SHIVA = ROAD_SPOTS[ROAD_IDS.shiva]!;
const MEMBERS: Member[] = [
  ...PARTY.map(([x, z], i) => ({ id: `girl${i}`, feet: [x, 0, z] as V3, height: ROAD_PARTY_HEIGHT })),
  { id: 'shiva', feet: [SHIVA[0], SHIVA[1], SHIVA[2]] as V3, height: ROAD_FIGURE_HEIGHTS[ROAD_IDS.shiva]! },
];

describe('the names that must agree', () => {
  it('the follower stands down on the rig the story cuts to and the scene reads (three spellings, one rig)', () => {
    expect(ROAD_LINKS_RIG).toBe(FALLEN_AEONS_LINKS_RIG);
    expect(SCRIPTED_RIGS[CHAPTER]).toEqual([ROAD_LINKS_RIG]);
    expect(scriptedShot(CHAPTER, ROAD_LINKS_RIG)).toBe(true);
    expect(scriptedShot(CHAPTER, 'idle')).toBe(false);
    expect(scriptedShot(CHAPTER, 'action')).toBe(false);
  });
  it('only Chapter XI has a scripted shot, and it is a treated FFX-2 chapter (the booth pair and Leblanc cut to nothing the scene draws by position)', () => {
    expect(Object.keys(SCRIPTED_RIGS)).toEqual([CHAPTER]);
    expect(TREATED_CHAPTERS[CHAPTER]!.game).toBe('ffx2');
    expect(scriptedShot('ffx2-bahamut', ROAD_LINKS_RIG)).toBe(false);
    expect(scriptedShot('ffx2-leblanc', ROAD_LINKS_RIG)).toBe(false);
    expect(scriptedShot(undefined, ROAD_LINKS_RIG)).toBe(false);
  });
  it('the links rig is the only rig of the Road that the scene draws a plate for', () => {
    expect(onLinksShot({ x: LINKS.pos[0], y: LINKS.pos[1], z: LINKS.pos[2] })).toBe(true);
    for (const [name, rig] of Object.entries(ROAD_RIGS)) {
      if (name === ROAD_LINKS_RIG) continue;
      const at = rig.position as readonly number[];
      expect(onLinksShot({ x: at[0]!, y: at[1]!, z: at[2]! })).toBe(false);
    }
  });
});

describe('the real follower on the Road, mid-fight, then the story cuts to the links rig', () => {
  const settle = (host: { scripted?: () => boolean }): ProFollower => {
    const f = new ProFollower({ members: () => MEMBERS, held: () => false, still: () => false, fitK: () => 1, ...host }, autoCameraFor(CHAPTER));
    for (let i = 0; i < 60 * 4; i++) f.step(DT, IDLE); // the fight so far: the weight and the glide have settled
    return f;
  };
  it('WITHOUT the stand-down (what the branch shipped): 0 of 480 frames on the rig, the camera never closer than 2 (the review\'s measure)', () => {
    const f = settle({});
    let on = 0;
    let closest = Infinity;
    for (let i = 0; i < 60 * 8; i++) {
      const p = f.step(DT, LINKS);
      closest = Math.min(closest, dist(p.pos, LINKS.pos));
      if (onRig(p)) on++;
    }
    expect(on).toBe(0);
    expect(closest).toBeGreaterThan(2);
  });
  it('WITH it: the very first frame of the cut is on the rig, and so is every frame after it (480 of 480)', () => {
    let cut = false;
    const f = settle({ scripted: () => cut });
    const before = f.step(DT, IDLE);
    expect(dist(before.pos, IDLE.pos)).toBeGreaterThan(0.5); // the follower really was off the rig
    cut = true;
    let on = 0;
    for (let i = 0; i < 60 * 8; i++) {
      const p = f.step(DT, LINKS);
      if (i === 0) expect(dist(p.pos, LINKS.pos)).toBeLessThan(1e-9); // a cut stays a cut: no 320 ms glide for the plate to pop in the middle of
      expect(p.look).toEqual(LINKS.look);
      expect(p.fov).toBe(LINKS.fov);
      if (onRig(p)) on++;
    }
    expect(on).toBe(480);
  });
  it('when the script cuts away to the idle rig the follower eases back in from there: no jump, then it moves off the rig toward a candidate', () => {
    let cut = true;
    const f = settle({ scripted: () => cut });
    for (let i = 0; i < 60 * 3; i++) f.step(DT, LINKS);
    cut = false;
    const first = f.step(DT, IDLE);
    expect(dist(first.pos, IDLE.pos)).toBeLessThan(0.1); // the script cut back to the idle rig and the follower takes it whole (a cut ends in a cut, no 1 s glide from the links shot), then eases in
    let last = first;
    for (let i = 0; i < 60 * 8; i++) last = f.step(DT, IDLE);
    expect(dist(last.pos, IDLE.pos)).toBeGreaterThan(0.5); // it follows again
    expect(f.weight).toBeGreaterThan(0.3);
  });
  it('a command menu that holds the frame while the cut is on changes nothing (the rig\'s own either way)', () => {
    let held = false;
    const f = new ProFollower({ members: () => MEMBERS, held: () => held, still: () => false, fitK: () => 1, scripted: () => true }, autoCameraFor(CHAPTER));
    for (let i = 0; i < 60; i++) f.step(DT, LINKS);
    held = true;
    for (let i = 0; i < 60; i++) expect(dist(f.step(DT, LINKS).pos, LINKS.pos)).toBeLessThan(1e-9);
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

function world(figs: Record<string, Fig>): { stage: BattleStage; camera: CameraPort & { layer: ProLayer; rigName: string }; figs: Record<string, Fig> } {
  const layer = new ProLayer();
  layer.step(0.016, IDLE, 16 / 9);
  const camera = {
    layer,
    rigName: 'idle',
    get pro() {
      return layer;
    },
    holding: false,
    rigNames: ['idle', ROAD_LINKS_RIG],
  } as unknown as CameraPort & { layer: ProLayer; rigName: string };
  const stage = {
    camera,
    actor: (id: string) => (figs[id] ? actorOf(figs[id]!) : undefined),
    sideOf: (id: string) => figs[id]?.side,
    staged: () => Object.keys(figs),
    artOf: (id: string) => id,
  } as unknown as BattleStage;
  return { stage, camera, figs };
}

const ROAD: Record<string, Fig> = {
  yuna: { side: 'party', x: PARTY[0]![0], z: PARTY[0]![1], h: ROAD_PARTY_HEIGHT },
  rikku: { side: 'party', x: PARTY[1]![0], z: PARTY[1]![1], h: ROAD_PARTY_HEIGHT },
  paine: { side: 'party', x: PARTY[2]![0], z: PARTY[2]![1], h: ROAD_PARTY_HEIGHT },
  'x2-shiva': { side: 'enemy', x: SHIVA[0], z: SHIVA[2], h: ROAD_FIGURE_HEIGHTS[ROAD_IDS.shiva]! },
};

describe('the real director and layer in Chapter XI', () => {
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
  it('the follower is installed and follows in the fight (the treatment is on in Chapter XI)', () => {
    const w = world(ROAD);
    turn(w);
    const p = run(w.camera.layer, 60 * 6, IDLE);
    expect(dist(p.pos, IDLE.pos)).toBeGreaterThan(0.5);
    expect(onRig(p)).toBe(false);
  });
  it('Shiva falls, the story cuts to `road-links`: the layer draws the rig itself from the first frame on, so plate B shows (480 of 480)', () => {
    const w = world(ROAD);
    turn(w);
    run(w.camera.layer, 60 * 6, IDLE); // the fight
    w.camera.rigName = ROAD_LINKS_RIG; // `camera('road-links', 0)`
    let on = 0;
    for (let i = 0; i < 60 * 8; i++) {
      const p = w.camera.layer.step(DT, LINKS, 16 / 9)?.pose;
      if (p && onRig(p)) on++;
    }
    expect(on).toBe(480);
  });
  it('the seam ends (`camera(\'idle\', 0)`): the follower comes back without a jump', () => {
    const w = world(ROAD);
    turn(w);
    run(w.camera.layer, 60 * 6, IDLE);
    w.camera.rigName = ROAD_LINKS_RIG;
    run(w.camera.layer, 60 * 6, LINKS);
    w.camera.rigName = 'idle';
    const first = w.camera.layer.step(DT, IDLE, 16 / 9)!.pose;
    expect(dist(first.pos, IDLE.pos)).toBeLessThan(0.1); // a cut back is a cut back
    const later = run(w.camera.layer, 60 * 8, IDLE);
    expect(dist(later.pos, IDLE.pos)).toBeGreaterThan(0.5);
  });
  it('Chapter IV is not affected: its follower runs on a rig of the same name (the table is per chapter)', () => {
    setDemoChapter('ffx2-bahamut');
    const w = world({ ...ROAD, 'x2-shiva': { ...ROAD['x2-shiva']!, h: 3.5 } });
    turn(w);
    run(w.camera.layer, 60 * 6, IDLE);
    w.camera.rigName = ROAD_LINKS_RIG;
    const p = run(w.camera.layer, 60 * 6, LINKS);
    expect(onRig(p)).toBe(false);
  });
});
