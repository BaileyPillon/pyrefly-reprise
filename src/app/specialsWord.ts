/**
 * The test word of the FFX-2 Special look: `?specials=on` (FFX-2 only: the three Special dresspheres exist only in FFX-2).
 *
 * The switch `specialDressUp` is OFF in every shipped chapter and stays OFF in production. The word, the debug call `window.__pyrefly.specials(on?)` and the three look words exist in a
 * dev server and in a test preview build (`PYREFLY_SPECIALS_TEST=1`, which defines `__PYREFLY_SPECIALS__` true) and nowhere else: a production build defines it false, and every
 * branch below that reads the page's address is then dead code, so none of the words reaches a production bundle (`tests/unit/specials-word.test.ts` proves it by bundling).
 * The word is read LAZILY, when the engine options are built, never from `location.search` at import time.
 */

/** Set by `vite.config.ts`: true for the dev server and a test preview build, false for every production build; absent under vitest (which has no `define`). */
declare const __PYREFLY_SPECIALS__: boolean | undefined;

/** The look words (`?specials=on&specialsfit=...&specialsmark=...&specialshold=...`): how Bailey's open look questions stay switches until he answers. An unknown value is dropped. */
export interface SpecialsLookWord {
  fit?: 'trial' | 'larger' | 'true';
  mark?: 'a' | 'b';
  hold?: 'per-save' | 'short-always';
}

/** What `window.__pyrefly.specials(on)` last set: a flag that turns the dress-up on for the next battle without the address. `specials(false)` clears it. */
let forced = false;

const searchOf = (search?: string): string => search ?? (globalThis as { location?: { search?: string } }).location?.search ?? '';

/** Is the Special dress-up asked for? False at once in a production build; else the debug flag, else the address holding `specials=on`. */
export function specialsOn(search?: string): boolean {
  if (typeof __PYREFLY_SPECIALS__ !== 'undefined' && __PYREFLY_SPECIALS__ === false) return false;
  return forced || /[?&]specials=on(?:&|$)/.test(searchOf(search));
}

/** The engine options this word adds: `{ specialDressUp: true }` when asked for, else nothing (so the spread changes no option). Read at the moment the engine is built. */
export function specialsEngineOptions(): { specialDressUp?: true } {
  return specialsOn() ? { specialDressUp: true } : {};
}

/** The look words of the address, or null when the word is not on (or this is a production build). */
export function specialsLookWord(search?: string): SpecialsLookWord | null {
  if (typeof __PYREFLY_SPECIALS__ !== 'undefined' && __PYREFLY_SPECIALS__ === false) return null;
  const q = searchOf(search);
  if (!specialsOn(q)) return null;
  const get = (name: string): string | null => new URLSearchParams(q).get(name);
  const out: SpecialsLookWord = {};
  const fit = get('specialsfit');
  if (fit === 'trial' || fit === 'larger' || fit === 'true') out.fit = fit;
  const mark = get('specialsmark');
  if (mark === 'a' || mark === 'b') out.mark = mark;
  const hold = get('specialshold');
  if (hold === 'per-save' || hold === 'short-always') out.hold = hold;
  return out;
}

/** `window.__pyrefly.specials(on?)`: set (or, with no argument, read) the next-battle switch. Does nothing and answers false in a production build. */
export function specialsDebug(on?: boolean): boolean {
  if (typeof __PYREFLY_SPECIALS__ !== 'undefined' && __PYREFLY_SPECIALS__ === false) return false;
  if (on !== undefined) forced = on;
  return specialsOn();
}
