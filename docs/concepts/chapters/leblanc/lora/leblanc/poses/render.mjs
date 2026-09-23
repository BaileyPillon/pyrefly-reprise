#!/usr/bin/env node
/**
 * Leblanc battle poses with the identity LoRA (FFX-2 only, Chapter 6 art; AGENTS.md hard rule 14).
 *
 *   node docs/concepts/chapters/leblanc/lora/leblanc/poses/render.mjs <attack|cast|hurt|ko> [--n 1,2,...] [--set v3] [--dry]
 *
 * Graph (core ComfyUI nodes + the installed IP-Adapter node, nothing new):
 *   CheckpointLoaderSimple (Animagine XL 4.0 Opt) -> LoraLoader leblanc-x2 (step 1500) ->
 *   IPAdapterAdvanced (method F: the idle square-padded + the head crop, batched, concat,
 *   0.3, ease in, 0.2..0.6, K+V) -> KSampler; the prompts pass through ControlNetApplyAdvanced
 *   (xinsir OpenPose SDXL) driven by the state's skeleton from skeletons.py.
 * 832x1216 full composition (ko: 1216x832, the prone canvas the installed ko uses),
 * 28 steps, cfg 6, euler_ancestral / normal. Idle-truth words (pilot2/identity-idle.txt with
 * the pilot-2 judge's corrections), Danbooru pose tags, no effect words.
 *
 * One prompt at a time behind the shared ComfyUI queue; ComfyUI is never restarted.
 * Raw frames, cutouts and sidecars: D:/Tools/pyrefly-lora/leblanc/poses/ (outside the repo).
 * Cutouts go through tools/gen/rembg.py (isnet-anime) and tools/gen/cutout-guard.mjs.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPRITE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, cutout } from '../../../../../../../tools/gen/comfy.mjs';
import { checkCutoutFile } from '../../../../../../../tools/gen/cutout-guard.mjs';
import { maxRgbOfPng, isBlackFrame } from '../../../../../../../tools/gen/black-frame.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../../../..');
export const OUT = 'D:/Tools/pyrefly-lora/leblanc/poses';
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const LORA = 'leblanc-x2.safetensors';
const LORA_STEP = 1500;
/** Round 2's picked step (../round2/round2.md); set once the step test is read. */
export const R2_STEP = Number(process.env.LEBLANC_R2_STEP || 0) || null;
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const REFS = ['docs/concepts/chapters/leblanc/pilot2/refs/idle-square.png', 'docs/concepts/chapters/leblanc/pilot2/refs/idle-head.png'];

/** Idle-truth costume words (pilot2/identity-idle.txt; pilot-2 judge: crimson obi without "gold", heart as a small mark).
 * Set v3 (2026-09-23): `blonde hair` and `open-toe footwear` exactly as identity-idle.txt words them. Sets 1..8 said
 * `platinum blonde hair` and `open-toe boots`, which drew ash hair and closed-toe boots at 1:1 (poses.md). */
export const IDENTITY =
  'blonde hair, short hair, bob cut, swept bangs, purple eyes, pale skin, purple choker, studded choker, ' +
  'small red heart mark on chest, white dress, halterneck, plunging neckline, highleg, crimson obi, purple tassel, ' +
  'purple kimono, open robe, off shoulder, bare shoulders, robe hanging from elbows, wide sleeves, bare legs, ' +
  'purple boots, lace-up boots, open-toe footwear, ankle boots, high heels, black folding fan';

const BASE_NEG = `${SPRITE_NEGATIVE}, multiple views, 2girls, chibi, sketch, monochrome, 3d, realistic, cropped, ` +
  'thighhighs, stockings, pantyhose, closed robe, long dress, gold obi, red fan, pink fan, two fans, dual wielding, fan to mouth';
const NO_SMILE = 'smile, smirk, grin, seductive smile, happy, dancing, fan dance';

