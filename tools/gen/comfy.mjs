#!/usr/bin/env node
/**
 * ComfyUI generation client for Pyrefly Reprise art.
 *
 * Node built-ins only. Talks to a locally running ComfyUI (see
 * `docs/ART-PIPELINE.md`) over its HTTP API: POST /prompt with a workflow in
 * "API format", poll /history/<id>, pull the finished PNG from /view.
 *
 * Three presets:
 *   character  832x1216 portrait -> rembg cutout -> auto-crop -> .png + .json
 *   boss       1216x832 landscape (or --size 1024x1024), same cutout
 *   backdrop   1344x768 -> RealESRGAN 4x -> downscale 0.5 -> 2688x1536 .png
 *
 * Usage:
 *   node tools/gen/comfy.mjs character --name tidus \
 *     --tags "1boy, tidus, final fantasy x, ..." \
 *     --pose idle --poseTags "fighting stance, ..." \
 *     --out public/art/characters/tidus/idle.png [--batch 3]
 *
 *   node tools/gen/comfy.mjs backdrop --name gagazet \
 *     --tags "snowy mountain pass at night, ..." \
 *     --out public/art/backdrops/gagazet.png
 *
 * Reference consistency (v2): `--ref <png>` runs the prompt through IP-Adapter
 * with the given image as the identity anchor, so a new *pose* keeps the face,
 * hair and outfit of an already-approved sprite. `--img2img <png>` is the
 * blunter fallback (redraw the pixels at `--denoise`).
 */

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  appendFileSync,
  writeFileSync,
  existsSync,
  copyFileSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import {
  BLACK_RESTART_MIN_INTERVAL_MS,
  isBlackFrame,
  parseRestartSentinel,
  shouldRestartAfterBlack,
} from './black-frame.mjs';

// Re-exported so the guard's decisions have one import path for callers and
// tests, even though the policy itself lives in the pure module.
export { isBlackFrame, parseRestartSentinel, shouldRestartAfterBlack };

const HERE = dirname(fileURLToPath(import.meta.url));

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

const HOST = process.env.COMFY_HOST || '127.0.0.1';
const PORT = Number(process.env.COMFY_PORT || 8188);
const BASE = `http://${HOST}:${PORT}`;

const COMFY_ROOT = process.env.COMFY_ROOT || 'D:/Tools/ComfyUI';
const EMBEDDED_PYTHON = join(COMFY_ROOT, 'python_embeded', 'python.exe');

/** Where the black-frame guard keeps its log and its restart sentinel. */
const COMFY_LOG_DIR = process.env.COMFY_LOG_DIR || 'D:/Tools/comfy-logs';
const BLACK_FRAME_LOG = join(COMFY_LOG_DIR, 'black-frames.log');
const BLACK_RESTART_SENTINEL = join(COMFY_LOG_DIR, 'last-black-restart.txt');

/** The scheduled task that brings ComfyUI back up (see docs/handoff/art-ops.md). */
const COMFY_TASK_NAME = process.env.COMFY_TASK || 'PyreflyComfyUI';

const CHECKPOINT = process.env.COMFY_CKPT || 'animagine-xl-4.0-opt.safetensors';
const UPSCALE_MODEL = process.env.COMFY_UPSCALER || 'RealESRGAN_x4plus.pth';

/**
 * ComfyUI's own `input/` folder. `LoadImage` can only see files that live
 * here, so `--ref` / `--img2img` copy (and flatten) the repo file into it
 * first. COMFY_ROOT is the portable bundle; the app itself is one level in.
 */
const COMFY_INPUT_DIR =
  process.env.COMFY_INPUT || join(COMFY_ROOT, 'ComfyUI', 'input');

/** IP-Adapter pair — see docs/ART-PIPELINE.md §1. Both live under models/. */
const IPADAPTER_MODEL =
  process.env.COMFY_IPADAPTER || 'ip-adapter-plus_sdxl_vit-h.safetensors';
const CLIP_VISION_MODEL =
  process.env.COMFY_CLIPVISION || 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors';

/**
 * How hard the reference pulls.
 *
 * 0.65 is the useful middle: identity, hair and costume carry over from the
 * idle, but the pose prompt still wins the argument about limbs. Above ~0.85
 * the adapter starts reproducing the reference *pose* too and `--poseTags`
 * stops mattering; below ~0.45 the costume drifts again and you may as well
 * not bother.
 */
export const REF_WEIGHT_DEFAULT = 0.65;

/**
 * When the reference starts pulling.
 *
 * Not at step zero. Composition is decided in the first fifth of the denoise,
 * and an adapter that is running then reproduces the reference's *pose* — on a
 * fixed seed, an "attacking, swinging sword" prompt came back as the idle's
 * planted stance with cropped legs, three times out of three, at every weight
 * from 0.45 up. Letting the prompt lay out the figure first and switching the
 * reference on at 0.25 keeps the pose the prompt asked for and still lands the
 * face, hair and costume. This flag, not `--refWeight`, is the one that makes
 * `--ref` usable.
 */
export const REF_START_DEFAULT = 0.25;

/**
 * When the reference lets go.
 *
 * The last 15% of the denoise runs unassisted. Left on to the very end the
 * adapter carries the reference's local *material* as well as its identity:
 * Tidus's idle handed later poses its iridescent blade and red-and-blue
 * shoulder plate as an all-over chrome gloss, and the cel-shading contract
 * went with it. Surface is settled late, so hand the last steps back to the
 * checkpoint and the style tags.
 */
export const REF_END_DEFAULT = 0.85;

/** img2img strength. 0.55 keeps the silhouette, repaints everything else. */
export const IMG2IMG_DENOISE_DEFAULT = 0.55;

/**
 * THE STYLE CONTRACT.
 *
 * Every character in the cast shares these two blocks verbatim so the roster
 * reads as one art department. Do not tweak them per character — if the style
 * needs to move, move it here and re-render everybody.
 *
 * Tag order follows the Animagine XL 4.0 model card:
 *   subject count, character name, series, rating, everything else, quality
 * Quality/score tags go LAST. (The card's score tags — `high score, great
 * score` — are what this model was trained on; the v3.1-era `very aesthetic`
 * block does nothing here.)
 *
 * Two tags were deliberately tried and dropped, both A/B'd on a fixed seed:
 *   - `clean lineart` pulls hard toward flat inked manga art — large dead
 *     black fills, desaturated everything. Wrong for a painted 2.5D look.
 *   - `painterly` renders beautifully but sprays loose paint-splatter around
 *     the figure, which rembg then keeps as opaque content: the cutout gains
 *     confetti and `baselineY` lands under a blob instead of the feet.
 */
export const STYLE_TAGS =
  'official art, cel shading, soft shading, vibrant colors, rim lighting, colorful, detailed';
export const QUALITY_TAGS = 'masterpiece, high score, great score, absurdres';

