#!/usr/bin/env node
/**
 * Living-portrait v4 (FFX-2 only): runs the LoRA inpaint jobs that
 * `tools/gen/rig-v4fix.py prep` (key fixes) or `rig-v4face.py prep`
 * (expressions) wrote, one at a time behind the shared ComfyUI queue,
 * through `tools/gen/inpaint.mjs` (`--lora yuna-x2`, the plate as the
 * IP-Adapter reference at 0.3, `--latent`: the start paint is encoded as it
 * is and only the mask is noised).
 *
 *   node tools/gen/rig-v4jobs.mjs --plan <plan.json> --jobs <dir> [--only a,b] [--count 3]
 *
 * The plan maps a job name to { box, tags, denoise, negAdd?, seed?, count?,
 * noRef? (no IP-Adapter: the plate's tassel in the reference kept coming back
 * in the hole it left) }; the job's
 * `<name>.init.png` and `<name>.mask.png` sit in --jobs; results land in
 * <jobs>/out/<name>.<n>.full.png (+ crop, sidecar, sheet).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const planFile = resolve(REPO, arg('--plan'));
const jobs = resolve(REPO, arg('--jobs'));
const only = arg('--only', null)?.split(',');
const count = arg('--count', '3');
const plan = JSON.parse(readFileSync(planFile, 'utf8'));
mkdirSync(resolve(jobs, 'out'), { recursive: true });

const NEG = 'rainbow, multicolored hair, streaked hair, gradient hair, hat, headwear, headphones, earpiece, braid, choker, necklace';
const STYLE = 'official art, cel shading, soft shading, rim lighting, detailed';

for (const [name, job] of Object.entries(plan)) {
  if (only && !only.includes(name)) continue;
  const args = [
    resolve(HERE, 'inpaint.mjs'),
    '--image', resolve(jobs, `${name}.init.png`),
    '--mask', resolve(jobs, `${name}.mask.png`),
    '--box', job.box.join(','),
    '--tags', job.tags,
    '--denoise', String(job.denoise),
    '--count', String(job.count ?? count),
    '--seed', String(job.seed ?? 4100),
    '--lora', 'yuna-x2.safetensors:0.8',
    '--identity', 'yunaX2, 1girl, solo',
    '--style', STYLE,
    ...(job.noRef ? [] : ['--ref', 'public/art/portraits/yuna-x2.png', '--refWeight', '0.3']),
    '--negAdd', job.negAdd ?? NEG,
    '--latent',
    '--out', resolve(jobs, 'out', name),
  ];
  console.log(`[v4jobs] ${name} denoise ${job.denoise}: ${job.tags}`);
  const r = spawnSync(process.execPath, args, { cwd: REPO, stdio: 'inherit', env: { ...process.env, INPAINT_WAIT_MIN: '120' } });
  if (r.status !== 0) {
    console.error(`[v4jobs] ${name} failed (${r.status})`);
    process.exitCode = 1;
  }
}
