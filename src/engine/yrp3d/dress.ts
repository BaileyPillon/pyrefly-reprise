/**
 * **The girls' dresspheres as models** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only). In FFX-2 a dressphere is a costume: Yuna in White Mage is not Yuna in Gunner, and the weapon, the
 * clip set and the silhouette change with it. Bailey picked "match + change live" (2026-10-22): each girl's model always matches the dressphere her battle state says, and a change mid-fight swaps the model at the moment
 * the game does it. The models are the game's own, extracted locally from Bailey's Steam FFX-2 copy (`tools/yrp-dress-install.mjs` puts them in the gitignored `public/models-exp/yrp/dress/`; never committed, never shipped).
 *
 * This file is the **pure** part (no `three`, no DOM): which models there are, which one a dressphere is, and which dressphere a painting's id names.
 *
 * - **The manifest** (`dress/index.json`, written by the installer from `dress-map.json`): one entry per `<girl>-<dressphere>` folder with whether an HD file exists (`hd/anims.glb`), how many weapons the model carries and its
 *   tier. A folder holds `anims.glb` (the **armed** model, every clip, base resolution: a clips file carries its mesh, and the weapon already sits under its locator), `clipmap.json` (which clips make which pose) and
 *   optionally `hd/anims.glb` (4x texture, one subdivision level). {@link parseDressIndex} reads it; a manifest that is not there or not valid means no dress system: the chapter keeps its single model per girl.
 * - **Which dressphere a girl wears** is what the battle says. The presenter names a girl's painting `<girl>-<dressphere>` (`BattlePresenterArt.artIdFor`) and keeps that id on the actor (`ART_KEY`), at the opening and when a
 *   `spherechange` event swaps it (`BattleStage.setArt`); {@link dressOfArt} reads the dressphere back out of it.
 * - **The starters** are Chapter IV's build (`data/ffx2/builds/bevelle.ts`): Yuna White Mage, Rikku Dark Knight, Paine Warrior ({@link DEFAULT_STARTS}); the installed manifest carries the same.
 */

import { baseArtId } from '../../data/art/artNamespace.ts';
import { fileUrl, YRP_PARTY_IDS } from './layout.ts';

/** The three girls: the cast without Bahamut. */
export type Girl = (typeof YRP_PARTY_IDS)[number];

/** Where the dress folders are, under a models folder. */
export const DRESS_SUBDIR = 'dress';

/** True for an id that is one of the three girls. */
export const isGirl = (id: string): id is Girl => (YRP_PARTY_IDS as readonly string[]).includes(id);

/** The dressphere each girl starts the chapter in (Chapter IV's build): the fallback for a manifest with no `starts`. */
export const DEFAULT_STARTS: Readonly<Record<Girl, string>> = { yuna: 'white-mage', rikku: 'dark-knight', paine: 'warrior' };

/** One dress folder of the manifest. */
export interface DressEntry {
  readonly girl: Girl;
  /** The dressphere's id as the battle engine spells it (`white-mage`, `gun-mage`, `floral-fallal` ...). */
  readonly dress: string;
  /** `<girl>-<dress>`: the folder under the dress directory. */
  readonly folder: string;
  /** Whether `hd/anims.glb` exists (the 4x texture file). */
  readonly hd: boolean;
  /** How many weapon models the file carries (0: Berserker, Mascot and the specials hold none). */
  readonly weapons: number;
  readonly tier: string;
}

/** The files of one entry, relative to the dress directory, and the ones to try for a model in the order the page asks (`hd` first where the page wants it and the folder has it). */
export interface DressFiles {
  readonly anims: string;
  readonly hdAnims: string | null;
  readonly clipmap: string;
}

