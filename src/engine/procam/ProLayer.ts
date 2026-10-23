/**
 * The PRO CAMERA's layer: plays one {@link ProRun} at a time on top of the game's own camera (`BattleCamera.layer`), and the optional ambient adjustment of the rig itself (FFX-2's follower).
 * Pure: plain poses in, plain poses out, no `three`; `BattleCamera` applies what it answers.
 *
 * Each frame (`step`, from `BattleCamera.update`, after the rig's own damping and before it draws):
 *
 * 1. the pose the game's camera is settled on (`base`) goes through the ambient adjustment, if there is one (the follower), giving `amb`;
 * 2. with no run, `amb` is the answer (null when there is no ambient either: the game's own camera, untouched);
 * 3. with a run, its pose is `run.sample(t, amb)`, blended in from where the camera was (`inMs`), or blended out to `amb` after {@link stop} (`outMs`);
 * 4. the run may ask for the never-crop dolly ({@link fitDolly} over the figures' boxes), which only ever widens at once and relaxes at a measured rate, so nothing pops;
 * 5. lens breathing, and the idle sway the rig keeps (half of it by default).
 *
 * Time is the run's own clock: `dt` times the run's rate; the blends run on the real clock. The layer never moves the game's rig, the HUD's resting projector or the cuts of the other camera
 * systems; with no run and no ambient it answers null and `BattleCamera` draws exactly as it does without this file.
 */
import { clamp, dampK, ease, lerp, lerpPose, sub3, len3, norm3, dot3 } from './ProMath.ts';
import { dollied, fitCentred, fitDolly, placeAt, bandOf, ndcRect, type Box } from './ProFit.ts';
import type { CameraLayer, EaseName, LayerOut, Pose, ProBand, ProCamPort, ProFit, ProRun } from './ProTypes.ts';

/** The blur at the far edge of the frame while a shot keeps its figures sharp (the game's own is 6; device pixels). OURS. */
export const SHOT_BLUR = 9;

/**
 * THE COMFORT RULE for a blend in or out (D-291: "the camera movement between attacks is a bit too fast and made me a bit dizzy"; the `calm` preset caps a rig move at 20 degrees a second). A change of view
 * of up to {@link CUT_TURN} degrees, and of eye position up to {@link CUT_MOVE} of the distance to the aim, is a glide that lasts at least as long as the turn needs at {@link GLIDE_DEG_S} degrees
 * a second (its peak is about 1.6 times that on the eased curve); anything bigger is a CUT, as in the real FFX ("every return is a hard cut"; the real caster shot is a cut in as well). OURS.
 */
export const CUT_TURN = 18;
export const CUT_MOVE = 0.55;
export const GLIDE_DEG_S = 28;

/** The way home when the switch is flipped off in the middle of a shot, ms: the target frame's own settle (D-357). */
export const FLIP_OFF_MS = 320;

/** How different two poses are: the turn of the view in degrees, and the eye's travel as a fraction of the distance to the aim (at least 3 m). */
export function difference(a: Pose, b: Pose): { turn: number; move: number } {
  const da = norm3(sub3(a.look, a.pos));
  const db = norm3(sub3(b.look, b.pos));
  const turn = (Math.acos(clamp(dot3(da, db), -1, 1)) * 180) / Math.PI;
  return { turn, move: len3(sub3(a.pos, b.pos)) / Math.max(3, len3(sub3(a.look, a.pos))) };
}

/** The duration a blend of `wanted` ms really takes between these poses: 0 (a cut) when the change is too big, else at least what the turn needs at the speed cap. */
export function comfortMs(a: Pose, b: Pose, wanted: number): number {
  if (wanted <= 0) return 0;
  const d = difference(a, b);
  if (d.turn > CUT_TURN || d.move > CUT_MOVE) return 0;
  return Math.max(wanted, (d.turn / GLIDE_DEG_S) * 1000);
}

/** Where the layer finds a figure's world box (the stage fills it in; unset: nobody is known and nothing is fitted). */
export type BoxOf = (id: string) => Box | null;

/** `bahamut@0-0.8` -> the box of `bahamut` limited to 0..0.8 of its height. */
export function boxFor(boxOf: BoxOf, spec: string): Box | null {
  const m = /^([^@]+)(?:@([0-9.]+)-([0-9.]+))?$/.exec(spec);
  if (!m) return null;
  const b = boxOf(m[1]!);
  if (!b) return null;
  return m[2] !== undefined ? bandOf(b, parseFloat(m[2]), parseFloat(m[3]!)) : b;
}