export const STATES = {
  attack: {
    size: [832, 1216], composition: 'full',
    pose: '(from side:1.2), three-quarter view, body facing left, full body, feet visible, (lunging:1.2), leaning forward, ' +
      'one leg forward, wide stance, legs apart, (arm extended forward:1.15), outstretched arm, holding folding fan, serious, v-shaped eyebrows, ' +
      'looking ahead, closed mouth',
    neg: `${NO_SMILE}, wink, looking at viewer, standing, leg up, knee up, raised leg, kicking, high kick, arm behind back, fan behind back, facing viewer, from behind`,
  },
  cast: {
    size: [832, 1216], composition: 'full',
    pose: '(from side:1.2), three-quarter view, body facing left, full body, feet visible, standing, (arm up:1.2), raised hand, ' +
      'holding folding fan, (open fan:1.15), fan above head, (looking up:1.2), serious, closed mouth',
    neg: `${NO_SMILE}, wink, looking at viewer, closed fan, arched back, bent backward, leaning back, facing viewer, from behind`,
  },
  hurt: {
    size: [832, 1216], composition: 'full',
    pose: '(from side:1.2), three-quarter view, body facing left, full body, feet visible, (leaning back:1.3), off balance, head back, ' +
      '(wince:1.2), (one eye closed:1.2), pained expression, clenched teeth, v-shaped eyebrows, (hand on own stomach:1.15), ' +
      'holding folding fan, closed fan',
    neg: `${NO_SMILE}, looking at viewer, open fan, facing viewer, from behind`,
  },
  ko: {
    size: [1216, 832], composition: 'prone',
    pose: 'lying, on side, on ground, full body, from side, head to the left, feet to the right, (closed eyes:1.3), unconscious, ' +
      'expressionless, closed mouth, holding folding fan, closed fan',
    neg: `${NO_SMILE}, wink, one eye closed, open eyes, looking at viewer, sitting, standing, lying on back, open fan`,
  },
};

/** Six candidates per state: seeds and the strength split the brief allows (LoRA 0.7..0.85, OpenPose 0.5..0.7). */
export const CANDS = [
  { n: 1, lora: 0.8, cn: 0.6 }, { n: 2, lora: 0.8, cn: 0.7 }, { n: 3, lora: 0.75, cn: 0.6 },
  { n: 4, lora: 0.85, cn: 0.6 }, { n: 5, lora: 0.8, cn: 0.5 }, { n: 6, lora: 0.75, cn: 0.7 },
  // 7 and 8: re-rolls at 1 and 2's settings (attack and hurt were re-posed after the pilot of 1 and 2; see poses.md)
  { n: 7, lora: 0.8, cn: 0.6 }, { n: 8, lora: 0.8, cn: 0.7 },
];
const SEED0 = { attack: 61100, cast: 61200, hurt: 61300, ko: 61400 };

/** Set v4 (the redo after the independent judge, lora/leblanc/judge.md): attack and hurt only, on the
 * re-posed v4 skeletons (skeletons.py; v3's are in skeletons/v3/). The judge's anatomy defects (a folded
 * leg in a mid-air leap; one leg lost behind the robe) came with OpenPose at 0.6 to 0.7, which the words
 * overrode, so v4 holds the pose harder (0.75 to 0.9) and adds the named negatives. Seeds SEED0 + 20 + n. */
export const CANDS_V4 = [
  { n: 1, lora: 0.8, cn: 0.8 }, { n: 2, lora: 0.8, cn: 0.9 }, { n: 3, lora: 0.75, cn: 0.8 },
  { n: 4, lora: 0.75, cn: 0.9 }, { n: 5, lora: 0.8, cn: 0.75 }, { n: 6, lora: 0.85, cn: 0.85 },
];
export const V4_NEG = {
  attack: 'wings, cape, flying, jumping, midair, floating, leg lift, knee up, foot off ground',
  hurt: 'one leg, missing leg, amputee, floating, feet out of frame',
};
export const V4_POSE_ADD = {
  attack: '(both feet on ground:1.1), feet planted, bent front knee, straight back leg',
  hurt: '(both feet on ground:1.1), two legs, legs apart, standing',
};

/** Set v5 (attack only): v4 planted both feet, but at OpenPose 0.8+ the model put the fan in the far hand
 * and swept it to screen-RIGHT, with the empty near hand pointing at the party, and the rear foot left the
 * frame. The v5 skeleton (skeletons.py) keeps one extended arm only (the near, fan arm), puts the far hand
 * on the hip and pulls the rear foot in to x ~710. Seeds SEED0 + 40 + n. */
export const CANDS_V5 = [
  { n: 1, lora: 0.8, cn: 0.75 }, { n: 2, lora: 0.8, cn: 0.85 }, { n: 3, lora: 0.75, cn: 0.75 },
  { n: 4, lora: 0.75, cn: 0.85 }, { n: 5, lora: 0.8, cn: 0.7 }, { n: 6, lora: 0.85, cn: 0.8 },
];
/** Set v6 (attack only): v5 turned frontal too. v6's skeleton is near profile (skeletons.py); OpenPose back to
 * 0.6 to 0.75, where v3 kept the facing; v4's planted-feet words and negatives. Seeds SEED0 + 60 + n. */
