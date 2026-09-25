#!/usr/bin/env node
/**
 * Trema line-up battle-pose candidates (FFX-2 only, Chapter XIII; METHOD.md in this folder).
 *
 *   node docs/concepts/chapters/trema/poses/render.mjs <girl>/<pose>[,<girl>/<pose>...] [--n 1,2,3,4] [--dry]
 *   girls: yuna-dark-knight, paine-dark-knight, rikku-alchemist; poses: attack cast item hurt ko victory
 *
 * Graph: Animagine XL 4.0 Opt -> IPAdapterAdvanced (the idle square-padded on white + a square head
 * crop, batched, concat, 0.3, ease in, 0.2..0.6, K+V; forced on, no colour-spread guard) -> KSampler;
 * the prompts pass through ControlNetApplyAdvanced (xinsir OpenPose SDXL) with the pose's skeleton
 * from skeletons.py. Identity = each shipped idle's own sidecar words, effect words stripped;
 * body-only Danbooru pose tags. Candidates only, written outside the repo; nothing is installed.
 * Shared ComfyUI: never more than 3 prompts pending in the whole queue; never restarted. An
 * all-black frame stops the run (no re-roll) and writes STOP-BLACK.txt beside the candidates.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPRITE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, cutout } from '../../../../../tools/gen/comfy.mjs';
import { checkCutoutFile } from '../../../../../tools/gen/cutout-guard.mjs';
import { maxRgbOfPng, isBlackFrame } from '../../../../../tools/gen/black-frame.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu4/trema-poses';
const REFS = `${OUT}/refs`;
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const flag = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
/** Pilot 1 defaults (the pipeline's R2); arms override with --ipa / --ipaEnd / --ipaType (METHOD.md section 4). */
const IPA = { weight: Number(flag('ipa', 0.5)), type: flag('ipaType', 'ease in'), start: 0.2, end: Number(flag('ipaEnd', 0.8)), scaling: 'K+V' };
/** --arm <name> writes to <girl>/<pose>/<arm>/; --id v2 uses the idle-read identity (identity2). */
const ARM = flag('arm', '');
const ID = flag('id', 'v2');
/** Skeleton set in use (skeletons.py SCALE); pilots 1 and 2 used the unscaled 1.0 set. */
const VARIANT = flag('variant', '');
/** --swap 'from|to': one identity edit for an arm (r4: the helm weight). */
const SWAP = flag('swap', '');
const SKEL_NOTE = flag('skelNote', 'scale 0.8 (after pilot 2)');
const MAX_PENDING = 3;

/** Idle-sidecar identity, effect and pose words stripped (METHOD.md section 2). */
export const GIRLS = {
  'yuna-dark-knight': {
    kind: 'sword', seed0: 25100,
    identity: 'yuna \\(ff10-2\\), final fantasy x-2, brown hair, short hair, heterochromia, blue eye, green eye, dark knight, ' +
      'indigo armor, dark blue armor, breastplate, pauldrons, gauntlets, pink accents, teal accents, (crescent helmet:1.2), ' +
      'pink thigh covers, armored boots, holding greatsword',
    // v2, read off the idle picture itself (pilot 1: the sidecar words lost the helm, the sword and the skirt)
    identity2: 'yuna \\(ff10-2\\), final fantasy x-2, brown hair, short hair, heterochromia, blue eye, green eye, dark knight, ' +
      '(teal helmet:1.2), blue crest, pink hair flower, white capelet, blue pauldrons, blue bustier, gold sash, blue pleated skirt, ' +
      'black gauntlets, white cape, pink thighhighs, blue armored boots, (dark blue greatsword:1.2), gold engraving, red sword grip',
    neg: 'horned helmet, horns, black armor, blonde hair, long hair, wings, feathers, scythe, axe, pink sword, huge ribbons, dual wielding, two weapons, spear, polearm, staff, second sword',
    victoryFace: 'light smile',
  },
  'paine-dark-knight': {
    kind: 'sword', seed0: 25200,
    identity: 'paine \\(ff10-2\\), final fantasy x-2, dark knight, silver hair, white hair, short hair, red eyes, pale skin, ' +
      'black armor, heavy armor, black plate armor, red trim, pauldrons, gauntlets, armored boots, breastplate, ' +
      'holding greatsword, huge sword',
    identity2: 'paine \\(ff10-2\\), final fantasy x-2, dark knight, silver hair, (swept back hair:1.1), short hair, red eyes, pale skin, ' +
      'black plate armor, full armor, red trim, red high collar, black gauntlets, red sash, red cape, black armored boots, ' +
      '(huge greatsword:1.2), silver blade edge, copper engraved blade, winged crossguard, red sword grip',
    neg: 'helmet, horns, horned helmet, blonde hair, brown hair, bare legs, revealing clothes, full face helmet, mask, wings, skirt, spiked hair, messy hair, silver armor, dual wielding, two weapons, spear, scythe, polearm, staff, second sword',
    victoryFace: 'smirk',
  },
  'rikku-alchemist': {
    kind: 'flask', seed0: 25300,
    identity: 'rikku \\(ff10-2\\), final fantasy x-2, blonde hair, long hair, braid, hair bun, green eyes, blue bandana, ' +
      'alchemist, green and white outfit, orange scarf, green skirt, apron, goggles on head, potion bottles, pouches, ' +
      'brown gloves, bare midriff',
    identity2: 'rikku \\(ff10-2\\), final fantasy x-2, blonde hair, messy hair, braids, green eyes, blue bandana, red scarf, ' +
      'yellow crop top, orange suspenders, white detached sleeves, orange gloves, bare midriff, green pleated skirt, ' +
      'brown belt pouches, orange leggings, long orange and yellow fabric strips, blue boots, green boot cuffs, holding potion flask, purple potion',
    neg: 'brown hair, short hair, black clothes, flames, fire',
    victoryFace: 'grin',
  },
};

