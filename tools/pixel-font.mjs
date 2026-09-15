/**
 * A 3x5 uppercase bitmap font, just enough to label preview and contact sheets.
 * Each glyph is 15 bits, row-major, 3 bits per row.
 */

const G = {
  A: '010101111101101',
  B: '110101110101110',
  C: '011100100100011',
  D: '110101101101110',
  E: '111100110100111',
  F: '111100110100100',
  G: '011100101101011',
  H: '101101111101101',
  I: '111010010010111',
  J: '001001001101010',
  K: '101101110101101',
  L: '100100100100111',
  M: '101111111101101',
  N: '110101101101101',
  O: '010101101101010',
  P: '110101110100100',
  Q: '010101101111011',
  R: '110101110101101',
  S: '011100010001110',
  T: '111010010010010',
  U: '101101101101010',
  V: '101101101010010',
  W: '101101111111101',
  X: '101101010101101',
  Y: '101101010010010',
  Z: '111001010100111',
  0: '111101101101111',
  1: '010110010010111',
  2: '110001010100111',
  3: '111001011001111',
  4: '101101111001001',
  5: '111100110001110',
  6: '011100111101111',
  7: '111001010010010',
  8: '111101111101111',
  9: '111101111001110',
  '-': '000000111000000',
  _: '000000000000111',
  '.': '000000000000010',
  ':': '000010000010000',
  '/': '001001010100100',
  '#': '101111101111101',
  ' ': '000000000000000',
};

export const GLYPH_W = 3;
export const GLYPH_H = 5;

/** Width in pixels of `text` at `scale`, including 1px letter spacing. */
export function textWidth(text, scale = 1) {
  return text.length === 0 ? 0 : (text.length * (GLYPH_W + 1) - 1) * scale;
}

/** Draw uppercase `text` into an `Image` at `(x, y)`. Unknown chars render blank. */
export function drawText(img, text, x, y, scale = 1, colour = [255, 255, 255, 255]) {
  let cx = x;
  for (const raw of text.toUpperCase()) {
    const bits = G[raw] ?? G[' '];
    for (let r = 0; r < GLYPH_H; r++) {
      for (let c = 0; c < GLYPH_W; c++) {
        if (bits[r * GLYPH_W + c] !== '1') continue;
        img.fillRect(cx + c * scale, y + r * scale, scale, scale, colour);
      }
    }
    cx += (GLYPH_W + 1) * scale;
  }
  return cx - x;
}
