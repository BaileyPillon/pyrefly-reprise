#!/usr/bin/env node
/**
 * Macalania production renders (FFX only: Seymour, the Guado Guardians and
 * Anima of the Macalania Temple chapter; AGENTS.md rule 14).
 *
 * Sprites use method F, the Leblanc pilot 2 winner
 * (docs/concepts/chapters/leblanc/pilot2/judge.md): Animagine XL 4.0, 28 steps,
 * cfg 6, euler_ancestral/normal, the shared STYLE/QUALITY/SPRITE_NEGATIVE/
 * FACING_NEGATIVE blocks, IP-Adapter reference = batch of a square pad and a
 * square head crop, concat, 0.4, ease in, 0.2 to 0.6. Only the words are this
 * chapter's (words/*.txt and the per-state blocks below). Pose words are
 * Danbooru-style tags; the sprite lint must strip nothing.
 *
 * idle renders from the PICKED CONCEPT's refs (refs/<subject>-concept-*);
 * every other state from the picked idle's refs (refs/<subject>-idle-*).
 * Anima's idle is the board-approved painting and is never re-rendered.
 *
 *   node docs/concepts/chapters/macalania/production/run.mjs <subject> <state> [seed ...]
 *   node docs/concepts/chapters/macalania/production/run.mjs prompt <subject> <state>
 *   node docs/concepts/chapters/macalania/production/run.mjs backdrop [seed:denoise ...]
 *   node docs/concepts/chapters/macalania/production/run.mjs hero [seed ...]
 *
 * Every render: raw frame renders/<subject>/<tag>.raw.png (kept local), rembg
 * cutout renders/<subject>/<tag>.png, provenance renders/<subject>/<tag>.json.
 * Nothing is installed here.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const G = await import(pathToFileURL(join(ROOT, 'tools/gen/comfy.mjs')).href);
const {
  characterWorkflow, backdropWorkflow, stageImage, cutout, waitForServer, lintSpritePrompt, escapeTags, joinTags,
  STYLE_TAGS, QUALITY_TAGS, SPRITE_NEGATIVE, FACING_NEGATIVE, BACKDROP_NEGATIVE, HERO_NEGATIVE, HERO_COMPOSITION,
} = G;

const REFS = join(HERE, 'refs');
const PY = 'D:/Tools/ComfyUI/python_embeded/python.exe';
const TOOLS2 = join(ROOT, 'docs/concepts/chapters/leblanc/pilot2/tools2.py');
const BASE = `http://${process.env.COMFY_HOST || '127.0.0.1'}:${process.env.COMFY_PORT || 8188}`;
const CKPT = 'animagine-xl-4.0-opt.safetensors';
const IPA = 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIPV = 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';
const words = (f) => readFileSync(join(HERE, 'words', f), 'utf8').trim();

// idle keeps the house sprite framing (standing, looking at viewer); the other
// states use pilot 2's framing without `standing` / `(looking at viewer:1.2)`,
// which fight a recoil and a strike.
const IDLE_FRAMING =
  '(from side:1.3), three-quarter view, body facing left, (looking at viewer:1.2), full body, standing, feet visible, simple background, white background';
const FRAMING =
  '(from side:1.3), three-quarter view, body facing left, full body, feet visible, simple background, white background';
const PRONE_FRAMING =
  'head to the left, feet to the right, lying on ground, full body, from side, simple background, white background';
// Anima floats (--composition boss --nonBiped): the boss block, as her approved idle used it.
const BOSS_FRAMING =
  '(from side:1.1), three-quarter view, (looking at viewer:1.2), full body, centered, imposing, simple background, white background';
const ANIMA_WHOLE = 'whole figure inside the frame from the top of the horns to the bottom of the body, zoomed out, head and bandaged face clearly visible';

const TALL = { width: 832, height: 1216 };
// Anima attempt 2: her approved attack's reference settings and extra negatives.
const ANIMA_REF2 = { files: ['public/art/characters/anima/idle.png'], weight: 0.8, start: 0.35, end: 0.85, type: 'linear' };
const ANIMA_NEG2 = 'mace, flail, chain weapon, legs, knees, boots, white smoke, smoke, glowing white, white aura';
const WIDE = { width: 1216, height: 832 };

const SUBJECTS = {
  seymour: {
    out: 'seymour-macalania',
    composition: 'full',
    states: {
      idle: {
        poseTags: 'standing, arms crossed, calm, light smile, closed mouth, looking down at viewer, head tilt',
        emphasis: '(arms crossed:1.2), (light smile:1.1)',
        negAdd: 'grin, open mouth, angry, frown',
        size: TALL, framing: IDLE_FRAMING, seeds: [510001, 510002, 510003, 510004],
      },
      attack: {
        poseTags: 'outstretched arm, arm extended forward, open hand, palm forward, leaning forward, one leg forward, serious, v-shaped eyebrows, looking ahead, closed mouth',
        emphasis: '(outstretched arm:1.25), (open hand:1.15), (leaning forward:1.15)',
        negAdd: 'smile, grin, arms crossed, standing still, fist',
        size: TALL, framing: FRAMING, seeds: [510101, 510102, 510103, 510104],
      },
      // Attack attempt 2: all four 832-wide attack renders ran off the canvas
      // (pilot 2's finding 5). Same words on Ormi's 1024x1216 attack canvas,
      // with the whole figure asked for in the frame.
      attack2: {
        poseTags: 'outstretched arm, arm extended forward, open hand, palm forward, leaning forward, one leg forward, serious, v-shaped eyebrows, looking ahead, closed mouth, whole body in frame, zoomed out',
        emphasis: '(outstretched arm:1.25), (open hand:1.15), (leaning forward:1.15), (full body:1.2)',
        negAdd: 'smile, grin, arms crossed, standing still, fist, cropped, out of frame',
        size: { width: 1024, height: 1216 }, framing: FRAMING, seeds: [510111, 510112, 510113, 510114], installAs: 'attack',
      },
      cast: {
        poseTags: 'arm up, hand raised, open hand, palm up, hand on own chest, head back, looking up, half-closed eyes, light smile, closed mouth',
        emphasis: '(arm up:1.25), (hand raised:1.2), (half-closed eyes:1.1)',
        negAdd: 'grin, open mouth, arms crossed, arms at sides',
        size: TALL, framing: FRAMING, seeds: [510201, 510202, 510203, 510204],
      },
      hurt: {
        poseTags: 'leaning back, off balance, wince, closed eyes, pained expression, clenched teeth, v-shaped eyebrows, hand on own chest, head tilt, arm at side',
        emphasis: '(closed eyes:1.25), (pained expression:1.2), (leaning back:1.2)',
        negAdd: 'smile, smirk, grin, happy, looking at viewer, arms crossed, standing still',
        size: TALL, framing: FRAMING, seeds: [510301, 510302, 510303, 510304],
      },
      ko: {
        poseTags: 'lying, on side, unconscious, defeated, closed eyes, arms at sides, hair spread out',
        emphasis: '(lying on side:1.2), (closed eyes:1.2), (unconscious:1.15)',
        negAdd: 'smile, open eyes, standing, sitting, kneeling, looking at viewer, floor, platform, bed, pillow',
        size: WIDE, framing: PRONE_FRAMING, composition: 'prone', seeds: [510401, 510402, 510403, 510404],
      },
    },
  },
  guardian: {
    out: 'guado-guardian',
    composition: 'full',
    states: {
      idle: {
        // Round 1 (seeds 520001-520004) held the spear blade-down; round 2 names the tip.
        poseTags: 'standing, standing at attention, holding spear, spear tip pointing up, stoic, expressionless, closed mouth, looking at viewer, shoes',
        emphasis: '(standing at attention:1.15), (spearhead pointing up:1.15)',
        negAdd: 'smile, grin, open mouth, angry, barefoot, upside-down spear',
        size: TALL, framing: IDLE_FRAMING, seeds: [520001, 520002, 520003, 520004],
      },
      attack: {
        poseTags: 'lunging, leaning forward, one leg forward, holding spear, spear pointed forward, thrusting, serious, v-shaped eyebrows, looking ahead, closed mouth',
        emphasis: '(lunging:1.25), (spear pointed forward:1.2), (serious:1.1)',
        negAdd: 'smile, grin, standing still, arms crossed, spear on shoulder',
        size: TALL, framing: FRAMING, seeds: [520101, 520102, 520103, 520104],
      },
      cast: {
        poseTags: 'holding bottle, holding potion, small bottle, arm up, raising bottle, looking at object, holding spear, serious, closed mouth',
        emphasis: '(holding a small potion bottle up:1.25), (arm up:1.15)',
        negAdd: 'smile, grin, drinking, bottle to mouth, wine bottle, large bottle, cup',
        size: TALL, framing: FRAMING, seeds: [520201, 520202, 520203, 520204],
      },
      hurt: {
        poseTags: 'leaning back, off balance, wince, closed eyes, pained expression, clenched teeth, v-shaped eyebrows, hand on own stomach, head tilt, holding spear',
        emphasis: '(closed eyes:1.25), (pained expression:1.2), (leaning back:1.2)',
        negAdd: 'smile, smirk, grin, happy, looking at viewer, standing still',
        size: TALL, framing: FRAMING, seeds: [520301, 520302, 520303, 520304],
      },
      ko: {
        poseTags: 'lying, on side, unconscious, defeated, closed eyes, arms at sides, spear on ground',
        emphasis: '(lying on side:1.2), (closed eyes:1.2), (unconscious:1.15)',
        negAdd: 'smile, open eyes, standing, sitting, kneeling, looking at viewer, floor, platform, bed, pillow',
        size: WIDE, framing: PRONE_FRAMING, composition: 'prone', seeds: [520401, 520402, 520403, 520404],
      },
    },
  },
  anima: {
    out: 'anima',
    composition: 'boss',
    nonBiped: true,
    states: {
      // Anima's `attack` and `overdrive` already exist; `cast` (Pain, Boost),
      // `hurt` and `ko` are the enemy poses her part asks for that do not.
      // Attempt 1 (method F, seeds 5302xx/5303xx/5304xx) lost her identity in
      // 12 of 12 renders: at 0.4 the adapter cannot hold a form this far from
      // the checkpoint's priors. Attempt 2 is the recipe that already produced
      // her approved attack and overdrive (their sidecars): the tall idle as
      // the only reference at 0.8, linear, 0.35 to 0.85, "standing upright"
      // pose phrasing and the attack's own negatives.
      cast: {
        poseTags: `standing upright, looming forward over the target, the masked head thrust toward the target, the single red eye staring, the heavy chains swinging forward, ${ANIMA_WHOLE}`,
        emphasis: '(full body:1.25), (bandage wrappings:1.2), (head thrust forward:1.1)',
        negAdd: ANIMA_NEG2, ref: ANIMA_REF2,
        size: TALL, framing: BOSS_FRAMING, seeds: [530211, 530212, 530213, 530214],
      },
      hurt: {
        poseTags: `standing upright, recoiling backward, the masked head jerked back, the horns tilted back, the heavy chains swinging sideways, ${ANIMA_WHOLE}`,
        emphasis: '(full body:1.25), (bandage wrappings:1.2), (recoiling:1.15)',
        negAdd: ANIMA_NEG2, ref: ANIMA_REF2,
        size: TALL, framing: BOSS_FRAMING, seeds: [530311, 530312, 530313, 530314],
      },
      ko: {
        poseTags: `standing upright, slumped, limp, the masked head hanging down onto the chest, the horns drooping forward, the heavy chains hanging slack, ${ANIMA_WHOLE}`,
        emphasis: '(full body:1.25), (bandage wrappings:1.2), (head hanging down:1.2), (limp:1.1)',
        negAdd: ANIMA_NEG2, ref: ANIMA_REF2,
        size: TALL, framing: BOSS_FRAMING, seeds: [530411, 530412, 530413, 530414],
      },
      // Attempt 3 (anima-method-check.md): method E, the approved idle rotated
      // as a whole (puppet.py) and repainted at low denoise; method F's refs.
      hurtE: {
        poseTags: `recoiling, leaning back, ${ANIMA_WHOLE}`,
        emphasis: '(full body:1.2), (bandage wrappings:1.2), (only one eye:1.2)',
        negAdd: ANIMA_NEG2, init: 'refs/anima-hurt-init.png', refPrefix: 'anima-idle',
        size: TALL, framing: BOSS_FRAMING, seeds: [530341, 530342, 530343, 530344], denoise: [0.3, 0.3, 0.35, 0.35], installAs: 'hurt' /* 5303[23]x: earlier puppets, a horn clipped at the right edge */,
      },
      koE: {
        poseTags: `slumped, limp, head down, drooping, ${ANIMA_WHOLE}`,
        emphasis: '(full body:1.2), (bandage wrappings:1.2), (only one eye:1.2)',
        negAdd: ANIMA_NEG2, init: 'refs/anima-ko-init.png', refPrefix: 'anima-idle',
        size: TALL, framing: BOSS_FRAMING, seeds: [530441, 530442, 530443, 530444], denoise: [0.3, 0.3, 0.35, 0.35], installAs: 'ko' /* 5304[23]x: earlier puppets, clipped at the frame edge */,
      },
    },
  },
};

