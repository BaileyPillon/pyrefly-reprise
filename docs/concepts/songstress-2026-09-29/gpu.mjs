/**
 * Songstress 2026-09-29 GPU runner (FFX-2 only). One job = one ComfyUI prompt: Animagine XL 4.0 Opt,
 * IP-Adapter Plus (our own shipped idle crops only, never a retail image), optional xinsir OpenPose
 * ControlNet. Shared GPU rule (AGENTS.md 12): submit only while fewer than 3 prompts are in /queue in
 * total (running + pending, whoever owns them); never restart ComfyUI from here; an all-black frame
 * stops the run (no re-roll). Candidates are written outside the repo with a .prov.json each.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { SPRITE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, cutout } from '../../../tools/gen/comfy.mjs';
import { checkCutoutFile } from '../../../tools/gen/cutout-guard.mjs';
import { maxRgbOfPng, isBlackFrame } from '../../../tools/gen/black-frame.mjs';

export const CAND = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-29-songstress';
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
export { STYLE_TAGS, QUALITY_TAGS };
export const COMMON_NEG = `${SPRITE_NEGATIVE}, multiple views, 2girls, chibi, sketch, monochrome, 3d, realistic, cropped, ` +
  'magic circle, swirl, sparkles, musical note, light rays, stage lights, confetti, splash, cast shadow, drop shadow, pedestal, platform';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (s) => { const line = `${new Date().toISOString()} ${s}`; console.log(line); try { appendFileSync(join(CAND, 'queue.log'), line + '\n'); } catch {} };

async function inQueue() {
  try { const q = await (await fetch(`${COMFY}/queue`)).json(); return (q.queue_pending?.length || 0) + (q.queue_running?.length || 0); } catch { return 99; }
}

function graph(j) {
  const [width, height] = j.size;
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    5: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: j.positive, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: j.negative, clip: ['4', 1] } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } },
    20: { class_type: 'LoadImage', inputs: { image: stageImage(j.refs[0]), upload: 'image' } },
  };
  let img = ['20', 0];
  if (j.refs[1]) {
    g[24] = { class_type: 'LoadImage', inputs: { image: stageImage(j.refs[1]), upload: 'image' } };
    g[25] = { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } };
    img = ['25', 0];
  }
  const ipa = j.ipa;
  g[23] = { class_type: 'IPAdapterAdvanced', inputs: { model: ['4', 0], ipadapter: ['21', 0], image: img, weight: ipa.weight, weight_type: ipa.type, combine_embeds: 'concat', start_at: ipa.start, end_at: ipa.end, embeds_scaling: 'K+V', clip_vision: ['22', 0] } };
  let pos = ['6', 0], neg = ['7', 0];
  if (j.skeleton) {
    g[30] = { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } };
    g[31] = { class_type: 'LoadImage', inputs: { image: stageImage(j.skeleton), upload: 'image' } };
    g[32] = { class_type: 'ControlNetApplyAdvanced', inputs: { positive: pos, negative: neg, control_net: ['30', 0], image: ['31', 0], strength: j.cn, start_percent: 0, end_percent: 1, vae: ['4', 2] } };
    pos = ['32', 0]; neg = ['32', 1];
  }
  g[3] = { class_type: 'KSampler', inputs: { seed: j.seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['23', 0], positive: pos, negative: neg, latent_image: ['5', 0] } };
  g[8] = { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } };
  g[9] = { class_type: 'SaveImage', inputs: { filename_prefix: `pyrefly/songstress0929/${j.key.replace(/[^a-z0-9-]+/gi, '_')}`, images: ['8', 0] } };
  return g;
}

async function finish(j) {
  const e = (await (await fetch(`${COMFY}/history/${j.pid}`)).json())[j.pid];
  if (!e) return 'wait';
  if (e.status?.status_str === 'error') { log(`FAILED ${j.key} ${JSON.stringify(e.status.messages).slice(0, 600)}`); return 'error'; }
  const im = Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
  if (!im) return 'wait';
  mkdirSync(j.dir, { recursive: true });
  const q = new URLSearchParams({ filename: im.filename, subfolder: im.subfolder || '', type: im.type || 'output' });
  const raw = join(j.dir, `cand-${j.n}.raw.png`); const cut = join(j.dir, `cand-${j.n}.png`);
  writeFileSync(raw, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
  const maxRgb = maxRgbOfPng(readFileSync(raw));
  const black = maxRgb != null && isBlackFrame(maxRgb);
  let cutMeta = null; let guard = { ok: false, reasons: ['black frame'] };
  if (!black) {
    cutMeta = cutout(raw, cut);
    guard = await checkCutoutFile(cut, { sourceWidth: j.size[0], sourceHeight: j.size[1], composition: j.composition || 'full' });
  }
  const prov = {
    game: 'ffx2', project: 'songstress-2026-09-29 (PR-0228, D-275, D-281)', status: 'CANDIDATE', key: j.key, candidate: j.n, seed: j.seed,
    sources: 'costume words only from research/visual-bible.md section 1.24 (FF Wiki Songstress revid 3972937); identity words from the shipped idle sidecar; no retail image used as input, reference or IP-Adapter',
    positive: j.positive, negative: j.negative, model: CKPT, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal', width: j.size[0], height: j.size[1],
    ipadapter: { file: IPADAPTER, clipVision: CLIPVISION, ...j.ipa, scaling: 'K+V', combine: 'concat', images: j.refs },
    controlnet: j.skeleton ? { file: CONTROLNET, strength: j.cn, skeleton: j.skeleton } : null,
    composition: j.composition || 'full', maxRgb, black, cutout: cutMeta, guard: { ok: guard.ok, reasons: guard.reasons },
    seconds: (Date.now() - j.t0) / 1000, generatedAt: new Date().toISOString(), ...(j.extra || {}),
  };
  writeFileSync(join(j.dir, `cand-${j.n}.prov.json`), JSON.stringify(prov, null, 1));
  log(`${j.key}#${j.n} seed ${j.seed}: ${cutMeta ? `${cutMeta.width}x${cutMeta.height}` : '-'} guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}${black ? ' BLACK' : ''}`);
  if (black) { writeFileSync(join(CAND, 'STOP-BLACK.txt'), `${new Date().toISOString()} ${j.key} all-black frame\n`, { flag: 'a' }); return 'black'; }
  return 'done';
}

/** Run jobs (skipping any whose .prov.json exists). Returns { done, black }. */
export async function run(jobs) {
  mkdirSync(CAND, { recursive: true });
  const todo = jobs.filter((j) => !existsSync(join(j.dir, `cand-${j.n}.prov.json`)));
  log(`run: ${todo.length} of ${jobs.length} jobs to do`);
  const inflight = []; let halt = false; let black = false;
  while (todo.length || inflight.length) {
    if (existsSync(join(CAND, 'STOP'))) { if (!halt) log('STOP file'); halt = true; }
    while (!halt && todo.length && inflight.length < 2 && (await inQueue()) < 3) {
      const j = todo.shift();
      const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: graph(j), client_id: 'pyrefly-songstress0929' }) });
      const body = await res.json();
      if (!res.ok || body.error) { log(`REJECTED ${j.key}: ${JSON.stringify(body).slice(0, 800)}`); halt = true; break; }
      inflight.push({ ...j, pid: body.prompt_id, t0: Date.now() });
    }
    if (halt && !inflight.length) break;
    await sleep(2500);
    for (const j of [...inflight]) {
      let r; try { r = await finish(j); } catch (e) { log(`finish error ${j.key}: ${e.message}`); r = 'error'; }
      if (r === 'wait') continue;
      inflight.splice(inflight.indexOf(j), 1);
      if (r === 'black') { halt = true; black = true; }
    }
  }
  log('run end');
  return { black };
}
