/**
 * The two gates that prove a build's derived art (`tools/art-derive.mjs`) is what it claims to be (release 38, "r38-bytes").
 *
 * **verifyShippedArt: pixel identity.** For every art PNG in `public/`, the build output holds exactly one of the master PNG or
 * a lossless WebP of it, and the file it holds decodes to the master's pixels: the sha256 of the decoded 8-bit RGBA bytes
 * (all four channels, the colour under alpha 0 included, and the width and height) are equal. A kept PNG must be the master's bytes
 * or decode to the same pixels, and a recompressed one must not carry a colour or orientation chunk its master lacks. Both sides
 * are decoded again here, from the files, never trusted from a cache or from `art/derived.json`; the record is checked against
 * what was found. This is the gate the deploy runs on the build it is about to publish.
 *
 * **Exactness (on by default; `exact: false` opts out).** Equal decoded pixels are not enough: a browser that premultiplies a decoded
 * WebP and a decoded PNG differently draws them differently wherever alpha is not 255 (the independent check of 2026-10-03 found a
 * 2x master up to 124 in 255 apart through the game's matte, and WebKit dropping the colour under alpha 0 of a WebP). A WebP may
 * therefore ship only for a master that is opaque, or has only alpha 0 and 255 with nothing hidden under alpha 0
 * (`decoderIndependent`, `art-image-facts.mjs`), judged from the decoded master, not from the record.
 *
 * **Size floor (always on, `exact: false` too).** A shipped WebP under `MIN_WEBP_BYTES` (64) is a problem: Playwright's WebKit cannot
 * load a 28-byte WebP, so two fully transparent layers left Paine's living pause portrait static there (the re-check's B3). Whether a
 * file LOADS is proved in the engines themselves by `tools/art-browser-load.mjs`.
 *
 * **Strip thumbnails (r44-thumbs).** `verifyShippedArt` also runs `tools/art-thumb-verify.mjs`: the small copies of the paintings the chapter
 * board's strips paint must decode to their master resized again by the rule, pixel for pixel, and the build must hold exactly the ones its
 * record lists, for every master of `src/data/art/strip-art.json`. The audit below also reads them: every `*.thumb.webp|png` name the
 * bundle or the record carries must be a shipped file, and the bundle and the record must name the same ones.
 *
 * **Sidecars (r46-fix, FOC46-01).** `verifyShippedArt` also runs `verifyShippedSidecars`: every art JSON of `public/` is in the build as the master's text with the
 * local paths of the build PC replaced by their last names (`tools/art-sidecar-redact.mjs`, the function the build itself uses), and nothing else differs.
 *
 * **auditArtReferences: no reference to a file that is not there.** The art is reached by name from code, styles, pages and
 * data. After the derivation the PNG names of the derived files are no longer files, so the audit reads every shipped text
 * file and sorts each `art/<...>.png` or `art/<...>.webp` it names:
 *   - in a page or a stylesheet (`.html`, `.css`), or a JSON value that IS such a path (the whole string, `art/<...>.png`, with
 *     or without a base path before it): it MUST be a shipped file, or the page asks for a 404 (the title preload in
 *     `index.html` is the one that mattered);
 *   - in the bundle (`.js`): the code names masters, and `artUrl` maps the name to the shipped file at run time
 *     (`src/engine/ArtShipped.ts`), so a name that is a shipped PNG or a derived master is resolved; a name that is neither is
 *     "dangling". Some always were (art the manifest hides until it is installed), so a dangling name fails only when it is
 *     new against a `baselineDir` (an earlier build of the same sources), which is what "a PNG that is no longer shipped" means.
 * JSON files also carry PNG names as provenance (`"source": "public/art/backdrops/gagazet.png"` in `fx/<room>/depth.json`, the
 * sidecars' `prompt`, `masterOf`, `approvedOneX`): where a painting came from, inside a sentence or behind `public/` or a
 * drive letter. No code reads a path out of one, so a mention that is not the whole value is counted and not judged.
 * Names built at run time (`${state}.png`) cannot be read from text; the real-play audit (`tools/art-play-audit.mjs`) covers
 * them by watching every request.
 *
 * Game case: both (shared build plumbing).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

import { DERIVED_REPORT, MIN_WEBP_BYTES, listMasterPngs, pixelsOf, pool, webpName } from './art-derive-lib.mjs';
import { COLOUR_CHUNKS, decoderIndependent, pngChunkTypes } from './art-image-facts.mjs';
import { listMasterSidecars, redactJsonText } from './art-sidecar-redact.mjs';
import { verifyShippedThumbs } from './art-thumb-verify.mjs';
import { STRIP_LIST } from './art-thumbs.mjs';
import { THUMB_FILE } from './art-thumb-apply.mjs';

const walk = (root) => {
  const out = [];
  const go = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) go(full);
      else out.push({ rel: relative(root, full).split(sep).join('/'), full });
    }
  };
  if (existsSync(root)) go(root);
  return out;
};

const samePixels = (a, b) => a.hash === b.hash && a.width === b.width && a.height === b.height;

/**
 * **Sidecars (r46-fix, FOC46-01).** For every art JSON of `public/`, the build holds exactly the master's text with the local paths of the
 * build PC replaced by their last names (`redactJsonText`, the one function the build itself uses): the same keys, order, numbers and
 * formatting, only the string values that held a path differ. A shipped sidecar the build left unchanged where the master carries a path (the
 * paths would go live), or one that differs from the master anywhere else, is a problem. The game's own reads are proved equal by
 * `tests/unit/art-sidecar-redact.test.ts`; that no path is left anywhere in the build is `tools/dist-local-paths.mjs`.
 */