/**
 * THE FACING CONTRACT (v3, 2026-09-17).
 *
 * v2 rendered everybody `straight-on`, and it showed the moment the art went
 * into a battle scene: the party and the boss face each other across the
 * field, and both of them were staring down the camera instead. v3 splits the
 * camera phrase out of the composition blocks into this table.
 *
 * The party stands on the LEFT of the battlefield and fights to the RIGHT, so
 * party art is `facing: right`. Enemies, bosses and aeons stand on the right
 * and fight leftward, so they are `facing: left`. `none` keeps the v2
 * straight-on framing and is the default for portraits, which are HUD
 * head-shots and should meet the player's eye.
 *
 * What the phrasing has to buy, in order:
 *   1. a body angled ~45 degrees, not a 90 degree profile (a profile loses the
 *      face, and a flat cutout in profile reads as cardboard);
 *   2. a readable face, which is why `looking at viewer` stays in, weighted;
 *   3. the correct direction — which, see below, the prompt cannot deliver.
 *
 * Fourteen phrasings were A/B'd on Tidus over three fixed seeds
 * (docs/handoff/art3-contract.md has the table). The findings:
 *
 * - **Unweighted phrasings do nothing.** `three-quarter view, body facing
 *   right, looking to the side`, `facing right, from side, three-quarter
 *   view`, `turned to the right, dynamic angle` and `from side, looking at
 *   viewer, three-quarter` all came back frontal, 12 renders out of 12. A
 *   named character's prior *is* their straight-on official art, and a bare
 *   camera tag does not outvote it.
 * - **`(from side:1.3)` does.** The same phrase with an emphasis weight turns
 *   the body every time. `from side` is the load-bearing token — it is the
 *   Danbooru tag the checkpoint actually knows — and the weight is what lets
 *   it beat the character prior. `three-quarter view` contributes nothing on
 *   its own but stops the weighted `from side` from overshooting into a flat
 *   90 degree profile.
 * - **`(looking at viewer:1.2)` is not optional.** Without it the weighted
 *   `from side` keeps turning past profile into a back view, and a sprite
 *   whose face you cannot see fails the blind-judge test outright.
 * - **The direction word is inert.** Two runs identical but for `body facing
 *   right` vs `body facing left`, same three seeds, produced the same image
 *   pair by pair, both facing the LEFT of the frame. SDXL's text encoder has
 *   no reliable left/right grounding; this is a known limit, not a phrasing
 *   that can be tuned. The words are kept below because they cost nothing and
 *   occasionally break a tie.
 *
 * So the checkpoint has a bias, and the bias is frame-LEFT. That is already
 * what enemies want. Party art (`right`) mostly has to be mirrored after the
 * fact with `tools/gen/flip.py` — cheap and exact, with the chirality caveat
 * in that file's header (Auron's coat is off his LEFT shoulder, Kimahri's
 * broken horn is one specific horn; reroll those instead of mirroring).
 *
 * Judge facing first, before costume: a good render pointing the wrong way is
 * one command from being right, and no other defect is.
 */
export const FACING_PHRASES = {
  right: '(from side:1.3), three-quarter view, body facing right, (looking at viewer:1.2)',
  left: '(from side:1.3), three-quarter view, body facing left, (looking at viewer:1.2)',
  none: 'straight-on',
};

/**
 * Negatives that come with a facing.
 *
 * The positive phrase turns the body and these stop it turning back, or too
 * far: `facing viewer / front view / straight-on / symmetrical` are the frontal
 * attractor, `from behind / facing away` are the overshoot. Appended
 * automatically whenever `--facing` is not `none`, ahead of any `--negAdd`.
 *
 * Deliberately NOT applied to `--composition prone`: a downed figure is drawn
 * `from side, eyes closed` already, and banning `facing viewer` on top of that
 * rolls the body face-down into the floor.
 */
export const FACING_NEGATIVE =
  'facing viewer, front view, straight-on, symmetrical, from behind, facing away';

/**
 * Facing for a prone (KO) figure.
 *
 * A downed party member should still be lying with their head toward the enemy
 * they just lost to — head-right for the party, head-left for an enemy — so
 * the body reads as having fallen *into* the fight, not away from it. The
 * standing phrase is wrong here twice over: `body facing right` on a lying
 * figure summons a person lying on their back, and `looking at viewer` fights
 * the `eyes closed` in the prone block.
 */
export const PRONE_FACING_PHRASES = {
  right: 'head to the right, feet to the left',
  left: 'head to the left, feet to the right',
  none: '',
};

/**
 * Facing for a pause-screen hero close-up.
 *
 * `none` is EMPTY here, not `straight-on`. The v2/v3 `straight-on` exists to
 * stop a battlefield sprite drifting off-axis; on a cinematic close-up it is
 * an active liability, because half these shots want a three-quarter face and
 * `straight-on` argues with the `three-quarter view` in their pose tags — and
 * on this checkpoint `straight-on` wins that argument, which flattens the whole
 * row into passport photos. The camera angle for a hero plate is stated per
 * shot in `--poseTags` ("three-quarter view", "looking down", "eyes closed"),
 * because there it is direction rather than contract.
 */
export const HERO_FACING_PHRASES = {
  right: FACING_PHRASES.right,
  left: FACING_PHRASES.left,
  none: '',
};

/** Which way a subject faces. `none` is the v2 straight-on behaviour. */
export const FACINGS = ['right', 'left', 'none'];

/**
 * Composition block that makes a full-body sprite cut out cleanly.
 *
 * v2 (2026-09-15): `feet visible` was added after the proof-of-concept round
 * found that ~2 in 3 rejected variants were rejected for *camera*, not
 * costume — bird's-eye and dutch-tilt framings that no amount of pose tagging
 * cured. `standing on ground` became plain `standing` because "ground" kept
 * summoning a textured floor plane into what is supposed to be a flat white
 * cyclorama.
 *
 * v3 (2026-09-17): the leading `straight-on` moved out into FACING_PHRASES.
 * The blocks below are the framing *minus* the camera angle; `compositionFor`
 * puts the facing phrase back on the front.
 *
 * This is part of the shared contract: changing it means re-rendering the
 * roster, not one character.
 */
export const CHARACTER_COMPOSITION =
  'full body, standing, feet visible, simple background, white background';

/**
 * Framing for bosses. They are rarely bipeds standing politely on a floor —
 * they float, coil, or fill the frame — so `standing, feet visible` is wrong
 * and actively fights forms like Yu Yevon or Vegnagun. Select with
 * `--composition boss` (the `boss` preset does it for you).
 */
export const BOSS_COMPOSITION =
  'full body, centered, imposing, simple background, white background';

/**
 * Framing for dialogue/menu portraits. Same style and quality blocks as the
 * sprites — only the framing changes, so a portrait still looks like it came
 * out of the same art department. Select it with `--composition portrait`.
 *
 * Defaults to `--facing none`: a HUD portrait is not on the battlefield, it is
 * the character looking at the player.
 */
export const PORTRAIT_COMPOSITION =
  'portrait, close-up, upper body, looking at viewer, simple background, white background';

/**
 * Framing for downed/KO poses. `full` says "standing on ground", which
 * actively fights a lying-down pose — the sampler splits the difference and
 * gives you a crouch. Select with `--composition prone`.
 *
 * `from side` already lives here, so the prone facing phrase only has to say
 * which end of the body is which.
 */
export const PRONE_COMPOSITION =
  'lying on ground, on side, eyes closed, full body, from side, simple background, white background';

/**
 * Framing for pause-screen hero art (v4, 2026-09-18).
 *
 * The "Until Dawn" pause screen wants a cinematic close-up of a face, held
 * in a landscape frame with the scene still behind it. Three things separate
 * it from `portrait`:
 *
 * 1. **It keeps its background.** `portrait` says `simple background, white
 *    background` because a HUD head-shot gets cut out. These do not go through
 *    rembg at all — the painted backdrop *is* half the shot, and the pause
 *    overlay composites the whole landscape frame. So the framing block asks
 *    for depth of field and bokeh instead of a cyclorama.
 * 2. **It is landscape.** 1344x768, the same bucket as a backdrop, because the
 *    pause panel is a wide plate with the face off to one side.
 * 3. **Expression is the subject.** `detailed eyes` and `expressive` are in the
 *    block itself rather than left to `--poseTags`, because on this checkpoint
 *    a close-up with no emotional tag reliably renders a neutral idol face.
 *
 * `looking at viewer` is deliberately NOT here — half these shots look away
 * (Yuna's eyes downcast, eyes closed mid-song). Say which in `--poseTags`.
 */
export const HERO_COMPOSITION =
  'close-up, face focus, portrait, upper body, expressive, detailed eyes, ' +
  'cinematic lighting, dramatic lighting, depth of field, blurry background, dramatic';

const COMPOSITIONS = {
  full: CHARACTER_COMPOSITION,
  portrait: PORTRAIT_COMPOSITION,
  prone: PRONE_COMPOSITION,
  boss: BOSS_COMPOSITION,
  hero: HERO_COMPOSITION,
};

/** Compositions that ignore `--facing` unless it is given explicitly. */
const COMPOSITION_DEFAULT_FACING = {
  full: null, // inherit the preset default (right for character, left for boss)
  boss: null,
  prone: null,
  portrait: 'none',
  // A pause-screen close-up is not on the battlefield; the camera is the one
  // thing in the room with the character. Direction comes from --poseTags.
  hero: 'none',
};

