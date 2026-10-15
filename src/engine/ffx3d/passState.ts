/**
 * **The game's own render state for a material** (the hidden Fayth chapter's `ffx` skin; FFX only; `docs/plans/fayth-3d.md`). The converter reads it from each material's effect variant (the shader cluster's
 * first scene render pass: `D:\Tools\ffx-parity\assets\tools\phyre2gltf\material_state.py`) and writes it to the glTF material's `extras.ffx.pass`, which three.js keeps in `material.userData.ffx.pass`.
 * Bailey's own converted files only; nothing from them is quoted here.
 *
 * What the state says, and what this file does with it:
 *
 * - **Blend.** A variant with the `ALPHA_ENABLED` switch draws its forward pass alpha blended (source alpha, one minus source alpha, add, depth test and depth write on), and its pixel shader also discards
 *   below the material's alpha threshold. The glb alone said MASK, so Evrae's wing membrane (atlas alpha 0.5 to 0.75 over a 0.41 threshold) was drawn opaque magenta. In three that is `transparent: true` with the
 *   material's `alphaTest` kept: survivors of the cut-out are blended with their own alpha. A variant without the switch is opaque and a MASK on it is a plain cut-out. Additive state (one, one) is mapped for
 *   completeness; the Evrae set has none.
 * - **Cull.** Every actor and weapon material is single sided (D3D11 `CullMode` FRONT with `FrontCounterClockwise` off, which draws the counter-clockwise triangles: glTF's front face, three's `FrontSide`); the
 *   stage is too except the variants with the `DOUBLE_SIDED` switch (`CullMode` NONE). The converter's own guess had been double sided for every mask and every stage material.
 * - **A mirrored mesh.** The `ffx` skin draws the deck's meshes mirrored in y (`shapeStage`, `FFX_STAGE_PARTS`). three.js keeps "counter-clockwise in the mesh's own space is the front" under a mirror, so a
 *   state that the game applies to the file's triangles as they are would, on a mirrored mesh, draw the other set; {@link sideOf} takes `mirrored` to swap FRONT and BACK for it.
 *
 * Pure `three` types and numbers: no DOM, no loader. Game case: FFX only (the files are FFX's).
 */

import { AdditiveBlending, BackSide, DoubleSide, FrontSide, NormalBlending, type MeshBasicMaterial, type Side } from 'three';

export type CullState = 'NONE' | 'FRONT' | 'BACK';

/** The blend a pass states, in D3D11's own words (`SRC_ALPHA`, `INV_SRC_ALPHA`, `ONE`, `ADD`, ...). */
export interface BlendState {
  readonly src: string;
  readonly dst: string;
  readonly op: string;
}

/** The part of the forward pass's state the skin draws with. */
export interface PassState {
  /** The scene render pass the state was read from (`Opaque`, `Transparent`). */
  readonly type: string;
  readonly cull: CullState;
  /** Null when the pass does not blend. */
  readonly blend: BlendState | null;
  readonly depthTest: boolean;
  readonly depthWrite: boolean;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const CULLS: ReadonlySet<string> = new Set(['NONE', 'FRONT', 'BACK']);

/** The state in a material's `userData` (`{ ffx: { pass: {...} } }`, as three.js keeps a glTF material's extras), or null when it is not there or not of the right shape. */
export function passStateOf(userData: unknown): PassState | null {
  const ffx = isRecord(userData) ? userData['ffx'] : undefined;
  const raw = isRecord(ffx) ? ffx['pass'] : undefined;
  if (!isRecord(raw)) return null;
  const { type, cull, blend, depthTest, depthWrite } = raw;
  if (typeof type !== 'string' || typeof cull !== 'string' || !CULLS.has(cull)) return null;
  if (typeof depthTest !== 'boolean' || typeof depthWrite !== 'boolean') return null;
  let blendState: BlendState | null = null;
  if (blend !== null && blend !== undefined) {
    if (!isRecord(blend) || typeof blend['src'] !== 'string' || typeof blend['dst'] !== 'string' || typeof blend['op'] !== 'string') return null;
    blendState = { src: blend['src'], dst: blend['dst'], op: blend['op'] };
  }
  return { type, cull: cull as CullState, blend: blendState, depthTest, depthWrite };
}

/** The three.js side a cull state draws: NONE is both, FRONT the counter-clockwise front (`FrontSide`), BACK the other (`BackSide`); `mirrored` swaps the last two (see the file header). */
export function sideOf(cull: CullState, mirrored = false): Side {
  if (cull === 'NONE') return DoubleSide;
  return (cull === 'FRONT') !== mirrored ? FrontSide : BackSide;
}

/** Whether the state's blend is the plain alpha blend (`SRC_ALPHA`, `INV_SRC_ALPHA`, `ADD`). */
export const isAlphaBlend = (b: BlendState | null): boolean => b !== null && b.src === 'SRC_ALPHA' && b.dst === 'INV_SRC_ALPHA' && b.op === 'ADD';

/** Whether the state's blend adds the source on top (`ONE`, `ONE`, `ADD`). */
export const isAdditive = (b: BlendState | null): boolean => b !== null && b.src === 'ONE' && b.dst === 'ONE' && b.op === 'ADD';

/**
 * Put `state` on a material: its side, whether it blends (and how), whether it writes and tests depth. The cut-out threshold (`alphaTest`) is left as the file's. A null state changes nothing, so a file
 * converted before the state was written, or a hand-made material, draws as it did. `mirrored`: the mesh is drawn mirrored (see the file header).
 */
export function applyPassState(material: MeshBasicMaterial, state: PassState | null, opts: { mirrored?: boolean } = {}): void {
  if (!state) return;
  material.side = sideOf(state.cull, opts.mirrored === true);
  material.depthTest = state.depthTest;
  material.depthWrite = state.depthWrite;
  if (state.blend) {
    material.transparent = true;
    material.blending = isAdditive(state.blend) ? AdditiveBlending : NormalBlending;
  } else {
    material.transparent = false;
    material.blending = NormalBlending;
  }
}
