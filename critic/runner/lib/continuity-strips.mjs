// Continuity harness: the transition strips.
//
// A strip is the figure cropped out of the consecutive rendered frames around an event (by default 14 before and 6 after, 20 in all,
// at the page's real frame rate; it was 6 and 6 until r40 instrument edit (c), because a knock-out's whole fall and a blend's whole
// freeze do not fit in six frames), side by side, with guide lines at the head and the feet taken from the frame before the
// event, so a head that grew, feet that slid or a body that jumped is a line it did not stay on. Each cell carries a small
// cross where the head and the feet were measured to be in that frame. The cell of the event is outlined in red. The page
// cropped and encoded the cells (continuity-probe.mjs); this puts them together.
//
// A figure with no registration is followed by its silhouette's centroid (r40 instrument edit (a)), not by a head and feet: its
// guide line and its crosses are magenta and mean the centroid. A strip of more than `MAX_ONE_ROW` cells is laid out in two rows
// (the first half, then the second), so a 20-cell strip stays a picture a reader can take in at once; a shorter one is one row,
// exactly as before.
import sharp from 'sharp';

/** Strips of at most this many cells are one row; longer ones are two. */
export const MAX_ONE_ROW = 12;

/** CSS px on the screen -> px inside a cell of the strip. */
export function toCell(strip, x, y) {
  const [vl, vt, vw, vh] = strip.view, [rw, rh] = strip.ring, [cx, cy, cw, ch] = strip.crop, [cellW, cellH] = strip.cell;
  return [(((x - vl) * rw) / vw - cx) * (cellW / cw), (((y - vt) * rh) / vh - cy) * (cellH / ch)];
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const HEAD = '#39ff14', FEET = '#ff9f1c', CENTROID = '#ff4fd8';

/**
 * @param {object} o
 * @param {object} o.strip   the probe's strip meta (crop, ring, cell, view, first, n)
 * @param {Array<string|null>} o.frames  data URLs, one per cell (null = the frame was gone)
 * @param {Array<{feet:number[]|null, head:number[]|null, centroid?:number[]|null}|null>} o.marks  per cell, where the head, the feet and the centroid were (screen CSS px)
 * @param {{headY:number|null, feetY:number|null, centroidY?:number|null}} o.guide  screen y of the head's centre, the feet and the centroid before the event
 * @param {string} o.title   header text
 * @param {string[]} o.captions  one short caption per cell
 * @param {number} o.eventCell   index of the cell of the event
 * @returns {Promise<Buffer>} a JPEG
 */
export async function composeStrip({ strip, frames, marks, guide, title, captions, eventCell, quality = 70 }) {
  const [cellW, cellH] = strip.cell, gap = 2, head = 24, foot = 16;
  const rows = frames.length > MAX_ONE_ROW ? 2 : 1, per = Math.ceil(frames.length / rows);
  const W = per * cellW + (per - 1) * gap, H = head + rows * (cellH + foot);
  // where cell i is: x across the row, y down the rows (the title band is the top `head` px once, each row has its own caption band under it)
  const at = (i) => ({ ox: (i % per) * (cellW + gap), oy: head + Math.floor(i / per) * (cellH + foot) });
  const layers = [];
  for (let i = 0; i < frames.length; i++) {
    const d = frames[i];
    if (!d) continue;
    const { ox, oy } = at(i);
    layers.push({ input: Buffer.from(d.split(',')[1], 'base64'), left: ox, top: oy });
  }
  const g = [];
  for (let i = 0; i < frames.length; i++) {
    const { ox, oy } = at(i);
    if (!frames[i]) g.push(`<rect x="${ox}" y="${oy}" width="${cellW}" height="${cellH}" fill="#333"/><text x="${ox + 6}" y="${oy + 16}" font-size="11" fill="#999">no frame</text>`);
    for (const [gy, col] of [[guide.headY, HEAD], [guide.feetY, FEET], [guide.centroidY, CENTROID]]) {
      if (gy == null) continue;
      const ly = toCell(strip, 0, gy)[1];
      if (ly < 0 || ly > cellH) continue; // a guide outside the crop would run into the next row
      const y = oy + ly;
      g.push(`<line x1="${ox}" y1="${y}" x2="${ox + cellW}" y2="${y}" stroke="${col}" stroke-width="1"/>`);
    }
    const m = marks[i];
    for (const [pt, col] of [[m?.head, HEAD], [m?.feet, FEET], [m?.centroid, CENTROID]]) {
      if (!pt) continue;
      const [x, y] = toCell(strip, pt[0], pt[1]);
      if (x < 0 || x > cellW || y < 0 || y > cellH) continue;
      g.push(`<path d="M${ox + x - 4} ${oy + y} h8 M${ox + x} ${oy + y - 4} v8" stroke="${col}" stroke-width="1.5" fill="none"/>`);
    }
    if (i === eventCell) g.push(`<rect x="${ox + 0.5}" y="${oy + 0.5}" width="${cellW - 1}" height="${cellH - 1}" fill="none" stroke="#ff2d2d" stroke-width="2"/>`);
    g.push(`<text x="${ox + 3}" y="${oy + cellH + 12}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="${i === eventCell ? '#ff6b6b' : '#cfcfcf'}">${esc(captions[i] ?? '')}</text>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="6" y="16" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#ffffff">${esc(title)}</text>${g.join('')}</svg>`;
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  // frames go under the guide lines: composite them onto the plain background first, then the overlay on top
  const bg = await sharp({ create: { width: W, height: H, channels: 3, background: '#161616' } }).composite(layers).png().toBuffer();
  return sharp(bg).composite([{ input: base }]).jpeg({ quality, mozjpeg: true }).toBuffer();
}
