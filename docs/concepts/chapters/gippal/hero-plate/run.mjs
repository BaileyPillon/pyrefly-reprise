#!/usr/bin/env node
/**
 * Chapter XV (The Den of Woe) hero-plate OPTIONS (FFX-2 only, AGENTS.md rule 14).
 *
 * Exactly the approved hero-plate recipe (public/art/pause/*.json):
 * `tools/gen/comfy.mjs hero` = Animagine XL 4.0, 1344x768, 30 steps, cfg 6,
 * euler_ancestral/normal, composition 'hero' (HERO_COMPOSITION + HERO_NEGATIVE,
 * no rembg), IP-Adapter plus ViT-H on the character's own art.
 *
 * Gippal is rendered as the man, opaque and in full colour, in the picked O-3 A cold
 * blue Den; the picked O-1 B shade treatment ("translucent, lit from within") is then
 * applied to his matte from the options round's own code (compose.py), never asked of
 * the sampler (the Yojimbo round: "ghost" draws sheet ghosts). His words are the
 * installed shade idle's; the reference is a square head crop of the opaque painting
 * that idle was derived from (gippal-a2, seed 951102), flattened on the Den backdrop.
 * Paine's words and reference are her approved plate's (public/art/pause/paine.json).
 *
 *   node docs/concepts/chapters/gippal/hero-plate/run.mjs <opt> <seed> [...]
 *
 * One prompt at a time; waits while /queue has 3 or more pending. Renders go to
 * D:/Tools/pyrefly-scratch/hero-plates/gippal/renders/<opt>-<seed>.png (+ .json).
 * Nothing is installed.
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const OUT = 'D:/Tools/pyrefly-scratch/hero-plates/gippal/renders';
const BASE = 'http://127.0.0.1:8188';

const GIPPAL =
  '1boy, solo, gippal, final fantasy x-2, safe, male focus, young man, al bhed, short spiky blond hair, black eyepatch over his right eye, ' +
  'green eyes, spiral pupils, blue jumpsuit, purple overalls, grey metal armour plates on his shoulders and chest';
const DEN =
  'dark natural cave, rough rock walls, cold blue light, deep shadow, small floating soft glowing pale blue orbs of light, faint mist, soft bokeh background';
const SCENE_NEG =
  'warm light, orange light, red light, sunset, fire, city lights, buildings, window, butterfly, insect, wings, fairy, ' +
  'huge glowing orbs, star shaped sparkle, lens flare';
const GIPPAL_NEG =
  '1girl, long hair, hat, helmet, goggles on eyes, sunglasses, eyepatch on the left eye, two eyepatches, scar, facial tattoo, ' +
  'huge weapon, oversized weapon, giant blade, sword, katana, smile, grin, ' + SCENE_NEG;
const GIPPAL_REF = {
  ref: 'docs/concepts/chapters/gippal/hero-plate/refs/gippal-head-square.png',
  refWeight: '0.35', refWeightType: 'ease in', refStart: '0.2', refEnd: '0.6',
};

const PAINE =
  '1girl, paine (ff10-2), final fantasy x-2, safe, solo, very short spiked silver hair standing up in sharp points, red eyes, pale skin, ' +
  'angular face, sharp jaw, mature female, plain black leather bustier, plain silver studded collar';
const PAINE_NEG =
  'eye shadow, heavy makeup, red eye makeup, facial mark, spiked ball, floating spikes, glowing orbs, mohawk, ' +
  'fangs, sharp teeth, open mouth, grin, grinning, laughing, spiked pauldron, shoulder armour, spikes, skull pauldron, blush, sparkles, ' +
  'long hair, bloom, smile, crying, tears, second face, face close behind her, ' + SCENE_NEG;

const OPTIONS = {
  // A: Gippal's shade alone, his anger (the scan text: his anger fused with pyreflies).
  a: {
    subject: "Gippal's shade", mood: 'anger two years old, made of pyreflies',
    tags: GIPPAL,
    poseTags:
      `${DEN}, he is on the right side of the frame, three-quarter view, facing left, looking at viewer, angry glare, scowl, ` +
      'brows drawn down hard, mouth closed, jaw clenched, head and shoulders, hands out of frame',
    emphasis: '(black eyepatch over his right eye:1.3), (short spiky blond hair:1.2), (angry glare, jaw clenched:1.25)',
    negAdd: GIPPAL_NEG,
    ...GIPPAL_REF,
  },
  // B: the three shades as one idea. Gippal at the centre, facing out; Baralai (sorrow)
  // and Nooj (despair) are composited either side from their installed shade idles.
  b: {
    subject: 'The three shades: Baralai, Gippal, Nooj', mood: 'sorrow, anger, despair: one wound',
    tags: GIPPAL,
    poseTags:
      `${DEN}, he is in the centre of the frame, dark empty cave space on both sides, facing viewer, looking at viewer, ` +
      'cold hard stare, brows drawn, mouth closed, head and shoulders, hands out of frame',
    emphasis: '(black eyepatch over his right eye:1.3), (short spiky blond hair:1.2), (cold hard stare:1.2)',
    negAdd: GIPPAL_NEG,
    ...GIPPAL_REF,
  },
  // C: Paine, the squad's sphere recorder (research §2), with her old comrades' shades
  // composited behind her on the left from their installed idles.
  c: {
    subject: 'Paine and the shades of her squad', mood: 'the recorder faces what she recorded',
    tags: PAINE,
    poseTags:
      'dark rough rock cave wall, cold grey blue light, soft bokeh background, she is on the right side of the frame, ' +
      'dark empty cave space on the left, three-quarter view, facing left, ' +
      'eyes lowered, guarded expression, grief held in, brows drawn, mouth closed, lips together, head and shoulders, hands out of frame',
    emphasis: '(very short spiked silver hair standing up in sharp points:1.25), (eyes lowered, grief held in:1.2)',
    negAdd: PAINE_NEG,
    ref: 'public/art/characters/paine-warrior/idle.png',
    refWeight: '0.5', refWeightType: 'linear', refStart: '0.25', refEnd: '0.85',
  },
};

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
  const args = ['tools/gen/comfy.mjs', 'hero', '--name', `den-hero-${opt}`, '--subject', o.subject, '--mood', o.mood,
    '--tags', o.tags, '--poseTags', o.poseTags, '--emphasis', o.emphasis, '--negAdd', o.negAdd,
    '--ref', o.ref, '--refWeight', o.refWeight, '--refWeightType', o.refWeightType,
    '--refStart', o.refStart, '--refEnd', o.refEnd, '--seed', seed, '--out', join(OUT, `${opt}-${seed}.png`)];
  if (o.forceRef) args.push('--forceRef');
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
