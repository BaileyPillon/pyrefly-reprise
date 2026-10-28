/**
 * THE SWITCH WORDS OF THE INTERFACE-MOTION PIECES (motion-fluidity pass, lane L3; each piece changes how the interface moves, so each is a look and ships OFF).
 *
 * | word | on | the piece |
 * |---|---|---|
 * | `?atbbars=` | `smooth` | the FFX-2 ATB bars run per frame instead of ratcheting (MF-07, `ffx2/AtbLive.ts`; FFX-2 only) |
 * | `?ctbslide=` | `flip` | the FFX turn-order list slides each row to its new place (MF-13, `ffx/CtbList.ts`; FFX only) |
 * | `?gridease=` | `on` | the Sphere Grid's pan and zoom glide instead of snapping (MF-13, `ffx/party-prep/SphereGridEase.ts`; FFX only) |
 * | `?triggerhappy=` | `smooth` | the Trigger Happy bar and ring move every drawn frame (MF-24, `ffx2/TriggerHappy.ts`; FFX-2 only) |
 *
 * and the shared **`?fluidui=on`**, which turns all four on; a piece's own word beats it in both directions (`?fluidui=on&atbbars=today` is the pack with today's bars: the A/B). `today`, `off` and
 * `0` are the explicit off words. No word = today's interface, byte for byte. Pure: no DOM but the address of the page.
 */

const OFF = new Set(['today', 'off', '0', 'false', 'no']);

/** `own` is the piece's key, `on` the word that turns it on; null `search` reads the page's address. */
export function fluidWord(own: string, on: string, search: string | undefined = globalThis.location?.search): boolean {
  let q: URLSearchParams;
  try {
    q = new URLSearchParams(search ?? '');
  } catch {
    return false;
  }
  const mine = (q.get(own) ?? '').trim().toLowerCase();
  if (mine === on) return true;
  if (OFF.has(mine)) return false;
  return (q.get('fluidui') ?? '').trim().toLowerCase() === 'on';
}
