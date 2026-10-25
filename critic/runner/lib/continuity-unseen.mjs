// Continuity harness: a figure that is not on the screen cannot be seen to jerk or to snap (CHK-027).
//
// R63-M1 (the release 63 focused review, traced 2026-10-24): two of the four events the review reported were not figure movement at all. The pro camera's start shot is on Seymour, so
// Kimahri's knock-out at 28 s happens with his planes below the frame (plane top at y 834 on a 900 px frame, drawn share 0); the victory close-up frames only Auron, so Yuna's planes sit
// thousands of pixels off the frame (y -6.5k to -13k), and a camera that moves a hair moves a plane that far from the lens by hundreds of pixels: the harness read 603 px, 1,132 px and, in another run
// of the same route, 40,092 px "teleports" of a figure nobody could see. The step of a tracked point is measured through the plane's quad, and the quad of a plane behind or far beside the camera
// is a projection that blows up. Nothing on that frame is a defect a player can see.
//
// A figure is UNSEEN in a frame when none of the planes it draws (fade over `fadeMin`, visible) has its quad's bounding box over the view by at least `minShare` of the smaller of the box and the
// view (so a plane much bigger than the view, a close-up, is seen as soon as a tenth of the view is on it), and, for a rigged figure, when none of its tracked points (head, feet, centroid) is in the view.
// A plane whose box is more than `maxBoxViews` times the view's area is no figure either: it is a plane passing through the lens (Yuna's, in the 69 s close shot of Kimahri, was 5,000 px across at the
// top and 36,000 at the bottom, its box covering the whole view), and the player sees a plane edge or nothing, so it counts as off the view whatever it overlaps.
// A figure with no plane and no rig point in the record (hidden) is not called unseen: it has no track to read either.
//
// What the rule does, and no more: a STEP of a tracked point is not read when BOTH of its frames are unseen (`detectJerks`; a figure that jumps off the view, or onto it, in one frame is a step a player sees), and a swap in a frame in which the figure is unseen is not a SNAP
// (`snapUnseen` keeps what it would have been). Nothing else: CHK-026 (the size, the feet, the height at a swap) is read through the planes whatever the camera does and is not touched, and a figure
// that is on screen is judged exactly as before. `continuity.unseen.excuse: false` in the policy (or no block) gives the earlier reading back.
//
// Game case: both (shared critic plumbing; it can only fire when the camera leaves a figure off the frame, and a figure on the frame is judged as before).

export const UNSEEN_DEFAULTS = Object.freeze({ excuse: true, minShare: 0.1, fadeMin: 0.05, maxBoxViews: 16 });

/** The policy's `continuity.unseen` block over the defaults (a policy without one switches the rule ON: it only ever removes a reading nobody could see). */
export function unseenPolicy(cfg) {
  const p = cfg && cfg.unseen && typeof cfg.unseen === 'object' ? cfg.unseen : {};
  return { ...UNSEEN_DEFAULTS, ...p, excuse: p.excuse !== false };
}

const finite = (v) => typeof v === 'number' && Number.isFinite(v);

/** The pair `[x, y]` when both are finite numbers, else null. */
const point = (p) => (Array.isArray(p) && finite(p[0]) && finite(p[1]) ? p : null);

/**
 * Is this figure off the view in this frame? `fig` is the probe's figure record (`s`: its planes `[k, fade, visible, x0, y0, x1, y1, x2, y2, x3, y3]`, `rg`: a rig's head `h`, feet `f` and centroid `c`),
 * `view` is `[x, y, w, h]` of the drawn canvas in the same CSS px as the quads.
 * @param {{s?: Array, rg?: {h?: number[], f?: number[], c?: number[]}}} fig
 * @param {number[]} view
 * @param {{minShare?: number, fadeMin?: number}} [o]
 */
export function unseenIn(fig, view, o = {}) {
  const minShare = o.minShare ?? UNSEEN_DEFAULTS.minShare;
  const fadeMin = o.fadeMin ?? UNSEEN_DEFAULTS.fadeMin;
  const maxBoxViews = o.maxBoxViews ?? UNSEEN_DEFAULTS.maxBoxViews;
  if (!fig || !Array.isArray(view) || view.length < 4 || !view.slice(0, 4).every(finite)) return false;
  const [vx, vy, vw, vh] = view;
  if (!(vw > 0 && vh > 0)) return false;
  if (fig.rg) {
    const pts = [fig.rg.h, fig.rg.f, fig.rg.c].map(point).filter(Boolean);
    if (!pts.length) return false;
    return !pts.some(([x, y]) => x >= vx && x <= vx + vw && y >= vy && y <= vy + vh);
  }
  let drawn = 0;
  for (const s of fig.s ?? []) {
    if (!Array.isArray(s) || !(s[1] > fadeMin) || s[2] !== 1 || s.length < 11) continue;
    const q = s.slice(3, 11);
    if (!q.every(finite)) { drawn++; continue; } // a plane the probe could not place: say nothing about it
    drawn++;
    const xs = [q[0], q[2], q[4], q[6]], ys = [q[1], q[3], q[5], q[7]];
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if ((x1 - x0) * (y1 - y0) > maxBoxViews * vw * vh) continue; // a plane through the lens: not a figure on the view
    const ix = Math.max(0, Math.min(x1, vx + vw) - Math.max(x0, vx)), iy = Math.max(0, Math.min(y1, vy + vh) - Math.max(y0, vy));
    if (ix * iy >= minShare * Math.min((x1 - x0) * (y1 - y0), vw * vh)) return false;
  }
  return drawn > 0;
}
