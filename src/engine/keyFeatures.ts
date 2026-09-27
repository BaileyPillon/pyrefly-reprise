/**
 * The key features of a painting a HUD panel must never cover: its face and
 * its weapon (critic CHK-008: "no panel intersects a face or a weapon").
 *
 * For most figures the intent slab's soft body box is enough, but Vegnagun's
 * parts fill the frame under the colossus staging (D-228), so their whole box
 * cannot be a hard obstacle (the slab would have nowhere to go) and a soft one
 * let the slab sit on the head's horn ring (PR-0094) and the body's core rim
 * (the Charge Core slab, iter2-vegnagun-a's check). Here each part names the
 * boxes that are its face or weapon, in its idle painting's pixels, as the
 * vegnagun-a builder measured them (`docs/handoff/iter2-vegnagun-a.md`, "HUD
 * against each part's key feature"); the secondary features it measured (the
 * tail's joint, the leg's knee and lens, the body's muzzle) are left soft.
 *
 * Game case: the mechanism is both; the only table today is FFX-2's (Ch V).
 * Pure: no `three`, no DOM. The stage projects the boxes
 * (`BattlePresenterStage.keyFeatureRects`); the FFX-2 HUD treats them as hard.
 */

export interface KeyFeatureTable {
  /** The idle painting's size in pixels. */
  size: [w: number, h: number];
  /** Named boxes, `[x0, y0, x1, y1]` in the painting's pixels. */
  boxes: Readonly<Record<string, readonly [number, number, number, number]>>;
}

export const KEY_FEATURES: Readonly<Record<string, KeyFeatureTable>> = Object.freeze({
  'vegnagun-tail': { size: [1176, 822], boxes: { stinger: [10, 540, 220, 700] } },
  'vegnagun-leg': { size: [777, 1175], boxes: { spikeClaw: [100, 830, 300, 1170] } },
  // The Charge Core slab's corner clipped this rim at link 3 (18% at 1600 and 2000).
  'vegnagun-body': { size: [1213, 827], boxes: { core: [770, 400, 870, 500] } },
  // PR-0094: the Redoubt card sat on the horn (and its ring) at link 4.
  'vegnagun-head': { size: [1216, 832], boxes: { skullFace: [400, 430, 600, 700], horn: [160, 400, 330, 600] } },
});

/** Screen pixels of clearance kept round a key feature. */
export const KEY_FEATURE_PAD = 8;

/**
 * A feature's screen box: its four corners pushed through `toScreen`
 * (painting fractions `u` across and `t` down, to CSS pixels), padded.
 */
export function featureRect(
  table: KeyFeatureTable,
  box: readonly [number, number, number, number],
  toScreen: (u: number, t: number) => { x: number; y: number } | null,
  pad = KEY_FEATURE_PAD,
): { x: number; y: number; w: number; h: number } | null {
  const [w, h] = table.size;
  const pts = [
    [box[0], box[1]],
    [box[2], box[1]],
    [box[0], box[3]],
    [box[2], box[3]],
  ].map(([x, y]) => toScreen(x! / w, y! / h));
  if (pts.some((p) => !p)) return null;
  const xs = pts.map((p) => p!.x);
  const ys = pts.map((p) => p!.y);
  const x0 = Math.min(...xs) - pad;
  const y0 = Math.min(...ys) - pad;
  return { x: x0, y: y0, w: Math.max(...xs) + pad - x0, h: Math.max(...ys) + pad - y0 };
}
