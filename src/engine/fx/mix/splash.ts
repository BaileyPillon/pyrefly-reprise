import { artManifest } from '../../ArtManifest.ts';
import { artUrl } from '../../PaintedArt.ts';
import { liveGates, partOn, type MixGame } from './gates.ts';

/**
 * The MAX mix (D-316), SPLASH ART (BATTLE SPECTACLE; both games; B's no-render part, EC-1001-02): the
 * Overdrive and Special splash slab shows a focal crop of the actor's own APPROVED painting, the
 * cheapest route the spec names ("a focal-box crop of approved art"). No new art: only paintings
 * installed in `public/art/characters/` (chosen, approved, listed by the art manifest) are cropped, at
 * their own pixels, never upscaled. The crop is made at runtime from the painting's alpha, so it follows
 * whatever painting is installed (release 35's boss and party keys included).
 *
 * Which painting: FFX-2 Bahamut's approved splash painting and the aeons' Overdrive paintings whole (their
 * opaque box); everyone else their attack painting's upper body (the top 60 % of the opaque box: the
 * face, the arms and the weapon), else their cast painting's, else an Overdrive painting whole. Until a
 * crop is ready the slab keeps today's choice. Per game: the same rule; FFX shows it on party
 * Overdrives, aeon Overdrives and boss Specials, FFX-2 on dressphere Specials, Bahamut and Ixion.
 */

export type CropBox = 'upper' | 'whole';

/** The painting a splash crops for a figure, from the states its folder ships. Pure. */
export function splashSource(id: string, states: readonly string[]): { state: string; box: CropBox } | null {
  const has = (s: string): boolean => states.includes(s);
  if (/bahamut/.test(id) && has('splash')) return { state: 'splash', box: 'whole' };
  if (has('overdrive') && /^(anima|x2-anima|shiva|ixion|x2-ixion|valefor|ifrit|bahamut|yojimbo|cindy|sandy|mindy|magus)/.test(id)) return { state: 'overdrive', box: 'whole' };
  if (has('attack')) return { state: 'attack', box: 'upper' };
  if (has('cast')) return { state: 'cast', box: 'upper' };
  if (has('overdrive')) return { state: 'overdrive', box: 'whole' };
  return null;
}

/** The crop rectangle (source px) from an opaque box, for the box kind. Pure. */
export function cropRect(opaque: { x: number; y: number; w: number; h: number }, box: CropBox): { x: number; y: number; w: number; h: number } {
  const h = box === 'upper' ? Math.round(opaque.h * 0.6) : opaque.h;
  return { x: opaque.x, y: opaque.y, w: Math.max(8, opaque.w), h: Math.max(8, h) };
}

/** The opaque box of an image (source px), measured on a small copy of its alpha. */
function opaqueBox(img: HTMLImageElement): { x: number; y: number; w: number; h: number } | null {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  if (!W || !H) return null;
  const k = Math.min(1, 160 / Math.max(W, H));
  const w = Math.max(1, Math.round(W * k));
  const h = Math.max(1, Math.round(H * k));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3]! < 40) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  if (x1 < 0) return null;
  return { x: Math.floor(x0 / k), y: Math.floor(y0 / k), w: Math.ceil((x1 - x0 + 1) / k), h: Math.ceil((y1 - y0 + 1) / k) };
}

const crops = new Map<string, string | null>();
const pending = new Set<string>();

function sourceFor(art: string): { id: string; state: string; box: CropBox } | null {
  const id = art.replace(/^.*characters\//, '').replace(/\/.*$/, '');
  const states = artManifest()?.subjects[id]?.states;
  if (!states) return null;
  const s = splashSource(id, states);
  return s ? { id, ...s } : null;
}

/** Start the crop for a likely mover, so the first splash does not wait (a no-op when the part is off). */
export function prepareMixSplash(art: string, game: MixGame): void {
  if (!partOn('splashArt', liveGates(game))) return;
  const src = sourceFor(art);
  if (!src) return;
  const key = `${src.id}/${src.state}`;
  if (crops.has(key) || pending.has(key)) return;
  pending.add(key);
  void (async (): Promise<void> => {
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = artUrl(`art/characters/${src.id}/${src.state}.png`);
      await img.decode();
      const box = opaqueBox(img);
      if (!box) return void crops.set(key, null);
      const r = cropRect(box, src.box);
      const c = document.createElement('canvas');
      c.width = r.w;
      c.height = r.h;
      c.getContext('2d')!.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
      crops.set(key, blob ? URL.createObjectURL(blob) : null);
    } catch {
      crops.set(key, null);
    } finally {
      pending.delete(key);
    }
  })();
}

/** The splash's painting under SPLASH ART: the ready crop, or null to keep today's choice. */
export function mixSplashArt(art: string, game: MixGame): string | null {
  if (!partOn('splashArt', liveGates(game))) return null;
  const src = sourceFor(art);
  if (!src) return null;
  const key = `${src.id}/${src.state}`;
  if (!crops.has(key)) prepareMixSplash(art, game);
  return crops.get(key) ?? null;
}

/** Forget the crops (their blob URLs go with them). */
export function releaseMixSplash(): void {
  for (const u of crops.values()) if (u) URL.revokeObjectURL(u);
  crops.clear();
}