/**
 * Put a composition block together: facing phrase first, framing after.
 *
 * `override` is the A/B escape hatch (`--facingPhrase "..."`). It replaces the
 * table lookup so a phrasing can be tried on a fixed seed without editing this
 * file; nothing in the cast manifest uses it.
 */
export function compositionFor(composition = 'full', facing = 'none', override = null) {
  const framing = COMPOSITIONS[composition];
  if (!framing) {
    throw new Error(
      `Unknown --composition "${composition}" (expected: ${Object.keys(COMPOSITIONS).join(', ')})`,
    );
  }
  if (!FACINGS.includes(facing)) {
    throw new Error(`Unknown --facing "${facing}" (expected: ${FACINGS.join(', ')})`);
  }
  const table =
    composition === 'prone'
      ? PRONE_FACING_PHRASES
      : composition === 'hero'
        ? HERO_FACING_PHRASES
        : FACING_PHRASES;
  const phrase = override === null ? table[facing] : override;
  return joinTags(phrase, framing);
}

/**
 * The default facing for a preset + composition pair.
 *
 * Party members are drawn standing on the left of the field, so `character`
 * faces right; bosses and aeons stand on the right, so `boss` faces left.
 * Portraits opt out. An explicit `--facing` always wins.
 */
export function defaultFacingFor(preset, composition) {
  const byComposition = COMPOSITION_DEFAULT_FACING[composition];
  if (byComposition) return byComposition;
  return preset === 'boss' ? 'left' : 'right';
}

export const BASE_NEGATIVE = [
  'lowres',
  'bad anatomy',
  'bad hands',
  'text',
  'error',
  'missing finger',
  'extra digits',
  'fewer digits',
  'cropped',
  'worst quality',
  'low quality',
  'low score',
  'bad score',
  'average score',
  'jpeg artifacts',
  'signature',
  'watermark',
  'username',
  'blurry',
  'artist name',
  'multiple views',
  'multiple girls',
  'multiple boys',
  '2girls',
  '2boys',
].join(', ');

/**
 * Sprite-only negatives, on top of the shared block.
 *
 * Anything opaque that is not the character is not just ugly — rembg keeps it,
 * so it becomes part of the cutout and drags `baselineY` out to the canvas
 * edge. `motion lines` and `action pose` in a pose prompt reliably spray a
 * coloured swirl around the figure on this checkpoint (the same failure that
 * got `painterly` struck from the style block), and the crop box comes back as
 * the whole 832x1216 frame. These four tags cost nothing and stop it.
 *
 * Deliberately NOT in `BASE_NEGATIVE`: backdrops inherit that, and
 * `chapter-select` is *supposed* to be an abstract coloured field.
 */
export const SPRITE_NEGATIVE = `${BASE_NEGATIVE}, paint splatter, ink splash, colorful background, abstract background`;

export const BACKDROP_NEGATIVE = `${BASE_NEGATIVE}, 1girl, 1boy, character, people, person, human`;

/**
 * Hero (pause-screen) negatives.
 *
 * Note what is NOT banned: backgrounds. `SPRITE_NEGATIVE` bans
 * `colorful background` because rembg would keep it; a hero plate is never cut
 * out, so the painted backdrop stays and the bans are about *framing* instead.
 * `full body`, `wide shot` and `from afar` are the attractor that pulls a
 * close-up back out to a standing figure — the checkpoint's prior for a named
 * character is their full-length official art, and a bare `close-up` loses that
 * argument about one time in three without these.
 */
export const HERO_NEGATIVE = `${BASE_NEGATIVE}, full body, wide shot, from afar, feet, legs, chibi, sketch, monochrome`;

/**
 * Per-shot negative additions, appended to the shared negative with `--negAdd`.
 *
 * Needed because some scene names collide with real English once CLIP
 * tokenizes them. "farplane" splits into "far" + "plane" and reliably summons
 * biplanes over the flower field — the fix is to drop the coined word from the
 * positive prompt and ban aircraft here.
 */
export function withNegAdd(base, extra) {
  return extra ? joinTags(base, escapeTags(extra)) : base;
}

// --------------------------------------------------------------------------
// Prompt helpers
// --------------------------------------------------------------------------

/**
 * Escape Danbooru tags that contain parentheses.
 *
 * `brotherhood (sword)` is a literal tag, but bare parens are *emphasis*
 * syntax to the CLIP text encoder — unescaped they silently reweight the
 * prompt instead of naming the weapon. Already-escaped parens are left alone.
 */
export function escapeTags(text) {
  if (text === undefined || text === null || text === true) return '';
  return String(text).replace(/\\?[()]/g, (m) => (m.startsWith('\\') ? m : `\\${m}`));
}

