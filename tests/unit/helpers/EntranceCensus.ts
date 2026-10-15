/**
 * The entrance census's harness: the REAL engines, the REAL `BattlePresenter`, the REAL chain loop and the REAL `PaintedStage` (its `stage`, `add`, `arrive`,
 * `addCombatant`, `removeCombatant`, its entrances), with the figures and the camera and the effects stood in by recorders. It plays a chapter to its end the way
 * `flow-encounter-chain.test.ts` does, on a virtual clock, and answers one question for every figure the stage builds: what does the player (and the continuity probe)
 * see on the first frame after it is built, and what then?
 *
 * "A frame" is the virtual 1/60 s after the figure was built, read from the figure's own log: everything the stage and the presenter did to it in the same turn of the event
 * loop counts (the real game renders between turns, so a `setAlpha(0)` in the same breath as the build is never drawn), nothing after does. A figure whose alpha is whole
 * and whose dissolve is down on that frame enters in one frame.
 *
 * Test plumbing; both games.
 */
import { Group, Object3D, PerspectiveCamera, Scene, Vector3 } from 'three';
import { vi } from 'vitest';
import type { CombatantId } from '../../../src/battle/common/types.ts';
import type { ActorHandle, ArrivalClock, BattleStage, CameraPort, Point2 } from '../../../src/engine/BattlePresenterPorts.ts';
import { FakeStage } from './FakeStage.ts';

export const FRAME = 1000 / 60;

/** The virtual clock: only the presenter's sleeps move it. */
export const clock = { now: 0 };

interface Event {
  t: number;
  alpha?: number;
  dissolve?: number;
  ramp?: { to: number; ms: number };
}

/** A figure that records. It answers what a `PaintedActor` answers to the stage, the presenter and the entrances, and remembers when it was told. */
export class CensusActor extends Object3D {
  readonly built = clock.now;
  readonly log: Event[] = [];
  readonly calls: string[] = [];
  pose = 'idle';
  height = 4;
  worldHeight = 4;
  facingDir: 1 | -1 = 1;
  isPlaceholder = false;
  lifeState = 'idle';
  shadow = null;
  levitates = false;
  still?: () => boolean;
  style: 'plain' | 'pyrefly' = 'plain';
  flashes = 0;

  constructor(readonly opts: Record<string, unknown>) {
    super();
    this.name = String(opts['name']);
  }

  // what the entrances and the death's dissolve drive
  setAlpha(alpha: number): void {
    this.log.push({ t: clock.now, alpha });
  }
  setDissolve(dissolve: number): void {
    this.log.push({ t: clock.now, dissolve });
  }
  setDissolveStyle(style: 'plain' | 'pyrefly'): void {
    this.style = style;
  }
  flash(): void {
    this.flashes++;
  }
  contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]): [Vector3, Vector3, Vector3, Vector3] {
    const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    const p = this.position;
    q[0].set(p.x - 1, p.y, p.z);
    q[1].set(p.x + 1, p.y, p.z);
    q[2].set(p.x + 1, p.y + 4, p.z);
    q[3].set(p.x - 1, p.y + 4, p.z);
    return q;
  }
  get dissolveLevel(): number {
    return this.dissolveAt(clock.now);
  }

  // what the presenter drives (`ActorHandle`)
  fadeTo(alpha: number, ms = 300): Promise<void> {
    this.log.push({ t: clock.now, ramp: { to: alpha, ms } });
    return Promise.resolve();
  }
  dissolveTo(value: number): Promise<void> {
    this.log.push({ t: clock.now, dissolve: value });
    return Promise.resolve();
  }
  setPose(name: string): void {
    this.pose = name;
  }
  async lunge(): Promise<void> {}
  async recoil(): Promise<void> {}
  async squash(): Promise<void> {}
  async hop(): Promise<void> {}
  moveTo(_to?: unknown, ms = 0): Promise<void> {
    if (ms > 0 && running.stage) advance(running.stage, ms); // the party's slide-in and every strike's travel take the time they ask for
    return Promise.resolve();
  }
  async lieDown(): Promise<void> {}
  shake(): void {}
  setFacing(dir: 1 | -1): void {
    this.facingDir = dir;
  }
  setBrightness(): void {}
  setStone(): void {}
  /** A point on the painting (`PaintedActor.paintPoint`): where a figure-less part is pinned to its parent. */
  paintPoint(u: number, t: number, out = new Vector3()): Vector3 {
    return out.set(this.position.x + u - 0.5, this.position.y + 4 * (1 - t), this.position.z);
  }
  centerPoint(): { x: number; y: number; z: number } {
    return { x: this.position.x, y: this.position.y + 2, z: this.position.z };
  }
  headPoint(): { x: number; y: number; z: number } {
    return { x: this.position.x, y: this.position.y + 4, z: this.position.z };
  }
  update(): void {}
  override dispose(): void {}

  /** The figure's own opacity and dissolve at virtual time `t`, from its log. */
  alphaAt(t: number): number {
    let a = 1;
    let from = 1;
    let ramp: { t0: number; to: number; ms: number } | null = null;
    for (const e of this.log) {
      if (e.t > t) break;
      if (e.alpha !== undefined) {
        a = e.alpha;
        ramp = null;
      }
      if (e.ramp) {
        from = ramp ? this.rampValue(ramp, e.t, a) : a;
        a = from;
        ramp = { t0: e.t, to: e.ramp.to, ms: e.ramp.ms };
      }
    }
    return ramp ? this.rampValue(ramp, t, a) : a;
  }
  dissolveAt(t: number): number {
    let d = 0;
    for (const e of this.log) {
      if (e.t > t) break;
      if (e.dissolve !== undefined) d = e.dissolve;
    }
    return d;
  }
  private rampValue(ramp: { t0: number; to: number; ms: number }, t: number, from: number): number {
    const k = ramp.ms <= 0 ? 1 : Math.min(1, Math.max(0, (t - ramp.t0) / ramp.ms));
    return from + (ramp.to - from) * k;
  }
  /** How much of the figure is drawn at `t`: opacity times what the dissolve has not eaten. */
  shownAt(t: number): number {
    return this.alphaAt(t) * (1 - this.dissolveAt(t));
  }
}

