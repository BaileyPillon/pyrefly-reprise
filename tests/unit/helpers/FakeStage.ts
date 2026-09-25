/**
 * Test doubles for every port `BattlePresenter` drives.
 *
 * The presenter and its event layer import no `three` and no DOM, so the whole
 * playback loop runs here in Node and every animation it asks for is recorded
 * as a plain string. Assertions read like the thing they describe:
 * `expect(stage.calls).toContain('flash:seymour-flux')`.
 */

import type { BattleEvent, BattleState, CombatantId, MessageKind } from '../../../src/battle/common/types.ts';
import type {
  ActorHandle,
  BattleStage,
  CameraPort,
  DamageNumbersPort,
  MessageBarPort,
  Point2,
  Point3,
  VfxPort,
  AudioPort,
  CutsceneRunnerPort,
} from '../../../src/engine/BattlePresenterPorts.ts';
import type { HudPort } from '../../../src/engine/HudPort.ts';
import type { StoryScript } from '../../../src/story/dsl.ts';

const origin = (): Point3 => ({ x: 0, y: 0, z: 0 });

export class FakeActor implements ActorHandle {
  readonly position: Point3 = origin();
  pose = 'idle';
  alpha = 1;
  dissolve = 0;
  facing: 1 | -1 = 1;
  /** Structurally what `BattlePresenterDepartures.ts#scaleOf` reads off a real `PaintedActor`. */
  readonly scale = {
    x: 1,
    setScalar(v: number): void {
      this.x = v;
    },
  };

  constructor(
    readonly id: CombatantId,
    private readonly log: string[],
  ) {}

  private note(what: string): void {
    this.log.push(`${what}:${this.id}`);
  }

  setPose(name: string): void {
    this.pose = name;
    this.note(`pose=${name}`);
  }
  flash(): void {
    this.note('flash');
  }
  shake(): void {
    this.note('shake');
  }
  async lunge(): Promise<void> {
    this.note('lunge');
  }
  async recoil(): Promise<void> {
    this.note('recoil');
  }
  async squash(): Promise<void> {
    this.note('squash');
  }
  async hop(): Promise<void> {
    this.note('hop');
  }
  async fadeTo(alpha: number): Promise<void> {
    this.alpha = alpha;
    this.note(`fade=${alpha}`);
  }
  setAlpha(alpha: number): void {
    this.alpha = alpha;
  }
  async dissolveTo(value: number): Promise<void> {
    this.dissolve = value;
    this.note(`dissolve=${value}`);
  }
  setDissolve(value: number): void {
    this.dissolve = value;
  }
  async moveTo(): Promise<void> {
    this.note('moveTo');
  }
  setFacing(dir: 1 | -1): void {
    this.facing = dir;
  }
  setBrightness(): void {}
  setStone(amount: number): void {
    this.note(`stone=${amount}`);
  }
  async lieDown(): Promise<void> {
    this.note('lieDown');
  }
  centerPoint(): Point3 {
    return origin();
  }
  headPoint(): Point3 {
    return origin();
  }
}

export class FakeStage implements BattleStage {
  readonly calls: string[] = [];
  readonly actors = new Map<CombatantId, FakeActor>();
  readonly sides = new Map<CombatantId, 'party' | 'enemy' | 'aeon'>();
  readonly camera: CameraPort;
  readonly vfx: VfxPort;

  constructor(party: CombatantId[] = ['tidus', 'yuna'], enemies: CombatantId[] = ['seymour-flux']) {
    for (const id of party) {
      this.actors.set(id, new FakeActor(id, this.calls));
      this.sides.set(id, 'party');
    }
    for (const id of enemies) {
      this.actors.set(id, new FakeActor(id, this.calls));
      this.sides.set(id, 'enemy');
    }

    const calls = this.calls;
    // `rigName` tracks the last rig asked for, because `BattleMoments.impact`
    // only cuts when the target's rig is not the one already on screen.
    this.camera = {
      rigNames: ['intro', 'idle', 'action', 'victory', 'enemy', 'party'],
      rigName: 'idle',
      async moveTo(rig: string): Promise<void> {
        calls.push(`camera:${rig}`);
        (this as { rigName: string }).rigName = rig;
      },
      snapTo(rig: string): void {
        calls.push(`camera!:${rig}`);
        (this as { rigName: string }).rigName = rig;
      },
      shake(): void {
        calls.push('camera:shake');
      },
      async punch(): Promise<void> {
        calls.push('camera:punch');
      },
      async push(fraction?: number): Promise<void> {
        calls.push(`camera:push${fraction === undefined ? '' : `=${fraction.toFixed(2)}`}`);
      },
      async release(): Promise<void> {
        calls.push('camera:release');
      },
      async roll(deg?: number): Promise<void> {
        calls.push(`camera:roll=${deg ?? 0}`);
      },
    };

    this.vfx = {
      async play(key: string, at: CombatantId | 'screen'): Promise<void> {
        calls.push(`vfx:${key}@${at}`);
      },
      async impact(at: CombatantId, o): Promise<void> {
        calls.push(`impact:${at}${o?.crit ? ':crit' : ''}`);
      },
      screenFlash(): void {
        calls.push('screenFlash');
      },
    };
  }

