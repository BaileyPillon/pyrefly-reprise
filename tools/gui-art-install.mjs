#!/usr/bin/env node
/**
 * Install the overnight art run's PROVISIONAL picks for the hidden Sinspawn Gui chapter (branch `ch-gui`; FFX only).
 *
 *   node tools/gui-art-install.mjs [--dest public/art] [--dry-run] [--list]
 *
 * Every picture is a candidate from the fourth overnight art run (`F:/pyrefly-overnight-art/2026-10-10/new-chapters-picks.md`, newer renders under
 * `D:/pyrefly-overnight-art/2026-10-10/`): original art only (rule 8), an agent's provisional pick and NOT Bailey's approval (hard rule 9). They go into NEW subject folders
 * (`characters/sinspawn-gui*`) and never replace an approved painting; a file that already stands there is copied to `<real dest>-replaced/` (outside the repo) first, never overwritten in place
 * (the release art tree is hard-linked, so an in-place write would change a file the live build serves). The source table below is the one place a pick is changed.
 *
 * What one install does to each picture: read it as RGBA; take the run's own painted ground shadow out (a large pale grey patch low in the frame, removed; a faint one by a smoothstep on the alpha from 0.35 to 0.7: the engine draws its own
 * contact shadow); crop to the figure with the house 16 px margin; write `<pose>.png` and its sidecar `<pose>.json` (the fields the engine reads: width, height, baselineY, facing;
 * provenance beside them); then regenerate the manifest (`tools/gen/manifest.mjs`) so the game lists the new files. No 2x tier is made (the figures are 800 to 1,100 px
 * already; the run's own upscaler is not needed for a provisional set), and no registration row is written: an enemy is sized by its scene (`src/scenes/mushroom-rock-road.ts`).
 *
 * Enemy figures face LEFT by the house contract (`facing: 'left'`): the enemy side faces -x, so a left-facing painting is never mirrored.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const require = createRequire(join(REPO, 'package.json'));
const sharp = require('sharp');

const F = 'F:/pyrefly-overnight-art/2026-10-10/';
const D = 'D:/pyrefly-overnight-art/2026-10-10/';

/** subject -> pose -> source picture. `idle` is the standing pose; `telegraph` the head's shake; `ko` the figure down; a missing pose falls back to idle in the engine. */
const PICKS = {
  // Fight 1: the body, the head high on its neck, the two arms (the guard pose is the idle; the hanging arm is the KO, which is also how an arm shows when it is down).
  'sinspawn-gui': {
    idle: F + 'sinspawn-gui-body/idle/t10-gui-body-L1-cand-103.png',
    hurt: F + 'sinspawn-gui-body/hurt/t10-gui-body-hurt-cand-101.png',
    ko: F + 'sinspawn-gui-body/dying/t10-gui-body-dying-cand-104.png',
  },
  'sinspawn-gui-head': {
    idle: F + 'sinspawn-gui-head/idle/t10-gui-head-2-cand-306.png',
    telegraph: F + 'sinspawn-gui-head/shake2/t10-gui-head-shake2-cand-101.png',
    attack: F + 'sinspawn-gui-head/spit/t10-gui-head-spit-cand-101.png',
    ko: F + 'sinspawn-gui-head/dead/t10-gui-head-dead-cand-104.png',
  },
  'sinspawn-gui-arm-left': {
    idle: F + 'sinspawn-gui-arm-left/guard/t10-gui-arml-guard-4-cand-404.png',
    hurt: F + 'sinspawn-gui-arm-left/hit/t10-gui-arml-hit-cand-101.png',
    ko: F + 'sinspawn-gui-arm-left/guard/t10-gui-arml-guard-2-cand-206.png',
  },
  'sinspawn-gui-arm-right': {
    idle: F + 'sinspawn-gui-arm-right/guard/t10-gui-armr-guard-4-cand-404.png',
    ko: F + 'sinspawn-gui-arm-right/guard/t10-gui-armr-guard-2-cand-206.png',
  },
  // Fight 2: the same body after the beam (dimmer, cracked, pale light seeping from the cracks) and its cracked head; the arms are the same paintings.
  'sinspawn-gui-2': {
    idle: F + 'sinspawn-gui-body/idle-link2/t10-gui-body-link2-cand-106.png',
    hurt: F + 'sinspawn-gui-body/hurt/t10-gui-body-hurt-cand-101.png',
    ko: F + 'sinspawn-gui-body/dying/t10-gui-body-dying-cand-104.png',
  },
  'sinspawn-gui-head-2': {
    idle: F + 'sinspawn-gui-head/idle-link2/t10-gui-head-link2-cand-103.png',
    telegraph: F + 'sinspawn-gui-head/shake2/t10-gui-head-shake2-cand-101.png',
    attack: F + 'sinspawn-gui-head/spit/t10-gui-head-spit-cand-101.png',
    ko: F + 'sinspawn-gui-head/dead/t10-gui-head-dead-cand-104.png',
  },
};

