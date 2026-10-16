/**
 * SFX parity (2026-10-10, `docs/handoff/sfx-parity.md`): which parity packs a chapter run loads.
 *
 * The recorded originals of the parity set ship as packs, not as one sprite (`manifest.sfxParity.packs`): a game's
 * CORE pack (the sounds every fight of that game shares) and one BOSS pack per boss or family (its signature
 * moves). A fight fetches only its game's core and its own boss pack, so a pack stays far under the 5 MB sprite
 * gate and the title, chapter select and FF7 load nothing at all. Names are `<game>-core` and `<game>-<boss>`, the
 * file is `sfx/parity-<name>.mp3`.
 *
 * Game case (AGENTS.md rule 14): a pack belongs to one game, and the name says which. {@link packsFor} refuses a
 * boss pack that does not start with the playing game's id, so an FFX-2 chapter can never fetch an FFX pack.
 * Shared plumbing, "both"; the packs themselves are each one game's.
 *
 * A name listed here for a pack that has not shipped is harmless: `SfxSprites.loadPacks` fetches only packs the
 * manifest lists. So this table is the plan, and the manifest is the fact.
 */

export type ParityGameId = 'ffx' | 'ffx2';

/** A pack name: `ffx-core`, `ffx2-leblanc`. */
export const PARITY_PACK_NAME = /^(ffx|ffx2)-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The core pack of a game. */
export function corePack(game: ParityGameId): string {
  return `${game}-core`;
}

/**
 * The boss packs of a chapter, by chapter id (`ChapterId`). Only the bosses the spec names a pack for
 * (SFX parity spec 5.1: Flux, the Lady, the Final Aeon; Bahamut, the Fallen Aeons and Ixion, Vegnagun and Shuyin;
 * the Leblanc chapter, which is the first wave). A chapter that is not listed plays its game's core pack alone.
 */
export const BOSS_PACKS: Readonly<Record<string, readonly string[]>> = {
  // FFX chapters.
  'seymour-flux': ['ffx-flux'],
  yunalesca: ['ffx-lady'],
  'braskas-final-aeon': ['ffx-final-aeon'],
  'mirror-aeons': ['ffx-final-aeon'], // Chapter XXVII (listed 2026-10-16): Lulu casts Ultima (the guides' answer to Dark Mindy's Evasion), whose recorded row lives in the Final Aeon's pack
  // FFX-2 chapters.
  'ffx2-leblanc': ['ffx2-leblanc'],
  'exp-leblanc': ['ffx2-leblanc'], // the hidden Leblanc chapter plays the same fight
  'ffx2-bahamut': ['ffx2-bahamut'],
  'ffx2-fallen-aeons': ['ffx2-aeons'],
  'ffx2-ixion-djose': ['ffx2-aeons'],
  'ffx2-vegnagun-shuyin': ['ffx2-machina', 'ffx2-shuyin'],
};

/**
 * The packs to load and consult for a chapter run, in lookup order: the boss packs first (a boss's own sound beats
 * the shared one of the same name), the game's core pack last. Never contains a pack of another game.
 */
export function packsFor(game: ParityGameId, chapterId: string | null): string[] {
  const boss = chapterId ? (BOSS_PACKS[chapterId] ?? []) : [];
  const out: string[] = [];
  for (const name of [...boss, corePack(game)]) {
    if (name.startsWith(`${game}-`) && PARITY_PACK_NAME.test(name) && !out.includes(name)) out.push(name);
  }
  return out;
}
