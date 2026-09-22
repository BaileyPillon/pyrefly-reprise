#!/usr/bin/env node
/**
 * Ormi round 3 (FFX-2 only; Leblanc chapter art). Method F as won by the
 * Leblanc pilot 2 judge (docs/concepts/chapters/leblanc/pilot2/judge.md):
 * Animagine XL 4.0, 28 steps, cfg 6, euler_ancestral/normal, the shared
 * STYLE/QUALITY/SPRITE_NEGATIVE/FACING_NEGATIVE blocks, IP-Adapter reference
 * = batch of refs/idle-square.png + refs/idle-head.png, concat, 0.4, ease in,
 * 0.2 to 0.6. Only the words are Ormi's (identity-idle.txt, emphasis.txt,
 * the per-state blocks below). Pose words are Danbooru-style tags; the
 * sprite lint must strip nothing. Run from the repo root:
 *
 *   node docs/concepts/chapters/leblanc/sets/ormi/round3/run-round3.mjs <attack|cast|hurt|ko> [seed ...]
 *   node docs/concepts/chapters/leblanc/sets/ormi/round3/run-round3.mjs prompt <state>
 *
 * Every render: raw frame renders/<tag>.raw.png (kept local), rembg cutout
 * renders/<tag>.png, provenance renders/<tag>.json. Nothing is installed here.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const G = await import(pathToFileURL(join(ROOT, 'tools/gen/comfy.mjs')).href);
const {
  characterWorkflow, stageImage, cutout, waitForServer, lintSpritePrompt, escapeTags, joinTags,
  STYLE_TAGS, QUALITY_TAGS, SPRITE_NEGATIVE, FACING_NEGATIVE,
} = G;

const R = join(HERE, 'renders');
const REFS = join(HERE, 'refs');
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const TOOLS2 = join(ROOT, 'docs/concepts/chapters/leblanc/pilot2/tools2.py');
const BASE = `http://${process.env.COMFY_HOST || '127.0.0.1'}:${process.env.COMFY_PORT || 8188}`;
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const IPA = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPV = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';

const IDENTITY = readFileSync(join(HERE, 'identity-idle.txt'), 'utf8').trim();
const EMPHASIS = readFileSync(join(HERE, 'emphasis.txt'), 'utf8').trim();

// Pilot 2's per-state framing: the shared block minus `standing` and
// `(looking at viewer:1.2)`, which fight a recoil, a strike and a crouch.
const FRAMING =
  '(from side:1.3), three-quarter view, body facing left, full body, feet visible, simple background, white background';
// The prone block with `on side` moved into the KO pose tags.
const PRONE_FRAMING =
  'head to the left, feet to the right, lying on ground, full body, from side, simple background, white background';

// Drifts logged by sets/ormi/judge.md rounds 1 and 2, each named once.
const NEG_COMMON =
  'facial mark, facial tattoo, face paint, forehead mark, forehead tattoo, markings, whisker markings, scar on face, blood, ' +
  'multiple shields, two shields, dual wielding, kite shield, heater shield, pointed shield, square shield, ' +
  'muscular, muscular male, abs, pectorals, tall, slim, thin, sword, katana, blade, spear, ' +
  'red armor, red chest, bare chest, topless male, long hair, spiked hair, mohawk, helmet, feathers, ' +
  // Word pilot A (renders/pilot-a): a full head of red hair, a bare belly, bare or detached sleeves, shorts.
  'short hair, bangs, sidelocks, crop top, sleeveless, bare arms, detached sleeves, bare shoulders, shorts, ' +
  // Word pilot C: `fat man:1.3` bares the belly through plain negatives; idle's belly is covered.
  '(navel:1.3), (midriff:1.3), (bare stomach:1.3), (multiple shields:1.3), (two shields:1.3)';

const STATES = {
  attack: {
    poseTags:
      'lunging, leaning forward, one leg forward, holding shield, pushing, clenched teeth, v-shaped eyebrows, angry, looking ahead',
    emphasis: '(lunging:1.25), (leaning forward:1.2), (pushing:1.15)',
    emphasisSwap: ['(huge round shield:1.2)', '(one round shield:1.2)'],
    negAdd: 'smile, grin, standing still, arms crossed, arm behind back, shield on back, holding two shields, wooden shield',
    size: { width: 1024, height: 1216 },
    framing: FRAMING,
    seeds: [940001, 940002, 940003, 940004, 940005],
  },
  cast: {
    poseTags:
      'fighting stance, crouching, knees bent, legs apart, leaning forward, clenched hands, clenched teeth, v-shaped eyebrows, angry, shield on back, looking ahead',
    emphasis: '(crouching:1.2), (fighting stance:1.2), (clenched hands:1.15)',
    negAdd: 'smile, grin, standing still, arms crossed, holding shield, sitting',
    size: { width: 832, height: 1216 },
    framing: FRAMING,
    seeds: [940101, 940102, 940103, 940104, 940105],
  },
  hurt: {
    poseTags:
      'stumbling, leaning back, off balance, wince, closed eyes, pained expression, open mouth, clenched teeth, v-shaped eyebrows, hand on own stomach, head tilt, arm at side, shield on back',
    emphasis: '(closed eyes:1.25), (pained expression:1.3), (leaning back:1.2)',
    negAdd: 'smile, grin, looking at viewer, arms crossed, standing still, holding shield',
    size: { width: 832, height: 1216 },
    framing: FRAMING,
    seeds: [940201, 940202, 940203, 940204, 940205],
  },
  ko: {
    poseTags:
      'lying, on side, unconscious, defeated, closed eyes, arms at sides, shield on back',
    emphasis: '(lying on side:1.2), (closed eyes:1.2), (unconscious:1.15)',
    // Pilot D: in a landscape frame `huge round shield` became a ring around the whole body.
    identityDrop: ['huge shield'],
    emphasisSwap: ['(huge round shield:1.2)', '(round shield on back:1.2)'],
    negAdd: 'smile, grin, open eyes, standing, sitting, kneeling, looking at viewer, lying on shield, wooden floor, floor, platform, (circle:1.2), ring, frame, border, halo',
    size: { width: 1216, height: 832 },
    framing: PRONE_FRAMING,
    composition: 'prone',
    seeds: [940301, 940302, 940303, 940304, 940305],
  },
  // KO batch 2: lying on his side, the top sleeve and the robe's back fill
  // the frame, so `red sleeves` painted the whole torso red in 940301/940302.
  ko3: {
    poseTags:
      'lying, on side, unconscious, defeated, closed eyes, arms at sides, shield on back',
    emphasis: '(lying on side:1.2), (closed eyes:1.2), (unconscious:1.15)',
    identityDrop: ['huge shield', 'red sleeves'],
    emphasisSwap: ['(purple armor:1.25), (purple kimono:1.15), (huge round shield:1.2)', '(purple armor:1.35), (purple kimono:1.25), (purple sleeves:1.2), (round shield on back:1.2)'],
    negAdd: 'smile, grin, open eyes, standing, sitting, kneeling, looking at viewer, lying on shield, wooden floor, floor, platform, (circle:1.2), ring, frame, border, halo, red shirt, red jacket, red kimono',
    size: { width: 1216, height: 832 },
    framing: PRONE_FRAMING,
    composition: 'prone',
    seeds: [940311, 940312, 940313, 940314],
  },
  // Word pilot B: on his back the model lays him ON the shield (a giant disc
  // under the whole body). Face down with the shield still strapped on his
  // back keeps one round shield, heart up, at its real size.
  ko2: {
    poseTags:
      'lying, on stomach, face down, head turned to side, unconscious, defeated, closed eyes, arms at sides, shield on back',
    emphasis: '(lying on stomach:1.2), (closed eyes:1.2), (unconscious:1.15)',
    negAdd: 'smile, grin, open eyes, standing, sitting, kneeling, looking at viewer, lying on shield, wooden floor, floor, platform, on back',
    size: { width: 1216, height: 832 },
    framing: PRONE_FRAMING,
    composition: 'prone',
    seeds: [940351, 940352, 940353, 940354, 940355],
  },
};

function prompts(state) {
  const s = STATES[state];
  const lint = lintSpritePrompt({ tags: IDENTITY, poseTags: s.poseTags, composition: s.composition || 'full' });
  if (lint.stripped.length) throw new Error(`lint stripped ${JSON.stringify(lint.stripped)}`);
  const identity = IDENTITY.split(', ').filter((t) => !(s.identityDrop || []).includes(t)).join(', ');
  const emphasis = s.emphasisSwap ? EMPHASIS.replace(s.emphasisSwap[0], s.emphasisSwap[1]) : EMPHASIS;
  const positive = joinTags(escapeTags(identity), escapeTags(s.poseTags), s.emphasis, emphasis, s.framing, STYLE_TAGS, QUALITY_TAGS);
  const negative = joinTags(SPRITE_NEGATIVE, FACING_NEGATIVE, NEG_COMMON, s.negAdd);
  return { positive, negative };
}

const CLIENT_ID = createHash('sha1').update(`ormi-r3-${process.pid}-${Date.now()}`).digest('hex');
async function queue(workflow) {
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: CLIENT_ID }),
  });
  const t = await res.text();
  if (!res.ok) throw new Error(`rejected ${res.status}: ${t}`);
  return JSON.parse(t).prompt_id;
}
async function result(id) {
  const deadline = Date.now() + 3 * 3600_000; // a 60-90 min video job may sit ahead of us
  for (;;) {
    const h = await (await fetch(`${BASE}/history/${id}`)).json();
    const e = h[id];
    if (e?.status?.status_str === 'error') throw new Error(JSON.stringify(e.status.messages));
    if (e?.outputs && Object.keys(e.outputs).length) {
      for (const n of Object.values(e.outputs)) {
        for (const img of n.images || []) {
          const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
          return Buffer.from(await (await fetch(`${BASE}/view?${q}`)).arrayBuffer());
        }
      }
    }
    if (Date.now() > deadline) throw new Error(`timeout ${id}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
}
function maxRgb(p) {
  const r = spawnSync(PY, ['-s', TOOLS2, 'maxrgb', p], { encoding: 'utf8', cwd: ROOT });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return Number(r.stdout.trim());
}

function refBatch(g, names, { weight, start, end, type }) {
  g['20'] = { class_type: 'LoadImage', inputs: { image: names[0], upload: 'image' } };
  g['24'] = { class_type: 'LoadImage', inputs: { image: names[1], upload: 'image' } };
  g['25'] = { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } };
  g['21'] = { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPA } };
  g['22'] = { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPV } };
  g['23'] = {
    class_type: 'IPAdapterAdvanced',
    inputs: {
      model: ['4', 0], ipadapter: ['21', 0], image: ['25', 0], weight, weight_type: type,
      combine_embeds: 'concat', start_at: start, end_at: end, embeds_scaling: 'K+V', clip_vision: ['22', 0],
    },
  };
  g['3'].inputs.model = ['23', 0];
}

async function run(state, seeds) {
  const s = STATES[state];
  const { positive, negative } = prompts(state);
  const sq = stageImage(join(REFS, 'idle-square.png'));
  const head = stageImage(join(REFS, 'idle-head.png'));
  const ref = { weight: 0.4, start: 0.2, end: 0.6, type: 'ease in' };
  for (const seed of seeds) {
    const tag = `${state}.${seed}`;
    const t0 = Date.now();
    const g = characterWorkflow({
      ...s.size, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      positive, negative, seed, prefix: `pyrefly/ormi_r3_${state}`,
    });
    refBatch(g, [sq, head], ref);
    const buf = await result(await queue(g));
    const raw = join(R, `${tag}.raw.png`);
    writeFileSync(raw, buf);
    if (maxRgb(raw) === 0) throw new Error(`${tag}: BLACK FRAME — check the queue before any restart`);
    let cut = null;
    try {
      cut = cutout(raw, join(R, `${tag}.png`), 16);
    } catch (e) {
      process.stderr.write(`[ormi-r3] ${tag}: cutout failed: ${e.message}\n`);
    }
    writeFileSync(
      join(R, `${tag}.json`),
      JSON.stringify({
        tag, method: 'F (Leblanc pilot 2 winner, Ormi words)', state, seed, positive, negative,
        emphasis: `${s.emphasis}, ${s.emphasisSwap ? EMPHASIS.replace(s.emphasisSwap[0], s.emphasisSwap[1]) : EMPHASIS}`, poseTags: s.poseTags,
        ref: { images: ['refs/idle-square.png', 'refs/idle-head.png'], combine: 'concat', ...ref, ipadapter: IPA },
        canvas: s.size, cutout: cut, model: CKPT, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
        seconds: Math.round((Date.now() - t0) / 1000), generatedAt: new Date().toISOString(),
      }, null, 2) + '\n',
    );
    process.stderr.write(`[ormi-r3] ${tag} done in ${Math.round((Date.now() - t0) / 1000)} s\n`);
  }
}

const [mode, arg, ...rest] = process.argv.slice(2);
mkdirSync(R, { recursive: true });
if (mode === 'prompt') {
  console.log(JSON.stringify(prompts(arg), null, 2));
} else {
  if (!STATES[mode]) throw new Error('state must be attack, cast, hurt, ko, ko2 or ko3');
  await waitForServer(60_000);
  const seeds = [arg, ...rest].filter(Boolean).map(Number);
  await run(mode, seeds.length ? seeds : STATES[mode].seeds);
}
