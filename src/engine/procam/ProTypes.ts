/**
 * Types of the PRO CAMERA (`?camera=pro`, conference demo, lane "pro-camera", 2026-10-23). Pure: no `three`, no DOM, no imports. Game case: shared plumbing (both games); the shots in
 * `data/procam/proShots.ts` are FFX Chapter I's, the follower is FFX-2 Chapter IV's.
 *
 * Vocabulary: a {@link Pose} is where the camera stands (eye, look-at, lens, roll), in world metres. A {@link ProRun} is one thing the camera does: a function of time that answers a pose, given the
 * pose the game's own camera is settled on (the {@link Pose} `base`), plus how it blends in from where the camera was and out to where the game's camera is. The layer (`ProLayer.ts`, the only
 * part that touches `three`) plays one run at a time on top of `BattleCamera`; the director (`ProDirector.ts`, the `ShotDirector` the battle moments ask) decides which run each beat gets.
 */

export type V3 = readonly [number, number, number];

/** Where the camera stands. `fov` is the vertical field of view in degrees, `roll` the dutch angle in degrees. */
export interface Pose {
  readonly pos: V3;
  readonly look: V3;
  readonly fov: number;
  readonly roll: number;
}

export type EaseName = 'linear' | 'cosine' | 'cubic' | 'outCubic' | 'inCubic' | 'outQuad' | 'outSine' | 'inOutSine' | 'outExpo';

/** `[t ms, eye x y z, look x y z, fov, roll, ease]`, ease 0 = cut (hold the last key until this one), 1 = linear, 2 = cosine. */
export type KeyRow = readonly [number, number, number, number, number, number, number, number, number, 0 | 1 | 2];

/** The pair a shot was laid for: the actor's feet `A`, the target's feet `T`, the actor's height `H`. `mirror` says the real shot looked from the other side. */
export interface ShotDesign {
  readonly A: V3;
  readonly T: V3;
  readonly H: number;
  readonly mirror: boolean;
  readonly scope: 'pair' | 'arena';
}

/** One real camera shot on our stage (generated: `data/procam/proShots.ts`). */
export interface ProShotRow {
  readonly id: string;
  readonly ms: number;
  readonly weight: number;
  readonly status: 'PROVEN' | 'DECODED' | 'INFERRED';
  readonly design: ShotDesign;
  readonly keys: readonly KeyRow[];
}

/** The FFX-2 auto camera's decoded constants and ranked candidates (generated). */
export interface ProAutoCamera {
  readonly focus: V3;
  readonly homeAzimuthDeg: number;
  readonly lensDeg: number;
  readonly follower: { readonly focusGain: number; readonly angGain: number; readonly angCapDeg: number; readonly radGain: number };
  readonly idle: { readonly initSteps: number; readonly uniformMax: number; readonly repickAtOrAbove: number };
  readonly cands: ReadonlyArray<{ readonly eye: V3; readonly azDeg: number; readonly elDeg: number; readonly fitM: number }>;
}

/** Keep these figures inside a safe rectangle of the frame (NDC half-extents): `ids` may name a height band, `bahamut@0-0.8` = from the feet to 0.8 of the height. */
export interface ProFit {
  readonly ids: readonly string[];
  readonly safe: { readonly x: number; readonly y: number };
  /** The most the eye may back away (times the distance to the aim); default 1.8. A 5 m aeon's close shot asks for more. */
  readonly maxK?: number | undefined;
  /** Stand the middle of these figures here (NDC) and fit their union inside `safe` half-extents about it, not about the screen's centre: a frame that leaves the HUD's corner free (the victory). */
  readonly to?: { readonly x: number; readonly y: number } | undefined;
}

