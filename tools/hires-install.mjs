#!/usr/bin/env node
/**
 * Install the high-resolution masters of the hi-res library into `public/art` (release 39, "r39-hires-engine"; both games,
 * shared build plumbing, no game content).
 *
 *   node tools/hires-install.mjs                     dry run: what would be installed, skipped and derived, with bytes
 *   node tools/hires-install.mjs --apply             do it
 *   node tools/hires-install.mjs --only characters/tidus,backdrops/gagazet   a subset (prefix match on the asset id)
 *   node tools/hires-install.mjs --redo3             re-derive every @3x (after a change to how it is derived)
 *   node tools/hires-install.mjs --lib <dir> --art <dir> --copy
 *   node tools/hires-install.mjs --lib <fixed library> --replace-from <the library installed now> --park <dir> --only characters/,backdrops/
 *                                                    upgrade: where `public/art` holds exactly the old library's file, put the new library's file in its
 *                                                    place and derive the @3x again; what is replaced is recorded (and copied when it is not a link) under --park
 *
 * Held-back backdrops (`HELD_BACKDROPS`): a backdrop whose master draws line structure the approved painting does not have is never installed
 * and, with --replace-from, is taken out of `public/art` again: the game then draws the approved painting. A re-render is owed for each.
 *
 * The library (`D:/Tools/pyrefly-art-backup/hires`, `manifest.json`) holds, per painting, `<name>@4x.png` and `<name>@2x.png`
 * (figures: 4x and its 2x reduction; wide-only assets and backdrops: the 2x). They are ADDED beside the approved 1x paintings, which
 * are never touched: a master is installed only when the 1x file beside it still has the sha256 the library rendered it from
 * (`source_sha256`), when its size is exactly the scale times the 1x size, and when it is not already there (an existing file is
 * never overwritten: the pilot idle masters of release 35 stay as approved). `@3x` is derived from `@4x` here (premultiplied
 * Lanczos, 0.75), because the held shots that magnify a face 2.4x to 3x at 1440p want exactly that master.
 *
 * Files are hard-linked from the library (no extra bytes; the library is write-once) and copied when the link fails or `--copy`
 * says so. Nothing is ever deleted. Run `node tools/gen/manifest.mjs` afterwards: the manifest lists the masters (`tiers`,
 * `backdropTiers`) and the game never asks for one that is not listed.
 */
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_LIB = process.env.PYREFLY_HIRES_LIB ?? 'D:/Tools/pyrefly-art-backup/hires';

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

/**
 * Backdrops whose 2x master is held back. The mechanism stays (a held backdrop is never installed and, with --replace-from, is taken out of
 * `public/art` again); the list is EMPTY since the evening of 2026-10-04 (release 39, r39-art lane).
 *
 * History: the release 39 repair held six masters because the independent fidelity check and the repair's own survey found that they draw dark,
 * hard line structure the approved painting does not have: Gagazet invented dark branching twig-like lines across the rock (the lowest SSIM of the set,
 * 0.958); Garden of Pain, Via Purifico, the Road to the Farplane (and its links variant) and the title's water replaced soft ripples and floor bands with
 * ruled, ruler-straight dark stripes. The cause is in the library recipe, not in the paintings: RealESRGAN (and the SDXL refine on top of it for Gagazet)
 * turns a soft ripple, a speckle or a faint crack into a crisp dark line. The six were re-made from their approved paintings with a recipe that cannot
 * draw what the painting does not imply (`D:/Tools/pyrefly-art-backup/hires-r39-art/`, tier `faithful`; `tools/gen/hires-faithful/`): ESRGAN stays as a detail source
 * only, its detail is squashed per pixel to an amplitude the painting's own fine detail allows, and thin dark lines the painting does not imply are blended back
 * to a bounded adaptive unsharp master. Each passes the backdrop QC and was looked at 1:1 against the approved painting and the held master.
 * Game case: per backdrop (Gagazet, Garden of Pain, Via Purifico: FFX; the Road to the Farplane, Chapter XI: FFX-2; `backdrops/title.png` is a sea and a horizon
 * that the title screen no longer draws, it shows `title/keyart.png`, so that master changes nothing on screen).
 */
