/**
 * The byte budget of a chapter, computed offline (lane "load-diet", 2026-10-29; both games, shared loading plumbing; `docs/BUDGETS.md` B3a).
 *
 * No browser and no network: the chapter's figures come from the real engine (the opening state `battlePreload` reads), each figure's poses from the real `resolveArt` over the
 * art manifest, the file a painting is drawn from from the real `pixelUrlFor` on a device class and a buffer width, the scene's paintings from the real `sceneArtUrls`, and
 * the sizes from the shipped-file list of a release (`critic/artifacts/<sha>.json`: the path and the bytes of every file the build served). What it cannot know is how the
 * browser spends the wire (HTTP framing, compression of the JSON); every number is the file's size, so it is a floor for the wire and the same floor for any two profiles.
 *
 * The parts follow `battlePreload.ts`: the scene's paintings, the battle's backdrop, the faces, each figure's opening poses (idle*, ready*, and any pose that is the same file), the
 * rest of the poses (the release 67 first menu waited for them; the load diet streams them), the party's pause close-ups, the lighting maps (a chapter whose default look is on), the
 * rig pieces (the first menu waits for them) and the chapter's music cues.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CHAPTERS, getChapter, type Chapter } from '../../../src/data/encounters.ts';
import { manifestKnowsAssetNow, parseArtManifest, pause2xUrlFor, resetArtManifest, setArtManifest, type ArtManifest } from '../../../src/engine/ArtManifest.ts';
import { setArtTier, setBufferWidth } from '../../../src/engine/ArtDevice.ts';
import { pixelUrlFor, scaleOfUrl } from '../../../src/engine/ArtTier.ts';
import { logicalArtUrl, setThumbArt } from '../../../src/engine/ArtShipped.ts';
import { boardArtUrls } from '../../../src/app/screens/frontendWarm.ts';
import { artCandidatesFor, portraitUrl, resolveArt } from '../../../src/engine/BattlePresenterArt.ts';
import { normalMapScaleFor } from '../../../src/engine/ArtManifestMaps.ts';
import { normalMapUrl } from '../../../src/engine/look/relight/RelightConfig.ts';
import { chapterLook } from '../../../src/engine/look/LookConfig.ts';
import { partyRigAllowed } from '../../../src/engine/motion/PartyRigsSwitch.ts';
import { splitPoses } from '../../../src/engine/LoadDiet.ts';
import { artNamespaceOfScene, backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { plateUrlFor } from '../../../src/app/screens/battlePreload.ts';
import { sceneArtUrls } from '../../../src/app/screens/sceneArt.ts';
import { plateIdFor } from '../../../src/app/screens/pause/plates.ts';
import { pickHeroBackgroundUrl } from '../../../src/ui/common/chapterPanel.ts';
import { artUrl } from '../../../src/engine/PaintedArt.ts';
import { setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { createEngine } from '../../../src/app/screens/BattleScreenWiring.ts';
import type { DeviceClass } from '../../../src/engine/ArtBudget.ts';

const ROOT = resolve(__dirname, '..', '..', '..');

/** A device and a window, as the art tier and the pause plate read them. */
export interface Profile {
  id: string;
  cls: DeviceClass;
  /** The drawing buffer's width, device pixels. */
  buffer: number;
  /** The window (CSS px) and the pixel ratio the pause close-up is chosen for. */
  window: [number, number, number];
}

export const PROFILES: readonly Profile[] = [
  { id: 'desk1600', cls: 'high', buffer: 1600, window: [1600, 900, 1] },
  { id: 'desk1440p', cls: 'high', buffer: 2560, window: [2560, 1440, 1] },
  { id: 'phone', cls: 'phone', buffer: 780, window: [390, 844, 2] },
];

/** What one chapter costs on one profile, in bytes, by what waits for it. */
export interface ChapterBytes {
  chapter: string;
  game: string;
  profile: string;
  figures: number;
  poses: { opening: number; everyday: number; other: number; files: number };
  scene: number;
  plate: number;
  faces: number;
  rigs: number;
  /** Poses the first menu waits for under the diet (opening poses) and the rest (it streams them). */
  openingPoses: number;
  latePoses: number;
  normals: number;
  pause: number;
  music: number;
  /** The first menu's wait: release 67 (everything) and the diet (the opening poses only). */
  firstMenu67: number;
  firstMenuDiet: number;
  /** What the diet streams after the first menu (late poses, lighting maps, the pause close-ups). */
  streamed: number;
  /** Every art byte the ordinary path asks for from the card to the first menu and after it, without music. */
  art: number;
  missing: string[];
}

interface Shipped {
  files: Record<string, { bytes: number }>;
}

let shipped: Shipped | null = null;
let manifestJson: unknown = null;

/** The newest `critic/artifacts/<sha>.json` that names the release 66 bundle's art (the one the G4 run measured). */
export function shippedFiles(sha = '2b48cee95'): Shipped {
  shipped ??= JSON.parse(readFileSync(resolve(ROOT, 'critic', 'artifacts', `${sha}.json`), 'utf8')) as Shipped;
  return shipped;
}

