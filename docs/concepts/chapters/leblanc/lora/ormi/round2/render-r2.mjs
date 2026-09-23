#!/usr/bin/env node
/**
 * Ormi round-2 pose renders (FFX-2 only, Chapter 6 art): LoRA r2 + OpenPose.
 *
 *   node docs/concepts/chapters/leblanc/lora/ormi/round2/render-r2.mjs <state>
 *        [--seeds a,b,..] [--lora 0.8] [--loraFile ormi-x2-r2.safetensors] [--step 1500]
 *        [--cn 0.6] [--ref 0.3] [--skel skel-<state>-s85.png] [--tag t] [--pose "..."] [--negAdd "..."] [--size WxH]
 *
 * Recipe (round-2 brief): Animagine XL 4.0 Opt; LoraLoader ormi-x2-r2 (dataset-r2.md);
 * IP-Adapter plus on the installed idle (square-padded on white + the head crop, batched,
 * concat, ease in, 0.2 to 0.6, K+V) at 0.3; ControlNet OpenPose (xinsir SDXL) on the
 * round-2 skeletons (skeletons-r2.py: the strike leads with the shield, the recoil keeps
 * both feet down, the ko lies flat), end 0.8; the idle's costume words
 * (sets/ormi/round3/identity-idle.txt, character tags -> the trigger); negatives for every
 * defect the round-1 judges named for Ormi (a second or back shield in attack, the
 * glossy / neon / airbrushed finish of hurt and ko, the sash ballooning over the belly,
 * orange sleeves, the white translucent hem, the heart brooch or clasp on the chest,
 * a lifted or missing leg, a hair patch, closed shoes instead of sandals). Raw frames,
 * cut-outs and sidecars go to D:/Tools/pyrefly-lora/ormi/r2/poses/<state>/. One prompt
 * at a time behind an empty shared ComfyUI queue (../poses/render.mjs run()).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const G = await import(pathToFileURL(join(REPO, 'tools/gen/comfy.mjs')).href);
const C = await import(pathToFileURL(join(REPO, 'tools/gen/cutout-guard.mjs')).href);
const R1 = await import(pathToFileURL(join(HERE, '..', 'poses', 'render.mjs')).href);
const { stageImage, cutout, STYLE_TAGS, QUALITY_TAGS, SPRITE_NEGATIVE, FACING_NEGATIVE } = G;

export const OUT = 'D:/Tools/pyrefly-lora/ormi/r2/poses';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const IPA = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPV = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IDLE = join(REPO, 'public/art/characters/ormi/idle.png');

// The idle's costume words (round3/identity-idle.txt), character tags -> the trigger. The
// shield words are cut back as round 1's batch p5 found (the LoRA carries the shield);
// the heart is research §10.1 (research/ffx2-leblanc-syndicate.md), everything else the idle.
const IDENTITY = readFileSync(join(REPO, 'docs/concepts/chapters/leblanc/sets/ormi/round3/identity-idle.txt'), 'utf8')
  .trim()
  .replace('1boy, ormi (ff10-2), final fantasy x-2, safe, solo', 'ormiX2, 1boy, solo, safe')
  .replace(', round shield, huge shield, red shield, gold rim, studded rim, heart emblem', ', round shield, gold rim, red studded band, purple sunburst shield face');
export const EMPHASIS = '(bald:1.2), (fat man:1.2), (crimson sleeves:1.1), (purple kimono:1.1), (purple hakama:1.2), (long hakama:1.15), (gold diamond pattern hem:1.1), (sandals:1.1), (red heart emblem on shield:1.2), (dark red topknot:1.15), cheek mark';
const FACING = '(from side:1.3), three-quarter view, body facing right';
const FULL = 'full body, feet visible, (white background:1.3), (simple background:1.2)';
export const NEG_DEFECTS =
  // round-1 judge (../judge.md) and painters (../poses/poses.md, redo.md), Ormi only
  '(glossy:1.3), (shiny skin:1.2), shiny clothes, latex, airbrush, (neon:1.2), glowing edges, jelly, 3d, realistic, ' +
  'orange sleeves, orange clothes, (white hem:1.2), translucent cloth, transparent, fading, gradient cloth, ' +
  'heart on chest, heart on clothes, brooch, heart clasp, magenta tassel, ' +
  '(multiple shields:1.3), (two shields:1.3), kite shield, pointed shield, square shield, ' +
  'oversized sash, sash covering belly, ribbons on wrist, ' +
  '(missing leg:1.2), one leg, amputee, (hair patch:1.2), long hair, spiked hair, ' +
  'boots, shoes, closed shoes, face paint, facial tattoo, forehead tattoo, ' +
  'muscular, abs, tall, slim, thin, sword, katana, blade, spear, bare chest, topless male, helmet, feathers, ' +
  'shorts, leggings, tights, pants, trousers, rainbow, multicolored clothes, gradient background, (navel:1.3), (midriff:1.3), ' +
  'floor, shadow on floor, reflection, chibi, sketch, monochrome';

export const STATES = {
  // step pick only (round2.md): the idle pose through the production recipe, never installed
  idle: {
    size: [832, 1216], seed0: 980401, composition: 'full',
    pose: 'standing, arms crossed, stern expression, scowl, looking to the side, shield on back',
    negAdd: 'smile, open mouth, holding shield',
  },
  attack: {
    size: [832, 1216], seed0: 980001, composition: 'full',
    pose: 'shield bash, lunging, leaning forward, one leg forward, (holding shield in front:1.2), (shield in front:1.2), arms forward, arms outstretched, pushing, clenched teeth, v-shaped eyebrows, angry, looking ahead, (lunging:1.2), (shield bash:1.2)',
    negAdd: 'arms crossed, standing still, (shield on back:1.3), arm behind back, smile',
  },
  cast: {
    size: [832, 1216], seed0: 980101, composition: 'full',
    pose: 'standing, legs apart, arm up, raised fist, clenched hand, fist raised overhead, shouting, clenched teeth, v-shaped eyebrows, angry, shield at side, looking ahead, (arm up:1.2), (raised fist:1.15)',
    negAdd: 'arms crossed, smile, sitting',
  },
  hurt: {
    size: [832, 1216], seed0: 980201, composition: 'full',
    pose: 'recoiling, leaning back, off balance, staggering, standing, (both feet on ground:1.2), wince, (closed eyes:1.2), clenched teeth, frown, pained expression, hand on own stomach, arm out, shield on back, (leaning back:1.2), (pained expression:1.25), (wince:1.2)',
    negAdd: 'arms crossed, standing still, holding shield, smile, open mouth, singing, blush, looking up, reaching up, arm up, dancing, lifted leg, (leg up:1.2), looking at viewer, open eyes',
  },
  ko: {
    size: [1216, 832], seed0: 980301, composition: 'prone',
    pose: 'lying, on back, unconscious, defeated, closed eyes, arms at sides, legs together, round shield beside him, (lying on back:1.2), (closed eyes:1.25), (unconscious:1.15), head to the right, feet to the left',
    negAdd: 'open eyes, one eye closed, wink, smile, standing, sitting, kneeling, looking at viewer, platform, (circle:1.2), ring, frame, border, (shield behind head:1.2), halo, rug, mat, carpet, blanket, cushion, green floor, (multiple shields:1.4)',
  },
};

export function prompts(state, extra = {}) {
  const s = { ...STATES[state], ...extra };
  const frame = s.composition === 'prone'
    ? 'lying on ground, full body, from side, (white background:1.3), (simple background:1.2)'
    : `${FACING}, ${FULL}`;
  const positive = `${IDENTITY}, ${s.pose}, ${EMPHASIS}, ${frame}, ${STYLE_TAGS}, ${QUALITY_TAGS}`;
  const negative = [SPRITE_NEGATIVE, s.composition === 'prone' ? '' : FACING_NEGATIVE, NEG_DEFECTS, s.negAdd].filter(Boolean).join(', ');
  return { positive, negative };
}

export function refs() {
  const dir = join(OUT, 'refs');
  mkdirSync(dir, { recursive: true });
  const sq = join(dir, 'idle-square.png');
  const head = join(dir, 'idle-head.png');
  if (!existsSync(sq) || !existsSync(head)) {
    const py = [
      'from PIL import Image', 'import sys',
      'im=Image.open(sys.argv[1]).convert("RGBA"); flat=Image.new("RGB",im.size,(255,255,255)); flat.paste(im,mask=im.split()[-1])',
      's=max(im.size); sq=Image.new("RGB",(s,s),(255,255,255)); sq.paste(flat,((s-im.width)//2,(s-im.height)//2))',
      'sq.resize((1024,1024),Image.LANCZOS).save(sys.argv[2])',
      'flat.crop((140,0,480,340)).resize((1024,1024),Image.LANCZOS).save(sys.argv[3])',
    ].join('\n');
    const r = spawnSync('python', ['-c', py, IDLE, sq, head], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(r.stderr);
  }
  return [sq, head];
}

export function graph({ state, seed, lora, loraFile, cn, ref, sq, head, skel, positive, negative }) {
  const s = STATES[state];
  return {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    10: { class_type: 'LoraLoader', inputs: { model: ['4', 0], clip: ['4', 1], lora_name: loraFile, strength_model: lora, strength_clip: lora } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['10', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['10', 1] } },
    30: { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } },
    31: { class_type: 'LoadImage', inputs: { image: skel, upload: 'image' } },
    32: {
      class_type: 'ControlNetApplyAdvanced',
      inputs: { positive: ['6', 0], negative: ['7', 0], control_net: ['30', 0], image: ['31', 0], strength: cn, start_percent: 0, end_percent: 0.8, vae: ['4', 2] },
    },
    20: { class_type: 'LoadImage', inputs: { image: sq, upload: 'image' } },
    24: { class_type: 'LoadImage', inputs: { image: head, upload: 'image' } },
    25: { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPA } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPV } },
    23: {
      class_type: 'IPAdapterAdvanced',
      inputs: { model: ['10', 0], ipadapter: ['21', 0], image: ['25', 0], weight: ref, weight_type: 'ease in', combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0] },
    },
    5: { class_type: 'EmptyLatentImage', inputs: { width: s.size[0], height: s.size[1], batch_size: 1 } },
    3: {
      class_type: 'KSampler',
      inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['23', 0], positive: ['32', 0], negative: ['32', 1], latent_image: ['5', 0] },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: `pyrefly/lora-ormi-r2-${state}`, images: ['8', 0] } },
  };
}

function parse() {
  const a = { _: [] };
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) {
    if (v[i].startsWith('--')) a[v[i].slice(2)] = v[++i];
    else a._.push(v[i]);
  }
  return a;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const a = parse();
  const state = a._[0];
  if (!STATES[state]) throw new Error(`state? ${Object.keys(STATES).join(' | ')}`);
  if (a.size) STATES[state].size = a.size.split('x').map(Number); // e.g. --size 1024x1024 (attack, batch c)
  const s = STATES[state];
  const seeds = a.seeds ? a.seeds.split(',').map(Number) : Array.from({ length: 6 }, (_, i) => s.seed0 + i);
  const lora = Number(a.lora ?? 0.8);
  const loraFile = a.loraFile || 'ormi-x2-r2.safetensors';
  const step = Number(a.step ?? 0) || null;
  const cn = Number(a.cn ?? 0.6);
  const ref = Number(a.ref ?? 0.3);
  const extra = {};
  if (a.pose) extra.pose = a.pose;
  if (a.negAdd) extra.negAdd = a.negAdd;
  const [sqPath, headPath] = refs();
  const sq = stageImage(sqPath);
  const head = stageImage(headPath);
  const skelFile = a.skel || `skel-${state}-s85.png`;
  const skel = stageImage(join(HERE, skelFile));
  const dir = join(OUT, state);
  mkdirSync(dir, { recursive: true });
  const { positive, negative } = prompts(state, extra);
  for (const seed of seeds) {
    const tag = a.tag ? `${state}.${a.tag}.${seed}` : `${state}.${seed}`;
    const raw = join(dir, `${tag}.raw.png`);
    const png = join(dir, `${tag}.png`);
    if (existsSync(join(dir, `${tag}.json`))) continue;
    const secs = await R1.run(graph({ state, seed, lora, loraFile, cn, ref, sq, head, skel, positive, negative }), raw);
    const cut = cutout(raw, png);
    const guard = await C.checkCutoutFile(png, { sourceWidth: s.size[0], sourceHeight: s.size[1], composition: s.composition });
    writeFileSync(join(dir, `${tag}.json`), JSON.stringify({
      state, seed, tag, seconds: secs, positive, negative, model: CKPT, width: s.size[0], height: s.size[1],
      steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      lora: { file: loraFile, step, strength: lora },
      controlnet: { file: CONTROLNET, image: `docs/concepts/chapters/leblanc/lora/ormi/round2/${skelFile}`, strength: cn, start: 0, end: 0.8 },
      ipadapter: { file: IPA, weight: ref, type: 'ease in', start: 0.2, end: 0.6, scaling: 'K+V', combine: 'concat', images: ['public/art/characters/ormi/idle.png square-padded on white', 'public/art/characters/ormi/idle.png head crop 140,0,480,340'] },
      cutout: cut, guard: { ok: guard.ok, reasons: guard.reasons },
    }, null, 1));
    console.log(`[ormi-r2] ${tag} ${secs.toFixed(1)} s guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}`);
  }
}
