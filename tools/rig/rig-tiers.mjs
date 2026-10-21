/**
 * **A rig's two texture tiers: the master's crops (2x) and their half-size twins (1x)** (the rig program; both games, shared plumbing; Bailey, 2026-10-17, "start rigging for all chapters").
 *
 * A rig is cut from the 2x master of its costume painting (`rig.json` `scale` 2), so its part PNGs are the master's pixels: Kimahri's fifteen parts are 4.8 Mpx and their rim masks 1.2 Mpx, about
 * 32 MB of GPU memory with mips, and six such figures are 190 MB of the 220 MB a phone budgets for ALL its figures (`engine/ArtBudget.ts`). Paintings solve this with `<state>@2x.png` beside the 1x file
 * and a device rule that picks one; the rig does the same: beside every part PNG and rim mask, `1x/<same name>` holds the twin the 1x tier binds. The mesh, the uvs and the rim's width need nothing
 * else (uvs are 0..1 of the image and the rim is measured in painting px), so the engine just binds the other file (`engine/rig/RigTier.ts` picks, by the same device rule as the paintings).
 *
 * **The 1x files are DERIVED, never authored, and proved.** The rule (`rig-tier/1`) is a 2x2 box filter in integers, so it is the same on every machine and in every library version:
 *   - an image with an alpha channel is averaged premultiplied: where the four texels hold any alpha, `colour = round(sum(colour * alpha) / sum(alpha))` and `alpha = round(sum(alpha) / n)`;
 *     where they hold none, the colour under alpha 0 is the plain mean of the four (a cut part's colour bled past its edge stays bled, so a bilinear fetch at the border draws no dark halo);
 *   - an opaque image (a rim mask is 8-bit grey) is the plain mean;
 *   - an odd edge: the missing texels are not counted (`n` is the number of texels inside), so a border texel is the picture's own, not half of it.
 * **A rim mask is halved only if it is bigger than half its map** (`rimNeedsHalving`): the pipeline writes some at the map's size and some already at half of it (Kimahri's are), and a mask halved
 * again would be a quarter of the master for a factor read in painting px. A mask that is already half the size or less is copied byte for byte. `twinSizes` is the one place that says what size
 * each twin is; the gate stamps the full-size sizes (`textureSizes`) and the engine budgets from them (`engine/rig/RigTier.ts` has the same rule, pinned equal by a test).
 * `verifyTiers` decodes a 1x file and the file it derives from, applies the rule again and requires every sample of every channel to be equal; a folder holds exactly the derived files. The deploy runs it
 * on every rig that ships (`tools/rig/rig-ship.mjs`), and the 1x files are art like any other: the build derives them (`tools/art-derive.mjs`), proves them and loads them in two engines.
 *
 *   node tools/rig-tiers.mjs write  --rig <folder with rig.json>[,<folder>...]     write (or rewrite) <rig>/1x/*
 *   node tools/rig-tiers.mjs verify --rig <folder>[,...]                           prove them
 */
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, readSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { partImages } from './rig-format.mjs';

export const TIER_RULE = 'rig-tier/1';
/** The folder beside `rig.json` that holds the half-size twins, under the same names. */
export const TIER_DIR = '1x';

/** The image files a rig names (each part's PNG and rim mask, and, format v2, each variant's), once, in order. These are the files that have a 1x twin. */
export function rigImageNames(raw) {
  return [...new Set(partImages(raw).flatMap((p) => [p.png, p.rim]).filter((f) => typeof f === 'string' && f))];
}

/** Every file a rig ships besides rig.json: `rigImageNames` and the HD-2D look's normal pieces (format v2 `normal`, no 1x twin). */
export function rigShippedNames(raw) {
  return [...new Set([...rigImageNames(raw), ...partImages(raw).map((p) => p.normal).filter((f) => typeof f === 'string' && f)])];
}

/** Width and height from a PNG's header, or null when the file is not a PNG. */
export function pngSize(file) {
  const fd = openSync(file, 'r');
  try {
    const head = Buffer.alloc(24);
    if (readSync(fd, head, 0, 24, 0) < 24 || head.readUInt32BE(0) !== 0x89504e47 || head.toString('latin1', 12, 16) !== 'IHDR') return null;
    return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
  } finally {
    closeSync(fd);
  }
}

/** Is a rim mask bigger than half its map (so the 1x twin halves it)? A mask already at half the map's size, or less, is copied as it is. */
export const rimNeedsHalving = (rim, map) => rim.width * 2 > map.width + 1 || rim.height * 2 > map.height + 1;

const half = (n) => Math.ceil(n / 2);

/**
 * The sizes of a part's files: `map` and `rim` as they are (`[w, h]`, rim null when the part has none), and the twins the 1x tier binds. This is the one statement of the rule.
 * @param {[number, number]} map @param {[number, number]|null} rim
 */
export function twinSizes(map, rim) {
  const m1 = [half(map[0]), half(map[1])];
  const r1 = rim === null ? null : rimNeedsHalving({ width: rim[0], height: rim[1] }, { width: map[0], height: map[1] }) ? [half(rim[0]), half(rim[1])] : [rim[0], rim[1]];
  return { map, rim, map1x: m1, rim1x: r1 };
}

/**
 * The size of every part's PNG and rim mask, read from the files' headers: `{ [part]: { map: [w, h], rim: [w, h] | null } }`. The PNG is NOT always the part's box (a ribbon-mapped spear shaft is
 * a long thin strip), so memory is budgeted from these, not from the box. The gate stamps them (`gate.textures`) and `rig-ship.mjs` checks the stamp against the files.
 */