/** The bytes of the file served for a logical art path (`/art/characters/tidus/idle.png`): the master's name or its lossless WebP twin. null: not shipped. */
export function bytesOf(url: string): number | null {
  const files = shippedFiles().files;
  const path = decodeURIComponent(logicalArtUrl(url)).replace(/^\/+/, '').split(/[?#]/)[0]!;
  const direct = files[path] ?? files[path.replace(/\.png$/, '.webp')];
  return direct ? direct.bytes : null;
}

/** Sum of the shipped files under a prefix whose path matches `keep`. */
export function bytesUnder(prefix: string, keep: (path: string) => boolean = () => true): number {
  let n = 0;
  for (const [p, f] of Object.entries(shippedFiles().files)) if (p.startsWith(prefix) && keep(p)) n += f.bytes;
  return n;
}

function manifest(): ArtManifest {
  manifestJson ??= JSON.parse(readFileSync(resolve(ROOT, 'public', 'art', 'manifest.json'), 'utf8'));
  return parseArtManifest(manifestJson)!;
}

interface CombatantLike {
  id: string;
  side: string;
  spriteKey?: string;
  flags: { isPart?: boolean; hidden?: boolean };
  removed?: boolean;
}
interface StateLike {
  activeIds: readonly string[];
  enemyIds: readonly string[];
  aeonId?: string | null;
  aeonIds?: readonly string[];
  combatants: Record<string, CombatantLike>;
}

/** The figures a chapter stages at its opening, as `battlePreload.stagedIds` lists them. */
async function figuresOf(chapter: Chapter): Promise<CombatantLike[]> {
  const engine = await createEngine(chapter.game, setupForChapter(chapter, 1), { automated: true });
  const state = engine.state() as unknown as StateLike;
  const ids = new Set<string>([...state.activeIds, ...(state.aeonIds ?? (state.aeonId ? [state.aeonId] : [])), ...state.enemyIds]);
  for (const [id, c] of Object.entries(state.combatants)) if (c.flags.isPart && !c.flags.hidden && !c.removed) ids.add(id);
  return [...ids].map((id) => state.combatants[id]).filter((c): c is CombatantLike => c !== undefined && !c.flags.hidden && !c.removed);
}

/** One chapter on one profile. */
export async function chapterBytes(chapter: Chapter, profile: Profile): Promise<ChapterBytes> {
  setArtManifest(manifest());
  setArtTier(profile.cls);
  setBufferWidth(profile.buffer);
  const missing: string[] = [];
  const size = (url: string): number => {
    if (manifestKnowsAssetNow(url) === false) return 0; // the preload never asks for a file the manifest says is absent (a stand-in draws that figure)
    const b = bytesOf(url);
    if (b === null) missing.push(logicalArtUrl(url));
    return b ?? 0;
  };
  const ns = artNamespaceOfScene(chapter.sceneKey);
  const seen = new Set<string>();
  const once = (url: string): number => (seen.has(url) ? 0 : (seen.add(url), size(url)));
  const scene = sceneArtUrls(chapter.scriptsRef?.pre, backdropFileOf(chapter.sceneKey));
  const sceneBytes = [...scene.first, ...scene.rest].reduce((n, u) => n + once(u), 0);
  const plate = once(await pixelUrlFor(plateUrlFor(chapter.sceneKey)));
  const figures = await figuresOf(chapter);
  const party = figures.filter((c) => c.side !== 'enemy');
  const faces = [
    ...new Set(party.flatMap((c) => [c.id, c.spriteKey || c.id])),
  ].reduce((n, id) => n + once(portraitUrl(id)), 0);
  let opening = 0;
  let everyday = 0;
  let other = 0;
  let files = 0;
  let normals = 0;
  let rigs = 0;
  const look = chapterLook(chapter.id) !== null;
  const m = manifest();
  const rigSeen = new Set<string>();
  for (const c of figures) {
    const art = await resolveArt(artCandidatesFor(c as never, ns), c.side === 'enemy' ? 'enemy' : 'party');
    const { early } = splitPoses(art.poses);
    const earlyUrls = new Set(early.map((n) => art.poses[n]!));
    for (const url of new Set(Object.values(art.poses))) {
      const px = await pixelUrlFor(url);
      const b = once(px);
      files++;
      if (earlyUrls.has(url)) opening += b;
      else if (/\/(attack|cast|hurt|item|defend|guard|telegraph)\.(png|webp)$/.test(logicalArtUrl(url))) everyday += b;
      else other += b;
      if (look) {
        const pick = normalMapScaleFor(m, logicalArtUrl(url), scaleOfUrl(px));
        const nm = pick === null ? null : normalMapUrl(logicalArtUrl(url), pick ?? 1);
        if (nm) normals += once(nm);
      }
    }
    const rigId = art.artId;
    if (m.rigs?.includes(rigId) && partyRigAllowed(rigId) && !rigSeen.has(rigId)) {
      // the pilots (Tidus, Rikku's Dark Knight) are rigs only behind ?partyrigs=on; the others are rigs when a rig is listed. The base tier is `rig.json` and `1x/`, the 2x tier the full-size pieces beside it (the lighting pieces, `.normal.webp`, count with the maps)
      rigSeen.add(rigId);
      const base = profile.buffer < 2560 || profile.cls === 'phone';
      rigs += bytesUnder(`art/rigs/${rigId}/`, (p) => !/\.normal\.webp$/.test(p) && (/rig\.json$/.test(p) || (base ? /\/1x\//.test(p) : !/\/1x\//.test(p))));
    }
  }
  const pauseOf = (id: string): number => {
    const url1x = artUrl(`art/pause/${plateIdFor(id, chapter.game, ns)}.png`);
    const [w, h, dpr] = profile.window;
    return once(pickHeroBackgroundUrl(url1x, pause2xUrlFor(url1x), w, h, dpr));
  };
  const pause = party.reduce((n, c) => n + pauseOf(c.id), 0);
  const music = [chapter.music.scene, chapter.music.battle, chapter.music.phase2, chapter.music.victory].filter((k): k is NonNullable<typeof k> => !!k).reduce((n, k) => n + (seen.has(`m:${k}`) ? 0 : (seen.add(`m:${k}`), bytesOf(`/audio/music/${k}.mp3`) ?? 0)), 0);
  const latePoses = everyday + other;
  const firstMenuDiet = sceneBytes + plate + faces + opening + rigs;
  const out: ChapterBytes = {
    chapter: chapter.id,
    game: chapter.game,
    profile: profile.id,
    figures: figures.length,
    poses: { opening, everyday, other, files },
    scene: sceneBytes,
    plate,
    faces,
    rigs,
    openingPoses: opening,
    latePoses,
    normals,
    pause,
    music,
    firstMenu67: firstMenuDiet + latePoses,
    firstMenuDiet,
    streamed: latePoses + normals + pause,
    art: sceneBytes + plate + faces + opening + latePoses + rigs + normals + pause,
    missing: [...new Set(missing)],
  };
  resetArtManifest();
  setArtTier(null);
  setBufferWidth(0);
  return out;
}

/** Every listed chapter on every profile (a chapter whose opening cannot be built is skipped and named). */
export async function allChapterBytes(profiles: readonly Profile[] = PROFILES): Promise<{ rows: ChapterBytes[]; failed: string[] }> {
  const rows: ChapterBytes[] = [];
  const failed: string[] = [];
  for (const chapter of CHAPTERS) {
    for (const p of profiles) {
      try {
        rows.push(await chapterBytes(getChapter(chapter.id)!, p));
      } catch (e) {
        failed.push(`${chapter.id}/${p.id}: ${(e as Error).message}`);
      }
    }
  }
  return { rows, failed };
}

/** What the front end (the title's board warm) asks for before any card is chosen: the opening card's set the board waits for, then the rest by what it is. */
export interface FrontEndBytes {
  first: number;
  strips: number;
  faces: number;
  plates: number;
  other: number;
  rest: number;
  files: number;
}

/** The board's paintings for a fresh save (`frontendWarm.boardArtUrls`, the production thumbnail map), sized from the shipped files. Not a chapter's: it is the same on every profile. */
export function frontEndBytes(): FrontEndBytes {
  setArtManifest(manifest());
  const strip = JSON.parse(readFileSync(resolve(ROOT, 'src', 'data', 'art', 'strip-art.json'), 'utf8')) as { masters: string[] };
  setThumbArt(Object.fromEntries(strip.masters.map((m) => [m, m.replace(/\.png$/, m.startsWith('art/backdrops/') ? '.thumb.webp' : '.thumb.png')])));
  try {
    const save = { isCleared: () => false, chapter: () => ({ bestTimeMs: null }) };
    const { first, rest } = boardArtUrls(save as never);
    const sum = (urls: string[]): number => urls.reduce((n, u) => n + (manifestKnowsAssetNow(u) === false ? 0 : (bytesOf(u) ?? 0)), 0);
    const strips = rest.filter((u) => /\.thumb\.(webp|png)$/.test(u));
    const faces = rest.filter((u) => /\/portraits\//.test(u));
    const plates = rest.filter((u) => !strips.includes(u) && !faces.includes(u) && /\/(backdrops|characters)\//.test(u));
    const other = rest.filter((u) => !strips.includes(u) && !faces.includes(u) && !plates.includes(u));
    return { first: sum(first), strips: sum(strips), faces: sum(faces), plates: sum(plates), other: sum(other), rest: sum(rest), files: first.length + rest.length };
  } finally {
    setThumbArt(null);
    resetArtManifest();
  }
}
