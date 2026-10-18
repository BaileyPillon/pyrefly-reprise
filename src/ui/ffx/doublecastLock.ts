/**
 * Where the gold lock chip of a Doublecast hangs on cast 1's target (FFX only; Option A "Second round", decision queue item 103, delegated).
 *
 * Pure geometry, in the overlay's px. The chip's home is the top-left of the target's silhouette box, as in the approved frames, and it stays there whenever the target mostly sticks
 * out from the other fiends' boxes (Yu Pagoda A: the boss's box only clips its inner side). In the menu camera pose Yu Pagoda B stands almost entirely behind Braska's Final Aeon
 * (mock finding 6), so its box's top-left is the boss's torso and a chip there reads as the boss's. For a target the others' boxes cover at least 85 percent the place is, in order:
 *
 * 1. the first place on the target's own box that touches no other fiend's box and no HUD panel, scanning from the top, left to right (a wedge that sticks out);
 * 2. the lower part of the target's box on its outer side (away from the fiend that covers it most), kept off the HUD panels: its visible part is somewhere under the others' boxes, and a
 *    figure standing behind a larger one shows at its outer, lower side (B's base to the right of the boss's leg: the mock put the chip there by eye, 1226,314 at 1600x900);
 * 3. home, kept on the screen.
 *
 * Every place is kept off the HUD panels (the turn list's rows, the party window, the command stack, the help slab). The boxes are the stage's tight alpha boxes, not outlines: a box says
 * where a figure *can* be, not where its pixels are, so the 85 percent rule and step 2 are placement rules and not visibility tests.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** How far down a covered target's box the chip sits (its lower part: the legs and the base are what stick out from behind a larger fiend). */
const LOWER = 0.72;

/** The share of a target's box the others' boxes cover from which its home corner is treated as hidden. */
const COVERED = 0.85;

const overlap = (a: Box, b: Box): number => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

const touches = (a: Box, b: Box, pad: number): boolean => a.x < b.x + b.w + pad && b.x - pad < a.x + a.w && a.y < b.y + b.h + pad && b.y - pad < a.y + a.h;

/** `others`: the other fiends' boxes. `avoid`: HUD panels the chip must not sit on (the turn list, the party window, the command stack, the help slab). */
export function placeLockChip(target: Box, others: readonly Box[], size: { w: number; h: number }, bounds: { w: number; h: number }, avoid: readonly Box[] = [], inset = 2): { x: number; y: number } {
  const chip = (x: number, y: number): Box => ({ x, y, w: size.w, h: size.h });
  const inside = (c: Box): boolean => c.x >= 0 && c.y >= 0 && c.x + c.w <= bounds.w && c.y + c.h <= bounds.h;
  const offPanels = (c: Box): boolean => inside(c) && !avoid.some((a) => touches(c, a, 1));
  const clear = (c: Box): boolean => offPanels(c) && !others.some((o) => touches(c, o, 1));
  const home = chip(target.x + inset, target.y + inset);
  const cover = others.filter((o) => touches(target, o, 0)).sort((p, q) => overlap(target, q) - overlap(target, p))[0];
  const covered = cover !== undefined && overlap(target, cover) >= COVERED * target.w * target.h;
  if (covered ? clear(home) : offPanels(home)) return { x: home.x, y: home.y };
  const stepY = Math.max(2, size.h / 2);
  const stepX = Math.max(2, size.w / 3);
  for (let y = target.y + inset; y + size.h <= target.y + target.h; y += stepY) {
    for (let x = target.x + inset; x + size.w <= target.x + target.w; x += stepX) {
      const c = chip(x, y);
      if (covered ? clear(c) : offPanels(c)) return { x, y };
    }
  }
  // The outer, lower part of the box, pushed inward in chip-thirds until it is off the panels.
  const outerRight = !cover || target.x + target.w / 2 >= cover.x + cover.w / 2;
  const y = Math.max(target.y, Math.min(target.y + target.h - size.h, target.y + target.h * LOWER - size.h / 2));
  const x0 = outerRight ? target.x + target.w - size.w - inset : target.x + inset;
  for (let k = 0; k * stepX <= target.w; k++) {
    const c = chip(x0 + (outerRight ? -k : k) * stepX, y);
    if (offPanels(c) && c.x >= target.x - size.w / 2 && c.x + size.w <= target.x + target.w + size.w / 2) return { x: c.x, y: c.y };
  }
  return { x: Math.max(0, Math.min(bounds.w - size.w, home.x)), y: Math.max(0, Math.min(bounds.h - size.h, home.y)) };
}
