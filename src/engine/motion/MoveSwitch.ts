/**
 * THE MOTION-FLUIDITY SWITCHES OF LANE L2 "moves" (motion-fluidity pass, release 64 plan, 2026-10-26; Bailey ~13:45 EDT: "I need an additional pass for motion, motion fluidity, animations etc please",
 * his bar "The motion and animations need to be top notch, even above visuals"; all decisions delegated to the driver).
 *
 * Every item of the pass that changes HOW motion looks is built behind an address word whose DEFAULT IS TODAY, so one build holds every variant and a clip is the same build, the same seed, the
 * same moment with only the word changed (the plan's film method). Read once, like the other URL switches (`CurvesSwitch.ts`, `SmearSwitch.ts`); `setMoveWord` (and `__pyrefly.move`) force a word for
 * what starts from now on. Pure: no `three`, no DOM but the address of the page (hard rule 1).
 *
 * | word | values (first is today) | item | game |
 * |---|---|---|---|
 * | `?hit=` | `today`, `ramp`, `knock` | MF-03: the struck figure's reaction | both |
 * | `?run=` | `today`, `smooth`, `flow`, `pace` | MF-04: an FFX-2 girl's run, leap and lunge | FFX-2 only |
 * | `?strikeshape=` | `today`, `travel` | MF-14 V3: with `?curves=real-snappy`, the dash keeps the house travel at the 1.1 s pick | both |
 *
 * (Later items of the lane add their words to this table: `kotopple`, `rigko`, `hurtstring`, `summon`, `ramps`, `shakeband`.) A word the table does not list reads as today. The words apply in every
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

const forced = new Map<MoveKey, string>();
const read = new Map<MoveKey, string>();

/** The word of `key` from a search string (pure): a listed value, else today (the first). */
export function moveWordFromSearch<K extends MoveKey>(search: string | undefined, key: K): MoveValue<K> {
  const values = MOVE_WORDS[key] as readonly string[];
  const w = queryWord(search, key);
  return (values.includes(w) ? w : values[0]!) as MoveValue<K>;
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
