/**
 * FOC44A-05, with the REAL plan (the focused review of build 7758791e; E-PYRE, decision 61e; FFX-2 only: Chapter XIII's Paragon is the one figure measured to step).
 *
 * `entrance-plan-owed.test.ts` drives the entrance against a stand-in plan. Here the plan is the game's own: the REAL `Framing` (the harness of `fx-mix-giants.test.ts`: three girls, Paragon, an idle
 * rig and a document standing in for the scene and the HUD) lands Paragon's real giant size (1 to 3.047, `giantFactor`) in the frame it decides, and the REAL `StageEntrances` holds a stand-in
 * for the painted figure. Each frame runs in `BattleScreen.update`'s order: CHAPTER FRAMING first (`updateLivingScene`), then the stage's entrances. The host answers `planOwed` from
 * `Framing.planOwed`, which is what `PaintedStage` is given in the game (`BattleScreen`: `planOwed: framingPlanOwed`).
 *
 * What delays the real plan, as the code has it: it decides only when the figures are all painted (`ready`: no placeholder) and all at rest (`calm`: the party's slide-in has no tween left) and
 * 0.6 s after they last changed. With neither delay it lands at 0.6 s, before the entrance's 900 ms gate, and nothing steps; the review measured it at 1.0 to 1.7 s, after the gate. Both delays are
 * driven here: the party still sliding in, and Paragon's painting still a placeholder. "On screen" is the continuity probe's: alpha over 0.02 on the EARLIER frame of a jump of the scale.
 */
import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DT, FRAME } from './entrance-stage-fixture.ts';
import { forgetMenuPanels } from '../../../src/engine/fx/mix/hudPanels.ts';
import { Framing } from '../../../src/engine/fx/mix/framing.ts';
import { StageEntrances, type EntranceActor, type EntranceHost } from '../../../src/engine/entrance/StageEntrances.ts';
import { HOLD_ALPHA } from '../../../src/engine/entrance/entranceLook.ts';
import type { Actor } from '../../../src/engine/fx/mix/geometry.ts';

const W = 1600;
const H = 900;
let menu = false;
const FAKE_MENU = { hidden: false, closest: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 200, right: 300, bottom: 200 }), querySelector: () => ({}) };
const stubDom = (): void => {
  const rect = { left: 0, top: 0, width: W, height: H, right: W, bottom: H };
  const canvas = { getBoundingClientRect: () => rect };
  vi.stubGlobal('document', { documentElement: { dataset: {} }, querySelector: () => canvas, querySelectorAll: () => (menu ? [FAKE_MENU] : []) });
  vi.stubGlobal('window', { innerWidth: W, innerHeight: H, matchMedia: () => ({ matches: false }) });
};
beforeEach(() => {
  menu = false;
  forgetMenuPanels();
  stubDom();
});
afterEach(() => vi.unstubAllGlobals());

/** A painted figure as the stage parents it (the giants test's): named, facing, at a spot, its quad `halfW` wide each side. */
const actor = (name: string, facing: number, x: number, z: number, h: number, halfW = h * 0.25, shift = 0): Actor => {
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
    q[0].set(-halfW + shift, 0, 0).applyMatrix4(a.matrixWorld);
    q[1].set(halfW + shift, 0, 0).applyMatrix4(a.matrixWorld);
    q[2].set(halfW + shift, hh, 0).applyMatrix4(a.matrixWorld);
    q[3].set(-halfW + shift, hh, 0).applyMatrix4(a.matrixWorld);
    return q;
  };
  return a;
};
const girl = (name: string, x: number, z: number, h: number): Actor => actor(name, 1, x, z, h, h * 0.16);
/** Chapter XIII's stage (`scenes/` Paragon's cloister): the three girls on the slots, Paragon on the boss slot at the stage's own 3.1. */
const cloister = (): { party: Actor[]; boss: Actor; actors: Actor[] } => {
  const party = [girl('yuna-dark-knight', -2.05, 1.45, 1.75), girl('rikku-alchemist', -1.3, 0.1, 1.75), girl('paine-dark-knight', -0.9, -1.5, 1.75)];
  const boss = actor('paragon', -1, 1.05, -5.8, 3.1, 3.1 * 0.3, 3.1 * 0.25);
  return { party, boss, actors: [...party, boss] };
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
  snapTo(): void {}
}
const IDLE: Rig = { position: [0, 3.0, 9.6], lookAt: [0.15, 1.5, -1.3], fov: 32 };
const CLOSE: Rig = { position: [0.15, 2.7, 9.0], lookAt: [1.0, 1.5, -1.2], fov: 32 };
const framingFor = (): Framing => new Framing(new FakeBattleCamera(IDLE, CLOSE) as never, new PerspectiveCamera(32, W / H), 'ffx2');

