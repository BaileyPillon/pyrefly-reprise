/**
 * **A release art mirror that carries the lighting maps** (release 60, the conference demo build; both games, shared plumbing; decisions 150d and 157).
 *
 * The HD-2D look lights the painted figures with their surface-normal maps (`<pose>.normal.png`, `<pose>@2x.normal.png`) and fogs a room by its backdrop depth map
 * (`backdrops/<room>.depth.png`). The maps are made apart from the paintings, overnight on the GPU, into a mirror of their own (`D:/pyrefly-art-maps`, its `MAPS-README.txt`), and
 * a release mirror (`tools/rig/rig-mirror.mjs` says what that is: a folder of HARD LINKS to the live art, a new folder for every release) held none, so a production build showed the
 * look with no light on the figures and a 404 in the console for each map.
 *
 * This makes the mirror that does: every file of the source mirror hard-linked, plus the chosen maps hard-linked at the paths the game asks for them, and `manifest.json` rebuilt as a
 * file of its own so it lists them (`lightMaps`, `tools/gen/manifest.mjs`; the game asks for the maps it names and for no other, `engine/ArtManifestMaps.ts`). The art pipeline needs
 * nothing more: a map is a PNG under `art/`, so `tools/art-derive.mjs` plans it like any other master (a WebP where every decoder draws it the same, else a PNG recompressed with its
 * pixels proved identical, and a 16-bit depth map as it is: `refusalFor` leaves a master that is not 8 bits per channel alone), and `artUrl` resolves it.
 *
 * What is chosen, per subject: the map of every CHOSEN state of the source mirror's manifest (a numbered candidate's map, `attack.1.normal.png`, is never linked) at the tiers asked for
 * (`--tiers 1` the base map, `--tiers 1,2` the base map and `@2x` where the painting has an @2x master), and per backdrop its `<key>.depth.png`. A state with no map in the maps folder is
 * reported ("uncovered") and not linked: the manifest then does not list it and the game does not ask. A map whose width and height are not its painting's is refused: the shader lays the
 * map over the painting by texture coordinates.
 *
 * Nothing is written to the source mirror or to the maps folder (a hard link shares its data, so no file is ever opened for writing), `--to` must not exist, and everything is checked
 * before the first link (`planMapsMirror`) and proved after the last (`verifyMapsMirror`). The CLI is `tools/art-mirror-add-maps.mjs`.
 */
