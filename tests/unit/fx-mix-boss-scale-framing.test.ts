import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { Framing } from '../../src/engine/fx/mix/framing.ts';
import { cameraAt, figBox, figOf, type Actor } from '../../src/engine/fx/mix/geometry.ts';
import { forgetMenuPanels, noteMenuPanels } from '../../src/engine/fx/mix/hudPanels.ts';

/**
 * r392-boss-scale, through `Framing` itself: the figures, the idle rig and a document stand in for the scene and the HUD, and the plan runs as it does in
 * the game (a plan on a calm frame, put on screen once no menu is open, a live check that asks for another, the panels of each menu remembered).
 * Each "menu state" is the panels that menu shows (the command list is taller for the member with more commands), the member who leans for it, and a
 * re-plan asked for, as the live check at a menu's opening asks for one when a member is under a panel.
 */

const W = 1600;
const H = 900;

let menuUp = false;
let phone = false;
/** A document with the canvas, and one command list up while `menuUp`: what `battleCanvas()`, `menuOpen()` and `phoneBattle()` read. */
const stubDom = (): void => {
  const rect = { left: 0, top: 0, width: W, height: H, right: W, bottom: H };
  const canvas = { getBoundingClientRect: () => rect };
  const list = { hidden: false, closest: () => null, getBoundingClientRect: () => ({ width: 240, height: 160 }), querySelector: () => ({}) };
  vi.stubGlobal('document', {
    documentElement: { dataset: phone ? { phoneBattle: '1' } : {} },
    querySelector: () => canvas,
    querySelectorAll: (sel: string) => (menuUp && sel.includes('ffx-cmd-area') ? [list] : []),
  });
  vi.stubGlobal('window', { innerWidth: W, innerHeight: H, matchMedia: () => ({ matches: phone }) });
};

const actor = (name: string, facing: number, x: number, z: number, h: number): Actor => {
  const a = new Object3D() as unknown as Actor;
  a.name = name;
  (a as unknown as { facing: number }).facing = facing;
  (a as unknown as { worldHeight: number }).worldHeight = h;
  a.visible = true;
  a.position.set(x, 0, z);
  a.contentQuad = (out) => {
    const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    q[0].set(-h * 0.25, 0, 0).applyMatrix4(a.matrixWorld);
    q[1].set(h * 0.25, 0, 0).applyMatrix4(a.matrixWorld);
    q[2].set(h * 0.25, h, 0).applyMatrix4(a.matrixWorld);
    q[3].set(-h * 0.25, h, 0).applyMatrix4(a.matrixWorld);
    return q;
  };
  return a;
};

interface Rig {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}
/** The battle camera as `RigWatch` reads it: named rigs, nothing in flight, the camera resting on `idle` (a class: `RigWatch` wraps and unwraps its methods). */
class FakeBattleCamera {
  readonly camera: PerspectiveCamera;
  rigName = 'idle';
  readonly rigNames = ['idle', 'party', 'enemy', 'action'];
  pushAmount = 0;
  tweens = { size: 0 };
  private readonly rigs = new Map<string, Rig>();
  constructor(idle: Rig) {
    this.camera = new PerspectiveCamera(idle.fov, W / H);
    for (const n of this.rigNames) this.rigs.set(n, idle);
  }
  getRig(n: string): Rig | undefined {
    return this.rigs.get(n);
  }
  addRig(n: string, r: Rig): void {
    this.rigs.set(n, r);
  }
  async moveTo(): Promise<void> {}
  snapTo(): void {}
}
const fakeCamera = (idle: Rig): FakeBattleCamera => new FakeBattleCamera(idle);

const KEY = (game: string): string => `${game}|false|${W}x${H}`;
const CAVERN_IDLE: Rig = { position: [0, 5.1, 17.6], lookAt: [0.6, 1.8, 0], fov: 28 };

/** Chapter IX's stage (`scenes/cavern-stolen-fayth.ts`). */
const cavern = () => {
  const party = [actor('lulu', 1, -1.11, 4.95, 1.75), actor('kimahri', 1, -0.2, 4.45, 1.75), actor('yuna', 1, 1.18, 5.03, 1.75)];
  const yojimbo = actor('yojimbo', -1, 2.75, -2.0, 2.55);
  const daigoro = actor('daigoro', -1, 1.5, -2.1, 0.73);
  return { party, yojimbo, daigoro, actors: [...party, yojimbo, daigoro] };
};

