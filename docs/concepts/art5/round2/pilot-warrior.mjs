#!/usr/bin/env node
/**
 * Paine Warrior sword pilot (FFX-2 only, 2026-09-26). METHOD-CHECK.md problem A: the greatsword
 * floats, doubles, stands unheld or sits in the wrong hand in every round 2 candidate, because
 * nothing in the recipe places it (the OpenPose skeleton has no sword and no hand keypoints), the
 * IP-Adapter reference carries the idle's floor-to-chest vertical sword, and the word "sword" sits
 * in the positive and ~17 times in the negative of the same prompt.
 *
 * The method piloted here takes the sword away from the model entirely:
 *   1. prep : cut the idle's OWN sword out of public/art/characters/paine-warrior/idle.png (read
 *             only) and build a sword-free copy of the IP-Adapter reference square.
 *   2. body : render the pose with no sword anywhere (sword-free reference, every sword word in the
 *             negative, a clenched fist where the grip goes). Same model, OpenPose, IP-Adapter.
 *   3. comp : paste the idle's sword into the fist at a chosen angle (a 2D rotate + scale; the grip
 *             is stretched for a two-handed hold), then lay a disc of the body's own hand pixels
 *             back over the grip so the fingers sit in front of it. No GPU.
 *   4. grip : one masked img2img pass (SetLatentNoiseMask) on the hand/grip disc only, so the
 *             fingers wrap the hilt; the blade outside the mask is never repainted.
 *
 *   node docs/concepts/art5/round2/pilot-warrior.mjs prep
 *   node docs/concepts/art5/round2/pilot-warrior.mjs body <pose> <n> [<n>...]
 *   node docs/concepts/art5/round2/pilot-warrior.mjs comp <pose> <n> <hx,hy[;hx2,hy2]> <deg> [scale] [handR]
 *   node docs/concepts/art5/round2/pilot-warrior.mjs grip <pose> <n> [denoise]
 *
 * <deg> is the grip-to-tip direction on screen (0 = right, 90 = down). Hands are raw-canvas pixels
 * read off the body render by looking at it. Shared ComfyUI: submits only while fewer than 3
 * prompts are pending; never restarts it; an all-black frame writes STOP-BLACK.txt and stops.
 * Candidates only, outside the repo; nothing is installed into public/art.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { SPRITE_NEGATIVE, STYLE_TAGS, QUALITY_TAGS, stageImage, cutout } from '../../../../tools/gen/comfy.mjs';
import { checkCutoutFile } from '../../../../tools/gen/cutout-guard.mjs';
import { maxRgbOfPng, isBlackFrame } from '../../../../tools/gen/black-frame.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..', '..');
export const OUT = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-26-method/paine-warrior';
const PY = join(process.env.COMFY_ROOT || 'D:/Tools/ComfyUI', 'python_embeded', 'python.exe');
const COMFY = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const IDLE = join(REPO, 'public/art/characters/paine-warrior/idle.png');
const REFS = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-gpu5/refs';
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const CONTROLNET = 'xinsir-controlnet-openpose-sdxl-1.0.safetensors';
const IPADAPTER = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPVISION = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const IPA = { weight: 0.5, type: 'ease in', start: 0.2, end: 0.8, scaling: 'K+V' };
const CN = 0.85;
const MAX_PENDING = 3;
const SEED0 = 35600 + 1000;           // girls2.json seed0 for paine-warrior, moved off round 2's seeds
const SEED_OFF = { attack: 0, cast: 10, item: 20, hurt: 30, ko: 40 };

// The idle's sword, in idle.png pixels (measured 2026-09-26 on a gridded crop): the plain red grip
// under her glove, the winged crossguard, the spiked ricasso, the blade to its tip. The glove above
// y 376 and the boot's dark pixels at the tip are left out.
const SWORD_POLY = [[300, 376], [328, 376], [328, 440], [398, 440], [398, 508], [334, 508], [334, 645], [328, 645],
  [320, 1000], [310, 1172], [278, 1172], [280, 1000], [282, 645], [282, 508], [260, 508], [260, 440], [300, 440]];
const GRIP = [314, 405]; const GRIP_TOP = 376; const GRIP_END = 440; const TIP = [293, 1110];
const SQUARE_OFFSET = [404, 18];      // where the idle sits in paine-warrior-idle-square.png

// Paine Warrior identity (girls2.json) with the sword words taken OUT for the body pass.
const IDENTITY = 'paine \\(ff10-2\\), final fantasy x-2, silver hair, short hair, (swept back hair:1.3), (spiked hair crest:1.2), ' +
  'red eyes, pale skin, black choker, (black leather jacket:1.2), cropped jacket, off shoulder, white corset, black elbow gloves, ' +
  'red belt, skull belt buckle, black leather shorts, (black thigh boots:1.3), red boot straps';
const GIRL_NEG = 'helmet, armor, cape, shoulder cape, blonde hair, brown hair, skirt, long hair, messy hair, bob cut, wings, ' +
  'red boots, red footwear, red jacket, blue jacket';
const NO_WEAPON_NEG = 'sword, weapon, holding weapon, blade, katana, dagger, knife, staff, spear, polearm, scythe, axe, gun, ' +
  'sheath, scabbard, stick, pole';
const BODY = {
  cast: { size: [832, 1216], skel: 'cast',
    tags: 'standing, (arm up:1.2), raised hand, open hand, open palm, (other arm lowered at her side:1.1), (clenched fist:1.2), looking up, serious, closed mouth',
    neg: 'smile, two-handed' },
  attack: { size: [1024, 1216], skel: 'attack',
    tags: 'fighting stance, (lunging:1.2), leaning forward, legs apart, bent knees, (both arms extended forward:1.2), (clenched fists:1.2), hands together, serious, v-shaped eyebrows, closed mouth',
    neg: 'standing straight, smile, open hand' },
};
const COMMON_NEG = `${SPRITE_NEGATIVE}, multiple views, 2girls, chibi, sketch, monochrome, 3d, realistic, cropped, ` +
  'magic circle, fire, flames, swirl, lightning, dark aura, splash, cast shadow, drop shadow, pedestal, platform, rock, from behind, facing away';

const log = (s) => { const l = `${new Date().toISOString()} ${s}`; console.log(l); appendFileSync(join(OUT, 'pilot.log'), l + '\n'); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function py(code, ...args) {
  const r = spawnSync(PY, ['-s', '-c', code, ...args.map(String)], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(`python failed: ${r.stderr || r.stdout}`);
  return r.stdout.trim();
}

// ---------------------------------------------------------------- 1. prep (no GPU)
const PREP_PY = `
import sys, json, numpy as np
from PIL import Image, ImageDraw
idle, out, poly, grip, gtop, gend, tip, off = sys.argv[1], sys.argv[2], json.loads(sys.argv[3]), json.loads(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]), json.loads(sys.argv[7]), json.loads(sys.argv[8])
im = Image.open(idle).convert('RGBA'); W, H = im.size
m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon([tuple(p) for p in poly], fill=255)
a = np.array(im).astype(int); yy, xx = np.mgrid[0:H, 0:W]
dark = a[..., :3].max(-1) < 70
keep = (np.array(m) > 0) & (a[..., 3] > 0) & ~(dark & (yy > 1040) & (xx < 300)) & ~(dark & (xx < 272))
# a clean point: fade the last 60 px of blade to a taper instead of the ragged cut at the boot
t0 = tip[1] - 60
for y in range(t0, H):
    half = max(0.0, 16 * (tip[1] + 8 - y) / 68)
    cx = tip[0] + 4
    keep[y] &= (np.abs(xx[y] - cx) <= half)
# keep only the sword's own connected body: stray flecks (belt, glove edge, gaps) become noise when rotated
from scipy import ndimage
lab, nl = ndimage.label(keep & (a[..., 3] > 40))
if nl > 1:
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, nl + 1)); main = 1 + int(np.argmax(sizes))
    keep &= ndimage.binary_dilation(lab == main, iterations=2)
s = a.copy(); s[..., 3] = np.where(keep, a[..., 3], 0)
sw = Image.fromarray(s.astype('uint8'), 'RGBA'); bb = sw.getbbox(); sw = sw.crop(bb)
sw.save(out + '/sword.png')
# two-handed variant: the plain grip stretched to 2x so two fists fit between pommel and guard
g0, g1 = gtop - bb[1], gend - bb[1]
top = sw.crop((0, g0, sw.width, g1)).resize((sw.width, 2 * (g1 - g0)), Image.BICUBIC)
sw2 = Image.new('RGBA', (sw.width, sw.height + (g1 - g0)), (0, 0, 0, 0))
sw2.paste(sw.crop((0, 0, sw.width, g0)), (0, 0)); sw2.paste(top, (0, g0)); sw2.paste(sw.crop((0, g1, sw.width, sw.height)), (0, g0 + 2 * (g1 - g0)))
sw2.save(out + '/sword-2h.png')
meta = {'bbox': bb, 'grip': [grip[0] - bb[0], grip[1] - bb[1]], 'tip': [tip[0] - bb[0], tip[1] - bb[1]],
        'grip2h': [grip[0] - bb[0], g1], 'tip2h': [tip[0] - bb[0], tip[1] - bb[1] + (g1 - g0)]}
json.dump(meta, open(out + '/sword.json', 'w'), indent=1)
# the IP-Adapter reference square with the sword taken out (white where it was)
nos = a.copy(); nos[..., 3] = np.where(keep, 0, a[..., 3])
sq = Image.new('RGB', (1216, 1216), (255, 255, 255)); fig = Image.fromarray(nos.astype('uint8'), 'RGBA')
sq.paste(fig, tuple(off), fig); sq.save(out + '/refs/paine-warrior-idle-nosword-square.png')
print(json.dumps(meta))
`;
function prep() {
  mkdirSync(join(OUT, 'refs'), { recursive: true });
  log(`prep: ${py(PREP_PY, IDLE, OUT, JSON.stringify(SWORD_POLY), JSON.stringify(GRIP), GRIP_TOP, GRIP_END, JSON.stringify(TIP), JSON.stringify(SQUARE_OFFSET))}`);
}

// ---------------------------------------------------------------- 2. body + 4. grip (GPU)
function bodyGraph({ b, seed, skel, refA, refB, prefix }) {
  const [width, height] = b.size;
  const positive = `1girl, solo, ${b.tags}, ${IDENTITY}, three-quarter view, looking at viewer, full body, feet visible, simple background, white background, ${STYLE_TAGS}, ${QUALITY_TAGS}`;
  const negative = `${COMMON_NEG}, ${NO_WEAPON_NEG}, ${b.neg}, ${GIRL_NEG}`;
  return { positive, negative, g: {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    5: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['4', 1] } },
    30: { class_type: 'ControlNetLoader', inputs: { control_net_name: CONTROLNET } },
    31: { class_type: 'LoadImage', inputs: { image: skel, upload: 'image' } },
    32: { class_type: 'ControlNetApplyAdvanced', inputs: { positive: ['6', 0], negative: ['7', 0], control_net: ['30', 0], image: ['31', 0], strength: CN, start_percent: 0, end_percent: 1, vae: ['4', 2] } },
    20: { class_type: 'LoadImage', inputs: { image: refA, upload: 'image' } },
    24: { class_type: 'LoadImage', inputs: { image: refB, upload: 'image' } },
    25: { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } },
    21: { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPADAPTER } },
    22: { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPVISION } },
    23: { class_type: 'IPAdapterAdvanced', inputs: { model: ['4', 0], ipadapter: ['21', 0], image: ['25', 0], weight: IPA.weight, weight_type: IPA.type, combine_embeds: 'concat', start_at: IPA.start, end_at: IPA.end, embeds_scaling: IPA.scaling, clip_vision: ['22', 0] } },
    3: { class_type: 'KSampler', inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: 1, model: ['23', 0], positive: ['32', 0], negative: ['32', 1], latent_image: ['5', 0] } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  } };
}

function gripGraph({ seed, image, mask, denoise, prefix }) {
  const positive = `1girl, solo, ${IDENTITY}, (hand gripping sword hilt:1.2), fingers wrapped around the grip, black glove, holding sword, ornate red longsword, simple background, white background, ${STYLE_TAGS}, ${QUALITY_TAGS}`;
  const negative = `${COMMON_NEG}, extra fingers, missing fingers, open hand, floating sword, second sword, extra sword, extra hand, ${GIRL_NEG}`;
  return { positive, negative, g: {
    4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['4', 1] } },
    7: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['4', 1] } },
    40: { class_type: 'LoadImage', inputs: { image, upload: 'image' } },
    41: { class_type: 'VAEEncode', inputs: { pixels: ['40', 0], vae: ['4', 2] } },
    42: { class_type: 'LoadImage', inputs: { image: mask, upload: 'image' } },
    43: { class_type: 'ImageToMask', inputs: { image: ['42', 0], channel: 'red' } },
    44: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['41', 0], mask: ['43', 0] } },
    3: { class_type: 'KSampler', inputs: { seed, steps: 28, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise, model: ['4', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['44', 0] } },
    8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
    9: { class_type: 'SaveImage', inputs: { filename_prefix: prefix, images: ['8', 0] } },
  } };
}

async function pending() {
  try { const q = await (await fetch(`${COMFY}/queue`)).json(); return (q.queue_pending?.length || 0); } catch { return 99; }
}

/** Submit one graph, wait for it, save the raw PNG, black-check, cut out, guard. */
async function run(g, rawPath, cutPath, size, tag) {
  if (existsSync(join(OUT, 'STOP-BLACK.txt'))) throw new Error('STOP-BLACK.txt present: no more submits');
  while ((await pending()) >= MAX_PENDING) await sleep(5000);
  const res = await fetch(`${COMFY}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: g, client_id: 'pyrefly-pilot-warrior' }) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`ComfyUI rejected ${tag}: ${JSON.stringify(body).slice(0, 800)}`);
  const t0 = Date.now();
  for (;;) {
    await sleep(4000);
    const e = (await (await fetch(`${COMFY}/history/${body.prompt_id}`)).json())[body.prompt_id];
    if (!e) continue;
    if (e.status?.status_str === 'error') throw new Error(`${tag} failed: ${JSON.stringify(e.status.messages).slice(0, 600)}`);
    const img = Object.values(e.outputs || {}).flatMap((o) => o.images || [])[0];
    if (!img) continue;
    const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
    writeFileSync(rawPath, Buffer.from(await (await fetch(`${COMFY}/view?${q}`)).arrayBuffer()));
    break;
  }
  const maxRgb = maxRgbOfPng(readFileSync(rawPath));
  if (maxRgb != null && isBlackFrame(maxRgb)) {
    writeFileSync(join(OUT, 'STOP-BLACK.txt'), `${new Date().toISOString()} ${tag} all-black frame (maxRgb ${maxRgb}); pilot stopped, ComfyUI not restarted\n`, { flag: 'a' });
    throw new Error(`BLACK FRAME on ${tag}: stopped`);
  }
  return { ...(await guardOf(rawPath, cutPath, size)), maxRgb, seconds: (Date.now() - t0) / 1000 };
}

async function guardOf(rawPath, cutPath, [w, h]) {
  const cut = cutout(rawPath, cutPath);
  let guard = await checkCutoutFile(cutPath, { sourceWidth: w, sourceHeight: h, composition: 'full' });
  const cb = cut.contentBox;
  if (cb && (cb[0] <= 3 || cb[1] <= 3 || cb[2] >= w - 4 || cb[3] >= h - 4)) {
    guard = { ok: false, reasons: [...(guard.reasons || []), `content touches the canvas edge (${cb.join(',')})`] };
  }
  return { cutout: cut, guard: { ok: guard.ok, reasons: guard.reasons } };
}

const dirOf = (pose) => { const d = join(OUT, pose); mkdirSync(d, { recursive: true }); return d; };
const side = (pose, n, x) => { const f = join(dirOf(pose), `body-${n}.json`); const o = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}; if (x) writeFileSync(f, JSON.stringify({ ...o, ...x }, null, 1)); return { ...o, ...x }; };

async function body(pose, ns) {
  const b = BODY[pose]; if (!b) throw new Error(`pilot poses: ${Object.keys(BODY).join(', ')}`);
  const skelPath = join(HERE, 'skeletons', 'paine-warrior', `${b.skel}.png`);
  const refA = stageImage(join(OUT, 'refs', 'paine-warrior-idle-nosword-square.png'));
  const refB = stageImage(`${REFS}/paine-warrior-head.png`);
  for (const n of ns) {
    const seed = SEED0 + SEED_OFF[pose] + Number(n);
    const { g, positive, negative } = bodyGraph({ b, seed, skel: stageImage(skelPath), refA, refB, prefix: `pyrefly/method/paine-warrior-${pose}` });
    const d = dirOf(pose);
    const r = await run(g, join(d, `body-${n}.raw.png`), join(d, `body-${n}.png`), b.size, `${pose}#${n}`);
    side(pose, n, { game: 'ffx2', subject: 'paine-warrior', state: pose, step: 'body (no sword)', seed, status: 'PILOT', positive, negative,
      controlnet: { file: CONTROLNET, strength: CN, skeleton: `docs/concepts/art5/round2/skeletons/paine-warrior/${b.skel}.png` },
      ipadapter: { file: IPADAPTER, ...IPA, images: ['paine-warrior-idle-nosword-square.png (pilot prep)', 'paine-warrior-head.png'] },
      model: CKPT, steps: 28, cfg: 6, width: b.size[0], height: b.size[1], ...r, generatedAt: new Date().toISOString() });
    log(`body ${pose}#${n} seed ${seed}: guard ${r.guard.ok ? 'ok' : 'REJECT ' + r.guard.reasons.join('; ')} (${r.seconds}s)`);
  }
}

