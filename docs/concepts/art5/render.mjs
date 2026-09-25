#!/usr/bin/env node
/**
 * art5 party battle-pose queue (FFX-2 only; GPU batch 5, 2026-09-25). The Chapter XIII method
 * (docs/concepts/chapters/trema/poses/METHOD.md, render.mjs there) unchanged except the worklist:
 * identity read off each installed idle picture (girls.json), body-only pose tags (poses.json),
 * OpenPose skeletons at 0.8 of the idle (skeletons.py here: sword and flask copied, dual added),
 * IP-Adapter forced on (the idle square-padded on white + a head crop, batched, concat, 0.5, ease
 * in, 0.2..0.8, K+V), the cutout guard, a black frame stops everything.
 *
 *   node docs/concepts/art5/render.mjs queue          # ONE long process: works worklist.json in order
 *   node docs/concepts/art5/render.mjs dry <id>/<pose> # print the prompts
 *
 * The queue re-reads worklist.json, girls.json and poses.json before every submit, so slots can be
 * enabled (after a pilot has been looked at) without restarting it. Per slot: round 1 = cand 1..4;
 * only if the guard rejects all four, round 2 = cand 5..8; if round 2 is all rejected too the slot
 * STOPS (rule 15) and stays empty. Shared ComfyUI: submits only while fewer than 3 prompts are
 * pending; never restarts it. Stops submitting at DEADLINE (07:30 EDT) or when STOP exists.
 * Candidates only, written outside the repo; nothing is installed into public/art.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPRITE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, cutout } from '../../../tools/gen/comfy.mjs';
import { checkCutoutFile } from '../../../tools/gen/cutout-guard.mjs';
import { maxRgbOfPng, isBlackFrame } from '../../../tools/gen/black-frame.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu5';
const REFS = `${OUT}/refs`;
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const DEADLINE = Date.parse(process.env.DEADLINE || '2026-09-25T07:30:00-04:00');
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
/** The Chapter XIII production recipe (METHOD.md section 4, "B"). */
const IPA = { weight: 0.5, type: 'ease in', start: 0.2, end: 0.8, scaling: 'K+V' };
const MAX_PENDING = 3;
const MAX_INFLIGHT = 4;
export const CANDS = [{ n: 1, cn: 0.65 }, { n: 2, cn: 0.75 }, { n: 3, cn: 0.85 }, { n: 4, cn: 0.75 },
  { n: 5, cn: 0.7 }, { n: 6, cn: 0.8 }, { n: 7, cn: 0.75 }, { n: 8, cn: 0.85 }];
const SEED_OFF = { attack: 0, cast: 10, item: 20, hurt: 30, ko: 40, victory: 50 };
const COMMON_NEG = `${SPRITE_NEGATIVE}, multiple views, 2girls, chibi, sketch, monochrome, 3d, realistic, cropped, ` +
  'magic circle, glowing weapon, glowing sword, fire, flames, fire trail, swirl, lightning, dark aura, splash, extra sword, multiple swords, floating sword';
const FACING_NEG = 'from behind, facing away';

const readJson = (f) => JSON.parse(readFileSync(join(HERE, f), 'utf8'));
const log = (s) => { const line = `${new Date().toISOString()} ${s}`; console.log(line); appendFileSync(join(OUT, 'queue.log'), line + '\n'); };

function spec(id, pose) {
  const G = readJson('girls.json').girls; const P = readJson('poses.json');
  const g = G[id]; if (!g) throw new Error(`unknown ${id}`);
  const p = P.kinds[g.kind]?.[pose]; if (!p) throw new Error(`no ${g.kind}/${pose}`);
  const fill = (s, ko) => s.replace('{KO}', ko).replace('{HURT_NEG}', P.HURT_NEG).replace('{face}', g.victoryFace || 'smile');
  let tags = fill(p.tags, P.KO.tags); const neg = fill(p.neg, P.KO.neg);
  if (g.kind === 'sword' && g.weapon) tags = tags.replaceAll('greatsword', g.weapon);
  let identity = g.identity;
  // cast, item, hurt: the weighted weapon word leaves (Chapter XIII second try: four sword words
  // plus one in the pose read as two weapons)
  if (g.kind === 'sword' && ['cast', 'item', 'hurt'].includes(pose)) identity = identity.replace(/\(([^():]*sword):1\.2\)/g, '$1');
  const view = pose === 'ko' ? '' : 'three-quarter view, looking at viewer, full body, feet visible, ';
  const size = pose === 'ko' ? [1216, 832] : (pose === 'attack' && g.skel === 'sword' ? [1024, 1216] : [832, 1216]);
  return {
    g, size,
    positive: `1girl, solo, ${tags}, ${identity}, ${view}simple background, white background, ${STYLE_TAGS}, ${QUALITY_TAGS}`,
    negative: `${COMMON_NEG}, ${pose === 'ko' ? '' : `${FACING_NEG}, `}${neg}, ${g.neg}`,
    skeleton: join(HERE, 'skeletons', g.skel, `${pose}.png`),
  };
}

