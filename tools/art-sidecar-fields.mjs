/**
 * What a painting sidecar carries when a build ships it (r47-rc, FOC46-06): the fields the game reads, and nothing else.
 *
 * `public/art/**\/*.json` began as the provenance records of the renders that made each painting: the model, the sampler, the ComfyUI
 * graph's inputs, who approved the picture and when, links to private chat pages, notes. The game reads ten fields of them and no more
 * (`SIDECAR_FIELDS`, below, the union of what every reader of an art JSON takes: `tests/unit/art-sidecar-redact.test.ts`, table `READERS`,
 * with a guard that fails when a new reader appears). The site is public, and the standing rule is that it carries no personal or PC
 * detail, so the BUILD OUTPUT writes each sidecar as exactly those fields of its master. The masters in `public/art` are never touched.
 *
 * THE RULE, the same for every file (`projectSidecarText`, the one function the build, `art-derive verify` and the tests use):
 *   - the keys kept are those of `SIDECAR_FIELDS`, in the order the MASTER has them (not the list's order);
 *   - each kept value is the master's own text, token for token: a number as it was spelt (`1.0`, `1e3`, a 20-digit seed), a string with its
 *     escapes, `null`; only the white space between the tokens of an object or array value is dropped, so the output does not depend on how
 *     the master was laid out or on its line ends;
 *   - one key per line, two spaces, `\n` line ends, a final `\n`; no kept key at all gives `{}` and a final `\n`;
 *   - a key that appears twice keeps the value `JSON.parse` would give it (the last) at the place of its first appearance;
 *   - a text that is not a JSON object is an error (a sidecar is an object; nothing is guessed about a file that is not).
 * The projection is idempotent. It is a TEXT projection and not a parse and a `JSON.stringify`, because a number is not always the same
 * after a round trip through a double (a ComfyUI seed is 20 digits).
 *
 * Which JSON files are sidecars (`isSidecarJson`): every `art/**\/*.json` except `NON_SIDECAR_ART_JSON`, the files the game reads whole or
 * the build writes itself. `tools/art-verify.mjs` proves the split against the master folder (a sidecar has a painting beside it, the others
 * have none), so a new JSON file under `art/` that is not a sidecar fails the deploy's art gate instead of silently losing its keys.
 *
 * Game case: both (shared build plumbing; no game content).
 */

/**
 * The only keys a shipped sidecar may carry, with who reads each (a field a reader takes is on this list; a field no reader takes is not):
 *   width, height, baselineY, scale, anchorY, facing, seed, prompt   src/engine/PaintedArt.ts `tryLoadMeta` (every pose and backdrop), through
 *                                                                    `fx/mix/twirl.ts`; `width` and `height` also `src/ui/ffx/portraits.ts`
 *   focal                                                            src/ui/common/portrait.ts (`fx`, `fy`, `ipd`), src/ui/common/chapterPanel.ts (`x`, `y`)
 *   headTop                                                          src/ui/common/restPoses.ts
 * (`seed` and `prompt` are copied into the loader's `PoseMeta` and no code reads them from there; they stay because `tryLoadMeta` reads them.)
 */
export const SIDECAR_FIELDS = Object.freeze(['width', 'height', 'baselineY', 'scale', 'anchorY', 'facing', 'seed', 'prompt', 'focal', 'headTop']);

const FIELD_SET = new Set(SIDECAR_FIELDS);

/**
 * The JSON files under `art/` that are not painting sidecars: the two manifests the game reads whole (`src/engine/ArtManifest.ts`,
 * `src/app/screens/pause/livingParts.ts`) and the build's own record of what it derived (`art/derived.json`, written after the sidecars).
 * Paths are relative to the site root (the master folder's `public/`, the build output).
 */
export const NON_SIDECAR_ART_JSON = Object.freeze(['art/manifest.json', 'art/portrait-parts/manifest.json', 'art/derived.json']);

/**
 * A rig's file (`art/rigs/<subject>/rig.json`, the rig program of 2026-10-17: one painting cut into parts on a bone rig, `src/data/art/rigTypes.ts`) is the game's data read whole, not a painting's
 * sidecar: cut to the ten sidecar fields it would be `{}`, and the stamp the deploy verifies is a digest of its content. It takes the other art JSON's rule (local paths replaced, nothing else).
 */
const RIG_FILE = /^art\/rigs\/[^/]+\/rig\.json$/i;

/** Is this site-relative path (`art/characters/yuna/idle.json`) a painting sidecar, whose keys the build cuts to {@link SIDECAR_FIELDS}? */
export function isSidecarJson(rel) {
  const r = rel.replace(/\\/g, '/');
  return r.startsWith('art/') && r.toLowerCase().endsWith('.json') && !NON_SIDECAR_ART_JSON.includes(r) && !RIG_FILE.test(r);
}

// ---------------------------------------------------------------------------------------------------- a small scanner for the top level of an object