export interface Built {
  id: CombatantId;
  /** Built by `PaintedStage.stage` (the battle's first staging and every link's re-staging), as against a summon, a switch or a reveal, which the presenter fades in. */
  viaStage: boolean;
  /** False for a figure-less part (Vegnagun's Nodes, Bulwarks and Redoubts, Seymour Omnis's discs): it is a ring and a cursor on its parent's painting, with nothing to bring in. */
  figure: boolean;
  /** The side the stage built it for (`'party'`, `'enemy'`, `'aeon'`). */
  side: string;
  actor: CensusActor;
  /** The stage call that built it: 0 is the battle screen's first staging, 1 and up are the chain's re-stages (link 2 and up). */
  stageCall: number;
}
export const built: Built[] = [];
export const stageCalls = { n: 0 };
/** True while `PaintedStage.stage` runs. */
export const staging = { on: false };
/** The stage the census is playing on (the virtual clock's driver). */
export const running: { stage: CensusPaintedStage | null } = { stage: null };

vi.mock('../../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      const actor = new CensusActor(o);
      built.push({ id: String(o['name']), viaStage: staging.on, figure: o['figure'] !== false, side: String(o['side'] ?? ''), actor, stageCall: stageCalls.n });
      return actor;
    }),
  },
}));
vi.mock('../../../src/engine/VFX.ts', () => ({
  HitEffects: class extends Group {
    sparks = { setPixelScale(): void {} };
    update(): void {}
    override dispose(): void {}
  },
}));
vi.mock('../../../src/engine/BattlePresenterArt.ts', async (orig) => ({
  ...(await orig<typeof import('../../../src/engine/BattlePresenterArt.ts')>()),
  resolveArt: vi.fn(async (ids: string[]) => ({ artId: ids[0], poses: {} })),
}));

const { PaintedStage: RealStage } = await import('../../../src/engine/BattlePresenterStage.ts');
const { FARPLANE_PART_ANCHORS } = await import('../../../src/scenes/farplane-parts.ts');
const { GARDEN_PART_ANCHORS } = await import('../../../src/scenes/garden-of-pain.ts');
const { BattleCamera } = await import('../../../src/engine/BattleCamera.ts');

/** The real stage with the entrances' per-frame driver exposed (the game's loop calls `update`, which needs a real actor's whole surface). */
export class CensusPaintedStage extends RealStage {
  override async stage(state: Parameters<InstanceType<typeof RealStage>['stage']>[0]): Promise<void> {
    staging.on = true;
    try {
      await super.stage(state);
    } finally {
      staging.on = false;
    }
  }
  entranceBusy(): boolean {
    return (this as unknown as { entrances: { busy: boolean } | null }).entrances?.busy === true;
  }
  tick(dtSeconds: number): void {
    (this as unknown as { entrances: { update(dt: number): void } | null }).entrances?.update(dtSeconds);
  }
}

/** The figure-less parts the real scenes stand on their parent's painting (Vegnagun's Nodes, Bulwarks and Redoubts at the Farplane; Seymour Omnis's four discs in the Garden): no figure of their own, so nothing to bring in. */
const SLOTS = {
  partAnchors: { ...FARPLANE_PART_ANCHORS, ...GARDEN_PART_ANCHORS },
  party: [[-1.95, 0, 1.5], [-3.15, 0, 0.25], [-1.35, 0, -0.95]] as Array<[number, number, number]>,
  enemy: [[3, 0, -2.6], [4.6, 0, -0.4], [1.5, 0, -4.2], [5.4, 0, -3.4], [0.4, 0, -5.6]] as Array<[number, number, number]>,
  partyHeight: 1.82,
  enemyHeight: 4.1,
};