/** The manifest, read: what exists and who starts in what. */
export interface DressIndex {
  readonly starts: Readonly<Record<Girl, string>>;
  readonly entries: readonly DressEntry[];
  get(girl: Girl, dress: string): DressEntry | null;
  has(girl: Girl, dress: string): boolean;
  /** Every dressphere the manifest has for a girl, in its order. */
  dresses(girl: Girl): string[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** The manifest from its parsed JSON, or null when it is not one (no `entries` array, or no usable entry). An entry that is malformed is left out; a missing `starts` falls back to Chapter IV's. */
export function parseDressIndex(json: unknown): DressIndex | null {
  if (!isRecord(json) || !Array.isArray(json['entries'])) return null;
  const entries: DressEntry[] = [];
  for (const raw of json['entries'] as unknown[]) {
    if (!isRecord(raw)) continue;
    const { girl, dress, folder } = raw;
    if (typeof girl !== 'string' || !isGirl(girl) || typeof dress !== 'string' || !dress || typeof folder !== 'string' || !folder) continue;
    entries.push({ girl, dress, folder, hd: raw['hd'] === true, weapons: typeof raw['weapons'] === 'number' ? raw['weapons'] : 0, tier: typeof raw['tier'] === 'string' ? raw['tier'] : '' });
  }
  if (!entries.length) return null;
  const given = isRecord(json['starts']) ? json['starts'] : {};
  const starts = Object.fromEntries(YRP_PARTY_IDS.map((g) => [g, typeof given[g] === 'string' && entries.some((e) => e.girl === g && e.dress === given[g]) ? (given[g] as string) : DEFAULT_STARTS[g]])) as Record<Girl, string>;
  const key = (g: Girl, d: string): string => `${g}/${d}`;
  const byKey = new Map(entries.map((e) => [key(e.girl, e.dress), e]));
  return {
    starts,
    entries,
    get: (g, d) => byKey.get(key(g, d)) ?? null,
    has: (g, d) => byKey.has(key(g, d)),
    dresses: (g) => entries.filter((e) => e.girl === g).map((e) => e.dress),
  };
}

/** The files of an entry. */
export function dressFiles(entry: DressEntry): DressFiles {
  return { anims: `${entry.folder}/anims.glb`, hdAnims: entry.hd ? `${entry.folder}/hd/anims.glb` : null, clipmap: `${entry.folder}/clipmap.json` };
}

/** The dress directory of a models folder (`models-exp/yrp` -> `models-exp/yrp/dress`). */
export const dressDirOf = (modelsDir: string): string => `${modelsDir.replace(/\/+$/, '')}/${DRESS_SUBDIR}`;

/** The manifest's URL. */
export const dressIndexUrl = (base: string, dressDir: string): string => fileUrl(base, dressDir, 'index.json');

/** The URL of one file of an entry. */
export const dressFileUrl = (base: string, dressDir: string, file: string): string => fileUrl(base, dressDir, file);

/**
 * The model file to load for an entry: the HD one when the page wants HD and the folder has it, else the base one. Both carry the same armed mesh and every clip (the HD file has the 4x texture and one subdivision level).
 */
export function dressModelFile(entry: DressEntry, preferHd: boolean): string {
  const files = dressFiles(entry);
  return preferHd && files.hdAnims ? files.hdAnims : files.anims;
}

/** Does the page turn the dress models off? `?dress=off` keeps the chapter's single model per girl (the comparison, and what the chapter plays with no dress files). */
export const dressOff = (search: string): boolean => new URLSearchParams(search).get('dress') === 'off';

/**
 * The dressphere a painting's id names for `girl`: `yuna-white-mage` is `white-mage`, whatever the art namespace in front of it and whatever the file path it came from. Null for an id that is not
 * `<girl>-<dressphere>` (the bare `yuna` the presenter falls back to when a dressphere has no painting, or nothing at all): the model then keeps what it shows.
 */
export function dressOfArt(girl: Girl, artId: string | null | undefined): string | null {
  if (typeof artId !== 'string' || !artId) return null;
  const leaf = baseArtId(artId.slice(artId.lastIndexOf('/') + 1)); // outside any art namespace (`exp-leblanc-yuna-gunner` is `yuna-gunner`) and any path
  const prefix = `${girl}-`;
  return leaf.startsWith(prefix) && leaf.length > prefix.length ? leaf.slice(prefix.length) : null;
}