// ---------------------------------------------------------------- 3. comp (no GPU)
const COMP_PY = `
import sys, json, math, numpy as np
from PIL import Image, ImageDraw, ImageFilter
out, raw, cut, cbox, hands, deg, scale, hr, mode = sys.argv[1], sys.argv[2], sys.argv[3], json.loads(sys.argv[4]), json.loads(sys.argv[5]), float(sys.argv[6]), float(sys.argv[7]), int(sys.argv[8]), sys.argv[9]
meta = json.load(open(sys.argv[10]))
two = len(hands) == 2
sw = Image.open(sys.argv[11] + ('/sword-2h.png' if two else '/sword.png')).convert('RGBA')
G = meta['grip2h' if two else 'grip']; T = meta['tip2h' if two else 'tip']
W, H = Image.open(raw).size
bodyL = Image.new('RGBA', (W, H), (0, 0, 0, 0)); bodyL.paste(Image.open(cut).convert('RGBA'), (cbox[0], cbox[1]))
P = [sum(h[0] for h in hands) / len(hands), sum(h[1] for h in hands) / len(hands)]
cur = math.atan2(T[1] - G[1], T[0] - G[0]); th = math.radians(deg); d = th - cur
c, s = math.cos(d), math.sin(d)
A = (c / scale, s / scale, 0, -s / scale, c / scale, 0)
A = (A[0], A[1], G[0] - (A[0] * P[0] + A[1] * P[1]), A[3], A[4], G[1] - (A[3] * P[0] + A[4] * P[1]))
swL = sw.transform((W, H), Image.AFFINE, A, resample=Image.BICUBIC)
comp = Image.new('RGBA', (W, H), (255, 255, 255, 255)); comp.alpha_composite(bodyL); comp.alpha_composite(swL)
# the fingers go back over the grip: a feathered disc of the body's own pixels at each hand
disc = Image.new('L', (W, H), 0); dd = ImageDraw.Draw(disc)
for h in hands: dd.ellipse([h[0] - hr, h[1] - hr, h[0] + hr, h[1] + hr], fill=255)
disc = disc.filter(ImageFilter.GaussianBlur(2))
ba = np.array(bodyL).astype(float); hand = ba.copy(); hand[..., 3] = ba[..., 3] * np.array(disc) / 255.0
comp.alpha_composite(Image.fromarray(hand.astype('uint8'), 'RGBA'))
comp.convert('RGB').save(out + '-comp.png')
# the grip-pass mask: a disc 1.9x the hand radius around each hand (white = repaint)
mk = Image.new('RGB', (W, H), (0, 0, 0)); md = ImageDraw.Draw(mk)
R = int(hr * 1.9)
for h in hands: md.ellipse([h[0] - R, h[1] - R, h[0] + R, h[1] + R], fill=(255, 255, 255))
mk.filter(ImageFilter.GaussianBlur(6)).save(out + '-mask.png')
L = scale * math.dist(G, T); tip = (P[0] + math.cos(th) * L, P[1] + math.sin(th) * L)
print(json.dumps({'grip': P, 'tip': [round(tip[0]), round(tip[1])], 'deg': deg, 'scale': scale, 'handR': hr, 'maskR': R, 'twoHanded': two}))
`;
async function comp(pose, n, handsArg, deg, scale = 0.67, hr = 22) {
  const d = dirOf(pose); const s = side(pose, n);
  if (!s.cutout) throw new Error(`no body-${n} for ${pose}`);
  const hands = handsArg.split(';').map((p) => p.split(',').map(Number));
  const stem = join(d, `cand-${n}`);
  const info = JSON.parse(py(COMP_PY, stem, join(d, `body-${n}.raw.png`), join(d, `body-${n}.png`), JSON.stringify(s.cutout.cropBox),
    JSON.stringify(hands), deg, scale, hr, 'comp', join(OUT, 'sword.json'), OUT));
  const size = [s.width, s.height];
  const r = await guardOf(`${stem}-comp.png`, `${stem}-comp.cut.png`, size);
  side(pose, n, { comp: { ...info, source: 'the idle\'s own sword, cut from public/art/characters/paine-warrior/idle.png (read only)', ...r } });
  log(`comp ${pose}#${n} ${JSON.stringify(info)}: guard ${r.guard.ok ? 'ok' : 'REJECT ' + r.guard.reasons.join('; ')}`);
}

