#!/usr/bin/env node
/**
 * Chapter XIV (Isaaru) hero-plate OPTIONS (FFX only, AGENTS.md rule 14).
 *
 * Exactly the approved hero-plate recipe (public/art/pause/*.json):
 * `tools/gen/comfy.mjs hero` = Animagine XL 4.0, 1344x768, 30 steps, cfg 6,
 * euler_ancestral/normal, composition 'hero' (no rembg). IP-Adapter plus ViT-H:
 *  - Yuna: her idle at 0.5 linear, 0.25 to 0.85 (public/art/pause/yuna.json,
 *    ch2-yunalesca.json), forced past the monochrome guard as the Yojimbo
 *    round's a4 did for Lulu.
 *  - Isaaru: a head-and-shoulders crop of his installed portrait candidate
 *    (public/art/portraits/isaaru.png, O-2 B's sorrowful expression) at 0.35
 *    ease in, 0.2 to 0.6 (the Macalania plate's head-crop setting).
 * His words are the installed idle's and portrait's (O-1 A, O-2 B). The room
 * is the picked O-3 A (the red-lit chamber at the end of the hallway). The
 * aeon behind a figure is never asked of the sampler; it is composited from
 * the installed painting with the picked O-4 C mark (compose.py).
 * Scenes: research/ffx-isaaru-bevelle.md §8.2.
 *
 *   node docs/concepts/chapters/isaaru/hero-plate/run.mjs <a|b|c> <seed> [...]
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const OUT = 'D:/Tools/pyrefly-scratch/hero-plates/isaaru/renders';
const BASE = 'http://127.0.0.1:8188';

const SCENE_NEG =
  'butterfly, insect, wings, fairy, city, buildings, city lights, skyscraper, window, sky, sunlight, trees, lantern festival, paper lanterns, fire, flames';
const CHAMBER =
  'underground stone chamber beneath a holy city, dark grey stone block walls, a rust red carved frieze, small square red glowing lamps in a row, ' +
  'deep crimson lamp light, cold grey shadows, a long dark hallway behind, soft bokeh background';
const ISAARU =
  '1boy, final fantasy x, safe, solo, male focus, adult man, young male summoner, gentle face, half-closed brown eyes, \\(dark brown hair\\), ' +
  'long hair tied back high in a small topknot with two loose side locks framing the face, dark navy robe coat with wide sea green lapels, ' +
  'tall sea green standing collar, white inner collar';
const ISAARU_NEG =
  'armor, sword, gun, hat, helmet, beard, old man, muscular, bare chest, cape, glasses, suit, blazer, necktie, modern clothes, feminine, ' +
  'androgynous, 1girl, female, blonde hair, red hair, face paint, facial mark, white coat, halo, brooch, trench coat, military uniform, epaulettes, ' + SCENE_NEG;
const ISAARU_REF = {
  ref: 'docs/concepts/chapters/isaaru/hero-plate/refs/isaaru-portrait-head.png',
  refWeight: '0.35', refWeightType: 'ease in', refStart: '0.2', refEnd: '0.6',
  // Forced: the monochrome guard reads this crop at 44 % one colour (threshold 40 %);
  // pilot a-932101 ran without it and lost the sea-green lapels.
  forceRef: true,
};
const YUNA =
  '1girl, yuna \\(ff10\\), final fantasy x, safe, solo, dark chestnut brown hair, short bob, one thin plaited tail down her back, ' +
  'heterochromia, green eye, blue eye, white halter top with a high collar, yellow obi sash, long white and blue kimono sleeve, ' +
  'blue beaded earring, fair skin';
const YUNA_NEG =
  'blonde hair, golden hair, dirty blonde, light hair, long hair, windswept hair, cleavage, bare chest, breasts, exposed chest, ' +
  'heart pupils, star pupils, spiral pupils, patterned pupils, glowing pupils, second face, two faces, face close behind her, ' +
  'hand near face, fingers in mouth, blush, pink hair tips, bloom, floating ribbon, abstract swoop, ' + SCENE_NEG;
const YUNA_REF = {
  ref: 'public/art/characters/yuna/idle.png', refWeight: '0.5', refWeightType: 'linear', refStart: '0.25', refEnd: '0.85',
  forceRef: true,
};

const OPTIONS = {
  // A: the summoner who holds the temple's word as law, even against Braska's daughter (§8.2 beat 5).
  a: {
    name: 'isaaru-hero-a', subject: 'Isaaru in the last chamber', mood: "the temple's word, and his sorrow at keeping it",
    tags: ISAARU,
    poseTags:
      `${CHAMBER}, three-quarter view, looking at viewer, eyes lowered, sorrowful, resolute, mouth closed, calm, dignified, ` +
      'head and shoulders, hands out of frame, nothing crossing his face',
    emphasis: '(dark brown hair tied up in a topknot:1.2), (very wide sea green lapels and tall sea green collar on a dark navy summoner robe:1.3), (gentle sorrowful face, brown eyes, eyes lowered:1.2), (deep crimson red lamp light, dark stone chamber:1.25)',
    negAdd: `${ISAARU_NEG}, smile, grin, open mouth, crying, tears, green eyes, angry, frown, scowl, furrowed brow, blue light, orange light`,
    ...ISAARU_REF,
  },
  // B: Yuna alone against his aeons (only an aeon can fight an aeon); Grothia behind her.
  b: {
    name: 'isaaru-hero-b', subject: "Yuna against Isaaru's aeons", mood: 'alone, and not stepping back',
    tags: YUNA,
    poseTags:
      `${CHAMBER}, she is on the left of the frame, dark empty space on the right, three-quarter view, facing right, ` +
      'looking ahead, determined, jaw set, eyes narrowed, mouth closed, head and shoulders, ' +
      'the high collar of her halter top and the yellow obi sash closing the bottom of the frame, arms and hands out of frame, nothing crossing her face',
    emphasis: '(determined stare, jaw set:1.25), (dark chestnut brown hair:1.3), (deep crimson red light, dark stone chamber:1.3)',
    negAdd: `${YUNA_NEG}, smile, grin, crying, tears, open mouth, man, 1boy, monster, creature, statue, orange light, amber light, warm lantern light, candle, yellow light`,
    ...YUNA_REF,
  },
  // C: he asks her pardon before he summons (§8.2 beat 5); his aeon composited behind him.
  c: {
    name: 'isaaru-hero-c', subject: 'Isaaru asks her pardon, then summons', mood: 'forgive me',
    tags: ISAARU,
    poseTags:
      `${CHAMBER}, he is on the right of the frame, dark empty space on the left, three-quarter view, facing left, head tilted down slightly, ` +
      'eyes closed, praying, both hands pressed together in prayer below his chin, face fully visible, sorrowful, serene, mouth closed, upper body',
    emphasis: '(eyes closed, hands pressed together in prayer below his chin, face fully visible:1.2), (dark brown hair tied up in a topknot:1.15), (very wide sea green lapels and tall sea green collar on a dark navy summoner robe:1.2), (red lamp light:1.1)',
    negAdd: `${ISAARU_NEG}, smile, grin, open mouth, crying, tears, hands covering face, hand over mouth, extra hands, green light, yellow light, spotlight, light beam, bowed head hiding face, red skin, texture, grid, dither`,
    ...ISAARU_REF,
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
