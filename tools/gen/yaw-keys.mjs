#!/usr/bin/env node
/**
 * Painted yaw keys for the living-portrait rig (prototype v2).
 *
 * The measured motion spec (`docs/plans/pause-living-portraits-motion-spec.md`,
 * §1.1 and §13.1) says the reference's headline move is **>= 90 degrees of
 * yaw**, ending in a full profile. No 2D warp of one frontal painting reaches
 * that — prototype v1's "~11 degrees equivalent at full deflection" is why the
 * screen reads as a photo being pushed around. The rig therefore morphs
 * between *painted* yaw keys, and this tool paints them.
 *
 * Four keys, all viewer-relative (see KEYS below):
 *   q34-left, q34-right, profile-left, profile-right
 * The frontal key is the approved plate itself and is NEVER regenerated or
 * edited (`public/art/portraits/yuna-x2.png`, hashed in
 * `docs/target/approved-hashes.json`).
 *
 * Recipe: R2 (docs/ART-PIPELINE.md §3) — the plate's own identity block
 * verbatim, the approved plate as the IP-Adapter reference at 0.35 with
 * --forceRef, R2's refStart/refEnd/weight-type defaults, Danbooru view tags in
 * the one unescaped prompt channel (`--facingPhrase`), and no effect words.
 *
 * Usage:
 *   node tools/gen/yaw-keys.mjs render --key all --batch 6 [--config A]
 *   node tools/gen/yaw-keys.mjs render --key q34-left --batch 2 --config B
 *   node tools/gen/yaw-keys.mjs list
 *
 * Contact sheets and the align-to-plate step live in the companion
 * `tools/gen/yaw-keys-sheet.py` (PIL, ComfyUI's embedded python).
 */

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const COMFY = resolve(HERE, 'comfy.mjs');

/** The approved frontal plate. Read-only: reference and framing anchor only. */
export const PLATE = 'public/art/portraits/yuna-x2.png';

/**
 * The plate's own identity block, copied verbatim out of
 * `public/art/portraits/yuna-x2.json` — everything in that sidecar's `prompt`
 * before its pose tags ("looking at viewer, confident smirk").
 *
 * It is short for a 2026-09-21 identity block, and that is deliberate: it is
 * what actually painted the plate Bailey picked, and §3 "Writing an identity
 * block" says the description that produced the approved art *is* the art
 * direction. Lengthening it here would be a different, unproven prompt. The
 * IP-Adapter reference carries the rest.
 */
export const IDENTITY =
  '1girl, yuna \\(ff10-2\\), final fantasy x-2, safe, solo, brown hair, short hair, ' +
  'single long braid, heterochromia, blue eye, green eye, gunner, pink hood';

/** Expression, identical for every key: the brief's neutral-to-slight-smile. */
export const EXPRESSION = 'slight smile, closed mouth, eyes open';

/**
 * Bans that keep a yaw key from collapsing back to the frontal plate.
 *
 * `FACING_NEGATIVE` from comfy.mjs is the proven half of the facing recipe,
 * but it only rides along when `--facing` is used; these keys drive the view
 * through `--facingPhrase` instead, so the bans are passed explicitly. The
 * extras are the two failure modes a profile prompt actually has: the eyes
 * snapping back to camera, and the head over-rotating past profile.
 */
export const NEG_ADD =
  'facing viewer, front view, straight-on, symmetrical, from behind, facing away, ' +
  'looking at viewer, back of head, back view';

/**
 * The four keys.
 *
 * **Direction is viewer-relative**, and the rig reads it the same way:
 * "left" means the face points toward the LEFT edge of the frame. Which of
 * Yuna's heterochromatic eyes survives follows from that, read off the plate:
 * in the plate her viewer-left eye is GREEN and her viewer-right eye is BLUE,
 * i.e. her own right eye is green and her own left eye is blue. Turn the face
 * toward frame-left and the camera sees her right side, so the visible eye is
 * the GREEN one; toward frame-right, the BLUE one.
 *
 * The direction words are the repo's own proven ones. Pilot round 1 asked for
 * "head turned to the left" and got a near-frontal head with a slight turn the
 * OTHER way every time: the checkpoint reads "turned to the left" as the
 * subject's own left, i.e. frame-right, and it is weak besides. `body facing
 * left` / `body facing right` are frame-relative and are what
 * `FACING_PHRASES` in comfy.mjs has been steering the whole roster with since
 * v3 (docs/ART-PIPELINE.md §2a) — every party sprite renders body-to-frame-right
 * from that phrase. `(looking at viewer:1.2)` rides along in the roster's
 * version and is deliberately dropped here: the brief wants the eyes looking
 * where the head looks.
 */