function graph({ s, seed, cn, skel, refA, refB, prefix }) {
  const [width, height] = s.size;
  return {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    5: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: s.positive, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: s.negative, clip: ['4', 1] } },
    30: { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } },
    31: { class_type: 'LoadImage', inputs: { image: skel, upload: 'image' } },
    32: { class_type: 'ControlNetApplyAdvanced', inputs: { positive: ['6', 0], negative: ['7', 0], control_net: ['30', 0], image: ['31', 0], strength: cn, start_percent: 0, end_percent: 1, vae: ['4', 2] } },
    20: { class_type: 'LoadImage', inputs: { image: refA, upload: 'image' } },
    24: { class_type: 'LoadImage', inputs: { image: refB, upload: 'image' } },
    25: { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } },
    23: { class_type: 'IPAdapterAdvanced', inputs: { model: ['4', 0], ipadapter: ['21', 0], image: ['25', 0], weight: IPA.weight, weight_type: IPA.type, combine_embeds: 'concat', start_at: IPA.start, end_at: IPA.end, embeds_scaling: IPA.scaling, clip_vision: ['22', 0] } },
    3: { class_type: 'KSampler', inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['23', 0], positive: ['32', 0], negative: ['32', 1], latent_image: ['5', 0] } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function pending() {
  try { const q = await (await fetch(`${COMFY}/queue`)).json(); return q.queue_pending?.length || 0; } catch { return 99; }
}
const sidecar = (id, pose, n) => join(OUT, id, pose, `cand-${n}.json`);
const guardOk = (id, pose, n) => { try { return JSON.parse(readFileSync(sidecar(id, pose, n), 'utf8')).guard.ok; } catch { return null; } };

/** The next job in worklist order, or null. A slot is done when a round has a guard pass. */
function nextJob(inflightKeys, state) {
  const W = readJson('worklist.json');
  for (const item of W.order) {
    if (!item.enabled) continue;
    for (const pose of item.poses) {
      const round1 = item.pilot ? item.pilot : [1, 2, 3, 4];
      const r1 = round1.map((n) => guardOk(item.id, pose, n));
      let want = null;
      if (r1.some((v) => v === null)) want = round1;
      else if (!r1.some(Boolean) && !item.pilot) {
        const r2 = [5, 6, 7, 8].map((n) => guardOk(item.id, pose, n));
        if (r2.some((v) => v === null)) want = [5, 6, 7, 8];
        else if (!r2.some(Boolean) && !state.stopped.has(`${item.id}/${pose}`)) {
          state.stopped.add(`${item.id}/${pose}`); log(`STOP ${item.id}/${pose}: guard rejected both rounds (rule 15), slot left empty`);
        }
      }
      if (!want) continue;
      for (const n of want) {
        const key = `${item.id}/${pose}#${n}`;
        if (inflightKeys.has(key) || existsSync(sidecar(item.id, pose, n))) continue;
        return { id: item.id, pose, n, cn: CANDS.find((c) => c.n === n).cn, key };
      }
    }
  }
  return null;
}