  actor(id: CombatantId): ActorHandle | undefined {
    return this.actors.get(id);
  }
  sideOf(id: CombatantId): 'party' | 'enemy' | 'aeon' | undefined {
    return this.sides.get(id);
  }
  staged(): CombatantId[] {
    return [...this.actors.keys()];
  }
  project(id: CombatantId): Point2 | null {
    return this.actors.has(id) ? { x: 100, y: 100 } : null;
  }
  async setArt(id: CombatantId, artId: string): Promise<void> {
    this.calls.push(`setArt:${id}=${artId}`);
  }
  async addCombatant(
    id: CombatantId,
    opts: { artId: string; side: 'party' | 'enemy' | 'aeon'; slot: number },
  ): Promise<ActorHandle | undefined> {
    this.calls.push(`add:${id}=${opts.artId}`);
    const actor = new FakeActor(id, this.calls);
    this.actors.set(id, actor);
    this.sides.set(id, opts.side);
    return actor;
  }
  removeCombatant(id: CombatantId): void {
    this.calls.push(`remove:${id}`);
    this.actors.delete(id);
    this.sides.delete(id);
  }
}

export class FakeDamageNumbers implements DamageNumbersPort {
  readonly shown: Array<Parameters<DamageNumbersPort['show']>[0]> = [];
  show(n: Parameters<DamageNumbersPort['show']>[0]): void {
    this.shown.push(n);
  }
  clear(): void {
    this.shown.length = 0;
  }
}

export class FakeMessageBar implements MessageBarPort {
  readonly lines: Array<{ text: string; kind: MessageKind }> = [];
  show(text: string, kind: MessageKind): void {
    this.lines.push({ text, kind });
  }
  clear(): void {}
}

export class FakeAudio implements AudioPort {
  readonly cues: string[] = [];
  readonly music: string[] = [];
  /**
   * The `fade` (or `stopMusic` argument) each `playMusic`/`stopMusic` call
   * received, in call order, paired with `music` by index. `PlayMusicOptions`
   * / `stopMusic` are documented in **seconds**
   * (`src/audio/AudioManager.ts`) — a caller that forwards an
   * authored-in-milliseconds fade unconverted is the PR-0089 bug this records.
   */
  readonly fades: Array<number | undefined> = [];
  /** Keys this bank does not have, so the fallback path can be exercised. */
  unknown = new Set<string>();

  playSfx(key: string): void {
    if (this.unknown.has(key)) throw new Error(`unknown sfx ${key}`);
    this.cues.push(key);
  }
  playMusic(key: string, opts?: { fade?: number }): void {
    this.music.push(key);
    this.fades.push(opts?.fade);
  }
  stopMusic(fade?: number): void {
    this.music.push('stop');
    this.fades.push(fade);
  }
}

export class FakeCutscenes implements CutsceneRunnerPort {
  readonly played: StoryScript[] = [];
  async play(script: StoryScript): Promise<void> {
    this.played.push(script);
  }
}

/** A HUD that records traffic and answers `chooseCommand` from a queue. */
export class FakeHud implements HudPort {
  readonly events: BattleEvent[] = [];
  readonly syncs: number[] = [];
  mounted = false;
  visible = true;
  /** Commands handed out by `chooseCommand`, in order. */
  queue: Array<Parameters<HudPort['chooseCommand']> extends unknown ? unknown : never> = [];
  /** Minigame outcomes handed out by `openMinigame`, in order. */
  minigameResults: unknown[] = [];
  readonly minigamesOpened: string[] = [];

  mount(): void {
    this.mounted = true;
  }
  unmount(): void {
    this.mounted = false;
  }
  sync(state: BattleState): void {
    this.syncs.push(state.log.length);
  }
  async chooseCommand(): Promise<never> {
    const next = this.queue.shift();
    if (next === undefined) throw new Error('FakeHud: no queued command');
    return next as never;
  }
  onEvent(event: BattleEvent): void {
    this.events.push(event);
  }
  async openMinigame(kind: string): Promise<never> {
    this.minigamesOpened.push(kind);
    const next = this.minigameResults.shift();
    if (next === undefined) throw new Error('FakeHud: no queued minigame result');
    return next as never;
  }
  setVisible(v: boolean): void {
    this.visible = v;
  }
  setProjector(): void {}
}

/** Instant sleep, so a test plays a whole battle in microseconds. */
export const noSleep = (): Promise<void> => Promise.resolve();