/** Join prompt fragments, dropping empties and collapsing comma runs. */
export function joinTags(...parts) {
  return parts
    .filter((p) => p && String(p).trim())
    .map((p) => String(p).trim().replace(/,\s*$/, ''))
    .join(', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(,\s*)+/g, ', ')
    .trim();
}

/** Deterministic per-character seed so re-runs reproduce the same cast. */
export function seedFromName(name) {
  const h = createHash('sha256').update(String(name)).digest();
  // Keep it under 2^31 — plenty of entropy, avoids any 64-bit JSON rounding.
  return h.readUInt32BE(0) % 2147483647;
}

/**
 * `--emphasis` — the one prompt channel that is NOT escaped.
 *
 * `escapeTags` backslash-escapes every paren in `--tags` and `--poseTags`,
 * which is right for literal Danbooru tags (`yuna (ff10)`) and fatal for
 * emphasis syntax. A `(scar across eye:1.3)` written into `--poseTags` reaches
 * CLIP as the *literal characters* `\(scar across eye:1.3\)` and carries no
 * weight at all — the 2026-09-18 hero round believed it was weighting canon
 * tokens and was in fact only adding punctuation. (The facing phrases work
 * because `compositionFor` injects them past `escapeTags`; nothing a caller
 * types has ever had that route.)
 *
 * So: identity goes in `--tags`, action goes in `--poseTags`, and the two or
 * three tokens that have to out-shout the character prior go in `--emphasis`,
 * verbatim. Keep it short. It is placed after the pose tags and before the
 * framing block, so it reads as part of the subject description.
 */
export function buildCharacterPrompt({
  tags,
  poseTags,
  composition = 'full',
  facing = 'none',
  facingPhrase = null,
  emphasis = null,
}) {
  const framing = compositionFor(composition, facing, facingPhrase);
  return joinTags(
    escapeTags(tags),
    escapeTags(poseTags),
    emphasis || '',
    framing,
    STYLE_TAGS,
    QUALITY_TAGS,
  );
}

export function buildBackdropPrompt({ tags }) {
  return joinTags(
    'no humans, scenery',
    escapeTags(tags),
    'detailed background, painterly, cinematic lighting, wide shot',
    QUALITY_TAGS,
  );
}

// --------------------------------------------------------------------------
// Workflow graphs (ComfyUI "API format")
// --------------------------------------------------------------------------

function baseTxt2Img({
  positive,
  negative,
  width,
  height,
  seed,
  steps,
  cfg,
  sampler,
  scheduler,
  refImage,
  refWeight = REF_WEIGHT_DEFAULT,
  refWeightType = 'linear',
  refScaling = 'K+V',
  refStart = REF_START_DEFAULT,
  refEnd = REF_END_DEFAULT,
  initImage,
  denoise = 1,
}) {
  const g = {
    4: {
      class_type: 'CheckpointLoaderSimple',
      inputs: { ckpt_name: CHECKPOINT },
    },
    5: {
      class_type: 'EmptyLatentImage',
      inputs: { width, height, batch_size: 1 },
    },
    6: {
      class_type: 'CLIPTextEncode',
      inputs: { text: positive, clip: ['4', 1] },
    },
    7: {
      class_type: 'CLIPTextEncode',
      inputs: { text: negative, clip: ['4', 1] },
    },
    3: {
      class_type: 'KSampler',
      inputs: {
        seed,
        steps,
        cfg,
        sampler_name: sampler,
        scheduler,
        denoise: 1,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['5', 0],
      },
    },
    8: {
      class_type: 'VAEDecode',
      inputs: { samples: ['3', 0], vae: ['4', 2] },
    },
  };

  // --- reference identity (IP-Adapter) -------------------------------------
  // The adapter patches the MODEL, so it sits between the checkpoint and the
  // sampler. Everything else in the graph is untouched, which is why --ref
  // composes with --img2img, --composition and the batch loop.
  if (refImage) {
    g['20'] = {
      class_type: 'LoadImage',
      inputs: { image: refImage, upload: 'image' },
    };
    g['21'] = {
      class_type: 'IPAdapterModelLoader',
      inputs: { ipadapter_file: IPADAPTER_MODEL },
    };
    g['22'] = {
      class_type: 'CLIPVisionLoader',
      inputs: { clip_name: CLIP_VISION_MODEL },
    };
    g['23'] = {
      class_type: 'IPAdapterAdvanced',
      inputs: {
        model: ['4', 0],
        ipadapter: ['21', 0],
        image: ['20', 0],
        weight: refWeight,
        // 'linear' spreads the reference over the whole denoise. The tempting
        // 'style transfer' type carries palette but drops the costume, which
        // is exactly the thing we are here to keep.
        weight_type: refWeightType,
        combine_embeds: 'concat',
        start_at: refStart,
        end_at: refEnd,
        // 'K+V' rather than the node's 'V only' default: with V only, the
        // ip-adapter-PLUS model (16 tokens, much stronger than base) blew the
        // render out into glossy rainbow gradients on a fixed seed — saturated
        // highlights, chrome edges, the cel-shading contract gone. K+V spreads
        // the same reference across keys as well and lands back in style.
        embeds_scaling: refScaling,
        clip_vision: ['22', 0],
      },
    };
    g['3'].inputs.model = ['23', 0];
  }

  // --- img2img fallback ----------------------------------------------------
  if (initImage) {
    g['30'] = {
      class_type: 'LoadImage',
      inputs: { image: initImage, upload: 'image' },
    };
    // The init image is almost never the target bucket size (cutouts are
    // cropped to content), and VAEEncode will not resize for you.
    g['31'] = {
      class_type: 'ImageScale',
      inputs: { image: ['30', 0], upscale_method: 'lanczos', width, height, crop: 'center' },
    };
    g['32'] = {
      class_type: 'VAEEncode',
      inputs: { pixels: ['31', 0], vae: ['4', 2] },
    };
    g['3'].inputs.latent_image = ['32', 0];
    g['3'].inputs.denoise = denoise;
  }

  return g;
}

export function characterWorkflow(opts) {
  const g = baseTxt2Img(opts);
  g['9'] = {
    class_type: 'SaveImage',
    inputs: { filename_prefix: opts.prefix, images: ['8', 0] },
  };
  return g;
}

export function backdropWorkflow(opts) {
  const g = baseTxt2Img(opts);
  g['10'] = {
    class_type: 'UpscaleModelLoader',
    inputs: { model_name: UPSCALE_MODEL },
  };
  g['11'] = {
    class_type: 'ImageUpscaleWithModel',
    inputs: { upscale_model: ['10', 0], image: ['8', 0] },
  };
  // RealESRGAN is 4x; halve it back down for a clean 2x net result.
  g['12'] = {
    class_type: 'ImageScaleBy',
    inputs: { image: ['11', 0], upscale_method: 'lanczos', scale_by: 0.5 },
  };
  g['9'] = {
    class_type: 'SaveImage',
    inputs: { filename_prefix: opts.prefix, images: ['12', 0] },
  };
  return g;
}

// --------------------------------------------------------------------------
// HTTP client
// --------------------------------------------------------------------------

const CLIENT_ID = createHash('sha256')
  .update(`pyrefly-${process.pid}-${Date.now()}`)
  .digest('hex')
  .slice(0, 32);

async function api(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ComfyUI ${init?.method || 'GET'} ${path} -> ${res.status}\n${body}`);
  }
  return res;
}

export async function waitForServer(timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(`${BASE}/system_stats`);
      if (res.ok) return await res.json();
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`ComfyUI did not answer on ${BASE} in time`);
    await new Promise((r) => setTimeout(r, 1500));
  }
}

async function queuePrompt(workflow) {
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: CLIENT_ID }),
  });
  const text = await res.text();
  if (!res.ok) {
    // ComfyUI reports graph validation problems here — surface them verbatim,
    // they name the offending node and input.
    throw new Error(`ComfyUI rejected the workflow (${res.status}):\n${text}`);
  }
  const json = JSON.parse(text);
  if (json.error) throw new Error(`ComfyUI error: ${JSON.stringify(json.error)}`);
  return json.prompt_id;
}

async function waitForResult(promptId, { timeoutMs = 900_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await api(`/history/${promptId}`);
    const hist = await res.json();
    const entry = hist[promptId];
    if (entry) {
      const status = entry.status || {};
      if (status.status_str === 'error') {
        throw new Error(`Generation failed: ${JSON.stringify(status.messages || status)}`);
      }
      if (entry.outputs && Object.keys(entry.outputs).length) return entry;
    }
    if (Date.now() > deadline) throw new Error(`Timed out waiting for prompt ${promptId}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

function imagesFrom(entry) {
  const out = [];
  for (const node of Object.values(entry.outputs || {})) {
    for (const img of node.images || []) out.push(img);
  }
  return out;
}

async function fetchImage({ filename, subfolder, type }) {
  const q = new URLSearchParams({ filename, subfolder: subfolder || '', type: type || 'output' });
  const res = await api(`/view?${q}`);
  return Buffer.from(await res.arrayBuffer());
}

// --------------------------------------------------------------------------
// Black-frame guard
// --------------------------------------------------------------------------
//
// 2026-09-18, 13:35: the GPU went into a NaN state mid-session and stayed
// there for six minutes. ComfyUI never errored — the sampler ran, SaveImage
// wrote PNGs, /history reported success — and every pixel of every render was
// zero. `nodes.py:1699: RuntimeWarning: invalid value encountered in cast` in
// the ComfyUI console is the only signal, and nothing was watching it. Thirteen
// black renders later, two of them had been copied into public/art.
//
// So: no finished render reaches disk without being looked at. The check is
// deliberately the narrowest one that cannot reject a real painting — see
// `isBlackFrame` in black-frame.mjs for why it is "max sample is 0" and not a
// mean threshold. Full incident writeup in docs/handoff/art-ops.md.

/**
 * Ask PIL + numpy for the largest RGB sample in a PNG.
 *
 * Node has no PNG decoder, and this is the gate on the whole art pipeline, so
 * it shells out to the decoder that is already installed and already trusted
 * by every other step here (`rembg.py`, `qc.py`, `stageImage`) rather than to
 * anything hand-rolled. `tools/gen/black-frame.mjs` has a pure-JS decoder for
 * the gallery, which cannot afford to spawn python on a timer; this one is the
 * authority.
 *
 * Returns `null` when it cannot tell — missing python, unreadable file — and
 * the guard then lets the render through. A checker that fails closed would
 * stop the art fleet over its own bugs.
 */
function maxRgbOfPngFile(pngPath) {
  if (!existsSync(EMBEDDED_PYTHON)) {
    process.stderr.write(
      `[gen] WARNING: no embedded python at ${EMBEDDED_PYTHON} — black-frame guard is OFF\n`,
    );
    return null;
  }
  const py = [
    'import sys',
    'import numpy as np',
    'from PIL import Image',
    'a = np.asarray(Image.open(sys.argv[1]).convert("RGB"))',
    'print(int(a.max()) if a.size else 0)',
  ].join('\n');
  const res = spawnSync(EMBEDDED_PYTHON, ['-s', '-c', py, pngPath], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  if (res.status !== 0) {
    process.stderr.write(
      `[gen] WARNING: black-frame check could not read the render: ${res.stderr || res.stdout}\n`,
    );
    return null;
  }
  const line = (res.stdout || '').trim().split(/\r?\n/).pop();
  const n = Number(line);
  return Number.isFinite(n) ? n : null;
}

/**
 * Run the check on bytes that are still in memory.
 *
 * The render is decoded from a scratch copy in the OS temp folder, never from
 * `--out` or a candidate slot: the whole point is that a black frame never
 * lands anywhere the fleet or the gallery will pick it up.
 */
function maxRgbOfBuffer(buf) {
  let dir;
  try {
    dir = mkdtempSync(join(tmpdir(), 'pyrefly-guard-'));
  } catch (err) {
    process.stderr.write(`[gen] WARNING: black-frame check has no temp dir: ${err.message}\n`);
    return null;
  }
  const scratch = join(dir, 'frame.png');
  try {
    writeFileSync(scratch, buf);
    return maxRgbOfPngFile(scratch);
  } catch (err) {
    process.stderr.write(`[gen] WARNING: black-frame check failed: ${err.message}\n`);
    return null;
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* a leftover temp file is not worth failing a render over */
    }
  }
}

/** The SaveImage prefix, which is what names the file in ComfyUI's output. */
function prefixOf(workflow) {
  return workflow?.['9']?.inputs?.filename_prefix || '(unknown)';
}

function recordBlackFrame({ promptId, prefix, maxRgb }) {
  const stamp = new Date().toISOString();
  try {
    mkdirSync(COMFY_LOG_DIR, { recursive: true });
    appendFileSync(BLACK_FRAME_LOG, `${stamp} prompt=${promptId} prefix=${prefix} maxRgb=${maxRgb}\n`);
  } catch (err) {
    process.stderr.write(`[gen] could not append to ${BLACK_FRAME_LOG}: ${err.message}\n`);
  }
  process.stderr.write(
    `\n[gen] BLACK FRAME (NaN state): ${prefix} (prompt ${promptId}) came back with every RGB\n` +
      `[gen]   sample at 0. The GPU is producing NaNs; ComfyUI does not report this as an error.\n` +
      `[gen]   Nothing was written to disk. Logged to ${BLACK_FRAME_LOG}\n\n`,
  );
}

function readRestartSentinel() {
  try {
    return parseRestartSentinel(readFileSync(BLACK_RESTART_SENTINEL, 'utf8'));
  } catch {
    return null;
  }
}

function writeRestartSentinel(nowMs) {
  try {
    mkdirSync(COMFY_LOG_DIR, { recursive: true });
    writeFileSync(BLACK_RESTART_SENTINEL, `${Math.floor(nowMs / 1000)}\n`);
  } catch (err) {
    // Not fatal, but say so loudly: without the sentinel the throttle is off
    // and a NaN'd GPU could get restarted once per render.
    process.stderr.write(
      `[gen] WARNING: could not write ${BLACK_RESTART_SENTINEL}: ${err.message}\n`,
    );
  }
}

/**
 * Stop ComfyUI and let the scheduled task start it again.
 *
 * Killing by command line rather than by name because the machine runs other
 * pythons; the filter is the same one in docs/ART-PIPELINE.md §1. Deliberately
 * no `-Filter` clause, so the command carries no double quotes and survives
 * Windows argv quoting intact.
 */
async function restartComfy() {
  process.stderr.write('[gen] black-frame recovery: restarting ComfyUI...\n');
  const stop = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'python.exe' -and " +
        "$_.CommandLine -like '*ComfyUI\\main.py*' } | " +
        'ForEach-Object { Stop-Process -Id $_.ProcessId -Force }',
    ],
    { encoding: 'utf8' },
  );
  if (stop.status !== 0) {
    process.stderr.write(`[gen]   stop step said: ${stop.stderr || stop.stdout}\n`);
  }
  // The process has to actually exit before the task will bind :8188 again.
  await new Promise((r) => setTimeout(r, 3000));

  const run = spawnSync('schtasks', ['/Run', '/TN', COMFY_TASK_NAME], { encoding: 'utf8' });
  if (run.status !== 0) {
    throw new Error(
      `Could not restart ComfyUI: schtasks /Run /TN ${COMFY_TASK_NAME} failed (${run.status})\n` +
        `${run.stderr || run.stdout}`,
    );
  }
  await waitForServer(180_000);
  process.stderr.write('[gen]   ComfyUI is answering again.\n');
}