/** The figure the entrance drives: the giants test's actor with the four calls `EntranceActor` names, recording what they set. */
type Shown = Actor & EntranceActor & { alpha: number; dissolve: number };
function shown(a: Actor): Shown {
  const e = a as unknown as Shown;
  e.alpha = 1;
  e.dissolve = 0;
  e.setAlpha = (v) => void (e.alpha = v);
  e.setDissolve = (v) => void (e.dissolve = v);
  e.setDissolveStyle = () => undefined;
  e.flash = () => undefined;
  return e;
}

const host = (f: Framing | null): EntranceHost => ({
  spawn: () => true,
  hush: () => undefined,
  tracked: () => true,
  comfort: () => ({ reduceMotion: false, lowEffects: false }),
  reduceFlashes: () => false,
  cameraAt: () => ({ x: 0, y: 3, z: 14 }),
  tier: () => 'full',
  ...(f ? { planOwed: () => f.planOwed } : {}),
});

interface Frame {
  t: number;
  alpha: number;
  dissolve: number;
  scale: number;
  plans: number;
  owed: boolean;
}
interface Fight {
  /** `planOwed` is wired to the framing (the game); false is the entrance as it was before FOC44A-05. */
  wired: boolean;
  /** The opening begins, ms after the figures were built. */
  enterAt: number;
  instant?: boolean;
  /** The party is still sliding in (a running tween on a girl) until this many ms. */
  partyUntil?: number;
  /** Paragon's painting is a placeholder until this many ms (the art governor's swap, a slow load). */
  paintUntil?: number;
  until: number;
}

function fight(o: Fight): { trace: Frame[]; f: Framing; ent: StageEntrances; boss: Shown } {
  const s = cloister();
  const boss = shown(s.boss);
  const f = framingFor();
  const ent = new StageEntrances(host(o.wired ? f : null));
  ent.hold(boss, 'paragon');
  const slide = s.party[0] as unknown as { tweens?: { size: number } };
  const paint = s.boss as unknown as { isPlaceholder?: boolean };
  if (o.partyUntil) slide.tweens = { size: 1 };
  if (o.paintUntil) paint.isPlaceholder = true;
  const trace: Frame[] = [];
  let entered = false;
  for (let i = 0; i * FRAME < o.until; i++) {
    const t = i * FRAME;
    if (o.partyUntil && t >= o.partyUntil) slide.tweens = { size: 0 };
    if (o.paintUntil && t >= o.paintUntil) paint.isPlaceholder = false;
    if (!entered && t >= o.enterAt) {
      entered = true;
      void ent.enter(o.instant === true);
    }
    f.update(DT, s.actors, true); // CHAPTER FRAMING, `updateLivingScene`: lands the plan on the figures
    ent.update(DT); // the stage's entrances, `stage.update`, after it
    trace.push({ t, alpha: boss.alpha, dissolve: boss.dissolve, scale: boss.scale.y, plans: f.report.plans, owed: f.planOwed });
  }
  return { trace, f, ent, boss };
}

const SHOWING = 0.02;
const pops = (trace: readonly Frame[]): number[] =>
  trace.flatMap((x, i) => (i > 0 && trace[i - 1]!.alpha > SHOWING && Math.abs(x.scale - trace[i - 1]!.scale) > 0.05 ? [i] : []));
