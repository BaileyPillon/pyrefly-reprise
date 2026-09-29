#!/usr/bin/env node
/**
 * Songstress options round (FFX-2 only): 3 options per girl, N pilots each, from options.json.
 *   node docs/concepts/songstress-2026-09-29/render-options.mjs [optionKey,...] [--n=3] [--from=1]
 * Candidates: D:/Tools/pyrefly-art-backup/candidates/2026-09-29-songstress/options/<option>/cand-N.*
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, CAND, COMMON_NEG, STYLE_TAGS, QUALITY_TAGS } from './gpu.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const O = JSON.parse(readFileSync(join(HERE, 'options.json'), 'utf8'));
const args = process.argv.slice(2);
const only = args.find((a) => !a.startsWith('--'))?.split(',');
const n = +(args.find((a) => a.startsWith('--n='))?.slice(4) ?? 3);
const from = +(args.find((a) => a.startsWith('--from='))?.slice(7) ?? 1);
const ipaW = +(args.find((a) => a.startsWith('--ipa='))?.slice(6) ?? 0.5);

const jobs = [];
for (const [key, o] of Object.entries(O.options)) {
  if (only && !only.includes(key)) continue;
  const g = O.girls[o.girl];
  for (let i = from; i < from + n; i++) {
    jobs.push({
      key, n: i, dir: join(CAND, 'options', key), seed: o.seed0 + i, size: [832, 1216],
      positive: `1girl, solo, ${g.identity}, ${g.costume}, ${o.pose}, simple background, white background, ${STYLE_TAGS}, ${QUALITY_TAGS}`,
      negative: `${COMMON_NEG}, ${g.neg}, ${o.negPose}`,
      refs: [g.headRef], ipa: { weight: ipaW, type: 'ease in', start: 0.2, end: 0.8 },
      extra: { option: key, optionTitle: o.title, girl: o.girl, identitySource: g.idle },
    });
  }
}
await run(jobs);
