/**
 * **A rig's two texture tiers: the master's crops (2x) and their half-size twins (1x)** (the rig program; both games, shared plumbing; Bailey, 2026-10-17, "start rigging for all chapters").
 *
 * A rig is cut from the 2x master of its costume painting (`rig.json` `scale` 2), so its part PNGs are the master's pixels: about 4.3 Mpx a figure for Kimahri, 23 MB of GPU memory
 * with mips. A phone budgets 220 MB for ALL the figures' textures (`engine/ArtBudget.ts`), and six such figures are 138 MB of it. Paintings solve this with `<state>@2x.png` beside the 1x
 * file and a device rule that picks one; the rig does the same: beside every part PNG and rim mask, `1x/<same name>` holds the picture at half the width and height. The mesh, the uvs and
 * the rim mask need nothing else (uvs are 0..1 of the image), so the engine just binds the other file (`engine/rig/RigTier.ts` picks, by the same device rule as the paintings).
 *
 * **The 1x files are DERIVED, never authored, and proved.** The rule (`rig-tier/1`) is a 2x2 box filter in integers, so it is the same on every machine and in every library version:
 *   - an image with an alpha channel is averaged premultiplied: where the four texels hold any alpha, `colour = round(sum(colour * alpha) / sum(alpha))` and `alpha = round(sum(alpha) / n)`;
 *     where they hold none, the colour under alpha 0 is the plain mean of the four (a cut part's colour bled past its edge stays bled, so a bilinear fetch at the border draws no dark halo);
 *   - an opaque image (a rim mask is 8-bit grey) is the plain mean;
 *   - an odd edge: the missing texels are not counted (`n` is the number of texels inside), so a border texel is the picture's own, not half of it.
 * `verifyTiers` decodes a 1x file and the file it derives from, applies the rule again and requires every byte of every channel to be equal; a folder holds exactly the derived files.
 * The deploy runs it on every rig that ships (`tools/rig/rig-ship.mjs`), and the 1x files are art like any other: the build derives them (`tools/art-derive.mjs`), proves them and
 * loads them in two engines.
 *
 *   node tools/rig-tiers.mjs write  --rig <folder with rig.json>[,<folder>...]     write (or rewrite) <rig>/1x/*
 *   node tools/rig-tiers.mjs verify --rig <folder>[,...]                           prove them
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export const TIER_RULE = 'rig-tier/1';
/** The folder beside `rig.json` that holds the half-size files, under the same names. */
export const TIER_DIR = '1x';

/** The image files a rig names (each part's PNG and rim mask), once, in order. */
export function rigImageNames(raw) {
  return [...new Set((raw.parts ?? []).flatMap((p) => [p.png, p.rim]).filter((f) => typeof f === 'string' && f))];
}

/**
 * The 1x picture of a decoded 8-bit image by the rule above. `img` is `{ data, width, height, channels }` (1 grey, 2 grey+alpha, 3 RGB, 4 RGBA), rows from the top.
 * @returns {{data: Buffer, width: number, height: number, channels: number}}
 */
export function halve({ data, width: w, height: h, channels: c }) {
  const ow = Math.ceil(w / 2);
  const oh = Math.ceil(h / 2);
  const out = Buffer.alloc(ow * oh * c);
  const alphaAt = c === 4 ? 3 : c === 2 ? 1 : -1;
  const colours = alphaAt < 0 ? c : c - 1;
  const at = [0, 0, 0, 0];
  for (let oy = 0; oy < oh; oy++) {
    for (let ox = 0; ox < ow; ox++) {
      let n = 0;
      for (let k = 0; k < 4; k++) {
        const x = ox * 2 + (k & 1);
        const y = oy * 2 + (k >> 1);
        if (x < w && y < h) at[n++] = (y * w + x) * c;
      }
      const o = (oy * ow + ox) * c;
      let sa = 0;
      if (alphaAt >= 0) for (let i = 0; i < n; i++) sa += data[at[i] + alphaAt];
      for (let ch = 0; ch < colours; ch++) {
        let sum = 0;
        if (alphaAt >= 0 && sa > 0) {
          for (let i = 0; i < n; i++) sum += data[at[i] + ch] * data[at[i] + alphaAt];
          out[o + ch] = Math.round(sum / sa);
        } else {
          for (let i = 0; i < n; i++) sum += data[at[i] + ch];
          out[o + ch] = Math.round(sum / n);
        }
      }
      if (alphaAt >= 0) out[o + alphaAt] = Math.round(sa / n);
    }
  }
  return { data: out, width: ow, height: oh, channels: c };
}