export function verifyShippedSidecars({ distDir, publicDir }) {
  const problems = [];
  const masters = listMasterSidecars(publicDir);
  let redacted = 0;
  for (const m of masters) {
    const shipped = join(distDir, m.rel);
    if (!existsSync(shipped)) {
      problems.push(`${m.rel}: the build does not hold this sidecar`);
      continue;
    }
    const master = readFileSync(m.full, 'utf8');
    const want = redactJsonText(master);
    if (want.text !== master) redacted++;
    if (readFileSync(shipped, 'utf8') !== want.text) problems.push(`${m.rel}: the shipped sidecar is not the master with its local paths replaced by their last names`);
  }
  return { checked: masters.length, redacted, problems };
}

/** The pixel-identity gate over a build output; see the file header. `listFile` is the strip list the thumbnails are checked against. */
export async function verifyShippedArt({ distDir, publicDir, jobs = 4, exact = true, listFile = join(publicDir, '..', STRIP_LIST) } = {}) {
  const t0 = Date.now();
  const problems = [];
  const masters = listMasterPngs(publicDir);
  const recordFile = join(distDir, DERIVED_REPORT);
  const record = existsSync(recordFile) ? JSON.parse(readFileSync(recordFile, 'utf8')) : null;
  const recorded = new Map((record?.files ?? []).map((f) => [f.path, f]));
  const n = { webp: 0, png: 0, decoded: 0 };
  await pool(masters, jobs, async (m) => {
    const png = join(distDir, m.rel);
    const webp = join(distDir, webpName(m.rel));
    const [hasPng, hasWebp] = [existsSync(png), existsSync(webp)];
    if (hasPng && hasWebp) return void problems.push(`${m.rel}: the build holds both the PNG and its derived WebP`);
    if (!hasPng && !hasWebp) return void problems.push(`${m.rel}: the build holds neither the PNG nor a WebP of it`);
    const shipped = hasWebp ? webp : png;
    const rec = recorded.get(m.rel);
    if (hasWebp) n.webp++;
    else n.png++;
    const masterBytes = readFileSync(m.full);
    const shippedBytes = readFileSync(shipped);
    let master = null;
    if (hasWebp || !masterBytes.equals(shippedBytes)) {
      // Decode both: the proof is the pixels, not a hash of a file.
      master = await pixelsOf(m.full, { facts: hasWebp });
      const got = await pixelsOf(shipped);
      n.decoded++;
      if (!samePixels(master, got)) problems.push(`${m.rel}: the shipped ${hasWebp ? 'WebP' : 'PNG'} decodes to different pixels than the master (${got.width}x${got.height} ${got.hash.slice(0, 12)} against ${master.width}x${master.height} ${master.hash.slice(0, 12)})`);
    }
    if (hasWebp && exact && !decoderIndependent(master.alpha, master.hidden)) {
      const why = master.alpha === 'translucent' ? 'has partly transparent pixels' : `keeps colour under ${master.hidden} fully transparent texel(s)`;
      problems.push(`${m.rel}: shipped as a WebP, but the master ${why}, so a decoder that premultiplies draws the WebP and the PNG differently (a build with PYREFLY_ART_WEBP=exact ships it as a PNG)`);
    }
    // Not an exactness rule, so it holds with `exact: false` too: a WebP this small does not load in WebKit (the re-check's B3).
    if (hasWebp && shippedBytes.length < MIN_WEBP_BYTES) {
      problems.push(`${m.rel}: the shipped WebP is only ${shippedBytes.length} bytes, under the ${MIN_WEBP_BYTES}-byte floor: WebKit cannot load a WebP that small (a build made with the floor ships the PNG)`);
    }
    if (hasPng && !masterBytes.equals(shippedBytes)) {
      const had = new Set(pngChunkTypes(masterBytes));
      const gained = pngChunkTypes(shippedBytes).filter((t) => COLOUR_CHUNKS.includes(t) && !had.has(t));
      if (gained.length) problems.push(`${m.rel}: the recompressed PNG carries ${gained.join(', ')}, which the master does not`);
    }
    if (record) {
      if (!rec) problems.push(`${m.rel}: art/derived.json has no entry for it`);
      else {
        if ((rec.kind === 'webp') !== hasWebp) problems.push(`${m.rel}: art/derived.json says ${rec.kind}, the build holds a ${hasWebp ? 'WebP' : 'PNG'}`);
        if (rec.bytes !== shippedBytes.length) problems.push(`${m.rel}: art/derived.json says ${rec.bytes} bytes, the file is ${shippedBytes.length}`);
        if (rec.rgba) {
          master ??= await pixelsOf(m.full);
          if (rec.rgba !== master.hash) problems.push(`${m.rel}: art/derived.json records pixels that are not the master's`);
        }
        if (hasWebp && ((rec.alpha !== undefined && rec.alpha !== master.alpha) || (rec.hidden !== undefined && rec.hidden !== master.hidden))) {
          problems.push(`${m.rel}: art/derived.json records ${rec.alpha}/${rec.hidden} for its transparency, the master is ${master.alpha}/${master.hidden}`);
        }
      }
    }
  });
  if (!record && n.webp > 0) problems.push(`${DERIVED_REPORT} is missing from a build that ships ${n.webp} derived WebP file(s)`);
  const names = new Set(masters.map((m) => m.rel));
  for (const f of recorded.keys()) if (!names.has(f)) problems.push(`${f}: art/derived.json lists a master that is not in public/art`);
  const thumbs = await verifyShippedThumbs({ distDir, publicDir, listFile, jobs });
  problems.push(...thumbs.problems);
  const sidecars = verifyShippedSidecars({ distDir, publicDir });
  problems.push(...sidecars.problems);
  problems.sort();
  return { ok: problems.length === 0, checked: masters.length, webp: n.webp, png: n.png, decoded: n.decoded, exact, thumbs: { checked: thumbs.checked, webp: thumbs.webp, png: thumbs.png, none: thumbs.none, enabled: thumbs.enabled }, sidecars: { checked: sidecars.checked, redacted: sidecars.redacted }, problems, ms: Date.now() - t0 };
}