/**
 * One recovery attempt per process, ever.
 *
 * A batch that goes black twice is not a blip. Restarting again would just keep
 * a broken GPU quietly producing nothing while the operator watches a progress
 * log, which is exactly how 13 black renders got made.
 */
let blackRecoveryUsed = false;

const GPU_ATTENTION = [
  'The GPU needs attention before any more art is rendered:',
  '  - check the NVIDIA driver events (event 153 preceded the 2026-09-18 incident)',
  '  - watch the ComfyUI console for "invalid value encountered in cast"',
  '  - docs/handoff/art-ops.md has the full incident and the recovery steps',
].join('\n');

/**
 * Handle a render that came back all-zero: log it, restart ComfyUI once, and
 * resubmit the same prompt exactly once. Throws if it is black again.
 */
async function recoverFromBlackFrame(workflow, shot) {
  const prefix = prefixOf(workflow);
  recordBlackFrame({ promptId: shot.promptId, prefix, maxRgb: shot.maxRgb });

  if (blackRecoveryUsed) {
    throw new Error(
      `BLACK FRAME (NaN state) again on ${prefix}, and this run has already restarted ComfyUI once.\n${GPU_ATTENTION}`,
    );
  }
  blackRecoveryUsed = true;

  const now = Date.now();
  const last = readRestartSentinel();
  if (!shouldRestartAfterBlack(now, last, BLACK_RESTART_MIN_INTERVAL_MS)) {
    const mins = Math.max(0, Math.round((now - last) / 60000));
    throw new Error(
      `BLACK FRAME (NaN state) on ${prefix}. ComfyUI was already restarted for this ${mins} min ` +
        `ago (< ${BLACK_RESTART_MIN_INTERVAL_MS / 60000} min), so it was NOT restarted again.\n${GPU_ATTENTION}`,
    );
  }
  writeRestartSentinel(now);
  await restartComfy();

  const retry = await renderOnce(workflow);
  if (isBlackFrame(retry.maxRgb)) {
    recordBlackFrame({ promptId: retry.promptId, prefix, maxRgb: retry.maxRgb });
    throw new Error(
      `BLACK FRAME (NaN state) on ${prefix} again after restarting ComfyUI — a process restart did not clear it.\n${GPU_ATTENTION}`,
    );
  }
  process.stderr.write('[gen]   recovered: the resubmitted render is not black.\n');
  return { ...retry, seconds: shot.seconds + retry.seconds };
}

// --------------------------------------------------------------------------
// rembg post-processing (runs in ComfyUI's embedded python)
// --------------------------------------------------------------------------

const REMBG_SCRIPT = resolve(HERE, 'rembg.py');

/**
 * Cut the background out, auto-crop to the alpha content with a margin, and
 * report the crop box plus the feet baseline.
 */