/** The two plates of the Ridge: the camp (fight 1) and the ruined camp (fight 2), 2688 x 1536 (the run's RealESRGAN x4 then x0.5 of a 1344 x 768 render made from our own code-drawn layout sketch). */
const BACKDROPS = {
  'mushroom-rock-road': D + 'mushroom-ridge/backdrop/t10-up-ridge-p3-506-cand-1.raw.png',
  'mushroom-rock-road-ruined': D + 'mushroom-ridge-ruined/backdrop/t10-up-ruined-i2i-301-cand-1.raw.png',
};

const MARGIN = 16;
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const DEST = resolve(REPO, arg('--dest', 'public/art'));
/** Replaced files are kept beside the REAL art folder, outside the repo (`public/art` is a junction in a worktree; a folder inside `public/` would ship in a build and trip the dev server's watcher). */
const REPLACED = `${existsSync(DEST) ? realpathSync(DEST) : DEST}-replaced`;
const DRY = process.argv.includes('--dry-run');

if (process.argv.includes('--list')) {
  for (const [subject, poses] of Object.entries(PICKS)) for (const [pose, src] of Object.entries(poses)) console.log(`${subject}/${pose}  <-  ${src}`);
  for (const [key, src] of Object.entries(BACKDROPS)) console.log(`backdrops/${key}  <-  ${src}`);
  process.exit(0);
}

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

/** The figure's alpha with the faint baked shadow taken out: a smoothstep from 0.35 to 0.7 of full. */
function cleanAlpha(rgba, n) {
  const out = Buffer.from(rgba);
  for (let i = 0; i < n; i++) {
    const a = out[i * 4 + 3] / 255;
    const t = Math.min(1, Math.max(0, (a - 0.35) / 0.35));
    out[i * 4 + 3] = Math.round(t * t * (3 - 2 * t) * 255);
  }
  return out;
}

/**
 * Some picks carry the run's own painted ground shadow as OPAQUE neutral grey pixels (the matte could not tell it from the figure). The figure is tinted (purple, bone, red), so a
 * large connected patch of NEUTRAL grey (r, g and b within 6) that is not dark, in the lower 40 percent of the frame, is the shadow: take it out (alpha 0), then two pixels of
 * the soft neutral fringe around it. Components under 1,500 px (the teeth, the stars on the hide, a claw's highlight) are left alone, and so are the dark claws.
 */
function removeBakedShadow(rgba, w, h) {
  const out = Buffer.from(rgba);
  const lowRow = Math.floor(h * 0.6);
  const lum = (i) => 0.299 * out[i * 4] + 0.587 * out[i * 4 + 1] + 0.114 * out[i * 4 + 2];
  const spread = (i) => Math.max(out[i * 4], out[i * 4 + 1], out[i * 4 + 2]) - Math.min(out[i * 4], out[i * 4 + 1], out[i * 4 + 2]);
  const core = (i) => out[i * 4 + 3] >= 200 && spread(i) <= 6 && lum(i) >= 80 && lum(i) <= 240;
  const seen = new Uint8Array(w * h);
  const gone = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  for (let y0 = lowRow; y0 < h; y0++) {
    for (let x0 = 0; x0 < w; x0++) {
      const start = y0 * w + x0;
      if (seen[start] || !core(start)) continue;
      let head = 0, tail = 0;
      queue[tail++] = start;
      seen[start] = 1;
      while (head < tail) {
        const i = queue[head++];
        const x = i % w, y = (i - x) / w;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < lowRow || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (!seen[j] && core(j)) { seen[j] = 1; queue[tail++] = j; }
        }
      }
      if (tail >= 1500) for (let k = 0; k < tail; k++) gone[queue[k]] = 1;
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    const next = Uint8Array.from(gone);
    for (let y = lowRow; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (gone[i] || out[i * 4 + 3] < 200 || spread(i) > 8 || lum(i) < 50) continue;
        if ((x > 0 && gone[i - 1]) || (x < w - 1 && gone[i + 1]) || (y > 0 && gone[i - w]) || (y < h - 1 && gone[i + w])) next[i] = 1;
      }
    }
    gone.set(next);
  }
  for (let i = 0; i < w * h; i++) if (gone[i]) out[i * 4 + 3] = 0;
  return out;
}

/** Crop box of the pixels with alpha above 8 (of 255), grown by the margin and clamped to the canvas later. */
function contentBox(rgba, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error('no content');
  return { x0, y0, x1, y1 };
}