/** The mix's frames: `n` seconds at 60 fps. */
const run = (f: Framing, actors: Actor[], seconds: number, on = true): void => {
  for (let i = 0; i < seconds * 60; i++) f.update(1 / 60, actors, on);
};

/** The boss as the screen shows it against the party's mean, from today's rig. */
const ratio = (actors: readonly Actor[], boss: Actor, pose: { pos: Vector3; look: Vector3; fov: number }): number => {
  const cam = cameraAt(pose, W / H);
  const h = (a: Actor): number => {
    const b = figBox(figOf(a), cam, W, H);
    return b.b - b.t;
  };
  const party = actors.filter((a) => a.facing >= 0);
  return h(boss) / (party.reduce((s, a) => s + h(a), 0) / party.length);
};

beforeEach(() => {
  menuUp = false;
  phone = false;
  forgetMenuPanels();
  stubDom();
});
afterEach(() => vi.unstubAllGlobals());

const planned = (f: Framing): number => f.report.plans;
/** Ask for another plan the way a live check at a menu's opening does, then let it decide and land. */
const replan = (f: Framing, actors: Actor[]): void => {
  const before = planned(f);
  (f as unknown as { planWanted: boolean }).planWanted = true;
  run(f, actors, 2);
  expect(planned(f)).toBeGreaterThan(before);
};