const planFrame = (trace: readonly Frame[]): number => trace.findIndex((x) => x.plans === 1);
/** Paragon's size after the plan (`giantFactor`: 9.447 over the drawn 3.1). */
const GIANT = 9.447 / 3.1;

describe('Framing.planOwed: the plan is still to land', () => {
  it('is false before the part is on, true from the first frame until the plan is on screen, and false after', () => {
    const s = cloister();
    const f = framingFor();
    expect(f.planOwed).toBe(false); // nothing has asked for CHAPTER FRAMING yet
    f.update(DT, s.actors, true);
    expect(f.planOwed).toBe(true);
    for (let i = 0; i < 40 && f.report.plans === 0; i++) f.update(DT, s.actors, true);
    expect(f.report.plans).toBe(1);
    expect(f.planOwed).toBe(false);
    expect(s.boss.scale.y).toBeCloseTo(GIANT, 2); // and the plan is on the figure the frame it is no longer owed
  });

  it('is false with the part off, and false with no rig to plan against (a stage with no battle camera)', () => {
    const s = cloister();
    const off = framingFor();
    off.update(DT, s.actors, false);
    expect(off.planOwed).toBe(false);
    const noRig = new Framing(null, new PerspectiveCamera(32, W / H), 'ffx2');
    noRig.update(DT, s.actors, true);
    expect(noRig.planOwed).toBe(false);
  });

  it('stays owed while the party is not at rest or the painting is a placeholder (the plan measures the figures where they stand)', () => {
    const s = cloister();
    const f = framingFor();
    (s.party[0] as unknown as { tweens: { size: number } }).tweens = { size: 1 };
    (s.boss as unknown as { isPlaceholder: boolean }).isPlaceholder = true;
    for (let i = 0; i < 120; i++) f.update(DT, s.actors, true);
    expect(f.report.plans).toBe(0);
    expect(f.planOwed).toBe(true);
    (s.party[0] as unknown as { tweens: { size: number } }).tweens = { size: 0 };
    for (let i = 0; i < 10; i++) f.update(DT, s.actors, true);
    expect(f.planOwed).toBe(true); // the painting is still a placeholder
    (s.boss as unknown as { isPlaceholder: boolean }).isPlaceholder = false;
    f.update(DT, s.actors, true);
    expect(f.report.plans).toBe(1);
    expect(f.planOwed).toBe(false);
  });

  it('a plan decided while a menu is open is owed until the menu closes (the plan is on screen only when no menu is)', () => {
    const s = cloister();
    const f = framingFor();
    menu = true;
    for (let i = 0; i < 120; i++) f.update(DT, s.actors, true);
    expect(f.report.plans).toBe(0);
    expect(f.planOwed).toBe(true);
    expect(s.boss.scale.y).toBe(1); // decided, not on screen
    menu = false;
    f.update(DT, s.actors, true);
    expect(f.report.plans).toBe(1);
    expect(f.planOwed).toBe(false);
    expect(s.boss.scale.y).toBeCloseTo(GIANT, 2);
  });
});

