/**
 * The special moments (D-233, Bailey 2026-09-26: option A of
 * `docs/concepts/specials-2026-09-27/`): which ability ids draw them, per game,
 * and the timing rules that differ from the ordinary spells.
 *
 * Game case, per row (rule 14):
 * - Spiral Cut is FFX only: Tidus's Overdrive, drawn in the FFX gold skin.
 * - Mega Flare is FFX-2 only: Bahamut's Chapter IV special, drawn in the FFX-2
 *   pink skin. The engine casts it as `mega-flare` (its fallback table,
 *   `battle/ffx2/abilities-core.ts`); the data table's id is
 *   `x2-bahamut-mega-flare`. FFX has a `mega-flare` too (the aeon Bahamut's
 *   Overdrive) and Isaaru's `spathi-mega-flare`: the pick does not carry over
 *   to them (the concept's README asks Bailey first), so the table is keyed by
 *   game and the FFX ids resolve as before.
 *
 * The numeral hold (a timing choice the pick left to the build, stated in
 * `docs/handoff/iter2-b3.md`): the mock lands both specials at about 1.45 s,
 * past the 0.9 s cap the ordinary spells keep. The first play of a special in
 * a battle follows the mock: the numeral waits for the landing (cap 1.5 s).
 * A repeat in the same battle starts the effect 0.35 s in, so it lands about
 * 1.1 s after the blow, inside the PR-0061 repeat budget (at most 1.2 s more
 * than today's: the slash for Spiral Cut, 0.1 s; nothing for Mega Flare).
 *
 * Pure: no `three`, no DOM.
 */

import type { PlaybackSpeed } from '../BattlePresenterPorts.ts';
import { SPEED_SCALE } from '../BattlePresenterUtil.ts';
import type { FxGame } from './SpellFxRegistry.ts';

export type SpecialFxId = 'spiral' | 'megaflare';

export const SPECIAL_FX: Readonly<Record<FxGame, Readonly<Record<string, SpecialFxId>>>> = Object.freeze({
  ffx: Object.freeze({ 'spiral-cut': 'spiral' }),
  ffx2: Object.freeze({ 'mega-flare': 'megaflare', 'x2-bahamut-mega-flare': 'megaflare' }),
  ff7: Object.freeze({}), // FF7 draws its own (ff7/ff7FxSpecs.ts)
});

/** The special this ability draws in this game, or null. */
export function specialFx(id: string | undefined, game: FxGame): SpecialFxId | null {
  if (!id) return null;
  const table = SPECIAL_FX[game];
  return Object.hasOwn(table, id) ? table[id]! : null;
}

/** The longest an ordinary spell holds its numeral (FFX-2 Holy's first strike is 550 ms in). */
export const SPELL_HOLD_CAP_MS = 900;
/** The longest a special holds its numeral: the mock's 1.45 s landing, with a little room. */
export const SPECIAL_HOLD_CAP_MS = 1500;
/** Where a special's clock starts when it plays again in the same battle. */
export const SPECIAL_REPEAT_START_S = 0.35;

/**
 * How fast the effect clock runs at a playback speed: the presenter's sleeps
 * are scaled by `SPEED_SCALE`, so the effects run at its inverse and a spell
 * still lands with its numeral under held fast-forward. `skip` shows no
 * animation; its effects run out within a frame or two.
 */
export function SPEED_RATE(speed: PlaybackSpeed): number {
  const s = SPEED_SCALE[speed];
  return s > 0 ? 1 / s : 60;
}
