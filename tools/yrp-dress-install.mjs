#!/usr/bin/env node
/**
 * Installs the real FFX-2 dressphere models for the hidden 3D Bahamut chapter (FFX-2 only; `src/engine/yrp3d/dress.ts`) into the gitignored `public/models-exp/yrp/dress/`.
 *
 * The models are extracted locally from Bailey's own Steam FFX-2 copy (`D:/Tools/ffx-parity/assets/runtime/yrp-dress/`, written by the extraction scripts; `dress-map.json` says which girl in which dressphere is which model)
 * and are never committed or shipped (`tools/dist-filter.mjs`). For each `<girl>-<dressphere>` folder the chapter needs three files: `anims.glb` (the armed model, base resolution, with every clip), `clipmap.json`
 * (which clips are which pose) and, where the extraction made one, `hd/anims.glb` (the same with the 4x texture and one subdivision level). The static `model.glb` files are not needed: a clips file carries its mesh.
 * Files are **hard-linked** when the two folders share a drive (no second copy of a gigabyte of models) and copied when they do not.
 *
 * It also writes `dress/index.json`, the small manifest the chapter reads instead of probing for files: `{ version, starts, entries: [{ girl, dress, folder, hd, weapons, tier }] }`; `weapons` is how many weapon models the
 * file carries on a locator (`weaponAttach` with a locator: 0 for Berserker, the three specials and Yuna's and Paine's Mascots, whose models have no hand locator, though the game's job table lists a weapon for them).
 *
 *   node tools/yrp-dress-install.mjs [--from=<runtime/yrp-dress dir>] [--to=<public/models-exp/yrp/dress dir>] [--no-hd] [--dry]
 */
import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const from = resolve(arg('from', 'D:/Tools/ffx-parity/assets/runtime/yrp-dress'));
const to = resolve(arg('to', join(root, 'public', 'models-exp', 'yrp', 'dress')));
const withHd = !process.argv.includes('--no-hd');
const dry = process.argv.includes('--dry');

const map = JSON.parse(readFileSync(join(from, 'dress-map.json'), 'utf8'));
const stats = { linked: 0, copied: 0, kept: 0, missing: 0, bytes: 0 };

/** Put `src` at `dst` (hard link, else copy); a file already there with the same size is kept. */
function put(src, dst) {
  if (!existsSync(src)) {
    stats.missing++;
    return false;
  }
  if (existsSync(dst) && statSync(dst).size === statSync(src).size) {
    stats.kept++;
    return true;
  }
  if (dry) return true;
  mkdirSync(dirname(dst), { recursive: true });
  try {
    linkSync(src, dst);
    stats.linked++;
  } catch {
    copyFileSync(src, dst);
    stats.copied++;
  }
  stats.bytes += statSync(src).size;
  return true;
}

const entries = [];
for (const e of map.entries) {
  const dir = join(from, e.folder);
  if (!put(join(dir, 'anims.glb'), join(to, e.folder, 'anims.glb')) || !put(join(dir, 'clipmap.json'), join(to, e.folder, 'clipmap.json'))) continue;
  const hd = withHd && e.hd === true && put(join(dir, 'hd', 'anims.glb'), join(to, e.folder, 'hd', 'anims.glb'));
  entries.push({ girl: e.girl, dress: e.dressphere, folder: e.folder, hd, weapons: (e.weaponAttach ?? []).filter((a) => a.locatorNode).length, tier: e.tier });
}

const starts = map.chapter.starts;
const index = { version: 1, game: 'FFX-2 only', source: 'dress-map.json', starts, entries };
if (!dry) {
  mkdirSync(to, { recursive: true });
  writeFileSync(join(to, 'index.json'), `${JSON.stringify(index, null, 1)}\n`);
}
console.log(`${dry ? '[dry] ' : ''}${entries.length} dresspheres (${entries.filter((e) => e.hd).length} with HD) -> ${to}`);
console.log(`linked ${stats.linked}, copied ${stats.copied}, kept ${stats.kept}, missing ${stats.missing}, ${(stats.bytes / 1e6).toFixed(0)} MB new`);
