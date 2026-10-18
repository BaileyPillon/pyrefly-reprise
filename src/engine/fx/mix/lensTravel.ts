import type { PerspectiveCamera } from 'three';
import { battleCanvas } from './hudPanels.ts';
import type { RigWatch } from './rigWatch.ts';

/**
 * CHAPTER FRAMING's lens shift and its travel (moved out of `framing.ts`, which the opening's wait for the first plan would have taken past the 400-line rule; behaviour unchanged).
 *
 * The master's static lens shift is put on the camera as a view offset. It does not jump with the master: it travels from the last master's with the camera's move onto the new one, and a move
 * that takes over half way carries it on from where it is (never back to the start). `to` is the shift the plan on screen wants.
 */
export class LensTravel {
  to: [number, number] = [0, 0];
  /** Where the travel to `to` started (the last commit, or a later move that took over). */
  private from: [number, number] = [0, 0];
  /** The shift last put on screen, and the camera move it was travelling with. */
  private shown: [number, number] = [0, 0];
  private seq = -1;
  private applied = false;

  constructor(private readonly cam: PerspectiveCamera, private readonly rigs: RigWatch | null) {}

  /** The lens shift on screen now: the last master's, travelling to this one's with the camera's move onto it. */
  now(): [number, number] {
    const r = this.rigs;
    const p = r?.sinceInstall() ?? 1;
    if (r && p < 1 && r.moveSeq !== this.seq) {
      this.seq = r.moveSeq;
      this.from = [this.shown[0], this.shown[1]];
    }
    this.shown = [this.from[0] + (this.to[0] - this.from[0]) * p, this.from[1] + (this.to[1] - this.from[1]) * p];
    return this.shown;
  }

  /** A plan lands with shift `to` (the travel starts from what is on screen); true when the shift moves by more than half a pixel. */
  start(to: [number, number], moveSeq: number): boolean {
    this.from = this.applied ? [...this.now()] : [0, 0];
    this.shown = [this.from[0], this.from[1]];
    this.seq = moveSeq;
    this.to = to;
    return Math.abs(to[0] - this.from[0]) + Math.abs(to[1] - this.from[1]) > 0.5;
  }

  /**
   * The master's lens shift on the camera (call after any held shot has been written). `on`: the part plays and its plan is up. `hold`: the lens shift a
   * held shot was framed against, which stays on screen for as long as the shot does (a shot is one static cut).
   */
  apply(on: boolean, hold: readonly [number, number] | null = null): void {
    const canvas = battleCanvas();
    const lens = hold ?? this.now();
    const want = on && (lens[0] !== 0 || lens[1] !== 0) && !!canvas;
    if (want && canvas) {
      const r = canvas.getBoundingClientRect();
      const W = r.width || window.innerWidth;
      const H = r.height || window.innerHeight;
      this.cam.setViewOffset(W, H, -lens[0], -lens[1], W, H);
      this.applied = true;
    } else if (this.applied) {
      this.cam.clearViewOffset();
      this.applied = false;
    }
  }
}
