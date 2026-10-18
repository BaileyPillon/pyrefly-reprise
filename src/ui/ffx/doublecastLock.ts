/**
 * Where the gold lock chip of a Doublecast hangs on cast 1's target (FFX only; Option A "Second round", decision queue item 103, delegated).
 *
 * Pure geometry, in the overlay's px. The chip's home is the top-left of the target's silhouette box, as in the approved frames. In the menu camera pose Yu Pagoda B
 * stands mostly behind Braska's Final Aeon (mock finding 6), so its box's top-left is the boss's torso and a chip there reads as the boss's: the chip then takes the
 * first place on B's own box where it touches no other fiend's box (the "visible wedge"), scanning from the top, left to right; failing that, beside the box (above,
 * right, left); failing that, home, kept on the screen.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const touches = (a: Box, b: Box, pad: number): boolean => a.x < b.x + b.w + pad && b.x - pad < a.x + a.w && a.y < b.y + b.h + pad && b.y - pad < a.y + a.h;

export function placeLockChip(target: Box, others: readonly Box[], size: { w: number; h: number }, bounds: { w: number; h: number }, inset = 2): { x: number; y: number } {
  const chip = (x: number, y: number): Box => ({ x, y, w: size.w, h: size.h });
  const inside = (c: Box): boolean => c.x >= 0 && c.y >= 0 && c.x + c.w <= bounds.w && c.y + c.h <= bounds.h;
  const clear = (c: Box): boolean => inside(c) && !others.some((o) => touches(c, o, 1));
  const home = chip(target.x + inset, target.y + inset);
  if (clear(home)) return { x: home.x, y: home.y };
  const stepY = Math.max(2, size.h / 2);
  const stepX = Math.max(2, size.w / 3);
  for (let y = target.y + inset; y + size.h <= target.y + target.h; y += stepY) {
    for (let x = target.x + inset; x + size.w <= target.x + target.w; x += stepX) {
      const c = chip(x, y);
      if (clear(c)) return { x, y };
    }
  }
  for (const c of [chip(target.x + inset, target.y - size.h - inset), chip(target.x + target.w + inset, target.y + inset), chip(target.x - size.w - inset, target.y + inset)]) {
    if (clear(c)) return { x: c.x, y: c.y };
  }
  return { x: Math.max(0, Math.min(bounds.w - size.w, home.x)), y: Math.max(0, Math.min(bounds.h - size.h, home.y)) };
}