export const CANDS_V6 = [
  { n: 1, lora: 0.8, cn: 0.65 }, { n: 2, lora: 0.8, cn: 0.75 }, { n: 3, lora: 0.75, cn: 0.65 },
  { n: 4, lora: 0.75, cn: 0.75 }, { n: 5, lora: 0.8, cn: 0.6 }, { n: 6, lora: 0.85, cn: 0.7 },
];
/** ROUND 2 (2026-09-23; ../round2/round2.md): LoRA r2 (leblanc-x2-r2, trained on round 1's set plus the
 * round-1 picks scored 6+, ../dataset-r2.md) + the fixed skeletons (skeletons/r2/: the v7 strike that leads
 * with the fan, the v4 recoil with both legs, a flat ko). Negatives for every defect the judges named:
 * closed-toe boots, a second fan, the fan at the mouth outside idle, the dark hair patch, a glossy finish.
 * The open fan (cast) is red and silver (research ffx2-leblanc-syndicate.md §10.1), so `red fan` leaves
 * the cast negative. Six per state, seeds SEED0 + 500 + n. */
export const R2_NEG = 'closed-toe footwear, closed toe, covered toes, two fans, second fan, extra fan, fan in both hands, ' +
  'fan to mouth, hand to mouth, fan over mouth, hair over mouth, black patch on face, dark shadow on face, ' +
  'glossy, shiny skin, shiny clothes, glossy skin, latex, oily skin, 3d render';
const R2_BASE_NEG = `${SPRITE_NEGATIVE}, multiple views, 2girls, chibi, sketch, monochrome, 3d, realistic, cropped, ` +
  'thighhighs, stockings, pantyhose, closed robe, long dress, gold obi, dual wielding, fan to mouth';
export const R2 = {
  lora: 'leblanc-x2-r2.safetensors', seedOffset: 500,
  sizes: { attack: [1024, 1216] },
  baseNeg: { attack: `${R2_BASE_NEG}, red fan, pink fan`, hurt: `${R2_BASE_NEG}, red fan, pink fan`, ko: `${R2_BASE_NEG}, red fan, pink fan`, cast: `${R2_BASE_NEG}, pink fan, lavender fan, purple fan, black fan leaf` },
  identity: { cast: IDENTITY.replace('black folding fan', 'red and silver folding fan, red fan leaf, silver trim, black fan ribs') },
  candsBy: {
    attack: [{ n: 1, lora: 0.75, cn: 0.65 }, { n: 2, lora: 0.8, cn: 0.65 }, { n: 3, lora: 0.75, cn: 0.7 }, { n: 4, lora: 0.8, cn: 0.7 }, { n: 5, lora: 0.85, cn: 0.65 }, { n: 6, lora: 0.75, cn: 0.6 }],
    cast: [{ n: 1, lora: 0.75, cn: 0.7 }, { n: 2, lora: 0.8, cn: 0.7 }, { n: 3, lora: 0.75, cn: 0.6 }, { n: 4, lora: 0.8, cn: 0.6 }, { n: 5, lora: 0.85, cn: 0.7 }, { n: 6, lora: 0.75, cn: 0.65 }],
    hurt: [{ n: 1, lora: 0.8, cn: 0.75 }, { n: 2, lora: 0.8, cn: 0.85 }, { n: 3, lora: 0.75, cn: 0.8 }, { n: 4, lora: 0.85, cn: 0.75 }, { n: 5, lora: 0.75, cn: 0.9 }, { n: 6, lora: 0.8, cn: 0.8 }],
    ko: [{ n: 1, lora: 0.8, cn: 0.7 }, { n: 2, lora: 0.8, cn: 0.8 }, { n: 3, lora: 0.75, cn: 0.7 }, { n: 4, lora: 0.85, cn: 0.75 }, { n: 5, lora: 0.75, cn: 0.8 }, { n: 6, lora: 0.8, cn: 0.65 }],
  },
  neg: {
    attack: `${R2_NEG}, wings, cape, flying, jumping, midair, floating, leg lift, knee up, foot off ground, facing viewer, front view, spread arms, arms out to both sides, fan behind body`,
    cast: `${R2_NEG}, closed fan`,
    hurt: `${R2_NEG}, one leg, missing leg, amputee, floating, feet out of frame, fan tassel`,
    ko: `${R2_NEG}, head on arm, sleeping, pillow, hand under head, drool`,
  },
  add: {
    attack: '(both feet on ground:1.1), feet planted, bent front knee, straight back leg, (profile:1.1), facing left, (fan thrust forward:1.2), fan leading, hand on own hip',
    cast: '',
    hurt: '(both feet on ground:1.1), two legs, legs apart, standing',
    ko: 'defeated, collapsed, lying flat, head on the ground, arm outstretched, limp',
  },
};

