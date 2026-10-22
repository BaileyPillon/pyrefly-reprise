/**
 * THE SHORT HIT-STOP (`?hitstop=short`; `FeelSwitch.ts` has the switch; both games). Bailey, 2026-10-22: hit-stop "Short, big hits only": 3 to 4 frames on criticals, Overdrives and
 * boss big attacks, and nothing on an ordinary blow.
 *
 * **It extends the stop that exists, it does not add a second one.** BATTLE SPECTACLE's `HitStop` (`fx/c/Trauma.ts`) already holds the field clock for `HitPlan.freezeMs`, and the
 * presenter already waits that long (`motion/DemoHitBeat.holdBlow`); `planHit` asks {@link shortStopMs} for the length when this switch is on, in place of today's 40 or 28 ms
 * on an ordinary first blow and the demo's 17 to 150 ms by power. The stop is a length of REAL TIME, so a 144 Hz screen holds the same 50 to 67 ms as a 60 Hz one (3 or 4 frames
 * at 60 Hz, 7 or 10 at 144 Hz). The camera's punch and shake run on the animation clock, which the stop does not hold, so the punch reads during the stop.
 *
 * Frames are quoted at 60 Hz (the game's clock, `[ours]`): 3 frames = 50 ms (a crit, a boss's headline move), 4 frames = 67 ms (the last blow of an Overdrive or Special).
 *
 * **Boss big attacks** ({@link isBossBigMove}) are a short list of headline moves per demo boss, `[ours]`: the sources give a move no weight class, and the repo's own marker of a
 * headline move (`TelegraphHold.ts`) names only Lance of Atrophy. The list is the damaging moves the demo's two bosses lead their fights with: Seymour Flux's Lance of Atrophy, Cross
 * Cleave and Total Annihilation, Bahamut's Impulse and Mega Flare (`data/ffx/enemies/seymour-flux-abilities.ts`, `data/ffx2/enemies/bahamut-abilities.ts`). REDUCE MOTION stops no
 * stop (the caller's rule in `planHit`, unchanged).
 *
 * Pure: no `three`, no DOM.
 */

/** One frame at 60 Hz, ms. */
export const FRAME_MS_60 = 1000 / 60;

/** 3 frames at 60 Hz: a critical or a boss's headline move. */
export const SHORT_STOP_CRIT_MS = 50;
/** 4 frames at 60 Hz: the last blow of an Overdrive or Special. */
export const SHORT_STOP_FINISHER_MS = 67;

/** The headline moves of the demo bosses, by ability id. */
export const BOSS_BIG_MOVES: ReadonlySet<string> = new Set([
  'lance-of-atrophy', // Seymour Flux, Chapter I (FFX)
  'cross-cleave',
  'total-annihilation',
  'x2-bahamut-impulse', // Bahamut, Chapter IV (FFX-2)
  'x2-bahamut-mega-flare',
]);

/** Is this ability one of a boss's headline moves? (The caller adds the "a foe uses it" half.) */
export function isBossBigMove(abilityId: string | undefined): boolean {
  return abilityId !== undefined && BOSS_BIG_MOVES.has(abilityId);
}

/** What the stop reads of one blow. */
export interface StopFacts {
  crit: boolean;
  /** The action is an Overdrive or a Special. */
  big: boolean;
  /** The last blow the action shows. */
  last: boolean;
  /** A foe's headline move. */
  bossBig: boolean;
  hitIndex: number;
  hitCount: number;
}

/**
 * How long the field holds on this blow, ms: 67 on the last blow of an Overdrive or Special, 50 on a boss's headline move (its first blow) and on a critical (the first or last
 * blow of a flurry, never the middle), 0 on everything else, including an ordinary heavy blow and an overkill.
 */
export function shortStopMs(f: StopFacts): number {
  if (f.big && f.last) return SHORT_STOP_FINISHER_MS;
  if (f.bossBig && f.hitIndex === 0) return SHORT_STOP_CRIT_MS;
  if (f.crit && (f.hitCount <= 1 || f.hitIndex === 0 || f.last)) return SHORT_STOP_CRIT_MS;
  return 0;
}
