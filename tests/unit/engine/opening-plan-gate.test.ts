/**
 * The Chapter IV first-menu framing race (Codex trace `codex-ch4-camera-trace.md`; reproduced in FFX-2 Chapter IV, fixed in shared opening plumbing: **both games**).
 *
 * CHAPTER FRAMING's first plan is decided only on a calm frame, with every figure painted, and is put on screen only while no command menu is open. On a fresh profile the first menu
 * opened FIRST, so the plan waited behind it and then re-sized Bahamut (420 to 629 px) and moved the party (Yuna 31 px) on figures already on screen, at the first confirm. The opening
 * now owns the plan (`fx/mix/openingGate.ts`, `BattlePresenterBeats.settleOpening`): these tests play the REAL `Framing` (the harness of `fx-mix-giants.test.ts`: Chapter IV's three girls,
 * Bahamut, an idle rig and a document standing in for the scene and the HUD) through the order that failed and the order that replaces it, and pin the bounded fallback.
 */
import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetMenuPanels } from '../../../src/engine/fx/mix/hudPanels.ts';
import { Framing } from '../../../src/engine/fx/mix/framing.ts';
import { arrivalOf, cameraOwed, OpeningGate, PLAN_WAIT_S, PLAN_WAIT_WALL_MS, type Arrival, type GateSource } from '../../../src/engine/fx/mix/openingGate.ts';
import { settleOpening } from '../../../src/engine/BattlePresenterBeats.ts';
import type { Actor } from '../../../src/engine/fx/mix/geometry.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';

const W = 1600;
const H = 900;
const DT = 1 / 60;
let menu = false;
const FAKE_MENU = { hidden: false, closest: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 200, right: 300, bottom: 200 }), querySelector: () => ({}) };
let haveCanvas = true;
const stubDom = (): void => {
  const rect = { left: 0, top: 0, width: W, height: H, right: W, bottom: H };
  const canvas = { getBoundingClientRect: () => rect };
  vi.stubGlobal('document', { documentElement: { dataset: {} }, querySelector: () => (haveCanvas ? canvas : null), querySelectorAll: () => (menu ? [FAKE_MENU] : []) });
  vi.stubGlobal('window', { innerWidth: W, innerHeight: H, matchMedia: () => ({ matches: false }) });
};
beforeEach(() => {
  menu = false;
  haveCanvas = true;
  forgetMenuPanels();
  stubDom();
});
afterEach(() => vi.unstubAllGlobals());

const actor = (name: string, facing: number, x: number, z: number, h: number, halfW = h * 0.25): Actor => {
  const a = new Object3D() as unknown as Actor;
  a.name = name;
  (a as unknown as { facing: number }).facing = facing;
  (a as unknown as { worldHeight: number }).worldHeight = h;
  (a as unknown as { poseUrls: Record<string, string> }).poseUrls = { idle: `art/characters/${name}/idle.png` };
  a.visible = true;
  a.position.set(x, 0, z);
  a.contentQuad = (out) => {
    const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    const hh = (a as unknown as { worldHeight: number }).worldHeight;
    q[0].set(-halfW, 0, 0).applyMatrix4(a.matrixWorld);
    q[1].set(halfW, 0, 0).applyMatrix4(a.matrixWorld);
    q[2].set(halfW, hh, 0).applyMatrix4(a.matrixWorld);
    q[3].set(-halfW, hh, 0).applyMatrix4(a.matrixWorld);
    return q;
  };
  return a;
};

interface Rig {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}
class FakeBattleCamera {
  readonly camera: PerspectiveCamera;
  rigName = 'idle';
  readonly rigNames = ['idle', 'party', 'enemy', 'action'];
  pushAmount = 0;
  tweens = { size: 0 };
  private readonly rigs = new Map<string, Rig>();
  constructor(idle: Rig, close: Rig) {
    this.camera = new PerspectiveCamera(idle.fov, W / H);
    for (const n of this.rigNames) this.rigs.set(n, n === 'idle' ? idle : close);
  }
  getRig(n: string): Rig | undefined {
    return this.rigs.get(n);
  }
  addRig(n: string, r: Rig): void {
    this.rigs.set(n, r);
  }
  async moveTo(): Promise<void> {}
  snapTo(_name?: string): void {}
}
const IDLE: Rig = { position: [0, 3.0, 9.6], lookAt: [0.15, 1.5, -1.3], fov: 32 };
const CLOSE: Rig = { position: [0.15, 2.7, 9.0], lookAt: [1.0, 1.5, -1.2], fov: 32 };

