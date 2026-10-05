/**
 * Round 21, PR-0364 (FFX-2 only: only FFX-2 has a run-in, `research/ffx2-combat-core.md` section 1): the run-in's truck stays on through the
 * action's first-hit cut, which puts the camera on another rig, and a girl who holds the frame on the shot she runs on lost it there (Chapters
 * IV and XIII, 1600x900: Yuna's left edge at -12 and -3 px at the blow, the rest rig 90 px further right). `fitTruck` now judges each girl on the
 * rig the first hit may cut to as well (`RunWorld.cuts`), `StageMotion.rect` can look through a named rig, `cutRigsOf` names the rigs the
 * way `BattleMoments.impact` and the A-1 framing rule choose among them (the pick is made at the blow and was measured landing on
 * `action~calm` in one run and `idle` in the next, so each rig the rule could pick is named), and `PresetCamera.shotRig` gives the comfort
 * preset's version of a rig.
 */
import { describe, expect, it } from 'vitest';
import { Group, PerspectiveCamera, Scene, Vector3 } from 'three';
import type { BattleStage, CameraPort } from '../../src/engine/BattlePresenterPorts.ts';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { CAMERA_PRESETS, PresetCamera, type RigCamera } from '../../src/engine/CameraPreset.ts';
import { cutRigsOf } from '../../src/engine/motion/CutRig.ts';
import { StageMotion } from '../../src/engine/motion/StageMotion.ts';
import { fitTruck, KEEP_MARGIN, TRUCK, type RunWorld } from '../../src/engine/motion/StandOff.ts';
import type { PaintedSpan, Rect, Spot } from '../../src/engine/motion/StageMotionPort.ts';

const VIEW = { w: 1600, h: 900 };
const CAM = { x: 0.5, y: 2.3, z: 8.2, f: 1100 };
const ZERO: Spot = { x: 0, y: 0, z: 0 };
/** The rig a cut goes to stands this far to the right of the one she runs on, world units: everyone stands further left in its frame. */
const CUT_SHIFT = 0.55;

function project(p: Spot, truck: Spot, shift: number): { x: number; y: number } {
  const k = CAM.f / (CAM.z + truck.z - p.z);
  return { x: VIEW.w / 2 + (p.x - (CAM.x + shift + truck.x)) * k, y: VIEW.h * 0.5 + (CAM.y + truck.y - p.y) * k };
}
function boxRect(at: Spot, truck: Spot, shift = 0): Rect {
  const a = project({ x: at.x - 0.45, y: at.y + 1.8, z: at.z }, truck, shift);
  const b = project({ x: at.x + 0.45, y: at.y, z: at.z }, truck, shift);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}
const girlSpan = (at: Spot): PaintedSpan => ({ x0: at.x - 0.45, x1: at.x + 0.45, y0: 0, y1: 1.8, z: at.z });
const HOME: Spot = { x: -0.75, y: 0, z: -1.5 };
const BOSS: PaintedSpan = { x0: -0.9, x1: 3.9, y0: 0, y1: 6, z: -5.8 };

function world(mates: Spot[], o: { cuts?: string[] } = {}): RunWorld {
  return {
    home: HOME,
    girl: girlSpan(HOME),
    target: BOSS,
    rectOf: (at, truck) => boxRect(at, truck),
    targetRect: (truck) => {
      const a = project({ x: BOSS.x0, y: BOSS.y1, z: BOSS.z }, truck, 0);
      const b = project({ x: BOSS.x1, y: BOSS.y0, z: BOSS.z }, truck, 0);
      return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
    },
    others: mates.map((m) => ({ z: m.z, rect: (truck: Spot) => boxRect(m, truck) })),
    keep: mates.map((m) => ({ rect: (truck: Spot, rig?: string) => boxRect(m, truck, rig === 'action~calm' ? CUT_SHIFT : 0) })),
    ...(o.cuts ? { cuts: o.cuts } : {}),
    view: VIEW,
  };
}

