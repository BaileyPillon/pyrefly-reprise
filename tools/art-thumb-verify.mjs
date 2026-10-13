/**
 * The gate that proves a build's strip thumbnails (`tools/art-thumbs.mjs`) are what they claim to be (r44-thumbs): called by
 * `verifyShippedArt` (`tools/art-verify.mjs`), so `node tools/art-derive.mjs verify --dir <build>` and the deploy's art checks run it.
 *
 * A thumbnail is not its master, so "the same pixels" cannot be the test. What can be tested exactly is **derivation**: the thumbnails are
 * stored losslessly, so the shipped file must decode to the master resized again by the rule (`referenceThumb`, the one definition the
 * encoder also uses), pixel for pixel, all four channels. For every thumbnail the record (`art/derived.json`, `thumbs`) lists:
 *   - the build holds exactly one file for it, under the name the rule gives, of the size the record says;
 *   - it decodes to the master's re-derived pixels at the size the rule gives (width, height, sha256 of the RGBA), and the record says so too;
 *   - it is smaller than the master in pixels and in bytes (a "thumbnail" that is not a reduction is a failed build);
 *   - a WebP only where every decoder draws it the same (the picture is opaque) and not under the 64-byte floor WebKit needs;
 * and for the build as a whole:
 *   - every master of the strip list (`src/data/art/strip-art.json`) that is in `public/art` has an entry in the record, a thumbnail or a
 *     `none` with its reason, and every entry is a master of the list: a missing thumbnail is a strip that quietly goes back to 4 to 6 MB;
 *   - no `*.thumb.webp|png` file is in the build that the record does not list;
 *   - a record with no `thumbs` section, beside a list whose masters are in `public/art`, is a build made without them: a problem unless
 *     the build said it was told to (`thumbs.enabled: false`, `PYREFLY_ART_THUMBS=off`), which is allowed and reported.
 * The masters are read from `public/art` and never written.
 *
 * Game case: both (shared build plumbing; the chapter board's strips are one shared screen).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { DERIVED_REPORT, MIN_WEBP_BYTES, pixelsOf, pool } from './art-derive-lib.mjs';
import { decoderIndependent } from './art-image-facts.mjs';
import { THUMB_FILE, readStripList, referenceThumb, thumbName } from './art-thumbs.mjs';

const walk = (root) => {
  const out = [];
  const go = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) go(full);
      else out.push(relative(root, full).split(sep).join('/'));
    }
  };
  if (existsSync(root)) go(root);
  return out;
};

/** The thumbnail verification; returns `{ checked, webp, png, none, enabled, problems }` and never throws for a bad build. */
export async function verifyShippedThumbs({ distDir, publicDir, listFile = null, jobs = 4 } = {}) {
  const problems = [];
  const n = { checked: 0, webp: 0, png: 0, none: 0, enabled: true };
  const recordFile = join(distDir, DERIVED_REPORT);
  const record = existsSync(recordFile) ? JSON.parse(readFileSync(recordFile, 'utf8')) : null;
  if (!record) return { ...n, enabled: false, problems }; // verifyShippedArt says the record is missing; there is nothing to add
  let list = null;
  if (listFile && existsSync(listFile)) {
    try {
      list = readStripList(listFile);
    } catch (err) {
      problems.push(`${listFile}: ${err.message}`);
    }
  }
  const inPublic = (rel) => existsSync(join(publicDir, rel));
  const present = list ? list.filter(inPublic) : [];
  const section = record.thumbs;
  const stray = walk(join(distDir, 'art')).map((r) => `art/${r}`).filter((r) => THUMB_FILE.test(r));

  if (!section) {
    if (present.length > 0) problems.push(`${DERIVED_REPORT} has no thumbs section, but ${present.length} master(s) of the strip list are in public/art: the build shipped no strip thumbnails (a tool from before r44?)`);
    for (const r of stray) problems.push(`${r}: a strip thumbnail the record does not list`);
    return { ...n, enabled: false, problems };
  }
  if (section.enabled === false) {
    n.enabled = false;
    for (const r of stray) problems.push(`${r}: a strip thumbnail in a build whose record says none were made (${section.reason ?? 'off'})`);
    return { ...n, problems };
  }

  const files = section.files ?? [];
  const recorded = new Set(files.map((f) => f.path));
  const listed = new Set(list ?? []);
  if (list) {
    for (const rel of present) if (!recorded.has(rel)) problems.push(`${rel}: ${DERIVED_REPORT} has no thumbnail entry for it (a strip that would show the full picture)`);
    for (const f of files) if (!listed.has(f.path)) problems.push(`${f.path}: ${DERIVED_REPORT} lists a thumbnail for a master that is not in the strip list`);
  }
  const shipped = new Set(files.filter((f) => f.kind !== 'none' && f.thumb).map((f) => f.thumb));
  for (const r of stray) if (!shipped.has(r)) problems.push(`${r}: a strip thumbnail the record does not list`);

  await pool(files, jobs, async (f) => {
    n.checked++;
    if (f.kind === 'none') {
      n.none++;
      if (!f.note) problems.push(`${f.path}: ${DERIVED_REPORT} records no thumbnail and gives no reason`);
      for (const kind of ['webp', 'png']) {
        const extra = thumbName(f.path, kind);
        if (existsSync(join(distDir, extra))) problems.push(`${extra}: in the build, but the record says ${f.path} has no thumbnail`);
      }
      return;
    }
    if (f.kind !== 'webp' && f.kind !== 'png') return void problems.push(`${f.path}: ${DERIVED_REPORT} gives the thumbnail the kind "${f.kind}"`);
    n[f.kind]++;
    const want = thumbName(f.path, f.kind);
    if (f.thumb !== want) return void problems.push(`${f.path}: the record names the thumbnail ${f.thumb}, the rule names ${want}`);
    const other = thumbName(f.path, f.kind === 'webp' ? 'png' : 'webp');
    if (existsSync(join(distDir, other))) problems.push(`${other}: in the build beside ${want}: exactly one thumbnail per master`);
    const file = join(distDir, want);
    const masterFile = join(publicDir, f.path);
    if (!existsSync(file)) return void problems.push(`${want}: the record says it ships for ${f.path}, and the build does not hold it`);
    if (!existsSync(masterFile)) return void problems.push(`${f.path}: ${DERIVED_REPORT} lists a thumbnail for a master that is not in public/art`);
    const bytes = readFileSync(file);
    if (bytes.length !== f.bytes) problems.push(`${want}: the record says ${f.bytes} bytes, the file is ${bytes.length}`);
    const ref = await referenceThumb(masterFile, f.path);
    const got = await pixelsOf(bytes, { facts: true });
    if (!ref.reduced) problems.push(`${want}: the master is no larger than a thumbnail would be, so it should have none`);
    if (got.width !== ref.width || got.height !== ref.height) problems.push(`${want}: is ${got.width}x${got.height}, the rule gives ${ref.width}x${ref.height}`);
    else if (got.hash !== ref.hash) problems.push(`${want}: does not decode to the master resized by the rule (${got.hash.slice(0, 12)} against ${ref.hash.slice(0, 12)})`);
    if (f.rgba !== ref.hash) problems.push(`${want}: ${DERIVED_REPORT} records pixels that are not the rule's (${String(f.rgba).slice(0, 12)} against ${ref.hash.slice(0, 12)})`);
    if (f.width !== ref.width || f.height !== ref.height) problems.push(`${want}: ${DERIVED_REPORT} records ${f.width}x${f.height}, the rule gives ${ref.width}x${ref.height}`);
    if (ref.width * ref.height >= ref.masterWidth * ref.masterHeight || bytes.length >= statSync(masterFile).size) problems.push(`${want}: is not smaller than its master (${ref.width}x${ref.height}, ${bytes.length} bytes against ${ref.masterWidth}x${ref.masterHeight}, ${statSync(masterFile).size} bytes)`);
    if (f.kind === 'webp') {
      if (!decoderIndependent(ref.facts.alpha, ref.facts.hidden)) problems.push(`${want}: shipped as a WebP, but the picture has ${ref.facts.alpha === 'translucent' ? 'partly transparent pixels' : `colour under ${ref.facts.hidden} fully transparent texel(s)`}, so a decoder that premultiplies would draw it differently from a PNG`);
      if (bytes.length < MIN_WEBP_BYTES) problems.push(`${want}: is only ${bytes.length} bytes, under the ${MIN_WEBP_BYTES}-byte floor WebKit needs`);
    }
  });
  problems.sort();
  return { ...n, problems };
}
