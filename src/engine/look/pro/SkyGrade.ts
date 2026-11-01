/**
 * THE SKY GRADE: THREE LIGHTER OPTIONS FOR THE FARPLANE'S TWO PLATES BEHIND A MEASURING WORD, AND, FROM r72, OPTION C AS CHAPTER XI'S DEFAULT (`booth-ffx2-b4-sky` built the options, `r72-sky` made the default; FFX-2 only; the driver's calls, Bailey 2026-10-30 "the nice treatment you gave to
 * the booth chapters you need to now apply to all live and selectable chapters", 2026-10-29 "you make all executive decisions for the next few days", 2026-10-31 ~23:40 EDT "i'll go with all of your recommendations. you make the executive decisions for the next few days";
 * every call here is the driver's, delegated, and Bailey's to overturn).
 *
 * WHY. The r70 browser read (`docs/handoff/booth-b3.md` section 12) took Chapter V (`ffx2-vegnagun-shuyin`, the Heart of the Farplane) and Chapter XI (`ffx2-fallen-aeons`, the Road to the Farplane) off the treated list: the HD-2D
 * bold look over their very bright shared sky clips the spire's burst to a flat white halo (Chapter V's first menu: mean luma 126.6 against live's 101.5, 13.5 percent of pixels over 240 against 2.7; Chapter XI's fights whenever the
 * follower brings the burst into frame). They came back in release 71 with the look HELD (`PieceHolds.ts`: `hd2d` and `arena`), so the plate drew as release 69 draws it. A lighter grade is a LOOK decision (hard rule 9), so this module built
 * three candidates, filmed as stills beside release 69 and Chapter IV for Bailey (the stills and their `numbers.json` are described in `docs/handoff/r72-sky.md`).
 *
 * WHAT r72 DOES WITH THE PICK. Bailey's pick is C ("dimmer lights: a dark night where the burst still shines"). Read on the stills (`numbers.json`, the share of pixels over 240; the lift's number is under 3): in Chapter XI C reads 0.58 and 0.61 percent
 * on the whole frame at the first menu of link 1 (band 0.05 and 0.14) and 0.48 and 0.53 with the burst in frame at the Anima link (band 0.24 and 0.43), so **Chapter XI plays C by default**: its `hd2d` and `arena` holds left `PIECE_HOLDS` (they live in
 * `PieceHoldsSky.ts` and come back only with `?skygrade=today`). In Chapter V C leaves 3.97 and 4.14 percent on the whole frame and 20.9 and 21.9 on the sky band, so **Chapter V keeps today's sky**: both holds stand and only an explicit
 * `?skygrade=a|b|c` plays the held look there, as before. The default is {@link SKY_DEFAULTS}; one row per chapter.
 *
 * THE WORD. `?skygrade=a|b|c|today` (and `__pyrefly.skyGrade('a' | 'b' | 'c' | 'today' | null)`). `a`, `b` or `c` plays that option in Chapter V or Chapter XI while the treatment reaches the chapter (`?treated=pack` and an address that chose a look by hand
 * answer release 68); `today` restores release 71 exactly (Chapter XI's two holds back, no option; Chapter V is already so); no word plays each chapter's default (XI: C, V: none). A page with no `skygrade` key reads nothing here but the address, and every chapter
 * but Chapter XI draws byte for byte as it would without this file's default. `?pro=off` with a NAMED grade reads the bold look alone (no pro table to patch: the unlightened row of the r70 read); with the chapter's DEFAULT grade the look stands aside with the arena (a phone or tablet, `?pack=off`, `?pro=off`, `?look=today` and `?prooff=arena` give release 71's frame: `LookConfig.chapterLook`, the r72 review's M1). Any `?skygrade=` word but `a`, `b`, `c` and `today` is no word and plays the default.
 *
 * THE THREE OPTIONS (each is one idea, so the stills answered one question each; the numbers are [ours], and a prediction for each is in `docs/handoff/booth-ffx2-b4-sky.md`):
 * - `a` EXPOSURE CAP: the room's exposure is capped at 1.0 (the r70 rows are 1.45 and 1.5), the one lever; every other term of the pro table stays as the r70 read had it.
 * - `b` HIGHLIGHT ROLL-OFF: a soft knee on the pro colour transform (`ProColour.shoulder`, tanh above 0.5; the rows have none) and exposure capped at 1.2. The burst keeps its gradation instead of clipping.
 * - `c` DIMMER BOLD ROW: the added-light terms of the bold row come down (the shafts 2.0 to 0.8, the stage light 1.7 to 1.2, the bloom strength 0.85 to 0.45 and its threshold 0.66 to 0.8, the figure key 1.5 to 1.3, the cone 0.42 to 0.3)
 *   and exposure is capped at 1.2: the burst throws less light into its own sky.
 *
 * Game case (rule 14): FFX-2 only. The word reads the two FFX-2 chapters named in {@link SKY_CHAPTERS}; no FFX chapter and no other FFX-2 chapter answers it. Presentation only: no number of a fight changes. Pure: no DOM, no `three`
 * (the address of the page, read once by `DemoGate.skyWord`, is the only page read; hard rule 1).
 */