/** Called after every frame the entrances' driver runs (a test reads which entrance is playing). */
export const observe: { fn: (() => void) | null } = { fn: null };

/** Advance the virtual clock `ms`, a frame at a time while an entrance is on its way (so its per-frame driver runs), in one step otherwise. */
export function advance(stage: CensusPaintedStage, ms: number): void {
  let left = ms;
  while (left > 0) {
    const step = stage.entranceBusy() ? Math.min(FRAME, left) : left;
    clock.now += step;
    if (stage.entranceBusy()) {
      stage.tick(step / 1000);
      observe.fn?.();
    }
    left -= step;
  }
}

/** `extra`: more of the stage's options (FOC44A-05's `planOwed`); the census passes none. */
export function makeStage(entrances: boolean, comfort = { reduceMotion: false, lowEffects: false }, extra: Record<string, unknown> = {}): CensusPaintedStage {
  const cam = new PerspectiveCamera();
  const stage = new CensusPaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots: SLOTS,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
    comfort: () => comfort,
    ...extra,
  });
  if (entrances) stage.setEntrances(true);
  return stage;
}

/** The camera: every move takes the time it asks for on the virtual clock (the opening's push and returns are what the entrance plays inside of). */
class CensusCamera implements CameraPort {
  readonly rigNames = ['intro', 'idle', 'action', 'victory', 'enemy', 'party'];
  rigName = 'idle';
  constructor(private readonly stage: CensusPaintedStage) {}
  private spend(ms?: number): Promise<void> {
    if (ms && ms > 0) advance(this.stage, ms);
    return Promise.resolve();
  }
  moveTo(rig: string, ms?: number): Promise<void> {
    this.rigName = rig;
    return this.spend(ms);
  }
  snapTo(rig: string): void {
    this.rigName = rig;
  }
  shake(): void {}
  punch(_f?: number, ms?: number): Promise<void> {
    return this.spend(ms);
  }
  push(_f?: number, ms?: number): Promise<void> {
    return this.spend(ms);
  }
  release(ms?: number): Promise<void> {
    return this.spend(ms);
  }
  roll(_d?: number, ms?: number): Promise<void> {
    return this.spend(ms);
  }
}

/** `BattleStage` over the real stage's figures, with a timed camera and the effects of `FakeStage`: the presenter drives the figures, the chain re-stages them. */
export class CensusStage implements BattleStage {
  private readonly fake: FakeStage;
  private readonly cam: CensusCamera;
  readonly entered: Array<{ at: number; instant: boolean }> = [];
  constructor(readonly real: CensusPaintedStage) {
    this.fake = new FakeStage([], []);
    this.cam = new CensusCamera(real);
  }
  get camera(): BattleStage['camera'] {
    return this.cam;
  }
  get vfx(): BattleStage['vfx'] {
    return this.fake.vfx;
  }
  actor(id: CombatantId): ActorHandle | undefined {
    return this.real.actor(id) as unknown as ActorHandle | undefined;
  }
  sideOf(id: CombatantId): 'party' | 'enemy' | 'aeon' | undefined {
    return this.real.sideOf(id);
  }
  staged(): CombatantId[] {
    return this.real.staged();
  }
  project(id: CombatantId): Point2 | null {
    return this.real.actor(id) ? { x: 100, y: 100 } : null;
  }
  async setArt(): Promise<void> {}
  addCombatant(id: CombatantId, o: { artId: string; side: 'party' | 'enemy' | 'aeon'; slot: number }): Promise<ActorHandle | undefined> {
    return this.real.addCombatant(id, o) as unknown as Promise<ActorHandle | undefined>;
  }
  removeCombatant(id: CombatantId): void {
    this.real.removeCombatant(id);
  }
  slotOf(id: CombatantId): number | undefined {
    return this.real.slotOf(id);
  }
  arrive(id: CombatantId, c: ArrivalClock): Promise<ActorHandle | undefined> {
    return this.real.arrive(id, c) as unknown as Promise<ActorHandle | undefined>;
  }
  enter(c: Pick<ArrivalClock, 'instant'>): Promise<void> {
    this.entered.push({ at: clock.now, instant: c.instant });
    return this.real.enter(c);
  }
  settleEntrances(now?: boolean): void {
    this.real.settleEntrances(now);
  }
}

export interface CensusRun {
  chapter: string;
  game: string;
  stage: CensusPaintedStage;
  census: CensusStage;
  built: Built[];
  /** How long after its link began each link's first player decision came (the first menu), by link, ms. */
  firstMenuAt: number[];
  /** The virtual time of each link's first menu, by link. */
  menuAbs: number[];
  /** The kind of entrance each figure was played with, by the snapshot the driver saw (`id` at stage call `n` -> kind). */
  kinds: Map<string, string>;
  outcome: string;
  links: number;
}

