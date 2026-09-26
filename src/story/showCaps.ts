/**
 * How many times a named mid-battle script may play in one battle.
 *
 * **Game case: both** for the mechanism (shared mid-battle plumbing); each cap
 * says its own case.
 *
 * Some beats are not `MidBattleTrigger`s with `once: true`: an AI script emits
 * `script-trigger` with the beat's name every time its flavour slot comes up,
 * and nothing counted the showings. Chapter V's Leg does this, so Jecht's one
 * line played six times in about four minutes (PR-0194, round 12,
 * `critic/rounds/round-12/evidence/gaps/ffx2-vegnagun-shuyin-win-walk`).
 * The script means the line to be heard twice ("the line worth hearing
 * twice"), so the cap is two (the thresholds program, batch 4).
 *
 * The engine still emits the trigger and still spends the enemy's turn on it;
 * only the line stops showing past its cap.
 */

/** Script name -> the most showings in one battle. Names not listed are uncapped. */
export const MID_SCRIPT_SHOW_CAPS: Readonly<Record<string, number>> = {
  /** FFX-2 only: Chapter V, the Leg's flavour slot (`battle/ffx2/ai/vegnagun.ts`). */
  'farplane-voice': 2,
};

export interface ShowCounter {
  /** True when `name` may play now, and counts the showing; false once it is past its cap. */
  admit(name: string | undefined): boolean;
}

/** A fresh count, one per battle screen. */
export function createShowCounter(caps: Readonly<Record<string, number>> = MID_SCRIPT_SHOW_CAPS): ShowCounter {
  const shown = new Map<string, number>();
  return {
    admit(name) {
      if (name === undefined || !Object.prototype.hasOwnProperty.call(caps, name)) return true;
      const n = shown.get(name) ?? 0;
      if (n >= (caps[name] ?? Infinity)) return false;
      shown.set(name, n + 1);
      return true;
    },
  };
}