/** What the camera does for a while. */
export interface ProRun {
  /** For logs, tests and the debug surface. */
  readonly id: string;
  /** The pose at `tMs` (since the run began, at the run's rate), given the pose the camera rests on. Pure on its arguments plus whatever it captured when it was built. */
  sample(tMs: number, base: Pose): Pose;
  /** Blend from where the camera was over `inMs` (0 = a cut), eased. */
  readonly inMs: number;
  readonly inEase: EaseName;
  /** Blend back to the game's own camera over `outMs` when stopped (0 = a cut), eased. */
  readonly outMs: number;
  readonly outEase: EaseName;
  /** Never crop: dolly back along the view until these figures sit inside the safe rectangle. */
  readonly fit?: ProFit | undefined;
  /** Lens breathing: the lens swells and relaxes by this many degrees over about 4.2 s. */
  readonly breathe?: number | undefined;
  /** Stop on its own after this many ms. */
  readonly maxMs?: number | undefined;
  /** Playback rate (1 normal, 2 twice as fast); 0 holds the first pose. */
  readonly rate?: number | undefined;
  /** How much of the rig's idle sway stays on (0..1; default 0.5). */
  readonly sway?: number | undefined;
  /** The soft background: focus on these figures (the layer publishes it for the depth-of-field pass). */
  readonly focus?: readonly string[] | undefined;
  /** The director tells a run a thing happened in the action it belongs to: the blow landed (`impact`), the blow kills (`kill`). A run may ignore it. */
  onEvent?(name: 'impact' | 'kill'): void;
}

/**
 * The soft background of a directed shot (`?camdof=`, on with the camera): the tilt-shift band aimed at the shot's focus figures, in the screen's own units (0 = bottom of the frame, 1 = top),
 * and how much of it is up (0..1: the shot's blend in and out). The MAX mix's depth-of-field part (`fx/mix/MaxMix.ts`) blends its own band toward this one and draws it with the pass it already has.
 */
export interface ProBand {
  readonly focus: number;
  readonly width: number;
  /** The blur radius at the frame's far edge, device pixels. */
  readonly blur: number;
  readonly weight: number;
}

/** What the layer hands `BattleCamera` each frame: the pose to draw and how much idle sway to keep. */
export interface LayerOut {
  readonly pose: Pose;
  readonly sway: number;
}

/** The hook `BattleCamera` calls once a frame, after its own damping and before it draws: answer the pose to draw, or null to leave the rig's. */
export interface CameraLayer {
  step(dt: number, base: Pose, aspect: number): LayerOut | null;
}

/** The part of the camera a director talks to (`CameraPort.pro`). */
export interface ProCamPort {
  /** Start a run now (from where the camera is, blended by the run's `inMs`). Replaces the run in flight. */
  play(run: ProRun): void;
  /**
   * Blend back to the game's own camera over `outMs` (default the run's own). A cut when 0. The comfort rule may turn a big way home into a cut or stretch it to the speed cap; `exact` plays it
   * as asked (the FFX-2 target frame settles in 320 ms whatever the shot was, D-357; so does the playtest key's flip-off).
   */
  stop(outMs?: number, exact?: boolean): void;
  /** The switch the layer asks every frame: while it answers false a run in flight is stopped (the playtest key `;` flipped off mid-shot). Null: no gate. */
  setGate(gate: (() => boolean) | null): void;
  /** Is a run playing or blending out? */
  readonly active: boolean;
  /** The frame's width over its height. */
  readonly aspect: number;
  /** The id of the run in flight, or null. */
  readonly runId: string | null;
  /** Install (or clear) the ambient adjustment of the rig itself: the FFX-2 follower. It runs every frame the layer does. */
  setAmbient(fn: ((dt: number, base: Pose) => Pose) | null): void;
  /** The never-crop dolly factor this pose needs to keep these figures inside the safe rectangle (1 = none), over the figures' boxes the stage published. */
  fitK(pose: Pose, fit: ProFit): number;
  /** The figures' world boxes as the stage publishes them (for the director's own framing choices). */
  boxOf(id: string): { readonly x0: number; readonly x1: number; readonly y0: number; readonly y1: number; readonly z0: number; readonly z1: number } | null;
}
