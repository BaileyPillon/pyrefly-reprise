/**
 * **Give an existing rig its normal pieces** (the HD-2D look, format v2.2 `normal`; both games, shared plumbing; 2026-10-21; `node tools/rig/rig-normals-add.mjs --help`).
 *
 * A rig built with `build.normals` (`tools/rig/rig_normals.py`) writes its normal pieces as it cuts. A rig built BEFORE that (the party's and the aeons' version 1 rigs: Lulu, Valefor, Ifrit, Pterya, every part
 * a window of the idle painting) is cheap to give them afterwards: each part's PNG is the `box` of the idle master, so its normal piece is the same `box` of the idle's normal map
 * (`D:/pyrefly-art-maps/characters/<subject>/<pose>@2x.normal.png`, `MAPS-README.txt`), resized to `--scale` (default 0.3) of the box and written as an opaque RGB PNG `<part>.normal.png`.
 *
 *   node tools/rig/rig-normals-add.mjs --from <rig folder> --to <NEW rig folder> --maps D:/pyrefly-art-maps --art D:/pyrefly-art-r59 [--scale 0.3]
 *
 * It copies the rig into `--to` (the source is never written; `--to` must not exist), writes the pieces, names them in the copy's rig.json (`normal`), and says what it did NOT cover. It does not stamp: run
 * `node tools/rig-gate.mjs --rig <to> --art <art>` and `node tools/rig-tiers.mjs write --rig <to>` after it (the digest and the seal include the pieces).
 *
 * Refuses: a source with a gate it cannot read, a map that is not the idle master's size, a destination that exists. A part it cannot prove is a WINDOW of the idle master (a version 1 part cut from another
 * painting: Lulu's front-view `fdef` and `fod`) gets no piece and is listed: it is not lit while it is drawn, as before. A part with variants (version 2) is listed and skipped the same way: the pipeline writes those
 * (`rig_vcut.py`), because where a variant was cut from is not in the file.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const sharp = createRequire(join(HERE, '..', '..', 'package.json'))('sharp');

/** The pieces of one rig: pure of paths (the caller says where things are). */
export function mapFileFor(raw, mapsDir) {
  const m = /^(?:art\/)?characters\/([^/]+)\/([^/@]+)(?:@\dx)?(?:\.png)?$/.exec(String(raw.costume?.painting ?? ''));
  if (!m) return null;
  const scale = Number(raw.scale ?? 2);
  return { subject: m[1], pose: m[2], map: join(mapsDir, 'characters', m[1], scale > 1 ? `${m[2]}@${scale}x.normal.png` : `${m[2]}.normal.png`), scale };
}

/**
 * Is the part's PNG a window of the master (`box` of it)? Two readings of the opaque texels, sampled every second texel: how many are the master's own colour there (a part that was inpainted where another part
 * covers it is not all the master's colour: Lulu's torso is half), and how many sit on an opaque texel of the master (a part cut from ANOTHER painting does not: its silhouette is another figure's). A window is
 * at least a third the master's colour and nearly all of it inside the master's silhouette.
 */
