import { Vector3, type Group, type Object3D } from 'three';
import { PaintedActor } from '../engine/PaintedActor.ts';
import { findFigure, type StagedFigure } from './cavern-stolen-fayth-cast.ts';
import { HELD_MARK } from '../engine/BattlePresenterDepartures.ts';

// ---------------------------------------------------------------------------
// Cloister 100: the kill link, where Trema destroys Paragon (FFX-2 only)
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. `research/ffx2-trema.md` §2 step 2
// ([verified: 3 sources]): Paragon falls, the old man from Cloister 0 appears,
// destroys Paragon "in quite an impressive scene", and his own battle starts.
// Bailey said yes to staging it as a short scene (O-2 yes, 2026-09-25); the
// picked strip is `docs/concepts/chapters/trema/INSTALLED.md` "The link":
//
//   1. Paragon is beaten, still standing and dimmed (the presenter's `'held'`
//      departure, `src/engine/BattlePresenterDepartures.ts`);
//   2. the old man appears in his cast pose and breaks Paragon into pyreflies
//      (the engine's own pyrefly dissolve on Paragon's staged figure);
//   3. Paragon is motes, and Trema takes the boss spot.
//
// **Our staging**, labelled: breaking Paragon into pyreflies, where the old
// man stands, and every timing below. No source gives them.
//
// How it is started: Paragon must be beaten and held (the presenter marks the
// figure, `HELD_MARK`), and the link seam (`paragon-falls`, `src/story/scripts/
// ffx2-trema.ts`) cuts to the `trema-link` rig; the first frame rendered from
// there starts the beat, as the Cavern's arrival starts on its intro shot. So
// **with no Paragon link (option 2, Trema alone) nothing starts it**: no
// Paragon is ever staged, no seam plays, and this module stays idle. Under
// the skip speed no seam plays either, and the stage's re-staging for Trema's
// link simply removes Paragon.
//
// What it writes, and only on Chapter XIII's own figures: Paragon's flash,
// shake, dissolve and alpha. The old man of the beat is the scene's own prop
// (Trema's `cast` painting, then his `idle`), never a combatant; it steps out
// the moment the battle stages the real Trema.

/** The beat's timeline, ms at 1x. Ours (see the header). */
export const LINK_MS = {
  appear: 600, // the old man fades in, cast pose
  strike: 700, // Paragon flashes and shakes
  breakAt: 950, // Paragon comes apart into pyreflies
  breakFor: 1500,
  walkAt: 2600, // he lowers his hand and walks to the boss spot
  walkFor: 1400,
} as const;
/** The whole beat. */
export const LINK_TOTAL_MS = LINK_MS.walkAt + LINK_MS.walkFor;
/** The engine's pyrefly colour for a sent fiend (`BattlePresenterBeats.ts` `ko()`). */
export const PYREFLY_GREEN = 0x9dffc4;
/** How near the camera must be to the link rig's position for the beat to start, world units. */
export const LINK_CAMERA_NEAR = 1.2;

export interface CloisterLinkOptions {
  /** Where the old man appears: right of Paragon, on the far side of the party. */
  sideSpot: [number, number, number];
  /** The boss spot, where he stops (the staged Trema takes it next). */
  bossSpot: [number, number, number];
  /** His world height, the stage's figure height for Trema. */
  tremaHeight: number;
  /** The link rig's camera position. */
  cameraAt: [number, number, number];
  /** Names of the staged figures: Paragon's and Trema's combatant ids. */
  paragonIds: readonly string[];
  tremaIds: readonly string[];
}

/** What the beat does at `ms` into it: pure, so a test can read the timeline without a GPU. */
export function linkAt(ms: number): { prop: number; walk: number; strike: boolean; breakStart: boolean; done: boolean } {
  const clamp = (v: number): number => Math.max(0, Math.min(1, v));
  const walk = clamp((ms - LINK_MS.walkAt) / LINK_MS.walkFor);
  return {
    prop: clamp(ms / LINK_MS.appear),
    walk: walk * walk * (3 - 2 * walk),
    strike: ms >= LINK_MS.strike,
    breakStart: ms >= LINK_MS.breakAt,
    done: ms >= LINK_TOTAL_MS,
  };
}

/**
 * Is `figure` beaten and still standing, for the beat to break? The presenter's `'held'`
 * departure marks it ({@link HELD_MARK}); a Paragon that is only fading in, or still fighting,
 * never starts the beat, whatever the camera does.
 */
