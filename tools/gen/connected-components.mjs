/**
 * 8-connected component labeling of a boolean(ish) pixel mask.
 *
 * Pulled out of `tools/gen/cutout-guard.mjs` (which uses it for both the
 * "second detached blob" rule and the near-white-region rule) as a generic,
 * independently testable primitive — nothing about it is specific to a
 * cutout or a PNG.
 *
 * Node built-ins only.
 */

/**
 * Label 8-connected components of a boolean(ish) mask.
 *
 * Iterative flood fill (explicit stack, not recursion) so a full 832x1216
 * mask (~1M pixels) cannot blow the call stack. `labels[i] === -1` means
 * background (mask false).
 *
 * @param {Uint8Array} mask 0/1 per pixel, row-major
 * @param {number} width
 * @param {number} height
 * @returns {{labels: Int32Array, sizes: number[], boxes: Array<{minX:number,minY:number,maxX:number,maxY:number}>, count: number}}
 */
export function labelComponents(mask, width, height) {
  const n = width * height;
  const labels = new Int32Array(n).fill(-1);
  const sizes = [];
  const boxes = [];
  const stack = new Int32Array(n);
  let nextLabel = 0;

  for (let start = 0; start < n; start++) {
    if (!mask[start] || labels[start] !== -1) continue;
    let sp = 0;
    stack[sp++] = start;
    labels[start] = nextLabel;
    let size = 0;
    let minX = start % width;
    let maxX = minX;
    let minY = (start / width) | 0;
    let maxY = minY;

    while (sp > 0) {
      const idx = stack[--sp];
      size++;
      const x = idx % width;
      const y = (idx / width) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const nIdx = ny * width + nx;
          if (mask[nIdx] && labels[nIdx] === -1) {
            labels[nIdx] = nextLabel;
            stack[sp++] = nIdx;
          }
        }
      }
    }
    sizes.push(size);
    boxes.push({ minX, minY, maxX, maxY });
    nextLabel++;
  }

  return { labels, sizes, boxes, count: nextLabel };
}

/** Do two bounding boxes lie within `gap` pixels of each other (or overlap)? */
export function boxesTouch(a, b, gap) {
  return !(
    b.maxX < a.minX - gap ||
    b.minX > a.maxX + gap ||
    b.maxY < a.minY - gap ||
    b.minY > a.maxY + gap
  );
}