export async function isWindowOf(masterRaw, masterW, partFile, box) {
  const part = await sharp(partFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [bx, by, bw, bh] = box;
  if (part.info.width !== bw || part.info.height !== bh) return { ok: false, why: `its PNG is ${part.info.width}x${part.info.height}, its box ${bw}x${bh}` };
  let n = 0;
  let same = 0;
  let inside = 0;
  for (let y = 0; y < bh; y += 2) {
    for (let x = 0; x < bw; x += 2) {
      const p = (y * bw + x) * 4;
      if (part.data[p + 3] < 250) continue;
      const q = ((by + y) * masterW + (bx + x)) * 4;
      n++;
      if (masterRaw[q + 3] > 127) inside++;
      if (Math.abs(part.data[p] - masterRaw[q]) <= 3 && Math.abs(part.data[p + 1] - masterRaw[q + 1]) <= 3 && Math.abs(part.data[p + 2] - masterRaw[q + 2]) <= 3) same++;
    }
  }
  if (n === 0) return { ok: false, why: 'it has no opaque texel' };
  const pct = (v) => `${(100 * v / n).toFixed(1)} percent`;
  return same / n >= 0.33 && inside / n >= 0.95 ? { ok: true } : { ok: false, why: `${pct(same)} of its opaque texels are the idle master's colour and ${pct(inside)} sit inside the master's silhouette (a window is at least 33 and 95)` };
}

export async function addNormals({ from, to, maps, art, scale = 0.3 }) {
  const src = resolve(from);
  const dst = resolve(to);
  if (!existsSync(join(src, 'rig.json'))) throw new Error(`no rig.json in ${src}`);
  if (existsSync(dst)) throw new Error(`${dst} exists: this tool writes a NEW folder (the source and any shipped rig are never edited)`);
  const raw = JSON.parse(readFileSync(join(src, 'rig.json'), 'utf8'));
  const where = mapFileFor(raw, resolve(maps));
  if (!where) throw new Error(`the costume painting ${JSON.stringify(raw.costume?.painting)} is not characters/<subject>/<pose>`);
  if (!existsSync(where.map)) throw new Error(`no normal map: ${where.map}`);
  const masterFile = join(resolve(art), 'characters', where.subject, where.scale > 1 ? `${where.pose}@${where.scale}x.png` : `${where.pose}.png`);
  if (!existsSync(masterFile)) throw new Error(`no idle master: ${masterFile}`);
  const nm = await sharp(where.map).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (nm.info.width !== raw.image.w || nm.info.height !== raw.image.h) throw new Error(`${where.map} is ${nm.info.width}x${nm.info.height}, the rig's image is ${raw.image.w}x${raw.image.h}`);
  const master = await sharp(masterFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (master.info.width !== raw.image.w || master.info.height !== raw.image.h) throw new Error(`${masterFile} is ${master.info.width}x${master.info.height}, the rig's image is ${raw.image.w}x${raw.image.h}`);

  mkdirSync(dst, { recursive: true });
  for (const f of readdirSync(src, { withFileTypes: true })) if (f.isFile() && f.name !== 'rig.json') copyFileSync(join(src, f.name), join(dst, f.name));
  const done = [];
  const skipped = [];
  for (const p of raw.parts) {
    if (p.variants && Object.keys(p.variants).length) { skipped.push([p.name, 'it has variants (cut from other paintings: the pipeline writes their pieces)']); continue; }
    const w = await isWindowOf(master.data, master.info.width, join(src, p.png), p.box);
    if (!w.ok) { skipped.push([p.name, w.why]); continue; }
    const [bx, by, bw, bh] = p.box;
    const tw = Math.max(1, Math.round(bw * scale));
    const th = Math.max(1, Math.round(bh * scale));
    const file = `${p.name}.normal.png`;
    await sharp(nm.data, { raw: { width: nm.info.width, height: nm.info.height, channels: nm.info.channels } })
      .extract({ left: bx, top: by, width: bw, height: bh })
      .resize(tw, th, { kernel: 'lanczos3' })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(join(dst, file));
    p.normal = file;
    done.push([p.name, `${tw}x${th}`]);
  }
  delete raw.gate; // the digest and the seal include the pieces: the gate stamps it again
  writeFileSync(join(dst, 'rig.json'), JSON.stringify(raw));
  return { subject: where.subject, map: where.map, done, skipped, to: dst };
}

async function main() {
  const a = process.argv.slice(2);
  const get = (n, d) => { const i = a.indexOf(n); return i >= 0 && a[i + 1] && !a[i + 1].startsWith('--') ? a[i + 1] : d; };
  if (a.includes('--help') || !get('--from') || !get('--to') || !get('--maps') || !get('--art')) {
    console.log('usage: node tools/rig/rig-normals-add.mjs --from <rig folder> --to <NEW rig folder> --maps D:/pyrefly-art-maps --art D:/pyrefly-art-r59 [--scale 0.3]');
    return a.includes('--help') ? 0 : 2;
  }
  try {
    const r = await addNormals({ from: get('--from'), to: get('--to'), maps: get('--maps'), art: get('--art'), scale: Number(get('--scale', '0.3')) });
    console.log(`rig-normals-add: ${r.to}: ${r.done.length} normal piece(s) from ${r.map}: ${r.done.map(([n, s]) => `${n} ${s}`).join(', ')}`);
    for (const [n, why] of r.skipped) console.log(`  not covered: ${n}: ${why}`);
    console.log('  next: node tools/rig-gate.mjs --rig <to> --art <art>  and  node tools/rig-tiers.mjs write --rig <to>');
    return 0;
  } catch (e) {
    console.error(`rig-normals-add: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(await main());
