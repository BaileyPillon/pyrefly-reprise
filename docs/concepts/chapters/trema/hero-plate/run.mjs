#!/usr/bin/env node
/**
 * Chapter XIII (Trema) hero-plate OPTIONS (FFX-2 only, AGENTS.md rule 14).
 *
 * Exactly the approved hero-plate recipe (public/art/pause/*.json):
 * `tools/gen/comfy.mjs hero` = Animagine XL 4.0, 1344x768, 30 steps, cfg 6,
 * euler_ancestral/normal, composition 'hero' (HERO_COMPOSITION + HERO_NEGATIVE,
 * no rembg), IP-Adapter plus ViT-H on the character's own art.
 *
 * Trema's words are the installed CANDIDATE idle's truth (public/art/characters/
 * trema/idle.png, the O-1 A pick): what the pixels show, not the options prompt.
 * Reference: a square crop of that idle's head (method F: CLIP-Vision centre-crops,
 * so a tall idle is never handed over whole), flattened on a blurred crop of the
 * Via Infinito backdrop (a flat pad made the monochrome guard skip it: 75 %).
 * Yuna's words and reference are her approved FFX-2 plate's (public/art/pause/
 * yuna-ffx2.json). The hall is the picked O-3 B (teal, white banners, cold lamps).
 *
 *   node docs/concepts/chapters/trema/hero-plate/run.mjs <opt> <seed> [...]
 *
 * One prompt at a time; waits while /queue has 3 or more pending. Renders go
 * to D:/Tools/pyrefly-scratch/hero-plates/trema/renders/<opt>-<seed>.png (+ .json).
 * Nothing is installed.
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const OUT = 'D:/Tools/pyrefly-scratch/hero-plates/trema/renders';
const BASE = 'http://127.0.0.1:8188';

const TREMA =
  '1boy, solo, male focus, very old man, elderly yevon priest, final fantasy x-2, safe, frail thin face, deep wrinkles, ' +
  'grey green skin, thin white moustache, long thin white beard, long straight white hair falling behind his shoulders, ' +
  'tall black eboshi, tall hat, white band around the base of the hat, white priest robe, red stole edged in black, ' +
  'gold crest with a round red disc on the stole';
const HALL =
  'vast underground cloister hall, dark teal and slate blue stone, long white cloth banners with a black emblem hanging from the vaults, ' +
  'narrow white lamp panels set in the dark teal walls, cold teal light, a few tiny drifting pale green motes of light, soft bokeh background';
const SCENE_NEG = 'huge glowing orbs, large light circles, star shaped sparkle, lens flare, multicolored lamps, pink lamps, butterfly, insect, wings, fairy, city lights, skyscraper, window, warm light, orange bokeh, sunset, fire, halo';
const TREMA_NEG =
  'young, youthful face, smooth skin, 1girl, hood, crown, mitre, bishop mitre, top hat, hat brim, fedora, straw hat, conical hat, wide brim, ' +
  'blonde hair, brown hair, pink skin, tan skin, military uniform, armor, glasses, glowing eyes, staff, sword, ' +
  'cross, crucifix, christian cross, red banners, red curtains, front view, straight-on, facing viewer, symmetrical, ' + SCENE_NEG;
const TREMA_EMPH =
  '(grey green wrinkled skin:1.3), (tall black eboshi hat with a white band:1.25), (long thin white beard:1.2), ' +
  '(white priest robe with a red stole:1.25)';
const TREMA_REF = {
  ref: 'docs/concepts/chapters/trema/hero-plate/refs/trema-head-square.png',
  refWeight: '0.35', refWeightType: 'ease in', refStart: '0.2', refEnd: '0.6',
};

const YUNA =
  '1girl, yuna (ff10-2), final fantasy x-2, safe, solo, brown hair, one very long thin brown braid hanging down past her waist, ' +
  'heterochromia, green eye, blue eye, gunner dressphere, white halter top, pink trimmed hood down on her back, blue arm bracer, al bhed pendant';
const YUNA_NEG =
  'short bob, uniform bob, bobbed hair, no braid, hood up, blonde hair, two colours in one eye, blush, heavy blush, pink cheeks, ' +
  'malformed hand, extra fingers, huge gun, rifle, cropped head, overexposed, oversaturated, clipped highlights, bloom, smile, grin, ' +
  'facial mark, face paint, facial tattoo, spiral pupils, patterned pupils, ornate pillars, stained glass, old man, beard, hat, one eye closed, winking, looking at viewer, facing viewer, front view, capelet, white cape, ' + SCENE_NEG;

const OPTIONS = {
  // A: Trema alone on Cloister 100, the gesture of his idle, certain of himself.
  a: {
    subject: 'Trema on Cloister 100', mood: 'calm certainty: he has waited a thousand years for this',
    tags: TREMA,
    poseTags:
      `${HALL}, he is on the right side of the frame, three-quarter view, facing left, head and shoulders, ` +
      'one hand raised at shoulder height with the palm open, looking at viewer, eyes half closed, calm and certain, faint thin smile, mouth closed',
    emphasis: `${TREMA_EMPH}, (calm certain faint smile, half-closed eyes:1.2)`,
    negAdd: `${TREMA_NEG}, open mouth, teeth, angry, shouting`,
    ...TREMA_REF,
  },
  // B: Trema standing over the beaten Paragon. He is rendered alone, looking down to the
  // lower right; Paragon's gold armour is composited there from its idle's pixels
  // (compose.py), breaking into pyreflies (research §2 step 2).
  b: {
    subject: 'Trema over the fallen Paragon', mood: 'contempt: the old man breaks the champion into pyreflies',
    tags: TREMA,
    poseTags:
      `${HALL}, pale green glowing orbs of light rising from below, he is on the left side of the frame, empty space at the lower right, ` +
      'three-quarter view, facing right, from below, looking down to the lower right, cold contempt, eyes narrowed, mouth closed, ' +
      'head and shoulders, hands out of frame',
    emphasis: `${TREMA_EMPH}, (looking down with cold contempt:1.25), (ivory white coat:1.3)`,
    negAdd: `${TREMA_NEG}, smile, open mouth, teeth, monster, beast, animal, black coat, black robe, black cloak`,
    ...TREMA_REF,
  },
  // C: Yuna facing Trema. Yuna is rendered alone on the left, looking right; Trema's
  // upper body is composited behind on the right from his idle's pixels.
  c: {
    subject: 'Yuna facing Trema', mood: 'resolve: she will not let him rewrite Spira',
    tags: YUNA,
    poseTags:
      `dark teal cloister hall, cold teal light, deep shadow, soft bokeh background, she is on the left side of the frame, empty dark cloister space on the right, three-quarter view, facing right, ` +
      'from side, looking away to the right, both eyes open, brows drawn, eyes narrowed, mouth closed, resolute, jaw set, head and shoulders, hands out of frame, ' +
      'the long braid clearly visible falling behind her shoulder',
    emphasis: '(brows drawn, resolute stare to the right:1.25), (blue right eye:1.3), (green left eye:1.3), (one very long thin brown braid:1.2)',
    negAdd: YUNA_NEG,
    ref: 'public/art/characters/yuna-gunner/idle.png',
    refWeight: '0.35', refWeightType: 'linear', refStart: '0.25', refEnd: '0.85',
  },
};

// The monochrome guard skips Trema's head crop (61 % on the backdrop pad; his idle is
// white robe and black hat). 'f' variants force it at the options' ease-in 0.35, to
// compare with the guard's choice as the Yojimbo round did (a4).
for (const k of ['a', 'b']) OPTIONS[`${k}f`] = { ...OPTIONS[k], forceRef: true };

async function pending() {
  const q = await (await fetch(`${BASE}/queue`)).json();
  // The brief's gate, read literally: submit while fewer than 3 jobs are PENDING (the
  // running one is not pending), polled every 3 s. Counting running + pending (the other
  // hero-plate scripts' gate) never opened: one agent keeps 3 pending behind 1 running.
  return q.queue_pending.length;
}

const [opt, ...seeds] = process.argv.slice(2);
const o = OPTIONS[opt];
if (!o || seeds.length === 0) {
  console.error(`usage: run.mjs <${Object.keys(OPTIONS).join('|')}> <seed> [...]`);
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });
for (const seed of seeds) {
  while ((await pending()) >= 3) await new Promise((r) => setTimeout(r, 3000));
  const args = ['tools/gen/comfy.mjs', 'hero', '--name', `trema-hero-${opt}`, '--subject', o.subject, '--mood', o.mood,
    '--tags', o.tags, '--poseTags', o.poseTags, '--emphasis', o.emphasis, '--negAdd', o.negAdd,
    '--ref', o.ref, '--refWeight', o.refWeight, '--refWeightType', o.refWeightType,
    '--refStart', o.refStart, '--refEnd', o.refEnd, '--seed', seed, '--out', join(OUT, `${opt}-${seed}.png`)];
  if (o.forceRef) args.push('--forceRef');
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