const HURT_NEG = 'smile, smirk, grin, happy, laughing';
/** Body-only pose tags per weapon kind (no effect words; METHOD.md). */
export const POSES = {
  sword: {
    attack: { tags: 'fighting stance, (lunging:1.2), leaning forward, legs apart, bent knees, (two-handed:1.2), holding greatsword with both hands, sword pointing forward, serious, v-shaped eyebrows, closed mouth',
      neg: 'planted sword, sword on ground, leaning on sword, standing straight, sword behind back, smile' },
    cast: { tags: 'standing, (arm up:1.2), raised hand, open hand, holding greatsword in one hand, sword pointing down, looking up, serious, closed mouth',
      neg: 'two-handed, sword raised, smile' },
    item: { tags: 'standing, holding bottle, potion bottle, arm extended forward, holding greatsword in one hand, sword pointing down, looking at object, closed mouth',
      neg: 'two-handed, drinking, sword raised' },
    // second tries (--variant 2), after r2 gave Paine two weapons in every cast and item frame
    cast_v2: { tags: 'standing, (arm up:1.2), raised hand, open hand, empty hand, (single weapon:1.2), one hand holding sword, sword pointing down, looking up, serious, closed mouth',
      neg: 'two-handed, sword raised, smile, holding two weapons, oversized sword, giant sword',
      idSwap: [['(dark blue greatsword:1.2)', 'dark blue sword'], ['(huge greatsword:1.2)', 'greatsword'], ['huge sword', 'sword']] },
    item_v2: { tags: 'standing, (holding potion bottle:1.2), small bottle, arm extended forward, (single weapon:1.2), one hand holding sword, sword pointing down, looking at object, closed mouth',
      neg: 'two-handed, drinking, sword raised, holding two weapons, oversized sword, giant sword',
      idSwap: [['(dark blue greatsword:1.2)', 'dark blue sword'], ['(huge greatsword:1.2)', 'greatsword'], ['huge sword', 'sword']] },
    hurt: { tags: '(leaning back:1.2), off balance, head back, (wincing:1.2), one eye closed, clenched teeth, v-shaped eyebrows, hand on own chest, holding greatsword, sword lowered',
      neg: HURT_NEG },
    // hurt, second try (--pose hurt2 is not a slot; selected with --variant 2): r2's hurt drew the sword as a
    // pillar that filled the frame and one split it in two, so the sword is named small and at her side and the
    // weighted greatsword word leaves the identity for this pose only.
    hurt_v2: { tags: '(leaning back:1.2), stumbling backward, off balance, head back, (wincing:1.2), one eye closed, clenched teeth, v-shaped eyebrows, hand on own chest, one hand holding sword, sword pointing down, sword at side',
      neg: `${HURT_NEG}, oversized sword, giant sword, sword behind back, two swords, broken sword, close-up, upper body, cowboy shot`,
      idSwap: [['(dark blue greatsword:1.2)', 'dark blue sword'], ['(huge greatsword:1.2)', 'greatsword'], ['huge sword', 'sword']] },
    victory: { tags: 'standing, (sword over shoulder:1.2), holding greatsword, hand on own hip, confident, {face}',
      neg: 'sword raised, two-handed, sword on ground' },
    ko: { tags: 'lying, on side, on ground, full body, from side, head to the right, feet to the left, (closed eyes:1.3), unconscious, expressionless, closed mouth, sword on ground',
      neg: 'sitting, standing, open eyes, looking at viewer, lying on back, smile, wink, sleeping, pillow' },
  },
  flask: {
    attack: { tags: '(throwing:1.2), arm extended forward, holding flask, (lunging:1.1), leaning forward, legs apart, bent knees, determined, open mouth',
      neg: 'standing straight, hand on hip, drinking' },
    cast: { tags: 'standing, (arm up:1.2), holding flask above head, hand on own hip, looking up, smile',
      neg: 'drinking, two flasks' },
    item: { tags: 'standing, holding flask, arm extended forward, hand on own hip, smile, looking at viewer',
      neg: 'drinking, arm up' },
    hurt: { tags: '(leaning back:1.2), off balance, head back, (wincing:1.2), one eye closed, clenched teeth, v-shaped eyebrows, hands on own chest',
      neg: HURT_NEG },
    victory: { tags: '(arms up:1.2), clenched hands, cheering, standing, legs apart, {face}, open mouth',
      neg: 'jumping, midair, holding flask' },
    ko: { tags: 'lying, on side, on ground, full body, from side, head to the right, feet to the left, (closed eyes:1.3), unconscious, expressionless, closed mouth',
      neg: 'sitting, standing, open eyes, looking at viewer, lying on back, smile, wink, sleeping, pillow' },
  },
};

