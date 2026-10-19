/**
 * A smear frame for a rig part (the animation prototype, `?anim=proto&style=B`; both games, presentation only): a motion-blurred copy of a part's own image, drawn once in a 2D canvas, that the part
 * shows for a frame or two at the peak speed of a fast move (the researcher's takeaway 2: a smear sits between two extremes of the fastest actions). It is the same image smeared along `(dx, dy)`,
 * fractions of its width and height, trailing behind and a little ahead; the part's mesh, skin, rim and draw order are untouched, only the map the shader samples is swapped and swapped back.
 * No new art and no change to a rig file: the format-v2 image variant the note suggests would carry a painted smear; this is the procedural one, so it can be tried before anyone paints.
 */
import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace, type Texture } from 'three';

/** The smear of `src` along `(dx, dy)` (fractions of its size), or null where there is no 2D canvas (a unit test) or no image yet. */
export function makeSmear(src: Texture, dx: number, dy: number): Texture | null {
  const img = src.image as (CanvasImageSource & { width: number; height: number }) | undefined | null;
  if (typeof document === 'undefined' || !img || !img.width || !img.height) return null;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  if (!g) return null;
  const steps = 7;
  for (let i = steps; i >= -1; i--) {
    g.globalAlpha = i > 0 ? 0.13 + 0.03 * (steps - i) : i === 0 ? 0.55 : 0.2; // a fading trail behind (i > 0), the image itself, a hint ahead
    g.drawImage(img, (-dx * c.width * i) / steps, (-dy * c.height * i) / steps);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.magFilter = LinearFilter;
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  return t;
}