export function textureSizes(raw, dir) {
  const out = {};
  for (const p of partImages(raw)) {
    const m = existsSync(join(dir, p.png)) ? pngSize(join(dir, p.png)) : null;
    const r = p.rim && existsSync(join(dir, p.rim)) ? pngSize(join(dir, p.rim)) : null;
    const nr = p.normal && existsSync(join(dir, p.normal)) ? pngSize(join(dir, p.normal)) : null; // the HD-2D look's normal piece: one size, no 1x twin (it is already the master's half or less)
    if (m) out[p.variant === null ? p.part : `${p.part}:${p.variant}`] = { map: [m.width, m.height], rim: r ? [r.width, r.height] : null, ...(nr ? { normal: [nr.width, nr.height] } : {}) }; // a format v2 variant is listed as <part>:<variant>
  }
  return out;
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

/** For each file the 1x folder holds: `{ name, kind: 'map' | 'rim', from }`. A rim shared by two parts, or named like a map, is one file with the strictest rule that applies. */
function twinPlan(raw, dir) {
  const plan = new Map();
  const images = partImages(raw);
  for (const p of images) {
    if (p.png) plan.set(p.png, { name: p.png, kind: 'map', from: join(dir, p.png), map: null });
  }
  for (const p of images) {
    if (!p.rim || plan.has(p.rim)) continue;
    plan.set(p.rim, { name: p.rim, kind: 'rim', from: join(dir, p.rim), map: p.png ? join(dir, p.png) : null });
  }
  return [...plan.values()];
}

/** What the 1x file for `item` must contain: `{ copy: true }` for a rim already at half its map's size or less, else the decoded halved image. */
async function expectedTwin(item) {
  if (item.kind === 'rim' && item.map && existsSync(item.map)) {
    const [r, m] = [pngSize(item.from), pngSize(item.map)];
    if (r && m && !rimNeedsHalving(r, m)) return { copy: true };
  }
  return { copy: false, image: halve(await readImage(item.from)) };
}

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
  for (const item of twinPlan(raw, dir)) {
    if (!existsSync(item.from)) throw new Error(`${item.name}: the rig names it and it is not beside rig.json`);
    const want = await expectedTwin(item);
    if (want.copy) copyFileSync(item.from, join(out, item.name));
    else writeFileSync(join(out, item.name), await encodeImage(want.image));
    written.push(item.name);
  }
  return { written };
}

/**
 * Prove the tier: every file the rig names has its twin in `1x/`, each twin is exactly what the rule makes of the full-size file (a rim already at half its map's size: the same bytes), and nothing
 * else is in the folder.
 * @returns {Promise<{ok: boolean, problems: string[], checked: number, bytes: number, texels: number}>} `bytes` of the 1x files, `texels` their total
 */
export async function verifyTiers(dir) {
  const problems = [];
  let raw;
  try { raw = rigOf(dir); } catch (e) { return { ok: false, problems: [`no readable rig.json (${e instanceof Error ? e.message : String(e)})`], checked: 0, bytes: 0, texels: 0 }; }
  const tier = join(dir, TIER_DIR);
  if (!existsSync(tier)) return { ok: false, problems: [`no ${TIER_DIR}/ folder beside rig.json: run node tools/rig-tiers.mjs write --rig ${dir}`], checked: 0, bytes: 0, texels: 0 };
  let bytes = 0;
  let texels = 0;
  const items = twinPlan(raw, dir);
  for (const item of items) {
    const file = join(tier, item.name);
    if (!existsSync(file)) { problems.push(`${TIER_DIR}/${item.name}: missing`); continue; }
    if (!existsSync(item.from)) { problems.push(`${item.name}: the rig names it and it is not beside rig.json`); continue; }
    const have = readFileSync(file);
    bytes += have.length;
    try {
      const want = await expectedTwin(item);
      if (want.copy) {
        if (!have.equals(readFileSync(item.from))) problems.push(`${TIER_DIR}/${item.name}: ${item.name} is already half its map's size or less, so its twin is the same file, and it is not`);
        const s = pngSize(file);
        if (s) texels += s.width * s.height;
        continue;
      }
      const got = await readImage(file);
      texels += got.width * got.height;
      if (got.width !== want.image.width || got.height !== want.image.height || got.channels !== want.image.channels) { problems.push(`${TIER_DIR}/${item.name}: is ${got.width}x${got.height} with ${got.channels} channel(s), the half of ${item.name} is ${want.image.width}x${want.image.height} with ${want.image.channels}`); continue; }
      let bad = 0;
      for (let i = 0; i < want.image.data.length; i++) if (want.image.data[i] !== got.data[i]) bad++;
      if (bad) problems.push(`${TIER_DIR}/${item.name}: ${bad} sample(s) differ from the half of ${item.name} (rule ${TIER_RULE}): it was not derived from this file`);
    } catch (e) {
      problems.push(`${TIER_DIR}/${item.name}: cannot be decoded (${e instanceof Error ? e.message : String(e)})`);
    }
  }
  const known = new Set(items.map((i) => i.name));
  for (const f of readdirSync(tier)) if (!known.has(f)) problems.push(`${TIER_DIR}/${f}: the rig does not name this file; a folder that ships holds exactly the derived ones`);
  return { ok: problems.length === 0, problems, checked: items.length, bytes, texels };
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