const ART_NAME = String.raw`(?<![\w-])art\/[A-Za-z0-9_@.\-/]+?\.(?:png|webp)(?![\w])`;
const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.json']);
/** A JSON string that is a reference: nothing but an art path, `art/...`, `/art/...` or `/<base>/art/...`; `public/art/...` is provenance. */
const ART_VALUE = /^(?:\/[\w.-]+)?\/?(art\/[A-Za-z0-9_@.\-/]+\.(?:png|webp))$/;

/** The strings of a parsed JSON value. */
function* strings(value) {
  if (typeof value === 'string') yield value;
  else if (Array.isArray(value)) for (const v of value) yield* strings(v);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) yield* strings(v);
}

/** The `art/<...>.png|webp` names a text contains, de-duplicated. */
export function artNamesIn(text) {
  return [...new Set([...text.matchAll(new RegExp(ART_NAME, 'g'))].map((m) => m[0]))];
}

/** `.png` pieces of a template literal (`${state}.png`): names built at run time, which text cannot resolve. */
const dynamicPieces = (text) => (text.match(/\}\.png/g) ?? []).length;

function scan(distDir) {
  const files = walk(distDir);
  const have = new Set(files.map((f) => f.rel));
  const record = existsSync(join(distDir, DERIVED_REPORT)) ? JSON.parse(readFileSync(join(distDir, DERIVED_REPORT), 'utf8')) : null;
  const derived = new Set((record?.files ?? []).filter((f) => f.kind === 'webp').map((f) => f.path));
  // The strip thumbnails the record lists (r44-thumbs): each must be a shipped file, and the bundle must name the same ones.
  const thumbRecord = new Set((record?.thumbs?.files ?? []).filter((f) => f.thumb).map((f) => f.thumb));
  const thumbBundle = new Set();
  const strict = [];
  for (const name of thumbRecord) if (!have.has(name)) strict.push(`${DERIVED_REPORT}: lists the strip thumbnail ${name}, which is not in the build`);
  const dangling = new Set();
  const stats = { files: 0, strictNames: 0, jsNames: 0, jsShipped: 0, jsDerived: 0, thumbRecorded: thumbRecord.size, thumbNames: 0, provenanceMentions: 0, dynamicPieces: 0 };
  let bundles = 0;
  for (const f of files) {
    const ext = extname(f.rel).toLowerCase();
    if (!TEXT.has(ext) || f.rel === DERIVED_REPORT) continue;
    const text = readFileSync(f.full, 'utf8');
    stats.files++;
    if (ext === '.json') {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        strict.push(`${f.rel}: is not valid JSON`);
        continue;
      }
      for (const v of strings(parsed)) {
        const ref = ART_VALUE.exec(v);
        if (ref) {
          stats.strictNames++;
          if (!have.has(ref[1])) strict.push(`${f.rel}: names ${ref[1]}, which is not in the build`);
        } else stats.provenanceMentions += artNamesIn(v).length;
      }
      continue;
    }
    const names = artNamesIn(text);
    if (ext === '.js' || ext === '.mjs') {
      bundles++;
      stats.dynamicPieces += dynamicPieces(text);
      for (const name of names) {
        // A strip thumbnail is named by the map the build inserts (`__PYREFLY_ART_THUMBS__`); it is never "dangling", it is shipped or it is wrong.
        if (THUMB_FILE.test(name)) {
          stats.thumbNames++;
          thumbBundle.add(name);
          if (!have.has(name)) strict.push(`${f.rel}: names the strip thumbnail ${name}, which is not in the build`);
          else if (!thumbRecord.has(name)) strict.push(`${f.rel}: names the strip thumbnail ${name}, which ${DERIVED_REPORT} does not list`);
          continue;
        }
        stats.jsNames++;
        if (have.has(name)) stats.jsShipped++;
        else if (derived.has(name)) stats.jsDerived++;
        else dangling.add(name);
      }
    } else {
      for (const name of names) {
        stats.strictNames++;
        if (!have.has(name)) strict.push(`${f.rel}: names ${name}, which is not in the build`);
      }
    }
  }
  // The other direction: a thumbnail the record ships and no bundle names is a file nothing will ever ask for. Only judged where a bundle exists.
  if (bundles > 0) for (const name of thumbRecord) if (!thumbBundle.has(name)) strict.push(`${DERIVED_REPORT}: lists the strip thumbnail ${name}, and no bundle names it`);
  return { strict, dangling: [...dangling].sort(), stats };
}

