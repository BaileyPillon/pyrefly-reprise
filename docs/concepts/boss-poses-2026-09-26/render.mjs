#!/usr/bin/env node
/**
 * Boss action poses, GPU side (2026-09-26, ART-1 of docs/plans/presentation-program-2026-09-26.md).
 * The proven pose recipe unchanged (docs/concepts/art5/round2/render2.mjs header): Animagine XL 4.0
 * Opt, xinsir OpenPose SDXL, IP-Adapter forced on (the installed idle square-padded on white + a head
 * crop, concat, 0.5, ease in, 0.2..0.8, K+V), 28 steps, cfg 6, euler_ancestral; body-only pose tags,
 * identity read off the installed idle picture, the cutout guard, a content-touches-the-edge reject.
 * A drawn weapon is never asked of the model (METHOD-CHECK method 1): `weaponless` poses render the
 * body from a weapon-free reference square with every weapon word negated, then
 * `bosses.py comp` pastes the approved painting's own weapon into the fist and `cut` cuts it out.
 *
 *   node docs/concepts/boss-poses-2026-09-26/render.mjs body <boss> <pose> <n> [<n>...]
 *   node docs/concepts/boss-poses-2026-09-26/render.mjs cut  <boss> <pose> <n>   # cutout + guard of cand-N-comp.png
 *   node docs/concepts/boss-poses-2026-09-26/render.mjs dry  <boss> <pose>
 *
 * Shared ComfyUI: submits only while fewer than 3 prompts are pending, never restarts it. An
 * all-black frame writes STOP-BLACK.txt and stops every later submit (rule 12: report, no re-roll).
 * Candidates only, outside the repo (D:/Tools/pyrefly-art-backup/candidates/2026-09-26-bosses-v2/);
 * nothing is installed into public/art.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPRITE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, cutout } from '../../../tools/gen/comfy.mjs';
import { checkCutoutFile } from '../../../tools/gen/cutout-guard.mjs';
import { maxRgbOfPng, isBlackFrame } from '../../../tools/gen/black-frame.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-26-bosses-v2';
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const IPA = { weight: 0.5, type: 'ease in', start: 0.2, end: 0.8, scaling: 'K+V' };
const MAX_PENDING = 3;
const SEED_OFF = { attack: 0, cast: 10, hurt: 30, ko: 40, 'attack-h': 60, 'hurt-h': 70 };
const COMMON_NEG = `${SPRITE_NEGATIVE}, multiple views, chibi, sketch, monochrome, 3d, realistic, cropped, ` +
  'magic circle, glowing weapon, fire, flames, fire trail, swirl, lightning, dark aura, splash, cast shadow, drop shadow, pedestal, platform, rock, floor, scenery';
const NO_WEAPON_NEG = 'sword, katana, weapon, holding weapon, blade, dagger, knife, staff, spear, polearm, scythe, axe, gun, sheath, scabbard, sheathed sword, stick, pole';
const FACING = { left: '(from side:1.3), three-quarter view, body facing left, (looking at viewer:1.1)', right: '(from side:1.3), three-quarter view, body facing right, (looking at viewer:1.1)' };

const cfg = () => JSON.parse(readFileSync(join(HERE, 'bosses.json'), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (boss, s) => { const l = `${new Date().toISOString()} ${s}`; console.log(l); mkdirSync(join(OUT, boss), { recursive: true }); appendFileSync(join(OUT, boss, 'render.log'), l + '\n'); };

function spec(boss, pose) {
  const c = cfg()[boss]; const p = c.poses[pose];
  if (!p) throw new Error(`no ${boss}/${pose} in bosses.json`);
  const prone = pose === 'ko' && p.prone;
  const view = prone ? '' : `${FACING[p.facing || 'left']}, full body, feet visible, `;
  const positive = `${c.subject}, ${p.tags}, ${p.identity || c.identity}, ${view}simple background, white background, ${STYLE_TAGS}, ${QUALITY_TAGS}`;
  const negative = `${COMMON_NEG}, ${prone ? '' : 'facing viewer, front view, from behind, facing away, '}${p.weaponless ? `${NO_WEAPON_NEG}, ` : ''}${p.negx || ''}, ${c.neg}`;
  return { c, p, positive, negative, size: p.size, prone,
    skeleton: join(HERE, 'skeletons', boss, `${p.skel || pose}.png`), skeletonRel: `docs/concepts/boss-poses-2026-09-26/skeletons/${boss}/${p.skel || pose}.png`,
    refA: join(OUT, boss, '_refs', `idle-${p.ref || 'full'}-square.png`), refB: join(OUT, boss, '_refs', p.refHead || 'head.png') };
}

function graph(s, seed, cn, prefix) {
  const [width, height] = s.size;
  return {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    5: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: s.positive, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: s.negative, clip: ['4', 1] } },
    30: { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } },
    31: { class_type: 'LoadImage', inputs: { image: stageImage(s.skeleton), upload: 'image' } },
    32: { class_type: 'ControlNetApplyAdvanced', inputs: { positive: ['6', 0], negative: ['7', 0], control_net: ['30', 0], image: ['31', 0], strength: cn, start_percent: 0, end_percent: 1, vae: ['4', 2] } },
    20: { class_type: 'LoadImage', inputs: { image: stageImage(s.refA), upload: 'image' } },
    24: { class_type: 'LoadImage', inputs: { image: stageImage(s.refB), upload: 'image' } },
    25: { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } },
    23: { class_type: 'IPAdapterAdvanced', inputs: { model: ['4', 0], ipadapter: ['21', 0], image: ['25', 0], weight: IPA.weight, weight_type: IPA.type, combine_embeds: 'concat', start_at: IPA.start, end_at: IPA.end, embeds_scaling: IPA.scaling, clip_vision: ['22', 0] } },
    3: { class_type: 'KSampler', inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['23', 0], positive: ['32', 0], negative: ['32', 1], latent_image: ['5', 0] } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  };
}

async function pending() {
  try { const q = await (await fetch(`${COMFY}/queue`)).json(); return q.queue_pending?.length || 0; } catch { return 99; }
}

async function guardOf(raw, cut, [w, h], prone) {
  const meta = cutout(raw, cut);
  let guard = await checkCutoutFile(cut, { sourceWidth: w, sourceHeight: h, composition: prone ? 'prone' : 'full' });
  const cb = meta.contentBox;
  if (cb && (cb[0] <= 3 || cb[1] <= 3 || cb[2] >= w - 4 || cb[3] >= h - 4)) {
    guard = { ok: false, reasons: [...(guard.reasons || []), `content touches the canvas edge (${cb.join(',')})`] };
  }
  return { cutout: meta, guard: { ok: guard.ok, reasons: guard.reasons } };
}

async function body(boss, pose, ns) {
  const s = spec(boss, pose);
  const dir = join(OUT, boss, pose); mkdirSync(dir, { recursive: true });
  // submit every n (respecting the pending cap), then collect in order
  const jobs = [];
  for (const n of ns) {
    if (existsSync(join(OUT, 'STOP-BLACK.txt'))) throw new Error('STOP-BLACK.txt present: no more submits');
    while ((await pending()) >= MAX_PENDING) await sleep(5000);
    const seed = s.c.seed0 + SEED_OFF[pose] + Number(n);
    const cn = (s.p.cn || [0.85])[(Number(n) - 1) % (s.p.cn || [0.85]).length];
    const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: graph(s, seed, cn, `pyrefly/bosses-0926/${boss}-${pose}`), client_id: 'pyrefly-boss-poses-0926' }) });
    const b = await res.json();
    if (!res.ok || b.error) throw new Error(`ComfyUI rejected ${boss}/${pose}#${n}: ${JSON.stringify(b).slice(0, 800)}`);
    jobs.push({ n, seed, cn, pid: b.prompt_id, t0: Date.now() });
    log(boss, `submit ${pose}#${n} seed ${seed} cn ${cn}`);
  }
  for (const j of jobs) {
    let img;
    for (;;) {
      await sleep(4000);
      const e = (await (await fetch(`${COMFY}/history/${j.pid}`)).json())[j.pid];
      if (!e) continue;
      if (e.status?.status_str === 'error') throw new Error(`${pose}#${j.n} failed: ${JSON.stringify(e.status.messages).slice(0, 600)}`);
      img = Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
      if (img) break;
    }
    const stem = s.p.weaponless ? `body-${j.n}` : `cand-${j.n}`;
    const raw = join(dir, `${stem}.raw.png`); const cut = join(dir, `${stem}.png`);
    const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
    writeFileSync(raw, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
    const maxRgb = maxRgbOfPng(readFileSync(raw));
    if (maxRgb != null && isBlackFrame(maxRgb)) {
      writeFileSync(join(OUT, 'STOP-BLACK.txt'), `${new Date().toISOString()} ${boss}/${pose}#${j.n} all-black frame (maxRgb ${maxRgb}); stopped, ComfyUI not restarted\n`, { flag: 'a' });
      throw new Error(`BLACK FRAME ${boss}/${pose}#${j.n}: stopped`);
    }
    const g = await guardOf(raw, cut, s.size, s.prone);
    const side = {
      game: s.c.game, subject: s.c.art, boss, state: pose, candidate: j.n, step: s.p.weaponless ? 'body (no weapon; METHOD-CHECK method 1)' : 'render', seed: j.seed, status: 'CANDIDATE',
      identitySource: `read off public/art/characters/${s.c.art}/idle.png and its sidecar prompt (pose words stripped)`,
      controlnet: { file: CONTROLNET, strength: j.cn, start: 0, end: 1, skeleton: s.skeletonRel },
      ipadapter: { file: IPADAPTER, ...IPA, combine: 'concat', images: [`_refs/idle-${s.p.ref || 'full'}-square.png`, `_refs/${s.p.refHead || 'head.png'}`], forced: true },
      positive: s.positive, negative: s.negative, model: CKPT, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      width: s.size[0], height: s.size[1], facing: s.p.facing || 'left', maxRgb, black: false, ...g, seconds: (Date.now() - j.t0) / 1000, generatedAt: new Date().toISOString(),
    };
    writeFileSync(join(dir, `${stem}.json`), JSON.stringify(side, null, 1));
    log(boss, `${pose}#${j.n} seed ${j.seed} cn ${j.cn}: ${g.cutout.width}x${g.cutout.height} guard ${g.guard.ok ? 'ok' : 'REJECT ' + g.guard.reasons.join('; ')} maxRgb ${maxRgb}`);
  }
}

async function cut(boss, pose, n) {
  const s = spec(boss, pose); const dir = join(OUT, boss, pose);
  const comp = JSON.parse(readFileSync(join(dir, `cand-${n}-comp.json`), 'utf8'));
  const g = await guardOf(join(dir, `cand-${n}-comp.png`), join(dir, `cand-${n}.png`), comp.size || s.size, s.prone);
  const f = join(dir, `body-${n}.json`); const side = JSON.parse(readFileSync(f, 'utf8'));
  const out = { ...side, step: 'body (no weapon) + composite of the approved weapon (METHOD-CHECK method 1)', composite: comp, bodyCutout: side.cutout, bodyGuard: side.guard, ...g };
  writeFileSync(join(dir, `cand-${n}.json`), JSON.stringify(out, null, 1));
  log(boss, `cut ${pose}#${n}: guard ${g.guard.ok ? 'ok' : 'REJECT ' + g.guard.reasons.join('; ')}`);
}

const [cmd, boss, pose, ...rest] = process.argv.slice(2);
if (cmd === 'body') await body(boss, pose, rest);
else if (cmd === 'cut') await cut(boss, pose, rest[0]);
else if (cmd === 'dry') { const s = spec(boss, pose); console.log('+', s.positive, '\n-', s.negative, '\n', s.skeleton, s.size, s.refA); }
else console.log('usage: body <boss> <pose> <n>... | cut <boss> <pose> <n> | dry <boss> <pose>');
void copyFileSync;
