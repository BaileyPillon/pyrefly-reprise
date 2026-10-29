/**
 * THE SWITCH WORDS OF THE INTERFACE-MOTION PIECES (motion-fluidity pass, lane L3; each piece changes how the interface moves, so each is a look).
 *
 * | word | on | the piece | default since release 68 |
 * |---|---|---|---|
 * | `?atbbars=` | `smooth` | the FFX-2 ATB bars run per frame instead of ratcheting (MF-07, `ffx2/AtbLive.ts`; FFX-2 only) | **on** |
 * | `?ctbslide=` | `flip` | the FFX turn-order list slides each row to its new place (MF-13, `ffx/CtbList.ts`; FFX only) | **on** |
 * | `?gridease=` | `on` | the Sphere Grid's pan and zoom glide instead of snapping (MF-13b, `ffx/party-prep/SphereGridEase.ts`; FFX only) | off (held: no clip yet) |
 * | `?triggerhappy=` | `smooth` | the Trigger Happy bar and ring move every drawn frame (MF-24, `ffx2/TriggerHappy.ts`; FFX-2 only) | **on** |
 *
 * **Release 68 (the driver's call under Bailey's delegation, 2026-10-28; his to overturn)** turned the first three on ({@link FLUID_DEFAULTS}: ONE line each); the Sphere Grid glide stays held. `today`, `off`, `0`, `false` and
 * `no` are the explicit off words, so `?atbbars=today&ctbslide=today&triggerhappy=today` is release 67's interface exactly, and **`?fluidui=today`** (or `off`) puts all four to today at once; **`?fluidui=on`** turns all four
 * on (the held grid glide included). A piece's own word beats `?fluidui=` in both directions (`?fluidui=on&atbbars=today` is the pack with today's bars: the A/B).
 *
 * **REDUCE MOTION beats every word (release 68):** while the player's REDUCE MOTION is on, every piece reads off, whatever the address, the default or a forced test word says ({@link reduceMotionNow}): a Web Animation
 * (the turn-order slide) is not stopped by a CSS rule, so the gate is in code, at the reader of each piece. The fallback is today's instant behaviour: the bars ratchet, the list and the grid jump, the Trigger Happy bar steps.
 * Pure: no DOM but the address of the page and the root element's `data-reduce-motion`.
 */

const OFF = new Set(['today', 'off', '0', 'false', 'no']);

/** What a piece does when no word names it: true = on. The only line to change to put a piece back to release 67's off. */
export const FLUID_DEFAULTS: Readonly<Record<string, boolean>> = {
  atbbars: true, // MF-07, FFX-2 only
  ctbslide: true, // MF-13, FFX only
  gridease: false, // MF-13b, FFX only: held until a clip of the glide exists
  triggerhappy: true, // MF-24, FFX-2 only
};

/** `own` is the piece's key, `on` the word that turns it on; null `search` reads the page's address. The piece's own word, then `?fluidui=`, then {@link FLUID_DEFAULTS}. */
export function fluidWord(own: string, on: string, search: string | undefined = globalThis.location?.search): boolean {
  const dflt = FLUID_DEFAULTS[own] === true;
  let q: URLSearchParams;
  try {
    q = new URLSearchParams(search ?? '');
  } catch {
    return dflt;
  }
  const mine = (q.get(own) ?? '').trim().toLowerCase();
  if (mine === on) return true;
  if (OFF.has(mine)) return false;
  const all = (q.get('fluidui') ?? '').trim().toLowerCase();
  if (all === 'on') return true;
  if (OFF.has(all)) return false;
  return dflt;
}

/** The media query list, kept per `matchMedia` function (a test that swaps the function gets a fresh list; a browser's list is live). */
const queries = new WeakMap<object, { matches: boolean }>();

/**
 * Is the player's REDUCE MOTION on? The pause's row (`app/applyComfort.ts` marks `<html data-reduce-motion>` at construction and on every settings write, so it is live) or the OS preference
 * (`prefers-reduced-motion: reduce`, which also seeds the row's default): the same two reads as `ui/inkgold/wipe.ts`'s `prefersReducedMotion`, which the cut-in and the wipes already obey. Cheap enough to
 * ask every frame (an attribute test and a cached media query list). No document or no `matchMedia` (a unit test, a worker): off.
 */
export function reduceMotionNow(): boolean {
  try {
    if (typeof document !== 'undefined' && document.documentElement?.hasAttribute('data-reduce-motion')) return true;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    const ask = window.matchMedia;
    let mq = queries.get(ask);
    if (!mq) {
      mq = ask.call(window, '(prefers-reduced-motion: reduce)');
      queries.set(ask, mq);
    }
    return mq.matches === true;
  } catch {
    return false;
  }
}