describe('Yojimbo through Framing (FFX Chapter IX, desktop)', () => {
  it('is sized as soon as his figures stand still, before any plan lands, and the plan that lands keeps the size', () => {
    const s = cavern();
    const f = new Framing(fakeCamera(CAVERN_IDLE) as never, new PerspectiveCamera(28, W / H), 'ffx');
    f.update(1 / 60, s.actors, true);
    expect(planned(f)).toBe(0);
    const early = s.yojimbo.scale.y;
    expect(early).toBeGreaterThan(1.1); // the first calm frame: no plan yet
    expect(early).toBeLessThan(1.2);
    expect(s.daigoro.scale.y).toBe(1);
    expect(s.party.every((a) => a.scale.y === 1)).toBe(true);
    run(f, s.actors, 2);
    expect(planned(f)).toBe(1);
    expect(s.yojimbo.scale.y).toBeCloseTo(early, 9); // no pop when the plan lands
    expect(ratio(s.actors, s.yojimbo, f.todayPose!)).toBeCloseTo(1.15, 1);
  });

  it('keeps the size when the first menu opens before the plan lands: the plan waits for the menu to close and puts on screen the size already there', () => {
    const s = cavern();
    const f = new Framing(fakeCamera(CAVERN_IDLE) as never, new PerspectiveCamera(28, W / H), 'ffx');
    f.update(1 / 60, s.actors, true);
    const early = s.yojimbo.scale.y;
    menuUp = true;
    run(f, s.actors, 2); // the plan is decided under the open menu and waits
    expect(planned(f)).toBe(0);
    expect(s.yojimbo.scale.y).toBeCloseTo(early, 9);
    menuUp = false;
    run(f, s.actors, 1);
    expect(planned(f)).toBe(1);
    expect(s.yojimbo.scale.y).toBeCloseTo(early, 9);
  });

  it('is the same size at every menu: three menus with three command lists, three leaning members and a re-plan at each (never re-sized)', () => {
    const s = cavern();
    const f = new Framing(fakeCamera(CAVERN_IDLE) as never, new PerspectiveCamera(28, W / H), 'ffx');
    run(f, s.actors, 2);
    expect(planned(f)).toBe(1);
    const k0 = s.yojimbo.scale.y;
    // the command list grows upward with the commands (Kimahri 5, Lulu 6, Yuna 7 rows at 1600x900: it starts at y 578, 511, 445), the member leans
    const lists = [578, 511, 445].map((t) => ({ l: 75, r: 545, t, b: 836 }));
    const leans: [number, number][] = [[1, 1.0], [0, 1.0], [2, 1.0]];
    const seen: number[] = [k0];
    for (let menu = 0; menu < 3; menu++) {
      noteMenuPanels([lists[menu]!, { l: 1006, r: 1542, t: 645, b: 870 }, { l: 1385, r: 1551, t: 124, b: 501 }], KEY('ffx'));
      const [who, z] = leans[menu]!;
      s.party[who]!.position.z += z * 0.4; // she steps toward the camera for her menu
      replan(f, s.actors);
      s.party[who]!.position.z -= z * 0.4;
      seen.push(s.yojimbo.scale.y);
    }
    for (const k of seen) expect(k).toBeCloseTo(k0, 9);
    expect(planned(f)).toBeGreaterThanOrEqual(4);
  });

  it('plays no growth on the upright phone (it keeps today\'s rig and its own fit) and none with CHAPTER FRAMING off', () => {
    phone = true;
    stubDom();
    const p = cavern();
    const onPhone = new Framing(fakeCamera(CAVERN_IDLE) as never, new PerspectiveCamera(28, W / H), 'ffx');
    run(onPhone, p.actors, 2);
    expect(p.yojimbo.scale.y).toBe(1);
    phone = false;
    stubDom();
    const o = cavern();
    const off = new Framing(fakeCamera(CAVERN_IDLE) as never, new PerspectiveCamera(28, W / H), 'ffx');
    run(off, o.actors, 2, false);
    expect(o.yojimbo.scale.y).toBe(1);
  });

  it('lets the early size go when CHAPTER FRAMING is switched off before the plan has landed', () => {
    const s = cavern();
    const f = new Framing(fakeCamera(CAVERN_IDLE) as never, new PerspectiveCamera(28, W / H), 'ffx');
    f.update(1 / 60, s.actors, true);
    expect(s.yojimbo.scale.y).toBeGreaterThan(1.1);
    expect(planned(f)).toBe(0);
    menuUp = true; // a menu is open, so the plan could not have landed either
    f.update(1 / 60, s.actors, false);
    f.update(1 / 60, s.actors, false);
    expect(s.yojimbo.scale.y).toBe(1);
  });

  it('releases the size with the framing: switched off mid-fight, the figure is as the stage drew it', () => {
    const s = cavern();
    const f = new Framing(fakeCamera(CAVERN_IDLE) as never, new PerspectiveCamera(28, W / H), 'ffx');
    run(f, s.actors, 2);
    expect(s.yojimbo.scale.y).toBeGreaterThan(1.1);
    run(f, s.actors, 0.2, false);
    expect(s.yojimbo.scale.y).toBe(1);
    f.dispose();
  });

  it('plays the same factor in the next phase of the link only after a change of phase: the scene re-registering its rig asks for a fresh reading', () => {
    const s = cavern();
    const cam = fakeCamera(CAVERN_IDLE);
    const f = new Framing(cam as never, new PerspectiveCamera(28, W / H), 'ffx');
    run(f, s.actors, 2);
    const k0 = s.yojimbo.scale.y;
    cam.addRig('idle', { position: [0, 5.1, 14.0], lookAt: [0.6, 1.8, 0], fov: 28 }); // Evrae's range, in kind: a new resting rig
    run(f, s.actors, 2);
    expect(planned(f)).toBeGreaterThanOrEqual(2);
    expect(s.yojimbo.scale.y).not.toBeCloseTo(k0, 3); // read again for the new rig: a new phase may be sized afresh
    expect(s.yojimbo.scale.y).toBeGreaterThan(1.05);
    expect(s.yojimbo.scale.y).toBeLessThan(1.3);
  });
});

/**
 * A colossus that steps (FFX-2's Bahamut: a target of 2.0, the first step that clears the HUD wins): the same four menus, as the panels each one shows,
 * through the real plan. The stage is a stand-in, solved only so that the four panel sets (a card on the right, the command list on the left, a bar
 * across the bottom and a band on top) are asked for four different answers from the search; the picture itself is measured in a browser
 * (`docs/handoff/r392-boss-scale.md`: Bahamut 563, 416, 581 px between the menus of the 39.1 build).
 */
