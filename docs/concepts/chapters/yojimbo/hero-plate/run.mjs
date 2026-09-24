#!/usr/bin/env node
/**
 * Chapter IX (Yojimbo) hero-plate OPTIONS (FFX only, AGENTS.md rule 14).
 *
 * Exactly the approved hero-plate recipe (public/art/pause/*.json):
 * `tools/gen/comfy.mjs hero` = Animagine XL 4.0, 1344x768, 30 steps, cfg 6,
 * euler_ancestral/normal, composition 'hero' (HERO_COMPOSITION + HERO_NEGATIVE,
 * no rembg), IP-Adapter plus ViT-H on the character's idle at 0.5 linear,
 * 0.25 to 0.85 (the approved Lulu / Yuna / Tidus plates). Option B's subject
 * is Yojimbo, so its reference is an upper-body crop of the installed
 * yojimbo-cavern idle at 0.35 ease in, 0.2 to 0.6 (the Macalania plate's
 * head-crop setting).
 *
 * Lulu's identity words and negatives are copied from her approved plate
 * (public/art/pause/lulu.json). The chamber is the picked O-4 A (cold grey-blue
 * stone, a shaft of daylight). The scenes follow research/ffx-yojimbo.md §6.
 *
 *   node docs/concepts/chapters/yojimbo/hero-plate/run.mjs <a|b|c> <seed> [...]
 *
 * One prompt at a time; waits while /queue has 3 or more pending. Renders go
 * to D:/Tools/pyrefly-scratch/yoj-hero/renders/<opt>-<seed>.png (+ .json).
 * Nothing is installed.
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const OUT = 'D:/Tools/pyrefly-scratch/yoj-hero/renders';
const BASE = 'http://127.0.0.1:8188';

const LULU =
  '1girl, lulu (ff10), final fantasy x, safe, solo, black hair, elaborate braided updo, black beads in hair, ' +
  'crimson red eyes, dark lipstick, pale skin, black belt dress, thick fur collar, blue bead earring, mature female';
const SCENE_NEG = 'butterfly, insect, wings, fairy, city, buildings, city lights, skyscraper, window, orange bokeh';
const LULU_NEG =
  'moustache, dark stroke above the lip, smudge on the face, mark above the mouth, hair across the eye, ' +
  'hair over the eye, strands crossing the face, malformed iris, misshapen pupil, pink hair, blonde hair, ' +
  'two-tone hair, heart pupils, star pupils, spiral pupils, warm amber bokeh, candlelight, ' + SCENE_NEG;
const CHAMBER =
  'dark cave chamber, cavern, rough rock walls, cold grey blue stone, a pale shaft of daylight from above, cold blue gloom, soft bokeh background';
const LULU_REF = {
  ref: 'public/art/characters/lulu/idle.png', refWeight: '0.5', refWeightType: 'linear', refStart: '0.25', refEnd: '0.85',
};

const OPTIONS = {
  // A: the recognition. Lulu, sorrowful, the unsent Lady Ginnem forming from pyreflies behind her.
  a: {
    name: 'yoj-hero-a', subject: 'Lulu and the unsent Lady Ginnem', mood: 'recognition and grief: she was too young',
    tags: LULU,
    poseTags:
      `a pale translucent ghostly woman with a white painted face and golden hair ornaments, spirit, ghost, translucent, ` +
      `standing in the shadows behind her on the right, small floating glowing pale blue light orbs, ${CHAMBER}, three-quarter view, eyes downcast, ` +
      'sorrowful, brows drawn together, mouth closed, grief held in, head and shoulders, hands out of frame, both eyes fully drawn and unobstructed',
    emphasis:
      '(eyes downcast, quiet sorrow:1.25), (a pale translucent ghost of a woman with a white painted face standing behind her:1.35), ' +
      '(black beaded braids falling clear of her face:1.2)',
    negAdd: `${LULU_NEG}, smile, smirk, grin, crying, tears, second face, face close behind her, warm light`,
    ...LULU_REF,
  },
  // B: the boss. Yojimbo in the cold chamber, the katana leaving its scabbard (Zanmato).
  b: {
    name: 'yoj-hero-b', subject: 'Yojimbo drawing Zanmato', mood: 'the price is paid: one cut',
    tags:
      '1boy, solo, male focus, samurai, aeon, final fantasy x, safe, gold embossed jingasa war hat, wide conical hat, ' +
      'fanged menpo face mask, gold armor, large gold pauldrons with spiral patterns, purple robes, orange sash, sheathed katana',
    poseTags:
      `drawing sword, iaido, hand on the katana hilt, blade half drawn from the scabbard, a bright cold glint of steel along the blade, ` +
      `${CHAMBER}, small floating glowing pale blue light orbs, three-quarter view, looking at viewer, masked face in shadow under the hat brim, ` +
      'head and shoulders, upper body, imposing, still, menacing',
    emphasis:
      '(a katana blade half drawn from its scabbard with a bright steel glint:1.3), (fanged menpo mask under a wide gold jingasa hat:1.2)',
    negAdd: 'girl, female, bare face, human face, smile, helmet, horns, crown, two swords, multiple swords, warm light, sunset, fire, ' + SCENE_NEG,
    ref: 'docs/concepts/chapters/yojimbo/hero-plate/refs/yojimbo-upper-square.png',
    refWeight: '0.35', refWeightType: 'ease in', refStart: '0.2', refEnd: '0.6',
  },
  // C: the last duty. Lulu resolute, Yojimbo's silhouette looming behind her.
  c: {
    name: 'yoj-hero-c', subject: "Lulu, her last duty as Ginnem's guardian", mood: 'resolve: I will do this myself',
    tags: LULU,
    poseTags:
      `a huge dark silhouette of a samurai in a wide conical hat with a glint of gold looming behind her, backlit, ${CHAMBER}, ` +
      'three-quarter view, chin lowered, eyes narrowed, resolute, jaw set, mouth closed, staring ahead, head and shoulders, hands out of frame, ' +
      'both eyes fully drawn and unobstructed',
    emphasis:
      '(eyes narrowed, resolute stare:1.25), (a huge dark samurai silhouette in a wide conical hat looming behind her:1.25), ' +
      '(black beaded braids falling clear of her face:1.2)',
    negAdd: `${LULU_NEG}, smile, smirk, grin, crying, tears, second face, face close behind her, warm light`,
    ...LULU_REF,
  },
};

// Round 2 (after round 1's look): the second figure's words bound to Lulu (A
// painted her face white; C put the samurai hat on her head; "ghost" drew
// sheet ghosts). So A and C render Lulu ALONE with room on the left, and the
// figure behind her is composited from its installed idle pixels
// (compose.py), the method r3 way: derive from existing pixels, do not ask
// the sampler to remember them.
OPTIONS.a2 = {
  ...OPTIONS.a, name: 'yoj-hero-a2',
  poseTags:
    `${CHAMBER}, small floating glowing pale blue light orbs, she is on the right side of the frame, empty dark cave space on the left, ` +
    'three-quarter view, facing left, eyes downcast, looking down to the left, sorrowful, brows drawn together, mouth closed, grief held in, ' +
    'head and shoulders, hands out of frame, both eyes fully drawn and unobstructed',
  emphasis: '(eyes downcast, quiet sorrow:1.25), (clear crimson red eyes, both eyes fully visible:1.2), (black beaded braids falling clear of her face:1.25)',
  negAdd: `${LULU_NEG}, smile, smirk, grin, crying, tears, second face, ghost, warm light, hat`,
};
OPTIONS.c2 = {
  ...OPTIONS.c, name: 'yoj-hero-c2',
  poseTags:
    `${CHAMBER}, she is on the right side of the frame, empty dark cave space on the left, ` +
    'three-quarter view, facing left, chin lowered, eyes narrowed, resolute, jaw set, mouth closed, staring ahead, ' +
    'head and shoulders, hands out of frame, both eyes fully drawn and unobstructed',
  emphasis: '(eyes narrowed, resolute stare:1.25), (clear crimson red eyes, both eyes fully visible:1.25), (black beaded braids falling clear of her face:1.25)',
  negAdd: `${LULU_NEG}, smile, smirk, grin, crying, tears, second face, warm light, hat`,
};

// Round 3: A and C derived from Lulu's APPROVED plate pixels (method r3):
// img2img on public/art/pause/lulu.png, so her face, braids and fur collar
// start on the bar; only the light, the chamber and the expression change.
// The denoise is the 3rd argv form "<seed>@<denoise>".
const LULU_PLATE = 'public/art/pause/lulu.png';
OPTIONS.a3 = { ...OPTIONS.a2, name: 'yoj-hero-a3', img2img: LULU_PLATE };
OPTIONS.c3 = { ...OPTIONS.c2, name: 'yoj-hero-c3', img2img: LULU_PLATE };

// Round 4: every earlier render ran WITHOUT its reference. The monochrome guard
// (tools/gen/comfy.mjs, added 2026-09-21, after the approved plates) skipped
// Lulu's idle (top-2 share 0.46, the very case it was calibrated on) and the
// white-padded Yojimbo crop (0.73). b4 uses a tight crop of the idle's hat, mask
// and pauldron with no white; a4 forces Lulu's idle at the approved plate's 0.5
// (the recipe of public/art/pause/lulu.json) to compare with the guard's choice.
OPTIONS.b4 = { ...OPTIONS.b, name: 'yoj-hero-b4', ref: 'docs/concepts/chapters/yojimbo/hero-plate/refs/yojimbo-head-tight.png' };
OPTIONS.a4 = { ...OPTIONS.a2, name: 'yoj-hero-a4', forceRef: true };

async function pending() {
  const q = await (await fetch(`${BASE}/queue`)).json();
  return q.queue_pending.length + q.queue_running.length;
}

const [opt, ...seeds] = process.argv.slice(2);
const o = OPTIONS[opt];
if (!o || seeds.length === 0) {
  console.error('usage: run.mjs <a|b|c|a2|c2|a3|c3|a4|b4> <seed> [...]');
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });
for (const spec of seeds) {
  const [seed, denoise] = spec.split('@');
  while ((await pending()) >= 3) await new Promise((r) => setTimeout(r, 10000));
  const args = ['tools/gen/comfy.mjs', 'hero', '--name', o.name, '--subject', o.subject, '--mood', o.mood,
    '--tags', o.tags, '--poseTags', o.poseTags, '--emphasis', o.emphasis, '--negAdd', o.negAdd,
    '--ref', o.ref, '--refWeight', o.refWeight, '--refWeightType', o.refWeightType,
    '--refStart', o.refStart, '--refEnd', o.refEnd, '--seed', seed, '--out', join(OUT, `${opt}-${spec.replace('@', '-d')}.png`)];
  if (o.forceRef) args.push('--forceRef');
  if (o.img2img) args.push('--img2img', o.img2img, '--denoise', denoise || '0.55');
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