export const SETS = {
  v4: { cands: CANDS_V4, seedOffset: 20, neg: V4_NEG, add: V4_POSE_ADD },
  v5: {
    cands: CANDS_V5, seedOffset: 40,
    neg: { attack: `${V4_NEG.attack}, spread arms, arms out to both sides, fan in right hand, pointing` },
    add: { attack: `${V4_POSE_ADD.attack}, (hand on own hip:1.1), fan held out toward the left, (fan in left hand:1.1)` },
  },
  // v7 (attack only): v6.3 was the one frame with the fan thrust at the party and both feet planted, but the
  // fan left the 832 px canvas at x 0 and the rear boot met the bottom edge; an outpaint left a seam in the
  // robe. So v6's words and skeleton on a 1024x1216 canvas, the skeleton shifted 150 px right and 40 px up
  // (skeletons/v7/attack.png), strengths around v6.3's (LoRA 0.75, OpenPose 0.65). Seeds SEED0 + 80 + n.
  v7: {
    cands: [
      { n: 1, lora: 0.75, cn: 0.65 }, { n: 2, lora: 0.75, cn: 0.65 }, { n: 3, lora: 0.75, cn: 0.65 },
      { n: 4, lora: 0.8, cn: 0.65 }, { n: 5, lora: 0.75, cn: 0.7 }, { n: 6, lora: 0.8, cn: 0.6 },
    ],
    seedOffset: 80, size: [1024, 1216],
    neg: { attack: `${V4_NEG.attack}, facing viewer, front view, spread arms, arms out to both sides` },
    add: { attack: `${V4_POSE_ADD.attack}, (profile:1.1), facing left, (fan thrust forward:1.1), hand on own hip` },
  },
  r2: R2,
  v6: {
    cands: CANDS_V6, seedOffset: 60,
    neg: { attack: `${V4_NEG.attack}, facing viewer, front view, spread arms, arms out to both sides` },
    add: { attack: `${V4_POSE_ADD.attack}, (profile:1.1), facing left, (fan thrust forward:1.1), hand on own hip` },
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function promptFor(state, set = '') {
  const s = STATES[state];
  const add = SETS[set]?.add[state] ? `, ${SETS[set].add[state]}` : '';
  const identity = SETS[set]?.identity?.[state] || IDENTITY;
  return `leblancX2, 1girl, solo, ${s.pose}${add}, ${identity}, simple background, white background, ${STYLE_TAGS}, ${QUALITY_TAGS}`;
}
export const negativeFor = (state, set = '') => `${SETS[set]?.baseNeg?.[state] || BASE_NEG}, ${STATES[state].neg}${SETS[set]?.neg[state] ? `, ${SETS[set].neg[state]}` : ''}`;
const sizeFor = (state, set = '') => SETS[set]?.sizes?.[state] || SETS[set]?.size || STATES[state].size;

export function graph({ state, seed, lora, cn, pose, refA, refB, prefix, set = '' }) {
  const [width, height] = sizeFor(state, set);
  const loraFile = SETS[set]?.lora || LORA;
  const g = {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    5: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    10: { class_type: 'LoraLoader', inputs: { model: ['4', 0], clip: ['4', 1], lora_name: loraFile, strength_model: lora, strength_clip: lora } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: promptFor(state, set), clip: ['10', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negativeFor(state, set), clip: ['10', 1] } },
    30: { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } },
    31: { class_type: 'LoadImage', inputs: { image: pose, upload: 'image' } },
    32: {
      class_type: 'ControlNetApplyAdvanced',
      inputs: { positive: ['6', 0], negative: ['7', 0], control_net: ['30', 0], image: ['31', 0], strength: cn, start_percent: 0, end_percent: 1, vae: ['4', 2] },
    },
    20: { class_type: 'LoadImage', inputs: { image: refA, upload: 'image' } },
    24: { class_type: 'LoadImage', inputs: { image: refB, upload: 'image' } },
    25: { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } },
    23: {
      class_type: 'IPAdapterAdvanced',
      inputs: {
        model: ['10', 0], ipadapter: ['21', 0], image: ['25', 0], weight: 0.3, weight_type: 'ease in',
        combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0],
      },
    },
    3: {
      class_type: 'KSampler',
      inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['23', 0], positive: ['32', 0], negative: ['32', 1], latent_image: ['5', 0] },
    },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  };
  return g;
}