/** Decode a PNG to 8-bit samples, keeping its channels. */
export async function readImage(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

/** Encode `{ data, width, height, channels }` as a PNG at maximum effort (no palette, so no colour is lost). */
export function encodeImage(img) {
  return sharp(img.data, { raw: { width: img.width, height: img.height, channels: img.channels } }).png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toBuffer();
}

const rigOf = (dir) => JSON.parse(readFileSync(join(dir, 'rig.json'), 'utf8'));

/**
 * Write the 1x twins of every part PNG and rim mask of the rig in `dir` into `dir/1x/`. Files already there are rewritten; a file that does not belong is left alone (and `verifyTiers`
 * names it). Never touches the full-size files.
 * @returns {Promise<{written: string[]}>}
 */
export async function writeTiers(dir) {
  const raw = rigOf(dir);
  const out = join(dir, TIER_DIR);
  mkdirSync(out, { recursive: true });
  const written = [];
  for (const name of rigImageNames(raw)) {
    const src = join(dir, name);
    if (!existsSync(src)) throw new Error(`${name}: the rig names it and it is not beside rig.json`);
    writeFileSync(join(out, name), await encodeImage(halve(await readImage(src))));
    written.push(name);
  }
  return { written };
}

/**
 * Prove the tier: every file the rig names has its twin in `1x/`, each twin decodes to exactly what the rule makes of the full-size file, and nothing else is in the folder.
 * @returns {Promise<{ok: boolean, problems: string[], checked: number, bytes: number, texels: number}>} `bytes` of the 1x files, `texels` their total
 */
export async function verifyTiers(dir) {
  const problems = [];
  let raw;
  try { raw = rigOf(dir); } catch (e) { return { ok: false, problems: [`no readable rig.json (${e instanceof Error ? e.message : String(e)})`], checked: 0, bytes: 0, texels: 0 }; }
  const names = rigImageNames(raw);
  const tier = join(dir, TIER_DIR);
  if (!existsSync(tier)) return { ok: false, problems: [`no ${TIER_DIR}/ folder beside rig.json: run node tools/rig-tiers.mjs write --rig ${dir}`], checked: 0, bytes: 0, texels: 0 };
  let bytes = 0;
  let texels = 0;
  for (const name of names) {
    const file = join(tier, name);
    if (!existsSync(file)) { problems.push(`${TIER_DIR}/${name}: missing`); continue; }
    const full = join(dir, name);
    if (!existsSync(full)) { problems.push(`${name}: the rig names it and it is not beside rig.json`); continue; }
    bytes += readFileSync(file).length;
    let want;
    let got;
    try { [want, got] = [halve(await readImage(full)), await readImage(file)]; } catch (e) { problems.push(`${TIER_DIR}/${name}: cannot be decoded (${e instanceof Error ? e.message : String(e)})`); continue; }
    texels += got.width * got.height;
    if (got.width !== want.width || got.height !== want.height || got.channels !== want.channels) { problems.push(`${TIER_DIR}/${name}: is ${got.width}x${got.height} with ${got.channels} channel(s), the half of ${name} is ${want.width}x${want.height} with ${want.channels}`); continue; }
    let bad = 0;
    for (let i = 0; i < want.data.length; i++) if (want.data[i] !== got.data[i]) bad++;
    if (bad) problems.push(`${TIER_DIR}/${name}: ${bad} sample(s) differ from the half of ${name} (rule ${TIER_RULE}): it was not derived from this file`);
  }
  const known = new Set(names);
  for (const f of readdirSync(tier)) if (!known.has(f)) problems.push(`${TIER_DIR}/${f}: the rig does not name this file; a folder that ships holds exactly the derived ones`);
  return { ok: problems.length === 0, problems, checked: names.length, bytes, texels };
}

/** Does the rig in `dir` have a complete 1x folder (a cheap existence check; `verifyTiers` is the proof)? */
export function hasCompleteTier(dir) {
  try {
    const raw = rigOf(dir);
    return rigImageNames(raw).every((n) => existsSync(join(dir, TIER_DIR, n)));
  } catch {
    return false;
  }
}
