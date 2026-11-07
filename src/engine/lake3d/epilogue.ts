/**
 * **The ice break** (the hidden Wendigo chapter's epilogue; FFX only): what happens on the lake after the win. The source is the field event (`research/re-ffx-wendigo-lake-macalania.md` RE 2): a **magic effect** plays, the
 * **twelve ice layers are hidden**, the camera **shakes twice**, the screen **fades to white** and the party is warped to the lake bottom. No text (CW15). The battle screen plays it (`../../scenes/wendigo-lake.ts`): the story's
 * post scene is a separate screen over a painted plate and owns no 3D scene, so the break is held inside the battle, at the close of the action that fells the last foe (`./director.ts`: that beat is awaited, so the presenter
 * waits for the break, and the victory poses and the results follow under the white). This clock is pure (`epilogueAt`, tested without a renderer):
 *
 * - **The magic effect** (0 to {@link EPILOGUE.pulseEnd}): a ring of cold light runs out from under the party across the ice and the fine cracks begin to grow, glowing, out from the same place.
 * - **The layers** (from {@link EPILOGUE.layerStart}, one every {@link EPILOGUE.layerGap}): the twelve concentric layers of the lake's ice, outermost first, each shatters cell by cell and falls as shards, showing the dark
 *   water under it (`./ice.ts`).
 * - **The shakes** (at {@link EPILOGUE.shakes}): the camera shakes twice, the second harder.
 * - **The white** (from {@link EPILOGUE.whiteFrom}): the screen fades to white (a quad of the stage's own, `./stage.ts`) and stays white until the story's post scene takes over.
 * - **Whoever stands on a layer falls with it** ({@link sinkFor}): a figure's model sinks and tilts once the ice under it is half gone (the party on the innermost layer last, as the white comes up; the Wendigo's body
 *   on its own; the painted actors keep their place, so only the bodies fall, `LakeSkin.sinkOf`).
 *
 * Game case: FFX only (the field event is FFX's). Pure: no `three`, no DOM.
 */

import { EPILOGUE, layerStarts } from './layout.ts';
import type { IceState } from './ice.ts';
import { ICE } from './iceShader.ts';

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const easeOut = (v: number): number => 1 - (1 - v) * (1 - v);

/** How far the ring of light runs, metres, by the end of the magic effect. */
export const PULSE_REACH = 44;
/** How far a figure sinks, metres, and how far it tilts (radians) once its layer is gone, and the share of its layer's fall (0..1) at which it starts to go. */
export const SINK = { down: 2.3, tilt: 0.28, from: 0.4, to: 0.95 } as const;

/** Which of the twelve layers lies under (x, z): 0 is the outermost, 11 the innermost (the shader's own bands, `./iceShader.ts`). */
export function bandOf(x: number, z: number, radius: number = ICE.radius): number {
  const k = 1 - Math.min(1, Math.hypot(x, z) / radius);
  return Math.min(ICE.layers - 1, Math.max(0, Math.floor(k * ICE.layers)));
}

/** How far a figure standing at (x, z) has fallen when the layers are at `layers`: it goes once the layer under it is half gone, faster as it goes, and tilts as it sinks. */
export function sinkFor(layers: readonly number[], x: number, z: number): { down: number; tilt: number } {
  const p = clamp01(((layers[bandOf(x, z)] ?? 0) - SINK.from) / (SINK.to - SINK.from));
  const k = p * p;
  return { down: SINK.down * k, tilt: SINK.tilt * k };
}

/** What the lake is doing `t` seconds into the epilogue. */
export interface EpilogueFrame {
  readonly ice: IceState;
  /** How many of the shakes have come due by `t`. */
  readonly shakesDue: number;
  /** How white the screen is, 0 to 1. */
  readonly white: number;
}

/** The lake at `t` seconds into the epilogue (before it: the unbroken ice). */
export function epilogueAt(t: number): EpilogueFrame {
  if (!(t > 0)) return { ice: { pulse: 0, pulseR: 0, crack: 0, layers: Array.from({ length: EPILOGUE.layers }, () => 0) }, shakesDue: 0, white: 0 };
  const run = clamp01(t / EPILOGUE.pulseEnd);
  const pulse = run < 1 ? Math.pow(1 - run, 0.7) : 0;
  const crack = easeOut(clamp01((t - 0.2) / 3.0));
  const layers = layerStarts().map((s) => clamp01((t - s) / EPILOGUE.layerFall));
  return {
    ice: { pulse, pulseR: PULSE_REACH * easeOut(run), crack, layers },
    shakesDue: EPILOGUE.shakes.filter((s) => t >= s).length,
    white: clamp01((t - EPILOGUE.whiteFrom) / (EPILOGUE.length - EPILOGUE.whiteFrom)),
  };
}

/** The clock: started when the last foe has fallen (`./director.ts`), advanced by the field's seconds, and told when each shake comes due. */
export class Epilogue {
  private t = -1;
  private fired = 0;

  /** `onShake(n)` is called once for each shake as it falls due (`n` from 0). */
  constructor(private readonly onShake: (n: number) => void = () => undefined) {}

  get running(): boolean {
    return this.t >= 0;
  }

  /** Seconds since it started, or -1 before. */
  get time(): number {
    return this.t;
  }

  start(): void {
    if (this.t < 0) {
      this.t = 0;
      this.fired = 0;
    }
  }

  /** Put the lake back (a retry builds a new scene, but a test and the debug handle reset it). */
  reset(): void {
    this.t = -1;
    this.fired = 0;
  }

  /** Advance by `dt` seconds and answer the lake now. */
  update(dt: number): EpilogueFrame {
    if (this.t < 0) return epilogueAt(0);
    this.t += Math.max(0, dt);
    const frame = epilogueAt(this.t);
    while (this.fired < frame.shakesDue) this.onShake(this.fired++);
    return frame;
  }
}