export const KEYS = {
  'q34-left': {
    yaw: -40,
    visibleEye: 'green (her right)',
    view: '(from side:1.2), three-quarter view, (body facing left:1.4), (facing left:1.3), looking to the side',
    negAdd: 'facing right, body facing right',
  },
  'q34-right': {
    yaw: 40,
    visibleEye: 'blue (her left)',
    view: '(from side:1.2), three-quarter view, (body facing right:1.4), (facing right:1.3), looking to the side',
    negAdd: 'facing left, body facing left',
  },
  'profile-left': {
    yaw: -90,
    visibleEye: 'green (her right)',
    view: '(profile:1.4), (from side:1.3), (body facing left:1.4), (facing left:1.4), looking to the side',
    negAdd: 'facing right, body facing right',
  },
  'profile-right': {
    yaw: 90,
    visibleEye: 'blue (her left)',
    view: '(profile:1.4), (from side:1.3), (body facing right:1.4), (facing right:1.4), looking to the side',
    negAdd: 'facing left, body facing left',
  },
};

/**
 * Three ways of asking the same question, kept so the pilot is re-runnable.
 *
 * The plate is a `--composition portrait` cut-out, so C is the literal
 * like-for-like. But that framing block hard-codes `looking at viewer` and its
 * facing table hard-codes `straight-on`, and on this checkpoint `straight-on`
 * wins an argument with `three-quarter view` (comfy.mjs, HERO_FACING_PHRASES) —
 * which is exactly why the hero block exists and why the brief asks for it.
 * A is the hero framing with the plate's own negative and the plate's cut-out
 * post-process; B is the literal `hero` preset (no rembg, HERO_NEGATIVE).
 */
export const CONFIGS = {
  A: { preset: 'character', composition: 'hero', steps: 28, cfg: 6, rembg: true },
  B: { preset: 'hero', composition: 'hero', steps: 30, cfg: 6, rembg: false },
  C: { preset: 'character', composition: 'portrait', steps: 28, cfg: 6, rembg: true },
};

export const CANVAS = { width: 832, height: 1216 };

/** R2 reference settings (docs/ART-PIPELINE.md §3), with the brief's weight. */
export const REF = {
  weight: 0.35,
  start: 0.2,
  end: 0.6,
  weightType: 'ease in',
  scaling: 'K+V',
};

