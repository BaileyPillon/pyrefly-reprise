#!/usr/bin/env node
/**
 * Chapter XII (Seymour Omnis) hero-plate OPTIONS (FFX only, AGENTS.md rule 14).
 *
 * Exactly the approved hero-plate recipe (public/art/pause/*.json):
 * `tools/gen/comfy.mjs hero` = Animagine XL 4.0, 1344x768, 30 steps, cfg 6,
 * euler_ancestral/normal, composition 'hero' (HERO_COMPOSITION + HERO_NEGATIVE,
 * no rembg). IP-Adapter plus ViT-H:
 *  - Yuna: her idle at 0.5 linear, 0.25 to 0.85 (the approved Yuna and
 *    Chapter II plates, public/art/pause/yuna.json, ch2-yunalesca.json).
 *  - Omnis: a head-and-shoulders crop of the installed Omnis portrait
 *    candidate (public/art/portraits/seymour-omnis.png, drawn from the picked
 *    O-1 A idle) at 0.35 ease in, 0.2 to 0.6 (the Macalania plate's
 *    head-crop setting, public/art/pause/macalania.json).
 * Omnis's words are the installed idle's and portrait's (O-1 A). The garden is
 * the picked O-3 C (deep violet). Scenes: research/ffx-seymour-omnis.md §8.2.
 * A second figure is never asked of the sampler (the Yojimbo round's lesson):
 * the discs and Omnis-behind-Yuna are composited from installed pixels
 * (compose.py).
 *
 *   node docs/concepts/chapters/omnis/hero-plate/run.mjs <a|b|c> <seed> [...]
 *
 * One prompt at a time; waits while /queue has 3 or more pending (running not counted).
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const OUT = 'D:/Tools/pyrefly-scratch/hero-plates/omnis/renders';
const BASE = 'http://127.0.0.1:8188';

const SCENE_NEG =
  'butterfly, insect, wings, fairy, city, buildings, city lights, skyscraper, window, orange bokeh, warm light, sunset, fire';
const GARDEN =
  'a dream realm inside a giant creature, deep violet twilight, cold violet light, a dark crimson sea far behind, ' +
  'floating rock islands far away, small floating glowing green white light orbs, soft bokeh background';
const OMNIS =
  '1boy, seymour guado, final fantasy x, safe, solo, male focus, adult man, final mutated form, pale grey blue skin, ' +
  'long straight light blue hair falling past his shoulders, parted fringe, purple eyes, thin dark veins under his eyes, ' +
  'bare chest with ridged ribs, dark indigo armored shoulder pauldrons with short curved spikes';
const OMNIS_NEG =
  'horns on head, antlers, forehead mark, spiral, facial tattoo, pointy ears, elf ears, crown, helmet, hood, mask, beard, ' +
  'stubble, 1girl, female, lipstick, glowing eyes, neon, spiked hair, hair up, headband, halo, gold crown, ' +
  'bangs, blunt bangs, hair over eyes, feminine, androgynous, girlish, soft face, frills, lace, choker, ' + SCENE_NEG;
const OMNIS_REF = {
  ref: 'docs/concepts/chapters/omnis/hero-plate/refs/omnis-portrait-head.png',
  refWeight: '0.35', refWeightType: 'ease in', refStart: '0.2', refEnd: '0.6',
  // Forced: the monochrome guard reads this crop at 42 % one colour (threshold 40 %)
  // and would render without it (as pilots a-931101..3 did). 0.35 ease in is gentle.
  forceRef: true,
};
// Yuna's identity words and negatives: public/art/pause/yuna.json + ch2-yunalesca.json.
const YUNA =
  '1girl, yuna \\(ff10\\), final fantasy x, safe, solo, dark chestnut brown hair, short bob, one thin plaited tail down her back, ' +
  'heterochromia, green eye, blue eye, white halter top with a high collar, yellow obi sash, long white and blue kimono sleeve, ' +
  'blue beaded earring, fair skin';
const YUNA_NEG =
  'blonde hair, golden hair, dirty blonde, light hair, long hair, windswept hair, cleavage, bare chest, breasts, exposed chest, ' +
  'heart pupils, star pupils, spiral pupils, patterned pupils, glowing pupils, second face, two faces, face close behind her, ' +
  'hand near face, fingers in mouth, blush, pink hair tips, bloom, ' + SCENE_NEG;
const YUNA_REF = {
  ref: 'public/art/characters/yuna/idle.png', refWeight: '0.5', refWeightType: 'linear', refStart: '0.25', refEnd: '0.85',
  forceRef: true,
};

const OPTIONS = {
  // A: the boss, close. He has claimed Sin; calm, cold, certain.
  a: {
    name: 'omnis-hero-a', subject: 'Seymour Omnis in the Garden of Pain', mood: 'he has claimed Sin: calm, cold, certain',
    tags: OMNIS,
    poseTags:
      `${GARDEN}, three-quarter view, looking at viewer, head tilted slightly down, cold smile, half-closed eyes, mouth closed, ` +
      'serene, contemptuous, head and shoulders, long light blue hair framing his face, hands out of frame',
    emphasis: '(adult man, sharp masculine face, forehead showing:1.3), (three-quarter view, face turned to the side:1.15), (long straight sleek light blue hair:1.15), (thin dark veins under his eyes:1.2), (cold smile, half-closed purple eyes:1.2), (dark indigo armored pauldrons with short curved spikes:1.1), (deep violet twilight background:1.15)',
    negAdd: `${OMNIS_NEG}, grin, open mouth, teeth, red light, crimson light`,
    ...OMNIS_REF,
  },
  // B: the pay-off of four Seymour chapters: Yuna finally sends him (research §8.2 beat 5).
  b: {
    name: 'omnis-hero-b', subject: 'Yuna sends him', mood: 'the sending, at last: sorrow and resolve',
    tags: YUNA,
    poseTags:
      'a dream realm inside a giant creature, deep violet twilight, cold violet light, dark violet background, a dark crimson sea far behind, ' +
      'a few tiny glowing green white motes rising, soft bokeh background, she is on the left of the frame, dark empty violet space on the right, ' +
      'three-quarter view, facing right, eyes lowered, looking down, sorrowful, calm resolve, mouth closed, head and shoulders, ' +
      'the high collar of her halter top and the yellow obi sash closing the bottom of the frame, arms and hands out of frame, nothing crossing her face',
    emphasis: '(eyes lowered, quiet sorrowful resolve:1.25), (dark chestnut brown hair:1.3), (dark deep violet twilight background:1.3)',
    negAdd: `${YUNA_NEG}, smile, grin, crying, tears, open mouth, statue, man, 1boy, white background, bright background, bubbles, large orbs, circles, sparkles`,
    ...YUNA_REF,
  },
  // C: the warning. Six hits and he glows red: Dispel, then Ultima (research §4).
  c: {
    name: 'omnis-hero-c', subject: 'Omnis glows red: Ultima is coming', mood: 'the count is full',
    tags: OMNIS,
    poseTags:
      'a deep red glow surrounding him, red rim light along his hair and shoulders, deep violet twilight behind, a dark crimson sea far behind, ' +
      'small floating glowing red light orbs, soft bokeh background, three-quarter view, looking at viewer, cold smile, eyes narrowed, mouth closed, ' +
      'upper body, head and shoulders, long light blue hair falling past his shoulders, imposing, menacing, hands out of frame',
    emphasis: '(a deep red glow surrounding him, red rim light:1.3), (adult man, sharp masculine face, forehead showing:1.3), (long straight sleek light blue hair falling past his shoulders:1.25), (dark indigo armored pauldrons with short curved spikes:1.1)',
    negAdd: `${OMNIS_NEG}, grin, open mouth, teeth, weapon, staff, sword, short hair, old man, wrinkles, face paint, red markings on face, from below`,
    ...OMNIS_REF,
  },
};

async function pending() {
  const q = await (await fetch(`${BASE}/queue`)).json();
  return q.queue_pending.length; // the brief: submit only when fewer than 3 are pending
}

const [opt, ...seeds] = process.argv.slice(2);
const o = OPTIONS[opt];
if (!o || seeds.length === 0) {
  console.error('usage: run.mjs <a|b|c> <seed> [...]');
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });
for (const seed of seeds) {
  while ((await pending()) >= 3) await new Promise((r) => setTimeout(r, 10000));
  const args = ['tools/gen/comfy.mjs', 'hero', '--name', o.name, '--subject', o.subject, '--mood', o.mood,
    '--tags', o.tags, '--poseTags', o.poseTags, '--emphasis', o.emphasis, '--negAdd', o.negAdd,
    '--ref', o.ref, '--refWeight', o.refWeight, '--refWeightType', o.refWeightType,
    '--refStart', o.refStart, '--refEnd', o.refEnd, '--seed', seed, '--out', join(OUT, `${opt}-${seed}.png`)];
  if (o.forceRef) args.push('--forceRef');
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