describe('Paragon: the real giant plan against the real entrance', () => {
  it('the plan lands first, nothing delaying it (0.6 s): the quiet order, nothing steps on a figure that is showing, as the gate has always done', () => {
    const { trace } = fight({ wired: true, enterAt: 100, until: 3000 });
    const at = planFrame(trace);
    expect(trace[at]!.t).toBeLessThan(900); // before the 900 ms gate: the old guess was right here
    expect(pops(trace)).toEqual([]);
    expect(trace.filter((x) => x.alpha > SHOWING).every((x) => x.scale > 3)).toBe(true);
  });

  for (const [label, delay] of [
    ['the party still sliding in until 1.2 s (Enter on the card; the opening begins at once)', { partyUntil: 1200 }],
    ['Paragon\'s painting still a placeholder until 1.3 s (a slow load, the review\'s throttled CPU)', { paintUntil: 1300 }],
    ['both: the party arrives at 1.0 s, the painting at 1.7 s', { partyUntil: 1000, paintUntil: 1700 }],
  ] as const) {
    describe(label, () => {
      it('CONTROL, the entrance as it was: the gate opens at 900 ms and the plan\'s step falls on a Paragon that is showing and part gathered', () => {
        const { trace } = fight({ wired: false, enterAt: 100, until: 3500, ...delay });
        const hit = pops(trace);
        expect(hit, 'the defect').toEqual([planFrame(trace)]);
        const before = trace[hit[0]! - 1]!;
        expect(before.alpha).toBeGreaterThan(0.5);
        expect(before.dissolve).toBeGreaterThan(0);
        expect(before.dissolve).toBeLessThan(1);
        expect(trace[hit[0]!]!.scale).toBeCloseTo(GIANT, 2);
      });

      it('with the plan waited for: Paragon is unseen on every frame up to the plan\'s, the step falls on nothing, and he gathers whole at the giant size', () => {
        const { trace, ent } = fight({ wired: true, enterAt: 100, until: 3500, ...delay });
        const at = planFrame(trace);
        expect(at).toBeGreaterThan(54); // the plan is later than the 900 ms gate: this is the order that failed
        expect(trace[at - 1]!.scale).toBe(1);
        expect(trace[at]!.scale).toBeCloseTo(GIANT, 2);
        // unseen on every frame BEFORE the plan's. (On the plan's own frame the gather may already begin when the opening's patience has run out on that very frame: it is drawn at the giant
        // size, the plan having run first, and the frame before it showed nothing, so it is no step; the lines below hold every showing frame to the giant size.)
        for (const x of trace.slice(0, at)) expect([x.alpha, x.dissolve], `t=${Math.round(x.t)}`).toEqual([HOLD_ALPHA, 1]);
        expect(pops(trace)).toEqual([]);
        for (const x of trace.filter((x) => x.alpha > SHOWING)) expect(x.scale, `t=${Math.round(x.t)}`).toBeCloseTo(GIANT, 2);
        const end = trace[trace.length - 1]!;
        expect([end.alpha, end.dissolve]).toEqual([1, 0]);
        expect(ent.busy).toBe(false);
      });

      it('hurried (`enter(true)`): held while the plan is owed, whole in the frame it lands; the same control puts the step on a whole figure (the harness run of 355 px)', () => {
        const hurried = fight({ wired: true, enterAt: 100, instant: true, until: 2500, ...delay });
        const at = planFrame(hurried.trace);
        expect(hurried.trace.slice(0, at).every((x) => x.alpha <= SHOWING)).toBe(true);
        expect([hurried.trace[at]!.alpha, hurried.trace[at]!.dissolve]).toEqual([1, 0]);
        expect(hurried.trace[at]!.scale).toBeCloseTo(GIANT, 2);
        expect(pops(hurried.trace)).toEqual([]);

        const before = fight({ wired: false, enterAt: 100, instant: true, until: 2500, ...delay });
        expect(before.trace.find((x) => x.t >= 100 + FRAME)!.alpha).toBe(1); // whole at the opening, small
        const hit = pops(before.trace);
        expect(hit).toEqual([planFrame(before.trace)]);
        expect(before.trace[hit[0]! - 1]!.dissolve).toBe(0); // a whole figure, jumping to the giant
      });
    });
  }

  it('the opening comes late (nothing pressed: the BATTLE START card holds the field), so the plan has landed under it: the gather begins with the opening and nothing waits', () => {
    const { trace } = fight({ wired: true, enterAt: 2500, until: 4500 });
    expect(planFrame(trace)).toBeGreaterThan(0);
    expect(trace[planFrame(trace)]!.t).toBeLessThan(900);
    const shownAt = trace.find((x) => x.alpha > SHOWING)!;
    expect(shownAt.t).toBeGreaterThanOrEqual(2500 - FRAME);
    expect(shownAt.t).toBeLessThanOrEqual(2500 + 2 * FRAME); // at the opening, as before: no time added
    expect(pops(trace)).toEqual([]);
  });
});