function mateAtLeft(leftPx: number): Spot {
  const z = 0.1;
  const k = CAM.f / (CAM.z - z);
  return { x: (leftPx - VIEW.w / 2) / k + 0.45 + CAM.x, y: 0, z };
}

describe('the run-in truck holds the girls on the rig the first hit cuts to (PR-0364)', () => {
  const dx = 3; // the whole follow is 1.5 units, about 245 px of camera slide
  const steps = [1, 0.8, 0.6, 0.4, 0.25, 0.12, 0];
  const fraction = (t: Spot): number => t.x / (dx * TRUCK.follow);
  const CUT = ['action~calm'];

  it('is the answer it was when no cut is given: the shot she runs on alone', () => {
    const mate = mateAtLeft(210);
    expect(fitTruck(world([mate]), dx)).toEqual(fitTruck(world([mate], { cuts: [] }), dx));
  });

  it("cuts the follow back further when the cut's rig stands the girl nearer the edge than her own shot does", () => {
    const mate = mateAtLeft(210); // 210 px from the edge on her own shot: room for a good part of the follow
    const alone = fitTruck(world([mate]), dx);
    const withCut = fitTruck(world([mate], { cuts: CUT }), dx);
    expect(fraction(alone)).toBeGreaterThan(0.4); // she keeps the frame well on her own shot
    expect(fraction(withCut)).toBeLessThan(fraction(alone)); // the cut costs follow
    expect(steps.some((s) => Math.abs(s - fraction(withCut)) < 1e-9)).toBe(true); // still one of the steps
    // under the cut she holds the frame: no more cropped than at rest there, or the margin
    const onCut = boxRect(mate, withCut, CUT_SHIFT);
    expect(onCut.x).toBeGreaterThanOrEqual(Math.min(boxRect(mate, ZERO, CUT_SHIFT).x, VIEW.w * KEEP_MARGIN) - 0.5);
    // and the next larger step would have cropped her there
    const next = steps[steps.findIndex((s) => Math.abs(s - fraction(withCut)) < 1e-9) - 1];
    if (next !== undefined) {
      const bigger = boxRect(mate, { x: dx * TRUCK.follow * next, y: TRUCK.lift * next, z: 0 }, CUT_SHIFT);
      expect(bigger.x).toBeLessThan(Math.min(boxRect(mate, ZERO, CUT_SHIFT).x, VIEW.w * KEEP_MARGIN) - 0.5);
    }
  });

  it('holds the camera still when the cut would crop a girl at any follow at all', () => {
    expect(fitTruck(world([mateAtLeft(40)], { cuts: CUT }), dx)).toEqual(ZERO);
  });

  it('does not charge a girl who is already cropped on the cut at rest more than that (never worse than at rest)', () => {
    const mate = mateAtLeft(30); // on the cut she is 30 - 90 px outside the frame already
    const t = fitTruck(world([mate], { cuts: CUT }), dx);
    expect(boxRect(mate, t, CUT_SHIFT).x).toBeGreaterThanOrEqual(boxRect(mate, ZERO, CUT_SHIFT).x - 0.5);
  });
});

describe('the margin is the sway and as much again (PR-0364)', () => {
  it('is 3 % of the frame: the idle sway moves a girl at the edge about 30 px at 1600 wide', () => {
    expect(KEEP_MARGIN).toBeCloseTo(0.03, 9);
    expect(VIEW.w * KEEP_MARGIN).toBeGreaterThanOrEqual(2 * 24);
  });
});

/** A stage with three girls and a foe, and a camera whose frame check says which rigs keep the girls it is asked about on screen. */
function fakeStage(): { stage: BattleStage; actors: Record<string, { id: string }> } {
  const ids = ['yuna', 'rikku', 'paine', 'bahamut'];
  const actors = Object.fromEntries(ids.map((id) => [id, { id }]));
  const stage = {
    staged: () => ids,
    sideOf: (id: string) => (id === 'bahamut' ? 'enemy' : 'party'),
    actor: (id: string) => actors[id],
  } as unknown as BattleStage;
  return { stage, actors };
}
function fakeCam(names: string[], fits: Record<string, boolean>, asked: Array<{ rig: string; actors: unknown[] }> = []): CameraPort {
  return {
    rigNames: names,
    rigName: 'party',
    frame: (rig: string, _push: number, subjects: Array<{ actor: unknown }>) => {
      asked.push({ rig, actors: subjects.map((s) => s.actor) });
      return { fits: fits[rig] ?? true, push: 0, worst: 1 };
    },
  } as unknown as CameraPort;
}