export function cutout(inPath, outPath, margin = 16) {
  if (!existsSync(EMBEDDED_PYTHON)) {
    throw new Error(`Embedded python not found at ${EMBEDDED_PYTHON} (set COMFY_ROOT)`);
  }
  const res = spawnSync(
    EMBEDDED_PYTHON,
    ['-s', REMBG_SCRIPT, '--in', inPath, '--out', outPath, '--margin', String(margin)],
    {
      encoding: 'utf8',
      env: { ...process.env, U2NET_HOME: join(COMFY_ROOT, 'rembg-models') },
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (res.status !== 0) {
    throw new Error(`rembg failed (${res.status}):\n${res.stderr || res.stdout}`);
  }
  const line = res.stdout.trim().split(/\r?\n/).pop();
  return JSON.parse(line);
}

// --------------------------------------------------------------------------
// Reference images
// --------------------------------------------------------------------------

/**
 * Make a repo image visible to `LoadImage` and safe to encode.
 *
 * Two things have to happen:
 *
 * 1. **Copy it into ComfyUI's `input/`.** `LoadImage` takes a *filename*
 *    relative to that folder, not a path; it cannot reach into the repo.
 * 2. **Flatten the alpha onto white.** Our sprites are rembg cutouts, and
 *    `LoadImage` hands the RGB channels to CLIP-Vision while routing alpha
 *    off to a MASK output nobody connected. The RGB under a transparent
 *    pixel is undefined — in practice rembg leaves dark fringe there — so an
 *    un-flattened cutout gives the adapter a character floating in a black
 *    void, and the black leaks into the render. White also matches the
 *    `white background` the composition block asks for.
 *
 * The staged name carries a content hash so two runs with different
 * references never collide, and a re-run with the same reference is free.
 */
export function stageImage(srcPath) {
  const abs = resolve(process.cwd(), srcPath);
  if (!existsSync(abs)) throw new Error(`Reference image not found: ${abs}`);
  mkdirSync(COMFY_INPUT_DIR, { recursive: true });

  const digest = createHash('sha256').update(readFileSync(abs)).digest('hex').slice(0, 12);
  const stem = basename(abs, extname(abs)).replace(/[^a-z0-9_-]+/gi, '-');
  const staged = `pyrefly-ref-${stem}-${digest}.png`;
  const target = join(COMFY_INPUT_DIR, staged);
  if (existsSync(target)) return staged;

  if (existsSync(EMBEDDED_PYTHON)) {
    const py = [
      'from PIL import Image',
      'import sys',
      'im = Image.open(sys.argv[1])',
      'if im.mode in ("RGBA", "LA") or "transparency" in im.info:',
      '    im = im.convert("RGBA")',
      '    bg = Image.new("RGB", im.size, (255, 255, 255))',
      '    bg.paste(im, mask=im.split()[-1])',
      '    im = bg',
      'else:',
      '    im = im.convert("RGB")',
      'im.save(sys.argv[2])',
    ].join('\n');
    const res = spawnSync(EMBEDDED_PYTHON, ['-s', '-c', py, abs, target], { encoding: 'utf8' });
    if (res.status === 0) return staged;
    process.stderr.write(
      `[gen] flatten failed, copying reference verbatim: ${res.stderr || res.stdout}\n`,
    );
  }
  copyFileSync(abs, target);
  return staged;
}

/** `--size 1024x1024` -> {width, height}. Returns null when absent. */
export function parseSize(raw) {
  if (raw === undefined || raw === true) return null;
  const m = /^\s*(\d{2,5})\s*[x*×]\s*(\d{2,5})\s*$/i.exec(String(raw));
  if (!m) throw new Error(`--size expects WxH (e.g. 1216x832), got "${raw}"`);
  const width = Number(m[1]);
  const height = Number(m[2]);
  // SDXL's VAE strides by 8; anything else silently rounds and shifts framing.
  if (width % 8 || height % 8) {
    throw new Error(`--size ${width}x${height}: both dimensions must be multiples of 8`);
  }
  return { width, height };
}

/**
 * Resolve --ref / --img2img / --size / --denoise once, for every preset.
 * Returns the graph-level knobs plus what to record in the sidecar.
 */
function referenceOptions(args, { defaultWidth, defaultHeight }) {
  const size = parseSize(args.size);
  const refPath = args.ref && args.ref !== true ? String(args.ref) : null;
  const initPath = args.img2img && args.img2img !== true ? String(args.img2img) : null;
  const refWeight = num(args, 'refWeight', REF_WEIGHT_DEFAULT);
  const refWeightType =
    args.refWeightType === true ? 'linear' : args.refWeightType || 'linear';
  const refScaling = args.refScaling === true ? 'K+V' : args.refScaling || 'K+V';
  const refStart = num(args, 'refStart', REF_START_DEFAULT);
  const refEnd = num(args, 'refEnd', REF_END_DEFAULT);
  const denoise = num(args, 'denoise', IMG2IMG_DENOISE_DEFAULT);

  return {
    width: num(args, 'width', size ? size.width : defaultWidth),
    height: num(args, 'height', size ? size.height : defaultHeight),
    refImage: refPath ? stageImage(refPath) : undefined,
    refWeight,
    refWeightType,
    refScaling,
    refStart,
    refEnd,
    initImage: initPath ? stageImage(initPath) : undefined,
    denoise: initPath ? denoise : 1,
    provenance: {
      ...(refPath
        ? {
            ref: refPath,
            refWeight,
            refWeightType,
            refScaling,
            refStart,
            refEnd,
            ipadapter: IPADAPTER_MODEL,
          }
        : {}),
      ...(initPath ? { img2img: initPath, denoise } : {}),
    },
  };
}

// --------------------------------------------------------------------------
// Presets
// --------------------------------------------------------------------------

/**
 * Queue one prompt and pull its PNG back into memory, checked.
 *
 * This is the single place a finished render exists as bytes, so this is where
 * the black-frame guard runs — before `--out`, before the `.raw.png`, before
 * rembg, before anything downstream can pick the file up.
 */
async function renderOnce(workflow) {
  const started = Date.now();
  const promptId = await queuePrompt(workflow);
  const entry = await waitForResult(promptId);
  const images = imagesFrom(entry);
  if (!images.length) throw new Error(`No images came back for prompt ${promptId}`);
  const buf = await fetchImage(images[0]);
  const maxRgb = maxRgbOfBuffer(buf);
  return { buf, promptId, maxRgb, seconds: (Date.now() - started) / 1000 };
}

async function generateOne({ workflow, outPath, postProcess, margin }) {
  let shot = await renderOnce(workflow);
  if (isBlackFrame(shot.maxRgb)) {
    shot = await recoverFromBlackFrame(workflow, shot);
  }
  const buf = shot.buf;
  const elapsed = shot.seconds;

  mkdirSync(dirname(outPath), { recursive: true });

  if (!postProcess) {
    writeFileSync(outPath, buf);
    return { outPath, seconds: elapsed, meta: null };
  }

  // Land the raw render next to the final file so a bad cutout is debuggable.
  const rawPath = outPath.replace(/\.png$/i, '.raw.png');
  writeFileSync(rawPath, buf);
  const meta = cutout(rawPath, outPath, margin);
  return { outPath, rawPath, seconds: elapsed, meta };
}

function outFor(outPath, index, batch) {
  if (batch <= 1) return outPath;
  return outPath.replace(/\.png$/i, `.${index + 1}.png`);
}

/**
 * Shared implementation of the `character` and `boss` presets. They differ
 * only in default framing and default canvas — same style contract, same
 * cutout, same sidecar, so they stay one code path on purpose.
 */
async function runSprite(args, { preset, defaultComposition, defaultWidth, defaultHeight, label }) {
  const name = required(args, 'name');
  const tags = required(args, 'tags');
  const pose = args.pose === true ? 'idle' : args.pose || 'idle';
  const poseTags = args.poseTags === true ? '' : args.poseTags || '';
  const outPath = resolve(process.cwd(), required(args, 'out'));
  const batch = Math.max(1, num(args, 'batch', 1));
  const steps = num(args, 'steps', 28);
  const cfg = num(args, 'cfg', 6);
  const sampler = args.sampler === true ? 'euler_ancestral' : args.sampler || 'euler_ancestral';
  const scheduler = args.scheduler === true ? 'normal' : args.scheduler || 'normal';
  const margin = num(args, 'margin', 16);
  const composition =
    args.composition === true ? defaultComposition : args.composition || defaultComposition;
  const baseSeed = num(args, 'seed', seedFromName(`${name}:${pose}`));
  // v3 facing contract: party art faces right, enemy art faces left, and the
  // sprite's own preset decides that unless the caller says otherwise.
  const facing =
    args.facing === true || args.facing === undefined
      ? defaultFacingFor(preset, composition)
      : String(args.facing);
  const facingPhrase =
    args.facingPhrase === undefined || args.facingPhrase === true
      ? null
      : String(args.facingPhrase);

  const emphasis =
    args.emphasis === undefined || args.emphasis === true ? null : String(args.emphasis);

  const positive = buildCharacterPrompt({
    tags,
    poseTags,
    composition,
    facing,
    facingPhrase,
    emphasis,
  });
  // The facing negatives are half of the facing recipe, so they ride along with
  // --facing rather than waiting for every caller to remember them.
  const facingNegative =
    facing === 'none' || composition === 'prone' ? '' : FACING_NEGATIVE;
  const negative = withNegAdd(SPRITE_NEGATIVE, joinTags(facingNegative, args.negAdd === true ? '' : args.negAdd));
  const ref = referenceOptions(args, { defaultWidth, defaultHeight });
  const results = [];

  for (let i = 0; i < batch; i++) {
    const seed = (baseSeed + i) % 2147483647;
    const target = outFor(outPath, i, batch);
    const workflow = characterWorkflow({
      positive,
      negative,
      width: ref.width,
      height: ref.height,
      seed,
      steps,
      cfg,
      sampler,
      scheduler,
      refImage: ref.refImage,
      refWeight: ref.refWeight,
      refWeightType: ref.refWeightType,
      refScaling: ref.refScaling,
      refStart: ref.refStart,
      refEnd: ref.refEnd,
      initImage: ref.initImage,
      denoise: ref.denoise,
      prefix: `pyrefly/${name}_${pose}`,
    });
    process.stderr.write(
      `[gen] ${label} ${name}/${pose} variant ${i + 1}/${batch} seed=${seed} facing=${facing}` +
        `${ref.refImage ? ` ref@${ref.refWeight}` : ''}` +
        `${ref.initImage ? ` img2img@${ref.denoise}` : ''}\n`,
    );
    const r = await generateOne({ workflow, outPath: target, postProcess: true, margin });
    const sidecar = {
      width: r.meta.width,
      height: r.meta.height,
      baselineY: r.meta.baselineY,
      seed,
      prompt: positive,
      negative,
      cropBox: r.meta.cropBox,
      source: { width: r.meta.sourceWidth, height: r.meta.sourceHeight },
      model: CHECKPOINT,
      steps,
      cfg,
      sampler,
      scheduler,
      pose,
      composition,
      facing,
      ...(facingPhrase ? { facingPhrase } : {}),
      canvas: { width: ref.width, height: ref.height },
      ...ref.provenance,
      generatedAt: new Date().toISOString(),
    };
    writeFileSync(target.replace(/\.png$/i, '.json'), `${JSON.stringify(sidecar, null, 2)}\n`);
    results.push({ ...r, seed, sidecar: target.replace(/\.png$/i, '.json') });
    process.stderr.write(
      `[gen]   -> ${target} ${r.meta.width}x${r.meta.height} baselineY=${r.meta.baselineY} (${r.seconds.toFixed(1)}s)\n`,
    );
  }
  return results;
}

async function runCharacter(args) {
  return runSprite(args, {
    preset: 'character',
    defaultComposition: 'full',
    defaultWidth: 832,
    defaultHeight: 1216,
    label: 'char',
  });
}

/**
 * Boss preset. Defaults to the 3:2 landscape bucket because most of the
 * roster is wider than tall (Mortiorchis, Vegnagun's leg, Ixion); the tall
 * ones — Anima, Yunalesca 3 — want `--size 832x1216`, and the square
 * `--size 1024x1024` suits the floaters. `--negAdd` is here because boss
 * prompts collide with English far more than party ones do ("flux", "core",
 * "pagoda" all summon the wrong noun).
 */
async function runBoss(args) {
  return runSprite(args, {
    preset: 'boss',
    defaultComposition: 'boss',
    defaultWidth: 1216,
    defaultHeight: 832,
    label: 'boss',
  });
}

/**
 * Hero preset — pause-screen cinematic close-ups.
 *
 * Deliberately NOT `runSprite` with a different composition, for one reason
 * that changes the whole code path: **no rembg**. These are full painted
 * plates, not cutouts, so there is no alpha crop, no `cropBox` and no
 * `baselineY` — the three things every sidecar field in `runSprite` exists to
 * carry. The pause overlay draws the landscape frame whole.
 *
 * `--ref` is expected rather than optional here: the face has to be the same
 * person the player just had in their party, and a close-up gives the
 * checkpoint far more room to drift than a 60 px-tall battlefield sprite does.
 * Moderate weight — the default 0.65 carries the idle's *lighting* into a shot
 * whose whole point is new lighting, so these run nearer 0.5.
 *
 * `--mood` is recorded in the sidecar and is not prompted from; the emotion
 * belongs in `--poseTags` where the encoder can see it. The field is there so
 * the pause screen (and the next person picking variants) knows what the shot
 * was *for*.
 */
async function runHero(args) {
  const name = required(args, 'name');
  const tags = required(args, 'tags');
  const poseTags = args.poseTags === true ? '' : args.poseTags || '';
  const outPath = resolve(process.cwd(), required(args, 'out'));
  const batch = Math.max(1, num(args, 'batch', 1));
  const steps = num(args, 'steps', 30);
  const cfg = num(args, 'cfg', 6);
  const sampler = args.sampler === true ? 'euler_ancestral' : args.sampler || 'euler_ancestral';
  const scheduler = args.scheduler === true ? 'normal' : args.scheduler || 'normal';
  const composition = args.composition === true ? 'hero' : args.composition || 'hero';
  const subject = args.subject === true || !args.subject ? name : String(args.subject);
  const mood = args.mood === true || !args.mood ? '' : String(args.mood);
  const baseSeed = num(args, 'seed', seedFromName(`hero:${name}`));
  const facing =
    args.facing === true || args.facing === undefined ? 'none' : String(args.facing);

  const facingPhrase =
    args.facingPhrase === undefined || args.facingPhrase === true
      ? null
      : String(args.facingPhrase);
  const emphasis =
    args.emphasis === undefined || args.emphasis === true ? null : String(args.emphasis);

  const positive = buildCharacterPrompt({
    tags,
    poseTags,
    composition,
    facing,
    facingPhrase,
    emphasis,
  });
  const negative = withNegAdd(HERO_NEGATIVE, args.negAdd === true ? '' : args.negAdd);
  const ref = referenceOptions(args, { defaultWidth: 1344, defaultHeight: 768 });
  const results = [];

  for (let i = 0; i < batch; i++) {
    const seed = (baseSeed + i) % 2147483647;
    const target = outFor(outPath, i, batch);
    const workflow = characterWorkflow({
      positive,
      negative,
      width: ref.width,
      height: ref.height,
      seed,
      steps,
      cfg,
      sampler,
      scheduler,
      refImage: ref.refImage,
      refWeight: ref.refWeight,
      refWeightType: ref.refWeightType,
      refScaling: ref.refScaling,
      refStart: ref.refStart,
      refEnd: ref.refEnd,
      initImage: ref.initImage,
      denoise: ref.denoise,
      prefix: `pyrefly/hero_${name}`,
    });
    process.stderr.write(
      `[gen] hero ${name} variant ${i + 1}/${batch} seed=${seed}` +
        `${ref.refImage ? ` ref@${ref.refWeight}` : ''}\n`,
    );
    // postProcess:false — the painted background is the point. See HERO_NEGATIVE.
    const r = await generateOne({ workflow, outPath: target, postProcess: false });
    const sidecar = {
      subject,
      mood,
      seed,
      prompt: positive,
      negative,
      model: CHECKPOINT,
      steps,
      cfg,
      sampler,
      scheduler,
      composition,
      facing,
      ...(emphasis ? { emphasis } : {}),
      canvas: { width: ref.width, height: ref.height },
      ...ref.provenance,
      generatedAt: new Date().toISOString(),
    };
    writeFileSync(target.replace(/\.png$/i, '.json'), `${JSON.stringify(sidecar, null, 2)}\n`);
    results.push({ ...r, seed });
    process.stderr.write(`[gen]   -> ${target} (${r.seconds.toFixed(1)}s)\n`);
  }
  return results;
}

async function runBackdrop(args) {
  const name = required(args, 'name');
  const tags = required(args, 'tags');
  const outPath = resolve(process.cwd(), required(args, 'out'));
  const batch = Math.max(1, num(args, 'batch', 1));
  const steps = num(args, 'steps', 30);
  const cfg = num(args, 'cfg', 6);
  const sampler = args.sampler === true ? 'euler_ancestral' : args.sampler || 'euler_ancestral';
  const scheduler = args.scheduler === true ? 'normal' : args.scheduler || 'normal';
  const baseSeed = num(args, 'seed', seedFromName(`backdrop:${name}`));

  const positive = buildBackdropPrompt({ tags });
  const negative = withNegAdd(BACKDROP_NEGATIVE, args.negAdd);
  const ref = referenceOptions(args, { defaultWidth: 1344, defaultHeight: 768 });
  const results = [];

  for (let i = 0; i < batch; i++) {
    const seed = (baseSeed + i) % 2147483647;
    const target = outFor(outPath, i, batch);
    const workflow = backdropWorkflow({
      positive,
      negative,
      width: ref.width,
      height: ref.height,
      seed,
      steps,
      cfg,
      sampler,
      scheduler,
      refImage: ref.refImage,
      refWeight: ref.refWeight,
      refWeightType: ref.refWeightType,
      refScaling: ref.refScaling,
      refStart: ref.refStart,
      refEnd: ref.refEnd,
      initImage: ref.initImage,
      denoise: ref.denoise,
      prefix: `pyrefly/backdrop_${name}`,
    });
    process.stderr.write(`[gen] backdrop/${name} variant ${i + 1}/${batch} seed=${seed}\n`);
    const r = await generateOne({ workflow, outPath: target, postProcess: false });
    writeFileSync(
      target.replace(/\.png$/i, '.json'),
      `${JSON.stringify(
        {
          seed,
          prompt: positive,
          negative,
          model: CHECKPOINT,
          upscaler: UPSCALE_MODEL,
          steps,
          cfg,
          sampler,
          scheduler,
          canvas: { width: ref.width, height: ref.height },
          ...ref.provenance,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
    results.push({ ...r, seed });
    process.stderr.write(`[gen]   -> ${target} (${r.seconds.toFixed(1)}s)\n`);
  }
  return results;
}

// --------------------------------------------------------------------------
// CLI
// --------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else {
        args[key] = next;
        i++;
      }
    } else args._.push(a);
  }
  return args;
}

function required(args, key) {
  if (!args[key] || args[key] === true) {
    throw new Error(`Missing required --${key}`);
  }
  return String(args[key]);
}

/**
 * Numeric flag with a default.
 *
 * `parseArgs` gives `true` for a flag typed without a value (`--steps` at the
 * end of the line). `Number(true)` is 1, which would silently render a
 * one-step image, so treat a valueless flag as "not given" and shout about a
 * non-numeric one.
 */
function num(args, key, fallback) {
  const raw = args[key];
  if (raw === undefined || raw === true) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`--${key} expects a number, got "${raw}"`);
  return n;
}

const USAGE = `
pyrefly art generator (ComfyUI ${BASE})

  node tools/gen/comfy.mjs character --name <id> --tags "<danbooru tags>" \\
      [--pose <pose>] [--poseTags "<tags>"] --out <path.png>
      [--batch N] [--seed N] [--steps 28] [--cfg 6] [--margin 16]
      [--composition full|portrait|prone|boss] [--facing right|left|none]
      [--negAdd "<extra negatives>"]
      [--ref <png>] [--refWeight ${REF_WEIGHT_DEFAULT}] [--refStart ${REF_START_DEFAULT}] [--refEnd ${REF_END_DEFAULT}]
      [--refWeightType linear] [--refScaling K+V]
      [--img2img <png>] [--denoise ${IMG2IMG_DENOISE_DEFAULT}]
      [--size WxH] [--width N] [--height N]

  node tools/gen/comfy.mjs boss --name <id> --tags "<danbooru tags>" --out <path.png>
      same flags; defaults to 1216x832 landscape and --composition boss
      (use --size 1024x1024 for floaters, --size 832x1216 for tall forms)

  node tools/gen/comfy.mjs hero --name <id> --tags "<danbooru tags>" \\
      --poseTags "<expression + scene>" --out public/art/pause/<id>.png
      [--subject "<who>"] [--mood "<one line>"] [--batch N] [--seed N]
      1344x768 landscape, --composition hero, NO rembg (the painted
      background is kept). Point --ref at the character's approved idle at
      ~0.5 so the face matches the cast without importing its lighting.

  node tools/gen/comfy.mjs backdrop --name <id> --tags "<scene tags>" --out <path.png>
      [--batch N] [--seed N] [--steps 30] [--cfg 6] [--negAdd "<extra negatives>"]
      [--size WxH] [--ref <png>] [--img2img <png>] [--denoise ${IMG2IMG_DENOISE_DEFAULT}]

Facing contract (v3):
  --facing right    Party art: body angled toward the RIGHT of the frame, so
                    the party (who stand on the left) face the enemy. Default
                    for the "character" preset.
  --facing left     Enemy/boss/aeon art, angled the other way. Default for the
                    "boss" preset.
  --facing none     v2 behaviour, plain "straight-on". Default for
                    --composition portrait (a HUD head-shot meets the player's
                    eye and is not on the battlefield).
  --facingPhrase    A/B escape hatch: use this literal phrase instead of the
                    one in FACING_PHRASES. For testing, not for the cast.

Emphasis:
  --emphasis "..."  The ONLY prompt channel that is not paren-escaped, so it is
                    the only place CLIP emphasis syntax actually works:
                      --emphasis "(scar over his right eye:1.4), (black hair:1.2)"
                    The same text in --tags or --poseTags is escaped to literal
                    characters and weighs nothing. Two or three tokens, no more —
                    it is for out-shouting a character prior, not for prompting.

Reference consistency:
  --ref <png>       IP-Adapter identity anchor. Point it at an approved idle
                    and the new pose keeps that face, hair and costume while
                    --poseTags changes what the body is doing.
  --refStart ${REF_START_DEFAULT}   When the reference switches on, as a fraction of the
                    denoise. NOT zero: an adapter running from step 0
                    reproduces the reference's pose and ignores --poseTags.
                    This flag, not --refWeight, is what makes --ref usable.
  --img2img <png>   Blunter fallback: start from the pixels of <png> and
                    redraw them at --denoise (default ${IMG2IMG_DENOISE_DEFAULT}). Keeps the
                    silhouette; use when --ref is not enough (odd forms).

Black frames:
  Every finished render is decoded before it is written anywhere. A render whose
  every RGB sample is 0 — the signature of a NaN'd GPU, which ComfyUI does not
  report as an error — is never written to --out or a candidate slot. It is
  logged to ${BLACK_FRAME_LOG}, ComfyUI is restarted (at most once
  per 10 minutes, sentinel ${BLACK_RESTART_SENTINEL}) and the
  same prompt is resubmitted once. Black again -> exit 1, GPU needs attention.
  See docs/handoff/art-ops.md.

Env: COMFY_HOST, COMFY_PORT, COMFY_ROOT, COMFY_INPUT, COMFY_CKPT,
     COMFY_UPSCALER, COMFY_IPADAPTER, COMFY_CLIPVISION, COMFY_LOG_DIR,
     COMFY_TASK
`.trim();

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || args.help) {
    console.log(USAGE);
    // Asking for help is a success; being invoked with no command is not.
    process.exit(args.help ? 0 : 1);
  }

  await waitForServer(60_000);

  let results;
  if (cmd === 'character') results = await runCharacter(args);
  else if (cmd === 'boss') results = await runBoss(args);
  else if (cmd === 'hero') results = await runHero(args);
  else if (cmd === 'backdrop') results = await runBackdrop(args);
  else {
    console.error(`Unknown command "${cmd}"\n\n${USAGE}`);
    process.exit(1);
  }

  const total = results.reduce((s, r) => s + r.seconds, 0);
  console.log(
    JSON.stringify(
      {
        ok: true,
        count: results.length,
        secondsPerImage: Number((total / results.length).toFixed(1)),
        files: results.map((r) => r.outPath),
      },
      null,
      2,
    ),
  );
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((err) => {
    console.error(`\n[gen] FAILED: ${err.message}`);
    process.exit(1);
  });
}
