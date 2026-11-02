/**
 * What a phone's battle entry waits for, per chapter, computed offline (lane "r73-bytes", release 73; both games, shared loading plumbing; `docs/BUDGETS.md` B2a and B3a, `docs/handoff/r73-bytes.md`).
 *
 * The entry's window is the time from `BattleScreen.enter` to the last figure being built (`pyrefly:enter:begin` to `pyrefly:enter:stage`). On a 10 Mbit/s line (1.25 MB/s) what the window waits for is the
 * bytes the entry still has to fetch in it. Release 70's phone10 run measured them for two chapters (`critic/rounds/round-32/gaps-G4-walks-optional/4d-delivery/phone10`): Chapter I 8.8 MB, Chapter IV 15.3 MB
 * (the `atMarks` and `reqLog` of that file, summed with the linear overlap of each request with the window). This model prices the same pieces from the art manifest, the rig files and the shipped-file list of a
 * release, for all nineteen chapters, in two arms:
 *
 *   - `r70`: release 69's hold (the later poses and the lighting maps of the other poses wait) and nothing else. The window waits for the scene's wings, the figures' opening poses, every look of the boss rig,
 *            the idle lighting map of every figure and, when the pre-battle scene was short, the chapter's results cues.
 *   - `r73`: the four cuts on (idle maps, rig variants, results cues, governor masters). The window waits for the wings, the opening poses and each rig part's own look.
 *
 * What it cannot know: how much of the opening poses and the results cues the pre-battle scene already moved (a long scene moves all of it: Chapter I's 35 s did, Chapter IV's 19 s did not), and the
 * governor's on-demand masters (they depend on the camera). Both arms count the opening poses and the cues in full, so the saving is the same number of bytes whatever the scene. The sizes are the files' own;
 * `rig.json` is counted at 0.4 of its size (the wire carries it compressed: 141 KB of 351 KB in the live run).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CHAPTERS, getChapter, type Chapter } from '../../../src/data/encounters.ts';
import { manifestKnowsAssetNow, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { setArtTier, setBufferWidth } from '../../../src/engine/ArtDevice.ts';
import { pixelUrlFor, scaleOfUrl } from '../../../src/engine/ArtTier.ts';
import { logicalArtUrl } from '../../../src/engine/ArtShipped.ts';
import { artCandidatesFor, resolveArt } from '../../../src/engine/BattlePresenterArt.ts';
import { normalMapScaleFor } from '../../../src/engine/ArtManifestMaps.ts';
import { normalMapUrl } from '../../../src/engine/look/relight/RelightConfig.ts';
import { chapterLook } from '../../../src/engine/look/LookConfig.ts';
import { partyRigAllowed } from '../../../src/engine/motion/PartyRigsSwitch.ts';
import { splitPoses } from '../../../src/engine/LoadDiet.ts';
import { readRig, type RigData } from '../../../src/engine/rig/RigData.ts';
import { artNamespaceOfScene, backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { chapterLaterCues } from '../../../src/app/chapterMusicWarm.ts';
import { figuresOf, manifest } from './load-bytes-model.ts';

const ROOT = resolve(__dirname, '..', '..', '..');

/** The release whose shipped-file list prices the files: the live build (release 71). */
export const SHIPPED_SHA = '6d7ecc8a5';
/** The phone profile of the budgets jobs: 390 x 844 at pixel ratio 2, the phone art class, a 780-wide buffer. */
const PHONE = { cls: 'phone', buffer: 780 } as const;
/** 10 Mbit/s in MB a second. */
export const LINE_MB_PER_S = 1.25;

let shipped: { files: Record<string, { bytes: number }> } | null = null;
const files = (): Record<string, { bytes: number }> => (shipped ??= JSON.parse(readFileSync(resolve(ROOT, 'critic', 'artifacts', `${SHIPPED_SHA}.json`), 'utf8')) as { files: Record<string, { bytes: number }> }).files;

/** The bytes of the file served for an art path (`art/...`, `/art/...`, or a logical URL); the master's name or its lossless twin; 0 when the build does not ship it. */
export function shippedBytes(path: string): number {
  const p = decodeURIComponent(path).replace(/^\/+/, '').split(/[?#]/)[0]!;
  const f = files();
  return (f[p] ?? f[p.replace(/\.png$/, '.webp')])?.bytes ?? 0;
}

/** One boss rig's files, priced for the phone (the 1x tier): the base look of every part, and the variants. */
export interface RigBytes {
  id: string;
  json: number;
  base: { maps: number; rims: number; normals: number };
  variants: { maps: number; rims: number; normals: number; count: number };
}

/** The rig's files from its own `rig.json` (read from the local art folder), priced from the shipped list. `lit`: the HD-2D look is armed (the normal pieces are fetched). */
export function rigBytes(id: string, lit: boolean): RigBytes | null {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(resolve(ROOT, 'public', 'art', 'rigs', id, 'rig.json'), 'utf8'));
  } catch {
    return null;
  }
  const read = readRig(raw);
  if (!read.ok) return null;
  const data: RigData = read.data;
  const dir = `art/rigs/${id}`;
  const out: RigBytes = { id, json: Math.round(shippedBytes(`${dir}/rig.json`) * 0.4), base: { maps: 0, rims: 0, normals: 0 }, variants: { maps: 0, rims: 0, normals: 0, count: 0 } };
  for (const p of data.parts) {
    for (const [src, to] of [[p, out.base] as const, ...p.variants.map((v) => [v, out.variants] as const)]) {
      to.maps += shippedBytes(`${dir}/1x/${src.png}`);
      if (src.rimMode === 'mask' && src.rim) to.rims += shippedBytes(`${dir}/1x/${src.rim}`);
      if (lit && src.normal) to.normals += shippedBytes(`${dir}/${src.normal}`);
      if (to === out.variants) out.variants.count++;
    }
  }
  return out;
}

