#!/usr/bin/env node
/**
 * Pose round 2 queue (FFX-2 only, 2026-09-25). The art5 / Chapter XIII method unchanged
 * (docs/concepts/chapters/trema/poses/METHOD.md; ../render.mjs): Animagine XL 4.0 Opt, xinsir
 * OpenPose SDXL, IP-Adapter forced on (the idle square-padded on white + a head crop, concat, 0.5,
 * ease in, 0.2..0.8, K+V), body-only pose tags, the cutout guard, a black frame stops everything.
 * What changes is per slot, written in worklist.json `answer`: identities corrected where the judges
 * named a drift (girls2.json), recoil/ko/victory tags (poses2.json), per-girl skeletons with a head
 * factor and more frame margin (skeletons2.py), and one extra guard reason: content touching the
 * canvas edge (the judges failed four ko picks for it).
 *
 *   node docs/concepts/art5/round2/render2.mjs queue            # ONE long process, worklist order
 *   node docs/concepts/art5/round2/render2.mjs dry <id>/<pose> [b]
 *
 * try a = cand 1..4. After a look fails a slot, its entry gets try 'b' and a `b` object
 * ({ extra, negx, cn, identitySwap }) and the queue renders cand 5..8 with it; a slot that fails b
 * stops (rule 15); a slot with a written method check may get try 'c' (cand 9..12, `c` object, same
 * keys plus `skelDir`; the Rikku Thief after Bailey's body-height answer, render-thief-c.mjs).
 * The queue re-reads its JSON before every submit. Shared ComfyUI: submits only
 * while fewer than 3 prompts are pending; never restarts it. STOP file = no more submits.
 * Candidates only, written outside the repo; nothing is installed into public/art.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPRITE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, cutout } from '../../../../tools/gen/comfy.mjs';
import { checkCutoutFile } from '../../../../tools/gen/cutout-guard.mjs';
import { maxRgbOfPng, isBlackFrame } from '../../../../tools/gen/black-frame.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-day1/pose-round2';
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const IPA = { weight: 0.5, type: 'ease in', start: 0.2, end: 0.8, scaling: 'K+V' };
const MAX_PENDING = 3;
const MAX_INFLIGHT = 4;
const CN_A = [0.75, 0.8, 0.85, 0.8];
const CN_B = [0.8, 0.85, 0.8, 0.9];
const SEED_OFF = { attack: 0, cast: 10, item: 20, hurt: 30, ko: 40, victory: 50 };
const WEAPON = { staff: 'staff', guns: 'handgun', daggers: 'dagger', flask: 'flask', mic: 'microphone' };
const COMMON_NEG = `${SPRITE_NEGATIVE}, multiple views, 2girls, chibi, sketch, monochrome, 3d, realistic, cropped, ` +
  'magic circle, glowing weapon, glowing sword, fire, flames, fire trail, swirl, lightning, dark aura, splash, extra sword, ' +
  'multiple swords, floating sword, cast shadow, drop shadow, pedestal, platform, rock';
const FACING_NEG = 'from behind, facing away';

const readJson = (f) => JSON.parse(readFileSync(join(HERE, f), 'utf8'));
const log = (s) => { const line = `${new Date().toISOString()} ${s}`; console.log(line); appendFileSync(join(OUT, 'queue.log'), line + '\n'); };

export function spec(item, tryName = 'a') {
  const G = readJson('girls2.json').girls; const P = readJson('poses2.json');
  const g = G[item.id]; if (!g) throw new Error(`unknown ${item.id}`);
  const key = item.tags || item.pose;
  const p = P.kinds[g.kind]?.[key]; if (!p) throw new Error(`no ${g.kind}/${key}`);
  const b = tryName === 'b' ? (item.b || {}) : tryName === 'c' ? (item.c || {}) : {};
  const W = g.kind === 'sword' ? (g.weapon || 'sword') : WEAPON[g.kind];
  const fill = (s) => s.replace('{KO}', P.KO.tags).replace('{HURT_NEG}', P.HURT_NEG).replaceAll('{W}', W).replace('{face}', g.victoryFace || 'smile');
  const fillNeg = (s) => s.replace('{KO}', P.KO.neg).replace('{HURT_NEG}', P.HURT_NEG);
  let identity = g.identity;
  for (const [x, y] of [...(item.identitySwap || []), ...(b.identitySwap || [])]) identity = identity.replace(x, y);
  let tags = fill(p.tags);
  if (item.extra) tags += `, ${item.extra}`;
  if (b.extra) tags += `, ${b.extra}`;
  const pose = item.pose;
  const view = pose === 'ko' ? '' : 'three-quarter view, looking at viewer, full body, feet visible, ';
  const size = pose === 'ko' ? [1344, 768] : (pose === 'attack' && g.skel === 'sword' ? [1024, 1216] : [832, 1216]);
  const negx = [item.negx, b.negx].filter(Boolean).join(', ');
  return {
    g, size, try: tryName,
    positive: `1girl, solo, ${tags}, ${identity}, ${view}simple background, white background, ${STYLE_TAGS}, ${QUALITY_TAGS}`,
    negative: `${COMMON_NEG}, ${pose === 'ko' ? '' : `${FACING_NEG}, `}${fillNeg(p.neg)}, ${g.neg}${negx ? `, ${negx}` : ''}`,
    skeleton: join(HERE, 'skeletons', b.skelDir || item.id, `${pose}.png`),
    skeletonRel: `docs/concepts/art5/round2/skeletons/${b.skelDir || item.id}/${pose}.png`,
    cn: (tryName === 'a' ? (item.cn || CN_A) : (b.cn || CN_B)),
  };
}

export function graph({ s, seed, cn, skel, refA, refB, prefix }) {
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
export async function pending() {
  try { const q = await (await fetch(`${COMFY}/queue`)).json(); return q.queue_pending?.length || 0; } catch { return 99; }
}
const sidecar = (id, pose, n) => join(OUT, id, pose, `cand-${n}.json`);

function nextJob(inflightKeys) {
  const W = readJson('worklist.json');
  for (const item of W.order) {
    if (!item.enabled || item.stopped) continue;
    const tries = [['a', [1, 2, 3, 4]], ['b', [5, 6, 7, 8]], ['c', [9, 10, 11, 12]]].slice(0, 'abc'.indexOf(item.try || 'a') + 1);
    for (const [t, ns] of tries) {
      for (const n of ns) {
        const key = `${item.id}/${item.pose}#${n}`;
        if (inflightKeys.has(key) || existsSync(sidecar(item.id, item.pose, n))) continue;
        return { item, t, n, key };
      }
    }
  }
  return null;
}

export async function finish(j) {
  const e = (await (await fetch(`${COMFY}/history/${j.pid}`)).json())[j.pid];
  if (!e) return 'wait';
  if (e.status?.status_str === 'error') { log(`FAILED ${j.key} ${JSON.stringify(e.status.messages).slice(0, 600)}`); return 'error'; }
  const img = Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
  if (!img) return 'wait';
  const { id, pose } = j.item;
  const dir = join(OUT, id, pose);
  const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
  const raw = join(dir, `cand-${j.n}.raw.png`); const cut = join(dir, `cand-${j.n}.png`);
  writeFileSync(raw, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
  const maxRgb = maxRgbOfPng(readFileSync(raw));
  const black = maxRgb != null && isBlackFrame(maxRgb);
  const [w, h] = j.s.size;
  let cutMeta = null; let guard = { ok: false, reasons: ['black frame'] };
  if (!black) {
    cutMeta = cutout(raw, cut);
    guard = await checkCutoutFile(cut, { sourceWidth: w, sourceHeight: h, composition: pose === 'ko' ? 'prone' : 'full' });
    const cb = cutMeta.contentBox;
    if (cb && (cb[0] <= 3 || cb[1] <= 3 || cb[2] >= w - 4 || cb[3] >= h - 4)) {
      guard = { ok: false, reasons: [...(guard.reasons || []), `content touches the canvas edge (${cb.join(',')})`] };
    }
  }
  const side = {
    game: 'ffx2', subject: id, state: pose, candidate: j.n, round: 2, try: j.t, seed: j.seed, status: 'CANDIDATE', kind: j.s.g.kind,
    answer: j.item.answer, identitySource: 'read off the installed idle picture, corrected per the judges (docs/concepts/art5/round2/girls2.json)',
    skeletonSet: j.t === 'c' ? 'try c skeletons-thief-c.py: skeletons2.py with a normal Rikku head (no big-head forcing)' : 'round2 skeletons2.py: scale 0.8, ground 1135, ko 0.72, head factor 17.5/R',
    controlnet: { file: CONTROLNET, strength: j.cn, start: 0, end: 1, skeleton: j.s.skeletonRel },
    ipadapter: { file: IPADAPTER, ...IPA, combine: 'concat', images: [`${id}-idle-square.png`, `${id}-head.png`], forced: true },
    positive: j.s.positive, negative: j.s.negative, model: CKPT, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
    width: w, height: h, composition: pose === 'ko' ? 'prone' : 'full', facing: 'right', maxRgb, black, cutout: cutMeta,
    guard: { ok: guard.ok, reasons: guard.reasons }, seconds: (Date.now() - j.t0) / 1000, generatedAt: new Date().toISOString(),
  };
  writeFileSync(sidecar(id, pose, j.n), JSON.stringify(side, null, 1));
  log(`${j.key} try ${j.t} seed ${j.seed} cn ${j.cn}: ${cutMeta ? `${cutMeta.width}x${cutMeta.height}` : '-'} guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}${black ? ' BLACK' : ''}`);
  if (black) {
    writeFileSync(join(OUT, 'STOP-BLACK.txt'), `${new Date().toISOString()} ${j.key} all-black frame (maxRgb ${maxRgb}); queue stopped, no re-roll, ComfyUI not restarted\n`, { flag: 'a' });
    return 'black';
  }
  return 'done';
}

async function queue() {
  mkdirSync(OUT, { recursive: true });
  const inflight = [];
  let halt = false; let idleSince = null; let jobs = 0;
  log('queue start');
  for (;;) {
    if (!halt && existsSync(join(OUT, 'STOP'))) { halt = true; log('STOP file: no more submits'); }
    while (!halt && inflight.length < MAX_INFLIGHT && (await pending()) < MAX_PENDING) {
      const j = nextJob(new Set(inflight.map((x) => x.key)));
      if (!j) break;
      const s = spec(j.item, j.t);
      const cn = s.cn[(j.n - 1) % 4];
      const seed = s.g.seed0 + SEED_OFF[j.item.pose] + j.n;
      mkdirSync(join(OUT, j.item.id, j.item.pose), { recursive: true });
      const g = graph({ s, seed, cn, skel: stageImage(s.skeleton), refA: stageImage(`${s.g.refs}/${j.item.id}-idle-square.png`), refB: stageImage(`${s.g.refs}/${j.item.id}-head.png`), prefix: `pyrefly/round2/${j.item.id}-${j.item.pose}` });
      const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: g, client_id: 'pyrefly-pose-round2' }) });
      const body = await res.json();
      if (!res.ok || body.error) { log(`REJECTED by ComfyUI ${j.key}: ${JSON.stringify(body).slice(0, 800)}`); halt = true; break; }
      inflight.push({ ...j, s, seed, cn, pid: body.prompt_id, t0: Date.now() }); jobs++;
    }
    await sleep(4000);
    for (const j of [...inflight]) {
      let r; try { r = await finish(j); } catch (e) { log(`finish error ${j.key}: ${e.message}`); r = 'error'; }
      if (r === 'wait') continue;
      inflight.splice(inflight.indexOf(j), 1);
      if (r === 'black') { halt = true; log('BLACK FRAME: queue halted; nothing more will be submitted'); }
    }
    writeFileSync(join(OUT, 'status.json'), JSON.stringify({ at: new Date().toISOString(), submitted: jobs, inflight: inflight.map((x) => x.key), halt }, null, 1));
    if (!inflight.length) {
      if (halt) break;
      idleSince ??= Date.now();
      if (Date.now() - idleSince > 90 * 60 * 1000) { log('worklist idle 90 min: exiting'); break; }
    } else idleSince = null;
  }
  log(`queue end: ${jobs} submitted this run`);
}

const [cmd, arg, t] = process.argv.slice(2);
if (cmd === 'queue') await queue();
else if (cmd === 'dry') {
  const [id, pose] = arg.split('/');
  const item = readJson('worklist.json').order.find((x) => x.id === id && x.pose === pose);
  const s = spec(item, t || 'a'); console.log('+', s.positive, '\n-', s.negative, '\n', s.skeleton, s.size, s.cn);
}