function prompts(subject, state) {
  const sub = SUBJECTS[subject];
  const s = sub.states[state];
  const identity = words(`${subject}-identity.txt`);
  const lint = lintSpritePrompt({ tags: identity, poseTags: s.poseTags, composition: s.composition || sub.composition });
  if (lint.stripped.length) throw new Error(`lint stripped ${JSON.stringify(lint.stripped)}`);
  const positive = joinTags(escapeTags(identity), escapeTags(s.poseTags), s.emphasis, words(`${subject}-emphasis.txt`), s.framing, STYLE_TAGS, QUALITY_TAGS);
  const negative = joinTags(SPRITE_NEGATIVE, FACING_NEGATIVE, words(`${subject}-neg.txt`), s.negAdd);
  return { positive, negative };
}

// ---------------------------------------------------------------- client
const CLIENT_ID = createHash('sha1').update(`macalania-${process.pid}-${Date.now()}`).digest('hex');
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
/** Every image the prompt saved, keyed by the SaveImage node id. */
async function results(id) {
  const deadline = Date.now() + 3 * 3600_000; // a 60-90 min video job may sit ahead of us
  for (;;) {
    const h = await (await fetch(`${BASE}/history/${id}`)).json();
    const e = h[id];
    if (e?.status?.status_str === 'error') throw new Error(JSON.stringify(e.status.messages));
    if (e?.outputs && Object.keys(e.outputs).length) {
      const out = {};
      for (const [node, n] of Object.entries(e.outputs)) {
        for (const img of n.images || []) {
          const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
          out[node] = Buffer.from(await (await fetch(`${BASE}/view?${q}`)).arrayBuffer());
        }
      }
      return out;
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
  let img = ['20', 0];
  if (names[1]) {
    g['24'] = { class_type: 'LoadImage', inputs: { image: names[1], upload: 'image' } };
    g['25'] = { class_type: 'ImageBatch', inputs: { image1: ['20', 0], image2: ['24', 0] } };
    img = ['25', 0];
  }
  g['21'] = { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: IPA } };
  g['22'] = { class_type: 'CLIPVisionLoader', inputs: { clip_name: CLIPV } };
  g['23'] = {
    class_type: 'IPAdapterAdvanced',
    inputs: {
      model: ['4', 0], ipadapter: ['21', 0], image: img, weight, weight_type: type,
      combine_embeds: 'concat', start_at: start, end_at: end, embeds_scaling: 'K+V', clip_vision: ['22', 0],
    },
  };
  g['3'].inputs.model = ['23', 0];
}

const REF_F = { weight: 0.4, start: 0.2, end: 0.6, type: 'ease in' };

async function runSprite(subject, state, seeds) {
  const sub = SUBJECTS[subject];
  const s = sub.states[state];
  const R = join(HERE, 'renders', subject);
  mkdirSync(R, { recursive: true });
  const { positive, negative } = prompts(subject, state);
  const refPrefix = s.refPrefix || (state === 'idle' ? `${subject}-concept` : `${subject}-idle`);
  const refFiles = s.ref ? s.ref.files : [`refs/${refPrefix}-square.png`, `refs/${refPrefix}-head.png`];
  const staged = refFiles.map((f) => stageImage(s.ref ? join(ROOT, f) : join(HERE, f)));
  const REF = s.ref ? { weight: s.ref.weight, start: s.ref.start, end: s.ref.end, type: s.ref.type } : REF_F;
  const init = s.init ? stageImage(join(HERE, s.init)) : null;
  for (const [k, seed] of seeds.entries()) {
    const tag = `${state}.${seed}`;
    const t0 = Date.now();
    const denoise = s.init ? (s.denoise?.[k] ?? 0.4) : undefined;
    const g = characterWorkflow({
      ...s.size, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      positive, negative, seed, prefix: `pyrefly/macalania_${subject}_${state}`,
      ...(init ? { initImage: init, denoise } : {}),
    });
    refBatch(g, staged, REF);
    const out = await results(await queue(g));
    const raw = join(R, `${tag}.raw.png`);
    writeFileSync(raw, out['9']);
    if (maxRgb(raw) === 0) throw new Error(`${tag}: BLACK FRAME — check the queue before any restart`);
    let cut = null;
    try {
      cut = cutout(raw, join(R, `${tag}.png`), 16);
    } catch (e) {
      process.stderr.write(`[macalania] ${subject} ${tag}: cutout failed: ${e.message}\n`);
    }
    writeFileSync(
      join(R, `${tag}.json`),
      JSON.stringify({
        tag, subject, outDir: `public/art/characters/${sub.out}`, method: s.ref ? "Anima's approved-attack recipe (tall idle only, 0.8 linear 0.35-0.85), Macalania pose words" : 'F (Leblanc pilot 2 winner, Macalania words)', state, seed,
        positive, negative, poseTags: s.poseTags, emphasis: `${s.emphasis}, ${words(`${subject}-emphasis.txt`)}`,
        composition: s.composition || sub.composition, nonBiped: !!sub.nonBiped, facing: 'left',
        ref: { images: refFiles.map((f) => (s.ref ? f : `docs/concepts/chapters/macalania/production/${f}`)), combine: 'concat', ...REF, ipadapter: IPA, scaling: 'K+V' },
        canvas: s.size, ...(init ? { img2img: `docs/concepts/chapters/macalania/production/${s.init}`, denoise } : {}), cutout: cut, model: CKPT, steps: 28, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
        seconds: Math.round((Date.now() - t0) / 1000), generatedAt: new Date().toISOString(),
      }, null, 2) + '\n',
    );
    process.stderr.write(`[macalania] ${subject} ${tag} done in ${Math.round((Date.now() - t0) / 1000)} s\n`);
  }
}

// ---------------------------------------------------------------- backdrop
// §9.1's painter's brief, quoted into the words; img2img from the picked frame
// (renders/backdrop-a.png, "warm brazier gold") so the composition Bailey picked stays.
const BACKDROP_TAGS =
  'no humans, scenery, final fantasy x, macalania temple, chamber of the fayth antechamber, ice temple interior, ' +
  'ice pretending to be masonry, carved polished ice columns and arches, rounded melted edges, translucent ice walls, ' +
  'warm gold brazier light travelling sideways through the ice walls, gold metalwork set into the ice, twin braziers, ' +
  'glacier blue, pale cyan, faint green core in thick ice, deep temple red and ochre accents, symmetrical wide hall, ' +
  'glowing door in background, reflective ice floor, empty hall';
async function runBackdrop(specs) {
  const R = join(HERE, 'renders', 'backdrop');
  mkdirSync(R, { recursive: true });
  const init = stageImage(join(ROOT, 'docs/concepts/chapters/macalania/renders/backdrop-a.png'));
  const positive = joinTags(BACKDROP_TAGS, 'detailed background, painterly, cinematic lighting, wide shot', QUALITY_TAGS);
  const negative = joinTags(BACKDROP_NEGATIVE, 'snow, snowfield, mountain, grey rock, opaque stone, outdoors, sky, character, silhouette');
  for (const spec of specs) {
    const [seed, denoise] = spec.split(':').map(Number);
    const tag = `backdrop.${seed}.d${Math.round(denoise * 100)}`;
    const t0 = Date.now();
    const g = backdropWorkflow({
      width: 1344, height: 768, steps: 30, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      positive, negative, seed, initImage: init, denoise, prefix: 'pyrefly/macalania_backdrop',
    });
    const out = await results(await queue(g));
    const p = join(R, `${tag}.png`);
    writeFileSync(p, out['9']);
    if (maxRgb(p) === 0) throw new Error(`${tag}: BLACK FRAME`);
    writeFileSync(join(R, `${tag}.json`), JSON.stringify({
      tag, seed, denoise, prompt: positive, negative, model: CKPT, upscaler: 'RealESRGAN_x4plus.pth', steps: 30, cfg: 6,
      sampler: 'euler_ancestral', scheduler: 'normal', canvas: { width: 1344, height: 768 },
      img2img: 'docs/concepts/chapters/macalania/renders/backdrop-a.png', pickedFrom: 'backdrop A (warm brazier gold), docs/target/targets.json',
      seconds: Math.round((Date.now() - t0) / 1000), generatedAt: new Date().toISOString(),
    }, null, 2) + '\n');
    process.stderr.write(`[macalania] ${tag} done in ${Math.round((Date.now() - t0) / 1000)} s\n`);
  }
}

// ---------------------------------------------------------------- pause plate
// The hero preset (1344x768, 30 steps, HERO_COMPOSITION, HERO_NEGATIVE, no
// rembg) as the Leblanc close-ups used it, plus the RealESRGAN x4 -> 0.5 route
// the other plates' 2x masters took, so one prompt writes both files.
const HERO_TAGS =
  '1boy, seymour guado, final fantasy x, safe, solo, male focus, pale skin, light blue hair, very long hair, hair over one eye, purple eyes, ' +
  'facial veins, human ears, dark blue robe, red trim, high collar, open robe, bare chest, chest tattoo, ' +
  'macalania temple, translucent blue ice behind him, warm gold brazier light on one side of his face, cold blue light on the other side, soft bokeh background';
const HERO_POSE = 'three-quarter view, looking at viewer, serene smile, calm, courteous, mouth closed, half-closed eyes, head and shoulders';
async function runHeroPlate(seeds) {
  const R = join(HERE, 'renders', 'hero');
  mkdirSync(R, { recursive: true });
  const emphasis = '(light blue hair:1.2), (facial veins:1.15), (serene smile:1.1)';
  const positive = joinTags(escapeTags(HERO_TAGS), escapeTags(HERO_POSE), emphasis, HERO_COMPOSITION, STYLE_TAGS, QUALITY_TAGS);
  const negative = joinTags(HERO_NEGATIVE, 'crown, tiara, helmet, horns, staff, weapon, (pointy ears:1.2), elf ears, blonde hair, white hair, grin, open mouth');
  const refFiles = ['refs/seymour-idle-head.png'];
  const staged = refFiles.map((f) => stageImage(join(HERE, f)));
  const ref = { weight: 0.35, start: 0.2, end: 0.6, type: 'ease in' };
  for (const seed of seeds) {
    const tag = `hero.${seed}`;
    const t0 = Date.now();
    const g = backdropWorkflow({
      width: 1344, height: 768, steps: 30, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      positive, negative, seed, prefix: 'pyrefly/macalania_hero',
    });
    g['13'] = { class_type: 'SaveImage', inputs: { filename_prefix: 'pyrefly/macalania_hero_1x', images: ['8', 0] } };
    refBatch(g, staged, ref);
    const out = await results(await queue(g));
    const p1 = join(R, `${tag}.png`);
    writeFileSync(p1, out['13']);
    writeFileSync(join(R, `${tag}.2x.png`), out['9']);
    if (maxRgb(p1) === 0) throw new Error(`${tag}: BLACK FRAME`);
    writeFileSync(join(R, `${tag}.json`), JSON.stringify({
      tag, subject: 'Seymour (human form, Macalania)', mood: 'courteous and wrong: the serene host in his own temple', seed,
      prompt: positive, negative, model: CKPT, steps: 30, cfg: 6, sampler: 'euler_ancestral', scheduler: 'normal',
      composition: 'hero', facing: 'none', emphasis, canvas: { width: 1344, height: 768 },
      ref: refFiles.map((f) => `docs/concepts/chapters/macalania/production/${f}`), refWeight: ref.weight, refWeightType: ref.type,
      refScaling: 'K+V', refStart: ref.start, refEnd: ref.end, ipadapter: IPA,
      master: { route: 'RealESRGAN_x4plus x4 -> lanczos 0.5', width: 2688, height: 1536 },
      seconds: Math.round((Date.now() - t0) / 1000), generatedAt: new Date().toISOString(),
    }, null, 2) + '\n');
    process.stderr.write(`[macalania] ${tag} done in ${Math.round((Date.now() - t0) / 1000)} s\n`);
  }
}

const [mode, a, b, ...rest] = process.argv.slice(2);
if (mode === 'prompt') {
  console.log(JSON.stringify(prompts(a, b), null, 2));
} else if (mode === 'backdrop') {
  await waitForServer(60_000);
  await runBackdrop([a, b, ...rest].filter(Boolean).length ? [a, b, ...rest].filter(Boolean) : ['540001:0.45', '540002:0.45', '540003:0.55', '540004:0.55']);
} else if (mode === 'hero') {
  await waitForServer(60_000);
  const seeds = [a, b, ...rest].filter(Boolean).map(Number);
  await runHeroPlate(seeds.length ? seeds : [550001, 550002, 550003, 550004]);
} else {
  const sub = SUBJECTS[mode];
  if (!sub || !sub.states[a]) throw new Error(`usage: run.mjs <${Object.keys(SUBJECTS).join('|')}> <state> [seed ...]`);
  await waitForServer(60_000);
  const seeds = [b, ...rest].filter(Boolean).map(Number);
  await runSprite(mode, a, seeds.length ? seeds : sub.states[a].seeds);
}