describe('cutRigsOf: the rigs the first hit may cut to (BattleMoments.rigFor and the A-1 rule)', () => {
  const names = ['idle', 'action', 'party', 'enemy', 'victory'];

  it('is every rig the rule may pick, in its order, ending on the master it falls back to', () => {
    const { stage } = fakeStage();
    expect(cutRigsOf(stage, fakeCam(names, {}), 'paine')).toEqual(['enemy', 'action', 'idle']);
  });
  it('leaves out a rig that does not keep the other girls on screen: the rule never picks it', () => {
    const { stage } = fakeStage();
    expect(cutRigsOf(stage, fakeCam(names, { enemy: false }), 'paine')).toEqual(['action', 'idle']);
    expect(cutRigsOf(stage, fakeCam(names, { enemy: false, action: false }), 'paine')).toEqual(['idle']);
  });
  it("does not ask about the girl who is running: she is out of her place at the blow", () => {
    const { stage, actors } = fakeStage();
    const asked: Array<{ rig: string; actors: unknown[] }> = [];
    cutRigsOf(stage, fakeCam(names, {}, asked), 'paine');
    expect(asked.length).toBeGreaterThan(0);
    for (const a of asked) {
      expect(a.actors).toContain(actors['yuna']);
      expect(a.actors).toContain(actors['rikku']);
      expect(a.actors).not.toContain(actors['paine']); // the runner
      expect(a.actors).not.toContain(actors['bahamut']); // and the foe is the rule's own business, not the girls' frame
    }
  });
  it('without an enemy rig it starts from action, then idle (rigFor); with no rig at all there is nothing to name', () => {
    const { stage } = fakeStage();
    expect(cutRigsOf(stage, fakeCam(['idle', 'action', 'party'], {}), 'paine')).toEqual(['action', 'idle']);
    expect(cutRigsOf(stage, fakeCam(['idle'], {}), 'paine')).toEqual(['idle']);
    expect(cutRigsOf(stage, fakeCam([], {}), 'paine')).toEqual([]);
  });
  it('a camera that cannot measure (no frame check) leaves every rig possible', () => {
    const { stage } = fakeStage();
    const cam = { rigNames: names, rigName: 'party' } as unknown as CameraPort;
    expect(cutRigsOf(stage, cam, 'paine')).toEqual(['enemy', 'action', 'idle']);
  });
  it("names the comfort preset's version of each, once", () => {
    const { stage } = fakeStage();
    expect(cutRigsOf(stage, fakeCam(names, { enemy: false }), 'paine', (r) => (r === 'idle' ? r : `${r}~calm`))).toEqual(['action~calm', 'idle']);
    expect(cutRigsOf(stage, fakeCam(names, {}), 'paine', () => 'idle')).toEqual(['idle']); // `steady`: the master holds for every cut
  });
});