/** Chapter IV's stage (`scenes/bevelle-underground.ts`): the three girls on the slots, Bahamut on the boss slot at the stage's own height. */
const bevelle = () => {
  const party = [actor('yuna-white-mage', 1, -2.05, 1.45, 1.82), actor('rikku-dark-knight', 1, -1.3, 0.1, 1.82), actor('paine-warrior', 1, -0.9, -1.5, 1.82)];
  const boss = actor('ffx2-bahamut', -1, 1.05, -5.8, 4.1);
  return { party, boss, actors: [...party, boss] };
};
const framingFor = (): { f: Framing; cam: FakeBattleCamera } => {
  const cam = new FakeBattleCamera(IDLE, CLOSE);
  return { f: new Framing(cam as never, new PerspectiveCamera(32, W / H), 'ffx2'), cam };
};
const placeholder = (a: Actor, on: boolean): void => void ((a as unknown as { isPlaceholder: boolean }).isPlaceholder = on);
/** What the player can see change: every figure's group scale and place. */
const staging = (actors: readonly Actor[]): string => actors.map((a) => `${a.name}:${a.scale.y.toFixed(3)}/${a.position.x.toFixed(3)}`).join(' ');

/**
 * The order that failed: the paintings are late (Bahamut's is a placeholder), the hurried opening is over and the first menu opens, the plan is decided behind it, and the menu closes
 * at the first confirm. Returns what was on screen at the menu's close and the frame after.
 */
describe('the order that failed (CONTROL: the first menu opens before the plan)', () => {
  it('the plan is decided behind the open menu and written onto figures on screen the frame the menu closes: Bahamut re-sized, the party moved', () => {
    const { f } = framingFor();
    const s = bevelle();
    placeholder(s.boss, true);
    for (let i = 0; i < 120; i++) f.update(DT, s.actors, true); // the opening; the plan is not decidable yet
    expect(arrivalOf(f)).toBe('owed');
    placeholder(s.boss, false); // the painting arrives
    menu = true; // the first menu is already open
    for (let i = 0; i < 90; i++) f.update(DT, s.actors, true);
    expect(f.report.plans).toBe(0); // decided, behind the menu
    expect(arrivalOf(f)).toBe('owed');
    const before = staging(s.actors);
    menu = false; // the first confirm
    f.update(DT, s.actors, true);
    expect(f.report.plans).toBe(1);
    expect(staging(s.actors)).not.toBe(before); // the defect: a staging write on figures that were on screen
    expect(s.boss.scale.y).toBeGreaterThan(1.2);
  });
});

describe('the opening owns the plan: no menu opens under a plan that is still to land', () => {
  it('the opening waits (arrival owed) until the plan has landed with no menu open, then the menu opens and closes without a staging write', () => {
    const { f } = framingFor();
    const s = bevelle();
    const gate = new OpeningGate();
    placeholder(s.boss, true);
    let released = false;
    let first = '';
    const frame = (): void => {
      f.update(DT, s.actors, true);
      gate.update(DT, f);
    };
    for (let i = 0; i < 30; i++) frame(); // the opening plays; the card is up
    void gate.wait(f).then(() => void (released = true)); // the card's hold is over: the opening asks
    for (let i = 0; i < 60; i++) frame();
    expect(released).toBe(false); // the painting is late: the opening waits, the menu is not offered
    placeholder(s.boss, false);
    for (let i = 0; i < 60 && !released; i++) frame();
    return Promise.resolve().then(() => {
      expect(released).toBe(true);
      expect(arrivalOf(f)).toBe('landed');
      expect(f.report.plans).toBe(1);
      expect(s.boss.scale.y).toBeGreaterThan(1.2); // the plan is on screen BEFORE the first menu could open
      first = staging(s.actors);
      menu = true; // the first menu opens, the player dwells, confirms
      for (let i = 0; i < 90; i++) f.update(DT, s.actors, true);
      menu = false;
      for (let i = 0; i < 30; i++) f.update(DT, s.actors, true);
      expect(staging(s.actors)).toBe(first); // nothing is written at the confirm
    });
  });

  it('a plan already on screen costs no wait at all: the gate resolves at once', async () => {
    const { f } = framingFor();
    const s = bevelle();
    for (let i = 0; i < 60; i++) f.update(DT, s.actors, true);
    expect(arrivalOf(f)).toBe('landed');
    let released = false;
    void new OpeningGate().wait(f).then(() => void (released = true));
    await Promise.resolve();
    expect(released).toBe(true);
  });

  it('the camera, resting on the old idle rig when the plan lands late, owes its arrival until a move onto the master', () => {
    const { f, cam } = framingFor();
    const s = bevelle();
    for (let i = 0; i < 60; i++) f.update(DT, s.actors, true);
    expect(arrivalOf(f)).toBe('landed');
    expect(cameraOwed(f)).toBe(true); // installed, at rest, no move since: the presenter moves it
    cam.snapTo('idle'); // the presenter's own move (a cut under REDUCE MOTION) goes through the camera the framing watches
    expect(cameraOwed(f)).toBe(false);
  });
});

