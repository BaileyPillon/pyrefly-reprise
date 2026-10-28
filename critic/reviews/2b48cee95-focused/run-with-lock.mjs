// take the review-browser lock through the shared queue (tools/rig-record-lock.mjs), run a command, release. usage: node run-with-lock.mjs <maxMinutes> <who> -- <cmd...>
import { spawnSync } from 'node:child_process';
import { takeRigRecord } from '../../../tools/rig-record-lock.mjs';
const [maxM, who, , ...cmd] = process.argv.slice(2);
const release = await takeRigRecord(who, { maxMinutes: +maxM, pollMs: 15 });
console.log('CLAIMED', new Date().toISOString());
const t = Date.now();
const r = spawnSync(cmd.join(' '), { shell: true, stdio: 'inherit' });
release();
console.log('RELEASED', new Date().toISOString(), 'status', r.status, 'secs', Math.round((Date.now() - t) / 1000));
