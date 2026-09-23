#!/usr/bin/env node
/**
 * Logos round 2 (FFX-2 only, Chapter 6 art): renders with the round-2 LoRA.
 * Every output is a CANDIDATE; nothing is approved.
 *
 *   node render-r2.mjs <attack|cast|hurt|ko|idle|all> [--seeds 6] [--lora 0.85] [--cn 0.6]
 *        [--ref 0.3] [--lorafile logos-x2-r2.safetensors] [--step 2000] [--tag r2] [--seed0 N]
 *        [--pose <stem of a round2 *-pose.png>] [--extra tags] [--negextra tags] [--out dir]
 *
 * Graph = round 1's (../poses/render.mjs): Animagine XL 4.0 Opt -> LoraLoader (the r2
 * LoRA, model and clip) -> IPAdapterAdvanced on the REPAIRED idle (refs/idle-square.png +
 * refs/idle-head.png, concat, --ref (0.3), ease in, 0.2..0.6, K+V) -> KSampler 28 steps,
 * cfg 6, euler_ancestral / normal; conditioning through ControlNetApplyAdvanced (xinsir
 * OpenPose SDXL, the state's round-2 skeleton, --cn, 0..0.8).
 * Prompt: trigger + view and pose words + the costume words read off the idle
 * (../poses/identity-idle.txt) + white background + house style; lintSpritePrompt must strip
 * nothing. Negative: SPRITE_NEGATIVE + FACING_NEGATIVE (not ko) + round 1's costume drifts +
 * NEG_R2 (every defect a judge named on Logos) + per-state words.
 * `idle` renders the idle's own skeleton (../idle-pose.png) for the step pick.
 * One prompt at a time behind the shared ComfyUI queue; ComfyUI is never restarted.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPRITE_NEGATIVE, FACING_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, cutout, lintSpritePrompt } from '../../../../../../../tools/gen/comfy.mjs';
import { checkCutoutFile } from '../../../../../../../tools/gen/cutout-guard.mjs';
import { runComfy, maxRgb, sha } from './fix2.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const LORAS = 'D:/Tools/ComfyUI/ComfyUI/models/loras';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const IDENTITY = readFileSync(join(HERE, '..', 'poses', 'identity-idle.txt'), 'utf8').trim();
const NEG_COMMON =
  'hat, brim, hood, crest, helmet crest, fin, plume, feathers, horns, winged helmet, pauldrons, shoulder armor, ' +
  'shoulder pads, spikes, sword, katana, 1girl, long hair, single gun, one gun, cape, capelet, gold trim, yellow sash, ' +
  'chain, skirt, bare legs, thighs, grey background, blue background, gradient background, dark skin, tan';
// Every defect a judge named on Logos (round 3 and the LoRA round): closed shoes instead of
// the idle's slide sandals, a glossy finish, the mesh / grille disc, the engraved or winged
// helmet band and slotted visor or cage, the hanging revolver, brown wooden grips, a blank
// face, a second ribbon or a sash tail at the front, a chin spike.
export const NEG_R2 =
  'boots, closed shoes, sneakers, socks, glossy, shiny skin, oily skin, 3d, realistic, mesh, grille, crosshatch, net pattern, ' +
  'engraving, engraved helmet, lettering, text on helmet, helmet wings, slotted visor, cage, chin spike, ' +
  'hanging gun, dangling gun, finger in trigger guard, wooden grip, brown grip, double barrel, ' +
  'blank face, faceless, multiple ribbons, two ribbons, sash tail in front';

export const STATES = {
  idle: {
    size: [832, 1216], seed0: 99001, composition: 'full', poseImg: join(HERE, '..', 'idle-pose.png'), cn: 0.5,
    pose: 'full body, from side, profile, facing left, standing, legs apart, arms down, holding gun, dual wielding, gun pointed down',
    neg: '',
  },
  attack: {
    size: [832, 1216], seed0: 99101, composition: 'full', poseImg: join(HERE, 'attack2-pose.png'), cn: 0.6,
    pose: 'full body, from side, profile, facing left, lunging, leaning forward, legs apart, one leg forward, bent knee, aiming, arms forward, outstretched arms, holding gun, dual wielding, serious, v-shaped eyebrows, closed mouth',
    neg: 'arms down, arm behind back, smile, standing still, walking',
  },
  cast: {
    size: [832, 1216], seed0: 99201, composition: 'full', poseImg: join(HERE, 'cast-pose.png'), cn: 0.6,
    pose: 'full body, from side, profile, facing left, standing, legs apart, arm up, holding gun, gun pointed up, revolver beside face, other hand holding gun, gun pointed down, dual wielding, smirk, closed mouth',
    neg: 'gun to head, pointing gun at self, both arms down, aiming, third gun',
  },
  hurt: {
    size: [832, 1216], seed0: 99301, composition: 'full', poseImg: join(HERE, 'hurt3-pose.png'), cn: 0.8,
    pose: 'full body, from side, profile, facing left, leaning back, off balance, bent knees, both feet on ground, head back, wince, pained expression, clenched teeth, v-shaped eyebrows, arms spread, holding gun, dual wielding',
    neg: 'smile, smirk, calm, standing still, walking, striding, looking at viewer, gun to head, one leg, missing leg',
  },
  ko: {
    size: [1216, 832], seed0: 99401, composition: 'prone', poseImg: join(HERE, 'ko-pose.png'), cn: 0.6,
    pose: 'full body, from side, lying, on back, on ground, unconscious, closed eyes, arms at sides, gun on ground, dropped weapon, two guns, wearing helmet, (gun on ground:1.3), (two revolvers:1.2), revolver on floor, dropped gun',
    neg: 'holding gun, standing, sitting, kneeling, no helmet, helmet removed, blood, rifle, cast shadow, drop shadow, black shadow',
    dropIdentity: ['revolver'],
  },
};

export function prompts(state, extra = '', negExtra = '') {
  const s = STATES[state];
  const ident = IDENTITY.split(/,\s*/).filter((t) => !(s.dropIdentity || []).includes(t)).join(', ');
  const pose = extra ? `${s.pose}, ${extra}` : s.pose;
  const lint = lintSpritePrompt({ tags: ident, poseTags: pose, composition: s.composition === 'prone' ? 'prone' : 'full' });
  if (lint.stripped.length) throw new Error(`${state}: effect words in the prompt: ${JSON.stringify(lint.stripped)}`);
  const positive = `logosX2, 1boy, solo, ${pose}, ${ident}, simple background, (white background:1.2), ${STYLE_TAGS}, ${QUALITY_TAGS}`;
  const negative = [SPRITE_NEGATIVE, s.composition === 'prone' ? null : FACING_NEGATIVE, NEG_COMMON, NEG_R2, s.neg, negExtra].filter(Boolean).join(', ');
  return { positive, negative };
}

