#!/usr/bin/env node
/**
 * Leblanc round 3 (FFX-2 only): method F from pilot 2 with the words the
 * pilot-2 judge corrected (docs/concepts/chapters/leblanc/pilot2/judge.md,
 * "Recipe for the next attempt"). Same graph as pilot2/run-pilot2.mjs
 * (Animagine XL 4.0, 28 steps, cfg 6, euler_ancestral/normal; IP-Adapter
 * plus, batch of pilot2/refs/idle-square.png + idle-head.png, concat, 0.4,
 * ease in, 0.2-0.6). Run from the repo root:
 *
 *   node docs/concepts/chapters/leblanc/sets/leblanc/round3/run-round3.mjs <attack|hurt|cast> [seed ...]
 *   node docs/concepts/chapters/leblanc/sets/leblanc/round3/run-round3.mjs prompt <state>
 *
 * Writes renders/<state>.<seed>.{raw.png,png,json}. Installs nothing.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  characterWorkflow,
  stageImage,
  cutout,
  waitForServer,
  lintSpritePrompt,
  escapeTags,
  joinTags,
  STYLE_TAGS,
  QUALITY_TAGS,
  SPRITE_NEGATIVE,
  FACING_NEGATIVE,
} from '../../../../../../../tools/gen/comfy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..', '..', '..');
const R = join(HERE, 'renders');
const PILOT2 = join(ROOT, 'docs/concepts/chapters/leblanc/pilot2');
const REFS = join(PILOT2, 'refs');
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const BASE = `http://${process.env.COMFY_HOST || '127.0.0.1'}:${process.env.COMFY_PORT || 8188}`;
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const IPA = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPV = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';

// PASS=b (same seeds): drops the two words pass a showed failing at 1:1: 'argyle' printed a
// quilted knit over the whole robe and the boots (hurt), 'chest tattoo' drew tribal/kanji marks (cast).
const PASS = process.env.PASS || 'a';
const IDENTITY = readFileSync(join(HERE, PASS === 'b' ? 'identity-b.txt' : 'identity.txt'), 'utf8').trim();
const PASS_NEG = PASS === 'b' ? 'tribal tattoo, kanji, shoulder tattoo, argyle, quilted, plaid, belt, buckle' : '';
const EMPHASIS = readFileSync(join(HERE, 'emphasis.txt'), 'utf8').trim();
const FRAMING =
  '(from side:1.3), three-quarter view, body facing left, full body, feet visible, simple background, white background';
// Judge recipe item 3: added to every state's negatives.
const COMMON_NEG =
  'gold obi, yellow sash, gold sash, lace, lace bra, bra, crop top, shorts, red lining, pink lining, magenta, floral print, shoulder armor, hair over eyes, tan, orange fan, gold fan, white fan, multiple views, 2girls';

const STATES = {
  hurt: {
    // pilot 2 pose tags unchanged (recipe item 4); seed 22301 replaced
    poseTags:
      'leaning back, off balance, wince, closed eyes, pained expression, clenched teeth, v-shaped eyebrows, hand on own stomach, head tilt, arm at side, holding closed fan',
    emphasis: '(closed eyes:1.25), (pained expression:1.2), (leaning back:1.2)',
    negAdd:
      'smile, smirk, grin, wink, seductive smile, happy, dancing, looking at viewer, thighhighs, stockings, pantyhose, closed robe, long dress, red fan, pink fan, hand to own mouth, covering mouth, fan to mouth',
    seeds: [22302, 22303, 22304, 22305, 22306, 22307],
    size: [832, 1216],
  },
  attack: {
    // recipe item 5: the fan leads, `swinging` dropped, 1024 wide
    poseTags:
      'lunging, leaning forward, one leg forward, outstretched arm, reaching, holding folding fan, arm extended forward, serious, v-shaped eyebrows, looking ahead, closed mouth',
    emphasis: '(lunging:1.25), (leaning forward:1.2), (serious:1.15)',
    negAdd:
      'smile, smirk, grin, wink, seductive smile, happy, dancing, fan dance, thighhighs, stockings, pantyhose, closed robe, long dress, red fan, pink fan, arm behind back, fan behind back',
    seeds: [22101, 22102, 22103, 22104, 22105, 22106],
    size: [1024, 1216],
  },
  cast: {
    // sets/leblanc/judge.md redo pass 2: "looking up" was not met unweighted, so it is weighted here
    poseTags: 'standing, arm up, raised hand, holding folding fan, open fan, looking up, head back, serious, closed mouth',
    emphasis: '(looking up:1.3), (arm up:1.2), (open fan:1.15)',
    negAdd:
      'smile, smirk, grin, wink, seductive smile, happy, dancing, looking at viewer, thighhighs, stockings, pantyhose, closed robe, long dress, red fan, pink fan, fan to mouth',
    seeds: [22501, 22502, 22503, 22504, 22505, 22506],
    size: [832, 1216],
  },
};

function prompts(state) {
  const s = STATES[state];
  const lint = lintSpritePrompt({ tags: IDENTITY, poseTags: s.poseTags, composition: 'full' });
  if (lint.stripped.length) throw new Error(`lint stripped ${JSON.stringify(lint.stripped)}`);
  const positive = joinTags(
    escapeTags(IDENTITY),
    escapeTags(s.poseTags),
    s.emphasis,
    EMPHASIS,
    FRAMING,
    STYLE_TAGS,
    QUALITY_TAGS,
  );
  const negative = joinTags(SPRITE_NEGATIVE, FACING_NEGATIVE, COMMON_NEG, s.negAdd, PASS_NEG);
  return { positive, negative };
}

const CLIENT_ID = createHash('sha1').update(`round3-${process.pid}-${Date.now()}`).digest('hex');
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
  const deadline = Date.now() + 3 * 3600_000; // the shared queue may hold a long video job
  for (;;) {
    const h = await (await fetch(`${BASE}/history/${id}`)).json();
    const e = h[id];
    if (e?.status?.status_str === 'error') throw new Error(JSON.stringify(e.status.messages));
    if (e?.outputs && Object.keys(e.outputs).length) {
      for (const n of Object.values(e.outputs))
        for (const img of n.images || []) {
          const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
          return Buffer.from(await (await fetch(`${BASE}/view?${q}`)).arrayBuffer());
        }
    }
    if (Date.now() > deadline) throw new Error(`timeout ${id}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}
function maxRgb(p) {
  const r = spawnSync(PY, ['-s', join(PILOT2, 'tools2.py'), 'maxrgb', p], { encoding: 'utf8', cwd: ROOT });
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

const [mode, arg, ...rest] = process.argv.slice(2);
if (mode === 'prompt') {
  console.log(JSON.stringify(prompts(arg), null, 2));
  process.exit(0);
}
const state = mode;
if (!STATES[state]) throw new Error('state must be attack, hurt or cast');
const S = STATES[state];
const seeds = [arg, ...rest].filter(Boolean).map(Number);
mkdirSync(R, { recursive: true });
await waitForServer(60_000);
const { positive, negative } = prompts(state);
const sq = stageImage(join(REFS, 'idle-square.png'));
const head = stageImage(join(REFS, 'idle-head.png'));
const ref = { weight: 0.4, start: 0.2, end: 0.6, type: 'ease in' };
const [width, height] = S.size;
for (const seed of seeds.length ? seeds : S.seeds) {
  const t0 = Date.now();
  const g = characterWorkflow({
    width, height, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
    positive, negative, seed, prefix: `pyrefly/leblanc_r3_${state}`,
  });
  refBatch(g, [sq, head], ref);
  const buf = await result(await queue(g));
  const tag = PASS === 'b' ? `${state}.b.${seed}` : `${state}.${seed}`;
  const raw = join(R, `${tag}.raw.png`);
  writeFileSync(raw, buf);
  if (maxRgb(raw) === 0) throw new Error(`${tag}: BLACK FRAME, check the queue before any restart`);
  let cut = null;
  try {
    cut = cutout(raw, join(R, `${tag}.png`), 16);
  } catch (e) {
    process.stderr.write(`[r3] ${tag}: cutout failed: ${e.message}\n`);
  }
  writeFileSync(
    join(R, `${tag}.json`),
    JSON.stringify(
      {
        tag, method: 'F (pilot 2 winner, words corrected per pilot2/judge.md)', pass: PASS, state, seed, width, height,
        steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal', model: CKPT,
        ref: {
          images: ['docs/concepts/chapters/leblanc/pilot2/refs/idle-square.png', 'docs/concepts/chapters/leblanc/pilot2/refs/idle-head.png'],
          ipadapter: IPA, combine: 'concat', scaling: 'K+V', ...ref,
        },
        positive, negative, cutout: cut,
        seconds: Math.round((Date.now() - t0) / 1000), generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + '\n',
  );
  process.stderr.write(`[r3] ${tag} done in ${Math.round((Date.now() - t0) / 1000)} s\n`);
}
