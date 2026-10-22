/**
 * WRITE A SMEAR FRAME ONTO A FIGURE'S PLANES (conference demo, motion pass, lane "core", step 2; no `three` import: it writes into the uniform cells it is handed; both games).
 *
 * `ActorSmear.sample(u)` says how much smear and which way; the shader (`shaders/PaintedShader.ts`, the smear block) wants three numbers: `smearAmt`, `smearStyle` and `smearVec`, the streak at full
 * amount in the PLANE's own coordinates. The amount and the style are one shared cell for every plane (and every rig part, which shares the actor's cells); the vector depends on the plane's size and
 * on whether it is mirrored, so each plane gets its own, and the actor's shared one (which a rig's parts read) follows the plane the figure is showing.
 */
import { figureVector, type SmearFrame } from './ActorSmear.ts';

interface Cell<T> {
  value: T;
}
interface Vec2Like {
  set(x: number, y: number): unknown;
}

/** The slice of a plane `applySmear` needs. */
export interface SmearPlane {
  mesh: { scale: { x: number; y: number } };
  material: { uniforms: Record<string, Cell<unknown> | undefined> };
}

/** The actor's shared cells. */
export interface SmearCells {
  smearAmt: Cell<number>;
  smearStyle: Cell<number>;
  smearVec: Cell<Vec2Like>;
}

const scratch = { x: 0, y: 0 };

/** Write `f` onto the planes and the shared cells. `showing` is the index of the plane the figure shows (the rig parts' vector follows it). An amount of 0 turns the smear off. */
export function applySmear(f: SmearFrame, planes: readonly SmearPlane[], cells: SmearCells, showing: number): void {
  cells.smearAmt.value = f.amount;
  if (!(f.amount > 0)) return;
  cells.smearStyle.value = f.style === 'blur' ? 0 : 1;
  planes.forEach((p, i) => {
    const w = Math.abs(p.mesh.scale.x);
    const h = Math.abs(p.mesh.scale.y);
    figureVector(f, w, h, p.mesh.scale.x < 0 ? -1 : 1, scratch);
    (p.material.uniforms['smearVec']?.value as Vec2Like | undefined)?.set(scratch.x, scratch.y);
    if (i === showing) cells.smearVec.value.set(scratch.x, scratch.y);
  });
}