export const HELD_BACKDROPS = Object.freeze({});

/** The backdrop key of a library output path (`backdrops/gagazet@2x.png` -> `gagazet`), or null for anything else. */
export function backdropKey(outputPath) {
  const m = /^backdrops\/([^/]+)@[2-4]x\.png$/.exec(outputPath);
  return m ? m[1] : null;
}

/** Is `a` the same file as `b`: one inode (a hard link) or the same bytes. */
export function sameFile(a, b) {
  if (!existsSync(a) || !existsSync(b)) return false;
  const sa = statSync(a, { bigint: true });
  const sb = statSync(b, { bigint: true });
  if (sa.dev === sb.dev && sa.ino === sb.ino && sa.ino !== 0n) return true;
  return sa.size === sb.size && sha256(a) === sha256(b);
}

/** The 1x painting of a library asset: `characters/tidus/idle@4x` or the record's `src` -> `<art>/characters/tidus/idle.png`. */
export function oneXPath(art, outputPath) {
  return join(art, outputPath.replace(/@[2-4]x\.png$/, '.png'));
}

/** Plan every install; pure but for the file reads. Returns `{ jobs, skipped }`. */
export async function plan({ lib, art, only, scales, backdropMax = 2, redo3 = false, replaceFrom = null, held = HELD_BACKDROPS }) {
  const sharp = (await import('sharp')).default;
  const manifest = JSON.parse(readFileSync(join(lib, 'manifest.json'), 'utf8'));
  const jobs = [];
  const skipped = [];
  const sizeCache = new Map();
  const sizeOf = async (file) => {
    if (!sizeCache.has(file)) {
      const m = await sharp(file).metadata();
      sizeCache.set(file, [m.width, m.height]);
    }
    return sizeCache.get(file);
  };
  const shaCache = new Map();
  const shaOf = (file) => {
    if (!shaCache.has(file)) shaCache.set(file, sha256(file));
    return shaCache.get(file);
  };
  const wanted = (id) => !only.length || only.some((p) => id.startsWith(p));
  for (const rec of Object.values(manifest.assets)) {
    if (!wanted(rec.id) || rec.status !== 'ok' || (rec.flags ?? []).length) {
      if (wanted(rec.id)) skipped.push({ id: rec.id, why: rec.status !== 'ok' ? `status ${rec.status}` : `flags ${rec.flags.join(',')}` });
      continue;
    }
    for (const out of rec.outputs) {
      if (!scales.includes(out.scale)) continue;
      // A backdrop is never drawn above 2x (its depth plates are four textures of that size); a 4x master of one is 264 MB of GPU.
      if (out.path.startsWith('backdrops/') && out.scale > backdropMax) continue;
      const from = join(lib, out.path);
      const to = join(art, out.path);
      const heldKey = backdropKey(out.path);
      if (heldKey !== null && Object.hasOwn(held, heldKey)) {
        // held back: never installed; an installed copy that is exactly the old library's file is taken out (parked) when upgrading
        if (replaceFrom && existsSync(to) && sameFile(to, join(replaceFrom, out.path))) jobs.push({ kind: 'drop', id: out.path, from: null, to, bytes: 0 });
        skipped.push({ id: out.path, why: `held back: ${held[heldKey]} (re-render owed)` });
        continue;
      }
      const one = oneXPath(art, out.path);
      if (!existsSync(from) || statSync(from).size !== out.bytes_png) {
        skipped.push({ id: out.path, why: 'library file missing or still being written' });
        continue;
      }
      if (!existsSync(one)) {
        skipped.push({ id: out.path, why: 'no approved 1x painting beside it' });
        continue;
      }
      if (rec.source_sha256 && shaOf(one) !== rec.source_sha256) {
        skipped.push({ id: out.path, why: '1x painting changed since the master was rendered (sha256)' });
        continue;
      }
      const [w1, h1] = await sizeOf(one);
      if (out.size[0] !== w1 * out.scale || out.size[1] !== h1 * out.scale) {
        skipped.push({ id: out.path, why: `size ${out.size.join('x')} is not ${out.scale} x ${w1}x${h1}` });
        continue;
      }
      let upgraded = false;
      if (existsSync(to)) {
        if (replaceFrom && !sameFile(to, from) && sameFile(to, join(replaceFrom, out.path))) {
          // exactly the old library's file: put the new library's file in its place
          jobs.push({ kind: 'replace', id: out.path, from, to, bytes: out.bytes_png });
          upgraded = true;
        } else {
          skipped.push({ id: out.path, why: replaceFrom && !sameFile(to, from) ? 'already installed (not the old library\'s file, so kept)' : 'already installed' });
        }
      } else {
        jobs.push({ kind: 'link', id: out.path, from, to, bytes: out.bytes_png });
      }
      // @3x from @4x, when the library has the 4x and 3x is asked for and absent (or the 4x was just replaced, so the 3x is derived from the new one)
      if (out.scale === 4 && scales.includes(3)) {
        const to3 = join(art, out.path.replace('@4x.png', '@3x.png'));
        if (redo3 || upgraded || !existsSync(to3)) jobs.push({ kind: 'derive3', id: out.path.replace('@4x.png', '@3x.png'), from, to: to3, bytes: Math.round(out.bytes_png * 0.56), size: [w1 * 3, h1 * 3] });
      }
    }
  }
  return { jobs, skipped };
}

