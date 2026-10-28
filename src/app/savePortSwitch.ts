/**
 * `?saveport=on`: the portable-save page (EXPORT SAVE, IMPORT SAVE, UNDO IMPORT) in the pause screen's OPTIONS tab.
 *
 * Default OFF. With the word off, or any other word, the pause screen prints exactly the rows it printed before the
 * feature existed (`tests/unit/save-port-today.test.ts` pins the rows and the save path by SHA-256), and nothing in
 * this feature runs. A URL word for a decision, not a setting: read each time the OPTIONS rows are built, never saved.
 * (Bailey, 2026-10-28, all recommendations delegated to the driver: the UI waits behind a word until it has had its
 * mockup, its browser check and the deep review the save-data class owes.)
 *
 * Game case: both games (shared pause chrome). No DOM beyond `location.search`.
 */

/** The switch from an address (pure): `on` and `1` are on; anything else, or nothing, is off. */
export function savePortFromSearch(search: string | undefined): boolean {
  if (!search) return false;
  try {
    const word = (new URLSearchParams(search).get('saveport') ?? '').trim().toLowerCase();
    return word === 'on' || word === '1';
  } catch {
    return false;
  }
}

/** Is the portable-save page on for this page? */
export function savePortOn(search: string | undefined = typeof location !== 'undefined' ? location.search : undefined): boolean {
  return savePortFromSearch(search);
}