async function install(subject, pose, src) {
  if (!existsSync(src)) throw new Error(`missing source ${src}`);
  const raw = readFileSync(src);
  const { data, info } = await sharp(raw).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cleaned = cleanAlpha(removeBakedShadow(data, info.width, info.height), info.width * info.height);
  const box = contentBox(cleaned, info.width, info.height);
  const w = box.x1 - box.x0 + 1 + 2 * MARGIN;
  const h = box.y1 - box.y0 + 1 + 2 * MARGIN;
  const png = await sharp(cleaned, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left: box.x0, top: box.y0, width: box.x1 - box.x0 + 1, height: box.y1 - box.y0 + 1 })
    .extend({ top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const dir = join(DEST, 'characters', subject);
  const file = join(dir, `${pose}.png`);
  const side = join(dir, `${pose}.json`);
  const sidecar = {
    width: w,
    height: h,
    baselineY: h - MARGIN,
    facing: 'left',
    pose,
    status: 'PROVISIONAL: an overnight agent pick (2026-10-10), NOT Bailey\'s approval; new subject, replaces no approved painting (hard rule 9)',
    game: 'FFX only (the hidden Sinspawn Gui chapter, Mushroom Rock Road)',
    source: src.replace(/\\/g, '/'),
    sourceSha256: sha(raw),
    cut: 'the run\'s own cutout, its faint baked ground shadow taken out of the alpha (smoothstep 0.35 to 0.7), tight crop with a 16 px margin (tools/gui-art-install.mjs)',
    origin: 'Original art only (rule 8): our own renders from our own prompts; no retail image as input or reference',
    installedBy: 'tools/gui-art-install.mjs',
  };
  const same = existsSync(file) && sha(readFileSync(file)) === sha(png);
  if (DRY) {
    console.log(`${same ? 'same  ' : 'WRITE '} ${subject}/${pose}  ${w}x${h}  <-  ${src}`);
    return;
  }
  if (same) {
    console.log(`same   ${subject}/${pose}`);
    return;
  }
  mkdirSync(dir, { recursive: true });
  for (const f of [file, side]) {
    if (existsSync(f)) {
      const keep = join(REPLACED, 'characters', subject);
      mkdirSync(keep, { recursive: true });
      copyFileSync(f, join(keep, `${pose}.${Date.now()}${f.endsWith('.json') ? '.json' : '.png'}`)); // a copy, then the new file by rename: never a write in place
    }
  }
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, png);
  renameSync(tmp, file);
  const tmpJ = `${side}.tmp`;
  writeFileSync(tmpJ, `${JSON.stringify(sidecar, null, 2)}\n`);
  renameSync(tmpJ, side);
  console.log(`wrote  ${subject}/${pose}  ${w}x${h}`);
}

/** A plate: the picture as it is (no matte), written as `backdrops/<key>.png` with its sidecar. */
async function installPlate(key, src) {
  if (!existsSync(src)) throw new Error(`missing source ${src}`);
  const raw = readFileSync(src);
  const png = await sharp(raw).removeAlpha().png({ compressionLevel: 9 }).toBuffer();
  const meta = await sharp(png).metadata();
  const dir = join(DEST, 'backdrops');
  const file = join(dir, `${key}.png`);
  const side = join(dir, `${key}.json`);
  const sidecar = {
    width: meta.width,
    height: meta.height,
    status: "PROVISIONAL: an overnight agent pick (2026-10-10), NOT Bailey's approval; a new plate, replaces no approved painting (hard rule 9)",
    game: 'FFX only (the hidden Sinspawn Gui chapter, Mushroom Rock Road)',
    source: src.replace(/\\/g, '/'),
    sourceSha256: sha(raw),
    origin: 'Original art only (rule 8): our own render from our own prompt and our own code-drawn layout sketch; no retail image as input or reference',
    installedBy: 'tools/gui-art-install.mjs',
  };
  const same = existsSync(file) && sha(readFileSync(file)) === sha(png);
  if (DRY || same) {
    console.log(`${same ? 'same  ' : 'WRITE '} backdrops/${key}  ${meta.width}x${meta.height}  <-  ${src}`);
    return;
  }
  mkdirSync(dir, { recursive: true });
  for (const f of [file, side]) {
    if (existsSync(f)) {
      const keep = join(REPLACED, 'backdrops');
      mkdirSync(keep, { recursive: true });
      copyFileSync(f, join(keep, `${key}.${Date.now()}${f.endsWith('.json') ? '.json' : '.png'}`));
    }
  }
  writeFileSync(`${file}.tmp`, png);
  renameSync(`${file}.tmp`, file);
  writeFileSync(`${side}.tmp`, `${JSON.stringify(sidecar, null, 2)}
`);
  renameSync(`${side}.tmp`, side);
  console.log(`wrote  backdrops/${key}  ${meta.width}x${meta.height}`);
}

for (const [subject, poses] of Object.entries(PICKS)) {
  for (const [pose, src] of Object.entries(poses)) await install(subject, pose, src);
}
for (const [key, src] of Object.entries(BACKDROPS)) await installPlate(key, src);
if (!DRY) {
  const r = spawnSync(process.execPath, [join(REPO, 'tools', 'gen', 'manifest.mjs'), `--root=${DEST}`, '--quiet'], { cwd: REPO, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`manifest regenerated in ${DEST}`);
}
console.log(DRY ? 'dry run: nothing written' : 'done');
void dirname;
