/**
 * A gate on the chapter music warm (`AudioManager.fetchWarm`): which cues wait, and for what (lane "r73-bytes", release 73; BOTH games, shared audio plumbing; no DOM, no `three`, no clock).
 *
 * The warm fetches a chapter's cues one after the other from the card: the scene's bed, the first fight's theme, the victory cue, the defeat cue. On a phone with a short pre-battle scene the line is
 * still busy with the last of them when the battle screen begins to enter (release 70, Chapter IV, phone10: the results cues, 1.6 MB, crossed the line inside the entry), and the entry waits for the
 * line. The app layer (`app/chapterMusicWarm.ts`) installs a gate that holds the cues the first command does not need until the phone's hold opens (`engine/LoadHold.ts`); the audio layer knows
 * nothing of the phone, the hold or the engine: it asks `warmGate(name)` before each cue and waits for the answer if there is one. No gate (a desktop, `?phonebytes=off`, every other caller) is `undefined`
 * and not even a microtask of wait.
 */

type Gate = (cue: string) => Promise<void> | undefined;

let current: Gate | null = null;

/** Install the gate of a chapter run (the newest run's gate replaces the last); returns the function that removes it, which does nothing if a newer run's gate has replaced this one. */
export function setWarmGate(gate: Gate): () => void {
  current = gate;
  return () => {
    if (current === gate) current = null;
  };
}

/** Ask before fetching `cue`: a promise to wait for, or `undefined` to go on at once. A gate that throws is no gate. */
export function warmGate(cue: string): Promise<void> | undefined {
  try {
    return current?.(cue);
  } catch {
    return undefined;
  }
}
