/**
 * The images of a rig part, fetched one look at a time, and the stream that brings a boss rig's variant looks in after the figure is built (lane "r73-bytes", release 73; BOTH games, shared loading
 * plumbing; no DOM; `three` for the textures only; `docs/handoff/r73-bytes.md`).
 *
 * A part has its OWN image and, in a format v2 rig, one VARIANT per pose that swaps it (a boss's attack, cast, hurt, telegraph and ko arms, heads and bodies; `RigPartState.ts`). `RigFigure.load` used to
 * fetch every look of every part, with its rim mask and its normal piece, before the figure could be built: 4.7 MB in Chapter I (Seymour Flux) and 5.7 MB in Chapter IV (Bahamut), of which 2.8 and 3.3 MB are
 * variants that no frame draws until the boss first hurts, telegraphs or attacks. On a phone's 10 Mbit/s line that is 2.2 to 2.6 s of the entry (release 70's phone10 run). While the phone's entry holds the line
 * (`LoadHold.bytesHeld`) the figure is built with each part's own look; a variant is the part's own image until it lands, and lands when the hold opens, in the order a fight first draws them
 * ({@link VARIANT_FIRST_USE}), through the same ranked queue as the later poses. Off the phone, and with `?phonebytes=off`, nothing here runs and the figure is built whole, as before.
 */
import { LinearFilter, LinearMipmapLinearFilter, NoColorSpace, SRGBColorSpace, type Texture } from 'three';
import type { RigPartData, RigVariantData } from './RigData.ts';
import { rigFileUrl, type RigTextures } from './RigTier.ts';
import { noteBytesCut, queued, whenBackgroundOpen } from '../LoadHold.ts';
import { poseNeed } from '../LoadDiet.ts';

export const configure = (t: Texture, mips: boolean): Texture => {
  t.colorSpace = SRGBColorSpace;
  t.magFilter = LinearFilter;
  t.minFilter = mips ? LinearMipmapLinearFilter : LinearFilter;
  t.generateMipmaps = mips;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
};

/** A normal piece is data, not colour: no colour space, mips, linear. */
export const configureNormal = (t: Texture): Texture => {
  t.colorSpace = NoColorSpace;
  t.magFilter = LinearFilter;
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
};

/** What one look of a part is made of: its colour map, its rim mask (where it has one) and its normal piece (where the HD-2D look wants one and the file carries it). */
export interface LookImages {
  map: Texture;
  rim: Texture | null;
  normal: Texture | null;
}

/**
 * Fetch one look's images: the colour map at the tier's scale, then the rim mask at its own scale when the look has a mask, then (release 61, the HD-2D look) the normal piece when `wantNormals` and
 * the file names one; a normal piece that does not load is not an error, that look is just not lit. The three are awaited one after the other, as `RigFigure.load` always did. Rejects when the map or the mask does not load.
 */
export async function fetchLook(src: RigPartData | RigVariantData, base: string, scales: RigTextures, fetchTex: (url: string) => Promise<Texture>, wantNormals: boolean): Promise<LookImages> {
  const map = configure(await fetchTex(rigFileUrl(base, src.png, scales.map)), true);
  const rim = src.rimMode === 'mask' && src.rim ? configure(await fetchTex(rigFileUrl(base, src.rim, scales.rim)), true) : null;
  let normal: Texture | null = null;
  if (wantNormals && src.normal) {
    try {
      normal = configureNormal(await fetchTex(rigFileUrl(base, src.normal, 2)));
    } catch {
      normal = null;
    }
  }
  return { map, rim, normal };
}

/**
 * The order a fight first draws a boss rig's variants in. The party moves first at the opening (the first thing a boss rig shows is a hit: hurt), a boss's move is shown by its telegraph and then its attack,
 * its cast is the other kind of move, and its ko is last. A variant this list does not name comes after these, in the file's order. (A heuristic of order, not a game fact: it changes when a variant lands, not what it is.)
 */
