/**
 * Add a NEW music entry to the manifest's text (release 39.5: the two selectable chapter-select alternates,
 * `docs/audio/music-elevenlabs-2026-10-07.json` `alternates`, which replace no file).
 *
 * The same text surgery as `setMusicEntryText` in `manifest-io.mjs` (every other byte stays as it was: line endings, the
 * `-16.0` float style, the other entries), for a block that does not exist yet: it goes right after the entry `after`,
 * written in the shape of its neighbours and closed with a comma, because `after` is never the last entry. Callers hold the
 * manifest lock (`withManifestLock`). Its own file so that `manifest-io.mjs` stays under the house 400-line cap.
 */
import { musicEntryBody, musicEntryLines } from './manifest-io.mjs';

export function insertMusicEntryText(text, after, name, entry) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(eol);
  if (lines.indexOf(`    "${name}": {`) >= 0) throw new Error(`the manifest already has a music entry "${name}"`);
  const { end } = musicEntryLines(lines, after);
  if (!lines[end].endsWith(',')) throw new Error(`the manifest entry "${after}" is the last one: nothing follows it to put a comma before`);
  lines.splice(end + 1, 0, `    "${name}": {`, ...musicEntryBody(name, entry), lines[end]);
  return lines.join(eol);
}
