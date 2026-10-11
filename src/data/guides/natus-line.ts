/**
 * **The Chapter X line switch** (FFX only; `docs/handoff/re-parity-chx-options.md`).
 *
 * One constant picks which line the chapter's auto-battle, strategy guide NEXT line, move advisor (its look-ahead plays
 * the same line) and pause tip teach: the tactic (`src/engine/tactics/seymour-natus.ts`) reads {@link NATUS_LINE}, and
 * the guide (`./seymour-natus.ts`) takes the line's own sentences from `./natus-line-text.ts`. Nothing else decides it, so
 * **picking a candidate is one edit to this constant** (the guide, the pause tip and the tactic follow it), and putting the
 * shipped line back is the same edit.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Seymour Natus, Mortibody and the Highbridge are FFX's (research §0.3).
 * Plain data, like the rest of `src/data/**`: it imports nothing, and the engine's tactic imports it, never the other way.
 *
 * The candidates were built after re-parity W2 gave Natus's Flare the game's rank 3 (record 0x6079; our data had 5), which
 * took the shipped line from 386 to 302 wins of 500. Nothing here touches a boss number, Natus's script, the Flare rank, enemy
 * data or the party preset: a line only chooses among the rows the engine offers.
 */

/** The lines. `shipped` is the line Bailey picked on 2026-09-25 (research strategy 7); the others are measured options. */
export type NatusLineId = 'shipped' | 'bahamut' | 'reflect' | 'mirror';

/** Which line is live. Bailey picked `reflect` on 2026-10-10 ("ill go with all your recommendations", the recommendation being `reflect`: Bahamut alone, and Rikku Reflects Natus); the others stay as measured options. */
export const NATUS_LINE: NatusLineId = 'reflect';

/** Every line, in the order the handoff note lists them. */
export const NATUS_LINE_IDS: readonly NatusLineId[] = ['shipped', 'bahamut', 'reflect', 'mirror'];