async function finish(j) {
  const e = (await (await fetch(`${COMFY}/history/${j.pid}`)).json())[j.pid];
  if (!e) return 'wait';
  if (e.status?.status_str === 'error') { log(`FAILED ${j.key} ${JSON.stringify(e.status.messages).slice(0, 600)}`); return 'error'; }
  const img = Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
  if (!img) return 'wait';
  const dir = join(OUT, j.id, j.pose);
  const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
  const raw = join(dir, `cand-${j.n}.raw.png`); const cut = join(dir, `cand-${j.n}.png`);
  writeFileSync(raw, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
  const maxRgb = maxRgbOfPng(readFileSync(raw));
  const black = maxRgb != null && isBlackFrame(maxRgb);
  const [w, h] = j.s.size;
  let cutMeta = null; let guard = { ok: false, reasons: ['black frame'] };
  if (!black) {
    cutMeta = cutout(raw, cut);
    guard = await checkCutoutFile(cut, { sourceWidth: w, sourceHeight: h, composition: j.pose === 'ko' ? 'prone' : 'full' });
  }
  const side = {
    game: 'ffx2', subject: j.id, state: j.pose, candidate: j.n, round: j.n <= 4 ? 1 : 2, seed: j.seed, status: 'CANDIDATE', kind: j.s.g.kind,
    identitySource: 'read off the installed idle picture (docs/concepts/art5/girls.json)', skeletonSet: 'scale 0.8, ko 0.85 (Chapter XIII)',
    controlnet: { file: CONTROLNET, strength: j.cn, start: 0, end: 1, skeleton: `docs/concepts/art5/skeletons/${j.s.g.skel}/${j.pose}.png` },
    ipadapter: { file: IPADAPTER, ...IPA, combine: 'concat', images: [`${j.id}-idle-square.png`, `${j.id}-head.png`], forced: true },
    positive: j.s.positive, negative: j.s.negative, model: CKPT, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
    width: w, height: h, composition: j.pose === 'ko' ? 'prone' : 'full', facing: 'right', maxRgb, black, cutout: cutMeta,
    guard: { ok: guard.ok, reasons: guard.reasons }, seconds: (Date.now() - j.t0) / 1000, generatedAt: new Date().toISOString(),
  };
  writeFileSync(sidecar(j.id, j.pose, j.n), JSON.stringify(side, null, 1));
  log(`${j.key} seed ${j.seed} cn ${j.cn}: ${cutMeta ? `${cutMeta.width}x${cutMeta.height}` : '-'} guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}${black ? ' BLACK' : ''}`);
  if (black) {
    writeFileSync(join(OUT, 'STOP-BLACK.txt'), `${new Date().toISOString()} ${j.key} all-black frame (maxRgb ${maxRgb}); queue stopped, no re-roll, ComfyUI not restarted\n`, { flag: 'a' });
    return 'black';
  }
  return 'done';
}

async function queue() {
  mkdirSync(OUT, { recursive: true });
  const state = { stopped: new Set() };
  const inflight = [];
  let halt = false; let idleSince = null; let jobs = 0;
  log(`queue start, deadline ${new Date(DEADLINE).toISOString()}`);
  for (;;) {
    const stopFile = existsSync(join(OUT, 'STOP'));
    if (!halt && (stopFile || Date.now() >= DEADLINE)) { halt = true; log(stopFile ? 'STOP file: no more submits' : 'deadline: no more submits'); }
    while (!halt && inflight.length < MAX_INFLIGHT && (await pending()) < MAX_PENDING) {
      const j = nextJob(new Set(inflight.map((x) => x.key)), state);
      if (!j) break;
      const s = spec(j.id, j.pose);
      const seed = s.g.seed0 + SEED_OFF[j.pose] + j.n;
      mkdirSync(join(OUT, j.id, j.pose), { recursive: true });
      const g = graph({ s, seed, cn: j.cn, skel: stageImage(s.skeleton), refA: stageImage(`${REFS}/${j.id}-idle-square.png`), refB: stageImage(`${REFS}/${j.id}-head.png`), prefix: `pyrefly/art5/${j.id}-${j.pose}` });
      const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: g, client_id: 'pyrefly-art5' }) });
      const body = await res.json();
      if (!res.ok || body.error) { log(`REJECTED by ComfyUI ${j.key}: ${JSON.stringify(body).slice(0, 800)}`); halt = true; break; }
      inflight.push({ ...j, s, seed, pid: body.prompt_id, t0: Date.now() }); jobs++;
    }
    await sleep(3000);
    for (const j of [...inflight]) {
      let r; try { r = await finish(j); } catch (e) { log(`finish error ${j.key}: ${e.message}`); r = 'error'; }
      if (r === 'wait') continue;
      inflight.splice(inflight.indexOf(j), 1);
      if (r === 'black') { halt = true; log('BLACK FRAME: queue halted; nothing more will be submitted'); }
    }
    writeFileSync(join(OUT, 'status.json'), JSON.stringify({ at: new Date().toISOString(), submitted: jobs, inflight: inflight.map((x) => x.key), halt, stopped: [...state.stopped] }, null, 1));
    if (!inflight.length) {
      if (halt) break;
      idleSince ??= Date.now();
      if (Date.now() - idleSince > 45 * 60 * 1000) { log('worklist idle 45 min: exiting'); break; }
    } else idleSince = null;
  }
  log(`queue end: ${jobs} submitted this run`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'queue') await queue();
else if (cmd === 'dry') { const [id, pose] = arg.split('/'); const s = spec(id, pose); console.log('+', s.positive, '\n-', s.negative, '\n', s.skeleton, s.size); }
