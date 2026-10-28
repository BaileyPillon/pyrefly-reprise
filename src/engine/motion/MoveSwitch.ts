/**
 * THE MOTION-FLUIDITY SWITCHES OF LANE L2 "moves" (motion-fluidity pass, release 64 plan, 2026-10-26; Bailey ~13:45 EDT: "I need an additional pass for motion, motion fluidity, animations etc please",
 * his bar "The motion and animations need to be top notch, even above visuals"; all decisions delegated to the driver).
 *
 * Every item of the pass that changes HOW motion looks is built behind an address word, so one build holds every variant and a clip is the same build, the same seed, the same moment with only the
 * word changed (the plan's film method). **Release 67 (the driver's call under Bailey's delegation, 2026-10-28; his to overturn) made his picks of this lane the defaults: `?hit` reads `knock` (message 1),
 * `?run` reads `flow` and `?rigko` reads `whole` (message 2)** ({@link MOVE_DEFAULTS}: ONE line each), **and `?strikeshape` reads `travel` (the driver's call, 2026-10-28, a follow-on to the `?curves=real-snappy` pick: without it Paine's strike is one 228 px frame)**; every other word still defaults to today, and `?hit=today&run=today&rigko=today&strikeshape=today` with `?curves=new` is release 66's look, exactly. Read once, like the other URL switches (`CurvesSwitch.ts`, `SmearSwitch.ts`); `setMoveWord` (and `__pyrefly.move`) force a word for
 * what starts from now on. Pure: no `three`, no DOM but the address of the page (hard rule 1).
 *
 * | word | values (first is today) | item | game |
 * |---|---|---|---|
 * | `?hit=` | `today`, `ramp`, `knock` (**default `knock`** since release 67) | MF-03: the struck figure's reaction | both |
 * | `?run=` | `today`, `smooth`, `flow`, `pace` (**default `flow`** since release 67) | MF-04: an FFX-2 girl's run, leap and lunge | FFX-2 only |
 * | `?rigko=` | `today`, `whole` (**default `whole`** since release 67) | MF-11: a rig boss's knock-out is the whole fall, and its idle key waits for a strike to be over | both (Seymour Flux, Bahamut) |
 * | `?strikeshape=` | `today`, `travel` (**default `travel`** since release 67) | MF-14 V3: with `?curves=real-snappy`, the dash keeps the house travel at the 1.1 s pick (`today`: the clip's own, a one-frame dash). It acts only where `real-snappy` plays (Chapter I and Chapter IV, the pack on, a desktop-class screen): `?curves=new`, `today`, `real` and a phone never read it | both |
 *
 * (Later items of the lane add their words to this table: `kotopple`, `hurtstring`, `summon`, `ramps`, `shakeband`; none of them defaults to anything but today.) A word the table does not list reads as the word's default (today, but for `hit`, `run`, `rigko` and `strikeshape`). The words apply in every
 * chapter of the game they belong to; the film is made in Chapter I (FFX) and Chapter IV (FFX-2).
 */
import { queryWord } from './DemoGate.ts';

/** The words of the table above: the key, then its values (the first is today). */
export const MOVE_WORDS = {
  hit: ['today', 'ramp', 'knock'],
  run: ['today', 'smooth', 'flow', 'pace'],
  kotopple: ['today', 'eased'],
  rigko: ['today', 'whole'],
  hurtstring: ['today', 'hold'],
  summon: ['today', 'leap'],
  ramps: ['today', 'smooth'],
  shakeband: ['today', 'band'],
  strikeshape: ['today', 'travel'],
} as const;

export type MoveKey = keyof typeof MOVE_WORDS;
export type MoveValue<K extends MoveKey> = (typeof MOVE_WORDS)[K][number];

/**
 * THE PICKS AS DEFAULTS (release 67): a word listed here reads this value when the address does not name a value it knows; every word not listed reads `today`, the first value. `today` is always a word,
 * and it is release 66's look. To change a pick, change the value on its line (it must be one of the word's listed values; `tests/unit/release67-picks.test.ts` pins it).
 * Message 1 (04:05 EDT): `hit`. Message 2: `run` (FFX-2 only: the run-in plays only there; `flow` falls back to the smooth run where the new curves are off, `RunEase.runMode`) and `rigko` (both games, the rig bosses).
 * None of the three is gated by the pack (the words never were), so `?pack=off` and a phone read the picks too, as `?hit` does. `strikeshape` (the driver's call, 2026-10-28): `travel`, so the real-snappy strike travels over the house dash
 * (about a fifth of a second) instead of jumping in one frame; it has exactly the scope of `?curves=real-snappy` because the one reader (`RealMotion.houseTravel`) answers only for that mode (`?strikeshape=today` is the clip's own dash).
 */
export const MOVE_DEFAULTS: { readonly [K in MoveKey]?: MoveValue<K> } = {
  hit: 'knock',
  run: 'flow',
  rigko: 'whole',
  strikeshape: 'travel',
};

/** The value `key` reads when the address does not name one: its pick if it has one, else today (the first value). */
export function moveDefault<K extends MoveKey>(key: K): MoveValue<K> {
  return (MOVE_DEFAULTS[key] ?? MOVE_WORDS[key][0]) as MoveValue<K>;
}

const forced = new Map<MoveKey, string>();
const read = new Map<MoveKey, string>();

/** The word of `key` from a search string (pure): a listed value (`today` included), else the word's default ({@link moveDefault}: today, but for Bailey's pick). */
export function moveWordFromSearch<K extends MoveKey>(search: string | undefined, key: K): MoveValue<K> {
  const values = MOVE_WORDS[key] as readonly string[];
  const w = queryWord(search, key);
  return (values.includes(w) ? w : moveDefault(key)) as MoveValue<K>;
}

/** The word in force for `key`: a forced one, else the address's (read once), else today. */
export function moveWord<K extends MoveKey>(key: K): MoveValue<K> {
  const f = forced.get(key);
  if (f !== undefined) return f as MoveValue<K>;
  let w = read.get(key);
  if (w === undefined) {
    w = moveWordFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''), key);
    read.set(key, w);
  }
  return w as MoveValue<K>;
}

/** Tests and `window.__pyrefly.move(...)`: force a word (`null` reads the address again). A word not in the table is refused (returns false). */
export function setMoveWord<K extends MoveKey>(key: K, value: MoveValue<K> | null): boolean {
  if (value === null) {
    forced.delete(key);
    read.delete(key);
    return true;
  }
  if (!(MOVE_WORDS[key] as readonly string[]).includes(value)) return false;
  forced.set(key, value);
  return true;
}

/** Every key's word now, for a recorder's meta file. */
export function moveWords(): Record<MoveKey, string> {
  const out = {} as Record<MoveKey, string>;
  for (const k of Object.keys(MOVE_WORDS) as MoveKey[]) out[k] = moveWord(k);
  return out;
}