export const VARIANT_FIRST_USE: readonly string[] = ['hurt', 'telegraph', 'attack', 'cast', 'ko'];

/** The rank of a variant name in {@link VARIANT_FIRST_USE}; a name it does not list comes after them all. */
export function firstUseRank(name: string): number {
  const i = VARIANT_FIRST_USE.indexOf(name);
  return i < 0 ? VARIANT_FIRST_USE.length : i;
}

/**
 * The queue rank a variant look is asked for at (review of lane "r73-bytes", major 2: the stream must not turn a boss's first move into the part's resting image on a slow line).
 * The three a fight shows first (hurt, telegraph, attack: {@link VARIANT_FIRST_USE}) share the idle lighting maps' rank (`2 * poseNeed('idle') + 1`, `FigureRelight.mapRank`), ahead of the party's
 * everyday poses; cast, ko and any variant the list does not name keep the everyday moves' rank (`2 * poseNeed('attack')`). The same bytes in another order: the party's attack paintings start
 * after about 1.5 MB more, a few seconds before anyone can choose an attack.
 */
export function variantRank(name: string): number {
  return isFirstMove(name) ? 2 * poseNeed('idle') + 1 : 2 * poseNeed('attack');
}

/** One of the three variants a fight shows first: hurt, telegraph, attack (the look claim of lane "r73-bytes" rests on these having landed by the first menu). */
export const isFirstMove = (name: string): boolean => firstUseRank(name) <= firstUseRank('attack');

/** What the stream needs of the figure whose looks it fills (`RigFigure` is that figure). */
export interface LookSink {
  /** The variant looks that are still the part's own image: the part's index, the look's index in its part, and its record. */
  pendingLooks(): Array<{ part: number; look: number; src: RigVariantData }>;
  /** The scales the figure's textures are at now: a look is fetched at the scale the figure has when its turn comes. */
  readonly texScales: RigTextures;
  /** A variant look arrived: it takes the place of the part's own image as that look (the figure frees it if it has gone meanwhile). */
  landLook(part: number, look: number, images: LookImages): void;
  /** True once the figure was disposed. */
  readonly gone: boolean;
}

/**
 * Bring a figure's pending variant looks in. Each waits for the phone's hold to open, then goes through the ranked queue (`LoadHold.queued`, at {@link variantRank}), in the order of
 * {@link VARIANT_FIRST_USE}. A look that fails to load is asked for once more; if it fails again the part keeps its own image for that pose (a thing the rig gate cannot let happen for a file that ships; a dropped
 * line can) and the page says so once. Never rejects; resolves when every look has landed or given up.
 */
export function streamLooks(sink: LookSink, base: string, fetchTex: (url: string) => Promise<Texture>, wantNormals: boolean, label: string): Promise<void> {
  const todo = sink.pendingLooks().sort((a, b) => firstUseRank(a.src.name) - firstUseRank(b.src.name));
  const early = (t: (typeof todo)[number]): boolean => isFirstMove(t.src.name); // the books keep the three a fight shows first apart
  noteBytesCut('rigLooks', todo.length);
  noteBytesCut('rigEarlyLooks', todo.filter(early).length);
  const one = async (t: (typeof todo)[number]): Promise<void> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (sink.gone) return;
      try {
        sink.landLook(t.part, t.look, await fetchLook(t.src, base, sink.texScales, fetchTex, wantNormals));
        noteBytesCut('rigLanded');
        if (early(t)) noteBytesCut('rigEarlyLanded');
        return;
      } catch {
        /* once more, then give up below */
      }
    }
    if (sink.gone) return;
    noteBytesCut('rigFailed');
    console.warn(`[rig] ${label}: the ${t.src.name} image of part ${t.part} did not load; that part keeps its own image for it`);
  };
  return Promise.all(todo.map((t) => whenBackgroundOpen().then(() => queued(variantRank(t.src.name), () => one(t))))).then(() => undefined);
}