export class ProLayer implements CameraLayer, ProCamPort {
  private run: ProRun | null = null;
  private state: 'run' | 'out' = 'run';
  private t = 0;
  private inT = 0;
  private from: Pose | null = null;
  private outFrom: Pose | null = null;
  private outT = 0;
  private outMs = 0;
  /** The blend's real duration, decided on its first frame by the comfort rule (null: not yet). */
  private inMsEff: number | null = null;
  private outFresh = false;
  private outExact = false;
  private gate: (() => boolean) | null = null;
  private outEase: EaseName = 'cubic';
  private last: Pose | null = null;
  private ambient: ((dt: number, base: Pose) => Pose) | null = null;
  private aspectNow: number;
  private fitSmooth = 1;
  private boxes: BoxOf = () => null;
  private weight = 0;
  /** The soft background of the shot on screen, or null (see {@link ProBand}). */
  band: ProBand | null = null;
  /** Counters for the debug surface and the frame-cost check. */
  readonly stats = { frames: 0, runs: 0, fitted: 0, widest: 1 };

  /** `aspect`: the frame's width over its height as the camera has it now, so a portrait phone is known from the first beat. */
  constructor(aspect = 16 / 9) {
    this.aspectNow = aspect;
  }

  setGate(gate: (() => boolean) | null): void {
    this.gate = gate;
  }

  /** The stage tells the layer where the figures stand (`PaintedStage`). */
  setBoxes(boxOf: BoxOf): void {
    this.boxes = boxOf;
  }

  get active(): boolean {
    return this.run !== null;
  }

  get runId(): string | null {
    return this.run?.id ?? null;
  }

  get aspect(): number {
    return this.aspectNow;
  }

  /** The pose last answered, or null (tests, the debug surface). */
  get pose(): Pose | null {
    return this.last;
  }

  /** The run's clock in ms. */
  get clock(): number {
    return this.t;
  }

  /** The figures the soft background keeps sharp and how much of it is up (0..1), or null with no run. */
  get focus(): { ids: readonly string[]; amount: number } | null {
    const r = this.run;
    return r?.focus && this.weight > 0.01 ? { ids: r.focus, amount: this.weight } : null;
  }

  setAmbient(fn: ((dt: number, base: Pose) => Pose) | null): void {
    this.ambient = fn;
  }

  boxOf(id: string): Box | null {
    return this.boxes(id);
  }

  fitK(pose: Pose, fit: ProFit): number {
    const boxes: Box[] = [];
    for (const id of fit.ids) {
      const b = boxFor(this.boxes, id);
      if (b) boxes.push(b);
    }
    return boxes.length === 0 ? 1 : fitDolly(pose, this.aspectNow, boxes, fit.safe, fit.maxK).k;
  }

  play(run: ProRun): void {
    this.from = this.last;
    this.run = run;
    this.state = 'run';
    this.t = 0;
    this.inT = 0;
    this.inMsEff = null;
    this.fitSmooth = 1;
    this.stats.runs++;
  }

  stop(outMs?: number, exact = false): void {
    const r = this.run;
    if (!r || this.state === 'out') return;
    this.outExact = exact;
    const ms = outMs ?? r.outMs;
    if (ms <= 0 || !this.last) {
      this.run = null;
      this.weight = 0;
      return;
    }
    this.state = 'out';
    this.outMs = ms;
    this.outEase = r.outEase;
    this.outFrom = this.last;
    this.outT = 0;
    this.outFresh = true;
  }