import { isTreatedChapter, setSkyWord, skyWord, skyWordFromSearch } from '../../motion/DemoGate.ts';
import type { ProRoom } from './ProGrade.ts';

export type SkyOption = 'a' | 'b' | 'c';
export const SKY_OPTIONS: readonly SkyOption[] = ['a', 'b', 'c'];

/** The two chapters the word reaches, each with the scene key of its plate (`LookRoom.key`, the key of `ProGrade.PRO_ARENA`): Chapter V (the Heart of the Farplane) and Chapter XI (the Road to the Farplane). */
export const SKY_CHAPTERS: Readonly<Record<string, string>> = Object.freeze({
  'ffx2-vegnagun-shuyin': 'farplane',
  'ffx2-fallen-aeons': 'road-to-the-farplane',
});

/**
 * The option a chapter plays when the address says nothing (r72): Chapter XI grade C, Bailey's pick from the stills (the share of pixels over 240 reads under 3 percent on its first menu and with the burst in frame). Chapter V has no row: its sky band
 * reads 21 percent over 240 under C, so it keeps today's sky (its holds stand in `PieceHolds.ts`). One row per chapter, overturned by deleting it (and putting the two holds back in `PIECE_HOLDS`).
 */
export const SKY_DEFAULTS: Readonly<Record<string, SkyOption>> = Object.freeze({
  'ffx2-fallen-aeons': 'c',
});

/** What one option changes on the room's pro table: a cap on the exposure, the roll-off knee, the engine numbers it overrides (`__pyrefly.look.param` paths) and the cone's strength multiplier. */
export interface SkyChange {
  readonly name: string;
  /** The exposure is `Math.min(room exposure, exposureCap)`. */
  readonly exposureCap: number;
  /** `ProColour.shoulder`: where the highlight roll-off starts (unset: the room's own, which is none). */
  readonly shoulder?: number;
  readonly tweaks?: Readonly<Record<string, number>>;
  /** Multiplier on the cone's strength (1 or unset: the room's). */
  readonly coneK?: number;
}

export const SKY_CHANGES: Readonly<Record<SkyOption, SkyChange>> = Object.freeze({
  a: { name: 'exposure cap', exposureCap: 1.0 },
  b: { name: 'highlight roll-off', exposureCap: 1.2, shoulder: 0.5 },
  c: { name: 'dimmer bold row', exposureCap: 1.2, tweaks: { 'shaft.gain': 0.8, 'bold.stage': 1.2, 'bloom.strength': 0.45, 'bloom.threshold': 0.8, 'relight.key': 1.3 }, coneK: 0.7 },
});

const isOption = (w: string | null | undefined): w is SkyOption => w === 'a' || w === 'b' || w === 'c';

/** `?skygrade=a|b|c` from a search string (pure): the option, or null (no word, or a word that names no option: `today` is a word but not an option). */
export function skyOptionFromSearch(search: string | undefined): SkyOption | null {
  const w = skyWordFromSearch(search);
  return isOption(w) ? w : null;
}

/** The option the page asked for by name (read once from the address, or set by hand), or null: no word, `today`, or a call of `setSkyOption(null)`. The chapter's own default is {@link skyGradeFor}'s business, not this. */
export function skyOption(): SkyOption | null {
  const w = skyWord();
  return isOption(w) ? w : null;
}

/**
 * Tests and `__pyrefly.skyGrade(...)`: force the word. An option names that grade; `'today'` is release 71's Chapter XI; `null` is NO grade at all, whatever the chapter's default (the r70 control arm: the room's own table, unpatched); `undefined` reads the address
 * again (no page in a unit test: each chapter plays its default).
 */
