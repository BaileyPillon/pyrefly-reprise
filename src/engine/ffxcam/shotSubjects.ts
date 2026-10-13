/**
 * **Whom a shot is for** (the hidden Fayth chapter's FFX camera; FFX only): the beat the presenter last raised, and the program that is running, decide which figures the picture must keep in frame. The tracking
 * audit and the safety net read it the same way (`./safetyNet.ts`).
 *
 * - **An action's own shot** (an action is open and a program of its own is running: an attack's side view, a cast's orbit, a spell's or a move's shot): the **actor and its targets**. The shot has lost track
 *   when none of them is in frame; the safe framing holds all of them.
 * - **The default views** (Enter, Select, Normal: the program the book answers tag 24 with), **the airship scenes**, the victory and the defeat, and **whenever no action is open**: the shot has lost track when
 *   neither the **party nor Evrae** is in frame; the safe framing holds the party (Evrae may stand 700 units off at FAR, and is nobody's to hold).
 *
 * A figure that is not on the field, or not shown (Evrae faded out in a range shift), is no subject. Pure. Game case: FFX only.
 */

/** The action that is open: its actor and its targets, by combatant id. */
export interface OpenAction {
  readonly actor: string;
  readonly targets: readonly string[];
}

/** Whom the camera must keep in frame right now. */
export interface ShotSubjects {
  /** The shot has lost track when none of these is in frame. */
  readonly watch: readonly string[];
  /** The safe framing holds each of these. */
  readonly hold: readonly string[];
  /** True for the default-view rule (the party or Evrae), false for an action's own shot. */
  readonly defaultRule: boolean;
  /** False when the shot is an action's own and its actor has no figure on the field (Cid is never drawn): the shot cannot be tracking it, and the net does not wait for it. */
  readonly actorDrawn: boolean;
  /** Who the shot is for, as a stable name: `party` for the default rule, the actor and its targets as asked (shown or not) otherwise. A figure fading in or out does not change it. */
  readonly who: string;
}

/**
 * @param open the open action, or null (nothing is open: a turn start, the close, the battle's start or end)
 * @param programId the program on the camera thread
 * @param defaultPrograms the programs that are views of the whole fight: the default view, the scenes, the victory and the defeat
 * @param party the party's combatant ids that are on the field
 * @param boss Evrae's combatant id
 * @param shown whether a combatant is on the field and drawn
 */
export function subjectsOf(open: OpenAction | null, programId: string | undefined, defaultPrograms: ReadonlySet<string>, party: readonly string[], boss: string, shown: (id: string) => boolean): ShotSubjects {
  const defaultRule = open === null || (programId !== undefined && defaultPrograms.has(programId));
  if (defaultRule) {
    const alive = party.filter(shown);
    return { watch: [...alive, ...(shown(boss) ? [boss] : [])], hold: alive, defaultRule: true, actorDrawn: true, who: 'party' };
  }
  const asked = [open.actor, ...open.targets.filter((t) => t !== open.actor)];
  const ids = asked.filter(shown);
  return { watch: ids, hold: ids, defaultRule: false, actorDrawn: shown(open.actor), who: asked.join(',') };
}
