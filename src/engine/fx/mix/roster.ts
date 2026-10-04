import type { Object3D } from 'three';
import type { Actor } from './geometry.ts';

/**
 * The MAX mix's list of the scene's painted figures (what `MaxMix` hands CHAPTER FRAMING, the held shots and the breathing rigs).
 *
 * It was rescanned on a 0.5 s timer alone, so a figure that arrived mid-fight (a Switch, a summoned aeon, a revealed fiend) stood
 * on the stage's own slot for up to half a second before the mix knew it, and then stepped into the chapter's slot in one frame
 * (r38-restage CHECK B2: Wakka after Yuna's Switch, +0.35 world units, 58 px at 1600x900, at alpha 0.56 to 1.0 in 5 of 8 tries;
 * traced: the stage added him at t, the mix's list took him 163 ms later, and his first write moved him). The list is now marked
 * stale the moment a figure is added to the scene or leaves it (three's `childadded` / `childremoved`), and rescanned on the next
 * update, which runs before the frame is drawn; the timer stays as the net for a figure added deeper in the graph.
 *
 * Presentation only (rule 1). Game case: both (shared plumbing; the slots it keeps honest are FFX only, FFX-2 never reads them).
 */

/** A painted figure (`PaintedActor`), by the three properties the mix has always read. */
export const isActor = (o: Object3D): boolean => 'worldHeight' in o && 'slots' in o && 'poseUrls' in o;

export class Roster {
  actors: Actor[] = [];
  private every = 0;
  private stale = true;
  private readonly onChange = (e: { child: Object3D }): void => {
    if (isActor(e.child)) this.stale = true;
  };

  constructor(private readonly scene: Object3D, private readonly period = 0.5) {
    // A stub scene (the screen's unit tests) may have no events: the timer alone then.
    scene.addEventListener?.('childadded', this.onChange);
    scene.addEventListener?.('childremoved', this.onChange);
  }

  /** The figures on the stage now (call every frame, before anything reads them). */
  update(dt: number): readonly Actor[] {
    this.every -= dt;
    if (this.stale || this.every <= 0 || !this.actors.length) {
      this.every = this.period;
      this.stale = false;
      const out: Actor[] = [];
      this.scene.traverse((o: Object3D) => {
        if (isActor(o)) out.push(o as unknown as Actor);
      });
      this.actors = out;
    }
    return this.actors;
  }

  dispose(): void {
    this.scene.removeEventListener?.('childadded', this.onChange);
    this.scene.removeEventListener?.('childremoved', this.onChange);
    this.actors = [];
  }
}
