#!/usr/bin/env node
/**
 * Chapter XI (Fallen Aeons) hero-plate OPTIONS (FFX-2 only, AGENTS.md rule 14).
 *
 * Exactly the approved hero-plate recipe (public/art/pause/*.json):
 * `tools/gen/comfy.mjs hero` = Animagine XL 4.0, 1344x768, 30 steps, cfg 6,
 * euler_ancestral/normal, composition 'hero' (HERO_COMPOSITION + HERO_NEGATIVE,
 * no rembg), IP-Adapter plus ViT-H on the character's idle at 0.5 linear, 0.25 to
 * 0.85 (the approved FFX-2 plates: ch4-ffx2-bahamut, ch5-ffx2-vegnagun-shuyin,
 * rikku-ffx2, paine). B's subject is the possessed Shiva, so its reference is a
 * head crop of the installed x2-shiva idle at 0.35 ease in, 0.2 to 0.6 (the
 * Macalania / Yojimbo boss-plate setting). The crop lives in scratch (public/art
 * never goes to main): characters/x2-shiva/idle.png (190,80)-(530,420) on violet.
 *
 * Yuna's words: the approved FFX-2 plates plus the White Mage dressphere of this
 * chapter's build (FA4 a; the installed yuna-white-mage idle's own words). Sandy's
 * words: her installed O-1 A idle. The place is the picked O-3 A Road (research §9:
 * floating stone paths over a bright void, the approved Farplane sky and spire).
 * The possessed look is the picked O-2 B (Chapter IV violet). Beats: research
 * ffx2-fallen-aeons.md §6.2 (3, 5, 6).
 *
 * A and C render one figure; the others are composited from their installed
 * idles' own pixels (compose.py), the method r3 way the Yojimbo round settled on.
 *
 *   node docs/concepts/chapters/fallen-aeons/hero-plate/run.mjs <a|b|c>[f] <seed> [...]
 *   (a trailing f forces the reference past the monochrome guard)
 *
 * One prompt at a time; waits while /queue has 3 or more pending. Renders go to
 * D:/Tools/pyrefly-scratch/hero-plates/fallen-aeons/renders/<opt>-<seed>.png (+ .json).
 * Nothing is installed.
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const SCR = 'D:/Tools/pyrefly-scratch/hero-plates/fallen-aeons';
const OUT = `${SCR}/renders`;
const BASE = 'http://127.0.0.1:8188';

const ROAD =
  'the farplane abyss, floating stone paths over a bright pale void, pale violet and mint sky, a distant tall crystal spire, ' +
  'drifting small pale light motes, cool pastel light, soft bokeh background';
const ROAD_NEG = 'flowers, flower field, city, buildings, lanterns, warm light, sunset, fire, butterfly, insect, fairy';

const YUNA_WM =
  '1girl, yuna \\(ff10-2\\), final fantasy x-2, safe, solo, white mage, short brown hair, heterochromia, blue eye, green eye, ' +
  'white hooded robe, hood up, white hood with purple trim, yellow crescent moon pattern on the hood';
const YUNA_NEG =
  'blonde hair, pink hair, red hair, long hair, heart pupils, star pupils, spiral pupils, glowing eyes, second face, two faces, ' +
  'face close behind her, hand near face, fingers in mouth, blush';

export const OPTIONS = {
  // A: "forgive me" (beat 6). Yuna in the White Mage dressphere; the possessed Anima is composited behind her.
  a: {
    name: 'fa-hero-a', subject: 'Yuna asks Anima to forgive her', mood: 'the last of her own aeons',
    tags: YUNA_WM,
    poseTags:
      `${ROAD}, she is on the left side of the frame, empty bright space on the right, three-quarter view, facing right, ` +
      'eyes downcast, brows drawn together, sorrow, mouth closed, grief held in, head and shoulders, arms and hands out of frame, ' +
      'nothing crossing her face',
    emphasis:
      '(white mage, white hooded robe with the hood up:1.35), (eyes downcast, quiet sorrow:1.25), ' +
      '(she is on the left side of the frame, facing right:1.2)',
    negAdd: `${YUNA_NEG}, ${ROAD_NEG}, second character, smile, crying, tears, staff, rod, holding, (pink hood:1.3), pink hoodie, gunner, bare shoulders, sleeveless, halter top`,
    ref: 'public/art/characters/yuna-white-mage/idle.png', refWeight: '0.5', refWeightType: 'linear', refStart: '0.25', refEnd: '0.85',
  },
  // B: the first platform (beat 3). The possessed Shiva, close up, the Chapter IV violet in her eyes.
  b: {
    name: 'fa-hero-b', subject: 'Shiva, fallen, on the first platform', mood: 'an old friend who does not know her',
    tags:
      '1girl, solo, shiva \\(final fantasy\\), final fantasy x-2, aeon, safe, pale blue skin, blue skin, long bright blue dreadlocks, ' +
      'blue dreadlocks tipped with ice crystal spikes, dark blue bodysuit, slim, elegant',
    poseTags:
      `${ROAD}, a dark violet aura around her, violet rim light, glowing violet eyes, possessed, three-quarter view, looking at viewer, ` +
      'cold, expressionless, mouth closed, head and shoulders, upper body, one hand raised near her shoulder, frost in the air',
    emphasis:
      '(long bright blue dreadlocks:1.25), (pale blue skin:1.2), (glowing violet eyes, possessed:1.25), (dark violet aura:1.15)',
    negAdd: `${ROAD_NEG}, 1boy, male, brown hair, blonde hair, white hair, human skin, smile, crown, helmet, horns, weapon, sword, wings`,
    ref: `${SCR}/refs/ref-shiva-head.png`, refWeight: '0.35', refWeightType: 'ease in', refStart: '0.2', refEnd: '0.6',
  },
  // C: the second platform (beat 5). Sandy close up; Cindy and Mindy are composited behind her.
  // No violet here: the picked O-2 B possessed look is Shiva's and Anima's; the Sisters are their O-1 A paintings as installed.
  c: {
    name: 'fa-hero-c', subject: 'The Magus Sisters, fallen, on the second platform', mood: 'three of her own, turned',
    tags:
      '1girl, solo, sandy \\(ff10\\), magus sisters, final fantasy x-2, aeon, safe, slim woman, pale skin, dark red hair, ' +
      'red insect armour modelled on a praying mantis, crimson segmented armour plates, red mantis crest on her head with two thin antennae',
    poseTags:
      `${ROAD}, she is right of centre, ` +
      'empty bright space on the left, three-quarter view, facing left, looking at viewer, haughty, cold, mouth closed, ' +
      'head and shoulders, upper body, arms out of frame',
    emphasis:
      '(red mantis crest with two thin antennae:1.25), (crimson segmented mantis armour:1.2), (dark red hair:1.15), ' +
      '(she is on the right side of the frame, empty space on the left:1.25), (red eyes:1.1)',
    negAdd: `${ROAD_NEG}, 1boy, male, blonde hair, blue armour, wings, smile, grin, weapon, sword, scythe, holding, (glowing eyes:1.3), pink eyes, centered, symmetrical`,
    ref: 'public/art/characters/sandy/idle.png', refWeight: '0.5', refWeightType: 'linear', refStart: '0.25', refEnd: '0.85',
  },
};

// A round 3 (after a 961101, af 961102..961103, a 961104): every base filled the frame with the hood,
// so there was no open space for Anima. a3 asks for the open half explicitly.
OPTIONS.a3 = {
  ...OPTIONS.a, name: 'fa-hero-a3',
  emphasis:
    '(white mage, white hooded robe with the hood up:1.35), (eyes downcast, quiet sorrow:1.25), ' +
    '(she is small in the left third of the frame:1.3), (wide empty bright void on the right half of the frame:1.3)',
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
