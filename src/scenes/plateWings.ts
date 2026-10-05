import { Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Vector3, type BufferAttribute, type Texture } from 'three';
import type { Backdrop } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { artUrl, tryLoadTexture } from '../engine/PaintedArt.ts';

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
//
// Release 38 (D-343, Bailey 2026-10-03, "all your recommendations, godspeed"; FFX-2 only): where painted wings are
// installed (`public/art/backdrops/wings/`, set bailey:2026-10-03-picks) `paintPlateWings` swaps each mirrored strip for the
// painted one, in place: the same side, depth and render order, the same outer edge in the world (18 units from the plane),
// the painted strip laid 96 painting-pixels over the plate's own edge with its alpha ramping across that overlap. The plate
// is untouched and keeps its hash; the mirrored strip stays whenever a painted file is missing or fails to load.

/** A painted wing strip per side: the wing plus `overlapPx` of the plate's own outer edge, alpha ramping across the overlap. */
export interface PaintedWingSpec {
  /** Art paths (for `artUrl`) of the left and right strips. */
  readonly left: string;
  readonly right: string;
  /** A strip's width in the plate's own pixels (the wing plus the overlap); both are as tall as the plate. */
  readonly stripPx: number;
  /** How many of those pixels lie over the plate (the strip's alpha ramps across them). */
  readonly overlapPx: number;
  /** The plate's own width in pixels (2688 for both plates), which maps pixels to world units through the plane's width. */
  readonly plateWidthPx: number;
}

export interface WingSpec {
  /** World width of each wing. */
  width: number;
  /** Share of the plate's own width the wing mirrors (0.16 reflects the outer 16 %). Keep it at or above `width / plateWidth` so a wing never stretches. */
  reflect?: number;
  /** Which sides get one (the left side too: a party-side rig at a wide window shows the left edge). */
  sides?: ReadonlyArray<'left' | 'right'>;
  /** Painted strips that replace the mirrored ones where installed (`paintPlateWings`). */
  readonly painted?: PaintedWingSpec;
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
 * Swap the wings `addPlateWings` made for the painted strips `spec.painted` names (D-343), in place. Resolves with how many
 * sides were painted. A side whose strip is missing (`load` resolves null), or whose backdrop was torn down while it loaded,
 * keeps its mirrored wing and costs nothing; with no `painted` in the spec nothing happens, so a plate without painted wings
 * is exactly what it was.
 *
 * The geometry: the plate's plane is `w` wide for `plateWidthPx` pixels, so a strip of `stripPx` pixels is `w * stripPx /
 * plateWidthPx` wide and its inner `overlapPx` pixels sit over the plate. Its outer edge lands where the mirrored wing's did
 * (`w / 2 + spec.width` from the centre when the strip is `spec.width` of wing plus the overlap), so every window the wings
 * covered (`tests/unit/plate-wings.test.ts`) stays covered. It is drawn just after the plate (render order + 1) as a
 * transparent plane, so its alpha ramp cross-fades over the plate's own edge.
 */
export async function paintPlateWings(
  backdrop: Backdrop,
  spec: WingSpec,
  load: (url: string) => Promise<Texture | null> = tryLoadTexture,
): Promise<number> {
  const painted = spec.painted;
  const main = backdrop.group.getObjectByName('backdrop-painting') as Mesh | undefined;
  // No painted wings for a plate that is itself a placeholder (its file is missing): there is nothing for them to join, and
  // a scene built without art (the unit suites') must not wait on an image decode that never answers.
  if (!painted || !main || backdrop.placeholder === true) return 0;
  const geo = main.geometry as PlaneGeometry;
  const w = geo.parameters.width;
  const h = geo.parameters.height;
  const unit = w / painted.plateWidthPx;
  const stripW = painted.stripPx * unit;
  const overlap = painted.overlapPx * unit;
  const results = await Promise.all(
    (spec.sides ?? ['left', 'right']).map(async (side): Promise<boolean> => {
      const wing = backdrop.group.getObjectByName(`backdrop-wing-${side}`) as Mesh | undefined;
      if (!wing) return false;
      const tex = await load(artUrl(painted[side]));
      if (!tex) return false;
      if (wing.parent === null) { // the backdrop was disposed while the strip loaded: free what it made and leave
        tex.dispose();
        return false;
      }
      const dir = side === 'right' ? 1 : -1;
      const old = wing.material as MeshBasicMaterial;
      const mat = (main.material as MeshBasicMaterial).clone(); // the plate's own grade, now over the painted strip
      mat.map = tex;
      mat.transparent = true;
      mat.needsUpdate = true;
      wing.geometry.dispose();
      wing.geometry = new PlaneGeometry(stripW, h);
      wing.material = mat;
      old.dispose();
      wing.position.x = main.position.x + dir * (w / 2 - overlap + stripW / 2);
      wing.renderOrder = main.renderOrder + 1;
      backdrop.adoptTexture(tex);
      return true;
    }),
  );
  return results.filter(Boolean).length;
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
