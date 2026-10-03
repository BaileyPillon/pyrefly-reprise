// node run-queue.mjs <queue.json> : runs each {log, args} as `node <args>` one after another (one browser at a time), logging to V/<log>.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const V = 'D:/Tools/pyrefly-scratch/2026-10-03/visual-options';
const q = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const job of q) {
  const out = fs.openSync(`${V}/${job.log}`, 'w');
  console.log(new Date().toISOString(), 'START', job.log);
  const r = spawnSync('node', job.args, { cwd: 'D:/pyrefly-iter2-spellfx', stdio: ['ignore', out, out], env: { ...process.env, PYREFLY_BROWSER: 'gpu' } });
  console.log(new Date().toISOString(), 'END', job.log, r.status);
}
fs.writeFileSync(process.argv[2] + '.done', 'done');
