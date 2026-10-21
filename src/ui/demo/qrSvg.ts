/**
 * The QR code as an SVG string (R61 booth flow; both games, no game content). See `qr.ts`.
 */

import type { QrCode } from './qr.ts';

export interface QrSvgOptions {
  /** Light modules around the code. The standard asks for 4. */
  quiet?: number;
  dark?: string;
  light?: string | null;
  /** Extra attributes for the root element. */
  attrs?: string;
}

/**
 * The code as one SVG: a single path of horizontal runs, so it stays crisp at any size (`shape-rendering="crispEdges"`) and is a few hundred
 * bytes. Square: the viewBox is `size + 2 * quiet` modules.
 */
export function qrSvg(code: QrCode, options: QrSvgOptions = {}): string {
  const quiet = options.quiet ?? 4;
  const dark = options.dark ?? '#000';
  const light = options.light === undefined ? '#fff' : options.light;
  const total = code.size + quiet * 2;
  let d = '';
  for (let y = 0; y < code.size; y++) {
    let x = 0;
    while (x < code.size) {
      if (!code.modules[y]![x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < code.size && code.modules[y]![x]) x++;
      d += `M${start + quiet} ${y + quiet}h${x - start}v1h${start - x}z`;
    }
  }
  const bg = light === null ? '' : `<rect width="${total}" height="${total}" fill="${light}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"${options.attrs ? ` ${options.attrs}` : ''}>${bg}<path fill="${dark}" d="${d}"/></svg>`;
}
