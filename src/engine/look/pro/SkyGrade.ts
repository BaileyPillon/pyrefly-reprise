/**
 * THE SKY GRADE: THREE LIGHTER OPTIONS FOR THE FARPLANE'S TWO PLATES, BEHIND A MEASURING WORD, DEFAULT OFF (`booth-ffx2-b4-sky`, FFX-2 only; the driver's call, Bailey 2026-10-30 "the nice treatment you gave to the booth
 * chapters you need to now apply to all live and selectable chapters", and 2026-10-29 "you make all executive decisions for the next few days"; every call here is the driver's, delegated, and Bailey's to overturn).
 *
 * WHY. The r70 browser read (`docs/handoff/booth-b3.md` section 12) took Chapter V (`ffx2-vegnagun-shuyin`, the Heart of the Farplane) and Chapter XI (`ffx2-fallen-aeons`, the Road to the Farplane) off the treated list: the HD-2D
 * bold look over their very bright shared sky clips the spire's burst to a flat white halo (Chapter V's first menu: mean luma 126.6 against live's 101.5, 13.5 percent of pixels over 240 against 2.7; Chapter XI's fights whenever the
 * follower brings the burst into frame). They come back with the look HELD (`PieceHolds.ts`: `hd2d` and `arena`), so the plate draws as release 69 draws it. A lighter grade is a LOOK decision (hard rule 9), so this module builds
 * three candidates for the driver to film as stills beside release 69 and Chapter IV for Bailey. **Nothing here plays by default.**
 *
 * THE WORD. `?skygrade=a|b|c` (and `__pyrefly.skyGrade('a' | 'b' | 'c' | null)`). With the word, and only in Chapter V or Chapter XI while the treatment reaches the chapter (`?treated=pack` and an address that chose a look by hand answer
 * release 68), the held `hd2d` look and `arena` grade play with the option's changes on the room's pro table (the table that failed the read: `ProGrade.ts` `farplane` and `road-to-the-farplane`). Without the word nothing in this module
 * reads anything but the address, so a page with no `skygrade` key draws byte for byte as it would without this file. `?pro=off` with the word reads the bold look alone (no pro table to patch: the unlightened row of the r70 read).
 *
 * THE THREE OPTIONS (each is one idea, so the stills answer one question each; the numbers are [ours], and a prediction for each is in `docs/handoff/booth-ffx2-b4-sky.md`):
 * - `a` EXPOSURE CAP: the room's exposure is capped at 1.0 (the r70 rows are 1.45 and 1.5), the one lever; every other term of the pro table stays as the r70 read had it.
 * - `b` HIGHLIGHT ROLL-OFF: a soft knee on the pro colour transform (`ProColour.shoulder`, tanh above 0.5; the rows have none) and exposure capped at 1.2. The burst keeps its gradation instead of clipping.
 * - `c` DIMMER BOLD ROW: the added-light terms of the bold row come down (the shafts 2.0 to 0.8, the stage light 1.7 to 1.2, the bloom strength 0.85 to 0.45 and its threshold 0.66 to 0.8, the figure key 1.5 to 1.3, the cone 0.42 to 0.3)
 *   and exposure is capped at 1.2: the burst throws less light into its own sky.
 *
 * Game case (rule 14): FFX-2 only. The word reads the two FFX-2 chapters named in {@link SKY_CHAPTERS}; no FFX chapter and no other FFX-2 chapter answers it. Presentation only: no number of a fight changes. Pure: no DOM, no `three`
 * (the address of the page, read once, is the only page read; hard rule 1).
 */
import { isTreatedChapter, queryWord } from '../../motion/DemoGate.ts';
import type { ProRoom } from './ProGrade.ts';

export type SkyOption = 'a' | 'b' | 'c';
export const SKY_OPTIONS: readonly SkyOption[] = ['a', 'b', 'c'];

/** The two chapters the word reaches, each with the scene key of its plate (`LookRoom.key`, the key of `ProGrade.PRO_ARENA`): Chapter V (the Heart of the Farplane) and Chapter XI (the Road to the Farplane). */
export const SKY_CHAPTERS: Readonly<Record<string, string>> = Object.freeze({
  'ffx2-vegnagun-shuyin': 'farplane',
  'ffx2-fallen-aeons': 'road-to-the-farplane',
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

/** `?skygrade=a|b|c` from a search string (pure): the option, or null (no word, or a word that names no option). */
export function skyOptionFromSearch(search: string | undefined): SkyOption | null {
  const w = queryWord(search, 'skygrade');
  return (SKY_OPTIONS as readonly string[]).includes(w) ? (w as SkyOption) : null;
}

let word: SkyOption | null | undefined;

/** The option the page asked for (read once from the address), or null. */
export function skyOption(): SkyOption | null {
  if (word === undefined) word = skyOptionFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return word;
}

/** Tests and `__pyrefly.skyGrade(...)`: force the option (`undefined` reads the address again). */
export function setSkyOption(value: SkyOption | null | undefined): void {
  word = value;
}

/**
 * The option that reaches this chapter, or null: the word is set, the chapter is Chapter V or Chapter XI, and the treatment reaches the chapter at all (`isTreatedChapter(id)`: under `?treated=pack` it does not). Pure but for the address.
 * `LookConfig.chapterLook` and `ProSwitch.proArenaFor` ask it for the chapter they are given, so a held `hd2d` look and a held `arena` grade play in these two chapters with the word and in no other case.
 */
export function skyGradeFor(chapterId: string | undefined): SkyOption | null {
  if (chapterId === undefined || !Object.prototype.hasOwnProperty.call(SKY_CHAPTERS, chapterId)) return null;
  return isTreatedChapter(chapterId) ? skyOption() : null;
}

let running: string | undefined;

/**
 * The battle's look setup names the chapter (`LookState.applyChapterLook`); the room's patch below applies only while that chapter is one of the two and the word is set (so a word set live by `__pyrefly.skyGrade` after the page opened reaches the
 * battle already running, as far as the room's table goes: the look rig itself is built when a battle starts). `undefined` as the style is CLASSIC or the chapter is any other.
 */
export function setSkyRunning(chapterId: string | undefined): void {
  running = chapterId !== undefined && Object.prototype.hasOwnProperty.call(SKY_CHAPTERS, chapterId) ? chapterId : undefined;
}

/** The option patching the room now: the running chapter is one the word reaches, else null. */
export function skyActive(): SkyOption | null {
  return running === undefined ? null : skyGradeFor(running);
}

/** A change of the active option (the LUT cache key reads it; 0 = none). */
export function skyRevision(): number {
  const o = skyActive();
  return o === null ? 0 : SKY_OPTIONS.indexOf(o) + 1;
}

/** What the screen draws in a Farplane chapter right now: `release69` (the look is held and no rig is armed: the plate as release 69 draws it), `r70` (the rig and the arena are up and no option patches the table: the failing grade, the control arm) or the option. */
export type SkyScreen = 'release69' | 'r70' | SkyOption;

/**
 * Which picture a still taken now would show, so a still is never labelled with an option that is patching nothing. `rigArmed` is the look state's own answer (`lookState.armed && lookState.pro`: the bold look and the pro arena are built; the caller reads it, this
 * module stays free of the look state). The word changes the table the LUT is built from, but the table reaches the screen only through the rig, which `LookState.applyChapterLook` arms when the battle sets up: on a page that opened WITHOUT the word a
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