async function grip(pose, n, denoise = 0.5) {
  const d = dirOf(pose); const s = side(pose, n);
  if (!s.comp) throw new Error(`run comp ${pose} ${n} first`);
  const stem = join(d, `cand-${n}`);
  const seed = SEED0 + SEED_OFF[pose] + 500 + Number(n);
  const { g, positive, negative } = gripGraph({ seed, image: stageImage(`${stem}-comp.png`), mask: stageImage(`${stem}-mask.png`), denoise: Number(denoise), prefix: `pyrefly/method/paine-warrior-${pose}-grip` });
  const r = await run(g, `${stem}-grip.raw.png`, `${stem}-grip.png`, [s.width, s.height], `${pose}#${n} grip`);
  side(pose, n, { grip: { seed, denoise: Number(denoise), positive, negative, step: 'masked img2img (SetLatentNoiseMask) on the hand discs only', ...r } });
  log(`grip ${pose}#${n} seed ${seed} denoise ${denoise}: guard ${r.guard.ok ? 'ok' : 'REJECT ' + r.guard.reasons.join('; ')} (${r.seconds}s)`);
}

const [cmd, ...a] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
if (cmd === 'prep') prep();
else if (cmd === 'body') await body(a[0], a.slice(1));
else if (cmd === 'comp') await comp(a[0], a[1], a[2], Number(a[3]), a[4] ? Number(a[4]) : undefined, a[5] ? Number(a[5]) : undefined);
else if (cmd === 'grip') await grip(a[0], a[1], a[2]);
else console.log('usage: prep | body <pose> <n>... | comp <pose> <n> <hx,hy[;hx2,hy2]> <deg> [scale] [handR] | grip <pose> <n> [denoise]');
