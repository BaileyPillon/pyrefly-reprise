#!/usr/bin/env node
/**
 * Rikku Thief try c (FFX-2 only, 2026-09-26). Bailey picked the body-height gate for the Thief
 * (JUDGE.md Question 1, answered), so the slots with no pass get four more renders each (cand 9..12)
 * WITHOUT the big-head forcing: worklist.json `c` = the slot's try b fixes minus '(big head)',
 * 'from above', 'foreshortening' and the 'small head, tall, long legs' negatives, on a skeleton with a
 * normal Rikku head (skeletons-thief-c.py). The recipe and the cutout guard are render2.mjs unchanged.
 *
 *   node docs/concepts/art5/round2/render-thief-c.mjs            # renders every missing cand 9..12
 *
 * Shared ComfyUI: submits only while fewer than 3 prompts are pending; never restarts it. A black
 * frame stops everything (STOP-BLACK.txt, no re-roll). Its own stop file: <OUT>/STOP-thief-c.
 * Candidates only, written outside the repo; nothing is installed into public/art.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stageImage } from '../../../../tools/gen/comfy.mjs';
import { OUT, spec, graph, pending, finish } from './render2.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const SEED_OFF = { attack: 0, cast: 10, item: 20, hurt: 30, ko: 40, victory: 50 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const items = JSON.parse(readFileSync(join(HERE, 'worklist.json'), 'utf8')).order
  .filter((x) => x.id === 'rikku-thief' && x.try === 'c' && x.c);
const jobs = items.flatMap((item) => [9, 10, 11, 12].map((n) => ({ item, t: 'c', n, key: `${item.id}/${item.pose}#${n}` })))
  .filter((j) => !existsSync(join(OUT, j.item.id, j.item.pose, `cand-${j.n}.json`)));
console.log(`try c: ${jobs.length} renders to do (${items.map((x) => x.pose).join(', ')})`);

const inflight = [];
let halt = false; let done = 0;
while (jobs.length || inflight.length) {
  if (existsSync(join(OUT, 'STOP-thief-c'))) halt = true;
  while (!halt && jobs.length && inflight.length < 3 && (await pending()) < 3) {
    const j = jobs.shift();
    const s = spec(j.item, 'c');
    const cn = s.cn[(j.n - 9) % 4];
    const seed = s.g.seed0 + SEED_OFF[j.item.pose] + j.n;
    mkdirSync(join(OUT, j.item.id, j.item.pose), { recursive: true });
    const g = graph({ s, seed, cn, skel: stageImage(s.skeleton), refA: stageImage(`${s.g.refs}/${j.item.id}-idle-square.png`), refB: stageImage(`${s.g.refs}/${j.item.id}-head.png`), prefix: `pyrefly/round2/${j.item.id}-${j.item.pose}-c` });
    const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: g, client_id: 'pyrefly-thief-c' }) });
    const body = await res.json();
    if (!res.ok || body.error) { console.log(`REJECTED ${j.key}: ${JSON.stringify(body).slice(0, 600)}`); halt = true; break; }
    inflight.push({ ...j, s, seed, cn, pid: body.prompt_id, t0: Date.now() });
    console.log(`submitted ${j.key} seed ${seed} cn ${cn}`);
  }
  if (halt && !inflight.length) break;
  await sleep(4000);
  for (const j of [...inflight]) {
    let r; try { r = await finish(j); } catch (e) { console.log(`finish error ${j.key}: ${e.message}`); r = 'error'; }
    if (r === 'wait') continue;
    inflight.splice(inflight.indexOf(j), 1); done++;
    if (r === 'black') { halt = true; console.log('BLACK FRAME: stopped, nothing more will be submitted'); }
  }
}
console.log(`try c end: ${done} finished${halt ? ' (halted)' : ''}`);