/** Run `fn` over `items` with at most `n` in flight. */
async function pool(items, n, fn) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.max(1, n) }, worker));
}

/**
 * 4x -> 3x without losing the colour under the transparent pixels. A straight resize of an RGBA image premultiplies, so everything
 * under alpha 0 comes back as one flat colour (a first version of this tool wrote (76,105,113) under every transparent pixel of a 3x
 * master: a teal-grey halo wherever a texel is magnified); the 4x master keeps a ring of the figure's own colour under the transparent
 * pixels beside its silhouette so bilinear and mip filtering never blend in black or grey. So the colour and the alpha are resized apart
 * (Lanczos on each, straight), which keeps that ring, and joined again.
 */
export async function derive3(sharp, j) {
  const [w, h] = j.size;
  // Colour and alpha are split in plain buffers first: sharp applies `removeAlpha` after the resize, so on the file itself the resize would still premultiply.
  const src = await sharp(j.from).raw().toBuffer({ resolveWithObject: true });
  const { width: sw, height: sh } = src.info;
  const rgb = Buffer.alloc(sw * sh * 3);
  const alpha = Buffer.alloc(sw * sh);
  for (let i = 0, k = 0, a = 0; a < sw * sh; a++, i += 4, k += 3) {
    rgb[k] = src.data[i];
    rgb[k + 1] = src.data[i + 1];
    rgb[k + 2] = src.data[i + 2];
    alpha[a] = src.data[i + 3];
  }
  const resize = (data, channels) => {
    const img = sharp(data, { raw: { width: sw, height: sh, channels } }).resize({ width: w, height: h, kernel: 'lanczos3', fit: 'fill' });
    // A one-channel raw buffer comes back as three grey channels unless the channel is taken out again.
    return (channels === 1 ? img.extractChannel(0) : img).raw().toBuffer({ resolveWithObject: true }).then((r) => {
      if (r.info.channels !== channels) throw new Error(`derive3: expected ${channels} channel(s), got ${r.info.channels}`);
      return r.data;
    });
  };
  const rgb3 = await resize(rgb, 3);
  const alpha3 = await resize(alpha, 1);
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0, k = 0, a = 0; a < w * h; a++, i += 4, k += 3) {
    out[i] = rgb3[k];
    out[i + 1] = rgb3[k + 1];
    out[i + 2] = rgb3[k + 2];
    out[i + 3] = alpha3[a];
  }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 6 }).toFile(j.to);
}

/**
 * Before an installed file is replaced or dropped: record it, and copy it when it is the only copy. A hard link of a library file
 * (more than one link) keeps its data in the library, so only its name, size and links are written down; a derived file (one link,
 * an @3x) is copied under `parkDir` first. Nothing is ever deleted without that record. Returns the record.
 */