const COMMON_NEG = `${SPRITE_NEGATIVE}, multiple views, 2girls, chibi, sketch, monochrome, 3d, realistic, cropped, ` +
  'magic circle, glowing weapon, glowing sword, fire, flames, fire trail, swirl, lightning, dark aura, splash, extra sword, two swords, multiple swords, floating sword';
const FACING_NEG = 'from behind, facing away';

/** Four candidates per slot: OpenPose strength spread (the Chapter VI lesson: 0.6..0.7 words can win, 0.75..0.9 holds). */
export const CANDS = [{ n: 1, cn: 0.65 }, { n: 2, cn: 0.75 }, { n: 3, cn: 0.85 }, { n: 4, cn: 0.75 },
  { n: 5, cn: 0.7 }, { n: 6, cn: 0.8 }, { n: 7, cn: 0.75 }, { n: 8, cn: 0.85 }];
const SEED_OFF = { attack: 0, cast: 10, item: 20, hurt: 30, ko: 40, victory: 50 };

export function sizeFor(girl, pose) {
  if (pose === 'ko') return [1216, 832];
  if (pose === 'attack' && GIRLS[girl].kind === 'sword') return [1024, 1216];
  return [832, 1216];
}
export function promptFor(girl, pose) {
  const g = GIRLS[girl]; const p = (VARIANT && POSES[g.kind][`${pose}_v${VARIANT}`]) || POSES[g.kind][pose];
  const tags = p.tags.replace('{face}', g.victoryFace);
  let identity = (ID === 'v2' && g.identity2) || g.identity;
  for (const [a, b] of p.idSwap || []) identity = identity.replace(a, b);
  if (SWAP) identity = identity.replace(SWAP.split('|')[0], SWAP.split('|')[1]);
  const view = pose === 'ko' ? '' : 'three-quarter view, looking at viewer, full body, feet visible, ';
  return `1girl, solo, ${tags}, ${identity}, ${view}simple background, white background, ${STYLE_TAGS}, ${QUALITY_TAGS}`;
}
export function negativeFor(girl, pose) {
  const g = GIRLS[girl]; const p = (VARIANT && POSES[g.kind][`${pose}_v${VARIANT}`]) || POSES[g.kind][pose];
  return `${COMMON_NEG}, ${pose === 'ko' ? '' : `${FACING_NEG}, `}${p.neg}, ${g.neg}`;
}

function graph({ girl, pose, seed, cn, skel, refA, refB, prefix }) {
  const [width, height] = sizeFor(girl, pose);
  return {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    5: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: promptFor(girl, pose), clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negativeFor(girl, pose), clip: ['4', 1] } },
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
  try {
    const q = await (await fetch(`${COMFY}/queue`)).json();
    return (q.queue_pending?.length || 0);
  } catch { return 99; }
}