describe('PresetCamera.shotRig: the rig a cut lands on under the preset', () => {
  function inner(): RigCamera & { added: string[] } {
    const rigs: Record<string, { position: [number, number, number]; lookAt: [number, number, number]; fov?: number }> = {
      idle: { position: [0, 2.4, 9.4], lookAt: [0.2, 1.4, -1.2], fov: 32 },
      action: { position: [0.15, 2.7, 9.0], lookAt: [1.0, 1.5, -1.2], fov: 32 },
    };
    const added: string[] = [];
    return {
      added,
      rigNames: ['idle', 'action'],
      rigName: 'idle',
      getRig: (n: string) => rigs[n],
      addRig: (n: string, r: (typeof rigs)[string]) => void (added.push(n), (rigs[n] = r)),
      moveTo: () => Promise.resolve(),
      snapTo: () => undefined,
      shake: () => undefined,
      punch: () => Promise.resolve(),
    } as unknown as RigCamera & { added: string[] };
  }

  it('calm: a close rig lands on its half-way variant, built from the master; the master and unknown rigs are as they are', () => {
    const i = inner();
    const cam = new PresetCamera(i, () => CAMERA_PRESETS.calm);
    expect(cam.shotRig('action')).toBe('action~calm');
    expect(i.added).toContain('action~calm');
    expect(cam.shotRig('idle')).toBe('idle');
  });
  it('current: the rig as it is; steady: the master holds', () => {
    expect(new PresetCamera(inner(), () => CAMERA_PRESETS.current).shotRig('action')).toBe('action');
    expect(new PresetCamera(inner(), () => CAMERA_PRESETS.steady).shotRig('action')).toBe('idle');
  });
});

describe('StageMotion.rect looks through a named rig (the cut), the truck still on', () => {
  function setup() {
    const cam = new PerspectiveCamera(32, 16 / 9, 0.1, 100);
    const rigs = {
      party: { position: [0.5, 2.3, 8.2] as [number, number, number], lookAt: [-0.35, 1.4, 0.9] as [number, number, number] },
      enemy: { position: [0.8, 3.1, 7.2] as [number, number, number], lookAt: [2.0, 1.9, -2.8] as [number, number, number], fov: 32 },
    };
    const battle = new BattleCamera(cam, { rigs, initial: 'party', swayAmplitude: 0 });
    const figure = new Group();
    figure.position.set(-1, 0, 1);
    const motion = new StageMotion({
      scene: new Scene(),
      camera: battle,
      quadOf: (id, out) => {
        if (id !== 'yuna') return null;
        const c = [new Vector3(-0.45, 0, 0), new Vector3(0.45, 0, 0), new Vector3(0.45, 1.8, 0), new Vector3(-0.45, 1.8, 0)];
        c.forEach((v, i) => out[i]!.copy(v).add(figure.position));
        return out;
      },
      figure: (id) => (id === 'yuna' ? figure : undefined),
      view: () => ({ w: 1600, h: 900 }),
      cutRigs: (r) => (r === 'paine' ? ['enemy'] : []),
      lowEffects: () => true,
    });
    return { battle, motion };
  }

  it('answers differently on another rig, and the same as the rest camera on the rig it is on', () => {
    const { battle, motion } = setup();
    battle.update(0);
    const rest = motion.rect('yuna')!;
    const onParty = motion.rect('yuna', { rig: 'party' })!;
    const onEnemy = motion.rect('yuna', { rig: 'enemy' })!;
    expect(onParty.x).toBeCloseTo(rest.x, 3);
    expect(onParty.w).toBeCloseTo(rest.w, 3);
    expect(Math.abs(onEnemy.x - rest.x)).toBeGreaterThan(40); // another place in the frame
  });

  it('slides the truck on top of the rig, and keeps the dolly the shot holds', async () => {
    const { battle, motion } = setup();
    battle.update(0);
    const flat = motion.rect('yuna', { rig: 'enemy' })!;
    const slid = motion.rect('yuna', { rig: 'enemy', truck: { x: 0.8, y: 0, z: 0 } })!;
    expect(slid.x).toBeLessThan(flat.x - 50); // the camera moved right: she moves left in the frame, on the cut as on the run's shot
    void battle.push(0.2, 1);
    const pushed = motion.rect('yuna', { rig: 'enemy' })!;
    expect(Math.abs(flat.w - pushed.w)).toBeGreaterThan(0.5); // the held dolly changes her size on the cut too
  });

  it('reads the rest camera for a rig it does not know, and names the cuts the stage gives it', () => {
    const { battle, motion } = setup();
    battle.update(0);
    expect(motion.rect('yuna', { rig: 'nowhere' })).toEqual(motion.rect('yuna'));
    expect(motion.cutRigs('paine')).toEqual(['enemy']);
    expect(motion.cutRigs('yuna')).toEqual([]);
  });
});
