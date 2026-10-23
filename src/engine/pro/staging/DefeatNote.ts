/**
 * WHAT ENDED THE FIGHT, for the defeat card (lane "pro-staging"; Bailey 2026-10-22: loss "quick retry" - "a caption and a retry card that keep the scene"; the card names the cause, `victory-defeat/NOTES.md` D3).
 * The presenter notes the name of the foe's latest move (`BattlePresenterStaging.noteFoeMove`) and, as the last member falls, writes it here; the flow's card (`app/screens/ProDefeatScreen.ts`) reads it once.
 * A module-level slot, like `app/demo/demoDefeat.ts`'s: the presenter and the flow are two ends of one fight and share nothing else. Pure.
 */
export interface DefeatNote {
  /** The foe's latest move, as the game names it ("Total Annihilation"); absent when none was seen. */
  cause?: string;
  /** The foe's display name, when known. */
  foe?: string;
}

let note: DefeatNote | null = null;

export function setDefeatNote(n: DefeatNote | null): void {
  note = n;
}

/** The note, once (the card takes it; a later fight starts with none). */
export function takeDefeatNote(): DefeatNote | null {
  const n = note;
  note = null;
  return n;
}
