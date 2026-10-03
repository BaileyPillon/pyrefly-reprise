import { Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Vector3, type BufferAttribute } from 'three';
import type { Backdrop } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';

// ---------------------------------------------------------------------------
// Plate wings: a painted plate that keeps filling the frame at wide windows
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only in use (Chapter XV's Den of Woe, PR-0300; the helper is plumbing). The painting plane
// is as wide as its rig table was solved for at 16:9; at 2000x1012 (1.98) or an ultrawide the establishing and
// boss shots swing the plane's own edge into frame and a black band shows beside it (the round-19 PR-0300 finding:
// the right-hand edge at 94 to 95 % of the width for the first 0.8 s of every Chapter XV link seam).
//
// A wing is the plate's outer strip mirrored out past its edge, at the same depth and with the same material
// and grade: the painting itself is untouched (an approved plate keeps its hash; only the render changes), the
// join is continuous because the strip is a reflection, and at any window the plane already filled nothing is
// drawn differently. The rigs are not moved, so no framing in the approved solve shifts.

export interface WingSpec {
  /** World width of each wing. */
  width: number;
  /** Share of the plate's own width the wing mirrors (0.16 reflects the outer 16 %). Keep it at or above `width / plateWidth` so a wing never stretches. */
  reflect?: number;
  /** Which sides get one (the left side too: a party-side rig at a wide window shows the left edge). */
  sides?: ReadonlyArray<'left' | 'right'>;
}

/**
 * Add the wings to a freshly made `backdrop` and register them with it (it disposes them). Returns the meshes.
 * A backdrop with no `backdrop-painting` mesh (never the case for `Backdrop.create`) gets none.
 */
export function addPlateWings(backdrop: Backdrop, spec: WingSpec): Mesh[] {
  const main = backdrop.group.getObjectByName('backdrop-painting') as Mesh | undefined;
  if (!main) return [];
  const geo = main.geometry as PlaneGeometry;
  const w = geo.parameters.width;
  const h = geo.parameters.height;
  const reflect = Math.min(0.5, spec.reflect ?? Math.max(0.1, spec.width / w));
  const out: Mesh[] = [];
  for (const side of spec.sides ?? ['left', 'right']) {
    const wg = new PlaneGeometry(spec.width, h);
    const uv = wg.getAttribute('uv') as BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      // The wing's own u (0 left, 1 right) runs back over the mirrored strip: the right wing reads u 1 -> 1 - reflect,
      // the left wing reads u reflect -> 0, so each is the plate's edge strip reversed.
      const t = uv.getX(i);
      uv.setX(i, side === 'right' ? 1 - reflect * t : reflect * (1 - t));
    }
    uv.needsUpdate = true;
    const mat = (main.material as MeshBasicMaterial).clone();
    const mesh = new Mesh(wg, mat);
    const dir = side === 'right' ? 1 : -1;
    mesh.position.set(main.position.x + dir * (w / 2 + spec.width / 2), main.position.y, main.position.z);
    mesh.renderOrder = main.renderOrder;
    mesh.name = `backdrop-wing-${side}`;
    backdrop.adopt(mesh);
    out.push(mesh);
  }
  return out;
}

/**
 * Where the plate's left and right edges (the painting alone, wings aside) land on screen for `rig` at `aspect`,
 * as fractions of the frame width (below 0 / above 1 means that side is covered). The worst of the top, middle and bottom
 * points of each edge: the edge is a vertical line the perspective tilts. Pure geometry, no parallax (the layers
 * sit on the same rays); the number the PR-0300 round measured (0.953) is what this gives at the intro rig.
 */
export function plateEdges(
  rig: CameraRig,
  aspect: number,
  plate: { width: number; distance: number; centreY: number; imageAspect: number },
): { left: number; right: number } {
  const cam = new PerspectiveCamera(rig.fov ?? 32, aspect, 0.1, 500);
  cam.position.set(...(rig.position as [number, number, number]));
  cam.lookAt(new Vector3(...(rig.lookAt as [number, number, number])));
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  const h = plate.width / plate.imageAspect;
  const at = (x: number, y: number): number => (new Vector3(x, y, plate.distance).project(cam).x + 1) / 2;
  const ys = [plate.centreY + h / 2, plate.centreY, plate.centreY - h / 2];
  return {
    left: Math.max(...ys.map((y) => at(-plate.width / 2, y))),
    right: Math.min(...ys.map((y) => at(plate.width / 2, y))),
  };
}
