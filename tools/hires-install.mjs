#!/usr/bin/env node
/**
 * Install the high-resolution masters of the hi-res library into `public/art` (release 39, "r39-hires-engine"; both games,
 * shared build plumbing, no game content).
 *
 *   node tools/hires-install.mjs                     dry run: what would be installed, skipped and derived, with bytes
 *   node tools/hires-install.mjs --apply             do it
 *   node tools/hires-install.mjs --only characters/tidus,backdrops/gagazet   a subset (prefix match on the asset id)
 *   node tools/hires-install.mjs --lib <dir> --art <dir> --copy
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
import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_LIB = process.env.PYREFLY_HIRES_LIB ?? 'D:/Tools/pyrefly-art-backup/hires';

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

/** The 1x painting of a library asset: `characters/tidus/idle@4x` or the record's `src` -> `<art>/characters/tidus/idle.png`. */
export function oneXPath(art, outputPath) {
  return join(art, outputPath.replace(/@[2-4]x\.png$/, '.png'));
}

/** Plan every install; pure but for the file reads. Returns `{ jobs, skipped }`. */
export async function plan({ lib, art, only, scales, backdropMax = 2 }) {
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
      if (existsSync(to)) {
        skipped.push({ id: out.path, why: 'already installed' });
      } else {
        jobs.push({ kind: 'link', id: out.path, from, to, bytes: out.bytes_png });
      }
      // @3x from @4x, when the library has the 4x and 3x is asked for and absent
      if (out.scale === 4 && scales.includes(3)) {
        const to3 = join(art, out.path.replace('@4x.png', '@3x.png'));
        if (!existsSync(to3)) jobs.push({ kind: 'derive3', id: out.path.replace('@4x.png', '@3x.png'), from, to: to3, bytes: Math.round(out.bytes_png * 0.56), size: [w1 * 3, h1 * 3] });
      }
    }
  }
  return { jobs, skipped };
}

async function apply(jobs, copy) {
  const sharp = (await import('sharp')).default;
  let n = 0;
  for (const j of jobs) {
    mkdirSync(dirname(j.to), { recursive: true });
    if (j.kind === 'link') {
      if (copy) copyFileSync(j.from, j.to);
      else {
        try {
          linkSync(j.from, j.to);
        } catch {
          copyFileSync(j.from, j.to);
        }
      }
    } else {
      await sharp(j.from).resize({ width: j.size[0], height: j.size[1], kernel: 'lanczos3', fit: 'fill' }).png({ compressionLevel: 9, effort: 7 }).toFile(j.to);
    }
    n++;
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
  const { jobs, skipped } = await plan({ lib, art, only, scales });
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
  const n = await apply(jobs, argv.includes('--copy'));
  console.log(`hires-install: ${n} file(s) written under ${art}; run node tools/gen/manifest.mjs next`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => {
    console.error(e);
    process.exit(1);
  });
}