import { closeSync, existsSync, linkSync, mkdirSync, openSync, readFileSync, readSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';

import { buildManifest, writeManifest } from './gen/manifest.mjs';
import { listFiles } from './rig/rig-mirror.mjs';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const inside = (child, parent) => (resolve(child) + sep).startsWith(resolve(parent) + sep);

/** Width, height and bit depth from a PNG's IHDR (the first 26 bytes), or null when the file is not a PNG. */
export function pngDims(file) {
  const fd = openSync(file, 'r');
  try {
    const head = Buffer.alloc(26);
    if (readSync(fd, head, 0, 26, 0) < 26 || head.readUInt32BE(0) !== 0x89504e47 || head.toString('latin1', 12, 16) !== 'IHDR') return null;
    return { width: head.readUInt32BE(16), height: head.readUInt32BE(20), depth: head[24] };
  } finally {
    closeSync(fd);
  }
}

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const scalesOfState = (subject, state) => new Set([1, ...(subject.states2x?.includes(state) ? [2] : []), ...(subject.tiers?.[state] ?? [])]);

/**
 * Check everything and say what would be made; writes nothing.
 * @param {{ from: string, mapsRoot: string, to: string, subjects?: string[], backdrops?: string[], tiers?: number[] }} o
 * @returns {{ ok: boolean, problems: string[], links: string[], maps: Array<{ rel: string, from: string, kind: 'normal' | 'depth', subject?: string, state?: string, scale: number, painting: string }>, uncovered: string[], subjects: string[], backdrops: string[], tiers: number[] }}
 */
export function planMapsMirror({ from, mapsRoot, to, subjects = [], backdrops = [], tiers = [1] }) {
  const problems = [];
  const src = resolve(from);
  const dst = resolve(to);
  const maps = resolve(mapsRoot);
  const plan = { ok: false, problems, links: [], maps: [], uncovered: [], subjects, backdrops, tiers };
  if (!existsSync(join(src, 'characters')) || !existsSync(join(src, 'manifest.json'))) { problems.push(`${src} is not an art folder (no characters/ or manifest.json in it)`); return plan; }
  if (!existsSync(join(maps, 'characters'))) { problems.push(`${maps} is not a maps folder (no characters/ in it)`); return plan; }
  if (inside(dst, src) || inside(src, dst) || inside(dst, maps) || inside(maps, dst)) problems.push(`${dst} is inside, or holds, the source mirror or the maps folder`);
  if (existsSync(dst)) problems.push(`${dst} exists: a mirror is made new, never filled in (choose a folder that is not there)`);
  if (/[\\/]public[\\/]art$/i.test(dst)) problems.push(`${dst} is a repository's public/art: a release mirror is a folder of its own, and public/art is a junction to it`);
  if (!existsSync(dirname(dst))) problems.push(`the folder ${dirname(dst)} does not exist`);
  else {
    const dev = statSync(dirname(dst)).dev;
    if (statSync(src).dev !== dev) problems.push(`${dst} is on another volume than ${src}: a hard link cannot cross one`);
    if (statSync(maps).dev !== dev) problems.push(`${dst} is on another volume than ${maps}: a hard link cannot cross one`);
  }
  if (!subjects.length && !backdrops.length) problems.push('nothing to add: name --subjects and/or --backdrops');
  for (const t of tiers) if (t !== 1 && t !== 2) problems.push(`--tiers ${t}: a normal map exists at the base size (1) and at @2x (2) only`);
  const manifest = readJson(join(src, 'manifest.json'));
  const files = new Set(listFiles(src));
  const seen = new Set();
  const add = (m) => {
    if (seen.has(m.rel)) return;
    seen.add(m.rel);
    if (files.has(m.rel)) { problems.push(`${m.rel}: the source mirror already holds this file`); return; }
    const painting = join(src, m.painting);
    const dims = existsSync(painting) ? pngDims(painting) : null;
    const got = pngDims(m.from);
    if (!got) { problems.push(`${m.rel}: ${m.from} is not a PNG`); return; }
    if (!dims) { problems.push(`${m.rel}: its painting ${m.painting} is not in the source mirror`); return; }
    if (got.width !== dims.width || got.height !== dims.height) { problems.push(`${m.rel}: is ${got.width}x${got.height} and its painting ${m.painting} is ${dims.width}x${dims.height}: the shader lays the map over the painting by texture coordinates`); return; }
    plan.maps.push(m);
  };
  for (const id of subjects) {
    if (!KEBAB.test(id)) { problems.push(`${id}: a subject is lowercase kebab`); continue; }
    const subject = manifest.subjects?.[id];
    if (!subject) { problems.push(`${id}: the source mirror's manifest lists no such subject`); continue; }
    for (const state of subject.states) {
      for (const scale of tiers) {
        if (!scalesOfState(subject, state).has(scale)) continue;
        const suffix = scale === 2 ? '@2x' : '';
        const rel = `characters/${id}/${state}${suffix}.normal.png`;
        const file = join(maps, rel);
        if (!existsSync(file)) { plan.uncovered.push(rel); continue; }
        add({ rel, from: file, kind: 'normal', subject: id, state, scale, painting: `characters/${id}/${state}${suffix}.png` });
      }
    }
  }
  for (const key of backdrops) {
    if (!KEBAB.test(key)) { problems.push(`${key}: a backdrop is lowercase kebab`); continue; }
    if (!manifest.backdrops?.includes(key)) { problems.push(`${key}: the source mirror's manifest lists no such backdrop`); continue; }
    const rel = `backdrops/${key}.depth.png`;
    const file = join(maps, rel);
    if (!existsSync(file)) { plan.uncovered.push(rel); continue; }
    add({ rel, from: file, kind: 'depth', scale: 1, painting: `backdrops/${key}.png` });
  }
  plan.links = [...files].filter((f) => f !== 'manifest.json');
  plan.ok = problems.length === 0;
  return plan;
}

/**
 * Make the mirror a {@link planMapsMirror} approved: hard-link every file of the source and every chosen map, write `manifest.json` as a file of its own.
 * @returns {{ linked: number, maps: number, lightMaps: { normal: number, subjects: number, depth: number } }}
 */
export function buildMapsMirror({ from, to, plan, log = () => {} }) {
  const src = resolve(from);
  const dst = resolve(to);
  mkdirSync(dst, { recursive: false });
  const made = new Set();
  const ensure = (dir) => { if (!made.has(dir)) { mkdirSync(dir, { recursive: true }); made.add(dir); } };
  let linked = 0;
  for (const f of plan.links) {
    ensure(dirname(join(dst, f)));
    linkSync(join(src, f), join(dst, f));
    if (++linked % 1000 === 0) log(`  linked ${linked} of ${plan.links.length}`);
  }
  for (const m of plan.maps) {
    ensure(dirname(join(dst, m.rel)));
    linkSync(m.from, join(dst, m.rel));
  }
  const wrote = writeManifest(dst);
  const lm = wrote.manifest.lightMaps ?? { normal: {}, depth: [] };
  return { linked, maps: plan.maps.length, lightMaps: { normal: Object.values(lm.normal).reduce((n, row) => n + Object.values(row).reduce((k, s) => k + s.length, 0), 0), subjects: Object.keys(lm.normal).length, depth: lm.depth.length } };
}

/**
 * Prove a mirror made by {@link buildMapsMirror}, from the files.
 * @returns {{ ok: boolean, problems: string[], files: number, linked: number, maps: number, bytes: number }}
 */
export function verifyMapsMirror({ from, to, plan }) {
  const src = resolve(from);
  const dst = resolve(to);
  const problems = [];
  const have = listFiles(dst);
  const want = new Set(['manifest.json', ...plan.links, ...plan.maps.map((m) => m.rel)]);
  const gone = have.filter((f) => !want.has(f));
  const missing = [...want].filter((f) => !have.includes(f));
  if (gone.length) problems.push(`${gone.length} file(s) in the mirror that it should not hold, e.g. ${gone.slice(0, 3).join(', ')}`);
  if (missing.length) problems.push(`${missing.length} file(s) missing from the mirror, e.g. ${missing.slice(0, 3).join(', ')}`);
  const sameFile = (a, b) => { const [x, y] = [statSync(a), statSync(b)]; return x.ino === y.ino && x.dev === y.dev && y.nlink >= 2; };
  for (const f of plan.links) if (existsSync(join(dst, f)) && !sameFile(join(src, f), join(dst, f))) problems.push(`${f}: not a hard link of the source's file`);
  let bytes = 0;
  for (const m of plan.maps) {
    const p = join(dst, m.rel);
    if (!existsSync(p)) continue;
    bytes += statSync(p).size;
    if (!sameFile(m.from, p)) problems.push(`${m.rel}: not a hard link of the maps folder's file`);
    const [a, b] = [pngDims(p), pngDims(join(dst, m.painting))];
    if (!a || !b || a.width !== b.width || a.height !== b.height) problems.push(`${m.rel}: is not its painting's size`);
  }
  if (!existsSync(join(dst, 'manifest.json'))) problems.push('manifest.json is missing');
  else {
    if (statSync(join(dst, 'manifest.json')).nlink !== 1) problems.push('manifest.json: is not a file of its own');
    const onDisk = readJson(join(dst, 'manifest.json'));
    const built = buildManifest(dst).manifest;
    if (JSON.stringify({ ...onDisk, generatedAt: 0 }) !== JSON.stringify({ ...built, generatedAt: 0 })) problems.push('manifest.json: is not what the tree in the mirror builds');
    const before = readJson(join(src, 'manifest.json'));
    const changed = [...new Set([...Object.keys(before), ...Object.keys(onDisk)])].filter((k) => k !== 'generatedAt' && JSON.stringify(before[k]) !== JSON.stringify(onDisk[k]));
    if (changed.some((k) => k !== 'lightMaps')) problems.push(`manifest.json differs from the source's in more than lightMaps: ${changed.join(', ')}`);
    const listed = new Set([
      ...Object.entries(onDisk.lightMaps?.normal ?? {}).flatMap(([id, row]) => Object.entries(row).flatMap(([state, scales]) => scales.map((s) => `characters/${id}/${state}${s === 2 ? '@2x' : ''}.normal.png`))),
      ...(onDisk.lightMaps?.depth ?? []).map((k) => `backdrops/${k}.depth.png`),
    ]);
    const shipped = new Set(plan.maps.map((m) => m.rel));
    const notListed = [...shipped].filter((r) => !listed.has(r));
    const notShipped = [...listed].filter((r) => !shipped.has(r));
    if (notListed.length) problems.push(`${notListed.length} map(s) linked and not in lightMaps, e.g. ${notListed.slice(0, 3).join(', ')}`);
    if (notShipped.length) problems.push(`${notShipped.length} map(s) in lightMaps and not linked, e.g. ${notShipped.slice(0, 3).join(', ')}`);
  }
  return { ok: problems.length === 0, problems, files: have.length, linked: plan.links.length, maps: plan.maps.length, bytes };
}
