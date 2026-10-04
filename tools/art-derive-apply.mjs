/**
 * The output side of the art derivation (release 38, "r38-bytes"): the names of the derived files, the record a build ships as
 * `art/derived.json`, and putting a plan into a build output folder. Split out of `art-derive-lib.mjs` (which re-exports all of it) so
 * that file stays inside its line budget. Node built-ins only.
 *
 * Game case: both (shared build plumbing; no game content).
 */
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Where `applyPlan` writes the record of what was derived (inside the build output, so it ships and is hashed). */
export const DERIVED_REPORT = 'art/derived.json';

/** `art/a/b.png` -> `art/a/b.webp`. */
export const webpName = (rel) => rel.replace(/\.png$/, '.webp');

/** The masters shipped as WebP, sorted: the list `ArtShipped.ts` reads as `__PYREFLY_ART_WEBP__`. */
export const shippedList = (plan) => plan.entries.filter((e) => e.kind === 'webp').map((e) => e.rel).sort();

const RULES = {
  exact: 'A master ships as WebP only if every decoder draws it the same from the WebP as from the PNG: it is opaque, or its alpha is only 0 and 255 with no colour left under alpha 0. Every other master ships as a PNG, recompressed at maximum effort with the colour under alpha 0 kept.',
};

/** The record shipped as `art/derived.json`: no clock, so a build of the same inputs is the same bytes. */
export function derivedReport(plan) {
  return {
    version: 1, tool: 'tools/art-derive.mjs', encoder: plan.encoder, ...(plan.pngEncoder ? { pngEncoder: plan.pngEncoder } : {}), scope: plan.scope, ...(RULES[plan.scope] ? { rule: RULES[plan.scope] } : {}), counts: plan.counts, bytes: plan.bytes,
    note: 'Every art PNG the build ships, and what it shipped as. kind webp: the master PNG is not shipped, `shipped` is its lossless WebP; kind png: the shipped PNG is the master recompressed (the same decoded RGBA, colour under alpha 0 included); kind copy: the master\'s own bytes. `rgba` is the sha256 of the decoded 8-bit RGBA of the master, which the shipped file decodes to (proved at build and by tools/art-derive.mjs verify). `alpha` is the master\'s transparency class and `hidden` how many fully transparent texels of it still carry colour.',
    files: plan.entries.map((e) => ({ path: e.rel, kind: e.kind, ...(e.kind === 'webp' ? { shipped: e.shippedRel } : {}), master: e.masterBytes, bytes: e.shippedBytes, ...(e.rgba ? { rgba: e.rgba } : {}), ...(e.alpha ? { alpha: e.alpha } : {}), ...(e.alpha && e.hidden !== undefined ? { hidden: e.hidden } : {}), ...(e.note ? { note: e.note } : {}) })),
  };
}

/**
 * Put the plan into a build output: each derived WebP copied from the cache and its PNG removed from `outDir` (never from
 * `public/`), each recompressed PNG replacing its copy, and the record written. A master the build did not copy (no PNG at
 * `outDir/<rel>`) is left alone. Returns what was applied.
 */
export function applyPlan(outDir, plan) {
  const applied = { webp: 0, png: 0, skipped: [] };
  for (const e of plan.entries) {
    const dst = join(outDir, e.rel);
    if (e.kind === 'copy') continue;
    if (!existsSync(dst)) {
      applied.skipped.push(e.rel);
      continue;
    }
    if (e.kind === 'webp') {
      const to = join(outDir, e.shippedRel);
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(e.file, to);
      if (statSync(to).size !== e.shippedBytes) throw new Error(`${e.shippedRel}: the copy in the build is not the cached file`);
      rmSync(dst, { force: true });
      applied.webp++;
    } else {
      copyFileSync(e.file, dst);
      if (statSync(dst).size !== e.shippedBytes) throw new Error(`${e.rel}: the recompressed copy in the build is not the cached file`);
      applied.png++;
    }
  }
  if (plan.entries.length === 0) return applied; // a checkout without the art (it is gitignored): nothing derived, nothing to record
  const kept = new Set(applied.skipped);
  const report = derivedReport({ ...plan, entries: plan.entries.filter((e) => !kept.has(e.rel)) });
  const file = join(outDir, DERIVED_REPORT);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(report)}\n`);
  return applied;
}