async function queueEmpty() {
  try {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    return (q.queue_running?.length || 0) === 0 && (q.queue_pending?.length || 0) === 0;
  } catch {
    return false;
  }
}

export async function run(workflow, outPath) {
  let noted = 0;
  while (!(await queueEmpty())) {
    if (Date.now() - noted > 60_000) { console.error('[poses] queue busy; waiting'); noted = Date.now(); }
    await sleep(5000);
  }
  const t0 = Date.now();
  const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: workflow, client_id: 'pyrefly-leblanc-poses' }) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body)}`);
  const id = body.prompt_id;
  for (;;) {
    const e = (await (await fetch(`${COMFY}/history/${id}`)).json())[id];
    if (e?.status?.status_str === 'error') throw new Error(`failed: ${JSON.stringify(e.status.messages).slice(0, 2000)}`);
    const img = e && Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
    if (img) {
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      writeFileSync(outPath, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
      return (Date.now() - t0) / 1000;
    }
    await sleep(1000);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const state = argv[0];
  if (!STATES[state]) throw new Error('usage: render.mjs <attack|cast|hurt|ko> [--n 1,2] [--dry]');
  const ni = argv.indexOf('--n');
  const si = argv.indexOf('--set');
  const set = si >= 0 ? argv[si + 1] : '';
  const cands = SETS[set]?.candsBy?.[state] || SETS[set]?.cands || CANDS;
  const want = ni >= 0 ? argv[ni + 1].split(',').map(Number) : cands.map((c) => c.n);
  mkdirSync(OUT, { recursive: true });
  // v4 and earlier used skeletons/<state>.png as it stood then (v3's attack and hurt are in skeletons/v3/,
  // v4's attack in skeletons/v4/); a set with its own skeleton file uses it
  const own = join(HERE, 'skeletons', set, `${state}.png`);
  const skeleton = set && existsSync(own) ? own : join(HERE, 'skeletons', `${state}.png`);
  const pose = stageImage(skeleton);
  const refA = stageImage(join(REPO, REFS[0]));
  const refB = stageImage(join(REPO, REFS[1]));
  for (const c of cands.filter((x) => want.includes(x.n))) {
    const seed = SEED0[state] + (SETS[set]?.seedOffset || 0) + c.n;
    const tag = set ? `${state}.${set}.${c.n}` : `${state}.${c.n}`;
    const raw = join(OUT, `${tag}.raw.png`);
    const cut = join(OUT, `${tag}.png`);
    if (argv.includes('--dry')) { console.log(tag, seed, c, promptFor(state, set), '|', negativeFor(state, set)); continue; }
    if (existsSync(join(OUT, `${tag}.json`))) { console.log(`[poses] ${tag} exists; skip`); continue; }
    const g = graph({ state, seed, lora: c.lora, cn: c.cn, pose, refA, refB, prefix: `pyrefly/leblanc-poses/${state}`, set });
    const seconds = await run(g, raw);
    const maxRgb = maxRgbOfPng(readFileSync(raw));
    const black = maxRgb != null && isBlackFrame(maxRgb);
    const cutMeta = cutout(raw, cut);
    const [w, h] = sizeFor(state, set);
    const guard = await checkCutoutFile(cut, { sourceWidth: w, sourceHeight: h, composition: STATES[state].composition });
    const side = {
      tag, state, seed, lora: { file: SETS[set]?.lora || LORA, step: set === 'r2' ? R2_STEP : LORA_STEP, strength: c.lora }, controlnet: { file: CONTROLNET, strength: c.cn, start: 0, end: 1, skeleton: `docs/concepts/chapters/leblanc/lora/leblanc/poses/${skeleton.slice(HERE.length + 1).split('\\').join('/')}` },
      ipadapter: { file: IPADAPTER, weight: 0.3, type: 'ease in', start: 0.2, end: 0.6, scaling: 'K+V', combine: 'concat', images: REFS },
      positive: promptFor(state, set), negative: negativeFor(state, set), set: set || null, model: CKPT, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      width: w, height: h, composition: STATES[state].composition, facing: 'left', seconds, maxRgb, black, cutout: cutMeta,
      guard: { ok: guard.ok, reasons: guard.reasons }, generatedAt: new Date().toISOString(),
    };
    writeFileSync(join(OUT, `${tag}.json`), JSON.stringify(side, null, 1));
    console.log(`[poses] ${tag} seed ${seed} lora ${c.lora} cn ${c.cn}: ${seconds.toFixed(1)} s, ${cutMeta.width}x${cutMeta.height}, guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}${black ? ' BLACK' : ''}`);
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
