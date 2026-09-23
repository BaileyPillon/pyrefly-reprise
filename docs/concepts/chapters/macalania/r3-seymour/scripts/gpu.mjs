// Queue one ComfyUI workflow behind the shared-GPU gate (queue empty for 180 s), save every output image.
// node gpu.mjs <workflow.json> <outPrefix>
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
const COMFY = 'http://127.0.0.1:8188';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [wf, prefix] = process.argv.slice(2);
const workflow = JSON.parse(readFileSync(wf, 'utf8'));
const QUIET = Number(process.env.QUIET_MS ?? 180000);
let emptySince = null;
for (;;) {
  const q = await (await fetch(`${COMFY}/queue`)).json();
  const busy = q.queue_running.length + q.queue_pending.length;
  if (busy) { emptySince = null; } else if (emptySince === null) emptySince = Date.now();
  if (emptySince !== null && Date.now() - emptySince >= QUIET) break;
  await sleep(5000);
}
const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-r3-seymour' }) });
const body = await res.json();
if (!res.ok || body.error) { console.error(JSON.stringify(body)); process.exit(1); }
const id = body.prompt_id;
console.log('queued', id);
for (;;) {
  const e = (await (await fetch(`${COMFY}/history/${id}`)).json())[id];
  if (e?.status?.status_str === 'error') { console.error(JSON.stringify(e.status.messages).slice(0, 2000)); process.exit(1); }
  if (e?.status?.completed) {
    const msgs = e.status.messages || [];
    const t = (n) => msgs.find((m) => m[0] === n)?.[1]?.timestamp;
    const secs = ((t('execution_success') ?? 0) - (t('execution_start') ?? 0)) / 1000;
    let i = 0;
    for (const [node, o] of Object.entries(e.outputs || {})) for (const img of o.images || []) {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      const out = `${prefix}.n${node}.png`;
      writeFileSync(out, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
      console.log('saved', out); i++;
    }
    appendFileSync('gpu-log.tsv', `${new Date().toISOString()}\t${id}\t${prefix}\t${secs.toFixed(1)}\n`);
    console.log('gpu seconds', secs.toFixed(1));
    break;
  }
  await sleep(1500);
}
