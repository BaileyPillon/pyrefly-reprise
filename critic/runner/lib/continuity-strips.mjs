// Continuity harness: the transition strips.
//
// A strip is the figure cropped out of the 12 consecutive rendered frames around an event (by default 6 before and 6 after,
// at the page's real frame rate), side by side, with guide lines at the head and the feet taken from the frame before the
// event, so a head that grew, feet that slid or a body that jumped is a line it did not stay on. Each cell carries a small
// cross where the head and the feet were measured to be in that frame. The cell of the event is outlined in red. The page
// cropped and encoded the cells (continuity-probe.mjs); this puts them together.
import sharp from 'sharp';

/** CSS px on the screen -> px inside a cell of the strip. */
export function toCell(strip, x, y) {
  const [vl, vt, vw, vh] = strip.view, [rw, rh] = strip.ring, [cx, cy, cw, ch] = strip.crop, [cellW, cellH] = strip.cell;
  return [(((x - vl) * rw) / vw - cx) * (cellW / cw), (((y - vt) * rh) / vh - cy) * (cellH / ch)];
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * @param {object} o
 * @param {object} o.strip   the probe's strip meta (crop, ring, cell, view, first, n)
 * @param {Array<string|null>} o.frames  data URLs, one per cell (null = the frame was gone)
 * @param {Array<{feet:number[]|null, head:number[]|null}|null>} o.marks  per cell, where the head and the feet were (screen CSS px)
 * @param {{headY:number|null, feetY:number|null}} o.guide  screen y of the head's centre and the feet before the event
 * @param {string} o.title   header text
 * @param {string[]} o.captions  one short caption per cell
 * @param {number} o.eventCell   index of the cell of the event
 * @returns {Promise<Buffer>} a JPEG
 */
export async function composeStrip({ strip, frames, marks, guide, title, captions, eventCell, quality = 70 }) {
  const [cellW, cellH] = strip.cell, gap = 2, head = 24, foot = 16;
  const W = frames.length * cellW + (frames.length - 1) * gap, H = head + cellH + foot;
  const layers = [];
  for (let i = 0; i < frames.length; i++) {
    const d = frames[i];
    if (!d) continue;
    layers.push({ input: Buffer.from(d.split(',')[1], 'base64'), left: i * (cellW + gap), top: head });
  }
  const g = [];
  for (let i = 0; i < frames.length; i++) {
    const ox = i * (cellW + gap);
    if (!frames[i]) g.push(`<rect x="${ox}" y="${head}" width="${cellW}" height="${cellH}" fill="#333"/><text x="${ox + 6}" y="${head + 16}" font-size="11" fill="#999">no frame</text>`);
    if (guide.headY != null) { const y = head + toCell(strip, 0, guide.headY)[1]; g.push(`<line x1="${ox}" y1="${y}" x2="${ox + cellW}" y2="${y}" stroke="#39ff14" stroke-width="1"/>`); }
    if (guide.feetY != null) { const y = head + toCell(strip, 0, guide.feetY)[1]; g.push(`<line x1="${ox}" y1="${y}" x2="${ox + cellW}" y2="${y}" stroke="#ff9f1c" stroke-width="1"/>`); }
    const m = marks[i];
    for (const [pt, col] of [[m?.head, '#39ff14'], [m?.feet, '#ff9f1c']]) {
      if (!pt) continue;
      const [x, y] = toCell(strip, pt[0], pt[1]);
      if (x < 0 || x > cellW || y < 0 || y > cellH) continue;
      g.push(`<path d="M${ox + x - 4} ${head + y} h8 M${ox + x} ${head + y - 4} v8" stroke="${col}" stroke-width="1.5" fill="none"/>`);
    }
    if (i === eventCell) g.push(`<rect x="${ox + 0.5}" y="${head + 0.5}" width="${cellW - 1}" height="${cellH - 1}" fill="none" stroke="#ff2d2d" stroke-width="2"/>`);
    g.push(`<text x="${ox + 3}" y="${head + cellH + 12}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="${i === eventCell ? '#ff6b6b' : '#cfcfcf'}">${esc(captions[i] ?? '')}</text>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="6" y="16" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#ffffff">${esc(title)}</text>${g.join('')}</svg>`;
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  // frames go under the guide lines: composite them onto the plain background first, then the overlay on top
  const bg = await sharp({ create: { width: W, height: H, channels: 3, background: '#161616' } }).composite(layers).png().toBuffer();
  return sharp(bg).composite([{ input: base }]).jpeg({ quality, mozjpeg: true }).toBuffer();
}
