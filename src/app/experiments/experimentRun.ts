/**
 * Is an experimental chapter being played right now?
 *
 * `GameFlow.runChapter` (`app/screens/BattleScreenFlow.ts`) opens a run when the chapter is `experimental` and closes it when the run ends (back on the board, on the
 * title, or an error). Anything that would otherwise leave a trace in `pyrefly-reprise:save:v1` while a run lasts asks {@link experimentRunActive} first. Today that is
 * the coach (`ui/coach/coachState.ts`): the first-run guide's steps and the first-use lines are remembered for the session only, so a hidden run never marks a hint
 * seen in the save before the player has met it in a real chapter, and the save stays byte-identical across the run (CHK-025; release 39.3's focused review, F393-05).
 *
 * In memory and never stored: a reload is outside every run. Runs nest, so a run that starts inside another cannot end it early, and the function a run
 * returns ends it once, however often it is called.
 *
 * Game case: both (shared plumbing, inert outside an experiment); its users are the hidden experiments, FF7's Guard Scorpion and FFX-2's Leblanc preview.
 */

let runs = 0;

/** An experimental chapter's run begins. Call the returned function when it ends. */
export function beginExperimentRun(): () => void {
  runs += 1;
  let open = true;
  return () => {
    if (!open) return;
    open = false;
    runs -= 1;
  };
}

/** True while any experimental chapter's run is under way. */
export function experimentRunActive(): boolean {
  return runs > 0;
}
