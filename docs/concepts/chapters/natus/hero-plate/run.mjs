#!/usr/bin/env node
/**
 * Chapter X (Seymour Natus) hero-plate OPTIONS (FFX only, AGENTS.md rule 14).
 *
 * Exactly the approved hero-plate recipe (public/art/pause/*.json):
 * `tools/gen/comfy.mjs hero` = Animagine XL 4.0, 1344x768, 30 steps, cfg 6,
 * euler_ancestral/normal, composition 'hero' (HERO_COMPOSITION + HERO_NEGATIVE,
 * no rembg), IP-Adapter plus ViT-H on the character's idle at the approved
 * plate's weight (Kimahri 0.55, Yuna 0.5; linear, 0.25 to 0.85). B's subject is
 * Natus, so its reference is a head crop of his installed portrait at 0.35 ease
 * in, 0.2 to 0.6 (the Macalania / Yojimbo boss-plate setting). The crop lives in
 * scratch (public/art never goes to main): portraits/seymour-natus.png (130,200)-(730,800).
 *
 * Identity words are copied from the approved plates (public/art/pause/kimahri.json,
 * yuna.json) and from Natus's O-1 A recipe (docs/concepts/chapters/natus/recipes.json
 * natus-a4). The place is the picked O-3 C: the Highbridge at night with the city lit.
 * Beats: research/ffx-seymour-natus-highbridge.md §8.2 (7 to 9).
 *
 * A and C render the party member ALONE with room on one side; Natus and Mortibody
 * are composited from their installed idles' own pixels (compose.py), the method r3
 * way the Yojimbo round settled on (a second figure asked of the sampler binds to
 * the first).
 *
 *   node docs/concepts/chapters/natus/hero-plate/run.mjs <a|b|c>[f] <seed> [...]
 *   (a trailing f forces the reference past the monochrome guard)
 *
 * One prompt at a time; waits while /queue has 3 or more pending. Renders go to
 * D:/Tools/pyrefly-scratch/hero-plates/natus/renders/<opt>-<seed>.png (+ .json).
 * Nothing is installed.
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const SCR = 'D:/Tools/pyrefly-scratch/hero-plates/natus';
const OUT = `${SCR}/renders`;
const BASE = 'http://127.0.0.1:8188';

const NIGHT =
  'night, deep blue night sky, the holy city of bevelle behind, tall crimson and gold temple spires with warm gold lit windows, ' +
  'lanterns along a long stone bridge, warm gold lights reflected in dark water, soft bokeh background';
const NIGHT_NEG = 'daylight, sun, sunset, modern city, skyscraper, cars, neon, butterfly, insect, wings, fairy';

const KIMAHRI =
  '1other, kimahri ronso, final fantasy x, safe, solo, anthro, blue lion man, broad furry snout, wide flat feline nose, whiskers, ' +
  'short blue fur, pale white mane, yellow eyes, bare face, simple leather harness on his chest';
const KIMAHRI_NEG =
  'muzzle, muzzle cage, cage over the snout, grille, bridle, strap over the nose, gag, mask, face armor, helmet, two horns, long horn, ' +
  'tall horn, curved horn, intact horn, antlers, horn ornament, gold horn cap, human face, human nose, elf ears, blonde hair, gold ornament, cluttered';
const YUNA =
  '1girl, yuna \\(ff10\\), final fantasy x, safe, solo, dark chestnut brown hair, short bob, one thin plaited tail down her back, ' +
  'heterochromia, green eye, blue eye, white halter top with a high collar, yellow obi sash, long white and blue kimono sleeve, ' +
  'blue beaded earring, fair skin';
const YUNA_NEG =
  'blonde hair, golden hair, dirty blonde, light hair, long hair, windswept hair, cleavage, bare chest, breasts, exposed chest, ' +
  'plain gradient background, empty background, floating ribbon, unresolved shape, abstract swoop, heart pupils, star pupils';

export const OPTIONS = {
  // A: Kimahri's stand (beat 8). Natus is composited behind him on the right.
  a: {
    name: 'natus-hero-a', subject: "Kimahri's stand on the Highbridge", mood: 'he will not let Seymour pass',
    tags: KIMAHRI,
    poseTags:
      `${NIGHT}, he is on the left side of the frame, empty dark night space on the right, from side, three-quarter view, facing right, ` +
      'looking to the right, eyes narrowed, glaring, fierce, jaw set, mouth closed, one short broken horn stub, head and shoulders, arms out of frame',
    emphasis:
      '(a blue lion man with a broad furry snout and whiskers:1.25), (one short broken horn stub:1.25), (fierce narrowed glare:1.2), ' +
      '(he is on the left side of the frame, facing right:1.25)',
    negAdd: `${KIMAHRI_NEG}, ${NIGHT_NEG}, second character, spear, smile, smirk, facing viewer, front view, centered, symmetrical`,
    ref: 'public/art/characters/kimahri/idle.png', refWeight: '0.55', refWeightType: 'linear', refStart: '0.25', refEnd: '0.85',
  },
  // B: the boss. Natus born of the pyreflies, his stone ring behind his head.
  b: {
    name: 'natus-hero-b', subject: 'Seymour Natus, born of the pyreflies', mood: 'death offered as a mercy',
    tags:
      '1boy, solo, male focus, seymour guado, final fantasy x, safe, demonic transformed form, pale ashen lavender grey skin, ' +
      'silver white hair swept up into a tall spiked crest, purple eyes, dark veins on his face, bare chest with ridged ribs, ' +
      'broad violet armored pauldrons',
    poseTags:
      `a huge round carved grey stone ring behind his head, ${NIGHT}, small floating glowing pale light orbs rising around him, ` +
      'three-quarter view, looking at viewer, cold smile, half-closed eyes, serene, imposing, head and shoulders, upper body, arms out of frame',
    emphasis:
      '(silver white hair swept up and back into a tall spiked crest:1.3), (a huge round carved grey stone ring standing behind him, a stone wheel larger than his body:1.4), (cold serene smile:1.1)',
    negAdd: `${NIGHT_NEG}, girl, female, light blue hair, blue skin, long straight hair, helmet, crown, (horns:1.3), ram horns, curled horns, spikes on shoulders, glowing chest, spiked halo, crown of spikes, spiked collar, long straight hair falling forward, sword, weapon, staff, bird wings, angel, halo of light`,
    ref: `${SCR}/refs/ref-natus-head.png`, refWeight: '0.35', refWeightType: 'ease in', refStart: '0.2', refEnd: '0.6',
  },
  // C: the turn back (beat 9). Yuna stops and turns round; Natus and Mortibody are composited behind.
  c: {
    name: 'natus-hero-c', subject: 'Yuna turns back on the bridge', mood: 'we go back together',
    tags: YUNA,
    poseTags:
      `${NIGHT}, she is on the right side of the frame, empty dark night space on the left, three-quarter view, facing left, ` +
      'looking back over her shoulder, chin lifted, eyes steady, resolute, quiet resolve, mouth closed, head and shoulders, ' +
      'arms and hands out of frame, nothing crossing her face',
    emphasis:
      '(dark chestnut brown hair:1.3), (looking back over her shoulder with quiet resolve:1.25), (night city lights behind her:1.1), ' +
      '(she is on the right side of the frame, empty space on the left:1.25)',
    negAdd: `${YUNA_NEG}, ${NIGHT_NEG}, second character, smile, crying, tears, (hand near face:1.3), finger to lips, finger on lips, fingers in mouth, hand on chin, hands`,
    ref: 'public/art/characters/yuna/idle.png', refWeight: '0.5', refWeightType: 'linear', refStart: '0.25', refEnd: '0.85',
  },
};

// B round 2 (after b 952101..952106): every "ring" phrase was drawn as a shield held in
// front of him, a halo of spikes, or a gold disc (two failures, rule 15). So the ring is
// not asked of the sampler any more: b2 renders Natus with open night sky behind his head,
// and compose.py sets the installed ring layer (characters/seymour-natus-ring) behind him.
OPTIONS.b2 = {
  ...OPTIONS.b, name: 'natus-hero-b2',
  poseTags:
    `open night sky behind his head, ${NIGHT}, small floating glowing pale light orbs rising around him, ` +
    'three-quarter view, looking at viewer, cold smile, half-closed eyes, serene, imposing, head and shoulders, upper body, arms out of frame, ' +
    'he is slightly left of centre',
  emphasis: '(silver white hair swept up and back into a tall spiked crest:1.3), (cold serene smile:1.15), (pale ashen lavender grey skin:1.15)',
  negAdd: OPTIONS.b.negAdd + ', ring, disc, wheel, shield, circle, holding, hands',
};

async function pending() {
  const q = await (await fetch(`${BASE}/queue`)).json();
  return q.queue_pending.length + q.queue_running.length;
}

const [opt, ...seeds] = process.argv.slice(2);
const o = OPTIONS[(opt || '').replace(/f$/, '')];
if (!o || seeds.length === 0) {
  console.error('usage: run.mjs <a|b|c>[f] <seed> [...]');
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });
for (const seed of seeds) {
  while ((await pending()) >= 3) await new Promise((r) => setTimeout(r, 10000));
  const args = ['tools/gen/comfy.mjs', 'hero', '--name', o.name, '--subject', o.subject, '--mood', o.mood,
    '--tags', o.tags, '--poseTags', o.poseTags, '--emphasis', o.emphasis, '--negAdd', o.negAdd,
    '--ref', o.ref, '--refWeight', o.refWeight, '--refWeightType', o.refWeightType,
    '--refStart', o.refStart, '--refEnd', o.refEnd, '--seed', seed, '--out', join(OUT, `${opt}-${seed}.png`)];
  if (opt.endsWith('f')) args.push('--forceRef');
  const r = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