describe('the bounded fallback: a plan that does not come is retired, never installed later as a jump', () => {
  it('after PLAN_WAIT_S the plan is retired, the figures stay as the stage has them, and a painting that arrives later changes nothing, menu open or closed', async () => {
    const { f } = framingFor();
    const s = bevelle();
    const gate = new OpeningGate();
    placeholder(s.boss, true); // the painting never arrives in time
    const base = staging(s.actors);
    for (let i = 0; i < 30; i++) f.update(DT, s.actors, true); // the opening plays; the card's hold is over
    let released = false;
    void gate.wait(f).then(() => void (released = true));
    for (let i = 0; i < Math.ceil((PLAN_WAIT_S + 0.5) / DT) && !released; i++) {
      f.update(DT, s.actors, true);
      gate.update(DT, f);
    }
    await Promise.resolve();
    expect(released).toBe(true); // the opening goes on
    expect(arrivalOf(f)).toBe('retired');
    expect(f.planOwed).toBe(false); // and the boss entrance is no longer kept waiting
    placeholder(s.boss, false); // the painting finally arrives
    for (let i = 0; i < 240; i++) f.update(DT, s.actors, true);
    menu = true;
    for (let i = 0; i < 120; i++) f.update(DT, s.actors, true);
    menu = false;
    for (let i = 0; i < 120; i++) f.update(DT, s.actors, true);
    expect(f.report.plans).toBe(0);
    expect(staging(s.actors)).toBe(base); // consistent base presentation: no write, ever
    expect(arrivalOf(f)).toBe('retired');
  });

  it('a decided plan still waiting for a menu is retired too (the stale decision cannot land at a confirm)', () => {
    const { f } = framingFor();
    const s = bevelle();
    menu = true;
    for (let i = 0; i < 120; i++) f.update(DT, s.actors, true); // decided behind an open menu
    expect(f.planOwed).toBe(true);
    f.retire();
    menu = false;
    for (let i = 0; i < 30; i++) f.update(DT, s.actors, true);
    expect(f.report.plans).toBe(0);
    expect(s.boss.scale.y).toBe(1);
  });

  it('the next link\'s giant plans again after a retired one (a retired plan is the first opening\'s, not the fight\'s)', () => {
    const { f } = framingFor();
    const s = bevelle();
    placeholder(s.boss, true);
    for (let i = 0; i < 30; i++) f.update(DT, s.actors, true);
    f.retire();
    placeholder(s.boss, false);
    for (let i = 0; i < 60; i++) f.update(DT, s.actors, true);
    expect(f.report.plans).toBe(0); // the same fight: nothing lands
    s.actors.splice(3, 1); // the giant leaves
    for (let i = 0; i < 30; i++) f.update(DT, s.actors, true);
    s.actors.push(s.boss); // and a giant arrives (the next link)
    for (let i = 0; i < 90; i++) f.update(DT, s.actors, true);
    expect(f.report.plans).toBe(1);
  });
});

describe('the terminal states', () => {
  it('the part off, and a stage with no battle camera: nothing is owed', () => {
    const s = bevelle();
    const off = framingFor().f;
    off.update(DT, s.actors, false);
    expect(arrivalOf(off)).toBe('off');
    const noRig = new Framing(null, new PerspectiveCamera(32, W / H), 'ffx2');
    noRig.update(DT, s.actors, true);
    expect(arrivalOf(noRig)).toBe('off');
  });

  it('no canvas to plan on: unsupported at once, not owed for ever', () => {
    const s = bevelle();
    haveCanvas = false;
    const { f } = framingFor();
    for (let i = 0; i < 10; i++) f.update(DT, s.actors, true);
    expect(arrivalOf(f)).toBe('unsupported');
  });
});