  step(dt: number, base: Pose, aspect: number): LayerOut | null {
    this.aspectNow = aspect;
    if (this.run && this.state === 'run' && this.gate && !this.gate()) this.stop(FLIP_OFF_MS, true); // the switch went off in the middle of a shot: it ends now, not whenever its last key lets go
    const amb = this.ambient ? this.ambient(dt, base) : base;
    const run = this.run;
    if (!run) {
      this.weight = 0;
      this.band = null;
      if (!this.ambient) {
        this.last = null;
        return null;
      }
      this.last = amb;
      return { pose: amb, sway: 1 };
    }
    this.stats.frames++;
    const ms = dt * 1000;
    this.t += ms * (run.rate ?? 1);
    this.inT += ms;
    if (this.state === 'run' && run.maxMs !== undefined && this.t > run.maxMs) this.stop();

    let pose: Pose;
    let w = 1;
    if (this.state === 'out') {
      if (this.outFresh) {
        this.outFresh = false;
        if (!this.outExact) this.outMs = comfortMs(this.outFrom ?? amb, amb, this.outMs); // a big way home is a cut, a small one a glide no faster than the cap
      }
      this.outT += ms;
      const u = this.outT / Math.max(1, this.outMs);
      if (u >= 1) {
        this.run = null;
        this.weight = 0;
        this.band = null;
        this.last = this.ambient ? amb : null;
        return this.ambient ? { pose: amb, sway: 1 } : null;
      }
      w = 1 - ease(this.outEase, u);
      pose = lerpPose(this.outFrom ?? amb, amb, 1 - w);
    } else {
      const raw = run.sample(this.t, amb);
      const fromPose = this.from ?? amb;
      this.inMsEff ??= comfortMs(fromPose, raw, run.inMs);
      const u = this.inMsEff <= 0 ? 1 : this.inT / this.inMsEff;
      w = u >= 1 ? 1 : ease(run.inEase, u);
      pose = u >= 1 ? raw : lerpPose(fromPose, raw, w);
      if (run.fit) pose = this.fit(pose, run, dt, w);
      if (run.breathe) pose = { ...pose, fov: pose.fov + run.breathe * Math.sin((2 * Math.PI * this.t) / 4200), roll: pose.roll + 0.18 * Math.sin((2 * Math.PI * this.t) / 6300 + 1) };
    }
    this.weight = w;
    this.last = pose;
    this.band = run.focus ? this.bandOf(pose, run.focus, w) : null;
    return { pose, sway: lerp(1, run.sway ?? 0.5, w) };
  }

  /** The tilt-shift band that keeps these figures sharp under `pose`: the middle of their union on screen, and half its height plus a margin. */
  private bandOf(pose: Pose, ids: readonly string[], weight: number): ProBand | null {
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const id of ids) {
      const b = boxFor(this.boxes, id);
      const r = b ? ndcRect(b, pose, this.aspectNow) : null;
      if (!r) continue;
      y0 = Math.min(y0, r.y0);
      y1 = Math.max(y1, r.y1);
    }
    if (!(y1 > y0)) return null;
    const mid = clamp((y0 + y1) / 4 + 0.5, 0.05, 0.95); // NDC -1..1 -> 0..1
    const half = clamp((y1 - y0) / 4 + 0.05, 0.12, 0.42);
    return { focus: mid, width: half, blur: SHOT_BLUR, weight };
  }

  /**
   * The never-crop dolly of the run's fit, widening at once and relaxing at a measured rate -- but a dolly the camera did not have a frame ago comes in with the shot's blend (`w`, 0 on its first
   * frame), so a fit never lands in one frame (the first frame of a boss's attack popped the eye 1.4 to 3.2 m). A cut (`w` 1 at once) is a cut.
   */
  private fit(pose: Pose, run: ProRun, dt: number, w: number): Pose {
    const fit = run.fit!;
    const boxes: Box[] = [];
    for (const id of fit.ids) {
      const b = boxFor(this.boxes, id);
      if (b) boxes.push(b);
    }
    if (boxes.length === 0) return pose;
    const res = fit.to ? fitCentred(pose, this.aspectNow, boxes, fit.safe, fit.to, fit.maxK) : fitDolly(pose, this.aspectNow, boxes, fit.safe, fit.maxK);
    this.fitSmooth = res.k >= this.fitSmooth ? res.k : this.fitSmooth + (res.k - this.fitSmooth) * dampK(2.5, dt);
    this.stats.fitted++;
    this.stats.widest = Math.max(this.stats.widest, this.fitSmooth);
    const k = 1 + (clamp(this.fitSmooth, 1, 4.5) - 1) * w;
    const backed = dollied(pose, k);
    return fit.to ? lerpPose(backed, placeAt(backed, this.aspectNow, boxes, fit.to), w) : backed; // a frame with a place for the figures comes in with the blend as well
  }
}