/** The reference audit; see the file header. `baselineDir` is an earlier build of the same sources to measure "new" against. */
export function auditArtReferences(distDir, { baselineDir = null } = {}) {
  const t0 = Date.now();
  const now = scan(distDir);
  const before = baselineDir ? scan(baselineDir) : null;
  const was = new Set(before?.dangling ?? []);
  const newDangling = before ? now.dangling.filter((n) => !was.has(n)) : [];
  const problems = [...now.strict, ...newDangling.map((n) => `the bundle names ${n}, which is not shipped (as a PNG or as a derived WebP) and was not dangling in the baseline`)];
  return { ok: problems.length === 0, problems, strict: now.strict, dangling: now.dangling, baselineDangling: before?.dangling ?? null, newDangling, stats: now.stats, ms: Date.now() - t0 };
}

/** The audit as text, for the log and the handoff. */
export function formatAudit(r) {
  const s = r.stats;
  const lines = [
    `art-derive audit: ${r.ok ? 'PASS' : 'FAIL'}: ${s.files} text files read; ${s.strictNames} art name(s) in pages, styles and data, each a shipped file: ${r.strict.length === 0 ? 'yes' : `NO (${r.strict.length})`}`,
    `  bundle: ${s.jsNames} literal art name(s): ${s.jsShipped} a shipped file, ${s.jsDerived} a derived master (mapped at run time), ${r.dangling.length} dangling${r.baselineDangling ? ` (${r.baselineDangling.length} in the baseline build, ${r.newDangling.length} new)` : ''}; ${s.dynamicPieces} name(s) built at run time (covered by the real-play audit); ${s.provenanceMentions} provenance mention(s) in JSON, not judged`,
    `  strip thumbnails: ${s.thumbRecorded} in the record, ${s.thumbNames} name(s) in the bundle; each a shipped file and each in both: ${r.strict.some((p) => /strip thumbnail/.test(p)) ? 'NO' : 'yes'}`,
  ];
  for (const p of r.problems) lines.push(`  PROBLEM ${p}`);
  return lines.join('\n');
}
