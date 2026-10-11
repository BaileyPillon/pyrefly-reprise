/**
 * **What a camera program may ask of the world**, and the one source of randomness it may draw from.
 *
 * FFX's camera scripts are not self-contained: most spell shots are framed around live characters (`refSetBtlPolar(-3, ...)` is "the targets, raised by this fraction of their height"), the default
 * views branch on a property of Evrae (`readBtlChrProperty(20, 30)`, how far the airship has pulled back), and the shot a spell gets is chosen with a random draw. The replayer (`./vm.ts`,
 * `./solver.ts`) asks all of that through {@link CameraHost}, so it knows nothing of our battle engine: the scene's director (`./director.ts`) answers from the fight in front of it
 * (`./formation.ts`), and a test answers from a table.
 *
 * - **Selectors** are FFX's way of naming a group of characters: a character number, -2 "the acting one", -3 "the targets", -15 "all monsters"... {@link CameraHost.select} turns one into character
 *   numbers when a recipe is set (SPEC 7.3).
 * - **Frames** ({@link ActorFrame}) are the four things a recipe reads of a character, in FFX units: where its aim point is, which way it faces, and how tall and wide it frames.
 * - **Queries** are every other question a program asks (the chosen command, whether the target reflects, the battle number). A name the host does not know answers `undefined`; the VM logs it once
 *   and carries on with 0.
 * - **Randomness is the presentation's own.** FFX draws a camera shot from its battle RNG streams (14 for the spell shots, 2 for Cid's missiles and the victory cut, shared with the AI); the replay
 *   must not, or watching a fight with the FFX camera would change the fight. {@link PresentationRandom} is a seeded generator of the camera's own, one stream per FFX stream number: the same
 *   algorithm as the battle's (`SeededRng`, mulberry32) in instances of its own, sharing no state with any battle's, and nothing in this folder calls `Math.random`. The same seed gives the same shots.
 *
 * Pure: no DOM, no `three`. Game case: FFX only.
 */

import { SeededRng } from '../../battle/common/rng.ts';
import type { Vec3 } from './ir.ts';

/** What a character-relative shot reads of one character, in FFX units (Y down); `heading` in radians, forward = (cos h, 0, sin h). */
export interface ActorFrame {
  /** The aim point the shot is centred on (the character's chest, not its feet). */
  readonly pos: Vec3;
  readonly heading: number;
  /** The model's extent times the actor's scale: how tall it frames (`camHeight`). */
  readonly height: number;
  /** ...and how wide (`camWidth`). */
  readonly width: number;
}

/** The two things the solver needs to frame characters. */
export interface WorldView {
  /** The characters a selector names, resolved when a recipe is set (SPEC 7.3). Unknown selectors name nobody. */
  select(selector: number): readonly number[];
  /** One character's frame, or undefined when it is not on the field (a recipe skips it). */
  actor(chr: number): ActorFrame | undefined;
}

export interface CameraHost extends WorldView {
  /** Every value query that is not the VM's own. `undefined`: the host does not know the name. */
  query(name: string, args: readonly number[]): number | undefined;
  /** A raw non-negative 31-bit draw from FFX stream `stream` (14 + (n & 1) for `camRand(n)`, 2 for `GetRandomValue`). Programs apply their own `mod`. */
  random(stream: number): number;
  /** A program wrote a character property (`writeBtlChrProperty(selector, property, value)`: 216 is "visible to the camera"). Optional; ignored when absent. */
  write?(selector: number, property: number, value: number): void;
}

/**
 * The camera's own seeded random source: one {@link SeededRng} per stream number, each derived from the seed, so a stream's draws do not depend on what the others drew. Separate from the battle's
 * generator by construction: these are instances of its own and the battle never sees them.
 */
export class PresentationRandom {
  private readonly streams = new Map<number, SeededRng>();
  private readonly counts = new Map<number, number>();

  constructor(readonly seed: number) {}

  /** A raw non-negative 31-bit integer from `stream`. */
  next(stream: number): number {
    let rng = this.streams.get(stream);
    if (!rng) {
      rng = new SeededRng((Math.trunc(this.seed) ^ Math.imul(stream + 1, 0x9e3779b1)) >>> 0);
      this.streams.set(stream, rng);
    }
    this.counts.set(stream, (this.counts.get(stream) ?? 0) + 1);
    return Math.floor(rng.next() * 2147483648);
  }

  /** How many draws `stream` has made (a test's proof of what drew and what did not). */
  drawsOf(stream: number): number {
    return this.counts.get(stream) ?? 0;
  }

  /** How many draws all streams have made together. */
  get draws(): number {
    let n = 0;
    for (const c of this.counts.values()) n += c;
    return n;
  }
}