export function setSkyOption(value: SkyOption | 'today' | null | undefined): void {
  setSkyWord(value === undefined ? null : value === null ? 'off' : value);
}

/**
 * The option that reaches this chapter, or null: the chapter is Chapter V or Chapter XI and the treatment reaches it at all (`isTreatedChapter(id)`: under `?treated=pack` it does not). An option named by the address (or by hand) wins in either; with no word the chapter's
 * default ({@link SKY_DEFAULTS}: XI grade C, V none); `today` and a forced `null` give none. Pure but for the address.
 * `LookConfig.chapterLook` and `ProSwitch.proArenaFor` ask it for the chapter they are given, so a held `hd2d` look and a held `arena` grade play in Chapter V with a named option and in no other case, and Chapter XI, which no longer holds them, plays them with this grade patched on.
 */
export function skyGradeFor(chapterId: string | undefined): SkyOption | null {
  if (chapterId === undefined || !Object.prototype.hasOwnProperty.call(SKY_CHAPTERS, chapterId) || !isTreatedChapter(chapterId)) return null;
  const w = skyWord();
  if (isOption(w)) return w;
  return w === 'default' ? (SKY_DEFAULTS[chapterId] ?? null) : null;
}

let running: string | undefined;

/**
 * The battle's look setup names the chapter (`LookState.applyChapterLook`); the room's patch below applies only while that chapter is one of the two and a grade reaches it (so a word set live by `__pyrefly.skyGrade` after the page opened reaches the
 * battle already running, as far as the room's table goes: the look rig itself is built when a battle starts). `undefined` as the style is CLASSIC or the chapter is any other.
 */
export function setSkyRunning(chapterId: string | undefined): void {
  running = chapterId !== undefined && Object.prototype.hasOwnProperty.call(SKY_CHAPTERS, chapterId) ? chapterId : undefined;
}

/** The option patching the room now: the running chapter is one the word reaches and a grade reaches it (named, or its default), else null. */
export function skyActive(): SkyOption | null {
  return running === undefined ? null : skyGradeFor(running);
}

/** A change of the active option (the LUT cache key reads it; 0 = none). */
export function skyRevision(): number {
  const o = skyActive();
  return o === null ? 0 : SKY_OPTIONS.indexOf(o) + 1;
}

/** What the screen draws in a Farplane chapter right now: `release69` (the look is held and no rig is armed: the plate as release 69 draws it, which is Chapter V by default and Chapter XI under `?skygrade=today`), `r70` (the rig and the arena are up and no option patches the table: the failing grade, the control arm) or the option. */
export type SkyScreen = 'release69' | 'r70' | SkyOption;

/**
 * Which picture a still taken now would show, so a still is never labelled with an option that is patching nothing. `rigArmed` is the look state's own answer (`lookState.armed && lookState.pro`: the bold look and the pro arena are built; the caller reads it, this
 * module stays free of the look state). The word changes the table the LUT is built from, but the table reaches the screen only through the rig, which `LookState.applyChapterLook` arms when the battle sets up: on a page that opened in Chapter V WITHOUT a word a
 * later `__pyrefly.skyGrade('b')` sets `active` and leaves the screen at `release69`. Null outside Chapter V and Chapter XI.
 */
export function skyScreen(rigArmed: boolean): SkyScreen | null {
  if (running === undefined) return null;
  if (!rigArmed) return 'release69';
  return skyActive() ?? 'r70';
}

/**
 * The room's pro table with the active option applied: the same room unchanged (the very object) when no option is active or the key is not the running chapter's plate; otherwise a patched copy (the table itself is never written).
 * `ProGrade.proRoom` wraps its lookup in this.
 */
export function skyRoom(key: string, room: ProRoom | undefined): ProRoom | undefined {
  const o = skyActive();
  if (o === null || room === undefined || running === undefined || SKY_CHAPTERS[running] !== key) return room;
  const c = SKY_CHANGES[o];
  const colour = { ...room.colour, exposure: Math.min(room.colour.exposure, c.exposureCap), ...(c.shoulder !== undefined ? { shoulder: c.shoulder } : {}) };
  const tweaks = c.tweaks ? { ...room.tweaks, ...c.tweaks } : room.tweaks;
  const cone = room.cone && c.coneK !== undefined ? { ...room.cone, strength: room.cone.strength * c.coneK } : room.cone;
  return { ...room, colour, tweaks, ...(cone ? { cone } : {}) };
}
