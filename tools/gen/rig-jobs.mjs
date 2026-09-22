#!/usr/bin/env node
/**
 * Runs every inpaint job `tools/gen/rig-fill.py plan` wrote
 * (docs/concepts/pause-until-dawn/prototype-v2/art/v3/jobs/plan.json)
 * through tools/gen/inpaint.mjs in --latent mode (low denoise refine of the
 * pre-filled hidden region), `--count` variants each, one job after another
 * so the shared ComfyUI queue only ever holds one of ours.
 *
 *   node tools/gen/rig-jobs.mjs [--only neck,face] [--count 3] [--seed 7300]
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const JOBS = 'docs/concepts/pause-until-dawn/prototype-v2/art/v3/jobs';
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const plan = JSON.parse(readFileSync(resolve(REPO, JOBS, 'plan.json'), 'utf8'));
const only = opt('only', '') ? opt('only', '').split(',') : Object.keys(plan.jobs);
const count = opt('count', '3');
let seed = Number(opt('seed', '7300'));
mkdirSync(resolve(REPO, JOBS, 'out'), { recursive: true });
for (const name of only) {
  const job = plan.jobs[name];
  if (!job) throw new Error(`no job ${name}`);
  const args = ['tools/gen/inpaint.mjs', '--latent', '--image', job.src, '--mask', job.mask,
    '--box', '0,0,832,1216', '--pad', '0', '--tags', job.tags, '--denoise', String(job.denoise),
    '--count', count, ...(job.negAdd ? ['--negAdd', job.negAdd] : []), '--seed', String(seed), '--out', `${JOBS}/out/${name}`];
  seed += 100;
  const r = spawnSync('node', args, { cwd: REPO, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
