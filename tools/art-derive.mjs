#!/usr/bin/env node
/**
 * Derived lossless WebP for the shipped painted art: the command line (release 38, "r38-bytes").
 *
 * The library is `tools/art-derive-lib.mjs` (what it does, why, and what it proves), the gates are `tools/art-verify.mjs`, and
 * the Vite plugin that runs it in every production build is `tools/art-derive-plugin.mjs`. In short: the masters
 * `public/art/**.png` never change; a build ships a lossless WebP for each master it makes smaller (the PNG recompressed
 * where it does not), every one proved to decode to the master's pixels.
 *
 *   node tools/art-derive.mjs plan   [--scope exact|safe|all|partial|off] [--public public] [--cache <dir>] [--jobs N]
 *        what every art PNG becomes, encoding (and proving) whatever the cache lacks; prints the sizes
 *   node tools/art-derive.mjs warm   [same]
 *        plan with a larger worker pool (runs itself again with UV_THREADPOOL_SIZE = jobs): the first run on a cold cache
 *        encodes about 900 files at maximum effort, about 5 minutes for 54 of them at --jobs 6, roughly 30 for all
 *   node tools/art-derive.mjs verify --dir <build output> [--public public] [--jobs N] [--allow-inexact]
 *        the pixel-identity gate: every shipped WebP (and recompressed PNG) decodes to its master's pixels, and every WebP is of a master
 *        that every decoder draws the same (opaque, or alpha only 0 and 255 with nothing under alpha 0); exit 1 on any difference.
 *        `--allow-inexact` drops the second test, for a build made with PYREFLY_ART_WEBP=all|safe|partial that is being measured
 *   node tools/art-derive.mjs audit  --dir <build output> [--baseline <an earlier build of the same sources>]
 *        the reference audit: nothing names an art file the build does not hold; exit 1 on any
 *
 * `PYREFLY_ART_WEBP=off|partial|safe|exact|all` is the switch (default `exact`): `off` ships the PNGs exactly as before; `exact` ships
 * a WebP only for a master every decoder draws the same from it (opaque, or alpha only 0 and 255 with no colour under alpha 0:
 * premultiplying is then the identity) and ships every other master as a PNG recompressed at maximum effort, each proved to decode to
 * the master's RGBA in all four channels; `partial`, `safe` and `all` are not decoder independent and stay for measurement.
 * `PYREFLY_ART_CACHE` moves the cache (default `D:/Tools/pyrefly-art-cache`). The tool never deletes from `public/`.
 *
 * Game case: both (shared build plumbing; no game content).
 */
import { spawnSync } from 'node:child_process';
import { constants, cpus, setPriority } from 'node:os';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { planArtDerivation, resolveCache, resolveScope } from './art-derive-lib.mjs';
import { auditArtReferences, formatAudit, verifyShippedArt } from './art-verify.mjs';

/** The `--name value` pairs of an argument list. */
function option(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
}

async function main(argv) {
  const [command] = argv;
  try {
    setPriority(0, constants.priority.PRIORITY_BELOW_NORMAL); // a long run beside other work: never take the machine
  } catch {
    /* not allowed here: carry on at the normal priority */
  }
  const publicDir = resolve(option(argv, '--public', 'public'));
  const jobs = Number(option(argv, '--jobs', String(Math.min(4, Math.max(1, cpus().length >> 1)))));
  if (command === 'plan' || command === 'warm') {
    // A larger pool than libuv's default of four needs the variable before the pool starts: run again with it.
    if (command === 'warm' && process.env.UV_THREADPOOL_SIZE !== String(jobs)) {
      const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...argv], { stdio: 'inherit', env: { ...process.env, UV_THREADPOOL_SIZE: String(jobs) } });
      process.exitCode = r.status ?? 1;
      return;
    }
    const plan = await planArtDerivation({ publicDir, cacheDir: resolveCache(option(argv, '--cache')), scope: resolveScope(option(argv, '--scope') ?? undefined), jobs, log: (m) => console.log(m) });
    const mb = (n) => `${(n / 1e6).toFixed(1)} MB`;
    console.log(`art-derive ${plan.scope}: ${plan.counts.webp} webp, ${plan.counts.png} recompressed png, ${plan.counts.copy} unchanged; masters ${mb(plan.bytes.masters)} -> ${mb(plan.bytes.shipped)} (saves ${mb(plan.bytes.saved)}) in ${(plan.ms / 1000).toFixed(0)} s; cache ${plan.cacheDir}/${plan.encoder}`);
  } else if (command === 'verify' || command === 'audit') {
    if (!option(argv, '--dir')) throw new Error(`${command} needs --dir <build output>`);
    const dir = resolve(option(argv, '--dir'));
    if (command === 'verify') {
      const r = await verifyShippedArt({ distDir: dir, publicDir, jobs, exact: !argv.includes('--allow-inexact') });
      console.log(`art-derive verify${r.exact ? ' (exact)' : ' (--allow-inexact)'}: ${r.ok ? 'PASS' : 'FAIL'}: ${r.checked} masters checked (${r.webp} WebP, ${r.png} PNG, ${r.decoded} pixel-compared), ${r.problems.length} problem(s), ${(r.ms / 1000).toFixed(0)} s`);
      for (const p of r.problems) console.log(`  PROBLEM ${p}`);
      process.exitCode = r.ok ? 0 : 1;
    } else {
      const r = auditArtReferences(dir, { baselineDir: option(argv, '--baseline') ? resolve(option(argv, '--baseline')) : null });
      console.log(formatAudit(r));
      process.exitCode = r.ok ? 0 : 1;
    }
  } else {
    console.log('usage: art-derive.mjs plan|warm|verify|audit (see the header of this file)');
    process.exitCode = 64;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));