export function park(to, art, parkDir) {
  const st = statSync(to);
  const rel = relative(art, to).split('\\').join('/');
  const rec = { path: rel, bytes: st.size, links: st.nlink };
  if (!parkDir) return rec;
  if (st.nlink > 1) return { ...rec, note: 'a hard link of a library file; the data stays in that library' };
  const dst = join(parkDir, rel);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(to, dst);
  if (statSync(dst).size !== st.size) throw new Error(`park: ${dst} is not the size of ${to}`);
  return { ...rec, parkedTo: dst };
}

const linkOrCopy = (from, to, copy) => {
  mkdirSync(dirname(to), { recursive: true });
  if (copy) copyFileSync(from, to);
  else {
    try {
      linkSync(from, to);
    } catch {
      copyFileSync(from, to);
    }
  }
};

async function apply(jobs, copy, { art = null, parkDir = null } = {}) {
  const sharp = (await import('sharp')).default;
  sharp.cache(false);
  sharp.concurrency(1); // the pool below owns the parallelism
  let n = 0;
  const parked = [];
  for (const j of jobs.filter((x) => x.kind === 'link')) {
    linkOrCopy(j.from, j.to, copy);
    n++;
  }
  // an upgrade: the name goes (its data stays in the old library), then the new library's file takes it; a held-back master is only taken out
  for (const j of jobs.filter((x) => x.kind === 'replace' || x.kind === 'drop')) {
    parked.push({ ...park(j.to, art, parkDir), action: j.kind });
    unlinkSync(j.to);
    if (j.kind === 'replace') linkOrCopy(j.from, j.to, copy);
    n++;
  }
  // The 3x derivations are the slow part (a 13-megapixel resize and PNG each). The build recompresses every master anyway
  // (`tools/art-derive.mjs`), so the installed file is written at a quick compression level.
  const derive = jobs.filter((x) => x.kind === 'derive3');
  await pool(derive, Math.min(4, Math.max(1, cpus().length >> 1)), async (j) => {
    mkdirSync(dirname(j.to), { recursive: true });
    if (existsSync(j.to)) parked.push({ ...park(j.to, art, parkDir), action: 'derive3-again' });
    await derive3(sharp, j);
    n++;
  });
  if (parkDir && parked.length) {
    mkdirSync(parkDir, { recursive: true });
    writeFileSync(join(parkDir, 'parked.json'), `${JSON.stringify({ at: new Date().toISOString(), art, count: parked.length, files: parked }, null, 1)}\n`);
  }
  return n;
}

async function main(argv) {
  const get = (name, d) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : d;
  };
  const lib = resolve(get('--lib', DEFAULT_LIB));
  const art = resolve(get('--art', join(ROOT, 'public', 'art')));
  const only = (get('--only', '') || '').split(',').filter(Boolean);
  const scales = (get('--scales', '2,3,4') || '').split(',').map(Number).filter((n) => n >= 2 && n <= 4);
  const replaceFrom = get('--replace-from', null) ? resolve(get('--replace-from', null)) : null;
  const parkDir = get('--park', null) ? resolve(get('--park', null)) : null;
  const { jobs, skipped } = await plan({ lib, art, only, scales, redo3: argv.includes('--redo3'), replaceFrom });
  const bytes = jobs.reduce((s, j) => s + j.bytes, 0);
  const by = {};
  for (const j of jobs) by[j.kind] = (by[j.kind] ?? 0) + 1;
  console.log(`hires-install ${argv.includes('--apply') ? 'APPLY' : 'dry run'}: ${jobs.length} to install (${JSON.stringify(by)}, ~${mb(bytes)}), ${skipped.length} skipped`);
  const why = {};
  for (const s of skipped) why[s.why] = (why[s.why] ?? 0) + 1;
  console.log(`  skipped: ${JSON.stringify(why)}`);
  if (argv.includes('--verbose')) for (const j of jobs) console.log(`  + ${j.id}`);
  if (!argv.includes('--apply')) {
    console.log('  (nothing written; pass --apply)');
    return 0;
  }
  const n = await apply(jobs, argv.includes('--copy'), { art, parkDir });
  console.log(`hires-install: ${n} file(s) written under ${art}; run node tools/gen/manifest.mjs next`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => {
    console.error(e);
    process.exit(1);
  });
}