/** Deterministic per key+config so a re-run reproduces the same candidates. */
function seedFor(key, config) {
  let h = 2166136261;
  for (const ch of `yawkey:${key}:${config}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2147483647;
}

function run(cmd, args, { cwd = REPO_ROOT } = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, args, { cwd, stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('error', fail);
    p.on('close', (code) =>
      code === 0 ? ok() : fail(new Error(`${cmd} exited ${code}`)),
    );
  });
}

/**
 * Render one key's candidate batch.
 *
 * Everything that is not the view phrase is held fixed across the four keys,
 * so a difference on a contact sheet is the yaw and nothing else.
 */
export async function renderKey(
  key,
  { batch, config, outRoot, refWeight, refStart, tag, viewExtra, emphasis },
) {
  const spec = KEYS[key];
  if (!spec) throw new Error(`Unknown key "${key}" (have: ${Object.keys(KEYS).join(', ')})`);
  const cfg = CONFIGS[config];
  if (!cfg) throw new Error(`Unknown --config "${config}" (have: ${Object.keys(CONFIGS).join(', ')})`);

  const sub = tag ? `pilot-${tag}` : config === 'A' ? '' : `pilot-${config}`;
  const dir = resolve(REPO_ROOT, outRoot, sub);
  mkdirSync(dir, { recursive: true });
  const out = resolve(dir, `${key}.png`);
  // `--viewExtra` appends to the key's own view phrase (still the one channel
  // comfy.mjs does not escape) instead of replacing it, so a redo round can add
  // a targeted call-out — e.g. "one eye visible, blue eye visible" for a profile
  // that keeps losing its iris colour — without forking KEYS itself.
  const view = viewExtra ? `${spec.view}, ${viewExtra}` : spec.view;

  // `--facingPhrase` is the only prompt channel comfy.mjs does not run through
  // escapeTags, so it is the only one where (profile:1.4) reaches CLIP as a
  // weight instead of as literal backslashes (comfy.mjs, "--emphasis").
  const args = [
    COMFY,
    cfg.preset,
    '--name', 'yuna-x2-yaw',
    ...(cfg.preset === 'character' ? ['--pose', key] : []),
    '--tags', IDENTITY,
    '--poseTags', EXPRESSION,
    '--facingPhrase', view,
    ...(emphasis ? ['--emphasis', emphasis] : []),
    '--negAdd', spec.negAdd ? `${NEG_ADD}, ${spec.negAdd}` : NEG_ADD,
    '--composition', cfg.composition,
    '--size', `${CANVAS.width}x${CANVAS.height}`,
    '--steps', String(cfg.steps),
    '--cfg', String(cfg.cfg),
    '--seed', String(seedFor(key, `${config}${tag || ''}`)),
    '--batch', String(batch),
    '--ref', PLATE,
    '--refWeight', String(refWeight ?? REF.weight),
    '--refStart', String(refStart ?? REF.start),
    '--refEnd', String(REF.end),
    '--refWeightType', REF.weightType,
    '--refScaling', REF.scaling,
    '--forceRef',
    // The hero framing block asks for bokeh, so rembg regularly leaves a pale
    // blob at a frame edge and the cut-out sanity guard (docs/ART-PIPELINE.md
    // §6) quarantines the render. That guard protects battlefield sprites,
    // where a kept background blob lands in a scene; a yaw key is cut to the
    // head and judged 1:1 on a contact sheet before anything is picked, so the
    // guard's verdict here costs candidates and buys nothing.
    ...(cfg.rembg ? ['--keepBad'] : []),
    '--out', out,
  ];
  process.stderr.write(
    `\n[yaw-keys] ${key} config ${config} (${cfg.preset}/${cfg.composition}) ` +
      `batch ${batch} ref@${refWeight ?? REF.weight} start ${refStart ?? REF.start} -> ${out}\n`,
  );
  await run(process.execPath, args);
  return out;
}

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--')) {
      a._.push(t);
      continue;
    }
    const k = t.slice(2);
    const n = argv[i + 1];
    if (n === undefined || n.startsWith('--')) a[k] = true;
    else {
      a[k] = n;
      i++;
    }
  }
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'help';

  if (cmd === 'list') {
    for (const [k, v] of Object.entries(KEYS)) {
      process.stdout.write(`${k.padEnd(14)} yaw ${String(v.yaw).padStart(4)}  eye ${v.visibleEye}\n    ${v.view}\n`);
    }
    return;
  }
  if (cmd !== 'render') {
    process.stdout.write(
      `Usage:\n` +
        `  node tools/gen/yaw-keys.mjs render --key all|<key> [--batch 6] [--config A|B|C]\n` +
        `                                     [--refWeight 0.35] [--refStart 0.2] [--tag <name>]\n` +
        `                                     [--viewExtra "<phrase appended to the key's view>"]\n` +
        `                                     [--emphasis "<(weighted:1.3) tags, unescaped>"]\n` +
        `                                     [--outRoot <dir>]\n` +
        `  node tools/gen/yaw-keys.mjs list\n\n` +
        `Keys: ${Object.keys(KEYS).join(', ')}\n` +
        `Configs: ${Object.keys(CONFIGS).join(', ')}\n`,
    );
    return;
  }

  const key = args.key === true || !args.key ? 'all' : String(args.key);
  const batch = Math.max(1, Number(args.batch === true ? 6 : args.batch || 6));
  const config = args.config === true ? 'A' : String(args.config || 'A');
  const refWeight = args.refWeight === true ? undefined : Number(args.refWeight ?? REF.weight);
  const refStart = args.refStart === true ? undefined : Number(args.refStart ?? REF.start);
  const tag = args.tag === true || !args.tag ? null : String(args.tag);
  const viewExtra = args.viewExtra === true || !args.viewExtra ? null : String(args.viewExtra);
  const emphasis = args.emphasis === true || !args.emphasis ? null : String(args.emphasis);
  const outRoot =
    args.outRoot === true || !args.outRoot
      ? 'docs/concepts/pause-until-dawn/prototype-v2/art/keys/_cand'
      : String(args.outRoot);

  const keys = key === 'all' ? Object.keys(KEYS) : [key];
  for (const k of keys) {
    await renderKey(k, { batch, config, outRoot, refWeight, refStart, tag, viewExtra, emphasis });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((err) => {
    process.stderr.write(`\n[yaw-keys] ${err.message}\n`);
    process.exit(1);
  });
}