function beatenAndStanding(figure: StagedFigure | null): figure is StagedFigure {
  return Boolean(figure && figure.userData[HELD_MARK] === true && figure.visible !== false && (figure.alpha ?? 1) > 0.05);
}

/** The kill link. Build once per scene; call {@link update} every frame. */
export class CloisterLink {
  private prop: PaintedActor | null = null;
  private ms = -1;
  private paragon: StagedFigure | null = null;
  private struck = false;
  private broken = false;
  private readonly from: Vector3;
  private readonly to: Vector3;
  private readonly cam: Vector3;

  constructor(
    private readonly group: Group,
    private readonly opts: CloisterLinkOptions,
  ) {
    this.from = new Vector3(...opts.sideSpot);
    this.to = new Vector3(...opts.bossSpot);
    this.cam = new Vector3(...opts.cameraAt);
  }

  /** Load the prop (never rejects: a missing painting is a grey stand-in, which stays hidden). */
  async load(): Promise<void> {
    const prop = await PaintedActor.fromSubject('trema', {
      name: 'trema-link-prop',
      worldHeight: this.opts.tremaHeight,
      facing: -1,
      states: ['idle', 'cast'],
      initialPose: 'cast',
      crossfadeMs: 200,
      breathe: { amplitude: 0.012, speed: 0.3 },
    });
    prop.setAlpha(0);
    prop.visible = false;
    prop.position.copy(this.from);
    this.group.add(prop);
    this.prop = prop;
  }

  /** True while the beat is playing. */
  get playing(): boolean {
    return this.ms >= 0;
  }

  /** The camera rendered this frame from `position`: start when it is on the link rig. */
  cameraAt(position: Vector3): void {
    if (this.ms >= 0 || !beatenAndStanding(this.paragon)) return;
    if (position.distanceTo(this.cam) < LINK_CAMERA_NEAR) this.start();
  }

  /** Start now (the camera probe, or a test). */
  start(): void {
    this.ms = 0;
    this.struck = false;
    this.broken = false;
    if (this.prop) {
      this.prop.position.copy(this.from);
      this.prop.setPose('cast', { immediate: true });
      this.prop.visible = true;
    }
  }

  /** @param dt seconds; `root` is the three.js scene the stage parents its figures in. */
  update(dt: number, root: Object3D | null): void {
    this.prop?.update(dt);
    const seenParagon = this.firstOf(root, this.opts.paragonIds);
    if (seenParagon && seenParagon !== this.paragon) this.paragon = seenParagon; // a new fight on this field
    const trema = this.firstOf(root, this.opts.tremaIds);
    if (trema) {
      // The battle has staged the real Trema: the prop steps out.
      this.stop();
      return;
    }
    if (this.ms < 0) return;
    this.ms += dt * 1000;
    const f = linkAt(this.ms);
    const p = this.paragon;
    if (f.strike && !this.struck && p) {
      this.struck = true;
      (p as StagedFigure & { flash?(c: number, ms: number, peak: number): void }).flash?.(0xdfe8ff, 420, 1);
      (p as StagedFigure & { shake?(a: number, ms: number): void }).shake?.(0.18, 520);
    }
    if (f.breakStart && !this.broken && p) {
      this.broken = true;
      void (p as StagedFigure & { dissolveTo?(v: number, ms: number, c: number): Promise<void> }).dissolveTo?.(1, LINK_MS.breakFor, PYREFLY_GREEN);
    }
    if (this.prop) {
      this.prop.setAlpha(f.prop);
      if (f.walk > 0) {
        if (this.prop.pose !== 'idle') this.prop.setPose('idle');
        this.prop.position.lerpVectors(this.from, this.to, f.walk);
      }
    }
    if (f.done) {
      this.paragon?.setAlpha?.(0);
      this.ms = -2; // finished: hold on the boss spot until the real Trema is staged
    }
  }

  /** Hide the prop and forget the beat. */
  stop(): void {
    this.ms = -1;
    if (this.prop) {
      this.prop.setAlpha(0);
      this.prop.visible = false;
    }
  }

  dispose(): void {
    this.prop?.removeFromParent();
    this.prop?.dispose();
    this.prop = null;
  }

  private firstOf(root: Object3D | null, ids: readonly string[]): StagedFigure | null {
    for (const id of ids) {
      const f = findFigure(root, id);
      if (f) return f;
    }
    return null;
  }
}