async function main() {
  const argv = process.argv.slice(2);
  const slots = (argv[0] || '').split(',').filter(Boolean);
  const ni = argv.indexOf('--n');
  const want = ni >= 0 ? argv[ni + 1].split(',').map(Number) : [1, 2, 3, 4];
  const jobs = [];
  for (const slot of slots) {
    const [girl, pose] = slot.split('/');
    if (!GIRLS[girl] || !POSES[GIRLS[girl].kind][pose]) throw new Error(`bad slot ${slot}`);
    for (const c of CANDS.filter((x) => want.includes(x.n))) {
      const dir = join(OUT, girl, pose, ARM);
      if (existsSync(join(dir, `cand-${c.n}.json`))) continue;
      jobs.push({ girl, pose, n: c.n, cn: c.cn, dir, seed: GIRLS[girl].seed0 + SEED_OFF[pose] + c.n });
    }
  }
  if (argv.includes('--dry')) {
    for (const j of jobs) console.log(j.girl, j.pose, j.n, j.seed, j.cn, '\n+', promptFor(j.girl, j.pose), '\n-', negativeFor(j.girl, j.pose));
    return;
  }
  const inflight = [];
  let stop = false;
  while ((jobs.length || inflight.length) && !stop) {
    while (jobs.length && inflight.length < MAX_PENDING && (await pending()) < MAX_PENDING) {
      const j = jobs.shift();
      mkdirSync(j.dir, { recursive: true });
      const kind = GIRLS[j.girl].kind;
      const skel = stageImage(join(HERE, 'skeletons', kind, `${j.pose}.png`));
      const refA = stageImage(`${REFS}/${j.girl}-idle-square.png`);
      const refB = stageImage(`${REFS}/${j.girl}-head.png`);
      const g = graph({ ...j, skel, refA, refB, prefix: `pyrefly/trema-poses/${j.girl}-${j.pose}` });
      const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: g, client_id: 'pyrefly-trema-poses' }) });
      const body = await res.json();
      if (!res.ok || body.error) throw new Error(`ComfyUI rejected: ${JSON.stringify(body).slice(0, 1500)}`);
      inflight.push({ ...j, id: body.prompt_id, t0: Date.now() });
    }
    await sleep(2000);
    for (const j of [...inflight]) {
      const e = (await (await fetch(`${COMFY}/history/${j.id}`)).json())[j.id];
      if (!e) continue;
      if (e.status?.status_str === 'error') { console.error(`[trema-poses] ${j.girl}/${j.pose}#${j.n} FAILED ${JSON.stringify(e.status.messages).slice(0, 800)}`); inflight.splice(inflight.indexOf(j), 1); continue; }
      const img = Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
      if (!img) continue;
      inflight.splice(inflight.indexOf(j), 1);
      const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
      const raw = join(j.dir, `cand-${j.n}.raw.png`);
      const cut = join(j.dir, `cand-${j.n}.png`);
      writeFileSync(raw, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
      const maxRgb = maxRgbOfPng(readFileSync(raw));
      const black = maxRgb != null && isBlackFrame(maxRgb);
      if (black) {
        writeFileSync(join(OUT, 'STOP-BLACK.txt'), `${new Date().toISOString()} ${j.girl}/${j.pose}#${j.n} all-black frame (maxRgb ${maxRgb}); run stopped, no re-roll\n`, { flag: 'a' });
        console.error(`[trema-poses] BLACK FRAME ${j.girl}/${j.pose}#${j.n}: stopping`);
        stop = true;
      }
      const [w, h] = sizeFor(j.girl, j.pose);
      let cutMeta = null; let guard = { ok: false, reasons: ['black frame'] };
      if (!black) {
        cutMeta = cutout(raw, cut);
        guard = await checkCutoutFile(cut, { sourceWidth: w, sourceHeight: h, composition: j.pose === 'ko' ? 'prone' : 'full' });
      }
      const side = {
        game: 'ffx2', subject: j.girl, state: j.pose, candidate: j.n, seed: j.seed, status: 'CANDIDATE', arm: ARM || null, identitySet: ID, skeletonSet: SKEL_NOTE, variant: VARIANT || null, swap: SWAP || null,
        controlnet: { file: CONTROLNET, strength: j.cn, start: 0, end: 1, skeleton: `docs/concepts/chapters/trema/poses/skeletons/${GIRLS[j.girl].kind}/${j.pose}.png` },
        ipadapter: { file: IPADAPTER, ...IPA, combine: 'concat', images: [`${j.girl}-idle-square.png`, `${j.girl}-head.png`], forced: true },
        positive: promptFor(j.girl, j.pose), negative: negativeFor(j.girl, j.pose), model: CKPT, steps: 28, cfg: 6,
        sampler: 'euler_ancestral', scheduler: 'normal', width: w, height: h, composition: j.pose === 'ko' ? 'prone' : 'full',
        facing: 'right', maxRgb, black, cutout: cutMeta, guard: { ok: guard.ok, reasons: guard.reasons },
        seconds: (Date.now() - j.t0) / 1000, generatedAt: new Date().toISOString(),
      };
      if (cutMeta) Object.assign(side, { width: cutMeta.width, height: cutMeta.height, baselineY: cutMeta.baselineY });
      writeFileSync(join(j.dir, `cand-${j.n}.json`), JSON.stringify(side, null, 1));
      console.log(`[trema-poses] ${j.girl}/${j.pose}#${j.n} seed ${j.seed} cn ${j.cn}: ${cutMeta ? `${cutMeta.width}x${cutMeta.height}` : '-'} guard ${guard.ok ? 'ok' : 'REJECT ' + guard.reasons.join('; ')}${black ? ' BLACK' : ''}`);
    }
  }
  if (stop) process.exit(3);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
