/**
 * The two front-end choices of release 39.5 (Bailey, 2026-10-07): which title screen is drawn, and which of the
 * three chapter-select tracks plays on the board.
 *
 * Bailey's words, kept verbatim because the defaults come from them.
 *
 * Title screen: "go with this as a new selectable title screen, and once selected it hides echoes of spira
 * since it's already in the image itself. it will look neater that way. current title screen is still the
 * default." So `titleArt` is a list of variants: `'farplane'` is today's painting (the Gullwings on the Farplane
 * shore, `art/title/keyart.png`) and stays the default; `'echo'` is the new one (Yuna kneeling in still water,
 * `art/title/echo.png`), which carries its own painted lettering, so the HTML "Echoes of Spira" is not drawn
 * over it (`frontend/titleMarkup.ts`).
 *
 * Chapter-select music: "I'll go with B", "but C as a selectable alternate", "and A as a selectable alternate as
 * well", "B as the default". So `chapterSelectMusic` is `'b'` (the cue `chapter-select`, live since 39.4), `'a'`
 * (`chapter-select-a`) or `'c'` (`chapter-select-c`); the two alternates are new cues that play the ElevenLabs
 * takes A and C (`docs/audio/music-elevenlabs-2026-10-07.json`).
 *
 * Both fields are additive: an older save has neither, `SaveData.migrate` merges the shipped defaults under the
 * stored settings, and this module's {@link migrateFrontend} then makes anything that is not one of the listed
 * values (a hand-edited blob, a value from a later build) read as the default instead of reaching the title
 * screen or the audio manager (CHK-024). `SAVE_VERSION` does not change.
 *
 * Its own module because `SaveData.ts` is over the house line cap (the `saveComfort.ts` precedent).
 *
 * Game case: both games. The title screen is the front door to both halves and the board is shared
 * (`docs/audio/THEMES.md` lists chapter-select as "both"); nothing here is true of one game and not the other.
 */

import type { Settings } from './SaveData.ts';

// ------------------------------------------------------------------ title art

/** The title screens, in the order the TITLE SCREEN row steps through them. The first is the default. */
export const TITLE_ARTS = ['farplane', 'echo'] as const;
export type TitleArt = (typeof TITLE_ARTS)[number];

/** Today's painting; what every save without the field, and every invalid value, reads as. */
export const DEFAULT_TITLE_ART: TitleArt = 'farplane';

/** The painting each variant draws, relative to `public/art` (built into a URL with `artUrl`). */
export const TITLE_ART_PLATES: Readonly<Record<TitleArt, string>> = {
  farplane: 'art/title/keyart.png',
  echo: 'art/title/echo.png',
};

/** What the TITLE SCREEN row reads. */
export const TITLE_ART_LABELS: Readonly<Record<TitleArt, string>> = {
  farplane: 'FARPLANE',
  echo: 'THE ECHO',
};

/** True for exactly one of {@link TITLE_ARTS}. */
export function isTitleArt(v: unknown): v is TitleArt {
  return typeof v === 'string' && (TITLE_ARTS as readonly string[]).includes(v);
}

/** `v` when it names a title screen, the default otherwise. */
export function titleArtOf(v: unknown): TitleArt {
  return isTitleArt(v) ? v : DEFAULT_TITLE_ART;
}

// ------------------------------------------------------- chapter-select music

/** The three tracks, in the order the CHAPTER MUSIC row steps through them. The first is the default (Bailey: "B as the default"). */
export const CHAPTER_SELECT_MUSICS = ['b', 'a', 'c'] as const;
export type ChapterSelectMusic = (typeof CHAPTER_SELECT_MUSICS)[number];

/** B, the take live since 39.4; what every save without the field, and every invalid value, reads as. */
export const DEFAULT_CHAPTER_SELECT_MUSIC: ChapterSelectMusic = 'b';

/**
 * The music cue each choice plays. `chapter-select` is B and keeps its name (nothing that already asks for it changes);
 * A and C are cues of their own, in `public/audio/manifest.json` with `source: "elevenlabs-music_v2_5"` and, in
 * `audio/tracks/index.ts`, stand-ins for B's score, so a browser that cannot load the file still plays music.
 */
export const CHAPTER_SELECT_CUES: Readonly<Record<ChapterSelectMusic, string>> = {
  b: 'chapter-select',
  a: 'chapter-select-a',
  c: 'chapter-select-c',
};

/** What the CHAPTER MUSIC row reads: Bailey's letter and, so a player who never heard the sketches can tell them apart, what it is. */
export const CHAPTER_SELECT_LABELS: Readonly<Record<ChapterSelectMusic, string>> = {
  b: 'B  PIANO',
  a: 'A  WALTZ',
  c: 'C  VOICE',
};

/** True for exactly one of {@link CHAPTER_SELECT_MUSICS}. */
export function isChapterSelectMusic(v: unknown): v is ChapterSelectMusic {
  return typeof v === 'string' && (CHAPTER_SELECT_MUSICS as readonly string[]).includes(v);
}

/** `v` when it names a track, the default otherwise. */
export function chapterSelectMusicOf(v: unknown): ChapterSelectMusic {
  return isChapterSelectMusic(v) ? v : DEFAULT_CHAPTER_SELECT_MUSIC;
}

/** The cue the board plays for a stored setting (any value: an invalid one plays B). */
export function chapterSelectCue(v: unknown): string {
  return CHAPTER_SELECT_CUES[chapterSelectMusicOf(v)];
}

// ------------------------------------------------------------------- stepping

/** The next entry of `list` after `current`, wrapping at the ends; an unknown `current` counts as the first. Left, Right and Confirm all land here. */
export function cycle<T extends string>(list: readonly T[], current: unknown, dir: 1 | -1 = 1): T {
  const i = list.indexOf(current as T);
  return list[(Math.max(0, i) + dir + list.length) % list.length] ?? list[0]!;
}

// ------------------------------------------------------------------ migration

/**
 * Apply the rule to `settings` (already merged over the defaults), in place: a value that is not one of the listed
 * ones reads as the default. Nothing else is touched, so an old save loads exactly as it was and gains the two defaults.
 */
export function migrateFrontend(settings: Settings): void {
  if (!isTitleArt(settings.titleArt)) settings.titleArt = DEFAULT_TITLE_ART;
  if (!isChapterSelectMusic(settings.chapterSelectMusic)) settings.chapterSelectMusic = DEFAULT_CHAPTER_SELECT_MUSIC;
}
