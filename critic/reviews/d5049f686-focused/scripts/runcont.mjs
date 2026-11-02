// One continuity run of the r73 motion lane under the review-browser lock, in the foreground of its own process.
//   node runcont.mjs --id=<run id> --chapter=<chapter id> [--query=?a=b] [--mode=observe|force] [--base=http://127.0.0.1:5733/] [--minutes=30] [--budget=<ms>] [--size=1600x900]
// Writes <EV>/<id>/ (continuity.json, strips, raw/<chapter>.json.gz, ff.jsonl, run.log, analysis.json). Measuring only.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { withLock, TREE, EV, NOW, log, argv } from './lib.mjs';

const id = argv('id');
const chapter = argv('chapter');
if (!id || !chapter) { console.error('usage: node runcont.mjs --id=<run id> --chapter=<chapter id> [--query=?x] [--mode=observe|force] [--minutes=30]'); process.exit(64); }
const query = argv('query', '');
const mode = argv('mode', 'observe');
const base = argv('base', NOW);
const minutes = Number(argv('minutes', '30'));
const budget = argv('budget', '');
const size = argv('size', '1600x900');
const dir = path.join(EV, id);
if (fs.existsSync(path.join(dir, 'analysis.json')) && !process.argv.includes('--force')) { log(`${id}: already done (analysis.json exists); --force to run again`); process.exit(0); }
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(path.join(dir, 'raw'), { recursive: true });
const ffLog = path.join(dir, 'ff.jsonl');
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''));
const preload = `file:///${here.replace(/\\/g, '/')}/ff-preload.mjs`;

const code = await withLock(`r62 focused review continuity ${id}`, () => new Promise((resolve) => {
  const args = ['critic/runner/lib/continuity.mjs', `--base=${base}`, `--evidence=${dir}`, `--chapters=${chapter}`, `--tag=${id}`, `--seed=${argv('seed', '1')}`, `--size=${size}`, '--goal=win'];
  if (budget) args.push(`--budget=${budget}`);
  const env = { ...process.env, PYREFLY_BROWSER: 'gpu', TEMP: 'D:/Tools/pyrefly-scratch/tmp', TMP: 'D:/Tools/pyrefly-scratch/tmp', FF_MODE: mode, FF_LOG: ffLog, CONT_RAW_DIR: path.join(dir, 'raw'), NODE_OPTIONS: `--import ${preload}` };
  if (query) env.PYREFLY_QUERY = query; else delete env.PYREFLY_QUERY;
  const out = fs.openSync(path.join(dir, 'run.log'), 'a');
  log(`run ${id}: ${chapter} ${query || '(no query)'} mode=${mode} base=${base}`);
  const t0 = Date.now();
  const child = spawn(process.execPath, args, { cwd: TREE, env, stdio: ['ignore', out, out] });
  child.on('exit', (c) => { log(`run ${id}: exit ${c} after ${Math.round((Date.now() - t0) / 1000)} s`); resolve(c); });
}), minutes);

const an = spawn(process.execPath, [path.join(here, 'an.mjs'), id], { stdio: 'inherit' });
an.on('exit', (c) => process.exit(code || c || 0));