const WS = new Set([32, 9, 10, 13]);

const skipWs = (text, i) => {
  while (i < text.length && WS.has(text.charCodeAt(i))) i++;
  return i;
};

/** The end (exclusive) of the string literal that starts at `i`. */
function stringEnd(text, i) {
  let j = i + 1;
  while (j < text.length) {
    const c = text.charCodeAt(j);
    if (c === 92) j += 2;
    else if (c === 34) return j + 1;
    else j++;
  }
  throw new SyntaxError('unterminated string');
}

/** The end (exclusive) of the JSON value that starts at `i`: a string, an object or array (to its matching bracket), or a number or word. */
function valueEnd(text, i) {
  const c = text.charCodeAt(i);
  if (c === 34) return stringEnd(text, i);
  if (c === 123 || c === 91) {
    let depth = 0;
    let j = i;
    while (j < text.length) {
      const d = text.charCodeAt(j);
      if (d === 34) {
        j = stringEnd(text, j);
        continue;
      }
      if (d === 123 || d === 91) depth++;
      else if (d === 125 || d === 93) {
        depth--;
        if (depth === 0) return j + 1;
      }
      j++;
    }
    throw new SyntaxError('unterminated value');
  }
  let j = i;
  while (j < text.length) {
    const d = text.charCodeAt(j);
    if (WS.has(d) || d === 44 || d === 125 || d === 93) break;
    j++;
  }
  return j;
}

/** An object or array value with the white space between its tokens dropped; strings, numbers and words are copied as they are. */
function compactValue(value) {
  let out = '';
  let i = 0;
  while (i < value.length) {
    const c = value.charCodeAt(i);
    if (c === 34) {
      const e = stringEnd(value, i);
      out += value.slice(i, e);
      i = e;
    } else {
      if (!WS.has(c)) out += value[i];
      i++;
    }
  }
  return out;
}

/**
 * The members of the top-level object of a JSON text, in order of appearance: `{ key, keyStart, valueStart, valueEnd }` (offsets into the text).
 * Throws a `SyntaxError` when the text is not JSON and a `TypeError` when it is JSON but not an object.
 * @param {string} text
 * @returns {{ key: string; keyStart: number; valueStart: number; valueEnd: number }[]}
 */
export function topLevelMembers(text) {
  JSON.parse(text); // the scanner below trusts the structure
  let i = skipWs(text, 0);
  if (text.charCodeAt(i) !== 123) throw new TypeError('a sidecar is a JSON object');
  i = skipWs(text, i + 1);
  const members = [];
  while (text.charCodeAt(i) !== 125) {
    const keyStart = i;
    const keyEnd = stringEnd(text, i);
    const key = JSON.parse(text.slice(keyStart, keyEnd));
    i = skipWs(text, skipWs(text, keyEnd) + 1); // past the colon
    const end = valueEnd(text, i);
    members.push({ key, keyStart, valueStart: i, valueEnd: end });
    i = skipWs(text, end);
    if (text.charCodeAt(i) === 44) i = skipWs(text, i + 1);
  }
  return members;
}

// ---------------------------------------------------------------------------------------------------- the projection

/**
 * A sidecar's master text cut to {@link SIDECAR_FIELDS}; see the header for the rule. Returns `{ text, kept, dropped }`: the new text, the
 * keys kept (in order) and the keys left out (in order of first appearance; a key's name only, never a value).
 * @param {string} text
 * @returns {{ text: string; kept: string[]; dropped: string[] }}
 */
export function projectSidecarText(text) {
  const members = topLevelMembers(text);
  const last = new Map();
  for (const m of members) last.set(m.key, m);
  const seen = new Set();
  const kept = [];
  const dropped = [];
  const lines = [];
  for (const m of members) {
    if (seen.has(m.key)) continue;
    seen.add(m.key);
    if (!FIELD_SET.has(m.key)) {
      dropped.push(m.key);
      continue;
    }
    const v = /** @type {{ valueStart: number; valueEnd: number }} */ (last.get(m.key));
    kept.push(m.key);
    lines.push(`  ${JSON.stringify(m.key)}: ${compactValue(text.slice(v.valueStart, v.valueEnd))}`);
  }
  return { text: lines.length ? `{\n${lines.join(',\n')}\n}\n` : '{}\n', kept, dropped };
}

/**
 * The top-level keys of a sidecar's text that are not on {@link SIDECAR_FIELDS}, with the offset of each key. A text that is not a JSON
 * object answers `null` (the caller reports the file; nothing can be said about its keys).
 * @param {string} text
 * @returns {{ key: string; offset: number }[] | null}
 */
export function keysOutsideList(text) {
  try {
    return topLevelMembers(text)
      .filter((m) => !FIELD_SET.has(m.key))
      .map((m) => ({ key: m.key, offset: m.keyStart }));
  } catch {
    return null;
  }
}