function graph({ state, seed, loraFile, lora, cn, ref, refs, poseImg, positive, negative }) {
  const [w, h] = STATES[state].size;
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: [loraFile ? '10' : '4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: [loraFile ? '10' : '4', 1] } },
    30: { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } },
    31: { class_type: 'LoadImage', inputs: { image: poseImg, upload: 'image' } },
    32: { class_type: 'ControlNetApplyAdvanced', inputs: { positive: ['6', 0], negative: ['7', 0], control_net: ['30', 0], image: ['31', 0], strength: cn, start_percent: 0, end_percent: 0.8, vae: ['4', 2] } },
    20: { class_type: 'LoadImage', inputs: { image: refs[0], upload: 'image' } },
    24: { class_type: 'LoadImage', inputs: { image: refs[1], upload: 'image' } },
    25: { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } },
    23: { class_type: 'IPAdapterAdvanced', inputs: { model: [loraFile ? '10' : '4', 0], ipadapter: ['21', 0], image: ['25', 0], weight: ref, weight_type: 'ease in', combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0] } },
    5: { class_type: 'EmptyLatentImage', inputs: { width: w, height: h, batch_size: 1 } },
    3: { class_type: 'KSampler', inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['23', 0], positive: ['32', 0], negative: ['32', 1], latent_image: ['5', 0] } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: `pyrefly/logos-r2-${state}`, images: ['8', 0] } },
  };
  if (loraFile) g[10] = { class_type: 'LoraLoader', inputs: { model: ['4', 0], clip: ['4', 1], lora_name: loraFile, strength_model: lora, strength_clip: lora } };
  return g;
}