/** What one chapter's phone entry waits for, in bytes, by what it is made of. */
export interface EntryBytes {
  chapter: string;
  game: string;
  figures: number;
  /** The boss rigs the stage builds as rigs (the ids), their files, and the sum of their variant looks. */
  rigs: RigBytes[];
  /** The scene's wings and depth plate, which `takeScene` fetches in the window (both arms). */
  diorama: number;
  /** The figures' opening poses, at the files the phone starts from (both arms; a rigged figure loads only its idle). */
  opening: number;
  /** The idle lighting map of every figure (a chapter whose default look is on; 0 elsewhere). */
  idleMaps: number;
  /** The chapter's results cues: the victory and the defeat music. */
  resultsCues: number;
  rigBase: number;
  rigVariants: number;
  rigAll: number;
  /** The window's bytes in the two arms, and what the four cuts take out. */
  r70: number;
  r73: number;
  saved: number;
  /** Seconds of a 10 Mbit/s line for those bytes. */
  r70s: number;
  r73s: number;
}

/** One chapter, priced for the phone. */
export async function entryBytes(chapter: Chapter): Promise<EntryBytes> {
  const m = manifest();
  setArtManifest(m);
  setArtTier(PHONE.cls);
  setBufferWidth(PHONE.buffer);
  try {
    const ns = artNamespaceOfScene(chapter.sceneKey);
    const look = chapterLook(chapter.id) !== null;
    const wings = shippedBytes(`art/backdrops/wings/${backdropFileOf(chapter.sceneKey)}-left.png`) + shippedBytes(`art/backdrops/wings/${backdropFileOf(chapter.sceneKey)}-right.png`);
    const depth = shippedBytes(`fx/${chapter.sceneKey}/depth.png`);
    const seen = new Set<string>();
    const once = (url: string): number => (seen.has(url) ? 0 : (seen.add(url), manifestKnowsAssetNow(url) === false ? 0 : shippedBytes(logicalArtUrl(url))));
    let opening = 0;
    let idleMaps = 0;
    const rigs: RigBytes[] = [];
    const figures = await figuresOf(chapter);
    for (const c of figures) {
      const art = await resolveArt(artCandidatesFor(c as never, ns), c.side === 'enemy' ? 'enemy' : 'party');
      const rigged = m.rigs?.includes(art.artId) === true && partyRigAllowed(art.artId);
      const rig = rigged && !rigs.some((r) => r.id === art.artId) ? rigBytes(art.artId, look) : null;
      if (rig) rigs.push(rig);
      const early = rigged ? ['idle'] : splitPoses(art.poses).early;
      for (const name of early) {
        const url = art.poses[name];
        if (url) opening += once(await pixelUrlFor(url));
      }
      const idle = art.poses['idle'];
      if (look && idle) {
        const px = await pixelUrlFor(idle);
        const pick = normalMapScaleFor(m, logicalArtUrl(idle), scaleOfUrl(px));
        const nm = pick === null ? null : normalMapUrl(logicalArtUrl(idle), pick ?? 1);
        if (nm) idleMaps += once(nm);
      }
    }
    const resultsCues = chapterLaterCues(chapter).reduce((n, cue) => n + shippedBytes(`audio/music/${cue}.mp3`), 0);
    const sum = (r: RigBytes, side: 'base' | 'variants'): number => r[side].maps + r[side].rims + r[side].normals;
    const rigBase = rigs.reduce((n, r) => n + r.json + sum(r, 'base'), 0);
    const rigVariants = rigs.reduce((n, r) => n + sum(r, 'variants'), 0);
    const r70 = wings + depth + opening + rigBase + rigVariants + idleMaps + resultsCues;
    const r73 = wings + depth + opening + rigBase;
    return {
      chapter: chapter.id,
      game: chapter.game,
      figures: figures.length,
      rigs,
      diorama: wings + depth,
      opening,
      idleMaps,
      resultsCues,
      rigBase,
      rigVariants,
      rigAll: rigBase + rigVariants,
      r70,
      r73,
      saved: r70 - r73,
      r70s: r70 / 1e6 / LINE_MB_PER_S,
      r73s: r73 / 1e6 / LINE_MB_PER_S,
    };
  } finally {
    resetArtManifest();
    setArtTier(null);
    setBufferWidth(0);
  }
}

/** Every listed chapter (a chapter whose opening cannot be built is named in `failed`). */
export async function allEntryBytes(): Promise<{ rows: EntryBytes[]; failed: string[] }> {
  const rows: EntryBytes[] = [];
  const failed: string[] = [];
  for (const c of CHAPTERS) {
    try {
      rows.push(await entryBytes(getChapter(c.id)!));
    } catch (e) {
      failed.push(`${c.id}: ${(e as Error).message}`);
    }
  }
  return { rows, failed };
}