describe('a boss that steps (Bahamut\'s kind) is sized once per phase, not once per menu', () => {
  const BAHAMUT_IDLE: Rig = { position: [0.15, 3.2, 14], lookAt: [0.15, 1.5, -1.3], fov: 32 };
  const MENUS = [
    [{ l: 1150, r: 1560, t: 400, b: 820 }],
    [{ l: 60, r: 520, t: 300, b: 836 }],
    [{ l: 500, r: 1000, t: 600, b: 880 }, { l: 1100, r: 1590, t: 100, b: 380 }],
    [{ l: 60, r: 700, t: 100, b: 500 }],
  ];
  /** The boss's group scale and the step the plan chose, plan by plan, over the four menus; `lock`: false forgets the phase's size before each (the plans of the 39.1 build). */
  const fight = (lock: boolean): { k: number[]; step: number[]; plans: number } => {
    const party = [actor('yuna-white-mage', 1, -2.0, 4.4, 1.75), actor('rikku-dark-knight', 1, -0.9, 4.0, 1.75), actor('paine-warrior', 1, 0.1, 4.6, 1.75)];
    const boss = actor('ffx2-bahamut', -1, 3.2, -3.0, 5.2);
    const actors = [...party, boss];
    const f = new Framing(fakeCamera(BAHAMUT_IDLE) as never, new PerspectiveCamera(32, W / H), 'ffx2');
    run(f, actors, 2);
    const k = [boss.scale.y];
    const step = [f.report.scale];
    for (const panels of MENUS) {
      noteMenuPanels(panels, KEY('ffx2'));
      if (!lock) (f as unknown as { lock: null }).lock = null;
      replan(f, actors);
      k.push(boss.scale.y);
      step.push(f.report.scale);
    }
    return { k, step, plans: planned(f) };
  };

  it('control: with no phase to keep, the panels of the moment re-size the boss (the 39.1 build\'s Bahamut)', () => {
    const { k, step } = fight(false);
    expect(Math.max(...k) - Math.min(...k)).toBeGreaterThan(0.1);
    expect(new Set(step).size).toBeGreaterThan(2); // the search chose different steps for different menus
  });

  it('with the phase kept, every menu plays the size the first plan chose, whatever the search finds for the panels', () => {
    const { k, step, plans } = fight(true);
    for (const x of k) expect(x).toBeCloseTo(k[0]!, 9);
    expect(k[0]).toBeGreaterThan(1.1);
    expect(plans).toBeGreaterThanOrEqual(5);
    expect(step[0]).toBe(1);
  });

  it("a member who leans into the boss: the fit keeps the master that keeps her out of him, not today's rig carrying the same size (the gate covers a size the phase holds)", () => {
    const party = [actor('yuna-white-mage', 1, -2.0, 4.4, 1.75), actor('rikku-dark-knight', 1, -0.9, 4.0, 1.75), actor('paine-warrior', 1, 0.1, 4.6, 1.75)];
    const boss = actor('ffx2-bahamut', -1, 3.2, -3.0, 5.2);
    const actors = [...party, boss];
    const f = new Framing(fakeCamera(BAHAMUT_IDLE) as never, new PerspectiveCamera(32, W / H), 'ffx2');
    run(f, actors, 2);
    const k0 = boss.scale.y;
    const steps: number[] = [];
    for (const dx of [1.6, 2.4, 3.2]) {
      party[2]!.position.x = 0.1 + dx; // she steps right and back, into the boss's painted shape on today's rig
      party[2]!.position.z = 4.6 - dx * 1.6;
      noteMenuPanels([{ l: 60, r: 520, t: 300, b: 836 }], KEY('ffx2'));
      replan(f, actors);
      steps.push(f.report.scale);
      expect(boss.scale.y).toBeCloseTo(k0, 9);
      expect(f.report.tries.some((t) => /^-1:x gate/.test(t))).toBe(true); // today's rig at that size is held to the gate: she stands inside him
    }
    expect(steps).toEqual([1, 1, 1]); // and the master wins over it each time
  });

  it('a plan that falls back to today\'s rig leaves the phase\'s step standing: the colossus master is tried again the next menu, at the same size', () => {
    const { step } = fight(true);
    const back = step.findIndex((s) => s === -1);
    expect(back).toBeGreaterThan(0); // a menu the master could not clear: today's rig, at the phase's size
    expect(step.slice(back + 1).some((s) => s === 1)).toBe(true); // and a later one plays the master at the phase's step again
  });
});