function frameStd(p) {
  const r = spawnSync(PY, ['-s', '-c', 'import sys,numpy as n;from PIL import Image;a=n.asarray(Image.open(sys.argv[1]).convert("RGB"));print(round(float(a.std()),1))', p], { encoding: 'utf8' });
  return Number(r.stdout.trim());
}

async function renderState(state, a) {
  const s = STATES[state];
  const n = Number(a.seeds || 6);
  const loraFile = a.lorafile === 'none' ? null : (a.lorafile || 'logos-x2-r2.safetensors');
  const lora = Number(a.lora ?? 0.85);
  const cn = Number(a.cn ?? s.cn);
  const ref = Number(a.ref ?? 0.3);
  const out = a.out || join(HERE, 'renders');
  const { positive, negative } = prompts(state, a.extra || '', a.negextra || '');
  const refs = [stageImage(join(HERE, 'refs/idle-square.png')), stageImage(join(HERE, 'refs/idle-head.png'))];
  const poseImg = a.pose ? join(HERE, `${a.pose}-pose.png`) : s.poseImg;
  const staged = stageImage(poseImg);
  const seed0 = Number(a.seed0 || s.seed0);
  const loraSha = loraFile ? sha(join(LORAS, loraFile.replace(/\\/g, '/'))) : null;
  mkdirSync(out, { recursive: true });
  for (let i = 0; i < n; i++) {
    const seed = seed0 + i;
    const tag = `${state}.${seed}${a.tag ? `.${a.tag}` : ''}`;
    const raw = join(out, `${tag}.raw.png`);
    if (existsSync(join(out, `${tag}.json`))) continue;
    const secs = await runComfy(graph({ state, seed, loraFile, lora, cn, ref, refs, poseImg: staged, positive, negative }), raw, 'pyrefly-logos-r2-poses');
    if (maxRgb(raw) === 0) throw new Error(`${tag}: BLACK FRAME; check the queue, never restart ComfyUI from here`);
    let cut = null;
    let guard = null;
    if (!a.nocut) {
      try {
        cut = cutout(raw, join(out, `${tag}.png`), 16);
        guard = await checkCutoutFile(join(out, `${tag}.png`), { sourceWidth: s.size[0], sourceHeight: s.size[1], composition: s.composition });
      } catch (e) { console.error(`[logos-r2] ${tag}: cutout failed: ${e.message}`); }
    }
    writeFileSync(join(out, `${tag}.json`), JSON.stringify({
      tag, state, seed, method: 'lora-r2+openpose', positive, negative, model: CKPT,
      lora: loraFile ? { file: loraFile, step: Number(a.step || 2000), sha256: loraSha, strength: lora } : null,
      controlnet: { file: CONTROLNET, image: poseImg.replace(/\\/g, '/').replace(/^.*?docs\//, 'docs/'), strength: cn, start: 0, end: 0.8 },
      ipadapter: { file: IPADAPTER, images: ['docs/concepts/chapters/leblanc/lora/logos/round2/refs/idle-square.png', 'docs/concepts/chapters/leblanc/lora/logos/round2/refs/idle-head.png'], weight: ref, type: 'ease in', start: 0.2, end: 0.6, combine: 'concat', scaling: 'K+V' },
      width: s.size[0], height: s.size[1], composition: s.composition, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      frame: { std: frameStd(raw) }, cutout: cut, cutoutGuard: guard, seconds: Math.round(secs), generatedAt: new Date().toISOString(),
    }, null, 1) + '\n');
    console.log(`[logos-r2] ${tag} ${Math.round(secs)} s${guard && !guard.ok ? ` GUARD: ${guard.reasons.join('; ')}` : ''}`);
  }
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('round2/render-r2.mjs')) {
  const a = { _: [] };
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) {
    if (v[i] === '--nocut') a.nocut = true;
    else if (v[i].startsWith('--')) a[v[i].slice(2)] = v[++i];
    else a._.push(v[i]);
  }
  const which = a._[0] === 'all' ? ['attack', 'cast', 'hurt', 'ko'] : a._;
  if (!which.length || which.some((s) => !STATES[s])) {
    console.log('usage: node render-r2.mjs <attack|cast|hurt|ko|idle|all> [--seeds 6] [--lora 0.85] [--cn N] [--lorafile f|none] [--tag t]');
    process.exit(1);
  }
  for (const s of which) await renderState(s, a);
}