describe('OpeningGate', () => {
  /** A stand-in for CHAPTER FRAMING that is in the state `arrival` names (`arrivalOf` reads it back): `set` moves it. */
  const source = (arrival: Arrival): GateSource & { set(a: Arrival): void; retired: number } => {
    const rig = { base: (): object | null => ({}) };
    const src = {
      rigs: rig as never,
      state: { on: true, wanted: false, pending: false, installed: false, seen: true },
      retired: 0,
      set(a: Arrival) {
        src.state = { on: a !== 'off', wanted: a === 'owed' || a === 'unsupported', pending: false, installed: a === 'landed', seen: true };
        rig.base = () => (a === 'unsupported' ? null : {});
      },
      retire() {
        src.retired++;
        src.set('retired');
      },
    };
    src.set(arrival);
    return src;
  };

  it('resolves at once for everything but owed', async () => {
    for (const a of ['landed', 'retired', 'off', 'unsupported'] as const) {
      let done = false;
      void new OpeningGate().wait(source(a)).then(() => void (done = true));
      await Promise.resolve();
      expect(done, a).toBe(true);
    }
  });

  it('waits while owed, releases the frame the plan lands, and retires nothing it did not have to', async () => {
    const gate = new OpeningGate();
    const src = source('owed');
    let done = false;
    void gate.wait(src).then(() => void (done = true));
    for (let i = 0; i < 60; i++) gate.update(DT, src);
    await Promise.resolve();
    expect(done).toBe(false);
    src.set('landed');
    gate.update(DT, src);
    await Promise.resolve();
    expect(done).toBe(true);
    expect(src.retired).toBe(0);
  });

  it('retires at PLAN_WAIT_S and releases; a hitch frame counts at most a quarter second', async () => {
    const gate = new OpeningGate();
    const src = source('owed');
    let done = false;
    void gate.wait(src).then(() => void (done = true));
    gate.update(5, src); // one frame that was five seconds long
    gate.update(5, src);
    await Promise.resolve();
    expect(done).toBe(false); // 0.5 s of the wait spent, not 10
    for (let t = 0.5; t < PLAN_WAIT_S - 0.01; t += DT) gate.update(DT, src);
    expect(src.retired).toBe(0);
    for (let i = 0; i < 12; i++) gate.update(DT, src);
    await Promise.resolve();
    expect(src.retired).toBe(1);
    expect(done).toBe(true);
  });

  it('a page that renders no frames to count is bounded by the wall clock', async () => {
    const gate = new OpeningGate();
    const src = source('owed');
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValue(1000);
    let done = false;
    void gate.wait(src).then(() => void (done = true));
    gate.update(0, src); // no frame time at all
    now.mockReturnValue(1000 + PLAN_WAIT_WALL_MS - 1);
    gate.update(0, src);
    await Promise.resolve();
    expect(done).toBe(false);
    now.mockReturnValue(1000 + PLAN_WAIT_WALL_MS);
    gate.update(0, src);
    await Promise.resolve();
    expect(src.retired).toBe(1);
    expect(done).toBe(true);
    now.mockRestore();
  });

  it('before the part has had its first frame the plan is owed, not off (a card that leaves before the first frame must not pass)', async () => {
    const { f } = framingFor();
    expect(arrivalOf(f)).toBe('owed'); // never updated
    let done = false;
    void new OpeningGate().wait(f).then(() => void (done = true));
    await Promise.resolve();
    expect(done).toBe(false);
    f.update(DT, bevelle().actors, false); // the part is off: now it can say so
    expect(arrivalOf(f)).toBe('off');
  });

  it('dispose releases everyone parked on a plan that will not come', async () => {
    const gate = new OpeningGate();
    let done = false;
    void gate.wait(source('owed')).then(() => void (done = true));
    gate.dispose();
    await Promise.resolve();
    expect(done).toBe(true);
  });
});

describe('settleOpening: the presenter\'s side of the opening', () => {
  const ctxWith = (o: { speed?: string; settled?: Promise<void>; owed?: boolean }) => {
    const moves: Array<[string, number]> = [];
    const ctx = {
      speed: () => o.speed ?? 'normal',
      stage: { planSettled: () => o.settled ?? Promise.resolve(), planArrivalOwed: () => o.owed === true },
      moments: { pick: (n: string) => n, moveToRig: async (rig: string, ms: number) => void moves.push([rig, ms]) },
    } as unknown as EventCtx;
    return { ctx, moves };
  };

  it('waits for the plan before returning, then moves the camera onto the master when it still owes its arrival', async () => {
    let land!: () => void;
    const { ctx, moves } = ctxWith({ settled: new Promise<void>((r) => (land = r)), owed: true });
    let done = false;
    void settleOpening(ctx).then(() => void (done = true));
    await new Promise((r) => setTimeout(r, 5));
    expect(done).toBe(false);
    land();
    await new Promise((r) => setTimeout(r, 5));
    expect(done).toBe(true);
    expect(moves).toEqual([['idle', 620]]);
  });

  it('moves nothing when the camera is already on the master, and waits for nothing at skip speed or on a stage with no framing', async () => {
    const a = ctxWith({ owed: false });
    await settleOpening(a.ctx);
    expect(a.moves).toEqual([]);
    const never = new Promise<void>(() => undefined);
    await settleOpening(ctxWith({ speed: 'skip', settled: never, owed: true }).ctx); // would hang if it waited
    const bare = { speed: () => 'normal', stage: {}, moments: { pick: () => 'idle', moveToRig: async () => undefined } } as unknown as EventCtx;
    await settleOpening(bare);
  });
});
